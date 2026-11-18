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
  }
  return out;
}

let panel = null;
export function mount(slotEl, ctx) {
  if (!slotEl) return undefined;
  unmount();
  const { md, state, question } = resolve(ctx);
  panel = document.createElement('div');
  panel.className = 'demo-overlay demo-overlay-talk';
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
