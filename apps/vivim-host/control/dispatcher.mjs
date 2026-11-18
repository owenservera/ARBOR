// Universal Text Control — Host-only dispatcher (UTC03).
// Every surface (desktop text, phone text, GUI, AI candidate) reaches effects ONLY here:
//
//   plan(input)  → typed plan (planner) → R0 read: run now, no effect
//                                        → R1/R2: journal plan + digest, return for approval
//   execute({planId, planDigest, approval}) → verify digest, expiry, staleness, freshness
//                → exclusive approve → exclusive claim (effect fence) → executor → receipt
//
// Invariants: the model never authorizes; `!` grants nothing; an approval binds one exact
// plan digest; a claimed plan is never re-executed (crash ⇒ `uncertain`, surfaced to the
// owner); executors are fixed Host functions — no shell, SQL, URL or generated code.
import { createHash } from 'node:crypto';
import { createControlPlanner, loadControlCatalog } from './intent-planner.mjs';
import { createControlJournal, newPlanId } from './journal.mjs';
import { createLexiconStore } from './lexicon.mjs';
import { createPersonalRuleStore } from './personal-rule-store.mjs';
import { previewWikiStructure } from '../chat/product-journal.mjs';

export const DISPATCHER_SCHEMA = 'vivim.control-dispatcher/1';
export const RECEIPT_SCHEMA = 'vivim.control-receipt/1';
export const APPROVAL_CHANNELS = Object.freeze(['desktop-owner-token', 'direct-phone']);
const fail = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra });
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
const digest = o => createHash('sha256').update(JSON.stringify(stable(o))).digest('hex');
const short = (s, n) => String(s ?? '').slice(0, n);
const WIKI_ACTION = 'wiki.section.edit';
const WIKI_STRUCTURE = new Set(['wiki.page.create','wiki.page.move','wiki.pages.link']);
const wikiMutation = id => id === WIKI_ACTION || WIKI_STRUCTURE.has(id);
function structureEdit(id,args) {
  if(id==='wiki.page.create')return {action:'create-page',page:args.page};
  if(id==='wiki.page.move')return {action:'move-page',page:args.page,position:args.position};
  if(id==='wiki.pages.link')return {action:'link-pages',from:args.from,to:args.to};
  throw fail('CONTROL_ACTION_UNKNOWN');
}
function relatedPages(wiki,page) {
  const outgoing=(wiki.pages[page].links??[]).filter(p=>Object.hasOwn(wiki.pages,p));
  const incoming=Object.keys(wiki.pages).filter(p=>wiki.pages[p].links?.includes(page));
  return [...new Set([...outgoing,...incoming])].slice(0,24);
}
const WIKI_READS = new Set(['wiki.section.read', 'wiki.pages.list']);
const MAX_WIKI_LIST_PAGES = 24;
const MAX_WIKI_LIST_SECTIONS = 24;
const MAX_WIKI_CONTENT_BYTES = 3072;

// Only existing sections, resolved to their canonical names. A model cannot invent a Wiki target.
function resolveWikiTarget(wiki, target) {
  const names = typeof target === 'string' ? target.split('/') : [];
  if (names.length !== 2 || names.some(x => !x)) throw fail('CONTROL_WIKI_TARGET_UNKNOWN');
  const pages = Object.keys(wiki?.pages ?? {}).filter(k => k.toLowerCase() === names[0].toLowerCase());
  if (pages.length !== 1) throw fail('CONTROL_WIKI_TARGET_UNKNOWN');
  const page = pages[0];
  const sections = Object.keys(wiki.pages[page]?.sections ?? {}).filter(k => k.toLowerCase() === names[1].toLowerCase());
  if (sections.length !== 1) throw fail('CONTROL_WIKI_TARGET_UNKNOWN');
  const section = sections[0], before = wiki.pages[page].sections[section];
  if (!Number.isSafeInteger(wiki.revision) || typeof before !== 'string') throw fail('CONTROL_WIKI_TARGET_UNKNOWN');
  return { page, section, before, expectedRevision: wiki.revision };
}

