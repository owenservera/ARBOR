# File: hq/aii/fixtures/HQ-068-custom-hooks.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-068-custom-hooks.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5822 B |
| Lines | 73 |
| Hash | 6aa2702d5b92 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| findings | const | 32 | no | const findings = []; |
| status | const | 34 | no | const status = runHq([&#39;hooks&#39;, &#39;status&#39;, &#39;--json&#39;]); |
| j | const | 36 | no | const j = JSON.parse(status.stdout); |
| hookNames | const | 43 | no | const hookNames = new Set(); |
| names | const | 53 | no | const names = [...hookNames].sort(); |
| fs | const | 56 | no | const fs = await import(&#39;node:fs&#39;); |
| automation | const | 57 | no | const automation = fs.readFileSync(&#39;hq/lib/automation.mjs&#39;, &#39;utf8&#39;); |
| declared | const | 58 | no | const declared = /const HOOK_NAMES = \\[([^\\]]+)\\]/.exec(automation); |
| declaredNames | const | 60 | no | const declaredNames = [...declared[1].matchAll(/&#39;([^&#39;]+)&#39;/g)].map((m) =&gt; m[1]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 17 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| node:fs | dynamic | 56 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-068-custom-hooks.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-068 (group H): "Which custom hooks execute automatically, and what triggers them?"
// Ground truth locked from live outputs 2026-11-11:
//   bun hq/bin/hq.mjs hooks status --json
//     -> {"schema":"hq.hooks-status/1","spaces":[{project,path,git,installed,missing,foreign,
//        hooks:[{hook,path,state}]}]} (cmdHooks hq/bin/hq.mjs:3607-3620 ->
//        hq/lib/automation.mjs statusHooks).
//        At lock time 4 spaces (openmausbot, repos-hq, vivim-ui, vivim-web-harness), every space
//        git=true, installed=0, missing=3, and the three hooks are post-commit, post-merge and
//        post-checkout (hq/lib/automation.mjs:15 HOOK_NAMES), each in state "missing".
//   The TRIGGERS are named by the hook itself and by the action the hook runs:
//     hq/lib/automation.mjs:450 writes a hook body that runs "hq refresh" for that space, with
//     output landing in .hq/hooks.log (hq/lib/automation.mjs:444, hq/bin/hq.mjs:376 help text
//     "Git hooks per space (run hq refresh; output in .hq/hooks.log)").
// The installed/missing counts drift if hooks are installed, so they are re-derived live and
// pinned by shape; the hook NAMES and the trigger wiring are the stable ground truth.
import { defineFixture, finding, runHq } from './harness.mjs';

export default defineFixture({
  id: 'HQ-068',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs hooks status --json (schema hq.hooks-status/1, 4 spaces openmausbot/repos-hq/vivim-ui/vivim-web-harness, each git=true with installed=0 and missing=3, and hooks post-commit/post-merge/post-checkout all in state missing) and direct reading of hq/lib/automation.mjs:15 (HOOK_NAMES) and hq/lib/automation.mjs:444-450 (hook body runs hq refresh, output to .hq/hooks.log). Re-derived at run time by re-running the command and re-reading automation.mjs.',
  expected: [
    { what: 'schema hq.hooks-status/1', where: 'hq/bin/hq.mjs cmdHooks' },
    { what: /^\d+ spaces report hook status$/, where: 'hq/lib/automation.mjs statusHooks' },
    { what: 'hooks are named post-commit, post-merge and post-checkout', where: 'hq/lib/automation.mjs:15 HOOK_NAMES' },
    { what: 'each hook reports its own state and path under the space .git/hooks', where: 'hq/lib/automation.mjs statusHooks' },
    { what: /^space \S+ reports \d+ of 3 hooks installed$/, where: 'hq/bin/hq.mjs hooks status' },
    { what: 'hooks run hq refresh for their space after a git event', where: 'hq/lib/automation.mjs:450 hook body' },
    { what: 'hook output is written to .hq/hooks.log', where: 'hq/lib/automation.mjs:444 hook body' },
  ],
  run: async () => {
    const findings = [];

    const status = runHq(['hooks', 'status', '--json']);
    if (status.exit !== 0) throw new Error(`hq hooks status failed: exit=${status.exit} stderr=${status.stderr}`);
    const j = JSON.parse(status.stdout);
    if (j.schema !== 'hq.hooks-status/1') throw new Error(`unexpected hooks status schema: ${j.schema}`);
    findings.push(finding('schema hq.hooks-status/1', 'hq/bin/hq.mjs cmdHooks'));
    if (!Array.isArray(j.spaces)) throw new Error('hq hooks status --json has no spaces array');
    findings.push(finding(`${j.spaces.length} spaces report hook status`, 'hq/lib/automation.mjs statusHooks'));

    // The three hook names, and their per-space state/path.
    const hookNames = new Set();
    for (const space of j.spaces) {
      if (!Array.isArray(space.hooks)) throw new Error(`space ${space.project} has no hooks array`);
      for (const h of space.hooks) {
        hookNames.add(h.hook);
        if (typeof h.state !== 'string' || typeof h.path !== 'string') throw new Error('a hook lacks state/path');
        if (!h.path.includes('.git\\hooks') && !h.path.includes('.git/hooks')) throw new Error(`hook path is not under .git/hooks: ${h.path}`);
      }
      findings.push(finding(`space ${space.project} reports ${space.installed} of ${space.hooks.length} hooks installed`, 'hq/bin/hq.mjs hooks status'));
    }
    const names = [...hookNames].sort();
    if (names.join(',') !== 'post-checkout,post-commit,post-merge') throw new Error(`unexpected hook names: ${names.join(',')}`);
    // The canonical declared order comes from HOOK_NAMES in hq/lib/automation.mjs:15.
    const fs = await import('node:fs');
    const automation = fs.readFileSync('hq/lib/automation.mjs', 'utf8');
    const declared = /const HOOK_NAMES = \[([^\]]+)\]/.exec(automation);
    if (!declared) throw new Error('automation.mjs has no HOOK_NAMES declaration');
    const declaredNames = [...declared[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    if ([...declaredNames].sort().join(',') !== names.join(',')) throw new Error(`observed hook names differ from declared: ${names.join(',')} vs ${declaredNames.join(',')}`);
    findings.push(finding(`hooks are named ${declaredNames.join(', ').replace(/, ([^,]*)$/, ' and $1')}`, 'hq/lib/automation.mjs:15 HOOK_NAMES'));
    findings.push(finding('each hook reports its own state and path under the space .git/hooks', 'hq/lib/automation.mjs statusHooks'));

    // The trigger: the hook body runs hq refresh and logs to .hq/hooks.log.
    if (!automation.includes('hq refresh')) throw new Error('automation.mjs hook body does not run hq refresh');
    findings.push(finding('hooks run hq refresh for their space after a git event', 'hq/lib/automation.mjs:450 hook body'));
    if (!automation.includes('hooks.log')) throw new Error('automation.mjs hook body does not log to hooks.log');
    findings.push(finding('hook output is written to .hq/hooks.log', 'hq/lib/automation.mjs:444 hook body'));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
