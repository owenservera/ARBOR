// Real, no-fixture HVI live source composition.
// This suite reads THIS repository's actual Git object database (loose objects and
// packfiles) through createGitObjectStoreAdapter: no synthetic invented fixtures,
// no Git executable, no network, no checkout and no working-tree read.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGitObjectStoreAdapter } from '../version-intelligence/sources/adapters.mjs';
import {
  acquirePinnedSnapshot, manifestDigestOf, readPinnedBlob,
} from '../version-intelligence/sources/snapshots.mjs';
import { canonicalRepo, digest as sourceDigest, gitBlobSha } from '../version-intelligence/sources/common.mjs';
import {
  runHviSelectedSources, HVI_SOURCE_SELECTION_SCHEMA, HVI_TOOL_RESULT_SCHEMA,
} from '../version-intelligence/integration/index.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const gitDir = join(root, '.git');
const hasObjectStore = existsSync(join(gitDir, 'HEAD')) && existsSync(join(gitDir, 'objects'));

function registeredRepoIdentity() {
  try {
    const config = readFileSync(join(gitDir, 'config'), 'utf8');
    const url = /\[remote "origin"\]\s*\r?\n\s*url\s*=\s*(\S+)/.exec(config)?.[1];
    const match = url && /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url);
    if (match) return canonicalRepo(match[1] + '/' + match[2], 'github');
  } catch { /* fall through */ }
  return null;
}

/** Two real commits of the registered repository: the checked-out ref and its parent. */
async function realSelection() {
  if (!hasObjectStore) return null;
  const repo = registeredRepoIdentity();
  const adapter = createGitObjectStoreAdapter({ gitDir });
  const headRef = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim();
  const refName = headRef.startsWith('ref: ') ? headRef.slice(5).trim() : 'HEAD';
  const head = await adapter.resolveRef({ ref: refName });
  if (!head?.commitSha) return null;
  const commit = await adapter.readCommit({ commitSha: head.commitSha });
  const parent = commit?.parents?.[0] ?? null;
  if (!repo || !parent) return null;
  const parentCommit = await adapter.readCommit({ commitSha: parent });
  if (!parentCommit) return null;
  return { repo, adapter, refName, headSha: head.commitSha, parentSha: parent };
}

const REAL = await realSelection();
const skip = 'no local Git object database with a parent commit';

const selection = (overrides = {}) => ({
  schema: HVI_SOURCE_SELECTION_SCHEMA,
  sources: [
    { repo: REAL?.repo ?? 'owenservera/ARBOR', ref: REAL?.refName ?? 'main' },
    { repo: REAL?.repo ?? 'owenservera/ARBOR', sha: REAL?.parentSha ?? '0'.repeat(40) },
  ],
  targetIndex: 1,
  ...overrides,
});
const countingGrant = (denyAfter = Infinity) => {
  const calls = [];
  return {
    calls,
    authorize: async context => { calls.push(context); return calls.length < denyAfter; },
  };
};

