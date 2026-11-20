# File: hq/lib/comms-roof.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/comms-roof.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 31389 B |
| Lines | 561 |
| Hash | 4ad27b4f9793 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOF_SCHEMA | const | 21 | yes | export const ROOF_SCHEMA = &#39;hq.comms-roof/1&#39;; |
| HOME | const | 23 | no | const HOME = process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;C:\\\\Users\\\\VIVIM.inc&#39;; |
| PLAYBOOK_TOOLKIT | const | 24 | yes | export const PLAYBOOK_TOOLKIT = join(HOME, &#39;.zcode&#39;, &#39;evolution&#39;, &#39;zcode-playbook&#39;, &#39;toolkit&#39;); |
| GLOBAL_AGENTS | const | 25 | yes | export const GLOBAL_AGENTS = join(HOME, &#39;.zcode&#39;, &#39;agents&#39;); |
| REPO_AGENTS | const | 26 | yes | export const REPO_AGENTS = join(process.cwd(), &#39;.opencode&#39;, &#39;agent&#39;); |
| probeBots | function | 29 | yes | export function probeBots(toolkit = PLAYBOOK_TOOLKIT) { |
| tool | const | 30 | no | const tool = join(toolkit, &#39;bots&#39;, &#39;bots.mjs&#39;); |
| r | const | 32 | no | const r = spawnSync(process.execPath, [tool, &#39;list&#39;], { encoding: &#39;utf8&#39;, timeout: 30000 }); |
| items | const | 34 | no | const items = String(r.stdout).split(/\\r?\\n/).map((line) =&gt; { const m = line.match(/^\\s*(\\*?)\\s*(\\S+)\\s+role:(\\S+)\\s+(\\d+)\\s+routine\\(s\\)\\s*(.*)$/); return m ? { id: m[2], role: m[3], routines: Numbe… |
| m | const | 35 | no | const m = line.match(/^\\s*(\\*?)\\s*(\\S+)\\s+role:(\\S+)\\s+(\\d+)\\s+routine\\(s\\)\\s*(.*)$/); |
| probeSeats | function | 42 | yes | export function probeSeats(channelRoot = DEFAULT_CHANNEL_ROOT) { |
| doc | const | 44 | no | const doc = loadSeats(channelRoot); |
| probeAgentDefs | function | 56 | yes | export function probeAgentDefs(dirs = [GLOBAL_AGENTS, REPO_AGENTS]) { |
| items | const | 57 | no | const items = []; |
| missing | const | 58 | no | const missing = []; |
| text | const | 62 | no | const text = readFileSync(join(dir, f), &#39;utf8&#39;); |
| model | const | 63 | no | const model = (text.match(/^model:\\s*(\\S+)/m) \|\| [])[1] ?? null; |
| level | const | 64 | no | const level = (text.match(/^thoughtLevel:\\s*(\\S+)/m) \|\| [])[1] ?? null; |
| probeThreads | function | 72 | yes | export function probeThreads(tool) { |
| r | const | 74 | no | const r = spawnSync(process.execPath, [tool, &#39;--json&#39;, &#39;list&#39;, &#39;--limit&#39;, &#39;5000&#39;], { encoding: &#39;utf8&#39;, timeout: 60000 }); |
| doc | variable | 75 | no | let doc = null; |
| live | const | 78 | no | const live = doc.sessions.filter((s) =&gt; s.type !== &#39;subagent_child&#39; &amp;&amp; s.ageMinutes &lt; 240); |
| probeChannels | function | 87 | yes | export function probeChannels({ syncRoot = process.cwd(), channelRoot = DEFAULT_CHANNEL_ROOT, toolkit = PLAYBOOK_TOOLKIT } = {}) { |
| out | const | 88 | no | const out = []; |
| ledger | const | 89 | no | const ledger = join(syncRoot, &#39;sync&#39;, &#39;ledger.jsonl&#39;); |
| lines | const | 91 | no | const lines = readFileSync(ledger, &#39;utf8&#39;).split(&#39;\\n&#39;).filter(Boolean); |
| last | const | 92 | no | const last = JSON.parse(lines[lines.length - 1] \|\| &#39;{}&#39;); |
| tool | const | 101 | no | const tool = join(syncRoot, &#39;scripts&#39;, &#39;sync.mjs&#39;); |
| r | const | 102 | no | const r = spawnSync(process.execPath, [tool, &#39;watch&#39;, &#39;--seconds&#39;, &#39;1&#39;], { encoding: &#39;utf8&#39;, timeout: 15000 }); |
| idle | const | 103 | no | const idle = r.status === 2 &amp;&amp; /IDLE/.test(String(r.stdout ?? &#39;&#39;)); |
| installed | const | 109 | no | const installed = join(HOME, &#39;.agents&#39;, &#39;skills&#39;, &#39;zcode-comms&#39;, &#39;bot-inbox.mjs&#39;); |
| inboxOk | variable | 113 | no | let inboxOk = false; |
| inboxDetail | variable | 114 | no | let inboxDetail = `no installed bot-inbox at ${installed}`; |
| r | const | 116 | no | const r = spawnSync(process.execPath, [installed, &#39;check&#39;], { encoding: &#39;utf8&#39;, timeout: 30000 }); |
| err | const | 117 | no | const err = `${r.stderr ?? &#39;&#39;}`; |
| broken | const | 118 | no | const broken = /SyntaxError\|ERR_MODULE_NOT_FOUND\|Cannot find module/.test(err); |
| dispatch | const | 126 | no | const dispatch = join(channelRoot, &#39;dispatch&#39;); |
| files | const | 128 | no | const files = readdirSync(dispatch).filter((f) =&gt; f.endsWith(&#39;.result.json&#39;)); |
| newest | const | 129 | no | const newest = files.map((f) =&gt; statSync(join(dispatch, f)).mtimeMs).sort((a, b) =&gt; b - a)[0]; |
| lib | const | 137 | no | const lib = fileURLToPath(new URL(&#39;./cnp.mjs&#39;, import.meta.url)); |
| registryFile | const | 138 | no | const registryFile = join(channelRoot, &#39;threads.json&#39;); |
| names | variable | 139 | no | let names = 0; |
| ok | const | 141 | no | const ok = existsSync(lib) &amp;&amp; names &gt; 0; |
| probeDesk | function | 155 | yes | export function probeDesk(root = &#39;C:\\\\0-BlackBoxProject-0\\\\VOMEGA&#39;) { |
| base | const | 156 | no | const base = join(root, &#39;.project&#39;, &#39;staff&#39;, &#39;DESK&#39;); |
| board | const | 157 | no | const board = join(base, &#39;status&#39;, &#39;board.jsonl&#39;); |
| rows | variable | 159 | no | let rows = []; |
| teams | const | 165 | no | const teams = [...new Set(rows.map((r) =&gt; r.team).filter(Boolean))]; |
| newest | const | 166 | no | const newest = rows.map((r) =&gt; r.ts).filter(Boolean).sort().reverse()[0] ?? null; |
| ageDays | const | 167 | no | const ageDays = newest ? Math.floor((Date.now() - Date.parse(newest)) / 86400000) : null; |
| items | const | 168 | no | const items = teams.map((team) =&gt; { let replies = 0; try { replies = readFileSync(join(base, &#39;replies&#39;, `${team}.jsonl`), &#39;utf8&#39;).split(&#39;\\n&#39;).filter(Boolean).length; } catch { /* no replies file */ }… |
| replies | variable | 169 | no | let replies = 0; |
| bindAgents | function | 189 | yes | export function bindAgents(agents, threads, declared = {}) { |
| needle | const | 192 | no | const needle = String(a.id).replace(/[.*+?^${}()\|[\\]\\\\]/g, &#39;\\\\$&amp;&#39;); |
| re | const | 193 | no | const re = new RegExp(`(^\|[^a-z0-9])${needle}([^a-z0-9]\|$)`, &#39;i&#39;); |
| hits | const | 194 | no | const hits = (threads ?? []).filter((t) =&gt; re.test(String(t.title ?? &#39;&#39;))); |
| bindingSummary | function | 204 | yes | export function bindingSummary(agents) { |
| out | const | 205 | no | const out = { declared: 0, inferred: 0, unbound: 0 }; |
| DEFAULT_INBOX_ROOTS | const | 210 | yes | export const DEFAULT_INBOX_ROOTS = [ |
| probeInboxes | function | 224 | yes | export function probeInboxes(roots = DEFAULT_INBOX_ROOTS) { |
| items | const | 225 | no | const items = []; |
| threads | const | 226 | no | const threads = []; |
| groups | const | 227 | no | const groups = []; |
| dir | const | 229 | no | const dir = join(root, &#39;.zcode&#39;, &#39;bots&#39;, &#39;inbox&#39;); |
| project | const | 231 | no | const project = root.replace(/[\\\\/]+$/, &#39;&#39;).split(/[\\\\/]/).pop() \|\| root; |
| gfile | const | 232 | no | const gfile = join(root, &#39;.zcode&#39;, &#39;bots&#39;, &#39;groups.json&#39;); |
| doc | const | 235 | no | const doc = JSON.parse(readFileSync(gfile, &#39;utf8&#39;)); |
| LEDGERS | const | 241 | no | const LEDGERS = new Set([&#39;delivered&#39;, &#39;receipts&#39;]); |
| bot | const | 243 | no | const bot = f.replace(/\\.jsonl$/, &#39;&#39;); |
| rows | variable | 244 | no | let rows = []; |
| newest | const | 251 | no | const newest = rows.map((r) =&gt; r.ts).filter(Boolean).sort().reverse()[0] ?? null; |
| recent7d | const | 252 | no | const recent7d = rows.filter((r) =&gt; r.ts &amp;&amp; Date.now() - Date.parse(r.ts) &lt; 7 * 86400000).length; |
| perThread | const | 254 | no | const perThread = new Map(); |
| t | const | 256 | no | const t = r.thread \|\| &#39;(no thread)&#39;; |
| cur | const | 257 | no | const cur = perThread.get(t) ?? { messages: 0, newest: null }; |
| projects | const | 265 | no | const projects = new Set(items.map((i) =&gt; i.project)); |
| probeCommsBus | function | 279 | yes | export function probeCommsBus(commsRoot = join(HOME, &#39;.zcode&#39;, &#39;comms&#39;)) { |
| busFile | const | 280 | no | const busFile = join(commsRoot, &#39;bus.jsonl&#39;); |
| notices | variable | 282 | no | let notices = []; |
| lines | function | 288 | no | const lines = (f) =&gt; { try { return readFileSync(join(commsRoot, f), &#39;utf8&#39;).split(&#39;\\n&#39;).filter(Boolean).length; } catch { return 0; } }; |
| projects | variable | 289 | no | let projects = []; |
| newest | const | 291 | no | const newest = notices.map((n) =&gt; n.ts).filter(Boolean).sort().reverse()[0] ?? null; |
| anetBin | function | 301 | yes | export function anetBin() { |
| installed | const | 303 | no | const installed = join(process.env.LOCALAPPDATA \|\| join(HOME, &#39;AppData&#39;, &#39;Local&#39;), &#39;Programs&#39;, &#39;anet&#39;, &#39;anet.exe&#39;); |
| parseAnetStatus | function | 308 | yes | export function parseAnetStatus(stdout) { |
| doc | variable | 309 | no | let doc = null; |
| aid | const | 312 | no | const aid = doc.identity.aid; |
| name | const | 313 | no | const name = doc.identity.name ?? &#39;default&#39;; |
| hub | const | 314 | no | const hub = doc.hub?.state ?? doc.hub?.url ?? &#39;unknown&#39;; |
| inbound | const | 315 | no | const inbound = typeof doc.inbound_policy === &#39;string&#39; |
| autoReply | const | 318 | no | const autoReply = doc.auto_reply?.backend ? `${doc.auto_reply.backend}/${doc.auto_reply.agent}` : &#39;off&#39;; |
| probeAnet | function | 327 | yes | export function probeAnet(bin = anetBin()) { |
| r | const | 328 | no | const r = spawnSync(bin, [&#39;status&#39;, &#39;--json&#39;], { encoding: &#39;utf8&#39;, timeout: 30000, windowsHide: true }); |
| probeChannelEvidence | function | 339 | yes | export function probeChannelEvidence(channelRoot = DEFAULT_CHANNEL_ROOT) { |
| readDir | function | 340 | no | const readDir = (name) =&gt; { |
| receiptsRaw | const | 354 | no | const receiptsRaw = readDir(&#39;receipts&#39;); |
| outcomesRaw | const | 355 | no | const outcomesRaw = readDir(&#39;outcomes&#39;); |
| decisionsRaw | const | 356 | no | const decisionsRaw = readDir(&#39;decisions&#39;); |
| outcomeByRequest | const | 360 | no | const outcomeByRequest = new Map(outcomesRaw.filter((o) =&gt; o.doc?.requestId).map((o) =&gt; [o.doc.requestId, o.doc])); |
| receipts | const | 362 | no | const receipts = receiptsRaw.map(({ file, doc }) =&gt; { if (!doc) return { id: file.replace(/\\.json$/, &#39;&#39;), unreadable: true, joinable: false }; const threadId = doc.thread?.after \|\| doc.thread?.before… |
| threadId | const | 364 | no | const threadId = doc.thread?.after \|\| doc.thread?.before \|\| null; |
| outcome | const | 365 | no | const outcome = outcomeByRequest.get(doc.requestId) ?? null; |
| threadCounts | const | 379 | no | const threadCounts = new Map(); |
| decisions | const | 381 | no | const decisions = decisionsRaw.map(({ file, doc }) =&gt; ({ id: doc?.decisionId ?? file.replace(/\\.json$/, &#39;&#39;), effect: doc?.effect ?? null, kind: doc?.kind ?? null, at: doc?.decidedAt ?? null, |
| joinable | const | 387 | no | const joinable = receipts.filter((r) =&gt; r.joinable).length; |
| distinct | const | 388 | no | const distinct = threadCounts.size; |
| PLACEHOLDER | const | 393 | no | const PLACEHOLDER = /live-tab$/i; |
| placeholderIds | const | 394 | no | const placeholderIds = new Set([...threadCounts.keys()].filter((id) =&gt; PLACEHOLDER.test(id) \|\| /^(new\|t\\d+)$/i.test(id) \|\| /-new$/i.test(id))); |
| placeholder | const | 395 | no | const placeholder = receipts.filter((r) =&gt; r.threadId &amp;&amp; placeholderIds.has(r.threadId)).length; |
| missing | const | 396 | no | const missing = receipts.filter((r) =&gt; !r.threadId).length; |
| real | const | 397 | no | const real = receipts.length - placeholder - missing; |
| registry | variable | 400 | no | let registry = null; |
| resolved | variable | 402 | no | let resolved = 0; |
| entry | const | 405 | no | const entry = r.id ? registry.get(r.id) : null; |
| unresolvable | const | 412 | no | const unresolvable = receipts.length - real - resolved; |
| topPlaceholder | const | 413 | no | const topPlaceholder = [...threadCounts.entries()].filter(([id]) =&gt; placeholderIds.has(id)).sort((a, b) =&gt; b[1] - a[1])[0] ?? null; |
| collapsed | const | 414 | no | const collapsed = receipts.length &gt; 1 &amp;&amp; distinct === 1 ? [...threadCounts.keys()][0] : null; |
| probeControl | function | 433 | yes | export function probeControl({ channelRoot = DEFAULT_CHANNEL_ROOT } = {}) { |
| dir | const | 434 | no | const dir = join(channelRoot, &#39;control&#39;); |
| read | function | 435 | no | const read = (fn, file) =&gt; { |
| approvals | const | 438 | no | const approvals = read(approvalState, join(dir, &#39;approvals.jsonl&#39;)); |
| revocations | const | 439 | no | const revocations = read(revocationView, join(dir, &#39;revocations.jsonl&#39;)); |
| tasks | const | 440 | no | const tasks = read(taskView, join(dir, &#39;tasks.jsonl&#39;)); |
| pending | const | 441 | no | const pending = approvals?.pending ?? 0; |
| revoked | const | 442 | no | const revoked = revocations?.count ?? 0; |
| open | const | 443 | no | const open = tasks?.counts?.open ?? 0; |
| errors | const | 444 | no | const errors = [approvals, revocations, tasks].filter((x) =&gt; x?.error).length; |
| buildRoof | function | 454 | yes | export function buildRoof(parts) { |
| agents | const | 455 | no | const agents = [ |
| defects | const | 463 | no | const defects = []; |
| hit | const | 467 | no | const hit = agents.find((a) =&gt; String(a.id).toLowerCase() === String(ib.bot).toLowerCase()); |
| state | const | 468 | no | const state = { project: ib.project, messages: ib.messages, recent7d: ib.recent7d, newest: ib.newest }; |
| hit | const | 478 | no | const hit = agents.find((a) =&gt; String(a.id).toLowerCase() === String(rc.actor).toLowerCase()); |
| n | const | 482 | no | const n = (parts.evidence.items ?? []).filter((r) =&gt; r.threadId === parts.evidence.collapsedThread).length; |
| ti | const | 485 | no | const ti = parts.evidence.threadIdentity; |
| total | const | 486 | no | const total = (parts.evidence.items ?? []).length; |
| unresolved | const | 489 | no | const unresolved = ti.unresolvable ?? (ti.placeholder + ti.missing); |
| channelsExtra | const | 504 | no | const channelsExtra = []; |
| deskStale | const | 514 | no | const deskStale = parts.desk?.staleDays !== null &amp;&amp; parts.desk?.staleDays !== undefined &amp;&amp; parts.desk.staleDays &gt; 1; |
| declared | const | 515 | no | const declared = {}; |
| bound | const | 517 | no | const bound = bindAgents(agents, parts.threads?.items ?? [], declared); |
| renderRoof | function | 534 | yes | export function renderRoof(roof) { |
| L | const | 535 | no | const L = []; |
| byKind | const | 537 | no | const byKind = { bot: &#39;bot&#39;, manager: &#39;manager&#39;, seat: &#39;seat&#39;, team: &#39;team (VOMEGA)&#39;, desk: &#39;registered desk&#39;, &#39;a2a-node&#39;: &#39;A2A node&#39;, &#39;inbox-bot&#39;: &#39;inbox bot&#39;, definition: &#39;definition&#39; }; |
| rows | const | 539 | no | const rows = roof.agents.filter((a) =&gt; a.kind === kind); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 11 | external |
| node:path | import | 12 | external |
| node:child_process | import | 13 | external |
| node:url | import | 14 | external |
| ./channel-seats.mjs | import | 15 | [hq/lib/channel-seats.mjs](./channel-seats.mjs.md) |
| ./cnp.mjs | import | 16 | [hq/lib/cnp.mjs](./cnp.mjs.md) |
| ./approvals.mjs | import | 17 | [hq/lib/approvals.mjs](./approvals.mjs.md) |
| ./revocations.mjs | import | 18 | [hq/lib/revocations.mjs](./revocations.mjs.md) |
| ./task-lifecycle.mjs | import | 19 | [hq/lib/task-lifecycle.mjs](./task-lifecycle.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/comms-roof.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | One roof over every comms and agent-state source: the playbook bot roster, channel seats, |
| 5 | owner | channel-manager | — | channel-manager |
| 6 | task | — | — | comms-roof |
| 7 | invariant | — | — | read-only: every probe is a spawn of an existing tool or a file read; nothing here writes |
| 8 | invariant | — | — | a missing or broken source is reported as a defect, never thrown and never silently dropped |
| 9 | see | — | doc:docs/AGENT-BUS.md | doc:docs/AGENT-BUS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context One roof over every comms and agent-state source: the playbook bot roster, channel seats,
 *   agent definitions, live ZCode sessions, the sync bus, the bot inbox, the wake journal and anet.
 * @hq:owner channel-manager
 * @hq:task comms-roof
 * @hq:invariant read-only: every probe is a spawn of an existing tool or a file read; nothing here writes
 * @hq:invariant a missing or broken source is reported as a defect, never thrown and never silently dropped
 * @hq:see doc:docs/AGENT-BUS.md
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadSeats, roster, DEFAULT_CHANNEL_ROOT } from './channel-seats.mjs';
import { Registry } from './cnp.mjs';
import { state as approvalState } from './approvals.mjs';
import { view as revocationView } from './revocations.mjs';
import { view as taskView } from './task-lifecycle.mjs';

export const ROOF_SCHEMA = 'hq.comms-roof/1';

const HOME = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\VIVIM.inc';
export const PLAYBOOK_TOOLKIT = join(HOME, '.zcode', 'evolution', 'zcode-playbook', 'toolkit');
export const GLOBAL_AGENTS = join(HOME, '.zcode', 'agents');
export const REPO_AGENTS = join(process.cwd(), '.opencode', 'agent');

/** The bot roster: the registered, named, bootstrapped agents. Text output parsed, schema reported. */
export function probeBots(toolkit = PLAYBOOK_TOOLKIT) {
  const tool = join(toolkit, 'bots', 'bots.mjs');
  if (!existsSync(tool)) return { source: 'bots', ok: false, items: [], detail: `no bots.mjs at ${tool}` };
  const r = spawnSync(process.execPath, [tool, 'list'], { encoding: 'utf8', timeout: 30000 });
  if (r.status !== 0) return { source: 'bots', ok: false, items: [], detail: (r.stderr || 'bots.mjs list failed').trim().split(/\r?\n/).pop() };
  const items = String(r.stdout).split(/\r?\n/).map((line) => {
    const m = line.match(/^\s*(\*?)\s*(\S+)\s+role:(\S+)\s+(\d+)\s+routine\(s\)\s*(.*)$/);
    return m ? { id: m[2], role: m[3], routines: Number(m[4]), chief: m[1] === '*', note: m[5].trim() } : null;
  }).filter(Boolean);
  return { source: 'bots', ok: items.length > 0, items, detail: `${items.length} registered bot(s)` };
}

/** The channel seats, with their session ids and write scope. */
export function probeSeats(channelRoot = DEFAULT_CHANNEL_ROOT) {
  try {
    const doc = loadSeats(channelRoot);
    return {
      source: 'seats', ok: true,
      items: roster(doc).map((s) => ({ id: s.id, site: s.site ?? null, session: s.session ?? null, role: s.role ?? 'seat' })),
      detail: `${doc.seats.length} seat(s) + manager`,
    };
  } catch (e) {
    return { source: 'seats', ok: false, items: [], detail: e.message };
  }
}

/** Agent definitions on disk: the global store and this repo's opencode store. */
export function probeAgentDefs(dirs = [GLOBAL_AGENTS, REPO_AGENTS]) {
  const items = [];
  const missing = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) { missing.push(dir); continue; }
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const text = readFileSync(join(dir, f), 'utf8');
      const model = (text.match(/^model:\s*(\S+)/m) || [])[1] ?? null;
      const level = (text.match(/^thoughtLevel:\s*(\S+)/m) || [])[1] ?? null;
      items.push({ id: f.replace(/\.md$/, ''), model, thoughtLevel: level, dir });
    }
  }
  return { source: 'agent-defs', ok: items.length > 0, items, detail: `${items.length} definition(s)` + (missing.length ? `; missing: ${missing.join(', ')}` : '') };
}

/** Live sessions, newest first: the thread half of the roof. */
export function probeThreads(tool) {
  if (!existsSync(tool)) return { source: 'threads', ok: false, items: [], detail: `no sessions tool at ${tool}` };
  const r = spawnSync(process.execPath, [tool, '--json', 'list', '--limit', '5000'], { encoding: 'utf8', timeout: 60000 });
  let doc = null;
  try { doc = JSON.parse(String(r.stdout ?? '')); } catch { doc = null; }
  if (!doc?.sessions) return { source: 'threads', ok: false, items: [], detail: 'session store unreadable' };
  const live = doc.sessions.filter((s) => s.type !== 'subagent_child' && s.ageMinutes < 240);
  return {
    source: 'threads', ok: true,
```

_First 80 of 562 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
