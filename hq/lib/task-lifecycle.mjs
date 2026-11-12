// @ts-check
/**
 * @hq:context Typed task lifecycle between agents — open, claim, work, close — one append-only JSONL ledger where the current state is the last transition
 * @hq:owner channel-manager
 * @hq:task task-lifecycle
 * @hq:invariant append-only: a row is written once and never rewritten; state is derived from the tail of the ledger, never stored and patched
 * @hq:invariant a task closes on evidence, not on a claim: `done` without at least one evidence entry is refused (NO_EVIDENCE)
 * @hq:invariant only the declared moves are legal; an illegal move is refused and writes nothing (ILLEGAL_TRANSITION)
 * @hq:invariant this module owns the one file the caller names; nothing here sends, approves, or touches receipts
 * @hq:see doc:docs/AGENT-BUS.md
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { nowISO, sha256 } from './util.mjs';

export const TASK_SCHEMA = 'hq.task-lifecycle/1';
export const VIEW_SCHEMA = 'hq.task-lifecycle-view/1';

/** Every state a task can hold. `done` and `failed` are terminal because they have no legal move out. */
export const TASK_STATES = /** @type {readonly string[]} */ (['open', 'claimed', 'working', 'done', 'failed']);

/**
 * The whole policy in one table. A state whose list is empty is terminal.
 * `claimed -> done` is absent on purpose: work that never started cannot be
 * finished, so it must pass through `working` or report `failed`.
 */
export const MOVES = /** @type {Record<string, readonly string[]>} */ ({
  open: ['claimed'],
  claimed: ['working', 'failed'],
  working: ['done', 'failed'],
  done: [],
  failed: [],
});

/**
 * A ledger that cannot be read must not read as "nothing happened". Every
 * refusal the caller can act on carries a code so a UI branches on the code,
 * not on prose.
 */
export class TaskLifecycleError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'TaskLifecycleError';
    this.code = code;
  }
}

/**
 * The ledger file is named by the caller — no default location, so nothing
 * writes anywhere by omission.
 *
 * @param {string} target
 */
function ledgerFile(target) {
  const p = String(target ?? '').trim();
  if (!p) throw new TaskLifecycleError('NO_FILE', 'a task ledger path is required; pass the .jsonl file the caller owns');
  return p;
}

