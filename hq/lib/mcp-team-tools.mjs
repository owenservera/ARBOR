/**
 * @hq:context MCP tools that let one chat read and steer the whole agent team.
 * @hq:owner hq-agent
 * @hq:task team-control
 * @hq:invariant team_state and route_model never mutate; wake_seat starts one local turn and nothing else.
 * @hq:see docs/AGENT-BUS.md
 * @hq:see hq/lib/team-panel.mjs
 * @hq:see hq/lib/model-router.mjs
 * @hq:see hq/lib/channel-seats.mjs
 *
 * Three tools, deliberately narrow. `team_state` is the panel (who is on the team, what is
 * running, what is stuck). `route_model` is the budget-aware routing proposal, and it writes
 * nothing unless the caller asked for `apply: true`. `wake_seat` is the only mutating tool: it
 * starts one local seat turn and nothing else — no provider send, no agent-definition edit.
 *
 * The handlers are pure over injected dependencies so the tests never touch the real machine.
 * The defaults reach the real machine, and only the defaults.
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { buildTeamSnapshot, collectAgentFiles, parseAgentFile, renderPanel } from './team-panel.mjs';
import { buildCatalog, DEFAULT_POLICY, planRoutes as modelPlanRoutes, summarizeUsage } from './model-router.mjs';
import {
  DEFAULT_CHANNEL_ROOT, DEFAULT_IDLE_MINUTES, loadSeats, renderSeatTable, verifySeat, wakeSeat as wakeSeatChannel,
} from './channel-seats.mjs';

// bun:sqlite is loaded through createRequire so this module still loads under Node, where the
// session database is unreachable and the router degrades to "no observed usage".
const nodeRequire = createRequire(import.meta.url);

/** The panel sections a caller may ask for. */
export const SECTION_KEYS = Object.freeze(['agents', 'seats', 'sessions', 'tasks', 'providers', 'defects', 'moves']);

/** The panel block that answers each section. */
const SECTION_HEADERS = Object.freeze({
  agents: /^AGENTS\b/,
  seats: /^SEATS\b/,
  sessions: /^SESSIONS\b/,
  tasks: /^TASKS\b/,
  providers: /^PROVIDERS\b/,
  defects: /^DEFECTS\b/,
  moves: /^NEXT MOVES\b/,
});

/** What a section looks like when the panel has nothing to say about it. */
const SECTION_PLACEHOLDERS = Object.freeze({
  agents: 'AGENTS (0)\n  (none found)',
  seats: 'SEATS (0)\n  (none registered)',
  sessions: 'SESSIONS (0)\n  (none live)',
  tasks: 'TASKS  sessions=?  open=?  blocked=?  learnings=?  defects=?',
  providers: 'PROVIDERS (last 5h)\n  (none observed)',
  defects: 'DEFECTS (0)\n  (none)',
  moves: 'NEXT MOVES (0)\n  (none)',
});

/** The proof rule, in the same words everywhere it appears. */
export const WAKE_PROOF_RULE =
  'A wake is proven by the seat\'s own reply, not by an acknowledgement.';

// ------------------------------------------------------------------------------ tools ----

/**
 * The three team tools. Names are verb-noun snake_case; every parameter carries its own
 * description, because the caller reads the schema and never the source.
 */
