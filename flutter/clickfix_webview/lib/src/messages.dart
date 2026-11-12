// Bridge contract v1 (docs/webview-bridge.md): the messages exchanged between
// the app and the widget running inside the webview. This file is pure Dart
// (no Flutter import) so parsing and serialisation are unit tested without a
// webview; it mirrors frontend/widget-sdk/src/shared/bridge.ts.

import 'dart:convert';

/// Bridge contract version implemented by this package.
const int bridgeVersion = 1;

/// Name of the `webview_flutter` JavaScript channel the widget posts to
/// (`window.ClickFixFlutter.postMessage`). Fixed by the contract.
const String bridgeChannelName = 'ClickFixFlutter';

/// Largest message accepted in either direction (bytes of its JSON text).
const int maxMessageBytes = 64 * 1024;

/// Stable error codes of `clickfix:result` plus the codes this package raises
/// locally (`timeout`, `notAttached`, `disposed`).
abstract final class ClickFixErrorCode {
  /// Message text is not valid JSON.
  static const String invalidJson = 'INVALID_JSON';

  /// Message is not an object, lacks a `clickfix:` type or a required field.
  static const String invalidMessage = 'INVALID_MESSAGE';

  /// `type` is a `clickfix:` command the widget does not know.
  static const String unknownCommand = 'UNKNOWN_COMMAND';

  /// Message exceeds [maxMessageBytes].
  static const String tooLarge = 'TOO_LARGE';

  /// The command ran and failed with an error that has no stable code.
  static const String commandFailed = 'COMMAND_FAILED';

  /// Identity verification is disabled for the widget.
  static const String widgetIdentityDisabled = 'WIDGET_IDENTITY_DISABLED';

  /// `user_hash` does not match `user_id`.
  static const String widgetIdentityInvalid = 'WIDGET_IDENTITY_INVALID';

  /// The widget API rate limit was hit.
  static const String rateLimited = 'RATE_LIMITED';

  /// The widget could not reach the ClickFix API.
  static const String networkError = 'NETWORK_ERROR';

  /// Local: no `clickfix:result` arrived within the result timeout.
  static const String timeout = 'TIMEOUT';

  /// Local: the controller is not attached to a webview.
  static const String notAttached = 'NOT_ATTACHED';

  /// Local: the controller was disposed while a command was pending.
  static const String disposed = 'DISPOSED';
}

/// Error carried by a `clickfix:result` with `ok: false`, or raised locally.
///
/// Only the stable [code] is meaningful; [message] repeats it
/// (`command failed (CODE)`) and never carries message content.
class ClickFixBridgeError implements Exception {
  /// Creates an error with a stable [code].
  const ClickFixBridgeError(this.code, [String? message])
    : message = message ?? 'command failed ($code)';

  /// Stable code, see [ClickFixErrorCode].
  final String code;

  /// Human readable text; repeats the code.
  final String message;

  /// Reads `{ code, message }` from a result; unknown shapes become
  /// [ClickFixErrorCode.commandFailed].
  factory ClickFixBridgeError.fromJson(Object? json) {
    if (json is Map<String, Object?>) {
      final code = json['code'];
      if (code is String && _codeRe.hasMatch(code)) {
        final message = json['message'];
        return ClickFixBridgeError(
          code,
          message is String && message.length <= 200 ? message : null,
        );
      }
    }
    return const ClickFixBridgeError(ClickFixErrorCode.commandFailed);
  }

  static final RegExp _codeRe = RegExp(r'^[A-Z0-9_]{1,64}$');

  /// JSON form (`{ code, message }`).
  Map<String, Object?> toJson() => {'code': code, 'message': message};

  @override
  String toString() => 'ClickFixBridgeError($code)';

  @override
  bool operator ==(Object other) =>
      other is ClickFixBridgeError &&
      other.code == code &&
      other.message == message;

  @override
  int get hashCode => Object.hash(code, message);
}

/// Panel views the widget can open.
enum ClickFixView {
  /// Home tab.
  home('home'),

