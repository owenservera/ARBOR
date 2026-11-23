import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {createGpuiHostFrameRelay} from '../remote/gpui-frame-relay.mjs';

function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
function chunk(type,body=Buffer.alloc(0)){
  const label=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  crc.writeUInt32BE(crc32(Buffer.concat([label,body])));
  return Buffer.concat([len,label,body,crc]);
}
const head=Buffer.alloc(13);head.writeUInt32BE(360,0);head.writeUInt32BE(800,4);head[8]=8;head[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),
  chunk('IDAT',deflateSync(Buffer.alloc(800*(1+360*4)))),chunk('IEND')]);
const SESSION='a'.repeat(32),DEVICE='b'.repeat(32);
const frame=(revision=1,session=SESSION)=>({
  kind:'vivim.gpui.pixels/1',session,revision,width:360,height:800,png
});
const owner={isOwner:true},phone={deviceId:DEVICE,pairedGrant:'valid'};
const pointer=(sequence=1,revision=1)=>({
  kind:'vivim.gpui.pointer/1',phase:'down',session:SESSION,revision,
  sequence,x:180,y:400
});
function fixture(){
  const published=[],forwarded=[],disconnected=[];
  let native=true,paired=true,forward=async(_context,packet)=>{forwarded.push(packet);};
  const relay=createGpuiHostFrameRelay({
    authorizeNative:(context,meta)=>native&&context?.isOwner===true&&meta?.session===SESSION,
    authorizePhone:(context,meta)=>paired&&context?.deviceId===DEVICE&&
      context?.pairedGrant==='valid'&&(!meta||meta.session===SESSION),
    forwardToGpui:(context,packet)=>forward(context,packet)
  });
  const listen=(ctx=phone,onFrame=packet=>published.push(packet),onDisconnect=()=>disconnected.push(true))=>
    relay.subscribe(ctx,onFrame,onDisconnect);
  return {relay,published,forwarded,disconnected,listen,
    setNative:value=>{native=value;},setPaired:value=>{paired=value;},
    setForward:fn=>{forward=fn;}};
}

