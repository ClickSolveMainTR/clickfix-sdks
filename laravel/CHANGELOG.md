# Changelog

The newest `## X.Y.Z` heading is the package version: the release job pushes `sdks/laravel` to
`ClickSolveMainTR/clickfix-laravel` and tags it `vX.Y.Z` there; Packagist (`clickfix/laravel`) follows that
repository. Bump the heading in the same PR as the change.

## 0.1.0

First release (CF-205).

- Service provider with package discovery, `ClickFix` facade, `config/clickfix.php` and `CLICKFIX_*` env keys.
- Laravel 10, 11, 12 and 13 on PHP 8.1+ (one package; CI runs the Testbench matrix).
- Artisan: `clickfix:install`, `clickfix:check`, `clickfix:user-hash`, `clickfix:webhook:secret`, `clickfix:sync:contacts`.
- `POST clickfix/webhook` with the `clickfix.webhook` signature middleware, `WebhookReceived` plus one Laravel event per ClickFix event, delivery-id deduplication and optional queueing.
- `@clickfixWidget` Blade directive, `ClickFix::userHash($user)`, `ClickFix::identity($user)` for Inertia / SPAs.
