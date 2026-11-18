import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;

import 'generated/api.dart';
import 'generated/models.dart';
import 'poller.dart';
import 'transport.dart';

/// Version reported to the API in bootstrap (`sdk_version`).
const String clickFixVisitorVersion = 'dart-0.1.0';

/// How many [ClickFixVisitor.track] events ride along with the next message.
const int maxTrackedEvents = 20;

/// An app event recorded with [ClickFixVisitor.track].
typedef TrackedEvent = WidgetSendInputEventsItem;

/// The visitor session: the last bootstrap and the current visitor.
class VisitorSession {
  /// A session snapshot.
  const VisitorSession({this.bootstrap, this.visitor});

  /// Widget settings, team, limits and conversations of the last bootstrap.
  final WidgetBootstrap? bootstrap;

  /// Visitor (token, verification, contact); null before [ClickFixVisitor.init].
  final WidgetVisitor? visitor;
}

/// Native client of the ClickFix visitor API for one visitor.
///
/// Create it once per signed-in user (or anonymous visitor), call [init],
/// then [identify] when the user is known. Persist [token] with [onToken]
/// in your own storage to resume the session on the next start. The
/// generated operations are available as [api]; they share the token,
/// retries and session renewal of this client.
class ClickFixVisitor {
  /// A client for the widget [publicId] of the ClickFix app at [baseUrl]
  /// (the app URL plus `/api`, e.g. `https://support.example.com/api`),
  /// authenticated with the mobile app key [app].
  ///
  /// [token] resumes a persisted session; [onToken] receives every change
  /// ("" when cleared). [screen] and [language] (two letters) are reported
  /// with bootstrap and messages. Pass [transport] to replace the HTTP
  /// stack entirely (tests), or [httpClient] to reuse a `package:http`
  /// client.
  ClickFixVisitor({
    required String publicId,
    required String baseUrl,
    required ClickFixApp app,
    String token = '',
    this.onToken,
    String screen = '',
    this.language,
    http.Client? httpClient,
    WidgetTransport? transport,
    int attempts = 3,
    Duration baseDelay = const Duration(milliseconds: 250),
    String Function()? randomUuid,
  }) : _token = token,
       _screen = screen,
       _uuid = randomUuid ?? _uuidV4 {
    final inner =
        transport ??
        (_http = HttpWidgetTransport(
          baseUrl: baseUrl,
          app: app,
          token: () => _token,
          client: httpClient,
          attempts: attempts,
          baseDelay: baseDelay,
        ));
    api = WidgetApi(_RenewingTransport(inner, this), publicId: publicId);
  }

  /// Generated operations (one method per `/v1/widget/*` route).
  late final WidgetApi api;

  /// Called with every token change; "" means the visitor was reset.
  final void Function(String token)? onToken;

  /// Two-letter device language sent with bootstrap.
  final String? language;

  HttpWidgetTransport? _http;
  final String Function() _uuid;
  final _changes = StreamController<VisitorSession>.broadcast(sync: true);
  String _token;
  String _screen;
  VisitorSession _session = const VisitorSession();
  List<TrackedEvent> _events = const [];
  int _generation = 0;
  Future<void>? _renewing;

  /// The current visitor token ("" before [init]); the token the webview
  /// bridge's `clickfix:session` command takes over.
  String get token => _token;

  /// The current session.
  VisitorSession get session => _session;

  /// Every session change (bootstrap, identify, profile, reset).
  Stream<VisitorSession> get changes => _changes.stream;

  /// Pending tracked events (newest last).
  List<TrackedEvent> get pendingEvents => List.unmodifiable(_events);

  void _setToken(String next) {
    if (next == _token) return;
    _token = next;
    onToken?.call(next);
  }

  void _save(WidgetVisitor visitor, WidgetBootstrap? bootstrap) {
    _setToken(visitor.token);
    _session = VisitorSession(
      visitor: visitor,
      bootstrap: bootstrap ?? _session.bootstrap,
    );
    _changes.add(_session);
  }

  String? get _page =>
      _screen.isEmpty ? null : _screen.substring(0, min(_screen.length, 2000));

  /// Starts or resumes the visitor session (an expired token resumes the
  /// same visitor for 90 days).
  Future<WidgetBootstrap> init() async {
    final current = ++_generation;
    final lang = language;
    final out = await api.bootstrap(
      body: WidgetBootstrapInput(
        sdkVersion: clickFixVisitorVersion,
        pageUrl: _page,
        language: lang == null || lang.length < 2 ? null : lang.substring(0, 2),
      ),
      retry: true,
    );
    if (current == _generation) _save(out.visitor, out);
    return out;
  }

  Future<void> _renew() => _renewing ??= init()
      .then<void>((_) {})
      .whenComplete(() => _renewing = null);

  /// Continues a session another surface started (webview → app handover).
  void adoptToken(String next) {
    _generation++;
    _setToken(next);
    _session = const VisitorSession();
    _changes.add(_session);
  }

  /// Signs the visitor in as your user. [WidgetIdentifyInput.userHash] must
  /// come from your server (`HMAC-SHA256(identity secret, user id)`); never
  /// ship the identity secret in the app.
  Future<WidgetVisitor> identify(WidgetIdentifyInput input) async {
    final current = ++_generation;
    final out = await api.identify(body: input);
    if (current == _generation) _save(out, null);
    return out;
  }

  /// Updates name, e-mail or phone of the visitor.
  Future<WidgetVisitor> updateProfile(WidgetProfileInput input) async {
    final current = ++_generation;
    final out = await api.updateProfile(body: input);
    if (current == _generation) _save(out, null);
    return out;
  }

  /// Forgets the visitor (logout): the next [init] starts a stranger.
  void reset() {
    _generation++;
    _setToken('');
    _session = const VisitorSession();
    _events = const [];
    _changes.add(_session);
  }

