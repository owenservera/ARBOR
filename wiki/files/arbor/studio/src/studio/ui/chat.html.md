# File: studio/src/studio/ui/chat.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/chat.html |
| Language | HTML |
| Kind | source |
| Size | 70721 B |
| Lines | 1073 |
| Hash | 9ad933bbf2a3 |
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
<title>VIVIM — Your AI World</title>
<script type="module" src="/ui/chat.mjs"></script>
<style>
:root {
  --paper: #EEF1F4; --panel: #FFFFFF; --ink: #1D2733; --muted: #5D6B7A; --line: #D3DAE2; --hover: #E4E9EF;
  --l1: #2F6FB3; --l2: #7A4FB5; --l3: #2E8C6E; --act: #C2721B; --gap: #C23B3B; --ok: #2E8C6E;
  --sans: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif;
  --mono: "Cascadia Mono", "Cascadia Code", Consolas, "SF Mono", Menlo, monospace;
  /* Text-safe tones, used only by the Chat state chips (4.5:1 or better on paper, panel and tinted panels). */
  --chip-ok: #1C6B50; --chip-info: #235A96; --chip-warn: #8A4A00; --chip-bad: #A32A2A; --chip-mute: #556373;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root { --paper: #141A21; --panel: #1B232C; --ink: #DCE3EA; --muted: #8C9AA8; --line: #2C3742; --hover: #233039;
    --l1: #6EA6E6; --l2: #B08CE8; --l3: #5CC4A2; --act: #E9A55A; --gap: #EF6B6B; --ok: #5CC4A2;
    --chip-ok: #5CC4A2; --chip-info: #7DB2EC; --chip-warn: #E9A55A; --chip-bad: #F28080; --chip-mute: #9AA7B4; color-scheme: dark; }
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html, body { margin: 0; }
body { background: var(--paper); color: var(--ink); font: 14px/1.45 var(--sans); }
button, select, input, textarea { font: inherit; color: inherit; }
button { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 5px 14px; cursor: pointer; }
button:hover:not(:disabled) { background: var(--hover); }
button.primary { background: var(--l1); border-color: var(--l1); color: #fff; font-weight: 600; }
button.primary:hover:not(:disabled) { background: var(--l1); filter: brightness(1.08); }
button.live { background: transparent; border-color: var(--act); color: var(--act); font-weight: 600; }
button.live:hover:not(:disabled) { background: var(--act); color: var(--panel); }
button:disabled { opacity: .45; cursor: not-allowed; }
:focus-visible { outline: 2px solid var(--l1); outline-offset: 2px; }
input, select, textarea { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px; }
textarea { width: 100%; resize: vertical; }
a { color: var(--l1); }
code, .mono { font-family: var(--mono); font-size: 12.5px; }
.muted { color: var(--muted); }
.note { color: var(--muted); font-size: 12.5px; }
.note:empty, .err:empty { display: none; }
.err { color: var(--gap); overflow-wrap: anywhere; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* every Chat control has at least a 44px hit area */
button, select, input[type=text], input[type=search], input[type=file], textarea, summary, a.hit { min-height: 44px; }
a.hit { display: inline-flex; align-items: center; }
.pick { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 4px 10px; cursor: pointer; border-radius: 8px; }
.pick input { width: 22px; height: 22px; min-height: 0; margin: 0; padding: 0; flex: none; accent-color: var(--l1); }
.pick:hover { background: var(--hover); }
.pick:focus-within { outline: 2px solid var(--l1); outline-offset: 2px; }

header { display: flex; align-items: center; gap: 4px 18px; padding: 4px 18px; border-bottom: 1px solid var(--line); background: var(--panel); flex-wrap: wrap; }
header h1 { font-size: 15px; font-weight: 650; margin: 0; letter-spacing: -.01em; }
header .crumb b { font-weight: 600; }
header a { display: inline-flex; align-items: center; min-height: 44px; }

h2 { font-size: 17px; margin: 0 0 4px; font-weight: 650; letter-spacing: -.01em; }
h3 { font-size: 14px; margin: 14px 0 6px; font-weight: 650; }
p.lede { color: var(--muted); margin: 0 0 14px; max-width: 70ch; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
.pad { padding: 12px 14px; }
.row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.empty { color: var(--muted); padding: 22px; text-align: center; }

.wrap { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; padding: 18px 22px 24px; max-width: 1320px; margin: 0 auto; align-items: start; }
.wrap > * { min-width: 0; }
@media (min-width: 1100px) {
  .wrap { grid-template-columns: minmax(0, 1fr) 340px; }
  aside { position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow: auto; }
  #detailsBox > summary { display: none; }
}
@media (max-width: 700px) { .wrap { padding: 12px; } header { padding: 4px 12px; } }

details.panel > summary { cursor: pointer; font-weight: 650; padding: 0 14px; display: flex; align-items: center; }
details.panel[open] > summary { border-bottom: 1px solid var(--line); }
fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
legend { font-weight: 650; padding: 0; margin-bottom: 4px; }
.field { display: block; margin-top: 10px; }
```

_First 80 of 1074 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
