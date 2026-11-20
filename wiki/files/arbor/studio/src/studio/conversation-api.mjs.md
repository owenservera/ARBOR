# File: studio/src/studio/conversation-api.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/conversation-api.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11344 B |
| Lines | 162 |
| Hash | 8daf630d3efb |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createDcbConversationFacade | function | 24 | yes | export function createDcbConversationFacade({ paths } = {}) { |
| directory | const | 25 | no | const directory = path.join(paths.root, &#39;conversations&#39;); |
| verifyTarget | function | 26 | no | const verifyTarget = async ({ principalRef, destinationProvider, threadRef }) =&gt; { |
| verified | variable | 27 | no | let verified = false; |
| matched | const | 33 | no | const matched = await getAdapter(record.binding.origin ?? &#39;&#39;).catch(() =&gt; null); |
| authorizeSourceDisclosure | function | 39 | no | const authorizeSourceDisclosure = async (request) =&gt; ({ authorized: false, proofRef: null, principalRef: request?.principalRef ?? null, destinationProvider: request?.destinationProvider ?? null, sour… |
| facade | const | 43 | no | const facade = createDcbHostContextRuntime({ paths, ownerRef: &#39;owner:studio-host&#39;, sourceAdapters: createDcbSourceAdapters({}), verifyTarget, authorizeSourceDisclosure, }); |
| defaultConversationRuntime | function | 52 | yes | export async function defaultConversationRuntime(options) { |
| dcb | variable | 55 | no | let dcb = null; |
| CREATE_SITES | const | 68 | yes | export const CREATE_SITES = Object.freeze([&#39;chatgpt&#39;, &#39;claude&#39;, &#39;zai&#39;, &#39;qwen&#39;, &#39;deepseek&#39;, &#39;gemini&#39;]); |
| validateConversationBody | function | 70 | yes | export function validateConversationBody(kind, body) { |
| fields | const | 72 | no | const fields = { create: [&#39;site&#39;], connect: [&#39;site&#39;, &#39;targetId&#39;, &#39;freshTab&#39;, &#39;expectedThread&#39;, &#39;prefixSource&#39;], prefix: [&#39;site&#39;, &#39;targetId&#39;, &#39;expectedThread&#39;, &#39;source&#39;, &#39;promptAttestation&#39;], submit: … |
| L | const | 102 | no | const L = TRANSCRIPT_LIMITS; |
| throwUnavailable | function | 119 | no | function throwUnavailable() { throw problem(501, &#39;Conversation event stream is not available&#39;, &#39;CONVERSATION_EVENTS_UNAVAILABLE&#39;); } |
| createConversationApi | function | 121 | yes | export function createConversationApi({ runtime, events } = {}) { |
| p | const | 123 | no | const p = url.pathname; |
| methods | variable | 125 | no | let methods, run; |
| id | variable | 142 | no | let id; |
| kind | const | 144 | no | const kind = match[2] === &#39;turns&#39; ? &#39;submit&#39; : match[2]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ./http.mjs | import | 4 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ../capture/conversation-thread.mjs | import | 5 | [studio/src/capture/conversation-thread.mjs](../capture/conversation-thread.mjs.md) |
| ../capture/chatgpt-chat-index.mjs | import | 6 | [studio/src/capture/chatgpt-chat-index.mjs](../capture/chatgpt-chat-index.mjs.md) |
| ../profiles/sites/index.mjs | import | 7 | [studio/src/profiles/sites/index.mjs](../profiles/sites/index.mjs.md) |
| ../agents/dcb-context-runtime.mjs | import | 8 | [studio/src/agents/dcb-context-runtime.mjs](../agents/dcb-context-runtime.mjs.md) |
| ../../../harness/src/context/dcb-sources.mjs | import | 9 | [harness/src/context/dcb-sources.mjs](../../../harness/src/context/dcb-sources.mjs.md) |
| ../capture/conversation-runtime.mjs | dynamic | 53 | [studio/src/capture/conversation-runtime.mjs](../capture/conversation-runtime.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/chat.mjs](../../bin/commands/chat.mjs.md) | ../../src/studio/conversation-api.mjs |
| [studio/bin/commands/run.mjs](../../bin/commands/run.mjs.md) | ../../src/studio/conversation-api.mjs |
| [studio/src/studio/conversation-tools.mjs](./conversation-tools.mjs.md) | ./conversation-api.mjs |
| [studio/src/studio/personal-app-ai-design.mjs](./personal-app-ai-design.mjs.md) | ./conversation-api.mjs |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./conversation-api.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Thin authenticated-server surface over the shared lifecycle runtime. No browser logic here.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { json, object, problem, storageName, text } from './http.mjs';
import { TRANSCRIPT_LIMITS } from '../capture/conversation-thread.mjs';
import { chatIndexExpression } from '../capture/chatgpt-chat-index.mjs';
import { getAdapter } from '../profiles/sites/index.mjs';
import { DCB_HOST_FACADE_SCHEMA, createDcbHostContextRuntime } from '../agents/dcb-context-runtime.mjs';
import { createDcbSourceAdapters } from '../../../harness/src/context/dcb-sources.mjs';

// DCB Host facade (Lane A) — constructed ONCE per conversation runtime in this module
// (prior verification: studio/src/agents/dcb-context-runtime.mjs was test-only dead code with no
// live send-path consumer; this is the wiring). Host-owned callbacks derive from EXISTING
// evidence only, never caller flags:
//   - verifyTarget: a thread verifies only if THIS Host observed it bound on the provider's
//     origin (conversation binding records written by authenticated connect flows, site-matched
//     through the existing adapter registry).
//   - authorizeSourceDisclosure: the Host has NO source-disclosure grant evidence store yet, so
//     the callback refuses unconditionally. The dispatch gate can therefore never mint a send
//     candidate — the facade structurally runs in OBSERVATION-ONLY mode: assemble context and
//     record provenance, never block a send (log-and-continue), refuse to invent authority.
//     Flipping to enforcing REQUIRES replacing this refuser with a callback backed by real
//     grant evidence first.
export function createDcbConversationFacade({ paths } = {}) {
  const directory = path.join(paths.root, 'conversations');
  const verifyTarget = async ({ principalRef, destinationProvider, threadRef }) => {
    let verified = false;
    try {
      for (const name of readdirSync(directory)) {
        if (!name.endsWith('.conversation.json')) continue;
        let record; try { record = JSON.parse(readFileSync(path.join(directory, name), 'utf8')); } catch { continue; }
        if (record?.binding?.thread?.ref !== threadRef) continue;
        const matched = await getAdapter(record.binding.origin ?? '').catch(() => null);
        if (matched?.id === destinationProvider) { verified = true; break; }
      }
    } catch { verified = false; }
    return { verified, principalRef, destinationProvider, threadRef };
  };
  const authorizeSourceDisclosure = async (request) => ({ authorized: false, proofRef: null,
    principalRef: request?.principalRef ?? null, destinationProvider: request?.destinationProvider ?? null,
    sourceRefs: Array.isArray(request?.sourceRefs) ? [...request.sourceRefs] : [],
    reason: 'NO_HOST_DISCLOSURE_GRANT_EVIDENCE' });
  const facade = createDcbHostContextRuntime({
    paths, ownerRef: 'owner:studio-host', sourceAdapters: createDcbSourceAdapters({}),
    verifyTarget, authorizeSourceDisclosure,
  });
  // The evidence callbacks are returned for inspection/testing in the SAME trusted module
  // boundary; the frozen facade surface itself never exposes them.
  return { facade, mode: 'observation-only', verifyTarget, authorizeSourceDisclosure };
}

export async function defaultConversationRuntime(options) {
  const { createConversationRuntime } = await import('../capture/conversation-runtime.mjs');
  // Single DCB facade construction site; threaded to the runtime via dependencies.dcb.
  let dcb = null;
  try { dcb = createDcbConversationFacade({ paths: options?.paths }); }
  catch (e) { console.warn(`[dcb] Host facade unavailable (${e?.code ?? String(e?.message ?? e)}); conversation sends continue without DCB observation`); }
  return createConversationRuntime(options && dcb
    ? { ...options, dependencies: { ...options.dependencies, dcb } }
    : options);
}

// Sites the fresh-conversation ('create') path accepts. Narrower than src/profiles/sites'
// ADAPTER_IDS on purpose: this is the create-a-tab-and-type gate, kept to accounts the owner has
// actually signed into and that compare/ask exercise (chatgpt, claude, zai, qwen as of 2026-10-30).
// runtime.connect() (src/capture/conversation-runtime.mjs) independently re-checks against the
// full adapter registry; this list only needs to grow when another account is wired up end to end.
export const CREATE_SITES = Object.freeze(['chatgpt', 'claude', 'zai', 'qwen', 'deepseek', 'gemini']);

export function validateConversationBody(kind, body) {
  object(body);
  const fields = { create: ['site'], connect: ['site', 'targetId', 'freshTab', 'expectedThread', 'prefixSource'], prefix: ['site', 'targetId', 'expectedThread', 'source', 'promptAttestation'], submit: ['key', 'prompt', 'confirm', 'expectedRevision'], reconcile: ['expectedRevision', 'turnId'], finish: ['closeTab'],
    chatIndex: ['targetId', 'site', 'maxEntries', 'maxTitleChars', 'scanLimit', 'containers'], read: ['maxMessages', 'maxChars'] }[kind];
  if (Object.keys(body).some((key) => !fields.includes(key))) throw problem(400, 'Unexpected request field');
  if (kind === 'create') {
    if (!CREATE_SITES.includes(body.site)) throw problem(400, `Choose ${CREATE_SITES.map((s) => (s === 'zai' ? 'Z.ai' : s[0].toUpperCase() + s.slice(1))).join(', ')} for a fresh conversation`, 'INVALID_CREATE');
  }
  if (kind === 'connect') {
    text(body.site, 'site', 128);
    if (body.targetId !== undefined) text(body.targetId, 'targetId', 256);
```

_First 80 of 163 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
