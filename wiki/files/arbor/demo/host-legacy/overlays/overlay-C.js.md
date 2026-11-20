# File: demo/host-legacy/overlays/overlay-C.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/overlays/overlay-C.js |
| Language | JavaScript |
| Kind | source |
| Size | 7424 B |
| Lines | 161 |
| Hash | 29a1023f9c40 |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ITEM_ID | const | 11 | no | const ITEM_ID = &#39;A02&#39;; |
| SCREEN | const | 12 | no | const SCREEN = &#39;World&#39;; |
| FIXTURE_URL | const | 13 | no | const FIXTURE_URL = &#39;/demo/fixture/tab-world.json&#39;; |
| NOT_AVAILABLE | const | 14 | no | const NOT_AVAILABLE = &#39;Not available yet — the Host did not send this to the phone.&#39;; |
| ACCEPTANCE_QUESTION | const | 16 | no | const ACCEPTANCE_QUESTION = |
| SPEC_CURRENT_STATE | const | 19 | no | const SPEC_CURRENT_STATE = |
| SPEC_MOCKDATA | const | 25 | no | const SPEC_MOCKDATA = { |
| clip | function | 48 | no | const clip = (v, n) =&gt; { |
| s | const | 49 | no | const s = String(v ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| plain | function | 52 | no | const plain = v =&gt; !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| at | function | 53 | no | const at = (obj, path) =&gt; path.split(&#39;.&#39;).reduce((o, k) =&gt; (o != null &amp;&amp; typeof o === &#39;object&#39; &amp;&amp; k in o) ? o[k] : undefined, obj); |
| buildRows | function | 57 | no | function buildRows(mockData) { |
| rows | const | 58 | no | const rows = []; |
| rev | const | 59 | no | const rev = plain(mockData.revision) ? mockData.revision : null; |
| q | const | 79 | no | const q = plain(mockData.queue) ? mockData.queue : null; |
| resolve | function | 101 | no | function resolve(step) { |
| md | const | 102 | no | const md = step &amp;&amp; plain(step.mockData) ? step.mockData : SPEC_MOCKDATA; |
| state | const | 103 | no | const state = step &amp;&amp; typeof step.currentState === &#39;string&#39; ? step.currentState : SPEC_CURRENT_STATE; |
| question | const | 104 | no | const question = step &amp;&amp; typeof step.acceptanceQuestion === &#39;string&#39; ? step.acceptanceQuestion : ACCEPTANCE_QUESTION; |
| id | const | 105 | no | const id = step &amp;&amp; typeof step.itemId === &#39;string&#39; ? step.itemId : ITEM_ID; |
| screen | const | 106 | no | const screen = step &amp;&amp; typeof step.screen === &#39;string&#39; ? step.screen : SCREEN; |
| renderPanel | function | 110 | no | function renderPanel(el, s) { |
| panel | const | 112 | no | const panel = document.createElement(&#39;div&#39;); |
| head | const | 114 | no | const head = document.createElement(&#39;div&#39;); head.className = &#39;demo-overlay-head&#39;; |
| id | const | 115 | no | const id = document.createElement(&#39;span&#39;); id.className = &#39;demo-overlay-id&#39;; id.textContent = s.id; |
| screen | const | 116 | no | const screen = document.createElement(&#39;h2&#39;); screen.className = &#39;demo-overlay-screen&#39;; screen.textContent = s.screen; |
| state | const | 119 | no | const state = document.createElement(&#39;p&#39;); state.className = &#39;demo-current&#39;; state.textContent = s.state; |
| row | const | 122 | no | const row = document.createElement(&#39;div&#39;); row.className = &#39;phone-row&#39;; |
| k | const | 123 | no | const k = document.createElement(&#39;div&#39;); k.className = &#39;phone-k&#39;; k.textContent = pair[0]; |
| v | const | 124 | no | const v = document.createElement(&#39;div&#39;); v.className = &#39;phone-v&#39;; v.textContent = pair[1]; |
| acc | const | 128 | no | const acc = document.createElement(&#39;p&#39;); acc.className = &#39;demo-acceptance&#39;; acc.textContent = &#39;Q: &#39; + s.question; |
| mount | function | 133 | no | function mount(el, step) { |
| unmount | function | 155 | no | function unmount(el) { |
| host | const | 159 | no | const host = typeof window !== &#39;undefined&#39; ? window : globalThis; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* DEMO overlay C — World screen group (SPEC A02).
   Fixture-fed: GET /demo/fixture/tab-world.json, same-origin only; falls back to
   the SPEC-authored mockData when the fixture is absent/unreadable (queue-mode
   steps A01-A08 have no fixtures yet). Renders one screen group into the passed
   #demo-phone/#demo-active slot. Exports mount(slotEl[, step]) / unmount(slotEl).
   No inline script, no cross-origin network. All text from fixture fields or the
   SPEC verbatim; missing Host data renders the honest NOT_AVAILABLE gap. */
(function () {
  'use strict';

  const ITEM_ID = 'A02';
  const SCREEN = 'World';
  const FIXTURE_URL = '/demo/fixture/tab-world.json';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

  const ACCEPTANCE_QUESTION =
    'After an approved Wiki edit and Host refresh, does World show the edit as a new built item under the committed revision, and does undo behave correctly?';

  const SPEC_CURRENT_STATE =
    'World renders "What was built" from the Host revision (surfaceId/revision/status via worldModel/surfaceItems, model.mjs:182-228, surfaceItems model.mjs:53-72), shows running/queued/queue counts and changeHint/undo cue, with v-world panel at index.html:520-521.';

  // SPEC-authored mockData for A02 (World). Top-level revision/built/running/
  // queue/undoAvailable/changeHint (not statusObj.snapshot.bootstrap). Used when
  // no step is passed and the fixture cannot be read.
  const SPEC_MOCKDATA = {
    hostReported: true,
    revision: {
      surfaceId: 'vivim.ui-surface/1',
      revision: 7,
      status: 'committed',
      changeId: 'chg_001',
      parentRevision: 6
    },
    built: [
      { title: 'Wiki page · ARBOR roadmap', detail: 'Approved edit · revision 7' },
      { title: 'Chat journal entry', detail: 'Durable entry · source host-command' }
    ],
    running: [],
    queued: [],
    queue: { queued: 0, claimed: 0, done: 3, failed: 0 },
    undoAvailable: true,
    changeHint: 'Build proposes a change; your PC commits it as a new revision you can undo.',
    empty: false,
    emptyMessage: 'The Host committed revision 7, and it holds no components yet.',
    gaps: []
  };

  const clip = (v, n) => {
    const s = String(v ?? '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };
  const plain = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const at = (obj, path) => path.split('.').reduce((o, k) => (o != null && typeof o === 'object' && k in o) ? o[k] : undefined, obj);

  // Rows rendered strictly from the step fixture: a row exists only when a
  // fixture field produced it; missing Host data renders the honest gap.
  function buildRows(mockData) {
    const rows = [];
    const rev = plain(mockData.revision) ? mockData.revision : null;
    rows.push(['Committed revision',
      rev ? clip(rev.surfaceId ?? '', 30) + ' r' + rev.revision + ' · ' + clip(rev.status ?? '', 20)
        + (rev.changeId ? ' · ' + clip(rev.changeId, 20) : '')
        + (rev.parentRevision != null ? ' ← r' + rev.parentRevision : '')
        : NOT_AVAILABLE]);

    if (Array.isArray(mockData.built) && mockData.built.length) {
      rows.push(['What was built',
        mockData.built.map(b => clip(plain(b) ? b.title ?? '' : '', 40) + ' · ' + clip(plain(b) ? b.detail ?? '' : '', 60)).join('   ')]);
    } else {
      rows.push(['What was built', NOT_AVAILABLE]);
    }

    if (Array.isArray(mockData.running) && mockData.running.length) {
      rows.push(['What is running', mockData.running.map(r => clip(String(r), 60)).join('   ')]);
    } else {
      rows.push(['What is running', NOT_AVAILABLE]);
    }

    const q = plain(mockData.queue) ? mockData.queue : null;
    rows.push(['Queue',
```

_First 80 of 162 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
