#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRouter } from '../src/interface/router.mjs';
import { createApprovals } from '../src/interface/approval.mjs';
import { buildLaunchCommand, OWNER_PROFILE, LAB_PROFILE, profileBusyReasons } from '../src/interface/launch.mjs';
import { createServer } from '../src/interface/server.mjs';
import { createStanding } from '../src/interface/standing.mjs';
import { devAutoApprove, confirmAndApprove } from '../src/interface/dev-auto-approve.mjs';

const args = process.argv.slice(2); const command = args.shift();
const runtime = fileURLToPath(new URL('../../runtime/', import.meta.url));
const flag = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
try {
  if (command === 'launch') {
    // Default = VIVIM's signed-in profile (<data dir>\chrome-profile); `--profile lab` uses runtime/chrome-profile.
    const userDataDir = flag('--profile') === 'lab' ? LAB_PROFILE : OWNER_PROFILE;
    const launch = buildLaunchCommand({ userDataDir }); console.log([launch.command, ...launch.args].map(x => JSON.stringify(x)).join(' '));
    if (args.includes('--run')) {
      const busy = profileBusyReasons({ userDataDir });
      if (busy.length) throw new Error(`Refusing to launch: ${busy.join('; ')}`);
      spawn(launch.command, launch.args, { detached: true, stdio: 'ignore' }).unref(); console.log('launched');
    }
  } else if (command === 'standing') {
    await standingCommand(args);
  } else if (command === 'workspace') {
    const { workspaceCommand } = await import('../src/dev/cli.mjs');
    await workspaceCommand(args);
  } else if (command === 'dev' && args.includes('--status')) {
    const { devCommand } = await import('../src/dev/cli.mjs');
    await devCommand(args);
  } else if (command === 'approve') {
    // Interactive terminal + typed requestId, unless VIVIM_DEV_AUTO_APPROVE=1 (development): then no prompt.
    await confirmAndApprove({ approvals: createApprovals({ dir: resolve(runtime, 'approvals') }), requestId: args[0], prompt: async q => { const rl = createInterface({ input: process.stdin, output: process.stdout }); try { return await rl.question(q); } finally { rl.close(); } } });
  } else {
    const router = await createRouter();
    if (command === 'dev') {
      const { devCommand } = await import('../src/dev/cli.mjs');
      const out = await devCommand(args, { router, approvals: createApprovals({ dir: resolve(runtime, 'approvals'), print: () => {} }) });
      process.exitCode = out.status === 'complete' ? 0 : 1;
    } else if (command === 'providers') console.log(JSON.stringify(await router.providers(), null, 2));
    else if (command === 'models') {
      const list = await router.models({ provider: args[0] && !args[0].startsWith('--') ? args[0] : null, refresh: args.includes('--refresh') });
      if (args.includes('--json')) console.log(JSON.stringify(list, null, 2));
      else for (const p of list) console.log(`${p.provider}: ${p.models.length ? p.models.map(m => (m.current ? '*' : '') + `${p.provider}:${m.id}`).join('  ') : '(not discovered' + (p.supportsSelection ? '; run wh models --refresh)' : '; no picker config)')}`);
      if (args.includes('--refresh')) process.exit(process.exitCode ?? 0);
    } else if (command === 'caps') {
      // Q09: per-web-app capability matrix. Reads provider profiles and the
      // discovered-model registry only; no browser is opened and no provider
      // is contacted unless --refresh is passed (which still only reads pickers).
      const [providers, models] = await Promise.all([router.providers(), router.models()]);
      const byModel = Object.fromEntries(models.map(m => [m.provider, m]));
      const rows = providers.map(p => {
        const m = byModel[p.id] || {};
        const modes = [];
        if (Array.isArray(m.efforts)) modes.push(...m.efforts.map(e => ({ kind: 'effort', label: e.label, current: !!e.current })));
        if (m.slider) modes.push({ kind: 'slider', label: m.slider.label, current: m.slider.index, count: m.slider.count, locked: !!m.slider.locked });
        return {
          provider: p.id, label: p.label, status: p.status, url: p.url,
          strengths: Array.isArray(p.strengths) ? p.strengths : [],
          modes,
          sendStrategy: p.send?.strategy, supportsSelection: !!p.models,
          triggerSelector: p.models?.triggerSelector ?? null,
          currentModel: m.current ?? null, currentLabel: m.currentLabel ?? null,
          discoveredModels: Array.isArray(m.models) ? m.models.length : 0,
          discoveredAt: m.discoveredAt ?? null, hosts: p.hosts.join(','),
        };
      });
      if (args.includes('--json')) console.log(JSON.stringify({ providers: rows }, null, 2));
      else {
        const pad = (s, w) => String(s == null ? '' : s).slice(0, w).padEnd(w);
        console.log(pad('PROVIDER', 14) + pad('LABEL', 16) + pad('STATUS', 14) + pad('SEND', 9) + pad('MODELS', 8) + 'HOSTS');
        for (const r of rows) console.log(pad(r.provider, 14) + pad(r.label, 16) + pad(r.status, 14) + pad(r.sendStrategy, 9) + pad(r.discoveredModels, 8) + r.hosts);
      }
      process.exitCode = 0;
    } else if (command === 'route') console.log(JSON.stringify(await router.decide({ task: args.filter(a => !a.startsWith('--')).join(' ') }), null, 2));
    else if (command === 'tabs') {
      // G4: list harness-owned tabs; --close closes ALL of them (only ids in the harness registry; user tabs are never touched).
      if (args.includes('--adopt-journal')) {
        // Tabs opened before the registry existed: adopt ONLY live tabs whose exact URL is a thread the harness
        // itself created (journal threadUrl of its own sends). /new tabs and any other URL are never adopted.
        const { readdir } = await import('node:fs/promises'); const { createTabRegistry } = await import('../src/core/tabs.mjs'); const { connect } = await import('../src/core/cdp.mjs'); const { resolveTarget } = await import('../src/interface/target.mjs');
        const dir = resolve(runtime, 'journal'); const urls = new Set();
        for (const f of await readdir(dir)) if (f.endsWith('.json')) { const r = JSON.parse(await readFile(resolve(dir, f), 'utf8')); if (r.threadUrl) urls.add(r.threadUrl); }
        const tg = resolveTarget(); const live = await (await connect({ host: tg.host, port: tg.port })).targets(); const reg = createTabRegistry({ file: resolve(runtime, 'tabs.json') });
        let n = 0; for (const t of live) if (t.type === 'page' && urls.has(t.url) && !(await reg.isOwned(t.id))) { await reg.record({ id: t.id, provider: null, url: t.url }); n++; }
        console.log(JSON.stringify({ adopted: n }));
      }
      const t = await router.tabs(); console.log(JSON.stringify({ owned: t.owned.map(x => ({ id: x.id, provider: x.provider, openedAt: x.openedAt })), prunedClosed: t.stale.length }, null, 2));
      if (args.includes('--close')) console.log(JSON.stringify(await router.closeTabs({ ids: t.owned.map(x => x.id) })));
      process.exit(0);
    } else if (command === 'review') {
      const { reviewCommand } = await import('../src/build/review-cli.mjs');
      const out = await reviewCommand({ router, approvals: createApprovals({ dir: resolve(runtime, 'approvals'), print: () => {} }), pr: args[0], reviewer: flag('--reviewer') || 'chatgpt:gpt-6', ownerApproved: args.includes('--owner-approved') && !devAutoApprove(), merge: args.includes('--merge'), resumeThread: flag('--resume-thread') || null, resumeRequest: flag('--resume-request') || null, authorOverride: flag('--author') || null });
      console.log(JSON.stringify(out, null, 2)); process.exit(out.gate.merge ? 0 : 1);
    } else if (command === 'fleet' || command === 'swarm' || command === 'roundrobin') {
      const { fleetCommand, swarmCommand, roundrobinCommand } = await import('../src/agents/cli.mjs');
      const approvals = createApprovals({ dir: resolve(runtime, 'approvals'), print: () => {} });
      const owner = args.includes('--owner-approved') && !devAutoApprove(); // dev flag: the router already approved the request
      // Each step is its own request; --owner-approved approves each one once, right after it is created.
      const r = { ...router, ask: async (o) => { const q = await router.ask(o); console.error(`request ${q.requestId} ${o.provider}`); if (owner) await approvals.approve(q.requestId); return q; } };
      const rest = args.filter(a => a !== '--owner-approved');
      if (command === 'roundrobin') {
        // A round-robin turn is one journaled request through router.ask, so the per-request approval still
        // applies. A resume reads the same journal the router writes, and a read-back only ever attaches to one
        // exact, already open thread tab (main's EXACT_TARGET_REQUIRED behaviour is kept as it is).
        const { createJournalReader } = await import('../src/agents/roundrobin.mjs');
        const { readThreadReply } = await import('../src/build/cli.mjs');
        const journal = createJournalReader({ dir: resolve(runtime, 'journal') });
        const readBack = ({ provider, threadUrl }) => readThreadReply({ providerId: provider, threadUrl });
        const result = await roundrobinCommand(rest, { router: r, journal, readBack });
        process.exitCode = result.dryRun || result.status === 'complete' ? 0 : 1;
      } else {
        const { appendFile, mkdir } = await import('node:fs/promises');
        const fdir = resolve(runtime, 'fleets'); await mkdir(fdir, { recursive: true });
        // Fleet sends are journaled and thread URLs persisted under runtime/fleets by default.
        const append = async (e) => appendFile(resolve(fdir, 'sends.jsonl'), JSON.stringify(e) + '\n');
        await (command === 'fleet' ? fleetCommand : swarmCommand)(rest, { router: r, append, store: resolve(fdir, 'threads.json') });
      }
    } else if (command === 'review-decide') {
      const { decideCommand } = await import('../src/build/review-cli.mjs');
      const out = await decideCommand({ pr: args[0], requestId: flag('--request'), dismiss: flag('--dismiss') || '', merge: args.includes('--merge') });
      console.log(JSON.stringify(out, null, 2)); process.exit(out.gate.merge ? 0 : 1);
    } else if (command === 'build') {
      const { buildCommand } = await import('../src/build/cli.mjs');
      const task = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.match(/^--(provider|context|resume-thread|resume-request)$/)).join(' ');
      const out = await buildCommand({ router, approvals: createApprovals({ dir: resolve(runtime, 'approvals'), print: () => {} }), task, provider: flag('--provider') || 'chatgpt:gpt-6', context: (flag('--context') || '').split(',').filter(Boolean), ownerApproved: args.includes('--owner-approved') && !devAutoApprove(), push: !args.includes('--no-push'), resumeThread: flag('--resume-thread') || null, resumeRequest: flag('--resume-request') || null });
      console.log(JSON.stringify(out, null, 2)); process.exit(out.ok ? 0 : 1);
    } else if (command === 'status') console.log(JSON.stringify(await router.status(args[0]), null, 2));
    else if (command === 'ask') {
      const file = flag('--prompt-file'); if (!file) throw new Error('--prompt-file required');
      const request = await router.ask({ provider: args[0], model: flag('--model') || null, prompt: await readFile(file, 'utf8'), threadUrl: flag('--thread') || 'new', requestId: flag('--id') });
      console.log(JSON.stringify(request)); console.log(JSON.stringify(await router.wait(request.requestId, 600000)));
    } else if (command === 'reply') console.log(JSON.stringify(await router.result(args[0]), null, 2));
    else if (command === 'list') console.log(JSON.stringify(await router.list(), null, 2));
    else if (command === 'serve') {
      const server = createServer({ router });
      const port = Number(flag('--port') || 9334);
      console.log(JSON.stringify(await server.listen(port)));
      if (flag('--mobile')) {
        const http = await import('node:http');
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const mobileRoot = resolve(fileURLToPath(import.meta.url), '../../../apps/mobile-relay');
        const mobileServer = http.createServer(async (req, res) => {
          const url = new URL(req.url, 'http://127.0.0.1');
          const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
          const filePath = path.resolve(mobileRoot, pathname.slice(1));
          try {
            const body = await fs.readFile(filePath);
            const ext = pathname.split('.').pop();
            const ct = { js: 'application/javascript', html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2' }[ext] || 'application/octet-stream';
            res.setHeader('content-type', ct);
            res.setHeader('cache-control', 'no-store');
            res.writeHead(200).end(body);
          } catch { res.writeHead(404).end('not found'); }
        });
        const mport = Number(flag('--mobile-port') || 9335);
        await new Promise((resolve, reject) => { mobileServer.once('error', reject); mobileServer.listen(mport, '127.0.0.1', () => { console.log(JSON.stringify({ mobile: 'http://127.0.0.1:' + mport })); resolve(); }); });
      }
    }
    else if (command === 'roadmap') {
      const repoRoot = resolve(fileURLToPath(import.meta.url), '../../..');
      const roadmapPath = resolve(repoRoot, 'docs/roadmap.json');
      const set = flag('--set');
      const roadmap = JSON.parse(await readFile(roadmapPath, 'utf8'));
      if (set) {
        const [id, status] = set.split(':');
        if (!id || !status) throw Object.assign(new Error('--set ID:STATUS required'), { code: 'USAGE' });
        const item = roadmap.items.find(x => x.id === id);
        if (!item) throw Object.assign(new Error(`no roadmap item ${id}`), { code: 'NOT_FOUND' });
        item.status = status;
        item.updated = new Date().toISOString().slice(0, 10);
        await writeFile(roadmapPath, JSON.stringify(roadmap, null, 2) + '\n');
        console.log(JSON.stringify({ id: item.id, status: item.status }));
      } else {
        console.log(JSON.stringify(roadmap.items.map(x => ({ id: x.id, status: x.status, title: x.title })), null, 2));
      }
      process.exitCode = 0;
    }
    else if (command === 'context') {
      // Compose a Dynamic Context Bundle from local memory + repo authorities.
      // Read-only: never sends, never opens a browser, never calls a provider.
      const { defaultDataDir } = await import('../../studio/src/config.mjs');
      const { createPersonalAgentService } = await import('../../studio/src/agents/personal-agent-service.mjs');
      const taskRef = flag('--task-ref');
      if (!taskRef) throw Object.assign(new Error('--task-ref required'), { code: 'USAGE' });
      const parseJson = (name) => { const v = flag(name); if (!v) return undefined; try { return JSON.parse(v); } catch { throw Object.assign(new Error(`Invalid JSON for ${name}`), { code: 'USAGE' }); } };
      const dataRoot = defaultDataDir();
      const agent = createPersonalAgentService({ paths: { root: dataRoot }, getTools: () => [] });
      // Auto-initialize the local Personal Agent so context bundle composition works
      // without a separate setup step. Idempotent: a no-op if already initialized.
      agent.initialize({ expectedVersion: null });
      const bundle = await agent.contextBundle({
        taskRef,
        taskText: flag('--task-text') || '',
        purpose: flag('--purpose') || 'personal_continuum',
        profile: flag('--profile') || 'continuum',
        audience: parseJson('--audience') || { principalRef: 'owner', projectRef: 'local', destinationProvider: '', destinationModelVerified: false },
        scope: parseJson('--scope') || { allowedRefs: [], allowedPrefixes: ['docs/', 'dev/', 'harness/src/', 'studio/src/', 'personal-agent/memory/'], maxSensitivity: 'private' },
        disclosure: parseJson('--disclosure'),
        maxInputTokens: Number(flag('--max-input-tokens') || 1800),
        reservedForUserPrompt: Number(flag('--reserved-for-user-prompt') || 400),
        reservedForOutput: Number(flag('--reserved-for-output') || 500),
        sourceHead: flag('--source-head') || null,
        policyVersion: flag('--policy-version') || 'v1',
        now: flag('--now') || undefined,
      });
      console.log(JSON.stringify({ manifest: bundle.manifest, preview: bundle.preview, transferable: bundle.transferable }, null, 2));
      process.exitCode = bundle.manifest.sources.length > 0 ? 0 : 0;
    }
    else if (command === 'recover') {
      // Q12: reconcile open (uncertain/failed/in-flight) journal records.
      // Never resends - only reports and optionally marks a request blocked.
      const router = await createRouter();
      const { dependencies } = await import('../src/interface/deps.mjs');
      const deps = await dependencies();
      const journal = await deps.createJournal({ dir: resolve(runtime, 'journal') });
      const records = await journal.list();
      const openStates = new Set(['accepted','sent','streaming','dispatching','reserved','ready']);
      const open = records.filter(r => openStates.has(r.state));
      if (args.includes('--json')) {
        console.log(JSON.stringify({ open: open.length, records: open.map(r => ({
          requestId: r.requestId, state: r.state, submitted: r.submitted,
          threadUrl: r.threadUrl ?? null, createdAt: r.createdAt, updatedAt: r.updatedAt,
          reason: r.reason ?? null
        })) }, null, 2));
      } else {
        console.log(`Open journal records (unreconciled, never auto-resent): ${open.length}`);
        for (const r of open) console.log(`  ${r.requestId} state=${r.state} submitted=${r.submitted} thread=${r.threadUrl ?? 'new'}`);
      }
      const resolveId = flag('--resolve');
      if (resolveId) {
        const rec = await journal.read(resolveId);
        if (!rec) throw Object.assign(new Error(`no journal record ${resolveId}`), { code: 'NOT_FOUND' });
        await journal.update(resolveId, { state: 'blocked', reason: 'owner_recovered_no_resend' });
        console.log(`resolved ${resolveId} -> blocked (no resend)`);
      }
      process.exitCode = 0;
    } else if (command === 'download') {
      // Q10: artifact/bundle download — URL -> local path, SHA-256 checksum,
      // provenance recorded in the send journal. No provider is contacted except
      // to fetch the artifact; no browser is opened.
      const url = flag('--url');
      const out = flag('--out');
      const expectSha = flag('--sha256');
      if (!url) throw Object.assign(new Error('--url required'), { code: 'USAGE' });
      if (!out) throw Object.assign(new Error('--out required'), { code: 'USAGE' });
      const { dependencies } = await import('../src/interface/deps.mjs');
      const deps = await dependencies();
      const journal = await deps.createJournal({ dir: resolve(runtime, 'journal') });
      const requestId = 'dl-' + createHash('sha256').update(url + Date.now()).digest('hex').slice(0, 16);
      let body;
      try { const res = await fetch(url); if (!res.ok) throw new Error(`HTTP ${res.status}`); body = Buffer.from(await res.arrayBuffer()); }
      catch (error) { throw Object.assign(new Error('Download failed: ' + String(error?.message ?? error)), { code: 'DOWNLOAD_FAILED' }); }
      const actualSha = createHash('sha256').update(body).digest('hex');
      if (expectSha && expectSha.toLowerCase() !== actualSha) {
        throw Object.assign(new Error(`Checksum mismatch: expected ${expectSha}, got ${actualSha}`), { code: 'CHECKSUM_MISMATCH' });
      }
      const outPath = resolve(out);
      await writeFile(outPath, body);
      await journal.create({ requestId, provider: 'download', threadKey: 'download:' + url, payloadDigest: actualSha, state: 'sent', submitted: 'yes', boundary: null, replyDigest: actualSha, threadUrl: url, reason: 'artifact download' });
      if (args.includes('--json')) {
        console.log(JSON.stringify({ requestId, url, path: outPath, bytes: body.length, sha256: actualSha, checksumVerified: !!expectSha }, null, 2));
      } else {
        console.log(`Downloaded ${url} -> ${outPath} (${body.length} bytes, sha256 ${actualSha})`);
      }
      process.exitCode = 0;
    }
    else throw new Error('Unknown command');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }

// One-time standing approval for routine lab-profile test sends. Every send still goes through sendOnce.
async function standingCommand(args) {
  const standing = createStanding({ dir: resolve(runtime, 'approvals') }); const sub = args[0];
  const opt = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
  try {
    if (sub === 'enable') {
      const provider = opt('--provider') === 'all' ? '*' : opt('--provider');
      const hoursArg = opt('--hours'); const maxArg = opt('--max-sends');
      const hours = hoursArg === 'unlimited' ? null : Number(hoursArg);
      const maxSends = maxArg === 'unlimited' ? null : Number(maxArg);
      const threads = args.flatMap((a, i) => a === '--thread' && args[i + 1] ? [args[i + 1]] : []);
      if (!provider) throw Object.assign(new Error('--provider required'), { code: 'STANDING_BAD_PROVIDER' });
      const devAuto = devAutoApprove();
      if (!devAuto && (!process.stdin.isTTY || !process.stdout.isTTY)) throw Object.assign(new Error('Interactive terminal required'), { code: 'NOT_INTERACTIVE' });
      if (!devAuto) console.log([
        'STANDING APPROVAL: read before confirming',
        `Provider: ${provider === '*' ? 'ALL providers' : provider} (lab profile only: runtime/chrome-profile; owner profile refused)`,
        `Threads: new${threads.length ? ', ' + threads.join(', ') : ''}`,
        `Window: ${hours === null ? 'no time limit' : hours + ' hour(s)'}; max sends: ${maxSends === null ? 'no limit' : maxSends}; prompt limit: 2000 characters`,
        'Still enforced on every send: draft-present block, exact thread binding, no-resend after uncertainty.',
        'Nothing is sent unless you run wh ask; this only skips the per-request wh approve step.'
      ].join('\n'));
      let answer;
      if (!devAuto) { const rl = createInterface({ input: process.stdin, output: process.stdout }); try { answer = await rl.question(`Type ENABLE ${provider} to confirm: `); } finally { rl.close(); } }
      const record = await standing.enable({ provider, hours, maxSends, threads, confirmText: answer });
      console.log(record.expiresAt === null ? 'Standing approval enabled. No time limit.' : `Standing approval enabled. Expires: ${record.expiresAt} (${new Date(record.expiresAt).toLocaleString()} local)`);
    } else if (sub === 'status') console.log(JSON.stringify(await standing.status(), null, 2));
    else if (sub === 'revoke') console.log(JSON.stringify(await standing.revoke()));
    else throw Object.assign(new Error('Usage: wh standing enable|status|revoke'), { code: 'USAGE' });
  } catch (error) { console.error(`${error.code || 'ERROR'}: ${error.message}`); process.exitCode = 1; }
}
