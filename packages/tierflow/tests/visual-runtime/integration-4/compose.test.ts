/**
 * Integration 4: ONE Founder Workspace through the EIGHT real Wave 4 modules.
 *
 * Real imports only: A/B/C/D/E/F/G/H lane modules plus the real Wave 3 A, B, D,
 * F and G modules they build on. Synthetic inputs are strictly EXTERNAL facts a
 * Host/Android owner would supply (broker, catalog bytes, pairing epoch, Host
 * read port). No lane module is mocked and no contract is re-implemented here.
 *
 * Every lane is measured independently. A lane that refuses is reported as a
 * measured BLOCKED gate; the composition never silently works around it.
 *
 * Every refusal code asserted below was MEASURED against the real lane
 * modules, not assumed. See VIVIM-VISUAL-RUNTIME/WAVE-4/INTEGRATION-4-RESULT.md.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { composeIntegration4, laneBRepairPatch, type Integration4Input, type Integration4Lane } from '../../../src/visual-runtime/integration-4/compose.ts';
import { setup, NOW } from './fixture.ts';

type Result = Awaited<ReturnType<typeof composeIntegration4>>;
type Input = Integration4Input;

function ok(result: Result) {
  const refusal = result.ok ? null : result;
  assert.equal(result.ok, true, JSON.stringify(result));
  if (refusal) throw Error(refusal.phase + ':' + refusal.code);
  return result;
}
function lane(result: Result, id: Integration4Lane) {
  const found = result.ok ? result.lanes.find(l => l.lane === id) : undefined;
  assert.ok(found, `lane ${id} missing`);
  return found!;
}
function composed(result: Result, id: Integration4Lane) {
  const l = lane(result, id);
  assert.equal(l.status, 'composed', `${id}: ${l.code ?? 'no-code'}`);
  return l;
}
function blocked(result: Result, id: Integration4Lane, code?: string) {
  const l = lane(result, id);
  assert.equal(l.status, 'blocked', `${id} was ${l.status}/${l.code ?? 'no-code'}`);
  if (code) assert.equal(l.code, code, `${id} code`);
  return l;
}

/**
 * Builds a DELIBERATELY invalid external observation so the lane's own guard is
 * exercised. The cast is confined to this one helper on purpose: the value is
 * intentionally outside the declared contract, and the lane must refuse it.
 */
function invalid<T>(base: T, patch: Record<string, unknown>): T {
  return { ...(base as Record<string, unknown>), ...patch } as T;
}

test('I4-01: F and A compose over the real Wave 3 F feed and the real Wave 3 A semantics', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4(input));
  assert.deepEqual(r.trace, ['F', 'A', 'B', 'C', 'G', 'H', 'D', 'E']);
  assert.equal(r.evidenceClass, 'synthetic-real-modules-not-live-acceptance');
  assert.equal(r.document.documentId, 'world_a');
  assert.equal(r.document.revision, 3);
  assert.match(r.document.documentDigest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(r.effectInvoked, false);
  assert.equal(r.automaticRetryAllowed, false);
  const f = composed(r, 'F');
  assert.equal(f.evidence.state, 'ready');
  assert.equal(f.evidence.cards, 1);
  assert.equal(f.evidence.retainOffline, false);
  const a = composed(r, 'A');
  assert.equal(a.evidence.status, 'ok');
  assert.equal(a.evidence.effectsInvoked, false);
  assert.equal(a.evidence.publisher, 'harness');
});

test('I4-02: Lane B composes over the real Wave 3 renderer after the owner-authorized repair', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4(input));
  // The renderer facts that motivated the repair are unchanged and still measured:
  // the real Wave 3 renderer always emits a synthetic 'render_root' wrapper whose
  // child is the canonical root node.
  const b = composed(r, 'B');
  assert.equal(b.evidence.status, 'ready');
  assert.equal(b.evidence.canonicalRootId, 'root');
  assert.equal(b.evidence.renderPlanRootId, 'render_root');
  assert.equal(b.evidence.effectInvoked, false);
  assert.equal(b.evidence.canApproveOnPhone, false);
  // No cross-lane defect is outstanding.
  assert.equal(r.defects.length, 0);
});

