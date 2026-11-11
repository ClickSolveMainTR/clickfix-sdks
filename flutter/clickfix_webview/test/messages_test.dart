import 'dart:convert';

import 'package:clickfix_webview/clickfix_webview.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('commands', () {
    test('identify serialises the user and trims optional fields', () {
      final cmd = ClickFixIdentifyCommand(
        ClickFixIdentity(
          userId: '1001',
          userHash: 'abc',
          name: 'Ayşe',
          email: '',
          company: const ClickFixCompany(id: 'F-77'),
          attributes: {
            'plan': 'pro',
            'seats': 3,
            'beta': true,
            'nested': {'no': 1},
            'x' * 101: 'dropped',
          },
        ),
        id: 'login',
      );
      final json = jsonDecode(cmd.encode()) as Map<String, Object?>;
      expect(json['type'], 'clickfix:identify');
      expect(json['id'], 'login');
      expect(json['user'], {
        'user_id': '1001',
        'user_hash': 'abc',
        'name': 'Ayşe',
        'company': {'id': 'F-77'},
        'attributes': {'plan': 'pro', 'seats': 3, 'beta': true},
      });
    });

    test('identity validates ids', () {
      expect(
        () => ClickFixIdentity(userId: '', userHash: 'h'),
        throwsArgumentError,
      );
      expect(
        () => ClickFixIdentity(userId: 'u', userHash: 'h' * 129),
        throwsArgumentError,
      );
    });

    test('every command has the contract type and optional id', () {
      final cases = <ClickFixCommand, Map<String, Object?>>{
        ClickFixTrackCommand('app_screen', properties: {'screen': 'orders'}): {
          'type': 'clickfix:track',
          'name': 'app_screen',
          'properties': {'screen': 'orders'},
        },
        const ClickFixOpenCommand(
          view: ClickFixView.newConversation,
          conversation: 'c-1',
        ): {
          'type': 'clickfix:open',
          'view': 'new',
          'conversation': 'c-1',
        },
        const ClickFixCloseCommand(): {'type': 'clickfix:close'},
        const ClickFixUpdateCommand({'locale': 'en'}): {
          'type': 'clickfix:update',
          'update': {'locale': 'en'},
        },
        const ClickFixConsentCommand(false): {
          'type': 'clickfix:consent',
          'granted': false,
        },
        const ClickFixResetCommand(): {'type': 'clickfix:reset'},
        const ClickFixGetStateCommand(): {'type': 'clickfix:get-state'},
      };
      cases.forEach((cmd, expected) {
        expect(cmd.toJson(), expected, reason: cmd.type);
        expect(cmd.withId('7').toJson(), {...expected, 'id': '7'});
        expect(cmd.withId('7').id, '7');
      });
    });

    test('track rejects empty and long names', () {
      expect(() => ClickFixTrackCommand(''), throwsArgumentError);
      expect(() => ClickFixTrackCommand('n' * 101), throwsArgumentError);
    });

    test('encode refuses messages over 64 KB', () {
      final cmd = ClickFixUpdateCommand({'blob': 'x' * (64 * 1024)});
      expect(
        () => cmd.encode(),
        throwsA(
          isA<ClickFixBridgeError>().having(
            (e) => e.code,
            'code',
            ClickFixErrorCode.tooLarge,
          ),
        ),
      );
    });

    test('bridgeReceiveScript embeds the JSON as a string literal', () {
      final script = ClickFixController.bridgeReceiveScript(
        '{"type":"clickfix:close"}',
      );
      expect(
        script,
        'window.ClickFixBridge && window.ClickFixBridge.receive('
        '"{\\"type\\":\\"clickfix:close\\"}");',
      );
    });
  });

  group('parseBridgeMessage', () {
    test('ready', () {
      final m = parseBridgeMessage(
        jsonEncode({
          'type': 'clickfix:ready',
          'bridge_version': 1,
          'protocol_version': 1,
          'sdk_version': '1.4.0',
          'widget_id': 'w1',
          'visitor_id': 'v1',
        }),
      );
      expect(m, isA<ClickFixReady>());
      final ready = m as ClickFixReady;
      expect(ready.bridgeVersion, 1);
      expect(ready.sdkVersion, '1.4.0');
      expect(ready.widgetId, 'w1');
      expect(ready.visitorId, 'v1');
    });

    test('event with and without payload', () {
      final m = parseBridgeMessage(
        '{"type":"clickfix:event","event":"unread","payload":{"count":2}}',
      );
      expect(m, isA<ClickFixEvent>());
      expect((m as ClickFixEvent).event, 'unread');
      expect(m.payload, {'count': 2});
      final bare = parseBridgeMessage(
        '{"type":"clickfix:event","event":"close"}',
      );
      expect((bare as ClickFixEvent).payload, isEmpty);
    });

    test('link', () {
      final m = parseBridgeMessage(
        '{"type":"clickfix:link","url":"https://example.com/help"}',
      );
      expect((m as ClickFixLink).url, Uri.parse('https://example.com/help'));
    });

    test('result ok and error', () {
      final ok = parseBridgeMessage(
        '{"type":"clickfix:result","id":"1","ok":true,"data":{"open":true}}',
      );
      expect((ok as ClickFixResult).ok, isTrue);
      expect(ok.data, {'open': true});
      expect(ok.error, isNull);

      final err = parseBridgeMessage(
        '{"type":"clickfix:result","id":"1","ok":false,'
        '"error":{"code":"WIDGET_IDENTITY_INVALID","message":"command failed (WIDGET_IDENTITY_INVALID)"}}',
      );
      expect((err as ClickFixResult).ok, isFalse);
      expect(err.error?.code, ClickFixErrorCode.widgetIdentityInvalid);

      final weird = parseBridgeMessage(
        '{"type":"clickfix:result","id":"1","ok":false,"error":{"code":"bad code"}}',
      );
      expect(
        (weird as ClickFixResult).error?.code,
        ClickFixErrorCode.commandFailed,
      );
    });

    test('unknown clickfix type is surfaced, not rejected', () {
      final m = parseBridgeMessage('{"type":"clickfix:future","x":1}');
      expect(m, isA<ClickFixUnknownMessage>());
      expect((m as ClickFixUnknownMessage).raw['x'], 1);
    });

    test('rejections carry a code only', () {
      void expectCode(String raw, String code) {
        expect(
          () => parseBridgeMessage(raw),
          throwsA(
            isA<ClickFixBridgeError>()
                .having((e) => e.code, 'code', code)
                .having((e) => e.message, 'message', 'command failed ($code)'),
          ),
          reason: code,
        );
      }

      expectCode('not json', ClickFixErrorCode.invalidJson);
      expectCode('[1,2]', ClickFixErrorCode.invalidMessage);
      expectCode('{"type":"other:thing"}', ClickFixErrorCode.invalidMessage);
      expectCode('{"type":""}', ClickFixErrorCode.invalidMessage);
      expectCode('{"type":"clickfix:event"}', ClickFixErrorCode.invalidMessage);
      expectCode(
        '{"type":"clickfix:link","url":5}',
        ClickFixErrorCode.invalidMessage,
      );
      expectCode(
        '{"type":"clickfix:result","id":"1"}',
        ClickFixErrorCode.invalidMessage,
      );
      expectCode(
        '{"type":"clickfix:event","event":"x","pad":"${'y' * (64 * 1024)}"}',
        ClickFixErrorCode.tooLarge,
      );
    });
  });

  test('ClickFixState reads the known fields', () {
    final state = ClickFixState.fromJson({
      'open': true,
      'view': 'messages',
      'unread': 3,
      'verified': true,
      'visitor_id': 'v',
      'conversation_uuid': null,
      'locale': 'tr',
      'online': true,
    });
    expect(state.open, isTrue);
    expect(state.view, 'messages');
    expect(state.unread, 3);
    expect(state.verified, isTrue);
    expect(state.visitorId, 'v');
    expect(state.conversationUuid, isNull);
    expect(state.locale, 'tr');
    expect(state.online, isTrue);
    expect(ClickFixState.fromJson('nope').raw, isEmpty);
  });
}
