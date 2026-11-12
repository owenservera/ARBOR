/**
 * @hq:context One panel over the whole agent team: definitions, seats, live sessions, tasks, provider health and next moves.
 * @hq:owner hq-agent
 * @hq:task team-control
 * @hq:invariant read-only; it never wakes a seat, never sends, never edits an agent definition.
 * @hq:see docs/AGENT-BUS.md
 *
 * `hq comms` is the transport roof and costs about five seconds, because it probes the channels
 * that decide whether a message can travel. This panel is the management roof: it answers "who is
 * on the team, what is running, what is stuck and what should I do next" in well under a second,
 * because those questions never need the transport probes.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { loadSeats, roster } from './channel-seats.mjs';
import { classifyHealth, summarizeUsage } from './model-router.mjs';

// bun:sqlite is loaded through createRequire so this module still loads under Node, where the
// session database is simply unreachable and the panel degrades to the definition-level view.
const nodeRequire = createRequire(import.meta.url);
function openDatabase(path) {
  return new (nodeRequire('bun:sqlite').Database)(path, { readonly: true });
}

export const DEFAULT_AGENTS_DIR = join(process.env.USERPROFILE || process.env.HOME || '', '.zcode', 'agents');
export const DEFAULT_CHANNEL_ROOT = 'C:/VIVIM/channel';
export const DEFAULT_SESSION_DB = join(process.env.USERPROFILE || process.env.HOME || '', '.zcode', 'cli', 'db', 'db.sqlite');

/** Tools this ZCode build does not expose; a grant naming one makes the agent crash on use. */
export const NONEXISTENT_TOOLS = ['Glob', 'Grep'];
/** MCP tools every agent must be able to reach — Context7 is the top of the memory stack. */
export const CONTEXT7_TOOLS = ['mcp__context7__resolve-library-id', 'mcp__context7__query-docs'];
export const PROTOCOL_SKILL = 'team-protocol';
/**
 * Reasoning levels a provider on this machine will actually start a session with.
 *
 * @hq:why this list and not `max`. Measured 2026-11-05: every named-agent spawn failed with
 *   `reasoning-level-not-supported` on a roster pinned to `max`, while the same providers
 *   answered at low/medium/high. The panel used to flag anything that was NOT `max` as
 *   unlaunchable, so the auditor taught the roster to carry the one unusable level.
 */
export const LAUNCHABLE_THOUGHT_LEVELS = Object.freeze(['low', 'medium', 'high']);
/** The tools this build exposes to a subagent. Anything outside this set fails at call time. */
export const KNOWN_TOOLS = Object.freeze([
  'Read', 'Write', 'Edit', 'Bash', 'TodoWrite', 'TodoRead', 'WebFetch', 'Skill',
  'Agent', 'SendMessage', 'AskUserQuestion', 'EnterPlanMode', 'ExitPlanMode',
  'CronCreate', 'CronList', 'CronUpdate', 'CronDelete', 'TaskOutput', 'TaskStop',
  'ReadSessionContext', 'ListModels', 'ListSavedWorkflows', 'ListWorkflowRuns',
  'GetWorkflowRun', 'ResumeWorkflowRun', 'AmendWorkflow', 'CreateWorkflow', 'SaveWorkflow',
  'FillWorkflowHole', 'EvalWorkflowSnippet', 'ResolveWorkflowQuestion',
  'mcp__context7__resolve-library-id', 'mcp__context7__query-docs',
]);

/**
 * Parse one agent definition file.
 *
 * @param {string} text
 * @param {string} [fileName]
 * @returns {{name: string|null, description: string, model: string|null, thoughtLevel: string|null,
 *            maxTurns: number|null, tools: string[]|null, skills: string[], requiredMcpServers: string[],
 *            hasFrontmatter: boolean, body: string}}
 */
