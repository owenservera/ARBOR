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
    let show = readSession(s.id, TURNS_PER_SESSION);
    if (!show.ok) {
      // A live writer can hold the session DB for a moment; one retry separates a lock from a loss.
      sleepMs(400);
      show = readSession(s.id, TURNS_PER_SESSION);
    }
    if (!show.ok || !Array.isArray(show.value?.turns)) {
      if (sessionDb) {
        const fallback = readSessionFromDb(s.id, TURNS_PER_SESSION, sessionDb);
        if (fallback.ok && Array.isArray(fallback.value?.turns) && fallback.value.turns.length) {
          probed.push({ id: s.id, title: s.title, ageMinutes: s.ageMinutes, turns: fallback.value.turns });
          continue;
        }
      }
      defects.push({ source: `session:${s.id}`, detail: `unreadable after retry: ${show.error}` });
      probed.push({ ...s, turns: [] });
      continue;
    }
    const turns = show.value.turns.map((t) => ({ role: String(t.role ?? ''), text: String(t.text ?? '') }));
    probed.push({ id: s.id, title: s.title, ageMinutes: s.ageMinutes, turns });
  }
  if (kept.length > MAX_SESSION_PROBES) {
    defects.push({ source: 'sessions:window', detail: `${kept.length} sessions in window, probed the ${MAX_SESSION_PROBES} newest; the rest are unread this scan` });
  }
  return { sessions: probed, defects, inWindow: kept.length };
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function loadSeats() {
  const file = join(CHANNEL, 'seats.json');
  if (!existsSync(file)) return { seats: {}, defects: [{ source: 'seats', detail: 'seats.json absent' }] };
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.seats) ? raw.seats : [];
    /** @type {Record<string,string>} */
    const seats = {};
    for (const s of list) if (s && s.id && s.session) seats[String(s.id)] = String(s.session);
    return { seats, defects: [] };
  } catch (err) {
    return { seats: {}, defects: [{ source: 'seats', detail: `unreadable: ${err instanceof Error ? err.message : String(err)}` }] };
  }
}

function probeBus(seats) {
  const rows = [];
  const defects = [];
  for (const seat of Object.keys(seats)) {
    const r = jsonRun('bun', [join(ROOT, 'scripts', 'sync.mjs'), 'check', '--as', seat, '--json']);
    if (!r.ok) { defects.push({ source: `bus:${seat}`, detail: `probe failed: ${r.error}` }); continue; }
    const unread = Number(r.value?.unread) || 0;
    if (unread > 0) rows.push({ seat, unread, ids: Array.isArray(r.value?.ids) ? r.value.ids.slice(0, 5) : [] });
  }
  return { bus: rows, defects };
}

function readJsonDir(dir) {
  const defects = [];
  const rows = [];
  if (!existsSync(dir)) return { rows, defects: [{ source: `channel:${dir}`, detail: 'directory absent' }] };
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ f, m: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m)
    .slice(0, MAX_RECEIPT_FILES);
  for (const { f } of files) {
    try { rows.push(JSON.parse(readFileSync(join(dir, f), 'utf8'))); }
    catch (err) { defects.push({ source: `channel:${f}`, detail: `unreadable: ${err instanceof Error ? err.message : String(err)}` }); }
  }
  return { rows, defects };
}

function loadInjectedCorpus() {
  const files = [join(ROOT, 'AGENTS.md'), join(homedir(), '.zcode', 'AGENTS.md'), join(CHANNEL, 'seats.json')];
  const agentDir = join(homedir(), '.zcode', 'agents');
  if (existsSync(agentDir)) for (const f of readdirSync(agentDir)) if (f.endsWith('.md')) files.push(join(agentDir, f));
  // Our own docs and specs are the other place a wake prompt's sentence comes from.
  const walkDocs = (dir, depth = 0) => {
    if (depth > 4 || !existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walkDocs(p, depth + 1);
      else if (entry.name.endsWith('.md') && files.length < 800) files.push(p);
    }
  };
  walkDocs(join(ROOT, 'docs'));
  return files.filter((f) => existsSync(f)).map((f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } }).join('\n');
}

/* ---------------- commands ---------------- */

function probeAll() {
  const windowMinutes = num('window', DEFAULT_WINDOW);
  const sessions = probeSessions(windowMinutes);
  const seats = loadSeats();
  const bus = probeBus(seats.seats);
  const receipts = readJsonDir(join(CHANNEL, 'receipts'));
  const outcomes = readJsonDir(join(CHANNEL, 'outcomes'));
  const qeue = loadQeue(join(ROOT, 'qeue'));
  const recon = loadRecon(RECON_DIR);
  const prior = readLearnings(LEARNINGS);

  const scan = buildScan({
    sessions: sessions.sessions,
    seats: seats.seats,
    bus: bus.bus,
    receipts: receipts.rows,
    outcomes: outcomes.rows,
    qeue, recon,
    priorLearnings: prior.rows,
    windowMinutes,
    injected: loadInjectedCorpus(),
    defects: [...sessions.defects, ...seats.defects, ...bus.defects, ...receipts.defects, ...outcomes.defects, ...prior.defects],
  });
  return scan;
}

function writeOutputs(scan) {
  const md = renderActiveTasks(scan);
  atomicWrite(OUT_MD, md);
  atomicWrite(OUT_JSON, JSON.stringify(scan, null, 2) + '\n');
  writeLearnings(LEARNINGS, scan.learnings);
  return { md: OUT_MD, json: OUT_JSON, learnings: LEARNINGS };
}

