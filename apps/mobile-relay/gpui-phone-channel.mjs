// One existing Direct/Host phone transport for the ACTUAL native GPUI pixels.
// Nothing here renders a second UI, chooses a provider, invents pairing or
// authorizes an effect. The canvas module owns only image display + user input.
import {validateGpuiFrame} from './gpui-viewport-contract.mjs';

const MAX_PNG=4*1024*1024;
const FRAME_FRESH_MS=5_000;
const valid32=s=>typeof s==='string'&&/^[a-f0-9]{32}$/.test(s);
const validRevision=s=>typeof s==='string'&&/^[1-9][0-9]{0,15}$/.test(s)&&
  Number.isSafeInteger(Number(s));
const directOnly=t=>t?.direct===true&&typeof t.deviceHeaders==='function';
const refused=reason=>Object.freeze({state:'refused',reason});

export function createDirectGpuiPhoneChannel({
  transport,fetchImpl=(...args)=>fetch(...args),
  onStatus=()=>{},now=()=>Date.now(),
  schedule=(fn,delay)=>setTimeout(fn,delay),unschedule=id=>clearTimeout(id),
  intervalMs=450
}={}){
  if(!directOnly(transport)||typeof fetchImpl!=='function'||
     typeof onStatus!=='function'||typeof now!=='function'||
     typeof schedule!=='function'||typeof unschedule!=='function'||
     !Number.isInteger(intervalMs)||intervalMs<100||intervalMs>10_000)
    throw new TypeError('GPUI_PHONE_CHANNEL_DEPENDENCIES_INVALID');

  let closed=false,active=false,inFlight=false,timer=null,listener=null;
  let onDisconnect=()=>{},source=null,receivedAt=0,aborting=null,failures=0;
  let boundHeaders=null;
  const identity=()=>{
    if(closed||!directOnly(transport))return null;
    const h=transport.deviceHeaders();
    if(!h||!valid32(h['x-vivim-grant-id'])||
       !valid32(h['x-vivim-device-session']))return null;
    return {'x-vivim-grant-id':h['x-vivim-grant-id'],
      'x-vivim-device-session':h['x-vivim-device-session']};
  };
  const sameIdentity=h=>h&&boundHeaders&&
    h['x-vivim-grant-id']===boundHeaders['x-vivim-grant-id']&&
    h['x-vivim-device-session']===boundHeaders['x-vivim-device-session'];
  const status=value=>{try{onStatus(value);}catch{}};
  const stop=(reason,notify=true)=>{
    active=false;
    if(timer!==null){unschedule(timer);timer=null;}
    aborting?.abort();aborting=null;
    source=null;receivedAt=0;boundHeaders=null;
    if(notify){status(reason);try{onDisconnect(reason);}catch{}}
  };
  const isAuthenticated=()=>Boolean(identity()&&sameIdentity(identity()));
  const authorizeFrame=meta=>{
    const h=identity();
    return Boolean(h&&sameIdentity(h)&&source&&meta&&
      source.session===meta.session&&source.revision===meta.revision&&
      source.width===meta.width&&source.height===meta.height&&
      receivedAt>0&&now()-receivedAt<=FRAME_FRESH_MS);
  };
  const stopIfStale=()=>{
    if(source&&receivedAt>0&&now()-receivedAt>FRAME_FRESH_MS){
      stop('GPUI_FRAME_STALE');return true;
    }
    return false;
  };
  const pollOnce=async()=>{
    if(!active||closed||inFlight)return refused('GPUI_PHONE_POLL_INACTIVE');
    const h=identity();
    if(!h||!sameIdentity(h)){stop('GPUI_PAIRING_INVALID');return refused('GPUI_PAIRING_INVALID');}
    if(stopIfStale())return refused('GPUI_FRAME_STALE');
    inFlight=true;
    const ac=new AbortController();aborting=ac;
    try{
      let url='/mobile/api/gpui/frame';
      if(source)url+='?session='+source.session+'&after='+String(source.revision);
      const response=await fetchImpl(url,{method:'GET',headers:h,
        credentials:'same-origin',cache:'no-store',signal:ac.signal});
      if(!active||!sameIdentity(identity()))return refused('GPUI_PHONE_CHANNEL_CHANGED');
      if(response.status===204){
        stopIfStale();failures=0;
        return Object.freeze({state:'unchanged'});
      }
      if(response.status===401||response.status===403){
        stop('GPUI_DEVICE_GRANT_REVOKED');
        return refused('GPUI_DEVICE_GRANT_REVOKED');
      }
      if(!response.ok||response.status!==200){
        failures++;
        if(failures>=3)stop('GPUI_PHONE_TRANSPORT_UNAVAILABLE');
        return refused('GPUI_FRAME_READ_FAILED');
      }
      if(String(response.headers.get('content-type')||'').split(';')[0]!=='image/png')
        throw new Error('GPUI_FRAME_CONTENT_TYPE_INVALID');
      const session=response.headers.get('x-vivim-gpui-session');
      const revision=response.headers.get('x-vivim-gpui-revision');
      const width=response.headers.get('x-vivim-gpui-width');
      const height=response.headers.get('x-vivim-gpui-height');
      if(!valid32(session)||!validRevision(revision)||
         !validRevision(width)||!validRevision(height))
        throw new Error('GPUI_FRAME_HEADERS_INVALID');
      const contentLength=response.headers.get('content-length');
      if(contentLength&&(!/^[0-9]{1,9}$/.test(contentLength)||
         Number(contentLength)>MAX_PNG))throw new Error('GPUI_FRAME_OVERSIZED');
      const buffer=await response.arrayBuffer();
      if(buffer.byteLength>MAX_PNG)throw new Error('GPUI_FRAME_OVERSIZED');
      const frame={kind:'vivim.gpui.pixels/1',
        session,revision:Number(revision),width:Number(width),height:Number(height),
        png:new Uint8Array(buffer)};
      validateGpuiFrame(frame,source);
      if(!active||closed||!sameIdentity(identity()))return refused('GPUI_PHONE_CHANNEL_CHANGED');
      source={session,revision:frame.revision,width:frame.width,height:frame.height};
      receivedAt=now();
      failures=0;
      status('GPUI_FRAME_RECEIVED');
      await listener(frame);
      return Object.freeze({state:'delivered',session,revision:frame.revision});
    }catch(error){
      if(closed||!active)return refused('GPUI_PHONE_CHANNEL_CHANGED');
      failures++;
      if(failures>=3)stop('GPUI_PHONE_FRAME_INVALID_OR_OFFLINE');
      return refused('GPUI_FRAME_READ_FAILED');
    }finally{
      inFlight=false;if(aborting===ac)aborting=null;
    }
  };
  const scheduleNext=()=>{
    if(!active||closed)return;
    timer=schedule(async()=>{
      timer=null;
      await pollOnce();
      scheduleNext();
    },intervalMs);
  };
  const subscribeFrames=(fn,disconnect=()=>{})=>{
    if(closed||active||typeof fn!=='function'||typeof disconnect!=='function')
      throw new Error('GPUI_FRAME_SUBSCRIPTION_INVALID');
    const h=identity();
    if(!h)throw new Error('GPUI_DEVICE_GRANT_REQUIRED');
    boundHeaders=h;active=true;listener=fn;onDisconnect=disconnect;
    timer=schedule(async()=>{
      timer=null;
      await pollOnce();scheduleNext();
    },0);
    return ()=>{stop('GPUI_PHONE_UNSUBSCRIBED',false);listener=null;};
  };
  const send=async packet=>{
    const h=identity();
    if(!h||!sameIdentity(h)||!authorizeFrame(source))
      return refused('GPUI_PAIRING_OR_FRAME_INVALID');
    if(!packet||packet.session!==source.session||packet.revision!==source.revision)
      return refused('GPUI_INPUT_SOURCE_MISMATCH');
    // User events alone call this. A failed/unknown POST is UNCERTAIN:
    // never auto-retry a pointer or IME event.
    try{
      const response=await fetchImpl('/mobile/api/gpui/input',{
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{...h,'content-type':'application/json',
          'x-vivim-gpui-input':'1'},
        body:JSON.stringify(packet)
      });
      const result=await response.json().catch(()=>null);
      if(response.status===401||response.status===403){stop('GPUI_DEVICE_GRANT_REVOKED');return refused('GPUI_DEVICE_GRANT_REVOKED');}
      if(!response.ok&&response.status!==409)return Object.freeze({state:'native_delivery_uncertain'});
      if(result?.state==='submitted_to_native_unverified')return Object.freeze(result);
      if(result?.state==='refused')return Object.freeze(result);
      return Object.freeze({state:'native_delivery_uncertain'});
    }catch{return Object.freeze({state:'native_delivery_uncertain'});}
  };
  const close=()=>{
    if(closed)return;
    stop('GPUI_PHONE_CLOSED',false);listener=null;closed=true;
  };
  return Object.freeze({
    isAuthenticated,authorizeFrame,subscribeFrames,
    submitPointer:send,submitText:send,pollOnce,close,
    status:()=>Object.freeze({active,authenticated:isAuthenticated(),
      source:source?{...source}:null}) // NEVER raw private pixels or device grants
  });
}
