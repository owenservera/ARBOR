import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {studioOperationsStatus} from '../ux/model.mjs';

const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const example={
  schema:'vivim.studio-operations/1',authority:'read-only',
  state:'source-backed',
  capture:{state:'source-backed',recorderState:'idle',
    browserState:'not-running',browserVerified:false,
    privatePageUrl:'https://private.invalid/thread?token=secret'},
  drive:{state:'source-backed',shown:1,active:0,
    jobs:[{id:'private-id',prompt:'private prompt',reply:'private reply'}]}
};

test('Studio owner-preview uses only existing Host state and has no execution controls',()=>{
  assert.match(app,/const studio=studioOperationsStatus\(S\.statusObj\?\.snapshot\?\.studioOperations\)/);
  assert.match(app,/Changes require a separate owner approval in native GPUI/);
  const body=app.slice(app.indexOf('function renderHostPreviewActivity()'),
    app.indexOf('async function refreshHostPreview()'));
  assert.ok(body.includes('studioOperationsStatus'));
  assert.doesNotMatch(body,/\bfetch\(|\bexecute\(|\bplan_studio_action\(|\bwindow\.open\(/);
  assert.match(app,/if \(!HOST_PREVIEW\) return;\s*const sequence = \+\+previewReadSequence/);
});

test('Studio operating summary accepts only bounded enums and numbers, never source prose',()=>{
  const value=studioOperationsStatus(example);
  assert.equal(value.state,'source-backed');
  assert.equal(value.capture,'Capture · idle');
  assert.equal(value.browser,'Dedicated browser · not-running · not ready');
  assert.equal(value.drive,'Drive · 1 recent jobs · 0 active');
  const serialized=JSON.stringify(value);
  for(const secret of ['private.invalid','secret','private prompt','private reply','private-id']){
    assert.ok(!serialized.includes(secret),secret+' cannot reach presentation');
  }
  assert.equal(studioOperationsStatus({...example,authority:'provider'}).state,'unavailable');
  assert.equal(studioOperationsStatus({...example,schema:'untrusted'}).state,'unavailable');
  assert.equal(studioOperationsStatus({...example,state:'unavailable'}).state,'unavailable');
  assert.equal(studioOperationsStatus({...example,
    capture:{...example.capture,recorderState:'sending'}}).capture,'Capture source unavailable');
  assert.equal(studioOperationsStatus({...example,
    drive:{...example.drive,active:999}}).drive,'Drive job source unavailable');
  assert.equal(studioOperationsStatus({...example,
    capture:{state:'unavailable'},drive:{state:'unavailable'}}).state,'unavailable');
});
