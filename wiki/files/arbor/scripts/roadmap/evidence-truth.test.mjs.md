# File: scripts/roadmap/evidence-truth.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/roadmap/evidence-truth.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6227 B |
| Lines | 122 |
| Hash | 70324987410c |
| Test | yes |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 9 | no | const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;../..&#39;); |
| LEDGERS | const | 10 | no | const LEDGERS = [ |
| gates | function | 16 | no | function gates(status = &#39;UNRUN&#39;, owner = false, observed = null) { |
| ledgers | function | 21 | no | function ledgers() { |
| view | const | 35 | no | const view = deriveReleaseTruth(loadReleaseSources()); |
| view | const | 56 | no | const view = deriveReleaseTruth(ledgers()); |
| view | const | 65 | no | const view=deriveReleaseTruth(ledgers()); |
| block | const | 66 | no | const block=view.blockers.find(x=&gt;x.code===&#39;CI_STARTUP_FAILURE_ZERO_JOBS&#39;); |
| input | const | 73 | no | const input=ledgers(); |
| view | const | 75 | no | const view=deriveReleaseTruth(input); |
| input | const | 80 | no | const input=ledgers(); |
| view | const | 92 | no | const view=deriveReleaseTruth(input); |
| input | const | 101 | no | const input=ledgers(); |
| dirty | const | 109 | no | const dirty = execSync(&#39;git status --porcelain -- &#39; + LEDGERS.join(&#39; &#39;), { cwd: ROOT, encoding: &#39;utf8&#39; }).trim(); |
| promoted | const | 111 | no | const promoted = JSON.parse(readFileSync(path.join(ROOT, LEDGERS[0]), &#39;utf8&#39;)); |
| proposal | const | 112 | no | const proposal = JSON.parse(readFileSync(path.join(ROOT, LEDGERS[1]), &#39;utf8&#39;)); |
| release | const | 113 | no | const release = JSON.parse(readFileSync(path.join(ROOT, LEDGERS[2]), &#39;utf8&#39;)); |
| view | const | 117 | no | const view = deriveReleaseTruth(loadReleaseSources()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:child_process | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ./evidence-truth.mjs | import | 7 | [scripts/roadmap/evidence-truth.mjs](./evidence-truth.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveReleaseTruth, loadReleaseSources } from './evidence-truth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEDGERS = [
  'integration/beta-gates.json',
  '.integration/proposal5/08-BETA-GATES.json',
  'integration/release-manifest.json'
];

function gates(status = 'UNRUN', owner = false, observed = null) {
  return ['G00','G01','G12'].map(id => ({
    id, status, owner_accepted: owner, observed_evidence: observed
  }));
}
function ledgers() {
  return {
    promoted: {status:'UNBLOCKED', gates:gates('ACCEPTED',true,'claim only'),
      mainConsolidation:{ciConclusion:'startup_failure',ciJobs:0,ciRunId:43334607434,
        betaGo:true,toolchainTests:'EXECUTED',deploymentAuthorized:true,mergeCommit:'aaa'}},
    proposal: {status:'PROPOSED_UNRUN',gates:gates()},
    release: {status:'BLOCKED_NOT_BUILT',securityAccepted:false,
      deviceAccepted:false,noDonorBuildAccepted:false,platforms:{androidPwa:'UNRUN'},
      mainConsolidation:{releaseAllowed:false,ciConclusion:'startup_failure',
        ciJobs:0,mergeCommit:'bbb'}}
  };
}

test('actual source ledgers preserve contradictory claims without release promotion', () => {
  const view = deriveReleaseTruth(loadReleaseSources());
  assert.equal(view.schema, 'arbor.release-truth-projection/2');
  assert.equal(view.claims.promoted.source, 'integration/beta-gates.json');
  assert.equal(view.claims.proposal.source, '.integration/proposal5/08-BETA-GATES.json');
  assert.equal(view.claims.release.source, 'integration/release-manifest.json');
  assert.equal(view.claims.promoted.status, 'UNBLOCKED');
  assert.equal(view.claims.proposal.status, 'PROPOSED_UNRUN');
  assert.equal(view.claims.release.status, 'BLOCKED_NOT_BUILT');
  assert.equal(view.releaseReady, false);
  assert.equal(view.disposition, 'BLOCKED_UNVERIFIED');
  assert.equal(view.conflictingClaims, true);
  assert.ok(view.conflicts.some(c => c.code === 'PROMOTED_GATES_VS_UNRUN_PROPOSAL'));
  assert.ok(view.blockers.some(c => c.code === 'CI_STARTUP_FAILURE_ZERO_JOBS'));
  assert.ok(view.blockers.some(c => c.code === 'PHYSICAL_DEVICE_EVIDENCE_UNRUN'));
  assert.equal(view.evidence.browserDom, 'UNRUN');
  assert.equal(view.evidence.independentKeeperReceipt, 'UNRUN');
  assert.equal(view.historicalReceiptsPreserved, true);
  assert.equal(view.evidenceIsNotReleasePermission, true);
});

test('unrun proposal and missing device proof block even if promoted ledger says UNBLOCKED', () => {
  const view = deriveReleaseTruth(ledgers());
  assert.deepEqual(view.blockers.find(x => x.code === 'PROPOSAL_GATES_UNRUN').gateIds,
    ['G00','G01','G12']);
  assert.equal(view.releaseReady,false);
  assert.ok(view.conflicts.some(c => c.code === 'EXECUTED_OR_RELEASE_CLAIM_VS_ZERO_CI_JOBS'));
  assert.ok(view.conflicts.some(c => c.code === 'INCONSISTENT_MERGE_SHA'));
});

test('zero CI jobs are not Node test process execution or release permission', () => {
  const view=deriveReleaseTruth(ledgers());
  const block=view.blockers.find(x=>x.code==='CI_STARTUP_FAILURE_ZERO_JOBS');
  assert.ok(block);
  assert.equal(view.evidence.ci,'LEDGERS_REPORT_STARTUP_FAILURE_ZERO_JOBS');
  assert.equal(view.evidence.nodeTests,'NOT_EXECUTED_BY_THIS_READ_ONLY_PROJECTION');
});

test('G12 accepted claim that admits UNRUN must stay contradictory', () => {
  const input=ledgers();
  input.promoted.gates.find(g=>g.id==='G12').observed_evidence='runner authored, not executed';
  const view=deriveReleaseTruth(input);
  assert.ok(view.conflicts.some(x=>x.code==='G12_ACCEPTED_CLAIM_ADMITS_UNRUN'));
});

test('even perfectly aligned green ledgers do not confer independent acceptance', () => {
  const input=ledgers();
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
