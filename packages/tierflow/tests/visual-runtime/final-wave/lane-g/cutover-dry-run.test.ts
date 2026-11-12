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
  const i=migration();failed(makeShadowMigrationPlan(change(i,{readerCompatibility:{...i.readerCompatibility,sourceReaderRetained:false}})),'ROLLBACK_READER_MISSING');
});
test('G12 refuses unpinned source repos',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{pin:{...i.pin,hqSha:'HEAD'}})),'UNPINNED_SOURCE');
});
test('G13 refuses newer/unknown target schema',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{target:{...i.target,schema:'vivim.ui-document/2'}})),'UNSUPPORTED_SCHEMA');
});
test('G14 refuses a broken parent/undo lineage',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{snapshot:{...i.snapshot,history:[i.snapshot.history[0],
    {...i.snapshot.history[1],parentRevision:9},i.snapshot.history[2]]}})),'BROKEN_HISTORY_ANCESTRY');
});
test('G15 three viewport shadow fixtures match without claiming native proof',()=>{
  const r=compareShadowSnapshots(shadows());assert.ok(r.ok);if(r.ok)assert.equal(r.value.result,'EQUIVALENT_FIXTURE_ONLY');
});
test('G16 mismatched phone private projection blocks',()=>{
  const s=shadows();s.canonical[0]={...at(s.canonical,0),privacyDigest:H('e')};failed(compareShadowSnapshots(s),'SHADOW_320_privacyDigest_MISMATCH');
});
test('G17 missing Android 360 parity blocks',()=>{
  const s=shadows();s.canonical=s.canonical.filter(x=>x.viewport!==360);failed(compareShadowSnapshots(s),'MISSING_OR_DUPLICATE_VIEWPORT_360');
});
test('G18 changed tombstone digest blocks data resurrection',()=>{
  const s=shadows();s.canonical[1]={...at(s.canonical,1),tombstoneDigest:H('e')};failed(compareShadowSnapshots(s),'SHADOW_360_tombstoneDigest_MISMATCH');
});
test('G19 changed action semantic digest blocks privilege drift',()=>{
  const s=shadows();s.canonical[2]={...at(s.canonical,2),actionDigest:H('e')};failed(compareShadowSnapshots(s),'SHADOW_1280_actionDigest_MISMATCH');
});
test('G20 explicit all-green evidence still returns NO cutover permit',()=>{
  const r=assessPublisherFence(control(),observed());assert.ok(r.ok);if(r.ok)assert.equal(r.value.safeToActivateHere,false);
});
test('G21 stale Host fencing epoch/CAS rejects',()=>{
  failed(assessPublisherFence(control(),{...observed(),expectedEpoch:7}),'STALE_EPOCH_OR_CAS');
});
test('G22 foreign owner or World rejects',()=>{
  failed(assessPublisherFence(control(),{...observed(),ownerRef:'stranger'}),'FOREIGN_SCOPE');
});
test('G23 restart-capable legacy writer rejects',()=>{
  failed(assessPublisherFence(control(),{...observed(),legacyRestartDenied:false}),'LEGACY_WRITER_NOT_FENCED');
});
test('G24 pending queue claim rejects',()=>{
  failed(assessPublisherFence(control(),{...observed(),uncertainClaims:1}),'UNRESOLVED_IN_FLIGHT');
});
test('G25 distributed check-then-write instead of held permit rejects',()=>{
  failed(assessPublisherFence(control(),{...observed(),heldThroughCommit:false}),'ATOMIC_HOST_FENCE_UNPROVEN');
});
test('G26 I5 BLOCKED/owner not approved rejects even if local tests pass',()=>{
  failed(assessPublisherFence(control(),{...observed(),integration5GO:false,explicitOwnerApproval:false}),'RELEASE_APPROVAL_MISSING');
});
test('G27 unavailable native devices/rollback blocks gate',()=>{
  failed(assessPublisherFence(control(),{...observed(),deviceAcceptance:false,rollbackRehearsed:false}),'RELEASE_EVIDENCE_MISSING');
});
test('G28 wrong target phase refuses fence transition',()=>{
  failed(assessPublisherFence({...control(),phase:'CANONICAL_LIVE'},observed()),'INVALID_TRANSITION');
});
test('G29 rollback dry run preserves all newer edits without automatically re-enabling legacy',()=>{
  const r=rehearseRollback(rollback());assert.ok(r.ok);if(r.ok){assert.equal(r.value.writerAfterDryRun,'none');
    assert.equal(r.value.automaticReacquire,false);assert.equal(r.value.replayEffects,false);assert.equal(r.value.preserve.length,2);}
});
test('G30 missing postcutover edit export prohibits rollback',()=>{
  failed(rehearseRollback({...rollback(),exportedRevisions:[{revision:4,digest:H('c')}]}),'NEW_EDITS_NOT_PRESERVED');
});
test('G31 changed postcutover edit digest prohibits rollback',()=>{
  failed(rehearseRollback({...rollback(),exportedRevisions:[{revision:4,digest:H('c')},{revision:5,digest:H('e')}]}),'NEW_EDITS_NOT_PRESERVED');
});
test('G32 unknown effect/commit refuses rollback',()=>{
  failed(rehearseRollback({...rollback(),uncertainOutcomes:1}),'UNRESOLVED_EFFECT_OR_COMMIT');
});
test('G33 loss of legacy reader refuses rollback',()=>{
  failed(rehearseRollback({...rollback(),legacyReaderRetained:false}),'NO_LOSSLESS_LEGACY_READER');
});
test('G34 stale epoch refuses rollback',()=>{
  failed(rehearseRollback({...rollback(),expectedEpoch:7}),'STALE_ROLLBACK_EPOCH');
});
test('G35 cannot rollback while old Host remains writer',()=>{
  failed(rehearseRollback({...rollback(),control:control()}),'NOT_CANONICAL_OWNER');
});

test('G36 source history gap is not silently imported',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{snapshot:{...i.snapshot,history:[i.snapshot.history[0],
    {...i.snapshot.history[2],revision:3}]},aliases:[i.aliases[0],i.aliases[2]]})),'INVALID_HISTORY_ROW');
});
test('G37 target revision aliases cannot reverse ordering',()=>{
  const i=migration();failed(makeShadowMigrationPlan(change(i,{aliases:[{...i.aliases[0],targetRevision:9},
    {...i.aliases[1],targetRevision:8},i.aliases[2]]})),'UNSAFE_OR_COLLIDING_ALIAS');
});
test('G38 cross-viewport identity drift blocks even if legacy/canonical each agree',()=>{
  const s=shadows();s.canonical[1]={...at(s.canonical,1),worldRef:'other'};
  s.legacy[1]={...at(s.legacy,1),worldRef:'other'};
  failed(compareShadowSnapshots(s),'INCONSISTENT_CROSS_VIEWPORT_SOURCE');
});
test('G39 rollback export must preserve revision identity, not only payload hash',()=>{
  failed(rehearseRollback({...rollback(),exportedRevisions:[{revision:4,digest:H('c')},{revision:6,digest:H('d')}]}),'NEW_EDITS_NOT_PRESERVED');
});
test('G40 positive shadow plan NEVER certifies raw data or commit',()=>{
  const r=makeShadowMigrationPlan(migration());assert.ok(r.ok);
  if(r.ok) {assert.equal(r.value.sourceDataValidated,false);assert.equal(r.value.eligibleToCommit,false);}
});
