// hq/test/filetypes.test.mjs — lane K: registry, classification, routing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openMemoryDb } from '../lib/schema.mjs';
import {
  autoExpose,
  classifyPath,
  inlineTagsFor,
  loadRegistry,
  networkGraph,
  renderRuleBook,
  typesForFamily,
  typesForRole,
  typesForTask,
  validateRegistry,
} from '../lib/filetypes.mjs';

const ROOT = process.cwd();
const REGISTRY_PATH = 'hq/registry/agentic-file-registry.v1.json';
const REGISTRY_FILE = join(ROOT, REGISTRY_PATH);
const registry = loadRegistry(ROOT);

const REASONS = ['family_match', 'role_match', 'task_match', 'authority_match'];

test('validateRegistry accepts the 217/133 registry and reports exact counts', () => {
  const result = validateRegistry(registry);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(result.counts.records, 217);
  assert.equal(result.counts.catalog_patterns, 133);
  assert.equal(result.counts.repositories, 7);
  assert.equal(result.counts.families, 21);
  assert.equal(result.counts.types, 140);
  assert.equal(result.counts.mapped_records, 143);
  assert.equal(result.counts.unmapped_records, 74);
  assert.equal(result.counts.catalog_patterns_unobserved, 121);
  assert.equal(result.counts.tracked_files, 5982);
});

test('validateRegistry returns errors instead of throwing', () => {
  assert.doesNotThrow(() => validateRegistry(null));
  assert.equal(validateRegistry(null).ok, false);

  const broken = {
    ...registry,
    counts: { ...registry.counts, records: 1, catalog_patterns: 2 },
  };
  let result;
  assert.doesNotThrow(() => { result = validateRegistry(broken); });
  assert.equal(result.ok, false);
  assert.ok(Array.isArray(result.errors));
  assert.ok(result.errors.some((error) => error.includes('counts.records')));
  assert.ok(result.errors.some((error) => error.includes('counts.catalog_patterns')));
});

test('classifyPath follows exact, glob, observed-only and unclassified order', () => {
  const agents = classifyPath(registry, 'AGENTS.md');
  assert.equal(agents.family, '01');
  assert.equal(agents.typeId, 'AFT-001');
  assert.equal(agents.confidence, 1);
  assert.equal(agents.mapped, true);

  const skill = classifyPath(registry, 'SKILL.md');
  assert.equal(skill.family, '09');
  assert.equal(skill.confidence, 1);

  const readme = classifyPath(registry, 'README.md');
  assert.equal(readme.family, '04');
  assert.equal(readme.confidence, 0.6);
  assert.equal(readme.mapped, false);
  assert.equal(readme.sourceClass, 'observed_only');

  const provider = classifyPath(registry, '.opencode/agents/x.md');
  assert.equal(provider.family, '02');
  assert.equal(provider.confidence, 0.8);
  assert.equal(provider.mapped, true);

  const decision = classifyPath(registry, 'DECISIONS.md');
  assert.equal(decision.family, '20');
  assert.equal(decision.confidence, 1);

  const unknown = classifyPath(registry, 'unknown-file.xyz');
  assert.equal(unknown.family, '00');
  assert.equal(unknown.confidence, 0);
  assert.equal(unknown.typeId, null);
  assert.equal(unknown.mapped, false);
});

test('classifyPath is case-insensitive and handles Windows separators', () => {
  const lower = classifyPath(registry, 'agents.md');
  assert.equal(lower.family, '01');
  assert.equal(lower.typeId, 'AFT-001');

  const windows = classifyPath(registry, '.opencode\\agents\\reviewer.md');
  assert.equal(windows.family, '02');
  assert.equal(windows.confidence, 0.8);

  const nested = classifyPath(registry, 'workspace/project/.opencode/agents/x.md');
  assert.equal(nested.family, '02');
});

test('an exact basename never loses to a wildcard', () => {
  const synthetic = {
    schema: 'hq.agentic-file-registry/1',
    version: 1,
    types: [
      {
        id: 'AFT-900', name: '*.md', pattern: '*.md', family: '09',
        family_name: 'Skills & reusable methods', role: 'skill',
        authority: 'proposed', source_class: 'catalog_extension',
        observed_count: 0, inline_tags: [], mapped: true,
      },
      {
        id: 'AFT-901', name: 'AGENTS.md', pattern: 'AGENTS.md', family: '01',
        family_name: 'Agent entry & bootstrap', role: 'instruction',
        authority: 'vendor_documented', source_class: 'vendor_documented',
        observed_count: 0, inline_tags: ['@hq:context'], mapped: true,
      },
    ],
    records: [],
    unmapped: [],
    catalog_unobserved: [],
    by_repo: {},
    by_kind: {},
    by_family: {},
    network: { roles: {}, family_flow: [] },
    counts: {},
  };
  const hit = classifyPath(synthetic, 'AGENTS.md');
  assert.equal(hit.typeId, 'AFT-901');
  assert.equal(hit.family, '01');
  assert.equal(hit.confidence, 1);
  assert.equal(hit.pattern, 'AGENTS.md');
});

