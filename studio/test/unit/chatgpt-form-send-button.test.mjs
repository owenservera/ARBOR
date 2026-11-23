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

test('hydrating ChatGPT send control is read-only polled and clicked exactly once',async()=>{
  let checks=0, clicks=0, enters=0, waits=0, observations=0;
  const actual=await sendMessage({}, {send:{strategy:'button'}}, {
    sendState:async()=>++observations===1
      ? {evalOk:true,draftChars:15,streaming:false,turns:0}
      : {evalOk:true,draftChars:0,streaming:true,turns:1,sent:true,reason:'new turn observed'},
    findSendButton:async()=>({found:++checks>=3,reason:'hydrating'}),
    pressEnter:async()=>{enters++;},
    clickSendButton:async()=>{clicks++;return {dispatched:true};},
    sleep:async()=>{waits++;},
    observeWaits:[0]
  });
  assert.equal(actual.ok,true);
  assert.equal(actual.dispatched,true);
  assert.equal(clicks,1);
  assert.equal(enters,0);
  assert.equal(checks,3);
  assert.equal(waits,3);
});

test('button never becomes ready: bounded reads, zero dispatch, no Enter fallback',async()=>{
  let checks=0, clicks=0, enters=0, waits=0;
  const actual=await sendMessage({}, {send:{strategy:'button'}}, {
    sendState:async()=>({evalOk:true,draftChars:10}),
    findSendButton:async()=>{checks++;return {found:false,reason:'still disabled'};},
    clickSendButton:async()=>{clicks++;return {dispatched:true};},
    pressEnter:async()=>{enters++;},
    sleep:async()=>{waits++;}
  });
  assert.equal(actual.sendStatus,'not-attempted');
  assert.equal(actual.reason,'still disabled');
  assert.equal(checks,6);
  assert.equal(waits,5);
  assert.equal(clicks,0);
  assert.equal(enters,0);
});

test('stale editor rebinds only to the one visible form editor holding identical draft',async()=>{
  const good=control({name:'Enviar'});
  const form={isConnected:true,getBoundingClientRect:()=>box,querySelectorAll:()=>[good]};
  const stale={isConnected:true,tagName:'DIV',innerText:'exact draft',
    closest:()=>null,getBoundingClientRect:()=>box};
  const current={isConnected:true,tagName:'DIV',isContentEditable:true,innerText:'exact draft',
    closest:selector=>selector==='form'?form:null,getBoundingClientRect:()=>box};
  const globals={__aionDrive:{el:stale}};
  const page={async send(method,params){
    const value=runInNewContext(params.expression,{
      globalThis:globals,
      document:{querySelectorAll:selector=>
        selector.startsWith('form [contenteditable')?[current]:[]},
      getComputedStyle:()=>visible
    });
    return {result:{value}};
  }};
  const result=await findSendButton(page,adapter);
  assert.equal(result.found,true);
  assert.equal(result.selector,'unique-named-send-in-composer-form');
  assert.equal(globals.__aionDrive.el,current);
  assert.equal(globals.__aionSendBtn,good);
});
test('different draft content cannot rebind editor or grant a send control',async()=>{
  const good=control({name:'Enviar'});
  const form={isConnected:true,getBoundingClientRect:()=>box,querySelectorAll:()=>[good]};
  const stale={isConnected:true,tagName:'DIV',innerText:'user draft A',
    closest:()=>null,getBoundingClientRect:()=>box};
  const different={isConnected:true,tagName:'DIV',isContentEditable:true,innerText:'user draft B',
    closest:selector=>selector==='form'?form:null,getBoundingClientRect:()=>box};
  const globals={__aionDrive:{el:stale}};
  const page={async send(method,params){
    const value=runInNewContext(params.expression,{
      globalThis:globals,
      document:{querySelectorAll:selector=>
        selector.startsWith('form [contenteditable')?[different]:[]},
      getComputedStyle:()=>visible
    });
    return {result:{value}};
  }};
  const result=await findSendButton(page,adapter);
  assert.equal(result.found,false);
  assert.equal(globals.__aionDrive.el,stale);
  assert.equal(globals.__aionSendBtn,null);
});
