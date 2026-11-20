# File: hq/lib/actions/domains-4.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/actions/domains-4.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10213 B |
| Lines | 260 |
| Hash | 15468379d412 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DOMAINS | const | 29 | yes | export const DOMAINS = Object.freeze([ Object.freeze({ name: &#39;memory&#39;, purpose: &#39;Notes held at three tiers, the rules that promote or retire them, and the provenance that survives every move.&#39;, objec… |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/wiki.mjs](../wiki.mjs.md) | ./actions/domains-4.mjs |
| [hq/test/action-map.test.mjs](../../test/action-map.test.mjs.md) | ../lib/actions/domains-4.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Domain catalog, part four — the memory, wiki, kernel, workspace and ops domains, each with exactly ten objects and one sentence saying what the object is for. |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | domain-catalog |
| 6 | invariant | — | — | the five domains appear in this order: memory, wiki, kernel, workspace, ops — a consumer may index the array, never reorder or extend it |
| 7 | invariant | — | — | every domain carries exactly ten objects; every object name is lowercase-hyphenated and unique inside its domain, so `domain:object` is a stable address |
| 8 | invariant | — | — | a purpose states what an object is for; it never promises an effect, an approval or an execution that HQ does not own |
| 9 | why | — | — | one stated table instead of a registry query: the action, approval and registry lanes must agree on the same domain and object names, so the names live in one place and are read, not re-derived |
| 10 | see | — | hq/lib/memory.mjs | hq/lib/memory.mjs |
| 11 | see | — | hq/lib/wiki.mjs | hq/lib/wiki.mjs |
| 12 | see | — | hq/lib/kernel/store.mjs | hq/lib/kernel/store.mjs |
| 13 | see | — | hq/lib/registry.mjs | hq/lib/registry.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Domain catalog, part four — the memory, wiki, kernel, workspace and ops domains, each with exactly ten objects and one sentence saying what the object is for.
 * @hq:owner hq-agent
 * @hq:task domain-catalog
 * @hq:invariant the five domains appear in this order: memory, wiki, kernel, workspace, ops — a consumer may index the array, never reorder or extend it
 * @hq:invariant every domain carries exactly ten objects; every object name is lowercase-hyphenated and unique inside its domain, so `domain:object` is a stable address
 * @hq:invariant a purpose states what an object is for; it never promises an effect, an approval or an execution that HQ does not own
 * @hq:why one stated table instead of a registry query: the action, approval and registry lanes must agree on the same domain and object names, so the names live in one place and are read, not re-derived
 * @hq:see hq/lib/memory.mjs
 * @hq:see hq/lib/wiki.mjs
 * @hq:see hq/lib/kernel/store.mjs
 * @hq:see hq/lib/registry.mjs
 */

/**
 * @typedef {{ name: string, purpose: string }} DomainObject
 * @typedef {{ name: string, purpose: string, objects: ReadonlyArray<Readonly<DomainObject>> }} Domain
 */

/**
 * The catalog is closed like the verb table: a domain is exactly ten objects,
 * an object is exactly a name and a purpose, and the address of an object is
 * the pair `domain:object`. Anything a lane needs beyond that is looked up in
 * the module that owns the object, never inferred from this table.
 *
 * @type {ReadonlyArray<Readonly<Domain>>}
 */
export const DOMAINS = Object.freeze([
  Object.freeze({
    name: 'memory',
    purpose: 'Notes held at three tiers, the rules that promote or retire them, and the provenance that survives every move.',
    objects: Object.freeze([
      Object.freeze({
        name: 'note',
        purpose: 'One recorded memory unit, addressed by its tier, key and content hash.',
      }),
      Object.freeze({
        name: 'tier',
        purpose: 'The now, later or canon rung that decides how far a note may travel.',
      }),
      Object.freeze({
        name: 'promotion',
        purpose: 'The single-step move of a note up one tier under that tier\'s rule.',
      }),
      Object.freeze({
        name: 'index',
        purpose: 'The stored lookup that lists and filters notes by tier, project and text.',
      }),
      Object.freeze({
        name: 'retention',
        purpose: 'The rule that decides how long an active note stays worth keeping.',
      }),
      Object.freeze({
        name: 'recall',
        purpose: 'The deterministic match of stored notes to a task or query.',
      }),
      Object.freeze({
        name: 'core-memory',
        purpose: 'The owner-confirmed canon tier that no agent may demote.',
      }),
      Object.freeze({
        name: 'owner-confirmation',
        purpose: 'The explicit owner act a canon promotion requires and that no agent can supply.',
      }),
      Object.freeze({
        name: 'provenance',
        purpose: 'The origin, evidence and confidence that travel with a note through every tier.',
      }),
      Object.freeze({
        name: 'prune',
        purpose: 'The archival pass that retires a note no longer earning its place while keeping its record.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'wiki',
    purpose: 'The generated code and documentation wiki: pages built from one index state, with their links, freshness and orphan evidence.',
    objects: Object.freeze([
      Object.freeze({
```

_First 80 of 261 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
