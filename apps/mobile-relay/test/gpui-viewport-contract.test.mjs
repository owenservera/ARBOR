import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {validateGpuiFrame, nativePointerFromClient} from '../gpui-viewport-contract.mjs';

const signature=Buffer.from([137,80,78,71,13,10,26,10]);
function crc32(bytes) {
  let crc=0xffffffff;
  for(const byte of bytes){
    crc ^= byte;
    for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc ^ 0xffffffff)>>>0;
}
function chunk(name,data=Buffer.alloc(0)) {
  const type=Buffer.from(name,'ascii');
  const length=Buffer.alloc(4),crc=Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([type,data])));
  return Buffer.concat([length,type,data,crc]);
}
function parts(width=360,height=800) {
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);
  ihdr[8]=8;ihdr[9]=6; // 8-bit RGBA, non-interlaced
  // Real lossless PNG image: one filter-0 scanline per row and RGBA=0.
  const compressed=deflateSync(Buffer.alloc(height*(1+width*4)));
  return {header:chunk('IHDR',ihdr),data:compressed,end:chunk('IEND')};
}
function validPng() {
  const p=parts();
  return Buffer.concat([signature,p.header,chunk('IDAT',p.data),p.end]);
}
const png=validPng();
const frame=()=>({kind:'vivim.gpui.pixels/1',session:'a'.repeat(32),
  revision:1,width:360,height:800,png});

test('accepts complete bounded PNG pixels and GPUI metadata without a DOM renderer',()=>{
  const x=validateGpuiFrame(frame());
  assert.deepEqual(x,{session:'a'.repeat(32),revision:1,width:360,height:800});
  assert.equal(Object.isFrozen(x),true);
});
test('rejects fake pixels and dimension mismatch',()=>{
  assert.throws(()=>validateGpuiFrame({...frame(),png:new Uint8Array(24)}));
  assert.throws(()=>validateGpuiFrame({...frame(),width:361}),/INVALID_GPUI_PNG_DIMENSIONS/);
});
test('rejects stale frame for same session',()=>assert.throws(
  ()=>validateGpuiFrame(frame(),{session:'a'.repeat(32),revision:1}),/STALE_GPUI_FRAME/));
test('allows new session with independent revision',()=>assert.equal(
  validateGpuiFrame(frame(),{session:'b'.repeat(32),revision:100}).revision,1));
