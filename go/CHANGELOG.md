# github.com/ClickSolveMainTR/clickfix-sdks/go

Versioning: module tags are `go/vX.Y.Z`; the version lives in `VERSION`. In `v0.x` a minor version may carry a breaking change; every breaking change is listed here under **Breaking**.

## v0.3.0 - 2026-11-12

- `go.mod` declares `go 1.24.0` (the minimum of its dependency `oapi-codegen/runtime`) instead of pinning the patch release `go 1.26.11`, so consumers on older toolchains no longer download a newer Go.
- `DecodeData[T](env *IntegrationEnvelope)`: decodes the untyped `Data` of the generic response envelope into your own type, e.g. `DecodeData[Page[Company]](res.JSON200)`.
- `ListPageQuery[T]`: `ListPage` with extra query parameters (`external_id`, `q`, ...); `ListPage` is unchanged.
- `CompanyEventInput.Source` stays an optional pointer: leave it nil and the API uses `api`.
- Generated comments no longer carry internal tracker references.

## v0.2.0 - 2026-11-10

- `IdentityCompanyHash(secret, userID, companyID)`: the widget `user_hash` signs the user id and the company id together (`hex(HMAC-SHA256(secret, userID + "\n" + companyID))`); send it with `company: { id: companyID }` in `identify`. An empty `companyID` gives the `IdentityHash` result; `IdentityHash` is unchanged.

## v0.1.0 - 2026-11-12

First release.

- `New`: the `/v1/public-api/*` client generated with `oapi-codegen`; Bearer key, 30 s timeout, `RetryClient` (at most 5 attempts for GET and for writes with an `Idempotency-Key`, `Retry-After`).
- `Iterate`, `ListPage`: offset pagination.
- `VerifyWebhook`: checks the `ClickFix-Webhook-*` signature over the raw body.
- `IdentityHash`: the widget `user_hash` (server side).
