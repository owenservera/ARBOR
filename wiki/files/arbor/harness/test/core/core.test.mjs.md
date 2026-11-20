# File: harness/test/core/core.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/core/core.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16596 B |
| Lines | 75 |
| Hash | 05df8ee95af8 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| provider | const | 11 | no | const provider = { id:&#39;test&#39;, hosts:[&#39;example.test&#39;], threadPattern:/^\\/t\\/(?&lt;id&gt;[^/]+)$/, composer:{selectors:[&#39;textarea&#39;]}, send:{strategy:&#39;enter&#39;}, assistant:{containerSelectors:[&#39;.assistant&#39;],str… |
| FakePage | class | 12 | no | class FakePage { |
| constructor | method | 13 | yes | constructor() { this.location=&#39;https://example.test/t/a&#39;; this.draft=&#39;&#39;; this.users=[&#39;old&#39;]; this.assistants=0; this.effects=[]; this.mode=&#39;normal&#39;; } |
| url | method | 14 | yes | async url() { return this.location; } |
| evaluate | method | 15 | yes | async evaluate(expr) { if (expr.includes(&#39;harness:focus&#39;)) return !this.unfocusable; if (expr.includes(&#39;harness:reply&#39;)) return this.reply \|\| {text:&#39;&#39;,streaming:false,count:0}; if (this.lateComposer … |
| insertText | method | 16 | yes | async insertText(text) { this.effects.push(&#39;type&#39;); this.draft=this.mode === &#39;mismatch&#39; ? text+&#39;x&#39; : text; } |
| pressEnter | method | 17 | yes | async pressEnter() { this.effects.push(&#39;submit&#39;); if (this.mode === &#39;error&#39;) throw Error(&#39;dispatch failed&#39;); if (this.mode === &#39;clear&#39;) { this.draft=&#39;&#39;; return; } this.users.push(this.draft); this.dr… |
| setup | function | 19 | no | async function setup(t) { const dir=await mkdtemp(join(tmpdir(),&#39;harness-core-&#39;)); t.after(() =&gt; rm(dir,{recursive:true,force:true})); const journal=createJournal({dir}); const page=new FakePage(); c… |
| el | const | 35 | no | const el = { innerText: &#39;\\n&#39;, focus() {} }; |
| doc | const | 36 | no | const doc = { querySelector: s =&gt; s === &#39;#c&#39; ? el : null, querySelectorAll: () =&gt; [] }; |
| seen | const | 41 | no | const seen = []; |
| doc | const | 42 | no | const doc = { querySelector: () =&gt; null, querySelectorAll: s =&gt; { seen.push(s); return []; } }; |
| lines | const | 51 | no | const lines = [{ innerText: &#39;line one &#39; }, { innerText: &#39;line two&#39; }]; |
| turn | const | 52 | no | const turn = { querySelectorAll: s =&gt; s === &#39;p.line&#39; ? lines : [] }; |
| doc | const | 53 | no | const doc = { querySelector: () =&gt; null, querySelectorAll: s =&gt; s === &#39;user-query&#39; ? [turn] : [] }; |
| withVisibility | function | 60 | no | const withVisibility = (page, states) =&gt; { const ev=page.evaluate.bind(page); page.evaluate=async e =&gt; e === &#39;document.visibilityState&#39; ? (states.length &gt; 1 ? states.shift() : states[0]) : ev(e); }; |
| o | const | 65 | no | const o=await setup(t); o.args.prompt=&#39;a\\n\\nb&#39;; o.args.approval.payloadDigest=digestPayload(o.args.prompt); o.page.insertText=async x =&gt; { o.page.effects.push(&#39;type&#39;); o.page.draft=&#39;a\\n\\nc&#39;; }; asser… |
| o | const | 67 | no | const o=await setup(t); o.args.prompt=&#39;run `node --test` now&#39;; o.args.approval.payloadDigest=digestPayload(o.args.prompt); const e2=o.page.pressEnter.bind(o.page); o.page.pressEnter=async () =&gt; { awa… |
| n | const | 70 | no | const n=await setup(t); n.args.prompt=&#39;word&#39;.repeat(1000); n.args.approval.payloadDigest=digestPayload(n.args.prompt); const e3=n.page.pressEnter.bind(n.page); n.page.pressEnter=async () =&gt; { await e… |
| o | const | 71 | no | const o=await setup(t); o.args.prompt=&#39;word&#39;.repeat(1000); o.args.approval.payloadDigest=digestPayload(o.args.prompt); const e2=o.page.pressEnter.bind(o.page); o.page.pressEnter=async () =&gt; { await e… |
| o | const | 73 | no | const o=await setup(t); o.args.prompt=&#39;delete file&#39;; o.args.approval.payloadDigest=digestPayload(o.args.prompt); o.page.insertText=async x =&gt; { o.page.effects.push(&#39;type&#39;); o.page.draft=&#39;deletefile&#39;;… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../../src/core/cdp.mjs | import | 6 | [harness/src/core/cdp.mjs](../../src/core/cdp.mjs.md) |
| ../../src/core/journal.mjs | import | 7 | [harness/src/core/journal.mjs](../../src/core/journal.mjs.md) |
| ../../src/core/send.mjs | import | 8 | [harness/src/core/send.mjs](../../src/core/send.mjs.md) |
| ../../src/core/reply.mjs | import | 9 | [harness/src/core/reply.mjs](../../src/core/reply.mjs.md) |
| ../../src/core/send.mjs | import | 31 | [harness/src/core/send.mjs](../../src/core/send.mjs.md) |
| node:test | import | 32 | external |
| node:assert/strict | import | 33 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/core/index.js](./index.js.md) | ./core.test.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect } from '../../src/core/cdp.mjs';
import { createJournal, digestPayload } from '../../src/core/journal.mjs';
import { sendOnce } from '../../src/core/send.mjs';
import { readReply } from '../../src/core/reply.mjs';

const provider = { id:'test', hosts:['example.test'], threadPattern:/^\/t\/(?<id>[^/]+)$/, composer:{selectors:['textarea']}, send:{strategy:'enter'}, assistant:{containerSelectors:['.assistant'],streamingSelectors:['.streaming']}, preflight:{authWallSelectors:[]} };
class FakePage {
  constructor() { this.location='https://example.test/t/a'; this.draft=''; this.users=['old']; this.assistants=0; this.effects=[]; this.mode='normal'; }
  async url() { return this.location; }
  async evaluate(expr) { if (expr.includes('harness:focus')) return !this.unfocusable; if (expr.includes('harness:reply')) return this.reply || {text:'',streaming:false,count:0}; if (this.lateComposer > 0) { this.lateComposer--; return { authWall:false, composer:false, composerText:'', userTurns:[...this.users], assistantTurns:this.assistants, buttonSelector:null }; } return { authWall:false, composer:true, composerText:this.draft, userTurns:[...this.users], assistantTurns:this.assistants, buttonSelector:null }; }
  async insertText(text) { this.effects.push('type'); this.draft=this.mode === 'mismatch' ? text+'x' : text; }
  async pressEnter() { this.effects.push('submit'); if (this.mode === 'error') throw Error('dispatch failed'); if (this.mode === 'clear') { this.draft=''; return; } this.users.push(this.draft); this.draft=''; }
}
async function setup(t) { const dir=await mkdtemp(join(tmpdir(),'harness-core-')); t.after(() => rm(dir,{recursive:true,force:true})); const journal=createJournal({dir}); const page=new FakePage(); const args={page,provider,journal,requestId:'req',threadUrl:'https://example.test/t/a',prompt:'secret prompt',observeTimeoutMs:0}; args.approval={requestId:args.requestId,provider:provider.id,threadUrl:args.threadUrl,payloadDigest:digestPayload(args.prompt),expiresAt:Date.now()+60000,approvedAt:Date.now()}; return {dir,journal,page,args}; }
test('thread mismatch blocks without typing', async t => { const {page,args}=await setup(t); page.location='https://example.test/t/b'; const r=await sendOnce(args); assert.equal(r.state,'blocked'); assert.deepEqual(page.effects,[]); });
test('draft is untouched', async t => { const {page,args,journal}=await setup(t); page.draft='existing'; await sendOnce(args); assert.equal((await journal.read('req')).reason,'DRAFT_PRESENT'); assert.equal(page.draft,'existing'); assert.deepEqual(page.effects,[]); });
for (const kind of ['missing','expired','wrong-payload','wrong-request']) test(`approval ${kind} blocks`, async t => { const {page,args}=await setup(t); if (kind==='missing') args.approval=null; if (kind==='expired') args.approval.expiresAt=Date.now()-1; if (kind==='wrong-payload') args.approval.payloadDigest='wrong'; if (kind==='wrong-request') args.approval.requestId='wrong'; assert.equal((await sendOnce(args)).state,'blocked'); assert.deepEqual(page.effects,[]); });
test('unfocusable composer blocks with nothing typed', async t => { const {page,args}=await setup(t); page.unfocusable=true; const r=await sendOnce(args); assert.equal(r.state,'blocked'); assert.deepEqual(page.effects,[]); });
test('typing mismatch blocks before submit', async t => { const {page,args}=await setup(t); page.mode='mismatch'; assert.equal((await sendOnce(args)).state,'blocked'); assert.deepEqual(page.effects,['type']); });
test('dispatch error uncertain and repeated id has zero page effects', async t => { const {page,args}=await setup(t); page.mode='error'; assert.equal((await sendOnce(args)).state,'uncertain'); page.effects=[]; assert.equal((await sendOnce(args)).state,'uncertain'); assert.deepEqual(page.effects,[]); });
test('cleared composer is not evidence', async t => { const {page,args}=await setup(t); page.mode='clear'; assert.equal((await sendOnce(args)).state,'uncertain'); });
test('observed requires new matching turn beyond baseline', async t => { const {page,args}=await setup(t); page.users.push(args.prompt); page.mode='clear'; assert.equal((await sendOnce(args)).state,'uncertain'); const other=await setup(t); assert.equal((await sendOnce(other.args)).state,'observed'); });
test('CDP refuses prohibited endpoints', async () => { for (const options of [{port:9222},{port:9333,host:'192.168.1.1'}]) await assert.rejects(connect(options),{code:'CDP_PORT_REFUSED'}); });
test('journal exclusive create and no bodies', async t => { const {dir,journal}=await setup(t); const rec={requestId:'x',provider:'test',payloadDigest:digestPayload('secret prompt'),prompt:'secret prompt',reply:'secret reply'}; assert.equal((await journal.create(rec)).created,true); assert.equal((await journal.create(rec)).created,false); const raw=await readFile(join(dir,'x.json'),'utf8'); assert.ok(!raw.includes('secret prompt')); assert.ok(!raw.includes('secret reply')); });
test('reply needs stable samples and no streaming', async t => { const {page,args,journal}=await setup(t); await sendOnce(args); page.reply={text:'answer',streaming:true,count:1}; assert.equal((await readReply({page,provider,journal,requestId:'req',timeoutMs:0})).complete,false); page.reply.streaming=false; const r=await readReply({page,provider,journal,requestId:'req',timeoutMs:2000,pollIntervalMs:1}); assert.equal(r.complete,true); assert.equal(r.digest,digestPayload('answer')); });
import { snapshotExpression as snapExpr } from '../../src/core/send.mjs';
import { test as t2 } from 'node:test';
import assert2 from 'node:assert/strict';
t2('empty rich-editor composer ("\\n") reads as empty, not a draft', () => {
  const el = { innerText: '\n', focus() {} };
  const doc = { querySelector: s => s === '#c' ? el : null, querySelectorAll: () => [] };
  const fn = new Function('document', `return ${snapExpr({ composer: { selectors: ['#c'] }, preflight: { authWallSelectors: ['#x'] }, send: { buttonSelectors: ['#b'] }, assistant: { containerSelectors: ['#a'] } })}`);
  assert2.equal(fn(doc).composerText, ''); el.innerText = ' hi \n'; assert2.equal(fn(doc).composerText, 'hi');
});
t2('provider user.selectors override the default user-turn selectors', () => {
  const seen = [];
  const doc = { querySelector: () => null, querySelectorAll: s => { seen.push(s); return []; } };
  const fn = new Function('document', `return ${snapExpr({ user: { selectors: ['[data-user-message-bubble="true"]'] }, composer: { selectors: ['#c'] }, preflight: { authWallSelectors: ['#x'] }, send: { buttonSelectors: ['#b'] }, assistant: { containerSelectors: ['#a'] } })}`);
  fn(doc); assert2.equal(seen[0], '[data-user-message-bubble="true"]');
});
test('late composer: readiness wait polls read-only, then sends once', async t => { const {page,args}=await setup(t); page.lateComposer=3; args.readyTimeoutMs=2000; assert.equal((await sendOnce(args)).state,'observed'); assert.deepEqual(page.effects,['type','submit']); });
test('late composer without readiness wait blocks with nothing typed', async t => { const {page,args,journal}=await setup(t); page.lateComposer=3; assert.equal((await sendOnce(args)).state,'blocked'); assert.equal((await journal.read('req')).reason,'COMPOSER_MISSING'); assert.deepEqual(page.effects,[]); });
test('fresh tab on about:blank waits for provider host before preflight', async t => { const {page,args}=await setup(t); args.threadUrl='new'; args.approval.threadUrl=null; let n=0; page.url=async () => (n++ < 2 ? 'about:blank' : 'https://example.test/'); args.readyTimeoutMs=2000; assert.equal((await sendOnce(args)).state,'observed'); });
test('wrong host after readiness wait still blocks with nothing typed', async t => { const {page,args}=await setup(t); args.threadUrl='new'; args.approval.threadUrl=null; page.location='https://evil.test/'; args.readyTimeoutMs=300; assert.equal((await sendOnce(args)).state,'blocked'); assert.deepEqual(page.effects,[]); });
t2('user.lineSelector joins line elements of one turn and normalizes whitespace', () => {
  const lines = [{ innerText: 'line one ' }, { innerText: 'line  two' }];
  const turn = { querySelectorAll: s => s === 'p.line' ? lines : [] };
  const doc = { querySelector: () => null, querySelectorAll: s => s === 'user-query' ? [turn] : [] };
  const fn = new Function('document', `return ${snapExpr({ user: { selectors: ['user-query'], lineSelector: 'p.line' }, composer: { selectors: ['#c'] }, preflight: { authWallSelectors: [] }, send: { buttonSelectors: [] }, assistant: { containerSelectors: ['#a'] } })}`);
  assert2.deepEqual(fn(doc).userTurns, ['line one line two']);
});
test('multi-line prompt is observed against a whitespace-normalized user turn', async t => { const {page,args}=await setup(t); args.prompt='first line\nsecond line'; args.approval.payloadDigest=digestPayload(args.prompt); const enter=page.pressEnter.bind(page); page.pressEnter=async () => { await enter(); page.users[page.users.length-1]=page.users.at(-1).replace(/\s+/g,' '); }; assert.equal((await sendOnce(args)).state,'observed'); });
test('new thread: threadUrl recorded only after the thread URL appears', async t => { const {page,args,journal}=await setup(t); args.threadUrl='new'; args.approval.threadUrl=null; page.location='https://example.test/'; const enter=page.pressEnter.bind(page); let reads=0; page.pressEnter=async () => { await enter(); page.url=async () => (++reads < 3 ? 'https://example.test/' : 'https://example.test/t/new1'); }; args.threadUrlTimeoutMs=2000; args.pollIntervalMs=5; const r=await sendOnce(args); assert.equal(r.state,'observed'); assert.equal((await journal.read('req')).threadUrl,'https://example.test/t/new1'); assert.deepEqual(page.effects,['type','submit']); });
test('new thread: thread URL wait is bounded and still records observed', async t => { const {page,args,journal}=await setup(t); args.threadUrl='new'; args.approval.threadUrl=null; page.location='https://example.test/'; args.threadUrlTimeoutMs=30; args.pollIntervalMs=5; const r=await sendOnce(args); assert.equal(r.state,'observed'); assert.equal((await journal.read('req')).threadUrl,'https://example.test/'); });
const withVisibility = (page, states) => { const ev=page.evaluate.bind(page); page.evaluate=async e => e === 'document.visibilityState' ? (states.length > 1 ? states.shift() : states[0]) : ev(e); };
test('foreground send brings the tab to the front before typing', async t => { const {page,args}=await setup(t); args.provider={...provider,send:{strategy:'enter',foreground:true}}; withVisibility(page,['hidden','visible']); page.bringToFront=async () => page.effects.push('front'); assert.equal((await sendOnce(args)).state,'observed'); assert.deepEqual(page.effects,['front','type','submit']); });
test('foreground send blocks with nothing typed if the tab stays hidden', async t => { const {page,args,journal}=await setup(t); args.provider={...provider,send:{strategy:'enter',foreground:true}}; withVisibility(page,['hidden']); page.bringToFront=async () => page.effects.push('front'); assert.equal((await sendOnce(args)).state,'blocked'); assert.equal((await journal.read('req')).reason,'FOREGROUND_FAILED'); assert.deepEqual(page.effects,['front']); });
test('foreground send blocks when the driver cannot raise tabs', async t => { const {page,args,journal}=await setup(t); args.provider={...provider,send:{strategy:'enter',foreground:true}}; await sendOnce(args); assert.equal((await journal.read('req')).reason,'FOREGROUND_UNSUPPORTED'); assert.deepEqual(page.effects,[]); });
test('rich-editor extra blank lines still match; a changed character does not', async t => { const {page,args}=await setup(t); args.prompt='a\n\nb'; args.approval.payloadDigest=digestPayload(args.prompt); const ins=page.insertText.bind(page); page.insertText=async x => { await ins(x); page.draft='a\n\n\n\nb'; }; const enter=page.pressEnter.bind(page); page.pressEnter=async () => { await enter(); page.users[page.users.length-1]='a b'; }; assert.equal((await sendOnce(args)).state,'observed');
  const o=await setup(t); o.args.prompt='a\n\nb'; o.args.approval.payloadDigest=digestPayload(o.args.prompt); o.page.insertText=async x => { o.page.effects.push('type'); o.page.draft='a\n\nc'; }; assert.equal((await sendOnce(o.args)).state,'blocked'); assert.deepEqual(o.page.effects,['type']); });
test('user turn rendered from markdown (backticks dropped) is still attributable; other text is not', async t => { const {page,args}=await setup(t); args.prompt='run `node --test` now'; args.approval.payloadDigest=digestPayload(args.prompt); const enter=page.pressEnter.bind(page); page.pressEnter=async () => { await enter(); page.users[page.users.length-1]='run node --test now'; }; assert.equal((await sendOnce(args)).state,'observed');
  const o=await setup(t); o.args.prompt='run `node --test` now'; o.args.approval.payloadDigest=digestPayload(o.args.prompt); const e2=o.page.pressEnter.bind(o.page); o.page.pressEnter=async () => { await e2(); o.page.users[o.page.users.length-1]='run node --test later'; }; assert.equal((await sendOnce(o.args)).state,'uncertain'); });
test('user turn with rendered list markers and smart quotes is attributable', async t => { const {page,args}=await setup(t); args.prompt="- it's 'x'\n- ERR_A"; args.approval.payloadDigest=digestPayload(args.prompt); const enter=page.pressEnter.bind(page); page.pressEnter=async () => { await enter(); page.users[page.users.length-1]='it’s ‘x’ ERRA'; }; assert.equal((await sendOnce(args)).state,'observed'); });
test('long prompt with a collapsed/rewritten user bubble is attributable by its 1500-char prefix; a short mismatch is not', async t => { const {page,args}=await setup(t); args.prompt='word'.repeat(1000)+' tail http://x.y/z'; args.approval.payloadDigest=digestPayload(args.prompt); const enter=page.pressEnter.bind(page); page.pressEnter=async () => { await enter(); page.users[page.users.length-1]='word'.repeat(500)+'… Show more'; }; assert.equal((await sendOnce(args)).state,'observed');
  const n=await setup(t); n.args.prompt='word'.repeat(1000); n.args.approval.payloadDigest=digestPayload(n.args.prompt); const e3=n.page.pressEnter.bind(n.page); n.page.pressEnter=async () => { await e3(); n.page.users[n.page.users.length-1]='word'.repeat(500); }; assert.equal((await sendOnce(n.args)).state,'uncertain');
  const o=await setup(t); o.args.prompt='word'.repeat(1000); o.args.approval.payloadDigest=digestPayload(o.args.prompt); const e2=o.page.pressEnter.bind(o.page); o.page.pressEnter=async () => { await e2(); o.page.users[o.page.users.length-1]='word'.repeat(100); }; assert.equal((await sendOnce(o.args)).state,'uncertain'); });
test('typing check: a space before an auto-linked URL is tolerated; a removed word space is not', async t => { const {page,args}=await setup(t); args.prompt="see 'https://a.b/c'"; args.approval.payloadDigest=digestPayload(args.prompt); const ins=page.insertText.bind(page); page.insertText=async x => { await ins(x); page.draft="see ' https://a.b/c'"; }; const enter=page.pressEnter.bind(page); page.pressEnter=async () => { await enter(); page.users[page.users.length-1]=args.prompt; }; assert.equal((await sendOnce(args)).state,'observed');
  const o=await setup(t); o.args.prompt='delete file'; o.args.approval.payloadDigest=digestPayload(o.args.prompt); o.page.insertText=async x => { o.page.effects.push('type'); o.page.draft='deletefile'; }; assert.equal((await sendOnce(o.args)).state,'blocked'); });
test('prefix evidence needs a visibly truncated turn: a full-length turn that differs after the prefix is uncertain', async t => { const {page,args}=await setup(t); args.prompt='word'.repeat(1000)+' end'; args.approval.payloadDigest=digestPayload(args.prompt); const enter=page.pressEnter.bind(page); page.pressEnter=async () => { await enter(); page.users[page.users.length-1]='word'.repeat(1000)+' other text'; }; assert.equal((await sendOnce(args)).state,'uncertain'); });
test('URL-space tolerance is one-directional: a space missing before a URL blocks', async t => { const o=await setup(t); o.args.prompt='see https://a.b'; o.args.approval.payloadDigest=digestPayload(o.args.prompt); o.page.insertText=async x => { o.page.effects.push('type'); o.page.draft='seehttps://a.b'; }; assert.equal((await sendOnce(o.args)).state,'blocked'); });
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
