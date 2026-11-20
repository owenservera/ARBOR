# File: studio/src/capture/stream-guard.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/stream-guard.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5724 B |
| Lines | 124 |
| Hash | 7f087e137ddc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STREAM_GUARD_HOLDBACK | const | 12 | yes | export const STREAM_GUARD_HOLDBACK = 128; |
| STREAM_GUARD_MAX_BUFFER | const | 13 | yes | export const STREAM_GUARD_MAX_BUFFER = 1024 * 1024; |
| CANDIDATE | const | 18 | no | const CANDIDATE = /&quot;(?:access_?token\|refresh_?token\|id_?token\|session_?token\|accessToken\|refreshToken\|idToken\|sessionToken\|api_?key\|apiKey\|client_?secret\|password\|authorization\|cookie\|csrf_?token\|csr… |
| credentialCandidate | function | 20 | yes | export function credentialCandidate(bytes) { |
| empty | function | 24 | no | const empty = () =&gt; Buffer.alloc(0); |
| safe | function | 25 | no | const safe = (bytes) =&gt; { |
| result | const | 26 | no | const result = scrubSecrets(bytes); |
| ChunkCredentialGuard | class | 32 | yes | export class ChunkCredentialGuard { |
| constructor | method | 33 | yes | constructor({ holdbackBytes = STREAM_GUARD_HOLDBACK, maxBufferedBytes = STREAM_GUARD_MAX_BUFFER } = {}) { |
| push | method | 40 | yes | push(input) { |
| combined | const | 43 | no | const combined = Buffer.concat([this.pending, input]); |
| count | const | 46 | no | const count = Math.max(0, combined.length - this.holdbackBytes); |
| emitted | const | 47 | no | const emitted = safe(combined.subarray(0, count)); |
| finish | method | 51 | yes | finish() { |
| remainder | const | 53 | no | const remainder = this.pending; |
| exclude | method | 58 | yes | exclude(reason) { |
| discard | method | 64 | yes | discard() { |
| hadPending | const | 65 | no | const hadPending = this.pending.length &gt; 0; |
| FrameCredentialGuard | class | 75 | yes | export class FrameCredentialGuard { |
| constructor | method | 76 | yes | constructor({ holdbackBytes = STREAM_GUARD_HOLDBACK, maxBufferedBytes = STREAM_GUARD_MAX_BUFFER, maxPendingFrames = 4096 } = {}) { |
| push | method | 86 | yes | push(frame, bytes) { |
| frames | const | 94 | no | const frames = []; |
| first | const | 96 | no | const first = this.pending.shift(); |
| finish | method | 102 | yes | finish() { |
| frames | const | 104 | no | const frames = this.pending.map((x) =&gt; x.frame); |
| exclude | method | 109 | yes | exclude(reason, extra = null) { |
| dropped | const | 110 | no | const dropped = this.pending.map((x) =&gt; ({ frame: x.frame, bytes: x.bytes.length })); |
| discard | method | 118 | yes | discard() { |
| dropped | const | 119 | no | const dropped = this.pending.map((x) =&gt; ({ frame: x.frame, bytes: x.bytes.length })); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./redact.mjs | import | 10 | [studio/src/capture/redact.mjs](./redact.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/network.mjs](./network.mjs.md) | ./stream-guard.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pre-persistence streaming credential quarantine.
//
// A completed-buffer regex cannot protect independently appended HTTP chunks or
// WebSocket frames. Hold back at least the longest recognizable marker, then
// refuse to persist ANY pending payload when one appears. This deliberately
// over-excludes content, rather than claiming arbitrary bytes are credential-free.
// It is not universal secret detection. Rules match the scrubber's supported
// credential family plus common API-token prefixes. This guard is used only in
// optional filtered mode; local-raw mode preserves the original stream. See W4 notes.
import { scrubSecrets } from './redact.mjs';

export const STREAM_GUARD_HOLDBACK = 128;
export const STREAM_GUARD_MAX_BUFFER = 1024 * 1024;

// The complete sensitive VALUE does not need to be visible before we exclude
// it. A marker in the withheld tail is sufficient, including when the marker
// itself was split across CDP chunks / frames.
const CANDIDATE = /"(?:access_?token|refresh_?token|id_?token|session_?token|accessToken|refreshToken|idToken|sessionToken|api_?key|apiKey|client_?secret|password|authorization|cookie|csrf_?token|csrfToken)"|\bBearer\b|eyJ|sk-[A-Za-z0-9_-]*|gh[pousr]_|github_pat_/i;

export function credentialCandidate(bytes) {
  return CANDIDATE.test(bytes.toString('latin1'));
}

const empty = () => Buffer.alloc(0);
const safe = (bytes) => {
  const result = scrubSecrets(bytes);
  return { bytes: result.bytes, redactions: result.redactions };
};

// HTTP/SSE: may emit slightly delayed, sanitized byte chunks. The held bytes
// are never persisted until later input, and never on abnormal termination.
export class ChunkCredentialGuard {
  constructor({ holdbackBytes = STREAM_GUARD_HOLDBACK, maxBufferedBytes = STREAM_GUARD_MAX_BUFFER } = {}) {
    this.holdbackBytes = holdbackBytes;
    this.maxBufferedBytes = maxBufferedBytes;
    this.pending = empty();
    this.excluded = false;
    this.reason = null;
  }
  push(input) {
    if (this.excluded) return { bytes: empty(), redactions: [], excluded: false };
    if (!Buffer.isBuffer(input) || input.length > this.maxBufferedBytes) return this.exclude('security_scan_limit');
    const combined = Buffer.concat([this.pending, input]);
    if (combined.length > this.maxBufferedBytes + this.holdbackBytes) return this.exclude('security_scan_limit');
    if (credentialCandidate(combined)) return this.exclude('credential_candidate');
    const count = Math.max(0, combined.length - this.holdbackBytes);
    const emitted = safe(combined.subarray(0, count));
    this.pending = Buffer.from(combined.subarray(count));
    return { ...emitted, excluded: false };
  }
  finish() {
    if (this.excluded) return { bytes: empty(), redactions: [], excluded: false };
    const remainder = this.pending;
    this.pending = empty();
    if (credentialCandidate(remainder)) return this.exclude('credential_candidate');
    return { ...safe(remainder), excluded: false };
  }
  exclude(reason) {
    this.excluded = true;
    this.reason = reason;
    this.pending = empty();
    return { bytes: empty(), redactions: [], excluded: true, reason };
  }
  discard() {
    const hadPending = this.pending.length > 0;
    this.pending = empty();
    return hadPending;
  }
}

// WS: preserve WHOLE frame boundaries and order. A frame is emitted only once
// at least holdbackBytes of subsequent payload has been observed. If a marker
// spans frames, queued content is discarded and all further frames are metadata.
// A large uninspectable frame also fails closed.
export class FrameCredentialGuard {
  constructor({ holdbackBytes = STREAM_GUARD_HOLDBACK, maxBufferedBytes = STREAM_GUARD_MAX_BUFFER,
    maxPendingFrames = 4096 } = {}) {
    this.holdbackBytes = holdbackBytes;
    this.maxBufferedBytes = maxBufferedBytes;
    this.maxPendingFrames = maxPendingFrames;
```

_First 80 of 125 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
