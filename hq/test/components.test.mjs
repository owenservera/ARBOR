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
  assert.equal(first.created, true);
  assert.equal(first.id, 'hq.tool.index');
  assert.equal(first.version, '1.0.0');
  assert.match(first.digest, /^[0-9a-f]{64}$/);

  const stored = getComponent(db, { id: 'hq.tool.index', version: '1.0.0' });
  assert.equal(stored.digest, first.digest);
  assert.deepEqual(stored.effects, ['fs:read']);
  assert.deepEqual(stored.tags, ['a', 'z'], 'tags are normalised for determinism');
  assert.equal(stored.kind, 'tool');

  // Digest excludes createdAt/createdBy and is stable across databases and tag order.
  const other = openMemoryDb();
  ensureSchema(other);
  const replay = registerComponent(other, tool('hq.tool.index', '1.0.0', { tags: ['a', 'z'] }));
  assert.equal(replay.digest, first.digest, 'same declaration must hash the same');

  throwsCode(() => registerComponent(db, tool('hq.tool.index', '1.0.0')), 'COMPONENT_VERSION_EXISTS');

  // Same content under another version is detected, not duplicated.
  const identical = throwsCode(
    () => registerComponent(db, tool('hq.tool.index', '1.0.1', { tags: ['a', 'z'] })),
    'COMPONENT_DUPLICATE_DIGEST',
  );
  assert.equal(identical.detail.duplicateOf, '1.0.0');
  const allowed = registerComponent(db, tool('hq.tool.index', '1.0.1'), { allowDuplicateDigest: true });
  assert.equal(allowed.created, true);
  assert.equal(count(db, 'components'), 2);

  // A real change is a new immutable version.
  registerComponent(db, tool('hq.tool.index', '1.0.2', { changelog: 'add changed flag' }));
  assert.equal(getComponent(db, { id: 'hq.tool.index' }).version, '1.0.2', 'highest version is the default');
  assert.equal(getComponent(db, { id: 'hq.tool.index', version: '^1.0.0' }).version, '1.0.2');
  assert.equal(getComponent(db, { id: 'hq.tool.missing' }), null);
});

test('component validation enforces effects, authority, approval and the no-effect boundary', () => {
  const db = openMemoryDb();
  ensureSchema(db);

  throwsCode(
    () => registerComponent(db, tool('hq.tool.writer', '1.0.0', { effects: ['db:write'], authority: [] })),
    'COMPONENT_AUTHORITY_REQUIRED',
  );
  throwsCode(
    () => registerComponent(db, tool('hq.tool.retryless', '1.0.0', { effects: [], authority: [], idempotency: 'none' })),
    'COMPONENT_APPROVAL_REQUIRED',
  );
  const gated = registerComponent(db, tool('hq.tool.retryless', '1.0.0', {
    effects: [], authority: [], idempotency: 'none', approval: true,
  }));
  assert.equal(gated.created, true);
  throwsCode(
    () => registerComponent(db, tool('hq.tool.browser', '1.0.0', { effects: ['browser:click'], authority: ['ui:write'] })),
    'COMPONENT_EFFECT_FORBIDDEN',
  );
  throwsCode(
    () => registerComponent(db, tool('hq.tool.send', '1.0.0', { effects: ['send:message'], authority: ['send:write'] })),
    'COMPONENT_EFFECT_FORBIDDEN',
  );
  throwsCode(
    () => registerComponent(db, tool('hq.tool.bad', '1.0')),
    'COMPONENT_VERSION_INVALID',
  );
  throwsCode(
    () => registerComponent(db, tool('hq.tool.bad', '1.0.0', { kind: 'browser' })),
    'COMPONENT_KIND_INVALID',
  );
  throwsCode(
    () => registerComponent(db, tool('hq.tool.bad', '1.0.0', { status: 'gone' })),
    'COMPONENT_STATUS_INVALID',
  );
  throwsCode(
    () => registerComponent(db, tool('hq.tool.sink', '1.0.0', { kind: 'sink', effects: [], authority: [] })),
    'COMPONENT_EFFECTS_REQUIRED',
  );
});

