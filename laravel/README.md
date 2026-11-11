# clickfix/laravel

ClickFix for Laravel **10, 11, 12 and 13** (PHP 8.1+): one package that wires `clickfix/sdk` into a
Laravel app. Service provider and `ClickFix` facade, `config/clickfix.php`, artisan commands, a signed
`POST clickfix/webhook` route that raises a Laravel event per ClickFix event, and the `@clickfixWidget`
Blade directive that boots the widget with a verified identity (`user_hash`).

MIT licensed. Developed in the `sdks/laravel` directory of the ClickFix monorepo and published through the
read-only repository [ClickSolveMainTR/clickfix-laravel](https://github.com/ClickSolveMainTR/clickfix-laravel),
which Packagist watches as `clickfix/laravel`: every release pushes this directory there and tags `vX.Y.Z`,
where `X.Y.Z` is the newest `## X.Y.Z` heading in `CHANGELOG.md`. Fixes land in the monorepo and ship with the
next release. Full walkthrough with every other platform: [Integration guide](https://getclickfix.com/docs/integration-guide).

## Install

```sh
composer require clickfix/laravel
php artisan clickfix:install
```

`clickfix:install` publishes `config/clickfix.php`, adds the `CLICKFIX_*` keys to `.env` (and empty ones
to `.env.example`), generates a webhook secret and prints the webhook URL to subscribe. Fill the keys and run
`php artisan clickfix:check`.

| `.env` key | Where it comes from |
|---|---|
| `CLICKFIX_API_KEY` | Organization → API and automations → API keys (`cf_sk_…`) |
| `CLICKFIX_BASE_URL` | `https://api.getclickfix.com` (no `/v1`) |
| `CLICKFIX_WIDGET_ID` | Web widget → Install |
| `CLICKFIX_IDENTITY_SECRET` | Web widget → Security → Identity verification; stays on the server |
| `CLICKFIX_WEBHOOK_SECRET` | `data.secret` of `POST /v1/public-api/webhooks`, or the generated value used as the subscription secret |
| `CLICKFIX_WEBHOOK_PATH` | route path, default `clickfix/webhook` |
| `CLICKFIX_WEBHOOK_QUEUE` | unset: events fire inside the request; `true` or a queue name: a queued job fires them |
| `CLICKFIX_TIMEOUT` | HTTP timeout in seconds for the package's own calls |

Package discovery registers the provider and the `ClickFix` alias; nothing to add to `config/app.php` or
`bootstrap/providers.php`.

## Widget and identity

```blade
    @clickfixWidget
</body>
```

Renders the queue snippet, `ClickFix("boot", {...})` and the async `widget.js` tag. Without arguments
the authenticated user is identified (`user_id` = model key, `user_hash` computed with the identity secret,
`name` and `email` from the model); nobody logged in means an anonymous widget. Variants:

```blade
@clickfixWidget($customer)                         {{-- a specific model --}}
@clickfixWidget(null)                              {{-- always anonymous --}}
@clickfixWidget(auth()->user(), ['locale' => 'tr', 'theme' => 'dark'])
```

The fields sent next to `user_id` come from `clickfix.widget.user` (attribute name or dotted path), or the
model implements `ClickFix\Laravel\Contracts\ProvidesClickFixIdentity` and returns the identity itself
(`user_id`, `name`, `email`, `phone`, `company`, `attributes`). Default boot options for every page live in
`clickfix.widget.options`.

Inertia, Livewire or a SPA that boots the widget itself:

```php
use ClickFix\Laravel\Facades\ClickFix;

ClickFix::userHash($user);   // hex HMAC-SHA256 of the model key
ClickFix::identity($user);   // ['user_id' => '42', 'user_hash' => '…', 'name' => …, 'email' => …]
```

Share `ClickFix::identity($user)` with the page and call `ClickFix("identify", identity)` in the browser.
The identity secret never leaves the server.

## Webhooks

The provider registers `POST /clickfix/webhook` (outside the `web` group: no session, no CSRF) behind the
`clickfix.webhook` middleware, which verifies `ClickFix-Webhook-Timestamp` and
`ClickFix-Webhook-Signature: v1=…` over the raw body (HMAC-SHA256, 5 minute tolerance by default,
constant-time comparison). A bad or stale signature is `401`, a missing secret `503`. Subscribe the URL
`clickfix:install` prints (public `https`) with `POST /v1/public-api/webhooks` or in the panel.

Every verified delivery raises `ClickFix\Laravel\Events\WebhookReceived` and, for a known event name, the
matching class: `ConversationCreated`, `ConversationResolved`, `ConversationAssigned`, `MessageReceived`,
`MessageSent`, `MessageFailed`, `ContactCreated`, `ContactUpdated`, `ContactMerged`, `CompanyCreated`,
`CompanyUpdated`, `SlaWarning`, `SlaBreached`, `CsatSubmitted`, … (one per event in the
[webhook reference](https://getclickfix.com/docs/webhooks); `Webhooks\EventMap::EVENTS`). Unknown
names raise only `WebhookReceived`, so new ClickFix events never break the endpoint.

```php
use ClickFix\Laravel\Events\MessageReceived;

Event::listen(MessageReceived::class, function (MessageReceived $event) {
    $event->get('conversation_uuid');   // data_get on the payload's data
    $event->get('contact_external_id'); // your user id
    $event->payload->deliveryId;        // ClickFix-Webhook-Id
    $event->payload->occurredAt();      // Carbon
});
```

Retries carry the same `ClickFix-Webhook-Id`; the controller remembers it in the cache for
`clickfix.webhook.dedupe_ttl` seconds (default one day) and acknowledges a repeat without firing the events
again. Set `CLICKFIX_WEBHOOK_QUEUE=true` (or a queue name, plus `CLICKFIX_WEBHOOK_QUEUE_CONNECTION`)
to fire the events from the `ProcessWebhook` job instead of inside the request; the endpoint then answers
`202`. To register the route yourself set `CLICKFIX_WEBHOOK_ROUTE=false` and attach the
`clickfix.webhook` middleware to your own route.

## Artisan

| Command | What it does |
|---|---|
| `clickfix:install [--force] [--no-env]` | Publish config, add `.env` keys, generate the webhook secret, print the webhook URL and next steps |
| `clickfix:check` | Verify the API key against the API (`GET /v1/public-api/contacts?limit=1`; `403` still proves the key), widget id, identity secret, webhook secret length and the webhook route (`https`). Exit code 1 on any failure |
| `clickfix:user-hash {user} [--raw] [--json]` | `user_hash` for a model key (or any `user_id` with `--raw`), to debug `WIDGET_IDENTITY_INVALID` |
| `clickfix:webhook:secret [--write]` | 64 hex character secret; `--write` sets `CLICKFIX_WEBHOOK_SECRET` in `.env` |
| `clickfix:sync:contacts [--id=*] [--since=] [--chunk=] [--dry-run]` | Upsert the configured model into ClickFix contacts by external id (`PUT /v1/public-api/contacts/by-external-id`, scope `contacts:write`) |

`clickfix:sync:contacts` reads `clickfix.contacts`: the Eloquent model (default `App\Models\User`), a
`fields` map (`name`, `email`, `phone`, `job_title`, `locale`, `timezone` → attribute or dotted path) and
`custom_fields` (ClickFix custom field key → attribute). `external_id` is always the model key, the same
value `identify` sends, so a synced contact and the widget session are one person.

## API client

`ClickFix::client()` returns the `clickfix/sdk` client configured from `config/clickfix.php` for calls
from your own code. `ClickFix::http()` is a Laravel HTTP client bound to the API (bearer key, JSON, timeout,
retries on 429/5xx); the commands use it so `Http::fake()` covers them in your tests.

## Tests

```sh
composer install
vendor/bin/phpunit
```

CI runs the suite with `orchestra/testbench` on Laravel 10 (PHP 8.1–8.3), 11 and 12 (PHP 8.2–8.4) and
13 (PHP 8.3–8.4).
