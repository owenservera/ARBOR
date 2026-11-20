# File: demo/host-legacy/overlays/overlay-talk.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/host-legacy/overlays/overlay-talk.js |
| Language | JavaScript |
| Kind | source |
| Size | 6803 B |
| Lines | 116 |
| Hash | 040637c0f409 |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEMO | const | 11 | yes | export const DEMO = true; |
| itemId | const | 12 | yes | export const itemId = &#39;tab-talk&#39;; |
| screen | const | 13 | yes | export const screen = &#39;Talk&#39;; |
| acceptanceQuestion | const | 15 | yes | export const acceptanceQuestion = |
| NOT_AVAILABLE | const | 18 | no | const NOT_AVAILABLE = &#39;Not available yet — the Host did not send this to the phone.&#39;; |
| FIXTURE | const | 23 | no | const FIXTURE = { |
| esc | function | 41 | no | function esc(s) { return String(s == null ? &#39;&#39; : s) |
| clip | function | 43 | no | function clip(v, n) { const s = String(v ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); return s.length &gt; n ? s.slice(0, n - 1) + &#39;…&#39; : s; } |
| plain | function | 44 | no | function plain(v) { return !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); } |
| at | function | 45 | no | function at(obj, path) { return path.split(&#39;.&#39;).reduce((o, k) =&gt; (plain(o) \|\| Array.isArray(o)) &amp;&amp; k in o ? o[k] : undefined, obj); } |
| liveLabel | function | 46 | no | function liveLabel(msg) { |
| labels | const | 47 | no | const labels = { claimed: &#39;Claimed by worker — not sent&#39;, waiting_reply: &#39;Send observed — awaiting reply&#39; }; |
| resolve | function | 54 | no | function resolve(ctx) { |
| md | const | 56 | no | const md = ctx &amp;&amp; plain(ctx.mockData) ? ctx.mockData : FIXTURE.mockData; |
| state | const | 57 | no | const state = ctx &amp;&amp; typeof ctx.currentState === &#39;string&#39; ? ctx.currentState : FIXTURE.currentState; |
| question | const | 58 | no | const question = ctx &amp;&amp; typeof ctx.acceptanceQuestion === &#39;string&#39; ? ctx.acceptanceQuestion : acceptanceQuestion; |
| rows | function | 62 | no | function rows(md) { |
| out | const | 63 | no | const out = []; |
| cmd | const | 69 | no | const cmd = Array.isArray(md.cmds) &amp;&amp; plain(md.cmds[0]) ? md.cmds[0] : null; |
| live | const | 71 | no | const live = at(md, &#39;live&#39;); |
| liveConv | const | 72 | no | const liveConv = plain(live) &amp;&amp; Array.isArray(live.conversations) |
| msg | const | 75 | no | const msg = liveConv &amp;&amp; Array.isArray(liveConv.messages) ? liveConv.messages[0] : null; |
| panel | variable | 85 | no | let panel = null; |
| mount | function | 86 | yes | export function mount(slotEl, ctx) { |
| head | const | 93 | no | const head = document.createElement(&#39;div&#39;); head.className = &#39;demo-overlay-head&#39;; |
| badge | const | 94 | no | const badge = document.createElement(&#39;span&#39;); badge.className = &#39;demo-overlay-badge&#39;; badge.textContent = &#39;DEMO · fixture-fed&#39;; |
| title | const | 95 | no | const title = document.createElement(&#39;h3&#39;); title.className = &#39;demo-overlay-title&#39;; title.textContent = screen; |
| cur | const | 98 | no | const cur = document.createElement(&#39;p&#39;); cur.className = &#39;demo-overlay-state body-sm&#39;; cur.textContent = state; |
| list | const | 100 | no | const list = document.createElement(&#39;div&#39;); list.className = &#39;demo-overlay-rows&#39;; |
| row | const | 102 | no | const row = document.createElement(&#39;div&#39;); row.className = &#39;demo-overlay-row&#39;; |
| key | const | 103 | no | const key = document.createElement(&#39;div&#39;); key.className = &#39;demo-overlay-k&#39;; key.textContent = k; |
| val | const | 104 | no | const val = document.createElement(&#39;div&#39;); val.className = &#39;demo-overlay-v&#39;; val.textContent = v; |
| q | const | 108 | no | const q = document.createElement(&#39;p&#39;); q.className = &#39;demo-overlay-question body-sm&#39;; q.textContent = &#39;Q: &#39; + question; |
| unmount | function | 113 | yes | export function unmount() { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* @vlang:surface apps/vivim-host/public/demo/overlays/overlay-talk.js
   @vlang:surface-desc: DEMO overlay for the Talk step — a fixture-fed panel
   @vlang:surface-desc: mounted into the #demo-phone / #demo-active slot by the
   @vlang:surface-desc: demo shell. No network, no inline script/style, no
   @vlang:surface-desc: invented data: Host fields absent from the fixture render
   @vlang:surface-desc: the honest NOT_AVAILABLE gap.
   @vlang:id: demo-overlay demo-talk mount-unmount fixture-fed not-available-gap
   @vlang:action: */
'use strict';

export const DEMO = true;
export const itemId = 'tab-talk';
export const screen = 'Talk';

export const acceptanceQuestion =
  'Reading only the receipt badges, can you tell exactly where each send really is — and is any state on this screen one the Host never reported?';

const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

// Fixture-fed truth mirroring /demo/fixture/tab-talk.json (vivim.demo-step/1).
// Authored from that fixture and kept in lockstep with it. Nothing here is
// invented; fields the fixture does not send render NOT_AVAILABLE.
const FIXTURE = {
  currentState: `Paired Direct chat: drawer lists two conversations ('Theme test', 'Research plan'), the open thread shows your bubble 'Set my theme to dusk' over an assistant reply wearing the receipt badge 'Send observed — awaiting reply', and the composer offers provider chips with chatgpt signed in.`,
  mockData: {
    convs: [
      { id: 'c-1', title: 'Theme test', provider: 'chatgpt', model: 'gpt-5', effort: 'standard', updatedAt: '2026-11-14T09:10:00Z' },
      { id: 'c-2', title: 'Research plan', provider: 'claude', updatedAt: '2026-11-14T08:40:00Z' }
    ],
    cmds: [ { id: 'm-1', conversationId: 'c-1', text: 'Set my theme to dusk', status: 'done', mode: 'relay-chat', consumer: 'harness', target: { provider: 'chatgpt' }, createdAt: '2026-11-14T09:09:00Z', updatedAt: '2026-11-14T09:11:00Z' } ],
    live: { state: 'ok', conversations: [ { id: 'c-1', provider: 'chatgpt', messages: [ { state: 'waiting_reply' } ] } ] },
    manifest: {
      providers: [
        { id: 'chatgpt', label: 'ChatGPT', signedIn: true },
        { id: 'claude', label: 'Claude', signedIn: false }
      ]
    }
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
  if (Array.isArray(md.convs) && md.convs.length) {
    out.push(['Conversations', md.convs.map(c => clip((c.id ? c.id + ' ' : '') + (c.title ?? ''), 40) + ' · ' + clip(c.provider ?? '', 20) + (c.model ? ' · ' + clip(c.model, 20) : '')).join('   ')]);
  } else {
    out.push(['Conversations', NOT_AVAILABLE]);
  }
  const cmd = Array.isArray(md.cmds) && plain(md.cmds[0]) ? md.cmds[0] : null;
  out.push(cmd ? ['Your message', clip(cmd.text ?? '', 80) + ' · ' + clip(at(cmd, 'target.provider') ?? cmd.provider ?? '', 20) + (cmd.conversationId ? ' · ' + clip(cmd.conversationId, 20) : '')] : ['Your message', NOT_AVAILABLE]);
  const live = at(md, 'live');
  const liveConv = plain(live) && Array.isArray(live.conversations)
    ? live.conversations.find(c => plain(c) && (!cmd || c.id === cmd.conversationId)) ?? (live.conversations.length ? live.conversations[0] : null)
    : null;
  const msg = liveConv && Array.isArray(liveConv.messages) ? liveConv.messages[0] : null;
  out.push(['Reply state', liveConv ? liveLabel(msg) : NOT_AVAILABLE]);
  if (plain(md.manifest) && Array.isArray(md.manifest.providers) && md.manifest.providers.length) {
    out.push(['Providers', md.manifest.providers.map(p => clip(p.label ?? p.id ?? '', 20) + (p.signedIn ? ' signed in' : ' not signed in')).join(' · ')]);
  } else {
    out.push(['Providers', NOT_AVAILABLE]);
```

_First 80 of 117 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