test('listComponents filters by kind, tag and FTS and paginates with a cursor', () => {
  const db = openMemoryDb();
  ensureSchema(db);
  seed(db, [
    tool('hq.tool.alpha', '1.0.0', { tags: ['search'], title: 'Alpha search' }),
    tool('hq.tool.alpha', '1.1.0', { tags: ['search'], title: 'Alpha search', changelog: 'newer' }),
    tool('hq.tool.beta', '1.0.0', { tags: ['search', 'lint'], title: 'Beta lint' }),
    tool('hq.trigger.files', '1.0.0', { kind: 'trigger', tags: ['filesystem'], title: 'Filesystem trigger' }),
    tool('hq.eval.context', '1.0.0', { kind: 'evaluator', tags: ['search'], title: 'Context evaluator' }),
  ]);

  assert.equal(listComponents(db, { kind: 'tool' }).length, 3);
  assert.equal(listComponents(db, { tag: 'filesystem' }).length, 1);
  assert.equal(listComponents(db, { tag: 'search' }).length, 4);
  const hits = listComponents(db, { query: 'alpha' });
  assert.equal(hits.length, 2);
  assert.ok(hits.every((row) => row.id === 'hq.tool.alpha'));

  const seen = [];
  let cursor = null;
  let pages = 0;
  do {
    const rows = listComponents(db, { limit: 2, cursor });
    assert.ok(rows.length <= 2);
    seen.push(...rows.map((row) => `${row.id}@${row.version}`));
    cursor = rows.nextCursor;
    pages += 1;
  } while (cursor);
  assert.equal(pages, 3);
  assert.equal(new Set(seen).size, 5);
  assert.equal(seen[0], 'hq.eval.context@1.0.0', 'ids sort ascending');
  assert.equal(seen[1], 'hq.tool.alpha@1.1.0', 'versions sort newest first');

  assert.equal(listComponents(db, { query: 'no-such-token-anywhere' }).length, 0);
});

test('10,000 synthetic components register in one batch; pagination and filters stay fast', { timeout: 120000 }, () => {
  const db = openMemoryDb();
  ensureSchema(db);
  const insertStart = performance.now();
  transaction(db, () => {
    for (let i = 0; i < 10000; i++) {
      registerComponent(db, {
        id: `hq.tool.batch.${String(i).padStart(5, '0')}`,
        version: '1.0.0',
        kind: i % 10 === 0 ? 'trigger' : 'tool',
        title: `Batch action ${i}`,
        description: i % 97 === 0 ? 'search needle widget' : 'synthetic component',
        effects: ['fs:read'],
        authority: ['fs:read'],
        idempotency: 'natural',
        tags: i % 100 === 0 ? ['batch', 'needle'] : ['batch'],
        changelog: `generated ${i}`,
      });
    }
  });
  const insertMs = performance.now() - insertStart;
  assert.equal(count(db, 'components'), 10000);

  const pageStart = performance.now();
  let cursor = null;
  const seen = new Set();
  let pages = 0;
  do {
    const rows = listComponents(db, { limit: 500, cursor });
    for (const row of rows) seen.add(`${row.id}@${row.version}`);
    cursor = rows.nextCursor;
    pages += 1;
  } while (cursor);
  const pageMs = performance.now() - pageStart;
  assert.equal(seen.size, 10000);
  assert.equal(pages, 20);

  const queryStart = performance.now();
  const hits = listComponents(db, { query: 'needle', limit: 1000 });
  const queryMs = performance.now() - queryStart;
  assert.ok(hits.length >= 150, `FTS returned ${hits.length}`);
  assert.ok(hits.every((row) => row.description.includes('needle') || row.tags.includes('needle')));

  const triggers = listComponents(db, { kind: 'trigger', limit: 1000 });
  assert.equal(triggers.length, 1000);
  assert.equal(listComponents(db, { tag: 'needle', limit: 1000 }).length, 100);

  console.log(
    `[lanes N] 10k components: insert ${insertMs.toFixed(1)}ms; ${pages} cursor pages ${pageMs.toFixed(1)}ms; FTS+kind+tag ${queryMs.toFixed(1)}ms`,
  );
});

