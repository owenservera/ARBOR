/**
 * @hq:context Real-time event coordinator (lane S): a pure event planner plus a debounced, non-overlapping dispatcher for index/ingest/wiki/session work.
 * @hq:owner hq
 * @hq:task LAB-01
 * @hq:invariant planRealtime is pure — no IO, no timers, no network; the same event always yields the same actions.
 * @hq:invariant The coordinator never sends data, never drives a browser and never throws at the caller: onEvent is synchronous and safe on malformed input.
 * @hq:invariant Secret paths are dropped before any action is planned, so a credential never reaches a worker.
 * @hq:why Runs are serialized per kind and coalesced per (kind, project) so a burst of editor writes cannot start parallel index passes.
 * @hq:see hq/CONTRACT.md
 * @hq:see hq/lib/automation.mjs
 */
import { toPosix } from './util.mjs';

export const REALTIME_SCHEMA = 'hq.realtime/1';

/** Maximum number of scheduled actions waiting to be consumed by a run. */
const MAX_QUEUE = 256;

/** Basenames that never reach a worker. Mirrors the HQ-wide secret rule. */
const SECRET_BASENAMES = new Set([
  'session.json',
  'storage-state.json',
  'release-profile.json',
  'cookies',
  'login data',
]);

const DOCS_DIR = /(?:^|\/)docs\//;

const yieldTick = typeof setImmediate === 'function'
  ? () => new Promise((resolve) => setImmediate(resolve))
  : () => new Promise((resolve) => setTimeout(resolve, 0));

// ---------------------------------------------------------------------------
// small deterministic helpers
// ---------------------------------------------------------------------------

function posixPath(value) {
  return toPosix(String(value ?? '')).trim();
}

function baseName(value) {
  const path = posixPath(value).replace(/\/+$/, '');
  const cut = path.lastIndexOf('/');
  return cut === -1 ? path : path.slice(cut + 1);
}

