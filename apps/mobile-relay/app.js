// grokbot-authored. Relay PWA shell: same-origin only, no secrets stored in JS-readable storage.
import { transport } from './transport.mjs';
import { mountBuildSurface, sendProposal } from './generative-ui/phone-surface.mjs';
import { mountBuildCanvas } from './build-canvas.mjs';
import { mountWelcome } from './welcome.mjs';
import { parsePairFragment, redeemDevicePairToken } from './pairing-link.mjs';
import { prepareDeviceSigner, enrollWithChallenge, resumeDeviceSession } from './device-enrollment.mjs';
import { worldModel, meModel, todayModel, LIVE_STATE_LABELS, TABS } from './ux/model.mjs';
import { renderToday, renderWorld, renderMe } from './ux/render.mjs';
import { createControlChat } from './control-chat.mjs';
const $ = id => document.getElementById(id);
const api = transport.request;
// Only the loopback Host wrapper may display a read-only, unpaired desktop
// preview. An HTTPS phone, cloud relay or arbitrary public origin never can.
const HOST_PREVIEW = new URLSearchParams(location.search).get('host-preview') === '1'
  && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
  && location.pathname.startsWith('/mobile/');
// This action exists only inside the signed VIVIM Android shell. The online surface
// remains the single Host-operated phone; Pocket holds local raw evidence only.
const pocketButton = document.getElementById('pocket-native');
if (pocketButton && (navigator.userAgent || '').includes('VIVIM/1.0.0')) {
  pocketButton.hidden = false;
  pocketButton.addEventListener('click', () => {
    window.location.href = 'vivim://pocket';
  });
}
// This entry point exists only for Direct Host; never advertise it on the Cloud PWA.
if (!transport.direct) document.getElementById('grokbot-direct-link')?.setAttribute('hidden', '');
async function pair(secret) { await api('pair', { method: 'POST', body: JSON.stringify({ secret }) }); }

/* ---------- helpers ---------- */
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const hex16 = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');
const tsOf = c => Date.parse(c.createdAt) || Number(c.createdAt) || 0;
const MAXTEXT = 4000;

