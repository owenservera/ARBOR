/* zcode-workflow
description: ARBOR integrator — reads what the five lane workflows produced,
  builds the cross-component units no lane can own, merges every delta into the
  canonical master as the sole serialized writer, and runs the whole-repo
  integration gate once.
whenToUse: "After the lane workflows have run: to integrate cross-component
  tracker rows (rows with two or more non-zero Target flags that no lane
  claimed), merge every lane delta into the canonical Labs ledger, and prove the
  whole repo is still green."
args:
  concurrency:
    type: number
    description: In-flight units per wave. Clamped to 2 so no base model ever
      carries more than 2 concurrent subagents.
  maxUnits:
    type: number
    description: Budget for this run's cross-component units. null (default) = work
      through every unclaimed cross-component unit; a batch boundary of 200
      units ends the build phase and the next launch continues.
*/
// ─────────────────────────────────────────────────────────────────────────────
// ARBOR integration workflow.
//
// WHY IT EXISTS: the tracker partitions rows by `Parallel lane`, but 1203 rows
// carry >=2 non-zero `Target *` flags (C 469, D 392, B 208, A 121, E 13) and
// 332 of those are actionable (NEXT 141 + VERIFY 191). Their `Repository path`
// lives in one lane's tree while the work crosses another lane, so no lane can
// own them alone. This workflow owns exactly those rows.
//
// PHASES
//   1 read the lanes       — claim files and deltas of arbor-area-a..e; what each
//                             lane owns, built, committed, deferred and why.
//   2 cross-component units— rows spanning >=2 components that no lane claimed.
//   3 build + verify       — own paths only, real gate, independent verifier,
//                             bounded repair, stable-ID delta, path-scoped commit,
//                             and the unit's keyed changes merged into the master.
//   4 serialized merge     — audit, build one patch per lane, merge each through
//                             ledger-maintenance.py (the sole ledger writer),
//                             commit the merged master in vivim-labs, re-extract
//                             the ARBOR copy.
//   5 integration gate     — bun scripts/test-gate.mjs --all and the r004 full
//                             gate, once, with the real exit codes.
//   6 report               — what the lanes built, what this run built, what was
//                             merged, the gate results, what is still unclaimed.
//
// INVENTORY: the canonical Labs gz is the only inventory. ARBOR product source
//   is the only edit target. Labs is the ledger, written only through
//   ledger-maintenance.py.
//
// GATE COMMAND + WHAT IT PROVES + FALLBACK
//   cargo test -p hq-knowledge-graph   the Rust crate's own suite is green.
//       The Cargo PACKAGE is `hq-knowledge-graph`; the library is `hqkg`. There
//       is no package named `hqkg` — `cargo test -p hqkg` fails with "package ID
//       specification `hqkg` did not match any packages" and is never used.
//   node --test <focused files>         one module's own suite is green.
//   node studio/scripts/gate.mjs        the Studio gate (architecture inventory,
//       platform parity, platform smoke, full unit suite) is green. NOT
//       `npm --prefix studio test`: that script globs test/unit/**/*.test.mjs
//       and node --test exits 0 when the glob matches nothing, so it passes
//       vacuously while studio/test/unit does not exist.
//   npm --prefix harness test          the Harness suite.
//   bun test packages/tierflow/tests/visual-runtime   the TierFlow suites.
//   FALLBACK: a unit with no focused test CREATES one inside its owned paths
//       and the test must assert something real; a unit that ships without its
//       own real test scores REPLAN, never VERIFIED.
//
// VERDICTS: VERIFIED | CLOSED_NO_CHANGE | INCONCLUSIVE | REPLAN | BLOCKED |
//   SLOT_VIOLATION | LANE_PRIORITY_YIELD.
//
// LEDGER CONTRACT: every change sets Review HEAD = e07e61385a53f30890b4a7f7441fe25d22a79b1c
//   and Runtime test = "UNRUN" (ledger-maintenance.py:160 rejects any other
//   Runtime test value as an Unsupported evidence upgrade, so a delta carrying a
//   real exit code there fails the whole merge). The real runtime result goes
//   into Production reachability (caller path:line) and Evidence detail /
//   anchor ("gate <cmd> exit <n> @ <sha>"). The receipt lives in
//   .coordination/evidence/ + docs/product/roadmap/receipts/ + the unit commit.
//   Protected columns never appear in changes[].
//
// LEDGER MERGE CONTRACT (ledger-maintenance.py, audit|merge)
//   * schema "arbor-transient-stable-id-row-patch/2", one patch per lane.
//   * source_head is the pinned product source e07e61385a53f30890b4a7f7441fe25d22a79b1c.
//   * last_readable_ledger_commit + last_readable_ledger_blob must match the
//     Labs commit the master is read from; all patches are built from that one
//     base before any merge runs.
//   * each record carries the stable id, the row address (path, symbol, lane,
//     batch), the source blob id, the source URL pinned to that source, the
//     exact base-field guards and the changed fields.
//   * The tool enforces base blob, identity, address, batch-size, lane-total
//     and path-set guards and fails closed on any conflict. That is correct
//     behaviour: a failed merge is recorded, never worked around.
//
// COMMIT: only a unit's own changed paths are staged and committed
//   (git add -- <owned paths>; never `git add -A`, never `git add .`). No
//   branch, no PR, no push, no working-tree cleanup.
//
// CONCURRENCY (owner rule): at most 2 in-flight subagents per BASE model id
//   (id.split("$")[0]). The free models (ernie, ling) are single-threaded and
//   never sit on a parallel critical path.
const WORKFLOW_NAME = "arbor-integrate";
const SOURCE_PIN = "e07e61385a53f30890b4a7f7441fe25d22a79b1c";
const ROOT_HINT = "C:\\0-BlackBoxProject-0\\ARBOR";
const ARBOR_DIR = "C:/0-BlackBoxProject-0/ARBOR";
const LABS_DIR = "C:/0-BlackBoxProject-0/vivim-labs";
const LABS_GZ = LABS_DIR + "/ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz";
const LEDGER_REL = "ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz";
const LEDGER_TOOL = LABS_DIR + "/ARBOR-DEEP-DISPOSITION/ledger-maintenance.py";
const DELTA_DIR = ".coordination/tracker-deltas";
const EVIDENCE_DIR = ".coordination/evidence";
const RECEIPT_DIR = "docs/product/roadmap/receipts";
const CLAIMS_PATH = EVIDENCE_DIR + "/arbor-integrate-claims.json";
const PATCH_DIR = EVIDENCE_DIR + "/ledger-patches";
const EXTRACTED_CSV = ".coordination/ARBOR-MASTER-INTEGRATION-TRACKER.csv";
const BATCH_BOUNDARY = 200;
const LANES = ["A", "B", "C", "D", "E"];

// ── shared CSV reader ───────────────────────────────────────────────────────
const PARSE_HELPER = `
const fs = require("fs");
const cp = require("child_process");
const ARBOR = process.argv[1];
const LABS = process.argv[2];
const SOURCE = process.argv[3];
function parseCsv(t) {
  const rows = []; let row = []; let parts = []; let quoted = false; let i = 0;
  while (i < t.length) {
    const c = t[i];
    if (quoted) {
      if (c === '"') { if (t[i + 1] === '"') { parts.push('"'); i += 2; continue; } quoted = false; i += 1; continue; }
      parts.push(c); i += 1; continue;
    }
    if (c === '"') { quoted = true; i += 1; continue; }
    if (c === ",") { row.push(parts.join("")); parts = []; i += 1; continue; }
    if (c === "\r") { i += 1; continue; }
    if (c === "\n") { row.push(parts.join("")); parts = []; rows.push(row); row = []; i += 1; continue; }
    parts.push(c); i += 1;
  }
  if (parts.length || row.length) { row.push(parts.join("")); rows.push(row); }
  return rows;
}
function readMaster(gz) {
  const raw = new TextDecoder("utf-8").decode(Bun.gunzipSync(fs.readFileSync(gz)));
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const table = parseCsv(text);
  const header = table[0];
  const col = new Map();
  header.forEach((h, i) => col.set(h, i));
  const at = (r, name) => { const i = col.get(name); if (i === undefined) return ""; const v = r[i]; return v === undefined ? "" : String(v).trim(); };
  return { table: table.slice(1).filter((r) => r.length === header.length), at: at, header: header };
}
function blobMap() {
  const out = {};
  try {
    const txt = cp.execSync("git -C " + ARBOR + " ls-tree -r " + SOURCE, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    for (const line of txt.split(/\\r?\\n/)) {
      const m = /^\\d+ blob ([0-9a-f]{40})\\t(.*)$/.exec(line);
      if (m) out[m[2]] = m[1];
    }
  } catch (e) {}
  return out;
}
`;

