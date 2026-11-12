import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UI_DOCUMENT_SCHEMA } from '../../src/visual-runtime/document/schema.ts';
import { validateUiDocument } from '../../src/visual-runtime/document/validate.ts';
import { renderWave3Semantics } from '../../src/visual-runtime/render/wave3-semantics.ts';
import { projectWave4DesktopAdapter, resizeWave4DesktopAdapter,
  WAVE4_DESKTOP_ADAPTER_SCHEMA, type DesktopAdapterRequest } from '../../src/visual-runtime/device/wave4-desktop-adapter.ts';

const action = { id: 'fixture.preview', version: 2 } as const;
const pin = { id: 'bind.note', version: 3, nodeId: 'panel', knowledgeRef: 'kb.note', provenanceRef: 'source.opaque' } as const;
function documentFixture(): Record<string, any> {
  return {
    schema: UI_DOCUMENT_SCHEMA, documentId: 'doc.founder', scope: { ownerRef: 'owner:a', workspaceRef: 'world:a' },
    revision: 4, rootId: 'root', nodes: [
      { id: 'root', type: 'stack', props: { direction: 'vertical', gap: 'md' }, children: ['panel', 'button:preview'],
        a11y: { role: 'main', name: 'Founder Workspace' } },
      { id: 'panel', type: 'card', props: { title: 'Today', description: 'Source-backed note' }, children: [],
        a11y: { role: 'region', name: 'Today' }, bindingRefs: ['bind.note'] },
      { id: 'button:preview', type: 'button', props: { label: 'Preview' }, children: [],
        a11y: { role: 'button', name: 'Preview', focusOrder: 1 }, actionRefs: [{ ...action }] },
    ],
    bindings: [{ ...pin, field: 'title', readScope: 'owner', availability: 'present' }],
    views: [{ id: 'desktop', kind: '2d', version: 1, viewport: 'desktop' },
      { id: 'phone', kind: '2d', version: 1, viewport: 'phone' }],
  };
}
function request(overrides: Partial<DesktopAdapterRequest> = {}): DesktopAdapterRequest {
  return {
    document: documentFixture(),
    semantics: { expectedRevision: 4, knownActions: [action], knownBindings: [pin] },
    host: { state: 'connected', ownerRef: 'owner:a', worldRef: 'world:a',
      decision: 'read-only', publisher: 'harness', anotherPublisherPresent: false },
    viewportPx: 1280, lastDisplayedRevision: 3,
    ...overrides,
  };
}
function ready(value = request()) {
  const r = projectWave4DesktopAdapter(value);
  // Capture the refusal before the assertion narrows `r` to its ok-branch.
  const refusal = r.ok ? null : r;
  assert.equal(r.ok, true, JSON.stringify(r));
  if (!r.ok) throw new Error(`Expected projection: ${refusal?.code}`);
  return r.view;
}
function refusal(code: string, value: DesktopAdapterRequest) {
  const r = projectWave4DesktopAdapter(value);
  assert.equal(r.ok, false, JSON.stringify(r));
  if (r.ok) throw new Error('Expected safe refusal');
  assert.equal(r.code, code);
  assert.equal(r.readOnly, true);
  assert.equal(r.effectsInvoked, false);
  assert.deepEqual(r.safePlan.focusOrder, []);
  assert.equal(r.safePlan.status, 'unavailable');
  assert.equal(r.focusReturnId, 'main');
  assert.equal(r.retry, 'manual-status-check-or-resnapshot');
  assert.equal(JSON.stringify(r).includes('source.opaque'), false);
  return r;
}

