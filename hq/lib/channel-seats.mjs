// @ts-check
/**
 * @hq:context Channel seat transport — resolve a channel seat, classify it idle or active, and wake it through ACP with a journaled record
 * @hq:owner channel-manager
 * @hq:task channel-wake
 * @hq:invariant a wake is a management act, never a provider send: nothing here writes C:/VIVIM/channel/receipts
 * @hq:invariant an unknown seat is DENIED before a transport is spawned
 * @hq:invariant the intent record is on disk before the effect, and is never rewritten
 * @hq:see doc:docs/integration/STREAM-BOUNDARIES.md
 * @hq:see doc:docs/SYNC-BUS.md
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { nowISO, sha256 } from './util.mjs';

export const SEATS_SCHEMA = 'vivim.channel-seats/1';
export const WAKE_SCHEMA = 'vivim.channel-wake/1';
export const DEFAULT_CHANNEL_ROOT = 'C:/VIVIM/channel';
export const DEFAULT_IDLE_MINUTES = 5;

/** The token a woken seat must echo back, so a wake can be proven rather than assumed. */
export const WAKE_MARKER = 'MANAGER-WAKE';

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /\bbearer\s+[A-Za-z0-9._-]{20,}/i,
  /\bapi[_-]?key\s*[:=]\s*\S{8,}/i,
  /\bpassword\s*[:=]\s*\S{4,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

export function seatsPath(root = DEFAULT_CHANNEL_ROOT) {
  return join(root, 'seats.json');
}

export function dispatchDir(root = DEFAULT_CHANNEL_ROOT) {
  return join(root, 'dispatch');
}

/**
 * Read the seat registry. Throws rather than returning an empty roster: a
 * manager with no seats reads exactly like a manager whose seats are all gone.
 */
export function loadSeats(root = DEFAULT_CHANNEL_ROOT) {
  const file = seatsPath(root);
  if (!existsSync(file)) throw new Error(`no seat registry at ${file}`);
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  if (doc.schema !== SEATS_SCHEMA) throw new Error(`seat registry schema is ${doc.schema}, expected ${SEATS_SCHEMA}`);
  if (!Array.isArray(doc.seats) || !doc.seats.length) throw new Error(`seat registry at ${file} lists no seats`);
  return doc;
}

/**
 * Who can be woken. The manager is a wakeable target too — it runs its team —
 * so it joins the roster when the registry gives it a session. It is added here
 * rather than duplicated into `seats` so a seat's `site` stays a site.
 */
export function roster(doc) {
  const seats = Array.isArray(doc.seats) ? doc.seats : [];
  const manager = doc.manager;
  if (manager?.session && !seats.some((s) => s.id === manager.id)) {
    return [...seats, {
      id: manager.id,
      title: manager.title ?? manager.id,
      session: manager.session,
      site: null,
      role: 'manager',
      canonical: false,
      scopes: [],
    }];
  }
  return seats;
}

export function resolveSeat(doc, id) {
  const want = String(id ?? '').trim().toLowerCase();
  if (!want) return null;
  return roster(doc).find((s) => String(s.id).toLowerCase() === want) ?? null;
}

/**
 * Classify a seat from its last observed activity.
 * `live` is the probe result: `{ ageMinutes, title, updated }` or null when the
 * session could not be read. ACTIVE is not a claim that a turn is running — it
 * means the seat was touched inside the idle window, so a wake is deferred
 * unless the manager forces it.
 */
export function classifySeat(seat, live, { idleMinutes = DEFAULT_IDLE_MINUTES } = {}) {
  if (!seat?.session) return { state: 'NO_SESSION', ageMinutes: null, detail: 'seat has no session id' };
  if (!live) return { state: 'UNKNOWN', ageMinutes: null, detail: 'session not readable' };
  const age = Number(live.ageMinutes);
  if (!Number.isFinite(age)) return { state: 'UNKNOWN', ageMinutes: null, detail: 'session store returned no age' };
  return {
    state: age < idleMinutes ? 'ACTIVE' : 'IDLE',
    ageMinutes: age,
    title: live.title ?? null,
    detail: age < idleMinutes
      ? `touched ${age}m ago, inside the ${idleMinutes}m idle window`
      : `idle ${age}m`,
  };
}

export function promptCarriesSecret(text) {
  return SECRET_PATTERNS.some((re) => re.test(String(text ?? '')));
}

export function wakeId(seatId, at = nowISO()) {
  return `MW-${String(at).replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}-${seatId}`;
}

/** Build the message the seat receives. The marker is what makes the wake provable. */
export function buildWakeText({ id, prompt }) {
  return [
    `[${WAKE_MARKER} ${id}] ${prompt}`,
    '',
    'From: channel-manager. This is a management prompt, not a provider send: do not send to your site because of it.',
    `First line of your reply: "${WAKE_MARKER} ${id} RECEIVED". Then start the slice it names.`,
  ].join('\n');
}

export function buildWakeRecord({ seat, prompt, reason, at = nowISO(), root }) {
  const id = wakeId(seat.id, at);
  return {
    schema: WAKE_SCHEMA,
    id,
    at,
    seat: seat.id,
    session: seat.session,
    site: seat.site,
    kind: 'wake',
    reason: reason ?? null,
    prompt,
    promptSha256: sha256(prompt),
    text: buildWakeText({ id, prompt }),
    requestedBy: 'channel-manager',
    channelRoot: root,
    isProviderSend: false,
  };
}

/**
 * The whole policy in one place. Nothing reaches a transport without passing here.
 * Returns a decision, never booleans, so the manager reads one vocabulary:
 * ACCEPTED / DEFERRED / DENIED.
 *
 * @param {any} record
 * @param {{state?: string, force?: boolean, idleMinutes?: number}} [opts]
 */
export function guardWake(record, { state, force = false, idleMinutes = DEFAULT_IDLE_MINUTES } = {}) {
  const prompt = String(record?.prompt ?? '').trim();
  if (!prompt) return deny('EMPTY_PROMPT', 'a wake must name the slice the seat should start');
  if (promptCarriesSecret(prompt)) return deny('SECRET_IN_PROMPT', 'the wake prompt carries a credential shape; name where to read it instead');
  if (state === 'NO_SESSION') return deny('SEAT_NO_SESSION', 'the seat has no session id in seats.json');
  if (state === 'UNKNOWN') return deny('SESSION_NOT_FOUND', 'the seat session is not in the session store');
  if (state === 'ACTIVE' && !force) {
    return {
      decision: 'DEFERRED',
      code: 'SEAT_ACTIVE',
      detail: `seat activity is inside the ${idleMinutes}m idle window; re-check later or pass --force to wake it anyway`,
    };
  }
  return { decision: 'ACCEPTED', code: state === 'ACTIVE' ? 'SEAT_ACTIVE_FORCED' : 'SEAT_IDLE', detail: 'wake permitted' };
}

function deny(code, detail) {
  return { decision: 'DENIED', code, detail };
}

/**
 * Journal before effect. Two append-only files per wake: the intent (written
 * first, always) and the result (written after the transport answers).
 */
export function journalIntent(root, record) {
  const dir = dispatchDir(root);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${record.id}.intent.json`);
  writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
  return file;
}

export function journalResult(root, record, result) {
  const dir = dispatchDir(root);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${record.id}.result.json`);
  writeFileSync(file, `${JSON.stringify({ schema: WAKE_SCHEMA, id: record.id, at: nowISO(), ...result }, null, 2)}\n`, { flag: 'wx' });
  return file;
}

