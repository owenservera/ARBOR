# File: .coordination/tools/integrate-scan.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/tools/integrate-scan.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7143 B |
| Lines | 151 |
| Hash | 13f0985da7ae |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ARGV | const | 2 | no | const ARGV = process.argv.slice(-6); |
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
| TARGETS | const | 50 | no | const TARGETS = [&quot;Target Rust&quot;,&quot;Target Host&quot;,&quot;Target Studio&quot;,&quot;Target PWA&quot;,&quot;Target HQ&quot;,&quot;Target VLANG&quot;,&quot;Target TierFlow&quot;,&quot;Target Harness&quot;,&quot;Target AutoWiki&quot;,&quot;Target Tauri&quot;]; |
| isSet | function | 51 | no | const isSet = (v) =&gt; { if (v === &quot;&quot;) return false; const n = Number(v); return Number.isFinite(n) ? n !== 0 : /^(true\|yes\|y\|x)$/i.test(v); }; |
| blobs | const | 52 | no | const blobs = blobMap(); |
| repoPaths | const | 53 | no | const repoPaths = new Set(Object.keys(blobs)); |
| deltaDir | const | 54 | no | const deltaDir = ARGV[4]; |
| claimsDir | const | 55 | no | const claimsDir = ARGV[5]; |
| laneReport | const | 56 | no | const laneReport = {}; |
| claimedPaths | const | 57 | no | const claimedPaths = new Set(); |
| changedIds | const | 58 | no | const changedIds = new Set(); |
| deltas | variable | 59 | no | let deltas = []; |
| lower | const | 62 | no | const lower = lane.toLowerCase(); |
| owned | variable | 63 | no | let owned = []; |
| laneDeltas | const | 65 | no | const laneDeltas = deltas.filter((d) =&gt; d.workflow === &quot;arbor-area-&quot; + lower); |
| paths | const | 66 | no | const paths = []; |
| ownOwned | variable | 77 | no | let ownOwned = []; |
| pathTokens | function | 80 | no | const pathTokens = (text) =&gt; { |
| out | const | 81 | no | const out = new Set(); |
| re | const | 82 | no | const re = /(?:[A-Za-z0-9_.-]+\\/)+[A-Za-z0-9_.-]+\\.[A-Za-z0-9]{1,6}/g; |
| m | variable | 83 | no | let m; |
| cross | const | 87 | no | const cross = []; |
| phase | const | 89 | no | const phase = at(r, &quot;Phase decision&quot;); |
| targets | const | 91 | no | const targets = TARGETS.filter((t) =&gt; isSet(at(r, t))).map((t) =&gt; t.replace(&quot;Target &quot;, &quot;&quot;)); |
| path | const | 93 | no | const path = at(r, &quot;Repository path&quot;); |
| id | const | 94 | no | const id = at(r, &quot;ID&quot;); |
| claimed | const | 95 | no | const claimed = claimedPaths.has(path) \|\| changedIds.has(id); |
| anchors | const | 96 | no | const anchors = [at(r, &quot;Proposed action / boundary&quot;), at(r, &quot;Observed consumers / dependencies&quot;), at(r, &quot;Known missing or stale dependency&quot;), at(r, &quot;Evidence detail / anchor&quot;)].join(&quot; &quot;); |
| extra | const | 97 | no | const extra = []; |
| unclaimed | const | 114 | no | const unclaimed = cross.filter((c) =&gt; !c.claimed); |
| groups | const | 115 | no | const groups = new Map(); |
| gk | const | 117 | no | const gk = c.targets.slice().sort().join(&quot;+&quot;) + &quot;\|&quot; + c.acceptance.slice(0, 70); |
| units | const | 121 | no | const units = []; |
| n | variable | 122 | no | let n = 0; |
| paths | const | 124 | no | const paths = []; |
| chunks | const | 126 | no | const chunks = []; |
| per | const | 127 | no | const per = 6; |
| members | const | 131 | no | const members = rowsIn.filter((c) =&gt; c.candidatePaths.some((p) =&gt; chunk.indexOf(p) &gt;= 0)); |

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
```

_First 80 of 152 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
