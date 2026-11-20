# File: packages/tierflow/src/visual-runtime/integration-3/compose.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/integration-3/compose.ts |
| Language | TypeScript |
| Kind | source |
| Size | 19267 B |
| Lines | 296 |
| Hash | ad7838bbe45a |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ID | const | 25 | no | const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| Phase | type | 26 | no | type Phase = &#39;F&#39; \| &#39;A&#39; \| &#39;B&#39; \| &#39;D&#39; \| &#39;G&#39; \| &#39;C&#39; \| &#39;H&#39; \| &#39;E&#39; \| &#39;SCOPE&#39;; |
| Integration3Result | type | 27 | yes | export type Integration3Result = |
| Integration3Input | interface | 43 | yes | export interface Integration3Input { |
| refuse | function | 71 | no | const refuse = (phase: Phase, code: string): Integration3Result =&gt; |
| sameCard | function | 73 | no | function sameCard(a: ScopedFeedCard, b: ScopedFeedCard): boolean { |
| aligned | function | 79 | no | function aligned(input: Integration3Input): boolean { |
| k | const | 80 | no | const k = input.founder.knowledgeBroker.readContext(); |
| h | const | 81 | no | const h = input.host.context, p = input.world.principal; |
| displayDocument | function | 98 | no | function displayDocument(input: Integration3Input, card: ScopedFeedCard): UiDocument { |
| title | const | 99 | no | const title = card.title.slice(0, 80); |
| identitiesAgree | function | 120 | no | function identitiesAgree( document: UiDocument, a: Extract&lt;ReturnType&lt;typeof projectWave3ActionSemantics&gt;, {ok: true}&gt;[&#39;value&#39;], b: Extract&lt;ReturnType&lt;typeof mapCanonicalComponents&gt;, {ok: true}&gt;[&#39;val… |
| composeIntegration3 | function | 154 | yes | export async function composeIntegration3(input: Integration3Input): Promise&lt;Integration3Result&gt; { |
| first | const | 161 | no | const first = await input.feed.poll(input.query); |
| card | const | 166 | no | const card = first.cards[0]; |
| document | const | 167 | no | const document = displayDocument(input, card); |
| pins | const | 168 | no | const pins: Wave3BindingPin[] = [{id: &#39;source&#39;, version: 1, nodeId: &#39;project&#39;, |
| knownActions | const | 170 | no | const knownActions = [input.display.action]; |
| a | const | 171 | no | const a = projectWave3ActionSemantics(document, { expectedRevision: input.display.revision, knownBindings: pins, knownActions, }); |
| b | const | 175 | no | const b = mapCanonicalComponents(a.value.canonical, {knownActions}); |
| viewports | const | 177 | no | const viewports = [] as {viewportPx: 320 \| 360 \| 1280; status: string; rootTag: string; focusCount: number}[]; |
| d | const | 179 | no | const d = renderWave3Semantics(a.value.canonical, {viewportPx, knownActions}); |
| results | const | 185 | no | const results = ([&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;] as const).map(modality =&gt; compileDescriptorProof(input.modalities[modality],input.descriptor)); |
| bad | const | 188 | no | const bad = results.find(x =&gt; x.outcome !== &#39;candidate&#39;)!; |
| text | const | 195 | no | const text=rText, touch=rTouch, keyboard=rKeyboard; |
| semantic | function | 196 | no | const semantic = (v: typeof text) =&gt; JSON.stringify({ semanticRef:v.command.semanticRef,target:v.command.target,args:v.command.args, risk:v.command.risk,sourceVersions:v.command.sourceVersions,capabi… |
| experience | const | 207 | no | const experience = await projectFounderWorkspaceJourney(input.founder); |
| selected | const | 208 | no | const selected = experience.projects.find(p =&gt; p.stableId === card.stableId); |
| fresh | const | 218 | no | const fresh = await input.feed.poll(input.query); |
| worldDocument | variable | 225 | no | let worldDocument: ReturnType&lt;typeof parseUiDocument&gt;; |
| p | const | 229 | no | const p = input.world.principal; |
| replay | const | 230 | no | const replay = new UiAtomicReplay({store:input.world.store,ownerRef:input.host.context.ownerRef, verifyPrincipal:input.world.verifyPrincipal}); |
| current | const | 232 | no | const current = replay.readCurrent(p,worldDocument.world.id); |
| revision | variable | 235 | no | let revision = current.value.revision; |
| committed | variable | 236 | no | let committed = false, ackLost = false, replayVerified = false; |
| draft | const | 238 | no | const draft = replay.createDraft(p,input.world.draftId,worldDocument.world.id,worldDocument); |
| preview | const | 240 | no | const preview = replay.preview(p,input.world.draftId); |
| command | const | 243 | no | const command: RevisionCommand = {commandId:input.world.commandId,documentId:worldDocument.world.id, |
| published | const | 249 | no | const published = replay.publish(p,command); |
| durable | const | 252 | no | const durable = replay.getCommandOutcome(p,&#39;publish&#39;,command); |
| ordered | const | 254 | no | const ordered = replay.replayCommitted(p,worldDocument.world.id,[{operation:&#39;publish&#39;,command}]); |
| host | const | 260 | no | const host = createWave3ReadGatewayFixture(input.host.options); |
| capability | const | 261 | no | const capability = host.readCapability(input.host.context,text.command.target.actionId); |
| receipt | const | 262 | no | const receipt = input.host.claim |
| noDispatch | const | 264 | no | const noDispatch = host.refuseUiEffect(text.command); |
| closingExperience | const | 271 | no | const closingExperience = await projectFounderWorkspaceJourney(input.founder); |
| closingProject | const | 272 | no | const closingProject = closingExperience.projects.find(p =&gt; p.stableId === card.stableId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../knowledge/wave3-feed-projection.ts | import | 10 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../knowledge/wave3-feed-projection.ts.md) |
| ../knowledge/client.ts | import | 11 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../knowledge/client.ts.md) |
| ../document/schema.ts | import | 12 | [packages/tierflow/src/visual-runtime/document/schema.ts](../document/schema.ts.md) |
| ../document/wave3-action-semantics.ts | import | 13 | [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](../document/wave3-action-semantics.ts.md) |
| ../components/wave3-canonical-map.ts | import | 14 | [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](../components/wave3-canonical-map.ts.md) |
| ../render/wave3-semantics.ts | import | 15 | [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../render/wave3-semantics.ts.md) |
| ../command/wave3-descriptor-proof.ts | import | 16 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../command/wave3-descriptor-proof.ts.md) |
| ../revisions/wave3-atomic-replay.ts | import | 17 | [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](../revisions/wave3-atomic-replay.ts.md) |
| ../revisions/port.ts | import | 18 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../revisions/port.ts.md) |
| ../../ui/world.ts | import | 19 | [packages/tierflow/src/ui/world.ts](../../ui/world.ts.md) |
| ../host/wave3-read-gateway-fixture.ts | import | 20 | [packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts](../host/wave3-read-gateway-fixture.ts.md) |
| ../host/fixture.ts | import | 21 | [packages/tierflow/src/visual-runtime/host/fixture.ts](../host/fixture.ts.md) |
| ../host/port.ts | import | 22 | [packages/tierflow/src/visual-runtime/host/port.ts](../host/port.ts.md) |
| ../experience/wave3-journey-fixture.ts | import | 23 | [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../experience/wave3-journey-fixture.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/integration-3/compose.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Integration 3: executable fixture composition over the REAL Wave 3 A-H modules.
 * No live route, Host executor, KB writer or replacement UI store. The trusted
 * caller must own the broker, seed the legacy World via its existing UiStore,
 * and explicitly opt into a reviewed UI-only CAS. Host effects remain refused.
 *
 * The persisted UiDocument/1 World is deliberately NEVER derived from, cast to,
 * or serialized as the distinct vivim.ui-document/1 display document.
 */
import type { ScopedKnowledgeFeed, ScopedFeedCard } from '../knowledge/wave3-feed-projection.ts';
import type { KnowledgeQuery } from '../knowledge/client.ts';
import { UI_DOCUMENT_SCHEMA, type UiActionReference, type UiDocument } from '../document/schema.ts';
import { projectWave3ActionSemantics, type Wave3BindingPin } from '../document/wave3-action-semantics.ts';
import { mapCanonicalComponents } from '../components/wave3-canonical-map.ts';
import { renderWave3Semantics } from '../render/wave3-semantics.ts';
import { compileDescriptorProof, type DescriptorProofContext } from '../command/wave3-descriptor-proof.ts';
import { UiAtomicReplay, type AtomicReplayStore } from '../revisions/wave3-atomic-replay.ts';
import type { VerifiedUiPrincipal, RevisionCommand } from '../revisions/port.ts';
import { parseUiDocument } from '../../ui/world.ts';
import { createWave3ReadGatewayFixture } from '../host/wave3-read-gateway-fixture.ts';
import type { HostFixtureOptions } from '../host/fixture.ts';
import type { HostClaimSnapshot, HostReceiptObservation, TrustedFixtureHostContext } from '../host/port.ts';
import { projectFounderWorkspaceJourney, type FounderJourneyInput } from '../experience/wave3-journey-fixture.ts';

const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
type Phase = 'F' | 'A' | 'B' | 'D' | 'G' | 'C' | 'H' | 'E' | 'SCOPE';
export type Integration3Result =
  | Readonly<{ ok: false; phase: Phase; code: string; effectInvoked: false; automaticRetryAllowed: false }>
  | Readonly<{
      ok: true;
      evidenceClass: 'synthetic-real-modules-not-live-acceptance';
      trace: readonly ['F','A','B','D','G','C','H','E'];
      documentId: string; documentRevision: number; documentDigest: string;
      identity: Readonly<{ canonicalNodes: number; mappedNodes: number; actions: number; bindings: number; exact: true }>;
      viewports: readonly { viewportPx: 320 | 360 | 1280; status: string; rootTag: string; focusCount: number }[];
      command: Readonly<{ actionId: string; risk: string; modalities: readonly ['text','touch','keyboard']; authorized: false }>;
      world: Readonly<{ schema: 'UiDocument/1'; worldId: string; revision: number; committed: boolean; ackLost: boolean; replayVerified: boolean }>;
      host: Readonly<{ state: string; reasonCode: string; receiptState: string | null; receiptReasonCode: string | null; effectInvoked: false }>;
      experience: Readonly<{ state: string; helpVisible: boolean; cancel: boolean; resume: boolean; focusReturn: string; automaticRetryAllowed: false }>;
      effectInvoked: false; automaticRetryAllowed: false;
    }>;

export interface Integration3Input {
  /** Created by Lane F from a trusted owner-scoped KnowledgeClient and broker. */
  readonly feed: ScopedKnowledgeFeed;
  readonly query: KnowledgeQuery;
  readonly founder: FounderJourneyInput;
  readonly display: Readonly<{
    documentId: string; workspaceRef: string; revision: number;
    selectedStableId: string; action: UiActionReference;
  }>;
  /** Catalog and HQ bytes and reviews are trusted EXTERNAL fixtures, never user input. */
  readonly descriptor: DescriptorProofContext;
  readonly modalities: Readonly<{ text: unknown; touch: unknown; keyboard: unknown }>;
  readonly world: Readonly<{
    store: AtomicReplayStore; principal: VerifiedUiPrincipal;
    verifyPrincipal: (principal: VerifiedUiPrincipal) => boolean;
    /** Separate prevalidated legacy World snapshot; never a Lane A display doc. */
    document: unknown;
    draftId: string; commandId: string;
    /** UI persistence only. It does not authorize any Host/provider effect. */
    reviewedUiPublish: boolean;
    /** Test-only fault injection to check the real SQLite journal. */
    fault?: 'beforeCommit' | 'afterCommitAckLoss';
  }>;
  readonly host: Readonly<{
    options: HostFixtureOptions; context: TrustedFixtureHostContext;
    claim?: HostClaimSnapshot; observation?: HostReceiptObservation | null;
  }>;
}
const refuse = (phase: Phase, code: string): Integration3Result =>
  Object.freeze({ok: false, phase, code, effectInvoked: false, automaticRetryAllowed: false});
function sameCard(a: ScopedFeedCard, b: ScopedFeedCard): boolean {
  return a.stableId === b.stableId && a.availability === 'present' && b.availability === 'present' &&
    a.source.authority === b.source.authority && a.source.nativeVersion === b.source.nativeVersion &&
    a.source.digest === b.source.digest &&
    JSON.stringify(a.evidenceRefs) === JSON.stringify(b.evidenceRefs);
}
function aligned(input: Integration3Input): boolean {
  const k = input.founder.knowledgeBroker.readContext();
```

_First 80 of 297 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
