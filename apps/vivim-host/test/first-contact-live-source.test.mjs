import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync,appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createFirstContactLiveSource} from '../control/first-contact-live-source.mjs';
const record=(stage,extra={})=>({schema:'vivim.first-contact-observation/1',
  origin:'owner-tailnet-http',time:new Date().toISOString(),stage,...extra});
test('actual first-contact diagnostic file yields only safe input and visual regions',async t=>{
  const dir=mkdtempSync(path.join(tmpdir(),'vivim-first-contact-live-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const src=createFirstContactLiveSource({dataRoot:dir});
  assert.deepEqual(await src.read(),[]);
  mkdirSync(path.join(dir,'diagnostics'),{recursive:true});
  const file=path.join(dir,'diagnostics','first-contact-events.jsonl');
  writeFileSync(file,JSON.stringify(record('input',{length:5}))+'\n'+
    JSON.stringify(record('render-matches',{matches:3,revision:7}))+'\n');
  const first=await src.read();
  assert.deepEqual(first.map(r=>r.id),['pwa.input','pwa.view']);
  assert.deepEqual(first.map(r=>r.kind),['input','visual']);
  assert.ok(first.every(r=>r.freshness==='current'&&r.exposure==='owner'&&
    r.writable.length===0&&r.sourceRevision===1));
  assert.equal(first[0].data.length,5);
  assert.equal(first[1].data.wikiRevision,7);
  assert.equal(first[1].data.matches,3);
  assert.deepEqual((await src.read()).map(r=>r.sourceRevision),[1,1]);
  appendFileSync(file,JSON.stringify(record('input',{length:6}))+'\n');
  const changed=await src.read();
  assert.deepEqual(changed.map(r=>r.sourceRevision),[2,1]);
  assert.equal(changed[0].data.length,6);
});
test('invalid fields and incomplete write never enter the live system',async t=>{
  const dir=mkdtempSync(path.join(tmpdir(),'vivim-first-contact-invalid-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  mkdirSync(path.join(dir,'diagnostics'),{recursive:true});
  const file=path.join(dir,'diagnostics','first-contact-events.jsonl');
  writeFileSync(file,JSON.stringify(record('render-matches',{matches:1,text:'secret'}))+'\n'+
    JSON.stringify(record('input',{length:2})).slice(0,25));
  const src=createFirstContactLiveSource({dataRoot:dir});
  assert.deepEqual(await src.read(),[]);
});