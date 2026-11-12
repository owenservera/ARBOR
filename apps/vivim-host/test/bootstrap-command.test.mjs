import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createBridgeStore} from '../../../studio/src/studio/bridge-commands.mjs';
import {createBootstrapRuntime} from '../bootstrap/runtime.mjs';
import {createBootstrapCommandWorker} from '../bootstrap/command-worker.mjs';

test('real local bridge executes visual grant, owner preset and Undo once without claiming Talk',t=>{
  const root=mkdtempSync(path.join(os.tmpdir(),'vivim-phone-vertical-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const bridge=createBridgeStore({root});
  const runtime=createBootstrapRuntime({dataRoot:root,file:':memory:'});
  t.after(()=>runtime.close());
  assert.equal(runtime.state,'ready');
  const worker=createBootstrapCommandWorker({root,runtime,store:bridge});
  const enqueue=(action,preset)=>bridge.create({
    text:action,consumer:'bootstrap',kind:'command',origin:'relay',
    chat:{mode:'bootstrap',action,...(preset?{preset}:{})}
  });
  const talk=bridge.create({text:'@chatgpt hello',consumer:'harness',kind:'command',
    origin:'relay',chat:{mode:'relay-chat'}});
  const grant=enqueue('grant-visual');
  assert.equal(worker.tick().length,1);
  assert.equal(bridge.get(grant.id).status,'done');
  assert.equal(bridge.get(talk.id).status,'queued');
  const choice=enqueue('choose-preset','dusk');
  const result=worker.tick();
  assert.equal(result[0].status,'done');
  assert.equal(runtime.projection().source,'owner-choice');
  assert.equal(runtime.projection().revision,0);
  assert.equal(runtime.projection().undo.available,true);
  const undo=enqueue('undo-theme');
  assert.equal(worker.tick()[0].status,'done');
  assert.equal(bridge.get(undo.id).status,'done');
  assert.equal(runtime.projection().themeStatus,'provisional');
  assert.equal(worker.tick().length,0);
  assert.equal(bridge.get(talk.id).status,'queued');
  worker.close();
});
