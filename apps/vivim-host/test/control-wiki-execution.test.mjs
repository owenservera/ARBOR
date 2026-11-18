import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createControlDispatcher } from '../control/dispatcher.mjs';
import { createProductJournal } from '../chat/product-journal.mjs';

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
  return { dataRoot, control, productJournal };
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