  /// Records an app event; the next message carries the last
  /// [maxTrackedEvents].
  void track(String name, [Map<String, Object?>? properties]) {
    final event = TrackedEvent(
      name: name.length > 100 ? name.substring(0, 100) : name,
      at: DateTime.now().toUtc(),
      properties: properties,
    );
    final next = [..._events, event];
    _events = next.length > maxTrackedEvents
        ? next.sublist(next.length - maxTrackedEvents)
        : next;
  }

  /// Sets the screen the visitor is on (`page_url` of bootstrap and messages).
  // ignore: use_setters_to_change_properties
  void setScreen(String screen) => _screen = screen;

  /// The visitor's conversations, newest first.
  Future<List<WidgetConversation>> conversations() async =>
      (await api.listConversations()).items;

  /// Messages of [conversation], oldest first (up to 50); [after] polls for
  /// newer messages, [before] pages back through the history.
  Future<WidgetMessagePage> messages(
    String conversation, {
    String? after,
    String? before,
  }) => api.listMessages(conversation, after: after, before: before);

  /// Starts a conversation with its first message; with [file] the message
  /// is sent as `multipart/form-data`. A `client_id` is generated when
  /// missing, so the request is retried safely.
  Future<WidgetSent> createConversation(
    WidgetSendInput input, {
    WidgetFile? file,
  }) => _send(input, file, null);

  /// Adds a message to [conversation]. A closed conversation answers 409
  /// (`ClickFixApiException.status`); start a new one then.
  Future<WidgetSent> sendMessage(
    String conversation,
    WidgetSendInput input, {
    WidgetFile? file,
  }) => _send(input, file, conversation);

  Future<WidgetSent> _send(
    WidgetSendInput input,
    WidgetFile? file,
    String? conversation,
  ) async {
    final body = input.copyWith(
      clientId: input.clientId ?? _uuid(),
      pageUrl: (input.pageUrl ?? '').isEmpty ? _page : null,
      events: input.events == null && _events.isNotEmpty ? _events : null,
    );
    final WidgetSent out;
    if (file == null) {
      out = conversation == null
          ? await api.createConversation(body: body, retry: true)
          : await api.sendMessage(conversation, body: body, retry: true);
    } else {
      // The multipart form takes these fields; profile and events are
      // JSON-only.
      final fields = WidgetSendMultipart(
        text: body.text,
        clientId: body.clientId,
        name: body.name,
        email: body.email,
        pageUrl: body.pageUrl,
        phone: body.phone,
        intent: body.intent,
        departmentUuid: body.departmentUuid,
        form: switch (body.form) {
          final form? => jsonEncode(form.toJson()),
          null => null,
        },
        attributes: switch (body.attributes) {
          final attributes? => jsonEncode(attributes),
          null => null,
        },
        consent: switch (body.consent) {
          final consent? => consent ? 'true' : 'false',
          null => null,
        },
      );
      out = conversation == null
          ? await api.createConversationWithFile(
              file: file,
              fields: fields,
              retry: true,
            )
          : await api.sendMessageWithFile(
              conversation,
              file: file,
              fields: fields,
              retry: true,
            );
    }
    _events = const [];
    return out;
  }

  /// Tells the agents the visitor is typing (or stopped).
  Future<void> typing(String conversation, bool typing) async {
    await api.typing(conversation, body: TypingInput(typing: typing));
  }

  /// Marks the agent messages of [conversation] read; returns how many.
  Future<int> markRead(String conversation) async =>
      (await api.markRead(conversation, retry: true)).updated;

  /// Rates a resolved conversation ([score] 1 to 5).
  Future<WidgetRating> rate(
    String conversation,
    int score, {
    String? comment,
  }) => api.rateConversation(
    conversation,
    body: RateConversationInput(score: score, comment: comment),
  );

  /// Sets custom fields and mapped attributes of the visitor's contact
  /// (string, number or boolean values, at most 50).
  Future<WidgetAttributesResult> setAttributes(
    Map<String, Object> attributes,
  ) => api.setAttributes(
    body: WidgetAttributesInput(attributes: attributes),
    retry: true,
  );

  /// Searches the help center (latest articles without [query]).
  Future<WidgetHelp> helpSearch(String query, {String locale = 'tr'}) =>
      api.helpSearch(q: query, locale: locale);

  /// Centrifugo tokens for a realtime connection of your own (for example
  /// with `package:centrifuge`); [poll] works without one.
  Future<WidgetRealtimeToken> realtimeToken() => api.realtimeToken(retry: true);

  /// New messages of [conversation] every [interval], as a stream.
  MessagePoller poll(
    String conversation, {
    Duration interval = const Duration(seconds: 5),
    String? after,
  }) => MessagePoller(this, conversation, interval: interval, after: after);

  /// Closes the session stream and the HTTP client this client created.
  Future<void> close() async {
    _http?.close();
    await _changes.close();
  }
}

/// Bootstraps again (once, deduplicated) when the token is rejected and
/// repeats the request with the new token.
class _RenewingTransport implements WidgetTransport {
  _RenewingTransport(this.inner, this.owner);

  final WidgetTransport inner;
  final ClickFixVisitor owner;

  @override
  Future<Object?> send(WidgetRequest request) async {
    try {
      return await inner.send(request);
    } on ClickFixApiException catch (e) {
      if (!e.isTokenInvalid || request.path.endsWith('/bootstrap')) rethrow;
      final before = owner._token;
      await owner._renew();
      if (owner._token == before) rethrow;
      return inner.send(request);
    }
  }
}

final Random _random = Random.secure();

String _uuidV4() {
  final b = List<int>.generate(16, (_) => _random.nextInt(256));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  final hex = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
  return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
      '${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
}
