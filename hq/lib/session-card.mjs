// @ts-check
/**
 * @hq:context The durable state card for the autocompaction protocol: a small, rebuildable
 *   snapshot of goal, next action, lanes, git state and bus state that survives summarization.
 * @hq:owner atlas
 * @hq:task compact-protocol
 * @hq:invariant the conversation is cache, the card is state: a write without a nextAction is refused.
 * @hq:invariant every probe is read-only; the only write is the card file, atomically.
 * @hq:see doc:docs/automation/ZCODE-MANUAL-TASK-AUTOMATION.md
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export const STATE_CARD_SCHEMA = 'zcode.state-card/1';
export const STATE_CARD_REL = join('.hq', 'session', 'state-card.json');
export const MAX_DIRTY = 50;
export const MAX_RENDER_LINES = 40;

/** @param {string} agent */
function sanitizeAgent(agent) {
  return String(agent).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Branch and dirty paths from git. A non-repo returns a clean defect row rather than throwing.
 * @param {string} repo
 * @returns {{ branch: string|null, dirty: string[], ahead: number|null, behind: number|null, error: string|null }}
 */
export function gitState(repo) {
  const r = spawnSync('git', ['-C', repo, 'status', '--porcelain=v1', '-b'], { encoding: 'utf8', timeout: 15000 });
  if (r.status !== 0) {
    return { branch: null, dirty: [], ahead: null, behind: null, error: (r.stderr || 'git status failed').trim().split(/\r?\n/).pop() };
  }
  let branch = null;
  let ahead = null;
  let behind = null;
  const dirty = [];
  for (const line of String(r.stdout).split(/\r?\n/)) {
    if (!line) continue;
    if (line.startsWith('## ')) {
      const head = line.slice(3).replace(/^No commits yet on /, '').replace(/^Initial commit on /, '');
      branch = head.split('...')[0].trim() || null;
      const a = head.match(/ahead (\d+)/);
      const b = head.match(/behind (\d+)/);
      ahead = a ? Number(a[1]) : null;
      behind = b ? Number(b[1]) : null;
      continue;
    }
    const rel = line.slice(3).trim();
    if (rel) dirty.push(rel.includes(' -> ') ? rel.split(' -> ').pop() : rel);
  }
  return { branch, dirty: dirty.slice(0, MAX_DIRTY), ahead, behind, error: null };
}

/**
 * Parse the append-only sync ledger. Bad lines are skipped, never fatal.
 * @param {string} root
 * @returns {Array<Record<string, any>>}
 */
export function readLedger(root) {
  const file = join(root, 'sync', 'ledger.jsonl');
  if (!existsSync(file)) return [];
  const out = [];
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row && typeof row === 'object' && row.id) out.push(row);
    } catch { /* a corrupt line is not a crash */ }
  }
  return out;
}

/**
 * Claims that are still active: the latest claim per holder::ref, ended by a release
 * written at or after it, and not expired.
 * @param {Array<Record<string, any>>} records
 * @param {number} now
 * @returns {Array<Record<string, any>>}
 */
export function activeClaims(records, now = Date.now()) {
  /** @type {Map<string, any>} */
  const latest = new Map();
  for (const record of records) {
    const refs = Array.isArray(record.refs) ? record.refs.map(String) : [];
    if (record.kind === 'claim') {
      for (const ref of refs) latest.set(`${record.from}::${ref}`, record);
    } else if (record.kind === 'release') {
      for (const ref of refs) {
        const claim = latest.get(`${record.from}::${ref}`);
        if (claim && Number(claim.seq) <= Number(record.seq)) latest.delete(`${record.from}::${ref}`);
      }
    }
  }
  return [...latest.values()].filter((claim) => {
    if (!claim.expires_at) return true;
    const until = Date.parse(claim.expires_at);
    return Number.isFinite(until) ? until > now : true;
  });
}

/**
 * Unread count for one agent (messages addressed to it or broadcast, after its cursor),
 * plus the active claims it holds and the active claim total.
 * @param {{ root: string, agent: string, now?: number }} input
 */
export function busState({ root, agent, now = Date.now() }) {
  const records = readLedger(root);
  const cursorFile = join(root, 'sync', 'cursors', `${sanitizeAgent(agent)}.json`);
  let lastSeq = 0;
  let lastId = '';
  if (existsSync(cursorFile)) {
    try {
      const cursor = JSON.parse(readFileSync(cursorFile, 'utf8'));
      lastSeq = Number(cursor.lastSeq || 0);
      lastId = String(cursor.lastId || '');
    } catch { /* a corrupt cursor means "read nothing" */ }
  }
  const claims = activeClaims(records, now);
  const mine = claims.filter((claim) => claim.from === agent);
  const unread = records.filter((record) => {
    if (record.from === agent) return false;
    if (record.to !== agent && record.to !== '*') return false;
    return Number(record.seq || 0) > lastSeq && record.id !== lastId;
  }).length;
  return {
    unread,
    activeClaims: claims.length,
    myClaims: mine.map((claim) => ({
      refs: Array.isArray(claim.refs) ? claim.refs.map(String) : [],
      expires_at: claim.expires_at ?? null,
    })),
  };
}

