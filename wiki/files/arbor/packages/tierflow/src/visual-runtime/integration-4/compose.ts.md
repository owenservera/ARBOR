# File: packages/tierflow/src/visual-runtime/integration-4/compose.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/integration-4/compose.ts |
| Language | TypeScript |
| Kind | source |
| Size | 29365 B |
| Lines | 500 |
| Hash | ecfbbf5ba4e8 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ID | const | 43 | no | const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| Integration4Lane | type | 45 | yes | export type Integration4Lane = &#39;F&#39; \| &#39;A&#39; \| &#39;B&#39; \| &#39;C&#39; \| &#39;G&#39; \| &#39;H&#39; \| &#39;D&#39; \| &#39;E&#39;; |
| Integration4Phase | type | 46 | yes | export type Integration4Phase = Integration4Lane \| &#39;SCOPE&#39;; |
| Integration4Surface | type | 48 | yes | export type Integration4Surface = &#39;desktop&#39; \| &#39;phone&#39;; |
| Integration4Defect | interface | 51 | yes | export interface Integration4Defect { |
| Integration4LaneReport | interface | 61 | yes | export interface Integration4LaneReport { |
| Integration4Result | type | 70 | yes | export type Integration4Result = |
| Integration4Input | interface | 83 | yes | export interface Integration4Input { |
| refuse | function | 123 | no | const refuse = (phase: Integration4Phase, code: string): Integration4Result =&gt; |
| identityKey | function | 126 | no | function identityKey(nodeId: string, id: string, version: number): string { |
| canonicalIdentities | function | 131 | no | function canonicalIdentities(document: UiDocument): { actions: string[]; bindings: string[] } { |
| actions | const | 132 | no | const actions: string[] = []; |
| bindings | const | 133 | no | const bindings: string[] = []; |
| binding | const | 137 | no | const binding = document.bindings.find(b =&gt; b.id === bindingId); |
| sameKnowledgeRows | function | 145 | no | function sameKnowledgeRows(a: ScopedFeedResult \| null, b: DeviceKnowledgeSnapshot): boolean { |
| left | const | 147 | no | const left = a.cards.map(c =&gt; c.stableId).sort(); |
| right | const | 148 | no | const right = b.cards.map(c =&gt; c.stableId).sort(); |
| composeIntegration4 | function | 157 | yes | export async function composeIntegration4(input: Integration4Input): Promise&lt;Integration4Result&gt; { |
| document | const | 168 | no | const document = input.document; |
| lanes | const | 173 | no | const lanes: Integration4LaneReport[] = []; |
| defects | const | 174 | no | const defects: Integration4Defect[] = []; |
| order | const | 175 | no | const order: Integration4Lane[] = [&#39;F&#39;, &#39;A&#39;, &#39;B&#39;, &#39;C&#39;, &#39;G&#39;, &#39;H&#39;, &#39;D&#39;, &#39;E&#39;]; |
| status | const | 179 | no | const status = new Map&lt;Integration4Lane, Integration4LaneReport[&#39;status&#39;]&gt;(); |
| report | function | 180 | no | const report = (lane: Integration4Lane, state: Integration4LaneReport[&#39;status&#39;], code: string \| null, evidence: Integration4LaneReport[&#39;evidence&#39;] = {}): void =&gt; { |
| block | function | 185 | no | const block = (lane: Integration4Lane, code: string, evidence: Integration4LaneReport[&#39;evidence&#39;] = {}): void =&gt; { |
| documentDigest | variable | 190 | no | let documentDigest = &#39;&#39;; |
| snapshotAdapter | const | 193 | no | const snapshotAdapter = createDeviceKnowledgeSnapshotAdapter( input.knowledge.feed, input.knowledge.broker, { surface: input.knowledge.query.surface === &#39;android&#39; ? &#39;android&#39; : &#39;pc&#39;, now: input.now ?… |
| snapshot | const | 197 | no | const snapshot: DeviceKnowledgeSnapshot = await snapshotAdapter.resnapshot(input.knowledge.query); |
| semantics | const | 208 | no | const semantics = { expectedRevision: document.revision, knownActions: input.pins.actions, |
| desktopRequest | const | 210 | no | const desktopRequest: DesktopAdapterRequest = { |
| desktop | const | 214 | no | const desktop = projectWave4DesktopAdapter(desktopRequest); |
| canonical | const | 215 | no | const canonical = projectWave3ActionSemantics(document, semantics); |
| identities | const | 223 | no | const identities = canonicalIdentities(document); |
| phoneViewport | const | 234 | no | const phoneViewport = input.phone.shell.viewportPx; |
| phoneRendered | const | 235 | no | const phoneRendered = renderWave3Semantics(canonical.value.canonical, { viewportPx: phoneViewport, knownActions: input.pins.actions, }); |
| phone | const | 238 | no | const phone: PhoneProjection = projectWave4PhoneAdapter({ canonical: document, rendered: phoneRendered, shell: input.phone.shell, pairing: input.phone.pairing, host: input.phone.host, }); |
| rootDiverged | const | 243 | no | const rootDiverged = phoneRendered.plan.root.id !== document.rootId; |
| surfaces | const | 274 | no | const surfaces: Integration4Surface[] = [&#39;desktop&#39;, &#39;phone&#39;]; |
| candidates | const | 275 | no | const candidates = new Map&lt;Integration4Surface, { commandId: string; semanticId: string; risk: string; actionId: string }&gt;(); |
| cBlocked | variable | 276 | no | let cBlocked: string \| null = null; |
| componentMap | function | 278 | no | const componentMap: CanonicalComponentProjection \| null = (() =&gt; { const mapped = mapCanonicalComponents(document, { knownActions: input.pins.actions }); return mapped.ok ? mapped.value : null; })(); |
| mapped | const | 279 | no | const mapped = mapCanonicalComponents(document, { knownActions: input.pins.actions }); |
| mapped | const | 283 | no | const mapped = mapCanonicalComponents(document, { knownActions: input.pins.actions }); |
| map | const | 286 | no | const map = componentMap!; |
| controls | const | 287 | no | const controls: TrustedControlBinding[] = map.focusOrder.map(componentId =&gt; { const source = map.sourceRefs.find(r =&gt; r.id === componentId)!; const action = map.actionRefs.find(r =&gt; r.sourceNodeId ==… |
| source | const | 288 | no | const source = map.sourceRefs.find(r =&gt; r.id === componentId)!; |
| action | const | 289 | no | const action = map.actionRefs.find(r =&gt; r.sourceNodeId === source.sourceId)!; |
| review | const | 290 | no | const review = input.descriptors[surface].reviews.find(r =&gt; r.actionId === action.id); |
| deviceContext | const | 299 | no | const deviceContext: DeviceInputContext = { |
| commandId | const | 305 | no | const commandId = `i4_${surface}_1`; |
| normalized | const | 306 | no | const normalized = normalizeWave4DeviceInput({ schema: &#39;vivim.wave4-device-input/1&#39;, device: surface, viewportPx: surface === &#39;phone&#39; ? phoneViewport : 1280, expectedRevision: document.revision, expe… |
| desktopCandidate | const | 327 | no | const desktopCandidate = candidates.get(&#39;desktop&#39;)!; |
| phoneCandidate | const | 328 | no | const phoneCandidate = candidates.get(&#39;phone&#39;)!; |
| gBlocked | variable | 343 | no | let gBlocked: string \| null = null; |
| gEvidence | const | 344 | no | const gEvidence: Record&lt;string, string \| number \| boolean \| readonly string[]&gt; = {}; |
| candidate | const | 346 | no | const candidate = candidates.get(surface)!; |
| proof | const | 347 | no | const proof: DescriptorProofResult = compileDescriptorProof( { commandId: candidate.commandId, source: { surface: &#39;touch&#39;, inputDigest: &#39;a&#39;.repeat(64) }, selection: { semanticId: candidate.semanticId… |
| authority | const | 360 | no | const authority = input.transport[surface].authority; |
| staged | const | 365 | no | const staged = stageTypedCandidate(proof, authority, input.transport[surface].controls); |
| envelope | const | 367 | no | const envelope = staged.envelope; |
| revalidated | const | 368 | no | const revalidated = validateTypedEnvelope(envelope, input.transport[surface].authority); |
| host | const | 387 | no | const host: Wave4HostStatus = createWave4HostStatusContract(input.hostPort).readStatus(input.hostQuery); |
| reconciler | const | 406 | no | const reconciler: SessionReconciler = createWave4SessionReconciler({ documentId: document.documentId, revisionPort: { readCurrent: (p, id) =&gt; input.session.readCurrent(p, id) as never, getCommandOutc… |
| session | const | 421 | no | const session: SessionView = await reconciler.reconnect(); |
| telemetry | const | 427 | no | const telemetry = reconciler.telemetry(); |
| journey | const | 435 | no | const journey: Wave4OnboardingView = projectWave4OnboardingResume({ ...input.journey, founder: input.founder, hostRead: input.hostRead, principal: { ownerRef: document.scope.ownerRef, worldRef: docum… |
| journeyHost | const | 444 | no | const journeyHost = input.journey.host; |
| journeyPairing | const | 445 | no | const journeyPairing = input.journey.pairing; |
| scopeMismatch | const | 446 | no | const scopeMismatch = (journeyHost?.principal?.worldRef !== document.scope.workspaceRef) \|\| |
| finish | function | 473 | no | function finish(): Integration4Result { |
| laneBRepairPatch | function | 496 | yes | export function laneBRepairPatch(): string { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../document/schema.ts | import | 26 | [packages/tierflow/src/visual-runtime/document/schema.ts](../document/schema.ts.md) |
| ../document/wave3-action-semantics.ts | import | 27 | [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](../document/wave3-action-semantics.ts.md) |
| ../components/wave3-canonical-map.ts | import | 28 | [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](../components/wave3-canonical-map.ts.md) |
| ../render/wave3-semantics.ts | import | 29 | [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../render/wave3-semantics.ts.md) |
| ../command/wave3-descriptor-proof.ts | import | 30 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../command/wave3-descriptor-proof.ts.md) |
| ../device/wave4-desktop-adapter.ts | import | 31 | [packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts](../device/wave4-desktop-adapter.ts.md) |
| ../device/wave4-phone-adapter.ts | import | 32 | [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../device/wave4-phone-adapter.ts.md) |
| ../input/wave4-device-semantics.ts | import | 33 | [packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts](../input/wave4-device-semantics.ts.md) |
| ../revisions/wave4-session-reconcile.ts | import | 34 | [packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts](../revisions/wave4-session-reconcile.ts.md) |
| ../experience/wave4-onboarding-resume.ts | import | 35 | [packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts](../experience/wave4-onboarding-resume.ts.md) |
| ../knowledge/wave4-device-snapshot-adapter.ts | import | 36 | [packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts](../knowledge/wave4-device-snapshot-adapter.ts.md) |
| ../command/wave4-typed-transport-adapter.ts | import | 37 | [packages/tierflow/src/visual-runtime/command/wave4-typed-transport-adapter.ts](../command/wave4-typed-transport-adapter.ts.md) |
| ../host/wave4-h-host-status-contract.ts | import | 38 | [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](../host/wave4-h-host-status-contract.ts.md) |
| ../knowledge/wave3-feed-projection.ts | import | 39 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../knowledge/wave3-feed-projection.ts.md) |
| ../knowledge/client.ts | import | 40 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../knowledge/client.ts.md) |
| ../revisions/port.ts | import | 41 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../revisions/port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../final-wave/integration/master.ts.md) | ../../integration-4/compose.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/runner.ts](../final-wave/integration/runner.ts.md) | ../../integration-4/compose.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/compose.test.ts](../../../tests/visual-runtime/integration-4/compose.test.ts.md) | ../../../src/visual-runtime/integration-4/compose.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/integration-4/compose.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Integration 4: bounded cross-device composition over the REAL Wave 4 A-H modules.
 *
 * ONE Founder Workspace is projected onto the existing Windows desktop shell (A),
 * the existing Android/relay phone surface (B), the shared device input semantics
 * (C), the effect-free session reconciler (D), the onboarding/resume journey (E),
 * the device-scoped KB snapshot (F), the typed transport candidate (G) and the
 * Host status contract (H).
 *
 * Every module is imported from its own lane path. Nothing is re-implemented
 * here and no lane module is mocked. The only synthetic inputs are the EXTERNAL
 * transport/authority facts a real Host/Android owner would supply, and they are
 * supplied by the caller, never synthesised inside this module.
 *
 * This is NOT device acceptance. A positive result proves real module
 * composition and parity in code. It does not prove a physical Windows device,
 * a physical Android device, TalkBack, a signed-in provider browser, a live
 * Host, or a live KB.
 *
 * No writer, publisher, store, Host executor or provider API is created here.
 *
 * Every lane is measured INDEPENDENTLY and reported separately, so a real
 * cross-lane defect is reported as a measured BLOCKED gate with the exact
 * repair patch, never silently worked around.
 */
import { UI_DOCUMENT_SCHEMA, type UiActionReference, type UiDocument } from '../document/schema.ts';
import { projectWave3ActionSemantics, type Wave3BindingPin } from '../document/wave3-action-semantics.ts';
import { mapCanonicalComponents, type CanonicalComponentProjection } from '../components/wave3-canonical-map.ts';
import { renderWave3Semantics } from '../render/wave3-semantics.ts';
import { compileDescriptorProof, type DescriptorProofContext, type DescriptorProofResult } from '../command/wave3-descriptor-proof.ts';
import { projectWave4DesktopAdapter, type DesktopAdapterRequest, type DesktopHostObservation } from '../device/wave4-desktop-adapter.ts';
import { projectWave4PhoneAdapter, type PhoneHostObservation, type PhonePairingObservation, type PhoneProjection, type PhoneShellContract } from '../device/wave4-phone-adapter.ts';
import { normalizeWave4DeviceInput, type DeviceInputContext, type TrustedControlBinding } from '../input/wave4-device-semantics.ts';
import { createWave4SessionReconciler, type SessionReconciler, type SessionView } from '../revisions/wave4-session-reconcile.ts';
import { projectWave4OnboardingResume, type Wave4OnboardingInput, type Wave4OnboardingView } from '../experience/wave4-onboarding-resume.ts';
import { createDeviceKnowledgeSnapshotAdapter, type DeviceKnowledgeSnapshot } from '../knowledge/wave4-device-snapshot-adapter.ts';
import { stageTypedCandidate, validateTypedEnvelope, type TransportAuthority, type TransportControls } from '../command/wave4-typed-transport-adapter.ts';
import { createWave4HostStatusContract, type HostStatusQuery, type Wave4HostReadPort, type Wave4HostStatus } from '../host/wave4-h-host-status-contract.ts';
import type { ScopedFeedResult, ScopedKnowledgeFeed } from '../knowledge/wave3-feed-projection.ts';
import type { KnowledgeQuery, TrustedKnowledgeBroker } from '../knowledge/client.ts';
import type { VerifiedUiPrincipal } from '../revisions/port.ts';

const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
/** The eight real Wave 4 lanes, in the order this composition exercises them. */
export type Integration4Lane = 'F' | 'A' | 'B' | 'C' | 'G' | 'H' | 'D' | 'E';
export type Integration4Phase = Integration4Lane | 'SCOPE';
/** The two real device surfaces the composition must agree across. */
export type Integration4Surface = 'desktop' | 'phone';

/** A measured cross-lane defect that needs a lane-owned source change. */
export interface Integration4Defect {
  readonly lane: Integration4Lane;
  readonly code: string;
  readonly summary: string;
  /** Exact file:line and the exact patch required. NOT applied by this module. */
  readonly repair: string;
  readonly measured: Readonly<Record<string, string>>;
}

/** Per-lane measured outcome. */
export interface Integration4LaneReport {
  readonly lane: Integration4Lane;
  readonly status: 'composed' | 'blocked' | 'not-reached';
  /** Measured refusal code when blocked, otherwise null. */
  readonly code: string | null;
  /** Measured facts for this lane. Empty when the lane did not compose. */
  readonly evidence: Readonly<Record<string, string | number | boolean | readonly string[]>>;
}

export type Integration4Result =
  | Readonly<{ ok: false; phase: Integration4Phase; code: string; effectInvoked: false; automaticRetryAllowed: false }>
  | Readonly<{
      ok: true;
      evidenceClass: 'synthetic-real-modules-not-live-acceptance';
      trace: readonly ['F','A','B','C','G','H','D','E'];
      lanes: readonly Integration4LaneReport[];
      /** Measured cross-lane defects. Non-empty means at least one gate is BLOCKED. */
      defects: readonly Integration4Defect[];
      document: Readonly<{ documentId: string; revision: number; documentDigest: string; workspaceRef: string }>;
      effectInvoked: false; automaticRetryAllowed: false;
```

_First 80 of 501 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
