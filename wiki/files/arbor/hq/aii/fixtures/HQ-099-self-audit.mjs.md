# File: hq/aii/fixtures/HQ-099-self-audit.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-099-self-audit.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10046 B |
| Lines | 132 |
| Hash | 1b63f5892799 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 43 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| NONCOMPLIANT_AGENTS | const | 49 | no | const NONCOMPLIANT_AGENTS = [&#39;dcb-context-keeper.md&#39;, &#39;rust-core-keeper.md&#39;]; |
| findings | const | 66 | no | const findings = []; |
| agentsDir | const | 69 | no | const agentsDir = join(process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;, &#39;.zcode&#39;, &#39;agents&#39;); |
| files | const | 70 | no | const files = readdirSync(agentsDir) |
| audit | const | 73 | no | const audit = auditAgentCompliance(files); |
| gap | const | 75 | no | const gap = (audit.gaps ?? []).find((g) =&gt; g.file === name); |
| ctxGap | const | 79 | no | const ctxGap = (audit.gaps ?? []).find((g) =&gt; g.file === name &amp;&amp; g.gap.includes(&#39;context7&#39;)); |
| ctxGap | const | 83 | no | const ctxGap = (audit.gaps ?? []).find((g) =&gt; g.file === name &amp;&amp; g.gap.includes(&#39;context7&#39;)); |
| doctor | const | 89 | no | const doctor = runHq([&#39;zcode-doctor&#39;], { cwd: ROOT }); |
| verdict | const | 91 | no | const verdict = doctor.stdout.split(&#39;\\n&#39;)[0] ?? &#39;&#39;; |
| compliantMatch | const | 96 | no | const compliantMatch = verdict.match(/agents:(\\d+)\\/(\\d+) compliant/); |
| hooks | const | 100 | no | const hooks = runHq([&#39;hooks&#39;, &#39;status&#39;], { cwd: ROOT }); |
| hookRows | const | 102 | no | const hookRows = hooks.stdout.split(&#39;\\n&#39;).map((l) =&gt; l.trim()).filter(Boolean); |
| zeroHooks | const | 104 | no | const zeroHooks = hookRows.filter((l) =&gt; /\\s0\\/3 hooks$/.test(l)); |
| doctorJson | const | 111 | no | const doctorJson = runHq([&#39;doctor&#39;, &#39;--json&#39;], { cwd: ROOT }); |
| parsed | const | 117 | no | const parsed = JSON.parse(doctorJson.stdout); |
| watcher | const | 118 | no | const watcher = parsed.automation?.watcher; |
| watcherText | const | 120 | no | const watcherText = watcher.running &amp;&amp; watcher.pid ? `running (pid ${watcher.pid})` : &#39;not running&#39;; |
| comms | const | 123 | no | const comms = runHq([&#39;comms&#39;, &#39;--strict&#39;], { cwd: ROOT }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 36 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/zcode-doctor.mjs | import | 37 | [hq/lib/zcode-doctor.mjs](../../lib/zcode-doctor.mjs.md) |
| node:fs | import | 38 | external |
| node:os | import | 39 | external |
| node:path | import | 40 | external |
| node:url | import | 41 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 133 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