/** @param {any} value */
function text(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

/**
 * A refusal the caller can branch on. Nothing is written on this path.
 *
 * @param {string} code
 * @param {string} detail
 * @param {Record<string, any>} [extra]
 */
function refuse(code, detail, extra = {}) {
  return { ok: false, code, detail, ...extra };
}

/**
 * A stable, collision-resistant task id. `seq` is the ledger length before the
 * append, so two tasks opened in the same millisecond still differ.
 *
 * @param {{title?: string, target?: string, at?: string, seq?: number}} [opts]
 */
export function taskId({ title, target, at, seq = 0 } = {}) {
  const stamp = String(at).replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const digest = sha256(`${title}|${target}|${at}|${seq}`).slice(0, 8);
  return `TL-${stamp}-${digest}`;
}

/**
 * Open a typed task. A task is what it is for (`title`), who can claim it
 * (`target`), and who put it there (`openedBy`). A title and a target are
 * mandatory: an unnamed or unclaimable task is not a task.
 *
 * `evidenceRequired` is always true and is recorded on the row: closure is a
 * bar the ledger states, never a caller's option.
 *
 * @param {{file?: string, task?: {title?: string, target?: string, openedBy?: string, note?: string}, at?: string|Date}} opts
 */
export function open({ file, task, at = nowISO() } = /** @type {any} */ ({})) {
  const ledger = ledgerFile(file);
  const t = task && typeof task === 'object' ? task : {};

  const title = text(t.title);
  if (!title) return refuse('NO_TITLE', 'an open task must name what it is; `title` is empty');

  const target = text(t.target);
  if (!target) {
    return refuse('NO_TARGET', 'a task with no target has nobody to claim it; name the seat, agent or path it is for');
  }

  const atISO = normalizeAt(at);
  const seq = readLedger(ledger).length;
  /** @type {any} */
  const record = {
    schema: TASK_SCHEMA,
    kind: 'open',
    id: taskId({ title, target, at: atISO, seq }),
    at: atISO,
    title,
    state: 'open',
    openedBy: text(t.openedBy) || 'unattributed',
    target,
    evidenceRequired: true,
    note: text(t.note) || null,
  };
  appendRecord(ledger, record);
  return { ok: true, code: 'OPENED', ...record, file: ledger };
}

/**
 * Move a task along the one legal path. The row is appended; the state it
 * claims is derived from the rows before it, so a transition can be checked
 * against the ledger but never rewrites it.
 *
 * Evidence is carried on any transition, not only `done`. The closure bar
 * counts the task's whole evidence trail plus what this transition carries: a
 * task that already recorded proof while working is not closing on a claim.
 *
 * @param {{
 *   file?: string, id?: string, to?: string, by?: string, note?: string,
 *   evidence?: string|object|Array<string|object>, at?: string|Date,
 * }} opts
 */
export function transition({ file, id, to, by, note, evidence, at = nowISO() } = /** @type {any} */ ({})) {
  const ledger = ledgerFile(file);
  const taskText = text(id);
  if (!taskText) return refuse('UNKNOWN_TASK', 'a transition needs the id of an opened task');

  const own = readLedger(ledger).filter((row) => row.id === taskText);
  if (!own.length) return refuse('UNKNOWN_TASK', `no task ${taskText} is on ${ledger}; open it first`);

  const from = currentState(own);
  const toState = text(to).toLowerCase();
  const legal = MOVES[from] ?? [];
  if (!legal.includes(toState)) {
    return {
      ok: false,
      code: 'ILLEGAL_TRANSITION',
      from,
      to: toState,
      detail: legal.length
        ? `from ${from} the only legal moves are ${legal.join(', ')}`
        : `${from} is terminal; no move out of it is legal`,
    };
  }

  const atISO = normalizeAt(at);
  const byText = text(by) || 'unattributed';
  const entries = normalizeEvidence(evidence, { at: atISO, by: byText });
  const recorded = own.reduce((n, row) => n + (Array.isArray(row.evidence) ? row.evidence.length : 0), 0);
  const have = recorded + entries.length;
  if (toState === 'done' && have < 1) {
    return refuse('NO_EVIDENCE', 'a task cannot be closed on a claim; attach at least one evidence entry to the done transition', {
      id: taskText,
      from,
      to: toState,
      required: 1,
      have,
    });
  }

  /** @type {any} */
  const record = {
    schema: TASK_SCHEMA,
    kind: 'transition',
    id: taskText,
    at: atISO,
    from,
    to: toState,
    by: byText,
    note: text(note) || null,
    evidence: entries,
  };
  appendRecord(ledger, record);
  return {
    ok: true,
    code: 'TRANSITIONED',
    id: taskText,
    from,
    to: toState,
    state: toState,
    by: byText,
    note: record.note,
    at: atISO,
    evidence: entries.length,
    evidenceTotal: have,
    file: ledger,
  };
}

/**
 * Current state per task, newest activity first, with counts over the whole
 * ledger. `state` narrows the list; it never narrows the counts, so a filtered
 * view still answers "how much is done".
 *
 * @param {{file?: string, state?: string}} opts
 */
export function view({ file, state } = /** @type {any} */ ({})) {
  const ledger = ledgerFile(file);
  const rows = readLedger(ledger);
  const want = text(state).toLowerCase() || 'all';
  if (want !== 'all' && !TASK_STATES.includes(want)) {
    return refuse('UNKNOWN_STATE', `state is "${state}", expected all or one of ${TASK_STATES.join(', ')}`, {
      state: want,
    });
  }

  const tasks = project(rows);
  /** @type {Record<string, number>} */
  const counts = { total: tasks.length, open: 0, claimed: 0, working: 0, done: 0, failed: 0 };
  for (const task of tasks) counts[task.state] = (counts[task.state] ?? 0) + 1;

  const ordered = tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => timeOf(b.task.since) - timeOf(a.task.since) || b.index - a.index)
    .map((entry) => entry.task);
  const visible = want === 'all' ? ordered : ordered.filter((task) => task.state === want);

  return {
    ok: true,
    schema: VIEW_SCHEMA,
    file: ledger,
    exists: existsSync(ledger),
    state: want,
    count: visible.length,
    counts,
    tasks: visible.map(publicTask),
  };
}

/** The state a task holds now: the last transition wins, and an open row alone means `open`. */
function currentState(rows) {
  let state = 'open';
  for (const row of rows) if (row.kind === 'transition') state = String(row.to);
  return state;
}

/**
 * Fold the ledger into one task per id, in first-appearance order. An open row
 * states the task; every later row only moves it. A transition with no open row
 * before it is a torn ledger, not a task.
 *
 * @param {any[]} rows
 */
