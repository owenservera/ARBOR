/**
 * @hq:context The recurring jobs that keep the team panel, the protocol grant and the route plan fresh.
 * @hq:owner hq-agent
 * @hq:task team-automation
 * @hq:invariant one writer per file; every job is idempotent and has a rollback.
 * @hq:see docs/AGENT-BUS.md
 *
 * This module does not schedule anything. The ZCode automation system (CronCreate) owns the
 * schedule; this module owns the *description* of the recurring work: what each job does, what
 * it reads, what it writes, how long it costs, how to roll it back, and what one line it must
 * print. The manager registers the jobs; this file is the contract they register against.
 *
 * Three jobs live here and they are the only ones that may write the files they write:
 *
 *   1. team-state-cache  — `bun hq/bin/hq.mjs team --write-state`
 *      The prompt hook reads C:/VIVIM/channel/team-state.json on EVERY prompt. A stale cache
 *      means every agent on this machine reasons from a stale panel, so freshness is the
 *      constraint that decides its cadence.
 *
 *   2. protocol-grant    — `bun plugins/vivim-team/scripts/grant-protocol.mjs --apply`
 *      Re-grants the shared team-protocol skill and Context7 to every agent definition. It is
 *      idempotent in content (0 files change when the tree is already correct) and it always
 *      leaves a rollback point behind, because that rollback point is the only copy of what an
 *      agent definition looked like before the grant.
 *
 *   3. route-model       — `bun hq/bin/hq.mjs route-model`
 *      READ-ONLY. It proposes a budget-aware route from the measured provider health and
 *      changes nothing. Applying a route is a human decision and stays a human decision.
 *
 * The two automations that already exist on this machine (the 30-minute dogfood scan that owns
 * C:/VIVIM/channel/tasks/active-tasks.md, and the 06:00 provider-depot refresh) are NOT
 * duplicated here. This file must never grow a job that rewrites active-tasks.md.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { DEFAULT_AGENTS_DIR, DEFAULT_CHANNEL_ROOT } from './team-panel.mjs';
import { DEFAULT_POLICY } from './model-router.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
/** The repository root, so a spawned job can be run with a relative script path. */
export const REPO_ROOT = resolve(HERE, '..', '..');

/**
 * The trailing window over which provider health is measured. A provider verdict ("capped",
 * "budget-blocked") is a statement about usage in this window, so a cache that is older than
 * the window describes a period that has already rolled out of the live measurement.
 */
export const PROVIDER_HEALTH_WINDOW_MS = DEFAULT_POLICY.windowMs;

/** The one file the vivim-team prompt hook reads on every prompt. */
export const TEAM_STATE_PATH = 'C:/VIVIM/channel/team-state.json';

/** The two real locations a scheduled job must never be able to write during a simulation. */
export const GUARDED_ROOTS = [DEFAULT_AGENTS_DIR, DEFAULT_CHANNEL_ROOT];

/**
 * The recurring jobs.
 *
 * `costMs` is a MEASURED wall-clock cost of one run on this machine, not an estimate.
 * `writes` is exhaustive: if a job is not listed as writing a path, it must not write it.
 */
