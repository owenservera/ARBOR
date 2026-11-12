// GUI01 at the Host boundary: a validated vivim.ui-proposal/1 becomes a Host-owned,
// compare-and-swap vivim.ui-revision/1 commit. The provider never writes the surface;
// the Host compiles, checks the base revision and persists one new active revision.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createHostServer } from '../server.mjs';
import { createSurface, DEFAULT_THEME } from '../../mobile-relay/generative-ui/catalog.mjs';
import { compileUiProposal } from '../../mobile-relay/generative-ui/compiler.mjs';

const TOKEN = 'test-owner-token-0123456789abcdef0123456789abcdef';

function runtime() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vivim-ui-revision-'));
  const host = createBootstrapRuntime({ dataRoot: dir, file: ':memory:' });
  host.grantBootstrap({ scope: 'full-bootstrap' });
  return {
    dir, host,
    close() {
      host.close();
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

function surface() {
  return createSurface({ surfaceId: 'ui-revision-space', theme: DEFAULT_THEME });
}

function card(id) {
  return { id, type: 'card', props: { title: 'Known topic', description: 'Grounded summary' }, children: [] };
}

function proposal(target, component, { opId = 'op.insert', baseRevision = target.revision } = {}) {
  return {
    schema: 'vivim.ui-proposal/1', surfaceId: target.surfaceId, baseRevision,
    operations: [{ opId, type: 'insert', parentId: 'root', component }],
    explanation: 'Preview change', assumptions: [], unknowns: []
  };
}

// A service commit may or may not echo the compiled surface; derive it deterministically
// either way so the next compare-and-swap runs against the real committed revision.
function committed(out, prior, body, approvedRefs) {
  const next = out.surface ?? compileUiProposal({ proposal: body, surface: prior, approvedRefs }).surface;
  return { ...next, revision: out.revision };
}

const rejection = pattern => error => pattern.test(String(error?.message ?? error));

test('a proposal CAS-commits revisions 1 and 2, then undo returns the active revision to 1', () => {
  const env = runtime();
  try {
    const start = surface();
    const first = proposal(start, card('item1'));

    const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: 'req-ui-1' });
    assert.equal(one.ok, true);
    assert.equal(one.revision, 1);
    assert.equal(one.parentRevision, 0);
    assert.equal(one.persisted, true);
    assert.equal(one.surfaceId, start.surfaceId);
    assert.equal(env.host.uiRevision().revision, 1);

    const afterOne = committed(one, start, first, []);
    const second = proposal(afterOne, card('item2'), { opId: 'op.insert.two' });
    const two = env.host.applyUiProposal({ proposal: second, surface: afterOne, approvedRefs: [], requestId: 'req-ui-2' });
    assert.equal(two.ok, true);
    assert.equal(two.revision, 2);
    assert.equal(two.parentRevision, 1);
    assert.equal(two.persisted, true);
    assert.equal(two.surfaceId, start.surfaceId);
    assert.equal(env.host.uiRevision().revision, 2);

    const undone = env.host.undoUiRevision({ requestId: 'req-ui-undo' });
    assert.equal(undone.undone, 2);
    assert.equal(undone.active, 1);
    assert.equal(undone.persisted, true);
    assert.equal(env.host.uiRevision().revision, 1);
    assert.equal(env.host.uiRevision().surfaceId, start.surfaceId);
  } finally {
    env.close();
  }
});

test('a stale base revision is refused and leaves the active revision unchanged', () => {
  const env = runtime();
  try {
    const start = surface();
    const first = proposal(start, card('item1'));
    const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: 'req-ui-stale-1' });
    assert.equal(one.revision, 1);
    const afterOne = committed(one, start, first, []);
    const two = proposal(afterOne, card('item2'), { opId: 'op.insert.two' });
    const second = env.host.applyUiProposal({ proposal: two, surface: afterOne, approvedRefs: [], requestId: 'req-ui-stale-2' });
    assert.equal(second.revision, 2);

    // The proposal still claims revision 0 while the Host is at revision 2: no overwrite.
    const staleSurface = start;
    const stale = proposal(staleSurface, card('item3'), { opId: 'op.insert.stale', baseRevision: 0 });
    assert.throws(
      () => env.host.applyUiProposal({ proposal: stale, surface: staleSurface, approvedRefs: [], requestId: 'req-ui-stale-3' }),
      rejection(/UI_REJECTED|stale|revision/i)
    );
    assert.equal(env.host.uiRevision().revision, 2);
  } finally {
    env.close();
  }
});