test('a real registered repository compares two real pinned commits without Git', async t => {
  if (!REAL) return t.skip(skip);
  const { authorize, calls } = countingGrant();
  const result = await runHviSelectedSources(selection({ includeParity: true }), {
    adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize,
  });

  assert.equal(result.schema, HVI_TOOL_RESULT_SCHEMA);
  assert.equal(result.runtimeAccepted, false);
  assert.equal(result.hostBound, false);
  assert.ok(calls.length > 10, 'the live grant is re-evaluated on every source read');

  const pins = result.comparison.sourcePins;
  assert.equal(pins.length, 2);
  assert.deepEqual(pins.map(p => p.repoIdentity), [REAL.repo, REAL.repo]);
  assert.deepEqual(pins.map(p => p.resolvedCommitSha).sort(),
    [REAL.headSha, REAL.parentSha].sort());
  // Pin identity is derived from the exact revision, never from a caller label.
  for (const pin of pins) {
    assert.equal(pin.pinId, sourceDigest({ provider: 'github', repoIdentity: pin.repoIdentity,
      commitSha: pin.resolvedCommitSha, subPath: '' }));
  }
  assert.equal(result.comparison.targetPinId, pins.find(p => p.resolvedCommitSha === REAL.parentSha).pinId);
  assert.equal(result.comparison.coverage.length, 1);
  // A real repository legitimately contains denied path segments, so the source
  // projection is complete or partial; it is never silently called complete.
  assert.ok(['complete', 'partial'].includes(result.comparison.coverage[0].sourceCompleteness));
  assert.ok(['complete', 'partial'].includes(result.comparison.coverage[0].targetCompleteness));
  assert.equal(result.comparison.coverage[0].sourcePinId,
    result.comparison.sourcePins.find(p => p.resolvedCommitSha === REAL.headSha).pinId);
  assert.ok(result.comparison.summary.observedFindings > 0, 'real source rows were compared');
  assert.equal(result.comparison.summary.runtimeParity, 'UNVERIFIED');
  assert.equal(result.comparison.runtimeProof.length, 0);
  assert.match(result.evidenceReport.status,
    /^(SOURCE_ONLY_UNVERIFIED|INCOMPLETE_SOURCE_EVIDENCE)$/);
  // Denied source paths never reach the report or the evidence index.
  assert.ok(!JSON.stringify(result).includes('studio/profiles/chatgpt.json'));

  // Both bridge receipts bind the native A digest to the real repo/commit/tree.
  assert.equal(result.adapterReceipts.length, 2);
  for (const receipt of result.adapterReceipts) {
    assert.equal(receipt.repoIdentity, REAL.repo);
    assert.match(receipt.aDigest, /^[0-9a-f]{64}$/);
    assert.match(receipt.cProjectionDigest, /^[0-9a-f]{64}$/);
    assert.match(receipt.rootTreeSha, /^[0-9a-f]{40}$/);
  }

  // The real parity join is physical source evidence only: no owner decision and
  // no runtime receipt is ever manufactured for the selected project.
  assert.equal(result.parity.length, 1);
  const parity = result.parity[0];
  assert.equal(parity.donorPinId,
    result.comparison.sourcePins.find(p => p.resolvedCommitSha === REAL.headSha).pinId);
  assert.equal(parity.targetPinId, result.comparison.targetPinId);
  assert.ok(parity.joinedRows.length > 0);
  assert.equal(parity.coverage.inspectedFiles, 0);
  assert.ok(parity.joinedRows.every(row => row.runtimeEvidence === 'UNRUN'));
  assert.ok(parity.joinedRows.every(row => row.ownerDecision === 'UNKNOWN_UNREVIEWED'));
  assert.equal(parity.runtimeAccepted, false);
  assert.equal(parity.ownerAcceptance, 'UNRUN');
  // The comparison is bound to the registered repository, not an invented one.
  assert.ok(result.comparison.sourcePins.every(p => p.repoIdentity === REAL.repo));
  assert.ok(!JSON.stringify(result).includes('MUST_NOT_READ'));
});

test('acquisition binds the receipt to the exact commit, tree and manifest digest', async t => {
  if (!REAL) return t.skip(skip);
  const { authorize } = countingGrant();
  const acquired = await acquirePinnedSnapshot({ repo: REAL.repo, ref: REAL.refName }, {
    adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize,
  });
  assert.equal(acquired.pin.resolvedCommitSha, REAL.headSha);
  assert.equal(acquired.receipt.verifiedAdapter, 'verified-git-object-store');
  assert.equal(acquired.receipt.manifestDigest, acquired.manifest.manifestDigest);
  assert.equal(acquired.manifest.manifestDigest, manifestDigestOf(acquired.manifest));
  assert.equal(acquired.manifest.pinId, acquired.pin.pinId);
  assert.equal(acquired.manifest.rootTreeSha, acquired.pin.rootTreeSha);
  assert.equal(acquired.manifest.observedEntries, acquired.manifest.entries.length);
});

test('the configured adapter resolves a real blob under its exact Git identity', async t => {
  if (!REAL) return t.skip(skip);
  const { authorize } = countingGrant();
  const acquired = await acquirePinnedSnapshot({ repo: REAL.repo, ref: REAL.refName }, {
    adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize,
  });
  const entry = acquired.manifest.entries.find(e => e.path === 'hq/version-intelligence/sources/adapters.mjs');
  assert.ok(entry, 'the pinned real manifest contains a real source file');
  assert.equal(entry.kind, 'file');
  const bytes = await readPinnedBlob(acquired.pin, entry.path, {
    adapter: REAL.adapter, authorize, manifest: acquired.manifest,
  });
  assert.ok(bytes.length > 0);
  assert.equal(gitBlobSha(bytes), entry.blobSha, 'the resolved bytes hash to the pinned blob');
});