  /// Conversation list.
  messages('messages'),

  /// Help center.
  help('help'),

  /// New conversation composer.
  newConversation('new');

  const ClickFixView(this.value);

  /// Wire value of the view.
  final String value;

  /// Parses a wire value; `null` for unknown values.
  static ClickFixView? tryParse(String? value) {
    for (final v in values) {
      if (v.value == value) return v;
    }
    return null;
  }
}

/// Widget themes.
enum ClickFixTheme {
  /// Light theme.
  light,

  /// Dark theme.
  dark,

  /// Follows the system.
  auto,
}

/// `company` block of an identity.
class ClickFixCompany {
  /// Creates a company reference; every field is optional (≤255 chars).
  const ClickFixCompany({this.id, this.name, this.domain});

  /// Company id in your system (the company's external id). It binds the
  /// user to the company only when [ClickFixIdentity.userHash] signs it
  /// together with the user id (bridge contract 1.2); an unsigned
  /// id is ignored and [name] / [domain] stay hints.
  final String? id;

  /// Company name.
  final String? name;

  /// Company domain.
  final String? domain;

  /// JSON form; empty fields are omitted.
  Map<String, Object?> toJson() => {
    if (_present(id)) 'id': id,
    if (_present(name)) 'name': name,
    if (_present(domain)) 'domain': domain,
  };
}

/// Identity passed with `clickfix:identify`.
///
/// `userHash` is computed on **your server**; the secret never enters the
/// app. Without a company it is `hex(HMAC-SHA256(identity secret, userId))`;
/// with [company] carrying an id it is
/// `hex(HMAC-SHA256(identity secret, userId + "\n" + company.id))`, so
/// the user cannot claim another company. Neither id may contain
/// a line break.
class ClickFixIdentity {
  /// Creates an identity. [userId] (1–200 chars) and [userHash] (1–128 chars)
  /// are required; the rest is optional and trimmed to the contract limits.
  ClickFixIdentity({
    required this.userId,
    required this.userHash,
    this.name,
    this.email,
    this.phone,
    this.company,
    Map<String, Object>? attributes,
  }) : attributes = attributes == null ? null : Map.unmodifiable(attributes) {
    if (userId.isEmpty || userId.length > 200) {
      throw ArgumentError.value(
        userId.length,
        'userId',
        'must be 1-200 characters',
      );
    }
    if (userHash.isEmpty || userHash.length > 128) {
      throw ArgumentError.value(
        userHash.length,
        'userHash',
        'must be 1-128 characters',
      );
    }
  }

  /// Your user id (≤200 chars).
  final String userId;

  /// Server-computed HMAC of [userId], or of [userId] and the company id
  /// together (≤128 chars).
  final String userHash;

  /// Display name (≤255 chars).
  final String? name;

  /// E-mail (≤255 chars).
  final String? email;

  /// Phone (≤255 chars).
  final String? phone;

  /// Company reference.
  final ClickFixCompany? company;

  /// Flat attributes: only `String`, `num` and `bool` values are sent and
  /// keys longer than 100 characters are dropped, as the widget would.
  final Map<String, Object>? attributes;

  /// JSON form of the `user` field.
  Map<String, Object?> toJson() {
    final attrs = <String, Object>{};
    for (final entry in (attributes ?? const <String, Object>{}).entries) {
      final v = entry.value;
      if (entry.key.length <= 100 && (v is String || v is num || v is bool)) {
        attrs[entry.key] = v;
      }
    }
    final company = this.company?.toJson();
    return {
      'user_id': userId,
      'user_hash': userHash,
      if (_present(name)) 'name': name,
      if (_present(email)) 'email': email,
      if (_present(phone)) 'phone': phone,
      if (company != null && company.isNotEmpty) 'company': company,
      if (attrs.isNotEmpty) 'attributes': attrs,
    };
  }

  @override
  String toString() => 'ClickFixIdentity($userId)';
}

bool _present(String? v) => v != null && v.isNotEmpty && v.length <= 255;