function trimmed(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function projectName(value) {
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object') {
    const name = value.name ?? value.id;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  return null;
}

function eventTypeOf(event) {
  if (!event || typeof event !== 'object') return '';
  return trimmed(event.type ?? event.kind ?? event.name);
}

function dataOf(event) {
  if (!event || typeof event !== 'object') return {};
  const data = event.data ?? event.properties ?? event.payload;
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

/**
 * isSecretPath — true when a path names a credential store HQ must never read.
 * Rules: `.env*`, `*.keystore`, `session.json`, `storage-state.json`,
 * `release-profile.json`, `Cookies`, `Login Data`.
 */
export function isSecretPath(value) {
  const name = baseName(value).toLowerCase();
  if (!name) return false;
  if (name.startsWith('.env')) return true;
  if (name.endsWith('.keystore')) return true;
  return SECRET_BASENAMES.has(name);
}

/** True when a path lives under a `docs/` directory or is a Markdown file. */
function isDocsPath(value) {
  const path = posixPath(value).toLowerCase();
  if (!path) return false;
  if (path.endsWith('.md')) return true;
  return DOCS_DIR.test(path);
}

/** The secret path carried by an event, or null when the event is clean. */
function secretPathOf(event) {
  const type = eventTypeOf(event);
  const data = dataOf(event);
  let candidate = '';
  if (type === 'filesystem.changed' || type === 'filesystem.added' || type === 'filesystem.removed') {
    candidate = trimmed(event.path) || trimmed(data.path);
  } else if (type === 'mcp.call' || type === 'manual') {
    candidate = trimmed(data.path);
  }
  if (candidate && isSecretPath(candidate)) return candidate;
  return null;
}

// ---------------------------------------------------------------------------
// planner
// ---------------------------------------------------------------------------

/**
 * planRealtime — map one event to the actions HQ should take.
 *
 * Pure: no IO, no timers, no network, no clock. Malformed input yields
 * `{actions: []}` instead of throwing.
 */
export function planRealtime(event) {
  const type = eventTypeOf(event);
  const data = dataOf(event);
  const actions = [];
  if (!type) return { actions };

  switch (type) {
    case 'filesystem.changed':
    case 'filesystem.added':
    case 'filesystem.removed': {
      const path = trimmed(event.path) || trimmed(data.path) || null;
      if (path && isSecretPath(path)) return { actions };
      const project = projectName(event.project ?? data.project);
      actions.push({ kind: 'index', project, path, reason: 'source_changed' });
      if (path && isDocsPath(path)) {
        actions.push({ kind: 'wiki', project, path, reason: 'wiki_stale' });
      }
      return { actions };
    }

    case 'git.commit':
    case 'git.merge':
    case 'git.checkout': {
      const project = projectName(event.project ?? data.project);
      actions.push({ kind: 'ingest', project, path: null, reason: 'git_event' });
      actions.push({ kind: 'index', project, path: null, reason: 'tree_changed' });
      return { actions };
    }

    case 'session.created':
    case 'session.idle':
    case 'session.tool.success':
    case 'session.compaction.ended': {
      const project = projectName(event.project ?? data.project);
      actions.push({ kind: 'session', project, path: null, reason: 'session_event' });
      return { actions };
    }

    case 'mcp.call': {
      const path = trimmed(data.path) || null;
      if (!path) return { actions };
      if (isSecretPath(path)) return { actions };
      const project = projectName(data.project ?? event.project);
      actions.push({ kind: 'index', project, path, reason: 'mcp_touch' });
      return { actions };
    }

    case 'manual': {
      const path = trimmed(data.path) || null;
      const project = projectName(data.project);
      if (!path && !project) return { actions };
      if (path && isSecretPath(path)) return { actions };
      actions.push({ kind: 'index', project, path, reason: 'manual' });
      return { actions };
    }

    default:
      return { actions };
  }
}

// ---------------------------------------------------------------------------
// coordinator
// ---------------------------------------------------------------------------

/**
 * createRealtimeCoordinator — wire planned actions to injected async workers.
 *
 * - Debounce per (kind, project): a burst of events collapses into one run.
 * - Runs of the same kind never overlap; a request that arrives during a run
 *   queues at most one follow-up, further requests coalesce into it.
 * - The pending queue is bounded; overflow increments `dropped`, never throws.
 * - `onEvent` is synchronous and never throws. `flush()` drains the queue and
 *   awaits the work. `stop()` stops scheduling and resolves after in-flight
 *   work has settled.
 *
 * Workers are injected: `index`, `ingest`, `wiki` and an optional `session`
 * sink. An action whose kind has no injected worker is planned but never
 * scheduled, so the coordinator never pretends to have done work.
 */
export function createRealtimeCoordinator({
  root,
  db,
  projects = [],
  index,
  ingest,
  wiki,
  session,
  debounceMs = 500,
} = {}) {
  const delay = Number.isFinite(Number(debounceMs)) ? Math.max(0, Number(debounceMs)) : 500;
  const projectList = Array.isArray(projects) ? projects : [];
  const workers = {
    index: typeof index === 'function' ? index : null,
    ingest: typeof ingest === 'function' ? ingest : null,
    wiki: typeof wiki === 'function' ? wiki : null,
    session: typeof session === 'function' ? session : null,
  };

  const stats = {
    events: 0,
    planned: 0,
    ran: 0,
    debounced: 0,
    dropped: 0,
    failed: 0,
    excludedSecrets: 0,
    byKind: {},
  };

  /** @type {Map<string, {key:string, kind:string, project:string|null, entries:Array<object>, timer:any, running:boolean, followUp:boolean}>} */
  const groups = new Map();
  /** @type {Map<string, Promise<any>>} */
  const kindTail = new Map();
  /** @type {Set<Promise<any>>} */
  const inFlight = new Set();

  let queueSize = 0;
  let stopped = false;
  let stopPromise = null;

  function groupFor(kind, project) {
    const key = `${kind}\0${project ?? ''}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        kind,
        project: project ?? null,
        entries: [],
        timer: null,
        running: false,
        followUp: false,
      };
      groups.set(key, group);
    }
    return group;
  }

  function armTimer(group) {
    if (stopped) return;
    if (group.timer) clearTimeout(group.timer);
    group.timer = setTimeout(() => {
      group.timer = null;
      startRun(group);
    }, delay);
    group.timer.unref?.();
  }

  function schedule(action) {
    if (stopped) return false;
    if (!workers[action.kind]) return false;
    if (queueSize >= MAX_QUEUE) {
      stats.dropped++;
      return false;
    }
    const group = groupFor(action.kind, action.project);
    if (group.entries.length > 0 || group.timer !== null || group.running) stats.debounced++;
    queueSize++;
    group.entries.push({ project: action.project, path: action.path, reason: action.reason });
    if (group.running) {
      // At most one follow-up; later requests coalesce into it.
      group.followUp = true;
      return true;
    }
    armTimer(group);
    return true;
  }

  function startRun(group) {
    if (group.running) {
      group.followUp = true;
      return;
    }
    const entries = group.entries.splice(0, group.entries.length);
    if (entries.length === 0) return;
    queueSize -= entries.length;
    group.running = true;

    const worker = workers[group.kind];
    const payload = {
      kind: group.kind,
      project: group.project,
      paths: entries.map((entry) => entry.path).filter((value) => typeof value === 'string' && value),
      entries,
      reason: entries[0].reason,
      root,
      db,
      projects: projectList,
    };

    const tail = kindTail.get(group.kind) ?? Promise.resolve();
    const run = tail.then(async () => {
      stats.ran++;
      stats.byKind[group.kind] = (stats.byKind[group.kind] ?? 0) + 1;
      try {
        await worker(payload);
      } catch {
        stats.failed++;
      }
    });

    kindTail.set(group.kind, run.then(() => undefined, () => undefined));

    const tracked = run.then(
      () => { inFlight.delete(tracked); },
      () => { inFlight.delete(tracked); },
    );
    inFlight.add(tracked);

    const finalize = () => {
      group.running = false;
      if (stopped) return;
      if (group.followUp) {
        group.followUp = false;
        armTimer(group);
      } else if (group.entries.length === 0) {
        groups.delete(group.key);
      }
    };
    run.then(finalize, finalize);
  }

  function onEvent(event) {
    try {
      stats.events++;
      if (secretPathOf(event)) {
        stats.excludedSecrets++;
        return;
      }
      const plan = planRealtime(event);
      const actions = Array.isArray(plan?.actions) ? plan.actions : [];
      stats.planned += actions.length;
      for (const action of actions) {
        try {
          schedule(action);
        } catch {
          stats.dropped++;
        }
      }
    } catch {
      // A malformed event must never break the coordinator.
    }
  }

  async function flush() {
    for (;;) {
      for (const group of [...groups.values()]) {
        if (group.timer) {
          clearTimeout(group.timer);
          group.timer = null;
        }
      }
      let started = false;
      for (const group of [...groups.values()]) {
        if (!group.running && group.entries.length > 0) {
          startRun(group);
          started = true;
        }
      }
      if (inFlight.size > 0) {
        await Promise.allSettled([...inFlight]);
        continue;
      }
      const busy = [...groups.values()].some(
        (group) => group.running || group.entries.length > 0 || group.timer !== null,
      );
      if (busy) {
        await yieldTick();
        continue;
      }
      if (!started) break;
    }
  }

  function stop() {
    if (stopPromise) return stopPromise;
    stopped = true;
    for (const group of groups.values()) {
      if (group.timer) {
        clearTimeout(group.timer);
        group.timer = null;
      }
      group.entries.length = 0;
      group.followUp = false;
    }
    queueSize = 0;
    stopPromise = (async () => {
      while (inFlight.size > 0) {
        await Promise.allSettled([...inFlight]);
      }
    })();
    return stopPromise;
  }

  return { onEvent, flush, stop, stats };
}
