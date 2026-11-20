# File: packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 22794 B |
| Lines | 377 |
| Hash | 7bba5fe0e5ac |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| H | function | 29 | no | const H = (letter = &#39;a&#39;) =&gt; `sha256:${letter.repeat(64)}` as `sha256:${string}`; |
| S | function | 30 | no | const S = (letter = &#39;a&#39;) =&gt; letter.repeat(40); |
| h | function | 31 | no | const h = (s: string) =&gt; createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| TIERFLOW_SHA | const | 33 | no | const TIERFLOW_SHA = &#39;b5477de6ffd10bb5082a83854880ca4538bc36e6&#39;; |
| HARNESS_SHA | const | 34 | no | const HARNESS_SHA = &#39;09382c61f74a304f120b05445f6dfa900b58494b&#39;; |
| HQ_SHA | const | 35 | no | const HQ_SHA = &#39;6679752362a5ef58aa66e2af5463f9d81077001c&#39;; |
| WORLD | const | 38 | no | const WORLD = { |
| AUTHOR_PINS | const | 50 | no | const AUTHOR_PINS = { hostWorld: &#39;world-v8&#39;, policy: &#39;policy-v8&#39;, uiRevision: &#39;12&#39;, kb: &#39;kb-v8&#39; }; |
| AUTHOR_SCOPE | const | 51 | no | const AUTHOR_SCOPE = { ownerId: &#39;owner_a&#39;, actorId: &#39;actor_a&#39;, deviceId: &#39;desktop_a&#39;, |
| AUTHOR_ARGS | const | 53 | no | const AUTHOR_ARGS = { target_kind: &#39;document&#39;, target_ref: &#39;founder_workspace&#39;, panel_type: &#39;blocked_tasks&#39; }; |
| authorContext | function | 55 | no | function authorContext(): AuthorContext { |
| hm | const | 56 | no | const hm = h(&#39;hq-registry&#39;), hp = h(&#39;policy&#39;), hs = h(&#39;schema&#39;); |
| row | const | 57 | no | const row = { |
| descriptor | const | 69 | no | const descriptor = { |
| authorIntent | function | 87 | no | function authorIntent(): AuthorIntent { |
| studioPort | function | 94 | no | function studioPort(document: unknown, digest: string): UiRevisionPort { |
| revision | const | 95 | no | const revision: UiFixtureRevision = { |
| fail | function | 99 | no | const fail = (code: &#39;UNAVAILABLE&#39; \| &#39;NOT_FOUND&#39;) =&gt; ({ ok: false as const, code, message: code }); |
| laneGInputs | function | 111 | no | function laneGInputs() { |
| migration | const | 112 | no | const migration: MigrationInput = { |
| frame | function | 129 | no | const frame = (viewport: 320 \| 360 \| 1280): ShadowFrame =&gt; ({ viewport, ownerRef: &#39;owner&#39;, worldRef: &#39;world-local&#39;, sourceVersion: &#39;host-1&#39;, sourceHash: H(&#39;b&#39;), activeRevision: 1, semanticDigest: H(&#39;… |
| control | const | 133 | no | const control: PublisherControl = { ownerRef: &#39;owner&#39;, worldRef: &#39;world-local&#39;, documentId: &#39;founder-home&#39;, |
| observation | const | 135 | no | const observation: FenceObservation = { expectedEpoch: 8, expectedControlRevision: 17, ownerRef: &#39;owner&#39;, |
| rollback | const | 140 | no | const rollback: RollbackInput = { control: { ...control, phase: &#39;OBSERVING&#39;, writer: &#39;tierflow-canonical&#39; }, |
| laneHandoffs | function | 149 | no | function laneHandoffs(): LaneHandoff[] { |
| masterInput | function | 159 | no | async function masterInput(overrides: Partial&lt;MasterInput&gt; = {}): Promise&lt;MasterInput&gt; { |
| i4 | const | 160 | no | const i4 = await setupIntegration4(); |
| canonical | const | 161 | no | const canonical = founderDocument(); |
| semantics | const | 162 | no | const semantics = { expectedRevision: canonical.revision, knownActions: [ACTION], |
| projection | const | 165 | no | const projection = projectWave3ActionSemantics(canonical, semantics); |
| rendered | const | 167 | no | const rendered = renderWave3Semantics(projection.value.canonical, { viewportPx: 360, knownActions: [ACTION] }); |
| desktop | const | 168 | no | const desktop = projectWave4DesktopAdapter({ document: canonical, semantics, host: { state: &#39;connected&#39;, ownerRef: &#39;owner_a&#39;, worldRef: &#39;workspace_a&#39;, decision: &#39;read-only&#39;, publisher: &#39;harness&#39;, ano… |
| phone | const | 173 | no | const phone = projectWave4PhoneAdapter({ canonical, rendered, shell: { app: &#39;existing-vivim-apk&#39;, relay: &#39;existing-mobile-relay&#39;, publisher: &#39;harness&#39;, viewportPx: 360 }, pairing: { state: &#39;paired&#39;, … |
| clientParity | const | 184 | no | const clientParity: ClientParityInput = { canonical, rendered, desktop, phone, |
| principal | const | 195 | no | const principal: VerifiedUiPrincipal = { ownerRef: &#39;owner_a&#39;, actorRef: &#39;actor_a&#39;, deviceRef: &#39;desktop_1&#39;, |
| worldDigest | const | 198 | no | const worldDigest = contentHash(WORLD as never); |
| base | const | 199 | no | const base = { schema: &#39;vivim.ui-document/1&#39; as const, documentId: &#39;founder1&#39;, |
| proofs | const | 204 | no | const proofs: Proof[] = []; |
| negativeWitnesses | const | 205 | no | const negativeWitnesses: Partial&lt;Record&lt;NegativeInvariant, NegativeWitness&gt;&gt; = {}; |
| input | const | 207 | no | const input: MasterInput = { |
| laneOf | function | 239 | no | function laneOf(result: MasterResult, id: &#39;A&#39;\|&#39;B&#39;\|&#39;C&#39;\|&#39;D&#39;\|&#39;E&#39;\|&#39;F&#39;\|&#39;G&#39;\|&#39;H&#39;) { |
| found | const | 240 | no | const found = result.lanes.find(l =&gt; l.lane === id); |
| result | const | 246 | no | const result = await composeMasterIntegration(await masterInput()); |
| lane | const | 251 | no | const lane = laneOf(result, id); |
| result | const | 262 | no | const result = await composeMasterIntegration(await masterInput()); |
| result | const | 271 | no | const result = await composeMasterIntegration(await masterInput()); |
| a | const | 272 | no | const a = laneOf(result, &#39;A&#39;); |
| result | const | 290 | no | const result = await composeMasterIntegration(await masterInput()); |
| h | const | 299 | no | const h = laneOf(result, &#39;H&#39;); |
| result | const | 304 | no | const result = await composeMasterIntegration(await masterInput()); |
| result | const | 313 | no | const result = await composeMasterIntegration(await masterInput()); |
| input | const | 324 | no | const input = await masterInput(); |
| result | const | 325 | no | const result = await composeMasterIntegration({ ...input, authorContext: { ...input.authorContext, scope: { ...input.authorContext.scope, ownerId: &#39;owner_foreign&#39; } }, }); |
| a | const | 329 | no | const a = laneOf(result, &#39;A&#39;); |
| input | const | 336 | no | const input = await masterInput(); |
| result | const | 337 | no | const result = await composeMasterIntegration({ ...input, hostStatus: { ...input.hostStatus, state: &#39;denied&#39;, reasonCode: &#39;HOST_SCOPE_DENIED&#39; }, }); |
| e | const | 341 | no | const e = laneOf(result, &#39;E&#39;); |
| result | const | 349 | no | const result = await composeMasterIntegration(await masterInput()); |
| f | const | 350 | no | const f = laneOf(result, &#39;F&#39;); |
| result | const | 364 | no | const result = await composeMasterIntegration(await masterInput()); |
| g | const | 365 | no | const g = laneOf(result, &#39;G&#39;); |
| a | const | 373 | no | const a = await composeMasterIntegration(await masterInput()); |
| b | const | 374 | no | const b = await composeMasterIntegration(await masterInput()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 11 | external |
| node:assert/strict | import | 12 | external |
| node:crypto | import | 13 | external |
| ../../../../src/visual-runtime/final-wave/integration/master.ts | import | 14 | [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../../../../src/visual-runtime/final-wave/integration/master.ts.md) |
| ../../integration-4/fixture.ts | import | 15 | [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../integration-4/fixture.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-a/normalize.ts | import | 16 | [packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts](../../../../src/visual-runtime/final-wave/lane-a/normalize.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-c/templates.ts | import | 17 | [packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts](../../../../src/visual-runtime/final-wave/lane-c/templates.ts.md) |
| ../../../../src/visual-runtime/render/wave3-semantics.ts | import | 18 | [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../../../../src/visual-runtime/render/wave3-semantics.ts.md) |
| ../../../../src/visual-runtime/document/wave3-action-semantics.ts | import | 19 | [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](../../../../src/visual-runtime/document/wave3-action-semantics.ts.md) |
| ../../../../src/visual-runtime/device/wave4-desktop-adapter.ts | import | 20 | [packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts](../../../../src/visual-runtime/device/wave4-desktop-adapter.ts.md) |
| ../../../../src/visual-runtime/device/wave4-phone-adapter.ts | import | 21 | [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../../../../src/visual-runtime/device/wave4-phone-adapter.ts.md) |
| ../../../../src/ui/hash.ts | import | 22 | [packages/tierflow/src/ui/hash.ts](../../../../src/ui/hash.ts.md) |
| ../../../../src/visual-runtime/host/wave4-h-host-status-contract.ts | import | 23 | [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](../../../../src/visual-runtime/host/wave4-h-host-status-contract.ts.md) |
| ../../../../src/visual-runtime/revisions/port.ts | import | 24 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../../../../src/visual-runtime/revisions/port.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts | import | 25 | [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts | import | 26 | [packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts](../../../../src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts.md) |
| ../../../../src/visual-runtime/final-wave/lane-h/verification.ts | import | 27 | [packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts](../../../../src/visual-runtime/final-wave/lane-h/verification.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Master integration: ONE Founder Workspace through the eight REAL final-wave
 * lane modules and the REAL Wave 4 A-H composition.
 *
 * Nothing here is mocked: every lane module is imported and executed. The only
 * synthetic values are external facts a Host/Android/Studio owner supplies.
 *
 * These tests assert what was MEASURED. They never assert a GO, never claim a
 * device, never claim a live Host and never activate a publisher.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { composeMasterIntegration, type MasterInput, type MasterResult } from '../../../../src/visual-runtime/final-wave/integration/master.ts';
import { setup as setupIntegration4, founderDocument, ACTION, NOW } from '../../integration-4/fixture.ts';
import { normalizeLaneAAuthoring, LANE_A_CONTEXT_SCHEMA, type AuthorContext, type AuthorIntent } from '../../../../src/visual-runtime/final-wave/lane-a/normalize.ts';
import { TEMPLATE_CATALOG_DIGEST } from '../../../../src/visual-runtime/final-wave/lane-c/templates.ts';
import { renderWave3Semantics } from '../../../../src/visual-runtime/render/wave3-semantics.ts';
import { projectWave3ActionSemantics } from '../../../../src/visual-runtime/document/wave3-action-semantics.ts';
import { projectWave4DesktopAdapter } from '../../../../src/visual-runtime/device/wave4-desktop-adapter.ts';
import { projectWave4PhoneAdapter } from '../../../../src/visual-runtime/device/wave4-phone-adapter.ts';
import { contentHash } from '../../../../src/ui/hash.ts';
import { createWave4HostStatusContract } from '../../../../src/visual-runtime/host/wave4-h-host-status-contract.ts';
import type { UiRevisionPort, VerifiedUiPrincipal, UiFixtureRevision } from '../../../../src/visual-runtime/revisions/port.ts';
import type { ClientParityInput } from '../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts';
import type { ShadowFrame, MigrationInput, PublisherControl, FenceObservation, RollbackInput } from '../../../../src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts';
import type { Proof, LaneHandoff, NegativeWitness, NegativeInvariant } from '../../../../src/visual-runtime/final-wave/lane-h/verification.ts';

const H = (letter = 'a') => `sha256:${letter.repeat(64)}` as `sha256:${string}`;
const S = (letter = 'a') => letter.repeat(40);
const h = (s: string) => createHash('sha256').update(s).digest('hex');

const TIERFLOW_SHA = 'b5477de6ffd10bb5082a83854880ca4538bc36e6';
const HARNESS_SHA = '09382c61f74a304f120b05445f6dfa900b58494b';
const HQ_SHA = '6679752362a5ef58aa66e2af5463f9d81077001c';

/** The persisted World UI document: schemaVersion + world + objects + relationships + dataFlows. */
const WORLD = {
  schemaVersion: 1 as const,
  world: { id: 'founder-home', kind: 'home' as const, title: 'Founder Workspace',
    accent: '#000000', origin: { x: 0, y: 0, z: 0 }, unitsPerMeter: 1 },
  objects: [{ id: 'task_panel', layer: 'content' as const, kind: 'static' as const, shape: 'box' as const,
    title: 'Blocked tasks',
    transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    props: { panel_type: 'blocked_tasks' } }],
  relationships: [], dataFlows: [],
};

/** Lane A trusted broker projection (HQ semantics + Harness NLCL), not a parser authority. */
const AUTHOR_PINS = { hostWorld: 'world-v8', policy: 'policy-v8', uiRevision: '12', kb: 'kb-v8' };
const AUTHOR_SCOPE = { ownerId: 'owner_a', actorId: 'actor_a', deviceId: 'desktop_a',
  sessionId: 'session_a', worldId: 'world_a', documentId: 'founder_workspace' };
const AUTHOR_ARGS = { target_kind: 'document', target_ref: 'founder_workspace', panel_type: 'blocked_tasks' };

function authorContext(): AuthorContext {
  const hm = h('hq-registry'), hp = h('policy'), hs = h('schema');
  const row = {
    semanticRef: { id: 'ui.create@1', version: '1', sourceHash: hm },
    target: { owner: 'ui_document' as const, actionId: 'ui.panel.create', catalogVersion: 1 },
    argsSchema: {
      target_kind: { type: 'enum' as const, values: ['object', 'document'] },
      target_ref: { type: 'string' as const, min: 1, max: 128 },
      panel_type: { type: 'enum' as const, values: ['blocked_tasks', 'projects'] },
    },
    argsSchemaHash: hs, risk: 'R1' as const,
    riskSource: { authority: 'ui_contract' as const, sourceHash: hp },
    implementationStatus: 'verified' as const, reviewedEnabled: true,
  };
  const descriptor = {
    target: row.target, argsSchemaHash: hs, sourceHash: hp, risk: 'R1' as const,
    implementationStatus: 'verified' as const,
    capability: { supportedByBuild: true, availableNow: 'yes' as const, permittedForActor: 'unknown' as const,
      verifiedByEvidence: false, reasonCodes: ['INERT_FIXTURE_ONLY'] },
  };
  return {
    schema: LANE_A_CONTEXT_SCHEMA, scope: AUTHOR_SCOPE, device: 'desktop', revision: 12,
    documentDigest: h('doc12'), currentVersions: AUTHOR_PINS,
    compiled: { rows: [row], descriptors: [descriptor], currentVersions: AUTHOR_PINS },
    meanings: [{ semanticId: 'ui.create@1', schema: 'hq.semantic-registry/1', status: 'current', sourceHash: hm }],
    nlcl: [{ schema: 'vivim.control-language/1', text: 'add a blocked tasks panel', status: 'ok',
```

_First 80 of 378 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
