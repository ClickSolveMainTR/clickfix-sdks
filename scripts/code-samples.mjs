// Request samples for every public operation (`x-codeSamples` of
// backend/docs/public-api.yaml): curl, Node.js (@getclickfix/node), Go
// (clickfix-sdks/go) and PHP (clickfix/sdk). Built from the operation itself
// (method, path, parameters, request example) so a new endpoint gets its
// samples without hand-written files; the Go call is read from the generated
// client's signatures, the PHP call from the resource method table below.
import { readFile } from 'node:fs/promises';

const BASE = 'https://api.getclickfix.com';

const PLACEHOLDER = { uuid: 'CONVERSATION_UUID', instance: 'CHANNEL_INSTANCE' };
function placeholder(path, name) {
  if (name === 'uuid') {
    if (path.includes('/contacts/')) return 'CONTACT_UUID';
    if (path.includes('/webhooks/')) return 'WEBHOOK_UUID';
    if (path.includes('/subscriptions/')) return 'SUBSCRIPTION_UUID';
  }
  return PLACEHOLDER[name] ?? name.toUpperCase();
}

const QUERY_EXAMPLES = {
  limit: 20,
  offset: 0,
  q: 'ayşe',
  external_id: '1001',
  event: 'conversation.created',
  cursor: '0',
};

const IDEMPOTENCY = {
  createIntegrationConversation: 'order-1042-support',
  patchV1PublicApiConversationsUuid: 'order-1042-assign',
  postV1PublicApiConversationsUuidMessages: 'order-1042-note-1',
  postV1PublicApiContacts: 'user-1001-create',
  putV1PublicApiContactByExternalId: 'user-1001-sync-42',
  updateIntegrationContact: 'user-1001-update-3',
  putV1PublicApiCompanyRevenue: 'company-f77-revenue-2026-11',
  putV1PublicApiCompanyUsage: 'company-f77-usage-2026-11-11',
  postV1PublicApiCompanyEvent: 'evt-2026-11-11-f77-seats',
  postV1PublicApiWebhooks: 'webhook-erp-sync',
  putV1PublicApiWebhooksUuid: 'webhook-erp-sync-v2',
  deleteV1PublicApiWebhooksUuid: 'webhook-erp-sync-delete',
  subscribeIntegrationTrigger: 'zapier-new-conversation',
  unsubscribeIntegrationTrigger: 'zapier-new-conversation-delete',
};

// PHP: resource method per operation. `$B` is the body, `$K` the idempotency key.
const PHP = {
  getV1PublicApiConversations: (q) => `$page = $client->conversations()->list(${q});`,
  createIntegrationConversation: () => `$conversation = $client->conversations()->create($B, idempotencyKey: $K);`,
  getV1PublicApiConversationsUuid: () => `$conversation = $client->conversations()->get('CONVERSATION_UUID');`,
  patchV1PublicApiConversationsUuid: () => `$conversation = $client->conversations()->update('CONVERSATION_UUID', $B, idempotencyKey: $K);`,
  getV1PublicApiConversationsUuidMessages: () => `$messages = $client->conversations()->messages('CONVERSATION_UUID');`,
  postV1PublicApiConversationsUuidMessages: (q, body) =>
    `$message = $client->conversations()->addMessage('CONVERSATION_UUID', ${phpValue(body.content)}, private: ${body.private ? 'true' : 'false'}, idempotencyKey: $K);`,
  getV1PublicApiContacts: (q) => `$page = $client->contacts()->list(${q});`,
  postV1PublicApiContacts: () => `$contact = $client->contacts()->create($B, idempotencyKey: $K);`,
  putV1PublicApiContactByExternalId: (q, body) => {
    const { external_id, ...rest } = body;
    return `$contact = $client->contacts()->upsertByExternalId(${phpValue(external_id)}, ${phpValue(rest)}, idempotencyKey: $K);`;
  },
  updateIntegrationContact: () => `$contact = $client->contacts()->update('CONTACT_UUID', $B, idempotencyKey: $K);`,
  getV1PublicApiCompanies: (q) => `$page = $client->companies()->list(${q});`,
  putV1PublicApiCompanyRevenue: () => `$result = $client->companies()->setRevenue($B, idempotencyKey: $K);`,
  putV1PublicApiCompanyUsage: () => `$result = $client->companies()->setUsage($B, idempotencyKey: $K);`,
  postV1PublicApiCompanyEvent: () => `$event = $client->events()->track($B, idempotencyKey: $K);`,
  getV1PublicApiWebhooks: (q) => `$page = $client->webhooks()->list(${q});`,
  postV1PublicApiWebhooks: () => `$webhook = $client->webhooks()->create($B, idempotencyKey: $K); // $webhook['secret'] is shown only once`,
  putV1PublicApiWebhooksUuid: () => `$webhook = $client->webhooks()->update('WEBHOOK_UUID', $B, idempotencyKey: $K);`,
  deleteV1PublicApiWebhooksUuid: () => `$client->webhooks()->delete('WEBHOOK_UUID', idempotencyKey: $K);`,
  pollIntegrationTriggers: () => `$page = $client->triggers()->poll('conversation.created', $cursor); // $cursor: null on the first call, then $page['next_cursor']`,
  subscribeIntegrationTrigger: () => `$subscription = $client->triggers()->subscribe($B, idempotencyKey: $K);`,
  unsubscribeIntegrationTrigger: () => `$client->triggers()->unsubscribe('SUBSCRIPTION_UUID', idempotencyKey: $K);`,
};

