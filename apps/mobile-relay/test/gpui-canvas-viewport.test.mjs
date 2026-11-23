import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {mountGpuiCanvasViewport} from '../gpui-canvas-viewport.mjs';

// Real, complete, bounded 360×800 PNG; no screenshots, phone, private corpus
// or browser session are used by these source-only transport mock tests.
function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
function chunk(type,body=Buffer.alloc(0)){
  const label=Buffer.from(type,'ascii'),len=Buffer.alloc(4),crc=Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  crc.writeUInt32BE(crc32(Buffer.concat([label,body])));
  return Buffer.concat([len,label,body,crc]);
}
const ihdr=Buffer.alloc(13);
ihdr.writeUInt32BE(360,0);ihdr.writeUInt32BE(800,4);
ihdr[8]=8;ihdr[9]=6;
const PNG=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.alloc(800*(1+360*4)))),chunk('IEND')]);
const frame=(revision=1,session='a'.repeat(32))=>({
  kind:'vivim.gpui.pixels/1',session,revision,width:360,height:800,png:PNG
});
function setup(){
  const events=new Map(),drawn=[],cleared=[],sent=[],status=[],decoded=[];
  const canvas={
    width:0,height:0,
    getContext:()=>({
      drawImage:(bitmap,...args)=>{drawn.push([bitmap,...args]);},
      clearRect:(...args)=>cleared.push(args)
    }),
    addEventListener:(type,fn)=>events.set(type,fn),
    removeEventListener:(type,fn)=>{if(events.get(type)===fn)events.delete(type);},
    getBoundingClientRect:()=>({left:10,top:20,width:180,height:400})
  };
  let subscribed=null,unsubscribed=0,paired=true,approved=true,decoder=null;
  const channel={
    isAuthenticated:()=>paired,
    authorizeFrame:meta=>approved && meta?.session==='a'.repeat(32),
    subscribeFrames:cb=>{subscribed=cb;return ()=>{subscribed=null;unsubscribed++;};},
    submitPointer:packet=>{sent.push(packet);return Promise.resolve({admitted:false});}
  };
  const decodePng=async bytes=>{
    if(decoder)return decoder(bytes);
    const img={width:360,height:800,close(){decoded.push('closed');}};
    return img;
  };
  const mount=()=>mountGpuiCanvasViewport({
    canvas,channel,decodePng,onStatus:s=>status.push(s)
  });
  const pointer=(x=100,y=220,extra={})=>{
    const e={clientX:x,clientY:y,isPrimary:true,button:0,
      preventDefault(){e.prevented=true;},...extra};
    events.get('pointerdown')?.(e);return e;
  };
  return {canvas,channel,mount,pointer,events,drawn,cleared,sent,status,decoded,
    setPaired:v=>{paired=v;},setApproved:v=>{approved=v;},
    setDecoder:fn=>{decoder=fn;},
    emit:f=>subscribed?.(f),get unsubscribed(){return unsubscribed;}};
}

