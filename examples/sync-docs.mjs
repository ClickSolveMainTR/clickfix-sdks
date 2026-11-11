// Embeds the example files into the integration guide pages so the code the
// reader sees is the code `pnpm examples` ran. A marker line
//   {/* example: node/02-external-id.ts */}
// must be followed by a fenced code block; its content is replaced. Every
// MDX page under frontend/content/docs/<locale>/ is scanned, so the guide may
// spread over as many pages as it likes. `--check` fails when a page is
// stale (CI, `make sdks-check`).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = new URL('./', import.meta.url);
const docs = new URL('../../frontend/content/docs/', here);
const check = process.argv.includes('--check');

async function* mdxFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) yield* mdxFiles(url);
    else if (entry.name.endsWith('.mdx')) yield url;
  }
}

const stale = [];
let markers = 0;
for (const locale of ['tr', 'en']) {
  for await (const page of mdxFiles(new URL(`${locale}/`, docs))) {
    const lines = (await readFile(page, 'utf8')).split('\n');
    const out = [];
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      const m = /^\{\/\* example: ([\w./-]+) \*\/\}$/.exec(lines[i]);
      out.push(lines[i]);
      if (!m) continue;
      found = true;
      markers++;
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
    if (!found) continue;
    const next = out.join('\n');
    if (next !== lines.join('\n')) {
      stale.push(fileURLToPath(page));
      if (!check) await writeFile(page, next);
    }
  }
}
if (markers === 0) throw new Error('no example markers found under frontend/content/docs');
if (check && stale.length) { console.error(`stale guide pages (run pnpm examples:sync in sdks/):\n${stale.join('\n')}`); process.exit(1); }
console.log(stale.length ? `updated ${stale.length} page(s)` : `guide pages are current (${markers} embedded examples)`);
