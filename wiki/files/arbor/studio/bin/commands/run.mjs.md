# File: studio/bin/commands/run.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/run.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8082 B |
| Lines | 139 |
| Hash | 24ce73a1381d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| storeFor | function | 20 | no | async function storeFor(ctx) { |
| runCreate | function | 24 | no | async function runCreate(ctx) { |
| task | const | 26 | no | const task = flags.task ?? args.join(&#39; &#39;); |
| store | const | 27 | no | const store = await storeFor(ctx); |
| run | const | 28 | no | const run = store.create({ task, ...(flags.conversation ? { conversationId: flags.conversation } : {}) }); |
| runList | function | 32 | no | async function runList(ctx) { |
| store | const | 34 | no | const store = await storeFor(ctx); |
| runs | const | 35 | no | const runs = store.list(); |
| runGet | function | 39 | no | async function runGet(ctx) { |
| store | const | 43 | no | const store = await storeFor(ctx); |
| run | const | 44 | no | const run = store.get(args[0]); |
| runStep | function | 48 | no | async function runStep(ctx) { |
| runId | const | 51 | no | const runId = args[0]; |
| argsJson | variable | 53 | no | let argsJson = {}; |
| key | const | 58 | no | const key = flags.key ?? randomUUID(); |
| emit | function | 59 | no | const emit = (result) =&gt; out.emit(result, (o) =&gt; o.line(JSON.stringify(result, null, 2))); |
| paths | const | 65 | no | const paths = ctx.paths; |
| runtime | const | 66 | no | const runtime = await defaultConversationRuntime({ paths, profileStore: ctx.profiles(), familyStore: ctx.families(), port: ctx.port }); |
| store | const | 68 | no | const store = createHarnessRunStore({ dir: paths.root + &#39;/harness-runs&#39;, toolExecutor: conversationToolExecutor(runtime), retryableTools: HARNESS_RETRYABLE_TOOLS }); |
| out2 | const | 69 | no | const out2 = await store.step(runId, { key, tool: flags.tool, args: argsJson }); |
| runNote | function | 75 | no | async function runNote(ctx) { |
| context | variable | 79 | no | let context; |
| store | const | 81 | no | const store = await storeFor(ctx); |
| run | const | 82 | no | const run = store.note(args[0], { context }); |
| runFinish | function | 86 | no | async function runFinish(ctx) { |
| store | const | 90 | no | const store = await storeFor(ctx); |
| run | const | 91 | no | const run = store.finish(args[0], { status: flags.status }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |
| ../lib/registry.mjs | import | 7 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 8 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/config.mjs | import | 9 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../../src/capture/harness-runs.mjs | import | 10 | [studio/src/capture/harness-runs.mjs](../../src/capture/harness-runs.mjs.md) |
| ../../src/studio/conversation-api.mjs | import | 11 | [studio/src/studio/conversation-api.mjs](../../src/studio/conversation-api.mjs.md) |
| ../../src/studio/harness-api.mjs | import | 12 | [studio/src/studio/harness-api.mjs](../../src/studio/harness-api.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/run.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Durable harness runs from the CLI: create, step (via the same conversation tools), finish,
// inspect. Each invocation is a separate process — resumability across processes is the point:
// state lives in <data-dir>/harness-runs/<runId>.run.json, never in the process. Steps execute
// through the same conversation runtime and tool validation as the studio server; there is no
// second browser actor here.
import { randomUUID } from 'node:crypto';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError } from '../lib/ui.mjs';
import { EXIT } from '../../src/config.mjs';
import { createHarnessRunStore } from '../../src/capture/harness-runs.mjs';
import { defaultConversationRuntime } from '../../src/studio/conversation-api.mjs';
import { conversationToolExecutor, HARNESS_RETRYABLE_TOOLS } from '../../src/studio/harness-api.mjs';

defineGroup('run', {
  summary: 'Durable harness runs: persistent task/run identity with a resumable step ledger', section: 'Knowledge', default: 'list',
  description: 'Run state lives in <data-dir>/harness-runs/<runId>.run.json, never in the process, so create/step/finish may happen in different processes. Steps execute the same nine conversation tools through the same runtime owner as the studio server; there is no second browser actor. Aliases: runs.',
  aliases: ['runs'],
});

async function storeFor(ctx) {
  return createHarnessRunStore({ dir: ctx.paths ? ctx.paths.root + '/harness-runs' : undefined, toolExecutor: async () => { throw usageError('This subcommand does not execute steps'); } });
}

async function runCreate(ctx) {
  const { flags, args, out } = ctx;
  const task = flags.task ?? args.join(' ');
  const store = await storeFor(ctx);
  const run = store.create({ task, ...(flags.conversation ? { conversationId: flags.conversation } : {}) });
  out.emit(run, (o) => o.line(`${run.id}  ${run.status}  ${JSON.stringify(run.task.description).slice(0, 80)}`));
}

async function runList(ctx) {
  const { out } = ctx;
  const store = await storeFor(ctx);
  const runs = store.list();
  out.emit({ runs }, (o) => { for (const r of runs) o.line(`${r.id}  ${r.status}  steps=${r.steps}  ${String(r.taskDescription ?? '').slice(0, 60)}`); if (!runs.length) o.line('no runs'); });
}

async function runGet(ctx) {
  const { args } = ctx;
  const { out } = ctx;
  if (!args[0]) throw usageError('Usage: studio run get <runId>');
  const store = await storeFor(ctx);
  const run = store.get(args[0]);
  out.emit(run, (o) => o.line(JSON.stringify(run, null, 2)));
}

async function runStep(ctx) {
  const { args } = ctx;
  const { flags, out } = ctx;
  const runId = args[0];
  if (!runId || !flags.tool) throw usageError('Usage: studio run step <runId> --tool NAME [--arguments JSON] --key KEY [--execute]');
  let argsJson = {};
  if (flags.arguments) {
    try { argsJson = JSON.parse(flags.arguments); } catch { throw usageError('--arguments must be a JSON object'); }
    if (!argsJson || typeof argsJson !== 'object' || Array.isArray(argsJson)) throw usageError('--arguments must be a JSON object');
  }
  const key = flags.key ?? randomUUID();
  const emit = (result) => out.emit(result, (o) => o.line(JSON.stringify(result, null, 2)));
  if (!flags.execute || flags['dry-run']) {
    emit({ dryRun: true, runId, tool: flags.tool, arguments: argsJson, key, browserAction: false,
      note: 'create the run, then --execute this step; the tool executes through the same runtime as the studio server' });
    return;
  }
  const paths = ctx.paths;
  const runtime = await defaultConversationRuntime({ paths, profileStore: ctx.profiles(), familyStore: ctx.families(), port: ctx.port });
  try {
    const store = createHarnessRunStore({ dir: paths.root + '/harness-runs', toolExecutor: conversationToolExecutor(runtime), retryableTools: HARNESS_RETRYABLE_TOOLS });
    const out2 = await store.step(runId, { key, tool: flags.tool, args: argsJson });
    emit({ run: out2.run, step: out2.step, replayed: out2.replayed, ...(out2.replayed ? { note: out2.note } : { result: out2.result }) });
    if (out2.step.status === 'failed') process.exitCode = EXIT.ENVIRONMENT;
  } finally { await runtime.close(); }
}

async function runNote(ctx) {
  const { args } = ctx;
  const { flags, out } = ctx;
  if (!args[0] || !flags.context) throw usageError('Usage: studio run context <runId> --context JSON');
  let context;
  try { context = JSON.parse(flags.context); } catch { throw usageError('--context must be a JSON object'); }
```

_First 80 of 140 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