function project(rows) {
  /** @type {any[]} */
  const tasks = [];
  const byId = new Map();
  for (const row of rows) {
    if (row.kind === 'open') {
      /** @type {any} */
      const task = {
        id: row.id,
        title: row.title,
        target: row.target,
        openedBy: row.openedBy ?? null,
        openedAt: row.at,
        state: 'open',
        since: row.at,
        by: row.openedBy ?? null,
        note: row.note ?? null,
        evidenceRequired: row.evidenceRequired !== false,
        evidence: 0,
        transitions: 0,
      };
      tasks.push(task);
      byId.set(task.id, task);
      continue;
    }
    const task = byId.get(row.id);
    if (!task) {
      throw new TaskLifecycleError('ORPHAN_TRANSITION', `${row.id}: a transition to ${row.to} has no open row before it`);
    }
    task.state = String(row.to);
    task.since = row.at;
    task.by = row.by ?? null;
    task.note = row.note ?? null;
    task.evidence += Array.isArray(row.evidence) ? row.evidence.length : 0;
    task.transitions += 1;
  }
  return tasks;
}

/** The shape a caller sees; the fold's internal fields stay internal. */
function publicTask(task) {
  return {
    id: task.id,
    title: task.title,
    target: task.target,
    openedBy: task.openedBy,
    openedAt: task.openedAt,
    state: task.state,
    since: task.since,
    by: task.by,
    note: task.note,
    evidenceRequired: task.evidenceRequired,
    evidence: task.evidence,
    transitions: task.transitions,
  };
}

/**
 * Normalize what the caller offered as proof. A blank string is not evidence
 * and is dropped; an object is kept whole as the entry it states.
 *
 * @param {any} evidence
 * @param {{at: string, by: string}} stamp
 */
function normalizeEvidence(evidence, { at, by }) {
  const list = evidence === undefined || evidence === null ? [] : Array.isArray(evidence) ? evidence : [evidence];
  /** @type {any[]} */
  const entries = [];
  for (const item of list) {
    if (typeof item === 'string') {
      const value = item.trim();
      if (value) entries.push({ at, by, entry: value });
      continue;
    }
    if (item && typeof item === 'object') entries.push({ at, by, entry: item });
  }
  return entries;
}

/**
 * Append, never rewrite: one JSON object per line, always newline-terminated.
 * A tail without a terminator is a truncated write, so a newline is added
 * before the next record rather than splicing the old line.
 *
 * @param {string} ledger
 * @param {any} record
 */
function appendRecord(ledger, record) {
  mkdirSync(dirname(ledger), { recursive: true });
  if (existsSync(ledger)) {
    const existing = readFileSync(ledger, 'utf8');
    if (existing.length && !existing.endsWith('\n')) appendFileSync(ledger, '\n', 'utf8');
  }
  appendFileSync(ledger, `${JSON.stringify(record)}\n`, { encoding: 'utf8', flag: 'a' });
  return ledger;
}

/**
 * Read the ledger in file order. Blank lines are ignored; anything else that
 * cannot be read throws, because a ledger that skips a row answers questions
 * about a state that never existed.
 *
 * @param {string} ledger
 * @returns {any[]}
 */
function readLedger(ledger) {
  if (!existsSync(ledger)) return [];
  const lines = readFileSync(ledger, 'utf8').split(/\r?\n/);
  /** @type {any[]} */
  const rows = [];
  lines.forEach((line, i) => {
    const value = line.trim();
    if (!value) return;
    /** @type {any} */
    let doc;
    try {
      doc = JSON.parse(value);
    } catch {
      throw new TaskLifecycleError('CORRUPT_LEDGER', `${ledger}:${i + 1} is not JSON`);
    }
    if (doc?.schema !== TASK_SCHEMA) {
      throw new TaskLifecycleError('BAD_RECORD', `${ledger}:${i + 1} has schema ${doc?.schema ?? 'none'}, expected ${TASK_SCHEMA}`);
    }
    if (doc.kind !== 'open' && doc.kind !== 'transition') {
      throw new TaskLifecycleError('BAD_RECORD', `${ledger}:${i + 1} has kind ${doc.kind ?? 'none'}`);
    }
    if (!doc.id) throw new TaskLifecycleError('BAD_RECORD', `${ledger}:${i + 1} names no task id`);
    if (doc.kind === 'transition' && (!TASK_STATES.includes(String(doc.from)) || !TASK_STATES.includes(String(doc.to)))) {
      throw new TaskLifecycleError('BAD_RECORD', `${ledger}:${i + 1} moves ${doc.from} -> ${doc.to}, which is not a pair of task states`);
    }
    rows.push(doc);
  });
  return rows;
}

/** @param {string|Date} at */
function normalizeAt(at) {
  const parsed = at instanceof Date ? at : new Date(String(at));
  if (Number.isNaN(parsed.getTime())) throw new TaskLifecycleError('BAD_TIME', `"${at}" is not a usable timestamp`);
  return parsed.toISOString();
}

/** @param {string} at */
function timeOf(at) {
  const t = Date.parse(String(at));
  if (Number.isNaN(t)) throw new TaskLifecycleError('BAD_TIME', `ledger row has an unreadable timestamp: ${at}`);
  return t;
}
