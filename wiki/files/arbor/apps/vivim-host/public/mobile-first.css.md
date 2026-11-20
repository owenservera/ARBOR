# File: apps/vivim-host/public/mobile-first.css

> Generated 2026-11-19 · CSS · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/mobile-first.css |
| Language | CSS |
| Kind | source |
| Size | 1087 B |
| Lines | 17 |
| Hash | 787ee80d3361 |
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

```css
/* Host presentation only. The app inside is the existing apps/mobile-relay PWA.
   Desktop pixels never select a separate navigation hierarchy or load Host Control. */
:root{color-scheme:dark;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#0d0e10}
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;overflow:hidden}
body{background:radial-gradient(circle at 50% 35%,#24262b,#0d0e10 60%)}
.phone-stage{width:100%;height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px}
.phone-frame{height:min(860px,calc(100dvh - 40px));width:min(420px,calc(100vw - 40px));
  overflow:hidden;border:1px solid #383a42;border-radius:28px;
  background:#111214;box-shadow:0 30px 85px #000b,0 0 0 5px #17191c}
#phone-surface{display:block;width:100%;height:100%;border:0;background:#111214}
@media(max-width:640px){
  body{background:#111214}
  .phone-stage{padding:0}
  .phone-frame{width:100%;height:100dvh;border:0;border-radius:0;box-shadow:none}
}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