test('resolveVersion honours caret, tilde, comparators, exact and wildcard ranges', () => {
  const db = openMemoryDb();
  ensureSchema(db);
  const versions = ['0.2.3', '0.3.0', '1.0.0', '1.2.0', '1.2.5', '1.3.0', '2.0.0', '2.1.0-beta.1'];
  for (const version of versions) {
    registerComponent(db, tool('hq.tool.semver', version, { changelog: `release ${version}` }));
  }
  const resolve = (range) => resolveVersion(db, { id: 'hq.tool.semver', range });

  assert.equal(resolve('^1.2.0'), '1.3.0');
  assert.equal(resolve('~1.2.0'), '1.2.5');
  assert.equal(resolve('>=1.2.0 <2.0.0'), '1.3.0');
  assert.equal(resolve('1.2.0'), '1.2.0');
  assert.equal(resolve('^0.2.0'), '0.2.3');
  assert.equal(resolve('*'), '2.0.0', 'wildcard prefers the highest stable release');
  assert.equal(resolve('2.1.0-beta.1'), '2.1.0-beta.1', 'an exact prerelease is selectable');
  assert.equal(resolve('^3.0.0'), null);
  assert.equal(resolveVersion(db, { id: 'hq.tool.missing', range: '*' }), null);
  throwsCode(() => resolve('not-a-range'), 'VERSION_RANGE_INVALID');
});

