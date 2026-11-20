# File: harness/src/dev/cli.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/dev/cli.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5983 B |
| Lines | 89 |
| Hash | 0f2c2a59f75c |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| repoRoot | const | 13 | no | const repoRoot = fileURLToPath(new URL(&#39;../../../&#39;, import.meta.url)); |
| val | function | 14 | no | const val = (args, name) =&gt; { const i = args.indexOf(name); return i &lt; 0 ? undefined : args[i + 1]; }; |
| json | function | 15 | no | const json = (o, out) =&gt; out(JSON.stringify(o, null, 2)); |
| fail | function | 16 | no | const fail = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| validateArgs | function | 17 | no | function validateArgs(args, flags) { |
| x | const | 19 | no | const x = args[i]; if (!flags.includes(x)) throw fail(&#39;DEV_USAGE&#39;, `Unsupported option: ${x}`); |
| workspaceCommand | function | 23 | yes | export async function workspaceCommand(args, { root = repoRoot, out = console.log } = {}) { |
| ws | const | 26 | no | const ws = createWorkspace({ root }); |
| devCommand | function | 40 | yes | export async function devCommand(args, { root = repoRoot, router, approvals, out = console.log } = {}) { |
| store | const | 42 | no | const store = createJobStore({ directory: resolve(root, &#39;runtime&#39;, &#39;dev&#39;) }); |
| task | const | 45 | no | const task = args.filter((a, i) =&gt; !a.startsWith(&#39;--&#39;) &amp;&amp; ![&#39;--provider&#39;,&#39;--workspace&#39;,&#39;--max-turns&#39;,&#39;--status&#39;,&#39;--create-workspace&#39;].includes(args[i - 1])).join(&#39; &#39;).trim(); |
| apply | const | 47 | no | const apply = args.includes(&#39;--apply&#39;); |
| workRoot | const | 48 | no | const workRoot = val(args, &#39;--workspace&#39;) ? resolve(val(args, &#39;--workspace&#39;)) : root; |
| createWorkspaceFlag | const | 52 | no | const createWorkspaceFlag = args.includes(&#39;--create-workspace&#39;); |
| wt | const | 55 | no | const wt = spawnSync(&#39;git&#39;, [&#39;worktree&#39;, &#39;add&#39;, workRoot], { cwd: root, encoding: &#39;utf8&#39;, timeout: 30000 }); |
| head | const | 59 | no | const head = spawnSync(&#39;git&#39;, [&#39;-C&#39;, workRoot, &#39;rev-parse&#39;, &#39;--show-toplevel&#39;], { encoding: &#39;utf8&#39;, timeout: 10000 }); |
| dirty | const | 60 | no | const dirty = spawnSync(&#39;git&#39;, [&#39;-C&#39;, workRoot, &#39;status&#39;, &#39;--porcelain&#39;, &#39;--untracked-files=all&#39;], { encoding: &#39;utf8&#39;, timeout: 10000 }); |
| ws | const | 63 | no | const ws = createWorkspace({ root: workRoot }); |
| jobId | const | 64 | no | const jobId = randomUUID(); |
| bundle | variable | 65 | no | let bundle = null; |
| contextRef | const | 66 | no | const contextRef = val(args, &#39;--context&#39;); |
| agent | const | 68 | no | const agent = createPersonalAgentService({ paths: { root: defaultDataDir() }, getTools: () =&gt; [] }); |
| job | const | 79 | no | const job = await runDev({ task, provider: val(args, &#39;--provider&#39;) \|\| &#39;chatgpt:gpt-6&#39;, router, approvals, workspace: ws, ownerApproved: args.includes(&#39;--owner-approved&#39;), apply, maxTurns: Number(val(… |
| j | const | 83 | no | const j = JSON.parse(await readFile(resolve(root, &#39;runtime&#39;, &#39;journal&#39;, `${requestId}.json`), &#39;utf8&#39;).catch(() =&gt; &#39;null&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:url | import | 5 | external |
| node:child_process | import | 6 | external |
| node:crypto | import | 7 | external |
| ../../../studio/src/config.mjs | import | 8 | [studio/src/config.mjs](../../../studio/src/config.mjs.md) |
| ../../../studio/src/agents/personal-agent-service.mjs | import | 9 | [studio/src/agents/personal-agent-service.mjs](../../../studio/src/agents/personal-agent-service.mjs.md) |
| ./workspace.mjs | import | 10 | [harness/src/dev/workspace.mjs](./workspace.mjs.md) |
| ./agent.mjs | import | 11 | [harness/src/dev/agent.mjs](./agent.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/dev/cli.mjs |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/dev/cli.mjs |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/dev/cli.mjs |
| [harness/test/dev/cli.test.mjs](../../test/dev/cli.test.mjs.md) | ../../src/dev/cli.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Human-facing commands for the bounded VIVIM native development toolkit.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { defaultDataDir } from '../../../studio/src/config.mjs';
import { createPersonalAgentService } from '../../../studio/src/agents/personal-agent-service.mjs';
import { createWorkspace } from './workspace.mjs';
import { createJobStore, runDev } from './agent.mjs';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const val = (args, name) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const json = (o, out) => out(JSON.stringify(o, null, 2));
const fail = (code, message) => Object.assign(new Error(message), { code });
function validateArgs(args, flags) {
  for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) {
    const x = args[i]; if (!flags.includes(x)) throw fail('DEV_USAGE', `Unsupported option: ${x}`);
    if (!['--apply', '--owner-approved', '--create-workspace'].includes(x)) { if (!args[i + 1] || args[i + 1].startsWith('--')) throw fail('DEV_USAGE', `Value required for ${x}`); i++; }
  }
}
export async function workspaceCommand(args, { root = repoRoot, out = console.log } = {}) {
  const [cmd, ...rest] = args;
  validateArgs(rest, ['--path', '--start', '--lines']);
  const ws = createWorkspace({ root });
  if (cmd === 'list') return json(await ws.list({ path: val(rest, '--path') || rest[0] || '' }), out);
  if (cmd === 'read') {
    if (!rest[0] || rest[0].startsWith('--')) throw fail('DEV_USAGE', 'Usage: wh workspace read <path>');
    return json(await ws.read(rest[0], { startLine: Number(val(rest, '--start') || 1), maxLines: Number(val(rest, '--lines') || 180) }), out);
  }
  if (cmd === 'search') {
    if (!rest[0] || rest[0].startsWith('--')) throw fail('DEV_USAGE', 'Usage: wh workspace search <literal> [--path path]');
    return json(await ws.search({ query: rest[0], path: val(rest, '--path') || 'harness/src/' }), out);
  }
  if (cmd === 'diff') return json(ws.diff({ path: val(rest, '--path') || rest[0] || null }), out);
  if (cmd === 'test') return json(ws.testHarness(), out);
  throw fail('DEV_USAGE', 'Usage: wh workspace list|read|search|diff|test');
}
export async function devCommand(args, { root = repoRoot, router, approvals, out = console.log } = {}) {
  validateArgs(args, ['--provider', '--apply', '--owner-approved', '--workspace', '--max-turns', '--status', '--create-workspace', '--context']);
  const store = createJobStore({ directory: resolve(root, 'runtime', 'dev') });
  if (val(args, '--status')) { const job = await store.get(val(args, '--status')); json(job, out); return job; }
  if (!router) throw fail('DEV_DEPENDENCY', 'Existing harness router required');
  const task = args.filter((a, i) => !a.startsWith('--') && !['--provider','--workspace','--max-turns','--status','--create-workspace'].includes(args[i - 1])).join(' ').trim();
  if (!task || task.length > 4000) throw fail('DEV_TASK_INVALID', 'Task required, max 4000 characters');
  const apply = args.includes('--apply');
  const workRoot = val(args, '--workspace') ? resolve(val(args, '--workspace')) : root;
  if (apply) {
    if (!val(args, '--workspace')) throw fail('DEV_ISOLATION', '--apply requires an explicitly selected isolated --workspace');
    if (workRoot === resolve(root)) throw fail('DEV_ISOLATION', 'Cannot apply AI edits to the command checkout');
    const createWorkspaceFlag = args.includes('--create-workspace');
    if (!existsSync(workRoot)) {
      if (!createWorkspaceFlag) throw fail('DEV_ISOLATION', 'Apply workspace does not exist; pass --create-workspace to provision a git worktree');
      const wt = spawnSync('git', ['worktree', 'add', workRoot], { cwd: root, encoding: 'utf8', timeout: 30000 });
      if (wt.status !== 0) throw fail('DEV_ISOLATION', 'Failed to create git worktree: ' + (wt.stderr || '').trim());
    }
    // Verify the selected workspace is a Git worktree/repository and clean before applying edits.
    const head = spawnSync('git', ['-C', workRoot, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', timeout: 10000 });
    const dirty = spawnSync('git', ['-C', workRoot, 'status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8', timeout: 10000 });
    if (head.status !== 0 || resolve(head.stdout.trim()) !== workRoot || dirty.status !== 0 || dirty.stdout.trim()) throw fail('DEV_ISOLATION', 'Apply workspace must be a clean Git checkout/worktree');
  }
  const ws = createWorkspace({ root: workRoot });
  const jobId = randomUUID();
  let bundle = null;
  const contextRef = val(args, '--context');
  if (contextRef) {
    const agent = createPersonalAgentService({ paths: { root: defaultDataDir() }, getTools: () => [] });
    // Auto-initialize the local Personal Agent so context bundle composition works
    // without a separate setup step. Idempotent: a no-op if already initialized.
    agent.initialize({ expectedVersion: null });
    bundle = await agent.contextBundle({
      taskRef: contextRef,
      taskText: task,
      purpose: 'dev_task',
      profile: 'handoff',
    });
  }
  const job = await runDev({ task, provider: val(args, '--provider') || 'chatgpt:gpt-6', router, approvals,
    workspace: ws, ownerApproved: args.includes('--owner-approved'), apply, maxTurns: Number(val(args, '--max-turns') || 10), jobId, bundle,
```

_First 80 of 90 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
