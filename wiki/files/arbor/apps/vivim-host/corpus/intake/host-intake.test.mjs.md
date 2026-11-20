# File: apps/vivim-host/corpus/intake/host-intake.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/corpus/intake/host-intake.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16895 B |
| Lines | 272 |
| Hash | ab734f6f36e5 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| hash | function | 8 | no | const hash = b =&gt; createHash(&#39;sha256&#39;).update(b).digest(&#39;hex&#39;); |
| key | const | 9 | no | const key = Buffer.alloc(32,0x36); |
| NOW | const | 10 | no | const NOW = Date.parse(&#39;2026-11-06T13:00:00.000Z&#39;); |
| GRANT | const | 11 | no | const GRANT = &#39;grant-owner-p0&#39;; |
| envelope | function | 12 | no | function envelope(i=1,bytes=Buffer.from(&#39;owner local evidence&#39;)) { |
| items | function | 22 | no | const items = (n=1) =&gt; Array.from({length:n},(_,i)=&gt;{const bytes=Buffer.from(&#39;owner evidence &#39;+i);return {envelope:envelope(i+1,bytes),bytes};}); |
| setup | function | 23 | no | async function setup(t) { |
| dir | const | 24 | no | const dir=await mkdtemp(path.join(tmpdir(),&#39;vivim-host-5b-&#39;)); |
| revoked | variable | 26 | no | let revoked=false, authorized=true, expire=NOW+60000, scopes=[&#39;corpus:intake&#39;]; |
| principal | const | 27 | no | const principal={verified:true,ownerId:&#39;owner-a&#39;,deviceId:&#39;phone-a&#39;,worldId:&#39;world-local&#39;,scopes,expiresAt:NOW+60000}; |
| grant | const | 28 | no | const grant={ref:GRANT,ownerId:&#39;owner-a&#39;,deviceId:&#39;phone-a&#39;,worldId:&#39;world-local&#39;,scope:&#39;corpus:raw-intake&#39;,approvedBy:&#39;owner&#39;, |
| opts | const | 33 | no | const opts={root:dir,now:()=&gt;NOW,receiptKey:key, |
| engine | const | 36 | no | const engine=createHostCorpusIntake(opts); |
| request | const | 37 | no | const request=(rows=items())=&gt;({batchId:&#39;batch-owner-00000001&#39;,session:&#39;valid-device-session&#39;,grantRef:GRANT,items:rows}); |
| committedDirs | function | 41 | no | async function committedDirs(dir){ |
| base | const | 42 | no | const base=path.join(dir,&#39;v1&#39;); |
| code | function | 45 | no | const code = r=&gt;r.receipt.code; |
| good | function | 46 | no | const good = r=&gt;{assert.equal(r.status,201);assert.equal(r.receipt.decision,&#39;authorized&#39;);assert.equal(verifyIntakeReceipt(r.receipt,key),true)}; |
| x | const | 49 | no | const x=await setup(t), rows=items(10);x.approve(rows);const r=await x.engine.acceptBatch(x.request(rows));good(r); |
| dirs | const | 51 | no | const dirs=await committedDirs(x.dir);assert.equal(dirs.length,10); |
| signed | const | 54 | no | const signed={...r.receipt,accepted:11};assert.equal(verifyIntakeReceipt(signed,key),false); |
| x | const | 59 | no | const x=await setup(t), rows=items(10);x.approve(rows);good(await x.engine.acceptBatch(x.request(rows))); |
| recovered | const | 60 | no | const recovered=createHostCorpusIntake(x.opts);const r=await recovered.acceptBatch(x.request(rows)); |
| x | const | 65 | no | const x=await setup(t);const rows=items();good(await x.engine.acceptBatch(x.request(rows))); |
| second | const | 66 | no | const second=items();second[0].envelope.title=&#39;changed title&#39;;x.approve(second);const r=await x.engine.acceptBatch(x.request(second)); |
| d | const | 68 | no | const d=(await committedDirs(x.dir))[0];assert.equal((await readFile(path.join(d,&#39;raw.bin&#39;))).toString(),&#39;owner evidence 0&#39;); |
| x | const | 72 | no | const x=await setup(t), rows=items();rows[0].bytes=Buffer.from(&#39;owner evidence X&#39;); |
| r | const | 73 | no | const r=await x.engine.acceptBatch(x.request(rows));assert.equal(code(r),&#39;DIGEST_MISMATCH&#39;); |
| x | const | 78 | no | const x=await setup(t), rows=items();good(await x.engine.acceptBatch(x.request(rows))); |
| d | const | 79 | no | const d=(await committedDirs(x.dir))[0];await writeFile(path.join(d,&#39;raw.bin&#39;),&#39;owner evidence X&#39;); |
| r | const | 80 | no | const r=await x.engine.acceptBatch(x.request(rows));assert.equal(code(r),&#39;CORRUPT_STORED_EVIDENCE&#39;); |
| x | const | 84 | no | const x=await setup(t); x.authorized(false);assert.equal(code(await x.engine.acceptBatch(x.request())),&#39;DEVICE_UNAUTHORIZED&#39;); |
| x | const | 94 | no | const x=await setup(t), req=x.request();good(await x.engine.acceptBatch(req));x.expire(NOW-1); |
| x | const | 99 | no | const x=await setup(t); |
| x | const | 109 | no | const x=await setup(t),rows=items();rows[0].envelope.source.publicUri=&#39;https://example.org/story?token=private&#39;; |
| r | const | 113 | no | const r=await x.engine.acceptBatch(x.request(rows));good(r); |
| x | const | 118 | no | const x=await setup(t),rows=items(2);rows[1].envelope.policy.sensitivity=&#39;S3&#39;;x.approve(rows); |
| r | const | 119 | no | const r=await x.engine.acceptBatch(x.request(rows));assert.equal(code(r),&#39;SCOPE_DENIED&#39;); |
| x | const | 124 | no | const x=await setup(t),rows=items();rows.push(rows[0]);x.approve(rows); |
| x | const | 129 | no | const x=await setup(t);assert.equal(code(await x.engine.acceptBatch(x.request(items(11)))),&#39;BATCH_INVALID&#39;); |
| x | const | 134 | no | const x=await setup(t), rows=items(), e=rows[0].envelope; |
| id | const | 135 | no | const id=hash(&#39;owner-a\\0world-local\\0&#39;+e.eventId),d=path.join(x.dir,&#39;v1&#39;,id); |
| r | const | 137 | no | const r=await x.engine.acceptBatch(x.request(rows));assert.equal(r.status,409);assert.equal(code(r),&#39;INTERRUPTED_REQUIRES_REVIEW&#39;); |
| x | const | 141 | no | const x=await setup(t),req=x.request();const [a,b]=await Promise.all([x.engine.acceptBatch(req),x.engine.acceptBatch(req)]); |
| x | const | 147 | no | const x=await setup(t);assert.deepEqual(Object.keys(x.engine),[&#39;acceptBatch&#39;]); |
| rows | const | 148 | no | const rows=items();assert.equal(validateOriginalEnvelope(rows[0].envelope),true); |
| x | const | 153 | no | const x=await setup(t),req=x.request();good(await x.engine.acceptBatch(req)); |
| d | const | 154 | no | const d=(await committedDirs(x.dir))[0],file=path.join(d,&#39;commit.json&#39;); |
| x | const | 160 | no | const x=await setup(t),req=x.request();good(await x.engine.acceptBatch(req)); |
| d | const | 161 | no | const d=(await committedDirs(x.dir))[0];await writeFile(path.join(d,&#39;envelope.json&#39;),&#39;{}&#39;); |
| x | const | 166 | no | const x=await setup(t),req=x.request();req.session=&#39;SECRET-BEARER-XYZ&#39;; |
| r | const | 167 | no | const r=await x.engine.acceptBatch(req);assert.equal(r.status,401); |
| x | const | 173 | no | const x=await setup(t); |
| rows | const | 175 | no | const rows=items();mutate(rows[0].envelope); |
| r | const | 176 | no | const r=await x.engine.acceptBatch(x.request(rows));assert.equal(r.receipt.decision,&#39;denied&#39;); |
| x | const | 182 | no | const x=await setup(t);x.grant.batchId=&#39;batch-other-00000001&#39;; |
| x | const | 190 | no | const x=await setup(t),req=x.request();let calls=0; |
| engine | const | 191 | no | const engine=createHostCorpusIntake({...x.opts,resolveGrant:async (ref,principal)=&gt;{ calls++;return { ...x.grant,revoked:calls&gt;1 }; }}); |
| r | const | 194 | no | const r=await engine.acceptBatch(req); |
| d | const | 196 | no | const d=(await committedDirs(x.dir))[0];await assert.rejects(readFile(path.join(d,&#39;commit.json&#39;)),{code:&#39;ENOENT&#39;}); |
| x | const | 201 | no | const x=await setup(t); |
| x | const | 212 | no | const x=await setup(t); |
| engine | const | 213 | no | const engine=createHostCorpusIntake({...x.opts,resolveGrant:async()=&gt;({...x.grant,revoked:undefined})}); |
| x | const | 218 | no | const x=await setup(t),rows=items();rows[0].envelope.policy.grantRef=null;x.approve(rows); |
| r | const | 219 | no | const r=await x.engine.acceptBatch(x.request(rows));good(r); |
| d | const | 220 | no | const d=(await committedDirs(x.dir))[0];const persisted=JSON.parse(await readFile(path.join(d,&#39;envelope.json&#39;))); |
| x | const | 225 | no | const x=await setup(t),req=x.request();good(await x.engine.acceptBatch(req)); |
| original | const | 226 | no | const original=(await committedDirs(x.dir))[0]; |
| id | const | 227 | no | const id=hash(&#39;owner-b\\0world-local\\0&#39;+req.items[0].envelope.eventId); |
| transplanted | const | 228 | no | const transplanted=path.join(x.dir,&#39;v1&#39;,id);await mkdir(transplanted); |
| x | const | 236 | no | const x=await setup(t),req=x.request();await mkdir(path.join(x.dir,&#39;v1&#39;),{recursive:true}); |
| lock | const | 237 | no | const lock=path.join(x.dir,&#39;v1&#39;,&#39;writer.lock&#39;);await writeFile(lock,&#39;crash-left writer&#39;); |
| x | const | 244 | no | const x=await setup(t),req=x.request();let calls=0; |
| engine | const | 245 | no | const engine=createHostCorpusIntake({...x.opts,authenticate:async session=&gt;{ calls++;return calls &lt; 3 &amp;&amp; session===&#39;valid-device-session&#39;?x.principal:null; }}); |
| result | const | 248 | no | const result=await engine.acceptBatch(req); |
| d | const | 250 | no | const d=(await committedDirs(x.dir))[0]; |
| x | const | 255 | no | const x=await setup(t);let calls=0; |
| engine | const | 256 | no | const engine=createHostCorpusIntake({...x.opts,resolveGrant:async()=&gt;{ calls++;return {...x.grant,revoked:false,expiresAt:calls===1?NOW+60000:NaN}; }}); |
| r | const | 259 | no | const r=await engine.acceptBatch(x.request()); |
| d | const | 261 | no | const d=(await committedDirs(x.dir))[0]; |
| x | const | 266 | no | const x=await setup(t);let calls=0; |
| engine | const | 267 | no | const engine=createHostCorpusIntake({...x.opts,resolveGrant:async()=&gt;{ calls++;return {...x.grant,revoked:false,approvedAt:calls===1?NOW-1000:NOW+10000}; }}); |
| r | const | 270 | no | const r=await engine.acceptBatch(x.request()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ./host-intake.mjs | import | 7 | [apps/vivim-host/corpus/intake/host-intake.mjs](./host-intake.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createHostCorpusIntake, verifyIntakeReceipt, validateOriginalEnvelope, corpusIntakeApprovalDigest } from './host-intake.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const key = Buffer.alloc(32,0x36);
const NOW = Date.parse('2026-11-06T13:00:00.000Z');
const GRANT = 'grant-owner-p0';
function envelope(i=1,bytes=Buffer.from('owner local evidence')) {
  return {
    schema:'vivim.corpus-intake/1',worldId:'world-local',capturedAt:'2026-11-05T12:00:00.000Z',
    eventId:'evt-pocket-'+String(i).padStart(8,'0'),assetId:'asset-pocket-'+String(i).padStart(8,'0'),
    kind:'note',title:'Owner note '+i,source:{registryId:'SRC-OWNER-INPUT',mechanism:'push',surface:'android.recorder',actor:'owner',publicUri:null},
    asset:{mediaType:'text/plain',availability:'stored',contentRef:'asset:asset-pocket-'+String(i).padStart(8,'0'),sha256:hash(bytes),bytes:bytes.length,role:'original'},
    policy:{purpose:'private-personal-ai',sensitivity:'S1',thirdParty:'none',rights:'owner_declared',ownerInitiated:true,grantRef:GRANT},
    lineage:{parents:[],evidenceRefs:[]}
  };
}
const items = (n=1) => Array.from({length:n},(_,i)=>{const bytes=Buffer.from('owner evidence '+i);return {envelope:envelope(i+1,bytes),bytes};});
async function setup(t) {
  const dir=await mkdtemp(path.join(tmpdir(),'vivim-host-5b-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  let revoked=false, authorized=true, expire=NOW+60000, scopes=['corpus:intake'];
  const principal={verified:true,ownerId:'owner-a',deviceId:'phone-a',worldId:'world-local',scopes,expiresAt:NOW+60000};
  const grant={ref:GRANT,ownerId:'owner-a',deviceId:'phone-a',worldId:'world-local',scope:'corpus:raw-intake',approvedBy:'owner',
    approvedAt:NOW-1000,expiresAt:expire,rightsReviewed:true,sensitivityReviewed:true,thirdPartyReviewed:true,
    maxSensitivity:'S2',kinds:['note','article','document'],allowUncertainRights:false,allowThirdParty:false,
    maxItems:10,maxTotalBytes:32*1024*1024,batchId:'batch-owner-00000001',
    approvedEvents:items().map(({envelope:e})=>({eventId:e.eventId,envelopeSha256:corpusIntakeApprovalDigest(e)}))};
  const opts={root:dir,now:()=>NOW,receiptKey:key,
    authenticate:async session => authorized && session==='valid-device-session'?principal:null,
    resolveGrant:async ref => ref===GRANT?{...grant,revoked,expiresAt:expire}:null};
  const engine=createHostCorpusIntake(opts);
  const request=(rows=items())=>({batchId:'batch-owner-00000001',session:'valid-device-session',grantRef:GRANT,items:rows});
  return {dir,grant,principal,engine,request,opts,revoked:v=>revoked=v,authorized:v=>authorized=v,expire:v=>expire=v,
    approve:rows=>grant.approvedEvents=rows.map(({envelope:e})=>({eventId:e.eventId,envelopeSha256:corpusIntakeApprovalDigest(e)}))};
}
async function committedDirs(dir){
  const base=path.join(dir,'v1');
  return (await readdir(base)).map(p=>path.join(base,p));
}
const code = r=>r.receipt.code;
const good = r=>{assert.equal(r.status,201);assert.equal(r.receipt.decision,'authorized');assert.equal(verifyIntakeReceipt(r.receipt,key),true)};

test('ten exact owner-authorized captures persist bytes and commit markers before signed ACK',async t=>{
  const x=await setup(t), rows=items(10);x.approve(rows);const r=await x.engine.acceptBatch(x.request(rows));good(r);
  assert.equal(r.receipt.accepted,10);
  const dirs=await committedDirs(x.dir);assert.equal(dirs.length,10);
  for(const dir of dirs){const record=JSON.parse(await readFile(path.join(dir,'commit.json')));const raw=await readFile(path.join(dir,'raw.bin'));
    assert.equal(record.schema,'vivim.host-raw-record/1');assert.equal(hash(raw),record.sha256);}
  const signed={...r.receipt,accepted:11};assert.equal(verifyIntakeReceipt(signed,key),false);
  assert(!JSON.stringify(r).includes('valid-device-session')); assert(!JSON.stringify(r).includes(GRANT));
});

test('replaying same ten records after restart makes zero new logical commits',async t=>{
  const x=await setup(t), rows=items(10);x.approve(rows);good(await x.engine.acceptBatch(x.request(rows)));
  const recovered=createHostCorpusIntake(x.opts);const r=await recovered.acceptBatch(x.request(rows));
  assert.equal(r.status,200);assert.equal(r.receipt.accepted,0);assert.equal(r.receipt.duplicates,10);assert.equal((await committedDirs(x.dir)).length,10);
});

test('altered event under same identity refuses without rewriting accepted raw',async t=>{
  const x=await setup(t);const rows=items();good(await x.engine.acceptBatch(x.request(rows)));
  const second=items();second[0].envelope.title='changed title';x.approve(second);const r=await x.engine.acceptBatch(x.request(second));
  assert.equal(r.status,409);assert.equal(code(r),'ALTERED_REPLAY');
  const d=(await committedDirs(x.dir))[0];assert.equal((await readFile(path.join(d,'raw.bin'))).toString(),'owner evidence 0');
});

test('tampered bytes and same-length changed bytes rejected before any write',async t=>{
  const x=await setup(t), rows=items();rows[0].bytes=Buffer.from('owner evidence X');
  const r=await x.engine.acceptBatch(x.request(rows));assert.equal(code(r),'DIGEST_MISMATCH');
  await assert.rejects(readdir(path.join(x.dir,'v1')),{code:'ENOENT'});
});

test('corrupted durable raw refuses duplicate ACK',async t=>{
  const x=await setup(t), rows=items();good(await x.engine.acceptBatch(x.request(rows)));
  const d=(await committedDirs(x.dir))[0];await writeFile(path.join(d,'raw.bin'),'owner evidence X');
  const r=await x.engine.acceptBatch(x.request(rows));assert.equal(code(r),'CORRUPT_STORED_EVIDENCE');
```

_First 80 of 273 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
