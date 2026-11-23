import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGpuiFrame, nativePointerFromClient} from '../gpui-viewport-contract.mjs';
const png = new Uint8Array(24);
png.set([137,80,78,71,13,10,26,10],0);
new DataView(png.buffer).setUint32(12,0x49484452);
new DataView(png.buffer).setUint32(16,360);
new DataView(png.buffer).setUint32(20,800);
const frame = () => ({kind:'vivim.gpui.pixels/1',session:'a'.repeat(32),revision:1,width:360,height:800,png});
test('accepts bounded native PNG metadata, no DOM rendering',()=> assert.equal(validateGpuiFrame(frame()).width,360));
test('rejects fake pixels and dimension mismatch',()=> {
  assert.throws(()=>validateGpuiFrame({...frame(),png:new Uint8Array(24)}));
  assert.throws(()=>validateGpuiFrame({...frame(),width:361}));
});
test('rejects stale frame for same session',()=>assert.throws(()=>validateGpuiFrame(frame(),{session:'a'.repeat(32),revision:1})));
test('allows new session with independent revision',()=>assert.equal(validateGpuiFrame(frame(),{session:'b'.repeat(32),revision:100}).revision,1));
test('maps CSS-scaled phone touch to native pixel coordinates',()=> {
  assert.deepEqual(nativePointerFromClient(validateGpuiFrame(frame()),{left:10,top:20,width:180,height:400},100,220,7),
    {session:'a'.repeat(32),revision:1,sequence:7,x:180,y:400});
});
test('rejects out-of-bounds touch and invalid dimensions',()=>{
  const f=validateGpuiFrame(frame());
  assert.throws(()=>nativePointerFromClient(f,{left:0,top:0,width:180,height:400},180,200,1));
  assert.throws(()=>nativePointerFromClient(f,{left:0,top:0,width:0,height:400},10,10,1));
});
