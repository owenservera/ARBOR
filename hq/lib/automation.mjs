// hq/lib/automation.mjs — workspace watcher and git hook installer.
// CONTRACT (hq/CONTRACT.md, lane I): watchWorkspace, installHooks, uninstallHooks.
// Writes only to the SQLite database it is given and to `.git/hooks` files it owns.
import {
  existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
  chmodSync, watch as fsWatch,
} from 'node:fs';
import { join, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexProject } from './indexer.mjs';
import { indexInstructions } from './skills.mjs';
import { ingestProject } from './lake.mjs';
import { nowISO, toPosix } from './util.mjs';

const HOOK_NAMES = ['post-commit', 'post-merge', 'post-checkout'];
const HOOK_MARKER = '# vivim-hq-hooks v1';
const HOOK_MARKER_LEGACY = '# HQ-MANAGED';
const POLL_INTERVAL_MS = 5000;
const MEDIA_POLL_INTERVAL_MS = 30 * 60 * 1000;
const MAX_SNAPSHOT_ENTRIES = 5000;
const MAX_SNAPSHOT_DEPTH = 12;
const SNAPSHOT_IGNORES = new Set([
  '.git', '.hq', 'node_modules', 'dist', 'build', 'out', '.next', '.nuxt',
  '.cache', 'coverage', '.venv', 'venv', '__pycache__', 'target', 'wiki',
]);

function errorMessage(error) {
  return error && error.message ? String(error.message) : String(error);
}

function projectAbs(root, project) {
  const raw = project?.abs || project?.absPath || project?.absolute || project?.path
    || project?.dir || project?.name || '';
  const text = String(raw);
  return isAbsolute(text) ? resolve(text) : resolve(root, text);
}

