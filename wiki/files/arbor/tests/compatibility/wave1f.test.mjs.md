# File: tests/compatibility/wave1f.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/compatibility/wave1f.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4835 B |
| Lines | 67 |
| Hash | dffbe96324ae |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| load | function | 7 | no | const load=p=&gt;JSON.parse(readFileSync(new URL(p,import.meta.url),&#39;utf8&#39;)); |
| source | const | 9 | no | const source=load(&#39;synthetic-projections.v1.json&#39;); |
| f | const | 29 | no | const f=load(&#39;../fixtures/labs/voice-to-tasks/fixtures.json&#39;); |
| phases | const | 32 | no | const phases=[&#39;captured_local&#39;,&#39;queued&#39;,&#39;transcribed&#39;,&#39;proposed&#39;,&#39;reviewed&#39;,&#39;committed&#39;,&#39;reopened&#39;]; |
| trace | const | 33 | no | const trace=phases.map((action,i)=&gt;({noteId:&#39;synthetic-note&#39;,ownerId:&#39;synthetic-owner&#39;,source:i===5?&#39;host&#39;:&#39;desktop&#39;,action,revision:i+1,...(i===4?{approvedProposalIds:[&#39;vp-one&#39;]}:{}),...(i===5?{rece… |
| seed | const | 38 | no | const seed=load(&#39;../fixtures/labs/capability-observatory/seed.json&#39;); |
| schema | const | 39 | no | const schema=load(&#39;../fixtures/labs/capability-observatory/schema.json&#39;); |
| truth | const | 43 | no | const truth=load(&#39;../../capability-spaces/source-truth.v1.json&#39;); |
| c | const | 48 | no | const c=load(&#39;../../contracts/chronos/staged-contract.v1.json&#39;); |
| path | const | 54 | no | const path=fileURLToPath(new URL(&#39;../../apps/vivim-host/control/action-catalog.v1.json&#39;,import.meta.url)); |
| catalog | const | 56 | no | const catalog=JSON.parse(readFileSync(path,&#39;utf8&#39;)),baseline=load(&#39;host-actions.baseline.v1.json&#39;); |
| now | const | 62 | no | const now=new Map(catalog.actions.map(a=&gt;[a.id,{id:a.id,risk:a.risk,readiness:a.readiness}])); |
| regressed | const | 63 | no | const regressed=baseline.actions.filter(b=&gt;!now.has(b.id)\|\|now.get(b.id).risk!==b.risk\|\|now.get(b.id).readiness!==b.readiness); |
| added | const | 65 | no | const added=catalog.actions.filter(a=&gt;!baseline.actions.some(b=&gt;b.id===a.id)).map(a=&gt;a.id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:url | import | 4 | external |
| ../../contracts/interop/v1/validate.mjs | import | 5 | [contracts/interop/v1/validate.mjs](../../contracts/interop/v1/validate.mjs.md) |
| ../fixtures/labs/voice-to-tasks/trace-check.mjs | import | 6 | [tests/fixtures/labs/voice-to-tasks/trace-check.mjs](../fixtures/labs/voice-to-tasks/trace-check.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {isSourceRef,isEvidenceRef,canDisplayProjection,projectHostJournalState,HOST_EFFECT_STATES,GRADUATION_STATES} from '../../contracts/interop/v1/validate.mjs';
import {verifyObservedTrace} from '../fixtures/labs/voice-to-tasks/trace-check.mjs';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
test('interop and taxonomy remain read-only',()=>{
 const source=load('synthetic-projections.v1.json');
 assert.equal(isSourceRef(source.source),true);
 assert.equal(isSourceRef(source.unownedPersonal),false);
 assert.equal(isEvidenceRef({source:source.source,digest:'a'.repeat(64),confidence:'source-observed'}),true);
 assert.equal(canDisplayProjection(source.grounded,source.source),true);
 assert.equal(canDisplayProjection(source.grounded,source.stale),false);
 assert.equal(canDisplayProjection(source.grounded,source.wrongOwner),false);
 assert.equal(canDisplayProjection({...source.grounded,inert:false},source.source),false);
 assert.equal(GRADUATION_STATES.length,6);
 assert.deepEqual(HOST_EFFECT_STATES,['planned','approved','uncertain','applied','failed']);
});
test('exclusive Host claim without receipt is uncertain and never success',()=>{
 assert.equal(projectHostJournalState(), 'planned');
 assert.equal(projectHostJournalState({approval:true}), 'approved');
 assert.equal(projectHostJournalState({claimed:true}), 'uncertain');
 assert.equal(projectHostJournalState({claimed:true,receipt:{status:'applied'}}), 'applied');
 assert.equal(projectHostJournalState({claimed:true,receipt:{status:'failed'}}), 'failed');
 assert.equal(projectHostJournalState({receipt:{status:'applied'}}),'uncertain');
});
test('source-side synthetic voice traces remain non-authoritative',()=>{
 const f=load('../fixtures/labs/voice-to-tasks/fixtures.json');
 assert.equal(f.length,10);
 assert.ok(f.some(x=>x.name==='en-negation' && x.expectedActions.length===0));
 const phases=['captured_local','queued','transcribed','proposed','reviewed','committed','reopened'];
 const trace=phases.map((action,i)=>({noteId:'synthetic-note',ownerId:'synthetic-owner',source:i===5?'host':'desktop',action,revision:i+1,...(i===4?{approvedProposalIds:['vp-one']}:{}),...(i===5?{receiptId:'receipt:synthetic'}:{})}));
 assert.equal(verifyObservedTrace(trace).passed,true);
 assert.throws(()=>verifyObservedTrace(trace.map(e=>e.action==='committed'?{...e,source:'android'}:e)),{code:'TRACE_HOST_COMMIT_REQUIRED'});
});
test('Labs observatory seed does not assert shipping capability',()=>{
 const seed=load('../fixtures/labs/capability-observatory/seed.json');
 const schema=load('../fixtures/labs/capability-observatory/schema.json');
 assert.ok(seed.length>=10);
 assert.ok(seed.every(x=>x.capability_id.startsWith('cap:')&&x.source_refs.length>0));
 assert.equal(schema.type,'array');
 const truth=load('../../capability-spaces/source-truth.v1.json');
 assert.equal(truth.releaseAvailableNow.length,0);
 assert.ok(truth.items.every(i=>i.releaseReady===false && GRADUATION_STATES.includes(i.status)));
});
test('Chronos is staged, due neither approves nor executes',()=>{
 const c=load('../../contracts/chronos/staged-contract.v1.json');
 assert.equal(c.status,'staged_not_activated');
 assert.equal(c.nonAuthority.dueIsGrant,false);
 assert.equal(c.nonAuthority.uiCanExecute,false);
});
test('Host ID/risk/readiness continuity after lane B import',t=>{
 const path=fileURLToPath(new URL('../../apps/vivim-host/control/action-catalog.v1.json',import.meta.url));
 if(!existsSync(path))return t.skip('Lane B Host not imported on this isolated worker branch');
 const catalog=JSON.parse(readFileSync(path,'utf8')),baseline=load('host-actions.baseline.v1.json');
 // Continuity, not equality: the catalog legitimately grows, so extra actions are
 // reported, never failed. The guarantee is that no baselined action lost or changed
 // its id/risk/readiness. (Same rule as the oracle's binding §2 catalog ruling.)
 assert.ok(Number.isInteger(catalog.version)&&catalog.version>=baseline.catalogVersion,
  'catalog version must not regress below the compatibility baseline');
 const now=new Map(catalog.actions.map(a=>[a.id,{id:a.id,risk:a.risk,readiness:a.readiness}]));
 const regressed=baseline.actions.filter(b=>!now.has(b.id)||now.get(b.id).risk!==b.risk||now.get(b.id).readiness!==b.readiness);
 assert.deepEqual(regressed,[],'baselined Host actions must keep their id/risk/readiness');
 const added=catalog.actions.filter(a=>!baseline.actions.some(b=>b.id===a.id)).map(a=>a.id);
 if(added.length)process.stdout.write('wave1f: catalog added '+added.length+' action(s): '+added.join(', ')+'\n');
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
