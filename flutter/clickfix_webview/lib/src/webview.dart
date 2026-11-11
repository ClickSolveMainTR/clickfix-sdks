// The Flutter widget: a `webview_flutter` WebViewWidget locked to the
// configured ClickFix origin, with the `ClickFixFlutter` JavaScript channel
// of the bridge contract wired to a [ClickFixController].

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import 'controller.dart';
import 'messages.dart';

/// Adapts a [WebViewController] to the controller's transport interface.
class WebViewBridgeTransport implements ClickFixBridgeTransport {
  /// Wraps [webView].
  const WebViewBridgeTransport(this.webView);

  /// The wrapped controller.
  final WebViewController webView;

  @override
  Future<void> runJavaScript(String javaScript) =>
      webView.runJavaScript(javaScript);

  @override
  Future<String?> currentUrl() => webView.currentUrl();
}

/// Full-screen ClickFix support webview.
///
/// Loads `widget-embed.html` of the controller's origin, blocks navigation
/// to any other origin, registers the `ClickFixFlutter` channel and routes
/// widget messages to [controller] and the callbacks. Place it inside a
/// `Scaffold` (or any sized box); it fills the available space.
class ClickFixWebView extends StatefulWidget {
  /// Creates the webview for [controller].
  const ClickFixWebView({
    super.key,
    required this.controller,
    this.onReady,
    this.onEvent,
    this.onLink,
    this.onClose,
    this.onUnread,
    this.onPageFinished,
    this.onWebResourceError,
    this.backgroundColor = Colors.transparent,
    this.userAgentSuffix,
  });

  /// Bridge controller; one per screen.
  final ClickFixController controller;

  /// The widget is ready: hand over the session with
  /// [ClickFixController.identify] here.
  final void Function(ClickFixReady ready)? onReady;

  /// Every `clickfix:event`.
  final void Function(ClickFixEvent event)? onEvent;

  /// An external link to open in the system browser (already validated:
  /// `https:` only). Never give it to a deep-link or intent handler.
  final void Function(ClickFixLink link)? onLink;

  /// The visitor closed the panel: pop the support screen.
  final VoidCallback? onClose;

  /// Unread agent replies changed (badge).
  final void Function(int count)? onUnread;

  /// The embed page finished loading.
  final void Function(String url)? onPageFinished;

  /// A resource failed to load.
  final void Function(WebResourceError error)? onWebResourceError;

  /// Webview background; transparent by default so the app's background
  /// shows while the page loads.
  final Color backgroundColor;

  /// Appended to the default user agent (for example `MyApp/1.2`).
  final String? userAgentSuffix;

  @override
  State<ClickFixWebView> createState() => _ClickFixWebViewState();
}

class _ClickFixWebViewState extends State<ClickFixWebView> {
  late final WebViewController _webView;
  StreamSubscription<ClickFixMessage>? _messages;

  @override
  void initState() {
    super.initState();
    _webView = createWebViewController(
      controller: widget.controller,
      backgroundColor: widget.backgroundColor,
      userAgentSuffix: widget.userAgentSuffix,
      onPageFinished: (url) => widget.onPageFinished?.call(url),
      onWebResourceError: (error) => widget.onWebResourceError?.call(error),
    );
    _messages = widget.controller.messages.listen(_onMessage);
    _webView.loadRequest(widget.controller.embedUri);
  }

  void _onMessage(ClickFixMessage message) {
    if (!mounted) return;
    switch (message) {
      case ClickFixReady():
        widget.onReady?.call(message);
      case ClickFixEvent():
        widget.onEvent?.call(message);
        if (message.event == 'close') widget.onClose?.call();
        if (message.event == 'unread') {
          final count = message.payload['count'];
          if (count is num) widget.onUnread?.call(count.toInt());
        }
      case ClickFixLink():
        widget.onLink?.call(message);
      case ClickFixResult():
      case ClickFixUnknownMessage():
        break;
    }
  }

  @override
  void dispose() {
    _messages?.cancel();
    widget.controller.detach();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => WebViewWidget(controller: _webView);
}

/// Builds the locked-down [WebViewController] used by [ClickFixWebView] and
/// attaches it to [controller]. Exposed for apps that need to host the page
/// in their own widget tree: JavaScript on, navigation limited to the
/// controller's origin, the `ClickFixFlutter` channel registered, file and
/// content access off on Android. Call `loadRequest(controller.embedUri)`
/// on the result.
WebViewController createWebViewController({
  required ClickFixController controller,
  Color backgroundColor = Colors.transparent,
  String? userAgentSuffix,
  void Function(String url)? onPageFinished,
  void Function(WebResourceError error)? onWebResourceError,
}) {
  final webView = WebViewController();
  final origin = controller.origin;
  webView
    ..setJavaScriptMode(JavaScriptMode.unrestricted)
    ..setBackgroundColor(backgroundColor)
    ..setNavigationDelegate(
      NavigationDelegate(
        onNavigationRequest: (request) => origin.allowsString(request.url)
            ? NavigationDecision.navigate
            : NavigationDecision.prevent,
        onPageStarted: (_) => controller.pageReset(),
        onPageFinished: onPageFinished,
        onWebResourceError: onWebResourceError,
      ),
    )
    ..addJavaScriptChannel(
      bridgeChannelName,
      onMessageReceived: (message) =>
          controller.handleRawMessage(message.message),
    );
  if (userAgentSuffix != null && userAgentSuffix.isNotEmpty) {
    webView.getUserAgent().then((ua) {
      final base = ua ?? '';
      webView.setUserAgent('$base $userAgentSuffix'.trim());
    });
  }
  final platform = webView.platform;
  if (platform is AndroidWebViewController) {
    platform
      ..setAllowFileAccess(false)
      ..setAllowContentAccess(false)
      ..setMixedContentMode(MixedContentMode.neverAllow);
  }
  controller.attach(WebViewBridgeTransport(webView));
  return webView;
}