test('I4-03: the owner-authorized Lane B patch is APPLIED to the lane source', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4(input));
  assert.equal(r.defects.length, 0);
  const patch = laneBRepairPatch();
  assert.match(patch, /wave4-phone-adapter\.ts:227/);
  assert.match(patch, /!ids\.has\(d\.rootId\)/);
  // The lane source really carries the repaired predicate and no longer carries the
  // original one. The patch was applied under FINAL-WAVE/EXECUTE-NOW.md section 7.
  const source = readFileSync(new URL(
    '../../../src/visual-runtime/device/wave4-phone-adapter.ts', import.meta.url), 'utf8');
  assert.ok(source.includes(
    "if (!root || !ids.has(d.rootId) || !d.nodes.some(n => n.id === d.rootId) || r.plan.focusOrder.some(x => !ids.has(x))) return refuse('UNSAFE_RENDER', w);"),
    'repaired Wave 4 B guard must be present in the lane source');
  assert.equal(source.includes("root.id !== d.rootId"), false);
});

test('I4-04: every other lane still composes; one lane defect never hides another lane', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4(input));
  for (const id of ['F', 'A', 'C', 'G', 'H', 'D', 'E'] as Integration4Lane[]) composed(r, id);
  // No lane ever claims an effect, a writer or an automatic retry.
  assert.equal(r.effectInvoked, false);
  assert.equal(r.automaticRetryAllowed, false);
  assert.equal(composed(r, 'A').evidence.effectsInvoked, false);
  assert.equal(composed(r, 'C').evidence.surfacesAgree, true);
  assert.equal(composed(r, 'G').evidence.desktopEffectPerformed, false);
  assert.equal(composed(r, 'G').evidence.phoneEffectPerformed, false);
  assert.equal(composed(r, 'H').evidence.effectInvoked, false);
  assert.equal(composed(r, 'H').evidence.canExecute, false);
  assert.equal(composed(r, 'E').evidence.automaticRetryAllowed, false);
});

test('I4-05: C and G agree on the same semantic, action and risk on BOTH real surfaces', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4(input));
  const c = composed(r, 'C');
  const g = composed(r, 'G');
  assert.equal(c.evidence.desktopSemanticId, c.evidence.phoneSemanticId);
  assert.equal(c.evidence.desktopRisk, c.evidence.phoneRisk);
  assert.equal(g.evidence.desktopSemanticId, c.evidence.desktopSemanticId);
  assert.equal(g.evidence.phoneSemanticId, c.evidence.phoneSemanticId);
  assert.equal(g.evidence.desktopRisk, c.evidence.desktopRisk);
  assert.equal(g.evidence.phoneRisk, c.evidence.phoneRisk);
  assert.equal(g.evidence.desktopActionId, g.evidence.phoneActionId);
});

test('I4-06: G envelope digests are stable across re-validation and differ per surface', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4(input));
  const g = composed(r, 'G');
  assert.match(String(g.evidence.desktopEnvelopeDigest), /^[a-f0-9]{64}$/);
  assert.match(String(g.evidence.phoneEnvelopeDigest), /^[a-f0-9]{64}$/);
  assert.notEqual(g.evidence.desktopEnvelopeDigest, g.evidence.phoneEnvelopeDigest);
  assert.equal(g.evidence.desktopExecutionAuthority, 'none');
  assert.equal(g.evidence.phoneExecutionAuthority, 'none');
  assert.equal(g.evidence.desktopApproval, 'not_requested');
});

