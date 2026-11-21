import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const wasm=readFileSync(new URL('../wasm/vivim_programmability_core.wasm',import.meta.url));
test('shipped Rust WASM accepts first-contact text without granting any effect',async()=>{
  const {instance}=await WebAssembly.instantiate(wasm,{});
  const native=instance.exports;
  const encoder=new TextEncoder(),decoder=new TextDecoder();
  assert.equal(typeof native.vivim_kernel_dispatch,'function');
  for(const text of ['', '  show status  ']){
    const bytes=encoder.encode(JSON.stringify({
      schema:'vivim.product-pure-request/1',operation:'first-contact',input:{text}
    }));
    const p=native.vivim_kernel_alloc(bytes.length);
    assert.ok(p>0);
    new Uint8Array(native.memory.buffer,p,bytes.length).set(bytes);
    const response=native.vivim_kernel_dispatch(p,bytes.length);
    assert.equal(typeof response,'bigint');
    const op=Number(response & 0xffffffffn),len=Number(response>>32n);
    const parsed=JSON.parse(decoder.decode(new Uint8Array(native.memory.buffer,op,len)));
    assert.equal(parsed.schema,'vivim.product-pure-response/1');
    assert.equal(parsed.operation,'first-contact');
    assert.equal(parsed.executionAuthorized,false);
    assert.equal(parsed.effectPerformed,false);
    assert.equal(parsed.result.schema,'vivim.first-contact/1');
    assert.equal(parsed.result.state,text.trim()?'admitted':'empty');
    native.vivim_kernel_free(op,len);
    native.vivim_kernel_free(p,bytes.length);
  }
});
