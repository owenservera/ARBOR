import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {createGpuiDirectChannel} from '../remote/gpui-direct-channel.mjs';

const TOKEN='owner-private-capability-'.padEnd(48,'x');
const GRANT='a'.repeat(32),DEVICE='b'.repeat(32);
const DEVICE_SESSION='c'.repeat(32),GPUI_SESSION='d'.repeat(32);
const ORIGIN='https://pc.tailnet.ts.net';
const phoneRead={'x-vivim-grant-id':GRANT,'x-vivim-device-session':DEVICE_SESSION};
const owner={'authorization':'Bearer '+TOKEN,'x-vivim-gpui-native':'1'};
function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)
    crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
function chunk(name,data=Buffer.alloc(0)){
  const type=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);
  length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));
  return Buffer.concat([length,type,data,crc]);
}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(360,0);ihdr.writeUInt32BE(800,4);
ihdr[8]=8;ihdr[9]=6;
const PNG=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.alloc(800*(1+360*4)))),
  chunk('IEND')]);
const frameHeaders=(revision=1)=>({
  ...owner,'content-type':'image/png',
  'x-vivim-gpui-session':GPUI_SESSION,'x-vivim-gpui-revision':String(revision),
  'x-vivim-gpui-width':'360','x-vivim-gpui-height':'800'
});
const pointer=(sequence=1,revision=1)=>({
  kind:'vivim.gpui.pointer/1',phase:'down',session:GPUI_SESSION,
  revision,sequence,x:20,y:40
});
const text=(sequence=2,revision=1)=>({
  kind:'vivim.gpui.text/1',phase:'ime-commit',session:GPUI_SESSION,
  revision,sequence,text:'日本語🔹'
});
function response(){
  return {status:null,headers:{},body:null,
    setHeader(k,v){this.headers[k.toLowerCase()]=v;},
    writeHead(code){this.status=code;return this;},
    end(value){this.body=value??null;return this;}};
}
function request(route,{method='GET',headers={},body=null}={}){
  const bytes=body===null?null:Buffer.isBuffer(body)?body:Buffer.from(body);
  return {url:'/mobile/'+route,method,headers,
    async *[Symbol.asyncIterator](){if(bytes!==null)yield bytes;}};
}
function setup(){
  let clock=100_000,paired=true,token=TOKEN,scopes=['control:read','control:execute'];
  const enrollment={validateGrant({grantId,sessionId}){
    if(!paired||grantId!==GRANT||sessionId!==DEVICE_SESSION)
      throw Object.assign(new Error('revoked'),{status:403});
    return {deviceId:DEVICE,scopes};
  }};
  const channel=createGpuiDirectChannel({dataRoot:'/not-used',origin:ORIGIN,
    enrollment,now:()=>clock,ownerTokenFor:()=>token});
  const call=async(route,options={})=>{
    const res=response();
    assert.equal(await channel.handle(request(route,options),res,route),true);
    return res;
  };
  const nativeFrame=(revision=1,overrides={})=>call('api/gpui/native-frame',{
    method:'POST',headers:{...frameHeaders(revision),...overrides},body:PNG
  });
  const input=(packet,overrides={})=>call('api/gpui/input',{
    method:'POST',headers:{...phoneRead,origin:ORIGIN,
      'x-vivim-gpui-input':'1','content-type':'application/json',...overrides},
    body:JSON.stringify(packet)
  });
  const nativeInput=()=>call('api/gpui/native-input',{headers:owner});
  const read=(url='api/gpui/frame',headers=phoneRead)=>call(url,{headers});
  return {channel,call,nativeFrame,input,nativeInput,read,
    tick:n=>{clock+=n;},
    setPaired:x=>{paired=x;},setToken:x=>{token=x;},setScopes:x=>{scopes=x;}};
}
const parsed=res=>JSON.parse(Buffer.from(res.body).toString('utf8'));

