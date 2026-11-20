// Host-local, append-only product journal. Never grants privileged control effects.
import { constants } from 'node:fs';
import { mkdir, readFile, lstat, open } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { projectWikiSemantics, resolveSemanticWikiTarget, projectWikiStructure, resolveSemanticWikiPages } from './wiki-semantics.mjs';
import {runNativeProductPure} from '../control/native-product-pure.mjs';
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
      entry.verdicts.every(v => ownKeys(v, ['id','itemId','verdict','decision']) &&
        typeof (v.id ?? v.itemId) === 'string' && SAFE_ID.test(v.id ?? v.itemId) &&
        ['approve','reject','defer','pass','fail'].includes(v.verdict ?? v.decision)),
      'Invalid bounded feedback round', fault);
  }
  if(stored&&entry.sequenceBinding!==undefined){
    const b=entry.sequenceBinding;
    requireShape(b&&ownKeys(b,['planId','planDigest','step','total'])&&/^ctl-[a-f0-9]{16}$/.test(b.planId??'')&&/^[a-f0-9]{64}$/.test(b.planDigest??'')&&Number.isSafeInteger(b.total)&&b.total>=2&&b.total<=8&&Number.isSafeInteger(b.step)&&b.step>=1&&b.step<=b.total,'Invalid sequence provenance',503);
  }
  if (stored) {
    requireShape(typeof entry.receivedAt === 'string' && !Number.isNaN(Date.parse(entry.receivedAt)),
      'Invalid receivedAt', 503);
    const hasId = Object.hasOwn(entry, 'entryId');
    const hasSeq = Object.hasOwn(entry, 'sequence');
    requireShape(hasId === hasSeq && (!hasId ||
      (typeof entry.entryId === 'string' && /^[0-9a-f-]{36}$/.test(entry.entryId) &&
       Number.isSafeInteger(entry.sequence) && entry.sequence >= 1)), 'Invalid journal identity', 503);
  }
  requireShape(byteSize(entry) <= MAX_ENTRY_BYTES, 'Entry exceeds 4KB', stored ? 503 : 413);
}
function normalizeLegacy(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  // Older demo feedback writes had no kind; preserve their bytes and read-only semantics.
  if (!Object.hasOwn(record, 'kind') && ownKeys(record, ['round','approveAll','verdicts','receivedAt'])) {
    return { ...record, kind: 'feedback-round', actor: 'loop-agent', schemaVersion: 1 };
  }
  return record;
}

// Structure records share the existing journal/revision authority, but are not
// section-content edits. Existing section provenance and native consumers stay intact.
const PAGE_SLUG = /^[A-Za-z][A-Za-z0-9-]{0,62}$/;
const reservedPage = name => ['__proto__','constructor','prototype'].includes(name.toLowerCase());
const validName = name => typeof name === 'string' && SAFE_NAME.test(name);
function validateStructure(edit, fault = 400) {
  const valid = edit?.action === 'create-page'
    ? ownKeys(edit, ['action','page']) && typeof edit.page === 'string' &&
      PAGE_SLUG.test(edit.page) && !reservedPage(edit.page)
    : edit?.action === 'move-page'
      ? ownKeys(edit, ['action','page','position']) && validName(edit.page) &&
        ['top','bottom','up','down'].includes(edit.position)
      : edit?.action === 'link-pages' && ownKeys(edit, ['action','from','to']) &&
        validName(edit.from) && validName(edit.to);
  requireShape(valid, 'Invalid Wiki structure edit', fault);
}
function canonicalPage(wiki, name, fault) {
  const matches = Object.keys(wiki.pages).filter(p => p.toLowerCase() === name.toLowerCase());
  requireShape(matches.length === 1, 'Wiki page does not exist or is ambiguous', fault);
  return matches[0];
}
function applyWikiStructure(wiki, requested, fault = 409) {
  validateStructure(requested, fault);
  const order = Object.keys(wiki.pages);
  if (requested.action === 'create-page') {
    requireShape(!order.some(p => p.toLowerCase() === requested.page.toLowerCase()), 'Wiki page already exists', fault);
    requireShape(order.length < 256, 'Wiki page capacity reached', fault);
    const page = requested.page;
    Object.defineProperty(wiki.pages, page, {value:{sections:{About:''}}, enumerable:true, writable:true, configurable:true});
    return {edit:{action:'create-page',page},target:page,before:'Page does not exist',
      after:'Create page '+page+' with an empty About section at position '+(order.length+1)};
  }
  if (requested.action === 'move-page') {
    const page = canonicalPage(wiki, requested.page, fault), from = order.indexOf(page);
    const to = ({top:0,bottom:order.length-1,up:Math.max(0,from-1),down:Math.min(order.length-1,from+1)})[requested.position];
    requireShape(from !== to, 'Wiki page already at requested position', fault);
    const after = [...order]; after.splice(from,1); after.splice(to,0,page);
    wiki.pages = Object.fromEntries(after.map(p=>[p,wiki.pages[p]]));
    return {edit:{action:'move-page',page,position:requested.position},target:page,
      before:order.map((p,i)=>(i+1)+'. '+p).join('\n'),
      after:after.map((p,i)=>(i+1)+'. '+p).join('\n')};
  }
  const from = canonicalPage(wiki,requested.from,fault), to = canonicalPage(wiki,requested.to,fault);
  requireShape(from !== to,'Cannot link a Wiki page to itself',fault);
  const links = wiki.pages[from].links ?? [];
  requireShape(Array.isArray(links) && links.length < 128 && !links.includes(to),
    'Wiki link already exists or link capacity reached',fault);
  wiki.pages[from].links = [...links,to];
  return {edit:{action:'link-pages',from,to},target:from+' → '+to,
    before:links.length ? links.join('\n') : '(No outgoing links)',
    after:wiki.pages[from].links.join('\n')};
}
// Inert, exact revision-bound preview. The Host dispatcher remains sole effect authority.
export function previewWikiStructure(wiki, edit) {
  requireShape(Number.isSafeInteger(wiki?.revision) && wiki.pages && typeof wiki.pages === 'object',
    'Wiki structure unavailable',503);
  const next=copy(wiki), preview=applyWikiStructure(next,edit);
  return {...preview,expectedRevision:wiki.revision,
    pagesDigest:createHash('sha256').update(JSON.stringify(next.pages)).digest('hex')};
}