/// App → widget command. Build one with the subclasses or the
/// `ClickFixController` helpers; [encode] gives the JSON text sent to
/// `window.ClickFixBridge.receive`.
sealed class ClickFixCommand {
  const ClickFixCommand({this.id});

  /// Optional correlation id (≤128 chars). When set the widget answers with a
  /// `clickfix:result` carrying the same id.
  final String? id;

  /// Wire `type` (`clickfix:…`).
  String get type;

  /// Command-specific fields (without `type` and `id`).
  Map<String, Object?> get fields;

  /// Full JSON form.
  Map<String, Object?> toJson() => {
    'type': type,
    if (id != null) 'id': id,
    ...fields,
  };

  /// JSON text; throws [ClickFixBridgeError] (`TOO_LARGE`) past the limit.
  String encode() {
    final text = jsonEncode(toJson());
    if (utf8.encode(text).length > maxMessageBytes) {
      throw const ClickFixBridgeError(ClickFixErrorCode.tooLarge);
    }
    return text;
  }

  /// Returns a copy of this command with [id] set.
  ClickFixCommand withId(String id);

  @override
  String toString() => 'ClickFixCommand($type${id == null ? '' : ', id=$id'})';
}

/// `clickfix:identify`.
final class ClickFixIdentifyCommand extends ClickFixCommand {
  /// Identifies the visitor.
  const ClickFixIdentifyCommand(this.user, {super.id});

  /// Identity to send.
  final ClickFixIdentity user;

  @override
  String get type => 'clickfix:identify';

  @override
  Map<String, Object?> get fields => {'user': user.toJson()};

  @override
  ClickFixIdentifyCommand withId(String id) =>
      ClickFixIdentifyCommand(user, id: id);
}

/// `clickfix:track`.
final class ClickFixTrackCommand extends ClickFixCommand {
  /// Adds an app event (≤100 char [name]) to the screen context.
  ClickFixTrackCommand(this.name, {this.properties, super.id}) {
    if (name.isEmpty || name.length > 100) {
      throw ArgumentError.value(name, 'name', 'must be 1-100 characters');
    }
  }

  /// Event name.
  final String name;

  /// Optional JSON-serialisable properties.
  final Map<String, Object?>? properties;

  @override
  String get type => 'clickfix:track';

  @override
  Map<String, Object?> get fields => {
    'name': name,
    if (properties != null) 'properties': properties,
  };

  @override
  ClickFixTrackCommand withId(String id) =>
      ClickFixTrackCommand(name, properties: properties, id: id);
}

/// `clickfix:open`.
final class ClickFixOpenCommand extends ClickFixCommand {
  /// Opens [conversation] when given, otherwise [view].
  const ClickFixOpenCommand({this.view, this.conversation, super.id});

  /// Panel view to open.
  final ClickFixView? view;

  /// Conversation UUID to open (deep link).
  final String? conversation;

  @override
  String get type => 'clickfix:open';

  @override
  Map<String, Object?> get fields => {
    if (view != null) 'view': view!.value,
    if (conversation != null) 'conversation': conversation,
  };

  @override
  ClickFixOpenCommand withId(String id) =>
      ClickFixOpenCommand(view: view, conversation: conversation, id: id);
}

/// `clickfix:close`.
final class ClickFixCloseCommand extends ClickFixCommand {
  /// Closes the panel.
  const ClickFixCloseCommand({super.id});

  @override
  String get type => 'clickfix:close';

  @override
  Map<String, Object?> get fields => const {};

  @override
  ClickFixCloseCommand withId(String id) => ClickFixCloseCommand(id: id);
}

/// `clickfix:update`.
final class ClickFixUpdateCommand extends ClickFixCommand {
  /// Updates locale, theme, profile fields or attributes.
  const ClickFixUpdateCommand(this.update, {super.id});

  /// Fields to update (`locale`, `theme`, `name`, `email`, `phone`,
  /// attributes).
  final Map<String, Object?> update;

  @override
  String get type => 'clickfix:update';

  @override
  Map<String, Object?> get fields => {'update': update};

