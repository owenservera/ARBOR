# File: scripts/roadmap/evidence-truth.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/roadmap/evidence-truth.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7711 B |
| Lines | 151 |
| Hash | 985a097a3eef |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 7 | no | const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;../..&#39;); |
| SOURCES | const | 8 | no | const SOURCES = Object.freeze({ promoted: &#39;integration/beta-gates.json&#39;, proposal: &#39;.integration/proposal5/08-BETA-GATES.json&#39;, release: &#39;integration/release-manifest.json&#39; }); |
| isObject | function | 13 | no | const isObject = v =&gt; v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| accepted | function | 14 | no | const accepted = gate =&gt; gate?.status === &#39;ACCEPTED&#39; &amp;&amp; gate.owner_accepted === true &amp;&amp; |
| string | function | 16 | no | const string = (value, fallback=&#39;UNSPECIFIED&#39;) =&gt; |
| deriveReleaseTruth | function | 19 | yes | export function deriveReleaseTruth({ promoted, proposal, release }) { |
| ids | const | 26 | no | const ids = new Set(); |
| claims | const | 36 | no | const claims = { |
| blockers | const | 43 | no | const blockers = []; |
| conflicts | const | 44 | no | const conflicts = []; |
| proposalUnrun | const | 45 | no | const proposalUnrun = proposal.gates.filter(g =&gt; !accepted(g)); |
| priorCi | const | 61 | no | const priorCi = promoted.mainConsolidation \|\| {}; |
| releaseCi | const | 62 | no | const releaseCi = release.mainConsolidation \|\| {}; |
| ciIsStartupFailure | const | 63 | no | const ciIsStartupFailure = [priorCi, releaseCi].some(c =&gt; c.ciConclusion === &#39;startup_failure&#39; &amp;&amp; c.ciJobs === 0); |
| pwa | const | 72 | no | const pwa = release.platforms?.androidPwa; |
| promotedById | const | 82 | no | const promotedById = new Map(promoted.gates.map(g =&gt; [g.id, g])); |
| gateContradictions | const | 83 | no | const gateContradictions = proposal.gates.filter(g =&gt; promotedById.get(g.id)?.status === &#39;ACCEPTED&#39; &amp;&amp; !accepted(g)).map(g =&gt; g.id); |
| g12 | const | 101 | no | const g12 = promotedById.get(&#39;G12&#39;); |
| internallySatisfied | const | 106 | no | const internallySatisfied = blockers.length === 0 &amp;&amp; conflicts.length === 0; |
| loadReleaseSources | function | 128 | yes | export function loadReleaseSources(root = ROOT) { |
| read | function | 129 | no | const read = rel =&gt; JSON.parse(readFileSync(path.join(root, rel), &#39;utf8&#39;)); |
| main | function | 136 | no | function main() { |
| result | const | 142 | no | const result = deriveReleaseTruth(loadReleaseSources()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/roadmap/a05-cycle.mjs](./a05-cycle.mjs.md) | ./evidence-truth.mjs |
| [scripts/roadmap/a05-cycle.test.mjs](./a05-cycle.test.mjs.md) | ./evidence-truth.mjs |
| [scripts/roadmap/evidence-truth.test.mjs](./evidence-truth.test.mjs.md) | ./evidence-truth.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// A00 read-only release-truth projection. Ledger text is a CLAIM, never an executed receipt.
// Historical source files and keeper-owned roadmap are never modified.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCES = Object.freeze({
  promoted: 'integration/beta-gates.json',
  proposal: '.integration/proposal5/08-BETA-GATES.json',
  release: 'integration/release-manifest.json'
});
const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
const accepted = gate => gate?.status === 'ACCEPTED' && gate.owner_accepted === true &&
  Boolean(gate.observed_evidence);
const string = (value, fallback='UNSPECIFIED') =>
  typeof value === 'string' && value.length ? value : fallback;

export function deriveReleaseTruth({ promoted, proposal, release }) {
  for (const [name, ledger] of Object.entries({ promoted, proposal, release })) {
    if (!isObject(ledger) || typeof ledger.status !== 'string')
      throw new TypeError('Malformed or missing ' + name + ' status ledger');
  }
  if (!Array.isArray(proposal.gates) || !Array.isArray(promoted.gates))
    throw new TypeError('Both beta gate ledgers require a gates array');
  const ids = new Set();
  for (const gate of proposal.gates) {
    if (!isObject(gate) || typeof gate.id !== 'string' || ids.has(gate.id))
      throw new TypeError('Malformed or duplicate proposal gate ID');
    ids.add(gate.id);
  }
  for (const gate of promoted.gates) {
    if (!isObject(gate) || typeof gate.id !== 'string')
      throw new TypeError('Malformed promoted gate');
  }
  const claims = {
    promoted: { source: SOURCES.promoted, status: promoted.status,
      decision: promoted.decision || null, sourceMergeSha: promoted.sourceMergeSha || null },
    proposal: { source: SOURCES.proposal, status: proposal.status },
    release: { source: SOURCES.release, status: release.status,
      sourceMerge: release.sourceMerge || null }
  };
  const blockers = [];
  const conflicts = [];
  const proposalUnrun = proposal.gates.filter(g => !accepted(g));
  if (proposalUnrun.length) blockers.push({
    code: 'PROPOSAL_GATES_UNRUN', count: proposalUnrun.length,
    gateIds: proposalUnrun.map(g => g.id),
    detail: 'A missing/UNRUN gate, absent receipt or unaccepted owner gate is not a pass'
  });
  if (release.status !== 'BUILT_ACCEPTED' || release.securityAccepted !== true ||
      release.deviceAccepted !== true || release.noDonorBuildAccepted !== true ||
      release.mainConsolidation?.releaseAllowed !== true) {
    blockers.push({ code: 'RELEASE_NOT_ACCEPTED',
      manifestStatus: release.status,
      securityAccepted: release.securityAccepted === true,
      deviceAccepted: release.deviceAccepted === true,
      noDonorBuildAccepted: release.noDonorBuildAccepted === true,
      releaseAllowed: release.mainConsolidation?.releaseAllowed === true });
  }
  const priorCi = promoted.mainConsolidation || {};
  const releaseCi = release.mainConsolidation || {};
  const ciIsStartupFailure = [priorCi, releaseCi].some(c =>
    c.ciConclusion === 'startup_failure' && c.ciJobs === 0);
  if (ciIsStartupFailure) {
    blockers.push({ code: 'CI_STARTUP_FAILURE_ZERO_JOBS',
      sources: [SOURCES.promoted, SOURCES.release].filter((_, i) =>
        [priorCi, releaseCi][i].ciConclusion === 'startup_failure' &&
        [priorCi, releaseCi][i].ciJobs === 0),
      detail: 'Workflow never launched test jobs; do not infer a process exit or passing checks' });
  }
  const pwa = release.platforms?.androidPwa;
  if (release.deviceAccepted !== true || pwa === 'UNRUN')
    blockers.push({ code: 'PHYSICAL_DEVICE_EVIDENCE_UNRUN',
      androidPwa: string(pwa), ownerAccepted: release.deviceAccepted === true });
  if (promoted.status === 'UNBLOCKED' && proposal.status === 'PROPOSED_UNRUN')
    conflicts.push({ code: 'UNBLOCKED_VS_PROPOSAL_UNRUN',
      sources: [SOURCES.promoted, SOURCES.proposal] });
  if (promoted.status === 'UNBLOCKED' && release.status !== 'BUILT_ACCEPTED')
    conflicts.push({ code: 'UNBLOCKED_VS_RELEASE_BLOCKED',
```

_First 80 of 152 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
