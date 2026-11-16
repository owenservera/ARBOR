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
export function mount(slotEl, ctx) {
  if (!slotEl) return undefined;
  unmount();
  const { md, state, question } = resolve(ctx);
  panel = document.createElement('div');
  panel.className = 'demo-overlay demo-overlay-today';
  panel.dataset.demo = itemId;
  const head = document.createElement('div'); head.className = 'demo-overlay-head';
  const badge = document.createElement('span'); badge.className = 'demo-overlay-badge'; badge.textContent = 'DEMO · fixture-fed';
  const title = document.createElement('h3'); title.className = 'demo-overlay-title'; title.textContent = screen;
  head.appendChild(badge); head.appendChild(title);
  panel.appendChild(head);
  const cur = document.createElement('p'); cur.className = 'demo-overlay-state body-sm'; cur.textContent = state;
  panel.appendChild(cur);
  const list = document.createElement('div'); list.className = 'demo-overlay-rows';
  for (const [k, v] of rows(md)) {
    const row = document.createElement('div'); row.className = 'demo-overlay-row';
    const key = document.createElement('div'); key.className = 'demo-overlay-k'; key.textContent = k;
    const val = document.createElement('div'); val.className = 'demo-overlay-v'; val.textContent = v;
    row.appendChild(key); row.appendChild(val); list.appendChild(row);
  }
  panel.appendChild(list);
  const q = document.createElement('p'); q.className = 'demo-overlay-question body-sm'; q.textContent = 'Q: ' + question;
  panel.appendChild(q);
  slotEl.appendChild(panel);
  return panel;
}
export function unmount() {
  if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
  panel = null;
}
