# @getclickfix/visitor-core

Sürümleme: [SemVer](https://semver.org). `0.x` sürümlerinde küçük sürüm (`0.N`) kırıcı değişiklik taşıyabilir; her kırıcı değişiklik burada **Kırıcı** başlığıyla yazılır. Sürüm `package.json` içindedir; `main`'e birleşen bir değişiklikte sürüm değiştiyse CI (`sdk-publish`) npm'e yayımlar.

## 0.1.0 - 2026-11-13

İlk yayın (CF-201). `@getclickfix/react-widget` içindeki taşıma katmanı buraya taşındı; DOM ve `window` yok (tsconfig `lib: ES2022`), React Native (Hermes), Node 22+ ve tarayıcıda çalışır.

- `createVisitorClient`: bootstrap, `identify` (`user_hash`, kişi ve şirket dış kimliği), profil, özel alanlar (`setAttributes`), konuşma listesi / mesajlar / okundu / yazıyor, dosya ekleme (`Blob` ya da RN `{uri,name,type}`), olay ve ekran bağlamı (`track`, `setScreen`), yardım araması, puanlama, realtime belirteci. Tarayıcı modunda aynı kökenli BFF, `app` modunda `X-ClickFix-App-Key` + `X-ClickFix-App-Package` başlıkları.
- Sınırlı yeniden deneme (GET ve `client_id` taşıyan yazmalar; `Retry-After`) ve `WIDGET_VISITOR_TOKEN_INVALID` cevabında bir kez oturum yenileme.
- `createRealtime`: Centrifugo JSON istemcisi (tek kanal, geri çekilmeli yeniden bağlanma); WebSocket yapıcısı ya da tüm soket katmanı enjekte edilebilir.
- Köprü tipleri ve yardımcıları: `BridgeCommand`, `BridgeMessage`, `encodeCommand`, `commandScript`, `parseMessage`, `isSafeLink`; `clickfix:session` ile oturum devri (`getToken` / `adoptToken`).
- `identify`: `company.id` firma kimliğidir ve `user_hash` onu da imzalayabilir (`hex(HMAC-SHA256(secret, user_id + "\n" + company_id))`, CF-206); cevaptaki `Visitor.company_verified` imzalı firmayı bildirir. Yalnız `user_id` imzası çalışmaya devam eder.
