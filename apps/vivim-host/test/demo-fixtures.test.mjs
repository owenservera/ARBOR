// C11 acceptance — demo fixture layer (backend-zero data reads).
// Every demo data read comes from public/demo/fixture/* synthetic records
// (schema vivim.demo-steps/1 index + vivim.demo-step/1 per tab). The browser
// controller's honest-gap strings must stay in lockstep with the phone PWA
// wording (C6 truthfulness), and poll-round.mjs stays a disk-read-only CLI.
//
// C5 ownership (fixture-shape ↔ controller coupling): the SPEC wrote mockData
// with raw dotted app-state keys ('S.statusObj.snapshot.live', 'S.convs',
// 'S.cmds'); the delivered parcel restructured those into controller-readable
// nested keys (statusObj.snapshot.*, bare device/manifest/media/convs/cmds/
// ctx/control/plan/receipt/recent, liveStateLabels). The C5 tests below pin
// the DELIVERED shape — a re-flatten back to the raw SPEC dotted keys
// false-fails here instead of silently re-coupling the fixture shape — pin the
// SPEC values that survived the restructure field-for-field (tab-control
// planDigest 3f9ac2b17d44e8a0c6b5d2f1e7a8b9c0d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8
// exact), and run the REAL controller.js against the REAL parcel files to
// prove the views() parsing renders every SPEC row.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInContext, createContext } from 'node:vm';

// This test's directory. bun's import.meta.url loses the filename, so prefer
// __dirname (bun ESM has it) and fall back to fileURLToPath for node.
const testDir = typeof __dirname === 'string'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(testDir, '..', 'public', 'demo');
const fixtureDir = path.join(demoDir, 'fixture');
const controllerSrc = readFileSync(path.join(demoDir, 'controller.js'), 'utf8');

const index = JSON.parse(readFileSync(path.join(fixtureDir, 'index.json'), 'utf8'));
// mobile-relay TABS order plus the queue-mode walkthrough steps (SPEC A02/A04/A05)
const STEP_IDS = ['tab-today', 'tab-talk', 'tab-build', 'tab-world', 'tab-me', 'tab-control', 'A02', 'A04', 'A05'];

test('fixture index is a vivim.demo-steps/1 manifest covering the six phone tabs plus queue-mode A02/A04/A05', () => {
  assert.equal(index.schema, 'vivim.demo-steps/1');
  assert.equal(typeof index.demoTitle, 'string');
  assert.ok(index.demoTitle.length > 0);
  assert.equal(Array.isArray(index.steps), true);
  assert.deepEqual(index.steps.map(s => s.itemId), STEP_IDS);
  for (const step of index.steps) {
    assert.equal(typeof step.screen, 'string');
    assert.ok(step.screen.length > 0);
    assert.equal(typeof step.file, 'string');
    assert.match(step.file, /^tab-.*\.json$/);
  }
});

test('every indexed step file exists in the fixture dir and is a vivim.demo-step/1 record', () => {
  for (const step of index.steps) {
    const filePath = path.join(fixtureDir, step.file);
    const stepJson = JSON.parse(readFileSync(filePath, 'utf8'));
    assert.equal(stepJson.schema, 'vivim.demo-step/1', step.file);
    assert.equal(stepJson.itemId, step.itemId, step.file);
    assert.equal(stepJson.screen, step.screen, step.file);
    assert.equal(typeof stepJson.currentState, 'string');
    assert.ok(stepJson.currentState.length > 0, step.file);
    assert.equal(typeof stepJson.acceptanceQuestion, 'string');
    assert.ok(stepJson.acceptanceQuestion.length > 0, step.file);
    assert.equal(typeof stepJson.proposedUpgrade, 'string', step.file);
  }
});

