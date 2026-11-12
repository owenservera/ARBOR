import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {projectInertActionRefs} from '../../../src/visual-runtime/integration-2/action-adapter.mjs';
const doc=()=>({schema:'vivim.ui-document/1',nodes:[{id:'root',type:'stack',children:['preview'],props:{},a11y:{role:'main',name:'Synthetic'}},{id:'preview',type:'button',props:{label:'Preview'},children:[],a11y:{role:'button',name:'Preview',focusOrder:1},actionRefs:[{id:'fixture_preview',version:1}]}]});
test('preserves authoritative version in separate synthetic-only table',()=>{
 const source=doc(), before=JSON.stringify(source), result=projectInertActionRefs(source);
 assert.equal(result.synthetic,true);assert.equal(result.actionVersionTable[0].version,1);
 assert.equal(result.actionVersionTable[0].inert,true);
 assert.deepEqual(result.rendererDocument.nodes[1].actionRefs,['synthetic_ref_1_0']);
 assert.equal(JSON.stringify(source),before);
});
test('rejects unversioned or malformed action refs',()=>{
 for(const v of [{id:'fixture_preview'}, {id:'javascript:attack',version:1}, {id:'fixture_preview',version:0}]){
 const source=doc();source.nodes[1].actionRefs=[v];assert.throws(()=>projectInertActionRefs(source),/ACTION_ADAPTER_ACTION_VERSION/);
 }
});
test('never projects action refs on non-button controls',()=>{
 const source=doc();source.nodes[0].actionRefs=[{id:'fixture_preview',version:1}];
 assert.throws(()=>projectInertActionRefs(source),/ACTION_ADAPTER_ACTION_SCOPE/);
});
test('unknown type and duplicate identity refuse rather than silently coerce',()=>{
 const a=doc();a.nodes[1].type='provider_webview';assert.throws(()=>projectInertActionRefs(a),/NODE_TYPE/);
 const b=doc();b.nodes[1].id='root';assert.throws(()=>projectInertActionRefs(b),/NODE_ID/);
});
