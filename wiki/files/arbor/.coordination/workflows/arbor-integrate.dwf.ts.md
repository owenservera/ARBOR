# File: .coordination/workflows/arbor-integrate.dwf.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/workflows/arbor-integrate.dwf.ts |
| Language | TypeScript |
| Kind | source |
| Size | 59211 B |
| Lines | 987 |
| Hash | a46d23fd9f84 |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORKFLOW_NAME | const | 99 | no | const WORKFLOW_NAME = &quot;arbor-integrate&quot;; |
| SOURCE_PIN | const | 100 | no | const SOURCE_PIN = &quot;e07e61385a53f30890b4a7f7441fe25d22a79b1c&quot;; |
| ROOT_HINT | const | 101 | no | const ROOT_HINT = &quot;C:\\\\0-BlackBoxProject-0\\\\ARBOR&quot;; |
| ARBOR_DIR | const | 102 | no | const ARBOR_DIR = &quot;C:/0-BlackBoxProject-0/ARBOR&quot;; |
| LABS_DIR | const | 103 | no | const LABS_DIR = &quot;C:/0-BlackBoxProject-0/vivim-labs&quot;; |
| LABS_GZ | const | 104 | no | const LABS_GZ = LABS_DIR + &quot;/ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz&quot;; |
| LEDGER_REL | const | 105 | no | const LEDGER_REL = &quot;ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz&quot;; |
| LEDGER_TOOL | const | 106 | no | const LEDGER_TOOL = LABS_DIR + &quot;/ARBOR-DEEP-DISPOSITION/ledger-maintenance.py&quot;; |
| DELTA_DIR | const | 107 | no | const DELTA_DIR = &quot;.coordination/tracker-deltas&quot;; |
| EVIDENCE_DIR | const | 108 | no | const EVIDENCE_DIR = &quot;.coordination/evidence&quot;; |
| RECEIPT_DIR | const | 109 | no | const RECEIPT_DIR = &quot;docs/product/roadmap/receipts&quot;; |
| CLAIMS_PATH | const | 110 | no | const CLAIMS_PATH = EVIDENCE_DIR + &quot;/arbor-integrate-claims.json&quot;; |
| PATCH_DIR | const | 111 | no | const PATCH_DIR = EVIDENCE_DIR + &quot;/ledger-patches&quot;; |
| EXTRACTED_CSV | const | 112 | no | const EXTRACTED_CSV = &quot;.coordination/ARBOR-MASTER-INTEGRATION-TRACKER.csv&quot;; |
| BATCH_BOUNDARY | const | 113 | no | const BATCH_BOUNDARY = 200; |
| LANES | const | 114 | no | const LANES = [&quot;A&quot;, &quot;B&quot;, &quot;C&quot;, &quot;D&quot;, &quot;E&quot;]; |
| PARSE_HELPER | const | 117 | no | const PARSE_HELPER = ` |
| fs | const | 118 | no | const fs = require(&quot;fs&quot;); |
| cp | const | 119 | no | const cp = require(&quot;child_process&quot;); |
| ARBOR | const | 120 | no | const ARBOR = process.argv[1]; |
| LABS | const | 121 | no | const LABS = process.argv[2]; |
| SOURCE | const | 122 | no | const SOURCE = process.argv[3]; |
| parseCsv | function | 123 | no | function parseCsv(t) { |
| rows | const | 124 | no | const rows = []; let row = []; let parts = []; let quoted = false; let i = 0; |
| c | const | 126 | no | const c = t[i]; |
| readMaster | function | 140 | no | function readMaster(gz) { |
| raw | const | 141 | no | const raw = new TextDecoder(&quot;utf-8&quot;).decode(Bun.gunzipSync(fs.readFileSync(gz))); |
| text | const | 142 | no | const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw; |
| table | const | 143 | no | const table = parseCsv(text); |
| header | const | 144 | no | const header = table[0]; |
| col | const | 145 | no | const col = new Map(); |
| at | function | 147 | no | const at = (r, name) =&gt; { const i = col.get(name); if (i === undefined) return &quot;&quot;; const v = r[i]; return v === undefined ? &quot;&quot; : String(v).trim(); }; |
| blobMap | function | 150 | no | function blobMap() { |
| out | const | 151 | no | const out = {}; |
| txt | const | 153 | no | const txt = cp.execSync(&quot;git -C &quot; + ARBOR + &quot; ls-tree -r &quot; + SOURCE, { encoding: &quot;utf8&quot;, maxBuffer: 64 * 1024 * 1024 }); |
| m | const | 155 | no | const m = /^\\\\d+ blob ([0-9a-f]{40})\\\\t(.*)$/.exec(line); |
| SCAN_CODE | const | 164 | no | const SCAN_CODE = PARSE_HELPER + ` |
| master | const | 165 | no | const master = readMaster(process.argv[4]); |
| at | const | 166 | no | const at = master.at; |
| TARGETS | const | 167 | no | const TARGETS = [&quot;Target Rust&quot;,&quot;Target Host&quot;,&quot;Target Studio&quot;,&quot;Target PWA&quot;,&quot;Target HQ&quot;,&quot;Target VLANG&quot;,&quot;Target TierFlow&quot;,&quot;Target Harness&quot;,&quot;Target AutoWiki&quot;,&quot;Target Tauri&quot;]; |
| isSet | function | 168 | no | const isSet = (v) =&gt; { if (v === &quot;&quot;) return false; const n = Number(v); return Number.isFinite(n) ? n !== 0 : /^(true\|yes\|y\|x)$/i.test(v); }; |
| blobs | const | 169 | no | const blobs = blobMap(); |
| repoPaths | const | 170 | no | const repoPaths = new Set(Object.keys(blobs)); |
| deltaDir | const | 171 | no | const deltaDir = process.argv[5]; |
| claimsDir | const | 172 | no | const claimsDir = process.argv[6]; |
| laneReport | const | 173 | no | const laneReport = {}; |
| claimedPaths | const | 174 | no | const claimedPaths = new Set(); |
| changedIds | const | 175 | no | const changedIds = new Set(); |
| deltas | variable | 176 | no | let deltas = []; |
| lower | const | 179 | no | const lower = lane.toLowerCase(); |
| owned | variable | 180 | no | let owned = []; |
| laneDeltas | const | 182 | no | const laneDeltas = deltas.filter((d) =&gt; d.workflow === &quot;arbor-area-&quot; + lower); |
| paths | const | 183 | no | const paths = []; |
| ownOwned | variable | 194 | no | let ownOwned = []; |
| pathTokens | function | 197 | no | const pathTokens = (text) =&gt; { |
| out | const | 198 | no | const out = new Set(); |
| re | const | 199 | no | const re = /(?:[A-Za-z0-9_.-]+\\\\/)+[A-Za-z0-9_.-]+\\\\.[A-Za-z0-9]{1,6}/g; |
| m | variable | 200 | no | let m; |
| cross | const | 204 | no | const cross = []; |
| phase | const | 206 | no | const phase = at(r, &quot;Phase decision&quot;); |
| targets | const | 208 | no | const targets = TARGETS.filter((t) =&gt; isSet(at(r, t))).map((t) =&gt; t.replace(&quot;Target &quot;, &quot;&quot;)); |
| path | const | 210 | no | const path = at(r, &quot;Repository path&quot;); |
| id | const | 211 | no | const id = at(r, &quot;ID&quot;); |
| claimed | const | 212 | no | const claimed = claimedPaths.has(path) \|\| changedIds.has(id); |
| anchors | const | 213 | no | const anchors = [at(r, &quot;Proposed action / boundary&quot;), at(r, &quot;Observed consumers / dependencies&quot;), at(r, &quot;Known missing or stale dependency&quot;), at(r, &quot;Evidence detail / anchor&quot;)].join(&quot; &quot;); |
| extra | const | 214 | no | const extra = []; |
| unclaimed | const | 231 | no | const unclaimed = cross.filter((c) =&gt; !c.claimed); |
| groups | const | 232 | no | const groups = new Map(); |
| gk | const | 234 | no | const gk = c.targets.slice().sort().join(&quot;+&quot;) + &quot;\|&quot; + c.acceptance.slice(0, 70); |
| units | const | 238 | no | const units = []; |
| n | variable | 239 | no | let n = 0; |
| paths | const | 241 | no | const paths = []; |
| chunks | const | 243 | no | const chunks = []; |
| per | const | 244 | no | const per = 6; |
| members | const | 248 | no | const members = rowsIn.filter((c) =&gt; c.candidatePaths.some((p) =&gt; chunk.indexOf(p) &gt;= 0)); |
| PATCH_CODE | const | 272 | no | const PATCH_CODE = PARSE_HELPER + ` |
| master | const | 273 | no | const master = readMaster(process.argv[4]); |
| at | const | 274 | no | const at = master.at; |
| deltaDir | const | 275 | no | const deltaDir = process.argv[5]; |
| outDir | const | 276 | no | const outDir = process.argv[6]; |
| runId | const | 277 | no | const runId = process.argv[7]; |
| SOURCE | const | 278 | no | const SOURCE = process.argv[3]; |
| REL | const | 279 | no | const REL = &quot;ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz&quot;; |
| LABS | const | 280 | no | const LABS = process.argv[2]; |
| blobs | const | 281 | no | const blobs = blobMap(); |
| byId | const | 282 | no | const byId = {}; |
| labsCommit | variable | 284 | no | let labsCommit = &quot;&quot;; |
| labsBlob | variable | 285 | no | let labsBlob = &quot;&quot;; |
| deltas | const | 289 | no | const deltas = []; |
| perLane | const | 291 | no | const perLane = {}; |
| skipped | const | 292 | no | const skipped = []; |
| alreadyApplied | const | 293 | no | const alreadyApplied = []; |
| delta | const | 295 | no | const delta = d.delta; |
| row | const | 297 | no | const row = byId[ch.id]; |
| path | const | 299 | no | const path = at(row, &quot;Repository path&quot;); |
| blob | const | 300 | no | const blob = blobs[path]; |
| lane | const | 302 | no | const lane = at(row, &quot;Parallel lane&quot;); |
| changed | const | 303 | no | const changed = {}; |
| already | const | 311 | no | const already = Object.keys(changed).every((k) =&gt; at(row, k) === String(changed[k])); |
| guards | const | 313 | no | const guards = {}; |
| anchor | const | 315 | no | const anchor = at(row, &quot;Evidence detail / anchor&quot;); |
| lm | const | 316 | no | const lm = /:(\\\\d+)/.exec(anchor); |
| line | const | 317 | no | const line = lm ? lm[1] : &quot;1&quot;; |
| unit | const | 318 | no | const unit = delta.unit \|\| &quot;unknown&quot;; |
| written | const | 339 | no | const written = []; |
| rows | const | 341 | no | const rows = perLane[lane]; |
| part | const | 343 | no | const part = rows.slice(i, i + 500); |
| patch | const | 344 | no | const patch = { |
| name | const | 352 | no | const name = outDir + &quot;/patch-&quot; + lane + (rows.length &gt; 500 ? &quot;-&quot; + Math.floor(i / 500) : &quot;&quot;) + &quot;.json&quot;; |
| HEALTH_CODE | const | 360 | no | const HEALTH_CODE = ` |
| home | const | 363 | no | const home = process.env.USERPROFILE \|\| process.env.HOME; |
| db | const | 364 | no | const db = new Database(home + &quot;/.zcode/cli/db/db.sqlite&quot;, { readonly: true }); |
| rows | const | 365 | no | const rows = db.prepare(&quot;SELECT model_id, error_type, COUNT(*) AS n FROM model_usage WHERE started_at &gt; ? GROUP BY model_id, error_type&quot;).all(Date.now() - 600000); |
| out | const | 366 | no | const out = {}; |
| id | const | 368 | no | const id = String(r.model_id \|\| &quot;&quot;).replace(/\\\\$.*$/, &quot;&quot;); |
| bare | const | 369 | no | const bare = id.indexOf(&quot;/&quot;) &gt;= 0 ? id.split(&quot;/&quot;).slice(1).join(&quot;/&quot;) : id; |
| e | const | 371 | no | const e = r.error_type === &quot;rate_limited&quot; ? &quot;rate&quot; : &quot;errors&quot;; |
| CrossRow | interface | 379 | no | interface CrossRow { |
| CrossUnit | interface | 388 | no | interface CrossUnit { |
| LaneUnitReport | interface | 396 | no | interface LaneUnitReport { |
| LaneReport | interface | 403 | no | interface LaneReport { |
| ScanResult | interface | 411 | no | interface ScanResult { |
| DeltaChange | interface | 420 | no | interface DeltaChange { |
| DeltaDiscovery | interface | 427 | no | interface DeltaDiscovery { |
| Delta | interface | 432 | no | interface Delta { |
| Verdict | interface | 439 | no | interface Verdict { |
| MergeOutcome | interface | 449 | no | interface MergeOutcome { |
| Finding | interface | 456 | no | interface Finding { |
| WorkflowReport | interface | 463 | no | interface WorkflowReport { |
| PROTECTED_FIELDS | const | 470 | no | const PROTECTED_FIELDS = [ |
| CANONICAL_NOT_COVERED | const | 475 | no | const CANONICAL_NOT_COVERED = [ |
| budgetArg | const | 481 | no | const budgetArg = Number(args.maxUnits); |
| budget | const | 482 | no | const budget = Number.isFinite(budgetArg) &amp;&amp; budgetArg &gt; 0 ? budgetArg : BATCH_BOUNDARY; |
| maxUnits | const | 483 | no | const maxUnits = Math.min(budget, BATCH_BOUNDARY); |
| concArg | const | 484 | no | const concArg = Number(args.concurrency); |
| concurrency | const | 485 | no | const concurrency = Math.min(Math.max(Number.isFinite(concArg) &amp;&amp; concArg &gt; 0 ? concArg : 2), 2); |
| slug | function | 486 | no | const slug = (id: string): string =&gt; id.replace(/[^A-Za-z0-9._-]+/g, &quot;-&quot;); |
| waveOf | function | 487 | no | const waveOf = (u: CrossUnit): string =&gt; { |
| best | variable | 488 | no | let best = &quot;&quot;; |
| M_MISTRAL | const | 495 | no | const M_MISTRAL = model(&quot;new-provider/mistralai/mistral-large-4-1t-a52b&quot;); |
| M_M3 | const | 496 | no | const M_M3 = model(&quot;minimax-m-plan/MiniMax-M3&quot;); |
| M_M3F | const | 497 | no | const M_M3F = model(&quot;minimax-m-plan/MiniMax-M3.1-Flash$max&quot;); |
| M_ERNIE | const | 498 | no | const M_ERNIE = model(&quot;openrouter-2/baidu/ernie-5.5-flash-preview:free&quot;); |
| M_LING | const | 499 | no | const M_LING = model(&quot;openrouter-2/inclusionai/ling-3.2-flash:free&quot;); |
| healthRun | const | 500 | no | const healthRun = await world.run(&quot;bun&quot;, [&quot;-e&quot;, HEALTH_CODE], { output: { tail: 4096 } }); |
| health | variable | 501 | no | let health: Record&lt;string, { errors: number; rate: number }&gt; = {}; |
| hot | function | 507 | no | const hot = (id: string): boolean =&gt; { |
| bare | const | 508 | no | const bare = id.indexOf(&quot;/&quot;) &gt;= 0 ? id.split(&quot;/&quot;).slice(1).join(&quot;/&quot;) : id; |
| a | const | 509 | no | const a = health[id] \|\| { errors: 0, rate: 0 }; |
| b | const | 510 | no | const b = health[bare] \|\| { errors: 0, rate: 0 }; |
| BUILDER | const | 513 | no | const BUILDER = hot(&quot;new-provider/mistralai/mistral-large-4-1t-a52b&quot;) ? (hot(&quot;minimax-m-plan/MiniMax-M3&quot;) ? (hot(&quot;minimax-m-plan/MiniMax-M3.1-Flash&quot;) ? M_ERNIE : M_M3F) : M_M3) : M_MISTRAL; |
| PLANNER | const | 514 | no | const PLANNER = hot(&quot;minimax-m-plan/MiniMax-M3&quot;) ? (hot(&quot;minimax-m-plan/MiniMax-M3.1-Flash&quot;) ? M_MISTRAL : M_M3F) : M_M3; |
| VERIFIER | function | 515 | no | const VERIFIER = ((): ModelRef =&gt; { // Independent verification: the verifier is never the builder&#39;s model. const pool: [ModelRef, string][] = [[M_M3F, &quot;minimax-m-plan/MiniMax-M3.1-Flash&quot;], [M_M3, &quot;m… |
| pool | const | 517 | no | const pool: [ModelRef, string][] = [[M_M3F, &quot;minimax-m-plan/MiniMax-M3.1-Flash&quot;], [M_M3, &quot;minimax-m-plan/MiniMax-M3&quot;], [M_ERNIE, &quot;openrouter-2/baidu/ernie-5.5-flash-preview:free&quot;]]; |
| TRIAGE | const | 523 | no | const TRIAGE = hot(&quot;openrouter-2/inclusionai/ling-3.2-flash:free&quot;) ? (hot(&quot;minimax-m-plan/MiniMax-M3.1-Flash&quot;) ? M_M3 : M_M3F) : M_LING; |
| fetchRun | const | 528 | no | const fetchRun = await world.run(&quot;git&quot;, [&quot;-C&quot;, LABS_DIR, &quot;fetch&quot;, &quot;--prune&quot;], { timeoutMs: 120000, output: { tail: 512 } }); |
| scanRun | const | 529 | no | const scanRun = await world.run(&quot;bun&quot;, [&quot;.coordination/tools/integrate-scan.mjs&quot;, ARBOR_DIR, LABS_DIR, SOURCE_PIN, LABS_GZ, DELTA_DIR, EVIDENCE_DIR], { timeoutMs: 300000, output: { tail: 4194304 } }); |
| scan | variable | 530 | no | let scan: ScanResult; |
| laneSummary | const | 536 | no | const laneSummary = LANES.map((l) =&gt; { const r = scan.lanes[l]; return l + &quot;: &quot; + (r ? (r.deltaCount + &quot; delta(s), &quot; + r.verified + &quot; verified, &quot; + r.committed + &quot; committed, &quot; + r.claimedPaths.lengt… |
| r | const | 537 | no | const r = scan.lanes[l]; |
| planner | const | 548 | no | const planner = agent(&quot;Integration planner&quot;, { model: PLANNER }); |
| planned | const | 549 | no | const planned = await planner.ask&lt;{ selected: string[]; notes: string }&gt;( &quot;The cross-component units are in &quot; + ROOT_HINT + &quot;/&quot; + EVIDENCE_DIR + &quot;/ — read the deterministic scan output and choose the… |
| crossUnits | const | 560 | no | const crossUnits: CrossUnit[] = []; |
| work | const | 565 | no | const work: CrossUnit[] = crossUnits.slice(0, maxUnits); |
| claimPayload | const | 570 | no | const claimPayload = { lane: &quot;INTEGRATE&quot;, runId: run.id \|\| &quot;none&quot;, ownedPaths: work.flatMap((u) =&gt; u.ownedPaths) }; |
| claimWriter | const | 571 | no | const claimWriter = agent(&quot;Integration claim writer&quot;, { model: TRIAGE }); |
| GateSpec | interface | 580 | no | interface GateSpec { |
| pwaSuites | const | 586 | no | const pwaSuites: string[] = await files.glob(&quot;apps/mobile-relay/test/*.test.mjs&quot;); |
| componentOf | function | 587 | no | function componentOf(p: string): string { |
| gatesFor | function | 598 | no | function gatesFor(u: CrossUnit): GateSpec[] { |
| comps | const | 599 | no | const comps = Array.from(new Set(u.ownedPaths.map(componentOf))); |
| out | const | 600 | no | const out: GateSpec[] = []; |
| runUnit | function | 626 | no | async function runUnit(u: CrossUnit): Promise&lt;Verdict&gt; { |
| gates | const | 627 | no | const gates = gatesFor(u); |
| builder | const | 628 | no | const builder = agent(&quot;Integration builder &quot; + u.id, { model: BUILDER }); |
| owned | const | 629 | no | const owned = u.ownedPaths.join(&quot;, &quot;); |
| rowsBrief | const | 630 | no | const rowsBrief = u.rows.map((r) =&gt; r.id + &quot; @ &quot; + r.path + &quot; :: &quot; + r.action).join(&quot;\\n&quot;); |
| gateText | const | 631 | no | const gateText = gates.map((g) =&gt; g.command + &quot; (&quot; + g.what + &quot;)&quot;).join(&quot; + &quot;); |
| first | const | 632 | no | const first = await builder.ask&lt;Delta&gt;( &quot;CROSS-COMPONENT BUILD UNIT in &quot; + ROOT_HINT + &quot;. &quot; + &quot;Unit id &quot; + u.id + &quot;; components crossed: &quot; + u.span.replace(/\\+/g, &quot;, &quot;) + &quot;; acceptance: &quot; + u.accepta… |
| delta | const | 645 | no | const delta: Delta = { |
| trackedBefore | const | 652 | no | const trackedBefore = await world.run(&quot;git&quot;, [&quot;status&quot;, &quot;--porcelain&quot;], { output: { tail: 16384 } }); |
| beforePaths | const | 653 | no | const beforePaths = new Set(trackedBefore.stdout.split(/\\r?\\n/).map((l) =&gt; l.trim()).filter(Boolean).map((l) =&gt; l.slice(3).trim())); |
| after | const | 654 | no | const after = await world.run(&quot;git&quot;, [&quot;status&quot;, &quot;--porcelain&quot;], { output: { tail: 16384 } }); |
| afterPaths | const | 655 | no | const afterPaths = after.stdout.split(/\\r?\\n/).map((l) =&gt; l.trim()).filter(Boolean).map((l) =&gt; l.slice(3).trim()); |
| changed | const | 656 | no | const changed = afterPaths.filter((p) =&gt; !beforePaths.has(p)); |
| ownedSet | const | 657 | no | const ownedSet = new Set(u.ownedPaths); |
| outside | const | 658 | no | const outside = changed.filter((p) =&gt; !ownedSet.has(p) &amp;&amp; p.indexOf(&quot;.coordination/&quot;) !== 0 &amp;&amp; p.indexOf(RECEIPT_DIR + &quot;/&quot;) !== 0); |
| gateExit | variable | 662 | no | let gateExit = 0; |
| gateTail | variable | 663 | no | let gateTail = &quot;&quot;; |
| gateFailed | variable | 664 | no | let gateFailed = false; |
| g | const | 667 | no | const g = gate.runner === &quot;cargo&quot; |
| preflight | const | 686 | no | const preflight = gateExit === 2 &amp;&amp; /BLOCKED_PREFLIGHT\|DIRTY_CHECKOUT\|GIT_SHA_NOT_PINNED\|NODE_24_REQUIRED/.test(gateTail); |
| repairs | variable | 690 | no | let repairs = 0; |
| verdict | variable | 691 | no | let verdict: Verdict[&quot;verdict&quot;] = gateExit === 0 ? &quot;VERIFIED&quot; : &quot;REPLAN&quot;; |
| note | variable | 692 | no | let note = &quot;gate exit &quot; + gateExit + &quot; (&quot; + gateText + &quot;); changed=&quot; + changed.length + &quot; outside-owned=&quot; + outside.length; |
| verifier | const | 694 | no | const verifier = agent(&quot;Integration verifier &quot; + u.id, { model: VERIFIER }); |
| v | const | 696 | no | const v = await verifier.ask&lt;{ pass: boolean; failure: string }&gt;( &quot;Independently verify the cross-component unit &quot; + u.id + &quot; in &quot; + ROOT_HINT + &quot;. &quot; + &quot;Acceptance: &quot; + u.acceptance + &quot;. Owned paths:… |
| fix | const | 710 | no | const fix = await builder.ask&lt;Delta&gt;( &quot;REPAIR ROUND &quot; + repairs + &quot; for unit &quot; + u.id + &quot;. The verifier found: &quot; + String(v.failure).slice(0, 700) + &quot;. &quot; + &quot;Gate tail: &quot; + gateTail.slice(-500) + &quot;. &quot;… |
| gate | const | 724 | no | const gate = gates[0]; |
| g | variable | 725 | no | let g; |
| ownedChanged | const | 743 | no | const ownedChanged = changed.filter((p) =&gt; ownedSet.has(p)); |
| evidence | const | 744 | no | const evidence = &quot;gate &quot; + gateText + &quot; exit &quot; + gateExit; |
| verdicts | const | 755 | no | const verdicts: Verdict[] = []; |
| wave | const | 757 | no | const wave = work.slice(i, i + concurrency); |
| waveOut | const | 758 | no | const waveOut = await Promise.all(wave.map((u) =&gt; runUnit(u))); |
| notePrefix | const | 768 | no | const notePrefix = &quot;workflow:&quot; + WORKFLOW_NAME + &quot; run:&quot; + (run.id \|\| &quot;none&quot;) + &quot; wave:&quot;; |
| committed | const | 769 | no | const committed: { unit: string; sha: string; paths: string[] }[] = []; |
| u | const | 772 | no | const u = work.filter((x) =&gt; x.id === v.unit)[0]; |
| writer | const | 774 | no | const writer = agent(&quot;Integration delta writer &quot; + u.id, { model: TRIAGE }); |
| changedNote | const | 775 | no | const changedNote = v.ownedChanged.length |
| addRun | const | 799 | no | const addRun = await world.run(&quot;git&quot;, [&quot;add&quot;, &quot;--&quot;, ...v.ownedChanged], { output: { tail: 1024 } }); |
| commitRun | const | 800 | no | const commitRun = await world.run(&quot;git&quot;, [&quot;commit&quot;, &quot;-m&quot;, &quot;feat(integrate): &quot; + u.id + &quot; (&quot; + u.rowIds.length + &quot; rows)&quot;], { output: { tail: 1024 } }); |
| shaRun | const | 801 | no | const shaRun = await world.run(&quot;git&quot;, [&quot;rev-parse&quot;, &quot;--short&quot;, &quot;HEAD&quot;], { output: { tail: 64 } }); |
| sha | const | 802 | no | const sha = shaRun.stdout.trim(); |
| ledgerNote | const | 812 | no | const ledgerNote = await mergeUnitIntoLedger(u, v, sha); |
| mergeUnitIntoLedger | function | 822 | no | async function mergeUnitIntoLedger(u: CrossUnit, v: Verdict, sha: string): Promise&lt;string&gt; { |
| lanes | const | 823 | no | const lanes = Array.from(new Set(u.rows.map((r) =&gt; r.lane))); |
| patcher | const | 824 | no | const patcher = agent(&quot;Ledger patch builder &quot; + u.id, { model: TRIAGE }); |
| last | variable | 825 | no | let last = &quot;&quot;; |
| patchPath | const | 828 | no | const patchPath = DELTA_DIR + &quot;/&quot; + slug(u.id) + &quot;.patch-&quot; + lane + &quot;.json&quot;; |
| ok | variable | 838 | no | let ok = true; |
| patchPath | const | 840 | no | const patchPath = DELTA_DIR + &quot;/&quot; + slug(u.id) + &quot;.patch-&quot; + lane + &quot;.json&quot;; |
| merge | const | 841 | no | const merge = await runLedgerTool(&quot;merge&quot;, patchPath); |
| runLedgerTool | function | 856 | no | async function runLedgerTool(command: string, patchPath: string): Promise&lt;{ exitCode: number; stdout: string; stderr: string }&gt; { |
| args | const | 858 | no | const args = command === &quot;merge&quot; |
| auditRun | const | 866 | no | const auditRun = await runLedgerTool(&quot;audit&quot;, &quot;&quot;); |
| patchRun | const | 868 | no | const patchRun = await world.run(&quot;bun&quot;, [&quot;.coordination/tools/integrate-patch.mjs&quot;, ARBOR_DIR, LABS_DIR, SOURCE_PIN, LABS_GZ, DELTA_DIR, PATCH_DIR, run.id \|\| &quot;none&quot;], { timeoutMs: 600000, output: { t… |
| patchInfo | variable | 869 | no | let patchInfo: { labsCommit: string; labsBlob: string; deltaFiles: number; patches: { lane: string; file: string; rows: number }[]; alreadyApplied: number; skippedCount: number }; |
| mergeOutcomes | const | 876 | no | const mergeOutcomes: MergeOutcome[] = []; |
| m | const | 878 | no | const m = await runLedgerTool(&quot;merge&quot;, p.file); |
| labsAdd | const | 888 | no | const labsAdd = await world.run(&quot;git&quot;, [&quot;-C&quot;, LABS_DIR, &quot;add&quot;, &quot;--&quot;, LEDGER_REL], { output: { tail: 1024 } }); |
| labsCommitRun | const | 889 | no | const labsCommitRun = await world.run(&quot;git&quot;, [&quot;-C&quot;, LABS_DIR, &quot;commit&quot;, &quot;-m&quot;, &quot;chore(ledger): merge ARBOR integration deltas (&quot; + mergeOutcomes.filter((m) =&gt; m.exitCode === 0).length + &quot; patch(es))&quot;]… |
| extractRun | const | 891 | no | const extractRun = await world.run(&quot;bun&quot;, [&quot;-e&quot;, &quot;const fs=require(&#39;fs&#39;);const raw=new TextDecoder(&#39;utf-8&#39;).decode(Bun.gunzipSync(fs.readFileSync(process.argv[1])));fs.mkdirSync(require(&#39;path&#39;).dirna… |
| finalAudit | const | 895 | no | const finalAudit = await runLedgerTool(&quot;audit&quot;, &quot;&quot;); |
| finalLabsAdd | const | 897 | no | const finalLabsAdd = await world.run(&quot;git&quot;, [&quot;-C&quot;, LABS_DIR, &quot;add&quot;, &quot;--&quot;, LEDGER_REL], { output: { tail: 1024 } }); |
| finalLabsCommit | const | 898 | no | const finalLabsCommit = await world.run(&quot;git&quot;, [&quot;-C&quot;, LABS_DIR, &quot;commit&quot;, &quot;-m&quot;, &quot;chore(ledger): bring the ARBOR master fully up to date (arbor-integrate)&quot;], { output: { tail: 2048 } }); |
| finalRefresh | const | 900 | no | const finalRefresh = await world.run(&quot;bun&quot;, [&quot;-e&quot;, &quot;const fs=require(&#39;fs&#39;);const raw=new TextDecoder(&#39;utf-8&#39;).decode(Bun.gunzipSync(fs.readFileSync(process.argv[1])));fs.mkdirSync(require(&#39;path&#39;).dir… |
| centralGate | const | 905 | no | const centralGate = await world.run(&quot;bun&quot;, [&quot;scripts/test-gate.mjs&quot;, &quot;--all&quot;], { timeoutMs: 1800000, output: { tail: 16384 } }); |
| r004Full | const | 907 | no | const r004Full = await world.run(&quot;node&quot;, [&quot;integration/scripts/r004-local-gate.mjs&quot;, &quot;--full&quot;], { timeoutMs: 1800000, output: { tail: 16384 } }); |
| r004Tail | const | 909 | no | const r004Tail = (r004Full.stderr \|\| r004Full.stdout).slice(-1500); |
| r004Preflight | const | 910 | no | const r004Preflight = r004Full.exitCode === 2 &amp;&amp; /DIRTY_CHECKOUT\|GIT_SHA_NOT_PINNED\|NODE_24_REQUIRED\|BLOCKED_PREFLIGHT/.test(r004Tail); |
| r004Verdict | const | 911 | no | const r004Verdict = r004Preflight ? &quot;INCONCLUSIVE&quot; : r004Full.exitCode === 0 ? &quot;PASS&quot; : &quot;FAIL&quot;; |
| withCode | const | 915 | no | const withCode = verdicts.filter((v) =&gt; v.verdict === &quot;VERIFIED&quot;); |
| withEvidence | const | 916 | no | const withEvidence = verdicts.filter((v) =&gt; v.verdict === &quot;CLOSED_NO_CHANGE&quot;); |
| inconclusive | const | 917 | no | const inconclusive = verdicts.filter((v) =&gt; v.verdict === &quot;INCONCLUSIVE&quot;); |
| blocked | const | 918 | no | const blocked = verdicts.filter((v) =&gt; v.verdict === &quot;BLOCKED&quot;); |
| replanned | const | 919 | no | const replanned = verdicts.filter((v) =&gt; v.verdict === &quot;REPLAN&quot;); |
| md | const | 920 | no | const md = [ |
| r | const | 925 | no | const r = scan.lanes[l]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| fs | require | 118 | external |
| child_process | require | 119 | external |
| bun:sqlite | require | 362 | external |
| fs | require | 891 | external |
| path | require | 891 | external |
| fs | require | 900 | external |
| path | require | 900 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 988 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
