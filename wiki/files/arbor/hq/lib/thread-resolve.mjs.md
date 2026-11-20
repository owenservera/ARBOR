# File: hq/lib/thread-resolve.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/thread-resolve.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5966 B |
| Lines | 147 |
| Hash | a5682be9552a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SYNTHETIC_KEY | const | 19 | no | const SYNTHETIC_KEY = /^(thread\|receipt):/; |
| RECEIPT_DIGEST | const | 27 | no | const RECEIPT_DIGEST = /^[0-9a-f]{64}$/; |
| open | function | 34 | no | function open(registryFile) { |
| sessionOf | function | 50 | no | function sessionOf(entry) { |
| key | const | 51 | no | const key = typeof entry?.key === &#39;string&#39; ? entry.key.trim() : &#39;&#39;; |
| resolveByName | function | 66 | yes | export function resolveByName({ registryFile, name } = {}) { |
| registry | const | 67 | no | const registry = open(registryFile); |
| want | const | 75 | no | const want = String(name ?? &#39;&#39;).trim(); |
| stem | const | 76 | no | const stem = parseNid(want); |
| entry | const | 77 | no | const entry = (stem.ok ? registry.byNid(want) : null) ?? registry.get(want); |
| unknownDetail | function | 89 | no | function unknownDetail(want, stem, registryFile) { |
| resolveSession | function | 104 | yes | export function resolveSession({ registryFile, sessionId } = {}) { |
| registry | const | 105 | no | const registry = open(registryFile); |
| want | const | 107 | no | const want = String(sessionId ?? &#39;&#39;).trim(); |
| names | function | 120 | yes | export function names({ registryFile } = {}) { |
| registry | const | 121 | no | const registry = open(registryFile); |
| rows | const | 123 | no | const rows = Object.keys(registry.doc.byKey).map((key, index) =&gt; { const entry = registry.doc.byKey[key]; return { key, nid: entry?.nid ?? null, boundAt: entry?.boundAt ?? null, index }; }); |
| entry | const | 124 | no | const entry = registry.doc.byKey[key]; |
| fromReceipt | function | 141 | yes | export function fromReceipt({ registryFile, receiptId } = {}) { |
| registry | const | 142 | no | const registry = open(registryFile); |
| want | const | 144 | no | const want = String(receiptId ?? &#39;&#39;).trim(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 11 | external |
| ./cnp.mjs | import | 12 | [hq/lib/cnp.mjs](./cnp.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Thread resume — turn the name a conversation was given back into the session that carries it. |
| 4 | owner | channel-manager | — | channel-manager |
| 5 | task | — | — | cnp-registry |
| 6 | invariant | — | — | read-only: nothing here assigns, saves, or repairs a Registry |
| 7 | invariant | — | — | a name that does not resolve is refused with a code; it is never snapped to a nearby stem |
| 8 | invariant | — | — | a receipt joins a conversation by lookup beside the ledger; the ledger is never rewritten |
| 9 | see | — | hq/lib/cnp.mjs | hq/lib/cnp.mjs (Registry, parseNid) · doc:docs/AGENT-BUS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Thread resume — turn the name a conversation was given back into the session that carries it.
 * @hq:owner channel-manager
 * @hq:task cnp-registry
 * @hq:invariant read-only: nothing here assigns, saves, or repairs a Registry
 * @hq:invariant a name that does not resolve is refused with a code; it is never snapped to a nearby stem
 * @hq:invariant a receipt joins a conversation by lookup beside the ledger; the ledger is never rewritten
 * @hq:see hq/lib/cnp.mjs (Registry, parseNid) · doc:docs/AGENT-BUS.md
 */
import { existsSync } from 'node:fs';
import { Registry, parseNid } from './cnp.mjs';

/**
 * Keys that name a ledger row or a raw thread id rather than a resumable session.
 * cnp.mjs writes `thread:<raw>` for a stored thread, and a caller that binds a
 * receipt by a prefixed key gets the same treatment: neither carries a session.
 */
const SYNTHETIC_KEY = /^(thread|receipt):/;

/**
 * A CNP receipt id is a bare sha256 digest (`resolveChannelThreads` keys the
 * registry by `receiptId`), so a digest names evidence, not a conversation seat.
 * The live registry at C:/VIVIM/channel/threads.json is keyed only by digests —
 * without this rule every receipt would read as a resumable session.
 */
const RECEIPT_DIGEST = /^[0-9a-f]{64}$/;

/**
 * @param {string|undefined} registryFile
 * @returns {Registry|null} null when the file is simply not there; a wrong path is a
 *   data condition, while a missing argument is a programming error.
 */
function open(registryFile) {
  if (typeof registryFile !== 'string' || !registryFile.trim()) {
    throw new Error('a registryFile path is required');
  }
  if (!existsSync(registryFile)) return null;
  return new Registry(registryFile);
}

/**
 * The session a name actually carries. The Registry stores an id, not a fact about
 * what that id is: a session id, a receipt digest, or a synthetic `thread:` key.
 * A key that is neither synthetic nor a digest is the session it was bound to.
 *
 * @param {any} entry
 * @returns {string|null}
 */
function sessionOf(entry) {
  const key = typeof entry?.key === 'string' ? entry.key.trim() : '';
  if (!key || SYNTHETIC_KEY.test(key) || RECEIPT_DIGEST.test(key)) return null;
  if (parseNid(key).ok) return null;   // the name is the key: there is nothing behind it
  return key;
}

/**
 * Resume by name: a Nid stem or a raw registry key. Returns the session to resume
 * (null when the name is real but names evidence rather than a session) plus the
 * Nid and the entry, so a caller never has to parse the registry itself.
 *
 * @param {{registryFile?: string, name?: string}} [opts]
 * @returns {{ok: true, session: string|null, nid: string, entry: any}
 *   | {ok: false, code: 'NO_REGISTRY'|'UNKNOWN_NAME', detail: string}}
 */
export function resolveByName({ registryFile, name } = {}) {
  const registry = open(registryFile);
  if (!registry) {
    return {
      ok: false,
      code: 'NO_REGISTRY',
      detail: `no registry at ${registryFile}; run \`hq threads resolve --write\` first`,
    };
  }
  const want = String(name ?? '').trim();
  const stem = parseNid(want);
  const entry = (stem.ok ? registry.byNid(want) : null) ?? registry.get(want);
  if (!entry || typeof entry.nid !== 'string' || !entry.nid) {
    return { ok: false, code: 'UNKNOWN_NAME', detail: unknownDetail(want, stem, registryFile) };
  }
```

_First 80 of 148 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
