# File: hq/test/vlang-compiled-context.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/vlang-compiled-context.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5000 B |
| Lines | 89 |
| Hash | c135c190a91d |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sourceRoot | function | 13 | no | const sourceRoot = relative =&gt; realpathSync(fileURLToPath(new URL(relative, import.meta.url))); |
| root | const | 18 | no | const root = mkdtempSync(join(tmpdir(), &#39;arbor-vlang-context-&#39;)); |
| projects | const | 19 | no | const projects = [ |
| hq | const | 25 | no | const hq = createDevIntelligence({ mode: &#39;diagnostic&#39;, dataDir: root, approvedRoots: projects.map(([, path]) =&gt; path), }); |
| plan | const | 31 | no | const plan = createControlPlanner().planText( &#39;edit wiki section main/about saying Updated from VIVIM&#39;, { source: &#39;desktop&#39; }); |
| command | const | 35 | no | const command = plan.language.vec; |
| build | const | 42 | no | const build = resolveBuildRequest({ request: &#39;Add a card called Research&#39;, surface: createSurface() }); |
| linkedContext | function | 50 | no | const linkedContext = (candidate, project, path, semanticId, kind) =&gt; { |
| bundle | const | 51 | no | const bundle = hq.context({ task: &#39;Trace how this compiled candidate is handled&#39;, project, budgetTokens: 10000, maxFiles: 24, sourceSemanticIds: candidate.sourceSemanticIds, }); |
| observed | const | 58 | no | const observed = bundle.sources.find(source =&gt; source.path === path &amp;&amp; source.semanticReferences?.some(ref =&gt; ref.semanticId === semanticId &amp;&amp; ref.annotationKind === kind)); |
| fake | const | 81 | no | const fake = createVecCompiler({ adapters: { command: () =&gt; ({ outcome: &#39;candidate&#39;, proposal: { schema: &#39;unrelated/1&#39; }, sourceSemanticIds: [&#39;invented.contract@1&#39;], authorization: &#39;full&#39;, executed: … |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ../lib/arbor-service.mjs | import | 7 | [hq/lib/arbor-service.mjs](../lib/arbor-service.mjs.md) |
| ../../apps/vivim-host/control/intent-planner.mjs | import | 8 | [apps/vivim-host/control/intent-planner.mjs](../../apps/vivim-host/control/intent-planner.mjs.md) |
| ../../apps/mobile-relay/build-composer.mjs | import | 9 | [apps/mobile-relay/build-composer.mjs](../../apps/mobile-relay/build-composer.mjs.md) |
| ../../apps/mobile-relay/generative-ui/catalog.mjs | import | 10 | [apps/mobile-relay/generative-ui/catalog.mjs](../../apps/mobile-relay/generative-ui/catalog.mjs.md) |
| ../../apps/mobile-relay/vec/compiler.mjs | import | 11 | [apps/mobile-relay/vec/compiler.mjs](../../apps/mobile-relay/vec/compiler.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDevIntelligence } from '../lib/arbor-service.mjs';
import { createControlPlanner } from '../../apps/vivim-host/control/intent-planner.mjs';
import { resolveBuildRequest } from '../../apps/mobile-relay/build-composer.mjs';
import { createSurface } from '../../apps/mobile-relay/generative-ui/catalog.mjs';
import { createVecCompiler } from '../../apps/mobile-relay/vec/compiler.mjs';

const sourceRoot = relative => realpathSync(fileURLToPath(new URL(relative, import.meta.url)));

test('real VLANG command and Build compiler contracts resolve through authorized HQ context', () => {
  // Index the real production compiler and consumer directories, not copied
  // demo functions or a handcrafted database. Only the index is temporary.
  const root = mkdtempSync(join(tmpdir(), 'arbor-vlang-context-'));
  const projects = [
    ['vlang-command', sourceRoot('../../apps/vivim-host/control/')],
    ['vlang-vec', sourceRoot('../../apps/mobile-relay/vec/')],
    ['vlang-ui-consumer', sourceRoot('../../apps/mobile-relay/generative-ui/')],
  ];
  try {
    const hq = createDevIntelligence({
      mode: 'diagnostic', dataDir: root, approvedRoots: projects.map(([, path]) => path),
    });
    for (const [name, path] of projects) hq.registerSource({ name, path });
    assert.equal(hq.index().errors.length, 0);

    const plan = createControlPlanner().planText(
      'edit wiki section main/about saying Updated from VIVIM', { source: 'desktop' });
    assert.equal(plan.actionId, 'wiki.section.edit');
    assert.equal(plan.outcome, 'approval_required');
    const command = plan.language.vec;
    assert.equal(command.authorization, 'none');
    assert.equal(command.persisted, false);
    assert.deepEqual(command.sourceSemanticIds, [
      'vivim.vec-compile@0.1', 'vivim.command-intent@0.1',
    ]);

    const build = resolveBuildRequest({ request: 'Add a card called Research', surface: createSurface() });
    assert.equal(build.outcome, 'candidate');
    assert.equal(build.authorization, 'none');
    assert.equal(build.persisted, false);
    assert.deepEqual(build.sourceSemanticIds, [
      'vivim.vec-compile@0.1', 'vivim.ui-proposal@1',
    ]);

    const linkedContext = (candidate, project, path, semanticId, kind) => {
      const bundle = hq.context({
        task: 'Trace how this compiled candidate is handled',
        project, budgetTokens: 10000, maxFiles: 24,
        sourceSemanticIds: candidate.sourceSemanticIds,
      });
      assert.deepEqual(bundle.sourceSemanticIds, [...candidate.sourceSemanticIds].sort());
      assert.equal(bundle.authority, 'read_only_projection');
      const observed = bundle.sources.find(source => source.path === path &&
        source.semanticReferences?.some(ref => ref.semanticId === semanticId &&
          ref.annotationKind === kind));
      // If the existing budget/ranking selects the annotated file, it must
      // include the exact annotation and source hash, not a made-up snippet.
      assert.ok(observed, 'Expected real indexed contract in ' + project + '/' + path);
      assert.match(observed.contentHash, /^[a-f0-9]{64}$/);
      assert.equal(hq.verifyContext(bundle).valid, true);
      assert.equal(hq.verifyContext({ ...bundle, sourceSemanticIds: ['invented.contract@1'] }).valid, false);
      assert.ok(observed.semanticReferences.every(ref => ref.registryStatus !== 'current'),
        'source indexing must not promote registry identity');
    };
    linkedContext(command, 'vlang-command', 'command-intent.mjs', 'vivim.command-intent@0.1', 'type');
    linkedContext(command, 'vlang-command', 'intent-planner.mjs', 'vivim.command-intent@0.1', 'consumes');
    linkedContext(build, 'vlang-vec', 'ui-adapter.mjs', 'vivim.ui-proposal@1', 'emits');
    linkedContext(build, 'vlang-ui-consumer', 'compiler.mjs', 'vivim.ui-proposal@1', 'consumes');
    assert.throws(() => hq.context({
      task: 'trace', sourceSemanticIds: ['../../secret'],
    }), /HQ_INVALID_SOURCE_SEMANTIC_IDS/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('refused, uninstalled and schema-mismatched adapters cannot assert source identity', () => {
```

_First 80 of 90 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
