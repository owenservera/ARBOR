# File: studio/src/studio/ui/index.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/index.html |
| Language | HTML |
| Kind | source |
| Size | 147240 B |
| Lines | 1959 |
| Hash | 5ed7ec0e5534 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Capture Studio</title>
<style>
:root {
  --paper: #EEF1F4; --panel: #FFFFFF; --ink: #1D2733; --muted: #5D6B7A; --line: #D3DAE2; --hover: #E4E9EF;
  --l1: #2F6FB3; --l2: #7A4FB5; --l3: #2E8C6E; --act: #C2721B; --gap: #C23B3B; --ok: #2E8C6E;
  --sans: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif;
  --mono: "Cascadia Mono", "Cascadia Code", Consolas, "SF Mono", Menlo, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root { --paper: #141A21; --panel: #1B232C; --ink: #DCE3EA; --muted: #8C9AA8; --line: #2C3742; --hover: #233039;
    --l1: #6EA6E6; --l2: #B08CE8; --l3: #5CC4A2; --act: #E9A55A; --gap: #EF6B6B; --ok: #5CC4A2; color-scheme: dark; }
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body { background: var(--paper); color: var(--ink); font: 14px/1.45 var(--sans); display: grid; grid-template-rows: auto auto 1fr; }
button, select, input, textarea { font: inherit; color: inherit; }
button { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 5px 12px; cursor: pointer; }
button:hover { background: var(--hover); }
button.primary { background: var(--l1); border-color: var(--l1); color: #fff; }
button.stop { background: var(--gap); border-color: var(--gap); color: #fff; }
button:disabled { opacity: .45; cursor: default; }
:focus-visible { outline: 2px solid var(--l1); outline-offset: 2px; }
input, select, textarea { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px; }
code, pre, .mono { font-family: var(--mono); font-size: 12.5px; }
a { color: var(--l1); }

/* top bar */
header { display: flex; align-items: center; gap: 18px; padding: 10px 18px; border-bottom: 1px solid var(--line); background: var(--panel); flex-wrap: wrap; }
header h1 { font-size: 15px; font-weight: 650; margin: 0; letter-spacing: -.01em; }
.state { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--muted); }
.recording .dot { background: var(--gap); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .35; } }
@media (prefers-reduced-motion: reduce) { .recording .dot { animation: none; } }
.counters { display: flex; gap: 16px; color: var(--muted); font-variant-numeric: tabular-nums; flex-wrap: wrap; }
.counters b { color: var(--ink); font-weight: 600; }
.counters .gapn b { color: var(--gap); }
.target { color: var(--muted); max-width: 40ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* layer strip: the signature element */
#strip { position: relative; background: var(--panel); border-bottom: 1px solid var(--line); }
#strip canvas { display: block; width: 100%; height: 112px; }
#strip .lanes { position: absolute; left: 0; top: 0; bottom: 0; width: 132px; display: grid; grid-template-rows: repeat(4, 1fr); pointer-events: none; }
#strip .lanes span { display: flex; align-items: center; padding-left: 18px; font-size: 12px; font-weight: 600; }
.c-l1 { color: var(--l1); } .c-l2 { color: var(--l2); } .c-l3 { color: var(--l3); } .c-act { color: var(--act); } .c-gap { color: var(--gap); }

/* body */
main { display: grid; grid-template-columns: 172px 1fr; min-height: 0; }
nav { border-right: 1px solid var(--line); padding: 14px 10px; display: flex; flex-direction: column; gap: 2px; }
nav button { text-align: left; border: 0; background: none; padding: 7px 10px; border-radius: 6px; }
nav button[aria-current="page"] { background: var(--hover); font-weight: 600; }
nav a.navlink { padding: 7px 10px; border-radius: 6px; color: inherit; text-decoration: none; white-space: nowrap; }
nav a.navlink:hover { background: var(--hover); }
nav .src { margin-top: auto; font-size: 12px; color: var(--muted); padding: 10px; border-top: 1px solid var(--line); }
section.view { display: none; padding: 18px 22px; overflow: auto; min-height: 0; }
section.view.on { display: block; }
h2 { font-size: 17px; margin: 0 0 4px; font-weight: 650; letter-spacing: -.01em; }
h3 { font-size: 14px; margin: 18px 0 8px; font-weight: 650; }
p.lede { color: var(--muted); margin: 0 0 16px; max-width: 72ch; }
.row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
.pad { padding: 12px 14px; }
table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
th { text-align: left; font-weight: 600; color: var(--muted); font-size: 12.5px; padding: 6px 10px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--panel); }
td { padding: 6px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
tr.click { cursor: pointer; } tr.click:hover td { background: var(--hover); } tr.sel td { background: var(--hover); }
td.num { text-align: right; }
.pill { display: inline-block; border: 1px solid currentColor; border-radius: 99px; padding: 0 7px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.empty { color: var(--muted); padding: 24px; text-align: center; }
.scroll { max-height: 60vh; overflow: auto; }

/* targets */
.targets label { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; padding: 9px 12px; border-bottom: 1px solid var(--line); cursor: pointer; }
.targets label:hover { background: var(--hover); }
```

_First 80 of 1960 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
