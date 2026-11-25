import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createControlDispatcher } from '../control/dispatcher.mjs';
import { loadControlCatalog } from '../control/intent-planner.mjs';
import {createSurface} from '../../mobile-relay/generative-ui/catalog.mjs';
import {projectAppliedControlEffects} from '../chat/product-journal.mjs';
import {buildNativeKnowledge} from '../chat/rust-context.mjs';
import {closeNativeProductKernel} from '../control/native-product-kernel.mjs';

// Standalone dispatcher tests do not own an HTTP server whose close handler
// normally tears down the process-wide persistent native kernel.
test.after(()=>closeNativeProductKernel());

const DESKTOP = { channel: 'desktop-owner-token', actor: 'owner' };
const PHONE = { channel: 'direct-phone', actor: 'owner@example.com' };

function fixture(t, { grant = 'full-bootstrap', clock = { t: Date.parse('2026-11-01T10:00:00Z') } } = {}) {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-control-dispatch-'));
  const runtime = createBootstrapRuntime({ dataRoot, file: ':memory:', now: () => new Date(clock.t).toISOString() });
  if (grant) runtime.grantBootstrap({ scope: grant });
  const control = createControlDispatcher({ dataRoot, runtime, now: () => clock.t });
  t.after(() => { control.closeWorkstationSessions(); runtime.close(); rmSync(dataRoot, { recursive: true, force: true }); });
  return { dataRoot, runtime, control, clock };
}

test('text → plan → owner approval → Host executor → receipt, end to end for the theme', t => {
  const { control, runtime } = fixture(t);
  const before = runtime.projection().preset;
  const plan = control.plan({ text: 'set my theme to ember' }, { source: 'mobile' });
  assert.equal(plan.outcome, 'approval_required');
  assert.match(plan.planId, /^ctl-[a-f0-9]{16}$/);
  assert.equal(runtime.projection().preset, before, 'planning changes nothing');
  assert.equal(control.status(plan.planId).state, 'planned');
  const receipt = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: PHONE });
  assert.equal(receipt.status, 'applied');
  assert.equal(receipt.result.preset, 'ember');
  assert.equal(runtime.projection().preset, 'ember');
  assert.deepEqual(receipt.undo, { actionId: 'ui.theme.undo', args: {} });
  assert.equal(receipt.liveAcceptance, 'pending');
  assert.equal(control.status(plan.planId).state, 'applied');
  // Undo is its own approved plan through the same path.
  const undo = control.plan({ actionId: receipt.undo.actionId, args: receipt.undo.args }, { source: 'mobile' });
  assert.equal(control.execute({ planId: undo.planId, planDigest: undo.planDigest, approval: PHONE }).status, 'applied');
  assert.equal(runtime.projection().preset, before);
});

test('reads run immediately with no journal entry and no approval', t => {
  const { control } = fixture(t);
  const r = control.plan({ text: 'show my theme' });
  assert.equal(r.outcome, 'done');
  assert.equal(r.effect, 'read');
  assert.equal(control.recent().length, 0);
  assert.ok(control.plan({ text: 'help' }).result.actions.length >= 12);
});

test('an approval binds one exact digest; replay returns the receipt and never re-applies', t => {
  const { control, runtime } = fixture(t);
  const plan = control.plan({ text: 'set theme to dusk' });
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: 'f'.repeat(64), approval: DESKTOP }), /CONTROL_PLAN_MISMATCH/);
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: { channel: 'model' } }), /CONTROL_APPROVAL_CHANNEL/);
  const first = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  const revision = runtime.projection().revision;
  const again = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  assert.equal(again.replayed, true);
  assert.equal(again.planId, first.planId);
  assert.equal(runtime.projection().revision, revision, 'no second effect');
});