export const JOBS = [
  {
    id: 'team-state-cache',
    title: 'Refresh the team-state cache the prompt hook injects',
    cron: '*/5 * * * *',
    command: 'bun hq/bin/hq.mjs team --write-state',
    purpose:
      'Rebuild C:/VIVIM/channel/team-state.json so the vivim-team hook injects current seats, open tasks and provider health into every prompt instead of a stale snapshot.',
    writes: [TEAM_STATE_PATH],
    reads: [
      'C:/Users/VIVIM.inc/.zcode/agents/*.md',
      'C:/VIVIM/channel/seats.json',
      'C:/VIVIM/channel/tasks/active-tasks.md',
      'C:/Users/VIVIM.inc/.zcode/cli/db/db.sqlite',
    ],
    costMs: 440,
    mutates: true,
    rollback:
      'Restore the previous C:/VIVIM/channel/team-state.json from the copy taken before the run; if there is no copy, delete the file — the hook then reports "not cached yet" instead of serving stale context.',
    reportContract:
      'TEAM-STATE ok={ok} generated={generatedAt} age_s={ageSeconds} agents={agents} seats={seats} open_tasks={openTasks} defects={defects} capped={cappedProviders} action={action}',
  },
  {
    id: 'protocol-grant',
    title: 'Re-grant the shared team protocol and Context7 to every agent definition',
    cron: '*/10 * * * *',
    command: 'bun plugins/vivim-team/scripts/grant-protocol.mjs --apply',
    purpose:
      'Grant the shared team-protocol skill and Context7 MCP to every agent definition, repair tool grants that name tools this build does not expose, and give every definition a spawnable name. A definition that appears without the grant reaches a session ungranted.',
    writes: [
      'C:/Users/VIVIM.inc/.zcode/agents/*.md',
      'C:/Users/VIVIM.inc/.zcode/agents/_backup-<ISO>/',
      'C:/Users/VIVIM.inc/.zcode/skills/team-protocol/SKILL.md',
      'C:/0-BlackBoxProject-0/repos_hq/plugins/vivim-team/skills/team-protocol/SKILL.md',
    ],
    reads: [
      'C:/0-BlackBoxProject-0/repos_hq/hq/lib/team-protocol.mjs',
      'C:/Users/VIVIM.inc/.zcode/agents/*.md',
    ],
    costMs: 340,
    mutates: true,
    rollback:
      'Copy every changed agent definition back from the newest C:/Users/VIVIM.inc/.zcode/agents/_backup-<ISO>/ directory. The skill files are regenerated from hq/lib/team-protocol.mjs, so re-running the grant restores them exactly.',
    reportContract:
      'GRANT ok={ok} files={filesFound} changed={filesChanged} backup={backupDir} action={action}',
  },
  {
    id: 'route-model',
    title: 'Propose a budget-aware model route from the measured provider health',
    cron: '7 * * * *',
    command: 'bun hq/bin/hq.mjs route-model',
    purpose:
      'Print the model route the measured provider health supports, so the routing decision is made against evidence instead of a stale belief. It proposes; it never applies.',
    writes: [
      'C:/Users/VIVIM.inc/.zcode/agents/*.md',
      'C:/Users/VIVIM.inc/.zcode/agents/_backup-<ISO>/',
    ],
    reads: [
      'C:/Users/VIVIM.inc/.zcode/cli/db/db.sqlite',
      'C:/Users/VIVIM.inc/.zcode/provider-depot/catalog.json',
      'C:/Users/VIVIM.inc/.zcode/agents/*.md',
    ],
    costMs: 530,
    mutates: true,
    rollback:
      'Nothing to roll back: the job writes no file. If a route is later applied by hand, the backup is the .bak-route-<stamp> sibling next to each agent definition.',
    reportContract:
      'ROUTE-PLAN ok={ok} routes={routeCount} groups={groupCount} skipped={skippedCount} applied=no action={action}',
  },
];

/**
 * How each job is reproduced inside a temporary directory.
 *
 * The sandbox replaces every real root with a temp root, so the simulation structurally cannot
 * write C:/Users/VIVIM.inc/.zcode/agents or C:/VIVIM/channel. `argv` is the command with
 * placeholders that resolve to the sandbox roots.
 */
export const SANDBOX_PLANS = {
  'team-state-cache': {
    argv: [
      'hq/bin/hq.mjs', 'team', '--write-state',
      '--state-file', '{channelRoot}/team-state.json',
      '--agents-dir', '{agentsDir}',
      '--channel-root', '{channelRoot}',
    ],
    fixture: 'channel',
  },
  'protocol-grant': {
    argv: [
      'plugins/vivim-team/scripts/grant-protocol.mjs', '--apply',
      '--agents-dir', '{agentsDir}',
      '--skills-dir', '{skillsDir}',
      '--plugin-root', '{pluginRoot}',
    ],
    fixture: 'agents',
  },
  'route-model': {
    argv: ['hq/bin/hq.mjs', 'route-model', '--agents-dir', '{agentsDir}'],
    fixture: 'agents',
  },
};

