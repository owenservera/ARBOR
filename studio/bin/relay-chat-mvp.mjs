#!/usr/bin/env node
// grokbot-authored. Relay Chat MVP: claims bridge commands with consumer 'harness', relays text to a signed-in
// AI web app via the harness router (one in flight per provider, parallel across providers), posts the reply. Phone send = owner approval for that one message.
// Usage: node bin/relay-chat-mvp.mjs [--root <studio data dir>]   Text: "@claude hi" (default @chatgpt). Never resends.
import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createBridgeStore } from '../src/studio/bridge-commands.mjs';
import { parseRelayChatIntent } from '../src/studio/relay-chat-intent.mjs';
import { snapshotRelayStartupFence } from '../src/studio/relay-chat-startup-fence.mjs';
import { createWorkerHeartbeat } from '../src/studio/worker-heartbeat.mjs';
import { probeStudioRelayReadiness } from '../src/studio/relay-chat-transport-readiness.mjs';
import { defaultDataDir, defaultHarnessDir } from '../src/config.mjs';
const HARNESS = defaultHarnessDir();
const root = process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root') + 1] : defaultDataDir();
const studioUrl = process.argv.includes('--studio-url') ? process.argv[process.argv.indexOf('--studio-url') + 1] : process.env.VIVIM_STUDIO_URL;
const transport = process.argv.includes('--transport') ? process.argv[process.argv.indexOf('--transport') + 1] : null;
if (process.argv.includes('--studio-url') && !studioUrl) throw new Error('--studio-url requires a URL');
if (process.argv.includes('--transport') && (transport !== 'direct' || !studioUrl)) throw new Error('--transport direct requires --studio-url');
const store = createBridgeStore({ root });
// Never silently revive messages admitted before this worker started.
// A durable queue is not a fresh owner instruction to send after a restart.
const startupFence = snapshotRelayStartupFence(store.file);
const runtime = path.resolve(HARNESS, '..', 'runtime');
let approvals, router, studio;
if (studioUrl) {
  const { createStudioRelayChat } = await import('./lib/relay-chat-studio.mjs');
  studio = createStudioRelayChat({ url: studioUrl, store });
} else {
  const { createRouter } = await import(pathToFileURL(path.join(HARNESS, 'src/interface/router.mjs')).href);
  const { createApprovals } = await import(pathToFileURL(path.join(HARNESS, 'src/interface/approval.mjs')).href);
  approvals = createApprovals({ dir: path.join(runtime, 'approvals'), print: () => {} });
  router = await createRouter({ approvals });
}
const threadsFile = path.join(root, 'bridge', 'relay-chat-threads.json');
const threads = existsSync(threadsFile) ? JSON.parse(readFileSync(threadsFile, 'utf8')) : {};
const log = m => console.error(`[relay-chat ${new Date().toISOString()}] ${m}`);
const interim = (rec, text) => appendFileSync(store.file, JSON.stringify({ ...rec, result: text, updatedAt: new Date().toISOString(), rev: rec.rev + 1 }) + '\n', { mode: 0o600 });

async function handle(cmd) {
  let rec = store.claim(cmd.id, { by: 'harness' });
  let intent;
  try { intent = parseRelayChatIntent(rec); }
  catch(error) {
    // Claim is already persisted: reject without opening a second controller.
    store.reply(cmd.id, error.code ?? 'RELAY_CHAT_INTENT_INVALID', {status:'failed'});
    return;
  }
  const { provider, model, effort, prompt } = intent;
  if (studio) { await studio.handle({ cmd: rec, rec, provider, model, effort, prompt }); return; }
  const key = rec.conversationId ? `${rec.conversationId}:${provider}` : provider;
  const spec = provider + (model ? ':' + model : '') + (effort ? '@' + effort : '');
  const requestId = randomUUID(); const threadUrl = rec.newChat ? 'new' : threads[key] || 'new';
  log(`${cmd.id} -> ${spec} request ${requestId} thread ${threadUrl === 'new' ? 'new' : 'reuse'}`);
  try {
    await router.ask({ provider: spec, prompt, threadUrl, requestId });
    await approvals.approve(requestId);
    interim(rec, `sent to ${provider}, waiting… (request ${requestId})`);
    const r = await router.wait(requestId, 600000);
    log(`${cmd.id} request ${requestId} status ${r?.status}`);
    if (r?.status === 'complete' || (r?.status === 'observed' && r.reply)) {
      let url = null; try { url = JSON.parse(readFileSync(path.join(runtime, 'journal', requestId + '.json'), 'utf8')).threadUrl ?? null; } catch {} if (url) { threads[key] = url; writeFileSync(threadsFile, JSON.stringify(threads), { mode: 0o600 }); }
      store.reply(cmd.id, `[${provider}${r.model ? ':' + (r.model.id ?? r.model) : ''}] ${r.reply}`.slice(0, 60000));
    } else if (r?.status === 'uncertain') store.reply(cmd.id, `uncertain, not resent (request ${requestId})`, { status: 'failed' });
    else store.reply(cmd.id, `failed: ${r?.status ?? 'no result'} ${r?.error ?? ''} (request ${requestId})`, { status: 'failed' });
  } catch (e) { log(`${cmd.id} error ${e.message}`); try { store.reply(cmd.id, `failed before/at send: ${e.message} (request ${requestId}; not resent)`, { status: 'failed' }); } catch {} }
}
log(`watching ${store.file}`);
log(`startup admission fence: ${startupFence.size} historical command ids ignored; only post-start owner requests admitted`);
const heartbeat = createWorkerHeartbeat({
  root, worker: 'chatWorker',
  // Declared mode only: Studio conversation HTTP currently accepts ChatGPT
  // default text; the existing alternative harness router has four targets.
  providers: studio ? ['chatgpt'] : ['chatgpt','claude','qwen','zai']
});
const busy = new Set();
for (;;) {
  // Record liveness only after the queue was read; this does not prove browser readiness.
  const commands = store.list({ status: 'queued', consumer: 'harness', limit: 200 }).items.reverse().filter(cmd => !startupFence.has(cmd.id) && (!transport || cmd.transport === transport));
  // A running queue loop is NOT evidence that the single Studio browser owner
  // can receive a turn. A busy, missing or malformed Studio owner fails closed:
  // do not claim or touch a request, and report a blocked heartbeat to Host.
  const studioReadiness = studio
    ? await probeStudioRelayReadiness({ url: studioUrl })
    : { ready: true, reason: 'HARNESS_LOCAL' };
  try { heartbeat.record(studioReadiness.ready ? 'ok' : 'error'); } catch {}
  if (!studioReadiness.ready) {
    await new Promise(r => setTimeout(r, 2000));
    continue;
  }
  // Oldest first; at most one in flight per provider; different providers run in parallel.
  for (const cmd of commands) {
    if (studio?.halted()) break;
    let provider;
    try { provider = parseRelayChatIntent(cmd).provider; }
    catch { provider = 'invalid'; }
    const slot = studio ? 'studio' : provider; if (busy.has(slot)) continue;
    busy.add(slot); handle(cmd).catch(e => log(`${cmd.id} worker error ${e.message}`)).finally(() => busy.delete(slot));
  }
  await new Promise(r => setTimeout(r, 2000));
}
