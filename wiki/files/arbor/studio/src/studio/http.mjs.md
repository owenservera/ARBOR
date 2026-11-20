# File: studio/src/studio/http.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/http.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4648 B |
| Lines | 92 |
| Hash | 178841fd473d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| problem | function | 4 | yes | export function problem(status, message, code = &#39;INVALID_REQUEST&#39;) { |
| STORE_ERROR_STATUS | const | 9 | yes | export const STORE_ERROR_STATUS = Object.freeze({ STORE_NAME_INVALID: 400, STORE_PATH_ESCAPE: 400, STORE_VERSION_INVALID: 400, CAS_EXPECTED_VERSION_INVALID: 400, INVALID_ROLLBACK_VERSION: 400, RESERV… |
| storeFields | function | 17 | yes | export function storeFields(e) { |
| out | const | 18 | no | const out = {}; |
| storeProblem | function | 28 | yes | export function storeProblem(e) { |
| json | function | 32 | yes | export function json(res, status, value) { |
| integer | function | 44 | yes | export function integer(value, fallback, max = 1000, min = 0) { |
| n | const | 47 | no | const n = Number(value); |
| text | function | 52 | yes | export function text(value, name, max = 256) { |
| object | function | 57 | yes | export function object(value, name = &#39;body&#39;) { |
| storageName | function | 62 | yes | export function storageName(value, name = &#39;name&#39;) { |
| timestamp | function | 68 | yes | export function timestamp(value, name = &#39;at&#39;) { |
| t | const | 70 | no | const t = typeof value === &#39;number&#39; \|\| /^\\d+$/.test(String(value)) ? Number(value) : Date.parse(value); |
| page | function | 75 | yes | export function page(items, q = {}) { |
| offset | const | 76 | no | const offset = integer(q.offset, 0, 1000000), limit = integer(q.limit, 100, 1000, 1); |
| datasetPage | function | 81 | yes | export async function datasetPage(dataset, q = {}, predicate = () =&gt; true, transform = (x) =&gt; x) { |
| offset | const | 82 | no | const offset = integer(q.offset, 0, 1000000), limit = integer(q.limit, 100, 1000, 1); |
| items | const | 83 | no | const items = []; |
| matched | variable | 84 | no | let matched = 0, hasMore = false; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./http-encode.mjs | import | 2 | [studio/src/studio/http-encode.mjs](./http-encode.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/agents/personal-agent-provider-reply.mjs](../agents/personal-agent-provider-reply.mjs.md) | ../studio/http.mjs |
| [studio/src/agents/personal-agent-service.mjs](../agents/personal-agent-service.mjs.md) | ../studio/http.mjs |
| [studio/src/mcp/runtime.mjs](../mcp/runtime.mjs.md) | ../studio/http.mjs |
| [studio/src/studio/agentic-files.mjs](./agentic-files.mjs.md) | ./http.mjs |
| [studio/src/studio/ai-orchestrator.mjs](./ai-orchestrator.mjs.md) | ./http.mjs |
| [studio/src/studio/bridge-commands.mjs](./bridge-commands.mjs.md) | ./http.mjs |
| [studio/src/studio/capabilities.mjs](./capabilities.mjs.md) | ./http.mjs |
| [studio/src/studio/commands.mjs](./commands.mjs.md) | ./http.mjs |
| [studio/src/studio/compare-service.mjs](./compare-service.mjs.md) | ./http.mjs |
| [studio/src/studio/conversation-api.mjs](./conversation-api.mjs.md) | ./http.mjs |
| [studio/src/studio/conversation-events.mjs](./conversation-events.mjs.md) | ./http.mjs |
| [studio/src/studio/conversation-tools.mjs](./conversation-tools.mjs.md) | ./http.mjs |
| [studio/src/studio/drive-api.mjs](./drive-api.mjs.md) | ./http.mjs |
| [studio/src/studio/event-feed.mjs](./event-feed.mjs.md) | ./http.mjs |
| [studio/src/studio/harness-api.mjs](./harness-api.mjs.md) | ./http.mjs |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./http.mjs |
| [studio/src/studio/personal-agent-routes.mjs](./personal-agent-routes.mjs.md) | ./http.mjs |
| [studio/src/studio/personal-app-ai-design.mjs](./personal-app-ai-design.mjs.md) | ./http.mjs |
| [studio/src/studio/personal-app-content.mjs](./personal-app-content.mjs.md) | ./http.mjs |
| [studio/src/studio/personal-app-provider-reply.mjs](./personal-app-provider-reply.mjs.md) | ./http.mjs |
| [studio/src/studio/personal-app-routes.mjs](./personal-app-routes.mjs.md) | ./http.mjs |
| [studio/src/studio/personal-app-service.mjs](./personal-app-service.mjs.md) | ./http.mjs |
| [studio/src/studio/platform-x.mjs](./platform-x.mjs.md) | ./http.mjs |
| [studio/src/studio/recipe-routes.mjs](./recipe-routes.mjs.md) | ./http.mjs |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./http.mjs |
| [studio/src/studio/webhooks.mjs](./webhooks.mjs.md) | ./http.mjs |
| [studio/src/studio/world-note-units.mjs](./world-note-units.mjs.md) | ./http.mjs |
| [studio/src/studio/world-relations.mjs](./world-relations.mjs.md) | ./http.mjs |
| [studio/src/studio/world-search.mjs](./world-search.mjs.md) | ./http.mjs |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./http.mjs |
| [studio/src/studio/world-transfer.mjs](./world-transfer.mjs.md) | ./http.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Shared integration boundary helpers. No dependency on the UI or a running browser.
import { sendEncoded } from './http-encode.mjs';

export function problem(status, message, code = 'INVALID_REQUEST') {
  return Object.assign(new Error(message), { status, code });
}

// Stable HTTP status for persistence-owner errors (src/store/versioned.mjs and its I1/factory callers).
export const STORE_ERROR_STATUS = Object.freeze({
  STORE_NAME_INVALID: 400, STORE_PATH_ESCAPE: 400, STORE_VERSION_INVALID: 400, CAS_EXPECTED_VERSION_INVALID: 400, INVALID_ROLLBACK_VERSION: 400, RESERVED_NAMESPACE: 400,
  STORE_NO_SUCH_ITEM: 404, STORE_NO_SUCH_VERSION: 404, CAS_VERSION_CONFLICT: 409, CAS_LOCKED: 423,
  CAS_LOCK_RELEASE_UNVERIFIED: 500, STORE_CURRENT_CORRUPT: 500, STORE_RECORD_CORRUPT: 500, STORE_VERSION_EXISTS: 500, STORE_VERSION_LIMIT: 500,
});

// Machine-readable facts that must survive the HTTP boundary: a durable commit whose lock release was unverified
// (committed:true + committedVersion - the client must NOT repeat the mutation) and the CAS conflict operands.
export function storeFields(e) {
  const out = {};
  if (e && e.committed === true) { out.committed = true; out.committedVersion = Number.isSafeInteger(e.committedVersion) ? e.committedVersion : null; }
  if (e && e.code === 'CAS_VERSION_CONFLICT') {
    if (e.expected === null || Number.isSafeInteger(e.expected)) out.expected = e.expected;
    if (e.actual === null || Number.isSafeInteger(e.actual)) out.actual = e.actual;
  }
  return out;
}

/** Map a persistence-owner error to an HTTP problem, keeping its stable code and storeFields(); other errors pass through. */
export function storeProblem(e) {
  if (!e || e.status || !STORE_ERROR_STATUS[e.code]) return e;
  return Object.assign(problem(STORE_ERROR_STATUS[e.code], e.message, e.code), storeFields(e));
}
export function json(res, status, value) {
  if (res.destroyed || res.writableEnded) return;
  // Transport (negotiation, ETag/304, content-length, HEAD) lives in the one shared encoder.
  return sendEncoded(res, {
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(value),
    cacheControl: 'no-store',
    headers: { 'x-content-type-options': 'nosniff' },
  });
}

export function integer(value, fallback, max = 1000, min = 0) {
  if (value === undefined) return fallback;
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') throw problem(400, 'Expected an integer');
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw problem(400, `Expected an integer between ${min} and ${max}`);
  return n;
}

export function text(value, name, max = 256) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw problem(400, `${name} must be a nonempty string of at most ${max} characters`);
  return value;
}

export function object(value, name = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw problem(400, `${name} must be a JSON object`);
  return value;
}

export function storageName(value, name = 'name') {
  text(value, name, 128);
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(value) || value.includes('..')) throw problem(400, `Invalid ${name}`);
  return value;
}

export function timestamp(value, name = 'at') {
  if (value === undefined) return null;
  const t = typeof value === 'number' || /^\d+$/.test(String(value)) ? Number(value) : Date.parse(value);
  if (!Number.isFinite(t) || t < 0 || t > 8640000000000000) throw problem(400, `${name} must be epoch milliseconds or an ISO timestamp`);
  return t;
}

export function page(items, q = {}) {
  const offset = integer(q.offset, 0, 1000000), limit = integer(q.limit, 100, 1000, 1);
  return { items: items.slice(offset, offset + limit), total: items.length, offset, limit, nextOffset: offset + limit < items.length ? offset + limit : null };
}

// Limit returned rows without loading the whole JSONL dataset. Offset counts matching rows.
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