function cmdScan() {
  const scan = probeAll();
  const wrote = has('write') ? writeOutputs(scan) : null;
  if (has('json')) {
    process.stdout.write(JSON.stringify({ ...scan, wrote }, null, 2) + '\n');
  } else {
    console.log(`dogfood ${DOGFOOD_SCHEMA} — ${scan.counts.sessions} sessions, ${scan.counts.tasks} tasks (${scan.counts.blocked} blocked), ${scan.counts.learnings} learnings, ${scan.counts.qeue} qeue / ${scan.counts.recon} recon, ${scan.counts.defects} defects`);
    for (const t of scan.active.slice(0, 8)) console.log(`  [${t.kind}] ${cell(t.conversation)} — ${cell(t.task)}`);
    for (const l of scan.learnings.slice(0, 5)) console.log(`  [learn x${l.count}] ${cell(l.rule)}`);
    for (const q of scan.queue.slice(0, 5)) console.log(`  [queue ${q.score}] ${q.id} ${q.task} (${q.basis})`);
    for (const d of scan.defects.slice(0, 6)) console.log(`  [defect] ${d.source}: ${d.detail}`);
    if (wrote) console.log(`wrote ${wrote.md}\nwrote ${wrote.json}\nwrote ${wrote.learnings}`);
    else console.log('dry run: pass --write to rewrite the supply signal');
  }
  return 0;
}

function cmdRank() {
  const top = num('top', 25);
  const qeue = loadQeue(join(ROOT, 'qeue'));
  const recon = loadRecon(RECON_DIR);
  const ranked = rankLeapfrog(qeue.records, recon.byId);
  if (has('json')) { process.stdout.write(JSON.stringify({ schema: DOGFOOD_SCHEMA, queue: ranked.slice(0, top), defects: [...qeue.defects, ...recon.defects] }, null, 2) + '\n'); return 0; }
  ranked.slice(0, top).forEach((r, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${r.score.toFixed(1).padStart(5)} ${r.id} ${r.basis.padEnd(22)} c=${r.criticality_rank} x=${r.complexity_score} ${r.task}`);
  });
  for (const d of [...qeue.defects, ...recon.defects]) console.log(`defect ${d.source}: ${d.detail}`);
  return 0;
}

/**
 * The recon work orders for the sweep: one task per lane cell, highest leapfrog first, excluding
 * rows a receipt already proves. This is the only place the fan-out is defined.
 */
function cmdWorkorders() {
  const top = num('top', 101);
  const lane = arg('lane', null);
  const qeue = loadQeue(join(ROOT, 'qeue'));
  const recon = loadRecon(RECON_DIR);
  const ranked = rankLeapfrog(qeue.records, recon.byId)
    .filter((r) => (lane ? r.lane === lane : true))
    .filter((r) => r.reconStatus !== 'proven');
  const orders = ranked.slice(0, top).map((r, i) => ({
    n: i + 1,
    id: r.id,
    lane: r.lane,
    task: r.task,
    release: r.primary_release,
    criticality: r.criticality_rank,
    complexity: r.complexity_score,
    status: r.status,
    basis: r.basis,
    score: r.score,
    register: `qeue/${r.lane}.json`,
    gates: r.top_complexity_gates,
    blockers: r.blockers,
    rabbitHoles: r.rabbit_holes,
    pitfalls: r.pitfalls,
  }));
  if (has('json')) { process.stdout.write(JSON.stringify({ schema: 'hq.dogfood-workorders/1', count: orders.length, defects: [...qeue.defects, ...recon.defects], orders }, null, 2) + '\n'); return 0; }
  console.log(`dogfood work orders — ${orders.length} (lane ${lane ?? 'all'})`);
  for (const o of orders) console.log(`${String(o.n).padStart(3)}. ${o.id} ${o.score} ${o.task}`);
  return 0;
}

function cmdLearn() {
  const scan = probeAll();
  writeLearnings(LEARNINGS, scan.learnings);
  if (has('json')) { process.stdout.write(JSON.stringify({ schema: 'hq.dogfood-learn/1', count: scan.learnings.length, learnings: scan.learnings }, null, 2) + '\n'); return 0; }
  console.log(`learnings ${scan.learnings.length} → ${LEARNINGS}`);
  for (const l of scan.learnings) console.log(`x${l.count} [${l.kind}] ${cell(l.rule)} (${l.evidence.map((e) => e.session).join(', ')})`);
  return 0;
}

function usage() {
  console.log(`dogfood — the automated learning + product-improvement loop

  scan            probe sessions, bus, receipts, qeue and recon; print the scan
                  --write   rewrite the supply signal atomically (${OUT_MD})
                  --json    machine output
                  --window <min>  rolling session window (default ${DEFAULT_WINDOW})
  rank            leapfrog ranking over the qeue register
                  --top <n> (default 25)  --json
  workorders      the recon fan-out: one order per qeue row
                  --top <n> (default 101)  --lane <LANE>  --json
  learn           rewrite the learning ledger from the owner turns in the window
                  --json

Writes only: ${OUT_MD}, ${OUT_JSON}, ${LEARNINGS}.
Never sends, approves, wakes a seat, or touches a provider.`);
  return 0;
}

if (import.meta.main) {
  const cmd = process.argv[2] ?? 'scan';
  const code = cmd === 'scan' ? cmdScan()
    : cmd === 'rank' ? cmdRank()
    : cmd === 'workorders' ? cmdWorkorders()
    : cmd === 'learn' ? cmdLearn()
    : cmd === 'help' || cmd === '--help' || cmd === '-h' ? usage()
    : (console.error(`unknown command: ${cmd}`), usage(), 2);
  process.exit(code ?? 0);
}
