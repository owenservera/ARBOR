# File: hq/lib/actions/verbs.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/actions/verbs.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4369 B |
| Lines | 115 |
| Hash | 82ff7c2c611a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VERBS | const | 34 | yes | export const VERBS = Object.freeze([ Object.freeze({ verb: &#39;list&#39;, purpose: &#39;Read every matching object without changing any of them.&#39;, risk: /** @type {VerbRisk} */ (&#39;low&#39;), |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/actions/verbs.mjs |
| [hq/lib/wiki.mjs](../wiki.mjs.md) | ./actions/verbs.mjs |
| [hq/test/action-map.test.mjs](../../test/action-map.test.mjs.md) | ../lib/actions/verbs.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Action verbs — the closed ten-verb vocabulary (list, show, create, update, delete, validate, repair, export, watch, dispatch) with the risk, mutation, actor and approval facts that gate each one. |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | action-verbs |
| 6 | invariant | — | — | the ten verbs are closed and ordered: list, show, create, update, delete, validate, repair, export, watch, dispatch — a consumer may index the array, never extend it |
| 7 | invariant | — | — | approval is true exactly when risk is &#39;high&#39;: a destructive or exfiltrating action is approved before it runs, never after |
| 8 | invariant | — | — | mutates is false only for the read-only verbs list, show, validate and watch; every other verb changes state |
| 9 | invariant | — | — | the app actor may read and may produce work (create, dispatch) but may never update, repair, delete or export |
| 10 | why | — | — | one stated table instead of predicates: the registry, approval and dispatch lanes must agree on the same facts, so the facts live in one place and are read, not re-derived |
| 11 | see | — | doc:docs/CANON-DECISIONS.md | doc:docs/CANON-DECISIONS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Action verbs — the closed ten-verb vocabulary (list, show, create, update, delete, validate, repair, export, watch, dispatch) with the risk, mutation, actor and approval facts that gate each one.
 * @hq:owner hq-agent
 * @hq:task action-verbs
 * @hq:invariant the ten verbs are closed and ordered: list, show, create, update, delete, validate, repair, export, watch, dispatch — a consumer may index the array, never extend it
 * @hq:invariant approval is true exactly when risk is 'high': a destructive or exfiltrating action is approved before it runs, never after
 * @hq:invariant mutates is false only for the read-only verbs list, show, validate and watch; every other verb changes state
 * @hq:invariant the app actor may read and may produce work (create, dispatch) but may never update, repair, delete or export
 * @hq:why one stated table instead of predicates: the registry, approval and dispatch lanes must agree on the same facts, so the facts live in one place and are read, not re-derived
 * @hq:see doc:docs/CANON-DECISIONS.md
 */

/**
 * @typedef {'low'|'medium'|'high'} VerbRisk
 * @typedef {'user'|'agent'|'app'} VerbActor
 * @typedef {{
 *   verb: string,
 *   purpose: string,
 *   risk: VerbRisk,
 *   mutates: boolean,
 *   actors: VerbActor[],
 *   approval: boolean,
 * }} Verb
 */

/**
 * Risk ladder: a verb that only reads is low; a verb that writes but can be
 * repeated or reversed is medium; a verb that destroys, rewrites or exfiltrates
 * is high. Approval follows the ladder: only high-risk verbs require it.
 *
 * @type {ReadonlyArray<Readonly<Verb>>}
 */
export const VERBS = Object.freeze([
  Object.freeze({
    verb: 'list',
    purpose: 'Read every matching object without changing any of them.',
    risk: /** @type {VerbRisk} */ ('low'),
    mutates: false,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
    approval: false,
  }),
  Object.freeze({
    verb: 'show',
    purpose: 'Read one object in full without changing it.',
    risk: /** @type {VerbRisk} */ ('low'),
    mutates: false,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
    approval: false,
  }),
  Object.freeze({
    verb: 'create',
    purpose: 'Write a new object into existence.',
    risk: /** @type {VerbRisk} */ ('medium'),
    mutates: true,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
    approval: false,
  }),
  Object.freeze({
    verb: 'update',
    purpose: 'Change the stored fields of an existing object.',
    risk: /** @type {VerbRisk} */ ('medium'),
    mutates: true,
    actors: /** @type {VerbActor[]} */ (['user', 'agent']),
    approval: false,
  }),
  Object.freeze({
    verb: 'delete',
    purpose: 'Remove an object permanently.',
    risk: /** @type {VerbRisk} */ ('high'),
    mutates: true,
    actors: /** @type {VerbActor[]} */ (['user', 'agent']),
    approval: true,
  }),
  Object.freeze({
    verb: 'validate',
    purpose: 'Check an object against its rules and report what fails.',
    risk: /** @type {VerbRisk} */ ('low'),
    mutates: false,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
```

_First 80 of 116 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
