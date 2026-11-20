# File: hq/aii/fixtures/HQ-003-same-repo-not-duplicated.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-003-same-repo-not-duplicated.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5107 B |
| Lines | 86 |
| Hash | 97f7ae37f4ee |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 23 | no | const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| PARENT | const | 24 | no | const PARENT = dirname(ROOT); |
| IDENTITIES | const | 26 | no | const IDENTITIES = [ |
| findings | const | 55 | no | const findings = []; |
| enriched | const | 56 | no | const enriched = IDENTITIES.map((id) =&gt; { const st = gitState({ cwd: id.path }); const remote = st.ok ? st.remote : null; const head = st.ok ? st.head : null; const root = st.ok ? st.repo : null; |
| st | const | 57 | no | const st = gitState({ cwd: id.path }); |
| remote | const | 58 | no | const remote = st.ok ? st.remote : null; |
| head | const | 59 | no | const head = st.ok ? st.head : null; |
| root | const | 60 | no | const root = st.ok ? st.repo : null; |
| dups | const | 66 | no | const dups = detectRepositoryDuplicates(enriched); |
| normKeys | const | 67 | no | const normKeys = new Set(); |
| k | const | 69 | no | const k = id.remote != null ? normalizeRemoteUrl(id.remote) : null; |
| scp | const | 76 | no | const scp = normalizeRemoteUrl(&#39;github.com:owenservera/repos-hq&#39;); |
| https | const | 77 | no | const https = normalizeRemoteUrl(&#39;https://github.com/owenservera/repos-hq.git&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 10 | external |
| node:url | import | 11 | external |
| ./harness.mjs | import | 12 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/git-context.mjs | import | 13 | [hq/lib/git-context.mjs](../../lib/git-context.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-003-same-repo-not-duplicated.mjs
// AII build lane "p0-repository-identity". Scenario HQ-003 (P0, group A):
// "Are we accidentally treating the same repository as two different projects?"
//
// Ground truth locked 2026-11-11 from live engine output on branch main:
//   bun hq/aii/fixtures/harness.mjs hq/aii/fixtures/HQ-003-same-repo-not-duplicated.mjs
// Remotes/heads read live from each checkout via gitState() (git remote get-url +
// git rev-parse HEAD, local-only); duplicates detected via detectRepositoryDuplicates()
// (hq/lib/git-context.mjs). Read-only probe; no network.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineFixture, finding } from './harness.mjs';
import {
  detectRepositoryDuplicates,
  normalizeRemoteUrl,
  gitState,
} from '../../lib/git-context.mjs';

// Workspace root (repos_hq checkout), derived from this file's location so the
// probe is cwd-independent. The AGENTS.md:9-12 four-repo table maps repos-hq to
// local dir `repos_hq` — which IS this checkout — and the other three identities
// to sibling directories of it.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PARENT = dirname(ROOT);

const IDENTITIES = [
  { name: 'repos-hq', label: 'repos_hq', path: ROOT },
  { name: 'vivim-web-harness', label: 'vivim-web-harness', path: join(PARENT, 'vivim-web-harness') },
  { name: 'vivim-ui', label: 'vivim-ui', path: join(PARENT, 'vivim-ui') },
  { name: 'vivim-labs', label: 'vivim-labs', path: join(PARENT, 'vivim-labs') },
];

export default defineFixture({
  id: 'HQ-003',
  provenance: `Locked 2026-11-11 from live engine output on branch main. Each AGENTS.md
four-repo identity (AGENTS.md:9-12) was probed with gitState() (git remote
get-url + git rev-parse HEAD) at its local checkout, then run through
detectRepositoryDuplicates() (hq/lib/git-context.mjs). Observed: four distinct
normalized remotes (owenservera/repos-hq, owenservera/vivim-web-harness,
owenservera/tierflow, owenservera/vivim-labs), four distinct realpath checkouts,
0 duplicate pairs. vivim-ui is the local alias for GitHub tierflow (one identity,
not two). Heads are ancillary evidence; the duplicate determination depends on
remote URL + realpath only, both stable on main.`,
  expected: [
    { what: 'repos-hq remote: https://github.com/owenservera/repos-hq.git', where: 'repos_hq' },
    { what: 'vivim-web-harness remote: https://github.com/owenservera/vivim-web-harness.git', where: 'vivim-web-harness' },
    { what: 'vivim-ui remote: https://github.com/owenservera/tierflow.git', where: 'vivim-ui' },
    { what: 'vivim-labs remote: https://github.com/owenservera/vivim-labs.git', where: 'vivim-labs' },
    { what: 'distinct normalized remotes: 4', where: 'hq/lib/git-context.mjs detectRepositoryDuplicates' },
    { what: 'distinct realpath checkouts: 4', where: 'hq/lib/git-context.mjs detectRepositoryDuplicates' },
    { what: 'duplicate pairs: 0 (no same repository treated as two projects)', where: 'hq/lib/git-context.mjs detectRepositoryDuplicates' },
    { what: 'normalizeRemoteUrl scp == https equivalence: true', where: 'hq/lib/git-context.mjs normalizeRemoteUrl' },
  ],
  run: async () => {
    const findings = [];
    const enriched = IDENTITIES.map((id) => {
      const st = gitState({ cwd: id.path });
      const remote = st.ok ? st.remote : null;
      const head = st.ok ? st.head : null;
      const root = st.ok ? st.repo : null;
      findings.push(finding(`${id.name} remote: ${remote ?? '(none)'}`, id.label));
      if (head) findings.push(finding(`${id.name} head: ${head}`, id.label));
      return { ...id, remote, head, resolvedRoot: root };
    });

    const dups = detectRepositoryDuplicates(enriched);
    const normKeys = new Set();
    for (const id of enriched) {
      const k = id.remote != null ? normalizeRemoteUrl(id.remote) : null;
      if (k) normKeys.add(k);
    }
    findings.push(finding(`distinct normalized remotes: ${normKeys.size}`, 'hq/lib/git-context.mjs detectRepositoryDuplicates'));
    findings.push(finding(`distinct realpath checkouts: ${new Set(enriched.map((i) => i.resolvedRoot).filter(Boolean)).size}`, 'hq/lib/git-context.mjs detectRepositoryDuplicates'));
    findings.push(finding(`duplicate pairs: ${dups.pairs.length} (no same repository treated as two projects)`, 'hq/lib/git-context.mjs detectRepositoryDuplicates'));

    const scp = normalizeRemoteUrl('github.com:owenservera/repos-hq');
    const https = normalizeRemoteUrl('https://github.com/owenservera/repos-hq.git');
    findings.push(finding(`normalizeRemoteUrl scp == https equivalence: ${scp === https && scp === 'https://github.com/owenservera/repos-hq'}`, 'hq/lib/git-context.mjs normalizeRemoteUrl'));

    for (const p of dups.pairs) {
```

_First 80 of 87 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