// Error codes thrown by executors that are pure validation/precondition checks:
// nothing was attempted, so `failed` (not `uncertain`) is the correct observed state.
const VALIDATION_ERROR_CODES = new Set([
  'GRANT_REQUIRED',
  'GRANT_SCOPE',
  'OWNER_PREFERENCE_INVALID',
  'OWNER_PREFERENCE_NOT_OWNER',
  'CONTROL_WORD_RESERVED',
  'CONTROL_WORD_UNKNOWN',
  'CONTROL_TEACH_TARGET_INVALID',
  'CONTROL_LEXICON_FULL',
  'CONTROL_LEXICON_CORRUPT',
  'CONTROL_LEXICON_BUSY',
  'CONTROL_DEVICE_AUTHORITY_UNAVAILABLE',
  'GRANT_UNKNOWN',
  'GRANT_ALREADY_REVOKED',
  'CONTROL_DEVICE_SCOPE_INVALID',
  'GRANT_NOT_PENDING',
]);

/** Fixed executors keyed by catalog action id. Each returns a bounded, phone-safe summary. */
function createExecutors({ runtime, planner, lexicon, devices, productJournal }) {
  const ownerExclusions = () => (runtime.status().preferences ?? [])
    .filter(p => p.hard && p.polarity === 'avoid' && p.source === 'owner')
    .slice(0, 50).map(p => ({ id: p.id, value: short(p.value, 120) }));
  const commitStructure = async (_args,ctx) => {
    if (!productJournal || !ctx.wikiBinding?.edit) throw fail('CONTROL_WIKI_NOT_READY');
    const b=ctx.wikiBinding;
    const entry=await productJournal.append({kind:'wiki-structure',actor:'owner-browser',
      schemaVersion:1,expectedRevision:b.expectedRevision,edit:b.edit});
    const wiki=await productJournal.readPhoneWiki();
    if (wiki.revision!==b.expectedRevision+1 || entry.wikiRevision!==wiki.revision ||
        createHash('sha256').update(JSON.stringify(wiki.pages)).digest('hex')!==b.pagesDigest)
      throw fail('CONTROL_WIKI_READBACK_MISMATCH');
    return {edit:b.edit,previousRevision:b.expectedRevision,wikiRevision:wiki.revision,
      entryId:entry.entryId,sequence:entry.sequence};
  };
  return {
    'wiki.page.create':commitStructure,
    'wiki.page.move':commitStructure,
    'wiki.pages.link':commitStructure,
    'control.catalog.list': () => ({ actions: planner.describe().actions
      .map(a => ({ actionId: a.actionId, title: a.title, risk: a.risk, executable: a.executable, example: a.examples[0] })) }),
    'vivim.status.show': () => {
      const s = runtime.status();
      if (s.state !== 'ready') return { state: s.state, code: s.code ?? null };
      return { state: 'ready', phase: s.phase ?? null, theme: { preset: s.theme?.preset ?? null, revision: s.theme?.revision ?? null, status: s.theme?.status ?? null },
        granted: s.grant?.scope ?? null, counts: s.counts ?? null };
    },
    'personalization.context.summary': () => {
      const current=runtime.status();
      if(current.state!=='ready')return {state:current.state,code:current.code??null};
      // No raw claims, hard exclusions, provenance bodies or provider transcripts
      // may cross the generic R0 command surface.
      return {state:'ready',worldId:current.worldId??null,phase:current.phase??null,
        counts:{preferences:current.counts?.preferences??0,
          claims:current.counts?.claims??0,contradictions:current.counts?.contradictions??0},
        passes:(current.passes??[]).slice(0,12).map(p=>({pass:p.pass,status:p.status})),
        reviewRequired:(current.counts?.contradictions??0)>0,
        detailLocation:'Private Personal World view on your PC'};
    },
    'devices.summary': () => {
      if(!devices) return {state:'unavailable',code:'CONTROL_DEVICE_AUTHORITY_UNAVAILABLE'};
      // The mobile command catalog returns only counts. Device identities and
      // raw permissions remain in the separately owner-authenticated PC view.
      const grants=devices.listGrants();
      return {state:'source-backed',total:grants.length,
        pending:grants.filter(g=>g.status==='pending').length,
        active:grants.filter(g=>g.status==='active').length,
        revoked:grants.filter(g=>g.status==='revoked').length,
        detailLocation:'Paired phones in Host Control on your PC'};
    },
    'devices.approve': ({grant_id:grantId,scopes}) => {
      if(!devices)throw fail('CONTROL_DEVICE_AUTHORITY_UNAVAILABLE');
      if(!/^[a-f0-9]{32}$/.test(grantId))throw fail('GRANT_UNKNOWN');
      const grant=devices.listGrants().find(g=>g.grantId===grantId);
      if(!grant)throw fail('GRANT_UNKNOWN');
      if(grant.status!=='pending')throw fail('GRANT_NOT_PENDING');
      // The canonical Host chooses the scope subset; neither the mobile app
      // nor an AI candidate can introduce permissions the device never asked.
      const selected=String(scopes).split(',').map(s=>s.trim());
      if(!selected.length||selected.some(s=>!s||!grant.scopes.includes(s))||
         new Set(selected).size!==selected.length)
        throw fail('CONTROL_DEVICE_SCOPE_INVALID');
      const result=devices.approveGrant({
        grantId,approvedScopes:selected,approvedBy:'desktop-owner'
      });
      return {grantId:result.grantId,status:result.status,
        scopes:result.scopes};
    },
    'devices.revoke': ({grant_id:grantId}) => {
      if(!devices)throw fail('CONTROL_DEVICE_AUTHORITY_UNAVAILABLE');
      if(!/^[a-f0-9]{32}$/.test(grantId))throw fail('GRANT_UNKNOWN');
      const grants=devices.listGrants();
      const grant=grants.find(g=>g.grantId===grantId);
      if(!grant)throw fail('GRANT_UNKNOWN');
      if(grant.status==='revoked')throw fail('GRANT_ALREADY_REVOKED');
      return devices.revokeGrant({grantId,revokedBy:'desktop-owner'});
    },
    'ui.theme.show': () => {
      const p = runtime.projection();
      if (p.state !== 'ready') return { state: p.state, code: p.code ?? null };
      return { preset: p.preset ?? null, revision: p.revision ?? null, status: p.themeStatus ?? null, undoAvailable: p.undo?.available === true };
    },
    'personalization.preference.list': () => {
      const status=runtime.status();
      if(status.state!=='ready')return {state:status.state,code:status.code??null,preferences:[]};
      // A complete owner-editable view, never provider-inferred observations,
      // privacy hard NOs or raw model memory. The Host ledger remains authority.
      const own=(status.preferences??[]).filter(p=>
        p.source==='owner' && p.hard===false &&
        typeof p.id==='string' && p.id.startsWith('prf-owner-pref-'));
      return {state:'source-backed',total:own.length,preferences:own.slice(0,50)
        .map(p=>({id:p.id,value:short(p.value,200),
          scope:p.scope??'global',source:'owner'}))};
    },
    'personalization.preference.add': ({value}) => {
      const result=runtime.setOwnerPreference({value});
      return {id:result.id,value:short(result.value,200),source:'owner'};
    },
    'personalization.preference.remove': ({id}) => {
      const result=runtime.clearOwnerPreference({id});
      return {id:result.id,withdrawn:true,source:'owner'};
    },
    'privacy.hard_no.list': () => ({ exclusions: ownerExclusions() }),
    'ui.theme.set_preset': ({ preset }, ctx) => {
      const out = runtime.choosePreset({ preset, requestId: ctx.requestId });
      return { preset: out.preset, revision: out.revision, themeId: out.themeId };
    },
    'ui.theme.undo': (_args, ctx) => {
      const out = runtime.undoTheme({ requestId: ctx.requestId });
      return { undone: out.undone ?? null, active: out.active ?? null, provisional: out.provisional === true, replayed: out.replayed === true };
    },
    'privacy.hard_no.add': ({ trait }) => { const out = runtime.setHardNo({ trait }); return { id: out.id, value: short(out.value, 120) }; },
    'privacy.hard_no.clear': ({ id }) => { const out = runtime.clearHardNo({ id }); return { id: out.id, value: short(out.value, 120) }; },
    'control.lexicon.teach': ({ word, action }, ctx) => lexicon.teach({ word, actionId: action, planId: ctx.planId }),
    'control.lexicon.forget': ({ word }, ctx) => lexicon.forget({ word, planId: ctx.planId }),
    'wiki.pages.list': async () => {
      const wiki = await productJournal.readPhoneWiki();
      const pages = Object.entries(wiki.pages);
      return { wikiRevision: wiki.revision, total: pages.length,
        omitted: Math.max(0, pages.length - MAX_WIKI_LIST_PAGES),
        pages: pages.slice(0, MAX_WIKI_LIST_PAGES).map(([page, value]) => {
          const sections = Object.keys(value.sections);
          return { page, sections: sections.slice(0, MAX_WIKI_LIST_SECTIONS),
            omittedSections: Math.max(0, sections.length - MAX_WIKI_LIST_SECTIONS),
            ...(relatedPages(wiki,page).length ? {relatedPages:relatedPages(wiki,page)} : {}) };
        }) };
    },
    'wiki.section.read': async ({ page, section }) => {
      const wiki = await productJournal.readPhoneWiki();
      const found = resolveWikiTarget(wiki, page + '/' + section);
      return { page: found.page, section: found.section,
        wikiRevision: found.expectedRevision, content: found.before,
        ...(relatedPages(wiki,found.page).length ? {relatedPages:relatedPages(wiki,found.page)} : {}) };
    },
    [WIKI_ACTION]: async ({ content }, ctx) => {
      if (!productJournal || !ctx.wikiBinding) throw fail('CONTROL_WIKI_NOT_READY');
      const { page, section, expectedRevision } = ctx.wikiBinding;
      const entry = await productJournal.append({
        kind: 'wiki-edit', actor: 'owner-browser', schemaVersion: 1, expectedRevision,
        edit: { action: 'set-section', page, section, content }
      });
      // A durable append alone is not UI proof. Read back the same canonical
      // journal projection before informing the owner the edit is applied.
      // A failed/mismatched readback is uncertain, NEVER a reason to append again.
      const { wiki } = await productJournal.readProjection();
      if (wiki.revision !== expectedRevision + 1 ||
          wiki.pages?.[page]?.sections?.[section] !== content ||
          entry.wikiRevision !== wiki.revision)
        throw fail('CONTROL_WIKI_READBACK_MISMATCH');
      return { page, section, previousRevision: expectedRevision,
        wikiRevision: wiki.revision, content: wiki.pages[page].sections[section],
        entryId: entry.entryId, sequence: entry.sequence };
    },
  };
}

