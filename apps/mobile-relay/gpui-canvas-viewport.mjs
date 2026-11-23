// S05: the PWA is a *display and input* peer of the ONE native GPUI renderer.
// Pixels are decoded from GPUI-produced PNGs and painted verbatim on canvas.
// No independent product buttons, layout, command parser, Host, pairing store,
// or effect dispatcher is constructed here. A caller MUST inject the EXISTING
// authenticated Host/phone channel and prove each native viewport session.
import {validateGpuiFrame,nativePointerFromClient} from './gpui-viewport-contract.mjs';

const safeStatus=(callback,value)=>{try{callback(value);}catch{/* diagnostics are not authority */}};
async function decodeNativePng(png){
  if(typeof createImageBitmap!=='function' || typeof Blob!=='function')
    throw new Error('GPUI_BITMAP_DECODER_UNAVAILABLE');
  return createImageBitmap(new Blob([png],{type:'image/png'}));
}
function validChannel(channel){
  return channel && typeof channel.isAuthenticated==='function' &&
    typeof channel.authorizeFrame==='function' &&
    typeof channel.subscribeFrames==='function' &&
    typeof channel.submitPointer==='function';
}

/**
 * Wire the existing paired transport into an inert remote GPUI canvas.
 *
 * channel.isAuthenticated() validates EXISTING Host/phone pairing;
 * channel.authorizeFrame(meta) binds an exact GPUI session/revision to it;
 * channel.subscribeFrames(handler) supplies authenticated GPUI pixel frames;
 * channel.submitPointer(touch) returns input to the owning native GPUI path.
 *
 * Neither function authorizes Host effects: native input and Host review do.
 * The adapter fails closed when pairing/session proof disappears.
 */
export function mountGpuiCanvasViewport({
  canvas,channel,decodePng=decodeNativePng,onStatus=()=>{}
}={}){
  if(!canvas || typeof canvas.getContext!=='function' ||
      typeof canvas.addEventListener!=='function' ||
      typeof canvas.removeEventListener!=='function' ||
      typeof canvas.getBoundingClientRect!=='function' ||
      !validChannel(channel) || typeof decodePng!=='function' ||
      typeof onStatus!=='function')throw new Error('GPUI_VIEWPORT_DEPENDENCY_INVALID');
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx || typeof ctx.drawImage!=='function' ||
      typeof ctx.clearRect!=='function')throw new Error('GPUI_VIEWPORT_CANVAS_UNAVAILABLE');

  let current=null,closed=false,connected=true;
  let paintEpoch=0,nextSequence=0;
  const admitted=meta=>{
    try{return channel.isAuthenticated()===true && channel.authorizeFrame(meta)===true;}
    catch{return false;}
  };
  const clear=()=>{
    current=null;
    // Stale private pixels cannot remain visible after a disconnect.
    ctx.clearRect(0,0,canvas.width,canvas.height);
  };
  const disconnect=()=>{
    paintEpoch++;
    connected=false;
    clear();
    safeStatus(onStatus,'disconnected');
  };
  const reconnect=()=>{
    if(closed)return false;
    // The new GPUI session is not known until its first real frame arrives.
    // Pairing is checked here; exact viewport authorization is checked per frame.
    let paired=false;
    try{paired=channel.isAuthenticated()===true;}catch{}
    if(!paired)return false;
    connected=true;
    safeStatus(onStatus,'connecting');
    return true;
  };
  const receiveFrame=async frame=>{
    if(closed || !connected)return {state:'refused',reason:'GPUI_VIEWPORT_DISCONNECTED'};
    let meta;
    try{meta=validateGpuiFrame(frame,current);}
    catch{return {state:'refused',reason:'GPUI_FRAME_INVALID'};}
    if(!admitted(meta)){
      disconnect();
      return {state:'refused',reason:'GPUI_PAIRING_OR_SESSION_UNVERIFIED'};
    }
    const epoch=++paintEpoch;
    let bitmap;
    try {
      // Copy before async decode: a transport-owned typed array may be reused.
      bitmap=await decodePng(Uint8Array.from(frame.png)); // Buffer.slice() can alias
      if(!admitted(meta)) {
        disconnect(); // pairing was lost during async decode: scrub old pixels
        return {state:'refused',reason:'GPUI_PAIRING_OR_SESSION_UNVERIFIED'};
      }
      if(closed || !connected || epoch!==paintEpoch ||
          (current && meta.session===current.session && meta.revision<=current.revision))
        return {state:'discarded',reason:'GPUI_FRAME_SUPERSEDED'};
      if(!bitmap || bitmap.width!==meta.width || bitmap.height!==meta.height)
        return {state:'refused',reason:'GPUI_DECODE_DIMENSIONS_MISMATCH'};
      canvas.width=meta.width;
      canvas.height=meta.height;
      ctx.drawImage(bitmap,0,0,meta.width,meta.height);
      current=meta;
      safeStatus(onStatus,'painted');
      return {state:'painted',session:meta.session,revision:meta.revision};
    } catch {
      // If drawing failed after canvas was resized, do not permit input against
      // a potentially blank or corrupted surface from an earlier revision.
      if(epoch===paintEpoch)disconnect();
      return {state:'refused',reason:'GPUI_BITMAP_DECODE_OR_DRAW_FAILED'};
    } finally {
      try{bitmap?.close?.();}catch{}
    }
  };
  const pointerdown=event=>{
    if(closed || !connected || !current)return;
    if(event?.isPrimary===false || (event?.button!==undefined && event.button!==0))return;
    if(!admitted(current)){disconnect();return;}
    if(!Number.isSafeInteger(nextSequence+1))return;
    let packet;
    try{
      packet=nativePointerFromClient(current,canvas.getBoundingClientRect(),
        event.clientX,event.clientY,++nextSequence);
    }catch{return;}
    // Only a real user input event can cause a send. No automated pointer
    // replay, no approval flag and no direct Host action are ever constructed.
    try{
      const completion=channel.submitPointer({
        kind:'vivim.gpui.pointer/1',phase:'down',...packet
      });
      if(completion && typeof completion.catch==='function')
        void completion.catch(()=>safeStatus(onStatus,'input-rejected'));
      event.preventDefault?.();
    }catch{safeStatus(onStatus,'input-rejected');}
  };
  canvas.addEventListener('pointerdown',pointerdown);
  let unsubscribe;
  try{
    unsubscribe=channel.subscribeFrames(frame=>{void receiveFrame(frame);});
    if(typeof unsubscribe!=='function')throw new Error('GPUI_FRAME_SUBSCRIPTION_INVALID');
  }catch(error){
    closed=true;canvas.removeEventListener('pointerdown',pointerdown);
    clear();
    throw error;
  }
  const dispose=()=>{
    if(closed)return;
    closed=true;disconnect();
    canvas.removeEventListener('pointerdown',pointerdown);
    try{unsubscribe();}catch{}
  };
  return Object.freeze({
    receiveFrame,disconnect,reconnect,dispose,
    getFrame:()=>current, // metadata only, never raw private pixel bytes
    isConnected:()=>!closed && connected && admitted(current)
  });
}
