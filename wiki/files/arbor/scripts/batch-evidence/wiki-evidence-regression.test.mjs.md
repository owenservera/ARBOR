# File: scripts/batch-evidence/wiki-evidence-regression.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/batch-evidence/wiki-evidence-regression.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7713 B |
| Lines | 140 |
| Hash | ebfc50e6f94a |
| Test | yes |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| baseUrl | const | 9 | no | const baseUrl = &#39;http://127.0.0.1:43187&#39;; |
| ids | const | 10 | no | const ids = [&#39;wiki.page.create&#39;,&#39;wiki.section.edit&#39;,&#39;wiki.page.move&#39;,&#39;wiki.pages.link&#39;, |
| response | function | 13 | no | const response = (body, status=200, type=&#39;application/json&#39;) =&gt; |
| fixture | function | 15 | no | function fixture(t, flags={}) { |
| root | const | 16 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-a00-&#39;)); |
| write | function | 18 | no | const write = (p, value) =&gt; { |
| filename | const | 19 | no | const filename=path.join(root,p); |
| seed | const | 25 | no | const seed=&#39;apps/vivim-host/data/demo-baseline/wiki.json&#39;; |
| wiki | const | 26 | no | const wiki={revision:1,pages:{Main:{sections:{HowTo:&#39;Original&#39;}}}}; |
| journal | const | 28 | no | const journal=[]; |
| writes | variable | 29 | no | let writes=0; |
| get | function | 30 | no | const get=async route=&gt;{ |
| post | function | 43 | no | const post=async (route,payload,headers)=&gt;{ |
| entry | const | 51 | no | const entry={...payload,receivedAt:&#39;2026-11-14T12:00:00Z&#39;}; |
| run | function | 59 | no | async function run(t,flags={}) { |
| host | const | 60 | no | const host=fixture(t,flags); |
| result | const | 61 | no | const result=await runWikiEvidence({root:host.root,live:true,isolated:true,baseUrl,transport:host.transport}); |
| html | const | 78 | no | const html=&#39;&lt;link href=&quot;/wiki.css&quot;&gt;&lt;script src=&quot;/wiki.js&quot;&gt;&lt;/script&gt;&#39;; |
| js | const | 79 | no | const js=&#39;function renderWiki() {} function renderFileSurface() {} /api/wiki /api/journal&#39;; |
| host | const | 91 | no | const host=fixture(t); |
| result | const | 92 | no | const result=await runWikiEvidence({root:host.root}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ./WIKI-BASELINE.mjs | import | 6 | [scripts/batch-evidence/WIKI-BASELINE.mjs](./WIKI-BASELINE.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runWikiEvidence, parseJournalResponse, parseRawJournal,
  rendererSourceContract, assertIsolatedLive } from './WIKI-BASELINE.mjs';

const baseUrl = 'http://127.0.0.1:43187';
const ids = ['wiki.page.create','wiki.section.edit','wiki.page.move','wiki.pages.link',
  'wiki.section.read','wiki.pages.list','wiki.page.delete','send-message','read-state',
  'execute-intent','read-journal','get-capabilities'];
const response = (body, status=200, type='application/json') =>
  ({status,type,body: typeof body === 'string' ? body : JSON.stringify(body)});
function fixture(t, flags={}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'arbor-a00-'));
  t.after(() => rmSync(root, {recursive:true,force:true}));
  const write = (p, value) => {
    const filename=path.join(root,p);
    mkdirSync(path.dirname(filename),{recursive:true});
    writeFileSync(filename, typeof value === 'string' ? value : JSON.stringify(value));
  };
  write('apps/vivim-host/control/action-catalog.v1.json',{actions:ids.map(id=>({id}))});
  write('apps/vivim-host/data/demo-baseline/file-surface.v1.json',{records:[]});
  const seed='apps/vivim-host/data/demo-baseline/wiki.json';
  const wiki={revision:1,pages:{Main:{sections:{HowTo:'Original'}}}};
  write(seed,wiki);
  const journal=[];
  let writes=0;
  const get=async route=>{
    if(flags.failRoute===route) return response({error:'unavailable'},503);
    if(route==='/api/roadmap') return response({error:'not found'},404);
    if(route==='/api/wiki') return response(wiki);
    if(route==='/api/state') return response({wikiRevision:wiki.revision});
    if(route==='/api/journal') return response(flags.badArray ? {not:'an array'} : journal);
    if(route==='/api/journal?format=jsonl') return response(flags.corruptRaw ? '{corrupt}\n' :
      journal.map(JSON.stringify).join('\n')+(journal.length?'\n':''),200,'application/jsonl');
    if(route==='/wiki') return response('<link href="/wiki.css"><script src="/wiki.js"></script>',200,'text/html');
    if(route==='/wiki.js') return response('function renderWiki() {} function renderFileSurface() {} /api/wiki /api/journal',200,'text/javascript');
    if(route==='/wiki.css') return response('.wiki { display:block }',200,'text/css');
    return response({error:'not found'},404);
  };
  const post=async (route,payload,headers)=>{
    if(route!=='/api/mutate') return response({},404);
    if(!flags.ignoreOrigin && headers.origin!==baseUrl) return response({},403);
    if(headers['x-vivim-control']!=='1') return response({},403);
    if(!['owner-browser','human','ai','loop-agent'].includes(payload.actor)) return response({},400);
    if(!Number.isSafeInteger(payload.expectedRevision)) return response({},428);
    if(!flags.ignoreStale && payload.expectedRevision!==wiki.revision) return response({},409);
    writes++;
    const entry={...payload,receivedAt:'2026-11-14T12:00:00Z'};
    journal.push(entry);
    wiki.revision++; wiki.pages.Main.sections.HowTo=payload.edit.content;
    if(flags.mutateSeed) write(seed,wiki);
    return response({...entry,revision:writes,wikiRevision:wiki.revision});
  };
  return {root,seed,transport:{get,post},get writes(){return writes;}};
}
async function run(t,flags={}) {
  const host=fixture(t,flags);
  const result=await runWikiEvidence({root:host.root,live:true,isolated:true,baseUrl,transport:host.transport});
  return {host,result};
}
test('JSON array API rejects JSONL and non-arrays, but empty is valid',()=>{
  assert.deepEqual(parseJournalResponse('[]'),[]);
  assert.deepEqual(parseJournalResponse('[{}]'),[{}]);
  assert.throws(()=>parseJournalResponse('{"x":1}'),/array/);
  assert.throws(()=>parseJournalResponse('{}\n{}'),SyntaxError);
});
test('raw JSONL detects corruption rather than dropping evidence',()=>{
  assert.deepEqual(parseRawJournal(''),[]);
  assert.deepEqual(parseRawJournal('{}\n'),[{}]);
  assert.throws(()=>parseRawJournal('{}\n{broken}\n'),/Corrupt journal line 2/);
  assert.throws(()=>parseRawJournal('{}\n\n'),/Empty or torn/);
  assert.throws(()=>parseRawJournal('null\n'),/Invalid journal entry/);
});
test('source checks are not DOM checks; must have both external assets',()=>{
  const html='<link href="/wiki.css"><script src="/wiki.js"></script>';
  const js='function renderWiki() {} function renderFileSurface() {} /api/wiki /api/journal';
  assert.equal(rendererSourceContract(html,js,'.wiki{}'),true);
```

_First 80 of 141 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
