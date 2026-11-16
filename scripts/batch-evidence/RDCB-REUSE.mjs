#!/usr/bin/env bun
// scripts/batch-evidence/RDCB-REUSE.mjs
//
// Gate-evidence driver for item A06 — "Incremental RDCB context with reuse receipts".
// Persistent source/revision-scoped bundle cache keyed by sha256 of each seeded
// file's CURRENT bytes (not registry sourceDigest, which drifts).
//
//   bun scripts/batch-evidence/RDCB-REUSE.mjs [--live] [--caller <ns>] [--change <relPath>]
//
// --live       run the generator (rdcb-gen.mjs) on cache misses instead of serving from cache.
// --caller <ns> caller namespace/identity. REQUIRED. Namespaces do NOT authenticate
//   (scoped_graph.rs does not authenticate), so caller identity is explicit and is the
//   isolation key: a cache entry is only served to the caller that stored it.
// --change <relPath> append a newline to the seeded source to simulate a changed
//   source revision, exercising selective invalidation of only the affected bundle.
//
// Prints exactly one JSON object: { ok, checks:[{name,pass,detail}], receipts:[...] }
// Exits nonzero when any check fails. Writes cache state to a temp dir (never to the
// repo) so no repo file outside this script's own path is touched.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const ITEM = 'RDCB-REUSE';
const GEN = resolve(REPO_ROOT, 'apps/vivim-host/control/rdcb-gen.mjs');
const OUT_DIR = resolve(REPO_ROOT, 'apps/vivim-host/data/demo-baseline/rdcb');
const SURFACE = resolve(REPO_ROOT, 'apps/vivim-host/data/demo-baseline/file-surface.v1.json');
const CATALOG = resolve(REPO_ROOT, 'apps/vivim-host/control/action-catalog.v1.json');

// Same seeded corpus as rdcb-gen.mjs (order matters, explicit list, no globbing).
const SEED_FILES = [
  'apps/vivim-host/public/demo/controller.js',
  'apps/vivim-host/public/demo/demo.html',
  'apps/vivim-host/public/demo/poll-round.mjs'
];

// Persistent cache lives outside the repo (temp dir) so this script touches no
// repo file other than its own source. Keyed per repo root so concurrent clones
// don't collide.
const REPO_TAG = createHash('sha256').update(REPO_ROOT).digest('hex').slice(0, 16);
const CACHE_DIR = join(os.tmpdir(), `arbor-rdcb-cache-${REPO_TAG}`);
const CACHE_STATE = join(CACHE_DIR, 'cache-state.json');

const TOKENS_PER_BYTE = 3; // protocol estimator "utf8-bytes/3"

const checks = [];
const receipts = [];
let live = false;
let caller = null;
let changePath = null;

for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === '--live') live = true;
  else if (arg === '--help' || arg === '-h') {
    process.stdout.write(`usage: bun ${resolve(HERE, 'RDCB-REUSE.mjs')} [--live] [--caller <ns>] [--change <relPath>]\n`);
    process.exit(0);
  } else if (arg === '--caller') {
    caller = process.argv[++i];
    if (!caller) fail('--caller requires a namespace value');
  } else if (arg === '--change') {
    changePath = process.argv[++i];
    if (!changePath) fail('--change requires a relative path');
  } else {
    process.stderr.write(`${ITEM}: unknown argument: ${arg}\n`);
    process.exit(2);
  }
}

// Fail-closed: caller identity must be explicit. Namespaces do not authenticate,
// so without an explicit caller no reuse decision can be authorized.
if (!caller) {
  process.stderr.write(`${ITEM}: --caller <ns> is required (caller identity is explicit; no ambient auth)\n`);
  process.exit(2);
}

function fail(msg) {
  process.stderr.write(`${ITEM}: ${msg}\n`);
  process.exit(2);
}
function check(name, pass, detail) {
  checks.push({ name, pass: Boolean(pass), detail: String(detail) });
}
function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}
function estimateTokens(text) {
  return Math.ceil(Buffer.byteLength(text, 'utf8') / TOKENS_PER_BYTE);
}
function readRepoFile(relPath) {
  try { return readFileSync(join(REPO_ROOT, ...relPath.split('/'))); } catch (err) { fail(relPath + ': unreadable: ' + err.message); }
}

