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
      findings.push(finding(`duplicate pair: ${p.a.name} <-> ${p.b.name} via ${p.kind} (${p.key})`, 'hq/lib/git-context.mjs detectRepositoryDuplicates'));
    }

    return findings;
  },
});
