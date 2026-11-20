# File: packages/tierflow/web/styles.css

> Generated 2026-11-19 · CSS · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/styles.css |
| Language | CSS |
| Kind | source |
| Size | 23406 B |
| Lines | 1091 |
| Hash | 77cb8445d284 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```css
/* ==========================================================================
   TIERFLOW — mission control
   Near-black canvas, one warm accent for live activity, one cool accent for
   structure. Everything on an 8px grid, numerals in monospace with tabular
   figures so readouts never jitter while ticking.
   ========================================================================== */

:root {
  /* --- palette (read by lib/palette.js for the canvas) --- */
  --bg: #07080a;
  --panel: #0d0f14;
  --panel-2: #11141a;
  --inset: #08090d;
  --line: #1b1f27;
  --line-2: #272d38;
  --txt: #e8ebf0;
  --txt-2: #98a1b0;
  --txt-3: #5c6472;

  --live: #ff9d3d;
  --cool: #4cc2e0;
  --ok: #46d39b;
  --err: #ff5f56;
  --warn: #ffd24a;
  --steel: #7f8fa3;

  --t1: #7f8fa3;
  --t2: #4cc2e0;
  --t3: #ff9d3d;

  --lvl-debug: rgba(127, 143, 163, 0.22);
  --lvl-info: rgba(127, 143, 163, 0.52);
  --lvl-warn: #ffd24a;
  --lvl-error: #ff5f56;

  /* --- rhythm --- */
  --s1: 8px;
  --s2: 16px;
  --s3: 24px;
  --s4: 32px;

  --mono: ui-monospace, "Cascadia Mono", "Cascadia Code", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --sans: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, sans-serif;
}

/* --------------------------------------------------------------- base -- */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
}

body {
  margin: 0;
  background:
    radial-gradient(1200px 640px at 16% -12%, rgba(76, 194, 224, 0.055), transparent 62%),
    radial-gradient(940px 520px at 94% 112%, rgba(255, 157, 61, 0.045), transparent 64%),
    var(--bg);
  color: var(--txt);
  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

/* film grain, inline so the console stays offline-safe */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  opacity: 0.045;
```

_First 80 of 1092 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
