# File: studio/src/capture/privacy.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/privacy.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1264 B |
| Lines | 28 |
| Hash | d116ae8c3c37 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CAPTURE_MODES | const | 6 | yes | export const CAPTURE_MODES = Object.freeze([&#39;local-raw&#39;, &#39;filtered&#39;]); |
| captureMode | function | 8 | yes | export function captureMode(profile = null, env = process.env) { |
| requested | const | 9 | no | const requested = env.CAPTURE_STUDIO_CAPTURE_MODE ?? profile?.capture?.privacyMode ?? &#39;local-raw&#39;; |
| capturePrivacy | function | 16 | yes | export function capturePrivacy(profile = null, env = process.env) { |
| mode | const | 17 | no | const mode = captureMode(profile, env); |
| localRaw | const | 18 | no | const localRaw = mode === &#39;local-raw&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./redact.mjs | import | 4 | [studio/src/capture/redact.mjs](./redact.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/capture/privacy.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/capture/privacy.mjs |
| [studio/src/capture/dom.mjs](./dom.mjs.md) | ./privacy.mjs |
| [studio/src/capture/network.mjs](./network.mjs.md) | ./privacy.mjs |
| [studio/src/capture/recorder.mjs](./recorder.mjs.md) | ./privacy.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Single-user local-PC capture policy. This is a fidelity preference, not an
// authorization boundary: never use it to authorize a browser send or bind a
// network listener. The user can opt back into the older filtered behavior.
import { redactUrl, redactHeaders, scrubText, scrubSecrets } from './redact.mjs';

export const CAPTURE_MODES = Object.freeze(['local-raw', 'filtered']);

export function captureMode(profile = null, env = process.env) {
  const requested = env.CAPTURE_STUDIO_CAPTURE_MODE ?? profile?.capture?.privacyMode ?? 'local-raw';
  if (!CAPTURE_MODES.includes(requested)) {
    throw new Error('Invalid CAPTURE_STUDIO_CAPTURE_MODE: expected local-raw or filtered');
  }
  return requested;
}

export function capturePrivacy(profile = null, env = process.env) {
  const mode = captureMode(profile, env);
  const localRaw = mode === 'local-raw';
  return {
    mode,
    localRaw,
    url: (value) => localRaw ? value : redactUrl(value),
    headers: (headers) => localRaw ? (headers ? { ...headers } : undefined) : redactHeaders(headers),
    text: (value) => localRaw ? { text: value, redactions: [] } : scrubText(value),
    bytes: (bytes) => localRaw ? { bytes, redactions: [] } : scrubSecrets(bytes),
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
