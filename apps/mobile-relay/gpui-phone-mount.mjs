// Mount the ONE native GPUI renderer's remote viewport in the incumbent PWA.
// Do not create an independent product UI, navigation, Host, command runner or
// provider client. Until real owner-admitted GPUI PNGs arrive, the existing
// PWA remains untouched as a safe, reversible offline/legacy fallback.
import {transport as sharedTransport} from './transport.mjs';
import {createDirectGpuiPhoneChannel} from './gpui-phone-channel.mjs';
import {mountGpuiCanvasViewport} from './gpui-canvas-viewport.mjs';

const keyOf=transport=>{
  try{
    const headers=transport?.deviceHeaders?.();
    const id=headers?.['x-vivim-grant-id'],session=headers?.['x-vivim-device-session'];
    if(/^[a-f0-9]{32}$/.test(id||'')&&/^[a-f0-9]{32}$/.test(session||''))
      return id+':'+session;
  }catch{}
  return null;
};
const put=(element,styles)=>Object.assign(element.style,styles);
const hidden=(element,value)=>{element.hidden=value;};
const inert=(element,value)=>{if(element)element.inert=value;};

/**
 * Progressive convergence: a valid, paired GPUI frame switches the phone
 * display from its old app shell to a canvas displaying native pixels only.
 * No frame or native offline -> restore the old shell without sending writes.
 */
