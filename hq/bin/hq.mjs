#!/usr/bin/env node
// hq/bin/hq.mjs — HQ command surface.
// Two audiences: Builder (agent/Harness) and Owner (VIVIM consumer).
// Read-only except: index, wiki, home, feed, hooks, watch, reset, note, project, kb,
// channel watch (writes only the one wake-state.json under the channel root).
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync, readdirSync,
  copyFileSync, renameSync, watch,
} from 'node:fs';
import { join, resolve, dirname, basename, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import {
  openDb,
} from '../lib/schema.mjs';
import { parseAnnotationV2, ANNOTATION_V2_SCHEMA } from '../lib/annotation-v2.mjs';
import {
  getSemanticId, listSemanticIds, detectSemanticDrift, SEMANTIC_REGISTRY_SCHEMA,
} from '../lib/semantic-registry.mjs';
import {
  activateProgram, rollbackProgram, listProgramVersions, getActiveProgram, previewProgram,
  WIKI_PROGRAM_SCHEMA,
} from '../lib/wiki-program.mjs';
import {
  scanCapabilitySource, persistCapabilityScan, capabilityStatus, listCapabilitySources,
  listCapabilityPackages, getCapabilityPackage, listCapabilityNodes, listCapabilityMaps,
  listCapabilityContracts, getCapabilityContract, searchCapabilityDocuments,
  exportCapabilityJson, exportCapabilitySqlite, writeCapabilitySchema, CAPABILITY_REGISTRY_SCHEMA,
} from '../lib/capabilities.mjs';
import {
  loadProjects, loadConfig, saveConfig, saveProjects, dbPath, registerProject,
  unregisterProject, discoverHarvest, projectsForIndex, findProject,
  resolveProjectPath, PROJECTS_FILE, HQ_DIR,
} from '../lib/registry.mjs';
import {
  canonicalJson, digestOf, estimateTokens, formatBytes, formatNumber, toPosix,
  nowISO, truncate, globToRegExp,
} from '../lib/util.mjs';
import { collectStaleFiles } from '../lib/freshness.mjs';

// Shared freshness walk for `check`, `verify`, `refresh` and the watch gate:
// every surface judges the same file universe (configured cap and ignores)
// as the indexer. See hq/lib/freshness.mjs.
const collectStale = collectStaleFiles;
import {
  loadSeats, wakeSeat, verifySeat, renderSeatTable, lateReplyFor, WAKE_SCHEMA,
  DEFAULT_CHANNEL_ROOT, DEFAULT_IDLE_MINUTES,
} from '../lib/channel-seats.mjs';
import {
  BROKER_SCHEMA, RECEIPT_SCHEMA, cancelPending, drain, recordReply, renderQueueTable,
  requestState, submitRequest,
} from '../lib/channel-broker.mjs';
import { readLivenessMap, resumeSession, confirmWake, sessionsTool, lateReply } from '../lib/channel-transport.mjs';
import { resolveChannelThreads } from '../lib/cnp.mjs';
import { probeBots, probeSeats, probeAgentDefs, probeThreads, probeChannels, probeDesk, probeInboxes, probeCommsBus, probeAnet, probeChannelEvidence, probeControl, buildRoof, renderRoof } from '../lib/comms-roof.mjs';
import { reviewGate, REVIVE_CODES, assessLane, chooseSafeModel, orderRevive } from '../lib/revive-lane.mjs';
import { buildTeamSnapshot, renderPanel, renderHookSummary, writeStateCache, parseAgentFile, collectAgentFiles } from '../lib/team-panel.mjs';
import { planRoutes, buildCatalog, summarizeUsage, classifyHealth, shouldApply, DEFAULT_POLICY, readDeclaredReasoningLevels } from '../lib/model-router.mjs';
import { validateProviderConfig, providerReadiness, auditAgentCompliance, renderDoctor, renderDoctorVerdict } from '../lib/zcode-doctor.mjs';
import { buildStateCard, writeStateCard, loadStateCard, renderStateCard } from '../lib/session-card.mjs';
import {
  userTerm, memoryTierLabel, sitrepHeading, apertureHeading, glossaryMarkdown,
  authorityNotice, VIVIM_TAXONOMY,
} from '../lib/nomenclature.mjs';
import { routeAsk } from '../lib/ask.mjs';
import {
  startSpan, recordTiming, timeSync, timeAsync, timingReport, budgetReport, optimize,
  applyRecommendations, applyProfile, setPriority, setBudget,
  formatTimingReport, formatOptimize, profileOptions,
} from '../lib/telemetry.mjs';
import {
  sessionRows, sessionDetail, sessionTimeline, toolUsage,
  renderSessionsText, renderSessionsMarkdown, SESSION_VIEWS_SCHEMA,
} from '../lib/session-views.mjs';
import { assertToolchain } from '../lib/toolchain-guard.mjs';

// ZAIQ-014 toolchain guard — enforced once at tool entry, before any command
// does real work: refuse bun <1.4 (exit 2) and a bun.lock downgraded to the
// legacy v1 text format (exit 3). Fast, offline and deliberately tolerant so
// the watcher daemon and CI-style runs are never killed by a false positive.
// Override: HQ_TOOLCHAIN_UNGUARDED=1. See hq/lib/toolchain-guard.mjs.
assertToolchain();

const BOOL = new Set([
  'json', 'force', 'quiet', 'reverse', 'exact', 'write', 'check', 'strict', 'changed',
  'all', 'staged', 'owner-confirmed', 'once', 'help', 'version', 'html', 'scan',
  'index', 'yes', 'no-wiki', 'pretty', 'attention', 'next', 'suggestions', 'pinned',
  'apply', 'dry-run', 'asks',
'n',
]);

// Flags that may appear more than once and accumulate (`--await <id> --await <id>`).
const REPEAT = new Set([
  'await',
]);

// The version comes from the manifest that ships beside the runtime, so an
// installed bundle reports the version it was built from instead of a literal.
function runtimeVersion() {
  try {
    const manifest = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', '..', 'package.json'), 'utf8'),
    );
    return typeof manifest.version === 'string' ? manifest.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') { positional.push(...argv.slice(i + 1)); break; }
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        const key = arg.slice(2);
        if (BOOL.has(key)) flags[key] = true;
        else if (REPEAT.has(key) && i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          const v = argv[++i];
          flags[key] = flags[key] === undefined ? v : [].concat(flags[key], v);
        }
        else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) flags[key] = argv[++i];
        else flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function findRoot(start = process.cwd()) {
  // Test isolation (ZAIQ-011): with a sandbox declared, the sandbox IS the workspace.
  // The upward search never runs, so a test subprocess cannot resolve -- and therefore
  // cannot reset -- the operator's real workspace, whatever its cwd. Explicit `--root`
  // flags keep precedence where they exist (e.g. `hq init`).
  const sandbox = process.env.HQ_TEST_SANDBOX;
  if (sandbox && String(sandbox).trim()) return resolve(String(sandbox));
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, PROJECTS_FILE)) || existsSync(join(dir, HQ_DIR))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

// True when `path` is `dir` itself or lives somewhere under it (both resolved).
function isInsideDir(path, dir) {
  const base = resolve(dir);
  const target = resolve(path);
  return target === base || target.startsWith(base + sep);
}

function openWorkspace() {
  const root = findRoot();
  const config = loadConfig(root);
  const db = openDb(dbPath(root, config));
  return { root, config, db };
}

// Scoped gates must measure one space, not a neighbour that is actively being
// written. `--project` accepts the registered name or its absolute path.
function selectProjects(projects, selector) {
  if (!selector) return projects;
  const value = String(selector);
  return projects.filter((p) => p.name === value || p.path === value || p.abs === value);
}

function emit(flags, value, text) {
  if (flags.json) process.stdout.write(canonicalJson(value));
  else process.stdout.write((text.endsWith('\n') ? text : text + '\n'));
}

function fail(code, message) {
  process.stderr.write(`hq: ${message}\n`);
  return code;
}

function count(db, table, where = '', params = []) {
  const row = db.prepare(`SELECT count(*) AS c FROM ${table}${where ? ' WHERE ' + where : ''}`).get(...params);
  return row ? row.c : 0;
}

