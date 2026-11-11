import 'dart:convert';

import 'package:clickfix_webview/clickfix_webview.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:webview_flutter_platform_interface/webview_flutter_platform_interface.dart';

/// Fake `webview_flutter` platform: no native view, records what the widget
/// configured and lets the test post messages on the JavaScript channel.
class FakeWebViewPlatform extends WebViewPlatform {
  final List<FakePlatformWebViewController> controllers = [];

  @override
  PlatformWebViewController createPlatformWebViewController(
    PlatformWebViewControllerCreationParams params,
  ) {
    final controller = FakePlatformWebViewController(params);
    controllers.add(controller);
    return controller;
  }

  @override
  PlatformNavigationDelegate createPlatformNavigationDelegate(
    PlatformNavigationDelegateCreationParams params,
  ) => FakePlatformNavigationDelegate(params);

  @override
  PlatformWebViewWidget createPlatformWebViewWidget(
    PlatformWebViewWidgetCreationParams params,
  ) => FakePlatformWebViewWidget(params);
}

class FakePlatformWebViewController extends PlatformWebViewController {
  FakePlatformWebViewController(super.params) : super.implementation();

  final Map<String, JavaScriptChannelParams> channels = {};
  final List<LoadRequestParams> loads = [];
  final List<String> scripts = [];
  JavaScriptMode? javaScriptMode;
  Color? backgroundColor;
  FakePlatformNavigationDelegate? navigationDelegate;
  String? url;

  @override
  Future<void> setJavaScriptMode(JavaScriptMode javaScriptMode) async {
    this.javaScriptMode = javaScriptMode;
  }

  @override
  Future<void> setBackgroundColor(Color color) async {
    backgroundColor = color;
  }

  @override
  Future<void> setPlatformNavigationDelegate(
    PlatformNavigationDelegate handler,
  ) async {
    navigationDelegate = handler as FakePlatformNavigationDelegate;
  }

  @override
  Future<void> addJavaScriptChannel(
    JavaScriptChannelParams javaScriptChannelParams,
  ) async {
    channels[javaScriptChannelParams.name] = javaScriptChannelParams;
  }

  @override
  Future<void> loadRequest(LoadRequestParams params) async {
    loads.add(params);
    url = params.uri.toString();
  }

  @override
  Future<String?> currentUrl() async => url;

  @override
  Future<void> runJavaScript(String javaScript) async {
    scripts.add(javaScript);
  }

  @override
  Future<String?> getUserAgent() async => 'Fake/1.0';

  @override
  Future<void> setUserAgent(String? userAgent) async {}

  /// What the page would do: `window.ClickFixFlutter.postMessage(json)`.
  void postFromPage(Object message) {
    channels[bridgeChannelName]!.onMessageReceived(
      JavaScriptMessage(
        message: message is String ? message : jsonEncode(message),
      ),
    );
  }

  /// The last command handed to `window.ClickFixBridge.receive`.
  Map<String, Object?> lastCommand() {
    final m = RegExp(
      r'receive\((.*)\);$',
      dotAll: true,
    ).firstMatch(scripts.last)!;
    return jsonDecode(jsonDecode(m.group(1)!) as String)
        as Map<String, Object?>;
  }
}

class FakePlatformNavigationDelegate extends PlatformNavigationDelegate {
  FakePlatformNavigationDelegate(super.params) : super.implementation();

  NavigationRequestCallback? onNavigationRequest;
  PageEventCallback? onPageStarted;
  PageEventCallback? onPageFinished;
  WebResourceErrorCallback? onWebResourceError;

  @override
  Future<void> setOnNavigationRequest(
    NavigationRequestCallback onNavigationRequest,
  ) async {
    this.onNavigationRequest = onNavigationRequest;
  }

  @override
  Future<void> setOnPageStarted(PageEventCallback onPageStarted) async {
    this.onPageStarted = onPageStarted;
  }

  @override
  Future<void> setOnPageFinished(PageEventCallback onPageFinished) async {
    this.onPageFinished = onPageFinished;
  }

  @override
  Future<void> setOnProgress(ProgressCallback onProgress) async {}

  @override
  Future<void> setOnHttpError(HttpResponseErrorCallback onHttpError) async {}

  @override
  Future<void> setOnWebResourceError(
    WebResourceErrorCallback onWebResourceError,
  ) async {
    this.onWebResourceError = onWebResourceError;
  }

  @override
  Future<void> setOnUrlChange(UrlChangeCallback onUrlChange) async {}

  @override
  Future<void> setOnHttpAuthRequest(
    HttpAuthRequestCallback onHttpAuthRequest,
  ) async {}

  @override
  Future<void> setOnSSlAuthError(SslAuthErrorCallback onSslAuthError) async {}
}

class FakePlatformWebViewWidget extends PlatformWebViewWidget {
  FakePlatformWebViewWidget(super.params) : super.implementation();

  @override
  Widget build(BuildContext context) =>
      const SizedBox.expand(key: Key('fake-webview'));
}

const Map<String, Object> readyMessage = {
  'type': 'clickfix:ready',
  'bridge_version': 1,
  'protocol_version': 1,
  'sdk_version': '1.0.0',
  'widget_id': 'w1',
  'visitor_id': 'v1',
};

