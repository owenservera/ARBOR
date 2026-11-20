# File: studio/src/studio/ui/drive.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/drive.html |
| Language | HTML |
| Kind | source |
| Size | 16411 B |
| Lines | 262 |
| Hash | d3e71738ff05 |
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
<title>Capture Studio — Live drive</title>
<script type="module" src="/ui/drive.mjs"></script>
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
[hidden] { display: none !important; }
html, body { margin: 0; }
body { background: var(--paper); color: var(--ink); font: 14px/1.45 var(--sans); }
button, select, input, textarea { font: inherit; color: inherit; }
button { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 5px 12px; cursor: pointer; }
button:hover:not(:disabled) { background: var(--hover); }
button.primary { background: var(--l1); border-color: var(--l1); color: #fff; font-weight: 600; }
button.primary:hover:not(:disabled) { background: var(--l1); filter: brightness(1.08); }
button.stop { background: var(--gap); border-color: var(--gap); color: #fff; }
button.stop:hover:not(:disabled) { background: var(--gap); filter: brightness(1.08); }
button.live { background: transparent; border-color: var(--act); color: var(--act); font-weight: 600; }
button.live:hover:not(:disabled) { background: var(--act); color: var(--panel); }
button:disabled { opacity: .45; cursor: not-allowed; }
:focus-visible { outline: 2px solid var(--l1); outline-offset: 2px; }
input, select, textarea { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px; }
input[type=checkbox], input[type=radio] { width: 16px; height: 16px; padding: 0; accent-color: var(--l1); margin: 2px 0 0; }
textarea { width: 100%; resize: vertical; }
code, .mono { font-family: var(--mono); font-size: 12.5px; }
a { color: var(--l1); }
.muted { color: var(--muted); }
.small-note { color: var(--muted); font-size: 12.5px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* top bar, same shape as the Studio */
header { display: flex; align-items: center; gap: 18px; padding: 10px 18px; border-bottom: 1px solid var(--line); background: var(--panel); flex-wrap: wrap; }
header h1 { font-size: 15px; font-weight: 650; margin: 0; letter-spacing: -.01em; }
header .crumb { color: var(--muted); }
header .crumb b { color: var(--ink); font-weight: 600; }

h2 { font-size: 17px; margin: 0 0 4px; font-weight: 650; letter-spacing: -.01em; }
h3 { font-size: 14px; margin: 18px 0 8px; font-weight: 650; }
p.lede { color: var(--muted); margin: 0 0 14px; max-width: 70ch; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
.pad { padding: 12px 14px; }
.row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.empty { color: var(--muted); padding: 22px; text-align: center; }
.err { color: var(--gap); overflow-wrap: anywhere; }
.err:empty, .note:empty { display: none; }
.note { color: var(--muted); font-size: 12.5px; }

.wrap { display: grid; grid-template-columns: minmax(320px, 5fr) minmax(340px, 6fr); gap: 20px; padding: 18px 22px 40px; max-width: 1320px; margin: 0 auto; align-items: start; }
.wrap > * { min-width: 0; }
.job-col { position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow: auto; }

.warn { padding: 9px 12px; border-left: 3px solid var(--act); background: var(--hover); margin: 0 0 14px; border-radius: 0 6px 6px 0; }
.warn b { font-weight: 650; }

fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
fieldset.panel { padding: 10px 14px 12px; margin: 0 0 14px; }
legend { font-weight: 650; padding: 0; margin-bottom: 6px; }
label { cursor: pointer; }
.field { display: block; margin-top: 10px; }
.field > span.lab { display: block; font-weight: 600; margin-bottom: 4px; }

/* mode */
.modes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.modes label { display: grid; grid-template-columns: auto 1fr; gap: 0 9px; padding: 9px 11px; border: 1px solid var(--line); border-radius: 8px; }
.modes label:hover { background: var(--hover); }
.modes label:has(input:checked) { border-color: var(--l1); background: color-mix(in srgb, var(--l1) 9%, var(--panel)); }
.modes label:focus-within { outline: 2px solid var(--l1); outline-offset: 2px; }
```

_First 80 of 263 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
