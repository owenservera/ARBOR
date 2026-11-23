// S05 inert in-memory core for the ONE incumbent Host's GPUI remote viewport.
// NOT a new server, pairing store, WebSocket, renderer, or effect authority.
// The Host must supply existing OWNER and PAIRED-PHONE admission functions;
// no frame or pointer is accepted on the basis of client-provided IDs alone.
import {validateGpuiFrame} from '../../mobile-relay/gpui-viewport-contract.mjs';

const deviceId=id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id);
const int=n=>Number.isSafeInteger(n)&&n>=0;
const meta=f=>f?Object.freeze({session:f.session,revision:f.revision,width:f.width,height:f.height}):null;
const refused=reason=>Object.freeze({state:'refused',reason});
export function createGpuiHostFrameRelay({
  authorizeNative,authorizePhone,forwardToGpui,maxSubscribers=4
}={}){
  if(typeof authorizeNative!=='function'||typeof authorizePhone!=='function'||
     typeof forwardToGpui!=='function'||!Number.isSafeInteger(maxSubscribers)||
     maxSubscribers<1||maxSubscribers>8)
    throw new Error('GPUI_RELAY_DEPENDENCIES_INVALID');

  let closed=false,latest=null,nextSubscription=0;
  const listeners=new Map(),lastInputs=new Map();
  const admit=(fn,context,viewport)=>{
    try{return fn(context,viewport)===true;}catch{return false;}
  };
  const clear=()=>{
    if(latest?.png)latest.png.fill(0); // do not retain previous private pixels
    latest=null;
  };
  const drop=record=>{
    listeners.delete(record.id);
    try{record.onDisconnect?.();}catch{}
  };
  const suspend=()=>{
    clear();
    for(const record of [...listeners.values()])drop(record);
  };
  const deliver=(record,frame)=>{
    if(!listeners.has(record.id))return false;
    if(!admit(authorizePhone,record.context,meta(frame))){
      drop(record);return false;
    }
    if(record.pending)return false; // bounded backpressure, send only latest
    if(record.lastSession===frame.session&&record.lastRevision>=frame.revision)
      return false;
    const packet={kind:'vivim.gpui.pixels/1',
      ...meta(frame),png:frame.png.slice()}; // never give transport our owner buffer
    record.lastSession=frame.session;
    record.lastRevision=frame.revision;
    try{
      const sent=record.onFrame(packet);
      if(sent&&typeof sent.then==='function'){
        record.pending=true;
        void Promise.resolve(sent).then(()=>{
          record.pending=false;
          if(latest&&!closed&&listeners.has(record.id))
            deliver(record,latest);
        },()=>{drop(record);});
      }
      return true;
    }catch{drop(record);return false;}
  };
  const publish=(context,frame)=>{
    if(closed)return refused('GPUI_RELAY_CLOSED');
    let next;
    try{next=validateGpuiFrame(frame,latest);}
    catch{return refused('INVALID_OR_STALE_GPUI_FRAME');}
    if(!admit(authorizeNative,context,next)){
      suspend();
      return refused('NATIVE_GPUI_OWNER_NOT_ADMITTED');
    }
    const owned={kind:'vivim.gpui.pixels/1',
      ...next,png:frame.png.slice()};
    clear();
    latest=owned;
    let delivered=0;
    for(const listener of [...listeners.values()])
      if(deliver(listener,latest))delivered++;
    return Object.freeze({state:'published',session:next.session,revision:next.revision,
      subscribersDelivered:delivered});
  };
  const subscribe=(context,onFrame,onDisconnect=()=>{})=>{
    if(closed)throw new Error('GPUI_RELAY_CLOSED');
    if(!deviceId(context?.deviceId)||typeof onFrame!=='function'||
       typeof onDisconnect!=='function'||
       !admit(authorizePhone,context,meta(latest)))
      throw new Error('GPUI_PHONE_NOT_ADMITTED');
    if(listeners.size>=maxSubscribers)throw new Error('GPUI_SUBSCRIBERS_FULL');
    const record={id:++nextSubscription,context,onFrame,onDisconnect,pending:false,
      lastSession:null,lastRevision:0};
    listeners.set(record.id,record);
    if(latest)deliver(record,latest);
    return ()=>{listeners.delete(record.id);};
  };
  // A phone packet is only forwarded to the native renderer's InputFence.
  // Returning "submitted" is NOT an acknowledgment of a control or Host effect.
  const receivePointer=async(context,pointer)=>{
    if(closed)return refused('GPUI_RELAY_CLOSED');
    if(!latest)return refused('GPUI_FRAME_UNAVAILABLE');
    const viewport=meta(latest);
    if(!deviceId(context?.deviceId)||!admit(authorizePhone,context,viewport))
      return refused('GPUI_PHONE_NOT_ADMITTED');
    if(!pointer||pointer.kind!=='vivim.gpui.pointer/1'||
       pointer.phase!=='down'||pointer.session!==viewport.session||
       pointer.revision!==viewport.revision||
       !int(pointer.sequence)||!int(pointer.x)||!int(pointer.y)||
       pointer.x>=viewport.width||pointer.y>=viewport.height)
      return refused('INVALID_GPUI_POINTER');
    const prev=lastInputs.get(context.deviceId);
    if(prev!==undefined&&pointer.sequence<=prev)
      return refused('GPUI_INPUT_REPLAY');
    // Reserve before an uncertain downstream operation: never auto-retry.
    lastInputs.set(context.deviceId,pointer.sequence);
    const inert={kind:'vivim.gpui.pointer/1',phase:'down',
      session:pointer.session,revision:pointer.revision,
      sequence:pointer.sequence,x:pointer.x,y:pointer.y};
    try{
      await forwardToGpui(context,inert);
      return Object.freeze({state:'submitted_to_native_unverified',
        session:inert.session,sequence:inert.sequence});
    }catch{
      return Object.freeze({state:'native_delivery_uncertain',
        session:inert.session,sequence:inert.sequence});
    }
  };
  const close=()=>{
    if(closed)return;
    closed=true;suspend();lastInputs.clear();
  };
  return Object.freeze({
    publish,subscribe,receivePointer,close,
    status:()=>Object.freeze({available:!closed&&Boolean(latest),
      session:latest?.session??null,revision:latest?.revision??null,
      subscribers:listeners.size}) // never expose private pixel bytes
  });
}
