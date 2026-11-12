#!/usr/bin/env node
// @ts-check
/**
 * @hq:context The revive daemon CLI — the thing that actually runs when a model dies. Reads the ZCode
 *   session usage table and the agent definitions, plans a cycle (detect dead model / stalled lane →
 *   pick next best safe model → reroute → order revive), optionally applies it, and journals the receipt.
 *   --watch runs it on a cycle so a model dying at 3am revives the factory without a human.
 * @hq:owner hq-agent
 * @hq:task revive-daemon
 * @hq:invariant a reroute only ever rewrites the `model:` line of an agent definition, and only after a
 *   backup copy is written beside it. No other file in the agent definition is touched.
 * @hq:invariant every cycle writes one journal row to hq/work/revive.jsonl, applied or not — evidence
 *   that the daemon was awake, not just a claim that it could be.
 * @hq:see hq/lib/revive-daemon.mjs · hq/lib/revive-lane.mjs · hq/bin/spawn.mjs
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { planReviveCycle, renderReviveCycle } from '../lib/revive-daemon.mjs';
import { buildCatalog, summarizeUsage } from '../lib/model-router.mjs';
import { collectAgentFiles, parseAgentFile } from '../lib/team-panel.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JOURNAL = join(REPO_ROOT, 'hq', 'work', 'revive.jsonl');
const ORDERS = join(REPO_ROOT, 'hq', 'work', 'orders.json');
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Read usage rows from the ZCode session DB (read-only).
 * @param {number} windowMs
 * @returns {Array<Object>}
 */
function readUsage(windowMs) {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const dbPath = join(home, '.zcode', 'cli', 'db', 'db.sqlite');
  try {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const rows = db.prepare(
      'SELECT provider_id, model_id, status, started_at, duration_ms, input_tokens, output_tokens, error_type, error_code, error_message FROM model_usage WHERE started_at > ?',
    ).all(Date.now() - windowMs);
    db.close();
    return rows;
  } catch {
    // The session store may be locked, missing, or the schema may differ. No usage
    // means no evidence of failure — the daemon reports "nothing proven dead", never "all fine".
    return [];
  }
}

/** @returns {Array<{name: string, model: string, path: string}>} */
function readAgents() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const agentsDir = join(home, '.zcode', 'agents');
  const files = collectAgentFiles(agentsDir);
  return files.map((f) => {
    const a = parseAgentFile(f.text, f.file);
    return {
      name: a.name || f.file.replace(/\.md$/, ''),
      model: a.model || 'inherit',
      path: join(agentsDir, f.file),
    };
  });
}

/** Read the spawn ledger so a lane that died mid-flight can be revived. @returns {Array<Object>} */
function readLanes() {
  const ledger = join(REPO_ROOT, 'hq', 'work', 'spawns.jsonl');
  if (!existsSync(ledger)) return [];
  return readFileSync(ledger, 'utf8').split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try {
      const row = JSON.parse(line);
      return row && typeof row.sessionId === 'string' ? [row] : [];
    } catch {
      return [];
    }
  });
}

/**
 * Apply a reroute: rewrite the `model:` line, after a backup.
 * @param {{agent: string, from: string, to: string}} route
 * @param {Map<string, {path: string}>} byName
 * @returns {{agent: string, from: string, to: string, ok: boolean, error?: string}}
 */
function applyReroute(route, byName) {
  const agent = byName.get(route.agent);
  if (!agent?.path) return { ...route, ok: false, error: 'agent file not found' };
  try {
    const before = readFileSync(agent.path, 'utf8');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    copyFileSync(agent.path, `${agent.path}.bak-revive-${stamp}`);
    const after = before.replace(/^model:\s*.*$/m, `model: ${route.to}`);
    if (after === before) return { ...route, ok: false, error: 'model line unchanged' };
    writeFileSync(agent.path, after, 'utf8');
    return { ...route, ok: true };
  } catch (error) {
    return { ...route, ok: false, error: String(error?.message ?? error) };
  }
}

/**
 * Write revive orders into the work queue so a lane can pick them up.
 * @param {Array<Object>} revives
 * @returns {number} how many were written
 */
