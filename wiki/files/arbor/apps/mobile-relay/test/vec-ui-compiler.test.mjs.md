# File: apps/mobile-relay/test/vec-ui-compiler.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/vec-ui-compiler.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6245 B |
| Lines | 98 |
| Hash | eff90ad9d307 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| compiler | function | 8 | no | const compiler = () =&gt; createVecCompiler({ adapters: { ui: compileVecUiRequest } }); |
| run | const | 9 | no | const run = (text, surface = createSurface()) =&gt; compiler().compile({ domain: &#39;ui&#39;, text, context: { surface } }); |
| candidate | function | 10 | no | const candidate = (text, surface) =&gt; { |
| result | const | 11 | no | const result = run(text, surface); |
| edited | function | 21 | no | const edited = (surface, text) =&gt; candidate(text, surface).preview.surface; |
| c | const | 24 | no | const c = compiler(); |
| result | const | 26 | no | const result = c.compile({ domain, text: &#39;known&#39;, context: {} }); |
| s | const | 36 | no | const s = createSurface(); |
| a | const | 37 | no | const a = candidate(&#39;Add a card called Research&#39;, s); |
| b | const | 38 | no | const b = candidate(&#39;Add a card called Research&#39;, s); |
| original | const | 46 | no | const original = createSurface(); |
| withCard | const | 47 | no | const withCard = edited(original, &#39;Add a card called Research&#39;); |
| withSecond | const | 49 | no | const withSecond = edited(withCard, &#39;Add a card named Today&#39;); |
| s | variable | 55 | no | let s = edited(createSurface(), &#39;Add a card called Research&#39;); |
| valid | const | 72 | no | const valid = candidate(&#39;Add a card called Research&#39;); |
| stale | const | 73 | no | const stale = { ...valid.proposal, baseRevision: 5 }; |
| s | const | 78 | no | const s = createSurface(); |
| malicious | const | 84 | no | const malicious = createVecCompiler({ adapters: { wiki: () =&gt; ({ outcome: &#39;candidate&#39;, authorization: &#39;yes&#39;, persisted: true, executed: true, code: &#39;DEMO&#39; }) } }); |
| out | const | 87 | no | const out = malicious.compile({ domain: &#39;wiki&#39;, text: &#39;show wiki&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../vec/compiler.mjs | import | 3 | [apps/mobile-relay/vec/compiler.mjs](../vec/compiler.mjs.md) |
| ../vec/ui-adapter.mjs | import | 4 | [apps/mobile-relay/vec/ui-adapter.mjs](../vec/ui-adapter.mjs.md) |
| ../generative-ui/catalog.mjs | import | 5 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/compiler.mjs | import | 6 | [apps/mobile-relay/generative-ui/compiler.mjs](../generative-ui/compiler.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createVecCompiler, VEC_COMPILE_SCHEMA } from '../vec/compiler.mjs';
import { compileVecUiRequest } from '../vec/ui-adapter.mjs';
import { createSurface } from '../generative-ui/catalog.mjs';
import { compileUiProposal } from '../generative-ui/compiler.mjs';

const compiler = () => createVecCompiler({ adapters: { ui: compileVecUiRequest } });
const run = (text, surface = createSurface()) => compiler().compile({ domain: 'ui', text, context: { surface } });
const candidate = (text, surface) => {
  const result = run(text, surface);
  assert.equal(result.outcome, 'candidate', JSON.stringify(result));
  assert.equal(result.schema, VEC_COMPILE_SCHEMA);
  assert.equal(result.authorization, 'none');
  assert.equal(result.executed, false);
  assert.equal(result.persisted, false);
  assert.equal(result.preview.persisted, false);
  assert.equal(result.preview.authorization, 'required');
  return result;
};
const edited = (surface, text) => candidate(text, surface).preview.surface;

test('one VEC compiler separates Wiki, command and UI; unported owners are not executed', () => {
  const c = compiler();
  for (const domain of ['wiki', 'command']) {
    const result = c.compile({ domain, text: 'known', context: {} });
    assert.equal(result.outcome, 'unsupported');
    assert.equal(result.code, 'LEGACY_OWNER_NOT_MIGRATED');
    assert.equal(result.executed, false);
  }
  assert.equal(c.compile({ domain: 'unknown', text: 'known' }).code, 'UNKNOWN_DOMAIN');
  assert.equal(createVecCompiler().compile({ domain: 'ui', text: 'Edit UI' }).legacyOwner, 'vivim.ui-proposal/1');
  assert.equal(c.compile({ domain: 'ui', text: '', context: { surface: createSurface() } }).outcome, 'refused');
});
test('deterministic create-card, heading and plain-text preview without model or Host', () => {
  const s = createSurface();
  const a = candidate('Add a card called Research', s);
  const b = candidate('Add a card called Research', s);
  assert.deepEqual(a.proposal, b.proposal);
  assert.equal(a.preview.previewDigest, b.preview.previewDigest);
  assert.equal(a.preview.surface.tree.children[0].props.title, 'Research');
  assert.equal(candidate('Add a heading saying My work', s).preview.surface.tree.children[0].props.variant, 'heading');
  assert.equal(candidate('Create text named Notes', s).preview.surface.tree.children[0].props.value, 'Notes');
});
test('existing surface supports typed rename/remove/move with exact revision', () => {
  const original = createSurface();
  const withCard = edited(original, 'Add a card called Research');
  assert.equal(edited(withCard, 'Rename card Research to Projects').tree.children[0].props.title, 'Projects');
  const withSecond = edited(withCard, 'Add a card named Today');
  assert.equal(edited(withSecond, 'Move card Today to the top').tree.children[0].props.title, 'Today');
  assert.equal(edited(withSecond, 'Remove card Research').tree.children.length, 1);
  assert.equal(original.tree.children.length, 0, 'pure compiler never mutates source');
});
test('ambiguous names and unknown UI target request clarification rather than guessing', () => {
  let s = edited(createSurface(), 'Add a card called Research');
  s = edited(s, 'Add a card called Research');
  assert.equal(run('Rename card Research to Projects', s).code, 'UI_TARGET_AMBIGUOUS');
  assert.equal(run('Remove card Missing', s).code, 'UI_TARGET_NOT_FOUND');
});
test('complex/not-yet-supported UI grammar returns model-eligible unsupported, no implicit effects', () => {
  assert.equal(run('Create my complete workspace').outcome, 'unsupported');
  assert.equal(run('Add a card called Research and then delete my files').outcome, 'unsupported');
  assert.equal(run('Add a card called Research and also remove Today').outcome, 'unsupported');
  assert.equal(run('Add a card called Research; delete notes').outcome, 'unsupported');
  assert.equal(run('Every morning move my cards').outcome, 'unsupported');
  assert.equal(run('List my provider chats').outcome, 'unsupported');
});
test('unsafe proposal payloads and extra fields are rejected by canonical compiler', () => {
  assert.equal(run('Add a card called <script>alert(1)</script>').outcome, 'refused');
  assert.equal(run('Add a card called https://evil.invalid').outcome, 'refused');
  assert.equal(run('Add a heading called ' + 'x'.repeat(90)).outcome, 'refused');
  const valid = candidate('Add a card called Research');
  const stale = { ...valid.proposal, baseRevision: 5 };
  assert.throws(() => compileUiProposal({ proposal: stale, surface: createSurface() }), /UI_REJECTED/);
  assert.throws(() => compileUiProposal({ proposal: { ...valid.proposal, code: 'do bad' }, surface: createSurface() }), /UI_REJECTED/);
});
test('screen-invisible PC-private branches cannot be selected', () => {
  const s = createSurface();
  s.tree.children.push({ id: 'private', type: 'card', props: { title: 'Private' }, visibility: 'pc-private', children: [] });
  assert.equal(run('Remove card Private', s).outcome, 'clarification_required');
```

_First 80 of 99 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
