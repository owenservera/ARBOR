# File: hq/lib/action-registry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/action-registry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11977 B |
| Lines | 286 |
| Hash | 872023fd20be |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ACTION_STATUSES | const | 27 | yes | export const ACTION_STATUSES = Object.freeze(/** @type {const} */ ([&#39;wired&#39;, &#39;declared&#39;])); |
| RISK_LEVELS | const | 30 | yes | export const RISK_LEVELS = Object.freeze(/** @type {const} */ ([&#39;low&#39;, &#39;medium&#39;, &#39;high&#39;])); |
| DEFAULT_RISK | const | 33 | yes | export const DEFAULT_RISK = &#39;medium&#39;; |
| NO_ACTOR | const | 36 | yes | export const NO_ACTOR = &#39;(none)&#39;; |
| UNKNOWN | const | 39 | yes | export const UNKNOWN = &#39;(unknown)&#39;; |
| oneLine | function | 42 | no | function oneLine(value) { |
| segment | function | 50 | no | function segment(value, label) { |
| text | const | 51 | no | const text = oneLine(value).toLowerCase(); |
| actorList | function | 58 | no | function actorList(value) { |
| out | const | 60 | no | const out = []; |
| actor | const | 62 | no | const actor = oneLine(raw); |
| actorKey | function | 69 | no | function actorKey(value) { |
| actors | const | 70 | no | const actors = actorList(value); |
| purposeLine | function | 79 | no | function purposeLine({ verb, object, domainPurpose, objectPurpose }) { |
| subject | const | 80 | no | const subject = `${verb} ${object}`; |
| detail | const | 81 | no | const detail = [oneLine(domainPurpose), oneLine(objectPurpose)].filter(Boolean).join(&#39;: &#39;); |
| handlerIndex | function | 86 | no | function handlerIndex(handlers) { |
| index | const | 88 | no | const index = new Map(); |
| id | const | 91 | no | const id = oneLine(key).toLowerCase(); |
| actionId | function | 104 | yes | export function actionId(domain, verb, object) { |
| buildActions | function | 124 | yes | export function buildActions({ domains, verbs, handlers } = {}) { |
| index | const | 128 | no | const index = handlerIndex(handlers); |
| idsPerDomain | const | 130 | no | const idsPerDomain = new Map(); |
| actions | const | 132 | no | const actions = []; |
| domainName | const | 135 | no | const domainName = segment(domain?.name, &#39;domain name&#39;); |
| domainPurpose | const | 136 | no | const domainPurpose = oneLine(domain?.purpose); |
| objects | const | 137 | no | const objects = Array.isArray(domain?.objects) ? domain.objects : []; |
| seen | const | 141 | no | const seen = /** @type {Set&lt;string&gt;} */ (idsPerDomain.get(domainName)); |
| verbName | const | 144 | no | const verbName = segment(verb?.verb, &#39;verb&#39;); |
| handler | const | 145 | no | const handler = index.get(`${domainName}.${verbName}`) ?? null; |
| objectName | const | 148 | no | const objectName = segment(object?.name, &#39;object name&#39;); |
| id | const | 149 | no | const id = `${domainName}.${verbName}.${objectName}`; |
| tally | function | 180 | no | function tally(counts, key) { |
| sortedCounts | function | 188 | no | function sortedCounts(counts) { |
| out | const | 190 | no | const out = {}; |
| summarize | function | 209 | yes | export function summarize(actions) { |
| list | const | 210 | no | const list = Array.isArray(actions) ? actions : []; |
| byStatus | const | 211 | no | const byStatus = new Map(); |
| byDomain | const | 212 | no | const byDomain = new Map(); |
| byRisk | const | 213 | no | const byRisk = new Map(); |
| byActor | const | 214 | no | const byActor = new Map(); |
| problem | function | 233 | no | function problem(problems, code, id, detail) { |
| validate | function | 254 | yes | export function validate(actions) { |
| list | const | 255 | no | const list = Array.isArray(actions) ? actions : []; |
| problems | const | 257 | no | const problems = []; |
| seen | const | 259 | no | const seen = new Set(); |
| id | const | 262 | no | const id = oneLine(action?.id); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/action-registry.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/action-registry.mjs |
| [hq/lib/wiki.mjs](./wiki.mjs.md) | ./action-registry.mjs |
| [hq/test/action-map.test.mjs](../test/action-map.test.mjs.md) | ../lib/action-registry.mjs |
| [hq/test/action-registry-builder.test.mjs](../test/action-registry-builder.test.mjs.md) | ../lib/action-registry.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Build the action registry: expand domains x objects x verbs into one flat action list, then summarize and validate it |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | action-registry |
| 6 | invariant | — | — | an action id is `&lt;domain&gt;.&lt;verb&gt;.&lt;object&gt;`, and a repeat inside one domain throws — nothing is silently deduped |
| 7 | invariant | — | — | `handlers[&#39;&lt;domain&gt;.&lt;verb&gt;&#39;]` is the only difference between `wired` and `declared`; there is no other promotion path |
| 8 | invariant | — | — | this module ships no taxonomy of its own: domains, verbs and handlers are always injected by the caller |
| 9 | invariant | — | — | each summary map is a partition of the list, so every one of them sums back to `total` |
| 10 | see | — | hq/lib/channel-seats.mjs | hq/lib/channel-seats.mjs |
| 11 | see | — | doc:docs/AGENTIC-RULEBOOK.md | doc:docs/AGENTIC-RULEBOOK.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Build the action registry: expand domains x objects x verbs into one flat action list, then summarize and validate it
 * @hq:owner hq-agent
 * @hq:task action-registry
 * @hq:invariant an action id is `<domain>.<verb>.<object>`, and a repeat inside one domain throws — nothing is silently deduped
 * @hq:invariant `handlers['<domain>.<verb>']` is the only difference between `wired` and `declared`; there is no other promotion path
 * @hq:invariant this module ships no taxonomy of its own: domains, verbs and handlers are always injected by the caller
 * @hq:invariant each summary map is a partition of the list, so every one of them sums back to `total`
 * @hq:see hq/lib/channel-seats.mjs
 * @hq:see doc:docs/AGENTIC-RULEBOOK.md
 */

/**
 * @typedef {{ name: string, purpose?: string, objects?: Array<{ name: string, purpose?: string }> }} Domain
 * @typedef {{ verb: string, purpose?: string, risk?: string, mutates?: boolean, actors?: string[], approval?: boolean }} Verb
 * @typedef {{ command?: string, note?: string }} Handler
 * @typedef {{
 *   id: string, domain: string, verb: string, object: string, purpose: string,
 *   risk: string, mutates: boolean, actors: string[], approval: boolean,
 *   status: 'wired' | 'declared', handler: Handler | null,
 * }} Action
 * @typedef {{ code: string, id: string, detail: string }} Problem
 */

/** The two states an action can be in. A third state would have to name a third handler story. */
export const ACTION_STATUSES = Object.freeze(/** @type {const} */ (['wired', 'declared']));

/** Risk is an ordered vocabulary, not free text: `high` is the level that demands approval. */
export const RISK_LEVELS = Object.freeze(/** @type {const} */ (['low', 'medium', 'high']));

/** A verb that forgets to state its risk is treated as unremarkable, and `summarize` still counts it. */
export const DEFAULT_RISK = 'medium';

/** The bucket a summary uses for an action that names no actor, so `byActor` still covers the whole list. */
export const NO_ACTOR = '(none)';

/** The bucket a summary uses for a missing or unreadable dimension, so its map still sums to `total`. */
export const UNKNOWN = '(unknown)';

/** Collapse any text to one trimmed, single-spaced line. */
function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Normalize one segment of an id. The id is an addressing scheme — `domain.verb.object`
 * is also the handler key prefix — so a segment may not carry whitespace or a dot.
 */
function segment(value, label) {
  const text = oneLine(value).toLowerCase();
  if (!text) throw new Error(`an action id needs a ${label}; got "${oneLine(value)}"`);
  if (/[.\s]/.test(text)) throw new Error(`an action id ${label} cannot carry whitespace or a dot: "${text}"`);
  return text;
}

/** The normalized actors of a verb/action: blanks dropped, repeats dropped, order kept. */
function actorList(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const raw of value) {
    const actor = oneLine(raw);
    if (actor && !out.includes(actor)) out.push(actor);
  }
  return out;
}

/** The key `byActor` counts under. A multi-actor action keys by its actor set, so the map stays a partition. */
function actorKey(value) {
  const actors = actorList(value);
  return actors.length ? actors.join('+') : NO_ACTOR;
}

/**
 * The one readable line an action carries:
 * `${verb} ${object} — ${domainPurpose}: ${objectPurpose}`.
 * A purpose that is absent degrades to the shorter line rather than to dangling punctuation.
 */
function purposeLine({ verb, object, domainPurpose, objectPurpose }) {
  const subject = `${verb} ${object}`;
```

_First 80 of 287 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
