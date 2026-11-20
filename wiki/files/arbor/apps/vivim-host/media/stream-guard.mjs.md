# File: apps/vivim-host/media/stream-guard.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/media/stream-guard.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1459 B |
| Lines | 38 |
| Hash | fa93eb743fe5 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_UNVERIFIED_BYTES | const | 6 | no | const MAX_UNVERIFIED_BYTES = 256 * 1024; |
| MAX_UNVERIFIED_MS | const | 7 | no | const MAX_UNVERIFIED_MS = 200; |
| createMediaStreamGrantGuard | function | 9 | yes | export function createMediaStreamGrantGuard({ validateGrant, grantId, sessionId, now = Date.now } = {}) { |
| checkedAt | variable | 14 | no | let checkedAt = null; |
| bytesSinceCheck | variable | 15 | no | let bytesSinceCheck = 0; |
| validate | function | 16 | no | function validate() { |
| grant | const | 17 | no | const grant = validateGrant({grantId,sessionId}); |
| current | const | 26 | no | const current = now(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:stream | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./media/stream-guard.mjs |
| [apps/vivim-host/test/media-stream-guard.test.mjs](../test/media-stream-guard.test.mjs.md) | ../media/stream-guard.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Active media reads remain bound to Host-owned device authority, not just
// the grant snapshot observed when the HTTP request began.
// No token persistence, file scanning or alternative approval path.
import { Transform } from 'node:stream';

const MAX_UNVERIFIED_BYTES = 256 * 1024;
const MAX_UNVERIFIED_MS = 200;

export function createMediaStreamGrantGuard({
  validateGrant, grantId, sessionId, now = Date.now
} = {}) {
  if (typeof validateGrant !== 'function' || typeof grantId !== 'string' ||
      typeof sessionId !== 'string') throw new TypeError('MEDIA_GRANT_GUARD_INVALID');
  let checkedAt = null;
  let bytesSinceCheck = 0;
  function validate() {
    const grant = validateGrant({grantId,sessionId});
    if (!Array.isArray(grant?.scopes) || !grant.scopes.includes('control:read'))
      throw Object.assign(new Error('MEDIA_STREAM_SCOPE_DENIED'),{status:403});
    checkedAt = now();
    bytesSinceCheck = 0;
  }
  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        const current = now();
        if (checkedAt === null || current - checkedAt >= MAX_UNVERIFIED_MS ||
            bytesSinceCheck >= MAX_UNVERIFIED_BYTES) validate();
        bytesSinceCheck += chunk.length;
        callback(null,chunk);
      } catch(error) { callback(error); }
    },
    flush(callback) {
      try { validate(); callback(); }
      catch(error) { callback(error); }
    }
  });
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
