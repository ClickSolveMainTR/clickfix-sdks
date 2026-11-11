# Changelog

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
  contract 1.2, CF-206); documented on `ClickFixIdentity`.
