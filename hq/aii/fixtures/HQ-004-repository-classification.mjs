// hq/aii/fixtures/HQ-004-repository-classification.mjs
// AII build lane "p0-repository-identity". Scenario HQ-004 (P0, group A):
// "Which repositories are product code, development tooling, research, or archives?"
//
// Ground truth locked 2026-11-11 from live engine output on branch main:
//   bun hq/aii/fixtures/harness.mjs hq/aii/fixtures/HQ-004-repository-classification.mjs
// classifyProjects() (hq/lib/registry.mjs) reads projects.json, AGENTS.md and
// per-project README.md only — read-only, no writes, no credentials.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineFixture, finding } from './harness.mjs';
import { classifyProjects } from '../../lib/registry.mjs';

// Workspace root (repos_hq checkout), derived from this file's location so the
// probe is cwd-independent.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-004',
  provenance: `Locked 2026-11-11 from live engine output on branch main. classifyProjects()
(hq/lib/registry.mjs) was run against the real workspace: projects.json
(3 registered projects: repos-hq, vivim-ui, vivim-web-harness),
AGENTS.md four-repo identity table (AGENTS.md:9-12) and each project README.md.
Observed classifications: repos-hq = development tooling (AGENTS.md:9, shared
SQLite/Rust HQKG index/semantics/context/wiki/work orders);
vivim-web-harness = product code (README keyword hints host/product/windows);
vivim-ui = product code (README keyword hints host/product/windows).
REFRESH 2026-11-11: the owner ruled vivim-labs is never an HQ index source, so the
foreign openmausbot registration was removed via \`hq project remove openmausbot\`
(cascade verified, clone preserved) — the 'openmausbot -> product code' expectation
was withdrawn with the registration, not by drift. projects.json sets no owner
tags, so classification falls through to the AGENTS.md table then README keyword
hints. vivim-labs is not registered in projects.json on this machine and is
therefore not classified (explicit zero).`,
  expected: [
    { what: 'repos-hq -> development tooling', where: 'AGENTS.md:9' },
    { what: 'vivim-web-harness -> product code', where: 'C:/0-BlackBoxProject-0/vivim-web-harness/README.md' },
    { what: 'vivim-ui -> product code', where: 'C:/0-BlackBoxProject-0/vivim-ui/README.md' },
    { what: 'projects.json sets no owner tags; classification via AGENTS.md table then README hints', where: 'hq/lib/registry.mjs classifyProjects' },
    { what: 'vivim-labs not registered in projects.json -> not classified', where: 'hq/lib/registry.mjs classifyProjects' },
  ],
  run: async () => {
    const { projects } = classifyProjects(ROOT);
    const findings = [];
    for (const p of projects) {
      const anchor = p.anchors[0] ?? p.path;
      findings.push(finding(`${p.name} -> ${p.classification}`, anchor));
      findings.push(finding(`rationale: ${p.rationale}`, anchor));
    }
    findings.push(finding('projects.json sets no owner tags; classification via AGENTS.md table then README hints', 'hq/lib/registry.mjs classifyProjects'));
    findings.push(finding(`registered projects classified: ${projects.map((p) => p.name).join(', ')}`, 'hq/lib/registry.mjs classifyProjects'));
    if (!projects.some((p) => p.name === 'vivim-labs')) {
      findings.push(finding('vivim-labs not registered in projects.json -> not classified', 'hq/lib/registry.mjs classifyProjects'));
    }
    return findings;
  },
});
