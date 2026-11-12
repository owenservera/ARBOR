// GUI01: closed declarative component vocabulary; provider output is data, never executable UI.
export const CATALOG_VERSION = 1;
export const SURFACE_SCHEMA = 'vivim.ui-surface/1';
export const PROPOSAL_SCHEMA = 'vivim.ui-proposal/1';
export const PREVIEW_SCHEMA = 'vivim.ui-preview/1';
export const TYPES = Object.freeze(['stack','grid','text','card','button','collection','profile-card','project-card','timeline','chart']);
export const MAX = Object.freeze({ bytes: 32768, nodes: 64, depth: 7, operations: 20, children: 24, string: 240, items: 16 });
export const DEFAULT_THEME = Object.freeze({
  background:'#111722', secondary:'#243146', accent:'#78b8f6', appearance:'dark', texture:'solid',
  mood:'focused', density:'comfortable', motion:'still', fontFamily:'system',
  fontSizePx:15, headingSizePx:28, radiusPx:14, spacingScale:1
});
export const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const UNSAFE_TEXT = /[\u0000-\u001f\u007f]|(?:https?:\/\/|www\.|javascript:|data:|<\/?[a-z]|onerror\s*=)/i;
const BAD_KEY = new Set(['__proto__','prototype','constructor']);
const OWN = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
export function invalid(reason) { const e = new TypeError('UI_REJECTED: '+reason); e.code='UI_REJECTED'; throw e; }
export function plain(v) { return v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null); }
export function keys(v, allowed, label) {
  if (!plain(v) || Object.keys(v).some(k=>BAD_KEY.has(k)||!allowed.includes(k))) invalid(label+' has unexpected fields');
}
export function str(v,max=MAX.string) { if(typeof v!=='string'||!v.trim()||v.length>max||UNSAFE_TEXT.test(v)) invalid('unsafe or oversized text'); return v.trim(); }
export function id(v) { if(typeof v!=='string'||!ID.test(v)||BAD_KEY.has(v)) invalid('invalid identifier'); return v; }
export function en(v,list) { if(!list.includes(v)) invalid('unsupported enum'); return v; }
export function int(v,a,b) { if(!Number.isSafeInteger(v)||v<a||v>b) invalid('integer outside bounds'); return v; }
export function num(v,a,b) { if(typeof v!=='number'||!Number.isFinite(v)||v<a||v>b) invalid('number outside bounds'); return v; }
export function validateTheme(t) {
  keys(t,['background','secondary','accent','appearance','texture','mood','density','motion','fontFamily','fontSizePx','headingSizePx','radiusPx','spacingScale'],'theme');
  const out={};
  for(const k of ['background','secondary','accent']) {if(!HEX.test(t[k]??'')) invalid('invalid theme color');out[k]=t[k].toLowerCase();}
  const groups={appearance:['dark','light'],texture:['aurora','gradient','linen','geometry','solid'],mood:['serene','focused','warm','vibrant','cinematic','playful','minimal','understated'],density:['compact','comfortable','spacious'],motion:['still','slow'],fontFamily:['system','humanist','geometric','editorial','mono']};
  for(const [k,choices] of Object.entries(groups))out[k]=en(t[k],choices);
  out.fontSizePx=int(t.fontSizePx,13,19);out.headingSizePx=int(t.headingSizePx,20,38);out.radiusPx=int(t.radiusPx,6,24);
  out.spacingScale=num(t.spacingScale,.85,1.2);
  return out;
}
function allowedRef(v, refs) {id(v);if(!refs.has(v))invalid('unapproved data/evidence reference');return v;}
const variants=['body','heading','muted'];
export function validateProps(type,props,{refs=new Set()}={}) {
  const out={};const add=(k,v)=>{if(v!==undefined)out[k]=v;};
  if(type==='stack'||type==='grid') {
    keys(props,type==='stack'?['direction','gap']:['columns','gap'],'layout props');
    if(type==='stack'){add('direction',en(props.direction??'vertical',['vertical','horizontal']));}else add('columns',int(props.columns??1,1,4));
    add('gap',en(props.gap??'md',['sm','md','lg']));
  } else if(type==='text') {
    keys(props,['value','variant'],'text props');add('value',str(props.value));add('variant',en(props.variant??'body',variants));
  } else if(type==='button') {
    keys(props,['label','intent','targetId'],'button props');add('label',str(props.label,80));
    add('intent',en(props.intent,['select-component','preview-only']));
    if(props.targetId!==undefined)add('targetId',id(props.targetId));
  } else if(['card','profile-card','project-card'].includes(type)) {
    keys(props,['title','description','sourceRef','basis','freshness'],'card props');add('title',str(props.title,80));
    if(props.description!==undefined)add('description',str(props.description,MAX.string));
    if(type!=='card' && props.sourceRef===undefined)invalid('sourced personal card required');
    if(props.sourceRef!==undefined)add('sourceRef',allowedRef(props.sourceRef,refs));
    if(props.basis!==undefined)add('basis',en(props.basis,['explicitly_stated','provider_memory_report','tentative_inference','owner-reported','provider-reported','tentative']));
    if(props.freshness!==undefined)add('freshness',en(props.freshness,['current','historical','unknown']));
  } else if(['collection','timeline','chart'].includes(type)) {
    keys(props,['title','items','sourceRef'],'structured props');add('title',str(props.title,80));
    if(props.sourceRef!==undefined)add('sourceRef',allowedRef(props.sourceRef,refs));
    if(!Array.isArray(props.items)||props.items.length>MAX.items)invalid('invalid structured items');
    out.items=props.items.map(x=>{
      if(type==='chart'){keys(x,['label','value'],'chart item');return {label:str(x.label,80),value:num(x.value,-1e9,1e9)};}
      keys(x,['label','detail'],'item');return {label:str(x.label,80),...(x.detail===undefined?{}:{detail:str(x.detail,180)})};
    });
  } else invalid('unknown component');
  return out;
}
export function validateTree(tree,{refs=new Set()}={}) {
  let count=0;const seen=new Set();
  const walk=(n,depth,parentId)=>{
    if(depth>MAX.depth||++count>MAX.nodes)invalid('component tree too large');
    keys(n,['id','type','props','children','visibility'],'component');
    const name=id(n.id);if(seen.has(name))invalid('duplicate component id');seen.add(name);
    en(n.type,TYPES);
    if(n.visibility!==undefined)en(n.visibility,['phone','pc-private']);
    const p=validateProps(n.type,n.props??{}, {refs});
    const children=n.children??[];
    if(!Array.isArray(children)||children.length>MAX.children)invalid('invalid child list');
    if(children.length && !['stack','grid','card'].includes(n.type))invalid('component does not accept children');
    // All model-editable IDs and text live *inside* the root. Protected nav is outside it.
    return {id:name,type:n.type,props:p,visibility:n.visibility??'phone',children:children.map(c=>walk(c,depth+1,name))};
  };
  const out=walk(tree,0,null);if(out.id!=='root'||out.type!=='stack')invalid('root must be stable stack');return out;
}
export function validateSurface(surface,{refs=new Set()}={}) {
  keys(surface,['schema','surfaceId','revision','catalogVersion','theme','tree'],'surface');
  if(surface.schema!==SURFACE_SCHEMA||surface.catalogVersion!==CATALOG_VERSION)invalid('surface schema/catalog mismatch');
  const result={schema:SURFACE_SCHEMA,surfaceId:id(surface.surfaceId),revision:int(surface.revision,0,1e9),catalogVersion:CATALOG_VERSION,
    theme:validateTheme(surface.theme),tree:validateTree(surface.tree,{refs})};
  if(new TextEncoder().encode(JSON.stringify(result)).byteLength>MAX.bytes)invalid('surface too large');return result;
}
export function createSurface({surfaceId='my-space',theme=DEFAULT_THEME}={}) {
  return validateSurface({schema:SURFACE_SCHEMA,surfaceId,revision:0,catalogVersion:CATALOG_VERSION,theme,
    tree:{id:'root',type:'stack',props:{direction:'vertical',gap:'md'},children:[]}});
}
export function projectSurface(surface,{audience='phone',refs=new Set()}={}) {
  const s=validateSurface(surface,{refs});if(!['phone','pc'].includes(audience))invalid('unknown audience');
  if(audience==='pc')return s;
  const prune=n=>({...n,children:n.children.filter(c=>c.visibility!=='pc-private').map(prune)});
  return {...s,tree:prune(s.tree)};
}