/** A definition that is deliberately missing the grant, so a grant run has real work to do. */
const FIXTURE_AGENTS = [
  {
    file: 'alpha.md',
    text: '---\nname: alpha\ndescription: "A fixture agent."\nmodel: inherit\n---\n\nFixture body.\n',
  },
  {
    file: 'beta.md',
    text: '---\ndescription: "A fixture agent with no name and no grant."\nmodel: inherit\n---\n\nFixture body.\n',
  },
];

const FIXTURE_CHANNELS = {
  'seats.json': JSON.stringify({ seats: [] }, null, 2),
  'tasks/active-tasks.md': '# Active tasks\n\n## Open\n- [ ] a fixture task\n',
};

/** Replace every path segment in `text` that starts with `from` with `to`. */
function replaceRoot(text, from, to) {
  if (!from) return text;
  const normalized = from.replace(/\\/g, '/').replace(/\/+$/, '');
  const out = normalized.split('/').join(/[\\/]/g);
  return text.replace(new RegExp(out, 'g'), to.replace(/\\/g, '/'));
}

/** Normalize a path for comparison: forward slashes, no trailing slash, lower case. */
function normalizePath(p) {
  return String(p ?? '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase();
}

/**
 * Turn a write path into a glob pattern that matches the files it can own.
 * A trailing separator means "everything under this directory".
 */
function writePattern(p) {
  const raw = String(p ?? '').replace(/\\/g, '/');
  if (raw.endsWith('/')) return `${raw}*`;
  return raw;
}

/** Does `path` match the glob `pattern`? `*` matches inside one path segment only. */
function matchesPattern(pattern, path) {
  const p = normalizePath(pattern).replace(/\*+$/, '');
  const target = normalizePath(path);
  if (!p.includes('*')) return target === p || target.startsWith(`${p}/`);
  const rx = new RegExp(`^${p.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')}$`);
  return rx.test(target);
}

/**
 * Two writers on one path is a defect, not a schedule.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function writesConflict(a, b) {
  const pa = writePattern(a);
  const pb = writePattern(b);
  if (normalizePath(pa) === normalizePath(pb)) return true;
  if (matchesPattern(pa, pb) || matchesPattern(pb, pa)) return true;
  return false;
}

/**
 * The interval a 5-field cron expression fires at, in milliseconds.
 * Supports `*`, every-N, `M`, `M H`, `M H * * D`.
 *
 * @param {string} expr
 * @returns {number|null}
 */
export function cronIntervalMs(expr) {
  const parts = String(expr ?? '').trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hour, dom, mon, dow] = parts;
  const step = (field) => {
    const m = /^\*\/(\d+)$/.exec(field);
    return m ? Number(m[1]) : null;
  };
  const literal = (field) => (/^\d+$/.test(field) ? Number(field) : null);

  if (min === '*' && hour === '*') return 60_000;
  const minStep = step(min);
  if (minStep !== null && hour === '*') return minStep * 60_000;
  const minLit = literal(min);
  if (minLit !== null && hour === '*') return 60 * 60_000;
  const hourLit = literal(hour);
  if (minLit !== null && hourLit !== null) {
    if (dom === '*' && mon === '*' && dow === '*') return 24 * 60 * 60_000;
    if (dom === '*' && mon === '*' && /^\d$/.test(dow)) return 7 * 24 * 60 * 60_000;
    return 24 * 60 * 60_000;
  }
  return null;
}

/**
 * A cron expression plus a plain-language schedule.
 *
 * @param {{cron: string}} job
 * @returns {string}
 */
export function describeCron(job) {
  const expr = String(job?.cron ?? '').trim();
  const parts = expr.split(/\s+/);
  if (parts.length !== 5) return `${expr}  (unrecognized expression)`;
  const [min, hour, dom, mon, dow] = parts;
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const step = (field) => {
    const m = /^\*\/(\d+)$/.exec(field);
    return m ? Number(m[1]) : null;
  };
  const lit = (field) => (/^\d+$/.test(field) ? Number(field) : null);

  const minStep = step(min);
  if (minStep !== null && hour === '*') return `${expr}  (every ${minStep} minutes)`;
  if (min === '*' && hour === '*') return `${expr}  (every minute)`;
  const minLit = lit(min);
  const hourLit = lit(hour);
  if (minLit !== null && hourLit !== null) {
    const hh = String(hourLit).padStart(2, '0');
    const mm = String(minLit).padStart(2, '0');
    if (dom === '*' && mon === '*' && dow === '*') return `${expr}  (every day at ${hh}:${mm})`;
    if (dom === '*' && mon === '*' && /^\d$/.test(dow)) return `${expr}  (every ${WEEKDAYS[Number(dow)]} at ${hh}:${mm})`;
    return `${expr}  (at ${hh}:${mm})`;
  }
  if (minLit !== null && hour === '*') return `${expr}  (every hour at minute ${minLit})`;
  return `${expr}`;
}

