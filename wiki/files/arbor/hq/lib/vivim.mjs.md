# File: hq/lib/vivim.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/vivim.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 44901 B |
| Lines | 1067 |
| Hash | 1d27bc81411d |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 11 | no | const SCHEMA = &#39;hq.vivim-alignment/1&#39;; |
| MAX_STRING | const | 12 | no | const MAX_STRING = 2000; |
| SECRET_PATTERNS | const | 15 | no | const SECRET_PATTERNS = [ |
| GOALS_CAP | const | 22 | no | const GOALS_CAP = 12; |
| DRIFT_MAX_REASONS | const | 23 | no | const DRIFT_MAX_REASONS = 40; |
| MARKDOWN_MAX_BYTES | const | 24 | no | const MARKDOWN_MAX_BYTES = 4000; |
| STOPWORDS | const | 26 | no | const STOPWORDS = new Set([ &#39;a&#39;, &#39;an&#39;, &#39;and&#39;, &#39;are&#39;, &#39;as&#39;, &#39;at&#39;, &#39;be&#39;, &#39;but&#39;, &#39;by&#39;, &#39;can&#39;, &#39;could&#39;, &#39;for&#39;, &#39;from&#39;, &#39;had&#39;, &#39;has&#39;, &#39;have&#39;, &#39;he&#39;, &#39;her&#39;, &#39;hers&#39;, &#39;him&#39;, &#39;his&#39;, &#39;i&#39;, &#39;if&#39;, &#39;in&#39;, &#39;into&#39;, &#39;i… |
| JSON_ROLES | const | 36 | no | const JSON_ROLES = [ |
| cleanString | function | 47 | no | function cleanString(value) { |
| s | variable | 48 | no | let s = String(value ?? &#39;&#39;); |
| projectAbsPath | function | 56 | no | function projectAbsPath(root, project) { |
| path | const | 58 | no | const path = project &amp;&amp; project.path ? String(project.path) : &#39;&#39;; |
| readJsonFile | function | 63 | no | function readJsonFile(abs) { |
| text | const | 64 | no | const text = readFileSync(abs, &#39;utf8&#39;); |
| qualifiers | const | 67 | no | const qualifiers = []; |
| abs | const | 70 | no | const abs = projectAbsPath(root, project); |
| roadmap | const | 71 | no | const roadmap = existsSync(join(abs, &#39;docs&#39;, &#39;roadmap.json&#39;)); |
| capabilities | const | 72 | no | const capabilities = existsSync(join(abs, &#39;docs&#39;, &#39;capabilities&#39;, &#39;atomic-registry.json&#39;)); |
| boundPayload | function | 80 | no | function boundPayload(obj) { |
| syncVivim | function | 85 | yes | export function syncVivim(db, { root = &#39;.&#39;, projects = [], now = null } = {}) { |
| space | const | 86 | no | const space = findVivimSpace({ root, projects }); |
| abs | const | 89 | no | const abs = space.abs; |
| syncedAt | const | 90 | no | const syncedAt = now ? new Date(now).toISOString() : new Date().toISOString(); |
| sources | const | 91 | no | const sources = []; |
| roles | const | 92 | no | const roles = {}; |
| counts | const | 93 | no | const counts = { goal: 0, phase: 0, capability: 0, requirement: 0, task: 0, journey: 0, gap: 0, route: 0 }; |
| skipped | variable | 94 | no | let skipped = 0; |
| roadmap | variable | 96 | no | let roadmap = null; |
| capabilities | variable | 97 | no | let capabilities = null; |
| crosswalk | variable | 98 | no | let crosswalk = null; |
| criticality | variable | 99 | no | let criticality = null; |
| routes | variable | 100 | no | let routes = null; |
| journey | variable | 101 | no | let journey = null; |
| gaps | variable | 102 | no | let gaps = null; |
| catalog | variable | 103 | no | let catalog = null; |
| goalsText | variable | 104 | no | let goalsText = null; |
| absPath | const | 108 | no | const absPath = join(abs, rel); |
| text | variable | 109 | no | let text; |
| parsed | variable | 114 | no | let parsed; |
| goalsAbs | const | 130 | no | const goalsAbs = join(abs, &#39;GOALS.md&#39;); |
| records | const | 137 | no | const records = []; // {kind,id,title,status,priority,parent,links,payload} |
| add | function | 139 | no | const add = (kind, id, title, status, priority, parent, links, payloadObj) =&gt; { |
| activePhase | const | 145 | no | const activePhase = roadmap &amp;&amp; roadmap.activePhase; |
| id | const | 147 | no | const id = String(activePhase.id); |
| title | const | 148 | no | const title = cleanString(activePhase.title \|\| id); |
| payload | const | 149 | no | const payload = { |
| milestoneList | const | 162 | no | const milestoneList = []; |
| id | const | 174 | no | const id = `goal-${m.id}`; |
| title | const | 175 | no | const title = cleanString(m.title \|\| m.id); |
| payload | const | 176 | no | const payload = { |
| glines | const | 189 | no | const glines = goalsText.split(/\\r?\\n/); |
| goalCount | variable | 190 | no | let goalCount = 0; |
| title | const | 196 | no | const title = cleanString(match[1]); |
| paras | const | 197 | no | const paras = []; |
| j | variable | 198 | no | let j = i + 1; |
| line | const | 202 | no | const line = glines[j]; |
| payload | const | 207 | no | const payload = { id: `goals-md-${String(goalCount).padStart(2, &#39;0&#39;)}`, title, statement: cleanString(paras.join(&#39; &#39;)), source: `GOALS.md:${i + 1}` }; |
| capItems | const | 215 | no | const capItems = capabilities &amp;&amp; Array.isArray(capabilities.items) ? capabilities.items : []; |
| id | const | 219 | no | const id = String(item.id); |
| title | const | 220 | no | const title = cleanString(item.title); |
| status | const | 221 | no | const status = item.decisionState; |
| priority | const | 222 | no | const priority = item.productPriority; |
| links | const | 223 | no | const links = Array.isArray(item.links &amp;&amp; item.links.roadmap) |
| acceptance | const | 226 | no | const acceptance = cleanString(item.acceptance); |
| spec | const | 227 | no | const spec = item.spec != null ? String(item.spec) : null; |
| sourceFiles | const | 228 | no | const sourceFiles = Array.isArray(item.links &amp;&amp; item.links.existingSourceCandidates) |
| symbols | const | 231 | no | const symbols = Array.isArray(item.links &amp;&amp; item.links.verifiedSymbols) |
| payload | const | 234 | no | const payload = { |
| acceptance | const | 252 | no | const acceptance = item.acceptance; |
| id | const | 254 | no | const id = `${item.id}#acceptance`; |
| title | const | 255 | no | const title = cleanString(item.title); |
| spec | const | 256 | no | const spec = item.spec != null ? String(item.spec) : null; |
| payload | const | 257 | no | const payload = { id, parent: String(item.id), spec, acceptance: cleanString(acceptance) }; |
| items | const | 264 | no | const items = roadmap &amp;&amp; Array.isArray(roadmap.items) ? roadmap.items : []; |
| id | const | 268 | no | const id = String(it.id); |
| title | const | 269 | no | const title = cleanString(it.title); |
| status | const | 270 | no | const status = it.status; |
| owner | const | 271 | no | const owner = cleanString(it.owner); |
| refs | const | 272 | no | const refs = Array.isArray(it.refs) ? it.refs.filter((x) =&gt; x != null).map(String).sort() : []; |
| dependsOn | const | 273 | no | const dependsOn = Array.isArray(it.depends_on) ? it.depends_on.filter((x) =&gt; x != null).map(String).sort() : []; |
| notes | const | 274 | no | const notes = cleanString(it.notes); |
| payload | const | 275 | no | const payload = { id, title, status, owner, refs, depends_on: dependsOn, notes }; |
| stepInfo | const | 283 | no | const stepInfo = {}; |
| stepOrder | const | 292 | no | const stepOrder = []; |
| stepSeen | const | 293 | no | const stepSeen = new Set(); |
| stepPlacement | const | 294 | no | const stepPlacement = new Map(); |
| pushStep | function | 295 | no | const pushStep = (rawId) =&gt; { |
| id | const | 296 | no | const id = String(rawId); |
| phaseId | const | 303 | no | const phaseId = phase &amp;&amp; phase.id; |
| groupId | const | 306 | no | const groupId = group &amp;&amp; group.id; |
| stepIds | const | 307 | no | const stepIds = Array.isArray(group &amp;&amp; group.step_ids) ? group.step_ids : []; |
| crosswalkByJourney | const | 322 | no | const crosswalkByJourney = new Map(); |
| journeyId | const | 326 | no | const journeyId = entry &amp;&amp; entry.journeyId ? String(entry.journeyId) : null; |
| uniqueSorted | function | 328 | no | const uniqueSorted = (list) =&gt; [...new Set( (Array.isArray(list) ? list : []).filter((x) =&gt; x != null).map(String), )].sort(); |
| crosswalkJourneys | variable | 339 | no | let crosswalkJourneys = 0; |
| crosswalkCapabilityLinks | variable | 340 | no | let crosswalkCapabilityLinks = 0; |
| crosswalkTaskLinks | variable | 341 | no | let crosswalkTaskLinks = 0; |
| info | const | 345 | no | const info = stepInfo[id] \|\| {}; |
| place | const | 346 | no | const place = stepPlacement.get(id) \|\| {}; |
| title | const | 347 | no | const title = cleanString(info.title \|\| id); |
| dependsOn | const | 348 | no | const dependsOn = Array.isArray(info.depends_on) ? info.depends_on.filter((x) =&gt; x != null).map(String).sort() : []; |
| enables | const | 349 | no | const enables = Array.isArray(info.enables) ? info.enables.filter((x) =&gt; x != null).map(String).sort() : []; |
| phaseId | const | 350 | no | const phaseId = place.phase ?? info.phase ?? null; |
| payload | const | 351 | no | const payload = { |
| edges | const | 358 | no | const edges = crosswalkByJourney.get(id); |
| gapItems | const | 377 | no | const gapItems = gaps &amp;&amp; Array.isArray(gaps.gaps) ? gaps.gaps : []; |
| id | const | 381 | no | const id = String(g.id); |
| title | const | 382 | no | const title = cleanString(g.title); |
| priority | const | 383 | no | const priority = g.priority; |
| classification | const | 384 | no | const classification = g.classification; |
| evidence | const | 385 | no | const evidence = g.evidence &amp;&amp; typeof g.evidence === &#39;object&#39; |
| affectedSteps | const | 388 | no | const affectedSteps = Array.isArray(g.affected_steps) ? g.affected_steps.filter((x) =&gt; x != null).map(String).sort() : []; |
| payload | const | 389 | no | const payload = { |
| routesMap | const | 400 | no | const routesMap = routes &amp;&amp; routes.routes ? routes.routes : {}; |
| id | const | 404 | no | const id = String(routeId); |
| keywords | const | 405 | no | const keywords = Array.isArray(route.keywords) ? route.keywords.filter(Boolean).map(String).sort() : []; |
| docs | const | 406 | no | const docs = Array.isArray(route.docs) ? route.docs.filter(Boolean).map(String).sort() : []; |
| skills | const | 407 | no | const skills = Array.isArray(route.skills) ? route.skills.filter(Boolean).map(String).sort() : []; |
| files | const | 408 | no | const files = Array.isArray(route.files) ? route.files.filter(Boolean).map(String).sort() : []; |
| payload | const | 409 | no | const payload = { id, keywords, docs, skills, files }; |
| digest | const | 415 | no | const digest = sourceDigest(sources); |
| spaceProjectId | variable | 420 | no | let spaceProjectId = null; |
| row | const | 422 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE lower(name) = lower(?)&#39;).get(space.name); |
| insert | const | 429 | no | const insert = db.prepare(` INSERT INTO vivim_records(kind, id, project_id, title, status, priority, parent, links, payload, digest, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) `); |
| sourceDigest | function | 458 | no | function sourceDigest(sources) { |
| lines | const | 459 | no | const lines = sources |
| vivimTablesPresent | function | 467 | yes | export function vivimTablesPresent(db) { |
| row | const | 469 | no | const row = db.prepare(&quot;SELECT name FROM sqlite_master WHERE type=&#39;table&#39; AND name=&#39;vivim_records&#39;&quot;).get(); |
| readAllRows | function | 476 | no | function readAllRows(db) { |
| rows | const | 477 | no | const rows = db.prepare(&#39;SELECT kind, id, title, status, priority, parent, links, payload, digest, synced_at FROM vivim_records ORDER BY kind, id&#39;).all(); |
| byKind | const | 478 | no | const byKind = {}; |
| parsePayload | function | 485 | no | function parsePayload(row) { |
| readAlignment | function | 489 | yes | export function readAlignment(db, { detail = &#39;summary&#39; } = {}) { |
| syncedAt | const | 491 | no | const syncedAt = getMeta(db, &#39;vivim_synced_at&#39;); |
| digest | const | 492 | no | const digest = getMeta(db, &#39;vivim_source_digest&#39;); |
| spaceName | const | 494 | no | const spaceName = getMeta(db, &#39;vivim_space&#39;); |
| spaceRoot | const | 495 | no | const spaceRoot = getMeta(db, &#39;vivim_space_root&#39;); |
| byKind | const | 497 | no | const byKind = readAllRows(db); |
| taskRows | const | 498 | no | const taskRows = byKind.task \|\| []; |
| capabilityRows | const | 499 | no | const capabilityRows = byKind.capability \|\| []; |
| journeyRows | const | 500 | no | const journeyRows = byKind.journey \|\| []; |
| gapRows | const | 501 | no | const gapRows = byKind.gap \|\| []; |
| phaseRows | const | 502 | no | const phaseRows = byKind.phase \|\| []; |
| goalRows | const | 503 | no | const goalRows = byKind.goal \|\| []; |
| requirementRows | const | 504 | no | const requirementRows = byKind.requirement \|\| []; |
| routeRows | const | 505 | no | const routeRows = byKind.route \|\| []; |
| taskIdSet | const | 507 | no | const taskIdSet = new Set(); |
| journeyIdSet | const | 509 | no | const journeyIdSet = new Set(); |
| capabilityLinks | const | 513 | no | const capabilityLinks = new Map(); // capId -&gt; taskIds (existing) |
| dangling | const | 514 | no | const dangling = []; // {capability, task} |
| payload | const | 516 | no | const payload = parsePayload(row); |
| links | const | 517 | no | const links = payload &amp;&amp; Array.isArray(payload.roadmap) ? payload.roadmap : []; |
| existing | const | 518 | no | const existing = []; |
| linkedCapabilityIds | const | 526 | no | const linkedCapabilityIds = new Set(); |
| unlinkedCapabilities | const | 530 | no | const unlinkedCapabilities = []; |
| linkedTaskIds | const | 535 | no | const linkedTaskIds = new Set(); |
| tasksWithoutCapability | const | 539 | no | const tasksWithoutCapability = []; |
| p0WithoutTask | const | 544 | no | const p0WithoutTask = []; |
| payload | const | 546 | no | const payload = parsePayload(row); |
| priority | const | 547 | no | const priority = payload &amp;&amp; payload.productPriority; |
| gapsWithoutSteps | const | 551 | no | const gapsWithoutSteps = []; |
| payload | const | 553 | no | const payload = parsePayload(row); |
| steps | const | 554 | no | const steps = payload &amp;&amp; Array.isArray(payload.affected_steps) ? payload.affected_steps : []; |
| hasExisting | variable | 556 | no | let hasExisting = false; |
| sortAsc | function | 561 | no | const sortAsc = (arr) =&gt; [...arr].sort((a, b) =&gt; String(a).localeCompare(String(b))); |
| capabilitiesWithSource | variable | 564 | no | let capabilitiesWithSource = 0; |
| capabilitiesWithoutSource | variable | 565 | no | let capabilitiesWithoutSource = 0; |
| payload | const | 567 | no | const payload = parsePayload(row); |
| files | const | 568 | no | const files = payload &amp;&amp; Array.isArray(payload.sourceFiles) ? payload.sourceFiles : []; |
| phaseRow | const | 572 | no | const phaseRow = phaseRows[0] \|\| null; |
| phase | const | 573 | no | const phase = phaseRow |
| goals | const | 577 | no | const goals = []; |
| payload | const | 579 | no | const payload = parsePayload(row) \|\| {}; |
| alignment | const | 583 | no | const alignment = { |
| result | const | 593 | no | const result = { |
| groupCount | function | 624 | no | function groupCount(rows, keyOf) { |
| out | const | 625 | no | const out = {}; |
| key | const | 627 | no | const key = keyOf(row); |
| k | const | 628 | no | const k = key == null ? &#39;unknown&#39; : String(key); |
| tokenizeTask | function | 634 | no | function tokenizeTask(text) { |
| raw | const | 635 | no | const raw = String(text ?? &#39;&#39;) |
| scoreCapability | function | 642 | no | function scoreCapability(capTokens, taskTokens, acceptance, spec) { |
| score | variable | 643 | no | let score = 0; |
| accTokens | const | 647 | no | const accTokens = tokenizeSet(acceptance); |
| specTokens | const | 651 | no | const specTokens = tokenizeSet(spec); |
| tokenizeSet | function | 658 | no | function tokenizeSet(text) { |
| sharesToken | function | 662 | no | function sharesToken(title, taskTokens) { |
| t | const | 663 | no | const t = tokenizeSet(title); |
| PRIORITY_ORDER | const | 668 | no | const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 }; |
| alignmentForTask | function | 670 | yes | export function alignmentForTask(db, task, { limit = 8 } = {}) { |
| phase | variable | 671 | no | let phase = null; |
| digest | const | 675 | no | const digest = getMeta(db, &#39;vivim_source_digest&#39;); |
| phaseRow | const | 677 | no | const phaseRow = db.prepare(&#39;SELECT id, status, payload FROM vivim_records WHERE kind = ? ORDER BY id LIMIT 1&#39;).get(&#39;phase&#39;); |
| payload | const | 679 | no | const payload = parsePayload({ payload: phaseRow.payload }) \|\| {}; |
| tokens | const | 684 | no | const tokens = tokenizeTask(task); |
| byKind | const | 685 | no | const byKind = readAllRows(db); |
| capabilityRows | const | 686 | no | const capabilityRows = byKind.capability \|\| []; |
| gapRows | const | 687 | no | const gapRows = byKind.gap \|\| []; |
| taskRows | const | 688 | no | const taskRows = byKind.task \|\| []; |
| scored | const | 691 | no | const scored = []; |
| payload | const | 693 | no | const payload = parsePayload(row) \|\| {}; |
| capTokens | const | 694 | no | const capTokens = tokenizeSet(payload.title \|\| row.title); |
| score | const | 695 | no | const score = scoreCapability(capTokens, tokens, payload.acceptance \|\| &#39;&#39;, payload.spec \|\| &#39;&#39;); |
| capabilities | const | 699 | no | const capabilities = scored.slice(0, Number(limit) \|\| 8).map((s) =&gt; s.id); |
| gapMatches | const | 702 | no | const gapMatches = []; |
| payload | const | 704 | no | const payload = parsePayload(row) \|\| {}; |
| pa | const | 708 | no | const pa = PRIORITY_ORDER[((parsePayload(byKind.gap.find((r) =&gt; r.id === a)) \|\| {}).priority)] ?? 99; |
| pb | const | 709 | no | const pb = PRIORITY_ORDER[((parsePayload(byKind.gap.find((r) =&gt; r.id === b)) \|\| {}).priority)] ?? 99; |
| gaps | const | 712 | no | const gaps = gapMatches.slice(0, 3); |
| taskMatches | const | 715 | no | const taskMatches = []; |
| payload | const | 717 | no | const payload = parsePayload(row) \|\| {}; |
| tasks | const | 721 | no | const tasks = taskMatches.slice(0, 5); |
| capById | const | 723 | no | const capById = new Map(capabilityRows.map((row) =&gt; [row.id, row])); |
| gapById | const | 724 | no | const gapById = new Map(gapRows.map((row) =&gt; [row.id, row])); |
| taskById | const | 725 | no | const taskById = new Map(taskRows.map((row) =&gt; [row.id, row])); |
| detailOf | function | 726 | no | const detailOf = (map, id) =&gt; { |
| row | const | 727 | no | const row = map.get(id); |
| payload | const | 728 | no | const payload = row ? (parsePayload(row) \|\| {}) : {}; |
| details | const | 736 | no | const details = { |
| parsePayloadOf | function | 753 | no | function parsePayloadOf(row) { |
| joinCapabilityCode | function | 760 | no | function joinCapabilityCode(db, payload) { |
| out | const | 761 | no | const out = { files: [], symbols: [], unresolved: [] }; |
| sourceFiles | const | 762 | no | const sourceFiles = payload &amp;&amp; Array.isArray(payload.sourceFiles) ? payload.sourceFiles : []; |
| names | const | 763 | no | const names = payload &amp;&amp; Array.isArray(payload.symbols) ? payload.symbols.map(String) : []; |
| fileStmt | const | 764 | no | const fileStmt = db.prepare( &#39;SELECT f.id AS fileId, f.path AS path, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE lower(f.path) = lower(?) ORDER BY p.name ASC&#39;, ); |
| symStmt | const | 767 | no | const symStmt = db.prepare( &#39;SELECT s.name AS name, s.kind AS kind, s.line AS line, f.path AS path, p.name AS project FROM symbols s JOIN files f ON f.id = s.file_id JOIN projects p ON p.id = f.proje… |
| ref | const | 771 | no | const ref = String(raw ?? &#39;&#39;).trim(); |
| matches | variable | 773 | no | let matches = []; |
| symbols | variable | 779 | no | let symbols = []; |
| allVivimRows | function | 792 | no | function allVivimRows(db, kind) { |
| explainVivimRecord | function | 802 | yes | export function explainVivimRecord(db, { id } = {}) { |
| target | const | 803 | no | const target = String(id ?? &#39;&#39;).trim(); |
| empty | const | 804 | no | const empty = { schema: &#39;hq.vivim-explain/2&#39;, id: target, records: [], relationships: null }; |
| rows | const | 807 | no | const rows = db.prepare(&#39;SELECT * FROM vivim_records WHERE id = ? ORDER BY kind ASC&#39;).all(target); |
| records | const | 809 | no | const records = rows.map((row) =&gt; ({ kind: row.kind, id: row.id, title: row.title ?? null, status: row.status ?? null, priority: row.priority ?? null, parent: row.parent ?? null, links: safeJsonList(… |
| kinds | const | 814 | no | const kinds = new Set(records.map((record) =&gt; record.kind)); |
| relationships | const | 815 | no | const relationships = { |
| parent | const | 821 | no | const parent = records.find((record) =&gt; record.kind === &#39;requirement&#39;)?.parent; |
| children | variable | 825 | no | let children = []; |
| payload | const | 830 | no | const payload = records.find((record) =&gt; record.kind === &#39;capability&#39;)?.record \|\| {}; |
| journeys | const | 835 | no | const journeys = allVivimRows(db, &#39;journey&#39;); |
| payload | const | 837 | no | const payload = records.find((record) =&gt; record.kind === &#39;journey&#39;)?.record \|\| {}; |
| payload | const | 849 | no | const payload = parsePayloadOf(row); |
| candidates | const | 850 | no | const candidates = new Set([ ...((Array.isArray(payload.capabilities) ? payload.capabilities : []).map(String)), ...((Array.isArray(payload.strongerCapabilities) ? payload.strongerCapabilities : []).… |
| taskIds | const | 854 | no | const taskIds = Array.isArray(payload.tasks) ? payload.tasks.map(String) : []; |
| stronger | const | 855 | no | const stronger = new Set((Array.isArray(payload.strongerCapabilities) ? payload.strongerCapabilities : []).map(String)); |
| payload | const | 867 | no | const payload = parsePayloadOf(row); |
| payload | const | 876 | no | const payload = records.find((record) =&gt; record.kind === &#39;capability&#39;)?.record \|\| {}; |
| safeJsonList | function | 889 | no | function safeJsonList(text) { |
| alignmentMarkdown | function | 894 | yes | export function alignmentMarkdown(alignment, { audience } = {}) { |
| owner | const | 895 | no | const owner = audience === &#39;owner&#39;; |
| lines | const | 896 | no | const lines = []; |
| phaseLabel | const | 905 | no | const phaseLabel = owner ? userTerm(&#39;sitrep&#39;) : &#39;Phase&#39;; |
| phaseLine | const | 906 | no | const phaseLine = alignment.phase |
| c | const | 912 | no | const c = alignment.counts; |
| drift | const | 922 | no | const drift = []; |
| driftLines | const | 938 | no | const driftLines = drift.slice(0, 5).map((d) =&gt; `- ${d}`); |
| clampBytes | function | 944 | no | function clampBytes(text, max) { |
| out | variable | 945 | no | let out = String(text); |
| enc | const | 946 | no | const enc = new TextEncoder(); |
| alignmentDrift | function | 952 | yes | export function alignmentDrift(db, { root = &#39;.&#39;, projects = [] } = {}) { |
| space | const | 953 | no | const space = findVivimSpace({ root, projects }); |
| abs | const | 958 | no | const abs = space.abs; |
| committed | const | 959 | no | const committed = getMeta(db, &#39;vivim_source_files&#39;); |
| committedFiles | variable | 960 | no | let committedFiles = []; |
| committedByRole | const | 962 | no | const committedByRole = new Map(); |
| reasons | const | 967 | no | const reasons = []; |
| stale | variable | 968 | no | let stale = false; |
| checked | variable | 969 | no | let checked = 0; |
| currentByRole | const | 972 | no | const currentByRole = new Map(); |
| currentSources | const | 973 | no | const currentSources = []; |
| absPath | const | 975 | no | const absPath = join(abs, rel); |
| text | variable | 976 | no | let text; |
| sha | const | 982 | no | const sha = sha256(text); |
| entry | const | 983 | no | const entry = { role, path: rel, sha256: sha, bytes: Buffer.byteLength(text, &#39;utf8&#39;) }; |
| committedEntry | const | 986 | no | const committedEntry = committedByRole.get(role); |
| alignment | variable | 1005 | no | let alignment = null; |
| seen | const | 1018 | no | const seen = new Set(); |
| unique | const | 1019 | no | const unique = []; |
| extra | variable | 1026 | no | let extra = 0; |
| ok | const | 1033 | no | const ok = !stale; |
| alignmentSummary | function | 1039 | yes | export function alignmentSummary(db) { |
| al | const | 1040 | no | const al = readAlignment(db, { detail: &#39;summary&#39; }); |
| findings | const | 1042 | no | const findings = { |
| alignmentMeta | function | 1061 | yes | export function alignmentMeta(db) { if (!vivimTablesPresent(db)) return null; |
| syncedAt | const | 1062 | no | const syncedAt = getMeta(db, &#39;vivim_synced_at&#39;); |
| digest | const | 1063 | no | const digest = getMeta(db, &#39;vivim_source_digest&#39;); |
| space | const | 1064 | no | const space = getMeta(db, &#39;vivim_space&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| ./util.mjs | import | 7 | [hq/lib/util.mjs](./util.mjs.md) |
| ./nomenclature.mjs | import | 8 | [hq/lib/nomenclature.mjs](./nomenclature.mjs.md) |
| ./schema.mjs | import | 9 | [hq/lib/schema.mjs](./schema.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/vivim.mjs |
| [hq/lib/context.mjs](./context.mjs.md) | ./vivim.mjs |
| [hq/lib/lake.mjs](./lake.mjs.md) | ./vivim.mjs |
| [hq/lib/skills.mjs](./skills.mjs.md) | ./vivim.mjs |
| [hq/test/semantic-convergence.test.mjs](../test/semantic-convergence.test.mjs.md) | ../lib/vivim.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/vivim.mjs — VIVIM feed alignment (hq.vivim-alignment/1).
// Read-only projection of a registered VIVIM space into HQ. Never writes to the
// space, never touches the network, never performs provider actions.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { sha256 } from './util.mjs';
import { userTerm } from './nomenclature.mjs';
import { transaction, getMeta, setMeta } from './schema.mjs';

const SCHEMA = 'hq.vivim-alignment/1';
const MAX_STRING = 2000;
// Only real credential shapes are redacted. Plain words such as "cookie" or
// "token" in policy prose must survive: over-redaction destroys the feed.
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{16,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\b(?:api[_-]?key|password|passwd|secret|token|cookie|authorization)\s*[:=]\s*\S{8,}/i,
  /\bBearer\s+[A-Za-z0-9._-]{20,}/,
];
const GOALS_CAP = 12;
const DRIFT_MAX_REASONS = 40;
const MARKDOWN_MAX_BYTES = 4000;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'for',
  'from', 'had', 'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'i', 'if',
  'in', 'into', 'is', 'it', 'its', 'may', 'might', 'must', 'my', 'no', 'not',
  'of', 'on', 'or', 'our', 'ours', 'over', 'she', 'should', 'the', 'their',
  'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to',
  'under', 'until', 'up', 'us', 'was', 'we', 'were', 'will', 'with', 'would',
  'you', 'your', 'yours',
]);

const JSON_ROLES = [
  { role: 'roadmap', rel: 'docs/roadmap.json', required: true },
  { role: 'capabilities', rel: 'docs/capabilities/atomic-registry.json', required: true },
  { role: 'crosswalk', rel: 'docs/capabilities/journey-capability-crosswalk.v1.json', required: false },
  { role: 'criticality', rel: 'docs/capabilities/criticality.json', required: false },
  { role: 'routes', rel: 'docs/capabilities/context-routes.json', required: false },
  { role: 'journey', rel: 'docs/ux/USER-JOURNEY-ACTIVATION-GRAPH.v1.json', required: false },
  { role: 'gaps', rel: 'docs/ux/ACTIVATION-GAPS.v1.json', required: false },
  { role: 'catalog', rel: 'docs/capabilities/source-file-catalog.json', required: false },
];

function cleanString(value) {
  let s = String(value ?? '');
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(s)) { s = '[redacted]'; break; }
  }
  if (s.length > MAX_STRING) s = s.slice(0, MAX_STRING);
  return s;
}

function projectAbsPath(root, project) {
  if (project && project.abs) return resolve(String(project.abs));
  const path = project && project.path ? String(project.path) : '';
  if (!path) return resolve(root || '.', String(project && project.name));
  return isAbsolute(path) ? resolve(path) : resolve(root || '.', path);
}

function readJsonFile(abs) {
  const text = readFileSync(abs, 'utf8');
  return JSON.parse(text);
}export function findVivimSpace({ root = '.', projects = [] } = {}) {
  const qualifiers = [];
  for (const project of projects) {
    if (!project || !project.name) continue;
    const abs = projectAbsPath(root, project);
    const roadmap = existsSync(join(abs, 'docs', 'roadmap.json'));
    const capabilities = existsSync(join(abs, 'docs', 'capabilities', 'atomic-registry.json'));
    if (roadmap && capabilities) qualifiers.push({ name: String(project.name), abs });
  }
  if (!qualifiers.length) return null;
  qualifiers.sort((a, b) => a.name.localeCompare(b.name));
  return qualifiers[0];
}

function boundPayload(obj) {
```

_First 80 of 1068 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
