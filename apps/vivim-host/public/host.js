// Metadata-only Host Control UI. All API-supplied text is inserted with textContent.
const $ = id => document.getElementById(id);
const names = { relay: 'Vercel Relay Worker', chatWorker: 'AI Chat Worker', harness: 'AI Harness', chrome: 'VIVIM Chrome' };
const stages = [
  ['cloudPulled', 'Received from cloud'],
  ['locallyQueued', 'Saved on this PC'],
  ['consumerClaimed', 'Claimed by a worker'],
  ['localTerminal', 'Local result recorded'],
  ['cloudUpdateAccepted', 'Cloud update acknowledged'],
  ['phoneDisplayed', 'Shown on your phone']
];
const stateLabel = { online:'Online', stale:'Stale', blocked:'Blocked', unknown:'Not verified' };
let latest = null;
let selectedId = null;
let activeView = 'control';
function node(tag, className = '', value = null) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (value !== null && value !== undefined) e.textContent = String(value);
  return e;
}
function pill(label, state = 'unknown') { return node('span', 'pill ' + (stateLabel[state] ? state : 'unknown'), label); }
function timeAgo(ts) {
  const ms = Date.now() - Date.parse(ts || '');
  if (!Number.isFinite(ms) || ms < -2000) return 'time unknown';
  if (ms < 5000) return 'just now';
  if (ms < 60000) return Math.floor(ms / 1000) + 's ago';
  if (ms < 3600000) return Math.floor(ms / 60000) + 'm ago';
  return new Date(ts).toLocaleString();
}
function card(title, item) {
  const box = node('article', 'card');
  const head = node('div', 'card-head');
  head.append(node('h3', '', title), pill(stateLabel[item.state] || 'Not verified', item.state));
  box.append(head, node('p', 'card-explanation', item.reason || item.evidence || 'No direct evidence observed yet.'));
  if (item.lastHeartbeatAt) box.append(node('p', 'card-foot', 'Last verified cycle · ' + timeAgo(item.lastHeartbeatAt)));
  else box.append(node('p', 'card-foot', 'No verified heartbeat'));
  if (item.nextAction) box.append(node('p', 'card-tip', item.nextAction));
  return box;
}
function renderStrip(snapshot) {
  const wrap = $('connection-strip'); wrap.replaceChildren();
  const overview = [
    { name: 'This PC', state: snapshot.host?.state || 'unknown' },
    { name: 'Cloud relay worker', state: snapshot.services?.relay?.state || 'unknown' },
    { name: 'Chat worker', state: snapshot.services?.chatWorker?.state || 'unknown' },
    { name: 'Chrome', state: snapshot.services?.chrome?.state || 'unknown' }
  ];
  for (const it of overview) {
    const box = node('div', 'connection-item');
    box.append(node('span', 'connection-indicator ' + it.state), node('span', 'connection-name', it.name), node('strong', '', stateLabel[it.state] || 'Not verified'));
    wrap.append(box);
  }
}
function renderDiagnosis(snapshot) {
  const d = snapshot.diagnosis || {};
  const severity = ['info','warning','neutral','unknown'].includes(d.severity) ? d.severity : 'unknown';
  $('diagnosis').className = 'diagnosis ' + severity;
  $('diagnosis-label').textContent = d.code ? 'DIAGNOSIS · ' + d.code.replaceAll('_', ' ') : 'CURRENT DIAGNOSIS';
  $('diagnosis-title').textContent = d.title || 'No diagnosis available';
  $('diagnosis-detail').textContent = d.detail || 'Waiting for local evidence.';
  $('diagnosis-action').textContent = d.nextAction || 'No action required.';
}
function renderCards(snapshot) {
  const cards = $('cards'); cards.replaceChildren(card('Local Host', snapshot.host || { state:'unknown' }));
  for (const [key, title] of Object.entries(names)) cards.append(card(title, snapshot.services?.[key] || { state:'unknown' }));
}
function activityTitle(r) {
  const names = {
    waiting_for_consumer:'Waiting for worker', processing_locally:'Processing locally',
    cloud_update_accepted:'Cloud accepted update', waiting_for_cloud_update:'Awaiting cloud receipt',
    failure_reported_to_cloud:'Failure reported', failure_waiting_for_cloud:'Failure pending sync',
    send_outcome_uncertain:'Uncertain send'
  };
  return names[r.currentStage] || r.status || 'Unknown stage';
}
function renderActivity(snapshot) {
  const journey = snapshot.journey || { state: 'not_observed', recent: [] };
  const all = Array.isArray(journey.recent) ? journey.recent : [];
  $('bridge-count').textContent = journey.state === 'observed' ? all.length + ' recent' : 'Not observed';
  const list = $('activity'); list.replaceChildren();
  if (!all.length) {
    const empty = node('div', 'activity-empty');
    empty.append(node('p', '', journey.state === 'unavailable' ? 'Local bridge activity cannot be read.' : 'No local messages observed yet. This does not mean your phone or Vercel is offline.'), node('small', '', 'Waiting for real evidence from this PC.'));
    list.append(empty);
    $('activity-detail').replaceChildren(node('p', 'fineprint', 'A verified local message will appear here.'));
    return;
  }
  if (!all.some(r => r.id === selectedId)) selectedId = all[0].id;
  for (const r of all) {
    const row = node('button', 'activity-item' + (r.id === selectedId ? ' selected' : ''));
    row.type = 'button'; row.dataset.commandId = r.id;
    row.setAttribute('aria-pressed', String(r.id === selectedId));
    const main = node('div', 'activity-main');
    main.append(node('span', 'activity-icon ' + r.status, '●'));
    const info = node('div');
    info.append(node('strong', '', activityTitle(r)), node('small', '', (r.consumer || 'unknown') + ' · ' + timeAgo(r.updatedAt)));
    main.append(info);
    row.append(main, node('code', '', r.id.slice(0, 12) + '…'));
    list.append(row);
  }
  const selected = all.find(r => r.id === selectedId) || all[0];
  renderDetail(selected);
}
function renderDetail(r) {
  const box = $('activity-detail'); box.replaceChildren();
  const head = node('div', 'detail-head');
  head.append(node('div', '', 'Verified stages'), node('code', '', r.id)); box.append(head);
  const evidence = r.evidence || {};
  const list = node('ol', 'stage-list');
  for (const [field, title] of stages) {
    const value = evidence[field];
    const li = node('li', value === true ? 'stage-confirmed' : 'stage-unverified');
    li.append(node('span', 'stage-mark', value === true ? '✓' : '·'), node('span', '', title), node('small', '', value === true ? 'Verified' : 'Not verified'));
    list.append(li);
  }
  box.append(list);
  const caveat = node('p', 'detail-caveat', 'A claimed command is not proof of an AI send. A cloud acknowledgement is not proof the phone displayed the reply.');
  box.append(caveat);
}
function render(snapshot) {
  latest = snapshot;
  renderStrip(snapshot); renderDiagnosis(snapshot); renderCards(snapshot); renderActivity(snapshot);
  const old = $('host-pill');
  const next = pill('Host reachable', 'online'); next.id = 'host-pill'; old.replaceWith(next);
  $('updated').textContent = 'Updated ' + new Date(snapshot.observedAt).toLocaleString() + ' · read-only diagnostics · 127.0.0.1';
}
async function refresh() {
  const button = $('refresh'); if (button.disabled) return;
  button.disabled = true; button.textContent = 'Checking…';
  try {
    const r = await fetch('/api/host/status', { cache:'no-store', credentials:'same-origin', signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    render(await r.json());
  } catch {
    latest = null;
    renderStrip({ host: { state: 'unknown' }, services: {} });
    renderCards({ host: { state: 'unknown', reason: 'Local status request failed' }, services: {} });
    const p = $('host-pill'); p.textContent = 'Host status unavailable'; p.className = 'pill blocked';
    $('updated').textContent = 'Status check failed. Previous message evidence may be stale.';
    $('diagnosis').className = 'diagnosis warning';
    $('diagnosis-title').textContent = 'Cannot refresh the local Host';
    $('diagnosis-detail').textContent = 'The status endpoint did not return a verified snapshot.';
    $('diagnosis-action').textContent = 'Check whether VIVIM Host is still running. Do not resend any message.';
  } finally { button.disabled = false; button.textContent = 'Refresh status'; }
}
const copy = {
  today: 'Your private daily overview will use the same PC-authoritative state as your phone.',
  talk: 'The local Talk mirror will use your existing Vercel Talk design and the same durable conversation IDs. It cannot send yet.',
  agents: 'Your personal agents will connect to the same trusted harness once the shared state layer is ready.',
  self: 'Local memory, identity and preferences will live here. The existing JSON authorities remain intact; SQLite indexing is a later, additive layer.',
  build: 'Your software and personal app building workspaces will appear here with versioned jobs, review evidence and rollback.'
};
function select(view) {
  activeView = view;
  document.querySelectorAll('[data-view]').forEach(b => {
    if (b.dataset.view === view) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  const control = view === 'control';
  $('control-view').hidden = !control;
  $('world-view').hidden = control;
  const title = control ? 'Host Control' : view.charAt(0).toUpperCase() + view.slice(1);
  $('heading').textContent = title;
  $('page-subtitle').textContent = control ? "A real picture of what's happening between your phone and your AI." : 'Your local, personal VIVIM world.';
  if (!control) { $('world-title').textContent = title; $('world-copy').textContent = copy[view] || ''; }
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => select(b.dataset.view)));
$('refresh').addEventListener('click', refresh);
$('activity').addEventListener('click', e => {
  const row = e.target.closest('[data-command-id]');
  if (row && latest?.journey?.recent?.some(r => r.id === row.dataset.commandId)) {
    selectedId = row.dataset.commandId; renderActivity(latest);
  }
});
$('copy-report').addEventListener('click', async () => {
  if (!latest) return;
  // Whitelist only metadata; never copy reply bodies, prompts, secret paths or tokens.
  const report = JSON.stringify({ schema:'vivim.host-diagnostic-report/1', observedAt:latest.observedAt,
    services:Object.fromEntries(Object.entries(latest.services || {}).map(([k,v]) => [k, { state:v.state, diagnosticCode:v.diagnosticCode || null, lastHeartbeatAt:v.lastHeartbeatAt || null }])),
    diagnosis: { code: latest.diagnosis?.code || null, title:latest.diagnosis?.title || null },
    recent:(latest.journey?.recent || []).map(r => ({ id:r.id, status:r.status, currentStage:r.currentStage, cloudUpdateAccepted:r.evidence?.cloudUpdateAccepted === true })) }, null, 2);
  try { await navigator.clipboard.writeText(report); $('copy-report').textContent = 'Copied safe report'; }
  catch { $('copy-report').textContent = 'Copy unavailable'; }
  setTimeout(() => { $('copy-report').textContent = 'Copy safe diagnostic report'; }, 2500);
});
refresh();
setInterval(() => { if (!document.hidden && activeView === 'control') refresh(); }, 6000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && activeView === 'control') refresh(); });