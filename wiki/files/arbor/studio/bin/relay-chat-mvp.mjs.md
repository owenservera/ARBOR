# File: studio/bin/relay-chat-mvp.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/bin/relay-chat-mvp.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5767 B |
| Lines | 81 |
| Hash | 898583978c17 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HARNESS | const | 13 | no | const HARNESS = defaultHarnessDir(); |
| root | const | 14 | no | const root = process.argv.includes(&#39;--root&#39;) ? process.argv[process.argv.indexOf(&#39;--root&#39;) + 1] : defaultDataDir(); |
| studioUrl | const | 15 | no | const studioUrl = process.argv.includes(&#39;--studio-url&#39;) ? process.argv[process.argv.indexOf(&#39;--studio-url&#39;) + 1] : process.env.VIVIM_STUDIO_URL; |
| transport | const | 16 | no | const transport = process.argv.includes(&#39;--transport&#39;) ? process.argv[process.argv.indexOf(&#39;--transport&#39;) + 1] : null; |
| store | const | 19 | no | const store = createBridgeStore({ root }); |
| runtime | const | 20 | no | const runtime = path.resolve(HARNESS, &#39;..&#39;, &#39;runtime&#39;); |
| approvals | variable | 21 | no | let approvals, router, studio; |
| threadsFile | const | 31 | no | const threadsFile = path.join(root, &#39;bridge&#39;, &#39;relay-chat-threads.json&#39;); |
| threads | const | 32 | no | const threads = existsSync(threadsFile) ? JSON.parse(readFileSync(threadsFile, &#39;utf8&#39;)) : {}; |
| log | function | 33 | no | const log = m =&gt; console.error(`[relay-chat ${new Date().toISOString()}] ${m}`); |
| interim | function | 34 | no | const interim = (rec, text) =&gt; appendFileSync(store.file, JSON.stringify({ ...rec, result: text, updatedAt: new Date().toISOString(), rev: rec.rev + 1 }) + &#39;\\n&#39;, { mode: 0o600 }); |
| handle | function | 36 | no | async function handle(cmd) { |
| rec | variable | 37 | no | let rec = store.claim(cmd.id, { by: &#39;harness&#39; }); |
| intent | variable | 38 | no | let intent; |
| key | const | 47 | no | const key = rec.conversationId ? `${rec.conversationId}:${provider}` : provider; |
| spec | const | 48 | no | const spec = provider + (model ? &#39;:&#39; + model : &#39;&#39;) + (effort ? &#39;@&#39; + effort : &#39;&#39;); |
| requestId | const | 49 | no | const requestId = randomUUID(); const threadUrl = rec.newChat ? &#39;new&#39; : threads[key] \|\| &#39;new&#39;; |
| r | const | 55 | no | const r = await router.wait(requestId, 600000); |
| url | variable | 58 | no | let url = null; try { url = JSON.parse(readFileSync(path.join(runtime, &#39;journal&#39;, requestId + &#39;.json&#39;), &#39;utf8&#39;)).threadUrl ?? null; } catch {} if (url) { threads[key] = url; writeFileSync(threadsFile… |
| heartbeat | const | 65 | no | const heartbeat = createWorkerHeartbeat({ root, worker: &#39;chatWorker&#39; }); |
| busy | const | 66 | no | const busy = new Set(); |
| commands | const | 69 | no | const commands = store.list({ status: &#39;queued&#39;, consumer: &#39;harness&#39;, limit: 200 }).items.reverse().filter(cmd =&gt; !transport \|\| cmd.transport === transport); |
| provider | variable | 74 | no | let provider; |
| slot | const | 77 | no | const slot = studio ? &#39;studio&#39; : provider; if (busy.has(slot)) continue; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| node:url | import | 7 | external |
| node:crypto | import | 8 | external |
| ../src/studio/bridge-commands.mjs | import | 9 | [studio/src/studio/bridge-commands.mjs](../src/studio/bridge-commands.mjs.md) |
| ../src/studio/relay-chat-intent.mjs | import | 10 | [studio/src/studio/relay-chat-intent.mjs](../src/studio/relay-chat-intent.mjs.md) |
| ../src/studio/worker-heartbeat.mjs | import | 11 | [studio/src/studio/worker-heartbeat.mjs](../src/studio/worker-heartbeat.mjs.md) |
| ../src/config.mjs | import | 12 | [studio/src/config.mjs](../src/config.mjs.md) |
| ./lib/relay-chat-studio.mjs | dynamic | 23 | [studio/bin/lib/relay-chat-studio.mjs](./lib/relay-chat-studio.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
import { createWorkerHeartbeat } from '../src/studio/worker-heartbeat.mjs';
import { defaultDataDir, defaultHarnessDir } from '../src/config.mjs';
const HARNESS = defaultHarnessDir();
const root = process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root') + 1] : defaultDataDir();
const studioUrl = process.argv.includes('--studio-url') ? process.argv[process.argv.indexOf('--studio-url') + 1] : process.env.VIVIM_STUDIO_URL;
const transport = process.argv.includes('--transport') ? process.argv[process.argv.indexOf('--transport') + 1] : null;
if (process.argv.includes('--studio-url') && !studioUrl) throw new Error('--studio-url requires a URL');
if (process.argv.includes('--transport') && (transport !== 'direct' || !studioUrl)) throw new Error('--transport direct requires --studio-url');
const store = createBridgeStore({ root });
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
const heartbeat = createWorkerHeartbeat({ root, worker: 'chatWorker' });
const busy = new Set();
for (;;) {
  // Record liveness only after the queue was read; this does not prove browser readiness.
  const commands = store.list({ status: 'queued', consumer: 'harness', limit: 200 }).items.reverse().filter(cmd => !transport || cmd.transport === transport);
  try { heartbeat.record('ok'); } catch {}
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
```

_First 80 of 82 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
