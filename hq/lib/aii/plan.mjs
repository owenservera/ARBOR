// hq/lib/aii/plan.mjs — static AII fixture plan (PRD HQ-PRD-AII-001, redesign).
//
// Everything in this module is pure/read-only: it discovers fixture files,
// hashes them, resolves duplicate scenario ids through the committed manifest,
// classifies cost tiers and estimates wall time. It never imports a fixture and
// never executes a probe, so `aii-verify --plan` is safe at any time.
//
// Why a plan layer exists at all: the previous runner imported every fixture
// into one process before it knew how many there were, whether two files owned
// the same scenario id, or what the run was going to cost. That made a 30+
// minute run indistinguishable from a hung one and let a superseded duplicate
// invalidate a passing canonical fixture.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { canonicalJson } from '../util.mjs';

export const AII_PLAN_SCHEMA = 'hq.aii-plan/1';
export const AII_FIXTURE_MANIFEST_SCHEMA = 'hq.aii-fixture-manifest/1';
export const FIXTURE_NAME_RE = /^(HQ-\d{3})-[a-z0-9][a-z0-9-]*\.mjs$/;

// Tiers bound how much wall time a verification pass may spend. `standard`
// includes everything except fixtures whose static shape says they run cargo or
// one of the known slow HQ scans.
export const TIERS = ['fast', 'standard', 'heavy'];
const TIER_RANK = { fast: 0, standard: 1, heavy: 2 };

// Measured on this machine 2026-11-11/12 (single invocation, warm index).
// Used only for ETA ordering, never as a pass/fail signal.
const COMMAND_COST_MS = [
  [['docs', 'health'], 24000],
  [['conflicts'], 30000],
  [['lake', 'drift'], 6200],
  [['zcode-doctor'], 6800],
  [['since'], 1700],
  [['seat', 'list'], 1000],
  [['hooks', 'status'], 900],
  [['doctor'], 900],
  [['dead'], 500],
  [['impact'], 400],
  [['deps'], 400],
  [['status'], 400],
  [['pm'], 400],
  [['find'], 400],
  [['file'], 400],
  [['route-model'], 500],
  [['timing'], 300],
  [['receipts'], 300],
  [['capabilities'], 300],
  [['semantic'], 600],
  [['team'], 600],
  [['comms'], 600],
  [['project', 'list'], 400],
];
const DEFAULT_COMMAND_MS = 500;
const BUN_BOOT_MS = 250;
const MODULE_ONLY_MS = 120;
const CARGO_MS = 180_000; // cold-ish `cargo run --example` on this 4-core box
const SPAWN_MS = 400;

const HEAVY_COMMANDS = new Set(['docs health', 'conflicts', 'lake drift', 'zcode-doctor']);

export function sha256Text(value) {
  return createHash('sha256').update(String(value).replace(/\r\n/g, '\n')).digest('hex');
}

function emptyManifest() {
  return { schema: AII_FIXTURE_MANIFEST_SCHEMA, duplicates: {}, tiers: {}, timeouts: {}, source: null, errors: [] };
}

/**
 * loadFixtureManifest — read hq/aii/fixtures/manifest.json (optional file, but
 * required as soon as a scenario id has more than one fixture file).
 */
