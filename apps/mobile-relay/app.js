// grokbot-authored. Relay PWA shell: same-origin only, no secrets stored in JS-readable storage.
import { transport } from './transport.mjs';
import { mountBuildSurface } from './generative-ui/phone-surface.mjs';
import { mountBuildCanvas } from './build-canvas.mjs';
import { createControlClient } from './control-client.mjs';
import {workspaceBindingData,hasWorkspaceBinding,projectStudioActivity,readPersonalCaptures} from './generative-ui/workspace-live-data.mjs';
import { resolveBuildRequest, buildSurfaceFromBootstrap, themeDraftCandidates, templateDraftCandidates } from './build-composer.mjs';
import { mountWelcome } from './welcome.mjs';
import { parsePairFragment, redeemDevicePairToken } from './pairing-link.mjs';
import { prepareDeviceSigner, enrollWithChallenge, resumeDeviceSession } from './device-enrollment.mjs';
import { worldModel, meModel, todayModel, LIVE_STATE_LABELS, TABS } from './ux/model.mjs';
import { renderToday, renderWorld, renderMe } from './ux/render.mjs';
import { createControlChat } from './control-chat.mjs';
import { mountComposerAssist } from './composer-assist.mjs';
import { sourceCards, sameSourceCard, matchesSourceContext, exactSourceContextUrl, reconcileSourceCards } from './wiki-source-view.mjs';
import { deriveReadiness, safeReadinessReport } from './ux/readiness.mjs';
import { mountCapabilityLauncher } from './ux/launcher-ui.mjs';
import { inspectShell, selectShell } from './ux/shell-inspection.mjs';
import { createShellPresentation } from './ux/shell-presentation.mjs';
import { mountLocalNotes } from './ux/local-notes-ui.mjs';
import { mountVoiceCapture } from './ux/voice-capture.mjs';
// @hq:consumes vivim.rust-wiki-source-stamp@1
// @hq:consumes vivim.rust-wiki-source-search@1
// @hq:consumes vivim.rust-wiki-source-transition@1
// The browser keeps its current Wiki UI; Rust supplies optional source identity
// from the same local WASM kernel used for VEC and other pure operations.
let rustWikiSourceStamp=null,rustWikiSearch=null,rustWikiSourceTransition=null;
let wikiSourceFence=null; // session-keyed and memory-only; a read never becomes a grant
if(typeof window!=='undefined'){
  void import('./vec-engines/rust-wasm.mjs')
    .then(module=>{
      rustWikiSourceStamp=module.rustWikiSourceStamp;
      rustWikiSearch=module.rustWikiSearch;
      rustWikiSourceTransition=module.rustWikiSourceTransition;
      return module.initializeRustUiEngine();
    }).catch(()=>{});
}
const $ = id => document.getElementById(id);
const api = transport.request;
const shellPresentation=createShellPresentation(document.body);
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
  media: { state: 'idle' }, mediaAt: 0, mediaOffset: 0, mediaLoading: false, nextBatch: null,
  wiki: null, wikiStamp: null, wikiError: 'Wiki not loaded', wikiContext: null, wikiContextError: ''
};
let buildBindingSequence=0;
let combinedInbox = true; // UI-only inbox aggregation; never fan-out or a provider target.
let providerRefreshBusy = false;
const N = { target: transport.direct ? 'vivim' : 'harness', session: '', sessions: [], messages: [], timer: 0, generation: 0, sending: false, note: '', pending: null };
// The dock rail states one fact: whether a previewed plan is still waiting.
// It is derived from the chat, never a second source of approval.
let chatHasApproval = false;
const vivimChat = createControlChat({
  host: $('msgs'), transport,
  getSurface: () => S.tab,
  onChange: () => {
    chatHasApproval = vivimChat.hasPendingApproval();
    updateSend();
    updateDock();
  },
  onNavigate: tab => goTab(tab),
  onOpenShares: () => {
    if (HOST_PREVIEW || !S.paired || !transport.direct || !transport.deviceHeaders?.()) {
      toast('Private sharing requires a paired, approved Direct phone.'); return;
    }
    $('share-open')?.click();
  },
  classifyBuild: async request => {
    if (!S.paired || HOST_PREVIEW || !transport.direct) return null;
    // Do not depend on Build having been opened or on a cached status envelope.
    // Read the existing authenticated status and respect a mounted revision guard.
    const status=await api('status');
    const bootstrap=status?.snapshot?.bootstrap;
    if(!S.paired || !bootstrap || bootstrap.schema!=='vivim.bootstrap-phone/1' ||
       bootstrap.state!=='ready' || !Object.hasOwn(bootstrap,'uiRevision')) return null;
    let surface;
    if(build){
      build.setSurface(bootstrap.uiRevision,bootstrap);
      surface=build.surface()??build.draftSurface();
    }else{
      surface=buildSurfaceFromBootstrap(bootstrap);
    }
    if(!surface)return null;
    return resolveBuildRequest({request,surface});
  },
  onBuildDraft: text => {
    if (!S.paired || HOST_PREVIEW) return;
    goTab('build');
    if (!compose?.setDraft(text)) toast('Build has an active request or this draft is too long. Finish it before starting another.');
  },
  onOpenPocket: pocketButton && !pocketButton.hidden ? () => pocketButton.click() : null
});
let build = null, buildTimer = 0, buildKey = '';
let dockAssist=null;
function composerScope(){
  if(HOST_PREVIEW||!S.paired||!transport.direct||!S.device.scopes?.includes('control:read')||document.hidden)return null;
  const headers=transport.deviceHeaders?.();
  const session=headers?.['x-vivim-device-session'];if(!session)return null;
  const revision=build?.surface()?.revision??S.statusObj?.snapshot?.bootstrap?.uiRevision?.revision??0;
  return [session,headers['x-vivim-grant-id'],S.tab,revision,S.wiki?.revision??0].join(':');
}
function classifyDraftUi(request){
  const surface=build?.surface()??build?.draftSurface()??buildSurfaceFromBootstrap(S.statusObj?.snapshot?.bootstrap);
  return surface?resolveBuildRequest({request,surface}):null;
}
let welcome = null;
let capabilityLauncher = null;
let localNotes = null;
let localVoice = null;
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

