# File: .coordination/tools/track-slice.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/tools/track-slice.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13375 B |
| Lines | 246 |
| Hash | b339ba64d3b0 |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fs | const | 2 | no | const fs = require(&quot;fs&quot;); |
| pathmod | const | 3 | no | const pathmod = require(&quot;path&quot;); |
| argv | const | 6 | no | const argv = process.argv.slice(-3); |
| gzPath | const | 7 | no | const gzPath = argv[0]; |
| lane | const | 8 | no | const lane = argv[1]; |
| outPath | const | 9 | no | const outPath = argv[2]; |
| raw | const | 10 | no | const raw = new TextDecoder(&quot;utf-8&quot;).decode(Bun.gunzipSync(fs.readFileSync(gzPath))); |
| text | const | 11 | no | const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw; |
| parseCsv | function | 12 | no | function parseCsv(t) { |
| rows | const | 13 | no | const rows = []; let row = []; let parts = []; let quoted = false; let i = 0; |
| c | const | 15 | no | const c = t[i]; |
| table | const | 29 | no | const table = parseCsv(text); |
| header | const | 30 | no | const header = table[0]; |
| col | const | 31 | no | const col = new Map(); |
| at | function | 33 | no | const at = (r, name) =&gt; { const i = col.get(name); if (i === undefined) return &quot;&quot;; const v = r[i]; return v === undefined ? &quot;&quot; : String(v).trim(); }; |
| dirOf | function | 34 | no | const dirOf = (p) =&gt; { const i = p.lastIndexOf(&quot;/&quot;); return i &lt; 0 ? &quot;.&quot; : p.slice(0, i); }; |
| TARGETS | const | 35 | no | const TARGETS = [&quot;Target Rust&quot;,&quot;Target Host&quot;,&quot;Target Studio&quot;,&quot;Target PWA&quot;,&quot;Target HQ&quot;,&quot;Target VLANG&quot;,&quot;Target TierFlow&quot;,&quot;Target Harness&quot;,&quot;Target AutoWiki&quot;,&quot;Target Tauri&quot;]; |
| MODELED | const | 36 | no | const MODELED = new Set([&quot;1&quot;,&quot;true&quot;,&quot;True&quot;,&quot;Yes&quot;,&quot;Y&quot;,&quot;x&quot;]); |
| isSet | function | 37 | no | const isSet = (v) =&gt; { if (v === &quot;&quot;) return false; const n = Number(v); return Number.isFinite(n) ? n !== 0 : MODELED.has(v); }; |
| rows | const | 38 | no | const rows = table.slice(1).filter((r) =&gt; r.length === header.length); |
| PRIO | const | 39 | no | const PRIO = { P0: 0, P1: 1, P2: 2, P3: 3, &quot;&quot;: 4, UNRANKED: 5 }; |
| rank | function | 40 | no | const rank = (p) =&gt; (PRIO[p] === undefined ? 4 : PRIO[p]); |
| packageOwners | const | 42 | no | const packageOwners = {}; |
| k | const | 45 | no | const k = at(r, &quot;Implementation unit / dedup key&quot;); |
| p | const | 47 | no | const p = k.split(&quot;:&quot;)[0]; |
| mine | const | 50 | no | const mine = rows.filter((r) =&gt; at(r, &quot;Parallel lane&quot;) === lane); |
| units | const | 51 | no | const units = new Map(); |
| phase | const | 53 | no | const phase = at(r, &quot;Phase decision&quot;); |
| key | const | 55 | no | const key = at(r, &quot;Implementation unit / dedup key&quot;); |
| p | const | 56 | no | const p = at(r, &quot;Repository path&quot;); |
| id | const | 57 | no | const id = phase + &quot;:&quot; + (key === &quot;&quot; ? &quot;CONSOLIDATE:&quot; + dirOf(p) : key); |
| u | variable | 58 | no | let u = units.get(id); |
| cc | const | 66 | no | const cc = at(r, &quot;Closure class&quot;); if (cc) u.closures.push(cc); |
| np | const | 67 | no | const np = at(r, &quot;Next-phase package&quot;); if (np) u.nextPackages.push(np); |
| eg | const | 70 | no | const eg = at(r, &quot;Evidence grade&quot;); if (eg) u.grades.add(eg); |
| a | const | 71 | no | const a = at(r, &quot;Acceptance evidence required&quot;); if (a) u.acc.set(a, (u.acc.get(a) \|\| 0) + 1); |
| out | const | 145 | no | const out = []; |
| acceptance | variable | 147 | no | let acceptance = &quot;&quot;; let best = 0; |
| priority | variable | 149 | no | let priority = &quot;&quot;; |
| detail | const | 152 | no | const detail = u.detail.slice().sort((a, b) =&gt; { const sa = /\\\\bstage\\\\b/i.test(a.action) ? 0 : 1; const sb = /\\\\bstage\\\\b/i.test(b.action) ? 0 : 1; return sa - sb; }); |
| sa | const | 153 | no | const sa = /\\\\bstage\\\\b/i.test(a.action) ? 0 : 1; |
| sb | const | 154 | no | const sb = /\\\\bstage\\\\b/i.test(b.action) ? 0 : 1; |
| traceOnly | function | 169 | no | const traceOnly = (u) =&gt; u.acceptance.indexOf(&quot;Inspect source and actual callers&quot;) === 0; |
| ta | const | 173 | no | const ta = traceOnly(a) ? 1 : 0, tb = traceOnly(b) ? 1 : 0; |
| ca | const | 175 | no | const ca = a.closures.indexOf(&quot;EVIDENCE CLOSURE&quot;) &gt;= 0 ? 0 : 1; |
| cb | const | 176 | no | const cb = b.closures.indexOf(&quot;EVIDENCE CLOSURE&quot;) &gt;= 0 ? 0 : 1; |
| blobs | const | 182 | no | const blobs = []; |
| SKIP | const | 185 | no | const SKIP = /-slice\\.json$\|-slice\\.units\\.json$\|-claims\\.json$/; |
| scan | function | 186 | no | const scan = (dir) =&gt; { try { for (const f of fs.readdirSync(dir)) { if (SKIP.test(f)) continue; try { blobs.push(fs.readFileSync(dir + &quot;/&quot; + f, &quot;utf8&quot;)); } catch (e) {} } } catch (e) {} }; |
| needles | const | 192 | no | const needles = [u.ledgerKey].concat(u.rowIds).filter(Boolean); |
| hits | const | 193 | no | const hits = needles.filter((n) =&gt; blobs.some((b) =&gt; b.indexOf(n) &gt;= 0)); |
| payload | const | 197 | no | const payload = { lane: lane, laneRows: mine.length, nextRows: mine.filter((r) =&gt; at(r, &quot;Phase decision&quot;) === &quot;NEXT&quot;).length, verifyRows: mine.filter((r) =&gt; at(r, &quot;Phase decision&quot;) === &quot;VERIFY&quot;).leng… |
| uniq | function | 202 | no | const uniq = (rows, col, cap, width) =&gt; { |
| seen | const | 203 | no | const seen = new Map(); |
| v | const | 205 | no | const v = (row[col] \|\| &quot;&quot;).trim(); |
| compact | const | 212 | no | const compact = { |
| d | const | 215 | no | const d = u.detail \|\| []; |
| compactPath | const | 244 | no | const compactPath = outPath.replace(/\\.json$/, &quot;.units.json&quot;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| fs | require | 2 | external |
| path | require | 3 | external |
| child_process | require | 190 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript

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
```

_First 80 of 247 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
