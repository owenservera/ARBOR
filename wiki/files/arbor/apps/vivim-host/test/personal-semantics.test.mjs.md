# File: apps/vivim-host/test/personal-semantics.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/personal-semantics.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4524 B |
| Lines | 67 |
| Hash | bbf522024e31 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| catalog | const | 5 | no | const catalog = { version: 6, actions: [ |
| base | const | 10 | no | const base = { outcome: &#39;interpretation_required&#39;, feedback: { status: &#39;unknown&#39; } }; |
| rule | function | 11 | no | const rule = (extra = {}) =&gt; ({ schema: PERSONAL_RULE_SCHEMA, id: &#39;rule:quick-check&#39;, revision: 1, phrase: &#39;quick check&#39;, actionId: &#39;vivim.status.show&#39;, args: {}, scope: {}, state: &#39;accepted&#39;, source… |
| resolve | function | 14 | no | const resolve = (extra = {}) =&gt; resolvePersonalSemantics({ text: &#39;quick check&#39;, baseline: base, catalog, rules: [rule()], scope: {}, ...extra }); |
| scoped | const | 36 | no | const scoped = rule({id:&#39;rule:workspace&#39;,scope:{workspaceId:&#39;project-a&#39;},actionId:&#39;ui.theme.set_preset&#39;,args:{preset:&#39;dusk&#39;}}); |
| other | const | 42 | no | const other = rule({id:&#39;rule:theme&#39;, actionId:&#39;ui.theme.set_preset&#39;, args:{preset:&#39;dusk&#39;}}); |
| getter | const | 58 | no | const getter = Object.defineProperty({...rule()},&#39;phrase&#39;,{get(){ throw new Error(&#39;must not run&#39;); }}); |
| phone | const | 64 | no | const phone = rule({scope:{surface:&#39;mobile&#39;}}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control/personal-semantics.mjs | import | 3 | [apps/vivim-host/control/personal-semantics.mjs](../control/personal-semantics.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { PERSONAL_RULE_SCHEMA, resolvePersonalSemantics, validatePersonalRule } from '../control/personal-semantics.mjs';

const catalog = { version: 6, actions: [
  { id: 'vivim.status.show', language: { verbs: ['status'] }, args: {} },
  { id: 'ui.theme.set_preset', language: { verbs: ['theme'] }, args: { preset: { type: 'enum', values: ['dusk', 'dawn'] } } },
  { id: 'control.lexicon.teach', args: { word: { type: 'string', min: 2, max: 40 } } },
] };
const base = { outcome: 'interpretation_required', feedback: { status: 'unknown' } };
const rule = (extra = {}) => ({ schema: PERSONAL_RULE_SCHEMA, id: 'rule:quick-check',
  revision: 1, phrase: 'quick check', actionId: 'vivim.status.show', args: {},
  scope: {}, state: 'accepted', source: 'explicit-owner', catalogVersion: 6, ...extra });
const resolve = (extra = {}) => resolvePersonalSemantics({ text: 'quick check', baseline: base,
  catalog, rules: [rule()], scope: {}, ...extra });

test('explicitly accepted exact phrase produces only an inert, typed candidate', () => {
  assert.deepEqual(resolve().candidate, { actionId: 'vivim.status.show', args: {} });
  assert.equal(resolve().executionAuthorized, false);
  assert.equal(resolve().provenance.ruleRevision, 1);
  assert.equal(resolve({text:' QUICK   CHECK '}).outcome, 'candidate');
  assert.equal(resolve({text:'quick check and then disable network'}).outcome, 'no_match');
});
test('existing parser always wins: refusal, clarification, incomplete, candidate', () => {
  for (const outcome of ['refused', 'clarification_required', 'incomplete', 'candidate', 'empty']) {
    assert.deepEqual(resolve({baseline:{outcome}}).outcome, 'no_match');
  }
});
test('only accepted explicit-owner rules activate, never observed or proposed', () => {
  for (const state of ['observed', 'proposed', 'suspended', 'revoked']) {
    assert.equal(resolve({rules:[rule({state})]}).outcome, 'no_match');
  }
  assert.equal(validatePersonalRule(rule({source:'ai-inferred'}), catalog).ok, false);
});
test('more specific scope wins; no unknown-context match', () => {
  const scoped = rule({id:'rule:workspace',scope:{workspaceId:'project-a'},actionId:'ui.theme.set_preset',args:{preset:'dusk'}});
  assert.equal(resolve({rules:[rule(),scoped],scope:{workspaceId:'project-a'}}).candidate.actionId,'ui.theme.set_preset');
  assert.equal(resolve({rules:[rule(),scoped],scope:{workspaceId:'project-b'}}).candidate.actionId,'vivim.status.show');
  assert.equal(resolve({rules:[scoped]}).outcome,'no_match');
});
test('equally specific conflicting rules clarify rather than choose arbitrarily', () => {
  const other = rule({id:'rule:theme', actionId:'ui.theme.set_preset', args:{preset:'dusk'}});
  assert.equal(resolve({rules:[rule(),other]}).outcome, 'clarification_required');
  assert.deepEqual(resolve({rules:[other,rule()]}).ruleIds, ['rule:quick-check','rule:theme']);
});
test('same meaning can have multiple evidence rules without ambiguity', () => {
  assert.equal(resolve({rules:[rule(),rule({id:'rule:other',revision:2})]}).outcome,'candidate');
});
test('catalog revision changes fail closed; bad rule arguments fail closed', () => {
  assert.equal(resolve({rules:[rule({catalogVersion:5})]}).reason,'STALE_CATALOG_RULE');
  assert.equal(resolve({rules:[rule({args:{preset:'dawn'}})]}).outcome,'refused');
  assert.equal(resolve({rules:[rule({id:'rule:quick-check'}),rule({id:'rule:quick-check'})]}).outcome,'refused');
});
test('rule cannot target a control action without language metadata', () => {
  assert.equal(validatePersonalRule(rule({actionId:'control.lexicon.teach',args:{word:'z'}}), catalog).ok,false);
});
test('data-only boundaries reject getters, privilege fields and inherited objects', () => {
  const getter = Object.defineProperty({...rule()},'phrase',{get(){ throw new Error('must not run'); }});
  assert.equal(validatePersonalRule(getter,catalog).ok,false);
  assert.equal(validatePersonalRule(rule({ grant:true }),catalog).ok,false);
  assert.equal(validatePersonalRule(rule({args:Object.create({preset:'dusk'})}),catalog).ok,false);
});
test('surface-scoped rule cannot silently change cross-device interpretation', () => {
  const phone = rule({scope:{surface:'mobile'}});
  assert.equal(resolve({rules:[phone],scope:{surface:'desktop'}}).outcome,'no_match');
  assert.equal(resolve({rules:[phone],scope:{surface:'mobile'}}).outcome,'candidate');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