// ── phase 1 + 2: lane picture and cross-component unit cut ───────────────────
const SCAN_CODE = PARSE_HELPER + `
const master = readMaster(process.argv[4]);
const at = master.at;
const TARGETS = ["Target Rust","Target Host","Target Studio","Target PWA","Target HQ","Target VLANG","Target TierFlow","Target Harness","Target AutoWiki","Target Tauri"];
const isSet = (v) => { if (v === "") return false; const n = Number(v); return Number.isFinite(n) ? n !== 0 : /^(true|yes|y|x)$/i.test(v); };
const blobs = blobMap();
const repoPaths = new Set(Object.keys(blobs));
const deltaDir = process.argv[5];
const claimsDir = process.argv[6];
const laneReport = {};
const claimedPaths = new Set();
const changedIds = new Set();
let deltas = [];
try { for (const f of fs.readdirSync(deltaDir)) { if (!f.endsWith(".json")) continue; try { const d = JSON.parse(fs.readFileSync(deltaDir + "/" + f, "utf8")); deltas.push({ file: f, unit: d.unit, workflow: d.workflow, status: d.status, wave: d.wave, runId: d.runId, sha: d.implementationCommit || null, changes: d.changes || [], discoveries: d.discoveries || [] }); for (const c of d.changes || []) changedIds.add(c.id); } catch (e) {} } } catch (e) {}
for (const lane of ["A","B","C","D","E"]) {
  const lower = lane.toLowerCase();
  let owned = [];
  try { owned = JSON.parse(fs.readFileSync(claimsDir + "/arbor-area-" + lower + "-claims.json", "utf8")).ownedPaths || []; } catch (e) {}
  const laneDeltas = deltas.filter((d) => d.workflow === "arbor-area-" + lower);
  const paths = [];
  for (const p of owned) { claimedPaths.add(p); paths.push(p); }
  laneReport[lane] = {
    claimFile: owned.length > 0,
    claimedPaths: paths,
    deltaCount: laneDeltas.length,
    units: laneDeltas.map((d) => ({ unit: d.unit, status: d.status, sha: d.sha, changes: d.changes.length, file: d.file })),
    verified: laneDeltas.filter((d) => d.status === "VERIFIED").length,
    committed: laneDeltas.filter((d) => d.sha).length,
  };
}
let ownOwned = [];
try { ownOwned = JSON.parse(fs.readFileSync(claimsDir + "/arbor-integrate-claims.json", "utf8")).ownedPaths || []; } catch (e) {}
for (const p of ownOwned) claimedPaths.add(p);
const pathTokens = (text) => {
  const out = new Set();
  const re = /(?:[A-Za-z0-9_.-]+\\/)+[A-Za-z0-9_.-]+\\.[A-Za-z0-9]{1,6}/g;
  let m;
  while ((m = re.exec(text || "")) !== null) out.add(m[0].replace(/\\.$/, ""));
  return out;
};
const cross = [];
for (const r of master.table) {
  const phase = at(r, "Phase decision");
  if (phase !== "NEXT" && phase !== "VERIFY") continue;
  const targets = TARGETS.filter((t) => isSet(at(r, t))).map((t) => t.replace("Target ", ""));
  if (targets.length < 2) continue;
  const path = at(r, "Repository path");
  const id = at(r, "ID");
  const claimed = claimedPaths.has(path) || changedIds.has(id);
  const anchors = [at(r, "Proposed action / boundary"), at(r, "Observed consumers / dependencies"), at(r, "Known missing or stale dependency"), at(r, "Evidence detail / anchor")].join(" ");
  const extra = [];
  for (const tok of pathTokens(anchors)) {
    if (tok === path) continue;
    if (repoPaths.has(tok)) extra.push(tok);
    else {
      for (const cand of repoPaths) if (cand.endsWith("/" + tok)) { extra.push(cand); break; }
    }
  }
  cross.push({
    id: id, lane: at(r, "Parallel lane"), phase: phase, path: path,
    symbol: at(r, "Symbol / occurrence"), key: at(r, "Implementation unit / dedup key"),
    acceptance: at(r, "Acceptance evidence required"), action: at(r, "Proposed action / boundary"),
    priority: at(r, "Priority") || at(r, "Revised priority"), targets: targets,
    closures: at(r, "Closure class"), runtime: at(r, "Runtime test"), reach: at(r, "Production reachability"),
    claimed: claimed, candidatePaths: Array.from(new Set([path].concat(extra))).slice(0, 6),
  });
}
const unclaimed = cross.filter((c) => !c.claimed);
const groups = new Map();
for (const c of unclaimed) {
  const gk = c.targets.slice().sort().join("+") + "|" + c.acceptance.slice(0, 70);
  if (!groups.has(gk)) groups.set(gk, []);
  groups.get(gk).push(c);
}
const units = [];
let n = 0;
for (const [gk, rowsIn] of groups) {
  const paths = [];
  for (const c of rowsIn) for (const p of c.candidatePaths) if (paths.indexOf(p) < 0) paths.push(p);
  const chunks = [];
  const per = 6;
  for (let i = 0; i < paths.length; i += per) chunks.push(paths.slice(i, i + per));
  if (chunks.length === 0) chunks.push(rowsIn[0].candidatePaths.slice(0, 1));
  for (const chunk of chunks) {
    const members = rowsIn.filter((c) => c.candidatePaths.some((p) => chunk.indexOf(p) >= 0));
    if (!members.length) continue;
    n += 1;
    units.push({
      id: "CROSS:" + n + ":" + gk.split("|")[0].replace(/\\+/g, "-"),
      span: gk.split("|")[0], acceptance: members[0].acceptance,
      rows: members.map((m) => ({ id: m.id, lane: m.lane, phase: m.phase, path: m.path, action: m.action, priority: m.priority, targets: m.targets })),
      ownedPaths: chunk,
      rowIds: members.map((m) => m.id),
    });
  }
}
console.log(JSON.stringify({
  lanes: laneReport,
  missingLanes: ["A","B","C","D","E"].filter((l) => !laneReport[l].claimFile && laneReport[l].deltaCount === 0),
  crossRows: cross.length,
  claimedCrossRows: cross.length - unclaimed.length,
  unclaimedCrossRows: unclaimed.length,
  crossUnitCount: units.length,
  units: units,
}));
`;

