import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlanner } from '../control/intent-planner.mjs';
import { createHostServer } from '../server.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const text = 'edit wiki section main/about saying Updated from VIVIM';
const source = 'desktop';

function checkCompilation(plan) {
  const compiled = plan.language.vec;
  assert.equal(compiled.schema, 'vivim.vec-compile/0.1');
  assert.equal(compiled.domain, 'command');
  assert.equal(compiled.outcome, 'candidate');
  assert.equal(compiled.authorization, 'none');
  assert.equal(compiled.executed, false);
  assert.equal(compiled.persisted, false);
  assert.equal(compiled.proposal.schema, 'vivim.command-intent/0.1');
  assert.equal(compiled.proposal.actionId, plan.actionId);
  assert.deepEqual(compiled.proposal.args, plan.args);
  assert.equal(compiled.proposal.provenance.authority, 'none');
}

test('VEC canonical command is the exact typed Host plan, never an authorization', () => {
  const planner = createControlPlanner();
  const plan = planner.planText(text, { source });
  assert.equal(plan.outcome, 'approval_required');
  assert.equal(plan.actionId, 'wiki.section.edit');
  assert.deepEqual(plan.args, { target: 'main/about', content: 'Updated from VIVIM' });
  checkCompilation(plan);
  assert.deepEqual(plan.language.vec.proposal, planner.interpretCommand(text, { source }));
  assert.equal(plan.executionPerformed, false);
  assert.equal(plan.requiresApproval, true);
  assert.equal(plan.risk, 'R1');
  assert.ok(plan.language.feedback);
});

test('VEC refuses stale interpretation and preserves incomplete, ambiguous and negated outcomes', () => {
  let lexicon = [];
  const planner = createControlPlanner({ lexicon: () => lexicon });
  const worldRevision = planner.world().v;
  const catalogRevision = planner.catalog.version;
  assert.equal(planner.planText(text, { source, catalogRevision: catalogRevision - 1 }).refusal.code, 'STALE_CATALOG');
  lexicon = [{ word: 'customword', actionId: 'wiki.section.edit' }];
  assert.equal(planner.planText(text, { source, worldRevision }).refusal.code, 'STALE_WORLD');
  assert.equal(planner.planText('edit wiki section main/about', { source }).outcome, 'incomplete');
  assert.equal(planner.planText('stop all traffic', { source }).outcome, 'clarification_required');
  assert.equal(planner.planText('do not ' + text, { source }).outcome, 'refused');
  assert.notEqual(planner.planText(text + ' and then show my theme', { source }).outcome, 'approval_required');
  assert.equal(planner.validateCommandCandidate(text, { actionId: 'wiki.section.edit',
    args: { target: 'main/about', content: 'Different' } }, { source }).refusal.code, 'CONFLICTING_ARGUMENTS');
  assert.equal(planner.validateCommandCandidate(text, { actionId: 'wiki.section.edit',
    args: { target: 'main/about', content: 'Updated from VIVIM' }, risk: 'R0' }, { source }).outcome, 'refused');
});

test('actual Host HTTP VEC plan, exact approval, Wiki readback and restart', async t => {
  const dataRoot = mkdtempSync(join(tmpdir(), 'arbor-vec-command-'));
  const ownerToken = 'vec-command-owner-test-token-'.repeat(3);
  let server;
  async function start() {
    server = createHostServer({ dataRoot, ownerToken });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return 'http://127.0.0.1:' + server.address().port;
  }
  const stop = () => new Promise(resolve => server.close(resolve));
  t.after(async () => {
    if (server?.listening) await stop();
    rmSync(dataRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
  });
  let origin = await start();
  async function call(route, { body, authorized = true } = {}) {
    const headers = { origin, 'x-vivim-control': '1', 'content-type': 'application/json',
      ...(authorized ? { authorization: 'Bearer ' + ownerToken } : {}) };
    const res = await fetch(origin + route, { method: body ? 'POST' : 'GET', headers,
      ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, data: await res.json() };
  }
  const before = await call('/api/wiki');
  assert.equal(before.status, 200);
  assert.equal((await call('/api/host/control/plan', { body: { text }, authorized: false })).status, 401);
  const planned = await call('/api/host/control/plan', { body: { text } });
  assert.equal(planned.status, 200, JSON.stringify(planned.data));
  const plan = planned.data;
  checkCompilation(plan);
  assert.equal(plan.outcome, 'approval_required');
  assert.deepEqual(plan.preview, { target: 'Main/About', before: before.data.pages.Main.sections.About,
    after: 'Updated from VIVIM', expectedRevision: before.data.revision });
  assert.deepEqual((await call('/api/wiki')).data, before.data);
  const approval = { planId: plan.planId, planDigest: plan.planDigest };
  assert.equal((await call('/api/host/control/execute', { body: approval, authorized: false })).status, 401);
  assert.equal((await call('/api/host/control/execute', { body: { ...approval, planDigest: '0'.repeat(64) } })).status, 409);
  assert.equal((await call('/api/wiki')).data.revision, before.data.revision);
  const result = await call('/api/host/control/execute', { body: approval });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.status, 'applied');
  const after = await call('/api/wiki');
  assert.equal(after.data.pages.Main.sections.About, 'Updated from VIVIM');
  assert.equal(after.data.revision, before.data.revision + 1);
  assert.equal((await call('/api/host/control/execute', { body: approval })).data.replayed, true);
  assert.equal((await call('/api/wiki')).data.revision, after.data.revision);
  await stop();
  origin = await start();
  const restarted = await call('/api/wiki');
  assert.equal(restarted.status, 200);
  assert.equal(restarted.data.revision, after.data.revision);
  assert.equal(restarted.data.pages.Main.sections.About, 'Updated from VIVIM');
});