test('compose builds every combinator into one deterministic DAG', () => {
  const graph = compose(sequence(
    { id: 'index', component: 'hq.tool.index@^1.2.0', config: { changed: true } },
    parallel(
      branch(
        { id: 'check', component: 'hq.tool.lint@^1.0.0' },
        { id: 'lint', component: 'hq.tool.lint@^1.0.0' },
        { id: 'skip', component: 'hq.tool.noop@1.0.0' },
      ),
      mapStep([1, 2, 3], { id: 'fan', component: 'hq.tool.index@^1.2.0' }),
      reduce([1, 2, 3], { id: 'fold', component: 'hq.tool.wiki@^1.0.0' }),
    ),
    retry({ id: 'wiki', component: 'hq.tool.wiki@^1.0.0' }, { retries: 3 }),
    fallback(
      { id: 'primary', component: 'hq.tool.index@^1.2.0' },
      { id: 'backup', component: 'hq.tool.index@^1.0.0' },
    ),
    approval({ id: 'publish', component: 'hq.tool.wiki@^1.0.0' }, 'owner'),
    timeout({ id: 'slow', component: 'hq.tool.wiki@^1.0.0' }, 5000),
    optional({ id: 'hints', component: 'hq.tool.wiki@^1.0.0' }),
  ));

  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  assert.equal(graph.nodes.length, 12);
  assert.deepEqual(graph.nodes.map((node) => node.id).sort(), [
    'backup', 'check', 'fan', 'fold', 'hints', 'index', 'lint', 'primary', 'publish', 'skip', 'slow', 'wiki',
  ]);

  assert.equal(byId.get('index').config.changed, true);
  assert.equal(byId.get('lint').branch, 'yes');
  assert.equal(byId.get('skip').branch, 'no');
  assert.equal(byId.get('fan').kind, 'map');
  assert.equal(byId.get('fan').fanOut, 3);
  assert.equal(byId.get('fold').kind, 'reduce');
  assert.equal(byId.get('fold').fanOut, 3);
  assert.equal(byId.get('wiki').retries, 3);
  assert.equal(byId.get('wiki').retry.backoff, 'exponential');
  assert.equal(byId.get('backup').fallbackOf, true);
  assert.deepEqual(byId.get('backup').onFailureOf, ['primary']);
  assert.deepEqual(byId.get('publish').approval, { required: true, scope: 'owner' });
  assert.equal(byId.get('slow').timeoutMs, 5000);
  assert.equal(byId.get('hints').optional, true);
  assert.deepEqual(graph.groups.branches[0].yes, ['lint']);
  assert.deepEqual(graph.groups.branches[0].no, ['skip']);
  assert.deepEqual(graph.groups.fallbacks[0].backupEntry, ['backup']);

  const edgeKeys = new Set(graph.edges.map(([from, to]) => `${from}->${to}`));
  for (const edge of ['index->check', 'index->fan', 'index->fold', 'lint->wiki', 'fan->wiki', 'fold->wiki', 'publish->slow', 'slow->hints']) {
    assert.ok(edgeKeys.has(edge), `missing edge ${edge}`);
  }

  const again = compose(sequence(
    { id: 'index', component: 'hq.tool.index@^1.2.0', config: { changed: true } },
    parallel(
      branch(
        { id: 'check', component: 'hq.tool.lint@^1.0.0' },
        { id: 'lint', component: 'hq.tool.lint@^1.0.0' },
        { id: 'skip', component: 'hq.tool.noop@1.0.0' },
      ),
      mapStep([1, 2, 3], { id: 'fan', component: 'hq.tool.index@^1.2.0' }),
      reduce([1, 2, 3], { id: 'fold', component: 'hq.tool.wiki@^1.0.0' }),
    ),
    retry({ id: 'wiki', component: 'hq.tool.wiki@^1.0.0' }, { retries: 3 }),
    fallback(
      { id: 'primary', component: 'hq.tool.index@^1.2.0' },
      { id: 'backup', component: 'hq.tool.index@^1.0.0' },
    ),
    approval({ id: 'publish', component: 'hq.tool.wiki@^1.0.0' }, 'owner'),
    timeout({ id: 'slow', component: 'hq.tool.wiki@^1.0.0' }, 5000),
    optional({ id: 'hints', component: 'hq.tool.wiki@^1.0.0' }),
  ));
  assert.equal(again.digest, graph.digest, 'same composition, same graph digest');

  const auto = compose(sequence(
    { component: 'hq.tool.index@1.0.0' },
    { component: 'hq.tool.lint@1.0.0' },
  ));
  assert.deepEqual(auto.nodes.map((node) => node.id), ['n1', 'n2'], 'unnamed nodes get deterministic ids');
  assert.deepEqual(auto.edges, [['n1', 'n2']]);

  assert.equal(validateGraph(graph).ok, true);
  const plan = compile(graph);
  assert.equal(plan.nodes.length, 12);
  assert.equal(plan.order.length, 12);
  assert.equal(plan.digest, compile(graph).digest);
});

