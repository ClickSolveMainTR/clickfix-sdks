# Changelog

## 0.1.0

- First release: `ClickFixVisitor`, a native client of the ClickFix visitor
  API for Flutter and Dart apps, authenticated with a mobile app key
  (`X-ClickFix-App-Key` + `X-ClickFix-App-Package`). Visitor session
  (bootstrap, resume with a persisted token, renewal when the token is
  rejected), `identify` with a server-signed `user_hash`, profile and
  attributes, `track` events carried by the next message, conversations,
  messages (JSON or one file as `multipart/form-data`, idempotent
  `client_id`), typing, read receipts, ratings, help search and realtime
  tokens.
- `MessagePoller`: new messages of a conversation as a stream, with an
  `after` cursor and exponential backoff on errors.
- `WidgetApi` and the models are generated from the ClickFix OpenAPI
  contract (`/v1/widget/*`); `HttpWidgetTransport` adds bounded retries for
  idempotent requests (`429`, `502`-`504`, `Retry-After`) and refuses
  redirects. No UI.
