# File: .coordination/tools/integrate-patch.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/tools/integrate-patch.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6067 B |
| Lines | 130 |
| Hash | 1b4cf46fac73 |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ARGV | const | 2 | no | const ARGV = process.argv.slice(-7); |
| fs | const | 4 | no | const fs = require(&quot;fs&quot;); |
| cp | const | 5 | no | const cp = require(&quot;child_process&quot;); |
| ARBOR | const | 6 | no | const ARBOR = ARGV[0]; |
| LABS | const | 7 | no | const LABS = ARGV[1]; |
| SOURCE | const | 8 | no | const SOURCE = ARGV[2]; |
| parseCsv | function | 9 | no | function parseCsv(t) { |
| rows | const | 10 | no | const rows = []; let row = []; let parts = []; let quoted = false; let i = 0; |
| c | const | 12 | no | const c = t[i]; |
| readMaster | function | 26 | no | function readMaster(gz) { |
| raw | const | 27 | no | const raw = new TextDecoder(&quot;utf-8&quot;).decode(Bun.gunzipSync(fs.readFileSync(gz))); |
| text | const | 28 | no | const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw; |
| table | const | 29 | no | const table = parseCsv(text); |
| header | const | 30 | no | const header = table[0]; |
| col | const | 31 | no | const col = new Map(); |
| at | function | 33 | no | const at = (r, name) =&gt; { const i = col.get(name); if (i === undefined) return &quot;&quot;; const v = r[i]; return v === undefined ? &quot;&quot; : String(v).trim(); }; |
| blobMap | function | 36 | no | function blobMap() { |
| out | const | 37 | no | const out = {}; |
| txt | const | 39 | no | const txt = cp.execSync(&quot;git -C &quot; + ARBOR + &quot; ls-tree -r &quot; + SOURCE, { encoding: &quot;utf8&quot;, maxBuffer: 64 * 1024 * 1024 }); |
| m | const | 41 | no | const m = /^\\d+ blob ([0-9a-f]{40})\\t(.*)$/.exec(line); |
| master | const | 48 | no | const master = readMaster(ARGV[3]); |
| at | const | 49 | no | const at = master.at; |
| deltaDir | const | 50 | no | const deltaDir = ARGV[4]; |
| outDir | const | 51 | no | const outDir = ARGV[5]; |
| runId | const | 52 | no | const runId = ARGV[6]; |
| REL | const | 53 | no | const REL = &quot;ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz&quot;; |
| blobs | const | 54 | no | const blobs = blobMap(); |
| byId | const | 55 | no | const byId = {}; |
| labsCommit | variable | 57 | no | let labsCommit = &quot;&quot;; |
| labsBlob | variable | 58 | no | let labsBlob = &quot;&quot;; |
| deltas | const | 62 | no | const deltas = []; |
| perLane | const | 64 | no | const perLane = {}; |
| skipped | const | 65 | no | const skipped = []; |
| alreadyApplied | const | 66 | no | const alreadyApplied = []; |
| delta | const | 68 | no | const delta = d.delta; |
| row | const | 70 | no | const row = byId[ch.id]; |
| path | const | 72 | no | const path = at(row, &quot;Repository path&quot;); |
| blob | const | 73 | no | const blob = blobs[path]; |
| lane | const | 75 | no | const lane = at(row, &quot;Parallel lane&quot;); |
| changed | const | 76 | no | const changed = {}; |
| already | const | 84 | no | const already = Object.keys(changed).every((k) =&gt; at(row, k) === String(changed[k])); |
| guards | const | 86 | no | const guards = {}; |
| anchor | const | 88 | no | const anchor = at(row, &quot;Evidence detail / anchor&quot;); |
| lm | const | 89 | no | const lm = /:(\\d+)/.exec(anchor); |
| line | const | 90 | no | const line = lm ? lm[1] : &quot;1&quot;; |
| unit | const | 91 | no | const unit = delta.unit \|\| &quot;unknown&quot;; |
| written | const | 112 | no | const written = []; |
| rows | const | 114 | no | const rows = perLane[lane]; |
| part | const | 116 | no | const part = rows.slice(i, i + 500); |
| patch | const | 117 | no | const patch = { |
| name | const | 125 | no | const name = outDir + &quot;/patch-&quot; + lane + (rows.length &gt; 500 ? &quot;-&quot; + Math.floor(i / 500) : &quot;&quot;) + &quot;.json&quot;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| fs | require | 4 | external |
| child_process | require | 5 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 131 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
