// Phone surfaces: Today, World and Me (DEC-MOBILE-001 — one VIVIM phone, one authoritative path).
import { selectTodayMission } from './mission-experience.mjs';
// Pure derivations over what the Host actually returned — the /status snapshot and the command
// list — plus facts this phone already knows about itself. No DOM, no network, no timers.
//
// House rule for this file: a row exists only when a Host field (or a fact the phone really
// knows) produced it. When the Host returned nothing, the surface says so plainly instead of
// inventing a row. Nothing here sends, approves or claims that an effect happened.

export const TABS = Object.freeze(['today', 'talk', 'build', 'world', 'me', 'control']);

// The honest empty states. They name the missing thing instead of filling the screen.
export const WORLD_EMPTY = 'Nothing here yet — build something in Build.';
export const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

// The canonical phone labels for a live message state. Same wording the Talk thread uses.
export const LIVE_STATE_LABELS = Object.freeze({
  created: 'Intent recorded',
  remote_queued: 'Queued on PC',
  claimed: 'Claimed by worker — not sent',
  send_authorized: 'Send authorized — not observed',
  waiting_reply: 'Send observed — awaiting reply',
  reply_observed: 'Reply observed — delivery unconfirmed',
  delivered: 'Delivery acknowledged',
  uncertain: 'Send uncertain — inspect original receipt',
  failed_before_send: 'Failed before send',
  failed_after_send: 'Possible send — review required'
});

// A send that is genuinely still in flight.
const IN_FLIGHT = new Set(['created', 'remote_queued', 'claimed', 'send_authorized', 'waiting_reply']);
// A send whose outcome the Host cannot confirm. Never retried, never claimed as sent.
const NEEDS_REVIEW = new Set(['uncertain', 'failed_after_send']);

const plain = v => !!v && typeof v === 'object' && !Array.isArray(v);
const str = v => (typeof v === 'string' ? v.trim() : '');
const clip = (v, n) => {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};
const when = v => Date.parse(str(v)) || 0;
const pick = (o, k) => (plain(o) && plain(o[k]) ? o[k] : null);
const list = v => (Array.isArray(v) ? v : []);

export function snapshotOf(status) {
  if (!plain(status)) return null;
  return plain(status.snapshot) ? status.snapshot : null;
}

/* ---------------- shared readings ---------------- */

// The Host-committed vivim.ui-surface/1 component tree, flattened into "things that exist".
// `sources` are durable journal entries and approved Wiki revisions, flattened into built items
// with title/detail alongside the Host-committed surface tree items.
function surfaceItems(revision, sources = []) {
  const tree = plain(revision?.surface?.tree) ? revision.surface.tree
    : plain(revision?.tree) ? revision.tree : null;
  const out = [];
  if (tree) {
    const walk = (node, depth) => {
      if (!plain(node) || depth > 7 || out.length >= 64) return;
      const type = str(node.type);
      const props = plain(node.props) ? node.props : {};
      const children = list(node.children);
      if (type === 'stack' || type === 'grid') {
        for (const child of children) walk(child, depth + 1);
        return;
      }
      out.push({ id: str(node.id), kind: type, title: itemTitle(type, props), detail: itemDetail(type, props) });
      // A card owns its children; do not list them twice.
    };
    walk(tree, 0);
  }
  for (const src of sources) {
    if (!plain(src)) continue;
    const title = clip(str(src.title), 90);
    const detail = clip(str(src.detail), 160);
    if (!title) continue;
    const item = { title, detail };
    if (src.jumpTarget) item.jumpTarget = src.jumpTarget;
    out.push(item);
  }
  return out;
}
function itemTitle(type, props) {
  if (type === 'text') return clip(props.value, 90);
  if (type === 'button') return clip(props.label, 90);
  return clip(props.title, 90) || clip(props.value, 90) || clip(props.label, 90) || type;
}
function itemDetail(type, props) {
  if (type === 'card' || type === 'profile-card' || type === 'project-card') {
    if (str(props.description)) return clip(props.description, 160);
    if (str(props.basis)) return 'Basis: ' + str(props.basis);
    return '';
  }
  if (type === 'collection' || type === 'timeline' || type === 'chart') return list(props.items).length + ' items';
  if (type === 'button') return str(props.intent) ? 'Action: ' + str(props.intent) : 'Action';
  return '';
}

