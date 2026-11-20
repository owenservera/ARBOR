# File: studio/src/studio/worker-heartbeat.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/worker-heartbeat.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1250 B |
| Lines | 23 |
| Hash | 8a798a8004b0 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORKERS | const | 6 | no | const WORKERS = new Set([&#39;relay&#39;, &#39;chatWorker&#39;]); |
| createWorkerHeartbeat | function | 7 | yes | export function createWorkerHeartbeat({ root, worker, now = () =&gt; new Date().toISOString(), pid = process.pid } = {}) { |
| startedAt | const | 9 | no | const startedAt = now(), instanceId = randomUUID(); |
| file | const | 10 | no | const file = path.join(root, &#39;bridge&#39;, &#39;health&#39;, `${worker}.json`); |
| receipt | const | 13 | no | const receipt = { schema: &#39;vivim.worker-heartbeat/1&#39;, worker, instanceId, pid, startedAt, observedAt: now(), outcome }; |
| temp | const | 14 | no | const temp = `${file}.${pid}.${instanceId}.tmp`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/test/diagnostics.test.mjs](../../../apps/vivim-host/test/diagnostics.test.mjs.md) | ../../../studio/src/studio/worker-heartbeat.mjs |
| [apps/vivim-host/test/host-worker-lifecycle.test.mjs](../../../apps/vivim-host/test/host-worker-lifecycle.test.mjs.md) | ../../../studio/src/studio/worker-heartbeat.mjs |
| [studio/bin/commands/relay.mjs](../../bin/commands/relay.mjs.md) | ../../src/studio/worker-heartbeat.mjs |
| [studio/bin/relay-chat-mvp.mjs](../../bin/relay-chat-mvp.mjs.md) | ../src/studio/worker-heartbeat.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM Host M1: evidence-only heartbeat. No worker supervision or Chrome access.
import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const WORKERS = new Set(['relay', 'chatWorker']);
export function createWorkerHeartbeat({ root, worker, now = () => new Date().toISOString(), pid = process.pid } = {}) {
  if (!root || !WORKERS.has(worker)) throw new Error('A known worker and private data root are required');
  const startedAt = now(), instanceId = randomUUID();
  const file = path.join(root, 'bridge', 'health', `${worker}.json`);
  const record = (outcome = 'ok') => {
    if (!['ok', 'error'].includes(outcome)) throw new Error('Unknown heartbeat outcome');
    const receipt = { schema: 'vivim.worker-heartbeat/1', worker, instanceId, pid, startedAt, observedAt: now(), outcome };
    const temp = `${file}.${pid}.${instanceId}.tmp`;
    mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    try {
      writeFileSync(temp, JSON.stringify(receipt), { flag: 'w', mode: 0o600 });
      renameSync(temp, file);
    } finally { rmSync(temp, { force: true }); }
    return receipt;
  };
  return { record, file };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
