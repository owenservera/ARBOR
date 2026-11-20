# File: studio/architecture/components.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/architecture/components.json |
| Language | JSON |
| Kind | config |
| Size | 8091 B |
| Lines | 239 |
| Hash | 002687ca7c37 |
| Test | no |
| Generated | no |
| Component | studio |

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
  "schemaVersion": 1,
  "product": "VIVIM Harness",
  "source": {
    "repo": "owenservera/aion",
    "commit": "671c0b5a8f1e22822524fccc7543067ab89d121d",
    "folder": "workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/",
    "method": "exact Git blob snapshot; historical commit ancestry not transplanted"
  },
  "components": [
    {
      "id": "experience",
      "name": "User experience",
      "summary": "Studio /chat, API, CLI, MCP",
      "codePaths": [
        "src/studio/",
        "src/mcp/",
        "bin/"
      ],
      "trackedFiles": 68,
      "trackedBytes": 1027270,
      "maturity": {
        "state": "integrated-offline",
        "measuredAt": "source-extraction",
        "acceptance": "not independently reverified in new repository"
      },
      "nextGate": "Complete standalone chat/browser acceptance is still pending."
    },
    {
      "id": "runtime",
      "name": "Browser & conversation runtime",
      "summary": "CDP, Chrome binding, explicit turns",
      "codePaths": [
        "src/capture/",
        "src/cdp/",
        "src/chrome/"
      ],
      "trackedFiles": 28,
      "trackedBytes": 546378,
      "maturity": {
        "state": "live-partial",
        "measuredAt": "source-extraction",
        "acceptance": "not independently reverified in new repository"
      },
      "nextGate": "Prior Windows evidence does not establish independent standalone acceptance."
    },
    {
      "id": "network",
      "name": "L1 network observation",
      "summary": "Raw bytes, frames, SSE and WebSocket",
      "codePaths": [
        "src/capture/"
      ],
      "trackedFiles": 25,
      "trackedBytes": 519491,
      "maturity": {
        "state": "integrated-offline",
        "measuredAt": "source-extraction",
        "acceptance": "not independently reverified in new repository"
      },
      "nextGate": "Shares source files with browser runtime and L3."
    },
    {
      "id": "protocol",
      "name": "L2 decoding",
      "summary": "Decoders, deltas and event assembly",
      "codePaths": [
        "src/decode/"
      ],
      "trackedFiles": 5,
      "trackedBytes": 126861,
      "maturity": {
        "state": "integrated-offline",
        "measuredAt": "source-extraction",
        "acceptance": "not independently reverified in new repository"
      },
      "nextGate": "Synthetic decoding fidelity covered; live all-provider parity pending."
    },
    {
      "id": "native-page",
```

_First 80 of 240 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