export const TEAM_TOOLS = Object.freeze([
  Object.freeze({
    name: 'team_state',
    description:
      'Read the whole agent team in one call: agent definitions, channel seats and whether each is IDLE or ACTIVE, live sessions, open task counts, provider health over the last hours, definition defects and the next moves the panel recommends. '
      + 'Use this first whenever a chat needs to know who is on the team, what is running, or what is stuck — it is one local read and costs well under a second. '
      + 'Do not use it to start work, to wake a seat, or to change a model pin: this tool is read-only and never mutates anything. '
      + 'Pass `sections` to keep only the parts you need, or `verbose` to see every defect and move instead of the first twelve.',
    inputSchema: {
      type: 'object',
      properties: {
        verbose: {
          type: 'boolean',
          default: false,
          description: 'When true, every defect and every next move is listed instead of the first twelve. Defaults to false.',
        },
        sections: {
          type: 'array',
          items: { type: 'string', enum: [...SECTION_KEYS] },
          description: `Which panel sections to return: ${SECTION_KEYS.join(', ')}. Omit it or pass an empty array for every section.`,
        },
      },
      required: [],
      additionalProperties: false,
    },
  }),
  Object.freeze({
    name: 'route_model',
    description:
      'Propose a budget-aware model route: for every agent definition, the cheapest healthy model that can still do its work, grouped by destination and explained in one line each. '
      + 'Use it when a lane is on a capped, blocked or inherited model, or before fanning work out across a paid provider. '
      + 'Do not use it to change anything on its own — with `apply` left at its default of false this tool writes nothing at all and only proposes. '
      + 'With `apply: true` it rewrites the `model:` line of the agent definition it names and leaves a timestamped `.bak-route-<stamp>` backup beside it; every other write is refused.',
    inputSchema: {
      type: 'object',
      properties: {
        apply: {
          type: 'boolean',
          default: false,
          description: 'When true, write the proposed model pin into each affected agent definition, with a `.bak-route-<stamp>` backup. Defaults to false, which writes nothing.',
        },
        hours: {
          type: 'number',
          default: 5,
          description: 'How many hours of observed provider usage the routing decision is based on. Defaults to 5.',
        },
        agent: {
          type: 'string',
          description: 'Plan for one agent only, by its definition name. Omit it to plan for every agent definition on the machine.',
        },
      },
      required: [],
      additionalProperties: false,
    },
  }),
  Object.freeze({
    name: 'wake_seat',
    description:
      'Start one turn in a channel seat that is IDLE, by handing it a slice of work to finish. '
      + 'Use it when a seat has an open task and nobody is driving it — the slice must name what to produce, which file, and which test proves it. '
      + 'Do not use it to send anything to a site, to talk to a provider, or to reach a seat that is already working: an ACTIVE seat is refused unless you pass `force: true` because you have decided it is stuck. '
      + 'The reply you get back is an acknowledgement, not proof — a wake is proven by the seat\'s own reply in its transcript, so confirm it with `bun hq/bin/hq.mjs seat verify <seat>`.',
    inputSchema: {
      type: 'object',
      properties: {
        seat: {
          type: 'string',
          description: 'The seat id to wake, exactly as it appears in the seat roster (for example `idle-seat`). An unknown id is denied and the roster is printed.',
        },
        prompt: {
          type: 'string',
          description: 'The slice of work the seat should start: what to produce, which file to touch, and which test proves it. Never put a credential in it.',
        },
        wait: {
          type: 'number',
          default: 200,
          description: 'How many seconds to wait for the seat to answer before the wake is reported as still running. Defaults to 200.',
        },
        force: {
          type: 'boolean',
          default: false,
          description: 'Wake an ACTIVE seat anyway. Only set this when you have decided the seat is stuck; it interrupts work in progress. Defaults to false.',
        },
      },
      required: ['seat', 'prompt'],
      additionalProperties: false,
    },
  }),
]);

/** The valid tool names, for error messages and for the caller. */
export const TEAM_TOOL_NAMES = Object.freeze(TEAM_TOOLS.map((t) => t.name));

// --------------------------------------------------------------------------- validation ----

/**
 * One error shape for every tool failure.
 *
 * @param {string} toolName
 * @param {string} message
 * @returns {{content: Array<{type: string, text: string}>, isError: true}}
 */
export function renderToolError(toolName, message) {
  const text = String(message ?? '').trim() || 'unknown error';
  return {
    content: [{ type: 'text', text: `hq team tool "${toolName}" failed: ${text}` }],
    isError: true,
  };
}

/**
 * Check the arguments against one tool's input schema.
 *
 * @param {Object} tool
 * @param {Object} args
 * @returns {{ok: true, value: Object} | {ok: false, message: string}}
 */
