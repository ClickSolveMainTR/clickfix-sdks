import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' show MediaType;

/// Code of a 401 whose visitor token is missing, expired or foreign.
const String widgetTokenInvalid = 'WIDGET_VISITOR_TOKEN_INVALID';

/// Statuses a retryable request is repeated on.
const List<int> retryStatuses = [429, 502, 503, 504];

/// A file sent with a message or a diagnostic (`multipart/form-data`).
class WidgetFile {
  /// A file of [bytes] named [filename]; [contentType] such as `image/png`.
  const WidgetFile({
    required this.bytes,
    required this.filename,
    this.contentType,
  });

  /// File content.
  final List<int> bytes;

  /// File name shown to the agent.
  final String filename;

  /// MIME type; the server sniffs the content when it is missing.
  final String? contentType;
}

/// One visitor API call, as built by `WidgetApi`.
class WidgetRequest {
  /// A request to [path] (`/v1/widget/<public id>/...`).
  const WidgetRequest({
    required this.method,
    required this.path,
    this.query = const {},
    this.json,
    this.fields,
    this.file,
    this.fileField = 'file',
    this.retry = false,
  });

  /// HTTP method.
  final String method;

  /// Path below the API prefix, already encoded.
  final String path;

  /// Query parameters.
  final Map<String, String> query;

  /// JSON body (null: no body).
  final Map<String, Object?>? json;

  /// Text fields of a multipart body; set together with [file].
  final Map<String, String>? fields;

  /// File of a multipart body.
  final WidgetFile? file;

  /// Form field name of [file].
  final String fileField;

  /// Whether the request may be repeated (idempotent): on network errors and
  /// on [retryStatuses].
  final bool retry;
}

/// Sends [WidgetRequest]s and returns the `data` of the response envelope.
///
/// [HttpWidgetTransport] is the implementation for apps; tests and custom
/// stacks may provide their own.
abstract interface class WidgetTransport {
  /// Sends [request]; returns the envelope's `data` or throws
  /// [ClickFixApiException] for an error response.
  Future<Object?> send(WidgetRequest request);
}

/// An error response of the visitor API (`{success: false, error}`).
class ClickFixApiException implements Exception {
  /// An error with HTTP [status] and machine-readable [code].
  const ClickFixApiException(
    this.status,
    this.code, {
    this.message = '',
    this.requestId,
    this.details = const [],
  });

  /// HTTP status.
  final int status;

  /// Error code such as `VALIDATION_ERROR` or [widgetTokenInvalid];
  /// `HTTP_ERROR` when the response had no error body.
  final String code;

  /// Human-readable message (English).
  final String message;

  /// `meta.request_id` or the `X-Request-ID` header; quote it to support.
  final String? requestId;

  /// Field errors of a validation failure (`{field, message}` objects).
  final List<Map<String, Object?>> details;

  /// The visitor token was rejected; a new session must be bootstrapped.
  bool get isTokenInvalid => status == 401 && code == widgetTokenInvalid;

  @override
  String toString() =>
      'ClickFixApiException($status $code${message.isEmpty ? '' : ': $message'}'
      '${requestId == null ? '' : ', request $requestId'})';
}

/// The mobile app key of the widget (Web widget → Advanced → Mobile apps).
class ClickFixApp {
  /// The [key] created for the app with id [packageName].
  const ClickFixApp({required this.key, required this.packageName});

  /// Mobile app key; sent as `X-ClickFix-App-Key`.
  final String key;

  /// Bundle id (iOS) or application id (Android); sent as
  /// `X-ClickFix-App-Package`.
  final String packageName;
}

/// [WidgetTransport] over `package:http`: absolute base URL, mobile app key,
/// visitor bearer token, bounded retries with exponential backoff and
/// `Retry-After`, redirects refused.
class HttpWidgetTransport implements WidgetTransport {
  /// A transport for the ClickFix app at [baseUrl] (the app URL plus `/api`,
  /// e.g. `https://support.example.com/api`).
  ///
  /// [token] returns the current visitor token ("" before bootstrap).
  /// [attempts] is the total for retryable requests (1 to 5, default 3).
  /// [client] is closed by [close] only when this transport created it.
  HttpWidgetTransport({
    required String baseUrl,
    required this.app,
    required this.token,
    http.Client? client,
    int attempts = 3,
    this.baseDelay = const Duration(milliseconds: 250),
    this.timeout = const Duration(seconds: 30),
    Future<void> Function(Duration)? sleep,
  }) : baseUrl = _absolute(baseUrl),
       attempts = attempts.clamp(1, 5),
       _client = client ?? http.Client(),
       _ownsClient = client == null,
       _sleep = sleep ?? Future<void>.delayed {
    if (app.key.isEmpty || app.packageName.isEmpty) {
      throw ArgumentError('app.key and app.packageName are required');
    }
  }

