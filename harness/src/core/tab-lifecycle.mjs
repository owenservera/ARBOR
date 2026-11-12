// VIVIM Q24 — Chrome tab lifecycle coordinator.
// Each tab/job is an explicit state machine:
//   open -> ready -> sending -> sent -> streaming -> done/failed/uncertain -> closed
// Per-state timeouts/watchdogs, heartbeats, deterministic cleanup sweeps on a timer,
// logged replayable protocol. Never auto-resends uncertain sends.
// The harness is sole lifecycle authority; CDP reconciliation/fallback when extension absent.
// This module NEVER starts Chrome, creates tabs, sends, or draft-clears. It only tracks
// lifecycle state and emits transitions for the owner (Studio/harness) to act on.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const TAB_LIFECYCLE_SCHEMA = 'vivim.tab-lifecycle/1';
export const TAB_STATES = Object.freeze(['open', 'ready', 'sending', 'sent', 'streaming', 'done', 'failed', 'uncertain', 'closed']);
export const TERMINAL = new Set(['done', 'failed', 'uncertain', 'closed']);
export const ACTIVE = new Set(['open', 'ready', 'sending', 'sent', 'streaming']);

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const fail = (code, reason) => { const e = new Error(reason); e.code = code; throw e; };
const validId = (s, label) => { if (!ID.test(s)) fail('TAB_INVALID', `${label} must be a bounded id`); return s; };
const clone = v => JSON.parse(JSON.stringify(v));

// Default per-state timeouts (ms). Owner-configurable via policy.
const DEFAULT_TIMEOUTS = Object.freeze({
  open: 30000,      // 30s to become ready
  ready: 60000,     // 60s to begin sending
  sending: 300000,  // 5min to reach sent/streaming
  sent: 600000,     // 10m to reach streaming/done
  streaming: 600000, // 10m to reach done/failed
  closed: 30000,    // 30s to fully close
});
const HEARTBEAT_INTERVAL_MS = 15000;
const SWEEP_INTERVAL_MS = 30000;
const MAX_PER_PROVIDER = 4;
const MAX_GLOBAL = 16;

function isTerminal(s) { return TERMINAL.has(s); }
function isActive(s) { return ACTIVE.has(s); }

// EDGES: valid state transitions
const EDGES = Object.freeze({
  open: ['ready', 'failed', 'uncertain'],
  ready: ['sending', 'failed', 'uncertain'],
  sending: ['sent', 'streaming', 'failed', 'uncertain'],
  sent: ['streaming', 'done', 'failed', 'uncertain'],
  streaming: ['done', 'failed', 'uncertain'],
  done: ['closed'],
  failed: ['closed'],
  uncertain: ['closed'],
  closed: [],
});

