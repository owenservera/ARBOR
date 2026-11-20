# File: harness/bin/wh-mcp.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | harness/bin/wh-mcp.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4824 B |
| Lines | 50 |
| Hash | 271a59c1d353 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| tools | const | 5 | no | const tools = [ |
| handleRpc | function | 12 | yes | export async function handleRpc(message, router) { |
| result | variable | 15 | no | let result; |
| agent | const | 27 | no | const agent = createPersonalAgentService({ paths: { root: defaultDataDir() }, getTools: () =&gt; [] }); |
| runMcp | function | 40 | yes | export async function runMcp(router) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:url | import | 1 | external |
| node:readline | import | 2 | external |
| ../src/interface/router.mjs | import | 3 | [harness/src/interface/router.mjs](../src/interface/router.mjs.md) |
| ../../studio/src/config.mjs | dynamic | 25 | [studio/src/config.mjs](../../studio/src/config.mjs.md) |
| ../../studio/src/agents/personal-agent-service.mjs | dynamic | 26 | [studio/src/agents/personal-agent-service.mjs](../../studio/src/agents/personal-agent-service.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/interface/interface.test.mjs](../test/interface/interface.test.mjs.md) | ../../bin/wh-mcp.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { pathToFileURL } from 'node:url';
import readline from 'node:readline';
import { createRouter } from '../src/interface/router.mjs';

const tools = [
  { name: 'web_ai_providers', description: 'List providers', inputSchema: { type: 'object', properties: {} } },
  { name: 'web_ai_status', description: 'Provider status', inputSchema: { type: 'object', properties: { provider: { type: 'string' } }, required: ['provider'] } },
  { name: 'web_ai_ask', description: 'Request a human-reviewed send', inputSchema: { type: 'object', properties: { provider: { type: 'string' }, prompt: { type: 'string' }, threadUrl: { type: 'string' }, requestId: { type: 'string' } }, required: ['provider', 'prompt'] } },
  { name: 'web_ai_result', description: 'Read request status', inputSchema: { type: 'object', properties: { requestId: { type: 'string' } }, required: ['requestId'] } },
  { name: 'web_ai_context', description: 'Compose a Dynamic Context Bundle from local memory + repo authorities (read-only)', inputSchema: { type: 'object', properties: { taskRef: { type: 'string' }, taskText: { type: 'string' }, purpose: { type: 'string' }, profile: { type: 'string' }, audience: { type: 'object' }, scope: { type: 'object' }, disclosure: { type: 'object' }, maxInputTokens: { type: 'integer' }, reservedForUserPrompt: { type: 'integer' }, reservedForOutput: { type: 'integer' }, sourceHead: { type: ['string', 'null'] }, policyVersion: { type: 'string' } }, required: ['taskRef'] } }
];
export async function handleRpc(message, router) {
  if (message.id === undefined) return null;
  try {
    let result;
    if (message.method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'web-harness', version: '1.0.0' } };
    else if (message.method === 'tools/list') result = { tools };
    else if (message.method === 'tools/call') {
      const { name, arguments: args = {} } = message.params || {}; let value;
      if (name === 'web_ai_providers') value = await router.providers();
      else if (name === 'web_ai_status') value = await router.status(args.provider);
      else if (name === 'web_ai_ask') value = await router.ask(args);
      else if (name === 'web_ai_result') value = await router.result(args.requestId);
      else if (name === 'web_ai_context') {
        const { defaultDataDir } = await import('../../studio/src/config.mjs');
        const { createPersonalAgentService } = await import('../../studio/src/agents/personal-agent-service.mjs');
        const agent = createPersonalAgentService({ paths: { root: defaultDataDir() }, getTools: () => [] });
        // Auto-initialize the local Personal Agent so context bundle composition works
        // without a separate setup step. Idempotent: a no-op if already initialized.
        agent.initialize({ expectedVersion: null });
        value = await agent.contextBundle({ taskRef: args.taskRef, taskText: args.taskText || '', purpose: args.purpose || 'personal_continuum', profile: args.profile || 'continuum', audience: args.audience || { principalRef: 'owner', projectRef: 'local', destinationProvider: '', destinationModelVerified: false }, scope: args.scope || { allowedRefs: [], allowedPrefixes: ['docs/', 'dev/', 'harness/src/', 'studio/src/', 'personal-agent/memory/'], maxSensitivity: 'private' }, disclosure: args.disclosure, maxInputTokens: args.maxInputTokens ?? 1800, reservedForUserPrompt: args.reservedForUserPrompt ?? 400, reservedForOutput: args.reservedForOutput ?? 500, sourceHead: args.sourceHead ?? null, policyVersion: args.policyVersion || 'v1' });
        value = { manifest: value.manifest, preview: value.preview, transferable: value.transferable };
      }
      else throw new Error('Unknown tool');
      result = { content: [{ type: 'text', text: JSON.stringify(value) }] };
    } else return { jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Method not found' } };
    return { jsonrpc: '2.0', id: message.id, result };
  } catch (error) { return { jsonrpc: '2.0', id: message.id, error: { code: -32602, message: error.message } }; }
}
export async function runMcp(router) {
  for await (const line of readline.createInterface({ input: process.stdin, crlfDelay: Infinity })) {
    try { const response = await handleRpc(JSON.parse(line), router); if (response) process.stdout.write(JSON.stringify(response) + '\n'); }
    catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'); }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Approval previews belong on stderr, not the MCP transport.
  console.log = (...args) => console.error(...args);
  await runMcp(await createRouter());
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
