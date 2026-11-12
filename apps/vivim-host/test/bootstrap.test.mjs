import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createBootstrapCommandWorker } from '../bootstrap/command-worker.mjs';
import { createHostServer } from '../server.mjs';
import { openLedger } from '../bootstrap/ledger.mjs';
import { createBootstrapService } from '../bootstrap/service.mjs';

const TOKEN = 'test-owner-token-0123456789abcdef0123456789abcdef';
const F02 = {
  schema: 'vivim.bootstrap-f02/2', pass: 'F02',
  visual: { background: '#101820', secondary: '#1d2b3a', accent: '#e8b04b', appearance: 'dark',
    texture: 'aurora', mood: 'cinematic', fontFamily: 'editorial', fontSizePx: 16, headingSizePx: 32,
    radiusPx: 18, spacingScale: 1.05, density: 'comfortable', motion: 'slow' },
  preferences: [{ trait: 'warm amber highlights', basis: 'recurring', confidence: 0.7, scope: 'global' }],
  dislikes: [{ trait: 'neon green', basis: 'explicit', confidence: 0.9, scope: 'global' }],
  unknowns: ['exact favourite typeface'], provisional: false
};
const F01 = {
  schema: 'vivim.bootstrap-fast/1', generationId: 'gen-f01-1', passId: 'F01',
  communication: { language: 'English', tone: 'direct', responseStyle: 'short answers first' },
  focus: [
    { label: 'VIVIM local-first harness', kind: 'project', freshness: 'current', basis: 'explicitly_stated', explanation: 'Building a local-first provider harness.' },
    { label: 'Bootstrap autonomy', kind: 'goal', freshness: 'current', basis: 'provider_memory_report', explanation: 'Wants VIVIM to personalise itself.' }
  ],
  unknowns: ['preferred working hours'],
  suggestedCards: [{ title: 'VIVIM project', focus: 'VIVIM local-first harness' }],
  boundaries: [{ trait: 'auto-sending messages', basis: 'explicitly_stated', hard: true }]
};
const D03 = {
  schema: 'vivim.bootstrap-output/1', generationId: 'gen-d03-1', passId: 'D03',
  observations: [{ category: 'interest', text: 'Reads systems-design essays', confidence: 0.6, sensitive: false }],
  assertions: [{ section: 'interest', label: 'Systems design', value: 'Reads systems-design essays', basis: 'provider_memory_report', confidence: 0.6, freshness: 'current', scope: 'personal' }],
  unknowns: [], viewProposals: [{ kind: 'collection', title: 'Reading', reason: 'Recurring interest' }],
  schemaProposals: [{ type: 'interest_log', fields: [{ name: 'topic', type: 'text' }], reason: 'Track topics' }],
  coverage: { areas: [{ name: 'interests', state: 'partial' }] }
};

function service(scope = 'full-bootstrap') {
  const ledger = openLedger();
  const svc = createBootstrapService({ ledger, now: () => '2026-10-31T10:00:00.000Z' });
  if (scope) svc.grantBootstrap({ scope });
  return { ledger, svc };
}

test('F02 becomes one active, executable, append-only revision', () => {
  const { svc } = service();
  const first = svc.ingestF02({ response: F02, requestId: 'req-f02-a' });
  assert.equal(first.active, true);
  assert.equal(first.revision, 0);
  const vars = first.plan.cssVariables;
  for (const key of ['--bg', '--s1', '--tx', '--ac', '--vivim-background-image', '--vivim-font-family', '--vivim-base-font-size', '--vivim-heading-font-size', '--vivim-corner-radius', '--vivim-spacing-scale']) {
    assert.equal(typeof vars[key], 'string', key);
  }
  assert.match(vars['--vivim-base-font-size'], /^\d+px$/);
  assert.match(vars['--vivim-corner-radius'], /^\d+px$/);
  const second = svc.ingestF02({ response: { ...F02, visual: { ...F02.visual, background: '#0b0f14' } }, requestId: 'req-f02-b' });
  assert.equal(second.revision, 1);
  assert.equal(svc.projection().revision, 1);
  assert.equal(svc.projection().cssVariables['--bg'], '#0b0f14');
  // Undo is append-only history, never deletion.
  const undone = svc.undoTheme({ requestId: 'req-undo-a' });
  assert.equal(undone.active, 0);
  assert.equal(svc.projection().revision, 0);
  assert.equal(svc.ledger.themes.list('world-local', 50).length, 2);
});