export function mountGpuiPhonePage({
  transport=sharedTransport,
  doc=typeof document!=='undefined'?document:null,
  win=typeof window!=='undefined'?window:null,
  makeChannel=createDirectGpuiPhoneChannel,
  mountViewport=mountGpuiCanvasViewport,
  every=(fn,ms)=>setInterval(fn,ms),
  stopEvery=id=>clearInterval(id),
  now=()=>Date.now()
}={}){
  if(!transport?.direct||!doc?.body||!win)
    return Object.freeze({state:()=>({mode:'legacy',active:false}),refresh:()=>{},close:()=>{}});
  const stage=doc.createElement('section');
  stage.setAttribute('role','region');
  stage.setAttribute('aria-label','Native VIVIM GPUI phone viewport');
  put(stage,{position:'fixed',inset:'0',zIndex:'140',display:'flex',
    flexDirection:'column',justifyContent:'center',alignItems:'center',
    background:'#111214',overflow:'hidden'});
  hidden(stage,true);

  const canvas=doc.createElement('canvas');
  canvas.setAttribute('aria-label','Actual GPUI pixels from your paired PC');
  put(canvas,{display:'block',maxWidth:'100%',maxHeight:'100%',
    touchAction:'none',objectFit:'fill',flex:'none'});
  stage.appendChild(canvas);

  // Browser-only phone keyboard affordance: all text still enters the native
  // GPUI-owned focus, not an independently rendered PWA text composer.
  const text=doc.createElement('textarea');
  text.setAttribute('aria-label','Phone keyboard input to focused native GPUI control');
  text.setAttribute('autocomplete','off');
  text.setAttribute('autocorrect','off');
  text.setAttribute('spellcheck','false');
  text.setAttribute('enterkeyhint','done');
  put(text,{position:'absolute',top:'0',left:'0',width:'2px',height:'2px',
    opacity:'0',border:'0',padding:'0',fontSize:'16px'});
  stage.appendChild(text);

  const tools=doc.createElement('div');
  put(tools,{position:'absolute',right:'12px',bottom:'max(12px,env(safe-area-inset-bottom,0px))',
    display:'flex',alignItems:'center',gap:'8px'});
  const status=doc.createElement('span');
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  status.textContent='Native GPUI · read-only until input is confirmed';
  put(status,{fontSize:'11px',color:'#b8b8bc',background:'#17181ae0',
    padding:'6px 8px',borderRadius:'5px'});
  tools.appendChild(status);
  const keyboard=doc.createElement('button');
  keyboard.type='button';
  keyboard.textContent='⌨';
  keyboard.setAttribute('aria-label','Show phone keyboard for native GPUI');
  put(keyboard,{fontSize:'22px',minWidth:'48px',minHeight:'48px',color:'#f4f4f4',
    background:'#202226',border:'1px solid #4b4d53',borderRadius:'8px'});
  const focusText=()=>{try{text.focus({preventScroll:true});}catch{}};
  keyboard.addEventListener('click',focusText);
  tools.appendChild(keyboard);
  stage.appendChild(tools);
  doc.body.appendChild(stage);

  const oldApp=doc.getElementById?.('app')||null;
  const oldTop=doc.getElementById?.('top')||null;
  const prior=[oldApp,oldTop].map(el=>el?.inert===true);
  let viewport=null,channel=null,closed=false,visible=false;
  let grant=null,blockedGrant=null,lastAttempt=0;
  const fit=()=>{
    if(!visible||!viewport)return;
    const frame=viewport.getFrame();
    if(!frame)return;
    const width=Number(win.innerWidth)||frame.width;
    const height=Number(win.innerHeight)||frame.height;
    const scale=Math.min(width/frame.width,height/frame.height);
    if(!Number.isFinite(scale)||scale<=0)return;
    put(canvas,{width:Math.max(1,Math.floor(frame.width*scale))+'px',
      height:Math.max(1,Math.floor(frame.height*scale))+'px'});
  };
  const hide=()=>{
    visible=false;hidden(stage,true);
    inert(oldApp,prior[0]);inert(oldTop,prior[1]);
    text.value='';
    try{text.blur?.();}catch{}
  };
  const show=()=>{
    if(closed||!viewport?.getFrame())return;
    visible=true;hidden(stage,false);
    inert(oldApp,true);inert(oldTop,true);
    status.textContent='Native GPUI · input requires native confirmation';
    fit();
  };
  const disposeCurrent=()=>{
    const oldViewport=viewport,oldChannel=channel;
    viewport=null;channel=null;grant=null;
    try{oldViewport?.dispose();}catch{}
    try{oldChannel?.close();}catch{}
    hide();
  };
  const statusFromNative=value=>{
    if(value==='GPUI_DEVICE_GRANT_REVOKED')blockedGrant=grant;
    if(value==='GPUI_FRAME_STALE'||value==='GPUI_DEVICE_GRANT_REVOKED'||
       value==='GPUI_PHONE_FRAME_INVALID_OR_OFFLINE'||
       value==='GPUI_PHONE_TRANSPORT_UNAVAILABLE'||value==='GPUI_PAIRING_INVALID')
      hide();
  };
  const statusFromCanvas=value=>{
    if(value==='painted')show();
    else if(value==='disconnected')hide();
    else if(value==='input-rejected')
      status.textContent='Native GPUI refused this input · nothing was retried';
    else if(value==='input-submitted-unverified')
      status.textContent='Input sent to GPUI · control outcome unverified';
  };
  const refresh=()=>{
    if(closed)return;
    const current=keyOf(transport);
    if(!current){disposeCurrent();blockedGrant=null;return;}
    if(blockedGrant && blockedGrant!==current)blockedGrant=null;
    if(blockedGrant===current)return;
    if(viewport&&channel){
      if(grant===current&&channel.status()?.active){
        if(visible&&!viewport.isConnected())hide();
        return;
      }
      disposeCurrent();
    }
    if(now()-lastAttempt<2500)return;
    lastAttempt=now();
    try{
      const created=makeChannel({transport,onStatus:statusFromNative});
      const mounted=mountViewport({canvas,channel:created,textTarget:text,
        onStatus:statusFromCanvas});
      channel=created;viewport=mounted;grant=current;
    }catch{
      disposeCurrent(); // missing Direct route or grant must not impact old PWA
    }
  };
  const onResize=()=>fit();
  win.addEventListener?.('resize',onResize);
  const interval=every(refresh,1000);
  refresh();
  const close=()=>{
    if(closed)return;
    closed=true;
    stopEvery(interval);
    win.removeEventListener?.('resize',onResize);
    disposeCurrent();
    keyboard.removeEventListener('click',focusText);
    stage.remove?.();
  };
  return Object.freeze({refresh,close,state:()=>Object.freeze({
    mode:visible?'native-gpui':'legacy',
    active:Boolean(!closed&&channel?.status()?.active),
    nativeFrameVisible:visible,
    grantPresent:Boolean(keyOf(transport))
  })});
}
// The actual page invokes this ONLY for the incumbent Direct phone origin.
// Cloud/offline shells remain intact; no paired read or effect is attempted.
if(typeof window!=='undefined'&&typeof document!=='undefined'&&sharedTransport?.direct){
  mountGpuiPhonePage();
}
