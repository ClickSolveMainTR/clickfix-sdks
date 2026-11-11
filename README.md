# ClickFix SDKs

MIT licensed (`LICENSE`, copied into every package). Published from the public mirror
[ClickSolveMainTR/clickfix-sdks](https://github.com/ClickSolveMainTR/clickfix-sdks): every tagged `main`
run pushes this directory there and tags each package version (`node/vX.Y.Z`, `go/vX.Y.Z`,
`flutter/vX.Y.Z`, ...). The mirror is read-only; fixes land here and ship with the next release.

- `go`: generated server client plus authentication, bounded retries, pagination and webhook verification. Module `github.com/ClickSolveMainTR/clickfix-sdks/go`, tags `go/vX.Y.Z` (version in `go/VERSION`).
- `node`: `@getclickfix/node`, typed, tree-shakable Node 22+ fetch client and server cryptographic helpers.
- `visitor-core`: `@getclickfix/visitor-core`, the DOM-free visitor (widget) API client for React Native, Node and browsers: browser mode (same-origin BFF) or app mode (mobile app key headers), retries, session renewal, realtime abstraction and the webview bridge types (CF-201).
- `react-widget`: `@getclickfix/react-widget`, UI-free React 18+ hooks over `visitor-core` in browser mode.
- `laravel`: `clickfix/laravel`, Laravel 10-13 package on top of `clickfix/sdk` (`php`): provider, facade, artisan commands, signed webhook route with Laravel events, `@clickfixWidget` Blade directive. Version is the newest `## X.Y.Z` heading in `laravel/CHANGELOG.md`; the `sdks-mirror` job pushes `laravel/` to the public repository `ClickSolveMainTR/clickfix-laravel` and tags `vX.Y.Z` there, which Packagist (`clickfix/laravel`) watches. Tests: `cd sdks/laravel && composer install && vendor/bin/phpunit` (CI runs the Testbench matrix in the `laravel` job).
- `flutter/clickfix_webview`: `clickfix_webview` (pub.dev), Flutter webview widget + controller implementing the webview bridge contract v1 (`docs/webview-bridge.md`). Checked by the separate `flutter` CI job (`dart analyze`, `flutter test`, publish dry run); published by `sdk-publish` when the `PUB_CREDENTIALS` secret is set.
- `examples`: the integration guide's samples (widget JS, Node, Go, PHP, curl) and the runner that verifies them (`examples/README.md`).

The source of truth is `backend/docs/openapi.yaml`. `make sdks` selects only
`/v1/public-api/*` for server clients and `/v1/widget/*` for the visitor core,
retains referenced components transitively, and generates Go with
[oapi-codegen v2.8.0](https://github.com/oapi-codegen/oapi-codegen/releases/tag/v2.8.0)
and TypeScript with [openapi-typescript 7.13.0](https://openapi-ts.dev/node).
Go and Node cover the API-key integration routes (including triggers and subscriptions);
JWT-authenticated key administration is deliberately outside a server SDK.
The existing API has some generic response envelopes; their payloads remain unknown
until the canonical contract gives them a concrete schema. Do not cast unvalidated input.

Requires Go matching `backend/go.mod`, Node 22+ and pnpm 11.22.0; the PHP package and examples need PHP 8.1+ and Composer (the example runner skips them when `php` is missing).

```sh
make sdks
make sdks-check                 # generated files current + guide pages current
(cd sdks && pnpm test)
(cd sdks/go && go test -p 2 ./...)
(cd sdks/php && composer install && composer check)   # php-cs-fixer, PHPStan 8, PHPUnit
make guide-examples             # run the guide samples (stub API, or CLICKFIX_BASE_URL)
```

Generation is checked in a separate required CI job so generator installation does
not slow the existing contracts job. Go SDK security and SDK dependency audits run
in the required `security` job.

## Yayın (CF-199)

Versions live in each package (`node/package.json`, `visitor-core/package.json`,
`react-widget/package.json`, `go/VERSION`, the newest `php/CHANGELOG.md` entry) next to its `CHANGELOG.md`. On every
PR the `sdks` job runs `pnpm publish --dry-run` (pnpm, so the `workspace:`
dependency of react-widget on visitor-core is rewritten to a version). On a
green `main` the `sdk-publish` job publishes any npm version that is not on the
registry yet, visitor-core before react-widget
(needs the `NPM_TOKEN` repository secret, an npm automation token for the
`@clickfix` scope; without it the job skips with a note), and the `sdks-mirror`
job pushes the tree and the `go/vX.Y.Z` tag to the public mirror when they do not exist.
Nobody publishes or tags by hand. The PHP package (`sdks/php`, version = newest `CHANGELOG.md` entry and
`Client::USER_AGENT`) is pushed by the same `sdks-mirror` job to the public repository
`ClickSolveMainTR/clickfix-php` and tagged `vX.Y.Z` there; Packagist (`clickfix/sdk`) watches that
repository. Details: `docs/entegrasyon-kilavuzu.md`.
The Laravel package (`sdks/laravel`, version = newest `CHANGELOG.md` heading) is pushed by the same job to
`ClickSolveMainTR/clickfix-laravel` and tagged `vX.Y.Z` there; Packagist (`clickfix/laravel`) watches it.

References: existing ClickFix widget routes/types and Laravel
`resources/js/widget/lib/widget-api.ts` for the headless transport approach;
Rentopia `backend/internal/modules/publicapi/usecase/webhooks.go` for the timestamp.body
HMAC format, adapted to ClickFix's existing delivery contract.