function writeReviveOrders(revives) {
  if (!revives.length || !existsSync(ORDERS)) return 0;
  let doc;
  try { doc = JSON.parse(readFileSync(ORDERS, 'utf8')); } catch { return 0; }
  if (!Array.isArray(doc?.orders)) return 0;
  const existing = new Set(doc.orders.map((o) => String(o?.id ?? '')));
  let added = 0;
  for (const r of revives) {
    const id = String(r.id);
    if (existing.has(id)) continue;
    doc.orders.push({
      id,
      task: r.task,
      file: r.file,
      proofCommand: r.proofCommand,
      seat: null,
      status: 'open',
      createdAt: new Date().toISOString(),
      dependsOn: [],
      note: `Auto-generated by the revive daemon on a dead model or stalled lane. Model: ${r.model}.`,
    });
    existing.add(id);
    added += 1;
  }
  if (added) writeFileSync(ORDERS, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  return added;
}

/**
 * Run one cycle.
 * @param {{apply?: boolean, hours?: number, json?: boolean}} flags
 * @returns {number} exit code
 */
function runCycle(flags) {
  const windowMs = Number(flags.hours ?? 5) * 60 * 60 * 1000;
  const usageRows = readUsage(windowMs);
  const stats = summarizeUsage(usageRows, { now: Date.now(), windowMs });

  let depotCatalog = null;
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const catalogPath = join(home, '.zcode', 'provider-depot', 'catalog.json');
  try { depotCatalog = JSON.parse(readFileSync(catalogPath, 'utf8')); } catch { depotCatalog = null; }
  const catalog = buildCatalog({ depotCatalog, observed: [...stats.keys()] });

  const agents = readAgents();
  const lanes = readLanes();

  const cycle = planReviveCycle({
    agents,
    usageRows,
    catalog: Object.fromEntries(catalog),
    lanes,
    now: Date.now(),
    opts: { windowMs },
  });

  /** @type {Array<Object>} */
  let applied = [];
  let reviveOrders = 0;
  if (flags.apply) {
    const byName = new Map(agents.map((a) => [a.name, a]));
    applied = cycle.reroutes.map((r) => applyReroute(r, byName));
    reviveOrders = writeReviveOrders(cycle.revives);
  }

  const receipt = {
    at: new Date().toISOString(),
    applied: flags.apply === true,
    deadModels: cycle.deadModels,
    safeModel: cycle.safeModel?.key ?? null,
    reroutes: cycle.reroutes.map((r) => ({ agent: r.agent, from: r.from, to: r.to })),
    reroutesApplied: applied.filter((a) => a.ok).length,
    reroutesFailed: applied.filter((a) => !a.ok).map((a) => ({ agent: a.agent, error: a.error })),
    revives: cycle.revives.map((r) => ({ id: r.id, reviveOf: r.reviveOf, model: r.model })),
    reviveOrdersWritten: reviveOrders,
    actions: cycle.actions,
    code: cycle.code,
  };
  mkdirSync(dirname(JOURNAL), { recursive: true });
  appendFileSync(JOURNAL, `${JSON.stringify(receipt)}\n`, 'utf8');

  if (flags.json) {
    process.stdout.write(`${JSON.stringify({ ...cycle, applied, receipt })}\n`);
  } else {
    process.stdout.write(`${renderReviveCycle(cycle)}\n`);
    if (flags.apply) {
      process.stdout.write(`  applied: ${applied.filter((a) => a.ok).length} reroute(s), ${reviveOrders} revive order(s)\n`);
      for (const a of applied.filter((x) => !x.ok)) process.stdout.write(`  FAILED ${a.agent}: ${a.error}\n`);
    } else {
      process.stdout.write('  (dry run — pass --apply to reroute and write revive orders)\n');
    }
    process.stdout.write(`  journal: ${JOURNAL}\n`);
  }
  return cycle.deadModels.length && !cycle.safeModel ? 1 : 0;
}

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {{_: string[], [k: string]: any}} */
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const flags = {
    apply: args.apply === true && args['dry-run'] !== true,
    hours: Number(args.hours ?? 5),
    json: args.json === true,
  };

  if (args.watch === true) {
    const intervalMs = Number(args.interval ?? DEFAULT_INTERVAL_MS);
    process.stdout.write(`revive: watching every ${Math.round(intervalMs / 1000)}s — ${ORDERS}\n`);
    // A cycle that throws must not kill the watchdog.
    for (;;) {
      try {
        runCycle(flags);
      } catch (error) {
        process.stderr.write(`revive: cycle failed: ${String(error?.message ?? error)}\n`);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  process.exitCode = runCycle(flags);
}

if (process.argv[1] && resolve(process.argv[1]).endsWith('revive.mjs')) await main();
