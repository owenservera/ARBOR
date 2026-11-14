#!/usr/bin/env bun
// scripts/batch-evidence/WIKI-BASELINE.mjs
//
// Gate-evidence runner for item WIKI-BASELINE — "Wiki baseline — page 2 realtime
// interpreted wiki" (arbor.item-receipt/1). Authored by oracle executing the
// keeper's published §2 WIKI rules while the keeper lane was unreachable
// (bus audit 57f4d0); keeper re-run on wake is authoritative.
//
//   bun scripts/batch-evidence/WIKI-BASELINE.mjs        static: catalog + seeds readable without HTTP
//   bun scripts/batch-evidence/WIKI-BASELINE.mjs --live HTTP renders + one deterministic wiki-edit through /api/mutate
//
// Prints exactly one JSON object: { ok, checks:[{name,pass,detail}], digest? }
// Exits nonzero when any check fails. Never edits server.mjs or wiki.json.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const ITEM = 'WIKI-BASELINE';
const BASE_URL = 'http://127.0.0.1:43187';
const WIKI_ACTIONS = ['wiki.page.create', 'wiki.section.edit', 'wiki.page.move', 'wiki.pages.link', 'wiki.section.read', 'wiki.pages.list', 'wiki.page.delete'];
const BASELINE_CAPS = ['send-message', 'read-state', 'execute-intent', 'read-journal', 'get-capabilities'];

const checks = [];
let live = false;

for (const arg of process.argv.slice(2)) {
  if (arg === '--live') live = true;
  else if (arg === '--help' || arg === '-h') {
    process.stdout.write(`usage: bun ${resolve(HERE, 'WIKI-BASELINE.mjs')} [--live]\n`);
    process.exit(0);
  } else {
    process.stderr.write(`${ITEM}: unknown argument: ${arg}\n`);
    process.exit(2);
  }
}

function fail(msg) {
  process.stderr.write(`${ITEM}: ${msg}\n`);
  process.exit(2);
}
function check(name, pass, detail) {
  checks.push({ name, pass: Boolean(pass), detail: String(detail) });
}
function digestOf(v) {
  return createHash('sha256').update(JSON.stringify(v)).digest('hex');
}
async function get(path) {
  const res = await fetch(BASE_URL + path);
  return { status: res.status, type: res.headers.get('content-type') || '', body: await res.text() };
}
async function post(path, body) {
  const res = await fetch(BASE_URL + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: res.status, type: res.headers.get('content-type') || '', body: await res.text() };
}
async function attempt(name, fn) {
  try { return { ok: true, ...await fn() }; } catch (err) { return { ok: false, error: err.message }; }
}

// /api/journal is an array endpoint; the underlying demo journal is JSONL.
// Accept either without pretending that JSON array strings are individual records.
function parseJournalResponse(body) {
  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* legacy JSONL; parse below */ }
  return body.split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

// ---- static: catalog carries the 7 wiki actions + 5 baseline capabilities ----
const catalog = JSON.parse(readFileSync(resolve(REPO_ROOT, 'apps/vivim-host/control/action-catalog.v1.json'), 'utf8'));
const actionIds = (catalog.actions || catalog).map(a => a.id || a.actionId).filter(Boolean);
check('catalog-wiki-actions', WIKI_ACTIONS.every(a => actionIds.includes(a)),
  `wiki actions present=${WIKI_ACTIONS.filter(a => actionIds.includes(a)).length}/7 missing=${WIKI_ACTIONS.filter(a => !actionIds.includes(a)).join(',') || 'none'}`);
check('catalog-baseline-caps', BASELINE_CAPS.every(c => actionIds.includes(c)),
  `baseline capabilities present=${BASELINE_CAPS.filter(c => actionIds.includes(c)).length}/5`);
const surface = existsSync(resolve(REPO_ROOT, 'apps/vivim-host/data/demo-baseline/file-surface.v1.json'));
check('file-surface-registry', surface, `apps/vivim-host/data/demo-baseline/file-surface.v1.json exists=${surface}`);