// Conversations the Host reports as still in flight.
function liveRunning(live) {
  const out = [];
  for (const conversation of list(live?.conversations)) {
    if (!plain(conversation)) continue;
    const messages = list(conversation.messages);
    const last = messages[messages.length - 1];
    if (!plain(last)) continue;
    const state = str(last.state);
    if (!IN_FLIGHT.has(state)) continue;
    out.push({
      id: str(conversation.id),
      provider: str(conversation.provider),
      model: str(conversation.model),
      state,
      label: 'Chat · ' + (str(conversation.provider) || 'assistant'),
      detail: LIVE_STATE_LABELS[state] || state
    });
  }
  return out;
}

// Sends the Host could not confirm. These are receipts, never a claim that anything was sent.
function liveReview(live) {
  const out = [];
  for (const conversation of list(live?.conversations)) {
    if (!plain(conversation)) continue;
    for (const message of list(conversation.messages)) {
      if (!plain(message)) continue;
      const state = str(message.state);
      if (!NEEDS_REVIEW.has(state) && message.requiresReview !== true) continue;
      out.push({
        id: str(message.commandId) || str(message.id),
        conversationId: str(conversation.id),
        provider: str(conversation.provider),
        state,
        label: 'Chat · ' + (str(conversation.provider) || 'assistant'),
        detail: LIVE_STATE_LABELS[state] || state
      });
    }
  }
  return out;
}

function bridgeCounts(bridge) {
  if (!plain(bridge)) return null;
  const count = v => (Number.isFinite(v) ? v : null);
  const queued = count(bridge.queued), claimed = count(bridge.claimed);
  const done = count(bridge.done), failed = count(bridge.failed);
  if (queued === null && claimed === null && done === null && failed === null) return null;
  return { queued, claimed, done, failed };
}

export function commandLabel(c) {
  const mode = str(c.mode), consumer = str(c.consumer), kind = str(c.kind);
  const target = plain(c.target) ? c.target : null;
  if (mode === 'relay-chat') {
    const provider = target ? str(target.provider) : '';
    return provider ? 'Chat message to ' + provider : 'Chat message';
  }
  if (mode === 'bootstrap') {
    const action = str(c.action);
    return action ? 'Build change · ' + action : 'Build change';
  }
  if (consumer && kind) return consumer + ' · ' + kind;
  if (consumer) return consumer;
  return kind || 'Command';
}

// Command receipts the Host already returned, newest first.
function receipts(commands) {
  const rows = [];
  for (const c of list(commands)) {
    if (!plain(c)) continue;
    const at = str(c.updatedAt) || str(c.createdAt);
    rows.push({
      id: str(c.id),
      label: commandLabel(c),
      // Only the user's own relay-chat text becomes a friendly title; other commands
      // retain their neutral labels so opaque control payloads are never surfaced.
      request: str(c.mode) === 'relay-chat' ? clip(c.text, 120) : '',
      status: str(c.status) || 'unknown',
      at,
      time: when(at)
    });
  }
  rows.sort((a, b) => b.time - a.time);
  return rows;
}

/* ---------------- World ---------------- */

// "The things that exist now": what the Host committed, what is running, what can change.
export function worldModel(status, commands, ctx = {}) {
  const snap = snapshotOf(status);
  const bootstrap = pick(snap, 'bootstrap');
  const live = pick(snap, 'live');
  const bridge = pick(snap, 'bridge');
  const modelSources = ['snapshot.bootstrap.uiRevision', 'snapshot.live.conversations', 'snapshot.bridge', 'commands'];
  const gaps = [];
  const extraSources = plain(ctx) && Array.isArray(ctx.builtSources) ? ctx.builtSources : [];

  const revision = plain(bootstrap?.uiRevision) ? bootstrap.uiRevision : null;
  const built = surfaceItems(revision, extraSources);
  const running = live ? liveRunning(live) : [];
  const queue = bridgeCounts(bridge);
  if (!live) gaps.push('Not available yet — the Host did not publish a live conversation timeline to the phone.');
  if (snap && !queue) gaps.push('Not available yet — the Host did not publish bridge counts to the phone.');

  const commandRows = receipts(commands);
  const inQueue = commandRows.filter(r => r.status === 'queued' || r.status === 'claimed');

  const revisionMeta = revision ? {
    surfaceId: str(revision.surfaceId),
    revision: Number.isFinite(revision.revision) ? revision.revision : null,
    status: str(revision.status),
    changeId: str(revision.changeId),
    parentRevision: Number.isFinite(revision.parentRevision) ? revision.parentRevision : null
  } : null;

  const emptyMessage = revision
    ? 'The Host committed revision ' + (revisionMeta.revision ?? '?') + ', and it holds no components yet.'
    : WORLD_EMPTY;

  return {
    hostReported: !!snap,
    built,
    revision: revisionMeta,
    // The optional private Direct-Host media read is never inferred from the World UI tree.
    media: plain(ctx.media) ? ctx.media : { state: 'idle' },
    running,
    queued: inQueue.slice(0, 6),
    queue,
    undoAvailable: plain(bootstrap?.undo) ? bootstrap.undo.available === true : false,
    changeHint: 'Build proposes a change; your PC commits it as a new revision you can undo.',
    empty: built.length === 0 && running.length === 0 && inQueue.length === 0 && !queue,
    emptyMessage,
    gaps,
    sources: modelSources
  };
}

