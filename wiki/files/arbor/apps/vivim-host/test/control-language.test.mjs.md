# File: apps/vivim-host/test/control-language.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-language.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6463 B |
| Lines | 121 |
| Hash | fb1d0f77103b |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| catalog | const | 10 | no | const catalog = loadControlCatalog(); |
| corpus | const | 11 | no | const corpus = JSON.parse(readFileSync(new URL(&#39;../control/corpus.v1.json&#39;, import.meta.url), &#39;utf8&#39;)); |
| VENDOR_TOOL | const | 13 | no | const VENDOR_TOOL = new URL(&#39;../../../tools/control/vendor-nlcl.mjs&#39;, import.meta.url); |
| VENDOR_PRESENT | const | 14 | no | const VENDOR_PRESENT = existsSync(VENDOR_TOOL); |
| tool | const | 19 | no | const tool = fileURLToPath(VENDOR_TOOL); |
| out | const | 20 | no | const out = execFileSync(process.execPath, [tool, &#39;--check&#39;], { encoding: &#39;utf8&#39;, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;ignore&#39;] }); |
| world | const | 26 | no | const world = buildControlWorld(catalog, { lexicon: c.lexicon ?? [] }); |
| r | const | 27 | no | const r = interpretControl(c.text, { catalog, world }); |
| world | const | 36 | no | const world = buildControlWorld(catalog); |
| r | const | 43 | no | const r = interpretControl(&#39;!set theme to ember&#39;, { catalog, world: buildControlWorld(catalog) }); |
| world | const | 49 | no | const world = buildControlWorld(catalog); |
| sentence | const | 55 | no | const sentence = &#39;edit wiki section main/about saying Voice notes are now our active priority&#39;; |
| meaning | const | 56 | no | const meaning = interpretControl(sentence, { catalog, world: buildControlWorld(catalog) }); |
| world | const | 64 | no | const world = buildControlWorld(catalog); |
| spoken | const | 65 | no | const spoken = catalog.actions.filter(a =&gt; a.language).map(a =&gt; a.id).sort(); |
| world | const | 72 | no | const world=buildControlWorld(catalog); |
| grantId | const | 73 | no | const grantId=&#39;a&#39;.repeat(32); |
| revoke | const | 74 | no | const revoke=interpretControl(&#39;revoke phone grant &#39;+grantId,{catalog,world}); |
| approve | const | 78 | no | const approve=interpretControl(&#39;approve phone grant &#39;+grantId+ &#39; scopes relay:read, relay:write&#39;,{catalog,world}); |
| world | const | 87 | no | const world=buildControlWorld(catalog); |
| grantId | const | 88 | no | const grantId=&#39;a&#39;.repeat(32); |
| answer | const | 95 | no | const answer=interpretControl(value,{catalog,world}); |
| world | const | 105 | no | const world = buildControlWorld(catalog); |
| examples | const | 106 | no | const examples = [ |
| result | const | 113 | no | const result = interpretControl(input, { catalog, world }); |
| missing | const | 119 | no | const missing = interpretControl(&#39;edit wiki section main/about Updated from VIVIM&#39;, { catalog, world }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:child_process | import | 4 | external |
| node:url | import | 5 | external |
| ../../mobile-relay/control-language.mjs | import | 6 | [apps/mobile-relay/control-language.mjs](../../mobile-relay/control-language.mjs.md) |
| ../../mobile-relay/nlcl/index.mjs | import | 7 | [apps/mobile-relay/nlcl/index.mjs](../../mobile-relay/nlcl/index.mjs.md) |
| ../control/intent-planner.mjs | import | 8 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildControlWorld, interpretControl } from '../../mobile-relay/control-language.mjs';
import { interpret } from '../../mobile-relay/nlcl/index.mjs';
import { loadControlCatalog } from '../control/intent-planner.mjs';

const catalog = loadControlCatalog();
const corpus = JSON.parse(readFileSync(new URL('../control/corpus.v1.json', import.meta.url), 'utf8'));

const VENDOR_TOOL = new URL('../../../tools/control/vendor-nlcl.mjs', import.meta.url);
const VENDOR_PRESENT = existsSync(VENDOR_TOOL);

test('vendored Omega NCLL bytes match their pinned provenance', {
  skip: VENDOR_PRESENT ? false : `orphaned test: ${'tools/control/vendor-nlcl.mjs'} is absent from this checkout`,
}, () => {
  const tool = fileURLToPath(VENDOR_TOOL);
  const out = execFileSync(process.execPath, [tool, '--check'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  assert.match(out, /vendored NCLL ok: 11 files/);
});

for (const c of corpus.cases) {
  test(`corpus: ${JSON.stringify(c.text)} → ${c.outcome} (${c.note})`, () => {
    const world = buildControlWorld(catalog, { lexicon: c.lexicon ?? [] });
    const r = interpretControl(c.text, { catalog, world });
    assert.equal(r.outcome, c.outcome);
    if (c.actionId) assert.equal(r.candidate?.actionId, c.actionId);
    if (c.args) assert.deepEqual(r.candidate.args, c.args);
    if (c.outcome !== 'candidate') assert.ok(!(r.outcome === 'candidate'));
  });
}

test('determinism (N1): same text and world give byte-identical interpretation', () => {
  const world = buildControlWorld(catalog);
  for (const c of corpus.cases) {
    assert.equal(JSON.stringify(interpretControl(c.text, { catalog, world })), JSON.stringify(interpretControl(c.text, { catalog, world })));
  }
});

test('force modifier is reported as ignored, never as authority', () => {
  const r = interpretControl('!set theme to ember', { catalog, world: buildControlWorld(catalog) });
  assert.deepEqual(r.ignoredModifiers, ['!']);
  assert.equal(Object.hasOwn(r, 'authorized'), false);
});

test('raw NCLL "ok" with an unresolved slot never becomes a candidate (AION E3)', () => {
  const world = buildControlWorld(catalog);
  assert.equal(interpret('change my theme to purple', world).status, 'ok');
  assert.equal(interpretControl('change my theme to purple', { catalog, world }).outcome, 'incomplete');
});

test('Wiki free-text interpretation retains exact owner wording through NLCL modifiers', () => {
  const sentence = 'edit wiki section main/about saying Voice notes are now our active priority';
  const meaning = interpretControl(sentence, { catalog, world: buildControlWorld(catalog) });
  assert.equal(meaning.outcome, 'candidate');
  assert.deepEqual(meaning.candidate, { actionId: 'wiki.section.edit',
    args: { target: 'main/about', content: 'Voice notes are now our active priority' } });
  assert.equal(Object.hasOwn(meaning, 'executionPerformed'), false);
});

test('world is derived from the catalog only: every spoken action is routable, nothing else', () => {
  const world = buildControlWorld(catalog);
  const spoken = catalog.actions.filter(a => a.language).map(a => a.id).sort();
  assert.deepEqual(world.ops.map(o => o.op).sort(), spoken);
  assert.deepEqual(world.frames.map(f => f.op).sort(), spoken);
  assert.ok(!world.ops.some(o => o.op.startsWith('message.')));
});

test('exact paired-device text resolves to typed R2 grant actions without granting authority',()=>{
  const world=buildControlWorld(catalog);
  const grantId='a'.repeat(32);
  const revoke=interpretControl('revoke phone grant '+grantId,{catalog,world});
  assert.equal(revoke.outcome,'candidate');
  assert.deepEqual(revoke.candidate,{actionId:'devices.revoke',
    args:{grant_id:grantId}});
  const approve=interpretControl('approve phone grant '+grantId+
    ' scopes relay:read, relay:write',{catalog,world});
  assert.equal(approve.outcome,'candidate');
```

_First 80 of 122 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
