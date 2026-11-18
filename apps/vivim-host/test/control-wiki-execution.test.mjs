import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createControlDispatcher } from '../control/dispatcher.mjs';
import { loadControlCatalog } from '../control/intent-planner.mjs';
import { createProductJournal } from '../chat/product-journal.mjs';
import { createHostServer } from '../server.mjs';
import { request as httpRequest } from 'node:http';

const DESKTOP = { channel: 'desktop-owner-token', actor: 'owner' };
const PHONE = { channel: 'direct-phone', actor: 'phone' };
const seedState = { chat: [], wikiRevision: 1, at: '2026-11-14T00:00:00Z' };
const seedWiki = { revision: 1, pages: { Main: { sections: { HowTo: 'Seed description' } } } };

function fixture(t) {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'arbor-control-wiki-'));
  const runtime = createBootstrapRuntime({ dataRoot, file: ':memory:' });
  runtime.grantBootstrap({ scope: 'full-bootstrap' });
  const productJournal = createProductJournal({ dataRoot, seedState, seedWiki });
  const control = createControlDispatcher({ dataRoot, runtime, productJournal });
  t.after(() => { runtime.close(); rmSync(dataRoot, { recursive: true, force: true }); });
  return { dataRoot, control, productJournal, runtime };
}
const edit = content => ({ actionId: 'wiki.section.edit', args: { target: 'main/howto', content } });
const apply = (control, plan, approval = DESKTOP) => control.execute({
  planId: plan.planId, planDigest: plan.planDigest, approval
});

test('Wiki previews exact persisted section then appends once and survives reopened projection', async t => {
  const { dataRoot, control, productJournal } = fixture(t);
  const plan = await control.plan(edit('Updated instructions'), { source: 'desktop' });
  assert.equal(plan.outcome, 'approval_required');
  assert.deepEqual(plan.approval.channels, ['desktop-owner-token']);
  assert.deepEqual(plan.preview, { target: 'Main/HowTo', before: 'Seed description',
    after: 'Updated instructions', expectedRevision: 1 });
  assert.equal((await productJournal.readProjection()).wiki.pages.Main.sections.HowTo, 'Seed description');
  const first = await apply(control, plan);
  assert.equal(first.status, 'applied');
  assert.equal(first.result.wikiRevision, 2);
  assert.match(first.result.entryId, /^[0-9a-f-]{36}$/);
  assert.equal((await productJournal.readProjection()).wiki.pages.Main.sections.HowTo, 'Updated instructions');
  assert.equal((await apply(control, plan)).replayed, true);
  assert.equal((await productJournal.readRecords()).length, 1);
  assert.match(readFileSync(path.join(dataRoot, 'product-state', 'journal.jsonl'), 'utf8'), /Updated instructions/);
  const reopened = createProductJournal({ dataRoot, seedState, seedWiki });
  assert.equal((await reopened.readProjection()).wiki.pages.Main.sections.HowTo, 'Updated instructions');
});

test('natural-language Wiki edit is resolved to a typed, revision-bound Host plan', async t => {
  const { control, productJournal } = fixture(t);
  const plan = await control.plan({ text: 'edit wiki section main/howto saying Updated from VIVIM' },
    { source: 'desktop', actor: 'desktop-owner' });
  assert.equal(plan.outcome, 'approval_required');
  assert.equal(plan.actionId, 'wiki.section.edit');
  assert.equal(plan.args.target.toLowerCase(), 'main/howto');
  assert.equal(plan.args.content, 'Updated from VIVIM');
  assert.deepEqual(plan.preview, { target: 'Main/HowTo', before: 'Seed description',
    after: 'Updated from VIVIM', expectedRevision: 1 });
  assert.equal((await productJournal.readRecords()).length, 0);
  const receipt = await apply(control, plan);
  assert.equal(receipt.status, 'applied');
  assert.equal(receipt.result.content, 'Updated from VIVIM');
  assert.equal((await productJournal.readProjection()).wiki.pages.Main.sections.HowTo, 'Updated from VIVIM');
});

