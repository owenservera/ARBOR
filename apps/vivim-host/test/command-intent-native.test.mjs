// Real Host catalog and committed NLCL golden corpus; no alternate parser or fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildControlWorld, interpretControl } from '../../mobile-relay/control-language.mjs';
import { toCommandIntent, validateAiCommandCandidate } from '../control/command-intent.mjs';
import { resolvePersonalSemantics, PERSONAL_RULE_SCHEMA } from '../control/personal-semantics.mjs';
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
    assert.equal(reading.feedback?.worldV, world.v, 'NLCL world stamp: ' + entry.text);
    assert.ok(typeof reading.feedback?.nlclVersion === 'string' &&
      reading.feedback.nlclVersion.length > 0, 'NLCL compiler provenance: ' + entry.text);
    assert.ok(Number.isFinite(reading.feedback?.confidence) &&
      reading.feedback.confidence >= 0 && reading.feedback.confidence <= 1,
      'bounded NLCL confidence: ' + entry.text);
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
      catalogActions: catalog.actions.map(({id, title, args, risk, owner, readiness, requiredScopes}) =>
        ({id, title, args, risk, owner, readiness,
          ...(requiredScopes !== undefined ? {requiredScopes} : {})})),
      reading, baselineOutcome: reading.outcome,
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

  // Compare the native AI guard's entire inert wire projection, not only
  // its refusal code, against the real recomputed Host decision.
  for (const [ownerText, proposal, incumbent] of [
    [sourceCase.text, {actionId: sourceCase.actionId, args: sourceCase.args}, accepted],
    [sourceCase.text, {actionId: sourceCase.actionId,
      args: {...sourceCase.args, preset: alternative}}, conflict],
    [compoundCase.text, {actionId: sourceCase.actionId, args: sourceCase.args}, compound]
  ]) {
    const reading = toCommandIntent({text: ownerText, scope: 'text'}, context);
    const action = catalog.actions.find(a => a.id === proposal.actionId);
    const native = runNativeProductPureSync('command-ai-guard', {
      schema: 'vivim.command-ai-proposal-guard-input/1',
      input: {text: ownerText, scope: 'text', audience: 'owner',
        catalogRevision: null, worldRevision: null},
      proposal, reading, action, catalogActions: catalog.actions,
      catalogVersion: catalog.version, worldRevision: world.v
    });
    if (hasBinary()) assert.ok(native, 'staged Rust binary must support command-ai-guard');
    if (native) {
      assert.equal(native.executionAuthorized, false);
      assert.equal(native.effectPerformed, false);
      assert.deepEqual(native.intent, JSON.parse(JSON.stringify(incumbent)),
        'native AI guard must equal the complete Host projection');
    }
  }
});


test('all real NLCL cases preserve the native AI guard decision and its provenance', t => {
  const defaultCase = corpus.cases.find(c => c.text === 'Set my theme to dusk');
  assert.ok(defaultCase?.actionId && defaultCase.args);
  let compared = 0;
  let exercised = 0;
  for (const entry of corpus.cases) {
    if (typeof entry.text !== 'string' || !entry.text.trim() || entry.text.length > 1000) continue;
    const world = buildControlWorld(catalog, {lexicon: entry.lexicon ?? []});
    const context = {catalog, world};
    const proposal = entry.outcome === 'candidate'
      ? {actionId: entry.actionId, args: entry.args}
      : {actionId: defaultCase.actionId, args: defaultCase.args};
    const input = {text: entry.text, scope: 'text'};
    const incumbent = validateAiCommandCandidate({...input, candidate: proposal}, context);
    const reading = toCommandIntent(input, context);
    assert.equal(incumbent.schema, 'vivim.command-intent/0.1', entry.text);
    assert.equal(incumbent.provenance.authority, 'none', entry.text);
    assert.notEqual(incumbent.refusal?.code, 'NATIVE_INTENT_INVALID', entry.text);
    const action = catalog.actions.find(a => a.id === proposal.actionId);
    const native = runNativeProductPureSync('command-ai-guard', {
      schema: 'vivim.command-ai-proposal-guard-input/1',
      input: {text: entry.text, scope: 'text', audience: 'owner',
        catalogRevision: null, worldRevision: null},
      proposal, reading, action, catalogActions: catalog.actions,
      catalogVersion: catalog.version, worldRevision: world.v
    });
    if (hasBinary()) assert.ok(native, 'packaged binary must support AI guard: ' + entry.text);
    if (native) {
      assert.equal(native.executionAuthorized, false, entry.text);
      assert.equal(native.effectPerformed, false, entry.text);
      assert.deepEqual(native.intent, JSON.parse(JSON.stringify(incumbent)),
        'native AI guard must equal Host source decision: ' + entry.text);
      compared++;
    }
    exercised++;
  }
  assert.ok(exercised >= 30, 'real NLCL corpus unexpectedly reduced');
  if (compared) assert.equal(compared, exercised);
  else t.diagnostic('No native binary: AI guard corpus exercised on Host; Rust parity unrun.');
});

