// First-contact PWA draft source/delivery binding (TypeScript 7+).
// Only same-origin, owner-Tailscale phone routes can furnish a delivery;
// no global event, browser-generated grant, provider send or new CLI.
import {createComposerDraftAdapter} from './agent-composer-adapter.ts';

type Fence = {
  epoch:string; sequence:number; regionId:string;
  viewRevision:number; sourceRevision:number;
};
type Config = {
  field:HTMLTextAreaElement;
  active:()=>boolean;
  maxLength:()=>number;
  onVerified?:(correlationId:string)=>void;
};
const ENDPOINT='/mobile/api/first-contact/composer/';
const ID=Array.from(crypto.getRandomValues(new Uint8Array(16)),
  b=>b.toString(16).padStart(2,'0')).join('');
const validFence=(o:any):o is {
  schema:string;state:string;epoch:string;systemSequence:number;
  viewRevision:number;sourceRevision:number;regionId:string;
}=>o?.schema==='vivim.composer-observation-receipt/1'&&
  o.state==='observed'&&typeof o.epoch==='string'&&
  Number.isSafeInteger(o.systemSequence)&&Number.isSafeInteger(o.viewRevision)&&
  Number.isSafeInteger(o.sourceRevision)&&o.regionId==='phone.composer';
export function mountFirstContactComposer({field,active,maxLength,onVerified}:Config){
  let revision=0,composing=false,closed=false,dirty=true,applying=false;
  let lastSignature='';
  let fence:Fence|null=null,authDelivery:any=null,pollBusy=false;
  let chain:Promise<unknown>=Promise.resolve();
  const headers={'content-type':'application/json','x-vivim-composer':'1'};
  const eligible=()=>!closed&&active()&&document.visibilityState==='visible'&&
    navigator.onLine!==false&&field.isConnected&&!field.disabled&&!field.readOnly;
  async function fetchJson(path:string,options:RequestInit={}):Promise<any>{
    const result=await fetch(ENDPOINT+path,{
      cache:'no-store',credentials:'same-origin',headers,...options
    });
    if(!result.ok)throw Error('COMPOSER_PHONE_SOURCE_UNAVAILABLE');
    return result.json();
  }
  function report(change=true,correlationId?:string):Promise<any>{
    if(closed)return Promise.reject(Error('COMPOSER_DISPOSED'));
    const visible=eligible();
    const signature=JSON.stringify([field.value,'vivim',visible,composing]);
    // Visibility/target changes are real source changes, not a new grant.
    if(change||revision===0||signature!==lastSignature)revision++;
    lastSignature=signature;
    const captured={sessionId:ID,revision,text:field.value,
      mode:'vivim',visible,composing,
      ...(correlationId?{correlationId}:{})};
    dirty=true;fence=null;
    const pending=chain.then(async()=>{
      if(closed)throw Error('COMPOSER_DISPOSED');
      if(captured.text.length>maxLength())throw Error('COMPOSER_TOO_LARGE');
      const observed=await fetchJson('observe',{method:'POST',body:JSON.stringify(captured)});
      if(!validFence(observed))throw Error('COMPOSER_FENCE_UNAVAILABLE');
      if(revision===captured.revision&&field.value===captured.text&&
         composing===captured.composing&&eligible()===captured.visible){
        fence={epoch:observed.epoch,sequence:observed.systemSequence,
          regionId:observed.regionId,viewRevision:observed.viewRevision,
          sourceRevision:observed.sourceRevision};
        dirty=false;
      }
      return observed;
    });
    chain=pending.catch(()=>{});return pending;
  }
  const currentFence=()=>!dirty&&eligible()&&!composing?fence:null;
  const adapter=createComposerDraftAdapter({
    field,currentFence,maxLength,
    isAuthorizedDelivery:async(message:any)=>authDelivery===message&&
      message?.sessionId===ID&&message?.localRevision===revision&&
      message?.actorId==='desktop-owner'&&eligible()&&!dirty,
    onLocalApplied:async({text,correlationId}:{text:string;correlationId:string})=>{
      if(!applying||field.value!==text)throw Error('COMPOSER_LOCAL_STALE');
      await report(true,correlationId); // independent, exact #text input readback
      const ack=await fetchJson('ack',{method:'POST',body:JSON.stringify({
        sessionId:ID,correlationId,stage:'applied-local'
      })});
      if(ack?.schema!=='vivim.composer-ack/1'||ack.state!=='verified'||
         ack.correlationId!==correlationId)throw Error('COMPOSER_HOST_NOT_VERIFIED');
      onVerified?.(correlationId);
    },
    createInputEvent:()=>new Event('input',{bubbles:true})
  });
  const humanInput=()=>{if(!applying)void report(true).catch(()=>{});};
  const startComposition=()=>{composing=true;void report(true).catch(()=>{});};
  const endComposition=()=>{composing=false;void report(true).catch(()=>{});};
  const visibility=()=>{void report(true).catch(()=>{});};
  field.addEventListener('input',humanInput);
  field.addEventListener('compositionstart',startComposition);
  field.addEventListener('compositionend',endComposition);
  document.addEventListener('visibilitychange',visibility);
  async function poll(){
    if(pollBusy||!currentFence())return;
    pollBusy=true;
    try{
      const delivery=await fetchJson('next?sessionId='+encodeURIComponent(ID),{
        headers:{'x-vivim-composer':'1'}
      });
      if(delivery?.schema!=='vivim.agent-composer-delivery/1')return;
      if(delivery.sessionId!==ID||delivery.localRevision!==revision)return;
      authDelivery=delivery;
      applying=true;
      try{await adapter.apply(delivery);}
      finally{applying=false;authDelivery=null;}
    }catch{/* Fail closed. A claimed delivery must never auto-replay. */}
    finally{pollBusy=false;}
  }
  // Start by observing the existing real textarea. Heartbeats refresh freshness
  // without manufacturing a source revision or disturbing an in-flight draft.
  void report(true).catch(()=>{});
  const timer=setInterval(()=>{
    if(closed)return;
    if(eligible()){
      if(!dirty)void poll();
      else void report(false).catch(()=>{});
    }else if(!closed&&lastSignature&&JSON.parse(lastSignature)[2]===true){
      void report(false).catch(()=>{});
    }
  },750);
  const heartbeat=setInterval(()=>{if(!closed)void report(false).catch(()=>{});},8000);
  const dispose=()=>{
    closed=true;clearInterval(timer);clearInterval(heartbeat);
    field.removeEventListener('input',humanInput);
    field.removeEventListener('compositionstart',startComposition);
    field.removeEventListener('compositionend',endComposition);
    document.removeEventListener('visibilitychange',visibility);
    adapter.dispose();
  };
  window.addEventListener('pagehide',dispose,{once:true});
  return Object.freeze({dispose,sessionId:ID});
}