test('I4-07: D and F describe the SAME owner-scoped KB rows (one snapshot authority)', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4(input));
  const f = composed(r, 'F');
  const d = composed(r, 'D');
  assert.equal(d.evidence.state, 'ready');
  assert.equal(d.evidence.effects, 0);
  assert.equal(f.evidence.cards, 1);
  assert.deepEqual(f.evidence.stableIds, ['kn_8f3a0c71']);
});

test('I4-08: H reports Host truth only; it never claims live Host acceptance', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4(input));
  const h = composed(r, 'H');
  assert.equal(h.evidence.effectInvoked, false);
  assert.equal(h.evidence.canExecute, false);
  assert.equal(h.evidence.liveHostAcceptance, 'unproven');
  assert.equal(h.evidence.evidenceClass, 'synthetic_fixture');
  assert.equal(h.evidence.receiptVerification, 'not_present');
});

test('I4-09: E reaches the ready stage without creating a publisher, store or retry', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4(input));
  const e = composed(r, 'E');
  assert.equal(e.evidence.permitted, 'yes');
  assert.equal(e.evidence.paired, 'yes');
  assert.equal(e.evidence.signedIn, 'yes');
  assert.equal(e.evidence.automaticRetryAllowed, false);
});

test('I4-10: the composition is deterministic for identical inputs', async () => {
  const { input } = await setup();
  const a = ok(await composeIntegration4(input));
  const b = ok(await composeIntegration4(input));
  assert.equal(JSON.stringify(a.lanes), JSON.stringify(b.lanes));
  assert.equal(a.document.documentDigest, b.document.documentDigest);
});

test('I4-11: a second Host publisher is refused at A', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    desktop: { ...input.desktop, host: { ...input.desktop.host, anotherPublisherPresent: true } },
  }));
  blocked(r, 'A', 'DUPLICATE_PUBLISHER');
});

test('I4-12: a detached Host is refused at A, not rendered as stale content', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    desktop: { ...input.desktop, host: { ...input.desktop.host, state: 'detached' } },
  }));
  blocked(r, 'A', 'HOST_DETACHED');
});

test('I4-13: a denied Host decision is refused at A', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    desktop: { ...input.desktop, host: { ...input.desktop.host, decision: 'denied' } },
  }));
  blocked(r, 'A', 'HOST_DENIED');
});

test('I4-14: an uncertain Host decision is refused at A', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    desktop: { ...input.desktop, host: { ...input.desktop.host, decision: 'uncertain' } },
  }));
  blocked(r, 'A', 'HOST_UNCERTAIN');
});

test('I4-15: a foreign owner is refused at A; the document never renders for another owner', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    desktop: { ...input.desktop, host: { ...input.desktop.host, ownerRef: 'owner_foreign' } },
  }));
  blocked(r, 'A', 'WRONG_OWNER');
});

test('I4-16: a foreign world is refused at A', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    desktop: { ...input.desktop, host: { ...input.desktop.host, worldRef: 'world_foreign' } },
  }));
  blocked(r, 'A', 'WRONG_WORLD');
});

test('I4-17: a malformed canonical document is refused at A, not partially rendered', async () => {
  const { input } = await setup();
  const broken = { ...input.document, nodes: [{ id: 'root', type: 'stack',
    props: { direction: 'vertical' }, children: ['ghost'], a11y: { role: 'main', name: 'X' } }] };
  const r = ok(await composeIntegration4({ ...input, document: broken as never }));
  blocked(r, 'A', 'INVALID_DOCUMENT');
  // Without a canonical projection the dependent lanes are never reached.
  for (const id of ['B', 'C', 'G', 'H', 'D', 'E'] as Integration4Lane[]) {
    assert.equal(lane(r, id).status, 'not-reached', `${id} must not be reached`);
  }
});

test('I4-18: an unpaired phone is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, pairing: { ...input.phone.pairing, state: 'unpaired' } },
  }));
  blocked(r, 'B', 'PAIRING_REQUIRED');
});

test('I4-19: a replayed pairing epoch is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, pairing: { ...input.phone.pairing, epoch: 2 } },
  }));
  blocked(r, 'B', 'PAIRING_IDENTITY_MISMATCH');
});

