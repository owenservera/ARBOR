# File: packages/tierflow/src/visual-runtime/document/import-legacy.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/document/import-legacy.ts |
| Language | TypeScript |
| Kind | source |
| Size | 17063 B |
| Lines | 203 |
| Hash | 44aa247d7cc7 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LegacySchema | type | 12 | yes | export type LegacySchema = &#39;vivim.ui-surface/1&#39; \| &#39;vivim.ui-proposal/1&#39; \| &#39;vivim.surface/1&#39; \| &#39;tierflow.ui-world/1&#39;; |
| ImportLossCode | type | 13 | yes | export type ImportLossCode = |
| ImportLoss | interface | 17 | yes | export interface ImportLoss { readonly code: ImportLossCode; readonly sourceId: string; readonly message: string } |
| ImportProvenance | interface | 18 | yes | export interface ImportProvenance { |
| LegacyImportResult | type | 25 | yes | export type LegacyImportResult = |
| LegacyImportOptions | interface | 30 | yes | export interface LegacyImportOptions { |
| LOCAL_SELECTION_ACTION | const | 42 | no | const LOCAL_SELECTION_ACTION = Object.freeze({id:&#39;ui.local.select&#39;,version:1}); |
| ID | const | 43 | no | const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| RESTRICTED | const | 44 | no | const RESTRICTED = /&lt;\\s*\\/?[a-z!]\|javascript:\|data:\|vbscript:\|https?:\\/\\/\|www\\.\|(?:onerror\|onclick\|onload)\\s*=\|=&gt;\|\\beval\\s*\\(/i; function rec(v:unknown): v is Record&lt;string,unknown&gt; {return v!==null&amp;… |
| rec | function | 45 | no | function rec(v:unknown): v is Record&lt;string,unknown&gt; {return v!==null&amp;&amp;typeof v===&#39;object&#39;&amp;&amp;!Array.isArray(v);} |
| allowedFields | function | 46 | no | function allowedFields(v:Record&lt;string,unknown&gt;, allowed:readonly string[]):void { |
| key | function | 49 | no | function key(v:unknown): v is string {return typeof v===&#39;string&#39;&amp;&amp;ID.test(v)&amp;&amp;![&#39;constructor&#39;,&#39;prototype&#39;,&#39;__proto__&#39;].includes(v);} |
| safeText | function | 50 | no | function safeText(v:unknown): string\|null {return typeof v===&#39;string&#39; &amp;&amp; !!v.trim() &amp;&amp; v.length&lt;=L.text &amp;&amp; !RESTRICTED.test(v) &amp;&amp; !/[\\u0000-\\u001f\\u007f]/.test(v) ? v : null;} |
| refuse | function | 51 | no | function refuse(reason:string,losses:ImportLoss[]=[]):LegacyImportResult{return{status:&#39;unavailable&#39;,readOnly:true,document:null,reason,losses,provenance:null};} |
| view2d | function | 52 | no | function view2d():UiDocumentView[] {return [{id:&#39;view.phone&#39;,version:1,kind:&#39;2d&#39;,viewport:&#39;phone&#39;},{id:&#39;view.desktop&#39;,version:1,kind:&#39;2d&#39;,viewport:&#39;desktop&#39;}];} |
| root | function | 53 | no | function root():UiDocumentNode {return{id:&#39;root&#39;,type:&#39;stack&#39;,props:{direction:&#39;vertical&#39;,gap:&#39;md&#39;},children:[],a11y:{role:&#39;main&#39;,name:&#39;Imported UI preview&#39;}};} |
| doc | function | 54 | no | function doc(options:LegacyImportOptions,sourceId:string,revision:unknown,nodes:UiDocumentNode[],views:UiDocumentView[]):UiDocument { |
| cardKinds | const | 58 | no | const cardKinds=new Set([&#39;card&#39;,&#39;profile-card&#39;,&#39;project-card&#39;]); |
| fromHarness | function | 59 | no | function fromHarness(source:Record&lt;string,unknown&gt;, options:LegacyImportOptions,losses:ImportLoss[]):UiDocument { |
| nodes | const | 62 | no | const nodes:UiDocumentNode[]=[]; |
| walk | function | 63 | no | const walk=(v:unknown,depth:number):string=&gt;{ |
| p | const | 70 | no | const p=rec(v.props)?v.props:{}; |
| propsAllowed | const | 72 | no | const propsAllowed=v.type===&#39;stack&#39;?[&#39;direction&#39;,&#39;gap&#39;]:v.type===&#39;grid&#39;?[&#39;columns&#39;,&#39;gap&#39;]: |
| id | const | 79 | no | const id=v.id; |
| children | const | 82 | no | const children=v.children.map(c=&gt;walk(c,depth+1)); |
| node | variable | 83 | no | let node:UiDocumentNode; |
| label | const | 84 | no | const label=safeText(p.label)??&#39;Unavailable action&#39;; |
| value | const | 100 | no | const value=safeText(p.value);if(!value)throw Error(&#39;Unsafe text&#39;); |
| title | const | 103 | no | const title=safeText(p.title);if(!title)throw Error(&#39;Unsafe card label&#39;); |
| description | const | 104 | no | const description=p.description===undefined?undefined:safeText(p.description); |
| projected | const | 106 | no | const projected=typeof p.sourceRef===&#39;string&#39;&amp;&amp;options.projectedCardRefs?.includes(p.sourceRef)===true; |
| renderedType | const | 108 | no | const renderedType=projected&amp;&amp;(v.type===&#39;profile-card&#39;\|\|v.type===&#39;project-card&#39;)?v.type:&#39;card&#39;; |
| title | const | 111 | no | const title=safeText(p.title);if(!title\|\|!Array.isArray(p.items))throw Error(&#39;Invalid structured content&#39;); |
| items | const | 113 | no | const items = p.items.map((item:unknown)=&gt;{ if(!rec(item)\|\|!safeText(item.label))throw Error(&#39;Unsafe legacy item&#39;); if(v.type===&#39;chart&#39;) {if(typeof item.value!==&#39;number&#39;\|\|!Number.isFinite(item.value)… |
| rootId | const | 124 | no | const rootId=walk(source.tree,1); |
| fromHq | function | 129 | no | function fromHq(source:Record&lt;string,unknown&gt;,options:LegacyImportOptions,losses:ImportLoss[]):UiDocument { |
| objects | const | 131 | no | const objects=Object.values(source.objects); |
| nodes | const | 133 | no | const nodes:UiDocumentNode[]=[root()]; |
| children | const | 134 | no | const children=new Map&lt;string,string[]&gt;();children.set(&#39;root&#39;,[]); |
| o | const | 143 | no | const o=v as Record&lt;string,unknown&gt;, id=o.id as string, title=o.title as string; |
| parent | const | 144 | no | const parent=o.parentId===null\|\|o.parentId===undefined?&#39;root&#39;:o.parentId; |
| n | const | 157 | no | const n=nodes[i]!;const cs=children.get(n.id)??[]; |
| fromSpatial | function | 164 | no | function fromSpatial(source:Record&lt;string,unknown&gt;,options:LegacyImportOptions,losses:ImportLoss[]):UiDocument { |
| world | const | 166 | no | const world=source.world as Record&lt;string,unknown&gt;; |
| title | const | 167 | no | const title=safeText(world.title)??&#39;Spatial workspace&#39;; |
| nodes | const | 171 | no | const nodes:UiDocumentNode[]=[ |
| importLegacyUiDocument | function | 181 | yes | export function importLegacyUiDocument(raw:unknown, options:LegacyImportOptions):LegacyImportResult { |
| losses | const | 182 | no | const losses:ImportLoss[]=[]; |
| original | variable | 184 | no | let original:unknown; |
| schema | const | 188 | no | const schema= original.schema===&#39;vivim.ui-surface/1&#39; \|\| original.schema===&#39;vivim.ui-proposal/1&#39; \|\| original.schema===&#39;vivim.surface/1&#39; |
| candidate | const | 193 | no | const candidate=schema===&#39;vivim.ui-surface/1&#39;?fromHarness(original,options,losses) |
| verdict | const | 195 | no | const verdict=validateUiDocument(candidate,{knownActions:options.localSelectionControls===true?[LOCAL_SELECTION_ACTION]:[]}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./schema.ts | import | 6 | [packages/tierflow/src/visual-runtime/document/schema.ts](./schema.ts.md) |
| ./validate.ts | import | 10 | [packages/tierflow/src/visual-runtime/document/validate.ts](./validate.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/visual-runtime/document-compat.test.ts](../../../tests/visual-runtime/document-compat.test.ts.md) | ../../src/visual-runtime/document/import-legacy.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Explicit loss-reporting adapters. These are NOT migrations or UI writers.
 * Original source evidence stays separate from the canonical 2D document and
 * MUST NOT be sent to a device/renderer without a separately authorized broker.
 */
import {
  UI_DOCUMENT_SCHEMA, UI_DOCUMENT_LIMITS as L,
  type UiDocument, type UiDocumentNode, type UiDocumentView,
} from './schema.ts';
import { cloneInertJson, validateUiDocument } from './validate.ts';

export type LegacySchema = 'vivim.ui-surface/1' | 'vivim.ui-proposal/1' | 'vivim.surface/1' | 'tierflow.ui-world/1';
export type ImportLossCode =
  | 'ACTION_UNBOUND' | 'SOURCE_REF_UNBOUND' | 'PRIVATE_CONTENT_REFUSED'
  | 'SPATIAL_UNSUPPORTED' | 'LEGACY_LAYOUT_LOST' | 'LEGACY_PROPS_LOST'
  | 'LEGACY_RELATION_LOST' | 'OUTBOUND_FLOW_REFUSED' | 'THEME_NOT_MIGRATED';
export interface ImportLoss { readonly code: ImportLossCode; readonly sourceId: string; readonly message: string }
export interface ImportProvenance {
  readonly sourceSchema: LegacySchema;
  readonly sourceRef: string;
  /** Immutable fixture evidence; never part of UiDocument or a phone projection. */
  readonly original: unknown;
  readonly authorizedForRendering: false;
}
export type LegacyImportResult =
  | { readonly status: 'preview'; readonly readOnly: true; readonly document: UiDocument;
      readonly losses: readonly ImportLoss[]; readonly provenance: ImportProvenance }
  | { readonly status: 'unavailable'; readonly readOnly: true; readonly document: null;
      readonly reason: string; readonly losses: readonly ImportLoss[]; readonly provenance: null };
export interface LegacyImportOptions {
  /** Namespaced fixture refs supplied by caller; neither grants access nor authenticates owner. */
  readonly ownerRef: string;
  readonly workspaceRef: string;
  readonly sourceRef: string;
  /** Only the validated live surface adapter may opt into inert local selection controls. */
  readonly localSelectionControls?: boolean;
  /** The live validated source owns bounded presentation tokens; never convert them to executable CSS. */
  readonly projectedPresentation?: boolean;
  /** Already-projected references, not a grant or canonical KB binding. */
  readonly projectedCardRefs?: readonly string[];
}
const LOCAL_SELECTION_ACTION = Object.freeze({id:'ui.local.select',version:1});
const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const RESTRICTED = /<\s*\/?[a-z!]|javascript:|data:|vbscript:|https?:\/\/|www\.|(?:onerror|onclick|onload)\s*=|=>|\beval\s*\(/i;
function rec(v:unknown): v is Record<string,unknown> {return v!==null&&typeof v==='object'&&!Array.isArray(v);}
function allowedFields(v:Record<string,unknown>, allowed:readonly string[]):void {
  if(Object.keys(v).some(k=>!allowed.includes(k)))throw Error('Unknown source field');
}
function key(v:unknown): v is string {return typeof v==='string'&&ID.test(v)&&!['constructor','prototype','__proto__'].includes(v);}
function safeText(v:unknown): string|null {return typeof v==='string' && !!v.trim() && v.length<=L.text && !RESTRICTED.test(v) && !/[\u0000-\u001f\u007f]/.test(v) ? v : null;}
function refuse(reason:string,losses:ImportLoss[]=[]):LegacyImportResult{return{status:'unavailable',readOnly:true,document:null,reason,losses,provenance:null};}
function view2d():UiDocumentView[] {return [{id:'view.phone',version:1,kind:'2d',viewport:'phone'},{id:'view.desktop',version:1,kind:'2d',viewport:'desktop'}];}
function root():UiDocumentNode {return{id:'root',type:'stack',props:{direction:'vertical',gap:'md'},children:[],a11y:{role:'main',name:'Imported UI preview'}};}
function doc(options:LegacyImportOptions,sourceId:string,revision:unknown,nodes:UiDocumentNode[],views:UiDocumentView[]):UiDocument {
  return {schema:UI_DOCUMENT_SCHEMA,documentId:`doc:${sourceId}`,scope:{ownerRef:options.ownerRef,workspaceRef:options.workspaceRef},
    revision:typeof revision==='number'?revision:0,rootId:'root',nodes,bindings:[],views};
}
const cardKinds=new Set(['card','profile-card','project-card']);
function fromHarness(source:Record<string,unknown>, options:LegacyImportOptions,losses:ImportLoss[]):UiDocument {
  if(source.catalogVersion!==1||!key(source.surfaceId)||!Number.isSafeInteger(source.revision)||!rec(source.tree))throw Error('Unsupported Harness catalog/revision');
  allowedFields(source,['schema','surfaceId','revision','catalogVersion','theme','tree']);
  const nodes:UiDocumentNode[]=[];
  const walk=(v:unknown,depth:number):string=>{
    if(!rec(v)||!key(v.id)||typeof v.type!=='string'||!Array.isArray(v.children)||v.children.length>L.children||depth>L.depth)throw Error('Invalid Harness tree');
    allowedFields(v,options.projectedPresentation===true?['id','type','props','children','visibility','presentation','liveBinding']:['id','type','props','children','visibility']);
    if(v.presentation!==undefined&&!rec(v.presentation))throw Error('Invalid projected presentation');
    if(v.liveBinding!==undefined&&!['personal.open-tasks','studio.recent-outcomes'].includes(String(v.liveBinding)))throw Error('Invalid projected live binding');
    if(v.visibility==='pc-private')throw Error('Private content cannot be imported without broker authorization');
    if(v.visibility!==undefined&&v.visibility!=='phone')throw Error('Unknown audience');
    const p=rec(v.props)?v.props:{};
    if(v.props!==undefined&&!rec(v.props))throw Error('Invalid legacy props');
    const propsAllowed=v.type==='stack'?['direction','gap']:v.type==='grid'?['columns','gap']:
      v.type==='text'?['value','variant']:v.type==='button'?['label','intent','targetId']:
      ['card','profile-card','project-card'].includes(v.type)?['title','description','sourceRef','basis','freshness']:
      ['collection','timeline','chart'].includes(v.type)?['title','items','sourceRef']:[];
    allowedFields(p,propsAllowed);
    if(v.type==='stack' && ((p.direction!==undefined&&!['vertical','horizontal'].includes(p.direction as string))||(p.gap!==undefined&&!['sm','md','lg'].includes(p.gap as string))))throw Error('Unknown stack option');
    if(v.type==='grid' && (p.gap!==undefined&&!['sm','md','lg'].includes(p.gap as string)))throw Error('Unknown grid gap');
    const id=v.id;
    if(!['stack','grid','text','card','button','collection','profile-card','project-card','timeline','chart'].includes(v.type))throw Error('Unknown Harness component');
```

_First 80 of 204 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
