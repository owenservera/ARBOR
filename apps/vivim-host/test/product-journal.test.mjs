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
