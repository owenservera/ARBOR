# File: hq/aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6858 B |
| Lines | 97 |
| Hash | 93b571fec523 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 23 | no | const ROOT = join(import.meta.dirname ?? &#39;.&#39;, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| FACTORS | const | 26 | no | const FACTORS = [ |
| differingFactor | function | 31 | no | function differingFactor(basis) { |
| findings | const | 59 | no | const findings = []; |
| db | const | 61 | no | const db = openMemoryDb(); |
| receipt | const | 64 | no | const receipt = recordReceipt(db, { kind: &#39;seed-test-result&#39;, task: &#39;HQ-060&#39;, project: &#39;repos-hq&#39;, sources: [{ ref: &#39;hq/test/channel-wake.test.mjs&#39;, sha256: &#39;a&#39;.repeat(64) }], |
| back | const | 72 | no | const back = getReceipt(db, { id: receipt.id }); |
| reconRow | const | 79 | no | const reconRow = JSON.parse(readFileSync(join(ROOT, &#39;dogfood&#39;, &#39;recon&#39;, &#39;AGENTS-003.json&#39;), &#39;utf8&#39;)); |
| factor | const | 81 | no | const factor = differingFactor(reconRow.basis); |
| tables | const | 89 | no | const tables = db.prepare(&quot;SELECT name FROM sqlite_master WHERE type=&#39;table&#39;&quot;).all().map((t) =&gt; t.name); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 17 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/receipts.mjs | import | 18 | [hq/lib/receipts.mjs](../../lib/receipts.mjs.md) |
| ../../lib/schema.mjs | import | 19 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:fs | import | 20 | external |
| node:path | import | 21 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs
// AII scenario HQ-060 (group G): "Why does this module pass tests but fail in the actual application?"
// Engine: hq/lib/dogfood.mjs recon register + hq/lib/receipts.mjs (per-module evidence join
// the gap slice names: test evidence vs runtime failure evidence with the differing factor).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - The real recon register holds blocked runtime rows whose basis names the environment
//     factor (dogfood/recon/AGENTS-003.json: blocked, gates all fail, basis names the missing
//     agent-scope registry) while the corresponding module's unit tests pass (hq/test/* run
//     green in bun test) — the tests-pass/runtime-fails divergence is real in this repo.
//   - The join is exercised on seeded rows: a module with a PASSING test receipt stored in
//     the real receipts ledger (in-memory db) and a runtime recon outcome blocked with a
//     named environment factor; findings = the diverging evidence pair + the differing factor.
//   - Explicit zero re-verified: no test_result/coverage table exists (schema.mjs:11-443) —
//     test evidence lives in receipts, runtime evidence lives in the recon register.

import { defineFixture, finding } from './harness.mjs';
import { recordReceipt, getReceipt } from '../../lib/receipts.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '..', '..', '..');

// The differing-factor classifier: why tests pass while the application fails.
const FACTORS = [
  { id: 'environment-missing', re: /no agent-scope registry|not running|unavailable|no such (?:file|command)|ENOENT/i },
  { id: 'config-missing', re: /missing config|no configuration|unset env/i },
  { id: 'data-shape', re: /unexpected shape|schema mismatch/i },
];
function differingFactor(basis) {
  for (const f of FACTORS) if (f.re.test(String(basis))) return f.id;
  return 'unclassified';
}

export default defineFixture({
  id: 'HQ-060',
  provenance:
    '2026-11-11 (this session): locked from the engines named by hq/aii/assessments/lane-6.json HQ-060 gap.engine ' +
    '(hq/lib/dogfood.mjs) and gap sketch. Real divergence verified this session: dogfood/recon/AGENTS-003.json is ' +
    "status 'blocked' with gates {FOUNDATION: fail, ATOMIC_PROOF: fail, BOUNDARY: fail} and a basis naming the missing " +
    'agent-scope registry — the runtime environment factor — while its module unit tests pass under bun test. The ' +
    'evidence join is exercised on seeded rows: a passing test receipt stored via recordReceipt (receipts.mjs:62) in ' +
    'an in-memory db and read back via getReceipt (receipts.mjs:119), joined against the blocked runtime row with the ' +
    'differing factor classified from the basis (environment-missing). Explicit zero re-verified: no test_result table ' +
    '(schema.mjs:11-443). No workspace writes. REFRESH 2026-11-12T00:0xZ: the explicit zero went stale — commit c0af0e4 ' +
    '(fix(aii): audit P2 repairs) moved TEST_RESULTS_DDL into schema.mjs:16-33, so the test_results ledger now exists; ' +
    'the no-table expectation is refreshed to the new fact and the divergence assertions (passing receipt vs blocked ' +
    'runtime recon, environment-missing factor) are unchanged.',
  expected: [
    { what: 'the module holds a passing test receipt (effect OK) in the evidence ledger', where: 'hq/lib/receipts.mjs recordReceipt' },
    { what: 'the same capability is blocked at runtime with a named environment factor', where: 'hq/lib/dogfood.mjs' },
    { what: 'the diverging evidence pair is (passing test receipt, blocked runtime recon row) for the same module', where: 'hq/lib/dogfood.mjs' },
    { what: 'the differing factor is environment-missing — the runtime row names the missing registry, not a code defect', where: 'hq/lib/dogfood.mjs' },
    { what: 'the real recon register exhibits the divergence: AGENTS-003 is blocked at runtime while its tests pass', where: 'dogfood/recon/AGENTS-003.json' },
    { what: 'the test_results ledger now exists (schema.mjs:17-29, landed by commit c0af0e4) — the test/runtime join can key against it', where: 'hq/lib/schema.mjs' },
  ],
  run: async () => {
    const findings = [];

    const db = openMemoryDb();
    try {
      // Seeded passing test receipt for the module under divergence.
      const receipt = recordReceipt(db, {
        kind: 'seed-test-result',
        task: 'HQ-060',
        project: 'repos-hq',
        sources: [{ ref: 'hq/test/channel-wake.test.mjs', sha256: 'a'.repeat(64) }],
        digest: 'digest-passing-suite',
        bytes: 1,
      });
      const back = getReceipt(db, { id: receipt.id });
      if (!back || back.sources?.[0]?.ref !== 'hq/test/channel-wake.test.mjs') {
        throw new Error(`test receipt did not round-trip: ${JSON.stringify(back)}`);
      }
      findings.push(finding('the module holds a passing test receipt (effect OK) in the evidence ledger', 'hq/lib/receipts.mjs recordReceipt'));

      // The runtime recon row (real register row, read-only) + the diverging pair.
      const reconRow = JSON.parse(readFileSync(join(ROOT, 'dogfood', 'recon', 'AGENTS-003.json'), 'utf8'));
      if (reconRow.status !== 'blocked') throw new Error(`expected blocked runtime row: ${reconRow.status}`);
```

_First 80 of 98 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
