# File: packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts |
| Language | TypeScript |
| Kind | source |
| Size | 17837 B |
| Lines | 266 |
| Hash | 1d751036374e |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FOUNDER_JOURNEY_SCHEMA | const | 19 | yes | export const FOUNDER_JOURNEY_SCHEMA = &#39;vivim.founder-journey-fixture/1&#39; as const; |
| ID | const | 20 | no | const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| safeId | function | 21 | no | const safeId = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; ID.test(v) &amp;&amp; ![&#39;__proto__&#39;, &#39;constructor&#39;, &#39;prototype&#39;].includes(v); |
| safeProvenanceText | function | 22 | no | const safeProvenanceText = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; v.length &gt; 0 &amp;&amp; |
| safeProjectedText | function | 24 | no | const safeProjectedText = (v: string): boolean =&gt; !/(?:&amp;lt;\|&amp;gt;\|&lt;\|&gt;\|javascript:\|data:\|https?:\\/\\/\|onerror\\s*=\|onclick\\s*=)/i.test(v); |
| FounderJourneyInput | interface | 26 | yes | export interface FounderJourneyInput { |
| FounderProject | interface | 48 | yes | export interface FounderProject { |
| FounderCommandPreview | interface | 58 | yes | export interface FounderCommandPreview { |
| FounderJourneyView | interface | 65 | yes | export interface FounderJourneyView { |
| alignedKnowledgeScope | function | 89 | no | function alignedKnowledgeScope(k: TrustedKnowledgeContext \| null, h: TrustedFixtureHostContext, nowMs: number): k is TrustedKnowledgeContext { |
| sameScope | function | 97 | no | function sameScope(a: TrustedKnowledgeContext, b: TrustedKnowledgeContext): boolean { |
| emptyDocument | function | 105 | no | function emptyDocument(input: FounderJourneyInput): UiDocument { |
| toDocument | function | 116 | no | function toDocument(input: FounderJourneyInput, items: readonly KnowledgeItem[], cards: readonly KnowledgeCard[]): UiDocument { |
| base | const | 117 | no | const base = emptyDocument(input); |
| byId | const | 118 | no | const byId = new Map(cards.map(card =&gt; [card.stableId, card])); |
| nodes | const | 119 | no | const nodes: UiDocumentNode[] = []; |
| bindings | const | 120 | no | const bindings: UiDocumentBinding[] = []; |
| card | const | 122 | no | const card = byId.get(item.stableId); |
| n | const | 125 | no | const n = `project_${nodes.length + 1}`; |
| b | const | 126 | no | const b = `binding_${nodes.length + 1}`; |
| title | const | 127 | no | const title = card.title.slice(0, 80); |
| description | const | 128 | no | const description = `${card.statusLabel} \| Source version: ${card.sourceVersion}`.slice(0, 240); |
| safeHelp | function | 137 | no | function safeHelp(capability: HostCapabilityView, item: KnowledgeItem \| undefined, revision: string \| null, nowMs: number): HelpView { |
| yesNoUnknown | function | 138 | no | const yesNoUnknown = (value: &#39;yes&#39; \| &#39;no&#39; \| &#39;unknown&#39;): &#39;yes&#39; \| &#39;no&#39; \| &#39;unknown&#39; =&gt; value; |
| d | const | 139 | no | const d: CapabilityDescriptor = { |
| projectFounderWorkspaceJourney | function | 160 | yes | export async function projectFounderWorkspaceJourney(input: FounderJourneyInput): Promise&lt;FounderJourneyView&gt; { |
| onboarding | const | 166 | no | const onboarding = projectJourney(input.onboardingState, input.onboardingEvidence, input.nowMs); |
| cancelled | const | 167 | no | const cancelled = transitionJourney(input.onboardingState, &#39;cancel&#39;, input.onboardingEvidence, input.nowMs); |
| resumed | const | 168 | no | const resumed = transitionJourney(cancelled.state, &#39;resume&#39;, input.onboardingEvidence, input.nowMs); |
| navigation | const | 169 | no | const navigation: FounderJourneyView[&#39;navigation&#39;] = { |
| before | const | 175 | no | const before = input.knowledgeBroker.readContext(); |
| pages | variable | 176 | no | let pages: readonly KnowledgePage[] = []; |
| state | variable | 177 | no | let state: FounderJourneyView[&#39;state&#39;] = &#39;denied&#39;; |
| after | const | 183 | no | const after = input.knowledgeBroker.readContext(); |
| revisionList | const | 194 | no | const revisionList = pages.map(p =&gt; p.projectionRevision).filter((x): x is string =&gt; x !== null); |
| items | const | 198 | no | const items = pages.flatMap(page =&gt; page.items).filter((item): item is KnowledgeItem =&gt; item.visibility === &#39;visible&#39; &amp;&amp; input.projectStableIds.includes(item.stableId) &amp;&amp; [&#39;present&#39;, &#39;stale&#39;, &#39;unknow… |
| cards | const | 204 | no | const cards = pages.flatMap(page =&gt; projectKnowledgePage(page).cards); |
| document | const | 205 | no | const document = validateUiDocument(toDocument(input, items, cards)); |
| render | const | 206 | no | const render = renderUiDocument(document.ok ? document.document : null, { viewportPx: input.viewportPx }); |
| visibleItems | const | 207 | no | const visibleItems = document.ok &amp;&amp; render.status !== &#39;unavailable&#39; ? items : []; |
| visibleCards | const | 208 | no | const visibleCards = new Map(cards.map(card =&gt; [card.stableId, card])); |
| projects | const | 209 | no | const projects: FounderProject[] = visibleItems.map(item =&gt; { const card = visibleCards.get(item.stableId)!; const prior = input.earlierSourceVersions?.[item.stableId]; return { stableId: item.stable… |
| card | const | 210 | no | const card = visibleCards.get(item.stableId)!; |
| prior | const | 211 | no | const prior = input.earlierSourceVersions?.[item.stableId]; |
| compilation | const | 223 | no | const compilation = projects.length &gt; 0 &amp;&amp; state !== &#39;denied&#39; &amp;&amp; state !== &#39;unavailable&#39; |
| candidate | const | 225 | no | const candidate = compilation?.outcome === &#39;candidate&#39; ? compilation.command : null; |
| target | const | 226 | no | const target = candidate?.args.target; |
| usable | const | 227 | no | const usable = !!candidate &amp;&amp; candidate.target.owner === &#39;host_effect&#39; &amp;&amp; |
| commandPreview | const | 229 | no | const commandPreview: FounderCommandPreview \| null = usable &amp;&amp; candidate ? { |
| commandRefusal | const | 236 | no | const commandRefusal = commandPreview ? null : !compilation ? &#39;NO_AUTHORIZED_KNOWLEDGE&#39; : |
| hostDecision | const | 239 | no | const hostDecision: FounderJourneyView[&#39;hostDecision&#39;] = commandPreview &amp;&amp; candidate ? (() =&gt; { const result = input.host.prepare({ schema: &#39;vivim.visual-command/1&#39;, commandId: candidate.commandId, t… |
| result | const | 240 | no | const result = input.host.prepare({ schema: &#39;vivim.visual-command/1&#39;, commandId: candidate.commandId, target: { owner: &#39;host_effect&#39;, actionId: candidate.target.actionId, catalogVersion: candidate.ta… |
| capability | const | 250 | no | const capability = input.host.describeForPrincipal(input.hostContext, candidate?.target.actionId ?? &#39;vivim.preview&#39;); |
| matchingItem | const | 252 | no | const matchingItem = projects.length &amp;&amp; commandPreview ? visibleItems.find(item =&gt; item.stableId === target) : undefined; |
| help | const | 253 | no | const help = safeHelp(capability, matchingItem, revisionList[0] ?? null, input.nowMs); |
| recoveryStage | const | 254 | no | const recoveryStage: RecoveryStage = state === &#39;denied&#39; ? &#39;revoked&#39; : state === &#39;unavailable&#39; ? &#39;offline&#39; : |
| recovery | const | 256 | no | const recovery = projectRecovery({ authority: state === &#39;denied&#39; \|\| state === &#39;unavailable&#39; ? &#39;kb&#39; : &#39;host&#39;, stage: recoveryStage, operationKind: state === &#39;denied&#39; \|\| state === &#39;unavailable&#39; ? &#39;know… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../document/schema.ts | import | 6 | [packages/tierflow/src/visual-runtime/document/schema.ts](../document/schema.ts.md) |
| ../document/validate.ts | import | 7 | [packages/tierflow/src/visual-runtime/document/validate.ts](../document/validate.ts.md) |
| ../render/dom.ts | import | 8 | [packages/tierflow/src/visual-runtime/render/dom.ts](../render/dom.ts.md) |
| ../knowledge/projection.ts | import | 9 | [packages/tierflow/src/visual-runtime/knowledge/projection.ts](../knowledge/projection.ts.md) |
| ../knowledge/client.ts | import | 10 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../knowledge/client.ts.md) |
| ../command/compile.ts | import | 12 | [packages/tierflow/src/visual-runtime/command/compile.ts](../command/compile.ts.md) |
| ../command/ir.ts | import | 13 | [packages/tierflow/src/visual-runtime/command/ir.ts](../command/ir.ts.md) |
| ../host/port.ts | import | 14 | [packages/tierflow/src/visual-runtime/host/port.ts](../host/port.ts.md) |
| ./help.ts | import | 15 | [packages/tierflow/src/visual-runtime/experience/help.ts](./help.ts.md) |
| ./recovery.ts | import | 16 | [packages/tierflow/src/visual-runtime/experience/recovery.ts](./recovery.ts.md) |
| ./onboarding.ts | import | 17 | [packages/tierflow/src/visual-runtime/experience/onboarding.ts](./onboarding.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts](./wave4-onboarding-resume.ts.md) | ./wave3-journey-fixture.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../experience/wave3-journey-fixture.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/experience/wave3-journey-fixture.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/experience/wave3-journey-fixture.ts |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../../tests/visual-runtime/wave3-e-experience.test.ts.md) | ../../src/visual-runtime/experience/wave3-journey-fixture.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 3 Lane E — inert, synthetic Founder Workspace composition.
 * No live KB/Host/provider access, execution, permission minting or persistent UI writes.
 * Real Wave 2 modules retain authority for knowledge, document, rendering, command and Host decisions.
 */
import { UI_DOCUMENT_SCHEMA, type UiDocument, type UiDocumentNode, type UiDocumentBinding } from '../document/schema.ts';
import { validateUiDocument, type UiDocumentValidation } from '../document/validate.ts';
import { renderUiDocument, type RenderPlan } from '../render/dom.ts';
import { projectKnowledgePage, type KnowledgeCard } from '../knowledge/projection.ts';
import { KNOWLEDGE_QUERY_SCHEMA, type KnowledgeClient, type KnowledgeItem, type KnowledgePage,
  type TrustedKnowledgeBroker, type TrustedKnowledgeContext } from '../knowledge/client.ts';
import { compileVisualCommand, toExactText, type CompileContext } from '../command/compile.ts';
import type { CommandInput, VisualCommand } from '../command/ir.ts';
import type { HostCapabilityPort, TrustedFixtureHostContext, HostCapabilityView } from '../host/port.ts';
import { projectCapabilityHelp, type HelpView, type CapabilityDescriptor } from './help.ts';
import { projectRecovery, type RecoveryView, type RecoveryStage } from './recovery.ts';
import { projectJourney, transitionJourney, type JourneyState, type JourneyView, type OnboardingEvidence } from './onboarding.ts';

export const FOUNDER_JOURNEY_SCHEMA = 'vivim.founder-journey-fixture/1' as const;
const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const safeId = (v: unknown): v is string => typeof v === 'string' && ID.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
const safeProvenanceText = (v: unknown): v is string => typeof v === 'string' && v.length > 0 &&
  v.length <= 160 && !/[<>\u0000-\u001f\u007f]|(?:javascript:|data:|https?:\/\/|onerror\s*=|onclick\s*=)/i.test(v);
const safeProjectedText = (v: string): boolean => !/(?:&lt;|&gt;|<|>|javascript:|data:|https?:\/\/|onerror\s*=|onclick\s*=)/i.test(v);

export interface FounderJourneyInput {
  /** The same trusted broker instance used by knowledgeClient, injected outside the UI. */
  readonly knowledgeBroker: TrustedKnowledgeBroker;
  readonly knowledgeClient: KnowledgeClient;
  readonly host: HostCapabilityPort;
  /** Host fixture context injected by test harness, NEVER copied from a browser request. */
  readonly hostContext: TrustedFixtureHostContext;
  readonly workspaceRef: string;
  readonly documentId: string;
  readonly requestId: string;
  /** Exact stable IDs, not user-provided labels or unscoped search results. */
  readonly projectStableIds: readonly string[];
  /** Read-only comparison baseline; differences are cues, not source-confirmed changes. */
  readonly earlierSourceVersions?: Readonly<Record<string, string>>;
  readonly commandInput: CommandInput;
  readonly commandContext: CompileContext;
  readonly hostCatalogDigest: string;
  readonly onboardingState: JourneyState;
  readonly onboardingEvidence: OnboardingEvidence;
  readonly viewportPx: number;
  readonly nowMs: number;
}
export interface FounderProject {
  readonly stableId: string;
  readonly title: string;
  readonly summary: string;
  readonly availability: KnowledgeItem['availability'];
  readonly statusLabel: string;
  readonly changeCue: 'no-baseline' | 'same-version' | 'version-diff-unverified';
  readonly source: Readonly<{ authority: string; nativeVersion: string; digest: string; evidenceRefs: readonly string[]; asOf: string }>;
  readonly interactive: false;
}
export interface FounderCommandPreview {
  readonly kind: 'typed-inert-candidate';
  readonly command: Readonly<Pick<VisualCommand, 'schema' | 'semanticRef' | 'target' | 'args' | 'risk' | 'sourceVersions'>>;
  readonly exactText: string;
  readonly authorization: 'not-granted';
  readonly effectInvoked: false;
}
export interface FounderJourneyView {
  readonly schema: typeof FOUNDER_JOURNEY_SCHEMA;
  readonly evidenceClass: 'synthetic-real-module-fixture';
  readonly state: 'ready' | 'partial' | 'empty' | 'denied' | 'unavailable';
  readonly projects: readonly FounderProject[];
  readonly knowledgeRevisions: readonly string[];
  readonly document: UiDocumentValidation;
  readonly render: RenderPlan;
  readonly commandPreview: FounderCommandPreview | null;
  readonly commandRefusal: string | null;
  readonly hostDecision: Readonly<{ kind: 'denied' | 'prepared_inert' | 'not_evaluated'; reasonCode: string | null; effectInvoked: false }>;
  readonly help: HelpView;
  readonly onboarding: JourneyView;
  readonly recovery: RecoveryView;
  readonly navigation: Readonly<{
    openHelp: 'open-contextual-help'; textHelpQuery: string;
```

_First 80 of 266 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
