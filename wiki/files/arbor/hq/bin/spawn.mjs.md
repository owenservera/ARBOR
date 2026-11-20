# File: hq/bin/spawn.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/bin/spawn.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 24738 B |
| Lines | 540 |
| Hash | cb6cfc37234c |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO_ROOT | const | 39 | no | const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| CLI | const | 40 | no | const CLI = fileURLToPath(import.meta.url); |
| EXIT | const | 43 | no | const EXIT = Object.freeze({ USAGE: 2, [SPAWN_CODES.DEPTH_EXCEEDED]: 3, [SPAWN_CODES.FANOUT_EXCEEDED]: 4, [SPAWN_CODES.BAD_ROLE]: 5, |
| USAGE | const | 55 | no | const USAGE = `spawn — one conversation that delegates instead of coding |
| parseArgs | function | 81 | no | function parseArgs(argv) { |
| out | const | 83 | no | const out = { _: [] }; |
| a | const | 85 | no | const a = argv[i]; |
| key | const | 87 | no | const key = a.slice(2); |
| next | const | 88 | no | const next = argv[i + 1]; |
| ledgerPath | function | 97 | no | function ledgerPath(args) { |
| given | const | 98 | no | const given = typeof args.ledger === &#39;string&#39; ? args.ledger : process.env.HQ_SPAWN_LEDGER; |
| readLedger | function | 103 | no | function readLedger(path) { |
| ledgerRows | function | 108 | no | function ledgerRows(text) { |
| rows | const | 110 | no | const rows = []; |
| row | const | 114 | no | const row = JSON.parse(line); |
| lastJsonObject | function | 126 | no | function lastJsonObject(text) { |
| s | const | 127 | no | const s = String(text ?? &#39;&#39;); |
| lines | const | 129 | no | const lines = s.split(/\\r?\\n/); |
| line | const | 131 | no | const line = lines[i].trim(); |
| start | const | 137 | no | const start = s.lastIndexOf(&#39;{&#39;, end); |
| runSpawn | function | 152 | no | function runSpawn(request, runner) { |
| reqFile | const | 154 | no | const reqFile = join(process.env.TEMP \|\| tmpdir(), `hq-spawn-req-${Date.now()}-${process.pid}.json`); |
| node | const | 156 | no | const node = process.env.HQ_SPAWN_NODE \|\| process.execPath; |
| r | const | 157 | no | const r = spawnSync(node, [runner, reqFile], { encoding: &#39;utf8&#39;, timeout: 120000, maxBuffer: 64 * 1024 * 1024 }); |
| payload | const | 159 | no | const payload = lastJsonObject(r.stdout); |
| id | const | 160 | no | const id = payload &amp;&amp; typeof payload.sessionId === &#39;string&#39; ? payload.sessionId : null; |
| why | const | 162 | no | const why = String(r.stderr ?? &#39;&#39;).trim().split(/\\r?\\n/).pop() \|\| `exit ${r.status}`; |
| cli | const | 169 | no | const cli = zcodeCli(); |
| args | const | 171 | no | const args = [cli, &#39;-p&#39;, request.brief, &#39;--json&#39;, &#39;--mode&#39;, request.mode, &#39;--cwd&#39;, request.cwd]; |
| timeout | const | 174 | no | const timeout = Number(process.env.HQ_SPAWN_TIMEOUT \|\| 300000); |
| r | const | 175 | no | const r = spawnSync(nodeBin(), args, { encoding: &#39;utf8&#39;, timeout, maxBuffer: 64 * 1024 * 1024, windowsHide: true }); |
| payload | const | 177 | no | const payload = lastJsonObject(r.stdout); |
| id | const | 178 | no | const id = payload &amp;&amp; typeof payload.sessionId === &#39;string&#39; ? payload.sessionId : null; |
| why | const | 180 | no | const why = String(r.stderr ?? &#39;&#39;).trim().split(/\\r?\\n/).pop() \|\| `exit ${r.status}`; |
| runsDir | function | 188 | no | function runsDir() { |
| dir | const | 189 | no | const dir = process.env.HQ_SPAWN_RUNS ? resolve(process.env.HQ_SPAWN_RUNS) : join(REPO_ROOT, &#39;hq&#39;, &#39;work&#39;, &#39;runs&#39;); |
| runSpawnDetached | function | 204 | no | function runSpawnDetached(request) { |
| cli | const | 205 | no | const cli = zcodeCli(); |
| args | const | 210 | no | const args = [cli, &#39;-p&#39;, request.brief, &#39;--json&#39;, &#39;--mode&#39;, request.mode, &#39;--cwd&#39;, request.cwd]; |
| launchId | const | 216 | no | const launchId = `launch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; |
| logPath | const | 217 | no | const logPath = join(dir, `${launchId}.log`); |
| fd | const | 218 | no | const fd = openSync(logPath, &#39;a&#39;); |
| child | variable | 219 | no | let child; |
| goal | const | 229 | no | const goal = String(request.brief \|\| &#39;&#39;).split(/\\r?\\n/).map((l) =&gt; l.trim()).find((l) =&gt; l &amp;&amp; !l.startsWith(&#39;#&#39;))?.slice(0, 120) ?? &#39;&#39;; |
| pidAlive | function | 247 | no | function pidAlive(pid) { |
| recordLaunch | function | 254 | no | function recordLaunch(row, sessionId) { |
| path | const | 255 | no | const path = ledgerPath({}); |
| existing | const | 256 | no | const existing = readLedger(path); |
| cmdStatus | function | 273 | no | function cmdStatus(argv) { |
| args | const | 274 | no | const args = parseArgs(argv); |
| rows | const | 280 | no | const rows = readFileSync(runsLedger, &#39;utf8&#39;).split(/\\r?\\n/).filter(Boolean).flatMap((line) =&gt; { try { return [JSON.parse(line)]; } catch { return []; } }); |
| target | const | 283 | no | const target = typeof args.launch === &#39;string&#39; ? args.launch : null; |
| shown | variable | 284 | no | let shown = 0; |
| text | const | 288 | no | const text = existsSync(row.log) ? readFileSync(row.log, &#39;utf8&#39;) : &#39;&#39;; |
| payload | const | 289 | no | const payload = lastJsonObject(text); |
| sessionId | const | 290 | no | const sessionId = payload &amp;&amp; typeof payload.sessionId === &#39;string&#39; ? payload.sessionId : null; |
| recorded | const | 291 | no | const recorded = sessionId ? recordLaunch(row, sessionId) : false; |
| state | const | 292 | no | const state = pidAlive(row.pid) ? &#39;RUNNING&#39; : &#39;EXITED&#39;; |
| cmdResume | function | 299 | no | function cmdResume(argv) { |
| args | const | 300 | no | const args = parseArgs(argv); |
| session | const | 301 | no | const session = typeof args.session === &#39;string&#39; ? args.session : &#39;&#39;; |
| brief | const | 307 | no | const brief = typeof args.brief === &#39;string&#39; |
| launched | const | 310 | no | const launched = runSpawnDetached({ brief, mode: &#39;yolo&#39;, disallowedTools: [], depth: null, |
| MODEL_CONTEXT_MAX_CHARS | const | 329 | no | const MODEL_CONTEXT_MAX_CHARS = 4096; |
| MODEL_CONTEXT_MAX_PROVIDERS | const | 330 | no | const MODEL_CONTEXT_MAX_PROVIDERS = 12; |
| MODEL_CONTEXT_MAX_MODELS | const | 331 | no | const MODEL_CONTEXT_MAX_MODELS = 24; |
| MODEL_CONTEXT_WINDOW_MS | const | 332 | no | const MODEL_CONTEXT_WINDOW_MS = 5 * 60 * 60 * 1000; |
| MODEL_CONTEXT_STALE_MS | const | 333 | no | const MODEL_CONTEXT_STALE_MS = 60 * 60 * 1000; |
| safeModelLabel | function | 336 | no | function safeModelLabel(value) { |
| renderModelContext | function | 341 | no | function renderModelContext(snapshot) { |
| lines | const | 342 | no | const lines = [ |
| modelCount | variable | 346 | no | let modelCount = 0; |
| providers | const | 347 | no | const providers = snapshot.providers.slice(0, MODEL_CONTEXT_MAX_PROVIDERS); |
| providerName | const | 349 | no | const providerName = safeModelLabel(provider.providerId); |
| configState | const | 350 | no | const configState = provider.configEvidence?.stale ? &#39;STALE&#39; : &#39;current&#39;; |
| quota | const | 351 | no | const quota = provider.remainingQuota; |
| providerQuota | const | 352 | no | const providerQuota = quota?.state === &#39;KNOWN&#39; &amp;&amp; !quota.evidence?.stale |
| usage | const | 358 | no | const usage = model.usage?.evidence; |
| history | const | 359 | no | const history = usage?.stale ? &#39;STALE&#39; : &#39;current&#39;; |
| budget | const | 360 | no | const budget = usage?.stale \|\| provider.configEvidence?.stale ? &#39;UNKNOWN&#39; : |
| remaining | const | 362 | no | const remaining = model.remainingQuota?.state === &#39;KNOWN&#39; &amp;&amp; !model.remainingQuota.evidence?.stale |
| acquireModelContext | function | 379 | no | function acquireModelContext() { |
| home | const | 380 | no | const home = process.env.USERPROFILE \|\| process.env.HOME \|\| homedir(); |
| configPath | const | 381 | no | const configPath = process.env.HQ_SPAWN_PROVIDER_CONFIG \|\| join(home, &#39;.zcode&#39;, &#39;v2&#39;, &#39;provider_config.json&#39;); |
| usagePath | const | 382 | no | const usagePath = process.env.HQ_SPAWN_USAGE_DB \|\| join(home, &#39;.zcode&#39;, &#39;cli&#39;, &#39;db&#39;, &#39;db.sqlite&#39;); |
| catalogPath | const | 383 | no | const catalogPath = process.env.HQ_SPAWN_DEPOT_CATALOG \|\| join(home, &#39;.zcode&#39;, &#39;provider-depot&#39;, &#39;catalog.json&#39;); |
| now | const | 385 | no | const now = Date.now(); |
| config | const | 386 | no | const config = JSON.parse(readFileSync(configPath, &#39;utf8&#39;)); |
| configObservedAt | const | 387 | no | const configObservedAt = statSync(configPath).mtimeMs; |
| rules | const | 388 | no | const rules = config?.config?.providerConfigRules?.providerRules; |
| catalog | const | 390 | no | const catalog = JSON.parse(readFileSync(catalogPath, &#39;utf8&#39;)); |
| db | variable | 392 | no | let db; |
| usageRows | variable | 393 | no | let usageRows; |
| snapshot | const | 398 | no | const snapshot = buildModelInventorySnapshot({ providerConfig: config, configObservedAt, depotCatalog: catalog, usageRows, now, staleAfterMs: MODEL_CONTEXT_STALE_MS, }); |
| cmdNew | function | 411 | no | function cmdNew(argv) { |
| args | const | 412 | no | const args = parseArgs(argv); |
| path | const | 413 | no | const path = ledgerPath(args); |
| existing | const | 414 | no | const existing = readLedger(path); |
| rows | const | 415 | no | const rows = ledgerRows(existing); |
| parent | const | 417 | no | const parent = typeof args.parent === &#39;string&#39; ? args.parent : null; |
| parentRow | const | 418 | no | const parentRow = parent ? rows.find((r) =&gt; r.sessionId === parent) : null; |
| brief | const | 419 | no | const brief = typeof args.brief === &#39;string&#39; ? args.brief : &#39;&#39;; |
| role | const | 420 | no | const role = typeof args.role === &#39;string&#39; ? args.role : &#39;manager&#39;; |
| cwd | const | 421 | no | const cwd = typeof args.cwd === &#39;string&#39; ? args.cwd : REPO_ROOT; // Zero-based generation: a root is depth 0. A parent that is not in the ledger was itself a root |
| parentDepth | const | 423 | no | const parentDepth = parent ? (Number.isInteger(parentRow?.depth) ? Number(parentRow.depth) : 0) : -1; |
| depth | const | 424 | no | const depth = args.depth === undefined ? parentDepth + 1 : Number(args.depth); |
| children | const | 426 | no | const children = parent ? rows.filter((r) =&gt; r.parent === parent).length : 0; |
| plan | const | 428 | no | const plan = planSpawn({ role, parent, depth, children, brief, cwd }); |
| modelContext | const | 435 | no | const modelContext = acquireModelContext(); |
| acceptance | const | 441 | no | const acceptance = typeof args.acceptance === &#39;string&#39; ? args.acceptance : &#39;bun test&#39;; |
| text | const | 442 | no | const text = `${buildBrief({ role, goal: brief, parent, acceptance })}\\n\\n${modelContext.context}`; |
| request | const | 443 | no | const request = { |
| launched | const | 455 | no | const launched = runSpawnDetached(request); |
| runner | const | 465 | no | const runner = typeof args.runner === &#39;string&#39; ? args.runner : process.env.HQ_SPAWN_RUNNER \|\| null; |
| result | const | 466 | no | const result = runSpawn(request, runner); |
| goal | const | 473 | no | const goal = String(brief).split(/\\r?\\n/).map((l) =&gt; l.trim()).find(Boolean)?.slice(0, 120) ?? &#39;&#39;; |
| row | const | 474 | no | const row = { |
| cmdTree | function | 492 | no | function cmdTree(argv) { |
| args | const | 493 | no | const args = parseArgs(argv); |
| path | const | 494 | no | const path = ledgerPath(args); |
| text | const | 495 | no | const text = readLedger(path); |
| tree | const | 496 | no | const tree = readTree(text, typeof args.root === &#39;string&#39; ? args.root : undefined); |
| cmdList | function | 511 | no | function cmdList(argv) { |
| args | const | 512 | no | const args = parseArgs(argv); |
| path | const | 513 | no | const path = ledgerPath(args); |
| rows | const | 514 | no | const rows = ledgerRows(readLedger(path)); |
| main | function | 524 | no | function main() { |
| argv | const | 525 | no | const argv = process.argv.slice(2); |
| command | const | 526 | no | const command = argv[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 21 | external |
| node:child_process | import | 22 | external |
| node:path | import | 23 | external |
| node:os | import | 24 | external |
| node:url | import | 25 | external |
| node:sqlite | import | 26 | external |
| ../lib/model-inventory.mjs | import | 27 | [hq/lib/model-inventory.mjs](../lib/model-inventory.mjs.md) |
| ../lib/spawn.mjs | import | 28 | [hq/lib/spawn.mjs](../lib/spawn.mjs.md) |
| ../lib/channel-transport.mjs | import | 37 | [hq/lib/channel-transport.mjs](../lib/channel-transport.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 4 | context | — | — | The spawn CLI: start a new ZCode conversation headless, in plan mode when it is a manager, and |
| 7 | owner | agent-platform-ceo | — | agent-platform-ceo |
| 8 | task | — | — | spawn-conversations |
| 9 | invariant | — | — | the policy is planSpawn&#39;s. This file measures depth, children and time, and writes the row; |
| 11 | invariant | — | — | the ledger row is written only after a sessionId was captured. A refused or failed spawn |
| 13 | invariant | — | — | the stdout contract is one line: the session id, and nothing else. A caller pipes it into the |
| 15 | invariant | — | — | the runner seam (--runner, HQ_SPAWN_RUNNER) is the only difference between a test and a real |
| 17 | why | — | — | the real spawn reuses zcodeCli() and nodeBin() from channel-transport: one CLI path on this machine, |
| 19 | see | — | hq/lib/spawn.mjs | hq/lib/spawn.mjs · hq/lib/channel-transport.mjs · hq/test/spawn.test.mjs |
| 196 | why | — | — | this exists. runSpawn used spawnSync with a timeout, so a conversation that outlived the |

## Excerpt

```javascript
#!/usr/bin/env node
// @ts-check
/**
 * @hq:context The spawn CLI: start a new ZCode conversation headless, in plan mode when it is a manager, and
 *   record it in the spawn ledger. Reads the tree and the list back. Refuses with a stable code, never with
 *   a fake session id.
 * @hq:owner agent-platform-ceo
 * @hq:task spawn-conversations
 * @hq:invariant the policy is planSpawn's. This file measures depth, children and time, and writes the row;
 *   it never decides on its own who may write.
 * @hq:invariant the ledger row is written only after a sessionId was captured. A refused or failed spawn
 *   leaves the ledger byte-identical, so the ledger is evidence and not an intent log.
 * @hq:invariant the stdout contract is one line: the session id, and nothing else. A caller pipes it into the
 *   next spawn's --parent.
 * @hq:invariant the runner seam (--runner, HQ_SPAWN_RUNNER) is the only difference between a test and a real
 *   spawn. Tests never reach a provider.
 * @hq:why the real spawn reuses zcodeCli() and nodeBin() from channel-transport: one CLI path on this machine,
 *   not a second one that drifts.
 * @hq:see hq/lib/spawn.mjs · hq/lib/channel-transport.mjs · hq/test/spawn.test.mjs
 */
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync, appendFileSync, statSync } from 'node:fs';
import { spawn as spawnProcess, spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { buildModelInventorySnapshot } from '../lib/model-inventory.mjs';
import {
  SPAWN_CODES,
  SPAWN_LEDGER,
  planSpawn,
  buildBrief,
  appendSpawn,
  readTree,
  renderTree,
} from '../lib/spawn.mjs';
import { nodeBin, zcodeCli } from '../lib/channel-transport.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = fileURLToPath(import.meta.url);

/** Distinct exit codes, so a shell can tell a depth cap from a bad role without parsing text. */
const EXIT = Object.freeze({
  USAGE: 2,
  [SPAWN_CODES.DEPTH_EXCEEDED]: 3,
  [SPAWN_CODES.FANOUT_EXCEEDED]: 4,
  [SPAWN_CODES.BAD_ROLE]: 5,
  [SPAWN_CODES.BAD_PARENT]: 6,
  [SPAWN_CODES.EMPTY_BRIEF]: 7,
  [SPAWN_CODES.BAD_CWD]: 8,
  RUNNER_FAILED: 9,
  MODEL_CONTEXT_UNAVAILABLE: 10,
});

const USAGE = `spawn — one conversation that delegates instead of coding

  new --brief "<text>" --role manager|worker [--parent <sess>] [--cwd <dir>] [--depth n]
      [--acceptance "<cmd>"] [--ledger <path>] [--runner <path>] [--detach]
      Start a new conversation. A manager runs --mode plan with Write and Edit disallowed and cannot edit
      code; a worker runs --mode yolo and can. Prints the new session id on stdout and appends one ledger row.
      --detach launches it detached from this process and prints a launch id instead: the child outlives the
      caller, so a conversation longer than any timeout is not killed mid-work. Read it back with 'status'.

  resume --session <sess> [--brief "<text>"] [--cwd <dir>]
      Detached continuation of an existing conversation. Same launcher; writes no ledger row of its own.

  status [--launch <id>]                     One line per detached launch: RUNNING/EXITED, pid, session id.
                                             A launch whose log names its session id is added to the ledger once.

  tree [--root <sess>] [--ledger <path>]     Render the spawn tree from the ledger.
  list [--ledger <path>]                     One line per recorded session.

Environment:
  HQ_SPAWN_LEDGER   ledger path (default ${SPAWN_LEDGER} under the repo root)
  HQ_SPAWN_RUNNER   runner script, the test seam: node <runner> <request.json>, prints {"sessionId":"sess_..."}
  HQ_SPAWN_TIMEOUT  milliseconds to wait for a real spawn (default 300000); ignored by --detach
  HQ_ZCODE_CLI      the ZCode CLI path, already honoured by channel-transport
`;

/** @param {string[]} argv */
```

_First 80 of 541 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