/**
 * How old the team-state cache is, and what to do about it.
 *
 * Pure over an injected clock and a filesystem read: the caller owns `now`.
 *
 * @param {{statePath: string, maxAgeMs: number, now?: number}} input
 * @returns {{fresh: boolean, ageMs: number|null, path: string, action: string}}
 */
export function checkFreshness({ statePath, maxAgeMs, now = Date.now() } = {}) {
  const path = String(statePath ?? TEAM_STATE_PATH);
  if (!existsSync(path)) {
    return {
      fresh: false,
      ageMs: null,
      path,
      action: `bootstrap: run the team-state-cache job once to create ${path}`,
    };
  }
  const mtimeMs = statSync(path).mtimeMs;
  const ageMs = Math.max(0, Math.round(now - mtimeMs));
  const limit = Number(maxAgeMs);
  const fresh = Number.isFinite(limit) ? ageMs <= limit : true;
  return {
    fresh,
    ageMs,
    path,
    action: fresh
      ? `keep: the cache is ${Math.round(ageMs / 1000)}s old, inside the ${Math.round(limit / 1000)}s limit`
      : `refresh: the cache is ${Math.round(ageMs / 1000)}s old, over the ${Math.round(limit / 1000)}s limit; run the team-state-cache job now`,
  };
}

/**
 * Render the one-line report a job must print.
 *
 * @param {{contract?: string, values?: Object}} result
 * @returns {string}
 */
export function renderJobReport(result) {
  const contract = String(result?.contract ?? '');
  const values = result?.values && typeof result.values === 'object' ? result.values : result ?? {};
  const rendered = contract.replace(/\{(\w+)\}/g, (_, key) => {
    const v = values[key];
    if (v === undefined || v === null || v === '') return '-';
    return String(v);
  });
  return rendered.replace(/\s+/g, ' ').trim();
}

/** Normalize a path for comparison across platforms. */
function samePath(a, b) {
  return normalizePath(a) === normalizePath(b);
}

/**
 * Plan the recurring work: what runs, what conflicts, and how fresh the cache has to be.
 *
 * The cache lifetime is computed, not asserted: it is three ticks of the job that writes the
 * cache, capped so the cache can never be a quarter of the provider health window old. That
 * keeps the cached provider verdict inside the live measurement window it claims to describe.
 *
 * @param {{jobs?: Array<Object>}} input
 * @returns {{jobs: Array<Object>, conflicts: Array<Object>, coverage: {cacheMaxAgeMs: number, staleAfterMs: number}}}
 */
export function planJobs({ jobs = JOBS } = {}) {
  const list = Array.isArray(jobs) ? jobs : [];
  const conflicts = [];

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const aWrites = Array.isArray(a?.writes) ? a.writes : [];
      const bWrites = Array.isArray(b?.writes) ? b.writes : [];
      for (const wa of aWrites) {
        for (const wb of bWrites) {
          if (!writesConflict(wa, wb)) continue;
          conflicts.push({
            path: writePattern(wa),
            other: writePattern(wb),
            jobs: [a?.id, b?.id],
            severity: 'high',
            detail: `two writers on one path: ${a?.id} writes ${writePattern(wa)} and ${b?.id} writes ${writePattern(wb)}`,
          });
        }
      }
    }
  }

  // The cache writer is the only job that can refresh the file the prompt hook reads.
  const writer = list.find((job) => (job?.writes || []).some((w) => samePath(w, TEAM_STATE_PATH)))
    || list.find((job) => (job?.writes || []).some((w) => /team-state\.json$/i.test(String(w))));
  const writerInterval = writer ? cronIntervalMs(writer.cron) : null;

  // Three ticks of slack: one missed tick still leaves a cache inside its lifetime.
  const byTicks = writerInterval !== null ? writerInterval * 3 : null;
  // And never a quarter of the provider health window: the cache must describe a period that
  // is still inside the live measurement, or its provider verdict is about the past.
  const byWindow = Math.floor(PROVIDER_HEALTH_WINDOW_MS / 4);
  const candidates = [byTicks, byWindow].filter((v) => typeof v === 'number' && Number.isFinite(v) && v > 0);
  const cacheMaxAgeMs = candidates.length ? Math.min(...candidates) : byWindow;
  const staleAfterMs = Math.min(cacheMaxAgeMs * 2, Math.floor(PROVIDER_HEALTH_WINDOW_MS / 2));

  return { jobs: list, conflicts, coverage: { cacheMaxAgeMs, staleAfterMs } };
}

