// Builds the tenant-facing public API spec (backend/docs/public-api.yaml) from the
// operations of the canonical contract marked `x-public: true`, plus the info,
// tags, English summaries, examples and Turkish translation (`tr:` blocks ->
// `x-i18n`) in backend/docs/public-api/config.yaml, and the generated
// `x-codeSamples` (scripts/code-samples.mjs).
import { readFile } from 'node:fs/promises';
import { parse, stringify } from 'yaml';
import { buildCodeSamples } from './code-samples.mjs';

const PUBLIC_PREFIX = '/v1/public-api/';
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const HIDDEN_PARAMS = new Set(['x-organization']);

export async function buildPublicSpec(spec, configDir) {
  const config = parse(await readFile(new URL('config.yaml', configDir), 'utf8'), { merge: true });
  const overlays = config.operations ?? {};
  const used = new Set();
  const paths = {};

  function present(op, overlay, id) {
    if (!overlay) throw new Error(`public-api: ${id} is x-public but has no entry in backend/docs/public-api/config.yaml`);
    const out = scrub(structuredClone(op));
    delete out['x-public'];
    out.tags = [overlay.tag];
    out.summary = overlay.summary;
    if (overlay.description) out.description = overlay.description;
    i18n(out, overlay);
    if (out.parameters) out.parameters = out.parameters.filter((p) => !HIDDEN_PARAMS.has(String(p.name).toLowerCase()));
    applyExamples(out, overlay.examples, id);
    return out;
  }

  for (const [path, item] of Object.entries(spec.paths)) {
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      if (path.startsWith(PUBLIC_PREFIX) && typeof op['x-public'] !== 'boolean') {
        throw new Error(`public-api: ${method.toUpperCase()} ${path} must declare x-public: true or false`);
      }
      if (op['x-public'] !== true) continue;
      used.add(op.operationId);
      paths[path] ??= {};
      paths[path][method] = present(op, overlays[op.operationId], op.operationId);
    }
  }
  for (const id of Object.keys(overlays)) {
    if (!used.has(id)) throw new Error(`public-api: config entry ${id} matches no x-public operation`);
  }

  for (const d of config.derived ?? []) {
    if (!spec.paths[d.from.path]?.[d.from.method]) throw new Error(`public-api: derived source ${d.from.method} ${d.from.path} is gone`);
    const { from, path, method, tag, tr, ...op } = d;
    paths[path] ??= {};
    paths[path][method] = i18n(scrub({ ...op, tags: [tag] }), { tr });
  }
  await buildCodeSamples(paths);

  const webhooks = {};
  for (const [name, item] of Object.entries(spec.webhooks ?? {})) {
    for (const method of METHODS) {
      const op = item[method];
      if (op?.['x-public'] !== true) continue;
      webhooks[name] ??= {};
      webhooks[name][method] = present(op, config.webhooks?.[name], `webhook ${name}`);
    }
  }

  const components = {};
  const schemes = new Set();
  function refs(node) {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === '$ref') {
        if (!v.startsWith('#/components/')) throw new Error(`public-api: external ref ${v}`);
        const [, , kind, name] = v.split('/');
        if (!spec.components[kind]?.[name]) throw new Error(`public-api: dangling ref ${v}`);
        components[kind] ??= {};
        if (!components[kind][name]) {
          components[kind][name] = scrub(structuredClone(spec.components[kind][name]));
          refs(components[kind][name]);
        }
      } else if (k === 'security' && Array.isArray(v)) {
        for (const item of v) for (const name of Object.keys(item)) schemes.add(name);
      } else refs(v);
    }
  }
  refs(paths);
  refs(webhooks);
  if (schemes.size) {
    components.securitySchemes = {};
    for (const name of [...schemes].sort()) {
      const { tr, ...overlay } = config.securitySchemes?.[name] ?? {};
      const scheme = i18n({ ...spec.components.securitySchemes?.[name], ...overlay }, { tr });
      if (!scheme.type) throw new Error(`public-api: unknown security scheme ${name}`);
      components.securitySchemes[name] = scheme;
    }
  }
  for (const kind of Object.keys(components)) components[kind] = sortKeys(components[kind]);

  const tagNames = new Set([...Object.values(paths), ...Object.values(webhooks)].flatMap((i) => Object.values(i).flatMap((op) => op.tags)));
  const tags = (config.tags ?? []).filter((t) => tagNames.has(t.name)).map(({ tr, ...t }) => i18n(t, { tr }));
  for (const name of tagNames) {
    if (!tags.some((t) => t.name === name)) throw new Error(`public-api: tag ${name} is not described in config.yaml`);
  }

  const { tr: infoTr, ...info } = config.info;
  const doc = {
    openapi: spec.openapi,
    info: i18n(info, { tr: infoTr }),
    servers: (config.servers ?? []).map(({ tr, ...s }) => i18n(s, { tr })),
    security: [{ integrationKey: [] }],
    tags,
    paths,
    webhooks,
    components,
  };
  translate(doc, config.translations?.tr ?? {});
  return '# Generated by sdks/scripts/public-api.mjs from the x-public operations of backend/docs/openapi.yaml\n' +
    '# and backend/docs/public-api/. Do not edit; run `make sdks`.\n' +
    stringify(doc, { lineWidth: 0, aliasDuplicateObjects: false });
}

