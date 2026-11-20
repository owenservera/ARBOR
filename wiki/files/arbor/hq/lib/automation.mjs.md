# File: hq/lib/automation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/automation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 22209 B |
| Lines | 646 |
| Hash | 3562b82f6687 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HOOK_NAMES | const | 15 | no | const HOOK_NAMES = [&#39;post-commit&#39;, &#39;post-merge&#39;, &#39;post-checkout&#39;]; |
| HOOK_MARKER | const | 16 | no | const HOOK_MARKER = &#39;# vivim-hq-hooks v1&#39;; |
| HOOK_MARKER_LEGACY | const | 17 | no | const HOOK_MARKER_LEGACY = &#39;# HQ-MANAGED&#39;; |
| POLL_INTERVAL_MS | const | 18 | no | const POLL_INTERVAL_MS = 5000; |
| MEDIA_POLL_INTERVAL_MS | const | 19 | no | const MEDIA_POLL_INTERVAL_MS = 30 * 60 * 1000; |
| MAX_SNAPSHOT_ENTRIES | const | 20 | no | const MAX_SNAPSHOT_ENTRIES = 5000; |
| MAX_SNAPSHOT_DEPTH | const | 21 | no | const MAX_SNAPSHOT_DEPTH = 12; |
| SNAPSHOT_IGNORES | const | 22 | no | const SNAPSHOT_IGNORES = new Set([ &#39;.git&#39;, &#39;.hq&#39;, &#39;node_modules&#39;, &#39;dist&#39;, &#39;build&#39;, &#39;out&#39;, &#39;.next&#39;, &#39;.nuxt&#39;, &#39;.cache&#39;, &#39;coverage&#39;, &#39;.venv&#39;, &#39;venv&#39;, &#39;__pycache__&#39;, &#39;target&#39;, &#39;wiki&#39;, ]); |
| errorMessage | function | 27 | no | function errorMessage(error) { |
| projectAbs | function | 31 | no | function projectAbs(root, project) { |
| raw | const | 32 | no | const raw = project?.abs \|\| project?.absPath \|\| project?.absolute \|\| project?.path |
| text | const | 34 | no | const text = String(raw); |
| normalizeEntries | function | 38 | no | function normalizeEntries(root, projects) { |
| list | const | 39 | no | const list = Array.isArray(projects) ? projects : []; |
| entries | const | 40 | no | const entries = []; |
| seen | const | 41 | no | const seen = new Set(); |
| project | const | 43 | no | const project = list[index]; |
| name | const | 44 | no | const name = String(project?.name \|\| project?.id \|\| (typeof project === &#39;string&#39; ? project : `project-${index + 1}`)); |
| abs | const | 45 | no | const abs = projectAbs(root, project); |
| key | const | 46 | no | const key = `${name}\\0${abs}`; |
| snapshotProject | function | 58 | no | function snapshotProject(dir) { |
| parts | const | 59 | no | const parts = []; |
| truncated | variable | 60 | no | let truncated = false; |
| walk | function | 62 | no | const walk = (dirPath, depth) =&gt; { |
| items | variable | 65 | no | let items; |
| abs | const | 76 | no | const abs = join(dirPath, item.name); |
| info | variable | 83 | no | let info; |
| isManagedHook | function | 93 | no | function isManagedHook(text) { |
| watchWorkspace | function | 106 | yes | export function watchWorkspace({ root, db, projects = [], debounceMs = 500, onEvent = null, indexOptions = {}, pollMs = POLL_INTERVAL_MS, isPaused = null, watchImpl = fsWatch } = {}) { |
| base | const | 107 | no | const base = root ? resolve(String(root)) : process.cwd(); |
| delay | const | 108 | no | const delay = Number.isFinite(Number(debounceMs)) ? Math.max(0, Number(debounceMs)) : 500; |
| entries | const | 109 | no | const entries = normalizeEntries(base, projects); |
| byName | const | 110 | no | const byName = new Map(entries.map((entry) =&gt; [entry.name, entry])); |
| stats | const | 112 | no | const stats = { |
| pending | const | 116 | no | const pending = new Set(); |
| watchers | const | 117 | no | const watchers = []; |
| pollSignatures | const | 118 | no | const pollSignatures = new Map(); |
| stopped | variable | 120 | no | let stopped = false; |
| debounceTimer | variable | 121 | no | let debounceTimer = null; |
| pollTimer | variable | 122 | no | let pollTimer = null; |
| loopPromise | variable | 123 | no | let loopPromise = null; |
| activeFlush | variable | 124 | no | let activeFlush = null; |
| emit | function | 126 | no | function emit(event) { |
| clearDebounce | function | 135 | no | function clearDebounce() { |
| queue | function | 142 | no | function queue(names) { |
| added | variable | 144 | no | let added = false; |
| paused | const | 161 | no | const paused = typeof isPaused === &#39;function&#39; ? isPaused : () =&gt; false; |
| runOne | function | 163 | no | async function runOne(name) { |
| started | const | 164 | no | const started = Date.now(); |
| entry | const | 172 | no | const entry = byName.get(name); |
| project | const | 176 | no | const project = { ...entry.project, name: entry.name, path: entry.abs, abs: entry.abs }; |
| index | const | 180 | no | const index = indexProject({ root: base, db, project, options: indexOptions }); |
| instructions | const | 181 | no | const instructions = indexInstructions(db, project); |
| lake | const | 182 | no | const lake = ingestProject(db, project); |
| ensureLoop | function | 203 | no | function ensureLoop() { |
| run | function | 206 | no | const run = (async () =&gt; { while (!stopped &amp;&amp; pending.size &gt; 0) { const names = [...pending].sort(); pending.clear(); stats.queued = 0; |
| names | const | 208 | no | const names = [...pending].sort(); |
| guarded | const | 218 | no | const guarded = run.catch(() =&gt; {}); |
| drain | function | 226 | no | async function drain() { |
| onFsEvent | function | 241 | no | function onFsEvent(entry, filename) { |
| segments | const | 247 | no | const segments = toPosix(String(filename)).split(&#39;/&#39;); |
| startPolling | function | 253 | no | function startPolling() { |
| changed | const | 261 | no | const changed = []; |
| signature | const | 263 | no | const signature = existsSync(entry.abs) ? snapshotProject(entry.abs) : &#39;&#39;; |
| startWatching | function | 274 | no | function startWatching() { |
| failed | variable | 276 | no | let failed = 0; |
| watcher | const | 280 | no | const watcher = watchImpl(entry.abs, { recursive: true, persistent: false }, (eventType, filename) =&gt; { onFsEvent(entry, filename); }); |
| stop | function | 313 | no | function stop() { |
| runFlush | function | 333 | no | async function runFlush() { |
| flush | function | 347 | no | function flush() { |
| mediaTimer | variable | 360 | no | let mediaTimer = null; |
| startMediaPolling | function | 361 | no | function startMediaPolling() { |
| limit | const | 363 | no | const limit = Number(process.env.VIVIM_MEDIA_POLL_LIMIT \|\| 0) \|\| 0; |
| opts | const | 367 | no | const opts = { |
| media | const | 374 | no | const media = await createStudioMedia({ port: Number(process.env.VIVIM_MEDIA_CDP_PORT \|\| 9222) }); |
| res | const | 377 | no | const res = await runMediaPoll(opts); |
| res | const | 383 | no | const res = await runMediaPoll(opts); |
| resolveHqBin | function | 401 | no | function resolveHqBin(root) { |
| candidate | const | 402 | no | const candidate = join(root, &#39;hq&#39;, &#39;bin&#39;, &#39;hq.mjs&#39;); |
| gitDirFor | function | 411 | no | function gitDirFor(projectDir) { |
| dotGit | const | 412 | no | const dotGit = join(projectDir, &#39;.git&#39;); |
| text | const | 420 | no | const text = readFileSync(dotGit, &#39;utf8&#39;); |
| target | const | 423 | no | const target = match[1].trim(); |
| doubleQuote | function | 430 | no | function doubleQuote(value) { |
| hookScript | function | 439 | no | function hookScript({ name, bin, root, hook }) { |
| safeName | const | 440 | no | const safeName = doubleQuote(name); |
| safeBin | const | 441 | no | const safeBin = doubleQuote(toPosix(bin)); |
| safeRoot | const | 442 | no | const safeRoot = doubleQuote(toPosix(root)); |
| safeHook | const | 443 | no | const safeHook = doubleQuote(hook \|\| &#39;git&#39;); |
| safeLog | const | 444 | no | const safeLog = doubleQuote(toPosix(join(root, &#39;.hq&#39;, &#39;hooks.log&#39;))); |
| safePause | const | 445 | no | const safePause = doubleQuote(toPosix(join(root, &#39;.hq&#39;, &#39;watch.pause&#39;))); |
| installHooks | function | 469 | yes | export function installHooks({ root, projects = [], force = false } = {}) { |
| base | const | 470 | no | const base = root ? resolve(String(root)) : process.cwd(); |
| hqBin | const | 471 | no | const hqBin = resolveHqBin(base); |
| installed | const | 472 | no | const installed = []; |
| skipped | const | 473 | no | const skipped = []; |
| hooks | const | 474 | no | const hooks = []; |
| gitDir | const | 477 | no | const gitDir = gitDirFor(entry.abs); |
| hooksDir | const | 491 | no | const hooksDir = join(gitDir, &#39;hooks&#39;); |
| content | const | 509 | no | const content = hookScript({ name: entry.name, bin: hqBin, root: base, hook }); |
| hookPath | const | 510 | no | const hookPath = join(hooksDir, hook); |
| existing | variable | 511 | no | let existing = null; |
| uninstallHooks | function | 568 | yes | export function uninstallHooks({ root, projects = [] } = {}) { |
| base | const | 569 | no | const base = root ? resolve(String(root)) : process.cwd(); |
| removed | const | 570 | no | const removed = []; |
| gitDir | const | 573 | no | const gitDir = gitDirFor(entry.abs); |
| hooksDir | const | 575 | no | const hooksDir = join(gitDir, &#39;hooks&#39;); |
| names | variable | 577 | no | let names; |
| hookPath | const | 585 | no | const hookPath = join(hooksDir, hook); |
| text | variable | 586 | no | let text; |
| statusHooks | function | 609 | yes | export function statusHooks({ root, projects = [] } = {}) { |
| base | const | 610 | no | const base = root ? resolve(String(root)) : process.cwd(); |
| spaces | const | 611 | no | const spaces = []; |
| gitDir | const | 614 | no | const gitDir = gitDirFor(entry.abs); |
| hooksDir | const | 619 | no | const hooksDir = join(gitDir, &#39;hooks&#39;); |
| hooks | const | 620 | no | const hooks = []; |
| hookPath | const | 622 | no | const hookPath = join(hooksDir, hook); |
| state | variable | 623 | no | let state = &#39;missing&#39;; |
| text | const | 626 | no | const text = readFileSync(hookPath, &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 8 | external |
| node:url | import | 9 | external |
| ./indexer.mjs | import | 10 | [hq/lib/indexer.mjs](./indexer.mjs.md) |
| ./skills.mjs | import | 11 | [hq/lib/skills.mjs](./skills.mjs.md) |
| ./lake.mjs | import | 12 | [hq/lib/lake.mjs](./lake.mjs.md) |
| ./util.mjs | import | 13 | [hq/lib/util.mjs](./util.mjs.md) |
| ./torrent/poll.mjs | dynamic | 366 | [hq/lib/torrent/poll.mjs](./torrent/poll.mjs.md) |
| ./torrent/dispatch-adapter.mjs | dynamic | 373 | [hq/lib/torrent/dispatch-adapter.mjs](./torrent/dispatch-adapter.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/automation.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/automation.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/automation.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 358 | see | — | hq/lib/torrent/poll.mjs | hq/lib/torrent/poll.mjs (runMediaPoll) · hq/lib/torrent/dispatch-adapter.mjs |

## Excerpt

```javascript
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
```

_First 80 of 647 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