function json(value, indent = 2) {
  return JSON.stringify(value, null, indent);
}
function phpValue(value, depth = 0) {
  const pad = '    '.repeat(depth + 1);
  const end = '    '.repeat(depth);
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map((v) => phpValue(v, depth)).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${pad}'${k}' => ${phpValue(v, depth + 1)},`);
    return `[\n${entries.join('\n')}\n${end}]`;
  }
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return String(value);
}
function goLiteral(value) {
  // JSON in a raw string literal: readable and independent of the generated struct names.
  return '`' + json(value, 2).replace(/`/g, "'") + '`';
}
function tsValue(value) {
  return json(value, 2).replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, '$1:');
}

async function goSignatures() {
  const src = await readFile(new URL('../go/client.gen.go', import.meta.url), 'utf8');
  const sigs = {};
  for (const m of src.matchAll(/func \(c \*ClientWithResponses\) ([A-Za-z0-9]+)WithResponse\(([^)]*)\)/g)) {
    sigs[m[1]] = m[2].split(',').map((p) => p.trim()).slice(1).filter((p) => !p.startsWith('reqEditors'));
  }
  const idempotent = new Set();
  for (const m of src.matchAll(/type ([A-Za-z0-9]+Params) struct \{([^}]*)\}/g)) {
    if (m[2].includes('IdempotencyKey')) idempotent.add(m[1]);
  }
  return { sigs, idempotent };
}

function pascal(id) {
  return id[0].toUpperCase() + id.slice(1);
}

function curlSample({ method, url, headers, body }) {
  const lines = [`curl${method === 'GET' ? '' : ` -X ${method}`} "${url}" \\`];
  for (const [k, v] of Object.entries(headers)) lines.push(`  -H "${k}: ${v}" \\`);
  if (body !== undefined) lines.push(`  -d '${json(body, 2).replace(/'/g, "'\\''")}'`);
  else lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, '');
  return lines.join('\n');
}

export async function buildCodeSamples(paths) {
  const go = await goSignatures();
  for (const [path, item] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(item)) {
      if (!op || typeof op !== 'object' || !op.operationId) continue;
      op['x-codeSamples'] = samplesFor(path, method.toUpperCase(), op, go);
    }
  }
}

