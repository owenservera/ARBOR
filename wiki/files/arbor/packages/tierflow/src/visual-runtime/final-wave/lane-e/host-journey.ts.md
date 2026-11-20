# File: packages/tierflow/src/visual-runtime/final-wave/lane-e/host-journey.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/lane-e/host-journey.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9020 B |
| Lines | 142 |
| Hash | 992e3c966654 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LANE_E_SCHEMA | const | 12 | yes | export const LANE_E_SCHEMA = &#39;vivim.final-wave.host-journey/1&#39; as const; |
| LaneERoute | type | 13 | yes | export type LaneERoute = &#39;host-control&#39; \| &#39;legacy-phone-build&#39;; |
| LaneEPhase | type | 14 | yes | export type LaneEPhase = &#39;unavailable&#39; \| &#39;available&#39; \| &#39;permitted_read_only&#39; \| |
| LaneEJourney | interface | 18 | yes | export interface LaneEJourney { |
| phases | const | 38 | no | const phases: Readonly&lt;Record&lt;string, LaneEPhase&gt;&gt; = Object.freeze({ available: &#39;available&#39;, permitted: &#39;permitted_read_only&#39;, pending_approval: &#39;awaiting_owner&#39;, denied: &#39;denied&#39;, uncertain: &#39;uncert… |
| validRisks | const | 43 | no | const validRisks = [&#39;R0&#39;,&#39;R1&#39;,&#39;R2&#39;,&#39;R3&#39;]; |
| receiptStates | const | 44 | no | const receiptStates = [&#39;none&#39;,&#39;claimed_unconfirmed&#39;,&#39;reported_applied&#39;,&#39;verified_by_host&#39;,&#39;reported_failed&#39;,&#39;uncertain&#39;]; |
| verificationStates | const | 45 | no | const verificationStates = [&#39;not_present&#39;,&#39;unsigned&#39;,&#39;unverified&#39;,&#39;host_verified&#39;]; |
| safeCodes | const | 46 | no | const safeCodes = /^[A-Z][A-Z0-9_]{0,95}$/; |
| projectLaneEHostJourney | function | 51 | yes | export function projectLaneEHostJourney( status: Wave4HostStatus, surface: HostSurface, route: LaneERoute = &#39;host-control&#39;, ): LaneEJourney { |
| s | const | 56 | no | const s = status as unknown as Record&lt;string, unknown&gt; \| null; |
| source | const | 57 | no | const source = s &amp;&amp; typeof s.source === &#39;object&#39; &amp;&amp; s.source !== null &amp;&amp; |
| trustworthyShape | const | 59 | no | const trustworthyShape = Boolean(s &amp;&amp; s.schema === &#39;vivim.wave4-host-status/1&#39; &amp;&amp; s.effectInvoked === false &amp;&amp; s.canExecute === false &amp;&amp; s.automaticRetryAllowed === false &amp;&amp; source?.authority === &#39;ho… |
| validRoute | const | 67 | no | const validRoute = route === &#39;host-control&#39; \|\| route === &#39;legacy-phone-build&#39;; |
| validSurface | const | 68 | no | const validSurface = surface === &#39;desktop&#39; \|\| surface === &#39;phone&#39;; |
| phase | variable | 71 | no | let phase: LaneEPhase = trustworthyShape ? (phases[s!.state as string] ?? &#39;denied&#39;) : &#39;denied&#39;; |
| reasonCode | variable | 72 | no | let reasonCode = trustworthyShape ? s!.reasonCode as string : &#39;UNTRUSTED_STATUS_PROJECTION&#39;; |
| risk | const | 73 | no | const risk = trustworthyShape &amp;&amp; validRisks.includes(String(s!.risk)) ? s!.risk as LaneEJourney[&#39;risk&#39;] : &#39;unknown&#39;; |
| receiptTruth | variable | 74 | no | let receiptTruth: LaneEJourney[&#39;receiptTruth&#39;] = &#39;none&#39;; |
| verified | const | 81 | no | const verified = trustworthyShape &amp;&amp; s!.state === &#39;verified&#39; &amp;&amp; |
| approval | const | 106 | no | const approval: LaneEJourney[&#39;approval&#39;] = phase === &#39;awaiting_owner&#39; ? &#39;pending&#39; : |
| next | const | 110 | no | const next: LaneEJourney[&#39;next&#39;] = phase === &#39;denied&#39; &amp;&amp; risk === &#39;R2&#39; &amp;&amp; surface === &#39;phone&#39; ? &#39;desktop_owner&#39; : |
| text | const | 113 | no | const text = phase === &#39;host_attested&#39; ? &#39;Host reports a verified receipt. This screen cannot execute actions.&#39; : |
| createLaneEHostReadProjection | function | 130 | yes | export function createLaneEHostReadProjection( wave4: Readonly&lt;{readStatus(query: HostStatusQuery): Wave4HostStatus}&gt;, ) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../host/wave4-h-host-status-contract.ts | import | 7 | [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](../../host/wave4-h-host-status-contract.ts.md) |
| ../../host/port.ts | import | 10 | [packages/tierflow/src/visual-runtime/host/port.ts](../../host/port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../integration/master.ts.md) | ../lane-e/host-journey.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-e/host-journey.test.ts](../../../../tests/visual-runtime/final-wave/lane-e/host-journey.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-e/host-journey.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Final Wave Lane E: inert, Host-bound presentation of permission and effect truth.
 * NOT an approval, executor, journal, broker or live Host attestation.
 * The trusted Host supplies the Wave 4 read port and cryptographic verifier.
 * Never route a browser/provider command through this module.
 */
import type {
  HostStatusQuery, Wave4HostStatus,
} from '../../host/wave4-h-host-status-contract.ts';
import type {HostSurface} from '../../host/port.ts';

export const LANE_E_SCHEMA = 'vivim.final-wave.host-journey/1' as const;
export type LaneERoute = 'host-control' | 'legacy-phone-build';
export type LaneEPhase = 'unavailable' | 'available' | 'permitted_read_only' |
  'awaiting_owner' | 'approved_not_claimed' | 'claimed_unconfirmed' |
  'reported_applied' | 'host_attested' | 'reported_failed' | 'uncertain' | 'denied';

export interface LaneEJourney {
  readonly schema: typeof LANE_E_SCHEMA;
  readonly phase: LaneEPhase;
  readonly reasonCode: string;
  readonly risk: 'R0' | 'R1' | 'R2' | 'R3' | 'unknown';
  readonly approval: 'none' | 'pending' | 'approved' | 'denied';
  readonly receiptTruth: 'none' | 'claim_only' | 'unsigned' | 'unverified' | 'host_attested';
  readonly provenance: 'synthetic_fixture' | 'host_port_claim_unproven';
  readonly route: LaneERoute;
  readonly routeGate: 'host_only' | 'legacy_unfenced';
  readonly next: 'inspect_host' | 'desktop_owner' | 'owner_reconcile' | 'no_action';
  readonly accessibility: Readonly<{role: 'status' | 'alert'; text: string}>;
  readonly effectInvoked: false;
  readonly canApprove: false;
  readonly canExecute: false;
  readonly canRetry: false;
  readonly canPublish: false;
  readonly liveHostAcceptance: 'unproven';
}

const phases: Readonly<Record<string, LaneEPhase>> = Object.freeze({
  available: 'available', permitted: 'permitted_read_only',
  pending_approval: 'awaiting_owner', denied: 'denied',
  uncertain: 'uncertain', applied: 'reported_applied', verified: 'host_attested',
});
const validRisks = ['R0','R1','R2','R3'];
const receiptStates = ['none','claimed_unconfirmed','reported_applied','verified_by_host','reported_failed','uncertain'];
const verificationStates = ['not_present','unsigned','unverified','host_verified'];
const safeCodes = /^[A-Z][A-Z0-9_]{0,95}$/;

/** Pure display projection. All inputs are read-only observations, never authority.
 * No owner/device/plan/receipt identifiers, bearer tokens or args are copied out.
 */
export function projectLaneEHostJourney(
  status: Wave4HostStatus,
  surface: HostSurface,
  route: LaneERoute = 'host-control',
): LaneEJourney {
  const s = status as unknown as Record<string, unknown> | null;
  const source = s && typeof s.source === 'object' && s.source !== null &&
    !Array.isArray(s.source) ? s.source as Record<string, unknown> : null;
  const trustworthyShape = Boolean(s && s.schema === 'vivim.wave4-host-status/1' &&
    s.effectInvoked === false && s.canExecute === false && s.automaticRetryAllowed === false &&
    source?.authority === 'host-read-port' && source.liveHostAcceptance === 'unproven' &&
    ['synthetic_fixture','authenticated_host'].includes(String(source.evidenceClass)) &&
    typeof s.state === 'string' && Object.hasOwn(phases,s.state) &&
    typeof s.reasonCode === 'string' && safeCodes.test(s.reasonCode) &&
    receiptStates.includes(String(s.receiptState)) &&
    verificationStates.includes(String(s.receiptVerification)));
  const validRoute = route === 'host-control' || route === 'legacy-phone-build';
  const validSurface = surface === 'desktop' || surface === 'phone';
  // `phases[s.state]` is defined whenever trustworthyShape holds (Object.hasOwn was
  // checked above), so the fallback is unreachable and only satisfies the type.
  let phase: LaneEPhase = trustworthyShape ? (phases[s!.state as string] ?? 'denied') : 'denied';
  let reasonCode = trustworthyShape ? s!.reasonCode as string : 'UNTRUSTED_STATUS_PROJECTION';
  const risk = trustworthyShape && validRisks.includes(String(s!.risk)) ? s!.risk as LaneEJourney['risk'] : 'unknown';
  let receiptTruth: LaneEJourney['receiptTruth'] = 'none';
  if (trustworthyShape && s!.receiptState === 'claimed_unconfirmed') receiptTruth = 'claim_only';
  if (trustworthyShape && s!.receiptState === 'reported_applied')
    receiptTruth = s!.receiptVerification === 'unsigned' ? 'unsigned' : 'unverified';
  if (trustworthyShape && s!.receiptState === 'uncertain') receiptTruth = 'unverified';
  if (trustworthyShape && s!.receiptState === 'reported_failed') receiptTruth = 'unverified';
  // A signed flag, plan field or displayed receipt is never cryptographic proof.
```

_First 80 of 143 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