function findFileRow(db, target, project = null) {
  const p = toPosix(String(target ?? '')).replace(/^\.\//, '');
  if (!p) return null;
  const projectRow = project ? db.prepare('SELECT id FROM projects WHERE name = ?').get(project) : null;
  if (projectRow) {
    const exact = db.prepare('SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.project_id = ? AND f.path = ?').get(projectRow.id, p);
    if (exact) return exact;
    return db.prepare('SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.project_id = ? AND (f.path LIKE ? OR f.path LIKE ?) ORDER BY length(f.path) LIMIT 1').get(projectRow.id, `%/${p}`, `%${p}`);
  }
  const exact = db.prepare('SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.path = ?').get(p);
  if (exact) return exact;
  return db.prepare('SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.path LIKE ? OR f.path LIKE ? ORDER BY length(f.path) LIMIT 1').get(`%/${p}`, `%${p}`);
}

function resolveSince(ref) {
  const value = String(ref ?? '').trim().toLowerCase();
  const now = Date.now();
  if (!value || value === 'today') return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  if (value === 'yesterday') return new Date(now - 24 * 3600 * 1000).toISOString();
  const days = value.match(/^(\d+)d$/);
  if (days) return new Date(now - Number(days[1]) * 86400 * 1000).toISOString();
  const hours = value.match(/^(\d+)h$/);
  if (hours) return new Date(now - Number(hours[1]) * 3600 * 1000).toISOString();
  return String(ref);
}

function languageBreakdown(rows) {
  const counts = {};
  for (const row of rows) counts[row.lang] = (counts[row.lang] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([lang, n]) => ({ lang, count: n }));
}

function projectRows(db) {
  return db.prepare(`
    SELECT p.*,
      (SELECT count(*) FROM files f WHERE f.project_id = p.id) AS files,
      (SELECT count(*) FROM symbols s WHERE s.project_id = p.id) AS symbols,
      (SELECT count(*) FROM commits c WHERE c.project_id = p.id) AS commits
    FROM projects p ORDER BY p.name
  `).all();
}

function projectCard(db, project) {
  const last = db.prepare('SELECT sha, date, subject FROM commits WHERE project_id = ? ORDER BY date DESC LIMIT 1').get(project.id);
  const langs = db.prepare('SELECT lang, count(*) AS count FROM files WHERE project_id = ? GROUP BY lang ORDER BY count DESC').all(project.id);
  return {
    name: project.name,
    path: project.path,
    branch: project.branch,
    head: project.head,
    lastCommit: last ? { sha: last.sha, date: last.date, subject: last.subject } : null,
    languages: langs,
    files: project.files,
    symbols: project.symbols,
    commits: project.commits,
    dirty: false,
    ahead: null,
    behind: null,
    indexAge: project.indexed_at,
    tags: [],
    description: null,
  };
}

function helpText() {
  return `HQ — local code intelligence and context automation

Setup
  hq init [--index]                 Create .hq, discover spaces in harvest/, print next steps
  hq project add <name> <path>      Register a space (project)
  hq project remove <name>          Remove a space
  hq project list                   List spaces
  hq project discover               Discover spaces under harvest/
  hq index [--project N] [--force]  Incremental index
  hq status                         Index and space status
  hq doctor                         Environment and health checks

Find and understand
  hq search <query>                 Search code and docs (FTS5)
  hq find <symbol>                  Find a symbol
  hq file <path>                    Explain a file
  hq deps <path> [--reverse]        Dependency edges
  hq impact <path>                  Transitive reverse dependencies
  hq dead                           Exported symbols with no inbound imports
  hq trace <task>                   Ordered path through the code for a task

Context and continuity
  hq context <task> [--budget N]    Deterministic context bundle (Aperture)
  hq route <task>                   Mandatory instructions, skills, boundaries
  hq brief [--audience owner]       Progress report (SITREP)
  hq handoff [--out FILE]           Session handoff bundle
  hq session-card [--write]         Durable state card for the compaction protocol
  hq since <ref>                    What changed since a ref/date
  hq receipts                       Activity record
  hq verify <bundle>                Verify a context bundle

Memory
  hq note add <text> [--tier N]     Add Recent/Saved Knowledge/Core Memory note
  hq note list [--tier N]           List notes
  hq note promote <id> --to canon   Promote (canon needs --owner-confirmed)
  hq note archive <id>              Archive a note
  hq note export                    Export notes as JSON
  hq recall <query>                 Search notes

Knowledge base
  hq kb intake <dir> [--dry-run]    Ingest a VIVIM KB package (evidence, never authority)
  hq kb status                      Last ingested KB package
  hq kb verify <dir>                Compare a package with what HQ holds
  hq kb health                      KB counts, stale evidence, orphans
  hq kb query <text> [--kind K]     Query docs, decisions, canon, notes, sessions
  hq kb graph [--project N]         KB node graph
  hq kb remember <text>             Save a note through the KB API

Sessions
  hq sessions import <dir>          Absorb exported OpenCode session files
  hq sessions list [--asks]         Sessions with counts, tools, cost, ask/reply
  hq sessions show <id>             One session in full
  hq sessions timeline              Per-day session/message/tool/cost buckets
  hq sessions tools                 Tool usage across every session

Channel seats (the manager's hand on a live seat)
  hq seat list                      Every seat with IDLE/ACTIVE and its age
  hq seat wake <seat> --prompt "…"  Journal intent, then prompt that seat's session
  hq seat verify <seat>             Proof from the seat's own transcript
  hq channel watch [--once]         Event-driven channel wake: outcomes/pending/receipts -> bus (no polling; --wake <seat> --await <id>)
  hq coordination submit            Queue a bounded ChatGPT request through the broker
  hq coordination status            Queue states (--request <id> for one)
  hq coordination receipt <id>      The one receipt a requestId ever gets
  hq coordination cancel-pending <id>  Cancel a request that has not been sent
  hq coordination reply <id>        Parse a captured model reply into inert proposals
  hq autonomy [--apply] [--transport seat|agent]   Plan/dispatch one cycle (dry run by default)
  hq work [list]                   The authored work queue, validated

Comms roof
  hq comms                          One view: agents, threads, inboxes, channels, defects
  hq zcode-doctor                   COO's machine doctor: provider config, agent compliance, model budget, seats
  hq team                           The team panel: agents, seats, sessions, tasks, next moves
  hq route-model                    Budget-aware model routing: propose a healthier, cheaper route
  hq review <n>                     Review gate: after every n completed work orders, DONE / MORE-WORK / BLOCKED
  hq console                        Multi-model console: health dashboard for every model in provider_config.json
  hq comms --strict                 Exit 1 when any source reports a defect

Capability registry
  hq capabilities scan <dir>        Inventory a dependency tree (static, no execution)
  hq capabilities status            Sources, counts, proposed contracts
  hq capabilities packages [q]      Package inventory
  hq capabilities package <name>    One package, manifest fields and candidates
  hq capabilities nodes [--domain]  Capability taxonomy
  hq capabilities map [--node ID]   Candidate package-to-capability mappings
  hq capabilities contracts         Proposed typed action contracts
  hq capabilities contract <id>     One proposed contract
  hq capabilities search <query>    Search README/license/changelog text
  hq capabilities export            JSON, --sqlite PATH, --schema PATH

Quality and documentation
  hq lint [--project N]             Protocol lint (@hq annotations, secrets, docs)
  hq todos                          Open @hq:todo ledger
  hq docs [--family N]              Document inventory (21 families)
  hq docs health                    Missing/stale/orphan/duplicate documents
  hq decisions [query]              Decision register
  hq canon [query]                  CANON term register
  hq conflicts                      Document/decision/canon conflicts
  hq filetypes [--family N]         217/133 agentic file registry
  hq rulebook [--write]             Full agentic rule book
  hq dcb explain|protocol           DCB auto-generation protocol
  hq wiki [--out DIR] [--force]     Build the code + documentation wiki
  hq wiki --check                   Check whether the wiki is current
  hq wiki program show <id>         Show active wiki program configuration
  hq wiki program versions [id]     List wiki program versions
  hq wiki program preview <json-file>  Preview a program config (read-only)
  hq wiki program activate <json-file> --owner-confirmed  Activate a program version
  hq wiki program rollback --id <id> --to-version <n> --owner-confirmed  Rollback to a prior version
  hq annotate-v2 <path> [--json]    Parse v2 annotations from a source file
  hq semantic list [--kind K] [--status S]  List semantic IDs
  hq semantic show <id>             Show one semantic ID
  hq semantic drift                 Detect source drift on semantic links
  hq home [--write]                 Owner home (My World)
  hq glossary                       VIVIM + HQ glossary

Automation and integration
  hq refresh [space] [--reason S]        Incremental index + stale wiki pages + gate (.hq/refresh.log)
  hq watch [--debounce MS] [--spaces A,B] Always-on daemon: reindex + wiki on change (--once for one cycle)
  hq hooks install|remove|status        Git hooks per space (run hq refresh; output in .hq/hooks.log)
  hq mcp                            MCP server over stdio (Harness bridge)
  hq feed --write|--check           Deterministic committed feed
  hq lake ingest|query|drift        Git event lake

Media Library (VIVIM torrent engine)
  hq media status                   My Media counts + latest activity
  hq media wanted                   Tracked shows and movies (wanted list)
  hq media library                  Downloaded and downloading titles
  hq media releases                 Next-episode dates for tracked shows
  hq media poll [--limit N]         Poll tracked shows for new episodes (plan-only by default; --limit N fetches up to N through Chrome)
  hq vivim sync                     Project VIVIM capabilities/requirements/goals into HQ
  hq vivim status [--json]          Alignment summary + drift
  hq vivim check                    Fail when the VIVIM feed is stale or misaligned
  hq vivim explain <id>             One capability/task/gap/journey/goal with its links

Performance and telemetry
  hq timing report                  Timing spans, p50/p95, errors
  hq timing budgets                 Budget violations by priority
  hq timing optimize [--apply]      Conflict-aware optimization plan
  hq timing conflicts               Show conflicting recommendations
  hq timing profile <name>          speed | balanced | quality
  hq timing priority <op> <1-10>    Set operation priority
  hq timing budget <op> <ms>        Set p95 budget
  hq timing clear --yes             Delete timing spans
  hq context-budget [--days 3]      Token census + model-window compaction plan

Utility
  hq config                         Show configuration
  hq reset --yes [--no-wiki]        Remove .hq and (optionally) wiki
                                    Tests: HQ_TEST_SANDBOX pins the workspace; HQ_TEST_FENCE
                                    (set by scripts/test-smart.mjs) refuses resets outside it
  hq kernel verify|init|read|history|backup|restore|lock|unlock
                                    Durable kernel store (outside .hq/)
  hq export [--format jsonl]        Export index records
  hq protocol [--write]             Agent inline-comment protocol
  hq ask <question>                 Natural-language router (Owner)
  hq help                           This help
  hq --version                      Version

Audiences
  Agent surfaces keep precise engineering terms.
  Owner surfaces use VIVIM language: My World, Spaces, Progress Report,
  Discover, Build, Activity Record, Recent / Saved Knowledge / Core Memory.

Invariants
  ${VIVIM_TAXONOMY.invariants.join('\n  ')}
  ${authorityNotice()}
`;
}

async function cmdInit(flags) {
  const root = flags.root ? resolve(String(flags.root)) : findRoot(process.cwd());
  mkdirSync(join(root, HQ_DIR), { recursive: true });
  const config = loadConfig(root);
  saveConfig(root, config);
  const data = loadProjects(root);
  const discovered = discoverHarvest(root);
  let added = 0;
  for (const entry of discovered) {
    if (data.projects.some((p) => p.name === entry.name || p.path === entry.path)) continue;
    data.projects.push({ name: entry.name, path: entry.path, tags: [], addedAt: nowISO() });
    added++;
  }
  data.projects.sort((a, b) => a.name.localeCompare(b.name));
  saveProjects(root, data);

  let indexed = null;
  if (flags.index) {
    const db = openDb(dbPath(root, config));
    const projects = projectsForIndex(root);
    const { indexWorkspace } = await import('../lib/indexer.mjs');
    indexed = await indexWorkspace({ root, db, projects, options: { maxFileBytes: config.maxFileBytes, ignores: config.ignores } });
    db.prepare("INSERT INTO meta(key,value) VALUES ('last_index_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(nowISO());
    db.close();
  }

  const out = {
    schema: 'hq.init/1', root, added, discovered: discovered.length,
    projects: data.projects.length, indexed,
    next: [
      'hq project add <name> <path>  (register external spaces)',
      'hq index                     (build the map)',
      'hq brief --audience owner    (Progress Report)',
      'hq home --write              (My World)',
      'hq wiki --write              (Build the wiki)',
      'hq mcp                       (Harness bridge)',
    ],
  };
  emit(flags, out, [
    `HQ initialised at ${root}`,
    `Spaces: ${data.projects.length} (${added} discovered)`,
    indexed ? `Indexed: ${indexed.totals?.files ?? 0} files, ${indexed.totals?.symbols ?? 0} symbols` : 'Index not built yet.',
    '',
    'Next:',
    ...out.next.map((line) => `  ${line}`),
  ].join('\n'));
  return 0;
}

async function cmdProject(positional, flags) {
  const root = findRoot();
  const action = positional.shift() || 'list';
  if (action === 'add') {
    let name = positional[0];
    let pathArg = positional[1];
    if (!pathArg) { pathArg = name; name = basename(resolve(root, pathArg)); }
    const entry = registerProject(root, { name, path: resolve(root, pathArg), tags: flags.tags ? String(flags.tags).split(',').map((s) => s.trim()).filter(Boolean) : [] });
    emit(flags, { schema: 'hq.project/1', action: 'add', project: entry },
      `Registered space "${entry.name}" -> ${entry.path}`);
    return 0;
  }
  if (action === 'remove') {
    const name = positional[0];
    if (!name) return fail(2, 'usage: hq project remove <name>');
    const removed = unregisterProject(root, name);
    const { db } = openWorkspace();
    db.prepare('DELETE FROM projects WHERE name = ?').run(name);
    db.close();
    emit(flags, { schema: 'hq.project/1', action: 'remove', name, removed },
      removed ? `Removed space "${name}"` : `No space named "${name}"`);
    return removed ? 0 : 1;
  }
  if (action === 'discover') {
    const found = discoverHarvest(root);
    emit(flags, { schema: 'hq.project/1', action: 'discover', projects: found },
      found.length ? found.map((p) => `${p.name}\t${p.path}`).join('\n') : 'No spaces found under harvest/.');
    return 0;
  }
  const data = loadProjects(root);
  const { db } = openWorkspace();
  const rows = projectRows(db);
  db.close();
  emit(flags, { schema: 'hq.project/1', action: 'list', projects: rows },
    rows.length ? rows.map((p) => `${p.name}\t${p.path}\t${p.branch || '-'}\t${p.files} files\t${p.symbols} symbols`).join('\n') : 'No spaces registered. Run: hq project add <name> <path>');
  return 0;
}

async function cmdIndex(positional, flags) {
  const { root, config, db } = openWorkspace();
  let projects = projectsForIndex(root);
  if (flags.project) projects = projects.filter((p) => p.name === flags.project || p.path === flags.project);
  if (!projects.length) { db.close(); return fail(1, 'no spaces to index. Run: hq project add <name> <path>'); }
  const { indexWorkspace } = await import('../lib/indexer.mjs');
  const result = await timeAsync(db, { operation: 'index', project: flags.project || null }, () => indexWorkspace({
    root, db, projects,
    options: {
      force: flags.force === true,
      maxFileBytes: Number(flags['max-file-bytes'] || config.maxFileBytes),
      ignores: config.ignores,
    },
  }));
  for (const project of result.projects || []) {
    recordTiming(db, {
      operation: 'index.project', project: project.name, durationMs: project.ms,
      ok: true,
      meta: { added: project.added, changed: project.changed, removed: project.removed },
    });
  }
  db.prepare("INSERT INTO meta(key,value) VALUES ('last_index_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(nowISO());
  // Routing depends on the instructions table: a plain index must populate it,
  // otherwise `hq route` returns empty mandatory/optional on a fresh workspace.
  let instructions = { count: 0, added: 0, changed: 0, removed: 0 };
  try {
    const { indexInstructions } = await import('../lib/skills.mjs');
    for (const project of projects) {
      const res = indexInstructions(db, project);
      instructions.count += res?.count ?? 0;
      instructions.added += res?.added ?? 0;
      instructions.changed += res?.changed ?? 0;
      instructions.removed += res?.removed ?? 0;
    }
  } catch { /* instruction lane not installed; code index remains valid */ }
  // Document intelligence is part of indexing when the canon module is present.
  try {
    const canon = await import('../lib/canon.mjs');
    for (const project of projects) {
      canon.indexDocuments(db, project);
      canon.indexDecisions(db, project);
      canon.indexCanonTerms(db, project);
    }
  } catch { /* canon lane not installed yet; the code index remains valid */ }
  db.close();
  const lines = [`Indexed ${result.totals?.files ?? 0} files, ${result.totals?.symbols ?? 0} symbols, ${result.totals?.imports ?? 0} imports, ${result.totals?.annotations ?? 0} annotations`];
  lines.push(`  instructions: ${instructions.count} (+${instructions.added} ~${instructions.changed} -${instructions.removed})`);
  for (const p of result.projects || []) {
    lines.push(`  ${p.name}: +${p.added} ~${p.changed} =${p.unchanged} -${p.removed} (${p.ms} ms)`);
  }
  if (result.errors?.length) lines.push(`  errors: ${result.errors.length}`);
  emit(flags, { schema: 'hq.index/1', ...result }, lines.join('\n'));
  return 0;
}

async function cmdStatus(flags) {
  const { root, config, db } = openWorkspace();
  const rows = projectRows(db);
  const lastIndexed = db.prepare("SELECT value FROM meta WHERE key='last_index_at'").get()?.value || null;
  const out = {
    schema: 'hq.status/1', root, db: dbPath(root, config), lastIndexed,
    totals: {
      projects: rows.length,
      files: count(db, 'files'),
      symbols: count(db, 'symbols'),
      imports: count(db, 'imports'),
      annotations: count(db, 'annotations'),
      commits: count(db, 'commits'),
      notes: count(db, 'notes', "status = 'active'"),
      receipts: count(db, 'receipts'),
    },
    projects: rows,
  };
  db.close();
  emit(flags, out, [
    `HQ status — ${root}`,
    `Spaces: ${rows.length} | Files: ${out.totals.files} | Symbols: ${out.totals.symbols} | Commits: ${out.totals.commits}`,
    `Annotations: ${out.totals.annotations} | Notes: ${out.totals.notes} | Receipts: ${out.totals.receipts}`,
    `Last indexed: ${lastIndexed || 'never'}`,
    '',
    ...rows.map((p) => `${p.name}\t${p.branch || '-'}\t${p.files} files\t${p.symbols} symbols\t${p.indexed_at || 'not indexed'}`),
  ].join('\n'));
  return 0;
}

async function cmdSearch(positional, flags) {
  const { config, db } = openWorkspace();
  const query = positional.join(' ').trim();
  if (!query) { db.close(); return fail(2, 'usage: hq search <query>'); }
  const { searchContent } = await import('../lib/search.mjs');
  const options = profileOptions(config, 'search');
  const result = timeSync(db, { operation: 'search', project: flags.project }, () => searchContent(db, {
    query, project: flags.project, lang: flags.lang, kind: flags.kind,
    limit: Number(flags.limit || options.searchLimit || 20), offset: Number(flags.offset || 0),
  }));
  db.close();
  const lines = [`${result.total} matches for "${query}"`];
  for (const hit of result.results) {
    lines.push('', `${hit.project}/${hit.path}${hit.line ? ':' + hit.line : ''}  [${hit.kind}]  score ${hit.score}`);
    if (hit.snippet) lines.push(`  ${String(hit.snippet).replace(/\s+/g, ' ').slice(0, 240)}`);
  }
  emit(flags, { schema: 'hq.search/1', query, ...result }, lines.join('\n'));
  return 0;
}

async function cmdFind(positional, flags) {
  const { config, db } = openWorkspace();
  const query = positional.join(' ').trim();
  if (!query) { db.close(); return fail(2, 'usage: hq find <symbol>'); }
  const { searchSymbols } = await import('../lib/search.mjs');
  const options = profileOptions(config, 'find');
  const result = timeSync(db, { operation: 'find', project: flags.project }, () => searchSymbols(db, {
    query, kind: flags.kind, project: flags.project,
    exact: flags.exact === true, limit: Number(flags.limit || options.findLimit || 30),
  }));
  db.close();
  const lines = [`${result.total} symbols for "${query}"`];
  for (const hit of result.results) {
    lines.push(`${hit.name}  ${hit.kind}  ${hit.project}/${hit.path}:${hit.line}${hit.exported ? '  exported' : ''}`);
    if (hit.signature) lines.push(`  ${truncate(hit.signature, 200)}`);
  }
  emit(flags, { schema: 'hq.find/1', query, ...result }, lines.join('\n'));
  return 0;
}

async function cmdFile(positional, flags) {
  const { db } = openWorkspace();
  const target = positional.join(' ').trim();
  if (!target) { db.close(); return fail(2, 'usage: hq file <path>'); }
  const row = findFileRow(db, target, flags.project);
  if (!row) { db.close(); return fail(1, `file not found: ${target}`); }
  const symbols = db.prepare('SELECT name, kind, line, end_line, signature, exported FROM symbols WHERE file_id = ? ORDER BY line').all(row.id);
  const imports = db.prepare('SELECT specifier, kind, line, resolved_file_id FROM imports WHERE file_id = ? ORDER BY line').all(row.id);
  const dependents = db.prepare('SELECT f.path AS path, p.name AS project FROM imports i JOIN files f ON f.id = i.file_id JOIN projects p ON p.id = i.project_id WHERE i.resolved_file_id = ? ORDER BY path').all(row.id);
  const annotations = db.prepare('SELECT line, kind, text, owner, ref FROM annotations WHERE file_id = ? ORDER BY line').all(row.id);
  const out = { schema: 'hq.file/1', file: row, symbols, imports, dependents, annotations, authority: 'source_declarations_not_runtime' };
  db.close();
  const lines = [
    `${row.project}/${row.path}`,
    `${row.lang} | ${row.kind} | ${row.lines} lines | ${formatBytes(row.size)}${row.is_test ? ' | test' : ''}`,
    '',
    'Symbols:',
    ...(symbols.length ? symbols.map((s) => `  ${s.name}  ${s.kind}  line ${s.line}${s.exported ? '  exported' : ''}`) : ['  (none)']),
    '',
    'Imports:',
    ...(imports.length ? imports.map((i) => `  ${i.specifier}${i.resolved_file_id ? '  -> resolved' : ''}`) : ['  (none)']),
    '',
    'Dependents:',
    ...(dependents.length ? dependents.map((d) => `  ${d.project}/${d.path}`) : ['  (none)']),
    '',
    'Annotations:',
    ...(annotations.length ? annotations.map((a) => `  line ${a.line} @hq:${a.kind} ${a.text}`) : ['  (none)']),
  ];
  emit(flags, out, lines.join('\n'));
  return 0;
}

async function cmdDeps(positional, flags) {
  const { db } = openWorkspace();
  const target = positional.join(' ').trim();
  if (!target) { db.close(); return fail(2, 'usage: hq deps <path> [--reverse]'); }
  const { deps } = await import('../lib/graph.mjs');
  const out = deps(db, {
    target, project: flags.project, depth: Number(flags.depth || 2),
    reverse: flags.reverse === true, limit: Number(flags.limit || 200),
  });
  db.close();
  const lines = [`${out.direction} deps for ${out.root ? out.root.project + '/' + out.root.path : target}`];
  for (const node of out.nodes) lines.push(`  ${'  '.repeat(Math.max(0, node.depth - 1))}${node.project}/${node.path}${node.via ? '  via ' + node.via : ''}`);
  if (!out.nodes.length) lines.push('  (none)');
  emit(flags, out, lines.join('\n'));
  return 0;
}

async function cmdImpact(positional, flags) {
  const { db } = openWorkspace();
  const target = positional.join(' ').trim();
  if (!target) { db.close(); return fail(2, 'usage: hq impact <path>'); }
  const { impact } = await import('../lib/graph.mjs');
  const out = impact(db, { target, depth: Number(flags.depth || 3), limit: Number(flags.limit || 500) });
  db.close();
  const lines = [`Impact of ${out.root ? out.root.project + '/' + out.root.path : target}: ${out.nodes.length} dependent(s)`];
  for (const node of out.nodes) lines.push(`  ${node.project}/${node.path}  depth ${node.depth}`);
  if (!out.nodes.length) lines.push('  (none)');
  emit(flags, out, lines.join('\n'));
  return 0;
}

async function cmdContext(positional, flags) {
  const { config, db } = openWorkspace();
  const task = (flags.task ? String(flags.task) : positional.join(' ')).trim();
  if (!task) { db.close(); return fail(2, 'usage: hq context <task> [--budget N] [--out FILE]'); }

  const { composeContext, verifyContext } = await import('../lib/context.mjs');
  const { recordReceipt } = await import('../lib/receipts.mjs');

  if (flags.verify) {
    const file = typeof flags.verify === 'string' ? flags.verify : positional[0];
    if (!file) { db.close(); return fail(2, 'usage: hq context --verify <bundle.json>'); }
    const bundle = JSON.parse(readFileSync(resolve(file), 'utf8'));
    const verification = timeSync(db, { operation: 'context.verify', project: flags.project }, () => verifyContext(bundle));
    db.close();
    emit(flags, verification, verification.valid ? 'Bundle verified.' : `Bundle invalid: ${verification.changed.join(', ')}`);
    return verification.valid ? 0 : 1;
  }

  const options = profileOptions(config, 'context');
  const span = startSpan(db, { operation: 'context', project: flags.project });
  let bundle;
  try {
    bundle = await composeContext(db, {
      task, project: flags.project,
      budgetTokens: Number(flags.budget || options.contextBudgetTokens || 6000),
      reservedForOutput: Number(flags.reserve || 800),
      maxFiles: Number(flags['max-files'] || options.contextMaxFiles || 24),
    });
    span.end({ bytes: Buffer.byteLength(bundle.fragment || '', 'utf8'), tokens: bundle.budget.used });
  } catch (error) {
    span.end({ ok: false, meta: { error: error.message } });
    db.close();
    throw error;
  }
  recordReceipt(db, {
    kind: 'context', task, project: flags.project,
    sources: bundle.sources.map((s) => ({ ref: s.ref, sha256: s.sha256 })),
    digest: bundle.digest, bytes: Buffer.byteLength(bundle.fragment || '', 'utf8'),
  });
  db.close();
  if (flags.out) {
    const outPath = resolve(String(flags.out));
    writeFileSync(outPath, canonicalJson(bundle), 'utf8');
    process.stdout.write(`Wrote ${outPath} (${bundle.sources.length} sources, ${bundle.budget.used} tokens)\n`);
    return 0;
  }
  if (flags.json) { emit(flags, bundle, ''); return 0; }
  const lines = [
    `${apertureHeading('agent')} — ${task}`,
    `${bundle.sources.length} sources | ${bundle.budget.used}/${bundle.budget.capacity} tokens | digest ${bundle.digest.slice(0, 16)}`,
    '',
    ...bundle.sources.map((s) => `SOURCE ${s.ref} lines ${s.lines[0]}-${s.lines[1]} (${s.estimatedTokens} tok) — ${s.reason}`),
    '',
    bundle.fragment || '',
  ];
  if (bundle.omissions.length) {
    lines.push('', 'Omitted:', ...bundle.omissions.slice(0, 10).map((o) => `  ${o.ref} — ${o.reason}`));
  }
  process.stdout.write(lines.join('\n') + '\n');
  return 0;
}

async function cmdRoute(positional, flags) {
  const { db } = openWorkspace();
  const task = positional.join(' ').trim();
  if (!task) { db.close(); return fail(2, 'usage: hq route <task>'); }
  const { routeTask } = await import('../lib/skills.mjs');
  const out = routeTask(db, { task, project: flags.project, limit: Number(flags.limit || 12) });
  db.close();
  const lines = [`Routing for "${task}"`, '', 'Mandatory:'];
  for (const row of out.mandatory) lines.push(`  ${row.path}  (${row.kind})  ${row.reason}`);
  if (!out.mandatory.length) lines.push('  (none)');
  lines.push('', 'Skills:');
  for (const row of out.skills) lines.push(`  ${row.name || row.path}  ${row.description || ''}`);
  if (!out.skills.length) lines.push('  (none)');
  if (out.boundaries.length) {
    lines.push('', 'Boundaries:');
    for (const b of out.boundaries) lines.push(`  - ${b}`);
  }
  emit(flags, out, lines.join('\n'));
  return 0;
}

async function cmdBrief(positional, flags) {
  const { root, config, db } = openWorkspace();
  const { brief } = await import('../lib/lake.mjs');
  const options = profileOptions(config, 'brief');
  let projects = projectsForIndex(root);
  if (flags.project) projects = projects.filter((p) => p.name === flags.project);
  const out = timeSync(db, { operation: 'brief', project: flags.project }, () => brief(db, {
    root, projects, audience: flags.audience || 'agent',
    maxBytes: Number(flags['max-bytes'] || (flags.audience === 'owner' ? 4000 : options.briefMaxBytes || 6000)),
  }));
  db.close();
  if (flags.json) { emit(flags, out.data ?? out, ''); return 0; }
  process.stdout.write((out.text || JSON.stringify(out.data, null, 2)) + '\n');
  return 0;
}

async function cmdHandoff(positional, flags) {
  const { root, db } = openWorkspace();
  const { brief } = await import('../lib/lake.mjs');
  const { queryCommits } = await import('../lib/lake.mjs');
  const { listNotes } = await import('../lib/memory.mjs');
  const { composeContext } = await import('../lib/context.mjs');
  const { dirtyFiles } = await import('../lib/git.mjs');

  let projects = projectsForIndex(root);
  if (flags.project) projects = projects.filter((p) => p.name === flags.project);
  const briefResult = brief(db, { root, projects, audience: flags.audience || 'agent', maxBytes: 6000 });
  const commits = queryCommits(db, { project: flags.project, limit: 15 });
  const notes = listNotes(db, { project: flags.project, limit: 20 });
  const task = (flags.task ? String(flags.task) : 'session handoff').trim();
  const bundle = await composeContext(db, { task, project: flags.project, budgetTokens: Number(flags.budget || 5000) });
  const dirty = [];
  for (const project of projects) {
    try { for (const file of dirtyFiles(project.path)) dirty.push({ project: project.name, ...file }); } catch { /* skip */ }
  }
  db.close();

  const handoff = {
    schema: 'hq.handoff/1',
    generatedAt: nowISO(),
    status: flags.status || 'in_progress',
    workspace: root,
    project: flags.project || null,
    task,
    summary: briefResult.data || null,
    recentCommits: commits,
    dirty,
    notes,
    context: {
      digest: bundle.digest,
      sources: bundle.sources,
      omissions: bundle.omissions,
      budget: bundle.budget,
    },
    nextActions: briefResult.data?.nextActions || [],
    questions: notes.filter((n) => /question|open|unclear/i.test(n.text)).map((n) => n.text),
  };

  const outPath = flags.out
    ? resolve(String(flags.out))
    : join(root, 'handoffs', `${nowISO().replace(/[:.]/g, '-')}${flags.project ? '-' + flags.project : ''}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const md = renderHandoffMarkdown(handoff);
  writeFileSync(outPath, md, 'utf8');
  writeFileSync(outPath.replace(/\.md$/, '.json'), canonicalJson(handoff), 'utf8');
  if (flags.json) { emit(flags, handoff, ''); return 0; }
  process.stdout.write(`Handoff written: ${outPath}\n\n${md}\n`);
  return 0;
}

function renderHandoffMarkdown(handoff) {
  const lines = [
    `# ${handoff.project ? handoff.project + ' — ' : ''}Session handoff`,
    '',
    `- Generated: ${handoff.generatedAt}`,
    `- Status: ${handoff.status}`,
    `- Task: ${handoff.task}`,
    `- Context digest: ${handoff.context.digest}`,
    '',
    '## Next actions',
    '',
    ...(handoff.nextActions.length ? handoff.nextActions.map((a) => `- ${a.title || a.reason || a.kind}`) : ['- (none)']),
    '',
    '## Recent commits',
    '',
    ...(handoff.recentCommits.length ? handoff.recentCommits.slice(0, 10).map((c) => `- ${c.date.slice(0, 10)} ${c.subject}`) : ['- (none)']),
    '',
    '## Changed files',
    '',
    ...(handoff.dirty.length ? handoff.dirty.slice(0, 30).map((f) => `- ${f.project}: ${f.path} (${f.status})`) : ['- (clean)']),
    '',
    '## Open questions',
    '',
    ...(handoff.questions.length ? handoff.questions.map((q) => `- ${q}`) : ['- (none)']),
    '',
    '## Context sources',
    '',
    ...handoff.context.sources.map((s) => `- ${s.ref} lines ${s.lines[0]}-${s.lines[1]} (${s.estimatedTokens} tok)`),
    '',
    '## Evidence',
    '',
    `- Sources: ${handoff.context.sources.length}`,
    `- Omissions: ${handoff.context.omissions.length}`,
    `- Budget: ${handoff.context.budget.used}/${handoff.context.budget.capacity} tokens`,
    '',
  ];
  return lines.join('\n');
}

async function cmdSince(positional, flags) {
  const { root, db } = openWorkspace();
  const ref = positional[0] || 'yesterday';
  const since = resolveSince(ref);
  const { queryCommits } = await import('../lib/lake.mjs');
  const commits = queryCommits(db, { project: flags.project, since, limit: Number(flags.limit || 50) });
  const { dirtyFiles } = await import('../lib/git.mjs');
  let projects = projectsForIndex(root);
  if (flags.project) projects = projects.filter((p) => p.name === flags.project);
  const dirty = [];
  for (const p of projects) {
    try { for (const f of dirtyFiles(p.path)) dirty.push({ project: p.name, ...f }); } catch { /* skip */ }
  }
  db.close();
  const out = { schema: 'hq.since/1', ref, since, commits, dirty };
  const lines = [`Changes since ${ref} (${since})`, '', `Commits: ${commits.length}`];
  for (const c of commits) lines.push(`  ${c.date.slice(0, 10)} ${c.project}  ${c.subject}`);
  lines.push('', `Dirty files: ${dirty.length}`);
  for (const f of dirty.slice(0, 30)) lines.push(`  ${f.project}: ${f.path} (${f.status})`);
  emit(flags, out, lines.join('\n'));
  return 0;
}

async function cmdNote(positional, flags) {
  const { db } = openWorkspace();
  const { addNote, listNotes, promoteNote, archiveNote } = await import('../lib/memory.mjs');
  const action = positional.shift() || 'list';
  try {
    if (action === 'add') {
      const text = (flags.text ? String(flags.text) : positional.join(' ')).trim();
      const note = addNote(db, {
        text, tier: flags.tier || 'now', project: flags.project, key: flags.key,
        origin: flags.origin || 'user', confidence: Number(flags.confidence || 1),
        evidence: flags.evidence ? String(flags.evidence).split(',').map((s) => s.trim()) : [],
      });
      emit(flags, note, `Saved to ${memoryTierLabel(note.tier)}: ${note.id}`);
      return 0;
    }
    if (action === 'promote') {
      const id = positional[0];
      if (!id || !flags.to) return fail(2, 'usage: hq note promote <id> --to <later|canon> [--owner-confirmed]');
      const note = promoteNote(db, { id, toTier: flags.to, confirmedByOwner: flags['owner-confirmed'] === true });
      emit(flags, note, `Promoted ${note.id} to ${memoryTierLabel(note.tier)}`);
      return 0;
    }
    if (action === 'archive') {
      const id = positional[0];
      if (!id) return fail(2, 'usage: hq note archive <id>');
      const ok = archiveNote(db, { id });
      emit(flags, { schema: 'hq.note/1', action: 'archive', id, ok }, ok ? `Archived ${id}` : `No note ${id}`);
      return ok ? 0 : 1;
    }
    if (action === 'export') {
      const notes = listNotes(db, { limit: 100000 });
      if (flags.out) { writeFileSync(resolve(String(flags.out)), canonicalJson(notes), 'utf8'); }
      emit(flags, notes, notes.map((n) => `${n.id}\t${memoryTierLabel(n.tier)}\t${n.text}`).join('\n'));
      return 0;
    }
    const notes = listNotes(db, { tier: flags.tier, project: flags.project, query: flags.query, limit: Number(flags.limit || 50) });
    emit(flags, notes, notes.length ? notes.map((n) => `${memoryTierLabel(n.tier)}\t${n.project || '-'}\t${n.text}`).join('\n') : 'No notes.');
    return 0;
  } finally {
    db.close();
  }
}

async function cmdRecall(positional, flags) {
  const { db } = openWorkspace();
  const query = positional.join(' ').trim();
  if (!query) { db.close(); return fail(2, 'usage: hq recall <query>'); }
  const { searchNotes } = await import('../lib/memory.mjs');
  const notes = searchNotes(db, { query, limit: Number(flags.limit || 20) });
  db.close();
  emit(flags, { schema: 'hq.recall/1', query, notes },
    notes.length ? notes.map((n) => `${memoryTierLabel(n.tier)}\t${n.project || '-'}\t${n.text}`).join('\n') : 'No matching notes.');
  return 0;
}

async function cmdTodos(positional, flags) {
  const { db } = openWorkspace();
  const rows = db.prepare(`
    SELECT a.line, a.kind, a.text, a.owner, f.path, p.name AS project
    FROM annotations a JOIN files f ON f.id = a.file_id JOIN projects p ON p.id = a.project_id
    WHERE a.kind = 'todo'
      AND (? IS NULL OR p.name = ?)
      AND (? IS NULL OR f.path LIKE ?)
    ORDER BY p.name, f.path, a.line
    LIMIT ?
  `).all(flags.project || null, flags.project || null, flags.path || null, flags.path ? `%${flags.path}%` : null, Number(flags.limit || 200));
  db.close();
  const lines = [`${rows.length} open tasks`];
  for (const row of rows) lines.push(`  ${row.project}/${row.path}:${row.line}  ${row.owner || 'unowned'}  ${row.text}`);
  emit(flags, { schema: 'hq.todos/1', todos: rows }, lines.join('\n'));
  return 0;
}

async function cmdLint(flags) {
  const { root, config, db } = openWorkspace();
  const { lintProtocol } = await import('../lib/protocol.mjs');
  const options = profileOptions(config, 'lint');
  let projects = projectsForIndex(root);
  if (flags.project) projects = projects.filter((p) => p.name === flags.project);
  const result = timeSync(db, { operation: 'lint', project: flags.project }, () => lintProtocol({
    db,
    root, projects, project: flags.project, changedOnly: flags.changed === true,
    maxFindings: Number(flags['max-findings'] || options.lintMaxFindings || 200),
  }));
  db.close();
  const total = result.summary.findings;
  const shown = result.summary.reported;
  const lines = [`Protocol lint: ${total} finding(s) across ${result.summary.files} file(s)`];
  if (shown < total) lines.push(`  showing ${shown} of ${total}`);
  for (const f of result.findings) lines.push(`  ${f.severity.toUpperCase()} ${f.provider || f.project}/${f.path}:${f.line} ${f.rule} — ${f.message}`);
  emit(flags, result, lines.join('\n'));
  return result.summary.bySeverity.error > 0 ? 1 : 0;
}

async function cmdVerify(flags) {
  const { root, config, db } = openWorkspace();
  const { lintProtocol } = await import('../lib/protocol.mjs');
  const options = profileOptions(config, 'lint');
  const projects = selectProjects(projectsForIndex(root), flags.project);
  if (!projects.length) {
    db.close();
    return fail(1, `no such space: ${flags.project}`);
  }
  const verifyStarted = performance.now();
  const lint = lintProtocol({
    db, root, projects,
    maxFindings: Number(flags['max-findings'] || options.lintMaxFindings || 200),
  });

  const stale = await collectStale({ db, config, projects, capOverride: flags['max-file-bytes'] });
  const out = {
    schema: 'hq.verify/1',
    ok: stale.length === 0 && lint.summary.bySeverity.error === 0,
    stale: stale.slice(0, 200), staleCount: stale.length,
    lint: lint.summary,
    findings: lint.findings.filter((f) => f.severity !== 'info').slice(0, 50),
  };
  recordTiming(db, {
    operation: 'verify', durationMs: performance.now() - verifyStarted, ok: out.ok,
    meta: { stale: out.staleCount, findings: lint.summary.findings },
  });
  db.close();
  const lines = [
    out.ok ? 'Verification passed.' : 'Verification failed.',
    `Stale files: ${out.staleCount}`,
    `Lint: ${lint.summary.findings} finding(s), ${lint.summary.bySeverity.error} error(s)`,
  ];
  for (const s of out.stale.slice(0, 20)) lines.push(`  ${s.reason}: ${s.project}/${s.path}`);
  emit(flags, out, lines.join('\n'));
  return out.ok ? 0 : 1;
}

async function cmdKg(positional, flags) {
  const sub = positional.shift();
  if (sub !== 'export' && sub !== 'sync') {
    emit(flags, { schema: 'hq.kg/1', commands: ['export', 'sync'] },
      'Usage: hq kg export [--out FILE] [--state FILE] [--no-state] | hq kg sync [--journal FILE]');
    return sub === undefined ? 0 : 2;
  }
  const { root, config, db } = openWorkspace();
  const kg = await import('../lib/kg-export.mjs');
  const outPath = resolve(String(flags.out ?? join(root, '.hq', 'kg-exchange.jsonl')));
  const statePath = flags['no-state'] ? null : resolve(String(flags.state ?? join(root, '.hq', 'kg-export-state.json')));
  const result = kg.exportGraphExchange({ db, outPath, statePath });
  db.close();
  if (sub === 'export') {
    emit(flags, { schema: 'hq.kg-export/1', ...result },
      `KG export: ${result.stats.nodes} nodes, ${result.stats.edges} edges, ${result.stats.tombstones} tombstones -> ${outPath} (state advances on ack)`);
    return 0;
  }
  // sync: export -> native import -> verified acknowledgment -> state advance.
  const journal = resolve(String(flags.journal ?? join(root, '.hq', 'kg-journal.hqj')));
  const probe = spawnSync('cargo', ['--version'], { encoding: 'utf8', windowsHide: true });
  if (probe.error || probe.status !== 0) {
    emit(flags, { schema: 'hq.kg-sync/1', ...result, imported: false, reason: 'cargo_unavailable' },
      `KG sync BLOCKED: cargo unavailable — exchange exported, state NOT advanced (tombstones preserved for retry)`);
    return 1;
  }
  const imp = spawnSync('cargo', ['run', '--quiet', '--features', 'importer', '--bin', 'hqkg-import', '--',
    journal, outPath], { cwd: resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'research', 'rust-knowledge-graph'), encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  const epochLine = (imp.stdout ?? '').split('\n').find((l) => l.startsWith('epoch before='));
  const statsLine = (imp.stdout ?? '').split('\n').find((l) => l.startsWith('node inserted='));
  const epochAfter = epochLine ? Number(/after=(\d+)/.exec(epochLine)?.[1]) : null;
  const epochBefore = epochLine ? Number(/before=(\d+)/.exec(epochLine)?.[1]) : null;
  // A no-op replay (nothing changed) legitimately reports no epoch advance;
  // failure is already covered by the importer's exit code.
  if (imp.status !== 0 || !epochLine || epochAfter == null || epochAfter < epochBefore) {
    emit(flags, { schema: 'hq.kg-sync/1', ...result, imported: false, reason: 'import_failed', importExit: imp.status,
      stderr: (imp.stderr ?? '').split('\n').slice(-3).join('\n') },
      `KG sync BLOCKED: importer exit ${imp.status} — state NOT advanced (tombstones preserved for retry)`);
    return 1;
  }
  const ack = statePath ? kg.acknowledgeGraphExport({ statePath, digest: result.digest, acknowledgment: { epochBefore, epochAfter, stats: statsLine } }) : { acked: false, reason: 'no_state_tracking' };
  emit(flags, { schema: 'hq.kg-sync/1', ...result, imported: true, epochBefore, epochAfter, ack },
    `KG sync: ${result.stats.nodes} nodes, ${result.stats.edges} edges, ${result.stats.tombstones} tombstones; epoch ${epochBefore}->${epochAfter}; state ${ack.acked ? 'advanced' : `NOT advanced (${ack.reason})`}`);
  return ack.acked || !statePath ? 0 : 1;
}

async function cmdWiki(positional, flags) {
  const sub = positional.shift();
  if (sub === 'program') return await cmdWikiProgram(positional, flags);
  const { root, config, db } = openWorkspace();
  const { buildWiki } = await import('../lib/wiki.mjs');
  const projects = projectsForIndex(root);
  const options = profileOptions(config, 'wiki');

  if (flags.check) {
    const tmp = mkdtempSync(join(tmpdir(), 'hq-wiki-check-'));
    // persistHashes: false — the check builds into a throwaway dir and must
    // not touch the wiki_pages hash cache (see buildWiki).
    const result = timeSync(db, { operation: 'wiki.check' }, () => buildWiki({ db, root, projects, outDir: tmp, force: true, maxFilePages: options.wikiMaxFilePages, persistHashes: false }));
    const diff = compareDirs(join(root, 'wiki'), tmp);
    db.close();
    rmSync(tmp, { recursive: true, force: true });
    const out = { schema: 'hq.wiki-check/1', current: diff.length === 0, changed: diff };
    emit(flags, out, diff.length === 0 ? 'Wiki is current.' : `Wiki is stale: ${diff.length} changed page(s)\n${diff.slice(0, 30).join('\n')}`);
    return diff.length === 0 ? 0 : 1;
  }

  const outDir = flags.out ? resolve(String(flags.out)) : join(root, 'wiki');
  // Hash-cache persistence and orphan cleanup belong to the canonical wiki
  // directory only; --out exports are read-only snapshots of the current
  // model and must never mutate the cache or delete pages.
  const persistHashes = outDir === join(root, 'wiki');
  // Optional graph read model: the published HQKGX1 exchange, so the wiki can name
  // the canonical graph node of a source file, a semantic identity and a command.
  const graphIndex = flags.graph
    ? (await import('../lib/wiki-runtime/graph-index.mjs')).buildGraphIndex(resolve(String(flags.graph)))
    : null;
  const result = timeSync(db, { operation: 'wiki' }, () => buildWiki({ db, root, projects, outDir, force: flags.force === true, maxFilePages: options.wikiMaxFilePages, graphIndex, persistHashes }));
  db.close();
  const removedNote = result.removed ? `, ${result.removed} removed` : '';
  emit(flags, { schema: 'hq.wiki/1', outDir, ...result },
    `Wiki: ${result.total} pages (${result.written} written, ${result.skipped} unchanged${removedNote}, ${formatBytes(result.bytes)}) -> ${outDir}`);
  return 0;
}

async function cmdAnnotateV2(positional, flags) {
  const { db } = openWorkspace();
  try {
    const target = positional.join(' ').trim();
    if (!target) return fail(2, 'usage: hq annotate-v2 <path> [--json]');
    const row = findFileRow(db, target, flags.project);
    if (!row) return fail(1, `file not found: ${target}`);
    const source = readFileSync(row.abs_path, 'utf8');
    const result = parseAnnotationV2(source, {
      path: row.path,
      projectId: row.project,
      contentHash: row.hash,
      schemaVersion: '2',
      registry: {
        lookup(id) {
          const r = getSemanticId(db, id);
          return r ? { id: r.id, status: r.status, kind: r.kind } : null;
        },
      },
    });
    const out = { schema: ANNOTATION_V2_SCHEMA, ...result };
    if (flags.json) { emit(flags, out, ''); return 0; }
    const lines = [
      `${row.project}/${row.path} — ${result.records.length} record(s), ${result.diagnostics.length} diagnostic(s)`,
      '',
      'Records:',
      ...(result.records.length ? result.records.map((r) => `  line ${r.line}  @hq:${r.kind}  ${r.value}`) : ['  (none)']),
      '',
      'Diagnostics:',
      ...(result.diagnostics.length ? result.diagnostics.map((d) => `  line ${d.line}  [${d.severity}] ${d.code}: ${d.message}`) : ['  (none)']),
    ];
    process.stdout.write(lines.join('\n') + '\n');
    return 0;
  } finally {
    db.close();
  }
}

async function cmdSemantic(positional, flags) {
  const { db } = openWorkspace();
  try {
    const action = positional.shift() || 'list';
    if (action === 'list') {
      const rows = listSemanticIds(db, {
        kind: flags.kind || null,
        status: flags.status || null,
        limit: Number(flags.limit || 100),
      });
      const out = { schema: SEMANTIC_REGISTRY_SCHEMA, action: 'list', semanticIds: rows };
      emit(flags, out, rows.length ? rows.map((r) => `${r.status}\t${r.kind}\t${r.id}\t${r.label || ''}`).join('\n') : 'No semantic IDs.');
      return 0;
    }
    if (action === 'show') {
      const id = positional[0];
      if (!id) return fail(2, 'usage: hq semantic show <id>');
      const row = getSemanticId(db, id);
      if (!row) return fail(1, `no semantic id ${id}`);
      const out = { schema: SEMANTIC_REGISTRY_SCHEMA, action: 'show', semanticId: row };
      emit(flags, out, [
        `${row.id}  ${row.kind}  ${row.status}  ${row.authority}`,
        `  label: ${row.label || '-'}  description: ${row.description || '-'}  provenance: ${row.provenance || '-'}  created: ${row.created_at}`,
      ].join('\n'));
      return 0;
    }
    if (action === 'drift') {
      const { root } = openWorkspace();
      const report = detectSemanticDrift(db, { root });
      const out = { schema: 'hq.semantic-drift/1', action: 'drift', checked: report.checked, drift: report };
      const lines = [`Drift checked ${report.checked} link(s)`];
      for (const row of report) {
        lines.push(`  ${row.id}  ${row.status}  ${row.exists ? 'exists' : 'missing'}  expected=${row.expectedDigest ? row.expectedDigest.slice(0, 12) : '-'}  actual=${row.actualDigest ? row.actualDigest.slice(0, 12) : '-'}`);
        if (row.reasons?.length) lines.push(`    reasons: ${row.reasons.join(', ')}`);
      }
      emit(flags, out, lines.join('\n'));
      return 0;
    }
    return fail(2, 'usage: hq semantic list [--kind K] [--status S] | hq semantic show <id> | hq semantic drift');
  } finally {
    db.close();
  }
}

async function cmdWikiProgram(positional, flags) {
  const { root, db } = openWorkspace();
  try {
    const action = positional.shift() || 'show';
    if (action === 'show') {
      const id = positional[0];
      if (!id) return fail(2, 'usage: hq wiki program show <id>');
      const active = getActiveProgram(db, id);
      if (!active) return fail(1, `no active program ${id}`);
      const out = { schema: WIKI_PROGRAM_SCHEMA, action: 'show', active };
      emit(flags, out, [
        `Program ${active.id} v${active.version} (revision ${active.revision})`,
        `  status: ${active.status}  owner-confirmed: ${active.ownerConfirmed}  created: ${active.createdAt}`,
        `  source: ${active.config && active.config.source ? active.config.source : '-'}  project: ${active.config && active.config.project ? active.config.project : '-'}`,
      ].join('\n'));
      return 0;
    }
    if (action === 'versions') {
      const id = positional[0];
      const rows = listProgramVersions(db, id ? { id } : {});
      const out = { schema: WIKI_PROGRAM_SCHEMA, action: 'versions', versions: rows };
      emit(flags, out, rows.length ? rows.map((r) => `v${r.version}  ${r.status}  rev ${r.revision}  owner-confirmed=${r.ownerConfirmed}  ${r.createdAt}`).join('\n') : 'No program versions.');
      return 0;
    }
    if (action === 'preview') {
      const file = positional[0];
      if (!file) return fail(2, 'usage: hq wiki program preview <json-file>');
      const config = JSON.parse(readFileSync(resolve(String(file)), 'utf8'));
      const result = previewProgram(db, config);
      const out = { schema: WIKI_PROGRAM_SCHEMA, action: 'preview', ...result };
      if (result.ok) emit(flags, out, `Preview OK — digest ${result.digest.slice(0, 16)}`);
      else emit(flags, out, `Preview invalid:\n${result.errors.map((e) => `  ${e.path} ${e.code}: ${e.message}`).join('\n')}`);
      return result.ok ? 0 : 1;
    }
    if (action === 'activate') {
      if (flags['owner-confirmed'] !== true) return fail(3, 'owner confirmation required: pass --owner-confirmed');
      const file = positional[0];
      if (!file) return fail(2, 'usage: hq wiki program activate <json-file> --owner-confirmed');
      const config = JSON.parse(readFileSync(resolve(String(file)), 'utf8'));
      const result = activateProgram(db, config, { ownerConfirmed: true, receipt: { kind: 'wiki-program', source: 'cli' } });
      if (!result.ok) {
        const extra = result.errors ? ' ' + result.errors.map((e) => e.message).join('; ') : '';
        return fail(1, `activate failed: ${result.reason}${extra}`);
      }
      const out = { schema: WIKI_PROGRAM_SCHEMA, action: 'activate', ...result };
      emit(flags, out, `Activated program ${result.id} v${result.version} (revision ${result.revision}, digest ${result.digest.slice(0, 16)})`);
      return 0;
    }
    if (action === 'rollback') {
      if (flags['owner-confirmed'] !== true) return fail(3, 'owner confirmation required: pass --owner-confirmed');
      const id = flags.id;
      const toVersion = flags['to-version'] != null ? Number(flags['to-version']) : null;
      if (!id || toVersion == null) return fail(2, 'usage: hq wiki program rollback --id <id> --to-version <n> --owner-confirmed');
      const result = rollbackProgram(db, { id, toVersion, ownerConfirmed: true, receipt: { kind: 'wiki-program', source: 'cli' } });
      if (!result.ok) return fail(1, `rollback failed: ${result.reason}`);
      const out = { schema: WIKI_PROGRAM_SCHEMA, action: 'rollback', ...result };
      emit(flags, out, `Rolled back ${result.id} to v${result.fromVersion} as v${result.version} (revision ${result.revision})`);
      return 0;
    }
    return fail(2, 'usage: hq wiki program show <id> | versions [id] | preview <json-file> | activate <json-file> --owner-confirmed | rollback --id <id> --to-version <n> --owner-confirmed');
  } finally {
    db.close();
  }
}

function walkFiles(dir, base = dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, base, acc);
    else acc.push(toPosix(relative(base, full)));
  }
  return acc;
}

function compareDirs(a, b) {
  const left = new Set(walkFiles(a));
  const right = new Set(walkFiles(b));
  const changed = [];
  for (const file of right) {
    if (!left.has(file)) { changed.push(`added ${file}`); continue; }
    if (readFileSync(join(a, file), 'utf8') !== readFileSync(join(b, file), 'utf8')) changed.push(`changed ${file}`);
  }
  for (const file of left) if (!right.has(file)) changed.push(`removed ${file}`);
  return changed.sort();
}

async function cmdHome(flags) {
  const { root, db } = openWorkspace();
  const { renderHome } = await import('../lib/home.mjs');
  const { brief } = await import('../lib/lake.mjs');
  const { queryCommits } = await import('../lib/lake.mjs');
  const { listNotes } = await import('../lib/memory.mjs');
  const projects = projectsForIndex(root);
  const rows = projectRows(db);
  const briefResult = brief(db, { root, projects, audience: 'owner', maxBytes: 4000 });
  const recent = queryCommits(db, { limit: 12 });
  const notes = listNotes(db, { limit: 20 });
  const cards = rows.map((p) => projectCard(db, p));
  const data = {
    workspace: { name: 'My World', root },
    projects: cards,
    brief: briefResult.data || {},
    recent,
    notes,
    generatedAt: nowISO(),
  };
  db.close();
  if (flags.json) { emit(flags, data, ''); return 0; }
  const html = renderHome(data);
  if (flags.write) {
    const out = flags.out ? resolve(String(flags.out)) : join(root, 'home.html');
    writeFileSync(out, html, 'utf8');
    process.stdout.write(`My World written: ${out} (${formatBytes(Buffer.byteLength(html, 'utf8'))})\n`);
    return 0;
  }
  process.stdout.write(html);
  return 0;
}

async function cmdAsk(positional, flags) {
  const { root, db } = openWorkspace();
  const askStarted = performance.now();
  const question = positional.join(' ').trim();
  if (!question) { db.close(); return fail(2, 'usage: hq ask <question>'); }
  const routing = routeAsk(question, { audience: flags.audience || 'owner' });
  let result = null;
  try {
    if (routing.command === 'brief') {
      const { brief } = await import('../lib/lake.mjs');
      result = brief(db, { root, projects: projectsForIndex(root), audience: flags.audience || 'owner', maxBytes: 4000 });
    } else if (routing.command === 'search') {
      const { searchContent } = await import('../lib/search.mjs');
      result = searchContent(db, { query: routing.args.query || question, limit: 12 });
    } else if (routing.command === 'find') {
      const { searchSymbols } = await import('../lib/search.mjs');
      result = searchSymbols(db, { query: routing.args.query || question, limit: 12 });
    } else if (routing.command === 'file') {
      const row = findFileRow(db, routing.args.path || question, flags.project);
      result = row ? { file: row } : { error: 'file_not_found' };
    } else if (routing.command === 'impact') {
      const { impact } = await import('../lib/graph.mjs');
      result = impact(db, { target: routing.args.target || question });
    } else if (routing.command === 'deps') {
      const { deps } = await import('../lib/graph.mjs');
      result = deps(db, { target: routing.args.target || question, reverse: true });
    } else if (routing.command === 'since') {
      const { queryCommits } = await import('../lib/lake.mjs');
      result = queryCommits(db, { since: resolveSince(routing.args.ref || 'yesterday'), limit: 30 });
    } else if (routing.command === 'recall') {
      const { searchNotes } = await import('../lib/memory.mjs');
      result = searchNotes(db, { query: routing.args.query || question });
    } else if (routing.command === 'note') {
      const { addNote } = await import('../lib/memory.mjs');
      result = addNote(db, { text: routing.args.text || question, tier: 'now' });
    }
  } catch (error) {
    result = { error: error.message };
  }
  recordTiming(db, {
    operation: 'ask', project: flags.project,
    durationMs: performance.now() - askStarted,
    ok: !result?.error,
    meta: { intent: routing.intent, command: routing.command },
  });
  db.close();
  const out = { schema: 'hq.ask/1', routing, result };
  if (flags.json) { emit(flags, out, ''); return 0; }
  const lines = [routing.explanation, '', `Intent: ${routing.intent} — ${routing.command} ${JSON.stringify(routing.args)}`];
  if (result?.text) lines.push('', result.text);
  else if (result?.results) {
    for (const hit of result.results.slice(0, 10)) lines.push(`  ${hit.project || ''}/${hit.path || hit.name}${hit.line ? ':' + hit.line : ''} ${hit.signature || hit.snippet || ''}`);
  } else if (result) lines.push('', JSON.stringify(result, null, 2).slice(0, 2000));
  process.stdout.write(lines.join('\n') + '\n');
  return 0;
}

async function cmdFeed(flags) {
  const { root, db } = openWorkspace();
  const { buildFeed, checkFeed } = await import('../lib/lake.mjs');
  const projects = projectsForIndex(root);
  const dir = join(root, 'feed');
  const jsonPath = join(dir, 'hq-feed.json');
  const mdPath = join(dir, 'HQ-FEED.md');

  if (flags.check) {
    if (!existsSync(jsonPath) || !existsSync(mdPath)) { db.close(); return fail(1, 'feed missing. Run: hq feed --write'); }
    const result = checkFeed(db, { root, projects, committedJson: readFileSync(jsonPath, 'utf8'), committedMarkdown: readFileSync(mdPath, 'utf8') });
    db.close();
    emit(flags, result, result.ok ? 'Feed is current.' : `Feed stale:\n${result.reasons.join('\n')}`);
    return result.ok ? 0 : 1;
  }
  if (!flags.write) { db.close(); return fail(2, 'usage: hq feed --write | --check'); }
  const { json, markdown } = buildFeed(db, { root, projects });
  mkdirSync(dir, { recursive: true });
  writeFileSync(jsonPath, json, 'utf8');
  writeFileSync(mdPath, markdown, 'utf8');
  db.close();
  emit(flags, { schema: 'hq.feed-write/1', json: jsonPath, markdown: mdPath, bytes: Buffer.byteLength(json, 'utf8') },
    `Feed written: ${jsonPath} (${formatBytes(Buffer.byteLength(json, 'utf8'))})`);
  return 0;
}

// --- Media Library (VIVIM torrent engine) ----------------------------------
// Owner surface for the wanted list, personal library, release tracker and
// the poll loop (hq/lib/torrent/*). Store lives outside the repo at
// C:/VIVIM/channel/vivim/torrent-store/. Poll default is plan-only: dispatch
// effects happen only with --limit N through the Studio magnet-click adapter.
const DEFAULT_MEDIA_STORE_DIR = 'C:/VIVIM/channel/vivim/torrent-store';

function mediaBackupDir() {
  return process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'qBittorrent', 'BT_backup') : null;
}

async function cmdMedia(positional, flags) {
  const action = positional[0] || 'status';
  const poll = await import('../lib/torrent/poll.mjs');
  const wantedLib = await import('../lib/torrent/wanted.mjs');
  const libraryLib = await import('../lib/torrent/library.mjs');
  const releasesLib = await import('../lib/torrent/releases.mjs');
  const storeDir = flags.store ? resolve(String(flags.store)) : DEFAULT_MEDIA_STORE_DIR;
  const paths = poll.storePaths(storeDir);

  if (action === 'status') {
    const wanted = wantedLib.loadWanted(paths.wanted);
    const library = libraryLib.listLibrary(paths.library);
    const favorites = libraryLib.listFavorites(paths.favorites);
    const releases = releasesLib.loadReleases(paths.releases);
    const journal = wantedLib.readJournal(paths.journal);
    const tail = journal.slice(-5).map((r) => {
      const who = r.id ? ` ${r.id}` : r.title ? ` ${r.title}` : '';
      return `  #${r.seq} ${r.at} ${r.kind}${who}`;
    });
    const text = [
      `My Media — store ${storeDir}`,
      `  tracked (wanted): ${wanted.entries.length}`,
      `  library: ${library.length} · favorites: ${favorites.length} · release rows: ${releases.entries.length}`,
      `  activity record: ${journal.length} rows`,
      ...(tail.length ? ['  latest activity:', ...tail] : []),
    ].join('\n');
    emit(flags, {
      schema: 'hq.media-status/1', storeDir,
      wanted: wanted.entries.length, library: library.length,
      favorites: favorites.length, releases: releases.entries.length, journal: journal.length,
    }, text);
    return 0;
  }

  if (action === 'wanted') {
    const wanted = wantedLib.loadWanted(paths.wanted);
    const favorites = new Set(libraryLib.listFavorites(paths.favorites).map((f) => f.id));
    const lines = wanted.entries.map((e) => {
      const last = e.lastDispatchedEpisode
        ? `S${String(e.lastDispatchedEpisode.season).padStart(2, '0')}E${String(e.lastDispatchedEpisode.episode).padStart(2, '0')}`
        : '—';
      const source = (e.provenance && e.provenance.source) || e.source;
      return `${favorites.has(e.id) ? '* ' : '  '}${e.id} · ${e.title}${e.season ? ` (S${String(e.season).padStart(2, '0')})` : ''} · last dispatched: ${last}${source ? ` · source: ${source}` : ''}`;
    });
    const text = [`My Media — tracked titles (${wanted.entries.length}):`, ...(lines.length ? lines : ['  (none — seed with seedWantedFromHistory or add on the owner surface)'])].join('\n');
    emit(flags, { schema: 'hq.media-wanted/1', count: wanted.entries.length, entries: wanted.entries }, text);
    return 0;
  }

  if (action === 'library') {
    const library = libraryLib.listLibrary(paths.library);
    const lines = library.map((r) => {
      const hash = r.infoHash ? ` · ${String(r.infoHash).slice(0, 12)}` : '';
      return `  ${r.id} · ${r.title} · ${r.state}${hash}${r.arrivedAt ? ` · arrived ${r.arrivedAt}` : ''}`;
    });
    const text = [`My Media — library (${library.length}):`, ...(lines.length ? lines : ['  (empty)'])].join('\n');
    emit(flags, { schema: 'hq.media-library/1', count: library.length, entries: library }, text);
    return 0;
  }

  if (action === 'releases') {
    const releases = releasesLib.loadReleases(paths.releases);
    const fmt = (ep) => (ep ? `S${String(ep.season).padStart(2, '0')}E${String(ep.number).padStart(2, '0')} @ ${ep.airstamp}` : '—');
    const lines = releases.entries.map((r) => {
      const note = r.error ? ` · error: ${r.error}` : r.reason ? ` · ${r.reason}` : '';
      return `  ${r.title} · next: ${fmt(r.next)} · latest aired: ${fmt(r.latestAired)}${note}`;
    });
    const text = [`My Media — next-episode tracker (${releases.entries.length}):`, ...(lines.length ? lines : ['  (no tracked shows yet — run: hq media poll)'])].join('\n');
    emit(flags, { schema: 'hq.media-releases/1', count: releases.entries.length, entries: releases.entries }, text);
    return 0;
  }

  if (action === 'poll') {
    const limit = Math.max(0, Math.floor(Number(flags.limit ?? 0) || 0));
    const port = Number(flags.port || 9222);
    let adapter = null;
    let adapterNote = null;
    try {
      const { createStudioMedia } = await import('../lib/torrent/dispatch-adapter.mjs');
      adapter = await createStudioMedia({ port });
    } catch (err) {
      adapterNote = `plan-only (no live adapter): ${err.message}`;
    }
    let summary;
    try {
      summary = await poll.runMediaPoll({
        storeDir,
        backupDir: mediaBackupDir(),
        releasesFetch: globalThis.fetch,
        searchFn: adapter ? adapter.searchFn : null,
        dispatchFn: adapter ? adapter.dispatchFn : null,
        limit,
      });
    } finally {
      if (adapter) adapter.close();
    }
    const text = [
      adapterNote ?? `adapter: Studio Chrome on 127.0.0.1:${port} (magnet-button dispatch)`,
      `Media poll ${limit > 0 ? `(--limit ${limit})` : '(plan-only — nothing dispatched)'}: planned ${summary.planned} · dispatched ${summary.dispatched} · arrivals ${summary.arrivals} · baselines set ${summary.baselinesSet} · release rows updated ${summary.releasesUpdated}`,
      ...(summary.errors.length
        ? [`errors (${summary.errors.length}):`, ...summary.errors.map((e) => `  - ${e}`)]
        : []),
    ].join('\n');
    emit(flags, { schema: 'hq.media-poll/1', limit, ...summary }, text);
    return summary.errors.length ? 1 : 0;
  }

  emit(flags, { ok: false, error: `unknown media action ${action}` }, 'usage: hq media status|wanted|library|releases|poll [--limit N]');
  return 2;
}

async function cmdVivim(positional, flags) {
  const { root, db } = openWorkspace();
  const vivim = await import('../lib/vivim.mjs');
  const projects = projectsForIndex(root);
  const action = positional[0] || 'status';
  try {
    if (action === 'sync') {
      const result = vivim.syncVivim(db, { root, projects });
      if (!result.ok) { emit(flags, result, `VIVIM sync failed: ${result.error}`); return 1; }
      const counts = result.counts;
      const crosswalk = result.crosswalk
        ? ` · crosswalk ${result.crosswalk.journeys} journey(s) -> ${result.crosswalk.capabilityLinks} capability / ${result.crosswalk.taskLinks} task link(s)`
        : '';
      const line = [
        `VIVIM space: ${result.space.name}`,
        `capabilities ${counts.capability} · requirements ${counts.requirement} · tasks ${counts.task}`,
        `journeys ${counts.journey} · gaps ${counts.gap} · goals ${counts.goal} · routes ${counts.route}${crosswalk}`,
        `digest ${String(result.digest).slice(0, 12)}`,
      ].join('\n');
      emit(flags, { schema: 'hq.vivim-sync/1', ...result }, line);
      return 0;
    }

    if (action === 'status') {
      const alignment = vivim.readAlignment(db, { detail: flags.full ? 'full' : 'summary' });
      const drift = vivim.alignmentDrift(db, { root, projects });
      if (!alignment) {
        const message = 'VIVIM feed not synced. Run: hq vivim sync';
        emit(flags, { schema: 'hq.vivim-status/1', synced: false, drift }, message);
        return 1;
      }
      const text = [
        vivim.alignmentMarkdown(alignment, { audience: flags.audience === 'owner' ? 'owner' : 'agent' }),
        `Synced: ${alignment.syncedAt} · digest ${String(alignment.digest).slice(0, 12)}`,
        `Local registries: ${drift.stale ? 'changed since sync' : 'match the feed'}`,
      ].join('\n');
      emit(flags, { schema: 'hq.vivim-status/1', synced: true, alignment, drift }, text);
      return drift.stale ? 1 : 0;
    }

    if (action === 'check') {
      const drift = vivim.alignmentDrift(db, { root, projects });
      const alignment = vivim.readAlignment(db, { detail: 'summary' });
      const reasons = [...drift.reasons];
      if (alignment) {
        // Alignment defects are as important as staleness: a capability that
        // points at a vanished task is a broken requirement chain.
        for (const ref of alignment.alignment.danglingRoadmapRefs) {
          reasons.push(`${ref.capability} links unknown task ${ref.task}`);
        }
      }
      const unique = [...new Set(reasons)].sort();
      const ok = unique.length === 0;
      emit(flags, { schema: 'hq.vivim-check/1', ok, stale: drift.stale, reasons: unique, counts: alignment ? alignment.counts : {} },
        ok ? 'VIVIM feed is current and aligned.' : `VIVIM feed needs attention:\n${unique.join('\n')}`);
      return ok ? 0 : 1;
    }

    if (action === 'explain') {
      const id = positional[1];
      if (!id) { emit(flags, { ok: false, error: 'usage: hq vivim explain <id>' }, 'usage: hq vivim explain <id>'); return 2; }
      if (!vivim.vivimTablesPresent(db)) { emit(flags, { ok: false, error: 'not synced' }, 'VIVIM feed not synced. Run: hq vivim sync'); return 1; }
      const explained = vivim.explainVivimRecord(db, { id });
      if (!explained || !explained.records.length) { emit(flags, { ok: false, error: `no record ${id}` }, `no record ${id}`); return 1; }
      const records = explained.records;
      const lines = [];
      for (const r of records) {
        lines.push(`${r.kind} ${r.id} — ${r.title || ''}${r.status ? ` [${r.status}]` : ''}${r.priority ? ` ${r.priority}` : ''}`);
        const record = r.record || {};
        for (const key of ['acceptance', 'requirement', 'spec', 'recommended_fix', 'release_gate', 'phase', 'source']) {
          if (record[key]) lines.push(`  ${key}: ${String(record[key]).slice(0, 240)}`);
        }
        if (r.links && r.links.length) lines.push(`  links: ${r.links.join(', ').slice(0, 240)}`);
        if (record.roadmap && record.roadmap.length) lines.push(`  roadmap: ${record.roadmap.join(', ').slice(0, 240)}`);
      }
      // Joined relationships: requirement <-> capability, journey <-> capability/task
      // (crosswalk edges), and capability -> indexed code (source files + symbols).
      const rel = explained.relationships;
      if (rel) {
        if (rel.requirements.length) lines.push(`  requirements: ${rel.requirements.join(', ').slice(0, 240)}`);
        if (rel.capabilities.length) lines.push(`  capabilities: ${rel.capabilities.join(', ').slice(0, 240)}`);
        if (rel.tasks.length) lines.push(`  tasks: ${rel.tasks.join(', ').slice(0, 240)}`);
        if (rel.journeys.length) {
          const shown = rel.journeys.slice(0, 6).map((j) => `${j.id}${j.stronger ? '*' : ''}`).join(', ');
          lines.push(`  journeys: ${shown}${rel.journeys.length > 6 ? ` (+${rel.journeys.length - 6} more)` : ''}${rel.journeys.some((j) => j.stronger) ? '  [* = stronger symbol candidate]' : ''}`);
        }
        if (rel.code) {
          const unresolved = rel.code.unresolved.length ? ` · ${rel.code.unresolved.length} unresolved` : '';
          lines.push(`  code: ${rel.code.files.length} indexed file(s)${rel.code.symbols.length ? ` · ${rel.code.symbols.length} verified symbol declaration(s)` : ''}${unresolved}`);
          for (const file of rel.code.files.slice(0, 8)) lines.push(`    ${file.path}  [${file.project}]`);
          if (rel.code.files.length > 8) lines.push(`    (+${rel.code.files.length - 8} more)`);
          for (const symbol of rel.code.symbols.slice(0, 8)) lines.push(`    ${symbol.name}  ${symbol.kind}  ${symbol.path}:${symbol.line ?? '?'}  [${symbol.project}]`);
          if (rel.code.symbols.length > 8) lines.push(`    (+${rel.code.symbols.length - 8} more)`);
        }
      }
      emit(flags, { schema: explained.schema, id, records, relationships: rel }, lines.join('\n'));
      return 0;
    }

    emit(flags, { ok: false, error: `unknown vivim action ${action}` }, 'usage: hq vivim sync|status|check|explain <id>');
    return 2;
  } finally {
    db.close();
  }
}

function safeJson(text) {
  if (text == null) return null;
  try { return JSON.parse(text); } catch { return null; }
}

// ---------------------------------------------------------------------------
// hq kb — the KB intake seam and the unified KB read model.
// The intake is a projection: an incoming KB package is evidence, never
// authority. Decisions land proposed, CANON terms land provisional.
// ---------------------------------------------------------------------------

function kbUsage() {
  return `hq kb — knowledge base intake and unified read model

Intake (a VIVIM KB package into HQ)
  hq kb intake <dir> [--project N] [--dry-run]   Classify, record and refuse one package
  hq kb status                                     Last recorded package
  hq kb verify <dir>                               Compare a package with what HQ holds

Read model (docs, decisions, terms, sessions, notes, wiki, capabilities, VIVIM records)
  hq kb health                                     Counts, stale evidence, orphans
  hq kb query <text> [--kind K] [--project N]      Unified query
  hq kb graph [--project N] [--depth N]            Node graph
  hq kb remember <text> [--tier now|later]         Save a note through the KB API

Options
  --json        Machine-readable output
  --dry-run     Report what would change; write nothing

An incoming KB is evidence, never authority: decisions land proposed, CANON
terms land provisional. See docs/KB-LINK.md and docs/VIVIM-KB-INTAKE.md.
`;
}

// A package directory, read the way the intake reads it: manifest.json plus
// every other file, keyed by its package-relative POSIX path.
function readKbPackageDir(dir) {
  const abs = resolve(String(dir));
  const manifestPath = join(abs, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return { error: `package: manifest.json is missing in ${abs}` };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return { error: `package: manifest.json is not valid JSON (${error instanceof Error ? error.message : String(error)})` };
  }
  const files = [];
  const walk = (current, prefix) => {
    let entries;
    try { entries = readdirSync(current, { withFileTypes: true }); } catch { return; }
    for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) { walk(join(current, entry.name), rel); continue; }
      if (!entry.isFile()) continue;
      if (rel === 'manifest.json') continue;
      try {
        files.push({ path: toPosix(rel), bytes: readFileSync(join(current, entry.name)) });
      } catch (error) {
        return;
      }
    }
  };
  walk(abs, '');
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { manifest, files };
}

