// Runs every guide example (Node, Go, PHP, curl) against a ClickFix API and
// checks the widget JavaScript against widget.d.ts. Without
// CLICKFIX_BASE_URL an in-process stub (stub-server.mjs) stands in, which
// is what CI does; with it (plus CLICKFIX_API_KEY, CLICKFIX_IDENTITY_SECRET,
// CLICKFIX_CHANNEL_INSTANCE, CLICKFIX_CHANNEL_SECRET) the same examples hit
// a real backend. `--check` only type-checks and compiles. The PHP examples
// need `php` (8.1+) and `composer` on PATH; without them they are skipped with
// a note, unless CLICKFIX_EXAMPLES_PHP=required (the CI `php` job).
import { spawn, execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { STUB } from './stub-server.mjs';

const dir = fileURLToPath(new URL('./', import.meta.url));
const checkOnly = process.argv.includes('--check');
// --only=<widget|node|go|php|curl> runs one language (the CI php job runs the PHP examples alone).
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice('--only='.length);
if (only && !['widget', 'node', 'go', 'php', 'curl'].includes(only)) throw new Error(`unknown --only=${only}`);
const want = (lang) => !only || only === lang;
const log = (...a) => console.log('[examples]', ...a);
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: dir, stdio: 'pipe', encoding: 'utf8', ...opts });

if (want('widget')) {
  log('widget examples: tsc against frontend/public/widget.d.ts');
  run('npx', ['tsc', '-p', 'widget/tsconfig.json'], { cwd: dir });
}
if (want('go')) {
  log('go examples: go vet + build');
  run('go', ['vet', './...'], { cwd: dir + 'go' });
  run('go', ['build', '-o', process.platform === 'win32' ? 'examples.exe' : '/dev/null', '.'], { cwd: dir + 'go' });
}
if (want('node')) {
  log('node examples: syntax check');
  for (const f of readdirSync(dir + 'node').filter((f) => f.endsWith('.ts'))) run('node', ['--check', `node/${f}`]);
}
const phpFiles = readdirSync(dir + 'php').filter((f) => f.endsWith('.php')).sort();
const php = want('php') && (() => { try { run('php', ['-v']); run('composer', ['--version']); return true; } catch { return false; } })();
if (!php && want('php') && process.env.CLICKFIX_EXAMPLES_PHP === 'required') throw new Error('php and composer are required (CLICKFIX_EXAMPLES_PHP=required)');
if (php) {
  log('php examples: syntax check');
  for (const f of phpFiles) run('php', ['-l', `php/${f}`]);
} else if (want('php')) log('php or composer not on PATH: PHP examples skipped');
if (checkOnly) { log('check ok'); process.exit(0); }

// The PHP examples `require __DIR__.'/vendor/autoload.php'` like any Composer
// project; here that file forwards to the SDK's own dev install (Guzzle included).
if (php) {
  if (!existsSync(dir + '../php/vendor/autoload.php')) run('composer', ['install', '--no-interaction', '--quiet'], { cwd: dir + '../php' });
  mkdirSync(dir + 'php/vendor', { recursive: true });
  writeFileSync(dir + 'php/vendor/autoload.php', "<?php\nreturn require __DIR__.'/../../../php/vendor/autoload.php';\n");
}