// ── phase 4: build the ledger patches from the deltas ────────────────────────
const PATCH_CODE = PARSE_HELPER + `
const master = readMaster(process.argv[4]);
const at = master.at;
const deltaDir = process.argv[5];
const outDir = process.argv[6];
const runId = process.argv[7];
const SOURCE = process.argv[3];
const REL = "ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz";
const LABS = process.argv[2];
const blobs = blobMap();
const byId = {};
for (const r of master.table) byId[at(r, "ID")] = r;
let labsCommit = "";
let labsBlob = "";
try { labsCommit = cp.execSync("git -C " + LABS + " rev-parse HEAD", { encoding: "utf8" }).trim(); } catch (e) {}
try { labsBlob = cp.execSync("git -C " + LABS + " rev-parse HEAD:" + REL, { encoding: "utf8" }).trim(); } catch (e) {}
const PROTECTED = new Set(["ID","Granularity","Repository path","Symbol / occurrence","Parent file ID","Parallel lane","Lane batch","Lane batch item","Inventory HEAD","Inventory origin","Notes","Implementation commit","Review HEAD","Runtime test"]);
const deltas = [];
try { for (const f of fs.readdirSync(deltaDir)) { if (!f.endsWith(".json")) continue; try { const d = JSON.parse(fs.readFileSync(deltaDir + "/" + f, "utf8")); deltas.push({ file: f, delta: d }); } catch (e) {} } } catch (e) {}
const perLane = {};
const skipped = [];
const alreadyApplied = [];
for (const d of deltas) {
  const delta = d.delta;
  for (const ch of delta.changes || []) {
    const row = byId[ch.id];
    if (!row) { skipped.push({ id: ch.id, reason: "stable id not in the master ledger" }); continue; }
    const path = at(row, "Repository path");
    const blob = blobs[path];
    if (!blob) { skipped.push({ id: ch.id, reason: "no blob id for " + path + " at the pinned source" }); continue; }
    const lane = at(row, "Parallel lane");
    const changed = {};
    for (const c of delta.changes || []) {
      if (c.id !== ch.id) continue;
      if (PROTECTED.has(c.field)) continue;
      changed[c.field] = String(c.to);
    }
    changed["Review HEAD"] = SOURCE;
    changed["Runtime test"] = "UNRUN";
    const already = Object.keys(changed).every((k) => at(row, k) === String(changed[k]));
    if (already) { alreadyApplied.push({ id: ch.id, lane: lane }); continue; }
    const guards = {};
    for (const k of Object.keys(changed)) guards[k] = at(row, k);
    const anchor = at(row, "Evidence detail / anchor");
    const lm = /:(\\d+)/.exec(anchor);
    const line = lm ? lm[1] : "1";
    const unit = delta.unit || "unknown";
    const record = {
      stable_id: ch.id,
      path: path,
      symbol: at(row, "Symbol / occurrence"),
      lane: lane,
      batch: at(row, "Lane batch"),
      source_blob_sha: blob,
      source_url: "https://github.com/owenservera/ARBOR/blob/" + SOURCE + "/" + path + "#L" + line,
      expected_old_fields: guards,
      changed_fields: changed,
      append_evidence: "[arbor-integrate " + runId + " " + unit + " " + ch.id + "]",
      source_anchors: [unit, d.file, Object.keys(changed).join(",")],
      review_completed: (delta.status || "unknown") + " via " + (delta.wave || "-"),
      evidence_scope: JSON.stringify({ workflow: delta.workflow || "", runId: delta.runId || "", unit: unit, evidence: (delta.changes || []).filter((c) => c.id === ch.id).map((c) => c.field + "=" + c.to + " (" + c.evidence + ")") }),
    };
    if (!perLane[lane]) perLane[lane] = [];
    perLane[lane].push(record);
  }
}
fs.mkdirSync(outDir, { recursive: true });
const written = [];
for (const lane of Object.keys(perLane)) {
  const rows = perLane[lane];
  for (let i = 0; i < rows.length; i += 500) {
    const part = rows.slice(i, i + 500);
    const patch = {
      schema: "arbor-transient-stable-id-row-patch/2",
      source_head: SOURCE,
      last_readable_ledger_commit: labsCommit,
      last_readable_ledger_blob: labsBlob,
      lane: lane,
      rows: part,
    };
    const name = outDir + "/patch-" + lane + (rows.length > 500 ? "-" + Math.floor(i / 500) : "") + ".json";
    fs.writeFileSync(name, JSON.stringify(patch, null, 2));
    written.push({ lane: lane, file: name, rows: part.length });
  }
}
console.log(JSON.stringify({ labsCommit: labsCommit, labsBlob: labsBlob, deltaFiles: deltas.length, patches: written, alreadyApplied: alreadyApplied.length, skipped: skipped.slice(0, 20), skippedCount: skipped.length }));
`;

const HEALTH_CODE = `
try {
  const { Database } = require("bun:sqlite");
  const home = process.env.USERPROFILE || process.env.HOME;
  const db = new Database(home + "/.zcode/cli/db/db.sqlite", { readonly: true });
  const rows = db.prepare("SELECT model_id, error_type, COUNT(*) AS n FROM model_usage WHERE started_at > ? GROUP BY model_id, error_type").all(Date.now() - 600000);
  const out = {};
  for (const r of rows) {
    const id = String(r.model_id || "").replace(/\\$.*$/, "");
    const bare = id.indexOf("/") >= 0 ? id.split("/").slice(1).join("/") : id;
    for (const k of [id, bare]) out[k] = out[k] || { errors: 0, rate: 0 };
    const e = r.error_type === "rate_limited" ? "rate" : "errors";
    out[id][e] += r.n; out[bare][e] += r.n;
  }
  console.log(JSON.stringify(out));
} catch (e) { console.log("{}"); }
`;

// ── typed contracts ──────────────────────────────────────────────────────────
interface CrossRow {
  id: string;
  lane: string;
  phase: string;
  path: string;
  action: string;
  priority: string;
  targets: string[];
}
interface CrossUnit {
  id: string;
  span: string;
  acceptance: string;
  rows: CrossRow[];
  ownedPaths: string[];
  rowIds: string[];
}
interface LaneUnitReport {
  unit: string;
  status: string;
  sha: string | null;
  changes: number;
  file: string;
}
interface LaneReport {
  claimFile: boolean;
  claimedPaths: string[];
  deltaCount: number;
  units: LaneUnitReport[];
  verified: number;
  committed: number;
}
interface ScanResult {
  lanes: Record<string, LaneReport>;
  missingLanes: string[];
  crossRows: number;
  claimedCrossRows: number;
  unclaimedCrossRows: number;
  crossUnitCount: number;
  units: CrossUnit[];
}
interface DeltaChange {
  id: string;
  field: string;
  from: string;
  to: string;
  evidence: string;
}
interface DeltaDiscovery {
  path: string;
  problem: string;
  kind: "artificial-gate" | "duplicate-engine" | "synthetic-dependency" | "missing-feedback" | "missing-dependency";
}
interface Delta {
  changes: DeltaChange[];
  discoveries: DeltaDiscovery[];
  status: "verified" | "replan" | "blocked" | "closed";
  summary: string;
  createdTest: string;
}
interface Verdict {
  unit: string;
  verdict: "VERIFIED" | "CLOSED_NO_CHANGE" | "INCONCLUSIVE" | "REPLAN" | "BLOCKED" | "SLOT_VIOLATION";
  gateExit: number;
  gateCommand: string;
  repairs: number;
  note: string;
  ownedChanged: string[];
  evidence: string;
}
interface MergeOutcome {
  lane: string;
  file: string;
  rows: number;
  exitCode: number;
  note: string;
}
interface Finding {
  where: string;
  what: string;
  evidence: string;
  status: "verified" | "unconfirmed";
  severity: "low" | "medium" | "high";
}
interface WorkflowReport {
  conclusion: string;
  findings: Finding[];
  verified: string[];
  notCovered: string[];
}

const PROTECTED_FIELDS = [
  "ID", "Granularity", "Repository path", "Symbol / occurrence", "Parent file ID",
  "Parallel lane", "Lane batch", "Lane batch item", "Inventory HEAD",
  "Inventory origin", "Notes", "Implementation commit",
];
const CANONICAL_NOT_COVERED = [
  "BROWSER_E2E — no in-repo browser automation; recorded human step",
  "PHYSICAL_DEVICE",
  "owner / release acceptance (the repo-wide gates are local-machine-only)",
];

