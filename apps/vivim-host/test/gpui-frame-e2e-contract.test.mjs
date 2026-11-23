import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {createGpuiHostFrameRelay} from '../remote/gpui-frame-relay.mjs';
import {mountGpuiCanvasViewport} from '../../mobile-relay/gpui-canvas-viewport.mjs';

// End-to-end *source contract* only: injectable existing Host transport,
// simulated GPUI frame and fake canvas. No HTTP/WebSocket, live effects, real
// native paint, physical phone or credential is invented in these tests.
function crc32(bytes){
  let crc=0xffffffff;for(const byte of bytes){
    crc^=byte;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }return(crc^0xffffffff)>>>0;
}
function chunk(label,payload=Buffer.alloc(0)){
  const b=Buffer.from(label),l=Buffer.alloc(4),c=Buffer.alloc(4);
  l.writeUInt32BE(payload.length);c.writeUInt32BE(crc32(Buffer.concat([b,payload])));
  return Buffer.concat([l,b,payload,c]);
}
const SESSION='a'.repeat(32),DEVICE='b'.repeat(32);
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(360,0);ihdr.writeUInt32BE(800,4);
ihdr[8]=8;ihdr[9]=6;
const PNG=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),
  chunk('IDAT',deflateSync(Buffer.alloc(800*(1+360*4)))),chunk('IEND')]);
const frame=revision=>({kind:'vivim.gpui.pixels/1',session:SESSION,
  revision,width:360,height:800,png:Buffer.from(PNG)});
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function build(){
  const owner={role:'native'},phone={deviceId:DEVICE,grant:'valid'};
  let paired=true,disconnected=0;
  const forwarded=[],drawn=[],cleared=[],messages=[];
  const listeners=new Map();
  const canvas={width:0,height:0,
    getContext:()=>({drawImage:(...args)=>drawn.push(args),
      clearRect:(...args)=>cleared.push(args)}),
    addEventListener:(k,fn)=>listeners.set(k,fn),
    removeEventListener:k=>listeners.delete(k),
    getBoundingClientRect:()=>({left:0,top:0,width:180,height:400})
  };
  const relay=createGpuiHostFrameRelay({
    authorizeNative:(ctx,meta)=>ctx?.role==='native'&&meta?.session===SESSION,
    authorizePhone:(ctx,meta)=>paired&&ctx?.deviceId===DEVICE&&ctx?.grant==='valid'&&
      (!meta||meta.session===SESSION),
    forwardToGpui:async(_ctx,touch)=>{
      // Substitute only the deterministic owning native InputFence contract.
      const control=(touch.x>=12&&touch.x<112&&touch.y>=24&&touch.y<72)?42:null;
      forwarded.push({touch,control});
      return control===null?{state:'no-control'}:{state:'inert-control',controlId:control};
    }
  });
  let view;
  const channel={
    isAuthenticated:()=>paired,
    authorizeFrame:meta=>paired&&Boolean(meta)&&relay.status().available&&
      relay.status().session===meta.session&&relay.status().revision>=meta.revision,
    subscribeFrames:callback=>relay.subscribe(phone,callback,()=>{disconnected++;view?.disconnect();}),
    submitPointer:packet=>relay.receivePointer(phone,packet)
  };
  const decodePng=async()=>({width:360,height:800,close(){}});
  const mount=()=>{view=mountGpuiCanvasViewport({canvas,channel,decodePng,
    onStatus:s=>messages.push(s)});return view;};
  const tap=(clientX=20,clientY=20)=>{
    const event={clientX,clientY,isPrimary:true,button:0,preventDefault(){}};
    listeners.get('pointerdown')?.(event);
  };
  return {relay,mount,tap,owner,phone,canvas,drawn,cleared,forwarded,messages,
    setPaired:x=>{paired=x;},get disconnected(){return disconnected;}};
}
test('native frame -> existing Host admission -> thin PWA canvas -> native input contract',async()=>{
  const s=build(),view=s.mount();
  assert.equal(s.relay.publish(s.owner,frame(1)).state,'published');
  await tick();
  assert.equal(s.drawn.length,1);
  assert.equal(s.canvas.width,360);assert.equal(s.canvas.height,800);
  assert.equal(view.getFrame().session,SESSION);
  s.tap(20,20);await tick();
  assert.equal(s.forwarded.length,1);
  assert.equal(s.forwarded[0].control,42);
  assert.equal(s.forwarded[0].touch.x,40);
  assert.equal(s.forwarded[0].touch.y,40);
  assert.equal(s.forwarded[0].touch.revision,1);
  assert.equal(Object.hasOwn(s.forwarded[0].touch,'approved'),false);
  view.dispose();s.relay.close();
});
test('loss of existing phone grant removes transport, scrubs canvas and forbids further taps',async()=>{
  const s=build(),view=s.mount();
  s.relay.publish(s.owner,frame(1));await tick();
  s.setPaired(false);
  s.relay.publish(s.owner,frame(2));await tick();
  assert.equal(s.disconnected,1);
  assert.equal(view.getFrame(),null);
  assert.ok(s.cleared.length>0);
  s.tap(20,20);await tick();
  assert.equal(s.forwarded.length,0);
  view.dispose();s.relay.close();
});
test('reconnected client cannot replay previously submitted pointer sequence',async()=>{
  const s=build(),first=s.mount();
  s.relay.publish(s.owner,frame(1));await tick();
  s.tap(20,20);await tick();
  assert.equal(s.forwarded.length,1);
  first.dispose();
  // Synthetic new canvas listener starts at sequence=1, while Host retains
  // the paired device sequence to refuse replay across reconnect.
  const second=s.mount();
  s.tap(20,20);await tick();
  assert.equal(s.forwarded.length,1);
  assert.equal(second.getFrame()?.revision,1);
  second.dispose();s.relay.close();
});