// One universal composer, one transport and one send path. The original
// Talk composer is moved (not cloned) to the shell root and remains focusable
// from every tab. Context and Workspaces here are local read-only projections.
let dockExpanded = false;
let chatContextEpoch = 0;
let chatContext = null;
let focusReturn = null;
const CHAT_FOCUS = Object.freeze(['today','talk','build','world','wiki','me','control']);
function updateDock() {
  const composer = $('chat-composer');
  if (!composer) return;
  const expanded = S.tab === 'talk' || dockExpanded;
  // A first-time user must be able to type in Chat even before pairing
  // (host-preview used to hide the composer entirely on every first visit).
  composer.hidden = false;
  composer.classList.toggle('is-collapsed',!expanded);
  $('dock-preview').hidden = expanded;
  $('dock-preview-title').textContent = chatHasApproval
    ? 'Approval waiting · review plan'
    : 'Ask ' +
      (N.target==='harness'?'my AIs':N.target==='phone'?'my PC':'VIVIM') +
      ' · '+S.tab.charAt(0).toUpperCase()+S.tab.slice(1);
  $('dock-surface-label').textContent = S.tab +
    (chatContext?.state==='source-backed' ? ' · Rust context' : ' · Host context');
  for(const button of document.querySelectorAll('[data-chat-target]')){
    button.setAttribute('aria-pressed',String(button.dataset.chatTarget===N.target));
    button.disabled = !S.paired || HOST_PREVIEW ||
      (button.dataset.chatTarget==='phone'&&!transport.direct);
  }
  document.body.classList.toggle('dock-expanded',expanded);
  if(!$('chat-context-panel').hidden) renderFocusPanel();
}
function expandDock() {
  if(HOST_PREVIEW || !S.paired) return;
  dockExpanded=true;
  updateDock();
  $('text').focus();
}
function switchChatTarget(next) {
  if(!S.paired || HOST_PREVIEW || !['vivim','harness','phone'].includes(next) ||
    (next==='phone'&&!transport.direct)) return;
  if(N.target!==next){
    $('talk-target').value=next;
    $('talk-target').dispatchEvent(new Event('change'));
  }
  dockExpanded=true;
  updateDock();$('text').focus();
}
function focusPreview(text,details) {
  const item=el('div','chat-context-evidence');
  item.append(el('strong','',text));
  if(details)item.append(el('small','',details));
  return item;
}
function renderFocusPanel() {
  const panel=$('chat-context-panel');
  if(panel.hidden)return;
  const focus=$('chat-focus-views');
  focus.replaceChildren();
  for(const tab of CHAT_FOCUS){
    const b=el('button','',tab.charAt(0).toUpperCase()+tab.slice(1));
    b.type='button';
    if(S.tab===tab)b.setAttribute('aria-current','page');
    b.addEventListener('click',()=>{goTab(tab);renderFocusPanel();});
    focus.append(b);
  }
  const rust=$('chat-rust-items');rust.replaceChildren();
  const available=chatContext?.state==='source-backed' && chatContext.focus===S.tab;
  $('chat-rust-state').textContent = !transport.direct || HOST_PREVIEW
    ? 'Native graph context is Direct-phone only.'
    : !S.paired || !transport.deviceHeaders?.()
      ? 'Approve this phone to read source-backed context.'
      : !chatContext ? 'Not loaded. Read verified context from the Host.'
      : available
        ? 'HQKG epoch '+chatContext.epoch+' · '+chatContext.tokensUsed+' / '+
          chatContext.budgetTokens+' estimated tokens · read only'
        : chatContext?.state==='loading'?'Reading existing Rust graph…'
        : chatContext?.reason || 'Native context unavailable or not configured.';
  if(available){
    for(const item of chatContext.items.slice(0,8)){
      rust.append(focusPreview(item.title,(item.summary ? item.summary+' · ' : '')+
        'Revision '+(item.sourceRevision ?? item.revision)+' · '+item.sourceCount+' provenance sources'));
    }
    if(!chatContext.items.length)rust.append(focusPreview('No committed Wiki observations','No source-backed items in this bounded native context.'));
    if(chatContext.budgetExhausted)rust.append(focusPreview('Context budget reached','Some nodes were not included.'));
  }
  const activity=$('chat-focus-activity');activity.replaceChildren();
  const current=todayModel(S.statusObj,S.cmds,surfaceContext());
  const entries=[...(current.attention||[]),...(current.running||[])].slice(0,6);
  if(current.mission?.schema==='vivim.mission-card/1'){
    activity.append(focusPreview(current.mission.title||'Current mission',
      (current.mission.phase||'')+' · '+(current.mission.needsYou?'Owner action needed':'No action requested')));
  }
  if(!entries.length && !current.mission)
    activity.append(focusPreview('No reported activity','No work or ETA is inferred.'));
  else for(const item of entries)activity.append(focusPreview(item.title||item.label||'Activity',
    item.detail||'Source-backed Host status'));
}
async function readGraphContext() {
  const focus=S.tab;
  const device=transport.deviceHeaders?.();
  if(HOST_PREVIEW||!transport.direct||!S.paired||!device){
    // Gated read: say so in the UI instead of silently repainting the panel.
    chatContext={state:'unavailable',reason:'Verified Host context needs a paired phone on a Direct PC connection.'};
    toast('Read verified context: pair this phone over Direct to load Host context.');
    renderFocusPanel();return;
  }
  const epoch=++chatContextEpoch;
  chatContext={state:'loading'};renderFocusPanel();
  try{
    const response=await fetch('/mobile/api/chat/context?focus='+encodeURIComponent(focus),{
      method:'GET',credentials:'same-origin',cache:'no-store',headers:device
    });
    const data=await response.json();
    if(epoch!==chatContextEpoch||!S.paired)return;
    if((response.status===401||response.status===403)&&
       isInvalidDeviceSession(data?.reason||data?.code)){
      transport.setDeviceSession(null);
      clearPrivatePhoneState();
      showPairingState('error','Your PC has revoked this session. Reconnect your phone.');
      setConn('PC device authorization expired or revoked',true);
      return;
    }
    if(!transport.deviceHeaders?.()||
       transport.deviceHeaders()['x-vivim-device-session']!==device['x-vivim-device-session'])return;
    if(!response.ok||data?.schema!=='vivim.hqkg-chat-context/1'){
      chatContext={state:'unavailable',reason:'Host context read unavailable'};
    }else if(data.state==='source-backed'&&data.authority==='read-only'&&
      data.focus===focus&&Array.isArray(data.items)&&data.items.length<=8){
      chatContext={schema:data.schema,state:data.state,focus,epoch:data.epoch,
        tokensUsed:data.tokensUsed,budgetTokens:data.budgetTokens,
        budgetExhausted:data.budgetExhausted,items:data.items};
    }else{
      chatContext={state:'unavailable',reason:data.reason||'Native context unavailable'};
    }
  }catch{
    if(epoch===chatContextEpoch)chatContext={state:'unavailable',reason:'Host or native Rust context unavailable'};
  }
  if(epoch===chatContextEpoch)renderFocusPanel();
}
function openFocusPanel() {
  const panel=$('chat-context-panel');
  if(panel.hidden){
    focusReturn=document.activeElement;
    panel.hidden=false;renderFocusPanel();
    $('chat-context-close').focus();
  }else closeFocusPanel();
}
function closeFocusPanel() {
  $('chat-context-panel').hidden=true;
  if(focusReturn?.isConnected&&typeof focusReturn.focus==='function')focusReturn.focus();
  focusReturn=null;
}
function mountUniversalDock() {
  // The original Talk input, provider chips, files, send button and statuses
  // remain the same nodes, with the same listeners and send-once fence.
  $('app').append($('chat-composer'));
  $('dock-preview').addEventListener('click',expandDock);
  document.querySelectorAll('[data-chat-target]').forEach(b=>
    b.addEventListener('click',()=>switchChatTarget(b.dataset.chatTarget)));
  $('dock-home').addEventListener('click',()=>goTab('talk'));
  $('dock-recents').addEventListener('click',()=>{
    if(!S.paired)return;
    combinedInbox=true;S.sigs.comp=null;S.sigs.list=null;
    if(N.target!=='harness'){
      $('talk-target').value='harness';
      $('talk-target').dispatchEvent(new Event('change'));
    }
    goTab('talk');
    if(!$('drawer').hidden){
      $('drawer').classList.add('open');$('scrim').hidden=false;
    }
  });
  $('dock-focus').addEventListener('click',openFocusPanel);
  $('dock-feed').addEventListener('click',()=>{
    if($('chat-context-panel').hidden)openFocusPanel();
    $('chat-focus-activity').scrollIntoView?.({block:'nearest'});
  });
  $('chat-context-close').addEventListener('click',closeFocusPanel);
  $('chat-rust-refresh').addEventListener('click',()=>void readGraphContext());
  updateDock();
}

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
    b.setAttribute('aria-selected', String(selected));
    b.tabIndex = selected ? 0 : -1;
    if (selected) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  updateDock();
  // The retired stub panel is hidden for every tab in the strip, so no surface can fall back to it.
  $('v-talk').hidden = S.tab !== 'talk'; $('v-control').hidden = S.tab !== 'control'; $('v-soon').hidden = true; $('v-today').hidden = S.tab !== 'today'; $('v-build').hidden = S.tab !== 'build'; $('v-world').hidden = S.tab !== 'world'; $('v-wiki').hidden = S.tab !== 'wiki'; $('v-me').hidden = S.tab !== 'me';
  if (S.tab === 'build' && !S.paired && !HOST_PREVIEW) {
    $('build-compose').replaceChildren(el('p', 'muted pad',
      'Offline or unpaired · Build is view-only until the PC confirms your device.'));
    $('build-surface').replaceChildren();
  } else if (S.tab === 'build') { mountBuild(); scheduleBuild(0); }
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
    nativePocket: !!pocketButton && !pocketButton.hidden,
    readiness: deriveReadiness({
      mode: HOST_PREVIEW ? 'desktop-preview' : transport.direct ? 'direct' : 'cloud',
      online: navigator.onLine !== false,
      paired: S.paired && (!transport.direct || !!transport.deviceHeaders?.()),
      secureContext: window.isSecureContext === true,
      hostReported: !!S.statusObj?.snapshot,
      scopes: S.device.scopes,
      providersSignedIn: Array.isArray(S.manifest?.providers)
        ? S.manifest.providers.filter(p=>p?.signedIn===true).length : null,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerControlled: !!navigator.serviceWorker?.controller,
      pendingSend: transport.pending(),
      mediaState: S.media?.state,
      installed: !!window.matchMedia?.('(display-mode: standalone)')?.matches ||
        navigator.standalone === true,
      installOffered: !!deferredInstallPrompt
    })
  };
}
function goTab(tab) {
  if (!tab || !TABS.includes(tab)) return;
  // Leaving World stops an in-flight media open or current native playback.
  // The Host has to release temporary stream access, not just hide the video.
  if (S.tab === 'world' && tab !== 'world' && playerActive) stopMediaPlayer();
  dockAssist?.reset();compose?.resetAssist?.();
  if(S.tab==='wiki'&&tab!=='wiki')clearWikiSources();
  if(S.tab==='build'&&tab!=='build'){buildBindingSequence++;if(build?.surface())build.setLiveData(null,build.surface().revision);build?.setInspecting?.(false);$('build-inspect-toggle')?.setAttribute('aria-pressed','false');}
  S.tab = tab;
  dockExpanded=false;
  chatContextEpoch++;
  chatContext=null;
  closeDrawer(); renderTabs(); renderSurfaces();
  document.getElementById('tab-' + tab)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (HOST_PREVIEW) void refreshHostPreview();
  else if (tab === 'world') void refreshMedia(false);
  if (tab === 'wiki') void refreshWiki();
  // Reuse the existing PWA polling timer. Navigating does not open a new tab,
  // duplicate a relay or schedule work when the phone is unpaired.
  if (HOST_PREVIEW || S.paired) schedule();
}