export function loadFixtureManifest(path) {
  if (!existsSync(path)) return emptyManifest();
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    return { ...emptyManifest(), source: path, errors: [`unparseable fixture manifest: ${err.message}`] };
  }
  const errors = [];
  if (parsed?.schema !== AII_FIXTURE_MANIFEST_SCHEMA) errors.push(`manifest schema must be ${AII_FIXTURE_MANIFEST_SCHEMA}`);
  const duplicates = parsed?.duplicates && typeof parsed.duplicates === 'object' ? parsed.duplicates : {};
  const tiers = parsed?.tiers && typeof parsed.tiers === 'object' ? parsed.tiers : {};
  const timeouts = parsed?.timeouts && typeof parsed.timeouts === 'object' ? parsed.timeouts : {};
  for (const [id, row] of Object.entries(duplicates)) {
    if (!/^HQ-\d{3}$/.test(id)) errors.push(`manifest duplicate key ${id} is not an HQ-NNN id`);
    if (!String(row?.canonical ?? '').trim()) errors.push(`manifest ${id}: canonical file is required`);
    if (!Array.isArray(row?.quarantined)) errors.push(`manifest ${id}: quarantined must be an array`);
    if (!String(row?.reason ?? '').trim()) errors.push(`manifest ${id}: a disposition reason is required`);
  }
  for (const [name, tier] of Object.entries(tiers)) {
    if (!TIERS.includes(tier)) errors.push(`manifest tier for ${name} must be one of ${TIERS.join(', ')}`);
  }
  for (const [name, ms] of Object.entries(timeouts)) {
    if (!Number.isFinite(Number(ms)) || Number(ms) <= 0) errors.push(`manifest timeout for ${name} must be a positive number`);
  }
  return { schema: AII_FIXTURE_MANIFEST_SCHEMA, duplicates, tiers, timeouts, source: path, errors };
}

/** discoverFixtureFiles — every HQ-NNN-*.mjs file, sorted, with content hash. */
export function discoverFixtureFiles(fixturesDir) {
  if (!existsSync(fixturesDir)) return [];
  const out = [];
  for (const name of readdirSync(fixturesDir).sort()) {
    if (!FIXTURE_NAME_RE.test(name)) continue;
    const path = join(fixturesDir, name);
    const stat = statSync(path);
    if (!stat.isFile()) continue;
    const text = readFileSync(path, 'utf8');
    out.push({
      name,
      path,
      relPath: `hq/aii/fixtures/${name}`,
      id: name.slice(0, 6),
      sha: sha256Text(text),
      bytes: stat.size,
      text,
    });
  }
  return out;
}

/**
 * extractProbes — best-effort static list of `runHq([...])` argument vectors.
 * Never executes anything. A fixture that builds args dynamically is reported
 * with `dynamic: true` so the cost model stays honest instead of guessing.
 */
export function extractProbes(sourceText) {
  const text = String(sourceText ?? '');
  const probes = [];
  const re = /runHq\(\s*\[([^\]]*)\]/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const body = match[1];
    const args = [];
    const argRe = /'([^']*)'|"([^"]*)"|`([^`$]*)`/g;
    let arg;
    let ok = true;
    while ((arg = argRe.exec(body)) !== null) args.push(arg[1] ?? arg[2] ?? arg[3]);
    // Anything that is not a literal (identifier, spread, template hole) makes
    // the static cost estimate approximate; keep the parsed prefix.
    if (/[A-Za-z_$][\w$]*\s*(?:,|\])/.test(body.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, ''))) ok = false;
    probes.push({ args, dynamic: !ok });
  }
  const spawnCount = (text.match(/spawnSync\(/g) ?? []).length;
  const cargo = /\bcargo\b/.test(text);
  return { probes, spawnCount, cargo };
}

export function commandCostMs(args) {
  const list = (args ?? []).map(String);
  for (const [prefix, ms] of COMMAND_COST_MS) {
    if (prefix.every((token, i) => list[i] === token)) return ms;
  }
  return DEFAULT_COMMAND_MS;
}

/** tierFor — fast | standard | heavy from static signals only. */
export function tierFor(entry) {
  const parsed = entry?.parsed ?? extractProbes(entry?.text);
  if (parsed.cargo) return 'heavy';
  for (const probe of parsed.probes) {
    if (HEAVY_COMMANDS.has(probe.args.slice(0, 2).join(' '))) return 'heavy';
  }
  if (parsed.probes.length === 0 && parsed.spawnCount === 0) return 'fast';
  return 'standard';
}

