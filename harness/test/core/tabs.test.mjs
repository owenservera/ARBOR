import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { createTabRegistry, clearComposerExpression } from '../../src/core/tabs.mjs';

async function tempFile() {
  const dir = await mkdtemp(join(tmpdir(), 'tabs-'));
  return { dir, file: join(dir, 'tabs.json'), done: () => rm(dir, { recursive: true, force: true }) };
}

test('record / owned / isOwned', async () => {
  const t = await tempFile();
  try {
    const reg = createTabRegistry({ file: t.file });
    assert.deepEqual(await reg.owned(), []);
    await reg.record({ id: 'A', provider: 'chatgpt', url: 'https://chatgpt.com/' });
    const list = await reg.owned();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, 'A');
    assert.equal(list[0].provider, 'chatgpt');
    assert.equal(list[0].url, 'https://chatgpt.com/');
    assert.ok(!Number.isNaN(Date.parse(list[0].openedAt)));
    assert.equal(await reg.isOwned('A'), true);
    assert.equal(await reg.isOwned('B'), false);
    await reg.record({ id: 'A', provider: 'chatgpt', url: 'https://chatgpt.com/c/1' });
    assert.equal((await reg.owned()).length, 1, 're-recording an id does not duplicate it');
    assert.equal(await reg.forget('A'), true);
    assert.equal(await reg.isOwned('A'), false);
    await assert.rejects(reg.record({}), TypeError);
  } finally { await t.done(); }
});

test('persists across registry instances with no temp files left behind', async () => {
  const t = await tempFile();
  try {
    await createTabRegistry({ file: t.file }).record({ id: 'X', provider: 'claude', url: 'https://claude.ai/' });
    const second = createTabRegistry({ file: t.file });
    assert.equal(await second.isOwned('X'), true);
    assert.deepEqual(await readdir(t.dir), ['tabs.json']);
  } finally { await t.done(); }
});

test('prune drops ids no longer live', async () => {
  const t = await tempFile();
  try {
    const reg = createTabRegistry({ file: t.file });
    for (const id of ['A', 'B', 'C']) await reg.record({ id, provider: 'p', url: 'u' });
    assert.deepEqual(await reg.prune([{ id: 'B' }, { id: 'Z' }]), ['A', 'C']);
    assert.deepEqual((await reg.owned()).map(x => x.id), ['B']);
  } finally { await t.done(); }
});

test('closeOwned closes only owned ids and refuses the rest', async () => {
  const t = await tempFile();
  try {
    const reg = createTabRegistry({ file: t.file });
    await reg.record({ id: 'mine', provider: 'p', url: 'u' });
    const calls = [];
    const browser = { closeTarget: async id => { calls.push(id); } };
    const result = await reg.closeOwned({ browser, ids: ['mine', 'user-tab', 'other'] });
    assert.deepEqual(result, { closed: ['mine'], refused: ['user-tab', 'other'] });
    assert.deepEqual(calls, ['mine'], 'closeTarget never called for non-owned ids');
    assert.equal(await reg.isOwned('mine'), false);
    assert.deepEqual(await reg.closeOwned({ browser, ids: ['mine'] }), { closed: [], refused: ['mine'] });
    assert.deepEqual(calls, ['mine']);
  } finally { await t.done(); }
});

test('clearComposerExpression mentions each selector and clears the first match', () => {
  const selectors = ['#prompt-textarea', 'div.ProseMirror', 'textarea'];
  const expr = clearComposerExpression(selectors);
  assert.equal(typeof expr, 'string');
  for (const s of selectors) assert.ok(expr.includes(s), `mentions ${s}`);
  assert.throws(() => clearComposerExpression([]), TypeError);

  const events = [];
  const editor = { tagName: 'DIV', textContent: 'hello', dispatchEvent: e => events.push(e.type) };
  const document = { querySelector: s => (s === 'div.ProseMirror' ? editor : null) };
  class Event { constructor(type) { this.type = type; } }
  const n = vm.runInNewContext(expr, { document, Event, Object });
  assert.equal(n, 5);
  assert.equal(editor.textContent, '');
  assert.deepEqual(events, ['input']);
});
