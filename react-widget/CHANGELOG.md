# @getclickfix/react-widget

Versioning: [SemVer](https://semver.org). In `0.x` a minor version (`0.N`) may carry a breaking change; every breaking change is listed here under **Breaking**. The version lives in `package.json`; a release is published to npm automatically.

## 0.2.0 - 2026-11-12

- Server rendering: `useClickFix`, `useClickFixEvent` and `clickFix()` no longer read `window` while rendering, so a component that uses them renders under Next.js SSR and static prerendering without a client-only wrapper. The returned `sdk` resolves `window.ClickFix` when called (from an effect or a handler) and throws a clear error if called on the server.
- Before `widget.js` has loaded, method calls on the returned `sdk` (`sdk.reset()`, `sdk.track(...)`) are queued like the command form.
- `createWidgetClient({ appOrigin })`: the UI-free client calls `<appOrigin>/api/v1/widget/...` across origins (CORS, no cookies; add your site to the widget's allowed domains). Before, it worked only behind a same-origin proxy at `/api`. `baseURL` still wins when set.
- Types: `sdk('reset')` returns `Promise<void>` like `sdk.reset()` (the command overload said `void`; `widget.d.ts` changed the same way).
- Requires `@getclickfix/visitor-core` 0.2 (typed bridge events).

## 0.1.2 - 2026-11-11

- Package metadata: `repository` and `bugs` point at the public mirror `ClickSolveMainTR/clickfix-sdks` (`react-widget/`). No code change.

## 0.1.1 - 2026-11-13

- The transport moved to `@getclickfix/visitor-core`; `createWidgetClient` is now the core's browser mode with the same behaviour and API. `WidgetError` is the core's `VisitorError` (`status`, `code`, plus `requestId`).
- From the core: automatic session renewal on `WIDGET_VISITOR_TOKEN_INVALID`, bounded retries for GET and sends carrying a `client_id`, `track` / `setScreen` / `setAttributes` / `markRead` / `getToken` / `adoptToken`.
- `paths` and `components` are re-exported from the core (`react-widget/src/schema.d.ts` was removed).
- The `identify` event carries `company_verified`; `company.id` binds only when `user_hash` signs it too.

## 0.1.0 - 2026-11-12

First release.

- `loadClickFix`, `clickFix`, `useClickFix`, `useClickFixEvent`: typed hooks that load the ready-made widget (`widget.js`, SDK 2.1) from React.
- `createWidgetClient`, `useWidget`, `useConversations`, `useMessages`, `useHelpSearch`, `useTyping`: a UI-free visitor client for your own interface.
- A copy of the `widget.d.ts` contract (`ClickFixSDK`, events, `ClickFixBridge` webview bridge types).
