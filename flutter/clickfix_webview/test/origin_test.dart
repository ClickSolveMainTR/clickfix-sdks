import 'package:clickfix_webview/clickfix_webview.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ClickFixOrigin', () {
    test('accepts https origins and normalises them', () {
      expect(
        ClickFixOrigin('HTTPS://GetClickFix.com/').value,
        'https://getclickfix.com',
      );
      expect(
        ClickFixOrigin('https://app.example.com:8443').value,
        'https://app.example.com:8443',
      );
      expect(ClickFixOrigin.hosted().value, defaultClickFixOrigin);
    });

    test('allows http only for loopback', () {
      expect(
        ClickFixOrigin('http://localhost:3000').value,
        'http://localhost:3000',
      );
      expect(
        ClickFixOrigin('http://127.0.0.1:3000').value,
        'http://127.0.0.1:3000',
      );
      expect(
        () => ClickFixOrigin('http://getclickfix.com'),
        throwsArgumentError,
      );
    });

    test('rejects paths, queries, user info and other schemes', () {
      for (final bad in [
        'https://getclickfix.com/widget-embed.html',
        'https://getclickfix.com/?x=1',
        'https://getclickfix.com/#f',
        'https://user:pw@getclickfix.com',
        'ftp://getclickfix.com',
        'javascript:alert(1)',
        'getclickfix.com',
        '',
      ]) {
        expect(() => ClickFixOrigin(bad), throwsArgumentError, reason: bad);
      }
    });

    test('allows navigation inside the origin only', () {
      final origin = ClickFixOrigin('https://getclickfix.com');
      expect(
        origin.allowsString(
          'https://getclickfix.com/widget-embed.html?widget=w',
        ),
        isTrue,
      );
      expect(origin.allowsString('https://GETCLICKFIX.com/widget.js'), isTrue);
      expect(origin.allowsString('http://getclickfix.com/'), isFalse);
      expect(origin.allowsString('https://getclickfix.com.evil.com/'), isFalse);
      expect(origin.allowsString('https://evil.com/getclickfix.com'), isFalse);
      expect(origin.allowsString('https://getclickfix.com:8443/'), isFalse);
      expect(origin.allowsString('https://user@getclickfix.com/'), isTrue);
      expect(origin.allowsString('about:blank'), isFalse);
      expect(origin.allowsString('javascript:void(0)'), isFalse);
      expect(origin.allowsString('::not a url::'), isFalse);
    });

    test('external links must be https (or http localhost in debug)', () {
      expect(
        ClickFixOrigin.isDebugBuild,
        isTrue,
        reason: 'tests run with asserts',
      );
      expect(
        ClickFixOrigin.isSafeExternalLink(Uri.parse('https://example.com/a')),
        isTrue,
      );
      expect(
        ClickFixOrigin.isSafeExternalLink(Uri.parse('http://localhost:3000/a')),
        isTrue,
      );
      expect(
        ClickFixOrigin.isSafeExternalLink(Uri.parse('http://example.com/a')),
        isFalse,
      );
      expect(
        ClickFixOrigin.isSafeExternalLink(Uri.parse('myapp://support')),
        isFalse,
      );
      expect(
        ClickFixOrigin.isSafeExternalLink(Uri.parse('intent://x#Intent;end')),
        isFalse,
      );
      expect(
        ClickFixOrigin.isSafeExternalLink(Uri.parse('javascript:alert(1)')),
        isFalse,
      );
      expect(
        ClickFixOrigin.isSafeExternalLink(Uri.parse('file:///etc/passwd')),
        isFalse,
      );
    });

    test('embedUri builds the hosted page URL', () {
      final origin = ClickFixOrigin('https://getclickfix.com');
      expect(
        origin.embedUri(widgetId: 'w_1').toString(),
        'https://getclickfix.com/widget-embed.html?widget=w_1',
      );
      expect(
        origin
            .embedUri(
              widgetId: 'w-1',
              locale: 'tr',
              theme: 'dark',
              view: 'messages',
              conversation: '0f8fad5b-d9cb-469f-a165-70867728950e',
              consent: true,
            )
            .toString(),
        'https://getclickfix.com/widget-embed.html?widget=w-1&locale=tr&theme=dark'
        '&view=messages&conversation=0f8fad5b-d9cb-469f-a165-70867728950e&consent=1',
      );
    });

    test('embedUri validates its inputs', () {
      final origin = ClickFixOrigin('https://getclickfix.com');
      expect(() => origin.embedUri(widgetId: ''), throwsArgumentError);
      expect(() => origin.embedUri(widgetId: 'a b'), throwsArgumentError);
      expect(
        () => origin.embedUri(widgetId: 'w', conversation: '../x'),
        throwsArgumentError,
      );
      expect(
        () => origin.embedUri(widgetId: 'w', locale: 'tr-TR'),
        throwsArgumentError,
      );
      expect(
        () => origin.embedUri(widgetId: 'w', theme: 'blue'),
        throwsArgumentError,
      );
      expect(
        () => origin.embedUri(widgetId: 'w', view: 'chat'),
        throwsArgumentError,
      );
    });
  });
}