async function cmdCapabilities(positional, flags) {
  const action = positional.shift() || 'status';
  const { db } = openWorkspace();
  try {
    if (action === 'scan') {
      const target = positional[0];
      if (!target) return fail(2, 'usage: hq capabilities scan <dir> [--id N] [--project P]');
      const scan = scanCapabilitySource(resolve(String(target)), { id: flags.id || null, project: flags.project || null });
      const result = persistCapabilityScan(db, scan);
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'scan', ...result, source: scan.source, stats: scan.stats };
      emit(flags, out, [
        `Scanned ${result.sourceId}`,
        `  packages ${result.packages} · dependencies ${result.dependencies} · files ${result.files} · documents ${result.documents}`,
        `  evidence ${result.evidence} · mappings ${result.maps} · contracts ${result.contracts}`,
        `  digest ${result.digest.slice(0, 16)}`,
      ].join('\n'));
      return 0;
    }
    if (action === 'status') {
      const status = capabilityStatus(db);
      const sources = listCapabilitySources(db);
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'status', ...status, sources };
      const lines = [`Capability registry — ${status.sources} source(s)`];
      for (const s of sources) lines.push(`  ${s.id}  ${s.packageCount} packages · ${s.fileCount} files · ${s.documentCount} docs · ${s.digest.slice(0, 12)}  [${s.status}]`);
      lines.push(`  contracts ${status.counts.contracts} · proposed ${status.counts.proposed} · approved ${status.counts.approved}`);
      emit(flags, out, lines.join('\n'));
      return 0;
    }
    if (action === 'packages') {
      const rows = listCapabilityPackages(db, { query: positional[0] || null, limit: flags.limit });
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'packages', packages: rows };
      emit(flags, out, rows.map((r) => `${r.name}@${r.version}\t${r.license || '?'}\t${r.fileCount}f\t${r.installPath}`).join('\n') || 'No packages.');
      return 0;
    }
    if (action === 'package') {
      const name = positional[0];
      if (!name) return fail(2, 'usage: hq capabilities package <name> [--source ID]');
      const row = getCapabilityPackage(db, { sourceId: flags.source || null, name });
      if (!row) return fail(1, `no package ${name}`);
      const docs = db.prepare('SELECT COUNT(*) AS n FROM capability_document WHERE source_id = ? AND install_path = ?').get(row.source_id, row.install_path).n;
      const maps = db.prepare('SELECT node_id, score, reasons FROM capability_map WHERE source_id = ? AND install_path = ? ORDER BY score DESC').all(row.source_id, row.install_path);
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'package', package: row, documentCount: docs, maps };
      emit(flags, out, [
        `${row.name}@${row.version}  ${row.license || '?'}  [candidate]`,
        `  path ${row.install_path}`,
        `  ${row.description || ''}`,
        `  main ${row.main || '-'}  bin ${row.bin || '-'}  files ${row.file_count}  bytes ${row.bytes}  deps ${row.dep_count}  manifest fields ${row.manifest_fields}`,
        `  documents ${docs}`,
        ...(maps.length ? ['  candidate capabilities:', ...maps.map((m) => `    ${m.node_id}  ${m.score}  ${m.reasons}`)] : ['  candidate capabilities: none']),
      ].join('\n'));
      return 0;
    }
    if (action === 'nodes') {
      const rows = listCapabilityNodes(db, { domain: flags.domain || null });
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'nodes', nodes: rows };
      emit(flags, out, rows.map((r) => `${r.id}\t${r.domain}\t${r.name}`).join('\n') || 'No taxonomy nodes.');
      return 0;
    }
    if (action === 'map') {
      const rows = listCapabilityMaps(db, { nodeId: flags.node || null, limit: flags.limit });
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'map', mappings: rows };
      emit(flags, out, rows.map((r) => `${r.nodeId}\t${r.name}@${r.version}\t${r.score}\t${r.reasons}`).join('\n') || 'No candidate mappings.');
      return 0;
    }
    if (action === 'contracts') {
      const rows = listCapabilityContracts(db, { status: flags.status || null });
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'contracts', contracts: rows };
      emit(flags, out, rows.map((r) => `${r.id} v${r.version}\t${r.status}\towner_confirmed=${r.owner_confirmed}\t${r.node_id}\teffects=${r.effects.join(',') || 'none'}`).join('\n') || 'No contracts.');
      return 0;
    }
    if (action === 'contract') {
      const id = positional[0];
      if (!id) return fail(2, 'usage: hq capabilities contract <id> [--version N]');
      const row = getCapabilityContract(db, { id, version: flags.version || null });
      if (!row) return fail(1, `no contract ${id}`);
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'contract', contract: row };
      emit(flags, out, [
        `${row.id} v${row.version}  ${row.status}  owner_confirmed=${row.owner_confirmed}`,
        `  node ${row.node_id}  source ${row.source_id || '-'}  package ${row.install_path || '-'}`,
        `  ${row.title}`,
        `  effects ${row.effects.join(',') || 'none'}  scopes ${row.scopes.join(',') || 'none'}`,
        `  verification ${row.verification || '-'}`,
      ].join('\n'));
      return 0;
    }
    if (action === 'search') {
      const query = positional.join(' ').trim();
      if (!query) return fail(2, 'usage: hq capabilities search <query> [--limit N]');
      const rows = searchCapabilityDocuments(db, { query, limit: flags.limit });
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'search', query, results: rows };
      emit(flags, out, rows.map((r) => `${r.path}\t${r.kind}\t${r.title}\n  ${String(r.snippet || '').replace(/\s+/g, ' ').slice(0, 200)}`).join('\n') || 'No capability documents matched.');
      return 0;
    }
    if (action === 'export') {
      if (flags.schema) {
        const result = writeCapabilitySchema(resolve(String(flags.schema)));
        emit(flags, { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'export', kind: 'schema', ...result }, `Wrote schema ${result.path} (${result.bytes} bytes)`);
        return 0;
      }
      if (flags.sqlite) {
        const result = exportCapabilitySqlite(db, { path: resolve(String(flags.sqlite)), sourceId: flags.source || null });
        emit(flags, { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'export', kind: 'sqlite', ...result }, `Wrote ${result.path} (${result.packages} packages, ${result.documents} documents)`);
        return 0;
      }
      const out = { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'export', kind: 'json', ...exportCapabilityJson(db, { sourceId: flags.source || null }) };
      if (flags.out) {
        writeFileSync(resolve(String(flags.out)), JSON.stringify(out, null, 2) + '\n', 'utf8');
        emit(flags, { schema: CAPABILITY_REGISTRY_SCHEMA, action: 'export', kind: 'json', path: resolve(String(flags.out)) }, `Wrote ${resolve(String(flags.out))}`);
        return 0;
      }
      emit(flags, out, `packages ${out.packages.length} · files ${out.files.length} · documents ${out.documents.length} · contracts ${out.contracts.length}`);
      return 0;
    }
    return fail(2, 'usage: hq capabilities scan|status|packages|package|nodes|map|contracts|contract|search|export');
  } finally {
    db.close();
  }
}

