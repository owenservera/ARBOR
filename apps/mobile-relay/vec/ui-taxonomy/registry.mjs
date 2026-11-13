// VEC UI taxonomy registry/1: descriptive identity and contract lookup only.
// Never dynamically loads or registers code; a catalogued slider is not a renderable slider.
// One canonical catalog; consumer schemas and Host authority remain closed and independent.
import {
  UI_TAXONOMY_SCHEMA, UI_DOMAINS, UI_FAMILIES, UI_PROPERTIES,
  UI_TRAITS, UI_OVERRIDES, UI_SOURCE_BINDINGS
} from './catalog.mjs';

export const UI_IDENTITY_SCHEMA = 'vivim.ui-component-identity/1';
export const UI_EXTENSION_SCHEMA = 'vivim.ui-extension-proposal/1';
export const UI_BINDING_STATUSES = Object.freeze([
  'source-closed', 'fixture-inspector-only', 'world-shape-only'
]);
const DOMAIN_NAMES = Object.freeze(Object.keys(UI_DOMAINS));
const COMPONENT_ID = /^vivim\.ui\.([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)@([1-9]\d*)$/;
const KIND = /^[a-z][a-z0-9-]{0,79}$/;
const EVENT = /^[a-z][a-z0-9-]{0,63}$/;
const PLAIN = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const own = (v,k) => Object.hasOwn(v,k);
const freezeDeep = v => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    for (const key of Object.keys(v)) freezeDeep(v[key]);
    Object.freeze(v);
  }
  return v;
};
const A11Y_KEYBOARD = Object.freeze({
  group:'none', region:'none', navigation:'tab', text:'none', presentation:'none',
  button:'enter-space', textbox:'typing', slider:'arrows', dialog:'focus-trap',
  status:'none', progressbar:'none', list:'navigable-if-interactive',
  table:'grid-keys-if-interactive', img:'none', main:'none'
});
const DEFAULT_STATE = Object.freeze(['idle', 'disabled', 'unknown']);
const SHAPE_BY_DOMAIN = Object.freeze({
  foundation:'none', navigation:'route-proposal', input:'scalar', feedback:'status',
  data:'structured', media:'media-ref', application:'structured',
  spatial:'spatial', accessibility:'accessibility-state'
});
const toLabel = s => s.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
function makeDescriptor(family,kind) {
  const key = family.domain + '.' + family.family + '.' + kind;
  const special = UI_OVERRIDES[key] ?? {};
  const role = special.role ?? family.role;
  const traits = [...new Set([...family.traits, ...(special.traits ?? [])])].sort();
  const propKeys = special.props ?? family.properties;
  for (const name of propKeys)
    if (!own(UI_PROPERTIES,name)) throw new Error('UI_TAXONOMY_UNDECLARED_PROP:' + key + ':' + name);
  const props = Object.fromEntries(propKeys.map(p=>[p,UI_PROPERTIES[p]]));
  const events = [...new Set(special.events ?? family.events)].sort();
  const states = special.states ?? DEFAULT_STATE;
  const effects = traits.includes('intent-only') ? 'host-intent-proposal' : 'none';
  const bindings = UI_SOURCE_BINDINGS.filter(b=>b[2]===key).map(b=>Object.freeze({
    schema:b[0], nativeType:b[1], state:b[3], ...(b[4]?{variant:b[4]}:{})
  }));
  return freezeDeep({
    schema:UI_IDENTITY_SCHEMA, id:'vivim.ui.' + key + '@1', version:1,
    domain:family.domain, family:family.family, kind, label:toLabel(kind),
    classification:{role, traits, composition:traits.includes('container')?'container':'leaf'},
    contract:{
      properties:props, events, states:[...states],
      data:{shape:special.dataShape ?? SHAPE_BY_DOMAIN[family.domain],
        referenceOnly:traits.includes('bindable') || traits.includes('requires-host-grant')},
      effects, accessibility:{
        role, keyboard:A11Y_KEYBOARD[role] ?? 'define-before-install',
        nameRequired:traits.some(t=>['focusable','interactive'].includes(t)),
        alternativeInputRequired:traits.includes('gesture-driven')
      }
    },
    implementations:bindings,
    availability:bindings.length?'source-mapped-not-accepted':'taxonomy-only',
    runtimeAuthorized:false
  });
}
const catalog = [];
const ids = new Map(), byKind = new Map();
const familyIds = new Set();
for (const family of UI_FAMILIES) {
  if (!own(UI_DOMAINS,family.domain)) throw new Error('UI_TAXONOMY_UNKNOWN_DOMAIN');
  const fid=family.domain+'.'+family.family;
  if(familyIds.has(fid)) throw new Error('UI_TAXONOMY_DUPLICATE_FAMILY');
  familyIds.add(fid);
  for (const kind of family.kinds) {
    if (!KIND.test(kind)) throw new Error('UI_TAXONOMY_INVALID_KIND');
    const descriptor=makeDescriptor(family,kind);
    if(ids.has(descriptor.id)) throw new Error('UI_TAXONOMY_DUPLICATE_ID');
    ids.set(descriptor.id,descriptor);
    const possible=byKind.get(kind)??[];
    possible.push(descriptor);
    byKind.set(kind,possible);
    catalog.push(descriptor);
  }
}
for (const binding of UI_SOURCE_BINDINGS) {
  const id='vivim.ui.'+binding[2]+'@1';
  if(!ids.has(id)||!UI_BINDING_STATUSES.includes(binding[3]))throw new Error('UI_TAXONOMY_INVALID_SOURCE_MAPPING');
}
export const UI_TAXONOMY_COUNTS = Object.freeze({
  domains:DOMAIN_NAMES.length, families:UI_FAMILIES.length,
  components:catalog.length, sourceBindings:UI_SOURCE_BINDINGS.length
});
const all = freezeDeep(catalog);
export function listUiDomains(){return DOMAIN_NAMES.map(domain=>Object.freeze({id:domain,title:UI_DOMAINS[domain]}));}
export function listUiFamilies({domain}={}) {
  if (domain !== undefined && !DOMAIN_NAMES.includes(domain)) return [];
  return UI_FAMILIES.filter(f=>domain===undefined||f.domain===domain).map(f=>
    Object.freeze({id:f.domain+'.'+f.family,domain:f.domain,family:f.family,role:f.role,
      count:f.kinds.length,traits:Object.freeze([...f.traits])}));
}
export function getUiComponent(id) {
  return typeof id==='string' && COMPONENT_ID.test(id) ? ids.get(id)??null : null;
}
export function findUiComponent(kind,{domain,family}={}) {
  if(typeof kind!=='string' || !KIND.test(kind)) return {outcome:'not_found',candidates:[]};
  const hits=(byKind.get(kind)??[]).filter(d=>
    (domain===undefined||domain===d.domain)&&(family===undefined||family===d.family));
  if(hits.length===0)return {outcome:'not_found',candidates:[]};
  if(hits.length>1)return {outcome:'ambiguous',candidates:hits.map(d=>d.id)};
  return {outcome:'found',component:hits[0]};
}
export function listUiComponents({domain,family,trait,sourceSchema,search,limit=500}={}) {
  if(domain!==undefined&&!DOMAIN_NAMES.includes(domain)) return [];
  if(family!==undefined&&(typeof family!=='string'||!KIND.test(family)))return [];
  if(trait!==undefined&&(typeof trait!=='string'||!EVENT.test(trait)))return [];
  if(sourceSchema!==undefined&&(typeof sourceSchema!=='string'||sourceSchema.length>100))return [];
  if(search!==undefined&&(typeof search!=='string'||search.length>120))return [];
  if(!Number.isInteger(limit)||limit<1||limit>500)return [];
  const q=(search??'').toLowerCase().trim();
  return all.filter(x=>
    (domain===undefined||x.domain===domain) &&
    (family===undefined||x.family===family) &&
    (trait===undefined||x.classification.traits.includes(trait)) &&
    (sourceSchema===undefined||x.implementations.some(i=>i.schema===sourceSchema)) &&
    (!q||(x.kind.includes(q)||x.label.toLowerCase().includes(q)||x.id.includes(q)))
  ).slice(0,limit);
}
/** Source binding discovery does not constitute runnable UI, or grants. */
export function resolveUiSourceIdentity({schema,nativeType,props={}}={}) {
  if(typeof schema!=='string'||typeof nativeType!=='string'||!PLAIN(props))
    return {outcome:'refused',code:'INVALID_SOURCE_IDENTITY'};
  const found=UI_SOURCE_BINDINGS.filter(b=>b[0]===schema&&b[1]===nativeType);
  const preferred=found.filter(b=>b[4]!==undefined&&b[4]===props.variant);
  const chosen=preferred.length?preferred:found.filter(b=>b[4]===undefined);
  if(chosen.length===0)return {outcome:'not_mapped',code:'SOURCE_COMPONENT_UNMAPPED'};
  if(chosen.length>1)return {outcome:'ambiguous',code:'SOURCE_BINDING_AMBIGUOUS'};
  const binding=chosen[0],component=ids.get('vivim.ui.'+binding[2]+'@1');
  return {outcome:'mapped',component,source:{schema,nativeType,
    status:binding[3],...(binding[4]?{variant:binding[4]}:{})},
    runtimeAuthorized:false};
}
function validData(v,seen=new Set(),depth=0) {
  if(v===null||typeof v==='string'||typeof v==='boolean')return true;
  if(typeof v==='number')return Number.isFinite(v);
  if(typeof v!=='object'||depth>6||seen.has(v)||(!Array.isArray(v)&&!PLAIN(v)))return false;
  seen.add(v);
  const keys=Reflect.ownKeys(v);
  if(keys.some(k=>typeof k==='symbol'))return false;
  if(Array.isArray(v)&&Array.from({length:v.length},(_,i)=>i).some(i=>!own(v,i)))return false;
  for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);
    if(!d||!own(d,'value')||!validData(d.value,seen,depth+1))return false;}
  seen.delete(v);return true;
}
/** Extension definitions remain inert *proposals*. No automatic renderer install. */
export function inspectUiExtensionProposal(input){
  const fail=code=>({schema:UI_EXTENSION_SCHEMA,outcome:'refused',code,installed:false,authorized:false});
  if(!PLAIN(input)||!validData(input))return fail('NOT_PLAIN_DATA');
  const allowed=['schema','domain','family','kind','label','properties','traits','events','a11yRole'];
  if(Object.keys(input).some(k=>!allowed.includes(k))||input.schema!==UI_EXTENSION_SCHEMA)
    return fail('UNKNOWN_FIELDS_OR_SCHEMA');
  const family=UI_FAMILIES.find(f=>f.domain===input.domain&&f.family===input.family);
  if(!family||!KIND.test(input.kind??'')||typeof input.label!=='string'||
    input.label.length<1||input.label.length>80||/[<>\u0000-\u001f]/.test(input.label))
    return fail('UNKNOWN_FAMILY_OR_UNSAFE_KIND');
  const id='vivim.ui.'+input.domain+'.'+input.family+'.'+input.kind+'@1';
  if(ids.has(id))return fail('IDENTITY_ALREADY_REGISTERED');
  if(!Array.isArray(input.properties)||!Array.isArray(input.traits)||!Array.isArray(input.events)||
    input.properties.length>40||input.traits.length>20||input.events.length>20)
    return fail('INVALID_CONTRACT');
  if(new Set(input.properties).size!==input.properties.length ||
    input.properties.some(p=>typeof p!=='string'||!own(UI_PROPERTIES,p)))return fail('UNKNOWN_PROPERTIES');
  if(new Set(input.traits).size!==input.traits.length ||
    input.traits.some(t=>typeof t!=='string'||!own(UI_TRAITS,t)))return fail('UNKNOWN_TRAITS');
  if(new Set(input.events).size!==input.events.length ||
    input.events.some(e=>typeof e!=='string'||!EVENT.test(e)))return fail('UNSAFE_EVENT');
  if(!own(A11Y_KEYBOARD,input.a11yRole))return fail('UNKNOWN_ACCESSIBILITY_ROLE');
  return {schema:UI_EXTENSION_SCHEMA,outcome:'candidate',installed:false,authorized:false,
    descriptor:freezeDeep({id,domain:input.domain,family:input.family,kind:input.kind,
      label:input.label,properties:[...input.properties],traits:[...input.traits],
      events:[...input.events],a11yRole:input.a11yRole,availability:'proposal-only'}),
    requiredReview:['semantic-registry-owner','renderer-adapter','accessibility','Host-effect-policy']};
}
/** Safe export: explicit source IDs and statuses, not an install manifest or user data. */
export function exportUiTaxonomy() {
  return {
    schema:UI_TAXONOMY_SCHEMA,
    counts:UI_TAXONOMY_COUNTS,
    domains:JSON.parse(JSON.stringify(UI_DOMAINS)),
    families:JSON.parse(JSON.stringify(UI_FAMILIES)),
    properties:JSON.parse(JSON.stringify(UI_PROPERTIES)),
    traits:JSON.parse(JSON.stringify(UI_TRAITS)),
    overrides:JSON.parse(JSON.stringify(UI_OVERRIDES)),
    sourceBindings:JSON.parse(JSON.stringify(UI_SOURCE_BINDINGS))
  };
}
