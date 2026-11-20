# File: apps/vivim-host/public/mobile-first.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/mobile-first.js |
| Language | JavaScript |
| Kind | source |
| Size | 785 B |
| Lines | 14 |
| Hash | 8fef057fd6ae |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| iframe | const | 6 | no | const iframe = document.getElementById(&#39;phone-surface&#39;); |
| fragment | const | 8 | no | const fragment = window.location.hash; |
| target | const | 11 | no | const target = new URL(&#39;/mobile/?host-preview=1&#39;, window.location.origin); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Thin desktop presentation: the iframe is the actual mobile-relay app, not a clone.
// The native app's single-use launch code is transferred once and erased from the
// outer URL. The permanent owner capability is never placed in the webview.
(() => {
  'use strict';
  const iframe = document.getElementById('phone-surface');
  if (!iframe) return;
  const fragment = window.location.hash;
  const match = /^#control-session=([a-f0-9]{64})$/.exec(fragment);
  if (fragment) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  const target = new URL('/mobile/?host-preview=1', window.location.origin);
  if (match) target.hash = 'control-session=' + match[1];
  iframe.src = target.pathname + target.search + target.hash;
})();
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