function normalizeEntries(root, projects) {
  const list = Array.isArray(projects) ? projects : [];
  const entries = [];
  const seen = new Set();
  for (let index = 0; index < list.length; index++) {
    const project = list[index];
    const name = String(project?.name || project?.id || (typeof project === 'string' ? project : `project-${index + 1}`));
    const abs = projectAbs(root, project);
    const key = `${name}\0${abs}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ name, abs, project: project && typeof project === 'object' ? project : { name, path: abs } });
  }
  return entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

// ---------------------------------------------------------------------------
// watchWorkspace
// ---------------------------------------------------------------------------

function snapshotProject(dir) {
  const parts = [];
  let truncated = false;

  const walk = (dirPath, depth) => {
    if (truncated) return;
    if (parts.length >= MAX_SNAPSHOT_ENTRIES) { truncated = true; return; }
    let items;
    try {
      items = readdirSync(dirPath, { withFileTypes: true });
    } catch {
      truncated = true;
      return;
    }
    items.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const item of items) {
      if (parts.length >= MAX_SNAPSHOT_ENTRIES) { truncated = true; return; }
      if (SNAPSHOT_IGNORES.has(item.name)) continue;
      const abs = join(dirPath, item.name);
      if (item.isDirectory()) {
        if (depth < MAX_SNAPSHOT_DEPTH) walk(abs, depth + 1);
        else truncated = true;
        continue;
      }
      if (!item.isFile()) continue;
      let info;
      try { info = statSync(abs); } catch { continue; }
      parts.push(`${toPosix(relative(dir, abs))}:${info.size}:${Math.floor(info.mtimeMs)}`);
    }
  };

  walk(resolve(String(dir)), 0);
  return parts.join('|') + (truncated ? '|~' : '');
}

function isManagedHook(text) {
  return typeof text === 'string' && (text.includes(HOOK_MARKER) || text.includes(HOOK_MARKER_LEGACY));
}

/**
 * watchWorkspace — keep the index, instruction catalog and commit lake fresh.
 *
 * Changes are debounced; runs never overlap and at most one follow-up pass is
 * queued. A project path that is missing or unreadable raises an `error` event
 * instead of crashing the watcher. While `isPaused()` reports true, runs are
 * skipped and surfaced as `paused` events — the watcher stays alive and absorbs
 * the backlog on the next unpaused pass (flush is a full catch-up).
 */
export function watchWorkspace({ root, db, projects = [], debounceMs = 500, onEvent = null, indexOptions = {}, pollMs = POLL_INTERVAL_MS, isPaused = null, watchImpl = fsWatch } = {}) {
  const base = root ? resolve(String(root)) : process.cwd();
  const delay = Number.isFinite(Number(debounceMs)) ? Math.max(0, Number(debounceMs)) : 500;
  const entries = normalizeEntries(base, projects);
  const byName = new Map(entries.map((entry) => [entry.name, entry]));

  const stats = {
    runs: 0, errors: 0, queued: 0, lastRunAt: null,
    backends: { native: 0, errored: 0, polling: false },
  };
  const pending = new Set();
  const watchers = [];
  const pollSignatures = new Map();

  let stopped = false;
  let debounceTimer = null;
  let pollTimer = null;
  let loopPromise = null;
  let activeFlush = null;

  function emit(event) {
    if (typeof onEvent !== 'function') return;
    try {
      onEvent(event);
    } catch {
      // An event listener must never break the watcher.
    }
  }

  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function queue(names) {
    if (stopped) return;
    let added = false;
    for (const name of names) {
      if (!name) continue;
      pending.add(name);
      added = true;
    }
    if (!added) return;
    stats.queued = pending.size;
    if (!debounceTimer) {
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        ensureLoop();
      }, delay);
      debounceTimer.unref?.();
    }
  }

  const paused = typeof isPaused === 'function' ? isPaused : () => false;

  async function runOne(name) {
    const started = Date.now();
    if (paused()) {
      // Pause protocol (.hq/watch.pause): skip refreshes, keep watching.
      emit({ project: name, event: 'paused', durationMs: 0 });
      return;
    }
    stats.runs++;
    stats.lastRunAt = nowISO();
    const entry = byName.get(name);
    try {
      if (!entry) throw new Error(`hq watch: unknown project "${name}"`);
      if (!existsSync(entry.abs)) throw new Error(`hq watch: project path does not exist: ${entry.abs}`);
      const project = { ...entry.project, name: entry.name, path: entry.abs, abs: entry.abs };
      // indexOptions carries the workspace config (maxFileBytes, ignores) so a
      // watched reindex produces the same file universe as `hq index`; without
      // it the two tools drift and freshness gates disagree.
      const index = indexProject({ root: base, db, project, options: indexOptions });
      const instructions = indexInstructions(db, project);
      const lake = ingestProject(db, project);
      emit({
        project: name,
        event: 'change',
        durationMs: Date.now() - started,
        result: { index, instructions, lake },
      });
    } catch (error) {
      stats.errors++;
      emit({
        project: name,
        event: 'error',
        durationMs: Date.now() - started,
        error,
        message: errorMessage(error),
      });
    }
  }

  // Runs at most one pass at a time. While a pass runs, new changes collapse
  // into the single queued follow-up set.
  function ensureLoop() {
    if (loopPromise) return loopPromise;
    if (stopped || pending.size === 0) return null;
    const run = (async () => {
      while (!stopped && pending.size > 0) {
        const names = [...pending].sort();
        pending.clear();
        stats.queued = 0;
        for (const name of names) {
          if (stopped) break;
          await runOne(name);
        }
        stats.queued = pending.size;
      }
    })();
    const guarded = run.catch(() => {});
    loopPromise = guarded;
    guarded.finally(() => {
      if (loopPromise === guarded) loopPromise = null;
    });
    return guarded;
  }

  async function drain() {
    for (;;) {
      if (stopped) {
        if (loopPromise) await loopPromise;
        return;
      }
      if (loopPromise) {
        await loopPromise;
        continue;
      }
      if (pending.size === 0) return;
      ensureLoop();
    }
  }

  function onFsEvent(entry, filename) {
    if (stopped) return;
    if (filename) {
      // Churn under these roots is the workspace's own machinery (git
      // internals, HQ state, the generated wiki, dependencies) — indexing it
      // back would be a feedback loop of no-op reindexes.
      const segments = toPosix(String(filename)).split('/');
      if (segments.some((s) => s === '.git' || s === '.hq' || s === 'wiki' || s === 'node_modules')) return;
    }
    queue([entry.name]);
  }

  function startPolling() {
    if (stopped || pollTimer || entries.length === 0) return;
    stats.backends.polling = true;
    for (const entry of entries) {
      pollSignatures.set(entry.name, existsSync(entry.abs) ? snapshotProject(entry.abs) : '');
    }
    pollTimer = setInterval(() => {
      if (stopped) return;
      const changed = [];
      for (const entry of entries) {
        const signature = existsSync(entry.abs) ? snapshotProject(entry.abs) : '';
        if (pollSignatures.get(entry.name) !== signature) {
          pollSignatures.set(entry.name, signature);
          changed.push(entry.name);
        }
      }
      if (changed.length) queue(changed);
    }, Number.isFinite(Number(pollMs)) ? Math.max(250, Number(pollMs)) : POLL_INTERVAL_MS);
    pollTimer.unref?.();
  }

  function startWatching() {
    if (entries.length === 0) return;
    let failed = 0;
    for (const entry of entries) {
      if (!existsSync(entry.abs)) { failed++; continue; }
      try {
        const watcher = watchImpl(entry.abs, { recursive: true, persistent: false }, (eventType, filename) => {
          onFsEvent(entry, filename);
        });
        // A recursive watch can fail asynchronously — on Linux/containers the
        // inotify budget (fs.inotify.max_user_watches, 8192 here) is exhausted
        // while walking node_modules and the watcher emits 'error' ENOSPC. The
        // runtime's recursive watcher then keeps retrying in a hot loop (one
        // full core, zero IO). The error must close the broken watcher AND
        // engage the snapshot-poll fallback for every space: a silent no-op
        // handler leaves the space unwatched and burns CPU forever.
        watcher.on('error', (error) => {
          if (stopped) return;
          stats.backends.errored += 1;
          try { watcher.close(); } catch { /* already closed */ }
          emit({
            project: entry.name,
            event: 'watch-error',
            durationMs: 0,
            error,
            message: `native watch failed for ${entry.name}: ${errorMessage(error)} — snapshot polling engaged`,
          });
          startPolling();
        });
        stats.backends.native += 1;
        watchers.push(watcher);
      } catch {
        failed++;
        stats.backends.errored += 1;
      }
    }
    if (failed > 0) startPolling();
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    clearDebounce();
    if (mediaTimer) {
      clearInterval(mediaTimer);
      mediaTimer = null;
    }
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    for (const watcher of watchers) {
      try { watcher.close(); } catch { /* already closed */ }
    }
    watchers.length = 0;
    pending.clear();
    stats.queued = 0;
  }

  async function runFlush() {
    clearDebounce();
    if (stopped) {
      if (loopPromise) await loopPromise;
      return;
    }
    // A flush is a full pass: it catches changes fs.watch may have coalesced
    // or dropped, and makes `hq watch --once` deterministic.
    for (const entry of entries) pending.add(entry.name);
    stats.queued = pending.size;
    await drain();
    stats.queued = pending.size;
  }

  function flush() {
    if (activeFlush) return activeFlush;
    activeFlush = runFlush().finally(() => { activeFlush = null; });
    return activeFlush;
  }

  /**
   * Media poll clock (goal P54/P60): arrivals, library states, TVMaze release
   * refresh and dispatch planning on the VIVIM torrent store. Opt-in via
   * VIVIM_MEDIA_POLL=1 — plan-only (no client effects) unless
   * VIVIM_MEDIA_POLL_LIMIT=N also wires the live magnet-click adapter.
   * @hq:see hq/lib/torrent/poll.mjs (runMediaPoll) · hq/lib/torrent/dispatch-adapter.mjs
   */
  let mediaTimer = null;
  function startMediaPolling() {
    if (stopped || mediaTimer || process.env.VIVIM_MEDIA_POLL !== '1') return;
    const limit = Number(process.env.VIVIM_MEDIA_POLL_LIMIT || 0) || 0;
    mediaTimer = setInterval(() => {
      (async () => {
        const { runMediaPoll } = await import('./torrent/poll.mjs');
        const opts = {
          storeDir: process.env.VIVIM_MEDIA_STORE || 'C:/VIVIM/channel/vivim/torrent-store',
          backupDir: process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'qBittorrent', 'BT_backup') : null,
          limit,
        };
        if (limit > 0) {
          const { createStudioMedia } = await import('./torrent/dispatch-adapter.mjs');
          const media = await createStudioMedia({ port: Number(process.env.VIVIM_MEDIA_CDP_PORT || 9222) });
          opts.dispatchFn = media.dispatchFn;
          try {
            const res = await runMediaPoll(opts);
            console.log('[media] poll:', JSON.stringify(res));
          } finally {
            media.close();
          }
        } else {
          const res = await runMediaPoll(opts);
          console.log('[media] poll:', JSON.stringify(res));
        }
      })().catch((err) => console.error('[media] poll failed:', errorMessage(err)));
    }, MEDIA_POLL_INTERVAL_MS);
    mediaTimer.unref?.();
  }

  startWatching();
  startMediaPolling();

  return { stop, flush, stats };
}

// ---------------------------------------------------------------------------
// git hooks
// ---------------------------------------------------------------------------

function resolveHqBin(root) {
  const candidate = join(root, 'hq', 'bin', 'hq.mjs');
  if (existsSync(candidate)) return candidate;
  try {
    return fileURLToPath(new URL('../bin/hq.mjs', import.meta.url));
  } catch {
    return candidate;
  }
}

function gitDirFor(projectDir) {
  const dotGit = join(projectDir, '.git');
  if (!existsSync(dotGit)) return null;
  try {
    if (statSync(dotGit).isDirectory()) return dotGit;
  } catch {
    return null;
  }
  try {
    const text = readFileSync(dotGit, 'utf8');
    const match = /^gitdir:\s*(.+)$/im.exec(text);
    if (!match) return null;
    const target = match[1].trim();
    return isAbsolute(target) ? target : resolve(projectDir, target);
  } catch {
    return null;
  }
}

function doubleQuote(value) {
  return String(value)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
}

function hookScript({ name, bin, root, hook }) {
  const safeName = doubleQuote(name);
  const safeBin = doubleQuote(toPosix(bin));
  const safeRoot = doubleQuote(toPosix(root));
  const safeHook = doubleQuote(hook || 'git');
  const safeLog = doubleQuote(toPosix(join(root, '.hq', 'hooks.log')));
  const safePause = doubleQuote(toPosix(join(root, '.hq', 'watch.pause')));
  return [
    '#!/bin/sh',
    `${HOOK_MARKER} — generated by HQ. Do not edit; remove with "hq hooks remove".`,
    '# Keeps the local HQ index, commit lake and generated wiki fresh after git',
    '# events by running one `hq refresh` for this space. Runs in the background',
    '# and always exits 0 so a commit is never blocked.',
    '# cd to the HQ workspace root first: a hook runs from the project worktree,',
    '# which can be a sibling of the workspace, not a descendant of it.',
    `cd "${safeRoot}" || exit 0`,
    `# Pause protocol: while the watcher is paused for a batch/test run, hooks stay silent too.`,
    `[ -f "${safePause}" ] && exit 0`,
    `mkdir -p "${doubleQuote(toPosix(join(root, '.hq')))}" 2>/dev/null`,
    'command -v bun >/dev/null 2>&1 && HQ_RUN=bun || HQ_RUN=node',
    `"$HQ_RUN" "${safeBin}" refresh --space "${safeName}" --reason "hook:${safeHook}" --quiet >> "${safeLog}" 2>&1 &`,
    'exit 0',
    '',
  ].join('\n');
}