test('unapproved references, root removal and private edits never create a revision', () => {
  const env = runtime();
  try {
    const start = surface();
    const before = env.host.uiRevision()?.revision ?? 0;

    const unapproved = proposal(start, {
      id: 'profile', type: 'profile-card', props: { title: 'Identity', sourceRef: 'clm-madeup' }, children: []
    });
    assert.throws(
      () => env.host.applyUiProposal({ proposal: unapproved, surface: start, approvedRefs: [], requestId: 'req-ui-ref' }),
      rejection(/UI_REJECTED|unapproved|reference/i)
    );
    assert.equal(env.host.uiRevision()?.revision ?? 0, before);

    const rootRemoval = {
      schema: 'vivim.ui-proposal/1', surfaceId: start.surfaceId, baseRevision: start.revision,
      operations: [{ opId: 'op.remove.root', type: 'remove', componentId: 'root' }],
      explanation: 'Remove everything', assumptions: [], unknowns: []
    };
    assert.throws(
      () => env.host.applyUiProposal({ proposal: rootRemoval, surface: start, approvedRefs: [], requestId: 'req-ui-root' }),
      rejection(/UI_REJECTED|root/i)
    );
    assert.equal(env.host.uiRevision()?.revision ?? 0, before);

    // A pc-private branch can only enter with a locally approved evidence ref, and then
    // an untrusted proposal may never move, remove or edit it.
    const refs = ['viw-1'];
    const privateInsert = proposal(start, {
      id: 'deep.private', type: 'card', visibility: 'pc-private',
      props: { title: 'Relationships', sourceRef: 'viw-1' }, children: []
    });
    const privateCommit = env.host.applyUiProposal({ proposal: privateInsert, surface: start, approvedRefs: refs, requestId: 'req-ui-private-insert' });
    assert.equal(privateCommit.ok, true);
    assert.equal(privateCommit.revision, 1);
    const withPrivate = committed(privateCommit, start, privateInsert, refs);

    for (const [label, operation] of [
      ['remove', { opId: 'op.private.remove', type: 'remove', componentId: 'deep.private' }],
      ['edit', { opId: 'op.private.props', type: 'replace-props', componentId: 'deep.private', props: { title: 'Leaked title' } }]
    ]) {
      const body = {
        schema: 'vivim.ui-proposal/1', surfaceId: withPrivate.surfaceId, baseRevision: withPrivate.revision,
        operations: [operation], explanation: 'Private ' + label, assumptions: [], unknowns: []
      };
      assert.throws(
        () => env.host.applyUiProposal({ proposal: body, surface: withPrivate, approvedRefs: refs, requestId: 'req-ui-private-' + label }),
        rejection(/UI_REJECTED|private/i)
      );
      assert.equal(env.host.uiRevision().revision, 1);
    }
  } finally {
    env.close();
  }
});

// GUI06: honest revision statuses. A status is only ever what the Host actually did:
// the commit marks 'applied', the replaced revision becomes 'superseded', undo marks the
// undone revision 'reverted' and the restored one 'applied'. A stale compare-and-swap
// refuses before any write, so no status changes.
test('applyUiProposal marks the committed revision applied and the replaced one superseded', () => {
  const env = runtime();
  try {
    const start = surface();
    const first = proposal(start, card('item1'));
    const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: 'req-status-1' });
    assert.equal(one.status, 'applied');
    const appliedOne = env.host.uiRevisionStatus(1);
    assert.equal(appliedOne.revision, 1);
    assert.equal(appliedOne.status, 'applied');
    assert.equal(appliedOne.actor, 'owner');
    assert.equal(typeof appliedOne.at, 'string');

    const afterOne = committed(one, start, first, []);
    const two = env.host.applyUiProposal({
      proposal: proposal(afterOne, card('item2'), { opId: 'op.insert.two' }),
      surface: afterOne, approvedRefs: [], requestId: 'req-status-2', actor: 'phone'
    });
    assert.equal(two.revision, 2);
    assert.equal(two.status, 'applied');
    assert.equal(env.host.uiRevisionStatus(2).status, 'applied');
    assert.equal(env.host.uiRevisionStatus(2).actor, 'phone');
    assert.equal(env.host.uiRevisionStatus(1).status, 'superseded');
    // Reading with no argument answers for the active revision.
    assert.equal(env.host.uiRevisionStatus().revision, 2);
    assert.equal(env.host.uiRevisionStatus(99), null);
  } finally {
    env.close();
  }
});

test('undoUiRevision marks the undone revision reverted and the restored one applied', () => {
  const env = runtime();
  try {
    const start = surface();
    const first = proposal(start, card('item1'));
    const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: 'req-undo-status-1' });
    const afterOne = committed(one, start, first, []);
    const two = env.host.applyUiProposal({
      proposal: proposal(afterOne, card('item2'), { opId: 'op.insert.two' }),
      surface: afterOne, approvedRefs: [], requestId: 'req-undo-status-2'
    });
    assert.equal(two.revision, 2);

    const undone = env.host.undoUiRevision({ requestId: 'req-undo-status' });
    assert.equal(undone.undone, 2);
    assert.equal(undone.active, 1);
    assert.equal(undone.status, 'applied');
    assert.equal(env.host.uiRevisionStatus(2).status, 'reverted');
    assert.equal(env.host.uiRevisionStatus(1).status, 'applied');
    assert.equal(env.host.uiRevision().revision, 1);
  } finally {
    env.close();
  }
});

