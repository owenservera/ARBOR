import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalNotebook,NOTES_KEY,MAX_NOTE_LENGTH} from '../ux/local-notes.mjs';

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
  for(let n=0;n<18;n++)book.save('Note '+n);
  assert.equal(book.list().length,12);
  storage.setItem(NOTES_KEY,'{"schema":"wrong","notes":[{"text":"private"}]}');
  assert.deepEqual(book.list(),[]);
});
test('unavailable storage fails visibly without making any Host request',()=>{
  const storage={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};
  const book=createLocalNotebook({storage,makeId:()=> 'safe-note-45',now:()=>1700000000000});
  assert.throws(()=>book.list(),/LOCAL_NOTES_UNAVAILABLE/);
  assert.throws(()=>book.save('hello'),/LOCAL_NOTES_UNAVAILABLE/);
});
