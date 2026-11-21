import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as nextTurn} from 'node:timers/promises';
import {mountFirstContactComposer} from '../first-contact-composer.ts';

class ComposerField extends EventTarget {
  value=''; disabled=false; readOnly=false; isConnected=true; maxLength=1000;
  focus(){}
}
function browser(t,{initial='before',onObserve=async()=>{},onVerified=()=>{},typingIntervalMs}={}){
  const old=Object.fromEntries(['document','navigator','window','fetch','setInterval','clearInterval'].map(k=>[k,globalThis[k]]));
  t.after(()=>{for(const [k,v] of Object.entries(old)){if(v===undefined)delete globalThis[k];else Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});}});
  const document=new EventTarget(); document.visibilityState='visible';
  const window=new EventTarget();
  const intervals=new Map(); let nextInterval=1;
  Object.defineProperty(globalThis,'document',{value:document,writable:true,configurable:true});
  Object.defineProperty(globalThis,'window',{value:window,writable:true,configurable:true});
  Object.defineProperty(globalThis,'navigator',{value:{onLine:true},writable:true,configurable:true});
  Object.defineProperty(globalThis,'setInterval',{value:(f,ms)=>{const id=nextInterval++;intervals.set(id,{f,ms});return id;},writable:true,configurable:true});
  Object.defineProperty(globalThis,'clearInterval',{value:(id)=>intervals.delete(id),writable:true,configurable:true});
  let observed=null,ackCount=0,reply=null;
  const field=new ComposerField();field.value=initial;
  const epoch='host.unit';let sequence=13,viewRevision=7,sourceRevision=3;
  Object.defineProperty(globalThis,'fetch',{value:async(url,options)=>{
    const path=String(url);
    if(path.includes('/observe')){
      const data=JSON.parse(options.body);
      await onObserve(data,field);
      const changed=observed!==null&&
        (data.revision!==observed.revision||data.sessionId!==observed.sessionId);
      observed=data;
      if(changed){sourceRevision++;sequence++;viewRevision++;}
      return {ok:true,json:async()=>({schema:'vivim.composer-observation-receipt/1',state:'observed',epoch,
        systemSequence:sequence,viewRevision,sourceRevision,regionId:'phone.composer'})};
    }
    if(path.includes('/next?')){
      const result=reply||{schema:'vivim.composer-delivery-state/1',state:'none'};
      reply=null;
      return {ok:true,json:async()=>result};
    }
    if(path.endsWith('/ack')){
      const args=JSON.parse(options.body);ackCount++;
      return {ok:true,json:async()=>({schema:'vivim.composer-ack/1',state:'verified',correlationId:args.correlationId})};
    }
    throw Error('Unexpected fetch '+url);
  },writable:true,configurable:true});
  const result=mountFirstContactComposer({field,active:()=>true,maxLength:()=>1000,onVerified,typingIntervalMs});
  async function idle(){await nextTurn();await nextTurn();}
  async function tick(){for(const {f,ms} of [...intervals.values()])if(ms===750)f();await idle();}
  return {field,result,tick,idle,observe:()=>observed,ackCount:()=>ackCount,
    enqueue(candidateOverrides={}){
      reply={schema:'vivim.agent-composer-delivery/1',epoch,sessionId:result.sessionId,
        localRevision:observed.revision,actorId:'desktop-owner',candidate:{
          regionId:'phone.composer',pointer:'/draft',oldValue:observed.text,
          newValue:'agent draft',correlationId:'browser.roundtrip',
          expectedSystemSequence:sequence,expectedRegionRevision:viewRevision,
          expectedSourceRevision:sourceRevision,effectPerformed:false,...candidateOverrides
        }};
    }};
}
test('source-backed PWA delivery updates EXISTING field, emits input, never Send',async t=>{
  const b=browser(t);await b.idle();
  assert.equal(b.observe().text,'before');
  let inputCount=0,sendCount=0;
  b.field.addEventListener('input',()=>inputCount++);
  b.field.addEventListener('submit',()=>sendCount++);
  b.enqueue();await b.tick();
  assert.equal(b.field.value,'agent draft');
  assert.equal(inputCount,1);
  assert.equal(sendCount,0);
  assert.equal(b.ackCount(),1);
  assert.equal(b.observe().text,'agent draft');
  b.result.dispose();
});
test('verified activity fires only after Host source ACK, not on rejected delivery',async t=>{
  let count=0;
  const b=browser(t,{onVerified:()=>{count++;}});
  await b.idle();
  b.enqueue({expectedSourceRevision:99999});
  await b.tick();
  assert.equal(count,0,'a rejected delivery must not show a verified indicator');
  b.enqueue();await b.tick();
  assert.equal(count,1,'the Host ACK is the only indicator trigger');
  assert.equal(b.ackCount(),1);
  b.result.dispose();
});
test('host delivery with stale epoch or source fence cannot edit the textarea',async t=>{
  const b=browser(t);await b.idle();
  b.enqueue({expectedSourceRevision:99999});
  await b.tick();
  assert.equal(b.field.value,'before');
  assert.equal(b.ackCount(),0);
  b.result.dispose();
});
test('IME composition makes the draft nonwritable',async t=>{
  const b=browser(t);await b.idle();
  b.field.dispatchEvent(new Event('compositionstart'));await b.idle();
  b.enqueue();await b.tick();
  assert.equal(b.field.value,'before');
  assert.equal(b.ackCount(),0);
  b.field.dispatchEvent(new Event('compositionend'));await b.idle();
  b.result.dispose();
});
test('human typing while agent observation is pending wins and blocks Host ACK',async t=>{
  let release;
  const gate=new Promise(r=>release=r);
  const b=browser(t,{onObserve:async data=>{
    if(data.text==='agent draft')await gate;
  }});
  await b.idle();b.enqueue();
  await b.tick();
  assert.equal(b.field.value,'agent draft');
  b.field.value='Human wins';
  b.field.dispatchEvent(new Event('input'));
  release();await b.idle();await b.idle();
  assert.equal(b.field.value,'Human wins');
  assert.equal(b.ackCount(),0);
  b.result.dispose();
});
test('unchanged heartbeat does not fabricate a client revision or revoke the draft fence',async t=>{
  const b=browser(t);await b.idle();
  const initial=b.observe().revision;
  await b.tick();
  assert.equal(b.observe().revision,initial);
  b.enqueue();await b.tick();
  assert.equal(b.field.value,'agent draft');
  assert.equal(b.ackCount(),1);
  b.result.dispose();
});
test('unmount cancels callbacks and creates a fresh source identity on remount',async t=>{
  const b=browser(t);await b.idle();
  const original=b.result.sessionId;
  b.result.dispose();
  const mounted=mountFirstContactComposer({field:b.field,active:()=>true,maxLength:()=>1000});
  assert.notEqual(mounted.sessionId,original);
  mounted.dispose();
});