  /// API prefix without a trailing slash.
  final String baseUrl;

  /// Mobile app identity sent with every request.
  final ClickFixApp app;

  /// Current visitor token.
  final String Function() token;

  /// Total attempts of a retryable request.
  final int attempts;

  /// First backoff delay; doubles per attempt, at most 30 seconds.
  final Duration baseDelay;

  /// Per-attempt timeout.
  final Duration timeout;

  final http.Client _client;
  final bool _ownsClient;
  final Future<void> Function(Duration) _sleep;

  static const _maxDelay = Duration(seconds: 30);

  static String _absolute(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null ||
        !(uri.isScheme('https') || uri.isScheme('http')) ||
        uri.host.isEmpty) {
      throw ArgumentError.value(
        url,
        'baseUrl',
        'must be an absolute URL such as https://support.example.com/api',
      );
    }
    return url.replaceFirst(RegExp(r'/+$'), '');
  }

  @override
  Future<Object?> send(WidgetRequest request) async {
    final limit = request.retry ? attempts : 1;
    for (var attempt = 0; ; attempt++) {
      final backoff = _backoff(attempt);
      http.Response res;
      try {
        res = await http.Response.fromStream(
          await _client.send(_build(request)).timeout(timeout),
        ).timeout(timeout);
      } on Exception {
        // Offline, DNS, TLS or a timeout: the request may not have arrived.
        if (attempt + 1 >= limit) rethrow;
        await _sleep(backoff);
        continue;
      }
      final body = _decode(res.body);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return body is Map<String, Object?> ? body['data'] : null;
      }
      if (retryStatuses.contains(res.statusCode) && attempt + 1 < limit) {
        await _sleep(_retryAfter(res.headers['retry-after']) ?? backoff);
        continue;
      }
      throw _error(res, body);
    }
  }

  http.BaseRequest _build(WidgetRequest r) {
    var uri = Uri.parse('$baseUrl${r.path}');
    if (r.query.isNotEmpty) uri = uri.replace(queryParameters: r.query);
    final http.BaseRequest req;
    if (r.file case final file?) {
      final form = http.MultipartRequest(r.method, uri)
        ..fields.addAll(r.fields ?? const {})
        ..files.add(
          http.MultipartFile.fromBytes(
            r.fileField,
            file.bytes,
            filename: file.filename,
            contentType: switch (file.contentType) {
              final type? => MediaType.parse(type),
              null => null,
            },
          ),
        );
      req = form;
    } else {
      final plain = http.Request(r.method, uri);
      if (r.json case final json?) {
        plain.headers['Content-Type'] = 'application/json';
        plain.body = jsonEncode(json);
      }
      req = plain;
    }
    req
      ..followRedirects = false
      ..headers['Accept'] = 'application/json'
      ..headers['X-ClickFix-App-Key'] = app.key
      ..headers['X-ClickFix-App-Package'] = app.packageName;
    final current = token();
    if (current.isNotEmpty) req.headers['Authorization'] = 'Bearer $current';
    return req;
  }

  Duration _backoff(int attempt) {
    final ms = baseDelay.inMilliseconds * (1 << attempt.clamp(0, 16));
    return ms > _maxDelay.inMilliseconds
        ? _maxDelay
        : Duration(milliseconds: ms);
  }

  static Duration? _retryAfter(String? value) {
    final seconds = int.tryParse(value?.trim() ?? '');
    if (seconds == null || seconds < 0) return null;
    final wait = Duration(seconds: seconds);
    return wait > _maxDelay ? _maxDelay : wait;
  }

  static Object? _decode(String body) {
    if (body.isEmpty) return null;
    try {
      return jsonDecode(body);
    } on FormatException {
      return null;
    }
  }

  static ClickFixApiException _error(http.Response res, Object? body) {
    final json = body is Map<String, Object?>
        ? body
        : const <String, Object?>{};
    final error = json['error'] is Map<String, Object?>
        ? json['error']! as Map<String, Object?>
        : const <String, Object?>{};
    final meta = json['meta'] is Map<String, Object?>
        ? json['meta']! as Map<String, Object?>
        : const <String, Object?>{};
    final details = error['details'];
    return ClickFixApiException(
      res.statusCode,
      error['code'] is String ? error['code']! as String : 'HTTP_ERROR',
      message: error['message'] is String ? error['message']! as String : '',
      requestId: meta['request_id'] is String
          ? meta['request_id']! as String
          : res.headers['x-request-id'],
      details: details is List<Object?>
          ? [for (final d in details) ?(d is Map<String, Object?> ? d : null)]
          : const [],
    );
  }

  /// Closes the HTTP client when this transport created it.
  void close() {
    if (_ownsClient) _client.close();
  }
}
