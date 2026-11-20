# File: apps/mobile-relay/test/product-semantic-parity.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/product-semantic-parity.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3710 B |
| Lines | 56 |
| Hash | 4ab398a2a41a |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| planner | const | 19 | no | const planner=createControlPlanner(); |
| canonical | const | 21 | no | const canonical=planner.interpretCommand(text,{source:&#39;mobile&#39;}); |
| reading | const | 22 | no | const reading=planner.interpretText(text,{source:&#39;mobile&#39;}); |
| desktop | const | 23 | no | const desktop=planner.interpretText(text,{source:&#39;desktop&#39;}); |
| planner | const | 31 | no | const planner=createControlPlanner(),surface=blankSurface(); |
| compileUi | function | 32 | no | const compileUi=request=&gt;resolveBuildRequest({request,surface}); |
| text | const | 33 | no | const text=&#39;Add a card called Research&#39;; |
| meaning | const | 34 | no | const meaning=planner.interpretText(text,{source:&#39;mobile&#39;}); |
| route | const | 36 | no | const route=resolveProductRoute(text,{hostMeaning:meaning,compileUi}); |
| refusal | const | 40 | no | const refusal=planner.interpretText(&#39;do not delete the card&#39;,{source:&#39;mobile&#39;}); |
| surface | const | 47 | no | const surface=blankSurface(); |
| boot | const | 48 | no | const boot={schema:&#39;vivim.bootstrap-phone/1&#39;,state:&#39;ready&#39;}; |
| row | const | 52 | no | const row={status:&#39;applied&#39;,surfaceId:surface.surfaceId,revision:surface.revision,surface}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control-language.mjs | import | 3 | [apps/mobile-relay/control-language.mjs](../control-language.mjs.md) |
| ../control-chat.mjs | import | 4 | [apps/mobile-relay/control-chat.mjs](../control-chat.mjs.md) |
| ../build-canvas.mjs | import | 5 | [apps/mobile-relay/build-canvas.mjs](../build-canvas.mjs.md) |
| ../build-composer.mjs | import | 6 | [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) |
| ../../vivim-host/control/intent-planner.mjs | import | 7 | [apps/vivim-host/control/intent-planner.mjs](../../vivim-host/control/intent-planner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveLocalDestination,resolveDesktopDestination,resolveProductRoute} from '../control-language.mjs';
import {resolveLocalDestination as talkDestination} from '../control-chat.mjs';
import {buildRequestRoute} from '../build-canvas.mjs';
import {resolveBuildRequest,blankSurface,buildSurfaceFromBootstrap} from '../build-composer.mjs';
import {createControlPlanner} from '../../vivim-host/control/intent-planner.mjs';
test('actual surface navigation consumers share semantic destinations',()=>{
  for(const text of ['open the wiki','  OPEN   WIKI ','show wiki']){
    assert.equal(resolveLocalDestination(text),'wiki');
    assert.equal(talkDestination(text),'wiki');
    assert.deepEqual(buildRequestRoute(text),{kind:'navigate',tab:'wiki'});
    assert.deepEqual(resolveDesktopDestination(text),{tab:'wiki',href:'/wiki'});
  }
  assert.equal(resolveLocalDestination('open wiki and delete it'),null);
  assert.deepEqual(resolveDesktopDestination('open pocket'),{tab:'pocket',href:null});
});
test('read-only interpretation projects the canonical Host command IR',()=>{
  const planner=createControlPlanner();
  for(const text of ['show status','list wiki pages','edit wiki section main/about saying Updated from VIVIM']){
    const canonical=planner.interpretCommand(text,{source:'mobile'});
    const reading=planner.interpretText(text,{source:'mobile'});
    const desktop=planner.interpretText(text,{source:'desktop'});
    assert.equal(canonical.outcome,'candidate',text);
    assert.deepEqual(reading.candidate,{actionId:canonical.actionId,args:canonical.args});
    assert.deepEqual(desktop.candidate,reading.candidate);
    assert.equal(resolveProductRoute(text,{hostMeaning:reading,compileUi:()=>assert.fail()}).kind,'host');
  }
});
test('refusals retain precedence and existing VEC supplies visual candidates',()=>{
  const planner=createControlPlanner(),surface=blankSurface();
  const compileUi=request=>resolveBuildRequest({request,surface});
  const text='Add a card called Research';
  const meaning=planner.interpretText(text,{source:'mobile'});
  assert.equal(meaning.outcome,'interpretation_required');
  const route=resolveProductRoute(text,{hostMeaning:meaning,compileUi});
  assert.equal(route.kind,'ui');
  assert.equal(route.reading.preview.persisted,false);
  assert.equal(route.reading.preview.surface.tree.children[0].props.title,'Research');
  const refusal=planner.interpretText('do not delete the card',{source:'mobile'});
  assert.equal(resolveProductRoute('do not delete the card',{hostMeaning:refusal,compileUi:()=>assert.fail()}).kind,'refused');
  assert.equal(resolveProductRoute(text,{hostMeaning:null,compileUi}).kind,'unavailable');
  assert.equal(resolveProductRoute('What is photosynthesis?',{hostMeaning:{outcome:'interpretation_required'},compileUi}).kind,'provider');
});

test('actual revision envelope is unwrapped, never interpreted as a UI tree',()=>{
  const surface=blankSurface();
  const boot={schema:'vivim.bootstrap-phone/1',state:'ready'};
  assert.equal(buildSurfaceFromBootstrap(boot),null);
  assert.deepEqual(buildSurfaceFromBootstrap({...boot,uiRevision:null}),surface);
  assert.equal(buildSurfaceFromBootstrap({...boot,uiRevision:surface}),null);
  const row={status:'applied',surfaceId:surface.surfaceId,revision:surface.revision,surface};
  assert.deepEqual(buildSurfaceFromBootstrap({...boot,uiRevision:row}),surface);
  assert.equal(buildSurfaceFromBootstrap({...boot,uiRevision:{...row,revision:999}}),null);
  assert.equal(buildSurfaceFromBootstrap({...boot,state:'unavailable',uiRevision:null}),null);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
