# File: hq/aii/fixtures/HQ-100-autonomous-investigation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-100-autonomous-investigation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10033 B |
| Lines | 137 |
| Hash | a0cd3e4b4ec6 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 32 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| OBJECTIVE | const | 34 | no | const OBJECTIVE = &#39;Given this complex objective, independently determine what to investigate, verify your findings, and deliver the most defensible answer without requiring me to supervise each step.… |
| PROVENANCE | const | 36 | no | const PROVENANCE = `Locked at authoring time 2026-11-11 from live module output against the real index (.hq/index.db): |
| findings | const | 67 | no | const findings = []; |
| db | const | 68 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| inv | const | 71 | no | const inv = investigateObjective({ task: OBJECTIVE, db, budgetTokens: 6000, maxFiles: 24, |
| stepOf | function | 84 | no | const stepOf = (name) =&gt; inv.trail.find((s) =&gt; s.step === name); |
| v | const | 94 | no | const v = inv.verification ?? verifyContext(inv.bundle ?? {}); |
| bundle | const | 108 | no | const bundle = composeContext(db, { task: OBJECTIVE, budgetTokens: 6000, maxFiles: 24 }); |
| tampered | const | 112 | no | const tampered = JSON.parse(JSON.stringify(bundle)); |
| victim | const | 113 | no | const victim = tampered.sources[0]; |
| tamperedVerdict | const | 115 | no | const tamperedVerdict = verifyContext(tampered); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 27 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 28 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| node:path | import | 29 | external |
| node:url | import | 30 | external |
| ../../lib/autonomy.mjs | dynamic | 70 | [hq/lib/autonomy.mjs](../../lib/autonomy.mjs.md) |
| ../../lib/context.mjs | dynamic | 93 | [hq/lib/context.mjs](../../lib/context.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-100-autonomous-investigation.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-100 (group L, P1): "Given this complex objective, independently determine what to
// investigate, verify your findings, and deliver the most defensible answer without requiring me to
// supervise each step."
//
// Ground truth locked at authoring time 2026-11-11 from live module output against the real index
// (.hq/index.db, last indexed 2026-11-11T02:06):
//   - hq/lib/autonomy.mjs investigateObjective() composed a context bundle via composeContext
//     (hq/lib/context.mjs:706): 24 sources, 4696/5120 tokens, digest 9d5e112fb7815c44.
//   - verifyContext (hq/lib/context.mjs:847) recomputed every source digest against current disk:
//     valid=true, changed=[].
//   - routeAsk (hq/lib/ask.mjs:95): intent=search, command=search, confidence=0.4.
//   - Verdict: defensible — composed and verified against current disk; every claim anchored to
//     file:line; 24 findings each carrying a where ref.
//   - cmdContext (hq/bin/hq.mjs:702) produces the same bundle shape (24 sources, digest prefix
//     5f369e67ddd2d6ba from the live CLI run).
//
//   Stability note: the source COUNT (24), valid=true, changed=[] and route intent/command held
//   across every run observed at authoring time; the token count and bundle digest move with the
//   index as other lanes land edits (4692/4696/4680 tokens and three distinct digests were seen),
//   so the locked expectations assert the stable structural facts and leave the digest free.
//   cmdContext's own CLI run (`hq verify`) additionally reported changed sources, because that
//   bundle was written to a temp file and re-verified later, after the index moved underneath it.
//
// run() re-derives every finding live via investigateObjective() against .hq/index.db; nothing is
// synthetic or seeded, no credentials and no private session content. Read-only probe.
import { defineFixture, finding } from './harness.mjs';
import { openDb } from '../../lib/schema.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const OBJECTIVE = 'Given this complex objective, independently determine what to investigate, verify your findings, and deliver the most defensible answer without requiring me to supervise each step.';

const PROVENANCE = `Locked at authoring time 2026-11-11 from live module output against the real index (.hq/index.db):
- hq/lib/autonomy.mjs investigateObjective({task, db, budgetTokens: 6000, maxFiles: 24}) -> composed=true, 24 sources, 4696/5120 tokens, digest 9d5e112fb7815c44 (uses composeContext hq/lib/context.mjs:706).
- hq/lib/context.mjs verifyContext (line 847) -> valid=true, changed=[] (every source digest recomputed against current disk).
- hq/lib/ask.mjs routeAsk (line 95) -> intent=search, command=search, confidence=0.4.
- verdict: defensible; 24 findings each anchored to file:line (where ref).
Re-run() re-derives findings live via investigateObjective() + verifyContext() + routeAsk().

REFRESH 2026-11-11T22:1xZ: the index-vs-disk invariant the valid=true claim depends on went stale — the index's
stored content hash for vivim-web-harness:studio/scripts/loadlab.mjs (lines 385-471) no longer matches the file on
disk (verified this session: bundle source sha256 7b058acb3d79..., disk recompute 4a4cd2131197...; disk mtime
2026-10-30, index last full pass 2026-11-11T01:49 — a concurrent lane's writes to vivim-web-harness left the index
row behind). verifyContext (hq/lib/context.mjs:847-894) is working CORRECTLY: it recomputes every source digest from
disk without trusting retained text and reports the drift instead of passing it. A fixture cannot pin valid=true
while the index is stale, and re-indexing is a mutating command fixtures never run, so the verification expectation
is refreshed to the machinery the scenario actually demands ("verify your findings"): the verify step must run and
report a verdict that is SELF-CONSISTENT — valid === (changed.length === 0) — and when it reports drift, every
changed entry names a real source ref. Compose-ok, route-ok, anchored findings and the propose-only trail remain
pinned exactly. When the index is fresh again this fixture still proves the same machinery with valid=true.`;

export default defineFixture({
  id: 'HQ-100',
  provenance: PROVENANCE,
  expected: [
    { what: 'investigation trail present: compose ok, verify REPORTS its verdict, route ok', where: 'hq/lib/autonomy.mjs investigateObjective trail' },
    { what: 'verification verdict is self-consistent: valid is true exactly when no source changed against current disk', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'a tampered source digest is detected: verifyContext reports valid=false naming the tampered ref', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'verification recomputes every source digest from disk without trusting retained text (context.mjs:847-894)', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'findings anchored to file:line', where: /^hq\/lib\/autonomy\.mjs investigateObjective findings: \d+ findings each anchored to file:line$/ },
    { what: 'route resolved to an HQ command', where: /^hq\/lib\/ask\.mjs routeAsk: intent=\S+ command=\S+ confidence=[\d.]+$/ },
  ],
  run: async () => {
    const findings = [];
    const db = openDb(join(ROOT, '.hq', 'index.db'));
    try {
      const { investigateObjective } = await import('../../lib/autonomy.mjs');
      const inv = investigateObjective({
        task: OBJECTIVE,
        db,
        budgetTokens: 6000,
        maxFiles: 24,
      });

      // Investigation trail present: all three steps ran and reported. The verify step's
      // verdict may legitimately be ok:false when the index is behind disk — what the
      // scenario demands is that verification RAN and its verdict is trustworthy.
```

_First 80 of 138 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
