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
import { PERSONAL_RULE_SCHEMA, validatePersonalRule, TEMPLATE_SCHEMA, templateAlias, templateDependencies, bindPersonalRule, currentTemplate, bindPersonalWriteProgram, compatibleRuleCatalog } from './personal-semantics.mjs';
import { interpretControl, resolveLocalDestination, resolveDesktopDestination } from '../../mobile-relay/control-language.mjs';
import { previewWikiStructure, previewWikiCapture, validateProductEdit, previewWikiPayload } from '../chat/product-journal.mjs';
import { wikiApprovalSentence } from './command-intent.mjs';
import { createNativeProgramValidator } from './native-program.mjs';
import { runWikiReadProgram,compileWikiReadRecipe,validWikiRecipe,compileWikiWriteRecipe,validWikiWriteRecipe } from './wiki-read-program.mjs';

export const DISPATCHER_SCHEMA = 'vivim.control-dispatcher/1';
export const RECEIPT_SCHEMA = 'vivim.control-receipt/1';
export const APPROVAL_CHANNELS = Object.freeze(['desktop-owner-token', 'direct-phone']);
const fail = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra });
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
const digest = o => createHash('sha256').update(JSON.stringify(stable(o))).digest('hex');
const short = (s, n) => String(s ?? '').slice(0, n);
const RULE_ACTIONS = new Set(['control.rule.remember','control.rule.revoke']);
const rawDigest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const phraseKey = value => value.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
// Only fixed, local, source-wired commands. No security, provider, lexicon,
// arbitrary code, nested learning, destructive or external-effect capability.
const LEARNABLE = new Set(['wiki.pages.list','wiki.section.read','wiki.page.create',
  'wiki.section.edit','wiki.page.move','wiki.pages.link','ui.theme.show','ui.theme.set_preset',
  'vivim.status.show']);
const WIKI_ACTION = 'wiki.section.edit';
const CAPTURE_ACTION='wiki.capture.save';
const NATIVE_PROGRAM_ACTION='program.validate';
const WIKI_READ_PROGRAM_ACTION='program.read_wiki';
const WIKI_WRITE_PROGRAM_ACTION='program.write_wiki';
const HVI_ACTION='versions.compare.pinned';
// A typed VEC document is not an NL action or a string argument. Keep the existing
// language catalog stable (including accepted learned rules); the visual contract
// has its own version and uses the very same control plan journal and claim.
const VISUAL_ACTION='ui.visual.apply';
const VISUAL_CONTRACT=Object.freeze({id:VISUAL_ACTION,risk:'R1',readiness:'source_wired',
  schema:'vivim.ui-proposal/1',revision:1});
const WIKI_STRUCTURE = new Set(['wiki.page.create','wiki.page.move','wiki.pages.link']);
const wikiMutation = id => id === WIKI_ACTION || id===CAPTURE_ACTION || id===WIKI_WRITE_PROGRAM_ACTION || WIKI_STRUCTURE.has(id);
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
  'PERSONAL_STORE_STALE','PERSONAL_STORE_CONFLICT','PERSONAL_STORE_FULL','PERSONAL_STORE_BAD_TRANSITION',
  'PERSONAL_STORE_OWNER_APPROVAL_REQUIRED','CONTROL_RULE_STALE',
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

function readWikiPages(wiki) {
      const pages = Object.entries(wiki.pages);
      return { wikiRevision: wiki.revision, total: pages.length,
        omitted: Math.max(0, pages.length - MAX_WIKI_LIST_PAGES),
        pages: pages.slice(0, MAX_WIKI_LIST_PAGES).map(([page, value]) => {
          const sections = Object.keys(value.sections);
          return { page, sections: sections.slice(0, MAX_WIKI_LIST_SECTIONS),
            omittedSections: Math.max(0, sections.length - MAX_WIKI_LIST_SECTIONS),
            ...(relatedPages(wiki,page).length ? {relatedPages:relatedPages(wiki,page)} : {}) };
        }) };
}
function readWikiSection(wiki,{page,section}) {
      const found = resolveWikiTarget(wiki, page + '/' + section);
      return { page: found.page, section: found.section,
        wikiRevision: found.expectedRevision, content: found.before,
        ...(relatedPages(wiki,found.page).length ? {relatedPages:relatedPages(wiki,found.page)} : {}) };
}

