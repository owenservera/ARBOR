// @ts-check
/**
 * @hq:context Inline-fragment renderer for the ZCode Desktop UI: one conversation message that shows live team state.
 * @hq:owner hq-agent
 * @hq:task team-canvas
 * @hq:invariant read-only; the fragment carries no network call, no external resource and no effect of its own.
 * @hq:invariant the host design system owns typography, colour and controls; this file supplies layout only.
 * @hq:invariant every dynamic string passes through escapeHtml; the model is total and never throws on bad input.
 * @hq:why A full document cannot be embedded in a message, so this emits a fragment: stacked sections, no tabs,
 *        no accordions, readable with scripting disabled, and one root id for the host to replace in place.
 * @hq:see hq/lib/team-panel.mjs
 * @hq:see hq/lib/team-dashboard.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { buildTeamSnapshot, PROTOCOL_SKILL } from './team-panel.mjs';
import { escapeHtml } from './team-dashboard.mjs';

/** The schema tag on every model this module builds. */
export const CANVAS_SCHEMA = 'hq.canvas/1';

/** The only id in the fragment; the host swaps the element with this id. */
export const CANVAS_ROOT_ID = 'hq-canvas';

/** Where the live task queue lives; blocked rows are read from this file by default. */
export const DEFAULT_TASKS_FILE = 'C:/VIVIM/channel/tasks/active-tasks.md';

/** How many blocked rows the model carries before it has to summarise the rest. */
const BLOCKED_CAP = 60;

/** How many blocked groups the default view shows; the rest stay in the task queue. */
const BLOCKED_GROUP_CAP = 8;

/** Defect kinds that stop the roster itself from being read. */
const ROSTER_BLOCKING_DEFECTS = new Set(['agent-dir-missing', 'seat-roster-unreadable', 'session-db-unreadable']);

/** Notes that mean the panel could not read the roster at all. */
const ROSTER_BLOCKING_NOTE = /(seats could not be read|agent definitions could not be read|team snapshot could not be built|snapshot was not an object)/i;

/** How many defect-named agents the ORG section lists before summarising the rest. */
const DEFECT_AGENT_CAP = 12;

/** How many notes the verdict card lists before summarising the rest. */
const NOTE_CAP = 12;

const SEAT_STATES = ['ACTIVE', 'IDLE', 'NO_SESSION', 'UNKNOWN'];
const PROVIDER_STATES = ['healthy', 'unproven', 'broken', 'capped', 'budget-blocked', 'unknown'];
const UNAVAILABLE_PROVIDER_STATES = new Set(['broken', 'capped', 'budget-blocked']);

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

/** @param {unknown} value @returns {Map<string, any>|null} */
function toMap(value) {
  if (value instanceof Map) return /** @type {Map<string, any>} */ (value);
  if (isObject(value)) return new Map(Object.entries(value));
  return null;
}

/** One seat, normalised. State is text, never inferred from colour. */
/** @param {unknown} value @param {number} index */
function normalizeSeat(value, index) {
  const s = /** @type {any} */ (isObject(value) ? value : {});
  const id = strOrNull(s.id) ?? `seat-${index + 1}`;
  const state = typeof s.state === 'string' && SEAT_STATES.includes(s.state.toUpperCase()) ? s.state.toUpperCase() : 'UNKNOWN';
  return {
    id,
    title: strOrNull(s.title),
    site: strOrNull(s.site),
    role: strOrNull(s.role),
    session: strOrNull(s.session),
    state,
    ageMinutes: numOrNull(s.ageMinutes),
    messages: numOrNull(s.messages) ?? 0,
  };
}

/** One provider row, normalised. The health state is lowercased so wording is stable. */
/** @param {string} key @param {any} value */
function normalizeProvider(key, value) {
  const v = /** @type {any} */ (isObject(value) ? value : {});
  const health = /** @type {any} */ (isObject(v.health) ? v.health : {});
  const state = typeof health.state === 'string' && PROVIDER_STATES.includes(health.state.toLowerCase())
    ? health.state.toLowerCase()
    : 'unknown';
  const slash = String(key).indexOf('/');
  return {
    key: String(key),
    model: slash === -1 ? String(key) : String(key).slice(slash + 1),
    state,
    ok: numOrNull(v.completed) ?? 0,
    err: numOrNull(v.error) ?? 0,
    avgMs: Math.round(numOrNull(v.avgLatencyMs) ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Markdown task queue parsing
// ---------------------------------------------------------------------------

/**
 * Split one markdown table row into trimmed cells, respecting `\|` escapes.
 *
 * @param {string} line
 * @returns {string[]}
 */
function splitTableRow(line) {
  let src = String(line).trim();
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

/**
 * Return the lines under one section heading, or null when the heading is absent.
 *
 * @param {string} text
 * @param {RegExp} heading
 * @returns {string[]|null}
 */
function sectionBody(text, heading) {
  const lines = String(text ?? '').split(/\r?\n/);
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,6}\s+/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end);
}

/**
 * Read the header and data rows of the first markdown table in a section.
 *
 * @param {string[]} body
 * @returns {{header: string[]|null, rows: string[][]}}
 */
function tableRows(body) {
  /** @type {string[]|null} */
  let header = null;
  /** @type {string[][]} */
  const rows = [];
  for (const line of body) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = splitTableRow(trimmed);
    if (isSeparatorRow(cells)) continue;
    if (!header) { header = cells; continue; }
    rows.push(cells);
  }
  return { header, rows };
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
    for (const name of names) {
      const idx = header.findIndex((cell) => String(cell).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim() === name);
      if (idx !== -1) return idx;
    }
  }
  return fallback;
}