// The Host journal owns Wiki state; this view is strictly read-only.
let wikiReadSequence = 0;
let wikiSearchQuery=''; // ephemeral authorized source search; never persisted
let wikiSourceSurface=null,wikiSourcePanel=null,wikiSourceList=null,wikiSourceExcerpt=null,wikiSourceSelection=null,wikiSourceEpoch=0,wikiSourceStatus='Source index not loaded';
function clearWikiSources(reason='Source index not loaded'){
  wikiSourceEpoch++;wikiSourceSurface=null;wikiSourceSelection=null;wikiSourceStatus=reason;
  wikiSourceList?.replaceChildren();wikiSourceExcerpt?.replaceChildren();wikiSourcePanel=null;wikiSourceList=null;wikiSourceExcerpt=null;
}
function ingestWikiSources(surface){
  wikiSourceSurface=surface;
  if(wikiSourceSelection&&!sourceCards(surface).some(c=>sameSourceCard(c,wikiSourceSelection))){
    wikiSourceEpoch++;wikiSourceSelection=null;wikiSourceExcerpt?.replaceChildren(el('p','ux-note','Anchor changed or unavailable. Select fresh evidence.'));
  }
  wikiSourceStatus=surface?'Owner-authorized development source · read only':'Source index unavailable. No cached source displayed.';
}
async function readWikiSource(card){
  if(!HOST_PREVIEW||S.tab!=='wiki'||!S.statusObj||!sourceCards(wikiSourceSurface).some(c=>sameSourceCard(c,card)))return;
  const epoch=++wikiSourceEpoch;wikiSourceSelection=card;
  wikiSourceExcerpt?.replaceChildren(el('p','ux-note','Reading current anchor…'));
  try{
    const response=await fetch(exactSourceContextUrl(card),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});
    const data=response.ok?await response.json():null;
    if(epoch!==wikiSourceEpoch||S.tab!=='wiki'||!S.statusObj)return;
    if([401,403].includes(response.status)){clearWikiSources('Owner source access denied');renderWiki();return;}
    if(!matchesSourceContext(card,data)||!sourceCards(wikiSourceSurface).some(c=>sameSourceCard(c,card)))throw Error('Anchor changed');
    wikiSourceExcerpt?.replaceChildren(el('p','ux-note','Exact source occurrence · '+card.path+':'+card.line+' · read only'),el('pre','ux-note',data.context.fragment));
  }catch{
    if(epoch===wikiSourceEpoch){wikiSourceSelection=null;wikiSourceExcerpt?.replaceChildren(el('p','ux-note','Verified source unavailable. No cached context displayed.'));}
  }
}
function renderWikiSources(){
  if(!wikiSourcePanel){
    wikiSourcePanel=el('section','ux-card');
    wikiSourcePanel.append(el('h3','ux-card-title','Development source · semantic anchors'));
    wikiSourcePanel.append(el('p','ux-note','Source-derived claims are read only. Personal Wiki pages use their own journal.'));
    wikiSourceList=el('div','ux-item');wikiSourceExcerpt=el('div','ux-item');
    wikiSourcePanel.append(wikiSourceList,wikiSourceExcerpt);
  }
  const cards=sourceCards(wikiSourceSurface);
  reconcileSourceCards(wikiSourceList,cards,{createElement:tag=>el(tag,'ux-note'),onRead:card=>void readWikiSource(card)});
  if(!cards.length){wikiSourceList.replaceChildren(el('p','ux-note',wikiSourceStatus));}
  return wikiSourcePanel;
}
function clearWiki(reason = 'Wiki unavailable') {
  wikiReadSequence++;clearWikiSources(reason); wikiSearchQuery='';
  S.wiki = null; S.wikiStamp=null; S.wikiError = reason;
  S.wikiContext = null; S.wikiContextError = reason;
  if (S.tab === 'wiki') renderWiki();
}
// The owner-private context is a read-only overlay, not a second Wiki or a device grant.
function semanticRows(context) {
  const graph = context.semantics;
  if (graph?.schema !== 'vivim.autowiki-semantics/1' || graph.scope !== 'owner-private' ||
      graph.authority !== 'read-only' || graph.journalRevision !== context.revision ||
      graph.wikiRevision !== context.wikiRevision || !/^[a-f0-9]{64}$/.test(graph.digest || '') ||
      !Array.isArray(graph.nodes) || graph.nodes.length > 256 ||
      !Array.isArray(graph.relationships) || graph.relationships.length > 256) return null;
  const nodes = new Map();
  for (const node of graph.nodes) {
    if (typeof node?.id !== 'string' || typeof node.label !== 'string' || nodes.has(node.id)) return null;
    nodes.set(node.id, node);
  }
  const labels = { 'changed-section': 'changed', 'supersedes-change': 'supersedes',
    'belongs-to-page': 'belongs to', 'interpreted-as': 'interpreted as',
    'candidate-target': 'possible target', 'executed-action': 'executed',
    'confirmed-change': 'confirmed', 'created-page':'created', 'moved-page':'reordered',
    'linked-from':'linked from', 'linked-to':'linked to', 'wiki-page-link':'links to' };
  const priority = { 'confirmed-change': 0, 'changed-section': 1, 'supersedes-change': 2,
    'candidate-target': 3, 'executed-action': 4, 'interpreted-as': 5, 'belongs-to-page': 6, 'wiki-page-link':-1,
    'created-page':1, 'moved-page':2, 'linked-from':2, 'linked-to':2 };
  const rows = [];
  const ids = new Set();
  for (const relation of graph.relationships) {
    if (!relation || typeof relation.id !== 'string' || ids.has(relation.id) ||
        !Object.hasOwn(labels, relation.kind) || !nodes.has(relation.from) || !nodes.has(relation.to) ||
        !['observed-state','committed-change','inferred-relationship','executed-effect'].includes(relation.classification) ||
        !['host-product-journal','host-control-receipt'].includes(relation.source?.authority) ||
        typeof relation.source.ref !== 'string') return null;
    ids.add(relation.id);
    const from = nodes.get(relation.from), to = nodes.get(relation.to);
    rows.push({ id: relation.id, label: from.label + ' → ' + labels[relation.kind] + ' → ' + to.label,
      classification: relation.classification,
      evidence:relation.evidence,
      freshness: from.freshness || to.freshness || null,
      source: relation.source, priority: priority[relation.kind] });
  }
  rows.sort((a,b) => a.priority - b.priority ||
    (Number(b.source.revision) || 0) - (Number(a.source.revision) || 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { rows, count: nodes.size, digest: graph.digest, sources: graph.sources };
}
function renderSemanticKnowledge(card, context) {
  card.append(el('h3','ux-card-title','AutoWiki · semantic relationships'));
  const knowledge = semanticRows(context);
  if (!knowledge) { card.append(el('p','ux-note','Semantic projection unavailable or revision mismatch.')); return; }
  card.append(el('p','ux-note',knowledge.count + ' source-identified entities and events · ' + knowledge.rows.length + ' relationships · read only'));
  if (!knowledge.rows.length) card.append(el('p','ux-note','No source-supported relationships in the bounded snapshot.'));
  for (const row of knowledge.rows.slice(0,32)) {
    const item = el('div','ux-item');
    item.append(el('strong','ux-item-title',row.label), el('p','ux-note',row.classification + (row.evidence ? ' · '+row.evidence.origin+' / '+row.evidence.assurance+' ('+row.evidence.claim+') · '+row.evidence.freshness : ' · assurance unavailable') +
      (row.freshness ? ' · ' + row.freshness : '') + ' · ' + row.source.authority + ' ' + row.source.ref +
      ' · source revision ' + (row.source.revision ?? 'not recorded')));
    card.append(item);
  }
  if (knowledge.rows.length > 32) card.append(el('p','ux-note',(knowledge.rows.length - 32) + ' additional relationships in the Host read model.'));
  card.append(el('p','ux-note','Snapshot digest ' + knowledge.digest));
}
function renderWikiContext() {
  const card = el('section', 'ux-card');
  card.append(el('h3', 'ux-card-title', 'AutoWiki · source-backed context'));
  const context = S.wikiContext;
  if (!context) {
    card.append(el('p', 'ux-note', S.wikiContextError || 'Owner-private context unavailable.'));
    return card;
  }
  card.append(el('p', 'ux-note', 'User statements (unverified) · journal sequence ' + context.revision));
  if (!context.items.length) card.append(el('p', 'ux-note', 'No source-identified observations.'));
  for (const item of context.items.slice().reverse()) {
    const row = el('div', 'ux-item');
    row.append(el('p', 'ux-note', item.text),
      el('p', 'ux-note', 'Unverified user statement · journal ' + item.entryId + ' · sequence ' + item.sequence));
    card.append(row);
  }
  if (context.omitted) card.append(el('p', 'ux-note', context.omitted + ' older observations omitted.'));
  card.append(el('h3', 'ux-card-title', 'Committed Wiki changes · derived, read only'));
  if (!context.wikiChanges.items.length) card.append(el('p', 'ux-note', 'No source-identified committed changes.'));
  for (const item of context.wikiChanges.items.slice().reverse()) {
    const row = el('div', 'ux-item');
    row.append(el('strong', 'ux-item-title', item.relationship.page + '/' + item.relationship.section),
      el('p', 'ux-note', item.status + ' · Wiki rev ' + item.previousWikiRevision + ' → ' + item.wikiRevision),
      el('p', 'ux-note', 'Journal ' + item.entryId + ' · sequence ' + item.sequence));
    card.append(row);
  }
  if (context.wikiChanges.omitted) card.append(el('p', 'ux-note', context.wikiChanges.omitted + ' older changes omitted.'));
  card.append(el('h3', 'ux-card-title', 'Executed application effects · historical receipts'));
  const effects = context.applicationEffects;
  if (effects?.state !== 'source-backed') card.append(el('p', 'ux-note', 'Control receipt context unavailable.'));
  else {
    card.append(el('p', 'ux-note', 'Scanned ' + effects.scannedPlans + ' recent plans (limit ' + effects.scanLimit +
      ') · not current-state verification'));
    if (!effects.items.length) card.append(el('p', 'ux-note', 'No applied effects in the scanned plans.'));
    for (const item of effects.items) {
      const row = el('div', 'ux-item');
      row.append(el('strong', 'ux-item-title', item.actionId),
        el('p', 'ux-note', 'Historical applied receipt · ' + item.planId + ' · source revision ' +
          (item.sourceRevision ?? 'not recorded') + ' · ' + item.receivedAt));
      if (item.wikiLink) row.append(el('p', 'ux-note', 'Linked committed edit ' + item.wikiLink.entryId + ' · Wiki rev ' + item.wikiLink.wikiRevision));
      if(item.visualLink)row.append(el('p','ux-note','Committed visual revision '+item.visualLink.surfaceId+
        ' · '+item.visualLink.parentRevision+' → '+item.visualLink.revision+' · '+item.visualLink.changeId));
      if(item.structureLink) row.append(el('p','ux-note','Linked committed Wiki structure '+item.structureLink.entryId+' · Wiki rev '+item.structureLink.wikiRevision));
      card.append(row);
    }
    if (effects.omitted) card.append(el('p', 'ux-note', effects.omitted + ' additional applied effects omitted.'));
  }
  card.append(el('h3','ux-card-title','Studio outcomes · historical source evidence'));
  const activity=projectStudioActivity(context.studioOutcomes);
  if(activity.state!=='source-backed')card.append(el('p','ux-note','Studio outcome evidence unavailable.'));
  else{
    if(!activity.items.length)card.append(el('p','ux-note','No observed provider outcomes in the committed timeline.'));
    for(const row of activity.items)card.append(el('strong','ux-item-title',row.label),el('p','ux-note',row.detail+' · event '+row.sourceRef));
  }
  renderSemanticKnowledge(card, context);
  card.append(el('p', 'ux-note', 'Project and task links require explicit source evidence; no inferred project membership is asserted.'));
  return card;
}
function validAppliedEffects(effects) {
  if (effects === undefined) return true;
  if (effects?.state === 'unavailable') return Array.isArray(effects.items) && effects.items.length === 0;
  return effects?.state === 'source-backed' && effects.scanLimit === 100 &&
    Number.isSafeInteger(effects.scannedPlans) && effects.scannedPlans >= 0 && effects.scannedPlans <= effects.scanLimit &&
    Number.isSafeInteger(effects.omitted) && effects.omitted >= 0 && Array.isArray(effects.items) &&
    effects.items.length <= 24 && effects.items.length + effects.omitted <= effects.scannedPlans &&
    effects.items.every(item => item?.source === 'host-control-receipt' && item.kind === 'executed-effect' &&
      item.status === 'historical-applied-receipt' && typeof item.planId === 'string' &&
      typeof item.actionId === 'string' && typeof item.receivedAt === 'string' &&
      typeof item.planDigest === 'string' && /^[a-f0-9]{64}$/.test(item.planDigest) &&
      (item.sourceRevision === null || (Number.isSafeInteger(item.sourceRevision) && item.sourceRevision >= 0)));
}
function validWikiContext(context, wiki) {
  const validEntry = item => item?.source === 'host-product-journal' && typeof item.entryId === 'string' &&
    Number.isSafeInteger(item.sequence) && item.sequence >= 1 && item.sequence <= context.revision;
  return context?.schema === 'vivim.wiki-context/1' && context.state === 'source-backed' &&
    Number.isSafeInteger(context.revision) && context.revision >= 0 && context.wikiRevision === wiki.revision &&
    validAppliedEffects(context.applicationEffects) && Array.isArray(context.items) && context.items.length <= 24 &&
    Number.isSafeInteger(context.omitted) && context.omitted >= 0 &&
    context.items.every(item => validEntry(item) && item.status === 'user-statement-unverified' && typeof item.text === 'string') &&
    Array.isArray(context.wikiChanges?.items) && context.wikiChanges.items.length <= 24 &&
    Number.isSafeInteger(context.wikiChanges.omitted) && context.wikiChanges.omitted >= 0 &&
    context.wikiChanges.items.every(item => validEntry(item) && item.kind === 'committed-wiki-edit' &&
      ['current-section-revision', 'superseded-section-revision'].includes(item.status) &&
      Number.isSafeInteger(item.previousWikiRevision) && item.previousWikiRevision >= 0 &&
      item.wikiRevision === item.previousWikiRevision + 1 && item.wikiRevision <= wiki.revision &&
      item.relationship?.kind === 'mutated-section' && typeof item.relationship.page === 'string' &&
      typeof item.relationship.section === 'string' &&
      Object.hasOwn(wiki.pages[item.relationship.page]?.sections || {}, item.relationship.section));
}
function renderWiki() {
  const host = $('v-wiki'); if (!host) return;
  const scroll = el('div', 'ux-scroll');
  const head = el('section', 'ux-card');
  head.append(el('h2', 'ux-card-title', 'Host Wiki'),
    el('p', 'ux-note', Number.isSafeInteger(S.wiki?.revision) ? 'Revision ' + S.wiki.revision : 'Not available'));
  const refresh = el('button', 'btn sm', 'Refresh Wiki');
  refresh.type = 'button'; refresh.addEventListener('click', () => { void refreshWiki(); });
  head.append(refresh);
  if(S.wikiStamp){
    head.append(el('p','ux-note','Rust source identity · '+S.wikiStamp.digest.slice(0,12)+' · observation only'));
  }
  const contextButton = el('button', 'btn sm', 'Source context');
  contextButton.type = 'button';
  contextButton.disabled = HOST_PREVIEW || !transport.direct || !S.paired ||
    !S.device.scopes?.includes('control:read');
  contextButton.addEventListener('click', () => {
    if ($('chat-context-panel').hidden) openFocusPanel();
    void readGraphContext(); // Existing authorized, bounded native HQKG read only.
  });
  head.append(contextButton);
  // Search the authorized Host Wiki through the same Rust kernel as GPUI.
  // It cannot mutate the source, escape this device session, or publish a grant.
  const searchInput=el('input','ux-search');
  searchInput.type='search';
  searchInput.placeholder='Search Wiki source previews';
  searchInput.maxLength=160;
  searchInput.value=wikiSearchQuery;
  searchInput.autocomplete='off';
  const runWikiSearch=()=>{
    wikiSearchQuery=searchInput.value.trim().slice(0,160);
    renderWiki();
  };
  searchInput.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();runWikiSearch();}
  });
  const searchButton=el('button','btn sm','Search Wiki');
  searchButton.type='button';searchButton.disabled=!S.wiki;
  searchButton.addEventListener('click',runWikiSearch);
  const clearSearch=el('button','btn sm','Clear search');
  clearSearch.type='button';clearSearch.disabled=!wikiSearchQuery;
  clearSearch.addEventListener('click',()=>{wikiSearchQuery='';renderWiki();});
  head.append(searchInput,searchButton,clearSearch);
  scroll.append(head);
  if (!S.wiki) scroll.append(el('p', 'ux-empty', S.wikiError));
  else {
    const pageCards=new Map(),captures=new Map();
    if(wikiSearchQuery){
      const found=rustWikiSearch?.(S.wiki,wikiSearchQuery);
      const searchCard=el('section','ux-card');
      searchCard.append(el('h3','ux-card-title','Rust Wiki search · read only'));
      if(found?.wikiRevision===S.wiki.revision &&
          (!S.wikiStamp||found.wikiDigest===S.wikiStamp.digest)){
        searchCard.append(el('p','ux-note',
          found.matches+' bounded matches · '+found.scannedPages+' of '+found.totalPages+
          ' pages · '+found.indexedSections+' sections indexed'+
          (found.indexTruncated?' · some source omitted by indexing bounds':' · complete within index')));
        for(const hit of found.results){
          const label=hit.page+(hit.section?' / '+hit.section:'')+
            (hit.excerpt?' · '+hit.excerpt:'');
          const jump=el('button','btn sm ux-secondary',label);
          jump.type='button';
          jump.addEventListener('click',()=>pageCards.get(hit.page)?.scrollIntoView?.({block:'start'}));
          searchCard.append(jump);
        }
        if(found.matches>found.results.length)
          searchCard.append(el('p','ux-note',
            (found.matches-found.results.length)+' more preview matches not displayed.'));
      }else{
        searchCard.append(el('p','ux-note',
          'Rust search is unavailable or source identity changed. No fallback matching or cached results.'));
      }
      scroll.append(searchCard);
    }
    const captureProjection=readPersonalCaptures(S.wiki);
    if(captureProjection){
      for(const row of captureProjection.items)captures.set(row.page,row);
      const summary=el('section','ux-card');summary.append(el('h3','ux-card-title','Personal captures'));
      const counts=captureProjection.counts;
      summary.append(el('p','ux-note',counts.notes+' notes · '+counts.openTasks+' open tasks · '+counts.doneTasks+' completed tasks'+(counts.unknownTasks?' · '+counts.unknownTasks+' unknown status':'')));
      if(captureProjection.omitted)summary.append(el('p','ux-note','Showing '+captureProjection.items.length+' of '+captureProjection.total+' capture shortcuts; all Wiki pages remain below.'));
      for(const row of captures.values()){
        const content=S.wiki.pages[row.page].sections[row.section].replace(/\s+/g,' ').slice(0,90);
        const open=el('button','btn sm ux-secondary',(row.kind==='task'?row.status+' task':'Note')+' · '+content);open.type='button';
        open.addEventListener('click',()=>pageCards.get(row.page)?.scrollIntoView?.({block:'start'}));summary.append(open);
      }
      scroll.append(summary);
    }
    for (const [name, page] of Object.entries(S.wiki.pages)) {
      const card = el('section', 'ux-card');
      pageCards.set(name,card);
      const capture=captures.get(name);
      card.append(el('h3','ux-card-title',capture?(capture.kind==='task'?'Task · '+capture.status:'Personal note'):name));
      if(capture){card.append(el('p','ux-note',name+' · captured at Wiki revision '+capture.createdRevision));
        if(capture.kind==='task'&&['Open','Done'].includes(capture.status)&&!HOST_PREVIEW&&transport.direct&&S.paired&&S.device.scopes?.includes('control:execute')){
          const revision=S.wiki.revision,status=capture.status==='Open'?'Done':'Open';
          const action=el('button','btn sm ux-secondary',status==='Done'?'Review completion':'Review reopen');action.type='button';
          action.addEventListener('click',()=>{if(S.wiki?.revision!==revision||!S.paired||!transport.deviceHeaders?.()||!S.device.scopes?.includes('control:execute'))return;
            openVivimDraft('edit wiki section '+name+'/Status saying '+status);});card.append(action);
        }
      }
      const links=Array.isArray(page.links)?page.links.filter(p=>typeof p==='string'&&Object.hasOwn(S.wiki.pages,p)):[];
      if(links.length){
        card.append(el('p','ux-note','Links to:'));
        for(const target of links){
          const button=el('button','btn sm ux-secondary',target);button.type='button';
          button.addEventListener('click',()=>pageCards.get(target)?.scrollIntoView?.({block:'start'}));
          card.append(button);
        }
      }
      for (const [section, content] of Object.entries(page.sections)) {
        const item = el('div', 'ux-item');
        item.append(el('strong', 'ux-item-title', section), el('p', 'ux-note', content));
        card.append(item);
      }
      scroll.append(card);
    }
    if (!Object.keys(S.wiki.pages).length) scroll.append(el('p', 'ux-empty', 'No Wiki pages yet.'));
    if (HOST_PREVIEW) scroll.append(renderWikiContext(),renderWikiSources());
    else {
      const changes = S.wiki.autoWiki;
      const card = el('section', 'ux-card');
      card.append(el('h3', 'ux-card-title', 'AutoWiki · committed Wiki changes'));
      if (changes?.schema === 'vivim.autowiki-wiki-changes/1' && changes.scope === 'wiki-edits-only' &&
          changes.wikiRevision === S.wiki.revision && Array.isArray(changes.items) && changes.items.length <= 24) {
        card.append(el('p', 'ux-note', changes.total + ' committed edits · Wiki rev ' + changes.wikiRevision));
        for (const entry of changes.items.slice().reverse()) {
          if (entry.kind !== 'committed-wiki-edit' || !entry.relationship ||
              !['current-section-revision','superseded-section-revision'].includes(entry.status)) continue;
          card.append(el('strong', 'ux-item-title', entry.relationship.page + ' / ' + entry.relationship.section),
            el('p', 'ux-note', 'Observed state · ' + entry.status + ' · rev ' +
              entry.previousWikiRevision + ' → ' + entry.wikiRevision),
            el('p', 'ux-note', 'Journal ' + entry.entryId + ' · ' + entry.receivedAt));
        }
        if (!changes.items.length) card.append(el('p', 'ux-note', 'No committed section edits yet.'));
      } else card.append(el('p', 'ux-note', 'Source-linked changes unavailable.'));
      card.append(el('p', 'ux-note', 'Owner-private AutoWiki observations are not granted to this device.'));
      scroll.append(card);
    }
  }
  host.replaceChildren(scroll);
}
async function refreshWiki() {
  if (S.tab !== 'wiki') return;
  const sequence = ++wikiReadSequence;
  if (!HOST_PREVIEW && (!transport.direct || !S.paired ||
      !S.device.scopes?.includes('control:read') || !transport.deviceHeaders?.())) {
    clearWiki('Connect an authorized Direct phone with Wiki read access.'); return;
  }
  if (HOST_PREVIEW && !S.statusObj) {
    clearWiki('Owner session required to read the Host Wiki.'); return;
  }
  const session = HOST_PREVIEW ? null : transport.deviceHeaders();
  try {
    // The local /api/wiki route is loopback-only, but the embedded desktop
    // owner preview must also have a live, unexpired browser owner session.
    if (HOST_PREVIEW) {
      const owner = await fetch('/api/host/control/ui-state', {
        method: 'GET', credentials: 'same-origin', cache: 'no-store'
      });
      if (!owner.ok) throw new Error('Owner session required to read the Host Wiki.');
    }
    const response = await fetch(HOST_PREVIEW ? '/api/host/control/wiki-view' : '/mobile/api/wiki', {
      method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: session || {}
    });
    if (!response.ok) {
      if (!HOST_PREVIEW && [401, 403].includes(response.status)) {
        const denied = await response.json().catch(() => ({}));
        if (isInvalidDeviceSession(denied.code || denied.error)) {
          clearPrivatePhoneState(); return;
        }
      }
      throw new Error('Wiki read refused (HTTP ' + response.status + ')');
    }
    const wiki = await response.json();
    if (!wiki || !Number.isSafeInteger(wiki.revision) || wiki.revision < 0 ||
        !wiki.pages || typeof wiki.pages !== 'object' || Array.isArray(wiki.pages) ||
        Object.values(wiki.pages).some(page => !page || !page.sections ||
          typeof page.sections !== 'object' || Array.isArray(page.sections) ||
          Object.values(page.sections).some(value => typeof value !== 'string')))
      throw new Error('Invalid Host Wiki projection');
    let context = null, contextError = '',sourceSurface=null;
    if (HOST_PREVIEW) {
      try {
        const privateRead = await fetch('/api/host/control/wiki-context', {
          method: 'GET', credentials: 'same-origin', cache: 'no-store'
        });
        if (!privateRead.ok) throw new Error('Owner context unavailable (HTTP ' + privateRead.status + ').');
        const data = await privateRead.json();
        if (!validWikiContext(data, wiki)) throw new Error('AutoWiki revision mismatch or invalid context; rechecking.');
        context = data;
      } catch (error) { contextError = error?.message || 'Owner context unavailable.'; }
      // Development source is a separate private owner read, never part of the phone grant.
      if(context){try{
        const sourceResponse=await fetch('/api/file-surface?limit=16',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(5000)});
        if(sourceResponse.ok)sourceSurface=await sourceResponse.json();
      }catch{/* clear private evidence below */}}
    }
    if (sequence !== wikiReadSequence || S.tab !== 'wiki') return;
    if (!HOST_PREVIEW && transport.deviceHeaders?.()?.['x-vivim-device-session'] !==
        session['x-vivim-device-session']) return;
    if (S.wiki && wiki.revision < S.wiki.revision) {
      clearWikiSources('Wiki revision regressed');S.wikiContext = null; S.wikiContextError = 'Wiki revision regressed; private context cleared.';
      renderWiki(); return;
    }
    // Native and PWA share one pure Rust source digest. Unlike a revision,
    // the digest catches divergent pages under the same Host revision.
    // Missing WASM does not create an alternative Wiki authority.
    const fenceKey=HOST_PREVIEW?'host-owner-preview':session?.['x-vivim-device-session'];
    // Never share source monotonicity across unrelated paired-device sessions.
    if(wikiSourceFence && wikiSourceFence.key!==fenceKey)wikiSourceFence=null;
    const nativeStamp=rustWikiSourceStamp?.(wiki);
    const validStamp=!!nativeStamp && nativeStamp.revision===wiki.revision &&
      nativeStamp.pagesTotal===Object.keys(wiki.pages).length;
    const accepted=validStamp &&
      rustWikiSourceTransition?.(wikiSourceFence?.stamp??null,nativeStamp)===true;
    if(wikiSourceFence && !accepted){
      // A transient loss of WASM must not erase the last known source identity.
      clearWiki('Wiki source identity unavailable or revision conflict');return;
    }
    if(validStamp && !accepted){
      clearWiki('Rust Wiki source identity validation unavailable');return;
    }
    if(accepted)wikiSourceFence={key:fenceKey,stamp:nativeStamp};
    if(HOST_PREVIEW)ingestWikiSources(sourceSurface);
    S.wiki = wiki; S.wikiStamp=accepted?nativeStamp:null; S.wikiError = ''; S.wikiContext = context; S.wikiContextError = contextError; renderWiki();
  } catch (error) {
    if (sequence === wikiReadSequence && S.tab === 'wiki')
      clearWiki(error?.message || 'Wiki unavailable');
  }
}

