# File: hq/lib/aii/views.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/aii/views.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8930 B |
| Lines | 211 |
| Hash | 808c9336310f |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AII_COVERAGE_SCHEMA | const | 23 | yes | export const AII_COVERAGE_SCHEMA = &#39;hq.aii-coverage/2&#39;; |
| EVIDENCE_STATES | const | 25 | no | const EVIDENCE_STATES = [&#39;verified&#39;, &#39;stale&#39;, &#39;legacy&#39;, &#39;foreign&#39;, &#39;failed&#39;, &#39;absent&#39;]; |
| failureRow | function | 27 | no | function failureRow(result) { |
| coverageView | function | 42 | yes | export function coverageView({ reg, sum, evidence = null, plan = null, |
| rows | const | 51 | no | const rows = viewAiiCoverage(reg).map((row) =&gt; { const bound = evidence instanceof Map ? evidence.get(row.id) : null; return { ...row, evidenceState: bound?.state ?? &#39;unknown&#39;, |
| bound | const | 52 | no | const bound = evidence instanceof Map ? evidence.get(row.id) : null; |
| failures | const | 63 | no | const failures = (run?.failures ?? []).map(failureRow).sort((a, b) =&gt; a.id.localeCompare(b.id) \|\| a.relPath.localeCompare(b.relPath)); |
| view | const | 64 | no | const view = { |
| viewDigest | function | 117 | yes | export function viewDigest(view) { |
| statusCell | function | 122 | no | function statusCell(row) { |
| evidenceBadge | function | 128 | no | function evidenceBadge(row) { |
| renderCoverageMarkdown | function | 135 | yes | export function renderCoverageMarkdown(view) { |
| sum | const | 136 | no | const sum = view.summary; |
| rows | const | 137 | no | const rows = view.scenarios; |
| lines | const | 138 | no | const lines = []; |
| receipt | const | 160 | no | const receipt = r.status === &#39;covered_verified&#39; |
| oos | const | 166 | no | const oos = rows.filter((r) =&gt; r.status === &#39;out_of_scope&#39;); |
| gaps | const | 172 | no | const gaps = rows.filter((r) =&gt; r.status === &#39;gap&#39;); |
| unproven | const | 179 | no | const unproven = rows.filter((r) =&gt; r.status === &#39;covered_verified&#39; &amp;&amp; r.evidenceState !== &#39;verified&#39;); |
| summaryLines | function | 200 | yes | export function summaryLines(view) { |
| sum | const | 201 | no | const sum = view.summary; |
| byStatus | const | 202 | no | const byStatus = Object.entries(sum.byStatus).filter(([, n]) =&gt; n &gt; 0).map(([k, n]) =&gt; `${k}=${n}`).join(&#39; · &#39;); |
| out | const | 203 | no | const out = [ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../util.mjs | import | 18 | [hq/lib/util.mjs](../util.mjs.md) |
| ./plan.mjs | import | 19 | [hq/lib/aii/plan.mjs](./plan.mjs.md) |
| ./registry.mjs | import | 20 | [hq/lib/aii/registry.mjs](./registry.mjs.md) |
| ./receipts-policy.mjs | import | 21 | [hq/lib/aii/receipts-policy.mjs](./receipts-policy.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/aii/views.mjs — deterministic coverage views for the AII registry.
//
// The old buildViews() embedded `generatedAt` in the JSON and rendered the
// Markdown from the same object, so two runs over identical evidence produced
// different bytes and no one could tell whether coverage had actually moved.
//
// Here the view is a pure function of its inputs:
//
//   coverageView({ reg, sum, evidence, plan, run, mode, generatedAt })
//
// `generatedAt` is the only non-deterministic field and it is excluded from
// viewDigest(). Everything else — including the run summary and the evidence
// binding of every scenario — is reproducible.
//
// Schema hq.aii-coverage/2 keeps the hq.aii-coverage/1 `.summary.gate` shape
// that docs/AII-METRICS-DASHBOARD.md reads, and adds `evidence` + `run`.

import { canonicalJson } from '../util.mjs';
import { sha256Text } from './plan.mjs';
import { viewAiiCoverage } from './registry.mjs';
import { summarizeEvidence } from './receipts-policy.mjs';

export const AII_COVERAGE_SCHEMA = 'hq.aii-coverage/2';

const EVIDENCE_STATES = ['verified', 'stale', 'legacy', 'foreign', 'failed', 'absent'];

function failureRow(result) {
  return {
    id: result.id,
    relPath: result.relPath,
    status: result.status,
    problem: result.problem ?? null,
    error: result.error ?? null,
    missing: Array.isArray(result.missing) ? result.missing : [],
  };
}

/**
 * coverageView — the JSON payload written to hq/aii/coverage.json.
 * Also used in-memory for --summary output, so it must not touch the disk.
 */
export function coverageView({
  reg,
  sum,
  evidence = null,
  plan = null,
  run = null,
  mode = 'summary',
  generatedAt = null,
} = {}) {
  const rows = viewAiiCoverage(reg).map((row) => {
    const bound = evidence instanceof Map ? evidence.get(row.id) : null;
    return {
      ...row,
      evidenceState: bound?.state ?? 'unknown',
      evidenceReason: bound?.reason ?? null,
      evidenceEligible: Boolean(bound?.eligible),
      evidenceReceipt: bound?.receipt ?? null,
      fixture: bound?.canonical ?? null,
    };
  });

  const failures = (run?.failures ?? []).map(failureRow).sort((a, b) => a.id.localeCompare(b.id) || a.relPath.localeCompare(b.relPath));
  const view = {
    schema: AII_COVERAGE_SCHEMA,
    generatedAt: generatedAt ?? new Date().toISOString(),
    mode,
    catalog: {
      path: 'docs/AII-CATALOG.md',
      sha256: plan?.catalogSha ?? null,
    },
    plan: plan
      ? {
        digest: plan.digest ?? null,
        files: plan.counts?.files ?? null,
        uniqueIds: plan.counts?.uniqueIds ?? null,
        byTier: plan.counts?.byTier ?? null,
        byRole: plan.counts?.byRole ?? null,
        duplicates: plan.duplicates ?? [],
      }
```

_First 80 of 212 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