function samplesFor(path, method, op, go) {
  const id = op.operationId;
  const params = op.parameters ?? [];
  const pathParams = params.filter((p) => p.in === 'path');
  const queryParams = params.filter((p) => p.in === 'query' && p.name in QUERY_EXAMPLES).slice(0, 2);
  const needsKey = params.some((p) => p.in === 'header' && p.name === 'Idempotency-Key');
  const key = IDEMPOTENCY[id] ?? `${id}-1`;
  const body = op.requestBody?.content?.['application/json']?.example;
  let concrete = path;
  for (const p of pathParams) concrete = concrete.replace(`{${p.name}}`, placeholder(path, p.name));
  const query = Object.fromEntries(queryParams.map((p) => [p.name, QUERY_EXAMPLES[p.name]]));
  const qs = Object.keys(query).length ? '?' + new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString() : '';

  if (id === 'receiveAPIChannelMessage') return apiChannelSamples(concrete, body);
  if (id === 'getV1AppContextJwks') return jwksSamples(path);

  // curl
  const headers = { Authorization: 'Bearer $CLICKFIX_API_KEY' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (needsKey) headers['Idempotency-Key'] = key;
  const curl = curlSample({ method, url: `${BASE}${concrete}${qs}`, headers, body });

  // Node.js
  const opts = [];
  if (pathParams.length) opts.push(`path: { ${pathParams.map((p) => `${p.name}: "${placeholder(path, p.name)}"`).join(', ')} }`);
  if (Object.keys(query).length) opts.push(`query: ${tsValue(query).replace(/\n\s*/g, ' ')}`);
  if (needsKey) opts.push(`idempotencyKey: "${key}"`);
  const node = [
    'import { createClient } from "@getclickfix/node";',
    '',
    'const client = createClient({',
    `  baseURL: "${BASE}",`,
    '  apiKey: process.env.CLICKFIX_API_KEY!,',
    '});',
    '',
    `const res = await client.request(`,
    `  "${path}",`,
    `  "${method.toLowerCase()}",`,
    body !== undefined ? `  ${tsValue(body).replace(/\n/g, '\n  ')},` : '  undefined,',
    opts.length ? `  { ${opts.join(', ')} },` : null,
    ');',
    'console.log(res.data);',
  ].filter((l) => l !== null).join('\n');

  // Go
  const fn = pascal(id);
  const sig = go.sigs[fn] ?? [];
  const args = ['ctx'];
  const vars = [];
  for (const p of sig) {
    const [name, type] = p.split(/\s+/);
    if (type === 'openapi_types.UUID') args.push(`uuid.MustParse("${placeholder(path, name)}")`);
    else if (type?.startsWith('*') && type.endsWith('Params')) {
      const struct = type.slice(1);
      const fields = [];
      if (needsKey && go.idempotent.has(struct)) fields.push(`IdempotencyKey: "${key}"`);
      for (const [k, v] of Object.entries(query)) {
        const field = k.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase());
        vars.push(`${k} := ${typeof v === 'number' ? v : `"${v}"`}`);
        fields.push(`${field}: &${k}`);
      }
      args.push(`&clickfix.${struct}{${fields.join(', ')}}`);
    } else if (name === 'body') args.push(null); // handled by the WithBody variant
  }
  const hasBody = body !== undefined && sig.some((p) => p.startsWith('body '));
  const call = hasBody
    ? `client.${fn}WithBodyWithResponse(${args.filter((a) => a !== null).join(', ')}, "application/json",\n\tstrings.NewReader(${goLiteral(body)}))`
    : `client.${fn}WithResponse(${args.filter((a) => a !== null).join(', ')})`;
  const goCode = [
    'client, err := clickfix.New("' + BASE + '", os.Getenv("CLICKFIX_API_KEY"))',
    'if err != nil {',
    '\tlog.Fatal(err)',
    '}',
    ...vars,
    `res, err := ${call}`,
    'if err != nil {',
    '\tlog.Fatal(err)',
    '}',
    'fmt.Println(res.StatusCode(), string(res.Body))',
  ].join('\n');

  // PHP
  const render = PHP[id];
  const phpCall = render
    ? render(Object.keys(query).length ? phpValue(query) : '', body ?? {})
        .replace('$B', body !== undefined ? phpValue(body) : '[]')
        .replace('$K', `'${key}'`)
    : `$res = $client->request('${method}', '${concrete}'${body !== undefined ? ', ' + phpValue(body) : ''}${needsKey ? `, idempotencyKey: '${key}'` : ''});`;
  const php = [
    '<?php',
    "require __DIR__ . '/vendor/autoload.php';",
    '',
    'use ClickFix\\Client;',
    '',
    "$client = new Client('" + BASE + "', getenv('CLICKFIX_API_KEY'));",
    '',
    phpCall,
  ].join('\n');

  return [
    { lang: 'bash', label: 'curl', source: curl },
    { lang: 'typescript', label: 'Node.js', source: node },
    { lang: 'go', label: 'Go', source: goCode },
    { lang: 'php', label: 'PHP', source: php },
  ];
}

