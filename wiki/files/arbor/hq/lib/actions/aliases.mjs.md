# File: hq/lib/actions/aliases.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/actions/aliases.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3247 B |
| Lines | 78 |
| Hash | 3ec17a192c9d |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ALIASES | const | 13 | yes | export const ALIASES = Object.freeze({ thread: [&#39;conversation&#39;, &#39;chat&#39;, &#39;dialog&#39;, &#39;dialogue&#39;, &#39;discussion&#39;], session: [&#39;conversation&#39;, &#39;thread&#39;, &#39;window&#39;, &#39;tab&#39;], seat: [&#39;agent-session&#39;, &#39;teammate&#39;, … |
| INDEX | function | 49 | no | const INDEX = (() =&gt; { /** @type {Map&lt;string, Set&lt;string&gt;&gt;} */ const map = new Map(); const add = (a, b) =&gt; { if (a === b) return; |
| map | const | 51 | no | const map = new Map(); |
| add | function | 52 | no | const add = (a, b) =&gt; { |
| expand | function | 68 | yes | export function expand(token) { |
| t | const | 69 | no | const t = String(token ?? &#39;&#39;).toLowerCase().trim(); |
| direct | const | 71 | no | const direct = INDEX.get(t); |
| vocabulary | function | 76 | yes | export function vocabulary() { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/actions/aliases.mjs |
| [hq/test/action-map.test.mjs](../../test/action-map.test.mjs.md) | ../lib/actions/aliases.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The words an operator actually uses, mapped onto the registry&#39;s vocabulary, so |
| 5 | owner | channel-manager | — | channel-manager |
| 6 | task | — | — | action-map |
| 7 | invariant | — | — | expansion is symmetric: if X lists Y, Y lists X |
| 8 | invariant | — | — | an unknown token returns itself — never empty, never a throw |
| 9 | see | — | doc:docs/AGENT-BUS.md | doc:docs/AGENT-BUS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context The words an operator actually uses, mapped onto the registry's vocabulary, so
 *   `hq do "rename a conversation"` can reach `thread.update.title` without knowing either word.
 * @hq:owner channel-manager
 * @hq:task action-map
 * @hq:invariant expansion is symmetric: if X lists Y, Y lists X
 * @hq:invariant an unknown token returns itself — never empty, never a throw
 * @hq:see doc:docs/AGENT-BUS.md
 */

/** registry word → the words people say instead. Reverse links are derived, not typed twice. */
export const ALIASES = Object.freeze({
  thread: ['conversation', 'chat', 'dialog', 'dialogue', 'discussion'],
  session: ['conversation', 'thread', 'window', 'tab'],
  seat: ['agent-session', 'teammate', 'worker', 'agent', 'participant'],
  message: ['msg', 'note', 'ping', 'text'],
  inbox: ['mailbox', 'queue', 'mail'],
  wake: ['nudge', 'poke', 'start', 'resume', 'kick', 'activate'],
  prompt: ['instruction', 'ask', 'request'],
  reply: ['answer', 'response'],
  approval: ['approve', 'sign-off', 'consent', 'gate', 'authorize', 'permission'],
  revocation: ['revoke', 'cancel', 'withdraw', 'disable'],
  task: ['job', 'work-item', 'ticket', 'chore'],
  evidence: ['receipt', 'proof', 'record', 'log', 'audit'],
  outcome: ['result', 'consequence'],
  decision: ['ruling', 'verdict', 'call'],
  index: ['reindex', 'catalogue', 'catalog', 'inventory'],
  context: ['bundle', 'briefing', 'digest', 'brief'],
  memory: ['knowledge', 'recollection', 'note'],
  wiki: ['docs', 'documentation', 'pages'],
  health: ['doctor', 'status', 'diagnostic', 'diagnose'],
  delete: ['remove', 'drop', 'purge', 'destroy'],
  list: ['ls', 'enumerate', 'inventory'],
  show: ['get', 'read', 'inspect', 'view', 'display'],
  create: ['add', 'new', 'open', 'make', 'register'],
  update: ['edit', 'change', 'set', 'rename', 'modify', 'patch'],
  export: ['dump', 'download', 'extract', 'copy-out'],
  watch: ['monitor', 'tail', 'follow', 'observe'],
  dispatch: ['send', 'fire', 'hand-off', 'handoff', 'route', 'delegate', 'wake', 'start', 'run', 'invoke'],
  validate: ['check', 'verify', 'confirm', 'audit'],
  repair: ['fix', 'heal', 'recover', 'restore'],
  name: ['title', 'label', 'rename'],
  heartbeat: ['liveness', 'pulse', 'alive'],
  peer: ['agent', 'node', 'participant'],
  bot: ['robot', 'assistant', 'helper'],
});

const INDEX = (() => {
  /** @type {Map<string, Set<string>>} */
  const map = new Map();
  const add = (a, b) => {
    if (a === b) return;
    if (!map.has(a)) map.set(a, new Set());
    map.get(a).add(b);
  };
  for (const [word, synonyms] of Object.entries(ALIASES)) {
    for (const s of synonyms) { add(word, s); add(s, word); }
  }
  return map;
})();

/**
 * The token plus everything it is a synonym of, in both directions.
 * @param {string} token
 * @returns {string[]}
 */
export function expand(token) {
  const t = String(token ?? '').toLowerCase().trim();
  if (!t) return [];
  const direct = INDEX.get(t);
  return direct ? [t, ...[...direct].sort()] : [t];
}

/** Every registry word and every synonym, for diagnostics. */
export function vocabulary() {
  return [...INDEX.keys()].sort();
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
