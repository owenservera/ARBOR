/** Wave 3 Lane C — real UiStore/SQLite integration, never a mocked persistence port. */
import { test, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Database } from 'bun:sqlite';
import { UiAtomicReplay } from '../../src/visual-runtime/revisions/wave3-atomic-replay.ts';
import { openUiStore, UiStore, UiStoreError } from '../../src/ui/store.ts';
import { contentHash } from '../../src/ui/hash.ts';
import type { UiDocument } from '../../src/ui/types.ts';
import type { VerifiedUiPrincipal, RevisionCommand, RevisionResult, UiFixtureDraft, UiFixtureRevision } from '../../src/visual-runtime/revisions/port.ts';

const roots: string[] = [];
const stores: UiStore[] = [];
const p: VerifiedUiPrincipal = {
  ownerRef: 'own-a', actorRef: 'alice', deviceRef: 'pc-a', sessionRef: 'sess-a',
  grantRef: 'grant-a', policyRevision: 'policy-1', scopes: ['ui:read','ui:draft','ui:publish','ui:rollback'],
};
const bob: VerifiedUiPrincipal = { ...p, actorRef: 'bob', deviceRef: 'pc-b' };
const permitted = (principal: VerifiedUiPrincipal): boolean => principal.grantRef === 'grant-a' &&
  principal.sessionRef === 'sess-a' && principal.policyRevision === 'policy-1';
function document(title: string, id = 'w_founder'): UiDocument {
  return { schemaVersion: 1, world: { id, kind: 'custom', title, accent: '#f2b134',
    origin: { x:0, y:0, z:0 }, unitsPerMeter: 1 }, objects: [], relationships: [], dataFlows: [] };
}
function opened(path?: string, retention?: { commands: number; audit: number }) {
  const root = path === undefined ? mkdtempSync(join(tmpdir(),'tierflow-w3c-')) : path;
  if (path === undefined) roots.push(root);
  const store = openUiStore(retention ? { path:join(root,'state.db'), retention } : { path:join(root,'state.db') });
  stores.push(store);
  return { store, root, replay: new UiAtomicReplay({ store, ownerRef:'own-a', verifyPrincipal: permitted }) };
}
function seed(store: UiStore): void {
  const doc = document('Seed');
  store.publish({ worldId:'w_founder', document:doc, contentHash:contentHash(doc), expectedRevision:0, actorId:'legacy-bootstrap' });
}
function ok<T>(v: RevisionResult<T>): T { if (!v.ok) throw new Error(`${v.code}:${v.message}`); return v.value; }
function denied<T>(v: RevisionResult<T>, code: string): void { assert.equal(v.ok,false); if (!v.ok) assert.equal(v.code,code); }
function draft(engine: UiAtomicReplay, principal: VerifiedUiPrincipal, id: string, title: string) {
  return ok(engine.createDraft(principal,id,'w_founder',document(title)));
}
function command(id: string, d: UiFixtureDraft, revision = d.baseRevision): RevisionCommand {
  return { commandId:id, documentId:d.documentId, draftId:d.draftId, documentDigest:d.documentDigest,
    expectedRevision:revision, sourceVersions:{ policy:'policy-1', schema:'UiDocument/1' },
    target:{ actionId:'ui.publish', catalogVersion:'1' } };
}
function close(s: UiStore) { s.close(); stores.splice(stores.indexOf(s),1); }
afterEach(() => { for (const s of stores.splice(0)) s.close(); for (const root of roots.splice(0)) rmSync(root,{recursive:true,force:true}); });

test('real SQLite/WAL: two actors edit separate drafts; one compare-and-swap winner, append-only', () => {
  const {store,replay} = opened(); seed(store);
  const a = draft(replay,p,'draft-a','A');
  const b = draft(replay,bob,'draft-b','B');
  const a2 = ok(replay.editDraft(p,'draft-a',a.draftRevision,document('A revised')));
  const b2 = ok(replay.editDraft(bob,'draft-b',b.draftRevision,document('B revised')));
  const resultA = replay.publish(p,command('publish-a',a2));
  const resultB = replay.publish(bob,command('publish-b',b2));
  assert.equal(resultA.ok,true);
  denied(resultB,'REVISION_CONFLICT');
  assert.equal(store.currentRevision('w_founder')?.revision,2);
  assert.equal(store.listRevisions('w_founder',10).length,2);
  assert.equal(store.getDraft('draft-b')?.draftRevision,2);
  assert.equal(store.getCommand('publish-b'),null);
});

