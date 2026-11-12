# Changelog

The newest `## X.Y.Z` heading is the package version. Releases are tagged `vX.Y.Z` in
[ClickSolveMainTR/clickfix-laravel](https://github.com/ClickSolveMainTR/clickfix-laravel), which Packagist (`clickfix/laravel`) follows.
In `0.x` a minor version may carry a breaking change; it is listed under **Breaking**.

## 0.2.0 - 2026-11-12

- `ClickFix::identity($user)` and `@clickfixWidget` sign the company too: when the identify payload carries `company.id` (from `toClickFixIdentity()` or a `'company.id' => 'attribute'` entry in `clickfix.widget.user`), `user_hash` is `hex(HMAC-SHA256(secret, user_id . "\n" . company_id))` and the widget reports `company_verified: true`. Before, the company stayed an unverified hint.
- `ClickFix::userHash($user, $companyId = null)`: optional company id for payloads you build yourself.
- Dotted field names in `clickfix.widget.user` (`company.id`, `company.name`) build the nested payload.
- Requires `clickfix/sdk` `^0.2` and allows `guzzlehttp/guzzle` `^7.8 || ^8.0`: a fresh Laravel 13 application (Guzzle 8) installs the package without `-W`.
- **Breaking** (behaviour): a model whose identity has `company.id` now gets the company-signed hash. Send the payload unchanged (with `company: { id }`), as `@clickfixWidget` and `identity()` already do; a hash recomputed by hand without the company no longer matches it.

## 0.1.0 - 2026-11-12

First release.

- Service provider with package discovery, `ClickFix` facade, `config/clickfix.php` and `CLICKFIX_*` env keys.
- Laravel 10, 11, 12 and 13 on PHP 8.1+ (one package; CI runs the Testbench matrix).
- Artisan: `clickfix:install`, `clickfix:check`, `clickfix:user-hash`, `clickfix:webhook:secret`, `clickfix:sync:contacts`.
- `POST clickfix/webhook` with the `clickfix.webhook` signature middleware, `WebhookReceived` plus one Laravel event per ClickFix event, delivery-id deduplication and optional queueing.
- `@clickfixWidget` Blade directive, `ClickFix::userHash($user)`, `ClickFix::identity($user)` for Inertia / SPAs.