test('tampering with the stored plan is detected before any effect', t => {
  const { control, dataRoot, runtime } = fixture(t);
  const before = runtime.projection().preset;
  const plan = control.plan({ text: 'set theme to dusk' });
  const file = path.join(dataRoot, 'control', 'plans', plan.planId + '.plan.json');
  const stored = JSON.parse(readFileSync(file, 'utf8'));
  writeFileSync(file, JSON.stringify({ ...stored, args: { preset: 'ink' } }));
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }), /CONTROL_PLAN_TAMPERED/);
  assert.equal(runtime.projection().preset, before);
});

test('a claimed plan without a receipt is uncertain and is never retried', t => {
  const { control, dataRoot, runtime } = fixture(t);
  const before = runtime.projection().preset;
  const plan = control.plan({ text: 'set theme to grove' });
  writeFileSync(path.join(dataRoot, 'control', 'plans', plan.planId + '.claimed'), 'crash');
  assert.equal(control.status(plan.planId).state, 'uncertain');
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }), /CONTROL_UNCERTAIN/);
  assert.equal(runtime.projection().preset, before);
});

test('expired plans and stale phone approvals of R2 actions are refused', t => {
  const clock = { t: Date.parse('2026-11-01T10:00:00Z') };
  const { control } = fixture(t, { clock });
  const theme = control.plan({ text: 'set theme to ink' });
  const privacy = control.plan({ text: 'never mention my former employer' });
  assert.equal(privacy.risk, 'R2');
  assert.equal(privacy.approval.freshOwner, true);
  clock.t += 3 * 60_000;
  assert.throws(() => control.execute({ planId: privacy.planId, planDigest: privacy.planDigest, approval: PHONE }), /CONTROL_FRESH_APPROVAL_REQUIRED/);
  assert.equal(control.execute({ planId: privacy.planId, planDigest: privacy.planDigest, approval: DESKTOP }).status, 'applied');
  clock.t += 10 * 60_000;
  assert.throws(() => control.execute({ planId: theme.planId, planDigest: theme.planDigest, approval: DESKTOP }), /CONTROL_PLAN_EXPIRED/);
});

test('privacy exclusions round-trip: add, list with ids, withdraw via the receipt undo', t => {
  const { control } = fixture(t);
  const add = control.plan({ text: 'Never mention my former employer' });
  const receipt = control.execute({ planId: add.planId, planDigest: add.planDigest, approval: DESKTOP });
  assert.equal(receipt.result.value, 'mention my former employer');
  assert.equal(receipt.undo.actionId, 'privacy.hard_no.clear');
  const listed = control.plan({ text: 'show my exclusions' }).result.exclusions;
  assert.deepEqual(listed.map(x => x.id), [receipt.result.id]);
  const clear = control.plan({ text: `withdraw exclusion ${receipt.result.id}` });
  assert.equal(control.execute({ planId: clear.planId, planDigest: clear.planDigest, approval: DESKTOP }).status, 'applied');
  assert.deepEqual(control.plan({ text: 'show my exclusions' }).result.exclusions, []);
});

test('a missing bootstrap grant is a failed receipt with the Host reason, not a silent success', t => {
  const { control } = fixture(t, { grant: null });
  const plan = control.plan({ text: 'set theme to dawn' });
  const r = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  assert.equal(r.status, 'failed');
  assert.equal(r.error.code, 'GRANT_REQUIRED');
  assert.equal(r.executionPerformed, false);
});

test('teaching changes reading only; the taught word still needs approval for its action', t => {
  const { control, runtime } = fixture(t);
  const before = runtime.projection().preset;
  const teach = control.plan({ text: 'teach glow means theme' });
  assert.equal(teach.actionId, 'control.lexicon.teach');
  control.execute({ planId: teach.planId, planDigest: teach.planDigest, approval: DESKTOP });
  assert.deepEqual(control.lexicon().entries, [{ word: 'glow', actionId: 'ui.theme.set_preset' }]);
  const used = control.plan({ text: 'glow dawn' });
  assert.equal(used.actionId, 'ui.theme.set_preset');
  assert.equal(used.outcome, 'approval_required');
  assert.equal(runtime.projection().preset, before);
  const reserved = control.plan({ text: 'teach stop means theme' });
  const r = control.execute({ planId: reserved.planId, planDigest: reserved.planDigest, approval: DESKTOP });
  assert.equal(r.status, 'failed');
  assert.equal(r.error.code, 'CONTROL_WORD_RESERVED');
  const forget = control.plan({ text: 'forget glow' });
  control.execute({ planId: forget.planId, planDigest: forget.planDigest, approval: DESKTOP });
  assert.equal(control.plan({ text: 'glow dawn' }).outcome, 'interpretation_required');
});

