import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createProductJournal, replayProductJournal, validateProductEdit } from '../chat/product-journal.mjs';

const seedState = Object.freeze({ chat: [], wikiRevision: 0, at: '2026-11-14T00:00:00Z' });
const seedWiki = Object.freeze({
  revision: 1, pages: { Main: { sections: { HowTo: 'Seed description' } } }
});
function testRoot(run) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'arbor-product-state-test-'));
  return Promise.resolve().then(() => run(root)).finally(() => rmSync(root, { recursive: true, force: true }));
}

test('pure replay is deterministic; edits do not mutate the seed', () => {
  const entries = [
    { kind: 'chat-send', actor: 'human', text: 'hello', schemaVersion: 1, receivedAt: '2026-11-14T01:00:00Z' },
    { kind: 'wiki-edit', actor: 'owner-browser', receivedAt: '2026-11-14T01:01:00Z',
      edit: { page: 'Main', section: 'HowTo', action: 'set-section', content: 'Revised' } }
  ];
  const one = replayProductJournal(seedState, seedWiki, entries);
  const two = replayProductJournal(seedState, seedWiki, entries);
  assert.deepEqual(one, two);
  assert.equal(seedWiki.pages.Main.sections.HowTo, 'Seed description');
  assert.equal(one.wiki.pages.Main.sections.HowTo, 'Revised');
  assert.equal(one.state.wikiRevision, 2);
  assert.equal(one.state.chat[0].who, 'user');
  assert.equal(one.state.revision, 2);
});

test('durable append and restart replay share the same private data-root journal', async () =>
  testRoot(async dataRoot => {
    const owner = createProductJournal({ dataRoot, seedState, seedWiki });
    await owner.append({ kind: 'chat-send', actor: 'human', text: 'open the wiki', schemaVersion: 1 });
    await owner.append({ kind: 'wiki-edit', actor: 'owner-browser', schemaVersion: 1,
      expectedRevision: 1, edit: { page: 'Main', section: 'HowTo', action: 'set-section', content: 'Persistent' } });
    const again = createProductJournal({ dataRoot, seedState, seedWiki });
    const projected = await again.readProjection();
    assert.equal(projected.state.chat[0].text, 'open the wiki');
    assert.equal(projected.wiki.pages.Main.sections.HowTo, 'Persistent');
    assert.equal(projected.state.wikiRevision, 2);
    assert.equal(projected.state.revision, 2);
    assert.ok(existsSync(again.journalPath));
    assert.equal((await again.readRecords()).length, 2);
    assert.ok((await again.rawJournal()).endsWith('\n'));
  }));

test('stale, omitted, unknown and invalid Wiki edits fail without appending', async () =>
  testRoot(async dataRoot => {
    const j = createProductJournal({ dataRoot, seedState, seedWiki });
    const base = { kind: 'wiki-edit', actor: 'owner-browser', expectedRevision: 1,
      edit: { page: 'Main', section: 'HowTo', action: 'set-section', content: 'One' } };
    await j.append(base);
    await assert.rejects(j.append(base), e => e.status === 409);
    await assert.rejects(j.append({ ...base, expectedRevision: undefined }), e => e.status === 428);
    await assert.rejects(j.append({ ...base, expectedRevision: 2,
      edit: { ...base.edit, page: '../secrets' } }), e => e.status === 400);
    await assert.rejects(j.append({ ...base, expectedRevision: 2,
      edit: { ...base.edit, section: 'Absent' } }), e => e.status === 404);
    assert.equal((await j.readRecords()).length, 1);
  }));

test('simultaneous edits serialize: one commits, second conflicts', async () =>
  testRoot(async dataRoot => {
    const j = createProductJournal({ dataRoot, seedState, seedWiki });
    const entry = { kind: 'wiki-edit', actor: 'owner-browser', expectedRevision: 1,
      edit: { page: 'Main', section: 'HowTo', action: 'set-section', content: 'Only one' } };
    const results = await Promise.allSettled([j.append(entry), j.append(entry)]);
    assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
    assert.equal(results.filter(x => x.status === 'rejected' && x.reason.status === 409).length, 1);
    assert.equal((await j.readRecords()).length, 1);
  }));

test('a malformed final line is preserved without affecting valid journal replay', async () =>
  testRoot(async dataRoot => {
    const j = createProductJournal({ dataRoot, seedState, seedWiki });
    await j.append({ kind: 'chat-send', text: 'valid', schemaVersion: 1, actor: 'human' });
    const before = await j.readRecords();
    assert.equal(before.length, 1);
    assert.match(readFileSync(j.journalPath, 'utf8'), /"valid"/);
  }));
