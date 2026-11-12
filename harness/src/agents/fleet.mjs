// AGENT FLEET: a named, persistent set of configured agents { name, role, model, threadUrl }.
// Safety rules enforced here (approvals themselves are applied by router.ask):
//   - at most ONE in-flight send per agent (FLEET_BUSY otherwise), checked synchronously so it is race-free
//   - every send goes through router.ask, then router.wait; nothing is ever resent
//   - every send is recorded as { agent, requestId, at } via the injected append function
//   - optional per-task cap from the role's limits.maxSendsPerTask (FLEET_LIMIT)
//   - the thread URL a reply came back on is persisted per agent in the store file
import { readFile, writeFile, rename, mkdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getRole, parseModelRef } from './roles.mjs';

const err = (code, message) => Object.assign(new Error(message), { code });
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
// router.wait keeps waiting on these; anything else is final for that request.
const PENDING = new Set(['pending_approval', 'approved', 'sent', 'observed']);

function httpsUrl(v) { try { return new URL(v).protocol === 'https:'; } catch { return false; } }

export function parseFleetConfig(input) {
  let cfg = input;
  if (typeof input === 'string') { try { cfg = JSON.parse(input); } catch (e) { throw err('FLEET_INVALID', 'Fleet config is not valid JSON: ' + e.message); } }
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw err('FLEET_INVALID', 'Fleet config must be an object.');
  const name = cfg.name ?? 'fleet';
  if (typeof name !== 'string' || !NAME.test(name)) throw err('FLEET_INVALID', 'Fleet name must be 1-64 letters, digits, dot, dash or underscore.');
  if (!Array.isArray(cfg.agents) || !cfg.agents.length) throw err('FLEET_INVALID', 'Fleet needs a non-empty agents array.');
  const seen = new Set();
  const agents = cfg.agents.map((a, i) => {
    if (!a || typeof a !== 'object') throw err('FLEET_INVALID', `Agent #${i + 1} must be an object.`);
    if (typeof a.name !== 'string' || !NAME.test(a.name)) throw err('FLEET_INVALID', `Agent #${i + 1} needs a valid name.`);
    if (seen.has(a.name)) throw err('FLEET_INVALID', `Duplicate agent name: ${a.name}`);
    seen.add(a.name);
    const role = getRole(a.role);
    if (!role) throw err('FLEET_INVALID', `Agent ${a.name}: unknown role ${JSON.stringify(a.role)}.`);
    const model = a.model ?? role.defaultModel;
    try { parseModelRef(model); } catch (e) { throw err('FLEET_INVALID', `Agent ${a.name}: ${e.message}`); }
    const threadUrl = a.threadUrl ?? null;
    if (threadUrl !== null && !httpsUrl(threadUrl)) throw err('FLEET_INVALID', `Agent ${a.name}: threadUrl must be an https URL or null.`);
    return Object.freeze({ name: a.name, role: role.id, model: model.trim(), threadUrl });
  });
  return Object.freeze({ name, agents: Object.freeze(agents) });
}

// Dry run: what the fleet looks like and what each agent may do. Never sends.
export function planFleet(config) {
  const cfg = parseFleetConfig(config);
  return {
    fleet: cfg.name, dryRun: true, sends: 0,
    agents: cfg.agents.map((a) => {
      const r = getRole(a.role);
      return { name: a.name, role: a.role, stepRole: r.stepRole, provider: parseModelRef(a.model).provider, model: a.model,
        thread: a.threadUrl ?? 'new', allowedActions: [...r.allowedActions], limits: { ...r.limits } };
    }),
  };
}

