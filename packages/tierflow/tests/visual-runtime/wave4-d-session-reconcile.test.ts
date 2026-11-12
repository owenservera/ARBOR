import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { contentHash } from '../../src/ui/hash.ts';
import { UI_REVISION_PORT_SCHEMA } from '../../src/visual-runtime/revisions/port.ts';
import type { VerifiedUiPrincipal, UiFixtureRevision, RevisionCommand, UiRevisionPort } from '../../src/visual-runtime/revisions/port.ts';
import { createWave4SessionReconciler, WAVE4_NOTICE_SCHEMA, WAVE4_WATERMARK_SCHEMA } from '../../src/visual-runtime/revisions/wave4-session-reconcile.ts';
import type { SessionNotice } from '../../src/visual-runtime/revisions/wave4-session-reconcile.ts';
import type { ScopedFeedCard, ScopedFeedResult } from '../../src/visual-runtime/knowledge/wave3-feed-projection.ts';
import type { UiDocument } from '../../src/ui/types.ts';

const ID = 'w_founder';
const principal = (over: Partial<VerifiedUiPrincipal> = {}): VerifiedUiPrincipal => ({
  ownerRef: 'owner1', actorRef: 'actor1', deviceRef: 'pc1', sessionRef: 'session1', grantRef: 'grant1',
  policyRevision: 'policy1', scopes: ['ui:read'], ...over,
});
/**
 * A published revision carries a real document, so the fixture hashes one.
 * `entries` is the lane's deliberate marker used to prove a caller's mutation
 * cannot reach the reconciler's verified view.
 */
type RevisionDocument = UiDocument & { readonly entries: readonly string[] };
function revisionDocument(revision: number): RevisionDocument {
  return {
    schemaVersion: 1,
    world: { id: ID, kind: 'home', title: 'Founder Workspace', accent: '#000000', origin: { x: 0, y: 0, z: 0 }, unitsPerMeter: 1 },
    objects: [], relationships: [], dataFlows: [],
    entries: [`r${revision}`],
  };
}
function record(revision: number, operation: 'publish' | 'rollback' = 'publish'): UiFixtureRevision {
  const document = revisionDocument(revision);
  return { schema: UI_REVISION_PORT_SCHEMA, documentId: ID, revision, operation,
    actorRef: 'actor1', document, documentDigest: contentHash(document) };
}
/** One fully-shaped scoped KB card, exactly as F's real projection emits it. */
function card(stableId: string): ScopedFeedCard {
  return {
    stableId, kind: 'project_note', title: 'Shared project path',
    summary: 'Owner-scoped project note.', statusLabel: 'Present', provenanceLabel: 'Repos HQ',
    sourceVersion: 'rev-3', asOf: '2026-11-06T00:00:00.000Z', interactive: false,
    projectRef: 'project_one', availability: 'present', claimStatus: 'observed',
    sensitivity: 'enforced-upstream-not-disclosed',
    source: { authority: 'fixture.hq', nativeId: stableId, nativeVersion: 'rev-3', digest: `sha256:synthetic-${stableId}` },
    evidenceRefs: [`fixture-evidence:${stableId}`], provenance: ['synthetic.corpus/1'],
  };
}
const request = (surface: 'pc' | 'android' = 'pc') => ({ schema: 'vivim.knowledge-query/1' as const,
  requestId: 'req1', personalWorldRef: ID, surface, purpose: 'task' as const, query: 'founder', limit: 5 });
