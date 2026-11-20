# File: tests/fixtures/labs/capability-observatory/seed.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | tests/fixtures/labs/capability-observatory/seed.json |
| Language | JSON |
| Kind | config |
| Size | 6174 B |
| Lines | 232 |
| Hash | 633f60da7717 |
| Test | yes |
| Generated | no |
| Component | tests |

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
[
  {
    "capability_id": "cap:ui-canonical",
    "name": "Canonical UI document and renderer",
    "domain": "ui",
    "kind": "system",
    "owner_repo": "tierflow",
    "surfaces": [
      "desktop",
      "android",
      "studio"
    ],
    "authority": "TierFlow document/revisions",
    "wave_lanes": [
      "B",
      "F",
      "G",
      "H"
    ],
    "baseline_evidence": "integrated_test",
    "target": "One canonical UI state and device parity",
    "source_refs": [
      "tierflow:src/visual-runtime",
      "tierflow:VIVIM-VISUAL-RUNTIME/WAVE-4/INTEGRATION-4-RESULT.md"
    ],
    "task_refs": []
  },
  {
    "capability_id": "cap:phone-projection",
    "name": "APK phone UI projection",
    "domain": "device",
    "kind": "integration",
    "owner_repo": "tierflow",
    "surfaces": [
      "android"
    ],
    "authority": "TierFlow inert projection; Harness APK shell",
    "wave_lanes": [
      "F",
      "H"
    ],
    "baseline_evidence": "integrated_test",
    "target": "Real render, fixed guard, physical-device acceptance",
    "source_refs": [
      "tierflow:src/visual-runtime/device/wave4-phone-adapter.ts",
      "tierflow:VIVIM-VISUAL-RUNTIME/WAVE-4/INTEGRATION-4-RESULT.md"
    ],
    "task_refs": []
  },
  {
    "capability_id": "cap:typed-commands",
    "name": "Typed command candidate and Host boundary",
    "domain": "commands",
    "kind": "system",
    "owner_repo": "tierflow",
    "surfaces": [
      "desktop",
      "android",
      "oracle"
    ],
    "authority": "TierFlow candidate, Harness Host effects",
    "wave_lanes": [
      "A",
      "E",
      "H"
    ],
    "baseline_evidence": "integrated_test",
    "target": "One deterministic typed command path, no bypass",
    "source_refs": [
      "tierflow:src/visual-runtime/command/wave4-typed-transport-adapter.ts"
    ],
    "task_refs": []
  },
  {
    "capability_id": "cap:studio-editing",
    "name": "Existing Studio canonical document editing",
    "domain": "editing",
    "kind": "feature",
    "owner_repo": "vivim-web-harness",
    "surfaces": [
```

_First 80 of 233 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