// Media authorization failures have two different meanings. Missing control:read
// is a scoped denial and should NOT invalidate other phone grants. Revoked,
// missing or expired device sessions must hide all privileged projections.
function isInvalidDeviceSession(code) {
  return ['DEVICE_SESSION_REQUIRED', 'GRANT_UNKNOWN', 'GRANT_NOT_ACTIVE',
    'GRANT_REVOKED', 'SESSION_EXPIRED', 'SESSION_MISMATCH'].includes(code);
}
// A lost grant must clear *all* private phone projections, not just hide tabs.
// Session restoration must start from new device proof; no offline replay.
function clearPrivatePhoneState() {
  wikiSourceFence=null;
  buildBindingSequence++;
  shellPresentation.clear();
  dockAssist?.reset();compose?.resetAssist?.();capabilityLauncher?.close();
  mediaGeneration++;
  chatContextEpoch++;
  chatContext=null;closeFocusPanel();dockExpanded=false;
  stopMediaPlayer();
  clearWiki('Device authorization expired');
  clearTimeout(S.timer); S.timer = 0;
  S.paired = false; S.cmds = []; S.statusObj = null; S.manifest = null;
  vivimChat.redact();
  S.files = []; N.messages = []; N.sessions = []; N.session = '';
  // The native panel's own pending record is private phone state too: a lost
  // grant must erase it from memory and from sessionStorage, so no queued or
  // uncertain native text is displayed (or restored) after revocation.
  // Invalidate outstanding native reads and redact the local pending projection.
  N.generation++; clearTimeout(N.timer); N.timer = 0;
  N.pending = null; saveNativePending(); N.sending = false; N.note = '';
  $('text').value = ''; $('dbg').hidden = true;
  S.media = { state: 'not-authorized' }; S.mediaAt = 0; S.mediaOffset = 0; S.mediaLoading = false;
  S.sigs.ux = null; S.sigs.msgs = null; S.sigs.list = null;
  $('app').hidden = true; $('pairbox').hidden = false;
  document.body.classList.remove('paired', 'offline-shell');
  if (build) build.clear();
  window.dispatchEvent(new CustomEvent('vivim:paired', { detail: { paired: false } }));
}
// Native media playback is an explicit user action. All bytes stay on the Host
// and flow through one grant-bound, HttpOnly-cookie ticket. No blob URLs, model
// outputs, browser storage, provider API or cloud fallback.
let playerActive = false;
let priorMediaFocus = null;
let playerOpen = null;
let playerEpoch = 0;
let deferredInstallPrompt = null;
// The browser, not VIVIM, decides whether installation is offered.
window.addEventListener('beforeinstallprompt', event => {
  if (HOST_PREVIEW) return;
  event.preventDefault();
  deferredInstallPrompt = event;
  S.sigs.ux = null;
  if (S.tab === 'me') renderSurfaces();
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  S.sigs.ux = null;
  if (S.tab === 'me') renderSurfaces();
});
async function requestPwaInstall() {
  if (!deferredInstallPrompt || HOST_PREVIEW) return;
  const prompt = deferredInstallPrompt;
  deferredInstallPrompt = null;
  S.sigs.ux = null;
  if (S.tab === 'me') renderSurfaces();
  try {
    await prompt.prompt(); // Browser-owned confirmation; not a Host action.
    const choice = await prompt.userChoice;
    if (choice?.outcome === 'dismissed') toast('You can install VIVIM later from your browser menu.');
  } catch {
    toast('Use your browser menu to add VIVIM to your home screen.');
  }
}
function stopMediaPlayer() {
  const wasOpeningOrPlaying = playerActive;
  playerEpoch++;
  playerOpen?.abort();
  playerOpen = null;
  playerActive = false;
  const current = transport.deviceHeaders?.();
  if (wasOpeningOrPlaying && !HOST_PREVIEW && S.paired && transport.direct && current) {
    // A one-way, owner-authorized cleanup of ephemeral media tickets; never
    // a replayable Host command, a provider call or a persisted effect.
    void fetch('/mobile/api/media/close', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { ...current, origin: location.origin, 'x-vivim-media': '1' }
    }).catch(() => {});
  }
  const sheet = $('media-player-sheet');
  const video = $('media-player-video');
  if (!sheet || !video) { priorMediaFocus = null; return; }
  video.pause();
  video.removeAttribute('src');
  video.load(); // abort outstanding native range requests
  sheet.hidden = true;
  playerActive = false;
  const restore = priorMediaFocus;
  priorMediaFocus = null;
  if (restore?.isConnected && typeof restore.focus === 'function') restore.focus();
}
function ensureMediaPlayer() {
  if ($('media-player-sheet')) return;
  const sheet = el('section', 'media-player-sheet');
  sheet.id = 'media-player-sheet';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Playing media from VIVIM Host');
  const header = el('div', 'media-player-head');
  const title = el('h2', '', 'Your media');
  title.id = 'media-player-title';
  const close = el('button', 'btn sm', 'Close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Stop playback and close');
  close.addEventListener('click', stopMediaPlayer);
  const video = document.createElement('video');
  video.id = 'media-player-video';
  video.controls = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('aria-label', 'Direct Host media player');
  const state = el('p', 'muted', '');
  state.id = 'media-player-state';
  state.setAttribute('role', 'status');
  video.addEventListener('error', () => {
    state.textContent = 'Playback could not continue. Reopen this item to request a fresh authorized stream.';
  });
  header.append(title, close);
  sheet.append(header, video, state);
  document.body.append(sheet);
}
async function openMediaPlayer(mediaId, title) {
  if (S.tab !== 'world' || HOST_PREVIEW || !S.paired || !transport.direct ||
      !/^[a-f0-9]{32}$/.test(mediaId || '')) return;
  const device = transport.deviceHeaders?.();
  if (!device || playerActive) return;
  playerActive = true;
  const epoch = ++playerEpoch;
  const controller = new AbortController();
  playerOpen = controller;
  try {
    const response = await fetch('/mobile/api/media/open', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      signal: controller.signal,
      headers: { ...device, origin: location.origin,
        'x-vivim-media': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ mediaId })
    });
    const payload = await response.json().catch(() => ({}));
    if (epoch !== playerEpoch || controller.signal.aborted) return;
    if (isInvalidDeviceSession(payload?.code)) {
      transport.setDeviceSession(null);
      clearPrivatePhoneState();
      showPairingState('error', 'Your PC session changed. Reconnect to continue streaming.');
      setConn('PC device authorization expired or revoked', true);
      return;
    }
    if (!S.paired || !transport.deviceHeaders?.() ||
        transport.deviceHeaders()['x-vivim-device-session'] !== device['x-vivim-device-session'])
      throw new Error('Device session changed while opening the stream');
    if (!response.ok || payload.schema !== 'vivim.media-playback-ticket/1' ||
        payload.url !== '/mobile/api/media/stream/' + mediaId)
      throw new Error(payload.code || 'Host did not authorize this playable file');
    priorMediaFocus = document.activeElement;
    ensureMediaPlayer();
    $('media-player-title').textContent = String(title || 'Your media').slice(0, 160);
    $('media-player-state').textContent = 'Streaming securely from your PC · Internet buffering is not retained offline.';
    $('media-player-sheet').hidden = false;
    $('media-player-sheet').querySelector('button')?.focus();
    $('media-player-video').src = payload.url;
    $('media-player-video').load();
    $('media-player-video').play().catch(() => {
      if (epoch === playerEpoch)
        $('media-player-state').textContent = 'Ready. Press Play to start streaming from your PC.';
    });
  } catch (cause) {
    if (epoch === playerEpoch && !controller.signal.aborted) {
      playerActive = false;
      toast('Playback unavailable: ' + String(cause?.message || 'Host denied stream').slice(0, 120));
    }
  } finally {
    if (playerOpen === controller) playerOpen = null;
  }
}

