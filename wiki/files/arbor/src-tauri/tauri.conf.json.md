# File: src-tauri/tauri.conf.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | src-tauri/tauri.conf.json |
| Language | JSON |
| Kind | config |
| Size | 767 B |
| Lines | 35 |
| Hash | e446cfd5892f |
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
  "productName": "VIVIM Host",
  "version": "0.1.0",
  "identifier": "com.vivim.host",
  "build": {
    "frontendDist": "../apps/vivim-host/public",
    "devUrl": "http://127.0.0.1:43187",
    "beforeDevCommand": "node apps/vivim-host/server.mjs"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "VIVIM Host",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": [
      "msi"
    ],
    "icon": [
      "icons/icon.ico"
    ],
    "resources": {
      "resources/runtime/": "runtime/",
      "resources/vivim-release.manifest.json": "vivim-release.manifest.json"
    }
  }
}
```

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)
