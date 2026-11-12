// hq/aii/fixtures/HQ-111-register-new-repo-class.mjs
// AII scenario HQ-111 (group N): "I should be able to point HQ to a new repo while my project is already in HQ, and have it register it as a distinct class of source."
// Engine: hq/lib/registry.mjs registerProject (registry.mjs:114-131) + classifyProjects
// (:183) — registration is live while projects exist, and the owner tag makes the class.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - registerProject appends {name, path, tags, addedAt} to projects.json and sorts by name
//     (registry.mjs:126-129); it refuses a nonexistent path (registry.mjs:117) and merges
//     tags on re-registration (registry.mjs:118-124).
//   - classifyProjects honors owner tags first (product/tooling/research/archives →
//     registry.mjs:214-217) — an explicitly tagged repo is a DISTINCT class of source.
//   - The registration is exercised on a throwaway temp workspace (os.tmpdir mkdtemp;
//     the repo's own projects.json is never touched).

import { defineFixture, finding } from './harness.mjs';
import { registerProject, loadProjects, classifyProjects } from '../../lib/registry.mjs';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineFixture({
  id: 'HQ-111',
  provenance:
    "2026-11-11 (this session): locked from hq/lib/registry.mjs exercised on a throwaway temp workspace (os.tmpdir " +
    'mkdtemp, cleaned up in finally; the repo projects.json is never touched). registerProject (registry.mjs:114-131) ' +
    'appends the new repo to projects.json while existing projects stay, refuses nonexistent paths (registry.mjs:117) and ' +
    "sorts by name (registry.mjs:128); classifyProjects (registry.mjs:183, owner tags at :214-217) classifies the new " +
    "registration as a distinct class ('research') beside an existing 'tooling' project. Verified live on the real " +
    "workspace this session: classifyProjects('.') classifies repos-hq as 'development tooling' via the AGENTS.md table.",
  expected: [
    { what: 'a new repo registers alongside the existing project without disturbing it', where: 'hq/lib/registry.mjs registerProject' },
    { what: 'registration is a distinct class of source: owner tag research classifies the new repo, the existing one stays tooling', where: 'hq/lib/registry.mjs classifyProjects' },
    { what: 'a nonexistent path is refused at registration (registry.mjs:117)', where: 'hq/lib/registry.mjs registerProject' },
    { what: 're-registration merges tags instead of duplicating (registry.mjs:118-124)', where: 'hq/lib/registry.mjs registerProject' },
  ],
  run: async () => {
    const findings = [];
    const tmp = mkdtempSync(join(tmpdir(), 'hq-111-'));
    try {
      // Existing project already in HQ.
      const existingDir = join(tmp, 'existing-repo');
      mkdirSync(existingDir, { recursive: true });
      writeFileSync(join(existingDir, 'README.md'), '# existing\n');
      // The new repo the owner points HQ at.
      const newDir = join(tmp, 'harvested-external-repo');
      mkdirSync(newDir, { recursive: true });
      writeFileSync(join(newDir, 'README.md'), '# harvested candidate\n');

      const first = registerProject(tmp, { name: 'existing-repo', path: existingDir, tags: ['tooling'] });
      const second = registerProject(tmp, { name: 'harvested-external-repo', path: newDir, tags: ['research'] });
      const loaded = loadProjects(tmp);
      if (loaded.projects.length !== 2) throw new Error(`expected 2 projects, got ${loaded.projects.length}`);
      if (!loaded.projects.some((p) => p.name === 'existing-repo') || !loaded.projects.some((p) => p.name === 'harvested-external-repo')) {
        throw new Error(`projects missing: ${loaded.projects.map((p) => p.name).join(', ')}`);
      }
      if (!second.tags.includes('research')) throw new Error(`tag missing: ${JSON.stringify(second)}`);
      findings.push(finding('a new repo registers alongside the existing project without disturbing it', 'hq/lib/registry.mjs registerProject'));

      // Refused registration for a nonexistent path.
      let refused = false;
      try { registerProject(tmp, { name: 'ghost', path: join(tmp, 'does-not-exist') }); } catch { refused = true; }
      if (!refused) throw new Error('nonexistent path was accepted');
      findings.push(finding('a nonexistent path is refused at registration (registry.mjs:117)', 'hq/lib/registry.mjs registerProject'));

      // Distinct classes.
      const classified = classifyProjects(tmp, { agiTable: [] });
      const classes = Object.fromEntries(classified.projects.map((p) => [p.name, p.classification]));
      if (classes['harvested-external-repo'] !== 'research' || classes['existing-repo'] !== 'development tooling') {
        throw new Error(`classes wrong: ${JSON.stringify(classes)}`);
      }
      findings.push(finding('registration is a distinct class of source: owner tag research classifies the new repo, the existing one stays tooling', 'hq/lib/registry.mjs classifyProjects'));

      // Tag merge on re-registration.
      const re = registerProject(tmp, { name: 'harvested-external-repo', path: newDir, tags: ['research'] });
      if (re.tags.filter((t) => t === 'research').length !== 1) {
        throw new Error(`tags duplicated: ${JSON.stringify(re.tags)}`);
      }
      findings.push(finding('re-registration merges tags instead of duplicating (registry.mjs:118-124)', 'hq/lib/registry.mjs registerProject'));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
    return findings;
  },
});
