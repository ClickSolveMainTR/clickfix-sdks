# Changelog

## 0.1.2

- The package declares only the Dart constraint `sdk: ^3.10.0`. The extra `flutter: ">=3.38.0"` bound contradicted it: Flutter 3.38.0 bundles a 3.10.0 prerelease of Dart, so `pub get` failed on exactly that version. Any Flutter release whose Dart is a stable 3.10.0 or newer resolves.
- Docs and comments: no internal tracker references.

## 0.1.1

- Package metadata: `repository` and `issue_tracker` point at the public mirror `ClickSolveMainTR/clickfix-sdks`. No code change.

## 0.1.0

- First release: `ClickFixWebView` and `ClickFixController` implementing the
  ClickFix webview bridge contract v1 over the `ClickFixFlutter` JavaScript
  channel (identify, track, open, close, update, consent, reset, get-state;
  `clickfix:ready|event|link|result` as Dart streams and callbacks).
- Security: the webview loads the configured ClickFix origin only, navigation
  elsewhere is blocked, channel messages are accepted only while the page is on
  that origin, external links are forwarded only when `https:`.
- Deep links: `conversation` parameter and `open(conversation:)`.
- `ClickFixCompany.id` is the company's external id and may be covered by
  `userHash` (`HMAC-SHA256(secret, userId + "\n" + companyId)`, bridge
  contract 1.2); documented on `ClickFixIdentity`.