function sessionsUsage() {
  return [
    'hq sessions — absorbed OpenCode session exports',
    '',
    '  hq sessions import <dir>          Absorb exported session files into HQ',
    '  hq sessions list [--project N]    Sessions with counts, tools, cost',
    '  hq sessions list --asks           Include the first ask and last reply',
    '  hq sessions show <id>             One session in full',
    '  hq sessions timeline              Per-day session/message/tool/cost buckets',
    '  hq sessions tools                 Tool usage across every session',
    '',
    'Flags: --json, --project <name>, --query <text>, --limit <n>',
  ].join('\n');
}

async function cmdSessions(positional, flags) {
  const action = positional.shift() || 'list';
  if (action === 'help') { process.stdout.write(sessionsUsage()); return 0; }

  const { root, db } = openWorkspace();
  try {
    if (action === 'import') {
      const dir = positional[0];
      const usage = 'usage: hq sessions import <dir> [--project <name>] [--limit n]';
      if (!dir) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      let importSessionDirectory;
      try {
        ({ importSessionDirectory } = await import('../lib/session-import.mjs'));
      } catch (error) {
        return fail(1, `session importer unavailable: ${error.message}`);
      }
      const report = importSessionDirectory(db, resolve(String(dir)), {
        project: flags.project || null,
        limit: Number(flags.limit || 0),
      });
      const lines = [
        `Session intake: ${report.sessions} session(s) from ${report.files} file(s)`,
        `Messages ${report.messages} · parts ${report.parts} · inserted ${report.inserted} · skipped ${report.skipped}`,
      ];
      for (const error of (report.errors ?? []).slice(0, 20)) lines.push(`  ${error.file}: ${error.error}`);
      if ((report.errors ?? []).length > 20) lines.push(`  … ${report.errors.length - 20} more`);
      emit(flags, { schema: 'hq.session-import/1', ...report }, lines.join('\n'));
      return (report.errors ?? []).length ? 1 : 0;
    }

    if (action === 'list') {
      const rows = sessionRows(db, {
        project: flags.project || null,
        query: flags.query || null,
        limit: Number(flags.limit || 50),
      });
      const out = { schema: SESSION_VIEWS_SCHEMA, count: rows.length, sessions: rows };
      emit(flags, out, renderSessionsText(rows, { showAsks: flags.asks === true }));
      return 0;
    }

    if (action === 'show') {
      const id = positional[0];
      if (!id) { const usage = 'usage: hq sessions show <id>'; emit(flags, { ok: false, error: usage }, usage); return 2; }
      const detail = sessionDetail(db, { id });
      if (!detail) return fail(1, `no session "${id}"`);
      const lines = [
        `${detail.title}`,
        `id ${detail.id} · project ${detail.project ?? '-'} · agent ${detail.agent ?? '-'} · model ${detail.model ?? '-'}`,
        `created ${detail.createdAt ?? '-'} · updated ${detail.updatedAt ?? '-'} · source ${detail.source ?? '-'}`,
        `messages ${detail.messageCount} · parts ${detail.partCount} · tool calls ${detail.toolCallCount} · cost $${(detail.cost ?? 0).toFixed(3)}`,
        `tools: ${detail.tools.join(', ') || 'none'}`,
      ];
      if (detail.files.length) lines.push(`files: ${detail.files.map((f) => f.path).join(', ')}`);
      if (detail.ask) lines.push('', 'ask:', detail.ask);
      if (detail.lastReply) lines.push('', 'last reply:', detail.lastReply);
      emit(flags, { schema: 'hq.session-detail/1', ...detail }, lines.join('\n'));
      return 0;
    }

    if (action === 'timeline') {
      const days = sessionTimeline(db, { limit: Number(flags.limit || 30) });
      const out = { schema: 'hq.session-timeline/1', days };
      const lines = days.length
        ? days.map((d) => `${d.day}  ${String(d.sessions).padStart(3)} sessions  ${String(d.messages).padStart(5)} msg  ${String(d.toolCalls).padStart(5)} tools  $${d.cost.toFixed(3)}`)
        : ['No sessions ingested yet. Run: hq sessions import <dir>'];
      emit(flags, out, lines.join('\n'));
      return 0;
    }

    if (action === 'tools') {
      const usage = toolUsage(db);
      const out = { schema: 'hq.session-tools/1', tools: usage };
      const lines = usage.length
        ? usage.map((t) => `${String(t.calls).padStart(6)}  ${String(t.sessions).padStart(3)} sessions  ${t.name}`)
        : ['No tool calls recorded.'];
      emit(flags, out, lines.join('\n'));
      return 0;
    }

    return fail(2, 'usage: hq sessions import|list|show|timeline|tools');
  } finally {
    db.close();
  }
}


// One view of the whole team: definitions, seats, live sessions, tasks, provider health and
// the next moves worth taking. This is the management roof; `hq comms` is the transport roof
// and costs about five seconds because it probes the channels a message has to travel.
async function cmdTeam(positional, flags) {
  const usage = 'usage: hq team [--json] [--verbose] [--write-state] [--state-file <path>] [--agents-dir <dir>] [--channel-root <dir>]';
  try {
    const snapshot = buildTeamSnapshot({
      agentsDir: flags['agents-dir'] || undefined,
      channelRoot: flags['channel-root'] || undefined,
      liveWindowMinutes: Number(flags['live-minutes'] || 30),
    });
    if (flags['write-state']) {
      const out = flags['state-file'] || 'C:/VIVIM/channel/team-state.json';
      writeStateCache(snapshot, out);
      process.stderr.write(`wrote ${out}\n`);
    }
    emit(flags, snapshot, renderPanel(snapshot, { verbose: !!flags.verbose }).join('\n'));
    return 0;
  } catch (e) {
    return fail(2, e.message);
  }
}

// The inline canvas: one conversation message that renders the live team state. The file is a
// fragment, not a document, so the host can replace the element whose id is hq-canvas in place.
// The last line is the host reference marker; `--no-ref` suppresses it.
async function cmdCanvas(positional, flags) {
  const usage = 'usage: hq canvas [--out <dir>] [--json] [--no-ref] [--agents-dir <dir>]';
  try {
    const { buildCanvasModel, renderCanvasFragment } = await import('../lib/canvas.mjs');
    const snapshot = buildTeamSnapshot({
      agentsDir: typeof flags['agents-dir'] === 'string' ? flags['agents-dir'] : undefined,
    });
    const model = buildCanvasModel({ snapshot });
    const html = renderCanvasFragment(model);
    const outDir = resolve(typeof flags.out === 'string' ? flags.out : '.hq/canvas');
    mkdirSync(outDir, { recursive: true });
    const outPath = toPosix(join(outDir, 'hq-canvas.html'));
    writeFileSync(outPath, html, 'utf8');
    const bytes = Buffer.byteLength(html, 'utf8');
    if (flags.json) {
      emit(flags, { path: outPath, bytes, model }, '');
      return 0;
    }
    const seatCount = model.seats === null ? '?' : model.seats.length;
    const providerCount = model.providers === null ? '?' : model.providers.length;
    const lines = [
      `canvas: ${outPath} (${formatBytes(bytes)})`,
      model.verdict.text,
      `seats ${seatCount} · providers ${providerCount} · blocked ${model.blocked.length} · notes ${model.notes.length} — regenerate: bun hq/bin/hq.mjs canvas`,
    ];
    emit(flags, { path: outPath, bytes, model }, lines.join('\n'));
    if (!flags['no-ref']) process.stdout.write(`::visualize${JSON.stringify({ path: outPath })}\n`);
    return 0;
  } catch (e) {
    return fail(2, e.message);
  }
}

// The program-management spine: one portfolio over the qeue register, the L0 initiative register and
// the live task queue. Read-only: it writes one fragment file and, unless --no-ref, prints the host
// reference marker as its last line.
async function cmdPm(positional, flags) {
  const usage = 'usage: hq pm [--json] [--out <dir>] [--no-ref] [--qeue-dir <dir>] [--initiatives <file>] [--tasks-file <file>]';
  try {
    const { buildPortfolio, renderPortfolioFragment } = await import('../lib/pmo.mjs');
    const readIfPresent = (file) => {
      try {
        return existsSync(file) ? readFileSync(file, 'utf8') : null;
      } catch {
        return null;
      }
    };
    const qeueDir = resolve(typeof flags['qeue-dir'] === 'string' ? flags['qeue-dir'] : 'qeue');
    const initiativesFile = resolve(typeof flags.initiatives === 'string' ? flags.initiatives : 'docs/integration/STRATEGIC-INITIATIVES.md');
    const tasksFile = resolve(typeof flags['tasks-file'] === 'string' ? flags['tasks-file'] : 'C:/VIVIM/channel/tasks/active-tasks.md');
    const model = buildPortfolio({
      qeueDir,
      initiativesText: readIfPresent(initiativesFile),
      tasksText: readIfPresent(tasksFile),
      now: Date.now(),
    });
    const html = renderPortfolioFragment(model);
    const outDir = resolve(typeof flags.out === 'string' ? flags.out : '.hq/canvas');
    mkdirSync(outDir, { recursive: true });
    const outPath = toPosix(join(outDir, 'hq-pm.html'));
    writeFileSync(outPath, html, 'utf8');
    const bytes = Buffer.byteLength(html, 'utf8');
    if (flags.json) {
      emit(flags, { path: outPath, bytes, model }, '');
      return 0;
    }
    const lines = [
      `pm: ${outPath} (${formatBytes(bytes)})`,
      model.verdict.text,
      `lanes ${model.lanes.length} · initiatives ${model.initiatives.length} · decisions ${model.decisions.length} · notes ${model.notes.length} — regenerate: bun hq/bin/hq.mjs pm`,
    ];
    emit(flags, { path: outPath, bytes, model }, lines.join('\n'));
    if (!flags['no-ref']) process.stdout.write(`::visualize${JSON.stringify({ path: outPath })}\n`);
    return 0;
  } catch (e) {
    return fail(2, e.message);
  }
}

// Budget-aware model routing. It proposes; it never writes, unless --apply is given and even
// then it only rewrites the `model:` line of one agent definition, after a backup.
async function cmdRouteModel(positional, flags) {
  const usage = 'usage: hq route-model [--json] [--apply] [--agents-dir <dir>] [--policy <file>] [--hours <n>]';
  try {
    const { Database } = await import('bun:sqlite');
    const home = process.env.USERPROFILE || process.env.HOME || '';
    const dbPath = join(home, '.zcode', 'cli', 'db', 'db.sqlite');
    const hours = Number(flags.hours || 5);
    const now = Date.now();
    const windowMs = hours * 60 * 60 * 1000;

    let usageRows = [];
    let db;
    try {
      db = new Database(dbPath, { readonly: true });
      usageRows = db.query('SELECT provider_id, model_id, status, started_at, duration_ms, input_tokens, output_tokens, error_type, error_code, error_message FROM model_usage WHERE started_at > ?').all(now - windowMs);
    } catch (e) {
      usageRows = [];
    } finally {
      try { db?.close(); } catch { /* ignore */ }
    }
    const stats = summarizeUsage(usageRows, { now, windowMs });

    let depotCatalog = null;
    const catalogPath = join(home, '.zcode', 'provider-depot', 'catalog.json');
    try { depotCatalog = JSON.parse(readFileSync(catalogPath, 'utf8')); } catch { depotCatalog = null; }
    const catalog = buildCatalog({ depotCatalog, observed: [...stats.keys()] });

    const agentsDir = flags['agents-dir'] || join(home, '.zcode', 'agents');
    const files = collectAgentFiles(agentsDir);
    const agents = files.map((f) => {
      const a = parseAgentFile(f.text, f.file);
      return { name: a.name || f.file.replace(/\.md$/, ''), model: a.model || 'inherit', thoughtLevel: a.thoughtLevel || null, file: f.file, path: join(agentsDir, f.file) };
    });

    let policy = { ...DEFAULT_POLICY };
    // The owner's routing decision lives in the repo, not in a shell history: a bare
    // `hq route-model` proposes what the workspace decided, and `--policy` still overrides it.
    const defaultPolicyPath = join(dirname(dirname(fileURLToPath(import.meta.url))), 'config', 'model-routing.policy.json');
    const policyPath = flags.policy ? String(flags.policy) : (existsSync(defaultPolicyPath) ? defaultPolicyPath : null);
    if (policyPath) {
      try { policy = { ...policy, ...JSON.parse(readFileSync(policyPath, 'utf8')) }; } catch (e) { return fail(2, `policy file: ${e.message}`); }
    }
    // The CLI's own provider registry is the only place that says which reasoning levels a model
    // accepts. It is ground truth, so the router reads it instead of guessing a level and
    // discovering the refusal by spawning an agent that cannot start.
    try {
      const providerConfigPath = join(home, '.zcode', 'v2', 'provider_config.json');
      const providerConfig = JSON.parse(readFileSync(providerConfigPath, 'utf8'));
      policy.declaredLevels = readDeclaredReasoningLevels(providerConfig);
    } catch { policy.declaredLevels = new Map(); }
    let budgetStatus = {};
    let budgetSummary = { funded: 0, warn: 0, blocked: 0 };
    try {
      const { budgetStatusFromUsage, summarizeBudget } = await import('../lib/model-budget.mjs');
      budgetStatus = budgetStatusFromUsage(usageRows, Object.fromEntries(catalog));
      budgetSummary = summarizeBudget(budgetStatus);
    } catch {
      budgetStatus = {};
      budgetSummary = { funded: 0, warn: 0, blocked: 0 };
    }

    const apply = shouldApply(flags);
    const plan = planRoutes({ agents, usage: usageRows, catalog: Object.fromEntries(catalog), policy, now, budgetStatus });

    const applied = [];
    if (apply) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      for (const route of plan.routes) {
        const agent = agents.find((a) => a.name === route.agent);
        if (!agent) continue;
        const before = readFileSync(agent.path, 'utf8');
        copyFileSync(agent.path, `${agent.path}.bak-route-${stamp}`);
        // The reasoning level is part of the route. A model without its level is a half-applied
        // route: the model changed but the pair the provider refuses may still be in the file.
        let after = before.replace(/^model:\s*.*$/m, `model: ${route.to}`);
        if (route.thoughtLevel) {
          if (/^thoughtLevel:\s*.*$/m.test(after)) after = after.replace(/^thoughtLevel:\s*.*$/m, `thoughtLevel: ${route.thoughtLevel}`);
          else after = after.replace(/^(model:\s*.*)$/m, `$1\nthoughtLevel: ${route.thoughtLevel}`);
        }
        if (after !== before) {
          writeFileSync(agent.path, after, 'utf8');
          applied.push({ agent: route.agent, from: route.from, to: route.to, thoughtLevel: route.thoughtLevel ?? null });
        }
      }
    }

    const lines = [];
    lines.push(`BUDGET ${budgetSummary.funded} funded · ${budgetSummary.warn} warn · ${budgetSummary.blocked} blocked`);
    const dead = [];
    for (const [key, rec] of stats) {
      const health = classifyHealth(rec);
      if (health.state === 'budget-blocked' || health.state === 'capped') dead.push(`${key} (${health.state}: ${health.reasons[0]})`);
    }
    if (dead.length) {
      lines.push('DO NOT USE — credit or cap is exhausted. Switch the chat off these in the model picker; a running turn cannot switch itself:');
      for (const d of dead) lines.push(`  ${d}`);
      lines.push('');
    }
    // Group identical destinations: thirty agents on one route is one decision, not thirty.
    const groups = new Map();
    for (const r of plan.routes) {
      const g = groups.get(r.to) || { to: r.to, reason: r.reason, thoughtLevel: r.thoughtLevel ?? null, agents: [], from: new Set(), saving: 0 };
      g.agents.push(r.agent);
      g.from.add(r.from);
      g.saving += r.expectedSavingUsd || 0;
      groups.set(r.to, g);
    }
    lines.push(`ROUTE MODEL  ${plan.routes.length} route(s) in ${groups.size} group(s), ${plan.skipped.length} skipped, window ${hours}h`);
    lines.push('');
    for (const g of groups.values()) {
      lines.push(`  -> ${g.to}${g.thoughtLevel ? `  [think=${g.thoughtLevel}]` : ''}   (${g.agents.length} agent${g.agents.length === 1 ? '' : 's'})`);
      lines.push(`     from: ${[...g.from].join(', ')}`);
      lines.push(`     why:  ${g.reason.replace(/\s+—\s+rejected cheaper option.*$/, '')}`);
      const rejected = g.reason.match(/rejected cheaper option (.*)$/);
      if (rejected) lines.push(`     beat: ${rejected[1]}`);
      if (g.saving > 0) lines.push(`     saves ~$${g.saving.toFixed(4)} per call across the group`);
      if (g.agents.length > 5) {
        lines.push(`     WARNING: ${g.agents.length} agents on one model is a single point of failure —`);
        lines.push(`              five lanes once died together on one capped free model. Split them.`);
      }
      lines.push(`     agents: ${g.agents.join(', ')}`);
      lines.push('');
    }
    if (!plan.routes.length) lines.push('  (no route change proposed)');
    lines.push('SKIPPED');
    const skipReasons = new Map();
    for (const s of plan.skipped) {
      const list = skipReasons.get(s.reason) || [];
      list.push(s.agent);
      skipReasons.set(s.reason, list);
    }
    for (const [reason, agents] of skipReasons) {
      lines.push(`  ${agents.length} x ${reason}`);
      if (agents.length <= 6) lines.push(`        ${agents.join(', ')}`);
    }
    if (applied.length) {
      lines.push('');
      lines.push(`APPLIED ${applied.length} pin(s):`);
      for (const a of applied) lines.push(`  ${a.agent}: ${a.from} -> ${a.to}`);
    } else if (flags.apply) {
      lines.push('');
      lines.push('APPLIED nothing (no route was approved).');
    }
    emit(flags, { ...plan, applied, catalogSize: catalog.size, observed: [...stats.keys()] }, lines.join('\n'));
    return 0;
  } catch (e) {
    return fail(2, e.message);
  }
}