  @override
  ClickFixUpdateCommand withId(String id) =>
      ClickFixUpdateCommand(update, id: id);
}

/// `clickfix:consent`.
final class ClickFixConsentCommand extends ClickFixCommand {
  /// Grants or revokes storage consent; `false` wipes stored data.
  const ClickFixConsentCommand(this.granted, {super.id});

  /// Whether consent was granted.
  final bool granted;

  @override
  String get type => 'clickfix:consent';

  @override
  Map<String, Object?> get fields => {'granted': granted};

  @override
  ClickFixConsentCommand withId(String id) =>
      ClickFixConsentCommand(granted, id: id);
}

/// `clickfix:reset`.
final class ClickFixResetCommand extends ClickFixCommand {
  /// Forgets the visitor (logout, account switch).
  const ClickFixResetCommand({super.id});

  @override
  String get type => 'clickfix:reset';

  @override
  Map<String, Object?> get fields => const {};

  @override
  ClickFixResetCommand withId(String id) => ClickFixResetCommand(id: id);
}

/// `clickfix:get-state`.
final class ClickFixGetStateCommand extends ClickFixCommand {
  /// Asks for the widget state; the answer is a [ClickFixState].
  const ClickFixGetStateCommand({super.id});

  @override
  String get type => 'clickfix:get-state';

  @override
  Map<String, Object?> get fields => const {};

  @override
  ClickFixGetStateCommand withId(String id) => ClickFixGetStateCommand(id: id);
}

/// Widget state returned by `clickfix:get-state` (`ClickFixState` in
/// `widget.d.ts`). Unknown fields stay reachable through [raw].
class ClickFixState {
  /// Wraps the raw state object.
  const ClickFixState(this.raw);

  /// Reads the state from a result payload.
  factory ClickFixState.fromJson(Object? json) =>
      ClickFixState(json is Map<String, Object?> ? json : const {});

  /// The object as received.
  final Map<String, Object?> raw;

  /// Whether the panel is open.
  bool get open => raw['open'] == true;

  /// Current view (`home`, `messages`, `help`, `chat`, …).
  String get view => raw['view'] as String? ?? '';

  /// Unread agent replies.
  int get unread => (raw['unread'] as num?)?.toInt() ?? 0;

  /// Whether the visitor is identified with a valid hash.
  bool get verified => raw['verified'] == true;

  /// Visitor id.
  String get visitorId => raw['visitor_id'] as String? ?? '';

  /// Open conversation, if any.
  String? get conversationUuid => raw['conversation_uuid'] as String?;

  /// Widget locale.
  String get locale => raw['locale'] as String? ?? '';

  /// Whether the widget is online.
  bool get online => raw['online'] == true;
}

/// Widget → app message.
sealed class ClickFixMessage {
  const ClickFixMessage();

  /// Wire `type`.
  String get type;
}

/// `clickfix:ready`: the widget bootstrapped; send `identify` after it.
final class ClickFixReady extends ClickFixMessage {
  /// Creates the ready handshake.
  const ClickFixReady({
    required this.bridgeVersion,
    required this.protocolVersion,
    required this.sdkVersion,
    required this.widgetId,
    required this.visitorId,
  });

  /// Bridge contract version announced by the widget.
  final int bridgeVersion;

  /// Widget protocol version.
  final int protocolVersion;

  /// Widget SDK version.
  final String sdkVersion;

  /// Public widget id.
  final String widgetId;

  /// Visitor id.
  final String visitorId;

  @override
  String get type => 'clickfix:ready';
}

/// `clickfix:event`: an SDK event (`open`, `close`, `unread`, `message`, …).
final class ClickFixEvent extends ClickFixMessage {
  /// Creates an event.
  const ClickFixEvent(this.event, this.payload);

  /// Event name.
  final String event;

  /// Event payload (shape per event, see `ClickFixEventMap`).
  final Map<String, Object?> payload;

  @override
  String get type => 'clickfix:event';
}

