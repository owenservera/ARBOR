// Stable ESM surface for G1 integration and B/C/E/F consumers.
export { SOURCE_SCHEMA, MANIFEST_SCHEMA, SourceError, gitBlobSha, canonicalRepo, digest } from './common.mjs';
export { createGitObjectAdapter, NO_SOURCE_ADAPTER } from './adapters.mjs';
export {
  DEFAULT_LIMITS, resolvePin, verifyPin, snapshotAt, readPinnedBlob, manifestDigestOf,
  acquirePinnedSnapshot,
} from './snapshots.mjs';
