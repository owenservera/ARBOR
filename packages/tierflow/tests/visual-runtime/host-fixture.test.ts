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
  const p = fixture(), c=context();
  const plan = prepared(p.prepare(command('ui.theme.set_preset',{preset:'dusk'}),c));
  assert.equal(plan.approvalRequired,true);
  assert.deepEqual(plan,prepared(p.prepare(command('ui.theme.set_preset',{preset:'dusk'}),c)));
  assert.equal(p.evaluateApprovalInert(plan,{channel:'desktop-owner-token',ownerConfirmed:false,planDigest:plan.planDigest},c).kind,'denied');
  assert.deepEqual(p.evaluateApprovalInert(plan,{channel:'desktop-owner-token',ownerConfirmed:true,planDigest:plan.planDigest},c),
    {kind:'approved_inert',planId:plan.planId,planDigest:plan.planDigest,effectInvoked:false,next:'host_owner_gateway_required'});
});

test('R2 action requires a desktop owner, not a phone approval', () => {
  const p=fixture(), c=context();
  const d=command('privacy.hard_no.add',{trait:'do not expose my data'});
  const pcPlan=prepared(p.prepare(d,c));
  assert.equal(pcPlan.risk,'R2');
  assert.equal(p.evaluateApprovalInert(pcPlan,{channel:'direct-phone',ownerConfirmed:true,planDigest:pcPlan.planDigest},c).kind,'denied');
  assert.equal(p.prepare(d,context({surface:'phone'})).kind,'denied');
});

test('R3 is always refused even when catalog suggests availability and a grant exists', () => {
  const p=fixture();
  const r=p.prepare(command('machine.network.disable_all'),context());
  assert.equal(r.kind,'denied');
  assert.equal(r.kind==='denied'?r.reasonCode:null,'R3_REFUSED');
});

test('unavailable, unknown, and stale catalog are not represented as yes', () => {
  const p=fixture();
  const off=context({availabilityByAction:{'vivim.status.show':'no'}});
  assert.equal(p.describeForPrincipal(off,'vivim.status.show').availableNow,'no');
  assert.equal(p.prepare(command('vivim.status.show'),off).kind,'denied');
  const old=context({catalogDigest:'b'.repeat(64)});
  const v=p.describeForPrincipal(old,'vivim.status.show');
  assert.deepEqual([v.supportedByBuild,v.permittedForActor],['unknown','no']);
  assert.equal(p.prepare(command('vivim.status.show'),old).kind,'denied');
});

test('changed host World/policy revisions fail before any plan', () => {
  const p=fixture(), c=context();
  assert.equal(p.prepare({...command('vivim.status.show'),sourceVersions:{hostWorld:'other',policy:c.policyRevision,catalogDigest:digest}},c).kind,'denied');
  assert.equal(p.prepare({...command('vivim.status.show'),sourceVersions:{hostWorld:c.worldRevision,policy:'old',catalogDigest:digest}},c).kind,'denied');
});

test('unknown action, wrong argument types, extra fields and untrusted identity are refused', () => {
  const p=fixture(),c=context();
  assert.equal(p.prepare(command('not-a-host-action'),c).kind,'denied');
  assert.equal(p.prepare(command('ui.theme.set_preset',{preset:10}),c).kind,'denied');
  assert.equal(p.prepare(command('ui.theme.set_preset',{preset:'not-a-preset'}),c).kind,'denied');
  assert.equal(p.prepare(command('ui.theme.set_preset',{preset:'dusk',x:'extra'}),c).kind,'denied');
  assert.equal(p.prepare({...command('vivim.status.show'),actorRef:'forged'} as InertHostCommand,c).kind,'denied');
  assert.equal(p.prepare({...command('vivim.status.show'),approval:true} as InertHostCommand,c).kind,'denied');
  assert.equal(p.prepare(command('ui.theme.set_preset',{preset:{shell:'rm -rf /'} as unknown as string}),c).kind,'denied');
});

test('catalog changes and duplicate action IDs rejected at fixture creation', () => {
  assert.throws(()=>createHostCapabilityFixture({catalogVersion:6,catalogDigest:'bad',actions}),/FIXTURE_CATALOG_INVALID/);
  assert.throws(()=>createHostCapabilityFixture({catalogVersion:6,catalogDigest:digest,actions:[actions[0]!,actions[0]!]}),/FIXTURE_ACTION_INVALID/);
});

test('inputs are not mutated by describe/prepare/approval', () => {
  const p=fixture(),c=context(),x=command('ui.theme.set_preset',{preset:'dawn'});
  const before=JSON.stringify({c,x});
  const plan=prepared(p.prepare(x,c));
  p.describeForPrincipal(c,x.target.actionId);
  p.evaluateApprovalInert(plan,{channel:'desktop-owner-token',ownerConfirmed:true,planDigest:plan.planDigest},c);
  assert.equal(JSON.stringify({c,x}),before);
});
