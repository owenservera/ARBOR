// grokbot-authored. Outbound-only mobile relay core (storage-agnostic, unit-testable).
// Phone: pairing secret -> HttpOnly Secure cookie (HMAC of PAIR secret, never the secret itself).
// Box agent: Authorization: Bearer <HOST secret>. Commands are append-only revisions, never overwritten.
import { createHash, createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

export const COOKIE = 'vivim_relay';
const MAX_TEXT = 4000, MAX_RESULT = 60000, MAX_STATUS = 32000;
const KINDS = ['command', 'intent', 'stage'], CONSUMERS = ['grokbot', 'harness', 'bootstrap'];
import { BOOTSTRAP_ACTIONS } from '../../vivim-host/control/bootstrap-actions.mjs';
const THEME_PRESETS = ['lab','tide','dusk','ember','grove','ink','dawn'];
const STATUSES = ['claimed', 'done', 'failed'];
const eq = (a, b) => { const x = createHash('sha256').update(String(a)).digest(), y = createHash('sha256').update(String(b)).digest(); return timingSafeEqual(x, y); };
export const sessionValue = pair => createHmac('sha256', pair).update('vivim-relay-session/1').digest('base64url');
const cookies = h => Object.fromEntries(String(h || '').split(';').map(s => s.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, v.join('=')]));
const fail = (status, error) => Object.assign(new Error(error), { status });
const idOk = id => typeof id === 'string' && /^cmd-[0-9a-f]{16}$/.test(id);

export function createRelay({ store, env, now = () => new Date().toISOString() }) {
  const pair = env.VIVIM_RELAY_PAIR_SECRET, host = env.VIVIM_RELAY_HOST_SECRET;
  const isPhone = req => !!pair && !!cookies(req.headers.cookie)[COOKIE] && eq(cookies(req.headers.cookie)[COOKIE], sessionValue(pair));
  const isHost = req => !!host && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ') && eq(req.headers.authorization.slice(7), host);
  const latest = async () => {
    const out = new Map();
    for (const r of await store.listCommands()) { const p = out.get(r.id); if (!p || r.rev > p.rev) out.set(r.id, r); }
    return [...out.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };
  const one = async id => (await latest()).find(r => r.id === id) || null;

  return async function route({ method, path, req, body }) {
    if (path === 'pair' && method === 'POST') {
      if (!pair || typeof body?.secret !== 'string' || !eq(body.secret, pair)) throw fail(401, 'Invalid pairing secret');
      return { status: 200, body: { paired: true }, cookie: `${COOKIE}=${sessionValue(pair)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000` };
    }
    if (path === 'session' && method === 'GET') return { status: 200, body: { paired: isPhone(req) } };
    if (path.startsWith('host/')) {
      if (!isHost(req)) throw fail(401, 'Unauthorized');
      if (path === 'host/pending' && method === 'GET') return { status: 200, body: { commands: (await latest()).filter(r => r.status === 'queued') } };
      if (path === 'host/update' && method === 'POST') {
        const r = await one(body?.id); if (!r) throw fail(404, 'Unknown command');
        if (!STATUSES.includes(body.status)) throw fail(400, 'Invalid status');
        if (r.status === 'done' || r.status === 'failed') return { status: 200, body: r };
        const result = body.result == null ? null : String(body.result);
        if (result && result.length > MAX_RESULT) throw fail(413, 'Result too large');
        const t = now(), next = { ...r, status: body.status, result: result ?? r.result, updatedAt: t, rev: r.rev + 1,
          claimedBy: typeof body.by === 'string' && CONSUMERS.includes(body.by) ? body.by : (r.claimedBy ?? 'grokbot'),
          ...(body.status === 'claimed' ? { claimedAt: t } : { doneAt: t }) };
        await store.putCommand(next); return { status: 200, body: next };
      }
      if (path === 'host/status' && method === 'POST') {
        const raw = JSON.stringify(body ?? {}); if (raw.length > MAX_STATUS) throw fail(413, 'Status too large');
        await store.putStatus({ at: now(), snapshot: body }); return { status: 204 };
      }
      throw fail(404, 'Not found');
    }
    if (!isPhone(req)) throw fail(401, 'Not paired');
    if (path === 'commands' && method === 'GET') return { status: 200, body: { commands: (await latest()).slice(0, 50) } };
    if (path === 'commands' && method === 'POST') {
      const { text, kind = 'command', consumer = 'grokbot', stage } = body ?? {};
      if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) throw fail(400, 'text must be 1-4000 characters');
      if (!KINDS.includes(kind) || !CONSUMERS.includes(consumer)) throw fail(400, 'Invalid kind or consumer');
      if (stage !== undefined && (typeof stage !== 'string' || !/^[a-z0-9-]{1,64}$/.test(stage))) throw fail(400, 'Invalid stage');
      const extra = chatFields(body); // grokbot-authored: relay-chat structured fields
      const t = now(), rec = { ...extra, schema: 'vivim.bridge-command/1', id: 'cmd-' + randomBytes(8).toString('hex'), kind, text: text.trim(), ...(stage ? { stage } : {}),
        consumer, status: 'queued', createdAt: t, updatedAt: t, claimedBy: null, claimedAt: null, result: null, doneAt: null, rev: 1, origin: 'relay' };
      await store.putCommand(rec); return { status: 201, body: rec };
    }
    const m = path.match(/^commands\/([^/]+)$/);
    if (m && method === 'GET') { if (!idOk(m[1])) throw fail(400, 'Bad id'); const r = await one(m[1]); if (!r) throw fail(404, 'Unknown command'); return { status: 200, body: r }; }
    if (path === 'status' && method === 'GET') return { status: 200, body: (await store.latestStatus()) ?? { at: null, snapshot: null } };
    throw fail(404, 'Not found');
  };
}