/**
 * Build the card. Pure join of the probes plus the caller's declared state.
 * @param {{
 *   repo: string, session?: string|null, goal?: string, nextAction?: string,
 *   lanes?: Array<Record<string, any>>, risks?: string[], questions?: string[],
 *   busAgent?: string, busRoot?: string, compactions?: number,
 *   tokens?: { input: number, output: number }, now?: Date
 * }} input
 */
export function buildStateCard(input) {
  const now = input.now ?? new Date();
  const git = gitState(input.repo);
  const bus = busState({ root: input.busRoot ?? input.repo, agent: input.busAgent ?? 'agent', now: now.getTime() });
  return {
    schema: STATE_CARD_SCHEMA,
    session: input.session ?? null,
    at: now.toISOString(),
    goal: String(input.goal ?? '').trim(),
    nextAction: String(input.nextAction ?? '').trim(),
    branch: git.branch,
    dirty: git.dirty,
    ahead: git.ahead,
    behind: git.behind,
    gitError: git.error,
    lanes: Array.isArray(input.lanes) ? input.lanes : [],
    unreadBus: bus.unread,
    claims: bus.myClaims,
    activeClaims: bus.activeClaims,
    openRisks: Array.isArray(input.risks) ? input.risks : [],
    openQuestions: Array.isArray(input.questions) ? input.questions : [],
    compactions: Number(input.compactions ?? 0),
    tokens: input.tokens ?? { input: 0, output: 0 },
  };
}

/**
 * The only write in this module. Refuses a card that cannot be re-armed from.
 * @param {string} repo
 * @param {Record<string, any>} card
 * @returns {string} absolute path written
 */
export function writeStateCard(repo, card) {
  if (!card || card.schema !== STATE_CARD_SCHEMA) throw new Error(`state card schema must be ${STATE_CARD_SCHEMA}`);
  if (!String(card.nextAction ?? '').trim()) throw new Error('state card refused: nextAction is required');
  const file = join(repo, STATE_CARD_REL);
  mkdirSync(join(repo, '.hq', 'session'), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(card, null, 2)}\n`);
  renameSync(tmp, file);
  return file;
}

/**
 * @param {string} repo
 * @returns {Record<string, any>|null}
 */
export function loadStateCard(repo) {
  const file = join(repo, STATE_CARD_REL);
  if (!existsSync(file)) return null;
  try {
    const card = JSON.parse(readFileSync(file, 'utf8'));
    return card && card.schema === STATE_CARD_SCHEMA ? card : null;
  } catch {
    return null;
  }
}

/** @param {any} value @param {number} max */
function clip(value, max = 5) {
  const list = Array.isArray(value) ? value : [];
  const shown = list.slice(0, max).map((v) => String(v));
  return `${shown.join('; ')}${list.length > max ? `; +${list.length - max}` : ''}`;
}

/**
 * A re-arm card, not a transcript: bounded to MAX_RENDER_LINES lines.
 * @param {Record<string, any>} card
 */
export function renderStateCard(card) {
  const lines = [];
  const next = String(card.nextAction ?? '').trim();
  lines.push(`STATE CARD · ${card.session ?? 'unknown'} · ${card.at ?? '?'}`);
  lines.push(`GOAL: ${String(card.goal || '(unset)')}`);
  lines.push(`NEXT: ${next || '(UNSET — rewrite the card)'}`);
  const git = `BRANCH: ${card.branch ?? '(no git)'}${card.ahead ? ` +${card.ahead}` : ''}${card.behind ? ` -${card.behind}` : ''} · ${(card.dirty ?? []).length} dirty`;
  lines.push(git);
  if (card.gitError) lines.push(`GIT: ${card.gitError}`);
  if ((card.dirty ?? []).length) lines.push(`DIRTY: ${clip(card.dirty)}`);
  if ((card.lanes ?? []).length) {
    lines.push(`LANES: ${clip((card.lanes ?? []).map((lane) => `${lane.id ?? '?'}=${lane.state ?? '?'}`), 6)}`);
  }
  lines.push(`BUS: ${card.unreadBus ?? 0} unread · ${card.activeClaims ?? 0} active claim(s)`);
  if ((card.claims ?? []).length) lines.push(`MINE: ${clip((card.claims ?? []).map((claim) => (claim.refs ?? []).join(',')), 6)}`);
  if ((card.openRisks ?? []).length) lines.push(`RISKS: ${clip(card.openRisks)}`);
  if ((card.openQuestions ?? []).length) lines.push(`QUESTIONS: ${clip(card.openQuestions)}`);
  lines.push(`COMPACTIONS: ${card.compactions ?? 0} · TOKENS: ${card.tokens?.input ?? 0}/${card.tokens?.output ?? 0}`);
  return lines.slice(0, MAX_RENDER_LINES).join('\n');
}
