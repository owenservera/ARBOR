import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
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
  const phone=capabilityCatalog({mode:'direct',paired:true,online:true,
    mediaVisible:true,controlRead:true});
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
  const match=searchCapabilities('web memory',{mode:'direct',paired:true,controlRead:true});
  assert.equal(match[0].id,'memory');
  for(const hit of searchCapabilities('',{})){
    assert.ok(['today','talk','build','world','me','control'].includes(hit.tab));
    assert.equal(Object.hasOwn(hit,'exec'),false);
    assert.equal(Object.hasOwn(hit,'handler'),false);
  }
});

test('pre-local features are wired to the one PWA entry and offline safe shell',()=>{
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const direct=readFileSync(new URL('../../vivim-host/direct-phone.mjs',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const renderer=readFileSync(new URL('../ux/render.mjs',import.meta.url),'utf8');
  const model=readFileSync(new URL('../ux/model.mjs',import.meta.url),'utf8');
  for(const asset of ['ux/readiness.mjs','ux/launcher.mjs','ux/launcher-ui.mjs',
    'ux/local-notes.mjs','ux/local-notes-ui.mjs']){
    assert.ok(direct.includes("'"+asset+"'"),'missing Direct asset '+asset);
    assert.ok(sw.includes("'"+asset+"'"),'missing SW asset '+asset);
  }
  assert.match(app,/mountCapabilityLauncher\(/);
  assert.match(app,/mountLocalNotes\(/);
  assert.match(app,/safeReadinessReport\(/);
  assert.match(app,/onCheckReadiness:/);
  assert.match(app,/ctrlKey \|\| e\.metaKey/);
  assert.match(renderer,/Device readiness/);
  assert.match(renderer,/Quick capture · works offline/);
  assert.match(model,/readiness: ctx\.readiness\?\.schema/);
  // The worker must carry a single generation-marked shell cache. Pin the invariant
  // (one CACHE constant, prefix-derived), not a version number that every shell
  // release bumps; build-vec-routing.test.mjs owns the exact generation.
  assert.match(sw,/var CACHE = 'vivim-relay-shell-v\d+'/);
  assert.match(sw,/var CACHE_PREFIX = 'vivim-relay-shell-'/);
});

test('Direct controls and install prompts require reported authority and browser state',()=>{
  const cloud=capabilityCatalog({mode:'cloud',paired:true,controlRead:true});
  assert.equal(cloud.rows.find(x=>x.id==='talk').available,false);
  const missing=capabilityCatalog({mode:'direct',paired:true,controlRead:false,mediaVisible:true});
  for(const id of ['talk','control','media','memory'])
    assert.equal(missing.rows.find(x=>x.id===id).available,false,id);
  const install=capabilityCatalog({mode:'direct',paired:true,installOffered:true});
  assert.equal(install.rows.find(x=>x.id==='install').available,true);
  assert.equal(capabilityCatalog({mode:'direct',paired:true}).rows.find(x=>x.id==='install').available,false);
  assert.equal(capabilityCatalog({mode:'direct',paired:true,installed:true,installOffered:true})
    .rows.find(x=>x.id==='install').available,false);
});

test('Host preview has no phone actions, and stale session headers never count as grant',()=>{
  const preview=capabilityCatalog({mode:'desktop-preview',online:true,paired:false,
    controlRead:false});
  for(const id of ['notes','theme','control','talk','memory','install'])
    assert.equal(preview.rows.find(x=>x.id===id).available,false,id);
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  assert.match(app,/paired: S\.paired && \(!transport\.direct \|\| !!transport\.deviceHeaders\?\.\(\)\)/);
  assert.match(app,/controlRead:!!transport\.deviceHeaders\?\.\(\)/);
  assert.match(app,/S\.manifest = data\.snapshot\.manifest \?\? null/);
  assert.match(app,/S\.manifest = null;\s*S\.media = \{ state: 'unavailable' \}/);
});

test('a controlled PWA adopts new shell only when sends and local work are clear',async()=>{
  // Run the production upgrade block, not a duplicated safety predicate.
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const begin=app.indexOf("if (!HOST_PREVIEW && 'serviceWorker' in navigator) {");
  const end=app.indexOf('\nmountUniversalDock();',begin);
  assert.ok(begin>=0&&end>begin,'production worker lifecycle exists');
  const handlers={};let reloads=0;
  const field={value:'',addEventListener:(type,fn)=>handlers['field:'+type]=fn};
  const sw={controller:{},register:async()=>({update:async()=>{}}),
    addEventListener:(type,fn)=>handlers['sw:'+type]=fn};
  const state={notes:false,voice:false,pending:false};
  const ctx={
    HOST_PREVIEW:false,navigator:{onLine:true,serviceWorker:sw},
    document:{visibilityState:'visible',addEventListener:(type,fn)=>handlers['document:'+type]=fn},
    transport:{direct:true,pending:()=>state.pending},
    S:{sigs:{},tab:'today',busy:false,sending:false,files:[]},
    N:{pending:null,sending:false},chatHasApproval:false,
    localNotes:{hasPendingLocalWork:()=>state.notes},
    localVoice:{hasPendingLocalWork:()=>state.voice},
    $:()=>field,window:{location:{reload:()=>{reloads++}}},
    renderSurfaces(){},setInterval(){}
  };
  vm.runInNewContext(app.slice(begin,end),ctx,{filename:'app-shell-upgrade.js'});
  await Promise.resolve();
  state.notes=true;
  handlers['sw:controllerchange']();
  assert.equal(reloads,0,'unsaved Quick capture note blocks takeover');
  state.notes=false;state.voice=true;
  handlers['field:input']();
  assert.equal(reloads,0,'local microphone/dictation review blocks takeover');
  state.voice=false;ctx.S.sending=true;
  handlers['field:input']();
  assert.equal(reloads,0,'in-flight relay send blocks takeover');
  ctx.S.sending=false;ctx.N.sending=true;
  handlers['field:input']();
  assert.equal(reloads,0,'in-flight phone send blocks takeover');
  ctx.N.sending=false;state.pending=true;
  handlers['field:input']();
  assert.equal(reloads,0,'Host transport mutation blocks takeover');
  state.pending=false;field.value='Keep this draft';
  handlers['field:input']();
  assert.equal(reloads,0,'composer draft blocks takeover');
  field.value='';
  handlers['field:input']();
  assert.equal(reloads,1,'the retained upgrade applies once the existing gates clear');
  handlers['field:input']();
  assert.equal(reloads,1,'no duplicate reload on repeated input');
});
