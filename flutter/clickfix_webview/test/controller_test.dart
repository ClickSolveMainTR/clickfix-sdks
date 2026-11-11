import 'dart:async';
import 'dart:convert';

import 'package:clickfix_webview/clickfix_webview.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

/// Records the JavaScript handed to the page and answers commands with
/// `clickfix:result` like the widget would.
class FakeTransport implements ClickFixBridgeTransport {
  FakeTransport(this.controller, {this.url});

  final ClickFixController controller;
  String? url;
  final List<Map<String, Object?>> commands = [];
  final List<String> scripts = [];
  bool autoReply = true;
  Object? replyData;
  ClickFixBridgeError? replyError;
  Object? throwOnRun;

  @override
  Future<String?> currentUrl() async => url;

  @override
  Future<void> runJavaScript(String javaScript) async {
    if (throwOnRun != null) throw throwOnRun!;
    scripts.add(javaScript);
    final m = RegExp(
      r'^window\.ClickFixBridge && window\.ClickFixBridge\.receive\((.*)\);$',
      dotAll: true,
    ).firstMatch(javaScript);
    expect(m, isNotNull, reason: 'script shape: $javaScript');
    final text = jsonDecode(m!.group(1)!) as String;
    final command = jsonDecode(text) as Map<String, Object?>;
    commands.add(command);
    final id = command['id'];
    if (autoReply && id is String) {
      // Answer asynchronously, after the caller registered its completer.
      scheduleMicrotask(() {
        final error = replyError;
        controller.handleRawMessage(
          jsonEncode({
            'type': 'clickfix:result',
            'id': id,
            'ok': error == null,
            if (error == null && replyData != null) 'data': replyData,
            if (error != null) 'error': error.toJson(),
          }),
        );
      });
    }
  }
}

const String readyJson =
    '{"type":"clickfix:ready","bridge_version":1,"protocol_version":1,'
    '"sdk_version":"1.0.0","widget_id":"w1","visitor_id":"v1"}';

