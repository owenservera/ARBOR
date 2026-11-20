# File: hq/aii/fixtures/HQ-044-conflicting-specs.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-044-conflicting-specs.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7313 B |
| Lines | 91 |
| Hash | 13ffee5f8f53 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 35 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| PAIRS | const | 37 | no | const PAIRS = [ |
| findings | const | 57 | no | const findings = []; |
| db | const | 59 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| health | const | 61 | no | const health = documentHealth(db, { root: ROOT }); |
| conflicts | const | 62 | no | const conflicts = (health.conflicts ?? []).filter((c) =&gt; c.kind === &#39;duplicate_term&#39;); |
| byTerm | const | 64 | no | const byTerm = new Map(conflicts.map((c) =&gt; [c.a, c.b])); |
| actual | const | 66 | no | const actual = byTerm.get(term); |
| contractCount | const | 74 | no | const contractCount = Number(db.prepare(&#39;SELECT COUNT(*) AS c FROM capability_contract&#39;).get().c); |
| ddl | const | 83 | no | const ddl = (await import(&#39;node:fs&#39;)).readFileSync(join(ROOT, &#39;hq&#39;, &#39;lib&#39;, &#39;capability-schema.mjs&#39;), &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 29 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 30 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/canon.mjs | import | 31 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| node:path | import | 32 | external |
| node:url | import | 33 | external |
| node:fs | dynamic | 83 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-044-conflicting-specs.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-044 (group E):
// "Which capabilities have multiple conflicting specifications?"
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs conflicts
//     -> 4 conflicts, ALL of kind duplicate_term — a CANON rule defined in 2
//        sources is two specifications of the same capability that were never
//        merged:
//          "every case asserts the transport was NOT called where the policy
//           refuses"  -> hq/test/channel-broker.test.mjs,
//                           hq/test/channel-seat.test.mjs
//          "pure: no fs, no childprocess, no clock read. now is an argument
//           and is required" -> hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs
//          "read-only; never writes providerconfig.json, the depot catalog, or
//           any agent file" -> hq/test/nvidia-provider-fix.test.mjs,
//           hq/test/nvidia-provider-fix.test.mjs.bak-wo031
//          "tests always override HQSUPERVISORSTATE to a temp dir; the real
//           .hq/supervisor" -> hq/test/supervisor-backpressure.test.mjs,
//           hq/test/supervisor.test.mjs
//   documentHealth(db) (hq/lib/canon.mjs:192) returns the same 4 conflicts.
//   capability_contract DDL (hq/lib/capability-schema.mjs:160-177): PRIMARY
//   KEY (id, version) — multiple spec VERSIONS per capability id are
//   representable. Live count of capability_contract rows: 0 (an explicit
//   zero — no contracts registered yet).
//
// The four conflicting pairs are the concrete answer and are pinned exactly;
// the count is re-derived live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { documentHealth } from '../../lib/canon.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const PAIRS = [
  ['every case asserts the transport was NOT called where the policy refuses', 'hq/test/channel-broker.test.mjs, hq/test/channel-seat.test.mjs'],
  ['pure: no fs, no childprocess, no clock read. now is an argument and is required', 'hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs'],
  ['read-only; never writes providerconfig.json, the depot catalog, or any agent file', 'hq/test/nvidia-provider-fix.test.mjs, hq/test/nvidia-provider-fix.test.mjs.bak-wo031'],
  ['tests always override HQSUPERVISORSTATE to a temp dir; the real .hq/supervisor', 'hq/test/supervisor-backpressure.test.mjs, hq/test/supervisor.test.mjs'],
];

export default defineFixture({
  id: 'HQ-044',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs conflicts printed 4 conflicts, all of kind duplicate_term — each "CANON term <term> is defined in 2 sources and was not merged": "every case asserts the transport was NOT called where the policy refuses" in hq/test/channel-broker.test.mjs and hq/test/channel-seat.test.mjs; "pure: no fs, no childprocess, no clock read. now is an argument and is required" in hq/lib/revive-daemon.mjs and hq/lib/revive-lane.mjs; "read-only; never writes providerconfig.json, the depot catalog, or any agent file" in hq/test/nvidia-provider-fix.test.mjs and hq/test/nvidia-provider-fix.test.mjs.bak-wo031; "tests always override HQSUPERVISORSTATE to a temp dir; the real .hq/supervisor" in hq/test/supervisor-backpressure.test.mjs and hq/test/supervisor.test.mjs. documentHealth(db) (hq/lib/canon.mjs:192) returned the same 4 conflicts. capability_contract DDL (hq/lib/capability-schema.mjs:160-177, PRIMARY KEY (id, version) at line 176) makes multiple spec versions per capability id representable; the live capability_contract table holds 0 rows (an explicit zero — no contracts registered yet). The four conflicting pairs are pinned exactly; the conflict count is re-derived live.',
  expected: [
    { what: 'capability specified twice: "every case asserts the transport was NOT called where the policy refuses" is defined in hq/test/channel-broker.test.mjs, hq/test/channel-seat.test.mjs', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'capability specified twice: "pure: no fs, no childprocess, no clock read. now is an argument and is required" is defined in hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'capability specified twice: "read-only; never writes providerconfig.json, the depot catalog, or any agent file" is defined in hq/test/nvidia-provider-fix.test.mjs, hq/test/nvidia-provider-fix.test.mjs.bak-wo031', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'capability specified twice: "tests always override HQSUPERVISORSTATE to a temp dir; the real .hq/supervisor" is defined in hq/test/supervisor-backpressure.test.mjs, hq/test/supervisor.test.mjs', where: 'hq/lib/canon.mjs documentHealth' },
    { what: /^\d+ conflicting specifications detected, all of kind duplicate_term$/, where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'the capability_contract schema represents multiple specifications as PRIMARY KEY (id, version)', where: 'hq/lib/capability-schema.mjs:176' },
    { what: 'capability_contract rows registered: 0', where: 'hq/lib/schema.mjs capability_contract' },
  ],
  run: async () => {
    const findings = [];

    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const health = documentHealth(db, { root: ROOT });
      const conflicts = (health.conflicts ?? []).filter((c) => c.kind === 'duplicate_term');
      if (!conflicts.length) throw new Error('documentHealth found no duplicate_term conflicts');
      const byTerm = new Map(conflicts.map((c) => [c.a, c.b]));
      for (const [term, sources] of PAIRS) {
        const actual = byTerm.get(term);
        if (actual !== sources) {
          throw new Error(`unexpected sources for ${JSON.stringify(term)}: ${JSON.stringify(actual)}`);
        }
        findings.push(finding(`capability specified twice: "${term}" is defined in ${actual}`, 'hq/lib/canon.mjs documentHealth'));
      }
      findings.push(finding(`${conflicts.length} conflicting specifications detected, all of kind duplicate_term`, 'hq/lib/canon.mjs documentHealth'));

      const contractCount = Number(db.prepare('SELECT COUNT(*) AS c FROM capability_contract').get().c);
      if (contractCount !== 0) {
        throw new Error(`expected 0 capability_contract rows, got ${contractCount}`);
      }
      findings.push(finding(`capability_contract rows registered: ${contractCount}`, 'hq/lib/schema.mjs capability_contract'));
    } finally {
      db.close();
```

_First 80 of 92 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