/* ---------------- Me ---------------- */

// Identity, devices, permissions and recent activity — only what the Host actually returned.
export function meModel(status, commands, ctx = {}) {
  const snap = snapshotOf(status);
  const personal = pick(snap, 'personalAgent');
  const bootstrap = pick(snap, 'bootstrap');
  const manifest = pick(snap, 'manifest');
  const gaps = [];

  const identity = [];
  if (personal) {
    identity.push({ label: 'Personal agent', value: clip(personal.agentId || 'local', 60) });
    if (str(personal.scope)) identity.push({ label: 'Scope', value: clip(personal.scope, 60) });
    if (str(personal.identityAssurance)) identity.push({ label: 'Assurance', value: clip(personal.identityAssurance, 90) });
    identity.push({ label: 'Initialized', value: personal.initialized === true ? 'Yes' : 'No' });
  } else {
    identity.push({ label: 'Identity', value: 'Not available yet — the Host did not send a personal-agent identity to the phone.' });
  }
  if (bootstrap && str(bootstrap.worldId)) identity.push({ label: 'World', value: clip(bootstrap.worldId, 60) });

  const devices = [];
  devices.push({ label: ctx.mode === 'desktop-preview' ? 'This desktop' : 'This phone', value: ctx.mode === 'desktop-preview' ? 'Host preview (not a paired phone)' : ctx.paired === true ? 'Paired' : 'Not paired' });
  devices.push({ label: 'Connection', value: ctx.mode === 'desktop-preview' ? 'Local Host owner view' : ctx.mode === 'direct' ? 'Direct to your PC' : ctx.mode === 'cloud' ? 'Cloud relay' : 'Not known yet' });
  devices.push({ label: 'Device grant', value: ctx.deviceStatus ? clip(ctx.deviceStatus, 40) : 'Not available yet — no device grant was reported.' });
  devices.push({ label: 'Other devices', value: 'Not available yet — the Host does not send a device list to the phone.' });
  if (ctx.pendingSend === true) {
    devices.push({ label: 'Pending send', value: 'A send may be pending here — check before switching.' });
  }

  const permissions = [];
  const scopes = Array.isArray(ctx.scopes) ? ctx.scopes.filter(s => typeof s === 'string') : null;
  if (scopes && scopes.length) permissions.push({ label: 'This phone may', value: scopes.join(', ') });
  else permissions.push({ label: 'Permissions', value: 'Not available yet — the phone has no active device grant to report.' });
  const providers = list(manifest?.providers);
  if (providers.length) {
    const signedIn = providers.filter(p => plain(p) && p.signedIn === true).map(p => str(p.id) || str(p.label)).filter(Boolean);
    permissions.push({ label: 'Signed-in AI', value: signedIn.length ? signedIn.join(', ') : 'None signed in' });
  } else {
    permissions.push({ label: 'Signed-in AI', value: 'Not available yet — the Host did not send the provider manifest.' });
    gaps.push('Not available yet — the Host did not publish a provider manifest to the phone.');
  }

  const rows = receipts(commands);
  const live = pick(snapshotOf(status), 'live');
  const activity = {
    rows: rows.slice(0, 8),
    emptyMessage: rows.length ? '' : (live ? 'No receipts yet — the Host has returned no command receipts.' : NOT_AVAILABLE)
  };
  if (!rows.length) gaps.push('Not available yet — the Host has returned no receipts to this phone.');

  return {
    hostReported: !!snap,
    identity,
    devices,
    permissions,
    activity,
    webMemoryNavigation: ctx.mode === 'direct',
    readiness: ctx.readiness?.schema === 'vivim.pwa-readiness/1' ? ctx.readiness : null,
    gaps,
    sources: ['snapshot.personalAgent', 'snapshot.bootstrap.worldId', 'snapshot.manifest', 'commands', 'device grant scopes']
  };
}

