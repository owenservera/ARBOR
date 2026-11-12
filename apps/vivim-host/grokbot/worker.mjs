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
