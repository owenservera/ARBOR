# File: harness/test/context/dcb-sources.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-sources.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10753 B |
| Lines | 193 |
| Hash | e0a9091a47d4 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 15 | no | const sha = (t) =&gt; createHash(&#39;sha256&#39;).update(t, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| ROADMAP | const | 17 | no | const ROADMAP = &#39;docs/product/roadmap/roadmap.v1.json&#39;; |
| DECISIONS | const | 18 | no | const DECISIONS = &#39;docs/product/roadmap/ROADMAP.md&#39;; |
| REGISTRY | const | 19 | no | const REGISTRY = Object.freeze([ Object.freeze({ ref: ROADMAP, layer: &#39;LpProjectState&#39;, classification: &#39;task_evidence&#39;, trust: &#39;observed&#39;, sensitivity: &#39;internal&#39;, keywords: [&#39;roadmap&#39;], priority: 5… |
| fixture | function | 26 | no | function fixture(t) { |
| root | const | 27 | no | const root = mkdtempSync(path.join(tmpdir(), &#39;dcb-sources-&#39;)); |
| memoryStore | function | 35 | no | const memoryStore = (version = 7, entries = [{ key: &#39;k1&#39;, text: &#39;private note&#39; }]) =&gt; ({ load: () =&gt; ({ version, memory: { CANON: entries, Immediate: [], Curated: [] } }), }); |
| devInput | function | 39 | no | const devInput = (over = {}) =&gt; ({ purpose: &#39;dev_task&#39;, profile: &#39;handoff&#39;, taskRef: &#39;T1&#39;, taskText: &#39;roadmap&#39;, audience: { principalRef: &#39;owner&#39;, projectRef: &#39;p1&#39;, destinationProvider: &#39;chatgpt&#39;, de… |
| root | const | 48 | no | const root = fixture(t); |
| adapters | const | 49 | no | const adapters = createDcbSourceAdapters({ repoRoot: root, sources: [ ...REGISTRY, { ref: &#39;docs/does-not-exist.md&#39;, layer: &#39;L3Entity&#39;, classification: &#39;source&#39;, trust: &#39;sourced&#39;, sensitivity: &#39;intern… |
| resolved | const | 54 | no | const resolved = await adapters.resolveSources({ taskRef: &#39;T1&#39;, purpose: &#39;dev_task&#39; }); |
| a | const | 56 | no | const a = resolved.find(c =&gt; c.ref === ROADMAP); |
| read | const | 59 | no | const read = await adapters.readSource({ ref: a.ref, revision: a.revision }); |
| root | const | 64 | no | const root = fixture(t); |
| adapters | const | 65 | no | const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY }); |
| before | const | 66 | no | const before = await adapters.resolveSources({ taskRef: &#39;T1&#39;, purpose: &#39;dev_task&#39; }); |
| beforeA | const | 67 | no | const beforeA = before.find(c =&gt; c.ref === ROADMAP); |
| beforeB | const | 68 | no | const beforeB = before.find(c =&gt; c.ref === DECISIONS); |
| after | const | 71 | no | const after = await adapters.resolveSources({ taskRef: &#39;T1&#39;, purpose: &#39;dev_task&#39; }); |
| afterA | const | 72 | no | const afterA = after.find(c =&gt; c.ref === ROADMAP); |
| afterB | const | 73 | no | const afterB = after.find(c =&gt; c.ref === DECISIONS); |
| root | const | 84 | no | const root = fixture(t); |
| adapters | const | 85 | no | const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY }); |
| composer | const | 86 | no | const composer = createDCBComposer(adapters); |
| first | const | 87 | no | const first = await composer.compose(devInput()); |
| firstRefs | const | 88 | no | const firstRefs = first.manifest.sources.map(s =&gt; s.ref).sort(); |
| second | const | 94 | no | const second = await composer.compose(devInput()); |
| secondByRef | const | 95 | no | const secondByRef = new Map(second.manifest.sources.map(s =&gt; [s.ref, s])); |
| firstByRef | const | 96 | no | const firstByRef = new Map(first.manifest.sources.map(s =&gt; [s.ref, s])); |
| verified | const | 101 | no | const verified = await composer.verify(first, devInput()); |
| root | const | 107 | no | const root = fixture(t); |
| adapters | const | 108 | no | const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY, memoryStore: memoryStore() }); |
| memRef | const | 109 | no | const memRef = &#39;personal-agent/memory/CANON/k1&#39;; |
| noConsent | const | 111 | no | const noConsent = await adapters.resolveSources({ purpose: &#39;personal_continuum&#39;, principalRef: &#39;owner&#39;, projectRef: &#39;p1&#39; }); |
| denied | const | 114 | no | const denied = await adapters.resolveSources({ purpose: &#39;personal_continuum&#39;, principalRef: &#39;owner&#39;, projectRef: &#39;p1&#39;, consent: { approved: true, sourceRefs: [ROADMAP], destinationProvider: &#39;chatgpt&#39;… |
| granted | const | 120 | no | const granted = await adapters.resolveSources({ purpose: &#39;personal_continuum&#39;, principalRef: &#39;owner&#39;, projectRef: &#39;p1&#39;, consent: { approved: true, sourceRefs: [memRef], destinationProvider: &#39;chatgpt&#39;… |
| revoked | const | 126 | no | const revoked = await adapters.resolveSources({ purpose: &#39;personal_continuum&#39;, principalRef: &#39;owner&#39;, projectRef: &#39;p1&#39;, revokedSourceRefs: [ROADMAP], }); |
| root | const | 135 | no | const root = fixture(t); |
| adapters | const | 136 | no | const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY, memoryStore: memoryStore() }); |
| composer | const | 137 | no | const composer = createDCBComposer(adapters); |
| base | const | 138 | no | const base = { |
| blocked | const | 145 | no | const blocked = await composer.compose(base); |
| allowed | const | 150 | no | const allowed = await composer.compose({ ...base, disclosure: { approved: true, principalRef: &#39;owner&#39;, destinationProvider: &#39;chatgpt&#39;, sourceRefs: [&#39;personal-agent/memory/CANON/k1&#39;], } }); |
| root | const | 159 | no | const root = fixture(t); // fixture has no .git directory |
| adapters | const | 160 | no | const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY }); |
| resolved | const | 161 | no | const resolved = await adapters.resolveSources({ taskRef: &#39;T1&#39;, purpose: &#39;dev_task&#39;, sourceHead: &#39;deadbeef&#39; }); |
| read | const | 164 | no | const read = await adapters.readSource({ ref: resolved[0].ref, revision: resolved[0].revision }); |
| gitOk | variable | 169 | no | let gitOk = true; |
| root | const | 173 | no | const root = mkdtempSync(path.join(tmpdir(), &#39;dcb-sources-git-&#39;)); |
| git | function | 177 | no | const git = (...args) =&gt; execFileSync(&#39;git&#39;, [&#39;-c&#39;, &#39;user.email=test@example.com&#39;, &#39;-c&#39;, &#39;user.name=test&#39;, ...args], { cwd: root, encoding: &#39;utf8&#39;, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;ignore&#39;] }); |
| firstHead | const | 182 | no | const firstHead = git(&#39;rev-parse&#39;, &#39;HEAD&#39;).trim(); |
| adapters | const | 184 | no | const adapters = createDcbSourceAdapters({ repoRoot: root, sources: REGISTRY }); |
| first | const | 185 | no | const first = await adapters.resolveSources({ taskRef: &#39;T1&#39;, purpose: &#39;dev_task&#39; }); |
| secondHead | const | 189 | no | const secondHead = git(&#39;rev-parse&#39;, &#39;HEAD&#39;).trim(); |
| second | const | 191 | no | const second = await adapters.resolveSources({ taskRef: &#39;T1&#39;, purpose: &#39;dev_task&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs | import | 7 | external |
| node:os | import | 8 | external |
| node:path | import | 9 | external |
| node:crypto | import | 10 | external |
| node:child_process | import | 11 | external |
| ../../src/context/dcb-sources.mjs | import | 12 | [harness/src/context/dcb-sources.mjs](../../src/context/dcb-sources.mjs.md) |
| ../../src/context/dcb-composer.mjs | import | 13 | [harness/src/context/dcb-composer.mjs](../../src/context/dcb-composer.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 193 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
