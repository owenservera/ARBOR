// GUI02 semantic projection: derivative, read-only representation of Host-compiled bootstrap.
// Knowledge identity, UI instance and command intent are distinct. No new World writer.
import {digestJson,utf8Length} from './portable-digest.mjs';
import {id,str,invalid} from './catalog.mjs';
export const SEMANTIC_SCHEMA='vivim.semantic-projection/1';
export const LAYOUT_INTENTS=Object.freeze(['cluster','timeline','mindmap','kanban','grid','free']);
export const SOURCE_PASSES=Object.freeze(['F02','F01','D03','D04','D05','D06','D07']);
const DEEP_KIND_LAYOUT=Object.freeze({card:'grid',collection:'grid',timeline:'timeline',mode:'cluster'});
const VIEW_KIND=Object.freeze({card:'card',collection:'collection',timeline:'timeline',mode:'mode'});
function uniq(a){return [...new Set(a)];}
function boundedRef(v){return id(v);}
function node(ref,{label,pass,kind,privacy,basis='unknown',freshness='unknown',confidence=null}={}){
  return {id:'k.'+boundedRef(ref),objectRef:ref,kind,pass,label:str(label,120),privacy,basis,freshness,confidence};
}
function requireCompiled(pass,compiled,worldId,requestId){
  if(!SOURCE_PASSES.includes(pass))invalid('unknown semantic pass');
  id(worldId);id(requestId);
  if(compiled?.worldId!==worldId||compiled?.requestId!==requestId)invalid('semantic provenance mismatch');
  const schema=pass==='F02'?'vivim.render-plan/1':pass==='F01'?'vivim.bootstrap-profile/1':'vivim.bootstrap-output/1';
  if(compiled?.schema!==schema||((pass==='F02'?compiled.pass:compiled.passId)!==pass))invalid('semantic source schema mismatch');
}
export function projectBootstrapSemantics({pass,compiled,worldId,requestId,surfaceId='my-space'}={}) {
  requireCompiled(pass,compiled,worldId,requestId);id(surfaceId);
  const objects=[],views=[],edges=[],unknowns=[];
  const privatePass=pass==='D06'||pass==='D07';
  const seen=new Set();
  const addObject=(ref,attrs)=>{boundedRef(ref);if(!seen.has(ref)){objects.push(node(ref,attrs));seen.add(ref);}};
  const addView=(v)=>{id(v.componentId);if(v.objectRefs.some(ref=>!seen.has(ref)))invalid('view points at missing knowledge');views.push(v);};
  if(pass==='F02'){
    // This is a design token proposal, not a person or knowledge claim.
    views.push({componentId:'root',viewKind:'theme',layoutIntent:'grid',objectRefs:[],privacy:'phone',suggested:true});
    for(const u of compiled.assertions?.unknowns??[]) unknowns.push(str(u,120));
  }else if(pass==='F01'){
    const claims=new Map((compiled.claims??[]).filter(c=>c.section==='focus').map(c=>[c.label?.toLowerCase(),c]));
    for(const c of claims.values()){
      if(!c?.id||!c.label||!c.statement||c.basis==='tentative_inference')continue;
      addObject(c.id,{label:c.label,pass,kind:c.kind??'focus',privacy:'phone',basis:c.basis,freshness:c.freshness});
    }
    for(const card of compiled.cards??[]){
      if(!card.focus)continue;
      const claim=claims.get(card.focus.toLowerCase());if(!claim||!seen.has(claim.id))continue;
      addView({componentId:'f01.'+id(card.id),viewKind:claim.kind==='project'?'project-card':'profile-card',layoutIntent:'grid',objectRefs:[claim.id],privacy:'phone',suggested:true});
      edges.push({from:'f01.'+card.id,to:'k.'+claim.id,relation:'presents',basis:'exact-focus-reference'});
    }
    for(const u of compiled.unknowns??[])unknowns.push(str(u,120));
  }else{
    const privacy=privatePass?'pc-private':'phone';
    for(const a of compiled.assertions??[]){
      addObject(id(a.id),{label:str(a.label,80),pass,kind:a.section,privacy,
        basis:a.basis,freshness:a.freshness,confidence:a.confidence});
    }
    // Observations are evidence objects. No unsupported endpoints are fabricated into graph edges.
    for(const o of compiled.observations??[]){
      addObject(id(o.id),{label:str(o.category,64),pass,kind:'observation',
        privacy:privatePass||o.sensitive===true?'pc-private':'phone',confidence:o.confidence});
    }
    for(const v of compiled.viewProposals??[]){
      id(v.id);if(!Object.hasOwn(DEEP_KIND_LAYOUT,v.kind))invalid('unknown deep view kind');
      // A proposed view is an intention, not a confirmed object or inferred relation to others.
      views.push({componentId:pass.toLowerCase()+'.'+v.id,viewKind:VIEW_KIND[v.kind],layoutIntent:DEEP_KIND_LAYOUT[v.kind],
        objectRefs:[],sourceRef:v.id,privacy,suggested:true});
    }
    for(const u of compiled.unknowns??[])unknowns.push(str(u,140));
  }
  if(objects.length>64||views.length>24||edges.length>32||unknowns.length>16)invalid('semantic bounds exceeded');
  const projection={schema:SEMANTIC_SCHEMA,worldId,surfaceId,pass,requestId,objects,views,edges,unknowns:uniq(unknowns),
    authority:'derived-from-compiled-bootstrap',effects:'none',persisted:false};
  if(utf8Length(JSON.stringify(projection))>32768)invalid('semantic projection oversized');
  return projection;
}
export function projectSemanticsForAudience(projection,{audience='phone'}={}){
  if(!projection||projection.schema!==SEMANTIC_SCHEMA)invalid('invalid semantic projection');
  if(!['pc','phone'].includes(audience))invalid('unknown audience');
  // Rebuild each projection layer from known semantic fields. A source object
  // may carry private/internal metadata that must not ride along via a shallow
  // spread into the phone-facing response. This grants no UI/effect authority.
  const pick=(row,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]]));
  const objects=(Array.isArray(projection.objects)?projection.objects:[])
    .filter(o=>o&&typeof o==='object'&&(audience==='pc'||o.privacy==='phone'))
    .map(o=>pick(o,['id','objectRef','kind','pass','label','privacy','basis','freshness','confidence']));
  const visible=new Set(objects.map(o=>o.id));
  const views=(Array.isArray(projection.views)?projection.views:[])
    .filter(v=>v&&typeof v==='object'&&(audience==='pc'||v.privacy==='phone')&&
      Array.isArray(v.objectRefs)&&v.objectRefs.every(r=>typeof r==='string'&&visible.has('k.'+r)))
    .map(v=>({...pick(v,['componentId','canonicalId','viewKind','layoutIntent','privacy','suggested','sourceRef']),
      objectRefs:[...v.objectRefs]}));
  const viewIds=new Set(views.map(v=>v.componentId));
  const edges=(Array.isArray(projection.edges)?projection.edges:[])
    .filter(e=>e&&typeof e==='object'&&viewIds.has(e.from)&&visible.has(e.to))
    .map(e=>pick(e,['from','to','relation','basis']));
  return {...pick(projection,['schema','worldId','surfaceId','pass','requestId','revision','authority']),
    objects,views,edges,
    unknowns:audience==='pc'&&Array.isArray(projection.unknowns)
      ?projection.unknowns.filter(v=>typeof v==='string') :[],
    effects:'none',persisted:false};
}
export const VISUAL_INTENTS=Object.freeze(['select','preview-layout','preview-style','inspect-meaning']);
export const INTENT_INPUTS=Object.freeze(['tap','language','glyph','gesture','keyboard']);
// Derive semantic identities from actual committed renderer mounts, not knowledge claims.
export function projectMountedVisualSemantics({surfaceId,revision,instances}={}){
  id(surfaceId);
  if(!Number.isSafeInteger(revision)||revision<0||!Array.isArray(instances)||instances.length>64)invalid('invalid mounted revision');
  const seen=new Set(),views=instances.map(row=>{
    const componentId=id(row.instanceId);
    if(seen.has(componentId)||row.surfaceId!==surfaceId||row.revision!==revision||
       typeof row.componentId!=='string'||!/^vivim\.ui\.[a-z0-9.-]+@1$/.test(row.componentId))invalid('invalid mounted component identity');
    seen.add(componentId);
    return {componentId,canonicalId:row.componentId,viewKind:row.type,privacy:'phone',objectRefs:[]};
  });
  return {schema:SEMANTIC_SCHEMA,surfaceId,revision,views,objects:[],edges:[],unknowns:[],
    authority:'derived-from-mounted-committed-ui',effects:'none',persisted:false};
}
export function projectVisualIntent({source,targetId,intent,layout=null,style=null,semantic}={}){
  if(!INTENT_INPUTS.includes(source)||!VISUAL_INTENTS.includes(intent))invalid('unsupported visual intent');
  if(!semantic||semantic.schema!==SEMANTIC_SCHEMA)invalid('semantic projection required');
  id(targetId);
  const view=semantic.views.find(v=>v.componentId===targetId);if(!view)invalid('unknown target');
  if(intent==='preview-layout'&&!LAYOUT_INTENTS.includes(layout))invalid('unknown layout intention');
  if(intent!=='preview-layout'&&layout!==null)invalid('unexpected layout');
  if(style!==null&&(intent!=='preview-style'||typeof style!=='string'||!['compact','comfortable','spacious'].includes(style)))invalid('unsupported style');
  const meaning={schema:'vivim.visual-intent/1',surfaceId:semantic.surfaceId,targetId,intent,
    ...(semantic.authority==='derived-from-mounted-committed-ui'?{revision:semantic.revision,canonicalId:view.canonicalId}:{}),
    ...(layout?{layout}:{}),...(style?{style}:{}),revisionAuthority:'Host-required',decision:'preview-only'};
  return {...meaning,source,meaningDigest:digestJson(meaning),effects:'none',
    authorization:'required-for-commit',parsedBy:'trusted-UI-or-upstream-interpreter'};
}
// Historical eight mutations are documented mappings, NOT accepted model protocol extensions.
export const LEGACY_MUTATION_COMPAT=Object.freeze({
  replace:{uiOp:'replace-props',status:'conditional',note:'only same-component props; replacing type requires explicit new proposal'},
  insert:{uiOp:'insert',status:'conditional',note:'must satisfy current component catalog and parent'},
  remove:{uiOp:'remove',status:'supported',note:'protected root and private components remain guarded'},
  reorder:{uiOp:'move',status:'conditional',note:'requires exact parent and index'},
  restyle:{uiOp:'set-theme',status:'conditional',note:'root theme only, no raw CSS'},
  rebind:{uiOp:null,status:'unsupported',note:'new dataRef requires Host binding authorization'},
  set_property:{uiOp:'replace-props',status:'conditional',note:'only allowlisted typed props'},
  set_slot:{uiOp:null,status:'unsupported',note:'slot semantics not in GUI01 catalog'}
});