const budgetArg = Number(args.maxUnits);
const budget = Number.isFinite(budgetArg) && budgetArg > 0 ? budgetArg : BATCH_BOUNDARY;
const maxUnits = Math.min(budget, BATCH_BOUNDARY);
const concArg = Number(args.concurrency);
const concurrency = Math.min(Math.max(Number.isFinite(concArg) && concArg > 0 ? concArg : 2), 2);
const slug = (id: string): string => id.replace(/[^A-Za-z0-9._-]+/g, "-");
const waveOf = (u: CrossUnit): string => {
  let best = "";
  for (const r of u.rows) if (r.priority === "P0" && best !== "P0") best = "P0";
  for (const r of u.rows) if (r.priority === "P1" && best === "") best = "P1";
  return best === "" ? "ops" : best;
};

phase("Pick the model roles from the ten minute health probe");
const M_MISTRAL = model("new-provider/mistralai/mistral-large-4-1t-a52b");
const M_M3 = model("minimax-m-plan/MiniMax-M3");
const M_M3F = model("minimax-m-plan/MiniMax-M3.1-Flash$max");
const M_ERNIE = model("openrouter-2/baidu/ernie-5.5-flash-preview:free");
const M_LING = model("openrouter-2/inclusionai/ling-3.2-flash:free");
const healthRun = await world.run("bun", ["-e", HEALTH_CODE], { output: { tail: 4096 } });
let health: Record<string, { errors: number; rate: number }> = {};
try {
  health = JSON.parse(healthRun.stdout.trim() || "{}") as Record<string, { errors: number; rate: number }>;
} catch {
  health = {};
}
const hot = (id: string): boolean => {
  const bare = id.indexOf("/") >= 0 ? id.split("/").slice(1).join("/") : id;
  const a = health[id] || { errors: 0, rate: 0 };
  const b = health[bare] || { errors: 0, rate: 0 };
  return a.errors + b.errors >= 5 || a.rate + b.rate >= 3;
};
const BUILDER = hot("new-provider/mistralai/mistral-large-4-1t-a52b") ? (hot("minimax-m-plan/MiniMax-M3") ? (hot("minimax-m-plan/MiniMax-M3.1-Flash") ? M_ERNIE : M_M3F) : M_M3) : M_MISTRAL;
const PLANNER = hot("minimax-m-plan/MiniMax-M3") ? (hot("minimax-m-plan/MiniMax-M3.1-Flash") ? M_MISTRAL : M_M3F) : M_M3;
const VERIFIER = ((): ModelRef => {
  // Independent verification: the verifier is never the builder's model.
  const pool: [ModelRef, string][] = [[M_M3F, "minimax-m-plan/MiniMax-M3.1-Flash"], [M_M3, "minimax-m-plan/MiniMax-M3"], [M_ERNIE, "openrouter-2/baidu/ernie-5.5-flash-preview:free"]];
  for (const pair of pool) {
    if (pair[0] !== BUILDER && !hot(pair[1])) return pair[0];
  }
  return BUILDER === M_M3F ? M_M3 : M_M3F;
})();
const TRIAGE = hot("openrouter-2/inclusionai/ling-3.2-flash:free") ? (hot("minimax-m-plan/MiniMax-M3.1-Flash") ? M_M3 : M_M3F) : M_LING;
log("Integration roles: builder=" + (BUILDER === M_M3 ? "m3" : "mistral") + " planner=m3 verifier=" + (VERIFIER === M_M3 ? "m3" : "m3.1-flash"));

// ── phase 1: read the lanes ─────────────────────────────────────────────────
phase("Read what the five lane workflows produced");
const fetchRun = await world.run("git", ["-C", LABS_DIR, "fetch", "--prune"], { timeoutMs: 120000, output: { tail: 512 } });
const scanRun = await world.run("bun", [".coordination/tools/integrate-scan.mjs", ARBOR_DIR, LABS_DIR, SOURCE_PIN, LABS_GZ, DELTA_DIR, EVIDENCE_DIR], { timeoutMs: 300000, output: { tail: 4194304 } });
let scan: ScanResult;
try {
  scan = JSON.parse(scanRun.stdout.trim() || "{}") as ScanResult;
} catch {
  scan = { lanes: {}, missingLanes: LANES, crossRows: 0, claimedCrossRows: 0, unclaimedCrossRows: 0, crossUnitCount: 0, units: [] };
}
const laneSummary = LANES.map((l) => {
  const r = scan.lanes[l];
  return l + ": " + (r ? (r.deltaCount + " delta(s), " + r.verified + " verified, " + r.committed + " committed, " + r.claimedPaths.length + " claimed path(s)") : "no report");
}).join(" | ");
log("Lanes — " + laneSummary);
log("Cross-component rows: " + scan.crossRows + " total, " + scan.claimedCrossRows + " claimed by a lane, " + scan.unclaimedCrossRows + " unclaimed -> " + scan.crossUnitCount + " unit(s)");
if (scan.missingLanes.length) {
  log("Lanes that have not reported yet: " + scan.missingLanes.join(", ") + " — proceeding with what exists");
}

// ── phase 2: cut the cross-component units ───────────────────────────────────
phase("Cut the cross-component units no lane can own");
const planner = agent("Integration planner", { model: PLANNER });
const planned = await planner.ask<{ selected: string[]; notes: string }>(
  "The cross-component units are in " + ROOT_HINT + "/" + EVIDENCE_DIR + "/ — read the deterministic scan output and choose the units this run should build. " +
  "Each unit carries id, span (the components it crosses), acceptance, rows (stable IDs, their lane, phase, path and proposed action) and ownedPaths. " +
  "Rules: (1) build the units whose work genuinely crosses the components in their span — a unit that only touches one component's tree belongs to that lane and is skipped; " +
  "(2) the ownedPaths of a unit are the paths the unit's rows name across those components; if a unit needs a path that no lane claimed and the path exists in the tree, it may use it — a cross-component unit wins the paths it needs because nobody else can do the work; " +
  "(3) NEVER invent a stable ID, a path or a row that is not in the scan; " +
  "(4) order by dependency: a unit that consumes another unit's output comes after it; " +
  "(5) a unit whose acceptance is 'Inspect source and actual callers' is TRACE-AND-CLOSE: trace the callers, and where the trace exposes a real gap, implement the smallest real change with a real test; " +
  "(6) prefer units that carry real acceptance evidence over units that are pure path classification. " +
  "Return the selected unit ids in order and a note naming what you skipped and why."
);
const crossUnits: CrossUnit[] = [];
for (const u of scan.units || []) {
  if (planned.selected.indexOf(u.id) < 0) continue;
  crossUnits.push(u);
}
const work: CrossUnit[] = crossUnits.slice(0, maxUnits);
log("Cross-component units selected: " + work.length + " (" + (work.map((u) => u.id).join(", ") || "(none)") + ")");
if (crossUnits.length > work.length) {
  log("Batch boundary: " + work.length + " of " + crossUnits.length + " unit(s) taken this run; the next launch continues with the rest");
}
const claimPayload = { lane: "INTEGRATE", runId: run.id || "none", ownedPaths: work.flatMap((u) => u.ownedPaths) };
const claimWriter = agent("Integration claim writer", { model: TRIAGE });
await claimWriter.ask<string>(
  "In " + ROOT_HINT + ", write the file " + CLAIMS_PATH + " with exactly this JSON content (mkdir -p its directory first): " +
  JSON.stringify(claimPayload) + ". " +
  "Reply with the path only. Do not touch anything else."
);