// Pure application shared by preflight, sequential preview and journal replay.
function applySectionEdit(wiki,entry,fault){
  validateWikiEditTarget(entry,wiki,fault);
  if(entry.edit.action==='set-section')wiki.pages[entry.edit.page].sections[entry.edit.section]=entry.edit.content;
  else Object.defineProperty(wiki.pages,entry.edit.page,{value:{sections:{[entry.edit.section]:entry.edit.content,
    ...(entry.edit.action==='capture-task'?{Status:'Open'}:{})}},enumerable:true,writable:true,configurable:true});
  wiki.revision++;
}
function applyStructureEdit(wiki,entry,fault){
  requireShape(entry.expectedRevision===wiki.revision,'Stale Wiki revision',fault);
  const applied=applyWikiStructure(wiki,entry.edit,fault);
  requireShape(Object.keys(entry.edit).every(k=>entry.edit[k]===applied.edit[k]),'Noncanonical Wiki structure record',fault);
  wiki.revision++;
}
// This write-queue preflight uses Rust to compute a pure structure patch from
// the committed Host snapshot. There is no Rust filesystem access or effect path.
async function previewNativeWikiStructure(wiki,payload){
  const source={schema:'vivim.wiki-structure-source/1',wikiRevision:wiki.revision,
    pages:Object.entries(wiki.pages).map(([name,page])=>({
      name,links:page.links??null
    })),edit:payload.edit};
  const native=await runNativeProductPure('wiki-structure-transition',source);
  if(native.state==='unavailable')return previewWikiPayload(wiki,payload);
  const value=native.result,patch=value?.patch;
  requireShape(native.state==='computed'&&value?.schema==='vivim.wiki-structure-transition/1'&&
    value.outcome==='computed'&&value.authority==='none'&&
    value.executionAuthorized===false&&value.effectPerformed===false&&
    value.previousRevision===wiki.revision&&value.wikiRevision===wiki.revision+1&&
    patch?.kind===payload.edit.action&&Array.isArray(patch.order)&&
    patch.order.length<=256&&new Set(patch.order).size===patch.order.length&&
    patch.order.every(name=>typeof name==='string')&&
    value.edit&&typeof value.edit==='object'&&
    Object.entries(payload.edit).every(([key,original])=>value.edit[key]===original),
    'Rust Wiki structure transition refused or incompatible',409);
  const previous=Object.keys(wiki.pages);
  const next=copy(wiki);
  if(patch.kind==='create-page'){
    requireShape(patch.page===payload.edit.page&&patch.order.length===previous.length+1&&
      JSON.stringify(patch.order)===JSON.stringify([...previous,patch.page])&&
      !Object.hasOwn(next.pages,patch.page),'Invalid Rust page creation patch',503);
    Object.defineProperty(next.pages,patch.page,{
      value:{sections:{About:''}},enumerable:true,writable:true,configurable:true
    });
  }else if(patch.kind==='move-page'){
    requireShape(patch.order.length===previous.length&&
      patch.order.every(name=>Object.hasOwn(next.pages,name))&&
      Object.hasOwn(next.pages,patch.page),'Invalid Rust move patch',503);
    next.pages=Object.fromEntries(patch.order.map(name=>[name,next.pages[name]]));
  }else if(patch.kind==='link-pages'){
    const old=next.pages[patch.from]?.links??[];
    requireShape(patch.order.length===previous.length&&
      JSON.stringify(patch.order)===JSON.stringify(previous)&&
      typeof patch.to==='string'&&Object.hasOwn(next.pages,patch.to)&&
      Array.isArray(old)&&Array.isArray(patch.links)&&
      patch.links.length===old.length+1&&
      JSON.stringify(patch.links)===JSON.stringify([...old,patch.to]),
      'Invalid Rust link patch',503);
    next.pages[patch.from].links=patch.links;
  }else throw invalid('Unknown Rust structure patch',503);
  next.revision++;
  return next;
}

export function previewWikiPayload(wiki,payload){
  validateEnvelope(payload);
  requireShape(['wiki-edit','wiki-structure'].includes(payload.kind),'Wiki sequence requires Wiki records',400);
  const next=copy(wiki);
  if(payload.kind==='wiki-edit')applySectionEdit(next,payload,409);
  else applyStructureEdit(next,payload,409);
  return next;
}

export function replayProductJournal(seedState, seedWiki, records) {
  const wiki = copy(seedWiki);
  const chat = copy(seedState.chat || []);
  let lastAt = seedState.at || new Date(0).toISOString();
  let productRevision = 0;
  const ids = new Set();
  for (let i = 0; i < records.length; i++) {
    const e = normalizeLegacy(records[i]);
    validateEnvelope(e, { stored: true });
    if (e.entryId) {
      requireShape(!ids.has(e.entryId) && e.sequence === i + 1, 'Duplicate or out-of-order journal entry', 503);
      ids.add(e.entryId);
    }
    if (e.kind === 'chat-send') {
      chat.push({ actor: e.actor, who: e.actor === 'owner-browser' || e.actor === 'human' ? 'user' : 'system',
        text: e.text, schemaVersion: e.schemaVersion, at: e.receivedAt, intent: e.intent || null,
        revision: ++productRevision });
      lastAt = e.receivedAt;
    } else if (e.kind === 'wiki-edit') {
      applySectionEdit(wiki,e,503);
      productRevision++;
      lastAt = e.receivedAt;
    } else if (e.kind === 'wiki-structure') {
      applyStructureEdit(wiki,e,503);
      productRevision++;
      lastAt=e.receivedAt;
    }
  }
  wiki.at = lastAt;
  return { state: { schemaVersion: 1, chat, wikiRevision: wiki.revision, revision: productRevision, at: lastAt },
    wiki, journalRevision: records.length };
}