test('a 20-node pipeline compiles; cycles, self-deps and unknown deps are rejected', () => {
  const leaves = Array.from({ length: 20 }, (_, index) => ({
    id: `step-${String(index + 1).padStart(2, '0')}`,
    component: 'hq.tool.index@^1.0.0',
    config: { order: index + 1 },
  }));
  const graph = compose(sequence(leaves.slice(0, 10), leaves.slice(10)));
  const plan = compile(graph);
  assert.equal(plan.nodes.length, 20);
  assert.equal(plan.order.length, 20);
  assert.equal(plan.levels.length, 20, 'a chain has one node per level');
  assert.equal(plan.nodes[0].id, 'step-01');
  assert.equal(plan.order[0], 'step-01');
  assert.equal(plan.order[19], 'step-20');
  assert.equal(plan.digest, compile(graph).digest, 'deterministic plan digest');

  const db = openMemoryDb();
  ensureSchema(db);
  const registered = registerPipeline(db, {
    id: 'chain-20',
    version: '1.0.0',
    nodes: graph.nodes,
    edges: graph.edges,
  });
  assert.equal(registered.created, true);
  const stored = getPipeline(db, { id: 'chain-20', version: '1.0.0' });
  assert.equal(stored.nodes.length, 20);
  assert.equal(compile(stored, { db }).order.length, 20);

  throwsCode(() => registerPipeline(db, {
    id: 'cyclic',
    version: '1.0.0',
    nodes: [
      { id: 'a', component: 'hq.tool.index@1.0.0', dependsOn: ['b'] },
      { id: 'b', component: 'hq.tool.lint@1.0.0', dependsOn: ['a'] },
    ],
  }), 'PIPELINE_CYCLE');

  const cyclic = validateGraph({
    nodes: [
      { id: 'a', component: 'hq.tool.index@1.0.0', dependsOn: ['b'] },
      { id: 'b', component: 'hq.tool.lint@1.0.0', dependsOn: ['a'] },
    ],
  });
  assert.equal(cyclic.ok, false);
  assert.ok(cyclic.errors.some((error) => error.code === 'CYCLE'));
  assert.deepEqual(cyclic.errors.find((error) => error.code === 'CYCLE').nodes, ['a', 'b']);

  const selfDep = validateGraph({ nodes: [{ id: 'a', component: 'hq.tool.index@1.0.0', dependsOn: ['a'] }] });
  assert.ok(selfDep.errors.some((error) => error.code === 'NODE_SELF_DEPENDENCY'));

  const unknown = validateGraph({ nodes: [{ id: 'a', component: 'hq.tool.index@1.0.0', dependsOn: ['ghost'] }] });
  assert.equal(unknown.ok, false);
  assert.ok(unknown.errors.some((error) => error.code === 'NODE_DEP_UNKNOWN'));
  throwsCode(() => compile({ nodes: [{ id: 'a', component: 'hq.tool.index@1.0.0', dependsOn: ['ghost'] }] }), 'GRAPH_INVALID');

  throwsCode(() => registerPipeline(db, {
    id: 'chain-20',
    version: '1.0.0',
    nodes: [{ id: 'only', component: 'hq.tool.index@1.0.0' }],
  }), 'PIPELINE_VERSION_EXISTS');
});

test('config precedence resolves component < pipeline < node < activation < run', () => {
  const db = openMemoryDb();
  ensureSchema(db);
  registerComponent(db, tool('hq.tool.cfg', '1.0.0', {
    defaults: { mode: 'component', depth: 0, limit: 10 },
    effects: ['fs:read'],
    authority: ['fs:read'],
  }));
  registerPipeline(db, {
    id: 'cfg-pipeline',
    version: '1.0.0',
    nodes: [{ id: 'step', component: 'hq.tool.cfg@^1.0.0', config: { mode: 'node' } }],
    defaults: { config: { mode: 'pipeline', limit: 50 } },
    config: { fromPipeline: true },
  });
  const graph = getPipeline(db, { id: 'cfg-pipeline', version: '1.0.0' });

  const baseline = compile(graph, { db, inputs: { task: 'x' } });
  assert.equal(baseline.config.step.mode, 'node');
  assert.equal(baseline.config.step.limit, 50);
  assert.equal(baseline.config.step.depth, 0);
  assert.equal(baseline.config.step.fromPipeline, true);
  assert.match(baseline.configDigest, /^[0-9a-f]{64}$/);
  assert.equal(compile(graph, { db, inputs: { task: 'x' } }).configDigest, baseline.configDigest);

  const differentInputs = compile(graph, { db, inputs: { task: 'y' } });
  assert.equal(differentInputs.configDigest, baseline.configDigest, 'config digest is independent of inputs');
  assert.notEqual(differentInputs.inputDigest, baseline.inputDigest);
  assert.notEqual(differentInputs.digest, baseline.digest);

  const activation = activate(db, {
    scope: 'workspace',
    pipelineId: 'cfg-pipeline',
    version: '1.0.0',
    config: { mode: 'activation', flag: true },
    actor: 'owner',
  });
  assert.match(activation.configDigest, /^[0-9a-f]{64}$/);
  const withActivation = compile(graph, { db, scope: 'workspace', inputs: { task: 'x' } });
  assert.equal(withActivation.config.step.mode, 'activation');
  assert.equal(withActivation.config.step.flag, true);
  assert.notEqual(withActivation.configDigest, baseline.configDigest);
  assert.deepEqual(withActivation.activation, { scope: 'workspace', scopeRef: '', version: '1.0.0' });

  const withRun = compile(graph, {
    db, scope: 'workspace', inputs: { task: 'x' }, run: { mode: 'run' },
  });
  assert.equal(withRun.config.step.mode, 'run');
  assert.notEqual(withRun.configDigest, withActivation.configDigest);
});

