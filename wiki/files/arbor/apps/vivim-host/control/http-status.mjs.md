# File: apps/vivim-host/control/http-status.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/http-status.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1005 B |
| Lines | 13 |
| Hash | 2194382dee9e |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONTROL_STATUS | const | 2 | no | const CONTROL_STATUS = Object.freeze({ CONTROL_PLAN_UNKNOWN: 404, CONTROL_PLAN_MISMATCH: 409, CONTROL_PLAN_TAMPERED: 409, CONTROL_UNCERTAIN: 409, CONTROL_APPROVAL_CONFLICT: 409, CONTROL_PLAN_EXPIRED:… |
| controlErrorStatus | function | 13 | yes | export function controlErrorStatus(code) { return CONTROL_STATUS[code] ?? 400; } |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./control/http-status.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./control/http-status.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// HTTP status for control error codes, shared by the desktop and Direct phone surfaces.
const CONTROL_STATUS = Object.freeze({
  CONTROL_PLAN_UNKNOWN: 404, CONTROL_PLAN_MISMATCH: 409, CONTROL_PLAN_TAMPERED: 409, CONTROL_UNCERTAIN: 409,
  CONTROL_APPROVAL_CONFLICT: 409, CONTROL_PLAN_EXPIRED: 410, CONTROL_PLAN_STALE: 409,
  CONTROL_FRESH_APPROVAL_REQUIRED: 403, CONTROL_DESKTOP_APPROVAL_REQUIRED: 403, CONTROL_APPROVAL_SOURCE_MISMATCH: 403,
  CONTROL_R3_REFUSED: 403, CONTROL_CANDIDATE_REFUSED: 403,
  CONTROL_WIKI_STALE: 409, CONTROL_WIKI_TARGET_UNKNOWN: 404,
  CONTROL_WIKI_CONTENT_INVALID: 413, CONTROL_WIKI_NOT_READY: 503,
  CONTROL_VISUAL_DEVICE_REQUIRED: 403, CONTROL_VISUAL_STALE: 409, CONTROL_VISUAL_NOT_READY: 503,
  CONTROL_VISUAL_READBACK_MISMATCH: 503,
  CONTROL_SEMANTIC_RULE_STALE:409,CONTROL_SEMANTIC_CONTEXT_STALE:409,CONTROL_WIKI_DEVICE_MISMATCH: 403, CONTROL_WIKI_READBACK_MISMATCH: 503,
});
export function controlErrorStatus(code) { return CONTROL_STATUS[code] ?? 400; }
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
