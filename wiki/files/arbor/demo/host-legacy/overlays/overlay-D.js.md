# File: demo/host-legacy/overlays/overlay-D.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/overlays/overlay-D.js |
| Language | JavaScript |
| Kind | source |
| Size | 3429 B |
| Lines | 55 |
| Hash | 2f70d1919897 |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GROUP | const | 9 | no | const GROUP = &#39;A01 · A03 · A06 · A07 · A08&#39;; |
| SCREEN | const | 10 | no | const SCREEN = &#39;unmappable&#39;; |
| NOT_AVAILABLE | const | 11 | no | const NOT_AVAILABLE = &#39;Not available yet — the Host did not send this to the phone.&#39;; |
| GAP | const | 12 | no | const GAP = &#39;Unmappable group: no screen or code evidence in the tab inventories exists for queue items A01, A03, A06, A07, A08, so no screen, state, or visual change can be grounded.&#39;; |
| UNMAPPED_Q | const | 13 | no | const UNMAPPED_Q = |
| ITEMS | const | 16 | no | const ITEMS = [ |
| mount | function | 24 | no | function mount(el) { |
| panel | const | 27 | no | const panel = document.createElement(&#39;div&#39;); |
| head | const | 29 | no | const head = document.createElement(&#39;div&#39;); head.className = &#39;demo-overlay-head&#39;; |
| id | const | 30 | no | const id = document.createElement(&#39;span&#39;); id.className = &#39;demo-overlay-id&#39;; id.textContent = GROUP; |
| screen | const | 31 | no | const screen = document.createElement(&#39;h2&#39;); screen.className = &#39;demo-overlay-screen&#39;; screen.textContent = SCREEN; |
| gap | const | 34 | no | const gap = document.createElement(&#39;p&#39;); gap.className = &#39;demo-error&#39;; gap.textContent = NOT_AVAILABLE + &#39; &#39; + GAP; |
| row | const | 37 | no | const row = document.createElement(&#39;div&#39;); row.className = &#39;phone-row&#39;; |
| k | const | 38 | no | const k = document.createElement(&#39;div&#39;); k.className = &#39;phone-k&#39;; k.textContent = it.id; |
| v | const | 39 | no | const v = document.createElement(&#39;div&#39;); v.className = &#39;phone-v&#39;; v.textContent = &#39;unmappable — no screen or inventory evidence assigned&#39;; |
| q | const | 42 | no | const q = document.createElement(&#39;p&#39;); q.className = &#39;demo-acceptance&#39;; q.textContent = &#39;Q: &#39; + it.q; |
| unmount | function | 49 | no | function unmount(el) { |
| host | const | 53 | no | const host = typeof window !== &#39;undefined&#39; ? window : globalThis; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* DEMO overlay D — unmappable screen group A01 · A03 · A06 · A07 · A08.
   No fixture exists for these items: renders the honest NOT_AVAILABLE gap
   plus each item's acceptance question verbatim from the SPEC. No screen,
   no mockData, no invented visual change — nothing to accept until the
   mapper assigns a screen with cited inventory evidence. No network. */
(function () {
  'use strict';

  const GROUP = 'A01 · A03 · A06 · A07 · A08';
  const SCREEN = 'unmappable';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';
  const GAP = 'Unmappable group: no screen or code evidence in the tab inventories exists for queue items A01, A03, A06, A07, A08, so no screen, state, or visual change can be grounded.';
  const UNMAPPED_Q =
    'A08 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?';

  const ITEMS = [
    { id: 'A01', q: 'A01 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' },
    { id: 'A03', q: 'A03 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' },
    { id: 'A06', q: 'A06 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' },
    { id: 'A07', q: 'A07 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' },
    { id: 'A08', q: 'A08 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' }
  ];

  function mount(el) {
    if (!el || el.nodeType !== 1) throw new Error('overlay-D: mount requires a slot element');
    el.textContent = '';
    const panel = document.createElement('div');
    panel.className = 'demo-overlay demo-overlay-unmappable';
    const head = document.createElement('div'); head.className = 'demo-overlay-head';
    const id = document.createElement('span'); id.className = 'demo-overlay-id'; id.textContent = GROUP;
    const screen = document.createElement('h2'); screen.className = 'demo-overlay-screen'; screen.textContent = SCREEN;
    head.appendChild(id); head.appendChild(screen);
    panel.appendChild(head);
    const gap = document.createElement('p'); gap.className = 'demo-error'; gap.textContent = NOT_AVAILABLE + ' ' + GAP;
    panel.appendChild(gap);
    ITEMS.forEach(it => {
      const row = document.createElement('div'); row.className = 'phone-row';
      const k = document.createElement('div'); k.className = 'phone-k'; k.textContent = it.id;
      const v = document.createElement('div'); v.className = 'phone-v'; v.textContent = 'unmappable — no screen or inventory evidence assigned';
      row.appendChild(k); row.appendChild(v);
      panel.appendChild(row);
      const q = document.createElement('p'); q.className = 'demo-acceptance'; q.textContent = 'Q: ' + it.q;
      panel.appendChild(q);
    });
    el.appendChild(panel);
    return el;
  }

  function unmount(el) {
    if (el && el.nodeType === 1) el.textContent = '';
  }

  const host = typeof window !== 'undefined' ? window : globalThis;
  host.overlayD = { mount: mount, unmount: unmount };
})();
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