// ---- live: renders + one deterministic wiki-edit with journal record ----
if (live) {
  const roadmap = await attempt('roadmap', () => get('/api/roadmap'));
  const roadmapJson = roadmap.ok ? (() => { try { return JSON.parse(roadmap.body); } catch { return null; } })() : null;
  check('roadmap-readthrough', roadmap.ok && roadmap.status === 200 && roadmapJson && Array.isArray(roadmapJson.layers?.L2),
    roadmap.ok ? `status=${roadmap.status} L2=${roadmapJson?.layers?.L2?.length}` : 'unreachable');
  const wiki = await attempt('wiki', () => get('/api/wiki'));
  const wikiJson = wiki.ok ? (() => { try { return JSON.parse(wiki.body); } catch { return null; } })() : null;
  check('wiki-readthrough', wiki.ok && wiki.status === 200 && wikiJson && wikiJson.pages && typeof wikiJson.revision === 'number',
    wiki.ok ? `status=${wiki.status} revision=${wikiJson?.revision} pages=${Object.keys(wikiJson?.pages || {}).length}` : 'unreachable');
  const journal = await attempt('journal', () => get('/api/journal'));
  const journalEntries = journal.ok ? parseJournalResponse(journal.body) : [];
  check('journal-readthrough', journal.ok && journal.status === 200 && Array.isArray(journalEntries),
    journal.ok ? 'status=' + journal.status + ' entries=' + journalEntries.length + ' format=json-array-or-jsonl' : 'unreachable');
  // An empty new journal is valid. Content is a JSON array from the product API,
  // never assumed to be one JSONL entry per line.

  const page = await attempt('page', () => get('/wiki'));
  // HTML is a client-rendered shell: the asynchronous roadmap item cannot appear
  // in static response HTML. Check the source/API contract here, not DOM rendering.
  const sourceContract = page.ok && page.status === 200 &&
    /text\/html/.test(page.type) &&
    /renderRoadmap\(/.test(page.body) &&
    /renderFileSurface\(/.test(page.body) &&
    /\/api\/roadmap/.test(page.body) &&
    Boolean(roadmapJson && Array.isArray(roadmapJson.buildQueue));
  check('wiki-html-and-roadmap-source-contract', sourceContract,
    'html=' + (page.ok ? page.status : 'unreachable') +
    ' roadmapQueue=' + (roadmapJson?.buildQueue?.length ?? 'unavailable') +
    ' browserDom=UNRUN');

  const before = await attempt('wiki-before', () => get('/api/wiki'));
  // Match the actual product Wiki editor envelope (nested edit object).
  const edit = {
    kind: 'wiki-edit', actor: 'ai', schemaVersion: 1,
    edit: { page: 'Main', section: 'HowTo', action: 'set-section',
      content: 'oracle verify probe ' + ITEM }
  };
  const sent = await attempt('wiki-edit', () => post('/api/mutate', edit));
  const sentJson = sent.ok ? (() => { try { return JSON.parse(sent.body); } catch { return null; } })() : null;
  check('wiki-edit-append-acknowledged', sent.ok && sent.status === 200 && sentJson?.kind === 'wiki-edit' && sentJson?.actor === 'ai' && typeof sentJson?.receivedAt === 'string',
    sent.ok ? `status=${sent.status} kind=${sentJson?.kind} actor=${sentJson?.actor} receivedAt=${!!sentJson?.receivedAt}` : `unreachable: ${sent.error}`);
  const after = await attempt('journal-after', () => get('/api/journal'));
  const tail = after.ok ? parseJournalResponse(after.body).slice(-3) : [];
  const recorded = tail.some(e => e.kind === 'wiki-edit' &&
    e.edit?.page === edit.edit.page &&
    e.edit?.section === edit.edit.section &&
    e.edit?.content === edit.edit.content &&
    e.actor === 'ai');
  check('wiki-edit-journal-record', recorded,
    'journal tail contains nested wiki-edit envelope: ' + recorded +
    ' (does NOT prove Wiki state was mutated)');
  const wikiAfter = await attempt('wiki-after', () => get('/api/wiki'));
  check('wiki-source-unchanged', before.ok && wikiAfter.ok && before.body === wikiAfter.body,
    `read-through source of truth unchanged by journal-only edit (before==after body)=${before.ok && wikiAfter.ok && before.body === wikiAfter.body}`);
}

// ---------------- verdict ----------------
const ok = checks.every(c => c.pass);
const verdict = { ok, item: ITEM, scope: live ? 'SOURCE_AND_API_ONLY' : 'SOURCE_ONLY', browserDom: 'UNRUN', durableWikiProjection: 'UNRUN', independentKeeperAcceptance: 'UNRUN', checks, digest: digestOf({ item: ITEM, checks }) };
process.stdout.write(JSON.stringify(verdict, null, 2) + '\n');
process.exit(ok ? 0 : 1);
