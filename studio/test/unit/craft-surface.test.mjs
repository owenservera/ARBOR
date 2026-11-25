import test from 'node:test';
import assert from 'node:assert/strict';
import { projectVisibleControls } from '../../src/studio/craft-surface.mjs';
const node=(role,name,ignored=false,properties=[])=>({ignored,role:{value:role},name:{value:name},properties});
test('projects known controls, not chat titles, field values or ignored nodes',()=>{
 const r=projectVisibleControls([
  node('button','Settings',false,[{name:'expanded',value:{value:true}},{name:'value',value:{value:'private'}}]),
  node('link','Private conversation title'),
  node('button','Refresh tools'),
  node('button','vivim_terminal_start'),
  node('button','ignored',true),
  node('StaticText','private conversation body')
 ]);
 assert.deepEqual(r.controls,[{role:'button',label:'Settings',state:{expanded:true}},{role:'link',label:null,state:{}},{role:'button',label:'Refresh tools',state:{}},{role:'button',label:'vivim_terminal_start',state:{}}]);
 assert.equal(r.redactedLabels,1);
 assert.deepEqual(r.counts,{button:3,link:1});
 assert.equal(r.truncated,false);
 assert.ok(!JSON.stringify(r).includes('private'));
});
test('rejects malformed AX input and reports bounded capture',()=>{
 assert.throws(()=>projectVisibleControls(null),/SURFACE_AX_INVALID/);
 const r=projectVisibleControls(Array.from({length:5001},()=>node('button','Settings')));
 assert.equal(r.controls.length,5000);
 assert.equal(r.counts.button,5001);
 assert.equal(r.truncated,true);
});