// Owner media metadata travels over a separate Direct-only, device-scoped read.
// It never uses the cloud relay, reveals local file paths, or starts playback.
let mediaGeneration = 0;
async function refreshMedia(force = false, offset = S.mediaOffset) {
  if (!S.paired || S.mediaLoading) return;
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) return;
  if (offset !== S.mediaOffset) { S.mediaOffset = offset; S.mediaAt = 0; }
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
  const generation = mediaGeneration;
  S.mediaLoading = true;
  S.media = { state: 'loading' };
  if (S.tab === 'world') renderSurfaces();
  try {
    const response = await fetch('/mobile/api/media/library?offset=' + offset, {
      credentials: 'same-origin', cache: 'no-store', headers
    });
    const result = await response.json();
    if (generation !== mediaGeneration || !S.paired ||
        transport.deviceHeaders?.()?.['x-vivim-device-session'] !==
          headers['x-vivim-device-session']) return;
    if (response.status === 401 || response.status === 403) {
      if (isInvalidDeviceSession(result?.reason)) {
        transport.setDeviceSession(null);
        clearPrivatePhoneState();
        showPairingState('error', 'This PC session is no longer authorized. Reconnect your phone.');
        setConn('PC device authorization expired or revoked', true);
        return;
      }
      S.media = { state: 'not-authorized' };
    } else if (!response.ok || result?.schema !== 'vivim.media-library-summary/1' ||
        result?.offset !== offset) {
      S.media = { state: 'unavailable', reason: result?.reason || 'MEDIA_READ_UNAVAILABLE' };
    } else {
      S.media = result;
    }
  } catch {
    if (generation === mediaGeneration) S.media = { state: 'unavailable', reason: 'PC_CONNECTION_UNAVAILABLE' };
  } finally {
    if (generation === mediaGeneration) {
      S.mediaAt = Date.now();
      S.mediaLoading = false;
      if (S.tab === 'world') renderSurfaces();
    }
  }
}
function openVivimDraft(text) {
  if (!transport.direct) { toast('Ask VIVIM controls need your Direct PC connection.'); return; }
  $('talk-target').value = 'vivim';
  if (N.target !== 'vivim') $('talk-target').dispatchEvent(new Event('change'));
  goTab('talk');
  $('text').value = String(text || '').slice(0, 1000);
  autogrow(); updateSend(); $('text').focus();
  // Only a filled composer: at most an inert interpretation read, never an AI send or approval.
}
function renderSurfaces() {
  const ctx = surfaceContext();
  let host = null, model = null;
  if (S.tab === 'wiki') { renderWiki(); return; }
  if (S.tab === 'today') { host = $('v-today'); model = todayModel(S.statusObj, S.cmds, ctx); }
  else if (S.tab === 'world') { host = $('v-world'); model = worldModel(S.statusObj, S.cmds, { media: S.media }); }
  else if (S.tab === 'me') { host = $('v-me'); model = meModel(S.statusObj, S.cmds, ctx); }
  else return;
  if (!host) return;
  const sig = S.tab + '|' + JSON.stringify(model);
  if (S.sigs.ux === sig) return;
  S.sigs.ux = sig;
  const options = { onNavigate: goTab,
    nextBatch: S.nextBatch,
    onExplore: () => capabilityLauncher?.open(),
    onCapture: !HOST_PREVIEW ? () => localNotes?.open() : undefined,
    onRecordVoice: !HOST_PREVIEW && localVoice?.available
      ? () => localVoice.open() : undefined,
    onCheckReadiness: () => {
      if (navigator.onLine === false) { toast('Offline. Check again when your PC is reachable.'); return; }
      if (HOST_PREVIEW) void refreshHostPreview();
      else void start(); // Rechecks pairing and source, never repeats a command.
    },
    onCopyReadiness: async () => {
      const report = safeReadinessReport(surfaceContext().readiness);
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(report);
        toast('Device-safe readiness report copied. No Host data included.');
      } catch { toast('Clipboard unavailable in this browser.'); }
    },
    onRefresh: () => HOST_PREVIEW ? refreshHostPreview() : refresh(),
    onAskVivim: transport.direct && !HOST_PREVIEW ? openVivimDraft : undefined,
    onRefreshMedia: HOST_PREVIEW ? () => { void refreshHostPreview(); }
      : S.paired && transport.direct ? () => { void refreshMedia(true); } : undefined,
    onPlayMedia: transport.direct && S.paired && !HOST_PREVIEW ? openMediaPlayer : undefined,
    onMediaPage: transport.direct && S.paired && !HOST_PREVIEW
      ? offset => { void refreshMedia(true, offset); } : undefined,
    onInstall: !HOST_PREVIEW && deferredInstallPrompt ? requestPwaInstall : undefined,
    onOpenPocket: () => { if (pocketButton && !pocketButton.hidden) pocketButton.click(); },
    onReplay: () => { if (welcome) welcome.open(); } };
  if (S.tab === 'today') renderToday(host, model, options);
  else if (S.tab === 'world') renderWorld(host, model, options);
  else renderMe(host, model, options);
}
function renderList() {
  if (!S.paired && !HOST_PREVIEW) {
    $('convlist').replaceChildren(el('p', 'muted pad',
      'Connect your PC to view private conversations.'));
    return;
  }
  const items = S.convs.filter(c => N.target !== 'harness' || combinedInbox ||
    c.provider === curConv()?.provider).sort((a, b) => b.updatedAt - a.updatedAt);
  const sig = S.active + '|' + N.target + '|' + combinedInbox + '|' +
    JSON.stringify(items.map(c => [c.id, c.title, c.updatedAt, c.provider, c.model]));
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
  $('dock-provider-refresh').hidden = N.target !== 'harness' ||
    HOST_PREVIEW || !transport.direct || !S.paired;
  $('dock-provider-refresh').disabled = providerRefreshBusy;
  if (N.target === 'vivim') {
    $('chips').hidden = true; $('modelwrap').hidden = true; $('effortwrap').hidden = true;
    $('clip').hidden = true; $('files').hidden = true;
    $('text').placeholder = 'Ask VIVIM: show status, or describe a change…';
    $('text').maxLength = 1000;
    $('composer-note').textContent = HOST_PREVIEW
      ? 'Local preview · pair with your PC to unlock live Host actions'
      : !S.paired ? 'Offline or unpaired · no sends or Host actions'
      : 'PC-authoritative · previews first · approval required for changes';
    updateSend(); return;
  }
  $('composer-note').textContent = N.target === 'phone'
    ? 'Continue an existing PC session · never automatically resent'
    : combinedInbox
      ? 'Combined inbox · one message goes to the selected signed-in AI, never all providers'
      : 'Provider inbox · send-once through your signed-in PC browser';
  if (N.target === 'phone') {
    $('chips').hidden = true; $('modelwrap').hidden = true; $('effortwrap').hidden = true;
    $('clip').hidden = true; $('files').hidden = true; $('text').placeholder = 'Message your PC…'; $('text').maxLength = MAXTEXT;
    updateSend(); return;
  }
  $('chips').hidden = false;
  normalizeConv();
  const c = curConv(), ps = providers(), p = c && ps.find(x => x.id === c.provider);
  const sig = JSON.stringify([ps, combinedInbox, c && [c.id, c.provider, c.model, c.effort],
    S.files.map(f => f.name + f.size)]);
  if (S.sigs.comp !== sig) {
    S.sigs.comp = sig;
    const chips = $('chips'); chips.replaceChildren();
    const combined = el('button','chip','Combined');
    combined.type='button';combined.dataset.combined='1';
    combined.setAttribute('aria-pressed',String(combinedInbox));
    combined.title='All conversations. Sends only to the selected provider.';
    chips.append(combined);
    for (const x of ps) { const b = el('button', 'chip', x.label || x.id); b.type = 'button';
      b.dataset.p = x.id;
      b.setAttribute('aria-pressed', String(!combinedInbox && !!c && x.id === c.provider));
      chips.append(b); }
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
  if (HOST_PREVIEW || !S.paired) { $('send').disabled = true; return; }
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
  if (!S.paired && !HOST_PREVIEW) {
    $('title').textContent = 'VIVIM offline';
    $('msgs').replaceChildren(el('div', 'empty',
      'Your conversations remain private until the PC reconnects.'));
    return;
  }
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
        // reply_observed means delivery is explicitly unconfirmed: acking it
        // would claim delivery the Host never verified. Only acknowledge
        // messages the Host marked delivered.
        if(m.status==='done'&&String(m.result||'').trim()&&
           state?.state==='delivered'&&state.replyDisplayVerified===true&&
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
        observed?.state==='delivered' && observed.replyDisplayVerified===true &&
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
    ['Host diagnostics', '/api/host/status'],
    ['Owner Wiki & source context', '/wiki']
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
    if(data.state==='source-backed')shellPresentation.observe(data.snapshot.bootstrap?.uiRevision??null);else shellPresentation.clear();
    S.manifest = data.snapshot.manifest ?? null;
    S.media = data.media?.schema === 'vivim.media-library-summary/1'
      ? data.media : { state: 'unavailable' };
    setConn(data.state === 'source-backed' ? 'Owner view · read only' : 'Source unavailable',
      data.state !== 'source-backed');
    renderAll(true);
    if (build) {build.setSurface(data.snapshot.bootstrap?.uiRevision ?? null);if(S.tab==='build')void refreshBuildBindings(data.snapshot);}
    renderHostPreviewActivity();
    if (S.tab === 'wiki') void refreshWiki();
  } catch (error) {
    if (sequence !== previewReadSequence) return;
    // Never keep a private stale snapshot visible after session expiry.
    S.statusObj = null;
    shellPresentation.clear();
    clearWiki('Owner session expired or Host unavailable');
    S.manifest = null;
    S.media = { state: 'unavailable' };
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
  S.tab = 'talk'; N.target = 'vivim'; N.pending = null; saveNativePending();
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
  if (!S.paired) {
    $('msgs').replaceChildren(el('div', 'empty', 'Connect to your PC to read its sessions.'));
    return;
  }
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
  if (!transport.direct || N.target !== 'phone' || !S.paired) return;
  const generation = N.generation;
  try {
    const result = await api('sessions');
    if (!S.paired || N.target !== 'phone' || N.generation !== generation) return;
    N.sessions = Array.isArray(result?.sessions) ? result.sessions.filter(s => typeof s.id === 'string') : [];
    $('native-session').replaceChildren(new Option('Choose an existing session', ''), ...N.sessions.map(s => new Option(s.title || s.id, s.id)));
    $('native-session').value = N.session;
    N.note = N.sessions.length ? 'Choose an existing session.' : 'No existing sessions found.';
  } catch (e) {
    if (!S.paired || N.generation !== generation) return;
    N.note = 'Could not load PC sessions: ' + e.message;
  }
  if (S.paired && N.target === 'phone' && N.generation === generation) renderNative();
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
  if (!transport.direct || !S.paired || !session || !text || N.sending || N.pending) return;
  const item = { id: 'msg_' + hex16() + hex16(), text, session, accepted: false };
  N.pending = item; saveNativePending(); N.sending = true; N.note = 'Sending…'; renderNative(); updateSend();
  try {
    const result = await api('sessions/' + encodeURIComponent(session) + '/prompt', { method: 'POST', body: JSON.stringify({ id: item.id, text }) });
    if (!S.paired || N.pending !== item) return;
    if (result?.accepted !== true || result.id !== item.id || result.sessionId !== session) throw Object.assign(new Error('Unexpected acknowledgment'), { uncertain: true });
    item.accepted = true; saveNativePending();
    if ($('text').value.trim() === text) { $('text').value = ''; autogrow(); }
    N.note = 'Queued · waiting for your PC.';
  } catch (e) {
    if (!S.paired || N.pending !== item) return;
    N.note = 'Send uncertain · check this session; not resent. ID: ' + item.id;
  }
  N.sending = false; updateSend(); if (N.target === 'phone') { renderNative(); nativeRefresh(); }
}

/* ---------- send ---------- */
async function send() {
  dockAssist?.reset();
  if (!S.paired && !HOST_PREVIEW) {
    toast('This phone is offline or unpaired. No message was sent.');
    return;
  }
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
function schedule() {
  clearTimeout(S.timer);
  // A mounted Wiki must observe Host edits without a tab switch or second writer.
  // Reuse S.timer even in native-phone mode, where ordinary chat polling is idle.
  if (S.tab === 'wiki' && document.hidden) return;
  if (S.tab === 'wiki' && (HOST_PREVIEW || (S.paired && N.target === 'phone'))) {
    S.timer = setTimeout(() => {
      if (S.tab === 'wiki' && !document.hidden) void refreshWiki();
      schedule();
    }, 8000);
    return;
  }
  if (!S.paired || N.target === 'phone') return;
  S.timer = setTimeout(refresh, pending(S.active) ? 2500 : 8000);
}
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
    else if(needStatus)shellPresentation.clear();
    mergeServerConvs(); ensureActive();
    setConn(transport.direct ? 'Connected to PC' : 'Paired · relay online');
    renderAll();
  } catch (e) {
    // Status authority is unavailable: do not leave a previously private Build
    // revision visible or clickable after a grant loss/disconnect.
    shellPresentation.clear();
    if (build) { build.clear(); buildKey = ''; }
    if (e.status === 401) {
      S.busy = false;
      if (transport.direct) clearPrivatePhoneState();
      return start();
    }
    setConn('Relay error: ' + e.message, true); ensureActive(); renderAll();
  }
  S.busy = false;
  if (S.tab === 'wiki' && S.paired) void refreshWiki();
  schedule();
}

/* ---------- Build tab: committed surface plus poll-driven repaint ---------- */
function refreshBuildInspector(rows){
  const bar=$('build-inspector'),select=$('build-inspect-select');if(!bar||!select)return;
  select.replaceChildren();const empty=el('option',null,'Choose a component');empty.value='';select.append(empty);
  for(const row of rows){const option=el('option',null,row.instanceId+' · '+row.type);option.value=row.instanceId;select.append(option);}
  bar.hidden=!rows.length;
  if(!rows.length)$('build-inspect-toggle').setAttribute('aria-pressed','false');
}
function updateBuildSelection(row){
  const select=$('build-inspect-select'),status=$('build-inspect-status'),configure=$('build-inspect-configure');
  if(!select||!status||!configure)return;
  select.value=row?.instanceId??'';
  status.textContent=row?'Selected '+row.instanceId+' · revision '+row.revision+' · nothing changed.':'Select a component to inspect its committed identity.';
  configure.disabled=!row||HOST_PREVIEW||!launcherContext().visualDraftAllowed;
}
function mountBuild() {
  if (build) return;
  const host = $('build-surface'); if (!host) return;
  try { build = mountBuildSurface(host, {
    readOnly: HOST_PREVIEW,
    onInstances:refreshBuildInspector,onSelection:updateBuildSelection,
    onCommit: () => { buildKey = ''; scheduleBuild(0); }
  }); }
  catch (e) { setConn('Build surface unavailable: ' + e.message, true); }
  if(build){
    const toggle=$('build-inspect-toggle'),select=$('build-inspect-select'),configure=$('build-inspect-configure');
    toggle.addEventListener('click',()=>{const enabled=build.setInspecting(toggle.getAttribute('aria-pressed')!=='true');toggle.setAttribute('aria-pressed',String(enabled));});
    select.addEventListener('change',()=>{const surface=build.surface();if(surface&&select.value)build.selectInstance(select.value,surface.revision,'glyph');});
    configure.addEventListener('click',()=>{const row=build.selectedInstance();if(!row||!launcherContext().visualDraftAllowed)return;capabilityLauncher?.open({mode:1,query:row.instanceId});});
  }
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
    host, request: api, navigate: goTab,
    interpretControl: transport.direct ? text => vivimChat.interpret(text) : null,
    assistControl: transport.direct ? text=>vivimChat.assist(text) : null,
    assistScope: ()=>S.tab==='build'?composerScope():null,
    getUiDraftCandidates:()=>{const s=build?.surface()??build?.draftSurface();return [...templateDraftCandidates(s),...themeDraftCandidates(s)];},
    openControlDraft: transport.direct ? openVivimDraft : null,
    openPocket: pocketButton && !pocketButton.hidden ? () => pocketButton.click() : null,
    openProviderDraft: text => {
      goTab('talk'); switchChatTarget('harness');
      $('text').value=text;autogrow();updateSend();$('text').focus();
    },
    getSurface: () => build?.surface() ?? build?.draftSurface() ?? null,
    getProvider: () => S.statusObj?.snapshot?.onboarding?.primary || 'chatgpt',
    send: async (prompt, provider) => {
      const conversationId = 'c-' + hex16();
      S.hidden.add(conversationId); lsSet('relay.hidden.v1', [...S.hidden].slice(-200));
      const created = await api('commands', { method: 'POST', body: JSON.stringify({ text: prompt, kind: 'command', consumer: 'harness', mode: 'relay-chat', conversationId, newChat: true, target: { provider, model: null, effort: null } }) });
      if (!created?.id) throw new Error('not acknowledged');
      return created.id;
    },
    prepareVisual: transport.direct ? proposal=>createControlClient({transport}).call('plan',{visualProposal:proposal}) : null,
    apply: plan=>createControlClient({transport}).execute(plan),
    onApplied: async (proof) => { S.nextBatch = NEXT_BATCH; buildKey = ''; await refresh(); scheduleBuild(0); renderSurfaces(); }
  });
}
// The welcome tour stays; the old "Start Here" page is replaced by the Today surface.
welcome = mountWelcome({ host: $('welcome') });

