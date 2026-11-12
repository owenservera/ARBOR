// GUI02: pure post-parse adapters. Call ONLY on outputs of the existing trusted
// compileF02RenderPlan / compileF01Profile / compilePassOutput functions.
// No provider sends, Host grants, SQLite writes or automatic activation here.
import {createSurface,PROPOSAL_SCHEMA,invalid,id,str} from './catalog.mjs';
import {projectBootstrapSemantics} from './semantic-projection.mjs';
const F02='vivim.render-plan/1', F01='vivim.bootstrap-profile/1', DEEP='vivim.bootstrap-output/1';
const PASSES=['F02','F01','D03','D04','D05','D06','D07'];
function themeFromPlan(plan) {
  if(plan?.schema!==F02||!plan.theme?.palette||!plan.typography)invalid('expected locally compiled theme render plan');
  const t=plan.theme,p=plan.typography;
  return {background:t.palette.background,secondary:t.palette.secondary,accent:t.palette.accent,
    appearance:t.appearance,texture:t.texture,mood:t.mood,density:t.density,motion:t.motion,
    fontFamily:p.fontFamily,fontSizePx:p.fontSizePx,headingSizePx:p.headingSizePx,radiusPx:p.radiusPx,spacingScale:p.spacingScale};
}
// BF00: keep the existing compileProvisionalPlan as theme producer; never send a model prompt.
export function provisionalBootstrapSurface({surfaceId='my-space',renderPlan}={}) {
  return createSurface({surfaceId,theme:themeFromPlan(renderPlan)});
}
function base(surface,pass,requestId,operations,explanation) {
  return {schema:PROPOSAL_SCHEMA,surfaceId:surface.surfaceId,baseRevision:surface.revision,operations,
    explanation,assumptions:[],unknowns:[]};
}
// _neverActivate is returned outside the model proposal (see makeResult), so the strict compiler never sees it.
function nextOpId(pass,index=0){return `bootstrap.${pass.toLowerCase()}.${index}`;}
function put(surface,component,pass,index=0){
  const prior=surface.tree.children.find(c=>c.id===component.id);
  if(prior){
    if(prior.type!==component.type||prior.visibility!==component.visibility)invalid('bootstrap stable component identity changed');
    return {opId:nextOpId(pass,index),type:'replace-props',componentId:component.id,props:component.props};
  }
  return {opId:nextOpId(pass,index),type:'insert',parentId:'root',component};
}
export function adaptCompiledBootstrap({pass,compiled,surface,worldId,requestId}={}){
  if(!PASSES.includes(pass))invalid('unsupported bootstrap pass');
  id(worldId);id(requestId);
  if(!surface||surface.schema!=='vivim.ui-surface/1')invalid('valid shared surface required');
  if(compiled?.worldId!==worldId||compiled?.requestId!==requestId)invalid('compiled bootstrap source mismatch');
  const ops=[],refs=[];let visibility='phone';
  if(pass==='F02'){
    if(compiled.schema!==F02||compiled.pass!=='F02')invalid('F02 trusted schema');
    ops.push({opId:nextOpId(pass),type:'set-theme',theme:themeFromPlan(compiled)});
  } else if(pass==='F01'){
    if(compiled.schema!==F01||compiled.passId!=='F01')invalid('F01 trusted schema');
    const claims=new Map(compiled.claims.filter(c=>c.section==='focus').map(c=>[c.label.toLowerCase(),c]));
    for(const card of compiled.cards.slice(0,3)) {
      // Cards without a linked focus or valid supporting claim are not personal facts.
      if(!card.focus)continue;
      const claim=claims.get(card.focus.toLowerCase());if(!claim||!claim.id||!claim.statement||claim.basis==='tentative_inference')continue;
      const c={id:`f01.${id(card.id)}`,type:claim.kind==='project'?'project-card':'profile-card',
        visibility:'phone',props:{title:str(card.title,80),description:str(claim.statement,240),sourceRef:id(claim.id),basis:claim.basis,freshness:claim.freshness},children:[]};
      refs.push(claim.id);ops.push(put(surface,c,pass,ops.length));
    }
  }else{
    if(compiled.schema!==DEEP||compiled.passId!==pass)invalid('deep pass trusted schema');
    visibility=['D06','D07'].includes(pass)?'pc-private':'phone';
    for(const view of compiled.viewProposals.slice(0,3)){
      const c={id:`${pass.toLowerCase()}.${id(view.id)}`,type:'card',visibility,
        props:{title:str(view.title,80),description:str(view.reason,240),sourceRef:id(view.id)},children:[]};
      refs.push(view.id);ops.push(put(surface,c,pass,ops.length));
    }
    // Schema proposals and contradiction evidence are NEVER turned into active capabilities/views.
  }
  const semantic=projectBootstrapSemantics({pass,compiled,worldId,requestId,surfaceId:surface.surfaceId});
  if(!ops.length)return {schema:'vivim.bootstrap-ui-adapter/1',pass,proposal:null,approvedRefs:[],visibility,semantic,decision:'no-grounded-components',persisted:false};
  const strict=base(surface,pass,requestId,ops,`Review ${pass} personalization suggestion`);
  return {schema:'vivim.bootstrap-ui-adapter/1',pass,proposal:strict,approvedRefs:refs,
    visibility,semantic,decision:'preview-required',persisted:false};
}