/// `clickfix:link`: the visitor tapped an external link; open it in the
/// system browser. The controller only forwards `https:` links (and
/// `http://localhost` in development); never hand the URL to a deep-link or
/// intent handler.
final class ClickFixLink extends ClickFixMessage {
  /// Creates a link message.
  const ClickFixLink(this.url);

  /// Link to open.
  final Uri url;

  @override
  String get type => 'clickfix:link';
}

/// `clickfix:result`: answer to a command that carried an `id`.
final class ClickFixResult extends ClickFixMessage {
  /// Creates a result.
  const ClickFixResult({
    required this.id,
    required this.ok,
    this.data,
    this.error,
  });

  /// Correlation id of the command.
  final String id;

  /// Whether the command succeeded.
  final bool ok;

  /// Result data (`get-state` returns a state object).
  final Object? data;

  /// Error when [ok] is false.
  final ClickFixBridgeError? error;

  @override
  String get type => 'clickfix:result';
}

/// A `clickfix:*` message this package does not know (a newer bridge). The
/// contract says to ignore it; it is still surfaced here for logging.
final class ClickFixUnknownMessage extends ClickFixMessage {
  /// Creates an unknown message.
  const ClickFixUnknownMessage(this.type, this.raw);

  @override
  final String type;

  /// The object as received.
  final Map<String, Object?> raw;
}

/// Parses one message posted by the widget to the `ClickFixFlutter` channel.
///
/// Throws [ClickFixBridgeError] with `TOO_LARGE`, `INVALID_JSON` or
/// `INVALID_MESSAGE`; the error never includes the message text. Known
/// types become their class, other `clickfix:` types a
/// [ClickFixUnknownMessage].
ClickFixMessage parseBridgeMessage(String raw) {
  if (raw.length > maxMessageBytes) {
    throw const ClickFixBridgeError(ClickFixErrorCode.tooLarge);
  }
  Object? data;
  try {
    data = jsonDecode(raw);
  } on FormatException {
    throw const ClickFixBridgeError(ClickFixErrorCode.invalidJson);
  }
  if (data is! Map<String, Object?>) {
    throw const ClickFixBridgeError(ClickFixErrorCode.invalidMessage);
  }
  final type = data['type'];
  if (type is! String ||
      type.isEmpty ||
      type.length > 64 ||
      !type.startsWith('clickfix:')) {
    throw const ClickFixBridgeError(ClickFixErrorCode.invalidMessage);
  }
  switch (type) {
    case 'clickfix:ready':
      return ClickFixReady(
        bridgeVersion: _int(data['bridge_version']) ?? bridgeVersion,
        protocolVersion: _int(data['protocol_version']) ?? 1,
        sdkVersion: _str(data['sdk_version']),
        widgetId: _str(data['widget_id']),
        visitorId: _str(data['visitor_id']),
      );
    case 'clickfix:event':
      final event = data['event'];
      if (event is! String || event.isEmpty || event.length > 64) {
        throw const ClickFixBridgeError(ClickFixErrorCode.invalidMessage);
      }
      final payload = data['payload'];
      return ClickFixEvent(
        event,
        payload is Map<String, Object?> ? payload : const {},
      );
    case 'clickfix:link':
      final url = data['url'];
      final uri = url is String && url.length <= 2048
          ? Uri.tryParse(url)
          : null;
      if (uri == null) {
        throw const ClickFixBridgeError(ClickFixErrorCode.invalidMessage);
      }
      return ClickFixLink(uri);
    case 'clickfix:result':
      final id = data['id'];
      final ok = data['ok'];
      if (id is! String || id.isEmpty || id.length > 128 || ok is! bool) {
        throw const ClickFixBridgeError(ClickFixErrorCode.invalidMessage);
      }
      return ClickFixResult(
        id: id,
        ok: ok,
        data: data['data'],
        error: ok ? null : ClickFixBridgeError.fromJson(data['error']),
      );
    default:
      return ClickFixUnknownMessage(type, data);
  }
}

int? _int(Object? v) => v is num ? v.toInt() : null;

String _str(Object? v) => v is String && v.length <= 256 ? v : '';
