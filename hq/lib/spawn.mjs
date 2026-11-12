// @ts-check
/**
 * @hq:context The policy of one conversation spawning another: who may delegate, what mode the child runs in,
 *   how deep and how wide the tree may go, and the JSONL ledger that proves the tree afterwards.
 * @hq:owner agent-platform-ceo
 * @hq:task spawn-conversations
 * @hq:invariant a manager is plan mode with Write and Edit disallowed. A delegating conversation that can
 *   edit code is the defect this module exists to remove, so the policy is data, not a caller's choice.
 * @hq:invariant this module is pure: no fs, no child_process, no clock, no env. Time enters through the
 *   caller's row.at, files through the caller's ledgerText, and the process through hq/bin/spawn.mjs.
 * @hq:invariant a refusal carries a stable code from SPAWN_CODES, never prose a caller must match.
 * @hq:invariant depth and fanout are LIMITS THE CALLER SUPPLIES — planSpawn's second argument. A supplied
 *   maxDepth or maxChildren must be a finite non-negative integer; Infinity, NaN, a negative and a fraction
 *   are REFUSED with DEPTH_EXCEEDED / FANOUT_EXCEEDED, never silently replaced by a default and never
 *   accepted as unbounded. A dimension the caller omits keeps the frozen floor.
 * @hq:invariant nothing in this module accumulates: a wide call cannot widen the next one, because the caps
 *   live in the call and in no module state.
 * @hq:invariant appendSpawn returns new text. The caller's string is never modified, so a refused spawn can
 *   leave the ledger byte-identical.
 * @hq:why depth is ZERO-BASED and one scale serves all three readers: the root of a tree is depth 0, its
 *   child 1, its grandchild 2. maxDepth 3 therefore allows root -> child -> grandchild -> great-grandchild
 *   and refuses a request for depth 4. The ledger stores the same number the policy checked, and renderTree
 *   indents by exactly that number, so a row can never mean two different things in two places.
 * @hq:why a root is the most recent row with no parent, so an owner-driven spawn that passes no --parent is
 *   still the thing `tree` shows by default.
 * @hq:why the caps are parameters and not constants: the owner's direction of 2026-11-04 is that a fleet of
 *   dozens is a decision a caller makes, not a code change. DEFAULT_LIMITS stay the safe floor for a caller
 *   that says nothing (the CLI today), and FLEET_LIMITS is a named wider preset for a caller that has
 *   decided. A cap that cannot be stated as a finite integer is not a decision, so it is refused.
 * @hq:see hq/bin/spawn.mjs · hq/test/spawn.test.mjs · hq/lib/channel-transport.mjs
 */

/** Stable refusal codes. A caller switches on these; the detail string is for humans only. */
export const SPAWN_CODES = Object.freeze({
  DEPTH_EXCEEDED: 'DEPTH_EXCEEDED',
  FANOUT_EXCEEDED: 'FANOUT_EXCEEDED',
  BAD_ROLE: 'BAD_ROLE',
  BAD_PARENT: 'BAD_PARENT',
  EMPTY_BRIEF: 'EMPTY_BRIEF',
  BAD_CWD: 'BAD_CWD',
  BAD_LIMITS: 'BAD_LIMITS',
});

/** The one ledger, repo-relative so a caller can resolve it against any root. */
export const SPAWN_LEDGER = 'hq/work/spawns.jsonl';

/**
 * The floor, frozen: 3 generations deep, 4 children per conversation. planSpawn uses a
 * dimension only when the caller supplied no cap for it, so a caller that says nothing
 * gets exactly the behaviour it had before the caps became a parameter.
 */
export const DEFAULT_LIMITS = Object.freeze({ maxDepth: 3, maxChildren: 4 });

/**
 * A named wider preset for a fleet of dozens — a starting point a caller opts into, never a
 * ceiling: the truth is in planSpawn's second argument. 12 children per conversation and four
 * generations is a tree of dozens with room for a manager layer and its workers.
 */
export const FLEET_LIMITS = Object.freeze({ maxDepth: 4, maxChildren: 12 });

/**
 * What each role is allowed to be. Data, not branches, so a new role cannot
 * quietly arrive with write access by falling through a default.
 */
