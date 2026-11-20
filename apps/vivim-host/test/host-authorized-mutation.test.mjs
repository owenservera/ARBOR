// Host authorized mutation (UTC03). An approved preview binds to the single
// revision-checked mutation path in control/dispatcher.mjs: an approved edit
// commits exactly once and journals exactly once; stale revision, unapproved and
// replayed attempts cannot mutate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createControlDispatcher } from '../control/dispatcher.mjs';
import { loadControlCatalog } from '../control/intent-planner.mjs';

const DESKTOP = { channel: 'desktop-owner-token', actor: 'owner' };

function fixture(t, { catalog: providedCatalog = null } = {}) {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-authorized-mutation-'));
  const runtime = createBootstrapRuntime({ dataRoot, file: ':memory:', now: () => new Date().toISOString() });
  runtime.grantBootstrap({ scope: 'full-bootstrap' });
  const catalog = providedCatalog ?? loadControlCatalog();
  const control = createControlDispatcher({ dataRoot, runtime, catalog });
  t.after(() => { runtime.close(); rmSync(dataRoot, { recursive: true, force: true }); });
  return { dataRoot, runtime, catalog, control };
}

const planDir = dataRoot => path.join(dataRoot, 'control', 'plans');
const journalSuffixes = ['.plan.json', '.approved.json', '.claimed', '.receipt.json'];

/** Exactly one journal artifact per transition; a second write must never appear. */
function journalArtifacts(dataRoot, planId) {
  return Object.fromEntries(journalSuffixes.map(suffix => [suffix,
    readdirSync(planDir(dataRoot)).filter(f => f === planId + suffix).length]));
}

function events(dataRoot) {
  return readFileSync(path.join(dataRoot, 'control', 'events.jsonl'), 'utf8').trim().split('\n').filter(Boolean);
}

/** Spy on the Host executor entry point; the dispatcher must route through it once. */
function spyExecutor(runtime, actionId, args) {
  const original = runtime[actionId === 'ui.theme.set_preset' ? 'choosePreset' : 'setHardNo'];
  const calls = [];
  runtime[actionId === 'ui.theme.set_preset' ? 'choosePreset' : 'setHardNo'] = spyArgs => {
    calls.push(spyArgs);
    return original(spyArgs);
  };
  void args;
  return calls;
}

test('an approved edit commits exactly once and journals exactly once through the existing path', t => {
  const { dataRoot, runtime, control } = fixture(t);
  const before = runtime.projection().revision;
  const calls = spyExecutor(runtime, 'ui.theme.set_preset', { preset: 'ember' });
  const plan = control.plan({ text: 'set my theme to ember' }, { source: 'desktop' });
  assert.equal(plan.outcome, 'approval_required');
  // Preview alone journals the plan record only — one artifact, no commit.
  assert.deepEqual(journalArtifacts(dataRoot, plan.planId), {
    '.plan.json': 1, '.approved.json': 0, '.claimed': 0, '.receipt.json': 0 });
  const eventsBefore = events(dataRoot).length;
  const receipt = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  assert.equal(receipt.status, 'applied');
  assert.equal(receipt.executionPerformed, true);
  assert.equal(calls.length, 1, 'executor ran exactly once');
  assert.equal(runtime.projection().preset, 'ember');
  assert.notEqual(runtime.projection().revision, before, 'the edit committed');
  // One commit ⇒ one approval, one claim, one receipt, one bounded event trail.
  assert.deepEqual(journalArtifacts(dataRoot, plan.planId), {
    '.plan.json': 1, '.approved.json': 1, '.claimed': 1, '.receipt.json': 1 });
  assert.equal(events(dataRoot).length - eventsBefore, 3, 'planned already journaled; approved+claimed+applied appended');
  assert.equal(control.recent().filter(r => r.planId === plan.planId).length, 1);
});

