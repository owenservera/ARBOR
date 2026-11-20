# File: apps/mobile-relay/grokbot.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/grokbot.html |
| Language | HTML |
| Kind | source |
| Size | 2052 B |
| Lines | 4 |
| Hash | 2da2f7d6eafb |
| Test | no |
| Generated | no |
| Component | mobile-relay |

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
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0b0d10"><title>VIVIM · Grokbot</title>
<style>body{margin:0;background:#0b0d10;color:#e7eaf0;font:15px/1.5 system-ui;padding:16px;max-width:800px;margin:auto}a{color:#8ab5ff}header{display:flex;align-items:center;justify-content:space-between}h1{font-size:20px}textarea{box-sizing:border-box;width:100%;min-height:112px;border-radius:12px;border:1px solid #424b5a;background:#1a2028;color:#fff;padding:12px;font:inherit}button{padding:12px 20px;border:0;border-radius:10px;background:#77adff;color:#07101e;font:inherit;font-weight:600}button:disabled{opacity:.45}section{border:1px solid #27313e;border-radius:14px;padding:14px;margin:14px 0}article{border-bottom:1px solid #27313e;padding:14px 0;overflow-wrap:anywhere}article:last-child{border:0}small,output{color:#a3b1c4}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#161d26;padding:12px;border-radius:8px}label{display:block;margin:8px 0}#notice{color:#eebc83}</style>
</head><body><header><a href="/mobile/">← Talk</a><small id="host"></small></header><h1>Grokbot · Linux Direct</h1><p id="status" role="status">Checking local host…</p><section><label for="task">Task for the Grokbot worker</label><label for="task-class">Task class</label><select id="task-class" style="padding:12px;background:#1a2028;color:#fff;border:1px solid #424b5a;border-radius:10px"><option value="inspect">Inspect (read-only)</option><option value="analyze">Analyze (read-only)</option><option value="research">Research (read-only)</option></select><textarea id="task" maxlength="4000" placeholder="Describe one bounded task. This is not a shell command."></textarea><p><button id="send" disabled>Queue task once</button></p><p id="notice" role="alert"></p></section><section><h2>Job history</h2><div id="jobs" aria-live="polite"></div></section><script type="module" src="/mobile/grokbot.js"></script></body></html>
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
