# clickfix_visitor example

A native support screen built on the `clickfix_visitor` client, without a
webview: it starts (or resumes) the visitor session with the mobile app key,
identifies the signed-in user with a `user_hash` from *your* server (stubbed
here), lists the visitor's conversations, opens one or starts a new one,
sends messages and receives the agent's replies by polling.

```sh
flutter create . --platforms=android,ios   # once: generates the platform folders
flutter run \
  --dart-define=CLICKFIX_BASE_URL=https://support.example.com/api \
  --dart-define=CLICKFIX_WIDGET_ID=<public widget id> \
  --dart-define=CLICKFIX_APP_KEY=<mobile app key> \
  --dart-define=CLICKFIX_APP_PACKAGE=<bundle id / application id>
```

Create the mobile app key in the panel (Web widget → Advanced → Mobile apps)
for the same bundle id / application id the app is built with. Replace
`fakeSupportSession` with a call to your backend; the identity secret must
stay on the server. Persist `ClickFixVisitor.token` (for example with
`flutter_secure_storage`) to resume the same visitor on the next start.
