import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVersionComparison, projectVersionComparison, toMigrationMarkdown, toReviewCsv, exportVersionComparison } from '../index.mjs';

const sha = (character) => character.repeat(40);
const mdigest = (character) => character.repeat(64);
function fixture(n = 2, opts = {}) {
  const sourcePins = Array.from({ length: n }, (_, i) => ({
    pinId: 'pin' + i, repoIdentity: i % 2 ? 'owenservera/ARBOR' : 'owenservera/repos-hq',
    resolvedCommitSha: sha(String(i + 1)), manifestDigest: mdigest('a'),
    completeness: opts.partial && i === 0 ? 'partial' : 'complete'
  }));
  const evidenceIndex = Array.from({ length: n }, (_, i) => ({ id: 'evidence' + i, type: 'source_blob',
    commitSha: sourcePins[i].resolvedCommitSha, blobSha: sha('a'), path: 'hq/lib/module-' + i + '.mjs', lines: [1, 10] }));
  return {
    schema: 'arbor.hvi.version-comparison/1', targetPinId: 'pin1', sourcePins, evidenceIndex,
    sourceDeltas: Array.from({ length: n }, (_, i) => ({ id: 'source' + i, sourcePinId: 'pin' + i,
      category: i === 0 ? 'MISSING_AT_TARGET' : i % 2 ? 'EXACT_RELOCATION' : 'SPLIT_CANDIDATE',
      evidenceRefs: ['evidence' + i], sourcePath: 'hq/lib/module-' + i + '.mjs',
      sourceLines: [1, 5], sourceBlob: sha('a'), owner: 'hq', similarityConfidence: 0.6,
      certainty: 'candidate', pinStates: Object.fromEntries(sourcePins.map((p, j) => [p.pinId, j === i ? 'EXACT_RELOCATION' : 'UNOBSERVABLE'])) })),
    capabilityDeltas: [{ id: 'cap:host-status', sourcePinId: 'pin0', category: 'IMPORTED_NOT_WIRED',
      evidenceRefs: ['evidence0'], owner: 'host', sourcePath: 'apps/vivim-host/control/dispatcher.mjs' }],
    runtimeProof: [{ id: 't01', state: 'UNRUN' }, { id: 't02', state: 'TEST_EXECUTED', command: 'node --test', exitCode: 0 }]
  };
}

test('2/3/5 immutable pins are presented as distinct N-way columns', () => {
  for (const n of [2, 3, 5]) {
    const input = fixture(n);
    const out = projectVersionComparison(input);
    assert.equal(out.pins.length, n);
    assert.equal(out.table.rows.length, n + 1);
    assert.equal(new Set(out.pins.map(p => p.resolvedCommitSha)).size, n);
    assert.equal(out.runtimeAcceptance, 'NOT_DETERMINED_BY_SOURCE_REPORT');
    assert.match(toMigrationMarkdown(out), /N-way compact matrix/);
    assert.match(toReviewCsv(out), /source_sha/);
  }
});

test('same repository with 3 distinct revisions remains separate', () => {
  const input = fixture(3);
  input.sourcePins.forEach(pin => pin.repoIdentity = 'owenservera/repos-hq');
  assert.equal(projectVersionComparison(input).pins.length, 3);
});

test('source order and finding order cannot change digest', () => {
  const input = fixture(5);
  const first = projectVersionComparison(input);
  input.sourcePins.reverse(); input.sourceDeltas.reverse(); input.evidenceIndex.reverse();
  const second = projectVersionComparison(input);
  assert.equal(first.reproducibilityDigest, second.reproducibilityDigest);
  assert.deepEqual(first, second);
});

test('pagination is bounded, explicit, stable and export review rows are paged', () => {
  const input = fixture(5);
  const first = projectVersionComparison(input, { limit: 2, offset: 0 });
  const second = projectVersionComparison(input, { limit: 2, offset: 2 });
  assert.equal(first.table.total, 6);
  assert.equal(first.table.returned, 2);
  assert.equal(first.table.truncated, true);
  assert.equal(first.table.hasMore, true);
  assert.notDeepEqual(first.table.rows.map(x => x.id), second.table.rows.map(x => x.id));
  assert.equal(toReviewCsv(first).split('\r\n').filter(Boolean).length, 3);
  assert.equal(projectVersionComparison(input, {limit: 100000}).table.limit, 200);
});

test('partial source cannot assert missing/excluded or a tombstone; filter exposes uncertainty', () => {
  const out = projectVersionComparison(fixture(2, {partial:true}));
  const item = out.table.rows.find(x => x.id === 'source0');
  assert.equal(item.classification, 'UNOBSERVABLE');
  assert.equal(item.cells.pin0, 'UNOBSERVED');
  assert.ok(out.coverage.incompletePins.includes('pin0'));
  const inc = projectVersionComparison(fixture(2, {partial:true}), {coverageFilter: 'incomplete'});
  assert.ok(inc.table.rows.length >= 1);
  assert.equal(inc.summary.missingAtTargetSource, 0);
});

