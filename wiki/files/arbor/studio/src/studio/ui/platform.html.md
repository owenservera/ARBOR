# File: studio/src/studio/ui/platform.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/platform.html |
| Language | HTML |
| Kind | source |
| Size | 9090 B |
| Lines | 213 |
| Hash | 581b691987e8 |
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
  <title>Capture Studio — Platform</title>
  <script type="module" src="/ui/platform.mjs"></script>
  <style>
    :root {
      --bg: #ffffff;
      --fg: #14181d;
      --muted: #5b6672;
      --line: #d7dde4;
      --panel: #f6f8fa;
      --accent: #1c5fd6;
      --ok: #17683a;
      --warn: #8a4b00;
      --bad: #a01818;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #14181d;
        --fg: #e6eaf0;
        --muted: #9aa6b4;
        --line: #2c333c;
        --panel: #1b212a;
        --accent: #6fa3ff;
        --ok: #62d18a;
        --warn: #e0a44e;
        --bad: #ff8080;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      font: 15px/1.5 ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--line);
      display: flex;
      flex-wrap: wrap;
      gap: 12px 18px;
      align-items: center;
    }
    h1 { font-size: 18px; margin: 0; }
    h2 { font-size: 16px; margin: 0 0 10px; }
    h3 { font-size: 14px; margin: 16px 0 6px; }
    main { padding: 18px; max-width: 1200px; }
    nav { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 18px 0; border-bottom: 1px solid var(--line); }
    nav button {
      background: transparent;
      border: 1px solid transparent;
      border-bottom: none;
      color: var(--muted);
      cursor: pointer;
      font: inherit;
      padding: 8px 14px;
      border-radius: 6px 6px 0 0;
    }
    nav button[aria-selected="true"] {
      background: var(--panel);
      border-color: var(--line);
      color: var(--fg);
      font-weight: 600;
    }
    .panel { display: none; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; }
    .panel.active { display: block; }
    .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
    label { color: var(--muted); }
    select, input[type="text"], input[type="search"], textarea, button.action {
      font: inherit;
      color: var(--fg);
      background: var(--bg);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 6px 8px;
    }
```

_First 80 of 214 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
