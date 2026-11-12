// hq/lib/refresh.mjs — one-command incremental refresh: index → wiki → gate → log.
//
// CONTRACT (Z.ai R1, "always on, always updating"): `hq refresh` is the single
// maintenance primitive every automation surface (watch daemon, git hooks,
// manual/CI invocations) funnels through. It re-indexes only changed files for
// the requested spaces (size/mtime/hash machinery in the indexer), regenerates
// only stale wiki pages (per-page input hash in the wiki generator), runs the
// strict freshness gate and appends one line per space to .hq/refresh.log.
//
// Files owned here (all under .hq/, all machine-local):
//   refresh.lock — single-writer guard for refresh invocations
//   refresh.log  — append-only audit trail, ISO-8601 Europe/Paris timestamps
//   watch.pid    — daemon liveness (written/removed by `hq watch`)
//   watch.log    — daemon start/stop/pause/refresh trail
//   watch.pause  — pause sentinel: watchers and hooks skip refreshes while present
import {
  appendFileSync, existsSync, mkdirSync, openSync, closeSync, readFileSync, rmSync, statSync, writeSync,
} from 'node:fs';
import { join } from 'node:path';
import { nowISO } from './util.mjs';
import { recordTiming } from './telemetry.mjs';
import { indexProject } from './indexer.mjs';
import { indexInstructions } from './skills.mjs';
import { ingestProject } from './lake.mjs';
import { buildWiki } from './wiki.mjs';
import { collectStaleFiles } from './freshness.mjs';

export const REFRESH_LOCK = 'refresh.lock';
export const REFRESH_LOG = 'refresh.log';
export const WATCH_PID = 'watch.pid';
export const WATCH_LOG = 'watch.log';
export const WATCH_PAUSE = 'watch.pause';
export const HOOKS_LOG = 'hooks.log';

// ---------------------------------------------------------------------------
// Europe/Paris wall clock
// ---------------------------------------------------------------------------

function timeZoneOffsetMinutes(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(date);
    const name = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    const match = /GMT([+-])(\d{1,2}):?(\d{2})?/.exec(name);
    if (!match) return 0;
    const sign = match[1] === '-' ? -1 : 1;
    return sign * (Number(match[2] || 0) * 60 + Number(match[3] || 0));
  } catch {
    return 0;
  }
}

/** parisISO — ISO-8601 timestamp with the Europe/Paris UTC offset (CET/CEST). */
export function parisISO(date = new Date()) {
  const offset = timeZoneOffsetMinutes(date, 'Europe/Paris');
  const shifted = new Date(date.getTime() - offset * 60_000);
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const label = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return shifted.toISOString().replace('Z', label);
}

// ---------------------------------------------------------------------------
// small log/pid helpers
// ---------------------------------------------------------------------------

function hqFile(root, name) {
  const dir = join(root, '.hq');
  mkdirSync(dir, { recursive: true });
  return join(dir, name);
}

/** appendLogLine — append `<parisISO> <text>` to .hq/<name> (created on demand). */
export function appendLogLine(root, name, text) {
  const path = hqFile(root, name);
  appendFileSync(path, `${parisISO()} ${text}\n`, 'utf8');
}

/** tailLines — last n lines of a file (empty array when missing). */
export function tailLines(path, n = 20) {
  if (!existsSync(path) || !statSync(path).isFile()) return [];
  const text = readFileSync(path, 'utf8');
  return text.split(/\r?\n/).filter((line) => line.length > 0).slice(-n);
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the process exists but belongs to another user.
    return error?.code === 'EPERM';
  }
}

