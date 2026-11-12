# clickfix/sdk

Versioning: [SemVer](https://semver.org). In `0.x` a minor version (`0.N`) may carry a breaking change; every breaking change is listed here under **Breaking**. The version is the newest `## X.Y.Z` heading of this file and `Client::USER_AGENT` (`composer.json` carries no `version`). Releases are tagged `vX.Y.Z` in [ClickSolveMainTR/clickfix-php](https://github.com/ClickSolveMainTR/clickfix-php), which Packagist follows.

## 0.2.0 - 2026-11-12

- `UserHash::make($secret, $userId, $companyId = null)`: with a company id the widget `user_hash` signs the user id and the company id together (`hex(HMAC-SHA256(secret, user_id . "\n" . company_id))`); send it with `company: { id }` in `identify` and the widget reports `company_verified: true`. Without one the result is unchanged.
- `UserHash::forCompany($secret, $userId, $companyId)`: the same, with both ids required; an empty id or a line break throws `InvalidArgumentException`.
- Same bytes as `identityHash` in `@getclickfix/node` and `IdentityCompanyHash` in the Go module (cross-SDK test vectors).

## 0.1.0 - 2026-11-12

First release.

- `ClickFix\Client`: PSR-18 client and PSR-17 factories (`php-http/discovery`), Bearer key, JSON envelope decoding, `Idempotency-Key` (generated when not given), bounded retries for GET and keyed writes (3 attempts by default, at most 5; exponential backoff, `Retry-After`).
- Resources: `contacts()`, `companies()`, `customFields()`, `conversations()`, `events()`, `webhooks()`, `triggers()`; offset pagination with `Page` and `Paginator`.
- Typed errors: `AuthenticationException` (401), `ForbiddenException` (403), `NotFoundException` (404), `ConflictException` (409), `ValidationException` (400/422), `RateLimitException` (429), `ServerException` (5xx), `TransportException`.
- `ClickFix\UserHash::make`: the widget `user_hash` (server side), same bytes as Node and Go.
- `ClickFix\Webhooks::verify`: checks the `ClickFix-Webhook-*` signature over the raw body (5 minute tolerance), same as Node and Go.
- `ClickFix\ApiChannel`: sends messages to an API channel with the channel signing secret.
- `ClickFix\Endpoints`: the endpoint list generated from the public API spec; `EndpointsTest` checks the resource classes against it.
