# File: hq/aii/fixtures/HQ-054-uninspectable-environments.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-054-uninspectable-environments.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4960 B |
| Lines | 71 |
| Hash | 6136561534ca |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 18 | no | const ROOT = join(import.meta.dirname ?? &#39;.&#39;, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 40 | no | const findings = []; |
| dogfood | const | 42 | no | const dogfood = await import(&#39;../../lib/dogfood.mjs&#39;); |
| reconDir | const | 48 | no | const reconDir = join(ROOT, &#39;dogfood&#39;, &#39;recon&#39;); |
| rows | const | 49 | no | const rows = readdirSync(reconDir).filter((f) =&gt; f.endsWith(&#39;.json&#39;)) |
| counts | const | 51 | no | const counts = {}; |
| uninspectable | const | 53 | no | const uninspectable = rows.filter((r) =&gt; r.status === &#39;blocked&#39; \|\| r.status === &#39;absent&#39;); |
| basis | const | 58 | no | const basis = String(r.basis ?? &#39;&#39;).trim(); |
| failGates | const | 63 | no | const failGates = Object.entries(r.gates ?? {}).filter(([, v]) =&gt; String(v).toLowerCase() === &#39;fail&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 14 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| node:fs | import | 15 | external |
| node:path | import | 16 | external |
| ../../lib/dogfood.mjs | dynamic | 42 | [hq/lib/dogfood.mjs](../../lib/dogfood.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-054-uninspectable-environments.mjs
// AII scenario HQ-054 (group F): "Which claims depend on environments we cannot currently inspect?"
// Engine: the dogfood recon register (hq.dogfood-recon/1) + hq/lib/dogfood.mjs BLOCKED
// classification (dogfood.mjs:288-289) + hq doctor environment states.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - Live read of dogfood/recon/*.json: 18 rows, statuses {blocked:3, partial:12,
//     absent:2, proven:1}. Blocked rows name the uninspectable dependency with gates
//     (e.g. AGENTS-003.json: status 'blocked', gates FOUNDATION/ATOMIC_PROOF/BOUNDARY).
//   - RECON_STATES (dogfood.mjs:45) = ['proven','partial','blocked','absent']; a BLOCKED
//     row must name a dependency (dogfood.mjs:288-289).
//   - Blocked + absent rows ARE the claims that depend on uninspectable environments.

import { defineFixture, finding } from './harness.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '..', '..', '..');

// The BLOCKED cause pattern lives module-private at dogfood.mjs:289 (it classifies task
// text, not recon rows); the recon register files carry status directly.

export default defineFixture({
  id: 'HQ-054',
  provenance:
    '2026-11-11 (this session): locked by reading the live dogfood recon register dogfood/recon/*.json — ' +
    '18 rows with statuses {blocked:3, partial:12, absent:2, proven:1} (counts read from the files this session, ' +
    'matching hq/aii/assessments/lane-6.json HQ-054 evidence). RECON_STATES (hq/lib/dogfood.mjs:45) and the BLOCKED ' +
    'cause regex (dogfood.mjs:288-289) re-derive at run time which rows depend on uninspectable environments. ' +
    'The exact per-row count drifts as lanes file recon updates and is re-derived live; the structure (blocked rows ' +
    'name a dependency and gates; blocked+absent = uninspectable) is pinned.',
  expected: [
    { what: 'blocked and absent recon rows are the claims depending on environments HQ cannot currently inspect', where: 'dogfood/recon' },
    { what: 'every blocked row names its blocking cause in basis (prose naming the missing environment/capability)', where: 'dogfood/recon' },
    { what: 'every blocked row carries gate results with at least one unmet (fail) gate', where: 'dogfood/recon' },
    { what: /^the live recon register re-derived: \d+ rows, blocked=\d+, absent=\d+ \(partial=\d+, proven=\d+\)$/, where: 'dogfood/recon' },
    { what: 'RECON_STATES has no "verified" state — only proven/partial/blocked/absent (dogfood.mjs:45)', where: 'hq/lib/dogfood.mjs' },
  ],
  run: async () => {
    const findings = [];
    // RECON_STATES check (dogfood.mjs:45).
    const dogfood = await import('../../lib/dogfood.mjs');
    if (!Array.isArray(dogfood.RECON_STATES) || dogfood.RECON_STATES.join(',') !== 'proven,partial,blocked,absent') {
      throw new Error(`unexpected RECON_STATES: ${JSON.stringify(dogfood.RECON_STATES)}`);
    }
    findings.push(finding('RECON_STATES has no "verified" state — only proven/partial/blocked/absent (dogfood.mjs:45)', 'hq/lib/dogfood.mjs'));

    const reconDir = join(ROOT, 'dogfood', 'recon');
    const rows = readdirSync(reconDir).filter((f) => f.endsWith('.json'))
      .map((f) => ({ file: f, ...JSON.parse(readFileSync(join(reconDir, f), 'utf8')) }));
    const counts = {};
    for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
    const uninspectable = rows.filter((r) => r.status === 'blocked' || r.status === 'absent');
    if (uninspectable.length < 1) throw new Error(`no uninspectable rows: ${JSON.stringify(counts)}`);
    findings.push(finding('blocked and absent recon rows are the claims depending on environments HQ cannot currently inspect', 'dogfood/recon'));

    for (const r of rows.filter((x) => x.status === 'blocked')) {
      const basis = String(r.basis ?? '').trim();
      if (basis.length < 10) throw new Error(`blocked row ${r.file} has no naming basis: ${basis}`);
    }
    findings.push(finding('every blocked row names its blocking cause in basis (prose naming the missing environment/capability)', 'dogfood/recon'));
    for (const r of rows.filter((x) => x.status === 'blocked')) {
      const failGates = Object.entries(r.gates ?? {}).filter(([, v]) => String(v).toLowerCase() === 'fail');
      if (failGates.length < 1) throw new Error(`blocked row ${r.file} has no failing gate: ${JSON.stringify(r.gates)}`);
    }
    findings.push(finding('every blocked row carries gate results with at least one unmet (fail) gate', 'dogfood/recon'));

    findings.push(finding(`the live recon register re-derived: ${rows.length} rows, blocked=${counts.blocked ?? 0}, absent=${counts.absent ?? 0} (partial=${counts.partial ?? 0}, proven=${counts.proven ?? 0})`, 'dogfood/recon'));
    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
