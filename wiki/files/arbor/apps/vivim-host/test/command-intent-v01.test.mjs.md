# File: apps/vivim-host/test/command-intent-v01.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/command-intent-v01.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10530 B |
| Lines | 233 |
| Hash | 98b7a6ec95b1 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| planner | const | 8 | no | const planner = createControlPlanner(); |
| catalog | const | 9 | no | const catalog = planner.catalog; |
| world | const | 10 | no | const world = buildControlWorld(catalog); |
| run | function | 11 | no | const run = (text, source = &#39;text&#39;) =&gt; planner.interpretCommand(text, { source }); |
| a | const | 14 | no | const a = run(&#39;Set my theme to dusk&#39;); |
| b | const | 15 | no | const b = run(&#39;Set my theme to dusk&#39;); |
| desktop | const | 33 | no | const desktop = run(&#39;Set my theme to dusk&#39;, &#39;desktop&#39;); |
| mobile | const | 34 | no | const mobile = run(&#39;Set my theme to dusk&#39;, &#39;mobile&#39;); |
| incomplete | const | 51 | no | const incomplete = run(&#39;change my theme to purple&#39;); |
| ambiguous | const | 54 | no | const ambiguous = run(&#39;Stop all traffic&#39;); |
| negated | const | 60 | no | const negated = [ |
| old | const | 78 | no | const old = planner.planText(text); |
| typed | const | 79 | no | const typed = run(text); |
| r | const | 89 | no | const r = run(&#39;Never mention my former employer&#39;); |
| suffixes | const | 94 | no | const suffixes = [ |
| presets | const | 113 | no | const presets = [&#39;lab&#39;, &#39;tide&#39;, &#39;dusk&#39;, &#39;ember&#39;, &#39;grove&#39;, &#39;ink&#39;, &#39;dawn&#39;]; |
| text | const | 116 | no | const text = &#39;Set theme to &#39; + preset + suffix; |
| legacy | const | 118 | no | const legacy = planner.planText(text); |
| typed | const | 121 | no | const typed = run(text); |
| text | const | 134 | no | const text = &#39;send this to Peter&#39;; |
| safe | const | 145 | no | const safe = planner.validateCommandCandidate(text, { actionId: &#39;ui.theme.show&#39;, args: {}, rationale: &#39;user asked&#39;, uncertainty: 0.5 }); |
| x | const | 153 | no | const x = planner.validateCommandCandidate(&#39;Show my theme&#39;, { actionId: &#39;ui.theme.set_preset&#39;, args: { preset: &#39;ink&#39; } }); |
| grant | const | 161 | no | const grant = &#39;a&#39;.repeat(32); |
| result | const | 162 | no | const result = run(&#39;revoke phone grant &#39; + grant); |
| lane3Fixtures | const | 168 | no | const lane3Fixtures = JSON.parse(readFileSync( new URL(&#39;./fixtures/command-intent-v01.json&#39;, import.meta.url), &#39;utf8&#39;)); |
| actual | const | 172 | no | const actual = planner.interpretCommand(c.input.text, { source: c.input.scope ?? &#39;text&#39; }); |
| grant | const | 181 | no | const grant = &#39;a&#39;.repeat(32); |
| text | const | 182 | no | const text = &#39;approve phone grant &#39; + grant + &#39; scopes relay:read, relay:write&#39;; |
| parsed | const | 184 | no | const parsed = run(text); |
| negative | const | 199 | no | const negative = &quot;don&#39;t remember my father&#39;s salary&quot;; |
| aliases | variable | 204 | no | let aliases = [{ word: &#39;glow&#39;, actionId: &#39;ui.theme.set_preset&#39; }]; |
| p | const | 205 | no | const p = createControlPlanner({ lexicon: () =&gt; aliases }); |
| before | const | 206 | no | const before = p.world().v; |
| after | const | 208 | no | const after = p.world().v; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../control/intent-planner.mjs | import | 4 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |
| ../control/command-intent.mjs | import | 5 | [apps/vivim-host/control/command-intent.mjs](../control/command-intent.mjs.md) |
| ../../mobile-relay/control-language.mjs | import | 6 | [apps/mobile-relay/control-language.mjs](../../mobile-relay/control-language.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
  assert.equal(planner.interpretCommand('Set my theme to dusk', { source: 'remote-root' }).refusal.code, 'INVALID_SCOPE');
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
```

_First 80 of 234 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
