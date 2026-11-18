# clickfix_visitor

Native Dart client of the ClickFix visitor (widget) API for Flutter and Dart
apps. It keeps one visitor session (mobile app key, visitor token, renewal),
identifies your signed-in user, opens conversations, sends messages and files
and delivers the agents' replies by polling. There is no UI: build your own
screens, or show the hosted widget with
[`clickfix_webview`](https://pub.dev/packages/clickfix_webview).

Full walkthrough with the server side (`user_hash`) and the security rules:
the [integration guide, "Mobile: webview and Flutter"](https://getclickfix.com/docs/integration-guide/mobile).
Changes: [CHANGELOG.md](CHANGELOG.md).

## Install

```sh
dart pub add clickfix_visitor   # or: flutter pub add clickfix_visitor
```

Requires Dart 3.10 or newer (any Flutter release that bundles it). Pure Dart
on `package:http`: Android, iOS, desktop and server.

## Mobile app key

Native requests carry no page origin, so the widget accepts them only with a
mobile app key: in the panel open Web widget → Advanced → Mobile apps, add the
app's bundle id (iOS) / application id (Android) and copy the key. The key
identifies the app, it is not a secret like the identity secret; the
`user_hash` that proves who the user is must still come from your server.

## Use

```dart
import 'package:clickfix_visitor/clickfix_visitor.dart';

final client = ClickFixVisitor(
  publicId: 'WIDGET_ID',                          // public widget id
  baseUrl: 'https://support.example.com/api',     // your ClickFix app + /api
  app: const ClickFixApp(key: 'APP_KEY', packageName: 'com.example.app'),
  token: savedToken,                              // resume ('' for a new visitor)
  onToken: saveToken,                             // persist every change
  language: 'tr',
);

final boot = await client.init();                 // settings, team, conversations
await client.identify(WidgetIdentifyInput(
  userId: user.id,
  userHash: await fetchUserHashFromYourServer(), // HMAC-SHA256 on the server
  name: user.name,
));

final sent = await client.createConversation(const WidgetSendInput(text: 'Hello'));
final poller = client.poll(sent.conversationUuid)..start();
poller.messages.listen((m) => print('${m.senderName}: ${m.content}'));

await client.sendMessage(
  sent.conversationUuid,
  const WidgetSendInput(text: 'Screenshot attached'),
  file: WidgetFile(bytes: png, filename: 'screen.png', contentType: 'image/png'),
);
```

- `client.track(name, properties)` records app events; the next message
  carries the last 20, so agents see what the user did before writing.
- `client.setScreen('checkout')` sets the `page_url` of bootstrap and
  messages.
- `client.reset()` forgets the visitor on logout.
- `client.token` is the visitor token the webview bridge's `clickfix:session`
  command takes over, and `client.adoptToken(token)` continues a session the
  hosted widget started (its `clickfix:session` message). `clickfix_webview`
  does not send or forward that command yet.
- Errors are `ClickFixApiException` (`status`, `code`, `message`,
  `requestId`); a closed conversation answers `409`, start a new one.
- Every route is also available as a typed call on `client.api`
  (`WidgetApi`), with the same token, retries and renewal.
- Realtime: `client.realtimeToken()` returns Centrifugo tokens for a
  connection of your own (for example `package:centrifuge`); polling needs
  none.

A complete app: [example/lib/main.dart](example/lib/main.dart).

## Generated code

`lib/src/generated/` (`WidgetApi` and the models) is generated from the
ClickFix OpenAPI contract by the SDK repository's `make sdks` and checked for
staleness in CI; do not edit it by hand. Enums are plain strings, so a value
a newer API adds does not break an older app. Session-replay and co-browsing
routes are browser-only and not part of this client.
