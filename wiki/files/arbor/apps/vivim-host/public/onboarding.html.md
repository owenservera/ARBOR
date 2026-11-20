# File: apps/vivim-host/public/onboarding.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/onboarding.html |
| Language | HTML |
| Kind | source |
| Size | 1933 B |
| Lines | 41 |
| Hash | 030bac54c3e1 |
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
  <title>VIVIM · Set up your World</title>
  <link rel="stylesheet" href="/vivim-tokens.css">
  <link rel="stylesheet" href="/host.css">
  <script defer src="/qrcode.js"></script>
  <script defer src="/onboarding.js"></script>
</head>
<body>
  <div class="shell onb">
    <aside class="sidebar" aria-label="Setup progress">
      <div class="brand"><span class="brand-mark" aria-hidden="true">V</span><div><strong>VIVIM</strong><small>MY MACHINE · MY AI</small></div></div>
      <nav class="rail" aria-label="Setup steps"><ol id="rail"></ol></nav>
      <div class="bg-strip" id="bg-strip" role="status" aria-live="polite" hidden></div>
      <div class="sidebar-foot">
        <span class="foot-led" aria-hidden="true"></span>
        <strong>Everything stays on this PC</strong>
        <small>No API keys. VIVIM uses the AI accounts you already have.</small>
      </div>
    </aside>
    <main id="main" tabindex="-1">
      <header class="topbar">
        <div><span class="eyebrow" id="eyebrow">SETUP</span><h1 id="heading">Set up your World</h1><p class="subtitle" id="subtitle"></p></div>
      </header>
      <div id="notice" class="notice" role="alert" hidden></div>
      <section id="panel" class="wizard-panel" aria-live="polite"></section>
      <footer class="wizard-foot">
        <button type="button" class="btn" id="back">Back</button>
        <span class="fineprint" id="hint"></span>
        <button type="button" class="btn primary" id="next">Continue</button>
      </footer>
    </main>
  </div>
</body>
</html>
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