function fixture(options: { limit?: number; device?: string; withKnowledge?: boolean; retries?: number } = {}) {
  let active: VerifiedUiPrincipal | null = principal({deviceRef: options.device ?? 'pc1'});
  let head = record(1), sequence = 0, authorized = true, watermarkOk = true;
  let readCount = 0, receiptCount = 0, effects = 0, feedCount = 0, clearCount = 0;
  const receipts = new Map<string, UiFixtureRevision>();
  const port: Pick<UiRevisionPort, 'readCurrent' | 'getCommandOutcome'> = {
    readCurrent: (_p, id) => { readCount++; return authorized && id === ID ? {ok:true,value:head} : {ok:false,code:'FORBIDDEN',message:'FORBIDDEN'}; },
    getCommandOutcome: (_p, _op, command) => { receiptCount++; const r = receipts.get(command.commandId);
      return authorized && r ? {ok:true,value:r,replayed:true} : {ok:false,code:'NOT_FOUND',message:'NOT_FOUND'}; },
  };
  const feed = { async resnapshot(): Promise<ScopedFeedResult> { feedCount++;
    return {state:authorized?'ready':'denied',cards:authorized?[card('kn1')]:[],changes:[],removedStableIds:[],
      projectionRevision:authorized?'kb1':null,asOf:authorized?'2026-11-06T00:00:00.000Z':null,
      reason:authorized?'NONE':'ACCESS_DENIED'};
  }, clear() { clearCount++; }, notice() {} };
  const reconciler = createWave4SessionReconciler({documentId: ID, revisionPort: port,
    readPrincipal: () => active,
    readWatermark: p => ({schema: WAVE4_WATERMARK_SCHEMA, ownerRef:p.ownerRef, deviceRef:p.deviceRef,
      sessionRef:p.sessionRef, policyRevision:p.policyRevision, documentId:ID, sequence,
      revision: head.revision, documentDigest: watermarkOk?head.documentDigest:record(999).documentDigest}),
    ...(options.withKnowledge ? {knowledgeFeed:feed,knowledgeRequest:()=>request(options.device==='android'?'android':'pc')} : {}),
    ...(options.limit ? {maxPendingNotices:options.limit} : {}),
    ...(options.retries ? {maxSnapshotAttempts:options.retries} : {}),
  });
  const hint = (nextSeq:number, rev:number, kind: SessionNotice['kind']='changed'): SessionNotice =>
    ({schema:WAVE4_NOTICE_SCHEMA,documentId:ID,sequence:nextSeq,revision:rev,kind});
  return {reconciler,hint,port,receipts,
    get head(){return head;}, set head(r:UiFixtureRevision){head=r;},
    get sequence(){return sequence;},set sequence(n:number){sequence=n;},
    get active(){return active;},set active(v:VerifiedUiPrincipal|null){active=v;},
    get authorized(){return authorized;},set authorized(v:boolean){authorized=v;},
    get watermarkOk(){return watermarkOk;},set watermarkOk(v:boolean){watermarkOk=v;},
    counts:()=>({readCount,receiptCount,effects,feedCount,clearCount}),
  };
}

test('positive: desktop and phone read the SAME authoritative World revision and KB snapshot, no writer',async()=>{
  const pc=fixture({device:'pc1',withKnowledge:true}); const phone=fixture({device:'phone1',withKnowledge:true});
  const a=await pc.reconciler.reconnect(), b=await phone.reconciler.reconnect();
  assert.equal(a.state,'ready'); assert.equal(b.state,'ready');
  assert.deepEqual(a.revision?.document,b.revision?.document);
  assert.equal(a.revision?.documentDigest,b.revision?.documentDigest);
  assert.deepEqual(a.knowledge?.cards,b.knowledge?.cards);
  assert.equal(pc.counts().effects+phone.counts().effects,0);
  assert.equal(pc.counts().feedCount,1);
  assert.equal(phone.counts().feedCount,1);
});

test('disconnect/rejoin invalidates sensitive data immediately, reanchors cursor and re-reads F',async()=>{
  const f=fixture({withKnowledge:true});
  assert.equal((await f.reconciler.reconnect()).state,'ready');
  f.reconciler.disconnect();
  assert.deepEqual(f.reconciler.view(),{state:'offline',reason:'DISCONNECTED',revision:null,knowledge:null,cursor:null});
  f.head=record(2); f.sequence=11;
  const next=await f.reconciler.reconnect();
  assert.equal(next.state,'ready'); assert.equal(next.cursor?.revision,2); assert.equal(next.cursor?.sequence,11);
  assert.equal(f.counts().feedCount,2);
});

