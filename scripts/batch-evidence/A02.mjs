#!/usr/bin/env node
// A02 independent evidence — "Canonical stateful chat-to-Wiki projection"
// (arbor.item-receipt/1).
// Static: the chat→wiki projection modules exist and are wired into the Host
// (path:line cited in check details), and the projection replay is
// deterministic. Live: boots an ISOLATED loopback Host on a scratch port with
// a flagged temp data root (same pattern as A01), POSTs a chat message through
// /api/mutate for a machine actor and an owner-browser actor with an identical
// envelope, and asserts the journal records both deterministic mutations with
// same-envelope parity (digest recorded). Port 43187's data is never touched.
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, lstatSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SERVER = 'apps/vivim-host/server.mjs';
const JOURNAL_MOD = 'apps/vivim-host/chat/product-journal.mjs';
const CHAT_PAGE_JS = 'apps/vivim-host/public/pages/chat.js';
const WIKI_PAGE_JS = 'apps/vivim-host/public/pages/wiki.js';
const SEED_STATE = 'apps/vivim-host/data/demo-baseline/state.json';
const SEED_WIKI = 'apps/vivim-host/data/demo-baseline/wiki.json';
const REAL_PORT = 43187;
const ISO_MARKER = 'arbor-a02-isolated-';
// Server-stamped fields that legitimately differ between two sends.
const VOLATILE_FIELDS = ['actor', 'entryId', 'sequence', 'receivedAt', 'revision', 'wikiRevision'];

const hash = value => createHash('sha256').update(value).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function findLine(source, pattern) {
  const lines = String(source).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) if (pattern.test(lines[i])) return i + 1;
  return 0;
}

// Strip volatile/server-stamped fields so two same-envelope sends can be
// compared as pure state mutations.
export function normalizeEntry(entry) {
  const out = {};
  for (const key of Object.keys(entry || {}).sort())
    if (!VOLATILE_FIELDS.includes(key)) out[key] = entry[key];
  return out;
}

export function parityDigest(entries) {
  return hash(JSON.stringify(entries.map(normalizeEntry)));
}

export function parseJournalResponse(body) {
  const entries = JSON.parse(body);
  if (!Array.isArray(entries) || entries.some(entry => !object(entry)))
    throw new Error('/api/journal must be a JSON array of entry objects');
  return entries;
}

export function parseRawJournal(body) {
  if (body === '') return [];
  const lines = body.endsWith('\n') ? body.slice(0, -1).split('\n') : body.split('\n');
  return lines.map((line, index) => {
    if (!line.trim()) throw new Error('Empty or torn journal line ' + (index + 1));
    let value;
    try { value = JSON.parse(line); }
    catch { throw new Error('Corrupt journal line ' + (index + 1)); }
    if (!object(value)) throw new Error('Invalid journal entry at line ' + (index + 1));
    return value;
  });
}

export function assertIsolatedLive(baseUrl, isolated) {
  let url;
  try { url = new URL(baseUrl); } catch { throw new Error('Explicit isolated loopback base URL required'); }
  if (!isolated || url.protocol !== 'http:' ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('--live requires an explicit isolated http://127.0.0.1:<port> Host (no credentials/query/hash)');
  }
}

export function bootEnvFor(port, dataRoot, env = process.env) {
  return { ...env, VIVIM_HOST_PORT: String(port), VIVIM_HOST_DATA_DIR: dataRoot };
}

export function isFlaggedIsolatedRoot(dataRoot, tmpdir = os.tmpdir()) {
  try {
    const real = realpathSync(dataRoot);
    const parent = realpathSync(tmpdir);
    return real.startsWith(parent + sep) &&
      lstatSync(real).isDirectory() && real.includes(ISO_MARKER);
  } catch { return false; }
}

async function freePort() {
  return new Promise((res, rej) => {
    const srv = net.createServer();
    srv.once('error', rej);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => res(port));
    });
  });
}

async function waitReady(baseUrl, fetchImpl, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let last = 'not attempted';
  while (Date.now() < deadline) {
    try {
      const res = await fetchImpl(baseUrl + '/', { signal: AbortSignal.timeout(2000) });
      if (res.status === 200) return true;
      last = 'status=' + res.status;
    } catch (error) { last = String(error?.message || error); }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('isolated Host not ready within ' + timeoutMs + 'ms (last: ' + last + ')');
}

async function stopHost(child) {
  if (!child || child.exitCode !== null || child.signalCode) return child?.exitCode ?? 0;
  child.kill('SIGTERM');
  const code = await new Promise(res => {
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} res('killed'); }, 8000);
    child.once('exit', (c, s) => { clearTimeout(timer); res(c ?? s ?? 0); });
  });
  return code;
}

