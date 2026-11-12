// Guards the text that leaves this repository: everything the SDK mirrors
// publish (sdks/ without examples/), the public docs pages and the public
// API spec. Internal tracker references ("CF-" plus a number) mean nothing to readers
// outside the team, and the mirrored README / CHANGELOG files are English.
// Run by `pnpm check` (CI `sdks` job, `make sdks-check`).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'sdks', 'frontend/content/docs', 'frontend/content/generated', 'frontend/public/widget.d.ts', 'backend/docs/public-api.yaml'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  // Not mirrored (sdks-mirror excludes it); the guide snippets carry their own comments.
  .filter((f) => !f.startsWith('sdks/examples/'));

const TRACKER = /\bCF-\d+/;
// Letters only Turkish uses; a mirrored Markdown file containing one is not English.
const TURKISH = /[ğĞışŞİ]/;
const mirrored = (f) => f.startsWith('sdks/');
const problems = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(root + file, 'utf8');
  } catch {
    continue; // deleted in the working tree
  }
  if (text.includes('\0')) continue; // binary
  text.split('\n').forEach((line, i) => {
    if (TRACKER.test(line)) problems.push(`${file}:${i + 1}: internal tracker reference: ${line.trim().slice(0, 120)}`);
    if (mirrored(file) && file.endsWith('.md') && TURKISH.test(line)) problems.push(`${file}:${i + 1}: mirrored Markdown must be English: ${line.trim().slice(0, 120)}`);
  });
}
if (problems.length) {
  console.error(`public text check failed (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`public text ok (${files.length} files: no internal tracker references, mirrored Markdown in English)`);
