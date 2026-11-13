// Direct-mobile Universal Text Control (UTC04).
// Keystroke feedback runs LOCALLY with the same vendored NCLL bytes as the Host (no network per
// keystroke); the Host remains the authoritative parser and the only executor. Execution needs
// an explicit "Approve & apply" tap bound to the exact plan digest the PC returned.
// Direct connection only: the cloud PWA never receives private configuration requests.
import { interpretControl } from './control-language.mjs';
import { transport } from './transport.mjs';
import { createControlClient } from './control-client.mjs';

const byId = id => document.getElementById(id);
const btn = byId('control-preview'), input = byId('control-text'), output = byId('control-result');
let pack = null;
let viewEpoch = 0;
const control = createControlClient({ transport });
let applying = false;

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'style') node.setAttribute('style', v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}
const live = el('div', { id: 'control-live', 'aria-live': 'polite', style: 'margin:4px 0 8px;font-size:14px;line-height:1.5' });
input?.insertAdjacentElement('afterend', live);
function show(...nodes) { if (!output) return; output.replaceChildren(...nodes.map(n => n instanceof Node ? n : document.createTextNode(String(n)))); }
const chip = (text, title) => el('span', { title: title ?? '', style: 'display:inline-block;padding:1px 7px;margin:2px;border-radius:9px;border:1px solid currentColor;opacity:.85;font-size:12px' }, text);
const action = (label, fn, primary = false) => el('button', { type: 'button', class: primary ? 'btn pri' : 'btn', style: 'margin:6px 6px 0 0', onclick: fn }, label);

const directReady = () => control.directReady();
const call = (path, body) => control.call(path, body);

async function loadPack() {
  const epoch = viewEpoch;
  if (pack || !(await directReady()) || epoch !== viewEpoch) return pack;
  try {
    const result = await call('language');
    if (epoch !== viewEpoch) return null;
    pack = result;
  } catch { if (epoch === viewEpoch) pack = null; }
  if (epoch !== viewEpoch) return null;
  if (pack?.catalog?.actions && output && !input?.value.trim()) {
    const actions = pack.catalog.actions.filter(a => ['source_wired','verified'].includes(a.readiness) && a.examples?.length).slice(0, 8);
    if (actions.length) show(el('div', {}, 'Available commands · '+
      pack.catalog.actions.filter(a=>['source_wired','verified'].includes(a.readiness)).length+
      ' of '+pack.catalog.actions.length+' cataloged · not all VIVIM features'), ...actions.map(a =>
      action(a.examples[0], () => { input.value = a.examples[0]; renderLive(); input.focus(); })));
  }
  return pack;
}

// ---- live, local interpretation (no network) ----
function renderLive() {
  const text = input?.value ?? '';
  if (!pack || !text.trim()) { live.replaceChildren(); return; }
  const m = interpretControl(text, { catalog: pack.catalog, world: pack.world });
  const f = m.feedback;
  const tokens = el('div', {}, ...f.tokens.map(t => chip(t.text, [t.kind, t.family, t.role].filter(Boolean).join(' · '))));
  const lines = [tokens];
  if (f.canonical && m.outcome !== 'interpretation_required') lines.push(el('div', { style: 'font-family:monospace;opacity:.8' }, f.canonical));
  const a = m.candidate && pack.catalog.actions.find(x => x.id === m.candidate.actionId);
  if (m.outcome === 'candidate' && a) lines.push(el('div', {}, '→ ' + a.title + ' ', chip(a.risk), ...Object.entries(m.candidate.args).map(([k, v]) => chip(k + ': ' + v))));
  else if (m.outcome === 'clarification_required') lines.push(el('div', {}, '? ' + m.question));
  else if (m.outcome === 'incomplete') lines.push(el('div', {}, '… ' + (m.question ?? 'More detail needed')));
  else if (m.outcome === 'interpretation_required') lines.push(el('div', { style: 'opacity:.7' }, 'Not a known command yet'));
  if (m.ignoredModifiers) lines.push(el('div', { style: 'opacity:.7' }, '“!” does not skip approval'));
  const sugg = f.suggestions.filter(s => ['correction', 'symbol', 'example'].includes(s.kind)).slice(0, 3);
  if (sugg.length && m.outcome !== 'candidate') lines.push(el('div', {}, ...sugg.map(s => action(s.display, () => { input.value = s.text; renderLive(); }))));
  live.replaceChildren(...lines);
}