test('post-append Wiki readback mismatch is uncertain and never re-appends', async t => {
  const { dataRoot, runtime, productJournal } = fixture(t);
  let reads = 0;
  const observed = {
    append: entry => productJournal.append(entry),
    readProjection: async () => {
      const snapshot = await productJournal.readProjection();
      // The first read binds the plan, the second checks its preconditions.
      // Simulate an inconsistent third read, AFTER the durable Host append.
      if (++reads >= 3) return {
        ...snapshot, wiki: { ...snapshot.wiki, revision: snapshot.wiki.revision + 1 }
      };
      return snapshot;
    }
  };
  const control = createControlDispatcher({ dataRoot, runtime, productJournal: observed });
  const plan = await control.plan(edit('Committed once'), { source: 'desktop' });
  const receipt = await apply(control, plan);
  assert.equal(receipt.status, 'uncertain', 'readback cannot be misreported as success');
  assert.equal(receipt.error.code, 'CONTROL_WIKI_READBACK_MISMATCH');
  assert.equal((await productJournal.readProjection()).wiki.pages.Main.sections.HowTo, 'Committed once');
  assert.equal((await productJournal.readRecords()).length, 1);
  assert.equal((await apply(control, plan)).replayed, true);
  assert.equal((await productJournal.readRecords()).length, 1, 'reconciliation never repeats a mutation');
});

test('stale approval never overwrites newer section content', async t => {
  const { control, productJournal } = fixture(t);
  const plan = await control.plan(edit('Stale proposed'), { source: 'desktop' });
  await productJournal.append({ kind: 'wiki-edit', actor: 'owner-browser', schemaVersion: 1,
    expectedRevision: 1, edit: { action: 'set-section', page: 'Main', section: 'HowTo',
      content: 'Newer desktop edit' } });
  await assert.rejects(apply(control, plan), /CONTROL_WIKI_STALE/);
  assert.equal(control.status(plan.planId).state, 'planned');
  assert.equal((await productJournal.readProjection()).wiki.pages.Main.sections.HowTo, 'Newer desktop edit');
});

test('approved paired phone can edit only its own previewed Wiki plan', async t => {
  const { control, productJournal } = fixture(t);
  const phoneActor = 'approved-device-a';
  const plan = await control.plan(edit('Updated by approved phone'),
    { source: 'mobile', actor: phoneActor });
  assert.equal(plan.outcome, 'approval_required');
  assert.deepEqual(plan.approval.channels, ['direct-phone']);
  assert.equal((await productJournal.readProjection()).wiki.revision, 1);
  assert.throws(() => apply(control, plan,
    { channel: 'direct-phone', actor: 'different-device-b' }), /CONTROL_WIKI_DEVICE_MISMATCH/);
  assert.equal((await productJournal.readProjection()).wiki.revision, 1);
  const applied = await apply(control, plan, { channel: 'direct-phone', actor: phoneActor });
  assert.equal(applied.status, 'applied');
  assert.equal(applied.result.wikiRevision, 2);
  assert.equal(applied.result.content, 'Updated by approved phone');
  assert.equal((await productJournal.readRecords()).length, 1);
  assert.equal((await apply(control, plan, { channel: 'direct-phone', actor: phoneActor })).replayed, true);
  const desktop = await control.plan(edit('Good'), { source: 'desktop' });
  assert.throws(() => apply(control, desktop, PHONE), /CONTROL_APPROVAL_SOURCE_MISMATCH|CONTROL_DESKTOP_APPROVAL_REQUIRED/);
});

test('nonexistent target and oversized UTF-8 content refuse to plan', async t => {
  const { control, productJournal } = fixture(t);
  await assert.rejects(control.plan({ actionId: 'wiki.section.edit',
    args: { target: 'main/missing', content: 'x' } }, { source: 'desktop' }),
    /CONTROL_WIKI_TARGET_UNKNOWN/);
  assert.throws(() => control.plan(edit('ü'.repeat(1600)), { source: 'desktop' }),
    /CONTROL_WIKI_CONTENT_INVALID/);
  assert.equal(control.recent().length, 0);
  assert.equal((await productJournal.readRecords()).length, 0);
});

test('claimed Wiki plan without receipt remains uncertain; no blind replay', async t => {
  const { control, productJournal, dataRoot } = fixture(t);
  const plan = await control.plan(edit('Once'), { source: 'desktop' });
  writeFileSync(path.join(dataRoot, 'control', 'plans', plan.planId + '.claimed'), 'interrupted');
  assert.throws(() => apply(control, plan), /CONTROL_UNCERTAIN/);
  assert.equal((await productJournal.readRecords()).length, 0);
});