test('preview is effect-free; returned data cannot mutate journal, draft, revision or audit', () => {
  const {store,replay}=opened(); seed(store);
  draft(replay,p,'draft-a','Draft');
  const pre = [JSON.stringify(store.getDraft('draft-a')),JSON.stringify(store.currentRevision('w_founder')),
    JSON.stringify(store.auditEntries(50))];
  const show = ok(replay.preview(p,'draft-a'));
  (show.document as {world:{title:string}}).world.title = 'Tampered';
  assert.deepEqual(pre,[JSON.stringify(store.getDraft('draft-a')),JSON.stringify(store.currentRevision('w_founder')),
    JSON.stringify(store.auditEntries(50))]);
  assert.equal(store.getCommand('preview-a'),null);
  assert.equal(store.getDraft('draft-a')?.document.world.title,'Draft');
});

test('ACK lost after SQLite COMMIT; restart reconciles exact outcome, same command is replayed once', () => {
  const {store,root,replay}=opened(); seed(store);
  const c=command('cmd-ack',draft(replay,p,'d-ack','Durable'));
  replay.injectOnce('afterCommitAckLoss');
  denied(replay.publish(p,c),'UNCERTAIN');
  assert.equal(store.currentRevision('w_founder')?.revision,2);
  assert.equal(ok(replay.getCommandOutcome(p,'publish',c)).revision,2);
  close(store);
  const reopened=opened(root);
  assert.equal(ok(reopened.replay.getCommandOutcome(p,'publish',c)).revision,2);
  const retry=reopened.replay.publish(p,c);
  assert.equal(retry.ok,true);
  if(retry.ok) assert.equal(retry.replayed,true);
  assert.equal(reopened.store.listRevisions('w_founder',10).length,2);
});

test('WAL pre-commit fault rolls back draft delete, revision, audit and command row together', () => {
  const {store,root,replay}=opened();seed(store);
  const c=command('cmd-crash',draft(replay,p,'d-crash','After'));
  const before=store.auditEntries(50).length;
  replay.injectOnce('beforeCommit');
  denied(replay.publish(p,c),'UNCERTAIN');
  assert.equal(store.currentRevision('w_founder')?.revision,1);
  assert.equal(store.getCommand('cmd-crash'),null);
  assert.ok(store.getDraft('d-crash'));
  assert.equal(store.auditEntries(50).length,before);
  close(store);
  const recovered=opened(root);
  assert.equal(recovered.store.currentRevision('w_founder')?.revision,1);
  assert.equal(ok(recovered.replay.publish(p,c)).revision,2);
  assert.equal(recovered.store.currentRevision('w_founder')?.revision,2);
});

test('idempotency binds principal/grant/device/operation/args/version across restart',()=>{
  const {store,replay}=opened();seed(store);
  const c=command('cmd-idem',draft(replay,p,'d-idem','One'));
  ok(replay.publish(p,c));
  assert.equal(ok(replay.publish(p,c)).revision,2);
  const variations: RevisionCommand[] = [
    { ...c, expectedRevision:2 },
    { ...c, documentDigest:'sha256:wrong' },
    { ...c, sourceVersions:{policy:'policy-2'} },
    { ...c, target:{actionId:'ui.rollback'} },
  ];
  for (const bad of variations) denied(replay.publish(p,bad),'IDEMPOTENCY_CONFLICT');
  denied(replay.publish({...p,actorRef:'bob'},c),'IDEMPOTENCY_CONFLICT');
  denied(replay.publish({...p,deviceRef:'phone'},c),'IDEMPOTENCY_CONFLICT');
  denied(replay.publish({...p,ownerRef:'own-b'},c),'FORBIDDEN');
  denied(replay.publish({...p,grantRef:'revoked'},c),'FORBIDDEN');
  denied(replay.rollback(p,{...c,targetRevision:1}),'IDEMPOTENCY_CONFLICT');
  assert.equal(store.currentRevision('w_founder')?.revision,2);
});

test('wrong owner, actor, device, scope and revoked grant refuse preview or undo', () => {
  const {store,replay}=opened();seed(store);
  draft(replay,p,'d-secret','Confidential');
  denied(replay.preview(bob,'d-secret'),'NOT_FOUND');
  denied(replay.preview({...p,deviceRef:'phone'},'d-secret'),'NOT_FOUND');
  denied(replay.readCurrent({...p,ownerRef:'foreign'},'w_founder'),'FORBIDDEN');
  denied(replay.editDraft(bob,'d-secret',1,document('Attack')),'NOT_FOUND');
  denied(replay.rollback({...p,scopes:['ui:read']},{commandId:'undo',documentId:'w_founder',expectedRevision:1,targetRevision:1}),'FORBIDDEN');
  denied(replay.rollback({...p,grantRef:'revoked'},{commandId:'undo',documentId:'w_founder',expectedRevision:1,targetRevision:1}),'FORBIDDEN');
  assert.equal(store.currentRevision('w_founder')?.revision,1);
});

