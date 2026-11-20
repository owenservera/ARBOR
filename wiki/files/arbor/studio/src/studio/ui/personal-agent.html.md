# File: studio/src/studio/ui/personal-agent.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/personal-agent.html |
| Language | HTML |
| Kind | source |
| Size | 9587 B |
| Lines | 136 |
| Hash | 86146c897386 |
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
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>VIVIM — Personal Agent</title>
<style>
:root{font-family:"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;color-scheme:dark;--base:#091522;--panel:#112437;--border:#2e526c;--text:#eff7ff;--muted:#afc4d8;--accent:#74d7c2;--danger:#ffc0ac}
@media(prefers-color-scheme:light){:root{color-scheme:light;--base:#eef4f6;--panel:#fff;--border:#bfced6;--text:#153146;--muted:#496276;--accent:#086657;--danger:#a9321b}}
*{box-sizing:border-box}body{margin:0;background:var(--base);color:var(--text);line-height:1.55}
main{max-width:1100px;margin:auto;padding:24px clamp(14px,4vw,48px) 72px}
header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:26px}
a{color:var(--accent)}h1{font-size:clamp(28px,4vw,43px);line-height:1.1;letter-spacing:-.04em;margin:8px 0}
h2{font-size:18px;margin:0 0 8px}.overline{color:var(--accent);font-size:12px;text-transform:uppercase;letter-spacing:.18em;font-weight:750}
p{max-width:70ch;margin:4px 0 14px}.subtle{color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
section{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:17px}
button,select,input,textarea{font:inherit;min-height:44px;border-radius:8px;border:1px solid var(--border);padding:8px 11px}
button{background:var(--accent);color:var(--base);font-weight:700;cursor:pointer}button:disabled{opacity:.5;cursor:not-allowed}
button.secondary{background:transparent;color:var(--text)}
label{display:block;font-weight:600;margin-top:12px}label span{display:block;margin-bottom:4px}
input,select,textarea{width:100%;color:var(--text);background:var(--base)}
textarea{min-height:90px;resize:vertical}code{font-family:"Cascadia Code",Consolas,monospace}
ol{padding-left:24px;margin:12px 0}li{padding:8px 0;border-bottom:1px solid var(--border)}
li:last-child{border-bottom:0}.status{font-weight:700;color:var(--accent)}
#notice[role=alert]{color:var(--danger)}#notice[role=status]{color:var(--accent)}
#notice{min-height:28px;overflow-wrap:anywhere}details{margin-top:12px}summary{cursor:pointer;font-weight:650}
.chip{display:inline-block;border:1px solid var(--border);border-radius:100px;padding:2px 10px;font-size:12px}
pre{max-height:360px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
</style>
<script type="module" src="/ui/personal-agent.mjs"></script>
</head>
<body>
<main>
<header>
<div><div class="overline">VIVIM World · local first</div><h1>Your Personal Agent</h1><p class="subtle">One durable identity. Memory you control. Abilities proven by evidence—not promises.</p></div>
<a href="/chat">← Back to VIVIM World</a>
</header>
<div class="grid">
<section>
<h2>Bootstrap lifecycle</h2>
<p id="state" class="status" aria-live="polite">Loading local state…</p>
<p id="scope" class="subtle"></p>
<button id="bootstrap" type="button" disabled>Bootstrap / Resume</button>
<button id="refresh" type="button" class="secondary">Refresh</button>
<p id="notice" role="status" aria-live="polite"></p>
</section>
<section>
<h2>Memory ownership</h2>
<p class="subtle">Three personal tiers. Nothing is imported from your provider conversations automatically.</p>
<div id="memoryCounts">Not yet initialized</div>
</section>
</div>
<section><h2>Four ordered stages</h2><ol id="stages"></ol></section>
<section>
<h2>Skills and capabilities</h2>
<p class="subtle">Discovered skill documents remain untrusted; registered tools are not evidence of live execution or account access.</p>
<button type="button" class="secondary" id="discover">Inspect available sources</button>
<div id="discovery" aria-live="polite"></div>
</section>
<section>
<h2>Agent Work</h2>
<p class="subtle">Keep tasks, saved next steps and progress history on this computer, even after you close Studio. Save an edited next action before updating a task's status. Resume makes a waiting task ready to continue; it does not start anything or send a message to an AI. "Find saved context" checks your own saved notes for a task. "Ask my AI about this" lets you edit a short question and send it to the AI accounts you choose; nothing is saved to Work until you explicitly review and approve an answer below.</p>
<form id="workForm">
<label><span>Task title</span><input id="workTitle" maxlength="160" required placeholder="Plan the weekly groceries"></label>
<label><span>What needs to be done?</span><textarea id="workObjective" maxlength="4000" required placeholder="Describe the task and what finished looks like"></textarea></label>
<button id="workCreate" type="submit" disabled>Add Work item</button>
</form>
<div id="workSummary" class="subtle" aria-live="polite"></div>
<label><span>Filter Work</span><select id="workFilter" aria-label="Filter local Work by status">
<option value="open">Open Work</option><option value="all">All Work</option>
<option value="queued">To do</option><option value="active">In progress</option>
<option value="blocked">Waiting for you</option><option value="completed">Done</option>
<option value="cancelled">Cancelled</option>
</select></label>
<p id="workCoverage" class="subtle" role="status">No local Work loaded yet.</p>
<div id="workList" aria-live="polite"></div>
</section>
```

_First 80 of 137 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