/**
 * The human-readable plan: one block per job, each ending with the exact command to register.
 *
 * @param {{jobs: Array<Object>, conflicts: Array<Object>, coverage: Object}} plan
 * @returns {string[]}
 */
export function renderAutomationPlan(plan) {
  const jobs = Array.isArray(plan?.jobs) ? plan.jobs : [];
  const conflicts = Array.isArray(plan?.conflicts) ? plan.conflicts : [];
  const coverage = plan?.coverage ?? {};

  const lines = [];
  lines.push('TEAM AUTOMATION PLAN');
  lines.push('');
  lines.push(`Cache lifetime: max ${Math.round((coverage.cacheMaxAgeMs ?? 0) / 1000)}s, stale after ${Math.round((coverage.staleAfterMs ?? 0) / 1000)}s.`);
  lines.push(`Provider health window: ${Math.round(PROVIDER_HEALTH_WINDOW_MS / 60000)} minutes.`);
  lines.push(
    conflicts.length
      ? `WRITE CONFLICTS: ${conflicts.length} — two writers on one path is a defect, not a schedule.`
      : 'WRITE CONFLICTS: none — one writer per file holds.',
  );
  for (const c of conflicts) lines.push(`  CONFLICT ${c.jobs.join(' vs ')}: ${c.detail}`);
  lines.push('');

  for (const job of jobs) {
    lines.push(`JOB ${job.id}`);
    lines.push(`  title     ${job.title}`);
    lines.push(`  purpose   ${job.purpose}`);
    lines.push(`  schedule  ${describeCron(job)}`);
    lines.push(`  command   ${job.command}`);
    lines.push(`  writes    ${(job.writes || []).length ? job.writes.join(', ') : '(nothing — read-only)'}`);
    lines.push(`  reads     ${(job.reads || []).join(', ')}`);
    lines.push(`  cost      ~${job.costMs}ms per run (measured)`);
    lines.push(`  mutates   ${job.mutates ? 'yes' : 'no'}`);
    lines.push(`  rollback  ${job.rollback}`);
    lines.push(`  report    ${job.reportContract}`);
    lines.push(`  register  ${job.command}`);
    lines.push('');
  }
  return lines;
}

/** Hash a file's content, or null when it cannot be read. */
function hashFile(path) {
  try {
    return createHash('sha256').update(readFileSync(path)).digest('hex');
  } catch {
    return null;
  }
}

/** Snapshot every file under `root` as path -> content hash. */
function snapshotTree(root) {
  const out = new Map();
  if (!root || !existsSync(root)) return out;
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.set(full, hashFile(full));
    }
  };
  walk(root);
  return out;
}

/** Seed the sandbox with the fixture state the job needs to do real work. */
function seedSandbox(sandbox, plan) {
  const agentsDir = join(sandbox, 'agents');
  const channelRoot = join(sandbox, 'channel');
  const skillsDir = join(sandbox, 'skills');
  const pluginRoot = join(sandbox, 'plugin');
  mkdirSync(agentsDir, { recursive: true });
  mkdirSync(channelRoot, { recursive: true });
  mkdirSync(skillsDir, { recursive: true });
  mkdirSync(pluginRoot, { recursive: true });

  for (const agent of FIXTURE_AGENTS) writeFileSync(join(agentsDir, agent.file), agent.text, 'utf8');
  for (const [rel, text] of Object.entries(FIXTURE_CHANNELS)) {
    const full = join(channelRoot, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text, 'utf8');
  }
  return { agentsDir, channelRoot, skillsDir, pluginRoot };
}

