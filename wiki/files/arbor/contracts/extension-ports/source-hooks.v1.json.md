# File: contracts/extension-ports/source-hooks.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | contracts/extension-ports/source-hooks.v1.json |
| Language | JSON |
| Kind | config |
| Size | 1649 B |
| Lines | 63 |
| Hash | a5c20be899cf |
| Test | no |
| Generated | no |
| Component | contracts |

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
  "schema": "arbor.extension-ports.source-census/1",
  "authority": "none",
  "effectInvocation": false,
  "installedPlugins": false,
  "source": "vivim-labs/vivim/extension-points/VERIFIED-HOOKS.md",
  "sourceBlobSha": "bb5a2e18485752871cc5ef8b509a92989c82757c",
  "ports": [
    {
      "id": "studio.fixed-registry",
      "owner": "studio",
      "kinds": [
        "formats",
        "codecs",
        "secretPatterns",
        "migrations",
        "transforms"
      ],
      "status": "IMPLEMENTED",
      "requiresTrustedInternalCode": true
    },
    {
      "id": "hqkg.compute-engine",
      "owner": "native/hqkg",
      "status": "IMPLEMENTED",
      "requiresTrustedInternalCode": true
    },
    {
      "id": "host.fixed-action",
      "owner": "apps/vivim-host",
      "status": "IMPLEMENTED",
      "effectAuthority": "host-only",
      "requiresTrustedInternalCode": true
    },
    {
      "id": "tierflow.typed-candidate",
      "owner": "packages/tierflow",
      "status": "PREVIEW",
      "effectAuthority": "none",
      "requiresTrustedInternalCode": true
    },
    {
      "id": "mobile.consumer-descriptors",
      "owner": "apps/mobile-relay",
      "status": "IMPLEMENTED",
      "effectAuthority": "none",
      "requiresTrustedInternalCode": true
    },
    {
      "id": "hq.context-bundle",
      "owner": "hq",
      "status": "IMPLEMENTED",
      "effectAuthority": "none",
      "requiresTrustedInternalCode": true
    }
  ],
  "excluded": [
    "third-party install",
    "privilege creation",
    "marketplace",
    "independent writer"
  ]
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
