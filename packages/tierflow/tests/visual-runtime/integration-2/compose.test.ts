/**
 * Wave 2 / Integration 2 — REAL cross-lane acceptance over the Lane A–H modules.
 *
 * Integrator-owned path (WAVE-3-OWNERSHIP.md: `tests/visual-runtime/integration-2/**`).
 *
 * Every assertion below runs against the committed lane modules themselves.
 * There are no mocks, no stubs and no re-implementations in this file or in
 * `src/visual-runtime/integration-2/compose.ts`: each lane leg is an in-process
 * call into the real module. The fixtures are synthetic and inert — no live
 * Host, KB, Studio, Android, provider browser or device is contacted.
 *
 * Where two lanes genuinely disagree the test asserts the measured refusal.
 * A seam that is known to be incompatible must NOT be reported as a pass.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_DOCUMENT,
  COMPOSITION_SCHEMA,
  composeIntegration2,
} from '../../../src/visual-runtime/integration-2/compose.ts';
import { UI_DOCUMENT_SCHEMA } from '../../../src/visual-runtime/document/schema.ts';

const composition = await composeIntegration2();

test('VR2-08: one canonical document crosses all eight lanes in a single composed run', () => {
  assert.equal(composition.schema, COMPOSITION_SCHEMA);
  const lanes = composition.legs.map((leg) => leg.lane);
  assert.deepEqual([...lanes].sort(), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  for (const leg of composition.legs) assert.equal(leg.evidence, 'real-module-call');
  assert.equal(CANONICAL_DOCUMENT.schema, UI_DOCUMENT_SCHEMA);
  assert.ok(composition.seams.length >= 6, 'every measured seam is recorded');
});

test('Lane A validates the canonical document and refuses nothing', () => {
  assert.equal(composition.laneA.ok, true);
  assert.equal(composition.laneA.readOnly, false);
  assert.deepEqual(composition.laneA.diagnostics, []);
  assert.equal(composition.laneA.nodeCount, 6);
  assert.deepEqual(composition.laneA.actionRefs, [{ id: 'fixture.preview', version: 1 }]);
});

test('Lane B refuses the Lane A node with a measured reason, and accepts its own vocabulary', () => {
  // A->B is genuinely incompatible (contract decision I2-03). The composition
  // measures that refusal; it must never be reported as a composed pass.
  assert.equal(composition.laneB.aNodeAccepted, false);
  assert.equal(composition.laneB.aNodeCode, 'UNSAFE_PROP');
  assert.match(composition.laneB.aNodeReason ?? '', /description/);
  assert.equal(composition.laneB.bNativeAccepted, true);
  const abSeam = composition.seams.find((seam) => seam.from === 'A' && seam.to === 'B');
  assert.equal(abSeam?.status, 'refused-measured');
  assert.match(abSeam?.owner ?? '', /Lane B Wave 3 canonical map/);
});

test('Lane B resolves responsive layout at 320, 360 and 1280', () => {
  assert.deepEqual(
    composition.laneB.layout.map((entry) => [entry.viewportPx, entry.columns]),
    [[320, 1], [360, 1], [1280, 2]],
  );
  for (const entry of composition.laneB.layout) {
    assert.ok(entry.itemWidthPx >= 44);
    assert.equal(entry.gapPx, 12);
    assert.equal(entry.paddingPx, 16);
  }
});

test('Lane C publishes the Lane A document with CAS, idempotency and read-only preview', () => {
  assert.equal(composition.laneC.baseRevision, 0);
  assert.equal(composition.laneC.draftRevision, 2);
  assert.equal(composition.laneC.previewMatchesEdit, true);
  assert.equal(composition.laneC.documentsAfterPreview, 0, 'preview never commits');
  assert.equal(composition.laneC.committedRevision, 1);
  assert.match(composition.laneC.committedDigest ?? '', /^sha256:[a-f0-9]{64}$/);
  assert.equal(composition.laneC.replayed, true, 'replaying a command id is idempotent');
  assert.equal(composition.laneC.staleRefusal, 'REVISION_CONFLICT');
  assert.equal(composition.laneC.digestMismatchRefusal, 'DIGEST_MISMATCH');
  assert.equal(composition.laneC.rollbackRevision, 2);
});

test('Lane D refuses the raw Lane A document and renders only the adapter output', () => {
  // Lane A's action references are {id,version} objects; Lane D accepts only
  // inert string reference lists. The integrator adapter is the only bridge.
  assert.equal(composition.laneD.rawDocumentStatus, 'unavailable');
  assert.deepEqual(composition.laneD.rawDocumentIssues, ['INVALID_REFERENCE']);
});

test('Lane D renders the adapted document at 320, 360 and 1280 with a stable structure', () => {
  assert.equal(composition.laneD.rendered.length, 3);
  const shapes = composition.laneD.rendered.map((entry) => entry.snapshot.replace(/^\{"width":\d+/, '{"width":'));
  assert.equal(shapes[0], shapes[1], '320 and 360 share one semantic shape');
  assert.equal(shapes[1], shapes[2], '1280 shares the same semantic shape');
  for (const entry of composition.laneD.rendered) {
    assert.equal(entry.status, 'partial');
    assert.deepEqual(entry.issueCodes, ['SPATIAL_UNSUPPORTED']);
    assert.deepEqual(entry.focusOrder, ['action-button']);
    assert.equal(entry.nodeCount, 8);
  }
  assert.deepEqual(
    composition.laneD.gridColumnsByViewport.map((entry) => [entry.viewportPx, entry.columns]),
    [[320, 1], [360, 1], [1280, 2]],
  );
  assert.deepEqual(composition.laneD.spatialLossCodes, ['SPATIAL_UNSUPPORTED']);
});

test('Lane D output is inert: no event handler, URL or navigation handle exists', () => {
  assert.deepEqual(composition.laneD.effectHandles, []);
  for (const entry of composition.laneD.rendered) {
    assert.doesNotMatch(entry.snapshot, /javascript:/i);
    assert.doesNotMatch(entry.snapshot, /"on[A-Za-z]+"/);
    assert.doesNotMatch(entry.snapshot, /"href"|"src"|"action"/);
  }
});

test('the adapter preserves the authoritative action version in a separate read-only table', () => {
  assert.deepEqual(composition.laneD.versionTable, [{ id: 'fixture.preview', version: 1, inert: true }]);
});

test('Lane G compiles one candidate with text/touch/keyboard parity', () => {
  assert.equal(composition.laneG.outcome, 'candidate');
  assert.equal(composition.laneG.semanticId, 'vivim.preview@1');
  assert.equal(composition.laneG.actionId, 'vivim.preview');
  assert.equal(composition.laneG.risk, 'R1');
  assert.deepEqual(composition.laneG.args, { target: 'kn_8f3a0c71' });
  assert.equal(composition.laneG.exactText, '/vivim.preview@1 target="kn_8f3a0c71"');
  assert.equal(composition.laneG.triModalParity, true);
  assert.equal(composition.laneG.crosswalkResolved, true);
  assert.equal(composition.laneG.argumentsAccepted, true);
  assert.equal(composition.laneG.unknownSemanticOutcome, 'refused');
  assert.equal(composition.laneG.unknownSemanticReason, 'UNKNOWN_SEMANTIC_ID');
});

test('Lane H prepares and approves inertly, and refuses without a grant', () => {
  assert.equal(composition.laneH.granted.kind, 'prepared_inert');
  assert.equal(composition.laneH.granted.effectInvoked, false);
  assert.equal(composition.laneH.granted.approvalRequired, true);
  assert.match(composition.laneH.granted.planId ?? '', /^fh-[a-f0-9]{32}$/);
  assert.equal(composition.laneH.approved.kind, 'approved_inert');
  assert.equal(composition.laneH.approved.effectInvoked, false);
  assert.equal(composition.laneH.approved.next, 'host_owner_gateway_required');
  assert.equal(composition.laneH.denied.kind, 'denied');
  assert.equal(composition.laneH.denied.reasonCode, 'GRANT_MISSING');
  assert.equal(composition.laneH.denied.effectInvoked, false);
  assert.equal(composition.laneH.denied.next, 'explain_refusal');
});

test('Lane H exposes no execute or dispatch entry point', () => {
  assert.deepEqual(composition.laneH.portMembers, [
    'describeForPrincipal',
    'prepare',
    'evaluateApprovalInert',
    'reconcileClaimReadOnly',
  ]);
  assert.equal(composition.laneH.hasExecuteEntryPoint, false);
});

test('Lane F resolves the Lane A binding and leaks no cross-owner record', () => {
  assert.equal(composition.laneA.bindingKnowledgeRef, composition.laneF.boundItemStableId);
  assert.equal(composition.laneF.boundItemVisible, true);
  assert.equal(composition.laneF.boundItemLabel, 'Shared project path');
  assert.equal(composition.laneF.cardCount, 1);
  assert.equal(composition.laneF.projectionState, 'ready');
  assert.equal(composition.laneF.crossOwnerItems, 0, 'other owners and worlds never appear');
  assert.equal(composition.laneF.afterTombstoneItems, 0, 'a tombstoned record is not resurrected');
});

test('Lane E turns the Lane H denial into a read-only recovery view', () => {
  assert.equal(composition.laneE.recovery.stage, 'denied');
  assert.equal(composition.laneE.recovery.retryPolicy, 'owner_reconcile_only');
  assert.equal(composition.laneE.recovery.automaticRetryAllowed, false);
  assert.deepEqual(composition.laneE.recovery.actionKinds, [
    'inspect_status',
    'request_help',
    'return_to_safe_screen',
  ]);
  assert.equal(composition.laneE.help.visible, true);
  assert.equal(composition.laneE.help.runnable, false, 'help is never an execution endpoint');
  assert.equal(composition.laneE.help.canRequestPreview, false);
  assert.match(composition.laneE.help.whyUnavailable ?? '', /permission/i);
});

test('the composition is deterministic across repeated runs', async () => {
  const again = await composeIntegration2();
  assert.deepEqual(again, composition);
});