void main() {
  late FakeWebViewPlatform platform;

  setUp(() {
    platform = FakeWebViewPlatform();
    WebViewPlatform.instance = platform;
  });

  testWidgets(
    'loads the embed page, registers the channel and locks navigation',
    (tester) async {
      final controller = ClickFixController(
        widgetId: 'w1',
        locale: 'tr',
        conversation: 'c-1',
      );
      await tester.pumpWidget(
        MaterialApp(home: ClickFixWebView(controller: controller)),
      );
      expect(find.byKey(const Key('fake-webview')), findsOneWidget);

      final native = platform.controllers.single;
      expect(native.javaScriptMode, JavaScriptMode.unrestricted);
      expect(native.backgroundColor, Colors.transparent);
      expect(native.channels.keys, [bridgeChannelName]);
      expect(
        native.loads.single.uri.toString(),
        'https://getclickfix.com/widget-embed.html?widget=w1&locale=tr&conversation=c-1',
      );
      expect(controller.isAttached, isTrue);

      final decide = native.navigationDelegate!.onNavigationRequest!;
      Future<NavigationDecision> go(String url) async =>
          decide(NavigationRequest(url: url, isMainFrame: true));
      expect(
        await go('https://getclickfix.com/widget-embed.html?widget=w1'),
        NavigationDecision.navigate,
      );
      expect(
        await go('https://getclickfix.com/help/article'),
        NavigationDecision.navigate,
      );
      expect(await go('https://evil.example/'), NavigationDecision.prevent);
      expect(await go('http://getclickfix.com/'), NavigationDecision.prevent);
      expect(await go('myapp://support'), NavigationDecision.prevent);
      expect(await go('javascript:alert(1)'), NavigationDecision.prevent);

      await tester.pumpWidget(const SizedBox());
      expect(controller.isAttached, isFalse);
      controller.dispose();
    },
  );

  testWidgets('routes bridge messages to callbacks and commands to the page', (
    tester,
  ) async {
    final controller = ClickFixController(widgetId: 'w1');
    ClickFixReady? ready;
    final events = <String>[];
    final links = <Uri>[];
    var closed = 0;
    int? unread;
    await tester.pumpWidget(
      MaterialApp(
        home: ClickFixWebView(
          controller: controller,
          onReady: (r) {
            ready = r;
            controller.identify(
              ClickFixIdentity(userId: '1001', userHash: 'h'),
            );
          },
          onEvent: (e) => events.add(e.event),
          onLink: (l) => links.add(l.url),
          onClose: () => closed++,
          onUnread: (n) => unread = n,
        ),
      ),
    );
    final native = platform.controllers.single;

    native.postFromPage(readyMessage);
    await tester.pump();
    expect(ready?.visitorId, 'v1');
    expect(controller.isReady, isTrue);
    final identify = native.lastCommand();
    expect(identify['type'], 'clickfix:identify');
    expect(identify['user'], {'user_id': '1001', 'user_hash': 'h'});

    native.postFromPage({
      'type': 'clickfix:result',
      'id': identify['id'],
      'ok': true,
    });
    native.postFromPage({
      'type': 'clickfix:event',
      'event': 'unread',
      'payload': {'count': 5},
    });
    native.postFromPage({
      'type': 'clickfix:link',
      'url': 'https://example.com/kb/1',
    });
    native.postFromPage({'type': 'clickfix:link', 'url': 'myapp://steal'});
    native.postFromPage({
      'type': 'clickfix:event',
      'event': 'close',
      'payload': <String, Object?>{},
    });
    native.postFromPage('garbage');
    await tester.pump();

    expect(events, ['unread', 'close']);
    expect(unread, 5);
    expect(links, [Uri.parse('https://example.com/kb/1')]);
    expect(closed, 1);

    await tester.pumpWidget(const SizedBox());
    controller.dispose();
  });

  testWidgets('channel messages are dropped once the page left the origin', (
    tester,
  ) async {
    final rejected = <String>[];
    final controller = ClickFixController(
      widgetId: 'w1',
      onRejectedMessage: rejected.add,
    );
    await tester.pumpWidget(
      MaterialApp(home: ClickFixWebView(controller: controller)),
    );
    final native = platform.controllers.single;

    native.url = 'https://evil.example/page';
    native.postFromPage(readyMessage);
    await tester.pump();
    expect(controller.isReady, isFalse);
    expect(rejected, ['ORIGIN_MISMATCH']);

    await tester.pumpWidget(const SizedBox());
    controller.dispose();
  });

  testWidgets('a new page load waits for ready again', (tester) async {
    final controller = ClickFixController(widgetId: 'w1');
    await tester.pumpWidget(
      MaterialApp(home: ClickFixWebView(controller: controller)),
    );
    final native = platform.controllers.single;
    native.postFromPage(readyMessage);
    await tester.pump();
    expect(controller.isReady, isTrue);

    native.navigationDelegate!.onPageStarted!(
      'https://getclickfix.com/widget-embed.html?widget=w1',
    );
    expect(controller.isReady, isFalse);
    controller.send(const ClickFixCloseCommand());
    expect(native.scripts, isEmpty);
    native.postFromPage(readyMessage);
    await tester.pump();
    expect(native.lastCommand()['type'], 'clickfix:close');

    await tester.pumpWidget(const SizedBox());
    controller.dispose();
  });
}
