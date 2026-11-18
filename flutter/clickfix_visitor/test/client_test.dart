import 'dart:convert';
import 'dart:io';

import 'package:clickfix_visitor/clickfix_visitor.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:test/test.dart';

const publicId = '6f1c2a52-3a7b-4c1e-9b44-0d2b7f3c9a10';
const conversation = '0d9d7c5e-1111-4a5b-8c6d-222233334444';
const base = 'https://support.example.com/api/v1/widget/$publicId';
const app = ClickFixApp(key: 'cf_app_test', packageName: 'com.example.app');

Map<String, Object?> bootstrapData(String token) {
  final fixture =
      jsonDecode(File('test/fixtures/bootstrap.json').readAsStringSync())
          as Map<String, Object?>;
  final data = fixture['data']! as Map<String, Object?>;
  final visitor = data['visitor']! as Map<String, Object?>;
  return {
    ...data,
    'visitor': {...visitor, 'token': token},
  };
}

http.Response ok(Object? data, {int status = 200}) => http.Response(
  jsonEncode({
    'success': true,
    'data': data,
    'meta': {'request_id': 'req-1'},
  }),
  status,
  headers: {'content-type': 'application/json'},
);

http.Response apiError(
  int status,
  String code, {
  Map<String, String>? headers,
}) => http.Response(
  jsonEncode({
    'success': false,
    'error': {
      'code': code,
      'message': 'nope',
      'details': [
        {'field': 'text', 'message': 'too long'},
      ],
    },
    'meta': {'request_id': 'req-err'},
  }),
  status,
  headers: {'content-type': 'application/json', ...?headers},
);

Map<String, Object?> message(String uuid) => {
  'uuid': uuid,
  'direction': 'out',
  'sender_type': 'agent',
  'sender_name': 'Deniz',
  'kind': 'text',
  'content': 'Hello',
  'status': 'sent',
  'client_id': null,
  'attachments': null,
  'created_at': '2026-11-18T09:00:00Z',
  'read_at': null,
};

Map<String, Object?> sent() => {
  'conversation_uuid': conversation,
  'created': true,
  'message': message('m-1'),
};

/// A visitor whose HTTP calls are answered by [handler].
ClickFixVisitor visitorWith(
  Future<http.Response> Function(http.Request) handler, {
  String token = '',
  void Function(String)? onToken,
  String screen = '',
}) => ClickFixVisitor(
  publicId: publicId,
  baseUrl: 'https://support.example.com/api/',
  app: app,
  token: token,
  onToken: onToken,
  screen: screen,
  language: 'tr-TR',
  httpClient: MockClient(handler),
  baseDelay: Duration.zero,
  randomUuid: () => '11111111-2222-4333-8444-555555555555',
);

