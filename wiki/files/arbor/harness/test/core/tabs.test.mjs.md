# File: harness/test/core/tabs.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/core/tabs.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4089 B |
| Lines | 87 |
| Hash | c3b0461dd225 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| tempFile | function | 9 | no | async function tempFile() { |
| dir | const | 10 | no | const dir = await mkdtemp(join(tmpdir(), &#39;tabs-&#39;)); |
| t | const | 15 | no | const t = await tempFile(); |
| reg | const | 17 | no | const reg = createTabRegistry({ file: t.file }); |
| list | const | 20 | no | const list = await reg.owned(); |
| t | const | 37 | no | const t = await tempFile(); |
| second | const | 40 | no | const second = createTabRegistry({ file: t.file }); |
| t | const | 47 | no | const t = await tempFile(); |
| reg | const | 49 | no | const reg = createTabRegistry({ file: t.file }); |
| t | const | 57 | no | const t = await tempFile(); |
| reg | const | 59 | no | const reg = createTabRegistry({ file: t.file }); |
| calls | const | 61 | no | const calls = []; |
| browser | const | 62 | no | const browser = { closeTarget: async id =&gt; { calls.push(id); } }; |
| result | const | 63 | no | const result = await reg.closeOwned({ browser, ids: [&#39;mine&#39;, &#39;user-tab&#39;, &#39;other&#39;] }); |
| selectors | const | 73 | no | const selectors = [&#39;#prompt-textarea&#39;, &#39;div.ProseMirror&#39;, &#39;textarea&#39;]; |
| expr | const | 74 | no | const expr = clearComposerExpression(selectors); |
| events | const | 79 | no | const events = []; |
| editor | const | 80 | no | const editor = { tagName: &#39;DIV&#39;, textContent: &#39;hello&#39;, dispatchEvent: e =&gt; events.push(e.type) }; |
| document | const | 81 | no | const document = { querySelector: s =&gt; (s === &#39;div.ProseMirror&#39; ? editor : null) }; |
| Event | class | 82 | no | class Event { constructor(type) { this.type = type; } } |
| n | const | 83 | no | const n = vm.runInNewContext(expr, { document, Event, Object }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:vm | import | 6 | external |
| ../../src/core/tabs.mjs | import | 7 | [harness/src/core/tabs.mjs](../../src/core/tabs.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 88 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
