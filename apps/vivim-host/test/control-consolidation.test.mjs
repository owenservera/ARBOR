// VERIFY:CONSOLIDATE — apps/vivim-host/control
//
// Pins the authority boundary of the modules in this unit so a later change
// cannot quietly cross it:
//   * control/journal.mjs is the ONLY effect fence — one claim per plan, a claim
//     without a receipt is surfaced as `uncertain` and never retried;
//   * control/browser-session.mjs mints short-lived UI codes and sessions only —
//     no grant, effect or approval surface;
//   * control/action-catalog.v1.json is the only action registry and
//     control/command-intent.d.ts matches the exported command-intent contract;
//   * the NLCL engine has one implementation (apps/mobile-relay/control-language.mjs);
//     control/ consumes it through thin callers, so no parallel interpreter;
//   * heldout.v1.json, rdcb-*.mjs and file-surface-gen.mjs stay test/development
//     artifacts with no product importer.
//
// Host is the sole effect and World authority. Nothing asserted here grants access.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createControlJournal, JOURNAL_SCHEMA, newPlanId } from '../control/journal.mjs';
import * as browserSession from '../control/browser-session.mjs';
import { controlErrorStatus } from '../control/http-status.mjs';
import { createLexiconStore, LEXICON_SCHEMA } from '../control/lexicon.mjs';
import { BOOTSTRAP_ACTIONS, BOOTSTRAP_ACTION_SET } from '../control/bootstrap-actions.mjs';
import { deriveSemanticCorrection, evaluateSemanticShadow } from '../control/personal-correction.mjs';
import { observePersonalLanguage } from '../control/personal-semantic-observer.mjs';
import { COMMAND_INTENT_SCHEMA } from '../control/command-intent.mjs';

const CONTROL_DIR = fileURLToPath(new URL('../control/', import.meta.url));
const HOST_ROOT = fileURLToPath(new URL('../', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const readJson = url => JSON.parse(readFileSync(url, 'utf8'));
const catalog = readJson(new URL('../control/action-catalog.v1.json', import.meta.url));
const catalogIds = new Set(catalog.actions.map(a => a.id));

function tempRoot(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vivim-control-consolidation-'));
  t.after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
  return dir;
}

const planFor = (id, over = {}) => ({
  planId: id,
  actionId: 'ui.theme.set_preset',
  risk: 'R1',
  planDigest: 'a'.repeat(64),
  source: 'desktop',
  origin: 'typed',
  actor: 'desktop-owner',
  args: { preset: 'dusk' },
  createdAt: new Date(0).toISOString(),
  ...over
});

const approvalFor = (id, planDigest = 'a'.repeat(64)) => ({
  planId: id, planDigest, channel: 'desktop-owner-token', actor: 'desktop-owner'
});

function jsFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) jsFiles(abs, out);
    else if (/\.(mjs|js)$/.test(entry.name)) out.push(abs);
  }
  return out;
}

