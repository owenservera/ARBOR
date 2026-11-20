# File: studio/src/studio/adapter-holdout-gate.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adapter-holdout-gate.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1170 B |
| Lines | 13 |
| Hash | 63e98512bf88 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| assertIndependentAdapterHoldout | function | 2 | yes | export function assertIndependentAdapterHoldout(candidate, heldoutSessionIds) { |
| training | const | 9 | no | const training=new Set(candidate.evidence.captureRefs); |
| overlap | const | 10 | no | const overlap=[...new Set(heldoutSessionIds)].filter(x=&gt;training.has(x)); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-studio-bridge.mjs](./adapter-studio-bridge.mjs.md) | ./adapter-holdout-gate.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure candidate-versus-heldout independence gate. No browser or store access.
export function assertIndependentAdapterHoldout(candidate, heldoutSessionIds) {
  if(candidate?.schema!=='aion.adaptive-webapp-adapter/1'||!candidate.evidence||!Array.isArray(candidate.evidence.captureRefs))
    throw Object.assign(new Error('TRAINING_EVIDENCE_MISSING'),{code:'TRAINING_EVIDENCE_MISSING'});
  if(candidate.evidence.capturesTruncated===true)
    throw Object.assign(new Error('TRAINING_EVIDENCE_TRUNCATED'),{code:'TRAINING_EVIDENCE_TRUNCATED'});
  if(!Array.isArray(heldoutSessionIds)||heldoutSessionIds.length===0||heldoutSessionIds.some(x=>typeof x!=='string'||!x))
    throw Object.assign(new Error('HELDOUT_EVIDENCE_MISSING'),{code:'HELDOUT_EVIDENCE_MISSING'});
  const training=new Set(candidate.evidence.captureRefs);
  const overlap=[...new Set(heldoutSessionIds)].filter(x=>training.has(x));
  if(overlap.length)throw Object.assign(new Error('HELDOUT_OVERLAPS_TRAINING'),{code:'HELDOUT_OVERLAPS_TRAINING',overlapCount:overlap.length});
  return Object.freeze({independent:true,trainingCount:training.size,heldoutCount:new Set(heldoutSessionIds).size});
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
