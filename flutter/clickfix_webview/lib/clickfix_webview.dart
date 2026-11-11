/// Secure ClickFix support webview for Flutter.
///
/// Loads the hosted `widget-embed.html` page of a ClickFix installation and
/// implements the webview bridge contract v1 (`docs/webview-bridge.md` in the
/// ClickFix repository) over a `webview_flutter` JavaScript channel named
/// `ClickFixFlutter`.
///
/// Typical use:
///
/// ```dart
/// final controller = ClickFixController(widgetId: 'WIDGET_ID', locale: 'tr');
/// ClickFixWebView(
///   controller: controller,
///   onReady: (_) async {
///     final s = await api.supportSession(); // { user_id, user_hash } from your server
///     await controller.identify(ClickFixIdentity(userId: s.userId, userHash: s.userHash));
///   },
///   onLink: (link) => launchUrl(link.url, mode: LaunchMode.externalApplication),
///   onClose: () => Navigator.of(context).pop(),
/// );
/// ```
library;

export 'src/controller.dart';
export 'src/messages.dart';
export 'src/origin.dart';
export 'src/webview.dart';
