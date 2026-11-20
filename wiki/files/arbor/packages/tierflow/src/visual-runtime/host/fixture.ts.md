# File: packages/tierflow/src/visual-runtime/host/fixture.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/host/fixture.ts |
| Language | TypeScript |
| Kind | source |
| Size | 14390 B |
| Lines | 213 |
| Hash | 4519c91dcb68 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| deny | function | 11 | no | const deny = (reasonCode: string, reconcile = false): HostFixtureDenial =&gt; ({ kind: &#39;denied&#39;, reasonCode, effectInvoked: false, next: reconcile ? &#39;read_only_reconcile&#39; : &#39;explain_refusal&#39;, }); |
| nonempty | function | 15 | no | const nonempty = (x: unknown): x is string =&gt; typeof x === &#39;string&#39; &amp;&amp; x.length &gt; 0 &amp;&amp; x.length &lt;= 160; |
| plain | function | 16 | no | const plain = (x: unknown): x is Record&lt;string, unknown&gt; =&gt; x !== null &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; |
| canonical | function | 19 | no | function canonical(x: unknown): string { |
| sha | function | 24 | no | const sha = (x: unknown): string =&gt; createHash(&#39;sha256&#39;).update(canonical(x)).digest(&#39;hex&#39;); |
| binding | function | 25 | no | const binding = (context: TrustedFixtureHostContext) =&gt; ({ ownerRef: context.ownerRef, actorRef: context.actorRef, deviceRef: context.deviceRef, sessionRef: context.sessionRef, worldRef: context.worl… |
| principalReason | function | 30 | no | function principalReason(context: TrustedFixtureHostContext): string \| null { |
| g | const | 37 | no | const g = context.grant; |
| validateArgs | function | 45 | no | function validateArgs(args: unknown, schema: HostActionDescriptor[&#39;argsSchema&#39;]): args is Record&lt;string, JsonArgument&gt; { |
| spec | const | 49 | no | const spec = typeof rule === &#39;string&#39; ? {type: rule} : rule; |
| value | const | 51 | no | const value = args[key]; |
| planBody | function | 65 | no | function planBody(p: InertHostPlan): Omit&lt;InertHostPlan, &#39;planId&#39; \| &#39;planDigest&#39;&gt; { |
| HostFixtureOptions | interface | 70 | yes | export interface HostFixtureOptions { |
| createHostCapabilityFixture | function | 78 | yes | export function createHostCapabilityFixture(options: HostFixtureOptions): HostCapabilityPort { |
| actions | const | 81 | no | const actions = new Map&lt;string, HostActionDescriptor&gt;(); |
| copied | const | 87 | no | const copied: HostActionDescriptor = { |
| describeForPrincipal | function | 94 | no | function describeForPrincipal(context: TrustedFixtureHostContext, actionId: string): HostCapabilityView { |
| a | const | 95 | no | const a = actions.get(actionId); |
| source | const | 96 | no | const source = {authority: &#39;host-catalog-fixture&#39;, proof: &#39;fixture_only&#39;, observedAtMs: context.nowMs} as const; |
| stale | const | 97 | no | const stale = context.catalogVersion !== options.catalogVersion \|\| context.catalogDigest !== options.catalogDigest; |
| supportedByBuild | const | 98 | no | const supportedByBuild: TriState = !a ? &#39;unknown&#39; : stale ? &#39;unknown&#39; : |
| available | const | 101 | no | const available: TriState = context.availabilityByAction?.[actionId] ?? &#39;unknown&#39;; |
| availableNow | const | 102 | no | const availableNow: TriState = supportedByBuild !== &#39;yes&#39; ? (supportedByBuild === &#39;no&#39; ? &#39;no&#39; : &#39;unknown&#39;) : |
| principal | const | 104 | no | const principal = principalReason(context); |
| requiredScopes | const | 105 | no | const requiredScopes = a?.requiredScopes ?? []; |
| permittedForActor | const | 106 | no | const permittedForActor: TriState = principal \|\| stale \|\| !a \|\| |
| verifiedByEvidence | const | 108 | no | const verifiedByEvidence: TriState = !a \|\| stale \|\| a.evidence === &#39;unknown&#39; ? &#39;unknown&#39; : |
| reasons | const | 110 | no | const reasons = [ |
| prepare | function | 129 | no | function prepare(command: InertHostCommand, context: TrustedFixtureHostContext): HostPrepareResult { |
| a | const | 137 | no | const a = actions.get(command.target.actionId); |
| cap | const | 146 | no | const cap = describeForPrincipal(context, a.actionId); |
| grant | const | 155 | no | const grant = context.grant; |
| body | const | 157 | no | const body = { |
| planDigest | const | 167 | no | const planDigest = sha(body); |
| plan | const | 168 | no | const plan: InertHostPlan = {...body, planDigest, planId: &#39;fh-&#39; + planDigest.slice(0,32)}; |
| evaluateApprovalInert | function | 172 | no | function evaluateApprovalInert(plan: InertHostPlan, approval: InertApproval, context: TrustedFixtureHostContext): HostApprovalResult { |
| principal | const | 178 | no | const principal = principalReason(context); |
| g | const | 180 | no | const g = context.grant; |
| a | const | 190 | no | const a = actions.get(plan.actionId); |
| cap | const | 192 | no | const cap = describeForPrincipal(context, a.actionId); |
| reconcileClaimReadOnly | function | 208 | no | function reconcileClaimReadOnly(claim: HostClaimSnapshot, observation: HostReceiptObservation \| null, context: TrustedFixtureHostContext) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| ./port.ts | import | 3 | [packages/tierflow/src/visual-runtime/host/port.ts](./port.ts.md) |
| ./outcome.ts | import | 9 | [packages/tierflow/src/visual-runtime/host/outcome.ts](./outcome.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts](./wave3-read-gateway-fixture.ts.md) | ./fixture.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../host/fixture.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../host/fixture.ts |
| [packages/tierflow/tests/visual-runtime/host-fixture.test.ts](../../../tests/visual-runtime/host-fixture.test.ts.md) | ../../src/visual-runtime/host/fixture.ts |
| [packages/tierflow/tests/visual-runtime/host-security.test.ts](../../../tests/visual-runtime/host-security.test.ts.md) | ../../src/visual-runtime/host/fixture.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/host/fixture.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/host/fixture.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/host/fixture.ts |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../../tests/visual-runtime/wave3-e-experience.test.ts.md) | ../../src/visual-runtime/host/fixture.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Inert HostCapabilityPort/1: all calls return values; no Host, KB, device or browser IO. */
import {createHash} from 'node:crypto';
import type {
  HostActionDescriptor, HostCapabilityPort, HostCapabilityView, HostFixtureDenial,
  HostPrepareResult, HostApprovalResult, HostRisk, InertHostCommand,
  InertHostPlan, InertApproval, JsonArgument, TrustedFixtureHostContext,
  TriState, HostReceiptObservation, HostClaimSnapshot,
} from './port.ts';
import {projectObservedHostOutcome} from './outcome.ts';

const deny = (reasonCode: string, reconcile = false): HostFixtureDenial => ({
  kind: 'denied', reasonCode, effectInvoked: false,
  next: reconcile ? 'read_only_reconcile' : 'explain_refusal',
});
const nonempty = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= 160;
const plain = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' &&
  !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);

function canonical(x: unknown): string {
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (plain(x)) return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
const sha = (x: unknown): string => createHash('sha256').update(canonical(x)).digest('hex');
const binding = (context: TrustedFixtureHostContext) => ({
  ownerRef: context.ownerRef, actorRef: context.actorRef, deviceRef: context.deviceRef,
  sessionRef: context.sessionRef, worldRef: context.worldRef,
});

function principalReason(context: TrustedFixtureHostContext): string | null {
  if (context.schema !== 'fixture.trusted-host-context/1' || !context.authenticated ||
      !Object.values(binding(context)).every(nonempty)) return 'AUTHENTICATED_PRINCIPAL_REQUIRED';
  if (!Number.isSafeInteger(context.nowMs) || !Number.isSafeInteger(context.sessionExpiresAtMs) ||
      context.nowMs >= context.sessionExpiresAtMs) return 'SESSION_EXPIRED';
  if (context.surface !== 'desktop' && context.surface !== 'phone') return 'SURFACE_INVALID';
  if (!context.grant) return 'GRANT_MISSING';
  const g = context.grant;
  if (g.status !== 'active') return g.status === 'revoked' ? 'GRANT_REVOKED' : 'GRANT_NOT_ACTIVE';
  if (context.nowMs >= g.expiresAtMs) return 'GRANT_EXPIRED';
  if (!nonempty(g.grantRef) || !nonempty(g.revision)) return 'GRANT_INVALID';
  if (Object.entries(binding(context)).some(([k, v]) => g[k as keyof typeof g] !== v)) return 'GRANT_PRINCIPAL_MISMATCH';
  if (!Array.isArray(g.scopes) || g.scopes.some(s => !nonempty(s))) return 'GRANT_INVALID';
  return null;
}
function validateArgs(args: unknown, schema: HostActionDescriptor['argsSchema']): args is Record<string, JsonArgument> {
  if (!plain(args) || Object.keys(args).length !== Object.keys(schema).length ||
      JSON.stringify(args).length > 2048) return false;
  for (const [key, rule] of Object.entries(schema)) {
    const spec = typeof rule === 'string' ? {type: rule} : rule;
    if (!spec || typeof spec !== 'object' || !Object.hasOwn(args, key)) return false;
    const value = args[key];
    if (spec.type === 'enum') {
      if (typeof value !== 'string' || !('values' in spec) || !Array.isArray(spec.values) ||
          !spec.values.includes(value)) return false;
    } else if (typeof value !== spec.type) return false;
    if (spec.type === 'string' && (typeof value !== 'string' || value.length > 800)) return false;
    if (spec.type === 'number' && !Number.isSafeInteger(value)) return false;
    if ('min' in spec && typeof spec.min === 'number' &&
        (typeof value === 'string' ? value.length < spec.min : typeof value === 'number' ? value < spec.min : true)) return false;
    if ('max' in spec && typeof spec.max === 'number' &&
        (typeof value === 'string' ? value.length > spec.max : typeof value === 'number' ? value > spec.max : true)) return false;
  }
  return Object.keys(args).every(k => Object.hasOwn(schema, k) && !/^(?:actor|owner|device|grant|approval|token|bearer|argv|shell|command)$/i.test(k));
}
function planBody(p: InertHostPlan): Omit<InertHostPlan, 'planId' | 'planDigest'> {
  const {planId: _id, planDigest: _digest, ...body} = p;
  return body;
}

export interface HostFixtureOptions {
  readonly catalogVersion: number;
  readonly catalogDigest: string;
  readonly actions: readonly HostActionDescriptor[];
  readonly testReceiptVerifier?: Readonly<{keyId: string; secret: string}>;
}

/** Does not implement Host execute. TrustedFixtureHostContext is an explicit synthetic test boundary. */
export function createHostCapabilityFixture(options: HostFixtureOptions): HostCapabilityPort {
  if (!Number.isSafeInteger(options.catalogVersion) || options.catalogVersion < 1 ||
      !/^[a-f0-9]{64}$/.test(options.catalogDigest)) throw new Error('FIXTURE_CATALOG_INVALID');
```

_First 80 of 214 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
