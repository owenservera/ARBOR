import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,chmodSync,symlinkSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {loadOwnerToken,ownerTokenPath,verifyOwnerToken} from '../bootstrap/owner-auth.mjs';

test('owner capability is exclusive, stable, private and fail closed',t=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'vivim-owner-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const opts={dataRoot:dir,env:{},platform:process.platform,run:()=>{}}; // Windows ACL subprocess stub; native ACL remains a live acceptance gate.
  const first=loadOwnerToken(opts);
  assert.equal(first.source,'created');
  assert.equal(first.token.length>=32,true);
  assert.equal(verifyOwnerToken('Bearer '+first.token,first.token),true);
  assert.equal(verifyOwnerToken('Bearer wrong',first.token),false);
  const second=loadOwnerToken(opts);
  assert.equal(second.token,first.token);
  assert.equal(readFileSync(ownerTokenPath(dir),'utf8').trim(),first.token);
  if(process.platform!=='win32'){
    chmodSync(ownerTokenPath(dir),0o644);
    assert.throws(()=>loadOwnerToken(opts),/mode 0600/);
    assert.equal(readFileSync(ownerTokenPath(dir),'utf8').trim(),first.token);
  }
});

test('missing credential does not appear on read-only access',t=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'vivim-owner-empty-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const result=loadOwnerToken({dataRoot:dir,env:{},create:false,platform:process.platform,run:()=>{}});
  assert.equal(result.token,null);
  assert.equal(result.source,'missing');
});
