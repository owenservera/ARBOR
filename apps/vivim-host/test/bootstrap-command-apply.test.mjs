// Legacy unbound relay visual commands must fail closed; Host control owns approval.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createBootstrapCommandWorker } from '../bootstrap/command-worker.mjs';
import { createSurface } from '../../mobile-relay/generative-ui/catalog.mjs';
import { compileUiProposal } from '../../mobile-relay/generative-ui/compiler.mjs';

function runtime() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vivim-apply-'));
  const host = createBootstrapRuntime({ dataRoot: dir, file: ':memory:' });
  host.grantBootstrap({ scope: 'full-bootstrap' });
  return { dir, host, close() { host.close(); rmSync(dir, { recursive: true, force: true }); } };
}

function surface() { return createSurface({ surfaceId: 'my-space' }); }
function insertOp(target, component, { opId = 'op.tap', baseRevision = target.revision } = {}) {
  return { schema: 'vivim.ui-proposal/1', surfaceId: target.surfaceId, baseRevision,
    operations: [{ opId, type: 'insert', parentId: 'root', component }], explanation: 'Tap', assumptions: [], unknowns: [] };
}
const card = (id) => ({ id, type: 'card', props: { title: 'Known topic', description: 'Grounded summary' }, children: [] });

function command(action, proposal) {
  return { id: 'cmd-' + Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join(''), text: action, action,
    consumer: 'bootstrap', mode: 'bootstrap', origin: 'relay', proposal };
}

function makeStore() {
  const records = new Map();
  return {
    records,
    list({ status, consumer } = {}) {
      return { items: [...records.values()].filter(r => (!status || r.status === status) && (!consumer || r.consumer === consumer)) };
    },
    get(id) { const r = records.get(id); if (!r) throw new Error('missing ' + id); return r; },
    claim(id, { token } = {}) {
      const r = records.get(id);
      if (!r || r.status !== 'queued') return null;
      const next = { ...r, status: 'claimed', claimToken: token };
      records.set(id, next);
      return next;
    },
    reply(id, text, { status }) {
      const r = records.get(id);
      records.set(id, { ...r, status, result: text });
    }
  };
}

test('unbound apply-proposal cannot commit through the worker', () => {
  const env = runtime();
  try {
    const start = surface();
    const body = insertOp(start, card('item1'));
    const compiled = compileUiProposal({ proposal: body, surface: start, approvedRefs: [] });
    assert.equal(compiled.surface.revision, 0);

    const cmd = command('apply-proposal', body);
    const store = makeStore();
    store.records.set(cmd.id, { id: cmd.id, status: 'queued', consumer: 'bootstrap', mode: 'bootstrap',
      action: 'apply-proposal', text: 'apply-proposal', origin: 'relay', proposal: body, rev: 1 });

    const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime: env.host, store });
    const done = worker.tick();
    assert.equal(done.length, 1);
    assert.equal(done[0].status, 'failed');
    assert.match(done[0].reason,/fresh Host control plan/);
    assert.equal(env.host.uiRevision(),null);
    assert.equal(store.records.get(cmd.id).status, 'failed');
    worker.close();
  } finally { env.close(); }
});

test('apply-proposal rejects a stale base revision and does not advance', () => {
  const env = runtime();
  try {
    const start = surface();
    const first = insertOp(start, card('item1'));
    const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: 'req-1' });
    assert.equal(one.revision, 1);

    // Stale: still claims baseRevision 0 while Host is at 1.
    const stale = insertOp(start, card('item2')); // baseRevision 0
    const store = makeStore();
    const cmd = command('apply-proposal', stale);
    store.records.set(cmd.id, { id: cmd.id, status: 'queued', consumer: 'bootstrap', mode: 'bootstrap',
      action: 'apply-proposal', text: 'apply-proposal', origin: 'relay', proposal: stale, rev: 1 });

    const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime: env.host, store });
    const done = worker.tick();
    assert.equal(done.length, 1);
    assert.equal(done[0].status, 'failed');
    assert.equal(env.host.uiRevision().revision, 1); // unchanged
    assert.equal(store.records.get(cmd.id).status, 'failed');
    worker.close();
  } finally { env.close(); }
});

test('unbound undo cannot roll back committed state through the worker', () => {
  const env = runtime();
  try {
    const start = surface();
    const one = env.host.applyUiProposal({ proposal: insertOp(start, card('item1')), surface: start, approvedRefs: [], requestId: 'req-undo-1' });
    assert.equal(one.revision, 1);
    const mid = env.host.uiRevision();
    const two = env.host.applyUiProposal({ proposal: insertOp(mid, card('item2'), { opId: 'op.tap2' }), surface: mid, approvedRefs: [], requestId: 'req-undo-2' });
    assert.equal(two.revision, 2);
    assert.equal(env.host.uiRevision().revision, 2);

    const store = makeStore();
    const cmd = command('undo-ui-revision');
    store.records.set(cmd.id, { id: cmd.id, status: 'queued', consumer: 'bootstrap', mode: 'bootstrap',
      action: 'undo-ui-revision', text: 'undo-ui-revision', origin: 'relay', rev: 1 });

    const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime: env.host, store });
    const done = worker.tick();
    assert.equal(done.length, 1);
    assert.equal(done[0].status,'failed');
    assert.equal(env.host.uiRevision().revision,2);
    assert.match(done[0].reason,/fresh Host control plan/);
    assert.equal(store.records.get(cmd.id).status,'failed');
    worker.close();
  } finally { env.close(); }
});

test('apply-proposal requires a proposal object', () => {
  const env = runtime();
  try {
    const store = makeStore();
    const noProposal = command('apply-proposal', undefined);
    store.records.set(noProposal.id, { id: noProposal.id, status: 'queued', consumer: 'bootstrap',
      mode: 'bootstrap', action: 'apply-proposal', text: 'apply-proposal', origin: 'relay', rev: 1 });

    const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime: env.host, store });
    const done = worker.tick();
    assert.equal(done.length, 1);
    assert.equal(done[0].status, 'failed');
    assert.match(String(done[0].reason), /fresh Host control plan/);
    worker.close();
  } finally { env.close(); }
});
