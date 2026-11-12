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