function makeTransport(baseUrl, fetchImpl) {
  async function request(route, options) {
    const response = await fetchImpl(baseUrl + route, { ...options, signal: AbortSignal.timeout(5000) });
    return { status: response.status, type: response.headers.get('content-type') || '', body: await response.text() };
  }
  return {
    get: route => request(route),
    post: (route, body, headers = {}) => request(route, {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body)
    })
  };
}

// Static wiring projection: which server.mjs lines wire the journal modules in.
export function projectionWiring(serverSrc) {
  return {
    importLine: findLine(serverSrc, /import \{ createProductJournal(?:, [^}]+)? \} from '\.\/chat\/product-journal\.mjs'/),
    createLine: findLine(serverSrc, /createProductJournal\(\{/),
    stateRouteLine: findLine(serverSrc, /pathname === '\/api\/state' \|\| pathname === '\/api\/wiki'/),
    projectionLine: findLine(serverSrc, /productJournal\.readProjection\(\)/),
    journalRouteLine: findLine(serverSrc, /pathname === '\/api\/journal'/),
    mutateRouteLine: findLine(serverSrc, /pathname === '\/api\/mutate'.*req\.method === 'POST'/),
    appendLine: findLine(serverSrc, /productJournal\.append\(entry\)/)
  };
}

export async function runA02Evidence({
  root = ROOT, live = false, fetchImpl = globalThis.fetch,
  spawnImpl = spawn, boot = null, tmpdir = os.tmpdir()
} = {}) {
  const checks = [];
  const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail: String(detail) });
  const safe = async (name, fn) => {
    try { const value = await fn(); check(name, true, typeof value === 'string' ? value : 'validated'); return value; }
    catch (error) { check(name, false, String(error?.message || error)); return null; }
  };
  const read = file => readFileSync(resolve(root, file), 'utf8');
  const exists = file => existsSync(resolve(root, file));

  // ---------------- static: projection modules exist and are wired into the Host ----------------
  let wiring = null;
  await safe('projection-module-exists', async () => {
    if (!exists(JOURNAL_MOD)) throw new Error(JOURNAL_MOD + ' missing');
    const mod = await import(pathToFileURL(resolve(root, JOURNAL_MOD)).href);
    for (const fn of ['createProductJournal', 'replayProductJournal', 'validateProductEdit'])
      if (typeof mod[fn] !== 'function') throw new Error('missing export ' + fn);
    return JOURNAL_MOD + ' exports createProductJournal/replayProductJournal/validateProductEdit';
  });
  await safe('host-wiring-journal-projection', () => {
    const serverSrc = read(SERVER);
    wiring = projectionWiring(serverSrc);
    const missing = Object.entries(wiring).filter(([, line]) => !line).map(([k]) => k);
    if (missing.length) throw new Error('server.mjs wiring missing: ' + missing.join(','));
    return SERVER + ':' + wiring.importLine + ' import createProductJournal, :' + wiring.createLine +
      ' createProductJournal({dataRoot, seedState, seedWiki}), :' + wiring.mutateRouteLine +
      ' POST /api/mutate, :' + wiring.appendLine + ' productJournal.append, :' +
      wiring.stateRouteLine + ' /api/state+/api/wiki, :' + wiring.projectionLine +
      ' readProjection, :' + wiring.journalRouteLine + ' /api/journal+/api/journal?format=jsonl';
  });
  await safe('page-surfaces-wired', () => {
    for (const page of [CHAT_PAGE_JS, WIKI_PAGE_JS]) {
      if (!exists(page)) throw new Error(page + ' missing');
      const src = read(page);
      if (!/\/api\/(state|mutate|wiki|journal)/.test(src)) throw new Error(page + ' does not reference the projection APIs');
    }
    const chat = read(CHAT_PAGE_JS), wiki = read(WIKI_PAGE_JS);
    return CHAT_PAGE_JS + ':' + findLine(chat, /\/api\/state/) + ' /api/state, :' + findLine(chat, /\/api\/mutate/) +
      ' /api/mutate; ' + WIKI_PAGE_JS + ':' + findLine(wiki, /\/api\/wiki/) + ' /api/wiki, :' +
      findLine(wiki, /\/api\/state/) + ' /api/state, :' + findLine(wiki, /\/api\/journal/) + ' /api/journal';
  });
  await safe('projection-replay-deterministic', async () => {
    const mod = await import(pathToFileURL(resolve(root, JOURNAL_MOD)).href);
    const seedState = JSON.parse(read(SEED_STATE));
    const seedWiki = JSON.parse(read(SEED_WIKI));
    const record = { kind: 'chat-send', actor: 'loop-agent', schemaVersion: 1,
      text: 'deterministic projection probe', intent: null,
      receivedAt: '2026-11-16T00:00:00.000Z', entryId: '00000000-0000-4000-8000-000000000000', sequence: 1 };
    const a = mod.replayProductJournal(seedState, seedWiki, [record]);
    const b = mod.replayProductJournal(seedState, seedWiki, [record]);
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('replay not deterministic');
    if (a.state.chat.length !== (seedState.chat || []).length + 1 || a.state.revision !== 1)
      throw new Error('chat-send replay did not project one chat entry + revision');
    if (a.wiki.revision !== seedWiki.revision) throw new Error('chat-send must not move the wiki revision');
    return 'replayProductJournal(seed,seed,[chat-send]) x2 identical; chat+1 revision=1 wikiRevision unchanged=' + a.wiki.revision;
  });

  // ---------------- live: isolated Host, chat POST, journal + parity ----------------
  let parity = null;
  if (live) {
    let dataRoot = null;
    let child = null;
    let baseUrl = '';
    try {
      const port = await freePort();
      dataRoot = mkdtempSync(join(tmpdir, ISO_MARKER));
      const realRoot = realpathSync(dataRoot);
      baseUrl = 'http://127.0.0.1:' + port;
      let guardPass = port !== REAL_PORT && isFlaggedIsolatedRoot(realRoot, tmpdir);
      let guardDetail = 'scratch port ' + port + ' (!= ' + REAL_PORT + '), flagged temp data root ' + realRoot;
      try { assertIsolatedLive(baseUrl, true); } catch (e) { guardPass = false; guardDetail += ' | ' + e.message; }
      check('isolated-boot-guard', guardPass, guardDetail);
      const bootFn = boot || (async () => {
        child = spawnImpl('bun', [resolve(root, SERVER)], {
          cwd: root, env: bootEnvFor(port, realRoot), stdio: ['ignore', 'pipe', 'pipe']
        });
        child.stdout?.on('data', () => {});
        child.stderr?.on('data', () => {});
        await waitReady(baseUrl, fetchImpl);
      });
      await safe('isolated-host-ready', () => bootFn());
      const io = makeTransport(baseUrl, fetchImpl);
      const json = async route => {
        const out = await io.get(route);
        if (out.status !== 200) throw new Error(route + ' status=' + out.status);
        return JSON.parse(out.body);
      };
      const stateBefore = await safe('state-before', () => json('/api/state'));
      const wikiBefore = await safe('wiki-before', () => json('/api/wiki'));
      const journalBefore = await safe('journal-before', async () =>
        parseJournalResponse((await io.get('/api/journal')).body));
      const rawBefore = await safe('raw-journal-before', async () =>
        parseRawJournal((await io.get('/api/journal?format=jsonl')).body));

      const text = 'A02 parity probe ' + hash(baseUrl).slice(0, 12);
      const machinePost = await safe('chat-post-machine', async () => {
        const out = await io.post('/api/mutate',
          { kind: 'chat-send', schemaVersion: 1, actor: 'loop-agent', text });
        if (out.status !== 200) throw new Error('machine POST status=' + out.status + ' body=' + out.body.slice(0, 200));
        return JSON.parse(out.body);
      });
      const browserPost = await safe('chat-post-owner-browser', async () => {
        const out = await io.post('/api/mutate',
          { kind: 'chat-send', schemaVersion: 1, actor: 'owner-browser', text });
        if (out.status !== 200) throw new Error('owner-browser POST status=' + out.status + ' body=' + out.body.slice(0, 200));
        return JSON.parse(out.body);
      });

      const journalAfter = await safe('journal-after', async () =>
        parseJournalResponse((await io.get('/api/journal')).body));
      const rawAfter = await safe('raw-journal-after', async () =>
        parseRawJournal((await io.get('/api/journal?format=jsonl')).body));
      const stateAfter = await safe('state-after', () => json('/api/state'));
      const wikiAfter = await safe('wiki-after', () => json('/api/wiki'));

      const appended = journalAfter && journalBefore ? journalAfter.slice(journalBefore.length) : null;
      check('journal-records-two-deterministic-mutations', Boolean(appended) &&
        journalAfter.length === journalBefore.length + 2 && appended.length === 2 &&
        appended.every(e => e.kind === 'chat-send' && e.text === text && e.intent != null &&
          Number.isSafeInteger(e.sequence) && typeof e.entryId === 'string'),
        'journal ' + (journalBefore?.length ?? '?') + ' -> ' + (journalAfter?.length ?? '?') +
        ' appended=' + (appended ? appended.map(e => e.actor + '#' + e.sequence).join(',') : 'n/a'));
      check('journal-api-raw-parity', journalAfter !== null && rawAfter !== null &&
        JSON.stringify(journalAfter) === JSON.stringify(rawAfter) &&
        journalBefore !== null && rawBefore !== null && JSON.stringify(journalBefore) === JSON.stringify(rawBefore),
        '/api/journal array === /api/journal?format=jsonl entries before and after');
      check('state-projection-records-mutation', stateAfter !== null && stateBefore !== null &&
        stateAfter.chat.length === stateBefore.chat.length + 2 &&
        stateAfter.revision === stateBefore.revision + 2 &&
        stateAfter.chat.slice(-2).every(m => m.text === text) &&
        stateAfter.wikiRevision === stateBefore.wikiRevision,
        'chat +2, revision ' + stateBefore?.revision + '->' + stateAfter?.revision +
        ', wikiRevision unchanged=' + stateAfter?.wikiRevision);
      check('wiki-projection-consistent', wikiAfter !== null && wikiBefore !== null && stateAfter !== null &&
        wikiAfter.revision === wikiBefore.revision && wikiAfter.revision === stateAfter.wikiRevision,
        '/api/wiki revision ' + wikiBefore?.revision + ' unchanged by chat-send and === /api/state.wikiRevision; ' +
        'journal is the single writer behind both projections');
      parity = appended && appended.length === 2 ? parityDigest(appended) : null;
      check('same-envelope-parity', parity !== null &&
        JSON.stringify(normalizeEntry(appended[0])) === JSON.stringify(normalizeEntry(appended[1])) &&
        appended[0].intent && JSON.stringify(appended[0].intent) === JSON.stringify(appended[1].intent),
        'machine loop-agent POST and owner-browser send, identical envelope {kind,schemaVersion,text}; ' +
        'normalized mutation identical, intent identical; parityDigest=' + parity);
      check('isolated-root-only', port !== REAL_PORT && isFlaggedIsolatedRoot(realRoot, tmpdir) &&
        existsSync(join(realRoot, 'product-state', 'journal.jsonl')),
        'journal written only under flagged temp root ' + realRoot + '/product-state/journal.jsonl; ' +
        'no request to port ' + REAL_PORT);
    } catch (error) {
      check('isolated-live-projection', false, String(error?.message || error));
    } finally {
      if (child) {
        const code = await stopHost(child);
        check('isolated-host-shutdown', true, 'scratch Host stopped (exit=' + code + ')');
      }
      if (dataRoot) { try { rmSync(dataRoot, { recursive: true, force: true }); } catch {} }
    }
  }

  const ok = checks.every(c => c.pass);
  return {
    schema: 'arbor.item-receipt/1', ok, item: 'A02',
    scope: live ? 'SOURCE_PLUS_ISOLATED_LIVE_PROJECTION' : 'SOURCE_ONLY',
    isolation: live ? 'SCRATCH_PORT_FLAGGED_TEMP_DATA_ROOT_ONLY' : 'NONE',
    parityDigest: parity,
    browserDom: 'UNRUN', physicalDevice: 'UNRUN', independentKeeperAcceptance: 'UNRUN',
    checks, digest: hash(JSON.stringify(checks))
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write('Usage: node scripts/batch-evidence/A02.mjs [--static|--live]\n');
    return;
  }
  const flags = args.filter(x => x === '--static' || x === '--live');
  if (args.length !== flags.length || new Set(flags).size !== flags.length || flags.length > 1) {
    process.stderr.write('Unknown or duplicate argument\n'); process.exitCode = 2; return;
  }
  try {
    const result = await runA02Evidence({ live: flags.includes('--live') });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write('A02 evidence unavailable: ' + String(error?.message || error) + '\n');
    process.exitCode = 2;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