test('each step carries non-empty mockData — every read is a fixture field, no live data', () => {
  for (const step of index.steps) {
    const stepJson = JSON.parse(readFileSync(path.join(fixtureDir, step.file), 'utf8'));
    assert.equal(stepJson.mockData != null && typeof stepJson.mockData, 'object', step.file);
    assert.equal(Array.isArray(stepJson.mockData), false, step.file);
    assert.ok(Object.keys(stepJson.mockData).length > 0, step.file + ' mockData empty');
    // Synthetic records only: fixture files must not embed network endpoints.
    const raw = readFileSync(path.join(fixtureDir, step.file), 'utf8');
    assert.doesNotMatch(raw, /https?:\/\//, step.file + ' embeds a URL');
    assert.doesNotMatch(raw, /localhost:\d+/, step.file + ' embeds a loopback endpoint');
  }
});

test('fixture dir holds exactly the index plus the indexed tab files', () => {
  const files = readdirSync(fixtureDir).sort();
  const expected = ['index.json', ...index.steps.map(s => s.file)].sort();
  assert.deepEqual(files, expected);
});

test('controller honest-gap strings are verbatim the phone PWA wording (C6)', async () => {
  const model = await import(pathToFileURL(path.resolve(testDir, '..', '..', 'mobile-relay', 'ux', 'model.mjs')));
  assert.equal(model.NOT_AVAILABLE, 'Not available yet — the Host did not send this to the phone.');
  // NOT_AVAILABLE in the browser controller: extracted from its const literal.
  const na = controllerSrc.match(/const NOT_AVAILABLE = '([^']*)'/);
  assert.ok(na, 'controller.js missing NOT_AVAILABLE const');
  assert.equal(na[1], model.NOT_AVAILABLE, 'controller NOT_AVAILABLE drifted from ux/model.mjs');

  // LIVE_STATE_LABELS: extract each key from the controller's frozen literal.
  const block = controllerSrc.match(/const LIVE_STATE_LABELS = Object\.freeze\(\{([\s\S]*?)\}\)/);
  assert.ok(block, 'controller.js missing LIVE_STATE_LABELS');
  const expected = Object.entries(model.LIVE_STATE_LABELS);
  assert.ok(expected.length === 10, 'unexpected LIVE_STATE_LABELS shape: ' + expected.length);
  for (const [key, value] of expected) {
    const m = block[1].match(new RegExp(key + ":\\s*'([^']*)'"));
    assert.ok(m, 'controller.js missing label for ' + key);
    assert.equal(m[1], value, 'controller label for ' + key + ' drifted from ux/model.mjs');
  }
});

