# @getclickfix/node

Sürümleme: [SemVer](https://semver.org). `0.x` sürümlerinde küçük sürüm (`0.N`) kırıcı değişiklik taşıyabilir; her kırıcı değişiklik burada **Kırıcı** başlığıyla yazılır. Sürüm `package.json` içindedir; `main`'e birleşen bir değişiklikte sürüm değiştiyse CI (`sdk-publish`) npm'e yayımlar.

## 0.2.0 - 2026-11-10

- `identityHash(secret, userId, companyId?)`: `companyId` verilirse widget `user_hash` değeri kullanıcı ve firma kimliğini birlikte imzalar (`hex(HMAC-SHA256(secret, userId + "\n" + companyId))`, CF-206); `identify` çağrısında `company: { id: companyId }` ile gönderilir. İki parametreli kullanım aynı kalır. Boş anahtar ya da satır sonu içeren kimlik hata fırlatır.

## 0.1.0 - 2026-11-12

İlk yayın (CF-199).

- `createClient`: `/v1/public-api/*` uçları için tipli `request`; `APIError` (durum, kod, `request_id`, ayrıntılar).
- GET ve `Idempotency-Key` taşıyan yazmalarda sınırlı tekrar deneme (varsayılan 3, en çok 5; üstel bekleme, `Retry-After`).
- `paginate`: `{items,total,limit,offset}` sayfalarını dolaşır.
- `verifyWebhook`: `ClickFix-Webhook-*` imzasını ham gövde üzerinde doğrular (5 dk tolerans).
- `identityHash`: widget `user_hash` değeri (sunucuda).