/* ---------- tiny safe markdown (escape first) ---------- */
function inline(t) {
  const st = []; const keep = h => '\u0001' + (st.push(h) - 1) + '\u0001';
  const emph = x => x.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?![*\w])/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\s][^_\n]*?)_(?![_\w])/g, '$1<em>$2</em>');
  t = t.replace(/`([^`\n]+)`/g, (m, c) => keep('<code>' + c + '</code>'));
  t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, l, u) => keep('<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + emph(l) + '</a>'));
  t = t.replace(/(^|[\s(])(https?:\/\/[^\s]*[^\s.,;:!?)])/g, (m, p, u) => p + keep('<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u + '</a>'));
  t = emph(t);
  for (let i = 0; i < 3; i++) t = t.replace(/\u0001(\d+)\u0001/g, (m, k) => st[+k]);
  return t;
}
function md(src) {
  const fences = [];
  const s = esc(src).replace(/```([\w+-]*)[ \t]*\n([\s\S]*?)(?:```|$)/g, (m, l, c) => {
    fences.push('<pre><code>' + c.replace(/\n$/, '') + '</code></pre>'); return '\n\u0000' + (fences.length - 1) + '\u0000\n'; });
  const out = []; let para = [], list = null;
  const fp = () => { if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; } };
  const fl = () => { if (list) { out.push('<' + list.t + '>' + list.i.map(x => '<li>' + x + '</li>').join('') + '</' + list.t + '>'); list = null; } };
  for (const line of s.split('\n')) {
    let m;
    if ((m = /^\u0000(\d+)\u0000$/.exec(line))) { fp(); fl(); out.push(fences[+m[1]]); }
    else if ((m = /^\s{0,3}(#{1,4})\s+(.+?)\s*#*\s*$/.exec(line))) { fp(); fl(); const n = m[1].length + 2; out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); }
    else if ((m = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(line))) { fp(); const t = m[1] ? 'ul' : 'ol'; if (list && list.t !== t) fl(); (list = list || { t, i: [] }).i.push(inline(m[3])); }
    else if (!line.trim()) { fp(); fl(); }
    else { fl(); para.push(inline(line.trim())); }
  }
  fp(); fl(); return out.join('');
}

/* ---------- state ---------- */
const FALLBACK = [['chatgpt', 'ChatGPT'], ['claude', 'Claude'], ['qwen', 'Qwen'], ['zai', 'Z.ai']]
  .map(([id, label]) => ({ id, label, signedIn: false, models: [], thinkingLevels: [], newChat: true, attachments: false }));
const S = {
  tab: 'talk', manifest: null, convs: lsGet('relay.convs.v1', []), active: lsGet('relay.active.v1', null),
  hidden: new Set(lsGet('relay.hidden.v1', [])), cmds: [], files: [], sending: false, paired: false,
  statusAt: 0, statusObj: null, timer: 0, busy: false, sigs: {}, shownConv: null,
  conn: { label: '', tone: 'ok' }, device: { status: null, scopes: null },
  media: { state: 'idle' }, mediaAt: 0, mediaLoading: false
};
const N = { target: transport.direct ? 'vivim' : 'harness', session: '', sessions: [], messages: [], timer: 0, generation: 0, sending: false, note: '', pending: null };
const vivimChat = createControlChat({
  host: $('msgs'), transport,
  onChange: () => updateSend(),
  onNavigate: tab => goTab(tab),
  onOpenPocket: pocketButton && !pocketButton.hidden ? () => pocketButton.click() : null
});
let build = null, buildTimer = 0, buildKey = '';
let welcome = null;
let approvalPoll = null;
let starting = null;
try { N.pending = JSON.parse(sessionStorage.getItem('vivim.phone.pending.v1') || 'null'); } catch {}
function saveNativePending() { try { if (N.pending) sessionStorage.setItem('vivim.phone.pending.v1', JSON.stringify(N.pending)); else sessionStorage.removeItem('vivim.phone.pending.v1'); } catch {} }
if (!Array.isArray(S.convs)) S.convs = [];
const saveConvs = () => { lsSet('relay.convs.v1', S.convs.slice(0, 50)); lsSet('relay.active.v1', S.active); };
const providers = () => (S.manifest && Array.isArray(S.manifest.providers) ? S.manifest.providers : FALLBACK).filter(p => p.signedIn);
const curConv = () => S.convs.find(c => c.id === S.active) || null;
const msgsOf = id => S.cmds.filter(c => c.conversationId === id).reverse();
const isPend = m => m.status === 'queued' || m.status === 'claimed';
const pending = id => !!id && msgsOf(id).some(isPend);
const mkPrefix = c => '@' + c.provider + (c.model ? ':' + c.model : '') + (c.effort ? '@' + c.effort : '') + ' ';
const PFX = /^@[\w.-]+(?::[^\s@]+)?(?:@[\w.-]+)?\s/;
const TAG = /^\[([^\]\n]{1,80})\]\s*/;
const stripPrefix = t => String(t || '').replace(PFX, '');
const targetLabel = m => { const t = m.target || {}; const s = (t.provider || '') + (t.model ? ':' + t.model : ''); return s || m.consumer || 'assistant'; };
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 4000); }
function setConn(text, bad) { S.conn = { label: text, tone: bad ? 'bad' : 'ok' }; text = (HOST_PREVIEW ? 'Host' : transport.direct ? 'Direct' : 'Cloud') + ' · ' + text; $('conn').textContent = text; $('connection-announcer').textContent = text; $('dot').classList.toggle('bad', !!bad); $('dot').title = text; $('connection-status').textContent = text + (transport.pending() ? ' · A send may be pending here; check before switching.' : ''); $('connection-resolved').hidden = !transport.pending(); }

/* ---------- conversations ---------- */
function normalizeConv() {
  const c = curConv(); if (!c) return;
  const ps = providers(); if (!ps.length) return;
  let p = ps.find(x => x.id === c.provider), dirty = false;
  if (!p) { p = ps[0]; c.provider = p.id; c.model = c.effort = null; dirty = true; }
  if (c.model && !(p.models || []).some(m => m.id === c.model)) { c.model = null; dirty = true; }
  const lv = (p.thinkingLevels || []).find(l => l.id === c.effort);
  if (c.effort && (!lv || lv.locked)) { c.effort = null; dirty = true; }
  if (!p.attachments && S.files.length) S.files = [];
  if (dirty) saveConvs();
}
function newConv() {
  const cur = curConv();
  if (cur && !cur.sent && !msgsOf(cur.id).length) { closeDrawer(); $('text').focus(); return; }
  const ps = providers();
  const same = cur && ps.some(p => p.id === cur.provider);
  const c = { id: 'c-' + hex16(), title: '', provider: same ? cur.provider : ((ps[0] && ps[0].id) || 'chatgpt'),
    model: same ? cur.model : null, effort: same ? cur.effort : null, sent: false, updatedAt: Date.now() };
  S.convs.unshift(c); S.active = c.id; S.files = []; saveConvs(); closeDrawer(); renderAll(true); schedule();
}
function ensureActive() {
  if (curConv()) return;
  const latest = [...S.convs].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (latest) { S.active = latest.id; saveConvs(); } else newConv();
}
function selectConv(id) { S.active = id; S.files = []; saveConvs(); closeDrawer(); renderAll(true); schedule(); }
function deleteConv(id) {
  S.hidden.add(id); lsSet('relay.hidden.v1', [...S.hidden].slice(-200));
  S.convs = S.convs.filter(c => c.id !== id);
  if (S.active === id) { S.active = null; ensureActive(); }
  saveConvs(); renderAll(true);
}
function mergeServerConvs() {
  let dirty = false;
  for (const m of [...S.cmds].reverse()) {
    if (m.mode !== 'relay-chat' || !m.conversationId || S.hidden.has(m.conversationId)) continue;
    let c = S.convs.find(x => x.id === m.conversationId); const t = tsOf(m) || Date.now();
    if (!c) {
      const tg = m.target || {};
      c = { id: m.conversationId, title: stripPrefix(m.text).slice(0, 40), provider: tg.provider || 'chatgpt', model: tg.model || null,
        effort: tg.effort || null, sent: true, updatedAt: t };
      S.convs.push(c); dirty = true;
    } else {
      if (!c.sent) { c.sent = true; dirty = true; }
      if (!c.title) { c.title = stripPrefix(m.text).slice(0, 40); dirty = true; }
      if (t > c.updatedAt) { c.updatedAt = t; dirty = true; }
    }
  }
  if (S.convs.length > 50) { S.convs.sort((a, b) => b.updatedAt - a.updatedAt); S.convs = S.convs.filter((c, i) => i < 50 || c.id === S.active); dirty = true; }
  if (dirty) saveConvs();
}

/* ---------- rendering ---------- */
function renderTabs() {
  document.body.classList.toggle('tab-talk', S.tab === 'talk');
  for (const b of document.querySelectorAll('.tab')) {
    const selected = b.dataset.tab === S.tab;
    b.classList.toggle('on', selected);
    if (selected) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  // The retired stub panel is hidden for every tab in the strip, so no surface can fall back to it.
  $('v-talk').hidden = S.tab !== 'talk'; $('v-control').hidden = S.tab !== 'control'; $('v-soon').hidden = ['talk', 'build', 'today', 'world', 'me', 'control'].includes(S.tab); $('v-today').hidden = S.tab !== 'today'; $('v-build').hidden = S.tab !== 'build'; $('v-world').hidden = S.tab !== 'world'; $('v-me').hidden = S.tab !== 'me';
  if (S.tab === 'build') { mountBuild(); scheduleBuild(0); }
  else { clearTimeout(buildTimer); buildTimer = 0; }
}

/* ---------- Today · World · Me ---------- */
// Read-only views over what the Host returned. They never send, approve or claim an effect;
// their only controls navigate to another surface or re-read the Host.
function surfaceContext() {
  return {
    paired: S.paired === true,
    mode: HOST_PREVIEW ? 'desktop-preview' : transport.direct ? 'direct' : 'cloud',
    connection: S.conn.label,
    connectionTone: S.conn.tone,
    pendingSend: transport.pending(),
    deviceStatus: S.device.status,
    scopes: S.device.scopes,
    nativePocket: !!pocketButton && !pocketButton.hidden
  };
}
function goTab(tab) {
  if (!tab || !TABS.includes(tab)) return;
  S.tab = tab; closeDrawer(); renderTabs(); renderSurfaces();
  if (HOST_PREVIEW) void refreshHostPreview();
  else if (tab === 'world') void refreshMedia(false);
}

// Owner media metadata travels over a separate Direct-only, device-scoped read.
// It never uses the cloud relay, reveals local file paths, or starts playback.
async function refreshMedia(force = false) {
  if (!S.paired || S.mediaLoading) return;
  if (!transport.direct) {
    S.media = { state: 'direct-only' };
    if (S.tab === 'world') renderSurfaces();
    return;
  }
  if (!force && S.mediaAt && Date.now() - S.mediaAt < 120000) return;
  const headers = transport.deviceHeaders?.();
  if (!headers) {
    S.media = { state: 'not-authorized' };
    if (S.tab === 'world') renderSurfaces();
    return;
  }
  S.mediaLoading = true;
  S.media = { state: 'loading' };
  if (S.tab === 'world') renderSurfaces();
  try {
    const response = await fetch('/mobile/api/media/library', {
      credentials: 'same-origin', cache: 'no-store', headers
    });
    const result = await response.json();
    if (response.status === 401 || response.status === 403) {
      S.media = { state: 'not-authorized' };
    } else if (!response.ok || result?.schema !== 'vivim.media-library-summary/1') {
      S.media = { state: 'unavailable', reason: result?.reason || 'MEDIA_READ_UNAVAILABLE' };
    } else {
      S.media = result;
    }
  } catch {
    S.media = { state: 'unavailable', reason: 'PC_CONNECTION_UNAVAILABLE' };
  } finally {
    S.mediaAt = Date.now();
    S.mediaLoading = false;
    if (S.tab === 'world') renderSurfaces();
  }
}
function openVivimDraft(text) {
  if (!transport.direct) { toast('Ask VIVIM controls need your Direct PC connection.'); return; }
  $('talk-target').value = 'vivim';
  if (N.target !== 'vivim') $('talk-target').dispatchEvent(new Event('change'));
  goTab('talk');
  $('text').value = String(text || '').slice(0, 1000);
  autogrow(); updateSend(); $('text').focus();
  // Only a filled composer: no Host call, AI send, or approval is triggered.
}
function renderSurfaces() {
  const ctx = surfaceContext();
  let host = null, model = null;
  if (S.tab === 'today') { host = $('v-today'); model = todayModel(S.statusObj, S.cmds, ctx); }
  else if (S.tab === 'world') { host = $('v-world'); model = worldModel(S.statusObj, S.cmds, { media: S.media }); }
  else if (S.tab === 'me') { host = $('v-me'); model = meModel(S.statusObj, S.cmds, ctx); }
  else return;
  if (!host) return;
  const sig = S.tab + '|' + JSON.stringify(model);
  if (S.sigs.ux === sig) return;
  S.sigs.ux = sig;
  const options = { onNavigate: goTab, onRefresh: () => HOST_PREVIEW ? refreshHostPreview() : refresh(),
    onAskVivim: transport.direct && !HOST_PREVIEW ? openVivimDraft : undefined,
    onRefreshMedia: () => { void refreshMedia(true); },
    onOpenPocket: () => { if (pocketButton && !pocketButton.hidden) pocketButton.click(); },
    onReplay: () => { if (welcome) welcome.open(); } };
  if (S.tab === 'today') renderToday(host, model, options);
  else if (S.tab === 'world') renderWorld(host, model, options);
  else renderMe(host, model, options);
}
function renderList() {
  const items = [...S.convs].sort((a, b) => b.updatedAt - a.updatedAt);
  const sig = S.active + JSON.stringify(items.map(c => [c.id, c.title, c.updatedAt, c.provider, c.model]));
  if (S.sigs.list === sig) return; S.sigs.list = sig;
  const box = $('convlist'); box.replaceChildren();
  for (const c of items) {
    const row = el('div', 'conv' + (c.id === S.active ? ' on' : ''));
    const b = el('button', 'pick'); b.type = 'button'; b.dataset.id = c.id;
    b.append(el('span', 'ct', c.title || 'New chat'), el('span', 'cs', c.provider + (c.model ? ':' + c.model : '')));
    const d = el('button', 'del', '×'); d.type = 'button'; d.dataset.del = c.id; d.setAttribute('aria-label', 'Remove conversation from this device');
    row.append(b, d); box.append(row);
  }
  if (!items.length) box.append(el('p', 'muted pad', 'No conversations yet.'));
}
function fmtSize(n) { return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
function renderComposer() {
  if (N.target === 'vivim') {
    $('chips').hidden = true; $('modelwrap').hidden = true; $('effortwrap').hidden = true;
    $('clip').hidden = true; $('files').hidden = true;
    $('text').placeholder = 'Ask VIVIM: show status, or describe a change…';
    $('text').maxLength = 1000;
    $('composer-note').textContent = HOST_PREVIEW
      ? 'Phone preview only · open Host menu to pair and connect'
      : 'PC-authoritative · previews first · approval required for changes';
    updateSend(); return;
  }
  $('composer-note').textContent = N.target === 'phone'
    ? 'Continue an existing PC session · never automatically resent'
    : 'Choose a signed-in AI · send-once through your PC';
  if (N.target === 'phone') {
    $('chips').hidden = true; $('modelwrap').hidden = true; $('effortwrap').hidden = true;
    $('clip').hidden = true; $('files').hidden = true; $('text').placeholder = 'Message your PC…'; $('text').maxLength = MAXTEXT;
    updateSend(); return;
  }
  $('chips').hidden = false;
  normalizeConv();
  const c = curConv(), ps = providers(), p = c && ps.find(x => x.id === c.provider);
  const sig = JSON.stringify([ps, c && [c.id, c.provider, c.model, c.effort], S.files.map(f => f.name + f.size)]);
  if (S.sigs.comp !== sig) {
    S.sigs.comp = sig;
    const chips = $('chips'); chips.replaceChildren();
    for (const x of ps) { const b = el('button', 'chip', x.label || x.id); b.type = 'button'; b.dataset.p = x.id; b.setAttribute('aria-pressed', String(!!c && x.id === c.provider)); chips.append(b); }
    if (!ps.length) chips.append(el('span', 'muted', 'No signed-in providers'));
    const models = (p && p.models) || [], cur = models.find(m => m.current);
    $('modelwrap').hidden = !models.length;
    const ms = $('model'); ms.replaceChildren(new Option('Default' + (cur ? ' (' + (cur.label || cur.id) + ')' : ''), ''), ...models.map(m => new Option(m.label || m.id, m.id)));
    ms.value = c && c.model || '';
    const lv = (p && p.thinkingLevels) || [];
    $('effortwrap').hidden = !lv.length;
    const es = $('effort'); es.replaceChildren(new Option('Thinking: default', ''), ...lv.map(l => { const o = new Option((l.label || l.id) + (l.locked ? ' · locked' : ''), l.id); o.disabled = !!l.locked; return o; }));
    es.value = c && c.effort || '';
    $('clip').hidden = !(p && p.attachments);
    const fb = $('files'); fb.replaceChildren(); fb.hidden = !S.files.length;
    S.files.forEach((f, i) => { const chip = el('span', 'file'); const n = el('span', '', f.name + ' · ' + fmtSize(f.size)); const x = el('button', '', '×'); x.type = 'button'; x.dataset.i = i; x.setAttribute('aria-label', 'Remove ' + f.name); chip.append(n, x); fb.append(chip); });
    $('text').placeholder = p ? 'Message ' + (p.label || p.id) + '…' : 'Message…';
    $('text').maxLength = c ? Math.max(1, MAXTEXT - mkPrefix(c).length) : MAXTEXT;
  }
  updateSend();
}
function updateSend() {
  if (HOST_PREVIEW) { $('send').disabled = true; return; }
  $('send').disabled = N.target === 'vivim'
    ? !transport.direct || vivimChat.busy() || !$('text').value.trim() || $('text').value.trim().length > 1000
    : N.target === 'phone'
      ? !transport.direct || !N.session || N.sending || !!N.pending || !$('text').value.trim()
      : S.sending || !curConv() || !providers().length || !$('text').value.trim();
}
function autogrow() { const t = $('text'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }
function dots(st) { const d = el('span', 'dots'); d.setAttribute('role', 'status'); d.setAttribute('aria-label', st === 'claimed' ? 'Working' : 'Queued'); d.append(el('i'), el('i'), el('i')); return d; }
// This is a device-render receipt, not evidence that the human read a reply.
// Never acknowledge a queued/claimed command or a mere status fetch.
const acknowledgedRenders=new Set(),pendingRenders=new Set();
async function acknowledgeRenderedReply({commandId,messageId,conversationId,replyRevision}) {
  if(!transport.direct||!S.paired||document.visibilityState!=='visible')return;
  const key=commandId+':'+replyRevision;
  if(acknowledgedRenders.has(key)||pendingRenders.has(key))return;
  const device=transport.deviceHeaders?.();
  if(!device)return;
  pendingRenders.add(key);
  try {
    const response=await fetch('/mobile/api/live/ack',{
      method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{...device,'content-type':'application/json','x-vivim-ack':'1'},
      body:JSON.stringify({commandId,messageId,conversationId,replyRevision})
    });
    if(response.ok)acknowledgedRenders.add(key);
    // No provider action or relay send is retried if this metadata acknowledgment fails.
  }catch{}finally{pendingRenders.delete(key);}
}
function renderMsgs(force) {
  if (N.target === 'vivim') {
    $('title').textContent = 'Ask VIVIM';
    vivimChat.render();
    return;
  }
  if (N.target === 'phone') return renderNative();
  const box = $('msgs'), c = curConv(), list = c ? msgsOf(c.id) : [];
  $('title').textContent = (c && c.title) || 'New chat';
  const timeline = S.statusObj?.snapshot?.live;
  const lifecycle = transport.direct && timeline?.state !== 'unavailable'
    ? timeline?.conversations?.find(entry => entry.id === c?.id) : null;
  const lifeByCommand = new Map((lifecycle?.messages || []).map(m => [m.commandId, m]));
  const sig = (c ? c.id : '-') + '|' + list.map(m => m.id + m.status + (m.result ? m.result.length : 0)).join(',')
    + '|' + (lifecycle?.revision ?? 'none');
  if (!force && S.sigs.msgs === sig) {
    // A crash may have persisted the Host receipt before the timeline append,
    // or a previous acknowledgment response may have been lost. The same
    // already-rendered reply may safely repeat its metadata-only receipt.
    if(document.visibilityState==='visible'&&S.paired&&transport.direct) {
      for(const m of list) {
        const state=lifeByCommand.get(m.id);
        if(m.status==='done'&&String(m.result||'').trim()&&
           state?.state==='reply_observed'&&state.replyDisplayVerified===true&&
           Number.isSafeInteger(state.revision)&&
           state.commandId===m.id&&state.messageId&&c?.id)
          queueMicrotask(()=>acknowledgeRenderedReply({commandId:m.id,
            messageId:state.messageId,conversationId:c.id,replyRevision:state.revision}));
      }
    }
    return;
  }
  S.sigs.msgs = sig;
  const switched = S.shownConv !== (c && c.id); S.shownConv = c && c.id;
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 140;
  const frag = document.createDocumentFragment();
  const renderAcks=[];
  if (!list.length) frag.append(el('div', 'empty', 'Pick a provider and say something.'));
  for (const m of list) {
    const when = tsOf(m) ? new Date(tsOf(m)).toLocaleString() : '';
    const u = el('div', 'm u');
    if (Array.isArray(m.attachments) && m.attachments.length) u.append(el('div', 'badge', 'attached: ' + m.attachments.map(a => a.name).join(', ')));
    const ub = el('div', 'bub', stripPrefix(m.text)); ub.title = when; u.append(ub); frag.append(u);
    const failed = m.status === 'failed', pend = isPend(m);
    if (!pend && !failed && m.status !== 'done' && !m.result) continue;
    let res = String(m.result || ''), tag = null; const tm = TAG.exec(res);
    if (tm) { tag = tm[1]; res = res.slice(tm[0].length); }
    const a = el('div', 'm a' + (failed ? ' err' : '')); a.append(el('div', 'badge', tag || targetLabel(m)));
    const observed = lifeByCommand.get(m.id);
    if (observed) {
      a.append(el('div', 'muted', LIVE_STATE_LABELS[observed.state] || 'State: ' + observed.state));
    }
    const b = el('div', 'bub');
    if (failed) b.textContent = res.includes('DRAFT_PRESENT') ? 'Not sent — ChatGPT has an unsent draft. Your draft was preserved.' : res || 'Failed';
    else if (res) b.innerHTML = md(res);
    else if (!pend) b.textContent = '(no reply)';
    if (pend) b.append(dots(m.status));
    a.append(b); frag.append(a);
    if(transport.direct && m.status==='done' && res.trim() &&
        observed?.state==='reply_observed' && observed.replyDisplayVerified===true &&
        Number.isSafeInteger(observed.revision) && observed.revision>0 &&
        observed.commandId===m.id && observed.messageId && c?.id) {
      renderAcks.push({commandId:m.id,messageId:observed.messageId,
        conversationId:c.id,replyRevision:observed.revision});
    }
  }
  box.replaceChildren(frag);
  if(document.visibilityState==='visible')
    for(const candidate of renderAcks)queueMicrotask(()=>acknowledgeRenderedReply(candidate));
  if (switched || near) box.scrollTop = box.scrollHeight;
}
function renderDebug() {
  if ($('dbg').hidden) return;
  const s = S.statusObj;
  $('status').textContent = s && s.at ? 'Updated ' + new Date(s.at).toLocaleString() + '\n' + JSON.stringify(s.snapshot, null, 1).slice(0, 8000) : 'Box agent has not reported yet.';
  const box = $('dbglist'); box.replaceChildren();
  for (const c of S.cmds.filter(x => !x.conversationId).slice(0, 15)) {
    const d = el('div', 'dcard'); d.append((c.status || '') + ' · ' + (c.kind || c.mode || 'cmd') + ' → ' + (c.consumer || '') + ' · ' + (tsOf(c) ? new Date(tsOf(c)).toLocaleString() : ''));
    d.append(el('pre', '', c.text || '')); if (c.result) d.append(el('pre', 'muted', '↳ ' + c.result)); box.append(d);
  }
}
function renderAll(force) { renderTabs(); renderList(); renderComposer(); renderMsgs(force); renderDebug(); renderSurfaces(); }

/* ---------- drawer / debug ---------- */
function closeDrawer() { $('drawer').classList.remove('open'); $('scrim').hidden = true; }
function openDebug() { $('dbg').hidden = false; $('connection-resolved').hidden = !transport.pending(); renderDebug(); }
function closeDebug() { $('dbg').hidden = true; }

// Host utilities are deliberately separate from the phone's normal navigation.
// We reuse the existing phone UI, not the old desktop dashboard or its scripts.
function installHostMenu() {
  const section = el('section', 'host-preview-menu');
  section.id = 'host-preview-menu';
  section.hidden = true;
  section.setAttribute('aria-label', 'Host utilities');
  const heading = el('h2', '', 'Your VIVIM Host');
  const description = el('p', 'muted', 'The phone app is your starting point. Administrative tools open only when you choose them.');
  const items = el('nav', 'host-preview-links');
  for (const [label, href] of [
    ['Pair a phone', '/onboarding'],
    ['Connections & permissions', '/host/control'],
    ['Host Control', '/host/control'],
    ['Host diagnostics', '/api/host/status']
  ]) {
    const anchor = el('a', '', label);
    anchor.href = href;
    anchor.target = '_top';
    items.append(anchor);
  }
  const personalize = el('button', '', 'Appearance');
  personalize.type = 'button';
  personalize.addEventListener('click', () => {
    section.hidden = true;
    $('theme-toggle').click();
  });
  items.append(personalize);
  const close = el('button', 'btn sm', 'Close menu');
  close.type = 'button';
  close.addEventListener('click', () => { section.hidden = true; $('gear').setAttribute('aria-expanded', 'false'); });
  section.append(heading, description, items, close);
  document.querySelector('main').append(section);
  $('gear').setAttribute('aria-label', 'Host menu');
  $('gear').setAttribute('aria-controls', section.id);
  $('gear').setAttribute('aria-expanded', 'false');
}
function toggleHostMenu() {
  const menu = $('host-preview-menu');
  if (!menu) return;
  menu.hidden = !menu.hidden;
  $('gear').setAttribute('aria-expanded', String(!menu.hidden));
}
let previewReadSequence = 0;
function renderHostPreviewActivity() {
  let section = $('host-preview-activity');
  if (!section) {
    section = el('section', 'ux-card');
    section.id = 'host-preview-activity';
    $('v-control').append(section);
  }
  const recent = S.statusObj?.snapshot?.control?.recent;
  section.replaceChildren(el('h2', 'ux-card-title', 'Recent Host decisions'));
  if (!Array.isArray(recent) || recent.length === 0) {
    section.append(el('p', 'muted', 'No Host decisions reported in the current owner view.'));
    return;
  }
  const list = el('ul', 'ux-list');
  for (const record of recent.slice(0, 12)) {
    const item = el('li', 'ux-item');
    item.append(el('strong', 'ux-item-title', record.actionId || 'Host decision'),
      el('span', 'ux-item-detail',
        (record.state || 'unknown') + (record.createdAt ? ' · ' + record.createdAt : '')));
    list.append(item);
  }
  section.append(list);
}
async function refreshHostPreview() {
  if (!HOST_PREVIEW) return;
  const sequence = ++previewReadSequence;
  try {
    const response = await fetch('/api/host/control/pwa-view', {
      method: 'GET', credentials: 'same-origin', cache: 'no-store'
    });
    if (!response.ok) throw new Error(response.status === 401 ? 'Owner session required' : 'Host source unavailable');
    const data = await response.json();
    if (data.schema !== 'vivim.host-pwa-view/1' || !data.snapshot ||
        data.snapshot.control?.schema !== 'vivim.control-recent/1')
      throw new Error('Invalid Host projection');
    if (sequence !== previewReadSequence) return;
    S.statusObj = { at: data.observedAt, snapshot: data.snapshot };
    setConn(data.state === 'source-backed' ? 'Owner view · read only' : 'Source unavailable',
      data.state !== 'source-backed');
    renderAll(true);
    if (build) build.setSurface(data.snapshot.bootstrap?.uiRevision ?? null);
    renderHostPreviewActivity();
  } catch (error) {
    if (sequence !== previewReadSequence) return;
    // Never keep a private stale snapshot visible after session expiry.
    S.statusObj = null;
    if (build) build.clear();
    setConn(error.message, true);
    renderAll(true);
    renderHostPreviewActivity();
  }
}
async function startHostPreview() {
  // The native desktop process passes only a single-use code, not its owner
  // capability. Exchange it once for an HttpOnly browser session; erase hash.
  const fragment = location.hash;
  if (fragment.startsWith('#control-session=')) {
    history.replaceState(null, '', location.pathname + location.search);
    const match = /^#control-session=([a-f0-9]{64})$/.exec(fragment);
    if (match) {
      try {
        await fetch('/api/host/control/ui-exchange', {
          method: 'POST', cache: 'no-store', credentials: 'same-origin',
          headers: { 'content-type': 'application/json', 'x-vivim-control': '1' },
          body: JSON.stringify({ code: match[1] })
        });
      } catch { /* Control stays locked; no bearer token is retained. */ }
    }
  }
  document.body.classList.add('paired', 'host-preview');
  $('pairbox').hidden = true;
  $('app').hidden = false;
  S.paired = false;
  S.cmds = []; S.convs = []; S.active = null; S.statusObj = null;
  S.tab = 'today'; N.target = 'vivim'; N.pending = null;
  $('talk-target').value = 'vivim';
  S.device = { status: 'preview', scopes: [] };
  $('control-text').disabled = true;
  $('control-preview').disabled = true;
  $('control-result').textContent = 'This desktop view can inspect real Host decisions, but cannot execute them. Open Host Control for authenticated changes.';
  setConn('Desktop preview · owner authorization required', true);
  renderAll(true);
  await refreshHostPreview();
}

/* Existing PC sessions only; transcript reads never create or fork sessions. */
function renderNative() {
  const box = $('msgs'), session = N.sessions.find(s => s.id === N.session);
  $('title').textContent = session?.title || 'PC sessions';
  $('native-status').textContent = !transport.direct ? 'Your PC needs a Direct connection.' : N.note || (N.session ? 'Existing session' : 'Choose an existing session.');
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 140;
  const frag = document.createDocumentFragment();
  if (!N.messages.length) frag.append(el('div', 'empty', N.session ? 'No public messages to show.' : 'Choose an existing session.'));
  for (const m of N.messages) {
    if (m.type !== 'user' && m.type !== 'assistant') continue;
    const row = el('div', 'm ' + (m.type === 'user' ? 'u' : 'a'));
    if (m.type === 'assistant') row.append(el('div', 'badge', 'PC'));
    const bubble = el('div', 'bub', String(m.text || '')); bubble.style.whiteSpace = 'pre-wrap'; row.append(bubble); frag.append(row);
  }
  if (N.pending && N.pending.session === N.session && !N.messages.some(m => m.id === N.pending.id)) {
    const row = el('div', 'm u'); row.append(el('div', 'badge', N.pending.accepted ? 'Queued · awaiting transcript' : 'Send uncertain · not resent'));
    const bubble = el('div', 'bub', N.pending.text); row.append(bubble); frag.append(row);
  }
  box.replaceChildren(frag); if (near) box.scrollTop = box.scrollHeight;
}
async function nativeSessions() {
  if (!transport.direct || N.target !== 'phone') return;
  try {
    const result = await api('sessions');
    if (N.target !== 'phone') return;
    N.sessions = Array.isArray(result?.sessions) ? result.sessions.filter(s => typeof s.id === 'string') : [];
    $('native-session').replaceChildren(new Option('Choose an existing session', ''), ...N.sessions.map(s => new Option(s.title || s.id, s.id)));
    $('native-session').value = N.session;
    N.note = N.sessions.length ? 'Choose an existing session.' : 'No existing sessions found.';
  } catch (e) { N.note = 'Could not load PC sessions: ' + e.message; }
  if (N.target === 'phone') renderNative();
}
async function nativeRefresh() {
  clearTimeout(N.timer);
  if (!transport.direct || N.target !== 'phone' || !N.session || !S.paired) return;
  const session = N.session, generation = N.generation;
  try {
    const result = await api('sessions/' + encodeURIComponent(session) + '/messages');
    if (N.target !== 'phone' || N.generation !== generation) return;
    N.messages = Array.isArray(result?.messages) ? result.messages : [];
    if (N.pending?.session === session) {
      const index = N.messages.findIndex(m => m.id === N.pending.id && m.type === 'user');
      if (index >= 0) {
        const reply = N.messages.slice(index + 1).find(m => m.type === 'assistant');
        N.note = reply?.completed ? 'Reply received.' : 'Working · waiting for a reply.';
        if (reply?.completed) { N.pending = null; saveNativePending(); }
      } else N.note = N.pending.accepted ? 'Queued · waiting for your PC.' : 'Send uncertain · check this session; not resent.';
    } else N.note = 'Existing session';
    renderNative(); updateSend();
  } catch (e) {
    if (N.target !== 'phone' || N.generation !== generation) return;
    N.note = 'Could not load transcript: ' + e.message; renderNative();
  }
  if (N.target === 'phone' && N.generation === generation) N.timer = setTimeout(nativeRefresh, 3000);
}
async function nativeSend() {
  const text = $('text').value.trim(), session = N.session;
  if (!transport.direct || !session || !text || N.sending || N.pending) return;
  const item = { id: 'msg_' + hex16() + hex16(), text, session, accepted: false };
  N.pending = item; saveNativePending(); N.sending = true; N.note = 'Sending…'; renderNative(); updateSend();
  try {
    const result = await api('sessions/' + encodeURIComponent(session) + '/prompt', { method: 'POST', body: JSON.stringify({ id: item.id, text }) });
    if (result?.accepted !== true || result.id !== item.id || result.sessionId !== session) throw Object.assign(new Error('Unexpected acknowledgment'), { uncertain: true });
    item.accepted = true; saveNativePending();
    if ($('text').value.trim() === text) { $('text').value = ''; autogrow(); }
    N.note = 'Queued · waiting for your PC.';
  } catch (e) {
    N.note = 'Send uncertain · check this session; not resent. ID: ' + item.id;
  }
  N.sending = false; updateSend(); if (N.target === 'phone') { renderNative(); nativeRefresh(); }
}

/* ---------- send ---------- */
async function send() {
  if (HOST_PREVIEW) {
    toast('This is your phone preview. Pair a phone or open Host Control to perform actions.');
    return;
  }
  if (N.target === 'vivim') {
    const field = $('text'), body = field.value.trim();
    if (!body || body.length > 1000 || vivimChat.busy()) return;
    // Submit exclusively to the Host plan boundary. Never route to a provider.
    void vivimChat.send(body);
    if (field.value.trim() === body) { field.value = ''; autogrow(); }
    updateSend();
    return;
  }
  if (N.target === 'phone') return nativeSend();
  if (S.sending) return;
  const c = curConv(), ta = $('text'), body = ta.value.trim(); if (!c || !body) return;
  const p = providers().find(x => x.id === c.provider); if (!p) { toast('Pick a signed-in provider'); return; }
  const prefix = mkPrefix(c);
  if (prefix.length + body.length > MAXTEXT) { toast('Message too long (max ' + MAXTEXT + ' incl. routing prefix)'); return; }
  const first = !c.sent && !msgsOf(c.id).length;
  const payload = { text: prefix + body, kind: 'command', consumer: 'harness', mode: 'relay-chat', conversationId: c.id,
    target: { provider: c.provider, model: c.model || null, effort: c.effort || null } };
  if (first) payload.newChat = true;
  if (S.files.length && p.attachments) payload.attachments = S.files.map(f => ({ name: f.name, mime: f.type || 'application/octet-stream', size: f.size }));
  S.sending = true; updateSend();
  try {
    await api('commands', { method: 'POST', body: JSON.stringify(payload) });
    ta.value = ''; autogrow(); S.files = [];
    c.sent = true; c.updatedAt = Date.now(); if (!c.title) c.title = body.slice(0, 40);
    saveConvs();
  } catch (e) { if (e.status === 401) { S.sending = false; return start(); } toast('Send failed: ' + e.message); }
  S.sending = false; renderAll(true); refresh();
}

/* ---------- polling ---------- */
function schedule() { clearTimeout(S.timer); if (!S.paired || N.target === 'phone') return; S.timer = setTimeout(refresh, pending(S.active) ? 2500 : 8000); }
async function refresh() {
  if (!S.paired || S.busy || N.target === 'phone') return;
  S.busy = true; clearTimeout(S.timer);
  try {
    const needStatus = !S.statusAt || Date.now() - S.statusAt > 7500;
    const [cm, st] = await Promise.all([api('commands'),
      needStatus ? api('status').catch(e => { if (e.status === 401) throw e; }) : null]);
    if (N.target === 'phone') { S.busy = false; return; }
    S.cmds = (cm && cm.commands) || [];
    if (st) { S.statusObj = st; S.statusAt = Date.now(); S.manifest = (st.snapshot && st.snapshot.manifest) || null; window.dispatchEvent(new CustomEvent('vivim:bootstrap-status', { detail: st })); }
    mergeServerConvs(); ensureActive();
    setConn(transport.direct ? 'Connected to PC' : 'Paired · relay online');
    renderAll();
  } catch (e) {
    // Status authority is unavailable: do not leave a previously private Build
    // revision visible or clickable after a grant loss/disconnect.
    if (build) { build.clear(); buildKey = ''; }
    if (e.status === 401) { S.busy = false; return start(); }
    setConn('Relay error: ' + e.message, true); ensureActive(); renderAll();
  }
  S.busy = false; schedule();
}

/* ---------- Build tab: committed surface plus poll-driven repaint ---------- */
function mountBuild() {
  if (build) return;
  const host = $('build-surface'); if (!host) return;
  try { build = mountBuildSurface(host, {
    readOnly: HOST_PREVIEW,
    onCommit: () => { buildKey = ''; scheduleBuild(0); }
  }); }
  catch (e) { setConn('Build surface unavailable: ' + e.message, true); }
  if (HOST_PREVIEW) {
    $('build-compose').replaceChildren(el('p', 'muted pad',
      'Committed Host interface · read only. Pair a phone or use Host Control to make changes.'));
    if (build) build.setSurface(S.statusObj?.snapshot?.bootstrap?.uiRevision ?? null);
    return;
  }
  mountCompose();
}
// The Build request screen. Requests ride the normal send path (one send, never repeated) in a hidden
// conversation, so they never appear in the Talk list.
let compose = null;
function mountCompose() {
  if (compose) return;
  const host = $('build-compose'); if (!host) return;
  compose = mountBuildCanvas({
    host, request: api,
    getSurface: () => (build && build.surface && build.surface()) || null,
    getProvider: () => S.statusObj?.snapshot?.onboarding?.primary || 'chatgpt',
    send: async (prompt, provider) => {
      const conversationId = 'c-' + hex16();
      S.hidden.add(conversationId); lsSet('relay.hidden.v1', [...S.hidden].slice(-200));
      const created = await api('commands', { method: 'POST', body: JSON.stringify({ text: prompt, kind: 'command', consumer: 'harness', mode: 'relay-chat', conversationId, newChat: true, target: { provider, model: null, effort: null } }) });
      if (!created?.id) throw new Error('not acknowledged');
      return created.id;
    },
    apply: (proposal, surface) => sendProposal(proposal, surface),
    onApplied: async () => { buildKey = ''; await refresh(); scheduleBuild(0); }
  });
}
// The welcome tour stays; the old "Start Here" page is replaced by the Today surface.
welcome = mountWelcome({ host: $('welcome') });
function scheduleBuild(delay = 6000) {
  if (!build || !S.paired || S.tab !== 'build' || buildTimer) return;
  buildTimer = setTimeout(pollBuild, delay);
}
async function pollBuild() {
  buildTimer = 0;
  if (!build || !S.paired || S.tab !== 'build') return;
  try {
    const st = await api('status');
    S.statusObj = st; S.statusAt = Date.now();
    const rev = st && st.snapshot && st.snapshot.bootstrap ? st.snapshot.bootstrap.uiRevision : null;
    // Always inspect the Host full snapshot. Comparing just a numeric revision
    // would conceal same-revision conflicts and an unproved rollback.
    const observed = build.setSurface(rev);
    buildKey = observed?.state === 'ready' ? String(rev.surfaceId) + ':' + String(rev.revision) : '';
  } catch (e) {
    if (build) build.clear();
    buildKey = '';
    if (e && (e.status === 401 || e.status === 403)) return;
  }
  if (S.paired && S.tab === 'build') scheduleBuild();
}

/* ---------- pairing / startup ---------- */
function showBrowserPairHelp(problem) {
  // PWA-first: a browser QR never redirects into an APK. Secure-key preflight
  // occurs before one-use redemption; the URL fragment stays available to retry.
  const existing = document.getElementById('vivim-device-handoff');
  if (existing) existing.remove();
  const panel = el('section', 'pair-handoff');
  panel.id = 'vivim-device-handoff';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Secure browser pairing needs attention');
  const title = el('h2', '', 'Pair directly in your browser');
  const detail = el('p', 'muted',
    'VIVIM needs private HTTPS, browser cryptography and site storage. ' +
    'Use Chrome with the trusted PC address and allow site storage. No pairing code has been consumed.');
  const reason = el('p', 'muted',
    'Browser check: ' + String(problem?.code || problem?.message || 'unavailable').slice(0, 100));
  const retry = el('button', 'btn pri', 'Try browser pairing again');
  retry.type = 'button';
  retry.addEventListener('click', () => { panel.remove(); void start(); });
  panel.append(title, detail, reason, retry);
  document.body.append(panel);
  $('app').hidden = true; $('pairbox').hidden = true;
}
function showPairingState(status, message = '') {
  if (!transport.direct) return;
  $('pair-legacy').hidden = true;
  const titles = {
    pending: 'Approval needed on your PC',
    revoked: 'This device was revoked',
    unpaired: 'Pair this browser',
    error: 'Secure pairing needs attention'
  };
  $('pair-title').textContent = titles[status] || 'Pair this browser';
  $('pair-help').textContent = message || (
    status === 'pending'
      ? 'Open Host Control on your PC to approve this device, then check again.'
      : status === 'revoked'
        ? 'This grant no longer works. Start a fresh one-use pairing link on your PC.'
        : 'Open VIVIM Host on your PC, choose Pair a phone, then scan its secure QR link here.'
  );
}

document.addEventListener('visibilitychange', () => {
  if (HOST_PREVIEW) return;
  if(document.visibilityState==='visible' && S.paired && transport.direct)renderMsgs(true);
  // A pending approval can complete while Android is backgrounded. On return,
  // refresh once; no enrollment token is redeemed and no command is resent.
  if (document.visibilityState === 'visible' && transport.direct && !S.paired &&
      parsePairFragment(location.hash).type === 'none') {
    clearTimeout(S.timer);
    start();
  }
});
async function start() {
  // Foreground resume and pending-approval polling can arrive together.
  // Serializing prevents overlapping Keystore proofs from invalidating each
  // other's four-hour session on the Host.
  if(starting)return starting;
  const attempt=runStart();
  starting=attempt;
  try{return await attempt;}finally{if(starting===attempt)starting=null;}
}
async function runStart() {
  const fragment = parsePairFragment(location.hash);
  if (transport.direct) $('pair-legacy').hidden = true;
  if (fragment.type === 'device') {
    // Secure browser PWA and native Android use the same Host challenge/grant contract.
    // Preflight before consuming a one-use QR token; never downgrade broken native signing.
    if (!transport.direct) { setConn('Pair from your private Direct Host URL only', true); return; }
    let signer;
    try {
      if (String(navigator.userAgent || '').includes('VIVIM/') &&
          globalThis.VivimDeviceKey === undefined)
        throw new Error('Installed Android signing bridge unavailable');
      signer = await prepareDeviceSigner();
    } catch (error) {
      setConn('Secure device pairing unavailable: ' + error.message, true);
      if (!String(navigator.userAgent || '').includes('VIVIM/')) showBrowserPairHelp(error);
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    try {
      const challenge = await redeemDevicePairToken(fragment.token, { direct: transport.direct, fetchImpl: fetch });
      await enrollWithChallenge(challenge, { signer });
      setConn('Approval requested on PC; return here once approved', true);
      showPairingState('pending');
      document.getElementById('app').hidden = true;
      document.getElementById('pairbox').hidden = false;
      return;
    } catch(error) { setConn('Pairing needs attention: ' + error.message, true); }
  } else if (fragment.type === 'legacy') {
    history.replaceState(null, '', location.pathname + location.search);
    try { await pair(fragment.value); }
    catch(error) { setConn('Pairing needs attention: ' + error.message, true); }
  }
  if (transport.direct) {
    try {
      const device = await resumeDeviceSession(transport);
      // The Me surface reports the phone's own grant honestly: status and scopes, never more.
      S.device = { status: device.status, scopes: Array.isArray(device.scopes) ? device.scopes : null };
      if (device.status !== 'active') {
        showPairingState(device.status);
        setConn(device.status === 'pending' ? 'PC approval required' :
          device.status === 'revoked' ? 'Device grant revoked' : 'Device not paired', true);
        $('pairbox').hidden = false; $('app').hidden = true;
        if (device.status === 'pending' && !approvalPoll) {
          approvalPoll = setTimeout(() => { approvalPoll = null; start(); }, 5000);
        }
        return;
      }
    } catch (error) {
      showPairingState('error',
        'Current device proof cannot be resumed (' + String(error.code || error.message).slice(0, 90) +
        '). If your browser key is lost, revoke the old grant on the PC and create a fresh pairing link.');
      setConn('Secure phone session unavailable', true);
      $('pairbox').hidden = false; $('app').hidden = true;
      return;
    }
  }
  if (approvalPoll) { clearTimeout(approvalPoll); approvalPoll = null; }
  clearTimeout(S.timer);
  let paired; try { ({ paired } = await api('session')); } catch (e) { setConn(e.message, true); return; }
  $('pairbox').hidden = paired; $('app').hidden = !paired;
  document.body.classList.toggle('paired', paired);
  setConn(paired ? 'Paired' : 'Not paired', !paired);
  S.paired = paired; clearTimeout(S.timer); S.busy = false;
  window.dispatchEvent(new CustomEvent('vivim:paired', { detail: { paired } }));
  if (paired) { renderAll(true); refresh(); }
}
$('pair-check').onclick = () => { if (transport.direct) void start(); };
$('pairbtn').onclick = async () => { try { localStorage.removeItem('vivim.bootstrap.projection.v1'); } catch {} window.dispatchEvent(new Event('vivim:clear-bootstrap-cache')); try { await pair($('secret').value.trim()); $('secret').value = ''; start(); } catch (e) { setConn('Pairing failed', true); } };

/* ---------- events ---------- */
$('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; goTab(b.dataset.tab); });
$('talk-target').value = N.target;
$('talk-target').addEventListener('change', () => {
  N.target = $('talk-target').value; N.generation++; clearTimeout(N.timer); clearTimeout(S.timer);
  const native = N.target === 'phone', controller = N.target === 'vivim';
  $('native-session').hidden = !native; $('native-status').hidden = !native;
  $('newchat').hidden = native;
  $('newchat').textContent = controller ? 'Clear chat' : 'New chat';
  $('drawer').hidden = native || controller; $('menu').hidden = native || controller; closeDrawer();
  S.sigs.comp = null; S.sigs.msgs = null;
  if (native) { renderComposer(); renderNative(); nativeSessions(); if (N.session) nativeRefresh(); }
  else {
    renderAll(true);
    if (controller) void vivimChat.loadSuggestions();
    refresh();
  }
});
$('msgs').addEventListener('vivim:control-example', event => {
  if (N.target !== 'vivim' || typeof event.detail?.text !== 'string') return;
  $('text').value = event.detail.text.slice(0, 1000);
  autogrow(); updateSend(); $('text').focus();
});
$('msgs').addEventListener('vivim:ask-ai-draft', event => {
  if (N.target !== 'vivim' || typeof event.detail?.text !== 'string') return;
  // Explicit user click: change mode, prefill only, never send to any provider.
  $('talk-target').value = 'harness';
  $('talk-target').dispatchEvent(new Event('change'));
  $('text').value = event.detail.text.slice(0, MAXTEXT);
  autogrow(); updateSend(); $('text').focus();
});
$('native-session').addEventListener('change', () => {
  N.session = $('native-session').value; N.messages = []; N.generation++; clearTimeout(N.timer);
  N.note = N.session ? 'Loading transcript…' : 'Choose an existing session.';
  renderNative(); updateSend(); nativeRefresh();
});
$('menu').addEventListener('click', () => { const o = $('drawer').classList.toggle('open'); $('scrim').hidden = !o; });
$('scrim').addEventListener('click', closeDrawer);
$('newchat').addEventListener('click', () => {
  if (N.target === 'vivim') {
    if (!vivimChat.clear()) toast('An action is in progress or uncertain. Review its result on the PC first.');
    else $('text').focus();
  } else newConv();
});
$('convlist').addEventListener('click', e => {
  const d = e.target.closest('[data-del]'); if (d) return deleteConv(d.dataset.del);
  const b = e.target.closest('[data-id]'); if (b) selectConv(b.dataset.id);
});
$('chips').addEventListener('click', e => {
  const b = e.target.closest('[data-p]'), c = curConv(); if (!b || !c || c.provider === b.dataset.p) return;
  c.provider = b.dataset.p; c.model = c.effort = null; saveConvs(); renderAll();
});
$('model').addEventListener('change', e => { const c = curConv(); if (c) { c.model = e.target.value || null; saveConvs(); renderAll(); } });
$('effort').addEventListener('change', e => { const c = curConv(); if (c) { c.effort = e.target.value || null; saveConvs(); renderAll(); } });
$('clip').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', e => { for (const f of e.target.files) if (S.files.length < 10) S.files.push(f); e.target.value = ''; renderComposer(); });
$('files').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { S.files.splice(+b.dataset.i, 1); renderComposer(); } });
$('text').addEventListener('input', () => { autogrow(); updateSend(); });
$('text').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer:fine)').matches) { e.preventDefault(); send(); }
});
$('send').addEventListener('click', send);
$('gear').addEventListener('click', HOST_PREVIEW ? toggleHostMenu : openDebug);
$('connection-mode').value = transport.mode();
$('connection-address').value = transport.directAddress();
$('connection-resolved').addEventListener('click', () => {
  if (confirm('Have you checked this connection for the pending send? This does not cancel or retry it.')) {
    transport.acknowledgePending(); $('connection-resolved').hidden = true;
    $('connection-status').textContent = 'Pending send acknowledged. No resend was made.';
  }
});
$('connection-apply').addEventListener('click', () => {
  try {
    transport.select($('connection-mode').value, $('connection-address').value.trim());
    $('connection-status').textContent = (transport.direct ? 'Direct' : 'Cloud') + ' · Connection preference saved. Cloud may require pairing.';
  } catch (e) {
    $('connection-status').textContent = e.message;
    if (transport.pending() && e.message.startsWith('A send may still be pending') && confirm('A send may still be pending on this connection. Switching will not reconcile it. Switch anyway?')) {
      transport.select($('connection-mode').value, $('connection-address').value.trim(), true);
    }
  }
});
$('dbgclose').addEventListener('click', closeDebug);
$('dbg').addEventListener('click', e => { if (e.target === $('dbg')) closeDebug(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDebug(); closeDrawer(); if (HOST_PREVIEW) { $('host-preview-menu').hidden = true; $('gear').setAttribute('aria-expanded', 'false'); } } });
$('dbgsend').addEventListener('click', async () => {
  const text = $('dbgtext').value.trim(); if (!text) return;
  try { await api('commands', { method: 'POST', body: JSON.stringify({ text, kind: $('kind').value, consumer: $('consumer').value }) }); $('dbgtext').value = ''; refresh(); }
  catch (e) { toast('Send failed: ' + e.message); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (HOST_PREVIEW) void refreshHostPreview(); else if (N.target === 'phone') nativeRefresh(); else refresh(); } });
window.addEventListener('vivim:bootstrap-refresh', () => { S.statusAt = 0; if (S.paired) refresh(); });

if (!HOST_PREVIEW && 'serviceWorker' in navigator) navigator.serviceWorker.register(transport.direct ? '/mobile/sw.js' : '/sw.js').catch(() => {});
$('native-session').hidden = N.target !== 'phone';
$('native-status').hidden = N.target !== 'phone';
$('drawer').hidden = N.target !== 'harness';
$('menu').hidden = N.target !== 'harness';
$('newchat').textContent = N.target === 'vivim' ? 'Clear chat' : 'New chat';
renderTabs();
renderComposer();
if (HOST_PREVIEW) installHostMenu();
if (N.target === 'vivim') { vivimChat.render(); if (!HOST_PREVIEW) void vivimChat.loadSuggestions(); }
if (HOST_PREVIEW) void startHostPreview(); else start();