// ---- authoritative plan / approve / receipt (Host) ----
function renderResult(plan) {
  if (plan.outcome === 'done') { show(el('div', {}, plan.title + ' ✓'), el('pre', { style: 'white-space:pre-wrap' }, JSON.stringify(plan.result, null, 2))); return; }
  if (plan.outcome === 'clarification_required') {
    show(el('div', {}, plan.question), ...(plan.choiceDetails ?? []).map(c => action(c.title + (c.readiness === 'source_wired' || c.readiness === 'verified' ? '' : ' (unavailable)'),
      () => submit({ actionId: c.actionId, args: {} }))), el('div', { style: 'opacity:.7' }, 'No action executed.'));
    return;
  }
  if (plan.outcome === 'incomplete') { show(plan.question + '\nNo action executed.'); return; }
  if (plan.outcome === 'interpretation_required') { show('Not a known command. AI interpretation through your signed-in apps is not wired yet. No action executed.'); return; }
  if (plan.outcome === 'unavailable') { show(plan.title + ' is not available yet (' + plan.readiness + ').' + (plan.precondition ? '\nNeeds: ' + plan.precondition : '') + '\nNo action executed.'); return; }
  if (plan.outcome === 'approval_required') {
    show(el('div', {}, plan.title), el('div', {}, ...Object.entries(plan.args).map(([k, v]) => chip(k + ': ' + v)), chip(plan.risk)),
      el('div', { style: 'opacity:.75;font-size:13px' }, 'Exact plan ' + plan.planDigest.slice(0, 12) + ' · expires ' + new Date(plan.expiresAt).toLocaleTimeString() +
        (plan.liveAcceptance !== 'verified' ? ' · not yet live-verified' : '')),
      action('Approve & apply', () => approve(plan), true), action('Cancel', () => show('Cancelled. Nothing changed.')));
  }
}
function renderReceipt(r) {
  const nodes = [el('div', {}, (r.status === 'applied' ? '✓ ' : '✗ ') + r.actionId + ' — ' + r.status + (r.replayed ? ' (already applied)' : ''))];
  if (r.error) nodes.push(el('div', {}, r.error.code + ': ' + r.error.message));
  if (r.result) nodes.push(el('pre', { style: 'white-space:pre-wrap;font-size:12px' }, JSON.stringify(r.result, null, 2)));
  nodes.push(el('div', { style: 'opacity:.7;font-size:12px' }, 'Receipt ' + r.planId + ' · ' + r.at));
  if (r.undo) nodes.push(action('Undo', () => submit({ actionId: r.undo.actionId, args: r.undo.args })));
  show(...nodes);
}
async function approve(plan) {
  if (applying) return;
  const epoch = viewEpoch;
  applying = true;
  show('Applying on your PC…');
  try {
    const receipt = await control.execute(plan);
    if (epoch === viewEpoch) renderReceipt(receipt);
  } catch (e) {
    if (epoch === viewEpoch)
      show((e.code === 'CONTROL_UNCERTAIN' ? 'Outcome uncertain — it will not be retried automatically. Check on the PC.' : String(e.message ?? e)) + '\n');
  } finally { applying = false; }
}
async function submit(body) {
  if (!btn) return;
  const epoch = viewEpoch;
  btn.disabled = true; show('Checking direct PC connection…');
  try {
    if (!(await directReady())) {
      if (epoch === viewEpoch) show('Control is available only over your authenticated Direct PC connection. Nothing was sent.');
      return;
    }
    if (epoch !== viewEpoch) return;
    const plan = await call('plan', body);
    if (epoch === viewEpoch) renderResult(plan);
  } catch (e) {
    if (epoch === viewEpoch) show(String(e.message ?? e) + '\nNo setting was changed.');
  } finally {
    if (epoch === viewEpoch) btn.disabled = false;
  }
}
function preview() {
  const text = input?.value.trim() ?? '';
  if (text && text.length <= 1000) submit({ text });
}
btn?.addEventListener('click', preview);
// Control's existing Host plans are visible as source-linked read-only decisions.
// No command is inferred from this list, and no receipt is treated as a new send.
const activity = byId('control-activity');
const ownerPreview = new URLSearchParams(location.search).get('host-preview') === '1'
  && ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
async function refreshControlActivity() {
  if (!activity || ownerPreview) return;
  const epoch = viewEpoch;
  activity.hidden = false;
  activity.replaceChildren(el('h3', { class: 'ux-card-title' }, 'Recent Host decisions'));
  try {
    if (!await directReady()) {
      if (epoch !== viewEpoch) return;
      activity.append(el('p', { class: 'muted' }, 'Connect to your approved PC to view control receipts.'));
      return;
    }
    const response = await call('recent');
    if (epoch !== viewEpoch) return;
    const entries = Array.isArray(response.items) ? response.items.slice(0, 12) : [];
    if (!entries.length) {
      activity.append(el('p', { class: 'muted' }, 'No recorded Host control decisions yet.'));
      return;
    }
    const list = el('ul', { class: 'ux-list' });
    for (const record of entries) {
      if (!record || typeof record.actionId !== 'string') continue;
      const line = el('li', { class: 'ux-item' });
      line.append(el('strong', { class: 'ux-item-title' }, record.actionId),
        el('span', { class: 'ux-item-detail' },
          String(record.state || 'unknown') + (record.createdAt ? ' · ' + record.createdAt : '')));
      list.append(line);
    }
    activity.append(list);
  } catch {
    if (epoch === viewEpoch) activity.append(el('p', { class: 'muted' },
      'Recent receipts unavailable. Approval, execution and recovery remain on your PC.'));
  }
}
byId('tabs')?.addEventListener('click', event => {
  if (event.target.closest('[data-tab="control"]') && !ownerPreview) {
    void loadPack();
    void refreshControlActivity();
  }
});
window.addEventListener('vivim:paired', event => {
  if (ownerPreview) return;
  if (!event.detail?.paired) {
    viewEpoch++;
    pack = null;
    input.value = '';
    live.replaceChildren();
    btn.disabled = true;
    show('PC authorization ended. Reconnect to plan or approve another action.');
    if (activity) {
      activity.replaceChildren(el('p', { class: 'muted' }, 'Device is no longer paired.'));
      activity.hidden = false;
    }
    return;
  }
  btn.disabled = false;
  if (document.querySelector('[data-tab="control"].on')) {
    void loadPack();
    void refreshControlActivity();
  }
});

