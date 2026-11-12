/** Lane E: real Wave 2 imports with synthetic external KB/Host transport fixtures only. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { projectFounderWorkspaceJourney, type FounderJourneyInput } from '../../src/visual-runtime/experience/wave3-journey-fixture.ts';
import { createFixtureKnowledgeClient, type CanonicalKnowledgeRecord, type KnowledgeClient } from '../../src/visual-runtime/knowledge/client.ts';
import { canonicalKnowledgeFixtures, FIXTURE_IDS, fixtureTrustedContext, mutableFixtureBroker } from '../../src/visual-runtime/knowledge/fixtures.ts';
import { createHostCapabilityFixture } from '../../src/visual-runtime/host/fixture.ts';
import { toExactText } from '../../src/visual-runtime/command/compile.ts';
import type { CrosswalkRow, ActionDescriptor } from '../../src/visual-runtime/command/crosswalk.ts';
import { newJourney } from '../../src/visual-runtime/experience/onboarding.ts';
import type { TrustedFixtureHostContext } from '../../src/visual-runtime/host/port.ts';
import type { CommandInput } from '../../src/visual-runtime/command/ir.ts';

const NOW = Date.UTC(2026, 10, 6, 16, 0, 0);
const hash = (s: string): string => createHash('sha256').update(s).digest('hex');
const SEMANTIC_ID = 'vivim.preview@1';
const ACTION_ID = 'vivim.preview';
const CATALOG_DIGEST = hash('synthetic founder host catalog v1');
const ROW_HASH = hash('synthetic reviewed crosswalk row v1');
const ARGS_HASH = hash('synthetic {target:enum:alpha}');
const EXACT = toExactText(SEMANTIC_ID, { target: FIXTURE_IDS.alpha })!;

function fixtures(rows: CanonicalKnowledgeRecord[] = canonicalKnowledgeFixtures()) {
  const auth = mutableFixtureBroker(fixtureTrustedContext({ sessionExpiresAt: NOW + 600_000, grantExpiresAt: NOW + 600_000 }));
  const knowledgeClient = createFixtureKnowledgeClient(rows, auth.broker, { now: () => NOW });
  const host = createHostCapabilityFixture({
    catalogVersion: 1, catalogDigest: CATALOG_DIGEST,
    actions: [{ actionId: ACTION_ID, catalogVersion: 1, risk: 'R1', readiness: 'verified',
      requiredScopes: ['vivim:preview'], argsSchema: { target: { type: 'enum', values: [FIXTURE_IDS.alpha] } },
      evidence: 'verified', prerequisites: [] }],
  });
  const hostContext: TrustedFixtureHostContext = {
    schema: 'fixture.trusted-host-context/1', authenticated: true, ownerRef: 'owner_a', actorRef: 'actor_a',
    deviceRef: 'desktop_1', sessionRef: 'session_1', worldRef: 'world_a', surface: 'desktop',
    nowMs: NOW, sessionExpiresAtMs: NOW + 600_000, worldRevision: 'world-1', policyRevision: 'policy-1',
    catalogVersion: 1, catalogDigest: CATALOG_DIGEST, availabilityByAction: { [ACTION_ID]: 'yes' }, grant: null,
  };
  const target = { owner: 'host_effect' as const, actionId: ACTION_ID, catalogVersion: 1 };
  const rowsForCompile: CrosswalkRow[] = [{
    semanticRef: { id: SEMANTIC_ID, version: '1', sourceHash: ROW_HASH },
    target, argsSchema: { target: { type: 'enum', values: [FIXTURE_IDS.alpha] } },
    argsSchemaHash: ARGS_HASH, risk: 'R1', riskSource: { authority: 'host_catalog', sourceHash: ROW_HASH },
    implementationStatus: 'verified', reviewedEnabled: true,
  }];
  // The compiler's reviewed descriptor may be stale about the current owner's grant;
  // Host, NOT compiler, remains the final refusal authority.
  const descriptors: ActionDescriptor[] = [{
    target, argsSchemaHash: ARGS_HASH, sourceHash: ROW_HASH, risk: 'R1', implementationStatus: 'verified',
    capability: { supportedByBuild: true, availableNow: 'yes', permittedForActor: 'yes',
      verifiedByEvidence: true, reasonCodes: [] },
  }];
  const input: FounderJourneyInput = {
    knowledgeBroker: auth.broker, knowledgeClient, host, hostContext,
    workspaceRef: 'workspace_a', documentId: 'founder_workspace', requestId: 'req_founder',
    projectStableIds: [FIXTURE_IDS.alpha, FIXTURE_IDS.beta, FIXTURE_IDS.stale],
    commandInput: { commandId: 'cmd_founder', source: { surface: 'text', inputDigest: hash(EXACT) },
      text: EXACT, expectedVersions: { policy: 'policy-1' } },
    commandContext: { rows: rowsForCompile, descriptors, currentVersions: { kb: 'fixture-epoch-1',
      hostWorld: 'world-1', policy: 'policy-1', uiRevision: '0' } },
    hostCatalogDigest: CATALOG_DIGEST, onboardingState: newJourney(), onboardingEvidence: {
      provider: { source: 'studio', proof: 'tab_ready', observedAtMs: NOW },
      owner: { source: 'other', selectionConfirmed: 'yes' },
    }, viewportPx: 360, nowMs: NOW,
  };
  return { auth, knowledgeClient, host, hostContext, input };
}
const run = (patch: Partial<FounderJourneyInput> = {}) => {
  const f = fixtures();
  return projectFounderWorkspaceJourney({ ...f.input, ...patch });
};

 test('novice workspace uses real KB projection, canonical document/renderer, typed candidate and actual Host denial', async () => {
  const f = fixtures();
  const view = await projectFounderWorkspaceJourney(f.input);
  assert.equal(view.schema, 'vivim.founder-journey-fixture/1');
  assert.equal(view.evidenceClass, 'synthetic-real-module-fixture');
  assert.equal(view.state, 'partial'); // one explicit stale project
  assert.equal(view.projects.length, 3);
  assert.equal(view.projects.filter(x => x.title === 'Shared project path').length, 2);
  assert.notEqual(view.projects[0]?.stableId, view.projects[1]?.stableId);
  assert.ok(view.projects.every(x => x.source.evidenceRefs.length && x.source.authority === 'fixture.hq'));
  assert.equal(view.projects.every(x => x.interactive === false), true);
  assert.equal(view.document.ok, true);
  assert.equal(view.render.status, 'ok');
  assert.equal(view.render.root.tag, 'main');
  assert.equal(view.commandPreview?.kind, 'typed-inert-candidate');
  assert.equal(view.commandPreview?.exactText, EXACT);
  assert.equal(view.commandPreview?.command.target.actionId, ACTION_ID);
  assert.equal(view.commandPreview?.command.semanticRef.version, '1');
  assert.equal(view.commandPreview?.effectInvoked, false);
  assert.equal(view.hostDecision.kind, 'denied');
  assert.equal(view.hostDecision.reasonCode, 'GRANT_MISSING');
  assert.equal(view.effectInvoked, false);
  assert.equal(view.help.visible, true);
  assert.equal(view.help.runnable, false);
  assert.equal(view.help.canRequestPreview, false);
  assert.match(view.help.whyUnavailable ?? '', /permission/i);
  assert.equal(view.recovery.automaticRetryAllowed, false);
  assert.equal(view.recovery.retryPolicy, 'owner_reconcile_only');
  assert.ok(view.recovery.actions.some(a => a.kind === 'request_help'));
  assert.equal(view.navigation.deliberateInteractionsToHelp, 1);
  assert.equal(view.navigation.cancelAccepted, true);
  assert.equal(view.navigation.resumeAccepted, true);
  assert.equal(view.navigation.resumedStep, 'privacy');
  assert.equal(view.navigation.focusReturn, 'onboarding-current-step');
  assert.equal(view.recovery.focus.escape, 'return_to_safe_screen');
});

 test('accessible 320, 360 and 1280px inert render: no execution surface or raw HTML', async () => {
  for (const viewportPx of [320, 360, 1280]) {
    const f = fixtures();
    const view = await projectFounderWorkspaceJourney({ ...f.input, viewportPx });
    assert.equal(view.render.viewportPx, viewportPx);
    assert.equal(view.render.status, 'ok');
    assert.equal(view.render.focusOrder.length, 0);
    assert.doesNotMatch(JSON.stringify(view.render), /innerHTML|onClick|javascript:/i);
    assert.equal('execute' in view, false);
    assert.equal('dispatch' in view, false);
  }
});

 test('typed text/touch/keyboard select identical semantic/arguments; each remains inert', async () => {
  const f = fixtures();
  const candidate = f.input.commandInput;
  const variants: CommandInput[] = [candidate,
    { commandId: 'cmd_touch', source: { surface: 'touch', inputDigest: hash('touch') },
      selection: { semanticId: SEMANTIC_ID, args: { target: FIXTURE_IDS.alpha } }, expectedVersions: { policy: 'policy-1' } },
    { commandId: 'cmd_keyboard', source: { surface: 'keyboard', inputDigest: hash('keyboard') },
      selection: { semanticId: SEMANTIC_ID, args: { target: FIXTURE_IDS.alpha } }, expectedVersions: { policy: 'policy-1' } },
  ];
  const views = await Promise.all(variants.map(commandInput =>
    projectFounderWorkspaceJourney({ ...f.input, commandInput })));
  assert.ok(views.every(x => x.commandPreview?.authorization === 'not-granted'));
  assert.deepEqual(views.map(x => x.commandPreview?.command), Array(3).fill(views[0]?.commandPreview?.command));
  assert.ok(views.every(x => x.hostDecision.reasonCode === 'GRANT_MISSING' && !x.hostDecision.effectInvoked));
});

 test('read-only change cue is not an authoritative assertion; stale records cannot be command targets', async () => {
  const f = fixtures();
  const view = await projectFounderWorkspaceJourney({ ...f.input,
    earlierSourceVersions: { [FIXTURE_IDS.alpha]: 'rev-2', [FIXTURE_IDS.beta]: 'rev-3' } });
  assert.equal(view.projects.find(x => x.stableId === FIXTURE_IDS.alpha)?.changeCue, 'version-diff-unverified');
  assert.equal(view.projects.find(x => x.stableId === FIXTURE_IDS.beta)?.changeCue, 'same-version');
  assert.match(view.projects.find(x => x.stableId === FIXTURE_IDS.stale)?.statusLabel ?? '', /stale/i);
  const staleTarget = await projectFounderWorkspaceJourney({ ...f.input,
    commandInput: { commandId: 'cmd_bad', source: { surface: 'touch', inputDigest: hash('bad') },
      selection: { semanticId: SEMANTIC_ID, args: { target: FIXTURE_IDS.stale } } } });
  assert.equal(staleTarget.commandPreview, null);
  assert.equal(staleTarget.hostDecision.kind, 'not_evaluated');
});

 test('missing KB record: empty workspace is not fabricated and no command or Host call occurs', async () => {
  const f = fixtures();
  const view = await projectFounderWorkspaceJourney({ ...f.input, projectStableIds: ['kn_not_found'] });
  assert.equal(view.state, 'empty');
  assert.deepEqual(view.projects, []);
  assert.equal(view.commandPreview, null);
  assert.equal(view.hostDecision.kind, 'not_evaluated');
  assert.equal(view.recovery.automaticRetryAllowed, false);
});

 test('revoked broker grant, foreign principal, foreign world and expired session suppress all KB data', async () => {
  const cases = [
    fixtureTrustedContext({ revoked: true }),
    fixtureTrustedContext({ ownerRef: 'owner_b' }),
    fixtureTrustedContext({ personalWorldRef: 'world_b' }),
    fixtureTrustedContext({ sessionExpiresAt: NOW - 1 }),
  ];
  for (const context of cases) {
    const f = fixtures();
    f.auth.setContext(context);
    const view = await projectFounderWorkspaceJourney(f.input);
    assert.equal(view.state, 'denied');
    assert.equal(view.projects.length, 0);
    assert.equal(view.commandPreview, null);
    assert.equal(view.knowledgeRevisions.length, 0);
    assert.equal(view.hostDecision.kind, 'not_evaluated');
    assert.doesNotMatch(JSON.stringify(view), /Owner B private|Another World private|Sensitive medical sample/);
  }
});

 test('revocation during an awaited knowledge read is rechecked before any card is returned', async () => {
  const f = fixtures();
  let calls = 0;
  const intercepted: KnowledgeClient = { query: async query => {
    const page = await f.knowledgeClient.query(query);
    if (++calls === 1) f.auth.setContext(fixtureTrustedContext({ revoked: true }));
    return page;
  }};
  const view = await projectFounderWorkspaceJourney({ ...f.input, knowledgeClient: intercepted });
  assert.equal(view.state, 'denied');
  assert.equal(view.projects.length, 0);
  assert.equal(view.commandPreview, null);
});

 test('offline knowledge drops prior content instead of replaying cached sensitive items', async () => {
  const f = fixtures();
  const before = await projectFounderWorkspaceJourney(f.input);
  assert.equal(before.projects.length, 3);
  f.auth.setContext(fixtureTrustedContext({ offline: true }));
  const after = await projectFounderWorkspaceJourney(f.input);
  assert.equal(after.projects.length, 0);
  assert.equal(after.commandPreview, null);
  assert.equal(after.recovery.automaticRetryAllowed, false);
  assert.deepEqual(after.knowledgeRevisions, []);
});

 test('tombstone and source revocation cannot resurrect project via selection or snapshot', async () => {
  const f = fixtures();
  f.knowledgeClient.applyFixtureSourceEvent({ type: 'tombstone', stableId: FIXTURE_IDS.alpha });
  const view = await projectFounderWorkspaceJourney(f.input);
  assert.equal(view.projects.some(x => x.stableId === FIXTURE_IDS.alpha), false);
  assert.equal(view.commandPreview, null);
  assert.equal(view.hostDecision.kind, 'not_evaluated');
  f.knowledgeClient.applyFixtureSourceEvent({ type: 'revoke', stableId: FIXTURE_IDS.beta });
  const after = await projectFounderWorkspaceJourney(f.input);
  assert.equal(after.projects.some(x => x.stableId === FIXTURE_IDS.beta), false);
});

 test('malicious KB label and URL cannot become executable render content', async () => {
  const rows = canonicalKnowledgeFixtures().map(row => row.stableId === FIXTURE_IDS.alpha
    ? { ...row, label: '<img src=x onerror=alert(1)>', summary: 'javascript:alert(1)' } : row);
  const f = fixtures(rows);
  const view = await projectFounderWorkspaceJourney(f.input);
  assert.equal(view.effectInvoked, false);
  assert.doesNotMatch(JSON.stringify(view.render), /<img|onerror=|javascript:/i);
  assert.equal(view.render.focusOrder.length, 0);
});

 test('missing provenance evidence prevents unverified card and typed candidate', async () => {
  const rows = canonicalKnowledgeFixtures().map(row => row.stableId === FIXTURE_IDS.alpha
    ? { ...row, evidenceRefs: [] } : row);
  const f = fixtures(rows);
  const view = await projectFounderWorkspaceJourney(f.input);
  assert.equal(view.projects.some(x => x.stableId === FIXTURE_IDS.alpha), false);
  assert.equal(view.commandPreview, null);
});

 test('unreviewed semantic, stale policy and risk R3 never produce Host plan', async () => {
  const f = fixtures();
  const unknown = await projectFounderWorkspaceJourney({ ...f.input,
    commandInput: { commandId: 'unknown', source: { surface: 'touch', inputDigest: hash('unknown') },
      selection: { semanticId: 'vivim.nonexistent@1', args: { target: FIXTURE_IDS.alpha } } } });
  assert.equal(unknown.commandPreview, null);
  assert.equal(unknown.hostDecision.kind, 'not_evaluated');
  const stale = await projectFounderWorkspaceJourney({ ...f.input,
    commandInput: { ...f.input.commandInput, expectedVersions: { policy: 'policy_old' } } });
  assert.equal(stale.commandRefusal, 'STALE_SOURCE_VERSION');
  const row = f.input.commandContext.rows[0]!;
  const desc = f.input.commandContext.descriptors[0]!;
  const risky = await projectFounderWorkspaceJourney({ ...f.input,
    commandContext: { ...f.input.commandContext,
      rows: [{ ...row, risk: 'R3' }], descriptors: [{ ...desc, risk: 'R3' }] } });
  assert.equal(risky.commandPreview, null);
  assert.equal(risky.commandRefusal, 'R3_REFUSED');
  assert.equal(risky.hostDecision.kind, 'not_evaluated');
});

 test('provider tab readiness never counts as sign-in and pairing accessible name never contains QR secret', async () => {
  const f = fixtures();
  const secret = 'f'.repeat(64);
  const view = await projectFounderWorkspaceJourney({ ...f.input,
    onboardingState: { ...newJourney(), current: 'provider', privacyAcknowledged: true } });
  assert.equal(view.onboarding.steps.find(step => step.id === 'provider')?.status, 'blocked');
  assert.match(view.onboarding.steps.find(step => step.id === 'provider')?.whyBlocked ?? '', /does not prove sign-in/);
  assert.equal(view.onboarding.pairingQrAccessibleName.includes(secret), false);
  assert.doesNotMatch(view.onboarding.pairingQrAccessibleName, /https?:\/\//);
  assert.equal(view.navigation.resumedStep, 'provider');
});

 test('no automatic retry on denial; recovery keeps focus, help and safe return', async () => {
  const view = await run();
  assert.equal(view.recovery.automaticRetryAllowed, false);
  assert.equal(view.recovery.actions.some(x => x.kind === 'request_undo' || x.kind === 'cancel_local'), false);
  assert.ok(view.recovery.actions.some(x => x.kind === 'return_to_safe_screen'));
  assert.equal(view.recovery.focus.restoreFocus, true);
  assert.equal(view.onboarding.focus.statusLive, 'polite');
});

 test('invalid document, duplicated IDs and unchecked browser authority are refused before reads', async () => {
  const f = fixtures();
  for (const projectStableIds of [[FIXTURE_IDS.alpha, FIXTURE_IDS.alpha], ['__proto__'], Array(9).fill('kn_fake')]) {
    await assert.rejects(projectFounderWorkspaceJourney({ ...f.input, projectStableIds }), /Invalid inert/);
  }
  const wrongHostContext = { ...f.hostContext, ownerRef: 'owner_b' };
  const view = await projectFounderWorkspaceJourney({ ...f.input, hostContext: wrongHostContext });
  assert.equal(view.state, 'denied');
  assert.equal(view.projects.length, 0);
});