# File: apps/vivim-host/test/diagnostics.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/diagnostics.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4073 B |
| Lines | 58 |
| Hash | 971466412e79 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| withData | function | 10 | no | function withData(fn) { |
| root | const | 11 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-m1-&#39;)); |
| DATE | const | 14 | no | const DATE = &#39;2026-10-31T10:00:00.000Z&#39;; |
| beat | const | 17 | no | const beat = createWorkerHeartbeat({ root, worker: &#39;relay&#39;, now: () =&gt; DATE }); |
| bridge | const | 28 | no | const bridge = path.join(root, &#39;bridge&#39;); mkdirSync(bridge); |
| cmd | const | 29 | no | const cmd = &#39;cmd-1234567890abcdef&#39;; |
| rows | const | 30 | no | const rows = [ |
| snap | variable | 36 | no | let snap = messageJourney(root, { now: DATE }); |
| bridge | const | 49 | no | const bridge = path.join(root, &#39;bridge&#39;), journal = path.join(root, &#39;journal&#39;); |
| requestId | const | 51 | no | const requestId = &#39;11111111-2222-4333-8444-555555555555&#39;; |
| snap | const | 54 | no | const snap = messageJourney(root,{now:DATE,journalRoot:journal}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../../../studio/src/studio/worker-heartbeat.mjs | import | 6 | [studio/src/studio/worker-heartbeat.mjs](../../../studio/src/studio/worker-heartbeat.mjs.md) |
| ../diagnostics.mjs | import | 7 | [apps/vivim-host/diagnostics.mjs](../diagnostics.mjs.md) |
| ../server.mjs | import | 8 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createWorkerHeartbeat } from '../../../studio/src/studio/worker-heartbeat.mjs';
import { workerHealth, messageJourney } from '../diagnostics.mjs';
import { hostSnapshot } from '../server.mjs';

function withData(fn) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-m1-'));
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
const DATE = '2026-10-31T10:00:00.000Z';
test('healthy heartbeat is evidenced; stale, error, malformed and absent are never online', () => withData(root => {
  assert.equal(workerHealth(root, 'relay', { now: DATE }).state, 'unknown');
  const beat = createWorkerHeartbeat({ root, worker: 'relay', now: () => DATE });
  beat.record();
  assert.equal(workerHealth(root, 'relay', { now: DATE }).state, 'online');
  assert.equal(workerHealth(root, 'relay', { now: '2026-10-31T10:00:20.000Z' }).state, 'stale');
  beat.record('error');
  assert.equal(workerHealth(root, 'relay', { now: DATE }).state, 'blocked');
  assert.equal(workerHealth(root, 'chatWorker', { now: DATE }).state, 'unknown');
  assert.throws(() => createWorkerHeartbeat({root,worker:'anything'}));
  assert.doesNotMatch(JSON.stringify(hostSnapshot({ dataRoot: root, now: () => DATE })), /secret/);
}));
test('message journey distinguishes claimed, pending cloud update, cloud ack without declaring phone delivery', () => withData(root => {
  const bridge = path.join(root, 'bridge'); mkdirSync(bridge);
  const cmd = 'cmd-1234567890abcdef';
  const rows = [
    { id: cmd, rev: 1, status: 'queued', origin: 'relay', text: 'PRIVATE PROMPT', createdAt: DATE, updatedAt: DATE, consumer: 'harness' },
    { id: cmd, rev: 2, status: 'claimed', origin: 'relay', text: 'PRIVATE PROMPT', claimedBy: 'harness', createdAt: DATE, updatedAt: DATE, consumer: 'harness' },
    { id: cmd, rev: 3, status: 'done', origin: 'relay', text: 'PRIVATE PROMPT', result: 'PRIVATE ANSWER', claimedBy: 'harness', createdAt: DATE, updatedAt: DATE, consumer: 'harness' },
  ];
  writeFileSync(path.join(bridge, 'commands.jsonl'), rows.map(JSON.stringify).join('\n')+'\ninvalid tail\n');
  let snap = messageJourney(root, { now: DATE });
  assert.equal(snap.recent.length, 1);
  assert.equal(snap.recent[0].currentStage, 'waiting_for_cloud_update');
  assert.equal(snap.recent[0].evidence.cloudPulled, true);
  assert.equal(snap.recent[0].evidence.consumerClaimed, true);
  assert.equal(snap.recent[0].evidence.phoneDisplayed, null);
  assert.doesNotMatch(JSON.stringify(snap), /PRIVATE PROMPT|PRIVATE ANSWER/);
  writeFileSync(path.join(bridge, 'relay-state.json'), JSON.stringify({ pushed: { [cmd]: 3 } }));
  snap = messageJourney(root, { now: DATE });
  assert.equal(snap.recent[0].currentStage, 'cloud_update_accepted');
  assert.equal(snap.recent[0].evidence.phoneDisplayed, null);
}));
test('journal link remains metadata-only and uncertain cannot be called delivered', () => withData(root => {
  const bridge = path.join(root, 'bridge'), journal = path.join(root, 'journal');
  mkdirSync(bridge); mkdirSync(journal);
  const requestId = '11111111-2222-4333-8444-555555555555';
  writeFileSync(path.join(journal, `${requestId}.json`), JSON.stringify({ state:'uncertain', submitted:'unknown', prompt:'SENSITIVE', reply:'SENSITIVE' }));
  writeFileSync(path.join(bridge, 'commands.jsonl'), JSON.stringify({id:'cmd-aaaaaaaaaaaaaaaa', status:'claimed', rev:3, consumer:'harness', claimedBy:'harness', origin:'relay', result:`sent to claude, waiting… (request ${requestId})`, createdAt:DATE, updatedAt:DATE}));
  const snap = messageJourney(root,{now:DATE,journalRoot:journal});
  assert.equal(snap.recent[0].currentStage, 'send_outcome_uncertain');
  assert.equal(snap.recent[0].evidence.journalState, 'uncertain');
  assert.doesNotMatch(JSON.stringify(snap), /SENSITIVE|sent to claude/);
}));
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