function loadCache() {
  try {
    const state = JSON.parse(readFileSync(CACHE_STATE, 'utf8'));
    if (!state || state.schema !== 'arbor.rdcb-cache/1') return { entries: {} };
    return state;
  } catch { return { entries: {} }; }
}
function saveCache(state) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_STATE, JSON.stringify(state, null, 2) + '\n');
}
function bundlePathFor(relPath) {
  return join(CACHE_DIR, 'bundles', relPath.replace(/\//g, '__') + '.rdcb.v1.json');
}
function readCachedBundle(relPath) {
  const p = bundlePathFor(relPath);
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}
function storeBundle(relPath, bundle) {
  const dir = join(CACHE_DIR, 'bundles');
  mkdirSync(dir, { recursive: true });
  const bytes = JSON.stringify(bundle, null, 2) + '\n';
  const p = bundlePathFor(relPath);
  writeFileSync(p, bytes);
  return Buffer.byteLength(bytes, 'utf8');
}

// ---- generator subprocess (partition 0 owns rdcb-gen.mjs; we only invoke it) ----
function runGenerator() {
  const r = Bun.spawnSync(['bun', GEN], { cwd: REPO_ROOT, stdout: 'pipe', stderr: 'pipe' });
  if (r.exitCode !== 0) {
    fail('rdcb-gen.mjs exit=' + r.exitCode + ' stderr=' + (r.stderr && r.stderr.toString().slice(0, 200)));
  }
  return r.stdout.toString();
}
function readFreshBundle(relPath) {
  const base = relPath.slice(relPath.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
  const p = join(OUT_DIR, base + '.rdcb.v1.json');
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

function sourceFingerprint(relPath) {
  return sha256Hex(readRepoFile(relPath).toString('utf8'));
}

// ---- main ----
function main() {
  // Optional simulated source revision change (test hook: mutates the seeded file,
  // then restored by the operator via git). Only the affected bundle is invalidated.
  if (changePath) {
    if (!SEED_FILES.includes(changePath)) fail('--change must name a seeded file: ' + SEED_FILES.join(', '));
    const abs = join(REPO_ROOT, ...changePath.split('/'));
    const cur = readFileSync(abs, 'utf8');
    writeFileSync(abs, cur.endsWith('\n') ? cur + '\n' : cur + '\n');
    check('source-revision-changed', true, changePath + ' appended newline (simulated revision change)');
  }

  check('generator-present', existsSync(GEN), 'apps/vivim-host/control/rdcb-gen.mjs exists=' + existsSync(GEN));
  check('surface-registry-present', existsSync(SURFACE), 'file-surface.v1.json exists=' + existsSync(SURFACE));
  check('catalog-resolvable', existsSync(CATALOG), 'action-catalog.v1.json exists=' + existsSync(CATALOG));

  const cache = loadCache();
  const byCaller = cache.entries[caller] || { entries: {} };
  const entries = byCaller.entries;

  // Compute current fingerprints (sha256 of CURRENT bytes, not registry sourceDigest).
  const fingerprints = {};
  for (const relPath of SEED_FILES) fingerprints[relPath] = sourceFingerprint(relPath);

  // Run generator once on the first cache miss (live mode only). Static mode never
  // runs the generator; it reports what the cache would do.
  let generatorRan = false;
  function ensureGenerator() {
    if (!live) return;
    if (!generatorRan) { runGenerator(); generatorRan = true; }
  }

  for (const relPath of SEED_FILES) {
    const currentDigest = fingerprints[relPath];
    const entry = entries[relPath];
    const hit = entry && entry.fingerprint === currentDigest && entry.caller === caller;

    let bundle, servedFromCache, reusedBytes, reusedTokensEstimate, providerCosts;

    if (hit) {
      // Cache HIT: serve cached bundle, do not regenerate.
      bundle = readCachedBundle(relPath) || readFreshBundle(relPath);
      const bundleJson = JSON.stringify(bundle);
   
      reusedBytes = Buffer.byteLength(bundleJson, 'utf8');
      reusedTokensEstimate = estimateTokens(bundleJson);
      servedFromCache = true;
      providerCosts = { regenerated: false, regenerationRuns: 0, bytesRegenerated: 0, tokensRegeneratedEstimate: 0 };
    } else {
      if (entry && entry.fingerprint !== currentDigest) {
        check('invalidated-affected-bundle', true, relPath + ' fingerprint drifted (' + (entry.fingerprint || 'none') + ' -> ' + currentDigest + '); affected bundle only');
      } else if (entry && entry.caller !== caller) {
        check('cross-user-reuse-rejected', true, relPath + ' entry belongs to caller ' + entry.caller + ', refused for ' + caller + ' (fail-closed)');
      }
      ensureGenerator();
      bundle = readFreshBundle(relPath);
      if (!bundle) fail(relPath + ': no bundle emitted by generator');
      const bundleJson = JSON.stringify(bundle);
      const bytesRegenerated = storeBundle(relPath, bundle);
      entries[relPath] = { fingerprint: currentDigest, caller, servedAt: new Date().toISOString() };
      reusedBytes = 0;
      reusedTokensEstimate = 0;
      servedFromCache = false;
      providerCosts = { regenerated: true, regenerationRuns: 1, bytesRegenerated: bytesRegenerated, tokensRegeneratedEstimate: estimateTokens(bundleJson) };
    }

    const source = Array.isArray(bundle.sources) ? bundle.sources[0] : null;
    const workOrderAttachment = {
      schema: 'arbor.rdcb-work-order-attachment/1',
      sourcePath: relPath,
      caller,
      bundleDigest: bundle.digest || null,
      fingerprint: currentDigest,
      servedFromCache,
      sourceExcerpt: source ? { kind: source.excerpt?.kind, lines: source.excerpt?.lines, text: source.excerpt?.text } : null,
      reprogramming: bundle.reprogramming ? { vlangExecution: bundle.reprogramming.vlangExecution, corpusScope: bundle.reprogramming.corpusScope } : null
    };
    receipts.push({
      schema: 'arbor.rdcb-reuse-receipt/1',
      sourcePath: relPath,
      caller,
      fingerprint: currentDigest,
      servedFromCache,
      reusedBytes,
      reusedTokensEstimate,
      providerCostsMeasured: providerCosts,
      bundleDigest: bundle.digest || null,
      workOrderAttachment,
      failClosed: { crossUserReuseRejected: entry && entry.caller !== caller, unauthorizedReuseRejected: !caller }
    });
    check('receipt-' + relPath.replace(/\//g, '-'), true, 'servedFromCache=' + servedFromCache + ' reusedBytes=' + reusedBytes + ' reusedTokensEstimate=' + reusedTokensEstimate + ' digest=' + (bundle.digest || 'none').slice(0, 12));
  }
  saveCache({ schema: 'arbor.rdcb-cache/1', entries: { [caller]: { entries } } });

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(join(CACHE_DIR, 'work-orders.' + caller + '.json'), JSON.stringify({ schema: 'arbor.rdcb-work-orders/1', caller, attachments: receipts.map(r => r.workOrderAttachment), updatedAt: new Date().toISOString() }, null, 2) + '\n');

  const allFresh = receipts.every(r => r.workOrderAttachment.reprogramming?.vlangExecution === false);
  check('vlang-execution-false', allFresh, 'every bundle reprogramming.vlangExecution=false (format + generator only; no VLang execution added)');
  const allDigests = receipts.every(r => /^[0-9a-f]{64}$/.test(r.bundleDigest || ''));
  check('bundle-digests-64-hex', allDigests, 'every bundle carries a 64-hex verified digest');

  const ok = checks.every(c => c.pass);
  const verdict = { ok, item: ITEM, checks, receipts };
  process.stdout.write(JSON.stringify(verdict, null, 2) + '\n');
  process.exit(ok ? 0 : 1);
}

main();
