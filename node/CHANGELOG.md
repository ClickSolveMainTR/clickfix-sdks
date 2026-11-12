# @getclickfix/node

Versioning: [SemVer](https://semver.org). In `0.x` a minor version (`0.N`) may carry a breaking change; every breaking change is listed here under **Breaking**. The version lives in `package.json`; a release is published to npm automatically.

## 0.2.2 - 2026-11-12

- Types: the body of `PUT /v1/public-api/contacts/by-external-id` is `ContactInput & { external_id: string }`. It was `ContactInput & Record<string, never>`, which no object satisfies under `strict`, so a cast was needed.
- Types: properties with a server default are optional in request bodies. `CompanyEventInput.source` no longer has to be sent (the API uses `api`).
- No runtime change.

## 0.2.1 - 2026-11-11

- Package metadata: `repository` and `bugs` point at the public mirror `ClickSolveMainTR/clickfix-sdks` (`node/`). No code change.

## 0.2.0 - 2026-11-10

- `identityHash(secret, userId, companyId?)`: with `companyId` the widget `user_hash` signs the user id and the company id together (`hex(HMAC-SHA256(secret, userId + "\n" + companyId))`); send it with `company: { id: companyId }` in `identify`. The two-argument form is unchanged. An empty secret or an id containing a line break throws.

## 0.1.0 - 2026-11-12

First release.

- `createClient`: typed `request` for the `/v1/public-api/*` routes; `APIError` (status, code, `request_id`, details).
- Bounded retries for GET and for writes that carry an `Idempotency-Key` (3 attempts by default, at most 5; exponential backoff, `Retry-After`).
- `paginate`: walks `{items,total,limit,offset}` pages.
- `verifyWebhook`: checks the `ClickFix-Webhook-*` signature over the raw body (5 minute tolerance).
- `identityHash`: the widget `user_hash` (server side).