export function estimateMs(entry, { ewmaMs = null } = {}) {
  const parsed = entry?.parsed ?? extractProbes(entry?.text);
  let total = parsed.probes.length === 0 && parsed.spawnCount === 0 ? MODULE_ONLY_MS : BUN_BOOT_MS;
  for (const probe of parsed.probes) total += commandCostMs(probe.args);
  if (parsed.cargo) total += CARGO_MS;
  total += parsed.spawnCount * SPAWN_MS;
  // A measured duration dominates the static guess once one exists.
  if (Number.isFinite(ewmaMs) && ewmaMs > 0) return Math.round(0.25 * total + 0.75 * ewmaMs);
  return Math.round(total);
}

/**
 * classifyDuplicates — assign exactly one canonical fixture per scenario id.
 * A duplicate id without a manifest disposition is an error, never a silent
 * last-write-wins: the superseded sibling may not invalidate the canonical.
 */
export function classifyDuplicates(entries, manifest) {
  const errors = [];
  const byId = new Map();
  for (const entry of entries) {
    if (!byId.has(entry.id)) byId.set(entry.id, []);
    byId.get(entry.id).push(entry);
  }
  const policy = manifest?.duplicates ?? {};
  const rows = [];
  for (const [id, group] of [...byId].sort()) {
    if (group.length === 1) {
      rows.push({ ...group[0], role: 'canonical', duplicateOf: null });
      if (policy[id]) errors.push(`${id}: manifest declares duplicates but only one fixture file exists`);
      continue;
    }
    const declared = policy[id];
    if (!declared) {
      errors.push(`${id}: ${group.length} fixture files share this id and manifest.json has no disposition`);
      for (const entry of group) rows.push({ ...entry, role: 'unresolved', duplicateOf: null });
      continue;
    }
    const names = new Set(group.map((g) => g.name));
    if (!names.has(declared.canonical)) errors.push(`${id}: manifest canonical ${declared.canonical} does not exist`);
    for (const name of declared.quarantined) {
      if (!names.has(name)) errors.push(`${id}: manifest quarantined ${name} does not exist`);
    }
    const overlap = declared.quarantined.filter((n) => n === declared.canonical);
    if (overlap.length) errors.push(`${id}: ${overlap.join(', ')} is both canonical and quarantined`);
    const unlisted = group.filter((g) => g.name !== declared.canonical && !declared.quarantined.includes(g.name));
    if (unlisted.length) errors.push(`${id}: fixture file(s) missing a disposition: ${unlisted.map((g) => g.name).join(', ')}`);
    for (const entry of group) {
      if (entry.name === declared.canonical) rows.push({ ...entry, role: 'canonical', duplicateOf: null, disposition: declared.reason });
      else rows.push({ ...entry, role: 'quarantined', duplicateOf: declared.canonical, disposition: declared.reason });
    }
  }
  return { rows: rows.sort((a, b) => a.name.localeCompare(b.name)), errors };
}

/**
 * buildPlan — the single static description of a verification pass.
 * @param {{root: string, journal?: object, manifestPath?: string}} options
 */
