# File: packages/tierflow/tests/visual-runtime/integration-4/compose.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/integration-4/compose.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 25199 B |
| Lines | 590 |
| Hash | 2a2fa236069b |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Result | type | 21 | no | type Result = Awaited&lt;ReturnType&lt;typeof composeIntegration4&gt;&gt;; |
| Input | type | 22 | no | type Input = Integration4Input; |
| ok | function | 24 | no | function ok(result: Result) { |
| refusal | const | 25 | no | const refusal = result.ok ? null : result; |
| lane | function | 30 | no | function lane(result: Result, id: Integration4Lane) { |
| found | const | 31 | no | const found = result.ok ? result.lanes.find(l =&gt; l.lane === id) : undefined; |
| composed | function | 35 | no | function composed(result: Result, id: Integration4Lane) { |
| l | const | 36 | no | const l = lane(result, id); |
| blocked | function | 40 | no | function blocked(result: Result, id: Integration4Lane, code?: string) { |
| l | const | 41 | no | const l = lane(result, id); |
| invalid | function | 52 | no | function invalid&lt;T&gt;(base: T, patch: Record&lt;string, unknown&gt;): T { |
| r | const | 58 | no | const r = ok(await composeIntegration4(input)); |
| f | const | 66 | no | const f = composed(r, &#39;F&#39;); |
| a | const | 70 | no | const a = composed(r, &#39;A&#39;); |
| r | const | 78 | no | const r = ok(await composeIntegration4(input)); |
| b | const | 82 | no | const b = composed(r, &#39;B&#39;); |
| r | const | 94 | no | const r = ok(await composeIntegration4(input)); |
| patch | const | 96 | no | const patch = laneBRepairPatch(); |
| source | const | 101 | no | const source = readFileSync(new URL( &#39;../../../src/visual-runtime/device/wave4-phone-adapter.ts&#39;, import.meta.url), &#39;utf8&#39;); |
| r | const | 111 | no | const r = ok(await composeIntegration4(input)); |
| r | const | 127 | no | const r = ok(await composeIntegration4(input)); |
| c | const | 128 | no | const c = composed(r, &#39;C&#39;); |
| g | const | 129 | no | const g = composed(r, &#39;G&#39;); |
| r | const | 141 | no | const r = ok(await composeIntegration4(input)); |
| g | const | 142 | no | const g = composed(r, &#39;G&#39;); |
| r | const | 153 | no | const r = ok(await composeIntegration4(input)); |
| f | const | 154 | no | const f = composed(r, &#39;F&#39;); |
| d | const | 155 | no | const d = composed(r, &#39;D&#39;); |
| r | const | 164 | no | const r = ok(await composeIntegration4(input)); |
| h | const | 165 | no | const h = composed(r, &#39;H&#39;); |
| r | const | 175 | no | const r = ok(await composeIntegration4(input)); |
| e | const | 176 | no | const e = composed(r, &#39;E&#39;); |
| a | const | 185 | no | const a = ok(await composeIntegration4(input)); |
| b | const | 186 | no | const b = ok(await composeIntegration4(input)); |
| r | const | 193 | no | const r = ok(await composeIntegration4({ ...input, desktop: { ...input.desktop, host: { ...input.desktop.host, anotherPublisherPresent: true } }, })); |
| r | const | 202 | no | const r = ok(await composeIntegration4({ ...input, desktop: { ...input.desktop, host: { ...input.desktop.host, state: &#39;detached&#39; } }, })); |
| r | const | 211 | no | const r = ok(await composeIntegration4({ ...input, desktop: { ...input.desktop, host: { ...input.desktop.host, decision: &#39;denied&#39; } }, })); |
| r | const | 220 | no | const r = ok(await composeIntegration4({ ...input, desktop: { ...input.desktop, host: { ...input.desktop.host, decision: &#39;uncertain&#39; } }, })); |
| r | const | 229 | no | const r = ok(await composeIntegration4({ ...input, desktop: { ...input.desktop, host: { ...input.desktop.host, ownerRef: &#39;owner_foreign&#39; } }, })); |
| r | const | 238 | no | const r = ok(await composeIntegration4({ ...input, desktop: { ...input.desktop, host: { ...input.desktop.host, worldRef: &#39;world_foreign&#39; } }, })); |
| broken | const | 247 | no | const broken = { ...input.document, nodes: [{ id: &#39;root&#39;, type: &#39;stack&#39;, |
| r | const | 249 | no | const r = ok(await composeIntegration4({ ...input, document: broken as never })); |
| r | const | 259 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, pairing: { ...input.phone.pairing, state: &#39;unpaired&#39; } }, })); |
| r | const | 267 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, pairing: { ...input.phone.pairing, epoch: 2 } }, })); |
| r | const | 275 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, pairing: { ...input.phone.pairing, expiresAtMs: NOW - 1000 } }, })); |
| r | const | 283 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, pairing: { ...input.phone.pairing, ownerRef: &#39;owner_foreign&#39; } }, })); |
| r | const | 291 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, host: { ...input.phone.host, state: &#39;offline&#39; } }, })); |
| r | const | 299 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, host: { ...input.phone.host, denied: true } }, })); |
| r | const | 307 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, host: { ...input.phone.host, documentRevision: 1 } }, })); |
| r | const | 315 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, host: { ...input.phone.host, policyRevision: 1 } }, })); |
| r | const | 323 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, shell: invalid(input.phone.shell, { publisher: &#39;other-publisher&#39; }) }, })); |
| r | const | 331 | no | const r = ok(await composeIntegration4({ ...input, phone: { ...input.phone, shell: invalid(input.phone.shell, { app: &#39;unknown-app&#39; }) }, })); |
| r | const | 339 | no | const r = ok(await composeIntegration4({ ...input, descriptors: { desktop: { ...input.descriptors.desktop, reviews: [] }, phone: { ...input.descriptors.phone, reviews: [] } }, })); |
| stale | const | 350 | no | const stale = { ...input.descriptors.desktop.currentVersions, policy: &#39;policy-0&#39; }; |
| r | const | 351 | no | const r = ok(await composeIntegration4({ ...input, descriptors: { desktop: { ...input.descriptors.desktop, currentVersions: stale }, phone: { ...input.descriptors.phone, currentVersions: stale } }, }… |
| r | const | 361 | no | const r = ok(await composeIntegration4({ ...input, transport: { desktop: { ...input.transport.desktop, authority: { ...input.transport.desktop.authority, authenticated: false } }, phone: input.transp… |
| r | const | 372 | no | const r = ok(await composeIntegration4({ ...input, transport: { desktop: { ...input.transport.desktop, authority: { ...input.transport.desktop.authority, granted: false } }, phone: input.transport.ph… |
| r | const | 383 | no | const r = ok(await composeIntegration4({ ...input, transport: { desktop: { ...input.transport.desktop, controls: { ...input.transport.desktop.controls, expiresAtMs: NOW - 1000 } }, phone: input.trans… |
| r | const | 394 | no | const r = ok(await composeIntegration4({ ...input, transport: { desktop: { ...input.transport.desktop, authority: { ...input.transport.desktop.authority, catalogSha256: &#39;f&#39;.repeat(64) } }, phone: inp… |
| r | const | 405 | no | const r = ok(await composeIntegration4({ ...input, transport: { desktop: { ...input.transport.desktop, authority: { ...input.transport.desktop.authority, ownerId: &#39;owner_foreign&#39; } }, phone: input.tr… |
| r | const | 416 | no | const r = ok(await composeIntegration4({ ...input, transport: { desktop: input.transport.desktop, phone: { ...input.transport.phone, authority: { ...input.transport.phone.authority, worldId: &#39;world_f… |
| r | const | 427 | no | const r = ok(await composeIntegration4({ ...input, transport: { desktop: { ...input.transport.desktop, authority: { ...input.transport.desktop.authority, device: &#39;phone&#39; } }, phone: input.transport.p… |
| r | const | 438 | no | const r = ok(await composeIntegration4({ ...input, knowledge: { ...input.knowledge, broker: { readContext: () =&gt; null } }, })); |
| r | const | 448 | no | const r = ok(await composeIntegration4({ ...input, knowledge: { ...input.knowledge, query: { ...input.knowledge.query, personalWorldRef: &#39;world_foreign&#39; } }, })); |
| r | const | 457 | no | const r = ok(await composeIntegration4({ ...input, session: { ...input.session, principal: { ...input.session.principal, ownerRef: &#39;owner_foreign&#39; } }, })); |
| r | const | 466 | no | const r = ok(await composeIntegration4({ ...input, session: { ...input.session, watermark: () =&gt; ({ schema: &#39;vivim.visual-session-watermark/1&#39; as const, ownerRef: &#39;owner_a&#39;, deviceRef: &#39;desktop_1&#39;, s… |
| scope | const | 478 | no | const scope = input.hostPort.currentScope(); |
| grant | const | 480 | no | const grant = scope.grant; |
| r | const | 482 | no | const r = ok(await composeIntegration4({ ...input, hostPort: { ...input.hostPort, currentScope: () =&gt; ({ ...scope, grant: { ...grant, status: &#39;revoked&#39; } }) }, })); |
| scope | const | 492 | no | const scope = input.hostPort.currentScope(); |
| grant | const | 494 | no | const grant = scope.grant; |
| r | const | 496 | no | const r = ok(await composeIntegration4({ ...input, hostPort: { ...input.hostPort, currentScope: () =&gt; ({ ...scope, grant: { ...grant, expiresAtMs: NOW - 1000 } }) }, })); |
| scope | const | 506 | no | const scope = input.hostPort.currentScope(); |
| grant | const | 508 | no | const grant = scope.grant; |
| r | const | 510 | no | const r = ok(await composeIntegration4({ ...input, hostPort: { ...input.hostPort, currentScope: () =&gt; ({ ...scope, grant: { ...grant, ownerRef: &#39;owner_foreign&#39; } }) }, })); |
| host | const | 520 | no | const host = input.journey.host; |
| grant | const | 522 | no | const grant = host.grant; |
| r | const | 524 | no | const r = ok(await composeIntegration4({ ...input, journey: { ...input.journey, host: { ...host, grant: { ...grant, ownerApproved: false } } }, })); |
| pairing | const | 533 | no | const pairing = input.journey.pairing; |
| r | const | 535 | no | const r = ok(await composeIntegration4({ ...input, journey: { ...input.journey, pairing: { ...pairing, enrollmentExpiresAtMs: NOW - 1000 } }, })); |
| host | const | 544 | no | const host = input.journey.host; |
| r | const | 546 | no | const r = ok(await composeIntegration4({ ...input, journey: { ...input.journey, host: { ...host, principal: { ...host.principal, worldRef: &#39;world_foreign&#39; } } }, })); |
| r | const | 556 | no | const r = await composeIntegration4({ ...input, descriptors: undefined as never }); |
| mutations | const | 567 | no | const mutations: Array&lt;(i: Input) =&gt; Input&gt; = [ |
| r | const | 577 | no | const r = await composeIntegration4(mutate(input)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 15 | external |
| node:assert/strict | import | 16 | external |
| node:fs | import | 17 | external |
| ../../../src/visual-runtime/integration-4/compose.ts | import | 18 | [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../../../src/visual-runtime/integration-4/compose.ts.md) |
| ./fixture.ts | import | 19 | [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](./fixture.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 591 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
