# File: hq/lib/aii/plan.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/aii/plan.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14562 B |
| Lines | 335 |
| Hash | 78b8fcc7082e |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AII_PLAN_SCHEMA | const | 19 | yes | export const AII_PLAN_SCHEMA = &#39;hq.aii-plan/1&#39;; |
| AII_FIXTURE_MANIFEST_SCHEMA | const | 20 | yes | export const AII_FIXTURE_MANIFEST_SCHEMA = &#39;hq.aii-fixture-manifest/1&#39;; |
| FIXTURE_NAME_RE | const | 21 | yes | export const FIXTURE_NAME_RE = /^(HQ-\\d{3})-[a-z0-9][a-z0-9-]*\\.mjs$/; |
| TIERS | const | 26 | yes | export const TIERS = [&#39;fast&#39;, &#39;standard&#39;, &#39;heavy&#39;]; |
| TIER_RANK | const | 27 | no | const TIER_RANK = { fast: 0, standard: 1, heavy: 2 }; |
| COMMAND_COST_MS | const | 31 | no | const COMMAND_COST_MS = [ |
| DEFAULT_COMMAND_MS | const | 56 | no | const DEFAULT_COMMAND_MS = 500; |
| BUN_BOOT_MS | const | 57 | no | const BUN_BOOT_MS = 250; |
| MODULE_ONLY_MS | const | 58 | no | const MODULE_ONLY_MS = 120; |
| CARGO_MS | const | 59 | no | const CARGO_MS = 180_000; // cold-ish `cargo run --example` on this 4-core box |
| SPAWN_MS | const | 60 | no | const SPAWN_MS = 400; |
| HEAVY_COMMANDS | const | 62 | no | const HEAVY_COMMANDS = new Set([&#39;docs health&#39;, &#39;conflicts&#39;, &#39;lake drift&#39;, &#39;zcode-doctor&#39;]); |
| sha256Text | function | 64 | yes | export function sha256Text(value) { |
| emptyManifest | function | 68 | no | function emptyManifest() { |
| loadFixtureManifest | function | 76 | yes | export function loadFixtureManifest(path) { |
| parsed | variable | 78 | no | let parsed; |
| errors | const | 84 | no | const errors = []; |
| duplicates | const | 86 | no | const duplicates = parsed?.duplicates &amp;&amp; typeof parsed.duplicates === &#39;object&#39; ? parsed.duplicates : {}; |
| tiers | const | 87 | no | const tiers = parsed?.tiers &amp;&amp; typeof parsed.tiers === &#39;object&#39; ? parsed.tiers : {}; |
| timeouts | const | 88 | no | const timeouts = parsed?.timeouts &amp;&amp; typeof parsed.timeouts === &#39;object&#39; ? parsed.timeouts : {}; |
| discoverFixtureFiles | function | 105 | yes | export function discoverFixtureFiles(fixturesDir) { |
| out | const | 107 | no | const out = []; |
| path | const | 110 | no | const path = join(fixturesDir, name); |
| stat | const | 111 | no | const stat = statSync(path); |
| text | const | 113 | no | const text = readFileSync(path, &#39;utf8&#39;); |
| extractProbes | function | 132 | yes | export function extractProbes(sourceText) { |
| text | const | 133 | no | const text = String(sourceText ?? &#39;&#39;); |
| probes | const | 134 | no | const probes = []; |
| re | const | 135 | no | const re = /runHq\\(\\s*\\[([^\\]]*)\\]/g; let match; while ((match = re.exec(text)) !== null) { const body = match[1]; const args = []; |
| body | const | 138 | no | const body = match[1]; |
| args | const | 139 | no | const args = []; |
| argRe | const | 140 | no | const argRe = /&#39;([^&#39;]*)&#39;\|&quot;([^&quot;]*)&quot;\|`([^`$]*)`/g; |
| arg | variable | 141 | no | let arg; |
| ok | variable | 142 | no | let ok = true; |
| spawnCount | const | 149 | no | const spawnCount = (text.match(/spawnSync\\(/g) ?? []).length; const cargo = /\\bcargo\\b/.test(text); return { probes, spawnCount, cargo }; } |
| cargo | const | 150 | no | const cargo = /\\bcargo\\b/.test(text); |
| commandCostMs | function | 154 | yes | export function commandCostMs(args) { |
| list | const | 155 | no | const list = (args ?? []).map(String); |
| tierFor | function | 163 | yes | export function tierFor(entry) { |
| parsed | const | 164 | no | const parsed = entry?.parsed ?? extractProbes(entry?.text); |
| estimateMs | function | 173 | yes | export function estimateMs(entry, { ewmaMs = null } = {}) { |
| parsed | const | 174 | no | const parsed = entry?.parsed ?? extractProbes(entry?.text); |
| total | variable | 175 | no | let total = parsed.probes.length === 0 &amp;&amp; parsed.spawnCount === 0 ? MODULE_ONLY_MS : BUN_BOOT_MS; |
| classifyDuplicates | function | 189 | yes | export function classifyDuplicates(entries, manifest) { |
| errors | const | 190 | no | const errors = []; |
| byId | const | 191 | no | const byId = new Map(); |
| policy | const | 196 | no | const policy = manifest?.duplicates ?? {}; |
| rows | const | 197 | no | const rows = []; |
| declared | const | 204 | no | const declared = policy[id]; |
| names | const | 210 | no | const names = new Set(group.map((g) =&gt; g.name)); |
| overlap | const | 215 | no | const overlap = declared.quarantined.filter((n) =&gt; n === declared.canonical); |
| unlisted | const | 217 | no | const unlisted = group.filter((g) =&gt; g.name !== declared.canonical &amp;&amp; !declared.quarantined.includes(g.name)); |
| buildPlan | function | 231 | yes | export function buildPlan({ root, journal = null, manifestPath = null } = {}) { |
| fixturesDir | const | 232 | no | const fixturesDir = join(root, &#39;hq&#39;, &#39;aii&#39;, &#39;fixtures&#39;); |
| catalogPath | const | 233 | no | const catalogPath = join(root, &#39;docs&#39;, &#39;AII-CATALOG.md&#39;); |
| manifest | const | 234 | no | const manifest = loadFixtureManifest(manifestPath ?? join(fixturesDir, &#39;manifest.json&#39;)); |
| errors | const | 235 | no | const errors = [...manifest.errors]; |
| discovered | const | 236 | no | const discovered = discoverFixtureFiles(fixturesDir); |
| durations | const | 242 | no | const durations = journal?.durations &amp;&amp; typeof journal.durations === &#39;object&#39; ? journal.durations : {}; |
| fixtures | const | 243 | no | const fixtures = rows.map((entry) =&gt; { const parsed = extractProbes(entry.text); const tier = manifest.tiers[entry.name] ?? tierFor({ ...entry, parsed }); const ewmaMs = Number(durations[entry.relPat… |
| parsed | const | 244 | no | const parsed = extractProbes(entry.text); |
| tier | const | 245 | no | const tier = manifest.tiers[entry.name] ?? tierFor({ ...entry, parsed }); |
| ewmaMs | const | 246 | no | const ewmaMs = Number(durations[entry.relPath]?.ewmaMs) \|\| null; |
| byTier | const | 268 | no | const byTier = { fast: 0, standard: 0, heavy: 0 }; |
| byRole | const | 269 | no | const byRole = { canonical: 0, quarantined: 0, unresolved: 0 }; |
| catalogSha | const | 274 | no | const catalogSha = existsSync(catalogPath) ? sha256Text(readFileSync(catalogPath, &#39;utf8&#39;)) : &#39;&#39;; |
| duplicateIds | const | 277 | no | const duplicateIds = [...new Set(fixtures.filter((f) =&gt; f.duplicateOf).map((f) =&gt; f.id))].sort(); |
| selectFixtures | function | 298 | yes | export function selectFixtures(plan, { tier = &#39;all&#39;, only = [], skip = [], includeQuarantined = false } = {}) { |
| maxRank | const | 299 | no | const maxRank = TIER_RANK[tier] ?? TIER_RANK.standard; |
| onlySet | const | 300 | no | const onlySet = new Set(only); |
| skipSet | const | 301 | no | const skipSet = new Set(skip); |
| estimateRun | function | 317 | yes | export function estimateRun(fixtures, { jobs = 8 } = {}) { |
| estimates | const | 318 | no | const estimates = fixtures.map((f) =&gt; f.estimatedMs); |
| totalMs | const | 319 | no | const totalMs = estimates.reduce((a, b) =&gt; a + b, 0); |
| longestMs | const | 320 | no | const longestMs = estimates.reduce((a, b) =&gt; Math.max(a, b), 0); |
| parallelMs | const | 321 | no | const parallelMs = Math.max(longestMs, Math.ceil(totalMs / Math.max(1, jobs))); |
| planDigest | function | 332 | yes | export function planDigest(plan) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 14 | external |
| node:fs | import | 15 | external |
| node:path | import | 16 | external |
| ../util.mjs | import | 17 | [hq/lib/util.mjs](../util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/aii/runner.mjs](./runner.mjs.md) | ./plan.mjs |
| [hq/lib/aii/views.mjs](./views.mjs.md) | ./plan.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 336 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
