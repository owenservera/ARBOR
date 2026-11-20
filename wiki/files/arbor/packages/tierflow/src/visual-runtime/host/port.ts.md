# File: packages/tierflow/src/visual-runtime/host/port.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/host/port.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6944 B |
| Lines | 171 |
| Hash | 21df3712fb42 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TriState | type | 2 | yes | export type TriState = &#39;yes&#39; \| &#39;no&#39; \| &#39;unknown&#39;; |
| HostRisk | type | 3 | yes | export type HostRisk = &#39;R0&#39; \| &#39;R1&#39; \| &#39;R2&#39; \| &#39;R3&#39;; |
| HostReadiness | type | 4 | yes | export type HostReadiness = &#39;verified&#39; \| &#39;source_wired&#39; \| &#39;adapter_pending&#39; \| &#39;enforcement_missing&#39; \| &#39;unsupported&#39;; |
| HostSurface | type | 5 | yes | export type HostSurface = &#39;desktop&#39; \| &#39;phone&#39;; |
| JsonArgument | type | 6 | yes | export type JsonArgument = string \| number \| boolean \| null; |
| ArgumentType | type | 7 | yes | export type ArgumentType = &#39;string&#39; \| &#39;number&#39; \| &#39;boolean&#39;; |
| ArgumentSpec | type | 8 | yes | export type ArgumentSpec = ArgumentType \| Readonly&lt;{type: ArgumentType \| &#39;enum&#39;; min?: number; max?: number; values?: readonly string[]}&gt;; |
| HostActionDescriptor | interface | 10 | yes | export interface HostActionDescriptor { |
| TrustedFixtureHostContext | interface | 22 | yes | export interface TrustedFixtureHostContext { |
| InertHostCommand | interface | 53 | yes | export interface InertHostCommand { |
| HostCapabilityView | interface | 61 | yes | export interface HostCapabilityView { |
| InertHostPlan | interface | 77 | yes | export interface InertHostPlan { |
| HostFixtureDenial | type | 104 | yes | export type HostFixtureDenial = Readonly&lt;{ |
| HostPrepareResult | type | 110 | yes | export type HostPrepareResult = HostFixtureDenial \| Readonly&lt;{ |
| InertApproval | interface | 113 | yes | export interface InertApproval { |
| HostApprovalResult | type | 118 | yes | export type HostApprovalResult = HostFixtureDenial \| Readonly&lt;{ |
| HostClaimSnapshot | interface | 123 | yes | export interface HostClaimSnapshot { |
| HostGeneralJournalReceipt | interface | 135 | yes | export interface HostGeneralJournalReceipt { |
| HostReceiptObservation | interface | 144 | yes | export interface HostReceiptObservation { |
| HostActionOutcome | interface | 154 | yes | export interface HostActionOutcome { |
| HostCapabilityPort | interface | 165 | yes | export interface HostCapabilityPort { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../command/wave3-descriptor-proof.ts.md) | ../host/port.ts |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../experience/wave3-journey-fixture.ts.md) | ../host/port.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-e/host-journey.ts](../final-wave/lane-e/host-journey.ts.md) | ../../host/port.ts |
| [packages/tierflow/src/visual-runtime/host/fixture.ts](./fixture.ts.md) | ./port.ts |
| [packages/tierflow/src/visual-runtime/host/outcome.ts](./outcome.ts.md) | ./port.ts |
| [packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts](./wave3-read-gateway-fixture.ts.md) | ./port.ts |
| [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](./wave4-h-host-status-contract.ts.md) | ./port.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../host/port.ts |
| [packages/tierflow/tests/visual-runtime/host-fixture.test.ts](../../../tests/visual-runtime/host-fixture.test.ts.md) | ../../src/visual-runtime/host/port.ts |
| [packages/tierflow/tests/visual-runtime/host-security.test.ts](../../../tests/visual-runtime/host-security.test.ts.md) | ../../src/visual-runtime/host/port.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/host/port.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/host/port.ts |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../../tests/visual-runtime/wave3-e-experience.test.ts.md) | ../../src/visual-runtime/host/port.ts |
| [packages/tierflow/tests/visual-runtime/wave3-h-host.test.ts](../../../tests/visual-runtime/wave3-h-host.test.ts.md) | ../../src/visual-runtime/host/port.ts |
| [packages/tierflow/tests/visual-runtime/wave4-h-host-status.test.ts](../../../tests/visual-runtime/wave4-h-host-status.test.ts.md) | ../../src/visual-runtime/host/port.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** HostCapabilityPort/1. Inert, source-backed TierFlow fixture contract; NOT a Host adapter. */
export type TriState = 'yes' | 'no' | 'unknown';
export type HostRisk = 'R0' | 'R1' | 'R2' | 'R3';
export type HostReadiness = 'verified' | 'source_wired' | 'adapter_pending' | 'enforcement_missing' | 'unsupported';
export type HostSurface = 'desktop' | 'phone';
export type JsonArgument = string | number | boolean | null;
export type ArgumentType = 'string' | 'number' | 'boolean';
export type ArgumentSpec = ArgumentType | Readonly<{type: ArgumentType | 'enum'; min?: number; max?: number; values?: readonly string[]}>;

export interface HostActionDescriptor {
  readonly actionId: string;
  readonly catalogVersion: number;
  readonly risk: HostRisk;
  readonly readiness: HostReadiness;
  readonly requiredScopes: readonly string[];
  readonly argsSchema: Readonly<Record<string, ArgumentSpec>>;
  readonly evidence: 'verified' | 'source_inspected' | 'unknown';
  readonly prerequisites: readonly string[];
}

/** Only the fixture's TEST caller may manufacture this broker-injected context. No user-command fields are trusted. */
export interface TrustedFixtureHostContext {
  readonly schema: 'fixture.trusted-host-context/1';
  readonly authenticated: boolean;
  readonly ownerRef: string;
  readonly actorRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly worldRef: string;
  readonly surface: HostSurface;
  readonly nowMs: number;
  readonly sessionExpiresAtMs: number;
  readonly worldRevision: string;
  readonly policyRevision: string;
  readonly catalogVersion: number;
  readonly catalogDigest: string;
  readonly availabilityByAction: Readonly<Record<string, TriState>>;
  readonly grant: null | Readonly<{
    grantRef: string;
    status: 'active' | 'revoked' | 'pending' | 'expired';
    ownerRef: string;
    actorRef: string;
    deviceRef: string;
    sessionRef: string;
    worldRef: string;
    expiresAtMs: number;
    revision: string;
    scopes: readonly string[];
  }>;
}

/** Visual-command subset: no claimed owner, device, approval or bearer fields. */
export interface InertHostCommand {
  readonly schema: 'vivim.visual-command/1';
  readonly commandId: string;
  readonly target: Readonly<{owner: 'host_effect'; actionId: string; catalogVersion: number}>;
  readonly args: Readonly<Record<string, JsonArgument>>;
  readonly sourceVersions: Readonly<{hostWorld: string; policy: string; catalogDigest: string}>;
}

export interface HostCapabilityView {
  readonly schema: 'vivim.host-capability/1';
  readonly actionId: string;
  readonly catalogVersion: number;
  readonly catalogDigest: string;
  readonly risk: HostRisk;
  readonly requiredScopes: readonly string[];
  readonly prerequisites: readonly string[];
  readonly supportedByBuild: TriState;
  readonly availableNow: TriState;
  readonly permittedForActor: TriState;
  readonly verifiedByEvidence: TriState;
  readonly reasonCodes: readonly string[];
  readonly source: Readonly<{authority: 'host-catalog-fixture'; observedAtMs: number; proof: 'fixture_only'}>;
}

export interface InertHostPlan {
  readonly schema: 'vivim.host-plan-fixture/1';
  readonly planId: string;
  readonly planDigest: string;
```

_First 80 of 172 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