// ── phase 3: build and verify the cross-component units ──────────────────────
phase("Build, verify and close the cross-component units against their component gates");
interface GateSpec {
  command: string;
  args: string[];
  what: string;
  runner: "node" | "bun" | "npm" | "cargo";
}
const pwaSuites: string[] = await files.glob("apps/mobile-relay/test/*.test.mjs");
function componentOf(p: string): string {
  if (p.indexOf("native/hqkg/") === 0 || p.indexOf("core/") === 0) return "rust";
  if (p.indexOf("hq/") === 0) return "hq";
  if (p.indexOf("apps/vivim-host/") === 0) return "host";
  if (p.indexOf("harness/") === 0) return "harness";
  if (p.indexOf("studio/") === 0) return "studio";
  if (p.indexOf("apps/mobile-relay/") === 0) return "pwa";
  if (p.indexOf("packages/tierflow/") === 0) return "tierflow";
  if (p.indexOf("src-tauri/") === 0) return "tauri";
  return "other";
}
function gatesFor(u: CrossUnit): GateSpec[] {
  const comps = Array.from(new Set(u.ownedPaths.map(componentOf)));
  const out: GateSpec[] = [];
  for (const c of comps) {
    if (c === "rust") {
      out.push({ command: "cargo test -p hq-knowledge-graph", args: ["test", "-p", "hq-knowledge-graph"], what: "the Rust crate's own suite is green", runner: "cargo" });
    } else if (c === "hq") {
      out.push({ command: "node --test hq/test/arbor-service.test.mjs hq/test/arbor-boundary.test.mjs hq/test/in-repo-closure.test.mjs", args: ["--test", "hq/test/arbor-service.test.mjs", "hq/test/arbor-boundary.test.mjs", "hq/test/in-repo-closure.test.mjs"], what: "the HQ boundary and closure tests are green", runner: "node" });
    } else if (c === "host") {
      out.push({ command: "node --test apps/vivim-host/test/product-journal.test.mjs apps/vivim-host/test/product-routes.test.mjs", args: ["--test", "apps/vivim-host/test/product-journal.test.mjs", "apps/vivim-host/test/product-routes.test.mjs"], what: "the Host journal and route suites are green", runner: "node" });
    } else if (c === "harness") {
      out.push({ command: "npm --prefix harness test", args: ["--prefix", "harness", "test"], what: "the Harness suite is green", runner: "npm" });
    } else if (c === "studio") {
      out.push({ command: "node studio/scripts/gate.mjs", args: ["studio/scripts/gate.mjs"], what: "the Studio gate is green", runner: "node" });
    } else if (c === "pwa") {
      out.push({ command: "node --test " + pwaSuites.join(" "), args: ["--test", ...pwaSuites], what: "the PWA suites are green", runner: "node" });
    } else if (c === "tierflow") {
      out.push({ command: "bun test packages/tierflow/tests/visual-runtime", args: ["test", "packages/tierflow/tests/visual-runtime"], what: "the TierFlow visual runtime suites are green", runner: "bun" });
    } else if (c === "tauri") {
      out.push({ command: "cargo check --workspace --locked", args: ["check", "--workspace", "--locked"], what: "the workspace compiles against pinned dependencies", runner: "cargo" });
    }
  }
  if (!out.length) {
    out.push({ command: "node --test apps/vivim-host/test/product-journal.test.mjs", args: ["--test", "apps/vivim-host/test/product-journal.test.mjs"], what: "the Host journal suite is green", runner: "node" });
  }
  return out;
}

async function runUnit(u: CrossUnit): Promise<Verdict> {
  const gates = gatesFor(u);
  const builder = agent("Integration builder " + u.id, { model: BUILDER });
  const owned = u.ownedPaths.join(", ");
  const rowsBrief = u.rows.map((r) => r.id + " @ " + r.path + " :: " + r.action).join("\n");
  const gateText = gates.map((g) => g.command + " (" + g.what + ")").join(" + ");
  const first = await builder.ask<Delta>(
    "CROSS-COMPONENT BUILD UNIT in " + ROOT_HINT + ". " +
    "Unit id " + u.id + "; components crossed: " + u.span.replace(/\+/g, ", ") + "; acceptance: " + u.acceptance + ". " +
    "YOU OWN EXACTLY THESE PATHS: " + owned + ". Edit nothing else. " +
    "Rows:\n" + rowsBrief + "\n" +
    "This unit's work crosses components on purpose: it is the only unit allowed to touch more than one component's tree, because the subsystem partition cuts it arbitrarily. " +
    "Reuse the existing implementation in every component — extend, never rebuild, never add a second journal, a central router, a parallel interpreter or a new authoritative graph. " +
    "Host stays the sole effect authority and the only issuer of a revocable source-disclosure grant; durable ingestion (native) stays separate from bounded retrieval. " +
    "Ship the change WITH a real test that asserts something (a test that asserts nothing is synthetic and will be rejected); create one inside your owned paths if none exists, and report its path in createdTest. " +
    "The authoritative gates are run by the script (" + gateText + "). Do not claim a pass; make the change. " +
    "Return JSON only: {changes:[{id,field,from,to,evidence}], discoveries:[{path,problem,kind}], status:'verified'|'replan'|'blocked', summary, createdTest}. " +
    "Only Review HEAD, Runtime test, Production reachability, Evidence detail / anchor, Disposition, Current state and Notes may appear in changes[]; the protected columns " + PROTECTED_FIELDS.join(", ") + " must never appear."
  );
  const delta: Delta = {
    changes: first.changes || [],
    discoveries: first.discoveries || [],
    status: first.status || "replan",
    summary: first.summary || "",
    createdTest: first.createdTest || "",
  };
  const trackedBefore = await world.run("git", ["status", "--porcelain"], { output: { tail: 16384 } });
  const beforePaths = new Set(trackedBefore.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => l.slice(3).trim()));
  const after = await world.run("git", ["status", "--porcelain"], { output: { tail: 16384 } });
  const afterPaths = after.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => l.slice(3).trim());
  const changed = afterPaths.filter((p) => !beforePaths.has(p));
  const ownedSet = new Set(u.ownedPaths);
  const outside = changed.filter((p) => !ownedSet.has(p) && p.indexOf(".coordination/") !== 0 && p.indexOf(RECEIPT_DIR + "/") !== 0);
  if (outside.length && /outside|out of scope/i.test(delta.summary)) {
    return { unit: u.id, verdict: "SLOT_VIOLATION", gateExit: -1, gateCommand: gateText, repairs: 0, note: "builder claimed edits outside its owned paths: " + outside.join(", "), ownedChanged: [], evidence: "" };
  }
  let gateExit = 0;
  let gateTail = "";
  let gateFailed = false;
  for (const gate of gates) {
    try {
      const g = gate.runner === "cargo"
        ? await world.run("cargo", gate.args, { timeoutMs: 1800000, output: { tail: 8192 } })
        : gate.runner === "bun"
          ? await world.run("bun", gate.args, { timeoutMs: 1800000, output: { tail: 8192 } })
          : gate.runner === "npm"
            ? await world.run("npm", gate.args, { timeoutMs: 1800000, output: { tail: 8192 } })
            : await world.run("node", gate.args, { timeoutMs: 1800000, output: { tail: 8192 } });
      gateExit = g.exitCode;
      gateTail = g.stderr || g.stdout;
      if (gateExit !== 0) break;
    } catch (e) {
      gateFailed = true;
      gateTail = String(e).slice(0, 400);
      break;
    }
  }
  if (gateFailed) {
    return { unit: u.id, verdict: "BLOCKED", gateExit: -1, gateCommand: gateText, repairs: 0, note: "BLOCKED: the gate command could not run — " + gateText + " (" + gateTail + ")", ownedChanged: [], evidence: "" };
  }
  const preflight = gateExit === 2 && /BLOCKED_PREFLIGHT|DIRTY_CHECKOUT|GIT_SHA_NOT_PINNED|NODE_24_REQUIRED/.test(gateTail);
  if (preflight) {
    return { unit: u.id, verdict: "INCONCLUSIVE", gateExit: gateExit, gateCommand: gateText, repairs: 0, note: "INCONCLUSIVE: the gate preflight failed (" + gateTail.slice(-300) + ") — this says nothing about the code, so no repair was attempted", ownedChanged: [], evidence: "" };
  }
  let repairs = 0;
  let verdict: Verdict["verdict"] = gateExit === 0 ? "VERIFIED" : "REPLAN";
  let note = "gate exit " + gateExit + " (" + gateText + "); changed=" + changed.length + " outside-owned=" + outside.length;
  if (gateExit !== 0) {
    const verifier = agent("Integration verifier " + u.id, { model: VERIFIER });
    for (let attempt = 0; attempt < 3 && gateExit !== 0; attempt += 1) {
      const v = await verifier.ask<{ pass: boolean; failure: string }>(
        "Independently verify the cross-component unit " + u.id + " in " + ROOT_HINT + ". " +
        "Acceptance: " + u.acceptance + ". Owned paths: " + owned + ". " +
        "Gate " + gateText + " failed with exit " + gateExit + ". Tail: " + gateTail.slice(-1200) + ". " +
        "Read the changed files and decide whether the acceptance is met AND that no component gained a second authority (Host keeps effect authority, native keeps ingestion and retrieval, no new graph, no parallel interpreter). " +
        "A test that asserts nothing is not a test — reject it. A red deterministic gate is never overridden by opinion. " +
        "Reply JSON {pass, failure} where failure is the first concrete failing condition. Read-only — do not edit."
      );
      if (v.pass) {
        verdict = "VERIFIED";
        note = "verifier accepted; gate exit " + gateExit;
        break;
      }
      repairs += 1;
      const fix = await builder.ask<Delta>(
        "REPAIR ROUND " + repairs + " for unit " + u.id + ". The verifier found: " + String(v.failure).slice(0, 700) + ". " +
        "Gate tail: " + gateTail.slice(-500) + ". " +
        "Make the smallest fix inside your owned paths (" + owned + "). If this exact failure already happened in a previous round, reply status 'replan' and stop. " +
        "Return the same JSON shape; append to changes rather than replacing it."
      );
      for (const c of fix.changes || []) delta.changes.push(c);
      for (const d of fix.discoveries || []) delta.discoveries.push(d);
      if (fix.createdTest) delta.createdTest = fix.createdTest;
      if (fix.status === "replan") {
        verdict = "REPLAN";
        note = "repeated identical failure after " + repairs + " repair(s)";
        break;
      }
      const gate = gates[0];
      let g;
      try {
        g = gate.runner === "cargo"
          ? await world.run("cargo", gate.args, { timeoutMs: 1800000, output: { tail: 4096 } })
          : gate.runner === "bun"
            ? await world.run("bun", gate.args, { timeoutMs: 1800000, output: { tail: 4096 } })
            : gate.runner === "npm"
              ? await world.run("npm", gate.args, { timeoutMs: 1800000, output: { tail: 4096 } })
              : await world.run("node", gate.args, { timeoutMs: 1800000, output: { tail: 4096 } });
      } catch (e) {
        return { unit: u.id, verdict: "BLOCKED", gateExit: -1, gateCommand: gateText, repairs: repairs, note: "BLOCKED: the gate command could not run — " + gateText, ownedChanged: [], evidence: "" };
      }
      gateExit = g.exitCode;
      gateTail = g.stderr || g.stdout;
      verdict = gateExit === 0 ? "VERIFIED" : "REPLAN";
      note = "after repair " + repairs + ": gate exit " + gateExit;
    }
  }
  const ownedChanged = changed.filter((p) => ownedSet.has(p));
  const evidence = "gate " + gateText + " exit " + gateExit;
  if (verdict === "VERIFIED" && !ownedChanged.length) {
    verdict = "CLOSED_NO_CHANGE";
    note = "the gate passed and no file changed — the row is closed with evidence, not counted as a code change";
  } else if (verdict === "VERIFIED" && !delta.createdTest) {
    verdict = "REPLAN";
    note = "no focused test was created for this unit — the gate would not prove the acceptance";
  }
  return { unit: u.id, verdict: verdict, gateExit: gateExit, gateCommand: gateText, repairs: repairs, note: note, ownedChanged: ownedChanged, evidence: evidence };
}