test('unavailable and unsupported actions never reach the journal', t => {
  const { control } = fixture(t);
  assert.equal(control.plan({ text: 'Pause all VIVIM traffic' }).outcome, 'unavailable');
  assert.equal(control.plan({ text: 'Disconnect my PC from the network' }).outcome, 'unavailable');
  assert.equal(control.plan({ actionId: 'machine.network.disable_all', args: {} }).outcome, 'unavailable');
  assert.equal(control.recent().length, 0);
});

test('the catalog cannot claim an executor the Host lacks', t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-control-mismatch-'));
  t.after(() => rmSync(dataRoot, { recursive: true, force: true }));
  const catalog = loadControlCatalog();
  catalog.actions.find(a => a.id === 'vivim.network.pause_egress').readiness = 'source_wired';
  catalog.actions.find(a => a.id === 'vivim.network.pause_egress').executor = 'nowhere.mjs:none';
  assert.throws(() => createControlDispatcher({ dataRoot, runtime: { status() {} }, catalog }), /CONTROL_EXECUTOR_MISMATCH/);
});

test('Personal World summary is a safe R0 Host read on both desktop and phone',t=>{
  const {control}=fixture(t);
  for(const source of ['desktop','mobile']) {
    const result=control.plan({actionId:'personalization.context.summary',args:{}},{source});
    assert.equal(result.outcome,'done');
    assert.equal(result.effect,'read');
    assert.equal(result.result.state,'ready');
    assert.equal(result.result.detailLocation,'Private Personal World view on your PC');
    assert.ok(!JSON.stringify(result.result).includes('hardNos'));
    assert.ok(!JSON.stringify(result.result).includes('statement'));
  }
});

test('owner-approved preference text actions write to single Host ledger and support undo',t=>{
  const {control,runtime}=fixture(t);
  const plan=control.plan({actionId:'personalization.preference.add',
    args:{value:'Compact layouts with fewer animations'}},{source:'mobile'});
  assert.equal(plan.outcome,'approval_required');
  assert.equal(runtime.status().preferences.some(p=>p.value==='Compact layouts with fewer animations'),false);
  const receipt=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:PHONE});
  assert.equal(receipt.status,'applied');
  assert.match(receipt.result.id,/^prf-owner-pref-[a-f0-9]{24}$/);
  assert.deepEqual(receipt.undo,{actionId:'personalization.preference.remove',
    args:{id:receipt.result.id}});
  const stored=runtime.status().preferences.find(p=>p.id===receipt.result.id);
  assert.equal(stored.source,'owner');
  assert.equal(stored.basis,'explicitly_stated');
  assert.equal(stored.hard,false);
  assert.equal(stored.value,'Compact layouts with fewer animations');
  const replay=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:PHONE});
  assert.equal(replay.status,'applied');
  assert.equal(runtime.status().preferences.filter(p=>p.id===receipt.result.id).length,1);
  const undo=control.plan({actionId:receipt.undo.actionId,args:receipt.undo.args},
    {source:'mobile'});
  assert.equal(undo.outcome,'approval_required');
  const removed=control.execute({planId:undo.planId,planDigest:undo.planDigest,approval:PHONE});
  assert.equal(removed.status,'applied');
  assert.equal(runtime.status().preferences.some(p=>p.id===receipt.result.id),false);
});