test('cannot create a parallel Host relay without external admission/forward callbacks',()=>{
  assert.throws(()=>createGpuiHostFrameRelay(),/GPUI_RELAY_DEPENDENCIES_INVALID/);
  assert.throws(()=>createGpuiHostFrameRelay({
    authorizeNative:()=>true,authorizePhone:()=>true,forwardToGpui:()=>{},maxSubscribers:100
  }),/GPUI_RELAY_DEPENDENCIES_INVALID/);
});
test('unpaired subscriber is refused even with a copied deviceId',()=>{
  const f=fixture();
  assert.throws(()=>f.listen({deviceId:DEVICE}),/GPUI_PHONE_NOT_ADMITTED/);
  assert.throws(()=>f.listen({...phone,pairedGrant:'forged'}),/GPUI_PHONE_NOT_ADMITTED/);
  assert.equal(f.relay.status().subscribers,0);
  f.relay.close();
});
test('one authorized native frame reaches only authorized paired subscribers',()=>{
  const f=fixture();f.listen();
  assert.equal(f.relay.publish(owner,frame()).state,'published');
  assert.equal(f.published.length,1);
  assert.equal(f.published[0].revision,1);
  assert.deepEqual(f.published[0].png,Buffer.from(png));
  assert.equal(f.relay.status().subscribers,1);
  assert.equal(f.relay.status().available,true);
  assert.equal(JSON.stringify(f.relay.status()).includes('png'),false);
  f.relay.close();
});
test('subscriber mutation does not corrupt owner pixels or another phone subscriber',()=>{
  const f=fixture();f.listen();
  f.relay.publish(owner,frame());
  f.published[0].png[0]=0;
  const got=[];f.listen(phone,p=>got.push(p));
  assert.equal(got[0].png[0],137);
  assert.equal(f.relay.status().revision,1);
  f.relay.close();
});
test('stale, duplicate and corrupted PNG frames never publish',()=>{
  const f=fixture();f.listen();f.relay.publish(owner,frame(2));
  assert.equal(f.relay.publish(owner,frame(2)).state,'refused');
  assert.equal(f.relay.publish(owner,frame(1)).state,'refused');
  assert.equal(f.relay.publish(owner,{...frame(3),png:new Uint8Array(24)}).state,'refused');
  assert.equal(f.published.length,1);
  f.relay.close();
});
test('source owner loss scrubs pixels, drops subscribers and reports disconnect',()=>{
  const f=fixture();f.listen();f.relay.publish(owner,frame());
  f.setNative(false);
  assert.equal(f.relay.publish(owner,frame(2)).reason,'NATIVE_GPUI_OWNER_NOT_ADMITTED');
  assert.equal(f.relay.status().available,false);
  assert.equal(f.relay.status().subscribers,0);
  assert.equal(f.disconnected.length,1);
  f.relay.close();
});
test('phone grant revocation stops future frame fanout and drops subscription',()=>{
  const f=fixture();f.listen();f.relay.publish(owner,frame());
  f.setPaired(false);
  f.relay.publish(owner,frame(2));
  assert.equal(f.published.length,1);
  assert.equal(f.disconnected.length,1);
  assert.equal(f.relay.status().subscribers,0);
  f.relay.close();
});
test('late joining paired phone receives at most the latest frame',()=>{
  const f=fixture();
  f.relay.publish(owner,frame(1));
  f.relay.publish(owner,frame(2));
  f.listen();
  assert.deepEqual(f.published.map(p=>p.revision),[2]);
  f.relay.close();
});
test('slow subscriber is backpressured and catches latest revision, not all intermediate ones',async()=>{
  const f=fixture(),got=[],pending=[];
  f.listen(phone,p=>{got.push(p.revision);return new Promise(resolve=>pending.push(resolve));});
  f.relay.publish(owner,frame(1));f.relay.publish(owner,frame(2));f.relay.publish(owner,frame(3));
  assert.deepEqual(got,[1]);
  pending.shift()();
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(got,[1,3]);
  f.relay.close();
  pending.shift()?.();
});
test('a real paired pointer is only forwarded to GPUI, never marked as an executed effect',async()=>{
  const f=fixture();f.relay.publish(owner,frame());
  const result=await f.relay.receivePointer(phone,pointer());
  assert.equal(result.state,'submitted_to_native_unverified');
  assert.deepEqual(f.forwarded,[pointer()]);
  assert.equal(Object.hasOwn(result,'approved'),false);
  assert.equal(Object.hasOwn(result,'controlId'),false);
  f.relay.close();
});
test('duplicate pointer sequence cannot replay after a phone subscription reconnect',async()=>{
  const f=fixture();f.relay.publish(owner,frame());
  const un=f.listen();await f.relay.receivePointer(phone,pointer(1));
  un();f.listen();
  assert.equal((await f.relay.receivePointer(phone,pointer(1))).reason,'GPUI_INPUT_REPLAY');
  assert.equal((await f.relay.receivePointer(phone,pointer(2))).state,'submitted_to_native_unverified');
  assert.equal(f.forwarded.length,2);
  f.relay.close();
});
test('wrong session/revision, bounds, forged pairing and phase are all refused',async()=>{
  const f=fixture();f.relay.publish(owner,frame());
  const wrong=[{...pointer(),session:'f'.repeat(32)},{...pointer(),revision:2},
    {...pointer(),x:360},{...pointer(),y:-1},{...pointer(),phase:'up'},
    {...pointer(),sequence:-1}];
  for(const packet of wrong)assert.equal((await f.relay.receivePointer(phone,packet)).state,'refused');
  assert.equal((await f.relay.receivePointer({deviceId:DEVICE},pointer())).state,'refused');
  assert.equal(f.forwarded.length,0);
  f.relay.close();
});
test('downstream native uncertainty consumes sequence and must not auto-retry',async()=>{
  const f=fixture();f.relay.publish(owner,frame());
  f.setForward(async()=>{throw new Error('native timeout');});
  assert.equal((await f.relay.receivePointer(phone,pointer(5))).state,'native_delivery_uncertain');
  assert.equal((await f.relay.receivePointer(phone,pointer(5))).reason,'GPUI_INPUT_REPLAY');
  f.relay.close();
});
test('invalid native owner is refused without retaining any source pixels',()=>{
  const f=fixture();f.listen();
  assert.equal(f.relay.publish({isOwner:false},frame()).reason,'NATIVE_GPUI_OWNER_NOT_ADMITTED');
  assert.equal(f.relay.status().available,false);
  assert.equal(f.published.length,0);
  f.relay.close();
});
test('close is idempotent and never leaves a frame or live subscription',async()=>{
  const f=fixture();f.listen();f.relay.publish(owner,frame());
  f.relay.close();f.relay.close();
  assert.equal(f.relay.status().available,false);
  assert.equal(f.relay.status().subscribers,0);
  assert.equal(f.disconnected.length,1);
  assert.equal(f.relay.publish(owner,frame(2)).state,'refused');
  assert.equal((await f.relay.receivePointer(phone,pointer())).state,'refused');
});