export function createControlDispatcher({ dataRoot, runtime, devices = null, productJournal = null, catalog = loadControlCatalog(),
  commandScope = () => ({}),
  now = () => Date.now(), ttlMs = 10 * 60_000, freshMs = 2 * 60_000 } = {}) {
  if (!runtime || typeof runtime.status !== 'function') throw fail('CONTROL_RUNTIME_REQUIRED');
  const iso = () => new Date(now()).toISOString();
  const lexicon = createLexiconStore({ dataRoot, catalog, now: iso });
  // Host-local private semantic state; no public write endpoint and no approval
  // verifier installed. Learning cannot acquire execution authority.
  const personalSemantics = createPersonalRuleStore({ dataRoot, catalog, now: iso });
  const planner = createControlPlanner({ catalog,
    lexicon: () => lexicon.entries(), personalRules: () => personalSemantics.accepted(),
    commandScope });
  const journal = createControlJournal({ dataRoot });
  const executors = createExecutors({ runtime, planner, lexicon, devices, productJournal });
  // The catalog may not claim an executor the Host does not have, nor hide one it does.
  for (const a of catalog.actions) {
    const runnable = ['source_wired', 'verified'].includes(a.readiness);
    if (runnable !== Object.hasOwn(executors, a.id)) throw fail('CONTROL_EXECUTOR_MISMATCH', { actionId: a.id });
  }
  const action = id => catalog.actions.find(a => a.id === id);

  function undoFor(a, args, result) {
    if (!a.undo) return null;
    const out = {};
    for (const [k, from] of Object.entries(a.undo.argFromResult ?? {})) out[k] = result?.[from];
    for (const [k, from] of Object.entries(a.undo.argFromArgs ?? {})) out[k] = args?.[from];
    return { actionId: a.undo.actionId, args: out };
  }

  function runRead(plan) {
    const complete = result => ({ ...plan, outcome: 'done', executionPerformed: true, effect: 'read', result });
    if (WIKI_READS.has(plan.actionId)) {
      if (typeof productJournal?.readPhoneWiki !== 'function')
        return { ...plan, outcome: 'unavailable', executionPerformed: false, precondition: 'Host Wiki journal unavailable.' };
      // Wiki reads share the committed, torn-tail-safe Wiki projection. Other
      // existing R0 commands retain the synchronous return contract.
      return executors[plan.actionId](plan.args).then(complete, error =>
        error?.code === 'CONTROL_WIKI_TARGET_UNKNOWN'
          ? { ...plan, outcome: 'refused', executionPerformed: false,
              refusal: { code: error.code, message: 'No unique matching Wiki section. List Wiki pages to find an existing section.' } }
          : { ...plan, outcome: 'unavailable', executionPerformed: false, precondition: 'Committed Wiki unavailable.' });
    }
    return complete(executors[plan.actionId](plan.args, { requestId: null, planId: null }));
  }

  function plan(input, { source = 'text', actor = 'owner' } = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw fail('CONTROL_INPUT_INVALID');
    const keys = Object.keys(input);
    let p;
    if (keys.length === 1 && keys[0] === 'text') p = planner.planText(input.text, { source });
    else if (keys.length === 1 && keys[0] === 'candidate') p = planner.planCandidate(input.candidate, { source });
    else if (keys.every(k => ['actionId', 'args'].includes(k))) p = planner.planTyped({ actionId: input.actionId, args: input.args ?? {}, source, origin: 'typed' });
    else throw fail('CONTROL_INPUT_INVALID');
    if (p.outcome === 'ready') return runRead(p);
    if (p.outcome !== 'approval_required') return p;
    // Sensitive R2 actions are still discoverable from mobile, but cannot be
    // approved there until native device proof and PC owner scopes are enforced.
    // Never persist an impossible, phone-approvable mutation plan.
    if (source === 'mobile' && p.risk === 'R2') return {
      ...p, outcome: 'unavailable', executionPerformed: false,
      precondition: 'Use the authenticated PC owner control for privacy-sensitive changes until verified device-bound phone approval is available.'
    };
    if (wikiMutation(p.actionId) && !productJournal) return {
      ...p, outcome: 'unavailable', executionPerformed: false,
      precondition: 'Host Wiki journal unavailable.'
    };
    // Bind a personalized reading to the exact accepted rule *and* complete store
    // snapshot. Any correction, revocation or concurrent activation makes it stale.
    let semanticRuleBinding = null;
    if (p.origin === 'personal_rule') {
      const observed = p.language?.personalRule;
      const snapshot = personalSemantics.snapshot();
      const rule = snapshot.entries.find(r => r.id === observed?.ruleId && r.state === 'accepted' &&
        r.revision === observed.ruleRevision && r.actionId === p.actionId &&
        digest(r.args) === digest(p.args));
      if (!rule) throw fail('CONTROL_SEMANTIC_RULE_STALE');
      // The context is owned by the Host callback, never by caller request fields.
      const activeScope = { ...commandScope(), surface: source };
      if (!observed.semanticScope || digest(activeScope) !== digest(observed.semanticScope))
        throw fail('CONTROL_SEMANTIC_CONTEXT_STALE');
      semanticRuleBinding = { ruleId: rule.id, ruleRevision: rule.revision,
        storeVersion: snapshot.version, storeDigest: snapshot.digest,
        scopeDigest: digest(activeScope) };
    }
    const savePlan = wikiBinding => {
      const createdAt = iso();
      const body = { schema: 'vivim.control-plan-record/1', planId: newPlanId(), actionId: p.actionId, args: p.args,
        risk: p.risk, source, origin: p.origin, actor: short(actor, 120), catalogVersion: catalog.version,
        createdAt, expiresAt: new Date(now() + ttlMs).toISOString(),
        ...(semanticRuleBinding ? { semanticRuleBinding } : {}),
        ...(wikiBinding ? { wikiBinding } : {}) };
      const record = { ...body, planDigest: digest(body) };
      journal.record(record);
      return { ...p, planId: record.planId, planDigest: record.planDigest, createdAt, expiresAt: record.expiresAt,
        ...(wikiBinding ? { preview: { target: wikiBinding.target ?? wikiBinding.page + '/' + wikiBinding.section,
          before: wikiBinding.before, after: wikiBinding.edit ? wikiBinding.after : p.args.content,
          expectedRevision: wikiBinding.expectedRevision } } : {}),
        approval: { required: true, freshOwner: p.risk === 'R2',
          channels: wikiMutation(p.actionId)
            ? [source === 'mobile' ? 'direct-phone' : 'desktop-owner-token']
            : [...APPROVAL_CHANNELS] } };
    };
    if (p.actionId === WIKI_ACTION) {
      if (Buffer.byteLength(p.args.content, 'utf8') > MAX_WIKI_CONTENT_BYTES)
        throw fail('CONTROL_WIKI_CONTENT_INVALID');
      // Existing synchronous commands retain their API. Wiki planning is asynchronous.
      return productJournal.readProjection().then(({ wiki }) =>
        savePlan(resolveWikiTarget(wiki, p.args.target)));
    }
    if (WIKI_STRUCTURE.has(p.actionId)) {
      return productJournal.readPhoneWiki().then(wiki=>
        savePlan(previewWikiStructure(wiki,structureEdit(p.actionId,p.args))));
    }
    return savePlan(null);
  }

  /** One owner decision: approve this exact digest and apply it. Never retried after claim. */
  function execute({ planId, planDigest, approval } = {}) {
    if (!approval || !APPROVAL_CHANNELS.includes(approval.channel)) throw fail('CONTROL_APPROVAL_CHANNEL');
    const rec = journal.get(planId);
    if (!rec) throw fail('CONTROL_PLAN_UNKNOWN');
    if (typeof planDigest !== 'string' || planDigest !== rec.plan.planDigest) throw fail('CONTROL_PLAN_MISMATCH');
    if (rec.receipt) return { ...rec.receipt, replayed: true };
    if (rec.claimed) throw fail('CONTROL_UNCERTAIN');
    const { planDigest: stored, ...body } = rec.plan;
    if (digest(body) !== stored) throw fail('CONTROL_PLAN_TAMPERED');
    if (now() >= Date.parse(rec.plan.expiresAt)) throw fail('CONTROL_PLAN_EXPIRED');
    // Re-derive from the CURRENT catalog: a plan cannot outlive its action's readiness/args.
    const a = action(rec.plan.actionId);
    if (!a || rec.plan.catalogVersion !== catalog.version) throw fail('CONTROL_PLAN_STALE');
    // The digest is protected by the existing Host journal and owner approval.
    // Never execute a personal-rule plan using a meaning that has since changed.
    if (rec.plan.origin === 'personal_rule') {
      const bound = rec.plan.semanticRuleBinding;
      if (!bound || typeof bound.ruleId !== 'string') throw fail('CONTROL_SEMANTIC_RULE_STALE');
      const snapshot = personalSemantics.snapshot();
      if (snapshot.version !== bound.storeVersion || snapshot.digest !== bound.storeDigest ||
        !snapshot.entries.some(r => r.id === bound.ruleId &&
          r.state === 'accepted' && r.revision === bound.ruleRevision))
        throw fail('CONTROL_SEMANTIC_RULE_STALE');
      if (digest({ ...commandScope(), surface: rec.plan.source }) !== bound.scopeDigest)
        throw fail('CONTROL_SEMANTIC_CONTEXT_STALE');
    }
    const fresh = planner.planTyped({ actionId: rec.plan.actionId, args: rec.plan.args, source: rec.plan.source, origin: rec.plan.origin });
    if (fresh.outcome !== 'approval_required' || fresh.risk !== rec.plan.risk) throw fail('CONTROL_PLAN_STALE');
    if (rec.plan.risk === 'R3') throw fail('CONTROL_R3_REFUSED');
    if (rec.plan.risk === 'R2' && approval.channel !== 'desktop-owner-token' &&
        now() - Date.parse(rec.plan.createdAt) > freshMs) throw fail('CONTROL_FRESH_APPROVAL_REQUIRED');
    // Direct-phone currently relies on the Tailscale proxy. Until per-device proof and
    // owner-confirmed privileged scopes are enforced at every Direct route, a phone
    // cannot authorize R2 privacy changes merely by being on the same network.
    if (rec.plan.risk === 'R2' && approval.channel !== 'desktop-owner-token')
      throw fail('CONTROL_DESKTOP_APPROVAL_REQUIRED');
    // An approval on a different surface cannot silently consume a mobile or desktop
    // plan. The explicit text/visual source remains accepted by the locally authenticated
    // owner path (CLI and existing visual callers).
    if (rec.plan.source === 'mobile' && approval.channel !== 'direct-phone')
      throw fail('CONTROL_APPROVAL_SOURCE_MISMATCH');
    if (rec.plan.source === 'desktop' && approval.channel !== 'desktop-owner-token')
      throw fail('CONTROL_APPROVAL_SOURCE_MISMATCH');
    if (wikiMutation(rec.plan.actionId) && rec.plan.source === 'mobile' &&
        (approval.channel !== 'direct-phone' || approval.actor !== rec.plan.actor))
      throw fail('CONTROL_WIKI_DEVICE_MISMATCH');
    if (wikiMutation(rec.plan.actionId) && rec.plan.source !== 'mobile' &&
        approval.channel !== 'desktop-owner-token')
      throw fail('CONTROL_DESKTOP_APPROVAL_REQUIRED');

    function finishEffect(result = null, cause = null) {
      // Revision conflicts are definitive pre-write CAS failures. For other
      // async journal failures, an append could have happened: never retry.
      const code = cause?.status === 409 ? 'CONTROL_WIKI_STALE' :
        cause?.code ?? 'CONTROL_EFFECT_UNCERTAIN';
      const definitive = cause?.status === 409 || VALIDATION_ERROR_CODES.has(code) ||
        (wikiMutation(rec.plan.actionId) && [400, 404, 413, 428].includes(cause?.status));
      const status = !cause ? 'applied' : definitive ? 'failed' : 'uncertain';
      const error = cause ? { code: short(code, 64), message: short(cause.message ?? cause, 200) } : null;
      const receipt = { schema: RECEIPT_SCHEMA, planId, planDigest: stored, actionId: rec.plan.actionId, args: rec.plan.args,
        risk: rec.plan.risk, source: rec.plan.source, origin: rec.plan.origin, approvedVia: approval.channel,
        status, at: iso(), executionPerformed: status === 'applied',
        ...(result ? { result } : {}), ...(error ? { error } : {}),
        ...(status === 'applied' && undoFor(a, rec.plan.args, result) ? { undo: undoFor(a, rec.plan.args, result) } : {}),
        liveAcceptance: a.readiness === 'verified' ? 'verified' : 'pending' };
      return journal.finish(planId, receipt);
    }
    function claimAndRun() {
      journal.approve(planId, { planId, planDigest: stored, channel: approval.channel,
        actor: short(approval.actor ?? 'owner', 120), at: iso() });
      if (!journal.claim(planId)) throw fail('CONTROL_UNCERTAIN');
      try {
        const output = executors[rec.plan.actionId](rec.plan.args,
          { requestId: 'utc-' + planId, planId, wikiBinding: rec.plan.wikiBinding });
        return output && typeof output.then === 'function'
          ? output.then(value => finishEffect(value), error => finishEffect(null, error))
          : finishEffect(output);
      } catch (error) { return finishEffect(null, error); }
    }
    if (WIKI_STRUCTURE.has(rec.plan.actionId)) {
      if (!productJournal || !rec.plan.wikiBinding?.edit) throw fail('CONTROL_WIKI_NOT_READY');
      return productJournal.readPhoneWiki().then(wiki=>{
        const bound=rec.plan.wikiBinding;
        if(wiki.revision!==bound.expectedRevision)throw fail('CONTROL_WIKI_STALE');
        const current=previewWikiStructure(wiki,structureEdit(rec.plan.actionId,rec.plan.args));
        if(digest(current)!==digest(bound))throw fail('CONTROL_WIKI_STALE');
        return claimAndRun();
      });
    }
    if (rec.plan.actionId === WIKI_ACTION) {
      if (!productJournal || !rec.plan.wikiBinding) throw fail('CONTROL_WIKI_NOT_READY');
      // Check before claiming; the journal's append queue repeats CAS after claim.
      return productJournal.readProjection().then(({ wiki }) => {
        const current = resolveWikiTarget(wiki, rec.plan.args.target);
        const bound = rec.plan.wikiBinding;
        if (current.page !== bound.page || current.section !== bound.section ||
            current.before !== bound.before || current.expectedRevision !== bound.expectedRevision)
          throw fail('CONTROL_WIKI_STALE');
        return claimAndRun();
      });
    }
    return claimAndRun();
  }

  function status(planId) {
    const rec = journal.get(planId);
    if (!rec) throw fail('CONTROL_PLAN_UNKNOWN');
    return { planId, state: rec.state, actionId: rec.plan.actionId, risk: rec.plan.risk, args: rec.plan.args,
      createdAt: rec.plan.createdAt, expiresAt: rec.plan.expiresAt, receipt: rec.receipt,
      ...(rec.state === 'uncertain' ? { note: 'Effect was claimed but no receipt was recorded. It will not be retried; inspect locally before deciding again.' } : {}) };
  }

  return {
    schema: DISPATCHER_SCHEMA,
    describe: () => planner.describe(),
    world: () => planner.world(),
    languagePack: () => planner.languagePack(),
    interpret: (text, { source = 'text' } = {}) => planner.interpretText(text, { source }),
    lexicon: () => ({ version: lexicon.version(), entries: lexicon.entries() }),
    personalSemantics: () => { const {version, digest: stateDigest, entries} = personalSemantics.snapshot();
      return {schema:'vivim.personal-semantic-projection/1',version,digest:stateDigest,
        rules:entries.map(r=>({id:r.id, revision:r.revision, state:r.state, scope:r.scope,
          actionId:r.actionId, catalogVersion:r.catalogVersion}))}; },
    plan, execute, status, recent: limit => journal.recent(limit),
  };
}
