# clickfix_webview example

A two-screen app: the first screen fetches `{ user_id, user_hash }` from
*your* server (stubbed here), the second shows the ClickFix support webview,
hands the session over on `clickfix:ready`, tracks an app event, opens a
conversation by deep link, forwards external links to the system browser and
pops the screen on the widget's `close` event.

```sh
flutter create . --platforms=android,ios   # once: generates the platform folders
flutter run --dart-define=CLICKFIX_WIDGET_ID=<your widget id>
```

`CLICKFIX_ORIGIN` (default `https://getclickfix.com`) and
`CLICKFIX_CONVERSATION` (a conversation UUID to open on launch) are optional
`--dart-define`s. Replace `fakeSupportSession` with a call to your backend; the
identity secret must stay on the server.
