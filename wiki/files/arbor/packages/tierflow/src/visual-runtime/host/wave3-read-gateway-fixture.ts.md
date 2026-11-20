# File: packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9390 B |
| Lines | 152 |
| Hash | a980c0ac2905 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE3_HOST_READ_SCHEMA | const | 9 | yes | export const WAVE3_HOST_READ_SCHEMA = &#39;vivim.wave3-host-read-fixture/1&#39; as const; |
| Wave3HostReadState | type | 10 | yes | export type Wave3HostReadState = &#39;display_only&#39; \| &#39;denied&#39; \| &#39;uncertain&#39; \| &#39;observed_fixture_only&#39;; |
| Wave3HostReadKind | type | 11 | yes | export type Wave3HostReadKind = &#39;capability&#39; \| &#39;receipt&#39; \| &#39;ui_effect_refused&#39;; |
| Wave3HostReadResult | interface | 14 | yes | export interface Wave3HostReadResult { |
| source | const | 38 | no | const source = Object.freeze({authority: &#39;tierflow-host-fixture&#39;, proof: &#39;fixture_only&#39;, liveHostVerified: false} as const); |
| own | function | 39 | no | const own = (value: unknown): value is Record&lt;string, unknown&gt; =&gt; value !== null &amp;&amp; |
| ref | function | 42 | no | const ref = (value: unknown): value is string =&gt; typeof value === &#39;string&#39; &amp;&amp; |
| same | function | 44 | no | const same = (a: unknown, b: unknown): boolean =&gt; ref(a) &amp;&amp; a === b; |
| readGuard | function | 47 | no | function readGuard(c: TrustedFixtureHostContext): string \| null { |
| g | const | 54 | no | const g = c.grant; |
| recoveryFor | function | 70 | no | const recoveryFor = (stage: &#39;denied&#39; \| &#39;uncertain&#39;, reasonCode: string): RecoveryView =&gt; |
| result | function | 74 | no | function result(kind: Wave3HostReadKind, state: Wave3HostReadState, reasonCode: string, extra: Pick&lt;Wave3HostReadResult, &#39;capability&#39; \| &#39;receipt&#39;&gt; = {}): Wave3HostReadResult { |
| recovery | const | 77 | no | const recovery = recoveryFor(state === &#39;denied&#39; ? &#39;denied&#39; : &#39;uncertain&#39;, reasonCode); |
| accessibility | const | 78 | no | const accessibility: Wave3HostReadResult[&#39;accessibility&#39;] = { |
| createWave3ReadGatewayFixture | function | 90 | yes | export function createWave3ReadGatewayFixture(options: HostFixtureOptions) { |
| port | const | 91 | no | const port = createHostCapabilityFixture(options); |
| readCapability | function | 93 | no | function readCapability(context: TrustedFixtureHostContext, actionId: string): Wave3HostReadResult { |
| blocked | const | 94 | no | const blocked = readGuard(context); |
| v | const | 97 | no | const v = port.describeForPrincipal(context, actionId); |
| capability | const | 99 | no | const capability = { |
| riskDenied | const | 105 | no | const riskDenied = v.risk === &#39;R3&#39; ? &#39;R3_REFUSED&#39; : |
| readReceiptStatus | function | 117 | no | function readReceiptStatus(context: TrustedFixtureHostContext, claim: HostClaimSnapshot, observation: HostReceiptObservation \| null): Wave3HostReadResult { |
| blocked | const | 119 | no | const blocked = readGuard(context); |
| cap | const | 128 | no | const cap = readCapability(context, claim.actionId); |
| o | const | 134 | no | const o = port.reconcileClaimReadOnly(claim, observation, context); |
| refuseUiEffect | function | 147 | no | function refuseUiEffect(_untrustedInput: unknown): Wave3HostReadResult { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./fixture.ts | import | 2 | [packages/tierflow/src/visual-runtime/host/fixture.ts](./fixture.ts.md) |
| ../experience/recovery.ts | import | 3 | [packages/tierflow/src/visual-runtime/experience/recovery.ts](../experience/recovery.ts.md) |
| ./port.ts | import | 4 | [packages/tierflow/src/visual-runtime/host/port.ts](./port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts](../experience/wave4-onboarding-resume.ts.md) | ../host/wave3-read-gateway-fixture.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../host/wave3-read-gateway-fixture.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/host/wave3-read-gateway-fixture.ts |
| [packages/tierflow/tests/visual-runtime/wave3-h-host.test.ts](../../../tests/visual-runtime/wave3-h-host.test.ts.md) | ../../src/visual-runtime/host/wave3-read-gateway-fixture.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Wave 3 H: display-only Host projection. This module has no live gateway or effect path. */
import {createHostCapabilityFixture, type HostFixtureOptions} from './fixture.ts';
import {projectRecovery, type RecoveryView} from '../experience/recovery.ts';
import type {
  HostActionOutcome, HostCapabilityView, HostClaimSnapshot,
  HostReceiptObservation, TrustedFixtureHostContext,
} from './port.ts';

export const WAVE3_HOST_READ_SCHEMA = 'vivim.wave3-host-read-fixture/1' as const;
export type Wave3HostReadState = 'display_only' | 'denied' | 'uncertain' | 'observed_fixture_only';
export type Wave3HostReadKind = 'capability' | 'receipt' | 'ui_effect_refused';

/** No tokens, principal identifiers, mutable plans or raw journal bodies leave this projection. */
export interface Wave3HostReadResult {
  readonly schema: typeof WAVE3_HOST_READ_SCHEMA;
  readonly kind: Wave3HostReadKind;
  readonly state: Wave3HostReadState;
  readonly reasonCode: string;
  readonly effectInvoked: false;
  readonly canExecute: false;
  readonly automaticRetryAllowed: false;
  readonly source: Readonly<{authority: 'tierflow-host-fixture'; proof: 'fixture_only'; liveHostVerified: false}>;
  readonly capability?: Readonly<Pick<HostCapabilityView,
    'actionId' | 'risk' | 'catalogVersion' | 'catalogDigest' | 'supportedByBuild' |
    'availableNow' | 'permittedForActor' | 'verifiedByEvidence' | 'reasonCodes'>>;
  /** An observation is never presented as a confirmed live action or signed Host receipt. */
  readonly receipt?: Readonly<{
    reportedStatus: HostActionOutcome['status'];
    signatureState: HostActionOutcome['signatureState'];
    verification: 'synthetic_test_only';
  }>;
  readonly recovery: RecoveryView;
  readonly accessibility: Readonly<{
    role: 'status' | 'alert'; initialFocus: 'recovery-heading'; textEquivalent: string;
  }>;
}

const source = Object.freeze({authority: 'tierflow-host-fixture', proof: 'fixture_only', liveHostVerified: false} as const);
const own = (value: unknown): value is Record<string, unknown> => value !== null &&
  typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const ref = (value: unknown): value is string => typeof value === 'string' &&
  /^[A-Za-z0-9_.:-]{1,160}$/.test(value);
const same = (a: unknown, b: unknown): boolean => ref(a) && a === b;

/** Contexts are synthetic BROKER inputs. A caller cannot prove Host identity by manufacturing one. */
function readGuard(c: TrustedFixtureHostContext): string | null {
  if (!own(c) || c.schema !== 'fixture.trusted-host-context/1' || c.authenticated !== true ||
      ![c.ownerRef, c.actorRef, c.deviceRef, c.sessionRef, c.worldRef].every(ref))
    return 'AUTHENTICATED_PRINCIPAL_REQUIRED';
  if (!Number.isSafeInteger(c.nowMs) || !Number.isSafeInteger(c.sessionExpiresAtMs) ||
      c.nowMs >= c.sessionExpiresAtMs) return 'SESSION_EXPIRED';
  if (c.surface !== 'desktop' && c.surface !== 'phone') return 'SURFACE_INVALID';
  const g = c.grant;
  if (!own(g)) return 'GRANT_MISSING';
  if (g.status === 'revoked') return 'GRANT_REVOKED';
  if (g.status !== 'active') return 'GRANT_NOT_ACTIVE';
  if (!Number.isSafeInteger(g.expiresAtMs) || c.nowMs >= g.expiresAtMs) return 'GRANT_EXPIRED';
  if (!ref(g.grantRef) || !ref(g.revision) ||
      !same(g.ownerRef, c.ownerRef) || !same(g.actorRef, c.actorRef) ||
      !same(g.deviceRef, c.deviceRef) || !same(g.sessionRef, c.sessionRef) ||
      !same(g.worldRef, c.worldRef)) return 'GRANT_PRINCIPAL_MISMATCH';
  if (!Array.isArray(g.scopes) || !g.scopes.every(ref) || !g.scopes.includes('control:read'))
    return 'READ_SCOPE_DENIED';
  if (!ref(c.worldRevision) || !ref(c.policyRevision) || !/^[a-f0-9]{64}$/.test(c.catalogDigest) ||
      !Number.isSafeInteger(c.catalogVersion) || c.catalogVersion < 1) return 'SOURCE_CONTEXT_INVALID';
  return null;
}

const recoveryFor = (stage: 'denied' | 'uncertain', reasonCode: string): RecoveryView =>
  projectRecovery({authority: 'host', stage, operationKind: 'host_effect', reasonCode,
    offline: false, canCancel: false, canRequestUndo: false, statusCheckedByAuthority: false});

function result(kind: Wave3HostReadKind, state: Wave3HostReadState, reasonCode: string,
  extra: Pick<Wave3HostReadResult, 'capability' | 'receipt'> = {}): Wave3HostReadResult {
  // Even a positive synthetic status has an *uncertain live-effect* recovery path.
  const recovery = recoveryFor(state === 'denied' ? 'denied' : 'uncertain', reasonCode);
  const accessibility: Wave3HostReadResult['accessibility'] = {
    role: state === 'denied' || state === 'uncertain' ? 'alert' : 'status',
    initialFocus: 'recovery-heading', textEquivalent: 'Check Host status read only; never retry an effect automatically',
```

_First 80 of 153 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