test('an invalid provider reply is rejected without creating a revision', () => {
  const { svc } = service();
  assert.throws(() => svc.ingestF02({ response: { ...F02, visual: { ...F02.visual, background: 'cornflowerblue' } }, requestId: 'req-bad' }), /#RRGGBB/);
  assert.equal(svc.ledger.themes.list('world-local', 50).length, 0);
  assert.equal(svc.projection().source, 'provisional');
});

test('owner preset outranks a later provider inference', () => {
  const { svc } = service();
  const preset = svc.choosePreset({ preset: 'grove', requestId: 'req-owner-a' });
  assert.equal(preset.plan.status, 'active');
  const inferred = svc.ingestF02({ response: F02, requestId: 'req-f02-after' });
  assert.equal(inferred.active, false);
  assert.equal(inferred.activation, 'owner-theme-wins');
  assert.equal(svc.projection().source, 'owner-choice');
});

test('F02 replay returns its original receipt and a changed reply is a conflict', () => {
  const { svc, ledger } = service();
  const first = svc.ingestF02({ response: F02, requestId: 'req-f02-replay', generationId: 'gen-f02-1' });
  const again = svc.ingestF02({ response: F02, requestId: 'req-f02-replay', generationId: 'gen-f02-1' });
  assert.equal(again.replayed, true);
  assert.equal(again.revision, first.revision);
  assert.equal(again.themeId, first.themeId);
  assert.equal(ledger.themes.list('world-local', 50).length, 1);
  assert.throws(
    () => svc.ingestF02({ response: { ...F02, visual: { ...F02.visual, background: '#0b0f14' } }, requestId: 'req-f02-replay', generationId: 'gen-f02-1' }),
    error => error.code === 'IDEMPOTENCY_CONFLICT'
  );
  assert.equal(ledger.themes.list('world-local', 50).length, 1);
  // A new generation is a new decision and does create a revision.
  const nextGen = svc.ingestF02({ response: { ...F02, visual: { ...F02.visual, background: '#0b0f14' } }, requestId: 'req-f02-replay', generationId: 'gen-f02-2' });
  assert.equal(nextGen.replayed, undefined);
  assert.equal(nextGen.revision, 1);
});

test('grant scope bounds what a provider reply may write', () => {
  const un = service(null).svc;
  assert.throws(() => un.ingestF02({ response: F02, requestId: 'req-no-grant' }), error => error.code === 'GRANT_REQUIRED');
  const visualOnly = service('onboarding-visual').svc;
  visualOnly.ingestF02({ response: F02, requestId: 'req-visual-only' });
  assert.throws(() => visualOnly.ingestF01({ response: F01, requestId: 'req-f01-out-of-scope' }), error => error.code === 'GRANT_SCOPE');
  assert.throws(() => visualOnly.setHardNo({ trait: 'silent sends' }), error => error.code === 'GRANT_SCOPE');
  // F02 may record its own explicit dislike, but the refused owner boundary must not exist.
  assert.equal(visualOnly.projection().hardNos.includes('silent sends'), false);
});

test('a failed write rolls back the whole transaction', () => {
  const { svc, ledger } = service();
  const before = ledger.themes.list('world-local', 50).length;
  assert.throws(() => ledger.transaction(() => {
    ledger.themes.insert({
      id: 'thm-world-local-99', worldId: 'world-local', revision: 99, status: 'suggested',
      sourceKind: 'provider-inference', sourceRef: 'req-tx', palette: F02.visual,
      appearance: 'dark', mood: 'cinematic', texture: 'aurora', motion: 'slow', density: 'comfortable',
      render: {}, requestId: 'req-tx', provenanceId: null, createdAt: '2026-10-31T10:00:00.000Z', active: 0
    });
    throw new Error('crash before commit');
  }), /crash before commit/);
  assert.equal(ledger.themes.list('world-local', 50).length, before);
});

test('F01 produces grounded cards while recalled hard NOs await owner confirmation', () => {
  const { svc } = service();
  const out = svc.ingestF01({ response: F01, requestId: 'req-f01-a' });
  assert.equal(out.cards, 1);
  assert.deepEqual(out.hardNos, []);
  const cards = svc.cards();
  assert.equal(cards.length, 1);
  assert.equal(cards[0].title, 'VIVIM project');
  assert.equal(cards[0].focus, 'VIVIM local-first harness');
  const projection = svc.projection();
  assert.deepEqual(projection.cards.map(c => c.title), ['VIVIM project']);
  // A provider-suggested card may never claim owner confirmation.
  assert.equal(cards[0].status, 'provider-reported');
  const hardNos = svc.projection().hardNos;
  assert.equal(hardNos.includes('auto-sending messages'), false);
  assert.equal(svc.ledger.preferences.list('world-local').some(p => p.value === 'auto-sending messages' && p.hard === 1), false);
});

test('a card for an ungrounded invented focus item is refused', () => {
  const { svc } = service();
  assert.throws(() => svc.ingestF01({ response: { ...F01, suggestedCards: [{ title: 'Mars colony', focus: 'Mars colonisation' }] }, requestId: 'req-f01-bad' }), /must reference a returned focus label/);
  assert.equal(svc.cards().length, 0);
});

test('only the owner can withdraw a hard NO, and withdrawal is recorded', () => {
  const { svc } = service();
  const owner = svc.setHardNo({ trait: 'silent background sends' });
  assert.equal(svc.projection().hardNos.includes('silent background sends'), true);
  const cleared = svc.clearHardNo({ id: owner.id });
  assert.equal(cleared.ok, true);
  assert.equal(svc.projection().hardNos.includes('silent background sends'), false);
  const provider = svc.ledger.preferences.list('world-local').find(p => p.source === 'provider');
  if (provider) assert.throws(() => svc.clearHardNo({ id: provider.id }), /only an owner-stated preference/);
});

test('deep passes are typed, idempotent and bounded', () => {
  const { svc } = service();
  const a = svc.ingestPass({ response: D03, requestId: 'req-d03-a' });
  const b = svc.ingestPass({ response: D03, requestId: 'req-d03-b' });
  assert.equal(a.observations, 1);
  assert.equal(b.observations, 1);
  assert.equal(svc.ledger.stats('world-local').observations, 1);
  const proposals = svc.ledger.schemaProposals.list('world-local');
  assert.equal(proposals.length, 1);
  assert.equal(JSON.parse(proposals[0].fields_json)[0].name, 'topic');
  // A proposal is data only: nothing executable is stored.
  assert.doesNotMatch(proposals[0].fields_json, /sql|script|javascript/i);
  assert.equal(svc.phase(), 'deepening');
});

test('projection stays bounded and carries no relationship bodies', () => {
  const { svc } = service();
  svc.ingestF01({ response: F01, requestId: 'req-f01-a' });
  svc.ingestPass({
    response: {
      schema: 'vivim.bootstrap-output/1', generationId: 'gen-d06-1', passId: 'D06',
      observations: [{ category: 'relationship', text: 'Private family detail that must never reach the phone projection', confidence: 0.9 }],
      assertions: [], unknowns: [], viewProposals: [], schemaProposals: [], coverage: { areas: [] }
    }, requestId: 'req-d06-a'
  });
  const payload = svc.projection();
  assert.ok(Buffer.byteLength(JSON.stringify(payload), 'utf8') < 32 * 1024);
  assert.doesNotMatch(JSON.stringify(payload), /Private family detail/);
  assert.equal(svc.ledger.stats('world-local').relationships, 1);
});

test('HTTP bootstrap mutations require the owner token, scope and a valid body', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vivim-bootstrap-'));
  const runtime = createBootstrapRuntime({ dataRoot: dir, file: ':memory:' });
  const server = createHostServer({ dataRoot: dir, bootstrap: runtime, ownerToken: TOKEN });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const auth = { authorization: 'Bearer ' + TOKEN };
  const post = (route, body, headers = {}) => fetch(base + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vivim-bootstrap': '1', ...auth, ...headers },
    body: JSON.stringify(body)
  });
  try {
    const status = await fetch(base + '/api/host/status');
    assert.equal(status.status, 200);
    const snapshot = await status.json();
    assert.equal(snapshot.bootstrap.state, 'ready');
    assert.equal(snapshot.bootstrap.schema, 'vivim.bootstrap-phone/1');

    // Header alone is not authorization; a local process must present the owner capability.
    const noToken = await fetch(base + '/api/host/bootstrap/f02', { method: 'POST', headers: { 'content-type': 'application/json', 'x-vivim-bootstrap': '1' }, body: JSON.stringify({ response: F02, requestId: 'req-http-a' }) });
    assert.equal(noToken.status, 401);
    const wrongToken = await post('/api/host/bootstrap/f02', { response: F02, requestId: 'req-http-a' }, { authorization: 'Bearer wrong-owner-token-0123456789abcdef0123456789abcdef' });
    assert.equal(wrongToken.status, 401);
    assert.equal(runtime.projection().revision, 0);

    const noHeader = await post('/api/host/bootstrap/f02', { response: F02, requestId: 'req-http-a' }, { 'x-vivim-bootstrap': '' });
    assert.equal(noHeader.status, 403);

    const wrongType = await fetch(base + '/api/host/bootstrap/f02', { method: 'POST', headers: { 'content-type': 'text/plain', 'x-vivim-bootstrap': '1', ...auth }, body: JSON.stringify({ response: F02, requestId: 'req-http-a' }) });
    assert.equal(wrongType.status, 415);

    const crossOrigin = await post('/api/host/bootstrap/f02', { response: F02, requestId: 'req-http-a' }, { origin: 'https://evil.example' });
    assert.equal(crossOrigin.status, 403);

    // A visual-only grant cannot write F01 profile data.
    const grant = await post('/api/host/bootstrap/grant', {});
    assert.equal(grant.status, 200);
    const outOfScope = await post('/api/host/bootstrap/f01', { response: F01, requestId: 'req-http-f01' });
    assert.equal(outOfScope.status, 403);
    assert.equal((await outOfScope.json()).code, 'GRANT_SCOPE');

    const apply = await post('/api/host/bootstrap/f02', { response: F02, requestId: 'req-http-a', generationId: 'gen-http-1' });
    assert.equal(apply.status, 200);
    const applied = await apply.json();
    assert.equal(applied.ok, true);
    assert.equal(applied.active, true);

    const replay = await post('/api/host/bootstrap/f02', { response: F02, requestId: 'req-http-a', generationId: 'gen-http-1' });
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).replayed, true);
    assert.equal(runtime.projection().revision, 0);

    const conflict = await post('/api/host/bootstrap/f02', { response: { ...F02, visual: { ...F02.visual, background: '#0b0f14' } }, requestId: 'req-http-a', generationId: 'gen-http-1' });
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).code, 'IDEMPOTENCY_CONFLICT');

    const after = await (await fetch(base + '/api/host/bootstrap/projection')).json();
    assert.equal(after.source, 'provider-inference');
    assert.equal(after.cssVariables['--bg'], '#101820');

    const bad = await post('/api/host/bootstrap/f02', { response: { ...F02, pass: 'D99' }, requestId: 'req-http-b' });
    assert.equal(bad.status, 400);

    const oversized = await post('/api/host/bootstrap/f02', { response: F02, requestId: 'req-http-c', filler: 'x'.repeat(300 * 1024) });
    assert.equal(oversized.status, 413);
  } finally {
    await new Promise(resolve => server.close(resolve));
    runtime.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a phone bootstrap undo command runs once and never touches relay-chat', () => {
  const records = new Map();
  const store = {
    list({ status, consumer } = {}) {
      return { items: [...records.values()].filter(r => (!status || r.status === status) && (!consumer || r.consumer === consumer)) };
    },
    get(id) { const r = records.get(id); if (!r) throw new Error('missing ' + id); return r; },
    claim(id, { token = null } = {}) {
      const r = records.get(id);
      if (!r || r.status !== 'queued') return null;
      // A later claim by another consumer must replace the token, which invalidates ours.
      const next = { ...r, status: 'claimed', claimToken: token, rev: r.rev + 1 };
      records.set(id, next);
      return next;
    },
    reply(id, text, { status }) { const r = records.get(id); const next = { ...r, status, result: text, rev: r.rev + 1 }; records.set(id, next); return next; }
  };
  records.set('cmd-00000000000000aa', { id: 'cmd-00000000000000aa', status: 'queued', consumer: 'bootstrap', mode: 'bootstrap', action: 'undo-theme', text: 'undo-theme', origin: 'relay', rev: 1 });
  records.set('cmd-00000000000000bb', { id: 'cmd-00000000000000bb', status: 'queued', consumer: 'harness', mode: 'relay-chat', text: '@chatgpt hello', rev: 1 });

  const { svc } = service();
  svc.ingestF02({ response: F02, requestId: 'req-f02-a' });
  const runtime = {
    undoTheme: args => svc.undoTheme(args)
  };
  const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime, store });
  const done = worker.tick();
  assert.equal(done.length, 1);
  assert.equal(done[0].status, 'done');
  assert.equal(records.get('cmd-00000000000000aa').status, 'done');
  assert.equal(records.get('cmd-00000000000000bb').status, 'queued');
  // A second pass must not re-run the same command.
  assert.equal(worker.tick().length, 0);
});

