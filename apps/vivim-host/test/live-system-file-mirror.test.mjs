import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createLiveSystemFileMirror} from '../control/live-system-file-mirror.mjs';
import {closeNativeProductKernel} from '../control/native-product-kernel.mjs';

test('owner materialization is atomic JSON and file edits are inert Rust candidates',async t=>{
  const dir=mkdtempSync(path.join(tmpdir(),'vivim-live-mirror-'));
  t.after(()=>{closeNativeProductKernel();rmSync(dir,{recursive:true,force:true});});
  const mirror=createLiveSystemFileMirror({dataRoot:dir});
  const view={schema:'vivim.host-live-system/1',state:'source-backed',
    epoch:'host.test',revision:1,regions:[],coverage:{complete:false},
    authority:'read-only-projection',executionAuthorized:false,effectPerformed:false};
  const wrote=await mirror.publish(view);
  assert.equal(wrote.state,'written');
  const current=JSON.parse(readFileSync(mirror.file,'utf8'));
  assert.equal(current.schema,'vivim.live-system-state/1');
  assert.equal(current.sequence,1);
  assert.equal((await mirror.admitEdited()).state,'refused');
  writeFileSync(mirror.proposalFile,JSON.stringify({...current,sequence:2})+'\n');
  const refusal=await mirror.admitEdited();
  assert.equal(refusal.state,'refused');
  assert.equal(refusal.executionAuthorized,false);
  assert.equal(refusal.effectPerformed,false);
  assert.equal(refusal.reason,'StaleSource');
  const restored=await mirror.publish(view);
  assert.equal(restored.state,'written');
  assert.equal(JSON.parse(readFileSync(mirror.file,'utf8')).sequence,1);
  assert.equal(JSON.parse(readFileSync(mirror.proposalFile,'utf8')).sequence,2); // refresh never erases edits
});
test('untrusted or overbroad views cannot be written to disk',async t=>{
  const dir=mkdtempSync(path.join(tmpdir(),'vivim-live-private-'));
  t.after(()=>{closeNativeProductKernel();rmSync(dir,{recursive:true,force:true});});
  const mirror=createLiveSystemFileMirror({dataRoot:dir});
  await assert.rejects(mirror.publish({schema:'vivim.host-live-system/1',state:'source-backed',
    epoch:'host.test',revision:1,regions:[{id:'private.conversation',exposure:'owner',writable:[]}],
    coverage:{complete:false},authority:'read-only-projection',executionAuthorized:false,effectPerformed:false}),
  {code:'LIVE_MIRROR_UNTRUSTED_VIEW'});
});