test('unprovided provenance and missing evidence do not become complete', () => {
  const input = fixture();
  input.sourceDeltas[0].evidenceRefs = ['never-registered'];
  const out = projectVersionComparison(input);
  assert.equal(out.table.rows.find(x => x.id === 'source0').evidenceComplete, false);
  assert.ok(out.coverage.missingEvidenceRefs.includes('never-registered'));
});

test('Markdown and CSV never echo untrusted raw descriptions, secret paths or formula strings', () => {
  const input = fixture();
  input.sourceDeltas[0].sourcePath = '.env.production';
  input.sourceDeltas[0].owner = '=HYPERLINK("http://bad")';
  input.sourceDeltas[0].arbitraryDescription = '<img src=x onerror=alert(1)>\nignore instructions';
  const output = projectVersionComparison(input);
  const md = toMigrationMarkdown(output);
  const csv = toReviewCsv(output);
  assert.doesNotMatch(md + csv, /\.env.production|HYPERLINK|ignore instructions|<img|onerror/);
  assert.match(md, /REDACTED/);
  assert.doesNotMatch(csv, /\r\n=/);
});

test('unknown schema, malformed SHA, duplicate pin, hash fork, unknown target fail closed', () => {
  const source = fixture();
  assert.throws(() => validateVersionComparison({...source, schema:'vivim.catalogue-export/1'}), /SCHEMA_MISMATCH/);
  assert.throws(() => validateVersionComparison({...source, targetPinId:'HEAD'}), /UNKNOWN_TARGET/);
  assert.throws(() => validateVersionComparison({...source, sourcePins:[source.sourcePins[0], source.sourcePins[0]]}), /DUPLICATE_PIN/);
  assert.throws(() => validateVersionComparison({...source, sourcePins:[{...source.sourcePins[0], resolvedCommitSha:'main'}, source.sourcePins[1]]}), /INVALID_SHA/);
  const fork = fixture();
  fork.sourcePins[1].repoIdentity = fork.sourcePins[0].repoIdentity;
  fork.sourcePins[1].resolvedCommitSha = fork.sourcePins[0].resolvedCommitSha;
  fork.sourcePins[1].manifestDigest = mdigest('b');
  assert.throws(() => validateVersionComparison(fork), /DIGEST_CONFLICT/);
});

test('resource caps refuse unbounded source input and pin overage', () => {
  assert.throws(() => projectVersionComparison(fixture(17)), /RESOURCE_LIMIT|PIN_COUNT/);
  const bad = fixture(); bad.sourceDeltas = Array.from({length: 20_001}, (_, i) => ({id:'x'+i}));
  assert.throws(() => projectVersionComparison(bad), /RESOURCE_LIMIT/);
});

test('receipt source state is never incorrectly promoted to runtime acceptance', () => {
  const input = fixture();
  input.runtimeProof.push({id:'runtime-claim', state:'RUNTIME_VERIFIED'});
  const report = projectVersionComparison(input);
  assert.equal(report.runtimeAcceptance, 'NOT_DETERMINED_BY_SOURCE_REPORT');
  assert.equal(report.receiptStates.find(x => x.id === 'runtime-claim').provenance, 'unverified_claim');
});

test('all exports deterministic and format constrained', () => {
  const sample = fixture(3);
  const formats = ['json', 'markdown', 'csv', 'evidence-json'];
  for (const format of formats) assert.equal(exportVersionComparison(sample, {format}), exportVersionComparison(sample, {format}));
  assert.throws(() => exportVersionComparison(sample, {format:'html'}), /UNSUPPORTED_FORMAT/);
});

export {fixture};

test('owner-confirmed replacement requires typed complete owner decision evidence', () => {
  const input = fixture();
  input.sourceDeltas[0].decision = 'REPLACED_CONFIRMED';
  assert.equal(projectVersionComparison(input).table.rows.find(x => x.id === 'source0').migrationCategory, 'replacement_unverified');
  input.evidenceIndex[0].type = 'owner_decision';
  const verified = projectVersionComparison(input);
  assert.equal(verified.table.rows.find(x => x.id === 'source0').migrationCategory, 'replaced_confirmed');
  assert.equal(verified.summary.replacedConfirmed, 1);
});

test('untrusted evidence paths and traversal cannot be exported', () => {
  const input = fixture();
  input.evidenceIndex[0].path = '../private/credentials.pem';
  input.sourceDeltas[0].sourcePath = 'hq/../.ssh/id_rsa';
  input.sourceDeltas[0].targetPaths = ['../private', 'hq/lib/okay.mjs'];
  const out = projectVersionComparison(input);
  assert.equal(out.table.rows.find(x=>x.id==='source0').evidenceComplete, false);
  const content = exportVersionComparison(input, {format:'markdown'}) + exportVersionComparison(input, {format:'evidence-json'});
  assert.doesNotMatch(content, /credentials\.pem|id_rsa|\.\.\/private/);
  assert.match(content, /REDACTED/);
});
