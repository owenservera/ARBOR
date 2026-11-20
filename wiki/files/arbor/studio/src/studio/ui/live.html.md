# File: studio/src/studio/ui/live.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/live.html |
| Language | HTML |
| Kind | source |
| Size | 1129 B |
| Lines | 23 |
| Hash | 2c072450f248 |
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
  <title>Capture Studio — Live text</title>
  <script type="module" src="/live/view.mjs"></script>
</head>
<body>
  <h1>Live capture text</h1>
  <p><a href="/">Studio</a> · <a href="/chat">Chat</a> · <a href="/drive">Live drive</a> · Private local preview. Recording must be started in Studio.</p>
  <form id="filters">
    <label>Stream ID <input name="sid" autocomplete="off"></label>
    <label>Kind <input name="kind" autocomplete="off" placeholder="Optional comma-separated kinds"></label>
    <button type="submit">Connect</button>
    <button type="button" id="disconnect">Disconnect</button>
    <button type="button" id="clear">Clear text</button>
  </form>
  <p id="status" role="status">Connecting…</p>
  <p>Display is bounded to 100 streams and 200,000 characters per stream. Full evidence remains in the recording; oversized feed events and expired cursors are reported.</p>
  <main id="streams" aria-label="Captured streams"></main>
</body>
</html>
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
