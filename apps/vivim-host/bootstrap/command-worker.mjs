// Executes owner bootstrap actions that arrived through the phone relay.
// The relay only validates the shape; this worker is the only place a phone command
// can mutate personalization. Allowlist only: no text is interpreted, no shell, no SQL.
import { randomBytes } from 'node:crypto';
import { createBridgeStore } from '../../../studio/src/studio/bridge-commands.mjs';
import { BOOTSTRAP_ACTIONS } from '../control/bootstrap-actions.mjs';

export const WORKER_SCHEMA = 'vivim.bootstrap-command-worker/1';
export { BOOTSTRAP_ACTIONS };
export function createBootstrapCommandWorker({ root, runtime, store = null, intervalMs = 3000, log = () => {} } = {}) {
  if (!root) throw new TypeError('Bootstrap command worker: root required');
  if (!runtime || typeof runtime.undoTheme !== 'function') throw new TypeError('Bootstrap command worker: runtime required');
  const bridge = store ?? createBridgeStore({ root });
  let timer = null, running = false, closed = false;
  const receipts = [];

  function execute(command) {
    const action = command.action;
    if (command.consumer !== 'bootstrap' || command.mode !== 'bootstrap' || command.origin !== 'relay' || command.text !== action)
      throw Object.assign(new Error('Bootstrap command origin or shape invalid'), { code: 'BOOTSTRAP_INVALID_SOURCE' });
    if (!BOOTSTRAP_ACTIONS.includes(action)) throw Object.assign(new Error('Unsupported bootstrap action'), { code: 'BOOTSTRAP_ACTION_UNSUPPORTED' });
    if (action === 'grant-visual') {
      const grant = runtime.grantBootstrap({ scope: 'onboarding-visual' });
      return { action, granted: grant.scope };
    }
    if (action === 'choose-preset') {
      if (!['lab','tide','dusk','ember','grove','ink','dawn'].includes(command.preset))
        throw Object.assign(new Error('Invalid preset'), { code: 'BOOTSTRAP_INVALID_PRESET' });
      const out = runtime.choosePreset({ preset: command.preset, requestId: 'relay-' + command.id });
      return { action, preset: command.preset, revision: out.revision };
    }
    if (action === 'personalize') {
      throw Object.assign(new Error('BOOTSTRAP_PERSONALIZE_DISABLED: scheduler is a disabled draft'), { code: 'BOOTSTRAP_PERSONALIZE_DISABLED' });
    }
    if (action === 'undo-theme') {
      const out = runtime.undoTheme({ requestId: 'relay-' + command.id });
      return { action, undone: out.undone, active: out.active, provisional: out.provisional };
    }
    if (action==='undo-ui-revision'||action==='apply-proposal')
      throw Object.assign(new Error('Visual changes require a fresh Host control plan and explicit approval'),{code:'CONTROL_VISUAL_APPROVAL_REQUIRED'});
    throw Object.assign(new Error('Unsupported bootstrap action'), { code: 'BOOTSTRAP_ACTION_UNSUPPORTED' });
  }

  // One pass over the queue. The bridge uses an exclusive cross-process claim lock;
  // a crash-left claimed command is never automatically retried.
  function tick() {
    if (closed) return [];
    const done = [];
    const queued = bridge.list({ status: 'queued', consumer: 'bootstrap', limit: 100 }).items
      .filter(r => r.mode === 'bootstrap')
      .reverse();
    for (const item of queued) {
      let claimed;
      const token = randomBytes(8).toString('hex');
      try { claimed = bridge.claim(item.id, { by: 'bootstrap', token }); } catch { continue; }
      if (!claimed) continue;
      // Prove this worker still owns the claim. A concurrent consumer can append a newer
      // revision; only the revision that reads back with our token may execute.
      try {
        const latest = bridge.get(claimed.id);
        if (!latest || latest.status !== 'claimed' || latest.claimToken !== token) {
          log(`bootstrap ${claimed.id} claim lost to another consumer`);
          continue;
        }
      } catch { continue; }
      try {
        const result = execute(claimed);
        const text = JSON.stringify({ schema: WORKER_SCHEMA, ...result });
        bridge.reply(claimed.id, text, { status: 'done' });
        receipts.push({ id: claimed.id, status: 'done', ...result });
        log(`bootstrap ${claimed.id} ${result.action} undone=${String(result.undone)} active=${String(result.active)}`);
        done.push({ id: claimed.id, status: 'done', ...result });
      } catch (error) {
        const reason = String(error?.message ?? error).slice(0, 200);
        try { bridge.reply(claimed.id, reason, { status: 'failed' }); } catch { /* the queue stays claimed; never resend */ }
        receipts.push({ id: claimed.id, status: 'failed', reason });
        log(`bootstrap ${claimed.id} failed: ${reason}`);
        done.push({ id: claimed.id, status: 'failed', reason });
      }
    }
    return done;
  }

  return {
    schema: WORKER_SCHEMA, actions: [...BOOTSTRAP_ACTIONS], tick,
    receipts: () => receipts.slice(-20),
    start() {
      if (timer || closed) return;
      timer = setInterval(() => { if (running) return; running = true; try { tick(); } catch (error) { log('tick failed: ' + String(error?.message ?? error)); } finally { running = false; } }, intervalMs);
      timer.unref?.();
    },
    stop() { if (timer) clearInterval(timer); timer = null; },
    close() { closed = true; this.stop(); }
  };
}