test('typesForFamily and typesForRole are deterministic arrays', () => {
  const family = typesForFamily(registry, '20');
  assert.ok(family.length > 0);
  assert.ok(family.every((type) => type.family === '20'));
  assert.deepEqual(family.map((type) => type.name), family.map((type) => type.name).slice().sort());
  assert.deepEqual(family, typesForFamily(registry, '20'));

  const role = typesForRole(registry, 'decision');
  assert.ok(role.length > 0);
  assert.ok(role.every((type) => type.role === 'decision'));
  assert.deepEqual(role, typesForRole(registry, 'DECISION'));

  assert.deepEqual(typesForFamily(registry, '99'), []);
  assert.deepEqual(typesForRole(registry, 'no-such-role'), []);
});

test('typesForTask ranks the decision family for a decision-record task', () => {
  const scored = typesForTask(registry, 'add a decision record', { limit: 12 });
  assert.ok(scored.length > 0);
  assert.ok(scored.length <= 12);
  assert.ok(scored.every((type) => type.score > 0));
  assert.ok(scored.every((type) => type.reason === 'task_match'));
  assert.equal(scored[0].family, '20');
  assert.ok(scored[0].name.includes('DECISION'));

  // score desc, then name asc
  for (let i = 1; i < scored.length; i++) {
    const prev = scored[i - 1];
    const next = scored[i];
    assert.ok(
      prev.score > next.score || (prev.score === next.score && prev.name <= next.name),
      `${prev.name} must sort before ${next.name}`,
    );
  }

  assert.deepEqual(typesForTask(registry, 'add a decision record', { limit: 12 }), scored);
  assert.deepEqual(typesForTask(registry, 'no-such-task-token-xyz'), []);
  assert.deepEqual(typesForTask(registry, 'decision', { limit: 0 }), []);
});

test('inlineTagsFor returns type tags and falls back to role tags', () => {
  const decision = inlineTagsFor(registry, 'DECISIONS.md');
  assert.ok(decision.includes('@hq:context') === false); // decisions use why/see/decision
  assert.ok(decision.includes('@hq:why'));
  assert.ok(decision.includes('@hq:see'));
  assert.ok(decision.includes('@hq:decision'));

  const skill = inlineTagsFor(registry, 'SKILL.md');
  assert.deepEqual(skill, ['@hq:context', '@hq:why']);

  assert.deepEqual(inlineTagsFor(registry, 'no-such-type'), []);
});

function seedProject(db, name, path) {
  db.prepare('INSERT INTO projects(name,path,added_at) VALUES (?,?,?)')
    .run(name, path, '2026-01-01T00:00:00Z');
  return db.prepare('SELECT id FROM projects WHERE name = ?').get(name).id;
}

