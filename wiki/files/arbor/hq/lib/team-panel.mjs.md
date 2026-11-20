# File: hq/lib/team-panel.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/team-panel.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 25822 B |
| Lines | 515 |
| Hash | 16fdaaccf584 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| nodeRequire | const | 21 | no | const nodeRequire = createRequire(import.meta.url); |
| openDatabase | function | 22 | no | function openDatabase(path) { |
| DEFAULT_AGENTS_DIR | const | 26 | yes | export const DEFAULT_AGENTS_DIR = join(process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;, &#39;.zcode&#39;, &#39;agents&#39;); |
| DEFAULT_CHANNEL_ROOT | const | 27 | yes | export const DEFAULT_CHANNEL_ROOT = &#39;C:/VIVIM/channel&#39;; |
| DEFAULT_SESSION_DB | const | 28 | yes | export const DEFAULT_SESSION_DB = join(process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;, &#39;.zcode&#39;, &#39;cli&#39;, &#39;db&#39;, &#39;db.sqlite&#39;); |
| NONEXISTENT_TOOLS | const | 31 | yes | export const NONEXISTENT_TOOLS = [&#39;Glob&#39;, &#39;Grep&#39;]; |
| CONTEXT7_TOOLS | const | 33 | yes | export const CONTEXT7_TOOLS = [&#39;mcp__context7__resolve-library-id&#39;, &#39;mcp__context7__query-docs&#39;]; |
| PROTOCOL_SKILL | const | 34 | yes | export const PROTOCOL_SKILL = &#39;team-protocol&#39;; |
| LAUNCHABLE_THOUGHT_LEVELS | const | 43 | yes | export const LAUNCHABLE_THOUGHT_LEVELS = Object.freeze([&#39;low&#39;, &#39;medium&#39;, &#39;high&#39;]); |
| KNOWN_TOOLS | const | 45 | yes | export const KNOWN_TOOLS = Object.freeze([ &#39;Read&#39;, &#39;Write&#39;, &#39;Edit&#39;, &#39;Bash&#39;, &#39;TodoWrite&#39;, &#39;TodoRead&#39;, &#39;WebFetch&#39;, &#39;Skill&#39;, &#39;Agent&#39;, &#39;SendMessage&#39;, &#39;AskUserQuestion&#39;, &#39;EnterPlanMode&#39;, &#39;ExitPlanMode&#39;, &#39;… |
| parseAgentFile | function | 64 | yes | export function parseAgentFile(text, fileName = &#39;&#39;) { |
| src | const | 65 | no | const src = String(text ?? &#39;&#39;); |
| eol | const | 66 | no | const eol = src.includes(&#39;\\r\\n&#39;) ? &#39;\\r\\n&#39; : &#39;\\n&#39;; |
| lines | const | 67 | no | const lines = src.split(/\\r?\\n/); |
| hasFrontmatter | const | 68 | no | const hasFrontmatter = lines[0]?.trim() === &#39;---&#39;; |
| frontmatterClosed | const | 71 | no | const frontmatterClosed = end &gt; 0; |
| fm | const | 72 | no | const fm = frontmatterClosed ? lines.slice(1, end) : []; |
| body | const | 73 | no | const body = frontmatterClosed ? lines.slice(end + 1).join(eol) : src; |
| scalar | function | 75 | no | const scalar = (key) =&gt; { |
| line | const | 76 | no | const line = fm.find((l) =&gt; l.startsWith(`${key}:`)); |
| v | variable | 78 | no | let v = line.slice(key.length + 1).trim(); |
| list | function | 82 | no | const list = (key) =&gt; { |
| v | const | 83 | no | const v = scalar(key); |
| inner | const | 85 | no | const inner = v.startsWith(&#39;[&#39;) &amp;&amp; v.endsWith(&#39;]&#39;) ? v.slice(1, -1) : v; |
| maxTurnsRaw | const | 88 | no | const maxTurnsRaw = scalar(&#39;maxTurns&#39;); |
| auditAgentDefs | function | 111 | yes | export function auditAgentDefs(files, opts = {}) { |
| registered | const | 112 | no | const registered = new Set(opts.registeredAgentTypes \|\| []); |
| agents | const | 113 | no | const agents = []; |
| defects | const | 114 | no | const defects = []; |
| add | function | 115 | no | const add = (kind, severity, agent, detail, evidence) =&gt; defects.push({ kind, severity, agent, detail, evidence }); |
| a | const | 118 | no | const a = parseAgentFile(f.text, f.file); |
| entry | const | 119 | no | const entry = { file: f.file, name: a.name, model: a.model, thoughtLevel: a.thoughtLevel, tools: a.tools, skills: a.skills, requiredMcpServers: a.requiredMcpServers, hasFrontmatter: a.hasFrontmatter … |
| missing | const | 127 | no | const missing = a.tools.filter((t) =&gt; NONEXISTENT_TOOLS.includes(t)); |
| level | const | 137 | no | const level = String(a.thoughtLevel ?? &#39;&#39;).toLowerCase(); |
| auditAgentConflicts | function | 169 | yes | export function auditAgentConflicts(files) { |
| bySkill | const | 170 | no | const bySkill = new Map(); |
| a | const | 172 | no | const a = parseAgentFile(f.text, f.file); |
| conflicts | const | 185 | no | const conflicts = []; |
| precedence | const | 186 | no | const precedence = []; |
| signatures | const | 190 | no | const signatures = new Map(); |
| sig | const | 192 | no | const sig = `${String(a.model ?? &#39;inherit&#39;)}::${String(a.thoughtLevel ?? &#39;-&#39;)}`; |
| ranked | const | 205 | no | const ranked = [...agents].sort((a, b) =&gt; { const score = (x) =&gt; { const hasModel = Boolean(x.model); const level = String(x.thoughtLevel ?? &#39;&#39;).toLowerCase(); const launchable = !level \|\| LAUNCHABLE… |
| score | function | 206 | no | const score = (x) =&gt; { |
| hasModel | const | 207 | no | const hasModel = Boolean(x.model); |
| level | const | 208 | no | const level = String(x.thoughtLevel ?? &#39;&#39;).toLowerCase(); |
| launchable | const | 209 | no | const launchable = !level \|\| LAUNCHABLE_THOUGHT_LEVELS.includes(level); |
| winner | const | 214 | no | const winner = ranked[0]; |
| shadowed | const | 215 | no | const shadowed = ranked.slice(1).map((a) =&gt; a.name); |
| reason | const | 216 | no | const reason = winner.model |
| collectAgentFiles | function | 237 | yes | export function collectAgentFiles(agentsDir) { |
| parseTaskCounts | function | 250 | yes | export function parseTaskCounts(text) { |
| line | const | 251 | no | const line = String(text ?? &#39;&#39;).split(/\\r?\\n/).find((l) =&gt; l.includes(&#39;**Counts:**&#39;)) \|\| &#39;&#39;; |
| num | function | 252 | no | const num = (re) =&gt; { |
| m | const | 253 | no | const m = line.match(re); |
| readLiveSessions | function | 273 | yes | export function readLiveSessions(dbPath, opts = {}) { |
| out | const | 274 | no | const out = new Map(); |
| now | const | 276 | no | const now = opts.now ?? Date.now(); |
| windowMs | const | 277 | no | const windowMs = (opts.liveWindowMinutes ?? 30) * 60 * 1000; |
| db | variable | 278 | no | let db; |
| rows | const | 281 | no | const rows = db.query(&#39;SELECT id, title, directory, time_updated FROM session WHERE time_updated &gt; ? AND time_deleted IS NULL ORDER BY time_updated DESC LIMIT 200&#39;).all(now - windowMs); |
| messages | variable | 283 | no | let messages = 0; |
| readProviderHealth | function | 302 | yes | export function readProviderHealth(dbPath, opts = {}) { |
| now | const | 303 | no | const now = opts.now ?? Date.now(); |
| windowMs | const | 304 | no | const windowMs = opts.windowMs ?? 5 * 60 * 60 * 1000; |
| rows | variable | 305 | no | let rows = []; |
| db | variable | 306 | no | let db; |
| stats | const | 315 | no | const stats = summarizeUsage(rows, { now, windowMs }); |
| health | const | 316 | no | const health = new Map(); |
| buildTeamSnapshot | function | 327 | yes | export function buildTeamSnapshot(opts = {}) { |
| agentsDir | const | 328 | no | const agentsDir = opts.agentsDir ?? DEFAULT_AGENTS_DIR; |
| channelRoot | const | 329 | no | const channelRoot = opts.channelRoot ?? DEFAULT_CHANNEL_ROOT; |
| sessionDb | const | 330 | no | const sessionDb = opts.sessionDb ?? DEFAULT_SESSION_DB; |
| now | const | 331 | no | const now = opts.now ?? Date.now(); |
| files | const | 333 | no | const files = collectAgentFiles(agentsDir); |
| registered | const | 334 | no | const registered = opts.registeredAgentTypes \|\| []; |
| seats | variable | 340 | no | let seats = []; |
| doc | const | 342 | no | const doc = loadSeats(channelRoot); |
| live | const | 352 | no | const live = opts.liveSessions instanceof Map ? opts.liveSessions : readLiveSessions(sessionDb, { now, liveWindowMinutes: opts.liveWindowMinutes ?? 30 }); |
| liveReadable | const | 355 | no | const liveReadable = opts.liveSessions instanceof Map \|\| existsSync(sessionDb); |
| s | const | 360 | no | const s = seat.session ? live.get(seat.session) : null; |
| tasksFile | const | 368 | no | const tasksFile = opts.tasksFile ?? join(channelRoot, &#39;tasks&#39;, &#39;active-tasks.md&#39;); |
| tasks | const | 369 | no | const tasks = opts.taskCounts ?? parseTaskCounts(existsSync(tasksFile) ? readFileSync(tasksFile, &#39;utf8&#39;) : &#39;&#39;); |
| health | const | 374 | no | const health = opts.providerHealth instanceof Map ? opts.providerHealth : readProviderHealth(sessionDb, { now }); |
| nextMoves | const | 376 | no | const nextMoves = []; |
| renderPanel | function | 414 | yes | export function renderPanel(snapshot, opts = {}) { |
| s | const | 415 | no | const s = snapshot \|\| {}; |
| L | const | 416 | no | const L = []; |
| agents | const | 417 | no | const agents = s.agents \|\| []; |
| seats | const | 418 | no | const seats = s.seats \|\| []; |
| defects | const | 419 | no | const defects = s.defects \|\| []; |
| moves | const | 420 | no | const moves = s.nextMoves \|\| []; |
| health | const | 421 | no | const health = s.providerHealth \|\| new Map(); |
| bits | const | 429 | no | const bits = [` ${String(a.name \|\| a.file).padEnd(24)}`, `model=${a.model \|\| &#39;inherit&#39;}`, `think=${a.thoughtLevel \|\| &#39;-&#39;}`]; |
| t | const | 444 | no | const t = s.tasks \|\| {}; |
| renderHookSummary | function | 480 | yes | export function renderHookSummary(snapshot) { |
| s | const | 481 | no | const s = snapshot \|\| {}; |
| seats | const | 482 | no | const seats = (s.seats \|\| []).map((x) =&gt; `${x.id}:${x.state}${x.ageMinutes !== null &amp;&amp; x.ageMinutes !== undefined ? `/${x.ageMinutes}m` : &#39;&#39;}`).join(&#39; &#39;); |
| defects | const | 483 | no | const defects = (s.defects \|\| []).length; |
| unusableModels | const | 487 | no | const unusableModels = [...(s.providerHealth \|\| new Map()).entries()] |
| t | const | 490 | no | const t = s.tasks \|\| {}; |
| lines | const | 491 | no | const lines = [ |
| writeStateCache | function | 510 | yes | export function writeStateCache(snapshot, outPath) { |
| payload | const | 512 | no | const payload = { generatedAt: snapshot.generatedAt, summary: renderHookSummary(snapshot) }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 13 | external |
| node:path | import | 14 | external |
| node:module | import | 15 | external |
| ./channel-seats.mjs | import | 16 | [hq/lib/channel-seats.mjs](./channel-seats.mjs.md) |
| ./model-router.mjs | import | 17 | [hq/lib/model-router.mjs](./model-router.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-070-agent-instruction-conflicts.mjs](../aii/fixtures/HQ-070-agent-instruction-conflicts.mjs.md) | ../../lib/team-panel.mjs |
| [hq/aii/fixtures/HQ-070-agent-instruction-conflicts.mjs](../aii/fixtures/HQ-070-agent-instruction-conflicts.mjs.md) | ../../lib/team-panel.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/team-panel.mjs |
| [hq/bin/revive.mjs](../bin/revive.mjs.md) | ../lib/team-panel.mjs |
| [hq/lib/canvas.mjs](./canvas.mjs.md) | ./team-panel.mjs |
| [hq/lib/mcp-team-tools.mjs](./mcp-team-tools.mjs.md) | ./team-panel.mjs |
| [hq/lib/session-parts.mjs](./session-parts.mjs.md) | ./team-panel.mjs |
| [hq/lib/team-automation.mjs](./team-automation.mjs.md) | ./team-panel.mjs |
| [hq/lib/team-dashboard.mjs](./team-dashboard.mjs.md) | ./team-panel.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | One panel over the whole agent team: definitions, seats, live sessions, tasks, provider health and next moves. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | team-control |
| 5 | invariant | — | — | read-only; it never wakes a seat, never sends, never edits an agent definition. |
| 6 | see | — | docs/AGENT-BUS.md | docs/AGENT-BUS.md |
| 38 | why | — | — | this list and not `max`. Measured 2026-11-05: every named-agent spawn failed with |
| 141 | why | — | — | this rule used to demand `max` and that is what broke the roster on 2026-11-05. |

## Excerpt

```javascript
/**
 * @hq:context One panel over the whole agent team: definitions, seats, live sessions, tasks, provider health and next moves.
 * @hq:owner hq-agent
 * @hq:task team-control
 * @hq:invariant read-only; it never wakes a seat, never sends, never edits an agent definition.
 * @hq:see docs/AGENT-BUS.md
 *
 * `hq comms` is the transport roof and costs about five seconds, because it probes the channels
 * that decide whether a message can travel. This panel is the management roof: it answers "who is
 * on the team, what is running, what is stuck and what should I do next" in well under a second,
 * because those questions never need the transport probes.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { loadSeats, roster } from './channel-seats.mjs';
import { classifyHealth, summarizeUsage } from './model-router.mjs';

// bun:sqlite is loaded through createRequire so this module still loads under Node, where the
// session database is simply unreachable and the panel degrades to the definition-level view.
const nodeRequire = createRequire(import.meta.url);
function openDatabase(path) {
  return new (nodeRequire('bun:sqlite').Database)(path, { readonly: true });
}

export const DEFAULT_AGENTS_DIR = join(process.env.USERPROFILE || process.env.HOME || '', '.zcode', 'agents');
export const DEFAULT_CHANNEL_ROOT = 'C:/VIVIM/channel';
export const DEFAULT_SESSION_DB = join(process.env.USERPROFILE || process.env.HOME || '', '.zcode', 'cli', 'db', 'db.sqlite');

/** Tools this ZCode build does not expose; a grant naming one makes the agent crash on use. */
export const NONEXISTENT_TOOLS = ['Glob', 'Grep'];
/** MCP tools every agent must be able to reach — Context7 is the top of the memory stack. */
export const CONTEXT7_TOOLS = ['mcp__context7__resolve-library-id', 'mcp__context7__query-docs'];
export const PROTOCOL_SKILL = 'team-protocol';
/**
 * Reasoning levels a provider on this machine will actually start a session with.
 *
 * @hq:why this list and not `max`. Measured 2026-11-05: every named-agent spawn failed with
 *   `reasoning-level-not-supported` on a roster pinned to `max`, while the same providers
 *   answered at low/medium/high. The panel used to flag anything that was NOT `max` as
 *   unlaunchable, so the auditor taught the roster to carry the one unusable level.
 */
export const LAUNCHABLE_THOUGHT_LEVELS = Object.freeze(['low', 'medium', 'high']);
/** The tools this build exposes to a subagent. Anything outside this set fails at call time. */
export const KNOWN_TOOLS = Object.freeze([
  'Read', 'Write', 'Edit', 'Bash', 'TodoWrite', 'TodoRead', 'WebFetch', 'Skill',
  'Agent', 'SendMessage', 'AskUserQuestion', 'EnterPlanMode', 'ExitPlanMode',
  'CronCreate', 'CronList', 'CronUpdate', 'CronDelete', 'TaskOutput', 'TaskStop',
  'ReadSessionContext', 'ListModels', 'ListSavedWorkflows', 'ListWorkflowRuns',
  'GetWorkflowRun', 'ResumeWorkflowRun', 'AmendWorkflow', 'CreateWorkflow', 'SaveWorkflow',
  'FillWorkflowHole', 'EvalWorkflowSnippet', 'ResolveWorkflowQuestion',
  'mcp__context7__resolve-library-id', 'mcp__context7__query-docs',
]);

/**
 * Parse one agent definition file.
 *
 * @param {string} text
 * @param {string} [fileName]
 * @returns {{name: string|null, description: string, model: string|null, thoughtLevel: string|null,
 *            maxTurns: number|null, tools: string[]|null, skills: string[], requiredMcpServers: string[],
 *            hasFrontmatter: boolean, body: string}}
 */
export function parseAgentFile(text, fileName = '') {
  const src = String(text ?? '');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const lines = src.split(/\r?\n/);
  const hasFrontmatter = lines[0]?.trim() === '---';
  const end = hasFrontmatter ? lines.findIndex((l, i) => i > 0 && l.trim() === '---') : -1;
  // An unterminated block is not frontmatter: the body never becomes a system prompt.
  const frontmatterClosed = end > 0;
  const fm = frontmatterClosed ? lines.slice(1, end) : [];
  const body = frontmatterClosed ? lines.slice(end + 1).join(eol) : src;

  const scalar = (key) => {
    const line = fm.find((l) => l.startsWith(`${key}:`));
    if (!line) return null;
    let v = line.slice(key.length + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v;
```

_First 80 of 516 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