/**
 * installHooks — write HQ-managed post-commit, post-merge and post-checkout
 * hooks into every git project. Never touches a foreign hook unless `force`.
 */
export function installHooks({ root, projects = [], force = false } = {}) {
  const base = root ? resolve(String(root)) : process.cwd();
  const hqBin = resolveHqBin(base);
  const installed = [];
  const skipped = [];
  const hooks = [];

  for (const entry of normalizeEntries(base, projects)) {
    const gitDir = gitDirFor(entry.abs);
    if (!gitDir) {
      const record = {
        project: entry.name,
        hook: null,
        path: null,
        status: 'skipped',
        reason: 'not a git repository',
      };
      skipped.push(record);
      hooks.push(record);
      continue;
    }

    const hooksDir = join(gitDir, 'hooks');
    try {
      mkdirSync(hooksDir, { recursive: true });
    } catch (error) {
      const record = {
        project: entry.name,
        hook: null,
        path: hooksDir,
        status: 'skipped',
        reason: `cannot create hooks directory: ${errorMessage(error)}`,
      };
      skipped.push(record);
      hooks.push(record);
      continue;
    }

    for (const hook of HOOK_NAMES) {
      // One script per hook: the refresh reason names the git event.
      const content = hookScript({ name: entry.name, bin: hqBin, root: base, hook });
      const hookPath = join(hooksDir, hook);
      let existing = null;
      if (existsSync(hookPath)) {
        try { existing = readFileSync(hookPath, 'utf8'); } catch { existing = null; }
      }

      if (existing !== null) {
        if (existing === content) {
          hooks.push({ project: entry.name, hook, path: hookPath, status: 'unchanged' });
          continue;
        }
        if (!force && !isManagedHook(existing)) {
          const record = {
            project: entry.name,
            hook,
            path: hookPath,
            status: 'skipped',
            reason: 'existing hook is not HQ-managed',
          };
          skipped.push(record);
          hooks.push(record);
          continue;
        }
      }

      try {
        writeFileSync(hookPath, content, { mode: 0o755 });
      } catch (error) {
        const record = {
          project: entry.name,
          hook,
          path: hookPath,
          status: 'skipped',
          reason: `cannot write hook: ${errorMessage(error)}`,
        };
        skipped.push(record);
        hooks.push(record);
        continue;
      }
      try { chmodSync(hookPath, 0o755); } catch { /* best effort on Windows */ }

      const record = {
        project: entry.name,
        hook,
        path: hookPath,
        status: existing === null ? 'installed' : 'replaced',
      };
      installed.push(record);
      hooks.push(record);
    }
  }

  return { installed, skipped, hooks };
}

