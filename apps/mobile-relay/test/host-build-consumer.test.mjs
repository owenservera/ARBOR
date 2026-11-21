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
  assert.equal(build.surface(),null);
  assert.equal(build.revisionState().state,'blocked');
  build.setSurface(null,emptyHost);
  assert.equal(build.draftSurface(),null,'previously observed committed head cannot become a blank draft');
});

test('polling path checks full Host head and clears Build UI on lost status authority', () => {
  const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  assert.match(source,/const observed = build\.setSurface\(rev, st\?\.snapshot\?\.bootstrap\)/);
  assert.match(source,/if \(build\) build\.clear\(\)/);
  assert.doesNotMatch(source,/if \(rev && key !== buildKey\)/);
});

test('Build consumer uses the real VEC source watermark in the TierFlow path',()=>{
  const source=readFileSync(new URL('../generative-ui/phone-surface.mjs',import.meta.url),'utf8');
  assert.match(source,/bindingFence\.prepare\(data\)/);
  assert.match(source,/candidate\.commit\(\)/);
  assert.match(source,/bindingRevisions: \(\) => bindingFence\.status\(\)/);
  assert.match(source,/renderSurface\(mount, s,/);
});

test('Direct Build binding read is scoped to the active authorization',()=>{
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  assert.match(app,/build\.setBindingScope\(bindingScope\)/);
  assert.match(app,/build\.clearBindingScope\(\)/);
  assert.match(app,/'x-vivim-device-session'/);
  assert.match(app,/'x-vivim-grant-id'/);
  const adapter=readFileSync(new URL('../generative-ui/phone-surface.mjs',import.meta.url),'utf8');
  assert.match(adapter,/function setBindingScope\(identity\)/);
  assert.match(adapter,/bindingFence\.clearScope\(\)/);
});
