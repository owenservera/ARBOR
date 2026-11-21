// Real Host catalog and committed NLCL golden corpus; no alternate parser or fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildControlWorld, interpretControl } from '../../mobile-relay/control-language.mjs';
import { toCommandIntent, validateAiCommandCandidate } from '../control/command-intent.mjs';
import { runNativeProductPureSync } from '../control/native-product-pure-sync.mjs';
import { resolveBundledRustBinary } from '../chat/rust-context.mjs';

const catalog = JSON.parse(readFileSync(new URL('../control/action-catalog.v1.json', import.meta.url), 'utf8'));
const corpus = JSON.parse(readFileSync(new URL('../control/corpus.v1.json', import.meta.url), 'utf8'));
const hasBinary = () => {
  try { return !!resolveBundledRustBinary('vivim-product-pure'); }
  catch { return false; }
};

test('real NLCL golden cases retain their expected Host intents and native parity', t => {
  let compared = 0;
  let exercised = 0;
  for (const entry of corpus.cases) {
    // Empty source text is already a Host INVALID_CONTEXT refusal, not a
    // legitimate language projection.
    if (typeof entry.text !== 'string' || !entry.text.trim() || entry.text.length > 1000) continue;
    // Each corpus case owns its real taught vocabulary snapshot.
    const world = buildControlWorld(catalog, { lexicon: entry.lexicon ?? [] });
    const input = { text: entry.text, scope: 'text' };
    const reading = interpretControl(entry.text, { catalog, world });
    assert.equal(reading.outcome, entry.outcome, 'NLCL golden reading: ' + entry.text);
    const intent = toCommandIntent(input, { catalog, world });
    assert.equal(intent.schema, 'vivim.command-intent/0.1', entry.text);
    assert.equal(intent.provenance.authority, 'none', entry.text);
    assert.notEqual(intent.refusal?.code, 'NATIVE_INTENT_INVALID', 'No native divergence: ' + entry.text);
    const expected = entry.outcome === 'incomplete' ? 'clarification_required' :
      entry.outcome === 'empty' ? 'refused' : entry.outcome;
    assert.equal(intent.outcome, expected, 'intent outcome: ' + entry.text);
    if (entry.outcome === 'candidate') {
      assert.equal(intent.actionId, entry.actionId, 'candidate action: ' + entry.text);
      assert.deepEqual(intent.args, entry.args, 'candidate args: ' + entry.text);
      const action = catalog.actions.find(a => a.id === entry.actionId);
      assert.equal(intent.risk, action.risk, 'catalog risk: ' + entry.text);
      assert.equal(intent.readiness, action.readiness, 'catalog readiness: ' + entry.text);
      assert.equal(intent.owner, action.owner, 'catalog owner: ' + entry.text);
    }
    if (entry.outcome === 'incomplete' && entry.actionId) {
      assert.equal(intent.alternatives[0]?.actionId, entry.actionId, 'incomplete target: ' + entry.text);
    }
    const native = runNativeProductPureSync('command-intent-projection', {
      schema: 'vivim.command-intent-projection-input/1',
      input: { text: entry.text, scope: 'text', audience: 'owner' },
      catalogVersion: catalog.version, worldRevision: world.v,
      catalogActions: catalog.actions, reading, baselineOutcome: reading.outcome,
      personalProvenance: null
    });
    if (hasBinary()) assert.ok(native, 'staged binary must implement native command intent: ' + entry.text);
    if (native) {
      assert.equal(native.authority, 'none', entry.text);
      assert.equal(native.executionAuthorized, false, entry.text);
      assert.equal(native.effectPerformed, false, entry.text);
      assert.deepEqual(native.intent, JSON.parse(JSON.stringify(intent)), 'native wire parity: ' + entry.text);
      compared++;
    }
    exercised++;
  }
  assert.ok(exercised >= 30, 'real NLCL golden corpus coverage unexpectedly reduced');
  if (!compared) t.diagnostic('No native binary: authoritative Host corpus outcomes exercised; Rust parity unrun.');
  else assert.equal(compared, exercised, 'every real case must have native parity');
});

