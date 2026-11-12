// The routing "brain": Studio's pure ai-router policy (task classes, patterns, provider order,
// performance-based ranking) made aware of the harness's providers and discovered models.
// The harness router (router.mjs) stays the only send path; this module never touches a browser.
// It exposes the same { route, learnInput } shape that studio's ai-orchestrator injects as its router.
import { route as studioRoute, classifyTask, explain } from '../../../studio/src/studio/ai-router.mjs';
import { pickModelForTask } from '../core/models.mjs';

export { classifyTask, explain };

// Harness journal records -> per-site stats in the shape studio's route() ranks on.
export function statsFromJournal(records = []) {
  const by = new Map();
  for (const r of records) {
    if (!r?.provider) continue;
    const s = by.get(r.provider) || { jobs: 0, completed: 0, failed: 0, uncertain: 0, skipped: 0, medianMs: null, p90Ms: null, lastErrorAt: null, lastState: null, lastReason: null, lastAt: '' };
    s.jobs++;
    if (r.state === 'observed') s.completed++;
    else if (r.submitted === 'unknown' || r.state === 'uncertain') s.uncertain++;
    else if (r.state === 'blocked') s.skipped++;
    else if (r.state === 'failed') { s.failed++; s.lastErrorAt = r.updatedAt || null; }
    if ((r.updatedAt || '') >= s.lastAt) { s.lastAt = r.updatedAt || ''; s.lastState = r.state; s.lastReason = r.reason || null; }
    by.set(r.provider, s);
  }
  return by;
}

// Studio-compatible learnInput: providers[] = [{ site, signedIn, tabOpen, stats, models }].
// signedIn is evidence-based: a successful model discovery means signed in; a latest AUTH_WALL means not.
export async function learnInput({ records = [], registry = {}, profiles = [] } = {}) {
  const stats = statsFromJournal(records);
  return profiles.map(p => {
    const st = stats.get(p.id) || null; const reg = registry[p.id] || null;
    const authWalled = st?.lastReason === 'AUTH_WALL';
    return { site: p.id, signedIn: authWalled ? false : reg ? true : null, tabOpen: false, stats: st, models: reg?.models || [] };
  });
}

// One decision: studio policy picks the site (harness sends once, so maxSends is pinned to 1);
// the harness tier hints pick a model among the models actually discovered on that site.
export function route({ task, role = null, constraints = {}, providers = [], profiles = [], registry = {} } = {}) {
  const usable = providers.filter(p => p.signedIn !== false);
  const d = studioRoute({ task, role, constraints: { ...constraints, maxSends: 1 }, providers: usable });
  const site = d.sites?.[0] ?? null; const cls = d.options?.taskClass ?? null;
  const profile = profiles.find(p => p.id === site);
  const pick = site ? pickModelForTask(profile, registry[site], cls) : { model: null, tier: null };
  return { ...d, site, taskClass: cls, model: pick.model, modelTier: pick.tier };
}
