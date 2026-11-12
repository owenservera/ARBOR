import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDevIntelligence, DEV_INTELLIGENCE_CONTRACT } from '../lib/arbor-service.mjs';

test('index, search, context and wiki operate on authorized local project without donor HQ', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'arbor-hq-'));
  try {
    const source = join(tmp, 'code');
    const data = join(tmp, 'private-dev-index');
    mkdirSync(source);
    writeFileSync(join(source, 'example.mjs'), 'export function distinctArborGreeting() { return "ARBOR_SOURCE_SENTINEL"; }\n');
    const hq = createDevIntelligence({ dataDir: data, approvedRoots: [source] });
    assert.equal(hq.contract, DEV_INTELLIGENCE_CONTRACT);
    hq.registerSource({ name: 'fixture', path: source });
    const indexed = hq.index();
    assert.equal(indexed.errors.length, 0);
    assert.ok(indexed.totals.files >= 1);
    assert.ok(hq.search({ query: 'distinctArborGreeting', project: 'fixture' }).total >= 1);
    assert.equal(hq.indexWatermarks().length, 1);
    assert.match(hq.sourceEvidence({ project: 'fixture', path: 'example.mjs' }).text, /distinctArborGreeting/);
    assert.ok(hq.context({ task: 'distinctArborGreeting', project: 'fixture' }).sources.length >= 1);
    const rendered = hq.wiki();
    assert.ok(rendered);
    assert.ok(existsSync(join(data, '.hq', 'index.db')));
    assert.equal(hq.status().domain, 'development');
    assert.equal(hq.removeSource('fixture'), true);
    assert.equal(hq.search({ query: 'distinctArborGreeting' }).total, 0);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('unapproved and nonexistent roots fail closed; no implicit source discovery', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'arbor-hq-deny-'));
  try {
    const source = join(tmp, 'project'), data = join(tmp, 'data');
    mkdirSync(source);
    const hq = createDevIntelligence({ dataDir: data });
    assert.throws(() => hq.registerSource({ name: 'secret', path: source }), /HQ_SOURCE_NOT_APPROVED/);
    assert.deepEqual(hq.status().sources, []);
    assert.throws(() => hq.scanCapabilities({ path: source }), /HQ_SOURCE_NOT_APPROVED/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
