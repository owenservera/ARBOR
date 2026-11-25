import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createDevelopmentReadPort} from '../control/development-read-port.mjs';
test('register only explicitly approved root, index never implicit, live owner required',async()=>{
 let live=true,registered=[],indexed=0;const root=path.resolve('approved-repo');
 const port=createDevelopmentReadPort({config:{approvedRoots:[root]},sessionId:'local',stillOwner:()=>live,
  createSurface:async opts=>({status:()=>({sources:[],index:{}}),register:({name,path})=>{
   assert.equal(opts.authorize({actorId:'desktop-owner',sessionId:'local',domain:'development',operation:'source.register'}),true);
   registered.push(path);return {name,sourceId:'dev-source:example'};},refresh:()=>{indexed++;return {status:'indexed'}}})});
 const status=await port.status();assert.equal(status.approvedRoots.length,1);
 await assert.rejects(port.register({name:'bad',rootKey:'wrong'}),{code:'HQ_SOURCE_NOT_APPROVED'});
 assert.equal((await port.register({name:'arbor',rootKey:status.approvedRoots[0].key})).indexed,false);
 assert.deepEqual(registered,[root]);assert.equal(indexed,0);await port.refresh({});assert.equal(indexed,1);
 live=false;await assert.rejects(port.status(),{code:'OWNER_AUTH'});
});
test('missing source adapter cannot fall back or compare',async()=>{
 const port=createDevelopmentReadPort({sessionId:'local',stillOwner:()=>true});
 await assert.rejects(port.compare('{}'),{code:'HVI_SOURCE_ADAPTER_UNAVAILABLE'});
});
test('compare pins live grant and refuses revocation before report',async()=>{
 let valid=true,calls=0;const store={status:()=>({granted:true,id:'grant-one',repoIdentities:['owner/repo']}),verify:()=>valid?{ok:true,grant:{id:'grant-one'}}:{ok:false}};
 const adapter={authorizedDevelopmentSource:true,resolveRef(){},readCommit(){},listTree(){},readBlob(){}};
 const port=createDevelopmentReadPort({config:{hviRepositories:['owner/repo'],hviAdapter:adapter},runtime:{ledger:{}},sessionId:'local',stillOwner:()=>true,
  createGrantStore:()=>store,createHviPort:opts=>({invoke:async input=>{calls++;assert.equal(input.sources[0].sourceGrantRef,'grant-one');assert.equal(opts.verifyGrant({repoIdentity:'owner/repo',sourceGrantRef:'grant-one'}),true);valid=false;return {outcome:'SOURCE_ANALYSIS_ONLY'};}})});
 const selection={schema:'vivim.host.hvi-source-request/1',sources:[{repo:'owner/repo',sha:'a'.repeat(40)},{repo:'owner/repo',sha:'b'.repeat(40)}],targetIndex:1};
 await assert.rejects(port.compare(JSON.stringify(selection)),{code:'HVI_SOURCE_GRANT_STALE'});assert.equal(calls,1);
});

test('owner graph port accepts exact semantic identifiers, rejects control characters and rechecks revocation',async()=>{
 let live=true,calls=0;
 const root=path.resolve('approved-repo');
 const key='vivim.product-pure-host-bridge@2';
 const port=createDevelopmentReadPort({config:{approvedRoots:[root]},sessionId:'local',stillOwner:()=>live,
  createSurface:async opts=>({graph:async input=>{
   calls++;
   assert.equal(opts.authorize({actorId:'desktop-owner',sessionId:'local',domain:'development',operation:'source.read'}),true);
   assert.equal(opts.authorize({actorId:'desktop-owner',sessionId:'local',domain:'development',operation:'source.index'}),false);
   assert.equal(input.key,key);
   if(calls===2)live=false;
   return {schema:'hqkg.development-query/1',state:'indexed-snapshot',authority:'read-only'};
  }})});
 for(const char of ['\u0000','\u001f','\u007f']){
  await assert.rejects(port.graph({operation:'sources',key:key+char}),{code:'HQ_GRAPH_QUERY_INVALID'});
 }
 assert.equal(calls,0);
 assert.equal((await port.graph({operation:'sources',key})).state,'indexed-snapshot');
 await assert.rejects(port.graph({operation:'sources',key}),{code:'OWNER_AUTH'});
 await assert.rejects(port.graph({operation:'sources',key}),{code:'OWNER_AUTH'});
 assert.equal(calls,2);
});

test('semantic reads admit only closed task and direction combinations with live owner scope',async()=>{
 const key='vivim.product-pure-host-bridge@2';
 const observed=[];let live=true;
 const port=createDevelopmentReadPort({config:{approvedRoots:[path.resolve('approved-repo')]},sessionId:'local',stillOwner:()=>live,
  createSurface:async opts=>({graph:async input=>{
   assert.equal(opts.authorize({actorId:'desktop-owner',sessionId:'local',domain:'development',operation:'source.read'}),true);
   assert.equal(opts.authorize({actorId:'desktop-owner',sessionId:'local',domain:'personal',operation:'source.read'}),false);
   observed.push(input);return {authority:'none',executionAuthorized:false,effectPerformed:false};
  }})});
 const valid=[
  {operation:'semantic-program',key,task:'inspect'},
  {operation:'semantic-program',key,task:'impact'},
  {operation:'semantic-program',key,task:'compose'},
  {operation:'semantic-coverage',key,direction:'imports'},
  {operation:'semantic-closure',key,direction:'dependents'}
 ];
 for(const input of valid)assert.equal((await port.graph(input)).effectPerformed,false);
 for(const input of [
  {operation:'semantic-program',key,task:'effect'},
  {operation:'semantic-program',key,task:'inspect',direction:'imports'},
  {operation:'semantic-program',key:'unversioned',task:'inspect'},
  {operation:'semantic-closure',key,direction:'all'},
  {operation:'semantic-coverage',key,direction:'imports',root:'unapproved'},
  {operation:'program',key,program:'{}'}
 ])await assert.rejects(port.graph(input),{code:'HQ_GRAPH_QUERY_INVALID'});
 assert.deepEqual(observed,valid);
 live=false;await assert.rejects(port.graph(valid[0]),{code:'OWNER_AUTH'});
});