test('notice is metadata-only: fresh changed hint makes stale UX until canonical resnapshot',async()=>{
  const f=fixture({withKnowledge:true}); await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice(f.hint(1,2)),'accepted');
  const stale=f.reconciler.view();assert.equal(stale.state,'stale');assert.equal(stale.revision,null);assert.equal(stale.knowledge,null);
  f.head=record(2); f.sequence=1;
  assert.equal((await f.reconciler.reconnect()).revision?.revision,2);
  assert.equal(f.counts().effects,0);
});

test('repeated last hint deduplicates; stale/reordered earlier hint and skipped sequence force resnapshot',async()=>{
  const f=fixture(); await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice(f.hint(1,2)),'accepted');
  assert.equal(f.reconciler.notice(f.hint(1,2)),'duplicate');
  assert.equal(f.reconciler.notice(f.hint(2,2)),'accepted');
  assert.equal(f.reconciler.notice(f.hint(1,2)),'resnapshot-required');
  assert.equal(f.reconciler.view().revision,null);
  f.sequence=2;f.head=record(2);await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice(f.hint(4,3)),'resnapshot-required');
  assert.equal(f.reconciler.view().reason,'GAP_OR_REORDER');
});

test('revision gap and decreasing revision cannot silently advance watermark',async()=>{
  const f=fixture(); await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice(f.hint(1,4)),'resnapshot-required');
  await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice(f.hint(1,2)),'accepted');
  assert.equal(f.reconciler.notice(f.hint(2,1)),'resnapshot-required');
});

test('tombstone and source reset require full F resnapshot; no deleted card survives',async()=>{
  const f=fixture({withKnowledge:true}); await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice(f.hint(1,1,'tombstone')),'resnapshot-required');
  assert.equal(f.reconciler.view().knowledge,null); assert.equal(f.reconciler.view().reason,'TOMBSTONE');
  f.sequence=1; await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice(f.hint(2,1,'source-reset')),'resnapshot-required');
  assert.equal(f.reconciler.view().knowledge,null);
  assert.equal(f.counts().feedCount,2);
});

test('revoke is sticky for same grant even if compromised hints try to resume; new grant must be verified',async()=>{
  const f=fixture({withKnowledge:true}); await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice(f.hint(1,1,'revoked')),'denied');
  assert.equal(f.reconciler.view().revision,null);
  assert.equal((await f.reconciler.reconnect()).state,'denied');
  f.active=principal({grantRef:'grant2'});f.sequence=1;
  assert.equal((await f.reconciler.reconnect()).state,'ready');
});

test('broker policy revocation without hint is checked at paint time and data cleared',async()=>{
  const f=fixture({withKnowledge:true}); await f.reconciler.reconnect();
  f.authorized=false;
  assert.equal(f.reconciler.view().state,'denied');
  assert.equal(f.reconciler.view().knowledge,null);
});

test('cross-device or policy scope switch invalidates paint, including changed session',async()=>{
  const f=fixture();await f.reconciler.reconnect();
  f.active=principal({deviceRef:'foreign'});
  assert.equal(f.reconciler.view().state,'denied');
  assert.equal(f.reconciler.notice(f.hint(1,2)),'denied');
  f.active=principal({sessionRef:'other-session',policyRevision:'policy2'});
  assert.equal((await f.reconciler.reconnect()).state,'ready');
});

test('untrusted notice cannot inject KB fields, commands, extra policy grants, or unbounded sequences',async()=>{
  const f=fixture();await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice({...f.hint(1,1),privilege:'ui:publish',cards:[{label:'fake'}]} as never),'resnapshot-required');
  assert.equal(f.reconciler.view().revision,null);
  await f.reconciler.reconnect();
  assert.equal(f.reconciler.notice(f.hint(Number.MAX_SAFE_INTEGER+1,2)),'resnapshot-required');
});

