// Package versions of every SDK, read from the files that own them, rendered
// as the "Packages" table of the integration guide (one MDX fragment per
// language, included with `<include>`) and as JSON. `make sdks` writes them,
// `make sdks-check` fails when they are stale, so the docs never quote a
// version that differs from what ships.
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const root = new URL('../', import.meta.url);

async function text(path) {
  return readFile(new URL(path, root), 'utf8');
}
async function json(path) {
  return JSON.parse(await text(path));
}
function changelogVersion(changelog, path) {
  const m = /^## (\d+\.\d+\.\d+)/m.exec(changelog);
  if (!m) throw new Error(`${path}: no "## X.Y.Z" heading`);
  return m[1];
}

export async function readPackageVersions() {
  const widget = /api\.version = "(\d+\.\d+\.\d+)"/.exec(await text('../frontend/widget-sdk/src/widget.ts'));
  if (!widget) throw new Error('frontend/widget-sdk/src/widget.ts: api.version not found');
  const flutter = parse(await text('flutter/clickfix_webview/pubspec.yaml'));
  return {
    widget: widget[1],
    node: (await json('node/package.json')).version,
    visitorCore: (await json('visitor-core/package.json')).version,
    reactWidget: (await json('react-widget/package.json')).version,
    reactNative: (await json('react-native/package.json')).version,
    expo: (await json('expo/package.json')).version,
    go: (await text('go/VERSION')).trim(),
    php: changelogVersion(await text('php/CHANGELOG.md'), 'sdks/php/CHANGELOG.md'),
    laravel: changelogVersion(await text('laravel/CHANGELOG.md'), 'sdks/laravel/CHANGELOG.md'),
    flutter: String(flutter.version),
  };
}

const COPY = {
  tr: {
    head: ['Paket', 'Sürüm', 'Kurulum'],
    widget: ['`widget.js`', 'tipler `https://getclickfix.com/widget.d.ts`'],
    node: 'Node 22+',
    visitorCore: 'React Native, Node 22+, tarayıcı; DOM\'suz',
    reactWidget: 'React 18+',
    reactNative: 'React Native 0.81+, yerel ekranlar',
    expo: 'Expo SDK 54+',
    go: 'Go modülü',
    php: 'PHP 8.1+, herhangi bir PSR-18 istemci',
    laravel: 'Laravel 10-13, PHP 8.1+',
    flutter: 'Flutter (Dart 3.10+ kararlı), webview köprüsü v1',
    source: 'Kaynak',
    examples: 'Örnek uygulamalar',
    note: 'Sürümler paketlerin kendi dosyalarından üretilir (`make sdks`); değişiklik günlükleri her paketin `CHANGELOG.md` dosyasındadır. `0.x` sürümlerinde küçük sürüm kırıcı değişiklik taşıyabilir; günlükte **Kırıcı** başlığıyla yazılır.',
  },
  en: {
    head: ['Package', 'Version', 'Install'],
    widget: ['`widget.js`', 'types at `https://getclickfix.com/widget.d.ts`'],
    node: 'Node 22+',
    visitorCore: 'React Native, Node 22+, browsers; no DOM',
    reactWidget: 'React 18+',
    reactNative: 'React Native 0.81+, native screens',
    expo: 'Expo SDK 54+',
    go: 'Go module',
    php: 'PHP 8.1+, any PSR-18 client',
    laravel: 'Laravel 10-13, PHP 8.1+',
    flutter: 'Flutter (stable Dart 3.10+), webview bridge v1',
    source: 'Source',
    examples: 'Example apps',
    note: 'Versions are generated from the package files themselves (`make sdks`); each package keeps its changelog in `CHANGELOG.md`. In `0.x` a minor version may carry a breaking change; the changelog marks it **Breaking**.',
  },
};

const MIRROR = 'https://github.com/ClickSolveMainTR/clickfix-sdks';
const EXAMPLES = 'https://github.com/ClickSolveMainTR/clickfix-examples';

function rows(v, c) {
  return {
    widget: [`${c.widget[0]} (SDK ${v.widget.split('.').slice(0, 2).join('.')})`, `\`${v.widget}\``, `\`<script src="https://getclickfix.com/widget.js" data-widget="WIDGET_ID" async></script>\`, ${c.widget[1]}`],
    node: ['[`@getclickfix/node`](https://www.npmjs.com/package/@getclickfix/node)', `\`${v.node}\``, `\`npm install @getclickfix/node\` (${c.node})`],
    visitorCore: ['[`@getclickfix/visitor-core`](https://www.npmjs.com/package/@getclickfix/visitor-core)', `\`${v.visitorCore}\``, `\`npm install @getclickfix/visitor-core\` (${c.visitorCore})`],
    reactWidget: ['[`@getclickfix/react-widget`](https://www.npmjs.com/package/@getclickfix/react-widget)', `\`${v.reactWidget}\``, `\`npm install @getclickfix/react-widget\` (${c.reactWidget})`],
    reactNative: ['[`@getclickfix/react-native`](https://www.npmjs.com/package/@getclickfix/react-native)', `\`${v.reactNative}\``, `\`npm install @getclickfix/react-native\` (${c.reactNative})`],
    expo: ['[`@getclickfix/expo`](https://www.npmjs.com/package/@getclickfix/expo)', `\`${v.expo}\``, `\`npx expo install @getclickfix/expo expo-secure-store expo-file-system expo-linking expo-constants\` (${c.expo})`],
    go: [`[${c.go}](${MIRROR}/tree/main/go)`, `\`go/v${v.go}\``, `\`go get github.com/ClickSolveMainTR/clickfix-sdks/go@v${v.go}\``],
    php: ['[`clickfix/sdk`](https://packagist.org/packages/clickfix/sdk)', `\`${v.php}\``, `\`composer require clickfix/sdk guzzlehttp/guzzle\` (${c.php})`],
    laravel: ['[`clickfix/laravel`](https://packagist.org/packages/clickfix/laravel)', `\`${v.laravel}\``, `\`composer require clickfix/laravel\` (${c.laravel})`],
    flutter: ['[`clickfix_webview`](https://pub.dev/packages/clickfix_webview)', `\`${v.flutter}\``, `\`flutter pub add clickfix_webview\` (${c.flutter})`],
  };
}
const HEADER = '{/* Generated by sdks/scripts/package-versions.mjs (make sdks). Do not edit. */}';
function table(c, list) {
  return [`| ${c.head.join(' | ')} |`, '| --- | --- | --- |', ...list.map((r) => `| ${r.join(' | ')} |`)].join('\n');
}

/** The integration guide's full "Packages" table. */
export function renderPackagesTable(v, locale) {
  const c = COPY[locale];
  const all = Object.values(rows(v, c));
  return `${HEADER}\n\n${table(c, all)}\n\n${c.note} ${c.source}: [clickfix-sdks](${MIRROR}), [clickfix-php](https://github.com/ClickSolveMainTR/clickfix-php), [clickfix-laravel](https://github.com/ClickSolveMainTR/clickfix-laravel). ${c.examples}: [clickfix-examples](${EXAMPLES}).\n`;
}

/** The mobile packages only (React Native, Expo and the visitor core they build on), for their own pages. */
export function renderMobilePackagesTable(v, locale) {
  const c = COPY[locale];
  const r = rows(v, c);
  return `${HEADER}\n\n${table(c, [r.reactNative, r.expo, r.visitorCore])}\n`;
}
