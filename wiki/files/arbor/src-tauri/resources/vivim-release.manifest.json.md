# File: src-tauri/resources/vivim-release.manifest.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | src-tauri/resources/vivim-release.manifest.json |
| Language | JSON |
| Kind | config |
| Size | 916 B |
| Lines | 11 |
| Hash | 2f27596d918a |
| Test | no |
| Generated | no |
| Component | src-tauri |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```json
{
  "schema": "vivim.apk-release-manifest-placeholder/1",
  "manifestOnly": true,
  "generatedAt": "2026-11-10",
  "note": "Placeholder required by tauri.conf.json bundle.resources ('resources/vivim-release.manifest.json') for cargo check. The real file has schema 'vivim.apk-release/1' and is produced together with the signed release APK by the Android release build; no release-signed APK exists in this checkout (only vivim-debug variants), so no real release manifest could be staged. This placeholder must be replaced by tools/packaging/prepare-host-runtime.mjs before any MSI is built or distributed. At runtime main.rs only forwards this path as VIVIM_BUNDLED_APK_MANIFEST; a manifest whose schema is not 'vivim.apk-release/1' is rejected by the Host, so this placeholder fails closed.",
  "releaseId": null,
  "applicationId": null,
  "versionCode": null,
  "artifact": null,
  "signing": null
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