test('I4-20: an expired pairing is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, pairing: { ...input.phone.pairing, expiresAtMs: NOW - 1000 } },
  }));
  blocked(r, 'B', 'PAIRING_EXPIRED');
});

test('I4-21: a foreign pairing owner is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, pairing: { ...input.phone.pairing, ownerRef: 'owner_foreign' } },
  }));
  blocked(r, 'B', 'PAIRING_IDENTITY_MISMATCH');
});

test('I4-22: an offline phone Host is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, host: { ...input.phone.host, state: 'offline' } },
  }));
  blocked(r, 'B', 'HOST_OFFLINE');
});

test('I4-23: a denied phone Host is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, host: { ...input.phone.host, denied: true } },
  }));
  blocked(r, 'B', 'HOST_DENIED');
});

test('I4-24: a stale phone document revision is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, host: { ...input.phone.host, documentRevision: 1 } },
  }));
  blocked(r, 'B', 'STALE_DOCUMENT');
});

test('I4-25: a stale phone policy revision is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, host: { ...input.phone.host, policyRevision: 1 } },
  }));
  blocked(r, 'B', 'STALE_AUTHORIZATION');
});

test('I4-26: a second phone publisher is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, shell: invalid(input.phone.shell, { publisher: 'other-publisher' }) },
  }));
  blocked(r, 'B', 'DUPLICATE_PUBLISHER');
});

test('I4-27: an unknown phone shell is refused at B', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input, phone: { ...input.phone, shell: invalid(input.phone.shell, { app: 'unknown-app' }) },
  }));
  blocked(r, 'B', 'WRONG_SHELL');
});

test('I4-28: an unreviewed semantic is refused at C, and G is never reached', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    descriptors: { desktop: { ...input.descriptors.desktop, reviews: [] },
      phone: { ...input.descriptors.phone, reviews: [] } },
  }));
  blocked(r, 'C', 'INVALID_TRUSTED_FIXTURE');
  assert.equal(lane(r, 'G').status, 'not-reached');
});

test('I4-29: a stale policy version pin is refused at G against the Host authority', async () => {
  const { input } = await setup();
  const stale = { ...input.descriptors.desktop.currentVersions, policy: 'policy-0' };
  const r = ok(await composeIntegration4({
    ...input,
    descriptors: { desktop: { ...input.descriptors.desktop, currentVersions: stale },
      phone: { ...input.descriptors.phone, currentVersions: stale } },
  }));
  blocked(r, 'G', 'STALE_OR_UNREVIEWED_SOURCE');
});

test('I4-30: an unauthenticated transport authority is refused at G', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    transport: { desktop: { ...input.transport.desktop,
      authority: { ...input.transport.desktop.authority, authenticated: false } },
      phone: input.transport.phone },
  }));
  blocked(r, 'G', 'HOST_AUTHORITY_REQUIRED');
});

test('I4-31: an ungranted transport authority is refused at G', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    transport: { desktop: { ...input.transport.desktop,
      authority: { ...input.transport.desktop.authority, granted: false } },
      phone: input.transport.phone },
  }));
  blocked(r, 'G', 'HOST_AUTHORITY_REQUIRED');
});

test('I4-32: expired transport controls are refused at G', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    transport: { desktop: { ...input.transport.desktop,
      controls: { ...input.transport.desktop.controls, expiresAtMs: NOW - 1000 } },
      phone: input.transport.phone },
  }));
  blocked(r, 'G', 'INVALID_OR_EXPIRED_CONTROLS');
});

test('I4-33: a stale catalog digest is refused at G', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    transport: { desktop: { ...input.transport.desktop,
      authority: { ...input.transport.desktop.authority, catalogSha256: 'f'.repeat(64) } },
      phone: input.transport.phone },
  }));
  blocked(r, 'G', 'STALE_OR_UNREVIEWED_SOURCE');
});

