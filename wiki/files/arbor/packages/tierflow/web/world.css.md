# File: packages/tierflow/web/world.css

> Generated 2026-11-19 · CSS · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/world.css |
| Language | CSS |
| Kind | source |
| Size | 19250 B |
| Lines | 998 |
| Hash | 4388ccd713fd |
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
   WORLD SURFACE
   An instrument, not a demo: near-black ground, one accent from the world
   itself, mono labels on a strict rhythm, and a real layer hierarchy made
   visible with a 2px bar per layer. No decoration that does not carry meaning.
   ========================================================================== */

.world {
  --world-accent: #ff9d3d;
  --world-accent-soft: rgba(255, 157, 61, 0.16);
  --world-ink: #07080a;
  /* Secondary text on the world surface, kept above 5:1 on the panel. */
  --world-dim: #8a93a1;

  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 344px;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #07080a;
  color: var(--txt);
}

.world[hidden] {
  display: none;
}

/* `hidden` must win over the layout rules below, including on the surface itself. */
.world[hidden],
.world [hidden] {
  display: none !important;
}

.world__stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #07080a;
}

.world__stage canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
  background: #07080a;
}

.world__stage canvas:active {
  cursor: grabbing;
}

.world__stage canvas:focus-visible {
  outline: 2px solid var(--world-accent);
  outline-offset: -2px;
}

/* ------------------------------------------------------------- chrome -- */

.world__chrome {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 16px;
  pointer-events: none;
}

.world__chip {
  display: inline-flex;
```

_First 80 of 999 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
