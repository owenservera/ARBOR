# File: apps/vivim-host/test/vlang-command-compilation.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/vlang-command-compilation.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6188 B |
| Lines | 109 |
| Hash | 3617ede9cde3 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| text | const | 9 | no | const text = &#39;edit wiki section main/about saying Updated from VIVIM&#39;; |
| source | const | 10 | no | const source = &#39;desktop&#39;; |
| checkCompilation | function | 12 | no | function checkCompilation(plan) { |
| compiled | const | 13 | no | const compiled = plan.language.vec; |
| planner | const | 27 | no | const planner = createControlPlanner(); |
| plan | const | 28 | no | const plan = planner.planText(text, { source }); |
| lexicon | variable | 41 | no | let lexicon = []; |
| planner | const | 42 | no | const planner = createControlPlanner({ lexicon: () =&gt; lexicon }); |
| worldRevision | const | 43 | no | const worldRevision = planner.world().v; |
| catalogRevision | const | 44 | no | const catalogRevision = planner.catalog.version; |
| dataRoot | const | 59 | no | const dataRoot = mkdtempSync(join(tmpdir(), &#39;arbor-vec-command-&#39;)); |
| ownerToken | const | 60 | no | const ownerToken = &#39;vec-command-owner-test-token-&#39;.repeat(3); |
| server | variable | 61 | no | let server; |
| start | function | 62 | no | async function start() { |
| stop | function | 67 | no | const stop = () =&gt; new Promise(resolve =&gt; server.close(resolve)); |
| origin | variable | 72 | no | let origin = await start(); |
| call | function | 73 | no | async function call(route, { body, authorized = true } = {}) { |
| headers | const | 74 | no | const headers = { origin, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;content-type&#39;: &#39;application/json&#39;, |
| res | const | 76 | no | const res = await fetch(origin + route, { method: body ? &#39;POST&#39; : &#39;GET&#39;, headers, ...(body ? { body: JSON.stringify(body) } : {}) }); |
| before | const | 80 | no | const before = await call(&#39;/api/wiki&#39;); |
| planned | const | 83 | no | const planned = await call(&#39;/api/host/control/plan&#39;, { body: { text } }); |
| plan | const | 85 | no | const plan = planned.data; |
| approval | const | 91 | no | const approval = { planId: plan.planId, planDigest: plan.planDigest }; |
| result | const | 95 | no | const result = await call(&#39;/api/host/control/execute&#39;, { body: approval }); |
| after | const | 98 | no | const after = await call(&#39;/api/wiki&#39;); |
| restarted | const | 105 | no | const restarted = await call(&#39;/api/wiki&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control/intent-planner.mjs | import | 3 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |
| ../server.mjs | import | 4 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| node:fs | import | 5 | external |
| node:os | import | 6 | external |
| node:path | import | 7 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlanner } from '../control/intent-planner.mjs';
import { createHostServer } from '../server.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const text = 'edit wiki section main/about saying Updated from VIVIM';
const source = 'desktop';

function checkCompilation(plan) {
  const compiled = plan.language.vec;
  assert.equal(compiled.schema, 'vivim.vec-compile/0.1');
  assert.equal(compiled.domain, 'command');
  assert.equal(compiled.outcome, 'candidate');
  assert.equal(compiled.authorization, 'none');
  assert.equal(compiled.executed, false);
  assert.equal(compiled.persisted, false);
  assert.equal(compiled.proposal.schema, 'vivim.command-intent/0.1');
  assert.equal(compiled.proposal.actionId, plan.actionId);
  assert.deepEqual(compiled.proposal.args, plan.args);
  assert.equal(compiled.proposal.provenance.authority, 'none');
}

test('VEC canonical command is the exact typed Host plan, never an authorization', () => {
  const planner = createControlPlanner();
  const plan = planner.planText(text, { source });
  assert.equal(plan.outcome, 'approval_required');
  assert.equal(plan.actionId, 'wiki.section.edit');
  assert.deepEqual(plan.args, { target: 'main/about', content: 'Updated from VIVIM' });
  checkCompilation(plan);
  assert.deepEqual(plan.language.vec.proposal, planner.interpretCommand(text, { source }));
  assert.equal(plan.executionPerformed, false);
  assert.equal(plan.requiresApproval, true);
  assert.equal(plan.risk, 'R1');
  assert.ok(plan.language.feedback);
});

test('VEC refuses stale interpretation and preserves incomplete, ambiguous and negated outcomes', () => {
  let lexicon = [];
  const planner = createControlPlanner({ lexicon: () => lexicon });
  const worldRevision = planner.world().v;
  const catalogRevision = planner.catalog.version;
  assert.equal(planner.planText(text, { source, catalogRevision: catalogRevision - 1 }).refusal.code, 'STALE_CATALOG');
  lexicon = [{ word: 'customword', actionId: 'wiki.section.edit' }];
  assert.equal(planner.planText(text, { source, worldRevision }).refusal.code, 'STALE_WORLD');
  assert.equal(planner.planText('edit wiki section main/about', { source }).outcome, 'incomplete');
  assert.equal(planner.planText('stop all traffic', { source }).outcome, 'clarification_required');
  assert.equal(planner.planText('do not ' + text, { source }).outcome, 'refused');
  assert.notEqual(planner.planText(text + ' and then show my theme', { source }).outcome, 'approval_required');
  assert.equal(planner.validateCommandCandidate(text, { actionId: 'wiki.section.edit',
    args: { target: 'main/about', content: 'Different' } }, { source }).refusal.code, 'CONFLICTING_ARGUMENTS');
  assert.equal(planner.validateCommandCandidate(text, { actionId: 'wiki.section.edit',
    args: { target: 'main/about', content: 'Updated from VIVIM' }, risk: 'R0' }, { source }).outcome, 'refused');
});

test('actual Host HTTP VEC plan, exact approval, Wiki readback and restart', async t => {
  const dataRoot = mkdtempSync(join(tmpdir(), 'arbor-vec-command-'));
  const ownerToken = 'vec-command-owner-test-token-'.repeat(3);
  let server;
  async function start() {
    server = createHostServer({ dataRoot, ownerToken });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return 'http://127.0.0.1:' + server.address().port;
  }
  const stop = () => new Promise(resolve => server.close(resolve));
  t.after(async () => {
    if (server?.listening) await stop();
    rmSync(dataRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
  });
  let origin = await start();
  async function call(route, { body, authorized = true } = {}) {
    const headers = { origin, 'x-vivim-control': '1', 'content-type': 'application/json',
      ...(authorized ? { authorization: 'Bearer ' + ownerToken } : {}) };
    const res = await fetch(origin + route, { method: body ? 'POST' : 'GET', headers,
      ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, data: await res.json() };
  }
  const before = await call('/api/wiki');
```

_First 80 of 110 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
