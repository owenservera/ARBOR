# File: packages/tierflow/tests/visual-runtime/integration-2/action-adapter.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/integration-2/action-adapter.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1794 B |
| Lines | 24 |
| Hash | aa0a1ac4b626 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| doc | function | 4 | no | const doc=()=&gt;({schema:&#39;vivim.ui-document/1&#39;,nodes:[{id:&#39;root&#39;,type:&#39;stack&#39;,children:[&#39;preview&#39;],props:{},a11y:{role:&#39;main&#39;,name:&#39;Synthetic&#39;}},{id:&#39;preview&#39;,type:&#39;button&#39;,props:{label:&#39;Preview&#39;},chil… |
| source | const | 6 | no | const source=doc(), before=JSON.stringify(source), result=projectInertActionRefs(source); |
| source | const | 14 | no | const source=doc();source.nodes[1].actionRefs=[v];assert.throws(()=&gt;projectInertActionRefs(source),/ACTION_ADAPTER_ACTION_VERSION/); |
| source | const | 18 | no | const source=doc();source.nodes[0].actionRefs=[{id:&#39;fixture_preview&#39;,version:1}]; |
| a | const | 22 | no | const a=doc();a.nodes[1].type=&#39;provider_webview&#39;;assert.throws(()=&gt;projectInertActionRefs(a),/NODE_TYPE/); |
| b | const | 23 | no | const b=doc();b.nodes[1].id=&#39;root&#39;;assert.throws(()=&gt;projectInertActionRefs(b),/NODE_ID/); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert | import | 2 | external |
| ../../../src/visual-runtime/integration-2/action-adapter.mjs | import | 3 | [packages/tierflow/src/visual-runtime/integration-2/action-adapter.mjs](../../../src/visual-runtime/integration-2/action-adapter.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {projectInertActionRefs} from '../../../src/visual-runtime/integration-2/action-adapter.mjs';
const doc=()=>({schema:'vivim.ui-document/1',nodes:[{id:'root',type:'stack',children:['preview'],props:{},a11y:{role:'main',name:'Synthetic'}},{id:'preview',type:'button',props:{label:'Preview'},children:[],a11y:{role:'button',name:'Preview',focusOrder:1},actionRefs:[{id:'fixture_preview',version:1}]}]});
test('preserves authoritative version in separate synthetic-only table',()=>{
 const source=doc(), before=JSON.stringify(source), result=projectInertActionRefs(source);
 assert.equal(result.synthetic,true);assert.equal(result.actionVersionTable[0].version,1);
 assert.equal(result.actionVersionTable[0].inert,true);
 assert.deepEqual(result.rendererDocument.nodes[1].actionRefs,['synthetic_ref_1_0']);
 assert.equal(JSON.stringify(source),before);
});
test('rejects unversioned or malformed action refs',()=>{
 for(const v of [{id:'fixture_preview'}, {id:'javascript:attack',version:1}, {id:'fixture_preview',version:0}]){
 const source=doc();source.nodes[1].actionRefs=[v];assert.throws(()=>projectInertActionRefs(source),/ACTION_ADAPTER_ACTION_VERSION/);
 }
});
test('never projects action refs on non-button controls',()=>{
 const source=doc();source.nodes[0].actionRefs=[{id:'fixture_preview',version:1}];
 assert.throws(()=>projectInertActionRefs(source),/ACTION_ADAPTER_ACTION_SCOPE/);
});
test('unknown type and duplicate identity refuse rather than silently coerce',()=>{
 const a=doc();a.nodes[1].type='provider_webview';assert.throws(()=>projectInertActionRefs(a),/NODE_TYPE/);
 const b=doc();b.nodes[1].id='root';assert.throws(()=>projectInertActionRefs(b),/NODE_ID/);
});
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
