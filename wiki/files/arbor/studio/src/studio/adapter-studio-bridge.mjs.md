# File: studio/src/studio/adapter-studio-bridge.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adapter-studio-bridge.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 998 B |
| Lines | 12 |
| Hash | 5f597eebb543 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createStudioAdapterLearner | function | 9 | yes | export function createStudioAdapterLearner({ verifyCapture, store }) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./adaptive-adapter-factory.mjs | import | 6 | [studio/src/studio/adaptive-adapter-factory.mjs](./adaptive-adapter-factory.mjs.md) |
| ./adapter-holdout-gate.mjs | import | 7 | [studio/src/studio/adapter-holdout-gate.mjs](./adapter-holdout-gate.mjs.md) |
| ./adapter-improvement-pipeline.mjs | import | 8 | [studio/src/studio/adapter-improvement-pipeline.mjs](./adapter-improvement-pipeline.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-learning-pipeline.mjs](./adapter-learning-pipeline.mjs.md) | ./adapter-studio-bridge.mjs |
| [studio/src/studio/four-lane-gates.mjs](./four-lane-gates.mjs.md) | ./adapter-studio-bridge.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// I1 studio bridge, integrated from the four-lane CONSOLIDATED bundle
// (original supplier blob e31e5979c37ea1acc472ad02e444ba6c928be15b, only the import seam
// relocated per SOURCE-LEDGER.json bundleBridgeModification — here to PRODUCT paths, not
// raw implementations, so the single integrated Round 8 factory + Round 9 holdout gate are
// the only copies in the runtime. No duplicate registry, controller, sender or learner journal.)
import { synthesizeWebappAdapter, shadowEvaluateAdapter } from './adaptive-adapter-factory.mjs';
import { assertIndependentAdapterHoldout } from './adapter-holdout-gate.mjs';
import { createAdapterImprovementPipeline } from './adapter-improvement-pipeline.mjs';
export function createStudioAdapterLearner({ verifyCapture, store }) {
  return createAdapterImprovementPipeline({ synthesize: synthesizeWebappAdapter, shadowEvaluate: shadowEvaluateAdapter,
    assertIndependentHoldout: assertIndependentAdapterHoldout, verifyCapture, store });
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
