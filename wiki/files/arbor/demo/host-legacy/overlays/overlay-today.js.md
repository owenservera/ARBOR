# File: demo/host-legacy/overlays/overlay-today.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/overlays/overlay-today.js |
| Language | JavaScript |
| Kind | source |
| Size | 6372 B |
| Lines | 111 |
| Hash | 44d20a3d52ef |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEMO | const | 11 | yes | export const DEMO = true; |
| itemId | const | 12 | yes | export const itemId = &#39;tab-today&#39;; |
| screen | const | 13 | yes | export const screen = &#39;Today&#39;; |
| acceptanceQuestion | const | 15 | yes | export const acceptanceQuestion = |
| NOT_AVAILABLE | const | 18 | no | const NOT_AVAILABLE = &#39;Not available yet — the Host did not send this to the phone.&#39;; |
| FIXTURE | const | 23 | no | const FIXTURE = { |
| esc | function | 33 | no | function esc(s) { return String(s == null ? &#39;&#39; : s) |
| clip | function | 35 | no | function clip(v, n) { const s = String(v ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); return s.length &gt; n ? s.slice(0, n - 1) + &#39;…&#39; : s; } |
| plain | function | 36 | no | function plain(v) { return !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); } |
| at | function | 37 | no | function at(obj, path) { return path.split(&#39;.&#39;).reduce((o, k) =&gt; (plain(o) \|\| Array.isArray(o)) &amp;&amp; k in o ? o[k] : undefined, obj); } |
| liveLabel | function | 38 | no | function liveLabel(msg) { |
| labels | const | 39 | no | const labels = { claimed: &#39;Claimed by worker — not sent&#39;, waiting_reply: &#39;Send observed — awaiting reply&#39; }; |
| resolve | function | 46 | no | function resolve(ctx) { |
| md | const | 48 | no | const md = ctx &amp;&amp; plain(ctx.mockData) ? ctx.mockData : FIXTURE.mockData; |
| state | const | 49 | no | const state = ctx &amp;&amp; typeof ctx.currentState === &#39;string&#39; ? ctx.currentState : FIXTURE.currentState; |
| question | const | 50 | no | const question = ctx &amp;&amp; typeof ctx.acceptanceQuestion === &#39;string&#39; ? ctx.acceptanceQuestion : acceptanceQuestion; |
| rows | function | 54 | no | function rows(md) { |
| out | const | 55 | no | const out = []; |
| ctx | const | 56 | no | const ctx = at(md, &#39;ctx&#39;); |
| live | const | 60 | no | const live = at(md, &#39;live&#39;); |
| c | const | 62 | no | const c = live.conversations[0]; |
| msg | const | 63 | no | const msg = Array.isArray(c.messages) ? c.messages[0] : null; |
| failed | const | 69 | no | const failed = md.commands.filter(c =&gt; plain(c) &amp;&amp; c.status === &#39;failed&#39;); |
| passes | const | 75 | no | const passes = at(md, &#39;bootstrap.progress.passes&#39;); |
| panel | variable | 80 | no | let panel = null; |
| mount | function | 81 | yes | export function mount(slotEl, ctx) { |
| head | const | 88 | no | const head = document.createElement(&#39;div&#39;); head.className = &#39;demo-overlay-head&#39;; |
| badge | const | 89 | no | const badge = document.createElement(&#39;span&#39;); badge.className = &#39;demo-overlay-badge&#39;; badge.textContent = &#39;DEMO · fixture-fed&#39;; |
| title | const | 90 | no | const title = document.createElement(&#39;h3&#39;); title.className = &#39;demo-overlay-title&#39;; title.textContent = screen; |
| cur | const | 93 | no | const cur = document.createElement(&#39;p&#39;); cur.className = &#39;demo-overlay-state body-sm&#39;; cur.textContent = state; |
| list | const | 95 | no | const list = document.createElement(&#39;div&#39;); list.className = &#39;demo-overlay-rows&#39;; |
| row | const | 97 | no | const row = document.createElement(&#39;div&#39;); row.className = &#39;demo-overlay-row&#39;; |
| key | const | 98 | no | const key = document.createElement(&#39;div&#39;); key.className = &#39;demo-overlay-k&#39;; key.textContent = k; |
| val | const | 99 | no | const val = document.createElement(&#39;div&#39;); val.className = &#39;demo-overlay-v&#39;; val.textContent = v; |
| q | const | 103 | no | const q = document.createElement(&#39;p&#39;); q.className = &#39;demo-overlay-question body-sm&#39;; q.textContent = &#39;Q: &#39; + question; |
| unmount | function | 108 | yes | export function unmount() { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* @vlang:surface apps/vivim-host/public/demo/overlays/overlay-today.js
   @vlang:surface-desc: DEMO overlay for the Today step — a fixture-fed panel
   @vlang:surface-desc: mounted into the #demo-phone / #demo-active slot by the
   @vlang:surface-desc: demo shell. No network, no inline script/style, no
   @vlang:surface-desc: invented data: Host fields absent from the fixture render
   @vlang:surface-desc: the honest NOT_AVAILABLE gap.
   @vlang:id: demo-overlay demo-today mount-unmount fixture-fed not-available-gap
   @vlang:action: */
'use strict';

export const DEMO = true;
export const itemId = 'tab-today';
export const screen = 'Today';

export const acceptanceQuestion =
  'Does Today put the one thing that needs you (the failed send) above everything else, and can every card on this screen be traced to a Host field rather than invented?';

const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

// Fixture-fed truth mirroring /demo/fixture/tab-today.json (vivim.demo-step/1).
// Authored from that fixture and kept in lockstep with it. Nothing here is
// invented; fields the fixture does not send render NOT_AVAILABLE.
const FIXTURE = {
  currentState: `Paired Direct phone: Connection card reads 'Direct to your PC', one live conversation renders under Running as 'Chat · chatgpt · Claimed by worker — not sent', a failed relay-chat command feeds a 'A command failed' Needs-you item, and the footer's single next action is 'Open Talk'.`,
  mockData: {
    ctx: { paired: true, mode: 'direct', connection: 'Direct to your PC', connectionTone: 'ok', pendingSend: false },
    live: { state: 'ok', conversations: [ { id: 'c-1', provider: 'chatgpt', model: 'gpt-5', messages: [ { state: 'claimed' } ] } ] },
    commands: [ { id: 'cmd-9', mode: 'relay-chat', text: 'Set my theme to dusk', status: 'failed', updatedAt: '2026-11-14T09:12:00Z' } ],
    bootstrap: { progress: { passes: [] } }
  }
};

function esc(s) { return String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function clip(v, n) { const s = String(v ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function plain(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function at(obj, path) { return path.split('.').reduce((o, k) => (plain(o) || Array.isArray(o)) && k in o ? o[k] : undefined, obj); }
function liveLabel(msg) {
  const labels = { claimed: 'Claimed by worker — not sent', waiting_reply: 'Send observed — awaiting reply' };
  if (!plain(msg)) return NOT_AVAILABLE;
  if (typeof msg.label === 'string' && msg.label.trim()) return msg.label;
  if (typeof msg.state === 'string' && Object.prototype.hasOwnProperty.call(labels, msg.state)) return labels[msg.state];
  return NOT_AVAILABLE;
}

function resolve(ctx) {
  // Caller-fed fixture data wins; otherwise fall back to the embedded fixture truth.
  const md = ctx && plain(ctx.mockData) ? ctx.mockData : FIXTURE.mockData;
  const state = ctx && typeof ctx.currentState === 'string' ? ctx.currentState : FIXTURE.currentState;
  const question = ctx && typeof ctx.acceptanceQuestion === 'string' ? ctx.acceptanceQuestion : acceptanceQuestion;
  return { md, state, question };
}

function rows(md) {
  const out = [];
  const ctx = at(md, 'ctx');
  out.push(['Connection', ctx
    ? clip(ctx.connection ?? '', 40) + ' · tone ' + clip(ctx.connectionTone ?? '', 20) + ' · ' + (ctx.paired ? 'paired' : 'not paired')
    : NOT_AVAILABLE]);
  const live = at(md, 'live');
  if (plain(live) && live.state === 'ok' && Array.isArray(live.conversations) && live.conversations.length) {
    const c = live.conversations[0];
    const msg = Array.isArray(c.messages) ? c.messages[0] : null;
    out.push(['Running', 'Chat · ' + clip(c.provider ?? '', 30) + (c.model ? ' · ' + clip(c.model, 30) : '') + ' · ' + liveLabel(msg)]);
  } else {
    out.push(['Running', NOT_AVAILABLE]);
  }
  if (Array.isArray(md.commands)) {
    const failed = md.commands.filter(c => plain(c) && c.status === 'failed');
    if (failed.length) out.push(['Needs you', failed.map(c => clip(c.id ?? '', 20) + ' ' + clip(c.text ?? c.mode ?? '', 40) + ' — ' + (c.status ?? 'unknown')).join('   ')]);
    else out.push(['Needs you', NOT_AVAILABLE]);
  } else {
    out.push(['Needs you', NOT_AVAILABLE]);
  }
  const passes = at(md, 'bootstrap.progress.passes');
  if (Array.isArray(passes) && passes.length) out.push(['Learning passes', passes.map(p => clip(plain(p) ? p.pass ?? '' : String(p), 40)).join(' · ')]);
  return out;
}

let panel = null;
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