// `tr:` blocks of config.yaml become `x-i18n: { tr: { ... } }` on the node;
// the docs site derives the Turkish spec from them (frontend `pnpm docs:sync`).
function i18n(node, overlay) {
  if (overlay?.tr) node['x-i18n'] = { tr: overlay.tr };
  return node;
}

// Request example -> requestBody example; response examples by status code.
function applyExamples(op, examples, id) {
  if (!examples) return;
  if (examples.request !== undefined) {
    const media = op.requestBody?.content?.['application/json'];
    if (!media) throw new Error(`public-api: ${id} has a request example but no JSON request body`);
    media.example = examples.request;
  }
  for (const [code, example] of Object.entries(examples.responses ?? {})) {
    const res = op.responses?.[code];
    if (!res || res.$ref) throw new Error(`public-api: ${id} has an example for response ${code}, which it does not define inline`);
    res.content ??= { 'application/json': {} };
    res.content['application/json'].example = example;
  }
}

// Internal tracker references ("(CF-86)", "CF-195: ...") mean nothing to
// integrators; strip them and start the sentence with a capital again.
function scrubText(v) {
  const text = v
    .replace(/\s*\(CF-\d+(?:[,/ ]+CF-\d+)*\)/g, '')
    .replace(/\(CF-\d+,\s*/g, '(')
    .replace(/\bCF-\d+[:.]?\s*/g, '');
  // A removed "CF-195: " prefix leaves a lowercase start; restore the capital.
  if (/^\s*CF-\d+/.test(v)) {
    const t = text.trimStart();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return text;
}
function scrub(node) {
  if (Array.isArray(node)) return node.map(scrub);
  if (!node || typeof node !== 'object') return node;
  for (const [k, v] of Object.entries(node)) {
    node[k] = (k === 'description' || k === 'summary') && typeof v === 'string' ? scrubText(v) : scrub(v);
  }
  return node;
}

// Turkish for the texts that come straight from the canonical contract
// (parameter and response descriptions, shared components): an exact-match
// string table in config.yaml (`translations.tr`), applied as `x-i18n`.
// Every entry must still match a text in the public spec.
function translate(doc, rawTable) {
  const norm = (text) => text.replace(/\s+/g, ' ').trim();
  const table = Object.fromEntries(Object.entries(rawTable).map(([k, v]) => [norm(k), v]));
  const used = new Set();
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === 'x-codeSamples' || k === 'x-i18n') continue;
      if ((k === 'description' || k === 'summary') && typeof v === 'string') {
        const tr = table[norm(v)];
        if (tr && !node['x-i18n']?.tr?.[k]) {
          node['x-i18n'] = { ...node['x-i18n'], tr: { ...node['x-i18n']?.tr, [k]: tr } };
          used.add(norm(v));
        }
      } else walk(v);
    }
  }
  walk(doc);
  for (const key of Object.keys(table)) {
    if (!used.has(key)) throw new Error(`public-api: translations.tr entry matches no text in the spec: ${JSON.stringify(key)}`);
  }
}

function sortKeys(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}