function readPidFile(path) {
  try {
    const info = JSON.parse(readFileSync(path, 'utf8'));
    const pid = Number(info?.pid);
    if (!Number.isInteger(pid) || pid <= 0) return null;
    return { pid, startedAt: typeof info?.startedAt === 'string' ? info.startedAt : null, raw: info };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// pause sentinel
// ---------------------------------------------------------------------------

/** isPaused — true while .hq/watch.pause exists (full-suite / batch protocol). */
export function isPaused(root) {
  return existsSync(join(root, '.hq', WATCH_PAUSE));
}

// ---------------------------------------------------------------------------
// refresh lock
// ---------------------------------------------------------------------------

/**
 * acquireRefreshLock — single-writer guard for refresh invocations.
 * Reentrant for the current pid (the watch daemon reuses the pipeline).
 * A lock held by a dead process is stale and reclaimed.
 */
export function acquireRefreshLock(root) {
  const path = hqFile(root, REFRESH_LOCK);
  if (existsSync(path)) {
    const held = readPidFile(path);
    if (held) {
      if (held.pid === process.pid) return { acquired: true, reentrant: true, heldBy: held.pid };
      if (isProcessAlive(held.pid)) {
        return { acquired: false, reentrant: false, heldBy: held.pid, startedAt: held.startedAt };
      }
    }
    // Stale or unreadable: reclaim below.
    try { rmSync(path, { force: true }); } catch { /* best effort */ }
  }
  let fd;
  try {
    fd = openSync(path, 'wx');
  } catch {
    // Lost a race with a concurrent acquirer: report the winner.
    const held = readPidFile(path);
    return { acquired: false, reentrant: false, heldBy: held?.pid ?? null };
  }
  try {
    writeFd(fd, `${JSON.stringify({ pid: process.pid, startedAt: nowISO() })}\n`);
  } finally {
    try { closeSync(fd); } catch { /* ignore */ }
  }
  return { acquired: true, reentrant: false, heldBy: process.pid };
}

function writeFd(fd, text) {
  const buffer = Buffer.from(text, 'utf8');
  let written = 0;
  while (written < buffer.length) {
    written += writeSync(fd, buffer, written, buffer.length - written);
  }
}

/** releaseRefreshLock — remove the lock only when this process owns it. */
export function releaseRefreshLock(root) {
  const path = join(root, '.hq', REFRESH_LOCK);
  const held = readPidFile(path);
  if (held && held.pid === process.pid) {
    try { rmSync(path, { force: true }); } catch { /* best effort */ }
  }
}

// ---------------------------------------------------------------------------
// watcher state (pid + logs) — read side for doctor and tests
// ---------------------------------------------------------------------------

/** readWatcherState — liveness of `hq watch` from .hq/watch.pid. */
export function readWatcherState(root) {
  const path = join(root, '.hq', WATCH_PID);
  if (!existsSync(path)) return { running: false, pid: null, stale: false, startedAt: null, paused: isPaused(root) };
  const held = readPidFile(path);
  if (!held) return { running: false, pid: null, stale: true, startedAt: null, paused: isPaused(root) };
  const alive = isProcessAlive(held.pid);
  return { running: alive, pid: held.pid, stale: !alive, startedAt: held.startedAt, paused: isPaused(root) };
}

const REFRESH_LINE = /^(\S+)\s+(\S+)\s+(\d+)ms\s+files=(\d+)\s+pages=(\d+)\s+reason=(.*)$/;

/** parseRefreshLine — structured view of one .hq/refresh.log line. */
export function parseRefreshLine(line) {
  const match = REFRESH_LINE.exec(String(line || '').trim());
  if (!match) return null;
  return { at: match[1], space: match[2], ms: Number(match[3]), files: Number(match[4]), pages: Number(match[5]), reason: match[6] };
}

/** lastRefreshBySpace — newest parsed refresh.log entry per space. */
export function lastRefreshBySpace(root) {
  const out = {};
  // Newest first, so the most recent entry per space wins.
  for (const line of tailLines(join(root, '.hq', REFRESH_LOG), 400).reverse()) {
    const entry = parseRefreshLine(line);
    if (entry && !out[entry.space]) out[entry.space] = entry;
  }
  return out;
}

// ---------------------------------------------------------------------------
// the refresh pipeline
// ---------------------------------------------------------------------------

function errorMessage(error) {
  return error && error.message ? String(error.message) : String(error);
}

function pageBelongsToSpace(pageId, name) {
  return pageId === `project:${name}`
    || pageId.startsWith(`file:${name}:`)
    || pageId.startsWith(`module:${name}:`);
}

/**
 * runRefreshPipeline — index the requested spaces (or reuse deltas a watcher
 * already collected), regenerate only stale wiki pages, run the freshness gate
 * and append one refresh.log line per logged space.
 *
 * @param {object}   options
 * @param {string}   options.root          workspace root
 * @param {object}   options.config        workspace config
 * @param {object}   options.db            open HQ database
 * @param {Array}    options.projects      all workspace projects (wiki model is global)
 * @param {Array}    [options.spaces]      spaces to index + log (default: projects)
 * @param {string}   [options.reason]      audit reason ('manual' | 'watch' | 'hook:…')
 * @param {object}   [options.indexResults] precomputed {name:{added,changed,removed,ms}} — skips re-indexing
 * @param {string}   [options.operation]   timing prefix ('refresh' | 'watch')
 * @param {number}   [options.maxFileBytes] gate/index cap override
 * @param {number}   [options.maxFilePages] wiki file-page budget
 * @param {boolean}  [options.lock]        acquire .hq/refresh.lock (default true)
 * @param {boolean}  [options.log]         append to .hq/refresh.log (default true)
 */
export async function runRefreshPipeline({
  root, config, db, projects, spaces = null, reason = 'manual',
  indexResults = null, operation = 'refresh', maxFileBytes = null,
  maxFilePages = 5000, lock = true, log = true,
} = {}) {
  const allProjects = Array.isArray(projects) ? projects : [];
  // `spaces: []` is meaningful (wiki + gate only, the watcher already indexed);
  // only a missing/null `spaces` means "refresh every project".
  const targetSpaces = spaces === null || spaces === undefined || spaces === '' ? allProjects : spaces;
  const started = performance.now();

  let lockState = null;
  if (lock) {
    lockState = acquireRefreshLock(root);
    if (!lockState.acquired) {
      return { skipped: true, heldBy: lockState.heldBy, startedAt: lockState.startedAt ?? null, spaces: [], wiki: null, kg: { exported: false, imported: false, acked: false, reason: 'refresh_skipped' }, staleCount: null, durationMs: 0 };
    }
  }

  const perSpace = [];
  try {
    // 1. Incremental index per space (skipped when the caller supplies deltas).
    for (const space of targetSpaces) {
      const reused = indexResults ? indexResults.get(space.name) : null;
      if (reused) {
        perSpace.push({ name: space.name, files: reused.files, ms: Number(reused.ms || 0) });
        continue;
      }
      let result = null;
      try {
        result = indexProject({
          root, db, project: space,
          options: { maxFileBytes: Number(maxFileBytes || config.maxFileBytes), ignores: config.ignores },
        });
      } catch (error) {
        perSpace.push({ name: space.name, files: 0, ms: 0, error: errorMessage(error) });
        continue;
      }
      // Same post-index lanes as the watcher: instruction catalog + commit lake.
      try { indexInstructions(db, space); } catch { /* optional lane */ }
      try { ingestProject(db, space); } catch { /* optional lane */ }
      perSpace.push({
        name: space.name,
        files: (result.added || 0) + (result.changed || 0) + (result.removed || 0),
        ms: result.ms || 0,
      });
    }

    // 2. Wiki: the generator's per-page input hash makes this incremental —
    // only pages whose inputs changed are rewritten (wiki --check parity).
    let wiki = { written: 0, skipped: 0, total: 0, pages: [] };
    try {
      wiki = buildWiki({ db, root, projects: allProjects, outDir: join(root, 'wiki'), maxFilePages });
    } catch (error) {
      wiki.error = errorMessage(error);
    }

    // 2b. Knowledge-graph sync: export the current universe, feed the native
    // importer, and advance the delta base on verified acknowledgment. Uses the
    // existing pipeline (no new scheduler); cargo absence or import failure
    // degrades gracefully — the exchange is still written, the state stays at
    // its acknowledged base, tombstones are re-emitted on the next sync.
    let kg = { imported: false, reason: null };
    try {
      const kgModule = await import('./kg-export.mjs');
      const export_ = kgModule.exportGraphExchange({
        db,
        outPath: join(root, '.hq', 'kg-exchange.jsonl'),
        statePath: join(root, '.hq', 'kg-export-state.json'),
      });
      kg.exported = true;
      kg.stats = export_.stats;
      kg.digest = export_.digest;
      const { spawnSync } = await import('node:child_process');
      const crateDir = join(dirname(dirname(fileURLToPath(import.meta.url))), 'research', 'rust-knowledge-graph');
      const imp = spawnSync('cargo', ['run', '--quiet', '--features', 'importer', '--bin', 'hqkg-import', '--',
        join(root, '.hq', 'kg-journal.hqj'), export_.outPath],
      { cwd: crateDir, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
      const epochLine = (imp.stdout ?? '').split('\n').find((l) => l.startsWith('epoch before='));
      const epochBefore = epochLine ? Number(/before=(\d+)/.exec(epochLine)?.[1]) : null;
      const epochAfter = epochLine ? Number(/after=(\d+)/.exec(epochLine)?.[1]) : null;
      if (imp.status !== 0 || epochAfter == null || epochAfter < epochBefore) {
        kg.imported = false;
        kg.reason = imp.status !== 0 ? `importer_exit_${imp.status}` : 'epoch_regression';
      } else {
        const ack = kgModule.acknowledgeGraphExport({
          statePath: join(root, '.hq', 'kg-export-state.json'),
          digest: export_.digest,
          acknowledgment: { epochBefore, epochAfter },
        });
        kg.imported = true;
        kg.epochBefore = epochBefore;
        kg.epochAfter = epochAfter;
        kg.acked = ack.acked;
        if (!ack.acked) kg.reason = ack.reason;
      }
    } catch (error) {
      kg.imported = false;
      kg.reason = errorMessage(error);
    }

    // 3. Strict freshness gate (same walk as `hq check --strict`).
    let staleCount = 0;
    let stale = [];
    try {
      stale = await collectStaleFiles({ db, config, projects: allProjects, capOverride: maxFileBytes });
      staleCount = stale.length;
    } catch (error) {
      staleCount = -1;
      stale = [{ error: errorMessage(error) }];
    }

    const durationMs = Math.max(1, Math.round(performance.now() - started));

    // Telemetry: one span per stage, prefixed by the calling surface
    // ('refresh.wiki' / 'watch.wiki' / …) so `hq timing report` separates them.
    try {
      recordTiming(db, {
        operation: `${operation}.wiki`, project: null, durationMs,
        ok: !wiki.error,
        meta: { written: wiki.written || 0, unchanged: wiki.skipped || 0, total: wiki.total || 0, error: wiki.error || null },
      });
      recordTiming(db, {
        operation: `${operation}.check`, project: null, durationMs: 0,
        ok: staleCount === 0,
        meta: { staleCount },
      });
    } catch { /* telemetry must never break a refresh */ }

    // Page attribution: a single-space refresh owns every rewritten page
    // (content pages plus the stamp/global pages its reindex touched); a
    // multi-space refresh attributes pages by their wiki page id.
    const generated = (wiki.pages || []).filter((p) => p.generated);
    for (const entry of perSpace) {
      const pages = targetSpaces.length === 1
        ? generated.length
        : generated.filter((p) => pageBelongsToSpace(p.id, entry.name)).length;
      entry.pages = pages;
      entry.reason = reason;
      entry.durationMs = durationMs;
      if (log) {
        appendLogLine(root, REFRESH_LOG, `${entry.name} ${durationMs}ms files=${entry.files} pages=${entry.pages} reason=${reason}`);
      }
    }

    return {
      skipped: false, heldBy: lockState?.heldBy ?? null,
      spaces: perSpace,
      wiki: { written: wiki.written || 0, skipped: wiki.skipped || 0, total: wiki.total || 0, error: wiki.error || null },
      kg: { exported: kg.exported === true, imported: kg.imported === true, acked: kg.acked === true, reason: kg.reason ?? null, stats: kg.stats ?? null, epochBefore: kg.epochBefore ?? null, epochAfter: kg.epochAfter ?? null },
      staleCount, stale: stale.slice(0, 20),
      gateOk: staleCount === 0 && !wiki.error,
      durationMs,
    };
  } finally {
    if (lockState?.acquired) releaseRefreshLock(root);
  }
}
