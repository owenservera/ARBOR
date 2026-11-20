# File: hq/aii/fixtures/HQ-039-outdated-docs.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-039-outdated-docs.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5092 B |
| Lines | 60 |
| Hash | 0e8de614d2e3 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| findings | const | 29 | no | const findings = []; |
| health | const | 31 | no | const health = runHq([&#39;docs&#39;, &#39;health&#39;, &#39;--json&#39;]); |
| j | const | 33 | no | const j = JSON.parse(health.stdout); |
| reasons | const | 43 | no | const reasons = new Set(j.staleDocs.map((d) =&gt; d.reason)); |
| allHaveHashTriple | const | 49 | no | const allHaveHashTriple = j.staleDocs.every((d) =&gt; Array.isArray(d.changed) &amp;&amp; d.changed.length &gt; 0 &amp;&amp; d.changed.every((c) =&gt; typeof c.ref === &#39;string&#39; &amp;&amp; typeof c.expected === &#39;string&#39; &amp;&amp; typeof c.a… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 14 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-039-outdated-docs.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-039 (group E): "Which documentation is outdated relative to current source code?"
// Ground truth locked from live outputs 2026-11-11:
//   bun hq/bin/hq.mjs docs health --json
//     -> {"schema":"hq.docs-health/1","authority":"read_only_projection",
//          "staleDocs":[{path,project,reason,changed:[{ref,expected,actual}]}], ...}
//        (cmdDocs hq/bin/hq.mjs:3893; canon.mjs:1922 documentHealth builds staleDocs at
//        canon.mjs:1955 by comparing the stored doc hash against the current fileHash).
//        At lock time: 48 staleDocs (46 reason reference_changed, 2 reason source_changed),
//        885 orphanDocs, 3 missingFamilies, 4 conflicts, 1 duplicateDocs.
//   The counts drift as concurrent lanes reindex the workspace, so they are re-derived live and
//   pinned by shape; the stale-doc REASON vocabulary (source_changed / reference_changed) and the
//   changed[{ref,expected,actual}] sha256 triple are the stable ground truth.
import { defineFixture, finding, runHq } from './harness.mjs';

export default defineFixture({
  id: 'HQ-039',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs docs health --json (schema hq.docs-health/1, authority read_only_projection, 48 staleDocs at lock time with reasons reference_changed x46 and source_changed x2, 885 orphanDocs, 3 missingFamilies, 4 conflicts, 1 duplicateDocs; each stale doc carries a changed[{ref,expected,actual}] sha256 triple). Re-derived at run time by re-running the command; counts are re-derived live because concurrent lanes reindex the shared workspace.',
  expected: [
    { what: 'schema hq.docs-health/1', where: 'hq/bin/hq.mjs cmdDocs health' },
    { what: 'authority read_only_projection', where: 'hq/bin/hq.mjs cmdDocs health' },
    { what: /^\d+ documents are stale relative to current source code$/, where: 'hq/lib/canon.mjs documentHealth staleDocs' },
    { what: 'stale docs are classified reason source_changed when the source file hash changed', where: 'hq/lib/canon.mjs documentHealth staleDocs' },
    { what: 'stale docs are classified reason reference_changed when a bound reference hash changed', where: 'hq/lib/canon.mjs documentHealth staleDocs' },
    { what: /^every stale doc names the changed ref with its expected and actual sha256$/, where: 'hq/lib/canon.mjs documentHealth staleDocs' },
    { what: /^\d+ documents are orphaned with no binds_to edge and not a root doc$/, where: 'hq/lib/canon.mjs documentHealth orphanDocs' },
  ],
  run: async () => {
    const findings = [];

    const health = runHq(['docs', 'health', '--json']);
    if (health.exit !== 0) throw new Error(`hq docs health failed: exit=${health.exit} stderr=${health.stderr}`);
    const j = JSON.parse(health.stdout);
    if (j.schema !== 'hq.docs-health/1') throw new Error(`unexpected docs health schema: ${j.schema}`);
    findings.push(finding('schema hq.docs-health/1', 'hq/bin/hq.mjs cmdDocs health'));
    if (j.authority !== 'read_only_projection') throw new Error(`unexpected docs health authority: ${j.authority}`);
    findings.push(finding('authority read_only_projection', 'hq/bin/hq.mjs cmdDocs health'));

    // staleDocs: documentation outdated relative to current source code.
    if (!Array.isArray(j.staleDocs)) throw new Error('docs health has no staleDocs array');
    findings.push(finding(`${j.staleDocs.length} documents are stale relative to current source code`, 'hq/lib/canon.mjs documentHealth staleDocs'));

    const reasons = new Set(j.staleDocs.map((d) => d.reason));
    if (!reasons.has('source_changed')) throw new Error('no stale doc with reason source_changed');
    findings.push(finding('stale docs are classified reason source_changed when the source file hash changed', 'hq/lib/canon.mjs documentHealth staleDocs'));
    if (!reasons.has('reference_changed')) throw new Error('no stale doc with reason reference_changed');
    findings.push(finding('stale docs are classified reason reference_changed when a bound reference hash changed', 'hq/lib/canon.mjs documentHealth staleDocs'));

    const allHaveHashTriple = j.staleDocs.every((d) => Array.isArray(d.changed) && d.changed.length > 0
      && d.changed.every((c) => typeof c.ref === 'string' && typeof c.expected === 'string' && typeof c.actual === 'string'));
    if (!allHaveHashTriple) throw new Error('a stale doc lacks the changed[{ref,expected,actual}] sha256 triple');
    findings.push(finding('every stale doc names the changed ref with its expected and actual sha256', 'hq/lib/canon.mjs documentHealth staleDocs'));

    // orphanDocs: the complementary documentation-coverage signal.
    if (!Array.isArray(j.orphanDocs)) throw new Error('docs health has no orphanDocs array');
    findings.push(finding(`${j.orphanDocs.length} documents are orphaned with no binds_to edge and not a root doc`, 'hq/lib/canon.mjs documentHealth orphanDocs'));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
