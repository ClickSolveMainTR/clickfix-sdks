// App side of the bridge: queues commands until the widget is ready, matches
// `clickfix:result` answers to command ids, turns widget messages into Dart
// streams and callbacks, and enforces the origin rules of the contract
// (docs/webview-bridge.md). The webview is reached through
// [ClickFixBridgeTransport] so the logic is testable with a fake.

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import 'messages.dart';
import 'origin.dart';

/// What the controller needs from a webview: run JavaScript on the page and
/// tell which URL is loaded. `ClickFixWebView` adapts `WebViewController`;
/// tests use a fake.
abstract class ClickFixBridgeTransport {
  /// Runs [javaScript] in the page.
  Future<void> runJavaScript(String javaScript);

  /// URL currently loaded, or `null` when unknown.
  Future<String?> currentUrl();
}

/// Drives the ClickFix widget inside a `ClickFixWebView`.
///
/// Create one per support screen, pass it to the widget, and use the command
/// helpers ([identify], [track], [open], …). Commands sent before the widget
/// announced `clickfix:ready` are queued and flushed on ready. Commands that
/// return a `Future` carry an `id` and complete with the widget's
/// `clickfix:result`; they throw [ClickFixBridgeError] on `ok: false`,
/// on [resultTimeout], and when the controller is disposed.
class ClickFixController {
  /// Creates a controller for the widget [widgetId] of the installation at
  /// [origin] (`https://getclickfix.com` by default). [locale], [theme],
  /// [view] and [conversation] (deep link) become query parameters of the
  /// embed page; [consent] adds `consent=1` and must be set only after the
  /// app really collected consent.
  ClickFixController({
    required this.widgetId,
    String origin = defaultClickFixOrigin,
    this.locale,
    this.theme,
    this.view,
    this.conversation,
    this.consent = false,
    this.resultTimeout = const Duration(seconds: 15),
    this.onRejectedMessage,
  }) : origin = ClickFixOrigin(origin) {
    // Validates the parameters eagerly so misuse fails at construction.
    embedUri;
  }

  /// Public widget id.
  final String widgetId;

  /// The only origin the webview may load.
  final ClickFixOrigin origin;

  /// `locale` query parameter (`tr`, `en`).
  final String? locale;

  /// Initial theme.
  final ClickFixTheme? theme;

  /// Initial view.
  final ClickFixView? view;

  /// Conversation UUID to open on load (deep link).
  final String? conversation;

  /// Whether consent was already collected by the app.
  final bool consent;

  /// How long a command with an id waits for its `clickfix:result`.
  final Duration resultTimeout;

  /// Called with the error code when an inbound message is dropped
  /// (wrong origin, too large, invalid JSON, …). The message text is never
  /// passed on. Useful for logging in development.
  final void Function(String code)? onRejectedMessage;

  /// Embed page URL built from the constructor parameters.
  Uri get embedUri => origin.embedUri(
    widgetId: widgetId,
    locale: locale,
    theme: theme?.name,
    view: view?.value,
    conversation: conversation,
    consent: consent,
  );

  final StreamController<ClickFixMessage> _messages =
      StreamController<ClickFixMessage>.broadcast();
  final Map<String, Completer<ClickFixResult>> _pending =
      <String, Completer<ClickFixResult>>{};
  final Map<String, Timer> _timers = <String, Timer>{};
  final List<ClickFixCommand> _queue = <ClickFixCommand>[];
  ClickFixBridgeTransport? _transport;
  ClickFixReady? _ready;
  Completer<ClickFixReady> _readyCompleter = Completer<ClickFixReady>();
  int _nextId = 0;
  bool _disposed = false;

  /// Every message from the widget, in order.
  Stream<ClickFixMessage> get messages => _messages.stream;

  /// `clickfix:event` messages (`open`, `close`, `unread`, `message`, …).
  Stream<ClickFixEvent> get events => messages.whereType<ClickFixEvent>();

  /// `clickfix:link` messages, already validated (`https:` only).
  Stream<ClickFixLink> get links => messages.whereType<ClickFixLink>();

  /// `clickfix:result` messages, including those matched to commands.
  Stream<ClickFixResult> get results => messages.whereType<ClickFixResult>();

  /// Completes when the widget announces `clickfix:ready` (again after a
  /// reload of the page).
  Future<ClickFixReady> get whenReady => _readyCompleter.future;

  /// The last ready handshake, `null` before the widget is up.
  ClickFixReady? get readyInfo => _ready;

  /// Whether the widget is ready to take commands.
  bool get isReady => _ready != null;

  /// Whether a webview is attached.
  bool get isAttached => _transport != null;

  /// Whether [dispose] ran.
  bool get isDisposed => _disposed;

