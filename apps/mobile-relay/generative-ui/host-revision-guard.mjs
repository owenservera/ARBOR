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
