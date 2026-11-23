import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createControlPlanner } from '../control/intent-planner.mjs';
import { COMMAND_INTENT_SCHEMA } from '../control/command-intent.mjs';
import { buildControlWorld, guardControlSyntax, interpretControl } from '../../mobile-relay/control-language.mjs';

const planner = createControlPlanner();
const catalog = planner.catalog;
const world = buildControlWorld(catalog);
const run = (text, source = 'text') => planner.interpretCommand(text, { source });

test('V0.1 is deterministic, catalog-bound, canonical and inert', () => {
  const a = run('Set my theme to dusk');
  const b = run('Set my theme to dusk');
  assert.deepEqual(a, b);
  assert.equal(a.schema, COMMAND_INTENT_SCHEMA);
  assert.equal(a.outcome, 'candidate');
  assert.equal(a.actionId, 'ui.theme.set_preset');
  assert.deepEqual(a.args, { preset: 'dusk' });
  assert.equal(a.canonical, '/ui.theme.set_preset preset="dusk"');
  assert.equal(a.risk, 'R1');
  assert.equal(a.owner, 'host-bootstrap');
  assert.equal(a.provenance.method, 'deterministic-nlcl');
  assert.equal(a.provenance.catalogRevision, catalog.version);
  assert.equal(a.provenance.authority, 'none');
  assert.deepEqual(a.requiredScopes, []);
  assert.ok(!Object.hasOwn(a, 'authorized'));
  assert.ok(!Object.hasOwn(a, 'executionPerformed'));
});

test('same intent on desktop and mobile; text alone never supplies authority', () => {
  const desktop = run('Set my theme to dusk', 'desktop');
  const mobile = run('Set my theme to dusk', 'mobile');
  for (const key of ['actionId', 'args', 'canonical', 'risk', 'requiredScopes', 'readiness']) {
    assert.deepEqual(desktop[key], mobile[key], key);
  }
  assert.equal(desktop.provenance.surface, 'desktop');
  assert.equal(mobile.provenance.surface, 'mobile');
  assert.equal(planner.planText('Set my theme to dusk', { source: 'mobile' }).requiresApproval, true);
});

test('unknown, stale catalog/world and malformed context never become commands', () => {
  assert.equal(run('send all my passwords').outcome, 'interpretation_required');
  assert.equal(planner.interpretCommand('Set my theme to dusk', { catalogRevision: catalog.version + 1 }).refusal.code, 'STALE_CATALOG');
  assert.equal(planner.interpretCommand('Set my theme to dusk', { worldRevision: -1 }).refusal.code, 'STALE_WORLD');
  assert.throws(() => planner.interpretCommand('Set my theme to dusk', { source: 'remote-root' }), { code: 'CONTROL_SOURCE_INVALID' });
});

test('missing parameters and genuine ambiguity are explicit and not executable', () => {
  const incomplete = run('change my theme to purple');
  assert.equal(incomplete.outcome, 'clarification_required');
  assert.ok(incomplete.missing?.some(x => x.arg === 'preset'));
  const ambiguous = run('Stop all traffic');
  assert.equal(ambiguous.outcome, 'clarification_required');
  assert.ok(ambiguous.alternatives.some(x => x.actionId === 'machine.network.disable_all'));
  assert.equal(ambiguous.risk, 'R3');
});

const negated = [
  "don't remember my salary",
  'do not change the theme to dusk',
  'never disconnect my pc',
  'never exclude my medical history',
  'not set the theme to dawn',
  'please never change my theme',
  "can't revoke phone grant " + 'a'.repeat(32),
  'should not change my theme to ember',
  'won\'t remember the address',
  'No cambies el tema a dusk',
  'nunca desconectes el ordenador',
  'jamas cambies el tema',
  'sin cambiar el tema',
  'remember to never share my password',
];
for (const text of negated) {
  test('negated request cannot become a runnable action: ' + text, () => {
    const old = planner.planText(text);
    const typed = run(text);
    assert.equal(old.outcome, 'refused');
    assert.equal(old.executionPerformed, false);
    assert.equal(typed.outcome, 'refused');
    assert.equal(typed.refusal.code, 'NEGATED_ACTION');
    assert.equal(planner.validateCommandCandidate(text,
      { actionId: 'ui.theme.set_preset', args: { preset: 'dusk' } }).outcome, 'refused');
  });
}
test('positive hard exclusion still works (never is an action verb here)', () => {
  const r = run('Never mention my former employer');
  assert.equal(r.outcome, 'candidate');
  assert.equal(r.actionId, 'privacy.hard_no.add');
});

