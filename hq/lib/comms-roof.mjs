// @ts-check
/**
 * @hq:context One roof over every comms and agent-state source: the playbook bot roster, channel seats,
 *   agent definitions, live ZCode sessions, the sync bus, the bot inbox, the wake journal and anet.
 * @hq:owner channel-manager
 * @hq:task comms-roof
 * @hq:invariant read-only: every probe is a spawn of an existing tool or a file read; nothing here writes
 * @hq:invariant a missing or broken source is reported as a defect, never thrown and never silently dropped
 * @hq:see doc:docs/AGENT-BUS.md
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadSeats, roster, DEFAULT_CHANNEL_ROOT } from './channel-seats.mjs';
import { Registry } from './cnp.mjs';
import { state as approvalState } from './approvals.mjs';
import { view as revocationView } from './revocations.mjs';
import { view as taskView } from './task-lifecycle.mjs';

export const ROOF_SCHEMA = 'hq.comms-roof/1';

const HOME = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\VIVIM.inc';
export const PLAYBOOK_TOOLKIT = join(HOME, '.zcode', 'evolution', 'zcode-playbook', 'toolkit');
export const GLOBAL_AGENTS = join(HOME, '.zcode', 'agents');
export const REPO_AGENTS = join(process.cwd(), '.opencode', 'agent');

/** The bot roster: the registered, named, bootstrapped agents. Text output parsed, schema reported. */
export function probeBots(toolkit = PLAYBOOK_TOOLKIT) {
  const tool = join(toolkit, 'bots', 'bots.mjs');
  if (!existsSync(tool)) return { source: 'bots', ok: false, items: [], detail: `no bots.mjs at ${tool}` };
  const r = spawnSync(process.execPath, [tool, 'list'], { encoding: 'utf8', timeout: 30000 });
  if (r.status !== 0) return { source: 'bots', ok: false, items: [], detail: (r.stderr || 'bots.mjs list failed').trim().split(/\r?\n/).pop() };
  const items = String(r.stdout).split(/\r?\n/).map((line) => {
    const m = line.match(/^\s*(\*?)\s*(\S+)\s+role:(\S+)\s+(\d+)\s+routine\(s\)\s*(.*)$/);
    return m ? { id: m[2], role: m[3], routines: Number(m[4]), chief: m[1] === '*', note: m[5].trim() } : null;
  }).filter(Boolean);
  return { source: 'bots', ok: items.length > 0, items, detail: `${items.length} registered bot(s)` };
}

/** The channel seats, with their session ids and write scope. */
export function probeSeats(channelRoot = DEFAULT_CHANNEL_ROOT) {
  try {
    const doc = loadSeats(channelRoot);
    return {
      source: 'seats', ok: true,
      items: roster(doc).map((s) => ({ id: s.id, site: s.site ?? null, session: s.session ?? null, role: s.role ?? 'seat' })),
      detail: `${doc.seats.length} seat(s) + manager`,
    };
  } catch (e) {
    return { source: 'seats', ok: false, items: [], detail: e.message };
  }
}

/** Agent definitions on disk: the global store and this repo's opencode store. */
export function probeAgentDefs(dirs = [GLOBAL_AGENTS, REPO_AGENTS]) {
  const items = [];
  const missing = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) { missing.push(dir); continue; }
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const text = readFileSync(join(dir, f), 'utf8');
      const model = (text.match(/^model:\s*(\S+)/m) || [])[1] ?? null;
      const level = (text.match(/^thoughtLevel:\s*(\S+)/m) || [])[1] ?? null;
      items.push({ id: f.replace(/\.md$/, ''), model, thoughtLevel: level, dir });
    }
  }
  return { source: 'agent-defs', ok: items.length > 0, items, detail: `${items.length} definition(s)` + (missing.length ? `; missing: ${missing.join(', ')}` : '') };
}

