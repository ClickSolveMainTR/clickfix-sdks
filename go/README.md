# ClickFix Go server SDK

```sh
go get github.com/ClickSolveMainTR/clickfix-sdks/go@latest
```

Releases are tagged `go/vX.Y.Z` in the public mirror repository [ClickSolveMainTR/clickfix-sdks](https://github.com/ClickSolveMainTR/clickfix-sdks) (see [CHANGELOG.md](./CHANGELOG.md)); the source of truth is `sdks/go` in the main codebase. Full walkthrough: https://getclickfix.com/docs/integration-guide.

```go
import (
    "context"
    "os"
    clickfix "github.com/ClickSolveMainTR/clickfix-sdks/go"
)

client, err := clickfix.New("https://support.example.com", os.Getenv("CLICKFIX_API_KEY"))
if err != nil { panic(err) }
result, err := client.GetV1PublicApiContactsWithResponse(context.Background(),
    &clickfix.GetV1PublicApiContactsParams{})
_ = result
_ = err
```

Use the API origin (no `/api` or `/v1` suffix). Keys fix the organization;
permissions and key scopes are both enforced. Keep keys on your server.
Generated operations expose typed bodies and response envelopes. For writes,
set their `IdempotencyKey` parameter to a stable unique key for that logical action.
`New` adds a 30s HTTP timeout and retries GETs or replayable keyed writes up to
three total attempts, with exponential backoff and bounded `Retry-After`.
Do not reuse a key for different input. The API stores completed write responses,
including errors; a retry cannot turn a stored failed response into success.

```go
type Contact struct { UUID string `json:"uuid"`; Name string `json:"name"` }
err = clickfix.Iterate(ctx,
    func(ctx context.Context, limit, offset int) (clickfix.Page[Contact], error) {
        return clickfix.ListPage[Contact](ctx, client, "contacts", limit, offset)
    },
    func(contact Contact) bool { /* process */ return true },
)
```

Offset iteration is for bounded snapshots; concurrent inserts can shift pages.
Deduplicate public UUIDs when synchronizing; triggers use their generated cursor API.

```go
err = clickfix.VerifyWebhook(secret,
    r.Header.Get("ClickFix-Webhook-Timestamp"),
    r.Header.Get("ClickFix-Webhook-Signature"), rawBody, time.Now(), 5*time.Minute)
```

Read a size-limited raw request body before parsing JSON, reject verification
errors, and persist/deduplicate `ClickFix-Webhook-Id` before side effects.
`IdentityHash(identitySecret, userID)` supplies the widget's `user_hash`; send
only the resulting hash to your authenticated browser client. For a user that
belongs to a company use `IdentityCompanyHash(identitySecret, userID, companyID)`
(`hex(HMAC-SHA256(secret, userID + "\n" + companyID))`, CF-206) and send
`company: { id: companyID }` in `identify`: the widget then binds the user to that
company and nobody can claim another one.

Regenerate from the repository root with `make sdks`. Generated code is never edited.