/**
 * Wake one seat.
 *
 * `probe(sessionId)` resolves liveness from the session store (read-only).
 * `send(sessionId, text)` is the ACP transport and returns `{ accepted }`.
 * Both are injected so the policy is testable without a live session.
 *
 * @param {{
 *   root?: string, seatId?: string, prompt?: string, reason?: string|null,
 *   force?: boolean, dryRun?: boolean, idleMinutes?: number, at?: string,
 *   probe?: (sessionId: string) => any, send?: (sessionId: string, text: string) => any,
 * }} opts
 */
export function wakeSeat({
  root = DEFAULT_CHANNEL_ROOT,
  seatId,
  prompt,
  reason = null,
  force = false,
  dryRun = false,
  idleMinutes = DEFAULT_IDLE_MINUTES,
  at = nowISO(),
  probe,
  send,
} = {}) {
  if (typeof probe !== 'function') throw new Error('wakeSeat needs a probe(sessionId) function');
  if (!dryRun && typeof send !== 'function') throw new Error('wakeSeat needs a send(sessionId, text) function');

  const doc = loadSeats(root);
  const seat = resolveSeat(doc, seatId);
  if (!seat) {
    return {
      decision: 'DENIED',
      code: 'SEAT_UNKNOWN',
      detail: `"${seatId}" is not a wakeable seat; seats are ${roster(doc).map((s) => s.id).join(', ')}`,
    };
  }

  const record = buildWakeRecord({ seat, prompt, reason, at, root });
  const live = seat.session ? safeProbe(probe, seat.session) : null;
  const cls = classifySeat(seat, live, { idleMinutes });
  const verdict = guardWake(record, { state: cls.state, force, idleMinutes });

  if (verdict.decision !== 'ACCEPTED') return { ...verdict, seat: seat.id, state: cls.state, ageMinutes: cls.ageMinutes };
  if (dryRun) {
    return {
      decision: 'ACCEPTED', code: 'DRY_RUN', detail: 'all guards passed; no journal and no transport on a dry run',
      seat: seat.id, state: cls.state, ageMinutes: cls.ageMinutes, wouldSendTo: seat.session, text: record.text,
    };
  }

  const intentPath = journalIntent(root, record);
  const answer = send(seat.session, record.text);
  const accepted = answer?.accepted === true;
  const pending = answer?.pending === true;
  // A timed-out CLI might have reached the provider before it was killed.
  // Quarantine the journaled wake as uncertain; never call it a refusal or
  // claim that the same command is still running in a detached replacement.
  const uncertain = answer?.uncertain === true;
  const resultPath = journalResult(root, record, {
    accepted,
    pending,
    transport: answer?.transport ?? 'unknown',
    reply: answer?.reply ?? null,
    state: cls.state,
    ageMinutes: cls.ageMinutes,
    answer: answer ?? null,
  });
  return {
    decision: accepted ? 'ACCEPTED' : (pending || uncertain) ? 'DEFERRED' : 'DENIED',
    code: accepted ? 'WAKE_SENT' : uncertain ? 'WAKE_UNCERTAIN' : pending ? 'WAKE_PENDING' : 'TRANSPORT_REFUSED',
    detail: accepted
      ? 'the transport accepted the prompt for that session; confirm it with `hq seat verify`'
      : uncertain
        ? 'the timed-out turn may already have reached the model; no retry was made — verify the original session transcript'
        : pending
          ? 'the bridge did not answer inside the wait; confirm the original request with `hq seat verify`'
          : 'the transport did not accept the prompt',
    seat: seat.id,
    state: cls.state,
    ageMinutes: cls.ageMinutes,
    id: record.id,
    intentPath,
    resultPath,
  };
}