/** @param {string|undefined} cell @returns {string} */
function cleanCell(cell) {
  return String(cell ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Parse the `## Blocked` table into rows the canvas can render.
 *
 * Missing columns, renamed columns and empty text are all tolerated: a caller that cannot supply the
 * table gets an empty list, never an exception. The literal `Unblock: ` prefix is presentation, not
 * content, so it is stripped from the reason.
 *
 * @param {unknown} text
 * @returns {Array<{target: string|null, reason: string|null, ownerAction: string|null, proof: string|null}>}
 */
export function parseBlockedTable(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const body = sectionBody(text, /^##\s+Blocked\b/i);
  if (!body) return [];
  const { header, rows } = tableRows(body);
  const iTarget = columnIndex(header, ['conversation', 'target', 'thread', 'task'], 0);
  const iReason = columnIndex(header, ['blocker', 'reason', 'detail'], 1);
  const iOwner = columnIndex(header, ['owner action needed', 'owner action', 'owner', 'action'], 2);
  const iProof = columnIndex(header, ['proof', 'evidence', 'session'], 3);

  /** @type {Array<{target: string|null, reason: string|null, ownerAction: string|null, proof: string|null}>} */
  const out = [];
  for (const cells of rows) {
    const target = cleanCell(cells[iTarget]);
    const reason = cleanCell(cells[iReason]).replace(/^Unblock:\s*/i, '');
    if (!target && !reason) continue;
    const ownerAction = cleanCell(cells[iOwner]) || null;
    const proofCell = cleanCell(cells[iProof]);
    const proofMatch = proofCell.match(/sess_[A-Za-z0-9-]+/);
    out.push({ target: target || null, reason: reason || null, ownerAction, proof: proofMatch ? proofMatch[0] : null });
  }
  out.sort((a, b) => String(a.target ?? '').localeCompare(String(b.target ?? '')) || String(a.reason ?? '').localeCompare(String(b.reason ?? '')));
  return out;
}

/**
 * Count the `unbound` seat cells in the `## Tasks` table.
 *
 * @param {unknown} text
 * @returns {number|null} null when the section itself is absent
 */
function parseUnboundSeats(text) {
  if (typeof text !== 'string') return null;
  const body = sectionBody(text, /^##\s+Tasks\b/i);
  if (!body) return null;
  const { header, rows } = tableRows(body);
  const iSeat = columnIndex(header, ['seat', 'owner', 'agent'], 2);
  let count = 0;
  for (const cells of rows) {
    if (cleanCell(cells[iSeat]).toLowerCase() === 'unbound') count++;
  }
  return count;
}

/** @param {string} text @returns {boolean} */
function hasBlockedSection(text) {
  return /^##\s+Blocked\b/im.test(text);
}

/**
 * Normalise one blocker into the signature that groups rows which say the same thing. The queue repeats
 * an action label ("Verify receipt:") on every row; it is presentation, not the blocker.
 *
 * @param {unknown} reason
 * @returns {string}
 */
function normaliseSignature(reason) {
  return String(reason ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:unblock|verify receipt)\s*:\s*/i, '')
    .trim();
}

/**
 * Group blocked rows by signature, largest group first.
 *
 * @param {Array<{target: string|null, reason: string|null, ownerAction: string|null, proof: string|null}>} rows
 * @returns {Array<{signature: string, count: number, rows: Array<any>}>}
 */
function groupBlocked(rows) {
  /** @type {Map<string, {signature: string, count: number, rows: Array<any>}>} */
  const groups = new Map();
  for (const row of rows) {
    const signature = normaliseSignature(row.reason) || '(no reason given)';
    const key = signature.toLowerCase();
    const group = groups.get(key);
    if (group) {
      group.count++;
      group.rows.push(row);
    } else {
      groups.set(key, { signature, count: 1, rows: [row] });
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.signature.localeCompare(b.signature));
}

/** @param {string} text @param {number} max @returns {string} */
function truncateText(text, max) {
  const s = String(text ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Derive at most three owner decisions from data the model already holds. A card is only emitted for a
 * provider that is not healthy, the largest blocked cluster, or a read that stops the roster.
 *
 * @param {Array<any>|null} providers
 * @param {Array<{signature: string, count: number}>} groups
 * @param {string[]} notes
 * @param {Array<any>|null} defects
 * @returns {Array<{title: string, why: string, command: string}>}
 */
function buildDecisions(providers, groups, notes, defects) {
  /** @type {Array<{title: string, why: string, command: string}>} */
  const out = [];
  /** @type {Record<string, number>} */
  const severity = { broken: 0, 'budget-blocked': 1, capped: 2, unproven: 3, unknown: 4 };
  const badProviders = (providers || [])
    .filter((provider) => provider.state !== 'healthy')
    .sort((a, b) => (severity[a.state] ?? 9) - (severity[b.state] ?? 9) || a.key.localeCompare(b.key));
  for (const provider of badProviders) {
    if (out.length >= 3) break;
    out.push({
      // The title has to say what the command does. route-model is propose-only without --apply,
      // and a one-click mass rewrite of 53 definitions is not a canvas action.
      title: `Propose a route off ${provider.key}`,
      why: `Provider ${provider.key} is ${provider.state} (ok=${provider.ok} err=${provider.err}). The command writes nothing.`,
      command: 'bun hq/bin/hq.mjs route-model',
    });
  }
  if (out.length < 3 && groups.length) {
    const group = groups[0];
    // A cluster that names the placeholder-thread defect already has a falsifier that can go red.
    // Pointing at it is the difference between a real unblock and a card that only reprints state.
    const placeholder = /placeholder thread/i.test(group.signature);
    out.push({
      title: placeholder
        ? `Prove the ${group.count}-row cluster is one defect`
        : `Inspect the largest blocked cluster (${group.count} rows)`,
      why: `${group.count} blocked rows share: ${truncateText(group.signature, 160)}.`,
      command: placeholder ? 'bun test hq/test/channel-evidence.test.mjs' : 'bun hq/bin/hq.mjs team',
    });
  }
  if (out.length < 3) {
    const note = notes.find((entry) => ROSTER_BLOCKING_NOTE.test(entry));
    const defect = (defects || []).find((entry) => ROSTER_BLOCKING_DEFECTS.has(String(entry.kind)));
    if (note || defect) {
      out.push({
        title: 'Inspect the roster read failure',
        why: note || String(defect?.detail || 'the roster could not be read'),
        command: 'bun hq/bin/hq.mjs team',
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

/**
 * Build the plain-JSON model the fragment renders.
 *
 * Totality is the contract: wrong-typed input is replaced by null and recorded in `notes`, so a caller
 * can always render the returned model and a reader can see what could not be read.
 *
 * @param {{snapshot?: any, now?: number, tasksFile?: string|null, tasksText?: string}} [sources]
 * @param {{now?: number, agentsDir?: string, channelRoot?: string}} [opts]
 * @returns {any}
 */
export function buildCanvasModel(sources = {}, opts = {}) {
  const src = /** @type {any} */ (isObject(sources) ? sources : {});
  const options = /** @type {any} */ (isObject(opts) ? opts : {});
  /** @type {string[]} */
  const notes = [];
  const now = typeof src.now === 'number' && Number.isFinite(src.now)
    ? src.now
    : (typeof options.now === 'number' && Number.isFinite(options.now) ? options.now : Date.now());

  /** @type {any} */
  let snapshot = src.snapshot;
  if (!isObject(snapshot)) {
    if (snapshot !== undefined && snapshot !== null) notes.push('snapshot was not an object; it was ignored');
    try {
      snapshot = buildTeamSnapshot({
        agentsDir: options.agentsDir || undefined,
        channelRoot: options.channelRoot || undefined,
        now,
      });
    } catch (error) {
      snapshot = {};
      notes.push(`team snapshot could not be built: ${messageOf(error)}`);
    }
  }

  const generatedAt = strOrNull(snapshot.generatedAt) ?? new Date(now).toISOString();
  if (!strOrNull(snapshot.generatedAt)) notes.push('snapshot.generatedAt was missing; the model timestamp was used');

  // Seats -------------------------------------------------------------------
  /** @type {Array<any>|null} */
  let seats = null;
  if (Array.isArray(snapshot.seats)) {
    seats = snapshot.seats.map((seat, i) => normalizeSeat(seat, i)).sort((a, b) => a.id.localeCompare(b.id));
  } else {
    notes.push('seats could not be read (snapshot.seats is missing or not an array)');
  }

  // Providers ---------------------------------------------------------------
  const healthMap = toMap(snapshot.providerHealth);
  /** @type {Array<any>|null} */
  let providers = null;
  if (healthMap) {
    providers = [...healthMap.entries()]
      .map(([key, value]) => normalizeProvider(key, value))
      .sort((a, b) => a.key.localeCompare(b.key));
  } else {
    notes.push('provider health could not be read (snapshot.providerHealth is missing or not a map/object)');
  }

  // Tasks and queue ---------------------------------------------------------
  const tasks = isObject(snapshot.tasks) ? snapshot.tasks : null;
  if (!tasks) notes.push('task counts could not be read (snapshot.tasks is missing or not an object)');
  const queue = {
    sessions: tasks ? numOrNull(tasks.sessions) : null,
    open: tasks ? numOrNull(tasks.tasks) : null,
    blocked: tasks ? numOrNull(tasks.blocked) : null,
    learnings: tasks ? numOrNull(tasks.learnings) : null,
    defects: tasks ? numOrNull(tasks.defects) : null,
    /** @type {number|null} */
    unbound: null,
  };

  // Blocked rows and unbound tasks -----------------------------------------
  /** @type {string|null} */
  let tasksText = null;
  if (typeof src.tasksText === 'string') {
    tasksText = src.tasksText;
  } else if (src.tasksText !== undefined) {
    notes.push('blocked tasks could not be read: sources.tasksText was not a string');
  } else {
    const file = src.tasksFile === null
      ? null
      : (typeof src.tasksFile === 'string' ? src.tasksFile : DEFAULT_TASKS_FILE);
    if (!file) {
      notes.push('blocked tasks could not be read: no tasks file was supplied');
    } else {
      try {
        if (existsSync(file)) tasksText = readFileSync(file, 'utf8');
        else notes.push(`blocked tasks could not be read: ${file} does not exist`);
      } catch (error) {
        notes.push(`blocked tasks could not be read: ${messageOf(error)}`);
      }
    }
  }

  let blocked = tasksText === null ? [] : parseBlockedTable(tasksText);
  if (tasksText !== null) {
    queue.unbound = parseUnboundSeats(tasksText);
    if (!tasksText.trim()) notes.push('the task queue text was empty');
    else if (!hasBlockedSection(tasksText)) notes.push('the task queue has no ## Blocked section');
  }
  if (blocked.length > BLOCKED_CAP) {
    notes.push(`${blocked.length - BLOCKED_CAP} more blocked row(s) are not shown (cap ${BLOCKED_CAP})`);
    blocked = blocked.slice(0, BLOCKED_CAP);
  }

  // Agents, models, defect-named agents ------------------------------------
  const agents = Array.isArray(snapshot.agents) ? snapshot.agents : null;
  const defects = Array.isArray(snapshot.defects) ? snapshot.defects.filter(isObject) : null;
  if (!agents) notes.push('agent definitions could not be read (snapshot.agents is missing or not an array)');
  if (!defects) notes.push('agent defects could not be read (snapshot.defects is missing or not an array)');

  /** @type {{agents: number|null, models: Array<{model: string, count: number}>, withProtocol: number|null, withContext7: number|null, defectCount: number|null, defectAgents: string[]}} */
  const org = {
    agents: agents ? agents.length : null,
    models: [],
    withProtocol: null,
    withContext7: null,
    defectCount: defects ? defects.length : null,
    defectAgents: [],
  };

  if (agents) {
    /** @type {Map<string, number>} */
    const modelCounts = new Map();
    let withProtocol = 0;
    let withContext7 = 0;
    for (const raw of agents) {
      const agent = isObject(raw) ? raw : {};
      const model = strOrNull(agent.model) ?? 'inherit';
      modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);
      if (Array.isArray(agent.skills) && agent.skills.map(String).includes(PROTOCOL_SKILL)) withProtocol++;
      if (Array.isArray(agent.tools) && agent.tools.map(String).some((tool) => tool.startsWith('mcp__context7__'))) withContext7++;
    }
    org.models = [...modelCounts.entries()]
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count || a.model.localeCompare(b.model));
    org.withProtocol = withProtocol;
    org.withContext7 = withContext7;
  }

  if (defects) {
    const names = new Set();
    for (const defect of defects) {
      const name = strOrNull(defect.agent);
      if (name) names.add(name.trim());
    }
    org.defectAgents = [...names].sort((a, b) => a.localeCompare(b));
  }

  // Next moves --------------------------------------------------------------
  /** @type {Array<{kind: string, target: string, action: string, reason: string}>|null} */
  let nextMoves = null;
  if (Array.isArray(snapshot.nextMoves)) {
    nextMoves = snapshot.nextMoves.filter(isObject).map((move) => ({
      kind: strOrNull(move.kind) ?? 'move',
      target: strOrNull(move.target) ?? '',
      action: strOrNull(move.action) ?? '',
      reason: strOrNull(move.reason) ?? '',
    }));
  } else {
    notes.push('next moves could not be read (snapshot.nextMoves is missing or not an array)');
  }

  const blockedGroups = groupBlocked(blocked);
  const decisions = buildDecisions(providers, blockedGroups, notes, defects);

  return {
    schema: CANVAS_SCHEMA,
    generatedAt,
    verdict: { text: buildVerdict(seats, queue, providers) },
    decisions,
    seats,
    org,
    providers,
    queue,
    blocked,
    blockedGroups,
    nextMoves,
    notes,
  };
}

/**
 * The one sentence a reader sees first. Unknown values are `?`, not a guess.
 *
 * @param {Array<any>|null} seats
 * @param {{open: number|null, blocked: number|null}} queue
 * @param {Array<any>|null} providers
 * @returns {string}
 */
function buildVerdict(seats, queue, providers) {
  const seatPart = seats === null
    ? 'seats unreadable'
    : `${seats.length} ${seats.length === 1 ? 'seat' : 'seats'}, ${seats.filter((seat) => seat.state === 'ACTIVE').length} active`;
  const queuePart = queue.open === null && queue.blocked === null
    ? 'queue unreadable'
    : `${queue.open === null ? '?' : queue.open} open, ${queue.blocked === null ? '?' : queue.blocked} blocked`;
  const broken = providers === null
    ? null
    : providers.filter((provider) => UNAVAILABLE_PROVIDER_STATES.has(provider.state)).length;
  const providerPart = providers === null
    ? 'providers unreadable'
    : `${providers.length} ${providers.length === 1 ? 'provider' : 'providers'}, ${broken} broken`;
  return `${seatPart} · ${queuePart} · ${providerPart}`;
}

// ---------------------------------------------------------------------------
// Fragment rendering
// ---------------------------------------------------------------------------

// Layout only: the host owns typography, colour, spacing utilities and controls. Nothing here sets
// a font size, weight, family, radius or colour, and no host class is redefined.
const CSS = [
  '#hq-canvas{max-width:100%;overflow-wrap:anywhere}',
  '#hq-canvas section{margin:0 0 16px}',
  '#hq-canvas .hq-bar-split{display:flex}',
].join('\n');

// The whole interaction budget: a local row filter plus guarded follow-up actions. Dynamic text is
// carried on data attributes, never interpolated into this script, and every zcode call is optional
// so a standalone export degrades to a readable, static fragment.
const JS = `(function () {
  var root = document.getElementById('hq-canvas');
  if (!root) return;
  var rows = root.querySelectorAll('[data-blocked-row]');
  var groups = root.querySelectorAll('[data-blocked-group]');
  var buttons = root.querySelectorAll('[data-filter]');
  var count = root.querySelector('[data-blocked-count]');
  var current = 'all';
  try {
    var z = window.zcode;
    var saved = z && z.widgetState && z.widgetState.privateContent && z.widgetState.privateContent.blockedFilter;
    if (saved === 'all' || saved === 'unbound' || saved === 'bound') current = saved;
  } catch (e) { current = 'all'; }
  function apply(next, persist) {
    current = next;
    var shown = 0;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var unbound = row.getAttribute('data-owner') === 'unbound';
      var hide = next === 'unbound' ? !unbound : (next === 'bound' ? unbound : false);
      row.hidden = hide;
      if (!hide) shown++;
    }
    for (var g = 0; g < groups.length; g++) {
      var groupRows = groups[g].querySelectorAll('[data-blocked-row]');
      var visible = 0;
      for (var m = 0; m < groupRows.length; m++) if (!groupRows[m].hidden) visible++;
      groups[g].hidden = visible === 0;
    }
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].setAttribute('aria-pressed', String(buttons[j].getAttribute('data-filter') === current));
    }
    if (count) count.textContent = shown + ' shown';
    if (persist) {
      try {
        if (window.zcode && window.zcode.setWidgetState) window.zcode.setWidgetState({ privateContent: { blockedFilter: current } });
      } catch (e) {}
    }
  }
  for (var k = 0; k < buttons.length; k++) {
    buttons[k].addEventListener('click', function () { apply(this.getAttribute('data-filter'), true); });
  }
  apply(current, false);
  var actions = root.querySelectorAll('[data-prompt]');
  for (var n = 0; n < actions.length; n++) {
    actions[n].addEventListener('click', async function () {
      if (!(window.zcode && window.zcode.sendFollowUpMessage)) return;
      try {
        await window.zcode.sendFollowUpMessage({ prompt: this.getAttribute('data-prompt'), title: this.getAttribute('data-title') || 'HQ canvas' });
      } catch (e) {}
    });
  }
})();`;

/** @param {unknown} value @returns {string} */
function cell(value) {
  return value === null || value === undefined || value === '' ? '—' : escapeHtml(value);
}

/** @param {unknown} state @returns {string} */
function seatBadge(state) {
  const s = typeof state === 'string' && SEAT_STATES.includes(state) ? state : 'UNKNOWN';
  return `<span class="viz-badge">${escapeHtml(s)}</span>`;
}

/** @param {unknown} state @returns {string} */
function providerBadge(state) {
  const s = typeof state === 'string' && PROVIDER_STATES.includes(state) ? state : 'unknown';
  const cls = UNAVAILABLE_PROVIDER_STATES.has(s) ? 'viz-badge text-destructive' : (s === 'unknown' ? 'viz-badge text-muted' : 'viz-badge');
  return `<span class="${cls}">${escapeHtml(s)}</span>`;
}

/** @param {string} summary @param {string} inner @returns {string} */
function renderDetails(summary, inner) {
  return `<details><summary class="text-small">${summary}</summary>${inner}</details>`;
}

/** @param {string} label @param {string} text @returns {string} */
function summaryText(label, text) {
  return `<span class="text-muted">${escapeHtml(label)}</span> — ${escapeHtml(text)}`;
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

/** @param {Array<any>|null} seats @returns {string} */
function renderSeats(seats) {
  if (seats === null) return '<p class="text-small text-muted">seats could not be read</p>';
  if (!seats.length) return '<p class="text-small text-muted">no seats registered</p>';
  const rows = seats.map((seat) => {
    const title = seat.title ? ` <span class="text-small text-muted">${escapeHtml(seat.title)}</span>` : '';
    return `<tr><td>${escapeHtml(seat.id)}${title}</td><td>${seatBadge(seat.state)}</td><td class="text-end tabular-nums">${seat.ageMinutes === null ? '—' : `${escapeHtml(seat.ageMinutes)}m`}</td><td class="text-end tabular-nums">${escapeHtml(seat.messages)}</td></tr>`;
  }).join('');
  return `<div class="table-responsive"><table class="table table-sm"><thead><tr><th scope="col">Seat</th><th scope="col">State</th><th scope="col" class="text-end">Age</th><th scope="col" class="text-end">Messages</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** @param {string} label @param {unknown} value @returns {string} */
function statCard(label, value) {
  return `<div class="viz-stat"><div class="text-small text-muted">${escapeHtml(label)}</div><div class="viz-stat-value tabular-nums">${cell(value)}</div></div>`;
}

/** @param {any} org @param {string[]} notes @returns {string} */
function renderOrg(org, notes) {
  const ratio = (n, d) => (n === null || d === null ? '?' : `${n}/${d}`);
  const stats = [
    statCard('agents', org.agents),
    statCard('protocol skill', ratio(org.withProtocol, org.agents)),
    statCard('context7 tools', ratio(org.withContext7, org.agents)),
    statCard('defects', org.defectCount),
  ].join('');
  const models = org.models.length
    ? `<p class="text-small"><span class="text-muted">models</span> ${org.models.map((entry) => `<code>${escapeHtml(entry.model)}</code> <span class="tabular-nums">${escapeHtml(entry.count)}</span>`).join(' · ')}</p>`
    : '<p class="text-small text-muted">no agent model distribution could be read</p>';
  let defectAgents = '';
  if (org.defectAgents.length) {
    const shown = org.defectAgents.slice(0, DEFECT_AGENT_CAP);
    const extra = org.defectAgents.length - shown.length;
    defectAgents = `<p class="text-small text-muted">defect agents: ${shown.map((name) => escapeHtml(name)).join(', ')}${extra > 0 ? ` (+${extra} more)` : ''}</p>`;
  }
  return `<div class="viz-grid">${stats}</div>${models}${defectAgents}${renderNotes(notes)}`;
}

/** @param {number} ok @param {number} err @returns {string} */
function renderBar(ok, err) {
  const total = ok + err;
  const label = total > 0 ? `${ok} ok, ${err} error` : 'no calls observed';
  if (total === 0) return `<div class="progress hq-bar-split" role="img" aria-label="${escapeHtml(label)}"></div>`;
  const okPct = (ok / total) * 100;
  const errPct = 100 - okPct;
  return `<div class="progress hq-bar-split" role="img" aria-label="${escapeHtml(label)}"><div class="progress-bar" style="width:${okPct.toFixed(1)}%;background:var(--viz-series-1)"></div><div class="progress-bar" style="width:${errPct.toFixed(1)}%;background:var(--destructive)"></div></div>`;
}

/** @param {any} provider @returns {string} */
function routePrompt(provider) {
  return `Provider ${provider.key} is ${provider.state} (ok=${provider.ok} err=${provider.err}). Decide whether to route work off it and name the command.`;
}

/** @param {Array<any>|null} providers @returns {string} */
function renderProviders(providers) {
  if (providers === null) return '<p class="text-small text-muted">provider health could not be read</p>';
  if (!providers.length) return '<p class="text-small text-muted">no provider activity in the observed window</p>';
  const rows = providers.map((provider) => {
    const model = provider.model && provider.model !== provider.key ? ` <span class="text-small text-muted">${escapeHtml(provider.model)}</span>` : '';
    const errClass = provider.err > 0 ? 'tabular-nums text-destructive' : 'tabular-nums';
    const action = provider.state === 'healthy'
      ? ''
      : `<button type="button" class="btn btn-ghost btn-xs" data-prompt="${escapeHtml(routePrompt(provider))}" data-title="Route provider">route</button>`;
    return `<tr><td><code class="text-small">${escapeHtml(provider.key)}</code>${model}</td><td>${providerBadge(provider.state)}</td><td><span class="tabular-nums">${escapeHtml(provider.ok)}</span> ok / <span class="${errClass}">${escapeHtml(provider.err)}</span> err${renderBar(provider.ok, provider.err)}</td><td class="text-end tabular-nums">${escapeHtml(provider.avgMs)} ms</td><td class="text-end">${action}</td></tr>`;
  }).join('');
  return `<div class="table-responsive"><table class="table table-sm"><thead><tr><th scope="col">Provider</th><th scope="col">State</th><th scope="col">Ok / err</th><th scope="col" class="text-end">Avg</th><th scope="col" class="text-end"><span class="sr-only">Action</span></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** @param {any} row @returns {string} */
function investigatePrompt(row) {
  return `Investigate the blocked task "${row.target ?? ''}". Reason: ${row.reason ?? ''}. Proof session: ${row.proof ?? 'none'}. Say whether it is really blocked and what single action clears it.`;
}

/** @param {any} row @returns {string} */
function renderBlockedRow(row) {
  const reason = String(row.reason ?? '');
  const shown = reason.length > 140 ? `${reason.slice(0, 139)}…` : reason;
  const owner = String(row.ownerAction ?? '').trim();
  const ownerCell = owner === 'unbound'
    ? '<span class="viz-badge">unbound</span>'
    : (owner ? escapeHtml(owner) : '<span class="text-muted">—</span>');
  const proof = row.proof ? `<div class="text-small text-muted"><code>${escapeHtml(row.proof)}</code></div>` : '';
  const reasonCell = reason
    ? `<span data-tooltip="${escapeHtml(reason)}">${escapeHtml(shown)}</span>`
    : '<span class="text-muted">—</span>';
  const action = `<button type="button" class="btn btn-ghost btn-xs" data-prompt="${escapeHtml(investigatePrompt(row))}" data-title="Investigate blocked task">investigate</button>`;
  const ownerAttr = owner === 'unbound' ? 'unbound' : 'bound';
  return `<tr data-blocked-row data-owner="${ownerAttr}"><td>${cell(row.target)}${proof}</td><td>${reasonCell}</td><td>${ownerCell}</td><td class="text-end">${action}</td></tr>`;
}

/** @param {Array<any>} blocked @param {Array<any>} groups @param {any} queue @returns {string} */
function renderBlockedDetails(blocked, groups, queue) {
  const stats = [
    statCard('sessions', queue.sessions),
    statCard('open', queue.open),
    statCard('blocked', queue.blocked),
    statCard('learnings', queue.learnings),
  ];
  if (queue.unbound !== null) stats.push(statCard('unbound tasks', queue.unbound));
  const statsHtml = `<div class="viz-grid">${stats.join('')}</div>`;
  if (!blocked.length) return `${statsHtml}<p class="text-small text-muted">no blocked rows</p>`;
  const controls = `<div class="viz-row" role="group" aria-label="Filter blocked rows"><button type="button" class="btn btn-sm" data-filter="all" aria-pressed="true">All</button> <button type="button" class="btn btn-sm" data-filter="unbound" aria-pressed="false">Unbound</button> <button type="button" class="btn btn-sm" data-filter="bound" aria-pressed="false">Bound</button> <span class="text-small text-muted" aria-live="polite" data-blocked-count>${escapeHtml(`${blocked.length} shown`)}</span></div>`;
  const shownGroups = groups.slice(0, BLOCKED_GROUP_CAP);
  const groupHtml = shownGroups.map((raw) => {
    const group = isObject(raw) ? raw : {};
    const memberRows = Array.isArray(group.rows) ? group.rows.filter(isObject) : [];
    const count = numOrNull(group.count) ?? memberRows.length;
    const signature = strOrNull(group.signature) ?? '(no reason given)';
    const rows = memberRows.map(renderBlockedRow).join('');
    const summary = `<span class="tabular-nums">${escapeHtml(count)} ×</span> ${escapeHtml(signature)}`;
    return `<details data-blocked-group><summary class="text-small">${summary}</summary><div class="table-responsive"><table class="table table-sm"><thead><tr><th scope="col">Blocked</th><th scope="col">Reason</th><th scope="col">Owner</th><th scope="col" class="text-end"><span class="sr-only">Action</span></th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }).join('');
  const more = groups.length > BLOCKED_GROUP_CAP
    ? `<p class="text-small text-muted">+${groups.length - BLOCKED_GROUP_CAP} more groups — open the task queue</p>`
    : '';
  return `${statsHtml}${controls}${groupHtml}${more}`;
}

/** @param {Array<any>|null} moves @returns {string} */
function renderMoves(moves) {
  if (moves === null) return '<p class="text-small text-muted">next moves could not be read</p>';
  if (!moves.length) return '<p class="text-small text-muted">no next moves</p>';
  const rows = moves.map((move) => `<tr><td><span class="viz-badge">${cell(move.kind)}</span></td><td><code class="text-small">${cell(move.target)}</code></td><td><code class="text-small">${cell(move.action)}</code></td><td class="text-small text-muted">${cell(move.reason)}</td></tr>`).join('');
  return `<div class="table-responsive"><table class="table table-sm"><thead><tr><th scope="col">Kind</th><th scope="col">Target</th><th scope="col">Command</th><th scope="col">Reason</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** @param {string[]} notes @returns {string} */
function renderNotes(notes) {
  if (!notes.length) return '';
  const shown = notes.slice(0, NOTE_CAP);
  const extra = notes.length - shown.length;
  const items = shown.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  const more = extra > 0 ? `<li>(+${extra} more)</li>` : '';
  return `<ul class="text-small text-muted">${items}${more}</ul>`;
}

/**
 * Render the model as a fragment for one conversation message.
 *
 * Above the fold: the verdict line and at most three decision cards. Everything else is a native
 * `<details>` drill-in, so the collapsed state is still informative and needs no scripting.
 * `opts` is accepted for forward compatibility and is unused today.
 *
 * @param {any} model
 * @param {any} [opts]
 * @returns {string}
 */
export function renderCanvasFragment(model, opts = {}) {
  const m = /** @type {any} */ (isObject(model) ? model : {});
  const generatedAt = strOrNull(m.generatedAt) ?? '';
  const verdict = isObject(m.verdict) && typeof m.verdict.text === 'string' ? m.verdict.text : 'no verdict available';
  const org = isObject(m.org)
    ? {
        agents: numOrNull(m.org.agents),
        models: Array.isArray(m.org.models) ? m.org.models : [],
        withProtocol: numOrNull(m.org.withProtocol),
        withContext7: numOrNull(m.org.withContext7),
        defectCount: numOrNull(m.org.defectCount),
        defectAgents: Array.isArray(m.org.defectAgents) ? m.org.defectAgents.filter((name) => typeof name === 'string') : [],
      }
    : { agents: null, models: [], withProtocol: null, withContext7: null, defectCount: null, defectAgents: [] };
  const seats = m.seats === undefined ? null : m.seats;
  const providers = m.providers === undefined ? null : m.providers;
  const moves = m.nextMoves === undefined ? null : m.nextMoves;
  const blocked = Array.isArray(m.blocked) ? m.blocked.filter(isObject) : [];
  const groups = Array.isArray(m.blockedGroups) ? m.blockedGroups.filter(isObject) : [];
  const decisions = Array.isArray(m.decisions) ? m.decisions : [];
  const notes = Array.isArray(m.notes) ? m.notes.filter((note) => typeof note === 'string') : [];
  const queue = isObject(m.queue)
    ? m.queue
    : { sessions: null, open: null, blocked: null, learnings: null, defects: null, unbound: null };

  const seatsValue = Array.isArray(seats) ? seats : null;
  const providersValue = Array.isArray(providers) ? providers : null;
  const movesValue = Array.isArray(moves) ? moves : null;
  const activeSeats = seatsValue ? seatsValue.filter((seat) => seat.state === 'ACTIVE').length : 0;
  const badProviders = providersValue ? providersValue.filter((provider) => provider.state !== 'healthy').length : 0;

  const seatHeadline = seatsValue === null ? 'unreadable · 0 shown' : `${seatsValue.length} seats · ${activeSeats} active`;
  const orgHeadline = org.agents === null ? 'unreadable · 0 read' : `${org.agents} agents · ${org.defectCount ?? 0} defects · ${notes.length} notes`;
  const providerHeadline = providersValue === null ? 'unreadable · 0 shown' : `${providersValue.length} providers · ${badProviders} not healthy`;
  const blockedHeadline = `${blocked.length} rows · ${groups.length} groups`;
  const movesHeadline = movesValue === null ? 'unreadable · 0 shown' : `${movesValue.length} moves`;

  const verdictLine = `<p>${escapeHtml(verdict)} <span class="text-small text-muted">generated <time datetime="${escapeHtml(generatedAt)}">${escapeHtml(generatedAt || 'unknown')}</time></span></p>`;
  const needsOwner = `<section aria-label="Needs the owner"><div class="text-small text-muted">NEEDS THE OWNER</div>${renderDecisions(decisions)}</section>`;

  return [
    `<div id="${CANVAS_ROOT_ID}" class="viz-root" data-schema="${escapeHtml(m.schema ?? CANVAS_SCHEMA)}">`,
    `<style>${CSS}</style>`,
    verdictLine,
    needsOwner,
    renderDetails(summaryText('SEATS', seatHeadline), renderSeats(seatsValue)),
    renderDetails(summaryText('ORG', orgHeadline), renderOrg(org, notes)),
    renderDetails(summaryText('PROVIDERS', providerHeadline), renderProviders(providersValue)),
    renderDetails(summaryText('BLOCKED', blockedHeadline), renderBlockedDetails(blocked, groups, queue)),
    renderDetails(summaryText('NEXT MOVES', movesHeadline), renderMoves(movesValue)),
    `<footer class="text-small text-muted">regenerate: <code>bun hq/bin/hq.mjs canvas</code></footer>`,
    `<script>${JS}</script>`,
    `</div>`,
  ].join('\n');
}
