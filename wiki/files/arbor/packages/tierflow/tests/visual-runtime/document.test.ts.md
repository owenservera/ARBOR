# File: packages/tierflow/tests/visual-runtime/document.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/document.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6615 B |
| Lines | 91 |
| Hash | f965af9ffd6b |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 6 | no | function fixture(): Record&lt;string,any&gt; { |
| refused | function | 17 | no | function refused(patch:(d:Record&lt;string,any&gt;)=&gt;void,code:string) { |
| f | const | 18 | no | const f=fixture();patch(f); |
| r | const | 19 | no | const r=validateUiDocument(f);assert.equal(r.ok,false,JSON.stringify(r)); |
| d | const | 24 | no | const d=parseUiDocument(fixture());assert.equal(d.schema,UI_DOCUMENT_SCHEMA); |
| cycle | const | 58 | no | const cycle=fixture();cycle.self=cycle; |
| c | const | 59 | no | const c=validateUiDocument(cycle);assert.equal(c.ok,false);if(!c.ok)assert.equal(c.diagnostics[0]?.code,&#39;CYCLE&#39;); |
| getter | const | 60 | no | const getter=fixture();Object.defineProperty(getter.nodes[1].props,&#39;evil&#39;,{enumerable:true,get(){throw Error(&#39;getter executed&#39;);}}); |
| r | const | 61 | no | const r=validateUiDocument(getter);assert.equal(r.ok,false); |
| symbol | const | 62 | no | const symbol=fixture();(symbol as any)[Symbol(&#39;bad&#39;)]=&#39;bad&#39;;assert.equal(validateUiDocument(symbol).ok,false); |
| proto | const | 63 | no | const proto=JSON.parse(JSON.stringify(fixture()));Object.defineProperty(proto.nodes[1].props,&#39;__proto__&#39;,{value:{isAdmin:true},enumerable:true}); |
| f | const | 73 | no | const f=fixture();f.nodes[1]={id:&#39;today&#39;,type:&#39;button&#39;,props:{label:&#39;Preview&#39;},children:[],a11y:{role:&#39;button&#39;,name:&#39;Preview&#39;,focusOrder:1},bindingRefs:[&#39;bind:today&#39;],actionRefs:[{id:&#39;ui.preview&#39;,ver… |
| good | const | 75 | no | const good=validateUiDocument(f,{knownActions:[{id:&#39;ui.preview&#39;,version:1}]});assert.equal(good.ok,true); |
| f | const | 86 | no | const f=fixture();f.nodes[0].layout.phone.maxWidth=width; |
| result | const | 87 | no | const result=validateUiDocument(f);assert.equal(result.ok,true); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/document/schema.ts | import | 3 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../src/visual-runtime/document/schema.ts.md) |
| ../../src/visual-runtime/document/validate.ts | import | 4 | [packages/tierflow/src/visual-runtime/document/validate.ts](../../src/visual-runtime/document/validate.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_DOCUMENT_SCHEMA, UI_DOCUMENT_LIMITS } from '../../src/visual-runtime/document/schema.ts';
import { validateUiDocument, parseUiDocument } from '../../src/visual-runtime/document/validate.ts';

function fixture(): Record<string,any> {
  return {
    schema:UI_DOCUMENT_SCHEMA,documentId:'doc:home',scope:{ownerRef:'owner:example',workspaceRef:'workspace:main'},revision:0,rootId:'root',
    nodes:[
      {id:'root',type:'stack',props:{direction:'vertical',gap:'md'},children:['today'],layout:{phone:{minWidth:0,maxWidth:360},desktop:{minWidth:0,maxWidth:1280}},a11y:{role:'main',name:'Home'}},
      {id:'today',type:'card',props:{title:'Today'},children:[],a11y:{role:'region',name:'Today summary'},bindingRefs:['bind:today']},
    ],
    bindings:[{id:'bind:today',version:1,nodeId:'today',field:'summary',knowledgeRef:'kb:opaque',provenanceRef:'source:opaque',readScope:'owner',availability:'stale'}],
    views:[{id:'view.phone',version:1,kind:'2d',viewport:'phone'},{id:'view.desktop',version:1,kind:'2d',viewport:'desktop'}],
  };
}
function refused(patch:(d:Record<string,any>)=>void,code:string) {
  const f=fixture();patch(f);
  const r=validateUiDocument(f);assert.equal(r.ok,false,JSON.stringify(r));
  if(!r.ok){assert.equal(r.readOnly,true);assert.equal(r.document,null);assert.equal(r.diagnostics[0]?.code,code);}
}

test('valid 2D-first document, typed KB read binding, explicit role, two responsive constraints',()=>{
  const d=parseUiDocument(fixture());assert.equal(d.schema,UI_DOCUMENT_SCHEMA);
  assert.deepEqual(d.nodes[0]?.children,['today']);assert.equal(d.bindings[0]?.availability,'stale');
  assert.ok(Object.isFrozen(d));assert.ok(Object.isFrozen(d.nodes));assert.ok(Object.isFrozen(d.nodes[0]));
  assert.throws(()=>{(d.nodes[0] as any).id='new';},TypeError);
});
test('unknown schema and unknown component refuse read only',()=>{
  refused(d=>{d.schema='vivim.ui-document/2'},'UNSUPPORTED_SCHEMA');
  refused(d=>{d.nodes[1].type='shell'},'UNKNOWN_COMPONENT');
  refused(d=>{d.nodes[0].a11y.role='group'},'INVALID_DOCUMENT');
  refused(d=>{d.nodes[1].a11y.role='button'},'INVALID_DOCUMENT');
});
test('graph safety: duplicate ID, missing child, duplicate child, detached cycle and too deep',()=>{
  refused(d=>{d.nodes[1].id='root'},'DUPLICATE_ID');
  refused(d=>{d.nodes[0].children=['absent']},'MISSING_REFERENCE');
  refused(d=>{d.nodes[0].children=['today','today']},'DUPLICATE_ID');
  refused(d=>{d.nodes.push({id:'self',type:'stack',props:{},children:['self'],a11y:{role:'group',name:'Self'}})},'CYCLE');
  refused(d=>{
    d.nodes[1]={id:'today',type:'stack',props:{},children:['deep1'],a11y:{role:'group',name:'Deep'}};
    for(let i=1;i<=7;i++)d.nodes.push({id:`deep${i}`,type:'stack',props:{},children:i===7?[]:[`deep${i+1}`],a11y:{role:'group',name:'Deep'}});
  },'LIMIT_EXCEEDED');
});
test('limits: excessive bytes and nodes are refused',()=>{
  refused(d=>{d.nodes[1].props.description='x'.repeat(UI_DOCUMENT_LIMITS.bytes)},'LIMIT_EXCEEDED');
  refused(d=>{for(let i=0;i<64;i++)d.nodes.push({id:`node${i}`,type:'text',props:{value:'Hi'},children:[],a11y:{role:'text',name:'Hi'}})},'LIMIT_EXCEEDED');
});
test('unsafe URL, HTML, JS, props / DOM authority and reactive functions refused',()=>{
  for(const malicious of ['<img src=x onerror=alert(1)>','javascript:alert(1)','https://evil.example','() => fetch(x)','data:text/html;base64,a'])
    refused(d=>{d.nodes[1].props.description=malicious},'UNSAFE_VALUE');
  for(const [field,value] of [['innerHTML','Hi'],['onclick','alert(1)'],['href','/api/capture'],['authorized',true],['privateDOM',true]])
    refused(d=>{d.nodes[1].props[field as string]=value},'UNSAFE_VALUE');
  refused(d=>{d.nodes[1].props.onClick=()=>{}},'UNSAFE_VALUE');
  refused(d=>{d.bindings[0].readScope='admin'},'INVALID_DOCUMENT');
});
test('object cycle, accessor property, symbol field, prototype keys never accepted',()=>{
  const cycle=fixture();cycle.self=cycle;
  const c=validateUiDocument(cycle);assert.equal(c.ok,false);if(!c.ok)assert.equal(c.diagnostics[0]?.code,'CYCLE');
  const getter=fixture();Object.defineProperty(getter.nodes[1].props,'evil',{enumerable:true,get(){throw Error('getter executed');}});
  const r=validateUiDocument(getter);assert.equal(r.ok,false);
  const symbol=fixture();(symbol as any)[Symbol('bad')]='bad';assert.equal(validateUiDocument(symbol).ok,false);
  const proto=JSON.parse(JSON.stringify(fixture()));Object.defineProperty(proto.nodes[1].props,'__proto__',{value:{isAdmin:true},enumerable:true});
  assert.equal(validateUiDocument(proto).ok,false);
});
test('binding references must be mutual and node-specific; no private DOM marker',()=>{
  refused(d=>{d.nodes[1].bindingRefs=['bogus']},'MISSING_REFERENCE');
  refused(d=>{d.bindings[0].nodeId='root'},'MISSING_REFERENCE');
  refused(d=>{d.nodes[1].visibility='pc-private'},'UNSAFE_VALUE');
  refused(d=>{d.bindings[0].knowledgeRef='https://secret'},'INVALID_DOCUMENT');
});
test('versioned, allowlisted action references are only inert; missing, spoofed, unversioned fail',()=>{
  const f=fixture();f.nodes[1]={id:'today',type:'button',props:{label:'Preview'},children:[],a11y:{role:'button',name:'Preview',focusOrder:1},bindingRefs:['bind:today'],actionRefs:[{id:'ui.preview',version:1}]};
  assert.equal(validateUiDocument(f).ok,false);
  const good=validateUiDocument(f,{knownActions:[{id:'ui.preview',version:1}]});assert.equal(good.ok,true);
  f.nodes[1].actionRefs[0].version=2;
  assert.equal(validateUiDocument(f,{knownActions:[{id:'ui.preview',version:1}]}).ok,false);
  f.nodes[1].actionRefs=[];assert.equal(validateUiDocument(f).ok,false);
});
test('spatial view must point to a 2D fallback, no spatial-only UI',()=>{
```

_First 80 of 92 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
