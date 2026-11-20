# File: harness/scripts/live-smoke.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | harness/scripts/live-smoke.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1884 B |
| Lines | 26 |
| Hash | 0090bc0e550d |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROMPT | const | 9 | no | const PROMPT = &#39;Reply with exactly: OK&#39;; |
| CONSENTED | const | 10 | no | const CONSENTED = new Set([&#39;chatgpt&#39;, &#39;claude&#39;, &#39;gemini&#39;, &#39;zai&#39;, &#39;qwen&#39;, &#39;deepseek&#39;]); |
| runtime | const | 11 | no | const runtime = fileURLToPath(new URL(&#39;../../runtime/&#39;, import.meta.url)); |
| providers | const | 12 | no | const providers = process.argv.slice(2); |
| router | const | 16 | no | const router = await createRouter(); |
| approvals | const | 17 | no | const approvals = createApprovals({ dir: resolve(runtime, &#39;approvals&#39;), print: () =&gt; {} }); |
| started | const | 19 | no | const started = Date.now(); |
| result | const | 22 | no | const result = await router.wait(requestId, 120000); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 4 | external |
| node:url | import | 5 | external |
| ../src/interface/router.mjs | import | 6 | [harness/src/interface/router.mjs](../src/interface/router.mjs.md) |
| ../src/interface/approval.mjs | import | 7 | [harness/src/interface/approval.mjs](../src/interface/approval.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
