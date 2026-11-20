# File: packages/tierflow/src/visual-runtime/experience/onboarding.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/experience/onboarding.ts |
| Language | TypeScript |
| Kind | source |
| Size | 10923 B |
| Lines | 164 |
| Hash | 29ffcd7132c2 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ONBOARDING_SCHEMA | const | 2 | yes | export const ONBOARDING_SCHEMA = &#39;OnboardingJourney/1&#39; as const; |
| PAIRING_QR_ACCESSIBLE_NAME | const | 3 | yes | export const PAIRING_QR_ACCESSIBLE_NAME = |
| PRIVACY_EXPLANATION | const | 5 | yes | export const PRIVACY_EXPLANATION = |
| StepId | type | 8 | yes | export type StepId = &#39;privacy&#39; \| &#39;desktop&#39; \| &#39;provider&#39; \| &#39;owner&#39; \| &#39;pairing&#39; \| |
| Readiness | type | 10 | yes | export type Readiness = &#39;yes&#39; \| &#39;no&#39; \| &#39;unknown&#39;; |
| StepStatus | type | 11 | yes | export type StepStatus = &#39;ready&#39; \| &#39;blocked&#39; \| &#39;completed&#39; \| &#39;skipped&#39; \| &#39;locked&#39;; |
| OnboardingEvent | type | 12 | yes | export type OnboardingEvent = &#39;acknowledge_privacy&#39; \| &#39;next&#39; \| &#39;back&#39; \| &#39;skip&#39; \| &#39;cancel&#39; \| &#39;resume&#39; \| &#39;help&#39;; |
| JourneyState | interface | 13 | yes | export interface JourneyState { |
| OnboardingEvidence | interface | 21 | yes | export interface OnboardingEvidence { |
| StepAction | interface | 39 | yes | export interface StepAction { |
| JourneyStep | interface | 44 | yes | export interface JourneyStep { |
| JourneyView | interface | 53 | yes | export interface JourneyView { |
| ORDER | const | 63 | no | const ORDER: readonly StepId[] = [ |
| TITLES | const | 66 | no | const TITLES: Record&lt;StepId, string&gt; = { |
| HELPS | const | 77 | no | const HELPS: Record&lt;StepId, string&gt; = { |
| at | function | 82 | no | const at = (s: StepId): number =&gt; ORDER.indexOf(s); |
| action | function | 83 | no | const action = (event: OnboardingEvent, label: string): StepAction =&gt; ({ event, label, textEquivalent: `onboarding ${event.replaceAll(&#39;_&#39;, &#39;-&#39;)}`, }); |
| newJourney | function | 86 | yes | export function newJourney(): JourneyState { |
| requirement | function | 89 | no | function requirement(id: StepId, state: JourneyState, ev: OnboardingEvidence, nowMs: number): string \| null { |
| projectJourney | function | 115 | yes | export function projectJourney(state: JourneyState, evidence: OnboardingEvidence, nowMs: number): JourneyView { |
| steps | const | 117 | no | const steps = ORDER.map((id): JourneyStep =&gt; { const problem = requirement(id, state, evidence, nowMs); const skipped = id === &#39;pairing&#39; &amp;&amp; state.pairingSkipped; const status: StepStatus = skipped ? … |
| problem | const | 118 | no | const problem = requirement(id, state, evidence, nowMs); |
| skipped | const | 119 | no | const skipped = id === &#39;pairing&#39; &amp;&amp; state.pairingSkipped; |
| status | const | 120 | no | const status: StepStatus = skipped ? &#39;skipped&#39; : problem === null ? &#39;completed&#39; |
| actions | const | 122 | no | const actions: StepAction[] = id !== state.current ? [] : state.cancelled ? [action(&#39;resume&#39;, &#39;Resume setup&#39;), action(&#39;help&#39;, &#39;Explain this step&#39;)] : [ |
| JourneyTransition | interface | 138 | yes | export interface JourneyTransition { readonly state: JourneyState; readonly accepted: boolean; readonly reason?: string } |
| transitionJourney | function | 140 | yes | export function transitionJourney( state: JourneyState, event: OnboardingEvent, evidence: OnboardingEvidence, nowMs: number, ): JourneyTransition { |
| missing | const | 158 | no | const missing = requirement(state.current, state, evidence, nowMs); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](./wave3-journey-fixture.ts.md) | ./onboarding.ts |
| [packages/tierflow/tests/visual-runtime/experience.test.ts](../../../tests/visual-runtime/experience.test.ts.md) | ../../src/visual-runtime/experience/onboarding.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/experience/onboarding.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/experience/onboarding.ts |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../../tests/visual-runtime/wave3-e-experience.test.ts.md) | ../../src/visual-runtime/experience/onboarding.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Inert, broker-sourced first-use projection. Not a login verifier or effect executor. */
export const ONBOARDING_SCHEMA = 'OnboardingJourney/1' as const;
export const PAIRING_QR_ACCESSIBLE_NAME =
  'Scan with the existing VIVIM mobile app to begin private device pairing. The code expires.';
export const PRIVACY_EXPLANATION =
  'VIVIM can keep its workspace data on this computer. Approved requests may be sent to signed-in AI provider websites in the dedicated browser, and authorized information may be shared with a paired phone. Review each permission and connection before continuing.';

export type StepId = 'privacy' | 'desktop' | 'provider' | 'owner' | 'pairing' |
  'discover' | 'preview' | 'receipt' | 'resume';
export type Readiness = 'yes' | 'no' | 'unknown';
export type StepStatus = 'ready' | 'blocked' | 'completed' | 'skipped' | 'locked';
export type OnboardingEvent = 'acknowledge_privacy' | 'next' | 'back' | 'skip' | 'cancel' | 'resume' | 'help';
export interface JourneyState {
  readonly schema: typeof ONBOARDING_SCHEMA;
  readonly current: StepId;
  readonly privacyAcknowledged: boolean;
  readonly pairingSkipped: boolean;
  readonly cancelled: boolean;
}
/** Evidence is supplied by a trusted integration broker; never accept it from browser JSON. */
export interface OnboardingEvidence {
  readonly desktop?: { readonly computerReady: Readiness; readonly dedicatedBrowserReady: Readiness };
  readonly provider?: {
    readonly source: 'studio' | 'other';
    readonly proof: 'provider_authenticated' | 'tab_ready' | 'unknown' | 'signed_out';
    readonly observedAtMs: number;
  };
  readonly owner?: { readonly source: 'host' | 'other'; readonly selectionConfirmed: Readiness };
  readonly phone?: { readonly source: 'host' | 'other'; readonly enrolled: Readiness; readonly permission: Readiness };
  readonly capability?: { readonly source: 'host' | 'ui' | 'other'; readonly supported: Readiness; readonly permitted: Readiness };
  readonly preview?: { readonly source: 'ui'; readonly safePreviewVerified: boolean };
  readonly outcome?: {
    readonly source: 'host' | 'ui' | 'other';
    readonly state: 'applied' | 'uncertain' | 'denied' | 'failed' | 'pending';
    readonly evidenceRef?: string;
  };
  readonly restart?: { readonly reconciled: boolean };
}
export interface StepAction {
  readonly event: OnboardingEvent;
  readonly label: string;
  readonly textEquivalent: string;
}
export interface JourneyStep {
  readonly id: StepId;
  readonly title: string;
  readonly status: StepStatus;
  readonly whyBlocked?: string;
  readonly helpTopic: string;
  readonly accessibleName: string;
  readonly actions: readonly StepAction[];
}
export interface JourneyView {
  readonly schema: typeof ONBOARDING_SCHEMA;
  readonly current: StepId;
  readonly cancelled: boolean;
  readonly progress: { readonly completed: number; readonly total: number };
  readonly steps: readonly JourneyStep[];
  readonly privacyExplanation: string;
  readonly pairingQrAccessibleName: string;
  readonly focus: { readonly regionRole: 'navigation'; readonly returnFocusTo: 'onboarding-current-step'; readonly statusLive: 'polite' };
}
const ORDER: readonly StepId[] = [
  'privacy', 'desktop', 'provider', 'owner', 'pairing', 'discover', 'preview', 'receipt', 'resume',
];
const TITLES: Record<StepId, string> = {
  privacy: 'Understand privacy and consent',
  desktop: 'Prepare this computer and the dedicated browser',
  provider: 'Verify provider sign-in',
  owner: 'Confirm your choice as owner',
  pairing: 'Pair your existing phone (optional)',
  discover: 'Find a supported, permitted action',
  preview: 'Review a safe preview',
  receipt: 'Inspect the committed outcome',
  resume: 'Check recovery and safe resumption',
};
const HELPS: Record<StepId, string> = {
  privacy: 'privacy-and-sharing', desktop: 'desktop-readiness', provider: 'provider-authentication',
  owner: 'owner-consent', pairing: 'phone-pairing', discover: 'capability-discovery',
  preview: 'preview-and-approval', receipt: 'outcome-and-receipts', resume: 'restart-and-recovery',
```

_First 80 of 165 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