/** Live sessions, newest first: the thread half of the roof. */
export function probeThreads(tool) {
  if (!existsSync(tool)) return { source: 'threads', ok: false, items: [], detail: `no sessions tool at ${tool}` };
  const r = spawnSync(process.execPath, [tool, '--json', 'list', '--limit', '5000'], { encoding: 'utf8', timeout: 60000 });
  let doc = null;
  try { doc = JSON.parse(String(r.stdout ?? '')); } catch { doc = null; }
  if (!doc?.sessions) return { source: 'threads', ok: false, items: [], detail: 'session store unreadable' };
  const live = doc.sessions.filter((s) => s.type !== 'subagent_child' && s.ageMinutes < 240);
  return {
    source: 'threads', ok: true,
    items: live.slice(0, 12).map((s) => ({ id: s.id, title: s.title, ageMinutes: s.ageMinutes, type: s.type })),
    detail: `${doc.total} total, ${live.length} touched in 4h`,
  };
}

/** The channels themselves: are the transports present, and what do they hold. */
export function probeChannels({ syncRoot = process.cwd(), channelRoot = DEFAULT_CHANNEL_ROOT, toolkit = PLAYBOOK_TOOLKIT } = {}) {
  const out = [];
  const ledger = join(syncRoot, 'sync', 'ledger.jsonl');
  try {
    const lines = readFileSync(ledger, 'utf8').split('\n').filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1] || '{}');
    out.push({ id: 'sync-bus', ok: true, detail: `${lines.length} message(s), newest ${last.id ?? '?'}` });
  } catch (e) {
    out.push({ id: 'sync-bus', ok: false, detail: e.message });
  }
  // Run the watcher for one second: exit 2 (IDLE) proves the command exists and
  // loops. A dispatch to a missing function fails on stderr instead, which is
  // the break this row exists to catch.
  {
    const tool = join(syncRoot, 'scripts', 'sync.mjs');
    const r = spawnSync(process.execPath, [tool, 'watch', '--seconds', '1'], { encoding: 'utf8', timeout: 15000 });
    const idle = r.status === 2 && /IDLE/.test(String(r.stdout ?? ''));
    out.push({
      id: 'sync-watch', ok: idle,
      detail: idle ? 'watch responds (IDLE after 1s)' : `watch did not answer as specified: exit ${r.status} ${String(r.stderr ?? '').trim().split(/\r?\n/).pop() ?? ''}`.trim(),
    });
  }
  const installed = join(HOME, '.agents', 'skills', 'zcode-comms', 'bot-inbox.mjs');
  // Execute it rather than checking for files: a runnable shim and a tree that
  // dies on import both "exist". A module error on stderr is the only signal
  // that separates them.
  let inboxOk = false;
  let inboxDetail = `no installed bot-inbox at ${installed}`;
  if (existsSync(installed)) {
    const r = spawnSync(process.execPath, [installed, 'check'], { encoding: 'utf8', timeout: 30000 });
    const err = `${r.stderr ?? ''}`;
    const broken = /SyntaxError|ERR_MODULE_NOT_FOUND|Cannot find module/.test(err);
    inboxOk = !broken && r.status !== null;
    inboxDetail = inboxOk
      ? `runs from the installed path (exit ${r.status}${/FAIL:/.test(String(r.stdout ?? '')) ? '; reports missing inboxes, which is a roster fact, not a break' : ''})`
      : `cannot run: ${err.trim().split(/\r?\n/).pop()}`;
    if (!inboxOk) inboxDetail += ` — toolkit copy at ${join(toolkit, 'zcode-comms', 'bot-inbox.mjs')}`;
  }
  out.push({ id: 'bot-inbox', ok: inboxOk, detail: inboxDetail });
  const dispatch = join(channelRoot, 'dispatch');
  try {
    const files = readdirSync(dispatch).filter((f) => f.endsWith('.result.json'));
    const newest = files.map((f) => statSync(join(dispatch, f)).mtimeMs).sort((a, b) => b - a)[0];
    out.push({ id: 'wake-journal', ok: files.length > 0, detail: `${files.length} result(s), newest ${newest ? new Date(newest).toISOString() : '-'}` });
  } catch {
    out.push({ id: 'wake-journal', ok: false, detail: `no dispatch directory at ${dispatch}` });
  }
  // CNP/1 is landed when the .mjs port exists AND a registry has named something.
  // A port with no registry names nothing, so it is not a working channel.
  {
    const lib = fileURLToPath(new URL('./cnp.mjs', import.meta.url));
    const registryFile = join(channelRoot, 'threads.json');
    let names = 0;
    try { names = Object.keys(JSON.parse(readFileSync(registryFile, 'utf8')).byKey ?? {}).length; } catch { names = 0; }
    const ok = existsSync(lib) && names > 0;
    out.push({
      id: 'cnp-naming', ok,
      detail: ok
        ? `port ${lib.split(/[\\/]/).pop()} with ${names} name(s) in ${registryFile}`
        : existsSync(lib)
          ? `port present but no registry at ${registryFile} — run \`hq threads resolve --write\``
          : `no .mjs port at ${lib}`,
    });
  }
  return { source: 'channels', ok: out.filter((c) => c.ok).length > 0, items: out, detail: `${out.filter((c) => c.ok).length}/${out.length} channel(s) usable` };
}

