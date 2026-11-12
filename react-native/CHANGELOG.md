# @getclickfix/react-native

Versioning: [SemVer](https://semver.org). In `0.x` a minor version (`0.N`) may carry a breaking change; every breaking change is listed here under **Breaking**. The version lives in `package.json`; a release is published to npm automatically and tagged `react-native/vX.Y.Z` in the mirror.

## 0.2.0 - 2026-11-12

- Re-exports the webview bridge helpers of `@getclickfix/visitor-core` (`commandScript`, `parseMessage`, `isSafeLink`, `encodeCommand`, `EVENT_NAMES`, `BRIDGE_VERSION` and the `Bridge*` types), so an app can also host the ready-made widget page in `react-native-webview` and hand it the provider's session (`{ type: 'clickfix:session', token: client.getToken() }`).
- Requires `@getclickfix/visitor-core` 0.2: `clickfix:event` payloads are typed per event (see its changelog, **Breaking** for code that matched arbitrary event names).

## 0.1.0 - 2026-11-11

First release. The bare React Native core: React bindings over `@getclickfix/visitor-core` in app mode (`X-ClickFix-App-Key` plus package name); no DOM (tsconfig `lib: ES2022`, `types: []`), Hermes-compatible ESM, only `react` and `react-native` as peers (`react-native-keychain` optional).

- `ClickFixProvider`: one client, `user_hash` from your server through `getUserHash`, token storage through `SecureStorage` (memory by default; `keychainStorage` adapter), realtime over React Native's `WebSocket`, refresh on foreground, `autoInit` / `init()`.
- Hooks: `useClickFix`, `useVisitor` (identify with contact and company external ids, profile, custom fields, `track`, `setScreen`, `reset`), `useConversations` (bootstrap list, `create`), `useConversation` (messages oldest first, `send` text and/or a file, `loadMore`, `setTyping`, `markRead`, `agentTyping`, realtime with polling while the socket is down), `useHelpSearch` (debounced), `useRating`.
- Deep links: `parseConversationLink`, `useDeepLinkConversation` (`?conversation=`, `/conversation/<id>`, the Expo Go `/--/` path).
- `@getclickfix/react-native/ui`: `ConversationListScreen`, `ChatScreen` (pre-chat form, attachments, typing, read receipts, rating), `PreChatForm`; `ClickFixThemeProvider`, `lightTheme` / `darkTheme`, `labelsEn` / `labelsTr`. Themeable with StyleSheet, no extra dependency.
