# File: hq/lib/actions/handlers.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/actions/handlers.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5543 B |
| Lines | 68 |
| Hash | ba5e47162a42 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HANDLERS | const | 13 | yes | export const HANDLERS = Object.freeze({ // ---- sync bus (scripts/sync.mjs) ------------------------------------- &#39;bus.list&#39;: { command: &#39;bun scripts/sync.mjs log --topic &lt;object&gt;&#39;, note: &#39;read-only&#39;… |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/actions/handlers.mjs |
| [hq/lib/wiki.mjs](../wiki.mjs.md) | ./actions/handlers.mjs |
| [hq/test/action-map.test.mjs](../../test/action-map.test.mjs.md) | ../lib/actions/handlers.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The wired map: which `&lt;domain&gt;.&lt;verb&gt;` pairs have a real command behind them. An action is |
| 5 | owner | channel-manager | — | channel-manager |
| 6 | task | — | — | action-map |
| 7 | invariant | — | — | never cite a command that does not exist in hq/bin/hq.mjs or scripts/sync.mjs |
| 8 | invariant | — | — | a library with no CLI verb says so; it must not borrow a command it cannot run |
| 9 | see | — | doc:docs/COMMS-SYSTEM.md | doc:docs/COMMS-SYSTEM.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context The wired map: which `<domain>.<verb>` pairs have a real command behind them. An action is
 *   `wired` only when its key exists here; everything else in the 2000-action catalog is `declared`.
 * @hq:owner channel-manager
 * @hq:task action-map
 * @hq:invariant never cite a command that does not exist in hq/bin/hq.mjs or scripts/sync.mjs
 * @hq:invariant a library with no CLI verb says so; it must not borrow a command it cannot run
 * @hq:see doc:docs/COMMS-SYSTEM.md
 */

/** `<object>` is replaced by the action's object name when a command is run. */
export const HANDLERS = Object.freeze({
  // ---- sync bus (scripts/sync.mjs) -------------------------------------
  'bus.list': { command: 'bun scripts/sync.mjs log --topic <object>', note: 'read-only' },
  'bus.show': { command: 'bun scripts/sync.mjs status', note: 'read-only, ignores <object>' },
  'bus.create': { command: 'bun scripts/sync.mjs send --kind <object> --from hq-agent --to "*" --body "-"', note: 'writes one ledger line; body from stdin' },
  'bus.validate': { command: 'bun scripts/sync.mjs verify', note: 'recomputes digest and prev chain' },
  'bus.repair': { command: 'bun scripts/sync.mjs repair --truncate-tail', note: 'high risk: rewrites the ledger tail' },
  'bus.export': { command: 'bun scripts/sync.mjs log --json', note: 'high risk: copies the record out' },
  'bus.watch': { command: 'bun scripts/sync.mjs watch --topic <object>', note: 'blocks until change; exit 0 CHANGE / 2 IDLE' },
  'bus.dispatch': { command: 'bun scripts/sync.mjs send --kind handoff --body "-"', note: 'delivery only: starts no turn' },

  // ---- seats (hq seat) -------------------------------------------------
  'seat.list': { command: 'bun hq/bin/hq.mjs seat list', note: 'read-only, live IDLE/ACTIVE' },
  'seat.show': { command: 'bun hq/bin/hq.mjs seat list', note: 'read-only' },
  'seat.dispatch': { command: 'bun hq/bin/hq.mjs seat wake <object> --prompt "-"', note: 'starts a real turn; journal-before-effect' },
  'seat.update': { command: 'bun hq/bin/hq.mjs seat wake <object> --force --prompt "-"', note: 'medium risk: forces a wake on an active seat' },
  'seat.validate': { command: 'bun hq/bin/hq.mjs seat verify <object>', note: 'proof from the seat transcript' },
  'seat.watch': { command: 'bun hq/bin/hq.mjs seat list', note: 'snapshot only; no watcher wired' },

  // ---- threads / CNP ---------------------------------------------------
  'thread.list': { command: 'bun hq/bin/hq.mjs comms', note: 'read-only thread view' },
  'thread.show': { command: 'bun hq/bin/hq.mjs threads resolve', note: 'names every receipt; dry run' },
  'thread.update': { command: 'bun hq/bin/hq.mjs threads resolve --write', note: 'writes channel/threads.json; receipts untouched' },
  'thread.dispatch': { command: 'bun hq/bin/hq.mjs threads resolve --write', note: 'names the thread so it can be resumed' },
  'cnp.list': { command: 'bun hq/bin/hq.mjs threads resolve', note: 'read-only' },
  'cnp.validate': { command: 'bun hq/bin/hq.mjs threads resolve', note: 'rejects l=0 and over-depth lineage' },

  // ---- evidence --------------------------------------------------------
  'evidence.list': { command: 'bun hq/bin/hq.mjs comms', note: 'read-only: receipts, outcomes, decisions' },
  'evidence.show': { command: 'bun hq/bin/hq.mjs comms --json', note: 'read-only' },
  'evidence.validate': { command: 'bun test hq/test/channel-evidence.test.mjs', note: 'the falsifier suite' },

  // ---- index / context / wiki / ops ------------------------------------
  'index.create': { command: 'bun hq/bin/hq.mjs index', note: 'incremental' },
  'index.update': { command: 'bun hq/bin/hq.mjs index --changed', note: 'incremental, changed files only' },
  'index.validate': { command: 'bun hq/bin/hq.mjs check', note: 'read-only freshness check' },
  'index.show': { command: 'bun hq/bin/hq.mjs search "<object>"', note: 'read-only FTS query' },
  'context.create': { command: 'bun hq/bin/hq.mjs context "<object>"', note: 'read-only bundle' },
  'context.show': { command: 'bun hq/bin/hq.mjs brief', note: 'read-only SITREP' },
  'wiki.create': { command: 'bun hq/bin/hq.mjs wiki', note: 'writes generated pages' },
  'wiki.validate': { command: 'bun hq/bin/hq.mjs wiki --check', note: 'fails when stale' },
  'ops.show': { command: 'bun hq/bin/hq.mjs verify', note: 'read-only' },
  'ops.validate': { command: 'bun hq/bin/hq.mjs doctor', note: 'read-only' },
  'ops.report': { command: 'bun hq/bin/hq.mjs comms', note: 'read-only roof' },

  // ---- libraries with no CLI verb yet ----------------------------------
  // These exist and are tested, but nothing in hq/bin/hq.mjs calls them.
  'approval.create': { command: '(no CLI)', note: 'library only: hq/lib/approvals.mjs enqueue' },
  'approval.update': { command: '(no CLI)', note: 'library only: hq/lib/approvals.mjs decide' },
  'approval.list': { command: '(no CLI)', note: 'library only: hq/lib/approvals.mjs state' },
  'revocation.create': { command: '(no CLI)', note: 'library only: hq/lib/revocations.mjs revoke' },
  'revocation.list': { command: '(no CLI)', note: 'library only: hq/lib/revocations.mjs view' },
  'task.create': { command: '(no CLI)', note: 'library only: hq/lib/task-lifecycle.mjs open' },
  'task.update': { command: '(no CLI)', note: 'library only: hq/lib/task-lifecycle.mjs transition' },
  'task.list': { command: '(no CLI)', note: 'library only: hq/lib/task-lifecycle.mjs view' },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
