import test from 'node:test';
import assert from 'node:assert/strict';
import { searchPinnedText, validatePinnedTextQuery } from './pinned-text-search.mjs';
const file=(path,text)=>({path,blobSha:'a'.repeat(40),bytes:Buffer.from(text)});
const batch=files=>({schema:'arbor.hvi.pinned-blob-batch/1',files,repoIdentity:'owner/repo',resolvedCommitSha:'b'.repeat(40)});
test('literal Unicode and mixed line endings; no source bytes in result',()=>{
 const r=searchPinnedText(batch([file('a','😀 needle\r\nneedle twice needle\rno\nNeedle')]),{literal:'needle'});
 assert.deepEqual(r.matches.map(m=>[m.line,m.columnUtf16]),[[1,4],[2,1]]);
 assert.equal(r.truncated,false);assert.equal('bytes' in r.matches[0],false);
});
test('exact literal not regex; bounded first-per-line results',()=>{
 const b=batch([file('a','a.b\naXb\na.b')]);
 assert.equal(searchPinnedText(b,{literal:'a.b',limit:1}).truncated,true);
 const r=searchPinnedText(b,{literal:'a.b',limit:2});assert.equal(r.matches.length,2);assert.equal(r.truncated,false);
});
test('binary and malformed UTF-8 are skipped rather than searched',()=>{
 const r=searchPinnedText(batch([file('binary','x\0needle'),file('bad',[255,254]),file('good','needle')]),{literal:'needle'});
 assert.deepEqual(r.skipped,[{path:'binary',reason:'binary'},{path:'bad',reason:'not-utf8'}]);assert.equal(r.matches[0].path,'good');
});
test('reject invalid query, oversized files and cancellation',()=>{
 for(const q of [{literal:''},{literal:'a\n'},{literal:'a',limit:101},{literal:'a',regex:true}])
  assert.throws(()=>validatePinnedTextQuery(q),{code:'RESOURCE_LIMIT'});
 assert.throws(()=>searchPinnedText(batch([file('large','x'.repeat(65537))]),{literal:'x'}),{code:'RESOURCE_LIMIT'});
 const c=new AbortController();c.abort();assert.throws(()=>searchPinnedText(batch([file('a','x')]),{literal:'x'},{signal:c.signal}),{code:'RESOURCE_LIMIT'});
});
