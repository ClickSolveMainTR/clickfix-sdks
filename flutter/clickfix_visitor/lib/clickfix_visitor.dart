/// Native Dart client of the ClickFix visitor (widget) API.
///
/// [ClickFixVisitor] keeps one visitor session (mobile app key, visitor
/// token, renewal, tracked events) on top of the generated [WidgetApi] and
/// models; [MessagePoller] delivers new messages without a realtime
/// connection. No UI: build your own screens, or use `clickfix_webview` for
/// the hosted widget.
library;

export 'src/client.dart';
export 'src/generated/api.dart';
export 'src/generated/models.dart';
export 'src/poller.dart';
export 'src/transport.dart';
