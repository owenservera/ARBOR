# File: demo/host-legacy/demo.css

> Generated 2026-11-19 · CSS · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | demo/host-legacy/demo.css |
| Language | CSS |
| Kind | source |
| Size | 10000 B |
| Lines | 315 |
| Hash | 0ad8c7406c79 |
| Test | no |
| Generated | no |
| Component | demo |

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
/* VIVIM Host demo shell — PC cockpit (C10 tokens only).
   Every color, spacing, radius, stroke, size and typeface comes from
   /vivim-tokens.css. No hex colors, no new -- token names, no raw
   font-family literals. Type scale comes from the token type classes
   (.eyebrow/.heading/.body/.label/.code) already in the markup. */
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body { background: var(--paper); color: var(--ink); font-family: var(--font-sans); }

#demo-shell {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4) var(--space-12);
  min-height: 100vh;
}

/* Header */
.demo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: var(--stroke-hair) solid var(--line);
}
.demo-header-text { display: flex; flex-direction: column; gap: var(--space-1); }
#demo-progress { color: var(--ink-muted); text-align: right; white-space: nowrap; }

/* Host menu step strip */
.demo-menu { display: flex; flex-direction: column; gap: var(--space-2); }
.demo-strip {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding: var(--space-2) 0;
}
.demo-strip::-webkit-scrollbar { display: none; }

.demo-step-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--control-h);
  padding: 0 var(--space-4);
  border: var(--stroke-hair) solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.demo-step-btn:hover { border-color: var(--line-strong); background: var(--surface-raised); }
.demo-step-btn:focus-visible { outline: var(--stroke-hair) solid var(--focus); outline-offset: 2px; }
.demo-step-btn.is-active {
  border-color: var(--mark);
  background: var(--mark-soft);
  color: var(--on-mark);
  font-weight: 600;
}
.demo-step-btn.is-done { border-color: var(--mark); }
.demo-step-btn.is-revise { border-color: var(--danger); }
.demo-step-chip { font-family: var(--font-mono); color: var(--ink-muted); }

/* Active step pane */
.demo-active { display: flex; flex-direction: column; gap: var(--space-6); }
.demo-pane-step { display: flex; flex-direction: column; gap: var(--space-4); }
.demo-step-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}
.demo-step-head > div { display: flex; flex-direction: column; gap: var(--space-1); }
#demo-step-id { color: var(--ink-muted); margin: 0; }
```

_First 80 of 316 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
