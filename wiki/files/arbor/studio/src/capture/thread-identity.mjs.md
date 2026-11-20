# File: studio/src/capture/thread-identity.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/thread-identity.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2325 B |
| Lines | 40 |
| Hash | 519f4ac4c2f0 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| THREAD_IDENTITY_SCHEMA | const | 10 | yes | export const THREAD_IDENTITY_SCHEMA = &#39;aion.thread-identity/1&#39;; |
| EVIDENCE_CLASSES | const | 12 | no | const EVIDENCE_CLASSES = [&#39;saved-real-capture&#39;, &#39;live-browser-observation&#39;, &#39;synthetic-fixture&#39;]; |
| chatgptConversationClaim | function | 15 | yes | export function chatgptConversationClaim({ url, captureRef, sequence, evidenceClass = &#39;live-browser-observation&#39; } = {}) { |
| thread | const | 20 | no | const thread = parseThread(&#39;chatgpt&#39;, url); |
| u | const | 22 | no | const u = new URL(url); |
| resolveConversationIdentity | function | 33 | yes | export function resolveConversationIdentity({ providerId, siteId, origin, surface = &#39;chat&#39;, adapterKind = &#39;seed&#39;, adapterVersion = &#39;seed&#39;, page, claims = {} } = {}) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../studio/core-runtime-bridge.mjs | import | 7 | [studio/src/studio/core-runtime-bridge.mjs](../studio/core-runtime-bridge.mjs.md) |
| ./conversation-thread.mjs | import | 8 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Provider-specific conversation identity resolution (four-lane C1 seam).
// Binds native conversation identity ONLY from the existing selected site adapter's genuinely
// resolved claims plus Capture Studio observation provenance — never from chat titles, text,
// tab labels or URL query fragments. Unknown providers keep every identity slot `unverified`
// (fail-closed), while ChatGPT's strict `/c/<uuid>` native-route contract stays exactly as
// strict as the canonical parser. Pure module: no browser, no effects, no storage.
import { resolveAttachment } from '../studio/core-runtime-bridge.mjs';
import { parseThread } from './conversation-thread.mjs';

export const THREAD_IDENTITY_SCHEMA = 'aion.thread-identity/1';

const EVIDENCE_CLASSES = ['saved-real-capture', 'live-browser-observation', 'synthetic-fixture'];

/** ChatGPT native-route claim: only an exact https origin + strict `/c/<uuid>` path binds. */
export function chatgptConversationClaim({ url, captureRef, sequence, evidenceClass = 'live-browser-observation' } = {}) {
  if (typeof url !== 'string' || !captureRef || !Number.isSafeInteger(sequence) || sequence < 0) return null;
  if (!EVIDENCE_CLASSES.includes(evidenceClass)) return null;
  // Reuse the canonical ChatGPT parser. A generic HTTPS /c/<uuid> path on an
  // unrelated site is NOT a ChatGPT identity, even if it looks identical.
  const thread = parseThread('chatgpt', url);
  if (!thread) return null;
  const u = new URL(url);
  return {
    kind: 'conversation', verified: true, nativeRef: thread.id,
    origin: u.origin,
    source: { kind: 'native-route', captureRef, sequence, reference: `/c/${thread.id}`, evidenceClass },
  };
}

/** Resolve a provider-scoped attachment with exact identity slots. `claims` come ONLY from the
 * selected adapter / parser (see chatgptConversationClaim); everything unproven stays
 * `unverified`. Throws the bridge's coded errors for scope/evidence violations. */
export function resolveConversationIdentity({ providerId, siteId, origin, surface = 'chat',
  adapterKind = 'seed', adapterVersion = 'seed', page, claims = {} } = {}) {
  return resolveAttachment({
    adapter: { providerId, siteId, surface, origin, kind: adapterKind, version: adapterVersion },
    page,
    resolved: claims,
  });
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
