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
    allowedFields(v,['id','type','props','children','visibility']);
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
    if(nodes.some(n=>n.id===id)||nodes.length>=L.nodes)throw Error('Duplicate ID or too many components');
    const children=v.children.map(c=>walk(c,depth+1));
    let node:UiDocumentNode;
    const label=safeText(p.label)??'Unavailable action';
    if(v.type==='button'&&(!safeText(p.label)||!['preview-only','select-component'].includes(p.intent as string)))throw Error('Unknown/unsafe legacy action');
    if(v.type==='button') {
      // A component with an intent in the old grammar is not a Host-authorized command.
      if(options.localSelectionControls===true){
        if(children.length|| (p.targetId!==undefined&&!key(p.targetId)))throw Error('Invalid local selection control');
        node={id,type:'button',props:{label},children:[],a11y:{role:'button',name:label,focusOrder:nodes.length},actionRefs:[LOCAL_SELECTION_ACTION]};
      }else{
        losses.push({code:'ACTION_UNBOUND',sourceId:id,message:'Legacy intent remains unavailable; no executable action imported'});
        node={id,type:'text',props:{value:`${label} (unavailable action)`},children:[],a11y:{role:'text',name:label}};
      }
    } else if(v.type==='stack') {
      node={id,type:'stack',props:{direction:p.direction==='horizontal'?'horizontal':'vertical',gap:['sm','md','lg'].includes(p.gap as string)?p.gap as 'sm'|'md'|'lg':'md'},children,a11y:{role:id==='root'?'main':'group',name:'Section'}};
    } else if(v.type==='grid') {
      node={id,type:'grid',props:{columns:Number.isInteger(p.columns)?p.columns as number:1,gap:['sm','md','lg'].includes(p.gap as string)?p.gap as 'sm'|'md'|'lg':'md'},children,a11y:{role:'group',name:'Grid'}};
    } else if(v.type==='text') {
      const value=safeText(p.value);if(!value)throw Error('Unsafe text');
      node={id,type:'text',props:{value,variant:['body','heading','muted'].includes(p.variant as string)?p.variant as 'body'|'heading'|'muted':'body'},children:[],a11y:{role:p.variant==='heading'?'heading':'text',name:value}};
    } else if(cardKinds.has(v.type)) {
      const title=safeText(p.title);if(!title)throw Error('Unsafe card label');
      const description=p.description===undefined?undefined:safeText(p.description);
      if(p.description!==undefined&&!description)throw Error('Unsafe card description');
      const projected=typeof p.sourceRef==='string'&&options.projectedCardRefs?.includes(p.sourceRef)===true;
      if(p.sourceRef!==undefined&&!projected)losses.push({code:'SOURCE_REF_UNBOUND',sourceId:id,message:'Legacy sourceRef is not a canonical KB stableId'});
      const renderedType=projected&&(v.type==='profile-card'||v.type==='project-card')?v.type:'card';
      node={id,type:renderedType,props:{title,...(description?{description}:{})},children:v.type==='card'?children:[],a11y:{role:'region',name:title}};
    } else {
      const title=safeText(p.title);if(!title||!Array.isArray(p.items))throw Error('Invalid structured content');
      if(p.sourceRef!==undefined)losses.push({code:'SOURCE_REF_UNBOUND',sourceId:id,message:'Legacy sourceRef not adopted'});
      const items = p.items.map((item:unknown)=>{
        if(!rec(item)||!safeText(item.label))throw Error('Unsafe legacy item');
        if(v.type==='chart') {if(typeof item.value!=='number'||!Number.isFinite(item.value))throw Error('Invalid chart value');return {label:item.label as string,value:item.value};}
        if(item.detail!==undefined&&!safeText(item.detail))throw Error('Unsafe legacy detail');
        return {label:item.label as string,...(item.detail!==undefined?{detail:item.detail as string}:{})};
      });
      if(v.type==='chart')node={id,type:'chart',props:{title,items:items as {label:string;value:number}[]},children:[],a11y:{role:'region',name:title}};
      else node={id,type:v.type as 'collection'|'timeline',props:{title,items:items as {label:string;detail?:string}[]},children:[],a11y:{role:'list',name:title}};
    }
    nodes.push(node);return id;
  };
  const rootId=walk(source.tree,1);
  if(rootId!=='root')throw Error('Harness root identity mismatch');
  losses.push({code:'THEME_NOT_MIGRATED',sourceId:source.surfaceId,message:'Theme kept only in immutable evidence; no implicit style authority'});
  return doc(options,source.surfaceId,source.revision,nodes,view2d());
}
function fromHq(source:Record<string,unknown>,options:LegacyImportOptions,losses:ImportLoss[]):UiDocument {
  if(!key(source.surfaceId)||!Number.isSafeInteger(source.revision)||!rec(source.objects))throw Error('Invalid HQ surface');
  const objects=Object.values(source.objects);
  if(objects.length>=L.nodes)throw Error('Excess HQ objects');
  const nodes:UiDocumentNode[]=[root()];
  const children=new Map<string,string[]>();children.set('root',[]);
  for(const v of objects) {
    if(!rec(v)||!key(v.id)||!safeText(v.title)||typeof v.kind!=='string')throw Error('Unsafe HQ object');
    if(v.hidden===true||v.locked===true)throw Error('Private/locked source requires owner broker');
    if(!['note','document','card','frame','group','task','chart'].includes(v.kind))throw Error('Unsupported HQ component');
    if(v.id==='root'||children.has(v.id))throw Error('ID collision');
    children.set(v.id,[]);
  }
  for(const v of objects) {
    const o=v as Record<string,unknown>, id=o.id as string, title=o.title as string;
    const parent=o.parentId===null||o.parentId===undefined?'root':o.parentId;
    if(typeof parent!=='string'||!children.has(parent))throw Error('Unknown HQ parent');
    children.get(parent)!.push(id);
    if(o.rect!==undefined||o.z!==undefined)losses.push({code:'LEGACY_LAYOUT_LOST',sourceId:id,message:'Coordinates and z-index are not semantic 2D order/focus'});
    if(o.props!==undefined&&rec(o.props)&&Object.keys(o.props).length)losses.push({code:'LEGACY_PROPS_LOST',sourceId:id,message:'Untrusted free-form props not imported'});
    if(o.sourceRef!==undefined)losses.push({code:'SOURCE_REF_UNBOUND',sourceId:id,message:'Source reference not a verified KB binding'});
    nodes.push(['group','frame'].includes(o.kind as string)
      ? {id,type:'stack',props:{direction:'vertical'},children:[],a11y:{role:'group',name:title}}
      : o.kind==='note'||o.kind==='document'
        ? {id,type:'text',props:{value:title},children:[],a11y:{role:'text',name:title}}
        : {id,type:'card',props:{title},children:[],a11y:{role:'region',name:title}});
  }
  for(let i=0;i<nodes.length;i++){
    const n=nodes[i]!;const cs=children.get(n.id)??[];
    if(cs.length && !['stack','grid','card'].includes(n.type))throw Error('HQ leaf as container');
    nodes[i]={...n,children:cs} as UiDocumentNode;
  }
  if(rec(source.edges)&&Object.keys(source.edges).length) losses.push({code:'LEGACY_RELATION_LOST',sourceId:source.surfaceId,message:'HQ edges not treated as KB relationships'});
  return doc(options,source.surfaceId,source.revision,nodes,view2d());
}
function fromSpatial(source:Record<string,unknown>,options:LegacyImportOptions,losses:ImportLoss[]):UiDocument {
  if(source.schemaVersion!==1||!rec(source.world)||!key((source.world as Record<string,unknown>).id)||!Array.isArray(source.objects)||!Array.isArray(source.dataFlows))throw Error('Invalid spatial document');
  const world=source.world as Record<string,unknown>;
  const title=safeText(world.title)??'Spatial workspace';
  if(source.dataFlows.some(v=>rec(v)&&v.direction==='outbound'))losses.push({code:'OUTBOUND_FLOW_REFUSED',sourceId:world.id as string,message:'Outbound flows never become UI actions or KB writes'});
  losses.push({code:'SPATIAL_UNSUPPORTED',sourceId:world.id as string,message:'3D shape, transform and z-order cannot be represented as accessible 2D hierarchy'});
  if(Array.isArray(source.relationships)&&source.relationships.length)losses.push({code:'LEGACY_RELATION_LOST',sourceId:world.id as string,message:'Spatial edges stay in source evidence, not semantic relations'});
  const nodes:UiDocumentNode[]=[
    {...root(),children:['spatial.notice']},
    {id:'spatial.notice',type:'text',props:{value:`${title}: spatial scene unavailable in 2D preview`},children:[],a11y:{role:'status',name:'Spatial view unavailable',description:'The original spatial model is retained as separate source evidence.'}},
  ];
  return doc(options,world.id as string,0,nodes,[...view2d(),{id:'view.spatial',version:1,kind:'spatial',sourceRef:options.sourceRef,fallbackViewId:'view.desktop'}]);
}
/**
 * No authentication, DOM, persistence, network, provider browser, KB or effects.
 * The result is ALWAYS read-only. Unknown versions always refuse without silent migration.
 */
