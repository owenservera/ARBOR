# File: packages/tierflow/tests/visual-runtime/wave3-c-replay.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave3-c-replay.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 12758 B |
| Lines | 222 |
| Hash | 2850bae865a6 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| roots | const | 14 | no | const roots: string[] = []; |
| stores | const | 15 | no | const stores: UiStore[] = []; |
| p | const | 16 | no | const p: VerifiedUiPrincipal = { |
| bob | const | 20 | no | const bob: VerifiedUiPrincipal = { ...p, actorRef: &#39;bob&#39;, deviceRef: &#39;pc-b&#39; }; |
| permitted | function | 21 | no | const permitted = (principal: VerifiedUiPrincipal): boolean =&gt; principal.grantRef === &#39;grant-a&#39; &amp;&amp; |
| document | function | 23 | no | function document(title: string, id = &#39;w_founder&#39;): UiDocument { |
| opened | function | 27 | no | function opened(path?: string, retention?: { commands: number; audit: number }) { |
| root | const | 28 | no | const root = path === undefined ? mkdtempSync(join(tmpdir(),&#39;tierflow-w3c-&#39;)) : path; |
| store | const | 30 | no | const store = openUiStore(retention ? { path:join(root,&#39;state.db&#39;), retention } : { path:join(root,&#39;state.db&#39;) }); |
| seed | function | 34 | no | function seed(store: UiStore): void { |
| doc | const | 35 | no | const doc = document(&#39;Seed&#39;); |
| ok | function | 38 | no | function ok&lt;T&gt;(v: RevisionResult&lt;T&gt;): T { if (!v.ok) throw new Error(`${v.code}:${v.message}`); return v.value; } |
| denied | function | 39 | no | function denied&lt;T&gt;(v: RevisionResult&lt;T&gt;, code: string): void { assert.equal(v.ok,false); if (!v.ok) assert.equal(v.code,code); } |
| draft | function | 40 | no | function draft(engine: UiAtomicReplay, principal: VerifiedUiPrincipal, id: string, title: string) { |
| command | function | 43 | no | function command(id: string, d: UiFixtureDraft, revision = d.baseRevision): RevisionCommand { |
| close | function | 48 | no | function close(s: UiStore) { s.close(); stores.splice(stores.indexOf(s),1); } |
| a | const | 53 | no | const a = draft(replay,p,&#39;draft-a&#39;,&#39;A&#39;); |
| b | const | 54 | no | const b = draft(replay,bob,&#39;draft-b&#39;,&#39;B&#39;); |
| a2 | const | 55 | no | const a2 = ok(replay.editDraft(p,&#39;draft-a&#39;,a.draftRevision,document(&#39;A revised&#39;))); |
| b2 | const | 56 | no | const b2 = ok(replay.editDraft(bob,&#39;draft-b&#39;,b.draftRevision,document(&#39;B revised&#39;))); |
| resultA | const | 57 | no | const resultA = replay.publish(p,command(&#39;publish-a&#39;,a2)); |
| resultB | const | 58 | no | const resultB = replay.publish(bob,command(&#39;publish-b&#39;,b2)); |
| pre | const | 70 | no | const pre = [JSON.stringify(store.getDraft(&#39;draft-a&#39;)),JSON.stringify(store.currentRevision(&#39;w_founder&#39;)), |
| show | const | 72 | no | const show = ok(replay.preview(p,&#39;draft-a&#39;)); |
| c | const | 82 | no | const c=command(&#39;cmd-ack&#39;,draft(replay,p,&#39;d-ack&#39;,&#39;Durable&#39;)); |
| reopened | const | 88 | no | const reopened=opened(root); |
| retry | const | 90 | no | const retry=reopened.replay.publish(p,c); |
| c | const | 98 | no | const c=command(&#39;cmd-crash&#39;,draft(replay,p,&#39;d-crash&#39;,&#39;After&#39;)); |
| before | const | 99 | no | const before=store.auditEntries(50).length; |
| recovered | const | 107 | no | const recovered=opened(root); |
| c | const | 115 | no | const c=command(&#39;cmd-idem&#39;,draft(replay,p,&#39;d-idem&#39;,&#39;One&#39;)); |
| variations | const | 118 | no | const variations: RevisionCommand[] = [ |
| c1 | const | 147 | no | const c1=command(&#39;replay-1&#39;,draft(replay,p,&#39;d1&#39;,&#39;One&#39;)); |
| c2 | const | 149 | no | const c2=command(&#39;replay-2&#39;,draft(replay,p,&#39;d2&#39;,&#39;Two&#39;)); |
| list | const | 151 | no | const list=[{operation:&#39;publish&#39; as const,command:c1},{operation:&#39;publish&#39; as const,command:c2}]; |
| r | const | 152 | no | const r=ok(replay.replayCommitted(p,&#39;w_founder&#39;,list)); |
| c | const | 163 | no | const c=command(&#39;publish-new&#39;,draft(replay,p,&#39;d-new&#39;,&#39;New&#39;)); |
| undo | const | 165 | no | const undo: RevisionCommand={commandId:&#39;undo-new&#39;,documentId:&#39;w_founder&#39;,expectedRevision:2,targetRevision:1}; |
| rolled | const | 166 | no | const rolled=ok(replay.rollback(p,undo)); |
| second | const | 175 | no | const second=new UiStore({path:join(root,&#39;state.db&#39;)}); |
| check | const | 178 | no | const check=new Database(join(root,&#39;state.db&#39;),{readonly:true}); |
| again | const | 181 | no | const again=opened(root); |
| invalid | const | 187 | no | const invalid={schema:&#39;vivim.ui-document/1&#39;,title:&#39;A&#39;}; |
| cyclic | const | 189 | no | const cyclic: Record&lt;string,unknown&gt;={};cyclic[&#39;self&#39;]=cyclic; |
| c1 | const | 198 | no | const c1=command(&#39;retained-1&#39;,draft(replay,p,&#39;r1&#39;,&#39;One&#39;)); |
| c2 | const | 200 | no | const c2=command(&#39;retained-2&#39;,draft(replay,p,&#39;r2&#39;,&#39;Two&#39;)); |
| c | const | 211 | no | const c=command(&#39;missing-1&#39;,draft(replay,p,&#39;missing-draft&#39;,&#39;One&#39;)); |
| raw | const | 215 | no | const raw=new Database(join(root,&#39;state.db&#39;)); |
| recovered | const | 218 | no | const recovered=opened(root); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| bun:sqlite | import | 7 | external |
| ../../src/visual-runtime/revisions/wave3-atomic-replay.ts | import | 8 | [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](../../src/visual-runtime/revisions/wave3-atomic-replay.ts.md) |
| ../../src/ui/store.ts | import | 9 | [packages/tierflow/src/ui/store.ts](../../src/ui/store.ts.md) |
| ../../src/ui/hash.ts | import | 10 | [packages/tierflow/src/ui/hash.ts](../../src/ui/hash.ts.md) |
| ../../src/ui/types.ts | import | 11 | [packages/tierflow/src/ui/types.ts](../../src/ui/types.ts.md) |
| ../../src/visual-runtime/revisions/port.ts | import | 12 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../../src/visual-runtime/revisions/port.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 223 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