// grokbot-authored. Optional Relay Chat fields; strict validation, absent fields omitted.
function chatFields(b) {
  const o = {}, re = (v, r) => typeof v === 'string' && r.test(v);
  if (b.mode === 'bootstrap') {
    // The Host worker validates local actions and grants again; personalize remains
    // a recognized command shape but the scheduler is a disabled draft.
    if (b.consumer !== 'bootstrap' || b.kind !== 'command' ||
        !BOOTSTRAP_ACTIONS.includes(b.action)) throw fail(400, 'Invalid bootstrap command');
    const allowed = new Set(['text','kind','consumer','mode','action','preset','proposal']);
    if (Object.keys(b).some(k => !allowed.has(k))) throw fail(400, 'Unexpected bootstrap fields');
    if (b.text !== b.action) throw fail(400, 'Bootstrap command text must equal its action');
    if (b.action === 'choose-preset') {
      if (!THEME_PRESETS.includes(b.preset)) throw fail(400, 'Unknown preset');
    } else if (b.preset !== undefined) throw fail(400, 'Unexpected preset');
    if (b.action === 'apply-proposal') {
      if (!b.proposal || typeof b.proposal !== 'object' || Array.isArray(b.proposal))
        throw fail(400, 'apply-proposal requires a proposal object');
    }
    return { mode: 'bootstrap', action: b.action, ...(b.preset ? { preset: b.preset } : {}), ...(b.proposal !== undefined ? { proposal: b.proposal } : {}) };
  }
  if (b.consumer === 'bootstrap') throw fail(400, 'Bootstrap commands require explicit bootstrap mode');
  if (b.mode !== undefined) { if (b.mode !== 'relay-chat') throw fail(400, 'Invalid mode'); o.mode = b.mode; }
  if (b.conversationId !== undefined) { if (!re(b.conversationId, /^c-[0-9a-f]{16}$/)) throw fail(400, 'Invalid conversationId'); o.conversationId = b.conversationId; }
  if (b.newChat !== undefined) { if (typeof b.newChat !== 'boolean') throw fail(400, 'Invalid newChat'); o.newChat = b.newChat; }
  if (b.target !== undefined) { const t = b.target || {};
    if (!re(t.provider, /^[a-z]{2,16}$/) || !(t.model == null || re(t.model, /^[\w.-]{1,40}$/)) || !(t.effort == null || re(t.effort, /^[\w.-]{1,24}$/))) throw fail(400, 'Invalid target');
    o.target = { provider: t.provider, model: t.model ?? null, effort: t.effort ?? null }; }
  if (b.attachments !== undefined) { const a = b.attachments;
    if (!Array.isArray(a) || a.length > 5 || !a.every(x => x && re(x.name, /^.{1,120}$/) && (x.mime == null || re(x.mime, /^.{0,80}$/)) && Number.isInteger(x.size ?? 0))) throw fail(400, 'Invalid attachments');
    o.attachments = a.map(x => ({ name: x.name, mime: x.mime ?? null, size: x.size ?? 0 })); }
  return o;
}

export function memoryStore() {
  const cmds = [], st = [];
  return { async listCommands() { return cmds.map(c => ({ ...c })); }, async putCommand(r) { cmds.push({ ...r }); },
    async putStatus(s) { st.push(s); }, async latestStatus() { return st.at(-1) ?? null; } };
}