test('deterministic replay accepts ordered durable suffix, refuses reorder and truncation',()=>{
  const {store,replay}=opened();seed(store);
  const c1=command('replay-1',draft(replay,p,'d1','One'));
  ok(replay.publish(p,c1));
  const c2=command('replay-2',draft(replay,p,'d2','Two'));
  ok(replay.publish(p,c2));
  const list=[{operation:'publish' as const,command:c1},{operation:'publish' as const,command:c2}];
  const r=ok(replay.replayCommitted(p,'w_founder',list));
  assert.equal(r.revision,3);
  assert.equal((r.document as UiDocument).world.title,'Two');
  denied(replay.replayCommitted(p,'w_founder',[list[1]!,list[0]!]),'REVISION_CONFLICT');
  denied(replay.replayCommitted(p,'w_founder',[list[0]!]),'REVISION_CONFLICT');
  denied(replay.replayCommitted(bob,'w_founder',list),'IDEMPOTENCY_CONFLICT');
  assert.equal(store.listRevisions('w_founder',10).length,3);
});

test('rollback is a new revision, operation read is audited not fabricated; stale undo denied',()=>{
  const {store,replay}=opened();seed(store);
  const c=command('publish-new',draft(replay,p,'d-new','New'));
  ok(replay.publish(p,c));
  const undo: RevisionCommand={commandId:'undo-new',documentId:'w_founder',expectedRevision:2,targetRevision:1};
  const rolled=ok(replay.rollback(p,undo));
  assert.equal(rolled.revision,3);assert.equal(rolled.operation,'rollback');
  assert.equal(ok(replay.readCurrent(p,'w_founder'))?.operation,'rollback');
  denied(replay.rollback(p,{...undo,commandId:'undo-stale'}),'REVISION_CONFLICT');
  assert.equal(store.listRevisions('w_founder',10).length,3);
});

test('second SQLite writer is rejected, WAL mode persists across reopening',()=>{
  const {store,root}=opened(); seed(store);
  const second=new UiStore({path:join(root,'state.db')});
  assert.throws(()=>second.open(),(error:unknown)=>error instanceof UiStoreError && error.code==='STORE_LOCKED');
  close(store);
  const check=new Database(join(root,'state.db'),{readonly:true});
  try{assert.equal(check.query<{journal_mode:string},[]>('PRAGMA journal_mode').get()?.journal_mode,'wal');}
  finally{check.close();}
  const again=opened(root);
  assert.equal(again.store.currentRevision('w_founder')?.revision,1);
});

test('malformed docs and commands fail closed without any write or effect',()=>{
  const {store,replay}=opened();seed(store);
  const invalid={schema:'vivim.ui-document/1',title:'A'};
  denied(replay.createDraft(p,'invalid','w_founder',invalid),'INVALID_COMMAND');
  const cyclic: Record<string,unknown>={};cyclic['self']=cyclic;
  denied(replay.createDraft(p,'cycle','w_founder',cyclic),'INVALID_COMMAND');
  denied(replay.createDraft(p,'wrong-world','w_founder',document('Other','w_other')),'INVALID_COMMAND');
  assert.equal(store.listRevisions('w_founder',10).length,1);
  assert.equal(store.listDrafts().length,0);
});

test('trusted command receipts survive ordinary store retention and remain replayable',()=>{
  const {store,replay}=opened(undefined,{commands:1,audit:100});seed(store);
  const c1=command('retained-1',draft(replay,p,'r1','One'));
  ok(replay.publish(p,c1));
  const c2=command('retained-2',draft(replay,p,'r2','Two'));
  ok(replay.publish(p,c2));
  // UiStore explicitly preserves sha256:ui-envelope-v1 commands during pruning.
  assert.equal(ok(replay.getCommandOutcome(p,'publish',c1)).revision,2);
  assert.equal(ok(replay.replayCommitted(p,'w_founder',[
    {operation:'publish',command:c1},{operation:'publish',command:c2},
  ])).revision,3);
});

test('removed/corrupt journal row refuses replay instead of fabricating a command outcome',()=>{
  const {store,root,replay}=opened();seed(store);
  const c=command('missing-1',draft(replay,p,'missing-draft','One'));
  ok(replay.publish(p,c));
  close(store);
  // Adversarial offline damage by an administrator, NOT a second live writer.
  const raw=new Database(join(root,'state.db'));
  try { raw.query('DELETE FROM commands WHERE command_id = ?').run('missing-1'); }
  finally { raw.close(); }
  const recovered=opened(root);
  denied(recovered.replay.getCommandOutcome(p,'publish',c),'NOT_FOUND');
  denied(recovered.replay.replayCommitted(p,'w_founder',[{operation:'publish',command:c}]),'NOT_FOUND');
  assert.equal(recovered.store.currentRevision('w_founder')?.revision,2);
});
