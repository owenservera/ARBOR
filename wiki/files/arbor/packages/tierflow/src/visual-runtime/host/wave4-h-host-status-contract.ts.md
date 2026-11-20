# File: packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts |
| Language | TypeScript |
| Kind | source |
| Size | 16421 B |
| Lines | 270 |
| Hash | c055f24dd383 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE4_HOST_STATUS_SCHEMA | const | 8 | yes | export const WAVE4_HOST_STATUS_SCHEMA = &#39;vivim.wave4-host-status/1&#39; as const; |
| Wave4HostState | type | 9 | yes | export type Wave4HostState = &#39;available&#39; \| &#39;permitted&#39; \| &#39;pending_approval&#39; \| &#39;denied&#39; \| |
| HostPurpose | type | 11 | yes | export type HostPurpose = &#39;founder_workspace&#39; \| &#39;recovery&#39; \| &#39;owner_audit&#39;; |
| ReceiptState | type | 12 | yes | export type ReceiptState = &#39;none&#39; \| &#39;claimed_unconfirmed&#39; \| &#39;reported_applied&#39; \| |
| HostReadScope | interface | 15 | yes | export interface HostReadScope { |
| HostStatusQuery | interface | 42 | yes | export interface HostStatusQuery { |
| HostPlanRead | interface | 53 | yes | export interface HostPlanRead { |
| Wave4HostReadPort | interface | 82 | yes | export interface Wave4HostReadPort { |
| Wave4HostStatus | interface | 91 | yes | export interface Wave4HostStatus { |
| ref | function | 113 | no | const ref = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-zA-Z0-9_.:-]{1,160}$/.test(v); |
| digest | function | 114 | no | const digest = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(v); |
| exact | function | 118 | no | const exact = (a: unknown, b: unknown): boolean =&gt; ref(a) &amp;&amp; a === b; |
| purposes | const | 119 | no | const purposes: readonly HostPurpose[] = [&#39;founder_workspace&#39;,&#39;recovery&#39;,&#39;owner_audit&#39;]; |
| identity | const | 120 | no | const identity = [&#39;ownerRef&#39;,&#39;actorRef&#39;,&#39;worldRef&#39;,&#39;deviceRef&#39;,&#39;sessionRef&#39;] as const; |
| scopeError | function | 122 | no | function scopeError(s: HostReadScope \| null, purpose: HostPurpose): string \| null { |
| grant | const | 130 | no | const grant = s.grant; |
| planError | function | 143 | no | function planError(p: HostPlanRead, s: HostReadScope, q: HostStatusQuery, risk: HostRisk): string \| null { |
| receiptError | function | 159 | no | function receiptError(r: NonNullable&lt;HostPlanRead[&#39;receipt&#39;]&gt;, p: HostPlanRead): string \| null { |
| createWave4HostStatusContract | function | 176 | yes | export function createWave4HostStatusContract(port: Wave4HostReadPort) { |
| project | function | 177 | no | function project(state: Wave4HostState, reasonCode: string, details: Partial&lt;Pick&lt;Wave4HostStatus,&#39;actionId&#39;\|&#39;risk&#39;\|&#39;availability&#39;\|&#39;permission&#39;\|&#39;approval&#39;\|&#39;receiptState&#39;\|&#39;receiptVerification&#39;&gt;&gt; = {})… |
| stage | const | 179 | no | const stage = state === &#39;denied&#39; ? &#39;denied&#39; : state === &#39;pending_approval&#39; ? &#39;pending&#39; : |
| recovery | const | 181 | no | const recovery = projectRecovery({authority:&#39;host&#39;,stage,operationKind:&#39;host_effect&#39;, reasonCode,offline:false,canCancel:false,canRequestUndo:false,statusCheckedByAuthority:false}); |
| readStatus | function | 194 | no | function readStatus(query: HostStatusQuery): Wave4HostStatus { |
| scope | variable | 201 | no | let scope: HostReadScope \| null; |
| blocked | const | 203 | no | const blocked = scopeError(scope,query.purpose); |
| cap | variable | 210 | no | let cap: HostCapabilityView \| null; |
| d | const | 221 | no | const d = {actionId:query.actionId,risk:cap.risk,availability:cap.availableNow, |
| p | variable | 233 | no | let p: HostPlanRead \| null; |
| error | const | 238 | no | const error = planError(p,scope,query,cap.risk); |
| r | const | 250 | no | const r = p.receipt; |
| verified | variable | 258 | no | let verified = false; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../experience/recovery.ts | import | 5 | [packages/tierflow/src/visual-runtime/experience/recovery.ts](../experience/recovery.ts.md) |
| ./port.ts | import | 6 | [packages/tierflow/src/visual-runtime/host/port.ts](./port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../final-wave/integration/master.ts.md) | ../../host/wave4-h-host-status-contract.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-e/host-journey.ts](../final-wave/lane-e/host-journey.ts.md) | ../../host/wave4-h-host-status-contract.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../host/wave4-h-host-status-contract.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/host/wave4-h-host-status-contract.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-e/host-journey.test.ts](../../../tests/visual-runtime/final-wave/lane-e/host-journey.test.ts.md) | ../../../../src/visual-runtime/host/wave4-h-host-status-contract.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/host/wave4-h-host-status-contract.ts |
| [packages/tierflow/tests/visual-runtime/wave4-h-host-status.test.ts](../../../tests/visual-runtime/wave4-h-host-status.test.ts.md) | ../../src/visual-runtime/host/wave4-h-host-status-contract.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Wave 4 H — typed, inert projection of Host-owned reads; never an effect gateway.
 * The broker/Host adapter MUST authenticate scope and verify signatures. A caller-supplied
 * object or TierFlow fixture is not authentication, a grant, or proof of execution.
 */
import {projectRecovery, type RecoveryView} from '../experience/recovery.ts';
import type {HostCapabilityView, HostRisk, HostSurface} from './port.ts';

export const WAVE4_HOST_STATUS_SCHEMA = 'vivim.wave4-host-status/1' as const;
export type Wave4HostState = 'available' | 'permitted' | 'pending_approval' | 'denied' |
  'uncertain' | 'applied' | 'verified';
export type HostPurpose = 'founder_workspace' | 'recovery' | 'owner_audit';
export type ReceiptState = 'none' | 'claimed_unconfirmed' | 'reported_applied' |
  'verified_by_host' | 'reported_failed' | 'uncertain';

export interface HostReadScope {
  readonly schema: 'vivim.host-authorized-read-scope/1';
  readonly authenticated: boolean;
  readonly ownerRef: string;
  readonly actorRef: string;
  readonly worldRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly surface: HostSurface;
  readonly purpose: HostPurpose;
  readonly nowMs: number;
  readonly sessionExpiresAtMs: number;
  readonly worldRevision: string;
  readonly policyRevision: string;
  readonly catalogVersion: number;
  readonly catalogDigest: string;
  /** Must be fetched fresh, not cached on the device. */
  readonly grant: null | Readonly<{
    grantRef: string; revision: string;
    status: 'active' | 'pending' | 'expired' | 'revoked';
    ownerRef: string; actorRef: string; worldRef: string; deviceRef: string; sessionRef: string;
    purpose: HostPurpose;
    expiresAtMs: number;
    scopes: readonly string[];
  }>;
}

export interface HostStatusQuery {
  readonly actionId: string;
  readonly purpose: HostPurpose;
  readonly planId?: string;
  readonly expected: Readonly<{
    worldRevision: string; policyRevision: string;
    catalogVersion: number; catalogDigest: string;
  }>;
}

/** A normalized read of the existing exclusive Host journal. Never accepted from UI text. */
export interface HostPlanRead {
  readonly schema: 'vivim.wave4-host-plan-read/1';
  readonly planId: string; readonly planDigest: string; readonly actionId: string;
  readonly risk: HostRisk;
  readonly ownerRef: string; readonly actorRef: string; readonly worldRef: string;
  readonly deviceRef: string; readonly sessionRef: string; readonly purpose: HostPurpose;
  readonly grantRef: string; readonly grantRevision: string;
  readonly worldRevision: string; readonly policyRevision: string;
  readonly catalogVersion: number; readonly catalogDigest: string;
  readonly expiresAtMs: number;
  readonly state: 'planned' | 'approved' | 'claimed' | 'receipt' | 'denied';
  readonly claimed: boolean;
  readonly receipt: null | Readonly<{
    schema: 'vivim.control-receipt/1';
    planId: string; planDigest: string; actionId: string;
    status: 'applied' | 'failed' | 'uncertain';
    /** A general journal is unsigned. Signature claims inside this object are untrusted. */
    evidence: 'unsigned_general_journal' | 'signed_host_envelope';
    receiptRef: string;
    signatureEnvelope?: Readonly<{keyId: string; signatureBase64: string}>;
    worldRevision: string; policyRevision: string;
    ownerRef: string; actorRef: string; worldRef: string;
    deviceRef: string; sessionRef: string; purpose: HostPurpose;
  }>;
}

/** Only the existing authenticated Host may implement this read port. No execute/send.
 * `authenticated_host` is an integration CLAIM until a live owner-approved adapter exists.
```

_First 80 of 271 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
