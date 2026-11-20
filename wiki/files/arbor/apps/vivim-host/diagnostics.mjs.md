# File: apps/vivim-host/diagnostics.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/vivim-host/diagnostics.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6219 B |
| Lines | 83 |
| Hash | 52dab479e203 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VALID | const | 5 | no | const VALID = new Set([&#39;queued&#39;, &#39;claimed&#39;, &#39;done&#39;, &#39;failed&#39;]); |
| ID | const | 6 | no | const ID = /^cmd-[0-9a-f]{16}$/; |
| REQUEST | const | 7 | no | const REQUEST = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; |
| HEALTH | const | 8 | no | const HEALTH = new Set([&#39;relay&#39;, &#39;chatWorker&#39;]); |
| readBounded | function | 9 | no | function readBounded(file, bytes) { |
| parseJson | function | 13 | no | function parseJson(file, bytes = 1024 * 1024) { |
| ageMs | function | 16 | no | function ageMs(timestamp, now) { |
| n | const | 17 | no | const n = Date.parse(timestamp), t = Date.parse(now); |
| workerHealth | function | 21 | yes | export function workerHealth(dataRoot, worker, { now = new Date().toISOString(), ttlMs = 15000 } = {}) { |
| r | const | 23 | no | const r = parseJson(path.join(dataRoot, &#39;bridge&#39;, &#39;health&#39;, `${worker}.json`), 4096); |
| age | const | 29 | no | const age = ageMs(r.observedAt, now); |
| base | const | 31 | no | const base = { lastHeartbeatAt: r.observedAt, observedFrom: &#39;local worker heartbeat&#39;, ageMs: age }; |
| messageJourney | function | 37 | yes | export function messageJourney(dataRoot, { now = new Date().toISOString(), limit = 12, journalRoot = null } = {}) { |
| file | const | 38 | no | const file = path.join(dataRoot, &#39;bridge&#39;, &#39;commands.jsonl&#39;); |
| raw | variable | 39 | no | let raw; |
| latest | const | 42 | no | const latest = new Map(); |
| requests | const | 43 | no | const requests = new Map(); |
| r | const | 47 | no | const r = JSON.parse(line); |
| prev | const | 55 | no | const prev = latest.get(r.id); |
| relayState | const | 60 | no | const relayState = parseJson(path.join(dataRoot, &#39;bridge&#39;, &#39;relay-state.json&#39;)); |
| pushed | const | 61 | no | const pushed = relayState?.pushed &amp;&amp; typeof relayState.pushed === &#39;object&#39; ? relayState.pushed : {}; |
| entries | const | 62 | no | const entries = [...latest.values()].sort((a,b) =&gt; String(b.updatedAt \|\| b.createdAt \|\| &#39;&#39;).localeCompare(String(a.updatedAt \|\| a.createdAt \|\| &#39;&#39;))).slice(0, Math.max(1, Math.min(25,limit))); |
| recent | const | 63 | no | const recent = entries.map(r =&gt; { const claimed = r.status !== &#39;queued&#39; &amp;&amp; r.claimedBy === &#39;harness&#39;; const localComplete = r.status === &#39;done&#39; \|\| r.status === &#39;failed&#39;; const cloudAcknowledged = r.o… |
| claimed | const | 64 | no | const claimed = r.status !== &#39;queued&#39; &amp;&amp; r.claimedBy === &#39;harness&#39;; |
| localComplete | const | 65 | no | const localComplete = r.status === &#39;done&#39; \|\| r.status === &#39;failed&#39;; |
| cloudAcknowledged | const | 66 | no | const cloudAcknowledged = r.origin === &#39;relay&#39; &amp;&amp; localComplete &amp;&amp; Number.isSafeInteger(pushed[r.id]) &amp;&amp; pushed[r.id] &gt;= r.rev; |
| requestId | const | 68 | no | const requestId = requests.get(r.id) \|\| null; |
| journal | const | 69 | no | const journal = requestId &amp;&amp; journalRoot ? parseJson(path.join(journalRoot, `${requestId}.json`), 128 * 1024) : null; |
| journalState | const | 70 | no | const journalState = [&#39;accepted&#39;, &#39;blocked&#39;, &#39;sent&#39;, &#39;observed&#39;, &#39;uncertain&#39;, &#39;failed&#39;].includes(journal?.state) ? journal.state : null; |
| currentStage | variable | 71 | no | let currentStage = r.status === &#39;queued&#39; ? &#39;waiting_for_consumer&#39; : r.status === &#39;claimed&#39; ? &#39;processing_locally&#39; : cloudAcknowledged ? &#39;cloud_update_accepted&#39; : &#39;waiting_for_cloud_update&#39;; |
| age | const | 74 | no | const age = ageMs(r.updatedAt \|\| r.createdAt, now); |
| diagnosticCode | const | 75 | no | const diagnosticCode = r.status === &#39;queued&#39; ? &#39;WAITING_FOR_CONSUMER&#39; : r.status === &#39;claimed&#39; ? &#39;CONSUMER_PROCESSING&#39; : cloudAcknowledged ? &#39;REMOTE_ACKNOWLEDGED&#39; : &#39;AWAITING_CLOUD_UPDATE&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 2 | external |
| node:fs | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](./server.mjs.md) | ./diagnostics.mjs |
| [apps/vivim-host/test/diagnostics.test.mjs](./test/diagnostics.test.mjs.md) | ../diagnostics.mjs |
| [apps/vivim-host/test/insights.test.mjs](./test/insights.test.mjs.md) | ../diagnostics.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Read-only, metadata-only Host M1 diagnostics. Never contacts an AI or reads message bodies into responses.
import path from 'node:path';
import { existsSync, readFileSync, statSync } from 'node:fs';

const VALID = new Set(['queued', 'claimed', 'done', 'failed']);
const ID = /^cmd-[0-9a-f]{16}$/;
const REQUEST = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEALTH = new Set(['relay', 'chatWorker']);
function readBounded(file, bytes) {
  if (!existsSync(file) || statSync(file).size > bytes) return null;
  return readFileSync(file, 'utf8');
}
function parseJson(file, bytes = 1024 * 1024) {
  try { const raw = readBounded(file, bytes); return raw === null ? null : JSON.parse(raw); } catch { return null; }
}
function ageMs(timestamp, now) {
  const n = Date.parse(timestamp), t = Date.parse(now);
  return Number.isFinite(n) && Number.isFinite(t) && n <= t + 2000 ? Math.max(0, t - n) : null;
}

export function workerHealth(dataRoot, worker, { now = new Date().toISOString(), ttlMs = 15000 } = {}) {
  if (!HEALTH.has(worker)) throw new Error('Unknown worker');
  const r = parseJson(path.join(dataRoot, 'bridge', 'health', `${worker}.json`), 4096);
  if (!r || r.schema !== 'vivim.worker-heartbeat/1' || r.worker !== worker ||
      !/^[0-9a-f-]{36}$/i.test(r.instanceId ?? '') || !Number.isInteger(r.pid) || r.pid <= 0 ||
      !['ok', 'error'].includes(r.outcome)) {
    return { state: 'unknown', diagnosticCode: 'NO_HEARTBEAT', reason: 'No validated worker heartbeat observed', nextAction: 'Check whether this worker is running' };
  }
  const age = ageMs(r.observedAt, now);
  if (age === null) return { state: 'unknown', diagnosticCode: 'INVALID_HEARTBEAT_TIME', reason: 'Worker heartbeat has an invalid timestamp', nextAction: 'Check PC clock and worker process' };
  const base = { lastHeartbeatAt: r.observedAt, observedFrom: 'local worker heartbeat', ageMs: age };
  if (age > ttlMs) return { ...base, state: 'stale', diagnosticCode: 'HEARTBEAT_STALE', reason: 'No recent worker cycle observed', nextAction: 'Check worker process; do not resend pending messages' };
  if (r.outcome === 'error') return { ...base, state: 'blocked', diagnosticCode: 'WORKER_CYCLE_FAILED', reason: 'Worker reported a failed cycle', nextAction: 'Inspect local worker logs and connection' };
  return { ...base, state: 'online', diagnosticCode: 'WORKER_CYCLE_OK', evidence: 'Recent successful worker cycle', nextAction: null };
}

export function messageJourney(dataRoot, { now = new Date().toISOString(), limit = 12, journalRoot = null } = {}) {
  const file = path.join(dataRoot, 'bridge', 'commands.jsonl');
  let raw;
  try { raw = readBounded(file, 8 * 1024 * 1024); } catch { return { state: 'unavailable', reason: 'Bridge metadata cannot be read', recent: [] }; }
  if (raw === null) return { state: existsSync(file) ? 'unavailable' : 'not_observed', recent: [] };
  const latest = new Map();
  const requests = new Map();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (ID.test(r?.id) && VALID.has(r?.status) && Number.isSafeInteger(r.rev) && r.rev >= 1) {
        // Interim revisions contain the request reference; the final answer replaces result text.
        // Store only the ID for correlation, never the prompt or reply.
        if (r.consumer === 'harness' && r.origin === 'relay' && typeof r.result === 'string') {
          const match = r.result.match(/\(request ([0-9a-f-]{36})\)/i);
          if (match && REQUEST.test(match[1])) requests.set(r.id, match[1]);
        }
        const prev = latest.get(r.id);
        if (!prev || r.rev >= prev.rev) latest.set(r.id, r);
      }
    } catch { /* tolerate torn last JSONL line */ }
  }
  const relayState = parseJson(path.join(dataRoot, 'bridge', 'relay-state.json'));
  const pushed = relayState?.pushed && typeof relayState.pushed === 'object' ? relayState.pushed : {};
  const entries = [...latest.values()].sort((a,b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))).slice(0, Math.max(1, Math.min(25,limit)));
  const recent = entries.map(r => {
    const claimed = r.status !== 'queued' && r.claimedBy === 'harness';
    const localComplete = r.status === 'done' || r.status === 'failed';
    const cloudAcknowledged = r.origin === 'relay' && localComplete && Number.isSafeInteger(pushed[r.id]) && pushed[r.id] >= r.rev;
    // Historical message text was discarded; retain only a vetted request reference.
    const requestId = requests.get(r.id) || null;
    const journal = requestId && journalRoot ? parseJson(path.join(journalRoot, `${requestId}.json`), 128 * 1024) : null;
    const journalState = ['accepted', 'blocked', 'sent', 'observed', 'uncertain', 'failed'].includes(journal?.state) ? journal.state : null;
    let currentStage = r.status === 'queued' ? 'waiting_for_consumer' : r.status === 'claimed' ? 'processing_locally' : cloudAcknowledged ? 'cloud_update_accepted' : 'waiting_for_cloud_update';
    if (r.status === 'failed') currentStage = cloudAcknowledged ? 'failure_reported_to_cloud' : 'failure_waiting_for_cloud';
    if (journalState === 'uncertain' && !localComplete) currentStage = 'send_outcome_uncertain';
    const age = ageMs(r.updatedAt || r.createdAt, now);
    const diagnosticCode = r.status === 'queued' ? 'WAITING_FOR_CONSUMER' : r.status === 'claimed' ? 'CONSUMER_PROCESSING' : cloudAcknowledged ? 'REMOTE_ACKNOWLEDGED' : 'AWAITING_CLOUD_UPDATE';
    return { id: r.id, consumer: r.consumer === 'harness' ? 'harness' : r.consumer === 'grokbot' ? 'grokbot' : 'unknown', status: r.status,
      currentStage, diagnosticCode, updatedAt: r.updatedAt || r.createdAt || null, ageMs: age,
      evidence: { cloudPulled: r.origin === 'relay', locallyQueued: true, consumerClaimed: claimed, localTerminal: localComplete,
        cloudUpdateAccepted: cloudAcknowledged, phoneDisplayed: null, journalState },
      ...(requestId ? { requestId } : {}) };
```

_First 80 of 84 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
