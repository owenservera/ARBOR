# File: apps/vivim-host/grokbot/worker.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/grokbot/worker.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2324 B |
| Lines | 39 |
| Hash | 6d7e7188ca1e |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createGrokbotWorker | function | 5 | yes | export function createGrokbotWorker({ dataRoot, adapter, log = () =&gt; {} }) { |
| store | const | 7 | no | const store = createBridgeStore({ root: dataRoot }); |
| ready | const | 8 | no | const ready = !!adapter &amp;&amp; typeof adapter.execute === &#39;function&#39;; |
| job | const | 17 | no | const job = store.claim(null, { by: &#39;grokbot&#39; }); |
| output | const | 25 | no | const output = await adapter.execute({ id: job.id, text: job.text, kind: job.kind, stage: job.stage ?? null }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../../studio/src/studio/bridge-commands.mjs | import | 3 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/grokbot/run.mjs](./run.mjs.md) | ./worker.mjs |
| [apps/vivim-host/test/grokbot-worker.test.mjs](../test/grokbot-worker.test.mjs.md) | ../grokbot/worker.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Native Grokbot dispatch seam: no assumed CLI, shell, CDP or provider API.
// A platform-specific, verified adapter must provide execute({id,text,kind,stage}).
import { createBridgeStore } from '../../../studio/src/studio/bridge-commands.mjs';

export function createGrokbotWorker({ dataRoot, adapter, log = () => {} }) {
  if (!dataRoot) throw new TypeError('dataRoot is required');
  const store = createBridgeStore({ root: dataRoot });
  const ready = !!adapter && typeof adapter.execute === 'function';
  return {
    status() {
      return { available: ready, protocol: ready ? (adapter.protocol || 'configured-native-adapter') : null,
        reason: ready ? null : 'No verified Grokbot native execution interface configured', consumer: 'grokbot' };
    },
    async runOnce() {
      // Never claim a job if its execution authority is not configured.
      if (!ready) return { state: 'unavailable', claimed: 0 };
      const job = store.claim(null, { by: 'grokbot' });
      if (!job) return { state: 'idle', claimed: 0 };
      log({ event: 'claimed', id: job.id });
      if (!['inspect','analyze','research'].includes(job.stage)) {
        store.reply(job.id, 'Unsupported or unapproved task class; no native execution attempted', { status: 'failed' });
        return { state: 'failed', id: job.id, reason: 'TASK_CLASS_NOT_APPROVED' };
      }
      try {
        const output = await adapter.execute({ id: job.id, text: job.text, kind: job.kind, stage: job.stage ?? null });
        if (!output || output.confirmed !== true || typeof output.text !== 'string' || !output.text.trim())
          return { state: 'uncertain', id: job.id, reason: 'Adapter returned no confirmed outcome' };
        // Complete only once the native adapter positively confirms a finished task.
        store.reply(job.id, output.text.slice(0, 64000), { status: 'done' });
        log({ event: 'done', id: job.id });
        return { state: 'done', id: job.id };
      } catch (error) {
        // A native call may have executed even when the response is lost. Never replay.
        log({ event: 'uncertain', id: job.id, error: error?.name || 'Error' });
        return { state: 'uncertain', id: job.id, reason: 'Native execution outcome unknown; no automatic retry' };
      }
    },
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
