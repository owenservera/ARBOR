# File: apps/vivim-host/data/demo-baseline/file-surface.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/data/demo-baseline/file-surface.v1.json |
| Language | JSON |
| Kind | config |
| Size | 3719 B |
| Lines | 64 |
| Hash | 06261a9fcf9a |
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
  "schema": "vivim.file-surface/1",
  "generatorVersion": "file-surface-gen/1 stage-a",
  "files": [
    {
      "path": "apps/vivim-host/public/demo/controller.js",
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
      ],
      "actionIds": [],
      "generatorVersion": "file-surface-gen/1 stage-a",
      "sourceDigest": "71cf01ca3af911d05865ab10bc0af38ac2f685346c5890cf875f9ff89b49d530"
    },
    {
      "path": "apps/vivim-host/public/demo/demo.html",
      "surface": "Static shell of the ARBOR baseline demo walkthrough — the reprogrammable\nsurface is static copy (eyebrows, headings, serve-info text), section\nstructure inside .demo-* containers, and button labels. NL-driven\nchange accepts none of: renaming #demo-* ids consumed by\ncontroller.js bindShell, script/style injection (CSP C4), or changing\nthe /mobile/?host-preview=1 iframe target. The fixture feed and\ndecision controls stay read-only shells; POST /demo/feedback remains\nthe only writable surface of the whole /demo tree.\nNLCL linkage: no action in control/action-catalog.v1.json v7 targets\nthis file yet — actionIds stays empty until one is catalogued.",
      "commentIds": [
        "demo-shell",
        "demo-progress",
        "demo-strip",
        "demo-step-badge",
        "demo-phone",
        "demo-live-preview",
        "demo-acceptance",
        "demo-feed",
        "demo-notes",
        "demo-tags",
        "demo-btn-approve",
        "demo-btn-revise",
        "demo-decision-chip",
        "demo-journal",
        "demo-serve-info",
        "demo-status",
        "demo-submit",
        "demo-approve-all"
      ],
      "actionIds": [],
      "generatorVersion": "file-surface-gen/1 stage-a",
      "sourceDigest": "f3860f1216ad80d74a280866c2dce6e26bd8a5ee54722a4c05edfd98aec6a70e"
    },
    {
      "path": "apps/vivim-host/public/demo/poll-round.mjs",
      "surface": "One-shot CLI poll of the demo feedback inbox — the reprogrammable\nsurface is the CLI contract only: filter flags (--last, --since) and\ntheir semantics, stdout JSON formatting, and validation/exit messages.\nNL-driven change accepts none of: network fetch (disk read only, C9),\ndrift of the {round, approveAll, verdicts, receivedAt} entry schema\nshared with POST /demo/feedback, or watcher/daemon modes (one-shot by\ndesign). node:fs only; no other imports.\nNLCL linkage: no action in control/action-catalog.v1.json v7 targets\nthis file yet — actionIds stays empty until one is catalogued.",
      "commentIds": [
        "arg-parser",
        "round-entry-schema",
        "output-format",
        "exit-codes"
      ],
      "actionIds": [],
      "generatorVersion": "file-surface-gen/1 stage-a",
      "sourceDigest": "2c5ecff7a6c2f20742a843c76960291d5d236feec46b65fc2cb226fb45997c8f"
    }
  ]
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
