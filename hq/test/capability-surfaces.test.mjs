// hq/test/capability-surfaces.test.mjs — wiki and home projections of the
// capability registry: candidates only, escaped, deterministic, and optional.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { openMemoryDb } from '../lib/schema.mjs';
import { buildWiki } from '../lib/wiki.mjs';
import { renderHome } from '../lib/home.mjs';
import {
  capabilityStatus,
  loadContracts,
  loadTaxonomy,
  persistCapabilityScan,
  scanCapabilitySource,
} from '../lib/capabilities.mjs';

const AT = '2026-11-03T00:00:00.000Z';
const SOURCE_ID = 'fixture-cap';

// Minimal npm v3 tree. `glob-fixture` matches the discovery.glob taxonomy rule
// through its name, description and keywords; `other` matches nothing.
function fixtureTree() {
  const root = mkdtempSync(join(tmpdir(), 'hq-cap-surface-'));
  const write = (rel, content) => {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  };
  write('package-lock.json', JSON.stringify({
    name: 'fixture-root',
    version: '1.0.0',
    lockfileVersion: 3,
    requires: true,
    packages: {
      '': { name: 'fixture-root', version: '1.0.0', dependencies: { 'glob-fixture': '^1.0.0' } },
      'node_modules/glob-fixture': { version: '1.0.0', license: 'MIT', integrity: 'sha512-aaa', dependencies: { other: '^2.0.0' } },
      'node_modules/glob-fixture/node_modules/other': { version: '2.0.0', license: 'ISC', integrity: 'sha512-bbb' },
    },
  }, null, 2));
  write('node_modules/glob-fixture/package.json', JSON.stringify({
    name: 'glob-fixture',
    version: '1.0.0',
    description: 'Glob pattern matcher for fixture paths',
    main: 'index.js',
    license: 'MIT',
    keywords: ['glob', 'pattern'],
    dependencies: { other: '^2.0.0' },
  }, null, 2));
  write('node_modules/glob-fixture/README.md', '# Glob fixture\n\nDemonstrates glob pattern matching across fixture paths.\n');
  write('node_modules/glob-fixture/index.js', "module.exports = { glob: true };\n");
  write('node_modules/glob-fixture/node_modules/other/package.json', JSON.stringify({
    name: 'other', version: '2.0.0', license: 'ISC', description: 'Nested dependency',
  }, null, 2));
  return root;
}

