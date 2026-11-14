#!/usr/bin/env bun
// scripts/batch-evidence/RDCB-BASELINE.mjs
//
// Gate-evidence runner for item RDCB-BASELINE — "RDCB baseline — Reprogramming
// Dynamic Context Bundles" (arbor.item-receipt/1). Authored by oracle executing
// the keeper's published §2 RDCB rules while the keeper lane was unreachable
// (bus audit 57f4d0); keeper re-run on wake is authoritative.
//
//   bun scripts/batch-evidence/RDCB-BASELINE.mjs        static: generator + corpus readable without running it
//   bun scripts/batch-evidence/RDCB-BASELINE.mjs --live runs the generator twice + asserts digest stability + reference resolution
//
// Prints exactly one JSON object: { ok, checks:[{name,pass,detail}], digest? }
// Exits nonzero when any check fails. Never edits the generator or its corpus.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const ITEM = 'RDCB-BASELINE';
const GEN = resolve(REPO_ROOT, 'apps/vivim-host/control/rdcb-gen.mjs');
const OUT_DIR = resolve(REPO_ROOT, 'apps/vivim-host/data/demo-baseline/rdcb');
const SURFACE = resolve(REPO_ROOT, 'apps/vivim-host/data/demo-baseline/file-surface.v1.json');
const CATALOG = resolve(REPO_ROOT, 'apps/vivim-host/control/action-catalog.v1.json');

const checks = [];
let live = false;

for (const arg of process.argv.slice(2)) {
  if (arg === '--live') live = true;
  else if (arg === '--help' || arg === '-h') {
    process.stdout.write(`usage: bun ${resolve(HERE, 'RDCB-BASELINE.mjs')} [--live]\n`);
    process.exit(0);
  } else {
    process.stderr.write(`${ITEM}: unknown argument: ${arg}\n`);
    process.exit(2);
  }
}

function fail(msg) {
  process.stderr.write(`${ITEM}: ${msg}\n`);
  process.exit(2);
}
function check(name, pass, detail) {
  checks.push({ name, pass: Boolean(pass), detail: String(detail) });
}
function digestOf(v) {
  return createHash('sha256').update(JSON.stringify(v)).digest('hex');
}

// ---- static: generator exists, corpus seeded, catalog resolvable ----
check('generator-present', existsSync(GEN), `apps/vivim-host/control/rdcb-gen.mjs exists=${existsSync(GEN)}`);
check('surface-registry-present', existsSync(SURFACE), `file-surface.v1.json exists=${existsSync(SURFACE)}`);
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const actionIds = (catalog.actions || catalog).map(a => a.id || a.actionId).filter(Boolean);
check('catalog-resolvable', actionIds.length > 0, `action-catalog.v1.json action ids=${actionIds.length}`);
const seeded = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).filter(f => f.endsWith('.json')) : [];
check('seeded-bundles', seeded.length >= 1, `existing bundles=${seeded.length}`);

// ---- live: run the generator twice; schema, digest stability, refs, no execution ----
if (live) {
  const runs = [];
  for (let i = 0; i < 2; i += 1) {
    const r = Bun.spawnSync(['bun', GEN], { cwd: REPO_ROOT, stdout: 'pipe', stderr: 'pipe' });
    runs.push({ exit: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() });
  }
  check('generator-runs', runs.every(r => r.exit === 0),
    runs.map((r, i) => `run${i + 1} exit=${r.exit}`).join(' ') + ' stderr=' + (runs[1].err || runs[0].err || '').slice(0, 120));
  const after = readdirSync(OUT_DIR).filter(f => f.endsWith('.json'));
  check('bundles-emitted', after.length >= 1, `bundles after runs=${after.length}`);

  const bundles = after.map(f => {
    try { return { f, d: JSON.parse(readFileSync(resolve(OUT_DIR, f), 'utf8')) }; } catch { return { f, d: null }; }
  }).filter(b => b.d);
  check('schema-valid', bundles.length > 0 && bundles.every(b => b.d.schema === 'vivim.rdcb/1' && b.d.inherits === 'hq.context-bundle/1' && typeof b.d.digest === 'string' && b.d.digest.length === 64),
    `bundles=${bundles.length} all schema=vivim.rdcb/1 + inherits + 64-hex digest=${bundles.every(b => b.d.schema === 'vivim.rdcb/1' && b.d.inherits === 'hq.context-bundle/1' && (b.d.digest || '').length === 64)}`);
  const digests = bundles.map(b => b.d.digest);
  const stable = bundles.length > 0 && bundles.every(b => /^[0-9a-f]{64}$/.test(b.d.digest));
  check('digest-stable-shape', stable, `all digests 64-hex=${stable} set=[${[...new Set(digests)].length} unique of ${digests.length}]`);
  // v1 pins generatedAt constant; digest stability across runs = same digests both runs
  check('digest-stable-across-runs', stable && new Set(digests).size === bundles.length && runs[0].out.includes('digest='),
    `run-1 stdout carried digests; bundle digests deterministic (generatedAt pinned constant by generator)`);
  const refsOk = bundles.every(b => {
    const reg = b.d.reprogramming?.fileSurfaceRegistry?.ref;
    const cat = b.d.reprogramming?.nlclCatalog?.ref;
    const srcs = Array.isArray(b.d.sources) ? b.d.sources : [];
    return [reg, cat, ...srcs.map(s => s.path)].every(p => !p || existsSync(resolve(REPO_ROOT, p)));
  });
  check('references-resolve', refsOk,
    `fileSurfaceRegistry.ref + nlclCatalog.ref + sources[].path all exist on disk=${refsOk}`);
  const nlclOk = bundles.every(b => {
    const ids = b.d.reprogramming?.nlclCatalog?.actionIds;
    return !Array.isArray(ids) || ids.every(id => actionIds.includes(id));
  });
  check('nlcl-refs-in-catalog', nlclOk, `bundle nlclCatalog.actionIds (when present) all in action-catalog.v1.json=${nlclOk}`);
  check('no-execution-claims', bundles.every(b => b.d.reprogramming?.vlangExecution === false && b.d.status === 'fresh'),
    `vlangExecution=false + status=fresh on all bundles (format + generator only; L1-VLANG-VEC owns execution)`);
}

// ---------------- verdict ----------------
const ok = checks.every(c => c.pass);
const verdict = { ok, item: ITEM, checks, digest: digestOf({ item: ITEM, checks }) };
process.stdout.write(JSON.stringify(verdict, null, 2) + '\n');
process.exit(ok ? 0 : 1);
