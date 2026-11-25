# Craft Everything R001 — Runtime capability acquisition

Owner scope: ARBOR integration and live capability testing. Labs prepares isolated work; Product receives verified native migration. Use existing Craft Anything runtime now, then selectively harvest proven Rust capabilities. Do not replace the Host authority or create a separate product renderer.

## Actual local CLI inventory, 2026-11-25
326 registered commands across 17 toolsets: native 55, core 37, formats 36, projects 30, browser 24, adb 24, setup 20, application 17, runtime 14, android 14, apple 14, javascript 11, frida 9, managed 8, build 6, java 6, database 1. Registration is not evidence of successful execution. Local donor observed HEAD e64d7cb7; binary provenance not yet bound to HEAD.

Browser commands observed: web-scripts-save, web-recording-show, web-browser-connect, web-pages-list, web-page-show, web-page-js-analyze, web-page-watch, web-mcp-tools-list, web-page-screenshot-take, web-snapshots-compare, web-pixels-compare, web-walkthrough-record, web-walkthrough-check, web-site-open, web-site-capture, web-page-states-capture, web-site-close, web-site-sign-in, web-site-sign-out, web-standin-build, web-standin-start, web-standin-stop, web-standin-show, web-coverage-measure, web-listeners-list, web-modules-trace. This is the observed web-prefixed subset across toolsets, not a claim of 26 browser-toolset entries. Additional observed commands: core-evidence-show/export/import/browse/exports-compare, core-investigation-show, runtime-ui-read, runtime-ui-walkthrough-record.

## Reproducible full roster extraction
Run on authorized local workstation (PowerShell 7). Output to a fresh directory; do not overwrite prior receipts.
```powershell
$b='C:\0-BlackBoxProject-0'
$c="$b\craft-anything\target\release\craft-anything-cli.exe"
$d="$b\ARBOR\docs\craft-everything"
if(Test-Path "$d\craft-command-catalog.json"){throw 'Existing catalog; version it first'}
New-Item -ItemType Directory -Force $d | Out-Null
$raw=(& $c commands | Out-String)
if($LASTEXITCODE -ne 0){throw 'CLI inventory failed'}
$l=$raw | ConvertFrom-Json
if($l.Count -lt 300){throw 'Inventory incomplete'}
$raw | Set-Content "$d\craft-command-catalog.json" -Encoding utf8
$l | ForEach-Object { [pscustomobject]@{command=$_.command;tool=$_.tool;toolset=$_.toolset;title=$_.title;needs_target=$_.needs_target;runtime_status='registered_not_executed';migration_status='unassessed';vlang_status='deferred'} } | Export-Csv "$d\capability-roster.csv" -NoTypeInformation -Encoding utf8
@{schema='vivim.craft-roster/1';donor_commit=(git -C "$b\craft-anything" rev-parse HEAD);binary_sha256=(Get-FileHash $c).Hash.ToLower();count=$l.Count;toolsets=@($l | Group-Object toolset | ForEach-Object {@{name=$_.Name;count=$_.Count}})} | ConvertTo-Json -Depth 5 | Set-Content "$d\inventory-receipt.json" -Encoding utf8
```
Full catalog preserves original descriptors and summaries; CSV assigns independent runtime, migration and VLANG status. Keep binary digest and donor SHA distinct. 

## ChatGPT complete surface atlas — initial coverage queue
All entries are unobserved in this round; enumerate new branches as encountered.
CG01 shell/navigation; CG02 history/search; CG03 conversation lifecycle; CG04 composer/attachments; CG05 responses/artifacts; CG06 model/reasoning controls; CG07 projects; CG08 every settings section; CG09 memory/personalization; CG10 plugins/active tools; CG11 plugin consent/connection; CG12 Work/tasks; CG13 library/files; CG14 account/session; CG15 errors/notifications; CG16 voice/media; CG17 sharing; CG18 keyboard/accessibility; CG19 responsive layouts; CG20 unknown reachable states.
Every observation records capability ID, route and control identity, accessible role, allowed parameters, visibility and availability, prerequisites, transitions, effect type, observed postconditions, evidence IDs, source/version, privacy classification, coverage status, migration disposition and deferred VLANG mapping. Do not report an unobserved feature as available.

## Runtime sequence
1. Reuse Craft native executable and direct DeepSeek setup; invoke through Host-owned sessions.
2. Use only Studio's verified owned browser context or authorized dedicated investigation browser. Do not copy credentials or collect conversation bodies, secrets, private request bodies or provider source scripts. Keep private raw captures local; import structural evidence using the existing Craft adapter.
3. Record passive surfaces first, then bounded approved interactions; separate observations from actions and verify postconditions.
4. Studio receives intelligence, Harness consumes reusable interaction semantics, Host executes and records receipts, GPUI remains sole product UI. VLANG later maps proven semantic actions rather than creating a new compiler.
5. Rank donor capabilities by actual use, gaps, cost and native feasibility; harvest Rust modules into ARBOR with tests when justified.

## First end-to-end acceptance: refresh ARBOR MCP tools
Intent: refresh VIVIM ARBOR plugin tool catalog. Resolve signed-in ChatGPT and current plugin, discover actual active-tools path, enumerate all scrollable tools, compare current IDs with expected advertised catalog. Invoke only an observed supported refresh/reconnect interaction; do not change permissions or install unrelated tools. Re-read catalog and verify expected IDs. Record before/after evidence, command trace and Host receipt. No Desktop Commander, guessed selectors, synthetic success or silent permission changes. If UI has no refresh operation, record the supported path and discrepancy without pretending success.

## Evidence and status
Earlier focused Studio Craft tests: 18/18. Labs importer: 22/23, CAPTURE_COUNT_MISMATCH: outline. The local CLI command inventory and help were actually queried. Local transport subsequently rejected the roster write; its outcome is unconfirmed. Full raw catalog persistence, signed-in ChatGPT extraction, refresh and native migration are not verified yet.
