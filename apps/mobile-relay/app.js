// grokbot-authored. Relay PWA shell: same-origin only, no secrets stored in JS-readable storage.
import { transport } from './transport.mjs';
import { resolveProviderHandoff, canSendVerifiedProvider, listProviderConnections, canRetargetProviderDraft } from './provider-handoff.mjs';
import { mountBuildSurface } from './generative-ui/phone-surface.mjs';
import { sha256Hex } from './generative-ui/portable-digest.mjs';
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
import { initializeRustUiEngine, rustUiEngineStatus as coreUiStatus, rustFirstContact } from './vec-engines/rust-wasm.mjs';
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
// @hq:consumes vivim.rust-wiki-source-delta@1
// @hq:consumes vivim.rust-control-receipt-presentation@1
// The browser keeps its current Wiki UI; Rust supplies optional source identity
// from the same local WASM kernel used for VEC and other pure operations.
let rustWikiSourceStamp=null,rustWikiSearch=null,rustWikiSourceTransition=null,rustWikiSourceDelta=null,rustControlReceiptPreview=null,rustUiEngineStatus=null;
let wikiSourceFence=null; // Rust-stamped source high-water mark, never a grant
let wikiReadScope=null; // session+grant digest, valid even when optional WASM is unavailable
let buildWikiSourceScope=null,buildWikiSourceFence=null; // read-only VEC watermark, scoped to grant/surface digest
if(typeof window!=='undefined'){
  void import('./vec-engines/rust-wasm.mjs')
    .then(module=>{
      rustWikiSourceStamp=module.rustWikiSourceStamp;
      rustUiEngineStatus=module.rustUiEngineStatus;
      rustWikiSearch=module.rustWikiSearch;
      rustWikiSourceTransition=module.rustWikiSourceTransition;
      rustWikiSourceDelta=module.rustWikiSourceDelta;
      rustControlReceiptPreview=module.rustControlReceiptPreview;
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
// Single customer-facing VIVIM surface: the existing text-box-first Wiki composer.
// All Direct Host PWA entry points use it by default (desktop and phone).
// Internal loopback Host preview is explicitly read-only and never a user product UI.
// Preserve the existing Host permissions, pairing, approvals and shared composer.
const FIRST_CONTACT = transport.direct && !HOST_PREVIEW;
if (FIRST_CONTACT) document.body.classList.add('first-contact');
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
const FALLBACK = [['chatgpt', 'ChatGPT'], ['claude', 'Claude'], ['gemini', 'Gemini'], ['qwen', 'Qwen'], ['zai', 'Z.ai'], ['deepseek', 'DeepSeek']]
  .map(([id, label]) => ({ id, label, signedIn: false, models: [], thinkingLevels: [], newChat: true, attachments: false }));
const S = {
  tab: 'talk', manifest: null, convs: lsGet('relay.convs.v1', []), active: lsGet('relay.active.v1', null),
  hidden: new Set(lsGet('relay.hidden.v1', [])), cmds: [], files: [], sending: false, paired: false,
  statusAt: 0, statusObj: null, timer: 0, busy: false, sigs: {}, shownConv: null,
  conn: { label: '', tone: 'ok' }, device: { status: null, scopes: null },
  media: { state: 'idle' }, mediaAt: 0, mediaOffset: 0, mediaLoading: false, nextBatch: null,
  wiki: null, wikiStamp: null, wikiError: 'Wiki not loaded', wikiContext: null, wikiContextError: '',
  delivery: null
};
let buildBindingSequence=0,buildPollSequence=0;
let phoneRefreshEpoch=0,activePhoneSourceScope=null; // authenticated read generation + hashed grant identity
let combinedInbox = true; // UI-only inbox aggregation; never fan-out or a provider target.
let providerRefreshBusy = false;
const N = { target: transport.direct ? 'vivim' : 'harness', session: '', sessions: [], messages: [], timer: 0, generation: 0, sending: false, note: '', pending: null };
// The dock rail states one fact: whether a previewed plan is still waiting.
// It is derived from the chat, never a second source of approval.
let chatHasApproval = false;
const vivimChat = createControlChat({
  host: $('msgs'), transport,
  getSurface: () => S.tab,
  receiptPresentation:(plan,receipt)=>rustControlReceiptPreview?.(plan,receipt),
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
  // Invalidate phone-side 2-TAB suggestions when authorized live data changes
  // without a design revision change. Include source revisions only, never
  // Wiki text, source digests, private pages or an effect credential.
  const sourceVersions=(build?.bindingRevisions?.()??[])
    .map(row=>row.id+'@'+row.revision).join(',');
  return [session,headers['x-vivim-grant-id'],S.tab,revision,
    S.wiki?.revision??0,sourceVersions].join(':');
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
  // Minimal first-contact surface expands to the ORIGINAL provider controls only
  // after an explicit verified handoff. No second composer or transport.
  document.body.classList.toggle('first-contact-provider',
    FIRST_CONTACT && S.paired && N.target === 'harness');
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
  if(current.delivery) activity.append(focusPreview('Live build · '+current.delivery.sourceSha,
    current.delivery.verified ? 'PWA module bytes verified here · Host '+(current.delivery.hostSourceSha||'unknown')+' not upgraded' :
      'PWA module not verified · no Host acceptance claimed'));
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
  if(HOST_PREVIEW||!transport.direct||!S.paired||!device||
      !device['x-vivim-device-session']||!device['x-vivim-grant-id']){
    // Gated read: say so in the UI instead of silently repainting the panel.
    chatContext={state:'unavailable',reason:'Verified Host context needs a paired phone on a Direct PC connection.'};
    toast('Read verified context: pair this phone over Direct to load Host context.');
    renderFocusPanel();return;
  }
  const epoch=++chatContextEpoch;
  const sameGrant=()=>epoch===chatContextEpoch&&S.paired&&
    transport.deviceHeaders?.()?.['x-vivim-device-session']===device['x-vivim-device-session']&&
    transport.deviceHeaders?.()?.['x-vivim-grant-id']===device['x-vivim-grant-id'];
  chatContext={state:'loading'};renderFocusPanel();
  try{
    const response=await fetch('/mobile/api/chat/context?focus='+encodeURIComponent(focus),{
      method:'GET',credentials:'same-origin',cache:'no-store',headers:device
    });
    const data=await response.json();
    // A stale denial under a previous grant may not revoke a newly resumed one.
    if(!sameGrant())return;
    if((response.status===401||response.status===403)&&
       isInvalidDeviceSession(data?.reason||data?.code)){
      transport.setDeviceSession(null);
      clearPrivatePhoneState();
      showPairingState('error','Your PC has revoked this session. Reconnect your phone.');
      setConn('PC device authorization expired or revoked',true);
      return;
    }
    if(!sameGrant())return;
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
    if(sameGrant())chatContext={state:'unavailable',reason:'Host or native Rust context unavailable'};
  }
  if(sameGrant())renderFocusPanel();
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
  // A chosen provider is an immutable conversation destination, even if it
  // later signs out or its browser readiness check expires. Never retarget it.
  const p = ps.find(x => x.id === c.provider);
  if (!p) return;
  let dirty = false;
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


let deliveryReadEpoch = 0;
// Only same-origin allowlisted shell files are fetched. A manifest stamp is not
// independent proof: the phone hashes the actual served module before marking it verified.
async function readDeliveryStamp() {
  const epoch = ++deliveryReadEpoch;
  let delivery = null;
  try {
    const response = await fetch('manifest.webmanifest', {
      credentials: 'same-origin', cache: 'no-store'
    });
    if (!response.ok) throw Error('BUILD_MANIFEST_UNAVAILABLE');
    const stamp = (await response.json())?.vivim_delivery;
    if (stamp?.schema === 'vivim.delivery-stamp/1' &&
      /^[a-f0-9]{40}$/.test(stamp.sourceSha) &&
      /^[a-f0-9]{40}$/.test(stamp.hostSourceSha) &&
      /^[a-f0-9]{64}$/.test(stamp.moduleSha256) &&
      stamp.module === 'provider-handoff.mjs') {
      const served = await fetch('provider-handoff.mjs', {
        credentials: 'same-origin', cache: 'no-store'
      });
      let verified = false;
      if (served.ok && window.isSecureContext && window.crypto?.subtle) {
        const bytes = await served.arrayBuffer();
        const digest = await window.crypto.subtle.digest('SHA-256', bytes);
        const actual = Array.from(new Uint8Array(digest), b =>
          b.toString(16).padStart(2, '0')).join('');
        verified = actual === stamp.moduleSha256;
      }
      delivery = { schema: stamp.schema, sourceSha: stamp.sourceSha,
        hostSourceSha: stamp.hostSourceSha, module: stamp.module,
        moduleSha256: stamp.moduleSha256, observedAt: stamp.observedAt,
        verified };
    }
  } catch { /* Missing or corrupt deployment metadata never becomes a success. */ }
  if (epoch !== deliveryReadEpoch) return;
  S.delivery = delivery;
  S.sigs.ux = null;
  if (S.tab === 'today') renderSurfaces();
  if (S.tab === 'talk') renderFocusPanel();
}

/* ---------- Today · World · Me ---------- */
// Read-only views over what the Host returned. They never send, approve or claim an effect;
// their only controls navigate to another surface or re-read the Host.
function surfaceContext() {
  return {
    paired: S.paired === true,
    delivery: S.delivery,
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
  if (tab === 'today') void readDeliveryStamp();
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
  S.wiki = null; S.wikiStamp=null; S.wikiDelta=null; S.wikiError = reason;
  S.wikiContext = null; S.wikiContextError = reason;
  if (S.tab === 'wiki') renderWiki();
}
// Exact JS fallback for the existing Rust Wiki page digest. Both use sorted
// JSON object keys, preserving array order. This is a bounded source identity,
// never an approval, UI mutation or substitute for a device grant.
function wikiSourceStampFallback(wiki) {
  // Serde JSON keys are UTF-8 sorted; JS's default UTF-16 sorting differs
  // for supplementary-plane characters (including emoji page names).
  const sourceKeyOrder = (left, right) => {
    const a=[...left],b=[...right];
    for(let i=0;i<Math.min(a.length,b.length);i++){
      const delta=a[i].codePointAt(0)-b[i].codePointAt(0);
      if(delta)return delta;
    }
    return a.length-b.length;
  };
  // Do not materialize an intermediate JS object: JSON.stringify reorders
  // integer-shaped object keys, unlike Rust serde_json's ordered map. Serialize
  // each parsed JSON node directly in UTF-8 lexical key order instead.
  const canonicalJson = (value, depth = 0) => {
    if (depth > 24) throw new Error('Wiki source nesting exceeds digest limit');
    if (Array.isArray(value))
      return '[' + value.map(row => canonicalJson(row, depth + 1)).join(',') + ']';
    if (value && typeof value === 'object')
      return '{' + Object.keys(value).sort(sourceKeyOrder)
        .map(key => JSON.stringify(key) + ':' + canonicalJson(value[key], depth + 1)).join(',') + '}';
    const encoded = JSON.stringify(value);
    if (typeof encoded !== 'string') throw new Error('Invalid Wiki source scalar');
    return encoded;
  };
  return {revision:wiki.revision, pagesTotal:Object.keys(wiki.pages).length,
    digest:sha256Hex(canonicalJson(wiki.pages))};
}
// The same bounded source shape applies to the mounted Wiki and TierFlow
// live bindings. This admits Host observations only, not proposed writes.
function validWikiSourceShape(wiki) {
  if(!wiki||!Number.isSafeInteger(wiki.revision)||wiki.revision<0||
      !wiki.pages||typeof wiki.pages!=='object'||Array.isArray(wiki.pages))
    return false;
  const nameOK=name=>typeof name==='string'&&name.length>0&&
    [...name].length<=160&&!/[\u0000-\u001f\u007f-\u009f]/.test(name);
  return Object.entries(wiki.pages).every(([pageName,page])=>
    nameOK(pageName)&&page&&typeof page==='object'&&!Array.isArray(page)&&
    page.sections&&typeof page.sections==='object'&&!Array.isArray(page.sections)&&
    Object.entries(page.sections).every(([section,body])=>nameOK(section)&&typeof body==='string')&&
    (page.links===undefined||Array.isArray(page.links)&&page.links.every(nameOK)));
}
// One inert admission rule for mounted Wiki and TierFlow Build bindings.
// The optional native verifier takes precedence over proven portable fallback.
function verifyWikiSourceStamp(wiki,previous=null) {
  if(!validWikiSourceShape(wiki))
    return {state:'blocked',reason:'Invalid Host Wiki projection'};
  try {
    const portable=wikiSourceStampFallback(wiki);
    const native=rustWikiSourceStamp?.(wiki);
    if(!native&&rustUiEngineStatus?.()?.fallback==='none')
      return {state:'blocked',reason:'Native Wiki source verification unavailable'};
    if(native&&(native.revision!==portable.revision||
        native.pagesTotal!==portable.pagesTotal||native.digest!==portable.digest))
      return {state:'blocked',reason:'Native and portable Wiki source identities disagree'};
    if(previous?.native&&!native)
      return {state:'blocked',reason:'Previously native-verified Wiki source is unavailable'};
    const stamp=native??portable,old=previous?.stamp;
    if(old&&(stamp.revision<old.revision||
        stamp.revision===old.revision&&stamp.digest!==old.digest))
      return {state:'blocked',reason:'Wiki source identity unavailable or revision conflict'};
    if(native&&rustWikiSourceTransition?.(old??null,native)!==true)
      return {state:'blocked',reason:'Wiki source identity unavailable or revision conflict'};
    return {state:'accepted',stamp,native:!!native};
  }catch{
    return {state:'blocked',reason:'Wiki source identity unavailable'};
  }
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
// Reuse the owner-private AutoWiki context already fetched for Host Preview.
// The paired Direct phone deliberately has no owner-private corpus permission.
function validOracleCorpusView(corpus) {
  if (corpus === undefined) return true; // Older Host: existing context still valid.
  if (corpus?.schema !== 'vivim.oracle-corpus-view/1' ||
      corpus.sensitiveExcluded !== true || !Array.isArray(corpus.items)) return false;
  if (corpus.state === 'unavailable') return corpus.items.length === 0;
  return corpus.state === 'ready' && corpus.items.length <= 16 &&
    Number.isSafeInteger(corpus.count) && corpus.count === corpus.items.length &&
    corpus.items.every(item => typeof item?.id === 'string' &&
      typeof item.statement === 'string' && item.statement.length <= 2000 &&
      ['F01','D03','D04','D05','D07'].includes(item.pass) &&
      typeof item.source?.provenanceId === 'string' &&
      item.source.provenanceId.length > 0 &&
      typeof item.status === 'string' && typeof item.basis === 'string');
}
function renderOracleInExistingWiki(card, corpus) {
  card.append(el('h3', 'ux-card-title', 'Oracle · personal corpus'));
  if (!corpus || corpus.state !== 'ready') {
    card.append(el('p','ux-note','Oracle corpus unavailable or not connected; no cached personal facts.'));
    return;
  }
  card.append(el('p','ux-note',corpus.count+
    ' bounded provider-reported claim(s) · private Host ledger · not verified transcripts'));
  if (!corpus.items.length) card.append(el('p','ux-note',
    'No Oracle claims yet. Discovery requires owner review and approval.'));
  for (const item of corpus.items) {
    const row=el('div','ux-item');
    row.append(el('p','ux-note',item.statement),
      el('p','ux-note',item.pass+' · '+item.status+' · '+item.basis+
        ' · source '+item.source.provenanceId+' · generation '+
        (item.source.generationId ?? 'unknown')+
        ' · provider-reported, not independently verified'));
    card.append(row);
  }
}
function renderWikiContext() {
  const card = el('section', 'ux-card');
  card.append(el('h3', 'ux-card-title', 'AutoWiki · source-backed context'));
  const context = S.wikiContext;
  if (!context) {
    card.append(el('p', 'ux-note', S.wikiContextError || 'Owner-private context unavailable.'));
    return card;
  }
  renderOracleInExistingWiki(card,context.oracleCorpus);
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
    validAppliedEffects(context.applicationEffects) && validOracleCorpusView(context.oracleCorpus) &&
    Array.isArray(context.items) && context.items.length <= 24 &&
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
  if(S.wikiDelta?.to?.revision===S.wiki?.revision){
    const diff=S.wikiDelta;
    head.append(el('p','ux-note',diff.outcome==='baseline'?
      'Rust Wiki changes · first authorized source observation':
      'Rust Wiki changes · '+diff.changedPages+' pages · '+diff.changedSections+
      ' sections · '+diff.changedLinks+' link sets · '+diff.totalEvents+' events'));
    for(const event of diff.events.slice(0,12))
      head.append(el('p','ux-note',event.kind+' · '+event.page+
        (event.section?' / '+event.section:'')));
    if(diff.omittedEvents)
      head.append(el('p','ux-note',diff.omittedEvents+' additional changes not displayed'));
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
  if(!HOST_PREVIEW&&(
      typeof session?.['x-vivim-device-session']!=='string'||!session['x-vivim-device-session']||
      typeof session?.['x-vivim-grant-id']!=='string'||!session['x-vivim-grant-id'])){
    clearWiki('A valid paired-device grant is required for Wiki readback.');return;
  }
  // Redact the previous grant's read model before starting a new network read.
  // Waiting until its response arrives exposes the prior owner's Wiki on screen.
  const fenceKey=HOST_PREVIEW?'host-owner-preview':sha256Hex(JSON.stringify([
    'wiki-read',session['x-vivim-device-session'],session['x-vivim-grant-id']]));
  if(wikiReadScope!==null&&wikiReadScope!==fenceKey){
    wikiSourceFence=null;
    clearWikiSources('Wiki authorization scope changed');
    S.wiki=null;S.wikiStamp=null;S.wikiDelta=null;
    S.wikiContext=null;S.wikiContextError='';
    S.wikiError='Loading authorized Wiki source';
    renderWiki();
  }
  wikiReadScope=fenceKey;
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
    // A delayed denial from a revoked *old* grant must not revoke a newly
    // resumed session. Check both the read generation and exact credentials
    // before interpreting any 401/403 or consuming its response body.
    const sameWikiGrant = () => sequence===wikiReadSequence && S.tab==='wiki' &&
      (HOST_PREVIEW || S.paired && transport.direct &&
        transport.deviceHeaders?.()?.['x-vivim-device-session']===session['x-vivim-device-session'] &&
        transport.deviceHeaders?.()?.['x-vivim-grant-id']===session['x-vivim-grant-id']);
    if (!sameWikiGrant()) return;
    if (!response.ok) {
      if (!HOST_PREVIEW && [401, 403].includes(response.status)) {
        const denied = await response.json().catch(() => ({}));
        if (!sameWikiGrant()) return;
        if (isInvalidDeviceSession(denied.code || denied.reason || denied.error)) {
          transport.setDeviceSession?.(null);
          clearPrivatePhoneState(); return;
        }
      }
      throw new Error('Wiki read refused (HTTP ' + response.status + ')');
    }
    const wiki = await response.json();
    if(!validWikiSourceShape(wiki))
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
    if (!sameWikiGrant()) return;
    // Source scope was checked before the network request, so old private
    // content is never displayed while a newly paired device is loading.
    if (S.wiki && wiki.revision < S.wiki.revision) {
      clearWikiSources('Wiki revision regressed');S.wikiContext = null; S.wikiContextError = 'Wiki revision regressed; private context cleared.';
      renderWiki(); return;
    }
    // Wiki and Build share one source-identity rule, not two admission engines.
    const admission=verifyWikiSourceStamp(wiki,wikiSourceFence);
    if(admission.state!=='accepted'){clearWiki(admission.reason);return;}
    const {stamp,native}=admission;
    const nativeDelta=native?rustWikiSourceDelta?.(S.wiki??null,wiki):null;
    const matchingDelta=!!nativeDelta&&nativeDelta.to.revision===wiki.revision&&
      nativeDelta.to.digest===stamp.digest&&
      (!S.wikiStamp||nativeDelta.from?.digest===S.wikiStamp.digest);
    wikiSourceFence={key:fenceKey,stamp,native};
    if(HOST_PREVIEW)ingestWikiSources(sourceSurface);
    S.wiki = wiki; S.wikiStamp=stamp;
    S.wikiDelta=matchingDelta?nativeDelta:null; S.wikiError = '';
    S.wikiContext = context; S.wikiContextError = contextError; renderWiki();
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
  wikiSourceFence=null;wikiReadScope=null;
  buildWikiSourceScope=null;buildWikiSourceFence=null;
  buildBindingSequence++;buildPollSequence++;
  phoneRefreshEpoch++;activePhoneSourceScope=null;S.busy=false;
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
  if (build){build.clearVisualSourceScope();build.clear();}
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
  if (!device||!device['x-vivim-device-session']||
      !device['x-vivim-grant-id']||playerActive) return;
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
    // A ticket and its denial both belong to the exact starting grant.
    if(!S.paired||transport.deviceHeaders?.()?.['x-vivim-device-session']!==
         device['x-vivim-device-session']||
       transport.deviceHeaders?.()?.['x-vivim-grant-id']!==device['x-vivim-grant-id']){
      playerActive=false;return;
    }
    if (isInvalidDeviceSession(payload?.code)) {
      transport.setDeviceSession(null);
      clearPrivatePhoneState();
      showPairingState('error', 'Your PC session changed. Reconnect to continue streaming.');
      setConn('PC device authorization expired or revoked', true);
      return;
    }
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
  if (!headers||!headers['x-vivim-device-session']||!headers['x-vivim-grant-id']) {
    S.media = { state: 'not-authorized' };
    if (S.tab === 'world') renderSurfaces();
    return;
  }
  const generation = mediaGeneration;
  const sameGrant=()=>generation===mediaGeneration&&S.paired&&
    transport.deviceHeaders?.()?.['x-vivim-device-session']===headers['x-vivim-device-session']&&
    transport.deviceHeaders?.()?.['x-vivim-grant-id']===headers['x-vivim-grant-id'];
  S.mediaLoading = true;
  S.media = { state: 'loading' };
  if (S.tab === 'world') renderSurfaces();
  try {
    const response = await fetch('/mobile/api/media/library?offset=' + offset, {
      credentials: 'same-origin', cache: 'no-store', headers
    });
    const result = await response.json();
    if(!sameGrant())return;
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
    if(sameGrant())S.media={state:'unavailable',reason:'PC_CONNECTION_UNAVAILABLE'};
  } finally {
    if(generation===mediaGeneration){
      // An old-grant response never leaves previous private metadata visible.
      S.mediaAt=sameGrant()?Date.now():0;
      S.mediaLoading=false;
      if(!sameGrant())S.media={state:'not-authorized'};
      if(S.tab==='world')renderSurfaces();
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
  $('provider-connection-state').hidden = !FIRST_CONTACT || N.target !== 'harness';
  $('dock-provider-refresh').hidden = N.target !== 'harness' ||
    HOST_PREVIEW || !transport.direct || !S.paired;
  $('dock-provider-refresh').disabled = providerRefreshBusy;
  if (N.target === 'vivim') {
    $('chips').hidden = true; $('modelwrap').hidden = true; $('effortwrap').hidden = true;
    $('clip').hidden = true; $('files').hidden = true;
    $('text').placeholder = FIRST_CONTACT ? 'Ask anything…' : 'Ask VIVIM: show status, or describe a change…';
    $('text').maxLength = 1000;
    $('composer-note').textContent = HOST_PREVIEW
      ? 'Local preview · pair with your PC to unlock live Host actions'
      : !S.paired ? 'Offline or unpaired · no sends or Host actions'
      : 'PC-authoritative · previews first · approval required for changes';
    updateSend(); return;
  }
  $('composer-note').textContent = N.target === 'phone'
    ? 'Continue an existing PC session · never automatically resent'
    : FIRST_CONTACT && curConv() &&
        !S.manifest?.providers?.some(p=>p.id===curConv().provider&&p.queueConsumerReady===true)
      ? 'AI sign-in and phone delivery are different. Worker offline: draft not sent.'
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
  const c = curConv(), ps = providers();
  const choices = FIRST_CONTACT ? listProviderConnections(S.manifest?.providers) : ps;
  const p = c && choices.find(x => x.id === c.provider);
  if (FIRST_CONTACT) {
    const status = $('provider-connection-state');
    status.textContent = !c ? 'Choose an AI. This only creates a local draft.'
      : !p ? 'Selected AI not available. Nothing can be sent.'
      : p.queueConsumerReady ? p.label + ' · PC relay accepting. Review before Send.'
      : p.signedIn ? p.label + ' · signed in on PC; relay unavailable. Draft preserved.'
      : p.label + ' · PC sign-in not verified. Check my signed-in AIs; draft preserved.';
  }
  const sig = JSON.stringify([choices, combinedInbox, c && [c.id, c.provider, c.model, c.effort],
    S.files.map(f => f.name + f.size)]);
  if (S.sigs.comp !== sig) {
    S.sigs.comp = sig;
    const chips = $('chips'); chips.replaceChildren();
    const combined = el('button','chip','Combined');
    combined.type='button';combined.dataset.combined='1';
    combined.setAttribute('aria-pressed',String(combinedInbox));
    combined.title='All conversations. Sends only to the selected provider.';
    chips.append(combined);
    for (const x of choices) {
      const label=x.queueConsumerReady?'Ready on PC':x.signedIn?'Signed in · relay offline':'Sign-in not verified';
      const b=el('button','chip',(x.label||x.id)+(FIRST_CONTACT?(x.queueConsumerReady?' ✓':x.signedIn?' ·':' ○'):''));
      b.type='button';b.dataset.p=x.id;
      b.title=(x.label||x.id)+' · '+label;
      b.setAttribute('aria-label',(x.label||x.id)+' · '+label);
      b.setAttribute('aria-pressed',String(!combinedInbox&&!!c&&x.id===c.provider));
      chips.append(b);
    }
    if (!choices.length) chips.append(el('span','muted','No AI accounts available'));
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
    $('text').placeholder = p ? 'Message ' + (p.label || p.id) + '…'
      : FIRST_CONTACT && c ? 'Draft for ' + String(c.provider).slice(0,32) + ' · verify on PC…' : 'Message…';
    $('text').maxLength = c ? Math.max(1, MAXTEXT - mkPrefix(c).length) : MAXTEXT;
  }
  updateSend();
}
// Wiki-first onboarding uses the existing owner-granted phone Wiki read and
// the same Rust/WASM search as the full Wiki tab. No second journal, index,
// provider session or uncontrolled effect is introduced.
let firstWikiPanel=null,firstWikiTimer=0,firstWikiEpoch=0,firstWikiSource=null,
    firstWikiGrant=null,firstWikiLoad=null,firstWikiAbort=null,
    firstWikiAt=0,firstWikiHighWater=null,firstWikiLastInputObs=0;
function observeFirstWiki(stage,fields={}){
  if(!FIRST_CONTACT||!transport.direct)return;
  // Projection/transport trace ONLY. Do not record the typed words, Wiki
  // sections, credentials, device identifiers or arbitrary error messages.
  const event={stage,...fields};
  void fetch('/mobile/api/first-contact/observe',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'content-type':'application/json','x-vivim-first-contact':'1'},
    body:JSON.stringify(event)
  }).catch(()=>{});
}
function firstWikiNotice(message,code=''){
  if(!firstWikiPanel)return;
  firstWikiPanel.hidden=false;
  firstWikiPanel.replaceChildren(el('p','first-wiki-label',message));
  if(code)firstWikiPanel.dataset.state=code;
}

function resetFirstWiki() {
  firstWikiEpoch++;clearTimeout(firstWikiTimer);firstWikiTimer=0;
  firstWikiAbort?.abort();firstWikiAbort=null;firstWikiLoad=null;
  firstWikiSource=null;firstWikiGrant=null;firstWikiAt=0;firstWikiHighWater=null;
  if(firstWikiPanel){firstWikiPanel.hidden=true;firstWikiPanel.replaceChildren();}
}
function firstWikiScope(){
  if(!FIRST_CONTACT||!transport.direct)return null;
  // The server authenticates the exact Tailscale owner for this single
  // read-only Wiki route. The browser never invents or persists a grant.
  if(!S.paired)return {headers:{},
    key:'tailnet-owner-first-contact',url:'/mobile/api/first-contact/wiki'};
  if(!S.device.scopes?.includes('control:read'))return null;
  const headers=transport.deviceHeaders?.();
  if(!headers?.['x-vivim-device-session']||!headers?.['x-vivim-grant-id'])return null;
  return {headers,key:sha256Hex(JSON.stringify([
    'first-wiki',headers['x-vivim-device-session'],headers['x-vivim-grant-id']])),
    url:'/mobile/api/wiki'};
}
function renderFirstWiki(text,source) {
  if(!firstWikiPanel)return;
  firstWikiPanel.replaceChildren();
  if(!text||!source){firstWikiPanel.hidden=true;return;}
  const found=rustWikiSearch?.(source.wiki,text.slice(0,160));
  if(found?.wikiRevision!==source.stamp.revision||
      found?.wikiDigest!==source.stamp.digest){
    firstWikiNotice('Rust Wiki search unavailable · source not admitted','rust-error');
    observeFirstWiki('rust-error',{code:'RUST_SOURCE_MISMATCH'});
    return;
  }
  observeFirstWiki('rust-ok',{matches:found.matches,revision:found.wikiRevision});
  firstWikiPanel.hidden=false;
  const heading=el('p','first-wiki-label',
    'WIKI · '+found.matches+' matches · revision '+found.wikiRevision);
  firstWikiPanel.append(heading);
  if(!found.results.length){
    firstWikiPanel.append(el('p','first-wiki-empty',
      'No matching Host Wiki entries yet. ARBOR source-code indexing is the next connection.'));
    observeFirstWiki('render-empty',{matches:0,revision:found.wikiRevision});
    return;
  }
  observeFirstWiki('render-matches',{matches:found.matches,revision:found.wikiRevision});
  for(const item of found.results.slice(0,6)){
    // Only Rust-returned page/section keys may select already-authorized
    // Host Wiki source. The browser expands textContent, never HTML.
    const row=el('details','first-wiki-item');
    const heading=el('summary','',item.page+(item.section?' / '+item.section:''));
    row.append(heading);
    if(item.excerpt)row.append(el('p','',item.excerpt));
    row.addEventListener('toggle',()=>{
      if(!row.open)return;
      if(firstWikiScope()?.key!==firstWikiGrant||firstWikiSource!==source||
          firstWikiHighWater?.digest!==source.stamp.digest||
          firstWikiHighWater?.revision!==source.stamp.revision){
        row.open=false;return;
      }
      const page=source.wiki.pages[item.page];
      const body=item.section?page?.sections?.[item.section]:null;
      const content=typeof body==='string'?body:
        page&&typeof page.sections==='object'?
          Object.keys(page.sections).slice(0,12).map(section=>'• '+section).join('\n'):'';
      const view=el('pre','first-wiki-detail');
      view.textContent=Array.from(content).slice(0,1600).join('')+
        (Array.from(content).length>1600?'\n…':'');
      row.querySelector('.first-wiki-detail')?.remove();
      row.querySelector('.first-wiki-proof')?.remove();
      row.append(view,el('small','first-wiki-proof',
        'Read only · Host Wiki revision '+source.stamp.revision));
    });
    firstWikiPanel.append(row);
  }
  if(found.indexTruncated)firstWikiPanel.append(el('small','',
    'Search is limited to the admitted Rust source index.'));
}
async function refreshFirstWiki({forceSource=false}={}){
  const text=$('text').value.trim(),scope=firstWikiScope();
  if(!text){resetFirstWiki();return;}
  if(!scope){firstWikiNotice('Read-only Wiki connection unavailable','source-error');
    observeFirstWiki('source-error',{code:'WIKI_SCOPE_UNAVAILABLE'});return;}
  if(coreUiStatus().state!=='ready'||!rustWikiSearch||!rustWikiSourceStamp){
    firstWikiNotice('Rust Wiki engine not ready · checking…','wasm-error');
    const ok=await initializeRustUiEngine();
    if(!ok){
      firstWikiNotice('Rust Wiki engine unavailable · '+coreUiStatus().code,'wasm-error');
      observeFirstWiki('wasm-error',{code:'WASM_NOT_READY'});return;
    }
    observeFirstWiki('wasm-ready');
  }
  if(firstWikiGrant!==scope.key){
    resetFirstWiki();firstWikiGrant=scope.key;firstWikiSource=null;
  }
  const epoch=++firstWikiEpoch;
  const current=()=>epoch===firstWikiEpoch&&firstWikiScope()?.key===scope.key&&
    $('text').value.trim()===text;
  const previous=firstWikiSource;
  if(previous&&!forceSource&&Date.now()-firstWikiAt<8000){
    if(current())renderFirstWiki(text,previous);return;
  }
  // Background revalidation keeps the verified Wiki visible until the new
  // source has passed the existing Rust provenance and revision checks.
  if(!forceSource){
    firstWikiSource=null;
    firstWikiNotice('Reading current Host Wiki…','search-start');
  }
  observeFirstWiki('search-start',{length:Math.min(text.length,1000)});
  if(!firstWikiLoad){
    firstWikiAbort=new AbortController();
    const abort=firstWikiAbort;
    firstWikiLoad=(async()=>{
      const response=await fetch(scope.url,{
        method:'GET',credentials:'same-origin',cache:'no-store',
        headers:scope.headers,signal:abort.signal
      });
      if(!response.ok)throw new Error('WIKI_READ_UNAVAILABLE');
      const wiki=await response.json();
      if(!validWikiSourceShape(wiki))throw new Error('WIKI_SOURCE_INVALID');
      const admitted=verifyWikiSourceStamp(wiki,
        firstWikiHighWater?{stamp:firstWikiHighWater,native:true}:null);
      if(admitted.state!=='accepted'||!admitted.native)
        throw new Error('WIKI_RUST_PROOF_REQUIRED');
      return {wiki,stamp:admitted.stamp};
    })().finally(()=>{if(firstWikiAbort===abort){
      firstWikiAbort=null;firstWikiLoad=null;
    }});
  }
  try {
    const source=await firstWikiLoad;
    if(!current())return; // A newer human/agent input or grant won the race.
    firstWikiSource=source;firstWikiAt=Date.now();firstWikiHighWater=source.stamp;
    if(!forceSource||!previous||previous.stamp.digest!==source.stamp.digest||
       previous.stamp.revision!==source.stamp.revision){
      observeFirstWiki('source-ok',{revision:source.stamp.revision});
      renderFirstWiki(text,source);
    }
  }catch(error){
    if(current()&&firstWikiPanel){
      firstWikiSource=null;
      firstWikiNotice('Wiki read unavailable. Retry by typing again.','source-error');
      observeFirstWiki('source-error',{code:
        error?.message==='WIKI_SOURCE_INVALID'?'WIKI_SOURCE_INVALID':
        error?.message==='WIKI_RUST_PROOF_REQUIRED'?'WIKI_RUST_PROOF_REQUIRED':
        'WIKI_FETCH_UNAVAILABLE'});
    }
  }
}
function scheduleFirstWiki(){
  if(!FIRST_CONTACT)return;
  clearTimeout(firstWikiTimer);
  const len=Array.from($('text').value.trim()).length;
  if(!len){resetFirstWiki();return;}
  // Text stays on the phone: record only an input length, never the words.
  if(Date.now()-firstWikiLastInputObs>450){
    firstWikiLastInputObs=Date.now();
    observeFirstWiki('input',{length:Math.min(len,1000)});
  }
  firstWikiNotice('Searching Wiki…','typing');
  firstWikiTimer=setTimeout(()=>{void refreshFirstWiki();},180);
}
function mountFirstWiki(){
  if(!FIRST_CONTACT)return;
  firstWikiPanel=el('aside','first-wiki');
  firstWikiPanel.id='first-wiki';
  firstWikiPanel.setAttribute('aria-label','Live source-backed Wiki suggestions');
  firstWikiPanel.setAttribute('aria-live','polite');
  firstWikiPanel.hidden=true;
  // mountUniversalDock already moved the shared composer into #app.
  // The Wiki stays at the end of the flex .chat viewport, immediately above
  // that composer. Using the moved textarea as insertBefore's reference node
  // would throw NotFoundError and prevent both human and agent Wiki updates.
  $('v-talk').querySelector('.chat').append(firstWikiPanel);
  $('text').addEventListener('input',scheduleFirstWiki);
  window.addEventListener('vivim:paired',()=>resetFirstWiki());
  document.addEventListener('vivim:wiki-committed',()=>{
    resetFirstWiki();scheduleFirstWiki();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)resetFirstWiki();
  });
}

// Refresh the SAME authenticated Host Wiki source while the phone is in the
// foreground. PC-committed Wiki changes now appear without another keystroke.
// This is a read-only source observation; it never mirrors an unapproved draft,
// creates a second journal, or changes the Host's approval/effect boundary.
function startFirstWikiSourceObserver(){
  if(!FIRST_CONTACT)return;
  setInterval(()=>{
    if(document.visibilityState!=='visible'||navigator.onLine===false||
       !$('text')?.value.trim()||!firstWikiScope()||firstWikiLoad||firstWikiTimer)return;
    void refreshFirstWiki({forceSource:true});
  },2000);
}

function updateSend() {
  if (HOST_PREVIEW || (!S.paired && !FIRST_CONTACT)) { $('send').disabled = true; return; }
  if (FIRST_CONTACT) {
    // Wiki text remains read-only. Only an EXPLICIT provider command makes
    // the original Send button visible, and its first tap ONLY stages a draft.
    const handoff = N.target === 'vivim'
      ? resolveProviderHandoff($('text').value,S.manifest?.providers) : null;
    document.body.classList.toggle('first-contact-handoff',S.paired && !!handoff);
    if (N.target === 'vivim') {
      $('send').disabled = !S.paired || !transport.direct || !handoff;
      $('send').setAttribute('aria-label','Choose AI (review before sending)');
      return;
    }
    if (N.target === 'harness') {
      $('send').disabled = !canSendVerifiedProvider({
        paired:S.paired,direct:transport.direct,
        sessionApproved:!!transport.deviceHeaders?.(),target:N.target,
        providerId:curConv()?.provider,projection:S.manifest?.providers,
        text:$('text').value,sending:S.sending
      });
      $('send').setAttribute('aria-label','Send to selected signed-in AI');
      return;
    }
    $('send').disabled=true;return;
  }
  $('send').disabled = N.target === 'vivim'
    ? !transport.direct || vivimChat.busy() || !$('text').value.trim() || $('text').value.trim().length > 1000
    : N.target === 'phone'
      ? !transport.direct || !N.session || N.sending || !!N.pending || !$('text').value.trim()
      : transport.direct
        ? !canSendVerifiedProvider({
          paired:S.paired,direct:true,sessionApproved:!!transport.deviceHeaders?.(),
          target:N.target,providerId:curConv()?.provider,projection:S.manifest?.providers,
          text:$('text').value,sending:S.sending
        })
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
  if (!S.paired && !HOST_PREVIEW && !FIRST_CONTACT) {
    toast('This phone is offline or unpaired. No message was sent.');
    return;
  }
  if (HOST_PREVIEW) {
    toast('This is your phone preview. Pair a phone or open Host Control to perform actions.');
    return;
  }
  if (N.target === 'vivim') {
    const field = $('text'), body = field.value.trim();
    // An explicit provider request only switches/stages the existing Talk
    // composer. No Host effect or provider send occurs until the next click.
    if (FIRST_CONTACT) {
      const handoff = resolveProviderHandoff(body,S.manifest?.providers);
      if (handoff) {
        if (!S.paired) {
          toast('Pair this phone with your PC before connecting an AI. Nothing was sent.');
          return;
        }
        // Stage even when not currently verified. Draft text never enters
        // the relay until the owner explicitly sends from an approved session.
        const prior = curConv();
        // Never repoint a previously sent conversation to another provider.
        if (!prior || prior.sent || msgsOf(prior.id).length || prior.provider !== handoff.id) {
          const conversation = { id: 'c-' + hex16(), title: '', provider: handoff.id,
            model: null, effort: null, sent: false, updatedAt: Date.now() };
          S.convs.unshift(conversation); S.active = conversation.id; S.files = [];
          saveConvs();
        }
        combinedInbox = false;
        switchChatTarget('harness');
        field.value = handoff.draft;
        S.sigs.comp = null; S.sigs.list = null;
        renderAll(true); autogrow(); updateSend(); field.focus();
        toast(handoff.status === 'ready'
          ? handoff.label + ' selected. Review the draft, then press Send.'
          : handoff.label + ' draft kept. Tap Check my signed-in AIs before sending.');
        return;
      }
    }
    if (FIRST_CONTACT) {
      observeFirstWiki('read-only-send-blocked',{length:Math.min(body.length,1000)});
      void refreshFirstWiki();return;
    }
    if (!body || body.length > 1000 || (S.paired && vivimChat.busy())) return;
    if (FIRST_CONTACT) {
      const admitted = rustFirstContact({text:field.value});
      if (admitted?.schema !== 'vivim.first-contact/1' || admitted.state !== 'admitted' ||
          admitted.text !== body || admitted.executionAuthorized !== false || admitted.effectPerformed !== false) {
        toast('Rust core unavailable or unable to admit this text. Nothing was sent.');
        updateSend(); return;
      }
    }
    // Before device enrollment, Enter means read the authenticated owner Wiki,
    // not send a command. The Host still requires device approval for effects.
    if (FIRST_CONTACT && !S.paired) {
      await refreshFirstWiki();
      const first=firstWikiPanel?.querySelector('details.first-wiki-item');
      if(first&&!first.open){first.open=true;first.dispatchEvent(new Event('toggle'));}
      return;
    }
    // Submit exclusively to the Host plan boundary. Never route to a provider.
    void vivimChat.send(body);
    if (field.value.trim() === body) {
      field.value = ''; autogrow();
      if (FIRST_CONTACT) resetFirstWiki();
    }
    updateSend();
    return;
  }
  if (N.target === 'phone') return nativeSend();
  if (S.sending) return;
  const c = curConv(), ta = $('text'), body = ta.value.trim(); if (!c || !body) return;
  if (transport.direct && !canSendVerifiedProvider({
    paired:S.paired,direct:transport.direct,
    sessionApproved:!!transport.deviceHeaders?.(),target:N.target,
    providerId:c.provider,projection:S.manifest?.providers,
    text:body,sending:S.sending
  })) {
    toast('AI account or delivery worker unavailable. Draft preserved; nothing sent.');
    updateSend();return;
  }
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
  const readEpoch=++phoneRefreshEpoch;
  const grant=transport.direct?transport.deviceHeaders?.():null;
  const validGrant=()=>!transport.direct||!!grant&&
    typeof grant['x-vivim-device-session']==='string'&&!!grant['x-vivim-device-session']&&
    typeof grant['x-vivim-grant-id']==='string'&&!!grant['x-vivim-grant-id']&&
    transport.deviceHeaders?.()?.['x-vivim-device-session']===grant['x-vivim-device-session']&&
    transport.deviceHeaders?.()?.['x-vivim-grant-id']===grant['x-vivim-grant-id'];
  const current=()=>readEpoch===phoneRefreshEpoch&&S.paired&&N.target!=='phone'&&validGrant();
  const revokeOldProjection=()=>{
    // Only the current request may redact. An older request cannot erase a
    // newer grant's already-admitted Host snapshot or receipt readback.
    if(readEpoch===phoneRefreshEpoch&&S.paired&&!validGrant())
      clearPrivatePhoneState();
  };
  if(!validGrant()){revokeOldProjection();return;}
  S.busy = true; clearTimeout(S.timer);
  try {
    const needStatus = !S.statusAt || Date.now() - S.statusAt > 7500;
    const [cm, st] = await Promise.all([api('commands'),
      needStatus ? api('status').catch(e => { if (e.status === 401) throw e; }) : null]);
    if(!current()){revokeOldProjection();return;}
    S.cmds = (cm && cm.commands) || [];
    if (st) {
      // The mounted visual guard is scoped BEFORE bootstrap-status publishes
      // its committed revision to TierFlow. Only this authenticated read can
      // rotate the visual source, never a source-supplied surface identifier.
      if(transport.direct&&build&&!build.setVisualSourceScope(JSON.stringify([
          'phone-visual-source',grant['x-vivim-device-session'],grant['x-vivim-grant-id']])))
        throw new Error('Visual source scope unavailable');
      S.statusObj = st; S.statusAt = Date.now();
      S.manifest = (st.snapshot && st.snapshot.manifest) || null;
      window.dispatchEvent(new CustomEvent('vivim:bootstrap-status', { detail: st }));
    }
    else if(needStatus)shellPresentation.clear();
    mergeServerConvs(); ensureActive();
    setConn(transport.direct ? 'Connected to PC' : 'Paired · relay online');
    renderAll();
  } catch (e) {
    if(!current()){revokeOldProjection();return;}
    // Status authority is unavailable: never retain a private Build revision.
    shellPresentation.clear();
    if (build) { build.clear(); buildKey = ''; }
    if (e.status === 401) {
      if (transport.direct) clearPrivatePhoneState();
      return start();
    }
    setConn('Relay error: ' + e.message, true); ensureActive(); renderAll();
  } finally {
    if(readEpoch===phoneRefreshEpoch)S.busy=false;
  }
  if(!current())return;
  if (S.tab === 'wiki') void refreshWiki();
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
   !!headers&&S.device.scopes?.includes('control:read')===true&&
   typeof headers['x-vivim-device-session']==='string'&&!!headers['x-vivim-device-session']&&
   typeof headers['x-vivim-grant-id']==='string'&&!!headers['x-vivim-grant-id']&&
   !!transport.deviceHeaders?.()&&transport.deviceHeaders?.()?.['x-vivim-device-session']===headers['x-vivim-device-session']&&
   transport.deviceHeaders?.()?.['x-vivim-grant-id']===headers['x-vivim-grant-id'];
 if(!authorized()){build.clearBindingScope();build.setLiveData(null,revision);return;}
 // Bind the live revision fence to the same grant/session that authorized
 // this read. A new device or Host scope starts a new private watermark.
 const bindingScope=HOST_PREVIEW?'loopback-owner:'+surface.surfaceId:
   JSON.stringify(['direct-phone',headers?.['x-vivim-device-session'],
     headers?.['x-vivim-grant-id'],surface.surfaceId]);
 if(!build.setBindingScope(bindingScope)){build.setLiveData(null,revision);return;}
 // Keep only a digest of this exact authorized grant/surface. Never retain
 // the raw session or grant as a persistent source watermark.
 const sourceScope=sha256Hex(bindingScope);
 if(sourceScope!==buildWikiSourceScope){
   buildWikiSourceScope=sourceScope;buildWikiSourceFence=null;
 }
 const outcomes=HOST_PREVIEW?snapshot?.studioOutcomes:
   snapshot?.live?.state==='source-backed'?snapshot.live.studioOutcomes:null;
 let wiki=null;
 if(HOST_PREVIEW||S.device.scopes?.includes('control:read')){
   try{
     const response=await fetch(HOST_PREVIEW?'/api/host/control/wiki-view':'/mobile/api/wiki',
       {credentials:'same-origin',cache:'no-store',headers,signal:AbortSignal.timeout(4000)});
     if(response.ok)wiki=await response.json();
     else if(response.status===401||response.status===403){
       const denied=await response.json().catch(()=>({}));
       if(seq!==buildBindingSequence||!authorized())return;
       if(!HOST_PREVIEW&&isInvalidDeviceSession(denied.code||denied.reason||denied.error)){
         // Revoked Direct devices lose their Build surface and private Wiki
         // bindings, not just an individual read projection.
         transport.setDeviceSession(null);
         clearPrivatePhoneState();
         showPairingState('revoked','The Host revoked this phone read grant. Pair again.');
         setConn('Device Wiki read grant expired or revoked',true);
         return;
       }
       build.setLiveData(null,revision); // a scoped denial is not global revocation
       return;
     }
   }catch{/* source unavailable; do not retain old task values */}
 }
 if(seq!==buildBindingSequence||S.tab!=='build'||build?.surface()?.revision!==revision||
    build?.surface()?.surfaceId!==surface.surfaceId)return;
 if(!authorized()){build.clearBindingScope();build.setLiveData(null,revision);return;}
 if(!HOST_PREVIEW&&!S.device.scopes?.includes('control:read'))wiki=null;
 let admission=null;
 if(wiki!==null){
   admission=verifyWikiSourceStamp(wiki,buildWikiSourceFence);
   if(admission.state!=='accepted'){
     // Do not paint newer Studio rows alongside a conflicted Wiki read:
     // the entire visual snapshot must remain source-coherent.
     build.setLiveData(null,revision);return;
   }
 }
 const painted=build.setLiveData(workspaceBindingData({wiki,outcomes}),revision);
 // Commit the source watermark only after TierFlow paints this authorized
 // snapshot; an aborted/failed repaint must never advance its revision.
 if(painted&&admission)buildWikiSourceFence=admission;
}
async function pollBuild() {
  buildTimer = 0;
  if (!build || !S.paired || S.tab !== 'build') return;
  const readSequence=++buildPollSequence;
  const grant=HOST_PREVIEW?null:transport.deviceHeaders?.();
  const current=()=>readSequence===buildPollSequence&&S.paired&&S.tab==='build'&&
    (HOST_PREVIEW||!transport.direct||!!grant&&
      typeof grant['x-vivim-device-session']==='string'&&!!grant['x-vivim-device-session']&&
      typeof grant['x-vivim-grant-id']==='string'&&!!grant['x-vivim-grant-id']&&
      transport.deviceHeaders?.()?.['x-vivim-device-session']===grant['x-vivim-device-session']&&
      transport.deviceHeaders?.()?.['x-vivim-grant-id']===grant['x-vivim-grant-id']);
  const redact=()=>{
    // A status request issued under an old grant cannot repaint the new
    // device's Build surface, even if its visual revision happens to match.
    if(readSequence!==buildPollSequence)return;
    build?.clearVisualSourceScope();shellPresentation.clear();buildKey='';
  };
  if(!current()){redact();return;}
  try {
    const st = await api('status');
    if(!current()){redact();return;}
    // Bind the entire committed visual revision domain to the session/grant,
    // not to an untrusted source-supplied surface ID.
    if(transport.direct&&!build.setVisualSourceScope(JSON.stringify([
        'phone-visual-source',grant['x-vivim-device-session'],grant['x-vivim-grant-id']]))) {
      redact();return;
    }
    const bootstrap=st?.snapshot?.bootstrap;
    const rev=bootstrap?.uiRevision??null;
    // Check the complete Host-committed revision BEFORE promoting this status
    // snapshot. A delayed rollback cannot replace the app's newer read model.
    const observed=build.setSurface(rev,bootstrap);
    const genuineEmpty=rev===null&&observed?.reason==='NO_COMMITTED_SURFACE'&&
      bootstrap?.schema==='vivim.bootstrap-phone/1'&&bootstrap?.state==='ready'&&
      Object.hasOwn(bootstrap,'uiRevision')&&bootstrap.uiRevision===null&&
      build.revisionState()?.highRevision===null;
    if(observed?.state==='ready'||genuineEmpty){
      S.statusObj=st;S.statusAt=Date.now();
      shellPresentation.observe(rev??null);
      buildKey=observed?.state==='ready'?String(rev.surfaceId)+':'+String(rev.revision):'';
      if(observed?.state==='ready')void refreshBuildBindings(st?.snapshot);
    }else{
      // Never silently re-admit old Host content into Talk/Me/Build.
      shellPresentation.clear();buildKey='';
    }
  } catch (e) {
    if(!current()){redact();return;}
    // Transient status outages remove renderable state but retain the
    // same-grant high-water mark. Only a real scope change resets history.
    build?.clear();shellPresentation.clear();buildKey='';
    if (e && (e.status === 401 || e.status === 403)) return;
  }
  if (current()) scheduleBuild();
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
        : 'No pairing request exists yet for this browser. On your Windows PC, open http://127.0.0.1:43187/onboarding, choose Pair your phone, then open its one-use QR link on this phone.'
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
        if (FIRST_CONTACT) {
          // Tailnet-owner Wiki is deliberately useful before device pairing.
          // No signed-in AI, Host command, control effect or grant is unlocked.
          $('pairbox').hidden = true; $('app').hidden = false;
          document.body.classList.remove('paired');
          S.paired = false; S.tab = 'talk'; N.target = 'vivim';
          $('talk-target').value = 'vivim';
          renderComposer(); updateSend();
          setConn('Wiki · read only', false);
        } else {
          $('pairbox').hidden = false; $('app').hidden = true;
        }
        if (device.status === 'pending' && !approvalPoll) {
          approvalPoll = setTimeout(() => { approvalPoll = null; start(); }, 5000);
        }
        return;
      }
      // Resume is an authentication event, not permission to keep displaying
      // snapshots that were obtained under a different Host/device grant.
      const activeHeaders=transport.deviceHeaders?.();
      if(typeof activeHeaders?.['x-vivim-device-session']!=='string'||
          !activeHeaders['x-vivim-device-session']||
          typeof activeHeaders?.['x-vivim-grant-id']!=='string'||
          !activeHeaders['x-vivim-grant-id'])
        throw new Error('ACTIVE_DEVICE_GRANT_HEADERS_MISSING');
      const nextScope=sha256Hex(JSON.stringify(['phone-source',
        activeHeaders['x-vivim-device-session'],activeHeaders['x-vivim-grant-id']]));
      if(activePhoneSourceScope!==null&&activePhoneSourceScope!==nextScope)
        clearPrivatePhoneState(); // also invalidates in-flight command/status reads
      activePhoneSourceScope=nextScope;
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
$('pair-check').onclick = async () => {
  // Rechecking an unpaired browser is read-only; it cannot create or approve
  // a device grant. Always show the result rather than repainting identical UI.
  const button = $('pair-check');
  if (!transport.direct || button.disabled) return;
  button.disabled = true;
  button.textContent = 'Checking device…';
  $('pair-help').textContent = 'Checking this browser with your computer…';
  try {
    await start();
    if (S.paired || $('pairbox').hidden) return;
    if (S.device.status === 'unpaired') {
      showPairingState('unpaired',
        'No pairing request found for this browser. On your Windows PC open http://127.0.0.1:43187/onboarding, choose Pair your phone, and open the one-use QR link on this phone. Then check again.');
    } else if (S.device.status === 'pending') {
      showPairingState('pending',
        'Your pairing request is waiting for your approval on the PC. Open http://127.0.0.1:43187/host/control, unlock Host Control, select Your paired phones, and review the pending permissions.');
    } else if (S.device.status === 'revoked') {
      showPairingState('revoked');
    }
  } catch (error) {
    showPairingState('error',
      'Unable to check this browser: ' + String(error?.message || error).slice(0,120));
  } finally {
    button.disabled = false;
    button.textContent = 'Check device approval';
  }
};
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
  const b=e.target.closest('[data-p]');
  if(!b)return;
  const id=b.dataset.p;
  const options=FIRST_CONTACT?listProviderConnections(S.manifest?.providers):providers();
  const selected=options.find(p=>p.id===id);
  if(!selected)return;
  let c=curConv();
  combinedInbox=false;
  if(!c||c.provider!==id){
    // A sent conversation is an immutable provider history; make a fresh draft.
    if(!canRetargetProviderDraft(c,!!c&&msgsOf(c.id).length>0)){
      c={id:'c-'+hex16(),title:'',provider:id,model:null,effort:null,
        sent:false,updatedAt:Date.now()};
      S.convs.unshift(c);S.active=c.id;
    }else{
      c.provider=id;c.model=c.effort=null;c.updatedAt=Date.now();
    }
    S.files=[];saveConvs();
  }
  S.sigs.comp=null;S.sigs.list=null;renderAll(true);updateSend();
  if(FIRST_CONTACT)toast(selected.queueConsumerReady
    ? selected.label+' selected. Draft only · review before Send.'
    : selected.signedIn
      ? selected.label+' signed in; PC relay offline. Draft kept.'
      : selected.label+' selected. Sign-in not verified; draft kept.');
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
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing &&
      (FIRST_CONTACT || matchMedia('(pointer:fine)').matches)) {
    e.preventDefault();if(S.tab!=='talk')goTab('talk');void send();
  }
});
$('choose-ai').hidden=!FIRST_CONTACT;
$('choose-ai').addEventListener('click',()=>{
  if(!FIRST_CONTACT)return;
  if(!S.paired||!transport.deviceHeaders?.()){
    toast('Approve this phone on your PC to choose an AI. Nothing was sent.');
    return;
  }
  switchChatTarget('harness');
  if(N.target==='harness'){
    renderAll(true);autogrow();$('text').focus();
    toast('Choose an AI. Your text stays a draft until Send.');
  }
});
$('dock-provider-refresh').addEventListener('click', async () => {
  if(providerRefreshBusy||HOST_PREVIEW||!transport.direct||!S.paired)return;
  const headers=transport.deviceHeaders?.();
  if(!headers||!headers['x-vivim-device-session']||!headers['x-vivim-grant-id']){
    toast('Approve this phone on your PC first.');return;
  }
  providerRefreshBusy=true;$('dock-provider-refresh').disabled=true;
  $('dock-provider-refresh').textContent='Checking browser accounts…';
  try{
    // Explicitly selected drafts get a fast single-site freshness check.
    // The ordinary discovery button still checks all known accounts.
    const selected = FIRST_CONTACT && N.target==='harness' && !combinedInbox &&
      curConv() && !curConv().sent ? curConv().provider : null;
    const url='/mobile/api/chat/providers/refresh' +
      (selected ? '?provider='+encodeURIComponent(selected) : '');
    const response=await fetch(url,{
      method:'POST',cache:'no-store',credentials:'same-origin',
      headers:{...headers,origin:location.origin,'x-vivim-providers':'1'}
    });
    const result=await response.json();
    if(!S.paired||transport.deviceHeaders?.()?.['x-vivim-device-session']!==
        headers['x-vivim-device-session']||transport.deviceHeaders?.()?.['x-vivim-grant-id']!==
        headers['x-vivim-grant-id'])return;
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
    toast(selected
      ? result.providers.some(p=>p.id===selected&&p.signedIn===true&&p.queueConsumerReady===true)
        ? 'Selected AI and PC relay ready. Review your draft, then press Send.'
        : result.providers.some(p=>p.id===selected&&p.signedIn===true)
          ? 'AI signed in; PC relay unavailable. Draft preserved.'
          : 'Selected AI not verified on your PC. Draft preserved; nothing was sent.'
      : count ? count+' signed-in AIs verified by your PC.' : 'No AI login verified. Check your PC browser.');
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
    void readDeliveryStamp();
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
window.addEventListener('vivim:bootstrap-refresh', () => { S.statusAt = 0; void readDeliveryStamp(); if (S.paired) refresh(); });

if (!HOST_PREVIEW && 'serviceWorker' in navigator) {
  // The installed Android PWA must adopt newly deployed Host shell assets.
  // Never reload over a human draft, pending send, or approval.
  let workerRegistration=null,upgradePending=false;
  let hadController=!!navigator.serviceWorker.controller;
  let lastWorkerCheck=0;
  const safeUpgrade=()=>document.visibilityState==='visible'&&
    !$('text')?.value.trim()&&!transport.pending()&&!S.busy&&
    !S.sending&&!N.sending&&!N.pending&&!chatHasApproval&&!(S.files?.length)&&
    !localNotes?.hasPendingLocalWork?.()&&!localVoice?.hasPendingLocalWork?.();
  const applyUpgrade=()=>{
    if(upgradePending&&safeUpgrade()){
      upgradePending=false;
      window.location.reload();
    }
  };
  const checkWorker=()=>{
    if(!workerRegistration||document.visibilityState!=='visible'||navigator.onLine===false||
       Date.now()-lastWorkerCheck<30000)return;
    lastWorkerCheck=Date.now();
    void workerRegistration.update().catch(()=>{});
    applyUpgrade();
  };
  navigator.serviceWorker.register(transport.direct ? '/mobile/sw.js' : '/sw.js')
    .then(registration=>{workerRegistration=registration;checkWorker();})
    .catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    S.sigs.ux = null;
    if (S.tab === 'me') renderSurfaces();
    // A first-ever service worker claim is not an update. Existing controlled
    // documents may reload once safe, without replaying API mutations.
    if(hadController){upgradePending=true;applyUpgrade();}
    hadController=true;
  });
  document.addEventListener('visibilitychange',checkWorker);
  $('text').addEventListener('input',applyUpgrade);
  setInterval(checkWorker,60000);
}
mountUniversalDock();
void readDeliveryStamp();
mountFirstWiki();
startFirstWikiSourceObserver();
// A visual acknowledgment is shown ONLY after the existing Host has verified
// the source revision and Control receipt. This dot is not a synthetic touch,
// authority claim, chat send or record of the private draft text.
let agentDraftPulseTimer = null;
function showVerifiedAgentDraftPulse() {
  const field = $('text');
  if (!field?.isConnected) return;
  let marker = document.getElementById('vivim-agent-draft-verified');
  if (!marker) {
    marker = document.createElement('span');
    marker.id = 'vivim-agent-draft-verified';
    marker.setAttribute('role', 'status');
    marker.setAttribute('aria-live', 'polite');
    document.body.append(marker);
  }
  const rect = field.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - 184));
  const top = Math.max(8, rect.top - 34);
  marker.textContent = '● Agent draft verified';
  marker.style.cssText = 'position:fixed;left:' + left + 'px;top:' + top +
    'px;z-index:3000;pointer-events:none;border-radius:999px;' +
    'background:#123b32;color:#dcffed;padding:6px 10px;font:600 12px system-ui;' +
    'box-shadow:0 2px 9px #0005;max-width:180px;';
  marker.hidden = false;
  if (agentDraftPulseTimer !== null) clearTimeout(agentDraftPulseTimer);
  agentDraftPulseTimer = setTimeout(() => {
    marker.hidden = true;
    agentDraftPulseTimer = null;
  }, 2500);
}

if (FIRST_CONTACT) {
  // Owner-Tailscale composer is an observed, approval-fenced document slice,
  // not a second send channel. Same existing #text and Wiki input listeners.
  // Dynamic import preserves the unchanged Cloud/mobile shell: the
  // owner-only .ts assets are fetched solely on the Direct first-contact URL.
  void import('./first-contact-composer.ts').then(({mountFirstContactComposer})=>{
    mountFirstContactComposer({
      field: $('text'),
      active: () => N.target === 'vivim' && S.tab === 'talk' &&
        !HOST_PREVIEW && transport.direct,
      onVerified: () => showVerifiedAgentDraftPulse(),
      // Each Host-approved visual frame flows through the existing Wiki
      // input listener; pause exceeds its 180 ms debounce.
      typingIntervalMs:225,
      maxLength: () => $('text').maxLength > 0 ? $('text').maxLength : 1000
    });
  }).catch(()=>{ /* unavailable bridge never enables remote draft edits */ });
}
if (FIRST_CONTACT) {
  $('text').placeholder = 'Ask anything…';
  $('text').setAttribute('enterkeyhint','done');
  void initializeRustUiEngine().then(ok => {
    if (ok) {
      const view = rustFirstContact({text:''});
      if (view?.schema === 'vivim.first-contact/1' && view.state === 'empty' &&
          view.presentation?.surface === 'composer' &&
          view.presentation?.target === 'vivim-host') {
        $('text').placeholder = view.presentation.placeholder;
      }
    }
    updateSend();
    observeFirstWiki(ok?'wasm-ready':'wasm-error',
      ok?{}:{code:'WASM_NOT_READY'});
    if (!ok || coreUiStatus().state !== 'ready') {
      $('connection-announcer').textContent = 'Rust Wiki engine unavailable.';
      if($('text').value.trim())scheduleFirstWiki();
    } else if($('text').value.trim())scheduleFirstWiki();
  });
}
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