test('A01 — real Wave3 A/D validates and projects an inert Founder Workspace into the existing Tauri Host shell', () => {
  assert.equal(validateUiDocument(documentFixture(), { knownActions: [action] }).ok, true);
  const d = renderWave3Semantics(documentFixture(), { viewportPx: 1280, knownActions: [action] });
  assert.equal(d.status, 'ok');
  const v = ready();
  assert.equal(v.schema, WAVE4_DESKTOP_ADAPTER_SCHEMA);
  assert.deepEqual(v.native, { window: 'main', existingMountId: 'world-view', webview: 'existing-vivim-host',
    existingPublisher: 'harness', publish: false, newStore: false, effects: false });
  assert.equal(v.plan.root.tag, 'main');
  assert.equal(Object.isFrozen(v.plan.root), true);
  assert.equal(v.plan.documentId, 'doc.founder');
  assert.equal(v.identity.revision, 4);
  assert.equal(v.identity.ownerRef, 'owner:a');
  assert.equal(v.identity.worldRef, 'world:a');
  assert.match(v.identity.documentDigest, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(v.focus.order, ['button:preview']);
  assert.equal(v.focus.escape, 'return-to-existing-shell');
  assert.equal(v.focus.trapped, false);
  assert.equal(v.provenance.bindingCount, 1);
  assert.equal(v.provenance.authorizedByRenderer, false);
  assert.equal(v.references.length, 2);
  assert.ok(v.references.every(r => r.inert && /^[ab]_[a-f0-9]{32}$/.test(r.alias)));
  assert.equal(v.effectsInvoked, false);
  const serializedView = JSON.stringify(v);
  for (const forbidden of ['source.opaque', 'kb.note', 'fixture.preview', 'onclick', 'javascript:', 'owner-token', 'control-session=']) {
    assert.equal(serializedView.includes(forbidden), false, `Must not expose ${forbidden}`);
  }
});

test('A02 — 320/360/1280 resize recomputes real D plans while preserving identity, focus and evidence aliases', () => {
  const widths = [320, 360, 1280];
  const views = widths.map(width => {
    const r = resizeWave4DesktopAdapter(request(), width);
    assert.equal(r.ok, true, JSON.stringify(r));
    if (!r.ok) throw Error('Projection unavailable');
    return r.view;
  });
  for (const [i, view] of views.entries()) assert.equal(view.plan.viewportPx, widths[i]);
  assert.deepEqual(views.map(v => v.identity.documentDigest), Array(3).fill(views[0]!.identity.documentDigest));
  assert.deepEqual(views.map(v => v.focus.order), Array(3).fill(['button:preview']));
  assert.deepEqual(views.map(v => v.references), Array(3).fill(views[0]!.references));
  assert.equal(resizeWave4DesktopAdapter(request(), 200).ok, false);
});

test('A03 — detached Host tombstones prior view, no cached founder content or phantom success', () => {
  const v = request();
  const r = refusal('HOST_DETACHED', { ...v, host: { ...v.host, state: 'detached' } });
  assert.match(r.notice, /disconnected/i);
  assert.equal(JSON.stringify(r).includes('Source-backed note'), false);
});

test('A04 — foreign world and owner are not accepted as the same display principal', () => {
  const v = request();
  refusal('WRONG_WORLD', { ...v, host: { ...v.host, worldRef: 'world:foreign' } });
  refusal('WRONG_OWNER', { ...v, host: { ...v.host, ownerRef: 'owner:foreign' } });
});

test('A05 — stale revision, invalid expected revision and feed gap fail closed', () => {
  refusal('STALE_REVISION', { ...request(), lastDisplayedRevision: 5 });
  refusal('RESNAPSHOT_REQUIRED', { ...request(), lastDisplayedRevision: 1 });
  refusal('CANONICAL_REFUSED', { ...request(), semantics: { expectedRevision: 3, knownActions: [action], knownBindings: [pin] } });
});

test('A06 — denied, uncertain or spoofed success never upgrades a display to Host authorization', () => {
  const v = request();
  const denied = refusal('HOST_DENIED', { ...v, host: { ...v.host, decision: 'denied' } });
  assert.match(denied.notice, /denied/i);
  refusal('HOST_UNCERTAIN', { ...v, host: { ...v.host, decision: 'uncertain' } });
  refusal('INVALID_SHELL_CONTEXT', { ...v, host: { ...v.host, decision: 'applied' } as unknown as DesktopAdapterRequest['host'] });
});

test('A07 — inaccessible focus order is refused by real D renderer; no keyboard trap', () => {
  const doc = documentFixture();
  doc.nodes.push({ id: 'button:second', type: 'button', props: { label: 'Second preview' }, children: [],
    a11y: { role: 'button', name: 'Second preview', focusOrder: 0 }, actionRefs: [{ ...action }] });
  doc.nodes[0].children.push('button:second');
  refusal('RENDER_REFUSED', { ...request(), document: doc });
});

test('A08 — script, handler and URL injection never enter a shell render plan', () => {
  for (const payload of ['<img src=x onerror=alert(1)>', 'javascript:alert(1)']) {
    const doc = documentFixture();
    doc.nodes[1].props.description = payload;
    refusal('CANONICAL_REFUSED', { ...request(), document: doc });
  }
  const withHandler = documentFixture();
  withHandler.nodes[2].props.onclick = 'alert(1)';
  refusal('CANONICAL_REFUSED', { ...request(), document: withHandler });
});

test('A09 — presence of second publisher refuses; adapter itself never publishes or opens a store', () => {
  const v = request();
  refusal('DUPLICATE_PUBLISHER', { ...v, host: { ...v.host, anotherPublisherPresent: true } });
  const readyView = ready(v);
  assert.equal(readyView.native.publish, false);
  assert.equal(readyView.native.newStore, false);
});

test('A10 — same-revision restart replay is explicitly idempotent, not another write', () => {
  const view = ready({ ...request(), lastDisplayedRevision: 4 });
  assert.equal(view.identity.replayed, true);
  assert.equal(view.native.publish, false);
  const fresh = ready({ ...request(), lastDisplayedRevision: null });
  assert.equal(fresh.identity.replayed, false);
});

test('A11 — revoked or spoofed provenance never enters the desktop shell', () => {
  const doc = documentFixture();
  doc.bindings[0].availability = 'revoked';
  refusal('CANONICAL_REFUSED', { ...request(), document: doc });
  const spoofed = documentFixture();
  spoofed.bindings[0].provenanceRef = 'source.forged';
  refusal('CANONICAL_REFUSED', { ...request(), document: spoofed });
});

test('A12 — malformed Host snapshot with getter cannot execute injected code', () => {
  const host = { ...request().host } as Record<string, unknown>;
  Object.defineProperty(host, 'decision', { enumerable: true, get() { throw new Error('getter executed'); } });
  refusal('INVALID_SHELL_CONTEXT', { ...request(), host: host as unknown as DesktopAdapterRequest['host'] });
});