// Local-only tools share this one PWA UI; neither bypasses Host authority.
if (!HOST_PREVIEW) {
  const canCapture=()=>!HOST_PREVIEW&&S.paired&&transport.direct&&navigator.onLine!==false&&!!transport.deviceHeaders?.()&&S.device.scopes?.includes('control:execute')===true&&!vivimChat.busy();
  try { localNotes = mountLocalNotes({host:document.body,storage:window.localStorage,canCapture,onCapture:capture=>{
    if(!canCapture())return false;
    goTab('talk');if(N.target!=='vivim'){$('talk-target').value='vivim';$('talk-target').dispatchEvent(new Event('change'));}
    void vivimChat.previewCapture(capture);return true;
  }}); }
  catch { /* Browser storage may be blocked; Today still works without notes. */ }
  try { localVoice = mountVoiceCapture({host:document.body,onReviewedText:text=>localNotes?.draft(text)??false}); }
  catch { /* No recording permission is requested until the owner taps Start. */ }
}
$('dock-mic').hidden = HOST_PREVIEW || !(localVoice?.available || (pocketButton&&!pocketButton.hidden));
$('dock-mic').addEventListener('click',()=>{
  if(pocketButton&&!pocketButton.hidden)pocketButton.click();
  else localVoice?.open();
});
function launcherContext() {
  return {mode:HOST_PREVIEW?'desktop-preview':transport.direct?'direct':'cloud',
    paired:S.paired&&(!transport.direct||!!transport.deviceHeaders?.()),
    online:navigator.onLine!==false,
    mediaVisible:transport.direct&&S.paired&&!!transport.deviceHeaders?.(),
    controlRead:!!transport.deviceHeaders?.()&&
      Array.isArray(S.device.scopes)&&S.device.scopes.includes('control:read'),
    liveInstances:[...inspectShell(document,S.tab),
      ...(S.tab==='build'&&S.paired&&S.statusObj&&navigator.onLine!==false?build?.listInstances?.()??[]:[])],
    visualDraftAllowed:!HOST_PREVIEW&&!!composerScope()&&S.device.scopes?.includes('control:execute')===true,
    visualRevision:(build?.surface()??build?.draftSurface()??buildSurfaceFromBootstrap(S.statusObj?.snapshot?.bootstrap))?.revision,
    visualTheme:build?.surface()?.theme??build?.draftSurface()?.theme??buildSurfaceFromBootstrap(S.statusObj?.snapshot?.bootstrap)?.theme,
    installOffered:!!deferredInstallPrompt,
    installed:!!window.matchMedia?.('(display-mode: standalone)')?.matches ||
      navigator.standalone===true};
}
function launcherActivate(item) {
  if (item.id === 'notes') { localNotes?.open(); return; }
  if (item.id === 'theme') { $('theme-toggle').click(); return; }
  if (item.id === 'tour') { welcome?.open(); return; }
  goTab(item.tab);
  const target = item.id === 'ai' ? 'harness'
    : item.id === 'sessions' ? 'phone'
    : item.id === 'talk' ? 'vivim' : null;
  if (target && N.target !== target) {
    $('talk-target').value = target;
    $('talk-target').dispatchEvent(new Event('change'));
  }
}
capabilityLauncher = mountCapabilityLauncher({
  host:document.body,context:launcherContext,onActivate:launcherActivate,
  onInspect:row=>row.scope==='shell'?selectShell(document,S.tab,row):S.tab==='build'&&S.paired&&!!S.statusObj&&!!build?.selectInstance?.(row.instanceId,row.revision),
  onDraft:text=>{
    if(!launcherContext().visualDraftAllowed)return false;
    goTab('build');
    if(!compose?.setDraft(text)){toast('Finish the current Build request first.');return false;}
    return true;
  }
});
function scheduleBuild(delay = 6000) {
  if (!build || !S.paired || S.tab !== 'build' || buildTimer) return;
  buildTimer = setTimeout(pollBuild, delay);
}
// Only while the committed Build view is open, under the same existing read grant.
async function refreshBuildBindings(snapshot){
 const surface=build?.surface();if(S.tab!=='build'||!surface||!hasWorkspaceBinding(surface))return;
 const seq=++buildBindingSequence,revision=surface.revision;
 const headers=HOST_PREVIEW?{}:transport.deviceHeaders?.();
 const authorized=()=>HOST_PREVIEW?!!S.statusObj:transport.direct&&S.paired&&navigator.onLine!==false&&
   !!headers&&!!transport.deviceHeaders?.()&&transport.deviceHeaders?.()?.['x-vivim-device-session']===headers['x-vivim-device-session']&&
   transport.deviceHeaders?.()?.['x-vivim-grant-id']===headers['x-vivim-grant-id'];
 if(!authorized()){build.setLiveData(null,revision);return;}
 const outcomes=HOST_PREVIEW?snapshot?.studioOutcomes:
   snapshot?.live?.state==='source-backed'?snapshot.live.studioOutcomes:null;
 let wiki=null;
 if(HOST_PREVIEW||S.device.scopes?.includes('control:read')){
   try{
     const response=await fetch(HOST_PREVIEW?'/api/host/control/wiki-view':'/mobile/api/wiki',
       {credentials:'same-origin',cache:'no-store',headers,signal:AbortSignal.timeout(4000)});
     if(response.ok)wiki=await response.json();
     else if(response.status===401||response.status===403){
       if(seq===buildBindingSequence)build.setLiveData(null,revision);
       return;
     }
   }catch{/* source unavailable; do not retain old task values */}
 }
 if(seq!==buildBindingSequence||S.tab!=='build'||build?.surface()?.revision!==revision||
    build?.surface()?.surfaceId!==surface.surfaceId)return;
 if(!authorized()){build.setLiveData(null,revision);return;}
 if(!HOST_PREVIEW&&!S.device.scopes?.includes('control:read'))wiki=null;
 build.setLiveData(workspaceBindingData({wiki,outcomes}),revision);
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
    const observed = build.setSurface(rev, st?.snapshot?.bootstrap);
    shellPresentation.observe(rev??null);
    buildKey = observed?.state === 'ready' ? String(rev.surfaceId) + ':' + String(rev.revision) : '';
    if(observed?.state==='ready')void refreshBuildBindings(st?.snapshot);
  } catch (e) {
    if (build) build.clear();
    shellPresentation.clear();
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
function showOfflineShell() {
  // Offline can only render public app modules and empty/local navigation.
  // A cached former owner session is not proof of ongoing authorization.
  clearPrivatePhoneState();
  $('pairbox').hidden = true; $('app').hidden = false;
  document.body.classList.add('offline-shell');
  S.tab = 'talk'; N.target = transport.direct ? 'vivim' : 'harness';
  $('talk-target').value = N.target;
  S.device = { status: 'offline', scopes: [] };
  setConn('Offline · local PWA shell only', true);
  renderAll(true);
}
window.addEventListener('offline', () => { shellPresentation.clear();if (!HOST_PREVIEW) showOfflineShell(); });
window.addEventListener('vivim:bootstrap-status',e=>{if(!HOST_PREVIEW&&S.paired&&navigator.onLine!==false&&transport.direct&&transport.deviceHeaders?.())shellPresentation.observe(e.detail?.snapshot?.bootstrap?.uiRevision??null);else if(!HOST_PREVIEW)shellPresentation.clear();});
window.addEventListener('online', () => { if (!HOST_PREVIEW) void start(); });
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
  if (!HOST_PREVIEW && navigator.onLine === false) {
    showOfflineShell(); return;
  }
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
        clearPrivatePhoneState();
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
      clearPrivatePhoneState();
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
  let paired; try { ({ paired } = await api('session')); } catch (e) {
    clearPrivatePhoneState(); setConn(e.message, true); return;
  }
  $('pairbox').hidden = paired; $('app').hidden = !paired;
  document.body.classList.toggle('paired', paired);
  if (paired) document.body.classList.remove('offline-shell');
  setConn(paired ? 'Paired' : 'Not paired', !paired);
  if (!paired) clearPrivatePhoneState();
  S.paired = paired; clearTimeout(S.timer); S.busy = false;
  window.dispatchEvent(new CustomEvent('vivim:paired', { detail: { paired } }));
  if (paired) { renderAll(true); refresh(); }
}
$('pair-check').onclick = () => { if (transport.direct) void start(); };
$('pairbtn').onclick = async () => { try { localStorage.removeItem('vivim.bootstrap.projection.v1'); } catch {} window.dispatchEvent(new Event('vivim:clear-bootstrap-cache')); try { await pair($('secret').value.trim()); $('secret').value = ''; start(); } catch (e) { setConn('Pairing failed', true); } };