// A channel seat is a live ZCode session, not an agent type: to move one you
// send into its session over ACP. This command is the manager's only hand on
// that surface, and it refuses before the transport rather than after.
async function cmdSeat(positional, flags) {
  const action = positional.shift() || 'list';
  const root = String(flags.root || process.env.HQ_CHANNEL_ROOT || DEFAULT_CHANNEL_ROOT);
  const idleMinutes = Number(flags['idle-minutes'] || DEFAULT_IDLE_MINUTES);
  const usage = [
    'usage:',
    '  hq seat list [--root <dir>] [--idle-minutes <n>]',
    '  hq seat wake <seat> --prompt "<slice>" [--force] [--dry-run] [--wait <sec>] [--reason "<why>"]',
    '  hq seat verify <seat> [--id <wake-id>]',
    '',
    'Who may wake whom:',
    '  channel-manager -> any seat            (assign a slice, clear a block)',
    '  a seat          -> channel-manager     (report, ask, escalate) — never another seat',
    '',
    'Reading the answer:',
    '  ACCEPTED WAKE_SENT     the bridge reported a turn; confirm with `hq seat verify`',
    '  DEFERRED SEAT_ACTIVE   the seat was touched inside the idle window; wait, or --force if stuck',
    '  DEFERRED WAKE_PENDING  no turn reported inside --wait; the send continues detached',
    '  DENIED <CODE>          nothing was sent; the code names the guard that refused',
    '',
    'A wake is a management prompt, not a provider send: it never writes channel/receipts.',
  ].join('\n');
  if (action === 'help') { process.stdout.write(usage + '\n'); return 0; }

  try {
    if (action === 'list') {
      const doc = loadSeats(root);
      const live = readLivenessMap();
      const table = renderSeatTable(doc, (sid) => live.get(sid) ?? null, { idleMinutes });
      emit(flags, { schema: table.schema, root, manager: doc.manager?.id ?? null, seats: table.seats }, table.lines);
      return 0;
    }

    if (action === 'wake') {
      const seatId = positional[0];
      if (!seatId) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      const prompt = typeof flags.prompt === 'string' ? flags.prompt : positional.slice(1).join(' ');
      const waitSec = Math.max(10, Number(flags.wait || 180));
      const live = readLivenessMap();
      const out = wakeSeat({
        root,
        seatId,
        prompt,
        reason: typeof flags.reason === 'string' ? flags.reason : null,
        force: flags.force === true,
        dryRun: flags['dry-run'] === true,
        idleMinutes,
        probe: (sid) => live.get(sid) ?? null,
        send: (sid, text) => resumeSession(sid, text, { timeoutMs: waitSec * 1000, cwd: live.get(sid)?.directory }),
      });
      const lines = [`${out.decision} ${out.code} — ${out.detail}`];
      if (out.seat) lines.push(`seat ${out.seat} · ${out.state}${out.ageMinutes === null || out.ageMinutes === undefined ? '' : ` · ${out.ageMinutes}m`}`);
      if (out.id) lines.push(`wake ${out.id}`);
      if (out.intentPath) lines.push(`intent ${out.intentPath}`);
      if (out.resultPath) lines.push(`result ${out.resultPath}`);
      if (out.decision !== 'DENIED' && out.code !== 'WAKE_SENT' && out.seat) lines.push(`confirm with: hq seat verify ${out.seat}`);
      if (out.code === 'SEAT_UNKNOWN') lines.push('run `hq seat list` to see the roster');
      if (out.code === 'EMPTY_PROMPT') lines.push(`give the slice: hq seat wake ${seatId} --prompt "<what to produce, which file, which test proves it>"`);
      if (out.code === 'SEAT_ACTIVE') lines.push('leave it working; re-check later, or --force only if you have decided it is stuck');
      if (out.code === 'SECRET_IN_PROMPT') lines.push('name where to read the credential, never the credential');
      emit(flags, { schema: WAKE_SCHEMA, ...out }, lines.join('\n'));
      return out.decision === 'DENIED' ? 1 : 0;
    }

    if (action === 'verify') {
      const seatId = positional[0];
      if (!seatId) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      const out = verifySeat({
        root,
        seatId,
        id: typeof flags.id === 'string' ? flags.id : null,
        confirm: (sid, id) => confirmWake(sid, id),
      });
      // A pending wake whose turn has since finished is a wake that landed. The
      // journal holds the reply file; reading it stops `reply: null` from being
      // reported as a seat that never answered.
      if (out.decision !== 'ACCEPTED' && out.id) {
        const late = lateReplyFor(root, out.id, lateReply);
        if (late) {
          out.decision = 'ACCEPTED';
          out.code = 'WAKE_CONFIRMED_LATE';
          out.reply = late;
          out.detail = `the turn finished after the wait; reply: ${String(late).slice(0, 140)}`;
        }
      }
      const lines = [`${out.decision} ${out.code} — ${out.detail}`];
      if (out.seat) lines.push(`seat ${out.seat} · wake ${out.id}`);
      emit(flags, { schema: WAKE_SCHEMA, ...out }, lines.join('\n'));
      return out.decision === 'ACCEPTED' ? 0 : 1;
    }
  } catch (error) {
    return fail(1, error.message);
  }

  return fail(2, usage);
}