test('zero-argument native AI proposals accept nullish arguments like Host', () => {
  const entry = corpus.cases.find(c => c.text === 'Undo my theme');
  assert.ok(entry && entry.outcome === 'candidate' && Object.keys(entry.args).length === 0);
  const world = buildControlWorld(catalog);
  const context = {catalog, world};
  const input = {text: entry.text, scope: 'text'};
  const action = catalog.actions.find(a => a.id === entry.actionId);
  const reading = toCommandIntent(input, context);
  for (const proposal of [
    {actionId: entry.actionId},
    {actionId: entry.actionId, args: null},
    {actionId: entry.actionId, args: {}}
  ]) {
    const incumbent = validateAiCommandCandidate({...input, candidate: proposal}, context);
    assert.equal(incumbent.outcome, 'candidate', 'Host accepts zero-arg owner command');
    assert.deepEqual(incumbent.args, {});
    const native = runNativeProductPureSync('command-ai-guard', {
      schema: 'vivim.command-ai-proposal-guard-input/1',
      input: {text: entry.text, scope: 'text', audience: 'owner',
        catalogRevision: null, worldRevision: null},
      proposal, reading, action, catalogActions: catalog.actions,
      catalogVersion: catalog.version, worldRevision: world.v
    });
    if (hasBinary()) assert.ok(native, 'native zero-arg proposal must be available');
    if (native) {
      assert.equal(native.executionAuthorized, false);
      assert.equal(native.effectPerformed, false);
      assert.deepEqual(native.intent, JSON.parse(JSON.stringify(incumbent)));
    }
  }
});


