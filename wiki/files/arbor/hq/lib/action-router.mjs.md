# File: hq/lib/action-router.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/action-router.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7325 B |
| Lines | 205 |
| Hash | b128175bed04 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WEIGHTS | const | 16 | yes | export const WEIGHTS = Object.freeze({ object: 3, verb: 2, domain: 2, purpose: 1 }); |
| DEFAULT_LIMIT | const | 18 | yes | export const DEFAULT_LIMIT = 5; |
| NO_MATCH | const | 21 | yes | export const NO_MATCH = &#39;NO_MATCH&#39;; |
| STOPWORDS | const | 24 | yes | export const STOPWORDS = Object.freeze(new Set([ &#39;the&#39;, &#39;a&#39;, &#39;an&#39;, &#39;to&#39;, &#39;for&#39;, &#39;of&#39;, &#39;my&#39;, &#39;please&#39;, &#39;can&#39;, &#39;you&#39;, &#39;me&#39;, &#39;it&#39;, &#39;all&#39;, &#39;and&#39;, &#39;or&#39;, &#39;in&#39;, &#39;on&#39;, ])); |
| tokenize | function | 62 | yes | export function tokenize(text) { |
| raw | const | 63 | no | const raw = String(text ?? &#39;&#39;) |
| tokens | const | 68 | no | const tokens = []; |
| scoreAction | function | 83 | yes | export function scoreAction(action, tokens) { |
| explainAction | function | 96 | no | function explainAction(action, tokens) { |
| query | const | 97 | no | const query = Array.isArray(tokens) ? tokens : tokenize(tokens); |
| objects | const | 98 | no | const objects = wordSet(action?.object); |
| verbs | const | 99 | no | const verbs = wordSet(action?.verb); |
| domains | const | 100 | no | const domains = wordSet(action?.domain); |
| purpose | const | 101 | no | const purpose = String(action?.purpose ?? &#39;&#39;).toLowerCase(); |
| seen | const | 102 | no | const seen = new Set(); |
| why | const | 104 | no | const why = []; |
| score | variable | 105 | no | let score = 0; |
| token | const | 108 | no | const token = String(raw ?? &#39;&#39;).toLowerCase(); |
| route | function | 143 | yes | export function route(actions, text, { limit = DEFAULT_LIMIT } = {}) { |
| query | const | 146 | no | const query = String(text ?? &#39;&#39;).trim(); |
| tokens | const | 147 | no | const tokens = tokenize(query); |
| scored | const | 149 | no | const scored = []; |
| describe | function | 167 | yes | export function describe(action) { |
| id | const | 168 | no | const id = text(action?.id) \|\| &#39;unnamed&#39;; |
| risk | const | 169 | no | const risk = text(action?.risk) \|\| &#39;unknown&#39;; |
| actors | const | 170 | no | const actors = Array.isArray(action?.actors) &amp;&amp; action.actors.length |
| status | const | 173 | no | const status = text(action?.status).toLowerCase() \|\| &#39;declared&#39;; |
| purpose | const | 174 | no | const purpose = text(action?.purpose); |
| parts | const | 175 | no | const parts = [id, risk, actors, status]; |
| compareMatches | function | 181 | no | function compareMatches(a, b) { |
| x | const | 183 | no | const x = String(a.action?.id ?? &#39;&#39;); |
| y | const | 184 | no | const y = String(b.action?.id ?? &#39;&#39;); |
| normalizeLimit | function | 189 | no | function normalizeLimit(limit) { |
| n | const | 190 | no | const n = Number(limit); |
| wordSet | function | 196 | no | function wordSet(value) { |
| set | const | 197 | no | const set = new Set(); |
| text | function | 203 | no | function text(value) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/action-router.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/action-router.mjs |
| [hq/lib/comment-wiki-bridge.mjs](./comment-wiki-bridge.mjs.md) | ./action-router.mjs |
| [hq/test/action-map.test.mjs](../test/action-map.test.mjs.md) | ../lib/action-router.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Action router — rank registered actions against one plain-English sentence by exact token weight, and refuse rather than guess when nothing scores |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | action-router |
| 6 | invariant | — | — | never a fabricated best guess: a total score of 0 returns NO_MATCH with an empty matches list |
| 7 | invariant | — | — | an object/verb/domain hit is an exact token, never a substring, so `listen` cannot select `list`; only the purpose line is matched by substring |
| 8 | invariant | — | — | the caller supplies the actions: this module builds none, resolves no handler, calls no transport, and writes nothing |
| 9 | invariant | — | — | status is reported, never used to hide a match — whether a `declared` action may run is the caller&#39;s decision, not the router&#39;s |
| 10 | why | — | — | ties break on the action id: the same sentence must rank the same way twice, or `hq do` becomes a coin flip |
| 11 | why | — | — | apostrophes are removed before splitting so a contraction yields `dont`, not a bare `t` that would substring-hit almost every purpose line |
| 12 | see | — | hq/lib/channel-seats.mjs | hq/lib/channel-seats.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Action router — rank registered actions against one plain-English sentence by exact token weight, and refuse rather than guess when nothing scores
 * @hq:owner hq-agent
 * @hq:task action-router
 * @hq:invariant never a fabricated best guess: a total score of 0 returns NO_MATCH with an empty matches list
 * @hq:invariant an object/verb/domain hit is an exact token, never a substring, so `listen` cannot select `list`; only the purpose line is matched by substring
 * @hq:invariant the caller supplies the actions: this module builds none, resolves no handler, calls no transport, and writes nothing
 * @hq:invariant status is reported, never used to hide a match — whether a `declared` action may run is the caller's decision, not the router's
 * @hq:why ties break on the action id: the same sentence must rank the same way twice, or `hq do` becomes a coin flip
 * @hq:why apostrophes are removed before splitting so a contraction yields `dont`, not a bare `t` that would substring-hit almost every purpose line
 * @hq:see hq/lib/channel-seats.mjs
 */

/** Weights are the whole ranking policy, named once so a caller can read a score without opening this file. */
export const WEIGHTS = Object.freeze({ object: 3, verb: 2, domain: 2, purpose: 1 });

export const DEFAULT_LIMIT = 5;

/** The one failure code. There is deliberately no second fallback code. */
export const NO_MATCH = 'NO_MATCH';

/** Dropped before scoring: they carry no selection signal and would match nearly every action. */
export const STOPWORDS = Object.freeze(new Set([
  'the', 'a', 'an', 'to', 'for', 'of', 'my', 'please', 'can', 'you', 'me', 'it', 'all', 'and', 'or', 'in', 'on',
]));

/**
 * An action is handed in, never constructed here. `handler` is opaque to the
 * router — naming it in a match is not authority to run it.
 *
 * @typedef {object} Action
 * @property {string} id
 * @property {string} domain
 * @property {string} verb
 * @property {string} object
 * @property {string} purpose
 * @property {string} risk
 * @property {boolean} mutates
 * @property {string[]} actors
 * @property {string} approval
 * @property {'wired'|'declared'} status
 * @property {any} handler
 *
 * @typedef {{ action: any, score: number, why: string[] }} ActionMatch
 *
 * @typedef {object} RouteResult
 * @property {boolean} ok
 * @property {'NO_MATCH'} [code]
 * @property {string} query
 * @property {string[]} tokens
 * @property {ActionMatch[]} matches
 */

/**
 * Lowercase word tokens, punctuation gone, stopwords dropped. Duplicates are
 * kept here (tokenization is faithful); scoring de-duplicates.
 *
 * @param {any} text
 * @returns {string[]}
 */
export function tokenize(text) {
  const raw = String(text ?? '')
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .split(/[^\p{L}\p{N}]+/u);
  /** @type {string[]} */
  const tokens = [];
  for (const word of raw) {
    if (!word || STOPWORDS.has(word)) continue;
    tokens.push(word);
  }
  return tokens;
}

/**
 * One action's score against already-tokenized text.
 *
 * @param {any} action
 * @param {string[]|string} tokens
```

_First 80 of 206 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
