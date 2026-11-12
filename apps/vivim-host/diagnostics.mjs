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
  });
  return { state: 'observed', recent, note: 'Cloud update accepted does not prove the phone displayed the reply' };
}
