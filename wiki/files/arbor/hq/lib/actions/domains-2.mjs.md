# File: hq/lib/actions/domains-2.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/actions/domains-2.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13037 B |
| Lines | 270 |
| Hash | 2728bf55444a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DOMAINS | const | 39 | yes | export const DOMAINS = Object.freeze([ Object.freeze({ name: &#39;approval&#39;, purpose: &#39;Owner consent for an agent action: one append-only queue where a request is asked once and decided once.&#39;, objects: … |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/wiki.mjs](../wiki.mjs.md) | ./actions/domains-2.mjs |
| [hq/test/action-map.test.mjs](../../test/action-map.test.mjs.md) | ../lib/actions/domains-2.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Action domains, second group — the five object vocabularies (approval, revocation, task, inbox, bot) that the registry lane composes into action ids, each object named after a thing that a module in … |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | action-domains |
| 6 | invariant | — | — | each domain lists exactly ten objects, and an object name is unique inside its domain: an action id is `domain.object`, so a duplicate would silently overwrite a registry row |
| 7 | invariant | — | — | object names are lowercase-hyphenated and purpose is one sentence, because the router matches an object as an exact token and only the purpose by substring |
| 8 | invariant | — | — | the order of DOMAINS is approval, revocation, task, inbox, bot — a consumer may index the array, never reorder it |
| 9 | invariant | — | — | this table describes objects only: it declares no verb, resolves no handler, mutates nothing, and is not authority to run anything |
| 10 | why | — | — | the objects are read off the modules rather than invented: `hq/lib/approvals.mjs` owns request/decision/queue/expiry, `revocations.mjs` owns subject/kind/reason/ledger, `task-lifecycle.mjs` owns the … |
| 11 | see | — | hq/lib/actions/verbs.mjs | hq/lib/actions/verbs.mjs |
| 12 | see | — | hq/lib/action-router.mjs | hq/lib/action-router.mjs |
| 13 | see | — | doc:docs/CANON-DECISIONS.md | doc:docs/CANON-DECISIONS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Action domains, second group — the five object vocabularies (approval, revocation, task, inbox, bot) that the registry lane composes into action ids, each object named after a thing that a module in this repo already holds.
 * @hq:owner hq-agent
 * @hq:task action-domains
 * @hq:invariant each domain lists exactly ten objects, and an object name is unique inside its domain: an action id is `domain.object`, so a duplicate would silently overwrite a registry row
 * @hq:invariant object names are lowercase-hyphenated and purpose is one sentence, because the router matches an object as an exact token and only the purpose by substring
 * @hq:invariant the order of DOMAINS is approval, revocation, task, inbox, bot — a consumer may index the array, never reorder it
 * @hq:invariant this table describes objects only: it declares no verb, resolves no handler, mutates nothing, and is not authority to run anything
 * @hq:why the objects are read off the modules rather than invented: `hq/lib/approvals.mjs` owns request/decision/queue/expiry, `revocations.mjs` owns subject/kind/reason/ledger, `task-lifecycle.mjs` owns the MOVES table, `comms-roof.mjs` owns probeInboxes, and the playbook `bots.mjs` owns the roster and lane surface — a domain that names nothing real would route to a dead handler
 * @hq:see hq/lib/actions/verbs.mjs
 * @hq:see hq/lib/action-router.mjs
 * @hq:see doc:docs/CANON-DECISIONS.md
 */

/**
 * One thing a domain acts on, named so `domain.object` reads as a noun phrase.
 *
 * @typedef {object} DomainObject
 * @property {string} name Lowercase, hyphenated, unique inside its domain.
 * @property {string} purpose One sentence: what this object is, in this codebase.
 */

/**
 * One product domain and the ten objects it exposes.
 *
 * @typedef {object} Domain
 * @property {string} name Lowercase, hyphenated.
 * @property {string} purpose One sentence: what the domain is for.
 * @property {ReadonlyArray<Readonly<DomainObject>>} objects Exactly ten.
 */

/**
 * The five domains in registry order. Frozen at both levels so a caller cannot
 * append an eleventh object to a domain that the ten-object convention closed.
 *
 * @type {ReadonlyArray<Readonly<Domain>>}
 */
export const DOMAINS = Object.freeze([
  Object.freeze({
    name: 'approval',
    purpose: 'Owner consent for an agent action: one append-only queue where a request is asked once and decided once.',
    objects: Object.freeze([
      Object.freeze({
        name: 'request',
        purpose: 'The ask: the action an agent would perform and the target it would touch, with the requesting agent named.',
      }),
      Object.freeze({
        name: 'decision',
        purpose: 'The single allow-or-deny line for one request, refused as ALREADY_DECIDED once a decision exists.',
      }),
      Object.freeze({
        name: 'queue',
        purpose: 'The append-only JSONL the caller names, one JSON object per line, where a request and a decision are new lines and never a rewrite.',
      }),
      Object.freeze({
        name: 'expiry',
        purpose: 'The expiry derived from an explicit ISO stamp or a minute TTL and evaluated at read time, so a request that went stale cannot be approved afterwards.',
      }),
      Object.freeze({
        name: 'approver',
        purpose: 'The `by` recorded on the decision, left null when the decider does not name itself.',
      }),
      Object.freeze({
        name: 'note',
        purpose: 'The optional free text carried on the decision, so the reason sits beside the verdict it explains.',
      }),
      Object.freeze({
        name: 'scope',
        purpose: 'The boundary a grant covers when it is deliberately narrower than the whole target.',
      }),
      Object.freeze({
        name: 'policy',
        purpose: 'The stated rules: an action and a target are mandatory, the verdict is only allow or deny, and one request takes exactly one decision.',
      }),
      Object.freeze({
        name: 'escalation',
        purpose: 'An expired request, which the module answers by telling the caller to enqueue the action again rather than approve a stale one.',
      }),
      Object.freeze({
```

_First 80 of 271 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
