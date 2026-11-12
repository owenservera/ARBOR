// `wh build "<task>"` wiring: router sends, git branch/commit/PR, node --test. Every send still goes
// through the harness approval: without --owner-approved it waits for `wh approve <id>` in another terminal.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from './build.mjs';
import { connect } from '../core/cdp.mjs';
import { readReply } from '../core/reply.mjs';
import { getProvider } from '../providers/index.mjs';
import { resolveTarget } from '../interface/target.mjs';

// Read (never send) the latest assistant reply in one exact, already-open thread tab. Used to continue a
// build whose first send landed but was journaled uncertain: the reply is used, the prompt is not resent.
export async function readThreadReply({ providerId, threadUrl, timeoutMs = 600000, connectFn = connect, target = resolveTarget() }) {
  const provider = getProvider(providerId); if (!provider) throw new Error(`Unknown provider ${providerId}`);
  const browser = await connectFn({ host: target.host, port: target.port });
  const tabs = (await browser.targets()).filter(t => t.type === 'page' && t.url === threadUrl);
  if (tabs.length !== 1) throw new Error(`EXACT_TARGET_REQUIRED: ${tabs.length} tabs at ${threadUrl}`);
  const page = await browser.attach(tabs[0].id);
  const journal = { read: async () => ({ boundary: { assistantTurns: 0 } }), update: async () => {} };
  const r = await readReply({ page, provider, journal, requestId: 'resume', timeoutMs, pollIntervalMs: 1000, stableSamples: 3 });
  return r;
}

const harness = fileURLToPath(new URL('../../', import.meta.url));
// The build runs with WH_* set to drive the live browser; the suite must not inherit them (several tests
// assert the default lab target and fail under an attach target).
export const testEnv = (env = process.env) => Object.fromEntries(Object.entries(env).filter(([k]) => !k.startsWith('WH_')));
const git = (...a) => execFileSync('git', a, { cwd: harness, encoding: 'utf8' }).trim();

export async function buildCommand({ router, approvals, task, provider = 'chatgpt:gpt-6', context = [], ownerApproved = false, push = true, resumeThread = null, resumeRequest = null, log = console.log }) {
  if (git('status', '--porcelain')) throw new Error('Working tree not clean; commit or stash first');
  const branch = `build/${task.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40).replace(/-$/, '')}-${Date.now().toString(36)}`;
  git('checkout', '-b', branch); log(`branch ${branch}`);
  const ctx = await Promise.all(context.map(async p => ({ path: p, content: await readFile(resolve(harness, p), 'utf8') })));
  let written = [];
  const deps = {
    async ask({ prompt, threadUrl, first }) {
      const [prov, model] = provider.split(':');
      if (first && resumeThread) {
        log(`resume: reading the reply already in ${resumeThread} (request ${resumeRequest}); nothing is sent`);
        const r = await readThreadReply({ providerId: prov, threadUrl: resumeThread });
        return { requestId: resumeRequest, provider: prov, model: model ?? null, threadUrl: resumeThread, status: r.complete ? 'complete' : 'incomplete', reply: r.text };
      }
      const req = await router.ask({ provider: first ? provider : prov, prompt, threadUrl, replyTimeoutMs: 300000 });
      log(`request ${req.requestId} (${req.status})${ownerApproved ? '' : ` — approve with: wh approve ${req.requestId}`}`);
      if (ownerApproved) await approvals.approve(req.requestId);
      const r = await router.wait(req.requestId, 900000);
      const rec = JSON.parse(await readFile(resolve(harness, '../runtime/journal', `${req.requestId}.json`), 'utf8').catch(() => '{}'));
      return { ...r, threadUrl: rec.threadUrl ?? null, model: r.model ?? rec.model ?? model ?? null };
    },
    async writeFiles(files) { for (const f of files) { const p = resolve(harness, f.path); await mkdir(dirname(p), { recursive: true }); await writeFile(p, f.content); } written = files.map(f => f.path); },
    async restore() { for (const p of written) { try { git('checkout', 'HEAD', '--', p); } catch { await rm(resolve(harness, p), { force: true }); } } written = []; },
    async runTests() {
      const r = spawnSync('node', ['--test', 'test/**/*.test.mjs'], { cwd: harness, encoding: 'utf8', timeout: 300000, env: testEnv() });
      const output = `${r.stdout}\n${r.stderr}`; const pass = output.match(/ℹ pass (\d+)/)?.[1]; const fail = output.match(/ℹ fail (\d+)/)?.[1];
      return { ok: r.status === 0 && fail === '0', output, summary: `${pass}/${Number(pass) + Number(fail)} pass` };
    },
    async commit({ message, files }) { git('add', '--', ...files.map(f => f.path)); git('-c', 'user.name=owenservera', '-c', 'user.email=owenservera@users.noreply.github.com', 'commit', '-q', '-m', message); },
    async openPr({ title, body }) {
      if (!push) return null;
      git('push', '-q', '-u', 'origin', branch);
      return execFileSync('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body], { cwd: harness, encoding: 'utf8' }).trim();
    },
  };
  return { branch, ...(await runBuild({ task, context: ctx, deps, log })) };
}
