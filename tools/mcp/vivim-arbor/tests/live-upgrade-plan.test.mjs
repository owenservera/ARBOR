import test from 'node:test';
import assert from 'node:assert/strict';
import {planLiveUpgrade} from '../server/live-upgrade-plan.mjs';
const A='a'.repeat(64),B='b'.repeat(64);
const entry=(path,sha256=A)=>({path,kind:'file',bytes:1,sha256});
const active={"sourceSha":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","treeSha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","grantSha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","recipeConfigSha":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","rootConfigSha":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","toolContractSha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","runtimeBindingSha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","verified":true,"entries":[{"path":"runtime/apps/vivim-host/server.mjs","kind":"file","bytes":1,"sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},{"path":"profile/server/tunnel-readonly.cjs","kind":"file","bytes":1,"sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},{"path":"runtime/tools/mcp/vivim-arbor/HANDOFF.md","kind":"file","bytes":1,"sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},{"path":"manifest.json","kind":"file","bytes":1,"sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]};
const candidate=(entries,extra={})=>({...active,sourceSha:'b'.repeat(40),treeSha256:B,entries,...extra});
const plan=(entries,extra={})=>planLiveUpgrade({active,candidate:candidate(entries,extra)});
test('documentation-only changes do not restart runtime',()=>{const p=plan(active.entries.map(e=>e.path.endsWith('HANDOFF.md')?{...e,sha256:B}:e));assert.equal(p.mode,'no-runtime-restart');assert.equal(p.drainNativeJobs,false);});
test('adapter-only changes keep native sessions and supervisor alive',()=>{const p=plan(active.entries.map(e=>e.path.endsWith('.cjs')?{...e,sha256:B}:e));assert.equal(p.mode,'mcp-child-reload');assert.equal(p.drainNativeJobs,false);assert.equal(p.preserveTunnelSupervisor,true);});
test('new contracts require metadata refresh, authority changes require explicit activation',()=>{assert.equal(plan(active.entries,{toolContractSha256:B}).clientMetadataRefreshRequired,true);const p=plan(active.entries,{grantSha256:B});assert.equal(p.mode,'host-handover');assert.equal(p.grantActivationRequired,true);});
test('binary and unknown changes require draining and never replay an effect',()=>{for(const name of ['bin/vivim-workstation-session.exe','unknown.exe']){const p=plan([...active.entries,entry(name)]);assert.equal(p.mode,'host-handover');assert.equal(p.drainNativeJobs,true);assert.equal(p.automaticEffectReplay,false);assert.equal(p.promotionPerformed,false);}});
test('invalid paths and unverified candidates fail closed',()=>{assert.throws(()=>plan([entry('../escape')]));assert.throws(()=>plan([entry('A'),entry('a')]));assert.throws(()=>plan(active.entries,{verified:false}));});

test('manifest-only changes to runtime bindings require handover; provenance-only changes do not',()=>{
 const entries=active.entries.map(e=>e.path==='manifest.json'?{...e,sha256:B}:e);
 assert.equal(plan(entries).mode,'no-runtime-restart');
 const p=plan(entries,{runtimeBindingSha256:B});
 assert.equal(p.mode,'host-handover');assert.equal(p.runtimeBindingChanged,true);assert.equal(p.drainNativeJobs,true);
 assert.throws(()=>plan(entries,{runtimeBindingSha256:undefined}));
});