test('owner preference removal cannot withdraw an inferred or hard-boundary row',t=>{
  const {runtime}=fixture(t);
  runtime.ledger.preferences.upsert({id:'prf-owner-pref-'+'a'.repeat(24),
    worldId:runtime.worldId,key:'provider.suggestion',value:'inferred',
    polarity:'want',hard:false,basis:'inferred',source:'provider',
    scope:'work',confidence:0.8,updatedAt:new Date().toISOString()});
  assert.throws(()=>runtime.clearOwnerPreference({id:'prf-owner-pref-'+'a'.repeat(24)}),
    /unknown or non-owner preference/);
  const boundary=runtime.setHardNo({trait:'Never share secrets'});
  assert.throws(()=>runtime.clearOwnerPreference({id:boundary.id}),
    /not an editable owner preference/);
});

test('Personal World preference list shows only explicitly editable owner rows',t=>{
  const {control,runtime}=fixture(t);
  const saved=runtime.setOwnerPreference({value:'No animations in technical views'});
  runtime.setHardNo({trait:'Never share private project information'});
  runtime.ledger.preferences.upsert({id:'inferred-1',worldId:runtime.worldId,
    key:'inferred.layout',value:'Maybe bright colors',polarity:'want',hard:false,
    basis:'inferred',source:'provider',scope:'work',confidence:0.5,
    updatedAt:new Date().toISOString()});
  const read=control.plan({actionId:'personalization.preference.list',args:{}},
    {source:'mobile'});
  assert.equal(read.outcome,'done');
  assert.equal(read.result.state,'source-backed');
  assert.equal(read.result.preferences.length,1);
  assert.deepEqual(read.result.preferences[0],{
    id:saved.id,value:'No animations in technical views',
    scope:'global',source:'owner'
  });
  assert.doesNotMatch(JSON.stringify(read.result),/Maybe bright colors|Never share private/);
  assert.equal(control.recent().length,0,'reading saved preferences does not create a write plan');
});

test('a held lexicon lock makes teach fail with CONTROL_LEXICON_BUSY, not uncertain', t => {
  const { control, dataRoot } = fixture(t);
  const plan = control.plan({ text: 'teach blitz means theme' });
  assert.equal(plan.actionId, 'control.lexicon.teach');
  // Hold the exclusive cross-process lock file that lexicon.save() acquires.
  mkdirSync(path.join(dataRoot, 'control'), { recursive: true });
  writeFileSync(path.join(dataRoot, 'control', 'lexicon.json.lock'), '');
  const receipt = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  assert.equal(receipt.status, 'failed');
  assert.equal(receipt.error.code, 'CONTROL_LEXICON_BUSY');
  assert.equal(receipt.executionPerformed, false);
});

const visualInput=(surface=createSurface())=>({visualProposal:{schema:'vivim.ui-proposal/1',surfaceId:surface.surfaceId,baseRevision:surface.revision,
  operations:[{opId:'change.color',type:'set-theme',theme:{...surface.theme,background:'#234567'}}],explanation:'Exact background',assumptions:[],unknowns:[]}});
const visualDevice={source:'mobile',actor:'phone-A',grantId:'grant-A'};
const visualApproval={channel:'direct-phone',actor:'phone-A',grantId:'grant-A'};
test('visual control uses existing durable plan, exact grant/device and persisted preview proof',t=>{
  const {control,runtime}=fixture(t);
  const plan=control.plan(visualInput(),visualDevice);
  assert.equal(plan.outcome,'approval_required');
  assert.equal(runtime.uiRevision(),null);
  const execute=(approval=visualApproval,planDigest=plan.planDigest)=>control.execute({planId:plan.planId,planDigest,approval});
  assert.throws(()=>execute({...visualApproval,actor:'phone-B'}),/CONTROL_VISUAL_DEVICE_REQUIRED/);
  assert.throws(()=>execute({...visualApproval,grantId:'grant-B'}),/CONTROL_VISUAL_DEVICE_REQUIRED/);
  assert.throws(()=>execute(visualApproval,'a'.repeat(64)),/CONTROL_PLAN_MISMATCH/);
  assert.throws(()=>control.status(plan.planId,{...visualDevice,actor:'phone-B'}),/CONTROL_PLAN_UNKNOWN/);
  const receipt=execute();assert.equal(receipt.status,'applied');
  assert.equal(receipt.semanticDigest,plan.approvalMeaning.semanticDigest);
  assert.equal(receipt.result.previewDigest,plan.visualPreview.previewDigest);
  assert.equal(runtime.uiRevision().theme.background,'#234567');
  assert.equal(execute().replayed,true);
  assert.equal(runtime.uiRevision().revision,1);
});
test('stale competing visual approvals never execute or overwrite a current revision',t=>{
  const {control,runtime}=fixture(t);
  const one=control.plan(visualInput(),visualDevice),two=control.plan(visualInput(),visualDevice);
  const exec=plan=>control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:visualApproval});
  assert.equal(exec(one).status,'applied');assert.throws(()=>exec(two),/stale|revision|CONTROL_VISUAL_STALE/i);
  assert.equal(runtime.uiRevision().revision,1);
  const three=control.plan(visualInput(runtime.uiRevision()),visualDevice);
  runtime.revokeGrant();
  assert.throws(()=>exec(three));assert.equal(runtime.uiRevision().revision,1);
});


