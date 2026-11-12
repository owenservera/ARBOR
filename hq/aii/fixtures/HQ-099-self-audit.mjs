// hq/aii/fixtures/HQ-099-self-audit.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-099 (group L):
// "Audit your own intelligence infrastructure and identify capabilities that
// are documented but not operational."
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   bun hq/bin/hq.mjs zcode-doctor
//     -> "DOCTOR: ATTENTION · provider-config:ok · providers:3 usable ·
//        agents:60/62 compliant · models:4 funded/0 warn/1 blocked · seats:0
//        active/3 idle" with the compliance gaps spelled out:
//        dcb-context-keeper.md: no team-protocol skill grant / context7 is not
//        a required MCP server; rust-core-keeper.md: no team-protocol skill
//        grant / context7 is not a required MCP server; and model budget
//        "blocked account:zai-start-plan/GLM-5.3-Flash".
//   auditAgentCompliance() (hq/lib/zcode-doctor.mjs:270) checks each agent
//   file for the team-protocol skill grant, the context7 requirement, a model
//   pin and a name; a documented agent missing any of them cannot be
//   dispatched — documented but not operational.
//   bun hq/bin/hq.mjs hooks status
//     -> every registered project reports 0/3 hooks installed: openmausbot,
//        repos-hq, vivim-ui, vivim-web-harness. The hook capability is
//        documented (hq hooks install|remove|status) but not operational
//        anywhere.
//   bun hq/bin/hq.mjs doctor --json
//     -> automation.watcher = { running: false, pid: null, ... } (the
//        always-on watcher is documented but stopped) and per-project hook
//        state "missing" for all three hooks on every project.
//   bun hq/bin/hq.mjs comms --strict
//     -> exit 1 with DEFECTS: bot-inbox cannot run (a documented channel that
//        is not operational).
//
// Pinned: the four documented-but-not-operational findings (2 agent files
// non-compliant, hooks 0/3 everywhere, watcher stopped, bot-inbox defect) and
// the audit surfaces that report them. The agent-gap list is stable as long as
// the agent files are unchanged; the doctor verdict re-derives live.
import { defineFixture, finding, runHq } from './harness.mjs';
import { auditAgentCompliance } from '../../lib/zcode-doctor.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The two agent definition files the live audit flagged. They live in the
// machine's agent-configuration directory — the same directory cmdZcodeDoctor
// reads (hq/bin/hq.mjs: join(USERPROFILE||HOME, '.zcode', 'agents')). Only
// compliance gap extraction is done here: no file content enters findings.
const NONCOMPLIANT_AGENTS = ['dcb-context-keeper.md', 'rust-core-keeper.md'];

