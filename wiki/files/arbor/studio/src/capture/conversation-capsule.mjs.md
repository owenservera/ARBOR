# File: studio/src/capture/conversation-capsule.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/conversation-capsule.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10825 B |
| Lines | 143 |
| Hash | bd2bacf11b1d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CAPSULE_SCHEMA | const | 16 | yes | export const CAPSULE_SCHEMA = &#39;aion.capability-capsule/1&#39;; |
| CAPSULE_VERSION | const | 17 | yes | export const CAPSULE_VERSION = 1; |
| AVAILABILITY | const | 18 | yes | export const AVAILABILITY = Object.freeze([&#39;supported&#39;, &#39;unavailable&#39;, &#39;unverified&#39;]); |
| op | function | 20 | no | const op = (name, availability, { reason = null, evidence = [] } = {}) =&gt; |
| buildCapabilityCapsule | function | 23 | yes | export function buildCapabilityCapsule({ view, profile = null } = {}) { |
| site | const | 25 | no | const site = view.site ?? null; |
| adapter | const | 26 | no | const adapter = profile ?? null; |
| identity | const | 27 | no | const identity = view.identity ?? { state: &#39;unknown&#39; }; |
| readiness | const | 28 | no | const readiness = view.readiness ?? { ready: false }; |
| state | const | 29 | no | const state = view.state ?? &#39;disconnected&#39;; |
| finished | const | 30 | no | const finished = state === &#39;closed&#39; \|\| (view.diagnostic?.finishPhase != null &amp;&amp; view.diagnostic.finishPhase !== &#39;idle&#39;); |
| recovered | const | 31 | no | const recovered = (view.limitations ?? []).some((l) =&gt; String(l).includes(&#39;Recovered snapshot&#39;)); |
| capturedAt | const | 32 | no | const capturedAt = new Date().toISOString(); |
| read | function | 34 | no | const read = (() =&gt; { if (state === &#39;disconnected&#39;) return op(&#39;read_conversation&#39;, &#39;unavailable&#39;, { reason: &#39;NOT_CONNECTED&#39;, evidence: [&#39;conversation state is disconnected&#39;] }); if (finished) return … |
| submit | function | 47 | no | const submit = (() =&gt; { if (finished) return op(&#39;submit_conversation_turn&#39;, &#39;unavailable&#39;, { reason: &#39;CONVERSATION_FINISHED&#39;, evidence: [`state ${state}`] }); if (recovered \|\| view.recovery?.pending … |
| fresh | const | 53 | no | const fresh = threadSupported(site) &amp;&amp; identity.state === &#39;unbound&#39; &amp;&amp; identity.reason === &#39;NEW_CHAT&#39; |
| stop | function | 67 | no | const stop = (() =&gt; { // Generation stop is a provider control; the runtime has no stop-generation operation today. // Report honestly instead of pretending finish_conversation stops the model. retur… |
| renameNative | function | 73 | no | const renameNative = (() =&gt; { // Rename is a provider-side title control the runtime does not implement. Declared as absent so a // consumer cannot read the omission as permission. return op(&#39;rename_… |
| branchNative | function | 80 | no | const branchNative = (() =&gt; { // Branching creates a new thread identity; it needs exact-thread, ownership and readback gates // that do not exist in the runtime, so it is declared absent rather than… |
| editNative | function | 87 | no | const editNative = (() =&gt; { // Editing a sent turn rewrites the thread&#39;s own history; with no measured edit control and no // readback of the rewritten turn, absence must not read as permission. retu… |
| regenerateNative | function | 94 | no | const regenerateNative = (() =&gt; { // Regeneration replaces an existing reply, so it needs reply-identity fencing and a new-reply // readback the runtime does not have. return op(&#39;regenerate&#39;, &#39;unavai… |
| reconcile | function | 101 | no | const reconcile = (() =&gt; { if (state === &#39;disconnected&#39;) return op(&#39;reconcile_conversation&#39;, &#39;unavailable&#39;, { reason: &#39;NOT_CONNECTED&#39; }); if (view.writer?.active === true) return op(&#39;reconcile_conver… |
| finish | function | 107 | no | const finish = (() =&gt; { if (finished) return op(&#39;finish_conversation&#39;, &#39;unavailable&#39;, { reason: &#39;CONVERSATION_FINISHED&#39; }); return op(&#39;finish_conversation&#39;, &#39;supported&#39;, { evidence: [&#39;stops owned cap… |
| closeTab | function | 112 | no | const closeTab = (() =&gt; { const owned = view.binding?.ownedByStudio === true; if (!owned) return op(&#39;close_tab&#39;, &#39;unavailable&#39;, { reason: &#39;TAB_NOT_STUDIO_OWNED&#39;, evidence: [&#39;Studio never closes an ow… |
| owned | const | 113 | no | const owned = view.binding?.ownedByStudio === true; |
| modelSelection | function | 121 | no | const modelSelection = (() =&gt; { const hasControl = Array.isArray(adapter?.preflight?.modelSelectors) &amp;&amp; adapter.preflight.modelSelectors.length &gt; 0; return op(&#39;change_model&#39;, hasControl ? &#39;unverified… |
| hasControl | const | 122 | no | const hasControl = Array.isArray(adapter?.preflight?.modelSelectors) &amp;&amp; adapter.preflight.modelSelectors.length &gt; 0; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./conversation-thread.mjs | import | 14 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-runtime.mjs](./conversation-runtime.mjs.md) | ./conversation-capsule.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Page-local capability capsule (CONTRACTS Availability semantics; bench E08): what THIS bound
// conversation can do RIGHT NOW, derived only from the runtime's own evidence — never from
// product marketing, a static command catalog, or another provider's contract.
//
// Availability values: 'supported' (the runtime's own gates would admit the operation on the
// current evidence), 'unavailable' (a gate visibly refuses, with the exact reason), 'unverified'
// (the evidence needed to decide has not been observed). The capsule is ADVISORY evidence for
// agents and the UI: the runtime re-checks every gate at effect time, so the capsule cannot
// bypass fencing — it can only describe it.
//
// Pure function over the conversation view + the site profile's measured selectors (the caller
// supplies the profile via the sites registry). No I/O, no registry import: this stays a pure
// projection so tests can feed synthetic views and profiles.
import { threadSupported } from './conversation-thread.mjs';

export const CAPSULE_SCHEMA = 'aion.capability-capsule/1';
export const CAPSULE_VERSION = 1;
export const AVAILABILITY = Object.freeze(['supported', 'unavailable', 'unverified']);

const op = (name, availability, { reason = null, evidence = [] } = {}) =>
  ({ operation: name, availability, ...(reason ? { reason } : {}), evidence });

export function buildCapabilityCapsule({ view, profile = null } = {}) {
  if (!view || typeof view !== 'object') throw new TypeError('buildCapabilityCapsule: view is required');
  const site = view.site ?? null;
  const adapter = profile ?? null;
  const identity = view.identity ?? { state: 'unknown' };
  const readiness = view.readiness ?? { ready: false };
  const state = view.state ?? 'disconnected';
  const finished = state === 'closed' || (view.diagnostic?.finishPhase != null && view.diagnostic.finishPhase !== 'idle');
  const recovered = (view.limitations ?? []).some((l) => String(l).includes('Recovered snapshot'));
  const capturedAt = new Date().toISOString();

  const read = (() => {
    if (state === 'disconnected') return op('read_conversation', 'unavailable', { reason: 'NOT_CONNECTED', evidence: ['conversation state is disconnected'] });
    if (finished) return op('read_conversation', 'unavailable', { reason: 'CONVERSATION_FINISHED', evidence: ['finalization already requested; live reader is closed'] });
    if (identity.state === 'unverified') return op('read_conversation', 'unavailable', { reason: 'THREAD_IDENTITY_UNVERIFIED', evidence: [`identity reason: ${identity.reason ?? 'unknown'}`] });
    if (recovered || view.recovery?.pending === true || identity.state === 'unknown') return op('read_conversation', 'unverified', { reason: 'READ_REQUIRES_LIVE_CONVERSATION', evidence: ['no proven live writable browser attachment'] });
    // A live, verified conversation can be read by the runtime (bounded transcript, zero send).
    // Whether the ADAPTER exposes a transcript reader is effect-time knowledge; unverified beats a guess.
    if (adapter?.assistant?.containerSelectors?.length || adapter?.composer?.selectors?.length) {
      return op('read_conversation', 'supported', { evidence: ['live conversation attached', `identity ${identity.state}`, 'site profile carries measured turn/composer selectors'] });
    }
    return op('read_conversation', 'unverified', { reason: 'READ_UNAVAILABLE', evidence: ['no measured turn selectors in the site profile'] });
  })();

  const submit = (() => {
    if (finished) return op('submit_conversation_turn', 'unavailable', { reason: 'CONVERSATION_FINISHED', evidence: [`state ${state}`] });
    if (recovered || view.recovery?.pending === true)
      return op('submit_conversation_turn', 'unavailable', { reason: 'CONVERSATION_NOT_WRITABLE', evidence: ['no live writable owner; recovery cannot resume a send'] });
    // The send selectors and strategy belong to one site profile. A view for another site must never inherit them.
    if (adapter?.id && site && adapter.id !== site) return op('submit_conversation_turn', 'unavailable', { reason: 'SITE_PROFILE_MISMATCH', evidence: [`view site ${site} does not match profile ${adapter.id}`] });
    const fresh = threadSupported(site) && identity.state === 'unbound' && identity.reason === 'NEW_CHAT'
      && view.binding?.ownedByStudio === true && !view.binding?.thread && state === 'ready';
    if (identity.state !== 'bound' && !fresh) return op('submit_conversation_turn', 'unavailable', { reason: 'THREAD_IDENTITY_UNVERIFIED', evidence: [`identity ${identity.state}${identity.reason ? ` (${identity.reason})` : ''}`] });
    if (!adapter?.composer?.selectors?.length) return op('submit_conversation_turn', 'unavailable', { reason: 'COMPOSER_UNAVAILABLE', evidence: [`no measured composer selectors for ${site}`] });
    if (!adapter?.send) return op('submit_conversation_turn', 'unavailable', { reason: 'SEND_CONTROL_UNAVAILABLE', evidence: [`no measured send strategy for ${site}`] });
    if (view.writer?.active === true) return op('submit_conversation_turn', 'unavailable', { reason: 'WRITER_WINDOW_BUSY', evidence: ['an unresolved turn holds the writer window'] });
    if (readiness?.ready !== true) return op('submit_conversation_turn', 'unverified', { reason: readiness?.reason ?? 'NOT_CHECKED', evidence: ['run an explicit read-only readiness check first'] });
    return op('submit_conversation_turn', 'supported', {
      evidence: [fresh ? 'owned NEW_CHAT ready for first-turn typing; exact thread binding (/c/ or /chat/) must be pinned after delivery' : 'exact thread bound',
        `measured composer selectors: ${adapter.composer.selectors.length}`, 'writer window idle',
        'effect-time gates still apply: confirm:true, expectedRevision, durable key, per-turn capture'],
    });
  })();

  const stop = (() => {
    // Generation stop is a provider control; the runtime has no stop-generation operation today.
    // Report honestly instead of pretending finish_conversation stops the model.
    return op('stop_generation', 'unavailable', { reason: 'NOT_IMPLEMENTED_IN_RUNTIME', evidence: ['finish_conversation finalizes capture; it does not stop provider generation'] });
  })();

  const renameNative = (() => {
    // Rename is a provider-side title control the runtime does not implement. Declared as absent so a
    // consumer cannot read the omission as permission.
    return op('rename_conversation', 'unavailable', { reason: 'NOT_IMPLEMENTED_IN_RUNTIME',
      evidence: ['no measured rename control in the site profile; no post-effect title readback defined'] });
  })();

  const branchNative = (() => {
```

_First 80 of 144 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
