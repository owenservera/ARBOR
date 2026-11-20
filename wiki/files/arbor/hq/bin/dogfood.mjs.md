# File: hq/bin/dogfood.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/bin/dogfood.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14211 B |
| Lines | 310 |
| Hash | 936e1824eee8 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 15 | no | const ROOT = resolve(process.cwd()); |
| CHANNEL | const | 16 | no | const CHANNEL = &#39;C:/VIVIM/channel&#39;; |
| SESSIONS_TOOL | const | 17 | no | const SESSIONS_TOOL = join(homedir(), &#39;.agents&#39;, &#39;skills&#39;, &#39;agent-bootstrap&#39;, &#39;sessions.mjs&#39;); |
| DOGFOOD_DIR | const | 18 | no | const DOGFOOD_DIR = join(ROOT, &#39;dogfood&#39;); |
| OUT_MD | const | 19 | no | const OUT_MD = join(CHANNEL, &#39;tasks&#39;, &#39;active-tasks.md&#39;); |
| OUT_JSON | const | 20 | no | const OUT_JSON = join(DOGFOOD_DIR, &#39;active-tasks.json&#39;); |
| LEARNINGS | const | 21 | no | const LEARNINGS = join(DOGFOOD_DIR, &#39;learnings.jsonl&#39;); |
| RECON_DIR | const | 22 | no | const RECON_DIR = join(DOGFOOD_DIR, &#39;recon&#39;); |
| DEFAULT_WINDOW | const | 24 | no | const DEFAULT_WINDOW = 300; |
| MAX_SESSION_PROBES | const | 25 | no | const MAX_SESSION_PROBES = 40; |
| TURNS_PER_SESSION | const | 26 | no | const TURNS_PER_SESSION = 12; |
| MAX_RECEIPT_FILES | const | 27 | no | const MAX_RECEIPT_FILES = 300; |
| arg | function | 29 | no | function arg(name, fallback) { |
| i | const | 30 | no | const i = process.argv.indexOf(`--${name}`); |
| has | function | 33 | no | function has(name) { return process.argv.includes(`--${name}`); } |
| num | function | 34 | no | function num(name, fallback) { const v = arg(name); return v == null ? fallback : Number(v); } |
| run | function | 36 | no | function run(cmd, args) { |
| jsonRun | function | 40 | no | function jsonRun(cmd, args) { |
| r | const | 41 | no | const r = run(cmd, args); |
| defaultListSessions | function | 50 | no | function defaultListSessions() { |
| defaultReadSession | function | 54 | no | function defaultReadSession(id, limit) { |
| readSessionFromDb | function | 62 | no | function readSessionFromDb(id, limit, dbPath) { |
| probeSessions | function | 68 | yes | export function probeSessions(windowMinutes, opts = {}) { |
| defects | const | 69 | no | const defects = []; |
| listRun | const | 70 | no | const listRun = (opts.listSessions ?? defaultListSessions)(); |
| all | const | 72 | no | const all = Array.isArray(listRun.value?.sessions) ? listRun.value.sessions : []; |
| kept | const | 73 | no | const kept = all |
| probed | const | 77 | no | const probed = []; |
| readSession | const | 78 | no | const readSession = opts.readSession ?? defaultReadSession; |
| sessionDb | const | 79 | no | const sessionDb = opts.sessionDb; |
| show | variable | 81 | no | let show = readSession(s.id, TURNS_PER_SESSION); |
| fallback | const | 89 | no | const fallback = readSessionFromDb(s.id, TURNS_PER_SESSION, sessionDb); |
| turns | const | 99 | no | const turns = show.value.turns.map((t) =&gt; ({ role: String(t.role ?? &#39;&#39;), text: String(t.text ?? &#39;&#39;) })); |
| sleepMs | function | 108 | no | function sleepMs(ms) { |
| loadSeats | function | 112 | no | function loadSeats() { |
| file | const | 113 | no | const file = join(CHANNEL, &#39;seats.json&#39;); |
| raw | const | 116 | no | const raw = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| list | const | 117 | no | const list = Array.isArray(raw) ? raw : Array.isArray(raw?.seats) ? raw.seats : []; |
| seats | const | 119 | no | const seats = {}; |
| probeBus | function | 127 | no | function probeBus(seats) { |
| rows | const | 128 | no | const rows = []; |
| defects | const | 129 | no | const defects = []; |
| r | const | 131 | no | const r = jsonRun(&#39;bun&#39;, [join(ROOT, &#39;scripts&#39;, &#39;sync.mjs&#39;), &#39;check&#39;, &#39;--as&#39;, seat, &#39;--json&#39;]); |
| unread | const | 133 | no | const unread = Number(r.value?.unread) \|\| 0; |
| readJsonDir | function | 139 | no | function readJsonDir(dir) { |
| defects | const | 140 | no | const defects = []; |
| rows | const | 141 | no | const rows = []; |
| files | const | 143 | no | const files = readdirSync(dir) |
| loadInjectedCorpus | function | 155 | no | function loadInjectedCorpus() { |
| files | const | 156 | no | const files = [join(ROOT, &#39;AGENTS.md&#39;), join(homedir(), &#39;.zcode&#39;, &#39;AGENTS.md&#39;), join(CHANNEL, &#39;seats.json&#39;)]; |
| agentDir | const | 157 | no | const agentDir = join(homedir(), &#39;.zcode&#39;, &#39;agents&#39;); |
| walkDocs | function | 160 | no | const walkDocs = (dir, depth = 0) =&gt; { |
| p | const | 163 | no | const p = join(dir, entry.name); |
| probeAll | function | 174 | no | function probeAll() { |
| windowMinutes | const | 175 | no | const windowMinutes = num(&#39;window&#39;, DEFAULT_WINDOW); |
| sessions | const | 176 | no | const sessions = probeSessions(windowMinutes); |
| seats | const | 177 | no | const seats = loadSeats(); |
| bus | const | 178 | no | const bus = probeBus(seats.seats); |
| receipts | const | 179 | no | const receipts = readJsonDir(join(CHANNEL, &#39;receipts&#39;)); |
| outcomes | const | 180 | no | const outcomes = readJsonDir(join(CHANNEL, &#39;outcomes&#39;)); |
| qeue | const | 181 | no | const qeue = loadQeue(join(ROOT, &#39;qeue&#39;)); |
| recon | const | 182 | no | const recon = loadRecon(RECON_DIR); |
| prior | const | 183 | no | const prior = readLearnings(LEARNINGS); |
| scan | const | 185 | no | const scan = buildScan({ sessions: sessions.sessions, seats: seats.seats, bus: bus.bus, receipts: receipts.rows, |
| writeOutputs | function | 200 | no | function writeOutputs(scan) { |
| md | const | 201 | no | const md = renderActiveTasks(scan); |
| cmdScan | function | 208 | no | function cmdScan() { |
| scan | const | 209 | no | const scan = probeAll(); |
| wrote | const | 210 | no | const wrote = has(&#39;write&#39;) ? writeOutputs(scan) : null; |
| cmdRank | function | 225 | no | function cmdRank() { |
| top | const | 226 | no | const top = num(&#39;top&#39;, 25); |
| qeue | const | 227 | no | const qeue = loadQeue(join(ROOT, &#39;qeue&#39;)); |
| recon | const | 228 | no | const recon = loadRecon(RECON_DIR); |
| ranked | const | 229 | no | const ranked = rankLeapfrog(qeue.records, recon.byId); |
| cmdWorkorders | function | 242 | no | function cmdWorkorders() { |
| top | const | 243 | no | const top = num(&#39;top&#39;, 101); |
| lane | const | 244 | no | const lane = arg(&#39;lane&#39;, null); |
| qeue | const | 245 | no | const qeue = loadQeue(join(ROOT, &#39;qeue&#39;)); |
| recon | const | 246 | no | const recon = loadRecon(RECON_DIR); |
| ranked | const | 247 | no | const ranked = rankLeapfrog(qeue.records, recon.byId) |
| orders | const | 250 | no | const orders = ranked.slice(0, top).map((r, i) =&gt; ({ n: i + 1, id: r.id, lane: r.lane, task: r.task, |
| cmdLearn | function | 273 | no | function cmdLearn() { |
| scan | const | 274 | no | const scan = probeAll(); |
| usage | function | 282 | no | function usage() { |
| cmd | const | 302 | no | const cmd = process.argv[2] ?? &#39;scan&#39;; |
| code | const | 303 | no | const code = cmd === &#39;scan&#39; ? cmdScan() |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:os | import | 6 | external |
| node:path | import | 7 | external |
| node:child_process | import | 8 | external |
| ../lib/session-parts.mjs | import | 9 | [hq/lib/session-parts.mjs](../lib/session-parts.mjs.md) |
| ../lib/dogfood.mjs | import | 10 | [hq/lib/dogfood.mjs](../lib/dogfood.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// hq/bin/dogfood.mjs — the dogfood loop CLI.
// Read-only probes; writes only the supply-signal document, its machine form and the learning
// ledger. It never sends, approves, wakes a seat or touches a provider.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readSessionParts } from '../lib/session-parts.mjs';
import {
  DOGFOOD_SCHEMA, atomicWrite, buildScan, cell, loadQeue, loadRecon, rankLeapfrog,
  readLearnings, renderActiveTasks, writeLearnings,
} from '../lib/dogfood.mjs';

const ROOT = resolve(process.cwd());
const CHANNEL = 'C:/VIVIM/channel';
const SESSIONS_TOOL = join(homedir(), '.agents', 'skills', 'agent-bootstrap', 'sessions.mjs');
const DOGFOOD_DIR = join(ROOT, 'dogfood');
const OUT_MD = join(CHANNEL, 'tasks', 'active-tasks.md');
const OUT_JSON = join(DOGFOOD_DIR, 'active-tasks.json');
const LEARNINGS = join(DOGFOOD_DIR, 'learnings.jsonl');
const RECON_DIR = join(DOGFOOD_DIR, 'recon');

const DEFAULT_WINDOW = 300;
const MAX_SESSION_PROBES = 40;
const TURNS_PER_SESSION = 12;
const MAX_RECEIPT_FILES = 300;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
function has(name) { return process.argv.includes(`--${name}`); }
function num(name, fallback) { const v = arg(name); return v == null ? fallback : Number(v); }

function run(cmd, args) {
  return spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
}

function jsonRun(cmd, args) {
  const r = run(cmd, args);
  if (r.status !== 0 && !r.stdout?.trim()) return { ok: false, error: (r.stderr || `exit ${r.status}`).slice(0, 300) };
  try { return { ok: true, value: JSON.parse(r.stdout) }; } catch (err) {
    return { ok: false, error: `unparseable output: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/* ---------------- probes ---------------- */

function defaultListSessions() {
  return jsonRun('node', [SESSIONS_TOOL, '--json', 'list', '--limit', '5000']);
}

function defaultReadSession(id, limit) {
  return jsonRun('node', [SESSIONS_TOOL, 'show', id, '--messages', String(limit), '--json']);
}

/** Fallback reader: read a session straight from the session DB when the query
 *  path (sessions.mjs show) cannot read it. Returns the session's turns, or
 *  { ok: false } when the DB does not hold the session or holds no turns.
 */
function readSessionFromDb(id, limit, dbPath) {
  const { session, turns } = readSessionParts({ dbPath, sessionId: id, limit });
  if (!session) return { ok: false, error: 'session not found in db' };
  return { ok: true, value: { turns: turns.map((t) => ({ role: String(t.role ?? ''), text: String(t.text ?? '') })) } };
}

export function probeSessions(windowMinutes, opts = {}) {
  const defects = [];
  const listRun = (opts.listSessions ?? defaultListSessions)();
  if (!listRun.ok) return { sessions: [], defects: [{ source: 'sessions:list', detail: `unreadable: ${listRun.error}` }] };
  const all = Array.isArray(listRun.value?.sessions) ? listRun.value.sessions : [];
  const kept = all
    .filter((s) => s && s.directory && resolve(s.directory) === ROOT)
    .filter((s) => Number(s.ageMinutes) < windowMinutes && s.type !== 'subagent_child')
    .sort((a, b) => Number(a.ageMinutes) - Number(b.ageMinutes));
  const probed = [];
  const readSession = opts.readSession ?? defaultReadSession;
  const sessionDb = opts.sessionDb;
  for (const s of kept.slice(0, MAX_SESSION_PROBES)) {
```

_First 80 of 311 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