test('committed visual receipts reach historical AutoWiki and native owner knowledge, never as current state',t=>{
  const {control}=fixture(t);
  const plan=control.plan(visualInput(),visualDevice);
  const receipt=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:visualApproval});
  assert.equal(receipt.status,'applied');
  const effects=projectAppliedControlEffects(control);
  const item=effects.items.find(x=>x.planId===plan.planId);
  assert.equal(item.status,'historical-applied-receipt');
  assert.equal(item.visualLink.previewDigest,plan.visualPreview.previewDigest);
  assert.equal(item.visualLink.semanticDigest,plan.approvalMeaning.semanticDigest);
  assert.equal(item.visualLink.revision,1);
  const rows=buildNativeKnowledge({changes:{items:[]},context:{}},effects);
  assert.equal(rows[0].kind,'effect');
  assert.equal(rows[0].sourceRevision,1);
  assert.match(rows[0].summary,/Visual my-space rev 0 → 1/);
  const invalid=structuredClone(effects);invalid.items[0].visualLink.revision=9;
  assert.throws(()=>buildNativeKnowledge({changes:{items:[]},context:{}},invalid),/NATIVE_VISUAL_EFFECT_SOURCE_INVALID/);
});

test('desktop owner can approve, reuse and revoke a typed read recipe through the incumbent rule store',async t=>{
 const {runtime,dataRoot}=fixture(t);const {createProductJournal}=await import('../chat/product-journal.mjs');
 const productJournal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{about:'Test section'}}}}});
 const control=createControlDispatcher({dataRoot,runtime,productJournal,nativeProgram:async({program})=>{const p=JSON.parse(program);return {outcome:'compiled',programId:p.id,programRevision:p.revision,orderedStepIds:p.steps.map(s=>s.id),programDigest:'a'.repeat(64),executionAuthorized:false,effectPerformed:false,sourceReferencesVerified:0};}});
 const owner={source:'desktop',actor:'desktop-owner'},approval={channel:'desktop-owner-token',actor:'desktop-owner'};
 const command='run wiki read sequence:\nlist wiki pages\nread wiki page main in section about';
 const draft=await control.plan({actionId:'control.rule.remember',args:{phrase:'morningbrief',command}},owner);assert.equal(draft.outcome,'approval_required');assert.equal(control.ownerRules().entries.length,0);
 const saved=await control.execute({planId:draft.planId,planDigest:draft.planDigest,approval});assert.equal(saved.status,'applied');const rule=control.ownerRules().entries[0];assert.equal(rule.readProgram.steps.length,2);
 const read=await control.plan({text:'morningbrief'},owner);assert.equal(read.outcome,'done');assert.equal(read.result.reusedRecipe,true);assert.equal(read.result.steps[1].result.content,'Test section');assert.equal((await productJournal.readPhoneWiki()).revision,0);
 assert.notEqual((await control.plan({text:'morningbrief'},{source:'mobile',actor:'phone'})).outcome,'done');
 const revoke=await control.plan({actionId:'control.rule.revoke',args:{rule_id:rule.id}},owner);assert.equal((await control.execute({planId:revoke.planId,planDigest:revoke.planDigest,approval})).status,'applied');assert.notEqual((await control.plan({text:'morningbrief'},owner)).outcome,'done');
});

