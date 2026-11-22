// VIVIM guided onboarding: the one place that connects the existing, separately tested parts.
//   Studio (browser + send-once journal owner)  <-HTTP-  studio port
//   studio owner adapter (exact-once dispatch)  <-  this service  ->  Host bootstrap scheduler
//   Host bootstrap runtime (trusted ledger writer)  <-  scheduler ingestion
// Nothing here drives a browser, bypasses an approval, retries a send or writes personalization
// except through those parts. The owner's tap on "Approve and start" is the only authorization.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createBootstrapScheduler, PASS_ORDER } from '../bootstrap/scheduler.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';
import { createBootstrapBindingStore, createStudioBootstrapOwnerAdapter } from '../../../studio/src/studio/bootstrap-owner-adapter.mjs';
import { promptForPass, extractJson, PASS_TITLES } from '../../mobile-relay/bootstrap-prompts.mjs';

export const ONBOARDING_SCHEMA = 'vivim.onboarding/1';
export const PROVIDERS = Object.freeze([
  { id: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com/', personalizes: true },
  { id: 'claude', label: 'Claude', url: 'https://claude.ai/', personalizes: false },
  { id: 'gemini', label: 'Gemini', url: 'https://gemini.google.com/', personalizes: false },
  { id: 'qwen', label: 'Qwen', url: 'https://chat.qwen.ai/', personalizes: false },
  { id: 'zai', label: 'Z.ai', url: 'https://chat.z.ai/', personalizes: false },
  { id: 'deepseek', label: 'DeepSeek', url: 'https://chat.deepseek.com/', personalizes: false }
]);
const PASSES = PASS_ORDER;
const APPROVAL_TTL_MS = 30 * 60 * 1000;
const READY_TTL_MS = 45 * 1000;
const IN_FLIGHT = new Set(['dispatching', 'awaiting', 'uncertain', 'ingesting']);
const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');
const coded = (code, message) => Object.assign(new Error(message), { code });

// Plain-language reasons. The code stays available for support, never shown as the explanation.
const REASONS = Object.freeze({
  SCHEDULER_PROVIDER_NOT_READY: "ChatGPT isn't signed in in the VIVIM browser yet.",
  SCHEDULER_APPROVAL_REQUIRED: 'Your approval expired. Review and approve again.',
  SCHEDULER_GRANT_REQUIRED: 'Personalization has not been approved on this PC.',
  BOOTSTRAP_OWNER_UNVERIFIED: "VIVIM Studio isn't running, so nothing was sent.",
  DRAFT_PRESENT: 'ChatGPT has an unsent draft in its chat box. Clear it in the VIVIM browser, then try again.',
  AUTH_WALL: "ChatGPT asked for a sign-in. Sign in in the VIVIM browser, then try again.",
  HOST_INGEST_REVIEW_REQUIRED: "ChatGPT answered, but not in the expected format. Nothing was applied.",
  JOURNAL_RECONCILIATION_REQUIRED: "VIVIM can't tell whether this was sent, so it will not send it again. Check the ChatGPT tab.",
  DISPATCH_OUTCOME_UNKNOWN: "VIVIM can't tell whether this was sent, so it will not send it again. Check the ChatGPT tab.",
  JOURNAL_VERIFICATION_REQUIRED: "VIVIM can't tell whether this was sent, so it will not send it again. Check the ChatGPT tab.",
  INSPECTION_UNAVAILABLE: 'Studio could not be reached to confirm the result. VIVIM will keep checking and will not resend.'
});
const reasonText = code => (code ? (REASONS[code] ?? `Stopped (${code}).`) : null);

export function createOnboardingService({ dataRoot, getRuntime, studio = null, directOrigin = null, apk = null, pairing = null, now = Date.now } = {}) {
  if (typeof dataRoot !== 'string' || !path.isAbsolute(dataRoot)) throw new TypeError('Onboarding: absolute dataRoot required');
  if (typeof getRuntime !== 'function') throw new TypeError('Onboarding: getRuntime required');
  const dir = path.join(dataRoot, 'onboarding');
  const file = path.join(dir, 'state.json');
  const iso = ms => new Date(ms).toISOString();
  const probes = new Map();
  let scheduler = null, timer = null, pumping = false, lastPumpError = null;

  // ---- durable owner choices (never prompts, replies or credentials) ----
  function load() {
    try {
      const value = JSON.parse(readFileSync(file, 'utf8'));
      if (value?.schema === ONBOARDING_SCHEMA) return value;
    } catch { /* first run or unreadable: start clean */ }
    return { schema: ONBOARDING_SCHEMA, primary: null, pending: null, generation: null, phone: { lastSeenAt: null } };
  }
  function save(state) {
    mkdirSync(dir, { recursive: true });
    const temp = `${file}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    writeFileSync(temp, JSON.stringify(state, null, 2));
    renameSync(temp, file);
  }

  // ---- Studio-backed sign-in checks (a fresh owned tab; never a send) ----
  const reachable = async () => (studio ? studio.reachable() : false);
  function remember(provider, result) {
    const record = { provider, observedAt: iso(now()), ...result };
    probes.set(provider, record);
    return record;
  }
  function providerOf(id) {
    const found = PROVIDERS.find(p => p.id === id);
    if (!found) throw coded('ONBOARDING_PROVIDER', 'Unknown AI service');
    return found;
  }
  async function openSignIn(id) {
    providerOf(id);
    if (!(await reachable())) throw coded('STUDIO_UNAVAILABLE', "VIVIM Studio isn't running. Start VIVIM first.");
    const snapshot = await studio.create({ site: id });
    return { opened: true, provider: id, conversationId: snapshot?.id ?? null };
  }
  async function check(id) {
    providerOf(id);
    if (!(await reachable())) return remember(id, { state: 'studio_unavailable', verified: false, reason: 'STUDIO_UNAVAILABLE' });
    let snapshot;
    try { snapshot = await studio.create({ site: id }); }
    catch (error) { return remember(id, { state: 'unknown', verified: false, reason: error?.code ?? 'STUDIO_ERROR' }); }
    let result;
    if (snapshot?.state === 'ready') result = { state: 'ready', verified: true, reason: null };
    else {
      const reason = String(snapshot?.readiness?.reason ?? 'UNKNOWN').replace(/[^A-Z0-9_]/gi, '_').slice(0, 60);
      const state = /AUTH|SIGN|LOGIN/i.test(reason) ? 'signed_out' : /DRAFT|GATE|CAPTCHA|LIMIT/i.test(reason) ? 'needs_attention' : 'unknown';
      result = { state, verified: false, reason };
    }
    // The probe tab is ours and carries no draft; closing it never touches the owner's tabs.
    if (typeof snapshot?.id === 'string') { try { await studio.finish(snapshot.id, { closeTab: true }); } catch { /* keep the recorded result */ } }
    return remember(id, result);
  }
  async function readiness() {
    const cached = probes.get('chatgpt');
    const fresh = cached && cached.verified && now() - Date.parse(cached.observedAt) <= READY_TTL_MS;
    const record = fresh ? cached : await check('chatgpt');
    return { provider: 'chatgpt', state: record.verified ? 'signed_in' : record.state, verified: record.verified === true, observedAt: record.observedAt };
  }

  // ---- exact owner authorization for exactly the prompts the owner reviewed ----
  function approvalFor({ requestId, generationId, pass, promptDigest }) {
    const generation = load().generation;
    const approval = generation?.approvals?.[requestId];
    if (!approval || generation.generationId !== generationId || approval.pass !== pass || approval.promptDigest !== promptDigest) return null;
    return {
      worldId: getRuntime().worldId, generationId, pass, requestId, promptDigest, provider: 'chatgpt',
      scope: 'full-bootstrap', ownerApproved: true, source: 'owner', approvalRef: `owner-${generationId}`, expiresAt: approval.expiresAt
    };
  }

  function ensureScheduler() {
    if (scheduler) return scheduler;
    const runtime = getRuntime();
    if (!runtime?.ledger) throw coded('ONBOARDING_LEDGER', 'The personalization ledger is unavailable on this PC.');
    // A settled provider reply may carry a code fence or a sentence; the strict parsers still validate the object.
    const tolerant = ingest => args => ingest({ ...args, response: extractJson(args.response) ?? args.response });
    const adapter = createStudioBootstrapOwnerAdapter({
      conversation: { create: () => studio.create({ site: 'chatgpt' }), submit: (id, body) => studio.submit(id, body), get: id => studio.get(id) },
      store: createBootstrapBindingStore({ dir: path.join(dataRoot, 'bootstrap', 'bindings') }),
      verifyOwner: reachable,
      verifyApproval: async packet => approvalFor(packet),
      now
    });
    scheduler = createBootstrapScheduler({
      ledger: runtime.ledger, worldId: runtime.worldId, now: () => iso(now()),
      runtime: { status: () => runtime.status(), ingestF02: tolerant(runtime.ingestF02), ingestF01: tolerant(runtime.ingestF01), ingestPass: tolerant(runtime.ingestPass) },
      studio: adapter, readiness, promptForPass,
      authorize: async packet => approvalFor(packet)
    });
    return scheduler;
  }

  // ---- owner actions ----
  function setPrimary(id) {
    providerOf(id);
    const state = load();
    state.primary = id;
    save(state);
    return state.primary;
  }
  function review() {
    const generationId = `onb-${now().toString(36)}-${randomBytes(4).toString('hex')}`;
    const state = load();
    state.pending = { generationId, at: iso(now()) };
    save(state);
    return {
      generationId, provider: 'chatgpt',
      passes: PASSES.map(pass => { const prompt = promptForPass(pass, generationId); return { pass, title: PASS_TITLES[pass], prompt, digest: sha(prompt) }; })
    };
  }
  function approveAndStart({ generationId } = {}) {
    const state = load();
    if (state.primary !== 'chatgpt') throw coded('ONBOARDING_PRIMARY_UNSUPPORTED', 'Personalization reads from ChatGPT. Choose ChatGPT as your main AI first.');
    if (!state.pending || state.pending.generationId !== generationId) throw coded('ONBOARDING_STALE', 'Review the prompts again before approving.');
    const runtime = getRuntime();
    runtime.grantBootstrap({ scope: 'full-bootstrap' });
    const session = ensureScheduler().startGeneration({ generationId, passes: [...PASSES] });
    const expiresAt = iso(now() + APPROVAL_TTL_MS);
    state.generation = {
      generationId, approvedAt: iso(now()), expiresAt,
      approvals: Object.fromEntries(session.passes.map(row => [row.requestId, { pass: row.pass, promptDigest: sha(promptForPass(row.pass, generationId)), expiresAt }]))
    };
    state.pending = null;
    save(state);
    return { generationId, expiresAt };
  }

  // ---- the background loop: one Studio-owned send at a time, never a resend ----
  async function pump() {
    if (pumping || !studio) return;
    pumping = true;
    try {
      if (!load().generation) return;
      const snapshot = ensureScheduler().snapshot();
      if (!snapshot) return;
      if (snapshot.passes.some(p => IN_FLIGHT.has(p.status))) await scheduler.reconcile();
      else if (snapshot.passes.some(p => p.status === 'queued')) await scheduler.runOnce();
      lastPumpError = null;
    } catch (error) {
      if (error?.code !== 'SCHEDULER_BUSY') lastPumpError = String(error?.code ?? 'PUMP_ERROR');
    } finally { pumping = false; }
  }
  function start({ intervalMs = 4000 } = {}) {
    if (timer) return;
    timer = setInterval(pump, intervalMs);
    timer.unref?.();
  }
  const stop = () => { if (timer) clearInterval(timer); timer = null; };

  function phoneSeen() {
    const state = load();
    if (state.phone.lastSeenAt && now() - Date.parse(state.phone.lastSeenAt) < 30000) return;
    state.phone.lastSeenAt = iso(now());
    save(state);
  }

  // ---- one read model for the whole wizard ----
  function personalization(state, projection) {
    const generation = state.generation;
    let session = null;
    if (generation) { try { session = ensureScheduler().snapshot(); } catch { session = null; } }
    const passes = (session?.passes ?? []).map(p => ({ pass: p.pass, title: PASS_TITLES[p.pass], status: p.status, reason: reasonText(p.reason), code: p.reason ?? null }));
    let phase = 'idle';
    if (state.primary && state.primary !== 'chatgpt') phase = 'unsupported';
    else if (state.primary === 'chatgpt') phase = state.pending ? 'review' : 'ready';
    if (passes.length) {
      if (passes.every(p => p.status === 'complete')) phase = 'done';
      else if (passes.some(p => IN_FLIGHT.has(p.status) && p.status !== 'uncertain')) phase = 'running';
      else if (passes.some(p => p.status === 'uncertain')) phase = 'uncertain';
      else if (passes.some(p => ['blocked', 'failed', 'cancelled'].includes(p.status))) phase = 'attention';
      else phase = 'running';
    }
    const cards = (projection?.cards ?? []).slice(0, 3).map(c => ({ id: c.id, title: c.title }));
    const progress = projection?.progress;
    const corpus = progress && ['claims', 'observations', 'contradictions'].every(key =>
      Number.isSafeInteger(progress[key]) && progress[key] >= 0)
      ? { claims: progress.claims, observations: progress.observations, contradictions: progress.contradictions }
      : null;
    return { phase, passes, cards, corpus, expiresAt: generation?.expiresAt ?? null, pumpError: lastPumpError };
  }
  async function status() {
    const state = load();
    const up = await reachable();
    let sites = null;
    if (up) { try { sites = new Set((await studio.sites()).map(s => s.id)); } catch { sites = null; } }
    let projection = null;
    try { projection = getRuntime().projection(); } catch { projection = null; }
    const lastSeen = state.phone.lastSeenAt;
    const current = apk?.getCurrent?.() ?? null;
    const grants = createEnrollment({ dataRoot, origin: directOrigin, user: null }).listGrants();
    const approved = grants.find(g => g.status === 'active' && !g.revokedAt);
    const enrolled = { paired: Boolean(approved), deviceId: approved?.deviceId ?? null };
    return {
      schema: ONBOARDING_SCHEMA,
      studio: { reachable: up },
      primary: state.primary,
      providers: PROVIDERS.map(p => ({ ...p, supported: sites ? sites.has(p.id) : null, check: probes.get(p.id) ?? null })),
      personalization: personalization(state, projection),
      phone: {
        connected: Boolean(lastSeen) && now() - Date.parse(lastSeen) < 120000 && (!enrolled || enrolled.paired), paired: Boolean(enrolled?.paired), deviceId: enrolled?.deviceId ?? null, lastSeenAt: lastSeen,
        mobileUrl: directOrigin ? `${directOrigin}/mobile/` : null,
        apk: current && directOrigin && current.releaseId ? { versionName: current.versionName ?? null, releaseId: current.releaseId, downloadUrl: `${directOrigin}/mobile/api/apk/download?releaseId=${encodeURIComponent(current.releaseId)}` } : null
      }
    };
  }

  // Read only: Studio-owned, previously observed provider checks; no probe,
  // browser tab creation or inferred login. Never advertise stale results.
  const providerSnapshot = () => PROVIDERS.map(p => ({
    id:p.id,label:p.label,check:probes.get(p.id) ?? null
  }));
  const primary = () => load().primary;
  return { schema: ONBOARDING_SCHEMA, primary, providerSnapshot, status, openSignIn, check, setPrimary, review, approveAndStart, pump, start, stop, phoneSeen };
}
