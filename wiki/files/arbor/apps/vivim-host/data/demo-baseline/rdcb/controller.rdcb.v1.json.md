# File: apps/vivim-host/data/demo-baseline/rdcb/controller.rdcb.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/data/demo-baseline/rdcb/controller.rdcb.v1.json |
| Language | JSON |
| Kind | config |
| Size | 4424 B |
| Lines | 90 |
| Hash | 45cd42708eec |
| Test | no |
| Generated | no |
| Component | vivim-host |

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
  "schema": "vivim.rdcb/1",
  "protocol": "hq.dcb-protocol/1",
  "inherits": "hq.context-bundle/1",
  "trigger": "edit.pre",
  "task": "RDCB v1 — reprogramming context for apps/vivim-host/public/demo/controller.js",
  "audience": "agent",
  "project": "arbor",
  "generatedAt": "2026-11-14T00:00:00.000Z",
  "status": "stale",
  "budget": {
    "maxTokens": 5000,
    "reserved": 800,
    "capacity": 4120,
    "used": 396,
    "estimator": "utf8-bytes/3"
  },
  "reprogramming": {
    "corpusScope": "vlang-surface-headers",
    "vlangExecution": false,
    "fileSurfaceRegistry": {
      "ref": "apps/vivim-host/data/demo-baseline/file-surface.v1.json",
      "schema": "vivim.file-surface/1",
      "generatorVersion": "file-surface-gen/1 stage-a",
      "recordCount": 3
    },
    "nlclCatalog": {
      "ref": "apps/vivim-host/control/action-catalog.v1.json",
      "schema": "vivim.control-action-catalog/1",
      "version": 9
    },
    "surfaceDrift": [
      "apps/vivim-host/public/demo/controller.js"
    ]
  },
  "sources": [
    {
      "ref": "arbor:apps/vivim-host/public/demo/controller.js",
      "project": "arbor",
      "path": "apps/vivim-host/public/demo/controller.js",
      "kind": "code",
      "lang": "javascript",
      "sha256": "5c1ee464115b71edc4a30160a752b7c1a672be235d0c6c2d254c977ac461b006",
      "lines": [
        1,
        14
      ],
      "estimatedTokens": 396,
      "score": 1,
      "reason": "rdcb|file-surface|vlang-surface-header",
      "authority": "project_observed",
      "excerpt": {
        "kind": "vlang-surface-header",
        "lines": [
          1,
          14
        ],
        "text": "/* @vlang:surface apps/vivim-host/public/demo/controller.js\r\n   @vlang:surface-desc: Walkthrough controller for the ARBOR baseline demo — the reprogrammable\r\n   @vlang:surface-desc: surface is presentation and verdict wording only: live message state\r\n   @vlang:surface-desc: labels (LIVE_STATE_LABELS), the honest gap string (NOT_AVAILABLE), the\r\n   @vlang:surface-desc: tag vocabulary (TAGS), fixture validation messages, and per-step\r\n   @vlang:surface-desc: render wording. NL-driven change accepts none of: new fetch targets\r\n   @vlang:surface-desc: (C4 same-origin /demo/* only), DOM scope beyond #demo-* elements (C7),\r\n   @vlang:surface-desc: inline script/style (C4), or verdict payload keys beyond the C8\r\n   @vlang:surface-desc: {round, approveAll, verdicts} shape read by POST /demo/feedback.\r\n   @vlang:surface-desc: NLCL linkage: no action in control/action-catalog.v1.json v7 targets\r\n   @vlang:surface-desc: this file yet — actionIds stays empty until one is catalogued.\r\n   @vlang:id: tag-vocabulary storage-key live-state-labels not-available-gap\r\n   @vlang:id: fixture-validation mock-data-views walkthrough-state verdict-payload dom-anchors\r\n   @vlang:action: */"
      },
      "fileSurface": {
        "ref": "apps/vivim-host/data/demo-baseline/file-surface.v1.json",
        "surface": "Walkthrough controller for the ARBOR baseline demo — the reprogrammable\nsurface is presentation and verdict wording only: live message state\nlabels (LIVE_STATE_LABELS), the honest gap string (NOT_AVAILABLE), the\ntag vocabulary (TAGS), fixture validation messages, and per-step\nrender wording. NL-driven change accepts none of: new fetch targets\n(C4 same-origin /demo/* only), DOM scope beyond #demo-* elements (C7),\ninline script/style (C4), or verdict payload keys beyond the C8\n{round, approveAll, verdicts} shape read by POST /demo/feedback.\nNLCL linkage: no action in control/action-catalog.v1.json v7 targets\nthis file yet — actionIds stays empty until one is catalogued.",
        "commentIds": [
          "tag-vocabulary",
          "storage-key",
          "live-state-labels",
          "not-available-gap",
          "fixture-validation",
          "mock-data-views",
          "walkthrough-state",
          "verdict-payload",
          "dom-anchors"
        ]
      },
      "nlclActionIds": [],
      "digest": "22fdce03a546d19c0f2fba926e83cae9aed6b9cf51edf5c68c63a40feb104acc"
    }
  ],
  "omissions": [],
  "symbols": [],
```

_First 80 of 91 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