void main() {
  group('session', () {
    test('init bootstraps with the app key and stores the token', () async {
      final requests = <http.Request>[];
      final tokens = <String>[];
      final client = visitorWith(
        (r) async {
          requests.add(r);
          return ok(bootstrapData('tok-1'));
        },
        onToken: tokens.add,
        screen: 'Home',
      );
      final changes = <VisitorSession>[];
      client.changes.listen(changes.add);

      final boot = await client.init();

      expect(boot.widget.name, 'Support');
      expect(boot.widget.settings.locale, 'auto');
      expect(client.token, 'tok-1');
      expect(tokens, ['tok-1']);
      expect(changes.single.visitor?.token, 'tok-1');
      final r = requests.single;
      expect(r.method, 'POST');
      expect(r.url.toString(), '$base/bootstrap');
      expect(r.headers['X-ClickFix-App-Key'], 'cf_app_test');
      expect(r.headers['X-ClickFix-App-Package'], 'com.example.app');
      expect(r.headers.containsKey('Authorization'), isFalse);
      expect(r.followRedirects, isFalse);
      expect(jsonDecode(r.body), {
        'page_url': 'Home',
        'language': 'tr',
        'sdk_version': clickFixVisitorVersion,
      });
    });

    test('a persisted token resumes the session', () async {
      String? auth;
      final client = visitorWith((r) async {
        auth = r.headers['Authorization'];
        return ok(bootstrapData('tok-2'));
      }, token: 'tok-1');
      await client.init();
      expect(auth, 'Bearer tok-1');
      expect(client.token, 'tok-2');
    });

    test('a rejected token renews the session once and repeats', () async {
      final calls = <String>[];
      final client = visitorWith((r) async {
        calls.add('${r.method} ${r.url.path} ${r.headers['Authorization']}');
        if (r.url.path.endsWith('/bootstrap')) return ok(bootstrapData('new'));
        if (r.headers['Authorization'] == 'Bearer old') {
          return apiError(401, widgetTokenInvalid);
        }
        return ok({'items': <Object?>[]});
      }, token: 'old');

      expect(await client.conversations(), isEmpty);
      expect(calls, [
        'GET /api/v1/widget/$publicId/conversations Bearer old',
        'POST /api/v1/widget/$publicId/bootstrap Bearer old',
        'GET /api/v1/widget/$publicId/conversations Bearer new',
      ]);
    });

    test('identify keeps the returned visitor; reset forgets it', () async {
      final tokens = <String>[];
      final client = visitorWith((r) async {
        expect(jsonDecode(r.body), {'user_id': '1001', 'user_hash': 'abc'});
        final visitor = bootstrapData('tok-user')['visitor']!;
        return ok({...visitor as Map<String, Object?>, 'verified': true});
      }, onToken: tokens.add);

      final v = await client.identify(
        const WidgetIdentifyInput(userId: '1001', userHash: 'abc'),
      );
      expect(v.verified, isTrue);
      expect(client.session.visitor?.verified, isTrue);
      client.reset();
      expect(client.token, '');
      expect(client.session.visitor, isNull);
      expect(tokens, ['tok-user', '']);
    });
  });

  group('messages', () {
    test('send adds client_id, page_url and tracked events', () async {
      final bodies = <Object?>[];
      final client = visitorWith((r) async {
        bodies.add(jsonDecode(r.body));
        expect(r.url.toString(), '$base/conversations/$conversation/messages');
        return ok(sent());
      }, screen: 'Checkout');
      client.track('cart_viewed', {'items': 2});

      final out = await client.sendMessage(
        conversation,
        const WidgetSendInput(text: 'Hi'),
      );

      expect(out.created, isTrue);
      expect(out.message.attachments, isEmpty); // null array decodes as []
      final body = bodies.single! as Map<String, Object?>;
      expect(body['text'], 'Hi');
      expect(body['client_id'], '11111111-2222-4333-8444-555555555555');
      expect(body['page_url'], 'Checkout');
      final events = body['events']! as List<Object?>;
      expect((events.single! as Map<String, Object?>)['name'], 'cart_viewed');
      expect(client.pendingEvents, isEmpty);
    });

    test('a file goes as multipart/form-data', () async {
      late http.Request req;
      final client = visitorWith((r) async {
        req = r;
        return ok(sent(), status: 201);
      });
      await client.createConversation(
        const WidgetSendInput(text: 'Screenshot', consent: true),
        file: const WidgetFile(
          bytes: [1, 2, 3],
          filename: 'shot.png',
          contentType: 'image/png',
        ),
      );
      expect(req.url.toString(), '$base/conversations');
      expect(req.headers['content-type'], startsWith('multipart/form-data'));
      final body = latin1.decode(req.bodyBytes);
      expect(body, contains('name="text"\r\n\r\nScreenshot'));
      expect(body, contains('name="consent"\r\n\r\ntrue'));
      expect(body, contains('name="client_id"'));
      expect(body, contains('filename="shot.png"'));
      expect(body, contains('content-type: image/png'));
    });

    test('messages passes the cursor and decodes the page', () async {
      final client = visitorWith((r) async {
        expect(r.url.queryParameters, {'after': 'm-0'});
        return ok({
          'conversation': {
            'uuid': conversation,
            'number': 7,
            'status': 'open',
            'open': true,
            'last_message_preview': 'Hello',
            'last_message_direction': 'out',
            'last_message_at': '2026-11-18T09:00:00Z',
            'unread_count': 1,
            'can_rate': false,
            'rating': null,
            'created_at': '2026-11-18T08:00:00Z',
            'resolved_at': null,
          },
          'items': [message('m-1')],
          'has_more': false,
        });
      });
      final page = await client.messages(conversation, after: 'm-0');
      expect(page.items.single.uuid, 'm-1');
      expect(page.items.single.createdAt, DateTime.utc(2026, 11, 18, 9));
      expect(page.conversation.number, 7);
    });
  });

  group('transport', () {
    test('idempotent requests retry 503 and honour Retry-After', () async {
      var n = 0;
      final waits = <Duration>[];
      final transport = HttpWidgetTransport(
        baseUrl: 'https://support.example.com/api',
        app: app,
        token: () => '',
        client: MockClient((r) async {
          n++;
          return n == 1
              ? apiError(503, 'UNAVAILABLE', headers: {'retry-after': '2'})
              : ok({'items': <Object?>[]});
        }),
        sleep: (d) async => waits.add(d),
      );
      final api = WidgetApi(transport, publicId: publicId);
      await api.listConversations();
      expect(n, 2);
      expect(waits, [const Duration(seconds: 2)]);
    });

    test('non-idempotent requests are sent once', () async {
      var n = 0;
      final client = visitorWith((r) async {
        n++;
        return apiError(503, 'UNAVAILABLE');
      });
      await expectLater(
        client.typing(conversation, true),
        throwsA(isA<ClickFixApiException>()),
      );
      expect(n, 1);
    });

    test(
      'errors carry status, code, message, request id and details',
      () async {
        final client = visitorWith(
          (r) async => apiError(422, 'VALIDATION_ERROR'),
        );
        try {
          await client.rate(conversation, 9);
          fail('expected an error');
        } on ClickFixApiException catch (e) {
          expect(e.status, 422);
          expect(e.code, 'VALIDATION_ERROR');
          expect(e.message, 'nope');
          expect(e.requestId, 'req-err');
          expect(e.details.single['field'], 'text');
          expect(e.isTokenInvalid, isFalse);
        }
      },
    );

    test('a body without an error envelope is HTTP_ERROR', () async {
      final client = visitorWith(
        (r) async => http.Response(
          'bad gateway',
          500,
          headers: {'x-request-id': 'edge-1'},
        ),
      );
      await expectLater(
        client.markRead(conversation),
        throwsA(
          isA<ClickFixApiException>()
              .having((e) => e.code, 'code', 'HTTP_ERROR')
              .having((e) => e.requestId, 'requestId', 'edge-1'),
        ),
      );
    });

    test('the base URL must be absolute and the app key complete', () {
      expect(
        () => ClickFixVisitor(publicId: publicId, baseUrl: '/api', app: app),
        throwsArgumentError,
      );
      expect(
        () => ClickFixVisitor(
          publicId: publicId,
          baseUrl: 'https://support.example.com/api',
          app: const ClickFixApp(key: '', packageName: 'x'),
        ),
        throwsArgumentError,
      );
    });
  });

  group('models', () {
    test('wrong types name the JSON path', () {
      expect(
        () => WidgetSent.fromJson({...sent(), 'created': 'yes'}),
        throwsA(
          isA<FormatException>().having(
            (e) => e.message,
            'message',
            contains('WidgetSent.created must be a boolean'),
          ),
        ),
      );
    });

    test('toJson leaves unset optional properties out', () {
      expect(const WidgetSendInput(text: 'Hi').toJson(), {'text': 'Hi'});
      expect(const RateConversationInput(score: 5).toJson(), {'score': 5});
    });

    test('the bootstrap fixture survives a round trip', () {
      final data = bootstrapData('t');
      final once = WidgetBootstrap.fromJson(data);
      final twice = WidgetBootstrap.fromJson(
        jsonDecode(jsonEncode(once.toJson())) as Map<String, Object?>,
      );
      expect(jsonEncode(twice.toJson()), jsonEncode(once.toJson()));
    });
  });

  group('poller', () {
    test('pollNow follows the cursor across pages', () async {
      final afters = <String?>[];
      final client = visitorWith((r) async {
        final after = r.url.queryParameters['after'];
        afters.add(after);
        final items = switch (after) {
          null => [message('m-1'), message('m-2')],
          'm-2' => [message('m-3')],
          _ => <Map<String, Object?>>[],
        };
        return ok({
          'conversation': _conversation(),
          'items': items,
          'has_more': after == null,
        });
      });
      final poller = MessagePoller(client, conversation);
      final seen = <String>[];
      poller.messages.listen((m) => seen.add(m.uuid));
      final first = await poller.pollNow();
      expect(first.map((m) => m.uuid), ['m-1', 'm-2', 'm-3']);
      expect(afters, [null, 'm-2']);
      expect(poller.after, 'm-3');
      await Future<void>.delayed(Duration.zero);
      expect(seen, ['m-1', 'm-2', 'm-3']);
    });

    test('start delivers new messages and reports errors', () async {
      var n = 0;
      final client = visitorWith((r) async {
        n++;
        if (n == 2) return apiError(500, 'INTERNAL_ERROR');
        return ok({
          'conversation': _conversation(),
          'items': n == 1 ? [message('m-1')] : <Object?>[],
          'has_more': false,
        });
      });
      final waits = <Duration>[];
      late MessagePoller poller;
      poller = MessagePoller(
        client,
        conversation,
        interval: const Duration(seconds: 5),
        delay: (d) async {
          waits.add(d);
          if (waits.length == 3) poller.stop();
        },
      );
      final seen = <String>[];
      final errors = <Object>[];
      poller.messages.listen((m) => seen.add(m.uuid), onError: errors.add);
      poller.start();
      while (poller.running) {
        await Future<void>.delayed(Duration.zero);
      }
      expect(seen, ['m-1']);
      expect(errors.single, isA<ClickFixApiException>());
      expect(waits, [
        const Duration(seconds: 5),
        const Duration(seconds: 10),
        const Duration(seconds: 5),
      ]);
      await poller.close();
    });
  });
}

Map<String, Object?> _conversation() => {
  'uuid': conversation,
  'number': 7,
  'status': 'open',
  'open': true,
  'last_message_preview': '',
  'last_message_direction': 'out',
  'last_message_at': '2026-11-18T09:00:00Z',
  'unread_count': 0,
  'can_rate': false,
  'rating': null,
  'created_at': '2026-11-18T08:00:00Z',
  'resolved_at': null,
};