export const ROLES = Object.freeze({
  manager: Object.freeze({ mode: 'plan', disallowedTools: Object.freeze(['Write', 'Edit']) }),
  worker: Object.freeze({ mode: 'yolo', disallowedTools: Object.freeze([]) }),
});

const SESSION_ID = /^sess_[A-Za-z0-9._-]+$/;

/** Absolute on win32 (drive or UNC) or posix, decided syntactically: purity forbids fs existence checks. */
function isAbsolutePath(p) {
  return /^[A-Za-z]:[\\/]/.test(p) || /^\\\\/.test(p) || /^\//.test(p);
}

/**
 * A refusal is a value, not an exception: the `ok: false` literal is part of the
 * type so a caller can narrow on it without a cast.
 * @param {string} code
 * @param {string} detail
 * @returns {{ok: false, code: string, detail: string}}
 */
function refuse(code, detail) {
  return { ok: false, code, detail };
}

/** A number printed faithfully: JSON.stringify renders NaN and Infinity as "null", hiding the defect. */
function showLimit(value) {
  return typeof value === 'number' ? String(value) : (JSON.stringify(value) ?? String(value));
}

/**
 * @typedef {{maxDepth?: number, maxChildren?: number}} SpawnLimits
 */

/**
 * Turn whatever the caller passed into the caps planSpawn enforces. Three answers, and the
 * difference is the point: an omitted dimension keeps the frozen floor, a valid cap is used
 * as given, and an invalid one is a REFUSAL — never a silent fallback to the default, and
 * never an Infinity that would make the cap disappear.
 *
 * @param {SpawnLimits|null|undefined} limits
 * @returns {{ok: true, limits: {maxDepth: number, maxChildren: number}} | {ok: false, code: string, detail: string}}
 */
export function resolveLimits(limits) {
  /** @type {{maxDepth: number, maxChildren: number}} */
  const caps = { maxDepth: DEFAULT_LIMITS.maxDepth, maxChildren: DEFAULT_LIMITS.maxChildren };
  if (limits === undefined || limits === null) return { ok: true, limits: caps };
  if (typeof limits !== 'object' || Array.isArray(limits)) {
    return refuse(SPAWN_CODES.BAD_LIMITS, `limits must be an object, got ${showLimit(limits)}`);
  }

  const maxDepth = limits.maxDepth;
  if (maxDepth !== undefined) {
    if (typeof maxDepth !== 'number' || !Number.isFinite(maxDepth) || !Number.isInteger(maxDepth) || maxDepth < 0) {
      return refuse(SPAWN_CODES.DEPTH_EXCEEDED, `maxDepth must be a finite non-negative integer, got ${showLimit(maxDepth)}`);
    }
    caps.maxDepth = maxDepth;
  }

  const maxChildren = limits.maxChildren;
  if (maxChildren !== undefined) {
    if (typeof maxChildren !== 'number' || !Number.isFinite(maxChildren) || !Number.isInteger(maxChildren) || maxChildren < 0) {
      return refuse(SPAWN_CODES.FANOUT_EXCEEDED, `maxChildren must be a finite non-negative integer, got ${showLimit(maxChildren)}`);
    }
    caps.maxChildren = maxChildren;
  }

  return { ok: true, limits: caps };
}

/**
 * Decide whether this spawn is allowed. Nothing here knows about the CLI, the
 * ledger file or the clock: the caller measures depth, children and time.
 *
 * Depth and fanout are the caller's to set: pass `{maxDepth, maxChildren}` to
 * run a fleet of dozens, pass nothing for the frozen floor. A cap that is not a
 * finite non-negative integer is refused, not rounded and not ignored.
 *
 * @param {{role?: string, parent?: string|null, depth?: number, children?: number, brief?: string, cwd?: string|null}} input
 * @param {SpawnLimits|null} [limits]
 * @returns {{ok: true, mode: string, disallowedTools: string[], depth: number} | {ok: false, code: string, detail: string}}
 */
