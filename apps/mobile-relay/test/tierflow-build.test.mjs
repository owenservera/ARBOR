import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface} from '../generative-ui/catalog.mjs';
import {compileUiProposal} from '../generative-ui/compiler.mjs';
import {planTierflowSurface,renderSurface} from '../generative-ui/renderer.mjs';
import {compileVecUiRequest} from '../vec/ui-adapter.mjs';

function mount(width) {
  const doc={defaultView:{innerWidth:width},createElement(tag){
    return {tag,style:{},attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},
      appendChild(child){this.children.push(child);},addEventListener(){throw Error('unexpected interactive handler');}};
  }};
  return {ownerDocument:doc,children:[],replaceChildren(...children){this.children=children;}};
}
function cardPreview() {
  const surface=createSurface();
  const proposal={schema:'vivim.ui-proposal/1',surfaceId:surface.surfaceId,baseRevision:0,
    operations:[{opId:'insert.1',type:'insert',parentId:'root',component:{
      id:'layout',type:'grid',props:{columns:3,gap:'md'},children:[
        {id:'card.one',type:'card',props:{title:'My card',description:'Plain description'},children:[]},
        {id:'heading.one',type:'text',props:{value:'Heading',variant:'heading'},children:[]}
      ]
    }}],explanation:'Add a layout',assumptions:[],unknowns:[]};
  return compileUiProposal({surface,proposal,audience:'phone',approvedRefs:[]}).surface;
}
test('existing proposal compiler feeds actual TierFlow document, identity and responsive plan',()=>{
  const surface=cardPreview();
  const narrow=planTierflowSurface(surface,{viewportPx:390});
  const wide=planTierflowSurface(surface,{viewportPx:1280});
  assert.equal(narrow.plan.status,'ok');
  assert.equal(narrow.document.revision,surface.revision);
  assert.equal(narrow.document.rootId,'root');
  assert.equal(narrow.identities.get('card.one'),'vivim.ui.foundation.surface.card@1');
  assert.equal(narrow.identities.get('heading.one'),'vivim.ui.foundation.typography.heading@1');
  assert.equal(narrow.plan.root.children[0].children[0].layout.columns,1);
  assert.equal(wide.plan.root.children[0].children[0].layout.columns,3);
});
test('existing renderer mounts the validated plan and retains Host theme, content and instance IDs',()=>{
  const committed={...cardPreview(),revision:7};
  const screen=mount(390);
  renderSurface(screen,committed,{tierflow:true});
  const container=screen.children[0],grid=container.children[0].children[0];
  assert.equal(container.attrs['data-tierflow-status'],'ok');
  assert.equal(container.attrs['data-tierflow-revision'],'7');
  assert.equal(container.style.backgroundColor,committed.theme.background);
  assert.equal(grid.style.gridTemplateColumns,'repeat(1,minmax(0,1fr))');
  assert.equal(grid.children[0].attrs['data-component-id'],'card.one');
  assert.equal(grid.children[0].children[0].textContent,'My card');
  assert.equal(grid.children[0].children[1].textContent,'Plain description');
  assert.equal(grid.children[1].tag,'h2');
});
test('private nodes are excluded; unsupported and invalid public documents refuse before mount',()=>{
  const source=cardPreview();
  source.tree.children.push({id:'private',type:'text',props:{value:'Private'},visibility:'pc-private',children:[]});
  assert.equal(planTierflowSurface(source).nodes.has('private'),false);
  const screen=mount(390);
  source.tree.children.push({id:'action',type:'button',props:{label:'Do it',intent:'preview-only'},children:[]});
  renderSurface(screen,source,{tierflow:true});
  assert.equal(screen.children[0].children[0].children.at(-1).disabled,true);
  screen.replaceChildren();
  source.tree.children.pop();
  source.tree.children.push({id:'bad',type:'text',props:{value:'<script>alert(1)</script>'},children:[]});
  assert.throws(()=>renderSurface(screen,source,{tierflow:true}),/UI_REJECTED/);
  assert.equal(screen.children.length,0);
});


test('structured source values and ordered TierFlow item plans paint together',()=>{
  const surface=createSurface();
  surface.tree.children.push(
    {id:'items',type:'collection',props:{title:'Collection',items:[{label:'A',detail:'Detail'}]},children:[]},
    {id:'timeline',type:'timeline',props:{title:'Sequence',items:[{label:'First'},{label:'Next'}]},children:[]},
    {id:'chart',type:'chart',props:{title:'Values',items:[{label:'Revenue',value:42}]},children:[]}
  );
  const plan=planTierflowSurface(surface);
  assert.equal(plan.plan.status,'ok');
  assert.equal(plan.identities.get('chart'),'vivim.ui.data.charts.chart@1');
  const screen=mount(390);renderSurface(screen,surface,{tierflow:true});
  const [items,timeline,chart]=screen.children[0].children[0].children;
  assert.equal(items.children[1].children[0].children[0].textContent,'Detail');
  assert.equal(timeline.children[1].children[1].textContent,'Next');
  assert.equal(chart.children[1].children[0].children[0].textContent,'42');
});

test('deterministic structured and local selection components use the same TierFlow plan',()=>{
  for(const type of ['button','collection','timeline','chart']){
    const out=compileVecUiRequest({text:'Add a '+type+' called Example',surface:createSurface()});
    assert.equal(out.outcome,'candidate',type);
    const plan=planTierflowSurface(out.preview.surface);
    assert.equal(plan.plan.status,'ok');
    assert.equal(plan.document.nodes.find(n=>n.id!=='root').type,type);
  }
});
test('sourced profile/project cards require approved references; local selection target must be visible',()=>{
  const surface=createSurface();
  for(const type of ['profile-card','project-card'])surface.tree.children.push({id:type,type,props:{title:type,sourceRef:'source.one'},children:[]});
  assert.throws(()=>planTierflowSurface(surface),/unapproved/);
  const mapped=planTierflowSurface(surface,{approvedRefs:['source.one']});
  assert.equal(mapped.nodes.get('profile-card').type,'profile-card');
  assert.equal(mapped.nodes.get('project-card').type,'project-card');
  surface.tree.children.push({id:'select',type:'button',props:{label:'Select',intent:'select-component',targetId:'missing'},children:[]});
  assert.throws(()=>planTierflowSurface(surface,{approvedRefs:['source.one']}),/target unavailable/);
});

test('committed local-selection buttons remain inert in preview and emit no Host effect in live view',()=>{
 const s=createSurface();s.tree.children.push({id:'select',type:'button',props:{label:'Select',intent:'select-component',targetId:'root'},children:[]});
 const screen=mount(390),seen=[];const orig=screen.ownerDocument.createElement;screen.ownerDocument.createElement=function(tag){const node=orig(tag);node.addEventListener=(name,fn)=>{node[name]=fn;};return node;};
 renderSurface(screen,s,{tierflow:true,onIntent:i=>seen.push(i)});let button=screen.children[0].children[0].children[0];assert.equal(button.disabled,true);assert.equal(button.click,undefined);
 renderSurface(screen,s,{tierflow:true,interactiveLocal:true,onIntent:i=>seen.push(i)});button=screen.children[0].children[0].children[0];button.click();assert.deepEqual(seen,[{intent:'select-component',targetId:'root',componentId:'select',surfaceId:s.surfaceId,revision:s.revision}]);
});