// Channel wake lane (owner order 2026-11-09: "hook-based, not polling"). fs.watch on
// outcomes/, pending/ and broker/receipts/, debounced; every real transition becomes one
// secret-free bus line via sync.mjs so any seat's next turn sees it instantly, and
// --wake/--await adds a targeted hq seat wake when an awaited outcome lands. Read-only
// over the channel except the ONE state file (wake-state.json). --once is the
// cron-friendly single sweep (still no sleep loops). Core logic: hq/lib/channel-wake.mjs.
async function cmdChannel(positional, flags) {
  const action = positional.shift() || '';
  const usage = [
    'usage: hq channel watch [--root <dir>] [--once] [--wake <seat>] [--await <id>]... [--state-file <path>]',
    '',
    'Event-driven channel wake: outcomes/pending/broker-receipts transitions -> bus.',
    'No polling loops: watch mode is fs.watch + debounce; --once is a single sweep.',
    '  --root <dir>       channel root (default C:/VIVIM/channel)',
    '  --once             one snapshot, diff vs state file, emit, exit 0',
    '  --wake <seat>      wake this seat when an awaited outcome lands',
    '  --await <id>       awaited requestId, repeatable (pairs with --wake)',
    '  --state-file <p>   last-seen snapshot (default <root>/wake-state.json)',
  ].join('\n');
  if (action !== 'watch') {
    process.stderr.write(`hq channel: unknown action "${action}"\n${usage}\n`);
    return 2;
  }

  const { scanChannel, diffEvents, describeEvent, CHANNEL_WAKE_SCHEMA } = await import('../lib/channel-wake.mjs');
  const root = String(flags.root || process.env.HQ_CHANNEL_ROOT || DEFAULT_CHANNEL_ROOT);
  const stateFile = String(flags['state-file'] || join(root, 'wake-state.json'));
  const seat = typeof flags.wake === 'string' ? flags.wake : null;
  const awaited = new Set([].concat(flags.await ?? []).map(String));
  const hqSelf = fileURLToPath(import.meta.url);
  const syncScript = join(dirname(hqSelf), '..', '..', 'scripts', 'sync.mjs');

  const loadState = () => {
    try {
      const doc = JSON.parse(readFileSync(stateFile, 'utf8'));
      return doc && typeof doc === 'object' ? (doc.snapshot ?? null) : null;
    } catch {
      return null; // absent or unreadable state file = first run
    }
  };
  const saveState = (snapshot) => {
    mkdirSync(dirname(stateFile), { recursive: true });
    const tmp = `${stateFile}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ schema: CHANNEL_WAKE_SCHEMA, savedAt: new Date().toISOString(), root, snapshot }, null, 2));
    renameSync(tmp, stateFile); // atomic: a crash never leaves a half-written baseline
  };
  const busSend = (body) => {
    const r = spawnSync(process.execPath, [syncScript, 'send', '--from', 'channel-wake', '--to', '*', '--kind', 'status', '--topic', 'channel-outcome', '--body', body], { encoding: 'utf8', windowsHide: true });
    if (r.status !== 0) process.stderr.write(`channel-wake: bus send failed (${r.status}): ${String(r.stderr || '').trim().slice(0, 200)}\n`);
    return r.status === 0;
  };
  const wakeSeatFor = (event) => {
    const prompt = `channel-wake: request ${event.id} ${event.to} — an awaited outcome landed; resume that work if this is yours`;
    const r = spawnSync(process.execPath, [hqSelf, 'seat', 'wake', seat, '--prompt', prompt, '--reason', 'channel-wake'], { encoding: 'utf8', windowsHide: true });
    process.stdout.write(`channel-wake: seat wake ${seat} for ${event.id} -> exit ${r.status}\n`);
  };

  // One shared emitter: print (always), bus (always), seat wake (awaited outcomes only,
  // once per request per watcher lifetime).
  const woken = new Set();
  const handleEvents = (events) => {
    for (const e of events) {
      const body = describeEvent(e);
      process.stdout.write(`${body}\n`);
      busSend(body);
      if (seat && e.kind === 'outcome' && awaited.has(e.id) && !woken.has(e.id)) {
        woken.add(e.id);
        wakeSeatFor(e);
      }
    }
  };

  try {
    if (flags.once) {
      const before = loadState();
      const after = scanChannel(root);
      const events = before ? diffEvents(before, after) : []; // first run = baseline only
      handleEvents(events);
      saveState(after);
      process.stdout.write(`channel-wake: --once over ${root}: ${events.length} event(s), baseline ${before ? 'loaded' : 'seeded'}, state ${stateFile}\n`);
      return 0;
    }

    // Watch mode: event-driven only. Startup emits nothing — the state file seeds the
    // baseline (first run without one = baseline only), and events come from fs.watch
    // triggers after startup, debounced so a burst of channel writes is one sweep.
    const seeded = loadState();
    let current = seeded ?? scanChannel(root);
    saveState(current);
    const DEBOUNCE_MS = 250;
    let timer = null;
    const rescan = () => {
      timer = null;
      const after = scanChannel(root);
      const events = diffEvents(current, after);
      if (events.length === 0) return;
      current = after;
      saveState(after);
      handleEvents(events);
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(rescan, DEBOUNCE_MS);
    };
    const watchers = [];
    for (const dir of [join(root, 'outcomes'), join(root, 'pending'), join(root, 'broker', 'receipts')]) {
      try {
        watchers.push(watch(dir, schedule));
      } catch (err) {
        process.stderr.write(`channel-wake: cannot watch ${dir}: ${err.message}\n`);
      }
    }
    if (watchers.length === 0) return fail(2, `channel-wake: no watchable directory under ${root}`);
    process.on('SIGINT', () => {
      for (const w of watchers) w.close();
      if (timer) clearTimeout(timer);
      process.exit(0);
    });
    process.stdout.write(`channel-wake: watching ${root} (state ${stateFile}${seat ? `, wake -> ${seat} on awaited outcome` : ''})\n`);
    return 0; // exitCode only: the fs.watchers keep the process alive
  } catch (error) {
    return fail(1, error.message);
  }
}

// The ChatGPT coordination broker: many logical seats submit bounded requests, one serialized
// send path. Submit queues and journals; a send happens only inside drain, and only through a
// transport — the real Studio chat command path is constructed ONLY when the caller passes an
// owner authorization reference (ADR-CHATGPT-COORDINATION-BROKER).
async function cmdCoordination(positional, flags) {
  const action = positional.shift() || 'status';
  const root = String(flags.root || process.env.HQ_CHANNEL_ROOT || DEFAULT_CHANNEL_ROOT);
  const usage = [
    'usage:',
    '  hq coordination submit --seat <logical-seat> --task <id> --thread <key> --prompt "<text>"',
    '                         [--priority <n>] [--deadline <iso>] [--max-turns <n>]',
    '                         [--expected <shape>] [--context-ref <ref>] [--authorization <ref>]',
    '                         [--grant-file <path>]',
    '  hq coordination status [--request <id>] [--root <dir>]',
    '  hq coordination receipt <requestId>',
    '  hq coordination cancel-pending <requestId>',
    '  hq coordination reply <requestId> --reply-file <path>',
    '',
    'Reading the answer:',
    '  QUEUED      journaled, ordered, not sent — nothing sends without a drain with a transport',
    '  DUPLICATE   the identical request is already on record; the original receipt stands',
    '  DENIED      refused before anything was journaled or sent; the code names the guard',
    '  SENT / UNCERTAIN / REFUSED  terminal states — UNCERTAIN is never auto-resent',
    '',
    'Without --authorization a submit only queues (no-unrequested-send). With --authorization the',
    'drain may send through the existing Studio chat command path, once, under that reference.',
    '--grant-file <path> loads a trusted Host grant (schema vivim.channel-broker/1.grant) from a',
    'JSON file and binds it to the request record; the drain re-validates every binding leg',
    '(seat, requestId-or-scope, account, thread, expiry, revocation, ONE owner) before any send,',
    'and a requiresGrant transport without a valid grant is REFUSED GRANT_MISSING — never sent.',
    'A model reply parsed by `coordination reply` becomes inert proposals; HQ never executes it.',
  ].join('\n');
  if (action === 'help') { process.stdout.write(usage + '\n'); return 0; }

  try {
    if (action === 'submit') {
      const prompt = typeof flags.prompt === 'string' ? flags.prompt : null;
      // The trusted Host grant arrives as a file (it is a document, not a shell argument).
      // It is loaded and parsed BEFORE anything is journaled: a request that cannot present
      // its grant is refused at the queue, not left to be refused again at the drain.
      let grant = null;
      if (typeof flags['grant-file'] === 'string' && flags['grant-file'].length) {
        let text = null;
        try {
          text = readFileSync(resolve(flags['grant-file']), 'utf8');
        } catch (error) {
          const out = { schema: BROKER_SCHEMA, decision: 'DENIED', code: 'GRANT_FILE_UNREADABLE', detail: `cannot read the grant file at ${resolve(flags['grant-file'])}: ${error.message}` };
          emit(flags, out, `DENIED ${out.code} — ${out.detail}`);
          return 1;
        }
        try {
          grant = JSON.parse(text);
        } catch (error) {
          const out = { schema: BROKER_SCHEMA, decision: 'DENIED', code: 'GRANT_FILE_INVALID_JSON', detail: `the grant file at ${resolve(flags['grant-file'])} is not valid JSON: ${error.message}` };
          emit(flags, out, `DENIED ${out.code} — ${out.detail}`);
          return 1;
        }
      }
      const out = submitRequest({
        root,
        originSeat: typeof flags.seat === 'string' ? flags.seat : positional[0],
        taskId: typeof flags.task === 'string' ? flags.task : null,
        threadKey: typeof flags.thread === 'string' ? flags.thread : null,
        prompt,
        priority: Number.isFinite(Number(flags.priority)) ? Number(flags.priority) : 5,
        deadline: typeof flags.deadline === 'string' ? flags.deadline : null,
        maxTurns: Number.isFinite(Number(flags['max-turns'])) ? Number(flags['max-turns']) : 1,
        expectedReplyShape: typeof flags.expected === 'string' ? flags.expected : 'prose',
        contextSnapshotRef: typeof flags['context-ref'] === 'string' ? flags['context-ref'] : null,
        ownerAuthorizationRef: typeof flags.authorization === 'string' ? flags.authorization : null,
        grant,
      });
      const lines = [`${out.decision} ${out.code ?? ''} — ${out.detail}`.trim()];
      if (out.requestId) lines.push(`request ${out.requestId}${out.state ? ` · ${out.state}` : ''}`);
      if (out.requestPath) lines.push(`record ${out.requestPath}`);
      if (out.decision === 'QUEUED' && !flags.authorization) {
        lines.push('queued only; pass --authorization <ref> on a later drain to permit the send');
      }
      if (out.code === 'ORIGIN_SEAT_UNKNOWN' || out.code === 'ORIGIN_SEAT_MISSING') {
        lines.push(`logical seats: lead-research, local-supervisor, channel-broker, evidence-verifier (plus registered seats)`);
      }
      if (out.code === 'THREAD_IDENTITY_UNKNOWN') lines.push('register the thread first or use a key from channel/threads.json');
      // The drain runs only after a clean queue; the real Studio transport is built ONLY when
      // the caller passed an owner authorization reference. Anything else stays QUEUED.
      if (out.decision === 'QUEUED') {
        let transport = null;
        if (typeof flags.authorization === 'string' && flags.authorization.length) {
          const { studioChatTransport } = await import('../lib/channel-broker.mjs');
          transport = studioChatTransport({});
          lines.push(`authorization ${flags.authorization}: the drain may send once through the Studio chat path`);
        }
        const summary = await drain({ root, transport });
        lines.push(`drain: sent ${summary.sent} · uncertain ${summary.uncertain} · refused ${summary.refused} · still queued ${summary.stillQueued}`);
        if (summary.results.some((r) => r.requestId === out.requestId)) {
          const mine = summary.results.find((r) => r.requestId === out.requestId);
          lines.push(`request ${out.requestId} → ${mine.state}${mine.code ? ` (${mine.code})` : ''}`);
        }
      }
      emit(flags, { schema: BROKER_SCHEMA, ...out }, lines.join('\n'));
      return out.decision === 'DENIED' ? 1 : 0;
    }

    if (action === 'status') {
      if (typeof flags.request === 'string') {
        const { state, events } = requestState(root, flags.request);
        emit(flags, { schema: BROKER_SCHEMA, requestId: flags.request, state, events: events.slice(-5) },
          `${flags.request} · ${state}${events.length ? ` · ${events.length} journal events` : ''}`);
        return 0;
      }
      const table = renderQueueTable(root);
      emit(flags, { schema: table.schema, root, requests: table.requests }, table.lines);
      return 0;
    }

    if (action === 'receipt') {
      const requestId = positional[0];
      if (!requestId) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      const { readFile } = await import('node:fs/promises');
      const file = join(root, 'broker', 'receipts', `${requestId}.json`);
      try {
        const receipt = JSON.parse(await readFile(file, 'utf8'));
        const lines = [
          `${receipt.state} — request ${receipt.requestId}`,
          `effect ${receipt.effect} · sendAttempts ${receipt.sendAttempts}`,
          receipt.providerReceiptRef ? `studio receipt ${receipt.providerReceiptRef}` : null,
          receipt.detail ?? '',
        ].filter(Boolean);
        emit(flags, { schema: RECEIPT_SCHEMA, ...receipt }, lines.join('\n'));
        return 0;
      } catch {
        const { state } = requestState(root, requestId);
        const lines = [`no receipt yet for ${requestId} · state ${state}`, file];
        if (state === 'UNCERTAIN') lines.push('UNCERTAIN is terminal: reconcile by observation, never by resend');
        emit(flags, { schema: BROKER_SCHEMA, requestId, state, receiptPath: file }, lines.join('\n'));
        return 1;
      }
    }

    if (action === 'cancel-pending') {
      const requestId = positional[0];
      if (!requestId) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      const out = cancelPending({ root, requestId, actor: typeof flags.actor === 'string' ? flags.actor : 'hq-cli' });
      emit(flags, { schema: BROKER_SCHEMA, ...out }, `${out.decision} ${out.code} — ${out.detail}`);
      return out.decision === 'DENIED' ? 1 : 0;
    }

    if (action === 'reply') {
      const requestId = positional[0];
      if (!requestId) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      let replyText = typeof flags.reply === 'string' ? flags.reply : null;
      if (!replyText && typeof flags['reply-file'] === 'string') {
        const { readFileSync } = await import('node:fs');
        try {
          replyText = readFileSync(flags['reply-file'], 'utf8');
        } catch (error) {
          return fail(2, `could not read --reply-file "${flags['reply-file']}": ${error.message}`);
        }
      }
      if (!replyText) return fail(2, 'give the captured reply with --reply-file <path> or --reply "<text>"');
      const out = recordReply({ root, requestId, replyText });
      const lines = [
        `${out.decision} ${out.code} — parsed into ${out.parsed?.proposals?.length ?? 0} inert proposal(s)`,
        `execution: none · owner approval required: yes`,
        out.path ?? '',
      ].filter(Boolean);
      emit(flags, { schema: BROKER_SCHEMA, ...out }, lines.join('\n'));
      return out.decision === 'DENIED' ? 1 : 0;
    }
  } catch (error) {
    return fail(1, error.message);
  }

  return fail(2, usage);
}

// One dispatch cycle, over two queues that are NOT interchangeable. An observation
// (dogfood/active-tasks.json) names a live seat and is delivered by waking it; an
// authored order (hq/work/orders.json) names one file and the command that proves
// it, and is delivered as a DISPATCH line for a builder. The pool therefore
// follows the transport, and --pool is the only explicit override. A dry run is
// the default: --apply is the only way an effect happens, and the agent transport
// still writes no journal and spawns nothing — it prints what the caller may spawn.
async function cmdAutonomy(positional, flags) {
  const action = positional.shift() || 'run';
  const usage = [
    'usage:',
    '  hq autonomy [--apply] [--transport seat|agent] [--max-wakes <n>] [--force]',
    '              [--pool observations|orders|both] [--orders <path|none>]',
    '              [--journal <path>] [--root <dir>] [--idle-minutes <n>] [--wait <sec>]',
    '',
    'The two queues, and why the transport picks one:',
    '  observations  dogfood/active-tasks.json — transcript rows; a live seat is woken with the slice',
    '  orders        hq/work/orders.json — authored work; DISPATCH lines are printed for a forge to be spawned',
    '  seat          -> observations only; agent -> orders only. --pool overrides the derivation.',
    '',
    'Reading it:',
    '  dry run (default)   plans only; no journal, no wake, no DISPATCH line',
    '  --apply             seat transport journals before it wakes; agent transport only prints',
    '  --orders none       disable the authored queue entirely',
    '  ORDERS_INVALID      the queue failed validation; nothing was planned (exit 2)',
    '  ORDERS_MISSING      the authored queue could not be read (exit 2, never an empty pool)',
  ].join('\n');
  if (action === 'help') { process.stdout.write(usage + '\n'); return 0; }
  if (action !== 'run') return fail(2, usage);

  const argv = [];
  if (flags.apply === true) argv.push('--apply');
  const valued = [
    ['transport', '--transport'],
    ['pool', '--pool'],
    ['orders', '--orders'],
    ['max-wakes', '--max-wakes'],
    ['idle-minutes', '--idle-minutes'],
    ['journal', '--journal'],
    ['root', '--root'],
    ['wait', '--wait'],
  ];
  for (const [key, flag] of valued) {
    const value = flags[key];
    if (value === undefined) continue;
    if (value === true) return fail(2, `${flag} needs a value`);
    argv.push(flag, String(value));
  }
  if (flags.force === true) argv.push('--force');

  // The workspace root, not the shell's cwd: both default queue paths hang off it.
  const { runAutonomy } = await import('./autonomy.mjs');
  // Print through the injected callbacks and nothing else — runAutonomy already
  // keeps its own `lines` array, and printing both would double every line.
  const result = runAutonomy({
    argv,
    cwd: findRoot(),
    stdout: (line) => process.stdout.write(`${line}\n`),
    stderr: (line) => process.stderr.write(`${line}\n`),
  });
  return result.code;
}

// The authored work queue. `list` is read-only. `claim` and `done` are the two
// transitions that close the dispatch loop: the agent transport prints DISPATCH
// lines and writes no journal, so without a way to advance an order a clock would
// re-dispatch the same ids forever. Every write validates the document first and
// renames a temp file over the target, so a crash never leaves half a queue.
async function cmdWork(positional, flags) {
  const action = positional.shift() || 'list';
  const usage = [
    'usage:',
    '  hq work [list] [--orders <path>]                                     read-only view, validated',
    '  hq work claim <id> [--orders <path>] [--seat <name>] [--at <iso>]    open -> claimed',
    '  hq work done <id> [--orders <path>] [--status done|blocked|cancelled] [--at <iso>]',
    '                                                                       claimed -> done|blocked|cancelled',
    '',
    'The authored queue: one order per line, each naming the one file a builder may write and the',
    'command that proves it. A transition with no --at uses the current time (the only clock read).',
    'An invalid queue is refused before any write; an illegal transition exits 1 and writes nothing.',
  ].join('\n');
  if (action === 'help') { process.stdout.write(usage + '\n'); return 0; }
  if (action !== 'list' && action !== 'claim' && action !== 'done') return fail(2, usage);
  if (flags.orders === true) return fail(2, '--orders needs a path');
  if (flags.at === true) return fail(2, '--at needs a timestamp');
  if (flags.seat === true) return fail(2, '--seat needs a name');
  if (flags.status === true) return fail(2, '--status needs done, blocked or cancelled');

  const ordersPath = typeof flags.orders === 'string'
    ? resolve(flags.orders)
    : join(findRoot(), 'hq', 'work', 'orders.json');
  const {
    validateDoc, renderOrders, claimOrder, completeOrder, formatDoc, WORK_ORDER_SCHEMA,
  } = await import('../lib/work-orders.mjs');

  let text;
  try {
    text = readFileSync(ordersPath, 'utf8');
  } catch (error) {
    return fail(2, `cannot read the work queue at ${ordersPath}: ${error.message}`);
  }

  let doc = null;
  try { doc = JSON.parse(text); } catch { doc = null; }
  const check = validateDoc(doc);
  if (!check.ok) {
    // Fail closed on both paths: `list` reports (exit 1), a transition refuses
    // before writing (exit 2). Neither ever plans or writes against a bad queue.
    const report = [`work: ORDERS_INVALID — ${check.errors.join(',')}`,
      ...check.duplicateIds.map((id) => `work: duplicate id ${id}`)];
    process.stdout.write(`${report.join('\n')}\n`);
    return action === 'list' ? 1 : 2;
  }

  if (action === 'list') {
    const lines = renderOrders(doc);
    emit(flags, { schema: WORK_ORDER_SCHEMA, path: ordersPath, ok: true, orders: doc.orders, rendered: lines }, lines.join('\n'));
    return 0;
  }

  const id = positional[0];
  if (!id) return fail(2, usage);
  const at = typeof flags.at === 'string' ? flags.at : new Date().toISOString();

  let next;
  try {
    next = action === 'claim'
      ? claimOrder(doc, id, { at, seat: typeof flags.seat === 'string' ? flags.seat : undefined })
      : completeOrder(doc, id, { at, status: typeof flags.status === 'string' ? flags.status : 'done' });
  } catch (error) {
    // ILLEGAL_TRANSITION / ORDER_NOT_FOUND / DUPLICATE_ID / MISSING_AT / BAD_STATUS:
    // the module's own code, and nothing was written.
    return fail(1, error.message);
  }

  const after = validateDoc(next);
  if (!after.ok) {
    process.stdout.write(`work: ORDERS_INVALID — ${after.errors.join(',')}\n`);
    return 2;
  }

  const tmpPath = join(dirname(ordersPath), `.${basename(ordersPath)}.${process.pid}.tmp`);
  try {
    writeFileSync(tmpPath, formatDoc(next));
    renameSync(tmpPath, ordersPath);
  } catch (error) {
    try { rmSync(tmpPath, { force: true }); } catch { /* the rename never happened */ }
    return fail(1, `cannot write the work queue at ${ordersPath}: ${error.message}`);
  }

  const written = next.orders.find((order) => order.id === id) ?? null;
  const line = action === 'claim'
    ? `work: claimed ${id} seat=${written?.seat ?? '-'} at=${written?.claimedAt ?? at}`
    : `work: ${written?.status ?? 'done'} ${id} at=${written?.completedAt ?? at}`;
  emit(flags, { schema: WORK_ORDER_SCHEMA, path: ordersPath, ok: true, order: written }, line);
  return 0;
}

// Review gate: after every N completed work orders, decides DONE / MORE-WORK / BLOCKED.
// Reads the work queue, looks at the last N completed orders, and returns a verdict.
// Used by the operating chief to keep the factory honest — no lane proceeds past a
// review boundary without evidence that the last batch actually passed.
async function cmdReview(positional, flags) {
  const n = Number(positional[0] ?? flags.n ?? 3);
  if (!Number.isFinite(n) || n < 1) return fail(2, 'usage: hq review <n>  (review every n completed orders)');

  const ordersPath = typeof flags.orders === 'string'
    ? resolve(flags.orders)
    : join(findRoot(), 'hq', 'work', 'orders.json');
  let text;
  try { text = readFileSync(ordersPath, 'utf8'); } catch { return fail(2, `cannot read ${ordersPath}`); }
  let doc;
  try { doc = JSON.parse(text); } catch { return fail(2, `${ordersPath} is not valid JSON`); }

  const orders = Array.isArray(doc?.orders) ? doc.orders : [];
  const completed = orders.filter((o) => o.status === 'done' || o.status === 'blocked' || o.status === 'cancelled');
  const cycle = completed.length;

  const verdict = reviewGate(completed, n, cycle);

  const lines = [
    `review: n=${n} cycle=${cycle} reviewed=${verdict.reviewDue ? 'yes' : 'no'}`,
    `verdict: ${verdict.verdict}`,
    `reason: ${verdict.reason}`,
    `code: ${verdict.code}`,
  ];
  if (verdict.reviewDue) {
    lines.push(`completed: ${completed.length} total, ${completed.filter((o) => o.status === 'done').length} done, ${completed.filter((o) => o.status === 'blocked' || o.status === 'cancelled').length} blocked/cancelled`);
    if (verdict.verdict !== 'done') {
      lines.push('next: do not fan out the next lane — resolve the blocked/more-work items first.');
    } else {
      lines.push('next: review boundary clear — the next lane may be fanned out.');
    }
  } else {
    lines.push(`next review at cycle ${Math.ceil(cycle / n) * n}`);
  }
  process.stdout.write(lines.join('\n') + '\n');
  return verdict.verdict === 'blocked' ? 1 : 0;
}

// Multi-model console: one-line health dashboard for every model in provider_config.json.
// Reads provider_config.json (read-only) and shows provider, model, enabled, health state,
// budget state, last error fingerprint, and route status. No secrets are printed.
async function cmdConsole(flags) {
  const { buildRows, renderConsole } = await import('./console.mjs');
  const rules = [];
  try {
    const { loadProviderRules } = await import('./console.mjs');
    const loaded = loadProviderRules();
    if (loaded.ok) rules.push(...loaded.rules);
  } catch { /* console module may not be importable in all contexts */ }

  const rows = buildRows(rules, [], Date.now());
  process.stdout.write(renderConsole(rows) + '\n');
  const blocked = rows.filter((r) => r.health.state === 'budget-blocked' || r.health.state === 'capped' || r.health.state === 'broken');
  return blocked.length > 0 ? 1 : 0;
}

// One roof over every comms and agent-state source. Read-only: each source is a
// probe, a missing one is a defect row, and nothing here writes. `--strict`
// turns a defect into a non-zero exit for a gate; without it, it reports.
async function cmdComms(flags) {
  if (flags.help === true) {
    process.stdout.write([
      'usage: hq comms [--json] [--strict] [--toolkit <path>] [--root <channel root>]',
      '',
      'Joins: bot roster (bots.mjs), channel seats, agent definitions, live ZCode sessions,',
      'the sync bus, the bot inbox, the wake journal and the CNP naming status.',
      'A missing or broken source is a defect row, never a crash.',
    ].join('\n') + '\n');
    return 0;
  }
  const toolkit = typeof flags.toolkit === 'string' ? flags.toolkit : undefined;
  const channelRoot = typeof flags.root === 'string' ? flags.root : DEFAULT_CHANNEL_ROOT;
  const parts = {
    bots: probeBots(toolkit),
    seats: probeSeats(channelRoot),
    agentDefs: probeAgentDefs(),
    threads: probeThreads(sessionsTool()),
    channels: probeChannels({ channelRoot, toolkit }),
    desk: probeDesk(),
    inboxes: probeInboxes(),
    commsBus: probeCommsBus(),
    anet: probeAnet(),
    evidence: probeChannelEvidence(channelRoot),
    control: probeControl({ channelRoot }),
  };
  const roof = buildRoof(parts);
  emit(flags, roof, renderRoof(roof));
  return flags.strict === true && !roof.ok ? 1 : 0;
}

// The action map: one catalog of every action a user, agent or app might take,
// with the honest status of each. `wired` means a real command exists; everything
// else is `declared`. `hq do` only RESOLVES — it never executes, because a plain
// sentence must not be able to delete something.
let actionCatalogCache = null;
async function actionCatalog() {
  if (actionCatalogCache) return actionCatalogCache;
  const [{ buildActions }, { VERBS }, ...domainModules] = await Promise.all([
    import('../lib/action-registry.mjs'),
    import('../lib/actions/verbs.mjs'),
    ...[1, 2, 3, 4].map((i) => import(`../lib/actions/domains-${i}.mjs`)),
  ]);
  let HANDLERS = {};
  try { HANDLERS = (await import('../lib/actions/handlers.mjs')).HANDLERS; } catch { HANDLERS = {}; }
  let expand = (t) => [t];
  try { expand = (await import('../lib/actions/aliases.mjs')).expand; } catch { /* aliases optional */ }
  const domains = domainModules.flatMap((m) => m.DOMAINS);
  actionCatalogCache = { actions: buildActions({ domains, verbs: VERBS, handlers: HANDLERS }), expand, HANDLERS };
  return actionCatalogCache;
}

async function cmdActions(positional, flags) {
  const { actions } = await actionCatalog();
  const { summarize } = await import('../lib/action-registry.mjs');
  const { describe } = await import('../lib/action-router.mjs');
  if (flags.help === true) {
    process.stdout.write([
      'usage: hq actions [query] [--domain D] [--status wired|declared] [--actor user|agent|app]',
      '                   [--risk low|medium|high] [--limit N] [--summary] [--json]',
      '',
      'The catalog is derived: 20 domains x 10 objects x 10 verbs. `wired` means a real',
      'command exists for that domain.verb; `declared` means the action is named but',
      'nothing implements it yet.',
    ].join('\n') + '\n');
    return 0;
  }
  const stats = summarize(actions);
  if (flags.summary === true) {
    const lines = [
      `actions: ${stats.total}`,
      `by status: ${Object.entries(stats.byStatus).map(([k, v]) => `${k}=${v}`).join(' · ')}`,
      `by risk:   ${Object.entries(stats.byRisk).map(([k, v]) => `${k}=${v}`).join(' · ')}`,
      `by domain: ${Object.keys(stats.byDomain).length} domains`,
    ];
    emit(flags, { schema: 'hq.action-stats/1', ...stats }, lines.join('\n'));
    return 0;
  }
  const query = positional.join(' ').trim().toLowerCase();
  let rows = actions;
  if (flags.domain) rows = rows.filter((a) => a.domain === flags.domain);
  if (flags.status) rows = rows.filter((a) => a.status === flags.status);
  if (flags.risk) rows = rows.filter((a) => a.risk === flags.risk);
  if (flags.actor) rows = rows.filter((a) => a.actors.includes(flags.actor));
  if (query) rows = rows.filter((a) => `${a.id} ${a.purpose}`.toLowerCase().includes(query));
  const limit = Number(flags.limit || 40);
  const shown = rows.slice(0, limit);
  const lines = [`${rows.length} action(s)${rows.length > shown.length ? `, showing ${shown.length}` : ''}`];
  for (const a of shown) lines.push(`  ${describe(a)}`);
  if (!shown.length) lines.push('  (none — try --summary, or a broader query)');
  emit(flags, { schema: 'hq.actions/1', count: rows.length, shown: shown.length, actions: shown }, lines.join('\n'));
  return 0;
}

async function cmdAction(positional, flags) {
  const id = positional[0];
  if (!id) return fail(2, 'usage: hq action <domain.verb.object> [--run] [--json]');
  const { actions } = await actionCatalog();
  const a = actions.find((x) => x.id === id.toLowerCase());
  if (!a) {
    const near = actions.filter((x) => x.id.includes(id.toLowerCase().split('.').pop())).slice(0, 3);
    return fail(1, `no action "${id}"${near.length ? ` — did you mean ${near.map((n) => n.id).join(', ')}?` : ''}`);
  }
  const lines = [
    a.id,
    `  purpose:  ${a.purpose}`,
    `  actors:   ${a.actors.join(', ')}`,
    `  risk:     ${a.risk}${a.approval ? ' (approval required)' : ''}`,
    `  mutates:  ${a.mutates}`,
    `  status:   ${a.status}`,
    a.handler ? `  command:  ${a.handler.command}\n  note:     ${a.handler.note}` : '  command:  (none — declared only)',
  ];
  if (flags.run === true) {
    if (!a.handler) return fail(1, `${a.id} is declared, not wired: nothing to run`);
    if (a.risk !== 'low' || a.approval) return fail(1, `${a.id} is ${a.risk} risk${a.approval ? ' and needs approval' : ''}: run the printed command yourself`);
    const out = spawnSync(a.handler.command.replace('<object>', positional[1] || ''), { shell: true, encoding: 'utf8', windowsHide: true });
    lines.push('  --- output ---', String(out.stdout || out.stderr || '').trim().slice(0, 2000));
    emit(flags, { schema: 'hq.action-run/1', action: a, exit: out.status, stdout: out.stdout, stderr: out.stderr }, lines.join('\n'));
    return out.status === 0 ? 0 : 1;
  }
  emit(flags, { schema: 'hq.action/1', action: a }, lines.join('\n'));
  return 0;
}

// The Fleet State Feed: one versioned snapshot of everything a fleet-wide agent
// must know, plus a delta cursor and a staleness contract it can check itself.
async function fsfSources() {
  const channelRoot = DEFAULT_CHANNEL_ROOT;
  return {
    seats: () => ({ agents: loadSeats(channelRoot).seats.map((s) => ({ id: s.id, session: s.session, site: s.site })) }),
    sessions: () => { const all = [...readLivenessMap().entries()].map(([id, v]) => ({ id, ageMinutes: v.ageMinutes })); return { live: all.filter((x) => x.ageMinutes < 240).length, sessions: all.length, newest: all.slice(0, 5) }; },
    receipts: () => {
      const out = probeChannelEvidence(channelRoot);
      return { receipts: out.items.length, joinable: out.items.filter((i) => i.joinable).length };
    },
    bus: () => {
      const file = join(process.cwd(), 'sync', 'ledger.jsonl');
      const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : [];
      const claims = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((r) => r && r.kind === 'claim').length;
      return { messages: lines.length, claims };
    },
    control: () => {
      try {
        const a = approvalState({ file: join(channelRoot, 'control', 'approvals.jsonl') });
        const r = revocationView({ file: join(channelRoot, 'control', 'revocations.jsonl') });
        return { approvalsPending: a.pending ?? 0, revocations: r.count ?? 0 };
      } catch { return { approvalsPending: 0, revocations: 0 }; }
    },
    actions: async () => {
      const { actions } = await actionCatalog();
      return { total: actions.length, wired: actions.filter((a) => a.status === 'wired').length, declared: actions.filter((a) => a.status === 'declared').length };
    },
  };
}

async function cmdFsf(positional, flags) {
  const action = positional.shift() || 'snapshot';
  if (action === 'help' || flags.help === true) {
    process.stdout.write([
      'usage:',
      '  hq fsf snapshot [--json]              one versioned snapshot of the fleet',
      '  hq fsf serve [--port 4319] [--interval 5000] [--token-file <path>]',
      '  hq fsf check [--url http://127.0.0.1:4319] [--token <t>]',
      '',
      'The feed carries seven slices (identity capacity work locks health policy time).',
      'A slice whose source is dead is reported degraded, never omitted: a blank feed',
      'must not look like a healthy fleet.',
    ].join('\n') + '\n');
    return 0;
  }
  const { collectSlices } = await import('../lib/fsf/slices.mjs');
  const { normalizeSnapshot } = await import('../lib/fsf/client.mjs');
  const { FeedStore } = await import('../lib/fsf/store.mjs');

  if (action === 'snapshot') {
    const now = nowISO();
    const slices = await collectSlices({ now, sources: await fsfSources() });
    const store = new FeedStore({ history: 5 });
    const snap = normalizeSnapshot(store.publish({ slices, now, refreshAfterMs: Number(flags['refresh-after'] || 5000) }));
    const degraded = Object.entries(snap.slices).filter(([, v]) => v.degraded).map(([k]) => k);
    const lines = [
      `generation ${snap.generation} · version ${snap.version} · issued ${snap.issuedAt}`,
      `degraded: ${degraded.length ? degraded.join(', ') : 'none'}`,
    ];
    for (const [name, s] of Object.entries(snap.slices)) lines.push(`  ${s.degraded ? 'BAD ' : 'ok  '} ${name.padEnd(9)} ${s.tier.padEnd(5)} ${JSON.stringify(s.data).slice(0, 90)}`);
    emit(flags, snap, lines.join('\n'));
    return snap.degraded ? 1 : 0;
  }

  if (action === 'serve') {
    const { createFeedServer } = await import('../lib/fsf/server.mjs');
    const token = flags.token || process.env.HQ_FSF_TOKEN;
    if (!token) return fail(2, 'a token is required: pass --token or set HQ_FSF_TOKEN (an unauthenticated feed is refused)');
    const interval = Math.max(1000, Number(flags.interval || 5000));
    const store = new FeedStore({ history: 200 });
    const getServer = async () => (await import('../lib/fsf/server.mjs')).createFeedServer({
      store, token, refreshAfterMs: interval, port: Number(flags.port || 4319),
    });
    const sources = await fsfSources();
    const publish = async () => {
      const now = nowISO();
      store.publish({ slices: await collectSlices({ now, sources }), now, refreshAfterMs: interval });
    };
    await publish();
    const srv = await getServer();
    const timer = setInterval(() => { publish().catch(() => {}); }, interval);
    timer.unref?.();
    process.stdout.write(`fsf serving on ${srv.url} · interval ${interval}ms · snapshot ${store.snapshot().version}\n`);
    return 0;
  }

  if (action === 'check') {
    const { readSnapshot, isCurrent } = await import('../lib/fsf/client.mjs');
    const base = String(flags.url || 'http://127.0.0.1:4319').replace(/\/+$/, '');
    const url = /\/fsf\/snapshot$/.test(base) ? base : base + '/fsf/snapshot';
    const r = await readSnapshot(url, { token: flags.token || process.env.HQ_FSF_TOKEN, fetchImpl: fetch });
    if (!r.ok) { emit(flags, r, `NOT OK ${r.code}${r.status ? ` (${r.status})` : ''}`); return 1; }
    const fresh = isCurrent(r.snapshot, nowISO());
    emit(flags, { ...r, current: fresh }, `${fresh ? 'CURRENT' : 'STALE'} · version ${r.snapshot.version} · issued ${r.snapshot.issuedAt}`);
    return fresh ? 0 : 1;
  }

  return fail(2, 'usage: hq fsf snapshot|serve|check');
}

async function cmdDo(positional, flags) {
  const text = positional.join(' ').trim();
  if (!text) return fail(2, 'usage: hq do "<plain English>" [--json] [--limit N]');
  const { actions, expand } = await actionCatalog();
  const { route, describe } = await import('../lib/action-router.mjs');
  // Aliases are applied to the query before scoring, so "rename a conversation"
  // can reach thread.update.title without the router knowing either word.
  const expanded = text.split(/\s+/).flatMap((w) => expand(w.toLowerCase().replace(/[^a-z0-9-]/g, ''))).join(' ');
  const r = route(actions, expanded, { limit: Number(flags.limit || 3) });
  if (!r.ok) {
    emit(flags, { schema: 'hq.do/1', ...r }, `NO_MATCH — nothing in the catalog answers "${text}".\nResolved query: "${expanded}"\nTry: hq actions --summary`);
    return 1;
  }
  const lines = [`best match for "${text}"`, `  resolved: ${expanded}`, ''];
  for (const m of r.matches) lines.push(`  ${describe(m.action)}`);
  const best = r.matches[0].action;
  lines.push('');
  lines.push(best.handler
    ? `would run: ${best.handler.command}   (note: ${best.handler.note})`
    : 'nothing to run: the best match is declared, not wired');
  lines.push('hq do never executes. Use: hq action <id> --run   (wired + low risk only)');
  emit(flags, { schema: 'hq.do/1', query: text, resolved: expanded, matches: r.matches }, lines.join('\n'));
  return 0;
}

// CNP/1 thread identity. The receipts are evidence and are never rewritten: this
// assigns a stable name to each conversation and keeps the mapping beside them.
async function cmdThreads(positional, flags) {
  const action = positional.shift() || 'resolve';
  const channelRoot = typeof flags.root === 'string' ? flags.root : DEFAULT_CHANNEL_ROOT;
  if (action === 'help') {
    process.stdout.write([
      'usage: hq threads resolve [--write] [--root <channel root>]',
      '',
      'Names every channel receipt with a CNP/1 Nid (session/request id ↔ name) in',
      '<root>/threads.json. Without --write it prints what it would assign.',
      'The receipts themselves are read-only here: an evidence ledger is not edited',
      'to make a report greener.',
    ].join('\n') + '\n');
    return 0;
  }
  if (action !== 'resolve') return fail(2, 'usage: hq threads resolve [--write]');
  const registryFile = join(channelRoot, 'threads.json');
  const out = resolveChannelThreads({ channelRoot, registryFile, write: flags.write === true });
  const lines = [
    `receipts named: ${out.entries.length}`,
    `  stored real id:     ${out.summary.stored ?? 0}`,
    `  placeholder named:  ${out.summary['assigned-placeholder'] ?? 0}`,
    `  missing named:      ${out.summary['assigned-missing'] ?? 0}`,
    `  unreadable:         ${out.summary.unreadable ?? 0}`,
    out.file ? `registry: ${out.file}` : 'dry run — pass --write to persist',
  ];
  emit(flags, { schema: 'hq.cnp-registry/1', ...out.summary, entries: out.entries, file: out.file }, lines.join('\n'));
  return 0;
}

// The durable half of the autocompaction protocol: a bounded card a session can be
// re-armed from. --write refuses a card with no next action; --inject never invents one.
async function cmdSessionCard(flags) {
  if (flags.help === true) {
    process.stdout.write([
      'usage: hq session-card [--write|--inject] [--repo <path>] [--as <agent>]',
      '                       [--goal <text>] [--next-action <text>] [--session <id>] [--json]',
      '',
      'Builds the durable state card (goal, next action, branch, dirty, lanes, bus).',
      '--write  atomically writes .hq/session/state-card.json; refuses without a next action.',
      '--inject prints the bounded re-arm card (the default render is the same card).',
    ].join('\n') + '\n');
    return 0;
  }
  const repo = typeof flags.repo === 'string' ? flags.repo : process.cwd();
  const previous = loadStateCard(repo);
  // `next` is a global boolean flag in this CLI; the card's own flag is `next-action`.
  const nextAction = typeof flags['next-action'] === 'string' ? flags['next-action'] : null;
  const card = buildStateCard({
    repo,
    session: typeof flags.session === 'string' ? flags.session : previous?.session ?? null,
    goal: typeof flags.goal === 'string' ? flags.goal : previous?.goal ?? '',
    nextAction: nextAction ?? previous?.nextAction ?? '',
    busAgent: typeof flags.as === 'string' ? flags.as : 'agent',
    lanes: previous?.lanes ?? [],
    risks: previous?.openRisks ?? [],
    questions: previous?.openQuestions ?? [],
    compactions: previous?.compactions ?? 0,
    tokens: previous?.tokens ?? { input: 0, output: 0 },
  });
  if (flags.write === true) {
    try {
      const file = writeStateCard(repo, card);
      emit(flags, { schema: 'hq.session-card/1', ok: true, file, card }, `wrote ${file}`);
      return 0;
    } catch (error) {
      return fail(2, error.message);
    }
  }
  emit(flags, { schema: 'hq.session-card/1', ok: true, card }, renderStateCard(card));
  return 0;
}

async function cmdKb(positional, flags) {
  const action = positional.shift();
  if (!action || action === 'help') {
    process.stdout.write(kbUsage());
    return 0;
  }

  const { root, db } = openWorkspace();
  try {
    if (action === 'intake') {
      const dir = positional[0];
      const usage = 'usage: hq kb intake <dir> [--project <name>] [--dry-run]';
      if (!dir) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      const { ingestKbDirectory } = await import('../lib/kb-intake.mjs');
      const { loadRegistry } = await import('../lib/filetypes.mjs');
      const report = ingestKbDirectory(db, {
        dir: resolve(String(dir)),
        project: flags.project || null,
        registry: loadRegistry(root),
        dryRun: flags['dry-run'] === true,
        workspace: root,
      });
      const lines = [];
      lines.push(report.ok
        ? `KB intake ok: ${report.package.id || 'package'} ${report.package.version || ''} → project ${report.project}`
        : `KB intake refused: ${report.reasons.length} reason(s)`);
      for (const reason of report.reasons) lines.push(`  ${reason}`);
      lines.push(`Files ${report.counts.files} · documents ${report.counts.documents} · decisions ${report.counts.decisions} · terms ${report.counts.terms} · unclassified ${report.counts.unclassified}`);
      lines.push(`Added ${report.added} · changed ${report.changed} · unchanged ${report.unchanged}`);
      if (report.package.digest) lines.push(`Digest ${report.package.digest}`);
      if (report.missingFromPackage.length) lines.push(`Missing from package: ${report.missingFromPackage.length}`);
      emit(flags, report, lines.join('\n'));
      return report.ok ? 0 : 1;
    }

    if (action === 'status') {
      const { intakeStatus } = await import('../lib/kb-intake.mjs');
      const status = intakeStatus(db);
      const out = { schema: 'hq.kb-status/1', ...status };
      const lines = status.package
        ? [
          `Last package: ${status.package} ${status.version || ''}`,
          `Digest ${status.digest || '-'}`,
          `At ${status.at || '-'}`,
          `Files ${status.counts?.files ?? 0} · documents ${status.counts?.documents ?? 0} · decisions ${status.counts?.decisions ?? 0} · terms ${status.counts?.terms ?? 0}`,
        ]
        : ['No KB package ingested yet. Run: hq kb intake <dir>'];
      emit(flags, out, lines.join('\n'));
      return 0;
    }

    if (action === 'verify') {
      const dir = positional[0];
      const usage = 'usage: hq kb verify <dir> [--project <name>]';
      if (!dir) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      const { intakeVerify } = await import('../lib/kb-intake.mjs');
      const read = readKbPackageDir(dir);
      if (read.error) {
        emit(flags, { ok: false, error: read.error }, read.error);
        return 1;
      }
      const result = intakeVerify(db, {
        manifest: read.manifest,
        files: read.files,
        project: flags.project || null,
      });
      const out = { schema: 'hq.kb-verify/1', ...result };
      const lines = [
        `KB verify: ${read.manifest?.id || 'package'} ${read.manifest?.version || ''}`,
        `Unchanged ${result.unchanged} · changed ${result.changed} · added ${result.added}`,
        `Missing from package: ${result.missing.length}`,
        result.ok ? 'Package matches what HQ holds.' : 'Package drifted from what HQ holds.',
      ];
      emit(flags, out, lines.join('\n'));
      return result.ok ? 0 : 1;
    }

    if (action === 'health') {
      const { kbHealth } = await import('../lib/kb.mjs');
      const health = kbHealth(db);
      const out = { schema: 'hq.kb-health/1', ...health };
      const counts = health.counts || {};
      const lines = [
        'KB health',
        `Documents ${counts.doc ?? 0} · decisions ${counts.decision ?? 0} · canon ${counts.canon ?? 0} · sessions ${counts.session ?? 0} · notes ${counts.note ?? 0} · wiki ${counts.wiki ?? 0}`,
        `Stale evidence ${health.stale?.length ?? 0} · orphans ${health.orphans?.length ?? 0}`,
      ];
      if (health.reason) lines.push(`Reason ${health.reason}`);
      emit(flags, out, lines.join('\n'));
      return 0;
    }

    if (action === 'query') {
      const query = positional.join(' ').trim();
      const usage = 'usage: hq kb query <text> [--kind <kind>] [--project <name>] [--limit n]';
      if (!query) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      const { kbQuery } = await import('../lib/kb.mjs');
      const results = kbQuery(db, {
        query,
        kind: flags.kind || null,
        project: flags.project || null,
        limit: Number(flags.limit || 30),
      });
      const out = { schema: 'hq.kb-query/1', query, count: results.length, results };
      const lines = results.length
        ? results.map((r) => `${r.score}\t${r.kind}\t${r.project || '-'}\t${r.title}\t${r.snippet || ''}`)
        : ['No KB matches.'];
      emit(flags, out, lines.join('\n'));
      return 0;
    }

    if (action === 'graph') {
      const { kbGraph } = await import('../lib/kb.mjs');
      const graph = kbGraph(db, {
        project: flags.project || null,
        depth: Number(flags.depth || 2),
      });
      const out = { schema: 'hq.kb-graph/1', ...graph };
      const lines = [
        `Nodes ${graph.nodes?.length ?? 0} · edges ${graph.edges?.length ?? 0}`,
        ...(graph.nodes || []).map((n) => `  ${n.kind}\t${n.id}\t${n.title}`),
      ];
      if (graph.reason) lines.push(`Reason ${graph.reason}`);
      emit(flags, out, lines.join('\n'));
      return 0;
    }

    if (action === 'remember') {
      const text = positional.join(' ').trim();
      const usage = 'usage: hq kb remember <text> [--tier now|later] [--project <name>]';
      if (!text) { emit(flags, { ok: false, error: usage }, usage); return 2; }
      const tier = flags.tier || 'now';
      if (tier !== 'now' && tier !== 'later') {
        const message = `hq kb remember: tier "${tier}" is not offered here (now|later); use \`hq note promote <id> --to canon --owner-confirmed\``;
        emit(flags, { ok: false, error: message }, message);
        return 2;
      }
      const { kbRemember } = await import('../lib/kb.mjs');
      const note = kbRemember(db, {
        text,
        tier,
        project: flags.project || null,
      });
      const out = { schema: 'hq.kb-remember/1', ...note };
      emit(flags, out, `Saved to ${memoryTierLabel(note.tier)}: ${note.id}`);
      return 0;
    }

    process.stderr.write(`hq: unknown kb action ${action}\n`);
    process.stdout.write(kbUsage());
    return 2;
  } finally {
    db.close();
  }
}

