// One-shot live smoke, run ONLY after the owner's in-session consent for these exact providers and this exact prompt.
// Usage: node scripts/live-smoke.mjs <providerId> [<providerId> ...]
// Sequential. One NEW chat per provider, one send each, never retried. Prints state + the model's short reply.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRouter } from '../src/interface/router.mjs';
import { createApprovals } from '../src/interface/approval.mjs';

const PROMPT = 'Reply with exactly: OK';
const CONSENTED = new Set(['chatgpt', 'claude', 'gemini', 'zai', 'qwen', 'deepseek']);
const runtime = fileURLToPath(new URL('../../runtime/', import.meta.url));
const providers = process.argv.slice(2);
if (!providers.length) { console.error('usage: live-smoke.mjs <provider...>'); process.exit(2); }
for (const id of providers) if (!CONSENTED.has(id)) { console.error(`provider not covered by owner consent: ${id}`); process.exit(2); }

const router = await createRouter();
const approvals = createApprovals({ dir: resolve(runtime, 'approvals'), print: () => {} });
for (const id of providers) {
  const started = Date.now();
  const { requestId } = await router.ask({ provider: id, prompt: PROMPT, threadUrl: 'new' });
  await approvals.approve(requestId); // owner consent was given in-session for exactly this scope
  const result = await router.wait(requestId, 120000);
  console.log(JSON.stringify({ provider: id, requestId, status: result.status, reply: result.reply?.slice(0, 80) ?? null, error: result.error ?? null, seconds: Math.round((Date.now() - started) / 1000) }));
  if (['uncertain', 'blocked', 'failed'].includes(result.status)) console.log(`  stopped on ${id}: ${result.status} (no retry)`);
}
process.exit(0); // CDP websockets keep the event loop alive; tabs are left open (never closed).