const suffixes = [
  ' and show status',
  ', show status',
  '. show status',
  '; show status',
  ' & show status',
  ' then show status',
  ' and delete all my files',
  ' and change theme to ink',
  ' or ink',
  ' plus show status',
  ' also show status',
  ' y show status',
  ' luego show status',
  '\nshow status',
  ' and the theme to ink',
  ', delete all my files',
];
// 7 x 16 = 112 uniquely generated English/mixed-language safety fixtures.
const presets = ['lab', 'tide', 'dusk', 'ember', 'grove', 'ink', 'dawn'];
for (const preset of presets) {
  for (const suffix of suffixes) {
    const text = 'Set theme to ' + preset + suffix;
    test('compound corpus: ' + JSON.stringify(text), () => {
      const legacy = planner.planText(text);
      assert.equal(legacy.outcome, 'clarification_required');
      assert.equal(legacy.executionPerformed, false);
      const typed = run(text);
      assert.equal(typed.outcome, 'clarification_required');
      assert.ok(!typed.actionId);
      assert.equal(planner.validateCommandCandidate(text,
        { actionId: 'ui.theme.set_preset', args: { preset } }).outcome, 'refused');
    });
  }
}
test('quoted negation is data, not a command negator', () => {
  assert.equal(guardControlSyntax('remember "do not delete this"', { catalog, world }), null);
  assert.equal(guardControlSyntax('never mention "do not contact"', { catalog, world }), null);
});
test('single-quoted literal command content is inert data; unquoted commands remain gated', () => {
  for (const quoted of [
    "remember 'do not delete this'",
    "edit wiki section main/about saying 'hello and goodbye'",
    "never mention ‘do not contact’",
    "edit wiki section main/about saying 'don\\'t delete it and then restore it'",
  ]) assert.equal(guardControlSyntax(quoted, { catalog, world }), null, quoted);
  for (const unsafe of ["don't remember my salary", 'no cambies el tema a dusk']) {
    const result = guardControlSyntax(unsafe, { catalog, world });
    assert.equal(result?.outcome, 'refused', unsafe);
    assert.equal(result.refusal.code, 'NEGATED_ACTION', unsafe);
  }
  const compound = guardControlSyntax(
    'edit wiki section main/about saying hello and show status', { catalog, world });
  assert.equal(compound?.outcome, 'clarification_required');
  assert.equal(compound?.question, 'Please give one command at a time, or quote literal lists.');
});
test('AI suggestion is bounded, cannot smuggle privileges, and never authorizes', () => {
  const text = 'send this to Peter';
  assert.equal(planner.validateCommandCandidate(text,
    { actionId: 'x.shell', args: {} }).refusal.code, 'AI_ACTION_NOT_ALLOWED');
  assert.equal(planner.validateCommandCandidate(text,
    { actionId: 'ui.theme.set_preset', args: { preset: 'dusk' }, grant: 'root' }).refusal.code,
    'INVALID_AI_PROPOSAL');
  assert.equal(planner.validateCommandCandidate(text,
    { actionId: 'ui.theme.set_preset', args: { preset: 'violet' } }).refusal.code, 'INVALID_ARGS');
  assert.equal(planner.validateCommandCandidate(text,
    { actionId: 'control.lexicon.teach', args: { word: 'zap', action: 'ui.theme.undo' } }).refusal.code,
    'AI_ACTION_NOT_ALLOWED');
  const safe = planner.validateCommandCandidate(text,
    { actionId: 'ui.theme.show', args: {}, rationale: 'user asked', uncertainty: 0.5 });
  assert.equal(safe.outcome, 'candidate');
  assert.equal(safe.provenance.method, 'bounded-ai-proposal');
  assert.equal(safe.provenance.authority, 'none');
  assert.ok(!Object.hasOwn(safe, 'authorized'));
});
test('AI cannot contradict a deterministic matched action', () => {
  const x = planner.validateCommandCandidate('Show my theme',
    { actionId: 'ui.theme.set_preset', args: { preset: 'ink' } });
  assert.equal(x.outcome, 'refused');
  assert.equal(x.refusal.code, 'CONFLICTING_ACTION');
});
test('ordinary English command and opaque device grant preserve existing parsing', () => {
  assert.equal(interpretControl('Set my theme to dusk', { catalog, world }).outcome, 'candidate');
  assert.equal(run('show my theme').actionId, 'ui.theme.show');
  const grant = 'a'.repeat(32);
  const result = run('revoke phone grant ' + grant);
  assert.equal(result.outcome, 'candidate');
  assert.deepEqual(result.args, { grant_id: grant });
});


