# File: hq/test/components.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/components.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 29880 B |
| Lines | 651 |
| Hash | 0560bd5978d1 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| throwsCode | function | 26 | no | function throwsCode(fn, code) { |
| caught | variable | 27 | no | let caught = null; |
| tool | function | 34 | no | function tool(id, version = &#39;1.0.0&#39;, extra = {}) { |
| count | function | 49 | no | function count(db, table) { |
| seed | function | 53 | no | function seed(db, specs) { |
| db | const | 60 | no | const db = openMemoryDb(); |
| names | const | 63 | no | const names = db.prepare(&quot;SELECT name FROM sqlite_master WHERE type = &#39;table&#39;&quot;).all().map((row) =&gt; row.name); |
| columns | const | 71 | no | const columns = db.prepare(&#39;PRAGMA table_info(components)&#39;).all().map((row) =&gt; row.name); |
| db | const | 78 | no | const db = openMemoryDb(); |
| first | const | 80 | no | const first = registerComponent(db, tool(&#39;hq.tool.index&#39;, &#39;1.0.0&#39;, { tags: [&#39;z&#39;, &#39;a&#39;] })); |
| stored | const | 86 | no | const stored = getComponent(db, { id: &#39;hq.tool.index&#39;, version: &#39;1.0.0&#39; }); |
| other | const | 93 | no | const other = openMemoryDb(); |
| replay | const | 95 | no | const replay = registerComponent(other, tool(&#39;hq.tool.index&#39;, &#39;1.0.0&#39;, { tags: [&#39;a&#39;, &#39;z&#39;] })); |
| identical | const | 101 | no | const identical = throwsCode( () =&gt; registerComponent(db, tool(&#39;hq.tool.index&#39;, &#39;1.0.1&#39;, { tags: [&#39;a&#39;, &#39;z&#39;] })), &#39;COMPONENT_DUPLICATE_DIGEST&#39;, ); |
| allowed | const | 106 | no | const allowed = registerComponent(db, tool(&#39;hq.tool.index&#39;, &#39;1.0.1&#39;), { allowDuplicateDigest: true }); |
| db | const | 118 | no | const db = openMemoryDb(); |
| gated | const | 129 | no | const gated = registerComponent(db, tool(&#39;hq.tool.retryless&#39;, &#39;1.0.0&#39;, { effects: [], authority: [], idempotency: &#39;none&#39;, approval: true, })); |
| db | const | 160 | no | const db = openMemoryDb(); |
| hits | const | 173 | no | const hits = listComponents(db, { query: &#39;alpha&#39; }); |
| seen | const | 177 | no | const seen = []; |
| cursor | variable | 178 | no | let cursor = null; |
| pages | variable | 179 | no | let pages = 0; |
| rows | const | 181 | no | const rows = listComponents(db, { limit: 2, cursor }); |
| db | const | 196 | no | const db = openMemoryDb(); |
| insertStart | const | 198 | no | const insertStart = performance.now(); |
| insertMs | const | 215 | no | const insertMs = performance.now() - insertStart; |
| pageStart | const | 218 | no | const pageStart = performance.now(); |
| cursor | variable | 219 | no | let cursor = null; |
| seen | const | 220 | no | const seen = new Set(); |
| pages | variable | 221 | no | let pages = 0; |
| rows | const | 223 | no | const rows = listComponents(db, { limit: 500, cursor }); |
| pageMs | const | 228 | no | const pageMs = performance.now() - pageStart; |
| queryStart | const | 232 | no | const queryStart = performance.now(); |
| hits | const | 233 | no | const hits = listComponents(db, { query: &#39;needle&#39;, limit: 1000 }); |
| queryMs | const | 234 | no | const queryMs = performance.now() - queryStart; |
| triggers | const | 238 | no | const triggers = listComponents(db, { kind: &#39;trigger&#39;, limit: 1000 }); |
| db | const | 248 | no | const db = openMemoryDb(); |
| versions | const | 250 | no | const versions = [&#39;0.2.3&#39;, &#39;0.3.0&#39;, &#39;1.0.0&#39;, &#39;1.2.0&#39;, &#39;1.2.5&#39;, &#39;1.3.0&#39;, &#39;2.0.0&#39;, &#39;2.1.0-beta.1&#39;]; |
| resolve | function | 254 | no | const resolve = (range) =&gt; resolveVersion(db, { id: &#39;hq.tool.semver&#39;, range }); |
| graph | const | 269 | no | const graph = compose(sequence( { id: &#39;index&#39;, component: &#39;hq.tool.index@^1.2.0&#39;, config: { changed: true } }, parallel( branch( { id: &#39;check&#39;, component: &#39;hq.tool.lint@^1.0.0&#39; }, |
| byId | const | 290 | no | const byId = new Map(graph.nodes.map((node) =&gt; [node.id, node])); |
| edgeKeys | const | 314 | no | const edgeKeys = new Set(graph.edges.map(([from, to]) =&gt; `${from}-&gt;${to}`)); |
| again | const | 319 | no | const again = compose(sequence( { id: &#39;index&#39;, component: &#39;hq.tool.index@^1.2.0&#39;, config: { changed: true } }, parallel( branch( { id: &#39;check&#39;, component: &#39;hq.tool.lint@^1.0.0&#39; }, |
| auto | const | 341 | no | const auto = compose(sequence( { component: &#39;hq.tool.index@1.0.0&#39; }, { component: &#39;hq.tool.lint@1.0.0&#39; }, )); |
| plan | const | 349 | no | const plan = compile(graph); |
| leaves | const | 356 | no | const leaves = Array.from({ length: 20 }, (_, index) =&gt; ({ id: `step-${String(index + 1).padStart(2, &#39;0&#39;)}`, component: &#39;hq.tool.index@^1.0.0&#39;, config: { order: index + 1 }, })); |
| graph | const | 361 | no | const graph = compose(sequence(leaves.slice(0, 10), leaves.slice(10))); |
| plan | const | 362 | no | const plan = compile(graph); |
| db | const | 371 | no | const db = openMemoryDb(); |
| registered | const | 373 | no | const registered = registerPipeline(db, { id: &#39;chain-20&#39;, version: &#39;1.0.0&#39;, nodes: graph.nodes, edges: graph.edges, |
| stored | const | 380 | no | const stored = getPipeline(db, { id: &#39;chain-20&#39;, version: &#39;1.0.0&#39; }); |
| cyclic | const | 393 | no | const cyclic = validateGraph({ nodes: [ { id: &#39;a&#39;, component: &#39;hq.tool.index@1.0.0&#39;, dependsOn: [&#39;b&#39;] }, { id: &#39;b&#39;, component: &#39;hq.tool.lint@1.0.0&#39;, dependsOn: [&#39;a&#39;] }, ], |
| selfDep | const | 403 | no | const selfDep = validateGraph({ nodes: [{ id: &#39;a&#39;, component: &#39;hq.tool.index@1.0.0&#39;, dependsOn: [&#39;a&#39;] }] }); |
| unknown | const | 406 | no | const unknown = validateGraph({ nodes: [{ id: &#39;a&#39;, component: &#39;hq.tool.index@1.0.0&#39;, dependsOn: [&#39;ghost&#39;] }] }); |
| db | const | 419 | no | const db = openMemoryDb(); |
| graph | const | 433 | no | const graph = getPipeline(db, { id: &#39;cfg-pipeline&#39;, version: &#39;1.0.0&#39; }); |
| baseline | const | 435 | no | const baseline = compile(graph, { db, inputs: { task: &#39;x&#39; } }); |
| differentInputs | const | 443 | no | const differentInputs = compile(graph, { db, inputs: { task: &#39;y&#39; } }); |
| activation | const | 448 | no | const activation = activate(db, { scope: &#39;workspace&#39;, pipelineId: &#39;cfg-pipeline&#39;, version: &#39;1.0.0&#39;, config: { mode: &#39;activation&#39;, flag: true }, |
| withActivation | const | 456 | no | const withActivation = compile(graph, { db, scope: &#39;workspace&#39;, inputs: { task: &#39;x&#39; } }); |
| withRun | const | 462 | no | const withRun = compile(graph, { db, scope: &#39;workspace&#39;, inputs: { task: &#39;x&#39; }, run: { mode: &#39;run&#39; }, }); |
| db | const | 470 | no | const db = openMemoryDb(); |
| graph | const | 478 | no | const graph = getPipeline(db, { id: &#39;scope-pipeline&#39;, version: &#39;1.0.0&#39; }); |
| workspaceDigest | const | 493 | no | const workspaceDigest = compile(graph, { db, scope: &#39;workspace&#39; }).configDigest; |
| projectDigest | const | 494 | no | const projectDigest = compile(graph, { db, scope: &#39;project&#39;, scopeRef: &#39;alpha&#39; }).configDigest; |
| sessionDigest | const | 495 | no | const sessionDigest = compile(graph, { db, scope: &#39;session&#39;, scopeRef: &#39;sess-1&#39; }).configDigest; |
| db | const | 500 | no | const db = openMemoryDb(); |
| first | const | 530 | no | const first = activate(db, { scope: &#39;workspace&#39;, pipelineId: &#39;index-after-edit&#39;, version: &#39;1.0.0&#39;, config: { strict: true }, actor: &#39;owner&#39;, }); |
| second | const | 535 | no | const second = activate(db, { scope: &#39;workspace&#39;, pipelineId: &#39;index-after-edit&#39;, version: &#39;2.0.0&#39;, config: { strict: false }, actor: &#39;owner&#39;, }); |
| projectActivation | const | 539 | no | const projectActivation = activate(db, { scope: &#39;project&#39;, scopeRef: &#39;alpha&#39;, pipelineId: &#39;index-after-edit&#39;, version: &#39;2.0.0&#39;, actor: &#39;owner&#39;, }); |
| back | const | 544 | no | const back = rollback(db, { scope: &#39;workspace&#39;, pipelineId: &#39;index-after-edit&#39;, toVersion: &#39;1.0.0&#39;, actor: &#39;owner&#39;, }); |
| active | const | 550 | no | const active = db.prepare(&#39;SELECT scope, scope_ref, version FROM activations ORDER BY scope, scope_ref&#39;).all(); |
| log | const | 556 | no | const log = db.prepare(&quot;SELECT action, from_version, to_version FROM activation_log WHERE action = &#39;rollback&#39;&quot;).get(); |
| v1Before | const | 559 | no | const v1Before = getPipeline(db, { id: &#39;index-after-edit&#39;, version: &#39;1.0.0&#39; }).digest; |
| fork | const | 560 | no | const fork = forkPipeline(db, { id: &#39;index-after-edit&#39;, fromVersion: &#39;1.0.0&#39;, newVersion: &#39;3.0.0&#39;, actor: &#39;owner&#39; }); |
| bumped | const | 565 | no | const bumped = forkPipeline(db, { id: &#39;index-after-edit&#39;, fromVersion: &#39;2.0.0&#39;, actor: &#39;owner&#39; }); |
| diff | const | 570 | no | const diff = diffPipeline(db, { id: &#39;index-after-edit&#39;, a: &#39;1.0.0&#39;, b: &#39;2.0.0&#39; }); |
| versions | const | 582 | no | const versions = listPipelines(db, { id: &#39;index-after-edit&#39;, limit: 20 }).map((pipeline) =&gt; pipeline.version); |
| hits | const | 584 | no | const hits = listPipelines(db, { query: &#39;index&#39;, limit: 20 }); |
| db | const | 590 | no | const db = openMemoryDb(); |
| recordedPipeline | const | 599 | no | const recordedPipeline = getPipeline(db, { id: &#39;replay-pipeline&#39;, version: &#39;1.0.0&#39; }); |
| recordedPlan | const | 600 | no | const recordedPlan = compile(recordedPipeline, { db, inputs: { task: &#39;old&#39; } }); |
| historical | const | 620 | no | const historical = replayPlan(db, { runId: &#39;run_recorded&#39; }); |
| live | const | 631 | no | const live = replayPlan(db, { runId: &#39;run_recorded&#39;, live: true, inputs: { task: &#39;new&#39; } }); |
| recorded | const | 641 | no | const recorded = replayPlan(db, { runId: &#39;run_recorded&#39;, record: true }); |
| original | const | 644 | no | const original = db.prepare(&#39;SELECT * FROM pipeline_runs WHERE id = ?&#39;).get(&#39;run_recorded&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../lib/schema.mjs | import | 4 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/components.test.mjs — lane N: component registry, pipelines, activation, replay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openMemoryDb, transaction } from '../lib/schema.mjs';
import {
  activate,
  compile,
  compose,
  diffPipeline,
  ensureSchema,
  forkPipeline,
  getComponent,
  getPipeline,
  listComponents,
  listPipelines,
  registerComponent,
  registerPipeline,
  replayPlan,
  resolveVersion,
  rollback,
  validateGraph,
} from '../lib/components.mjs';

const { sequence, parallel, branch, map: mapStep, reduce, retry, fallback, approval, timeout, optional } = compose.helpers;

function throwsCode(fn, code) {
  let caught = null;
  try { fn(); } catch (error) { caught = error; }
  assert.ok(caught, `expected ${code}, nothing was thrown`);
  assert.equal(caught.code, code, `expected ${code}, got ${caught.code}: ${caught.message}`);
  return caught;
}

function tool(id, version = '1.0.0', extra = {}) {
  return {
    id,
    version,
    kind: 'tool',
    title: extra.title ?? id,
    effects: ['fs:read'],
    authority: ['fs:read'],
    idempotency: 'natural',
    tags: ['fixture'],
    handler: 'hq/lib/example.mjs#run',
    ...extra,
  };
}

function count(db, table) {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n);
}

function seed(db, specs) {
  for (const spec of specs) registerComponent(db, spec);
}

// ---------------------------------------------------------------------------

test('ensureSchema is idempotent and owns the registry tables', () => {
  const db = openMemoryDb();
  assert.equal(ensureSchema(db), db);
  assert.equal(ensureSchema(db), db);
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
  for (const table of [
    'components', 'component_tags', 'components_fts',
    'pipelines', 'pipelines_fts',
    'activations', 'activation_log', 'pipeline_runs', 'pipeline_steps',
  ]) {
    assert.ok(names.includes(table), `missing table ${table}`);
  }
  const columns = db.prepare('PRAGMA table_info(components)').all().map((row) => row.name);
  for (const column of ['digest', 'content_digest', 'version_key', 'effects', 'authority', 'idempotency', 'status']) {
    assert.ok(columns.includes(column), `missing column ${column}`);
  }
});

test('registerComponent publishes id@version with a stable digest and rejects duplicates', () => {
  const db = openMemoryDb();
  ensureSchema(db);
  const first = registerComponent(db, tool('hq.tool.index', '1.0.0', { tags: ['z', 'a'] }));
```

_First 80 of 652 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
