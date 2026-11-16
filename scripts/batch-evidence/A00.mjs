#!/usr/bin/env node
// A00 independent evidence — "Truth and queue repair" (arbor.item-receipt/1).
// Static: roadmap.v1.json self-consistency + scripts/roadmap/evidence-truth.mjs
// deriveReleaseTruth runs clean on the ledgers it names. Live: read-only GETs
// against the live loopback Host (default http://127.0.0.1:43187) — /api/state
// and the /api/roadmap queue projection answer 200 and expose the live queue.
// Live mode here performs NO mutations, so no isolated data root is needed;
// the base URL is still guarded to loopback http by assertIsolatedLive.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ROADMAP = 'docs/product/roadmap/roadmap.v1.json';
const RECEIPTS_DIR = 'docs/product/roadmap/receipts';
const DEFAULT_BASE = 'http://127.0.0.1:43187';

// Lane-truth status vocabulary: the union of statuses the roadmap lanes, the
// batch engine board (queued/briefed/implemented/gated/awaiting-routes/blocked)
// and the actionable set (queued/in-progress/approved) actually use.
const LANE_STATUS_VOCAB = new Set([
  'todo', 'candidate', 'active', 'in-progress', 'implemented', 'deferred',
  'gated', 'executed', 'built', 'queued', 'approved', 'briefed',
  'awaiting-routes', 'blocked'
]);
// A verification value that is a bare pass claim (not UNRUN, not an explicit
// negative like FAILED_*/NOT_*/GENERATOR_ONLY_*) claims "verified".
const NEGATIVE_VERIFICATION = /UNRUN|FAILED|NOT_|GENERATOR_ONLY|PENDING/i;

const hash = value => createHash('sha256').update(value).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function collectIdItems(node, out = []) {
  if (!object(node) && !Array.isArray(node)) return out;
  if (Array.isArray(node)) { for (const x of node) collectIdItems(x, out); return out; }
  if (typeof node.id === 'string' && node.id.length > 0) out.push(node);
  for (const value of Object.values(node)) if (object(value) || Array.isArray(value)) collectIdItems(value, out);
  return out;
}

export function claimsVerified(item) {
  if (!object(item)) return false;
  if (item.verification === 'INDEPENDENT_PASS') return true;
  if (typeof item.verification === 'string' && item.verification !== 'UNRUN' &&
      !NEGATIVE_VERIFICATION.test(item.verification)) return true;
  if (item.ownerAcceptance === 'ACCEPTED' && item.verification !== 'UNRUN') return true;
  return false;
}

// Pure self-consistency projection; receiptFor(id) -> boolean is injected so
// tests can supply a fixture. Returns { ok, errors, stats }.
export function roadmapSelfConsistency(roadmap, receiptFor = () => false) {
  const errors = [];
  if (!object(roadmap)) return { ok: false, errors: ['roadmap is not an object'], stats: {} };
  if (roadmap.schema !== 'arbor.product-roadmap/1')
    errors.push('Unexpected roadmap schema ' + JSON.stringify(roadmap.schema));
  const items = collectIdItems(roadmap);
  const byId = new Map();
  for (const item of items) {
    if (byId.has(item.id)) errors.push('Duplicate item id ' + item.id);
    else byId.set(item.id, item);
  }
  for (const item of items) {
    if (typeof item.status === 'string' && !LANE_STATUS_VOCAB.has(item.status))
      errors.push('Status outside lane-truth vocabulary: ' + item.id + ' status=' + item.status);
    if (claimsVerified(item) && !receiptFor(item.id))
      errors.push('Item claims verified without receipt: ' + item.id +
        ' verification=' + item.verification + ' (missing ' + RECEIPTS_DIR + '/' + item.id + '.receipt.json)');
    for (const dep of Array.isArray(item.dependsOn) ? item.dependsOn : []) {
      if (dep === item.id) errors.push('Self-dependency ' + item.id);
      else if (!byId.has(dep)) errors.push('dependsOn references missing id: ' + item.id + ' -> ' + dep);
    }
  }
  const queue = Array.isArray(roadmap.buildQueue) ? roadmap.buildQueue : [];
  const queueIds = new Set();
  for (const row of queue) {
    if (!object(row) || typeof row.itemId !== 'string') { errors.push('Malformed buildQueue row'); continue; }
    if (queueIds.has(row.itemId)) errors.push('Duplicate queue item ' + row.itemId);
    queueIds.add(row.itemId);
    if (!byId.has(row.itemId)) errors.push('Queue item missing from items: ' + row.itemId);
    if (typeof row.status === 'string' && !LANE_STATUS_VOCAB.has(row.status))
      errors.push('Queue status outside lane-truth vocabulary: ' + row.itemId + ' status=' + row.status);
    // Note: queue-row vs L2-item status equality is deliberately NOT asserted
    // here — the batch engine's one-writer flip (arbor-batch-engine.dwf.ts
    // FLIP_CODE) writes only the queue row, so row.status may legitimately
    // diverge from the L2 item status. A00's mandated scope is: unique ids,
    // dependsOn references, lane-truth status vocabulary, verified receipts.
  }
  return {
    ok: errors.length === 0, errors,
    stats: { items: items.length, queue: queue.length, verifiedClaims: items.filter(claimsVerified).length }
  };
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
    throw new Error('--live requires an explicit isolated http://127.0.0.1:<port> loopback Host (no credentials/query/hash)');
  }
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