test('requires an injected authorized Host channel, not an invented client-side grant',()=>{
  const f=setup();
  assert.throws(()=>mountGpuiCanvasViewport({canvas:f.canvas}),/GPUI_VIEWPORT_DEPENDENCY_INVALID/);
  assert.throws(()=>mountGpuiCanvasViewport({canvas:f.canvas,channel:{}}),/GPUI_VIEWPORT_DEPENDENCY_INVALID/);
});
test('paints the real PNG bitmap on canvas only after Host channel authorizes its GPUI session',async()=>{
  const f=setup(),view=f.mount();
  assert.equal(view.isConnected(),false,'no proven frame session yet');
  const receipt=await view.receiveFrame(frame());
  assert.deepEqual(receipt,{state:'painted',session:'a'.repeat(32),revision:1});
  assert.equal(f.drawn.length,1);
  assert.deepEqual(f.drawn[0].slice(1),[0,0,360,800]);
  assert.equal(f.canvas.width,360);assert.equal(f.canvas.height,800);
  assert.equal(view.getFrame().revision,1);
  assert.equal(view.isConnected(),true);
  assert.deepEqual(f.decoded,['closed']);
  view.dispose();
});
test('phone pointer is translated back into renderer pixel coordinates, never a Host effect',async()=>{
  const f=setup(),view=f.mount();
  await view.receiveFrame(frame());
  const pointer=f.pointer();
  assert.equal(pointer.prevented,true);
  assert.deepEqual(f.sent,[{kind:'vivim.gpui.pointer/1',phase:'down',
    session:'a'.repeat(32),revision:1,sequence:1,x:180,y:400}]);
  assert.equal(Object.hasOwn(f.sent[0],'approved'),false);
  assert.equal(Object.hasOwn(f.sent[0],'command'),false);
  assert.equal(Object.hasOwn(f.sent[0],'controlId'),false);
  view.dispose();
});
test('unauthorized GPUI session cannot paint and scrubs existing private pixels',async()=>{
  const f=setup(),view=f.mount();
  await view.receiveFrame(frame());
  f.setApproved(false);
  assert.equal((await view.receiveFrame(frame(2))).reason,'GPUI_PAIRING_OR_SESSION_UNVERIFIED');
  assert.equal(view.getFrame(),null);
  assert.ok(f.cleared.length>0);
  f.pointer();assert.equal(f.sent.length,0);
  view.dispose();
});
test('lost phone pairing refuses new frame and pointer, without a fake offline UI',async()=>{
  const f=setup(),view=f.mount();
  await view.receiveFrame(frame());
  f.setPaired(false);
  f.pointer();
  assert.equal(f.sent.length,0);
  assert.equal(view.getFrame(),null);
  assert.ok(f.status.includes('disconnected'));
  assert.equal(view.reconnect(),false);
  f.setPaired(true);
  assert.equal(view.reconnect(),true);
  assert.equal((await view.receiveFrame(frame(3))).state,'painted');
  view.dispose();
});
test('stale rendered frame is rejected rather than repainting or rewinding touch revision',async()=>{
  const f=setup(),view=f.mount();
  await view.receiveFrame(frame(2));
  assert.equal((await view.receiveFrame(frame(1))).reason,'GPUI_FRAME_INVALID');
  assert.equal((await view.receiveFrame(frame(2))).reason,'GPUI_FRAME_INVALID');
  assert.equal(f.drawn.length,1);
  f.pointer();
  assert.equal(f.sent[0].revision,2);
  view.dispose();
});
test('asynchronous earlier frame decode is superseded without old pixels appearing',async()=>{
  const f=setup(),pending=[],closed=[];
  f.setDecoder(()=>new Promise(resolve=>pending.push(resolve)));
  const view=f.mount();
  const older=view.receiveFrame(frame(1)),newer=view.receiveFrame(frame(2));
  assert.equal(pending.length,2);
  pending[1]({width:360,height:800,close(){closed.push(2);}});
  assert.equal((await newer).state,'painted');
  pending[0]({width:360,height:800,close(){closed.push(1);}});
  assert.equal((await older).state,'discarded');
  assert.equal(view.getFrame().revision,2);
  assert.equal(f.drawn.length,1);
  assert.deepEqual(closed,[2,1]);
  view.dispose();
});
test('pairing revoked mid-decode scrubs previous frame before processing stale bitmap',async()=>{
  const f=setup(),pending=[];
  let later=false;
  f.setDecoder(()=>later?new Promise(resolve=>pending.push(resolve)):Promise.resolve({
    width:360,height:800,close(){}
  }));
  const view=f.mount();
  await view.receiveFrame(frame());
  later=true;
  const pendingFrame=view.receiveFrame(frame(2));
  f.setPaired(false);
  pending[0]({width:360,height:800,close(){}});
  assert.equal((await pendingFrame).reason,'GPUI_PAIRING_OR_SESSION_UNVERIFIED');
  assert.equal(view.getFrame(),null);
  assert.ok(f.cleared.length>0);
  view.dispose();
});
test('bad PNG or decoder error never paints a substitute interface',async()=>{
  const f=setup(),view=f.mount();
  assert.equal((await view.receiveFrame({...frame(),png:new Uint8Array(24)})).state,'refused');
  f.setDecoder(async()=>{throw new Error('image decode broke');});
  assert.equal((await view.receiveFrame(frame())).reason,'GPUI_BITMAP_DECODE_OR_DRAW_FAILED');
  assert.equal(f.drawn.length,0);
  view.dispose();
});
test('mismatched decoded bitmap geometry never becomes touch authority',async()=>{
  const f=setup(),view=f.mount();
  f.setDecoder(async()=>({width:359,height:800,close(){}}));
  assert.equal((await view.receiveFrame(frame())).reason,'GPUI_DECODE_DIMENSIONS_MISMATCH');
  assert.equal(view.getFrame(),null);
  f.pointer();
  assert.equal(f.sent.length,0);
  view.dispose();
});
test('nonprimary, mouse secondary and outside pixels never generate packets',async()=>{
  const f=setup(),view=f.mount();
  await view.receiveFrame(frame());
  f.pointer(100,220,{isPrimary:false});
  f.pointer(100,220,{button:1});
  f.pointer(190,220);
  assert.equal(f.sent.length,0);
  view.dispose();
});
test('disconnect/dispose removes input, pending frames and private visible pixels',async()=>{
  const f=setup(),view=f.mount();
  await view.receiveFrame(frame());
  view.disconnect();
  f.pointer();
  assert.equal(f.sent.length,0);
  assert.equal(view.getFrame(),null);
  assert.equal((await view.receiveFrame(frame(2))).reason,'GPUI_VIEWPORT_DISCONNECTED');
  view.dispose();view.dispose();
  assert.equal(f.events.has('pointerdown'),false);
  assert.equal(f.unsubscribed,1);
  assert.equal((await view.receiveFrame(frame(3))).state,'refused');
});

test('asynchronous PNG decoder owns its bytes when Node Buffer pool is reused',async()=>{
  const f=setup();
  const source=Buffer.from(PNG);
  let received,resolveDecode;
  f.setDecoder(bytes=>{
    received=bytes;
    return new Promise(resolve=>{resolveDecode=resolve;});
  });
  const view=f.mount();
  const pending=view.receiveFrame({...frame(),png:source});
  assert.ok(received instanceof Uint8Array);
  assert.notEqual(received.buffer,source.buffer,
    'an owned copy must not share a Buffer backing array');
  source.fill(0); // source transport pool reused before browser decode finishes
  assert.equal(received[0],137,'valid PNG signature survives producer mutation');
  resolveDecode({width:360,height:800,close(){}});
  assert.equal((await pending).state,'painted');
  view.dispose();
});
