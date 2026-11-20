# File: packages/tierflow/src/visual-runtime/integration-2/compose.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/integration-2/compose.ts |
| Language | TypeScript |
| Kind | source |
| Size | 36213 B |
| Lines | 836 |
| Hash | 645aab2bdb3d |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMPOSITION_SCHEMA | const | 36 | yes | export const COMPOSITION_SCHEMA = &#39;vivim.integration-2-composition/1&#39; as const; |
| KNOWLEDGE_STABLE_ID | const | 39 | no | const KNOWLEDGE_STABLE_ID = &#39;kn_8f3a0c71&#39;; |
| SEMANTIC_ID | const | 41 | no | const SEMANTIC_ID = &#39;vivim.preview@1&#39;; |
| HOST_ACTION_ID | const | 43 | no | const HOST_ACTION_ID = &#39;vivim.preview&#39;; |
| HOST_CATALOG_VERSION | const | 44 | no | const HOST_CATALOG_VERSION = 1; |
| ACTION_REF_ID | const | 46 | no | const ACTION_REF_ID = &#39;fixture.preview&#39;; |
| ACTION_REF_VERSION | const | 47 | no | const ACTION_REF_VERSION = 1; |
| HOST_WORLD | const | 49 | no | const HOST_WORLD = &#39;world-1&#39;; |
| POLICY_REVISION | const | 50 | no | const POLICY_REVISION = &#39;policy-1&#39;; |
| KB_VERSION | const | 51 | no | const KB_VERSION = &#39;kb-1&#39;; |
| UI_REVISION | const | 52 | no | const UI_REVISION = &#39;rev-1&#39;; |
| NOW_MS | const | 53 | no | const NOW_MS = 1_792_000_000_000; |
| SESSION_TTL_MS | const | 54 | no | const SESSION_TTL_MS = 60_000; |
| OWNER_REF | const | 56 | no | const OWNER_REF = &#39;owner_a&#39;; |
| ACTOR_REF | const | 57 | no | const ACTOR_REF = &#39;actor_a&#39;; |
| DEVICE_REF | const | 58 | no | const DEVICE_REF = &#39;desktop_1&#39;; |
| SESSION_REF | const | 59 | no | const SESSION_REF = &#39;session_1&#39;; |
| WORLD_REF | const | 60 | no | const WORLD_REF = &#39;world_a&#39;; |
| DOCUMENT_ID | const | 61 | no | const DOCUMENT_ID = &#39;doc.integration2&#39;; |
| digestOf | function | 63 | no | const digestOf = (value: unknown): string =&gt; sha256Hex(canonicalJson(value)); |
| CANONICAL_DOCUMENT | const | 69 | yes | export const CANONICAL_DOCUMENT = { |
| CompositionLaneLeg | interface | 145 | yes | export interface CompositionLaneLeg { |
| CompositionSeam | interface | 151 | yes | export interface CompositionSeam { |
| Integration2Composition | interface | 159 | yes | export interface Integration2Composition { |
| RenderNodeLike | interface | 275 | no | interface RenderNodeLike { |
| EFFECT_HANDLE_KEYS | const | 282 | no | const EFFECT_HANDLE_KEYS = /^(?:on[a-z]+\|href\|src\|action\|formaction\|style\|innerhtml\|srcdoc)$/i; |
| walkNodes | function | 284 | no | function walkNodes(node: RenderNodeLike, visit: (node: RenderNodeLike) =&gt; void): void { |
| collectEffectHandles | function | 289 | no | function collectEffectHandles(node: RenderNodeLike): string[] { |
| found | const | 290 | no | const found: string[] = []; |
| findNode | function | 299 | no | function findNode(node: RenderNodeLike, id: string): RenderNodeLike \| null { |
| hit | variable | 300 | no | let hit: RenderNodeLike \| null = null; |
| composeIntegration2 | function | 311 | yes | export async function composeIntegration2(): Promise&lt;Integration2Composition&gt; { |
| legs | const | 312 | no | const legs: CompositionLaneLeg[] = []; |
| seams | const | 313 | no | const seams: CompositionSeam[] = []; |
| validation | const | 317 | no | const validation = validateUiDocument(CANONICAL_DOCUMENT, { knownActions: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }], }); |
| laneA | const | 320 | no | const laneA: Integration2Composition[&#39;laneA&#39;] = { |
| document | const | 339 | no | const document = validation.document; |
| rawPlan | const | 345 | no | const rawPlan = renderUiDocument(document, { viewportPx: 1280 }); |
| rawIssues | const | 346 | no | const rawIssues = rawPlan.issues.map((issue) =&gt; issue.code); |
| adapted | const | 347 | no | const adapted = projectInertActionRefs(document); |
| renderedPlans | const | 348 | no | const renderedPlans = [320, 360, 1280].map((viewportPx) =&gt; { const plan = renderUiDocument(adapted.rendererDocument, { viewportPx }); const inspection = inspectRenderPlan(plan); return { viewportPx, |
| plan | const | 349 | no | const plan = renderUiDocument(adapted.rendererDocument, { viewportPx }); |
| inspection | const | 350 | no | const inspection = inspectRenderPlan(plan); |
| desktopPlan | const | 360 | no | const desktopPlan = renderUiDocument(adapted.rendererDocument, { viewportPx: 1280 }); |
| phonePlan | const | 361 | no | const phonePlan = renderUiDocument(adapted.rendererDocument, { viewportPx: 320 }); |
| gridColumnsByViewport | const | 362 | no | const gridColumnsByViewport = [320, 360, 1280].map((viewportPx) =&gt; { const plan = renderUiDocument(adapted.rendererDocument, { viewportPx }); return { viewportPx, columns: findNode(plan.root as unkno… |
| plan | const | 363 | no | const plan = renderUiDocument(adapted.rendererDocument, { viewportPx }); |
| laneD | const | 366 | no | const laneD: Integration2Composition[&#39;laneD&#39;] = { |
| panelNode | const | 385 | no | const panelNode = document.nodes.find((node) =&gt; node.id === &#39;panel&#39;); |
| aNodeResult | const | 386 | no | const aNodeResult = panelNode ? inspectComponent(panelNode as unknown) : { ok: false as const, code: &#39;INVALID_COMPONENT&#39; as const, reason: &#39;node missing&#39; }; |
| bNative | const | 387 | no | const bNative = inspectComponent({ id: &#39;panel&#39;, type: &#39;card&#39;, props: { title: &#39;Shared project path&#39; }, children: [], |
| layout | const | 394 | no | const layout = [320, 360, 1280].map((viewportPx) =&gt; { const resolved = resolveLayout( { mode: &#39;grid&#39;, gapPx: 12, paddingPx: 16, minItemWidthPx: 160, maxColumns: 4 }, viewportPx, 2, |
| resolved | const | 395 | no | const resolved = resolveLayout( { mode: &#39;grid&#39;, gapPx: 12, paddingPx: 16, minItemWidthPx: 160, maxColumns: 4 }, viewportPx, 2, ); |
| laneB | const | 408 | no | const laneB: Integration2Composition[&#39;laneB&#39;] = { |
| store | const | 427 | no | const store = new UiRevisionFixtureStore(); |
| principal | const | 428 | no | const principal = { |
| created | const | 437 | no | const created = store.createDraft(principal, &#39;draft-1&#39;, DOCUMENT_ID, document); |
| edited | const | 439 | no | const edited = store.editDraft(principal, &#39;draft-1&#39;, created.value.draftRevision, document); |
| preview | const | 441 | no | const preview = store.preview(principal, &#39;draft-1&#39;); |
| previewMatchesEdit | const | 442 | no | const previewMatchesEdit = preview.ok &amp;&amp; preview.value.documentDigest === edited.value.documentDigest; |
| documentsAfterPreview | const | 443 | no | const documentsAfterPreview = store.snapshot().documents.length; |
| published | const | 444 | no | const published = store.publish(principal, { commandId: &#39;cmd-publish-1&#39;, documentId: DOCUMENT_ID, expectedRevision: 0, draftId: &#39;draft-1&#39;, |
| replay | const | 451 | no | const replay = store.publish(principal, { commandId: &#39;cmd-publish-1&#39;, documentId: DOCUMENT_ID, expectedRevision: 0, draftId: &#39;draft-1&#39;, |
| staleDraft | const | 460 | no | const staleDraft = store.createDraft(principal, &#39;draft-stale&#39;, DOCUMENT_ID, document); |
| stale | const | 461 | no | const stale = staleDraft.ok |
| mismatchDraft | const | 470 | no | const mismatchDraft = store.createDraft(principal, &#39;draft-mismatch&#39;, DOCUMENT_ID, document); |
| mismatched | const | 471 | no | const mismatched = mismatchDraft.ok |
| rolledBack | const | 480 | no | const rolledBack = store.rollback(principal, { commandId: &#39;cmd-rollback-1&#39;, documentId: DOCUMENT_ID, expectedRevision: published.ok ? published.value.revision : 1, targetRevision: 1, |
| laneC | const | 486 | no | const laneC: Integration2Composition[&#39;laneC&#39;] = { |
| argsSchema | const | 508 | no | const argsSchema = { target: { type: &#39;enum&#39; as const, values: [KNOWLEDGE_STABLE_ID] } }; |
| argsSchemaHash | const | 509 | no | const argsSchemaHash = digestOf(argsSchema); |
| sourceHash | const | 510 | no | const sourceHash = digestOf({ source: &#39;fixture.host-catalog&#39;, semanticId: SEMANTIC_ID, catalogVersion: HOST_CATALOG_VERSION }); |
| target | const | 511 | no | const target = { owner: &#39;host_effect&#39; as const, actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION }; |
| rows | const | 512 | no | const rows: CrosswalkRow[] = [ |
| descriptors | const | 524 | no | const descriptors: ActionDescriptor[] = [ |
| compileContext | const | 540 | no | const compileContext = { |
| exactText | const | 545 | no | const exactText = toExactText(SEMANTIC_ID, { target: KNOWLEDGE_STABLE_ID }) ?? &#39;&#39;; |
| textInput | const | 546 | no | const textInput = { |
| compiled | const | 552 | no | const compiled = compileVisualCommand(textInput, compileContext); |
| touchInput | const | 553 | no | const touchInput = { |
| keyboardInput | const | 559 | no | const keyboardInput = { |
| compiledTouch | const | 565 | no | const compiledTouch = compileVisualCommand(touchInput, compileContext); |
| compiledKeyboard | const | 566 | no | const compiledKeyboard = compileVisualCommand(keyboardInput, compileContext); |
| crosswalk | const | 567 | no | const crosswalk = resolveCrosswalk(SEMANTIC_ID, rows, descriptors); |
| argumentsAccepted | const | 568 | no | const argumentsAccepted = compiled.outcome === &#39;candidate&#39; &amp;&amp; checkArguments(compiled.command.args, rows[0]!.argsSchema); |
| shapeOf | function | 569 | no | const shapeOf = (command: { semanticRef: { id: string; version: string; sourceHash: string }; target: { owner: string; actionId: string; catalogVersion: number }; args: Record&lt;string, string&gt;; risk: … |
| triModalParity | const | 577 | no | const triModalParity = |
| unknownSemantic | const | 583 | no | const unknownSemantic = compileVisualCommand( { commandId: &#39;cmd-i2-unknown&#39;, source: { surface: &#39;text&#39;, inputDigest: digestOf({ surface: &#39;text&#39;, text: &#39;unknown&#39; }) }, text: toExactText(&#39;vivim.unknown… |
| laneG | const | 591 | no | const laneG: Integration2Composition[&#39;laneG&#39;] = { |
| catalogDigest | const | 607 | no | const catalogDigest = digestOf({ catalog: &#39;fixture.host-catalog&#39;, version: HOST_CATALOG_VERSION }); |
| host | const | 608 | no | const host = createHostCapabilityFixture({ catalogVersion: HOST_CATALOG_VERSION, catalogDigest, actions: [ { |
| hostContext | const | 624 | no | const hostContext = { |
| deniedContext | const | 653 | no | const deniedContext = { ...hostContext, grant: null }; |
| capability | const | 654 | no | const capability = host.describeForPrincipal(deniedContext, HOST_ACTION_ID); |
| hostCommand | const | 655 | no | const hostCommand = { |
| prepared | const | 662 | no | const prepared = host.prepare(hostCommand, hostContext); |
| denied | const | 663 | no | const denied = host.prepare(hostCommand, deniedContext); |
| approved | const | 664 | no | const approved = prepared.kind === &#39;prepared_inert&#39; |
| laneH | const | 671 | no | const laneH: Integration2Composition[&#39;laneH&#39;] = { |
| broker | const | 705 | no | const broker = mutableFixtureBroker(fixtureTrustedContext()); |
| knowledge | const | 706 | no | const knowledge = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), broker.broker, { now: () =&gt; NOW_MS }); |
| boundPage | const | 707 | no | const boundPage = await knowledge.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-i2-bound&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| boundItem | const | 716 | no | const boundItem = boundPage.items[0]; |
| boundProjection | const | 717 | no | const boundProjection = projectKnowledgePage(boundPage); |
| crossOwnerPage | const | 718 | no | const crossOwnerPage = await knowledge.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-i2-cross&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| afterTombstone | const | 728 | no | const afterTombstone = await knowledge.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-i2-tombstone&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| laneF | const | 737 | no | const laneF: Integration2Composition[&#39;laneF&#39;] = { |
| recovery | const | 756 | no | const recovery = projectRecovery({ authority: &#39;host&#39;, stage: &#39;denied&#39;, operationKind: &#39;host_effect&#39;, reasonCode: laneH.denied.reasonCode, |
| help | const | 766 | no | const help = projectCapabilityHelp( { actionId: capability.actionId, title: &#39;Preview shared project path&#39;, explanation: &#39;Inerts the shared project path against the owner-scoped knowledge record.&#39;, |
| laneE | const | 800 | no | const laneE: Integration2Composition[&#39;laneE&#39;] = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../document/validate.ts | import | 18 | [packages/tierflow/src/visual-runtime/document/validate.ts](../document/validate.ts.md) |
| ../document/schema.ts | import | 19 | [packages/tierflow/src/visual-runtime/document/schema.ts](../document/schema.ts.md) |
| ../components/catalog.ts | import | 20 | [packages/tierflow/src/visual-runtime/components/catalog.ts](../components/catalog.ts.md) |
| ../components/layout.ts | import | 21 | [packages/tierflow/src/visual-runtime/components/layout.ts](../components/layout.ts.md) |
| ../render/dom.ts | import | 22 | [packages/tierflow/src/visual-runtime/render/dom.ts](../render/dom.ts.md) |
| ../render/inspect.ts | import | 23 | [packages/tierflow/src/visual-runtime/render/inspect.ts](../render/inspect.ts.md) |
| ../command/compile.ts | import | 24 | [packages/tierflow/src/visual-runtime/command/compile.ts](../command/compile.ts.md) |
| ../command/crosswalk.ts | import | 25 | [packages/tierflow/src/visual-runtime/command/crosswalk.ts](../command/crosswalk.ts.md) |
| ../knowledge/client.ts | import | 26 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../knowledge/client.ts.md) |
| ../knowledge/fixtures.ts | import | 27 | [packages/tierflow/src/visual-runtime/knowledge/fixtures.ts](../knowledge/fixtures.ts.md) |
| ../knowledge/projection.ts | import | 28 | [packages/tierflow/src/visual-runtime/knowledge/projection.ts](../knowledge/projection.ts.md) |
| ../revisions/fixture-store.ts | import | 29 | [packages/tierflow/src/visual-runtime/revisions/fixture-store.ts](../revisions/fixture-store.ts.md) |
| ../host/fixture.ts | import | 30 | [packages/tierflow/src/visual-runtime/host/fixture.ts](../host/fixture.ts.md) |
| ../experience/recovery.ts | import | 31 | [packages/tierflow/src/visual-runtime/experience/recovery.ts](../experience/recovery.ts.md) |
| ../experience/help.ts | import | 32 | [packages/tierflow/src/visual-runtime/experience/help.ts](../experience/help.ts.md) |
| ./action-adapter.mjs | import | 33 | [packages/tierflow/src/visual-runtime/integration-2/action-adapter.mjs](./action-adapter.mjs.md) |
| ../../ui/hash.ts | import | 34 | [packages/tierflow/src/ui/hash.ts](../../ui/hash.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/visual-runtime/integration-2/compose.test.ts](../../../tests/visual-runtime/integration-2/compose.test.ts.md) | ../../../src/visual-runtime/integration-2/compose.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 2 / Integration 2 — REAL cross-lane composition over the Lane A–H modules.
 *
 * Integrator-owned path (see WAVE-3-OWNERSHIP.md: `src/visual-runtime/integration-2/**`).
 * This module never writes into a lane-owned path and never re-implements a lane:
 * every value below is produced by calling the committed lane module itself.
 *
 * Evidence level: every lane call is a real in-process call against the real
 * committed module. There are no mocks, no stubs and no re-implementations here.
 * The fixtures are synthetic and inert: no live Host, KB, Studio, Android,
 * provider browser or device is contacted, and no file is written.
 *
 * The composition measures seams instead of papering over them. Where two lanes
 * genuinely disagree (notably A -> B), the disagreement is recorded as a measured
 * refusal with its exact code and reason. Repairing that seam belongs to the
 * lane that owns the contract (Lane B's Wave 3 canonical map), not to this file.
 */
import { validateUiDocument } from '../document/validate.ts';
import { UI_DOCUMENT_SCHEMA } from '../document/schema.ts';
import { inspectComponent } from '../components/catalog.ts';
import { resolveLayout } from '../components/layout.ts';
import { renderUiDocument } from '../render/dom.ts';
import { inspectRenderPlan, snapshotRenderPlan } from '../render/inspect.ts';
import { compileVisualCommand, toExactText } from '../command/compile.ts';
import { resolveCrosswalk, checkArguments, type ActionDescriptor, type CrosswalkRow } from '../command/crosswalk.ts';
import { createFixtureKnowledgeClient } from '../knowledge/client.ts';
import { canonicalKnowledgeFixtures, fixtureTrustedContext, mutableFixtureBroker } from '../knowledge/fixtures.ts';
import { projectKnowledgePage } from '../knowledge/projection.ts';
import { UiRevisionFixtureStore } from '../revisions/fixture-store.ts';
import { createHostCapabilityFixture } from '../host/fixture.ts';
import { projectRecovery } from '../experience/recovery.ts';
import { projectCapabilityHelp } from '../experience/help.ts';
import { projectInertActionRefs } from './action-adapter.mjs';
import { canonicalJson, sha256Hex } from '../../ui/hash.ts';

export const COMPOSITION_SCHEMA = 'vivim.integration-2-composition/1' as const;

/** Lane F's own fixture id for the record this document binds to (FIXTURE_IDS.alpha). */
const KNOWLEDGE_STABLE_ID = 'kn_8f3a0c71';
/** Lane G's canonical semantic id (SEMANTIC_ID shape: name@version). */
const SEMANTIC_ID = 'vivim.preview@1';
/** Lane H's host catalog action id (ACTION_ID shape). */
const HOST_ACTION_ID = 'vivim.preview';
const HOST_CATALOG_VERSION = 1;
/** Lane A's registered action reference id/version. */
const ACTION_REF_ID = 'fixture.preview';
const ACTION_REF_VERSION = 1;
/** Cross-lane version pins shared by Lane G's compile context and Lane H's context. */
const HOST_WORLD = 'world-1';
const POLICY_REVISION = 'policy-1';
const KB_VERSION = 'kb-1';
const UI_REVISION = 'rev-1';
const NOW_MS = 1_792_000_000_000;
const SESSION_TTL_MS = 60_000;

const OWNER_REF = 'owner_a';
const ACTOR_REF = 'actor_a';
const DEVICE_REF = 'desktop_1';
const SESSION_REF = 'session_1';
const WORLD_REF = 'world_a';
const DOCUMENT_ID = 'doc.integration2';

const digestOf = (value: unknown): string => sha256Hex(canonicalJson(value));

/**
 * The one canonical Lane A document used by every leg of the composition.
 * It is authored against Lane A's own schema, so Lane A is the authority for it.
 */
export const CANONICAL_DOCUMENT = {
  schema: UI_DOCUMENT_SCHEMA,
  documentId: DOCUMENT_ID,
  scope: { ownerRef: OWNER_REF, workspaceRef: WORLD_REF },
  revision: 1,
  rootId: 'root',
  nodes: [
    {
      id: 'root',
      type: 'stack',
      children: ['panel', 'grid-1', 'action-button'],
      props: { direction: 'vertical', gap: 'md' },
```

_First 80 of 837 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
