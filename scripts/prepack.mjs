// Runs before `npm pack` / `npm publish` of a package: refuses to pack when
// dist/ is missing or older than src/, so a stale build cannot be published.
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const pkg = process.argv[2];
const root = new URL(`../${pkg}/`, import.meta.url).pathname;
if (!existsSync(join(root, 'dist', 'index.js'))) {
  console.error(`${pkg}: dist/index.js missing; run "pnpm build" in sdks/ first`);
  process.exit(1);
}
const newest = (dir) => Math.max(...readdirSync(dir).map((f) => statSync(join(dir, f)).mtimeMs));
if (newest(join(root, 'src')) > newest(join(root, 'dist'))) {
  console.error(`${pkg}: dist/ is older than src/; run "pnpm build" in sdks/ first`);
  process.exit(1);
}