  /// Binds the webview. Called by `ClickFixWebView`; call it yourself only
  /// when you host the page in your own `WebViewController`.
  void attach(ClickFixBridgeTransport transport) {
    _checkNotDisposed();
    _transport = transport;
  }

  /// Unbinds the webview: the widget is no longer ready, pending results
  /// fail with [ClickFixErrorCode.notAttached]. Queued commands stay queued
  /// for the next page, except `identify`: an identity must never be
  /// replayed into a page the app did not ask to identify.
  void detach() {
    _transport = null;
    _resetReady();
    _queue.removeWhere((c) => c is ClickFixIdentifyCommand);
    _failPending(ClickFixErrorCode.notAttached);
  }

  /// Entry point for the `ClickFixFlutter` JavaScript channel. Validates
  /// that the page is still on [origin], parses [raw] and dispatches it.
  /// Rejections are reported through [onRejectedMessage] by code only.
  Future<void> handleRawMessage(String raw) async {
    if (_disposed) return;
    final transport = _transport;
    if (transport == null) {
      onRejectedMessage?.call(ClickFixErrorCode.notAttached);
      return;
    }
    if (raw.length > maxMessageBytes) {
      onRejectedMessage?.call(ClickFixErrorCode.tooLarge);
      return;
    }
    String? current;
    try {
      current = await transport.currentUrl();
    } catch (_) {
      current = null;
    }
    if (current == null || !origin.allowsString(current)) {
      onRejectedMessage?.call('ORIGIN_MISMATCH');
      return;
    }
    final ClickFixMessage message;
    try {
      message = parseBridgeMessage(raw);
    } on ClickFixBridgeError catch (e) {
      onRejectedMessage?.call(e.code);
      return;
    }
    if (_disposed) return;
    _dispatch(message);
  }

  void _dispatch(ClickFixMessage message) {
    switch (message) {
      case ClickFixReady():
        if (message.bridgeVersion != bridgeVersion) {
          // The contract only breaks with a new bridge_version; report it so
          // the app can log it, then carry on best effort.
          onRejectedMessage?.call('UNSUPPORTED_BRIDGE_VERSION');
        }
        _ready = message;
        if (!_readyCompleter.isCompleted) _readyCompleter.complete(message);
        _messages.add(message);
        _flushQueue();
      case ClickFixResult():
        _pending.remove(message.id)?.complete(message);
        _messages.add(message);
      case ClickFixLink():
        if (!ClickFixOrigin.isSafeExternalLink(message.url)) {
          onRejectedMessage?.call('UNSAFE_LINK');
          return;
        }
        _messages.add(message);
      case ClickFixEvent():
        _messages.add(message);
      case ClickFixUnknownMessage():
        _messages.add(message);
    }
  }

  /// Marks the page as gone (navigation started, reload): the next
  /// `clickfix:ready` will flush queued commands again.
  void pageReset() {
    _resetReady();
  }

  void _resetReady() {
    _ready = null;
    if (_readyCompleter.isCompleted) {
      _readyCompleter = Completer<ClickFixReady>();
    }
  }

  /// Sends a raw [command]. Without an id the future completes when the
  /// command was queued or handed to the page; with an id it completes with
  /// the widget's [ClickFixResult] (whatever `ok` is), or with an `ok:
  /// false` result carrying [ClickFixErrorCode.timeout] when no answer
  /// arrives within [resultTimeout] of the command reaching the page (the
  /// clock starts at delivery, not while the command waits for `ready`).
  Future<ClickFixResult?> send(ClickFixCommand command) {
    _checkNotDisposed();
    final id = command.id;
    Future<ClickFixResult>? result;
    if (id != null) {
      final completer = Completer<ClickFixResult>();
      _pending[id] = completer;
      result = completer.future.whenComplete(() => _forget(id));
    }
    if (!isReady || _transport == null) {
      _queue.add(command);
      return result ?? Future<ClickFixResult?>.value();
    }
    final sent = _deliver(command);
    if (result != null) return result;
    return sent.then((_) => null);
  }

  Future<ClickFixResult> _sendExpectingResult(ClickFixCommand command) async {
    final result = (await send(command.withId(_newId())))!;
    if (!result.ok) {
      throw result.error ??
          const ClickFixBridgeError(ClickFixErrorCode.commandFailed);
    }
    return result;
  }

  /// `clickfix:identify`: hands the session to the widget. Send it after
  /// [whenReady] (sending earlier queues it). Throws [ClickFixBridgeError]
  /// (`WIDGET_IDENTITY_INVALID`, `WIDGET_IDENTITY_DISABLED`, …) when the
  /// widget rejects the identity; the visitor then stays anonymous.
  Future<void> identify(ClickFixIdentity user) =>
      _sendExpectingResult(ClickFixIdentifyCommand(user));

