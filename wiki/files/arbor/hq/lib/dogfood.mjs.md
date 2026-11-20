# File: hq/lib/dogfood.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/dogfood.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 57969 B |
| Lines | 1233 |
| Hash | f1385e75d9c0 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DOGFOOD_SCHEMA | const | 35 | yes | export const DOGFOOD_SCHEMA = &#39;hq.dogfood/1&#39;; |
| LEARNINGS_SCHEMA | const | 36 | yes | export const LEARNINGS_SCHEMA = &#39;hq.dogfood-learnings/1&#39;; |
| RECON_SCHEMA | const | 37 | yes | export const RECON_SCHEMA = &#39;hq.dogfood-recon/1&#39;; |
| TASK_ID_PREFIX | const | 38 | yes | export const TASK_ID_PREFIX = &#39;dt_&#39;; |
| LEARNING_ID_PREFIX | const | 39 | yes | export const LEARNING_ID_PREFIX = &#39;lrn_&#39;; |
| QEUE_LANES | const | 42 | yes | export const QEUE_LANES = /** @type {const} */ ([&#39;DATA&#39;, &#39;INTELLIGENCE&#39;, &#39;AGENTS&#39;, &#39;BUILDER&#39;, &#39;MACHINE&#39;, &#39;EXPERIENCE&#39;]); |
| RECON_STATES | const | 45 | yes | export const RECON_STATES = /** @type {const} */ ([&#39;proven&#39;, &#39;partial&#39;, &#39;blocked&#39;, &#39;absent&#39;]); |
| GAP_WEIGHT | const | 48 | no | const GAP_WEIGHT = { |
| RELEASE_WEIGHT | const | 58 | no | const RELEASE_WEIGHT = { V1: 1, V2: 0.95, V3: 0.9, V4: 0.85, V5: 0.8, V6: 0.75 }; |
| HIT_STOPWORDS | const | 61 | no | const HIT_STOPWORDS = new Set([ &#39;define&#39;, &#39;create&#39;, &#39;store&#39;, &#39;capture&#39;, &#39;verify&#39;, &#39;support&#39;, &#39;implement&#39;, &#39;build&#39;, &#39;add&#39;, &#39;user&#39;, &#39;users&#39;, &#39;from&#39;, &#39;with&#39;, &#39;into&#39;, &#39;that&#39;, &#39;this&#39;, &#39;each&#39;, &#39;every&#39;, &#39;ac… |
| SECRET_PATTERNS | const | 71 | no | const SECRET_PATTERNS = [ |
| redactSecrets | function | 84 | yes | export function redactSecrets(text) { |
| out | variable | 85 | no | let out = String(text ?? &#39;&#39;); |
| clip | function | 91 | yes | export function clip(text, max) { |
| s | const | 92 | no | const s = String(text ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| cell | function | 98 | yes | export function cell(text) { |
| hash12 | function | 103 | no | function hash12(text, size = 12) { |
| taskId | function | 109 | yes | export function taskId(source, key, quote) { |
| learningId | function | 115 | yes | export function learningId(rule) { |
| isOwnedLearning | function | 125 | yes | export function isOwnedLearning(row) { |
| loadQeue | function | 151 | yes | export function loadQeue(qeueDir) { |
| records | const | 153 | no | const records = []; |
| defects | const | 155 | no | const defects = []; |
| loaded | const | 156 | no | const loaded = []; |
| file | const | 158 | no | const file = join(qeueDir, `${lane}.json`); |
| parsed | const | 164 | no | const parsed = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| rows | const | 165 | no | const rows = Array.isArray(parsed?.records) ? parsed.records : []; |
| gapWeight | function | 183 | yes | export function gapWeight(status) { |
| validateRecon | function | 197 | yes | export function validateRecon(row) { |
| loadRecon | function | 213 | yes | export function loadRecon(reconDir) { |
| byId | const | 215 | no | const byId = new Map(); |
| defects | const | 217 | no | const defects = []; |
| files | const | 218 | no | const files = []; |
| file | const | 222 | no | const file = join(reconDir, name); |
| verdict | const | 224 | no | const verdict = validateRecon(JSON.parse(readFileSync(file, &#39;utf8&#39;))); |
| leapfrogScore | function | 247 | yes | export function leapfrogScore(record, ctx = {}) { |
| recon | const | 248 | no | const recon = ctx.recon; |
| status | const | 249 | no | const status = recon?.status ?? record.status ?? &#39;not_verified&#39;; |
| gap | const | 250 | no | const gap = gapWeight(status); |
| release | const | 251 | no | const release = RELEASE_WEIGHT[/** @type {keyof typeof RELEASE_WEIGHT} */ (record.primary_release)] ?? 0.7; |
| hits | const | 252 | no | const hits = Math.max(0, Number(ctx.hits) \|\| 0); |
| lift | const | 253 | no | const lift = Math.min(1.25, 1 + 0.2 * Math.log2(1 + hits)); |
| rankLeapfrog | function | 264 | yes | export function rankLeapfrog(records, reconById = new Map()) { |
| recon | const | 267 | no | const recon = reconById.get(record.id); |
| status | const | 268 | no | const status = recon?.status ?? null; |
| CORRECTION | const | 286 | no | const CORRECTION = /\\b(stop\|never\|don&#39;?t\|do not\|instead\|wrong\|incorrect\|revert\|undo\|omit\|not what i\|i said\|that&#39;?s not)\\b/i; |
| PREFERENCE | const | 287 | no | const PREFERENCE = /\\b(always\|must\|only\|prefer\|from now on\|every time\|make sure)\\b/i; |
| BLOCKED | const | 289 | no | const BLOCKED = /\\b(blocked on\|waiting (?:for\|on)\|need (?:the )?lease\|lease (?:is\|held)\|not running\|unreadable\|unavailable\|no such (?:file\|command)\|ENOENT\|wedged\|dead pid)\\b/i; |
| DEPENDENCY | const | 290 | no | const DEPENDENCY = /\\b(lease\|browser\|studio\|provider\|session\|file\|command\|service\|server\|agent\|tool\|db\|database\|host\|chrome\|tab\|credential\|network\|port)\\b/i; |
| FAILURE | const | 291 | no | const FAILURE = /\\b(fail(?:ed\|ing\|s)?\|broken\|crash(?:ed)?\|red build\|error:\|ENOENT\|exception)\\b/i; |
| ZERO_FAILURE | const | 293 | no | const ZERO_FAILURE = /\\b0\\s+fail(?:s\|ed\|ure\|ing)?\\b\|\\bfail(?:s)?\\s*[:=]?\\s*0\\b(?!\\d)/i; |
| INTENT | const | 294 | no | const INTENT = /\\b(build\|add\|write\|fix\|implement\|create\|land\|update\|test\|verify\|patch\|wire\|migrate\|refactor)\\b/i; |
| PATHISH | const | 295 | no | const PATHISH = /(?:[A-Za-z]:)?[\\w@./-]+\\.(?:mjs\|cjs\|js\|ts\|tsx\|jsx\|json\|jsonl\|md\|toml\|ya?ml\|rs\|py\|css\|html)\\b/g; |
| isNoiseTurn | function | 299 | yes | export function isNoiseTurn(turn) { |
| t | const | 300 | no | const t = String(turn?.text ?? &#39;&#39;); |
| isInjectedContext | function | 313 | yes | export function isInjectedContext(text) { |
| t | const | 314 | no | const t = String(text ?? &#39;&#39;); |
| isOwnerTurn | function | 334 | yes | export function isOwnerTurn(turn) { |
| t | const | 335 | no | const t = String(turn?.text ?? &#39;&#39;); |
| lastQuestion | function | 346 | no | function lastQuestion(text) { |
| lines | const | 347 | no | const lines = String(text).split(&#39;\\n&#39;).map((l) =&gt; l.trim()).filter(Boolean); |
| firstPath | function | 355 | no | function firstPath(text) { |
| m | const | 356 | no | const m = String(text).match(PATHISH); |
| COMMAND_INPUT_FIELDS | const | 368 | yes | export const COMMAND_INPUT_FIELDS = Object.freeze([&#39;command&#39;, &#39;cmd&#39;]); |
| MUTATING_TOOLS | const | 371 | no | const MUTATING_TOOLS = new Set([&#39;write&#39;, &#39;edit&#39;, &#39;multiedit&#39;, &#39;notebookedit&#39;, &#39;apply_patch&#39;, &#39;str_replace_editor&#39;]); |
| PROOF_COMMAND_RE | const | 379 | no | const PROOF_COMMAND_RE = /^(?:bun\|bunx\|node\|npm\|npx\|pnpm\|yarn\|deno\|python[0-9.]*\|py\|cargo\|rustc\|go\|dotnet\|tsc\|git\|gh\|curl\|wget\|pwsh\|powershell\|cmd\|sh\|bash\|hq\|zcode\|es\|du\|handle\|fclones\|sqlite3)(?:\\.(… |
| MAX_PROOF_COMMAND | const | 382 | yes | export const MAX_PROOF_COMMAND = 300; |
| isProofCommand | function | 389 | yes | export function isProofCommand(text) { |
| candidate | const | 390 | no | const candidate = String(text ?? &#39;&#39;).trim(); |
| VERIFY_COMMAND | const | 399 | no | const VERIFY_COMMAND = /\\b(test\|check\|typecheck\|verify\|prove\|build\|lint)\\b/i; |
| turnEvidence | function | 408 | yes | export function turnEvidence(turn) { |
| commands | const | 410 | no | const commands = []; |
| mutated | const | 412 | no | const mutated = []; |
| named | const | 414 | no | const named = []; |
| tool | const | 416 | no | const tool = String(call.tool ?? &#39;&#39;).toLowerCase(); |
| value | const | 418 | no | const value = call.input?.[field]; |
| command | const | 420 | no | const command = value.trim(); |
| value | const | 424 | no | const value = call.input?.[field]; |
| file | const | 426 | no | const file = value.trim(); |
| pathFromCommand | function | 440 | no | function pathFromCommand(command) { |
| tokens | const | 441 | no | const tokens = String(command ?? &#39;&#39;).match(PATHISH) ?? []; |
| token | const | 443 | no | const token = tokens[i].replace(/[),.;:]+$/, &#39;&#39;); |
| chooseProofCommand | function | 457 | no | function chooseProofCommand(commands, files) { |
| usable | const | 458 | no | const usable = commands.map((c) =&gt; redactSecrets(c).trim()).filter(isProofCommand); |
| verifying | const | 460 | no | const verifying = usable.filter((c) =&gt; VERIFY_COMMAND.test(c)); |
| pool | const | 461 | no | const pool = verifying.length ? verifying : usable; |
| bases | const | 462 | no | const bases = files.map((f) =&gt; f.split(/[\\\\/]/).pop() ?? &#39;&#39;).filter(Boolean); |
| naming | const | 463 | no | const naming = bases.length ? pool.filter((c) =&gt; bases.some((b) =&gt; c.includes(b))) : []; |
| chosen | const | 464 | no | const chosen = naming.length ? naming : pool; |
| attribute | function | 475 | no | function attribute(turn, text) { |
| evidence | const | 476 | no | const evidence = turnEvidence(turn); |
| command | const | 477 | no | const command = chooseProofCommand(evidence.commands, evidence.files); |
| extractSignals | function | 489 | yes | export function extractSignals(turns) { |
| out | const | 491 | no | const out = []; |
| text | const | 494 | no | const text = redactSecrets(String(turn.text ?? &#39;&#39;)); |
| role | const | 495 | no | const role = String(turn.role ?? &#39;&#39;); |
| evidence | const | 496 | no | const evidence = attribute(turn, text); |
| sentence | const | 499 | no | const sentence = firstSentenceWith(text, CORRECTION) \|\| text; |
| blocked | const | 503 | no | const blocked = text.match(BLOCKED); |
| path | const | 508 | no | const path = firstPath(text); |
| prose | const | 510 | no | const prose = path ? text.split(path).join(&#39; &#39;) : text; |
| q | const | 515 | no | const q = role === &#39;assistant&#39; ? lastQuestion(text) : &#39;&#39;; |
| failure | const | 521 | no | const failure = firstRealFailure(text); |
| firstRealFailure | function | 536 | no | function firstRealFailure(text) { |
| index | const | 538 | no | const index = m.index ?? 0; |
| sentence | const | 539 | no | const sentence = sentenceAround(text, index); |
| firstSentenceWith | function | 547 | no | function firstSentenceWith(text, re) { |
| parts | const | 548 | no | const parts = String(text).split(/(?&lt;=[.!?])\\s+/); |
| sentenceAround | function | 553 | no | function sentenceAround(text, index) { |
| before | const | 555 | no | const before = text.slice(0, index); |
| start | const | 556 | no | const start = Math.max(before.lastIndexOf(&#39;. &#39;), before.lastIndexOf(&#39;\\n&#39;), before.lastIndexOf(&#39;! &#39;), before.lastIndexOf(&#39;? &#39;)); |
| afterIdx | const | 557 | no | const afterIdx = text.slice(index).search(/[.!?](\\s\|$)/); |
| normalizeRule | function | 567 | no | function normalizeRule(text) { |
| dedupeEvidence | function | 577 | no | function dedupeEvidence(evidence) { |
| seen | const | 579 | no | const seen = new Set(); |
| out | const | 581 | no | const out = []; |
| key | const | 584 | no | const key = `${e.session}\\u0000${e.quote}`; |
| extractLearnings | function | 599 | yes | export function extractLearnings(sessions, prior = [], opts = {}) { |
| byId | const | 601 | no | const byId = new Map(); |
| injected | const | 602 | no | const injected = opts.injected ? normalizeRule(opts.injected) : &#39;&#39;; |
| evidence | const | 615 | no | const evidence = dedupeEvidence(Array.isArray(row.evidence) ? row.evidence : []); |
| text | const | 621 | no | const text = redactSecrets(String(turn.text ?? &#39;&#39;)); |
| kind | const | 623 | no | const kind = CORRECTION.test(text) ? &#39;correction&#39; : PREFERENCE.test(text) ? &#39;preference&#39; : &#39;&#39;; |
| sentence | const | 625 | no | const sentence = clip(firstSentenceWith(text, kind === &#39;correction&#39; ? CORRECTION : PREFERENCE) \|\| text, 240); |
| id | const | 631 | no | const id = learningId(sentence); |
| existing | const | 632 | no | const existing = byId.get(id); |
| now | const | 643 | no | const now = new Date().toISOString(); |
| KIND_ORDER | const | 663 | no | const KIND_ORDER = { correction: 0, blocked: 1, mismatch: 2, intent: 3, question: 4, failure: 5 }; |
| looksLikeSpokenRule | function | 671 | yes | export function looksLikeSpokenRule(text) { |
| t | const | 672 | no | const t = String(text ?? &#39;&#39;); |
| EVIDENCE_TURN_LIMIT | const | 681 | yes | export const EVIDENCE_TURN_LIMIT = 60; |
| turnKey | function | 684 | no | function turnKey(turn) { |
| MIN_EVIDENCE_KEY | const | 689 | no | const MIN_EVIDENCE_KEY = 24; |
| withToolEvidence | function | 700 | no | function withToolEvidence(given, read) { |
| index | const | 701 | no | const index = read |
| key | const | 706 | no | const key = turnKey(turn); |
| turnsForSession | function | 729 | no | function turnsForSession(session, readTurns, cache) { |
| given | const | 730 | no | const given = Array.isArray(session?.turns) ? session.turns : []; |
| id | const | 733 | no | const id = String(session?.id ?? &#39;&#39;); |
| cached | const | 735 | no | const cached = cache.get(id); |
| read | variable | 738 | no | let read = []; |
| turns | const | 744 | no | const turns = Array.isArray(read) ? read.filter((t) =&gt; t &amp;&amp; typeof t === &#39;object&#39;) : []; |
| evidenceReader | function | 756 | no | function evidenceReader(opts = {}) { |
| extractTasks | function | 768 | yes | export function extractTasks({ sessions, seats = {}, maxPerSession = 10, evidence, dbPath } = /** @type {any} */ ({})) { |
| tasks | const | 770 | no | const tasks = []; |
| clear | const | 772 | no | const clear = []; |
| readTurns | const | 773 | no | const readTurns = evidenceReader({ evidence, dbPath }); |
| evidenceCache | const | 775 | no | const evidenceCache = new Map(); |
| turns | const | 777 | no | const turns = turnsForSession(s, readTurns, evidenceCache); |
| signals | const | 778 | no | const signals = extractSignals(turns) |
| seat | const | 785 | no | const seat = seatForSession(s.id, seats) ?? seatFromTitle(s.title, seats) ?? &#39;unbound&#39;; |
| taskTitle | function | 808 | no | function taskTitle(sig) { |
| seatForSession | function | 825 | yes | export function seatForSession(sessionId, seats) { |
| target | const | 826 | no | const target = String(sessionId ?? &#39;&#39;).trim(); |
| register | const | 828 | no | const register = seats &amp;&amp; typeof seats === &#39;object&#39; ? seats : {}; |
| owner | const | 829 | no | const owner = Object.keys(register) |
| seatFromTitle | function | 841 | no | function seatFromTitle(title, seats) { |
| t | const | 842 | no | const t = String(title ?? &#39;&#39;).toLowerCase(); |
| evidenceTasks | function | 857 | yes | export function evidenceTasks(receipts, outcomes) { |
| byRequest | const | 858 | no | const byRequest = new Map(); |
| tasks | const | 863 | no | const tasks = []; |
| defects | const | 865 | no | const defects = []; |
| requestId | const | 868 | no | const requestId = String(r.requestId); |
| o | const | 869 | no | const o = byRequest.get(requestId); |
| effect | const | 870 | no | const effect = String(r.effect ?? &#39;&#39;); |
| outcomeEffect | const | 871 | no | const outcomeEffect = o ? String(o.effect ?? &#39;&#39;) : null; |
| why | variable | 872 | no | let why = &#39;&#39;; |
| thread | const | 876 | no | const thread = r.thread?.after ?? r.thread?.before ?? &#39;&#39;; |
| busTasks | function | 906 | yes | export function busTasks(bus) { |
| buildScan | function | 938 | yes | export function buildScan(input) { |
| qeue | const | 939 | no | const qeue = input.qeue ?? { records: [], byId: new Map(), defects: [], loaded: [] }; |
| recon | const | 940 | no | const recon = input.recon ?? { byId: new Map(), defects: [], files: [] }; |
| prior | const | 941 | no | const prior = Array.isArray(input.priorLearnings) ? input.priorLearnings : []; |
| sessionPart | const | 945 | no | const sessionPart = extractTasks({ sessions: input.sessions ?? [], seats: input.seats ?? {}, evidence: input.evidence, dbPath: input.dbPath, |
| injectedNorm | const | 952 | no | const injectedNorm = input.injected ? String(input.injected).toLowerCase().replace(/[^a-z0-9 ]+/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;) : &#39;&#39;; |
| isEcho | function | 953 | no | const isEcho = (t) =&gt; t.kind === &#39;correction&#39; &amp;&amp; injectedNorm &amp;&amp; injectedNorm.includes( String(t.quote ?? &#39;&#39;).toLowerCase().replace(/[^a-z0-9 ]+/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;).trim(), ); |
| evidencePart | const | 957 | no | const evidencePart = evidenceTasks(input.receipts ?? [], input.outcomes ?? []); |
| busPart | const | 958 | no | const busPart = busTasks(input.bus ?? []); |
| seen | const | 961 | no | const seen = new Set(); |
| open | const | 962 | no | const open = [...sessionPart.tasks, ...busPart, ...evidencePart.tasks] |
| blocked | const | 966 | no | const blocked = open.filter((t) =&gt; t.kind === &#39;blocked&#39; \|\| t.kind === &#39;mismatch&#39;); |
| active | const | 967 | no | const active = open.filter((t) =&gt; t.kind !== &#39;blocked&#39; &amp;&amp; t.kind !== &#39;mismatch&#39;); |
| corpus | const | 970 | no | const corpus = open.map((t) =&gt; `${t.task} ${t.quote}`).join(&#39; &#39;).toLowerCase(); |
| ranked | const | 971 | no | const ranked = rankLeapfrog(qeue.records, recon.byId).map((r) =&gt; { const words = String(r.task).toLowerCase().split(/[^a-z0-9]+/).filter((w) =&gt; w.length &gt;= 5 &amp;&amp; !HIT_STOPWORDS.has(w)); const hits = w… |
| words | const | 972 | no | const words = String(r.task).toLowerCase().split(/[^a-z0-9]+/).filter((w) =&gt; w.length &gt;= 5 &amp;&amp; !HIT_STOPWORDS.has(w)); |
| hits | const | 973 | no | const hits = words.length ? words.filter((w) =&gt; corpus.includes(w)).length : 0; |
| learnings | const | 977 | no | const learnings = extractLearnings(input.sessions ?? [], prior, { injected: input.injected ?? &#39;&#39; }); |
| defects | const | 979 | no | const defects = [ |
| renderActiveTasks | function | 1017 | yes | export function renderActiveTasks(scan, opts = {}) { |
| topQueue | const | 1018 | no | const topQueue = opts.topQueue ?? 25; |
| maxTasks | const | 1019 | no | const maxTasks = opts.maxTasks ?? 60; |
| L | const | 1020 | no | const L = []; |
| rows | const | 1033 | no | const rows = scan.active.slice(0, maxTasks); |
| ev | const | 1063 | no | const ev = l.evidence.slice(0, 3).map((e) =&gt; `\\`${e.session}\\``).join(&#39;, &#39;); |
| atomicWrite | function | 1099 | yes | export function atomicWrite(file, text) { |
| tmp | const | 1101 | no | const tmp = `${file}.tmp-${process.pid}-${Date.now()}`; |
| readLearnings | function | 1112 | yes | export function readLearnings(file) { |
| text | const | 1115 | no | const text = readFileSync(file, &#39;utf8&#39;); |
| rows | const | 1117 | no | const rows = []; |
| lines | const | 1119 | no | const lines = []; |
| defects | const | 1121 | no | const defects = []; |
| row | variable | 1124 | no | let row = null; |
| parsed | variable | 1125 | no | let parsed = false; |
| writeLearnings | function | 1149 | yes | export function writeLearnings(file, rows) { |
| existing | const | 1150 | no | const existing = readLearnings(file); |
| mine | const | 1152 | no | const mine = new Map(); |
| id | const | 1154 | no | const id = String(row?.id ?? &#39;&#39;); |
| foreign | const | 1158 | no | const foreign = new Map(); |
| broken | const | 1160 | no | const broken = []; |
| id | const | 1167 | no | const id = String(line.row?.id ?? &#39;&#39;); |
| key | const | 1168 | no | const key = id \|\| `raw:${line.text}`; |
| out | const | 1172 | no | const out = [...mine.entries()].map(([id, row]) =&gt; ({ id, text: JSON.stringify(row) })) |
| featureTestEvidence | function | 1193 | yes | export function featureTestEvidence(featureId, { reconDir = &#39;dogfood/recon&#39;, receipts = [] } = {}) { |
| recon | const | 1195 | no | const recon = byId.get(String(featureId)) ?? null; |
| proven | const | 1196 | no | const proven = recon != null &amp;&amp; recon.status === &#39;proven&#39;; |
| named | const | 1197 | no | const named = Array.isArray(receipts) ? receipts.filter((r) =&gt; { const text = JSON.stringify(r); return text.includes(String(featureId)); }) : []; |
| text | const | 1198 | no | const text = JSON.stringify(r); |
| sources | const | 1201 | no | const sources = [...new Set([ ...(recon?.evidence ?? []), ...named.map((r) =&gt; String(r.receiptId ?? r.id ?? &#39;&#39;)).filter(Boolean), ])]; |
| reproductionOutcomes | function | 1217 | yes | export function reproductionOutcomes(receipts = []) { |
| byTest | const | 1219 | no | const byTest = new Map(); |
| id | const | 1222 | no | const id = String(r.testId); |
| cur | const | 1223 | no | const cur = byTest.get(id) ?? { original: null, rerun: null }; |
| out | const | 1228 | no | const out = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 30 | external |
| node:fs | import | 31 | external |
| node:path | import | 32 | external |
| ./session-parts.mjs | import | 33 | [hq/lib/session-parts.mjs](./session-parts.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-046-prove-feature.mjs](../aii/fixtures/HQ-046-prove-feature.mjs.md) | ../../lib/dogfood.mjs |
| [hq/aii/fixtures/HQ-049-not-reproducible.mjs](../aii/fixtures/HQ-049-not-reproducible.mjs.md) | ../../lib/dogfood.mjs |
| [hq/aii/fixtures/HQ-052-never-independently-verified.mjs](../aii/fixtures/HQ-052-never-independently-verified.mjs.md) | ../../lib/dogfood.mjs |
| [hq/aii/fixtures/HQ-054-uninspectable-environments.mjs](../aii/fixtures/HQ-054-uninspectable-environments.mjs.md) | ../../lib/dogfood.mjs |
| [hq/aii/fixtures/HQ-056-disagreeing-completion-reports.mjs](../aii/fixtures/HQ-056-disagreeing-completion-reports.mjs.md) | ../../lib/dogfood.mjs |
| [hq/bin/dogfood-execution.mjs](../bin/dogfood-execution.mjs.md) | ../lib/dogfood.mjs |
| [hq/bin/dogfood.mjs](../bin/dogfood.mjs.md) | ../lib/dogfood.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The dogfood engine: it turns our own live conversations, channel evidence and the |
| 6 | owner | dogfood-lead | — | dogfood-lead |
| 7 | task | — | — | dogfood-loop |
| 8 | task | — | — | WO-004 |
| 9 | task | — | — | WO-035 |
| 10 | invariant | — | — | a task without a quote or an id is not a task: every row names the conversation |
| 12 | invariant | — | — | one writer: the rendered document is the supply signal, rewritten atomically, |
| 14 | invariant | — | — | learning is evidence, not inference: a learning row exists only when an owner |
| 16 | invariant | — | — | the learnings ledger is merged, never clobbered: a row this loop did not write |
| 18 | invariant | — | — | the qeue is a hypothesis register: a status of not_verified means &quot;unproven&quot;, |
| 20 | invariant | — | — | nothing here sends, approves or wakes: read-only probes, pure transforms, one |
| 22 | invariant | — | — | a proof command and a file are tool evidence or nothing: they come from a |
| 25 | invariant | — | — | no secrets: every persisted quote passes redactSecrets. |
| 26 | see | — | docs/ACTIVE-TASK-SCANNER.md | docs/ACTIVE-TASK-SCANNER.md |
| 27 | see | — | hq/lib/session-parts.mjs | hq/lib/session-parts.mjs |
| 28 | see | — | qeue/README.md | qeue/README.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context The dogfood engine: it turns our own live conversations, channel evidence and the
 *   six-lane qeue register into one ranked work queue, and turns the owner's corrections into
 *   persisted, evidence-counted learnings. A row's proof is the command that actually ran.
 * @hq:owner dogfood-lead
 * @hq:task dogfood-loop
 * @hq:task WO-004
 * @hq:task WO-035
 * @hq:invariant a task without a quote or an id is not a task: every row names the conversation
 *   and the exact words that produced it.
 * @hq:invariant one writer: the rendered document is the supply signal, rewritten atomically,
 *   never appended; the machine form is written beside it.
 * @hq:invariant learning is evidence, not inference: a learning row exists only when an owner
 *   turn contains a correction marker, and it carries every turn that repeated it.
 * @hq:invariant the learnings ledger is merged, never clobbered: a row this loop did not write
 *   (the execution runner's `dfe_*` rows) survives every write of this file.
 * @hq:invariant the qeue is a hypothesis register: a status of not_verified means "unproven",
 *   never "missing"; only a recon row can lower the gap weight.
 * @hq:invariant nothing here sends, approves or wakes: read-only probes, pure transforms, one
 *   file writer.
 * @hq:invariant a proof command and a file are tool evidence or nothing: they come from a
 *   tool_use a turn actually carried (hq/lib/session-parts.mjs), never mined out of prose, and
 *   never written as a command the dispatcher would refuse.
 * @hq:invariant no secrets: every persisted quote passes redactSecrets.
 * @hq:see docs/ACTIVE-TASK-SCANNER.md
 * @hq:see hq/lib/session-parts.mjs
 * @hq:see qeue/README.md
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FILE_INPUT_FIELDS, readSessionParts, toolCalls } from './session-parts.mjs';

export const DOGFOOD_SCHEMA = 'hq.dogfood/1';
export const LEARNINGS_SCHEMA = 'hq.dogfood-learnings/1';
export const RECON_SCHEMA = 'hq.dogfood-recon/1';
export const TASK_ID_PREFIX = 'dt_';
export const LEARNING_ID_PREFIX = 'lrn_';

/** The six lanes of the qeue register, in release order. */
export const QEUE_LANES = /** @type {const} */ (['DATA', 'INTELLIGENCE', 'AGENTS', 'BUILDER', 'MACHINE', 'EXPERIENCE']);

/** A recon row may only claim one of these states. Anything else is invalid, never guessed. */
export const RECON_STATES = /** @type {const} */ (['proven', 'partial', 'blocked', 'absent']);

/** How much of the qeue gap each recon/qeue status leaves open. */
const GAP_WEIGHT = {
  not_verified: 1,
  absent: 1,
  partial: 0.6,
  blocked: 0.85,
  documented_baseline: 0.5,
  proven: 0.05,
  verified: 0.05,
};

const RELEASE_WEIGHT = { V1: 1, V2: 0.95, V3: 0.9, V4: 0.85, V5: 0.8, V6: 0.75 };

/** Words that appear in nearly every qeue title; matching them proves nothing about relevance. */
const HIT_STOPWORDS = new Set([
  'define', 'create', 'store', 'capture', 'verify', 'support', 'implement', 'build', 'add',
  'user', 'users', 'from', 'with', 'into', 'that', 'this', 'each', 'every', 'across',
  'rules', 'scopes', 'criteria', 'schema', 'identity', 'state', 'data', 'task', 'tasks',
]);

/* ------------------------------------------------------------------ */
/* text hygiene                                                        */
/* ------------------------------------------------------------------ */

const SECRET_PATTERNS = [
  /\b(sk|pk|rk|ghp|gho|ghs|xox[baprs]|AKIA)[-_A-Za-z0-9]{12,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/gi,
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\b(api[_-]?key|token|secret|password|passwd)\s*[:=]\s*['"]?[^\s'"]{8,}/gi,
];

/**
 * Strip anything that looks like a credential before a quote is persisted. A quote is evidence,
 * and evidence never needs a secret.
```

_First 80 of 1234 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
