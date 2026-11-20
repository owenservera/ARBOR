# File: hq/bin/revive.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/bin/revive.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9591 B |
| Lines | 245 |
| Hash | 7f52b3510074 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO_ROOT | const | 25 | no | const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| JOURNAL | const | 26 | no | const JOURNAL = join(REPO_ROOT, &#39;hq&#39;, &#39;work&#39;, &#39;revive.jsonl&#39;); |
| ORDERS | const | 27 | no | const ORDERS = join(REPO_ROOT, &#39;hq&#39;, &#39;work&#39;, &#39;orders.json&#39;); |
| DEFAULT_INTERVAL_MS | const | 28 | no | const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; |
| readUsage | function | 35 | no | function readUsage(windowMs) { |
| home | const | 36 | no | const home = process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;; |
| dbPath | const | 37 | no | const dbPath = join(home, &#39;.zcode&#39;, &#39;cli&#39;, &#39;db&#39;, &#39;db.sqlite&#39;); |
| db | const | 39 | no | const db = new DatabaseSync(dbPath, { readOnly: true }); |
| rows | const | 40 | no | const rows = db.prepare( &#39;SELECT provider_id, model_id, status, started_at, duration_ms, input_tokens, output_tokens, error_type, error_code, error_message FROM model_usage WHERE started_at &gt; ?&#39;, ).a… |
| readAgents | function | 53 | no | function readAgents() { |
| home | const | 54 | no | const home = process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;; |
| agentsDir | const | 55 | no | const agentsDir = join(home, &#39;.zcode&#39;, &#39;agents&#39;); |
| files | const | 56 | no | const files = collectAgentFiles(agentsDir); |
| a | const | 58 | no | const a = parseAgentFile(f.text, f.file); |
| readLanes | function | 68 | no | function readLanes() { |
| ledger | const | 69 | no | const ledger = join(REPO_ROOT, &#39;hq&#39;, &#39;work&#39;, &#39;spawns.jsonl&#39;); |
| row | const | 73 | no | const row = JSON.parse(line); |
| applyReroute | function | 87 | no | function applyReroute(route, byName) { |
| agent | const | 88 | no | const agent = byName.get(route.agent); |
| before | const | 91 | no | const before = readFileSync(agent.path, &#39;utf8&#39;); |
| stamp | const | 92 | no | const stamp = new Date().toISOString().replace(/[:.]/g, &#39;-&#39;); |
| after | const | 94 | no | const after = before.replace(/^model:\\s*.*$/m, `model: ${route.to}`); |
| writeReviveOrders | function | 108 | no | function writeReviveOrders(revives) { |
| doc | variable | 110 | no | let doc; |
| existing | const | 113 | no | const existing = new Set(doc.orders.map((o) =&gt; String(o?.id ?? &#39;&#39;))); |
| added | variable | 114 | no | let added = 0; |
| id | const | 116 | no | const id = String(r.id); |
| runCycle | function | 141 | no | function runCycle(flags) { |
| windowMs | const | 142 | no | const windowMs = Number(flags.hours ?? 5) * 60 * 60 * 1000; |
| usageRows | const | 143 | no | const usageRows = readUsage(windowMs); |
| stats | const | 144 | no | const stats = summarizeUsage(usageRows, { now: Date.now(), windowMs }); |
| depotCatalog | variable | 146 | no | let depotCatalog = null; |
| home | const | 147 | no | const home = process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;; |
| catalogPath | const | 148 | no | const catalogPath = join(home, &#39;.zcode&#39;, &#39;provider-depot&#39;, &#39;catalog.json&#39;); |
| catalog | const | 150 | no | const catalog = buildCatalog({ depotCatalog, observed: [...stats.keys()] }); |
| agents | const | 152 | no | const agents = readAgents(); |
| lanes | const | 153 | no | const lanes = readLanes(); |
| cycle | const | 155 | no | const cycle = planReviveCycle({ agents, usageRows, catalog: Object.fromEntries(catalog), lanes, |
| applied | variable | 165 | no | let applied = []; |
| reviveOrders | variable | 166 | no | let reviveOrders = 0; |
| byName | const | 168 | no | const byName = new Map(agents.map((a) =&gt; [a.name, a])); |
| receipt | const | 173 | no | const receipt = { |
| parseArgs | function | 205 | no | function parseArgs(argv) { |
| out | const | 207 | no | const out = { _: [] }; |
| a | const | 209 | no | const a = argv[i]; |
| key | const | 211 | no | const key = a.slice(2); |
| next | const | 212 | no | const next = argv[i + 1]; |
| main | function | 220 | no | async function main() { |
| args | const | 221 | no | const args = parseArgs(process.argv.slice(2)); |
| flags | const | 222 | no | const flags = { |
| intervalMs | const | 229 | no | const intervalMs = Number(args.interval ?? DEFAULT_INTERVAL_MS); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 17 | external |
| node:path | import | 18 | external |
| node:url | import | 19 | external |
| node:sqlite | import | 20 | external |
| ../lib/revive-daemon.mjs | import | 21 | [hq/lib/revive-daemon.mjs](../lib/revive-daemon.mjs.md) |
| ../lib/model-router.mjs | import | 22 | [hq/lib/model-router.mjs](../lib/model-router.mjs.md) |
| ../lib/team-panel.mjs | import | 23 | [hq/lib/team-panel.mjs](../lib/team-panel.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 4 | context | — | — | The revive daemon CLI — the thing that actually runs when a model dies. Reads the ZCode |
| 8 | owner | hq-agent | — | hq-agent |
| 9 | task | — | — | revive-daemon |
| 10 | invariant | — | — | a reroute only ever rewrites the `model:` line of an agent definition, and only after a |
| 12 | invariant | — | — | every cycle writes one journal row to hq/work/revive.jsonl, applied or not — evidence |
| 14 | see | — | hq/lib/revive-daemon.mjs | hq/lib/revive-daemon.mjs · hq/lib/revive-lane.mjs · hq/bin/spawn.mjs |

## Excerpt

```javascript
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
```

_First 80 of 246 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
