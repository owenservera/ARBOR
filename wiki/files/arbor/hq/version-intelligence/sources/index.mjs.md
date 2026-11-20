# File: hq/version-intelligence/sources/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/sources/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 379 B |
| Lines | 6 |
| Hash | 94aade74e21a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MANIFEST_SCHEMA | export | 2 | yes | export { SOURCE_SCHEMA, MANIFEST_SCHEMA, SourceError, gitBlobSha, canonicalRepo, digest } |
| SOURCE_SCHEMA | export | 2 | yes | export { SOURCE_SCHEMA, MANIFEST_SCHEMA, SourceError, gitBlobSha, canonicalRepo, digest } |
| SourceError | export | 2 | yes | export { SOURCE_SCHEMA, MANIFEST_SCHEMA, SourceError, gitBlobSha, canonicalRepo, digest } |
| canonicalRepo | export | 2 | yes | export { SOURCE_SCHEMA, MANIFEST_SCHEMA, SourceError, gitBlobSha, canonicalRepo, digest } |
| digest | export | 2 | yes | export { SOURCE_SCHEMA, MANIFEST_SCHEMA, SourceError, gitBlobSha, canonicalRepo, digest } |
| gitBlobSha | export | 2 | yes | export { SOURCE_SCHEMA, MANIFEST_SCHEMA, SourceError, gitBlobSha, canonicalRepo, digest } |
| NO_SOURCE_ADAPTER | export | 3 | yes | export { createGitObjectAdapter, NO_SOURCE_ADAPTER } |
| createGitObjectAdapter | export | 3 | yes | export { createGitObjectAdapter, NO_SOURCE_ADAPTER } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./common.mjs | export_from | 2 | [hq/version-intelligence/sources/common.mjs](./common.mjs.md) |
| ./adapters.mjs | export_from | 3 | [hq/version-intelligence/sources/adapters.mjs](./adapters.mjs.md) |
| ./snapshots.mjs | export_from | 4 | [hq/version-intelligence/sources/snapshots.mjs](./snapshots.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Stable ESM surface for G1 integration and B/C/E/F consumers.
export { SOURCE_SCHEMA, MANIFEST_SCHEMA, SourceError, gitBlobSha, canonicalRepo, digest } from './common.mjs';
export { createGitObjectAdapter, NO_SOURCE_ADAPTER } from './adapters.mjs';
export {
  DEFAULT_LIMITS, resolvePin, verifyPin, snapshotAt, readPinnedBlob, manifestDigestOf,
} from './snapshots.mjs';
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