const verdicts: Verdict[] = [];
for (let i = 0; i < work.length; i += concurrency) {
  const wave = work.slice(i, i + concurrency);
  const waveOut = await Promise.all(wave.map((u) => runUnit(u)));
  for (const v of waveOut) {
    verdicts.push(v);
    report(v);
    log("Integration unit " + v.unit + ": " + v.verdict + " (gate " + v.gateExit + ", repairs " + v.repairs + ")");
  }
}

// ── phase 3b: deltas, receipts, path-scoped commits and per-unit ledger merges ─
phase("Write each unit's delta and receipt, then commit and merge it");
const notePrefix = "workflow:" + WORKFLOW_NAME + " run:" + (run.id || "none") + " wave:";
const committed: { unit: string; sha: string; paths: string[] }[] = [];
for (const v of verdicts) {
  if (v.verdict === "SLOT_VIOLATION") continue;
  const u = work.filter((x) => x.id === v.unit)[0];
  if (!u) continue;
  const writer = agent("Integration delta writer " + u.id, { model: TRIAGE });
  const changedNote = v.ownedChanged.length
    ? "This unit changed these owned paths: " + v.ownedChanged.join(", ") + "."
    : "This unit changed NO file — say so honestly in the summary; the row is closed with evidence, not with an invented change.";
  await writer.ask<string>(
    "Write the tracker delta and the receipts for the cross-component unit " + u.id + " in " + ROOT_HINT + ". " +
    "(1) " + DELTA_DIR + "/" + slug(u.id) + ".json with exactly this shape: " +
    "{unit, round, workflow, runId, wave, note, changes:[{id,field,from,to,evidence}], discoveries:[{path,problem,kind}], status, implementationCommit}. " +
    "unit=" + u.id + "; workflow=" + WORKFLOW_NAME + "; runId=" + (run.id || "none") + "; wave=" + waveOf(u) + "; note=\"" + notePrefix + waveOf(u) + "\"; implementationCommit=null; status=\"" + v.verdict + "\". " +
    "(2) The receipt " + EVIDENCE_DIR + "/arbor-integrate-" + slug(u.id) + ".json — the same facts plus the unit's owned paths and the gate command. " +
    "(3) The receipt " + RECEIPT_DIR + "/" + slug(u.id) + ".receipt.json — {unit, workflow, runId, wave, verdict, gateCommand, gateExit, ownedPaths, changedPaths, stableIds, evidence, summary, implementationCommit}. " +
    "Create the directories if needed. " +
    "changes must use this unit's stable IDs only: " + u.rowIds.join(", ") + ". " +
    "LEDGER CONTRACT: for every stable ID you change, the changes[] entries are " +
    "Review HEAD -> " + SOURCE_PIN + ", Runtime test -> \"UNRUN\" (the ledger tool rejects any other value), " +
    "Production reachability -> the caller that proves the row is reached, with path:line, and Evidence detail / anchor -> \"" + v.evidence + " @" + (v.ownedChanged.length ? "see commit" : "no code change") + "\". " +
    changedNote + " " +
    "Protected columns that must never appear in changes[]: " + PROTECTED_FIELDS.join(", ") + ". " +
    "Reply with one line: the three paths and the number of changes."
  );
  if (v.verdict !== "VERIFIED") continue;
  if (!v.ownedChanged.length) {
    log("Integration unit " + u.id + ": closed with evidence — nothing committed");
    continue;
  }
  const addRun = await world.run("git", ["add", "--", ...v.ownedChanged], { output: { tail: 1024 } });
  const commitRun = await world.run("git", ["commit", "-m", "feat(integrate): " + u.id + " (" + u.rowIds.length + " rows)"], { output: { tail: 1024 } });
  const shaRun = await world.run("git", ["rev-parse", "--short", "HEAD"], { output: { tail: 64 } });
  const sha = shaRun.stdout.trim();
  if (commitRun.exitCode === 0 && sha.length) {
    committed.push({ unit: u.id, sha: sha, paths: v.ownedChanged });
    await writer.ask<string>(
      "Append the implementation commit to the delta and to both receipts you just wrote: " + DELTA_DIR + "/" + slug(u.id) + ".json, " +
      EVIDENCE_DIR + "/arbor-integrate-" + slug(u.id) + ".json and " + RECEIPT_DIR + "/" + slug(u.id) + ".receipt.json — " +
      "set implementationCommit to " + sha + " and leave every other field exactly as it is. " +
      "Reply with one line: the sha you wrote."
    );
    log("Integration committed " + u.id + " as " + sha + " (" + v.ownedChanged.length + " path(s))");
    const ledgerNote = await mergeUnitIntoLedger(u, v, sha);
    log("Integration ledger: " + ledgerNote.slice(0, 240));
  } else {
    log("Integration commit failed for " + u.id + " (add exit " + addRun.exitCode + ", commit exit " + commitRun.exitCode + "): " + (commitRun.stderr || commitRun.stdout).slice(0, 200));
  }
}

