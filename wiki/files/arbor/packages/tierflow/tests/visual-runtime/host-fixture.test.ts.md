# File: packages/tierflow/tests/visual-runtime/host-fixture.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/host-fixture.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 8936 B |
| Lines | 146 |
| Hash | 72fbd706d746 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| digest | const | 8 | no | const digest = &#39;a&#39;.repeat(64); |
| catalogVersion | const | 9 | no | const catalogVersion = 6; |
| action | function | 10 | no | const action = (actionId: string, risk: HostRisk, overrides: Partial&lt;HostActionDescriptor&gt; = {}): HostActionDescriptor =&gt; ({ actionId, risk, catalogVersion, readiness: &#39;source_wired&#39;, evidence: &#39;veri… |
| actions | const | 14 | no | const actions: HostActionDescriptor[] = [ |
| context | function | 22 | no | function context(overrides: Partial&lt;TrustedFixtureHostContext&gt; = {}): TrustedFixtureHostContext { |
| base | const | 23 | no | const base: TrustedFixtureHostContext = { |
| command | function | 36 | no | function command(actionId: string, args: InertHostCommand[&#39;args&#39;] = {}): InertHostCommand { |
| fixture | function | 40 | no | const fixture = () =&gt; createHostCapabilityFixture({actions,catalogDigest:digest,catalogVersion}); |
| prepared | function | 41 | no | const prepared = (result: ReturnType&lt;ReturnType&lt;typeof fixture&gt;[&#39;prepare&#39;]&gt;) =&gt; { |
| p | const | 48 | no | const p = fixture(); |
| c | const | 49 | no | const c = context({availabilityByAction:{}}); |
| v | const | 50 | no | const v = p.describeForPrincipal(c,&#39;devices.summary&#39;); |
| p | const | 60 | no | const p = fixture(); |
| x | const | 61 | no | const x = p.describeForPrincipal(context(),&#39;vivim.network.pause_egress&#39;); |
| p | const | 68 | no | const p = fixture(); |
| plan | const | 72 | no | const plan = prepared(p.prepare(command(&#39;vivim.status.show&#39;),context())); |
| approval | const | 75 | no | const approval = p.evaluateApprovalInert(plan,{channel:&#39;desktop-owner-token&#39;,ownerConfirmed:false,planDigest:plan.planDigest},context()); |
| p | const | 81 | no | const p = fixture(), c=context(); |
| plan | const | 82 | no | const plan = prepared(p.prepare(command(&#39;ui.theme.set_preset&#39;,{preset:&#39;dusk&#39;}),c)); |
| p | const | 91 | no | const p=fixture(), c=context(); |
| d | const | 92 | no | const d=command(&#39;privacy.hard_no.add&#39;,{trait:&#39;do not expose my data&#39;}); |
| pcPlan | const | 93 | no | const pcPlan=prepared(p.prepare(d,c)); |
| p | const | 100 | no | const p=fixture(); |
| r | const | 101 | no | const r=p.prepare(command(&#39;machine.network.disable_all&#39;),context()); |
| p | const | 107 | no | const p=fixture(); |
| off | const | 108 | no | const off=context({availabilityByAction:{&#39;vivim.status.show&#39;:&#39;no&#39;}}); |
| old | const | 111 | no | const old=context({catalogDigest:&#39;b&#39;.repeat(64)}); |
| v | const | 112 | no | const v=p.describeForPrincipal(old,&#39;vivim.status.show&#39;); |
| p | const | 118 | no | const p=fixture(), c=context(); |
| p | const | 124 | no | const p=fixture(),c=context(); |
| p | const | 140 | no | const p=fixture(),c=context(),x=command(&#39;ui.theme.set_preset&#39;,{preset:&#39;dawn&#39;}); |
| before | const | 141 | no | const before=JSON.stringify({c,x}); |
| plan | const | 142 | no | const plan=prepared(p.prepare(x,c)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert | import | 2 | external |
| ../../src/visual-runtime/host/fixture.ts | import | 3 | [packages/tierflow/src/visual-runtime/host/fixture.ts](../../src/visual-runtime/host/fixture.ts.md) |
| ../../src/visual-runtime/host/port.ts | import | 4 | [packages/tierflow/src/visual-runtime/host/port.ts](../../src/visual-runtime/host/port.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHostCapabilityFixture} from '../../src/visual-runtime/host/fixture.ts';
import type {
  HostActionDescriptor, HostRisk, InertHostCommand, TrustedFixtureHostContext,
} from '../../src/visual-runtime/host/port.ts';

const digest = 'a'.repeat(64);
const catalogVersion = 6;
const action = (actionId: string, risk: HostRisk, overrides: Partial<HostActionDescriptor> = {}): HostActionDescriptor => ({
  actionId, risk, catalogVersion, readiness: 'source_wired', evidence: 'verified',
  requiredScopes: ['control:read'], prerequisites: ['owner sign-in'], argsSchema: {}, ...overrides,
});
const actions: HostActionDescriptor[] = [
  action('vivim.status.show','R0'),
  action('ui.theme.set_preset','R1',{requiredScopes:['control:execute'],argsSchema:{preset:{type:'enum',values:['lab','tide','dusk','ember','grove','ink','dawn']}}}),
  action('privacy.hard_no.add','R2',{requiredScopes:['control:execute'],argsSchema:{trait:'string'}}),
  action('machine.network.disable_all','R3',{readiness:'unsupported', evidence:'unknown',requiredScopes:['control:execute']}),
  action('vivim.network.pause_egress','R2',{readiness:'enforcement_missing',evidence:'source_inspected',requiredScopes:['control:execute']}),
  action('devices.summary','R0',{evidence:'source_inspected'}),
];
function context(overrides: Partial<TrustedFixtureHostContext> = {}): TrustedFixtureHostContext {
  const base: TrustedFixtureHostContext = {
    schema:'fixture.trusted-host-context/1',authenticated:true,ownerRef:'ow-1',actorRef:'actor-1',
    deviceRef:'pc-1',sessionRef:'sess-1',worldRef:'world-1',surface:'desktop',
    nowMs:1700000000000,sessionExpiresAtMs:1700000300000,
    worldRevision:'world-rev-3',policyRevision:'policy-rev-2',
    catalogVersion,catalogDigest:digest,
    availabilityByAction:Object.fromEntries(actions.map(a => [a.actionId,'yes' as const])),
    grant:{grantRef:'grant-1',status:'active',ownerRef:'ow-1',actorRef:'actor-1',deviceRef:'pc-1',
      sessionRef:'sess-1',worldRef:'world-1',expiresAtMs:1700000200000,revision:'grant-r1',
      scopes:['control:read','control:execute']},
  };
  return {...base,...overrides};
}
function command(actionId: string, args: InertHostCommand['args'] = {}): InertHostCommand {
  return {schema:'vivim.visual-command/1',commandId:'cmd-1',target:{owner:'host_effect',actionId,catalogVersion},
    args,sourceVersions:{hostWorld:'world-rev-3',policy:'policy-rev-2',catalogDigest:digest}};
}
const fixture = () => createHostCapabilityFixture({actions,catalogDigest:digest,catalogVersion});
const prepared = (result: ReturnType<ReturnType<typeof fixture>['prepare']>) => {
  assert.equal(result.kind,'prepared_inert',JSON.stringify(result));
  if(result.kind !== 'prepared_inert') throw new Error('unreachable');
  return result.plan;
};

test('catalog v6 source wiring does not by itself prove available, permitted, or evidence verified', () => {
  const p = fixture();
  const c = context({availabilityByAction:{}});
  const v = p.describeForPrincipal(c,'devices.summary');
  assert.deepEqual([v.supportedByBuild,v.availableNow,v.permittedForActor,v.verifiedByEvidence],
    ['yes','unknown','yes','no']);
  assert.equal(v.source.proof,'fixture_only');
  assert.ok(v.reasonCodes.includes('AVAILABILITY_UNVERIFIED'));
  assert.ok(v.reasonCodes.includes('EVIDENCE_NOT_VERIFIED'));
  assert.equal(p.prepare(command('devices.summary'),c).kind,'denied');
});

test('source-wired and source-inspected are not an executable permission or proof', () => {
  const p = fixture();
  const x = p.describeForPrincipal(context(),'vivim.network.pause_egress');
  assert.deepEqual([x.supportedByBuild,x.availableNow,x.verifiedByEvidence],['no','no','no']);
  assert.deepEqual(p.prepare(command('vivim.network.pause_egress'),context()),
    {kind:'denied',reasonCode:'ACTION_NOT_WIRED',effectInvoked:false,next:'explain_refusal'});
});

test('R0 prepare returns only an inert plan; no execute or dispatch exported', () => {
  const p = fixture();
  assert.equal('execute' in p,false);
  assert.equal('dispatch' in p,false);
  assert.equal('send' in p,false);
  const plan = prepared(p.prepare(command('vivim.status.show'),context()));
  assert.equal(plan.approvalRequired,false);
  assert.equal(plan.proof,'fixture_only');
  const approval = p.evaluateApprovalInert(plan,{channel:'desktop-owner-token',ownerConfirmed:false,planDigest:plan.planDigest},context());
  assert.equal(approval.kind,'approved_inert');
  assert.equal(approval.effectInvoked,false);
});

test('R1 scope-bound prepare and approval produce identical inert digest for same inputs', () => {
```

_First 80 of 147 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
