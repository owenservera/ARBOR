# File: studio/src/capture/harness-runs.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/harness-runs.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13862 B |
| Lines | 241 |
| Hash | 81179f8d504c |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HARNESS_RUN_SCHEMA | const | 12 | yes | export const HARNESS_RUN_SCHEMA = &#39;capture-studio.harness-run/1&#39;; |
| RUN_STATUSES | const | 13 | yes | export const RUN_STATUSES = Object.freeze([&#39;running&#39;, &#39;succeeded&#39;, &#39;failed&#39;, &#39;interrupted&#39;]); |
| STEP_STATUSES | const | 14 | yes | export const STEP_STATUSES = Object.freeze([&#39;in_flight&#39;, &#39;uncertain&#39;, &#39;succeeded&#39;, &#39;failed&#39;]); |
| DEFAULT_LIMITS | const | 15 | no | const DEFAULT_LIMITS = Object.freeze({ maxRuns: 200, maxSteps: 1000, taskChars: 2000, summaryChars: 300, stepKeyChars: 200 }); |
| now | function | 16 | no | const now = () =&gt; new Date().toISOString(); |
| fail | function | 17 | no | const fail = (status, code, message = code) =&gt; Object.assign(new Error(message), { status, code }); |
| clamp | function | 18 | no | const clamp = (value, length) =&gt; String(value ?? &#39;&#39;).slice(0, length); |
| RUN_ID | const | 19 | no | const RUN_ID = /^[a-f\\d-]{10,64}$/i; |
| CONVERSATION_ID | const | 20 | no | const CONVERSATION_ID = /^[A-Za-z\\d][A-Za-z\\d_-]{0,127}$/; |
| canonicalJson | function | 23 | no | function canonicalJson(value) { |
| seen | const | 24 | no | const seen = new Set(); |
| walk | function | 25 | no | function walk(v) { |
| out | const | 30 | no | const out = Array.isArray(v) ? v.map(walk) : {}; |
| argsDigestOf | function | 43 | yes | export const argsDigestOf = (args) =&gt; createHash(&#39;sha256&#39;).update(canonicalJson(args)).digest(&#39;hex&#39;); |
| summarizeResult | function | 46 | yes | export function summarizeResult(result) { |
| conversation | const | 51 | no | const conversation = result.conversation ?? result.resource ?? null; |
| c | const | 52 | no | const c = conversation &amp;&amp; typeof conversation === &#39;object&#39; ? conversation : result; |
| validRun | function | 65 | no | const validRun = (r) =&gt; !!r &amp;&amp; r.schema === HARNESS_RUN_SCHEMA &amp;&amp; typeof r.id === &#39;string&#39; |
| validStep | function | 68 | no | const validStep = (s) =&gt; !!s &amp;&amp; typeof s.key === &#39;string&#39; &amp;&amp; !!s.key &amp;&amp; typeof s.tool === &#39;string&#39; |
| createHarnessRunStore | function | 72 | yes | export function createHarnessRunStore({ dir, io = fs, toolExecutor, limits = {}, retryableTools = [] } = {}) { |
| L | const | 75 | no | const L = { ...DEFAULT_LIMITS, ...limits }; |
| safeRetry | const | 76 | no | const safeRetry = new Set(retryableTools); // Explicit, verified READ-ONLY tools only. |
| file | function | 78 | no | const file = (id) =&gt; path.join(dir, `${id}.run.json`); |
| lockFile | function | 79 | no | const lockFile = (id) =&gt; `${file(id)}.lock`; |
| ids | function | 80 | no | const ids = () =&gt; io.readdirSync(dir).filter((n) =&gt; n.endsWith(&#39;.run.json&#39;)).map((n) =&gt; n.slice(0, -&#39;.run.json&#39;.length)); |
| readRun | function | 81 | no | const readRun = (id) =&gt; { |
| raw | variable | 83 | no | let raw; |
| run | variable | 86 | no | let run; |
| persist | function | 91 | no | function persist(run) { |
| tmp | const | 93 | no | const tmp = `${file(run.id)}.${process.pid}.${randomBytes(8).toString(&#39;hex&#39;)}.tmp`; |
| fd | variable | 94 | no | let fd; |
| mutate | function | 111 | no | function mutate(id, operation) { |
| fd | variable | 113 | no | let fd; |
| summary | function | 125 | no | const summary = (run) =&gt; ({ id: run.id, status: run.status, createdAt: run.createdAt, updatedAt: run.updatedAt, taskDescription: run.task.description, conversationId: run.conversationId, steps: run.s… |
| sameIntent | function | 128 | no | const sameIntent = (s, tool, argsDigest) =&gt; s.tool === tool &amp;&amp; s.argsDigest === argsDigest; |
| description | const | 132 | no | const description = typeof task === &#39;string&#39; ? task : task?.description; |
| run | const | 136 | no | const run = { schema: HARNESS_RUN_SCHEMA, id: randomUUID(), createdAt: now(), updatedAt: now(), |
| argsDigest | const | 147 | no | const argsDigest = argsDigestOf(args); |
| claimed | const | 148 | no | const claimed = mutate(id, (run) =&gt; { if (run.status !== &#39;running&#39;) throw fail(409, &#39;RUN_FINISHED&#39;); const matches = run.steps.filter((s) =&gt; s.key === key); if (matches.some((s) =&gt; !sameIntent(s, too… |
| matches | const | 150 | no | const matches = run.steps.filter((s) =&gt; s.key === key); |
| latest | const | 152 | no | const latest = matches.at(-1); |
| step | const | 159 | no | const step = { key, tool, argsDigest, status: &#39;in_flight&#39;, at: now(), summary: null, |
| result | variable | 168 | no | let result; |
| notDispatched | const | 174 | no | const notDispatched = e?.effectState === &#39;not_dispatched&#39;; |
| step | const | 175 | no | const step = mutate(id, (run) =&gt; { const current = run.steps.find((s) =&gt; s.key === key &amp;&amp; s.at === claimed.step.at &amp;&amp; s.status === &#39;in_flight&#39;); if (!current) throw fail(409, &#39;STEP_RECONCILIATION_REQ… |
| current | const | 176 | no | const current = run.steps.find((s) =&gt; s.key === key &amp;&amp; s.at === claimed.step.at &amp;&amp; s.status === &#39;in_flight&#39;); |
| current | const | 191 | no | const current = run.steps.find((s) =&gt; s.key === key &amp;&amp; s.at === claimed.step.at &amp;&amp; s.status === &#39;in_flight&#39;); |
| location | const | 214 | no | const location = lockFile(id); |
| raw | variable | 215 | no | let raw, owner; |
| encoded | const | 231 | no | const encoded = JSON.stringify(context); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 8 | external |
| node:path | import | 9 | external |
| node:crypto | import | 10 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/run.mjs](../../bin/commands/run.mjs.md) | ../../src/capture/harness-runs.mjs |
| [studio/scripts/harness-crash-probe.mjs](../../scripts/harness-crash-probe.mjs.md) | ../src/capture/harness-runs.mjs |
| [studio/src/recipes/plan.mjs](../recipes/plan.mjs.md) | ../capture/harness-runs.mjs |
| [studio/src/recipes/service.mjs](../recipes/service.mjs.md) | ../capture/harness-runs.mjs |
| [studio/src/studio/harness-api.mjs](../studio/harness-api.mjs.md) | ../capture/harness-runs.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../capture/harness-runs.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// AION Agent 14 / Z.ai Round 6 hardened drop-in for src/capture/harness-runs.mjs.
// Source baseline: Z.ai export patch 0013/18, 2026-10-24.
// IMPORTANT: This remains a state/identity layer only. All effects are performed by the
// injected EXISTING Studio conversation-tool executor. No additional actor or browser.
// A durable in-flight claim is written BEFORE calling the executor. After uncertain
// completion or a crash, this store FAILS CLOSED: reconcile with the owning journal;
// never retry an unverified effect, and never generate an alternate key to evade it.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const HARNESS_RUN_SCHEMA = 'capture-studio.harness-run/1';
export const RUN_STATUSES = Object.freeze(['running', 'succeeded', 'failed', 'interrupted']);
export const STEP_STATUSES = Object.freeze(['in_flight', 'uncertain', 'succeeded', 'failed']);
const DEFAULT_LIMITS = Object.freeze({ maxRuns: 200, maxSteps: 1000, taskChars: 2000, summaryChars: 300, stepKeyChars: 200 });
const now = () => new Date().toISOString();
const fail = (status, code, message = code) => Object.assign(new Error(message), { status, code });
const clamp = (value, length) => String(value ?? '').slice(0, length);
const RUN_ID = /^[a-f\d-]{10,64}$/i;
const CONVERSATION_ID = /^[A-Za-z\d][A-Za-z\d_-]{0,127}$/;

// Strict, order-independent serialization of JSON arguments. Do not hash JS insertion order.
function canonicalJson(value) {
  const seen = new Set();
  function walk(v) {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v !== 'object' || seen.has(v)) throw fail(400, 'INVALID_STEP_ARGUMENTS');
    seen.add(v);
    const out = Array.isArray(v) ? v.map(walk) : {};
    if (!Array.isArray(v)) {
      if (Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw fail(400, 'INVALID_STEP_ARGUMENTS');
      for (const key of Object.keys(v).sort()) {
        if (key === '__proto__') throw fail(400, 'INVALID_STEP_ARGUMENTS');
        out[key] = walk(v[key]);
      }
    }
    seen.delete(v);
    return out;
  }
  return JSON.stringify(walk(value));
}
export const argsDigestOf = (args) => createHash('sha256').update(canonicalJson(args)).digest('hex');

// The summary is bounded and intentionally never stores reply/prompt bodies.
export function summarizeResult(result) {
  if (result === undefined) return null;
  if (result === null) return 'null';
  if (Array.isArray(result)) return { kind: 'array', length: result.length };
  if (typeof result === 'object') {
    const conversation = result.conversation ?? result.resource ?? null;
    const c = conversation && typeof conversation === 'object' ? conversation : result;
    return { kind: 'object',
      ...(typeof c.id === 'string' ? { id: clamp(c.id, 128) } : {}),
      ...(typeof c.state === 'string' ? { state: clamp(c.state, 80) } : {}),
      ...(c.revision !== undefined ? { revision: c.revision } : {}),
      ...(typeof c.verdict === 'string' ? { verdict: clamp(c.verdict, 80) } : {}),
      ...(c.reply && typeof c.reply === 'object' ? { replyState: c.reply.state ?? null, replyChars: c.reply.chars ?? null } : {}),
      replyTextPresent: Object.values(result).some((v) => v && typeof v === 'object' && typeof v.text === 'string' && v.text.length > 0),
    };
  }
  return { kind: typeof result };
}

const validRun = (r) => !!r && r.schema === HARNESS_RUN_SCHEMA && typeof r.id === 'string'
  && RUN_STATUSES.includes(r.status) && typeof r.task?.description === 'string'
  && Array.isArray(r.steps) && Number.isFinite(Date.parse(r.createdAt)) && Number.isFinite(Date.parse(r.updatedAt));
const validStep = (s) => !!s && typeof s.key === 'string' && !!s.key && typeof s.tool === 'string'
  && /^[a-f\d]{64}$/.test(s.argsDigest ?? '') && STEP_STATUSES.includes(s.status)
  && Number.isFinite(Date.parse(s.at));

export function createHarnessRunStore({ dir, io = fs, toolExecutor, limits = {}, retryableTools = [] } = {}) {
  if (!dir) throw fail(500, 'RUN_DIR_REQUIRED');
  if (typeof toolExecutor !== 'function') throw fail(500, 'TOOL_EXECUTOR_REQUIRED');
  const L = { ...DEFAULT_LIMITS, ...limits };
  const safeRetry = new Set(retryableTools); // Explicit, verified READ-ONLY tools only.
  io.mkdirSync(dir, { recursive: true });
  const file = (id) => path.join(dir, `${id}.run.json`);
  const lockFile = (id) => `${file(id)}.lock`;
  const ids = () => io.readdirSync(dir).filter((n) => n.endsWith('.run.json')).map((n) => n.slice(0, -'.run.json'.length));
```

_First 80 of 241 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