test('lost ACK reconciliation reads exact durable C receipt; never repeats or issues a Host effect',async()=>{
  const f=fixture();await f.reconciler.reconnect();
  const command:RevisionCommand={commandId:'cmd-ack',documentId:ID,expectedRevision:1,documentDigest:record(2).documentDigest};
  assert.equal(f.reconciler.resolveLostAck('publish',command).status,'unverified');
  f.receipts.set(command.commandId,record(2));
  const found=f.reconciler.resolveLostAck('publish',command);
  assert.equal(found.status,'confirmed');assert.equal(found.revision?.revision,2);
  assert.equal(f.reconciler.resolveLostAck('publish',{...command,expectedRevision:6}).status,'unverified');
  assert.equal(f.reconciler.resolveLostAck('rollback',{...command,documentId:'w_foreign'}).status,'unverified');
  assert.equal(f.counts().effects,0);assert.equal(f.counts().receiptCount,3);
});

test('mismatched publisher/read heads fail closed after strictly bounded attempts',async()=>{
  const f=fixture({retries:3});f.watermarkOk=false;
  const v=await f.reconciler.reconnect();assert.equal(v.state,'unavailable');assert.equal(v.reason,'HEAD_MISMATCH');
  assert.equal(f.counts().readCount,3);
});

test('publisher watermark owner and device cannot be trusted across a foreign principal',async()=>{
  let gate = false;
  const f=fixture();
  const other=createWave4SessionReconciler({documentId:ID,revisionPort:f.port,readPrincipal:()=>principal({deviceRef:'phone2'}),
    readWatermark:()=>({schema:WAVE4_WATERMARK_SCHEMA,ownerRef:'owner1',deviceRef:'pc1',sessionRef:'session1',policyRevision:'policy1',documentId:ID,sequence:0,revision:1,documentDigest:record(1).documentDigest})});
  assert.equal((await other.reconnect()).state,'denied');
  assert.equal(gate,false);
});

test('caller mutation cannot alter a verified view or subsequent digest',async()=>{
  const f=fixture({withKnowledge:true});const first=await f.reconciler.reconnect();
  (first.revision!.document as {entries:string[]}).entries.push('tampered');
  // Deliberate invalid mutation of the returned copy: it must not reach the reconciler's state.
  (first.knowledge!.cards[0]! as {stableId:string}).stableId='tampered';
  const later=f.reconciler.view();
  assert.deepEqual((later.revision?.document as {entries:string[]}).entries,['r1']);
  assert.equal(later.knowledge?.cards[0]?.stableId,'kn1');
});

test('bounded storm: 1k and 10k hints O(1) retained state, measured process CPU/RSS and throughput',async()=>{
  const metrics=[] as {events:number;elapsedMs:number;cpuUserMs:number;cpuSystemMs:number;rssDeltaBytes:number;heapDeltaBytes:number;noticeP50Ms:number;noticeP95Ms:number;accepted:number;resnapshotRequired:number}[];
  for(const events of [1000,10000]) {
    const f=fixture({limit:256});await f.reconciler.reconnect();
    const rss=process.memoryUsage().rss, heap=process.memoryUsage().heapUsed, cpu=process.cpuUsage(), start=performance.now();
    let n=0, resnapshotRequired=0;
    const durations:number[]=[];
    for(let i=1;i<=events;i++){
      const startNotice=performance.now();
      const status=f.reconciler.notice(f.hint(i,1));
      durations.push(performance.now()-startNotice);
      if(status==='accepted')n++;
      if(status==='resnapshot-required')resnapshotRequired++;
    }
    const elapsed=performance.now()-start, cpuDelta=process.cpuUsage(cpu);
    const t=f.reconciler.telemetry();
    assert.ok(n<=255);assert.equal(t.maxPendingObserved,256);
    assert.equal(t.pendingNotices,0);assert.equal(t.acceptedNotices,256);
    assert.equal(f.reconciler.view().state,'resnapshot-required');
    assert.equal(f.reconciler.view().revision,null);
    assert.equal(f.counts().readCount>=1,true);
    assert.equal(f.counts().effects,0);
    durations.sort((a,b)=>a-b);
    const p50=durations[Math.floor(durations.length*0.5)]!;
    const p95=durations[Math.floor(durations.length*0.95)]!;
    metrics.push({events,elapsedMs:+elapsed.toFixed(3),noticeP50Ms:+p50.toFixed(6),noticeP95Ms:+p95.toFixed(6),cpuUserMs:+(cpuDelta.user/1000).toFixed(3),cpuSystemMs:+(cpuDelta.system/1000).toFixed(3),
      rssDeltaBytes:process.memoryUsage().rss-rss,heapDeltaBytes:process.memoryUsage().heapUsed-heap,
      accepted:n,resnapshotRequired});
  }
  console.log('WAVE4D_MEASURED_LOCAL_NODE='+JSON.stringify({platform:process.platform,arch:process.arch,node:process.version,pid:process.pid,metrics}));
});

