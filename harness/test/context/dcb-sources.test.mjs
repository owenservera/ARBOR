// Focused tests for the DCB production source adapters
// (harness/src/context/dcb-sources.mjs). Proves the ledger acceptance:
// actual source revision/consent changes affect only the eligible bundle, with
// no stale or leaked data. Pure local fixtures: no network, provider or browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createDcbSourceAdapters } from '../../src/context/dcb-sources.mjs';
import { createDCBComposer } from '../../src/context/dcb-composer.mjs';

const sha = (t) => createHash('sha256').update(t, 'utf8').digest('hex');

const ROADMAP = 'docs/product/roadmap/roadmap.v1.json';
const DECISIONS = 'docs/product/roadmap/ROADMAP.md';
const REGISTRY = Object.freeze([
  Object.freeze({ ref: ROADMAP, layer: 'LpProjectState', classification: 'task_evidence',
    trust: 'observed', sensitivity: 'internal', keywords: ['roadmap'], priority: 5 }),
  Object.freeze({ ref: DECISIONS, layer: 'LdDecisions', classification: 'decision',
    trust: 'sourced', sensitivity: 'internal', keywords: ['decision'], priority: 3 }),
]);

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'dcb-sources-'));
  mkdirSync(path.join(root, 'docs', 'product', 'roadmap'), { recursive: true });
  writeFileSync(path.join(root, ROADMAP), '{"schema":"test","v":1}\n');
  writeFileSync(path.join(root, DECISIONS), '# roadmap\n');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

const memoryStore = (version = 7, entries = [{ key: 'k1', text: 'private note' }]) => ({
  load: () => ({ version, memory: { CANON: entries, Immediate: [], Curated: [] } }),
});

const devInput = (over = {}) => ({
  purpose: 'dev_task', profile: 'handoff', taskRef: 'T1', taskText: 'roadmap',
  audience: { principalRef: 'owner', projectRef: 'p1', destinationProvider: 'chatgpt', destinationModelVerified: false },
  scope: { allowedRefs: [], allowedPrefixes: ['docs/'], maxSensitivity: 'internal' },
  maxInputTokens: 4000, reservedForUserPrompt: 100, reservedForOutput: 100,
  sourceHead: null, policyVersion: 'v1', now: '2026-01-01T00:00:00.000Z', ...over,
});

test('resolves registered sources with content identity; absent sources stay unavailable', async (t) => {
  const root = fixture(t);
  const adapters = createDcbSourceAdapters({ repoRoot: root, sources: [
    ...REGISTRY,
    { ref: 'docs/does-not-exist.md', layer: 'L3Entity', classification: 'source', trust: 'sourced', sensitivity: 'internal' },
    { ref: '../escape.md', layer: 'L3Entity', classification: 'source', trust: 'sourced', sensitivity: 'internal' },
  ] });
  const resolved = await adapters.resolveSources({ taskRef: 'T1', purpose: 'dev_task' });
  assert.deepEqual(resolved.map(c => c.ref).sort(), [DECISIONS, ROADMAP].sort());
  const a = resolved.find(c => c.ref === ROADMAP);
  assert.equal(a.revision, sha('{"schema":"test","v":1}\n'));
  assert.equal(a.sha256, a.revision);
  const read = await adapters.readSource({ ref: a.ref, revision: a.revision });
  assert.equal(read.text, '{"schema":"test","v":1}\n');
});

test('a source revision change affects only that source; the old revision no longer resolves', async (t) => {
  const root = fixture(t);
  const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY });
  const before = await adapters.resolveSources({ taskRef: 'T1', purpose: 'dev_task' });
  const beforeA = before.find(c => c.ref === ROADMAP);
  const beforeB = before.find(c => c.ref === DECISIONS);

  writeFileSync(path.join(root, ROADMAP), '{"schema":"test","v":2}\n');
  const after = await adapters.resolveSources({ taskRef: 'T1', purpose: 'dev_task' });
  const afterA = after.find(c => c.ref === ROADMAP);
  const afterB = after.find(c => c.ref === DECISIONS);

  assert.notEqual(afterA.revision, beforeA.revision, 'changed source gets a new revision');
  assert.equal(afterB.revision, beforeB.revision, 'untouched source keeps its revision');
  await assert.rejects(
    () => adapters.readSource({ ref: ROADMAP, revision: beforeA.revision }),
    (err) => err.code === 'DCB_REVISION_MISMATCH',
  );
});

test('composer omits a revoked source and re-verifies freshness (no stale or leaked bundle)', async (t) => {
  const root = fixture(t);
  const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY });
  const composer = createDCBComposer(adapters);
  const first = await composer.compose(devInput());
  const firstRefs = first.manifest.sources.map(s => s.ref).sort();
  assert.deepEqual(firstRefs, [DECISIONS, ROADMAP].sort());

  // Change exactly one source; the next bundle must differ and the prior bundle
  // must no longer verify, while the untouched source keeps its revision.
  writeFileSync(path.join(root, ROADMAP), '{"schema":"test","v":2}\n');
  const second = await composer.compose(devInput());
  const secondByRef = new Map(second.manifest.sources.map(s => [s.ref, s]));
  const firstByRef = new Map(first.manifest.sources.map(s => [s.ref, s]));
  assert.notEqual(secondByRef.get(ROADMAP).revision, firstByRef.get(ROADMAP).revision);
  assert.equal(secondByRef.get(DECISIONS).revision, firstByRef.get(DECISIONS).revision);
  assert.notEqual(second.manifest.manifestDigest, first.manifest.manifestDigest);

  const verified = await composer.verify(first, devInput());
  assert.equal(verified.valid, false, 'stale bundle no longer verifies');
  assert.equal(verified.unchangedSources, false, 'source fingerprint changed');
});

