# github.com/ClickSolveMainTR/clickfix-sdks/go

Sürümleme: Go modülü etiketleri `go/vX.Y.Z` biçimindedir ve sürüm `sdks/go/VERSION` dosyasındadır. `main`'e birleşen bir değişiklikte `VERSION` değiştiyse CI (`release-tag` işi) etiketi basar; elle etiket basılmaz. `v0.x` içinde küçük sürüm kırıcı değişiklik taşıyabilir; her kırıcı değişiklik burada **Kırıcı** başlığıyla yazılır.

## v0.2.0 - 2026-11-10

- `IdentityCompanyHash(secret, userID, companyID)`: widget `user_hash` değeri kullanıcı ve firma kimliğini birlikte imzalar (`hex(HMAC-SHA256(secret, userID + "\n" + companyID))`, CF-206); `identify` çağrısında `company: { id: companyID }` ile gönderilir. Boş `companyID` ile `IdentityHash` sonucunu verir; `IdentityHash` değişmedi.

## v0.1.0 - 2026-11-12

İlk yayın (CF-199).

- `New`: `oapi-codegen` ile üretilen `/v1/public-api/*` istemcisi; Bearer anahtar, 30 sn zaman aşımı, `RetryClient` (GET ve `Idempotency-Key` taşıyan yazmalarda en çok 5 deneme, `Retry-After`).
- `Iterate`, `ListPage`: ofset sayfalama.
- `VerifyWebhook`: `ClickFix-Webhook-*` imzasını ham gövde üzerinde doğrular.
- `IdentityHash`: widget `user_hash` değeri (sunucuda).
- Modül yolu `github.com/ClickSolveMainTR/clickfix-sdks/go` (eski `furkanmeclis` yolu kullanılmaz).