/* ---------- events ---------- */
$('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; goTab(b.dataset.tab); });
$('tabs').addEventListener('keydown', event => {
  const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const all = Array.from($('tabs').querySelectorAll('[role="tab"]'));
  const active = all.indexOf(document.activeElement);
  if (active < 0 || !all.length) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? all.length - 1
    : event.key === 'ArrowRight' ? (active + 1) % all.length
    : (active - 1 + all.length) % all.length;
  goTab(all[next].dataset.tab);
  all[next].focus();
});
$('talk-target').value = N.target;
$('talk-target').addEventListener('change', () => {
  dockAssist?.reset();
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
  updateDock();
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
  if(e.target.closest('[data-combined]')){
    combinedInbox=true;S.sigs.comp=null;S.sigs.list=null;renderAll();return;
  }
  const b=e.target.closest('[data-p]'),c=curConv();
  if(!b||!c)return;
  const changed=c.provider!==b.dataset.p;
  combinedInbox=false;
  if(changed){c.provider=b.dataset.p;c.model=c.effort=null;saveConvs();}
  S.sigs.comp=null;S.sigs.list=null;renderAll();
});
$('model').addEventListener('change', e => { const c = curConv(); if (c) { c.model = e.target.value || null; saveConvs(); renderAll(); } });
$('effort').addEventListener('change', e => { const c = curConv(); if (c) { c.effort = e.target.value || null; saveConvs(); renderAll(); } });
$('clip').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', e => { for (const f of e.target.files) if (S.files.length < 10) S.files.push(f); e.target.value = ''; renderComposer(); });
$('files').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { S.files.splice(+b.dataset.i, 1); renderComposer(); } });
dockAssist=mountComposerAssist({
  field:$('text'),host:$('composer-assist'),
  interpret:text=>vivimChat.assist(text),
  getScope:()=>N.target==='vivim'?composerScope():null,
  compileUi:classifyDraftUi,getUiDraftCandidates:()=>themeDraftCandidates(build?.surface()??build?.draftSurface()??buildSurfaceFromBootstrap(S.statusObj?.snapshot?.bootstrap)),onDraft:()=>{autogrow();updateSend();}
});
$('text').addEventListener('input', () => { autogrow(); updateSend(); });
$('text').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer:fine)').matches) {
    e.preventDefault();if(S.tab!=='talk')goTab('talk');void send();
  }
});
$('dock-provider-refresh').addEventListener('click', async () => {
  if(providerRefreshBusy||HOST_PREVIEW||!transport.direct||!S.paired)return;
  const headers=transport.deviceHeaders?.();
  if(!headers){toast('Approve this phone on your PC first.');return}
  providerRefreshBusy=true;$('dock-provider-refresh').disabled=true;
  $('dock-provider-refresh').textContent='Checking browser accounts…';
  try{
    const response=await fetch('/mobile/api/chat/providers/refresh',{
      method:'POST',cache:'no-store',credentials:'same-origin',
      headers:{...headers,origin:location.origin,'x-vivim-providers':'1'}
    });
    const result=await response.json();
    if(!S.paired||transport.deviceHeaders?.()?.['x-vivim-device-session']!==
      headers['x-vivim-device-session'])return;
    if((response.status===401||response.status===403)&&
       isInvalidDeviceSession(result?.reason||result?.code)){
      transport.setDeviceSession(null);clearPrivatePhoneState();
      showPairingState('error','PC session expired. Reconnect to check your AIs.');
      return;
    }
    if(!response.ok||result.schema!=='vivim.chat-provider-projection/1'){
      toast('Signed-in AI checks unavailable. Nothing was sent.');return;
    }
    S.manifest=result;S.sigs.comp=null;renderAll(true);
    const count=result.providers.filter(p=>p.signedIn===true).length;
    toast(count?count+' signed-in AIs verified by your PC.':'No AI login verified. Check your PC browser.');
  }catch{toast('Provider check unavailable. Nothing was sent.')}
  finally{
    providerRefreshBusy=false;
    $('dock-provider-refresh').disabled=false;
    $('dock-provider-refresh').textContent='Check my signed-in AIs';
  }
});
$('send').addEventListener('click', () => {
  if(S.tab!=='talk')goTab('talk');
  void send();
});
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
document.addEventListener('keydown', e => {
  const typing = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName) ||
    document.activeElement?.isContentEditable === true;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !$('app').hidden) {
    e.preventDefault(); capabilityLauncher?.open(); return;
  }
  if (e.key === '/' && !typing && !e.altKey && !e.ctrlKey && !e.metaKey &&
      !$('app').hidden && !capabilityLauncher?.isOpen()) {
    e.preventDefault(); capabilityLauncher?.open(); return;
  }
  if (e.key === 'Escape') { if (capabilityLauncher?.isOpen()) { capabilityLauncher.close(); return; } }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') {
  if(!$('chat-context-panel').hidden){closeFocusPanel();return}
  if (playerActive) stopMediaPlayer(); closeDebug(); closeDrawer(); if (HOST_PREVIEW) { $('host-preview-menu').hidden = true; $('gear').setAttribute('aria-expanded', 'false'); } } });
