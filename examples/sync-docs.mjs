// Embeds the example files into the integration guide pages so the code the
// reader sees is the code `pnpm examples` ran. A marker line
//   {/* example: node/02-external-id.ts */}
// must be followed by a fenced code block; its content is replaced.
// `--check` fails when a page is stale (CI, `make sdks-check`).
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = new URL('./', import.meta.url);
const pages = ['tr', 'en'].map((l) => new URL(`../../frontend/content/docs/${l}/integration-guide.mdx`, here));
const check = process.argv.includes('--check');
let stale = [];
for (const page of pages) {
  const lines = (await readFile(page, 'utf8')).split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^\{\/\* example: ([\w./-]+) \*\/\}$/.exec(lines[i]);
    out.push(lines[i]);
    if (!m) continue;
    let j = i + 1;
    while (lines[j] === '') out.push(lines[j++]); // Prettier may add a blank line after the marker
    const open = lines[j];
    if (!open?.startsWith('```')) throw new Error(`${fileURLToPath(page)}:${j + 1}: marker must be followed by a code fence`);
    const end = lines.indexOf('```', j + 1);
    if (end < 0) throw new Error(`${fileURLToPath(page)}:${j + 1}: unterminated fence`);
    const code = (await readFile(new URL(m[1], here), 'utf8')).replace(/\n+$/, '');
    out.push(open, ...code.split('\n'), '```');
    i = end;
  }
  const next = out.join('\n');
  if (next !== lines.join('\n')) {
    stale.push(fileURLToPath(page));
    if (!check) await writeFile(page, next);
  }
}
if (check && stale.length) { console.error(`stale guide pages (run pnpm examples:sync in sdks/):\n${stale.join('\n')}`); process.exit(1); }
console.log(stale.length ? `updated ${stale.length} page(s)` : 'guide pages are current');
