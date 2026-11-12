# @getclickfix/visitor-core

The ClickFix visitor (widget) API for any JavaScript runtime: React Native
(Hermes), Node 22+ and browsers. No UI, no DOM, no `window`; only `fetch`,
`FormData`, timers and (for realtime) a WebSocket-shaped constructor, all read
from `globalThis` or injected. ESM, no runtime dependencies.

```sh
npm install @getclickfix/visitor-core
```

Full walkthrough: https://getclickfix.com/docs/integration-guide. Changes:
[CHANGELOG.md](./CHANGELOG.md). Develop from `sdks` with `pnpm build`.

## Two modes, one client

| Mode | Credential | `baseURL` | Who |
|---|---|---|---|
| `browser` (default) | the page origin, checked against the widget's allowed domains | `/api` on the ClickFix app itself or behind your own same-origin proxy; from your own domain the absolute `https://<app>/api` (CORS, no cookies) | `@getclickfix/react-widget`, your own web UI |
| `app` | a **mobile app key** (`X-ClickFix-App-Key`) plus the app's package name (`X-ClickFix-App-Package`), created in Web widget → Advanced → Mobile apps | absolute, `https://<app>/api` | React Native / native SDKs |

Everything after that is the same: the visitor token, `identify` with a
server-computed `user_hash`, external ids, custom fields, rate limits. App
mode is for native code only: the API rejects an app key that arrives with
an `Origin`/`Referer`, and the headers are not CORS-allowed, so a page (or a
webview) cannot use a key; a webview continues the session over the bridge
instead.

**Which host.** `baseURL` is always the ClickFix **app** origin plus `/api`:
the origin that serves `widget.js` and `widget-embed.html` (for the hosted
service `https://getclickfix.com/api`, for a self-hosted install your own app
URL). The public server API host (`https://api.getclickfix.com`, `/v1/public-api/*`)
is a different surface for server-side API keys (`@getclickfix/node`, Go, PHP)
and does not serve the visitor routes; never put a server API key in an app.

```ts
import { createVisitorClient, createRealtime } from '@getclickfix/visitor-core';

const client = createVisitorClient({
  mode: 'app',
  baseURL: 'https://support.example.com/api',
  publicId: 'WIDGET_ID',
  app: { key: process.env.CLICKFIX_APP_KEY!, packageName: 'com.example.shop' },
  token: await storage.get('clickfix-token'),      // resume a saved session
  onToken: (t) => storage.set('clickfix-token', t), // '' on reset
  screen: 'orders',                                 // page_url of bootstrap and messages
  language: 'tr',
});
await client.init();
// user_hash from your server signs user_id and company.id together:
// hex(HMAC-SHA256(secret, '1001' + '\n' + 'F-77')); without a company, user_id alone.
await client.identify({ user_id: '1001', user_hash: fromYourServer, company: { id: 'F-77' } });
client.track('viewed_order', { id: 42 });           // rides with the next message
const { items } = await client.conversations();
await client.sendMessage(items[0].uuid, { text: 'Hello' }, { uri, name: 'photo.jpg', type: 'image/jpeg' });

const realtime = createRealtime({
  tokens: () => client.realtimeToken(),
  onEvent: (event) => refresh(event),
  onState: (connected) => setOnline(connected),
});
realtime.start();
```

- **Retries**: GET and idempotent writes (messages carry a `client_id`,
  bootstrap, read receipts, realtime tokens, attributes) retry up to three
  times on network errors and 429/502/503/504 with exponential backoff and
  `Retry-After`. `identify`, ratings and profile updates never retry.
- **Session renewal**: when the API rejects the visitor token
  (`WIDGET_VISITOR_TOKEN_INVALID`), the client bootstraps once (an expired
  token resumes the same visitor for 90 days) and replays the request with
  the new token. Concurrent renewals are merged.
- **Files**: a `Blob`/`File`, or a React Native `{ uri, name, type }` descriptor.
- **Screen context**: `setScreen(name)` and `track(name, props)`; the last 20
  events travel with the next message and are shown to the agent.
- `getToken()` / `adoptToken()` hand the session to and from a webview
  (`clickfix:session`, see below). `request(path, method, body, opts)` reaches
  routes the client does not wrap.

## Webview bridge types

The package exports the `postMessage` contract of the hosted widget page
(`docs/webview-bridge.md`): `BridgeCommand`, `BridgeMessage`,
`encodeCommand`, `commandScript` (the `injectJavaScript` snippet),
`parseMessage` (ignores anything that is not a widget message) and
`isSafeLink` (only `https:` links may leave the webview). `clickfix:event`
messages are typed per event (`BridgeEventMap`, `EVENT_NAMES`): narrow on the
name and the payload follows,

```ts
const m = parseMessage(event.nativeEvent.data);
if (m?.type === 'clickfix:event' && m.event === 'unread') setBadge(m.payload.count);
if (m?.type === 'clickfix:event' && m.event === 'identify' && !m.payload.company_verified) report();
```

An event name this version does not know is ignored like foreign traffic. Hand a native
session to the webview with `{ type: 'clickfix:session', token: client.getToken() }`;
the widget answers `clickfix:session` with its own token after `ready`,
`identify` and `reset`, which `client.adoptToken(token)` continues natively.

## Runtime notes

- Compiled against `lib: ["ES2022"]` with no DOM types; a test asserts the
  build never references `window`, `document`, `navigator`, storage or
  `URLSearchParams`.
- React Native: `fetch`, `FormData` and `WebSocket` are built in. `crypto.randomUUID`
  is used when present; otherwise ids come from `getRandomValues` or
  `Math.random` (they only deduplicate retries). Pass `randomUUID` to use your own.
- Node: works out of the box on 22+; pass `WebSocket` from `ws` on older runtimes.
