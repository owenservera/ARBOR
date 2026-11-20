
const fs = require("fs");
const pathmod = require("path");
// bun <file> a b c -> argv = [bun, file, a, b, c]; bun -e <code> a b c -> argv = [bun, a, b, c].
// Take the LAST three arguments so the tool works in both modes.
const argv = process.argv.slice(-3);
const gzPath = argv[0];
const lane = argv[1];
const outPath = argv[2];
const raw = new TextDecoder("utf-8").decode(Bun.gunzipSync(fs.readFileSync(gzPath)));
const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
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
const table = parseCsv(text);
const header = table[0];
const col = new Map();
header.forEach((h, i) => col.set(h, i));
const at = (r, name) => { const i = col.get(name); if (i === undefined) return ""; const v = r[i]; return v === undefined ? "" : String(v).trim(); };
const dirOf = (p) => { const i = p.lastIndexOf("/"); return i < 0 ? "." : p.slice(0, i); };
const TARGETS = ["Target Rust","Target Host","Target Studio","Target PWA","Target HQ","Target VLANG","Target TierFlow","Target Harness","Target AutoWiki","Target Tauri"];
const MODELED = new Set(["1","true","True","Yes","Y","x"]);
const isSet = (v) => { if (v === "") return false; const n = Number(v); return Number.isFinite(n) ? n !== 0 : MODELED.has(v); };
const rows = table.slice(1).filter((r) => r.length === header.length);
const PRIO = { P0: 0, P1: 1, P2: 2, P3: 3, "": 4, UNRANKED: 5 };
const rank = (p) => (PRIO[p] === undefined ? 4 : PRIO[p]);
// Which lane owns which decision package — derived from the NEXT unit keys.
const packageOwners = {};
for (const r of rows) {
  if (at(r, "Phase decision") !== "NEXT") continue;
  const k = at(r, "Implementation unit / dedup key");
  if (!k) continue;
  const p = k.split(":")[0];
  if (packageOwners[p] === undefined) packageOwners[p] = at(r, "Parallel lane");
}
const mine = rows.filter((r) => at(r, "Parallel lane") === lane);
const units = new Map();
for (const r of mine) {
  const phase = at(r, "Phase decision");
  if (phase !== "NEXT" && phase !== "VERIFY") continue;
  const key = at(r, "Implementation unit / dedup key");
  const p = at(r, "Repository path");
  const id = phase + ":" + (key === "" ? "CONSOLIDATE:" + dirOf(p) : key);
  let u = units.get(id);
  if (!u) {
    u = { id: id, phase: phase, ledgerKey: key, unkeyed: key === "", rowIds: [], paths: [], priorities: [], closures: [], nextPackages: [], targets: {}, acc: new Map(), runtime: new Set(), manifest: new Set(), grades: new Set(), reachBlank: 0, detail: [] };
    units.set(id, u);
  }
  u.rowIds.push(at(r, "ID"));
  u.paths.push(p);
  u.priorities.push(at(r, "Priority") || at(r, "Revised priority"));
  const cc = at(r, "Closure class"); if (cc) u.closures.push(cc);
  const np = at(r, "Next-phase package"); if (np) u.nextPackages.push(np);
  u.runtime.add(at(r, "Runtime test") || "(blank)");
  u.manifest.add(at(r, "Test manifest registration") || "(blank)");
  const eg = at(r, "Evidence grade"); if (eg) u.grades.add(eg);
  const a = at(r, "Acceptance evidence required"); if (a) u.acc.set(a, (u.acc.get(a) || 0) + 1);
  if (at(r, "Production reachability") === "") u.reachBlank += 1;
  for (const t of TARGETS) { const v = at(r, t); if (isSet(v)) u.targets[t] = (u.targets[t] || 0) + 1; }
  if (u.detail.length < 40) u.detail.push({
    id: at(r, "ID"), path: p, symbol: at(r, "Symbol / occurrence"),
    action: at(r, "Proposed action / boundary"), acceptance: at(r, "Acceptance evidence required"),
    runtime: at(r, "Runtime test"), reach: at(r, "Production reachability"),
    manifest: at(r, "Test manifest registration"), closure: at(r, "Closure class"),
    priority: at(r, "Priority"), source: at(r, "Source URL"),
    // every remaining master column, carried verbatim under its own name so no intel is left behind
    "Granularity": at(r, "Granularity"),
    "Subsystem": at(r, "Subsystem"),
    "Should integrate?": at(r, "Should integrate?"),
    "Disposition": at(r, "Disposition"),
    "Current state": at(r, "Current state"),
    "Review basis": at(r, "Review basis"),
    "Source finding": at(r, "Source finding"),
    "Atomic decision / boundary": at(r, "Atomic decision / boundary"),
    "Acceptance / exit": at(r, "Acceptance / exit"),
    "Decision confidence": at(r, "Decision confidence"),
    "Caller verification": at(r, "Caller verification"),
    "Evidence detail / anchor": at(r, "Evidence detail / anchor"),
    "Notes": at(r, "Notes"),
    "Disposition round": at(r, "Disposition round"),
    "Resolved action": at(r, "Resolved action"),
    "Revised should wire?": at(r, "Revised should wire?"),
    "Revised priority": at(r, "Revised priority"),
    "Next-phase package": at(r, "Next-phase package"),
    "Phase decision": at(r, "Phase decision"),
    "Review HEAD": at(r, "Review HEAD"),
    "Inventory HEAD": at(r, "Inventory HEAD"),
    "Inventory origin": at(r, "Inventory origin"),
    "Parent file ID": at(r, "Parent file ID"),
    "Parent audit IDs": at(r, "Parent audit IDs"),
    "File class (path-based)": at(r, "File class (path-based)"),
    "File review batch": at(r, "File review batch"),
    "First-pass evidence": at(r, "First-pass evidence"),
    "Review bucket": at(r, "Review bucket"),
    "Bucket item": at(r, "Bucket item"),
    "Bucket size": at(r, "Bucket size"),
    "Top-level review state": at(r, "Top-level review state"),
    "Top-level proposed disposition": at(r, "Top-level proposed disposition"),
    "Top-level boundary owner": at(r, "Top-level boundary owner"),
    "Top-level evidence tier": at(r, "Top-level evidence tier"),
    "Top-level review package": at(r, "Top-level review package"),
    "Review role": at(r, "Review role"),
    "Review scope": at(r, "Review scope"),
    "Observed consumers / dependencies": at(r, "Observed consumers / dependencies"),
    "Known missing or stale dependency": at(r, "Known missing or stale dependency"),
    "Remaining evidence required": at(r, "Remaining evidence required"),
    "Implementation unit / dedup key": at(r, "Implementation unit / dedup key"),
    "Implementation commit": at(r, "Implementation commit"),
    "Owner": at(r, "Owner"),
    "Lane assignment rationale": at(r, "Lane assignment rationale"),
    "Lane batch": at(r, "Lane batch"),
    "Lane batch item": at(r, "Lane batch item"),
    "Lane batch size": at(r, "Lane batch size"),
    "Lane review priority": at(r, "Lane review priority"),
    "Lane review need": at(r, "Lane review need"),
    "Lane ownership rule": at(r, "Lane ownership rule"),
    "Parallel lane": at(r, "Parallel lane"),
    "B-F01 review evidence": at(r, "B-F01 review evidence"),
    "Rust": at(r, "Rust"),
    "Host": at(r, "Host"),
    "Studio": at(r, "Studio"),
    "PWA": at(r, "PWA"),
    "HQ": at(r, "HQ"),
    "VLANG": at(r, "VLANG"),
    "TierFlow": at(r, "TierFlow"),
    "Harness": at(r, "Harness"),
    "AutoWiki": at(r, "AutoWiki"),
    "Tauri": at(r, "Tauri"),
  });
}
const out = [];
for (const u of units.values()) {
  let acceptance = ""; let best = 0;
  for (const [txt, n] of u.acc) if (n > best) { best = n; acceptance = txt; }
  let priority = "";
  for (const p of u.priorities) if (priority === "" || rank(p) < rank(priority)) priority = p;
  // staging rows (the ledger's own "Stage ..." actions) come first inside a unit
  const detail = u.detail.slice().sort((a, b) => {
    const sa = /\\bstage\\b/i.test(a.action) ? 0 : 1;
    const sb = /\\bstage\\b/i.test(b.action) ? 0 : 1;
    return sa - sb;
  });
  out.push({
    id: u.id, phase: u.phase, ledgerKey: u.ledgerKey, unkeyed: u.unkeyed,
    rowCount: u.rowIds.length, rowIds: u.rowIds,
    priority: priority, priorities: Array.from(new Set(u.priorities)),
    closures: Array.from(new Set(u.closures)), nextPackages: Array.from(new Set(u.nextPackages)),
    packageOwners: Array.from(new Set(u.nextPackages.map((p) => packageOwners[p] || "?"))),
    acceptance: acceptance, acceptanceVariants: u.acc.size,
    runtimeTests: Array.from(u.runtime), testManifest: Array.from(u.manifest),
    evidenceGrades: Array.from(u.grades), targets: u.targets, reachabilityBlank: u.reachBlank,
    paths: Array.from(new Set(u.paths)), detail: detail,
  });
}
const traceOnly = (u) => u.acceptance.indexOf("Inspect source and actual callers") === 0;
out.sort((a, b) => {
  if (a.phase !== b.phase) return a.phase === "NEXT" ? -1 : 1;
  if (a.phase === "NEXT") { const ra = rank(a.priority), rb = rank(b.priority); if (ra !== rb) return ra - rb; return a.id < b.id ? -1 : 1; }
  const ta = traceOnly(a) ? 1 : 0, tb = traceOnly(b) ? 1 : 0;
  if (ta !== tb) return ta - tb;
  const ca = a.closures.indexOf("EVIDENCE CLOSURE") >= 0 ? 0 : 1;
  const cb = b.closures.indexOf("EVIDENCE CLOSURE") >= 0 ? 0 : 1;
  if (ca !== cb) return ca - cb;
  return b.rowCount - a.rowCount;
});
// Completion evidence: a unit is DONE when a receipt, an evidence file or an
// implementation commit already names its ledger key or one of its stable IDs.
const blobs = [];
// Only real completion evidence counts: receipts, evidence receipts, roadmap artifacts, git log.
// NEVER the slice's own output or lane claim files (they would self-match every row).
const SKIP = /-slice\.json$|-slice\.units\.json$|-claims\.json$/;
const scan = (dir) => { try { for (const f of fs.readdirSync(dir)) { if (SKIP.test(f)) continue; try { blobs.push(fs.readFileSync(dir + "/" + f, "utf8")); } catch (e) {} } } catch (e) {} };
scan(".coordination/evidence");
scan("docs/product/roadmap/receipts");
scan("scripts/roadmap/artifacts");
try { blobs.push(require("child_process").execSync("git log --oneline -200", { encoding: "utf8", cwd: "C:/0-BlackBoxProject-0/ARBOR" })); } catch (e) {}
for (const u of out) {
  const needles = [u.ledgerKey].concat(u.rowIds).filter(Boolean);
  const hits = needles.filter((n) => blobs.some((b) => b.indexOf(n) >= 0));
  u.done = hits.length > 0;
  u.doneEvidence = hits.slice(0, 3);
}
const payload = { lane: lane, laneRows: mine.length, nextRows: mine.filter((r) => at(r, "Phase decision") === "NEXT").length, verifyRows: mine.filter((r) => at(r, "Phase decision") === "VERIFY").length, units: out };
fs.mkdirSync(pathmod.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
// A COMPACT unit list for the planner: same units, without the per-row evidence blobs.
// The planner only chooses; the full slice stays for the script and the builders.
const uniq = (rows, col, cap, width) => {
  const seen = new Map();
  for (const row of rows) {
    const v = (row[col] || "").trim();
    if (!v) continue;
    if (!seen.has(v)) seen.set(v, v.length > width ? v.slice(0, width) + "..." : v);
    if (seen.size >= cap) break;
  }
  return Array.from(seen.values());
};
const compact = {
  lane: payload.lane, laneRows: payload.laneRows, nextRows: payload.nextRows, verifyRows: payload.verifyRows,
  units: (payload.units || []).map((u) => {
    const d = u.detail || [];
    return {
      id: u.id, phase: u.phase, priority: u.priority, rowCount: u.rowCount, rowIds: u.rowIds,
      paths: u.paths, closures: u.closures, nextPackages: u.nextPackages, packageOwners: u.packageOwners,
      acceptance: u.acceptance, done: u.done, targets: u.targets, reachabilityBlank: u.reachabilityBlank,
      evidenceGrades: u.evidenceGrades, runtimeTests: u.runtimeTests,
      // the decision intel the master already holds, carried at unit level
      dispositions: uniq(d, "Disposition", 4, 120),
      currentStates: uniq(d, "Current state", 4, 120),
      granularities: uniq(d, "Granularity", 4, 120),
      subsystems: uniq(d, "Subsystem", 4, 120),
      shouldIntegrate: uniq(d, "Should integrate?", 4, 120),
      reviewBases: uniq(d, "Review basis", 4, 120),
      decisionConfidences: uniq(d, "Decision confidence", 4, 120),
      boundaryOwners: uniq(d, "Top-level boundary owner", 4, 120),
      topLevelStates: uniq(d, "Top-level review state", 4, 120),
      evidenceTiers: uniq(d, "Top-level evidence tier", 4, 120),
      reviewPackages: uniq(d, "Top-level review package", 4, 120),
      reviewRoles: uniq(d, "Review role", 4, 120),
      laneReviewNeeds: uniq(d, "Lane review need", 4, 120),
      knownMissing: uniq(d, "Known missing or stale dependency", 4, 120),
      remainingEvidence: uniq(d, "Remaining evidence required", 4, 120),
      dispositionRounds: uniq(d, "Disposition round", 4, 120),
      resolvedActions: uniq(d, "Resolved action", 4, 120),
      revisedShouldWire: uniq(d, "Revised should wire?", 4, 120),
      fileClasses: uniq(d, "File class (path-based)", 4, 120),
    };
  }),
};
const compactPath = outPath.replace(/\.json$/, ".units.json");
fs.writeFileSync(compactPath, JSON.stringify(compact, null, 2));
console.log(JSON.stringify(payload));