export function validateToolArgs(tool, args) {
  const schema = tool?.inputSchema || {};
  const props = schema.properties || {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  const name = tool?.name || 'unknown';

  if (args !== undefined && args !== null && (typeof args !== 'object' || Array.isArray(args))) {
    return { ok: false, message: `arguments for ${name} must be a JSON object; received ${Array.isArray(args) ? 'an array' : typeof args}.` };
  }
  const given = args || {};

  const unknown = Object.keys(given).filter((k) => !Object.prototype.hasOwnProperty.call(props, k));
  if (unknown.length) {
    return {
      ok: false,
      message: `unknown parameter${unknown.length > 1 ? 's' : ''} ${unknown.map((k) => `"${k}"`).join(', ')} for ${name}; allowed parameters are ${Object.keys(props).map((k) => `"${k}"`).join(', ') || '(none)'}.`,
    };
  }

  const value = {};
  for (const [key, spec] of Object.entries(props)) {
    const raw = given[key];
    if (raw === undefined || raw === null) {
      if (required.includes(key)) {
        return { ok: false, message: `missing required parameter "${key}" for ${name}; required parameters are ${required.map((k) => `"${k}"`).join(', ')}.` };
      }
      if (spec && spec.default !== undefined) value[key] = spec.default;
      continue;
    }
    const problem = checkValue(key, raw, spec, name);
    if (problem) return { ok: false, message: problem };
    value[key] = raw;
  }
  return { ok: true, value };
}

/**
 * @param {string} key
 * @param {any} raw
 * @param {Object} spec
 * @param {string} name
 * @returns {string|null} an error message, or null when the value is fine
 */
function checkValue(key, raw, spec, name) {
  const label = `parameter "${key}" of ${name}`;
  const type = spec?.type;
  if (type === 'string' && typeof raw !== 'string') return `${label} must be a string; received ${describeType(raw)}.`;
  if (type === 'number') {
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return `${label} must be a finite number; received ${describeType(raw)}.`;
    if (spec && Number.isFinite(spec.minimum) && raw < spec.minimum) return `${label} must be at least ${spec.minimum}; received ${raw}.`;
  }
  if (type === 'boolean' && typeof raw !== 'boolean') return `${label} must be true or false; received ${describeType(raw)}.`;
  if (type === 'array') {
    if (!Array.isArray(raw)) return `${label} must be an array; received ${describeType(raw)}.`;
    const itemEnum = spec?.items?.enum;
    if (Array.isArray(itemEnum)) {
      for (const item of raw) {
        if (!itemEnum.includes(item)) return `${label} may only contain ${itemEnum.map((v) => `"${v}"`).join(', ')}; received ${JSON.stringify(item)}.`;
      }
    }
  }
  if (Array.isArray(spec?.enum) && !spec.enum.includes(raw)) {
    return `${label} must be one of ${spec.enum.map((v) => `"${v}"`).join(', ')}; received ${JSON.stringify(raw)}.`;
  }
  if (type === 'string' && raw.trim() === '') return `${label} must not be empty.`;
  return null;
}

function describeType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return typeof value;
}

// ------------------------------------------------------------------------------ render ----

/**
 * Split the panel into its blocks and keep the sections the caller asked for.
 *
 * @param {Object} snapshot
 * @param {{verbose?: boolean, sections?: string[], now?: number}} [opts]
 * @returns {string}
 */
