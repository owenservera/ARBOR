// argv: take the LAST 7 arguments so this runs the same as `bun -e <code> a...` and `bun file.mjs a...`.
const ARGV = process.argv.slice(-7);

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
const deltaDir = ARGV[4];
const outDir = ARGV[5];
const runId = ARGV[6];
const REL = "ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz";
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
    const lm = /:(\d+)/.exec(anchor);
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
