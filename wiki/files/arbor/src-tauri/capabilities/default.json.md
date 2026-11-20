# File: src-tauri/capabilities/default.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | src-tauri/capabilities/default.json |
| Language | JSON |
| Kind | config |
| Size | 510 B |
| Lines | 17 |
| Hash | 0f6b6b358429 |
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
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for the VIVIM Host main window: window show/navigate plus core IPC.",
  "windows": ["main"],
  "remote": {
    "urls": ["http://127.0.0.1:*"]
  },
  "permissions": [
    "core:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-focus",
    "core:window:allow-start-dragging",
    "core:window:allow-internal-toggle-maximize"
  ]
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
