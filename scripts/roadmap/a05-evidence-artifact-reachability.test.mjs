import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Acceptance (VERIFY:CONSOLIDATE:scripts/roadmap/artifacts, rows AT-1525B34F627A
// and AT-EF13B50CB62B): no production import or runtime read of these evidence
// artifacts. They are retained historical a05 cycle receipts with no executable
// runtime dependency. This test pins that state and the evidence fields.
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

const ARTIFACTS = [
  'scripts/roadmap/artifacts/a05-cycle-6abe8e8d6b1b98c7f90a761e4aab321a0451ac05.json',
  'scripts/roadmap/artifacts/a05-cycle-a59f587f65b4d38a5ab03af47f44fb9ef065155b.json',
];

const ARTIFACT_BASENAMES = ARTIFACTS.map((p) => p.split(sep).pop());
const COMMIT_SHAS = [
  '6abe8e8d6b1b98c7f90a761e4aab321a0451ac05',
  'a59f587f65b4d38a5ab03af47f44fb9ef065155b',
];

function readJson(rel) {
  return JSON.parse(readFileSync(resolve(REPO_ROOT, rel), 'utf8'));
}

function productionSourceFiles() {
  const out = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.coordination' || entry.name === '.git') continue;
        walk(full);
      } else if (entry.name.endsWith('.mjs') || entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
        if (entry.name.endsWith('.test.mjs')) continue; // tests are not production source
        if (full.includes(join('scripts', 'roadmap', 'artifacts'))) continue; // the evidence itself is not production
        out.push(full);
      }
    }
  }
  walk(REPO_ROOT);
  return out;
}

test('both a05 cycle artifacts exist as retained historical evidence', () => {
  for (const rel of ARTIFACTS) {
    const abs = resolve(REPO_ROOT, rel);
    assert.ok(statSync(abs).isFile(), rel + ' must exist as a file');
    const rec = readJson(rel);
    assert.equal(rec.schema, 'arbor.item-receipt/1', rel + ' must carry the item-receipt schema');
    assert.equal(rec.itemId, 'A05');
    assert.equal(rec.status, 'blocked');
    assert.equal(rec.verification, 'INDEPENDENT_REFUSED');
    assert.equal(rec.evidence.kind, 'build', rel + ' evidence kind must be build');
    assert.equal(rec.evidence.independentVerification, 'NOT_RUN');
    assert.equal(rec.evidence.acceptanceEvidenceClaimed, false);
    assert.equal(rec.evidence.confirmedDefects.length, 0, rel + ' must carry no confirmed defects');
    assert.ok(/^[a-f0-9]{40}$/.test(rec.commitSha), rel + ' must carry a 40-hex commitSha');
    assert.equal(rec.commitSha, rec.committedRevision);
  }
});

test('no production source imports or runtime-reads the a05 evidence artifacts', () => {
  const ownFile = resolve(fileURLToPath(import.meta.url));
  const hits = [];
  for (const file of productionSourceFiles()) {
    if (resolve(file) === ownFile) continue;
    let src;
    try { src = readFileSync(file, 'utf8'); } catch { continue; }
    for (const basename of ARTIFACT_BASENAMES) {
      if (src.includes(basename)) hits.push({ file, kind: 'artifact-basename', match: basename });
    }
    for (const sha of COMMIT_SHAS) {
      if (src.includes(sha)) hits.push({ file, kind: 'commit-sha', match: sha });
    }
  }
  assert.deepEqual(
    hits,
    [],
    'production source must not import or runtime-read the a05 evidence artifacts; unexpected hits: ' + JSON.stringify(hits),
  );
});
