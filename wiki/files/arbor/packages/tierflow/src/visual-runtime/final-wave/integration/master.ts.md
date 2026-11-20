# File: packages/tierflow/src/visual-runtime/final-wave/integration/master.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/integration/master.ts |
| Language | TypeScript |
| Kind | source |
| Size | 19836 B |
| Lines | 338 |
| Hash | a17a20b7cc9c |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MASTER_SCHEMA | const | 32 | yes | export const MASTER_SCHEMA = &#39;vivim.final-wave-master/1&#39; as const; |
| FOUR_MODALITIES | const | 35 | yes | export const FOUR_MODALITIES = [&#39;text&#39;, &#39;touch&#39;, &#39;keyboard&#39;, &#39;studio&#39;] as const; |
| Modality | type | 36 | yes | export type Modality = typeof FOUR_MODALITIES[number]; |
| MasterInput | interface | 38 | yes | export interface MasterInput { |
| MasterLaneReport | interface | 69 | yes | export interface MasterLaneReport { |
| MasterResult | interface | 76 | yes | export interface MasterResult { |
| sha256 | function | 104 | no | const sha256 = (value: string): string =&gt; createHash(&#39;sha256&#39;).update(value).digest(&#39;hex&#39;); |
| composeMasterIntegration | function | 110 | yes | export async function composeMasterIntegration(input: MasterInput): Promise&lt;MasterResult&gt; { |
| lanes | const | 111 | no | const lanes: MasterLaneReport[] = []; |
| report | function | 112 | no | const report = (lane: MasterLaneReport[&#39;lane&#39;], status: MasterLaneReport[&#39;status&#39;], code: string \| null, evidence: MasterLaneReport[&#39;evidence&#39;] = {}): void =&gt; { |
| presentation | const | 118 | no | const presentation: KnowledgePresentationPort = createKnowledgePresentation( input.knowledge.feed, input.knowledge.broker, { surface: input.knowledge.surface, now: input.knowledge.now }); |
| knowledgeView | const | 121 | no | const knowledgeView = await presentation.read(input.knowledge.query); |
| authorResults | const | 130 | no | const authorResults = new Map&lt;Modality, AuthorResult&gt;(); |
| intent | const | 132 | no | const intent: AuthorIntent = modality === &#39;text&#39; |
| result | const | 136 | no | const result = normalizeLaneAAuthoring(intent, input.authorContext); |
| candidateResults | const | 139 | no | const candidateResults = [...authorResults.values()].filter(r =&gt; r.outcome === &#39;candidate&#39;); |
| aBlocked | const | 140 | no | const aBlocked = candidateResults.length !== FOUR_MODALITIES.length; |
| aCode | const | 141 | no | const aCode = aBlocked |
| parityRows | const | 145 | no | const parityRows = candidateResults.map((r, index) =&gt; { const candidate = r as Extract&lt;AuthorResult, { outcome: &#39;candidate&#39; }&gt;; const args = candidate.command.args; return { // The modality is the IN… |
| candidate | const | 146 | no | const candidate = r as Extract&lt;AuthorResult, { outcome: &#39;candidate&#39; }&gt;; |
| args | const | 147 | no | const args = candidate.command.args; |
| fourInput | const | 162 | no | const fourInput = verifyFourInputParity(parityRows as never); |
| lanesAgree | variable | 164 | no | let lanesAgree = true; |
| first | const | 165 | no | const first = candidateResults[0]; |
| studioPreview | variable | 182 | no | let studioPreview: StudioPreview \| null = null; |
| studioCode | variable | 183 | no | let studioCode: string \| null = null; |
| adapter | const | 185 | no | const adapter = new StudioEditingAdapter(input.studio.dependencies); |
| loaded | const | 186 | no | const loaded = adapter.load(input.studio.principal, input.studio.documentId); |
| begun | const | 190 | no | const begun = adapter.begin(input.studio.principal, input.studio.documentId, input.studio.draftId, loaded.value.revision); |
| previewed | const | 194 | no | const previewed = adapter.preview(input.studio.principal, input.studio.draftId); |
| templatePlan | const | 216 | no | const templatePlan = planTemplateCandidate(input.template.candidate, input.template.base, input.template.trusted); |
| firstEdit | const | 217 | no | const firstEdit: ReturnType&lt;typeof projectFirstEdit&gt; = projectFirstEdit({ stage: &#39;discover&#39;, shell: &#39;desktop&#39;, viewport: 1280, onboarding: { schema: &#39;vivim.wave4-founder-onboarding/1&#39;, pairing: { qrA… |
| journey | const | 232 | no | const journey: LaneEJourney = projectLaneEHostJourney(input.hostStatus, &#39;desktop&#39;, &#39;host-control&#39;); |
| rootDiagnosis | const | 242 | no | const rootDiagnosis = diagnoseWave4BRoot(input.clientParity.canonical, input.clientParity.rendered); |
| parity | const | 243 | no | const parity = assessExistingClientParity(input.clientParity); |
| migration | const | 253 | no | const migration = makeShadowMigrationPlan(input.cutover.migration); |
| shadow | const | 254 | no | const shadow = compareShadowSnapshots(input.cutover.shadow); |
| fence | const | 255 | no | const fence = assessPublisherFence(input.cutover.fence.control, input.cutover.fence.observation); |
| rollback | const | 256 | no | const rollback = rehearseRollback(input.cutover.rollback); |
| gBlocked | const | 257 | no | const gBlocked = !migration.ok \|\| !shadow.ok \|\| !fence.ok \|\| !rollback.ok; |
| gBlockers | const | 258 | no | const gBlockers = [migration, shadow, fence, rollback] |
| integration4 | const | 269 | no | const integration4 = await observeRealIntegration4(input.integration4); |
| schemaBoundary | const | 272 | no | const schemaBoundary = assessWorldToCanonicalBridge(input.schemaPair.world, input.schemaPair.canonical); |
| distinct | const | 273 | no | const distinct = proveSchemasAreDistinct(input.schemaPair.world, input.schemaPair.canonical as never); |
| verification | const | 276 | no | const verification: VerificationResult = evaluateFinalWave({ schema: &#39;vivim.final-wave-verification/1&#39;, pins: input.evidence.pins, integration4: input.evidence.integration4Verdict, integration5Decisi… |
| knowledgeReaders | const | 300 | no | const knowledgeReaders = 1; // Lane D owns the only authorized scoped read. |
| revisionWriters | const | 301 | no | const revisionWriters = 1; // Lane B writes through the existing revision port only. |
| hostEffectAuthorities | const | 302 | no | const hostEffectAuthorities = 1; // Lane E reads the one Host status contract. |
| canonicalPublishers | const | 303 | no | const canonicalPublishers = 0; // No lane may publish: the Host publisher stays live. |
| singleAuthority | const | 304 | no | const singleAuthority = Object.freeze({ knowledgeReaders, revisionWriters, hostEffectAuthorities, canonicalPublishers, oneKnowledge: knowledgeReaders === 1, oneRevisionWriter: revisionWriters === 1, … |
| firstCandidate | const | 312 | no | const firstCandidate = candidateResults[0] as Extract&lt;AuthorResult, { outcome: &#39;candidate&#39; }&gt; \| undefined; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 14 | external |
| ../lane-a/normalize.ts | import | 15 | [packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts](../lane-a/normalize.ts.md) |
| ../lane-b/studio-editing.ts | import | 16 | [packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts](../lane-b/studio-editing.ts.md) |
| ../lane-c/templates.ts | import | 17 | [packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts](../lane-c/templates.ts.md) |
| ../lane-c/first-edit.ts | import | 18 | [packages/tierflow/src/visual-runtime/final-wave/lane-c/first-edit.ts](../lane-c/first-edit.ts.md) |
| ../lane-d/knowledge-presentation.ts | import | 19 | [packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts](../lane-d/knowledge-presentation.ts.md) |
| ../lane-e/host-journey.ts | import | 20 | [packages/tierflow/src/visual-runtime/final-wave/lane-e/host-journey.ts](../lane-e/host-journey.ts.md) |
| ../lane-f/existing-clients.ts | import | 21 | [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../lane-f/existing-clients.ts.md) |
| ../lane-g/cutover-dry-run.ts | import | 22 | [packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts](../lane-g/cutover-dry-run.ts.md) |
| ../lane-h/verification.ts | import | 23 | [packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts](../lane-h/verification.ts.md) |
| ./runner.ts | import | 24 | [packages/tierflow/src/visual-runtime/final-wave/integration/runner.ts](./runner.ts.md) |
| ./schema-boundary.ts | import | 25 | [packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts](./schema-boundary.ts.md) |
| ../../integration-4/compose.ts | import | 26 | [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../../integration-4/compose.ts.md) |
| ../../revisions/port.ts | import | 27 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../../revisions/port.ts.md) |
| ../../knowledge/wave3-feed-projection.ts | import | 28 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../../knowledge/wave3-feed-projection.ts.md) |
| ../../knowledge/client.ts | import | 29 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../knowledge/client.ts.md) |
| ../../host/wave4-h-host-status-contract.ts | import | 30 | [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](../../host/wave4-h-host-status-contract.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/final-wave/integration/master.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Master integration: ONE Founder Workspace through the EIGHT real final-wave
 * lane modules, plus the real Wave 4 A-H composition.
 *
 * This is the cross-lane glue the master integrator owns. It imports the real
 * lane modules; it never re-implements a lane contract and never mocks one.
 *
 * The composition is INERT. It creates no writer, no publisher, no store, no
 * command journal, no effect executor and no second document authority. It
 * reports the measured outcome of every lane and hands the measured evidence to
 * Lane H's acceptance evaluator, which can only ever answer BLOCKED or
 * CANDIDATE_READY, never GO.
 */
import { createHash } from 'node:crypto';
import { normalizeLaneAAuthoring, sameLaneASemantics, type AuthorContext, type AuthorIntent, type AuthorResult, type AuthorSurface } from '../lane-a/normalize.ts';
import { StudioEditingAdapter, type Dependencies as StudioDependencies, type Preview as StudioPreview } from '../lane-b/studio-editing.ts';
import { planTemplateCandidate, type TemplateTrustedScope } from '../lane-c/templates.ts';
import { projectFirstEdit, type FirstEditInput } from '../lane-c/first-edit.ts';
import { createKnowledgePresentation, type KnowledgePresentationPort } from '../lane-d/knowledge-presentation.ts';
import { projectLaneEHostJourney, type LaneEJourney } from '../lane-e/host-journey.ts';
import { assessExistingClientParity, diagnoseWave4BRoot, type ClientParityInput } from '../lane-f/existing-clients.ts';
import { assessPublisherFence, compareShadowSnapshots, makeShadowMigrationPlan, rehearseRollback, type FenceObservation, type MigrationInput, type PublisherControl, type RollbackInput, type ShadowInput } from '../lane-g/cutover-dry-run.ts';
import { evaluateFinalWave, verifyFourInputParity, type GateResult, type LaneHandoff, type NegativeInvariant, type NegativeWitness, type Proof, type SourcePins, type VerificationResult } from '../lane-h/verification.ts';
import { observeRealIntegration4, type Integration4Observation } from './runner.ts';
import { assessWorldToCanonicalBridge, proveSchemasAreDistinct, type BridgeAssessment } from './schema-boundary.ts';
import type { Integration4Input } from '../../integration-4/compose.ts';
import type { UiRevisionPort, VerifiedUiPrincipal } from '../../revisions/port.ts';
import type { ScopedKnowledgeFeed } from '../../knowledge/wave3-feed-projection.ts';
import type { TrustedKnowledgeBroker, KnowledgeQuery } from '../../knowledge/client.ts';
import type { Wave4HostStatus } from '../../host/wave4-h-host-status-contract.ts';

export const MASTER_SCHEMA = 'vivim.final-wave-master/1' as const;

/** The four input modalities Gate 5 requires to agree. */
export const FOUR_MODALITIES = ['text', 'touch', 'keyboard', 'studio'] as const;
export type Modality = typeof FOUR_MODALITIES[number];

export interface MasterInput {
  /** The real Wave 4 A-H composition input. */
  readonly integration4: Integration4Input;
  /** Lane A trusted broker projection and the text intent. */
  readonly authorContext: AuthorContext;
  readonly authorIntent: AuthorIntent;
  /** Lane D: the one authorized scoped KB feed and its trusted broker. */
  readonly knowledge: Readonly<{ feed: ScopedKnowledgeFeed; broker: TrustedKnowledgeBroker; query: KnowledgeQuery; surface: 'pc' | 'android'; now?: () => number }>;
  /** Lane B: the existing revision authority and owner broker. */
  readonly studio: Readonly<{ dependencies: StudioDependencies; principal: VerifiedUiPrincipal; documentId: string; draftId: string }>;
  /** Lane C: the template candidate and its trusted scope. */
  readonly template: Readonly<{ candidate: unknown; trusted: TemplateTrustedScope; base: Parameters<typeof planTemplateCandidate>[1] }>;
  /** Lane E: the real Host status projection. */
  readonly hostStatus: Wave4HostStatus;
  /** Lane F: the real desktop/phone parity input. */
  readonly clientParity: ClientParityInput;
  /** Lane G: dormant cutover dry-run inputs. */
  readonly cutover: Readonly<{ migration: MigrationInput; shadow: ShadowInput; fence: { control: PublisherControl; observation: FenceObservation }; rollback: RollbackInput }>;
  /** Lane H: the real evidence set. */
  readonly evidence: Readonly<{
    pins: SourcePins; handoffs: readonly LaneHandoff[]; proofs: readonly Proof[];
    negativeWitnesses: Partial<Readonly<Record<NegativeInvariant, NegativeWitness>>>;
    duplicateActiveAuthorities: number | null; unownedActiveRoutes: number | null; consumerCoveragePct: number | null;
    integration4Verdict: 'GO' | 'ISOLATED_GO' | 'BLOCKED' | 'UNRUN';
    integration5Decision: 'GO' | 'BLOCKED' | 'UNRUN';
    acceptedOwnerScope: boolean; separateProductionApproval: boolean;
  }>;
  /** The persisted World revision and the canonical visual document. */
  readonly schemaPair: Readonly<{ world: unknown; canonical: unknown }>;
}

export interface MasterLaneReport {
  readonly lane: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  readonly status: 'composed' | 'blocked';
  readonly code: string | null;
  readonly evidence: Readonly<Record<string, string | number | boolean | readonly string[]>>;
}

export interface MasterResult {
  readonly schema: typeof MASTER_SCHEMA;
  readonly evidenceClass: 'real-modules-synthetic-external-fixtures';
  readonly lanes: readonly MasterLaneReport[];
  /** The measured four-modality semantic parity. */
```

_First 80 of 339 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