function validateWikiEditTarget(payload,wiki,fault=409){
  requireShape(payload.expectedRevision===wiki.revision,'Stale Wiki revision',fault);
  const e=payload.edit;
  if(e.action==='set-section'){
    requireShape(Object.hasOwn(wiki.pages,e.page)&&wiki.pages[e.page]?.sections&&
      Object.hasOwn(wiki.pages[e.page].sections,e.section),'Wiki target does not exist',fault===503?503:404);
    // Only our typed personal task pages carry the bounded two-state lifecycle.
    // Ordinary handwritten Wiki sections retain their existing semantics.
    if(/^task-[a-f0-9]{32}$/.test(e.page)&&e.section==='Status'&&Object.hasOwn(wiki.pages[e.page].sections,'Task'))
      requireShape(['Open','Done'].includes(e.content),'Task status must be Open or Done',fault===503?503:400);
  }else{
    requireShape(!Object.keys(wiki.pages).some(p=>p.toLowerCase()===e.page.toLowerCase()),'Capture already exists; inspect Wiki before retrying',fault);
    requireShape(Object.keys(wiki.pages).length<256,'Wiki page capacity reached',fault===503?503:507);
  }
}
export function validateProductEdit(payload,wiki){
  validateEnvelope(payload);validateWikiEditTarget(payload,wiki);
}
// A capture is one atomic Wiki edit, not a separate task database or two independently approved writes.
export function previewWikiCapture(wiki,{capture_id,kind,content}={}){
  requireShape(typeof capture_id==='string'&&/^[A-Za-z0-9-]{8,80}$/.test(capture_id)&&['note','task'].includes(kind),'Invalid capture identity',400);
  const page=kind+'-'+createHash('sha256').update(JSON.stringify([kind,capture_id])).digest('hex').slice(0,32);
  const section=kind==='task'?'Task':'Note';
  const edit={action:'capture-'+kind,page,section,content};
  const payload={kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:wiki.revision,edit};
  validateProductEdit(payload,wiki);
  return {page,section,expectedRevision:wiki.revision,target:page+'/'+section,before:'New capture (no existing page)',
    after:content+(kind==='task'?'\n\nTask status: Open':''),edit};
}

// The Rust core owns capture selection/counting when present; the Host supplies
// only source fields derived from its replay-validated committed journal.
// A legacy unpackaged Host can still render the existing JS projection.
async function nativePersonalCaptures(records,wiki){
  const items=[];
  for(const e of records){
    if(e?.kind!=='wiki-edit'||!['capture-note','capture-task'].includes(e.edit?.action)||
      typeof e.entryId!=='string')continue;
    const page=wiki.pages[e.edit.page],section=e.edit.section;
    if(!page||typeof page.sections?.[section]!=='string')continue;
    const kind=e.edit.action==='capture-task'?'task':'note';
    const status=kind==='task'?
      (['Open','Done'].includes(page.sections.Status)?page.sections.Status:'Unknown'):null;
    items.push({kind,page:e.edit.page,section,entryId:e.entryId,
      createdRevision:e.expectedRevision+1,sectionPresent:true,status});
  }
  const native=await runNativeProductPure('wiki-capture-projection',{
    schema:'vivim.capture-source/1',wikiRevision:wiki.revision,items
  });
  if(native.state==='unavailable')return projectPersonalCaptures(records,wiki);
  const value=native.result;
  const keys=['notes','openTasks','doneTasks','unknownTasks'];
  requireShape(native.state==='computed'&&value?.schema==='vivim.personal-captures/1'&&
    value.authority==='committed-wiki-read-only'&&value.wikiRevision===wiki.revision&&
    value.total===items.length&&Array.isArray(value.items)&&value.items.length<=256&&
    Number.isSafeInteger(value.omitted)&&value.omitted>=0&&
    value.omitted+value.items.length===value.total&&
    keys.every(key=>Number.isSafeInteger(value.counts?.[key])&&value.counts[key]>=0)&&
    keys.reduce((sum,key)=>sum+value.counts[key],0)===value.total&&
    value.items.every(row=>items.some(item=>item.entryId===row.entryId&&
      item.page===row.page&&item.kind===row.kind&&item.createdRevision===row.createdRevision&&
      item.status===row.status || item.status===null&&row.status===undefined&&
        item.entryId===row.entryId&&item.page===row.page)),
    'Invalid native capture projection',503);
  return value;
}

// The capture list is a read model of actual committed creation records, never inferred from page names.
export function projectPersonalCaptures(records,wiki){
  const items=[];
  for(const e of records){
    if(e.kind!=='wiki-edit'||!['capture-note','capture-task'].includes(e.edit.action)||typeof e.entryId!=='string')continue;
    const page=wiki.pages[e.edit.page];if(!page||typeof page.sections[e.edit.section]!=='string')continue;
    const kind=e.edit.action==='capture-task'?'task':'note';
    items.push({kind,page:e.edit.page,section:e.edit.section,entryId:e.entryId,createdRevision:e.expectedRevision+1,
      ...(kind==='task'?{status:['Open','Done'].includes(page.sections.Status)?page.sections.Status:'Unknown'}:{})});
  }
  const counts={notes:0,openTasks:0,doneTasks:0,unknownTasks:0};
  const category=row=>row.kind==='note'?'notes':row.status==='Open'?'openTasks':row.status==='Done'?'doneTasks':'unknownTasks';
  const recent=items.slice().reverse();for(const row of recent)counts[category(row)]++;
  // Bounded UI window, but totals reflect the entire replayed capture history.
  // Reserve capacity for open tasks and notes rather than let completed history starve either.
  const selected=new Set([...recent.filter(r=>category(r)==='openTasks').slice(0,128),...recent.filter(r=>category(r)==='notes').slice(0,96)]);
  for(const row of recent){if(selected.size>=256)break;selected.add(row);}
  const window=recent.filter(r=>selected.has(r));
  return {schema:'vivim.personal-captures/1',authority:'committed-wiki-read-only',wikiRevision:wiki.revision,
    total:items.length,omitted:items.length-window.length,counts,items:window};
}

