// @ts-check
/**
 * @hq:context Event-driven channel wake core — snapshot the channel (outcomes/, pending/,
 *   broker/receipts/), diff against the last snapshot, and turn every real transition into one
 *   secret-free bus line so no seat ever has to sleep-poll the channel again
 * @hq:owner channel-wake
 * @hq:task channel-wake-lane (owner order 2026-11-09: hook-based wakes, not polling)
 * @hq:invariant reads only the root it is given: this lib hardcodes no channel path, so tests
 *   run against temp dirs only and the live channel is touched by the CLI default alone
 * @hq:invariant an event names id, kind and state transition only — never a prompt, reply,
 *   digest or credential; describeEvent redacts credential shapes defensively
 * @hq:invariant mtime never produces an event; only effect/evidenceState/state transitions do
 * @hq:invariant pure + testable: no timers, no transports, no bus access in this module —
 *   watch/debounce/send wiring lives in hq/bin/hq.mjs cmdChannel
 * @hq:see docs/AGENT-BUS.md
 * @hq:see hq/lib/seat-watch.mjs (redaction patterns) · hq/lib/channel-broker.mjs (receipt states)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { redactSecrets } from './seat-watch.mjs';

export const CHANNEL_WAKE_SCHEMA = 'hq.channel-wake/1';

/**
 * One read-only sweep of a channel root. Absent subdirectories read as empty
 * arrays; a file that vanishes mid-scan or fails to parse is skipped — a
 * transient write is never reported as a transition.
 *
 * @param {string} root channel root (e.g. the CLI default; never hardcoded here)
 * @returns {{outcomes: {id: string, effect: string, evidenceState: string, mtime: number}[],
 *            pending: string[], receipts: {id: string, state: string, mtime: number}[]}}
 */
export function scanChannel(root) {
  return {
    outcomes: scanDir(join(root, 'outcomes'), (doc) => ({
      effect: str(doc?.effect),
      evidenceState: str(doc?.evidenceState),
    })).map(({ id, mtime, fields }) => ({ id, mtime, ...fields })),
    pending: listJson(join(root, 'pending')).map((name) => name.slice(0, -5)),
    receipts: scanDir(join(root, 'broker', 'receipts'), (doc) => ({
      state: str(doc?.state),
    })).map(({ id, mtime, fields }) => ({ id, mtime, ...fields })),
  };
}

/** Read every `*.json` in one dir; skip unparseable/transient files; sort by id. */
function scanDir(dir, fields) {
  const out = [];
  for (const name of listJson(dir)) {
    const file = join(dir, name);
    let doc = null;
    try {
      doc = JSON.parse(readFileSync(file, 'utf8'));
      const mtime = statSync(file).mtimeMs;
      out.push({ id: name.slice(0, -5), mtime, fields: fields(doc) });
    } catch {
      // File vanished mid-scan or is being rewritten: not an observation.
    }
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function listJson(dir) {
  try {
    return readdirSync(dir).filter((n) => n.endsWith('.json')).sort();
  } catch {
    return []; // absent dir is an empty observation, not an error
  }
}

function str(v) {
  return typeof v === 'string' && v.length > 0 ? v : 'UNKNOWN';
}

/**
 * Pure diff between two snapshots. Kinds: `outcome` (new or effect/evidenceState
 * transition; from/to are `<effect>/<evidenceState>`), `pending-cleared` (the
 * write-ahead pending file self-cleared = the detached turn completed),
 * `receipt-state` (SENT/UNCERTAIN/REFUSED transition). Removals of outcomes and
 * receipts are not observable transitions and emit nothing; mtime is ignored.
 *
 * @param {ReturnType<typeof scanChannel> | null | undefined} before
 * @param {ReturnType<typeof scanChannel> | null | undefined} after
 * @returns {{kind: 'outcome'|'pending-cleared'|'receipt-state', id: string,
 *            from: string|null, to: string, detail: Record<string, string>}[]}
 */
export function diffEvents(before, after) {
  const b = before ?? { outcomes: [], pending: [], receipts: [] };
  const a = after ?? { outcomes: [], pending: [], receipts: [] };
  /** @type {{kind: 'outcome'|'pending-cleared'|'receipt-state', id: string, from: string|null, to: string, detail: Record<string, string>}[]} */
  const events = [];

  const bOutcomes = new Map(b.outcomes.map((o) => [o.id, o]));
  for (const o of a.outcomes) {
    const prev = bOutcomes.get(o.id);
    const to = `${o.effect}/${o.evidenceState}`;
    const from = prev ? `${prev.effect}/${prev.evidenceState}` : null;
    if (from !== to) {
      events.push({ kind: 'outcome', id: o.id, from, to, detail: { evidenceState: o.evidenceState } });
    }
  }

  const aPending = new Set(a.pending);
  for (const id of b.pending) {
    if (!aPending.has(id)) events.push({ kind: 'pending-cleared', id, from: 'pending', to: 'cleared', detail: {} });
  }

  const bReceipts = new Map(b.receipts.map((r) => [r.id, r]));
  for (const r of a.receipts) {
    const prev = bReceipts.get(r.id);
    if (!prev || prev.state !== r.state) {
      events.push({ kind: 'receipt-state', id: r.id, from: prev ? prev.state : null, to: r.state, detail: {} });
    }
  }

  return events;
}

/**
 * One-line bus body for one event. Carries id, kind and the state transition
 * only; credential shapes are redacted defensively and the line is collapsed so
 * a stray newline can never split a bus record.
 *
 * @param {{kind: string, id: string, from: string|null, to: string, detail?: Record<string, string>}} e
 * @returns {string}
 */
export function describeEvent(e) {
  let line;
  switch (e.kind) {
    case 'outcome':
      line = `outcome ${e.id} effect/evidence ${e.to}${e.from ? ` (was ${e.from})` : ' (new)'}`;
      break;
    case 'pending-cleared':
      line = `pending ${e.id} cleared (detached turn completed)`;
      break;
    case 'receipt-state':
      line = `receipt ${e.id} state ${e.from ?? 'new'} -> ${e.to}`;
      break;
    default:
      line = `unknown event kind ${e.kind} for ${e.id}`;
  }
  return redactSecrets(`channel-wake: ${line}`).replace(/\s+/g, ' ').trim();
}
