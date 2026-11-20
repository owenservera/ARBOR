# File: apps/mobile-relay/test/generative-browser-compat.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/generative-browser-compat.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2434 B |
| Lines | 41 |
| Hash | 72e0d0dc9fc0 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| expected | function | 9 | no | const expected=x=&gt;createHash(&#39;sha256&#39;).update(x,&#39;utf8&#39;).digest(&#39;hex&#39;); |
| x | const | 16 | no | const x={name:&#39;Personal ✨&#39;,values:[1,2,3]}; |
| s | const | 22 | no | const s=readFileSync(new URL(&#39;../generative-ui/&#39;+name+&#39;.mjs&#39;,import.meta.url),&#39;utf8&#39;); |
| surface | const | 27 | no | const surface=createSurface(),proposal={ |
| out | const | 31 | no | const out=compileUiProposal({proposal,surface}); |
| semantic | const | 37 | no | const semantic={schema:&#39;vivim.semantic-projection/1&#39;,surfaceId:&#39;my-space&#39;,views:[{componentId:&#39;root&#39;}]}; |
| result | const | 38 | no | const result=projectVisualIntent({source:&#39;tap&#39;,targetId:&#39;root&#39;,intent:&#39;select&#39;,semantic}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| node:fs | import | 4 | external |
| ../generative-ui/portable-digest.mjs | import | 5 | [apps/mobile-relay/generative-ui/portable-digest.mjs](../generative-ui/portable-digest.mjs.md) |
| ../generative-ui/catalog.mjs | import | 6 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/compiler.mjs | import | 7 | [apps/mobile-relay/generative-ui/compiler.mjs](../generative-ui/compiler.mjs.md) |
| ../generative-ui/semantic-projection.mjs | import | 8 | [apps/mobile-relay/generative-ui/semantic-projection.mjs](../generative-ui/semantic-projection.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sha256Hex,digestJson,utf8Length} from '../generative-ui/portable-digest.mjs';
import {createSurface} from '../generative-ui/catalog.mjs';
import {compileUiProposal} from '../generative-ui/compiler.mjs';
import {projectVisualIntent} from '../generative-ui/semantic-projection.mjs';
const expected=x=>createHash('sha256').update(x,'utf8').digest('hex');
test('browser SHA-256 equals Node for UTF-8 and block boundaries',()=>{
 for(const s of ['','abc','Hola 👋','😀'.repeat(100),'0123456789'.repeat(500)])
  assert.equal(sha256Hex(s),expected(s));
 assert.equal(sha256Hex('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('JSON digest and UTF-8 length',()=>{
 const x={name:'Personal ✨',values:[1,2,3]};
 assert.equal(digestJson(x),expected(JSON.stringify(x)));
 assert.equal(utf8Length('é'),2);
});
test('all shared GUI modules contain no Node-only browser imports or globals',()=>{
 for(const name of ['catalog','compiler','semantic-projection','renderer','bootstrap-adapters','portable-digest']){
  const s=readFileSync(new URL('../generative-ui/'+name+'.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(s,/\bfrom\s*['"]node:|\bBuffer\s*\.|\bprocess\s*\.|\brequire\s*\(/);
 }
});
test('UI preview retains exact SHA-256 digest and has no effect',()=>{
 const surface=createSurface(),proposal={
  schema:'vivim.ui-proposal/1',surfaceId:surface.surfaceId,baseRevision:0,
  operations:[{opId:'a',type:'insert',parentId:'root',component:{id:'item',type:'text',props:{value:'Hi'},children:[]}}],
  explanation:'Edit',assumptions:[],unknowns:[]};
 const out=compileUiProposal({proposal,surface});
 assert.equal(out.proposalDigest,expected(JSON.stringify(proposal)));
 assert.equal(out.previewDigest,expected(JSON.stringify(out.surface)));
 assert.equal(out.persisted,false);
});
test('visual intent SHA256 remains stable across Node and phone',()=>{
 const semantic={schema:'vivim.semantic-projection/1',surfaceId:'my-space',views:[{componentId:'root'}]};
 const result=projectVisualIntent({source:'tap',targetId:'root',intent:'select',semantic});
 const {source,meaningDigest,effects,authorization,parsedBy,...meaning}=result;
 assert.equal(meaningDigest,expected(JSON.stringify(meaning)));
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
