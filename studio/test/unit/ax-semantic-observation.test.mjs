import test from 'node:test';
import assert from 'node:assert/strict';
import { DomObserver, projectAccessibilitySemantics } from '../../src/capture/dom.mjs';

const scope = { documentStable:true, frameId:'frame' };
const node = (nodeId, role, extra={}) => ({nodeId,role:{value:role},ignored:false,...extra});
const prop = (name,value) => ({name,value:{value}});
const sample = () => [
  node('root','main',{frameId:'frame'}),
  node('wrapper','generic',{parentId:'root'}),
  node('b','button',{parentId:'wrapper',name:{value:'Save'},backendDOMNodeId:987,
    properties:[prop('disabled',false),prop('focused',true)]}),
  node('t','textbox',{parentId:'root',name:{value:'Private account label'},value:{value:'private input'},
    properties:[prop('required',true),prop('valuetext','private value')]})
];
test('typed AX projection omits arbitrary names, values and transient handles', () => {
  const result=projectAccessibilitySemantics(sample(),scope);
  assert.equal(result.coverage,'partial');
  assert.equal(result.accountBinding,'unverified');
  assert.equal(result.effectAuthority,false);
  assert.equal(result.controls.length,2);
  assert.deepEqual(result.controls[0],{ordinal:0,role:'button',name:'save',nameStatus:'fixed-ui-vocabulary',
    state:{disabled:false},contextRole:'main',parentControl:null,domLinkObserved:true,identity:'observation-local-unverified'});
  assert.equal(result.controls[1].nameStatus,'present-omitted');
  const serialized=JSON.stringify(result);
  for(const forbidden of ['Private account label','private input','private value','987','wrapper'])
    assert.equal(serialized.includes(forbidden),false,forbidden);
});
test('fingerprint tolerates remapped handles, order and irrelevant wrappers but detects changed state', () => {
  const base=projectAccessibilitySemantics(sample(),scope);
  const other=[node('z','main'),node('t2','textbox',{parentId:'z',name:{value:'Private account label'},properties:[prop('required',true)]}),
    node('b2','button',{parentId:'z',name:{value:' SAVE '},backendDOMNodeId:222,properties:[prop('disabled',false),prop('focused',false)]})];
  assert.equal(projectAccessibilitySemantics(other,scope).fingerprint,base.fingerprint);
  other[2].properties=[prop('disabled',true)];
  assert.notEqual(projectAccessibilitySemantics(other,scope).fingerprint,base.fingerprint);
});
test('duplicate semantic controls are ambiguous, not durable targets', () => {
  const result=projectAccessibilitySemantics([node('a','button',{name:{value:'Save'}}),node('b','button',{name:{value:'Save'}})],scope);
  assert.equal(result.identityAmbiguity,2);
  assert.equal(result.identity,'unverified');
  assert.ok(result.controls.every(c=>c.identity==='observation-local-unverified'));
});
test('cross-frame and ignored nodes are not admitted; duplicate handles and overflow fail closed', () => {
  const result=projectAccessibilitySemantics([node('a','button'),node('b','button',{frameId:'foreign'}),node('c','button',{ignored:true})],scope);
  assert.equal(result.controls.length,1);
  assert.equal(projectAccessibilitySemantics([node('a','button'),node('a','button')],scope).fingerprint,null);
  const bounded=projectAccessibilitySemantics(Array.from({length:257},(_,i)=>node(String(i),'button')),scope);
  assert.equal(bounded.controls.length,256);
  assert.equal(bounded.truncated,true);
  assert.equal(bounded.fingerprint,null);
});
test('unbound document cannot produce a semantic fingerprint', () => {
  assert.equal(projectAccessibilitySemantics(sample(),{}).fingerprint,null);
  assert.equal(projectAccessibilitySemantics([],scope).coverage,'unknown');
});
test('existing observer requests only the current main frame and discards navigation-raced data', async () => {
  const observer=new DomObserver({append:()=>{},profile:{}});
  observer.mainFrameId='frame';
  let reads=0, changing=false;
  observer.session={async send(method,args){
    if(method==='Page.getFrameTree') return {frameTree:{frame:{id:'frame',loaderId:changing && ++reads===2?'loader2':'loader1'}}};
    assert.equal(method,'Accessibility.getFullAXTree');
    assert.deepEqual(args,{depth:60,frameId:'frame'});
    return {nodes:sample()};
  }};
  const result=await observer.accessibility();
  assert.equal(result.semantics.documentStable,true);
  assert.equal(result.roles.button,1);
  changing=true;
  const raced=await observer.accessibility();
  assert.equal(raced.semantics.reason,'DOCUMENT_CHANGED');
  assert.equal(raced.semantics.fingerprint,null);
  assert.deepEqual(raced.semantics.controls,[]);
  assert.equal(raced.nodes,0);
});