test('approved Wiki sequence preflights dependent changes, writes actual records once and rejects stale or foreign approval',async t=>{
 const {runtime,dataRoot}=fixture(t);const {createProductJournal}=await import('../chat/product-journal.mjs');
 const productJournal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{About:'Original'}}}}});
 const control=createControlDispatcher({dataRoot,runtime,productJournal,nativeProgram:async({program})=>{const p=JSON.parse(program);return {outcome:'compiled',programId:p.id,programRevision:p.revision,orderedStepIds:p.steps.map(s=>s.id),programDigest:'a'.repeat(64),executionAuthorized:false,effectPerformed:false};}});
 const owner={source:'desktop',actor:'desktop-owner'},approval={channel:'desktop-owner-token',actor:'desktop-owner'};
 const commands='create wiki page research\nedit wiki section research/About saying Project notes';
 const draft=await control.plan({text:'run wiki change sequence:\n'+commands},owner);assert.equal(draft.outcome,'approval_required');assert.equal((await productJournal.readPhoneWiki()).revision,0);
 assert.throws(()=>control.execute({planId:draft.planId,planDigest:draft.planDigest,approval:PHONE}),/CONTROL_DESKTOP_APPROVAL_REQUIRED/);
 const receipt=await control.execute({planId:draft.planId,planDigest:draft.planDigest,approval});assert.equal(receipt.status,'applied');assert.equal(receipt.result.entries.length,2);
 const inspection=await control.inspectOwnerPlan(draft.planId);assert.equal(inspection.recovery.state,'all-records-observed');assert.equal(inspection.recovery.retryAuthorized,false);
 const wiki=await productJournal.readPhoneWiki();assert.equal(wiki.revision,2);assert.equal(wiki.pages.research.sections.About,'Project notes');assert.equal((await productJournal.readRecords()).length,2);
 assert.equal((await control.execute({planId:draft.planId,planDigest:draft.planDigest,approval})).replayed,true);assert.equal((await productJournal.readRecords()).length,2);
 const stale=await control.plan({actionId:'program.write_wiki',args:{commands:'create wiki page second\nedit wiki section second/About saying Again'}},owner);
 await productJournal.append({kind:'wiki-edit',actor:'owner-browser',schemaVersion:1,expectedRevision:2,edit:{action:'set-section',page:'main',section:'About',content:'Other change'}});
 await assert.rejects(control.execute({planId:stale.planId,planDigest:stale.planDigest,approval}),/CONTROL_WIKI_STALE/);assert.equal((await productJournal.readPhoneWiki()).pages.second,undefined);
});

test('owner-taught parameterized Wiki change recipe always requires fresh exact approval',async t=>{
 const {runtime,dataRoot}=fixture(t);const {createProductJournal}=await import('../chat/product-journal.mjs');
 const productJournal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{About:'Original'}}}}});
 const control=createControlDispatcher({dataRoot,runtime,productJournal,nativeProgram:async({program})=>{const p=JSON.parse(program);return {outcome:'compiled',programId:p.id,programRevision:p.revision,orderedStepIds:p.steps.map(s=>s.id),programDigest:'a'.repeat(64),executionAuthorized:false,effectPerformed:false};}});
 const owner={source:'desktop',actor:'desktop-owner'},approval={channel:'desktop-owner-token',actor:'desktop-owner'};
 const command='parameterize page research:\nrun wiki change sequence:\ncreate wiki page research\nedit wiki section research/About saying Project notes';
 const teach=await control.plan({actionId:'control.rule.remember',args:{phrase:'projectsetup',command}},owner);assert.equal(teach.outcome,'approval_required');
 assert.equal((await control.execute({planId:teach.planId,planDigest:teach.planDigest,approval})).status,'applied');
 assert.equal((await productJournal.readPhoneWiki()).revision,0);
 const draft=await control.plan({text:'projectsetup alpha'},owner);assert.equal(draft.outcome,'approval_required');assert.equal((await productJournal.readPhoneWiki()).revision,0);
 const receipt=await control.execute({planId:draft.planId,planDigest:draft.planDigest,approval});assert.equal(receipt.status,'applied');assert.equal((await productJournal.readPhoneWiki()).pages.alpha.sections.About,'Project notes');
 const second=await control.plan({text:'projectsetup beta'},owner);assert.equal(second.outcome,'approval_required');
 const rule=control.ownerRules().entries[0];const revoke=await control.plan({actionId:'control.rule.revoke',args:{rule_id:rule.id}},owner);await control.execute({planId:revoke.planId,planDigest:revoke.planDigest,approval});
 await assert.rejects(async()=>control.execute({planId:second.planId,planDigest:second.planDigest,approval}),/CONTROL_SEMANTIC_RULE_STALE/);assert.equal((await productJournal.readPhoneWiki()).pages.beta,undefined);
});

