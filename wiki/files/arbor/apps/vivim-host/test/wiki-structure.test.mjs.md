# File: apps/vivim-host/test/wiki-structure.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/wiki-structure.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2537 B |
| Lines | 39 |
| Hash | 6a673864a915 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dataRoot | const | 9 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-wiki-structure-&#39;)); |
| journal | const | 11 | no | const journal=createProductJournal({dataRoot}); |
| start | const | 12 | no | const start=await journal.readPhoneWiki(); |
| append | function | 13 | no | const append=(edit,expectedRevision)=&gt;journal.append({kind:&#39;wiki-structure&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,edit,expectedRevision}); |
| snapshot | const | 23 | no | const snapshot=await journal.readPhoneWiki(); |
| move | const | 24 | no | const move=previewWikiStructure(snapshot,{action:&#39;move-page&#39;,page:&#39;NOTES&#39;,position:&#39;top&#39;}); |
| reopened | const | 28 | no | const reopened=createProductJournal({dataRoot}); |
| wiki | const | 29 | no | const wiki=await reopened.readPhoneWiki(); |
| native | const | 35 | no | const native=await reopened.readNativeKnowledge(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../chat/product-journal.mjs | import | 6 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createProductJournal,previewWikiStructure} from '../chat/product-journal.mjs';

test('structural Wiki records share revision CAS and survive reopening without altering section provenance',async t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-wiki-structure-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const journal=createProductJournal({dataRoot});
  const start=await journal.readPhoneWiki();
  const append=(edit,expectedRevision)=>journal.append({kind:'wiki-structure',actor:'owner-browser',schemaVersion:1,edit,expectedRevision});
  await journal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:start.revision,
    edit:{action:'set-section',page:'Main',section:'About',content:'Preserve this content'}});
  await append({action:'create-page',page:'notes'},start.revision+1);
  await assert.rejects(append({action:'create-page',page:'NOTES'},start.revision+2));
  await assert.rejects(append({action:'create-page',page:'constructor'},start.revision+2));
  await assert.rejects(append({action:'link-pages',from:'Main',to:'notes'},start.revision+1),{status:409});
  await assert.rejects(append({action:'link-pages',from:'Main',to:'missing'},start.revision+2));
  await append({action:'link-pages',from:'Main',to:'notes'},start.revision+2);
  await assert.rejects(append({action:'link-pages',from:'Main',to:'notes'},start.revision+3));
  const snapshot=await journal.readPhoneWiki();
  const move=previewWikiStructure(snapshot,{action:'move-page',page:'NOTES',position:'top'});
  assert.equal(move.edit.page,'notes');
  assert.equal(move.expectedRevision,snapshot.revision);
  await append(move.edit,move.expectedRevision);
  const reopened=createProductJournal({dataRoot});
  const wiki=await reopened.readPhoneWiki();
  assert.deepEqual(Object.keys(wiki.pages),['notes','Main']);
  assert.equal(wiki.pages.Main.sections.About,'Preserve this content');
  assert.deepEqual(wiki.pages.Main.links,['notes']);
  assert.deepEqual(wiki.pages.notes.sections,{About:''});
  assert.equal(wiki.revision,start.revision+4);
  const native=await reopened.readNativeKnowledge();
  assert.equal(native.changes.items.length,1);
  assert.equal(native.changes.items[0].content,'Preserve this content');
  assert.equal((await reopened.readRecords()).length,4);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