// Exact bounded program inputs resolve against all replay-validated section revisions,
// not only the recent context window. No raw content leaves this read port.
export function projectProgramSources(records,wiki,ids){
  requireShape(Array.isArray(ids)&&ids.length>0&&ids.length<=64&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&/^[0-9a-f-]{36}$/.test(id)),'Invalid native program source selection',400);
  const wanted=new Set(ids),latest=new Map(),selected=new Map();
  for(const e of records){if(e.kind!=='wiki-edit')continue;
    const key=JSON.stringify([e.edit.page,e.edit.section]);latest.set(key,e);
    if(wanted.has(e.entryId))selected.set(e.entryId,{key,entry:e});
  }
  const items=[];
  for(const id of ids){const hit=selected.get(id);if(!hit||latest.get(hit.key)!==hit.entry)continue;
    const e=hit.entry,content=wiki.pages[e.edit.page]?.sections?.[e.edit.section];
    // Replayed current text must still equal the selected commit; no seed/observation proof.
    if(typeof content!=='string'||content!==e.edit.content||e.expectedRevision+1>wiki.revision)continue;
    items.push({entryId:id,wikiRevision:e.expectedRevision+1,contentDigest:createHash('sha256').update(content,'utf8').digest('hex'),kind:'committed-wiki-edit',status:'current-section-revision'});
  }
  return {schema:'vivim.program-wiki-sources/1',authority:'host-product-journal',wikiRevision:wiki.revision,items};
}

// Source-identified observations only: user statements are not verified Wiki facts.
function projectWikiChanges(records, { currentOnly = false } = {}) {
  const latestBySection = new Map();
  const identified = [];
  for (const e of records) {
    if (e?.kind !== 'wiki-edit') continue;
    const key = JSON.stringify([e.edit.page, e.edit.section]);
    latestBySection.set(key, e.expectedRevision + 1);
    if (typeof e.entryId === 'string' && Number.isSafeInteger(e.sequence)) identified.push(e);
  }
  const selected = currentOnly ? identified.filter(e =>
    latestBySection.get(JSON.stringify([e.edit.page, e.edit.section])) === e.expectedRevision + 1) : identified;
  const items = selected.slice(-24).map(e => ({
    source: 'host-product-journal', entryId: e.entryId, sequence: e.sequence,
    receivedAt: e.receivedAt, kind: 'committed-wiki-edit',
    contentDigest: createHash('sha256').update(e.edit.content, 'utf8').digest('hex'),
    previousWikiRevision: e.expectedRevision, wikiRevision: e.expectedRevision + 1,
    status: latestBySection.get(JSON.stringify([e.edit.page, e.edit.section])) ===
      e.expectedRevision + 1 ? 'current-section-revision' : 'superseded-section-revision',
    ...(e.edit.action==='capture-note'||e.edit.action==='capture-task'?{captureKind:e.edit.action.slice(8)}:{}),
    ...(e.sequenceBinding?{sequenceBinding:e.sequenceBinding}:{}),
    relationship: { kind: 'mutated-section', page: e.edit.page, section: e.edit.section }
  }));
  return { total: selected.length, omitted: selected.length - items.length, items };
}

// Rust reconstructs the current/superseded Wiki lineage and recent/source-current
// windows from replay-admitted journal identities; no private text leaves Host.
async function nativeWikiChanges(records,{currentOnly=false}={}){
  const entries=records.filter(e=>e?.kind==='wiki-edit').map(e=>({
    page:e.edit.page,section:e.edit.section,action:e.edit.action,
    expectedRevision:e.expectedRevision,entryId:e.entryId??null,
    sequence:e.sequence??null,receivedAt:e.receivedAt??null,
    contentDigest:createHash('sha256').update(e.edit.content,'utf8').digest('hex'),
    sequenceBinding:e.sequenceBinding??null
  }));
  const native=await runNativeProductPure('wiki-change-projection',{
    schema:'vivim.wiki-change-source/1',currentOnly,entries
  });
  if(native.state==='unavailable')return projectWikiChanges(records,{currentOnly});
  const view=native.result;
  requireShape(native.state==='computed'&&view?.schema==='vivim.wiki-changes-projection/1'&&
    view.outcome==='computed'&&view.authority==='none'&&
    view.executionAuthorized===false&&view.effectPerformed===false&&
    Number.isSafeInteger(view.total)&&view.total>=0&&view.total<=entries.length&&
    Number.isSafeInteger(view.omitted)&&view.omitted>=0&&
    Array.isArray(view.items)&&view.items.length<=24&&
    view.total===view.omitted+view.items.length&&
    view.items.every(row=>row?.source==='host-product-journal'&&
      row.kind==='committed-wiki-edit'&&typeof row.entryId==='string'&&
      /^[a-f0-9]{64}$/.test(row.contentDigest??'')&&
      entries.some(entry=>entry.entryId===row.entryId&&entry.sequence===row.sequence&&
        entry.contentDigest===row.contentDigest&&entry.page===row.relationship?.page&&
        entry.section===row.relationship?.section&&
        entry.expectedRevision===row.previousWikiRevision&&
        row.wikiRevision===entry.expectedRevision+1)),
    'Invalid native Wiki change projection',503);
  return {total:view.total,omitted:view.omitted,items:view.items};
}