test('activation precedence picks session over project over workspace', () => {
  const db = openMemoryDb();
  ensureSchema(db);
  registerComponent(db, tool('hq.tool.cfg', '1.0.0', { defaults: { mode: 'component' } }));
  registerPipeline(db, {
    id: 'scope-pipeline',
    version: '1.0.0',
    nodes: [{ id: 'step', component: 'hq.tool.cfg@^1.0.0' }],
  });
  const graph = getPipeline(db, { id: 'scope-pipeline', version: '1.0.0' });

  activate(db, { scope: 'workspace', pipelineId: 'scope-pipeline', version: '1.0.0', config: { mode: 'workspace' } });
  activate(db, { scope: 'project', scopeRef: 'alpha', pipelineId: 'scope-pipeline', version: '1.0.0', config: { mode: 'project' } });
  activate(db, { scope: 'session', scopeRef: 'sess-1', pipelineId: 'scope-pipeline', version: '1.0.0', config: { mode: 'session' } });

  assert.equal(compile(graph, { db, scope: 'workspace' }).config.step.mode, 'workspace');
  assert.equal(compile(graph, { db, scope: 'project', scopeRef: 'alpha' }).config.step.mode, 'project');
  assert.equal(
    compile(graph, { db, scope: 'project', scopeRef: 'unknown' }).config.step.mode,
    'workspace',
    'an unset project falls back to workspace',
  );
  assert.equal(compile(graph, { db, scope: 'session', scopeRef: 'sess-1' }).config.step.mode, 'session');

  const workspaceDigest = compile(graph, { db, scope: 'workspace' }).configDigest;
  const projectDigest = compile(graph, { db, scope: 'project', scopeRef: 'alpha' }).configDigest;
  const sessionDigest = compile(graph, { db, scope: 'session', scopeRef: 'sess-1' }).configDigest;
  assert.equal(new Set([workspaceDigest, projectDigest, sessionDigest]).size, 3);
});

