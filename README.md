# ClickFix SDKs

Official client libraries for [ClickFix](https://getclickfix.com), the multi-tenant customer support platform.
MIT licensed (`LICENSE`, copied into every package).

| Package | Install | Runs on | What it is for |
|---|---|---|---|
| [`@getclickfix/node`](./node) | `npm install @getclickfix/node` | Node 22+ | Server: typed public API client, webhook verification, `user_hash` |
| [Go module](./go) | `go get github.com/ClickSolveMainTR/clickfix-sdks/go` | Go 1.24+ | Server: generated client, retries, pagination, webhooks, `user_hash` |
| [`clickfix/sdk`](https://github.com/ClickSolveMainTR/clickfix-php) | `composer require clickfix/sdk guzzlehttp/guzzle` | PHP 8.1+ | Server: PSR-18 client, typed errors, webhooks, `user_hash` |
| [`clickfix/laravel`](https://github.com/ClickSolveMainTR/clickfix-laravel) | `composer require clickfix/laravel` | Laravel 10-13 | Provider, facade, artisan commands, webhook route, `@clickfixWidget` |
| [`@getclickfix/visitor-core`](./visitor-core) | `npm install @getclickfix/visitor-core` | React Native, Node, browsers | DOM-free visitor (widget) API client and webview bridge types |
| [`@getclickfix/react-widget`](./react-widget) | `npm install @getclickfix/react-widget` | React 18+ | Hooks for the hosted widget and a UI-free visitor client |
| [`@getclickfix/react-native`](./react-native) | `npm install @getclickfix/react-native` | React Native 0.81+ | Provider, hooks and optional native screens (mobile app key) |
| [`@getclickfix/expo`](./expo) | `npx expo install @getclickfix/expo` | Expo SDK 54+ | The React Native package with Expo storage, files and linking wired in |
| [`clickfix_webview`](./flutter/clickfix_webview) | `flutter pub add clickfix_webview` | Flutter (Dart 3.10+) | Secure webview of the hosted widget, bridge contract v1 |

Current versions and the full walkthrough (identity verification, contacts by external id, companies,
custom fields, events, webhooks, mobile): **https://getclickfix.com/docs/integration-guide**.
API reference: https://getclickfix.com/docs/api-reference. Runnable example apps for every package:
[ClickSolveMainTR/clickfix-examples](https://github.com/ClickSolveMainTR/clickfix-examples).

## Which package

- **Your server** talks to the public API (`https://api.getclickfix.com/v1/public-api/*`) with an API key
  and signs `user_hash` with the widget's identity secret: Node, Go, PHP or Laravel. Keys and secrets never
  leave the server.
- **A website** loads the hosted widget (`<script src="https://getclickfix.com/widget.js">`), or uses
  `@getclickfix/react-widget` for typed hooks or a custom UI.
- **A mobile app** either renders native screens with `@getclickfix/react-native` / `@getclickfix/expo`
  (a mobile app key from Web widget → Advanced → Mobile apps), or hosts the widget page in a webview
  (`clickfix_webview` for Flutter, the bridge helpers of `visitor-core` for React Native).

`user_hash` is `hex(HMAC-SHA256(identity_secret, user_id))`, or, when the user belongs to a company,
`hex(HMAC-SHA256(identity_secret, user_id + "\n" + company_id))` sent together with `company: { id }`.
Every server SDK computes the same bytes.

## Versions and releases

Each package keeps its version next to its `CHANGELOG.md` (`package.json`, `go/VERSION`, `pubspec.yaml`, or the
newest `## X.Y.Z` heading of the PHP and Laravel changelogs). Releases are tagged here per package
(`node/vX.Y.Z`, `visitor-core/vX.Y.Z`, `react-widget/vX.Y.Z`, `react-native/vX.Y.Z`, `expo/vX.Y.Z`, `go/vX.Y.Z`,
`flutter/vX.Y.Z`); the PHP and Laravel packages are tagged `vX.Y.Z` in their own repositories, which Packagist
follows. In `0.x` a minor version may carry a breaking change; the changelog marks it **Breaking**.

This repository is a read-only mirror: it is published automatically with every release, so pull requests
here cannot be merged. Please open an [issue](https://github.com/ClickSolveMainTR/clickfix-sdks/issues) for
bugs and missing helpers; fixes ship with the next release.

## Development

The generated parts (Go client, TypeScript schemas, the PHP endpoint list) come from the ClickFix OpenAPI
contract: `/v1/public-api/*` for the server clients and `/v1/widget/*` for the visitor core, generated with
[oapi-codegen v2.8.0](https://github.com/oapi-codegen/oapi-codegen/releases/tag/v2.8.0) and
[openapi-typescript 7.13.0](https://openapi-ts.dev/node). Some responses still use a generic envelope
whose `data` is untyped; decode it into your own type (`DecodeData` in Go) instead of casting unvalidated input.

Requires Node 22+ and pnpm 11.22.0, Go 1.24+, PHP 8.1+ with Composer, and Flutter for `clickfix_webview`.

```sh
pnpm install
pnpm test                                           # build, type tests, Node tests, jest for react-native and expo
(cd go && go test ./...)
(cd php && composer install && composer check)      # php-cs-fixer, PHPStan level 8, PHPUnit
(cd laravel && composer install && vendor/bin/phpunit)
(cd flutter/clickfix_webview && flutter test)
```
