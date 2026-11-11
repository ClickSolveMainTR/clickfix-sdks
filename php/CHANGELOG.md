# clickfix/sdk

Sürümleme: [SemVer](https://semver.org). `0.x` sürümlerinde küçük sürüm (`0.N`) kırıcı değişiklik taşıyabilir; her kırıcı değişiklik burada **Kırıcı** başlığıyla yazılır. Sürüm, bu dosyadaki en yeni `## X.Y.Z` başlığı ve `Client::USER_AGENT` değeridir (`composer.json`'a `version` yazılmaz). `main`'e birleşen bir değişiklikte CI'daki `sdks-mirror` işi `sdks/php`'yi [ClickSolveMainTR/clickfix-php](https://github.com/ClickSolveMainTR/clickfix-php) reposuna iter ve orada `vX.Y.Z` etiketini basar; Packagist (`clickfix/sdk`) bu repoyu izler.

## 0.1.0 - 2026-11-12

İlk yayın (CF-204).

- `ClickFix\Client`: PSR-18 istemci + PSR-17 fabrikalar (`php-http/discovery`), Bearer anahtar, JSON zarf çözümü, `Idempotency-Key` (verilmezse üretilir), GET ve anahtarlı yazmalarda sınırlı tekrar deneme (varsayılan 3, en çok 5; üstel bekleme, `Retry-After`).
- Kaynak sınıfları: `contacts()`, `companies()`, `customFields()`, `conversations()`, `events()`, `webhooks()`, `triggers()`; `Page` ve `Paginator` ile ofset sayfalama.
- Tipli hatalar: `AuthenticationException` (401), `ForbiddenException` (403), `NotFoundException` (404), `ConflictException` (409), `ValidationException` (400/422), `RateLimitException` (429), `ServerException` (5xx), `TransportException`.
- `ClickFix\UserHash::make`: widget `user_hash` değeri (sunucuda); Node/Go ile aynı.
- `ClickFix\Webhooks::verify`: `ClickFix-Webhook-*` imzasını ham gövde üzerinde doğrular (5 dk tolerans); Node/Go ile aynı.
- `ClickFix\ApiChannel`: API kanalına kanal imza anahtarıyla mesaj gönderir.
- `ClickFix\Endpoints`: `public-api.yaml`'dan üretilen uç listesi; `make sdks-check` ve `EndpointsTest` kaynak sınıflarını buna karşı denetler.