function withFixture(fn) {
  const root = fixtureTree();
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function fixtureScan(root) {
  return scanCapabilitySource(root, {
    id: SOURCE_ID,
    now: AT,
    taxonomy: loadTaxonomy(),
    contracts: loadContracts(),
  });
}

function scannedDb(root) {
  const db = openMemoryDb();
  persistCapabilityScan(db, fixtureScan(root));
  return db;
}

function workspace() {
  return mkdtempSync(join(tmpdir(), 'hq-cap-wiki-'));
}

function readPage(dir, name) {
  return readFileSync(join(dir, name), 'utf8');
}

test('wiki renders sources, licences, candidate mappings and proposed contracts', () => withFixture((tree) => {
  const ws = workspace();
  const db = scannedDb(tree);
  try {
    const result = buildWiki({ db, root: ws, projects: [], outDir: join(ws, 'wiki'), force: true });
    assert.ok(result.pages.some((page) => page.id === 'capabilities'), 'capabilities page is built');
    assert.ok(existsSync(join(ws, 'wiki', 'capabilities.md')), 'capabilities.md is written');

    const page = readPage(join(ws, 'wiki'), 'capabilities.md');
    for (const needle of [
      '# Capabilities',
      'A candidate is not an approval',
      SOURCE_ID,
      'MIT',
      'ISC',
      'discovery.glob',
      'cap.discovery.glob',
      'Owner confirmed',
      'Effects',
      'Scopes',
      'Digest',
    ]) {
      assert.ok(page.includes(needle), `capabilities page is missing: ${needle}`);
    }
    assert.match(page, /\| candidate \|/, 'source/licence/mapping rows carry candidate');
    assert.match(page, /\| proposed \|/, 'contract rows carry proposed');
    assert.match(page, /0 approved/, 'page states that zero contracts are approved');
    assert.ok(!page.includes('Demonstrates glob pattern matching'), 'document bodies never reach the page');
  } finally {
    db.close();
    rmSync(ws, { recursive: true, force: true });
  }
}));

test('wiki escapes hostile contract and effect text', () => withFixture((tree) => {
  const ws = workspace();
  const db = scannedDb(tree);
  try {
    db.prepare(
      `INSERT INTO capability_contract
         (id, version, node_id, title, description, effects, scopes, verification, status, authority, owner_confirmed, proposed_at)
       VALUES (?, 1, 'discovery.glob', ?, 'hostile fixture', '["fs:read<b>"]', '["workspace:read"]', 'none', 'proposed', 'candidate', 0, ?)`,
    ).run('cap.evil', '<script>alert(9)</script>', AT);

    buildWiki({ db, root: ws, projects: [], outDir: join(ws, 'wiki'), force: true });
    const page = readPage(join(ws, 'wiki'), 'capabilities.md');
    assert.ok(!page.includes('<script>alert(9)</script>'), 'raw script tag never rendered');
    assert.ok(page.includes('&lt;script&gt;alert(9)&lt;/script&gt;'), 'script tag is escaped');
    assert.ok(page.includes('&lt;b&gt;'), 'effect text is escaped');
  } finally {
    db.close();
    rmSync(ws, { recursive: true, force: true });
  }
}));

test('wiki capability page is deterministic for the same index', () => withFixture((tree) => {
  const ws = workspace();
  const db = scannedDb(tree);
  try {
    buildWiki({ db, root: ws, projects: [], outDir: join(ws, 'one'), force: true });
    buildWiki({ db, root: ws, projects: [], outDir: join(ws, 'two'), force: true });
    const one = readPage(join(ws, 'one'), 'capabilities.md');
    const two = readPage(join(ws, 'two'), 'capabilities.md');
    assert.equal(two, one);
  } finally {
    db.close();
    rmSync(ws, { recursive: true, force: true });
  }
}));

test('home shows a compact capability summary and hides without data', () => withFixture((tree) => {
  const db = scannedDb(tree);
  try {
    const status = capabilityStatus(db);
    const html = renderHome({ capabilities: status });
    assert.ok(html.includes('capabilities-heading'), 'section is present');
    assert.ok(html.includes('Capabilities'));
    assert.ok(html.includes('<dt>Sources</dt><dd>1</dd>'), 'source count rendered');
    assert.ok(html.includes('<dt>Packages</dt><dd>2</dd>'), 'package count rendered');
    assert.ok(html.includes(`<dt>Proposed contracts</dt><dd>${status.counts.proposed}</dd>`), 'proposed count rendered');
    assert.ok(html.includes('0 approved'), 'zero approved is stated');

    const hidden = renderHome({});
    assert.ok(!hidden.includes('capabilities-heading'), 'section hidden without capability data');
    const unavailable = renderHome({ capabilities: { available: false, sources: 1 } });
    assert.ok(!unavailable.includes('capabilities-heading'), 'section hidden when tables are absent');
  } finally {
    db.close();
  }
}));

test('missing capability tables degrade to an explanatory page, never a crash', () => {
  const ws = workspace();
  const db = openMemoryDb();
  try {
    for (const view of ['capability_candidates', 'capability_contracts_open', 'capability_license_summary']) {
      db.exec(`DROP VIEW IF EXISTS ${view}`);
    }
    for (const table of [
      'capability_document_fts', 'capability_package_fts', 'capability_map', 'capability_contract',
      'capability_evidence', 'capability_file', 'capability_dependency', 'capability_package',
      'capability_node', 'capability_source',
    ]) {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    }

    const result = buildWiki({ db, root: ws, projects: [], outDir: join(ws, 'wiki'), force: true });
    assert.ok(result.pages.some((page) => page.id === 'capabilities'));
    const page = readPage(join(ws, 'wiki'), 'capabilities.md');
    assert.match(page, /No capability registry tables in this index/);

    assert.doesNotThrow(() => renderHome({}));
    assert.ok(!renderHome({}).includes('capabilities-heading'));
  } finally {
    db.close();
    rmSync(ws, { recursive: true, force: true });
  }
});