test('accepted, conflicting and invalid existing Host personal meanings preserve native provenance', t => {
  // Reuse the quazzlememo personal-rule contract exercised by the existing
  // personal-semantics-integration test; no second binder or NLCL parser.
  const phrase = 'quazzlememo';
  const rule = (overrides = {}) => ({
    schema: PERSONAL_RULE_SCHEMA, id: 'rule:quazzlememo', revision: 1,
    phrase, actionId: 'ui.theme.set_preset', args: {preset: 'dusk'},
    scope: {}, state: 'accepted', source: 'explicit-owner',
    catalogVersion: catalog.version, ...overrides
  });
  const world = buildControlWorld(catalog);
  const input = {text: phrase, scope: 'text'};
  const baseline = interpretControl(phrase, {catalog, world});
  assert.equal(baseline.outcome, 'interpretation_required');

  let compared = 0;
  for (const [name, rules, expected] of [
    ['accepted', [rule()], 'candidate'],
    ['conflict', [rule(), rule({id: 'rule:other', args: {preset: 'dawn'}})],
      'clarification_required'],
    ['invalid', [rule({args: {preset: 'not-in-catalog'}})], 'refused']
  ]) {
    const resolved = resolvePersonalSemantics({
      text: phrase, baseline, rules, catalog, scope: {surface: 'text'}
    });
    let reading = baseline;
    let personalProvenance = null;
    if (resolved.outcome === 'candidate') {
      reading = {...baseline, outcome: 'candidate', candidate: resolved.candidate};
      personalProvenance = resolved.provenance;
    } else if (resolved.outcome === 'clarification_required') {
      reading = {...baseline, outcome: 'clarification_required',
        question: resolved.reason === 'TEMPLATE_PARAMETER_REQUIRED'
          ? 'Supply one new lowercase Wiki page slug after the learned command name.'
          : 'Conflicting accepted personal meanings. Please specify the action.',
        choices: []};
      personalProvenance = {method: 'personal-rule-conflict', ruleIds: resolved.ruleIds};
    } else if (resolved.outcome === 'refused') {
      reading = {...baseline, outcome: 'refused',
        refusal: {code: resolved.reason, message: 'Personal rule invalid or stale.'}};
      personalProvenance = {method: 'personal-rule-refusal', reason: resolved.reason};
    } else {
      assert.fail('Unexpected real personal-rule resolution outcome for ' + name);
    }
    const incumbent = toCommandIntent(input, {catalog, world, personalRules: rules});
    assert.equal(incumbent.outcome, expected, name);
    assert.equal(incumbent.provenance.authority, 'none', name);
    assert.deepEqual(incumbent.language.personalRule, personalProvenance, name);
    const native = runNativeProductPureSync('command-intent-projection', {
      schema: 'vivim.command-intent-projection-input/1',
      input: {text: phrase, scope: 'text', audience: 'owner'},
      catalogVersion: catalog.version, worldRevision: world.v,
      catalogActions: catalog.actions.map(({id, title, args, risk, owner, readiness, requiredScopes}) =>
        ({id, title, args, risk, owner, readiness,
          ...(requiredScopes !== undefined ? {requiredScopes} : {})})),
      reading, baselineOutcome: baseline.outcome, personalProvenance
    });
    if (hasBinary()) assert.ok(native, 'Native personal intent projection required: ' + name);
    if (native) {
      assert.equal(native.authority, 'none', name);
      assert.equal(native.executionAuthorized, false, name);
      assert.equal(native.effectPerformed, false, name);
      assert.deepEqual(native.intent, JSON.parse(JSON.stringify(incumbent)),
        'Full native personal-rule provenance parity: ' + name);
      compared++;

      // The actual Host-selected provenance is admitted. Forging its
      // selected revision or attaching an approval claim is not.
      const corrupted = name === 'accepted'
        ? {...personalProvenance, ruleRevision: 0}
        : name === 'conflict'
          ? {...personalProvenance, ruleIds: [...personalProvenance.ruleIds].reverse()}
          : {...personalProvenance, authority: 'owner'};
      const malformed = runNativeProductPureSync('command-intent-projection', {
        schema: 'vivim.command-intent-projection-input/1',
        input: {text: phrase, scope: 'text', audience: 'owner'},
        catalogVersion: catalog.version, worldRevision: world.v,
        catalogActions: catalog.actions.map(({id, title, args, risk, owner, readiness, requiredScopes}) =>
          ({id, title, args, risk, owner, readiness,
            ...(requiredScopes !== undefined ? {requiredScopes} : {})})),
        reading, baselineOutcome: baseline.outcome, personalProvenance: corrupted
      });
      assert.ok(malformed, 'native malformed personal provenance response');
      assert.equal(malformed.intent.outcome, 'refused', name);
      assert.equal(malformed.intent.refusal.code, 'INVALID_READING', name);
      assert.equal(malformed.executionAuthorized, false);
      assert.equal(malformed.effectPerformed, false);
    }
  }
  if (!compared) t.diagnostic('Personal Host cases exercised; native parity unrun without binary.');
  else assert.equal(compared, 3, 'all three personal-rule paths must match native');
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
    catalogActions: catalog.actions.map(({id, title, args, risk, owner, readiness, requiredScopes}) =>
      ({id, title, args, risk, owner, readiness,
        ...(requiredScopes !== undefined ? {requiredScopes} : {})})),
    reading, baselineOutcome: reading.outcome,
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
  refuse({ ...request, reading: { ...reading, feedback: undefined } }, 'INVALID_READING');
  refuse({ ...request, reading: { ...reading,
    feedback: { ...reading.feedback, worldV: null } } }, 'INVALID_READING');
  refuse({ ...request, reading: { ...reading,
    feedback: { ...reading.feedback, nlclVersion: '' } } }, 'INVALID_READING');
  refuse({ ...request, catalogActions: catalog.actions.map(action =>
    action.id === sourceCase.actionId ? { ...action, readiness: 'unknown' } : action) },
    'INVALID_CONTEXT');
  refuse({ ...request, reading: { ...reading,
    candidate: { ...reading.candidate, actionId: 'unknown.catalog.action' } } },
    'UNKNOWN_ACTION');
  refuse({ ...request, reading: { ...reading,
    refusal: {code: 'NEGATED_ACTION', message: 'A negative command.'} } },
    'INVALID_READING');
  refuse({ ...request, baselineOutcome: 'refused',
    reading: { ...reading, outcome: 'refused', refusal: undefined } },
    'INVALID_READING');
});