test('real Host HTTP: NL plan -> explicit approval -> single persisted Wiki edit -> readback', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'arbor-control-wiki-http-'));
  const secret = 'wiki-http-owner-secret-test-value';
  const server = createHostServer({ dataRoot, ownerToken: secret });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    if (server.listening) await new Promise(resolve => server.close(resolve));
    rmSync(dataRoot, { recursive: true, force: true });
  });
  const port = server.address().port;
  const origin = 'http://127.0.0.1:' + port;
  const authorized = { authorization: 'Bearer ' + secret, origin, 'x-vivim-control': '1',
    'content-type': 'application/json' };
  const call = (route, { method = 'GET', body, headers = {} } = {}) =>
    new Promise((resolve, reject) => {
      const req = httpRequest({ hostname: '127.0.0.1', port, path: route, method,
        headers }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch { reject(new Error('Non-JSON HTTP response: ' + route)); }
        });
      });
      req.on('error', reject);
      req.end(body === undefined ? undefined : JSON.stringify(body));
    });
  const before = await call('/api/wiki');
  assert.equal(before.status, 200);
  assert.equal(before.data.pages.Main.sections.About.startsWith('VIVIM realtime wiki'), true);
  assert.equal((await call('/api/host/control/plan', {
    method: 'POST', headers: { origin, 'x-vivim-control': '1', 'content-type': 'application/json' },
    body: { text: 'edit wiki section main/about saying Updated from VIVIM' }
  })).status, 401, 'no owner capability: no plan');
  assert.equal((await call('/api/host/control/plan', {
    method: 'POST', headers: { ...authorized, origin: 'https://untrusted.invalid' },
    body: { text: 'edit wiki section main/about saying Updated from VIVIM' }
  })).status, 403, 'foreign origin cannot even preview a privileged plan');
  const planned = await call('/api/host/control/plan', {
    method: 'POST', headers: authorized,
    body: { text: 'edit wiki section main/about saying Updated from VIVIM' }
  });
  assert.equal(planned.status, 200, JSON.stringify(planned.data));
  assert.equal(planned.data.actionId, 'wiki.section.edit');
  assert.equal(planned.data.outcome, 'approval_required');
  assert.deepEqual(planned.data.preview, {
    target: 'Main/About', before: before.data.pages.Main.sections.About,
    after: 'Updated from VIVIM', expectedRevision: before.data.revision
  });
  assert.equal((await call('/api/wiki')).data.revision, before.data.revision, 'preview cannot mutate');
  const executed = await call('/api/host/control/execute', {
    method: 'POST', headers: authorized,
    body: { planId: planned.data.planId, planDigest: planned.data.planDigest }
  });
  assert.equal(executed.status, 200, JSON.stringify(executed.data));
  assert.equal(executed.data.status, 'applied');
  assert.equal(executed.data.result.wikiRevision, before.data.revision + 1);
  assert.equal(executed.data.result.content, 'Updated from VIVIM');
  const after = await call('/api/wiki');
  assert.equal(after.data.pages.Main.sections.About, 'Updated from VIVIM');
  assert.equal(after.data.revision, before.data.revision + 1);
  const repeat = await call('/api/host/control/execute', {
    method: 'POST', headers: authorized,
    body: { planId: planned.data.planId, planDigest: planned.data.planDigest }
  });
  assert.equal(repeat.data.replayed, true);
  assert.equal((await call('/api/wiki')).data.revision, before.data.revision + 1);
  await new Promise(resolve => server.close(resolve));
  const reopened = createProductJournal({ dataRoot });
  const persisted = await reopened.readProjection();
  assert.equal(persisted.wiki.pages.Main.sections.About, 'Updated from VIVIM');
});