test('journal is the only effect fence: one claim per plan, uncertain is never retried', t => {
  const journal = createControlJournal({ dataRoot: tempRoot(t) });
  assert.equal(journal.schema, JOURNAL_SCHEMA);

  const id = newPlanId();
  assert.match(id, /^ctl-[a-f0-9]{16}$/);
  journal.record(planFor(id));
  assert.equal(journal.get(id).state, 'planned');
  assert.throws(() => journal.record(planFor(id)), /CONTROL_PLAN_EXISTS/);
  assert.throws(() => journal.record(planFor('nope')), /CONTROL_PLAN_ID/);

  // An approval bound to a different digest is a conflict, never an authorization.
  assert.throws(() => journal.approve(id, approvalFor(id, 'b'.repeat(64))), /CONTROL_APPROVAL_CONFLICT/);

  journal.approve(id, approvalFor(id));
  assert.equal(journal.get(id).state, 'approved');

  assert.equal(journal.claim(id), true, 'first claim wins the effect fence');
  assert.equal(journal.claim(id), false, 'a second claim is refused — the effect never re-executes');
  assert.equal(journal.get(id).claimed, true);
  assert.equal(journal.get(id).state, 'uncertain', 'claimed without a receipt is surfaced, not retried');

  const receipt = { planId: id, actionId: 'ui.theme.set_preset', status: 'applied', result: { preset: 'dusk' } };
  journal.finish(id, receipt);
  assert.equal(journal.get(id).state, 'applied');
  assert.throws(() => journal.finish(id, receipt), /CONTROL_RECEIPT_EXISTS/);

  assert.equal(journal.recent(10).filter(r => r.planId === id).length, 1);
  const events = readFileSync(path.join(journal.dir, '..', 'events.jsonl'), 'utf8')
    .trim().split('\n').map(line => JSON.parse(line));
  assert.deepEqual(events.map(e => e.kind), ['planned', 'approved', 'claimed', 'applied']);
});

test('browser-session exposes codes and sessions only — no grant, effect or approval surface', t => {
  assert.deepEqual(Object.keys(browserSession).sort(), ['UI_COOKIE', 'createControlBrowserSessions']);

  const store = browserSession.createControlBrowserSessions({
    now: () => 1000, codeTtlMs: 500, sessionTtlMs: 5000
  });
  const issued = store.issue();
  assert.match(issued.code, /^[a-f0-9]{64}$/);
  const opened = store.exchange(issued.code);
  assert.match(opened.sessionId, /^[a-f0-9]{64}$/);
  assert.throws(() => store.exchange(issued.code), /CONTROL_UI_CODE_UNKNOWN/);

  const req = { headers: { cookie: browserSession.UI_COOKIE + '=' + opened.sessionId } };
  assert.equal(store.authorized(req), true);
  assert.equal(store.authorized(req, { mutate: true }), false, 'mutation needs the CSRF proof');
  req.headers['x-vivim-ui-csrf'] = 'f'.repeat(64);
  assert.equal(store.authorized(req, { mutate: true }), false, 'a forged CSRF proof is refused');
  req.headers['x-vivim-ui-csrf'] = opened.csrf;
  assert.equal(store.authorized(req, { mutate: true }), true);

  store.revoke(req);
  assert.equal(store.authorized(req), false);
});

test('control error codes keep their status mapping and unknown codes fail closed to 400', () => {
  assert.equal(controlErrorStatus('CONTROL_PLAN_TAMPERED'), 409);
  assert.equal(controlErrorStatus('CONTROL_UNCERTAIN'), 409);
  assert.equal(controlErrorStatus('CONTROL_PLAN_EXPIRED'), 410);
  assert.equal(controlErrorStatus('CONTROL_WIKI_CONTENT_INVALID'), 413);
  assert.equal(controlErrorStatus('CONTROL_WIKI_NOT_READY'), 503);
  assert.equal(controlErrorStatus('CONTROL_NOT_A_REAL_CODE'), 400);
});

test('lexicon only teaches spoken catalog actions and never re-routes a reserved word', t => {
  const store = createLexiconStore({ dataRoot: tempRoot(t), catalog, now: () => '2026-11-20T00:00:00.000Z' });
  assert.equal(store.schema, LEXICON_SCHEMA);

  assert.throws(() => store.teach({ word: 'teach', actionId: 'ui.theme.undo' }), /CONTROL_WORD_RESERVED/);
  assert.throws(() => store.teach({ word: 'blitz', actionId: 'machine.rocket.launch' }), /CONTROL_TEACH_TARGET_INVALID/);
  assert.throws(() => store.teach({ word: '9litz', actionId: 'ui.theme.undo' }), /CONTROL_WORD_INVALID/);

  const taught = store.teach({ word: 'blitz', actionId: 'ui.theme.undo' });
  assert.equal(taught.actionId, 'ui.theme.undo');
  assert.deepEqual(store.entries().find(e => e.word === 'blitz'), { word: 'blitz', actionId: 'ui.theme.undo' });

  const forgot = store.forget({ word: 'blitz' });
  assert.equal(forgot.forgot, 'ui.theme.undo');
  assert.equal(store.entries().some(e => e.word === 'blitz'), false);
  const stored = readJson(new URL('file://' + store.file.split('\\').join('/')));
  assert.deepEqual(stored.history.map(h => h.op), ['teach', 'forget'], 'forget is history, never erasure');
});