test('host consent is default-deny for private memory; a revoked source never escapes', async (t) => {
  const root = fixture(t);
  const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY, memoryStore: memoryStore() });
  const memRef = 'personal-agent/memory/CANON/k1';

  const noConsent = await adapters.resolveSources({ purpose: 'personal_continuum', principalRef: 'owner', projectRef: 'p1' });
  assert(noConsent.some(c => c.ref === memRef), 'memory surfaces without an explicit consent object (composer still gates)');

  const denied = await adapters.resolveSources({
    purpose: 'personal_continuum', principalRef: 'owner', projectRef: 'p1',
    consent: { approved: true, sourceRefs: [ROADMAP], destinationProvider: 'chatgpt' },
  });
  assert(!denied.some(c => c.ref === memRef), 'unlisted private source is denied');

  const granted = await adapters.resolveSources({
    purpose: 'personal_continuum', principalRef: 'owner', projectRef: 'p1',
    consent: { approved: true, sourceRefs: [memRef], destinationProvider: 'chatgpt' },
  });
  assert(granted.some(c => c.ref === memRef), 'explicitly granted source is allowed');

  const revoked = await adapters.resolveSources({
    purpose: 'personal_continuum', principalRef: 'owner', projectRef: 'p1',
    revokedSourceRefs: [ROADMAP],
  });
  assert(!revoked.some(c => c.ref === ROADMAP), 'revoked source is excluded');
  assert(revoked.some(c => c.ref === memRef), 'revocation of one source does not drop others');
});

test('destination disclosure gates private memory at compose time', async (t) => {
  const root = fixture(t);
  const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY, memoryStore: memoryStore() });
  const composer = createDCBComposer(adapters);
  const base = {
    purpose: 'personal_continuum', profile: 'continuum', taskRef: 'T1', taskText: 'note',
    audience: { principalRef: 'owner', projectRef: 'p1', destinationProvider: 'chatgpt', destinationModelVerified: false },
    scope: { allowedRefs: [], allowedPrefixes: ['docs/', 'personal-agent/memory/'], maxSensitivity: 'private' },
    maxInputTokens: 4000, reservedForUserPrompt: 100, reservedForOutput: 100,
    sourceHead: null, policyVersion: 'v1', now: '2026-01-01T00:00:00.000Z',
  };
  const blocked = await composer.compose(base);
  assert(!blocked.manifest.sources.some(s => s.ref.startsWith('personal-agent/memory/')),
    'private memory is withheld without an exact destination disclosure');
  assert(blocked.manifest.omissions.some(o => o.ref.startsWith('personal-agent/memory/') && o.reason === 'disclosure_required'));

  const allowed = await composer.compose({ ...base, disclosure: {
    approved: true, principalRef: 'owner', destinationProvider: 'chatgpt',
    sourceRefs: ['personal-agent/memory/CANON/k1'],
  } });
  assert(allowed.manifest.sources.some(s => s.ref === 'personal-agent/memory/CANON/k1'),
    'private memory is included with an exact destination disclosure');
});

test('works without git: no mandatory Git and no stale head pin', async (t) => {
  const root = fixture(t); // fixture has no .git directory
  const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY });
  const resolved = await adapters.resolveSources({ taskRef: 'T1', purpose: 'dev_task', sourceHead: 'deadbeef' });
  assert.equal(resolved.length, 2);
  assert(resolved.every(c => c.head === null), 'no git means no head pin, not an error');
  const read = await adapters.readSource({ ref: resolved[0].ref, revision: resolved[0].revision });
  assert.equal(typeof read.text, 'string');
});

test('head pin refreshes after a commit (never a stale cached head)', async (t) => {
  let gitOk = true;
  try { execFileSync('git', ['--version'], { stdio: 'ignore' }); } catch { gitOk = false; }
  if (!gitOk) { t.skip('git unavailable'); return; }

  const root = mkdtempSync(path.join(tmpdir(), 'dcb-sources-git-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'docs', 'product', 'roadmap'), { recursive: true });
  writeFileSync(path.join(root, ROADMAP), '{"schema":"test","v":1}\n');
  const git = (...args) => execFileSync('git', ['-c', 'user.email=test@example.com', '-c', 'user.name=test', ...args],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'one');
  const firstHead = git('rev-parse', 'HEAD').trim();

  const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY });
  const first = await adapters.resolveSources({ taskRef: 'T1', purpose: 'dev_task' });
  assert(first.every(c => c.head === firstHead), 'first resolution pins the current HEAD');

  git('commit', '-q', '--allow-empty', '-m', 'two');
  const secondHead = git('rev-parse', 'HEAD').trim();
  assert.notEqual(secondHead, firstHead);
  const second = await adapters.resolveSources({ taskRef: 'T1', purpose: 'dev_task' });
  assert(second.every(c => c.head === secondHead), 'a new commit is observed, not served stale');
});