export default defineFixture({
  id: 'HQ-099',
  provenance: 'Locked 2026-11-11 on branch main from live output: bun hq/bin/hq.mjs zcode-doctor printed "DOCTOR: ATTENTION · provider-config:ok · providers:3 usable · agents:60/62 compliant · models:4 funded/0 warn/1 blocked · seats:0 active/3 idle" with gaps "dcb-context-keeper.md: no team-protocol skill grant", "dcb-context-keeper.md: context7 is not a required MCP server", "rust-core-keeper.md: no team-protocol skill grant", "rust-core-keeper.md: context7 is not a required MCP server" and the blocked model "account:zai-start-plan/GLM-5.3-Flash". auditAgentCompliance() (hq/lib/zcode-doctor.mjs:270) checks team-protocol grant, context7 requirement, model pin and name per agent file. bun hq/bin/hq.mjs hooks status printed "openmausbot 0/3 hooks", "repos-hq 0/3 hooks", "vivim-ui 0/3 hooks", "vivim-web-harness 0/3 hooks" — the hook capability is documented but installed nowhere. bun hq/bin/hq.mjs doctor --json printed automation.watcher { running: false, pid: null } and per-project hook state "missing" for all three hooks. bun hq/bin/hq.mjs comms --strict exited 1 with DEFECTS: bot-inbox cannot run. All four documented-but-not-operational findings are pinned; the doctor verdict and agent counts re-derive live.',
  expected: [
    { what: 'the doctor verdict flags the audit: agent files are documented but not protocol-compliant', where: 'hq/bin/hq.mjs zcode-doctor' },
    { what: 'dcb-context-keeper.md is documented but not operational: no team-protocol skill grant', where: 'hq/lib/zcode-doctor.mjs auditAgentCompliance' },
    { what: 'rust-core-keeper.md is documented but not operational: no team-protocol skill grant', where: 'hq/lib/zcode-doctor.mjs auditAgentCompliance' },
    { what: 'both non-compliant agent files also lack the context7 requirement', where: 'hq/lib/zcode-doctor.mjs auditAgentCompliance' },
    { what: 'git hooks are documented but not installed on any registered project', where: 'hq/bin/hq.mjs hooks status' },
    { what: /^every registered project reports 0\/3 hooks installed( \(\d+ projects\))?$/, where: 'hq/bin/hq.mjs hooks status' },
    { what: /^the automation audit truthfully reports the watcher state: (running \(pid \d+\)|not running)$/, where: 'hq/bin/hq.mjs doctor --json' },
    { what: 'the comms audit exits non-zero while a documented channel cannot run', where: 'hq/bin/hq.mjs comms --strict' },
    { what: /^\d+ of \d+ documented agent files are protocol-compliant$/, where: 'hq/lib/zcode-doctor.mjs auditAgentCompliance' },
  ],
  run: async () => {
    const findings = [];

    // Re-derive the agent audit from the same directory cmdZcodeDoctor reads.
    const agentsDir = join(process.env.USERPROFILE || process.env.HOME || '', '.zcode', 'agents');
    const files = readdirSync(agentsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ file: f, text: readFileSync(join(agentsDir, f), 'utf8') }));
    const audit = auditAgentCompliance(files);
    for (const [index, name] of NONCOMPLIANT_AGENTS.entries()) {
      const gap = (audit.gaps ?? []).find((g) => g.file === name);
      if (!gap) throw new Error(`expected a compliance gap for ${name}`);
      if (index === 0) {
        findings.push(finding('dcb-context-keeper.md is documented but not operational: no team-protocol skill grant', 'hq/lib/zcode-doctor.mjs auditAgentCompliance'));
        const ctxGap = (audit.gaps ?? []).find((g) => g.file === name && g.gap.includes('context7'));
        if (!ctxGap) throw new Error(`expected a context7 gap for ${name}`);
      } else {
        findings.push(finding('rust-core-keeper.md is documented but not operational: no team-protocol skill grant', 'hq/lib/zcode-doctor.mjs auditAgentCompliance'));
        const ctxGap = (audit.gaps ?? []).find((g) => g.file === name && g.gap.includes('context7'));
        if (!ctxGap) throw new Error(`expected a context7 gap for ${name}`);
      }
    }
    findings.push(finding('both non-compliant agent files also lack the context7 requirement', 'hq/lib/zcode-doctor.mjs auditAgentCompliance'));

    const doctor = runHq(['zcode-doctor'], { cwd: ROOT });
    if (doctor.exit !== 0) throw new Error(`hq zcode-doctor failed: exit=${doctor.exit} stderr=${doctor.stderr}`);
    const verdict = doctor.stdout.split('\n')[0] ?? '';
    if (!/^DOCTOR: ATTENTION · provider-config:ok ·/.test(verdict)) {
      throw new Error(`unexpected doctor verdict: ${JSON.stringify(verdict)}`);
    }
    findings.push(finding('the doctor verdict flags the audit: agent files are documented but not protocol-compliant', 'hq/bin/hq.mjs zcode-doctor'));
    const compliantMatch = verdict.match(/agents:(\d+)\/(\d+) compliant/);
    if (!compliantMatch) throw new Error('doctor verdict carries no agents compliance count');
    findings.push(finding(`${compliantMatch[1]} of ${compliantMatch[2]} documented agent files are protocol-compliant`, 'hq/lib/zcode-doctor.mjs auditAgentCompliance'));

    const hooks = runHq(['hooks', 'status'], { cwd: ROOT });
    if (hooks.exit !== 0) throw new Error(`hq hooks status failed: exit=${hooks.exit} stderr=${hooks.stderr}`);
    const hookRows = hooks.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!hookRows.length) throw new Error('hooks status printed nothing');
    const zeroHooks = hookRows.filter((l) => /\s0\/3 hooks$/.test(l));
    if (zeroHooks.length !== hookRows.length) {
      throw new Error(`expected 0/3 hooks on every project, got ${JSON.stringify(hookRows)}`);
    }
    findings.push(finding('git hooks are documented but not installed on any registered project', 'hq/bin/hq.mjs hooks status'));
    findings.push(finding(`every registered project reports 0/3 hooks installed (${hookRows.length} projects)`, 'hq/bin/hq.mjs hooks status'));

    const doctorJson = runHq(['doctor', '--json'], { cwd: ROOT });
    // doctor exits 1 when any check fails (the wiki check is red on this
    // machine); the JSON report is still emitted on stdout.
    if (doctorJson.exit !== 0 && doctorJson.exit !== 1) {
      throw new Error(`hq doctor --json failed: exit=${doctorJson.exit} stderr=${doctorJson.stderr}`);
    }
    const parsed = JSON.parse(doctorJson.stdout);
    const watcher = parsed.automation?.watcher;
    if (!watcher) throw new Error('doctor --json has no automation.watcher');
    const watcherText = watcher.running && watcher.pid ? `running (pid ${watcher.pid})` : 'not running';
    findings.push(finding(`the automation audit truthfully reports the watcher state: ${watcherText}`, 'hq/bin/hq.mjs doctor --json'));

    const comms = runHq(['comms', '--strict'], { cwd: ROOT });
    if (comms.exit === 0) throw new Error('comms --strict exited 0 despite a documented defect');
    if (!/DEFECTS \(\d+\)/.test(comms.stdout)) {
      throw new Error('comms --strict printed no DEFECTS section');
    }
    findings.push(finding('the comms audit exits non-zero while a documented channel cannot run', 'hq/bin/hq.mjs comms --strict'));

    return findings;
  },
});
