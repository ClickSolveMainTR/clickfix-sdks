# @getclickfix/visitor-core

Versioning: [SemVer](https://semver.org). In `0.x` a minor version (`0.N`) may carry a breaking change; every breaking change is listed here under **Breaking**. The version lives in `package.json`; a release is published to npm automatically.

## 0.2.0 - 2026-11-12

- Bridge: `clickfix:event` messages are typed per event. `BridgeEventMap` holds the payload of every event the widget forwards (`unread`, `identify`, `message`, `conversation:ended`, ...), `BridgeEvent` is the message union and `EVENT_NAMES` the list; narrowing on `event` gives the payload type (`m.event === 'unread'` → `m.payload.count`).
- **Breaking** (types and parsing): the `clickfix:event` member of `BridgeMessage` was `{ event: string; payload: unknown }`. `parseMessage` now returns null for an event name outside `EVENT_NAMES` or a message without an object payload, like any other foreign traffic.
- `CORE_VERSION` (sent as `sdk_version` with bootstrap) follows the package version: `core-0.2.0`.
- Docs: `baseURL` is the ClickFix app origin plus `/api` (`https://getclickfix.com/api`, the origin that serves `widget-embed.html`); `api.getclickfix.com` is the server API for API keys and does not serve visitor routes. Browser mode also works across origins with that absolute URL.
- Types: properties with a server default are optional in request bodies.

## 0.1.1 - 2026-11-11

- Package metadata: `repository` and `bugs` point at the public mirror `ClickSolveMainTR/clickfix-sdks` (`visitor-core/`). No code change.

## 0.1.0 - 2026-11-13

First release. The transport layer of `@getclickfix/react-widget` moved here; no DOM and no `window` (tsconfig `lib: ES2022`), so it runs on React Native (Hermes), Node 22+ and in browsers.

- `createVisitorClient`: bootstrap, `identify` (`user_hash`, contact and company external ids), profile, custom fields (`setAttributes`), conversation list / messages / read receipts / typing, attachments (`Blob` or a React Native `{uri,name,type}`), event and screen context (`track`, `setScreen`), help search, rating, realtime token. Browser mode uses the page origin; `app` mode sends the `X-ClickFix-App-Key` and `X-ClickFix-App-Package` headers.
- Bounded retries (GET and writes carrying a `client_id`; `Retry-After`) and one session renewal on `WIDGET_VISITOR_TOKEN_INVALID`.
- `createRealtime`: Centrifugo JSON client (one channel, reconnect with backoff); the WebSocket constructor or the whole socket layer can be injected.
- Bridge types and helpers: `BridgeCommand`, `BridgeMessage`, `encodeCommand`, `commandScript`, `parseMessage`, `isSafeLink`; session handover with `clickfix:session` (`getToken` / `adoptToken`).
- `identify`: `company.id` is the company's external id and `user_hash` may sign it too (`hex(HMAC-SHA256(secret, user_id + "\n" + company_id))`); `Visitor.company_verified` in the answer reports a signed company. A hash of `user_id` alone keeps working.