test('cannot create a second Host/renderer without source-owned enrollment and token provider',()=>{
  assert.throws(()=>createGpuiDirectChannel(),/GPUI_DIRECT_DEPENDENCIES_INVALID/);
});
test('no private native frame without canonical owner bearer and explicit native marker',async()=>{
  const f=setup();
  assert.equal((await f.call('api/gpui/native-frame',{
    method:'POST',headers:{...frameHeaders(),authorization:undefined},body:PNG})).status,401);
  assert.equal((await f.call('api/gpui/native-frame',{
    method:'POST',headers:{...frameHeaders(),'x-vivim-gpui-native':undefined},body:PNG})).status,401);
  assert.equal((await f.call('api/gpui/native-frame',{
    method:'POST',headers:{...frameHeaders(),origin:ORIGIN},body:PNG})).status,401);
  assert.equal(f.channel.status().active,false);
  f.channel.close();
});
test('verified native PNG reaches only authorized Direct device as exact bytes',async()=>{
  const f=setup();
  const publish=await f.nativeFrame();
  assert.equal(publish.status,202);
  assert.equal(parsed(publish).state,'published');
  const read=await f.read();
  assert.equal(read.status,200);
  assert.equal(read.headers['content-type'],'image/png');
  assert.equal(read.headers['cache-control'],'private, no-store');
  assert.equal(read.headers['x-vivim-gpui-session'],GPUI_SESSION);
  assert.equal(read.headers['x-vivim-gpui-revision'],'1');
  assert.deepEqual(Buffer.from(read.body),PNG);
  assert.equal((await f.read('api/gpui/frame?session='+GPUI_SESSION+'&after=1')).status,204);
  assert.equal(parsed(await f.read('api/gpui/status')).available,true);
  f.channel.close();
});
test('unknown, revoked or scope-limited devices never receive owner pixels',async()=>{
  const f=setup();await f.nativeFrame();
  assert.equal((await f.read('api/gpui/frame',{})).status,401);
  f.setScopes(['control:execute']);
  assert.equal((await f.read()).status,403);
  f.setScopes(['control:read']);
  assert.equal((await f.read()).status,200);
  f.setPaired(false);
  assert.equal((await f.read()).status,403);
  f.channel.close();
});
test('phone pointer queues one inert native input with NO Host-effect receipt',async()=>{
  const f=setup();await f.nativeFrame();
  const submitted=await f.input(pointer());
  assert.equal(submitted.status,202);
  assert.equal(parsed(submitted).state,'submitted_to_native_unverified');
  assert.equal(Object.hasOwn(parsed(submitted),'controlId'),false);
  const pickup=await f.nativeInput();
  assert.equal(pickup.status,200);
  assert.deepEqual(parsed(pickup).input,pointer());
  assert.equal(parsed(pickup).state,'unverified');
  assert.equal((await f.nativeInput()).status,204);
  f.channel.close();
});
test('native polling never exposes pending input without owner token',async()=>{
  const f=setup();await f.nativeFrame();await f.input(pointer());
  const wrong=await f.call('api/gpui/native-input',{headers:phoneRead});
  assert.equal(wrong.status,401);
  assert.equal((await f.nativeInput()).status,200);
  f.channel.close();
});
test('pointer and Unicode IME use one no-replay sequence across Host ferry',async()=>{
  const f=setup();await f.nativeFrame();
  assert.equal((await f.input(pointer(5))).status,202);
  assert.equal((await f.input(text(5))).status,409);
  assert.equal((await f.input(text(6))).status,202);
  assert.deepEqual(parsed(await f.nativeInput()).input,pointer(5));
  assert.deepEqual(parsed(await f.nativeInput()).input,text(6));
  assert.equal((await f.nativeInput()).status,204);
  f.channel.close();
});
test('phone input requires exact Direct origin, custom header and execute scope',async()=>{
  const f=setup();await f.nativeFrame();
  assert.equal((await f.input(pointer(),{origin:'https://foreign.example'})).status,403);
  assert.equal((await f.input(pointer(),{'x-vivim-gpui-input':undefined})).status,403);
  f.setScopes(['control:read']);
  assert.equal((await f.input(pointer())).status,403);
  f.setScopes(['control:read','control:execute']);
  assert.equal((await f.input(pointer())).status,202);
  f.channel.close();
});
test('invalid PNG frames and malformed metadata cannot expose fake renderer frames',async()=>{
  const f=setup();
  assert.equal((await f.call('api/gpui/native-frame',{
    method:'POST',headers:frameHeaders(),body:Buffer.from('not-a-png')})).status,409);
  assert.equal((await f.call('api/gpui/native-frame',{
    method:'POST',headers:{...frameHeaders(),'x-vivim-gpui-width':'0'},body:PNG})).status,400);
  assert.equal((await f.read()).status,204);
  f.channel.close();
});
test('expired frame is scrubbed, input queue emptied and replay cursor retained',async()=>{
  const f=setup();await f.nativeFrame();
  assert.equal((await f.input(pointer(7))).status,202);
  f.tick(5001);
  assert.equal((await f.read()).status,204);
  assert.equal(f.channel.status().active,false);
  assert.equal((await f.nativeInput()).status,204);
  assert.equal((await f.input(pointer(8))).status,503);
  assert.equal((await f.nativeFrame(2)).status,202);
  assert.equal((await f.input(pointer(7,2))).status,409);
  assert.equal((await f.input(pointer(8,2))).status,202);
  f.channel.close();
});
test('native owner-token rotation or source loss refuses further publication',async()=>{
  const f=setup();await f.nativeFrame();
  f.setToken('new-owner-secret'.padEnd(48,'y'));
  assert.equal((await f.nativeFrame(2)).status,401);
  f.channel.close();
});
test('malformed input and dangerous approval/control fields cannot execute effects',async()=>{
  const f=setup();await f.nativeFrame();
  assert.equal((await f.input({...pointer(),kind:'host.execute'})).status,400);
  assert.equal((await f.input({...pointer(),controlId:42,approved:true})).status,202,
    'relay explicitly strips untrusted extras and forwards only typed native input');
  const pickup=parsed(await f.nativeInput()).input;
  assert.equal(Object.hasOwn(pickup,'controlId'),false);
  assert.equal(Object.hasOwn(pickup,'approved'),false);
  f.channel.close();
});
test('oversized native frame and phone input are bounded and denied',async()=>{
  const f=setup();
  const big=Buffer.alloc(4*1024*1024+1);
  assert.equal((await f.call('api/gpui/native-frame',{
    method:'POST',headers:frameHeaders(),body:big})).status,413);
  await f.nativeFrame();
  assert.equal((await f.call('api/gpui/input',{method:'POST',
    headers:{...phoneRead,origin:ORIGIN,'x-vivim-gpui-input':'1',
      'content-type':'application/json'},body:' '.repeat(9000)})).status,413);
  f.channel.close();
});
test('unknown query, direct method and unknown GPUI route refuse without effects',async()=>{
  const f=setup();await f.nativeFrame();
  assert.equal((await f.read('api/gpui/frame?session='+GPUI_SESSION)).status,400);
  assert.equal((await f.call('api/gpui/native-input',{method:'POST',headers:owner})).status,405);
  assert.equal((await f.call('api/gpui/nope')).status,404);
  f.channel.close();
});
test('closed Host memory relay cannot publish or return old owner-private pixels',async()=>{
  const f=setup();await f.nativeFrame();
  f.channel.close();f.channel.close();
  assert.equal((await f.read()).status,503);
  assert.equal((await f.nativeFrame(2)).status,503);
  assert.equal(f.channel.status().queuedInputs,0);
});