/* ---------------- Today ---------------- */

// What is running, what needs the owner, and the one next action to pick up.
export function todayModel(status, commands, ctx = {}) {
  const snap = snapshotOf(status);
  const live = pick(snap, 'live');
  const world = worldModel(status, commands);
  const gaps = [];

  const connection = {
    label: 'Connection',
    value: ctx.connection ? clip(ctx.connection, 90) : 'Connecting…',
    tone: ctx.connectionTone === 'bad' ? 'bad' : ctx.connectionTone === 'warn' ? 'warn' : 'ok',
    detail: ctx.pendingSend === true ? 'A send may be pending here — check it before switching.' : ''
  };

  const attention = [];
  const reviewItems = liveReview(live);
  for (const item of reviewItems) {
    attention.push({
      id: 'review:' + item.id,
      kind: item.state === 'uncertain' ? 'uncertain' : 'possible-send',
      title: item.state === 'uncertain' ? 'A send is uncertain' : 'A send may have gone through',
      detail: item.detail + '. Nothing was resent.',
      action: { label: 'Open Talk', tab: 'talk' }
    });
  }
  if (plain(live) && str(live.state) === 'needs-review') {
    attention.push({
      id: 'review:timeline',
      kind: 'review',
      title: 'Your PC could not reconcile every send',
      detail: 'Some evidence is missing on the PC. Check it there before sending again.',
      action: { label: 'Open Talk', tab: 'talk' }
    });
  }
  const commandRows = receipts(commands);
  // Only receipts that genuinely need the owner surface as today items:
  // queued/claimed commands awaiting the PC, and failed commands nothing retried.
  // Done or otherwise unconfirmed receipts are history, not an open mission.
  const actionableCommands = commandRows.filter(r =>
    r.status === 'queued' || r.status === 'claimed' || r.status === 'failed');
  for (const row of actionableCommands.filter(r => r.status === 'failed').slice(0, 3)) {
    attention.push({
      id: 'failed:' + row.id,
      kind: 'failed',
      title: 'A command failed',
      detail: row.label + ' — the Host returned a failed receipt. Nothing was retried.',
      action: { label: row.label.startsWith('Build') ? 'Open Build' : 'Open Talk', tab: row.label.startsWith('Build') ? 'build' : 'talk' }
    });
  }
  if (snap && !live) {
    gaps.push('Not available yet — the Host did not publish a live send timeline, so uncertain sends cannot be listed here.');
  }
  gaps.push('Not available yet — the Host does not publish a pending-approvals list to the phone.');

  const running = [];
  for (const item of world.running.slice(0, 4)) {
    running.push({ id: 'live:' + item.id, label: item.label, detail: item.detail });
  }
  for (const row of world.queued.slice(0, 4)) {
    running.push({ id: 'cmd:' + row.id, label: row.label, detail: 'Waiting on your PC · ' + row.status });
  }

  const mission = selectTodayMission({ commands: actionableCommands, live: world.running,
    reviews: str(live?.state) === 'needs-review'
      ? [...reviewItems, { id: 'timeline', state: 'needs-review' }] : reviewItems });
  const next = nextAction({ attention, running, world, snap, commandRows: actionableCommands });

  return {
    hostReported: !!snap,
    connection,
    attention,
    attentionEmpty: 'Nothing needs you in the records currently visible here. Your PC may have approvals that this phone cannot display yet.',
    mission,
    running,
    gaps,
    next,
    // Native Pocket owns local captures; this only opens the existing Activity view.
    pocketAvailable: ctx.nativePocket === true,
    sources: ['snapshot.live.conversations', 'commands']
  };
}

// Exactly one primary next action, always pointing at a real destination.
function nextAction({ attention, running, world, snap, commandRows }) {
  const first = attention.find(a => a.action && a.action.tab);
  if (first) return { label: first.action.label, detail: first.title, tab: first.action.tab };
  if (running.length) {
    return { label: 'Open Talk', detail: 'Something is still in flight.', tab: 'talk' };
  }
  if (world.revision) {
    return { label: 'Open World', detail: 'See what exists now.', tab: 'world' };
  }
  if (commandRows.length) {
    return { label: 'Open Talk', detail: 'Pick up where you left off.', tab: 'talk' };
  }
  if (snap) {
    return { label: 'Build something', detail: 'Describe what you want. Your PC proposes it; you approve it.', tab: 'build' };
  }
  return { label: 'Build something', detail: 'Your PC has not reported yet. Build is where you start.', tab: 'build' };
}