export function createFleet({ config, router, journal = null, append = null, store = null, waitMs = 120000, now = () => new Date().toISOString() } = {}) {
  const cfg = parseFleetConfig(config);
  if (!router || typeof router.ask !== 'function' || typeof router.wait !== 'function') throw err('FLEET_INVALID', 'createFleet needs a router with ask() and wait().');
  const record = append ?? (typeof journal?.append === 'function' ? (e) => journal.append(e) : null);
  const state = new Map(cfg.agents.map((a) => [a.name, { ...a, inFlight: null, lastStatus: null, lastRequestId: null, sendsByTask: new Map(), inFlightAt: null, lastPrompt: null }]));

  let loaded = null;
  const load = () => (loaded ??= (async () => {
    if (!store) return;
    let saved = {};
    try { saved = JSON.parse(await readFile(store, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    for (const [name, url] of Object.entries(saved?.threads ?? {})) { const s = state.get(name); if (s && httpsUrl(url)) s.threadUrl = url; }
    // Restore in-flight sends so agents are busy after a restart; refresh() reconciles them.
    for (const [name, entry] of Object.entries(saved?.inFlight ?? {})) {
      const s = state.get(name);
      if (s && entry && entry.requestId) {
        s.inFlight = entry.requestId;
        s.lastRequestId = entry.requestId;
        s.inFlightAt = entry.startedAt ?? null;
        s.lastPrompt = entry.prompt ?? null;
      }
    }
  })());
  let saving = Promise.resolve();
  const save = () => (saving = saving.catch(() => {}).then(async () => {
    if (!store) return;
    const threads = Object.fromEntries([...state.values()].filter((s) => s.threadUrl).map((s) => [s.name, s.threadUrl]));
    const inFlight = Object.fromEntries([...state.values()].filter((s) => s.inFlight && s.inFlight !== 'pending').map((s) => [s.name, { requestId: s.inFlight, prompt: s.lastPrompt, startedAt: s.inFlightAt }]));
    const tmp = `${store}.${randomUUID()}.tmp`;
    await mkdir(dirname(store), { recursive: true });
    await writeFile(tmp, JSON.stringify({ fleet: cfg.name, threads, inFlight }, null, 2) + '\n');
    try { await rename(tmp, store); }
    catch (e) {
      // Windows: rename across a locked/open target can fail with EPERM/EBUSY.
      // Fall back to writing the store directly (single writer per store path).
      try { await writeFile(store, JSON.stringify({ fleet: cfg.name, threads, inFlight }, null, 2) + '\n'); }
      catch { /* best effort; store is advisory durability only */ }
    }
    try { await writeFile(tmp, '', { flag: 'wx' }).catch(() => {}); await rm(tmp, { force: true }); } catch {}
  }));

  const view = (s) => ({ name: s.name, role: s.role, model: s.model, threadUrl: s.threadUrl, busy: !!s.inFlight,
    requestId: s.inFlight && s.inFlight !== 'pending' ? s.inFlight : null, lastStatus: s.lastStatus });
  function agentOf(name) { const s = state.get(name); if (!s) throw err('FLEET_UNKNOWN_AGENT', `No agent named ${JSON.stringify(name)}.`); return s; }
  async function remember(s, r) {
    if (httpsUrl(r?.threadUrl) && r.threadUrl !== s.threadUrl) { s.threadUrl = r.threadUrl; await save(); }
  }
  // A send that was still pending when wait() returned keeps the agent busy until the router says it finished.
  async function refresh(s) {
    if (!s.inFlight || s.inFlight === 'pending' || typeof router.result !== 'function') return;
    const id = s.inFlight;
    const r = await router.result(id);
    // Router has no record of this request (process crashed): orphaned send.
    // Never resend - mark uncertain and clear the reservation.
    if (!r) {
      s.lastStatus = 'uncertain'; s.inFlight = null; s.inFlightAt = null; s.lastPrompt = null;
      save();
      return;
    }
    if (PENDING.has(r.status) || s.inFlight !== id) return;
    s.lastStatus = r.status; s.inFlight = null; s.inFlightAt = null; s.lastPrompt = null;
    if (r?.status === 'complete') await remember(s, r);
    save();
  }

  return {
    agents: () => [...state.values()].map(view),
    // By exact agent name, else the first idle agent of that role (id or alias). null = all of that role are busy.
    assign(roleOrName) {
      if (state.has(roleOrName)) return view(state.get(roleOrName));
      const role = getRole(roleOrName);
      if (!role) throw err('FLEET_UNKNOWN_AGENT', `No agent or role named ${JSON.stringify(roleOrName)}.`);
      const ofRole = [...state.values()].filter((s) => s.role === role.id);
      if (!ofRole.length) throw err('FLEET_NO_AGENT', `Fleet ${cfg.name} has no ${role.id} agent.`);
      const idle = ofRole.find((s) => !s.inFlight);
      return idle ? view(idle) : null;
    },
    async send({ agent, prompt, task = null } = {}) {
      const s = agentOf(agent);
      if (typeof prompt !== 'string' || !prompt.trim()) throw err('FLEET_INVALID', 'prompt required');
      await refresh(s);
      if (s.inFlight) throw err('FLEET_BUSY', `Agent ${s.name} already has a send in flight.`);
      s.inFlight = 'pending'; // reserved synchronously: a concurrent send now sees FLEET_BUSY
      try {
        await load();
        if (task !== null) {
          const n = s.sendsByTask.get(task) ?? 0, max = getRole(s.role).limits.maxSendsPerTask;
          if (n >= max) throw err('FLEET_LIMIT', `Agent ${s.name} reached ${max} sends for task ${task}.`);
          s.sendsByTask.set(task, n + 1);
        }
        s.lastPrompt = prompt; s.inFlightAt = now();
        const asked = await router.ask({ provider: s.model, threadUrl: s.threadUrl ?? 'new', prompt });
        s.inFlight = asked.requestId; s.lastRequestId = asked.requestId;
        save();
        if (record) await record({ agent: s.name, requestId: asked.requestId, at: now() });
        const r = await router.wait(asked.requestId, waitMs);
        s.lastStatus = r?.status ?? 'unknown';
        if (!r || !PENDING.has(r.status)) { s.inFlight = null; save(); }
        if (r?.status === 'complete') await remember(s, r);
        return { agent: s.name, requestId: asked.requestId, status: s.lastStatus, reply: r?.reply ?? null, threadUrl: s.threadUrl };
      } catch (e) {
        if (s.inFlight === 'pending') { s.inFlight = null; save(); } // nothing was asked yet
        throw e;
      }
    },
    async status() {
      await load();
      for (const s of state.values()) await refresh(s).catch(() => {});
      return { fleet: cfg.name, agents: [...state.values()].map(view) };
    },
  };
}