  /// `clickfix:track`: adds an app event to the screen context.
  Future<void> track(String name, {Map<String, Object?>? properties}) =>
      _sendExpectingResult(ClickFixTrackCommand(name, properties: properties));

  /// `clickfix:open`: opens [conversation] when given, otherwise [view].
  Future<void> open({ClickFixView? view, String? conversation}) =>
      _sendExpectingResult(
        ClickFixOpenCommand(view: view, conversation: conversation),
      );

  /// `clickfix:close`: closes the panel.
  Future<void> close() => _sendExpectingResult(const ClickFixCloseCommand());

  /// `clickfix:update`: changes locale, theme, profile fields or attributes.
  Future<void> update(Map<String, Object?> update) =>
      _sendExpectingResult(ClickFixUpdateCommand(update));

  /// `clickfix:consent`: grants or revokes consent; `false` wipes storage.
  Future<void> setConsent(bool granted) =>
      _sendExpectingResult(ClickFixConsentCommand(granted));

  /// `clickfix:reset`: forgets the visitor (logout, account switch).
  Future<void> reset() => _sendExpectingResult(const ClickFixResetCommand());

  /// `clickfix:get-state`: reads the widget state.
  Future<ClickFixState> getState() async {
    final result = await _sendExpectingResult(const ClickFixGetStateCommand());
    return ClickFixState.fromJson(result.data);
  }

  String _newId() => 'f${++_nextId}';

  void _flushQueue() {
    if (_queue.isEmpty) return;
    final queued = List<ClickFixCommand>.of(_queue);
    _queue.clear();
    for (final command in queued) {
      unawaited(_deliver(command));
    }
  }

  Future<void> _deliver(ClickFixCommand command) async {
    final transport = _transport;
    if (transport == null) {
      _queue.add(command);
      return;
    }
    final String text;
    try {
      text = command.encode();
    } on ClickFixBridgeError catch (e) {
      final id = command.id;
      if (id != null) {
        _pending
            .remove(id)
            ?.complete(ClickFixResult(id: id, ok: false, error: e));
      }
      return;
    }
    try {
      await transport.runJavaScript(bridgeReceiveScript(text));
      final id = command.id;
      if (id != null && _pending.containsKey(id)) {
        _timers[id]?.cancel();
        _timers[id] = Timer(resultTimeout, () {
          _timers.remove(id);
          _pending
              .remove(id)
              ?.complete(
                ClickFixResult(
                  id: id,
                  ok: false,
                  error: const ClickFixBridgeError(ClickFixErrorCode.timeout),
                ),
              );
        });
      }
    } catch (e, st) {
      final id = command.id;
      if (id != null) {
        _pending
            .remove(id)
            ?.complete(
              ClickFixResult(
                id: id,
                ok: false,
                error: const ClickFixBridgeError(
                  ClickFixErrorCode.commandFailed,
                ),
              ),
            );
      }
      // The platform exception may quote the script, i.e. the command
      // (user_id, user_hash): report a sanitised error, never the original.
      FlutterError.reportError(
        FlutterErrorDetails(
          exception: StateError('runJavaScript failed (${e.runtimeType})'),
          stack: st,
          library: 'clickfix_webview',
          context: ErrorDescription('while delivering ${command.type}'),
        ),
      );
    }
  }

  /// JavaScript that hands [commandJson] to the page's bridge
  /// (`window.ClickFixBridge.receive`). The JSON text is embedded as a string
  /// literal so the page parses it; nothing is interpolated as code.
  static String bridgeReceiveScript(String commandJson) =>
      'window.ClickFixBridge && window.ClickFixBridge.receive('
      '${jsonEncode(commandJson)});';

  void _forget(String id) {
    _pending.remove(id);
    _timers.remove(id)?.cancel();
  }

  void _failPending(String code) {
    final pending = List<MapEntry<String, Completer<ClickFixResult>>>.of(
      _pending.entries,
    );
    _pending.clear();
    for (final timer in _timers.values) {
      timer.cancel();
    }
    _timers.clear();
    for (final entry in pending) {
      if (!entry.value.isCompleted) {
        entry.value.complete(
          ClickFixResult(
            id: entry.key,
            ok: false,
            error: ClickFixBridgeError(code),
          ),
        );
      }
    }
  }

  void _checkNotDisposed() {
    if (_disposed) {
      throw StateError('ClickFixController was disposed');
    }
  }

  /// Releases the streams; pending commands fail with
  /// [ClickFixErrorCode.disposed].
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _transport = null;
    _queue.clear();
    _failPending(ClickFixErrorCode.disposed);
    _messages.close();
  }
}

extension<T> on Stream<T> {
  Stream<S> whereType<S>() => where((e) => e is S).map((e) => e as S);
}
