// The source's browser acceptance probe must read the SAME composer used for
// typing, never an unrelated visible editor. Pure DOM simulation; no network,
// profile access, browser effects, or submitted messages.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { turnObservationExpression } from '../../src/capture/conversation-thread.mjs';

const adapter={id:'chatgpt',composer:{selectors:['.composer-a','.composer-b']},
  assistant:{streamingSelectors:[]},send:{buttonSelectors:[]}};
function editor(text,{hidden=false,connected=true}={}){
  return {value:text,hidden,inert:false,isConnected:connected,parentElement:null,disabled:false,
    getBoundingClientRect:()=>({width:300,height:40}),
    getAttribute:()=>null,contains(el){return el===this||el?.parentElement===this;}};
}
function observe({a,b,remembered=null,active=null}={}){
  const candidates={'.composer-a':[a],'.composer-b':[b]};
  const document={
    activeElement:active,
    querySelectorAll:s=>candidates[s]||[]
  };
  return runInNewContext(turnObservationExpression(adapter),{
    document,location:{origin:'https://chatgpt.com',pathname:'/'},
    getComputedStyle:()=>({display:'block',visibility:'visible',contentVisibility:'visible'}),
    __aionDrive:remembered?{el:remembered}:undefined
  });
}
test('readback follows exact remembered composer instead of first matching editable',()=>{
  const a=editor('unrelated draft'),b=editor('VIVIM probe');
  const state=observe({a,b,remembered:b,active:b});
  assert.equal(state.draft.text,'VIVIM probe');
  assert.equal(state.draft.chars,11);
  assert.equal(state.controls.composerEnabled,true);
});
test('a connected but old remembered editor cannot override another focused editor',()=>{
  const old=editor('stale'),current=editor('current');
  assert.equal(observe({a:old,b:current,remembered:old,active:current}).draft.text,'current');
});
test('no stale remembered editor can override current focused visible composer',()=>{
  const a=editor('other'),b=editor('new draft'),stale=editor('stale',{connected:false});
  assert.equal(observe({a,b,remembered:stale,active:b}).draft.text,'new draft');
  const hidden=editor('hidden',{hidden:true});
  assert.equal(observe({a:hidden,b,remembered:hidden,active:b}).draft.text,'new draft');
});
test('two visible unfocused editors are ambiguous and cannot prove an empty composer',()=>{
  const state=observe({a:editor(''),b:editor('someone else'),active:null});
  assert.equal(state.draft.text,null);
  assert.equal(state.draft.chars,null);
  assert.equal(state.controls.composerEnabled,false);
});
test('one visible editor remains usable before any typing or saved focus',()=>{
  const state=observe({a:editor(''),b:editor('hidden',{hidden:true})});
  assert.equal(state.draft.text,'');
  assert.equal(state.draft.chars,0);
  assert.equal(state.controls.composerEnabled,true);
});
