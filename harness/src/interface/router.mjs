import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dependencies } from './deps.mjs';
import { createApprovals } from './approval.mjs';
import { createStanding } from './standing.mjs';
import { devAutoApprove } from './dev-auto-approve.mjs';
import { resolveTarget, verifyAttachTarget } from './target.mjs';
import { parseModelSpec, prepareModel as defaultPrepareModel, createModelRegistry } from '../core/models.mjs';
import { createTabRegistry, clearComposerExpression, typedKeyFor } from '../core/tabs.mjs';
import { hasReplyText } from '../core/reply.mjs';
import * as brain from './brain.mjs';
import { createIntelligentModelRouter } from './intelligent-model-router.mjs';
import { createPrefs } from './prefs.mjs';
import { classifyIntent } from './intent.mjs';
const TASK_CLASS_MAP = Object.freeze({
  quick: 'general',
  implementation: 'coding',
  'app-design': 'visual',
  writing: 'documents',
  review: 'reasoning',
  decision: 'reasoning',
  research: 'research'
});

const runtime = fileURLToPath(new URL('../../../runtime/', import.meta.url));
// Read-only snapshot of the first matching composer's text (same matching order as clearComposerExpression).
const composerTextExpression = selectors => `(() => { for (const s of ${JSON.stringify(selectors)}) { const e = document.querySelector(s); if (!e) continue; return String((e.tagName === 'TEXTAREA' || e.tagName === 'INPUT') ? (e.value || '') : (e.innerText || e.textContent || '')); } return ''; })()`;
const TYPED_STATES = new Set(['sent', 'observed', 'uncertain']);
export async function createRouter({ dir = runtime, deps: injected = {}, approvals, pollMs = 200, standing, target = resolveTarget(), verifyTarget = verifyAttachTarget, observeTimeoutMs = 8000, draftPolls = 16, draftPollMs = 250, tabs: tabRegistry = createTabRegistry({ file: resolve(dir, 'tabs.json') }), env = process.env } = {}) {
  const deps = await dependencies(injected);
  const journal = await deps.createJournal({ dir: resolve(dir, 'journal') });
  approvals ||= createApprovals({ dir: resolve(dir, 'approvals') });
  standing ||= createStanding({ dir: resolve(dir, 'approvals') });
  const jobs = new Map();
  const registry = createModelRegistry({ file: resolve(dir, 'models.json') });
  const prepareModel = injected.prepareModel || defaultPrepareModel;
  const prefs = await createPrefs({ dir: resolve(dir, 'prefs') });
  async function decide({ task, constraints = {}, selectModel = false } = {}) {
    const profiles = await deps.listProviders(); const reg = await registry.load();
    const records = await journal.list();
    const providers = await brain.learnInput({ records, registry: reg, profiles });
    const taskClass = brain.classifyTask({ task, role: null, constraints });
    const intelligentTaskClass = TASK_CLASS_MAP[taskClass] ?? 'general';
    const intent = classifyIntent({ task, role: null, constraints });

    // Explicit tier-based model selection: use the studio policy router directly.
    if (selectModel) {
      const d = brain.route({ task, constraints: { ...constraints, maxSends: 1 }, providers, profiles, registry: reg });
      return {
        ...d,
        site: d.site,
        taskClass,
        model: d.model ? { id: d.model.id, label: d.model.id } : null,
        effort: d.model?.effort ?? null,
        routing: d.routing ? { ...d.routing, source: 'studio-policy' } : { pattern: d.pattern, site: d.site, taskClass, source: 'studio-policy' },
        executionTarget: intent.executionTarget,
        intentType: intent.intentType,
        domain: intent.domain,
        intentConfidence: intent.confidence
      };
    }

    // Readiness manifest for the intelligent router: verified providers + discovered models.
    const manifest = {
      schema: 'vivim.provider-readiness/1',
      observedAt: new Date().toISOString(),
      providers: providers.map(p => {
        const st = records.find(r => r.provider === p.site);
        const regEntry = reg[p.site] || {};
        const signedIn = p.signedIn !== false;
        return {
          provider: p.site,
          verified: signedIn,
          state: signedIn ? 'signed_in' : 'signed_out',
          observedAt: (st && st.updatedAt) || new Date().toISOString(),
          models: (regEntry.models || []).map(m => ({
            id: m.id,
            selectionVerified: true,
            efforts: (m.efforts || []).map(e => e.id),
            attachments: false
          }))
        };
      })
    };

    const { ownerRules, learned } = await prefs.routerInputs();

    // Intelligent router: verified readiness + explicit owner rules + learned signals.
    // Re-created per call so owner rules and learned signals are always current.
    const intelligentRouter = createIntelligentModelRouter({ ownerRules, learned, now: Date.now, maxAgeMs: 60000 });
    const intelligent = intelligentRouter.route({
      taskClass: intelligentTaskClass,
      manifest,
      constraints: { ...constraints, maxSends: 1 }
    });

    if (intelligent.status === 'selected' && intelligent.selected) {
      const { provider, model, effort } = intelligent.selected;
      const siteModel = { id: model, label: model };
      return {
        site: provider,
        taskClass,
        model: siteModel,
        effort,
        pattern: 'single',
        reason: intelligent.reason || 'WEIGHTED_VERIFIED_RANKING',
        routing: {
          pattern: 'single',
          site: provider,
          taskClass,
          suggestedModel: model,
          reason: intelligent.reason,
          source: 'intelligent-router',
          ranked: intelligent.ranked.slice(0, 5).map(r => ({ provider: r.provider, model: r.model, score: r.score, effort: r.effort }))
        },
        executionTarget: intent.executionTarget,
        intentType: intent.intentType,
        domain: intent.domain,
        intentConfidence: intent.confidence
      };
    }

    // Fall back to the studio policy router when the intelligent router is blocked.
    const d = brain.route({ task, constraints: { ...constraints, maxSends: 1 }, providers, profiles, registry: reg });
    return {
      ...d,
      site: d.site,
      taskClass,
      model: d.model ? { id: d.model.id, label: d.model.id } : null,
      effort: d.model?.effort ?? null,
      routing: d.routing ? { ...d.routing, source: 'studio-policy' } : { pattern: d.pattern, site: d.site, taskClass, source: 'studio-policy' },
      executionTarget: intent.executionTarget,
      intentType: intent.intentType,
      domain: intent.domain,
      intentConfidence: intent.confidence
    };
  }
  async function openOwned(browser, provider) {
    const page = await browser.openPage(provider.url);
    if (typeof page?.targetId === 'string') await tabRegistry.record({ id: page.targetId, provider: provider.id, url: provider.url });
    return page;
  }
  // G4: a fresh tab may carry a stale draft the harness typed earlier (some sites copy drafts into new tabs).
  // Only a draft matching a harness typedKey is cleared; a foreign draft is left for sendOnce to block (DRAFT_PRESENT).
  async function clearStaleHarnessDraft(page, provider) {
    const selectors = provider.composer?.selectors;
    if (!Array.isArray(selectors) || !selectors.length || typeof page?.evaluate !== 'function') return false;
    // Sites (Claude, ChatGPT) restore an unsent draft asynchronously after load: poll briefly for it.
    let draft = '';
    for (let i = 0; i < draftPolls; i++) {
      try { draft = String(await page.evaluate(composerTextExpression(selectors)) ?? ''); } catch { return false; }
      if (draft.trim()) break;
      if (i < draftPolls - 1) await new Promise(r => setTimeout(r, draftPollMs));
    }
    if (!draft.trim()) return false;
    if (!(await tabRegistry.typedKeys()).includes(typedKeyFor(draft))) return false;
    await page.evaluate(clearComposerExpression(selectors));
    return true;
  }
  async function advance(job) {
    if (job.running || job.status !== 'pending_approval') return;
    job.running = true;
    try {
      const receipt = await journal.read(job.requestId);
      if (!receipt || receipt.submitted !== 'no' || receipt.state !== 'accepted') { job.status = receipt?.state || 'failed'; return; }
      const approval = await approvals.consume(job);
      if (!approval) return;
      job.status = 'approved';
      verifyTarget(target);
      const browser = await deps.connect({ host: target.host, port: target.port });
      let page;
      if (job.threadUrl === 'new') { page = await openOwned(browser, job.provider); await clearStaleHarnessDraft(page, job.provider); }
      else {
        const targets = await browser.targets();
        const matches = targets.filter(t => t.type === 'page' && t.url === job.threadUrl);
        if (matches.length !== 1) { job.status = 'blocked'; await journal.update(job.requestId, { state: 'blocked', reason: 'EXACT_TARGET_REQUIRED' }); return; }
        page = await browser.attach(matches[0].id);
      }
      // Model step (before anything is typed): read the picker, select the requested model, verify.
      // A requested model that cannot be confirmed blocks the send; nothing has been typed yet.
      const mp = await prepareModel({ page, profile: job.provider, wanted: job.model, ...(job.effort ? { effort: job.effort } : {}) });
      if (mp.discovered && !mp.discovered.error) await registry.save(job.provider.id, mp.discovered).catch(() => {});
      if (!mp.ok) { job.status = 'blocked'; job.error = mp.error; await journal.update(job.requestId, { state: 'blocked', reason: mp.error || 'MODEL_UNAVAILABLE' }); return; }
      job.actualModel = mp.model; await journal.update(job.requestId, { model: mp.model });
      // Lane A creates its own receipt; authorize that one create against the
      // already-created, exclusively claimed receipt, without replacing it.
      let claimed = false;
      const sendJournal = { ...journal, async create(rec) {
        const existing = await journal.read(rec.requestId);
        if (!claimed && existing && existing.state === 'accepted' && existing.submitted === 'no' && existing.provider === rec.provider && existing.payloadDigest === rec.payloadDigest && existing.threadKey === rec.threadKey) { claimed = true; return { created: true, existing: null }; }
        return { created: false, existing };
      } };
      const sendApproval = { ...approval, threadUrl: job.threadUrl === 'new' ? null : job.threadUrl };
      const result = await deps.sendOnce({ page, provider: job.provider, journal: sendJournal, requestId: job.requestId, threadUrl: job.threadUrl, prompt: job.prompt, approval: sendApproval, observeTimeoutMs, readyTimeoutMs: 15000, threadUrlTimeoutMs: 10000 });
      // Remember only a hash of what was typed into an owned tab, so a later copy of this draft can be recognized.
      if (typeof page?.targetId === 'string' && (TYPED_STATES.has(result.state) || (result.state === 'blocked' && result.reason === 'TYPING_MISMATCH'))) await tabRegistry.noteTyped(page.targetId, typedKeyFor(job.prompt)).catch(() => {});
      job.status = result.state === 'observed' ? 'observed' : result.state;
      if (result.state === 'observed') {
        const reply = await deps.readReply({ page, provider: job.provider, journal, requestId: job.requestId, timeoutMs: job.replyTimeoutMs ?? 90000 });
        job.reply = reply.text; job.status = reply.complete && hasReplyText(reply.text) ? 'complete' : reply.error ? 'provider_error' : 'observed'; if (reply.error) job.error = reply.error;
      }
    } catch (error) {
      const receipt = await journal.read(job.requestId).catch(() => null);
      job.status = receipt?.submitted === 'unknown' ? 'uncertain' : 'failed'; job.error = error.message;
    } finally { job.running = false; if (job.status !== 'pending_approval') clearInterval(job.timer); }
  }
  async function result(id) {
    const job = jobs.get(id);
    if (job) { await advance(job); return { requestId: id, status: job.status, provider: job.provider.id, model: job.actualModel ?? null, ...(job.routing ? { routing: job.routing } : {}), ...(job.reply !== undefined ? { reply: job.reply } : {}), ...(job.error ? { error: job.error } : {}) }; }
    const rec = await journal.read(id); return rec ? { requestId: id, provider: rec.provider, model: rec.model ?? null, status: rec.submitted === 'unknown' ? 'uncertain' : rec.state === 'accepted' ? 'pending_approval' : rec.state } : null;
  }
  async function browserFor() { verifyTarget(target); return deps.connect({ host: target.host, port: target.port }); }
  return {
    async ask({ provider: spec, model = null, threadUrl = 'new', prompt, requestId = randomUUID(), constraints = {}, replyTimeoutMs = null }) {
      if (typeof prompt !== 'string' || !prompt.length) throw new Error('Prompt required');
      let { provider: providerId, model: specModel, effort = null } = parseModelSpec(spec); model = model || specModel;
      let routing = null;
      let executionInfo = null;
      if (providerId === 'auto') {
        if (threadUrl !== 'new') throw new Error('auto routing only starts new threads');
        const d = await decide({ task: prompt, constraints, selectModel: constraints.selectModel });
        if (!d.site) throw Object.assign(new Error('No provider available'), { code: 'NO_PROVIDER' });
        providerId = d.site;
        // The intelligent router already selected a specific model + effort; use it.
        // constraints.selectModel uses the studio policy's tiered pick (already applied in decide()).
        if (!model && d.model) model = d.model.id;
        if (!effort && d.effort) effort = d.effort;
        routing = { pattern: d.pattern, site: d.site, taskClass: d.taskClass, suggestedModel: d.model?.id ?? null, reason: d.reason, ...(d.routing ? { source: d.routing.source, ranked: d.routing.ranked } : {}) };
        executionInfo = { executionTarget: d.executionTarget, intentType: d.intentType ?? null, domain: d.domain ?? null, intentConfidence: d.intentConfidence ?? null };
      }
      const provider = await deps.getProvider(providerId); if (!provider) throw new Error('Unknown provider');
      const payloadDigest = await deps.digestPayload(prompt);
      const threadKey = await deps.threadKeyFor(provider, threadUrl);
      const created = await journal.create({ requestId, provider: provider.id, threadKey, payloadDigest, requestedModel: model, routing });
      if (!created.created) throw new Error('Request already exists');
      // Standing approval is lab-only: an attach target always needs a per-request approval.
      const s = target.mode === 'attach' ? { ok: false, reason: 'ATTACH_REQUIRES_PER_REQUEST_APPROVAL' } : await standing.check({ provider: provider.id, threadUrl, prompt });
      await approvals.request({ requestId, provider: provider.id, threadUrl, payloadDigest, preview: prompt });
      if (s.ok) { await approvals.approve(requestId); await standing.recordSend(); }
      // Dev mode (VIVIM_DEV_AUTO_APPROVE=1): the request approves itself, in lab or attach mode. Off by default.
      else if (devAutoApprove(env)) await approvals.approve(requestId);
      const job = { requestId, provider, threadUrl, payloadDigest, prompt, model, ...(effort ? { effort } : {}), routing, status: 'pending_approval', ...(replyTimeoutMs ? { replyTimeoutMs } : {}) };
      jobs.set(requestId, job);
      job.timer = setInterval(() => { void advance(job); }, pollMs); job.timer.unref();
      return { requestId, status: 'pending_approval', provider: provider.id, requestedModel: model, ...(routing ? { routing } : {}), ...(executionInfo ? { executionTarget: executionInfo.executionTarget, intentType: executionInfo.intentType, domain: executionInfo.domain, intentConfidence: executionInfo.intentConfidence } : {}) };
    }, result,
    async wait(id, timeoutMs = 30000) { const end = Date.now() + timeoutMs; do { const r = await result(id); if (!r || !['pending_approval', 'approved', 'sent', 'observed'].includes(r.status)) return r; await new Promise(resolve => setTimeout(resolve, pollMs)); } while (Date.now() < end); return result(id); },
    list: () => journal.list(), providers: () => deps.listProviders(), decide, prefs, classifyIntent,
    // Discovered models. refresh=true reads pickers read-only (an open tab on the host, else a NEW tab).
    async models({ provider: only = null, refresh = false } = {}) {
      const profiles = (await deps.listProviders()).filter(p => !only || p.id === only);
      if (refresh) {
        const browser = await browserFor();
        const targets = await browser.targets();
        for (const p of profiles) {
          if (!p.models) continue;
          try {
            const tab = targets.find(t => t.type === 'page' && p.hosts.includes(new URL(t.url).hostname));
            const page = tab ? await browser.attach(tab.id) : await openOwned(browser, p);
            const mp = await prepareModel({ page, profile: p });
            if (mp.discovered && !mp.discovered.error) await registry.save(p.id, mp.discovered); else if (process.env.WH_DEBUG) console.error(p.id, mp.error, mp.discovered?.error);
          } catch (e) { if (process.env.WH_DEBUG) console.error(p.id, e.message); /* a site that cannot be read keeps its last discovery */ }
        }
      }
      const reg = await registry.load();
      return profiles.map(p => ({ provider: p.id, label: p.label, supportsSelection: !!p.models, ...(reg[p.id] || { discoveredAt: null, current: null, currentLabel: null, models: [] }) }));
    },
    // G4: tabs the harness opened. Entries no longer live in the browser are reported as stale and pruned.
    async tabs() {
      const browser = await browserFor();
      const live = await browser.targets();
      const ids = new Set(live.map(t => t?.id));
      const all = await tabRegistry.owned();
      const stale = all.filter(t => !ids.has(t.id));
      if (stale.length) await tabRegistry.prune(live);
      return { owned: all.filter(t => ids.has(t.id)), stale };
    },
    // G4: closes only owned tabs; any other id is refused and never reaches the browser.
    async closeTabs({ ids = [] } = {}) {
      if (!Array.isArray(ids) || !ids.every(id => typeof id === 'string')) throw new TypeError('ids must be an array of strings');
      const browser = await browserFor();
      return tabRegistry.closeOwned({ browser, ids });
    },
    async status(id) { const provider = await deps.getProvider(id); if (!provider) throw new Error('Unknown provider'); return { provider: provider.id, status: provider.status }; }
  };
}