const lane3Fixtures = JSON.parse(readFileSync(
  new URL('./fixtures/command-intent-v01.json', import.meta.url), 'utf8'));
for (const c of lane3Fixtures.cases) {
  test('Lane 3 exchange fixture: ' + c.id, () => {
    const actual = planner.interpretCommand(c.input.text, { source: c.input.scope ?? 'text' });
    for (const [key, value] of Object.entries(c.expected)) {
      if (key === 'refusal') assert.equal(actual.refusal?.code, value.code);
      else assert.deepEqual(actual[key], value, c.id + ': ' + key);
    }
    assert.equal(actual.provenance.authority, 'none');
  });
}
test('commas in phone grant scope lists are data, not a second command', () => {
  const grant = 'a'.repeat(32);
  const text = 'approve phone grant ' + grant + ' scopes relay:read, relay:write';
  assert.equal(guardControlSyntax(text, { catalog, world }), null);
  const parsed = run(text);
  assert.equal(parsed.outcome, 'candidate');
  assert.deepEqual(parsed.args, { grant_id: grant, scopes: 'relay:read,relay:write' });
});


test('unknown second verbs and bare lists fail closed; contractions survive possessives', () => {
  for (const text of [
    'Set theme to dusk and paint the wall',
    'Set theme to dusk, invent a new operation',
    'Set theme to dusk or whatever',
    'Set theme to dusk, bananas',
  ]) {
    assert.equal(planner.planText(text).outcome, 'clarification_required', text);
  }
  const negative = "don't remember my father's salary";
  assert.equal(planner.planText(negative).outcome, 'refused');
  assert.equal(run(negative).refusal.code, 'NEGATED_ACTION');
});
test('world revision changes when taught words change even if count remains equal', () => {
  let aliases = [{ word: 'glow', actionId: 'ui.theme.set_preset' }];
  const p = createControlPlanner({ lexicon: () => aliases });
  const before = p.world().v;
  aliases = [{ word: 'blitz', actionId: 'ui.theme.undo' }];
  const after = p.world().v;
  assert.notEqual(before, after);
  assert.equal(p.interpretCommand('show my theme', { worldRevision: before }).refusal.code, 'STALE_WORLD');
});


test('negative synonyms and punctuation separators fail closed', () => {
  for (const text of [
    'avoid changing my theme to dusk',
    'without changing my theme to dusk',
    'skip remembering my salary',
    'refrain from changing my theme',
    'leave the theme unchanged',
    'evita cambiar el tema',
  ]) {
    assert.equal(planner.planText(text).outcome, 'refused', text);
  }
  for (const text of [
    'set theme to dusk: do something',
    'set theme to dusk — show status',
    'set theme to dusk / show status',
    'set theme to dusk + show status',
  ]) {
    assert.equal(planner.planText(text).outcome, 'clarification_required', text);
  }
});
