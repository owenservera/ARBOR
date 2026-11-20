# File: tests/hq-version-intelligence/g2-host-ui.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/hq-version-intelligence/g2-host-ui.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9497 B |
| Lines | 167 |
| Hash | a380cb01502a |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| request | function | 13 | no | const request=()=&gt;({schema:HVI_HOST_REQUEST_SCHEMA,targetIndex:2, sources:[&#39;v1&#39;,&#39;v2&#39;,&#39;v3&#39;].map(ref=&gt;({repo:&#39;synthetic/g2-fixture&#39;,ref}))}); |
| port | function | 15 | no | const port=overrides=&gt;createHviHostReadPort({actorId:&#39;synthetic-owner&#39;,sessionId:&#39;synthetic-local&#39;, approvedRepositories:[&#39;synthetic/g2-fixture&#39;], verifySession:()=&gt;true,verifyGrant:()=&gt;true,enabled:… |
| fixture | const | 20 | no | const fixture=syntheticSource();let reads=0; |
| out | const | 21 | no | const out=await port({verifyGrant:()=&gt;{reads++;return true;}}) |
| view | const | 33 | no | const view=projectHviInspector({envelope:out.inspector,synthetic:true}); |
| ui | const | 37 | no | const ui=renderHviInspector({envelope:out.inspector,synthetic:true, previewSynthetic:true,expectedRevision:7,currentRevision:7}); |
| fixture | const | 45 | no | const fixture=syntheticSource(); |
| fixture | const | 51 | no | const fixture=syntheticSource(); |
| out | const | 57 | no | const out=await port().invoke(request(),{adapter:syntheticSource().adapter}); |
| c | const | 58 | no | const c=out.inspector.originalComparison; |
| repos | const | 73 | no | const repos=Array.from({length:5},(_,i)=&gt;&#39;synthetic/g2-invented-&#39;+i); |
| sources | const | 74 | no | const sources=repos.map((repo,i)=&gt;({repo,ref:[&#39;v1&#39;,&#39;v2&#39;,&#39;v3&#39;,&#39;v1&#39;,&#39;v2&#39;][i]})); |
| fixture | const | 75 | no | const fixture=syntheticSource(); |
| out | const | 76 | no | const out=await port({approvedRepositories:repos}).invoke( {schema:HVI_HOST_REQUEST_SCHEMA,sources,targetIndex:4}, {adapter:fixture.adapter}); |
| fixture | const | 89 | no | const fixture=syntheticSource({malicious:{ path:&#39;private/invented.key&#39;,mode:&#39;100644&#39;,type:&#39;blob&#39;, sha:&#39;eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&#39;,size:12, }}); |
| authorize | function | 93 | no | const authorize=()=&gt;true; |
| pin | const | 94 | no | const pin=await resolvePin({provider:&#39;github&#39;,repo:&#39;synthetic/g2-fixture&#39;, ref:&#39;v1&#39;,approvedScope:&#39;development&#39;}, {adapter:fixture.adapter,authorize}); |
| manifest | const | 96 | no | const manifest=await snapshotAt(pin,{adapter:fixture.adapter,authorize, inspectContent:false}); |
| blocked | const | 98 | no | const blocked=manifest.entries.find(e=&gt;e.path===&#39;private/invented.key&#39;); |
| fixture | const | 106 | no | const fixture=syntheticSource({malicious:{ path:&#39;private/invented.key&#39;,mode:&#39;100644&#39;,type:&#39;blob&#39;, sha:&#39;eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&#39;,size:12, }}); |
| out | const | 110 | no | const out=await port().invoke(request(),{adapter:fixture.adapter}); |
| serialized | const | 111 | no | const serialized=JSON.stringify(out); |
| forbidden | const | 120 | no | const forbidden=syntheticSource(); |
| cancelled | const | 124 | no | const cancelled=syntheticSource(); |
| fixture | const | 149 | no | const fixture=syntheticSource(), authorize=()=&gt;true; |
| bridges | const | 150 | no | const bridges=[]; |
| pin | const | 152 | no | const pin=await resolvePin({provider:&#39;github&#39;,repo:&#39;synthetic/g2-fixture&#39;, ref,approvedScope:&#39;development&#39;}, {adapter:fixture.adapter,authorize}); |
| hostile | const | 157 | no | const hostile={...bridges[0].manifest,entries:[...bridges[0].manifest.entries, |
| hostilePin | const | 162 | no | const hostilePin={...bridges[0].pin,manifestDigest:hostile.digest}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 6 | external |
| node:assert/strict | import | 7 | external |
| ../../apps/vivim-host/control/hvi-capability.mjs | import | 8 | [apps/vivim-host/control/hvi-capability.mjs](../../apps/vivim-host/control/hvi-capability.mjs.md) |
| ../../hq/version-intelligence/sources/fixtures.mjs | import | 9 | [hq/version-intelligence/sources/fixtures.mjs](../../hq/version-intelligence/sources/fixtures.mjs.md) |
| ../../packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs | import | 10 | [packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs](../../packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs.md) |
| ../../packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs | import | 11 | [packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs](../../packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs.md) |
| ../../hq/version-intelligence/sources/snapshots.mjs | dynamic | 88 | [hq/version-intelligence/sources/snapshots.mjs](../../hq/version-intelligence/sources/snapshots.mjs.md) |
| ../../hq/version-intelligence/sources/common.mjs | dynamic | 131 | [hq/version-intelligence/sources/common.mjs](../../hq/version-intelligence/sources/common.mjs.md) |
| ../../hq/version-intelligence/sources/snapshots.mjs | dynamic | 144 | [hq/version-intelligence/sources/snapshots.mjs](../../hq/version-intelligence/sources/snapshots.mjs.md) |
| ../../hq/version-intelligence/integration/source-manifest-adapter.mjs | dynamic | 146 | [hq/version-intelligence/integration/source-manifest-adapter.mjs](../../hq/version-intelligence/integration/source-manifest-adapter.mjs.md) |
| ../../hq/version-intelligence/compare/index.mjs | dynamic | 148 | [hq/version-intelligence/compare/index.mjs](../../hq/version-intelligence/compare/index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * G2: executable synthetic Host -> sanitized metadata -> inert TierFlow seam.
 * No real repository, donor, token, provider, browser, or personal source IO.
 * This must run on a checked-out Node24 test runner before G2 acceptance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHviHostReadPort, HVI_HOST_REQUEST_SCHEMA } from '../../apps/vivim-host/control/hvi-capability.mjs';
import { syntheticSource, SYNTHETIC_SHAS } from '../../hq/version-intelligence/sources/fixtures.mjs';
import { projectHviInspector } from '../../packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs';
import { renderHviInspector } from '../../packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs';

const request=()=>({schema:HVI_HOST_REQUEST_SCHEMA,targetIndex:2,
  sources:['v1','v2','v3'].map(ref=>({repo:'synthetic/g2-fixture',ref}))});
const port=overrides=>createHviHostReadPort({actorId:'synthetic-owner',sessionId:'synthetic-local',
  approvedRepositories:['synthetic/g2-fixture'],
  verifySession:()=>true,verifyGrant:()=>true,enabled:true,...overrides});

test('synthetic 3-SHA local Host analysis produces redacted typed U DTO without live publishing',async()=>{
  const fixture=syntheticSource();let reads=0;
  const out=await port({verifyGrant:()=>{reads++;return true;}})
    .invoke(request(),{adapter:fixture.adapter});
  assert.equal(out.report.sourcePins.length,3);
  assert.equal(out.report.sourcePins[2].resolvedCommitSha,SYNTHETIC_SHAS.v3);
  assert.equal(out.inspector.schema,'arbor.hvi.adapter.comparison-report/1');
  assert.equal(out.inspector.privacy,'METADATA_ONLY_REDACTED');
  assert.equal(out.inspector.syntheticPreviewAllowed,false);
  assert.equal(out.inspector.runtimeAccepted,false);
  assert.ok(reads>=20,'grants were checked during source reads, comparison and UI projection');
  assert.ok(!JSON.stringify(out).includes('MUST_NOT_READ_SECRET'));
  assert.ok(!JSON.stringify(out).includes('.env.production'));
  assert.ok(!JSON.stringify(out).includes('synthetic-local'));
  const view=projectHviInspector({envelope:out.inspector,synthetic:true});
  assert.equal(view.pins.length,3);
  assert.equal(view.runtimeVerified,false);
  assert.equal(view.canApply,false);
  const ui=renderHviInspector({envelope:out.inspector,synthetic:true,
    previewSynthetic:true,expectedRevision:7,currentRevision:7});
  assert.equal(ui.mode,'unavailable','live result cannot masquerade as a synthetic preview');
  assert.equal(ui.published,false);
  assert.equal(ui.effectsInvoked,false);
  assert.equal(fixture.calls.blobs.length,0);
});
test('revocation specifically during final H -> U projection suppresses entire result',async()=>{
  const fixture=syntheticSource();
  await assert.rejects(port({verifyGrant:ctx=>
    ctx.operation!=='hvi.inspector.before-return'})
    .invoke(request(),{adapter:fixture.adapter}),{code:'SOURCE_UNAUTHORIZED'});
});
test('missing exact development-source grant denies before Git object source reads',async()=>{
  const fixture=syntheticSource();
  await assert.rejects(port({verifyGrant:()=>false})
    .invoke(request(),{adapter:fixture.adapter}),{code:'SOURCE_UNAUTHORIZED'});
  assert.equal(fixture.calls.refs.length,0);
});
test('reused same-repository pins never imply runtime or semantic equivalence',async()=>{
  const out=await port().invoke(request(),{adapter:syntheticSource().adapter});
  const c=out.inspector.originalComparison;
  assert.equal(new Set(c.sourcePins.map(p=>p.pinId)).size,3);
  assert.equal(new Set(c.sourcePins.map(p=>p.repoIdentity)).size,1);
  // The C comparison envelope is canonically ordered by pinId (compare/index.mjs
  // `cleanPins = ordered(...)`), so request order is NOT preserved here. Assert the
  // three distinct revisions by value, and pin the canonical ordering itself.
  assert.deepEqual(c.sourcePins.map(p=>p.pinId),[...c.sourcePins.map(p=>p.pinId)].sort());
  assert.deepEqual([...new Set(c.sourcePins.map(p=>p.resolvedCommitSha))].sort(),
    [SYNTHETIC_SHAS.v1,SYNTHETIC_SHAS.v2,SYNTHETIC_SHAS.v3].sort());
  assert.ok(c.sourceDeltas.every(r=>r.state!=='RUNTIME_VERIFIED'));
  assert.equal(out.remoteAccepted,false);
  assert.equal(out.runtimeAccepted,false);
});

test('five invented repositories resolve distinct exact pins without implicit HEAD',async()=>{
  const repos=Array.from({length:5},(_,i)=>'synthetic/g2-invented-'+i);
  const sources=repos.map((repo,i)=>({repo,ref:['v1','v2','v3','v1','v2'][i]}));
  const fixture=syntheticSource();
  const out=await port({approvedRepositories:repos}).invoke(
    {schema:HVI_HOST_REQUEST_SCHEMA,sources,targetIndex:4},
    {adapter:fixture.adapter});
  assert.equal(out.inspector.originalComparison.sourcePins.length,5);
  assert.equal(new Set(out.inspector.originalComparison.sourcePins.map(p=>p.pinId)).size,5);
```

_First 80 of 168 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
