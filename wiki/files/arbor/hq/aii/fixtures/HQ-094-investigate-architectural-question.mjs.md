# File: hq/aii/fixtures/HQ-094-investigate-architectural-question.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-094-investigate-architectural-question.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6848 B |
| Lines | 94 |
| Hash | 79f94feb592f |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TASK | const | 23 | no | const TASK = &#39;Investigate this architectural question completely and tell me what is true.&#39;; |
| openReadOnly | function | 25 | no | function openReadOnly() { |
| lastErr | variable | 27 | no | let lastErr = null; |
| findings | const | 52 | no | const findings = []; |
| db | const | 55 | no | const db = openReadOnly(); |
| bundle | variable | 56 | no | let bundle; |
| anchored | const | 71 | no | const anchored = bundle.sources.every((s) =&gt; typeof s.ref === &#39;string&#39; &amp;&amp; typeof s.sha256 === &#39;string&#39; &amp;&amp; Array.isArray(s.lines) &amp;&amp; s.lines.length === 2 &amp;&amp; Number.isFinite(s.lines[0]) &amp;&amp; Number.isFin… |
| used | const | 76 | no | const used = bundle.budget?.used; |
| capacity | const | 77 | no | const capacity = bundle.budget?.capacity; |
| verification | const | 86 | no | const verification = verifyContext(bundle); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 19 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| node:sqlite | import | 20 | external |
| ../../lib/context.mjs | import | 21 | [hq/lib/context.mjs](../../lib/context.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-094-investigate-architectural-question.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-094 (group L): "Investigate this architectural question completely and tell me what is true."
// Ground truth locked from live outputs 2026-11-11:
//   bun hq/bin/hq.mjs context "Investigate this architectural question completely and tell me what is true." --json
//     -> {"schema":"hq.context-bundle/1","authority":"read_only_projection","task",...,"sources":[...],
//          "budget":{"capacity":5120,"reserved":800,"maxTokens":6000,"used":4578,"estimator":"utf8-bytes/3"},
//          "digest":"<sha256>","omissions":[...],"labels":[...],"vivim":{...},"symbols":[...],
//          "fragment":"<text>","generatedAt":"..."}
//        (cmdContext hq/bin/hq.mjs:702-760; composeContext hq/lib/context.mjs:706 builds the
//        budgeted, line-anchored, sha256-sourced bundle).
//        At lock time 24 sources, 4578/5120 tokens used, 113 omissions.
//        Each source carries {ref,project,path,kind,lang,lines:[a,b],sha256,digest,estimatedTokens,
//        reason,score,absPath} — the evidence anchor.
//   hq/lib/context.mjs:847 verifyContext re-reads each source from disk and recomputes its sha256
//        to confirm the bundle still matches: {"valid":true,"changed":[],"expected":...,"current":...}
//        (an explicit verified-true, which is the "tell me what is true" half of the scenario).
// The probe calls the modules directly against a READ-ONLY SQLite handle (no receipt is written,
// no Host-world state is touched) so the whole fixture stays read-only.
import { defineFixture, finding } from './harness.mjs';
import { DatabaseSync } from 'node:sqlite';
import { composeContext, verifyContext } from '../../lib/context.mjs';

const TASK = 'Investigate this architectural question completely and tell me what is true.';

function openReadOnly() {
  // Concurrent lanes reindex the shared index, so the WAL handle can be transiently busy.
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return new DatabaseSync('.hq/index.db', { readOnly: true });
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('could not open .hq/index.db read-only');
}

export default defineFixture({
  id: 'HQ-094',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs context "Investigate this architectural question completely and tell me what is true." --json (schema hq.context-bundle/1, authority read_only_projection, 24 sources, budget 4578/5120 tokens with capacity 5120 and 800 reserved, 113 omissions, every source carrying ref/lines/sha256/digest/reason) and hq/lib/context.mjs:847 verifyContext re-reading those sources from disk and reporting valid=true with changed=[] (verified 2026-11-11). Re-derived at run time by re-running hq context --json and re-running verifyContext over the freshly composed bundle.',
  expected: [
    { what: 'schema hq.context-bundle/1', where: 'hq/lib/context.mjs composeContext' },
    { what: 'authority read_only_projection', where: 'hq/lib/context.mjs composeContext' },
    { what: /^\d+ sources gathered for the architectural question$/, where: 'hq/lib/context.mjs composeContext' },
    { what: 'every source is anchored to a file, a line range and a sha256 digest', where: 'hq/lib/context.mjs composeContext' },
    { what: /^bundle used \d+ of \d+ tokens within its budget$/, where: 'hq/lib/context.mjs composeContext' },
    { what: /^\d+ candidates were omitted from the bundle with a reason$/, where: 'hq/lib/context.mjs composeContext' },
    { what: 'verifyContext re-reads the sources from disk and reports the bundle valid', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'verifyContext reports 0 changed sources against current disk', where: 'hq/lib/context.mjs verifyContext' },
  ],
  run: async () => {
    const findings = [];

    // Compose the investigation bundle. composeContext only READS the index and the sources.
    const db = openReadOnly();
    let bundle;
    try {
      bundle = await composeContext(db, { task: TASK, budgetTokens: 6000, reservedForOutput: 800, maxFiles: 24 });
    } finally {
      db.close();
    }

    if (bundle.schema !== 'hq.context-bundle/1') throw new Error(`unexpected bundle schema: ${bundle.schema}`);
    findings.push(finding('schema hq.context-bundle/1', 'hq/lib/context.mjs composeContext'));
    if (bundle.authority !== 'read_only_projection') throw new Error(`unexpected bundle authority: ${bundle.authority}`);
    findings.push(finding('authority read_only_projection', 'hq/lib/context.mjs composeContext'));

    if (!Array.isArray(bundle.sources) || !bundle.sources.length) throw new Error('bundle has no sources');
    findings.push(finding(`${bundle.sources.length} sources gathered for the architectural question`, 'hq/lib/context.mjs composeContext'));

    const anchored = bundle.sources.every((s) => typeof s.ref === 'string' && typeof s.sha256 === 'string'
      && Array.isArray(s.lines) && s.lines.length === 2 && Number.isFinite(s.lines[0]) && Number.isFinite(s.lines[1]));
    if (!anchored) throw new Error('a bundle source lacks ref/lines/sha256 anchoring');
    findings.push(finding('every source is anchored to a file, a line range and a sha256 digest', 'hq/lib/context.mjs composeContext'));

    const used = bundle.budget?.used;
    const capacity = bundle.budget?.capacity;
    if (!Number.isFinite(used) || !Number.isFinite(capacity)) throw new Error('bundle has no usable budget accounting');
    if (used > capacity) throw new Error(`bundle overran its budget: ${used} > ${capacity}`);
    findings.push(finding(`bundle used ${used} of ${capacity} tokens within its budget`, 'hq/lib/context.mjs composeContext'));
```

_First 80 of 95 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
