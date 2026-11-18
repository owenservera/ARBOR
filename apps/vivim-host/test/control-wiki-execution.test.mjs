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

test('mobile Wiki editing cannot plan or execute the PC-only mutation', async t => {
  const { control, productJournal } = fixture(t);
  const denied = await control.plan(edit('bad'), { source: 'mobile' });
  assert.equal(denied.outcome, 'unavailable');
  assert.equal(control.recent().length, 0);
  const desktop = await control.plan(edit('Good'), { source: 'desktop' });
  assert.throws(() => apply(control, desktop, PHONE), /CONTROL_DESKTOP_APPROVAL_REQUIRED/);
  assert.equal((await productJournal.readProjection()).wiki.revision, 1);
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
