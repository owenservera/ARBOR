import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHviHostReadPort } from '../control/hvi-capability.mjs';
import { syntheticSource, SYNTHETIC_SHAS } from '../../../hq/version-intelligence/sources/fixtures.mjs';

const grant='fixture-grant',repo='synthetic/w2-host';
const req=(operation,args={})=>({schema:'vivim.host.hvi-workstation-read-request/1',
  source:{repo,sha:SYNTHETIC_SHAS.v1,subPath:'src'},operation,...args});
const port=(overrides={})=>createHviHostReadPort({actorId:'owner',sessionId:'local',enabled:true,
  approvedRepositories:[repo],verifySession:()=>true,verifyGrant:ctx=>ctx.sourceGrantRef===grant,...overrides});
const options=f=>({adapter:f.adapter,sourceGrantRef:grant});
test('metadata and file reads reuse the same source pin and owner grant without new authority',async()=>{
  const f=syntheticSource(),p=port();
  const metadata=await p.readWorkstation(req('metadata',{query:{prefix:'src',contains:'.mjs'}}),options(f));
  assert.deepEqual(metadata.result.entries.map(x=>x.path),['src/first.mjs','src/shared.mjs']);
  assert.equal(metadata.result.resolvedCommitSha,SYNTHETIC_SHAS.v1);
  assert.equal(f.calls.blobs.length,0);
  const files=await p.readWorkstation(req('files',{paths:['src/shared.mjs','src/first.mjs']}),options(f));
  assert.equal(files.result.resolvedCommitSha,metadata.result.resolvedCommitSha);
  assert.equal(files.result.manifestDigest,metadata.result.manifestDigest);
  assert.deepEqual(files.result.files.map(x=>x.path),['src/shared.mjs','src/first.mjs']);
  assert.equal(files.result.files[0].bytes.toString(),'export const shared = 1;\n');
  assert.equal(files.effectPerformed,false);assert.equal(files.remoteAccepted,false);
});
test('disabled port, unapproved repo, absent or wrong trusted grant fail before source I/O',async()=>{
  const f=syntheticSource(),input=req('files',{paths:['src/first.mjs']});
  await assert.rejects(port({enabled:false}).readWorkstation(input,options(f)),{code:'HOST_FEATURE_DISABLED'});
  await assert.rejects(port({approvedRepositories:[]}).readWorkstation(input,options(f)),{code:'SOURCE_UNAUTHORIZED'});
  await assert.rejects(port().readWorkstation(input,{adapter:f.adapter}),{code:'SOURCE_UNAUTHORIZED'});
  await assert.rejects(port().readWorkstation(input,{...options(f),sourceGrantRef:'wrong'}),{code:'SOURCE_UNAUTHORIZED'});
  await assert.rejects(port().readWorkstation({...input,sourceGrantRef:grant},options(f)),{code:'INVALID_REQUEST'});
  assert.equal(f.calls.tree.length,0);assert.equal(f.calls.blobs.length,0);
});
test('exact SHA, typed operation, sensitive path and subpath boundaries preflight',async()=>{
  const f=syntheticSource(),p=port();
  const input=req('files',{paths:['src/first.mjs']});
  await assert.rejects(p.readWorkstation({...input,source:{repo,ref:'main'}},options(f)),{code:'INVALID_REQUEST'});
  await assert.rejects(p.readWorkstation({...input,operation:'execute'},options(f)),{code:'INVALID_REQUEST'});
  await assert.rejects(p.readWorkstation(req('files',{paths:['.env.production']}),options(f)),{code:'SCOPE_ESCAPE'});
  await assert.rejects(p.readWorkstation(req('metadata',{query:{prefix:'src2'}}),options(f)),{code:'SCOPE_ESCAPE'});
  assert.equal(f.calls.tree.length,0);assert.equal(f.calls.blobs.length,0);
});
test('owner revocation during read returns no batch',async()=>{
  const f=syntheticSource();let allowed=true;
  const adapter={...f.adapter,readBlob:async input=>{const data=await f.adapter.readBlob(input);allowed=false;return data;}};
  await assert.rejects(port({verifySession:()=>allowed}).readWorkstation(req('files',{paths:['src/first.mjs','src/shared.mjs']}),{adapter,sourceGrantRef:grant}),{code:'SOURCE_UNAUTHORIZED'});
  assert.equal(f.calls.blobs.length,1);
});

test('content search uses exact committed batch, no bytes or authority expansion',async()=>{
 const f=syntheticSource(),p=port();
 const r=await p.readWorkstation(req('search',{paths:['src/first.mjs','src/shared.mjs'],query:{literal:'export const',limit:1}}),options(f));
 assert.equal(r.result.schema,'arbor.hvi.pinned-text-search/1');
 assert.equal(r.result.matches[0].path,'src/first.mjs');assert.equal(r.result.truncated,true);
 assert.equal(r.result.matches[0].columnUtf16,1);assert.equal('bytes' in r.result.matches[0],false);
 assert.equal(r.remoteAccepted,false);assert.equal(f.calls.blobs.length,2);
});
test('search rejects invalid query and excluded paths before source access',async()=>{
 const f=syntheticSource(),p=port();
 await assert.rejects(p.readWorkstation(req('search',{paths:['src/first.mjs'],query:{literal:'x',regex:true}}),options(f)),{code:'RESOURCE_LIMIT'});
 await assert.rejects(p.readWorkstation(req('search',{paths:['.env.production'],query:{literal:'x'}}),options(f)),{code:'SCOPE_ESCAPE'});
 assert.equal(f.calls.tree.length,0);assert.equal(f.calls.blobs.length,0);
});
