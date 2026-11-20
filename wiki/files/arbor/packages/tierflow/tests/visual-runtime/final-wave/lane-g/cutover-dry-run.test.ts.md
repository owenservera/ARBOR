# File: packages/tierflow/tests/visual-runtime/final-wave/lane-g/cutover-dry-run.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/lane-g/cutover-dry-run.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 12542 B |
| Lines | 177 |
| Hash | 5e8c3fb4d4fc |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| H | function | 10 | no | const H = (letter = &#39;a&#39;) =&gt; `sha256:${letter.repeat(64)}` as `sha256:${string}`; |
| S | function | 11 | no | const S = (letter = &#39;a&#39;) =&gt; letter.repeat(40); |
| migration | function | 12 | no | function migration(): MigrationInput { |
| change | function | 29 | no | const change = (input: MigrationInput, delta: Record&lt;string, unknown&gt;) =&gt; ({...input,...delta}) as MigrationInput; |
| failed | function | 30 | no | const failed = (result: {ok:boolean}, code:string) =&gt; {assert.equal(result.ok,false);assert.ok(!result.ok &amp;&amp; &#39;blockers&#39; in result &amp;&amp; (result.blockers as string[]).includes(code), code)}; |
| frame | function | 31 | no | const frame = (viewport: 320\|360\|1280): ShadowFrame =&gt; ({ viewport,ownerRef:&#39;owner&#39;,worldRef:&#39;world-local&#39;,sourceVersion:&#39;host-1&#39;, sourceHash:H(&#39;b&#39;),activeRevision:1,semanticDigest:H(&#39;c&#39;),actionDiges… |
| shadows | function | 34 | no | const shadows = () =&gt; ({legacy:[frame(320),frame(360),frame(1280)],canonical:[frame(320),frame(360),frame(1280)]}); |
| control | function | 35 | no | const control = (): PublisherControl =&gt; ({ownerRef:&#39;owner&#39;,worldRef:&#39;world-local&#39;,documentId:&#39;founder-home&#39;,namespace:&#39;founder-workspace&#39;, phase:&#39;DRAINING&#39;,writer:&#39;host-bootstrap-legacy&#39;,epoch:8,cont… |
| observed | function | 37 | no | const observed = (): FenceObservation =&gt; ({expectedEpoch:8,expectedControlRevision:17,ownerRef:&#39;owner&#39;,worldRef:&#39;world-local&#39;, documentId:&#39;founder-home&#39;,namespace:&#39;founder-workspace&#39;,desiredWriter:&#39;t… |
| rollback | function | 41 | no | const rollback = (): RollbackInput =&gt; ({control:{...control(),phase:&#39;OBSERVING&#39;,writer:&#39;tierflow-canonical&#39;}, expectedEpoch:8,expectedControlRevision:17,outstandingCanonicalClaims:0,uncertainOutcomes… |
| at | function | 47 | no | function at&lt;T&gt;(items:readonly T[],index:number):T{const item=items[index];assert.ok(item!==undefined);return item;} |
| r | const | 52 | no | const r=makeShadowMigrationPlan(migration());assert.ok(r.ok);if(r.ok){assert.equal(r.value.activeRevision,1);assert.equal(r.value.maxHistoricalRevision,3); |
| a | const | 56 | no | const a=makeShadowMigrationPlan(migration()), b=makeShadowMigrationPlan(migration()); |
| i | const | 60 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{snapshot:{...i.snapshot,activeRevision:4}})),&#39;INVALID_HISTORY_HEAD&#39;); |
| i | const | 63 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{snapshot:{...i.snapshot,activeRevision:0}})),&#39;ACTIVE_AND_MAX_HISTORY_DIVERGE&#39;); |
| i | const | 66 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{aliases:i.aliases.slice(0,2)})),&#39;INCOMPLETE_HISTORY&#39;); |
| i | const | 69 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{aliases:[i.aliases[0],{...i.aliases[1],targetRevision:1},i.aliases[2]]})),&#39;UNSAFE_OR_COLLIDING_ALIAS&#39;); |
| i | const | 72 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{aliases:[{...i.aliases[0],legacyId:&#39;wrong&#39;},...i.aliases.slice(1)]})),&#39;UNSAFE_OR_COLLIDING_ALIAS&#39;); |
| i | const | 75 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{target:{...i.target,ownerRef:&#39;other&#39;}})),&#39;SCOPE_OR_VERSION_MISMATCH&#39;); |
| i | const | 78 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{target:{...i.target,sourceVersion:&#39;host-2&#39;}})),&#39;SCOPE_OR_VERSION_MISMATCH&#39;); |
| i | const | 81 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{readerCompatibility:{...i.readerCompatibility,sourceReaderRetained:false}})),&#39;ROLLBACK_READER_MISSING&#39;); |
| i | const | 84 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{pin:{...i.pin,hqSha:&#39;HEAD&#39;}})),&#39;UNPINNED_SOURCE&#39;); |
| i | const | 87 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{target:{...i.target,schema:&#39;vivim.ui-document/2&#39;}})),&#39;UNSUPPORTED_SCHEMA&#39;); |
| i | const | 90 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{snapshot:{...i.snapshot,history:[i.snapshot.history[0], {...i.snapshot.history[1],parentRevision:9},i.snapshot.history[2]]}})),&#39;BROKEN_HIS… |
| r | const | 94 | no | const r=compareShadowSnapshots(shadows());assert.ok(r.ok);if(r.ok)assert.equal(r.value.result,&#39;EQUIVALENT_FIXTURE_ONLY&#39;); |
| s | const | 97 | no | const s=shadows();s.canonical[0]={...at(s.canonical,0),privacyDigest:H(&#39;e&#39;)};failed(compareShadowSnapshots(s),&#39;SHADOW_320_privacyDigest_MISMATCH&#39;); |
| s | const | 100 | no | const s=shadows();s.canonical=s.canonical.filter(x=&gt;x.viewport!==360);failed(compareShadowSnapshots(s),&#39;MISSING_OR_DUPLICATE_VIEWPORT_360&#39;); |
| s | const | 103 | no | const s=shadows();s.canonical[1]={...at(s.canonical,1),tombstoneDigest:H(&#39;e&#39;)};failed(compareShadowSnapshots(s),&#39;SHADOW_360_tombstoneDigest_MISMATCH&#39;); |
| s | const | 106 | no | const s=shadows();s.canonical[2]={...at(s.canonical,2),actionDigest:H(&#39;e&#39;)};failed(compareShadowSnapshots(s),&#39;SHADOW_1280_actionDigest_MISMATCH&#39;); |
| r | const | 109 | no | const r=assessPublisherFence(control(),observed());assert.ok(r.ok);if(r.ok)assert.equal(r.value.safeToActivateHere,false); |
| r | const | 136 | no | const r=rehearseRollback(rollback());assert.ok(r.ok);if(r.ok){assert.equal(r.value.writerAfterDryRun,&#39;none&#39;); |
| i | const | 159 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{snapshot:{...i.snapshot,history:[i.snapshot.history[0], {...i.snapshot.history[2],revision:3}]},aliases:[i.aliases[0],i.aliases[2]]})),&#39;IN… |
| i | const | 163 | no | const i=migration();failed(makeShadowMigrationPlan(change(i,{aliases:[{...i.aliases[0],targetRevision:9}, {...i.aliases[1],targetRevision:8},i.aliases[2]]})),&#39;UNSAFE_OR_COLLIDING_ALIAS&#39;); |
| s | const | 167 | no | const s=shadows();s.canonical[1]={...at(s.canonical,1),worldRef:&#39;other&#39;}; |
| r | const | 175 | no | const r=makeShadowMigrationPlan(migration());assert.ok(r.ok); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../../../../src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts | import | 4 | [packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts](../../../../src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** Lane G synthetic, side-effect-free tests. NEVER physical device/Host fence proof. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LANE_G_ACTIVATION, makeShadowMigrationPlan, compareShadowSnapshots,
  assessPublisherFence, rehearseRollback,
  type MigrationInput, type ShadowFrame, type PublisherControl, type FenceObservation,
  type RollbackInput,
} from '../../../../src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts';
const H = (letter = 'a') => `sha256:${letter.repeat(64)}` as `sha256:${string}`;
const S = (letter = 'a') => letter.repeat(40);
function migration(): MigrationInput {
  return {
    snapshot: { schema:'vivim.legacy-ui-snapshot/1',ownerRef:'owner',worldRef:'world-local',documentId:'founder-home',
      namespace:'founder-workspace',sourceSchema:'vivim.ui-revision/1',sourceVersion:'host-1',
      sourceHash:H('b'),sourceCursor:'cursor-3',activeRevision:1,maxHistoricalRevision:3,
      sourceReaderVersion:'host-v1',history:[
        {revision:1,sourceId:'rev-1',digest:H('c'),parentRevision:null,status:'applied'},
        {revision:2,sourceId:'rev-2',digest:H('d'),parentRevision:1,status:'superseded'},
        {revision:3,sourceId:'rev-3',digest:H('e'),parentRevision:2,status:'reverted'}
      ]},
    target:{schema:'vivim.ui-document/1',documentId:'founder-home',ownerRef:'owner',sourceVersion:'host-1',expectedRevision:0,documentDigest:H('f')},
    aliases:[{legacyRevision:1,targetRevision:1,legacyId:'rev-1'},{legacyRevision:2,targetRevision:2,legacyId:'rev-2'},
      {legacyRevision:3,targetRevision:3,legacyId:'rev-3'}],
    readerCompatibility:{sourceReaderRetained:true,targetReaderVersion:'canon-v1'},
    pin:{tierflowSha:S('a'),harnessSha:S('b'),hqSha:S('c')}
  };
}
const change = (input: MigrationInput, delta: Record<string, unknown>) => ({...input,...delta}) as MigrationInput;
const failed = (result: {ok:boolean}, code:string) => {assert.equal(result.ok,false);assert.ok(!result.ok && 'blockers' in result && (result.blockers as string[]).includes(code), code)};
const frame = (viewport: 320|360|1280): ShadowFrame => ({ viewport,ownerRef:'owner',worldRef:'world-local',sourceVersion:'host-1',
  sourceHash:H('b'),activeRevision:1,semanticDigest:H('c'),actionDigest:H('d'),accessibilityDigest:H('e'),
  privacyDigest:H('f'),tombstoneDigest:H('a'),visualDigest:H('1') });
const shadows = () => ({legacy:[frame(320),frame(360),frame(1280)],canonical:[frame(320),frame(360),frame(1280)]});
const control = (): PublisherControl => ({ownerRef:'owner',worldRef:'world-local',documentId:'founder-home',namespace:'founder-workspace',
  phase:'DRAINING',writer:'host-bootstrap-legacy',epoch:8,controlRevision:17});
const observed = (): FenceObservation => ({expectedEpoch:8,expectedControlRevision:17,ownerRef:'owner',worldRef:'world-local',
  documentId:'founder-home',namespace:'founder-workspace',desiredWriter:'tierflow-canonical',oldIngressClosed:true,
  oldInFlight:0,uncertainClaims:0,hostFenceDurable:true,heldThroughCommit:true,legacyRestartDenied:true,
  sourcePinsMatch:true,integration5GO:true,explicitOwnerApproval:true,deviceAcceptance:true,rollbackRehearsed:true});
const rollback = (): RollbackInput => ({control:{...control(),phase:'OBSERVING',writer:'tierflow-canonical'},
  expectedEpoch:8,expectedControlRevision:17,outstandingCanonicalClaims:0,uncertainOutcomes:0,legacyReaderRetained:true,
  newRevisions:[{revision:4,digest:H('c')},{revision:5,digest:H('d')}],
  exportedRevisions:[{revision:4,digest:H('c')},{revision:5,digest:H('d')}],inverseConversionLossless:true,previousSourceHash:H('b')});

/** Indexed access that asserts presence instead of relying on a possibly-undefined value. */
function at<T>(items:readonly T[],index:number):T{const item=items[index];assert.ok(item!==undefined);return item;}
test('G01 never has activation, effect, grant or migration authority',()=>{
  assert.deepEqual(LANE_G_ACTIVATION,{canPublish:false,canMigrateLiveData:false,canGrantPermit:false,canDispatchEffects:false});
});
test('G02 pure manifest preserves active revision separate from maximum historical revision',()=>{
  const r=makeShadowMigrationPlan(migration());assert.ok(r.ok);if(r.ok){assert.equal(r.value.activeRevision,1);assert.equal(r.value.maxHistoricalRevision,3);
    assert.equal(r.value.history[2]?.status,'reverted');assert.equal(r.value.authority,'none');assert.equal(r.value.phase,'SHADOW');}
});
test('G03 manifest stable on repeated dry run',()=>{
  const a=makeShadowMigrationPlan(migration()), b=makeShadowMigrationPlan(migration());
  assert.ok(a.ok&&b.ok);if(a.ok&&b.ok) assert.equal(a.value.manifestDigest,b.value.manifestDigest);
});
test('G04 rejects active head beyond historical maximum',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{snapshot:{...i.snapshot,activeRevision:4}})),'INVALID_HISTORY_HEAD');
});
test('G05 rejects missing active ancestor and incomplete history',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{snapshot:{...i.snapshot,activeRevision:0}})),'ACTIVE_AND_MAX_HISTORY_DIVERGE');
});
test('G06 rejects missing source revision alias',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{aliases:i.aliases.slice(0,2)})),'INCOMPLETE_HISTORY');
});
test('G07 rejects alias collision instead of reusing target revisions',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{aliases:[i.aliases[0],{...i.aliases[1],targetRevision:1},i.aliases[2]]})),'UNSAFE_OR_COLLIDING_ALIAS');
});
test('G08 rejects mismatched source mapping IDs',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{aliases:[{...i.aliases[0],legacyId:'wrong'},...i.aliases.slice(1)]})),'UNSAFE_OR_COLLIDING_ALIAS');
});
test('G09 rejects foreign World / owner document',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{target:{...i.target,ownerRef:'other'}})),'SCOPE_OR_VERSION_MISMATCH');
});
test('G10 rejects source version drift',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{target:{...i.target,sourceVersion:'host-2'}})),'SCOPE_OR_VERSION_MISMATCH');
});
test('G11 refuses absent legacy rollback reader',()=>{
```

_First 80 of 178 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