export async function runA00Evidence({
  root = ROOT, live = false, baseUrl = DEFAULT_BASE,
  isolated = true, transport = null, fetchImpl = globalThis.fetch
} = {}) {
  if (live) assertIsolatedLive(baseUrl, isolated);
  const checks = [];
  const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail: String(detail) });
  const safe = async (name, fn) => {
    try { const value = await fn(); check(name, true, 'validated'); return value; }
    catch (error) { check(name, false, String(error?.message || error)); return null; }
  };
  const read = file => readFileSync(resolve(root, file), 'utf8');
  const exists = file => existsSync(resolve(root, file));
  const receiptFor = id => exists(join(RECEIPTS_DIR, id + '.receipt.json'));

  let roadmap = null;
  await safe('roadmap-parses', () => {
    roadmap = JSON.parse(read(ROADMAP));
    if (roadmap.schema !== 'arbor.product-roadmap/1') throw new Error('schema=' + roadmap.schema);
    return roadmap.schema;
  });

  const consistency = roadmap ? roadmapSelfConsistency(roadmap, receiptFor) : { ok: false, errors: ['roadmap unreadable'], stats: {} };
  check('unique-item-ids', consistency.errors.filter(e => e.startsWith('Duplicate')).length === 0,
    'items=' + (consistency.stats.items ?? 0) + ' duplicates=' +
    consistency.errors.filter(e => e.startsWith('Duplicate')).join('; '));
  check('depends-on-references-existing-ids', consistency.errors.filter(e => /dependsOn|Self-dependency|missing from items/.test(e)).length === 0,
    'unresolved refs=' + consistency.errors.filter(e => /dependsOn|Self-dependency|missing from items/.test(e)).length);
  check('statuses-in-lane-truth-vocabulary', consistency.errors.filter(e => /vocabulary/.test(e)).length === 0,
    'vocab=[' + [...LANE_STATUS_VOCAB].join(',') + '] violations=' +
    consistency.errors.filter(e => /vocabulary/.test(e)).join('; '));
  check('no-verified-claim-without-receipt', consistency.errors.filter(e => /receipt/.test(e)).length === 0,
    'verifiedClaims=' + (consistency.stats.verifiedClaims ?? 0) +
    ' receiptsDir=' + (exists(RECEIPTS_DIR) ? 'present' : 'absent') +
    (consistency.errors.filter(e => /receipt/.test(e)).join('; ') || ' no bare pass claim lacks ' + RECEIPTS_DIR + '/<id>.receipt.json'));
  check('roadmap-self-consistent', consistency.ok, consistency.errors.join('; ') ||
    'items=' + consistency.stats.items + ' queue=' + consistency.stats.queue);

  await safe('evidence-truth-derives-clean', async () => {
    const mod = await import(pathToFileURL(resolve(root, 'scripts/roadmap/evidence-truth.mjs')).href);
    const sources = mod.loadReleaseSources(root);
    for (const rel of Object.values(mod.SOURCES ?? {})) {
      if (!exists(rel)) throw new Error('Ledger missing: ' + rel);
    }
    const truth = mod.deriveReleaseTruth(sources);
    if (truth.schema !== 'arbor.release-truth-projection/2')
      throw new Error('Unexpected projection schema ' + truth.schema);
    return truth;
  }).then(truth => {
    if (truth) check('evidence-truth-projection-shape', true,
      'disposition=' + truth.disposition + ' blockers=' + truth.blockers.length +
      ' conflicts=' + truth.conflicts.length + ' releaseReady=' + truth.releaseReady +
      ' (truthful blocked projection is a clean read, never acceptance)');
    else check('evidence-truth-projection-shape', false, 'deriveReleaseTruth did not return');
  });

  if (live) {
    const io = transport || makeTransport(baseUrl, fetchImpl);
    const state = await safe('live-state-api-200', async () => {
      const out = await io.get('/api/state');
      if (out.status !== 200 || !/application\/json/i.test(out.type || ''))
        throw new Error('/api/state status=' + out.status + ' type=' + out.type);
      const value = JSON.parse(out.body);
      if (!Array.isArray(value.chat) || !Number.isSafeInteger(value.wikiRevision) ||
          !Number.isSafeInteger(value.revision))
        throw new Error('Invalid /api/state shape: chat/wikiRevision/revision');
      return value;
    });
    const queueRoute = await safe('live-queue-projection-200', async () => {
      const out = await io.get('/api/roadmap');
      if (out.status !== 200 || !/application\/json/i.test(out.type || ''))
        throw new Error('/api/roadmap status=' + out.status + ' type=' + out.type);
      const value = JSON.parse(out.body);
      if (!Array.isArray(value.buildQueue) || value.buildQueue.length === 0)
        throw new Error('Live queue projection has no buildQueue');
      return value;
    });
    check('live-queue-exposes-batch-items', Boolean(queueRoute) &&
      ['A00', 'A01', 'A02'].every(id => queueRoute.buildQueue.some(e => e.itemId === id && typeof e.status === 'string')),
      'buildQueue=' + (queueRoute ? queueRoute.buildQueue.map(e => e.itemId + ':' + e.status).join(' ') : 'unavailable') +
      ' (base=' + baseUrl + ' GET-only, no mutation)');
    check('live-queue-matches-committed-roadmap', Boolean(queueRoute) && Boolean(roadmap) &&
      JSON.stringify(queueRoute.buildQueue.map(e => ({ itemId: e.itemId, status: e.status, verification: e.verification }))) ===
      JSON.stringify((roadmap.buildQueue || []).map(e => ({ itemId: e.itemId, status: e.status, verification: e.verification }))),
      'live /api/roadmap queue projection deep-equals ' + ROADMAP + ' buildQueue');
    const journal = await safe('live-journal-read-consistency', async () => {
      const api = parseJournalResponse((await io.get('/api/journal')).body);
      const raw = parseRawJournal((await io.get('/demo/journal.jsonl')).body);
      if (JSON.stringify(api) !== JSON.stringify(raw))
        throw new Error('/api/journal array and /demo/journal.jsonl disagree');
      return api;
    });
    check('live-reads-are-read-only', Boolean(state) && Boolean(queueRoute) && journal !== null,
      'GET /api/state + /api/roadmap + /api/journal + /demo/journal.jsonl only; no POST issued; port-43187 data untouched by this runner');
  }

  const ok = checks.every(c => c.pass);
  return {
    schema: 'arbor.item-receipt/1', ok, item: 'A00',
    scope: live ? 'SOURCE_PLUS_READ_ONLY_LIVE_GETS' : 'SOURCE_ONLY',
    mutation: live ? 'NONE_READ_ONLY' : 'NONE',
    browserDom: 'UNRUN', physicalDevice: 'UNRUN', independentKeeperAcceptance: 'UNRUN',
    checks, digest: hash(JSON.stringify(checks))
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write('Usage: node scripts/batch-evidence/A00.mjs [--static|--live]\n');
    return;
  }
  const flags = args.filter(x => x === '--static' || x === '--live');
  if (args.length !== flags.length || new Set(flags).size !== flags.length || flags.length > 1) {
    process.stderr.write('Unknown or duplicate argument\n'); process.exitCode = 2; return;
  }
  try {
    const live = flags.includes('--live');
    const result = await runA00Evidence({
      live,
      baseUrl: process.env.ARBOR_A00_EVIDENCE_BASE_URL || DEFAULT_BASE,
      isolated: process.env.ARBOR_A00_EVIDENCE_ISOLATED !== '0'
    });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write('A00 evidence unavailable: ' + String(error?.message || error) + '\n');
    process.exitCode = 2;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