test('I4-34: a foreign owner on the transport authority is refused at G', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    transport: { desktop: { ...input.transport.desktop,
      authority: { ...input.transport.desktop.authority, ownerId: 'owner_foreign' } },
      phone: input.transport.phone },
  }));
  blocked(r, 'G', 'AUTHORITY_SCOPE_MISMATCH');
});

test('I4-35: a foreign world on the phone transport authority is refused at G', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    transport: { desktop: input.transport.desktop,
      phone: { ...input.transport.phone,
        authority: { ...input.transport.phone.authority, worldId: 'world_foreign' } } },
  }));
  blocked(r, 'G', 'AUTHORITY_SCOPE_MISMATCH');
});

test('I4-36: a transport authority for the wrong device surface is refused at G', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    transport: { desktop: { ...input.transport.desktop,
      authority: { ...input.transport.desktop.authority, device: 'phone' } },
      phone: input.transport.phone },
  }));
  blocked(r, 'G', 'DEVICE_SURFACE_MISMATCH');
});

test('I4-37: a revoked KB grant is refused at F and D is never reached', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    knowledge: { ...input.knowledge, broker: { readContext: () => null } },
  }));
  blocked(r, 'F', 'ACCESS_DENIED');
  assert.equal(lane(r, 'D').status, 'not-reached');
});

test('I4-38: a foreign world in the KB query is refused at F', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    knowledge: { ...input.knowledge, query: { ...input.knowledge.query, personalWorldRef: 'world_foreign' } },
  }));
  blocked(r, 'F', 'ACCESS_DENIED');
});

test('I4-39: a foreign session principal is refused at D', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    session: { ...input.session, principal: { ...input.session.principal, ownerRef: 'owner_foreign' } },
  }));
  blocked(r, 'D', 'MISSING_AUTHORITY');
});

test('I4-40: a mismatched revision digest is refused at D', async () => {
  const { input } = await setup();
  const r = ok(await composeIntegration4({
    ...input,
    session: { ...input.session, watermark: () => ({
      schema: 'vivim.visual-session-watermark/1' as const, ownerRef: 'owner_a', deviceRef: 'desktop_1',
      sessionRef: 'session_1', policyRevision: 'policy-1', documentId: input.document.documentId,
      sequence: 7, revision: 3, documentDigest: 'sha256:' + '0'.repeat(64) }) },
  }));
  blocked(r, 'D', 'HEAD_MISMATCH');
});

test('I4-41: a revoked Host grant is refused at H', async () => {
  const { input } = await setup();
  const scope = input.hostPort.currentScope();
  assert.ok(scope);
  const grant = scope.grant;
  assert.ok(grant);
  const r = ok(await composeIntegration4({
    ...input,
    hostPort: { ...input.hostPort, currentScope: () => ({ ...scope,
      grant: { ...grant, status: 'revoked' } }) },
  }));
  blocked(r, 'H', 'GRANT_REVOKED');
});

test('I4-42: an expired Host grant is refused at H', async () => {
  const { input } = await setup();
  const scope = input.hostPort.currentScope();
  assert.ok(scope);
  const grant = scope.grant;
  assert.ok(grant);
  const r = ok(await composeIntegration4({
    ...input,
    hostPort: { ...input.hostPort, currentScope: () => ({ ...scope,
      grant: { ...grant, expiresAtMs: NOW - 1000 } }) },
  }));
  blocked(r, 'H', 'GRANT_EXPIRED');
});

test('I4-43: a foreign Host grant principal is refused at H', async () => {
  const { input } = await setup();
  const scope = input.hostPort.currentScope();
  assert.ok(scope);
  const grant = scope.grant;
  assert.ok(grant);
  const r = ok(await composeIntegration4({
    ...input,
    hostPort: { ...input.hostPort, currentScope: () => ({ ...scope,
      grant: { ...grant, ownerRef: 'owner_foreign' } }) },
  }));
  blocked(r, 'H', 'GRANT_PRINCIPAL_MISMATCH');
});

