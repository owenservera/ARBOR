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
    resolveThreadUrl: async requestId => {
      if (!/^[a-f0-9-]{1,64}$/i.test(requestId)) return null;
      const j = JSON.parse(await readFile(resolve(root, 'runtime', 'journal', `${requestId}.json`), 'utf8').catch(() => 'null'));
      return j?.threadUrl ?? null;
    },
    persist: j => store.save(j),
  });
  json(job, out); return job;
}
