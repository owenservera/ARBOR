import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  composeBundle,
  composeBundleFromRegistry,
  surfaceHeaderExcerpt,
  sha256Hex,
  estimateTokens,
  BUNDLE_SCHEMA,
  INHERITS,
  BUNDLE_AUTHORITY,
  PINNED_NOW,
  BUDGET_MAX_TOKENS,
  BUDGET_RESERVED,
  CAPACITY_SLACK
} from '../control/rdcb-bundle.mjs';

const sha = (text) => createHash('sha256').update(text).digest('hex');

// A minimal @vlang:surface header followed by body source, matching the
// seeded corpus convention (control/rdcb-gen.mjs).
const header = '/* @vlang:surface demo/widget.js\n   @vlang:action: */\n';
const body = 'export const version = 1;\n';
const sourceText = header + body;
const sourceDigest = sha(sourceText);
const RELPATH = 'apps/vivim-host/public/demo/widget.js';

const surfaceRecord = {
  path: RELPATH,
  surface: 'demo widget surface',
  commentIds: ['widget-id'],
  actionIds: [],
  schema: 'vivim.file-surface/1',
  generatorVersion: 'file-surface-gen/1 stage-a',
  recordCount: 1,
  sourceDigest
};
const catalogIds = new Set(['catalog.list', 'catalog.show']);
const catalogMeta = { schema: 'vivim.control-action-catalog/1', version: 9 };
const excerptText = header.slice(0, -1); // verbatim header without trailing newline

test('surfaceHeaderExcerpt returns the verbatim header with 1-based lines', () => {
  const { lines, text } = surfaceHeaderExcerpt(sourceText);
  assert.deepEqual(lines, [1, 2]);
  assert.equal(text, excerptText);
  assert.ok(text.startsWith('/* @vlang:surface'));
  assert.ok(text.endsWith('*/'));
});

test('composeBundle conforms to the vivim.rdcb/1 contract', () => {
  const bundle = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta });
  assert.equal(bundle.schema, BUNDLE_SCHEMA);
  assert.equal(bundle.inherits, INHERITS);
  assert.equal(bundle.protocol, 'hq.dcb-protocol/1');
  assert.equal(bundle.authority, BUNDLE_AUTHORITY);
  assert.equal(bundle.trigger, 'edit.pre');
  assert.equal(bundle.project, 'arbor');
  assert.equal(bundle.status, 'fresh');
  assert.equal(bundle.sources.length, 1);
  assert.equal(bundle.sources[0].path, RELPATH);
  assert.equal(bundle.sources[0].lang, 'javascript');
  assert.equal(bundle.sources[0].authority, 'project_observed');
  assert.equal(bundle.reprogramming.vlangExecution, false);
  assert.deepEqual(bundle.symbols, []);
  assert.deepEqual(bundle.decisions, []);
  assert.deepEqual(bundle.canon, []);
  assert.deepEqual(bundle.sessions, []);
  assert.deepEqual(bundle.reprogramming.surfaceDrift, []);
});

test('bundle is pinned to the source revision: sha256 tracks exact source bytes', () => {
  const bundle = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta });
  assert.equal(bundle.sources[0].sha256, sha(sourceText));
  const alteredSource = sourceText + '// appended\n';
  const altered = composeBundle({
    relPath: RELPATH,
    bytes: alteredSource,
    surface: { ...surfaceRecord, sourceDigest: sha(alteredSource) },
    catalogIds,
    catalogMeta
  });
  assert.notEqual(altered.sources[0].sha256, bundle.sources[0].sha256);
  assert.notEqual(altered.digest, bundle.digest);
});

test('generatedAt is pinned by default and excluded from the digest', () => {
  const a = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta });
  const b = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta, now: '2026-01-01T00:00:00.000Z' });
  assert.equal(a.generatedAt, PINNED_NOW);
  assert.notEqual(b.generatedAt, PINNED_NOW);
  // Digest excludes generatedAt -> identical inputs yield identical digest.
  assert.equal(a.digest, b.digest);
});

test('determinism: same inputs yield byte-identical bundles across runs', () => {
  const first = JSON.stringify(composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta }));
  const second = JSON.stringify(composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta }));
  assert.equal(first, second);
});

test('selective invalidation: fresh when source revision matches registry, stale on drift', () => {
  const fresh = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta });
  assert.equal(fresh.status, 'fresh');
  assert.deepEqual(fresh.reprogramming.surfaceDrift, []);

  const stale = composeBundle({
    relPath: RELPATH,
    bytes: sourceText,
    surface: { ...surfaceRecord, sourceDigest: sha('some-other-bytes') },
    catalogIds,
    catalogMeta
  });
  assert.equal(stale.status, 'stale');
  assert.deepEqual(stale.reprogramming.surfaceDrift, [RELPATH]);
});

test('budget stays within capacity using the utf8-bytes/3 estimator', () => {
  const bundle = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta });
  const capacity = BUDGET_MAX_TOKENS - BUDGET_RESERVED - CAPACITY_SLACK;
  assert.equal(bundle.budget.maxTokens, BUDGET_MAX_TOKENS);
  assert.equal(bundle.budget.reserved, BUDGET_RESERVED);
  assert.equal(bundle.budget.capacity, capacity);
  assert.equal(bundle.budget.estimator, 'utf8-bytes/3');
  assert.equal(bundle.budget.used, estimateTokens(excerptText));
  assert.ok(bundle.budget.used <= bundle.budget.capacity);
});

test('fail closed: unknown actionId, missing record, and unmapped extension are rejected', () => {
  const badSurface = { ...surfaceRecord, actionIds: ['catalog.unknown'] };
  assert.throws(() => composeBundle({ relPath: RELPATH, bytes: sourceText, surface: badSurface, catalogIds, catalogMeta }),
    { message: /not found in/ });
  assert.throws(() => composeBundle({ relPath: 'apps/vivim-host/public/demo/widget.nope', bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta }),
    { message: /no file-surface record/ });
  assert.throws(() => composeBundle({ relPath: 'apps/vivim-host/public/demo/widget.py', bytes: sourceText, surface: { ...surfaceRecord, path: 'apps/vivim-host/public/demo/widget.py' }, catalogIds, catalogMeta }),
    { message: /unmapped extension/ });
  assert.throws(() => surfaceHeaderExcerpt('console.log("no header");\n'), /no @vlang:surface/);
});

test('composeBundleFromRegistry composes against a loaded registry + catalog', () => {
  const registry = { byPath: new Map([[RELPATH, surfaceRecord]]) };
  const catalog = { ids: catalogIds, schema: catalogMeta.schema, version: catalogMeta.version };
  const bundle = composeBundleFromRegistry({ relPath: RELPATH, bytes: sourceText, registry, catalog });
  assert.equal(bundle.status, 'fresh');
  assert.equal(bundle.sources[0].sha256, sha(sourceText));
  assert.equal(bundle.reprogramming.nlclCatalog.schema, 'vivim.control-action-catalog/1');
  assert.equal(bundle.reprogramming.nlclCatalog.version, 9);
  assert.equal(bundle.reprogramming.fileSurfaceRegistry.recordCount, 1);
  assert.throws(() => composeBundleFromRegistry({ relPath: 'apps/vivim-host/public/demo/missing.js', bytes: sourceText, registry, catalog }),
    { message: /no file-surface record/ });
});