/** Fixed executors keyed by catalog action id. Each returns a bounded, phone-safe summary. */
function createExecutors({ runtime, planner, lexicon, devices, productJournal, personalSemantics, nativeProgram }) {
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
    'control.rule.remember': (_args,ctx) =>
      personalSemantics.remember({subject:ctx.ruleBinding.subject,approval:{receiptId:ctx.planId}}),
    'control.rule.revoke': (_args,ctx) =>
      personalSemantics.transition({ruleId:ctx.ruleBinding.subject.ruleId,nextState:'revoked',
        expectedVersion:ctx.ruleBinding.subject.storeVersion,approval:{receiptId:ctx.planId}}),
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
    'wiki.pages.list': async () => readWikiPages(await productJournal.readPhoneWiki()),
    'wiki.section.read': async args => readWikiSection(await productJournal.readPhoneWiki(),args),
    [WIKI_READ_PROGRAM_ACTION]:(args,ctx={})=>runWikiReadProgram({commands:args.commands,recipe:ctx.recipe??null,catalog:planner.catalog,
      planTyped:step=>planner.planTyped({...step,source:'desktop'}),stillCurrent:ctx.stillCurrent??(()=>true),
      planCommand:text=>planner.planText(text,{source:'desktop'}),readWiki:()=>productJournal.readPhoneWiki(),nativeProgram,
      readEvidence:(targets,revision)=>productJournal.readProgramEvidence(targets,revision),
      resolveTarget:(plan,wiki)=>{const hit=resolveWikiTarget(wiki,plan.args.page+'/'+plan.args.section);return {page:hit.page,section:hit.section};},
      readAction:(plan,wiki)=>plan.actionId==='wiki.pages.list'?readWikiPages(wiki):readWikiSection(wiki,plan.args)}),
    [WIKI_WRITE_PROGRAM_ACTION]:async (_args,ctx)=>{
      const bound=ctx.wikiBinding;if(!bound||!productJournal?.appendWikiSequence)throw fail('CONTROL_WIKI_NOT_READY');
      const observed=await productJournal.appendWikiSequence(bound.steps.map(s=>s.payload),bound.pagesDigest,{planId:ctx.planId,planDigest:ctx.planDigest});
      if(observed.wikiRevision!==bound.finalRevision||observed.entries.length!==bound.steps.length||observed.pagesDigest!==bound.pagesDigest)throw fail('CONTROL_WIKI_READBACK_MISMATCH');
      return {...observed,schema:'vivim.wiki-change-result/1',nativeProgramDigest:bound.nativeProgramDigest,sequenceVerified:true};
    },
    [HVI_ACTION]:(args,ctx)=>ctx.readHvi(args.selection),
    [NATIVE_PROGRAM_ACTION]:args=>nativeProgram(args),
    [CAPTURE_ACTION]: async ({content},ctx)=>{
      const b=ctx.wikiBinding;if(!productJournal||!b?.edit)throw fail('CONTROL_WIKI_NOT_READY');
      const entry=await productJournal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:b.expectedRevision,edit:b.edit});
      const wiki=await productJournal.readPhoneWiki();
      if(wiki.revision!==b.expectedRevision+1||entry.wikiRevision!==wiki.revision||wiki.pages?.[b.page]?.sections?.[b.section]!==content||
         (b.edit.action==='capture-task'&&wiki.pages[b.page].sections.Status!=='Open'))throw fail('CONTROL_WIKI_READBACK_MISMATCH');
      return {page:b.page,section:b.section,content,previousRevision:b.expectedRevision,wikiRevision:wiki.revision,entryId:entry.entryId,sequence:entry.sequence};
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
  nativeProgram=createNativeProgramValidator({productJournal}),
  now = () => Date.now(), ttlMs = 10 * 60_000, freshMs = 2 * 60_000 } = {}) {
  if (!runtime || typeof runtime.status !== 'function') throw fail('CONTROL_RUNTIME_REQUIRED');
  const iso = () => new Date(now()).toISOString();
  const lexicon = createLexiconStore({ dataRoot, catalog, now: iso });
  const journal = createControlJournal({ dataRoot });
  // Only the exact claimed Host learning plan can authorize its store CAS.
  // No caller/model-supplied approval object ever becomes this verifier.
  let activeRuleCommit=null;
  const personalSemantics = createPersonalRuleStore({ dataRoot, catalog, now: iso,
    verifyOwnerApproval: (approval,subject) => {
      if(!activeRuleCommit||approval?.receiptId!==activeRuleCommit)return false;
      const rec=journal.get(activeRuleCommit);
      return !!(rec?.claimed&&!rec.receipt&&rec.plan.source==='desktop'&&
        RULE_ACTIONS.has(rec.plan.actionId)&&rec.approval?.channel==='desktop-owner-token'&&
        rec.approval.actor==='desktop-owner'&&rec.approval.planDigest===rec.plan.planDigest&&
        digest(rec.plan.ruleBinding?.subject)===digest(subject));
    } });
  const planner = createControlPlanner({ catalog,
    lexicon: () => lexicon.entries(), personalRules: () => personalSemantics.accepted(),
    commandScope });
  const executors = createExecutors({ runtime, planner, lexicon, devices, productJournal, personalSemantics,nativeProgram });
  // The catalog may not claim an executor the Host does not have, nor hide one it does.
  for (const a of catalog.actions) {
    const runnable = ['source_wired', 'verified'].includes(a.readiness);
    if (runnable !== Object.hasOwn(executors, a.id)) throw fail('CONTROL_EXECUTOR_MISMATCH', { actionId: a.id });
  }
  const action = id => id===VISUAL_ACTION?VISUAL_CONTRACT:catalog.actions.find(a => a.id === id);

  function visualBinding(proposal,source,actor,grantId){
    if(typeof runtime.previewUiProposal!=='function'||typeof runtime.applyUiProposal!=='function')
      throw fail('CONTROL_VISUAL_NOT_READY');
    const current=runtime.previewUiProposal(proposal);
    const manifest={schema:'vivim.approval-meaning/1',templateRevision:VISUAL_CONTRACT.revision,
      catalogRevision:catalog.version,worldRevision:planner.world().v,
      contractDigest:digest(VISUAL_CONTRACT),actionId:VISUAL_ACTION,risk:'R1',readiness:'source_wired',
      source,actor,deviceGrantId:grantId,worldId:current.worldId,target:current.preview.surfaceId,
      targetRevision:current.preview.baseRevision,baseDigest:digest(current.surface),
      proposalDigest:current.preview.proposalDigest,previewDigest:current.preview.previewDigest,
      projectionDigest:current.projectionDigest,grantDigest:current.grantDigest,
      effectDigest:digest({proposal,preview:current.preview.surface}),authority:'none'};
    return {current,meaning:{...manifest,semanticDigest:digest(manifest)}};
  }
  function planVisual(proposal,{source,actor,grantId}){
    if(source!=='mobile'||typeof actor!=='string'||!actor||typeof grantId!=='string'||!grantId)
      throw fail('CONTROL_VISUAL_DEVICE_REQUIRED');
    if(!proposal||typeof proposal!=='object'||Array.isArray(proposal))throw fail('CONTROL_INPUT_INVALID');
    const {current,meaning}=visualBinding(proposal,source,actor,grantId);
    const createdAt=iso(),body={schema:'vivim.control-plan-record/1',planId:newPlanId(),
      actionId:VISUAL_ACTION,args:{surfaceId:meaning.target,proposalDigest:meaning.proposalDigest},
      risk:'R1',source,origin:'typed-vec',actor,catalogVersion:catalog.version,createdAt,
      expiresAt:new Date(now()+ttlMs).toISOString(),visualProposal:proposal,approvalMeaning:meaning};
    const record={...body,planDigest:digest(body)};
    journal.record(record);
    return {schema:'vivim.control-plan/1',outcome:'approval_required',actionId:VISUAL_ACTION,
      title:'Apply exact visual proposal',args:body.args,risk:'R1',executionPerformed:false,
      requiresApproval:true,planId:record.planId,planDigest:record.planDigest,createdAt,
      expiresAt:record.expiresAt,approvalMeaning:meaning,visualPreview:current.preview,
      approval:{required:true,channels:['direct-phone']}};
  }

  // Exact resolved values, not a client-rendered paraphrase.
  async function previewWriteSequence(commands,wiki,typedSteps=null){
    const lines=String(commands).split(/\r?\n/).map(s=>s.trim());
    if(lines.length<2||lines.length>8||lines.some(s=>!s||s.length>240))throw fail('CONTROL_PROGRAM_INPUT_INVALID');
    let projected={revision:wiki.revision,pages:wiki.pages};const steps=[];
    if(typedSteps&&typedSteps.length!==lines.length)throw fail('CONTROL_PROGRAM_CHILD_REFUSED');
    for(const [index,line] of lines.entries()){
      const p=typedSteps?planner.planTyped({...typedSteps[index],source:'desktop'}):planner.planText(line,{source:'desktop'});
      if(p.outcome!=='approval_required'||p.origin!==(typedSteps?'typed':'deterministic')||p.risk!=='R1'||!(p.actionId===WIKI_ACTION||WIKI_STRUCTURE.has(p.actionId)))throw fail('CONTROL_PROGRAM_CHILD_REFUSED');
      let binding,payload;
      if(p.actionId===WIKI_ACTION){binding=resolveWikiTarget(projected,p.args.target);payload={kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:projected.revision,edit:{action:'set-section',page:binding.page,section:binding.section,content:p.args.content}};binding={...binding,target:binding.page+'/'+binding.section,after:p.args.content};}
      else {binding=previewWikiStructure(projected,structureEdit(p.actionId,p.args));payload={kind:'wiki-structure',actor:'owner-browser',schemaVersion:1,expectedRevision:projected.revision,edit:binding.edit};}
      projected=previewWikiPayload(projected,payload);
      steps.push({actionId:p.actionId,args:p.args,contractDigest:digest(action(p.actionId)),target:binding.target,before:binding.before,after:binding.after,payload});
    }
    const pagesDigest=rawDigest(projected.pages),baseDigest=rawDigest(wiki.pages),programId='wiki-change-'+digest({baseDigest,steps,pagesDigest}).slice(0,24);
    // Native policy validates the inert dependency program only; R1 effects remain Host-owned.
    const nativeSteps=steps.map((_,i)=>({id:'change-'+(i+1),kind:'compile',dependencies:i?['change-'+i]:[],inputs:[],output_data_class:'private',risk:'R0',destination:null}));
    const checked=await nativeProgram({program:JSON.stringify({id:programId,revision:1,steps:nativeSteps})});
    if(checked?.outcome!=='compiled'||checked.programId!==programId||checked.programRevision!==1||checked.executionAuthorized!==false||checked.effectPerformed!==false||!/^[a-f0-9]{64}$/.test(checked.programDigest??'')||digest(checked.orderedStepIds)!==digest(nativeSteps.map(s=>s.id)))throw fail('CONTROL_PROGRAM_NATIVE_UNAVAILABLE');
    const latest=await productJournal.readPhoneWiki();if(latest.revision!==wiki.revision||rawDigest(latest.pages)!==baseDigest)throw fail('CONTROL_WIKI_STALE');
    return {schema:'vivim.wiki-change-preview/1',target:'Wiki change sequence',expectedRevision:wiki.revision,finalRevision:projected.revision,baseDigest,pagesDigest,nativeProgramDigest:checked.programDigest,steps,
      before:steps.map((s,i)=>(i+1)+'. '+s.target+'\n'+s.before).join('\n\n'),after:steps.map((s,i)=>(i+1)+'. '+s.target+'\n'+s.after).join('\n\n')};
  }
  function approvalBinding(actionId,args,source,wikiBinding){
    const a=action(actionId);
    if(actionId===WIKI_WRITE_PROGRAM_ACTION){const manifest={schema:'vivim.approval-meaning/1',templateRevision:1,catalogRevision:catalog.version,worldRevision:planner.world().v,actionId,risk:a.risk,readiness:a.readiness,contractDigest:digest(a),source,exactArgs:args,resolvedArgs:wikiBinding.steps.map(s=>({actionId:s.actionId,args:s.args})),targetRevision:wikiBinding.expectedRevision,target:wikiBinding.target,effectDigest:digest(wikiBinding),roundTrip:'unavailable',childCompilation:'verified',authority:'none'};return {...manifest,semanticDigest:digest(manifest)};}
    const resolved=actionId===CAPTURE_ACTION?{...args,page:wikiBinding.page,section:wikiBinding.section}:
      actionId===WIKI_ACTION?{target:wikiBinding.page+'/'+wikiBinding.section,content:args.content}:
      actionId==='wiki.pages.link'?{from:wikiBinding.edit.from,to:wikiBinding.edit.to}:
      actionId==='wiki.page.move'?{page:wikiBinding.edit.page,position:wikiBinding.edit.position}:
      {page:wikiBinding.edit.page};
    const normalize=values=>Object.fromEntries(Object.entries(values).map(([key,value])=>
      [key,['target','from','to','page'].includes(key)&&actionId!=='wiki.page.create'?
        value.toLowerCase():value]));
    const sentence=wikiApprovalSentence(actionId,resolved);
    const worldRevision=planner.world().v;
    let roundTrip=false,engineVersion=null;
    if(sentence&&sentence.length<=1000){
      try{
        const parsed=planner.planText(sentence,{source});
        roundTrip=parsed.outcome==='approval_required'&&parsed.origin==='deterministic'&&
          parsed.actionId===actionId&&digest(normalize(parsed.args))===digest(normalize(resolved));
        engineVersion=roundTrip?parsed.language?.vec?.proposal?.provenance?.engineVersion??null:null;
      }catch{/* exact typed preview remains available; do not assert parser coverage */}
    }
    const manifest={schema:'vivim.approval-meaning/1',templateRevision:1,
      catalogRevision:catalog.version,worldRevision,compilerRevision:engineVersion,
      actionId,risk:a.risk,readiness:a.readiness,contractDigest:digest(a),
      source,exactArgs:args,resolvedArgs:resolved,targetRevision:wikiBinding.expectedRevision,
      target:wikiBinding.target??wikiBinding.page+'/'+wikiBinding.section,
      effectDigest:digest(wikiBinding),requiredScopes:a.requiredScopes??[],
      precondition:a.precondition??null,roundTrip:roundTrip?'verified':'unavailable',
      sentence:roundTrip?sentence:null,authority:'none'};
    return {...manifest,semanticDigest:digest(manifest)};
  }
  function checkApprovalBinding(record,wikiBinding){
    if(!record.approvalMeaning)throw fail('CONTROL_PLAN_STALE');
    if(digest(approvalBinding(record.actionId,record.args,record.source,wikiBinding))!==
        digest(record.approvalMeaning))throw fail('CONTROL_PLAN_STALE');
    // A scope may change independently of the vocabulary world while the
    // asynchronous Wiki read is pending. Check learned-rule authority again.
    if(record.origin==='personal_rule'){
      const bound=record.semanticRuleBinding,snapshot=personalSemantics.snapshot();
      if(!bound||snapshot.version!==bound.storeVersion||snapshot.digest!==bound.storeDigest||
        !snapshot.entries.some(r=>r.id===bound.ruleId&&r.state==='accepted'&&r.revision===bound.ruleRevision))
        throw fail('CONTROL_SEMANTIC_RULE_STALE');
      if(digest({...commandScope(),surface:record.source})!==bound.scopeDigest)
        throw fail('CONTROL_SEMANTIC_CONTEXT_STALE');
      const rule=snapshot.entries.find(r=>r.id===bound.ruleId);
      if(rule?.writeProgram){const steps=bindPersonalWriteProgram(rule,bound.invocation,catalog);
        if(!steps||digest(rule.writeProgram)!==bound.writeProgramDigest||digest(steps)!==bound.boundStepsDigest)throw fail('CONTROL_SEMANTIC_RULE_STALE');}
      if(rule?.template&&(!templateReceiptCurrent(rule)||!currentTemplate(rule,catalog)||digest(rule.template)!==bound.templateDigest||
        digest(bindPersonalRule(rule,bound.invocation,catalog))!==digest(record.args)))
        throw fail('CONTROL_SEMANTIC_RULE_STALE');
    }
    if(now()>=Date.parse(record.expiresAt))throw fail('CONTROL_PLAN_EXPIRED');
  }

  function templateReceiptCurrent(rule){
    if(!rule?.template)return true;
    const rec=journal.get(rule.template.receiptId);
    const {planDigest,...body}=rec?.plan??{};
    return !!(rec?.claimed&&rec.receipt?.status==='applied'&&rec.receipt.executionPerformed===true&&
      typeof planDigest==='string'&&digest(body)===planDigest&&
      rec.approval?.planDigest===planDigest&&rec.approval.channel==='desktop-owner-token'&&
      rec.plan.source==='desktop'&&rec.plan.actor==='desktop-owner'&&
      rec.plan.actionId===rule.actionId&&rec.receipt.planDigest===planDigest&&
      rec.receipt.semanticDigest===rule.template.sourceSemanticDigest&&
      rec.receipt.result?.entryId===rule.template.sourceEntryId&&
      digest(rec.receipt)===rule.template.receiptDigest);
  }
  function prepareRuleBinding(actionId,args) {
    const snapshot=personalSemantics.snapshot();
    if(actionId==='control.rule.revoke'){
      const old=snapshot.entries.find(r=>r.id===args.rule_id&&['accepted','proposed','suspended'].includes(r.state));
      if(!old)throw fail('CONTROL_RULE_UNKNOWN');
      return {subject:{ruleId:old.id,ruleDigest:rawDigest(old),nextState:'revoked',
        storeVersion:snapshot.version,catalogVersion:catalog.version},before:old,after:{...old,state:'revoked'}};
    }
    const share=/^share with paired phones:[ \t]*\r?\n([\s\S]+)$/.exec(args.command);
    const command=share?share[1]:args.command;
    const scope={...commandScope(),surface:share?'mobile':'desktop'};
    // Canonical commands, safety refusals and local navigation retain precedence.
    if(resolveLocalDestination(args.phrase)||resolveDesktopDestination(args.phrase)||
        interpretControl(args.phrase,{catalog,world:planner.world()}).outcome!=='interpretation_required')
      throw fail('CONTROL_RULE_PHRASE_NOT_FREE');
    let rule,targetRisk;
    // Explicit receipt reference in the existing typed remember command.
    // Never interpret arbitrary transcript text as a successful execution.
    if(command.startsWith('receipt:')){
      if(share)throw fail('CONTROL_RULE_TARGET_INVALID');
      const id=command.slice(8);
      if(!templateAlias(args.phrase)||!/^ctl-[a-f0-9]{16}$/.test(id))throw fail('CONTROL_RULE_TARGET_INVALID');
      const rec=journal.get(id),p=rec?.plan,r=rec?.receipt;
      const {planDigest,...body}=p??{};
      const deps=templateDependencies(catalog);
      if(!deps||!p||!r||!p.wikiBinding?.edit||!r.result?.edit||!rec.claimed||rec.approval?.planDigest!==planDigest||
        p.actionId!=='wiki.page.create'||p.source!=='desktop'||p.actor!=='desktop-owner'||
        p.catalogVersion!==catalog.version||digest(body)!==planDigest||r.planDigest!==planDigest||
        r.planId!==id||r.actionId!==p.actionId||r.status!=='applied'||r.executionPerformed!==true||
        r.approvedVia!=='desktop-owner-token'||rec.approval.channel!=='desktop-owner-token'||
        p.approvalMeaning?.roundTrip!=='verified'||p.approvalMeaning.contractDigest!==digest(action(p.actionId))||
        r.semanticDigest!==p.approvalMeaning.semanticDigest||
        digest(r.result?.edit)!==digest(p.wikiBinding?.edit)||
        r.result?.wikiRevision!==p.wikiBinding.expectedRevision+1||
        r.result?.previousRevision!==p.wikiBinding.expectedRevision||
        !r.result?.entryId||r.result.edit.page!==p.args.page)throw fail('CONTROL_RULE_TARGET_INVALID');
      rule={phrase:args.phrase,actionId:p.actionId,args:{page:p.args.page},scope,
        template:{schema:TEMPLATE_SCHEMA,receiptId:id,receiptDigest:digest(r),
          sourceSemanticDigest:r.semanticDigest,sourceEntryId:r.result.entryId,
          slot:{name:'page',type:'wiki-page-slug',provenance:'owner-selected-receipt-argument'},
          dependencies:deps,privacy:'pc-only'}};
      targetRisk='R1';
      // Verify example invocation is not a canonical command or refusal.
      if(interpretControl(rule.phrase+' '+rule.args.page,{catalog,world:planner.world()}).outcome!=='interpretation_required')
        throw fail('CONTROL_RULE_PHRASE_NOT_FREE');
    }else{
      const parameter=/^parameterize page ([a-z][a-z0-9-]{0,62}):[ \t]*\r?\n([\s\S]+)$/.exec(command);
      const target=planner.planText(parameter?parameter[2]:command,{source:'desktop'});
      if(target.origin!=='deterministic'||(!LEARNABLE.has(target.actionId)&&![WIKI_READ_PROGRAM_ACTION,WIKI_WRITE_PROGRAM_ACTION].includes(target.actionId))||
         !['ready','approval_required'].includes(target.outcome)||!['R0','R1'].includes(target.risk))
        throw fail('CONTROL_RULE_TARGET_INVALID');
      if(share&&![WIKI_WRITE_PROGRAM_ACTION,WIKI_READ_PROGRAM_ACTION].includes(target.actionId))throw fail('CONTROL_RULE_TARGET_INVALID');
      if(parameter&&(target.actionId!==WIKI_WRITE_PROGRAM_ACTION||!templateAlias(args.phrase)))throw fail('CONTROL_RULE_TARGET_INVALID');
      rule={phrase:args.phrase,actionId:target.actionId,args:target.args,scope};
      if(target.actionId===WIKI_WRITE_PROGRAM_ACTION){
        const recipe=compileWikiWriteRecipe(target.args.commands,text=>planner.planText(text,{source:'desktop'}),catalog,parameter?parameter[1]:null);
        if(!recipe)throw fail('CONTROL_RULE_TARGET_INVALID');rule.writeProgram=recipe;
        if(parameter&&interpretControl(args.phrase+' '+parameter[1],{catalog,world:planner.world()}).outcome!=='interpretation_required')throw fail('CONTROL_RULE_PHRASE_NOT_FREE');
      }
      if(target.actionId===WIKI_READ_PROGRAM_ACTION){
        const recipe=compileWikiReadRecipe(target.args.commands,text=>planner.planText(text,{source:'desktop'}),catalog);
        if(!recipe)throw fail('CONTROL_RULE_TARGET_INVALID');rule.readProgram=recipe;
      }
      targetRisk=target.risk;
    }
    if(!validatePersonalRule({schema:PERSONAL_RULE_SCHEMA,id:'rule:validation',revision:1,
      ...rule,state:'accepted',source:'explicit-owner',catalogVersion:catalog.version},catalog).ok)
      throw fail('CONTROL_RULE_TARGET_INVALID');
    const matches=snapshot.entries.filter(r=>r.state==='accepted'&&phraseKey(r.phrase)===phraseKey(rule.phrase)&&
      rawDigest(r.scope)===rawDigest(scope));
    if(matches.length>1)throw fail('PERSONAL_STORE_CONFLICT');
    const old=matches[0]??null;
    return {subject:{operation:'remember',storeVersion:snapshot.version,storeDigest:snapshot.digest,
      catalogVersion:catalog.version,rule,previousId:old?.id??null,previousDigest:old?rawDigest(old):null},
      before:old,after:rule,targetRisk};
  }

  function undoFor(a, args, result) {
    if (!a.undo) return null;
    const out = {};
    for (const [k, from] of Object.entries(a.undo.argFromResult ?? {})) out[k] = result?.[from];
    for (const [k, from] of Object.entries(a.undo.argFromArgs ?? {})) out[k] = args?.[from];
    return { actionId: a.undo.actionId, args: out };
  }

  function runRead(plan,{readHvi=null,recipe=null,stillCurrent=()=>true}={}) {
    const complete = result => ({ ...plan, outcome: 'done', executionPerformed: true, effect: 'read', result });
    if(plan.actionId===HVI_ACTION)return Promise.resolve(executors[plan.actionId](plan.args,{readHvi})).then(complete);
    if(plan.actionId===WIKI_READ_PROGRAM_ACTION)return Promise.resolve(executors[plan.actionId](plan.args,{recipe,stillCurrent})).then(result=>
      result.outcome==='completed'?complete(result):{...plan,outcome:result.outcome,executionPerformed:false,result,refusal:{code:result.reasonCode,message:'Wiki read sequence '+result.outcome+': '+result.reasonCode}});
    if(plan.actionId===NATIVE_PROGRAM_ACTION)return Promise.resolve(executors[plan.actionId](plan.args)).then(result=>
      result.outcome==='compiled'?complete(result):{...plan,outcome:result.outcome,executionPerformed:false,result,refusal:{code:result.reasonCode,message:'Native program '+result.outcome+': '+result.reasonCode}});
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

  function plan(input, { source = 'text', actor = 'owner', grantId = null, readHvi=null, authorizeProgram=null } = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw fail('CONTROL_INPUT_INVALID');
    const keys = Object.keys(input);
    if(keys.length===1&&keys[0]==='visualProposal')return planVisual(input.visualProposal,{source,actor,grantId});
    let p;
    if (keys.length === 1 && keys[0] === 'text') p = planner.planText(input.text, { source });
    else if (keys.length === 1 && keys[0] === 'candidate') p = planner.planCandidate(input.candidate, { source });
    else if (keys.every(k => ['actionId', 'args'].includes(k))) p = planner.planTyped({ actionId: input.actionId, args: input.args ?? {}, source, origin: 'typed' });
    else throw fail('CONTROL_INPUT_INVALID');
    if(RULE_ACTIONS.has(p.actionId)&&(source!=='desktop'||actor!=='desktop-owner'))
      return {...p,outcome:'unavailable',executionPerformed:false,precondition:'Learning requires the authenticated desktop owner.'};
    const isProgram=[WIKI_READ_PROGRAM_ACTION,WIKI_WRITE_PROGRAM_ACTION].includes(p.actionId);
    const mobileProgram=isProgram&&source==='mobile'&&p.origin==='personal_rule'&&typeof grantId==='string'&&grantId.length>0&&typeof authorizeProgram==='function';
    const desktopProgram=source==='desktop'&&actor==='desktop-owner'&&['typed','deterministic','personal_rule'].includes(p.origin);
    const programScope=p.actionId===WIKI_WRITE_PROGRAM_ACTION?'control:execute':'control:read';
    if(isProgram&&!desktopProgram&&!mobileProgram)return {...p,outcome:'unavailable',executionPerformed:false,precondition:'Use an owner-shared learned program on an approved phone, or the desktop owner controls.'};
    if(mobileProgram)authorizeProgram(programScope);
    if(p.actionId===NATIVE_PROGRAM_ACTION&&(source!=='desktop'||actor!=='desktop-owner'||p.origin!=='typed'))return {...p,outcome:'unavailable',executionPerformed:false,precondition:'Native program validation requires authenticated desktop owner and an explicit typed program.'};
    if(p.actionId===HVI_ACTION&&(source!=='desktop'||actor!=='desktop-owner'||p.origin!=='typed'||typeof readHvi!=='function'))return {...p,outcome:'unavailable',executionPerformed:false,precondition:'Explicit desktop owner source selection and current development grant required.'};
    if (p.outcome === 'ready') {
      if(p.origin==='personal_rule'&&p.actionId===WIKI_READ_PROGRAM_ACTION){
        const observed=p.language?.personalRule,snapshot=personalSemantics.snapshot(),scope={...commandScope(),surface:source};
        const rule=snapshot.entries.find(r=>r.id===observed?.ruleId&&r.revision===observed.ruleRevision&&r.state==='accepted'&&r.actionId===p.actionId);
        const stillCurrent=()=>{if(mobileProgram){try{authorizeProgram(programScope);}catch{return false;}}const live=personalSemantics.snapshot();return live.version===snapshot.version&&live.digest===snapshot.digest&&digest({...commandScope(),surface:source})===digest(scope);};
        if(!rule?.readProgram||digest(rule.args)!==digest(p.args)||digest(observed.semanticScope)!==digest(scope)||!validWikiRecipe(rule.readProgram,p.args.commands,catalog))
          return {...p,outcome:'refused',executionPerformed:false,refusal:{code:'PROGRAM_RECIPE_STALE',message:'Learned program no longer matches current meaning.'}};
        return runRead(p,{recipe:rule.readProgram,stillCurrent});
      }
      return runRead(p,{readHvi});
    }
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
    let semanticRuleBinding = null,writeSteps=null;
    if (p.origin === 'personal_rule') {
      const observed = p.language?.personalRule;
      const snapshot = personalSemantics.snapshot();
      const rule = snapshot.entries.find(r => r.id === observed?.ruleId && r.state === 'accepted' &&
        r.revision === observed.ruleRevision && r.actionId === p.actionId &&
        digest(r.template||r.writeProgram?bindPersonalRule(r,input.text,catalog):r.args) === digest(p.args));
      if (!rule||!templateReceiptCurrent(rule)) throw fail('CONTROL_SEMANTIC_RULE_STALE');
      if(p.actionId===WIKI_WRITE_PROGRAM_ACTION){writeSteps=bindPersonalWriteProgram(rule,input.text,catalog);if(!writeSteps)throw fail('CONTROL_SEMANTIC_RULE_STALE');}
      // The context is owned by the Host callback, never by caller request fields.
      const activeScope = { ...commandScope(), surface: source };
      if (!observed.semanticScope || digest(activeScope) !== digest(observed.semanticScope))
        throw fail('CONTROL_SEMANTIC_CONTEXT_STALE');
      semanticRuleBinding = { ruleId: rule.id, ruleRevision: rule.revision,
        storeVersion: snapshot.version, storeDigest: snapshot.digest,
        scopeDigest: digest(activeScope),...(rule.template?{invocation:input.text,templateDigest:digest(rule.template)}:{}),...(rule.writeProgram?{invocation:input.text,writeProgramDigest:digest(rule.writeProgram),boundStepsDigest:digest(writeSteps)}:{}) };
    }
    const ruleBinding=RULE_ACTIONS.has(p.actionId)?prepareRuleBinding(p.actionId,p.args):null;
    const savePlan = wikiBinding => {
      if(mobileProgram)authorizeProgram(programScope);
      if(p.actionId===WIKI_WRITE_PROGRAM_ACTION&&semanticRuleBinding){
        const live=personalSemantics.snapshot(),rule=live.entries.find(r=>r.id===semanticRuleBinding.ruleId&&r.state==='accepted'&&r.revision===semanticRuleBinding.ruleRevision);
        const steps=rule?bindPersonalWriteProgram(rule,semanticRuleBinding.invocation,catalog):null;
        if(live.version!==semanticRuleBinding.storeVersion||live.digest!==semanticRuleBinding.storeDigest||digest({...commandScope(),surface:source})!==semanticRuleBinding.scopeDigest||!steps||digest(steps)!==semanticRuleBinding.boundStepsDigest)throw fail('CONTROL_SEMANTIC_RULE_STALE');
      }
      const createdAt = iso();
      const approvalMeaning=wikiBinding?approvalBinding(p.actionId,p.args,source,wikiBinding):null;
      const body = { schema: 'vivim.control-plan-record/1', planId: newPlanId(), actionId: p.actionId, args: p.args,
        risk: p.risk, source, origin: p.origin, actor: short(actor, 120), catalogVersion: catalog.version,
        createdAt, expiresAt: new Date(now() + ttlMs).toISOString(),
        ...(semanticRuleBinding ? { semanticRuleBinding } : {}),
        ...(ruleBinding?{ruleBinding}:{}),
        ...(wikiBinding ? { wikiBinding,approvalMeaning } : {}),
        ...(p.actionId===CAPTURE_ACTION&&source==='mobile'?{captureGrantId:grantId}:{}),...(mobileProgram?{programGrantId:grantId}:{}) };
      const record = { ...body, planDigest: digest(body) };
      journal.record(record);
      return { ...p, planId: record.planId, planDigest: record.planDigest, createdAt, expiresAt: record.expiresAt,
        ...(approvalMeaning?{approvalMeaning}:{}),
        ...(wikiBinding ? { preview: { target: wikiBinding.target ?? wikiBinding.page + '/' + wikiBinding.section,
          before: wikiBinding.before, after: p.actionId===WIKI_WRITE_PROGRAM_ACTION||wikiBinding.edit ? wikiBinding.after : p.args.content,
          expectedRevision: wikiBinding.expectedRevision } } : {}),
        ...(ruleBinding?{learningPreview:{before:ruleBinding.before,after:ruleBinding.after,targetRisk:ruleBinding.targetRisk??null}}:{}),
        approval: { required: true, freshOwner: p.risk === 'R2',
          channels: RULE_ACTIONS.has(p.actionId)?['desktop-owner-token']:wikiMutation(p.actionId)
            ? [source === 'mobile' ? 'direct-phone' : 'desktop-owner-token']
            : [...APPROVAL_CHANNELS] } };
    };
    if(p.actionId===WIKI_WRITE_PROGRAM_ACTION){
      return productJournal.readPhoneWiki().then(wiki=>previewWriteSequence(p.args.commands,wiki,writeSteps)).then(savePlan);
    }
    if(p.actionId===CAPTURE_ACTION){
      if(p.origin!=='typed'||(source==='mobile'&&(!grantId||!actor)))throw fail('CONTROL_INPUT_INVALID');
      return productJournal.readPhoneWiki().then(wiki=>savePlan(previewWikiCapture(wiki,p.args)));
    }
    if (p.actionId === WIKI_ACTION) {
      if (Buffer.byteLength(p.args.content, 'utf8') > MAX_WIKI_CONTENT_BYTES)
        throw fail('CONTROL_WIKI_CONTENT_INVALID');
      // Existing synchronous commands retain their API. Wiki planning is asynchronous.
      return productJournal.readProjection().then(({ wiki }) => {
        const binding=resolveWikiTarget(wiki,p.args.target);
        validateProductEdit({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:binding.expectedRevision,
          edit:{action:'set-section',page:binding.page,section:binding.section,content:p.args.content}},wiki);
        return savePlan(binding);
      });
    }
    if (WIKI_STRUCTURE.has(p.actionId)) {
      return productJournal.readPhoneWiki().then(wiki=>
        savePlan(previewWikiStructure(wiki,structureEdit(p.actionId,p.args))));
    }
    return savePlan(null);
  }

  /** One owner decision: approve this exact digest and apply it. Never retried after claim. */
  function execute({ planId, planDigest, approval } = {},{authorizeProgram=null}={}) {
    if (!approval || !APPROVAL_CHANNELS.includes(approval.channel)) throw fail('CONTROL_APPROVAL_CHANNEL');
    const rec = journal.get(planId);
    if (!rec) throw fail('CONTROL_PLAN_UNKNOWN');
    if (typeof planDigest !== 'string' || planDigest !== rec.plan.planDigest) throw fail('CONTROL_PLAN_MISMATCH');
    if(rec.plan.actionId===VISUAL_ACTION&&(rec.plan.source!=='mobile'||approval.channel!=='direct-phone'||
       approval.actor!==rec.plan.actor||approval.grantId!==rec.plan.approvalMeaning?.deviceGrantId))
      throw fail('CONTROL_VISUAL_DEVICE_REQUIRED');
    // Even receipt replay must respect the private desktop learning scope.
    if((RULE_ACTIONS.has(rec.plan.actionId)||(rec.plan.origin==='personal_rule'&&rec.plan.source==='desktop'))&&
       approval.channel!=='desktop-owner-token')throw fail('CONTROL_DESKTOP_APPROVAL_REQUIRED');
    const phoneProgram=rec.plan.actionId===WIKI_WRITE_PROGRAM_ACTION&&rec.plan.source==='mobile';
    if(rec.plan.actionId===WIKI_WRITE_PROGRAM_ACTION){
      if(phoneProgram){if(rec.plan.origin!=='personal_rule'||approval.channel!=='direct-phone'||approval.actor!==rec.plan.actor||!rec.plan.programGrantId||approval.grantId!==rec.plan.programGrantId||typeof authorizeProgram!=='function')throw fail('CONTROL_WIKI_DEVICE_MISMATCH');authorizeProgram('control:execute');}
      else if(approval.actor!=='desktop-owner'||approval.channel!=='desktop-owner-token'||rec.plan.actor!=='desktop-owner'||rec.plan.source!=='desktop')throw fail('CONTROL_DESKTOP_APPROVAL_REQUIRED');
    }
    if(RULE_ACTIONS.has(rec.plan.actionId)&&approval.actor!=='desktop-owner')
      throw fail('CONTROL_DESKTOP_APPROVAL_REQUIRED');
    if(rec.plan.actionId===CAPTURE_ACTION&&rec.plan.source==='mobile'&&approval.grantId!==rec.plan.captureGrantId)throw fail('CONTROL_WIKI_DEVICE_MISMATCH');
    // Receipt replay must respect the original Wiki channel and device.
    if(wikiMutation(rec.plan.actionId)){
      if(rec.plan.source==='mobile'&&(approval.channel!=='direct-phone'||approval.actor!==rec.plan.actor))
        throw fail('CONTROL_WIKI_DEVICE_MISMATCH');
      if(rec.plan.source!=='mobile'&&approval.channel!=='desktop-owner-token')
        throw fail('CONTROL_DESKTOP_APPROVAL_REQUIRED');
    }
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
      const rule=snapshot.entries.find(r=>r.id===bound.ruleId);
      if(rule?.writeProgram){const steps=bindPersonalWriteProgram(rule,bound.invocation,catalog);
        if(!steps||digest(rule.writeProgram)!==bound.writeProgramDigest||digest(steps)!==bound.boundStepsDigest)throw fail('CONTROL_SEMANTIC_RULE_STALE');}
      if(rule?.template&&(!templateReceiptCurrent(rule)||!currentTemplate(rule,catalog)||digest(rule.template)!==bound.templateDigest||
        digest(bindPersonalRule(rule,bound.invocation,catalog))!==digest(rec.plan.args)))
        throw fail('CONTROL_SEMANTIC_RULE_STALE');
    }
    if(RULE_ACTIONS.has(rec.plan.actionId)){
      if(rec.plan.source!=='desktop'||rec.plan.actor!=='desktop-owner'||
        approval.channel!=='desktop-owner-token'||approval.actor!=='desktop-owner')
        throw fail('CONTROL_DESKTOP_APPROVAL_REQUIRED');
      if(!rec.plan.ruleBinding||digest(prepareRuleBinding(rec.plan.actionId,rec.plan.args))!==digest(rec.plan.ruleBinding))
        throw fail('CONTROL_RULE_STALE');
    }
    let approvedVisual=null;
    if(rec.plan.actionId===VISUAL_ACTION){
      approvedVisual=visualBinding(rec.plan.visualProposal,rec.plan.source,rec.plan.actor,approval.grantId);
      if(digest(approvedVisual.meaning)!==digest(rec.plan.approvalMeaning))throw fail('CONTROL_VISUAL_STALE');
    }else{
      const fresh=planner.planTyped({actionId:rec.plan.actionId,args:rec.plan.args,source:rec.plan.source,origin:rec.plan.origin});
      if(fresh.outcome!=='approval_required'||fresh.risk!==rec.plan.risk)throw fail('CONTROL_PLAN_STALE');
    }
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
        ...(rec.plan.approvalMeaning?{semanticDigest:rec.plan.approvalMeaning.semanticDigest}:{}),
        ...(result ? { result } : {}), ...(error ? { error } : {}),
        ...(status === 'applied' && undoFor(a, rec.plan.args, result) ? { undo: undoFor(a, rec.plan.args, result) } : {}),
        liveAcceptance: a.readiness === 'verified' ? 'verified' : 'pending' };
      return journal.finish(planId, receipt);
    }
    function claimAndRun() {
      if(phoneProgram)authorizeProgram('control:execute');
      journal.approve(planId, { planId, planDigest: stored, channel: approval.channel,
        actor: short(approval.actor ?? 'owner', 120), at: iso() });
      if (!journal.claim(planId)) throw fail('CONTROL_UNCERTAIN');
      try {
        let output;
        if(RULE_ACTIONS.has(rec.plan.actionId))activeRuleCommit=planId;
        try {
          output = approvedVisual
            ? runtime.applyUiProposal({proposal:rec.plan.visualProposal,surface:approvedVisual.current.surface,
                approvedRefs:[],requestId:'utc-'+planId,actor:rec.plan.actor,approvalBinding:approvedVisual.meaning})
            : executors[rec.plan.actionId](rec.plan.args,
                { requestId: 'utc-' + planId, planId, planDigest:stored, wikiBinding: rec.plan.wikiBinding,ruleBinding:rec.plan.ruleBinding });
        } finally {activeRuleCommit=null;}
        if(approvedVisual){
          const expected={...approvedVisual.current.preview.surface,revision:approvedVisual.meaning.targetRevision+1};
          if(output?.persisted!==true||output.revision!==expected.revision||
            output.previewDigest!==approvedVisual.meaning.previewDigest||
            output.projectionDigest!==approvedVisual.meaning.projectionDigest||
            digest(runtime.uiRevision())!==digest(expected))
            throw fail('CONTROL_VISUAL_READBACK_MISMATCH');
        }
        return output && typeof output.then === 'function'
          ? output.then(value => finishEffect(value), error => finishEffect(null, error))
          : finishEffect(output);
      } catch (error) { return finishEffect(null, error); }
    }
    if(rec.plan.actionId===WIKI_WRITE_PROGRAM_ACTION){
      if(!productJournal||!rec.plan.wikiBinding)throw fail('CONTROL_WIKI_NOT_READY');
      const bound=rec.plan.semanticRuleBinding;
      const rule=bound?personalSemantics.snapshot().entries.find(r=>r.id===bound.ruleId):null;
      const steps=bound?bindPersonalWriteProgram(rule,bound.invocation,catalog):null;
      if(bound&&(!steps||digest(steps)!==bound.boundStepsDigest))throw fail('CONTROL_SEMANTIC_RULE_STALE');
      return productJournal.readPhoneWiki().then(wiki=>previewWriteSequence(rec.plan.args.commands,wiki,steps)).then(current=>{
        if(digest(current)!==digest(rec.plan.wikiBinding))throw fail('CONTROL_WIKI_STALE');
        checkApprovalBinding(rec.plan,current);return claimAndRun();
      });
    }
    if (WIKI_STRUCTURE.has(rec.plan.actionId)) {
      if (!productJournal || !rec.plan.wikiBinding?.edit) throw fail('CONTROL_WIKI_NOT_READY');
      return productJournal.readPhoneWiki().then(wiki=>{
        const bound=rec.plan.wikiBinding;
        if(wiki.revision!==bound.expectedRevision)throw fail('CONTROL_WIKI_STALE');
        const current=previewWikiStructure(wiki,structureEdit(rec.plan.actionId,rec.plan.args));
        if(digest(current)!==digest(bound))throw fail('CONTROL_WIKI_STALE');
        checkApprovalBinding(rec.plan,current);
        return claimAndRun();
      });
    }
    if(rec.plan.actionId===CAPTURE_ACTION){
      if(!productJournal||!rec.plan.wikiBinding)throw fail('CONTROL_WIKI_NOT_READY');
      return productJournal.readPhoneWiki().then(wiki=>{
        if(wiki.revision!==rec.plan.wikiBinding.expectedRevision)throw fail('CONTROL_WIKI_STALE');
        const current=previewWikiCapture(wiki,rec.plan.args);
        if(digest(current)!==digest(rec.plan.wikiBinding))throw fail('CONTROL_WIKI_STALE');
        checkApprovalBinding(rec.plan,current);return claimAndRun();
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
        checkApprovalBinding(rec.plan,current);
        return claimAndRun();
      });
    }
    return claimAndRun();
  }

  function status(planId,{source='desktop',actor=null,grantId=null}={}) {
    const rec = journal.get(planId);
    if (!rec) throw fail('CONTROL_PLAN_UNKNOWN');
    if(rec.plan.actionId===VISUAL_ACTION&&source==='mobile'&&(actor!==rec.plan.actor||grantId!==rec.plan.approvalMeaning?.deviceGrantId))throw fail('CONTROL_PLAN_UNKNOWN');
    if(rec.plan.actionId===CAPTURE_ACTION&&source==='mobile'&&(rec.plan.source!=='mobile'||actor!==rec.plan.actor||grantId!==rec.plan.captureGrantId))throw fail('CONTROL_PLAN_UNKNOWN');
    if(source==='mobile'&&rec.plan.actionId===WIKI_WRITE_PROGRAM_ACTION&&(rec.plan.source!=='mobile'||rec.plan.actor!==actor||rec.plan.programGrantId!==grantId||!grantId))throw fail('CONTROL_PLAN_UNKNOWN');
    if(source==='mobile'&&(RULE_ACTIONS.has(rec.plan.actionId)||(rec.plan.origin==='personal_rule'&&rec.plan.source==='desktop')))
      throw fail('CONTROL_PLAN_UNKNOWN');
    return { planId, state: rec.state, actionId: rec.plan.actionId, risk: rec.plan.risk, args: rec.plan.args,
      createdAt: rec.plan.createdAt, expiresAt: rec.plan.expiresAt, receipt: rec.receipt,
      ...(rec.state === 'uncertain' ? { note: 'Effect was claimed but no receipt was recorded. It will not be retried; inspect locally before deciding again.' } : {}) };
  }

  async function inspectOwnerPlan(planId){
    const detail=status(planId),rec=journal.get(planId);
    if(detail.actionId!==WIKI_WRITE_PROGRAM_ACTION||!rec.claimed)return detail;
    const {planDigest,...body}=rec.plan;
    if(digest(body)!==planDigest||rec.approval?.planDigest!==planDigest||rec.approval?.actor!==rec.plan.actor||rec.approval?.channel!==(rec.plan.source==='mobile'?'direct-phone':'desktop-owner-token'))throw fail('CONTROL_PLAN_TAMPERED');
    try{const recovery=await productJournal.readWikiSequenceEvidence(planId,planDigest,rec.plan.wikiBinding.steps.map(s=>s.payload));
      return {...detail,recovery};}
    catch{return {...detail,recovery:{schema:'vivim.wiki-sequence-evidence/1',state:'unavailable',retryAuthorized:false}};}
  }
  function sharedPrograms({canExecute=false}={}){
    const scope={...commandScope(),surface:'mobile'},snapshot=personalSemantics.snapshot();
    const entries=snapshot.entries.filter(r=>r.state==='accepted'&&compatibleRuleCatalog(r,catalog)&&Object.entries(r.scope).every(([k,v])=>scope[k]===v)&&
      (r.actionId===WIKI_READ_PROGRAM_ACTION&&r.readProgram&&validWikiRecipe(r.readProgram,r.args.commands,catalog)||r.actionId===WIKI_WRITE_PROGRAM_ACTION&&r.writeProgram&&validWikiWriteRecipe(r.writeProgram,r.args.commands,catalog)));
    return {schema:'vivim.shared-programs/1',authority:'discovery-only',entries:entries.map(r=>({phrase:r.phrase,kind:r.readProgram?'read':'change',parameter:r.writeProgram?.slot?'wiki-page-slug':null,steps:(r.readProgram??r.writeProgram).steps.length,available:!!r.readProgram||canExecute===true}))};
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
    ownerRules:()=>personalSemantics.snapshot(),
    sharedPrograms,plan, execute, status, inspectOwnerPlan, recent: (limit,{source='desktop',actor=null,grantId=null}={}) => journal.recent(limit).filter(r=>{if(source!=='mobile')return true;if(RULE_ACTIONS.has(r.actionId))return false;if(r.actionId!==WIKI_WRITE_PROGRAM_ACTION)return true;const rec=journal.get(r.planId);return !!grantId&&rec?.plan.source==='mobile'&&rec.plan.actor===actor&&rec.plan.programGrantId===grantId;}),
  };
}
