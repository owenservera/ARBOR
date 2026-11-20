# File: hq/lib/actions/domains-1.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/actions/domains-1.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7753 B |
| Lines | 104 |
| Hash | b1fd0a2fd850 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DOMAINS | const | 23 | yes | export const DOMAINS = [ |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/wiki.mjs](../wiki.mjs.md) | ./actions/domains-1.mjs |
| [hq/test/action-map.test.mjs](../../test/action-map.test.mjs.md) | ../lib/actions/domains-1.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The first five action domains — bus, seat, thread, cnp, evidence — each carrying the ten objects an action can be performed on. |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | domains-1 |
| 6 | why | — | — | An action registry needs a closed vocabulary of nouns before it can name verbs; these are the nouns the comms system in this repo actually uses. |
| 7 | invariant | — | — | Every domain carries exactly ten objects; each object name is lowercase-hyphenated and unique inside its domain. |
| 8 | invariant | — | — | Data only: no imports, no effects, no provider, browser or send authority. |
| 9 | see | — | docs/COMMS-SYSTEM.md | docs/COMMS-SYSTEM.md · docs/AGENT-BUS.md · hq/lib/cnp.mjs · hq/lib/thread-index.mjs · hq/lib/thread-resolve.mjs · hq/lib/evidence-join.mjs · hq/lib/channel-seats.mjs · hq/lib/seat-heartbeat.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context The first five action domains — bus, seat, thread, cnp, evidence — each carrying the ten objects an action can be performed on.
 * @hq:owner hq-agent
 * @hq:task domains-1
 * @hq:why An action registry needs a closed vocabulary of nouns before it can name verbs; these are the nouns the comms system in this repo actually uses.
 * @hq:invariant Every domain carries exactly ten objects; each object name is lowercase-hyphenated and unique inside its domain.
 * @hq:invariant Data only: no imports, no effects, no provider, browser or send authority.
 * @hq:see docs/COMMS-SYSTEM.md · docs/AGENT-BUS.md · hq/lib/cnp.mjs · hq/lib/thread-index.mjs · hq/lib/thread-resolve.mjs · hq/lib/evidence-join.mjs · hq/lib/channel-seats.mjs · hq/lib/seat-heartbeat.mjs
 */

/**
 * One noun an action can be performed on.
 * @typedef {{ name: string, purpose: string }} DomainObject
 */

/**
 * One action domain and its closed object vocabulary.
 * @typedef {{ name: string, purpose: string, objects: DomainObject[] }} Domain
 */

/** @type {Domain[]} */
export const DOMAINS = [
  {
    name: 'bus',
    purpose: 'The append-only sync bus in scripts/sync.mjs: delivery without wake, proven by a cursor rather than by a reply.',
    objects: [
      { name: 'message', purpose: 'A single addressed record in the ledger, from one identity to another.' },
      { name: 'inbox', purpose: 'The records waiting at an identity cursor that have not been read yet.' },
      { name: 'delivery', purpose: 'That a record landed in an inbox, which is never proof that it was read.' },
      { name: 'claim', purpose: 'A recorded hold on a shared ref so two agents do not edit the same file.' },
      { name: 'ack', purpose: 'A reply naming an earlier record as read and acted on.' },
      { name: 'cursor', purpose: 'The read position a named identity has reached in the ledger.' },
      { name: 'space', purpose: 'A named partition of the bus that scopes which identities and topics it carries.' },
      { name: 'topic', purpose: 'The subject that groups records into one durable conversation.' },
      { name: 'ledger', purpose: 'The append-only log where every record lands and none is rewritten.' },
      { name: 'chain', purpose: 'The prev-digest link that makes a rewritten or excised record fail verify.' },
    ],
  },
  {
    name: 'seat',
    purpose: 'A live ZCode session that can be resumed for one turn, with the guards and journal that make a wake evidence.',
    objects: [
      { name: 'session', purpose: 'The live ZCode conversation a seat actually is, addressed by session id.' },
      { name: 'prompt', purpose: 'The single slice of text sent into a seat session.' },
      { name: 'reply', purpose: 'The captured answer from the turn, and the only proof that the wake landed.' },
      { name: 'journal', purpose: 'The intent and result pair written before and after a wake.' },
      { name: 'roster', purpose: 'The declared seat list with sessions, manager and write scopes, read before any wake.' },
      { name: 'scope', purpose: 'The paths a seat is allowed to write while it holds a turn.' },
      { name: 'heartbeat', purpose: 'The busy, idle or stale state recorded for a seat over time.' },
      { name: 'wake', purpose: 'One resume instruction delivered into a live session.' },
      { name: 'guard', purpose: 'The refusal check that runs before any transport: unknown seat, secret in prompt, empty prompt, seat active.' },
      { name: 'transport', purpose: 'The mechanism that carries a prompt into a session, here CLI resume rather than ACP.' },
    ],
  },
  {
    name: 'thread',
    purpose: 'The thread index and its resolution: one row per conversation, named beside the receipts rather than inside them.',
    objects: [
      { name: 'index', purpose: 'The built list joining sessions, inbox threads and receipts into one row per conversation.' },
      { name: 'row', purpose: 'One conversation in that list, carrying every source that named it.' },
      { name: 'placeholder', purpose: 'A fake thread id such as chatgpt-live-tab or t1 that must never become a conversation key.' },
      { name: 'name', purpose: 'The CNP name a conversation resolves to, or nothing when identity was never stored.' },
      { name: 'resolution', purpose: 'The naming pass that gives a receipt thread an identity without editing the receipt.' },
      { name: 'provenance', purpose: 'The basis value saying a row identity was stored, named, or unknown.' },
      { name: 'merge', purpose: 'Two sources resolving to the same name fold into one row, never two.' },
      { name: 'binding', purpose: 'The agent-to-session pair that connects a seat to the thread it ran in.' },
      { name: 'title', purpose: 'The session title, the one place where a binding is inferred rather than declared.' },
      { name: 'resume', purpose: 'The session a thread continues into on its next turn, which is how identity survives.' },
    ],
  },
  {
    name: 'cnp',
    purpose: 'The CNP/1 name grammar in hq/lib/cnp.mjs and the Registry that binds each name to one node id.',
    objects: [
      { name: 'stem', purpose: 'The indexed identity string cnp1;d=;l=;o=;c=; and nothing beyond it.' },
      { name: 'domain', purpose: 'The lowercase scope a name belongs to, one to 32 characters wide.' },
      { name: 'lineage', purpose: 'The dotted segment path that places a name under its parent, one to 9999 per segment.' },
      { name: 'depth', purpose: 'How many segments a lineage carries, never more than eight.' },
      { name: 'owner', purpose: 'The attribute naming who holds a name; a transfer never moves the node.' },
```

_First 80 of 105 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
