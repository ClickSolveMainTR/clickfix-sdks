# @getclickfix/react-widget

Sürümleme: [SemVer](https://semver.org). `0.x` sürümlerinde küçük sürüm (`0.N`) kırıcı değişiklik taşıyabilir; her kırıcı değişiklik burada **Kırıcı** başlığıyla yazılır. Sürüm `package.json` içindedir; `main`'e birleşen bir değişiklikte sürüm değiştiyse CI (`sdk-publish`) npm'e yayımlar.

## 0.1.1 - 2026-11-13

- Taşıma katmanı `@getclickfix/visitor-core` paketine taşındı (CF-201); `createWidgetClient` artık çekirdeğin tarayıcı modudur, davranış ve API aynıdır. `WidgetError` çekirdeğin `VisitorError` sınıfıdır (`status`, `code`, ek olarak `requestId`).
- Çekirdekten gelen yenilikler: `WIDGET_VISITOR_TOKEN_INVALID` cevabında otomatik oturum yenileme, GET ve `client_id` taşıyan gönderimlerde sınırlı yeniden deneme, `track` / `setScreen` / `setAttributes` / `markRead` / `getToken` / `adoptToken`.
- `paths` ve `components` tipleri çekirdekten yeniden dışa aktarılır (`react-widget/src/schema.d.ts` kaldırıldı).
- `identify` olayı `company_verified` taşır; `company.id` yalnız `user_hash` onu da imzalıyorsa bağlanır (CF-206, `clickfix.d.ts`).

## 0.1.0 - 2026-11-12

İlk yayın (CF-199).

- `loadClickFix`, `clickFix`, `useClickFix`, `useClickFixEvent`: hazır widget'ı (`widget.js`, SDK 2.1) React'ten yükleyen tipli kancalar.
- `createWidgetClient`, `useWidget`, `useConversations`, `useMessages`, `useHelpSearch`, `useTyping`: kendi arayüzünüz için arayüzsüz ziyaretçi istemcisi (aynı kökenli `/api/v1/widget/*`).
- `widget.d.ts` sözleşmesinin kopyası (`ClickFixSDK`, olaylar, `ClickFixBridge` webview köprüsü tipleri).
