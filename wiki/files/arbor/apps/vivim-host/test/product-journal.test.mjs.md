# File: apps/vivim-host/test/product-journal.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/product-journal.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21199 B |
| Lines | 327 |
| Hash | 469fa6d71197 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| seedState | const | 9 | no | const seedState = Object.freeze({ chat: [], wikiRevision: 0, at: &#39;2026-11-14T00:00:00Z&#39; }); |
| seedWiki | const | 10 | no | const seedWiki = Object.freeze({ revision: 1, pages: { Main: { sections: { HowTo: &#39;Seed description&#39; } } } }); |
| chat | function | 11 | no | const chat = (text = &#39;hello&#39;) =&gt; ({ kind: &#39;chat-send&#39;, actor: &#39;human&#39;, text, schemaVersion: 1 }); |
| edit | function | 12 | no | const edit = (expectedRevision = 1, content = &#39;Revised&#39;) =&gt; ({ kind: &#39;wiki-edit&#39;, actor: &#39;owner-browser&#39;, schemaVersion: 1, expectedRevision, edit: { page: &#39;Main&#39;, section: &#39;HowTo&#39;, action: &#39;set-sect… |
| rootTest | function | 14 | no | const rootTest = run =&gt; { const root = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-product-journal-&#39;)); |
| journal | function | 16 | no | const journal = dataRoot =&gt; createProductJournal({ dataRoot, seedState, seedWiki }); |
| entries | const | 19 | no | const entries = [{ ...chat(), receivedAt: &#39;2026-11-14T01:00:00Z&#39; }, |
| one | const | 27 | no | const one = journal(path.join(root, &#39;one&#39;)); |
| two | const | 28 | no | const two = journal(path.join(root, &#39;two&#39;)); |
| again | const | 31 | no | const again = journal(path.join(root, &#39;one&#39;)); |
| state | const | 32 | no | const state = await again.readProjection(); |
| j | const | 44 | no | const j = journal(root); |
| wikiRev | const | 45 | no | const wikiRev = (await j.readProjection()).wiki.revision; |
| restored | const | 50 | no | const restored = journal(root); |
| context | const | 51 | no | const context = await restored.readWikiContext(); |
| first | const | 52 | no | const first = (await restored.readRecords())[0]; |
| bounded | const | 63 | no | const bounded = await restored.readWikiContext(); |
| a | const | 71 | no | const a = journal(root), b = journal(root); |
| results | const | 72 | no | const results = await Promise.allSettled([a.append(edit()), b.append(edit())]); |
| j | const | 79 | no | const j = journal(root); |
| invalid | const | 80 | no | const invalid = [ |
| j | const | 100 | no | const j = journal(root); |
| before | const | 102 | no | const before = await j.rawJournal(); |
| j | const | 112 | no | const j = journal(root); |
| saved | const | 114 | no | const saved = await j.rawJournal(); |
| entry | const | 120 | no | const entry = JSON.parse(saved); |
| j | const | 128 | no | const j = journal(root); |
| before | const | 130 | no | const before = await j.rawJournal(); |
| j | const | 140 | no | const j = journal(root); |
| j | const | 152 | no | const j = journal(root); |
| first | const | 157 | no | const first = await j.append(edit(1, &#39;First committed change&#39;)); |
| second | const | 159 | no | const second = await j.append(edit(2, &#39;Second committed change&#39;)); |
| before | const | 160 | no | const before = await j.readWikiContext(); |
| after | const | 161 | no | const after = await journal(root).readWikiContext(); |
| j | const | 181 | no | const j = journal(root); |
| changed | const | 183 | no | const changed = await j.append(edit(1, &#39;Persisted owner section&#39;)); |
| restored | const | 184 | no | const restored = journal(root); |
| phone | const | 185 | no | const phone = await restored.readPhoneWiki(); |
| next | const | 193 | no | const next = await restored.readPhoneWiki(); |
| j | const | 201 | no | const j = journal(root); |
| obs | const | 202 | no | const obs = await j.append({ ...chat(&#39;Edit the Wiki section&#39;), intent: { outcome: &#39;candidate&#39;, candidate: { actionId: &#39;wiki.section.edit&#39;, args: { target: &#39;main/howto&#39;, content: &#39;A&#39; } } } }); |
| unrelated | const | 205 | no | const unrelated = await j.append(chat(&#39;An unsupported project or task mention&#39;)); |
| first | const | 206 | no | const first = await j.append(edit(1, &#39;A&#39;)); |
| second | const | 207 | no | const second = await j.append(edit(2, &#39;B&#39;)); |
| snapshot | const | 208 | no | const snapshot = await j.readWikiContext(), graph = snapshot.semantics; |
| target | const | 209 | no | const target = &#39;wiki:section:Main/HowTo&#39;; |
| restored | const | 220 | no | const restored = await journal(root).readWikiContext(); |
| withReceipt | const | 224 | no | const withReceipt = projectWikiSemantics({ ...snapshot, applicationEffects: { state: &#39;source-backed&#39;, items: [{ planId: &#39;ctl-test&#39;, planDigest: &#39;a&#39;.repeat(64), actionId: &#39;wiki.section.edit&#39;, sourceRe… |
| unavailable | const | 230 | no | const unavailable = projectWikiSemantics({ ...snapshot, applicationEffects: { state: &#39;unavailable&#39;, items: [] } }); |
| intent | const | 236 | no | const intent = { outcome: &#39;candidate&#39;, candidate: { actionId: &#39;wiki.section.edit&#39;, args: { target: &#39;main/howto&#39; } } }; |
| j | const | 239 | no | const j = journal(root); |
| before | const | 241 | no | const before = (await j.readWikiContext()).semantics; |
| after | const | 245 | no | const after = (await journal(root).readWikiContext()).semantics; |
| j | const | 252 | no | const j = journal(root); |
| candidate | const | 253 | no | const candidate = { outcome: &#39;candidate&#39;, candidate: { actionId: &#39;wiki.section.edit&#39;, args: { target: &#39;main/howto&#39;, content: &#39;A&#39; } } }; |
| first | const | 254 | no | const first = await j.append({ ...chat(&#39;Edit section&#39;), intent: candidate }); |
| one | const | 255 | no | const one = (await j.readWikiContext()).semantics; |
| oneMembership | const | 256 | no | const oneMembership = one.relationships.find(r =&gt; r.kind === &#39;belongs-to-page&#39;); |
| originalDigest | const | 258 | no | const originalDigest = one.nodes.find(n =&gt; n.id === &#39;journal:&#39; + first.entryId).source.digest; |
| editRecord | const | 260 | no | const editRecord = await j.append(edit(1, &#39;Committed text&#39;)); |
| two | const | 261 | no | const two = (await j.readWikiContext()).semantics; |
| memberships | const | 262 | no | const memberships = two.relationships.filter(r =&gt; r.kind === &#39;belongs-to-page&#39;); |
| first | const | 273 | no | const first = createProductJournal({ dataRoot: root }); |
| initial | const | 274 | no | const initial = await first.readProjection(); |
| save | const | 280 | no | const save = await first.append(edit(initial.wiki.revision, &#39;Owner instructions&#39;)); |
| before | const | 281 | no | const before = await first.readProjection(); |
| reopened | const | 282 | no | const reopened = createProductJournal({ dataRoot: root }); |
| historicState | const | 291 | no | const historicState = {&quot;chat&quot;:[],&quot;wikiRevision&quot;:0,&quot;at&quot;:&quot;2026-11-14T00:00:00.000Z&quot;}; |
| historicWiki | const | 292 | no | const historicWiki = {&quot;revision&quot;:1,&quot;at&quot;:&quot;2026-11-14T00:00:00.000Z&quot;,&quot;pages&quot;:{&quot;Main&quot;:{&quot;sections&quot;:{&quot;About&quot;:&quot;VIVIM realtime wiki — the reprogrammable product surface. Every section is editable; every edi… |
| legacy | const | 293 | no | const legacy = createProductJournal({ dataRoot: root, seedState: historicState, seedWiki: historicWiki }); |
| bytes | const | 297 | no | const bytes = readFileSync(legacy.journalPath, &#39;utf8&#39;); |
| expected | const | 298 | no | const expected = await legacy.readProjection(); |
| upgraded | const | 299 | no | const upgraded = createProductJournal({ dataRoot: root }); |
| reopened | const | 303 | no | const reopened = createProductJournal({ dataRoot: root }); |
| projection | const | 304 | no | const projection = await reopened.readProjection(); |
| current | const | 312 | no | const current = createProductJournal({ dataRoot: root }); |
| bytes | const | 314 | no | const bytes = readFileSync(current.journalPath, &#39;utf8&#39;); |
| current | const | 321 | no | const current = createProductJournal({ dataRoot: root }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../chat/product-journal.mjs | import | 6 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../chat/wiki-semantics.mjs | import | 7 | [apps/vivim-host/chat/wiki-semantics.mjs](../chat/wiki-semantics.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, appendFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createProductJournal, replayProductJournal } from '../chat/product-journal.mjs';
import { projectWikiSemantics, resolveSemanticWikiTarget } from '../chat/wiki-semantics.mjs';

const seedState = Object.freeze({ chat: [], wikiRevision: 0, at: '2026-11-14T00:00:00Z' });
const seedWiki = Object.freeze({ revision: 1, pages: { Main: { sections: { HowTo: 'Seed description' } } } });
const chat = (text = 'hello') => ({ kind: 'chat-send', actor: 'human', text, schemaVersion: 1 });
const edit = (expectedRevision = 1, content = 'Revised') => ({ kind: 'wiki-edit', actor: 'owner-browser', schemaVersion: 1,
  expectedRevision, edit: { page: 'Main', section: 'HowTo', action: 'set-section', content } });
const rootTest = run => { const root = mkdtempSync(path.join(os.tmpdir(), 'arbor-product-journal-'));
  return Promise.resolve().then(() => run(root)).finally(() => rmSync(root, { recursive: true, force: true })); };
const journal = dataRoot => createProductJournal({ dataRoot, seedState, seedWiki });

test('pure replay is deterministic and does not mutate seeds', () => {
  const entries = [{ ...chat(), receivedAt: '2026-11-14T01:00:00Z' },
    { ...edit(), receivedAt: '2026-11-14T01:01:00Z' }];
  assert.deepEqual(replayProductJournal(seedState, seedWiki, entries), replayProductJournal(seedState, seedWiki, entries));
  assert.equal(seedWiki.pages.Main.sections.HowTo, 'Seed description');
  assert.equal(replayProductJournal(seedState, seedWiki, entries).state.revision, 2);
});

test('fsynced append, private dataRoot isolation, restart and all read surfaces agree', () => rootTest(async root => {
  const one = journal(path.join(root, 'one'));
  const two = journal(path.join(root, 'two'));
  await one.append(chat('hello world'));
  await one.append(edit(1, 'Persisted'));
  const again = journal(path.join(root, 'one'));
  const state = await again.readProjection();
  assert.equal(state.state.chat[0].text, 'hello world');
  assert.equal(state.wiki.pages.Main.sections.HowTo, 'Persisted');
  assert.equal(state.wiki.revision, 2);
  assert.equal(state.state.wikiRevision, state.wiki.revision);
  assert.equal((await again.readRecords()).length, 2);
  assert.equal((await again.rawJournal()).split('\n').filter(Boolean).length, 2);
  assert.ok(existsSync(again.journalPath));
  assert.equal((await two.readRecords()).length, 0);
}));

test('source-identified user context is bounded and restart-persistent', () => rootTest(async root => {
  const j = journal(root);
  const wikiRev = (await j.readProjection()).wiki.revision;
  await j.append({ ...chat('Voice notes to structured tasks'),
    intent: { outcome: 'candidate', candidate: { actionId: 'wiki.section.edit' } } });
  await j.append({ ...chat('AI output'), actor: 'ai' });
  await j.append({ ...chat('background event'), actor: 'loop-agent' });
  const restored = journal(root);
  const context = await restored.readWikiContext();
  const first = (await restored.readRecords())[0];
  assert.equal(context.schema, 'vivim.wiki-context/1');
  assert.equal(context.revision, 3);
  assert.equal(context.totalObserved, 1);
  assert.equal(context.items[0].entryId, first.entryId);
  assert.equal(context.items[0].sequence, 1);
  assert.equal(context.items[0].text, 'Voice notes to structured tasks');
  assert.equal(context.items[0].status, 'user-statement-unverified');
  assert.equal(context.items[0].interpretation.actionId, 'wiki.section.edit');
  assert.equal((await restored.readProjection()).wiki.revision, wikiRev);
  for (let n = 0; n < 27; n++) await j.append(chat('observed ' + n));
  const bounded = await restored.readWikiContext();
  assert.equal(bounded.totalObserved, 28);
  assert.equal(bounded.items.length, 24);
  assert.equal(bounded.omitted, 4);
  assert.equal(bounded.items.at(-1).text, 'observed 26');
}));

test('same revision concurrent attempts across two instances: one commit one 409', () => rootTest(async root => {
  const a = journal(root), b = journal(root);
  const results = await Promise.allSettled([a.append(edit()), b.append(edit())]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.status === 409).length, 1);
  assert.equal((await journal(root).readRecords()).length, 1);
}));

test('typed envelope, actor, payload size, unknown effect keys, CAS and paths refused', () => rootTest(async root => {
  const j = journal(root);
  const invalid = [
```

_First 80 of 328 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
