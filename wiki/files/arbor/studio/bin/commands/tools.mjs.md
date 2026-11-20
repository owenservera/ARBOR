# File: studio/bin/commands/tools.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/tools.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4755 B |
| Lines | 62 |
| Hash | e58b0d730c17 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| clientFlags | const | 9 | no | const clientFlags = { |
| connect | function | 20 | no | function connect(ctx, dependencies) { |
| seconds | const | 21 | no | const seconds = ctx.flags.timeout ?? 60; |
| env | const | 23 | no | const env = dependencies.env ?? process.env; |
| emit | function | 27 | no | const emit = (ctx, result) =&gt; ctx.out.emit(result, (out) =&gt; out.line(JSON.stringify(result, null, 2))); |
| execute | function | 28 | no | async function execute(run) { |
| code | const | 31 | no | const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(error?.code ?? &#39;&#39;) ? error.code : &#39;STUDIO_CLIENT_ERROR&#39;; |
| runToolsList | function | 39 | yes | export async function runToolsList(ctx, dependencies = {}) { |
| runToolsCall | function | 43 | yes | export async function runToolsCall(ctx, dependencies = {}) { |
| input | const | 45 | no | const input = ctx.flags.input ?? &#39;-&#39;; |
| args | variable | 46 | no | let args; |
| result | const | 49 | no | const result = await execute(() =&gt; connect(ctx, dependencies).call(ctx.args[0], args)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| ../lib/registry.mjs | import | 3 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 4 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/config.mjs | import | 5 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../../src/studio/tool-client.mjs | import | 6 | [studio/src/studio/tool-client.mjs](../../src/studio/tool-client.mjs.md) |
| ../../src/studio/tool-result.mjs | import | 7 | [studio/src/studio/tool-result.mjs](../../src/studio/tool-result.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/tools.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Existing CLI -> owned running Studio HTTP dispatcher. Never starts Studio or a browser runtime.
import { readFileSync } from 'node:fs';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError, CliError } from '../lib/ui.mjs';
import { EXIT } from '../../src/config.mjs';
import { createStudioToolClient } from '../../src/studio/tool-client.mjs';
import { metadataOnly } from '../../src/studio/tool-result.mjs';

const clientFlags = {
  'studio-port': { type: 'number', valueName: 'PORT', desc: 'Running loopback Studio port (default: configured studioPort)' },
  // A fresh-tab create_conversation/connect_conversation can legitimately take 10-25s (worst case
  // the adapter's own readinessTimeoutMs 45s + connectGraceMs 2s = 47s) before the underlying
  // conversation is actually ready. The old default of 10s fired this client-side HTTP deadline
  // first, so the tool call reported STUDIO_REQUEST_UNKNOWN/504 even though creation succeeded a
  // few seconds later; the caller then had to recover the conversation id via list_conversations.
  // 60s (the hard cap this flag already validates below) covers that envelope with margin and
  // matches the precedent already used for effectful calls in bin/commands/recipes.mjs.
  timeout: { type: 'number', default: 60, valueName: 'SECONDS', desc: 'HTTP deadline 1–60 seconds; never retries. Fresh-tab create/connect can take up to ~47s; the default covers that' },
};
function connect(ctx, dependencies) {
  const seconds = ctx.flags.timeout ?? 60;
  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 60) throw usageError('timeout must be 1–60 seconds');
  const env = dependencies.env ?? process.env;
  return (dependencies.client ?? createStudioToolClient)({ port: ctx.flags['studio-port'] ?? ctx.settings.studioPort,
    timeoutMs: seconds * 1000, ...(env.CAPTURE_STUDIO_TOKEN ? { token: env.CAPTURE_STUDIO_TOKEN } : {}) });
}
const emit = (ctx, result) => ctx.out.emit(result, (out) => out.line(JSON.stringify(result, null, 2)));
async function execute(run) {
  try { return await run(); }
  catch (error) {
    const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(error?.code ?? '') ? error.code : 'STUDIO_CLIENT_ERROR';
    throw new CliError(code, { exit: EXIT.ENVIRONMENT, code,
      details: { httpStatus: Number.isInteger(error?.status) ? error.status : null,
        effect: error?.effect === 'unknown' ? 'unknown' : 'none', retry: false } });
  }
}


export async function runToolsList(ctx, dependencies = {}) {
  if (ctx.args.length) throw usageError('Usage: studio tools list');
  emit(ctx, await execute(() => connect(ctx, dependencies).list()));
}
export async function runToolsCall(ctx, dependencies = {}) {
  if (ctx.args.length !== 1) throw usageError('Usage: studio tools call <tool> --input <file|->');
  const input = ctx.flags.input ?? '-';
  let args;
  try { args = JSON.parse((dependencies.readInput ?? ((file) => readFileSync(file === '-' ? 0 : file, 'utf8')))(input)); }
  catch { throw usageError('Input must contain one JSON arguments object; private input is not echoed'); }
  const result = await execute(() => connect(ctx, dependencies).call(ctx.args[0], args));
  emit(ctx, ctx.flags['include-content'] ? result : metadataOnly(result));
}

defineGroup('tools', { section: 'System', default: 'list', summary: 'Use the running same-owner Studio integration tools over loopback HTTP',
  description: 'No new server, runtime, CDP driver or MCP actor. CAPTURE_STUDIO_TOKEN optionally supplies the running server token. Capability registration is not account availability.' });
define({ name: 'tools list', section: 'System', noData: true, flags: clientFlags,
  summary: 'List the running Studio conversation tool registrations (no browser action)', run: runToolsList });
define({ name: 'tools call', section: 'System', noData: true, usage: '<tool> --input <file|->',
  summary: 'Invoke one registered conversation tool on the running Studio; never retry',
  description: 'Arguments come from private local JSON file/stdin. Send requires its own confirm:true, key and expectedRevision; none are invented. Output omits private bodies/titles by default; --include-content explicitly returns them to this local caller. HTTP timeout means inspect/reconcile, NEVER automatic resend.',
  flags: { ...clientFlags, input: { type: 'string', valueName: 'FILE|-', desc: 'JSON arguments file, or stdin (default -)' },
    'include-content': { type: 'boolean', desc: 'Explicitly include private reply text/title content in the local command result' } },
  examples: ['studio tools list --json', 'studio tools call conversation_targets --input request.json --json'], run: runToolsCall });
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