test('poll-round.mjs reads the disk inbox only — valid run exits 0, bad args exit 1', () => {
  const script = path.join(demoDir, 'poll-round.mjs');
  assert.ok(typeof script === 'string' && script.length > 0);
  // Empty repo inbox: --last 1 prints [] and exits 0 (disk read only, no fetch).
  const out = execFileSync('bun', [script, '--last', '1'], { encoding: 'utf8' });
  assert.match(out.trim(), /^\[[\s\S]*\]$/, 'poll-round stdout is not a JSON array: ' + out.slice(0, 80));
  assert.doesNotMatch(out, /https?:\/\//);
  // Invalid argument values fail closed with exit code 1.
  for (const args of [['--last', '-1'], ['--last', 'x'], ['--bogus'], ['--since']]) {
    let failed = false;
    try {
      execFileSync('bun', [script, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      failed = true;
      assert.equal(err.status, 1, 'poll-round ' + args.join(' ') + ' expected exit 1');
    }
    assert.equal(failed, true, 'poll-round ' + args.join(' ') + ' unexpectedly succeeded');
  }
});

// --- C5 ownership tests (fixture shape as delivered, never raw SPEC dotted
// keys; SPEC values pinned; controller.js parse proven against the parcel) ---
const SPEC_DOTTED_KEYS = [
  'S.statusObj.snapshot.live', 'S.statusObj.snapshot.bootstrap', 'S.convs', 'S.cmds',
  'S.manifest.providers', 'S.device', 'S.media', 'snapshot.personalAgent',
  'snapshot.bootstrap.worldId', 'snapshot.bridge', 'snapshot.live', 'snapshot.bootstrap',
  'bootstrap.progress.passes', 'control language pack', 'plan response',
  'execute receipt', 'control recent'
];
const dig = (obj, dotted) => dotted.split('.').reduce((o, k) => (o && typeof o === 'object' && k in o) ? o[k] : undefined, obj);
function specKeyViolations(md, prefix = '') {
  const hits = [];
  for (const [k, v] of Object.entries(md ?? {})) {
    const full = prefix + k;
    if (SPEC_DOTTED_KEYS.includes(full)) hits.push(full);
    if (v && typeof v === 'object' && !Array.isArray(v)) hits.push(...specKeyViolations(v, full + '.'));
  }
  return hits;
}
const stepMockData = id =>
  JSON.parse(readFileSync(path.join(fixtureDir, index.steps.find(s => s.itemId === id).file), 'utf8')).mockData;

test('C5: delivered mockData shape — statusObj.snapshot.*, bare device/manifest/media/convs, liveStateLabels', () => {
  const today = stepMockData('tab-today');
  assert.equal(dig(today, 'statusObj.snapshot.live.state'), 'ok');
  assert.deepEqual(dig(today, 'statusObj.snapshot.bootstrap.progress.passes'), []);
  assert.equal(today.ctx.connection, 'Direct to your PC');
  assert.equal(today.ctx.pendingSend, false);
  assert.deepEqual(today.liveStateLabels, { 'claimed': 'Claimed by worker — not sent' });

  const talk = stepMockData('tab-talk');
  assert.equal(dig(talk, 'statusObj.snapshot.live.state'), 'ok');
  assert.ok(Array.isArray(talk.convs) && talk.convs.length === 2, 'tab-talk bare convs[]');
  assert.ok(Array.isArray(talk.cmds) && talk.cmds.length === 1, 'tab-talk bare cmds[]');
  assert.ok(Array.isArray(talk.manifest.providers), 'tab-talk manifest.providers under bare manifest');
  assert.deepEqual(talk.liveStateLabels, { 'waiting_reply': 'Send observed — awaiting reply' });
  assert.deepEqual(talk.state, { paired: true, transportDirect: true, hostPreview: false });

  const build = stepMockData('tab-build');
  assert.equal(build.intent, 'show ARBOR progress projection');
  assert.deepEqual(build.compiled, { kind: 'visual-update', surfaceId: 'vivim.ui-surface/1', revision: 8, guarded: true, publishable: false, reason: 'pending owner approval' });
  assert.deepEqual(build.proposal, { status: 'pending', preview: 'ARBOR progress projection · source-backed revision 8', state: 'is-done' });
  assert.equal(build.approvalRequired, true);

  const world = stepMockData('tab-world');
  assert.equal(world.hostReported, true);
  assert.deepEqual(world.revision, { surfaceId: 'vivim.ui-surface/1', revision: 7, status: 'committed', changeId: 'chg_001', parentRevision: 6 });
  assert.deepEqual(world.built, [
    { title: 'Wiki page · ARBOR roadmap', detail: 'Approved edit · revision 7' },
    { title: 'Chat journal entry', detail: 'Durable entry · source host-command' }
  ]);
  assert.deepEqual(world.running, []);
  assert.deepEqual(world.queue, { queued: 0, claimed: 0, done: 3, failed: 0 });
  assert.equal(world.undoAvailable, true);
  assert.equal(world.changeHint, 'Build proposes a change; your PC commits it as a new revision you can undo.');
  assert.equal(world.empty, false);
  assert.equal(world.emptyMessage, 'The Host committed revision 7, and it holds no components yet.');
  assert.deepEqual(world.gaps, []);

  const me = stepMockData('tab-me');
  assert.equal(dig(me, 'statusObj.snapshot.personalAgent.agentId'), 'owen-local');
  assert.equal(dig(me, 'statusObj.snapshot.bootstrap.worldId'), 'home-main');
  assert.deepEqual(me.device, { status: 'active', scopes: ['control:read', 'chat:send'] });
  assert.deepEqual(me.ctx, { mode: 'direct' });

  const control = stepMockData('tab-control');
  assert.ok(Array.isArray(control.control.catalog.actions), 'tab-control bare control');
  assert.equal(typeof control.plan.planDigest, 'string', 'tab-control bare plan');
  assert.equal(control.receipt.undo.actionId, 'theme.unset', 'tab-control bare receipt');
  assert.ok(Array.isArray(control.recent.items), 'tab-control bare recent');
});

test('C5: parcel carries NO raw SPEC dotted mockData keys (re-flatten to SPEC letter false-fails here)', () => {
  for (const s of index.steps) {
    const md = JSON.parse(readFileSync(path.join(fixtureDir, s.file), 'utf8')).mockData;
    assert.deepEqual(specKeyViolations(md), [], s.file + ' still uses raw SPEC dotted key(s)');
  }
});

test('C5: SPEC values survived the restructure field-for-field (planDigest exact)', () => {
  const control = stepMockData('tab-control');
  assert.equal(control.plan.planDigest,
    '3f9ac2b17d44e8a0c6b5d2f1e7a8b9c0d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8');
  assert.deepEqual(
    (({ outcome, title, args, risk, expiresAt, liveAcceptance }) => ({ outcome, title, args, risk, expiresAt, liveAcceptance }))(control.plan),
    { outcome: 'approval_required', title: 'Set theme to dusk', args: { theme: 'dusk' }, risk: 'low', expiresAt: '2026-11-14T09:45:00Z', liveAcceptance: 'verified' });
  assert.deepEqual(control.receipt, {
    status: 'applied', actionId: 'theme.set', planId: 'p-1', at: '2026-11-14T09:41:00Z',
    result: { theme: 'dusk' }, undo: { actionId: 'theme.unset', args: {} }
  });
  assert.deepEqual(control.recent.items,
    [{ actionId: 'theme.set', state: 'applied', createdAt: '2026-11-14T09:41:00Z' }]);
  assert.deepEqual(control.control, {
    catalog: { actions: [{ id: 'theme.set', title: 'Set theme', risk: 'low', readiness: 'verified',
      examples: ['Set my theme to dusk', 'Use the light theme'] }] },
    world: { themes: ['dusk', 'light'] }
  });

  const talk = stepMockData('tab-talk');
  assert.deepEqual(talk.convs.map(c => ({ id: c.id, title: c.title, provider: c.provider })),
    [{ id: 'c-1', title: 'Theme test', provider: 'chatgpt' }, { id: 'c-2', title: 'Research plan', provider: 'claude' }]);
  assert.equal(talk.cmds[0].text, 'Set my theme to dusk');
  assert.equal(talk.cmds[0].target.provider, 'chatgpt');
  assert.equal(talk.cmds[0].conversationId, 'c-1');
  assert.deepEqual(talk.manifest.providers.map(p => ({ id: p.id, signedIn: p.signedIn })),
    [{ id: 'chatgpt', signedIn: true }, { id: 'claude', signedIn: false }]);

  const today = stepMockData('tab-today');
  assert.equal(today.commands[0].id, 'cmd-9');
  assert.equal(today.commands[0].status, 'failed');
  assert.equal(dig(today, 'statusObj.snapshot.live.conversations.0.provider'), 'chatgpt');

  const build = stepMockData('tab-build');
  assert.equal(build.intent, 'show ARBOR progress projection');
  assert.deepEqual(build.compiled, { kind: 'visual-update', surfaceId: 'vivim.ui-surface/1', revision: 8, guarded: true, publishable: false, reason: 'pending owner approval' });
  assert.deepEqual(build.proposal, { status: 'pending', preview: 'ARBOR progress projection · source-backed revision 8', state: 'is-done' });
  assert.equal(build.approvalRequired, true);

  const world = stepMockData('tab-world');
  assert.equal(world.hostReported, true);
  assert.deepEqual(world.revision,
    { surfaceId: 'vivim.ui-surface/1', revision: 7, status: 'committed', changeId: 'chg_001', parentRevision: 6 });
  assert.deepEqual(world.built.map(b => ({ title: b.title, detail: b.detail })),
    [{ title: 'Wiki page · ARBOR roadmap', detail: 'Approved edit · revision 7' },
     { title: 'Chat journal entry', detail: 'Durable entry · source host-command' }]);
  assert.deepEqual(world.running, []);
  assert.deepEqual(world.queue, { queued: 0, claimed: 0, done: 3, failed: 0 });
  assert.equal(world.undoAvailable, true);
  assert.equal(world.changeHint, 'Build proposes a change; your PC commits it as a new revision you can undo.');

  const me = stepMockData('tab-me');
  assert.equal(me.commands.length, 8);
  assert.deepEqual(me.commands.map(c => c.updatedAt),
    [...me.commands.map(c => c.updatedAt)].sort().reverse());
  assert.deepEqual(me.manifest.providers.map(p => ({ id: p.id, signedIn: p.signedIn })),
    [{ id: 'chatgpt', signedIn: true }, { id: 'claude', signedIn: false }, { id: 'qwen', signedIn: false }]);
  assert.deepEqual(dig(me, 'statusObj.snapshot.personalAgent'),
    { agentId: 'owen-local', scope: 'owner', identityAssurance: 'device-bound', initialized: true });
});

// Controller-parse coupling: run the real controller.js in a stub DOM with
// fetch reading the REAL parcel files from public/demo/fixture on disk (no
// network, no mock substitution — the .verify/demo-verify.mjs harness that
// substituted SPEC-shaped mocks for tab-me/tab-control is superseded by this
// test), then assert every SPEC row renders and the honest gap
// ('Not available yet…') never leaks — every SPEC field set exists.
const vmById = {};
class FakeEl {
  constructor() { this.children = []; this.attrs = {}; this.listeners = {}; this.value = ''; this._text = ''; this._class = ''; this.disabled = false; }
  appendChild(c) { this.children.push(c); return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  addEventListener(t, fn) { (this.listeners[t] ??= []).push(fn); }
  // textContent reads the whole subtree (real DOM semantics); setting it
  // replaces all children with the text.
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
  set textContent(v) { this._text = String(v); this.children = []; }
  set className(v) { this._class = String(v); }
  get className() { return this._class; }
  click() { (this.listeners.click ?? []).forEach(f => f()); }
}
test('C5: controller.js parses the delivered nested parcel — every SPEC row renders, no honest-gap leakage', async () => {
  globalThis.document = {
    getElementById(id) { if (!vmById[id]) vmById[id] = new FakeEl(); return vmById[id]; },
    createElement() { return new FakeEl(); },
    addEventListener() {},
    readyState: 'complete'
  };
  globalThis.localStorage = { getItem: () => null, setItem() {} };
  globalThis.fetch = async url => {
    if (typeof url === 'string' && url.startsWith('/demo/fixture/')) {
      const body = JSON.parse(readFileSync(path.join(fixtureDir, url.slice('/demo/fixture/'.length)), 'utf8'));
      return { ok: true, status: 200, json: async () => body };
    }
    return { ok: false, status: 404, json: async () => { throw new Error('not json'); } };
  };
  runInContext(controllerSrc, createContext(globalThis));
  for (let i = 0; i < 100 && vmById['demo-strip']?.children.length !== STEP_IDS.length; i++) {
    await new Promise(r => setTimeout(r, 10));
  }
  const strip = vmById['demo-strip'];
  assert.equal(strip.children.length, STEP_IDS.length,
    'controller failed to load the parcel; demo-status: ' + (vmById['demo-status']?.textContent ?? '(unset)'));
  assert.equal(vmById['demo-status'].textContent, '', 'status must be cleared after a clean load');

  const MUST = {
    'tab-today': ['Connection', 'Direct to your PC · tone ok · paired',
      'Running', 'Chat · chatgpt · gpt-5 · Claimed by worker — not sent',
      'Needs you', 'cmd-9 Set my theme to dusk — failed'],
    'tab-talk': ['Conversations', 'Theme test', 'Research plan',
      'Your message', 'Set my theme to dusk · chatgpt · c-1',
      'Reply state', 'Send observed — awaiting reply',
      'Providers', 'ChatGPT signed in · Claude not signed in'],
    'tab-build': ['Intent', 'show ARBOR progress projection',
      'Compiled', 'visual-update · vivim.ui-surface/1 r8 · guarded true · publishable false · pending owner approval',
      'Proposal', 'pending · ARBOR progress projection · source-backed revision 8 · is-done',
      'Approval required', 'yes — publish blocked until owner approves'],
    'tab-world': ['Committed revision', 'vivim.ui-surface/1 r7 · committed · chg_001 ← r6',
      'What was built', 'Wiki page · ARBOR roadmap · Approved edit · revision 7   Chat journal entry · Durable entry · source host-command',
      'Queue', 'queued 0 · claimed 0 · done 3 · failed 0',
      'Undo', 'available — undo cue exposed',
      'Change hint', 'Build proposes a change; your PC commits it as a new revision you can undo.'],
    'tab-me': ['Personal agent', 'owen-local · scope owner · device-bound · initialized Yes',
      'World', 'home-main',
      'Phone connection', 'active · scopes control:read · chat:send · mode direct',
      'Signed-in AI', 'chatgpt ✓ · claude ✗ · qwen ✗',
      'Activity record', 'rc-8 Set my theme to dusk — done', 'rc-3 Send the daily note — failed'],
    'tab-control': ['Available commands', '1 of 1 cataloged', 'theme.set Set theme · risk low · verified',
      'Examples', 'Set my theme to dusk · Use the light theme',
      'Themes', 'dusk · light',
      'Approval card', 'Set theme to dusk · theme=dusk · risk low · Exact plan 3f9ac2b1… · expires 2026-11-14T09:45:00Z',
      'Execute receipt', 'applied · theme.set · plan p-1 · at 2026-11-14T09:41:00Z · theme=dusk',
      'Undo', 'actionId theme.unset',
      'Recent Host decisions', 'theme.set — applied · 2026-11-14T09:41:00Z'],
    'A02': ['Committed revision', 'vivim.ui-surface/1 r7 · committed · chg_001 ← r6',
      'What was built', 'Wiki page · ARBOR roadmap · Approved edit · revision 7   Chat journal entry · Durable entry · source host-command',
      'Queue', 'queued 0 · claimed 0 · done 3 · failed 0',
      'Undo', 'available — undo cue exposed',
      'Change hint', 'Build proposes a change; your PC commits it as a new revision you can undo.'],
    'A04': ['Intent', 'show ARBOR progress projection',
      'Compiled', 'visual-update · vivim.ui-surface/1 r8 · guarded true · publishable false · pending owner approval',
      'Proposal', 'pending · ARBOR progress projection · source-backed revision 8 · is-done',
      'Approval required', 'yes — publish blocked until owner approves'],
    'A05': ['Proposal', 'prop_001 · applied yes',
      'Committed revision', 'vivim.ui-surface/1 r9 · commit 3dae90c',
      'Test receipts', 'scripts/acceleration/live-host-check.test.mjs',
      'Next batch', 'Build something · Next scoped repair ready → build',
      'Running lane queue', 'queued 1 · claimed 0 · done 4 · failed 0']
  };
  const STRIP_IDS = index.steps.map(s => s.itemId);
  STRIP_IDS.forEach((id, i) => {
    strip.children[i].click();
    const text = vmById['demo-phone'].textContent;
    for (const m of MUST[id]) {
      assert.ok(text.includes(m), id + ' must render ' + JSON.stringify(m) + '; phone text: ' + JSON.stringify(text));
    }
    assert.ok(!text.includes('Not available yet'), id + ' must not render the honest gap: every SPEC field set exists');
  });
});