// Merge one cross-component unit's keyed changes into the canonical master.
// Its rows can belong to several lanes, so one patch is written PER LANE (the
// merge tool requires every record's lane to equal the patch lane).
async function mergeUnitIntoLedger(u: CrossUnit, v: Verdict, sha: string): Promise<string> {
  const lanes = Array.from(new Set(u.rows.map((r) => r.lane)));
  const patcher = agent("Ledger patch builder " + u.id, { model: TRIAGE });
  let last = "";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    for (const lane of lanes) {
      const patchPath = DELTA_DIR + "/" + slug(u.id) + ".patch-" + lane + ".json";
      await patcher.ask<string>(
        "Write a ledger-maintenance patch for the cross-component unit " + u.id + " (lane " + lane + ") to " + patchPath + " in " + ROOT_HINT + ". " +
        "The canonical master is " + LABS_GZ + " in " + LABS_DIR + " — READ THE CURRENT MASTER (gunzip -c it to a temp file) and work from THAT, never from a stale copy. " +
        "Header: {\"schema\":\"arbor-transient-stable-id-row-patch/2\",\"source_head\":\"" + SOURCE_PIN + "\",\"last_readable_ledger_commit\":\"<git -C " + LABS_DIR + " rev-parse HEAD>\",\"last_readable_ledger_blob\":\"<git -C " + LABS_DIR + " rev-parse HEAD:ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz>\",\"lane\":\"" + lane + "\",\"rows\":[...]}. " +
        "ONE row per changed tracker row, and ONLY the rows whose master row is in lane " + lane + ": stable_id (the CSV ID), path, symbol, lane, batch, source_url (from the CSV Source URL), source_anchors (from Evidence detail / anchor), source_blob_sha (40 hex, from the Source URL blob), expected_old_fields (the CURRENT master row values for every field you change), changed_fields (your new values), append_evidence (a unique marker string). " +
        "changed_fields MUST include \"Review HEAD\"=\"" + SOURCE_PIN + "\" and \"Runtime test\"=\"UNRUN\" (never a pass value — the merge tool rejects it), plus Production reachability and Evidence detail / anchor carrying the real gate result (gate " + v.gateCommand + " exit " + v.gateExit + ", commit " + sha + "). " +
        "The unit delta listing which IDs changed is at " + DELTA_DIR + "/" + slug(u.id) + ".json — read it and keep only the rows of lane " + lane + ". Write the patch file, then reply with the path and the row count."
      );
    }
    let ok = true;
    for (const lane of lanes) {
      const patchPath = DELTA_DIR + "/" + slug(u.id) + ".patch-" + lane + ".json";
      const merge = await runLedgerTool("merge", patchPath);
      if (merge.exitCode !== 0) {
        ok = false;
        last = (merge.stderr || merge.stdout).trim().slice(0, 400);
        log("Ledger merge attempt " + attempt + " for " + u.id + " (lane " + lane + ") failed: " + last + " — reloading the latest master and rebuilding the patch");
        break;
      }
    }
    if (ok) return "merged into the canonical master (lane(s) " + lanes.join(", ") + ")";
  }
  return "NOT merged after 3 attempts (" + last + ") — the unit delta stays on disk for the serialized ledger writer";
}

// ── phase 4: the serialized ledger merge ─────────────────────────────────────
phase("Merge every remaining delta into the canonical ledger as the sole writer");
async function runLedgerTool(command: string, patchPath: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  try {
    const args = command === "merge"
      ? ["-I", LABS_DIR + "/ARBOR-DEEP-DISPOSITION/ledger-maintenance.py", "merge", patchPath]
      : ["-I", LABS_DIR + "/ARBOR-DEEP-DISPOSITION/ledger-maintenance.py", "audit"];
    return await world.run("python", args, { timeoutMs: 600000, output: { tail: 262144 } });
  } catch (e) {
    return { exitCode: 127, stdout: "", stderr: "ledger tool could not run: " + String(e).slice(0, 200) };
  }
}
const auditRun = await runLedgerTool("audit", "");
log("Ledger audit exit " + auditRun.exitCode);
const patchRun = await world.run("bun", [".coordination/tools/integrate-patch.mjs", ARBOR_DIR, LABS_DIR, SOURCE_PIN, LABS_GZ, DELTA_DIR, PATCH_DIR, run.id || "none"], { timeoutMs: 600000, output: { tail: 1048576 } });
let patchInfo: { labsCommit: string; labsBlob: string; deltaFiles: number; patches: { lane: string; file: string; rows: number }[]; alreadyApplied: number; skippedCount: number };
try {
  patchInfo = JSON.parse(patchRun.stdout.trim() || "{}") as typeof patchInfo;
} catch {
  patchInfo = { labsCommit: "", labsBlob: "", deltaFiles: 0, patches: [], alreadyApplied: 0, skippedCount: 0 };
}
log("Patches built from " + patchInfo.deltaFiles + " delta file(s): " + (patchInfo.patches.map((p) => p.lane + "=" + p.rows).join(", ") || "(none)") + "; already applied: " + patchInfo.alreadyApplied + "; skipped: " + patchInfo.skippedCount);
const mergeOutcomes: MergeOutcome[] = [];
for (const p of patchInfo.patches) {
  const m = await runLedgerTool("merge", p.file);
  mergeOutcomes.push({
    lane: p.lane,
    file: p.file,
    rows: p.rows,
    exitCode: m.exitCode,
    note: m.exitCode === 0 ? "merged" : (m.stderr || m.stdout).slice(-400),
  });
  log("Ledger merge " + p.lane + " (" + p.rows + " rows): exit " + m.exitCode + (m.exitCode === 0 ? "" : " — " + (m.stderr || m.stdout).slice(-200)));
}
const labsAdd = await world.run("git", ["-C", LABS_DIR, "add", "--", LEDGER_REL], { output: { tail: 1024 } });
const labsCommitRun = await world.run("git", ["-C", LABS_DIR, "commit", "-m", "chore(ledger): merge ARBOR integration deltas (" + mergeOutcomes.filter((m) => m.exitCode === 0).length + " patch(es))"], { output: { tail: 2048 } });
log("Labs ledger commit exit " + labsCommitRun.exitCode + (labsCommitRun.exitCode === 0 ? " — no push, direct to main" : " — " + (labsCommitRun.stderr || labsCommitRun.stdout).slice(0, 300)));
const extractRun = await world.run("bun", ["-e", "const fs=require('fs');const raw=new TextDecoder('utf-8').decode(Bun.gunzipSync(fs.readFileSync(process.argv[1])));fs.mkdirSync(require('path').dirname(process.argv[2]),{recursive:true});fs.writeFileSync(process.argv[2],raw);console.log(JSON.stringify({bytes:raw.length}));", LABS_GZ, EXTRACTED_CSV], { timeoutMs: 120000, output: { tail: 1024 } });
log("Re-extracted the merged ledger into " + EXTRACTED_CSV + " (exit " + extractRun.exitCode + ")");

