// @ts-check
/**
 * @hq:context Program management: one portfolio model that joins the qeue capability register, the
 *   L0 strategic-initiative register and the live task queue, plus the Desktop fragment for it.
 * @hq:owner hq-agent
 * @hq:task program-management
 * @hq:invariant read-only: three registers are read, nothing is written, no provider is touched.
 * @hq:invariant a register that cannot be read becomes a note; it never throws and never reads as zero.
 * @hq:invariant every dynamic string passes through escapeHtml, and the fragment stays layout only.
 * @hq:why four registers describe one programme and none of them join; without the join, "how much is
 *   accepted" is answered by whichever file a reader happens to open, and an untracked item is
 *   indistinguishable from a finished one.
 * @hq:see hq/lib/canvas.mjs
 * @hq:see docs/integration/STRATEGIC-INITIATIVES.md
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { parseBlockedTable } from './canvas.mjs';
import { escapeHtml } from './team-dashboard.mjs';

/** The schema tag on every model this module builds. */
export const PMO_SCHEMA = 'hq.pmo/1';

/** The only id in the fragment; the host swaps the element with this id. */
export const PM_ROOT_ID = 'hq-pm';

/** How much of a blocked signature the fragment shows before it elides the rest. */
const SIGNATURE_DISPLAY_MAX = 200;

/** How much of an initiative title the decision card shows. */
const TITLE_DISPLAY_MAX = 90;

/** How many decision cards the model can carry, in priority order. */
const DECISION_CAP = 3;

// ---------------------------------------------------------------------------
// Small total helpers: every read of caller-supplied data goes through these.
// ---------------------------------------------------------------------------

