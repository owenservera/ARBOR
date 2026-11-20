# File: apps/vivim-host/public/host.css

> Generated 2026-11-19 · CSS · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/host.css |
| Language | CSS |
| Kind | source |
| Size | 27239 B |
| Lines | 243 |
| Hash | ec91e3830553 |
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
/* VIVIM Host — Neckar Sandstone Lab. Every value comes from /vivim-tokens.css. */
:root{font-family:var(--font-sans);font-size:15px;line-height:23px;color:var(--ink);background:var(--paper);font-synthesis:none;-webkit-font-smoothing:antialiased}
*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0}
button{font:inherit;color:inherit;cursor:pointer}button:disabled{opacity:.55;cursor:default}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
h1,h2,h3{margin:0}
.shell{display:grid;grid-template-columns:var(--sidebar-w) minmax(0,1fr);min-height:100vh}
/* Sidebar */
.sidebar{display:flex;flex-direction:column;gap:var(--space-6);background:var(--surface);border-right:1px solid var(--line);padding:var(--space-6) var(--space-4);position:sticky;top:0;height:100vh}
.brand{display:flex;align-items:center;gap:var(--space-3);padding:0 var(--space-2)}
.brand strong{display:block;font:600 19px/22px var(--font-display);letter-spacing:.04em}
.brand small{display:block;margin-top:2px;font:500 10px/14px var(--font-mono);letter-spacing:.08em;color:var(--ink-muted)}
.brand-mark,.mirror-logo{display:grid;place-items:center;width:34px;height:34px;border-radius:var(--radius-sm);background:var(--mark);color:var(--on-mark);font:600 18px/1 var(--font-display);flex:none}
.sidebar-group{display:grid;gap:var(--space-1)}
.section-label{margin:0 0 var(--space-1);padding:0 var(--space-2);font:500 11px/16px var(--font-mono);letter-spacing:.08em;color:var(--ink-muted)}
.sidebar nav{display:grid;gap:2px}
.sidebar nav button{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:40px;padding:0 var(--space-3);border:0;border-radius:var(--radius-sm);background:none;color:var(--ink-muted);font:500 14px/20px var(--font-sans);text-align:left;position:relative}
.sidebar nav button:hover{color:var(--ink);background:var(--surface-raised)}
.sidebar nav button[aria-current="page"]{color:var(--ink);background:var(--mark-soft);font-weight:600}
.sidebar nav button[aria-current="page"]::before{content:"";position:absolute;left:0;top:10px;bottom:10px;width:2px;background:var(--mark)}
.nav-dot{width:6px;height:6px;border-radius:1px;background:var(--verified)}
.sidebar-foot{margin-top:auto;padding:var(--space-3) var(--space-2) 0;border-top:1px solid var(--line);display:grid;grid-template-columns:auto 1fr;gap:2px var(--space-2);align-items:center}
.foot-led{width:7px;height:7px;border-radius:1px;background:var(--verified)}
.sidebar-foot strong{font:600 13px/18px var(--font-sans)}
.sidebar-foot small{grid-column:2;color:var(--ink-muted);font-size:12px;line-height:17px}
/* Main */
main{padding:var(--space-10) var(--space-10) var(--space-12);max-width:calc(var(--content-max) + 2 * var(--space-10));width:100%;outline:none;background-color:var(--paper);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:24px 24px;background-position:-1px -1px}
.topbar{display:flex;justify-content:space-between;align-items:flex-end;gap:var(--space-6);margin-bottom:var(--space-8);padding-bottom:var(--space-5);border-bottom:1px solid var(--line-strong);position:relative}
.topbar::after{content:"";position:absolute;left:0;bottom:-1px;width:40px;height:3px;background:var(--mark)}
.eyebrow{display:block;font:500 11px/16px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:var(--space-2)}
h1{font:600 40px/44px var(--font-display);letter-spacing:-.035em}
.subtitle{margin:var(--space-2) 0 0;color:var(--ink-muted);max-width:640px}
.top-actions{display:flex;align-items:center;gap:var(--space-3);flex:none}
/* Buttons */
.refresh,.btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);min-height:var(--control-h);padding:0 var(--space-5);border-radius:var(--radius-sm);border:1px solid var(--line-strong);background:var(--surface-raised);font:550 13px/16px var(--font-sans);transition:border-color .16s ease-out,background-color .16s ease-out}
.refresh:hover:not(:disabled),.btn:hover:not(:disabled){border-color:var(--ink)}
.btn.primary{background:var(--mark);border-color:var(--mark);color:var(--on-mark)}
.btn.primary:hover:not(:disabled){background:var(--ink);border-color:var(--ink);color:var(--paper)}
.text-action{padding:var(--space-2) 0;border:0;background:none;color:var(--ink);font:500 13px/16px var(--font-sans);text-decoration:underline;text-decoration-color:var(--line-strong);text-underline-offset:4px}
.text-action:hover{text-decoration-color:var(--mark)}
/* Pills */
.pill{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:var(--radius-pill);border:1px solid var(--line);background:var(--surface-raised);font:500 11px/1 var(--font-mono);letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;color:var(--ink-muted)}
.pill::before{content:"";width:7px;height:7px;border-radius:1px;background:var(--ink-muted)}
.pill.online{color:var(--verified)}.pill.online::before{background:var(--verified)}
.pill.stale{color:var(--uncertain)}.pill.stale::before{background:var(--uncertain)}
.pill.blocked{color:var(--danger);border-color:var(--danger)}.pill.blocked::before{background:var(--danger)}
.pill.unknown::before,.pill.neutral::before{background:none;border:1.5px dashed var(--pencil);border-radius:50%;width:9px;height:9px}
.pill.unknown,.pill.neutral{border-style:dashed;border-color:var(--pencil);color:var(--pencil);background:transparent}
/* Connection strip: a measured instrument row */
.connection-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--surface-raised);margin-bottom:var(--space-6);overflow:hidden}
.connection-strip:empty{display:none}
.connection-item{display:grid;grid-template-columns:auto 1fr;gap:var(--space-1) var(--space-2);align-items:center;padding:var(--space-4) var(--space-5);border-left:1px solid var(--line)}
.connection-item:first-child{border-left:0}
.connection-indicator{width:8px;height:8px;border-radius:1px;border:1.5px dashed var(--pencil)}
.connection-indicator.online{background:var(--verified);border:0}.connection-indicator.stale{background:var(--uncertain);border:0}.connection-indicator.blocked{background:var(--danger);border:0}
.connection-name{font:500 11px/16px var(--font-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)}
.connection-item strong{grid-column:1/-1;font:500 22px/28px var(--font-display);letter-spacing:-.02em}
/* Diagnosis */
.diagnosis{display:flex;gap:var(--space-5);align-items:flex-start;background:var(--surface-raised);border:1px solid var(--line-strong);border-radius:var(--radius-lg);padding:var(--space-6);margin-bottom:var(--space-6);box-shadow:var(--shadow-sm)}
.diagnosis.warning{border-color:var(--uncertain);background:repeating-linear-gradient(135deg,transparent 0 8px,var(--memory-recent) 8px 9px),var(--surface-raised)}
.diagnosis.unknown{border:1.5px dashed var(--pencil);background:transparent;box-shadow:none}
.diagnosis-icon{display:grid;place-items:center;width:36px;height:36px;flex:none;border-radius:var(--radius-sm);border:1px solid var(--line-strong);font:500 15px/1 var(--font-mono);color:var(--ink)}
.diagnosis.warning .diagnosis-icon{border-color:var(--uncertain);color:var(--uncertain)}
.diagnosis.info .diagnosis-icon{border-color:var(--verified);color:var(--verified)}
.diagnosis h2{font:600 26px/32px var(--font-display);letter-spacing:-.02em;margin:0 0 var(--space-2)}
.diagnosis p{margin:0;color:var(--ink-muted);max-width:720px}
.next-step{margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--line)}
.next-step p{margin-top:var(--space-1);color:var(--ink)}
/* Panels */
.dashboard-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:var(--space-6);align-items:start}
.panel{background:var(--surface-raised);border:1px solid var(--line);border-radius:var(--radius-lg);padding:var(--space-6)}
.panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-4);margin-bottom:var(--space-5)}
.panel-head h2{font:600 18px/24px var(--font-sans);letter-spacing:-.01em}
.panel-head p{margin:var(--space-1) 0 0;color:var(--ink-muted);font-size:13px;line-height:19px}
.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-3)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-md);padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-2)}
.card-head{display:flex;justify-content:space-between;align-items:center;gap:var(--space-2)}
.card h3{font:600 15px/20px var(--font-sans)}
.card-explanation{margin:0;color:var(--ink-muted);font-size:13px;line-height:19px}
.card-foot{margin:auto 0 0;padding-top:var(--space-2);border-top:1px solid var(--line);font:400 11px/16px var(--font-mono);color:var(--ink-muted)}
```

_First 80 of 244 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
