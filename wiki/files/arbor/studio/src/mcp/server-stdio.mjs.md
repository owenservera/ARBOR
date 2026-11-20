# File: studio/src/mcp/server-stdio.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mcp/server-stdio.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7327 B |
| Lines | 156 |
| Hash | 3e0a484fabc4 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SUPPORTED_PROTOCOL_VERSIONS | const | 11 | no | const SUPPORTED_PROTOCOL_VERSIONS = [&#39;2025-06-18&#39;, &#39;2025-03-26&#39;, &#39;2024-11-05&#39;]; |
| MAX_LINE | const | 12 | no | const MAX_LINE = 8 * 1024 * 1024; |
| INSTRUCTIONS | const | 13 | no | const INSTRUCTIONS = &#39;Local Capture Studio MCP server. Tools are the in-process integration hub (derive-all and mirror load on first use and return a tool error if that module is absent). Resources: … |
| log | function | 15 | no | function log(message) { |
| negotiate | function | 19 | no | function negotiate(version) { |
| pageTools | function | 23 | no | function pageTools(tools, cursor) { |
| offset | const | 26 | no | const offset = Number(cursor); |
| slice | const | 28 | no | const slice = tools.slice(offset, offset + 100); |
| next | const | 29 | no | const next = offset + 100 &lt; tools.length ? String(offset + 100) : undefined; |
| createServer | function | 33 | yes | export async function createServer() { |
| runtimePromise | variable | 34 | no | let runtimePromise = null; |
| state | const | 35 | no | const state = { phase: &#39;new&#39; }; |
| runtime | function | 36 | no | const runtime = () =&gt; { |
| dispatch | function | 46 | no | async function dispatch(message) { |
| notify | function | 88 | no | function notify(method) { |
| client | const | 91 | no | const client = state.client; |
| serveStdio | function | 111 | yes | export async function serveStdio({ input = process.stdin, output = process.stdout } = {}) { |
| server | const | 112 | no | const server = await createServer(); |
| chain | variable | 113 | no | let chain = Promise.resolve(); |
| stopping | variable | 114 | no | let stopping = false; |
| write | function | 115 | no | const write = (message) =&gt; { |
| fail | function | 118 | no | const fail = (id, error) =&gt; { |
| shutdown | function | 123 | no | const shutdown = () =&gt; { |
| rl | const | 128 | no | const rl = readline.createInterface({ input, crlfDelay: Infinity, terminal: false }); |
| parsed | const | 136 | no | const parsed = parseMessage(line); |
| entry | const | 155 | no | const entry = process.argv[1] ? path.resolve(process.argv[1]) : &#39;&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 3 | external |
| node:readline | import | 4 | external |
| node:url | import | 5 | external |
| ../config.mjs | import | 6 | [studio/src/config.mjs](../config.mjs.md) |
| ./jsonrpc.mjs | import | 7 | [studio/src/mcp/jsonrpc.mjs](./jsonrpc.mjs.md) |
| ./runtime.mjs | import | 8 | [studio/src/mcp/runtime.mjs](./runtime.mjs.md) |
| ./resources.mjs | import | 9 | [studio/src/mcp/resources.mjs](./resources.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Capture Studio MCP server. Stdout is newline-delimited JSON-RPC 2.0 only; logs go to stderr.
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { VERSION, dataPaths, defaultDataDir } from '../config.mjs';
import { ErrorCode, parseMessage, rpcError, rpcResult, RpcError, serialize } from './jsonrpc.mjs';
import { callTool, createRuntime, listTools } from './runtime.mjs';
import { listCaptureResources, readCaptureResource } from './resources.mjs';

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_LINE = 8 * 1024 * 1024;
const INSTRUCTIONS = 'Local Capture Studio MCP server. Tools are the in-process integration hub (derive-all and mirror load on first use and return a tool error if that module is absent). Resources: capture-studio://sessions, capture-studio://sessions/{id}, capture-studio://sessions/{id}/datasets, capture-studio://sessions/{id}/datasets/{name}, capture-studio://sessions/{id}/knowledge. Captured content stays on this machine.';

function log(message) {
  process.stderr.write(`[capture-studio-mcp] ${message}\n`);
}

function negotiate(version) {
  return SUPPORTED_PROTOCOL_VERSIONS.includes(version) ? version : SUPPORTED_PROTOCOL_VERSIONS[0];
}

function pageTools(tools, cursor) {
  if (cursor === undefined) return { tools };
  if (typeof cursor !== 'string' || !/^\d+$/.test(cursor)) throw new RpcError(ErrorCode.InvalidParams, 'Invalid tool cursor');
  const offset = Number(cursor);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > tools.length) throw new RpcError(ErrorCode.InvalidParams, 'Invalid tool cursor');
  const slice = tools.slice(offset, offset + 100);
  const next = offset + 100 < tools.length ? String(offset + 100) : undefined;
  return next ? { tools: slice, nextCursor: next } : { tools: slice };
}

export async function createServer() {
  let runtimePromise = null;
  const state = { phase: 'new' };
  const runtime = () => {
    if (!runtimePromise) {
      runtimePromise = Promise.resolve().then(() => createRuntime()).catch((error) => {
        runtimePromise = null;
        throw error;
      });
    }
    return runtimePromise;
  };

  async function dispatch(message) {
    const { id, method, params } = message;
    if (method === 'ping') return rpcResult(id, {});
    if (method === 'initialize') {
      if (state.phase !== 'new') return rpcError(id, ErrorCode.InvalidRequest, 'Server already initialized');
      if (typeof params.protocolVersion !== 'string' || !params.protocolVersion) {
        return rpcError(id, ErrorCode.InvalidParams, 'protocolVersion is required');
      }
      if (params.capabilities !== undefined && (typeof params.capabilities !== 'object' || Array.isArray(params.capabilities))) {
        return rpcError(id, ErrorCode.InvalidParams, 'capabilities must be an object');
      }
      if (params.clientInfo !== undefined && (typeof params.clientInfo !== 'object' || Array.isArray(params.clientInfo) || params.clientInfo === null)) {
        return rpcError(id, ErrorCode.InvalidParams, 'clientInfo must be an object');
      }
      state.phase = 'ready';
      state.client = params.clientInfo ?? null;
      return rpcResult(id, {
        protocolVersion: negotiate(params.protocolVersion),
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
        },
        serverInfo: { name: 'capture-studio', version: VERSION, title: 'Capture Studio' },
        instructions: INSTRUCTIONS,
      });
    }
    if (state.phase === 'new') return rpcError(id, ErrorCode.InvalidRequest, 'Server not initialized');
    if (method === 'tools/list') return rpcResult(id, pageTools(await listTools(await runtime()), params.cursor));
    if (method === 'tools/call') {
      if (typeof params.name !== 'string') return rpcError(id, ErrorCode.InvalidParams, 'Tool name is required');
      return rpcResult(id, await callTool(await runtime(), params.name, params.arguments));
    }
    if (method === 'resources/list') {
      return rpcResult(id, listCaptureResources(dataPaths(defaultDataDir()).sessions, params.cursor));
    }
```

_First 80 of 157 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
