# clickfix/sdk

ClickFix public API client for PHP 8.1+. PSR-18 transport (bring any client; Guzzle recommended), PSR-17 factories via `php-http/discovery`, typed errors, bounded retries, offset pagination, webhook signature verification and widget identity hashes. MIT.

```sh
composer require clickfix/sdk guzzlehttp/guzzle
```

Full walkthrough (identity, external ids, custom fields, company, events, API channel, webhooks): https://getclickfix.com/docs/integration-guide. Changes: [CHANGELOG.md](./CHANGELOG.md). Laravel: the `clickfix/laravel` package wraps this client.

```php
use ClickFix\Client;

$client = new Client('https://api.getclickfix.com', getenv('CLICKFIX_API_KEY'));

$contact = $client->contacts()->upsertByExternalId('1001', [
    'name' => 'Ada Lovelace',
    'email' => 'ayse@example.com',
], idempotencyKey: 'user-1001-sync-42');

foreach ($client->contacts()->all(['q' => 'acme']) as $item) {
    // every matching contact, page by page
}
```

Keys stay on your server, are organization-bound and scope-limited. Writes carry an `Idempotency-Key`; pass a stable key naming the logical action (order number, your event id) and send the same value on a retry, or let the SDK generate one. GETs and keyed writes retry three total attempts by default (cap five) on 429/502/503/504 and network errors, with exponential backoff and a bounded `Retry-After`. The API stores completed write responses, including errors; use a new key when correcting failed input.

Error responses throw a subclass of `ClickFix\Exception\ApiException` with `status`, `errorCode`, `requestId`, `details` and the decoded `body`: `AuthenticationException` (401), `ForbiddenException` (403), `NotFoundException` (404), `ConflictException` (409), `ValidationException` (400/422), `RateLimitException` (429, `retryAfter`), `ServerException` (5xx). Network failures throw `TransportException`. All implement `ClickFix\Exception\ClickFixException`.

```php
use ClickFix\UserHash;
use ClickFix\Webhooks;

$userHash = UserHash::make($identitySecret, $authenticatedUserId); // send only this to the widget

$ok = Webhooks::verify($secret, $headers['ClickFix-Webhook-Timestamp'], $headers['ClickFix-Webhook-Signature'], $rawBody);
```

Webhook verification is HMAC-SHA256 over the exact `timestamp.body` bytes with a five-minute window on both sides; verify before JSON decoding and deduplicate on `ClickFix-Webhook-Id` before acting. The identity hash and the webhook check produce the same bytes as `@getclickfix/node` and the Go module.

Source of truth is `sdks/php` in the ClickFix monorepo; the public [ClickSolveMainTR/clickfix-php](https://github.com/ClickSolveMainTR/clickfix-php) repository is a read-only mirror tagged `vX.Y.Z` for Packagist.

`ClickFix\Endpoints` is generated from `backend/docs/public-api.yaml` (`make sdks`); the resource classes are checked against it. Develop with `composer install && composer check` (php-cs-fixer, PHPStan level 8, PHPUnit).
