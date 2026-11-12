# clickfix_webview

Secure ClickFix support screen for Flutter apps. It shows the hosted ClickFix
widget in a webview that carries the visitor session and implements the
[ClickFix webview bridge contract v1](https://getclickfix.com/docs/integration-guide/mobile#bridge-contract)
over a `webview_flutter` JavaScript channel: your app hands the signed-in
user over (`identify`), sends app events (`track`), opens views or a
conversation (deep link), and receives the widget's events (`unread`, `close`,
`message`, …) and external links.

Full walkthrough with the server side (`user_hash`), deep links from push
notifications and the security rules: the
[integration guide, "Mobile: webview and Flutter"](https://getclickfix.com/docs/integration-guide/mobile).
Changes: [CHANGELOG.md](CHANGELOG.md).

## Install

```sh
flutter pub add clickfix_webview
```

Requires a Flutter release whose bundled Dart is a stable 3.10.0 or newer (the package sets only the Dart constraint `^3.10.0`). The package depends on `webview_flutter`
(Android `minSdk` 24, iOS 12+). Opening external links needs a launcher of your
choice (`url_launcher` in the example); the package only validates them. A
complete app lives in
[clickfix-examples/flutter-webview](https://github.com/ClickSolveMainTR/clickfix-examples/tree/main/flutter-webview).

## Use

```dart
import 'package:clickfix_webview/clickfix_webview.dart';
import 'package:url_launcher/url_launcher.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key, this.conversation});
  final String? conversation; // deep link: open this conversation
  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  late final controller = ClickFixController(
    widgetId: 'WIDGET_ID',          // public widget id from the panel
    locale: 'tr',
    theme: ClickFixTheme.auto,
    conversation: widget.conversation,
    consent: true,                  // only after your app collected consent
  );

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: ClickFixWebView(
      controller: controller,
      onReady: (_) async {
        final s = await api.supportSession(); // { user_id, user_hash, company_id } from YOUR server; user_hash signs both ids
        try {
          await controller.identify(ClickFixIdentity(
            userId: s.userId,
            userHash: s.userHash,
            name: s.name,
            company: ClickFixCompany(id: s.companyId),
          ));
          await controller.track('app_screen', properties: {'screen': 'orders'});
        } on ClickFixBridgeError catch (e) {
          // e.code: WIDGET_IDENTITY_INVALID, WIDGET_IDENTITY_DISABLED, TIMEOUT, ...
        }
      },
      onUnread: (count) => badge.value = count,
      onLink: (link) => launchUrl(link.url, mode: LaunchMode.externalApplication),
      onClose: () => Navigator.of(context).pop(),
    ),
  );
}
```

`ClickFixController` helpers map one-to-one to the bridge commands and
complete with the widget's `clickfix:result`:

| Method | Command |
|---|---|
| `identify(ClickFixIdentity)` | `clickfix:identify` |
| `track(name, properties:)` | `clickfix:track` |
| `open(view:, conversation:)` | `clickfix:open` |
| `close()` | `clickfix:close` |
| `update({...})` | `clickfix:update` (locale, theme, profile, attributes) |
| `setConsent(bool)` | `clickfix:consent` |
| `reset()` | `clickfix:reset` (logout, account switch) |
| `getState()` | `clickfix:get-state` → `ClickFixState` |
| `send(ClickFixCommand)` | any command, raw |

Commands sent before the widget's `clickfix:ready` are queued and flushed on
ready. Widget → app messages are also available as streams:
`controller.messages`, `events`, `links`, `results`, plus `whenReady`.
Errors are `ClickFixBridgeError` with the contract's codes
(`ClickFixErrorCode`); the error never contains message content.

## Security

- The webview loads **only** the configured origin (`https://getclickfix.com`
  by default, or `origin:` for your installation); navigation elsewhere is
  blocked with `NavigationDelegate`. `http:` is accepted for `localhost` only.
- `ClickFixFlutter` channel messages are accepted only while the page is on
  that origin; too large or malformed messages are dropped and reported by
  code through `onRejectedMessage`.
- `clickfix:link` URLs reach `onLink` only when they are `https:` (debug
  builds also accept `http://localhost`); never hand them to a deep-link or
  intent handler.
- On Android the JavaScript interface behind the channel is exposed to every
  frame of the page, not only the main frame; the origin check looks at the
  main-frame URL. This is the accepted boundary as long as the embed page
  stays first party: it loads only ClickFix's own scripts and no third-party
  frames.
- On Android file access, content access and mixed content are off.
- `user_hash` is computed on your server; the identity secret never enters the
  app. When the identity carries `ClickFixCompany(id: ...)`, sign the user id
  and the company id together on the server:
  `hex(HMAC-SHA256(secret, user_id + "\n" + company_id))` (Node
  `identityHash(secret, userId, companyId)`, Go `IdentityCompanyHash`); a hash
  over the user id alone still verifies the user but does not link the
  company by its id. Send `reset()` on logout and account switch; pass
  `consent: true` only after the app collected consent.

## Hosting the page yourself

`createWebViewController(controller: ...)` returns the locked-down
`WebViewController` (channel, navigation rule, Android settings) attached to a
`ClickFixController`, for apps that embed the page in their own widget tree.
Call `loadRequest(controller.embedUri)` on it.

## Development

```sh
flutter pub get && dart analyze && dart format --set-exit-if-changed . && flutter test
cd example && flutter pub get && flutter analyze
```

The example app (`example/`) fetches a stub session, identifies the visitor
and opens a conversation given with `--dart-define=CLICKFIX_CONVERSATION=…`.