export function importLegacyUiDocument(raw:unknown, options:LegacyImportOptions):LegacyImportResult {
  const losses:ImportLoss[]=[];
  if(!key(options.ownerRef)||!key(options.workspaceRef)||!key(options.sourceRef))return refuse('Invalid fixture provenance/scope');
  let original:unknown;
  try {original=cloneInertJson(raw);}catch {return refuse('Malformed, cyclic, accessor-backed or oversized legacy input');}
  if(!rec(original))return refuse('Source must be a record');
  if(original.schema!==undefined&&original.schemaVersion===1) return refuse('Ambiguous source version; read-only unavailable');
  const schema= original.schema==='vivim.ui-surface/1' || original.schema==='vivim.ui-proposal/1' || original.schema==='vivim.surface/1'
    ? original.schema : original.schemaVersion===1?'tierflow.ui-world/1':null;
  if(!schema)return refuse('Unknown source version; read-only unavailable');
  if(schema==='vivim.ui-proposal/1')return refuse('Proposal is an edit candidate, not a committed surface; explicit source-backed preview required');
  try {
    const candidate=schema==='vivim.ui-surface/1'?fromHarness(original,options,losses)
      : schema==='vivim.surface/1'?fromHq(original,options,losses):fromSpatial(original,options,losses);
    const verdict=validateUiDocument(candidate,{knownActions:options.localSelectionControls===true?[LOCAL_SELECTION_ACTION]:[]});
    if(!verdict.ok)return refuse(`Conversion refused: ${verdict.unavailable.reason}`,losses);
    return {status:'preview',readOnly:true,document:verdict.document,losses,provenance:{sourceSchema:schema,sourceRef:options.sourceRef,original,authorizedForRendering:false}};
  } catch(error) {
    if(String(error).includes('Private/locked')||String(error).includes('Private content'))
      losses.push({code:'PRIVATE_CONTENT_REFUSED',sourceId:options.sourceRef,message:'Source cannot be emitted to unknown device scope'});
    return refuse('Legacy data cannot be safely converted; no partial document',losses);
  }
}