// The examples are run synchronously (execFileSync), so the stub must live in
// its own process; in-process it would never get to answer them.
async function spawnStub() {
  const child = spawn(process.execPath, ['stub-server.mjs'], { cwd: dir, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'] });
  const baseURL = await new Promise((resolve, reject) => {
    let out = '';
    child.stdout.on('data', (d) => { out += d; const m = /stub listening on (\S+)/.exec(out); if (m) resolve(m[1]); });
    child.on('exit', (code) => reject(new Error(`stub exited ${code}`)));
  });
  return { baseURL, server: { close: () => child.kill() } };
}
let stub = null;
const env = { ...process.env };
if (!env.CLICKFIX_BASE_URL) {
  stub = await spawnStub();
  Object.assign(env, {
    CLICKFIX_BASE_URL: stub.baseURL, CLICKFIX_API_KEY: STUB.apiKey, CLICKFIX_IDENTITY_SECRET: STUB.identitySecret,
    CLICKFIX_CHANNEL_INSTANCE: STUB.channelInstance, CLICKFIX_CHANNEL_SECRET: STUB.channelSecret, CLICKFIX_INBOX_UUID: STUB.inboxUUID,
  });
  log('no CLICKFIX_BASE_URL: using the stub at', stub.baseURL);
} else log('target', env.CLICKFIX_BASE_URL);
for (const k of ['CLICKFIX_API_KEY', 'CLICKFIX_IDENTITY_SECRET', 'CLICKFIX_CHANNEL_INSTANCE', 'CLICKFIX_CHANNEL_SECRET'])
  if (!env[k]) throw new Error(`${k} is required when CLICKFIX_BASE_URL is set`);
env.SYSTEM_TOKEN = 'example-system-token';
env.CLICKFIX_WEBHOOK_SECRET = 'whsec_example_stored_secret';

const node = (file, extra = {}) => ['node', ['--disable-warning=ExperimentalWarning', `node/${file}`], extra];
const go = (step, extra = {}) => ['go', ['run', '.', step], { cwd: dir + 'go', ...extra }];
const sh = (file, extra = {}) => ['bash', ['-euo', 'pipefail', `curl/${file}`], extra];
const phpRun = (file, extra = {}) => ['php', [`php/${file}`], extra];
// Request-handler examples run under PHP's built-in server, which prints "... started";
// listener() fills in the port.
const phpServe = (file) => ['php', ['-S', '127.0.0.1:PORT', `php/${file}`], { phpServer: true }];
const failures = [];

function oneShot([cmd, args, extra], label) {
  try {
    const out = execFileSync(cmd, args, { cwd: dir, env: { ...env, ...(extra.env ?? {}) }, encoding: 'utf8', stdio: 'pipe', timeout: 120000, ...(extra.cwd ? { cwd: extra.cwd } : {}) });
    log('ok', label, out.trim().split('\n').at(-1)?.slice(0, 160));
  } catch (err) {
    failures.push(label);
    log('FAIL', label, String(err.stderr || err.stdout || err.message).trim().slice(0, 800));
  }
}

/** Starts a listening example, waits for "listening", returns {port, stop, output}. */
function listener([cmd, args, extra], port) {
  return new Promise((resolve, reject) => {
    // detached: `go run` starts the binary as a grandchild; killing the group stops both.
    if (extra.phpServer) args = args.map((a) => a.replace('127.0.0.1:PORT', `127.0.0.1:${port}`));
    const child = spawn(cmd, args, { cwd: extra.cwd ?? dir, env: { ...env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    const stop = () => { try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill(); } };
    let output = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error(`timeout waiting for ${cmd} ${args.join(' ')}\n${output}`)); }, 120000);
    const onData = (d) => { output += d; if (/listening|\) started/.test(output)) { clearTimeout(timer); resolve({ port, output: () => output, stop }); } };
    child.stdout.on('data', onData); child.stderr.on('data', onData);
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`exited ${code} before listening\n${output}`)); });
  });
}
const freePort = () => 20000 + Math.floor(Math.random() * 20000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function webhookRoundTrip(label, start) {
  try {
    const l = await listener(start, freePort());
    const secret = env.CLICKFIX_WEBHOOK_SECRET;
    if (/whsec_[a-f0-9]{32}/.test(l.output())) throw new Error('example printed the issued webhook secret');
    const body = Buffer.from(JSON.stringify({ id: 'evt-1', event: 'conversation.created', version: 1, occurred_at: new Date().toISOString(), data: { conversation_uuid: 'c-1', contact_external_id: '1001' } }));
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = 'v1=' + createHmac('sha256', secret).update(ts + '.').update(body).digest('hex');
    const headers = { 'Content-Type': 'application/json', 'ClickFix-Webhook-Id': 'evt-1', 'ClickFix-Webhook-Event': 'conversation.created', 'ClickFix-Webhook-Timestamp': ts };
    await sleep(100);
    const good = await fetch(`http://127.0.0.1:${l.port}/`, { method: 'POST', headers: { ...headers, 'ClickFix-Webhook-Signature': sig }, body });
    const bad = await fetch(`http://127.0.0.1:${l.port}/`, { method: 'POST', headers: { ...headers, 'ClickFix-Webhook-Signature': sig }, body: Buffer.from('{"tampered":1}') });
    l.stop();
    if (good.status !== 200 || bad.status !== 401) throw new Error(`valid delivery -> ${good.status}, tampered -> ${bad.status}`);
    log('ok', label, 'valid 200, tampered 401');
  } catch (err) { failures.push(label); log('FAIL', label, err.message.slice(0, 800)); }
}

async function systemEndpoint(label, start, curl) {
  try {
    const l = await listener(start, freePort());
    await sleep(100);
    const res = await fetch(`http://127.0.0.1:${l.port}/customers/1001/invoices`, { headers: { Authorization: `Bearer ${env.SYSTEM_TOKEN}` } });
    const denied = await fetch(`http://127.0.0.1:${l.port}/customers/1001/invoices`);
    const json = await res.json();
    if (curl) oneShot(sh('08-system-endpoint.sh', { env: { SYSTEM_BASE_URL: `http://127.0.0.1:${l.port}` } }), 'curl/08-system-endpoint.sh');
    l.stop();
    if (res.status !== 200 || !Array.isArray(json.items) || json.items[0]?.customer_id !== '1001' || denied.status !== 401) throw new Error(`status ${res.status} ${JSON.stringify(json).slice(0, 200)} denied ${denied.status}`);
    log('ok', label, `${json.items.length} item(s), unauthenticated 401`);
  } catch (err) { failures.push(label); log('FAIL', label, err.message.slice(0, 800)); }
}

// user hash: every implementation (Node, Go, PHP, curl) must produce the same
// HMAC for the user id alone, and (CF-206: HMAC over user_id + "\n" +
// company_id) for the user id signed together with the company id. The PHP
// helper gets the company formula in its own release (CF-204/205 follow-up),
// so only the user-only vector is required of it until then.
const expected = createHmac('sha256', env.CLICKFIX_IDENTITY_SECRET).update('1001').digest('hex');
const expectedWithCompany = createHmac('sha256', env.CLICKFIX_IDENTITY_SECRET).update('1001\nF-77').digest('hex');
const hashRuns = [];
if (want('node')) hashRuns.push(['node/01-user-hash.ts', node('01-user-hash.ts'), true]);
if (want('go')) hashRuns.push(['go user-hash', go('user-hash'), true]);
if (want('curl')) hashRuns.push(['curl/01-user-hash.sh', sh('01-user-hash.sh'), true]);
if (php) hashRuns.push(['php/01-user-hash.php', phpRun('01-user-hash.php'), false]);
for (const [label, cmd, withCompany] of hashRuns) {
  try {
    const out = execFileSync(cmd[0], cmd[1], { cwd: cmd[2].cwd ?? dir, env, encoding: 'utf8', stdio: 'pipe', timeout: 120000 });
    if (!out.includes(expected)) throw new Error(`user hash mismatch: ${out.trim()}`);
    if (withCompany && !out.includes(expectedWithCompany)) throw new Error(`user + company hash mismatch: ${out.trim()}`);
    log('ok', label, withCompany ? 'same HMAC (user id; user id + company id)' : 'same HMAC (user id)');
  } catch (err) { failures.push(label); log('FAIL', label, String(err.stderr || err.message).slice(0, 800)); }
}
for (const step of ['02-external-id', '03-custom-fields', '04-company', '05-events', '06-api-channel']) {
  if (want('node')) oneShot(node(`${step}.ts`), `node/${step}.ts`);
  if (want('go')) oneShot(go(step.slice(3)), `go ${step.slice(3)}`);
  if (want('curl')) oneShot(sh(`${step}.sh`), `curl/${step}.sh`);
  if (php) oneShot(phpRun(`${step}.php`), `php/${step}.php`);
}
if (want('curl')) oneShot(sh('07-webhooks.sh'), 'curl/07-webhooks.sh');
if (want('node')) await webhookRoundTrip('node/07-webhooks.ts', node('07-webhooks.ts'));
if (want('go')) await webhookRoundTrip('go webhooks', go('webhooks'));
if (want('node')) await systemEndpoint('node/08-system-endpoint.ts', node('08-system-endpoint.ts'), want('curl'));
if (want('go')) await systemEndpoint('go system-endpoint', go('system-endpoint'), false);
if (php) {
  // The webhook example both opens the subscription (CLI) and verifies deliveries
  // (web server), signed here exactly as ClickFix and the Node SDK sign them.
  oneShot(phpRun('07-webhooks.php'), 'php/07-webhooks.php (subscribe)');
  await webhookRoundTrip('php/07-webhooks.php (verify)', phpServe('07-webhooks.php'));
  await systemEndpoint('php/08-system-endpoint.php', phpServe('08-system-endpoint.php'), false);
}

stub?.server.close();
if (failures.length) { log(`${failures.length} failed:`, failures.join(', ')); process.exit(1); }
log('all examples passed');
process.exit(0);
