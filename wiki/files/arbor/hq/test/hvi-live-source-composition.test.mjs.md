# File: hq/test/hvi-live-source-composition.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/hvi-live-source-composition.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9637 B |
| Lines | 204 |
| Hash | 0f5acc4e2f00 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 17 | no | const root = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| gitDir | const | 18 | no | const gitDir = join(root, &#39;.git&#39;); |
| hasObjectStore | const | 19 | no | const hasObjectStore = existsSync(join(gitDir, &#39;HEAD&#39;)) &amp;&amp; existsSync(join(gitDir, &#39;objects&#39;)); |
| registeredRepoIdentity | function | 21 | no | function registeredRepoIdentity() { |
| config | const | 23 | no | const config = readFileSync(join(gitDir, &#39;config&#39;), &#39;utf8&#39;); |
| url | const | 24 | no | const url = /\\[remote &quot;origin&quot;\\]\\s*\\r?\\n\\s*url\\s*=\\s*(\\S+)/.exec(config)?.[1]; |
| realSelection | function | 32 | no | async function realSelection() { |
| repo | const | 34 | no | const repo = registeredRepoIdentity(); |
| adapter | const | 35 | no | const adapter = createGitObjectStoreAdapter({ gitDir }); |
| headRef | const | 36 | no | const headRef = readFileSync(join(gitDir, &#39;HEAD&#39;), &#39;utf8&#39;).trim(); |
| refName | const | 37 | no | const refName = headRef.startsWith(&#39;ref: &#39;) ? headRef.slice(5).trim() : &#39;HEAD&#39;; |
| head | const | 38 | no | const head = await adapter.resolveRef({ ref: refName }); |
| commit | const | 40 | no | const commit = await adapter.readCommit({ commitSha: head.commitSha }); |
| parent | const | 41 | no | const parent = commit?.parents?.[0] ?? null; |
| parentCommit | const | 43 | no | const parentCommit = await adapter.readCommit({ commitSha: parent }); |
| REAL | const | 48 | no | const REAL = await realSelection(); |
| skip | const | 49 | no | const skip = &#39;no local Git object database with a parent commit&#39;; |
| selection | function | 51 | no | const selection = (overrides = {}) =&gt; ({ schema: HVI_SOURCE_SELECTION_SCHEMA, sources: [ { repo: REAL?.repo ?? &#39;owenservera/ARBOR&#39;, ref: REAL?.refName ?? &#39;main&#39; }, { repo: REAL?.repo ?? &#39;owenservera/… |
| countingGrant | function | 60 | no | const countingGrant = (denyAfter = Infinity) =&gt; { |
| calls | const | 61 | no | const calls = []; |
| result | const | 71 | no | const result = await runHviSelectedSources(selection(), { adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize, }); |
| pins | const | 80 | no | const pins = result.comparison.sourcePins; |
| acquired | const | 115 | no | const acquired = await acquirePinnedSnapshot({ repo: REAL.repo, ref: REAL.refName }, { adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize, }); |
| reads | variable | 129 | no | let reads = 0; |
| counted | const | 130 | no | const counted = { ...REAL.adapter, resolveRef: async input =&gt; { |
| calls | variable | 162 | no | let calls = 0; |
| moving | const | 163 | no | const moving = { ...REAL.adapter, resolveRef: async () =&gt; ({ commitSha: ++calls === 1 ? REAL.headSha : REAL.parentSha, }) }; |
| options | const | 191 | no | const options = { adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |
| node:url | import | 9 | external |
| ../version-intelligence/sources/adapters.mjs | import | 10 | [hq/version-intelligence/sources/adapters.mjs](../version-intelligence/sources/adapters.mjs.md) |
| ../version-intelligence/sources/snapshots.mjs | import | 11 | [hq/version-intelligence/sources/snapshots.mjs](../version-intelligence/sources/snapshots.mjs.md) |
| ../version-intelligence/sources/common.mjs | import | 12 | [hq/version-intelligence/sources/common.mjs](../version-intelligence/sources/common.mjs.md) |
| ../version-intelligence/integration/index.mjs | import | 13 | [hq/version-intelligence/integration/index.mjs](../version-intelligence/integration/index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
import { acquirePinnedSnapshot, manifestDigestOf } from '../version-intelligence/sources/snapshots.mjs';
import { canonicalRepo, digest as sourceDigest } from '../version-intelligence/sources/common.mjs';
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
  const result = await runHviSelectedSources(selection(), {
    adapter: REAL.adapter, approvedRepositories: [REAL.repo], authorize,
  });

  assert.equal(result.schema, HVI_TOOL_RESULT_SCHEMA);
  assert.equal(result.runtimeAccepted, false);
  assert.equal(result.hostBound, false);
  assert.ok(calls.length > 10, 'the live grant is re-evaluated on every source read');

  const pins = result.comparison.sourcePins;
```

_First 80 of 204 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
