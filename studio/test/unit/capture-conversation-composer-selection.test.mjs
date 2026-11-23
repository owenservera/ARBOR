// The source's browser acceptance probe must read the SAME composer used for
// typing, never an unrelated visible editor. Pure DOM simulation; no network,
// profile access, browser effects, or submitted messages.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { turnObservationExpression, transcriptExpression } from '../../src/capture/conversation-thread.mjs';

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


function observeTranscript({a,b,remembered=null,active=null}={}){
  const candidates={'.composer-a':[a],'.composer-b':[b]};
  const document={
    activeElement:active,
    querySelectorAll:s=>candidates[s]||[]
  };
  return runInNewContext(transcriptExpression({
    userSelectors:[],assistantSelectors:[],composerSelectors:['.composer-a','.composer-b'],
    streamingSelectors:[],sendSelectors:[]
  }),{
    document,location:{origin:'https://chatgpt.com',pathname:'/'},
    getComputedStyle:()=>({display:'block',visibility:'visible',contentVisibility:'visible',overflowY:'visible'}),
    __aionDrive:remembered?{el:remembered}:undefined
  });
}
test('transcript read follows the visible focused composer, not another earlier selector',()=>{
  const a=editor('unrelated'),b=editor('expected draft');
  const observation=observeTranscript({a,b,active:b});
  assert.equal(observation.draft.present,true);
  assert.equal(observation.draft.chars,14);
  assert.equal(observation.controls.composerEnabled,true);
});
test('transcript read uses the exact remembered composer when focus is absent',()=>{
  const a=editor('older draft'),b=editor('newer draft');
  const observation=observeTranscript({a,b,remembered:b});
  assert.equal(observation.draft.present,true);
  assert.equal(observation.draft.chars,11);
});
test('transcript read refuses to infer a draft from two ambiguous visible editors',()=>{
  const observation=observeTranscript({a:editor(''),b:editor('other'),active:null});
  assert.equal(observation.draft.present,null);
  assert.equal(observation.draft.chars,null);
  assert.equal(observation.controls.composerEnabled,false);
});
test('transcript read skips hidden first editor and refuses a hidden remembered editor',()=>{
  const hidden=editor('secret',{hidden:true}),live=editor('safe visible');
  const observation=observeTranscript({a:hidden,b:live,remembered:hidden});
  assert.equal(observation.draft.present,true);
  assert.equal(observation.draft.chars,12);
  assert.equal(observation.controls.composerEnabled,true);
});
