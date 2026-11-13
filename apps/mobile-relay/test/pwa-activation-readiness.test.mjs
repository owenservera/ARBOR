import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveReadiness,safeReadinessReport} from '../ux/readiness.mjs';
import {capabilityCatalog,searchCapabilities} from '../ux/launcher.mjs';

test('readiness never stores tokens, origins or Host message bodies',()=>{
  const view=deriveReadiness({mode:'direct',paired:true,online:true,secureContext:true,
    scopes:['control:read','SECRET_TEST_TOKEN'],providersSignedIn:2,hostReported:true,
    serviceWorkerSupported:true,serviceWorkerControlled:true,pendingSend:true,
    url:'https://my-private-host.ts.net',sessionId:'SECRET_SESSION',rawMessage:'SECRET_BODY'});
  assert.equal(view.schema,'vivim.pwa-readiness/1');
  assert.equal(view.summary,'paired-phone');
  assert.ok(view.pending);
  assert.ok(view.checks.some(c=>c.id==='pending'&&c.state==='attention'));
  const encoded=JSON.stringify(view)+safeReadinessReport(view);
  for(const secret of ['SECRET_TEST_TOKEN','SECRET_SESSION','SECRET_BODY','my-private-host'])
    assert.equal(encoded.includes(secret),false);
});
test('readiness distinguishes owner preview, offline and missing device grant',()=>{
  const owner=deriveReadiness({mode:'desktop-preview',paired:true,online:true,hostReported:true});
  assert.equal(owner.summary,'owner-preview');
  assert.equal(owner.checks.find(c=>c.id==='permission').state,'limited');
  const offline=deriveReadiness({mode:'direct',online:false,paired:false,scopes:[]});
  assert.equal(offline.summary,'offline');
  assert.equal(offline.checks.find(c=>c.id==='authority').state,'attention');
  assert.equal(offline.checks.find(c=>c.id==='network').state,'blocked');
  assert.equal(deriveReadiness({mode:'cloud'}).checks.find(c=>c.id==='direct').state,'limited');
});
test('capability finder shows real tabs and refuses inaccessible actions',()=>{
  const owner=capabilityCatalog({mode:'desktop-preview',paired:false,online:true});
  assert.equal(owner.rows.find(x=>x.id==='control').available,false);
  assert.equal(owner.rows.find(x=>x.id==='notes').available,false);
  const phone=capabilityCatalog({mode:'direct',paired:true,online:true,mediaVisible:true});
  assert.deepEqual(phone.rows.filter(x=>x.available).map(x=>x.tab).includes('world'),true);
  assert.equal(phone.rows.find(x=>x.id==='media').available,true);
  const offline=capabilityCatalog({mode:'direct',online:false,paired:false});
  assert.equal(offline.rows.find(x=>x.id==='notes').available,true);
  assert.equal(offline.rows.find(x=>x.id==='control').available,false);
  assert.equal(offline.rows.find(x=>x.id==='today').available,true);
});
test('capability finder searches locally, bounds input, never returns an effect instruction',()=>{
  assert.equal(searchCapabilities('movie',{mode:'direct',paired:true,mediaVisible:true})[0].id,'media');
  assert.equal(searchCapabilities('history',{mode:'direct',paired:true}).length,0);
  const match=searchCapabilities('web memory',{mode:'direct',paired:true});
  assert.equal(match[0].id,'memory');
  for(const hit of searchCapabilities('',{})){
    assert.ok(['today','talk','build','world','me','control'].includes(hit.tab));
    assert.equal(Object.hasOwn(hit,'exec'),false);
    assert.equal(Object.hasOwn(hit,'handler'),false);
  }
});
