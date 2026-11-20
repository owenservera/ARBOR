# File: hq/test/filetypes.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/filetypes.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13402 B |
| Lines | 331 |
| Hash | ad89bdc1adc8 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 20 | no | const ROOT = process.cwd(); |
| REGISTRY_PATH | const | 21 | no | const REGISTRY_PATH = &#39;hq/registry/agentic-file-registry.v1.json&#39;; |
| REGISTRY_FILE | const | 22 | no | const REGISTRY_FILE = join(ROOT, REGISTRY_PATH); |
| registry | const | 23 | no | const registry = loadRegistry(ROOT); |
| REASONS | const | 25 | no | const REASONS = [&#39;family_match&#39;, &#39;role_match&#39;, &#39;task_match&#39;, &#39;authority_match&#39;]; |
| result | const | 28 | no | const result = validateRegistry(registry); |
| broken | const | 46 | no | const broken = { |
| result | variable | 50 | no | let result; |
| agents | const | 59 | no | const agents = classifyPath(registry, &#39;AGENTS.md&#39;); |
| skill | const | 65 | no | const skill = classifyPath(registry, &#39;SKILL.md&#39;); |
| readme | const | 69 | no | const readme = classifyPath(registry, &#39;README.md&#39;); |
| provider | const | 75 | no | const provider = classifyPath(registry, &#39;.opencode/agents/x.md&#39;); |
| decision | const | 80 | no | const decision = classifyPath(registry, &#39;DECISIONS.md&#39;); |
| unknown | const | 84 | no | const unknown = classifyPath(registry, &#39;unknown-file.xyz&#39;); |
| lower | const | 92 | no | const lower = classifyPath(registry, &#39;agents.md&#39;); |
| windows | const | 96 | no | const windows = classifyPath(registry, &#39;.opencode\\\\agents\\\\reviewer.md&#39;); |
| nested | const | 100 | no | const nested = classifyPath(registry, &#39;workspace/project/.opencode/agents/x.md&#39;); |
| synthetic | const | 105 | no | const synthetic = { |
| hit | const | 131 | no | const hit = classifyPath(synthetic, &#39;AGENTS.md&#39;); |
| family | const | 139 | no | const family = typesForFamily(registry, &#39;20&#39;); |
| role | const | 145 | no | const role = typesForRole(registry, &#39;decision&#39;); |
| scored | const | 155 | no | const scored = typesForTask(registry, &#39;add a decision record&#39;, { limit: 12 }); |
| prev | const | 165 | no | const prev = scored[i - 1]; |
| next | const | 166 | no | const next = scored[i]; |
| decision | const | 179 | no | const decision = inlineTagsFor(registry, &#39;DECISIONS.md&#39;); |
| skill | const | 185 | no | const skill = inlineTagsFor(registry, &#39;SKILL.md&#39;); |
| seedProject | function | 191 | no | function seedProject(db, name, path) { |
| seedDocument | function | 197 | no | function seedDocument(db, projectId, row) { |
| db | const | 214 | no | const db = openMemoryDb(); |
| demo | const | 215 | no | const demo = seedProject(db, &#39;demo&#39;, &#39;C:/demo&#39;); |
| other | const | 216 | no | const other = seedProject(db, &#39;other&#39;, &#39;C:/other&#39;); |
| result | const | 225 | no | const result = autoExpose(db, { registry, task: &#39;add a decision record&#39;, project: &#39;demo&#39; }); |
| paths | const | 230 | no | const paths = result.documents.map((doc) =&gt; doc.path); |
| db | const | 253 | no | const db = openMemoryDb(); |
| demo | const | 254 | no | const demo = seedProject(db, &#39;demo&#39;, &#39;C:/demo&#39;); |
| synthetic | const | 257 | no | const synthetic = { |
| result | const | 266 | no | const result = autoExpose(db, { registry: synthetic, task: &#39;owner note&#39;, project: &#39;demo&#39;, limit: 5 }); |
| first | const | 272 | no | const first = networkGraph(registry); |
| second | const | 273 | no | const second = networkGraph(registry); |
| ids | const | 278 | no | const ids = new Set(first.nodes.map((node) =&gt; node.id)); |
| byId | const | 279 | no | const byId = new Map(first.nodes.map((node) =&gt; [node.id, node])); |
| prev | const | 288 | no | const prev = first.edges[i - 1]; |
| next | const | 289 | no | const next = first.edges[i]; |
| book | const | 299 | no | const book = renderRuleBook(registry); |
| before | const | 323 | no | const before = readFileSync(REGISTRY_FILE, &#39;utf8&#39;); |
| book | const | 324 | no | const book = renderRuleBook(registry); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| ../lib/schema.mjs | import | 6 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 332 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
