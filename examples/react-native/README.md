# React Native (Expo) örneği (CF-202)

`@getclickfix/expo` ile Expo 58 uygulaması: giriş simülasyonu, sunucudan
`user_hash` alma, `identify` (kişi + firma dış kimliği, özel alanlar, olay),
konuşma listesi ve sohbet ekranları (`@getclickfix/react-native/ui`), derin
bağlantı ile belirli konuşmayı açma.

| Dosya | Ne |
|---|---|
| `App.tsx` | Uygulama: `ClickFixExpoProvider`, ekranlar, derin bağlantı |
| `config.ts` | `EXPO_PUBLIC_*` ile uygulama anahtarı, widget id, sunucu adresi |
| `server.mjs` | `user_hash` imzalayan küçük Node sunucusu (`GET /support-session?user_id=`); aynı formül `@getclickfix/node` `identityHash` ve [`examples/node/01-user-hash.ts`](../node/01-user-hash.ts) |
| `app.json` | `scheme: clickfixexample`, `com.example.clickfix` paket adı |

## Çalıştırma

```sh
cd sdks && pnpm install && pnpm build        # paketleri derler (dist)
cd examples/react-native
CLICKFIX_IDENTITY_SECRET=... node server.mjs # user_hash sunucusu, :8787
EXPO_PUBLIC_CLICKFIX_BASE_URL=https://support.example.com \
EXPO_PUBLIC_CLICKFIX_WIDGET_ID=... EXPO_PUBLIC_CLICKFIX_APP_KEY=cf_app_... \
EXPO_PUBLIC_SUPPORT_SERVER_URL=http://<bilgisayarınızın-LAN-adresi>:8787 \
npx expo start
```

Panelde Web widget → Gelişmiş → Mobil uygulamalar altında `com.example.clickfix`
için bir anahtar oluşturun. **Expo Go**'da çalışan uygulamanın paket adı Expo
Go'nunkidir; bunun için ayrı bir geliştirme anahtarı (ör. `com.example.clickfix.dev`)
oluşturup `EXPO_PUBLIC_CLICKFIX_PACKAGE_NAME=com.example.clickfix.dev` verin.
Geliştirme derlemesi (`npx expo run:ios|android`) gerçek paket adını kullanır.

Derin bağlantı: `npx uri-scheme open "clickfixexample://conversation/<uuid>" --ios`
(Expo Go'da `exp://<host>:8081/--/conversation/<uuid>`).

## Doğrulama

```sh
pnpm exec tsc --noEmit -p .   # CI: pnpm examples:check
pnpm exec expo-doctor         # CI: pnpm examples (ağ gerekir)
```

Gerçek bir widget ile uçtan uca test bulut CI'da yapılamaz; hook'lar ve
ekranlar `sdks/react-native/tests` ve `sdks/expo/tests` altında sahte widget
API'si ile test edilir (`pnpm test:native`).

> `expo-doctor` 1.21.7 (11 Kas 2026) `@expo/env` 2.6 ister, Expo 58 ise
> `~2.5.4` ile gelir; bu yüzden örnek `expo-doctor` 1.21.6'ya sabitlenmiştir.