test('activate, rollback, fork and diff keep every version', () => {
  const db = openMemoryDb();
  ensureSchema(db);
  seed(db, [
    tool('hq.tool.index', '1.0.0', { defaults: { limit: 10 } }),
    tool('hq.tool.index', '1.1.0', { defaults: { limit: 20 } }),
    tool('hq.tool.lint', '1.0.0'),
  ]);
  registerPipeline(db, {
    id: 'index-after-edit',
    version: '1.0.0',
    nodes: [
      { id: 'index', component: 'hq.tool.index@^1.0.0', config: { changed: true } },
      { id: 'lint', component: 'hq.tool.lint@^1.0.0', dependsOn: ['index'] },
      { id: 'wiki', component: 'hq.tool.wiki@^1.0.0', dependsOn: ['index'], optional: true },
    ],
    defaults: { config: { retries: 1 } },
  });
  registerPipeline(db, {
    id: 'index-after-edit',
    version: '2.0.0',
    parentVersion: '1.0.0',
    nodes: [
      { id: 'index', component: 'hq.tool.index@^1.0.0', config: { changed: false } },
      { id: 'lint', component: 'hq.tool.lint@1.0.0', dependsOn: ['index'] },
      { id: 'verify', component: 'hq.tool.lint@^1.0.0', dependsOn: ['lint'] },
    ],
    defaults: { config: { retries: 2 } },
    changelog: 'tighten',
  });

  const first = activate(db, {
    scope: 'workspace', pipelineId: 'index-after-edit', version: '1.0.0', config: { strict: true }, actor: 'owner',
  });
  assert.equal(first.previousVersion, null);
  assert.equal(first.activatedBy, 'owner');
  const second = activate(db, {
    scope: 'workspace', pipelineId: 'index-after-edit', version: '2.0.0', config: { strict: false }, actor: 'owner',
  });
  assert.equal(second.previousVersion, '1.0.0');
  const projectActivation = activate(db, {
    scope: 'project', scopeRef: 'alpha', pipelineId: 'index-after-edit', version: '2.0.0', actor: 'owner',
  });
  assert.equal(projectActivation.scopeRef, 'alpha');

  const back = rollback(db, {
    scope: 'workspace', pipelineId: 'index-after-edit', toVersion: '1.0.0', actor: 'owner',
  });
  assert.equal(back.action, 'rollback');
  assert.equal(back.version, '1.0.0');
  assert.equal(back.previousVersion, '2.0.0');
  const active = db.prepare('SELECT scope, scope_ref, version FROM activations ORDER BY scope, scope_ref').all();
  assert.deepEqual(
    active.map((row) => ({ scope: row.scope, scopeRef: row.scope_ref, version: row.version })),
    [{ scope: 'project', scopeRef: 'alpha', version: '2.0.0' }, { scope: 'workspace', scopeRef: '', version: '1.0.0' }],
  );
  assert.equal(count(db, 'activation_log'), 4);
  const log = db.prepare("SELECT action, from_version, to_version FROM activation_log WHERE action = 'rollback'").get();
  assert.deepEqual({ action: log.action, from: log.from_version, to: log.to_version }, { action: 'rollback', from: '2.0.0', to: '1.0.0' });

  const v1Before = getPipeline(db, { id: 'index-after-edit', version: '1.0.0' }).digest;
  const fork = forkPipeline(db, { id: 'index-after-edit', fromVersion: '1.0.0', newVersion: '3.0.0', actor: 'owner' });
  assert.equal(fork.version, '3.0.0');
  assert.equal(fork.parentVersion, '1.0.0');
  assert.equal(fork.status, 'draft');
  assert.equal(getPipeline(db, { id: 'index-after-edit', version: '1.0.0' }).digest, v1Before);
  const bumped = forkPipeline(db, { id: 'index-after-edit', fromVersion: '2.0.0', actor: 'owner' });
  assert.equal(bumped.version, '2.1.0', 'fork bumps the minor version by default');
  throwsCode(() => forkPipeline(db, { id: 'index-after-edit', fromVersion: '1.0.0', newVersion: '2.0.0' }), 'PIPELINE_VERSION_EXISTS');
  throwsCode(() => forkPipeline(db, { id: 'missing-pipeline', fromVersion: '1.0.0' }), 'PIPELINE_NOT_FOUND');

  const diff = diffPipeline(db, { id: 'index-after-edit', a: '1.0.0', b: '2.0.0' });
  assert.equal(diff.identical, false);
  assert.deepEqual(diff.nodes.added, ['verify']);
  assert.deepEqual(diff.nodes.removed, ['wiki']);
  assert.ok(diff.nodes.changed.some((entry) => entry.id === 'index' && entry.fields.includes('config')));
  assert.ok(diff.components.changed.some((entry) => entry.node === 'lint' && entry.from === 'hq.tool.lint@^1.0.0' && entry.to === 'hq.tool.lint@1.0.0'));
  assert.deepEqual(diff.config.added, []);
  assert.deepEqual(diff.config.removed, []);
  assert.deepEqual(diff.config.changed.map((entry) => entry.key), ['retries']);
  assert.equal(diff.config.changed[0].from, 1);
  assert.equal(diff.config.changed[0].to, 2);

  const versions = listPipelines(db, { id: 'index-after-edit', limit: 20 }).map((pipeline) => pipeline.version);
  assert.deepEqual(versions, ['3.0.0', '2.1.0', '2.0.0', '1.0.0']);
  const hits = listPipelines(db, { query: 'index', limit: 20 });
  assert.ok(hits.length >= 4);
  assert.equal(getComponent(db, { id: 'hq.tool.index', version: '1.0.0' }).defaults.limit, 10);
});