export function buildPlan({ root, journal = null, manifestPath = null } = {}) {
  const fixturesDir = join(root, 'hq', 'aii', 'fixtures');
  const catalogPath = join(root, 'docs', 'AII-CATALOG.md');
  const manifest = loadFixtureManifest(manifestPath ?? join(fixturesDir, 'manifest.json'));
  const errors = [...manifest.errors];
  const discovered = discoverFixtureFiles(fixturesDir);
  if (discovered.length === 0) errors.push(`no fixture files found in ${relative(root, fixturesDir)}`);

  const { rows, errors: duplicateErrors } = classifyDuplicates(discovered, manifest);
  errors.push(...duplicateErrors);

  const durations = journal?.durations && typeof journal.durations === 'object' ? journal.durations : {};
  const fixtures = rows.map((entry) => {
    const parsed = extractProbes(entry.text);
    const tier = manifest.tiers[entry.name] ?? tierFor({ ...entry, parsed });
    const ewmaMs = Number(durations[entry.relPath]?.ewmaMs) || null;
    return {
      id: entry.id,
      name: entry.name,
      path: entry.path,
      relPath: entry.relPath,
      sha: entry.sha,
      bytes: entry.bytes,
      role: entry.role,
      duplicateOf: entry.duplicateOf,
      disposition: entry.disposition ?? null,
      tier,
      timeoutMs: Number(manifest.timeouts[entry.name]) || (tier === 'heavy' ? 300_000 : 120_000),
      probes: parsed.probes.length,
      spawns: parsed.spawnCount,
      cargo: parsed.cargo,
      dynamicProbes: parsed.probes.filter((p) => p.dynamic).length,
      estimatedMs: estimateMs({ ...entry, parsed }, { ewmaMs }),
      measuredMs: ewmaMs,
    };
  });

  const byTier = { fast: 0, standard: 0, heavy: 0 };
  const byRole = { canonical: 0, quarantined: 0, unresolved: 0 };
  for (const f of fixtures) {
    byTier[f.tier] += 1;
    byRole[f.role] = (byRole[f.role] ?? 0) + 1;
  }
  const catalogSha = existsSync(catalogPath) ? sha256Text(readFileSync(catalogPath, 'utf8')) : '';
  if (!catalogSha) errors.push('docs/AII-CATALOG.md is missing; receipt binding needs it');

  const duplicateIds = [...new Set(fixtures.filter((f) => f.duplicateOf).map((f) => f.id))].sort();
  return {
    schema: AII_PLAN_SCHEMA,
    root,
    catalogPath,
    catalogSha,
    fixturesDir,
    manifestSource: manifest.source ? relative(root, manifest.source).replaceAll('\\', '/') : null,
    fixtures,
    duplicates: duplicateIds.map((id) => ({
      id,
      canonical: fixtures.find((f) => f.id === id && f.role === 'canonical')?.name ?? null,
      quarantined: fixtures.filter((f) => f.id === id && f.role === 'quarantined').map((f) => f.name),
      reason: fixtures.find((f) => f.id === id && f.disposition)?.disposition ?? null,
    })),
    counts: { files: fixtures.length, byTier, byRole, uniqueIds: new Set(fixtures.map((f) => f.id)).size },
    errors,
  };
}

/** selectFixtures — deterministic subset selection for a run. */
export function selectFixtures(plan, { tier = 'all', only = [], skip = [], includeQuarantined = false } = {}) {
  const maxRank = TIER_RANK[tier] ?? TIER_RANK.standard;
  const onlySet = new Set(only);
  const skipSet = new Set(skip);
  return plan.fixtures.filter((f) => {
    if (f.role === 'unresolved') return false;
    if (f.role === 'quarantined' && !includeQuarantined) return false;
    if (onlySet.size && !onlySet.has(f.id)) return false;
    if (skipSet.has(f.id)) return false;
    if (tier !== 'all' && TIER_RANK[f.tier] > maxRank) return false;
    return true;
  });
}

/**
 * estimateRun — wall-time estimate for a selection under a worker pool. The
 * long-tail model (sum / jobs, then max single) is intentional: it is an ETA,
 * not a promise.
 */
export function estimateRun(fixtures, { jobs = 8 } = {}) {
  const estimates = fixtures.map((f) => f.estimatedMs);
  const totalMs = estimates.reduce((a, b) => a + b, 0);
  const longestMs = estimates.reduce((a, b) => Math.max(a, b), 0);
  const parallelMs = Math.max(longestMs, Math.ceil(totalMs / Math.max(1, jobs)));
  return {
    fixtures: fixtures.length,
    serialMs: totalMs,
    parallelMs,
    longestMs,
    jobs: Math.max(1, jobs),
    byTier: Object.fromEntries(TIERS.map((t) => [t, fixtures.filter((f) => f.tier === t).length])),
  };
}

export function planDigest(plan) {
  const { errors, ...stable } = plan;
  return sha256Text(canonicalJson(stable));
}
