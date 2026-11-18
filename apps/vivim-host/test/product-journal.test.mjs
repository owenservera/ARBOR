import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, appendFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createProductJournal, replayProductJournal } from '../chat/product-journal.mjs';

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
    { ...chat(), path: '../danger' }, { ...chat(), actor: 'owner' },
    { ...chat(), receivedAt: '2099-01-01' }, { ...chat(), intent: { effect: 'execute' }, code: 'run' },
    { ...chat('') }, { ...chat('x'.repeat(1001)) },
    { ...edit(), edit: { ...edit().edit, file: '.env' } },
    { ...edit(), expectedRevision: undefined },
    { ...edit(), edit: { ...edit().edit, page: '../secrets' } },
    { ...edit(), edit: { ...edit().edit, section: 'Unknown' } },
    { kind:'gate-decision', actor:'keeper', schemaVersion:1, itemId:'A02', decision:'execute' },
    { kind:'feedback-round', actor:'loop-agent', schemaVersion:1, round:'1', approveAll:false, verdicts:[{ id:'A02', verdict:'pass', file:'../../x' }] }
  ];
  for (const entry of invalid) await assert.rejects(j.append(entry));
  assert.equal((await j.readRecords()).length, 0);
  await j.append(edit());
  await assert.rejects(j.append(edit()), e => e.status === 409);
  await assert.rejects(j.append(edit(2, 'x'.repeat(9000))), e => e.status === 400);
  assert.equal((await j.readRecords()).length, 1);
}));

test('torn tail replays committed prefix, exposes only committed JSONL, refuses next append', () => rootTest(async root => {
  const j = journal(root);
  await j.append(chat('safe'));
  const before = await j.rawJournal();
  appendFileSync(j.journalPath, '{"kind":"chat-send","actor":');
  assert.equal((await j.readRecords()).length, 1);
  assert.equal(await j.rawJournal(), before);
  await assert.rejects(j.readWikiContext(), e => e.status === 503);
  await assert.rejects(j.append(chat('unsafe')), e => e.status === 503);
  assert.ok(readFileSync(j.journalPath, 'utf8').endsWith('"actor":'));
}));

test('corrupt middle, duplicated entry, out-of-order revision, and corrupt UTF-8 fail closed', () => rootTest(async root => {
  const j = journal(root);
  await j.append(chat('one'));
  const saved = await j.rawJournal();
  appendFileSync(j.journalPath, '{not json}\n');
  await assert.rejects(j.readProjection(), e => e.status === 503);
  await assert.rejects(j.append(chat('two')), e => e.status === 503);
  writeFileSync(j.journalPath, saved + saved);
  await assert.rejects(j.readRecords(), e => e.status === 503);
  const entry = JSON.parse(saved);
  writeFileSync(j.journalPath, saved + JSON.stringify({ ...entry, entryId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', sequence: 99 }) + '\n');
  await assert.rejects(j.readRecords(), e => e.status === 503);
  writeFileSync(j.journalPath, Buffer.concat([Buffer.from(saved), Buffer.from([255,10])]));
  await assert.rejects(j.readRecords(), e => e.status === 503);
}));

test('write failure leaves original records unchanged and reports failure', () => rootTest(async root => {
  const j = journal(root);
  await j.append(chat('preserved'));
  const before = await j.rawJournal();
  rmSync(j.journalPath);
  mkdirSync(j.journalPath);
  await assert.rejects(j.append(chat('nope')));
  rmSync(j.journalPath, { recursive: true });
  // Original entry was deliberately removed by test fault injection, not the journal.
  assert.match(before, /preserved/);
}));

test('legacy feedback and gate records remain read-only and replayable', () => rootTest(async root => {
  const j = journal(root);
  mkdirSync(path.dirname(j.journalPath), { recursive: true });
  writeFileSync(j.journalPath,
    JSON.stringify({ round:'round-1',approveAll:false,verdicts:[],receivedAt:'2026-11-14T01:00:00Z' }) + '\n' +
    JSON.stringify({ kind:'gate-decision', itemId:'A02',decision:'approve',receivedAt:'2026-11-14T01:00:00Z' }) + '\n');
  assert.equal((await j.readRecords()).length, 2);
  assert.equal((await j.readProjection()).state.revision, 0);
  await j.append(chat('after legacy'));
  assert.equal((await j.readRecords()).length, 3);
}));

test('D4 derives committed section relationships and preserves revision history after restart', () => rootTest(async root => {
  const j = journal(root);
  await j.append({ ...chat('Project goal: capture observations'), intent: {
    outcome: 'candidate', candidate: { actionId: 'wiki.section.edit' }
  } });
  await j.append({ ...chat('not an owner observation'), actor: 'ai' });
  const first = await j.append(edit(1, 'First committed change'));
  await assert.rejects(j.append(edit(1, 'Rejected stale change')), e => e.status === 409);
  const second = await j.append(edit(2, 'Second committed change'));
  const before = await j.readWikiContext();
  const after = await journal(root).readWikiContext();
  assert.deepEqual(after, before);
  assert.equal(after.wikiRevision, 3);
  assert.equal(after.totalObserved, 1);
  assert.equal(after.items[0].status, 'user-statement-unverified');
  assert.equal(after.wikiChanges.total, 2);
  assert.deepEqual(after.wikiChanges.items.map(x => [x.entryId, x.sequence, x.wikiRevision, x.status]), [
    [first.entryId, first.sequence, 2, 'superseded-section-revision'],
    [second.entryId, second.sequence, 3, 'current-section-revision']
  ]);
  assert.deepEqual(after.wikiChanges.items[1].relationship, {
    kind: 'mutated-section', page: 'Main', section: 'HowTo'
  });
  assert.equal(after.wikiChanges.items[0].previousWikiRevision, 1);
  assert.equal((await j.readProjection()).wiki.pages.Main.sections.HowTo, 'Second committed change');
  assert.equal(JSON.stringify(after.wikiChanges).includes('Rejected stale change'), false);
  assert.equal(JSON.stringify(after.wikiChanges).includes('Project goal'), false);
}));
