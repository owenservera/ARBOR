// S05: the PWA is a *display and input* peer of the ONE native GPUI renderer.
// Pixels are decoded from GPUI-produced PNGs and painted verbatim on canvas.
// No independent product buttons, layout, command parser, Host, pairing store,
// or effect dispatcher is constructed here. A caller MUST inject the EXISTING
// authenticated Host/phone channel and prove each native viewport session.
import {validateGpuiFrame,nativePointerFromClient} from './gpui-viewport-contract.mjs';
import {nativeTextFromPhone} from './gpui-text-input-contract.mjs';

const safeStatus=(callback,value)=>{try{callback(value);}catch{/* diagnostics are not authority */}};
async function decodeNativePng(png){
  if(typeof createImageBitmap!=='function' || typeof Blob!=='function')
    throw new Error('GPUI_BITMAP_DECODER_UNAVAILABLE');
  return createImageBitmap(new Blob([png],{type:'image/png'}));
}
function validChannel(channel,textTarget){
  return channel && typeof channel.isAuthenticated==='function' &&
    typeof channel.authorizeFrame==='function' &&
    typeof channel.subscribeFrames==='function' &&
    typeof channel.submitPointer==='function' &&
    (!textTarget||typeof channel.submitText==='function');
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
  canvas,channel,textTarget=null,decodePng=decodeNativePng,onStatus=()=>{}
}={}){
  if(!canvas || typeof canvas.getContext!=='function' ||
      typeof canvas.addEventListener!=='function' ||
      typeof canvas.removeEventListener!=='function' ||
      typeof canvas.getBoundingClientRect!=='function' ||
      !validChannel(channel,textTarget) ||
      (textTarget && (typeof textTarget.addEventListener!=='function' ||
        typeof textTarget.removeEventListener!=='function')) ||
      typeof decodePng!=='function' ||
      typeof onStatus!=='function')throw new Error('GPUI_VIEWPORT_DEPENDENCY_INVALID');
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx || typeof ctx.drawImage!=='function' ||
      typeof ctx.clearRect!=='function')throw new Error('GPUI_VIEWPORT_CANVAS_UNAVAILABLE');

  let current=null,closed=false,connected=true,composing=false;
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
    composing=false;
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
  // A resolved Host refusal is still a refusal, not a successful tap/key.
  // "submitted" only means handed toward GPUI, never a Host effect.
  const observeInputOutcome=completion=>{
    const receipt=result=>{
      if(result?.state==='refused'||result?.state==='native_delivery_uncertain')
        safeStatus(onStatus,'input-rejected');
      else if(result?.state==='submitted_to_native_unverified')
        safeStatus(onStatus,'input-submitted-unverified');
    };
    if(completion&&typeof completion.then==='function')
      void Promise.resolve(completion).then(receipt,()=>safeStatus(onStatus,'input-rejected'));
    else receipt(completion);
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
      observeInputOutcome(completion);
      event.preventDefault?.();
    }catch{safeStatus(onStatus,'input-rejected');}
  };
  // A pre-existing hidden textarea/input may be passed by the incumbent
  // PWA only as a mobile IME transport control. This module creates no
  // visible DOM composer or second renderer.
  const textHandlers=[];
  const bindText=(name,fn)=>{
    textTarget.addEventListener(name,fn);
    textHandlers.push([name,fn]);
  };
  const sendText=(phase,value)=>{
    if(closed||!connected||!current)return;
    if(!admitted(current)){disconnect();return;}
    if(!Number.isSafeInteger(nextSequence+1))return;
    let packet;
    try{packet=nativeTextFromPhone(current,phase,value,++nextSequence);}
    catch{return;}
    try{observeInputOutcome(channel.submitText(packet));}
    catch{safeStatus(onStatus,'input-rejected');}
  };
  const connectText=()=>{
    if(!textTarget)return;
    bindText('compositionstart',()=>{composing=true;sendText('ime-start','');});
    bindText('compositionupdate',event=>{
      if(composing&&typeof event?.data==='string'&&event.data)
        sendText('ime-update',event.data);
    });
    bindText('compositionend',event=>{
      if(!composing)return;
      composing=false;
      const value=typeof event?.data==='string'?event.data:'';
      sendText(value?'ime-commit':'ime-cancel',value);
    });
    bindText('keydown',event=>{
      if(composing||event?.isComposing||typeof event?.key!=='string'||
          event.key==='Unidentified'||event.key==='Process')return;
      sendText('key-down',event.key);
    });
    bindText('keyup',event=>{
      if(composing||event?.isComposing||typeof event?.key!=='string'||
          event.key==='Unidentified'||event.key==='Process')return;
      sendText('key-up',event.key);
    });
  };
  const removeText=()=>{
    for(const [name,fn] of textHandlers)textTarget.removeEventListener(name,fn);
    textHandlers.length=0;
  };
  canvas.addEventListener('pointerdown',pointerdown);
  let unsubscribe;
  try{
    unsubscribe=channel.subscribeFrames(frame=>{void receiveFrame(frame);});
    if(typeof unsubscribe!=='function')throw new Error('GPUI_FRAME_SUBSCRIPTION_INVALID');
    connectText();
  }catch(error){
    closed=true;canvas.removeEventListener('pointerdown',pointerdown);
    removeText();
    try{unsubscribe?.();}catch{}
    clear();
    throw error;
  }
  const dispose=()=>{
    if(closed)return;
    closed=true;disconnect();
    canvas.removeEventListener('pointerdown',pointerdown);
    removeText();
    try{unsubscribe();}catch{}
  };
  return Object.freeze({
    receiveFrame,disconnect,reconnect,dispose,
    getFrame:()=>current, // metadata only, never raw private pixel bytes
    isConnected:()=>!closed && connected && admitted(current)
  });
}