test('AI proposal is inert and cannot contradict real owner text', () => {
  const sourceCase = corpus.cases.find(c => c.text === 'Set my theme to dusk');
  const compoundCase = corpus.cases.find(c => c.text === 'set theme to ember and stop all traffic');
  assert.ok(sourceCase?.actionId && sourceCase.args && compoundCase, 'real corpus cases required');
  const world = buildControlWorld(catalog);
  const context = { catalog, world };
  const fromOwner = { text: sourceCase.text, scope: 'text' };
  const accepted = validateAiCommandCandidate({
    ...fromOwner, candidate: { actionId: sourceCase.actionId, args: sourceCase.args }
  }, context);
  assert.equal(accepted.outcome, 'candidate');
  assert.equal(accepted.actionId, sourceCase.actionId);
  assert.deepEqual(accepted.args, sourceCase.args);
  assert.equal(accepted.provenance.method, 'bounded-ai-proposal');
  assert.equal(accepted.provenance.authority, 'none');

  const alternative = catalog.actions.find(a => a.id === sourceCase.actionId)
    .args.preset.values.find(value => value !== sourceCase.args.preset);
  assert.ok(alternative, 'current catalog must contain another actual preset');
  const conflict = validateAiCommandCandidate({
    ...fromOwner, candidate: { actionId: sourceCase.actionId,
      args: { ...sourceCase.args, preset: alternative } }
  }, context);
  assert.equal(conflict.outcome, 'refused');
  assert.equal(conflict.refusal.code, 'CONFLICTING_ARGUMENTS');

  const compound = validateAiCommandCandidate({
    text: compoundCase.text, scope: 'text',
    candidate: { actionId: sourceCase.actionId, args: sourceCase.args }
  }, context);
  assert.equal(compound.outcome, 'refused');
  assert.equal(compound.refusal.code, 'UNSAFE_OR_UNRESOLVED_TEXT');
  assert.equal(compound.provenance.authority, 'none');
});

test('native projection rejects stale and contradictory real Host snapshots', t => {
  if (!hasBinary()) {
    t.diagnostic('Rust binary not staged: native rejection checks unrun.');
    return;
  }
  const sourceCase = corpus.cases.find(c => c.text === 'Set my theme to dusk');
  assert.ok(sourceCase);
  const world = buildControlWorld(catalog);
  const reading = interpretControl(sourceCase.text, { catalog, world });
  const request = {
    schema: 'vivim.command-intent-projection-input/1',
    input: { text: sourceCase.text, scope: 'text', audience: 'owner' },
    catalogVersion: catalog.version, worldRevision: world.v,
    catalogActions: catalog.actions, reading, baselineOutcome: reading.outcome,
    personalProvenance: null
  };
  const refuse = (data, code) => {
    const result = runNativeProductPureSync('command-intent-projection', data);
    assert.ok(result, 'Staged binary must respond to rejected source metadata');
    assert.equal(result.outcome, 'projected');
    assert.equal(result.intent.outcome, 'refused');
    assert.equal(result.intent.refusal.code, code);
    assert.equal(result.intent.provenance.authority, 'none');
    assert.equal(result.executionAuthorized, false);
    assert.equal(result.effectPerformed, false);
  };
  refuse({ ...request, input: { ...request.input, worldRevision: world.v + 1 } },
    'INVALID_CONTEXT');
  refuse({ ...request, baselineOutcome: 'refused' }, 'INVALID_READING');
  refuse({ ...request, reading: { ...reading, input: 'different owner text' } },
    'INVALID_READING');
  refuse({ ...request, reading: { ...reading,
    feedback: { ...reading.feedback, worldV: world.v + 1 } } }, 'INVALID_READING');
  refuse({ ...request, reading: { ...reading,
    feedback: { ...reading.feedback, confidence: 'certain' } } }, 'INVALID_READING');
  refuse({ ...request, catalogActions: catalog.actions.map(action =>
    action.id === sourceCase.actionId ? { ...action, readiness: 'unknown' } : action) },
    'INVALID_CONTEXT');
  refuse({ ...request, reading: { ...reading,
    candidate: { ...reading.candidate, actionId: 'unknown.catalog.action' } } },
    'UNKNOWN_ACTION');
});
