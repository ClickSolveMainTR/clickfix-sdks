# @getclickfix/expo

Sürümleme: [SemVer](https://semver.org). `0.x` sürümlerinde küçük sürüm (`0.N`) kırıcı değişiklik taşıyabilir; her kırıcı değişiklik burada **Kırıcı** başlığıyla yazılır. Sürüm `package.json` içindedir; `main`'e birleşen bir değişiklikte sürüm değiştiyse CI (`sdk-publish`) npm'e yayımlar ve ayna repoda `expo/vX.Y.Z` etiketi basılır.

## 0.1.0 - 2026-11-11

İlk yayın (CF-202). `@getclickfix/react-native`'i sarar ve tüm yüzeyini yeniden dışa aktarır; Expo SDK 54+ (hedef 58).

- `ClickFixExpoProvider`: tek satır kurulum; belirteç `expo-secure-store`'da, paket adı `expo-constants` (`ios.bundleIdentifier` / `android.package`) üzerinden, Expo Go'da `packageName` zorunlu.
- `secureStoreStorage`, `fileAttachment` / `pickAttachment` (`expo-file-system` `File`, boyut sınırı, MIME tahmini), `conversationURL` / `useExpoDeepLinkConversation` (`expo-linking`), `appPackageName` / `appVersion` / `isExpoGo`.
