# @getclickfix/react-native

Sürümleme: [SemVer](https://semver.org). `0.x` sürümlerinde küçük sürüm (`0.N`) kırıcı değişiklik taşıyabilir; her kırıcı değişiklik burada **Kırıcı** başlığıyla yazılır. Sürüm `package.json` içindedir; `main`'e birleşen bir değişiklikte sürüm değiştiyse CI (`sdk-publish`) npm'e yayımlar ve ayna repoda `react-native/vX.Y.Z` etiketi basılır.

## 0.1.0 - 2026-11-11

İlk yayın (CF-202). Bare React Native çekirdeği: `@getclickfix/visitor-core` (app modu, `X-ClickFix-App-Key` + paket adı) üzerine React bağları; DOM yok (tsconfig `lib: ES2022`, `types: []`), Hermes uyumlu ESM, yalnız `react` ve `react-native` peer (`react-native-keychain` isteğe bağlı).

- `ClickFixProvider`: tek istemci, `getUserHash` ile sunucudan `user_hash`, `SecureStorage` ile belirteç saklama (varsayılan bellek; `keychainStorage` adaptörü), React Native `WebSocket` ile realtime, ön plana dönüşte yenileme, `autoInit`/`init()`.
- Hook'lar: `useClickFix`, `useVisitor` (identify: kişi + firma dış kimliği, profil, özel alanlar, `track`, `setScreen`, `reset`), `useConversations` (bootstrap listesi, `create`), `useConversation` (mesajlar eskiden yeniye, `send` metin ve/veya dosya, `loadMore`, `setTyping`, `markRead`, `agentTyping`, realtime + soket yokken anket), `useHelpSearch` (debounce), `useRating`.
- Derin bağlantı: `parseConversationLink`, `useDeepLinkConversation` (`?conversation=`, `/conversation/<id>`, Expo Go `/--/` yolu).
- `@getclickfix/react-native/ui`: `ConversationListScreen`, `ChatScreen` (ön form, dosya ekleme, yazıyor, okundu, puanlama), `PreChatForm`; `ClickFixThemeProvider`, `lightTheme`/`darkTheme`, `labelsEn`/`labelsTr`. StyleSheet ile temalanabilir, ek bağımlılık yok.