async function cmdLake(positional, flags) {
  const { root, db } = openWorkspace();
  const { ingestProject, queryCommits, drift } = await import('../lib/lake.mjs');
  const action = positional.shift() || 'status';
  try {
    if (action === 'ingest') {
      let projects = projectsForIndex(root);
      if (flags.project) projects = projects.filter((p) => p.name === flags.project);
      const results = [];
      for (const project of projects) {
        results.push(ingestProject(db, project, { limit: Number(flags.limit || 500) }));
      }
      emit(flags, { schema: 'hq.lake-ingest/1', results }, results.map((r) => `${r.project}: +${r.inserted} commits`).join('\n'));
      return 0;
    }
    if (action === 'query') {
      const rows = queryCommits(db, { project: flags.project, since: flags.since, path: flags.path, type: flags.type, limit: Number(flags.limit || 50) });
      emit(flags, { schema: 'hq.lake-query/1', commits: rows }, rows.map((r) => `${r.date.slice(0, 10)} ${r.project} ${r.type || ''} ${r.subject}`).join('\n'));
      return 0;
    }
    const result = drift(db, { root, projects: projectsForIndex(root) });
    emit(flags, { schema: 'hq.lake-drift/1', ...result },
      [
        `Stale indexes: ${result.staleIndex?.length ?? 0}`,
        `Dirty spaces: ${result.dirty?.length ?? 0}`,
        `Ahead/behind: ${result.aheadBehind?.length ?? 0}`,
        `Stale docs: ${result.staleDocs?.length ?? 0}`,
        `Open tasks: ${result.todos?.length ?? 0}`,
        `Missing docs: ${result.missingDocs?.length ?? 0}`,
      ].join('\n'));
    return 0;
  } finally {
    db.close();
  }
}

async function cmdWatch(flags) {
  const { root, config, db } = openWorkspace();
  const { watchWorkspace } = await import('../lib/automation.mjs');
  const {
    runRefreshPipeline, isPaused, appendLogLine, readWatcherState, WATCH_PID, WATCH_LOG,
  } = await import('../lib/refresh.mjs');
  const all = projectsForIndex(root);

  // --spaces a,b restricts the daemon to a subset of registered spaces.
  let projects = all;
  if (flags.spaces) {
    const wanted = new Set(String(flags.spaces).split(',').map((s) => s.trim()).filter(Boolean));
    projects = all.filter((p) => wanted.has(p.name));
    if (!projects.length) { db.close(); return fail(1, `no such space(s): ${flags.spaces}`); }
  }
  const wikiOptions = profileOptions(config, 'wiki');
  const debounceMs = Number(flags.debounce || 800);

  // Post-reindex pipeline: whenever a debounced reindex actually changes
  // indexed content, `hq refresh`'s shared pipeline regenerates only stale
  // wiki pages, runs the strict gate and appends .hq/refresh.log lines with
  // reason 'watch'. Derived documentation stays current with no manual or
  // AI-driven step.
  const wikiDebounceMs = Math.max(0, Number(flags['wiki-debounce'] ?? 4000));
  const pipeline = {
    reindexes: 0, wikiRuns: 0, lastWikiAt: null, lastWikiOk: null,
    lastGateAt: null, lastGateOk: null, lastGateStale: 0, pausedRefreshes: 0,
  };
  const spaceDeltas = new Map(); // name -> {files, ms}, consumed by the next settle
  let wikiTimer = null;
  let wikiQueued = false;
  let wikiRunning = false;
  let stopping = false;

  function line(text) { process.stdout.write(`${nowISO()} ${text}\n`); }
  function wlog(text) { try { appendLogLine(root, WATCH_LOG, text); } catch { /* best effort */ } }
  const pausedNow = () => isPaused(root);

  function scheduleWiki(delayMs) {
    if (flags['no-wiki'] || stopping) return;
    wikiQueued = true;
    if (wikiTimer || wikiRunning) return;
    wikiTimer = setTimeout(() => { wikiTimer = null; void runSettle(); }, delayMs);
    wikiTimer.unref?.();
  }

  // One settle consumes the accumulated per-space deltas: wiki regeneration is
  // global (the generator's per-page hash skips everything current), so spaces
  // changed in the same window share a single wiki pass. A settle already in
  // flight is joined, never duplicated — `--once` can await the timer-started
  // pass instead of racing it.
  let activeSettle = null;
  function runSettle() {
    if (activeSettle) return activeSettle;
    const run = (async () => {
      if (wikiRunning || stopping) return;
      if (pausedNow()) {
        pipeline.pausedRefreshes += 1;
        line('paused (.hq/watch.pause present) — refreshes skipped, watching continues');
        wlog('paused');
        return; // deltas stay queued for the first settle after resume
      }
      wikiRunning = true;
      wikiQueued = false;
      const consumed = new Map(spaceDeltas);
      for (const name of consumed.keys()) spaceDeltas.delete(name);
      try {
        const dirty = projects.filter((p) => consumed.has(p.name));
        const result = await runRefreshPipeline({
          root, config, db, projects: all, spaces: dirty,
          indexResults: consumed, reason: 'watch', operation: 'watch',
          maxFileBytes: flags['max-file-bytes'] || null,
          maxFilePages: wikiOptions.wikiMaxFilePages,
        });
        if (result.skipped) {
          // A concurrent refresh (hook/CLI) holds the lock: re-queue our deltas.
          for (const [name, delta] of consumed) if (!spaceDeltas.has(name)) spaceDeltas.set(name, delta);
          line(`refresh deferred: lock held by pid ${result.heldBy}`);
          wlog(`deferred heldBy=${result.heldBy}`);
          scheduleWiki(Math.min(wikiDebounceMs, 2000));
          return;
        }
        pipeline.wikiRuns += 1;
        pipeline.lastWikiAt = nowISO();
        pipeline.lastWikiOk = !result.wiki.error;
        pipeline.lastGateAt = nowISO();
        pipeline.lastGateOk = result.staleCount === 0;
        pipeline.lastGateStale = result.staleCount;
        line(`wiki ${result.wiki.written} written ${result.wiki.skipped} unchanged; gate ${result.staleCount === 0 ? 'ok' : `stale=${result.staleCount}`}`);
        if (result.wiki.error) line(`wiki error: ${result.wiki.error}`);
        for (const space of result.spaces) {
          wlog(`refresh ${space.name} reason=watch files=${space.files} pages=${space.pages} ${space.durationMs}ms`);
        }
      } catch (error) {
        pipeline.lastWikiOk = false;
        line(`refresh error: ${error?.message || error}`);
        wlog(`refresh error: ${error?.message || error}`);
      } finally {
        wikiRunning = false;
        if (wikiQueued && !stopping) scheduleWiki(Math.min(wikiDebounceMs, 1000));
      }
    })();
    activeSettle = run;
    run.catch(() => {}).finally(() => { if (activeSettle === run) activeSettle = null; });
    return run;
  }

  const watcher = watchWorkspace({
    root, db, projects,
    debounceMs,
    indexOptions: { maxFileBytes: config.maxFileBytes, ignores: config.ignores },
    isPaused: pausedNow,
    onEvent: (event) => {
      recordTiming(db, {
        operation: 'watch', project: event.project || null,
        durationMs: Number(event.durationMs || 0),
        ok: event.event !== 'error' && event.event !== 'watch-error',
        meta: {
          event: event.event || 'change',
          ...(event.message ? { message: event.message } : {}),
        },
      });
      process.stdout.write(`${nowISO()} ${event.project || ''} ${event.event || 'change'} ${event.durationMs ? event.durationMs + 'ms' : ''}${event.message ? ' — ' + event.message : ''}\n`);
      if (event.event === 'paused') return;
      if (event.event === 'watch-error') {
        // Backend failure (e.g. inotify ENOSPC): the poll fallback keeps the
        // space covered; keep an audit line in .hq/watch.log for doctor.
        wlog(`watch-error ${event.project || ''} ${event.message || ''}`);
        return;
      }
      const idx = event.event === 'change' ? event.result?.index : null;
      const delta = idx ? (idx.added || 0) + (idx.changed || 0) + (idx.removed || 0) : 0;
      if (delta > 0) {
        pipeline.reindexes += 1;
        const prev = spaceDeltas.get(event.project) || { files: 0, ms: 0 };
        spaceDeltas.set(event.project, { files: prev.files + delta, ms: prev.ms + Number(event.durationMs || 0) });
        scheduleWiki(wikiDebounceMs);
      }
    },
  });
  process.stdout.write(`Watching ${projects.length} space(s). Ctrl+C to stop.\n`);

  if (flags.once) {
    wlog(`start mode=once spaces=${projects.map((p) => p.name).join(',')}`);
    await watcher.flush();
    // Join or start the single settle: clear a pending timer so the explicit
    // settle is the only one, then stop accepting new work before closing.
    if (wikiTimer) { clearTimeout(wikiTimer); wikiTimer = null; }
    if (!flags['no-wiki']) {
      await runSettle();
    } else {
      const stale = await collectStale({ db, config, projects, capOverride: flags['max-file-bytes'] });
      pipeline.lastGateAt = nowISO();
      pipeline.lastGateOk = stale.length === 0;
      pipeline.lastGateStale = stale.length;
    }
    stopping = true;
    watcher.stop();
    db.close();
    const gate = pipeline.lastGateOk === false ? `stale=${pipeline.lastGateStale}` : 'ok';
    if (pipeline.pausedRefreshes > 0) {
      line('once: paused (refreshes skipped by .hq/watch.pause)');
      wlog('stop mode=once paused');
      return 0;
    }
    line(`once: reindexes=${pipeline.reindexes} wikiRuns=${pipeline.wikiRuns} gate=${gate}`);
    wlog(`stop mode=once reindexes=${pipeline.reindexes} wikiRuns=${pipeline.wikiRuns} gate=${gate}`);
    return pipeline.lastGateOk === false || pipeline.lastWikiOk === false ? 1 : 0;
  }

  // Daemon mode: one instance per workspace, liveness via .hq/watch.pid.
  const state = readWatcherState(root);
  if (state.running && state.pid !== process.pid) {
    watcher.stop();
    db.close();
    return fail(1, `a watcher is already running (pid ${state.pid}, started ${state.startedAt || 'unknown'}). Stop it first or use --once.`);
  }
  const pidPath = join(root, '.hq', WATCH_PID);
  mkdirSync(join(root, '.hq'), { recursive: true });
  writeFileSync(pidPath, `${JSON.stringify({ pid: process.pid, startedAt: nowISO(), spaces: projects.map((p) => p.name), debounceMs })}\n`, 'utf8');
  wlog(`start mode=daemon pid=${process.pid} spaces=${projects.map((p) => p.name).join(',')} debounce=${debounceMs} wikiDebounce=${wikiDebounceMs}`);

  // Resume detector: while paused the watcher stays alive but skips refreshes;
  // the moment the sentinel disappears, one full catch-up absorbs the backlog.
  // This timer is deliberately NOT unref'd: in pure-poll mode (every native
  // fs.watch errored — e.g. inotify ENOSPC — and closed) no other handle
  // holds the event loop, and an unref'd-only daemon would exit silently.
  // The 5s pause check is the daemon's explicit keepalive.
  let wasPaused = pausedNow();
  const pauseTimer = setInterval(() => {
    if (stopping) return;
    const now = pausedNow();
    if (now && !wasPaused) {
      line('paused (.hq/watch.pause present) — refreshes skipped, watching continues');
      wlog('paused');
    } else if (!now && wasPaused) {
      line('resumed — catching up on changes made while paused');
      wlog('resumed');
      void watcher.flush();
    }
    wasPaused = now;
  }, 5000);

  const stop = (signal) => {
    stopping = true;
    if (wikiTimer) { clearTimeout(wikiTimer); wikiTimer = null; }
    clearInterval(pauseTimer);
    watcher.stop();
    // Clean exit removes the pid file; an unclean kill leaves it for doctor
    // to report as a stale pid.
    try {
      const info = JSON.parse(readFileSync(pidPath, 'utf8'));
      if (Number(info?.pid) === process.pid) rmSync(pidPath, { force: true });
    } catch { /* already gone */ }
    wlog(`stop pid=${process.pid} signal=${signal || 'exit'}`);
    db.close();
    process.exit(0);
  };
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));
  // Persistent mode still begins with one full pass: a restarted watcher must
  // absorb drift that happened while it was not running, not only events from
  // now on. flush() is a full catch-up by contract.
  void watcher.flush();
  await new Promise(() => {});
  return 0;
}

/**
 * cmdRefresh — one command, three incremental stages: re-index only changed
 * files for the space(s), regenerate only stale wiki pages, run the strict
 * freshness gate. Lock-protected (.hq/refresh.lock) and audited
 * (.hq/refresh.log, Europe/Paris ISO-8601). This is the primitive the watch
 * daemon and the git hooks funnel through.
 */
async function cmdRefresh(positional, flags) {
  const { root, config, db } = openWorkspace();
  const { runRefreshPipeline } = await import('../lib/refresh.mjs');
  const all = projectsForIndex(root);
  const selector = positional[0] || flags.space || flags.project || null;
  const projects = selectProjects(all, selector);
  if (!projects.length) { db.close(); return fail(1, `no such space: ${selector}`); }
  const options = profileOptions(config, 'wiki');
  const reason = String(flags.reason || 'manual').slice(0, 200);
  const started = performance.now();
  const result = await runRefreshPipeline({
    root, config, db, projects: all, spaces: projects, reason, operation: 'refresh',
    maxFileBytes: flags['max-file-bytes'] || null,
    maxFilePages: options.wikiMaxFilePages,
  });
  try {
    recordTiming(db, {
      operation: 'refresh', project: null,
      durationMs: Math.round(performance.now() - started),
      ok: !result.skipped && result.gateOk !== false,
      meta: { reason, skipped: result.skipped === true, spaces: result.spaces.map((s) => s.name) },
    });
  } catch { /* telemetry must not fail the command */ }
  if (result.skipped) {
    db.close();
    const text = `refresh skipped: another refresh is running (pid ${result.heldBy})`;
    emit(flags, { schema: 'hq.refresh/1', ok: true, skipped: true, heldBy: result.heldBy }, text);
    return 0;
  }
  const gate = result.staleCount === 0 ? 'ok' : `stale=${result.staleCount}`;
  const detail = result.spaces.map((s) => `${s.name}: files=${s.files} pages=${s.pages} (${s.durationMs}ms)`);
  // --quiet keeps one compact line per space (what git hooks append to
  // .hq/hooks.log); the default output adds the wiki summary.
  const text = flags.quiet && !flags.json
    ? detail.map((d) => `refresh ${d}`).join('\n')
    : `Refreshed ${result.spaces.length} space(s) (${result.durationMs}ms)\n${detail.map((d) => `  ${d}`).join('\n')}\nWiki: ${result.wiki.written} written, ${result.wiki.skipped} unchanged; gate ${gate}${result.wiki.error ? `; wiki error: ${result.wiki.error}` : ''}`;
  emit(flags, { schema: 'hq.refresh/1', ok: true, reason, ...result }, text);
  db.close();
  return 0;
}

async function cmdHooks(positional, flags) {
  const root = findRoot();
  const { installHooks, uninstallHooks, statusHooks } = await import('../lib/automation.mjs');
  const action = positional[0] || 'install';
  const selector = flags.space || flags.project || null;
  const projects = selectProjects(projectsForIndex(root), selector);
  if (!projects.length) return fail(1, `no such space: ${selector}`);

  if (action === 'status') {
    const result = statusHooks({ root, projects });
    const lines = result.spaces.map((s) =>
      `${s.project}\t${s.git ? `${s.installed}/${s.hooks.length} hooks` : 'not a git repository'}${s.foreign ? ` (${s.foreign} foreign)` : ''}`);
    emit(flags, { schema: 'hq.hooks-status/1', ...result }, lines.join('\n'));
    return 0;
  }
  if (action === 'remove' || action === 'uninstall') {
    const result = uninstallHooks({ root, projects });
    emit(flags, { schema: 'hq.hooks/1', action, ...result },
      `Removed HQ hooks (${result.removed?.length ?? 0} hook file(s))`);
    return 0;
  }
  if (action !== 'install') {
    return fail(2, 'usage: hq hooks install|remove|status [--space <name>]');
  }
  const result = installHooks({ root, projects, force: flags.force === true });
  emit(flags, { schema: 'hq.hooks/1', action, ...result },
    `Installed HQ hooks (${result.installed?.length ?? 0} place(s), ${result.skipped?.length ?? 0} skipped). Hooks run "hq refresh" after git events; output lands in .hq/hooks.log.`);
  return 0;
}

async function cmdMcp() {
  const { root, db } = openWorkspace();
  const { serveStdio } = await import('../lib/mcp.mjs');
  process.stderr.write('hq mcp: ready on stdio\n');
  return serveStdio({ root, db });
}

// The COO's machine doctor. It diagnoses ZCode's provider config and the team's health without
// changing anything, so a broken provider config is caught before it silently empties the registry.
async function cmdZcodeDoctor(flags) {
  const { execFileSync } = await import('node:child_process');
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const v2 = join(home, '.zcode', 'v2');
  const report = { providerConfig: { ok: false, problems: [], providers: [] }, readiness: null, agents: null, budget: null, seats: null, zcode: null };

  // 1. The installed ZCode itself.
  try {
    const out = execFileSync('node', [join('C:/Program Files/ZCode/resources/glm/zcode.cjs'), 'doctor'], { encoding: 'utf8', timeout: 60000 });
    report.zcode = out.trim().split(/\r?\n/).slice(0, 8).join(' | ');
  } catch (e) {
    report.zcode = `zcode doctor failed: ${e.message}`;
  }

  // 2. The provider config — the file whose schema failure empties every provider at once.
  const providerConfigPath = join(v2, 'provider_config.json');
  try {
    const doc = JSON.parse(readFileSync(providerConfigPath, 'utf8'));
    report.providerConfig = validateProviderConfig(doc);
    report.readiness = providerReadiness(doc);
  } catch (e) {
    report.providerConfig = { ok: false, fatal: true, problems: [{ path: 'provider_config.json', code: 'unreadable', message: e.message, fix: 'restore the last known-good provider_config.json' }], providers: [] };
    report.readiness = { ok: false, usable: [], unusable: [], all: [], complete: 0, enabled: 0 };
  }

  // 3. Agent definition compliance.
  try {
    const agentsDir = join(home, '.zcode', 'agents');
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md')).map((f) => ({ file: f, text: readFileSync(join(agentsDir, f), 'utf8') }));
    report.agents = auditAgentCompliance(files);
  } catch (e) {
    report.agents = { total: 0, compliant: 0, gaps: [{ file: '(all)', gap: `agent definitions unreadable: ${e.message}` }] };
  }

  // 4. Model budget health.
  try {
    const { Database } = await import('bun:sqlite');
    const db = new Database(join(home, '.zcode', 'cli', 'db', 'db.sqlite'), { readonly: true });
    const now = Date.now();
    const rows = db.query('SELECT provider_id, model_id, status, started_at, duration_ms, input_tokens, output_tokens, error_type, error_code, error_message FROM model_usage WHERE started_at > ?').all(now - 5 * 3600 * 1000);
    db.close();
    const stats = summarizeUsage(rows, { now, windowMs: 5 * 3600 * 1000 });
    const health = new Map();
    for (const [key, rec] of stats) health.set(key, { ...rec, health: classifyHealth(rec) });
    report.readiness = providerReadiness(JSON.parse(readFileSync(providerConfigPath, 'utf8')), { health });
    let funded = 0, warn = 0, blocked = 0;
    const blockedKeys = [], warnKeys = [];
    for (const [key, rec] of health) {
      const state = rec.health.state;
      if (state === 'healthy') funded++;
      else if (state === 'warn' || state === 'unhealthy') { warn++; warnKeys.push(key); }
      else if (state === 'budget-blocked' || state === 'capped') { blocked++; blockedKeys.push(key); }
    }
    report.budget = { funded, warn, blocked, blockedKeys, warnKeys };
  } catch (e) {
    report.budget = { funded: 0, warn: 0, blocked: 0, blockedKeys: [], warnKeys: [], error: e.message };
  }

  // 5. Seats.
  try {
    const { loadSeats } = await import('../lib/channel-seats.mjs');
    const doc = loadSeats('C:/VIVIM/channel');
    report.seats = { total: (doc.seats || []).length, active: 0 };
  } catch (e) {
    report.seats = { total: 0, active: 0, error: e.message };
  }

  const lines = renderDoctor(report);
  if (report.zcode) lines.push('', 'ZCODE', `  ${report.zcode}`);
  emit(flags, report, lines.join(String.fromCharCode(10)));
  return report.providerConfig.fatal ? 1 : 0;
}

async function cmdDoctor(flags) {
  const { execFileSync } = await import('node:child_process');
  const checks = [];
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  checks.push({ name: 'node', ok: nodeMajor >= 24, detail: process.versions.node });
  try {
    const gitVersion = execFileSync('git', ['--version'], { encoding: 'utf8' }).trim();
    checks.push({ name: 'git', ok: true, detail: gitVersion });
  } catch {
    checks.push({ name: 'git', ok: false, detail: 'git not found' });
  }
  const root = findRoot();
  checks.push({ name: 'workspace', ok: existsSync(join(root, PROJECTS_FILE)) || existsSync(join(root, HQ_DIR)), detail: root });
  checks.push({ name: 'config', ok: existsSync(join(root, '.hq/config.json')), detail: join(root, '.hq/config.json') });
  checks.push({ name: 'database', ok: existsSync(dbPath(root)), detail: dbPath(root) });
  let counts = null;
  if (existsSync(dbPath(root))) {
    try {
      const db = openDb(dbPath(root));
      counts = { projects: count(db, 'projects'), files: count(db, 'files'), symbols: count(db, 'symbols') };
      db.close();
      checks.push({ name: 'index', ok: counts.files > 0, detail: `${counts.files} files, ${counts.symbols} symbols` });
    } catch (error) {
      checks.push({ name: 'index', ok: false, detail: error.message });
    }
  }
  const projects = loadProjects(root).projects;
  const missing = projects.filter((p) => !existsSync(resolveProjectPath(root, p.path)));
  checks.push({ name: 'spaces', ok: missing.length === 0, detail: `${projects.length} registered, ${missing.length} missing` });
  checks.push({ name: 'wiki', ok: existsSync(join(root, 'wiki', 'index.md')), detail: join(root, 'wiki') });

  // Footprint of the machine-local bulk directories. Informational only: a large
  // worktree is a hygiene signal, not a failed environment, so this check never
  // fails the doctor. `bun scripts/hygiene.mjs` names what is safe to reclaim.
  const { readdirSync, lstatSync } = await import('node:fs');
  const bulkDirs = ['.hq', 'research', 'harvest', 'wiki', '.tmp', '.work', 'sessions'];
  const measureTree = (start) => {
    let bytes = 0;
    const stack = [start];
    while (stack.length) {
      const current = stack.pop();
      let info;
      try { info = lstatSync(current); } catch { continue; }
      if (info.isSymbolicLink()) continue;
      if (info.isDirectory()) {
        try { for (const entry of readdirSync(current)) stack.push(join(current, entry)); } catch { /* an unreadable subtree contributes nothing */ }
        continue;
      }
      if (info.isFile()) bytes += info.size;
    }
    return bytes;
  };
  let footprintBytes = 0;
  const footprintParts = [];
  for (const name of bulkDirs) {
    const dir = join(root, name);
    if (!existsSync(dir)) continue;
    const bytes = measureTree(dir);
    footprintBytes += bytes;
    if (bytes > 0) footprintParts.push(`${name} ${formatBytes(bytes)}`);
  }
  checks.push({ name: 'footprint', ok: true, detail: `${formatBytes(footprintBytes)} — ${footprintParts.join(', ')} (reclaim: bun scripts/hygiene.mjs)` });

  // Always-on automation (informational only — it must never fail doctor):
  // watcher liveness, pause state, per-space hooks and the last refresh trail.
  let automation = null;
  const automationLines = [];
  try {
    const { readWatcherState, lastRefreshBySpace } = await import('../lib/refresh.mjs');
    const { statusHooks } = await import('../lib/automation.mjs');
    const watcher = readWatcherState(root);
    const hooks = statusHooks({ root, projects: projectsForIndex(root) });
    const lastRefresh = lastRefreshBySpace(root);
    automation = { watcher, hooks: hooks.spaces, lastRefresh };
    const watcherText = watcher.running
      ? `alive (pid ${watcher.pid}${watcher.startedAt ? `, started ${watcher.startedAt}` : ''})`
      : watcher.stale ? `not running (stale pid file ${watcher.pid})` : 'not running';
    automationLines.push(`  watcher: ${watcherText}${watcher.paused ? ' — PAUSED (.hq/watch.pause present)' : ''}`);
    for (const space of hooks.spaces) {
      automationLines.push(`  hooks: ${space.project} ${space.git ? `${space.installed}/${space.hooks.length} installed` : 'not a git repository'}${space.foreign ? `, ${space.foreign} foreign` : ''}`);
    }
    for (const [name, entry] of Object.entries(lastRefresh)) {
      automationLines.push(`  last refresh: ${name} ${entry.at} (${entry.reason}, files=${entry.files}, pages=${entry.pages})`);
    }
  } catch (error) {
    automationLines.push(`  automation: unavailable (${error?.message || error})`);
  }

  const out = {
    schema: 'hq.doctor/1', ok: checks.every((c) => c.ok), root, checks, counts,
    missing: missing.map((p) => p.name), automation,
  };
  const body = checks.map((c) => `${c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${c.detail}`).join('\n');
  emit(flags, out, automationLines.length ? `${body}\nAutomation\n${automationLines.join('\n')}` : body);
  return out.ok ? 0 : 1;
}

async function cmdCheck(flags) {
  const { root, config, db } = openWorkspace();
  const projects = selectProjects(projectsForIndex(root), flags.project);
  if (!projects.length) {
    db.close();
    return fail(1, `no such space: ${flags.project}`);
  }
  const stale = await collectStale({ db, config, projects, capOverride: flags['max-file-bytes'] });
  db.close();
  const out = { schema: 'hq.check/1', ok: stale.length === 0, staleCount: stale.length, stale: stale.slice(0, 200) };
  emit(flags, out, stale.length === 0 ? 'Index is current.' : `Index is stale: ${stale.length} file(s)\n${stale.slice(0, 20).map((s) => `  ${s.reason} ${s.project}/${s.path}`).join('\n')}`);
  return flags.strict && stale.length > 0 ? 1 : 0;
}

async function cmdConfig(flags) {
  const root = findRoot();
  const config = loadConfig(root);
  const projects = loadProjects(root);
  const out = { schema: 'hq.config/1', root, config, projects: projects.projects };
  emit(flags, out, [`Root: ${root}`, `DB: ${dbPath(root, config)}`, `Max file: ${formatBytes(config.maxFileBytes)}`, `Spaces: ${projects.projects.length}`, '', ...projects.projects.map((p) => `${p.name}\t${p.path}\t${(p.tags || []).join(',')}`)].join('\n'));
  return 0;
}