test('native AI guard refuses forged Host projections and malformed catalog metadata', t => {
  if (!hasBinary()) {
    t.diagnostic('Rust binary not packaged: direct source-binding rejection checks unrun.');
    return;
  }
  const owner = corpus.cases.find(c => c.text === 'Set my theme to dusk');
  assert.ok(owner?.actionId && owner.args);
  const world = buildControlWorld(catalog);
  const input = {text: owner.text, scope: 'text'};
  const reading = toCommandIntent(input, {catalog, world});
  const action = catalog.actions.find(a => a.id === owner.actionId);
  const proposal = {actionId: owner.actionId, args: owner.args};
  const original = {
    schema: 'vivim.command-ai-proposal-guard-input/1',
    input: {text: owner.text, scope: 'text', audience: 'owner',
      catalogRevision: null, worldRevision: null},
    reading, action, proposal, catalogActions: catalog.actions,
    catalogVersion: catalog.version,
    worldRevision: world.v
  };
  const bad = (change, expected) => {
    const result = runNativeProductPureSync('command-ai-guard',
      {...original, ...change});
    assert.ok(result, 'packaged native guard must answer invalid source metadata');
    assert.equal(result.outcome, 'projected');
    assert.equal(result.intent.outcome, 'refused');
    assert.equal(result.intent.refusal.code, expected);
    assert.equal(result.authority, 'none');
    assert.equal(result.executionAuthorized, false);
    assert.equal(result.effectPerformed, false);
  };
  bad({reading: {...reading, provenance: {...reading.provenance,
    worldRevision: world.v + 1}}}, 'UNSAFE_OR_UNRESOLVED_TEXT');
  bad({reading: {...reading, provenance: {...reading.provenance,
    catalogRevision: catalog.version - 1}}}, 'UNSAFE_OR_UNRESOLVED_TEXT');
  bad({reading: {...reading, provenance: {...reading.provenance,
    authority: 'owner'}}}, 'UNSAFE_OR_UNRESOLVED_TEXT');
  bad({reading: {...reading, executionAuthorized: true}},
    'UNSAFE_OR_UNRESOLVED_TEXT');
  bad({action: {...action, risk: 'R9'}}, 'AI_ACTION_NOT_ALLOWED');
  bad({action: {...action, readiness: 'already_applied'}}, 'AI_ACTION_NOT_ALLOWED');
  bad({catalogActions: catalog.actions.map(a => a.id === owner.actionId
    ? {...a, risk: 'R3'} : a)}, 'AI_ACTION_NOT_ALLOWED');
  bad({catalogActions: [...catalog.actions, action]}, 'AI_ACTION_NOT_ALLOWED');
  bad({input: {...original.input, worldRevision: world.v + 1}},
    'UNSAFE_OR_UNRESOLVED_TEXT');
  bad({reading: {...reading, language: {...reading.language,
    feedback: {...reading.language.feedback, worldV: world.v + 1}}}},
    'UNSAFE_OR_UNRESOLVED_TEXT');
  bad({reading: {...reading, risk: 'R0'}}, 'UNSAFE_OR_UNRESOLVED_TEXT');
});
