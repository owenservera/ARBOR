# File: hq/lib/actions/domains-3.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/actions/domains-3.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10490 B |
| Lines | 262 |
| Hash | 884e70f09963 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DOMAINS | const | 31 | yes | export const DOMAINS = Object.freeze([ Object.freeze({ name: &#39;anet&#39;, purpose: &#39;The only cross-machine channel: a joined node addressing peers by AID under a closed inbound policy.&#39;, objects: Object.f… |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/wiki.mjs](../wiki.mjs.md) | ./actions/domains-3.mjs |
| [hq/test/action-map.test.mjs](../../test/action-map.test.mjs.md) | ../lib/actions/domains-3.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Registry domain catalogue, part 3 — the five transport and intelligence domains (anet, acp, mcp, index, context) with exactly ten lowercase-hyphenated objects each. |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | domains-3 |
| 6 | invariant | — | — | DOMAINS is ordered anet, acp, mcp, index, context and every domain carries exactly ten objects |
| 7 | invariant | — | — | every object name is unique inside its domain, lowercase-hyphenated, and the array is read-only: a consumer indexes it, never extends it in place |
| 8 | invariant | — | — | a purpose is one sentence stating what the object is, not what it might become |
| 9 | why | — | — | one stated catalogue instead of a live probe: the registry lane needs a stable vocabulary for these objects before separate implementations drift on their naming |
| 10 | see | — | doc:docs/COMMS-SYSTEM.md | doc:docs/COMMS-SYSTEM.md |
| 11 | see | — | doc:hq/lib/mcp.mjs | doc:hq/lib/mcp.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Registry domain catalogue, part 3 — the five transport and intelligence domains (anet, acp, mcp, index, context) with exactly ten lowercase-hyphenated objects each.
 * @hq:owner hq-agent
 * @hq:task domains-3
 * @hq:invariant DOMAINS is ordered anet, acp, mcp, index, context and every domain carries exactly ten objects
 * @hq:invariant every object name is unique inside its domain, lowercase-hyphenated, and the array is read-only: a consumer indexes it, never extends it in place
 * @hq:invariant a purpose is one sentence stating what the object is, not what it might become
 * @hq:why one stated catalogue instead of a live probe: the registry lane needs a stable vocabulary for these objects before separate implementations drift on their naming
 * @hq:see doc:docs/COMMS-SYSTEM.md
 * @hq:see doc:hq/lib/mcp.mjs
 */

/**
 * @typedef {{ name: string, purpose: string }} DomainObject
 * @typedef {{
 *   name: string,
 *   purpose: string,
 *   objects: ReadonlyArray<DomainObject>,
 * }} Domain
 */

/**
 * The five domains, in registry order. Each object is a noun the domain
 * actually exposes on this host, not a speculative capability: anet is the
 * only cross-machine channel, ACP wake is dead here, MCP advertises tools
 * only, and the index holds files/symbols/imports rather than embeddings.
 *
 * @type {ReadonlyArray<Domain>}
 */
export const DOMAINS = Object.freeze([
  Object.freeze({
    name: 'anet',
    purpose: 'The only cross-machine channel: a joined node addressing peers by AID under a closed inbound policy.',
    objects: Object.freeze([
      Object.freeze({
        name: 'identity',
        purpose: 'The key pair and control token under ~/.anet that let a node sign and act, never read or copied by HQ.',
      }),
      Object.freeze({
        name: 'aid',
        purpose: 'The anet agent identifier (bafyreic…ernejqme) that is the only address anet can deliver to.',
      }),
      Object.freeze({
        name: 'node',
        purpose: 'One running anet agent, joined to a hub or not, that peers can address.',
      }),
      Object.freeze({
        name: 'hub',
        purpose: 'The relay a node joins so messages cross machines instead of only local pipes.',
      }),
      Object.freeze({
        name: 'peer',
        purpose: 'Another agent node, carrying our allow, trust or deny state and its spending limits.',
      }),
      Object.freeze({
        name: 'card',
        purpose: 'The public agent card a node advertises so peers can see what it is and does.',
      }),
      Object.freeze({
        name: 'task',
        purpose: 'A unit of delegated work held on the hub and fetched with `anet task get`.',
      }),
      Object.freeze({
        name: 'delegation',
        purpose: 'An `anet delegate` request that hands a task to a peer and returns its handle.',
      }),
      Object.freeze({
        name: 'autoreply',
        purpose: 'The exec policy (`exec/opencode`) that answers inbound messages when no session of ours is running.',
      }),
      Object.freeze({
        name: 'inbound-policy',
        purpose: 'The closed, open or approve gate that decides which inbound messages are accepted.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'acp',
    purpose: 'The agent client protocol surface whose wake path is broken on this host and replaced by CLI resume.',
```

_First 80 of 263 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
