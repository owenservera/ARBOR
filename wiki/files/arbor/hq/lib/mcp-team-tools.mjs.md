# File: hq/lib/mcp-team-tools.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/mcp-team-tools.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 29311 B |
| Lines | 691 |
| Hash | a63a4d6abdf9 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| nodeRequire | const | 30 | no | const nodeRequire = createRequire(import.meta.url); |
| SECTION_KEYS | const | 33 | yes | export const SECTION_KEYS = Object.freeze([&#39;agents&#39;, &#39;seats&#39;, &#39;sessions&#39;, &#39;tasks&#39;, &#39;providers&#39;, &#39;defects&#39;, &#39;moves&#39;]); |
| SECTION_HEADERS | const | 36 | no | const SECTION_HEADERS = Object.freeze({ agents: /^AGENTS\\b/, seats: /^SEATS\\b/, sessions: /^SESSIONS\\b/, tasks: /^TASKS\\b/, |
| SECTION_PLACEHOLDERS | const | 47 | no | const SECTION_PLACEHOLDERS = Object.freeze({ agents: &#39;AGENTS (0)\\n (none found)&#39;, seats: &#39;SEATS (0)\\n (none registered)&#39;, sessions: &#39;SESSIONS (0)\\n (none live)&#39;, tasks: &#39;TASKS sessions=? open=? block… |
| WAKE_PROOF_RULE | const | 58 | yes | export const WAKE_PROOF_RULE = |
| TEAM_TOOLS | const | 67 | yes | export const TEAM_TOOLS = Object.freeze([ Object.freeze({ name: &#39;team_state&#39;, description: &#39;Read the whole agent team in one call: agent definitions, channel seats and whether each is IDLE or ACTIVE,… |
| TEAM_TOOL_NAMES | const | 158 | yes | export const TEAM_TOOL_NAMES = Object.freeze(TEAM_TOOLS.map((t) =&gt; t.name)); |
| renderToolError | function | 169 | yes | export function renderToolError(toolName, message) { |
| text | const | 170 | no | const text = String(message ?? &#39;&#39;).trim() \|\| &#39;unknown error&#39;; |
| validateToolArgs | function | 184 | yes | export function validateToolArgs(tool, args) { |
| schema | const | 185 | no | const schema = tool?.inputSchema \|\| {}; |
| props | const | 186 | no | const props = schema.properties \|\| {}; |
| required | const | 187 | no | const required = Array.isArray(schema.required) ? schema.required : []; |
| name | const | 188 | no | const name = tool?.name \|\| &#39;unknown&#39;; |
| given | const | 193 | no | const given = args \|\| {}; |
| unknown | const | 195 | no | const unknown = Object.keys(given).filter((k) =&gt; !Object.prototype.hasOwnProperty.call(props, k)); |
| value | const | 203 | no | const value = {}; |
| raw | const | 205 | no | const raw = given[key]; |
| problem | const | 213 | no | const problem = checkValue(key, raw, spec, name); |
| checkValue | function | 227 | no | function checkValue(key, raw, spec, name) { |
| label | const | 228 | no | const label = `parameter &quot;${key}&quot; of ${name}`; |
| itemEnum | const | 238 | no | const itemEnum = spec?.items?.enum; |
| describeType | function | 252 | no | function describeType(value) { |
| renderTeamState | function | 267 | yes | export function renderTeamState(snapshot, opts = {}) { |
| rendered | const | 269 | no | const rendered = renderPanel(snapshot \|\| {}, { verbose: !!opts.verbose }); |
| panel | const | 270 | no | const panel = Array.isArray(rendered) ? rendered.join(&#39;\\n&#39;) : String(rendered ?? &#39;&#39;); |
| blocks | const | 271 | no | const blocks = splitPanelBlocks(panel); |
| bySection | const | 272 | no | const bySection = new Map(); |
| header | variable | 273 | no | let header = &#39;&#39;; |
| wanted | const | 279 | no | const wanted = Array.isArray(opts.sections) &amp;&amp; opts.sections.length |
| out | const | 283 | no | const out = [header \|\| &#39;TEAM generated unknown&#39;, &#39;&#39;]; |
| text | variable | 285 | no | let text = bySection.get(key); |
| splitPanelBlocks | function | 298 | no | function splitPanelBlocks(panel) { |
| blocks | const | 299 | no | const blocks = []; |
| current | variable | 300 | no | let current = null; |
| key | const | 303 | no | const key = sectionKeyOf(line); |
| sectionKeyOf | function | 319 | no | function sectionKeyOf(line) { |
| renderSessionsBlock | function | 330 | no | function renderSessionsBlock(snapshot, now) { |
| live | const | 331 | no | const live = snapshot?.liveSessions; |
| entries | const | 332 | no | const entries = live instanceof Map |
| at | const | 335 | no | const at = Number(now) \|\| Date.now(); |
| lines | const | 336 | no | const lines = [`SESSIONS (${entries.length})`]; |
| sorted | const | 338 | no | const sorted = [...entries].sort((a, b) =&gt; (Number(b?.updated) \|\| 0) - (Number(a?.updated) \|\| 0)); |
| updated | const | 340 | no | const updated = Number(s?.updated) \|\| 0; |
| age | const | 341 | no | const age = updated ? `${Math.max(0, Math.round((at - updated) / 60000))}m` : &#39;-&#39;; |
| messages | const | 342 | no | const messages = Number(s?.messages) \|\| 0; |
| renderRoutePlan | function | 355 | yes | export function renderRoutePlan(plan, opts = {}) { |
| routes | const | 356 | no | const routes = Array.isArray(plan?.routes) ? plan.routes : []; |
| skipped | const | 357 | no | const skipped = Array.isArray(plan?.skipped) ? plan.skipped : []; |
| applied | const | 358 | no | const applied = Array.isArray(plan?.applied) ? plan.applied : []; |
| hours | const | 359 | no | const hours = Number(opts.hours) \|\| 5; |
| groups | const | 361 | no | const groups = new Map(); |
| g | const | 363 | no | const g = groups.get(r.to) \|\| { to: r.to, reason: r.reason, agents: [], from: new Set(), saving: 0 }; |
| lines | const | 370 | no | const lines = []; |
| beat | const | 377 | no | const beat = String(g.reason \|\| &#39;&#39;).match(/rejected cheaper option (.*)$/); |
| skipReasons | const | 390 | no | const skipReasons = new Map(); |
| list | const | 392 | no | const list = skipReasons.get(s.reason) \|\| []; |
| renderWakeResult | function | 423 | yes | export function renderWakeResult(out, opts = {}) { |
| decision | const | 424 | no | const decision = out?.decision \|\| &#39;UNKNOWN&#39;; |
| code | const | 425 | no | const code = out?.code \|\| &#39;UNKNOWN&#39;; |
| lines | const | 426 | no | const lines = []; |
| age | const | 429 | no | const age = out.ageMinutes === null \|\| out.ageMinutes === undefined ? &#39;&#39; : ` · ${out.ageMinutes}m`; |
| reply | const | 441 | no | const reply = out?.answer?.reply \|\| out?.reply \|\| null; |
| handleTeamState | function | 459 | no | async function handleTeamState(args, deps) { |
| snapshot | const | 460 | no | const snapshot = await deps.buildSnapshot({ now: deps.now() }); |
| handleRouteModel | function | 467 | no | async function handleRouteModel(args, deps) { |
| apply | const | 468 | no | const apply = args.apply === true; |
| hours | const | 469 | no | const hours = Number(args.hours) \|\| 5; |
| plan | const | 470 | no | const plan = await deps.planRoutes({ agent: args.agent, hours, apply, now: deps.now() }); |
| handleWakeSeat | function | 474 | no | async function handleWakeSeat(args, deps) { |
| seat | const | 475 | no | const seat = String(args.seat).trim(); |
| prompt | const | 476 | no | const prompt = String(args.prompt); |
| force | const | 477 | no | const force = args.force === true; |
| wait | const | 478 | no | const wait = Number(args.wait) \|\| 200; |
| state | const | 480 | no | const state = await seatState(seat, deps); |
| out | const | 488 | no | const out = await deps.wakeSeat({ seat, prompt, wait, force, now: deps.now() }); |
| decision | const | 489 | no | const decision = out?.decision \|\| &#39;UNKNOWN&#39;; |
| detail | const | 491 | no | const detail = out?.detail \|\| &#39;the transport did not accept the prompt&#39;; |
| how | const | 492 | no | const how = out?.code === &#39;SEAT_ACTIVE&#39; |
| seatState | function | 506 | no | async function seatState(seat, deps) { |
| snapshot | const | 508 | no | const snapshot = await deps.buildSnapshot({ now: deps.now() }); |
| seats | const | 509 | no | const seats = Array.isArray(snapshot?.seats) ? snapshot.seats : []; |
| found | const | 510 | no | const found = seats.find((s) =&gt; String(s?.id ?? &#39;&#39;).toLowerCase() === seat.toLowerCase()); |
| HANDLERS | const | 519 | no | const HANDLERS = { |
| callTeamTool | function | 533 | yes | export async function callTeamTool(name, args = {}, deps = {}) { |
| tool | const | 534 | no | const tool = TEAM_TOOLS.find((t) =&gt; t.name === name); |
| resolved | const | 538 | no | const resolved = { ...defaultTeamDeps(), ...(deps \|\| {}) }; |
| check | const | 539 | no | const check = validateToolArgs(tool, args); |
| out | const | 542 | no | const out = await HANDLERS[tool.name](check.value, resolved); |
| defaultTeamDeps | function | 557 | yes | export function defaultTeamDeps() { |
| deps | const | 558 | no | const deps = { |
| homeDir | function | 570 | no | function homeDir() { |
| defaultPlanRoutes | function | 579 | no | async function defaultPlanRoutes(input, deps) { |
| now | const | 580 | no | const now = Number(input?.now) \|\| deps.now(); |
| hours | const | 581 | no | const hours = Number(input?.hours) &gt; 0 ? Number(input.hours) : 5; |
| windowMs | const | 582 | no | const windowMs = hours * 60 * 60 * 1000; |
| usageRows | const | 584 | no | const usageRows = readUsageRows({ now, windowMs }); |
| stats | const | 585 | no | const stats = summarizeUsage(usageRows, { now, windowMs }); |
| depotCatalog | const | 587 | no | const depotCatalog = readJsonMaybe(deps.readFile, join(homeDir(), &#39;.zcode&#39;, &#39;provider-depot&#39;, &#39;catalog.json&#39;)); |
| catalog | const | 588 | no | const catalog = buildCatalog({ depotCatalog, observed: [...stats.keys()] }); |
| agentsDir | const | 590 | no | const agentsDir = join(homeDir(), &#39;.zcode&#39;, &#39;agents&#39;); |
| agents | const | 591 | no | const agents = collectAgentFiles(agentsDir).map((f) =&gt; { const a = parseAgentFile(f.text, f.file); return { name: a.name \|\| f.file.replace(/\\.md$/, &#39;&#39;), model: a.model \|\| &#39;inherit&#39;, file: f.file, pat… |
| a | const | 592 | no | const a = parseAgentFile(f.text, f.file); |
| wanted | const | 596 | no | const wanted = input?.agent ? String(input.agent).trim().toLowerCase() : &#39;&#39;; |
| selected | const | 597 | no | const selected = wanted |
| policy | const | 604 | no | const policy = { ...DEFAULT_POLICY, windowMs }; |
| plan | const | 605 | no | const plan = modelPlanRoutes({ agents: selected, usage: usageRows, catalog: Object.fromEntries(catalog), policy, now }); |
| applied | const | 607 | no | const applied = []; |
| stamp | const | 609 | no | const stamp = new Date(now).toISOString().replace(/[:.]/g, &#39;-&#39;); |
| agent | const | 611 | no | const agent = selected.find((a) =&gt; a.name === route.agent); |
| before | variable | 613 | no | let before = &#39;&#39;; |
| backup | const | 615 | no | const backup = `${agent.path}.bak-route-${stamp}`; |
| after | const | 617 | no | const after = before.replace(/^model:\\s*.*$/m, `model: ${route.to}`); |
| readJsonMaybe | function | 626 | no | function readJsonMaybe(readFile, path) { |
| readUsageRows | function | 630 | no | function readUsageRows({ now, windowMs }) { |
| db | const | 633 | no | const db = new Database(join(homeDir(), &#39;.zcode&#39;, &#39;cli&#39;, &#39;db&#39;, &#39;db.sqlite&#39;), { readonly: true }); |
| defaultWakeSeat | function | 648 | no | async function defaultWakeSeat(input, deps) { |
| root | const | 649 | no | const root = input?.root \|\| DEFAULT_CHANNEL_ROOT; |
| waitSec | const | 650 | no | const waitSec = Math.max(10, Number(input?.wait) \|\| 200); |
| live | variable | 651 | no | let live = new Map(); |
| resumeSession | variable | 652 | no | let resumeSession = null; |
| transport | const | 654 | no | const transport = await import(&#39;./channel-transport.mjs&#39;); |
| out | const | 661 | no | const out = wakeSeatChannel({ root, seatId: input?.seat, prompt: input?.prompt, reason: input?.reason ?? null, |
| doc | const | 676 | no | const doc = loadSeats(root); |
| table | const | 677 | no | const table = renderSeatTable(doc, (sid) =&gt; live.get(sid) ?? null, { idleMinutes: DEFAULT_IDLE_MINUTES }); |
| transport | const | 685 | no | const transport = await import(&#39;./channel-transport.mjs&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 19 | external |
| node:path | import | 20 | external |
| node:module | import | 21 | external |
| ./team-panel.mjs | import | 22 | [hq/lib/team-panel.mjs](./team-panel.mjs.md) |
| ./model-router.mjs | import | 23 | [hq/lib/model-router.mjs](./model-router.mjs.md) |
| ./channel-seats.mjs | import | 24 | [hq/lib/channel-seats.mjs](./channel-seats.mjs.md) |
| ./channel-transport.mjs | dynamic | 654 | [hq/lib/channel-transport.mjs](./channel-transport.mjs.md) |
| ./channel-transport.mjs | dynamic | 685 | [hq/lib/channel-transport.mjs](./channel-transport.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./mcp-team-tools.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | MCP tools that let one chat read and steer the whole agent team. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | team-control |
| 5 | invariant | — | — | team_state and route_model never mutate; wake_seat starts one local turn and nothing else. |
| 6 | see | — | docs/AGENT-BUS.md | docs/AGENT-BUS.md |
| 7 | see | — | hq/lib/team-panel.mjs | hq/lib/team-panel.mjs |
| 8 | see | — | hq/lib/model-router.mjs | hq/lib/model-router.mjs |
| 9 | see | — | hq/lib/channel-seats.mjs | hq/lib/channel-seats.mjs |

## Excerpt

```javascript
/**
 * @hq:context MCP tools that let one chat read and steer the whole agent team.
 * @hq:owner hq-agent
 * @hq:task team-control
 * @hq:invariant team_state and route_model never mutate; wake_seat starts one local turn and nothing else.
 * @hq:see docs/AGENT-BUS.md
 * @hq:see hq/lib/team-panel.mjs
 * @hq:see hq/lib/model-router.mjs
 * @hq:see hq/lib/channel-seats.mjs
 *
 * Three tools, deliberately narrow. `team_state` is the panel (who is on the team, what is
 * running, what is stuck). `route_model` is the budget-aware routing proposal, and it writes
 * nothing unless the caller asked for `apply: true`. `wake_seat` is the only mutating tool: it
 * starts one local seat turn and nothing else — no provider send, no agent-definition edit.
 *
 * The handlers are pure over injected dependencies so the tests never touch the real machine.
 * The defaults reach the real machine, and only the defaults.
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { buildTeamSnapshot, collectAgentFiles, parseAgentFile, renderPanel } from './team-panel.mjs';
import { buildCatalog, DEFAULT_POLICY, planRoutes as modelPlanRoutes, summarizeUsage } from './model-router.mjs';
import {
  DEFAULT_CHANNEL_ROOT, DEFAULT_IDLE_MINUTES, loadSeats, renderSeatTable, verifySeat, wakeSeat as wakeSeatChannel,
} from './channel-seats.mjs';

// bun:sqlite is loaded through createRequire so this module still loads under Node, where the
// session database is unreachable and the router degrades to "no observed usage".
const nodeRequire = createRequire(import.meta.url);

/** The panel sections a caller may ask for. */
export const SECTION_KEYS = Object.freeze(['agents', 'seats', 'sessions', 'tasks', 'providers', 'defects', 'moves']);

/** The panel block that answers each section. */
const SECTION_HEADERS = Object.freeze({
  agents: /^AGENTS\b/,
  seats: /^SEATS\b/,
  sessions: /^SESSIONS\b/,
  tasks: /^TASKS\b/,
  providers: /^PROVIDERS\b/,
  defects: /^DEFECTS\b/,
  moves: /^NEXT MOVES\b/,
});

/** What a section looks like when the panel has nothing to say about it. */
const SECTION_PLACEHOLDERS = Object.freeze({
  agents: 'AGENTS (0)\n  (none found)',
  seats: 'SEATS (0)\n  (none registered)',
  sessions: 'SESSIONS (0)\n  (none live)',
  tasks: 'TASKS  sessions=?  open=?  blocked=?  learnings=?  defects=?',
  providers: 'PROVIDERS (last 5h)\n  (none observed)',
  defects: 'DEFECTS (0)\n  (none)',
  moves: 'NEXT MOVES (0)\n  (none)',
});

/** The proof rule, in the same words everywhere it appears. */
export const WAKE_PROOF_RULE =
  'A wake is proven by the seat\'s own reply, not by an acknowledgement.';

// ------------------------------------------------------------------------------ tools ----

/**
 * The three team tools. Names are verb-noun snake_case; every parameter carries its own
 * description, because the caller reads the schema and never the source.
 */
export const TEAM_TOOLS = Object.freeze([
  Object.freeze({
    name: 'team_state',
    description:
      'Read the whole agent team in one call: agent definitions, channel seats and whether each is IDLE or ACTIVE, live sessions, open task counts, provider health over the last hours, definition defects and the next moves the panel recommends. '
      + 'Use this first whenever a chat needs to know who is on the team, what is running, or what is stuck — it is one local read and costs well under a second. '
      + 'Do not use it to start work, to wake a seat, or to change a model pin: this tool is read-only and never mutates anything. '
      + 'Pass `sections` to keep only the parts you need, or `verbose` to see every defect and move instead of the first twelve.',
    inputSchema: {
      type: 'object',
      properties: {
        verbose: {
          type: 'boolean',
          default: false,
```

_First 80 of 692 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