test('a worker that lost the claim never executes the command', () => {
  const records = new Map();
  let stolen = false;
  const store = {
    list({ status, consumer } = {}) {
      return { items: [...records.values()].filter(r => (!status || r.status === status) && (!consumer || r.consumer === consumer)) };
    },
    get(id) {
      const r = records.get(id);
      // Simulate another consumer appending a newer claim between claim and read.
      if (r && r.status === 'claimed' && !stolen) {
        stolen = true;
        const next = { ...r, claimedBy: 'grokbot', claimToken: 'someone-else', rev: r.rev + 1 };
        records.set(id, next);
        return next;
      }
      return r;
    },
    claim(id, { token = null } = {}) {
      const r = records.get(id);
      if (!r || r.status !== 'queued') return null;
      const next = { ...r, status: 'claimed', claimedBy: 'bootstrap', claimToken: token, rev: r.rev + 1 };
      records.set(id, next);
      return next;
    },
    reply(id, text, { status }) { const r = records.get(id); records.set(id, { ...r, status, result: text, rev: r.rev + 1 }); }
  };
  records.set('cmd-00000000000000cc', { id: 'cmd-00000000000000cc', status: 'queued', consumer: 'bootstrap', mode: 'bootstrap', action: 'undo-theme', text: 'undo-theme', origin: 'relay', rev: 1 });
  let undos = 0;
  const runtime = { undoTheme: () => { undos += 1; return { undone: 0, active: 0 }; } };
  const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime, store });
  assert.deepEqual(worker.tick(), []);
  assert.equal(undos, 0);
});

