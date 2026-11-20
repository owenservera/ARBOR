# File: integration/worker-reports/W02-E-B-HOST-STATIC.patch

> Generated 2026-11-19 · Other · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/worker-reports/W02-E-B-HOST-STATIC.patch |
| Language | Other |
| Kind | other |
| Size | 821 B |
| Lines | 11 |
| Hash | 78976b9bf87d |
| Test | no |
| Generated | no |
| Component | integration |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```
diff --git a/apps/vivim-host/direct-phone.mjs b/apps/vivim-host/direct-phone.mjs
--- a/apps/vivim-host/direct-phone.mjs
+++ b/apps/vivim-host/direct-phone.mjs
@@ -26,6 +26,7 @@ const assets = new Map(Object.entries({
   'ux/mission-experience.mjs': ['ux/mission-experience.mjs', 'text/javascript; charset=utf-8'],
   'ux/render.mjs': ['ux/render.mjs', 'text/javascript; charset=utf-8'],
   'pairing-link.mjs': ['pairing-link.mjs', 'text/javascript; charset=utf-8'],
   'device-enrollment.mjs': ['device-enrollment.mjs', 'text/javascript; charset=utf-8'],
+  'browser-device-key.mjs': ['browser-device-key.mjs', 'text/javascript; charset=utf-8'],
   'control-phone.mjs': ['control-phone.mjs', 'text/javascript; charset=utf-8'],
   'control-client.mjs': ['control-client.mjs', 'text/javascript; charset=utf-8'],
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
