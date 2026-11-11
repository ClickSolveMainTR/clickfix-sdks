// Select operations from the canonical contract, then retain their transitive refs.
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import openapiTS, { astToString } from 'openapi-typescript';
import { buildPublicSpec } from './public-api.mjs';
import { renderPhpEndpoints } from './php-endpoints.mjs';
import { readPackageVersions, renderPackagesTable } from './package-versions.mjs';
const root = new URL('../', import.meta.url);
const spec = parse(await readFile(new URL('../../backend/docs/openapi.yaml', import.meta.url), 'utf8'));
const check = process.argv.includes('--check');
const temp = await mkdtemp(join(tmpdir(), 'clickfix-sdk-'));
async function output(path, text) {
  const url = new URL(path, root);
  if (check) {
    if (await readFile(url, 'utf8').catch(() => '') !== text) throw new Error(`${path} is stale; run make sdks`);
  } else await writeFile(url, text);
}
function subset(predicate) {
  const paths = Object.fromEntries(Object.entries(spec.paths).filter(([p]) => predicate(p)));
  const components = {};
  function refs(node) {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === '$ref') {
        if (!v.startsWith('#/components/')) throw new Error(`External ref ${v}`);
        const [, , kind, name] = v.split('/');
        components[kind] ??= {};
        if (!components[kind][name]) { components[kind][name] = spec.components[kind][name]; refs(components[kind][name]); }
      } else if (k === 'security') {
        for (const item of v) for (const name of Object.keys(item)) {
          components.securitySchemes ??= {};
          components.securitySchemes[name] = spec.components.securitySchemes[name];
        }
      } else refs(v);
    }
  }
  refs(paths);
  return { openapi: spec.openapi, info: spec.info, servers: [{url:'https://api.example.com'}], paths, components };
}
try {
  await output('../backend/docs/public-api.yaml', await buildPublicSpec(spec, new URL('../../backend/docs/public-api/', import.meta.url)));
  const server = subset(p => p.startsWith('/v1/public-api/'));
  const widget = subset(p => p.startsWith('/v1/widget/'));
  await output('node/src/schema.d.ts', astToString(await openapiTS(server)));
  await output('visitor-core/src/schema.d.ts', astToString(await openapiTS(widget)));
  const versions = await readPackageVersions();
  await output('../frontend/content/generated/packages.json', JSON.stringify(versions, null, 2) + '\n');
  for (const locale of ['tr', 'en']) await output(`../frontend/content/generated/packages.${locale}.mdx`, renderPackagesTable(versions, locale));
  await output('php/src/Endpoints.php', renderPhpEndpoints(parse(await readFile(new URL('../../backend/docs/public-api.yaml', import.meta.url), 'utf8'))));
  const input = join(temp, 'public-api.json');
  await writeFile(input, JSON.stringify(server));
  const generated = execFileSync('go', ['run', 'github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.8.0', '-package', 'clickfix', '-generate', 'types,client', input], {encoding:'utf8', env:{...process.env,GOMAXPROCS:'2'}});
  await output('go/client.gen.go', generated);
} finally { await rm(temp, {recursive:true,force:true}); }