test('F02 provider dislikes stay advisory until confirmed and canonical replies replay', () => {
  const { svc } = service();
  const first=svc.ingestF02({response:F02,requestId:'req-qualified-f02'});
  assert.equal(first.ok,true);
  assert.equal(svc.projection().hardNos.includes('neon green'),false);
  const reordered={pass:'F02',schema:'vivim.bootstrap-f02/2',provisional:false,
    unknowns:[...F02.unknowns],dislikes:F02.dislikes.map(p=>({scope:p.scope,confidence:p.confidence,basis:p.basis,trait:p.trait})),
    preferences:F02.preferences.map(p=>({scope:p.scope,confidence:p.confidence,basis:p.basis,trait:p.trait})),
    visual:Object.fromEntries(Object.entries(F02.visual).reverse())};
  const replay=svc.ingestF02({response:reordered,requestId:'req-qualified-f02'});
  assert.equal(replay.replayed,true);
  assert.equal(svc.ledger.themes.list('world-local').length,1);
});
test('Undo request is idempotent and skips never-active suggestions',()=>{
  const {svc}=service();
  svc.choosePreset({preset:'grove',requestId:'owner-one'});
  svc.ingestF02({response:F02,requestId:'model-suggestion'});
  svc.choosePreset({preset:'dusk',requestId:'owner-two'});
  const first=svc.undoTheme({requestId:'undo-fixed'});
  assert.equal(first.active,0);
  const again=svc.undoTheme({requestId:'undo-fixed'});
  assert.equal(again.replayed,true);
  assert.equal(svc.projection().revision,0);
  assert.equal(svc.ledger.jobs.list('world-local').filter(x=>x.id==='job-undo-fixed').length,1);
});
