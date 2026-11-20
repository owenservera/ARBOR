# File: demo/host-legacy/demo.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | demo/host-legacy/demo.html |
| Language | HTML |
| Kind | source |
| Size | 5607 B |
| Lines | 111 |
| Hash | 923f3efddc23 |
| Test | no |
| Generated | no |
| Component | demo |

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
<!-- @vlang:surface apps/vivim-host/public/demo/demo.html
     @vlang:surface-desc: Static shell of the ARBOR baseline demo walkthrough — the reprogrammable
     @vlang:surface-desc: surface is static copy (eyebrows, headings, serve-info text), section
     @vlang:surface-desc: structure inside .demo-* containers, and button labels. NL-driven
     @vlang:surface-desc: change accepts none of: renaming #demo-* ids consumed by
     @vlang:surface-desc: controller.js bindShell, script/style injection (CSP C4), or changing
     @vlang:surface-desc: the /mobile/?host-preview=1 iframe target. The fixture feed and
     @vlang:surface-desc: decision controls stay read-only shells; POST /demo/feedback remains
     @vlang:surface-desc: the only writable surface of the whole /demo tree.
     @vlang:surface-desc: NLCL linkage: no action in control/action-catalog.v1.json v7 targets
     @vlang:surface-desc: this file yet — actionIds stays empty until one is catalogued.
     @vlang:id: demo-shell demo-progress demo-strip demo-step-badge demo-phone
     @vlang:id: demo-live-preview demo-acceptance demo-feed demo-notes demo-tags
     @vlang:id: demo-btn-approve demo-btn-revise demo-decision-chip demo-journal
     @vlang:id: demo-serve-info demo-status demo-submit demo-approve-all
     @vlang:action: -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>ARBOR baseline — VIVIM Direct PWA as shipped</title>
  <link rel="stylesheet" href="/vivim-tokens.css">
  <link rel="stylesheet" href="/demo/demo.css">
  <script defer src="/demo/controller.js"></script>
</head>
<body>
  <div id="demo-shell" class="demo-shell">
    <header class="demo-header">
      <div class="demo-header-text">
        <p class="eyebrow">VIVIM Host · PC cockpit · loopback only</p>
        <h1 class="heading">ARBOR baseline — VIVIM Direct PWA as shipped</h1>
      </div>
      <div id="demo-progress" class="demo-progress code-sm" role="status">approved 0 · revise 0 of 6</div>
    </header>

    <nav class="demo-menu" aria-label="Host menus — walkthrough steps">
      <p class="eyebrow">Host menus</p>
      <div id="demo-strip" class="demo-strip" role="tablist"></div>
    </nav>

    <main id="demo-active" class="demo-active">
      <section class="demo-pane-step">
        <div class="demo-step-head">
          <div>
            <p id="demo-step-id" class="eyebrow"></p>
            <h2 id="demo-step-title" class="headline"></h2>
          </div>
          <span id="demo-step-badge" class="demo-badge code-sm"></span>
        </div>
        <div class="demo-stage-grid">
          <div class="demo-stage-cell">
            <p class="eyebrow">Screen · fixture-rendered (current view)</p>
            <div id="demo-phone" class="demo-phone-stage"></div>
          </div>
          <div class="demo-stage-cell">
            <p class="eyebrow">Live preview · read-only</p>
            <div class="demo-phone-live">
              <iframe id="demo-live-preview" src="/mobile/?host-preview=1" referrerpolicy="no-referrer" title="VIVIM phone PWA · live read-only preview"></iframe>
            </div>
          </div>
        </div>
        <p id="demo-acceptance" class="demo-acceptance body-sm"></p>
        <section class="demo-feedwrap">
          <p class="eyebrow">Fixture feed · mockData (dev tool)</p>
          <div id="demo-feed" class="demo-feed code-sm"></div>
        </section>
      </section>

      <aside class="demo-pane-form">
        <label class="eyebrow" for="demo-notes">Notes</label>
        <textarea id="demo-notes" class="body-sm" placeholder="Notes for this step…"></textarea>
        <p class="eyebrow">Tags</p>
        <div id="demo-tags" class="demo-tags"></div>
        <div class="demo-decision">
          <button type="button" id="demo-btn-approve" class="demo-btn">Approve</button>
          <button type="button" id="demo-btn-revise" class="demo-btn">Revise</button>
        </div>
        <p id="demo-decision-chip" class="demo-decision-chip code-sm">— not decided</p>
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