$('dbgsend').addEventListener('click', async () => {
  const text = $('dbgtext').value.trim(); if (!text) return;
  try { await api('commands', { method: 'POST', body: JSON.stringify({ text, kind: $('kind').value, consumer: $('consumer').value }) }); $('dbgtext').value = ''; refresh(); }
  catch (e) { toast('Send failed: ' + e.message); }
});
document.addEventListener('visibilitychange', () => {
  if(document.hidden){dockAssist?.reset();compose?.resetAssist?.();}
  if (document.hidden && S.tab === 'wiki') { clearTimeout(S.timer); return; }
  if (!document.hidden) {
    if (HOST_PREVIEW) void refreshHostPreview();
    else if (N.target === 'phone') nativeRefresh();
    else refresh();
    if (S.tab === 'wiki') { void refreshWiki(); schedule(); }
  }
});
// An approved Wiki edit from the shared Talk composer updates the mounted Wiki
// without a tab switch, mutation retry, or private state in a second store.
document.addEventListener('vivim:wiki-committed', () => {
  dockAssist?.reset();compose?.resetAssist?.();
  if (S.tab === 'wiki') void refreshWiki();
});
window.addEventListener('vivim:bootstrap-refresh', () => { S.statusAt = 0; if (S.paired) refresh(); });

if (!HOST_PREVIEW && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(transport.direct ? '/mobile/sw.js' : '/sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    S.sigs.ux = null;
    if (S.tab === 'me') renderSurfaces();
  });
}
mountUniversalDock();
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