export function createTabLifecycle({ stateStore, owner, now = Date.now, policy = {} } = {}) {
  if (!stateStore || typeof stateStore.read !== 'function' || typeof stateStore.write !== 'function') {
    fail('TAB_DEPENDENCY', 'Durable state store with read/write required');
  }
  if (!owner || typeof owner.isOwned !== 'function' || typeof owner.targets !== 'function') {
    fail('TAB_DEPENDENCY', 'Owner registry adapter required (isOwned, targets)');
  }
  const timeouts = { ...DEFAULT_TIMEOUTS, ...(policy.timeouts || {}) };
  const maxPerProvider = policy.maxPerProvider ?? MAX_PER_PROVIDER;
  const maxGlobal = policy.maxGlobal ?? MAX_GLOBAL;
  const key = 'tab.lifecycle.v1';

  const load = () => {
    let raw;
    try { raw = stateStore.read(key); } catch { return []; }
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };
  const persist = (records) => stateStore.write(key, JSON.stringify(records, null, 2));
  const mutate = (fn) => {
    const list = load();
    const { next, result } = fn(list);
    // Always persist: fn may mutate objects in place within the same array,
    // so next === list even when state changed.
    persist(next);
    return result;
  };
  const records = () => load();
  const snapshot = () => clone(records());

  function find(id) { return records().find(r => r.id === id); }

  function countActive(records, provider) {
    return records.filter(r => isActive(r.state) && (provider == null || r.provider === provider)).length;
  }

  function countTotal(records, provider) {
    return records.filter(r => provider == null || r.provider === provider).length;
  }

  // Reserve a tab slot. Returns the reservation record.
  async function reserve({ requestId, provider, jobKind = 'chat' } = {}) {
    validId(requestId, 'requestId');
    validId(provider, 'provider');
    validId(jobKind, 'jobKind');
    return mutate(records => {
      const existing = records.find(r => r.id === requestId);
      if (existing) return { next: records, result: clone(existing) };
      if (countTotal(records) >= maxGlobal) fail('TAB_CAPACITY', `Global tab cap (${maxGlobal}) reached`);
      if (countActive(records, provider) >= maxPerProvider) fail('TAB_CAPACITY', `Per-provider cap (${maxPerProvider}) reached for ${provider}`);
      const t = now();
      const record = {
        id: requestId, provider, jobKind,
        state: 'open', targetId: null, ownerTabId: null,
        createdAt: t, changedAt: t, lastHeartbeatAt: t,
        transitions: [{ at: t, to: 'open', reason: 'reserved' }],
        reason: null, heartbeatMisses: 0,
      };
      return { next: [...records, record], result: clone(record) };
    });
  }

  // Bind a reserved tab to an owner-attested CDP target.
  async function bind({ requestId, targetId } = {}) {
    validId(requestId, 'requestId');
    validId(targetId, 'targetId');
    if (await owner.isOwned(targetId) !== true) fail('TAB_NOT_OWNED', `Target ${targetId} is not owned by this browser`);
    return mutate(records => {
      const r = records.find(x => x.id === requestId);
      if (!r || r.state !== 'open') fail('TAB_STATE_CONFLICT', `Tab ${requestId} is not open (state: ${r?.state ?? 'missing'})`);
      if (records.some(x => x.targetId === targetId && x.id !== requestId && isActive(x.state))) {
        fail('TAB_TARGET_IN_USE', `Target ${targetId} is already bound to an active tab`);
      }
      const t = now();
      r.targetId = targetId;
      r.state = 'ready';
      r.changedAt = t;
      r.lastHeartbeatAt = t;
      r.transitions.push({ at: t, to: 'ready', reason: 'owner_attested' });
      return { next: records, result: clone(r) };
    });
  }

  // Advance a tab's state. Requires evidence for terminal-forwarding transitions.
  async function advance({ requestId, to, proof = null, reason = null } = {}) {
    validId(requestId, 'requestId');
    if (!TAB_STATES.includes(to)) fail('TAB_TRANSITION_INVALID', `Unknown state: ${to}`);
    if (to === 'closed' || to === 'closing') fail('TAB_TRANSITION_INVALID', `Use close() for terminal close, not ${to}`);
    return mutate(records => {
      const r = records.find(x => x.id === requestId);
      if (!r) fail('TAB_UNKNOWN', `No tab ${requestId}`);
      if (r.state === to) return { next: records, result: clone(r) };
      if (!EDGES[r.state]?.includes(to)) fail('TAB_TRANSITION_INVALID', `Cannot transition ${r.state} -> ${to}`);
      if (['sending', 'sent', 'streaming', 'done'].includes(to)) {
        if (!proof || proof.requestId !== requestId || proof.targetId !== r.targetId || proof.ownerVerified !== true) {
          fail('TAB_PROOF_REQUIRED', `Advancing to ${to} requires owner-verified proof`);
        }
        if (to === 'done' && !proof.replySettled) fail('TAB_REPLY_UNVERIFIED', 'Complete requires replySettled=true');
      }
      const t = now();
      r.state = to;
      r.changedAt = t;
      r.lastHeartbeatAt = t;
      r.reason = reason ? String(reason).slice(0, 100) : null;
      r.transitions.push({ at: t, to, reason: r.reason });
      r.transitions = r.transitions.slice(-40);
      return { next: records, result: clone(r) };
    });
  }

  // Heartbeat: keep an active tab's lease fresh.
  async function heartbeat({ requestId, targetId } = {}) {
    validId(requestId, 'requestId');
    return mutate(records => {
      const r = records.find(x => x.id === requestId);
      if (!r || !isActive(r.state)) fail('TAB_HEARTBEAT_REJECTED', `Tab ${requestId} not active`);
      if (r.targetId !== targetId) fail('TAB_HEARTBEAT_REJECTED', `Target mismatch for ${requestId}`);
      r.lastHeartbeatAt = now();
      return { next: records, result: clone(r) };
    });
  }

  // Sweep: reconcile all tabs against live targets, heartbeats, and timeouts.
  // Returns changes and counts. Never resends uncertain sends.
  async function sweep({ restarting = false } = {}) {
    const targets = await owner.targets().catch(() => null);
    const live = new Set(targets ? targets.map(t => t.id) : []);
    const nowMs = now();
    const changes = [];
    const all = records();
    for (const r of all) {
      if (isTerminal(r.state)) continue;
      const proof = await owner.isOwned(r.targetId).catch(() => false);
      const targetLost = r.targetId && targets && !live.has(r.targetId);
      const ownerDead = r.targetId && !proof;
      const expired = nowMs - r.lastHeartbeatAt > (timeouts[r.state] ?? Infinity);
      const stale = restarting && ['sending', 'sent', 'streaming'].includes(r.state);

      let nextState = r.state;
      let reason = r.reason;
      if (ownerDead) {
        nextState = 'uncertain';
        reason = 'target_missing';
      } else if (expired) {
        nextState = r.state === 'open' || r.state === 'ready' ? 'failed' : 'uncertain';
        reason = 'watchdog_expired';
      } else if (stale) {
        nextState = 'uncertain';
        reason = 'restart_requires_reconciliation';
      }

      if (nextState !== r.state && EDGES[r.state]?.includes(nextState)) {
        const rec = await advance({ requestId: r.id, to: nextState, proof: { requestId: r.id, targetId: r.targetId, ownerVerified: true }, reason });
        changes.push(rec);
      }
    }
    const updated = records();
    return { schema: TAB_LIFECYCLE_SCHEMA, changes, counts: { active: updated.filter(isActive).length, uncertain: updated.filter(r => r.state === 'uncertain').length, total: updated.length } };
  }

  // Close a terminal tab. Delegates to owner.closeOwned.
  async function closeCompleted({ requestId } = {}) {
    validId(requestId, 'requestId');
    const r = find(requestId);
    if (!r || !['done', 'failed', 'uncertain'].includes(r.state)) fail('TAB_CLOSE_NOT_TERMINAL', `Tab ${requestId} is not terminal (state: ${r?.state ?? 'missing'})`);
    if (!r.targetId) fail('TAB_NO_TARGET', `Tab ${requestId} has no target`);
    if (await owner.isOwned(r.targetId) !== true) fail('TAB_NOT_OWNED', `Target ${r.targetId} not owned`);
    try { await owner.closeOwned(r.targetId); } catch {
      fail('TAB_CLOSE_UNCERTAIN', `Close of ${requestId} failed; state unchanged`);
    }
    const remaining = await owner.targets().catch(() => null);
    if (!Array.isArray(remaining) || remaining.some(t => t.id === r.targetId)) {
      return find(requestId); // Still present, state unchanged
    }
    return mutate(records => {
      const tab = records.find(x => x.id === requestId);
      if (!tab) return { next: records, result: null };
      const t = now();
      tab.state = 'closed';
      tab.changedAt = t;
      tab.reason = 'target_confirmed_gone';
      tab.transitions.push({ at: t, to: 'closed', reason: 'target_confirmed_gone' });
      tab.transitions = tab.transitions.slice(-40);
      return { next: records, result: clone(tab) };
    });
  }

  return {
    schema: TAB_LIFECYCLE_SCHEMA,
    reserve, bind, advance, heartbeat, sweep, closeCompleted,
    find, records: snapshot, policy: { maxPerProvider, maxGlobal, timeouts: { ...timeouts } },
  };
}
