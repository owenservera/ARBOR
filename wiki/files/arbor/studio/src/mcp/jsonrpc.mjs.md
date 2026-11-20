# File: studio/src/mcp/jsonrpc.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mcp/jsonrpc.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2350 B |
| Lines | 64 |
| Hash | 510d3f8a418d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ErrorCode | const | 2 | yes | export const ErrorCode = Object.freeze({ ParseError: -32700, InvalidRequest: -32600, MethodNotFound: -32601, InvalidParams: -32602, |
| RpcError | class | 11 | yes | export class RpcError extends Error { |
| constructor | method | 12 | yes | constructor(code, message, data) { |
| rpcResult | function | 20 | yes | export function rpcResult(id, result) { |
| rpcError | function | 24 | yes | export function rpcError(id, code, message, data) { |
| error | const | 25 | no | const error = { code, message }; |
| validId | function | 30 | no | function validId(id) { |
| parseMessage | function | 35 | yes | export function parseMessage(line) { |
| trimmed | const | 36 | no | const trimmed = String(line).replace(/^\\uFEFF/, &#39;&#39;).trim(); |
| msg | variable | 38 | no | let msg; |
| hasId | const | 44 | no | const hasId = Object.hasOwn(msg, &#39;id&#39;); |
| serialize | function | 62 | yes | export function serialize(message) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mcp/resources.mjs](./resources.mjs.md) | ./jsonrpc.mjs |
| [studio/src/mcp/runtime.mjs](./runtime.mjs.md) | ./jsonrpc.mjs |
| [studio/src/mcp/server-stdio.mjs](./server-stdio.mjs.md) | ./jsonrpc.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// JSON-RPC 2.0 helpers for the newline-delimited MCP transport. No stdout writes here.
export const ErrorCode = Object.freeze({
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ResourceNotFound: -32002,
});

export class RpcError extends Error {
  constructor(code, message, data) {
    super(message);
    this.name = 'RpcError';
    this.code = code;
    this.data = data;
  }
}

export function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

export function rpcError(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: '2.0', id: id ?? null, error };
}

function validId(id) {
  return id === null || typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id));
}

// One NDJSON line -> a request, a notification, an error response, or an empty skip.
export function parseMessage(line) {
  const trimmed = String(line).replace(/^\uFEFF/, '').trim();
  if (!trimmed) return { empty: true };
  let msg;
  try { msg = JSON.parse(trimmed); }
  catch { return { error: rpcError(null, ErrorCode.ParseError, 'Parse error') }; }
  if (Array.isArray(msg) || !msg || typeof msg !== 'object') {
    return { error: rpcError(null, ErrorCode.InvalidRequest, 'Invalid Request') };
  }
  const hasId = Object.hasOwn(msg, 'id');
  if (msg.jsonrpc !== '2.0' || typeof msg.method !== 'string' || !msg.method || (hasId && !validId(msg.id))) {
    // Without an id the peer expects no response; there is nothing to answer.
    if (!hasId) return { notification: true, ignore: true };
    return { error: rpcError(validId(msg.id) ? msg.id : null, ErrorCode.InvalidRequest, 'Invalid Request') };
  }
  if (msg.params !== undefined && (msg.params === null || typeof msg.params !== 'object' || Array.isArray(msg.params))) {
    if (!hasId) return { notification: true, method: msg.method, params: {}, ignore: true };
    return { error: rpcError(msg.id, ErrorCode.InvalidParams, 'Invalid params') };
  }
  return {
    notification: !hasId,
    id: hasId ? msg.id : undefined,
    method: msg.method,
    params: msg.params ?? {},
  };
}

export function serialize(message) {
  return JSON.stringify(message) + '\n';
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
