# File: apps/vivim-host/chat/product-journal.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/chat/product-journal.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 42477 B |
| Lines | 637 |
| Hash | a97c4ad5c633 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_JOURNAL_BYTES | const | 9 | no | const MAX_JOURNAL_BYTES = 8 * 1024 * 1024; |
| MAX_ENTRY_BYTES | const | 10 | no | const MAX_ENTRY_BYTES = 4096; |
| MAX_CHAT_TEXT | const | 11 | no | const MAX_CHAT_TEXT = 1000; |
| MAX_WIKI_TEXT | const | 12 | no | const MAX_WIKI_TEXT = 3072; // record (including metadata and UTF-8) must fit one 4KB append |
| SAFE_NAME | const | 13 | no | const SAFE_NAME = /^[A-Za-z][A-Za-z0-9 _.-]{0,79}$/; |
| SAFE_ID | const | 14 | no | const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,95}$/; |
| ACTORS | const | 15 | no | const ACTORS = new Set([&#39;human&#39;, &#39;ai&#39;, &#39;owner-browser&#39;, &#39;loop-agent&#39;]); |
| queues | const | 16 | no | const queues = new Map(); // serializes distinct journal objects sharing one path in this process |
| copy | function | 18 | no | function copy(value) { return JSON.parse(JSON.stringify(value)); } |
| invalid | function | 19 | no | function invalid(message, status = 400) { return Object.assign(new Error(message), { status }); } |
| ownKeys | function | 20 | no | function ownKeys(value, allowed) { |
| requireShape | function | 24 | no | function requireShape(ok, message, status) { if (!ok) throw invalid(message, status); } |
| byteSize | function | 25 | no | function byteSize(value) { return Buffer.byteLength(JSON.stringify(value), &#39;utf8&#39;); } |
| validateEnvelope | function | 27 | no | function validateEnvelope(entry, { stored = false } = {}) { |
| fault | const | 28 | no | const fault = stored ? 503 : 400; |
| base | const | 31 | no | const base = [&#39;kind&#39;, &#39;actor&#39;, &#39;schemaVersion&#39;]; |
| meta | const | 32 | no | const meta = stored ? [&#39;receivedAt&#39;, &#39;entryId&#39;, &#39;sequence&#39;] : []; |
| allowed | const | 33 | no | const allowed = { |
| legacyGate | const | 42 | no | const legacyGate = stored &amp;&amp; entry.kind === &#39;gate-decision&#39; &amp;&amp; entry.schemaVersion === undefined &amp;&amp; entry.actor === undefined; |
| actorOK | const | 45 | no | const actorOK = [&#39;wiki-edit&#39;,&#39;wiki-structure&#39;].includes(entry.kind) ? entry.actor === &#39;owner-browser&#39; : |
| e | const | 57 | no | const e = entry.edit; |
| b | const | 87 | no | const b=entry.sequenceBinding; |
| hasId | const | 93 | no | const hasId = Object.hasOwn(entry, &#39;entryId&#39;); |
| hasSeq | const | 94 | no | const hasSeq = Object.hasOwn(entry, &#39;sequence&#39;); |
| normalizeLegacy | function | 101 | no | function normalizeLegacy(record) { |
| PAGE_SLUG | const | 112 | no | const PAGE_SLUG = /^[A-Za-z][A-Za-z0-9-]{0,62}$/; |
| reservedPage | function | 113 | no | const reservedPage = name =&gt; [&#39;__proto__&#39;,&#39;constructor&#39;,&#39;prototype&#39;].includes(name.toLowerCase()); |
| validName | function | 114 | no | const validName = name =&gt; typeof name === &#39;string&#39; &amp;&amp; SAFE_NAME.test(name); |
| validateStructure | function | 115 | no | function validateStructure(edit, fault = 400) { |
| valid | const | 116 | no | const valid = edit?.action === &#39;create-page&#39; |
| canonicalPage | function | 126 | no | function canonicalPage(wiki, name, fault) { |
| matches | const | 127 | no | const matches = Object.keys(wiki.pages).filter(p =&gt; p.toLowerCase() === name.toLowerCase()); |
| applyWikiStructure | function | 131 | no | function applyWikiStructure(wiki, requested, fault = 409) { |
| order | const | 133 | no | const order = Object.keys(wiki.pages); |
| page | const | 137 | no | const page = requested.page; |
| page | const | 143 | no | const page = canonicalPage(wiki, requested.page, fault), from = order.indexOf(page); |
| to | const | 144 | no | const to = ({top:0,bottom:order.length-1,up:Math.max(0,from-1),down:Math.min(order.length-1,from+1)})[requested.position]; |
| after | const | 146 | no | const after = [...order]; after.splice(from,1); after.splice(to,0,page); |
| links | const | 154 | no | const links = wiki.pages[from].links ?? []; |
| previewWikiStructure | function | 163 | yes | export function previewWikiStructure(wiki, edit) { |
| next | const | 166 | no | const next=copy(wiki), preview=applyWikiStructure(next,edit); |
| applySectionEdit | function | 172 | no | function applySectionEdit(wiki,entry,fault){ |
| applyStructureEdit | function | 179 | no | function applyStructureEdit(wiki,entry,fault){ |
| applied | const | 181 | no | const applied=applyWikiStructure(wiki,entry.edit,fault); |
| previewWikiPayload | function | 185 | yes | export function previewWikiPayload(wiki,payload){ |
| next | const | 188 | no | const next=copy(wiki); |
| replayProductJournal | function | 194 | yes | export function replayProductJournal(seedState, seedWiki, records) { |
| wiki | const | 195 | no | const wiki = copy(seedWiki); |
| chat | const | 196 | no | const chat = copy(seedState.chat \|\| []); |
| lastAt | variable | 197 | no | let lastAt = seedState.at \|\| new Date(0).toISOString(); |
| productRevision | variable | 198 | no | let productRevision = 0; |
| ids | const | 199 | no | const ids = new Set(); |
| e | const | 201 | no | const e = normalizeLegacy(records[i]); |
| validateWikiEditTarget | function | 227 | no | function validateWikiEditTarget(payload,wiki,fault=409){ |
| e | const | 229 | no | const e=payload.edit; |
| validateProductEdit | function | 242 | yes | export function validateProductEdit(payload,wiki){ |
| previewWikiCapture | function | 246 | yes | export function previewWikiCapture(wiki,{capture_id,kind,content}={}){ |
| page | const | 248 | no | const page=kind+&#39;-&#39;+createHash(&#39;sha256&#39;).update(JSON.stringify([kind,capture_id])).digest(&#39;hex&#39;).slice(0,32); |
| section | const | 249 | no | const section=kind===&#39;task&#39;?&#39;Task&#39;:&#39;Note&#39;; |
| edit | const | 250 | no | const edit={action:&#39;capture-&#39;+kind,page,section,content}; |
| payload | const | 251 | no | const payload={kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision:wiki.revision,edit}; |
| projectPersonalCaptures | function | 258 | yes | export function projectPersonalCaptures(records,wiki){ |
| items | const | 259 | no | const items=[]; |
| page | const | 262 | no | const page=wiki.pages[e.edit.page];if(!page\|\|typeof page.sections[e.edit.section]!==&#39;string&#39;)continue; |
| kind | const | 263 | no | const kind=e.edit.action===&#39;capture-task&#39;?&#39;task&#39;:&#39;note&#39;; |
| counts | const | 267 | no | const counts={notes:0,openTasks:0,doneTasks:0,unknownTasks:0}; |
| category | function | 268 | no | const category=row=&gt;row.kind===&#39;note&#39;?&#39;notes&#39;:row.status===&#39;Open&#39;?&#39;openTasks&#39;:row.status===&#39;Done&#39;?&#39;doneTasks&#39;:&#39;unknownTasks&#39;; |
| recent | const | 269 | no | const recent=items.slice().reverse();for(const row of recent)counts[category(row)]++; |
| selected | const | 272 | no | const selected=new Set([...recent.filter(r=&gt;category(r)===&#39;openTasks&#39;).slice(0,128),...recent.filter(r=&gt;category(r)===&#39;notes&#39;).slice(0,96)]); |
| window | const | 274 | no | const window=recent.filter(r=&gt;selected.has(r)); |
| projectProgramSources | function | 281 | yes | export function projectProgramSources(records,wiki,ids){ |
| wanted | const | 283 | no | const wanted=new Set(ids),latest=new Map(),selected=new Map(); |
| key | const | 285 | no | const key=JSON.stringify([e.edit.page,e.edit.section]);latest.set(key,e); |
| items | const | 288 | no | const items=[]; |
| e | const | 290 | no | const e=hit.entry,content=wiki.pages[e.edit.page]?.sections?.[e.edit.section]; |
| projectWikiChanges | function | 299 | no | function projectWikiChanges(records, { currentOnly = false } = {}) { |
| latestBySection | const | 300 | no | const latestBySection = new Map(); |
| identified | const | 301 | no | const identified = []; |
| key | const | 304 | no | const key = JSON.stringify([e.edit.page, e.edit.section]); |
| selected | const | 308 | no | const selected = currentOnly ? identified.filter(e =&gt; latestBySection.get(JSON.stringify([e.edit.page, e.edit.section])) === e.expectedRevision + 1) : identified; |
| items | const | 310 | no | const items = selected.slice(-24).map(e =&gt; ({ source: &#39;host-product-journal&#39;, entryId: e.entryId, sequence: e.sequence, receivedAt: e.receivedAt, kind: &#39;committed-wiki-edit&#39;, contentDigest: createHas… |
| projectWikiContext | function | 325 | yes | export function projectWikiContext(records, wikiRevision = null, wiki = null) { |
| observed | const | 326 | no | const observed = records.filter(e =&gt; e?.kind === &#39;chat-send&#39; &amp;&amp; (e.actor === &#39;human&#39; \|\| e.actor === &#39;owner-browser&#39;) &amp;&amp; typeof e.entryId === &#39;string&#39; &amp;&amp; Number.isSafeInteger(e.sequence)); |
| latest | const | 329 | no | const latest = observed.slice(-24); |
| context | const | 330 | no | const context = { |
| outcome | const | 337 | no | const outcome = typeof e.intent?.outcome === &#39;string&#39; ? e.intent.outcome.slice(0, 64) : null; |
| actionId | const | 338 | no | const actionId = typeof e.intent?.candidate?.actionId === &#39;string&#39; |
| target | const | 340 | no | const target = resolveSemanticWikiTarget(wiki, e.intent); |
| pageTargets | const | 341 | no | const pageTargets = resolveSemanticWikiPages(wiki,e.intent); |
| projectAppliedControlEffects | function | 354 | yes | export function projectAppliedControlEffects(control, wikiChanges = null, wikiStructure = null) { |
| recent | const | 356 | no | const recent = control.recent(100); |
| items | const | 357 | no | const items = [], seenPlans=new Set(); |
| detail | const | 362 | no | const detail = control.status(summary.planId); |
| receipt | const | 363 | no | const receipt = detail?.receipt; |
| wikiLink | variable | 372 | no | let wikiLink = null, structureLink = null; |
| result | const | 374 | no | const result = receipt.result; |
| edit | const | 375 | no | const edit = wikiChanges?.items?.find(e =&gt; e.entryId === result?.entryId &amp;&amp; e.sequence === result?.sequence &amp;&amp; e.wikiRevision === result?.wikiRevision &amp;&amp; e.previousWikiRevision === result?.previousRe… |
| expectedStructure | const | 385 | no | const expectedStructure={ |
| result | const | 389 | no | const result=receipt.result; |
| event | const | 390 | no | const event=[...(wikiStructure?.items\|\|[]),...(wikiStructure?.links\|\|[])].find(e=&gt; e.entryId===result?.entryId&amp;&amp;e.sequence===result?.sequence&amp;&amp; e.wikiRevision===result?.wikiRevision&amp;&amp;e.previousWikiRe… |
| sequenceLinks | variable | 399 | no | let sequenceLinks=null; |
| result | const | 401 | no | const result=receipt.result,rows=result?.entries; |
| candidates | const | 404 | no | const candidates=row.kind===&#39;wiki-edit&#39;?wikiChanges?.items??[]:row.kind===&#39;wiki-structure&#39;?[...(wikiStructure?.items??[]),...(wikiStructure?.links??[])]:[]; |
| visualLink | variable | 411 | no | let visualLink=null; |
| result | const | 413 | no | const result=receipt.result; |
| sha | function | 414 | no | const sha=value=&gt;typeof value===&#39;string&#39;&amp;&amp;/^[a-f0-9]{64}$/.test(value); |
| createProductJournal | function | 445 | yes | export function createProductJournal({ dataRoot, seedState, seedWiki }) { |
| journalPath | const | 450 | no | const journalPath = path.resolve(dataRoot, &#39;product-state&#39;, &#39;journal.jsonl&#39;); |
| directory | const | 451 | no | const directory = path.dirname(journalPath); |
| snapshot | function | 452 | no | async function snapshot() { |
| bytes | variable | 453 | no | let bytes; |
| st | const | 455 | no | const st = await lstat(journalPath); |
| projection | const | 461 | no | const projection=replayProductJournal(seedState,seedWiki,[]); |
| finalLF | const | 467 | no | const finalLF = bytes.lastIndexOf(10); |
| committedBytes | const | 468 | no | const committedBytes = bytes.subarray(0, finalLF + 1); |
| text | variable | 469 | no | let text; |
| records | const | 472 | no | const records = []; |
| projection | const | 481 | no | const projection = replayProductJournal(seedState, seedWiki, records); |
| readRecords | function | 485 | no | async function readRecords() { return (await snapshot()).records; } |
| readProjection | function | 486 | no | async function readProjection() { return (await snapshot()).projection; } |
| readWikiContext | function | 487 | no | async function readWikiContext() { |
| current | const | 488 | no | const current = await snapshot(); // validates committed records and deterministic replay |
| readProgramSources | function | 494 | no | async function readProgramSources(ids){ |
| current | const | 495 | no | const current=await snapshot(); |
| readProgramEvidence | function | 499 | no | async function readProgramEvidence(targets,expectedRevision){ |
| current | const | 501 | no | const current=await snapshot(); |
| selected | const | 504 | no | const selected=new Map(),latest=new Map(); |
| key | const | 507 | no | const key=JSON.stringify([page,section]),entry=latest.get(key),content=current.wiki.pages[page]?.sections?.[section]; |
| ids | const | 511 | no | const ids=[...new Set(selected.values())]; |
| verified | const | 512 | no | const verified=ids.length?projectProgramSources(current.records,current.wiki,ids).items:[]; |
| byId | const | 513 | no | const byId=new Map(verified.map(e=&gt;[e.entryId,e])); |
| readNativeKnowledge | function | 517 | no | async function readNativeKnowledge({nativeOnly=false}={}) { |
| current | const | 518 | no | const current = await snapshot(); |
| context | const | 522 | no | const context = nativeOnly ? {wikiRevision:current.wikiRevision, |
| capturePages | const | 528 | no | const capturePages=current.records.filter(e=&gt;e.kind===&#39;wiki-edit&#39;&amp;&amp;[&#39;capture-note&#39;,&#39;capture-task&#39;].includes(e.edit.action)&amp;&amp; typeof e.entryId===&#39;string&#39;&amp;&amp;Object.hasOwn(current.wiki.pages,e.edit.page)… |
| changes | const | 533 | no | const changes = projectWikiChanges(current.records, { currentOnly: true }); |
| priority | const | 536 | no | const priority=new Set([...changes.items.map(e=&gt;e.relationship.page),...(context.wikiStructure?.links??[]).flatMap(e=&gt;[e.edit.from,e.edit.to])]); |
| newest | const | 537 | no | const newest=capturePages.slice().reverse();const selected=new Set(newest.filter(e=&gt;priority.has(e.page)).slice(0,256)); |
| records | const | 541 | no | const records = new Map(current.records.filter(e =&gt; e.entryId).map(e =&gt; [e.entryId, e])); |
| readPhoneWiki | function | 550 | no | async function readPhoneWiki() { |
| current | const | 551 | no | const current = await snapshot(); |
| changes | const | 554 | no | const changes = projectWikiChanges(current.records); |
| structure | const | 555 | no | const structure=projectWikiStructure(current.records,wiki); |
| phoneStructure | const | 558 | no | const phoneStructure={...structure, |
| appendEntries | function | 568 | no | function appendEntries(payloads,{sequence=false,expectedPagesDigest=null,sequenceBinding=null}={}) { |
| run | function | 569 | no | const run = async () =&gt; { |
| current | const | 573 | no | const current=await snapshot(); |
| wiki | variable | 576 | no | let wiki=current.wiki; |
| entries | const | 577 | no | const entries=[]; |
| entry | const | 581 | no | const entry={...copy(payload),receivedAt:new Date().toISOString(),entryId:randomUUID(),sequence:current.records.length+entries.length+1,...(sequenceBinding?{sequenceBinding:{...sequenceBinding,step:e… |
| next | const | 584 | no | const next=replayProductJournal(seedState,seedWiki,[...current.records,...entries]); |
| data | const | 587 | no | const data=entries.map(entry=&gt;JSON.stringify(entry)+&#39;\\n&#39;).join(&#39;&#39;); |
| length | const | 588 | no | const length=Buffer.byteLength(data,&#39;utf8&#39;); |
| dirStat | const | 591 | no | const dirStat=await lstat(directory); |
| handle | const | 593 | no | const handle=await open(journalPath,constants.O_APPEND\|constants.O_WRONLY\|constants.O_CREAT\|(constants.O_NOFOLLOW\|\|0),0o600); |
| st | const | 595 | no | const st=await handle.stat(); |
| observed | variable | 604 | no | let observed;try{observed=await snapshot();}catch{throw invalid(&#39;Wiki sequence readback unavailable; outcome uncertain&#39;,503);} |
| before | const | 615 | no | const before = queues.get(journalPath) \|\| Promise.resolve(); |
| pending | const | 616 | no | const pending = before.then(run, run); |
| settled | const | 617 | no | const settled = pending.then(() =&gt; {}, () =&gt; {}); |
| append | function | 622 | no | function append(payload){return appendEntries([payload]);} |
| appendWikiSequence | function | 623 | no | function appendWikiSequence(payloads,expectedPagesDigest,sequenceBinding=null){return appendEntries(copy(payloads),{sequence:true,expectedPagesDigest,sequenceBinding:sequenceBinding?copy(sequenceBind… |
| readWikiSequenceEvidence | function | 624 | no | async function readWikiSequenceEvidence(planId,planDigest,payloads){ |
| current | const | 625 | no | const current=await snapshot();const records=current.records.filter(e=&gt;e.sequenceBinding?.planId===planId); |
| evidence | const | 626 | no | const evidence=[]; |
| b | const | 628 | no | const b=e.sequenceBinding,expected=payloads[i]; |
| rawJournal | function | 635 | no | async function rawJournal() { return (await snapshot()).committed; } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:crypto | import | 4 | external |
| ./wiki-semantics.mjs | import | 5 | [apps/vivim-host/chat/wiki-semantics.mjs](./wiki-semantics.mjs.md) |
| node:path | import | 6 | external |
| ./product-baseline.mjs | import | 7 | [apps/vivim-host/chat/product-baseline.mjs](./product-baseline.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/chat/rust-context.mjs](./rust-context.mjs.md) | ./product-journal.mjs |
| [apps/vivim-host/control/dispatcher.mjs](../control/dispatcher.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./chat/product-journal.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../test/control-dispatcher.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../test/control-dispatcher.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../test/control-dispatcher.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../test/control-dispatcher.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../test/control-dispatcher.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/control-wiki-execution.test.mjs](../test/control-wiki-execution.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/native-capture-wiring.test.mjs](../test/native-capture-wiring.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/native-knowledge-integration.test.mjs](../test/native-knowledge-integration.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/product-journal.test.mjs](../test/product-journal.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/wiki-capture.test.mjs](../test/wiki-capture.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/wiki-capture.test.mjs](../test/wiki-capture.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/wiki-capture.test.mjs](../test/wiki-capture.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/wiki-living-knowledge.test.mjs](../test/wiki-living-knowledge.test.mjs.md) | ../chat/product-journal.mjs |
| [apps/vivim-host/test/wiki-structure.test.mjs](../test/wiki-structure.test.mjs.md) | ../chat/product-journal.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Host-local, append-only product journal. Never grants privileged control effects.
import { constants } from 'node:fs';
import { mkdir, readFile, lstat, open } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { projectWikiSemantics, resolveSemanticWikiTarget, projectWikiStructure, resolveSemanticWikiPages } from './wiki-semantics.mjs';
import path from 'node:path';
import { loadProductBaseline } from './product-baseline.mjs';

const MAX_JOURNAL_BYTES = 8 * 1024 * 1024;
const MAX_ENTRY_BYTES = 4096;
const MAX_CHAT_TEXT = 1000;
const MAX_WIKI_TEXT = 3072; // record (including metadata and UTF-8) must fit one 4KB append
const SAFE_NAME = /^[A-Za-z][A-Za-z0-9 _.-]{0,79}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,95}$/;
const ACTORS = new Set(['human', 'ai', 'owner-browser', 'loop-agent']);
const queues = new Map(); // serializes distinct journal objects sharing one path in this process

function copy(value) { return JSON.parse(JSON.stringify(value)); }
function invalid(message, status = 400) { return Object.assign(new Error(message), { status }); }
function ownKeys(value, allowed) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).every(key => allowed.includes(key));
}
function requireShape(ok, message, status) { if (!ok) throw invalid(message, status); }
function byteSize(value) { return Buffer.byteLength(JSON.stringify(value), 'utf8'); }

function validateEnvelope(entry, { stored = false } = {}) {
  const fault = stored ? 503 : 400;
  if (!stored && ['gate-decision', 'feedback-round'].includes(entry?.kind))
    throw invalid('Legacy feedback is read-only', 410);
  const base = ['kind', 'actor', 'schemaVersion'];
  const meta = stored ? ['receivedAt', 'entryId', 'sequence'] : [];
  const allowed = {
    'chat-send': [...base, 'text', 'intent', ...meta],
    'wiki-edit': [...base, 'expectedRevision', 'edit', ...meta,...(stored?['sequenceBinding']:[])],
    'wiki-structure': [...base, 'expectedRevision', 'edit', ...meta,...(stored?['sequenceBinding']:[])],
    'gate-decision': [...base, 'itemId', 'decision', ...meta],
    'feedback-round': [...base, 'round', 'approveAll', 'verdicts', ...meta]
  };
  requireShape(entry && typeof entry === 'object' && !Array.isArray(entry) &&
    Object.hasOwn(allowed, entry.kind) && ownKeys(entry, allowed[entry.kind]), 'Invalid journal envelope', fault);
  const legacyGate = stored && entry.kind === 'gate-decision' && entry.schemaVersion === undefined && entry.actor === undefined;
  requireShape(entry.schemaVersion === 1 || legacyGate, 'Invalid journal schema version', fault);
  if (!legacyGate) {
    const actorOK = ['wiki-edit','wiki-structure'].includes(entry.kind) ? entry.actor === 'owner-browser' :
      entry.kind === 'gate-decision' ? entry.actor === 'keeper' :
      entry.kind === 'feedback-round' ? entry.actor === 'loop-agent' : ACTORS.has(entry.actor);
    requireShape(actorOK, 'Invalid mutation actor scope', fault);
  }
  if (entry.kind === 'chat-send') {
    requireShape(typeof entry.text === 'string' && entry.text.trim().length > 0 &&
      entry.text.length <= MAX_CHAT_TEXT, 'Invalid chat text', fault);
    if (entry.intent !== undefined) requireShape(
      (entry.intent === null || (typeof entry.intent === 'object' && !Array.isArray(entry.intent))) &&
      byteSize(entry.intent) <= 2048, 'Invalid bounded intent projection', fault);
  } else if (entry.kind === 'wiki-edit') {
    const e = entry.edit;
    requireShape(ownKeys(e, ['action','page','section','content']) &&
      ['set-section','capture-note','capture-task'].includes(e.action) && typeof e.page === 'string' && SAFE_NAME.test(e.page) &&
      typeof e.section === 'string' && SAFE_NAME.test(e.section) &&
      typeof e.content === 'string' && Buffer.byteLength(e.content, 'utf8') <= MAX_WIKI_TEXT,
      'Invalid bounded Wiki set-section edit', fault);
    if(e.action!=='set-section')requireShape(
      /^note-[a-f0-9]{32}$/.test(e.page)&&e.action==='capture-note'&&e.section==='Note'||
      /^task-[a-f0-9]{32}$/.test(e.page)&&e.action==='capture-task'&&e.section==='Task',
      'Invalid capture identity',fault);
    if(e.action!=='set-section')requireShape(e.content.trim()===e.content&&e.content.length>0&&e.content.length<=1200&&
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(e.content),'Invalid capture text',fault);
    requireShape(Number.isSafeInteger(entry.expectedRevision) && entry.expectedRevision >= 0,
      'Wiki edit requires expectedRevision', stored ? 503 : 428);
  } else if (entry.kind === 'wiki-structure') {
    validateStructure(entry.edit, fault);
    requireShape(Number.isSafeInteger(entry.expectedRevision) && entry.expectedRevision >= 0,
      'Wiki structure requires expectedRevision', stored ? 503 : 428);
  } else if (entry.kind === 'gate-decision') {
    requireShape(typeof entry.itemId === 'string' && SAFE_ID.test(entry.itemId) &&
      ['approve','reject','defer'].includes(entry.decision), 'Invalid gate-decision record', fault);
  } else {
    requireShape(typeof entry.round === 'string' && SAFE_ID.test(entry.round) &&
      typeof entry.approveAll === 'boolean' && Array.isArray(entry.verdicts) && entry.verdicts.length <= 32 &&
```

_First 80 of 638 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
