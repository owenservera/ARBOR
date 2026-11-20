# File: studio/src/studio/adapter-learning-pipeline.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adapter-learning-pipeline.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15308 B |
| Lines | 233 |
| Hash | 0c097533d08f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KNOWN_SEEDS | const | 25 | no | const KNOWN_SEEDS=Object.freeze({chatgpt:chatgptSeed,claude:claudeSeed,gemini:geminiSeed}); |
| trustedReadSeed | function | 27 | yes | export function trustedReadSeed(scope) { |
| seed | const | 28 | no | const seed=KNOWN_SEEDS[scope?.siteId]; |
| host | variable | 30 | no | let host;try{host=new URL(scope.origin).hostname;}catch{return null;} |
| sha256hex | function | 34 | no | const sha256hex = (x) =&gt; createHash(&#39;sha256&#39;).update(x).digest(&#39;hex&#39;); |
| coded | function | 35 | no | const coded = (code, extra = {}) =&gt; Object.assign(new Error(code), { code, ...extra }); |
| createCasVersionedStore | function | 47 | yes | export function createCasVersionedStore({ store, lockDir } = {}) { // lockDir is accepted for compatibility and ignored |
| storeName | function | 54 | no | const storeName = (name) =&gt; &#39;i1-&#39; + sha256hex(String(name)).slice(0, 40); |
| sn | const | 60 | no | const sn = storeName(name); |
| rec | const | 62 | no | const rec = store.load(sn); |
| rec | const | 70 | no | const rec = store.compareAndSave(storeName(name), payload, { expectedVersion, changeNote: payload.changeNote \|\| &#39;I1 read-only adapter promotion&#39; }); |
| rec | const | 75 | no | const rec = store.compareAndRollback(storeName(name), targetVersion, { expectedVersion }); |
| createTrustedManifestProvider | function | 81 | yes | export function createTrustedManifestProvider({ sessionsDir } = {}) { |
| verifySession | function | 83 | no | const verifySession = (sessionId) =&gt; { |
| session | variable | 85 | no | let session; |
| doc | const | 88 | no | const doc = readAcceptance(session); |
| rd | const | 93 | no | const rd = rawDigest(session); // independent re-verification against the saved bytes |
| dd | const | 95 | no | const dd = domDigest(session); |
| verifyCapture | function | 99 | no | async function verifyCapture({ scope, source } = {}) { |
| v | const | 101 | no | const v = verifySession(source.sessionId); |
| url | const | 109 | no | const url = v.session.meta?.target?.url; |
| getTrustedManifests | function | 115 | no | async function getTrustedManifests({ scope, training, heldout } = {}) { |
| idOf | function | 116 | no | const idOf = (e) =&gt; (typeof e === &#39;string&#39; ? e : e?.source?.sessionId ?? null); |
| mint | function | 117 | no | const mint = (sessionId) =&gt; { |
| v | const | 118 | no | const v = verifySession(sessionId); |
| seq | const | 120 | no | const seq = v.seqRange; |
| lineage | const | 123 | no | const lineage = sha256hex(JSON.stringify([v.rawDigest, v.domDigest, Array.isArray(seq) ? seq : null])); |
| createStudioLearningPipeline | function | 141 | yes | export function createStudioLearningPipeline({ sessionsDir, store, lockDir } = {}) { |
| provider | const | 142 | no | const provider = createTrustedManifestProvider({ sessionsDir }); |
| casStore | const | 143 | no | const casStore = createCasVersionedStore({ store, lockDir }); |
| rawLearner | const | 148 | no | const rawLearner = createStudioAdapterLearner({ verifyCapture: provider.verifyCapture, store: casStore }); |
| pipeline | const | 149 | no | const pipeline = createGuardedStudioLearner({ verifyCapture: provider.verifyCapture, store: casStore, getTrustedManifests: provider.getTrustedManifests, }); |
| ledger | const | 152 | no | const ledger = new Map(); // proposalDigest -&gt; { proposal, promoted } |
| allSynthetic | function | 153 | no | const allSynthetic = (events) =&gt; Array.isArray(events) &amp;&amp; events.length &gt; 0 &amp;&amp; |
| proposeCore | function | 155 | no | const proposeCore = async (args = {}) =&gt; { |
| qualifiedArgs | const | 157 | no | const qualifiedArgs={...args,seed:trustedReadSeed(args.scope)}; |
| proposal | const | 158 | no | const proposal = (args?.testOnly === true &amp;&amp; allSynthetic(args.training) &amp;&amp; allSynthetic(args.heldout)) |
| api | const | 164 | no | const api = { |
| hydrate | function | 169 | no | const hydrate = (ids) =&gt; { |
| verified | const | 174 | no | const verified = provider.verifySession(id); |
| entry | const | 182 | no | const entry = typeof proposalDigest === &#39;string&#39; ? ledger.get(proposalDigest) : null; |
| out | variable | 185 | no | let out; |
| proposal | const | 200 | no | const proposal=await proposeCore({...args,testOnly:false}); |
| proposal | const | 208 | no | const proposal=await api.proposeFromSessions({...args,testOnly:false}); |
| sources | const | 215 | no | const sources=[...(proposal.evidence.trainingSources??[]),...(proposal.evidence.heldoutSources??[])]; |
| saved | const | 219 | no | const saved=await api.promote(proposal.proposalDigest); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 15 | external |
| ../store/session.mjs | import | 16 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ../capture/acceptance.mjs | import | 17 | [studio/src/capture/acceptance.mjs](../capture/acceptance.mjs.md) |
| ./four-lane-gates.mjs | import | 18 | [studio/src/studio/four-lane-gates.mjs](./four-lane-gates.mjs.md) |
| ./adapter-studio-bridge.mjs | import | 19 | [studio/src/studio/adapter-studio-bridge.mjs](./adapter-studio-bridge.mjs.md) |
| ./adapter-accepted-session.mjs | import | 20 | [studio/src/studio/adapter-accepted-session.mjs](./adapter-accepted-session.mjs.md) |
| ../profiles/sites/chatgpt.mjs | import | 22 | [studio/src/profiles/sites/chatgpt.mjs](../profiles/sites/chatgpt.mjs.md) |
| ../profiles/sites/claude.mjs | import | 23 | [studio/src/profiles/sites/claude.mjs](../profiles/sites/claude.mjs.md) |
| ../profiles/sites/gemini.mjs | import | 24 | [studio/src/profiles/sites/gemini.mjs](../profiles/sites/gemini.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./adapter-learning-pipeline.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Four-lane integration glue (Z.ai): binds the I1 adapter-improvement pipeline to the
// EXISTING Studio owners — real acceptance producer, real session store, real VersionedStore.
// No second registry, no second browser actor, no new effect authority:
//   - verifyCapture          -> independently re-reads acceptance (G1-G7) + recomputes raw/DOM
//                               digests from the saved session; a client boolean is never trusted.
//   - getTrustedManifests    -> mints server-side session manifests; `lineage` derives ONLY from
//                               immutable capture provenance (rawDigest|domDigest|seqRange), so
//                               re-exports/remounts with new session ids cannot forge independence.
//   - store                  -> expected-version CAS wrapper over the existing VersionedStore
//                               (thin adapter: the SHARED VersionedStore owns the per-name lock,
//                               validation and strict compare-and-save; stale locks fail closed).
// Promotion runs only from SERVER-MINTED proposals (in-memory ledger); an HTTP client can
// submit a digest, never the proposal object. Synthetic evidence can only ever yield
// `test-only-preview` — the pipeline refuses synthetic production promotion by construction.
import { createHash } from 'node:crypto';
import { Session } from '../store/session.mjs';
import { readAcceptance, rawDigest, domDigest } from '../capture/acceptance.mjs';
import { createGuardedStudioLearner } from './four-lane-gates.mjs';
import { createStudioAdapterLearner } from './adapter-studio-bridge.mjs';
import { acceptedSessionToAdapterEvents, domEvidenceRef, ACCEPTED_SESSION_PRODUCER } from './adapter-accepted-session.mjs';

import chatgptSeed from '../profiles/sites/chatgpt.mjs';
import claudeSeed from '../profiles/sites/claude.mjs';
import geminiSeed from '../profiles/sites/gemini.mjs';
const KNOWN_SEEDS=Object.freeze({chatgpt:chatgptSeed,claude:claudeSeed,gemini:geminiSeed});
// Canonical existing profiles only: never let a client supply a weak baseline for promotion.
export function trustedReadSeed(scope) {
  const seed=KNOWN_SEEDS[scope?.siteId];
  if(!seed)return null;
  let host;try{host=new URL(scope.origin).hostname;}catch{return null;}
  return seed.hosts.includes(host)?seed:null;
}

const sha256hex = (x) => createHash('sha256').update(x).digest('hex');
const coded = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra });

/** Thin I1 adapter over the SHARED persistence owner (VersionedStore, issue #81 P0).
 * All locking, name/version validation, atomic writes and expected-version compare-and-save
 * live in src/store/versioned.mjs; this wrapper only maps an I1 scope key onto a store name
 * (`i1-` + sha256(scopeKey)[0..40]) and enforces the read-only payload rule. It has no lock,
 * no file descriptor and no second CAS implementation, so the factory and I1 cannot diverge.
 *  - promote(name, payload, expectedVersion): null = first write (must not exist), integer =
 *    must equal CURRENT; undefined/0/strings/NaN are rejected (CAS_EXPECTED_VERSION_INVALID).
 *  - rollback(name, targetVersion, expectedVersion): integer expectedVersion only; APPENDS a
 *    new version restoring the target (CURRENT only moves forward, so stale bases stay stale).
 * Locks are never auto-cleared (CAS_LOCKED until an operator uses inspectLock/releaseStaleLock). */
export function createCasVersionedStore({ store, lockDir } = {}) { // lockDir is accepted for compatibility and ignored
  void lockDir;
  if (!store || typeof store.compareAndSave !== 'function' || typeof store.compareAndRollback !== 'function' || typeof store.load !== 'function' ||
      typeof store.current !== 'function' || typeof store.versions !== 'function')
    throw new TypeError('VERSIONED_STORE_REQUIRED');
  // Scope keys are JSON strings (pipeline contract); store names must be filesystem-safe.
  // The mapping is deterministic and injective in practice: sha256(scopeKey).
  const storeName = (name) => 'i1-' + sha256hex(String(name)).slice(0, 40);
  return {
    async current(name) {
      // Read view only: any unreadable/corrupt/unselectable head is "not selectable" (never guessed).
      // Mutations do NOT use this: the store compares the raw CURRENT integer, so such a head can never look absent.
      try {
        const sn = storeName(name);
        if (store.current(sn) === null) return null;
        const rec = store.load(sn);
        if (rec?.sendPermission !== false || !rec?.adapter) return null; // only read-only records are selectable
        return { version: rec.version, adapter: rec.adapter, status: 'active',
          sendPermission: false, readFeatures: Array.isArray(rec.readFeatures) ? rec.readFeatures : [] };
      } catch { return null; }
    },
    async promote(name, payload, expectedVersion) {
      if (!payload || payload.sendPermission !== false) throw coded('CAS_PAYLOAD_MUST_BE_READ_ONLY');
      const rec = store.compareAndSave(storeName(name), payload, { expectedVersion, changeNote: payload.changeNote || 'I1 read-only adapter promotion' });
      return { version: rec.version, name: rec.name, schema: payload.schema, sendPermission: false };
    },
    async rollback(name, targetVersion, expectedVersion) {
      if (!Number.isSafeInteger(targetVersion) || targetVersion < 1) throw coded('INVALID_ROLLBACK_VERSION');
      const rec = store.compareAndRollback(storeName(name), targetVersion, { expectedVersion });
      return { name: rec.name, version: rec.version, restoredFrom: rec.restoredFrom, fromVersion: expectedVersion, rolledBack: true };
    },
  };
}
/** Server-side evidence verifier + trusted manifest provider over the REAL session store. */
```

_First 80 of 234 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