export function planSpawn(input, limits = DEFAULT_LIMITS) {
  const { role, parent = null, depth = 0, children = 0, brief, cwd = null } = input ?? {};
  const caps = resolveLimits(limits);
  if (caps.ok === false) return caps;
  const { maxDepth, maxChildren } = caps.limits;

  const policy = /** @type {Record<string, {mode: string, disallowedTools: readonly string[]}>} */ (ROLES)[String(role)];
  if (!policy) return refuse(SPAWN_CODES.BAD_ROLE, `role must be manager or worker, got ${JSON.stringify(role)}`);

  if (typeof brief !== 'string' || brief.trim() === '') {
    return refuse(SPAWN_CODES.EMPTY_BRIEF, 'the child needs a brief; an empty one produces a conversation with no goal');
  }

  if (cwd !== null && cwd !== undefined && !isAbsolutePath(String(cwd))) {
    return refuse(SPAWN_CODES.BAD_CWD, `cwd must be absolute, got ${JSON.stringify(cwd)}`);
  }

  const hasParent = parent !== null && parent !== undefined;
  if (hasParent && !SESSION_ID.test(String(parent))) {
    return refuse(SPAWN_CODES.BAD_PARENT, `parent must be a sess_ session id, got ${JSON.stringify(parent)}`);
  }

  const d = Number(depth);
  if (!Number.isInteger(d) || d < 0) {
    return refuse(SPAWN_CODES.DEPTH_EXCEEDED, `depth must be a zero-based integer, got ${JSON.stringify(depth)}`);
  }
  if (!hasParent && d > 0) {
    return refuse(SPAWN_CODES.BAD_PARENT, `depth ${d} needs a parent session; only a root sits at depth 0`);
  }
  if (d > maxDepth) {
    return refuse(SPAWN_CODES.DEPTH_EXCEEDED, `depth ${d} exceeds the cap of ${maxDepth}; that child may not delegate further`);
  }

  const c = Number(children);
  if (!Number.isInteger(c) || c < 0) {
    return refuse(SPAWN_CODES.FANOUT_EXCEEDED, `children must be a count, got ${JSON.stringify(children)}`);
  }
  // Fanout caps a conversation's delegation, not how many conversations may be started: a root has no
  // parent for the figure to describe, so the cap does not apply to it. Without this guard a maxChildren
  // of 0 would refuse the root itself — a floor that forbids everything is not a floor a caller can state.
  if (hasParent && c >= maxChildren) {
    return refuse(SPAWN_CODES.FANOUT_EXCEEDED, `${c} children already exist and the cap is ${maxChildren}; one of them must finish first`);
  }

  return { ok: true, mode: policy.mode, disallowedTools: [...policy.disallowedTools], depth: d };
}

/**
 * The exact text handed to the child. It must name the conversation that
 * spawned it, state one acceptance command, and tell the child it may itself
 * spawn: recursion is the point, and a child that does not know the command
 * re-derives it wrongly.
 *
 * @param {{role: string, goal: string, parent?: string|null, acceptance?: string}} input
 * @returns {string}
 */
export function buildBrief({ role, goal, parent, acceptance }) {
  const parentLine = parent
    ? `Parent session: ${parent}. Report to that conversation; it cannot see your files unless you say where they are.`
    : 'Parent: none — no parent conversation; this is a root started by a human.';
  const acceptLine = String(acceptance ?? 'bun test')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)[0] || 'bun test';

  return [
    `You are a spawned ${role} conversation.`,
    '',
    parentLine,
    '',
    'Goal:',
    String(goal ?? '').trim(),
    '',
    'Acceptance — one command, and it must pass before you report done:',
    acceptLine,
    '',
    'You may spawn further conversations yourself (this is allowed and expected for large work):',
    '  bun hq/bin/spawn.mjs new --brief "<what that child must do>" --role manager|worker --parent <this session id>',
    'A manager plans and delegates and never edits code. A worker edits and verifies. Depth and fanout are capped.',
    'Report back in one line: DONE / BLOCKED / RUNNING, then the evidence.',
  ].join('\n');
}

/**
 * One ledger row as one JSONL line. Non-mutating: the input text is returned
 * unchanged inside the result, so a caller that refuses to write leaves the
 * ledger exactly as it found it.
 *
 * @param {string} ledgerText
 * @param {Record<string, any>} row
 * @returns {string}
 */