test('maps CSS-scaled phone touch to native pixel coordinates',()=>{
  assert.deepEqual(nativePointerFromClient(validateGpuiFrame(frame()),{left:10,top:20,width:180,height:400},100,220,7),
    {session:'a'.repeat(32),revision:1,sequence:7,x:180,y:400});
});
test('rejects out-of-bounds touch and invalid dimensions',()=>{
  const f=validateGpuiFrame(frame());
  assert.throws(()=>nativePointerFromClient(f,{left:0,top:0,width:180,height:400},180,200,1));
  assert.throws(()=>nativePointerFromClient(f,{left:0,top:0,width:0,height:400},10,10,1));
});
test('refuses legacy 24-byte PNG signature and dimensions with no image chunks',()=>{
  const fake=Buffer.alloc(24);signature.copy(fake);
  fake.writeUInt32BE(0x49484452,12);fake.writeUInt32BE(360,16);fake.writeUInt32BE(800,20);
  assert.throws(()=>validateGpuiFrame({...frame(),png:fake}),/INVALID_GPUI_FRAME/);
});
test('refuses missing IDAT and missing IEND',()=>{
  const p=parts();
  assert.throws(()=>validateGpuiFrame({...frame(),png:Buffer.concat([signature,p.header,p.end])}),
    /INVALID_GPUI_PNG_STRUCTURE/);
  assert.throws(()=>validateGpuiFrame({...frame(),png:png.subarray(0,png.length-12)}),
    /INVALID_GPUI_PNG_STRUCTURE/);
});
test('refuses corrupted IDAT or IHDR checksums even when metadata matches',()=>{
  const broken=Buffer.from(png);broken[broken.length-17]^=1;
  assert.throws(()=>validateGpuiFrame({...frame(),png:broken}),/INVALID_GPUI_PNG_STRUCTURE/);
  const badHeader=Buffer.from(png);badHeader[31]^=1;
  assert.throws(()=>validateGpuiFrame({...frame(),png:badHeader}),/INVALID_GPUI_PNG_STRUCTURE/);
});
test('refuses trailing bytes after valid PNG terminal IEND',()=>{
  assert.throws(()=>validateGpuiFrame({...frame(),png:Buffer.concat([png,Buffer.from('junk')])}),
    /INVALID_GPUI_PNG_STRUCTURE/);
});
test('refuses separated IDAT chunks even when every chunk CRC matches',()=>{
  const p=parts(),middle=Math.floor(p.data.length/2);
  const split=Buffer.concat([signature,p.header,chunk('IDAT',p.data.subarray(0,middle)),
    chunk('tEXt',Buffer.from('x\0y')),chunk('IDAT',p.data.subarray(middle)),p.end]);
  assert.throws(()=>validateGpuiFrame({...frame(),png:split}),/INVALID_GPUI_PNG_STRUCTURE/);
});
test('accepts real PNG sliced from nonzero byteOffset without reading adjacent bytes',()=>{
  const wrapper=Buffer.concat([Buffer.alloc(13,7),png,Buffer.alloc(9,9)]);
  const extracted=wrapper.subarray(13,13+png.length);
  assert.equal(extracted.byteOffset>0,true);
  assert.equal(validateGpuiFrame({...frame(),png:extracted}).width,360);
});

test('pointer refuses fabricated or malformed GPUI frame identity instead of inventing an input packet',()=>{
  const bounds={left:0,top:0,width:360,height:800};
  const good=validateGpuiFrame(frame());
  const bad=[
    {width:360,height:800},
    {...good,session:'not-a-real-session'},
    {...good,session:'A'.repeat(32)},
    {...good,revision:0},
    {...good,revision:-1},
    {...good,revision:1.5},
    {...good,width:0},
    {...good,height:0},
    {...good,width:4097},
    {...good,height:4097},
    {...good,width:Infinity}
  ];
  for(const descriptor of bad)
    assert.throws(()=>nativePointerFromClient(descriptor,bounds,10,10,1),/INVALID_GPUI_POINTER/);
});
test('valid metadata still translates first touch and does not grant authority',()=>{
  const descriptor=validateGpuiFrame(frame());
  const touch=nativePointerFromClient(descriptor,{left:1,top:2,width:360,height:800},2,3,0);
  assert.deepEqual(touch,{session:'a'.repeat(32),revision:1,sequence:0,x:1,y:1});
  assert.ok(!Object.hasOwn(touch,'controlId'));
  assert.ok(!Object.hasOwn(touch,'approved'));
});

test('rejects header-only, missing IEND and trailing bytes',()=>{
  assert.throws(()=>validateGpuiFrame({...frame(),png:png.slice(0,24)}));
  assert.throws(()=>validateGpuiFrame({...frame(),png:png.slice(0,-12)}));
  const trailing=new Uint8Array(png.length+1);trailing.set(png);
  assert.throws(()=>validateGpuiFrame({...frame(),png:trailing}));
});

test('bounds PNG chunk traversal while allowing the exact 4096-chunk limit',()=>{
  const p=parts(), ancillary=chunk('tEXt',Buffer.from('x\0y'));
  const make=(n)=>Buffer.concat([signature,p.header,...Array(n).fill(ancillary),chunk('IDAT',p.data),p.end]);
  assert.equal(validateGpuiFrame({...frame(),png:make(4093)}).width,360);
  assert.throws(()=>validateGpuiFrame({...frame(),png:make(4094)}),/INVALID_GPUI_PNG_STRUCTURE/);
});