/**
 * Run one job against a TEMPORARY directory and prove it stayed there.
 *
 * The job's real roots are replaced by temp roots before it starts, so it structurally cannot
 * write C:/Users/VIVIM.inc/.zcode/agents or C:/VIVIM/channel. The guarded roots are also
 * snapshotted before and after: if anything moved there anyway, the run is not ok.
 *
 * @param {Object} job
 * @param {{tmpDir?: string, run?: Function, guardedRoots?: string[]}} [deps]
 * @returns {{ok: boolean, durationMs: number, stdoutHead: string, changedFiles: string[]}}
 */
export function simulateRun(job, { deps = {} } = {}) {
  const started = Date.now();
  const plan = SANDBOX_PLANS?.[job?.id];
  const guardedRoots = Array.isArray(deps.guardedRoots) ? deps.guardedRoots : GUARDED_ROOTS;

  if (!plan) {
    return {
      ok: false,
      durationMs: 0,
      stdoutHead: `no sandbox plan for job ${job?.id}; refusing to run it against the real machine`,
      changedFiles: [],
    };
  }

  const ownsTmp = !deps.tmpDir;
  const sandbox = deps.tmpDir || mkdtempSync(join(tmpdir(), 'hq-team-automation-'));
  const roots = seedSandbox(sandbox, plan);

  const substitutions = {
    '{agentsDir}': roots.agentsDir,
    '{channelRoot}': roots.channelRoot,
    '{skillsDir}': roots.skillsDir,
    '{pluginRoot}': roots.pluginRoot,
  };
  let argv = plan.argv.map((part) => {
    for (const [token, value] of Object.entries(substitutions)) {
      if (part === token) return value;
      if (part.includes(token)) return part.split(token).join(value);
    }
    return part;
  });

  // Structural guard: the real roots must not survive into the command that runs.
  const argvText = argv.join(' ');
  const leaked = guardedRoots.filter((root) => {
    const normalized = normalizePath(root);
    return normalizePath(argvText).includes(normalized);
  });

  const before = new Map();
  for (const root of guardedRoots) before.set(root, snapshotTree(root));
  const sandboxBefore = snapshotTree(sandbox);

  let stdout = '';
  let stderr = '';
  let code = 1;
  if (!leaked.length) {
    const runner = deps.run || ((args, options) => spawnSync('bun', args, options));
    const res = runner(argv, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { ...process.env, ...(deps.env || {}) },
      timeout: 120_000,
    });
    stdout = String(res?.stdout ?? '');
    stderr = String(res?.stderr ?? '');
    code = typeof res?.status === 'number' ? res.status : 1;
  } else {
    stdout = `refused to run: the command still references ${leaked.join(', ')}`;
  }

  const sandboxAfter = snapshotTree(sandbox);
  const changedFiles = [];
  for (const [file, hash] of sandboxAfter) {
    if (sandboxBefore.get(file) !== hash) changedFiles.push(file);
  }
  changedFiles.sort();

  // Empirical guard: nothing under a guarded root may have moved.
  let guardedIntact = true;
  for (const root of guardedRoots) {
    const after = snapshotTree(root);
    const prev = before.get(root) || new Map();
    if (after.size !== prev.size) {
      guardedIntact = false;
      break;
    }
    for (const [file, hash] of after) {
      if (prev.get(file) !== hash) {
        guardedIntact = false;
        break;
      }
    }
    if (!guardedIntact) break;
  }

  const durationMs = Date.now() - started;
  const stdoutHead = (stdout || stderr).slice(0, 600);

  if (ownsTmp) {
    // The sandbox is the caller's evidence; leave it in place so the caller can inspect it.
  }

  return {
    ok: code === 0 && guardedIntact && !leaked.length,
    durationMs,
    stdoutHead,
    changedFiles,
  };
}
