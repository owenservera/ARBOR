import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface,validateSurface} from '../generative-ui/catalog.mjs';
import {compileUiProposal} from '../generative-ui/compiler.mjs';
import {resolveBuildRequest} from '../build-composer.mjs';
import {planTierflowSurface,renderSurface} from '../generative-ui/renderer.mjs';
import {buildUndoProposal} from '../build-canvas.mjs';
function fixture(){const s=createSurface();s.revision=4;s.tree.children.push({id:'alpha',type:'card',props:{title:'Alpha'},children:[]},{id:'beta',type:'card',props:{title:'Beta'},children:[]});return validateSurface(s);}
const request=(surface,request)=>resolveBuildRequest({request,surface});
test('exact component config preserves sibling, scope and original; engine draft is inert',()=>{
 const s=fixture(),read=request(s,'set component alpha at revision 4 background to #123456');
 assert.equal(read.outcome,'candidate');assert.equal(read.preview.persisted,false);
 assert.equal(read.proposal.baseRevision,4);assert.equal(read.proposal.operations[0].componentId,'alpha');
 assert.deepEqual(read.preview.surface.tree.children[0].presentation,{background:'#123456'});
 assert.deepEqual(read.preview.surface.tree.children[1],s.tree.children[1]);assert.deepEqual(read.preview.surface.theme,s.theme);
 assert.equal(s.tree.children[0].presentation,undefined);
 for(const [property,value] of [['border-color','#abcdef'],['border-width','2px'],['radius','12px'],['font-size','18px'],['padding','6px'],['gap','8px']]){
  const out=request(s,'set component alpha '+property+' to '+value);assert.equal(out.outcome,'candidate',property);
 }
});
test('revision-pinned, invalid or unsafe requests refuse without fallback',()=>{
 const s=fixture();
 for(const text of ['set component alpha at revision 3 radius to 12px','set component alpha radius to 90px','set component alpha background to url(fake)','set component alpha background to #123456;delete beta','set component alpha visibility to hidden'])assert.equal(request(s,text).outcome,'refused',text);
 assert.equal(request(s,'set component missing radius to 12px').outcome,'clarification_required');
 const p={schema:'vivim.ui-proposal/1',surfaceId:s.surfaceId,baseRevision:4,operations:[{opId:'edit',type:'set-presentation',componentId:'alpha',presentation:{css:'display:none'}}],explanation:'Bad',assumptions:[],unknowns:[]};
 assert.throws(()=>compileUiProposal({proposal:p,surface:s}),/presentation/);
});
test('validated source presentation is retained on preview and committed TierFlow mounts',()=>{
 const s=fixture(),draft=request(s,'set component alpha background to #123456');
 const styled=request(draft.preview.surface,'set component alpha padding to 12px').preview.surface;
 assert.equal(planTierflowSurface(styled).plan.status,'ok');
 const doc={defaultView:{innerWidth:390},createElement(tag){return {tag,style:{},attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},appendChild(c){this.children.push(c);},addEventListener(){}};}};
 const mount={ownerDocument:doc,replaceChildren(...children){this.children=children;}};
 let instances;renderSurface(mount,styled,{tierflow:true,onMounted:v=>{instances=v}});
 const [a,b]=mount.children[0].children[0].children;
 assert.equal(a.style.backgroundColor,'#123456');assert.equal(a.style.padding,'12px');assert.equal(b.style.backgroundColor,s.theme.secondary);
 assert.equal(instances.find(x=>x.instanceId==='alpha').settings.paddingPx,12);
 const reset=request(styled,'reset component alpha appearance');assert.equal(reset.outcome,'candidate');assert.equal(reset.preview.surface.tree.children[0].presentation,undefined);
});
test('signed chart values produce bounded bars without changing labels or original values',()=>{
 const s=fixture();s.tree.children.push({id:'chart',type:'chart',props:{title:'Values',items:[{label:'Loss',value:-5},{label:'Gain',value:10}]},children:[]});
 const doc={defaultView:{innerWidth:390},createElement(tag){return {tag,style:{},attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},appendChild(c){this.children.push(c);},addEventListener(){}};}};
 const mount={ownerDocument:doc,replaceChildren(...children){this.children=children;}};
 renderSurface(mount,s,{tierflow:true});const [loss,gain]=mount.children[0].children[0].children[2].children[1].children;
 assert.equal(loss.children[0].textContent,'-5');assert.equal(gain.children[0].textContent,'10');
 assert.equal(loss.children[1].children[1].style.left,'0%');assert.ok(parseFloat(gain.children[1].children[1].style.width)>60);
});

test('appearance undo is a compensating exact Host proposal with the prior field state',()=>{
 const before=fixture(),draft=request(before,'set component alpha radius to 12px');
 assert.equal(draft.outcome,'candidate');
 const committed={surfaceId:before.surfaceId,parentRevision:4,committedRevision:5};
 const live={...draft.preview.surface,revision:5};
 const undo=buildUndoProposal({original:draft,before,committed,live});
 assert.ok(undo);assert.equal(undo.proposal.baseRevision,5);assert.equal(undo.proposal.operations[0].presentation,null);
 assert.deepEqual(undo.preview.surface,{...before,revision:5});
 assert.equal(buildUndoProposal({original:draft,before,committed,live:{...live,revision:6}}),null);
});
