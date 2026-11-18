import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface} from '../generative-ui/catalog.mjs';
import {compileUiProposal} from '../generative-ui/compiler.mjs';
import {planTierflowSurface,renderSurface} from '../generative-ui/renderer.mjs';

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
  assert.throws(()=>renderSurface(screen,source,{tierflow:true}),/unsupported TierFlow component/);
  assert.equal(screen.children.length,0);
  source.tree.children.pop();
  source.tree.children.push({id:'bad',type:'text',props:{value:'<script>alert(1)</script>'},children:[]});
  assert.throws(()=>renderSurface(screen,source,{tierflow:true}),/UI_REJECTED/);
  assert.equal(screen.children.length,0);
});
