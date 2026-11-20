# File: hq/lib/session-card.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/session-card.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9612 B |
| Lines | 234 |
| Hash | 68f29894daa8 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STATE_CARD_SCHEMA | const | 15 | yes | export const STATE_CARD_SCHEMA = &#39;zcode.state-card/1&#39;; |
| STATE_CARD_REL | const | 16 | yes | export const STATE_CARD_REL = join(&#39;.hq&#39;, &#39;session&#39;, &#39;state-card.json&#39;); |
| MAX_DIRTY | const | 17 | yes | export const MAX_DIRTY = 50; |
| MAX_RENDER_LINES | const | 18 | yes | export const MAX_RENDER_LINES = 40; |
| sanitizeAgent | function | 21 | no | function sanitizeAgent(agent) { |
| gitState | function | 30 | yes | export function gitState(repo) { |
| r | const | 31 | no | const r = spawnSync(&#39;git&#39;, [&#39;-C&#39;, repo, &#39;status&#39;, &#39;--porcelain=v1&#39;, &#39;-b&#39;], { encoding: &#39;utf8&#39;, timeout: 15000 }); |
| branch | variable | 35 | no | let branch = null; |
| ahead | variable | 36 | no | let ahead = null; |
| behind | variable | 37 | no | let behind = null; |
| dirty | const | 38 | no | const dirty = []; |
| head | const | 42 | no | const head = line.slice(3).replace(/^No commits yet on /, &#39;&#39;).replace(/^Initial commit on /, &#39;&#39;); |
| a | const | 44 | no | const a = head.match(/ahead (\\d+)/); |
| b | const | 45 | no | const b = head.match(/behind (\\d+)/); |
| rel | const | 50 | no | const rel = line.slice(3).trim(); |
| readLedger | function | 61 | yes | export function readLedger(root) { |
| file | const | 62 | no | const file = join(root, &#39;sync&#39;, &#39;ledger.jsonl&#39;); |
| out | const | 64 | no | const out = []; |
| row | const | 68 | no | const row = JSON.parse(line); |
| activeClaims | function | 82 | yes | export function activeClaims(records, now = Date.now()) { |
| latest | const | 84 | no | const latest = new Map(); |
| refs | const | 86 | no | const refs = Array.isArray(record.refs) ? record.refs.map(String) : []; |
| claim | const | 91 | no | const claim = latest.get(`${record.from}::${ref}`); |
| busState | function | 108 | yes | export function busState({ root, agent, now = Date.now() }) { |
| records | const | 109 | no | const records = readLedger(root); |
| cursorFile | const | 110 | no | const cursorFile = join(root, &#39;sync&#39;, &#39;cursors&#39;, `${sanitizeAgent(agent)}.json`); |
| lastSeq | variable | 111 | no | let lastSeq = 0; |
| lastId | variable | 112 | no | let lastId = &#39;&#39;; |
| cursor | const | 115 | no | const cursor = JSON.parse(readFileSync(cursorFile, &#39;utf8&#39;)); |
| claims | const | 120 | no | const claims = activeClaims(records, now); |
| mine | const | 121 | no | const mine = claims.filter((claim) =&gt; claim.from === agent); |
| unread | const | 122 | no | const unread = records.filter((record) =&gt; { if (record.from === agent) return false; if (record.to !== agent &amp;&amp; record.to !== &#39;*&#39;) return false; return Number(record.seq \|\| 0) &gt; lastSeq &amp;&amp; record.id … |
| buildStateCard | function | 146 | yes | export function buildStateCard(input) { |
| now | const | 147 | no | const now = input.now ?? new Date(); |
| git | const | 148 | no | const git = gitState(input.repo); |
| bus | const | 149 | no | const bus = busState({ root: input.busRoot ?? input.repo, agent: input.busAgent ?? &#39;agent&#39;, now: now.getTime() }); |
| writeStateCard | function | 178 | yes | export function writeStateCard(repo, card) { |
| file | const | 181 | no | const file = join(repo, STATE_CARD_REL); |
| tmp | const | 183 | no | const tmp = `${file}.tmp-${process.pid}`; |
| loadStateCard | function | 193 | yes | export function loadStateCard(repo) { |
| file | const | 194 | no | const file = join(repo, STATE_CARD_REL); |
| card | const | 197 | no | const card = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| clip | function | 205 | no | function clip(value, max = 5) { |
| list | const | 206 | no | const list = Array.isArray(value) ? value : []; |
| shown | const | 207 | no | const shown = list.slice(0, max).map((v) =&gt; String(v)); |
| renderStateCard | function | 215 | yes | export function renderStateCard(card) { |
| lines | const | 216 | no | const lines = []; |
| next | const | 217 | no | const next = String(card.nextAction ?? &#39;&#39;).trim(); |
| git | const | 221 | no | const git = `BRANCH: ${card.branch ?? &#39;(no git)&#39;}${card.ahead ? ` +${card.ahead}` : &#39;&#39;}${card.behind ? ` -${card.behind}` : &#39;&#39;} · ${(card.dirty ?? []).length} dirty`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 11 | external |
| node:path | import | 12 | external |
| node:child_process | import | 13 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/session-card.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The durable state card for the autocompaction protocol: a small, rebuildable |
| 5 | owner | atlas | — | atlas |
| 6 | task | — | — | compact-protocol |
| 7 | invariant | — | — | the conversation is cache, the card is state: a write without a nextAction is refused. |
| 8 | invariant | — | — | every probe is read-only; the only write is the card file, atomically. |
| 9 | see | — | doc:docs/automation/ZCODE-MANUAL-TASK-AUTOMATION.md | doc:docs/automation/ZCODE-MANUAL-TASK-AUTOMATION.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context The durable state card for the autocompaction protocol: a small, rebuildable
 *   snapshot of goal, next action, lanes, git state and bus state that survives summarization.
 * @hq:owner atlas
 * @hq:task compact-protocol
 * @hq:invariant the conversation is cache, the card is state: a write without a nextAction is refused.
 * @hq:invariant every probe is read-only; the only write is the card file, atomically.
 * @hq:see doc:docs/automation/ZCODE-MANUAL-TASK-AUTOMATION.md
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export const STATE_CARD_SCHEMA = 'zcode.state-card/1';
export const STATE_CARD_REL = join('.hq', 'session', 'state-card.json');
export const MAX_DIRTY = 50;
export const MAX_RENDER_LINES = 40;

/** @param {string} agent */
function sanitizeAgent(agent) {
  return String(agent).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Branch and dirty paths from git. A non-repo returns a clean defect row rather than throwing.
 * @param {string} repo
 * @returns {{ branch: string|null, dirty: string[], ahead: number|null, behind: number|null, error: string|null }}
 */
export function gitState(repo) {
  const r = spawnSync('git', ['-C', repo, 'status', '--porcelain=v1', '-b'], { encoding: 'utf8', timeout: 15000 });
  if (r.status !== 0) {
    return { branch: null, dirty: [], ahead: null, behind: null, error: (r.stderr || 'git status failed').trim().split(/\r?\n/).pop() };
  }
  let branch = null;
  let ahead = null;
  let behind = null;
  const dirty = [];
  for (const line of String(r.stdout).split(/\r?\n/)) {
    if (!line) continue;
    if (line.startsWith('## ')) {
      const head = line.slice(3).replace(/^No commits yet on /, '').replace(/^Initial commit on /, '');
      branch = head.split('...')[0].trim() || null;
      const a = head.match(/ahead (\d+)/);
      const b = head.match(/behind (\d+)/);
      ahead = a ? Number(a[1]) : null;
      behind = b ? Number(b[1]) : null;
      continue;
    }
    const rel = line.slice(3).trim();
    if (rel) dirty.push(rel.includes(' -> ') ? rel.split(' -> ').pop() : rel);
  }
  return { branch, dirty: dirty.slice(0, MAX_DIRTY), ahead, behind, error: null };
}

/**
 * Parse the append-only sync ledger. Bad lines are skipped, never fatal.
 * @param {string} root
 * @returns {Array<Record<string, any>>}
 */
export function readLedger(root) {
  const file = join(root, 'sync', 'ledger.jsonl');
  if (!existsSync(file)) return [];
  const out = [];
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row && typeof row === 'object' && row.id) out.push(row);
    } catch { /* a corrupt line is not a crash */ }
  }
  return out;
}

/**
 * Claims that are still active: the latest claim per holder::ref, ended by a release
 * written at or after it, and not expired.
 * @param {Array<Record<string, any>>} records
 * @param {number} now
 * @returns {Array<Record<string, any>>}
```

_First 80 of 235 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