// A read model only: user statements and committed Wiki effects remain separate.
export function projectWikiContext(records, wikiRevision = null, wiki = null, nativeTargets = null, targetSource = null, nativeChanges = null) {
  const observed = records.filter(e => e?.kind === 'chat-send' &&
    (e.actor === 'human' || e.actor === 'owner-browser') &&
    typeof e.entryId === 'string' && Number.isSafeInteger(e.sequence));
  const latest = observed.slice(-24);
  const context = {
    schema: 'vivim.wiki-context/1', state: 'source-backed',
    revision: records.length, wikiRevision, totalObserved: observed.length,
    wikiChanges: nativeChanges??projectWikiChanges(records),
    wikiStructure: projectWikiStructure(records,wiki),
    omitted: observed.length - latest.length,
    nativeTargets: targetSource??(nativeTargets===null?'javascript-compatibility':'rust-source-backed'),
    items: latest.map((e,index) => {
      const outcome = typeof e.intent?.outcome === 'string' ? e.intent.outcome.slice(0, 64) : null;
      const actionId = typeof e.intent?.candidate?.actionId === 'string'
        ? e.intent.candidate.actionId.slice(0, 128) : null;
      const target = nativeTargets===null?resolveSemanticWikiTarget(wiki,e.intent):nativeTargets[index];
      const pageTargets = resolveSemanticWikiPages(wiki,e.intent);
      return {
        source: 'host-product-journal', entryId: e.entryId, sequence: e.sequence,
        receivedAt: e.receivedAt, actorDeclared: e.actor, text: e.text,
        contentDigest: createHash('sha256').update(JSON.stringify([e.text, e.intent || null])).digest('hex'),
        status: 'user-statement-unverified',
        ...(outcome ? { interpretation: { outcome, ...(actionId ? { actionId } : {}), ...(target ? { target } : {}), ...(pageTargets.length?{pageTargets}:{}) } } : {})
      };
    })
  };
  return { ...context, semantics: projectWikiSemantics(context) };
}

export function projectAppliedControlEffects(control, wikiChanges = null, wikiStructure = null) {
  // The existing dispatcher owns receipt reads. No new journal or graph writes.
  const recent = control.recent(100);
  const items = [], seenPlans=new Set();
  for (const summary of recent) {
    if (summary.state !== 'applied' || (summary.actionId === 'wiki.section.edit' && !wikiChanges) ||
        !['R1', 'R2'].includes(summary.risk)) continue;
    if(seenPlans.has(summary.planId)||summary.actionId?.startsWith('control.rule.'))continue;
    const detail = control.status(summary.planId);
    const receipt = detail?.receipt;
    if (detail?.state !== 'applied' || receipt?.schema !== 'vivim.control-receipt/1' ||
        receipt.status !== 'applied' || receipt.executionPerformed !== true ||
        receipt.planId !== summary.planId || receipt.actionId !== summary.actionId ||
        receipt.risk !== summary.risk || typeof receipt.planDigest !== 'string' ||
        !/^[a-f0-9]{64}$/.test(receipt.planDigest) || typeof receipt.at !== 'string' ||
        !Number.isFinite(Date.parse(receipt.at)) ||
        !['desktop-owner-token', 'direct-phone'].includes(receipt.approvedVia))
      throw new Error('Invalid applied control receipt');
    let wikiLink = null, structureLink = null;
    if (['wiki.section.edit','wiki.capture.save'].includes(receipt.actionId)) {
      const result = receipt.result;
      const edit = wikiChanges?.items?.find(e => e.entryId === result?.entryId &&
        e.sequence === result?.sequence && e.wikiRevision === result?.wikiRevision &&
        e.previousWikiRevision === result?.previousRevision &&
        e.relationship.page === result?.page && e.relationship.section === result?.section &&
        typeof result?.content === 'string' &&
        createHash('sha256').update(result.content, 'utf8').digest('hex') === e.contentDigest);
      // No exact committed source relation: do not double-count or invent one.
      if (!edit) continue;
      wikiLink = { kind: 'committed-wiki-change', entryId: edit.entryId, wikiRevision: edit.wikiRevision };
    }
    const expectedStructure={
      'wiki.page.create':'create-page','wiki.page.move':'move-page','wiki.pages.link':'link-pages'
    }[receipt.actionId];
    if(expectedStructure){
      const result=receipt.result;
      const event=[...(wikiStructure?.items||[]),...(wikiStructure?.links||[])].find(e=>
        e.entryId===result?.entryId&&e.sequence===result?.sequence&&
        e.wikiRevision===result?.wikiRevision&&e.previousWikiRevision===result?.previousRevision&&
        e.edit.action===expectedStructure&&result?.edit&&
        Object.keys(result.edit).length===Object.keys(e.edit).length&&
        Object.keys(e.edit).every(key=>result.edit[key]===e.edit[key]));
      if(!event)continue;
      structureLink={kind:'committed-wiki-structure',entryId:event.entryId,wikiRevision:event.wikiRevision};
    }
    let sequenceLinks=null;
    if(receipt.actionId==='program.write_wiki'){
      const result=receipt.result,rows=result?.entries;
      if(result?.schema!=='vivim.wiki-change-result/1'||result.sequenceVerified!==true||!Array.isArray(rows)||rows.length<2||rows.length>8||result.wikiRevision!==result.previousRevision+rows.length)continue;
      sequenceLinks=rows.flatMap((row,i)=>{
        const candidates=row.kind==='wiki-edit'?wikiChanges?.items??[]:row.kind==='wiki-structure'?[...(wikiStructure?.items??[]),...(wikiStructure?.links??[])]:[];
        const match=candidates.find(e=>e.entryId===row.entryId&&e.sequence===row.sequence&&e.wikiRevision===row.wikiRevision&&row.wikiRevision===result.previousRevision+i+1&&e.sequenceBinding?.planId===receipt.planId&&e.sequenceBinding.planDigest===receipt.planDigest&&e.sequenceBinding.step===i+1&&e.sequenceBinding.total===rows.length&&
           (row.kind==='wiki-edit'?e.relationship.page===row.edit?.page&&e.relationship.section===row.edit?.section&&typeof row.edit?.content==='string'&&createHash('sha256').update(row.edit.content,'utf8').digest('hex')===e.contentDigest:JSON.stringify(row.edit)===JSON.stringify(e.edit)));
        return match?[{kind:match.kind,entryId:match.entryId,wikiRevision:match.wikiRevision,step:i+1}]:[];
      });
      if(!sequenceLinks.length)continue;
    }
    let visualLink=null;
    if(receipt.actionId==='ui.visual.apply'){
      const result=receipt.result;
      const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
      if(result?.persisted!==true||typeof result.surfaceId!=='string'||
        !/^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/.test(result.surfaceId)||
        typeof result.changeId!=='string'||!/^chg-[a-f0-9]{8}$/.test(result.changeId)||
        !Number.isSafeInteger(result.parentRevision)||result.parentRevision<0||
        !Number.isSafeInteger(result.revision)||result.revision!==result.parentRevision+1||
        !sha(result.previewDigest)||!sha(result.projectionDigest)||!sha(receipt.semanticDigest)||
        receipt.args?.surfaceId!==result.surfaceId||!sha(receipt.args?.proposalDigest))
          throw new Error('Invalid applied visual receipt');
      visualLink={kind:'committed-visual-revision',surfaceId:result.surfaceId,changeId:result.changeId,
        parentRevision:result.parentRevision,revision:result.revision,previewDigest:result.previewDigest,
        projectionDigest:result.projectionDigest,semanticDigest:receipt.semanticDigest};
    }
    seenPlans.add(summary.planId);
    items.push({
      ...(visualLink?{visualLink}:{}),
      ...(sequenceLinks?{sequenceLinks}:{}),
      ...(wikiLink ? { wikiLink } : {}),
      ...(structureLink ? { structureLink } : {}),
      source: 'host-control-receipt', planId: receipt.planId, planDigest: receipt.planDigest,
      actionId: receipt.actionId, receivedAt: receipt.at, kind: 'executed-effect',
      status: 'historical-applied-receipt',
      sourceRevision: wikiLink?.wikiRevision ?? structureLink?.wikiRevision ?? (sequenceLinks?receipt.result.wikiRevision:null) ??
        (Number.isSafeInteger(receipt.result?.revision) && receipt.result.revision >= 0 ? receipt.result.revision : null)
    });
  }
  items.sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt) || a.planId.localeCompare(b.planId));
  return { state: 'source-backed', scannedPlans: recent.length, scanLimit: 100,
    omitted: Math.max(0, items.length - 24), items: items.slice(0, 24) };
}

