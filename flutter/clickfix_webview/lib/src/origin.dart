// Origin rules of the bridge contract (docs/webview-bridge.md, "Güvenlik
// kuralları" 2–3): the webview loads one ClickFix origin only, navigation
// elsewhere is blocked, and external links are re-validated before the app
// opens them. Pure Dart so it is unit tested without a webview.

/// Default ClickFix origin (the hosted service).
const String defaultClickFixOrigin = 'https://getclickfix.com';

/// Path of the hosted webview shell.
const String embedPath = '/widget-embed.html';

final RegExp _widgetIdRe = RegExp(r'^[A-Za-z0-9_-]{1,128}$');
final RegExp _conversationRe = RegExp(r'^[A-Za-z0-9-]{1,64}$');
final RegExp _localeRe = RegExp(r'^[a-z]{2}$');

/// The single origin the webview may load: scheme, host and port of your
/// ClickFix installation (`https://getclickfix.com` or the app URL you were
/// given). Only `https:` is accepted; `http:` is allowed for `localhost` and
/// loopback addresses in development.
class ClickFixOrigin {
  ClickFixOrigin._(this.uri);

  /// Parses [origin]; throws [ArgumentError] when it is not a bare
  /// `https://host[:port]` origin (no path, query, fragment or user info).
  factory ClickFixOrigin(String origin) {
    final uri = Uri.tryParse(origin.trim());
    if (uri == null || !uri.hasAuthority || uri.host.isEmpty) {
      throw ArgumentError.value(origin, 'origin', 'must be scheme://host');
    }
    if (uri.userInfo.isNotEmpty ||
        uri.hasQuery ||
        uri.hasFragment ||
        (uri.path.isNotEmpty && uri.path != '/')) {
      throw ArgumentError.value(
        origin,
        'origin',
        'must not carry a path, query, fragment or user info',
      );
    }
    if (!_schemeAllowed(uri)) {
      throw ArgumentError.value(
        origin,
        'origin',
        'must be https (http only for localhost)',
      );
    }
    return ClickFixOrigin._(
      Uri(
        scheme: uri.scheme.toLowerCase(),
        host: uri.host.toLowerCase(),
        port: uri.hasPort ? uri.port : null,
      ),
    );
  }

  /// The hosted service origin.
  factory ClickFixOrigin.hosted() => ClickFixOrigin(defaultClickFixOrigin);

  /// Normalised origin (`scheme://host[:port]`).
  final Uri uri;

  /// Origin as text, without a trailing slash.
  String get value => uri.origin;

  static bool _isLoopback(String host) =>
      host == 'localhost' ||
      host.endsWith('.localhost') ||
      host == '127.0.0.1' ||
      host == '::1' ||
      host == '[::1]';

  static bool _schemeAllowed(Uri uri) {
    final scheme = uri.scheme.toLowerCase();
    if (scheme == 'https') return true;
    return scheme == 'http' && _isLoopback(uri.host.toLowerCase());
  }

  /// Whether [url] belongs to this origin (same scheme, host and port).
  /// This is the navigation rule: anything else is blocked in the webview.
  bool allows(Uri url) {
    if (!url.hasAuthority) return false;
    return url.scheme.toLowerCase() == uri.scheme &&
        url.host.toLowerCase() == uri.host &&
        url.port == uri.port;
  }

  /// [allows] for a URL string; unparsable text is not allowed.
  bool allowsString(String url) {
    final parsed = Uri.tryParse(url);
    return parsed != null && allows(parsed);
  }

  /// Whether a `clickfix:link` URL may be handed to the system browser:
  /// `https:` only. In debug builds (assertions enabled) `http://localhost`
  /// and loopback addresses are also accepted for development; release
  /// builds never are. Never pass a link to a deep-link or intent handler.
  static bool isSafeExternalLink(Uri url) {
    if (!url.hasAuthority || url.host.isEmpty) return false;
    final scheme = url.scheme.toLowerCase();
    if (scheme == 'https') return true;
    return isDebugBuild &&
        scheme == 'http' &&
        _isLoopback(url.host.toLowerCase());
  }

  /// True when assertions are enabled (Flutter debug builds), like
  /// `kDebugMode` but without a Flutter import.
  static final bool isDebugBuild = () {
    var debug = false;
    assert(() {
      debug = true;
      return true;
    }());
    return debug;
  }();

  /// Builds the `widget-embed.html` URL. [widgetId] is the public widget id
  /// (1–128 chars of `A-Z a-z 0-9 _ -`); [conversation] opens that
  /// conversation (deep link); [consent] adds `consent=1`, meaning the app
  /// already collected consent. Invalid values throw [ArgumentError].
  Uri embedUri({
    required String widgetId,
    String? locale,
    String? theme,
    String? view,
    String? conversation,
    bool consent = false,
  }) {
    if (!_widgetIdRe.hasMatch(widgetId)) {
      throw ArgumentError.value(widgetId, 'widgetId', 'invalid widget id');
    }
    if (conversation != null && !_conversationRe.hasMatch(conversation)) {
      throw ArgumentError.value(
        conversation,
        'conversation',
        'invalid conversation id',
      );
    }
    if (locale != null && !_localeRe.hasMatch(locale)) {
      throw ArgumentError.value(locale, 'locale', 'use a two-letter code');
    }
    const themes = {'light', 'dark', 'auto'};
    if (theme != null && !themes.contains(theme)) {
      throw ArgumentError.value(theme, 'theme', 'use light, dark or auto');
    }
    const views = {'home', 'messages', 'help', 'new'};
    if (view != null && !views.contains(view)) {
      throw ArgumentError.value(view, 'view', 'use home, messages, help, new');
    }
    return uri.replace(
      path: embedPath,
      queryParameters: {
        'widget': widgetId,
        'locale': ?locale,
        'theme': ?theme,
        'view': ?view,
        'conversation': ?conversation,
        if (consent) 'consent': '1',
      },
    );
  }

  @override
  String toString() => value;

  @override
  bool operator ==(Object other) => other is ClickFixOrigin && other.uri == uri;

  @override
  int get hashCode => uri.hashCode;
}
