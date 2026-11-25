import test from 'node:test';
import assert from 'node:assert/strict';
import {createDevelopmentReadPort} from '../control/development-read-port.mjs';
const schema='vivim.host.hvi-workstation-read-request/1',sha='a'.repeat(40);
const request=()=>({schema,source:{repo:'Owner/Repo',sha},operation:'metadata',query:{limit:4}});
function fixture({onRead=()=>{},configured=true}={}){
 let owner=true,grantId='grant-one',granted=true,reads=0,observed;
 const adapter={authorizedDevelopmentSource:true,resolveRef(){},readCommit(){},listTree(){},readBlob(){}};
 const store={status:()=>({granted,id:grantId,repoIdentities:['owner/repo']}),verify:()=>({ok:granted,grant:{id:grantId}})};
 const controls={regrant:()=>{grantId='grant-two'},revoke:()=>{granted=false},logout:()=>{owner=false}};
 const port=createDevelopmentReadPort({config:configured?{hviRepositories:['owner/repo'],hviAdapter:adapter}:{},runtime:{ledger:{}},sessionId:'local',stillOwner:()=>owner,
  createGrantStore:()=>store,createHviPort:opts=>({readWorkstation:async(input,args)=>{
   reads++;observed={input,args,opts};
   const context={repoIdentity:input.source.repo,resolvedCommitSha:input.source.sha,sourceGrantRef:args.sourceGrantRef,workstationReadOperation:input.operation};
   assert.equal(opts.verifyGrant(context),true);
   for(const bad of [{repoIdentity:'other/repo'},{resolvedCommitSha:'b'.repeat(40)},{sourceGrantRef:'other'},{workstationReadOperation:'other'}])
    assert.equal(opts.verifyGrant({...context,...bad}),false);
   await onRead(controls);
   return {schema:'vivim.host.hvi-workstation-read/1',operation:input.operation,effectPerformed:false};
  }})});
 return {port,controls,reads:()=>reads,observed:()=>observed,adapter};
}
test('metadata uses canonical repo, exact grant and configured adapter',async()=>{
 const f=fixture();assert.equal((await f.port.readWorkstation(request())).effectPerformed,false);
 assert.equal(f.reads(),1);assert.equal(f.observed().input.source.repo,'owner/repo');
 assert.equal(f.observed().args.sourceGrantRef,'grant-one');assert.equal(f.observed().args.adapter,f.adapter);
});
test('files use identical binding and forward signal',async()=>{
 const f=fixture(),signal=new AbortController().signal;
 const input={schema,source:{repo:'owner/repo',sha},operation:'files',paths:['src/lib.rs','README.md']};
 assert.equal((await f.port.readWorkstation(input,{signal})).operation,'files');
 assert.equal(f.observed().args.signal,signal);assert.deepEqual(f.observed().input.paths,input.paths);
});
test('reject caller authority, mutable refs, mixed fields and invalid file lists before inner port',async()=>{
 const f=fixture();
 for(const input of [{...request(),sourceGrantRef:'bad'},{...request(),adapter:{}},{...request(),source:{repo:'owner/repo',ref:'main'}},
  {...request(),paths:['README.md']},{...request(),query:{shell:'bad'}},{schema,source:{repo:'owner/repo',sha},operation:'files',paths:[]},
  {schema,source:{repo:'owner/repo',sha},operation:'files',paths:Array(17).fill('README.md')},
  {schema,source:{repo:'owner/repo',sha},operation:'files',paths:Array(2)}])
  await assert.rejects(f.port.readWorkstation(input),{code:'HVI_SELECTION_INVALID'});
 assert.equal(f.reads(),0);
});
test('refuse unconfigured repository, missing grant or missing adapter',async()=>{
 const f=fixture();
 await assert.rejects(f.port.readWorkstation({...request(),source:{repo:'other/repo',sha}}),{code:'HVI_SOURCE_NOT_GRANTED'});
 f.controls.revoke();await assert.rejects(f.port.readWorkstation(request()),{code:'HVI_SOURCE_GRANT_REQUIRED'});
 assert.equal(f.reads(),0);await assert.rejects(fixture({configured:false}).port.readWorkstation(request()),{code:'HVI_SOURCE_ADAPTER_UNAVAILABLE'});
});
test('regrant of same repo during read denies old result',async()=>{
 const f=fixture({onRead:c=>c.regrant()});await assert.rejects(f.port.readWorkstation(request()),{code:'HVI_SOURCE_GRANT_STALE'});
});
test('revocation during read denies final disclosure',async()=>{
 const f=fixture({onRead:c=>c.revoke()});await assert.rejects(f.port.readWorkstation(request()),{code:'HVI_SOURCE_GRANT_STALE'});
});
test('owner logout during or before read denies disclosure',async()=>{
 const f=fixture({onRead:c=>c.logout()});await assert.rejects(f.port.readWorkstation(request()),{code:'OWNER_AUTH'});
 await assert.rejects(f.port.readWorkstation(request()),{code:'OWNER_AUTH'});assert.equal(f.reads(),1);
});
test('cancellation before or during read refuses result',async()=>{
 const controller=new AbortController(),f=fixture({onRead:()=>controller.abort()});
 await assert.rejects(f.port.readWorkstation(request(),{signal:controller.signal}),{code:'HVI_READ_CANCELLED'});
 await assert.rejects(f.port.readWorkstation(request(),{signal:controller.signal}),{code:'HVI_READ_CANCELLED'});
 assert.equal(f.reads(),1);
});