async function cmdReset(flags) {
  if (!flags.yes) return fail(2, 'refusing to reset without --yes');
  const root = findRoot();
  // Test isolation fence (ZAIQ-011): scripts/test-smart.mjs sets HQ_TEST_FENCE for the
  // test runner so a test-spawned reset can only destroy workspaces inside the fence
  // (os.tmpdir()); the operator's real workspace is never inside it. A sandboxed test
  // workspace (HQ_TEST_SANDBOX) lives under the fence and passes this check.
  const fence = process.env.HQ_TEST_FENCE;
  if (fence && String(fence).trim() && !isInsideDir(root, String(fence))) {
    return fail(2, `refusing to reset ${root}: HQ_TEST_FENCE ${resolve(String(fence))} is active and this workspace is outside it. Tests must reset a sandboxed workspace (HQ_TEST_SANDBOX); unset HQ_TEST_FENCE outside tests for a deliberate reset.`);
  }
  rmSync(join(root, HQ_DIR), { recursive: true, force: true });
  if (!flags['no-wiki']) rmSync(join(root, 'wiki'), { recursive: true, force: true });
  if (!flags['no-home']) rmSync(join(root, 'home.html'), { force: true });
  emit(flags, { schema: 'hq.reset/1', root, wiki: !flags['no-wiki'] },
    `Removed ${HQ_DIR}/ and ${flags['no-wiki'] ? 'kept wiki/' : 'wiki/'}`);
  return 0;
}

async function cmdExport(flags) {
  const { db } = openWorkspace();
  const format = flags.format || 'jsonl';
  if (format !== 'jsonl') { db.close(); return fail(2, 'supported format: jsonl'); }
  const lines = [];
  for (const row of db.prepare('SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id ORDER BY p.name, f.path').all()) {
    lines.push(JSON.stringify({ type: 'file', ...row }));
  }
  for (const row of db.prepare('SELECT s.*, f.path, p.name AS project FROM symbols s JOIN files f ON f.id = s.file_id JOIN projects p ON p.id = s.project_id ORDER BY p.name, f.path, s.line').all()) {
    lines.push(JSON.stringify({ type: 'symbol', ...row }));
  }
  for (const row of db.prepare('SELECT i.*, f.path, p.name AS project FROM imports i JOIN files f ON f.id = i.file_id JOIN projects p ON p.id = i.project_id ORDER BY p.name, f.path, i.line').all()) {
    lines.push(JSON.stringify({ type: 'import', ...row }));
  }
  for (const row of db.prepare('SELECT a.*, f.path, p.name AS project FROM annotations a JOIN files f ON f.id = a.file_id JOIN projects p ON p.id = a.project_id ORDER BY p.name, f.path, a.line').all()) {
    lines.push(JSON.stringify({ type: 'annotation', ...row }));
  }
  db.close();
  const text = lines.join('\n') + '\n';
  if (flags.out) { writeFileSync(resolve(String(flags.out)), text, 'utf8'); process.stdout.write(`Wrote ${lines.length} records\n`); }
  else process.stdout.write(text);
  return 0;
}

async function cmdProtocol(flags) {
  const { root } = openWorkspace();
  const { renderAgentProtocol, writeAgentProtocol } = await import('../lib/protocol.mjs');
  if (flags.write) {
    const result = writeAgentProtocol(root);
    emit(flags, { schema: 'hq.protocol/1', ...result }, `Protocol written: ${result.path} (${result.bytes} B)`);
    return 0;
  }
  process.stdout.write(renderAgentProtocol({ workspace: root }));
  return 0;
}

async function cmdDead(flags) {
  const { db } = openWorkspace();
  const rows = db.prepare(`
    SELECT s.name, s.kind, s.line, s.exported, f.path, p.name AS project
    FROM symbols s JOIN files f ON f.id = s.file_id JOIN projects p ON p.id = s.project_id
    WHERE s.exported = 1
      AND NOT EXISTS (SELECT 1 FROM imports i WHERE i.resolved_file_id = s.file_id AND i.file_id != s.file_id)
      AND (? IS NULL OR p.name = ?)
    ORDER BY p.name, f.path, s.line
    LIMIT ?
  `).all(flags.project || null, flags.project || null, Number(flags.limit || 100));
  db.close();
  const out = { schema: 'hq.dead/1', candidates: rows, authority: 'candidate_not_proof' };
  emit(flags, out, rows.length ? rows.map((r) => `${r.project}/${r.path}:${r.line} ${r.name} (${r.kind})`).join('\n') : 'No dead-code candidates.');
  return 0;
}

async function cmdTrace(positional, flags) {
  const { db } = openWorkspace();
  const task = positional.join(' ').trim();
  if (!task) { db.close(); return fail(2, 'usage: hq trace <task>'); }
  const { composeContext } = await import('../lib/context.mjs');
  const bundle = await composeContext(db, { task, project: flags.project, budgetTokens: Number(flags.budget || 3000) });
  db.close();
  const lines = [`Trace for "${task}" — ${bundle.sources.length} source(s)`];
  for (const source of bundle.sources) lines.push(`  ${source.ref} lines ${source.lines[0]}-${source.lines[1]}  ${source.reason}`);
  if (flags.json) emit(flags, bundle, '');
  else process.stdout.write(lines.join('\n') + '\n');
  return 0;
}

async function cmdDocs(positional, flags) {
  const { root, db } = openWorkspace();
  try {
    const canon = await import('../lib/canon.mjs');
    const action = positional.shift() || 'list';
    if (action === 'index') {
      const projects = projectsForIndex(root).filter((p) => !flags.project || p.name === flags.project);
      const results = [];
      for (const project of projects) {
        results.push({
          project: project.name,
          documents: canon.indexDocuments(db, project),
          decisions: canon.indexDecisions(db, project),
          canon: canon.indexCanonTerms(db, project),
        });
      }
      emit(flags, { schema: 'hq.docs-index/1', results },
        results.map((r) => `${r.project}: ${r.documents.count} docs, ${r.decisions.decisions} decisions, ${r.canon.terms} terms`).join('\n'));
      return 0;
    }
    if (action === 'health') {
      const result = canon.documentHealth(db, { root, projects: projectsForIndex(root) });
      emit(flags, { schema: 'hq.docs-health/1', ...result }, [
        'Document health',
        `Missing families: ${result.missingFamilies?.length ?? 0}`,
        `Orphans: ${result.orphanDocs?.length ?? 0}`,
        `Stale: ${result.staleDocs?.length ?? 0}`,
        `Duplicates: ${result.duplicateDocs?.length ?? 0}`,
        `Conflicts: ${result.conflicts?.length ?? 0}`,
      ].join('\n'));
      return 0;
    }
    const where = [];
    const params = [];
    if (flags.family) { where.push('d.family = ?'); params.push(String(flags.family)); }
    if (flags.authority) { where.push('d.authority = ?'); params.push(String(flags.authority)); }
    if (flags.project) { where.push('p.name = ?'); params.push(String(flags.project)); }
    const rows = db.prepare(`SELECT d.*, p.name AS project FROM documents d JOIN projects p ON p.id = d.project_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY d.family, p.name, d.path LIMIT ?`)
      .all(...params, Number(flags.limit || 500));
    emit(flags, { schema: 'hq.docs/1', count: rows.length, documents: rows },
      rows.length
        ? rows.map((r) => `${r.family || '--'} ${r.role || ''}\t${r.project}/${r.path}\t${r.authority || ''}\t${r.lifecycle || ''}`).join('\n')
        : 'No documents classified yet. Run: hq docs index');
    return 0;
  } finally {
    db.close();
  }
}

async function cmdDecisions(positional, flags) {
  const { root, db } = openWorkspace();
  try {
    const canon = await import('../lib/canon.mjs');
    const action = positional[0];
    if (action === 'index') {
      const projects = projectsForIndex(root).filter((p) => !flags.project || p.name === flags.project);
      const results = projects.map((project) => ({ project: project.name, ...canon.indexDecisions(db, project) }));
      emit(flags, { schema: 'hq.decisions-index/1', results }, results.map((r) => `${r.project}: ${r.decisions} decisions (+${r.added} ~${r.changed} -${r.removed})`).join('\n'));
      return 0;
    }
    if (action === 'confirm') {
      const id = positional[1];
      if (!id) return fail(2, 'usage: hq decisions confirm <id> --owner-confirmed');
      const decision = canon.confirmDecision(db, { id, ownerConfirmed: flags['owner-confirmed'] === true });
      emit(flags, decision, `Decision accepted: ${decision.id} ${decision.title}`);
      return 0;
    }
    if (action === 'supersede') {
      const id = positional[1];
      if (!id || !flags.by) return fail(2, 'usage: hq decisions supersede <id> --by <new-id> --owner-confirmed');
      const result = canon.supersedeDecision(db, { id, by: flags.by, ownerConfirmed: flags['owner-confirmed'] === true });
      emit(flags, result, `Superseded ${id} by ${flags.by}`);
      return 0;
    }
    const query = positional.join(' ').trim();
    const rows = canon.decisionRegister(db, {
      project: flags.project, status: flags.status, query: query || null,
      limit: Number(flags.limit || 50),
    });
    emit(flags, { schema: 'hq.decisions/1', count: rows.length, decisions: rows },
      rows.length
        ? rows.map((d) => `${d.status}\t${d.authority}\t${d.date || '-'}\t${d.title}\t${d.source_path || ''}`).join('\n')
        : 'No decisions.');
    return 0;
  } catch (error) {
    if (String(error.message).includes('OWNER_CONFIRMATION_REQUIRED')) {
      return fail(3, 'owner confirmation required: pass --owner-confirmed');
    }
    throw error;
  } finally {
    db.close();
  }
}

async function cmdCanon(positional, flags) {
  const { root, db } = openWorkspace();
  try {
    const canon = await import('../lib/canon.mjs');
    const action = positional[0];
    if (action === 'index') {
      const projects = projectsForIndex(root).filter((p) => !flags.project || p.name === flags.project);
      const results = projects.map((project) => ({ project: project.name, ...canon.indexCanonTerms(db, project) }));
      emit(flags, { schema: 'hq.canon-index/1', results }, results.map((r) => `${r.project}: ${r.terms} terms (+${r.added} ~${r.changed} -${r.removed})`).join('\n'));
      return 0;
    }
    if (action === 'confirm') {
      const id = positional[1];
      if (!id) return fail(2, 'usage: hq canon confirm <id> --owner-confirmed');
      const term = canon.confirmTerm(db, { id, ownerConfirmed: flags['owner-confirmed'] === true });
      emit(flags, term, `CANON term current: ${term.term}`);
      return 0;
    }
    if (action === 'deprecate') {
      const id = positional[1];
      if (!id) return fail(2, 'usage: hq canon deprecate <id> --owner-confirmed');
      const term = canon.deprecateTerm(db, { id, ownerConfirmed: flags['owner-confirmed'] === true });
      emit(flags, term, `CANON term deprecated: ${term.term}`);
      return 0;
    }
    const query = positional.join(' ').trim();
    const rows = canon.canonRegister(db, {
      project: flags.project, status: flags.status, query: query || null,
      limit: Number(flags.limit || 50),
    });
    emit(flags, { schema: 'hq.canon/1', count: rows.length, terms: rows },
      rows.length
        ? rows.map((t) => `${t.status}\t${t.term}\t${t.definition || ''}\t${t.source_path || ''}`).join('\n')
        : 'No CANON terms.');
    return 0;
  } catch (error) {
    if (String(error.message).includes('OWNER_CONFIRMATION_REQUIRED')) {
      return fail(3, 'owner confirmation required: pass --owner-confirmed');
    }
    throw error;
  } finally {
    db.close();
  }
}

async function cmdConflicts(flags) {
  const { root, db } = openWorkspace();
  try {
    const canon = await import('../lib/canon.mjs');
    const health = canon.documentHealth(db, { root, projects: projectsForIndex(root) });
    const conflicts = health.conflicts || [];
    emit(flags, { schema: 'hq.conflicts/1', conflicts, health },
      conflicts.length
        ? conflicts.map((c) => `${c.kind}\t${c.a || ''}\t${c.b || ''}\t${c.message || ''}`).join('\n')
        : 'No document, decision or CANON conflicts.');
    return 0;
  } finally {
    db.close();
  }
}

async function cmdFiletypes(flags) {
  const { root } = openWorkspace();
  const { loadRegistry, typesForFamily, typesForRole, validateRegistry } = await import('../lib/filetypes.mjs');
  const registry = loadRegistry(root);
  let types = registry.types || [];
  if (flags.family) types = typesForFamily(registry, String(flags.family));
  if (flags.role) types = typesForRole(registry, String(flags.role));
  if (flags.limit) types = types.slice(0, Number(flags.limit));
  const validation = validateRegistry(registry);
  const out = { schema: 'hq.filetypes/1', counts: registry.counts, validation, types };
  emit(flags, out, [
    `Agentic file registry — ${registry.counts?.records ?? 0} records / ${registry.counts?.catalog_patterns ?? 0} patterns / ${registry.counts?.repositories ?? 0} repos`,
    `Observed types: ${registry.counts?.observed_types ?? 0} | mapped: ${registry.counts?.mapped_records ?? 0} | unmapped: ${registry.counts?.unmapped_records ?? 0}`,
    validation.ok ? 'Registry valid.' : `Registry invalid: ${validation.errors.join('; ')}`,
    '',
    ...types.map((t) => `${t.id}\t${t.name}\tfamily ${t.family}\t${t.role}\tobserved ${t.observed_count}\t${t.source_class}`),
  ].join('\n'));
  return validation.ok ? 0 : 1;
}

async function cmdRulebook(flags) {
  const { root } = openWorkspace();
  const { loadRegistry, renderRuleBook } = await import('../lib/filetypes.mjs');
  const markdown = renderRuleBook(loadRegistry(root));
  if (flags.write) {
    const out = join(root, 'docs/AGENTIC-RULEBOOK.generated.md');
    writeFileSync(out, markdown, 'utf8');
    emit(flags, { schema: 'hq.rulebook/1', path: out, bytes: Buffer.byteLength(markdown, 'utf8') },
      `Rule book written: ${out} (${formatBytes(Buffer.byteLength(markdown, 'utf8'))})`);
    return 0;
  }
  process.stdout.write(markdown);
  return 0;
}

async function cmdDcb(positional, flags) {
  const { root, db } = openWorkspace();
  try {
    const action = positional.shift() || 'protocol';
    if (action === 'protocol') {
      const path = join(root, 'docs/DCB-PROTOCOL.md');
      if (!existsSync(path)) return fail(1, 'docs/DCB-PROTOCOL.md not found');
      process.stdout.write(readFileSync(path, 'utf8'));
      return 0;
    }
    if (action === 'explain') {
      const task = positional.join(' ').trim();
      if (!task) return fail(2, 'usage: hq dcb explain <task>');
      const { composeContext } = await import('../lib/context.mjs');
      const bundle = await composeContext(db, {
        task, project: flags.project, budgetTokens: Number(flags.budget || 6000),
        maxFiles: Number(flags['max-files'] || 24),
      });
      const out = {
        schema: 'hq.dcb-explain/1',
        task,
        protocol: 'hq.dcb-protocol/1',
        budget: bundle.budget,
        sources: bundle.sources.map((s) => ({ ref: s.ref, score: s.score, reason: s.reason, tokens: s.estimatedTokens })),
        omissions: bundle.omissions,
        digest: bundle.digest,
      };
      emit(flags, out, [
        `DCB explain — ${task}`,
        `${bundle.sources.length} sources | ${bundle.budget.used}/${bundle.budget.capacity} tokens | digest ${bundle.digest.slice(0, 16)}`,
        '',
        ...out.sources.map((s) => `${String(s.score).padStart(7)}  ${s.ref}  ${s.reason}  (${s.tokens} tok)`),
        '',
        'Omitted:',
        ...(out.omissions.length ? out.omissions.map((o) => `  ${o.ref} — ${o.reason}`) : ['  (none)']),
      ].join('\n'));
      return 0;
    }
    return fail(2, 'usage: hq dcb explain <task> | hq dcb protocol');
  } finally {
    db.close();
  }
}

async function cmdContextBudget(flags) {
  const dbPath = flags.db ? resolve(String(flags.db)) : 'C:/Users/VIVIM.inc/.zcode/cli/db/db.sqlite';
  if (!existsSync(dbPath)) return fail(1, `context-budget: no usage database at ${dbPath}`);
  const days = Number(flags.days ?? 3);
  const windowTokens = Number(flags.window ?? 1000000);
  const utilization = Number(flags.utilization ?? 0.8);
  const ceilingOverride = flags.ceiling === undefined ? null : Number(flags.ceiling);
  const idleMin = Number(flags['idle-min'] ?? 5);
  if (!Number.isFinite(days) || days <= 0) return fail(2, 'context-budget: --days must be positive');
  if (!Number.isFinite(ceilingOverride ?? 0) || (ceilingOverride !== null && ceilingOverride <= 0)) return fail(2, 'context-budget: --ceiling must be positive');
  if (!Number.isFinite(windowTokens) || windowTokens <= 0) return fail(2, 'context-budget: --window must be positive');
  if (!Number.isFinite(utilization) || utilization <= 0 || utilization > 1) return fail(2, 'context-budget: --utilization must be in (0, 1]');
  if (!Number.isFinite(idleMin) || idleMin < 0) return fail(2, 'context-budget: --idle-min must be >= 0');

  const now = Date.now();
  const windowMs = Math.round(days * 86400000);
  // Read-only by construction: this database belongs to the running harness, so this
  // command never writes, migrates or holds a write lock on it.
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const usage = db.prepare(
      `SELECT session_id, agent, provider_id, model_id, status, started_at, input_tokens, output_tokens,
              reasoning_tokens, cache_read_input_tokens, cache_creation_input_tokens, computed_total_tokens,
              retry_count, turn_id
         FROM model_usage WHERE started_at >= ?`,
    ).all(now - windowMs);
    const sessions = db.prepare(
      'SELECT id, parent_id, time_updated, time_compacting FROM session',
    ).all();
    const {
      census, planCompactions, renderContextBudget,
    } = await import('../lib/context-budget.mjs');
    const report = census(usage, { now, windowMs });
    const plan = planCompactions({
      sessions, usageRows: usage, now,
      ceiling: ceilingOverride ?? undefined,
      window: windowTokens,
      utilization,
      idleMs: Math.round(idleMin * 60000),
    });
    emit(flags, { database: dbPath, report, plan }, renderContextBudget(report, plan));
    return 0;
  } finally {
    db.close();
  }
}

async function cmdTiming(positional, flags) {
  const { root, config, db } = openWorkspace();
  const action = positional.shift() || 'report';
  const since = flags.since ? resolveSince(flags.since) : null;
  try {
    if (action === 'report') {
      const report = timingReport(db, { operation: flags.operation || null, since, limit: Number(flags.limit || 5000) });
      emit(flags, report, formatTimingReport(report));
      return 0;
    }
    if (action === 'budgets') {
      const report = budgetReport(db, config, { since });
      const lines = [`Budgets — profile ${report.profile}`, ''];
      for (const row of report.rows) {
        lines.push(`${row.ok ? 'ok  ' : 'OVER'} ${String(row.operation).padEnd(10)} p95 ${String(row.p95Ms).padStart(8)}ms / ${String(row.budget).padStart(8)}ms  ratio ${row.ratio}  priority ${row.priority}`);
      }
      if (!report.rows.length) lines.push('(no budgets)');
      emit(flags, report, lines.join('\n'));
      return 0;
    }
    if (action === 'optimize') {
      const result = optimize(db, config, { since });
      if (flags.apply) {
        const applied = applyRecommendations(config, result);
        saveConfig(root, applied.config);
        const out = { ...result, applied: applied.applied, skippedConflicts: applied.skippedConflicts };
        emit(flags, out, `${formatOptimize(result)}\n\nApplied: ${applied.applied.map((a) => a.id).join(', ') || 'none'}\nSkipped conflicts: ${applied.skippedConflicts.join(', ') || 'none'}`);
        return 0;
      }
      emit(flags, result, formatOptimize(result));
      return 0;
    }
    if (action === 'conflicts') {
      const result = optimize(db, config, { since });
      const out = {
        schema: 'hq.timing-conflicts/1',
        conflicts: result.conflicts,
        recommendations: result.recommendations.filter((r) => r.conflictsWith.length),
      };
      const lines = result.conflicts.length
        ? result.conflicts.map((c) => `${c.a} <> ${c.b} (${c.resource})`)
        : ['No conflicts.'];
      emit(flags, out, lines.join('\n'));
      return 0;
    }
    if (action === 'profile') {
      const name = positional[0] || flags.profile;
      if (!name) return fail(2, 'usage: hq timing profile <speed|balanced|quality>');
      const { config: next, changes } = applyProfile(config, name);
      saveConfig(root, next);
      emit(flags, { schema: 'hq.timing-profile/1', changes }, `Profile set to ${name}`);
      return 0;
    }
    if (action === 'priority') {
      const operation = positional[0];
      const value = positional[1];
      if (!operation || value == null) return fail(2, 'usage: hq timing priority <operation> <1-10>');
      const next = setPriority(config, operation, value);
      saveConfig(root, next);
      emit(flags, { schema: 'hq.timing-priority/1', operation, priority: next.performance.priorities[operation] },
        `${operation} priority = ${next.performance.priorities[operation]}`);
      return 0;
    }
    if (action === 'budget') {
      const operation = positional[0];
      const value = positional[1];
      if (!operation || value == null) return fail(2, 'usage: hq timing budget <operation> <ms>');
      const next = setBudget(config, operation, value);
      saveConfig(root, next);
      emit(flags, { schema: 'hq.timing-budget/1', operation, budget: next.performance.budgets[operation] },
        `${operation} budget = ${next.performance.budgets[operation]}ms`);
      return 0;
    }
    if (action === 'clear') {
      if (!flags.yes) return fail(2, 'refusing to clear timings without --yes');
      const deleted = db.prepare('DELETE FROM timings').run().changes;
      emit(flags, { schema: 'hq.timing-clear/1', deleted }, `Cleared ${deleted} timing span(s)`);
      return 0;
    }
    return fail(2, 'usage: hq timing report|budgets|optimize|conflicts|profile|priority|budget|clear');
  } finally {
    db.close();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const { positional, flags } = parse(argv);
  const command = positional.shift();

  if (flags.version || command === 'version') { process.stdout.write(`hq ${runtimeVersion()}\n`); return 0; }
  if (!command || command === 'help' || (flags.help && command !== 'kb')) { process.stdout.write(helpText()); return 0; }

  try {
    switch (command) {
      case 'init': return await cmdInit(flags);
      case 'project': return await cmdProject(positional, flags);
      case 'index': return await cmdIndex(positional, flags);
      case 'status': return await cmdStatus(flags);
      case 'search': return await cmdSearch(positional, flags);
      case 'find': return await cmdFind(positional, flags);
      case 'file': return await cmdFile(positional, flags);
      case 'deps': return await cmdDeps(positional, flags);
      case 'impact': return await cmdImpact(positional, flags);
      case 'context': return await cmdContext(positional, flags);
      case 'route': return await cmdRoute(positional, flags);
      case 'brief': return await cmdBrief(positional, flags);
      case 'handoff': return await cmdHandoff(positional, flags);
      case 'since': return await cmdSince(positional, flags);
      case 'note': return await cmdNote(positional, flags);
      case 'recall': return await cmdRecall(positional, flags);
      case 'todos': return await cmdTodos(positional, flags);
      case 'lint': return await cmdLint(flags);
      case 'docs': return await cmdDocs(positional, flags);
      case 'decisions': return await cmdDecisions(positional, flags);
      case 'canon': return await cmdCanon(positional, flags);
      case 'conflicts': return await cmdConflicts(flags);
      case 'filetypes': return await cmdFiletypes(flags);
      case 'rulebook': return await cmdRulebook(flags);
      case 'dcb': return await cmdDcb(positional, flags);
      case 'verify': return await cmdVerify(flags);
      case 'wiki': return await cmdWiki(positional, flags);
      case 'kg': return await cmdKg(positional, flags);
      case 'home': return await cmdHome(flags);
      case 'ask': return await cmdAsk(positional, flags);
      case 'feed': return await cmdFeed(flags);
      case 'lake': return await cmdLake(positional, flags);
    case 'vivim': return await cmdVivim(positional, flags);
      case 'media': return await cmdMedia(positional, flags);
      case 'kb': return await cmdKb(positional, flags);
      case 'capabilities': return await cmdCapabilities(positional, flags);
      case 'sessions': return await cmdSessions(positional, flags);
      case 'team': return await cmdTeam(positional, flags);
      case 'canvas': return await cmdCanvas(positional, flags);
      case 'pm': return await cmdPm(positional, flags);
      case 'route-model': return await cmdRouteModel(positional, flags);
      case 'review': return await cmdReview(positional, flags);
      case 'console': return await cmdConsole(flags);
      case 'seat': return await cmdSeat(positional, flags);
      case 'coordination': return await cmdCoordination(positional, flags);
      case 'autonomy': return await cmdAutonomy(positional, flags);
      case 'work': return await cmdWork(positional, flags);
      case 'comms': return await cmdComms(flags);
      case 'session-card': return await cmdSessionCard(flags);
      case 'threads': return await cmdThreads(positional, flags);
      case 'channel': return await cmdChannel(positional, flags);
      case 'actions': return await cmdActions(positional, flags);
      case 'action': return await cmdAction(positional, flags);
      case 'do': return await cmdDo(positional, flags);
      case 'fsf': return await cmdFsf(positional, flags);
      case 'watch': return await cmdWatch(flags);
      case 'refresh': return await cmdRefresh(positional, flags);
      case 'hooks': return await cmdHooks(positional, flags);
      case 'mcp': return await cmdMcp();
      case 'zcode-doctor': return await cmdZcodeDoctor(flags);
      case 'doctor': return await cmdDoctor(flags);
      case 'check': return await cmdCheck(flags);
      case 'timing': return await cmdTiming(positional, flags);
      case 'context-budget': return await cmdContextBudget(flags);
      case 'config': return await cmdConfig(flags);
      case 'reset': return await cmdReset(flags);
      case 'kernel': {
        // L1 lane: the store lives in hq/lib/kernel; L0 owns this dispatcher. Pass the
        // original argv because the top-level parser has already stripped subcommand flags.
        const { runKernelCli } = await import('../lib/kernel/cli.mjs');
        return await runKernelCli(argv.slice(1));
      }
      case 'export': return await cmdExport(flags);
      case 'protocol': return await cmdProtocol(flags);
      case 'dead': return await cmdDead(flags);
      case 'trace': return await cmdTrace(positional, flags);
      case 'annotate-v2': return await cmdAnnotateV2(positional, flags);
      case 'semantic': return await cmdSemantic(positional, flags);
      case 'glossary': process.stdout.write(glossaryMarkdown()); return 0;
      case 'receipts': {
        const { db } = openWorkspace();
        const { listReceipts } = await import('../lib/receipts.mjs');
        const receipts = listReceipts(db, { limit: Number(flags.limit || 20) });
        db.close();
        emit(flags, { schema: 'hq.receipts/1', receipts },
          receipts.length ? receipts.map((r) => `${r.createdAt} ${r.kind} ${r.task || ''} ${r.digest.slice(0, 12)}`).join('\n') : 'No receipts.');
        return 0;
      }
      default:
        process.stderr.write(`hq: unknown command "${command}"\n`);
        process.stdout.write(helpText());
        return 2;
    }
  } catch (error) {
    return fail(1, error.message);
  }
}

const code = await main();
process.exitCode = code;
