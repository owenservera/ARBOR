import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {createDirectGpuiPhoneChannel} from '../gpui-phone-channel.mjs';
const GRANT='a'.repeat(32),SESSION='b'.repeat(32),VIEW='c'.repeat(32);
function crc32(data){let c=0xffffffff;for(const b of data){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,body=Buffer.alloc(0)){const b=Buffer.from(type),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(body.length);c.writeUInt32BE(crc32(Buffer.concat([b,body])));return Buffer.concat([l,b,body,c]);}
const header=Buffer.alloc(13);header.writeUInt32BE(360,0);header.writeUInt32BE(800,4);header[8]=8;header[9]=6;
const PNG=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.alloc(800*(1+360*4)))),chunk('IEND')]);
function response({status=200,png=PNG,rev=1,session=VIEW,corrupt=false}={}){
  const headers=new Map([['content-type','image/png'],['x-vivim-gpui-session',session],
    ['x-vivim-gpui-revision',String(rev)],['x-vivim-gpui-width','360'],['x-vivim-gpui-height','800'],
    ['content-length',String(png.length)]]);
  return {status,ok:status>=200&&status<300,headers:{get:k=>headers.get(k)||null},
    arrayBuffer:async()=>{const copy=Uint8Array.from(png);return copy.buffer;},
    json:async()=>({state:corrupt?'refused':'submitted_to_native_unverified'})};
}
function setup(){
  const calls=[],schedules=[],statuses=[],frames=[],disconnects=[];
  let paired=true,now=100000,reply=()=>response(),post=()=>({status:202,ok:true,json:async()=>({state:'submitted_to_native_unverified'})});
  const transport={direct:true,deviceHeaders:()=>paired?{
    'x-vivim-grant-id':GRANT,'x-vivim-device-session':SESSION}:null};
  const channel=createDirectGpuiPhoneChannel({
    transport,fetchImpl:async(url,options)=>{
      calls.push({url,options});
      return options.method==='GET'?reply(url,options):post(url,options);
    },
    onStatus:x=>statuses.push(x),now:()=>now,
    schedule:(fn,delay)=>{schedules.push({fn,delay});return schedules.length;},
    unschedule:()=>{},intervalMs:250
  });
  const subscribe=()=>channel.subscribeFrames(
    frame=>{frames.push(frame);}, reason=>disconnects.push(reason));
  const makePointer=(sequence=1)=>({kind:'vivim.gpui.pointer/1',phase:'down',
    session:VIEW,revision:1,sequence,x:100,y:200});
  return {channel,transport,calls,statuses,frames,disconnects,schedules,subscribe,makePointer,
    setPaired:x=>{paired=x;},advance:n=>{now+=n;},
    setGet:fn=>{reply=fn;},setPost:fn=>{post=fn;}};
}
test('cannot mount from Cloud/harness or without an existing device grant',()=>{
  assert.throws(()=>createDirectGpuiPhoneChannel({transport:{direct:false,deviceHeaders:()=>null}}),
    /GPUI_PHONE_CHANNEL_DEPENDENCIES_INVALID/);
  const f=setup();f.setPaired(false);
  assert.throws(()=>f.subscribe(),/GPUI_DEVICE_GRANT_REQUIRED/);
  f.channel.close();
});
test('fetches native Host PNG from existing Direct path, validates bytes, preserves revision',async()=>{
  const f=setup();f.subscribe();
  assert.equal((await f.channel.pollOnce()).state,'delivered');
  assert.equal(f.frames.length,1);
  assert.equal(f.frames[0].kind,'vivim.gpui.pixels/1');
  assert.deepEqual(Buffer.from(f.frames[0].png),PNG);
  assert.equal(f.channel.authorizeFrame({session:VIEW,revision:1,width:360,height:800}),true);
  assert.equal(f.calls[0].url,'/mobile/api/gpui/frame');
  assert.equal(f.calls[0].options.headers['x-vivim-grant-id'],GRANT);
  assert.equal(f.calls[0].options.cache,'no-store');
  f.setGet(()=>response({status:204}));
  assert.equal((await f.channel.pollOnce()).state,'unchanged');
  assert.equal(f.calls[1].url,'/mobile/api/gpui/frame?session='+VIEW+'&after=1');
  f.channel.close();
});
test('submits a real user pointer to existing Direct input path once and never invents approval',async()=>{
  const f=setup();f.subscribe();await f.channel.pollOnce();
  assert.equal((await f.channel.submitPointer(f.makePointer())).state,'submitted_to_native_unverified');
  assert.equal(f.calls[1].url,'/mobile/api/gpui/input');
  assert.equal(f.calls[1].options.method,'POST');
  assert.equal(f.calls[1].options.headers['x-vivim-gpui-input'],'1');
  assert.deepEqual(JSON.parse(f.calls[1].options.body),f.makePointer());
  assert.equal(f.calls.length,2);
  f.channel.close();
});
test('UTF-16 IME packet goes through the same Direct endpoint as touch',async()=>{
  const f=setup();f.subscribe();await f.channel.pollOnce();
  const packet={kind:'vivim.gpui.text/1',phase:'ime-commit',session:VIEW,
    revision:1,sequence:2,text:'日本語🔹'};
  assert.equal((await f.channel.submitText(packet)).state,'submitted_to_native_unverified');
  assert.deepEqual(JSON.parse(f.calls[1].options.body),packet);
  f.channel.close();
});
test('cannot transmit a phone action before a verified native GPUI pixel frame',async()=>{
  const f=setup();f.subscribe();
  assert.equal((await f.channel.submitPointer(f.makePointer())).state,'refused');
  assert.equal(f.calls.length,0);
  f.channel.close();
});
test('does not accept a second UI or stale client-claimed frame identity',async()=>{
  const f=setup();f.subscribe();await f.channel.pollOnce();
  assert.equal((await f.channel.submitPointer({...f.makePointer(),session:'d'.repeat(32)})).state,'refused');
  assert.equal((await f.channel.submitPointer({...f.makePointer(),revision:2})).state,'refused');
  assert.equal(f.calls.length,1);
  f.channel.close();
});
test('an invalid or corrupted frame cannot become phone render authority',async()=>{
  const f=setup();f.subscribe();
  f.setGet(()=>response({png:Buffer.from('not PNG')}));
  assert.equal((await f.channel.pollOnce()).state,'refused');
  assert.equal(f.frames.length,0);
  assert.equal(f.channel.authorizeFrame({session:VIEW,revision:1,width:360,height:800}),false);
  f.channel.close();
});
test('unauthorized response clears frame state and notifies canvas disconnection',async()=>{
  const f=setup();f.subscribe();await f.channel.pollOnce();
  f.setGet(()=>response({status:403}));
  assert.equal((await f.channel.pollOnce()).reason,'GPUI_DEVICE_GRANT_REVOKED');
  assert.equal(f.channel.status().source,null);
  assert.deepEqual(f.disconnects,['GPUI_DEVICE_GRANT_REVOKED']);
  f.channel.close();
});
test('a native-source outage expires old pixels instead of displaying stale GPUI UI',async()=>{
  const f=setup();f.subscribe();await f.channel.pollOnce();
  f.advance(5001);
  assert.equal((await f.channel.pollOnce()).reason,'GPUI_FRAME_STALE');
  assert.equal(f.channel.status().source,null);
  assert.deepEqual(f.disconnects,['GPUI_FRAME_STALE']);
  assert.equal((await f.channel.submitPointer(f.makePointer())).state,'refused');
  f.channel.close();
});
test('network uncertainty after a pointer POST is never automatically retried',async()=>{
  const f=setup();f.subscribe();await f.channel.pollOnce();
  f.setPost(()=>{throw new Error('offline after potential send');});
  assert.equal((await f.channel.submitPointer(f.makePointer())).state,'native_delivery_uncertain');
  assert.equal(f.calls.filter(x=>x.options.method==='POST').length,1);
  f.channel.close();
});
test('device session rotation or revocation disconnects before another source poll',async()=>{
  const f=setup();f.subscribe();await f.channel.pollOnce();
  f.transport.deviceHeaders=()=>({'x-vivim-grant-id':'d'.repeat(32),
    'x-vivim-device-session':SESSION});
  assert.equal((await f.channel.pollOnce()).reason,'GPUI_PAIRING_INVALID');
  assert.equal(f.channel.status().source,null);
  f.channel.close();
});
test('subscription cleanup removes poll schedule and all cached sensitive state',()=>{
  const f=setup();const dispose=f.subscribe();
  assert.equal(f.schedules.length,1);
  assert.equal(f.channel.status().active,true);
  dispose();dispose();
  assert.equal(f.channel.status().active,false);
  assert.equal(f.channel.status().source,null);
  f.channel.close();
  assert.equal(f.channel.status().authenticated,false);
});
test('multiple simultaneous poll attempts cannot double-download same GPUI revision',async()=>{
  const f=setup();f.subscribe();let resolve;
  f.setGet(()=>new Promise(r=>{resolve=r;}));
  const a=f.channel.pollOnce();
  assert.equal((await f.channel.pollOnce()).reason,'GPUI_PHONE_POLL_INACTIVE');
  resolve(response());
  assert.equal((await a).state,'delivered');
  assert.equal(f.calls.length,1);
  f.channel.close();
});
test('invalid frame or transport failures do not spin an unbounded poll loop',async()=>{
  const f=setup();f.subscribe();f.setGet(()=>response({status:500}));
  for(let i=0;i<3;i++)await f.channel.pollOnce();
  assert.equal(f.channel.status().active,false);
  assert.equal(f.disconnects.length,1);
  f.channel.close();
});

test('unchanged live 204 renews phone freshness without changing GPUI revision',async()=>{
  const f=setup();f.subscribe();await f.channel.pollOnce();
  f.advance(4500);
  f.setGet(()=>response({status:204}));
  assert.equal((await f.channel.pollOnce()).state,'unchanged');
  f.advance(4500);
  assert.equal(f.channel.authorizeFrame({
    session:VIEW,revision:1,width:360,height:800
  }),true);
  assert.equal((await f.channel.pollOnce()).state,'unchanged');
  assert.equal(f.frames.length,1,'native frame revision must be stable');
  f.channel.close();
});
test('native expired 410 immediately disconnects instead of keeping stale private pixels',async()=>{
  const f=setup();f.subscribe();await f.channel.pollOnce();
  f.setGet(()=>response({status:410}));
  assert.equal((await f.channel.pollOnce()).reason,'GPUI_NATIVE_FRAME_GONE');
  assert.equal(f.channel.status().source,null);
  assert.equal(f.channel.status().active,false);
  assert.deepEqual(f.disconnects,['GPUI_NATIVE_FRAME_GONE']);
  assert.equal((await f.channel.submitPointer(f.makePointer())).state,'refused');
  f.channel.close();
});