test('a replayed attempt returns the receipt and never commits or journals a second mutation', t => {
  const { dataRoot, runtime, control } = fixture(t);
  const calls = spyExecutor(runtime, 'ui.theme.set_preset', { preset: 'dusk' });
  const plan = control.plan({ text: 'set theme to dusk' }, { source: 'desktop' });
  const first = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  const eventsAfterFirst = events(dataRoot);
  const again = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  assert.equal(again.replayed, true);
  assert.equal(again.status, 'applied');
  assert.deepEqual({ ...again, replayed: undefined }, { ...first, replayed: undefined });
  assert.equal(calls.length, 1, 'replay never re-runs the executor');
  assert.equal(control.status(plan.planId).state, 'applied');
  assert.deepEqual(journalArtifacts(dataRoot, plan.planId), {
    '.plan.json': 1, '.approved.json': 1, '.claimed': 1, '.receipt.json': 1 });
  assert.deepEqual(events(dataRoot), eventsAfterFirst, 'replay appends no journal events');
  assert.equal(runtime.projection().revision, first.result.revision, 'no second effect on the runtime');
});

test('a stale revision is refused before the effect fence and nothing is mutated', t => {
  const { dataRoot, runtime, catalog, control } = fixture(t);
  const before = runtime.projection().preset;
  const plan = control.plan({ text: 'set theme to grove' }, { source: 'desktop' });
  // The catalog revision moved after the preview was bound: the plan is stale.
  catalog.version = catalog.version + '+stale';
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }),
    /CONTROL_PLAN_STALE/);
  assert.equal(runtime.projection().preset, before, 'no effect');
  assert.deepEqual(journalArtifacts(dataRoot, plan.planId), {
    '.plan.json': 1, '.approved.json': 0, '.claimed': 0, '.receipt.json': 0 });
  assert.equal(control.status(plan.planId).state, 'planned');
});

test('unapproved attempts cannot mutate and never reach the claim fence', t => {
  const { dataRoot, runtime, control } = fixture(t);
  const before = runtime.projection().preset;
  const calls = spyExecutor(runtime, 'ui.theme.set_preset', { preset: 'ink' });
  const plan = control.plan({ text: 'set theme to ink' }, { source: 'desktop' });
  // No owner approval presented.
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: plan.planDigest }), /CONTROL_APPROVAL_CHANNEL/);
  // An approval that binds no owner channel.
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: { channel: 'model' } }),
    /CONTROL_APPROVAL_CHANNEL/);
  // An owner approval on the wrong surface for this plan's source.
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: { channel: 'direct-phone', actor: 'owner@example.com' } }),
    /CONTROL_APPROVAL_SOURCE_MISMATCH/);
  assert.equal(calls.length, 0, 'no executor run');
  assert.equal(runtime.projection().preset, before, 'no effect');
  assert.deepEqual(journalArtifacts(dataRoot, plan.planId), {
    '.plan.json': 1, '.approved.json': 0, '.claimed': 0, '.receipt.json': 0 });
  assert.equal(control.status(plan.planId).state, 'planned');
});

test('the mutation path stays single: refused executions leave no artifacts and no runtime writes', t => {
  const { dataRoot, runtime, control } = fixture(t);
  const before = runtime.projection().preset;
  const plan = control.plan({ text: 'set theme to dawn' }, { source: 'desktop' });
  const dir = planDir(dataRoot);
  const beforeFiles = readdirSync(dir).slice().sort();
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: 'f'.repeat(64), approval: DESKTOP }), /CONTROL_PLAN_MISMATCH/);
  // A rewritten revision must be re-derived by the current catalog/planner before it can commit.
  // Rewrite the stored plan body under its original digest: the tamper, not a new revision.
  const planFile = path.join(dir, plan.planId + '.plan.json');
  const stored = JSON.parse(readFileSync(planFile, 'utf8'));
  writeFileSync(planFile, JSON.stringify({ ...stored, args: { preset: 'ink' } }));
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: stored.planDigest, approval: DESKTOP }),
    /CONTROL_PLAN_TAMPERED/);
  assert.equal(runtime.projection().preset, before, 'no effect');
  assert.deepEqual(readdirSync(dir).slice().sort(), beforeFiles, 'no new journal artifacts, no second mutation path');
  assert.equal(control.recent().filter(r => r.planId === plan.planId).length, 1);
});