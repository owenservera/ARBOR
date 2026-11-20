# File: apps/vivim-host/public/index.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/index.html |
| Language | HTML |
| Kind | source |
| Size | 10092 B |
| Lines | 119 |
| Hash | d005b1c080c3 |
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

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f5f3ef" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111214" media="(prefers-color-scheme: dark)">
  <title>VIVIM Host · Your world, local</title>
  <link rel="stylesheet" href="/vivim-tokens.css">
  <link rel="stylesheet" href="/host.css">
  <script defer src="/host.js"></script>
  <script defer src="/control-panel.js"></script>
</head>
<body>
  <div class="shell">
    <aside class="sidebar" aria-label="VIVIM navigation">
      <div class="brand"><span class="brand-mark" aria-hidden="true">V</span><div><strong>VIVIM</strong><small>MY MACHINE · MY AI</small></div></div>
      <div class="sidebar-group">
        <p class="section-label">MY VIVIM</p>
        <nav aria-label="Personal app areas" id="nav">
          <button type="button" data-view="today">Today</button>
          <button type="button" data-view="talk">Talk</button>
          <button type="button" data-view="agents">Agents</button>
          <button type="button" data-view="self">Self</button>
          <button type="button" data-view="build">Build</button>
        </nav>
      </div>
      <div class="sidebar-group">
        <p class="section-label">YOUR PC</p>
        <nav aria-label="Host areas"><button type="button" data-view="control" aria-current="page">Host Control <span class="nav-dot" aria-hidden="true"></span></button></nav>
      </div>
      <div class="sidebar-foot">
        <span class="foot-led" aria-hidden="true"></span>
        <strong>Locally hosted</strong>
        <small>Diagnostics only · no automatic sends</small>
      </div>
    </aside>
    <main id="main" tabindex="-1">
      <header class="topbar">
        <div><span class="eyebrow">VIVIM · LOCAL HOST</span><h1 id="heading">Host Control</h1><p class="subtitle" id="page-subtitle">A real picture of what's happening between your phone and your AI.</p></div>
        <div class="top-actions"><span id="host-pill" class="pill neutral" role="status">Checking local host</span><button id="refresh" type="button" class="refresh">Refresh status</button></div>
      </header>
      <section id="control-view" class="view">
        <section class="panel text-control-panel" aria-labelledby="text-control-heading">
          <div class="panel-head"><div><span class="eyebrow">UNIVERSAL TEXT CONTROL · LOCAL HOST</span><h2 id="text-control-heading">Ask VIVIM to do something</h2><p>Text and graphical controls share the same typed action contract, owner approval, and durable receipts.</p></div></div>
          <div class="text-control-auth">
            <p class="fineprint">This session is authorized by the installed VIVIM desktop app, using a one-time launch code. Your permanent PC capability never enters the page.</p>
            <button type="button" id="host-control-unlock" class="text-control-button">Check secure session</button>
            <button type="button" id="host-control-lock" class="text-control-button" hidden>Lock</button>
          </div>
          <p id="host-control-auth-status" class="fineprint" role="status">Owner authorization required.</p>
          <form id="host-command-form" class="text-control-compose">
            <label for="host-command-text">Tell VIVIM what you want to see or change</label>
            <textarea id="host-command-text" rows="2" maxlength="1000" placeholder="e.g. set my theme to dusk" disabled></textarea>
            <button id="host-command-submit" class="text-control-button primary" type="submit" disabled>Review request</button>
          </form>
          <div class="text-control-quick-preference">
            <label for="host-remember-preference">Remember a personal preference</label>
            <div class="row-actions">
              <input id="host-remember-preference" type="text" maxlength="200" placeholder="I prefer compact layouts" disabled>
              <button id="host-remember-review" type="button" class="text-control-button" disabled>Review preference</button>
            </div>
            <p class="fineprint">Review before saving. Uses the same Host action approval and undo receipt as text commands; inferred suggestions are not activated.</p>
            <div class="row-actions"><h3>Preferences you saved</h3>
              <button id="host-preferences-refresh" type="button" class="text-control-button" disabled>Refresh saved preferences</button>
            </div>
            <div id="host-preferences-list" aria-live="polite"></div>
          </div>
          <div id="host-control-examples" class="text-control-examples" aria-label="Example commands"></div>
          <div id="host-control-result" class="text-control-result" role="status" aria-live="polite"><p>Unlock to review commands. No changes are executed automatically.</p></div>
          <details class="text-control-discover"><summary>Browse typed actions and configuration</summary><div id="host-control-catalog" class="text-control-catalog"></div></details>
          <div class="text-control-receipts"><div class="row-actions"><h3>History and recovery</h3><button type="button" id="host-control-refresh" class="text-control-button">Refresh receipts</button></div><div id="host-control-recent" aria-live="polite"></div></div>
          <p class="fineprint">Authorization is scoped to this browser session, expires automatically, and is revocable with Lock. Phone pairing codes cannot unlock desktop control.</p>
        </section>
        <section class="panel text-control-panel" aria-labelledby="web-memory-heading">
          <div class="panel-head"><div><span class="eyebrow">PRIVATE OBSERVED MEMORY</span>
            <h2 id="web-memory-heading">What did I browse today?</h2>
            <p>Source-linked browser visits only. Never an AI guess or a record of page contents.</p></div>
            <button type="button" id="host-web-memory-refresh" class="text-control-button">Refresh visits</button></div>
```

_First 80 of 119 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
