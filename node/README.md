# @getclickfix/node

Node 22+, ESM, no runtime dependencies.

```sh
npm install @getclickfix/node
```

Full walkthrough (identity, external ids, custom fields, events, API channel, webhooks): https://getclickfix.com/docs/integration-guide. Changes: [CHANGELOG.md](./CHANGELOG.md). Develop with `cd sdks && pnpm build`.

```ts
import { createClient, paginate, verifyWebhook, identityHash } from '@getclickfix/node';
const client = createClient({
  baseURL: 'https://support.example.com',
  apiKey: process.env.CLICKFIX_API_KEY!,
});
const result = await client.request('/v1/public-api/conversations', 'post', {
  contact_uuid: contactUUID, inbox_uuid: inboxUUID, subject: 'Delivery question',
}, { idempotencyKey: 'order-42-support', signal: AbortSignal.timeout(30_000) });
```

Paths, bodies, operation responses and component types come from the canonical
OpenAPI public integration surface. `path: {uuid}` fills path parameters; `query`
sets query parameters. Keys are server-only, organization-bound and scope-limited.
Error responses throw `APIError` with status, code, request ID and error details.
Pass an AbortSignal to bound total time. GETs and keyed writes retry three total
attempts by default (cap five), using exponential backoff and bounded Retry-After.
Each retry reuses the exact body and key. Unkeyed mutations never retry. The API
replays completed write responses, including errors; use a new logical action/key
when correcting failed input. Redirects are refused to avoid forwarding credentials.

```ts
for await (const item of paginate(async (limit, offset) => {
  const envelope = await client.request('/v1/public-api/contacts', 'get', undefined,
    { query: { limit, offset } });
  // Some legacy OpenAPI envelopes are unknown: validate envelope.data with your
  // application's runtime schema, returning {items,total,limit,offset}.
  return validateContactPage(envelope.data);
})) { await consume(item); }
```

Offset iteration stops on empty pages. Deduplicate UUIDs during concurrent writes;
use the generated trigger cursor API for incremental synchronization.

```ts
const valid = verifyWebhook(secret, headers.timestamp, headers.signature, rawBody);
const userHash = identityHash(identitySecret, authenticatedUser.id);
// User that belongs to a company: sign both ids, send company: { id } in identify
const companyUserHash = identityHash(identitySecret, authenticatedUser.id, authenticatedUser.companyId);
```

Webhook verification uses HMAC-SHA256 over exact `timestamp.body` bytes and a
five-minute past/future tolerance. Verify before JSON parsing; persist/deduplicate
`ClickFix-Webhook-Id` before acting. Identity secrets stay on your server; send only
`userHash` to the widget. With a company id the hash is
`hex(HMAC-SHA256(secret, userId + "\n" + companyId))` (CF-206): the widget then binds the
user to that company and nobody can claim another one; a hash over the user id alone keeps
working but leaves `company.id` unlinked. Regenerate with `make sdks`, verify with `make sdks-check`.