export function appendSpawn(ledgerText, row) {
  if (!row || typeof row !== 'object') throw new TypeError('appendSpawn needs a row object');
  if (typeof row.sessionId !== 'string' || row.sessionId === '') throw new TypeError('a ledger row needs a sessionId');
  const base = typeof ledgerText === 'string' ? ledgerText : '';
  const sep = base === '' || base.endsWith('\n') ? '' : '\n';
  return `${base}${sep}${JSON.stringify(row)}\n`;
}

/** @param {string} text */
function parseRows(text) {
  /** @type {any[]} */
  const rows = [];
  for (const line of String(text ?? '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row && typeof row.sessionId === 'string') rows.push(row);
    } catch { /* a corrupt line is skipped: the tree must still render */ }
  }
  return rows;
}

/** @param {any} r */
function toNode(r) {
  return {
    sessionId: r.sessionId,
    parent: r.parent ?? null,
    depth: typeof r.depth === 'number' ? r.depth : null,
    role: r.role ?? null,
    goal: r.goal ?? null,
    at: r.at ?? null,
  };
}

/** The most recent row with no parent, so an owner-driven spawn is what `tree` shows by default. */
function mostRecentRoot(rows) {
  for (let i = rows.length - 1; i >= 0; i--) if (!rows[i].parent) return rows[i];
  return rows[0] ?? null;
}

/**
 * Walk the ledger from a root and compute each node's real depth from its
 * parent chain, rather than trusting a recorded depth. A row whose parent is
 * absent from the ledger is an orphan: reported, never silently dropped, and
 * never grafted onto the root.
 *
 * @param {string} ledgerText
 * @param {string} [rootSessionId]
 * @returns {{root: any|null, nodes: any[], orphans: any[]}}
 */
export function readTree(ledgerText, rootSessionId) {
  const rows = parseRows(ledgerText);
  const byId = new Map(rows.map((r) => [r.sessionId, r]));
  const rootRow = rootSessionId ? byId.get(rootSessionId) : mostRecentRoot(rows);
  if (!rootRow) return { root: null, nodes: [], orphans: rootSessionId ? rows.map(toNode) : [] };

  /** @type {any[]} */
  const nodes = [];
  const seen = new Set();
  /** @type {{row: any, depth: number}[]} */
  const queue = [{ row: rootRow, depth: 0 }];
  while (queue.length > 0) {
    const { row, depth } = /** @type {{row: any, depth: number}} */ (queue.shift());
    if (seen.has(row.sessionId)) continue;
    seen.add(row.sessionId);
    nodes.push({
      sessionId: row.sessionId,
      parent: row.parent ?? null,
      depth,
      role: row.role ?? null,
      goal: row.goal ?? null,
      at: row.at ?? null,
    });
    for (const child of rows) {
      if (child.parent === row.sessionId && !seen.has(child.sessionId)) queue.push({ row: child, depth: depth + 1 });
    }
  }

  const orphans = rows.filter((r) => !seen.has(r.sessionId)).map(toNode);

  return { root: nodes[0] ?? null, nodes, orphans };
}

/**
 * Indented lines, two spaces per generation. Plain text on purpose: this is
 * read in a terminal and pasted into a report.
 *
 * @param {{root: any|null, nodes: any[], orphans?: any[]}} tree
 * @returns {string}
 */
export function renderTree(tree) {
  const nodes = tree?.nodes ?? [];
  if (nodes.length === 0) return '(no spawns recorded)';
  const lines = nodes.map((n) => {
    const indent = '  '.repeat(Math.max(0, Number(n.depth ?? 0)));
    const goal = n.goal ? ` — ${n.goal}` : '';
    return `${indent}${n.sessionId} [${n.role ?? '?'}] d${n.depth ?? '?'}${goal}`;
  });
  const orphans = tree?.orphans ?? [];
  if (orphans.length > 0) {
    lines.push('', 'orphans (parent not in this ledger):');
    for (const o of orphans) lines.push(`  ${o.sessionId} [${o.role ?? '?'}] parent=${o.parent ?? '-'}`);
  }
  return lines.join('\n');
}
