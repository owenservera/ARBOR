/** Execute under TierFlow Bun checkout. Real Wave 3 renderer and Wave 4 B imports. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { founderDocument, ACTION, NOW } from '../../integration-4/fixture.ts';
import { renderWave3Semantics } from '../../../../src/visual-runtime/render/wave3-semantics.ts';
import { projectWave4PhoneAdapter } from '../../../../src/visual-runtime/device/wave4-phone-adapter.ts';
import { diagnoseWave4BRoot } from '../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts';
import type { PhoneProjectionInput } from '../../../../src/visual-runtime/device/wave4-phone-adapter.ts';

function genuinePhone(): PhoneProjectionInput {
  const canonical=founderDocument();
  const rendered=renderWave3Semantics(canonical,{viewportPx:360,knownActions:[ACTION]});
  return {canonical,rendered,
    shell:{app:'existing-vivim-apk',relay:'existing-mobile-relay',publisher:'harness',viewportPx:360},
    pairing:{state:'paired',ownerRef:'owner_a',worldRef:'workspace_a',deviceRef:'phone_1',sessionRef:'session_1',
      epoch:3,receivedSequence:51,lastAcceptedSequence:50,expiresAtMs:NOW+600_000},
    host:{state:'online',ownerRef:'owner_a',worldRef:'workspace_a',deviceRef:'phone_1',sessionRef:'session_1',
      pairingEpoch:3,policyRevision:9,nowMs:NOW,grantExpiresAtMs:NOW+600_000,
      documentRevision:canonical.revision,denied:false,
      actionRisks:[{nodeId:'preview',id:ACTION.id,version:ACTION.version,risk:'R0',policyRevision:9}]}};
}

test('actual Wave 3 rendering now projects after the owner-authorized Wave 4 B repair',()=>{
  const input=genuinePhone();
  // The renderer facts are unchanged and are still asserted: the Wave 3 renderer always
  // emits a synthetic 'render_root' wrapper whose child is the canonical root node.
  assert.equal(input.rendered.status,'ok');
  assert.equal(input.rendered.plan.root.id,'render_root');
  assert.equal(input.rendered.plan.root.children[0]?.id,input.canonical.rootId);
  const diagnosis=diagnoseWave4BRoot(input.canonical,input.rendered);
  assert.equal(diagnosis.compatibility,'WAVE4B_WRAPPER_DEFECT');
  // The owner-authorized patch is applied, so the repaired guard accepts this shape.
  assert.equal(diagnosis.repairedGuardAccepts,true);
  assert.equal(diagnosis.requiresWave4BOwnerPatch,false);
  const b=projectWave4PhoneAdapter(input);
  assert.equal(b.status,'ready');
  assert.equal(b.refusalCode,null);
  assert.equal(b.effectInvoked,false);
  assert.equal(b.canApproveOnPhone,false);
  assert.equal(b.automaticRetryAllowed,false);
});
test('the applied repair still refuses an UNDECLARED render_root alias',()=>{
  const input=genuinePhone();
  // A canonical document that claims the renderer's synthetic alias as its root has NO
  // node of that id. The repair must refuse it, not silently accept the alias.
  const forged={...input.canonical,rootId:'render_root'} as typeof input.canonical;
  const diagnosis=diagnoseWave4BRoot(forged,input.rendered);
  assert.equal(diagnosis.compatibility,'UNDECLARED_ROOT');
  // The applied repair does NOT accept the alias: the canonical root must be a
  // DECLARED node present in the sanitized render tree.
  assert.equal(diagnosis.repairedGuardAccepts,false);
  const b=projectWave4PhoneAdapter({...input,canonical:forged});
  assert.equal(b.status,'unavailable');
  assert.ok(b.refusalCode!==null);
  assert.notEqual(b.refusalCode,'NONE');
  assert.equal(b.effectInvoked,false);
  assert.equal(b.canApproveOnPhone,false);
  assert.equal(b.automaticRetryAllowed,false);
});

test('proposed owner-only predicate accepts canonical descendant but refuses unbacked alias',()=>{
  const input=genuinePhone();
  const seen=new Set<string>();
  const walk=(n:typeof input.rendered.plan.root):void=>{
    assert.ok(!seen.has(n.id));seen.add(n.id);for(const c of n.children)walk(c);
  };
  walk(input.rendered.plan.root);
  assert.equal(input.rendered.plan.root.id===input.canonical.rootId,false);
  assert.equal(seen.has(input.canonical.rootId)&&input.canonical.nodes.some(n=>n.id===input.canonical.rootId),true);
  const forged={...input.canonical,rootId:'render_root'};
  assert.equal(diagnoseWave4BRoot(forged,input.rendered).compatibility,'UNDECLARED_ROOT');
  assert.equal(seen.has(forged.rootId)&&forged.nodes.some(n=>n.id===forged.rootId),false);
});

test('existing phone rejects hostile duplicate publisher and stale grant before render compatibility',()=>{
  const input=genuinePhone();
  const duplicate={...input,shell:{...input.shell,publisher:'other'}} as unknown as PhoneProjectionInput;
  assert.equal(projectWave4PhoneAdapter(duplicate).refusalCode,'DUPLICATE_PUBLISHER');
  const stale={...input,host:{...input.host,grantExpiresAtMs:NOW}};
  assert.equal(projectWave4PhoneAdapter(stale).refusalCode,'STALE_AUTHORIZATION');
});
