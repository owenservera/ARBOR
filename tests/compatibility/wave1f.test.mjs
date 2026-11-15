import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {isSourceRef,isEvidenceRef,canDisplayProjection,projectHostJournalState,HOST_EFFECT_STATES,GRADUATION_STATES} from '../../contracts/interop/v1/validate.mjs';
import {verifyObservedTrace} from '../fixtures/labs/voice-to-tasks/trace-check.mjs';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
test('interop and taxonomy remain read-only',()=>{
 const source=load('synthetic-projections.v1.json');
 assert.equal(isSourceRef(source.source),true);
 assert.equal(isSourceRef(source.unownedPersonal),false);
 assert.equal(isEvidenceRef({source:source.source,digest:'a'.repeat(64),confidence:'source-observed'}),true);
 assert.equal(canDisplayProjection(source.grounded,source.source),true);
 assert.equal(canDisplayProjection(source.grounded,source.stale),false);
 assert.equal(canDisplayProjection(source.grounded,source.wrongOwner),false);
 assert.equal(canDisplayProjection({...source.grounded,inert:false},source.source),false);
 assert.equal(GRADUATION_STATES.length,6);
 assert.deepEqual(HOST_EFFECT_STATES,['planned','approved','uncertain','applied','failed']);
});
test('exclusive Host claim without receipt is uncertain and never success',()=>{
 assert.equal(projectHostJournalState(), 'planned');
 assert.equal(projectHostJournalState({approval:true}), 'approved');
 assert.equal(projectHostJournalState({claimed:true}), 'uncertain');
 assert.equal(projectHostJournalState({claimed:true,receipt:{status:'applied'}}), 'applied');
 assert.equal(projectHostJournalState({claimed:true,receipt:{status:'failed'}}), 'failed');
 assert.equal(projectHostJournalState({receipt:{status:'applied'}}),'uncertain');
});
test('source-side synthetic voice traces remain non-authoritative',()=>{
 const f=load('../fixtures/labs/voice-to-tasks/fixtures.json');
 assert.equal(f.length,10);
 assert.ok(f.some(x=>x.name==='en-negation' && x.expectedActions.length===0));
 const phases=['captured_local','queued','transcribed','proposed','reviewed','committed','reopened'];
 const trace=phases.map((action,i)=>({noteId:'synthetic-note',ownerId:'synthetic-owner',source:i===5?'host':'desktop',action,revision:i+1,...(i===4?{approvedProposalIds:['vp-one']}:{}),...(i===5?{receiptId:'receipt:synthetic'}:{})}));
 assert.equal(verifyObservedTrace(trace).passed,true);
 assert.throws(()=>verifyObservedTrace(trace.map(e=>e.action==='committed'?{...e,source:'android'}:e)),{code:'TRACE_HOST_COMMIT_REQUIRED'});
});
test('Labs observatory seed does not assert shipping capability',()=>{
 const seed=load('../fixtures/labs/capability-observatory/seed.json');
 const schema=load('../fixtures/labs/capability-observatory/schema.json');
 assert.ok(seed.length>=10);
 assert.ok(seed.every(x=>x.capability_id.startsWith('cap:')&&x.source_refs.length>0));
 assert.equal(schema.type,'array');
 const truth=load('../../capability-spaces/source-truth.v1.json');
 assert.equal(truth.releaseAvailableNow.length,0);
 assert.ok(truth.items.every(i=>i.releaseReady===false && GRADUATION_STATES.includes(i.status)));
});
test('Chronos is staged, due neither approves nor executes',()=>{
 const c=load('../../contracts/chronos/staged-contract.v1.json');
 assert.equal(c.status,'staged_not_activated');
 assert.equal(c.nonAuthority.dueIsGrant,false);
 assert.equal(c.nonAuthority.uiCanExecute,false);
});
test('Host ID/risk/readiness continuity after lane B import',t=>{
 const path=fileURLToPath(new URL('../../apps/vivim-host/control/action-catalog.v1.json',import.meta.url));
 if(!existsSync(path))return t.skip('Lane B Host not imported on this isolated worker branch');
 const catalog=JSON.parse(readFileSync(path,'utf8')),baseline=load('host-actions.baseline.v1.json');
 // Continuity, not equality: the catalog legitimately grows, so extra actions are
 // reported, never failed. The guarantee is that no baselined action lost or changed
 // its id/risk/readiness. (Same rule as the oracle's binding §2 catalog ruling.)
 assert.ok(Number.isInteger(catalog.version)&&catalog.version>=baseline.catalogVersion,
  'catalog version must not regress below the compatibility baseline');
 const now=new Map(catalog.actions.map(a=>[a.id,{id:a.id,risk:a.risk,readiness:a.readiness}]));
 const regressed=baseline.actions.filter(b=>!now.has(b.id)||now.get(b.id).risk!==b.risk||now.get(b.id).readiness!==b.readiness);
 assert.deepEqual(regressed,[],'baselined Host actions must keep their id/risk/readiness');
 const added=catalog.actions.filter(a=>!baseline.actions.some(b=>b.id===a.id)).map(a=>a.id);
 if(added.length)process.stdout.write('wave1f: catalog added '+added.length+' action(s): '+added.join(', ')+'\n');
});