test('only explicitly shared phone programs are discoverable and execution requires the original current grant',async t=>{
 const {runtime,dataRoot}=fixture(t);const {createProductJournal}=await import('../chat/product-journal.mjs');
 const productJournal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{About:'Original'}}}}});
 const control=createControlDispatcher({dataRoot,runtime,productJournal,nativeProgram:async({program})=>{const p=JSON.parse(program);return {outcome:'compiled',programId:p.id,programRevision:p.revision,orderedStepIds:p.steps.map(s=>s.id),programDigest:'a'.repeat(64),executionAuthorized:false,effectPerformed:false};}});
 const owner={source:'desktop',actor:'desktop-owner'},approval={channel:'desktop-owner-token',actor:'desktop-owner'};
 const command='parameterize page research:\nrun wiki change sequence:\ncreate wiki page research\nedit wiki section research/About saying Project notes';
 for(const [phrase,text] of [['privateproject',command],['phoneproject','share with paired phones:\n'+command]]){const p=await control.plan({actionId:'control.rule.remember',args:{phrase,command:text}},owner);assert.equal((await control.execute({planId:p.planId,planDigest:p.planDigest,approval})).status,'applied');}
 const list=control.sharedPrograms({canExecute:true});assert.deepEqual(list.entries.map(e=>e.phrase),['phoneproject']);assert.equal(Object.hasOwn(list.entries[0],'commands'),false);assert.equal(control.sharedPrograms().entries[0].available,false);
 let live=true;const authorizeProgram=()=>{if(!live)throw Error('revoked grant');};const mobile={source:'mobile',actor:'phone-a',grantId:'grant-a',authorizeProgram};
 const draft=await control.plan({text:'phoneproject alpha'},mobile);assert.equal(draft.outcome,'approval_required');assert.equal((await productJournal.readPhoneWiki()).revision,0);
 const body={planId:draft.planId,planDigest:draft.planDigest,approval:{channel:'direct-phone',actor:'phone-a',grantId:'grant-a'}};
 assert.throws(()=>control.execute({...body,approval:{...body.approval,grantId:'other'}},{authorizeProgram}),/CONTROL_WIKI_DEVICE_MISMATCH/);
 live=false;assert.throws(()=>control.execute(body,{authorizeProgram}),/revoked grant/);live=true;
 const receipt=await control.execute(body,{authorizeProgram});assert.equal(receipt.status,'applied');assert.equal((await productJournal.readPhoneWiki()).pages.alpha.sections.About,'Project notes');
 assert.throws(()=>control.status(draft.planId,{source:'mobile',actor:'phone-a',grantId:'other'}),/CONTROL_PLAN_UNKNOWN/);
 assert.equal(control.status(draft.planId,mobile).receipt.planId,draft.planId);
 assert.equal((await control.plan({actionId:'program.write_wiki',args:{commands:'create wiki page bad\ncreate wiki page worse'}},mobile)).outcome,'unavailable');
});