/** The VOMEGA DESK: named teams, one inbox/replies pair each, directives chained by in-reply-to. */
export function probeDesk(root = 'C:\\0-BlackBoxProject-0\\VOMEGA') {
  const base = join(root, '.project', 'staff', 'DESK');
  const board = join(base, 'status', 'board.jsonl');
  if (!existsSync(board)) return { source: 'vomega-desk', ok: false, items: [], detail: `no desk board at ${board}` };
  let rows = [];
  try {
    rows = readFileSync(board, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  } catch (e) {
    return { source: 'vomega-desk', ok: false, items: [], detail: `board unreadable: ${e.message}` };
  }
  const teams = [...new Set(rows.map((r) => r.team).filter(Boolean))];
  const newest = rows.map((r) => r.ts).filter(Boolean).sort().reverse()[0] ?? null;
  const ageDays = newest ? Math.floor((Date.now() - Date.parse(newest)) / 86400000) : null;
  const items = teams.map((team) => {
    let replies = 0;
    try { replies = readFileSync(join(base, 'replies', `${team}.jsonl`), 'utf8').split('\n').filter(Boolean).length; } catch { /* no replies file */ }
    return { team, replies, boardRows: rows.filter((r) => r.team === team).length, lastOpen: rows.filter((r) => r.team === team && r.phase === 'start').map((r) => r.directive).pop() ?? null };
  });
  return {
    source: 'vomega-desk', ok: true, items,
    detail: `${teams.length} team(s), ${rows.length} board row(s), newest ${newest ?? '-'}${ageDays !== null ? ` (${ageDays}d stale)` : ''}`,
    staleDays: ageDays,
  };
}

/**
 * Bind each named agent to the session that belongs to it.
 *
 * There is no declared binding on this machine: `bootstrap.mjs claim` shells out
 * to a `sessions claim` that does not exist, so nothing ever wrote agent↔session
 * pairs. A seat's session id in seats.json is the only declared link. Everything
 * else is inferred from the session title, and is labelled as such rather than
 * presented as fact.
 */
export function bindAgents(agents, threads, declared = {}) {
  return agents.map((a) => {
    if (declared[a.id]) return { ...a, binding: { basis: 'declared', session: declared[a.id] } };
    const needle = String(a.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-z0-9])${needle}([^a-z0-9]|$)`, 'i');
    const hits = (threads ?? []).filter((t) => re.test(String(t.title ?? '')));
    if (hits.length) {
      hits.sort((x, y) => x.ageMinutes - y.ageMinutes);
      return { ...a, binding: { basis: 'inferred', session: hits[0].id, title: hits[0].title, ageMinutes: hits[0].ageMinutes, matches: hits.length } };
    }
    return { ...a, binding: { basis: 'unbound', session: null } };
  });
}

/** Counts per binding basis, so the roof states how much of the join it can prove. */
export function bindingSummary(agents) {
  const out = { declared: 0, inferred: 0, unbound: 0 };
  for (const a of agents) out[a.binding?.basis ?? 'unbound'] += 1;
  return out;
}

export const DEFAULT_INBOX_ROOTS = [
  process.cwd(),
  'C:\\0-BlackBoxProject-0\\001.PROJECTS.PM',
  'C:\\0-BlackBoxProject-0\\002.ACP',
  'C:\\0-BlackBoxProject-0\\VOMEGA',
  'C:\\0-BlackBoxProject-0\\zcode-setup',
];

/**
 * The bot-inbox channel's own state: one JSONL per Bot under `.zcode/bots/inbox/`,
 * plus `groups.json`. Messages carry `{id, from, to[], kind, thread, subject, ts}`,
 * so they yield both an agent row (each inbox is a Bot) and thread rows (`thread`).
 * Nothing here is inferred: an absent directory means the project never initialised.
 */
export function probeInboxes(roots = DEFAULT_INBOX_ROOTS) {
  const items = [];
  const threads = [];
  const groups = [];
  for (const root of roots) {
    const dir = join(root, '.zcode', 'bots', 'inbox');
    if (!existsSync(dir)) continue;
    const project = root.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || root;
    const gfile = join(root, '.zcode', 'bots', 'groups.json');
    if (existsSync(gfile)) {
      try {
        const doc = JSON.parse(readFileSync(gfile, 'utf8'));
        for (const g of doc.groups ?? []) groups.push({ project, name: g.name, members: g.members ?? [], purpose: g.purpose ?? null });
      } catch { /* a malformed groups file is not a crash */ }
    }
    // `delivered.jsonl` and `receipts.jsonl` are the inbox's own ledgers and sit
    // beside the Bot inboxes; naming them bots would invent two agents.
    const LEDGERS = new Set(['delivered', 'receipts']);
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.jsonl') && !LEDGERS.has(x.replace(/\.jsonl$/, '')))) {
      const bot = f.replace(/\.jsonl$/, '');
      let rows = [];
      try {
        rows = readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
      } catch {
        items.push({ project, bot, messages: -1, recent7d: 0, newest: null, unreadable: true });
        continue;
      }
      const newest = rows.map((r) => r.ts).filter(Boolean).sort().reverse()[0] ?? null;
      const recent7d = rows.filter((r) => r.ts && Date.now() - Date.parse(r.ts) < 7 * 86400000).length;
      items.push({ project, bot, messages: rows.length, recent7d, newest });
      const perThread = new Map();
      for (const r of rows) {
        const t = r.thread || '(no thread)';
        const cur = perThread.get(t) ?? { messages: 0, newest: null };
        cur.messages += 1;
        if (r.ts && (!cur.newest || r.ts > cur.newest)) cur.newest = r.ts;
        perThread.set(t, cur);
      }
      for (const [t, c] of perThread) threads.push({ id: `${project}:${t}`, thread: t, project, messages: c.messages, newest: c.newest });
    }
  }
  const projects = new Set(items.map((i) => i.project));
  return {
    source: 'bot-inboxes',
    ok: items.length > 0 || groups.length > 0,
    items, threads, groups,
    detail: `${items.length} inbox(es) in ${projects.size} project(s), ${threads.length} thread(s), ${groups.length} group(s)`,
  };
}

/**
 * The machine-wide `zcode-comms` bus: notices between projects, plus the project
 * registry that says which desks are expected to poll a file. One writer, hash
 * chained, so a broken chain is a defect rather than a curiosity.
 */
export function probeCommsBus(commsRoot = join(HOME, '.zcode', 'comms')) {
  const busFile = join(commsRoot, 'bus.jsonl');
  if (!existsSync(busFile)) return { source: 'comms-bus', ok: false, items: [], projects: [], detail: `no machine bus at ${busFile}` };
  let notices = [];
  try {
    notices = readFileSync(busFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  } catch (e) {
    return { source: 'comms-bus', ok: false, items: [], projects: [], detail: `bus unreadable: ${e.message}` };
  }
  const lines = (f) => { try { return readFileSync(join(commsRoot, f), 'utf8').split('\n').filter(Boolean).length; } catch { return 0; } };
  let projects = [];
  try { projects = JSON.parse(readFileSync(join(commsRoot, 'projects.json'), 'utf8')).projects ?? []; } catch { /* no registry */ }
  const newest = notices.map((n) => n.ts).filter(Boolean).sort().reverse()[0] ?? null;
  return {
    source: 'comms-bus', ok: true,
    items: projects.map((p) => ({ id: p.desk || basename(String(p.path)), project: basename(String(p.path)), path: p.path, role: p.role ?? null, desk: p.desk ?? null })),
    projects,
    detail: `${notices.length} notice(s), ${projects.length} registered project(s), ${lines('delivered.jsonl')} delivered, ${lines('receipts.jsonl')} receipt(s), newest ${newest ?? '-'}`,
  };
}

/** The anet binary: env override, then the installer's default location, then PATH. */
export function anetBin() {
  if (process.env.HQ_ANET_BIN) return process.env.HQ_ANET_BIN;
  const installed = join(process.env.LOCALAPPDATA || join(HOME, 'AppData', 'Local'), 'Programs', 'anet', 'anet.exe');
  return existsSync(installed) ? installed : 'anet';
}

/** Parse `anet status --json`. Pure, so the shape is testable without a node. */
export function parseAnetStatus(stdout) {
  let doc = null;
  try { doc = JSON.parse(String(stdout ?? '')); } catch { doc = null; }
  if (!doc?.identity?.aid) return { source: 'anet', ok: false, items: [], detail: 'status is not anet JSON (no identity.aid)' };
  const aid = doc.identity.aid;
  const name = doc.identity.name ?? 'default';
  const hub = doc.hub?.state ?? doc.hub?.url ?? 'unknown';
  const inbound = typeof doc.inbound_policy === 'string'
    ? doc.inbound_policy
    : (doc.inbound_policy?.policy ?? doc.inbound_policy?.state ?? 'unknown');
  const autoReply = doc.auto_reply?.backend ? `${doc.auto_reply.backend}/${doc.auto_reply.agent}` : 'off';
  return {
    source: 'anet', ok: doc.identity.state === 'ok' || Boolean(doc.identity.aid),
    items: [{ id: `${name}@anet`, project: null, aid, name, hub, inbound, autoReply }],
    detail: `identity ${name} …${aid.slice(-8)}, hub ${hub}, inbound ${inbound}, autoreply ${autoReply}`,
  };
}

/** The running A2A node, read from the binary's own status. */
export function probeAnet(bin = anetBin()) {
  const r = spawnSync(bin, ['status', '--json'], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  if (r.error) return { source: 'anet', ok: false, items: [], detail: `cannot run ${bin}: ${r.error.message}` };
  if (r.status !== 0) return { source: 'anet', ok: false, items: [], detail: (r.stderr || r.stdout || 'anet status failed').trim().split(/\r?\n/).pop() };
  return parseAnetStatus(r.stdout);
}

/**
 * The channel evidence ledger: what was claimed to happen on a provider surface,
 * and what the outcome actually says. A receipt joins its outcome by `requestId`;
 * a receipt with no outcome is a claim nobody checked.
 */
export function probeChannelEvidence(channelRoot = DEFAULT_CHANNEL_ROOT) {
  const readDir = (name) => {
    try {
      // Sorted on purpose: directory iteration order is filesystem-dependent
      // (hash order on Linux, sorted on NTFS), and the roof is a report whose
      // items, threads and defects must be reproducible on any host.
      return readdirSync(join(channelRoot, name))
        .sort()
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => {
          try { return { file: f, doc: JSON.parse(readFileSync(join(channelRoot, name, f), 'utf8')) }; } catch { return { file: f, doc: null }; }
        });
    } catch { return []; }
  };
  const receiptsRaw = readDir('receipts');
  const outcomesRaw = readDir('outcomes');
  const decisionsRaw = readDir('decisions');
  if (!receiptsRaw.length && !outcomesRaw.length && !decisionsRaw.length) {
    return { source: 'channel-evidence', ok: false, items: [], threads: [], decisions: [], detail: `no channel evidence at ${channelRoot}` };
  }
  const outcomeByRequest = new Map(outcomesRaw.filter((o) => o.doc?.requestId).map((o) => [o.doc.requestId, o.doc]));
  /** @type {any[]} */
  const receipts = receiptsRaw.map(({ file, doc }) => {
    if (!doc) return { id: file.replace(/\.json$/, ''), unreadable: true, joinable: false };
    const threadId = doc.thread?.after || doc.thread?.before || null;
    const outcome = outcomeByRequest.get(doc.requestId) ?? null;
    return {
      id: doc.receiptId ?? file.replace(/\.json$/, ''),
      requestId: doc.requestId ?? null,
      actor: doc.actor?.id ?? null,
      actorKind: doc.actor?.kind ?? null,
      effect: doc.effect ?? null,
      threadId,
      createdAt: doc.createdAt ?? null,
      outcomeEffect: outcome?.effect ?? null,
      evidenceState: outcome?.evidenceState ?? null,
      joinable: Boolean(outcome),
    };
  });
  const threadCounts = new Map();
  for (const r of receipts) if (r.threadId) threadCounts.set(r.threadId, (threadCounts.get(r.threadId) ?? 0) + 1);
  const decisions = decisionsRaw.map(({ file, doc }) => ({
    id: doc?.decisionId ?? file.replace(/\.json$/, ''),
    effect: doc?.effect ?? null,
    kind: doc?.kind ?? null,
    at: doc?.decidedAt ?? null,
  }));
  const joinable = receipts.filter((r) => r.joinable).length;
  const distinct = threadCounts.size;
  // A thread id that names the tab, not the conversation, cannot tell two
  // conversations apart — which is the collapse CNP/1 exists to prevent. The
  // real record mixes placeholders, real ids and missing ids, so all three are
  // counted instead of asserting the single worst case.
  const PLACEHOLDER = /live-tab$/i;
  const placeholderIds = new Set([...threadCounts.keys()].filter((id) => PLACEHOLDER.test(id) || /^(new|t\d+)$/i.test(id) || /-new$/i.test(id)));
  const placeholder = receipts.filter((r) => r.threadId && placeholderIds.has(r.threadId)).length;
  const missing = receipts.filter((r) => !r.threadId).length;
  const real = receipts.length - placeholder - missing;
  // CNP/1 names what the receipt could not: the registry maps receiptId → Nid, so
  // a placeholder row becomes joinable without editing the evidence ledger.
  let registry = null;
  try { const f = join(channelRoot, 'threads.json'); if (existsSync(f)) registry = new Registry(f); } catch { registry = null; }
  let resolved = 0;
  if (registry) {
    for (const r of receipts) {
      const entry = r.id ? registry.get(r.id) : null;
      if (!entry) continue;
      r.resolvedNid = entry.nid;
      if (r.threadId && !placeholderIds.has(r.threadId)) continue;   // stored id already good
      resolved += 1;
    }
  }
  const unresolvable = receipts.length - real - resolved;
  const topPlaceholder = [...threadCounts.entries()].filter(([id]) => placeholderIds.has(id)).sort((a, b) => b[1] - a[1])[0] ?? null;
  const collapsed = receipts.length > 1 && distinct === 1 ? [...threadCounts.keys()][0] : null;
  return {
    source: 'channel-evidence',
    ok: receipts.length > 0 || decisions.length > 0,
    items: receipts,
    threads: [...threadCounts].map(([id, count]) => ({ id, count, placeholder: placeholderIds.has(id) })),
    decisions,
    collapsedThread: collapsed,
    threadIdentity: { real, placeholder, missing, resolved, unresolvable, topPlaceholder: topPlaceholder ? { id: topPlaceholder[0], count: topPlaceholder[1] } : null },
    detail: `${receipts.length} receipt(s), ${joinable} joinable to an outcome, ${decisions.length} decision(s), `
      + `${distinct} distinct thread(s); identity: ${real} stored, ${resolved} named by CNP, ${unresolvable} unresolvable`,
  };
}

/**
 * The control stores: approvals, revocations and typed tasks. Counts only — the
 * roof reports the queue depth, not the contents. Every store is read through its
 * own module, so a shape change breaks one probe instead of the whole roof.
 */
export function probeControl({ channelRoot = DEFAULT_CHANNEL_ROOT } = {}) {
  const dir = join(channelRoot, 'control');
  const read = (fn, file) => {
    try { return fn({ file }); } catch (e) { return { error: String(e.message ?? e) }; }
  };
  const approvals = read(approvalState, join(dir, 'approvals.jsonl'));
  const revocations = read(revocationView, join(dir, 'revocations.jsonl'));
  const tasks = read(taskView, join(dir, 'tasks.jsonl'));
  const pending = approvals?.pending ?? 0;
  const revoked = revocations?.count ?? 0;
  const open = tasks?.counts?.open ?? 0;
  const errors = [approvals, revocations, tasks].filter((x) => x?.error).length;
  return {
    source: 'control',
    ok: errors === 0,
    approvals, revocations, tasks,
    detail: `approvals ${pending} pending · revocations ${revoked} · tasks ${open} open${errors ? ` · ${errors} unreadable store(s)` : ''}`,
  };
}

/** The pure join. Inputs are what the probes returned; nothing is fetched here. */
export function buildRoof(parts) {
  const agents = [
    ...(parts.bots?.items ?? []).map((b) => ({ id: b.id, kind: 'bot', state: { role: b.role, routines: b.routines }, source: 'bots.mjs' })),
    ...(parts.seats?.items ?? []).map((s) => ({ id: s.id, kind: s.role === 'manager' ? 'manager' : 'seat', state: { site: s.site, session: s.session }, source: 'seats.json' })),
    ...(parts.desk?.items ?? []).map((t) => ({ id: t.team, kind: 'team', state: { replies: t.replies, boardRows: t.boardRows, lastOpen: t.lastOpen }, source: 'VOMEGA DESK' })),
    ...(parts.agentDefs?.items ?? []).map((a) => ({ id: a.id, kind: 'definition', state: { model: a.model, thoughtLevel: a.thoughtLevel }, source: a.dir })),
    ...(parts.commsBus?.items ?? []).map((d) => ({ id: d.id, kind: 'desk', state: { project: d.project, path: d.path, role: d.role }, source: 'zcode-comms bus' })),
    ...(parts.anet?.items ?? []).map((n) => ({ id: n.id, kind: 'a2a-node', state: { aid: n.aid, hub: n.hub, inbound: n.inbound, autoReply: n.autoReply }, source: 'anet' })),
  ];
  const defects = [];
  // Bot-inbox rows: an inbox IS a named agent, so it enriches a roster entry of
  // the same name (chief already exists as a bot) instead of duplicating it.
  for (const ib of parts.inboxes?.items ?? []) {
    const hit = agents.find((a) => String(a.id).toLowerCase() === String(ib.bot).toLowerCase());
    const state = { project: ib.project, messages: ib.messages, recent7d: ib.recent7d, newest: ib.newest };
    // A Bot name can have an inbox in more than one project (chief does). Every
    // one is kept: keeping only the last scanned silently dropped real traffic.
    if (hit) hit.state = { ...hit.state, inboxes: [...(hit.state.inboxes ?? []), state] };
    else agents.push({ id: ib.bot, kind: 'inbox-bot', state: { inboxes: [state] }, source: 'bot-inbox' });
  }
  // Receipt actors enrich a matching roster row; no new agent is invented from a
  // receipt, because an actor id is not proof that a named agent exists.
  for (const rc of parts.evidence?.items ?? []) {
    if (!rc.actor) continue;
    const hit = agents.find((a) => String(a.id).toLowerCase() === String(rc.actor).toLowerCase());
    if (hit) hit.state = { ...hit.state, evidence: { receipts: (hit.state.evidence?.receipts ?? 0) + 1, lastEffect: rc.effect } };
  }
  if (parts.evidence?.collapsedThread) {
    const n = (parts.evidence.items ?? []).filter((r) => r.threadId === parts.evidence.collapsedThread).length;
    defects.push({ source: 'channel-evidence', detail: `thread identity collapsed: ${n} receipt(s) all name thread '${parts.evidence.collapsedThread}', so separate conversations are indistinguishable in the record` });
  } else if (parts.evidence?.threadIdentity) {
    const ti = parts.evidence.threadIdentity;
    const total = (parts.evidence.items ?? []).length;
    // Only what is still unnamed is a defect: a placeholder that CNP has named is
    // joinable, and calling it a defect would punish the repair.
    const unresolved = ti.unresolvable ?? (ti.placeholder + ti.missing);
    if (unresolved > 0) {
      defects.push({
        source: 'channel-evidence',
        detail: `thread identity unusable for ${unresolved} of ${total} receipt(s): `
          + `${ti.placeholder} name a placeholder${ti.topPlaceholder ? ` ('${ti.topPlaceholder.id}' ×${ti.topPlaceholder.count})` : ''}, `
          + `${ti.missing} have none; ${ti.real} name a conversation and ${ti.resolved ?? 0} are named by CNP`,
      });
    }
  }
  for (const p of [parts.bots, parts.seats, parts.agentDefs, parts.threads, parts.channels, parts.desk, parts.commsBus, parts.anet, parts.evidence]) {
    if (p && !p.ok) defects.push({ source: p.source, detail: p.detail });
  }
  // The machine bus and the A2A node are channels in their own right, so they
  // get a channel row even though their state also lands on agent rows.
  const channelsExtra = [];
  for (const p of [parts.commsBus, parts.anet, parts.evidence, parts.control]) {
    if (p) channelsExtra.push({ id: p.source, ok: p.ok, detail: p.detail });
  }
  for (const c of parts.channels?.items ?? []) {
    if (!c.ok) defects.push({ source: c.id, detail: c.detail });
  }
  // A frozen desk is history, not a defect: the owner's call is that past desks do
  // not count. It stays visible as a team row with its staleness; it does not fail
  // the roof, because nothing depends on it any more.
  const deskStale = parts.desk?.staleDays !== null && parts.desk?.staleDays !== undefined && parts.desk.staleDays > 1;
  const declared = {};
  for (const s of parts.seats?.items ?? []) if (s.session) declared[s.id] = s.session;
  const bound = bindAgents(agents, parts.threads?.items ?? [], declared);
  return {
    schema: ROOF_SCHEMA,
    agents: bound,
    bindings: bindingSummary(bound),
    threads: parts.threads?.items ?? [],
    inboxThreads: parts.inboxes?.threads ?? [],
    inboxGroups: parts.inboxes?.groups ?? [],
    channels: [...(parts.channels?.items ?? []), ...channelsExtra],
    evidence: parts.evidence?.items ?? [],
    evidenceThreads: parts.evidence?.threads ?? [],
    decisions: parts.evidence?.decisions ?? [],
    defects,
    ok: defects.length === 0,
  };
}

export function renderRoof(roof) {
  const L = [];
  L.push(`AGENTS (${roof.agents.length}) · binding: ${roof.bindings.declared} declared, ${roof.bindings.inferred} inferred, ${roof.bindings.unbound} unbound`);
  const byKind = { bot: 'bot', manager: 'manager', seat: 'seat', team: 'team (VOMEGA)', desk: 'registered desk', 'a2a-node': 'A2A node', 'inbox-bot': 'inbox bot', definition: 'definition' };
  for (const kind of ['bot', 'manager', 'seat', 'team', 'desk', 'a2a-node', 'inbox-bot', 'definition']) {
    const rows = roof.agents.filter((a) => a.kind === kind);
    if (!rows.length) continue;
    L.push(`  ${byKind[kind]} (${rows.length}): ${rows.slice(0, 8).map((a) => a.id).join(', ')}${rows.length > 8 ? ', …' : ''}`);
  }
  L.push('');
  L.push('THREADS (live, newest first)');
  for (const t of roof.threads.slice(0, 8)) L.push(`  ${String(t.ageMinutes + 'm').padEnd(6)} ${t.id.slice(0, 30).padEnd(32)} ${String(t.title).slice(0, 34)}`);
  if (!roof.threads.length) L.push('  (none read)');
  if (roof.inboxThreads?.length) {
    L.push('');
    L.push(`INBOX THREADS (${roof.inboxThreads.length}) · ${roof.inboxGroups?.length ?? 0} group(s)`);
    for (const t of roof.inboxThreads.slice(0, 8)) {
      L.push(`  ${String(t.messages).padStart(3)} msg  ${String(t.project).padEnd(14)} ${String(t.thread).slice(0, 30)}${t.newest ? ` · ${t.newest}` : ''}`);
    }
  }
  L.push('');
  L.push('CHANNELS');
  for (const c of roof.channels) L.push(`  ${c.ok ? 'ok  ' : 'BAD '} ${String(c.id).padEnd(14)} ${c.detail}`);
  L.push('');
  L.push(roof.defects.length ? `DEFECTS (${roof.defects.length})` : 'DEFECTS (none)');
  for (const d of roof.defects) L.push(`  ${d.source}: ${d.detail}`);
  return L.join('\n');
}
