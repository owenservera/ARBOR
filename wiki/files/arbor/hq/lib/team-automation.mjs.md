# File: hq/lib/team-automation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/team-automation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 24561 B |
| Lines | 610 |
| Hash | 00974c04881a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 43 | no | const HERE = dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 45 | yes | export const REPO_ROOT = resolve(HERE, &#39;..&#39;, &#39;..&#39;); |
| PROVIDER_HEALTH_WINDOW_MS | const | 52 | yes | export const PROVIDER_HEALTH_WINDOW_MS = DEFAULT_POLICY.windowMs; |
| TEAM_STATE_PATH | const | 55 | yes | export const TEAM_STATE_PATH = &#39;C:/VIVIM/channel/team-state.json&#39;; |
| GUARDED_ROOTS | const | 58 | yes | export const GUARDED_ROOTS = [DEFAULT_AGENTS_DIR, DEFAULT_CHANNEL_ROOT]; |
| JOBS | const | 66 | yes | export const JOBS = [ |
| SANDBOX_PLANS | const | 144 | yes | export const SANDBOX_PLANS = { |
| FIXTURE_AGENTS | const | 170 | no | const FIXTURE_AGENTS = [ |
| FIXTURE_CHANNELS | const | 181 | no | const FIXTURE_CHANNELS = { |
| replaceRoot | function | 187 | no | function replaceRoot(text, from, to) { |
| normalized | const | 189 | no | const normalized = from.replace(/\\\\/g, &#39;/&#39;).replace(/\\/+$/, &#39;&#39;); |
| out | const | 190 | no | const out = normalized.split(&#39;/&#39;).join(/[\\\\/]/g); |
| normalizePath | function | 195 | no | function normalizePath(p) { |
| writePattern | function | 206 | no | function writePattern(p) { |
| raw | const | 207 | no | const raw = String(p ?? &#39;&#39;).replace(/\\\\/g, &#39;/&#39;); |
| matchesPattern | function | 213 | no | function matchesPattern(pattern, path) { |
| p | const | 214 | no | const p = normalizePath(pattern).replace(/\\*+$/, &#39;&#39;); |
| target | const | 215 | no | const target = normalizePath(path); |
| rx | const | 217 | no | const rx = new RegExp(`^${p.split(&#39;*&#39;).map((s) =&gt; s.replace(/[.*+?^${}()\|[\\]\\\\]/g, &#39;\\\\$&amp;&#39;)).join(&#39;[^/]*&#39;)}$`); |
| writesConflict | function | 228 | yes | export function writesConflict(a, b) { |
| pa | const | 229 | no | const pa = writePattern(a); |
| pb | const | 230 | no | const pb = writePattern(b); |
| cronIntervalMs | function | 243 | yes | export function cronIntervalMs(expr) { |
| parts | const | 244 | no | const parts = String(expr ?? &#39;&#39;).trim().split(/\\s+/); |
| step | function | 247 | no | const step = (field) =&gt; { |
| m | const | 248 | no | const m = /^\\*\\/(\\d+)$/.exec(field); |
| literal | function | 251 | no | const literal = (field) =&gt; (/^\\d+$/.test(field) ? Number(field) : null); |
| minStep | const | 254 | no | const minStep = step(min); |
| minLit | const | 256 | no | const minLit = literal(min); |
| hourLit | const | 258 | no | const hourLit = literal(hour); |
| describeCron | function | 273 | yes | export function describeCron(job) { |
| expr | const | 274 | no | const expr = String(job?.cron ?? &#39;&#39;).trim(); |
| parts | const | 275 | no | const parts = expr.split(/\\s+/); |
| WEEKDAYS | const | 278 | no | const WEEKDAYS = [&#39;Sunday&#39;, &#39;Monday&#39;, &#39;Tuesday&#39;, &#39;Wednesday&#39;, &#39;Thursday&#39;, &#39;Friday&#39;, &#39;Saturday&#39;]; |
| step | function | 280 | no | const step = (field) =&gt; { |
| m | const | 281 | no | const m = /^\\*\\/(\\d+)$/.exec(field); |
| lit | function | 284 | no | const lit = (field) =&gt; (/^\\d+$/.test(field) ? Number(field) : null); |
| minStep | const | 286 | no | const minStep = step(min); |
| minLit | const | 289 | no | const minLit = lit(min); |
| hourLit | const | 290 | no | const hourLit = lit(hour); |
| hh | const | 292 | no | const hh = String(hourLit).padStart(2, &#39;0&#39;); |
| mm | const | 293 | no | const mm = String(minLit).padStart(2, &#39;0&#39;); |
| checkFreshness | function | 310 | yes | export function checkFreshness({ statePath, maxAgeMs, now = Date.now() } = {}) { |
| path | const | 311 | no | const path = String(statePath ?? TEAM_STATE_PATH); |
| mtimeMs | const | 320 | no | const mtimeMs = statSync(path).mtimeMs; |
| ageMs | const | 321 | no | const ageMs = Math.max(0, Math.round(now - mtimeMs)); |
| limit | const | 322 | no | const limit = Number(maxAgeMs); |
| fresh | const | 323 | no | const fresh = Number.isFinite(limit) ? ageMs &lt;= limit : true; |
| renderJobReport | function | 340 | yes | export function renderJobReport(result) { |
| contract | const | 341 | no | const contract = String(result?.contract ?? &#39;&#39;); |
| values | const | 342 | no | const values = result?.values &amp;&amp; typeof result.values === &#39;object&#39; ? result.values : result ?? {}; |
| rendered | const | 343 | no | const rendered = contract.replace(/\\{(\\w+)\\}/g, (_, key) =&gt; { const v = values[key]; if (v === undefined \|\| v === null \|\| v === &#39;&#39;) return &#39;-&#39;; return String(v); }); |
| v | const | 344 | no | const v = values[key]; |
| samePath | function | 352 | no | function samePath(a, b) { |
| planJobs | function | 366 | yes | export function planJobs({ jobs = JOBS } = {}) { |
| list | const | 367 | no | const list = Array.isArray(jobs) ? jobs : []; |
| conflicts | const | 368 | no | const conflicts = []; |
| a | const | 372 | no | const a = list[i]; |
| b | const | 373 | no | const b = list[j]; |
| aWrites | const | 374 | no | const aWrites = Array.isArray(a?.writes) ? a.writes : []; |
| bWrites | const | 375 | no | const bWrites = Array.isArray(b?.writes) ? b.writes : []; |
| writer | const | 392 | no | const writer = list.find((job) =&gt; (job?.writes \|\| []).some((w) =&gt; samePath(w, TEAM_STATE_PATH))) |
| writerInterval | const | 394 | no | const writerInterval = writer ? cronIntervalMs(writer.cron) : null; |
| byTicks | const | 397 | no | const byTicks = writerInterval !== null ? writerInterval * 3 : null; |
| byWindow | const | 400 | no | const byWindow = Math.floor(PROVIDER_HEALTH_WINDOW_MS / 4); |
| candidates | const | 401 | no | const candidates = [byTicks, byWindow].filter((v) =&gt; typeof v === &#39;number&#39; &amp;&amp; Number.isFinite(v) &amp;&amp; v &gt; 0); |
| cacheMaxAgeMs | const | 402 | no | const cacheMaxAgeMs = candidates.length ? Math.min(...candidates) : byWindow; |
| staleAfterMs | const | 403 | no | const staleAfterMs = Math.min(cacheMaxAgeMs * 2, Math.floor(PROVIDER_HEALTH_WINDOW_MS / 2)); |
| renderAutomationPlan | function | 414 | yes | export function renderAutomationPlan(plan) { |
| jobs | const | 415 | no | const jobs = Array.isArray(plan?.jobs) ? plan.jobs : []; |
| conflicts | const | 416 | no | const conflicts = Array.isArray(plan?.conflicts) ? plan.conflicts : []; |
| coverage | const | 417 | no | const coverage = plan?.coverage ?? {}; |
| lines | const | 419 | no | const lines = []; |
| hashFile | function | 451 | no | function hashFile(path) { |
| snapshotTree | function | 460 | no | function snapshotTree(root) { |
| out | const | 461 | no | const out = new Map(); |
| walk | function | 463 | no | const walk = (dir) =&gt; { |
| entries | variable | 464 | no | let entries; |
| full | const | 471 | no | const full = join(dir, entry.name); |
| seedSandbox | function | 481 | no | function seedSandbox(sandbox, plan) { |
| agentsDir | const | 482 | no | const agentsDir = join(sandbox, &#39;agents&#39;); |
| channelRoot | const | 483 | no | const channelRoot = join(sandbox, &#39;channel&#39;); |
| skillsDir | const | 484 | no | const skillsDir = join(sandbox, &#39;skills&#39;); |
| pluginRoot | const | 485 | no | const pluginRoot = join(sandbox, &#39;plugin&#39;); |
| full | const | 493 | no | const full = join(channelRoot, rel); |
| simulateRun | function | 511 | yes | export function simulateRun(job, { deps = {} } = {}) { |
| started | const | 512 | no | const started = Date.now(); |
| plan | const | 513 | no | const plan = SANDBOX_PLANS?.[job?.id]; |
| guardedRoots | const | 514 | no | const guardedRoots = Array.isArray(deps.guardedRoots) ? deps.guardedRoots : GUARDED_ROOTS; |
| ownsTmp | const | 525 | no | const ownsTmp = !deps.tmpDir; |
| sandbox | const | 526 | no | const sandbox = deps.tmpDir \|\| mkdtempSync(join(tmpdir(), &#39;hq-team-automation-&#39;)); |
| roots | const | 527 | no | const roots = seedSandbox(sandbox, plan); |
| substitutions | const | 529 | no | const substitutions = { |
| argv | variable | 535 | no | let argv = plan.argv.map((part) =&gt; { for (const [token, value] of Object.entries(substitutions)) { if (part === token) return value; if (part.includes(token)) return part.split(token).join(value); } |
| argvText | const | 544 | no | const argvText = argv.join(&#39; &#39;); |
| leaked | const | 545 | no | const leaked = guardedRoots.filter((root) =&gt; { const normalized = normalizePath(root); return normalizePath(argvText).includes(normalized); }); |
| normalized | const | 546 | no | const normalized = normalizePath(root); |
| before | const | 550 | no | const before = new Map(); |
| sandboxBefore | const | 552 | no | const sandboxBefore = snapshotTree(sandbox); |
| stdout | variable | 554 | no | let stdout = &#39;&#39;; |
| stderr | variable | 555 | no | let stderr = &#39;&#39;; |
| code | variable | 556 | no | let code = 1; |
| runner | const | 558 | no | const runner = deps.run \|\| ((args, options) =&gt; spawnSync(&#39;bun&#39;, args, options)); |
| res | const | 559 | no | const res = runner(argv, { cwd: REPO_ROOT, encoding: &#39;utf8&#39;, env: { ...process.env, ...(deps.env \|\| {}) }, timeout: 120_000, |
| sandboxAfter | const | 572 | no | const sandboxAfter = snapshotTree(sandbox); |
| changedFiles | const | 573 | no | const changedFiles = []; |
| guardedIntact | variable | 580 | no | let guardedIntact = true; |
| after | const | 582 | no | const after = snapshotTree(root); |
| prev | const | 583 | no | const prev = before.get(root) \|\| new Map(); |
| durationMs | const | 597 | no | const durationMs = Date.now() - started; |
| stdoutHead | const | 598 | no | const stdoutHead = (stdout \|\| stderr).slice(0, 600); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 34 | external |
| node:crypto | import | 35 | external |
| node:child_process | import | 36 | external |
| node:path | import | 37 | external |
| node:os | import | 38 | external |
| node:url | import | 39 | external |
| ./team-panel.mjs | import | 40 | [hq/lib/team-panel.mjs](./team-panel.mjs.md) |
| ./model-router.mjs | import | 41 | [hq/lib/model-router.mjs](./model-router.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The recurring jobs that keep the team panel, the protocol grant and the route plan fresh. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | team-automation |
| 5 | invariant | — | — | one writer per file; every job is idempotent and has a rollback. |
| 6 | see | — | docs/AGENT-BUS.md | docs/AGENT-BUS.md |

## Excerpt

```javascript
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
```

_First 80 of 611 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