test('approved agent typing advances through the SAME Wiki input listener before one Host ACK',async t=>{
  const b=browser(t,{typingIntervalMs:5});await b.idle();
  const previews=[];let sends=0,verified=0;
  b.field.addEventListener('input',()=>previews.push(b.field.value));
  b.field.addEventListener('submit',()=>sends++);
  b.enqueue({newValue:'agent draft with live wiki suggestions'});
  await b.tick();
  await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(b.field.value,'agent draft with live wiki suggestions');
  assert.ok(previews.length>=2,'AutoWiki receives multiple normal input frames');
  assert.equal(previews.at(-1),b.field.value);
  assert.equal(new Set(previews).size,previews.length);
  assert.equal(b.ackCount(),1,'one source-backed Host acknowledgement for the edit');
  assert.equal(sends,0,'visual typing never submits a command');
  b.result.dispose();
});

test('human edits during animated agent delivery stop the remaining frames and prevent ACK',async t=>{
  const b=browser(t,{typingIntervalMs:20});await b.idle();
  let edited=false;
  b.field.addEventListener('input',()=>{
    if(edited)return;
    edited=true;
    b.field.value='HUMAN WINS';
    b.field.dispatchEvent(new Event('input'));
  });
  b.enqueue({newValue:'agent draft with live wiki suggestions'});
  await b.tick();
  await new Promise(resolve=>setTimeout(resolve,80));
  assert.equal(b.field.value,'HUMAN WINS');
  assert.equal(b.ackCount(),0);
  b.result.dispose();
});

test('UTF-8 oversized approved draft is refused before visible AutoWiki input or Host ACK',async t=>{
  const b=browser(t);await b.idle();
  const before=b.field.value;
  let inputs=0,sends=0;
  b.field.addEventListener('input',()=>inputs++);
  b.field.addEventListener('submit',()=>sends++);
  // 300 astral characters are 600 JS code units but 1200 UTF-8 bytes.
  b.enqueue({newValue:'😀'.repeat(300)});
  await b.tick();
  assert.equal(b.field.value,before);
  assert.equal(inputs,0,'no misleading intermediate AutoWiki frames');
  assert.equal(sends,0);
  assert.equal(b.ackCount(),0,'Host must not ACK a locally rejected draft');
  assert.equal(b.observe().text,before);
  b.result.dispose();
});

test('UTF-8 draft inside the observation budget retains a single verified ACK',async t=>{
  const b=browser(t);await b.idle();
  const unicode='😀'.repeat(200);
  let inputs=0;
  b.field.addEventListener('input',()=>inputs++);
  b.enqueue({newValue:unicode});
  await b.tick();
  assert.equal(b.field.value,unicode);
  assert.equal(inputs,1);
  assert.equal(b.ackCount(),1);
  assert.equal(b.observe().text,unicode);
  b.result.dispose();
});