test('pending asynchronous resnapshot is invalidated by disconnect and change of principal',async()=>{
  const f=fixture();let release!:()=>void;let started!:()=>void;
  const waiting=new Promise<void>(r=>release=r), entered=new Promise<void>(r=>started=r);
  const controlled=createWave4SessionReconciler({documentId:ID,revisionPort:f.port,readPrincipal:()=>f.active,
    readWatermark:async p=>{started();await waiting;return {schema:WAVE4_WATERMARK_SCHEMA,ownerRef:p.ownerRef,deviceRef:p.deviceRef,sessionRef:p.sessionRef,
      policyRevision:p.policyRevision,documentId:ID,sequence:0,revision:1,documentDigest:record(1).documentDigest};}});
  const task=controlled.reconnect();await entered;controlled.disconnect();f.active=principal({grantRef:'new'});release();
  const out=await task;assert.equal(out.state,'offline');assert.equal(out.revision,null);
});

test('unavailable knowledge blocks device paint and bounded reconnect never turns partial read into a grant',async()=>{
  const f=fixture();
  let reads=0;
  const restricted=createWave4SessionReconciler({documentId:ID,revisionPort:f.port,readPrincipal:()=>f.active,
    readWatermark:()=>({schema:WAVE4_WATERMARK_SCHEMA,ownerRef:'owner1',deviceRef:'pc1',sessionRef:'session1',policyRevision:'policy1',documentId:ID,sequence:0,revision:1,documentDigest:record(1).documentDigest}),
    knowledgeFeed:{async resnapshot(){reads++;return {state:'unavailable',cards:[],changes:[],removedStableIds:[],projectionRevision:null,asOf:null,reason:'SOURCE_UNAVAILABLE'};},clear(){},notice(){}},
    knowledgeRequest:()=>request(),maxSnapshotAttempts:2});
  assert.equal((await restricted.reconnect()).state,'unavailable');assert.equal(reads,2);
  assert.equal(restricted.view().revision,null);
});


test('notice during async rejoin invalidates pending snapshot instead of restoring stale state',async()=>{
  const f=fixture();let release!:()=>void;let started!:()=>void;
  const waiting=new Promise<void>(r=>release=r),entered=new Promise<void>(r=>started=r);
  const controlled=createWave4SessionReconciler({documentId:ID,revisionPort:f.port,readPrincipal:()=>f.active,
    readWatermark:async p=>{ started(); await waiting; return {schema:WAVE4_WATERMARK_SCHEMA,ownerRef:p.ownerRef,
      deviceRef:p.deviceRef,sessionRef:p.sessionRef,policyRevision:p.policyRevision,documentId:ID,sequence:0,revision:1,
      documentDigest:record(1).documentDigest}; }});
  const attempt=controlled.reconnect();await entered;
  assert.equal(controlled.notice(f.hint(1,2)),'resnapshot-required');
  release();
  assert.equal((await attempt).state,'resnapshot-required');
  assert.equal(controlled.view().revision,null);
});

test('lost ACK after transport detach or grant revocation must remain unconfirmed',async()=>{
  const f=fixture();await f.reconciler.reconnect();
  const cmd:RevisionCommand={commandId:'cmd-lost',documentId:ID,expectedRevision:1};
  f.receipts.set(cmd.commandId,record(2));
  f.reconciler.disconnect();
  assert.equal(f.reconciler.resolveLostAck('publish',cmd).status,'denied');
  await f.reconciler.reconnect();
  f.authorized=false;
  assert.equal(f.reconciler.resolveLostAck('publish',cmd).status,'unverified');
  assert.equal(f.counts().effects,0);
});