test('personal correction and observation stay inert proposals — never an activation', () => {
  const refused = deriveSemanticCorrection({});
  assert.equal(refused.outcome, 'refused');
  assert.equal(refused.executionAuthorized, false);

  const proposal = deriveSemanticCorrection({
    phrase: 'use dusk at night',
    corrected: { actionId: 'ui.theme.set_preset', args: { preset: 'dusk' } },
    scope: { surface: 'desktop' },
    catalog
  });
  assert.equal(proposal.outcome, 'proposal');
  assert.equal(proposal.executionAuthorized, false);
  assert.equal(proposal.rule.state, 'proposed');

  const shadow = evaluateSemanticShadow({
    rule: proposal.rule,
    catalog,
    examples: [{ text: 'use dusk at night', baseline: { outcome: 'interpretation_required' },
      scope: { surface: 'desktop' }, expected: 'candidate',
      actionId: 'ui.theme.set_preset', args: { preset: 'dusk' } }]
  });
  assert.equal(shadow.status, 'pass');
  assert.equal(shadow.executionPerformed, false);

  const inert = observePersonalLanguage({ events: [{ kind: 'receipt', source: 'host' }], catalog });
  assert.equal(inert.status, 'inert-proposals');
  assert.equal(inert.activationPermitted, false);

  const trusted = kind => ({ kind: 'owner-confirmed-meaning', source: 'trusted-host-feedback',
    phrase: 'use dusk at night', eventId: 'event-000' + kind, actionId: 'ui.theme.set_preset',
    args: { preset: 'dusk' }, scope: { surface: 'desktop' } });
  const observed = observePersonalLanguage({
    events: [trusted('1'), trusted('1'), trusted('2'), trusted('3')],
    catalog,
    minConfirmations: 3
  });
  assert.equal(observed.status, 'inert-proposals');
  assert.equal(observed.activationPermitted, false);
  assert.equal(observed.candidates.length, 1, 'replayed delivery must not fabricate confirmations');
  assert.equal(observed.candidates[0].evidence.confirmationCount, 3);
  assert.equal(observed.candidates[0].executionAuthorized, false);
});

test('bootstrap allowlist has exactly one definition and every id is a catalog action', () => {
  assert.ok(Object.isFrozen(BOOTSTRAP_ACTIONS));
  assert.deepEqual([...BOOTSTRAP_ACTION_SET], BOOTSTRAP_ACTIONS);
  assert.equal(BOOTSTRAP_ACTION_SET.size, BOOTSTRAP_ACTIONS.length);

  const definitions = [];
  const scan = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(abs);
      else if (/\.(mjs|js)$/.test(entry.name) &&
        /^export const BOOTSTRAP_ACTIONS\b/m.test(readFileSync(abs, 'utf8'))) definitions.push(abs);
    }
  };
  for (const root of ['apps', 'harness', 'studio', 'hq']) scan(path.join(REPO_ROOT, root));
  assert.deepEqual(definitions.map(p => path.relative(REPO_ROOT, p).split(path.sep).join('/')),
    ['apps/vivim-host/control/bootstrap-actions.mjs'],
    'a second allowlist is a second authority');

  for (const id of BOOTSTRAP_ACTIONS) {
    assert.match(id, /^[a-z][a-z0-9-]*$/);
  }
});

