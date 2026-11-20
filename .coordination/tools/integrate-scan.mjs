// argv: take the LAST 6 arguments so this runs the same as `bun -e <code> a...` and `bun file.mjs a...`.
const ARGV = process.argv.slice(-6);

const fs = require("fs");
const cp = require("child_process");
const ARBOR = ARGV[0];
const LABS = ARGV[1];
const SOURCE = ARGV[2];
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
    for (const line of txt.split(/\r?\n/)) {
      const m = /^\d+ blob ([0-9a-f]{40})\t(.*)$/.exec(line);
      if (m) out[m[2]] = m[1];
    }
  } catch (e) {}
  return out;
}

const master = readMaster(ARGV[3]);
const at = master.at;
const TARGETS = ["Target Rust","Target Host","Target Studio","Target PWA","Target HQ","Target VLANG","Target TierFlow","Target Harness","Target AutoWiki","Target Tauri"];
const isSet = (v) => { if (v === "") return false; const n = Number(v); return Number.isFinite(n) ? n !== 0 : /^(true|yes|y|x)$/i.test(v); };
const blobs = blobMap();
const repoPaths = new Set(Object.keys(blobs));
const deltaDir = ARGV[4];
const claimsDir = ARGV[5];
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
  const re = /(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.[A-Za-z0-9]{1,6}/g;
  let m;
  while ((m = re.exec(text || "")) !== null) out.add(m[0].replace(/\.$/, ""));
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
      id: "CROSS:" + n + ":" + gk.split("|")[0].replace(/\+/g, "-"),
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
