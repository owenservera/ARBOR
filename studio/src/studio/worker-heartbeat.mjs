// VIVIM Host M1: evidence-only heartbeat. No worker supervision or Chrome access.
import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const WORKERS = new Set(['relay', 'chatWorker']);
const CHAT_TARGETS = new Set(['chatgpt','claude','qwen','zai']);
export function createWorkerHeartbeat({ root, worker, now = () => new Date().toISOString(), pid = process.pid, providers = [] } = {}) {
  if (!root || !WORKERS.has(worker)) throw new Error('A known worker and private data root are required');
  if (!Array.isArray(providers) || providers.length > 4 || providers.some(p=>!CHAT_TARGETS.has(p)) ||
      new Set(providers).size !== providers.length || (worker !== 'chatWorker' && providers.length))
    throw new Error('Invalid worker provider capabilities');
  const startedAt = now(), instanceId = randomUUID();
  const file = path.join(root, 'bridge', 'health', `${worker}.json`);
  const record = (outcome = 'ok') => {
    if (!['ok', 'error'].includes(outcome)) throw new Error('Unknown heartbeat outcome');
    const receipt = { schema: 'vivim.worker-heartbeat/1', worker, instanceId, pid, startedAt, observedAt: now(), outcome,
      ...(worker==='chatWorker'?{providers}: {}) };
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