export function createProductJournal({ dataRoot, seedState, seedWiki }) {
  if (seedState === undefined && seedWiki === undefined)
    ({ seedState, seedWiki } = loadProductBaseline(dataRoot));
  else if (!seedState || !seedWiki)
    throw new TypeError('Both explicit replay fixtures are required');
  const journalPath = path.resolve(dataRoot, 'product-state', 'journal.jsonl');
  const directory = path.dirname(journalPath);
  async function snapshot() {
    let bytes;
    try {
      const st = await lstat(journalPath);
      requireShape(st.isFile() && !st.isSymbolicLink() && st.size <= MAX_JOURNAL_BYTES,
        'Unsafe or oversized product journal', 503);
      bytes = await readFile(journalPath);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        const projection=replayProductJournal(seedState,seedWiki,[]);
        return {records:[],committed:'',tornTail:false,size:0,wikiRevision:projection.wiki.revision,wiki:projection.wiki,projection};
      }
      throw error;
    }
    requireShape(bytes.length <= MAX_JOURNAL_BYTES, 'Product journal exceeds read limit', 503);
    const finalLF = bytes.lastIndexOf(10);
    const committedBytes = bytes.subarray(0, finalLF + 1);
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(committedBytes); }
    catch { throw invalid('Invalid journal UTF-8', 503); }
    const records = [];
    for (const line of text.split('\n').slice(0, -1)) {
      requireShape(line !== '' && Buffer.byteLength(line, 'utf8') <= MAX_ENTRY_BYTES,
        'Empty or oversized committed journal entry', 503);
      let record;
      try { record = JSON.parse(line); }
      catch { throw invalid('Corrupt committed journal segment', 503); }
      records.push(record);
    }
    const projection = replayProductJournal(seedState, seedWiki, records);
    return { records, committed: text, tornTail: finalLF !== bytes.length - 1, size: bytes.length,
      wikiRevision: projection.wiki.revision, wiki: projection.wiki, projection };
  }
  async function readRecords() { return (await snapshot()).records; }
  async function readProjection() { return (await snapshot()).projection; }
  async function readWikiContext() {
    const current=await snapshot(); // validated committed journal replay
    requireShape(!current.tornTail,'Wiki context unavailable: torn journal tail',503);
    const nativeChanges=await nativeWikiChanges(current.records);
    const latest=current.records.filter(e=>e?.kind==='chat-send'&&
      (e.actor==='human'||e.actor==='owner-browser')&&
      typeof e.entryId==='string'&&Number.isSafeInteger(e.sequence)).slice(-24);
    // Send identity and value *types* only. No private section text, credentials,
    // conversation messages or mutable client-supplied Wiki snapshots.
    const pages=Object.fromEntries(Object.entries(current.wiki?.pages??{}).map(
      ([page,data])=>[page,{sections:Object.fromEntries(Object.entries(data?.sections??{})
        .map(([section,value])=>[section,typeof value==='string'?'':null]))}]
    ));
    const intents=latest.map(e=>({outcome:e.intent?.outcome??null,
      candidate:{actionId:e.intent?.candidate?.actionId??null,
        args:{target:e.intent?.candidate?.args?.target??null}}}));
    if(!intents.some(row=>row.outcome==='candidate'&&row.candidate.actionId==='wiki.section.edit'))
      return projectWikiContext(current.records,current.wikiRevision,current.wiki,
        Array(latest.length).fill(null),'no-targets-to-resolve',nativeChanges);
    const native=await runNativeProductPure('wiki-target-batch',{wiki:{pages},intents});
    let targets=null;
    const result=native?.result;
    if(native?.state==='computed'&&result?.schema==='vivim.native-wiki-targets/1'&&
      result.authority==='none'&&result.executionAuthorized===false&&
      result.effectPerformed===false&&Array.isArray(result.results)&&
      result.results.length===latest.length&&result.results.every((target,i)=>{
        if(target===null)return true;
        if(!target||typeof target!=='object'||Array.isArray(target)||
          typeof target.page!=='string'||typeof target.section!=='string'||
          typeof current.wiki?.pages?.[target.page]?.sections?.[target.section]!=='string')
          return false;
        return intents[i]?.outcome==='candidate'&&
          intents[i]?.candidate?.actionId==='wiki.section.edit';
      }))targets=result.results;
    return projectWikiContext(current.records,current.wikiRevision,current.wiki,targets,
      targets===null?'rust-unavailable-javascript-compatibility':'rust-source-backed',nativeChanges);
  }
  // Owner-local native input. Use the same validated committed snapshot and
  // D4 identities, never the demo seed, unverified chat or client-supplied facts.
  async function readProgramSources(ids){
    const current=await snapshot();
    requireShape(!current.tornTail,'Native program sources unavailable: torn journal tail',503);
    return projectProgramSources(current.records,current.wiki,ids);
  }
  async function readProgramEvidence(targets,expectedRevision){
    requireShape(Array.isArray(targets)&&targets.length<=8&&targets.every(t=>t&&typeof t.page==='string'&&typeof t.section==='string'&&SAFE_NAME.test(t.page)&&SAFE_NAME.test(t.section)),'Invalid native program targets',400);
    const current=await snapshot();
    requireShape(!current.tornTail,'Native program sources unavailable: torn journal tail',503);
    requireShape(current.wikiRevision===expectedRevision,'Stale Wiki revision',409);
    const selected=new Map(),latest=new Map();
    for(const e of current.records){if(e.kind==='wiki-edit')latest.set(JSON.stringify([e.edit.page,e.edit.section]),e);}
    for(const {page,section} of targets){
      const key=JSON.stringify([page,section]),entry=latest.get(key),content=current.wiki.pages[page]?.sections?.[section];
      requireShape(typeof content==='string','Wiki program target unavailable',400);
      if(entry&&typeof entry.entryId==='string'&&entry.edit.content===content)selected.set(key,entry.entryId);
    }
    const ids=[...new Set(selected.values())];
    const verified=ids.length?projectProgramSources(current.records,current.wiki,ids).items:[];
    const byId=new Map(verified.map(e=>[e.entryId,e]));
    return {schema:'vivim.wiki-program-evidence/1',authority:'host-product-journal',wikiRevision:current.wikiRevision,
      items:targets.map(({page,section})=>({page,section,source:byId.get(selected.get(JSON.stringify([page,section])))??null}))};
  }
  async function readNativeKnowledge({nativeOnly=false}={}) {
    const current = await snapshot();
    requireShape(!current.tornTail, 'Native context unavailable: torn journal tail', 503);
    // Native ingestion needs only committed changes and structure, never the
    // private observation graph or its presentation relationships.
    const recentChanges=await nativeWikiChanges(current.records);
    const context = nativeOnly ? {wikiRevision:current.wikiRevision,
      wikiChanges:recentChanges,
      wikiStructure:projectWikiStructure(current.records,current.wiki)} :
      projectWikiContext(current.records, current.wikiRevision, current.wiki,
        null,null,recentChanges);
    // Capture creation is also page provenance, even after its content section is edited.
    // Keep the page identity tied to the original committed journal entry, not a mutable title.
    const capturePages=current.records.filter(e=>e.kind==='wiki-edit'&&['capture-note','capture-task'].includes(e.edit.action)&&
      typeof e.entryId==='string'&&Object.hasOwn(current.wiki.pages,e.edit.page)).map(e=>({
      page:e.edit.page,kind:e.edit.action==='capture-task'?'task':'note',entryId:e.entryId,
      wikiRevision:e.expectedRevision+1,receivedAt:e.receivedAt,
      contentDigest:createHash('sha256').update(e.edit.content,'utf8').digest('hex')}));
    const changes = await nativeWikiChanges(current.records, { currentOnly: true });
    // Native adapter accepts a bounded input. Preserve current section owners and linked pages
    // first, then fill the remainder with recent capture identities; the durable journal is unchanged.
    const priority=new Set([...changes.items.map(e=>e.relationship.page),...(context.wikiStructure?.links??[]).flatMap(e=>[e.edit.from,e.edit.to])]);
    const newest=capturePages.slice().reverse();const selected=new Set(newest.filter(e=>priority.has(e.page)).slice(0,256));
    for(const row of newest){if(selected.size>=256)break;selected.add(row);}
    context.capturePages=capturePages.filter(e=>selected.has(e));
    context.capturePagesOmitted=capturePages.length-context.capturePages.length;
    const records = new Map(current.records.filter(e => e.entryId).map(e => [e.entryId, e]));
    return { context, changes: { ...changes, items: changes.items.map(change => {
      const record = records.get(change.entryId);
      requireShape(record?.kind === 'wiki-edit' &&
        createHash('sha256').update(record.edit.content, 'utf8').digest('hex') === change.contentDigest,
        'Native context source mismatch', 503);
      return { ...change, content: record.edit.content };
    }) } };
  }
  async function readPhoneWiki() {
    const current = await snapshot();
    requireShape(!current.tornTail, 'Wiki context unavailable: torn journal tail', 503);
    const { wiki } = current;
    const changes = await nativeWikiChanges(current.records);
    const structure=projectWikiStructure(current.records,wiki);
    // Retain only Wiki-scoped structure provenance; no global sequence, receipts
    // or owner-private chat observations are returned to the paired device.
    const phoneStructure={...structure,
      items:structure.items.map(({sequence,sequenceBinding,...entry})=>entry),
      links:structure.links.map(({sequence,sequenceBinding,...entry})=>entry),
      pageSources:structure.pageSources.map(({page,role,event:{sequence,sequenceBinding,...event}})=>({page,role,event}))};
    // Phone Wiki read permission does not grant access to private chat/effects.
    // No global sequence or history content is disclosed through this overlay.
    const captures=await nativePersonalCaptures(current.records,wiki);
    return { ...wiki, personalCaptures:captures, wikiStructure:phoneStructure, autoWiki: { schema: 'vivim.autowiki-wiki-changes/1',
      wikiRevision: wiki.revision, scope: 'wiki-edits-only', total: changes.total, omitted: changes.omitted,
      items: changes.items.map(({ sequence, sequenceBinding, ...entry }) => entry) } };
  }
  function appendEntries(payloads,{sequence=false,expectedPagesDigest=null,sequenceBinding=null}={}) {
    const run = async () => {
      requireShape(Array.isArray(payloads)&&payloads.length>=1&&payloads.length<=8&&
        (!sequence||payloads.length>=2&&payloads.every(p=>['wiki-edit','wiki-structure'].includes(p?.kind))),
        'Invalid Wiki sequence',400);
      const current=await snapshot();
      requireShape(!current.tornTail,'Torn journal tail requires explicit owner repair',503);
      if(sequenceBinding)requireShape(!current.records.some(e=>e.sequenceBinding?.planId===sequenceBinding.planId),'Sequence already has committed records; inspect before deciding again',409);
      let wiki=current.wiki;
      const entries=[];
      for(const payload of payloads){
        validateEnvelope(payload);
        if(payload.kind==='wiki-edit')wiki=previewWikiPayload(wiki,payload);
        else if(payload.kind==='wiki-structure')wiki=await previewNativeWikiStructure(wiki,payload);
        const entry={...copy(payload),receivedAt:new Date().toISOString(),entryId:randomUUID(),sequence:current.records.length+entries.length+1,...(sequenceBinding?{sequenceBinding:{...sequenceBinding,step:entries.length+1,total:payloads.length}}:{})};
        validateEnvelope(entry,{stored:true});entries.push(entry);
      }
      const next=replayProductJournal(seedState,seedWiki,[...current.records,...entries]);
      // The replayed Host journal remains the source of truth; Rust's preflight
      // must converge to its exact revision and ordered Wiki pages before I/O.
      requireShape(wiki.revision===next.wiki.revision&&
        JSON.stringify(wiki.pages)===JSON.stringify(next.wiki.pages),
        'Rust Wiki transition diverged from committed Host replay',503);
      if(sequence)requireShape(createHash('sha256').update(JSON.stringify(next.wiki.pages)).digest('hex')===expectedPagesDigest,
        'Wiki sequence projection mismatch',409);
      const data=entries.map(entry=>JSON.stringify(entry)+'\n').join('');
      const length=Buffer.byteLength(data,'utf8');
      requireShape(current.size+length<=MAX_JOURNAL_BYTES,'Product journal capacity reached',507);
      await mkdir(directory,{recursive:true,mode:0o700});
      const dirStat=await lstat(directory);
      requireShape(dirStat.isDirectory()&&!dirStat.isSymbolicLink(),'Unsafe journal directory',503);
      const handle=await open(journalPath,constants.O_APPEND|constants.O_WRONLY|constants.O_CREAT|(constants.O_NOFOLLOW||0),0o600);
      try{
        const st=await handle.stat();
        requireShape(st.isFile()&&st.size===current.size,'Journal changed outside Host writer',503);
        const {bytesWritten}=await handle.write(Buffer.from(data));
        requireShape(bytesWritten===length,'Partial journal append; outcome uncertain',503);
        await handle.sync();
      }finally{await handle.close();}
      if(sequence){
        // Inspect actual committed records while still inside the shared write queue.
        // Failure after I/O is uncertain, never a pre-write CAS refusal.
        let observed;try{observed=await snapshot();}catch{throw invalid('Wiki sequence readback unavailable; outcome uncertain',503);}
        requireShape(!observed.tornTail&&observed.wikiRevision===next.wiki.revision&&
          observed.records.length===current.records.length+entries.length&&
          entries.every((e,i)=>JSON.stringify(e)===JSON.stringify(observed.records[current.records.length+i]))&&
          createHash('sha256').update(JSON.stringify(observed.wiki.pages)).digest('hex')===expectedPagesDigest,
          'Wiki sequence readback mismatch; outcome uncertain',503);
        return {wikiRevision:observed.wikiRevision,previousRevision:current.wikiRevision,pagesDigest:expectedPagesDigest,
          entries:entries.map((e,i)=>({entryId:e.entryId,sequence:e.sequence,kind:e.kind,edit:e.edit,wikiRevision:current.wikiRevision+i+1}))};
      }
      return {...entries[0],revision:next.state.revision,wikiRevision:next.wiki.revision};
    };
    const before = queues.get(journalPath) || Promise.resolve();
    const pending = before.then(run, run);
    const settled = pending.then(() => {}, () => {});
    queues.set(journalPath, settled);
    void settled.then(() => { if (queues.get(journalPath) === settled) queues.delete(journalPath); });
    return pending;
  }
  function append(payload){return appendEntries([payload]);}
  function appendWikiSequence(payloads,expectedPagesDigest,sequenceBinding=null){return appendEntries(copy(payloads),{sequence:true,expectedPagesDigest,sequenceBinding:sequenceBinding?copy(sequenceBinding):null});}
  async function readWikiSequenceEvidence(planId,planDigest,payloads){
    const current=await snapshot();const records=current.records.filter(e=>e.sequenceBinding?.planId===planId);
    const evidence=[];
    for(const [i,e] of records.entries()){
      const b=e.sequenceBinding,expected=payloads[i];
      const {receivedAt,entryId,sequence,sequenceBinding,...payload}=e;
      requireShape(expected&&b.planDigest===planDigest&&b.step===i+1&&b.total===payloads.length&&JSON.stringify(payload)===JSON.stringify(expected),'Sequence evidence mismatch',503);
      evidence.push({step:b.step,entryId,sequence,wikiRevision:e.expectedRevision+1,kind:e.kind,edit:e.edit});
    }
    return {schema:'vivim.wiki-sequence-evidence/1',authority:'read-only-journal-observation',state:current.tornTail?'torn-tail':evidence.length===payloads.length?'all-records-observed':evidence.length?'prefix-observed':'no-records-observed',expectedSteps:payloads.length,observedSteps:evidence.length,tornTail:current.tornTail,readAtWikiRevision:current.wikiRevision,entries:evidence,retryAuthorized:false};
  }
  async function rawJournal() { return (await snapshot()).committed; }
  return { journalPath, readRecords, readProjection, readWikiContext, readNativeKnowledge, readProgramSources, readProgramEvidence, readPhoneWiki, append, appendWikiSequence, readWikiSequenceEvidence, rawJournal };
}