/**
 * Proof of a wake. The transcript is the evidence; the bridge's `accepted` is
 * only an acknowledgement that a request was taken.
 *
 * @param {{root?: string, seatId?: string, id?: string|null, confirm?: (sessionId: string, wakeId: string) => any}} opts
 */
export function verifySeat({ root = DEFAULT_CHANNEL_ROOT, seatId, id = null, confirm } = {}) {
  if (typeof confirm !== 'function') throw new Error('verifySeat needs a confirm(sessionId, wakeId) function');
  const doc = loadSeats(root);
  const seat = resolveSeat(doc, seatId);
  if (!seat) return { decision: 'DENIED', code: 'SEAT_UNKNOWN', detail: `"${seatId}" is not a seat` };
  if (!seat.session) return { decision: 'DENIED', code: 'SEAT_NO_SESSION', detail: 'the seat has no session id' };
  const wake = id || latestIntent(root, seat.id);
  if (!wake) return { decision: 'DENIED', code: 'NO_WAKE_ON_RECORD', detail: `no wake has been journaled for ${seat.id}` };
  const proof = confirm(seat.session, wake);
  return {
    decision: proof?.seen ? 'ACCEPTED' : 'DEFERRED',
    code: proof?.seen ? 'WAKE_CONFIRMED' : 'WAKE_UNSEEN',
    detail: proof?.detail ?? (proof?.seen ? 'the seat transcript contains the wake marker' : 'the wake marker is not in the transcript yet'),
    delivered: proof?.delivered === true,
    answered: proof?.answered === true,
    seat: seat.id,
    id: wake,
    session: seat.session,
  };
}

/** The most recent journaled wake for a seat, so `verify` needs no id in the common case. */
export function latestIntent(root, seatId) {
  const dir = dispatchDir(root);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.intent.json'))
    .sort()
    .reverse();
  for (const f of files) {
    try {
      const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      if (doc.seat === seatId) return doc.id;
    } catch { /* an unreadable intent is not a wake we can verify */ }
  }
  return null;
}

function safeProbe(probe, sessionId) {
  try {
    return probe(sessionId) ?? null;
  } catch {
    return null;
  }
}

export function renderSeatTable(doc, probe, { idleMinutes = DEFAULT_IDLE_MINUTES } = {}) {
  const rows = roster(doc).map((seat) => {
    const live = seat.session ? safeProbe(probe, seat.session) : null;
    const cls = classifySeat(seat, live, { idleMinutes });
    return { seat: seat.id, site: seat.site, state: cls.state, ageMinutes: cls.ageMinutes, title: seat.title };
  });
  const width = Math.max(6, ...rows.map((r) => String(r.seat).length));
  const lines = ['SEAT'.padEnd(width) + '  STATE     AGE   SITE'];
  for (const r of rows) {
    lines.push(
      String(r.seat).padEnd(width) + '  ' + String(r.state).padEnd(9) + ' ' +
      String(r.ageMinutes === null ? '-' : r.ageMinutes + 'm').padEnd(5) + ' ' + (r.site ?? 'all sites'),
    );
  }
  return { schema: 'hq.channel-seats/1', seats: rows, lines: lines.join('\n') };
}

/**
 * The reply of a wake that outran its wait, read from the journal's own
 * `answer.replyFile`. `reader` is injected so this module stays free of the
 * transport. A pending wake that has since answered is a wake that landed.
 */
export function lateReplyFor(root, wakeId, reader) {
  if (!wakeId || typeof reader !== 'function') return null;
  try {
    const file = join(dispatchDir(root), `${wakeId}.result.json`);
    if (!existsSync(file)) return null;
    const doc = JSON.parse(readFileSync(file, 'utf8'));
    const replyFile = doc?.answer?.replyFile;
    return replyFile ? reader(replyFile) : null;
  } catch {
    return null;
  }
}
