# File: demo/host-legacy/demo-shell.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | demo/host-legacy/demo-shell.html |
| Language | HTML |
| Kind | source |
| Size | 5368 B |
| Lines | 105 |
| Hash | 3d6b9e2e33fe |
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
<!-- @vlang:surface apps/vivim-host/public/demo/demo-shell.html
     @vlang:surface-desc: PC (desktop) Host UI surface — first production version of the local Host.
     @vlang:surface-desc: Desktop cockpit layout wrapping the mobile PWA (iframe /mobile/?host-preview=1).
     @vlang:surface-desc: Host menus (#demo-strip), dev tools (#demo-journal, #demo-serve-info),
     @vlang:surface-desc: round controls (#demo-submit, #demo-approve-all). Mirrors demo.html's shell
     @vlang:surface-desc: contract (bindShell anchors, tokens + demo.css, defer controller.js, CSP-clean).
     @vlang:surface-desc: NL-driven change accepts none of: renaming #demo-* ids consumed by
     @vlang:surface-desc: controller.js bindShell, script/style injection (CSP C4), or changing
     @vlang:surface-desc: the /mobile/?host-preview=1 iframe target. demo.html stays in tree, unrouted.
     @vlang:id: demo-shell demo-progress demo-strip demo-active demo-phone demo-live-preview
     @vlang:id: demo-acceptance demo-feed demo-notes demo-tags demo-submit demo-approve-all
     @vlang:id: demo-journal demo-serve-info demo-status demo-step-id demo-step-title demo-step-badge
     @vlang:action: -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>VIVIM Host — ARBOR demo cockpit</title>
  <link rel="stylesheet" href="/vivim-tokens.css">
  <link rel="stylesheet" href="/demo/demo.css">
  <script defer src="/demo/controller.js"></script>
  <script defer src="/demo/overlays/overlay-A.js"></script>
  <script defer src="/demo/overlays/overlay-B.js"></script>
  <script defer src="/demo/overlays/overlay-C.js"></script>
  <script defer src="/demo/overlays/overlay-D.js"></script>
  <script defer src="/demo/overlays/overlay-Me.js"></script>
  <script type="module" defer src="/demo/overlays/overlay-today.js"></script>
  <script type="module" defer src="/demo/overlays/overlay-talk.js"></script>
</head>
<body>
  <div id="demo-shell" class="demo-shell">
    <header class="demo-header">
      <div class="demo-header-text">
        <p class="eyebrow">VIVIM Host · PC cockpit · loopback only</p>
        <h1 class="heading">VIVIM Queue Walkthrough · A01–A08</h1>
      </div>
      <div id="demo-progress" class="demo-progress code-sm" role="status">steps —</div>
    </header>

    <nav class="demo-menu" aria-label="Host menus — walkthrough steps">
      <p class="eyebrow">Host menus</p>
      <div id="demo-strip" class="demo-strip" role="tablist"></div>
    </nav>

    <main id="demo-active" class="demo-active">
      <!-- controller.js rebuilds step head, current state and decision chips here each render -->
    </main>

    <section class="demo-pane-step">
      <div class="demo-stage-grid">
        <div class="demo-stage-cell">
          <p class="eyebrow">Screen · fixture-rendered (current view)</p>
          <div id="demo-phone" class="demo-phone-stage"></div>
        </div>
        <div class="demo-stage-cell">
          <p class="eyebrow">Live preview · read-only phone frame</p>
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

    <section class="demo-pane-form">
      <label class="eyebrow" for="demo-notes">Notes</label>
      <textarea id="demo-notes" class="body-sm" placeholder="Notes for this step…"></textarea>
      <p class="eyebrow">Tags</p>
      <div id="demo-tags" class="demo-tags"></div>
    </section>

    <section class="demo-devtools">
      <p class="eyebrow">Dev tools</p>
      <div class="demo-devgrid">
```

_First 80 of 106 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