test('an unregistered repository is refused before any source object is read', async t => {
  if (!REAL) return t.skip(skip);
  let reads = 0;
  const counted = { ...REAL.adapter, resolveRef: async input => {
    reads++;
    return REAL.adapter.resolveRef(input);
  } };
  await assert.rejects(runHviSelectedSources(selection({
    sources: [{ repo: 'not/registered', ref: REAL.refName }, { repo: REAL.repo, sha: REAL.parentSha }],
  }), { adapter: counted, approvedRepositories: [REAL.repo], authorize: async () => true }),
  { code: 'SOURCE_UNAUTHORIZED' });
  assert.equal(reads, 0);
});

test('a revoked grant during acquisition denies without a report', async t => {
  if (!REAL) return t.skip(skip);
  const { authorize, calls } = countingGrant(2);
  await assert.rejects(runHviSelectedSources(selection(), {
    adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize,
  }), { code: 'SOURCE_UNAUTHORIZED' });
  assert.ok(calls.length >= 2);
});

test('a SHA that contradicts the selected ref fails closed', async t => {
  if (!REAL) return t.skip(skip);
  const { authorize } = countingGrant();
  await assert.rejects(runHviSelectedSources(selection({
    sources: [{ repo: REAL.repo, ref: REAL.refName, sha: REAL.parentSha },
      { repo: REAL.repo, sha: REAL.parentSha }],
  }), { adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize }),
  { code: 'PIN_MOVED' });
});

test('a ref that moves between resolution and verification fails closed', async t => {
  if (!REAL) return t.skip(skip);
  let calls = 0;
  const moving = { ...REAL.adapter, resolveRef: async () => ({
    commitSha: ++calls === 1 ? REAL.headSha : REAL.parentSha,
  }) };
  const { authorize } = countingGrant();
  await assert.rejects(acquirePinnedSnapshot({ repo: REAL.repo, ref: REAL.refName }, {
    adapter: moving, approvedRepositories: [REAL.repo], authorize,
  }), { code: 'PIN_MOVED' });
  assert.equal(calls, 2);
});

test('absent, partial and unregistered adapters never acquire a source', async t => {
  if (!REAL) return t.skip(skip);
  const { authorize } = countingGrant();
  await assert.rejects(runHviSelectedSources(selection(), {
    approvedRepositories: [REAL.repo], authorize,
  }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(runHviSelectedSources(selection(), {
    adapter: { authorizedDevelopmentSource: true, resolveRef: () => null },
    approvedRepositories: [REAL.repo], authorize,
  }), { code: 'SOURCE_UNAUTHORIZED' });
  await assert.rejects(runHviSelectedSources(selection(), {
    adapter: REAL.adapter, approvedRepositories: [], authorize,
  }), { code: 'SOURCE_UNAUTHORIZED' });
});

test('the selection schema rejects duplicate, unpinned and out-of-range selections', async t => {
  if (!REAL) return t.skip(skip);
  const { authorize } = countingGrant();
  const options = { adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize };
  await assert.rejects(runHviSelectedSources({
    schema: HVI_SOURCE_SELECTION_SCHEMA,
    sources: [{ repo: REAL.repo, ref: REAL.refName }, { repo: REAL.repo, ref: REAL.refName }],
    targetIndex: 0,
  }, options), { code: 'INVALID_REQUEST' });
  await assert.rejects(runHviSelectedSources({
    schema: HVI_SOURCE_SELECTION_SCHEMA,
    sources: [{ repo: REAL.repo }, { repo: REAL.repo, sha: REAL.parentSha }],
    targetIndex: 1,
  }, options), { code: 'INVALID_REQUEST' });
  await assert.rejects(runHviSelectedSources(selection({ targetIndex: 7 }), options),
    { code: 'INVALID_REQUEST' });
});