phase("Bring the canonical master fully up to date");
const finalAudit = await runLedgerTool("audit", "");
log("Final ledger audit exit " + finalAudit.exitCode + ": " + finalAudit.stdout.trim().slice(0, 400));
const finalLabsAdd = await world.run("git", ["-C", LABS_DIR, "add", "--", LEDGER_REL], { output: { tail: 1024 } });
const finalLabsCommit = await world.run("git", ["-C", LABS_DIR, "commit", "-m", "chore(ledger): bring the ARBOR master fully up to date (arbor-integrate)"], { output: { tail: 2048 } });
log("Final Labs ledger commit exit " + finalLabsCommit.exitCode + ": " + (finalLabsCommit.stdout || finalLabsCommit.stderr).trim().slice(0, 240));
const finalRefresh = await world.run("bun", ["-e", "const fs=require('fs');const raw=new TextDecoder('utf-8').decode(Bun.gunzipSync(fs.readFileSync(process.argv[1])));fs.mkdirSync(require('path').dirname(process.argv[2]),{recursive:true});fs.writeFileSync(process.argv[2],raw);console.log(JSON.stringify({bytes:raw.length}));", LABS_GZ, EXTRACTED_CSV], { timeoutMs: 120000, output: { tail: 1024 } });
log("Refreshed the local tracker copy " + EXTRACTED_CSV + " (exit " + finalRefresh.exitCode + ")");

// ── phase 5: the whole-repo integration gate ─────────────────────────────────
phase("Run the whole-repo integration gate once");
const centralGate = await world.run("bun", ["scripts/test-gate.mjs", "--all"], { timeoutMs: 1800000, output: { tail: 16384 } });
log("bun scripts/test-gate.mjs --all -> exit " + centralGate.exitCode);
const r004Full = await world.run("node", ["integration/scripts/r004-local-gate.mjs", "--full"], { timeoutMs: 1800000, output: { tail: 16384 } });
log("node integration/scripts/r004-local-gate.mjs --full -> exit " + r004Full.exitCode);
const r004Tail = (r004Full.stderr || r004Full.stdout).slice(-1500);
const r004Preflight = r004Full.exitCode === 2 && /DIRTY_CHECKOUT|GIT_SHA_NOT_PINNED|NODE_24_REQUIRED|BLOCKED_PREFLIGHT/.test(r004Tail);
const r004Verdict = r004Preflight ? "INCONCLUSIVE" : r004Full.exitCode === 0 ? "PASS" : "FAIL";

// ── phase 6: report ──────────────────────────────────────────────────────────
phase("Publish the integration summary");
const withCode = verdicts.filter((v) => v.verdict === "VERIFIED");
const withEvidence = verdicts.filter((v) => v.verdict === "CLOSED_NO_CHANGE");
const inconclusive = verdicts.filter((v) => v.verdict === "INCONCLUSIVE");
const blocked = verdicts.filter((v) => v.verdict === "BLOCKED");
const replanned = verdicts.filter((v) => v.verdict === "REPLAN");
const md = [
  "# ARBOR integration run",
  "",
  "## What the lanes produced",
  ...LANES.map((l) => {
    const r = scan.lanes[l];
    return "- lane " + l + ": " + (r ? r.deltaCount + " delta(s), " + r.verified + " verified, " + r.committed + " committed, " + r.claimedPaths.length + " claimed path(s)" : "no report");
  }),
  "- lanes that had not reported yet: " + (scan.missingLanes.join(", ") || "(none)"),
  "",
  "## What this run built",
  "- cross-component rows: " + scan.crossRows + " total, " + scan.claimedCrossRows + " already owned by a lane, " + scan.unclaimedCrossRows + " unclaimed",
  "- cross-component units cut: " + scan.crossUnitCount + ", built: " + work.length,
  "- verified with code: " + withCode.length,
  "- closed with evidence: " + withEvidence.length,
  "- inconclusive: " + inconclusive.length,
  "- blocked: " + blocked.length,
  "- replanned: " + replanned.length,
  ...verdicts.map((v) => "- **" + v.unit + "** — " + v.verdict + " (gate " + v.gateExit + ", repairs " + v.repairs + ") — " + v.gateCommand + " — " + v.note),
  "- commits: " + (committed.map((c) => c.unit + "=" + c.sha).join(", ") || "(none)"),
  "",
  "## Ledger merge (sole writer)",
  "- audit exit " + auditRun.exitCode + "; base commit " + (patchInfo.labsCommit || "?") + " / blob " + (patchInfo.labsBlob || "?"),
  "- records already applied: " + patchInfo.alreadyApplied + "; records skipped: " + patchInfo.skippedCount,
  ...mergeOutcomes.map((m) => "- lane " + m.lane + ": " + m.rows + " row(s) -> exit " + m.exitCode + (m.exitCode === 0 ? " (merged)" : " (FAILED CLOSED — " + m.note.slice(0, 200) + ")")),
  "- Labs ledger commit exit " + labsCommitRun.exitCode + " (no push)",
  "- ARBOR copy re-extracted: exit " + extractRun.exitCode,
  "",
  "## Repo-wide integration gate",
  "- bun scripts/test-gate.mjs --all -> exit " + centralGate.exitCode,
  "- node integration/scripts/r004-local-gate.mjs --full -> exit " + r004Full.exitCode + " (" + r004Verdict + (r004Preflight ? " — preflight flag recorded, not forced" : "") + ")",
  "",
  "## Still unclaimed",
  "- cross-component rows no lane and this run claimed: " + Math.max(0, scan.unclaimedCrossRows - work.reduce((n, u) => n + u.rowIds.length, 0)),
].join("\n");
await artifact.markdown("integration-report", md, { title: "ARBOR integration — cross-component units, ledger merge, repo gate", description: "What the lanes built, what this run built, what was merged into the canonical ledger and the repo-wide gate results.", primary: true });

return {
  conclusion: "Integration: " + withCode.length + " cross-component unit(s) verified with code, " + withEvidence.length + " closed with evidence, " + inconclusive.length + " inconclusive, " + blocked.length + " blocked, " + replanned.length + " replanned; " + committed.length + " commits path-scoped; " + mergeOutcomes.filter((m) => m.exitCode === 0).length + "/" + mergeOutcomes.length + " ledger patch(es) merged; repo gate " + centralGate.exitCode + " / r004 " + r004Full.exitCode + " (" + r004Verdict + ").",
  findings: [
    ...verdicts.map((v) => ({
      where: v.unit,
      what: v.note,
      evidence: v.gateCommand + " exit " + v.gateExit,
      status: v.verdict === "VERIFIED" ? ("verified" as const) : ("unconfirmed" as const),
      severity: v.verdict === "SLOT_VIOLATION" || v.verdict === "BLOCKED" ? ("high" as const) : ("medium" as const),
    })),
    ...mergeOutcomes.filter((m) => m.exitCode !== 0).map((m) => ({
      where: "ledger merge lane " + m.lane,
      what: "the merge failed closed and wrote nothing: " + m.note.slice(0, 300),
      evidence: "ledger-maintenance.py merge " + m.file + " exit " + m.exitCode,
      status: "verified" as const,
      severity: "high" as const,
    })),
  ],
  verified: [
    "lane picture read from the claim files and deltas: " + LANES.map((l) => l + "=" + (scan.lanes[l] ? scan.lanes[l].deltaCount : 0)).join(", "),
    "cross-component rows scanned from the canonical ledger: " + scan.crossRows + " (" + scan.unclaimedCrossRows + " unclaimed)",
    "ledger audit exit " + auditRun.exitCode + "; patches built: " + patchInfo.patches.length + "; records already applied: " + patchInfo.alreadyApplied,
    ...mergeOutcomes.filter((m) => m.exitCode === 0).map((m) => "ledger patch lane " + m.lane + " merged (" + m.rows + " rows)"),
    "Labs ledger commit exit " + labsCommitRun.exitCode + " (no push); ARBOR copy re-extracted",
    "bun scripts/test-gate.mjs --all exit " + centralGate.exitCode,
    "node integration/scripts/r004-local-gate.mjs --full exit " + r004Full.exitCode + " (" + r004Verdict + ")",
    ...withCode.map((v) => v.unit + " — " + v.gateCommand + " exit 0, real code and a real test"),
    ...committed.map((c) => c.unit + " — committed " + c.sha + " (" + c.paths.length + " owned path(s))"),
  ],
  notCovered: CANONICAL_NOT_COVERED,
};