void main() {
  late ClickFixController controller;
  late FakeTransport transport;
  late List<String> rejected;

  setUp(() {
    rejected = [];
    controller = ClickFixController(
      widgetId: 'w1',
      locale: 'tr',
      resultTimeout: const Duration(milliseconds: 200),
      onRejectedMessage: rejected.add,
    );
    transport = FakeTransport(
      controller,
      url: 'https://getclickfix.com/widget-embed.html?widget=w1&locale=tr',
    );
    controller.attach(transport);
  });

  tearDown(() => controller.dispose());

  Future<void> ready() => controller.handleRawMessage(readyJson);

  test('embedUri follows the constructor parameters', () {
    final c = ClickFixController(
      widgetId: 'w1',
      origin: 'https://app.example.com',
      locale: 'en',
      theme: ClickFixTheme.dark,
      view: ClickFixView.help,
      conversation: 'c-1',
      consent: true,
    );
    expect(
      c.embedUri.toString(),
      'https://app.example.com/widget-embed.html?widget=w1&locale=en&theme=dark'
      '&view=help&conversation=c-1&consent=1',
    );
    expect(() => ClickFixController(widgetId: 'bad id'), throwsArgumentError);
    expect(
      () => ClickFixController(widgetId: 'w', origin: 'http://evil.com'),
      throwsArgumentError,
    );
  });

  test(
    'ready completes whenReady and flushes queued commands in order',
    () async {
      final identify = controller.identify(
        ClickFixIdentity(userId: '1001', userHash: 'h'),
      );
      unawaited(
        controller.track('app_screen', properties: {'screen': 'orders'}),
      );
      expect(controller.isReady, isFalse);
      expect(transport.commands, isEmpty);

      await ready();
      expect(controller.isReady, isTrue);
      expect((await controller.whenReady).visitorId, 'v1');
      expect(controller.readyInfo?.widgetId, 'w1');
      await identify;
      expect(transport.commands.map((c) => c['type']), [
        'clickfix:identify',
        'clickfix:track',
      ]);
      expect(transport.commands.first['user'], {
        'user_id': '1001',
        'user_hash': 'h',
      });
      expect(transport.commands.first['id'], isNotNull);
    },
  );

  test('result errors become ClickFixBridgeError', () async {
    await ready();
    transport.replyError = const ClickFixBridgeError('WIDGET_IDENTITY_INVALID');
    await expectLater(
      controller.identify(ClickFixIdentity(userId: '1', userHash: 'x')),
      throwsA(
        isA<ClickFixBridgeError>().having(
          (e) => e.code,
          'code',
          ClickFixErrorCode.widgetIdentityInvalid,
        ),
      ),
    );
  });

  test('getState returns the typed state', () async {
    await ready();
    transport.replyData = {'open': true, 'view': 'messages', 'unread': 4};
    final state = await controller.getState();
    expect(state.open, isTrue);
    expect(state.unread, 4);
    expect(transport.commands.single['type'], 'clickfix:get-state');
  });

  test('every helper maps to its command', () async {
    await ready();
    await controller.open(view: ClickFixView.messages);
    await controller.open(conversation: 'c-9');
    await controller.close();
    await controller.update({'theme': 'dark'});
    await controller.setConsent(true);
    await controller.reset();
    expect(transport.commands.map((c) => c['type']), [
      'clickfix:open',
      'clickfix:open',
      'clickfix:close',
      'clickfix:update',
      'clickfix:consent',
      'clickfix:reset',
    ]);
    expect(transport.commands[0]['view'], 'messages');
    expect(transport.commands[1]['conversation'], 'c-9');
    expect(transport.commands[3]['update'], {'theme': 'dark'});
    expect(transport.commands[4]['granted'], isTrue);
    expect(transport.commands.every((c) => c['id'] is String), isTrue);
  });

  test('send without id completes without waiting for a result', () async {
    await ready();
    transport.autoReply = false;
    final r = await controller.send(const ClickFixCloseCommand());
    expect(r, isNull);
    expect(transport.commands.single, {'type': 'clickfix:close'});
  });

  test('a missing result times out with TIMEOUT', () async {
    await ready();
    transport.autoReply = false;
    await expectLater(
      controller.close(),
      throwsA(
        isA<ClickFixBridgeError>().having(
          (e) => e.code,
          'code',
          ClickFixErrorCode.timeout,
        ),
      ),
    );
  });

  test('a JavaScript failure fails the command with COMMAND_FAILED', () async {
    await ready();
    transport.throwOnRun = Exception('webview gone');
    final errors = <FlutterErrorDetails>[];
    final previous = FlutterError.onError;
    FlutterError.onError = errors.add;
    try {
      await expectLater(
        controller.close(),
        throwsA(
          isA<ClickFixBridgeError>().having(
            (e) => e.code,
            'code',
            ClickFixErrorCode.commandFailed,
          ),
        ),
      );
    } finally {
      FlutterError.onError = previous;
    }
    expect(errors, hasLength(1));
    // The platform exception could quote the script (user_hash); only a
    // sanitised error is reported.
    expect(errors.single.exception.toString(), isNot(contains('webview gone')));
    expect(
      errors.single.exception.toString(),
      contains('runJavaScript failed'),
    );
  });

  test('the result timeout starts at delivery, not while queued', () async {
    transport.autoReply = false;
    final identify = controller.identify(
      ClickFixIdentity(userId: '1', userHash: 'h'),
    );
    await Future<void>.delayed(const Duration(milliseconds: 300));
    expect(transport.commands, isEmpty); // still queued, not timed out
    await ready();
    expect(transport.commands.single['type'], 'clickfix:identify');
    await expectLater(
      identify,
      throwsA(
        isA<ClickFixBridgeError>().having(
          (e) => e.code,
          'code',
          ClickFixErrorCode.timeout,
        ),
      ),
    );
  });

  test('detach drops a queued identify but keeps other commands', () async {
    final identify = controller.identify(
      ClickFixIdentity(userId: '1', userHash: 'h'),
    );
    unawaited(controller.send(const ClickFixCloseCommand()));
    controller.detach();
    await expectLater(
      identify,
      throwsA(
        isA<ClickFixBridgeError>().having(
          (e) => e.code,
          'code',
          ClickFixErrorCode.notAttached,
        ),
      ),
    );
    controller.attach(transport);
    await ready();
    expect(transport.commands.map((c) => c['type']), ['clickfix:close']);
  });

  test('an unknown bridge_version is reported and still accepted', () async {
    await controller.handleRawMessage(
      '{"type":"clickfix:ready","bridge_version":2,"protocol_version":1,'
      '"sdk_version":"9.0.0","widget_id":"w1","visitor_id":"v1"}',
    );
    expect(rejected, ['UNSUPPORTED_BRIDGE_VERSION']);
    expect(controller.isReady, isTrue);
    expect(controller.readyInfo?.bridgeVersion, 2);
  });

  test('messages are streamed and events, links, results split', () async {
    final events = <String>[];
    final links = <Uri>[];
    final results = <String>[];
    controller.events.listen((e) => events.add(e.event));
    controller.links.listen((l) => links.add(l.url));
    controller.results.listen((r) => results.add(r.id));

    await ready();
    await controller.handleRawMessage(
      '{"type":"clickfix:event","event":"unread","payload":{"count":1}}',
    );
    await controller.handleRawMessage(
      '{"type":"clickfix:link","url":"https://example.com/kb"}',
    );
    await controller.handleRawMessage(
      '{"type":"clickfix:result","id":"unknown","ok":true}',
    );
    await controller.handleRawMessage('{"type":"clickfix:future"}');
    await Future<void>.delayed(Duration.zero);
    expect(events, ['unread']);
    expect(links, [Uri.parse('https://example.com/kb')]);
    expect(results, ['unknown']);
    expect(rejected, isEmpty);
  });

  test('unsafe links are dropped', () async {
    final links = <Uri>[];
    controller.links.listen((l) => links.add(l.url));
    await ready();
    for (final url in [
      'http://example.com/a',
      'myapp://x',
      'intent://x#Intent;end',
    ]) {
      await controller.handleRawMessage(
        jsonEncode({'type': 'clickfix:link', 'url': url}),
      );
    }
    await Future<void>.delayed(Duration.zero);
    expect(links, isEmpty);
    expect(rejected, ['UNSAFE_LINK', 'UNSAFE_LINK', 'UNSAFE_LINK']);
  });

  test('messages are accepted only while the page is on the origin', () async {
    transport.url = 'https://evil.example/widget-embed.html';
    await ready();
    expect(controller.isReady, isFalse);
    expect(rejected, ['ORIGIN_MISMATCH']);

    transport.url = null;
    await ready();
    expect(controller.isReady, isFalse);

    transport.url = 'https://getclickfix.com/widget-embed.html?widget=w1';
    await ready();
    expect(controller.isReady, isTrue);
  });

  test('invalid inbound messages are reported by code only', () async {
    await controller.handleRawMessage('nope');
    await controller.handleRawMessage('{"type":"evil:thing"}');
    await controller.handleRawMessage('x' * (64 * 1024 + 1));
    expect(rejected, [
      ClickFixErrorCode.invalidJson,
      ClickFixErrorCode.invalidMessage,
      ClickFixErrorCode.tooLarge,
    ]);
  });

  test(
    'without a transport messages are rejected and commands queued',
    () async {
      final c = ClickFixController(
        widgetId: 'w1',
        onRejectedMessage: rejected.add,
      );
      await c.handleRawMessage(readyJson);
      expect(rejected, [ClickFixErrorCode.notAttached]);
      expect(c.isReady, isFalse);
      unawaited(c.send(const ClickFixCloseCommand()));
      final t = FakeTransport(
        c,
        url: 'https://getclickfix.com/widget-embed.html',
      );
      c.attach(t);
      await c.handleRawMessage(readyJson);
      expect(t.commands.single['type'], 'clickfix:close');
      c.dispose();
    },
  );

  test('pageReset waits for the next ready and flushes again', () async {
    await ready();
    controller.pageReset();
    expect(controller.isReady, isFalse);
    unawaited(controller.send(const ClickFixCloseCommand()));
    expect(transport.commands, isEmpty);
    await ready();
    expect(transport.commands.single['type'], 'clickfix:close');
  });

  test('detach fails pending commands with NOT_ATTACHED', () async {
    await ready();
    transport.autoReply = false;
    final pending = controller.close();
    controller.detach();
    await expectLater(
      pending,
      throwsA(
        isA<ClickFixBridgeError>().having(
          (e) => e.code,
          'code',
          ClickFixErrorCode.notAttached,
        ),
      ),
    );
    expect(controller.isAttached, isFalse);
  });

  test('dispose fails pending commands and refuses new ones', () async {
    await ready();
    transport.autoReply = false;
    final pending = controller.close();
    controller.dispose();
    await expectLater(
      pending,
      throwsA(
        isA<ClickFixBridgeError>().having(
          (e) => e.code,
          'code',
          ClickFixErrorCode.disposed,
        ),
      ),
    );
    expect(() => controller.close(), throwsStateError);
    expect(controller.isDisposed, isTrue);
  });
}
