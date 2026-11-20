# File: apps/mobile-relay/test/pwa-local-notes.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/pwa-local-notes.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3747 B |
| Lines | 64 |
| Hash | 6660dc5c2177 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| memory | function | 5 | no | function memory(){ |
| data | const | 6 | no | const data=new Map(); |
| storage | const | 11 | no | const storage=memory(),book=createLocalNotebook({storage, makeId:(()=&gt;{let i=0;return ()=&gt;&#39;safe-note-&#39;+(++i)})(),now:()=&gt;1700000000000}); |
| storage | const | 23 | no | const storage=memory();let i=0; |
| book | const | 24 | no | const book=createLocalNotebook({storage,makeId:()=&gt;(&#39;note-&#39;+(++i)).padEnd(9,&#39;x&#39;),now:()=&gt;1700000000000}); |
| fullBefore | const | 31 | no | const fullBefore=book.exportAll(); |
| original | const | 35 | no | const original=storage.getItem(NOTES_KEY); |
| storage | const | 41 | no | const storage={getItem(){throw Error(&#39;denied&#39;)},setItem(){throw Error(&#39;denied&#39;)}}; |
| book | const | 42 | no | const book=createLocalNotebook({storage,makeId:()=&gt; &#39;safe-note-45&#39;,now:()=&gt;1700000000000}); |
| storage | const | 48 | no | const storage=memory(),book=createLocalNotebook({storage, makeId:()=&gt; &#39;safe-id-123456&#39;,now:()=&gt;1700000000000}); |
| exported | const | 51 | no | const exported=JSON.parse(book.exportAll()); |
| rows | const | 59 | no | const rows=extractReviewedTasks(&#39;A normal statement\\nTODO: Call supplier\\n- [ ] Check order\\n- [x] Done\\nTODO: Call supplier&#39;);assert.deepEqual(rows,[&#39;Call supplier&#39;,&#39;Check order&#39;]); |
| storage | const | 60 | no | const storage=memory();let id=0;const book=createLocalNotebook({storage,makeId:()=&gt; &#39;batch-&#39;+(++id)+&#39;-safe&#39;,now:()=&gt;1700000000000}); |
| before | const | 62 | no | const before=book.exportAll();assert.throws(()=&gt;book.saveBatch([&#39;valid&#39;,&#39;&#39;]),/EMPTY_OR_TOO_LONG/);assert.equal(book.exportAll(),before); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../ux/local-notes.mjs | import | 3 | [apps/mobile-relay/ux/local-notes.mjs](../ux/local-notes.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalNotebook,NOTES_KEY,MAX_NOTE_LENGTH,extractReviewedTasks} from '../ux/local-notes.mjs';

function memory(){
  const data=new Map();
  return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),
    removeItem:k=>data.delete(k),raw:data};
}
test('notes persist only on explicit save and are never mixed with Host data',()=>{
  const storage=memory(),book=createLocalNotebook({storage,
    makeId:(()=>{let i=0;return ()=>'safe-note-'+(++i)})(),now:()=>1700000000000});
  assert.deepEqual(book.list(),[]);
  assert.equal(storage.raw.has(NOTES_KEY),false);
  book.save('Remember this on my device');
  assert.equal(book.list()[0].text,'Remember this on my device');
  assert.equal(storage.raw.size,1);
  assert.equal(storage.raw.has('relay.convs.v1'),false);
  assert.equal(book.remove('safe-note-1'),true);
  assert.deepEqual(book.list(),[]);
});
test('notes are bounded, treat markup as text and reject malformed storage',()=>{
  const storage=memory();let i=0;
  const book=createLocalNotebook({storage,makeId:()=>('note-'+(++i)).padEnd(9,'x'),now:()=>1700000000000});
  assert.throws(()=>book.save(''),/LOCAL_NOTE_EMPTY_OR_TOO_LONG/);
  assert.throws(()=>book.save('x'.repeat(MAX_NOTE_LENGTH+1)),/LOCAL_NOTE_EMPTY_OR_TOO_LONG/);
  book.save('<script>never run</script>');
  assert.equal(book.list()[0].text,'<script>never run</script>');
  for(let n=0;n<11;n++)book.save('Note '+n);
  assert.equal(book.list().length,12);
  const fullBefore=book.exportAll();
  assert.throws(()=>book.save('Note 12'),/LOCAL_NOTES_FULL/);
  assert.equal(book.exportAll(),fullBefore,'no earlier note is silently discarded');
  storage.setItem(NOTES_KEY,'{"schema":"wrong","notes":[{"text":"private"}]}');
  const original=storage.getItem(NOTES_KEY);
  assert.throws(()=>book.list(),/LOCAL_NOTES_CORRUPT/);
  assert.throws(()=>book.save('new note'),/LOCAL_NOTES_CORRUPT/);
  assert.equal(storage.getItem(NOTES_KEY),original,'corrupt data cannot be silently overwritten');
});
test('unavailable storage fails visibly without making any Host request',()=>{
  const storage={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};
  const book=createLocalNotebook({storage,makeId:()=> 'safe-note-45',now:()=>1700000000000});
  assert.throws(()=>book.list(),/LOCAL_NOTES_UNAVAILABLE/);
  assert.throws(()=>book.save('hello'),/LOCAL_NOTES_UNAVAILABLE/);
});

test('export is explicit, portable JSON and does not mutate local records',()=>{
  const storage=memory(),book=createLocalNotebook({storage,
    makeId:()=> 'safe-id-123456',now:()=>1700000000000});
  book.save('Local text and my own data');
  const exported=JSON.parse(book.exportAll());
  assert.equal(exported.schema,'vivim.pwa-local-notes/1');
  assert.equal(exported.notes.length,1);
  assert.equal(exported.notes[0].text,'Local text and my own data');
  assert.equal(book.list().length,1);
});

test('reviewed checklist extraction is explicit and batch persistence is all or nothing',()=>{
 const rows=extractReviewedTasks('A normal statement\nTODO: Call supplier\n- [ ] Check order\n- [x] Done\nTODO: Call supplier');assert.deepEqual(rows,['Call supplier','Check order']);
 const storage=memory();let id=0;const book=createLocalNotebook({storage,makeId:()=> 'batch-'+(++id)+'-safe',now:()=>1700000000000});
 book.saveBatch(rows);assert.deepEqual(book.list().map(n=>n.text),rows);
 const before=book.exportAll();assert.throws(()=>book.saveBatch(['valid','']),/EMPTY_OR_TOO_LONG/);assert.equal(book.exportAll(),before);
 assert.throws(()=>book.saveBatch(Array(11).fill('more')),/NOTES_FULL/);assert.equal(book.exportAll(),before);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
