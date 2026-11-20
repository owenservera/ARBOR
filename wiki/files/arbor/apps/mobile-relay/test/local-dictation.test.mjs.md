# File: apps/mobile-relay/test/local-dictation.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/local-dictation.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2544 B |
| Lines | 31 |
| Hash | f4bd112f186f |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Recognition | class | 4 | no | class Recognition{ |
| available | method | 5 | yes | static async available(opts){assert.equal(opts.processLocally,true);return &#39;available&#39;;} |
| start | method | 7 | yes | start(){assert.equal(this.processLocally,true);Recognition.last=this;} |
| stop | method | 8 | yes | stop(){this.onend?.()}abort(){this.aborted=true;} |
| texts | const | 11 | no | const texts=[],states=[],d=createLocalDictation({Recognition,onText:x=&gt;texts.push(x),onState:s=&gt;states.push(s.state)}); |
| Unavailable | class | 17 | no | class Unavailable extends Recognition{static async available(){return &#39;downloadable&#39;}} |
| no | const | 18 | no | const no=createLocalDictation({Recognition:Unavailable});assert.equal(await no.check(&#39;en-US&#39;),false);assert.equal(no.start(),false); |
| texts | const | 19 | no | const texts=[],d=createLocalDictation({Recognition,onText:x=&gt;texts.push(x)});await d.check(&#39;en-US&#39;);d.start();const r=Recognition.last;d.cancel(); |
| d | const | 23 | no | const d=createLocalDictation({Recognition:class Legacy{}});assert.equal(d.supported,false);assert.equal(await d.check(&#39;en-US&#39;),false); |
| resolve | variable | 24 | no | let resolve;class Pending extends Recognition{static available(){return new Promise(r=&gt;resolve=r)}} |
| pending | const | 25 | no | const pending=createLocalDictation({Recognition:Pending});const p=pending.check(&#39;en-US&#39;);pending.cancel();resolve(&#39;available&#39;);assert.equal(await p,false);assert.equal(pending.start(),false); |
| texts | const | 29 | no | const texts=[],d=createLocalDictation({Recognition,onText:x=&gt;texts.push(x)});await d.check(&#39;en-US&#39;);d.start();const r=Recognition.last; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../ux/local-dictation.mjs | import | 3 | [apps/mobile-relay/ux/local-dictation.mjs](../ux/local-dictation.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalDictation} from '../ux/local-dictation.mjs';
class Recognition{
 static async available(opts){assert.equal(opts.processLocally,true);return 'available';}
 get processLocally(){return this.local??false}set processLocally(v){this.local=v;}
 start(){assert.equal(this.processLocally,true);Recognition.last=this;}
 stop(){this.onend?.()}abort(){this.aborted=true;}
}
test('on-device only recognition hands final text to review, never automatically saves',async()=>{
 const texts=[],states=[],d=createLocalDictation({Recognition,onText:x=>texts.push(x),onState:s=>states.push(s.state)});
 assert.equal(await d.check('es-ES'),true);assert.equal(d.start(),true);const r=Recognition.last;
 r.onresult({resultIndex:0,results:[Object.assign([{transcript:'Buy milk'}],{isFinal:true})]});assert.deepEqual(texts,[]);
 d.stop();assert.deepEqual(texts,['Buy milk']);assert.equal(d.state(),'review');assert.equal(r.lang,'es-ES');
});
test('no cloud fallback or pack installation; cancel invalidates late events',async()=>{
 class Unavailable extends Recognition{static async available(){return 'downloadable'}}
 const no=createLocalDictation({Recognition:Unavailable});assert.equal(await no.check('en-US'),false);assert.equal(no.start(),false);
 const texts=[],d=createLocalDictation({Recognition,onText:x=>texts.push(x)});await d.check('en-US');d.start();const r=Recognition.last;d.cancel();
 r.onresult({results:[Object.assign([{transcript:'late'}],{isFinal:true})]});r.onend();assert.deepEqual(texts,[]);assert.equal(r.aborted,true);
});
test('unavailable API and permission race fail closed',async()=>{
 const d=createLocalDictation({Recognition:class Legacy{}});assert.equal(d.supported,false);assert.equal(await d.check('en-US'),false);
 let resolve;class Pending extends Recognition{static available(){return new Promise(r=>resolve=r)}}
 const pending=createLocalDictation({Recognition:Pending});const p=pending.check('en-US');pending.cancel();resolve('available');assert.equal(await p,false);assert.equal(pending.start(),false);
});

test('overlong recognition is refused instead of silently truncating the reviewed note',async()=>{
 const texts=[],d=createLocalDictation({Recognition,onText:x=>texts.push(x)});await d.check('en-US');d.start();const r=Recognition.last;
 r.onresult({results:[Object.assign([{transcript:'x'.repeat(1201)}],{isFinal:true})]});r.onend();assert.equal(d.state(),'error');assert.deepEqual(texts,[]);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
