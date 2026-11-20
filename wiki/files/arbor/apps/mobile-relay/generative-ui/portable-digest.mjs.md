# File: apps/mobile-relay/generative-ui/portable-digest.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/generative-ui/portable-digest.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2453 B |
| Lines | 43 |
| Hash | 67df317705aa |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| K | const | 3 | no | const K=Object.freeze([ 0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5, 0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf17… |
| rotate | function | 13 | no | const rotate=(v,n)=&gt;(v&gt;&gt;&gt;n)\|(v&lt;&lt;(32-n)); |
| sha256Hex | function | 14 | yes | export function sha256Hex(text){ |
| src | const | 16 | no | const src=new TextEncoder().encode(text),size=Math.ceil((src.length+9)/64)*64; |
| bytes | const | 18 | no | const bytes=new Uint8Array(size);bytes.set(src);bytes[src.length]=128; |
| view | const | 19 | no | const view=new DataView(bytes.buffer),bits=BigInt(src.length)*8n; |
| hash | const | 22 | no | const hash=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64); |
| x | const | 26 | no | const x=w[i-15],y=w[i-2]; |
| s1 | const | 31 | no | const s1=rotate(e,6)^rotate(e,11)^rotate(e,25); |
| t1 | const | 32 | no | const t1=(z+s1+((e&amp;f)^(~e&amp;g))+K[i]+w[i])&gt;&gt;&gt;0; |
| s0 | const | 33 | no | const s0=rotate(a,2)^rotate(a,13)^rotate(a,22); |
| t2 | const | 34 | no | const t2=(s0+((a&amp;b)^(a&amp;c)^(b&amp;c)))&gt;&gt;&gt;0; |
| round | const | 37 | no | const round=[a,b,c,d,e,f,g,z]; |
| digestJson | function | 42 | yes | export const digestJson=value=&gt;sha256Hex(JSON.stringify(value)); |
| utf8Length | function | 43 | yes | export const utf8Length=value=&gt;new TextEncoder().encode(value).byteLength; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-canvas.mjs](../build-canvas.mjs.md) | ./generative-ui/portable-digest.mjs |
| [apps/mobile-relay/generative-ui/compiler.mjs](./compiler.mjs.md) | ./portable-digest.mjs |
| [apps/mobile-relay/generative-ui/semantic-projection.mjs](./semantic-projection.mjs.md) | ./portable-digest.mjs |
| [apps/mobile-relay/test/build-live-readback.test.mjs](../test/build-live-readback.test.mjs.md) | ../generative-ui/portable-digest.mjs |
| [apps/mobile-relay/test/generative-browser-compat.test.mjs](../test/generative-browser-compat.test.mjs.md) | ../generative-ui/portable-digest.mjs |
| [apps/vivim-host/control/personal-semantics.mjs](../../vivim-host/control/personal-semantics.mjs.md) | ../../mobile-relay/generative-ui/portable-digest.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Synchronous SHA-256 for bounded declarative UI data in Node and browser.
// A digest is NOT a Host approval, signature or authorization.
const K=Object.freeze([
0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
]);
const rotate=(v,n)=>(v>>>n)|(v<<(32-n));
export function sha256Hex(text){
 if(typeof text!=='string')throw new TypeError('UTF-8 string required');
 const src=new TextEncoder().encode(text),size=Math.ceil((src.length+9)/64)*64;
 if(size>1024*1024)throw new RangeError('Digest input exceeds UI limit');
 const bytes=new Uint8Array(size);bytes.set(src);bytes[src.length]=128;
 const view=new DataView(bytes.buffer),bits=BigInt(src.length)*8n;
 view.setUint32(size-8,Number(bits>>32n&0xffffffffn));
 view.setUint32(size-4,Number(bits&0xffffffffn));
 const hash=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64);
 for(let offset=0;offset<size;offset+=64){
  for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
  for(let i=16;i<64;i++){
   const x=w[i-15],y=w[i-2];
   w[i]=(w[i-16]+(rotate(x,7)^rotate(x,18)^(x>>>3))+w[i-7]+(rotate(y,17)^rotate(y,19)^(y>>>10)))>>>0;
  }
  let [a,b,c,d,e,f,g,z]=hash;
  for(let i=0;i<64;i++){
   const s1=rotate(e,6)^rotate(e,11)^rotate(e,25);
   const t1=(z+s1+((e&f)^(~e&g))+K[i]+w[i])>>>0;
   const s0=rotate(a,2)^rotate(a,13)^rotate(a,22);
   const t2=(s0+((a&b)^(a&c)^(b&c)))>>>0;
   z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
  }
  const round=[a,b,c,d,e,f,g,z];
  for(let i=0;i<8;i++)hash[i]=(hash[i]+round[i])>>>0;
 }
 return hash.map(x=>x.toString(16).padStart(8,'0')).join('');
}
export const digestJson=value=>sha256Hex(JSON.stringify(value));
export const utf8Length=value=>new TextEncoder().encode(value).byteLength;
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