input?.addEventListener('input', () => { loadPack().then(renderLive); });
input?.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); preview(); } });

// Read-only observed web memory. No cloud fallback or credentials persisted.
const memoryRoot = byId('v-control');
if (memoryRoot) {
  const section = el('section', { style: 'border-top:1px solid var(--bd);margin-top:26px;padding-top:16px' });
  const heading = el('h2', {}, 'What did I browse today?');
  const explanation = el('p', { class: 'muted' }, 'Private observed locations from your PC. Direct paired connection only.');
  const site = el('input', { placeholder: 'Filter by website, e.g. example.org', maxlength: '253',
    'aria-label': 'Website filter', autocomplete: 'off', style: 'display:block;width:100%;margin:12px 0' });
  const refreshButton = action('Refresh visits', () => refreshVisits());
  const status = el('p', { role: 'status', class: 'muted' }, 'Connect directly to your PC to view private history.');
  const items = el('div', { 'aria-live': 'polite', style: 'display:grid;gap:12px' });
  const older = action('Older visits', () => { if (nextCursor) refreshVisits(true); });
  older.hidden = true;
  let nextCursor = null;
  let historyEpoch = 0;
  section.append(heading, explanation, site, refreshButton, status, items, older);
  memoryRoot.append(section);
  site.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); refreshVisits(); }
  });
  async function refreshVisits(append = false) {
    const epoch = historyEpoch;
    if (!append) { nextCursor = null; items.replaceChildren(); }
    if (!transport?.direct || !(await directReady())) {
      if (epoch !== historyEpoch) return;
      status.textContent = 'Web memory is available only when connected directly to your PC.';
      older.hidden = true; return;
    }
    if (epoch !== historyEpoch) return;
    const device = transport.deviceHeaders?.();
    if (!device) {
      status.textContent = 'Approve a device-scoped session on your PC before viewing history.';
      older.hidden = true; return;
    }
    status.textContent = 'Checking the Host evidence view…';
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (site.value.trim()) params.set('site', site.value.trim().toLowerCase());
      if (append && nextCursor) params.set('cursor', nextCursor);
      const r = await fetch('api/memory/recent?' + params, { credentials: 'same-origin',
        cache: 'no-store', headers: device });
      const data = await r.json().catch(() => ({}));
      if (epoch !== historyEpoch) return;
      if (!r.ok) throw new Error(data.code || data.error || 'Host declined memory read (HTTP ' + r.status + ')');
      status.textContent = data.state + ' · ' + data.coverage + ' · ' +
        (data.lastRefreshAt || 'not refreshed') + '. ' + data.note;
      for (const visit of data.items || []) {
        const row = el('div', { style: 'padding:10px;border:1px solid var(--bd);border-radius:6px;overflow-wrap:anywhere' });
        const link = el('a', { href: visit.url, target: '_blank', rel: 'noopener noreferrer' },
          visit.site + ' · ' + new Date(visit.observedAt).toLocaleString());
        row.append(link, el('p', { class: 'muted', style: 'font-size:12px;margin:6px 0 0' },
          visit.url + ' · ' + visit.sourceOrigin + ' · ' + visit.trust +
          (visit.reduced ? ' · URL reduced' : '')));
        items.append(row);
      }
      if (!append && !(data.items || []).length) items.append(el('p', { class: 'muted' }, data.note));
      nextCursor = data.nextCursor || null;
      older.hidden = !nextCursor;
    } catch (error) {
      if (epoch !== historyEpoch) return;
      items.replaceChildren();
      status.textContent = 'Host offline, permission expired, or memory unavailable: ' + error.message;
      older.hidden = true;
    }
  }
  window.addEventListener('vivim:paired', event => {
    if (!event.detail?.paired) {
      historyEpoch++;
      items.replaceChildren();
      nextCursor = null;
      status.textContent = 'Phone not paired; private history is unavailable.';
    } else if (document.querySelector('[data-tab="control"].on')) refreshVisits();
  });
  byId('tabs')?.addEventListener('click', event => {
    if (event.target.closest('[data-tab="control"]')) refreshVisits();
  });
}