export function parseAgentFile(text, fileName = '') {
  const src = String(text ?? '');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const lines = src.split(/\r?\n/);
  const hasFrontmatter = lines[0]?.trim() === '---';
  const end = hasFrontmatter ? lines.findIndex((l, i) => i > 0 && l.trim() === '---') : -1;
  // An unterminated block is not frontmatter: the body never becomes a system prompt.
  const frontmatterClosed = end > 0;
  const fm = frontmatterClosed ? lines.slice(1, end) : [];
  const body = frontmatterClosed ? lines.slice(end + 1).join(eol) : src;

  const scalar = (key) => {
    const line = fm.find((l) => l.startsWith(`${key}:`));
    if (!line) return null;
    let v = line.slice(key.length + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v;
  };
  const list = (key) => {
    const v = scalar(key);
    if (v === null) return [];
    const inner = v.startsWith('[') && v.endsWith(']') ? v.slice(1, -1) : v;
    return inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  };
  const maxTurnsRaw = scalar('maxTurns');
  return {
    name: scalar('name'),
    description: scalar('description') || '',
    model: scalar('model'),
    thoughtLevel: scalar('thoughtLevel'),
    maxTurns: maxTurnsRaw === null ? null : Number(maxTurnsRaw) || null,
    tools: scalar('tools') === null ? null : list('tools'),
    skills: list('skills'),
    requiredMcpServers: list('requiredMcpServers'),
    hasFrontmatter: frontmatterClosed,
    body,
    fileName,
  };
}

/**
 * Audit a set of agent definitions.
 *
 * @param {Array<{file: string, text: string}>} files
 * @param {{registeredAgentTypes?: string[]}} [opts]
 * @returns {{agents: Array<Object>, defects: Array<Object>}}
 */
export function auditAgentDefs(files, opts = {}) {
  const registered = new Set(opts.registeredAgentTypes || []);
  const agents = [];
  const defects = [];
  const add = (kind, severity, agent, detail, evidence) => defects.push({ kind, severity, agent, detail, evidence });

  for (const f of files || []) {
    const a = parseAgentFile(f.text, f.file);
    const entry = { file: f.file, name: a.name, model: a.model, thoughtLevel: a.thoughtLevel, tools: a.tools, skills: a.skills, requiredMcpServers: a.requiredMcpServers, hasFrontmatter: a.hasFrontmatter };
    agents.push(entry);

    if (!a.hasFrontmatter) { add('no-frontmatter', 'high', a.name || f.file, 'the definition has no YAML frontmatter, so the body is not a system prompt', f.file); continue; }
    if (!a.name) add('missing-name', 'high', f.file, 'no `name` in frontmatter, so the agent type can never be dispatched', f.file);
    else if (registered.size && !registered.has(a.name)) add('agent-not-registered', 'medium', a.name, 'the definition exists but the agent type is not in the registered list for this session', f.file);

    if (a.tools && a.tools.length) {
      const missing = a.tools.filter((t) => NONEXISTENT_TOOLS.includes(t));
      if (missing.length) add('nonexistent-tool', 'high', a.name || f.file, `grants ${missing.join('/')}, which this build does not expose`, 'Tool not found: Glob');
      if (!a.tools.some((t) => t.startsWith('mcp__context7__'))) {
        add('context7-unreachable', 'medium', a.name || f.file, 'the tool allow-list strips the Context7 MCP tools, so this agent cannot pull vendor behaviour from Context7', 'agent `tools` allow-list is applied after MCP tools enter the candidate set');
      }
    }
    if (!a.model) add('missing-model', 'low', a.name || f.file, 'no explicit model, so the agent silently follows whatever model the session happens to be on', 'model: inherit');
    if (!a.skills.includes(PROTOCOL_SKILL)) add('no-protocol-grant', 'medium', a.name || f.file, `does not grant the shared ${PROTOCOL_SKILL} skill`, `skills: [${PROTOCOL_SKILL}]`);
    if (!a.requiredMcpServers.includes('context7')) add('context7-not-required', 'low', a.name || f.file, 'context7 is not a required MCP server for this agent', 'requiredMcpServers: [context7]');
    if (a.model && a.model !== 'inherit') {
      const level = String(a.thoughtLevel ?? '').toLowerCase();
      if (!level) {
        add('thought-level', 'low', a.name || f.file, `pins ${a.model} with no thoughtLevel, so it inherits the session default`, 'thoughtLevel: high');
      } else if (!LAUNCHABLE_THOUGHT_LEVELS.includes(level)) {
        // @hq:why this rule used to demand `max` and that is what broke the roster on 2026-11-05.
        // Every provider reached from this machine refuses `max`; the CLI accepts low/medium/high.
        // An auditor that demanded the unusable level taught the roster to carry it.
        add('thought-level', 'high', a.name || f.file, `pins ${a.model} with thoughtLevel ${a.thoughtLevel}, which providers here refuse — it will not launch`, 'Reasoning level unsupported / 不支持所选思考档位');
      }
    }
  }
  agents.sort((a, b) => String(a.name || a.file).localeCompare(String(b.name || b.file)));
  defects.sort((a, b) => a.severity.localeCompare(b.severity));
  return { agents, defects };
}

/**
 * Compare agent definitions' instructions (model pin + thoughtLevel) within each shared
 * skill, and report which conflict and which instruction takes precedence.
 *
 * A conflict exists when two definitions grant the same skill but disagree on the model
 * pin or the reasoning level, so a task routed by that skill is ambiguous about which
 * instruction actually governs it.
 *
 * Precedence rule (documented, not invented): an explicit, launchable model pin
 * (model set + thoughtLevel in low/medium/high or unset) takes precedence over a missing
 * pin or an unlaunchable level; among equal pins the first definition read wins and the
 * later one is recorded as shadowed.
 *
 * @param {Array<{file: string, text: string}>} files
 * @returns {{conflicts: Array<{skill: string, agents: Array<{file: string, name: string|null, model: string|null, thoughtLevel: string|null}>, detail: string}>, precedence: Array<{skill: string, winner: string|null, reason: string, shadowed: string[]}>}}
 */
export function auditAgentConflicts(files) {
  const bySkill = new Map();
  for (const f of files || []) {
    const a = parseAgentFile(f.text, f.file);
    if (!a.name) continue;
    for (const skill of a.skills || []) {
      if (!bySkill.has(skill)) bySkill.set(skill, []);
      bySkill.get(skill).push({
        file: f.file,
        name: a.name,
        model: a.model,
        thoughtLevel: a.thoughtLevel,
      });
    }
  }

  const conflicts = [];
  const precedence = [];
  for (const [skill, agents] of bySkill.entries()) {
    if (agents.length < 2) continue;
    // Group by (model, thoughtLevel) signature to find disagreement.
    const signatures = new Map();
    for (const a of agents) {
      const sig = `${String(a.model ?? 'inherit')}::${String(a.thoughtLevel ?? '-')}`;
      if (!signatures.has(sig)) signatures.set(sig, []);
      signatures.get(sig).push(a);
    }
    if (signatures.size > 1) {
      conflicts.push({
        skill,
        agents: agents.map((a) => ({ file: a.file, name: a.name, model: a.model, thoughtLevel: a.thoughtLevel })),
        detail: `${agents.length} definitions grant "${skill}" but disagree on model pin or thoughtLevel — the skill's governing instruction is ambiguous`,
      });
    }

    // Precedence: explicit launchable pin wins; unlaunchable/missing pins are shadowed.
    const ranked = [...agents].sort((a, b) => {
      const score = (x) => {
        const hasModel = Boolean(x.model);
        const level = String(x.thoughtLevel ?? '').toLowerCase();
        const launchable = !level || LAUNCHABLE_THOUGHT_LEVELS.includes(level);
        return (hasModel ? 2 : 0) + (launchable ? 1 : 0);
      };
      return score(b) - score(a);
    });
    const winner = ranked[0];
    const shadowed = ranked.slice(1).map((a) => a.name);
    const reason = winner.model
      ? `explicit model pin ${winner.model}` + (winner.thoughtLevel ? ` with thoughtLevel ${winner.thoughtLevel}` : '')
      : 'first definition read (no explicit pin)';
    precedence.push({
      skill,
      winner: winner.name,
      reason: `for "${skill}" the instruction ${reason} takes precedence`,
      shadowed,
    });
  }
  conflicts.sort((a, b) => a.skill.localeCompare(b.skill));
  precedence.sort((a, b) => a.skill.localeCompare(b.skill));
  return { conflicts, precedence };
}

/**
 * Read the agent definitions from a directory.
 *
 * @param {string} agentsDir
 * @returns {Array<{file: string, text: string}>}
 */
export function collectAgentFiles(agentsDir) {
  if (!agentsDir || !existsSync(agentsDir)) return [];
  return readdirSync(agentsDir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => ({ file, text: readFileSync(join(agentsDir, file), 'utf8') }));
}

/**
 * Parse the counts line out of the dogfood task queue.
 *
 * @param {string} text
 * @returns {{sessions: number|null, tasks: number|null, blocked: number|null, learnings: number|null, defects: number|null}}
 */
export function parseTaskCounts(text) {
  const line = String(text ?? '').split(/\r?\n/).find((l) => l.includes('**Counts:**')) || '';
  const num = (re) => {
    const m = line.match(re);
    return m ? Number(m[1]) : null;
  };
  // The count precedes its label in this format: "23 sessions · 74 open tasks (28 blocked) · …".
  return {
    sessions: num(/(\d+)\s+sessions/),
    tasks: num(/(\d+)\s+open tasks/),
    blocked: num(/\((\d+)\s+blocked\)/),
    learnings: num(/(\d+)\s+learnings/),
    defects: num(/(\d+)\s+defects/),
  };
}

/**
 * Read live session ids from the ZCode session database.
 *
 * @param {string} dbPath
 * @param {{liveWindowMinutes?: number, now?: number}} [opts]
 * @returns {Map<string, {id: string, title: string, updated: number, directory: string, messages: number}>}
 */
export function readLiveSessions(dbPath, opts = {}) {
  const out = new Map();
  if (!dbPath || !existsSync(dbPath)) return out;
  const now = opts.now ?? Date.now();
  const windowMs = (opts.liveWindowMinutes ?? 30) * 60 * 1000;
  let db;
  try {
    db = openDatabase(dbPath);
    const rows = db.query('SELECT id, title, directory, time_updated FROM session WHERE time_updated > ? AND time_deleted IS NULL ORDER BY time_updated DESC LIMIT 200').all(now - windowMs);
    for (const r of rows) {
      let messages = 0;
      try { messages = db.query('SELECT COUNT(*) AS c FROM message WHERE session_id = ?').get(r.id)?.c ?? 0; } catch { messages = 0; }
      out.set(r.id, { id: r.id, title: r.title, updated: r.time_updated, directory: r.directory, messages });
    }
  } catch {
    return out;
  } finally {
    try { db?.close(); } catch { /* ignore */ }
  }
  return out;
}

/**
 * Read provider health from the usage table.
 *
 * @param {string} dbPath
 * @param {{now?: number, windowMs?: number}} [opts]
 * @returns {Map<string, Object>}
 */
export function readProviderHealth(dbPath, opts = {}) {
  const now = opts.now ?? Date.now();
  const windowMs = opts.windowMs ?? 5 * 60 * 60 * 1000;
  let rows = [];
  let db;
  try {
    db = openDatabase(dbPath);
    rows = db.query('SELECT provider_id, model_id, status, started_at, duration_ms, input_tokens, output_tokens, error_type, error_code, error_message FROM model_usage WHERE started_at > ?').all(now - windowMs);
  } catch {
    rows = [];
  } finally {
    try { db?.close(); } catch { /* ignore */ }
  }
  const stats = summarizeUsage(rows, { now, windowMs });
  const health = new Map();
  for (const [key, s] of stats) health.set(key, { ...s, health: classifyHealth(s) });
  return health;
}

/**
 * Build the whole snapshot.
 *
 * @param {Object} opts
 * @returns {Object} the snapshot consumed by {@link renderPanel}.
 */
export function buildTeamSnapshot(opts = {}) {
  const agentsDir = opts.agentsDir ?? DEFAULT_AGENTS_DIR;
  const channelRoot = opts.channelRoot ?? DEFAULT_CHANNEL_ROOT;
  const sessionDb = opts.sessionDb ?? DEFAULT_SESSION_DB;
  const now = opts.now ?? Date.now();

  const files = collectAgentFiles(agentsDir);
  const registered = opts.registeredAgentTypes || [];
  const { agents, defects } = auditAgentDefs(files, { registeredAgentTypes: registered });
  if (!existsSync(agentsDir)) {
    defects.push({ kind: 'agent-dir-missing', severity: 'high', agent: null, detail: `the agent directory ${agentsDir} does not exist, so no agent is registered`, evidence: agentsDir });
  }

  let seats = [];
  try {
    const doc = loadSeats(channelRoot);
    // `roster()` is the single answer to "who can be woken": it appends the manager when the
    // registry gives it a session. Mapping `doc.seats` instead reports a team the waker does not
    // have, and the manager that runs the channels disappears from the owner's panel.
    seats = roster(doc).map((s) => ({ id: s.id, title: s.title, site: s.site ?? null, role: s.role ?? null, session: s.session ?? null, scopes: s.scopes || [] }));
  } catch (e) {
    seats = [];
    defects.push({ kind: 'seat-roster-unreadable', severity: 'medium', agent: null, detail: `the seat roster under ${channelRoot} could not be read: ${e.message}`, evidence: channelRoot });
  }

  const live = opts.liveSessions instanceof Map ? opts.liveSessions : readLiveSessions(sessionDb, { now, liveWindowMinutes: opts.liveWindowMinutes ?? 30 });
  // A supplied map is an observation the caller made. On disk, the window query only returns
  // sessions touched inside it, so "absent" means idle *only* when the store was readable at all.
  const liveReadable = opts.liveSessions instanceof Map || existsSync(sessionDb);
  if (!opts.liveSessions && !existsSync(sessionDb)) {
    defects.push({ kind: 'session-db-unreadable', severity: 'medium', agent: null, detail: `the session database ${sessionDb} does not exist, so live sessions and provider health cannot be read`, evidence: sessionDb });
  }
  for (const seat of seats) {
    const s = seat.session ? live.get(seat.session) : null;
    // ACTIVE only from an observed touch. IDLE needs the readable-but-absent evidence above;
    // a seat the panel could not observe says so instead of receiving an invented verdict.
    seat.state = s ? 'ACTIVE' : !seat.session ? 'NO_SESSION' : liveReadable ? 'IDLE' : 'UNKNOWN';
    seat.ageMinutes = s ? Math.round((now - s.updated) / 60000) : null;
    seat.messages = s ? s.messages : 0;
  }

  const tasksFile = opts.tasksFile ?? join(channelRoot, 'tasks', 'active-tasks.md');
  const tasks = opts.taskCounts ?? parseTaskCounts(existsSync(tasksFile) ? readFileSync(tasksFile, 'utf8') : '');
  if (!opts.taskCounts && !existsSync(tasksFile)) {
    defects.push({ kind: 'task-queue-unreadable', severity: 'medium', agent: null, detail: `the task queue ${tasksFile} does not exist, so open work cannot be seen`, evidence: tasksFile });
  }

  const health = opts.providerHealth instanceof Map ? opts.providerHealth : readProviderHealth(sessionDb, { now });

  const nextMoves = [];
  for (const d of defects) {
    if (d.kind === 'agent-not-registered') nextMoves.push({ kind: 'restart', target: d.agent, action: 'start a new session so the agent type registers', reason: d.detail });
    if (d.kind === 'nonexistent-tool') nextMoves.push({ kind: 'fix-grant', target: d.agent, action: 'remove the nonexistent tools from the grant', reason: d.detail });
    if (d.kind === 'context7-unreachable') nextMoves.push({ kind: 'fix-grant', target: d.agent, action: 'add the Context7 MCP tools to the grant', reason: d.detail });
    if (d.kind === 'no-protocol-grant') nextMoves.push({ kind: 'grant-skill', target: d.agent, action: `bun plugins/vivim-team/scripts/grant-protocol.mjs --apply`, reason: d.detail });
    if (d.kind === 'thought-level') nextMoves.push({ kind: 'fix-grant', target: d.agent, action: 'set thoughtLevel: max on the pinned model', reason: d.detail });
    if (d.kind === 'missing-name') nextMoves.push({ kind: 'fix-grant', target: d.agent, action: 'add name to the frontmatter', reason: d.detail });
  }
  for (const seat of seats) {
    if (seat.state === 'IDLE' && (tasks.tasks ?? 0) > 0) {
      nextMoves.push({ kind: 'wake', target: seat.id, action: `bun hq/bin/hq.mjs seat wake ${seat.id} --prompt "<slice>"`, reason: `idle${seat.ageMinutes ? ` ${seat.ageMinutes}m` : ''} with ${tasks.tasks} open task(s)` });
    }
  }
  for (const [key, h] of health) {
    if (h.health?.state === 'capped') nextMoves.push({ kind: 'route', target: key, action: 'bun hq/bin/hq.mjs route-model', reason: 'daily cap observed — move the work to a healthy model' });
    if (h.health?.state === 'budget-blocked') nextMoves.push({ kind: 'route', target: key, action: 'bun hq/bin/hq.mjs route-model', reason: 'no balance — the provider cannot be used' });
  }

  return {
    generatedAt: new Date(now).toISOString(),
    agents,
    seats,
    liveSessions: live,
    tasks,
    providerHealth: health,
    defects,
    nextMoves,
  };
}

/**
 * Render the snapshot as the lines the panel prints.
 *
 * @param {Object} snapshot
 * @param {{verbose?: boolean}} [opts]
 * @returns {string[]}
 */
export function renderPanel(snapshot, opts = {}) {
  const s = snapshot || {};
  const L = [];
  const agents = s.agents || [];
  const seats = s.seats || [];
  const defects = s.defects || [];
  const moves = s.nextMoves || [];
  const health = s.providerHealth || new Map();

  L.push(`TEAM  generated ${s.generatedAt || 'unknown'}`);
  L.push('');

  L.push(`AGENTS (${agents.length})`);
  if (!agents.length) L.push('  (none found)');
  for (const a of agents) {
    const bits = [`  ${String(a.name || a.file).padEnd(24)}`, `model=${a.model || 'inherit'}`, `think=${a.thoughtLevel || '-'}`];
    if (a.tools && a.tools.length) bits.push(`tools=${a.tools.length}`);
    bits.push(a.skills.includes(PROTOCOL_SKILL) ? 'protocol' : 'NO-PROTOCOL');
    bits.push(a.requiredMcpServers.includes('context7') ? 'ctx7' : 'no-ctx7');
    L.push(bits.join('  '));
  }
  L.push('');

  L.push(`SEATS (${seats.length})`);
  if (!seats.length) L.push('  (none registered)');
  for (const seat of seats) {
    L.push(`  ${String(seat.id).padEnd(18)} ${seat.state || '?'}  ${seat.ageMinutes === null || seat.ageMinutes === undefined ? '' : `${seat.ageMinutes}m`}  ${seat.site || ''}  ${seat.messages ? `${seat.messages}msg` : ''}${seat.role === 'manager' ? '  manager' : ''}`);
  }
  L.push('');

  const t = s.tasks || {};
  L.push(`TASKS  sessions=${t.sessions ?? '?'}  open=${t.tasks ?? '?'}  blocked=${t.blocked ?? '?'}  learnings=${t.learnings ?? '?'}  defects=${t.defects ?? '?'}`);
  L.push('');

  if (health.size) {
    L.push('PROVIDERS (last 5h)');
    for (const [key, h] of [...health.entries()].sort((a, b) => (b[1].completed || 0) - (a[1].completed || 0))) {
      L.push(`  ${key.padEnd(52)} ${String(h.health?.state || '?').padEnd(14)} ok=${h.completed || 0} err=${h.error || 0} ${Math.round(h.avgLatencyMs || 0)}ms`);
    }
    L.push('');
  }

  L.push(`DEFECTS (${defects.length})`);
  if (!defects.length) L.push('  (none)');
  for (const d of defects.slice(0, opts.verbose ? defects.length : 12)) {
    L.push(`  ${String(d.severity || 'low').padEnd(6)} ${String(d.kind).padEnd(22)} ${String(d.agent || '').padEnd(24)} ${d.detail}`);
  }
  if (defects.length > 12 && !opts.verbose) L.push(`  ... ${defects.length - 12} more (use --verbose)`);
  L.push('');

  L.push(`NEXT MOVES (${moves.length})`);
  if (!moves.length) L.push('  (none)');
  for (const m of moves.slice(0, opts.verbose ? moves.length : 12)) {
    L.push(`  ${String(m.kind).padEnd(14)} ${String(m.target || '').padEnd(24)} ${m.action}`);
    L.push(`  ${' '.repeat(16)}${m.reason}`);
  }
  if (moves.length > 12 && !opts.verbose) L.push(`  ... ${moves.length - 12} more (use --verbose)`);
  return L;
}

/**
 * Build the compact summary the `vivim-team` hook injects into every prompt.
 *
 * @param {Object} snapshot
 * @returns {string}
 */
export function renderHookSummary(snapshot) {
  const s = snapshot || {};
  const seats = (s.seats || []).map((x) => `${x.id}:${x.state}${x.ageMinutes !== null && x.ageMinutes !== undefined ? `/${x.ageMinutes}m` : ''}`).join(' ');
  const defects = (s.defects || []).length;
  // These keys are MODELS, not providers. One capped model on a provider does not make that
  // provider unusable, and saying it does once led a reader to avoid a provider whose other
  // model was serving every call. The line names the model and leaves the provider alone.
  const unusableModels = [...(s.providerHealth || new Map()).entries()]
    .filter(([, h]) => h.health?.state === 'capped' || h.health?.state === 'budget-blocked')
    .map(([k]) => k);
  const t = s.tasks || {};
  const lines = [
    'TEAM STATE (read-only, refreshed on a schedule — do not treat it as authority):',
    `seats: ${seats || 'none registered'}`,
    `open tasks: ${t.tasks ?? '?'} (blocked ${t.blocked ?? '?'}) · agent defects: ${defects}`,
    unusableModels.length
      ? `models unavailable: ${unusableModels.join(', ')} — do not route onto these models; other models on the same provider may be healthy`
      : 'models: no cap observed',
    'direction: `bun hq/bin/hq.mjs team` for the full panel and the next moves.',
  ];
  return lines.join('\n');
}

/**
 * Write the hook cache.
 *
 * @param {Object} snapshot
 * @param {string} outPath
 * @returns {string} the path written
 */
export function writeStateCache(snapshot, outPath) {
  mkdirSync(join(outPath, '..'), { recursive: true });
  const payload = { generatedAt: snapshot.generatedAt, summary: renderHookSummary(snapshot) };
  writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return outPath;
}
