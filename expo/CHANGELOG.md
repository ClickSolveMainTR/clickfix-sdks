# @getclickfix/expo

Versioning: [SemVer](https://semver.org). In `0.x` a minor version (`0.N`) may carry a breaking change; every breaking change is listed here under **Breaking**. The version lives in `package.json`; a release is published to npm automatically and tagged `expo/vX.Y.Z` in the mirror.

## 0.2.0 - 2026-11-12

- Built on `@getclickfix/react-native` 0.2 and re-exports it: the webview bridge helpers and typed `clickfix:event` payloads are available from `@getclickfix/expo` too. No Expo-specific change.

## 0.1.0 - 2026-11-11

First release. Wraps `@getclickfix/react-native` and re-exports all of it; Expo SDK 54+ (built against 58).

- `ClickFixExpoProvider`: one-line setup; the token lives in `expo-secure-store`, the package name comes from `expo-constants` (`ios.bundleIdentifier` / `android.package`), `packageName` is required in Expo Go.
- `secureStoreStorage`, `fileAttachment` / `pickAttachment` (`expo-file-system` `File`, size limit, MIME detection), `conversationURL` / `useExpoDeepLinkConversation` (`expo-linking`), `appPackageName` / `appVersion` / `isExpoGo`.
