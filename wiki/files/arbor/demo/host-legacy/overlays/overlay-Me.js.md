# File: demo/host-legacy/overlays/overlay-Me.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/overlays/overlay-Me.js |
| Language | JavaScript |
| Kind | source |
| Size | 5840 B |
| Lines | 107 |
| Hash | 3ee59622b43b |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ITEM_ID | const | 8 | no | const ITEM_ID = &#39;tab-me&#39;; |
| SCREEN | const | 9 | no | const SCREEN = &#39;Me&#39;; |
| FIXTURE_URL | const | 10 | no | const FIXTURE_URL = &#39;/demo/fixture/tab-me.json&#39;; |
| NOT_AVAILABLE | const | 11 | no | const NOT_AVAILABLE = &#39;Not available yet — the Host did not send this to the phone.&#39;; |
| clip | function | 13 | no | const clip = (v, n) =&gt; { |
| s | const | 14 | no | const s = String(v ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| plain | function | 17 | no | const plain = v =&gt; !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| at | function | 18 | no | const at = (obj, path) =&gt; path.split(&#39;.&#39;).reduce((o, k) =&gt; (o != null &amp;&amp; typeof o === &#39;object&#39; &amp;&amp; k in o) ? o[k] : undefined, obj); |
| buildRows | function | 22 | no | function buildRows(mockData) { |
| rows | const | 23 | no | const rows = []; |
| snapshot | const | 24 | no | const snapshot = at(mockData, &#39;statusObj.snapshot&#39;) \|\| at(mockData, &#39;snapshot&#39;) \|\| {}; |
| personalAgent | const | 25 | no | const personalAgent = at(mockData, &#39;personalAgent&#39;) ?? at(snapshot, &#39;personalAgent&#39;); |
| worldId | const | 26 | no | const worldId = at(mockData, &#39;worldId&#39;) ?? at(snapshot, &#39;bootstrap.worldId&#39;); |
| device | const | 27 | no | const device = at(mockData, &#39;device&#39;); |
| ctx | const | 28 | no | const ctx = at(mockData, &#39;ctx&#39;); |
| manifest | const | 29 | no | const manifest = at(mockData, &#39;manifest&#39;); |
| ordered | const | 51 | no | const ordered = mockData.commands.slice().sort((a, b) =&gt; String(plain(b) ? b.updatedAt ?? &#39;&#39; : &#39;&#39;).localeCompare(String(plain(a) ? a.updatedAt ?? &#39;&#39; : &#39;&#39;))); |
| mount | function | 59 | no | function mount(el, step) { |
| render | function | 62 | no | function render(s) { |
| panel | const | 63 | no | const panel = document.createElement(&#39;div&#39;); |
| head | const | 65 | no | const head = document.createElement(&#39;div&#39;); head.className = &#39;demo-overlay-head&#39;; |
| id | const | 66 | no | const id = document.createElement(&#39;span&#39;); id.className = &#39;demo-overlay-id&#39;; id.textContent = s.itemId; |
| screen | const | 67 | no | const screen = document.createElement(&#39;h2&#39;); screen.className = &#39;demo-overlay-screen&#39;; screen.textContent = s.screen; |
| state | const | 70 | no | const state = document.createElement(&#39;p&#39;); state.className = &#39;demo-current&#39;; state.textContent = s.currentState; |
| row | const | 73 | no | const row = document.createElement(&#39;div&#39;); row.className = &#39;phone-row&#39;; |
| k | const | 74 | no | const k = document.createElement(&#39;div&#39;); k.className = &#39;phone-k&#39;; k.textContent = pair[0]; |
| v | const | 75 | no | const v = document.createElement(&#39;div&#39;); v.className = &#39;phone-v&#39;; v.textContent = pair[1]; |
| acc | const | 79 | no | const acc = document.createElement(&#39;p&#39;); acc.className = &#39;demo-acceptance&#39;; acc.textContent = &#39;Q: &#39; + s.acceptanceQuestion; |
| gap | const | 94 | no | const gap = document.createElement(&#39;p&#39;); gap.className = &#39;demo-error&#39;; |
| unmount | function | 101 | no | function unmount(el) { |
| host | const | 105 | no | const host = typeof window !== &#39;undefined&#39; ? window : globalThis; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* DEMO overlay Me — Me screen group (SPEC tab-me).
   Fixture-fed: GET /demo/fixture/tab-me.json, same-origin only.
   Renders one screen group into the passed #demo-phone/#demo-active slot.
   Exports mount(slotEl[, step]) / unmount(slotEl). No inline script, no cross-origin network. */
(function () {
  'use strict';

  const ITEM_ID = 'tab-me';
  const SCREEN = 'Me';
  const FIXTURE_URL = '/demo/fixture/tab-me.json';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

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
    const snapshot = at(mockData, 'statusObj.snapshot') || at(mockData, 'snapshot') || {};
    const personalAgent = at(mockData, 'personalAgent') ?? at(snapshot, 'personalAgent');
    const worldId = at(mockData, 'worldId') ?? at(snapshot, 'bootstrap.worldId');
    const device = at(mockData, 'device');
    const ctx = at(mockData, 'ctx');
    const manifest = at(mockData, 'manifest');

    // Identity: personalAgent → agentId/scope/identityAssurance/initialized
    rows.push(plain(personalAgent)
      ? ['Personal agent', clip(personalAgent.agentId ?? '', 30) + ' · scope ' + clip(personalAgent.scope ?? '', 20) + ' · ' + clip(personalAgent.identityAssurance ?? '', 20) + ' · initialized ' + (personalAgent.initialized === true ? 'Yes' : 'No')]
      : ['Personal agent', NOT_AVAILABLE]);

    // World: bootstrap.worldId
    rows.push(worldId !== undefined ? ['World', clip(worldId, 30)] : ['World', NOT_AVAILABLE]);

    // Phone connection: device.status + device.scopes + ctx.mode
    rows.push(plain(device)
      ? ['Phone connection', clip(device.status ?? '', 20) + (Array.isArray(device.scopes) && device.scopes.length ? ' · scopes ' + device.scopes.map(s => clip(s, 20)).join(' · ') : '') + (plain(ctx) && ctx.mode ? ' · mode ' + clip(ctx.mode, 20) : '')]
      : ['Phone connection', NOT_AVAILABLE]);

    // Signed-in AI: manifest.providers[] → id + signedIn
    rows.push(plain(manifest) && Array.isArray(manifest.providers) && manifest.providers.length
      ? ['Signed-in AI', manifest.providers.map(p => clip(plain(p) ? p.id ?? '' : '', 20) + (plain(p) && p.signedIn === true ? ' ✓' : ' ✗')).join(' · ')]
      : ['Signed-in AI', NOT_AVAILABLE]);

    // Activity record: commands[] receipts newest-first (updatedAt desc)
    if (Array.isArray(mockData.commands) && mockData.commands.length) {
      const ordered = mockData.commands.slice().sort((a, b) => String(plain(b) ? b.updatedAt ?? '' : '').localeCompare(String(plain(a) ? a.updatedAt ?? '' : '')));
      rows.push(['Activity record', ordered.map(c => clip((c.id ? c.id + ' ' : '') + (c.text ?? c.mode ?? ''), 60) + ' — ' + clip(c.status ?? 'unknown', 16) + ' · ' + clip(c.updatedAt ?? '', 30)).join('   ')]);
    } else {
      rows.push(['Activity record', NOT_AVAILABLE]);
    }
    return rows;
  }

  function mount(el, step) {
    if (!el || el.nodeType !== 1) throw new Error('overlay-Me: mount requires a slot element');
    el.textContent = '';
    function render(s) {
      const panel = document.createElement('div');
      panel.className = 'demo-overlay demo-overlay-me';
      const head = document.createElement('div'); head.className = 'demo-overlay-head';
      const id = document.createElement('span'); id.className = 'demo-overlay-id'; id.textContent = s.itemId;
      const screen = document.createElement('h2'); screen.className = 'demo-overlay-screen'; screen.textContent = s.screen;
      head.appendChild(id); head.appendChild(screen);
      panel.appendChild(head);
      const state = document.createElement('p'); state.className = 'demo-current'; state.textContent = s.currentState;
      panel.appendChild(state);
      buildRows(s.mockData).forEach(pair => {
        const row = document.createElement('div'); row.className = 'phone-row';
        const k = document.createElement('div'); k.className = 'phone-k'; k.textContent = pair[0];
        const v = document.createElement('div'); v.className = 'phone-v'; v.textContent = pair[1];
        row.appendChild(k); row.appendChild(v);
        panel.appendChild(row);
      });
      const acc = document.createElement('p'); acc.className = 'demo-acceptance'; acc.textContent = 'Q: ' + s.acceptanceQuestion;
      panel.appendChild(acc);
```

_First 80 of 108 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
