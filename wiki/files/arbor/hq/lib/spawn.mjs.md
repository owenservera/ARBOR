# File: hq/lib/spawn.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/spawn.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15689 B |
| Lines | 341 |
| Hash | b5f726da3708 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SPAWN_CODES | const | 34 | yes | export const SPAWN_CODES = Object.freeze({ DEPTH_EXCEEDED: &#39;DEPTH_EXCEEDED&#39;, FANOUT_EXCEEDED: &#39;FANOUT_EXCEEDED&#39;, BAD_ROLE: &#39;BAD_ROLE&#39;, BAD_PARENT: &#39;BAD_PARENT&#39;, |
| SPAWN_LEDGER | const | 45 | yes | export const SPAWN_LEDGER = &#39;hq/work/spawns.jsonl&#39;; |
| DEFAULT_LIMITS | const | 52 | yes | export const DEFAULT_LIMITS = Object.freeze({ maxDepth: 3, maxChildren: 4 }); |
| FLEET_LIMITS | const | 59 | yes | export const FLEET_LIMITS = Object.freeze({ maxDepth: 4, maxChildren: 12 }); |
| ROLES | const | 65 | yes | export const ROLES = Object.freeze({ manager: Object.freeze({ mode: &#39;plan&#39;, disallowedTools: Object.freeze([&#39;Write&#39;, &#39;Edit&#39;]) }), worker: Object.freeze({ mode: &#39;yolo&#39;, disallowedTools: Object.freeze(… |
| SESSION_ID | const | 70 | no | const SESSION_ID = /^sess_[A-Za-z0-9._-]+$/; |
| isAbsolutePath | function | 73 | no | function isAbsolutePath(p) { |
| refuse | function | 84 | no | function refuse(code, detail) { |
| showLimit | function | 89 | no | function showLimit(value) { |
| resolveLimits | function | 106 | yes | export function resolveLimits(limits) { |
| caps | const | 108 | no | const caps = { maxDepth: DEFAULT_LIMITS.maxDepth, maxChildren: DEFAULT_LIMITS.maxChildren }; |
| maxDepth | const | 114 | no | const maxDepth = limits.maxDepth; |
| maxChildren | const | 122 | no | const maxChildren = limits.maxChildren; |
| planSpawn | function | 145 | yes | export function planSpawn(input, limits = DEFAULT_LIMITS) { |
| caps | const | 147 | no | const caps = resolveLimits(limits); |
| policy | const | 151 | no | const policy = /** @type {Record&lt;string, {mode: string, disallowedTools: readonly string[]}&gt;} */ (ROLES)[String(role)]; |
| hasParent | const | 162 | no | const hasParent = parent !== null &amp;&amp; parent !== undefined; |
| d | const | 167 | no | const d = Number(depth); |
| c | const | 178 | no | const c = Number(children); |
| buildBrief | function | 201 | yes | export function buildBrief({ role, goal, parent, acceptance }) { |
| parentLine | const | 202 | no | const parentLine = parent |
| acceptLine | const | 205 | no | const acceptLine = String(acceptance ?? &#39;bun test&#39;) |
| appendSpawn | function | 237 | yes | export function appendSpawn(ledgerText, row) { |
| base | const | 240 | no | const base = typeof ledgerText === &#39;string&#39; ? ledgerText : &#39;&#39;; |
| sep | const | 241 | no | const sep = base === &#39;&#39; \|\| base.endsWith(&#39;\\n&#39;) ? &#39;&#39; : &#39;\\n&#39;; |
| parseRows | function | 246 | no | function parseRows(text) { |
| rows | const | 248 | no | const rows = []; |
| row | const | 252 | no | const row = JSON.parse(line); |
| toNode | function | 260 | no | function toNode(r) { |
| mostRecentRoot | function | 272 | no | function mostRecentRoot(rows) { |
| readTree | function | 287 | yes | export function readTree(ledgerText, rootSessionId) { |
| rows | const | 288 | no | const rows = parseRows(ledgerText); |
| byId | const | 289 | no | const byId = new Map(rows.map((r) =&gt; [r.sessionId, r])); |
| rootRow | const | 290 | no | const rootRow = rootSessionId ? byId.get(rootSessionId) : mostRecentRoot(rows); |
| nodes | const | 294 | no | const nodes = []; |
| seen | const | 295 | no | const seen = new Set(); |
| queue | const | 297 | no | const queue = [{ row: rootRow, depth: 0 }]; |
| orphans | const | 315 | no | const orphans = rows.filter((r) =&gt; !seen.has(r.sessionId)).map(toNode); |
| renderTree | function | 327 | yes | export function renderTree(tree) { |
| nodes | const | 328 | no | const nodes = tree?.nodes ?? []; |
| lines | const | 330 | no | const lines = nodes.map((n) =&gt; { const indent = &#39; &#39;.repeat(Math.max(0, Number(n.depth ?? 0))); const goal = n.goal ? ` — ${n.goal}` : &#39;&#39;; return `${indent}${n.sessionId} [${n.role ?? &#39;?&#39;}] d${n.depth… |
| indent | const | 331 | no | const indent = &#39; &#39;.repeat(Math.max(0, Number(n.depth ?? 0))); |
| goal | const | 332 | no | const goal = n.goal ? ` — ${n.goal}` : &#39;&#39;; |
| orphans | const | 335 | no | const orphans = tree?.orphans ?? []; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/spawn.mjs](../bin/spawn.mjs.md) | ../lib/spawn.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The policy of one conversation spawning another: who may delegate, what mode the child runs in, |
| 5 | owner | agent-platform-ceo | — | agent-platform-ceo |
| 6 | task | — | — | spawn-conversations |
| 7 | invariant | — | — | a manager is plan mode with Write and Edit disallowed. A delegating conversation that can |
| 9 | invariant | — | — | this module is pure: no fs, no child_process, no clock, no env. Time enters through the |
| 11 | invariant | — | — | a refusal carries a stable code from SPAWN_CODES, never prose a caller must match. |
| 12 | invariant | — | — | depth and fanout are LIMITS THE CALLER SUPPLIES — planSpawn&#39;s second argument. A supplied |
| 16 | invariant | — | — | nothing in this module accumulates: a wide call cannot widen the next one, because the caps |
| 18 | invariant | — | — | appendSpawn returns new text. The caller&#39;s string is never modified, so a refused spawn can |
| 20 | why | — | — | depth is ZERO-BASED and one scale serves all three readers: the root of a tree is depth 0, its |
| 24 | why | — | — | a root is the most recent row with no parent, so an owner-driven spawn that passes no --parent is |
| 26 | why | — | — | the caps are parameters and not constants: the owner&#39;s direction of 2026-11-04 is that a fleet of |
| 30 | see | — | hq/bin/spawn.mjs | hq/bin/spawn.mjs · hq/test/spawn.test.mjs · hq/lib/channel-transport.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context The policy of one conversation spawning another: who may delegate, what mode the child runs in,
 *   how deep and how wide the tree may go, and the JSONL ledger that proves the tree afterwards.
 * @hq:owner agent-platform-ceo
 * @hq:task spawn-conversations
 * @hq:invariant a manager is plan mode with Write and Edit disallowed. A delegating conversation that can
 *   edit code is the defect this module exists to remove, so the policy is data, not a caller's choice.
 * @hq:invariant this module is pure: no fs, no child_process, no clock, no env. Time enters through the
 *   caller's row.at, files through the caller's ledgerText, and the process through hq/bin/spawn.mjs.
 * @hq:invariant a refusal carries a stable code from SPAWN_CODES, never prose a caller must match.
 * @hq:invariant depth and fanout are LIMITS THE CALLER SUPPLIES — planSpawn's second argument. A supplied
 *   maxDepth or maxChildren must be a finite non-negative integer; Infinity, NaN, a negative and a fraction
 *   are REFUSED with DEPTH_EXCEEDED / FANOUT_EXCEEDED, never silently replaced by a default and never
 *   accepted as unbounded. A dimension the caller omits keeps the frozen floor.
 * @hq:invariant nothing in this module accumulates: a wide call cannot widen the next one, because the caps
 *   live in the call and in no module state.
 * @hq:invariant appendSpawn returns new text. The caller's string is never modified, so a refused spawn can
 *   leave the ledger byte-identical.
 * @hq:why depth is ZERO-BASED and one scale serves all three readers: the root of a tree is depth 0, its
 *   child 1, its grandchild 2. maxDepth 3 therefore allows root -> child -> grandchild -> great-grandchild
 *   and refuses a request for depth 4. The ledger stores the same number the policy checked, and renderTree
 *   indents by exactly that number, so a row can never mean two different things in two places.
 * @hq:why a root is the most recent row with no parent, so an owner-driven spawn that passes no --parent is
 *   still the thing `tree` shows by default.
 * @hq:why the caps are parameters and not constants: the owner's direction of 2026-11-04 is that a fleet of
 *   dozens is a decision a caller makes, not a code change. DEFAULT_LIMITS stay the safe floor for a caller
 *   that says nothing (the CLI today), and FLEET_LIMITS is a named wider preset for a caller that has
 *   decided. A cap that cannot be stated as a finite integer is not a decision, so it is refused.
 * @hq:see hq/bin/spawn.mjs · hq/test/spawn.test.mjs · hq/lib/channel-transport.mjs
 */

/** Stable refusal codes. A caller switches on these; the detail string is for humans only. */
export const SPAWN_CODES = Object.freeze({
  DEPTH_EXCEEDED: 'DEPTH_EXCEEDED',
  FANOUT_EXCEEDED: 'FANOUT_EXCEEDED',
  BAD_ROLE: 'BAD_ROLE',
  BAD_PARENT: 'BAD_PARENT',
  EMPTY_BRIEF: 'EMPTY_BRIEF',
  BAD_CWD: 'BAD_CWD',
  BAD_LIMITS: 'BAD_LIMITS',
});

/** The one ledger, repo-relative so a caller can resolve it against any root. */
export const SPAWN_LEDGER = 'hq/work/spawns.jsonl';

/**
 * The floor, frozen: 3 generations deep, 4 children per conversation. planSpawn uses a
 * dimension only when the caller supplied no cap for it, so a caller that says nothing
 * gets exactly the behaviour it had before the caps became a parameter.
 */
export const DEFAULT_LIMITS = Object.freeze({ maxDepth: 3, maxChildren: 4 });

/**
 * A named wider preset for a fleet of dozens — a starting point a caller opts into, never a
 * ceiling: the truth is in planSpawn's second argument. 12 children per conversation and four
 * generations is a tree of dozens with room for a manager layer and its workers.
 */
export const FLEET_LIMITS = Object.freeze({ maxDepth: 4, maxChildren: 12 });

/**
 * What each role is allowed to be. Data, not branches, so a new role cannot
 * quietly arrive with write access by falling through a default.
 */
export const ROLES = Object.freeze({
  manager: Object.freeze({ mode: 'plan', disallowedTools: Object.freeze(['Write', 'Edit']) }),
  worker: Object.freeze({ mode: 'yolo', disallowedTools: Object.freeze([]) }),
});

const SESSION_ID = /^sess_[A-Za-z0-9._-]+$/;

/** Absolute on win32 (drive or UNC) or posix, decided syntactically: purity forbids fs existence checks. */
function isAbsolutePath(p) {
  return /^[A-Za-z]:[\\/]/.test(p) || /^\\\\/.test(p) || /^\//.test(p);
}

/**
 * A refusal is a value, not an exception: the `ok: false` literal is part of the
 * type so a caller can narrow on it without a cast.
 * @param {string} code
```

_First 80 of 342 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