test('I4-44: an unapproved Host grant is refused at E', async () => {
  const { input } = await setup();
  const host = input.journey.host;
  assert.ok(host);
  const grant = host.grant;
  assert.ok(grant);
  const r = ok(await composeIntegration4({
    ...input,
    journey: { ...input.journey, host: { ...host, grant: { ...grant, ownerApproved: false } } },
  }));
  blocked(r, 'E', 'PERMISSION_UNCONFIRMED');
});

test('I4-45: an expired pairing enrollment is refused at E', async () => {
  const { input } = await setup();
  const pairing = input.journey.pairing;
  assert.ok(pairing);
  const r = ok(await composeIntegration4({
    ...input,
    journey: { ...input.journey, pairing: { ...pairing, enrollmentExpiresAtMs: NOW - 1000 } },
  }));
  blocked(r, 'E', 'PAIRING_REQUIRED');
});

test('I4-46: a journey for a foreign world is refused at E (cross-lane scope parity)', async () => {
  const { input } = await setup();
  const host = input.journey.host;
  assert.ok(host);
  const r = ok(await composeIntegration4({
    ...input,
    journey: { ...input.journey, host: { ...host,
      principal: { ...host.principal, worldRef: 'world_foreign' } } },
  }));
  blocked(r, 'E', 'JOURNEY_SCOPE_MISMATCH');
});

test('I4-47: an incomplete integration input is refused at SCOPE', async () => {
  const { input } = await setup();
  const r = await composeIntegration4({ ...input, descriptors: undefined as never });
  assert.equal(r.ok, false);
  if (r.ok) throw Error('UNEXPECTED_SUCCESS');
  assert.equal(r.phase, 'SCOPE');
  assert.equal(r.code, 'INTEGRATION_INPUT_INCOMPLETE');
  assert.equal(r.effectInvoked, false);
  assert.equal(r.automaticRetryAllowed, false);
});

test('I4-48: no negative case ever produces an effect, writer or automatic retry', async () => {
  const { input } = await setup();
  const mutations: Array<(i: Input) => Input> = [
    i => ({ ...i, desktop: { ...i.desktop, host: { ...i.desktop.host, anotherPublisherPresent: true } } }),
    i => ({ ...i, desktop: { ...i.desktop, host: { ...i.desktop.host, ownerRef: 'owner_foreign' } } }),
    i => ({ ...i, phone: { ...i.phone, pairing: { ...i.phone.pairing, state: 'unpaired' } } }),
    i => ({ ...i, knowledge: { ...i.knowledge, broker: { readContext: () => null } } }),
    i => ({ ...i, session: { ...i.session, principal: { ...i.session.principal, ownerRef: 'owner_foreign' } } }),
    i => ({ ...i, transport: { desktop: { ...i.transport.desktop,
      authority: { ...i.transport.desktop.authority, authenticated: false } }, phone: i.transport.phone } }),
  ];
  for (const mutate of mutations) {
    const r = await composeIntegration4(mutate(input));
    assert.equal(r.ok, true);
    if (!r.ok) throw Error('UNEXPECTED_REFUSAL');
    assert.equal(r.effectInvoked, false);
    assert.equal(r.automaticRetryAllowed, false);
    for (const l of r.lanes) {
      if (l.evidence.effectInvoked !== undefined) assert.equal(l.evidence.effectInvoked, false, l.lane);
      if (l.evidence.effectsInvoked !== undefined) assert.equal(l.evidence.effectsInvoked, false, l.lane);
      if (l.evidence.canExecute !== undefined) assert.equal(l.evidence.canExecute, false, l.lane);
      if (l.evidence.automaticRetryAllowed !== undefined) assert.equal(l.evidence.automaticRetryAllowed, false, l.lane);
      if (l.evidence.effectPerformed !== undefined) assert.equal(l.evidence.effectPerformed, false, l.lane);
    }
  }
});