test('replayPlan replays the recorded versions and inputs, or the live registry', () => {
  const db = openMemoryDb();
  ensureSchema(db);
  registerComponent(db, tool('hq.tool.index', '1.0.0', { defaults: { limit: 10 } }));
  registerPipeline(db, {
    id: 'replay-pipeline',
    version: '1.0.0',
    nodes: [{ id: 'step', component: 'hq.tool.index@^1.0.0' }],
    defaults: { config: { mode: 'recorded' } },
  });
  const recordedPipeline = getPipeline(db, { id: 'replay-pipeline', version: '1.0.0' });
  const recordedPlan = compile(recordedPipeline, { db, inputs: { task: 'old' } });
  assert.equal(recordedPlan.nodes[0].componentVersion, '1.0.0');
  assert.equal(recordedPlan.config.step.limit, 10);

  db.prepare(`
    INSERT INTO pipeline_runs(
      id, pipeline_id, pipeline_version, pipeline_digest, plan_digest, config, config_digest,
      input_digest, output_digest, component_versions, inputs, status, scope, scope_ref,
      started_at, finished_at, error
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    'run_recorded', 'replay-pipeline', '1.0.0', recordedPipeline.digest, recordedPlan.digest,
    '{}', recordedPlan.configDigest, recordedPlan.inputDigest, null,
    JSON.stringify({ step: '1.0.0' }), JSON.stringify({ task: 'old' }),
    'succeeded', 'project', 'alpha', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:01.000Z', null,
  );

  // The registry moves on; the recorded run must not.
  registerComponent(db, tool('hq.tool.index', '1.1.0', { defaults: { limit: 20 } }));

  const historical = replayPlan(db, { runId: 'run_recorded' });
  assert.equal(historical.replay.mode, 'historical');
  assert.equal(historical.replay.runId, 'run_recorded');
  assert.equal(historical.pipeline.version, '1.0.0');
  assert.equal(historical.nodes.find((node) => node.id === 'step').componentVersion, '1.0.0');
  assert.equal(historical.replay.componentVersions.step, '1.0.0');
  assert.equal(historical.config.step.limit, 10, 'historical replay uses the recorded component version defaults');
  assert.deepEqual(historical.inputs, { task: 'old' });
  assert.equal(historical.inputDigest, recordedPlan.inputDigest);
  assert.equal(historical.replay.recordedInputDigest, recordedPlan.inputDigest);

  const live = replayPlan(db, { runId: 'run_recorded', live: true, inputs: { task: 'new' } });
  assert.equal(live.replay.mode, 'live');
  assert.equal(live.nodes.find((node) => node.id === 'step').componentVersion, '1.1.0');
  assert.equal(live.config.step.limit, 20, 'live replay resolves the current registry');
  assert.deepEqual(live.inputs, { task: 'new' });
  assert.notEqual(live.inputDigest, historical.inputDigest);
  assert.notEqual(live.digest, historical.digest);

  throwsCode(() => replayPlan(db, { runId: 'run_missing' }), 'REPLAY_RUN_NOT_FOUND');

  const recorded = replayPlan(db, { runId: 'run_recorded', record: true });
  assert.match(recorded.replay.recordedRunId, /^run_/);
  assert.equal(count(db, 'pipeline_runs'), 2, 'recording a replay appends, it never deletes');
  const original = db.prepare('SELECT * FROM pipeline_runs WHERE id = ?').get('run_recorded');
  assert.equal(original.pipeline_version, '1.0.0');
  assert.equal(JSON.parse(original.component_versions).step, '1.0.0');
  assert.equal(original.status, 'succeeded');

  assert.equal(getComponent(db, { id: 'hq.tool.index', version: '1.0.0' }).version, '1.0.0');
  assert.equal(getComponent(db, { id: 'hq.tool.index', version: '1.1.0' }).version, '1.1.0');
});
