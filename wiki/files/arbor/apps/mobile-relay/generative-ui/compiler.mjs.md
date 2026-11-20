# File: apps/mobile-relay/generative-ui/compiler.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/generative-ui/compiler.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8175 B |
| Lines | 100 |
| Hash | 4901668a0f5a |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT_FIELDS | const | 4 | no | const ROOT_FIELDS=[&#39;schema&#39;,&#39;surfaceId&#39;,&#39;baseRevision&#39;,&#39;operations&#39;,&#39;explanation&#39;,&#39;assumptions&#39;,&#39;unknowns&#39;]; |
| OP_FIELDS | const | 5 | no | const OP_FIELDS={insert:[&#39;opId&#39;,&#39;type&#39;,&#39;parentId&#39;,&#39;index&#39;,&#39;component&#39;],remove:[&#39;opId&#39;,&#39;type&#39;,&#39;componentId&#39;],move:[&#39;opId&#39;,&#39;type&#39;,&#39;componentId&#39;,&#39;parentId&#39;,&#39;index&#39;], |
| safeInput | function | 8 | no | function safeInput(source){ |
| locate | function | 17 | no | function locate(root,what){let found=null;const visit=(n,parent)=&gt;{if(n.id===what)found={node:n,parent};for(const c of n.children)visit(c,n);};visit(root,null);return found;} |
| normalizeOp | function | 18 | no | function normalizeOp(op){ |
| compileUiProposal | function | 30 | yes | export function compileUiProposal({proposal,surface,approvedRefs=[],audience=&#39;pc&#39;}={}) { |
| refs | const | 33 | no | const refs=new Set(approvedRefs.map(id)); |
| before | const | 34 | no | const before=validateSurface(surface,{refs}); |
| p | const | 35 | no | const p=safeInput(proposal);keys(p,ROOT_FIELDS,&#39;proposal&#39;); |
| notes | const | 39 | no | const notes={explanation:str(p.explanation,400),assumptions:p.assumptions.map(v=&gt;str(v,160)),unknowns:p.unknowns.map(v=&gt;str(v,160))}; |
| seenOps | const | 40 | no | const seenOps=new Set(),next=structuredClone(before); |
| op | const | 42 | no | const op=normalizeOp(raw);if(seenOps.has(op.opId))invalid(&#39;duplicate operation id&#39;);seenOps.add(op.opId); |
| target | const | 45 | no | const target=locate(next.tree,op.parentId); |
| index | const | 49 | no | const index=op.index??target.node.children.length; |
| entry | const | 54 | no | const entry=locate(next.tree,op.componentId);if(!entry?.parent)invalid(&#39;unknown component&#39;); |
| entry | const | 57 | no | const entry=locate(next.tree,op.componentId);if(!entry)invalid(&#39;unknown component&#39;); |
| entry | const | 60 | no | const entry=locate(next.tree,op.componentId);if(!entry)invalid(&#39;unknown component&#39;); |
| entry | const | 64 | no | const entry=locate(next.tree,op.componentId);if(!entry)invalid(&#39;unknown component&#39;); |
| node | const | 65 | no | const node=entry.node; |
| entry | const | 72 | no | const entry=locate(next.tree,op.componentId),dest=locate(next.tree,op.parentId); |
| ancestors | function | 74 | no | const ancestors=(n,target)=&gt;n===target\|\|n.children.some(c=&gt;ancestors(c,target)); |
| index | const | 77 | no | const index=op.index??dest.node.children.length;if(index&gt;dest.node.children.length)invalid(&#39;move index&#39;); |
| priorPrivate | const | 84 | no | const priorPrivate=new Map(); |
| scan | function | 85 | no | const scan=(n,parentPrivate=false)=&gt;{const hidden=parentPrivate\|\|n.visibility===&#39;pc-private&#39;;if(hidden)priorPrivate.set(n.id,JSON.stringify(n));for(const child of n.children)scan(child,hidden);};scan… |
| current | const | 87 | no | const current=locate(next.tree,componentId)?.node; |
| concealed | function | 91 | no | const concealed=(n,hidden=false)=&gt;{const h=hidden\|\|n.visibility===&#39;pc-private&#39;;if(n.id===componentId)return h;return n.children.some(c=&gt;concealed(c,h));}; |
| after | const | 97 | no | const after=validateSurface(next,{refs}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./portable-digest.mjs | import | 2 | [apps/mobile-relay/generative-ui/portable-digest.mjs](./portable-digest.mjs.md) |
| ./catalog.mjs | import | 3 | [apps/mobile-relay/generative-ui/catalog.mjs](./catalog.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-canvas.mjs](../build-canvas.mjs.md) | ./generative-ui/compiler.mjs |
| [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) | ./generative-ui/compiler.mjs |
| [apps/mobile-relay/test/build-vec-theme.test.mjs](../test/build-vec-theme.test.mjs.md) | ../generative-ui/compiler.mjs |
| [apps/mobile-relay/test/component-presentation.test.mjs](../test/component-presentation.test.mjs.md) | ../generative-ui/compiler.mjs |
| [apps/mobile-relay/test/generative-bootstrap.test.mjs](../test/generative-bootstrap.test.mjs.md) | ../generative-ui/compiler.mjs |
| [apps/mobile-relay/test/generative-browser-compat.test.mjs](../test/generative-browser-compat.test.mjs.md) | ../generative-ui/compiler.mjs |
| [apps/mobile-relay/test/generative-ui.test.mjs](../test/generative-ui.test.mjs.md) | ../generative-ui/compiler.mjs |
| [apps/mobile-relay/test/tierflow-build.test.mjs](../test/tierflow-build.test.mjs.md) | ../generative-ui/compiler.mjs |
| [apps/mobile-relay/test/vec-ui-compiler.test.mjs](../test/vec-ui-compiler.test.mjs.md) | ../generative-ui/compiler.mjs |
| [apps/mobile-relay/vec/ui-adapter.mjs](../vec/ui-adapter.mjs.md) | ../generative-ui/compiler.mjs |
| [apps/vivim-host/bootstrap/service.mjs](../../vivim-host/bootstrap/service.mjs.md) | ../../mobile-relay/generative-ui/compiler.mjs |
| [apps/vivim-host/receipt-runner.mjs](../../vivim-host/receipt-runner.mjs.md) | ../mobile-relay/generative-ui/compiler.mjs |
| [apps/vivim-host/test/bootstrap-command-apply.test.mjs](../../vivim-host/test/bootstrap-command-apply.test.mjs.md) | ../../mobile-relay/generative-ui/compiler.mjs |
| [apps/vivim-host/test/ui-revision.test.mjs](../../vivim-host/test/ui-revision.test.mjs.md) | ../../mobile-relay/generative-ui/compiler.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 29 | v2:consumes | — | vivim.ui-proposal@1 | vivim.ui-proposal@1 |

## Excerpt

```javascript
// GUI01: complete-reply-only UI proposal validation + pure preview compiler. Never persists or executes effects.
import {digestJson} from './portable-digest.mjs';
import {CATALOG_VERSION,MAX,PROPOSAL_SCHEMA,PREVIEW_SCHEMA,invalid,keys,plain,id,str,int,validateProps,validateTheme,validateSurface,validateTree,validateComponentPresentation,LIVE_UI_BINDINGS} from './catalog.mjs';
const ROOT_FIELDS=['schema','surfaceId','baseRevision','operations','explanation','assumptions','unknowns'];
const OP_FIELDS={insert:['opId','type','parentId','index','component'],remove:['opId','type','componentId'],move:['opId','type','componentId','parentId','index'],
  'replace-props':['opId','type','componentId','props'],'set-theme':['opId','type','theme'],
  'set-presentation':['opId','type','componentId','presentation'], 'set-live-binding':['opId','type','componentId','liveBinding']};
function safeInput(source){
  if(typeof source==='string') {
    if(new TextEncoder().encode(source).byteLength>MAX.bytes)invalid('proposal too large');
    try {return JSON.parse(source);} catch {invalid('expected a single complete JSON object');}
  }
  if(!plain(source))invalid('proposal must be an object');
  if(new TextEncoder().encode(JSON.stringify(source)).byteLength>MAX.bytes)invalid('proposal too large');
  return structuredClone(source);
}
function locate(root,what){let found=null;const visit=(n,parent)=>{if(n.id===what)found={node:n,parent};for(const c of n.children)visit(c,n);};visit(root,null);return found;}
function normalizeOp(op){
  if(!plain(op)||!Object.hasOwn(OP_FIELDS,op.type))invalid('unsupported operation');
  keys(op,OP_FIELDS[op.type],'operation');id(op.opId);
  if(op.type==='insert'){id(op.parentId);if(op.index!==undefined)int(op.index,0,MAX.children);if(!plain(op.component))invalid('invalid inserted component');}
  if(op.type==='remove'||op.type==='move'||op.type==='replace-props'||op.type==='set-presentation'||op.type==='set-live-binding')id(op.componentId);
  if(op.type==='move'){id(op.parentId);if(op.index!==undefined)int(op.index,0,MAX.children);}
  if(op.type==='replace-props'&&!plain(op.props))invalid('invalid changed props');
  if(op.type==='set-presentation'&&op.presentation!==null&&!plain(op.presentation))invalid('invalid changed presentation');
  if(op.type==='set-live-binding'&&op.liveBinding!==null&&(typeof op.liveBinding!=='string'||!Object.hasOwn(LIVE_UI_BINDINGS,op.liveBinding)))invalid('unsupported live UI binding');
  return op;
}
// @hq:consumes vivim.ui-proposal@1
export function compileUiProposal({proposal,surface,approvedRefs=[],audience='pc'}={}) {
  if(!['pc','phone'].includes(audience))invalid('unknown preview audience');
  if(!Array.isArray(approvedRefs)||approvedRefs.length>128)invalid('invalid reference allowlist');
  const refs=new Set(approvedRefs.map(id));
  const before=validateSurface(surface,{refs});
  const p=safeInput(proposal);keys(p,ROOT_FIELDS,'proposal');
  if(p.schema!==PROPOSAL_SCHEMA||p.surfaceId!==before.surfaceId||p.baseRevision!==before.revision)invalid('stale or mismatched surface revision');
  if(!Array.isArray(p.operations)||p.operations.length===0||p.operations.length>MAX.operations)invalid('operation count');
  if(!Array.isArray(p.assumptions)||p.assumptions.length>8||!Array.isArray(p.unknowns)||p.unknowns.length>8)invalid('assumptions/unknowns');
  const notes={explanation:str(p.explanation,400),assumptions:p.assumptions.map(v=>str(v,160)),unknowns:p.unknowns.map(v=>str(v,160))};
  const seenOps=new Set(),next=structuredClone(before);
  for(const raw of p.operations) {
    const op=normalizeOp(raw);if(seenOps.has(op.opId))invalid('duplicate operation id');seenOps.add(op.opId);
    if(op.type==='set-theme'){next.theme=validateTheme(op.theme);continue;}
    if(op.type==='insert') {
      const target=locate(next.tree,op.parentId);
      if(!target||!['stack','grid','card'].includes(target.node.type))invalid('invalid insertion parent');
      // Subtree validation happens after edit; no unbounded walks or injected arbitrary fields.
      if(!plain(op.component)||!Array.isArray(op.component.children??[])||locate(next.tree,op.component.id))invalid('invalid/duplicate insertion id');
      const index=op.index??target.node.children.length;
      if(index>target.node.children.length)invalid('insertion index');
      target.node.children.splice(index,0,op.component);
    } else if(op.type==='remove'){
      if(op.componentId==='root')invalid('root is protected');
      const entry=locate(next.tree,op.componentId);if(!entry?.parent)invalid('unknown component');
      entry.parent.children=entry.parent.children.filter(n=>n.id!==op.componentId);
    } else if(op.type==='replace-props'){
      const entry=locate(next.tree,op.componentId);if(!entry)invalid('unknown component');
      entry.node.props=validateProps(entry.node.type,{...entry.node.props,...op.props},{refs});
    } else if(op.type==='set-presentation'){
      const entry=locate(next.tree,op.componentId);if(!entry)invalid('unknown component');
      if(op.presentation===null)delete entry.node.presentation;
      else entry.node.presentation=validateComponentPresentation(entry.node.type,op.presentation);
    } else if(op.type==='set-live-binding'){
      const entry=locate(next.tree,op.componentId);if(!entry)invalid('unknown component');
      const node=entry.node;
      // Binding names are inert, finite source selectors. Never clear static values or install authority.
      if(!['collection','timeline'].includes(node.type)||node.props.items?.length!==0)invalid('live UI binding requires an empty structured component');
      if(op.liveBinding===null)delete node.liveBinding;
      else{if(LIVE_UI_BINDINGS[op.liveBinding]!==node.type)invalid('unsupported live UI binding');node.liveBinding=op.liveBinding;}
    } else if(op.type==='move'){
      if(op.componentId==='root')invalid('root is protected');
      const entry=locate(next.tree,op.componentId),dest=locate(next.tree,op.parentId);
      if(!entry?.parent||!dest||!['stack','grid','card'].includes(dest.node.type))invalid('invalid move');
      const ancestors=(n,target)=>n===target||n.children.some(c=>ancestors(c,target));
      if(ancestors(entry.node,dest.node))invalid('cycle');
      entry.parent.children=entry.parent.children.filter(n=>n.id!==op.componentId);
      const index=op.index??dest.node.children.length;if(index>dest.node.children.length)invalid('move index');
      dest.node.children.splice(index,0,entry.node);
    }
    // Fail at the operation boundary. Never return a partly valid preview.
```

_First 80 of 101 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