function apiChannelSamples(concrete, body) {
  const payload = json(body, 2);
  return [
    {
      lang: 'bash',
      label: 'curl',
      source: [
        'TIMESTAMP=$(date +%s)',
        `BODY='${payload.replace(/'/g, "'\\''")}'`,
        'SIGNATURE="sha256=$(printf \'%s.%s\' "$TIMESTAMP" "$BODY" | openssl dgst -sha256 -hmac "$CLICKFIX_CHANNEL_SECRET" | sed \'s/^.* //\')"',
        '',
        `curl -X POST "${BASE}${concrete}" \\`,
        '  -H "Content-Type: application/json" \\',
        '  -H "X-ClickFix-Timestamp: $TIMESTAMP" \\',
        '  -H "X-ClickFix-Signature: $SIGNATURE" \\',
        '  -d "$BODY"',
      ].join('\n'),
    },
    {
      lang: 'typescript',
      label: 'Node.js',
      source: [
        'import { createHmac } from "node:crypto";',
        '',
        `const body = JSON.stringify(${tsValue(body)});`,
        'const timestamp = String(Math.floor(Date.now() / 1000));',
        'const signature =',
        '  "sha256=" +',
        '  createHmac("sha256", process.env.CLICKFIX_CHANNEL_SECRET!)',
        '    .update(`${timestamp}.`)',
        '    .update(body)',
        '    .digest("hex");',
        '',
        `const res = await fetch("${BASE}${concrete}", {`,
        '  method: "POST",',
        '  headers: {',
        '    "Content-Type": "application/json",',
        '    "X-ClickFix-Timestamp": timestamp,',
        '    "X-ClickFix-Signature": signature,',
        '  },',
        '  body,',
        '});',
        'console.log(res.status, await res.json());',
      ].join('\n'),
    },
    {
      lang: 'go',
      label: 'Go',
      source: [
        `body := []byte(${goLiteral(body)})`,
        'timestamp := strconv.FormatInt(time.Now().Unix(), 10)',
        'mac := hmac.New(sha256.New, []byte(os.Getenv("CLICKFIX_CHANNEL_SECRET")))',
        'mac.Write([]byte(timestamp + "."))',
        'mac.Write(body)',
        'signature := "sha256=" + hex.EncodeToString(mac.Sum(nil))',
        '',
        `req, _ := http.NewRequest("POST", "${BASE}${concrete}", bytes.NewReader(body))`,
        'req.Header.Set("Content-Type", "application/json")',
        'req.Header.Set("X-ClickFix-Timestamp", timestamp)',
        'req.Header.Set("X-ClickFix-Signature", signature)',
        'res, err := http.DefaultClient.Do(req)',
        'if err != nil {',
        '\tlog.Fatal(err)',
        '}',
        'defer res.Body.Close()',
        'fmt.Println(res.StatusCode)',
      ].join('\n'),
    },
    {
      lang: 'php',
      label: 'PHP',
      source: [
        '<?php',
        "require __DIR__ . '/vendor/autoload.php';",
        '',
        'use ClickFix\\Client;',
        '',
        "$client = new Client('" + BASE + "', getenv('CLICKFIX_API_KEY'));",
        "$channel = $client->apiChannel(getenv('CLICKFIX_CHANNEL_INSTANCE'), getenv('CLICKFIX_CHANNEL_SECRET'));",
        '',
        `$result = $channel->send(${phpValue(body)});`,
      ].join('\n'),
    },
  ];
}

function jwksSamples(path) {
  return [
    { lang: 'bash', label: 'curl', source: `curl "${BASE}${path}"` },
    {
      lang: 'typescript',
      label: 'Node.js',
      source: [
        'import { createRemoteJWKSet, jwtVerify } from "jose";',
        '',
        `const jwks = createRemoteJWKSet(new URL("${BASE}${path}"));`,
        '// contextToken: the signed context the panel hands to your embedded app',
        'const { payload } = await jwtVerify(contextToken, jwks, {',
        '  issuer: "https://getclickfix.com",',
        '});',
        'console.log(payload.org, payload.sub);',
      ].join('\n'),
    },
    {
      lang: 'go',
      label: 'Go',
      source: [
        `res, err := http.Get("${BASE}${path}")`,
        'if err != nil {',
        '\tlog.Fatal(err)',
        '}',
        'defer res.Body.Close()',
        'var jwks struct {',
        '\tData struct {',
        '\t\tKeys []map[string]string `json:"keys"`',
        '\t} `json:"data"`',
        '}',
        'if err := json.NewDecoder(res.Body).Decode(&jwks); err != nil {',
        '\tlog.Fatal(err)',
        '}',
        '// pick the key whose "kid" matches the token header, then verify the EdDSA signature',
      ].join('\n'),
    },
    {
      lang: 'php',
      label: 'PHP',
      source: [
        '<?php',
        `$jwks = json_decode(file_get_contents('${BASE}${path}'), true)['data']['keys'];`,
        "// pick the key whose 'kid' matches the token header, then verify the EdDSA signature",
      ].join('\n'),
    },
  ];
}