export function renderTeamState(snapshot, opts = {}) {
  // renderPanel returns an array of lines; the panel is one string here.
  const rendered = renderPanel(snapshot || {}, { verbose: !!opts.verbose });
  const panel = Array.isArray(rendered) ? rendered.join('\n') : String(rendered ?? '');
  const blocks = splitPanelBlocks(panel);
  const bySection = new Map();
  let header = '';
  for (const block of blocks) {
    if (block.key === 'header') { header = block.lines.join('\n'); continue; }
    bySection.set(block.key, block.lines.join('\n'));
  }

  const wanted = Array.isArray(opts.sections) && opts.sections.length
    ? SECTION_KEYS.filter((k) => opts.sections.includes(k))
    : [...SECTION_KEYS];

  const out = [header || 'TEAM  generated unknown', ''];
  for (const key of wanted) {
    let text = bySection.get(key);
    if (key === 'sessions') text = text || renderSessionsBlock(snapshot, opts.now);
    if (!text) text = SECTION_PLACEHOLDERS[key];
    out.push(text, '');
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

/**
 * @param {string} panel
 * @returns {Array<{key: string, lines: string[]}>}
 */
function splitPanelBlocks(panel) {
  const blocks = [];
  let current = null;
  for (const line of String(panel || '').split('\n')) {
    if (line === '') continue;
    const key = sectionKeyOf(line);
    if (key) {
      current = { key, lines: [line] };
      blocks.push(current);
      continue;
    }
    if (!current) {
      current = { key: 'header', lines: [line] };
      blocks.push(current);
      continue;
    }
    current.lines.push(line);
  }
  return blocks;
}

function sectionKeyOf(line) {
  for (const [key, re] of Object.entries(SECTION_HEADERS)) {
    if (re.test(line)) return key;
  }
  return null;
}

/**
 * The live-session block. The panel renders agents, seats, tasks, providers, defects and
 * moves; the live sessions behind those seats are read here so `sessions` is a real section.
 */
function renderSessionsBlock(snapshot, now) {
  const live = snapshot?.liveSessions;
  const entries = live instanceof Map
    ? [...live.values()]
    : Array.isArray(live) ? live : [];
  const at = Number(now) || Date.now();
  const lines = [`SESSIONS (${entries.length})`];
  if (!entries.length) lines.push('  (none live)');
  const sorted = [...entries].sort((a, b) => (Number(b?.updated) || 0) - (Number(a?.updated) || 0));
  for (const s of sorted) {
    const updated = Number(s?.updated) || 0;
    const age = updated ? `${Math.max(0, Math.round((at - updated) / 60000))}m` : '-';
    const messages = Number(s?.messages) || 0;
    lines.push(`  ${String(s?.id ?? '').padEnd(28)} ${String(age).padEnd(6)} ${messages}msg  ${s?.title ?? ''}`);
  }
  return lines.join('\n');
}

/**
 * Render the routing proposal the way the CLI renders it: grouped by destination.
 *
 * @param {Object} plan
 * @param {{apply?: boolean, hours?: number}} [opts]
 * @returns {string}
 */
export function renderRoutePlan(plan, opts = {}) {
  const routes = Array.isArray(plan?.routes) ? plan.routes : [];
  const skipped = Array.isArray(plan?.skipped) ? plan.skipped : [];
  const applied = Array.isArray(plan?.applied) ? plan.applied : [];
  const hours = Number(opts.hours) || 5;

  const groups = new Map();
  for (const r of routes) {
    const g = groups.get(r.to) || { to: r.to, reason: r.reason, agents: [], from: new Set(), saving: 0 };
    g.agents.push(r.agent);
    g.from.add(r.from);
    g.saving += Number(r.expectedSavingUsd) || 0;
    groups.set(r.to, g);
  }

  const lines = [];
  lines.push(`ROUTE MODEL  ${routes.length} route(s) in ${groups.size} group(s), ${skipped.length} skipped, window ${hours}h`);
  lines.push('');
  for (const g of groups.values()) {
    lines.push(`  -> ${g.to}   (${g.agents.length} agent${g.agents.length === 1 ? '' : 's'})`);
    lines.push(`     from: ${[...g.from].join(', ')}`);
    lines.push(`     why:  ${String(g.reason || '').replace(/\s+—\s+rejected cheaper option.*$/, '')}`);
    const beat = String(g.reason || '').match(/rejected cheaper option (.*)$/);
    if (beat) lines.push(`     beat: ${beat[1]}`);
    if (g.saving > 0) lines.push(`     saves ~$${g.saving.toFixed(4)} per call across the group`);
    if (g.agents.length > 5) {
      lines.push(`     WARNING: ${g.agents.length} agents on one model is a single point of failure —`);
      lines.push(`              five lanes once died together on one capped free model. Split them.`);
    }
    lines.push(`     agents: ${g.agents.join(', ')}`);
    lines.push('');
  }
  if (!routes.length) lines.push('  (no route change proposed)');

  lines.push('SKIPPED');
  const skipReasons = new Map();
  for (const s of skipped) {
    const list = skipReasons.get(s.reason) || [];
    list.push(s.agent);
    skipReasons.set(s.reason, list);
  }
  if (!skipped.length) lines.push('  (none)');
  for (const [reason, agents] of skipReasons) {
    lines.push(`  ${agents.length} x ${reason}`);
    if (agents.length <= 6) lines.push(`        ${agents.join(', ')}`);
  }

  lines.push('');
  if (opts.apply) {
    if (applied.length) {
      lines.push(`APPLIED ${applied.length} pin(s):`);
      for (const a of applied) lines.push(`  ${a.agent}: ${a.from} -> ${a.to}`);
    } else {
      lines.push('APPLIED nothing (no route was approved).');
    }
  } else {
    lines.push('PROPOSED ONLY — nothing was written. Call route_model again with apply: true to write these pins.');
  }
  return lines.join('\n');
}

/**
 * Render the outcome of one wake attempt.
 *
 * @param {Object} out
 * @param {{seat: string, forced?: boolean}} [opts]
 * @returns {string}
 */
export function renderWakeResult(out, opts = {}) {
  const decision = out?.decision || 'UNKNOWN';
  const code = out?.code || 'UNKNOWN';
  const lines = [];
  lines.push(`${decision} ${code} — ${out?.detail || 'no detail reported'}`);
  if (out?.seat) {
    const age = out.ageMinutes === null || out.ageMinutes === undefined ? '' : ` · ${out.ageMinutes}m`;
    lines.push(`seat ${out.seat} · ${out.state || 'unknown'}${age}`);
  }
  if (opts.forced) lines.push('forced: this seat was ACTIVE and you asked for the wake anyway.');
  if (out?.id) lines.push(`wake ${out.id}`);
  if (out?.intentPath) lines.push(`intent ${out.intentPath}`);
  if (out?.resultPath) lines.push(`result ${out.resultPath}`);
  if (Array.isArray(out?.seats) && out.seats.length) {
    lines.push('seats:');
    for (const s of out.seats) lines.push(`  ${String(s.seat).padEnd(18)} ${String(s.state).padEnd(9)} ${s.site ?? ''}`);
  }

  const reply = out?.answer?.reply || out?.reply || null;
  if (reply) {
    lines.push(`the seat's own reply: ${String(reply).slice(0, 300)}`);
  } else if (decision === 'ACCEPTED') {
    lines.push('the seat has not answered yet; its answer is the only proof.');
  }
  if (out?.proof) {
    lines.push(`proof: ${out.proof.detail || (out.proof.seen ? 'the seat answered the wake marker' : 'the wake marker is not in the transcript yet')}`);
  }
  lines.push(WAKE_PROOF_RULE);
  if (decision !== 'ACCEPTED' || !reply) {
    lines.push(`confirm with: bun hq/bin/hq.mjs seat verify ${opts.seat || out?.seat || '<seat>'}`);
  }
  return lines.join('\n');
}

// -------------------------------------------------------------------------- handlers ----

async function handleTeamState(args, deps) {
  const snapshot = await deps.buildSnapshot({ now: deps.now() });
  if (!snapshot) {
    throw new Error('the team snapshot came back empty; check the agents directory and the channel root.');
  }
  return renderTeamState(snapshot, { verbose: args.verbose === true, sections: args.sections, now: deps.now() });
}

async function handleRouteModel(args, deps) {
  const apply = args.apply === true;
  const hours = Number(args.hours) || 5;
  const plan = await deps.planRoutes({ agent: args.agent, hours, apply, now: deps.now() });
  return renderRoutePlan(plan, { apply, hours });
}

async function handleWakeSeat(args, deps) {
  const seat = String(args.seat).trim();
  const prompt = String(args.prompt);
  const force = args.force === true;
  const wait = Number(args.wait) || 200;

  const state = await seatState(seat, deps);
  if (state === 'ACTIVE' && !force) {
    return renderToolError('wake_seat',
      `seat "${seat}" is ACTIVE, so the wake is deferred: leave it working and re-check later, `
      + `or call wake_seat again with force: true if you have decided it is stuck. `
      + `${WAKE_PROOF_RULE}`);
  }

  const out = await deps.wakeSeat({ seat, prompt, wait, force, now: deps.now() });
  const decision = out?.decision || 'UNKNOWN';
  if (decision !== 'ACCEPTED') {
    const detail = out?.detail || 'the transport did not accept the prompt';
    const how = out?.code === 'SEAT_ACTIVE'
      ? 're-check later, or call wake_seat again with force: true if the seat is stuck.'
      : out?.code === 'SEAT_UNKNOWN'
        ? 'run `bun hq/bin/hq.mjs seat list` to see the roster, or call team_state for the same roster in one read.'
        : 'run `bun hq/bin/hq.mjs seat list` to see the roster and the state of every seat.';
    return renderToolError('wake_seat', `${decision} ${out?.code || 'UNKNOWN'} — ${detail} ${how} ${WAKE_PROOF_RULE}`);
  }
  return renderWakeResult(out, { seat, forced: force });
}

/**
 * What the panel says about one seat. `null` means the panel does not know it — the wake
 * itself is then free to deny it with the roster attached.
 */
async function seatState(seat, deps) {
  try {
    const snapshot = await deps.buildSnapshot({ now: deps.now() });
    const seats = Array.isArray(snapshot?.seats) ? snapshot.seats : [];
    const found = seats.find((s) => String(s?.id ?? '').toLowerCase() === seat.toLowerCase());
    return found?.state ? String(found.state).toUpperCase() : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------- dispatcher ----

const HANDLERS = {
  team_state: handleTeamState,
  route_model: handleRouteModel,
  wake_seat: handleWakeSeat,
};

/**
 * Call one team tool.
 *
 * @param {string} name
 * @param {Object} [args]
 * @param {Object} [deps] injected dependencies; the defaults reach the real machine
 * @returns {Promise<{content: Array<{type: string, text: string}>, isError?: true}>}
 */
export async function callTeamTool(name, args = {}, deps = {}) {
  const tool = TEAM_TOOLS.find((t) => t.name === name);
  if (!tool) {
    return renderToolError(String(name ?? ''), `unknown tool. Valid tools are: ${TEAM_TOOL_NAMES.join(', ')}.`);
  }
  const resolved = { ...defaultTeamDeps(), ...(deps || {}) };
  const check = validateToolArgs(tool, args);
  if (!check.ok) return renderToolError(tool.name, check.message);
  try {
    const out = await HANDLERS[tool.name](check.value, resolved);
    // A handler that refuses returns the rendered error itself, not a string.
    if (out && typeof out === 'object' && Array.isArray(out.content)) return out;
    return { content: [{ type: 'text', text: String(out ?? '') }] };
  } catch (error) {
    return renderToolError(tool.name, error?.message || String(error));
  }
}

// ------------------------------------------------------------------------- defaults ----

/**
 * The real-machine dependencies. Everything here reaches the disk or a live session; the
 * handlers only ever see the interface.
 */
export function defaultTeamDeps() {
  const deps = {
    buildSnapshot: (opts = {}) => buildTeamSnapshot(opts),
    planRoutes: null,
    wakeSeat: null,
    readFile: (path) => readFileSync(path, 'utf8'),
    now: () => Date.now(),
  };
  deps.planRoutes = (input) => defaultPlanRoutes(input, deps);
  deps.wakeSeat = (input) => defaultWakeSeat(input, deps);
  return deps;
}

function homeDir() {
  return process.env.USERPROFILE || process.env.HOME || '';
}

/**
 * The real routing proposal: observed usage from the session store, prices from the provider
 * depot, pins from the agent definitions. Mirrors `hq route-model`, and writes only when
 * `apply` is true.
 */
async function defaultPlanRoutes(input, deps) {
  const now = Number(input?.now) || deps.now();
  const hours = Number(input?.hours) > 0 ? Number(input.hours) : 5;
  const windowMs = hours * 60 * 60 * 1000;

  const usageRows = readUsageRows({ now, windowMs });
  const stats = summarizeUsage(usageRows, { now, windowMs });

  const depotCatalog = readJsonMaybe(deps.readFile, join(homeDir(), '.zcode', 'provider-depot', 'catalog.json'));
  const catalog = buildCatalog({ depotCatalog, observed: [...stats.keys()] });

  const agentsDir = join(homeDir(), '.zcode', 'agents');
  const agents = collectAgentFiles(agentsDir).map((f) => {
    const a = parseAgentFile(f.text, f.file);
    return { name: a.name || f.file.replace(/\.md$/, ''), model: a.model || 'inherit', file: f.file, path: join(agentsDir, f.file) };
  });

  const wanted = input?.agent ? String(input.agent).trim().toLowerCase() : '';
  const selected = wanted
    ? agents.filter((a) => String(a.name).toLowerCase() === wanted || String(a.name).toLowerCase().includes(wanted))
    : agents;
  if (wanted && !selected.length) {
    return { routes: [], skipped: [{ agent: wanted, reason: 'no agent definition matches that name' }], applied: [], writes: [] };
  }

  const policy = { ...DEFAULT_POLICY, windowMs };
  const plan = modelPlanRoutes({ agents: selected, usage: usageRows, catalog: Object.fromEntries(catalog), policy, now });

  const applied = [];
  if (input?.apply === true) {
    const stamp = new Date(now).toISOString().replace(/[:.]/g, '-');
    for (const route of plan.routes) {
      const agent = selected.find((a) => a.name === route.agent);
      if (!agent) continue;
      let before = '';
      try { before = deps.readFile(agent.path); } catch { continue; }
      const backup = `${agent.path}.bak-route-${stamp}`;
      try { copyFileSync(agent.path, backup); } catch { continue; }
      const after = before.replace(/^model:\s*.*$/m, `model: ${route.to}`);
      if (after === before) continue;
      writeFileSync(agent.path, after, 'utf8');
      applied.push({ agent: route.agent, from: route.from, to: route.to, path: agent.path, backup });
    }
  }
  return { ...plan, applied, writes: applied };
}

function readJsonMaybe(readFile, path) {
  try { return JSON.parse(readFile(path)); } catch { return null; }
}

function readUsageRows({ now, windowMs }) {
  try {
    const { Database } = nodeRequire('bun:sqlite');
    const db = new Database(join(homeDir(), '.zcode', 'cli', 'db', 'db.sqlite'), { readonly: true });
    try {
      return db.query('SELECT provider_id, model_id, status, started_at, duration_ms, input_tokens, output_tokens, error_type, error_code, error_message FROM model_usage WHERE started_at > ?').all(now - windowMs);
    } finally {
      try { db.close(); } catch { /* ignore */ }
    }
  } catch {
    return [];
  }
}

/**
 * The real wake: the seat registry decides, the session store says whether the seat is
 * idle, and the transport runs one turn.
 */
async function defaultWakeSeat(input, deps) {
  const root = input?.root || DEFAULT_CHANNEL_ROOT;
  const waitSec = Math.max(10, Number(input?.wait) || 200);
  let live = new Map();
  let resumeSession = null;
  try {
    const transport = await import('./channel-transport.mjs');
    live = transport.readLivenessMap();
    resumeSession = transport.resumeSession;
  } catch {
    live = new Map();
  }

  const out = wakeSeatChannel({
    root,
    seatId: input?.seat,
    prompt: input?.prompt,
    reason: input?.reason ?? null,
    force: input?.force === true,
    idleMinutes: DEFAULT_IDLE_MINUTES,
    probe: (sid) => live.get(sid) ?? null,
    send: (sid, text) => (resumeSession
      ? resumeSession(sid, text, { timeoutMs: waitSec * 1000, cwd: live.get(sid)?.directory })
      : { accepted: false, pending: false, detail: 'the ZCode transport is unavailable; set HQ_ZCODE_CLI' }),
  });

  if (out?.code === 'SEAT_UNKNOWN') {
    try {
      const doc = loadSeats(root);
      const table = renderSeatTable(doc, (sid) => live.get(sid) ?? null, { idleMinutes: DEFAULT_IDLE_MINUTES });
      out.detail = `${out.detail}\n${table.lines}`;
      out.seats = table.seats;
    } catch { /* the registry is gone; the denial stands */ }
  }

  if (out?.id && out?.decision === 'ACCEPTED' && !out?.answer?.reply) {
    try {
      const transport = await import('./channel-transport.mjs');
      out.proof = verifySeat({ root, seatId: input?.seat, id: out.id, confirm: (sid, id) => transport.confirmWake(sid, id) });
    } catch { /* the transcript is unreadable; the wake itself still stands */ }
  }

  return out;
}
