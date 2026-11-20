# File: apps/vivim-host/bootstrap/command-worker.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/command-worker.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5320 B |
| Lines | 95 |
| Hash | 837a664ca0b6 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORKER_SCHEMA | const | 8 | yes | export const WORKER_SCHEMA = &#39;vivim.bootstrap-command-worker/1&#39;; |
| BOOTSTRAP_ACTIONS | export | 9 | yes | export { BOOTSTRAP_ACTIONS } |
| createBootstrapCommandWorker | function | 10 | yes | export function createBootstrapCommandWorker({ root, runtime, store = null, intervalMs = 3000, log = () =&gt; {} } = {}) { |
| bridge | const | 13 | no | const bridge = store ?? createBridgeStore({ root }); |
| timer | variable | 14 | no | let timer = null, running = false, closed = false; |
| receipts | const | 15 | no | const receipts = []; |
| execute | function | 17 | no | function execute(command) { |
| action | const | 18 | no | const action = command.action; |
| grant | const | 23 | no | const grant = runtime.grantBootstrap({ scope: &#39;onboarding-visual&#39; }); |
| out | const | 29 | no | const out = runtime.choosePreset({ preset: command.preset, requestId: &#39;relay-&#39; + command.id }); |
| out | const | 36 | no | const out = runtime.undoTheme({ requestId: &#39;relay-&#39; + command.id }); |
| tick | function | 46 | no | function tick() { |
| done | const | 48 | no | const done = []; |
| queued | const | 49 | no | const queued = bridge.list({ status: &#39;queued&#39;, consumer: &#39;bootstrap&#39;, limit: 100 }).items |
| claimed | variable | 53 | no | let claimed; |
| token | const | 54 | no | const token = randomBytes(8).toString(&#39;hex&#39;); |
| latest | const | 60 | no | const latest = bridge.get(claimed.id); |
| result | const | 67 | no | const result = execute(claimed); |
| text | const | 68 | no | const text = JSON.stringify({ schema: WORKER_SCHEMA, ...result }); |
| reason | const | 74 | no | const reason = String(error?.message ?? error).slice(0, 200); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| ../../../studio/src/studio/bridge-commands.mjs | import | 5 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |
| ../control/bootstrap-actions.mjs | import | 6 | [apps/vivim-host/control/bootstrap-actions.mjs](../control/bootstrap-actions.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./bootstrap/command-worker.mjs |
| [apps/vivim-host/test/bootstrap-actions-allowlist.test.mjs](../test/bootstrap-actions-allowlist.test.mjs.md) | ../bootstrap/command-worker.mjs |
| [apps/vivim-host/test/bootstrap-command-apply.test.mjs](../test/bootstrap-command-apply.test.mjs.md) | ../bootstrap/command-worker.mjs |
| [apps/vivim-host/test/bootstrap-command.test.mjs](../test/bootstrap-command.test.mjs.md) | ../bootstrap/command-worker.mjs |
| [apps/vivim-host/test/bootstrap.test.mjs](../test/bootstrap.test.mjs.md) | ../bootstrap/command-worker.mjs |
| [apps/vivim-host/test/direct-phone.test.mjs](../test/direct-phone.test.mjs.md) | ../bootstrap/command-worker.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 96 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
