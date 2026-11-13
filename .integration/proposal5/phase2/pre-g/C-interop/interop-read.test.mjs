// Synthetic only; no user data, network, Host writes or clock side effects.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceRef, acceptInertProjection, acceptChronosRead } from './interop-read.mjs';
const source = Object.freeze({id:'dev-source:synthetic',domain:'development',ownerRef:null,revision:7});
const trusted = Object.freeze({actorId:'actor:synthetic',sessionId:'session:synthetic',audience:'desktop-owner',source,afterSeq:4});
const view = Object.freeze({
 schema:'arbor.p2c.inert-read/1',actorId:trusted.actorId,sessionId:trusted.sessionId,
 audience:trusted.audience,source,
 event:{eventId:'event:5',kind:'observation',seq:5,expectedRevision:7},
 inert:true,effectAllowed:false,automaticRetryAllowed:false,status:'grounded',
 cues:[{kind:'source',code:'SOURCE_OBSERVED'}]
});
const convo = Object.freeze({
 schema:'vivim.chronos.conversation-read/1',conversationId:'thread:synthetic',
 sourceRevision:7,asOfMs:1000,clockQuality:'wall_clock_unverified',
 turns:[],responseLatencyMs:null,effectAllowed:false,automaticRetryAllowed:false
});
const supervisor = Object.freeze({
 schema:'vivim.chronos.supervisor-read/1',observedAtMs:1000,sourceLastSeq:2,
 durationAuthority:'wall_clock_estimate_only',effectAllowed:false,dispatchAllowed:false,lanes:[]
});
test('owner-bound event is an inert read; caller has supplied Host-verified context',()=>{
 const out=acceptInertProjection(trusted,view);
 assert.equal(out.ok,true);assert.equal(out.inert,true);assert.equal(out.effectAllowed,false);
 assert.equal(out.eventSeq,5);assert.deepEqual(out.cues,[{kind:'source',code:'SOURCE_OBSERVED'}]);
});
test('actor, session, audience and scope substitution refuse',()=>{
 for(const delta of [
 {actorId:'actor:other'}, {sessionId:'session:other'}, {audience:'paired-phone-owner'},
 {source:{...source,ownerRef:'owner:other'}},{source:{...source,domain:'control'}},
 {source:{...source,revision:8}}]) assert.equal(acceptInertProjection(trusted,{...view,...delta}).ok,false);
 assert.equal(sourceRef({...source,domain:'personal'}),false);
});
test('duplicate, out-of-order, stale-source and approval events refuse',()=>{
 for(const event of [
 {...view.event,seq:4}, {...view.event,seq:3},
 {...view.event,expectedRevision:6},{...view.event,kind:'approve'}
 ])assert.equal(acceptInertProjection(trusted,{...view,event}).ok,false);
});
test('no effects, receipts or arbitrary raw token material in visual projection',()=>{
 for(const changed of [
 {effectAllowed:true},{automaticRetryAllowed:true},{receipt:{status:'applied'}},
 {execute:true},{cues:[{kind:'source',code:'bearer token'}]},
 {cues:Array.from({length:33},()=>({kind:'source',code:'SOURCE_OBSERVED'}))}
 ])assert.equal(acceptInertProjection(trusted,{...view,...changed}).ok,false);
});
test('ambiguity and stale read cannot masquerade as grounded output',()=>{
 for(const status of ['stale','unavailable','ambiguous','applied'])
 assert.equal(acceptInertProjection(trusted,{...view,status}).ok,false);
});
test('Chronos conversation is only an estimate, never evidence of message send',()=>{
 const out=acceptChronosRead(trusted,view,convo);
 assert.deepEqual([out.ok,out.status,out.effectAllowed,out.canExecute,out.automaticRetryAllowed],[true,'estimate_only',false,false,false]);
 for(const changed of [
 {sourceRevision:8},{effectAllowed:true},{automaticRetryAllowed:true},
 {turns:[{authoritativeSendReceipt:true}]},{responseLatencyMs:50}
 ])assert.equal(acceptChronosRead(trusted,view,{...convo,...changed}).ok,false);
});
test('Chronos supervisor source is only a bounded read, not scheduler admission',()=>{
 const out=acceptChronosRead(trusted,view,supervisor);
 assert.deepEqual([out.ok,out.status,out.canExecute],[true,'estimate_only',false]);
 for(const changed of [
 {dispatchAllowed:true},{effectAllowed:true},{durationAuthority:'authoritative'},
 {lanes:Array.from({length:2001},()=>({}))}
 ])assert.equal(acceptChronosRead(trusted,view,{...supervisor,...changed}).ok,false);
});
test('unknown temporal schema and view event regression refuse',()=>{
 assert.equal(acceptChronosRead(trusted,view,{...supervisor,schema:'vivim.chronos.execute/1'}).ok,false);
 assert.equal(acceptChronosRead(trusted,{...view,event:{...view.event,seq:4}},supervisor).ok,false);
});