/**
 * uninstallHooks — remove only hook files carrying the HQ marker.
 */
export function uninstallHooks({ root, projects = [] } = {}) {
  const base = root ? resolve(String(root)) : process.cwd();
  const removed = [];

  for (const entry of normalizeEntries(base, projects)) {
    const gitDir = gitDirFor(entry.abs);
    if (!gitDir) continue;
    const hooksDir = join(gitDir, 'hooks');

    let names;
    try {
      names = readdirSync(hooksDir).sort();
    } catch {
      continue;
    }

    for (const hook of names) {
      const hookPath = join(hooksDir, hook);
      let text;
      try {
        if (!statSync(hookPath).isFile()) continue;
        text = readFileSync(hookPath, 'utf8');
      } catch {
        continue;
      }
      if (!isManagedHook(text)) continue;
      try {
        rmSync(hookPath, { force: true });
        removed.push({ project: entry.name, hook, path: hookPath });
      } catch {
        // Leave it for the next attempt rather than failing the whole uninstall.
      }
    }
  }

  return { removed };
}

/**
 * statusHooks — per-space report of managed hook presence (informational).
 */
export function statusHooks({ root, projects = [] } = {}) {
  const base = root ? resolve(String(root)) : process.cwd();
  const spaces = [];

  for (const entry of normalizeEntries(base, projects)) {
    const gitDir = gitDirFor(entry.abs);
    if (!gitDir) {
      spaces.push({ project: entry.name, path: entry.abs, git: false, hooks: [], installed: 0, missing: HOOK_NAMES.length, foreign: 0 });
      continue;
    }
    const hooksDir = join(gitDir, 'hooks');
    const hooks = [];
    for (const hook of HOOK_NAMES) {
      const hookPath = join(hooksDir, hook);
      let state = 'missing';
      if (existsSync(hookPath)) {
        try {
          const text = readFileSync(hookPath, 'utf8');
          state = text.includes(HOOK_MARKER) ? 'installed' : (isManagedHook(text) ? 'legacy' : 'foreign');
        } catch {
          state = 'unreadable';
        }
      }
      hooks.push({ hook, path: hookPath, state });
    }
    spaces.push({
      project: entry.name,
      path: entry.abs,
      git: true,
      hooks,
      installed: hooks.filter((h) => h.state === 'installed').length,
      missing: hooks.filter((h) => h.state === 'missing').length,
      foreign: hooks.filter((h) => h.state === 'foreign').length,
    });
  }

  return { spaces };
}
