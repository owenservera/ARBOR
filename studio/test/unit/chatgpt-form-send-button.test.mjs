import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { findSendButton, sendMessage } from '../../src/capture/actions.mjs';

const visible = {display:'block', visibility:'visible', opacity:'1'};
const box = {width:240, height:38};
const control = ({name='', testid='', disabled=false, attached=true}={}) => ({
  tagName:'BUTTON', isConnected:attached, disabled,
  getBoundingClientRect:()=>box,
  getAttribute:key=>key==='aria-label'?name:key==='data-testid'?testid:null,
});
function pageFor(buttons,{hasForm=true}={}) {
  const form={isConnected:true,getBoundingClientRect:()=>box,
    querySelectorAll:()=>buttons};
  const composer={isConnected:true,closest:selector=>hasForm&&selector==='form'?form:null};
  const globals={__aionDrive:{el:composer}};
  return {
    globals,
    page:{async send(method, params){
      assert.equal(method,'Runtime.evaluate');
      const value=runInNewContext(params.expression,{
        globalThis:globals,
        document:{querySelectorAll:()=>[]},
        getComputedStyle:()=>visible
      });
      return {result:{value}};
    }}
  };
}
const adapter={send:{buttonSelectors:['button[data-testid="send-button"]']}};

test('one named visible enabled send control inside the remembered composer form is admitted',async()=>{
  const good=control({name:'Send message'});
  const {page,globals}=pageFor([control(),good]);
  const result=await findSendButton(page,adapter);
  assert.equal(result.found,true);
  assert.equal(result.selector,'unique-named-send-in-composer-form');
  assert.equal(globals.__aionSendBtn,good);
});
test('two possible send controls are ambiguous and never clicked',async()=>{
  const {page,globals}=pageFor([control({name:'Send'}),control({testid:'composer-send-button'})]);
  const result=await findSendButton(page,adapter);
  assert.equal(result.found,false);
  assert.match(result.reason,/multiple eligible/);
  assert.equal(globals.__aionSendBtn,null);
});
test('unlabeled, disabled, or detached controls do not grant dispatch',async()=>{
  const {page,globals}=pageFor([
    control(),control({name:'Send',disabled:true}),control({name:'Send',attached:false})
  ]);
  const result=await findSendButton(page,adapter);
  assert.equal(result.found,false);
  assert.equal(globals.__aionSendBtn,null);
});
test('no remembered form means no generic page-level fallback',async()=>{
  const {page,globals}=pageFor([control({name:'Send'})],{hasForm:false});
  const result=await findSendButton(page,adapter);
  assert.equal(result.found,false);
  assert.match(result.reason,/no verified composer form/);
  assert.equal(globals.__aionSendBtn,null);
});

test('button refusal preserves a bounded structural diagnosis and does not dispatch', async()=>{
  let clicks=0, enters=0;
  const actual=await sendMessage({}, {send:{strategy:'button'}}, {
    sendState:async()=>({evalOk:true,draftChars:9}),
    findSendButton:async()=>({found:false,reason:'no verified composer form; refused'}),
    pressEnter:async()=>{enters++;},
    clickSendButton:async()=>{clicks++;}
  });
  assert.equal(actual.dispatched,false);
  assert.equal(actual.sendStatus,'not-attempted');
  assert.equal(actual.reason,'no verified composer form; refused');
  assert.equal(clicks,0);
  assert.equal(enters,0);
});