/** @param {unknown} value @returns {value is Record<string, any>} */
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** @param {unknown} value @returns {string|null} */
function strOrNull(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

/** @param {unknown} value @returns {number|null} */
function numOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** @param {unknown} error @returns {string} */
function messageOf(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** One decimal place, so a percentage is stable across runs and readable in a table. */
/** @param {number} value @returns {number} */
function oneDecimal(value) {
  return Math.round(value * 10) / 10;
}

/** @param {unknown} value @param {number} max @returns {string} */
function truncate(value, max) {
  const s = String(value ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Collapse the whitespace a markdown cell can carry so a signature compares stably. */
/** @param {unknown} value @returns {string} */
function collapse(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Markdown table parsing (the initiative register is a markdown table)
// ---------------------------------------------------------------------------

/**
 * Split one markdown table row into trimmed cells, respecting `\|` escapes.
 * Returns null for a line that is not a table row.
 *
 * @param {string} line
 * @returns {string[]|null}
 */
function tableCells(line) {
  let src = String(line ?? '').trim();
  if (!src.startsWith('|')) return null;
  if (src.startsWith('|')) src = src.slice(1);
  if (src.endsWith('|')) src = src.slice(0, -1);
  /** @type {string[]} */
  const cells = [];
  let buf = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\\' && src[i + 1] === '|') { buf += '|'; i++; continue; }
    if (ch === '|') { cells.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  cells.push(buf.trim());
  return cells;
}

/** @param {string[]} cells @returns {boolean} */
function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, '')));
}

/** Header text normalised so `Owner decision` and `owner  decision` are the same column. */
/** @param {unknown} value @returns {string} */
function headerKey(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Resolve a column index by any of its accepted names, falling back to a position.
 *
 * @param {string[]|null} header
 * @param {string[]} names
 * @param {number} fallback
 * @returns {number}
 */
function columnIndex(header, names, fallback) {
  if (Array.isArray(header)) {
    const keys = header.map(headerKey);
    for (const name of names) {
      const idx = keys.indexOf(name);
      if (idx !== -1) return idx;
    }
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Status rules
// ---------------------------------------------------------------------------

/** @param {unknown} status @returns {string} */
function statusKey(status) {
  return String(status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Does a qeue status read as accepted?
 *
 * The rule is "the status contains accepted/done/verified", but the register's dominant status is
 * `not_verified` (585 of 600 records). A plain substring test would report a programme that is 97%
 * "accepted" and 0% verified, so a negation or partial prefix disqualifies the status first. This is
 * the one narrowing of the literal rule, and it exists to keep the number honest.
 *
 * @param {unknown} status
 * @returns {boolean}
 */
function isAcceptedStatus(status) {
  const key = statusKey(status);
  if (!key) return false;
  if (key.startsWith('un') || /(^|_)(not|never|partial|partially)(_|$)/.test(key)) return false;
  return /accepted|done|verified/.test(key);
}

/** @param {unknown} status @returns {boolean} */
function isBlockedStatus(status) {
  const key = statusKey(status);
  if (!key) return false;
  if (/unblocked|not_blocked/.test(key)) return false;
  return key.includes('blocked');
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

/**
 * Read every lane register in a qeue directory.
 *
 * A missing directory, an unreadable file, malformed JSON, or a non-register JSON file is recorded in
 * `notes` and skipped; the good lanes are still returned. Each lane's records are sorted by id so the
 * model is byte-stable even if a writer reorders the file.
 *
 * @param {string|null|undefined} dir
 * @returns {{lanes: Array<{lane: string, records: Array<any>}>, total: number, notes: string[]}}
 */
export function loadQeue(dir) {
  /** @type {string[]} */
  const notes = [];
  /** @type {Array<{lane: string, records: Array<any>}>} */
  const lanes = [];
  if (typeof dir !== 'string' || !dir.trim()) {
    notes.push('no qeue directory was supplied, so no program item could be read');
    return { lanes, total: 0, notes };
  }
  const root = resolve(dir);
  if (!existsSync(root)) {
    notes.push(`qeue directory ${root.replace(/\\/g, '/')} does not exist`);
    return { lanes, total: 0, notes };
  }

  /** @type {string[]} */
  let names = [];
  try {
    names = readdirSync(root).filter((name) => name.toLowerCase().endsWith('.json')).sort();
  } catch (error) {
    notes.push(`qeue directory ${root.replace(/\\/g, '/')} could not be listed: ${messageOf(error)}`);
    return { lanes, total: 0, notes };
  }

  for (const name of names) {
    const file = join(root, name);
    /** @type {any} */
    let parsed = null;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      notes.push(`qeue/${name} could not be read: ${messageOf(error)}`);
      continue;
    }
    if (!isObject(parsed) || !Array.isArray(parsed.records)) {
      notes.push(`qeue/${name} is not a lane register (no records array); it was not counted`);
      continue;
    }
    const lane = strOrNull(parsed.lane) ?? basename(name, '.json');
    /** @type {Array<any>} */
    const records = [];
    parsed.records.forEach((/** @type {any} */ raw, /** @type {number} */ index) => {
      if (!isObject(raw)) {
        notes.push(`qeue/${name} record ${index + 1} is not an object; it was skipped`);
        return;
      }
      const id = strOrNull(raw.id);
      if (!id) {
        notes.push(`qeue/${name} record ${index + 1} has no id; it was skipped`);
        return;
      }
      records.push({
        id,
        lane: strOrNull(raw.lane) ?? lane,
        task: strOrNull(raw.task) ?? '',
        status: strOrNull(raw.status) ?? 'unknown',
        primaryRelease: strOrNull(raw.primary_release),
        criticalityRank: numOrNull(raw.criticality_rank),
        complexityScore: numOrNull(raw.complexity_score),
      });
    });
    records.sort((a, b) => a.id.localeCompare(b.id));
    lanes.push({ lane, records });
  }

  lanes.sort((a, b) => a.lane.localeCompare(b.lane));
  const total = lanes.reduce((sum, lane) => sum + lane.records.length, 0);
  return { lanes, total, notes };
}

/**
 * Read the L0 initiative register table.
 *
 * The register is a markdown table between prose sections, and it carries a blank line before its last
 * rows. Blank lines are skipped, a heading or a non-table line ends the table, and a row whose first
 * cell is not an id is ignored. A document with no such table returns `rows: []` and a note.
 *
 * @param {unknown} text
 * @returns {{rows: Array<{id: string, title: string, state: string|null, gate: string|null, phase: string|null, ownerDecision: string|null}>, notes: string[]}}
 */
export function loadInitiatives(text) {
  /** @type {string[]} */
  const notes = [];
  /** @type {Array<{id: string, title: string, state: string|null, gate: string|null, phase: string|null, ownerDecision: string|null}>} */
  const rows = [];
  if (typeof text !== 'string' || !text.trim()) {
    notes.push('the initiative register text was not supplied');
    return { rows, notes };
  }

  const lines = text.split(/\r?\n/);
  /** @type {number} */
  let start = -1;
  /** @type {string[]|null} */
  let header = null;
  for (let i = 0; i < lines.length; i++) {
    const cells = tableCells(lines[i]);
    if (!cells || isSeparatorRow(cells)) continue;
    const keys = cells.map(headerKey);
    if (keys.includes('id') && (keys.includes('initiative') || keys.includes('title'))) {
      start = i;
      header = cells;
      break;
    }
  }
  if (start === -1 || !header) {
    notes.push('the initiative register has no table with ID and Initiative columns');
    return { rows, notes };
  }

  const iId = columnIndex(header, ['id'], 0);
  const iTitle = columnIndex(header, ['initiative', 'title', 'name'], 1);
  const iState = columnIndex(header, ['state', 'status'], 3);
  const iGate = columnIndex(header, ['gate'], 5);
  const iPhase = columnIndex(header, ['phase'], 6);
  const iOwner = columnIndex(header, ['owner decision', 'owner'], 7);

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*#{1,6}\s+/.test(line)) break;
    if (!line.trim()) continue;
    const cells = tableCells(line);
    if (!cells) break;
    if (isSeparatorRow(cells)) continue;
    const id = collapse(cells[iId]);
    if (!/^[A-Za-z][A-Za-z0-9]*-\d+$/.test(id)) continue;
    rows.push({
      id,
      title: collapse(cells[iTitle]) || id,
      state: strOrNull(collapse(cells[iState])),
      gate: strOrNull(collapse(cells[iGate])),
      phase: strOrNull(collapse(cells[iPhase])),
      ownerDecision: strOrNull(collapse(cells[iOwner])),
    });
  }

  if (!rows.length) notes.push('the initiative register table has no id rows');
  return { rows, notes };
}

// ---------------------------------------------------------------------------
// Task-queue citations: which register rows cite which program id
// ---------------------------------------------------------------------------

/**
 * Extract the known qeue ids that appear in one string.
 *
 * @param {string} text
 * @param {Set<string>} ids
 * @returns {string[]}
 */
function idsIn(text, ids) {
  /** @type {string[]} */
  const found = [];
  const re = /\b([A-Za-z][A-Za-z0-9]*-[0-9]{3})\b/g;
  let match = re.exec(text);
  while (match !== null) {
    if (ids.has(match[1])) found.push(match[1]);
    match = re.exec(text);
  }
  return found;
}

/** A final table cell that is a number is a measurement the queue is carrying. */
/** @param {string|undefined} cell @returns {boolean} */
function isNumericCell(cell) {
  const value = String(cell ?? '').replace(/[`*\s]/g, '');
  return /^-?\d+(?:\.\d+)?$/.test(value);
}

/**
 * Walk the active-tasks queue and record, per program id, what the queue says about it.
 *
 * The queue has two registers inside it: the scored table (the leapfrog queue, where a row is a claim
 * that an item is being worked) and the `## Blocked` table (where a row is a claim that work is stuck).
 * A table row outside `## Blocked` is a scored claim; a row inside it is a blocked claim. An owner is
 * named when the row's seat/owner column carries a value that is not empty and not `unbound`.
 *
 * @param {string|null} text
 * @param {Set<string>} ids
 * @returns {Map<string, {claimed: boolean, blocked: boolean, evidence: boolean, owner: boolean}>}
 */
function scanCitations(text, ids) {
  /** @type {Map<string, {claimed: boolean, blocked: boolean, evidence: boolean, owner: boolean}>} */
  const out = new Map();
  if (typeof text !== 'string' || !text || ids.size === 0) return out;

  const lines = text.split(/\r?\n/);
  let section = '';
  /** @type {string[]|null} */
  let header = null;

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading) {
      section = heading[1].toLowerCase();
      header = null;
      continue;
    }
    const cells = tableCells(line);
    if (!cells) {
      if (line.trim()) header = null;
      continue;
    }
    if (isSeparatorRow(cells)) continue;

    const cited = idsIn(cells.join(' | '), ids);
    if (!cited.length) {
      if (!header) header = cells;
      continue;
    }

    const iOwner = columnIndex(header, ['seat', 'owner', 'owner action needed', 'owner action', 'agent'], -1);
    const ownerCell = iOwner === -1 ? '' : collapse(cells[iOwner]).toLowerCase();
    const namesOwner = ownerCell !== '' && ownerCell !== 'unbound' && ownerCell !== '—' && ownerCell !== '-';
    const evidence = isNumericCell(cells[cells.length - 1]) || /sess_[A-Za-z0-9-]+/.test(line);
    const blockedRow = /^blocked\b/.test(section);

    for (const id of new Set(cited)) {
      const entry = out.get(id) ?? { claimed: false, blocked: false, evidence: false, owner: false };
      if (blockedRow) entry.blocked = true; else entry.claimed = true;
      if (evidence) entry.evidence = true;
      if (namesOwner) entry.owner = true;
      out.set(id, entry);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Blocked groups
// ---------------------------------------------------------------------------

/**
 * Normalise one blocker into the signature that groups rows saying the same thing. `parseBlockedTable`
 * already strips the `Unblock: ` prefix; `Verify receipt:` is the queue's action label, not the blocker.
 *
 * @param {unknown} reason
 * @returns {string}
 */
function normaliseSignature(reason) {
  return collapse(reason)
    .replace(/^(?:unblock|verify receipt)\s*:\s*/i, '')
    .trim();
}

/**
 * Group blocked rows by signature, largest group first.
 *
 * @param {Array<{reason: string|null}>} rows
 * @returns {Array<{signature: string, count: number}>}
 */
function groupBlocked(rows) {
  /** @type {Map<string, {signature: string, count: number}>} */
  const groups = new Map();
  for (const row of rows) {
    const signature = normaliseSignature(row.reason) || '(no reason given)';
    const key = signature.toLowerCase();
    const group = groups.get(key);
    if (group) group.count++;
    else groups.set(key, { signature, count: 1 });
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.signature.localeCompare(b.signature));
}

// ---------------------------------------------------------------------------
// Owner decisions: at most three, each sourced from the model
// ---------------------------------------------------------------------------

/** An owner-decision cell that begins with `none` records no decision to make. */
/** @param {unknown} value @returns {boolean} */
function isNoneDecision(value) {
  const text = collapse(value);
  if (!text) return true;
  return /^none\b/i.test(text);
}

/**
 * Derive at most three owner decisions. Nothing is emitted that the model cannot source, so a
 * portfolio of empty registers yields `[]` rather than a card that only reprints state.
 *
 * @param {Array<{id: string, title: string, state: string|null, gate: string|null, ownerDecision: string|null}>} initiatives
 * @param {Array<{signature: string, count: number}>} groups
 * @param {Array<{lane: string, total: number, accepted: number, blocked: number, untouched: number, pct: number|null}>} lanes
 * @returns {Array<{title: string, why: string, command: string}>}
 */
function buildDecisions(initiatives, groups, lanes) {
  /** @type {Array<{title: string, why: string, command: string}>} */
  const out = [];

  // (a) the first initiative that is actually waiting on the owner.
  const initiative = initiatives.find((row) => !isNoneDecision(row.ownerDecision));
  if (initiative && out.length < DECISION_CAP) {
    out.push({
      title: `Decide ${initiative.id}: ${truncate(initiative.title, TITLE_DISPLAY_MAX)}`,
      why: `${initiative.id} carries the owner decision "${truncate(collapse(initiative.ownerDecision), 140)}"; state: ${initiative.state ?? 'unrecorded'}; gate: ${initiative.gate ?? 'unrecorded'}.`,
      command: 'bun hq/bin/hq.mjs pm --json',
    });
  }

  // (b) the largest blocked cluster in the operational queue.
  if (groups.length && out.length < DECISION_CAP) {
    const group = groups[0];
    // A cluster naming the placeholder-thread defect already has a falsifier that can go red.
    const placeholder = /placeholder thread/i.test(group.signature);
    out.push({
      title: placeholder
        ? `Prove the ${group.count}-row cluster is one defect`
        : `Inspect the largest blocked cluster (${group.count} rows)`,
      why: `${group.count} blocked queue row(s) share: ${truncate(group.signature, 160)}.`,
      command: placeholder ? 'bun test hq/test/channel-evidence.test.mjs' : 'bun hq/bin/hq.mjs team',
    });
  }

  // (c) the lane with the least accepted work; the next item to move is in that lane.
  const candidates = lanes.filter((lane) => lane.total > 0 && lane.pct !== null);
  const lowest = candidates.sort((a, b) => Number(a.pct) - Number(b.pct) || a.lane.localeCompare(b.lane))[0];
  if (lowest && out.length < DECISION_CAP) {
    out.push({
      title: `Move ${lowest.lane} from ${Number(lowest.pct).toFixed(1)}% accepted`,
      why: `${lowest.lane}: ${lowest.accepted}/${lowest.total} accepted, ${lowest.blocked} blocked, ${lowest.untouched} untouched.`,
      command: 'bun hq/bin/hq.mjs pm --json',
    });
  }

  return out.slice(0, DECISION_CAP);
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

/**
 * Build the portfolio model: one plain-JSON object over three registers.
 *
 * Totality is the contract. A missing register is a note, an unreadable one is a note, and the model
 * always renders. `qeueDir` may be a directory to read or an already-loaded `loadQeue` result.
 *
 * @param {{qeueDir?: any, initiativesText?: any, tasksText?: any, now?: any}} [sources]
 * @returns {any}
 */
export function buildPortfolio(sources = {}) {
  const src = /** @type {any} */ (isObject(sources) ? sources : {});
  /** @type {string[]} */
  const notes = [];
  const now = typeof src.now === 'number' && Number.isFinite(src.now) ? src.now : Date.now();
  const generatedAt = new Date(now).toISOString();

  // Qeue ---------------------------------------------------------------------
  /** @type {Array<{lane: string, records: Array<any>}>} */
  let qeueLanes = [];
  if (isObject(src.qeueDir) && Array.isArray(src.qeueDir.lanes)) {
    qeueLanes = src.qeueDir.lanes;
    if (Array.isArray(src.qeueDir.notes)) notes.push(...src.qeueDir.notes.filter((note) => typeof note === 'string'));
  } else {
    const loaded = loadQeue(typeof src.qeueDir === 'string' ? src.qeueDir : null);
    qeueLanes = loaded.lanes;
    notes.push(...loaded.notes);
  }

  // Initiatives --------------------------------------------------------------
  const initiativesLoaded = loadInitiatives(src.initiativesText);
  notes.push(...initiativesLoaded.notes);
  const initiatives = initiativesLoaded.rows.map((row) => ({
    id: row.id,
    title: row.title,
    state: row.state,
    gate: row.gate,
    ownerDecision: row.ownerDecision,
  }));

  // Task queue ---------------------------------------------------------------
  /** @type {string|null} */
  const tasksText = typeof src.tasksText === 'string' ? src.tasksText : null;
  if (tasksText === null) {
    notes.push('the task queue text was not supplied (the file may be missing or unreadable); the registers were not joined');
  } else if (!tasksText.trim()) {
    notes.push('the task queue text was empty; the registers were not joined');
  } else if (!/^##\s+Blocked\b/im.test(tasksText)) {
    notes.push('the task queue has no ## Blocked section; no qeue item can be read as blocked from a row');
  }

  const knownIds = new Set(qeueLanes.flatMap((lane) => lane.records.map((record) => String(record.id))));
  const citations = scanCitations(tasksText, knownIds);

  const blockedRows = parseBlockedTable(tasksText);
  if (tasksText !== null && tasksText.trim() && /^##\s+Blocked\b/im.test(tasksText) && !blockedRows.length) {
    notes.push("the task queue's ## Blocked table has rows the parser could not read");
  }
  const blockedGroups = groupBlocked(blockedRows);

  // Items --------------------------------------------------------------------
  /** @type {Array<any>} */
  const items = [];
  for (const lane of qeueLanes) {
    for (const record of lane.records) {
      const cite = citations.get(String(record.id));
      const accepted = isAcceptedStatus(record.status);
      const blockedCited = cite ? cite.blocked : false;
      const blockedByStatus = !accepted && isBlockedStatus(record.status);
      /** @type {'accepted'|'blocked'|'claimed'|'untouched'} */
      let state = 'untouched';
      /** @type {string} */
      let because = 'no status and no queue row cites this id';
      if (accepted) {
        state = 'accepted';
        because = `status "${record.status}" reads as accepted`;
        if (blockedCited) because += '; the blocked table also cites it (contradiction)';
      } else if (blockedCited) {
        state = 'blocked';
        because = 'a row in the active-tasks blocked table cites it';
      } else if (blockedByStatus) {
        state = 'blocked';
        because = `status "${record.status}" says blocked`;
      } else if (cite && cite.claimed) {
        state = 'claimed';
        because = 'the active-tasks scored table cites it';
      }
      items.push({
        id: record.id,
        lane: record.lane || lane.lane,
        title: record.task,
        status: record.status,
        state,
        because,
        tracked: Boolean(cite && (cite.claimed || cite.blocked)),
        evidence: Boolean(cite && cite.evidence),
        namesOwner: Boolean(cite && cite.owner),
      });
    }
  }

  /** @type {Array<{lane: string, total: number, accepted: number, claimed: number, blocked: number, untouched: number, evidence: number, pct: number|null}>} */
  const lanes = qeueLanes.map((lane) => {
    const mine = items.filter((item) => item.lane === lane.lane);
    const accepted = mine.filter((item) => item.state === 'accepted').length;
    const total = mine.length;
    return {
      lane: lane.lane,
      total,
      accepted,
      claimed: mine.filter((item) => item.state === 'claimed').length,
      blocked: mine.filter((item) => item.state === 'blocked').length,
      untouched: mine.filter((item) => item.state === 'untouched').length,
      evidence: mine.filter((item) => item.evidence).length,
      pct: total > 0 ? oneDecimal((accepted / total) * 100) : null,
    };
  });

  // Coverage -----------------------------------------------------------------
  const tracked = items.filter((item) => item.tracked).length;
  const coverage = {
    tracked,
    untracked: items.length - tracked,
    withEvidence: items.filter((item) => item.tracked && item.evidence).length,
    // A tracked item is without an owner when no citing queue row names a seat or owner: the scored
    // table carries no owner column at all, which is itself the finding.
    withoutOwner: items.filter((item) => item.tracked && !item.namesOwner).length,
  };

  const acceptedTotal = items.filter((item) => item.state === 'accepted').length;
  const blockedTotal = items.filter((item) => item.state === 'blocked').length;

  return {
    schema: PMO_SCHEMA,
    generatedAt,
    verdict: { text: `${items.length} items · ${acceptedTotal} accepted · ${blockedTotal} blocked · ${coverage.untracked} untracked` },
    lanes,
    initiatives,
    coverage,
    decisions: buildDecisions(initiatives, blockedGroups, lanes),
    blockedGroups,
    items,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Requirement -> implementation owner resolution (AII scenario HQ-043)
// ---------------------------------------------------------------------------

/** Matches an @hq:owner annotation carrying a seat/assignee/capability-owner token. */
const HQ_OWNER_RE = /@hq:owner\s+(\S+)/;

/**
 * Read the @hq:owner annotation from one source file, if present.
 * Returns the owner token or null when the file cannot be read or has none.
 *
 * @param {string|null} source
 * @returns {string|null}
 */
function readHqOwner(source) {
  if (!strOrNull(source)) return null;
  let text;
  try {
    text = readFileSync(resolve(source), 'utf8');
  } catch {
    return null;
  }
  const match = HQ_OWNER_RE.exec(text);
  return match ? match[1] : null;
}

/**
 * Resolve the implementation owner of each requirement.
 *
 * A requirement is `{id, source, owner}`. `owner` is an explicit
 * implementation-owner hint (a seat, assignee or capability node owner).
 * When `owner` is empty the resolver falls back to the `@hq:owner`
 * annotation in `source`. A requirement whose owner cannot be resolved is
 * reported with `owner: null` and `resolved: false`.
 *
 * @param {Array<{id: string, source: string|null, owner: string|null}>} [requirements]
 * @returns {Array<{id: string, source: string|null, owner: string|null, resolved: boolean}>}
 */
export function resolveRequirementOwners(requirements = []) {
  return requirements.map((req) => {
    const explicit = strOrNull(req.owner);
    const owner = explicit ?? readHqOwner(req.source);
    return {
      id: strOrNull(req.id) ?? '',
      source: strOrNull(req.source),
      owner,
      resolved: Boolean(owner),
    };
  });
}

/**
 * Return only the requirements whose implementation owner could not be
 * resolved, each carrying its source file for traceability.
 *
 * @param {Array<{id: string, source: string|null, owner: string|null}>} [requirements]
 * @returns {Array<{id: string, source: string|null, owner: string|null}>}
 */
export function ownerlessRequirements(requirements = []) {
  return resolveRequirementOwners(requirements).filter((req) => !req.resolved);
}

// ---------------------------------------------------------------------------
// Rank unfinished capabilities by user value (AII scenario HQ-082)
// ---------------------------------------------------------------------------

/** Statuses that mean a capability row is not finished and therefore rankable. */
const UNFINISHED_STATUSES = new Set(['not_verified', 'open', 'claimed']);

/**
 * Rank unfinished capability rows by user value.
 *
 * Each input row is `{id, task, status, criticality_rank, complexity_score,
 * userValue}` where `userValue` is an author-provided score. A row is
 * unfinished when its status is not in a finished set (`documented_baseline`,
 * `done`, ...). Rows are ordered by user value descending, then by
 * criticality_rank descending as a tie-break, preserving determinism. The
 * engine never invents a user value: a row without one ranks as null and
 * sorts last.
 *
 * @param {Array<{id: string, task: string, status: string|null, criticality_rank: number|null, complexity_score: number|null, userValue: number|null}>} [rows]
 * @param {{top?: number}} [opts]
 * @returns {Array<{id: string, task: string, status: string|null, criticality_rank: number|null, complexity_score: number|null, userValue: number|null, rank: number}>}
 */
export function rankUnfinishedByUserValue(rows = [], { top } = {}) {
  const ranked = rows
    .filter((row) => {
      const status = String(row.status ?? '').trim().toLowerCase();
      return UNFINISHED_STATUSES.has(status) || status === '';
    })
    .map((row, index) => ({
      id: strOrNull(row.id) ?? '',
      task: strOrNull(row.task) ?? '',
      status: strOrNull(row.status),
      criticality_rank: numOrNull(row.criticality_rank),
      complexity_score: numOrNull(row.complexity_score),
      userValue: numOrNull(row.userValue),
      _index: index,
    }))
    .sort((a, b) => {
      const av = a.userValue === null ? 1 : 0; // nulls sort last
      const bv = b.userValue === null ? 1 : 0;
      if (av !== bv) return av - bv; // nulls sort last
      if (a.userValue !== b.userValue) return b.userValue - a.userValue; // high first
      const ac = a.criticality_rank === null ? -1 : 0;
      const bc = b.criticality_rank === null ? -1 : 0;
      if (ac !== bc) return ac - bc;
      return b.criticality_rank - a.criticality_rank || a._index - b._index;
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }))
    .map(({ _index: _omit, ...rest }) => rest);

  if (typeof top === 'number' && Number.isFinite(top) && top >= 0) {
    return ranked.slice(0, top);
  }
  return ranked;
}

// ---------------------------------------------------------------------------
// Fragment rendering
// ---------------------------------------------------------------------------

// Layout only: the host owns typography, colour, spacing utilities and controls. Nothing here sets a
// font size, weight, family, radius or colour, and no host class is redefined.
const CSS = [
  `#${PM_ROOT_ID}{max-width:100%;overflow-wrap:anywhere}`,
  `#${PM_ROOT_ID} section{margin:0 0 16px}`,
  `#${PM_ROOT_ID} .hq-pm-bar{display:flex}`,
].join('\n');

/** @param {unknown} value @returns {string} */
function cell(value) {
  return value === null || value === undefined || value === '' ? '—' : escapeHtml(value);
}

/** @param {string} label @param {unknown} value @returns {string} */
function statCard(label, value) {
  return `<div class="viz-stat"><div class="text-small text-muted">${escapeHtml(label)}</div><div class="viz-stat-value tabular-nums">${cell(value)}</div></div>`;
}

/** @param {string} summary @param {string} inner @returns {string} */
function renderDetails(summary, inner) {
  return `<details><summary class="text-small">${summary}</summary>${inner}</details>`;
}

/** @param {string} label @param {string} text @returns {string} */
function summaryText(label, text) {
  return `<span class="text-muted">${escapeHtml(label)}</span> — ${escapeHtml(text)}`;
}

/**
 * A two-segment progress bar: accepted, then the remainder. The accepted segment uses the host's
 * series token; the remainder is transparent so the host's neutral track shows through. Neither
 * segment carries a border or a stroke, and no colour is written here.
 *
 * @param {{accepted: number, total: number, pct: number|null}} lane
 * @returns {string}
 */
function renderBar(lane) {
  const total = numOrNull(lane.total) ?? 0;
  const accepted = numOrNull(lane.accepted) ?? 0;
  const pct = lane.pct === null || lane.pct === undefined ? null : oneDecimal(Number(lane.pct));
  if (total <= 0 || pct === null) {
    return `<div class="progress hq-pm-bar" role="img" aria-label="${escapeHtml('no items in this lane')}"><div class="progress-bar" style="width:0%"></div><div class="progress-bar" style="width:100%;background:transparent"></div></div>`;
  }
  const rest = oneDecimal(Math.max(0, 100 - pct));
  return `<div class="progress hq-pm-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(`${accepted} of ${total} accepted`)}"><div class="progress-bar" style="width:${pct}%;background:var(--viz-series-1)"></div><div class="progress-bar" style="width:${rest}%;background:transparent"></div></div>`;
}

/** @param {{lane: string, accepted: number, total: number, blocked: number}} lane @returns {string} */
function lanePrompt(lane) {
  return `Investigate lane ${lane.lane}: ${lane.accepted}/${lane.total} accepted, ${lane.blocked} blocked. Name the three items that would move this lane most and the one command for each.`;
}

/**
 * The RAG band over a measured percentage. The percentage is the fact; the band is a reading aid, so
 * the thresholds are stated here and the word is rendered as text, never as a colour.
 *
 * @param {number|null} pct
 * @returns {string}
 */
function ragBand(pct) {
  if (pct === null || pct === undefined) return 'unrated';
  const value = Number(pct);
  if (!Number.isFinite(value)) return 'unrated';
  if (value < 34) return 'red';
  if (value < 67) return 'amber';
  return 'green';
}

/** @param {Array<any>} lanes @returns {string} */
function renderLanes(lanes) {
  if (!lanes.length) return '<p class="text-small text-muted">no lane register could be read</p>';
  const rows = lanes.map((lane) => {
    const accepted = `${lane.accepted}/${lane.total}`;
    const pctText = lane.pct === null || lane.pct === undefined ? '—' : `${Number(lane.pct).toFixed(1)}%`;
    const drill = `<button type="button" class="btn btn-ghost btn-xs" data-prompt="${escapeHtml(lanePrompt(lane))}" data-title="Investigate lane">drill</button>`;
    return `<tr><td>${escapeHtml(lane.lane)} <span class="viz-badge">${escapeHtml(ragBand(lane.pct === undefined ? null : lane.pct))}</span></td><td class="text-end tabular-nums">${escapeHtml(accepted)}</td><td class="text-end tabular-nums">${escapeHtml(pctText)}</td><td class="text-end tabular-nums">${escapeHtml(lane.blocked)}</td><td>${renderBar(lane)}</td><td class="text-end">${drill}</td></tr>`;
  }).join('');
  return `<div class="table-responsive"><table class="table table-sm"><thead><tr><th scope="col">Lane</th><th scope="col" class="text-end">Accepted</th><th scope="col" class="text-end">Pct</th><th scope="col" class="text-end">Blocked</th><th scope="col">Progress</th><th scope="col" class="text-end"><span class="sr-only">Action</span></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** @param {Array<any>} initiatives @returns {string} */
function renderInitiatives(initiatives) {
  if (!initiatives.length) return '<p class="text-small text-muted">no initiative row could be read</p>';
  const rows = initiatives.map((row) => `<tr><td><code>${escapeHtml(row.id)}</code></td><td>${cell(row.title)}</td><td>${cell(row.state)}</td><td>${cell(row.gate)}</td><td>${cell(row.ownerDecision)}</td></tr>`).join('');
  return `<div class="table-responsive"><table class="table table-sm"><thead><tr><th scope="col">ID</th><th scope="col">Initiative</th><th scope="col">State</th><th scope="col">Gate</th><th scope="col">Owner decision</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** @param {Array<{signature: string, count: number}>} groups @returns {string} */
function renderBlockedGroups(groups) {
  if (!groups.length) return '<p class="text-small text-muted">no blocked group could be read</p>';
  const rows = groups.map((group) => {
    const count = numOrNull(group.count) ?? 0;
    const signature = truncate(group.signature, SIGNATURE_DISPLAY_MAX) || '(no reason given)';
    return `<tr><td class="text-end tabular-nums">${escapeHtml(count)}</td><td>${escapeHtml(signature)}</td></tr>`;
  }).join('');
  return `<div class="table-responsive"><table class="table table-sm"><thead><tr><th scope="col" class="text-end">Rows</th><th scope="col">Blocker signature</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** @param {any} coverage @returns {string} */
function renderCoverage(coverage) {
  const stats = [
    statCard('tracked', coverage.tracked),
    statCard('untracked', coverage.untracked),
    statCard('with evidence', coverage.withEvidence),
    statCard('without owner', coverage.withoutOwner),
  ].join('');
  return `<div class="viz-grid">${stats}</div><p class="text-small text-muted">tracked = a qeue id cited anywhere in the active-tasks queue. with evidence = a citing row ends in a numeric column or carries a <code>sess_</code> proof. without owner = no citing row names a seat or owner.</p>`;
}

/** @param {string[]} notes @returns {string} */
function renderNotes(notes) {
  if (!notes.length) return '<p class="text-small text-muted">no note: every register was read without a defect</p>';
  const items = notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  return `<ul class="text-small text-muted">${items}</ul>`;
}

/** @param {any} decision @returns {string} */
function decisionPrompt(decision) {
  return `Run or discuss exactly this command: ${decision.command}. Context: ${decision.title}. ${decision.why}`;
}

/** @param {Array<any>} decisions @returns {string} */
function renderDecisions(decisions) {
  if (!decisions.length) return '<p class="text-small text-muted">nothing needs the owner</p>';
  const cards = decisions.map((raw) => {
    const decision = isObject(raw) ? raw : {};
    const title = strOrNull(decision.title) ?? 'Decision';
    const why = strOrNull(decision.why) ?? '';
    const command = strOrNull(decision.command) ?? '';
    return `<div class="card"><p>${escapeHtml(title)}</p><p class="text-small text-muted">${escapeHtml(why)}</p><p><code>${escapeHtml(command)}</code></p><button type="button" class="btn btn-primary" data-prompt="${escapeHtml(decisionPrompt({ title, why, command }))}" data-title="Needs the owner" data-decision>Act on this</button></div>`;
  }).join('');
  return `<div class="viz-grid">${cards}</div>`;
}

/**
 * Render the portfolio as a fragment for one conversation message.
 *
 * Above the fold: the verdict line and at most three decision cards. Everything else is a native
 * `<details>` drill-in, so the collapsed view is still informative and needs no scripting. `opts` is
 * accepted for forward compatibility and is unused today.
 *
 * @param {any} model
 * @param {any} [opts]
 * @returns {string}
 */
export function renderPortfolioFragment(model, opts = {}) {
  const m = /** @type {any} */ (isObject(model) ? model : {});
  const generatedAt = strOrNull(m.generatedAt) ?? '';
  const verdict = isObject(m.verdict) && typeof m.verdict.text === 'string' ? m.verdict.text : 'no verdict available';
  const lanes = Array.isArray(m.lanes) ? m.lanes.filter(isObject) : [];
  const initiatives = Array.isArray(m.initiatives) ? m.initiatives.filter(isObject) : [];
  const groups = Array.isArray(m.blockedGroups) ? m.blockedGroups.filter(isObject) : [];
  const decisions = Array.isArray(m.decisions) ? m.decisions : [];
  const notes = Array.isArray(m.notes) ? m.notes.filter((note) => typeof note === 'string') : [];
  const coverage = isObject(m.coverage)
    ? {
        tracked: numOrNull(m.coverage.tracked),
        untracked: numOrNull(m.coverage.untracked),
        withEvidence: numOrNull(m.coverage.withEvidence),
        withoutOwner: numOrNull(m.coverage.withoutOwner),
      }
    : { tracked: null, untracked: null, withEvidence: null, withoutOwner: null };

  const total = lanes.reduce((sum, lane) => sum + (numOrNull(lane.total) ?? 0), 0);
  const accepted = lanes.reduce((sum, lane) => sum + (numOrNull(lane.accepted) ?? 0), 0);
  const blocked = lanes.reduce((sum, lane) => sum + (numOrNull(lane.blocked) ?? 0), 0);
  const blockedRowCount = groups.reduce((sum, group) => sum + (numOrNull(group.count) ?? 0), 0);
  const withDecision = initiatives.filter((row) => !isNoneDecision(row.ownerDecision)).length;

  const verdictLine = `<p>${escapeHtml(verdict)} <span class="text-small text-muted">generated <time datetime="${escapeHtml(generatedAt)}">${escapeHtml(generatedAt || 'unknown')}</time></span></p>`;
  const needsOwner = `<section aria-label="Needs the owner"><div class="text-small text-muted">NEEDS THE OWNER</div>${renderDecisions(decisions)}</section>`;

  return [
    `<div id="${PM_ROOT_ID}" class="viz-root" data-schema="${escapeHtml(m.schema ?? PMO_SCHEMA)}">`,
    `<style>${CSS}</style>`,
    verdictLine,
    needsOwner,
    `<section aria-label="Portfolio details">`,
    renderDetails(summaryText('LANES', `${lanes.length} lanes · ${accepted} of ${total} accepted · ${blocked} blocked`), renderLanes(lanes)),
    renderDetails(summaryText('INITIATIVES', `${initiatives.length} rows · ${withDecision} naming an owner decision`), renderInitiatives(initiatives)),
    renderDetails(summaryText('BLOCKED GROUPS', `${groups.length} groups · ${blockedRowCount} queue rows`), renderBlockedGroups(groups)),
    renderDetails(summaryText('COVERAGE', `${coverage.tracked ?? 0} tracked · ${coverage.untracked ?? 0} untracked`), renderCoverage(coverage)),
    renderDetails(summaryText('NOTES', `${notes.length} notes`), renderNotes(notes)),
    `</section>`,
    `<footer class="text-small text-muted">regenerate: <code>bun hq/bin/hq.mjs pm</code></footer>`,
    `</div>`,
  ].join('\n');
}
