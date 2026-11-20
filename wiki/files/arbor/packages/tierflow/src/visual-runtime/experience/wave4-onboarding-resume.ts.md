# File: packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts |
| Language | TypeScript |
| Kind | source |
| Size | 16983 B |
| Lines | 268 |
| Hash | 1bd52df21dc2 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE4_ONBOARDING_SCHEMA | const | 10 | yes | export const WAVE4_ONBOARDING_SCHEMA = &#39;vivim.wave4-founder-onboarding/1&#39; as const; |
| SAFE_QR_ACCESSIBLE_NAME | const | 11 | yes | export const SAFE_QR_ACCESSIBLE_NAME = |
| Shell | type | 14 | yes | export type Shell = &#39;desktop&#39; \| &#39;android&#39;; |
| Truth | type | 15 | yes | export type Truth = &#39;yes&#39; \| &#39;no&#39; \| &#39;unknown&#39;; |
| Stage | type | 16 | yes | export type Stage = &#39;install&#39; \| &#39;pair&#39; \| &#39;readiness&#39; \| &#39;projects&#39; \| &#39;help&#39; \| &#39;action&#39; \| &#39;disconnect&#39; \| &#39;resume&#39;; |
| PairTokenStatus | type | 17 | yes | export type PairTokenStatus = &#39;none&#39; \| &#39;issued&#39; \| &#39;redeemed&#39; \| &#39;expired&#39; \| &#39;replayed&#39;; |
| ActionState | type | 18 | yes | export type ActionState = &#39;none&#39; \| &#39;pending&#39; \| &#39;denied&#39; \| &#39;uncertain&#39; \| &#39;failed&#39; \| &#39;applied-verified&#39;; |
| SafeIntent | type | 19 | yes | export type SafeIntent = &#39;open-contextual-help&#39; \| &#39;return-to-workspace&#39; \| &#39;cancel-local&#39; \| |
| JourneyPrincipal | interface | 22 | yes | export interface JourneyPrincipal { |
| HostJourneyEvidence | interface | 29 | yes | export interface HostJourneyEvidence { |
| PairJourneyEvidence | interface | 43 | yes | export interface PairJourneyEvidence { |
| ProviderJourneyEvidence | interface | 52 | yes | export interface ProviderJourneyEvidence { |
| ActionJourneyEvidence | interface | 58 | yes | export interface ActionJourneyEvidence { |
| ReconnectJourneyEvidence | interface | 67 | yes | export interface ReconnectJourneyEvidence { |
| Wave4OnboardingInput | interface | 74 | yes | export interface Wave4OnboardingInput { |
| JourneyAction | interface | 90 | yes | export interface JourneyAction { |
| Wave4OnboardingView | interface | 96 | yes | export interface Wave4OnboardingView { |
| ID | const | 123 | no | const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| RECEIPT | const | 124 | no | const RECEIPT = /^[A-Za-z][A-Za-z0-9._:-]{0,99}$/; |
| SECRET_OR_UNSAFE | const | 125 | no | const SECRET_OR_UNSAFE = /(?:[a-f0-9]{64}\|[A-Za-z0-9_-]{42,}\|&lt;\|&gt;\|&amp;lt;\|&amp;gt;\|https?:\\/\\/\|javascript:\|data:\|onerror\\s*=\|onclick\\s*=\|(?:bearer\|token\|secret\|password\|authorization)\\s*[:=])/i; |
| validId | function | 126 | no | const validId = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; ID.test(v) &amp;&amp; |
| safeLabel | function | 128 | no | const safeLabel = (v: unknown, max: number): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; |
| freshness | function | 130 | no | const freshness = (observedAt: number, now: number, maxAge: number): boolean =&gt; |
| samePrincipal | function | 132 | no | const samePrincipal = (a: JourneyPrincipal \| undefined, b: JourneyPrincipal): boolean =&gt; |
| action | function | 135 | no | const action = (intent: SafeIntent, label: string): JourneyAction =&gt; |
| textFor | function | 137 | no | const textFor = (state: ActionState): string =&gt; ({ none: &#39;No authoritative outcome has been observed.&#39;, pending: &#39;The action is pending; check the Host before doing anything else.&#39;, denied: &#39;The Host… |
| projectWave4OnboardingResume | function | 147 | yes | export function projectWave4OnboardingResume(input: Wave4OnboardingInput): Wave4OnboardingView { |
| host | const | 157 | no | const host = input.host; |
| trustedHost | const | 158 | no | const trustedHost = !!host &amp;&amp; host.source === &#39;host&#39; &amp;&amp; host.connected &amp;&amp; |
| connected | const | 161 | no | const connected = trustedHost; |
| pairing | const | 162 | no | const pairing = input.pairing; |
| exactPairing | const | 163 | no | const exactPairing = !!pairing &amp;&amp; pairing.source === &#39;host&#39; &amp;&amp; samePrincipal(pairing.principal, p); |
| tokenStatus | const | 164 | no | const tokenStatus: PairTokenStatus = exactPairing &amp;&amp; |
| expiredToken | const | 166 | no | const expiredToken = tokenStatus === &#39;issued&#39; &amp;&amp; |
| tokenStatusDisplayed | const | 168 | no | const tokenStatusDisplayed = expiredToken ? &#39;expired&#39; : tokenStatus; |
| paired | const | 169 | no | const paired: Truth = !connected ? &#39;unknown&#39; : exactPairing &amp;&amp; pairing.enrollment === &#39;active&#39; &amp;&amp; |
| provider | const | 171 | no | const provider = input.provider; |
| tabReady | const | 172 | no | const tabReady: Truth = !connected ? &#39;unknown&#39; : provider?.proof === &#39;tab_ready&#39; \|\| |
| signedIn | const | 174 | no | const signedIn: Truth = !connected ? &#39;unknown&#39; : provider?.source === &#39;studio&#39; &amp;&amp; |
| grant | const | 176 | no | const grant = host?.grant; |
| permitted | const | 177 | no | const permitted: Truth = !connected ? &#39;unknown&#39; : grant?.status === &#39;active&#39; &amp;&amp; grant.ownerApproved &amp;&amp; |
| reconnect | const | 181 | no | const reconnect = input.reconnect; |
| exactReconnect | const | 182 | no | const exactReconnect = !!reconnect &amp;&amp; reconnect.source === &#39;host&#39; &amp;&amp; samePrincipal(reconnect.principal, p) &amp;&amp; |
| mustResnapshot | const | 184 | no | const mustResnapshot = !connected \|\| (exactReconnect &amp;&amp; reconnect.state === &#39;resnapshot-required&#39;) \|\| |
| resumeAllowed | const | 186 | no | const resumeAllowed = connected &amp;&amp; !mustResnapshot &amp;&amp; exactReconnect &amp;&amp; reconnect.state === &#39;reconciled&#39; &amp;&amp; |
| outcome | const | 188 | no | const outcome = input.action; |
| exactOutcome | const | 189 | no | const exactOutcome = connected &amp;&amp; !!outcome &amp;&amp; outcome.source === &#39;host&#39; &amp;&amp; samePrincipal(outcome.principal, p) &amp;&amp; |
| pendingTooLong | const | 191 | no | const pendingTooLong = !!outcome &amp;&amp; outcome.state === &#39;pending&#39; &amp;&amp; |
| actionState | variable | 193 | no | let actionState: ActionState = !exactOutcome ? &#39;none&#39; : outcome.state === &#39;applied&#39; |
| receiptVerified | const | 201 | no | const receiptVerified = actionState === &#39;applied-verified&#39;; |
| verified | const | 202 | no | const verified: Truth = !connected ? &#39;unknown&#39; : receiptVerified ? &#39;yes&#39; : &#39;no&#39;; |
| installed | const | 203 | no | const installed = input.shell === &#39;desktop&#39; ? input.installation.desktopReady &amp;&amp; input.installation.dedicatedBrowserReady : |
| doc | const | 206 | no | const doc = f.document; |
| authorizedProjects | const | 207 | no | const authorizedProjects = connected &amp;&amp; !mustResnapshot &amp;&amp; permitted === &#39;yes&#39; &amp;&amp; paired === &#39;yes&#39; &amp;&amp; |
| projectCards | const | 210 | no | const projectCards = authorizedProjects ? f.projects.slice(0, 8).filter(card =&gt; validId(card.stableId) &amp;&amp; safeLabel(card.title, 80) &amp;&amp; safeLabel(card.summary, 240) &amp;&amp; safeLabel(card.statusLabel, 120)… |
| canShowHelp | const | 215 | no | const canShowHelp = connected &amp;&amp; permitted === &#39;yes&#39; &amp;&amp; !!f.help.visible &amp;&amp; |
| help | const | 217 | no | const help = canShowHelp ? { visible: true, title: f.help.title, explanation: f.help.explanation, |
| stage | variable | 222 | no | let stage: Stage = !installed ? &#39;install&#39; : !connected ? &#39;disconnect&#39; : paired !== &#39;yes&#39; ? &#39;pair&#39; : |
| recoveryNeeded | const | 226 | no | const recoveryNeeded = !connected \|\| mustResnapshot \|\| f.onboarding.cancelled \|\| |
| recoveryReason | const | 228 | no | const recoveryReason = !connected ? &#39;Host disconnected; prior status is not current.&#39; : |
| recovery | const | 234 | no | const recovery = { needed: recoveryNeeded, reason: recoveryReason, mustResnapshot, |
| actions | const | 236 | no | const actions: JourneyAction[] = []; |
| recoveryHeading | const | 247 | no | const recoveryHeading = recoveryNeeded &amp;&amp; (stage === &#39;disconnect&#39; \|\| stage === &#39;resume&#39; \|\| [&#39;uncertain&#39;,&#39;pending&#39;,&#39;denied&#39;].includes(actionState)); |
| heading | const | 249 | no | const heading = recoveryHeading ? &#39;Recover Founder Workspace safely&#39; : ({ install: &#39;Prepare VIVIM on this device&#39;, pair: &#39;Pair your approved phone&#39;, readiness: &#39;Verify sign-in and owner permission&#39;, … |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./wave3-journey-fixture.ts | import | 7 | [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](./wave3-journey-fixture.ts.md) |
| ../host/wave3-read-gateway-fixture.ts | import | 8 | [packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts](../host/wave3-read-gateway-fixture.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/first-edit.ts](../final-wave/lane-c/first-edit.ts.md) | ../../experience/wave4-onboarding-resume.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../experience/wave4-onboarding-resume.ts |
| [packages/tierflow/tests/visual-runtime/wave4-e-onboarding-resume.test.ts](../../../tests/visual-runtime/wave4-e-onboarding-resume.test.ts.md) | ../../src/visual-runtime/experience/wave4-onboarding-resume.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 4 E — one read-only Founder Workspace onboarding/resumption projection.
 * This is NOT a second onboarding store, pairing verifier, Host publisher, or action executor.
 * Inputs must come from trusted, owner-scoped existing Host/Studio brokers. Raw HTTP JSON,
 * QR URLs and UI assertions must never be promoted into these trusted inputs.
 */
import type { FounderJourneyView } from './wave3-journey-fixture.ts';
import type { Wave3HostReadResult } from '../host/wave3-read-gateway-fixture.ts';

export const WAVE4_ONBOARDING_SCHEMA = 'vivim.wave4-founder-onboarding/1' as const;
export const SAFE_QR_ACCESSIBLE_NAME =
  'Scan using the VIVIM Android app to start private pairing. This code is temporary and single-use.';

export type Shell = 'desktop' | 'android';
export type Truth = 'yes' | 'no' | 'unknown';
export type Stage = 'install' | 'pair' | 'readiness' | 'projects' | 'help' | 'action' | 'disconnect' | 'resume';
export type PairTokenStatus = 'none' | 'issued' | 'redeemed' | 'expired' | 'replayed';
export type ActionState = 'none' | 'pending' | 'denied' | 'uncertain' | 'failed' | 'applied-verified';
export type SafeIntent = 'open-contextual-help' | 'return-to-workspace' | 'cancel-local' |
  'inspect-host-status' | 'request-new-pairing' | 'resume-from-authority';

export interface JourneyPrincipal {
  readonly ownerRef: string;
  readonly worldRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
}
/** A trusted Host reader must bind this snapshot to the current session and grant. */
export interface HostJourneyEvidence {
  readonly source: 'host';
  readonly principal: JourneyPrincipal;
  readonly connected: boolean;
  readonly observedAtMs: number;
  readonly worldRevision: string;
  readonly grant: {
    readonly status: 'active' | 'pending' | 'expired' | 'revoked' | 'none';
    readonly ownerApproved: boolean;
    readonly expiresAtMs: number;
    readonly scopes: readonly string[];
  };
}
/** QR redemption alone is not enrollment or a device authorization. No raw token is needed. */
export interface PairJourneyEvidence {
  readonly source: 'host';
  readonly principal: JourneyPrincipal;
  readonly enrollment: 'active' | 'enrollment-required' | 'none' | 'revoked';
  readonly enrollmentExpiresAtMs: number;
  readonly tokenStatus: PairTokenStatus;
  readonly tokenExpiresAtMs?: number;
  /** Untrusted raw token extensions, if present at runtime, are deliberately ignored. */
}
export interface ProviderJourneyEvidence {
  readonly source: 'studio' | 'ui';
  readonly proof: 'provider_authenticated' | 'tab_ready' | 'signed_out' | 'unknown';
  readonly observedAtMs: number;
}
/** The Host receipt reader, not Wave 3 H's synthetic fixture, supplies receipt truth. */
export interface ActionJourneyEvidence {
  readonly source: 'host';
  readonly principal: JourneyPrincipal;
  readonly state: 'none' | 'pending' | 'denied' | 'uncertain' | 'failed' | 'applied';
  readonly observedAtMs: number;
  readonly worldRevision: string;
  readonly signatureState: 'verified' | 'unsigned' | 'unknown' | 'invalid';
  readonly receiptRef?: string;
}
export interface ReconnectJourneyEvidence {
  readonly source: 'host';
  readonly principal: JourneyPrincipal;
  readonly state: 'not-needed' | 'resnapshot-required' | 'reconciled';
  readonly worldRevision: string;
  readonly observedAtMs: number;
}
export interface Wave4OnboardingInput {
  readonly shell: Shell;
  readonly viewportPx: number;
  readonly nowMs: number;
  readonly principal: JourneyPrincipal;
  /** Real Wave 3 E projection; it is synthetic, not live provider evidence. */
  readonly founder: FounderJourneyView;
```

_First 80 of 269 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
