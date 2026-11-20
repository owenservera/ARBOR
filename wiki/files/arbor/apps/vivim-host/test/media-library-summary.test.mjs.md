# File: apps/vivim-host/test/media-library-summary.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/media-library-summary.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4278 B |
| Lines | 89 |
| Hash | b1532068025c |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| store | function | 8 | no | async function store(t) { |
| dir | const | 9 | no | const dir = await mkdtemp(path.join(tmpdir(), &#39;vivim-media-view-&#39;)); |
| save | function | 13 | no | const save = (dir, name, entries) =&gt; |
| dir | const | 17 | no | const dir = await store(t); |
| result | const | 25 | no | const result = await readMediaLibrarySummary({storeDir:dir}); |
| dir | const | 37 | no | const dir = await store(t); |
| absent | const | 38 | no | const absent = await readMediaLibrarySummary({storeDir:path.join(dir,&#39;absent&#39;)}); |
| corrupt | const | 42 | no | const corrupt = await readMediaLibrarySummary({storeDir:dir}); |
| outside | const | 45 | no | const outside = await store(t); |
| linked | const | 53 | no | const linked = await readMediaLibrarySummary({storeDir:dir}); |
| dir | const | 59 | no | const dir = await store(t); |
| result | const | 63 | no | const result = await readMediaLibrarySummary({storeDir:dir}); |
| dir | const | 72 | no | const dir=await store(t); |
| second | const | 77 | no | const second=await readMediaLibrarySummary({storeDir:dir,offset:25}); |
| last | const | 84 | no | const last=await readMediaLibrarySummary({storeDir:dir,offset:50}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../media/library-summary.mjs | import | 6 | [apps/vivim-host/media/library-summary.mjs](../media/library-summary.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readMediaLibrarySummary, MEDIA_SUMMARY_SCHEMA } from '../media/library-summary.mjs';

async function store(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'vivim-media-view-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}
const save = (dir, name, entries) =>
  writeFile(path.join(dir, name + '.json'), JSON.stringify({version:1, entries}));

test('direct mobile metadata is bounded, owner catalog-backed and never leaks download secrets', async t => {
  const dir = await store(t);
  await save(dir, 'library', [
    { id:'a', kind:'movie', title:'A Film', state:'complete', sourceUrl:'https://secret.invalid/magnet', infoHash:'sensitivehash' },
    { id:'b', kind:'show', title:'B Show', state:'seeded', sourceUrl:'https://secret.invalid/account' },
    { id:'x', kind:'podcast', title:'Other', state:'complete' },
    { id:'c', kind:'movie', title:'Pending', state:'dispatched' }
  ]);
  await save(dir, 'favorites', [{id:'b'}]);
  const result = await readMediaLibrarySummary({storeDir:dir});
  assert.equal(result.schema, MEDIA_SUMMARY_SCHEMA);
  assert.equal(result.state, 'ready');
  assert.equal(result.total, 3);
  assert.equal(result.items[0].title, 'B Show');
  assert.equal(result.items[0].favorite, true);
  assert.equal(result.items.find(x => x.title === 'A Film').state, 'complete');
  assert.equal(result.playback, 'not-integrated');
  assert.doesNotMatch(JSON.stringify(result), /secret|magnet|infoHash|sourceUrl|sensitivehash/);
});

test('missing, corrupt or symlinked media stores fail closed with no invented titles', async t => {
  const dir = await store(t);
  const absent = await readMediaLibrarySummary({storeDir:path.join(dir,'absent')});
  assert.equal(absent.state, 'unavailable');
  assert.deepEqual(absent.items, []);
  await writeFile(path.join(dir, 'library.json'), '{broken');
  const corrupt = await readMediaLibrarySummary({storeDir:dir});
  assert.equal(corrupt.reason, 'MEDIA_STORE_UNREADABLE');
  await rm(path.join(dir, 'library.json'));
  const outside = await store(t);
  await save(outside, 'library', [{id:'a',kind:'movie',title:'Private',state:'complete'}]);
  try { await symlink(path.join(outside,'library.json'), path.join(dir,'library.json')); }
  catch (error) {
    // Windows without Developer Mode may refuse symlink creation; other failures are real.
    if (process.platform === 'win32' && ['EPERM','ENOTSUP'].includes(error.code)) return;
    throw error;
  }
  const linked = await readMediaLibrarySummary({storeDir:dir});
  assert.equal(linked.state, 'unavailable');
  assert.deepEqual(linked.items, []);
});

test('a long store is capped to 25 visible rows with truthful total count', async t => {
  const dir = await store(t);
  await save(dir, 'library', Array.from({length:45}, (_,i)=>({
    id:'id-'+i, title:'Film '+i, kind:'movie', state:'folder-detected'
  })));
  const result = await readMediaLibrarySummary({storeDir:dir});
  assert.equal(result.total, 45);
  assert.equal(result.shown, 25);
  assert.equal(result.hasMore, true);
  assert.equal(result.items.length, 25);
});


test('a media page beyond the first is available without revealing the HQ row ID',async t=>{
  const dir=await store(t);
  await save(dir,'library',Array.from({length:60},(_,i)=>({
    id:'private-hq-id-'+i,title:'Film '+String(i).padStart(3,'0'),
    kind:'movie',state:'complete'
  })));
  const second=await readMediaLibrarySummary({storeDir:dir,offset:25});
  assert.equal(second.total,60);
  assert.equal(second.offset,25);
  assert.equal(second.pageSize,25);
```

_First 80 of 90 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
