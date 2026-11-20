# File: scripts/batch-evidence/RDCB-BASELINE.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/batch-evidence/RDCB-BASELINE.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6160 B |
| Lines | 106 |
| Hash | 081ce69fb8c3 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 20 | no | const HERE = dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 21 | no | const REPO_ROOT = resolve(HERE, &#39;..&#39;, &#39;..&#39;); |
| ITEM | const | 22 | no | const ITEM = &#39;RDCB-BASELINE&#39;; |
| GEN | const | 23 | no | const GEN = resolve(REPO_ROOT, &#39;apps/vivim-host/control/rdcb-gen.mjs&#39;); |
| OUT_DIR | const | 24 | no | const OUT_DIR = resolve(REPO_ROOT, &#39;apps/vivim-host/data/demo-baseline/rdcb&#39;); |
| SURFACE | const | 25 | no | const SURFACE = resolve(REPO_ROOT, &#39;apps/vivim-host/data/demo-baseline/file-surface.v1.json&#39;); |
| CATALOG | const | 26 | no | const CATALOG = resolve(REPO_ROOT, &#39;apps/vivim-host/control/action-catalog.v1.json&#39;); |
| checks | const | 28 | no | const checks = []; |
| live | variable | 29 | no | let live = false; |
| fail | function | 42 | no | function fail(msg) { |
| check | function | 46 | no | function check(name, pass, detail) { |
| digestOf | function | 49 | no | function digestOf(v) { |
| catalog | const | 56 | no | const catalog = JSON.parse(readFileSync(CATALOG, &#39;utf8&#39;)); |
| actionIds | const | 57 | no | const actionIds = (catalog.actions \|\| catalog).map(a =&gt; a.id \|\| a.actionId).filter(Boolean); |
| seeded | const | 59 | no | const seeded = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).filter(f =&gt; f.endsWith(&#39;.json&#39;)) : []; |
| runs | const | 64 | no | const runs = []; |
| r | const | 66 | no | const r = Bun.spawnSync([&#39;bun&#39;, GEN], { cwd: REPO_ROOT, stdout: &#39;pipe&#39;, stderr: &#39;pipe&#39; }); |
| after | const | 71 | no | const after = readdirSync(OUT_DIR).filter(f =&gt; f.endsWith(&#39;.json&#39;)); |
| bundles | const | 74 | no | const bundles = after.map(f =&gt; { try { return { f, d: JSON.parse(readFileSync(resolve(OUT_DIR, f), &#39;utf8&#39;)) }; } catch { return { f, d: null }; } }).filter(b =&gt; b.d); |
| digests | const | 79 | no | const digests = bundles.map(b =&gt; b.d.digest); |
| stable | const | 80 | no | const stable = bundles.length &gt; 0 &amp;&amp; bundles.every(b =&gt; /^[0-9a-f]{64}$/.test(b.d.digest)); |
| refsOk | const | 85 | no | const refsOk = bundles.every(b =&gt; { const reg = b.d.reprogramming?.fileSurfaceRegistry?.ref; const cat = b.d.reprogramming?.nlclCatalog?.ref; const srcs = Array.isArray(b.d.sources) ? b.d.sources : [… |
| reg | const | 86 | no | const reg = b.d.reprogramming?.fileSurfaceRegistry?.ref; |
| cat | const | 87 | no | const cat = b.d.reprogramming?.nlclCatalog?.ref; |
| srcs | const | 88 | no | const srcs = Array.isArray(b.d.sources) ? b.d.sources : []; |
| nlclOk | const | 93 | no | const nlclOk = bundles.every(b =&gt; { const ids = b.d.reprogramming?.nlclCatalog?.actionIds; return !Array.isArray(ids) \|\| ids.every(id =&gt; actionIds.includes(id)); }); |
| ids | const | 94 | no | const ids = b.d.reprogramming?.nlclCatalog?.actionIds; |
| ok | const | 103 | no | const ok = checks.every(c =&gt; c.pass); |
| verdict | const | 104 | no | const verdict = { ok, item: ITEM, checks, digest: digestOf({ item: ITEM, checks }) }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 15 | external |
| node:fs | import | 16 | external |
| node:path | import | 17 | external |
| node:url | import | 18 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 107 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
