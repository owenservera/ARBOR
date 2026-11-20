# File: apps/mobile-relay/generative-ui/host-revision-guard.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/generative-ui/host-revision-guard.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3357 B |
| Lines | 63 |
| Hash | a60df25327e6 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PLAIN | function | 10 | no | const PLAIN = value =&gt; value !== null &amp;&amp; typeof value === &#39;object&#39; &amp;&amp; |
| REV | function | 12 | no | const REV = value =&gt; Number.isSafeInteger(value) &amp;&amp; value &gt;= 0 &amp;&amp; value &lt;= 1_000_000_000; |
| SURFACE_ID | const | 13 | no | const SURFACE_ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/; |
| committedHostSurface | function | 16 | yes | export function committedHostSurface(row) { |
| candidate | const | 20 | no | const candidate = row.surface; |
| createHostRevisionGuard | function | 38 | yes | export function createHostRevisionGuard() { |
| high | variable | 39 | no | let high = null; |
| currentlyVisible | variable | 40 | no | let currentlyVisible = false; |
| invalidate | function | 41 | no | function invalidate(reason) { |
| surface | const | 48 | no | const surface = committedHostSurface(row); |
| fingerprint | const | 50 | no | const fingerprint = JSON.stringify(surface); |
| changed | const | 55 | no | const changed = !currentlyVisible \|\| !high \|\| surface.revision !== high.revision; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) | ./generative-ui/host-revision-guard.mjs |
| [apps/mobile-relay/generative-ui/phone-surface.mjs](./phone-surface.mjs.md) | ./host-revision-guard.mjs |
| [apps/mobile-relay/test/host-revision-guard.test.mjs](../test/host-revision-guard.test.mjs.md) | ../generative-ui/host-revision-guard.mjs |
| [apps/mobile-relay/ux/shell-presentation.mjs](../ux/shell-presentation.mjs.md) | ../generative-ui/host-revision-guard.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Read-only compatibility guard for the EXISTING Host bootstrap UI surface.
 * This is not the Rust graph bridge, a publisher, an authorization token or a
 * substitute for a future Host-issued monotonic rollback/watermark contract.
 *
 * Only authenticated same-origin Host status callers may feed `observe`.
 * On disconnect, revocation, mismatched head or unproved rollback, callers
 * must remove the rendered projection and must not submit UI intents.
 */
const PLAIN = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const REV = value => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
const SURFACE_ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/;

/** Extract the committed surface, never the status envelope's extra fields. */
export function committedHostSurface(row) {
  if (!PLAIN(row)) return null;
  // A bare visual document, even when well-formed, is not evidence of a Host commit.
  if (!Object.hasOwn(row, 'surface') || row.status !== 'applied' || !PLAIN(row.surface)) return null;
  const candidate = row.surface;
  if (!PLAIN(candidate) || candidate.schema !== 'vivim.ui-surface/1' ||
      !SURFACE_ID.test(candidate.surfaceId ?? '') || !REV(candidate.revision) ||
      candidate.catalogVersion !== 1 || !PLAIN(candidate.theme) || !PLAIN(candidate.tree)) return null;
  if (row.surfaceId !== candidate.surfaceId || row.revision !== candidate.revision) return null;
  // Copy only the owned surface fields; the renderer performs strict grammar and
  // privacy validation. Metadata such as status/changeId is not UI content.
  return {
    schema: candidate.schema,
    surfaceId: candidate.surfaceId,
    revision: candidate.revision,
    catalogVersion: candidate.catalogVersion,
    theme: candidate.theme,
    tree: candidate.tree
  };
}

/** One bounded head per mounted surface, no offline state and no automatic retry. */
export function createHostRevisionGuard() {
  let high = null;
  let currentlyVisible = false;
  function invalidate(reason) {
    currentlyVisible = false;
    return { state: 'blocked', reason, surface: null, changed: true };
  }
  return Object.freeze({
    observe(row) {
      if (row == null) return invalidate('NO_COMMITTED_SURFACE');
      const surface = committedHostSurface(row);
      if (!surface) return invalidate('INVALID_HOST_REVISION');
      const fingerprint = JSON.stringify(surface);
      if (high && surface.surfaceId !== high.surfaceId) return invalidate('SCOPE_CHANGED');
      if (high && surface.revision < high.revision) return invalidate('ROLLBACK_PROOF_REQUIRED');
      if (high && surface.revision === high.revision && fingerprint !== high.fingerprint)
        return invalidate('SAME_REVISION_CONFLICT');
      const changed = !currentlyVisible || !high || surface.revision !== high.revision;
      high = { surfaceId: surface.surfaceId, revision: surface.revision, fingerprint };
      currentlyVisible = true;
      return { state: 'ready', reason: 'NONE', surface, changed };
    },
    disconnect() { return invalidate('DISCONNECTED'); },
    status() { return { state: currentlyVisible ? 'ready' : 'blocked', highRevision: high?.revision ?? null }; }
  });
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
