# File: apps/mobile-relay/test/pwa-activation-readiness.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/pwa-activation-readiness.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6579 B |
| Lines | 104 |
| Hash | 4d37f13bd2ca |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| view | const | 8 | no | const view=deriveReadiness({mode:&#39;direct&#39;,paired:true,online:true,secureContext:true, scopes:[&#39;control:read&#39;,&#39;SECRET_TEST_TOKEN&#39;],providersSignedIn:2,hostReported:true, serviceWorkerSupported:true,se… |
| encoded | const | 16 | no | const encoded=JSON.stringify(view)+safeReadinessReport(view); |
| owner | const | 21 | no | const owner=deriveReadiness({mode:&#39;desktop-preview&#39;,paired:true,online:true,hostReported:true}); |
| offline | const | 24 | no | const offline=deriveReadiness({mode:&#39;direct&#39;,online:false,paired:false,scopes:[]}); |
| owner | const | 31 | no | const owner=capabilityCatalog({mode:&#39;desktop-preview&#39;,paired:false,online:true}); |
| phone | const | 34 | no | const phone=capabilityCatalog({mode:&#39;direct&#39;,paired:true,online:true, mediaVisible:true,controlRead:true}); |
| offline | const | 38 | no | const offline=capabilityCatalog({mode:&#39;direct&#39;,online:false,paired:false}); |
| app | const | 56 | no | const app=readFileSync(new URL(&#39;../app.js&#39;,import.meta.url),&#39;utf8&#39;); |
| direct | const | 57 | no | const direct=readFileSync(new URL(&#39;../../vivim-host/direct-phone.mjs&#39;,import.meta.url),&#39;utf8&#39;); |
| sw | const | 58 | no | const sw=readFileSync(new URL(&#39;../sw.js&#39;,import.meta.url),&#39;utf8&#39;); |
| renderer | const | 59 | no | const renderer=readFileSync(new URL(&#39;../ux/render.mjs&#39;,import.meta.url),&#39;utf8&#39;); |
| model | const | 60 | no | const model=readFileSync(new URL(&#39;../ux/model.mjs&#39;,import.meta.url),&#39;utf8&#39;); |
| cloud | const | 82 | no | const cloud=capabilityCatalog({mode:&#39;cloud&#39;,paired:true,controlRead:true}); |
| missing | const | 84 | no | const missing=capabilityCatalog({mode:&#39;direct&#39;,paired:true,controlRead:false,mediaVisible:true}); |
| install | const | 87 | no | const install=capabilityCatalog({mode:&#39;direct&#39;,paired:true,installOffered:true}); |
| preview | const | 95 | no | const preview=capabilityCatalog({mode:&#39;desktop-preview&#39;,online:true,paired:false, controlRead:false}); |
| app | const | 99 | no | const app=readFileSync(new URL(&#39;../app.js&#39;,import.meta.url),&#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../ux/readiness.mjs | import | 4 | [apps/mobile-relay/ux/readiness.mjs](../ux/readiness.mjs.md) |
| ../ux/launcher.mjs | import | 5 | [apps/mobile-relay/ux/launcher.mjs](../ux/launcher.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
```

_First 80 of 105 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