test('Host binds exact resolved meaning, literal text, and structural effects before approval',async t=>{
  const {dataRoot,control,productJournal}=fixture(t);
  for(const content of ['Updated instructions','Café — 日本語','line one\nline two','He said "hello".','a "quoted" value and no change to its spelling']){
    const plan=await control.plan(edit(content),{source:'desktop'});
    const b=plan.approvalMeaning;
    assert.equal(b.schema,'vivim.approval-meaning/1');
    assert.deepEqual(b.resolvedArgs,{target:'Main/HowTo',content});
    assert.equal(b.targetRevision,1);
    assert.equal(b.authority,'none');
    if(content==='Updated instructions')assert.equal(b.roundTrip,'verified');
    if(b.roundTrip==='verified'){
      const round=await control.plan({text:b.sentence},{source:'desktop'});
      assert.deepEqual(round.approvalMeaning.resolvedArgs,b.resolvedArgs);
    }else assert.equal(b.sentence,null);
  }
  const secret=await control.plan(edit('password=example-test-only'),{source:'desktop'});
  assert.equal(secret.approvalMeaning.roundTrip,'unavailable');
  assert.equal(secret.approvalMeaning.sentence,null);
  const a=await control.plan(edit('One'),{source:'desktop'});
  const b=await control.plan(edit('Two'),{source:'desktop'});
  assert.notEqual(a.approvalMeaning.semanticDigest,b.approvalMeaning.semanticDigest);
  assert.equal((await productJournal.readRecords()).length,0);
  const file=path.join(dataRoot,'control','plans',a.planId+'.plan.json');
  const record=JSON.parse(readFileSync(file,'utf8'));
  record.approvalMeaning.sentence='edit wiki section Main/HowTo saying "Different"';
  writeFileSync(file,JSON.stringify(record));
  assert.throws(()=>apply(control,a),/CONTROL_PLAN_TAMPERED/);
  assert.equal((await productJournal.readRecords()).length,0);
  const receipt=await apply(control,b);
  assert.equal(receipt.semanticDigest,b.approvalMeaning.semanticDigest);
  assert.equal(receipt.status,'applied');
  const create=await control.plan({text:'create wiki page project-notes'},{source:'desktop'});
  assert.equal(create.approvalMeaning.roundTrip,'verified');
  assert.equal((await apply(control,create)).status,'applied');
  const link=await control.plan({text:'link wiki pages from main to project-notes'},{source:'desktop'});
  assert.equal(link.approvalMeaning.roundTrip,'verified');
  assert.deepEqual(link.approvalMeaning.resolvedArgs,{from:'Main',to:'project-notes'});
  assert.equal((await apply(control,link)).status,'applied');
  assert.deepEqual((await productJournal.readPhoneWiki()).pages.Main.links,['project-notes']);
});

test('catalog contract changes with unchanged catalog version invalidate pending semantic approval',async t=>{
  const {dataRoot,runtime,control,productJournal}=fixture(t);
  const plan=await control.plan(edit('Do not overwrite'),{source:'desktop'});
  const catalog=loadControlCatalog();
  catalog.actions.find(a=>a.id==='wiki.section.edit').title='Changed contract title';
  const restarted=createControlDispatcher({dataRoot,runtime,productJournal,catalog});
  await assert.rejects(apply(restarted,plan),/CONTROL_PLAN_STALE/);
  assert.equal(restarted.status(plan.planId).state,'planned');
  assert.equal((await productJournal.readRecords()).length,0);
});

test('Wiki expiry is checked again after reading the target; replay is device-bound',async t=>{
  const {dataRoot,runtime,productJournal}=fixture(t);
  let clock=Date.parse('2026-11-18T00:00:00Z'),reads=0;
  const delayed={readProjection:async()=>{
    const result=await productJournal.readProjection();
    if(++reads===2)clock+=10001;
    return result;
  },append:e=>productJournal.append(e)};
  const control=createControlDispatcher({dataRoot,runtime,productJournal:delayed,now:()=>clock,ttlMs:10000});
  const expired=await control.plan(edit('Expired'),{source:'desktop'});
  await assert.rejects(apply(control,expired),/CONTROL_PLAN_EXPIRED/);
  assert.equal(control.status(expired.planId).state,'planned');
  assert.equal((await productJournal.readRecords()).length,0);
  const phone=await control.plan(edit('Applied by A'),{source:'mobile',actor:'device-a'});
  const receipt=await apply(control,phone,{channel:'direct-phone',actor:'device-a'});
  assert.equal(receipt.status,'applied');
  assert.throws(()=>apply(control,phone,{channel:'direct-phone',actor:'device-b'}),/CONTROL_WIKI_DEVICE_MISMATCH/);
  assert.equal((await apply(control,phone,{channel:'direct-phone',actor:'device-a'})).replayed,true);
  assert.equal((await productJournal.readRecords()).length,1);
});
