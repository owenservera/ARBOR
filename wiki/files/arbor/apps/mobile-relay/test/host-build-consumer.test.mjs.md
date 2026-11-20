# File: apps/mobile-relay/test/host-build-consumer.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/host-build-consumer.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4710 B |
| Lines | 92 |
| Hash | d8968f2fa244 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| mockDom | function | 7 | no | function mockDom() { |
| handlers | const | 8 | no | const handlers=new Map(); |
| doc | const | 10 | no | const doc={ createElement(tag) { |
| mount | const | 18 | no | const mount={ownerDocument:doc, children:[],replaceChildren(...children){this.children=children;}}; |
| host | function | 21 | no | const host = (revision, status=&#39;applied&#39;) =&gt; { |
| surface | const | 22 | no | const surface={...createSurface(), revision}; |
| selected | variable | 28 | no | let selected=null,instancesNow=[]; |
| build | const | 29 | no | const build=mountBuildSurface(mount,{onSelection:row=&gt;{selected=row},onInstances:rows=&gt;{instancesNow=rows}}); |
| emptyHost | const | 32 | no | const emptyHost={state:&#39;ready&#39;,schema:&#39;vivim.bootstrap-phone/1&#39;,uiRevision:null}; |
| first | const | 39 | no | const first=build.setSurface(host(5)); |
| instances | const | 43 | no | const instances=build.listInstances(); |
| keyDigest | const | 54 | no | const keyDigest=selected.meaning.meaningDigest; |
| same | const | 59 | no | const same=build.setSurface(host(5)); |
| regression | const | 63 | no | const regression=build.setSurface(host(4)); |
| source | const | 88 | no | const source=readFileSync(new URL(&#39;../app.js&#39;,import.meta.url),&#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../generative-ui/catalog.mjs | import | 4 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/phone-surface.mjs | import | 5 | [apps/mobile-relay/generative-ui/phone-surface.mjs](../generative-ui/phone-surface.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSurface } from '../generative-ui/catalog.mjs';
import { mountBuildSurface } from '../generative-ui/phone-surface.mjs';

function mockDom() {
  const handlers=new Map();
  globalThis.window={ addEventListener(name, fn) { handlers.set(name, fn); } };
  const doc={ createElement(tag) {
    return { tag, children:[], style:{}, attrs:{}, listeners:{},
      setAttribute(name,value){this.attrs[name]=value;},
      addEventListener(name,fn){this.listeners[name]=fn;},
      appendChild(child){this.children.push(child);},
      replaceChildren(...children){this.children=children;}
    };
  }};
  const mount={ownerDocument:doc, children:[],replaceChildren(...children){this.children=children;}};
  return {mount,handlers};
}
const host = (revision, status='applied') => {
  const surface={...createSurface(), revision};
  return {...surface, surface, status, changeId:'committed-change', parentRevision:revision-1};
};

test('actual phone Build consumer unwraps only applied Host head, refuses stale and clears disconnected paint', () => {
  const {mount,handlers}=mockDom();
  let selected=null,instancesNow=[];
  const build=mountBuildSurface(mount,{onSelection:row=>{selected=row},onInstances:rows=>{instancesNow=rows}});
  build.setSurface(null);
  assert.equal(build.draftSurface(),null,'unknown head is not an editable blank');
  const emptyHost={state:'ready',schema:'vivim.bootstrap-phone/1',uiRevision:null};
  build.setSurface(null,emptyHost);
  assert.deepEqual(build.draftSurface(),createSurface(),'explicit empty Host head permits only a revision-zero draft');
  assert.equal(build.surface(),null,'blank draft is never committed paint');
  assert.equal(mount.children.length,0);
  build.clear();
  assert.equal(build.draftSurface(),null,'disconnect clears the draft baseline');
  const first=build.setSurface(host(5));
  assert.equal(first.state,'ready');
  assert.equal(build.surface().revision,5);
  assert.equal(mount.children.length,1,'actual renderer mounted the clean surface');
  const instances=build.listInstances();
  assert.equal(instances.length,1);
  assert.equal(instances[0].instanceId,'root');
  assert.equal(instances[0].revision,5);
  assert.equal(Object.hasOwn(instances[0],'element'),false);
  assert.equal(build.selectInstance('root',4),false);
  assert.equal(build.selectInstance('root',5),true);
  assert.equal(selected.meaning.revision,5);
  assert.equal(selected.meaning.effects,'none');
  assert.equal(selected.meaning.canonicalId,instances[0].componentId);
  assert.equal(build.selectInstance('root',5,'keyboard'),true);
  const keyDigest=selected.meaning.meaningDigest;
  assert.equal(build.selectInstance('root',5,'tap'),true);
  assert.equal(selected.meaning.meaningDigest,keyDigest,'all local inputs select the same semantic identity');
  assert.equal(instancesNow.length,1);

  const same=build.setSurface(host(5));
  assert.equal(same.changed,false);
  assert.equal(build.revisionState().highRevision,5);

  const regression=build.setSurface(host(4));
  assert.equal(regression.reason,'ROLLBACK_PROOF_REQUIRED');
  assert.equal(build.surface(),null);
  assert.equal(mount.children.length,0,'old private nodes must be removed');
  assert.deepEqual(build.listInstances(),[]);
  assert.equal(build.selectedInstance(),null);
  assert.equal(selected,null);assert.deepEqual(instancesNow,[]);
  assert.equal(build.selectInstance('root',5),false);

  handlers.get('vivim:bootstrap-status')({detail:{snapshot:{bootstrap:{uiRevision:host(6)}}}});
  assert.equal(build.surface().revision,6,'status event uses the mounted consumer');
  assert.equal(mount.children.length,1);

  handlers.get('vivim:bootstrap-status')({detail:{snapshot:{bootstrap:{uiRevision:host(7,'previewed')}}}});
  assert.equal(build.surface(),null,'unapproved revision must not remain visible');
  assert.equal(mount.children.length,0);

  build.clear();
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