function seedDocument(db, projectId, row) {
  db.prepare(
    `INSERT INTO documents(project_id,path,family,family_name,role,authority,lifecycle,origin_type)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).run(
    projectId,
    row.path,
    row.family ?? null,
    row.familyName ?? null,
    row.role ?? null,
    row.authority ?? null,
    row.lifecycle ?? 'current',
    row.originType ?? 'repository_file',
  );
}

test('autoExpose returns only existing, non-secret relevant documents', () => {
  const db = openMemoryDb();
  const demo = seedProject(db, 'demo', 'C:/demo');
  const other = seedProject(db, 'other', 'C:/other');

  seedDocument(db, demo, { path: 'DECISIONS.md', family: '20', role: 'decision', authority: 'proposed' });
  seedDocument(db, demo, { path: 'docs/notes.txt', family: '20', role: 'decision', authority: 'proposed' });
  seedDocument(db, demo, { path: 'README.md', family: '04', role: 'context', authority: 'project_observed' });
  seedDocument(db, demo, { path: '.env.local', family: '20', role: 'decision', authority: 'proposed' });
  seedDocument(db, demo, { path: 'session.json', family: '20', role: 'decision', authority: 'proposed' });
  seedDocument(db, other, { path: 'DECISIONS.md', family: '20', role: 'decision', authority: 'proposed' });

  const result = autoExpose(db, { registry, task: 'add a decision record', project: 'demo' });
  assert.ok(result.types.length > 0);
  assert.ok(result.types.every((type) => type.score > 0));
  assert.ok(result.documents.length > 0);

  const paths = result.documents.map((doc) => doc.path);
  assert.ok(paths.includes('DECISIONS.md'));
  assert.ok(paths.includes('docs/notes.txt'));
  assert.ok(!paths.includes('README.md'));
  assert.ok(!paths.includes('.env.local'));
  assert.ok(!paths.includes('session.json'));
  assert.equal(paths.filter((path) => path === 'DECISIONS.md').length, 1);

  for (const doc of result.documents) {
    assert.equal(doc.project, 'demo');
    assert.ok(REASONS.includes(doc.reason));
    assert.ok(doc.family);
    assert.ok(doc.role);
    assert.ok(doc.type);
  }
  assert.equal(result.documents.find((doc) => doc.path === 'DECISIONS.md').reason, 'family_match');
  assert.deepEqual(
    autoExpose(db, { registry, task: 'add a decision record', project: 'demo' }),
    result,
  );
});

test('autoExpose can explain an authority match without leaking unrelated docs', () => {
  const db = openMemoryDb();
  const demo = seedProject(db, 'demo', 'C:/demo');
  seedDocument(db, demo, { path: 'policies/authority.md', family: '05', role: 'law', authority: 'owner' });

  const synthetic = {
    types: [{
      id: 'AFT-999', name: 'OWNER-NOTE.md', pattern: 'OWNER-NOTE.md', family: '20',
      family_name: 'Decision & governance record', role: 'decision',
      authority: 'owner', source_class: 'local_custom', observed_count: 0,
      inline_tags: ['@hq:owner'], mapped: true,
    }],
    records: [],
  };
  const result = autoExpose(db, { registry: synthetic, task: 'owner note', project: 'demo', limit: 5 });
  assert.equal(result.documents.length, 1);
  assert.equal(result.documents[0].reason, 'authority_match');
});

test('networkGraph is deterministic and contains family and flow edges', () => {
  const first = networkGraph(registry);
  const second = networkGraph(registry);
  assert.deepEqual(first, second);
  assert.equal(first.nodes.length, 140);
  assert.ok(first.edges.length > 0);

  const ids = new Set(first.nodes.map((node) => node.id));
  const byId = new Map(first.nodes.map((node) => [node.id, node]));
  assert.ok(first.edges.every((edge) => ids.has(edge.from) && ids.has(edge.to)));
  assert.ok(first.edges.some((edge) => edge.kind === 'same_family'));
  assert.ok(first.edges.some((edge) => edge.kind === 'family_flow'));

  for (const edge of first.edges.filter((candidate) => candidate.kind === 'same_family')) {
    assert.equal(byId.get(edge.from).family, byId.get(edge.to).family);
  }
  for (let i = 1; i < first.edges.length; i++) {
    const prev = first.edges[i - 1];
    const next = first.edges[i];
    assert.ok(
      prev.from < next.from
      || (prev.from === next.from && prev.to < next.to)
      || (prev.from === next.from && prev.to === next.to && prev.kind <= next.kind),
    );
  }
});

test('renderRuleBook carries the census, tags, refs and authority statement', () => {
  const book = renderRuleBook(registry);
  assert.equal(book, renderRuleBook(registry));
  for (const needle of ['217', '133', '143', '74', '121', '21 families']) {
    assert.ok(book.includes(needle), `rule book missing ${needle}`);
  }
  for (const tag of [
    '@hq:context', '@hq:why', '@hq:invariant', '@hq:see', '@hq:todo',
    '@hq:owner', '@hq:task', '@hq:risk', '@hq:deprecated', '@hq:decision',
  ]) {
    assert.ok(book.includes(tag), `rule book missing ${tag}`);
  }
  for (const ref of ['doc:', 'decision:', 'canon:']) {
    assert.ok(book.includes(ref), `rule book missing ${ref}`);
  }
  assert.match(book, /never grants execution authority/i);
  assert.match(book, /observed files are not standards/i);
  for (const command of ['hq docs', 'hq decisions', 'hq canon', 'hq route', 'hq context', 'hq wiki']) {
    assert.ok(book.includes(command), `rule book missing ${command}`);
  }
  assert.ok(book.includes('Agent entry & bootstrap'));
  assert.ok(book.includes('Decision & governance record'));
});

test('the registry file is never modified by this module', () => {
  const before = readFileSync(REGISTRY_FILE, 'utf8');
  const book = renderRuleBook(registry);
  assert.ok(book.length > 1000);
  classifyPath(registry, 'AGENTS.md');
  typesForTask(registry, 'decision', { limit: 3 });
  networkGraph(registry);
  inlineTagsFor(registry, 'SKILL.md');
  assert.equal(readFileSync(REGISTRY_FILE, 'utf8'), before);
});