test('action catalog is the only action registry and the command-intent contract matches it', async () => {
  assert.equal(catalog.schema, 'vivim.control-action-catalog/1');
  assert.ok(Number.isSafeInteger(catalog.version));
  const seen = new Set();
  for (const action of catalog.actions) {
    assert.ok(!seen.has(action.id), 'duplicate catalog id ' + action.id);
    seen.add(action.id);
    assert.equal(typeof action.title, 'string');
    assert.equal(typeof action.owner, 'string');
    assert.ok(['R0', 'R1', 'R2', 'R3'].includes(action.risk), action.id + ' risk');
    assert.ok(['adapter_pending', 'enforcement_missing', 'unsupported', 'source_wired', 'verified']
      .includes(action.readiness), action.id + ' readiness');
    for (const spec of Object.values(action.args ?? {})) {
      assert.ok(['string', 'enum'].includes(spec.type), action.id + ' arg type');
    }
  }

  const dts = readFileSync(new URL('../control/command-intent.d.ts', import.meta.url), 'utf8');
  assert.match(dts, /'vivim\.command-intent\/0\.1'/);
  assert.equal(COMMAND_INTENT_SCHEMA, 'vivim.command-intent/0.1');
  assert.match(dts, /export declare function toCommandIntent/);
  assert.match(dts, /export declare function validateAiCommandCandidate/);

  const intent = await import('../control/command-intent.mjs');
  assert.equal(typeof intent.toCommandIntent, 'function');
  assert.equal(typeof intent.validateAiCommandCandidate, 'function');

  const hostPkg = readJson(new URL('../package.json', import.meta.url));
  assert.equal(hostPkg.scripts.control, 'node control/cli.mjs', 'cli.mjs is a real product entry point');
});

test('the NLCL engine has one implementation: no parallel interpreter inside control/', () => {
  const modules = readdirSync(CONTROL_DIR).filter(f => f.endsWith('.mjs'));
  const engineConsumers = modules
    .filter(f => readFileSync(path.join(CONTROL_DIR, f), 'utf8').includes('mobile-relay/control-language.mjs'))
    .sort();
  assert.deepEqual(engineConsumers, ['command-intent.mjs', 'dispatcher.mjs', 'intent-planner.mjs'],
    'only thin callers of the shared engine may live here');

  for (const file of modules) {
    const body = readFileSync(path.join(CONTROL_DIR, file), 'utf8');
    assert.doesNotMatch(body, /^\s*verbs:\s*\[/m, file + ' carries grammar data; grammar belongs to the catalog');
  }
});

test('heldout.v1.json, rdcb-*.mjs and file-surface-gen.mjs have no product importer', () => {
  const product = jsFiles(HOST_ROOT).filter(p => !p.includes(`${path.sep}test${path.sep}`));
  for (const file of product) {
    const body = readFileSync(file, 'utf8');
    assert.ok(!body.includes('heldout.v1.json'), file + ' reads the held-out fixture');
    if (!file.startsWith(CONTROL_DIR)) {
      assert.doesNotMatch(body, /rdcb-gen|rdcb-cache|file-surface-gen/,
        file + ' reaches a development/evidence-only generator');
    }
  }
});

test('the golden corpus only names real catalog actions', () => {
  const corpus = readJson(new URL('../control/corpus.v1.json', import.meta.url));
  assert.equal(corpus.schema, 'vivim.control-corpus/1');
  assert.ok(Array.isArray(corpus.cases) && corpus.cases.length > 0);
  for (const entry of corpus.cases) {
    assert.equal(typeof entry.text, 'string');
    assert.ok(['candidate', 'clarification_required', 'interpretation_required', 'incomplete', 'empty']
      .includes(entry.outcome), JSON.stringify(entry.text) + ' outcome');
    if (entry.actionId) assert.ok(catalogIds.has(entry.actionId),
      JSON.stringify(entry.text) + ' -> unknown action ' + entry.actionId);
  }
});