test('projection uiRevision carries revision, status and surfaceId', () => {
  const env = runtime();
  try {
    assert.equal(env.host.projection().uiRevision, null);
    const start = surface();
    const first = proposal(start, card('item1'));
    env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: 'req-projection-ui' });

    const projected = env.host.projection();
    assert.equal(projected.state, 'ready');
    assert.equal(projected.uiRevision.revision, 1);
    assert.equal(projected.uiRevision.status, 'applied');
    assert.equal(projected.uiRevision.surfaceId, start.surfaceId);
    assert.equal(projected.uiRevision.parentRevision, 0);
    assert.equal(typeof projected.uiRevision.changeId, 'string');
    // The surface itself is still projectable for the phone renderer.
    assert.equal(projected.uiRevision.surface.surfaceId, start.surfaceId);
    assert.ok(projected.uiRevision.tree);
  } finally {
    env.close();
  }
});

test('a stale base revision leaves every recorded status unchanged', () => {
  const env = runtime();
  try {
    const start = surface();
    const first = proposal(start, card('item1'));
    const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: 'req-stale-status-1' });
    const afterOne = committed(one, start, first, []);
    const two = env.host.applyUiProposal({
      proposal: proposal(afterOne, card('item2'), { opId: 'op.insert.two' }),
      surface: afterOne, approvedRefs: [], requestId: 'req-stale-status-2'
    });
    assert.equal(two.revision, 2);
    const beforeOne = env.host.uiRevisionStatus(1);
    const beforeTwo = env.host.uiRevisionStatus(2);

    const stale = proposal(start, card('item3'), { opId: 'op.insert.stale', baseRevision: 0 });
    assert.throws(
      () => env.host.applyUiProposal({ proposal: stale, surface: start, approvedRefs: [], requestId: 'req-stale-status-3' }),
      rejection(/UI_REJECTED|stale|revision/i)
    );

    assert.deepEqual(env.host.uiRevisionStatus(1), beforeOne);
    assert.deepEqual(env.host.uiRevisionStatus(2), beforeTwo);
    assert.equal(env.host.uiRevisionStatus(1).status, 'superseded');
    assert.equal(env.host.uiRevisionStatus(2).status, 'applied');
    assert.equal(env.host.uiRevisionStatus(3), null);
    assert.equal(env.host.projection().uiRevision.revision, 2);
  } finally {
    env.close();
  }
});

test('HTTP ui-proposal commit is owner-gated, compare-and-swap bound and reflected in the projection', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vivim-ui-revision-http-'));
  const host = createBootstrapRuntime({ dataRoot: dir, file: ':memory:' });
  host.grantBootstrap({ scope: 'full-bootstrap' });
  const server = createHostServer({ dataRoot: dir, bootstrap: host, ownerToken: TOKEN });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const auth = { authorization: 'Bearer ' + TOKEN };
  const route = '/api/host/bootstrap/ui-proposal';
  const post = (body, headers = {}) => fetch(base + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vivim-bootstrap': '1', ...auth, ...headers },
    body: JSON.stringify(body)
  });
  try {
    const start = surface();
    const body = { proposal: proposal(start, card('item1')), surface: start, approvedRefs: [], requestId: 'req-http-ui-1' };

    const noToken = await fetch(base + route, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-vivim-bootstrap': '1' },
      body: JSON.stringify(body)
    });
    assert.equal(noToken.status, 401);

    const noHeader = await post(body, { 'x-vivim-bootstrap': '' });
    assert.equal(noHeader.status, 403);

    const crossOrigin = await post(body, { origin: 'https://evil.example' });
    assert.equal(crossOrigin.status, 403);

    const wrongMethod = await fetch(base + route, {
      method: 'GET',
      headers: { 'x-vivim-bootstrap': '1', ...auth }
    });
    assert.equal(wrongMethod.status, 405);

    // Nothing above committed.
    assert.equal(host.uiRevision()?.revision ?? 0, 0);

    const applied = await post(body);
    assert.equal(applied.status, 200);
    const out = await applied.json();
    assert.equal(out.ok, true);
    assert.equal(out.revision, 1);
    assert.equal(out.persisted, true);
    assert.equal(host.uiRevision().revision, 1);

    const projection = await (await fetch(base + '/api/host/bootstrap/projection')).json();
    assert.equal(projection.state, 'ready');
    assert.equal(host.projection().state, 'ready');

    // Replaying the same revision is a stale compare-and-swap, not a second commit.
    const stale = await post(body);
    assert.equal(stale.status, 400);
    assert.equal(host.uiRevision().revision, 1);
  } finally {
    await new Promise(resolve => server.close(resolve));
    host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
