# File: hq/lib/sessions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/sessions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 67898 B |
| Lines | 1711 |
| Hash | 55ff071280e0 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SESSION_SCHEMA | const | 12 | yes | export const SESSION_SCHEMA = &#39;hq.sessions/1&#39;; |
| MAX_PART_BYTES | const | 15 | no | const MAX_PART_BYTES = 100 * 1024; |
| FTS_TEXT_CAP | const | 16 | no | const FTS_TEXT_CAP = 20_000; |
| WORKSPACE_SESSION | const | 17 | no | const WORKSPACE_SESSION = &#39;workspace&#39;; |
| SESSION_EVENT_TYPES | const | 19 | yes | export const SESSION_EVENT_TYPES = Object.freeze([ &#39;session.created&#39;, &#39;session.text.started&#39;, &#39;session.text.delta&#39;, &#39;session.text.ended&#39;, |
| SESSION_COLUMNS | const | 56 | no | const SESSION_COLUMNS = Object.freeze([ &#39;id&#39;, &#39;project_id&#39;, &#39;parent_id&#39;, &#39;title&#39;, &#39;directory&#39;, &#39;agent&#39;, &#39;model&#39;, &#39;status&#39;, &#39;outcome&#39;, &#39;cost&#39;, &#39;tokens_input&#39;, &#39;tokens_output&#39;, &#39;tokens_reasoning&#39;, &#39;tok… |
| SESSION_WRITE_COLUMNS | const | 63 | no | const SESSION_WRITE_COLUMNS = SESSION_COLUMNS.filter((c) =&gt; c !== &#39;id&#39;); |
| SECRET_BASENAMES | const | 69 | no | const SECRET_BASENAMES = [ |
| SECRET_KEYS | const | 79 | no | const SECRET_KEYS = /^(password\|passwd\|api[_-]?key\|apikey\|secret\|token\|bearer\|authorization\|auth\|access[_-]?token\|refresh[_-]?token\|private[_-]?key)$/i; |
| ASSIGNMENT_QUOTED | const | 81 | no | const ASSIGNMENT_QUOTED = /\\b(password\|passwd\|api[_-]?key\|secret\|token\|bearer)([&quot;&#39;]?\\s{0,4}[:=]\\s{0,4})([&quot;&#39;])(?!\\[REDACTED\\])([^&quot;&#39;]{1,})\\3/gi; |
| ASSIGNMENT | const | 82 | no | const ASSIGNMENT = /\\b(password\|passwd\|api[_-]?key\|secret\|token\|bearer)([&quot;&#39;]?\\s{0,4}[:=]\\s{0,4}[&quot;&#39;]?)(?!\\[REDACTED\\])([^\\s,;)}&quot;&#39;]{1,})/gi; |
| BEARER_VALUE | const | 83 | no | const BEARER_VALUE = /\\bBearer\\s+[A-Za-z0-9._~+/=-]{8,}/g; |
| TOKEN_SPLIT | const | 84 | no | const TOKEN_SPLIT = /[^\\s]+/g; |
| isSecretPath | function | 86 | no | function isSecretPath(value) { |
| base | const | 87 | no | const base = String(value ?? &#39;&#39;).split(/[\\\\/]/).pop() ?? &#39;&#39;; |
| redactToken | function | 91 | no | function redactToken(token) { |
| leadMatch | const | 92 | no | const leadMatch = String(token).match(/^[&quot;&#39;`(\\[{&lt;]+/); const lead = leadMatch ? leadMatch[0] : &#39;&#39;; const rest = token.slice(lead.length); const trailMatch = rest.match(/[&quot;&#39;`)\\]}&gt;,.;:!?]+$/); |
| lead | const | 93 | no | const lead = leadMatch ? leadMatch[0] : &#39;&#39;; |
| rest | const | 94 | no | const rest = token.slice(lead.length); |
| trailMatch | const | 95 | no | const trailMatch = rest.match(/[&quot;&#39;`)\\]}&gt;,.;:!?]+$/); |
| trail | const | 96 | no | const trail = trailMatch ? trailMatch[0] : &#39;&#39;; |
| core | const | 97 | no | const core = rest.slice(0, rest.length - trail.length); |
| redactSecrets | function | 107 | yes | export function redactSecrets(text) { |
| out | variable | 109 | no | let out = String(text); |
| redactDeep | function | 118 | no | function redactDeep(value, depth = 0) { |
| out | const | 126 | no | const out = {}; |
| numOrNull | function | 137 | no | function numOrNull(value) { |
| n | const | 139 | no | const n = Number(value); |
| isoOf | function | 143 | no | function isoOf(value) { |
| n | const | 146 | no | const n = Number(value); |
| ms | const | 148 | no | const ms = String(Math.trunc(Math.abs(n))).length &lt;= 10 ? n * 1000 : n; |
| d | const | 149 | no | const d = new Date(ms); |
| d | const | 153 | no | const d = new Date(String(value)); |
| minIso | function | 157 | no | function minIso(a, b) { |
| maxIso | function | 163 | no | function maxIso(a, b) { |
| jsonish | function | 169 | no | function jsonish(value) { |
| capText | function | 175 | no | function capText(text) { |
| value | const | 176 | no | const value = String(text ?? &#39;&#39;); |
| bytes | const | 177 | no | const bytes = Buffer.byteLength(value, &#39;utf8&#39;); |
| hash | const | 179 | no | const hash = sha256(value); |
| ensureString | function | 188 | no | function ensureString(value) { |
| s | const | 190 | no | const s = String(value).trim(); |
| uniqueInOrder | function | 194 | no | function uniqueInOrder(values) { |
| seen | const | 195 | no | const seen = new Set(); |
| out | const | 196 | no | const out = []; |
| key | const | 199 | no | const key = String(value); |
| tokenShape | function | 207 | no | function tokenShape(source) { |
| raw | const | 209 | no | const raw = source.tokens ?? source.usage ?? source; |
| input | const | 211 | no | const input = numOrNull(raw.input ?? raw.prompt ?? raw.inputTokens); |
| output | const | 212 | no | const output = numOrNull(raw.output ?? raw.completion ?? raw.outputTokens); |
| reasoning | const | 213 | no | const reasoning = numOrNull(raw.reasoning ?? raw.reasoningTokens); |
| cache | const | 214 | no | const cache = raw.cache &amp;&amp; typeof raw.cache === &#39;object&#39; ? raw.cache : {}; |
| cacheRead | const | 215 | no | const cacheRead = numOrNull(cache.read ?? raw.cacheRead ?? raw.cache_read); |
| cacheWrite | const | 216 | no | const cacheWrite = numOrNull(cache.write ?? raw.cacheWrite ?? raw.cache_write); |
| addTokens | function | 227 | no | function addTokens(a, b) { |
| zeroTokens | function | 238 | no | function zeroTokens() { |
| totalTokens | function | 242 | no | function totalTokens(t) { |
| payloadOf | function | 251 | no | function payloadOf(event) { |
| candidate | const | 253 | no | const candidate = event.properties ?? event.data ?? event.payload ?? null; |
| nested | const | 255 | no | const nested = candidate.data &amp;&amp; typeof candidate.data === &#39;object&#39; &amp;&amp; !Array.isArray(candidate.data) |
| merged | const | 258 | no | const merged = nested ? { ...nested, ...candidate } : { ...candidate }; |
| sessionIDOf | function | 263 | no | function sessionIDOf(props, envelope) { |
| chain | const | 264 | no | const chain = [ |
| s | const | 272 | no | const s = ensureString(value); |
| seqOfValue | function | 278 | no | function seqOfValue(data) { |
| n | const | 281 | no | const n = numOrNull(data[key]); |
| normalizeEvent | function | 291 | yes | export function normalizeEvent(event, { project = null } = {}) { |
| envelope | const | 292 | no | const envelope = event &amp;&amp; typeof event === &#39;object&#39; ? event : {}; |
| kind | const | 293 | no | const kind = ensureString(envelope.type ?? envelope.kind ?? envelope.event) ?? &#39;unknown&#39;; |
| props | const | 294 | no | const props = redactDeep(payloadOf(envelope)); |
| sessionID | const | 295 | no | const sessionID = sessionIDOf(props, envelope) ?? (kind === &#39;filesystem.changed&#39; ? WORKSPACE_SESSION : null); |
| at | const | 296 | no | const at = isoOf( props.time?.started ?? props.time?.created ?? props.time ?? props.at ?? props.timestamp ?? envelope.time ?? envelope.at, ); |
| seq | const | 300 | no | const seq = seqOfValue(props); |
| idBase | const | 301 | no | const idBase = [String(sessionID ?? &#39;&#39;), kind, seq === null ? &#39;&#39; : String(seq), canonicalJson(props)].join(&#39;\\0&#39;); |
| explicitId | const | 302 | no | const explicitId = ensureString(envelope.id ?? props.eventID ?? props.eventId); |
| readSessionRow | function | 317 | no | function readSessionRow(db, id) { |
| ensureSession | function | 321 | no | function ensureSession(db, id, { at = null, source = null, ingest = true } = {}) { |
| existing | const | 322 | no | const existing = readSessionRow(db, id); |
| iso | const | 324 | no | const iso = at ?? nowISO(); |
| patchSession | function | 333 | no | function patchSession(db, id, patch = {}) { |
| existing | const | 334 | no | const existing = readSessionRow(db, id); |
| next | const | 336 | no | const next = { ...existing }; |
| changed | variable | 337 | no | let changed = false; |
| touchSession | function | 356 | no | function touchSession(db, id, at) { |
| sessionInfoOf | function | 361 | no | function sessionInfoOf(data) { |
| sessionPatchFromInfo | function | 368 | no | function sessionPatchFromInfo(info) { |
| tokens | const | 370 | no | const tokens = tokenShape(info); |
| patch | const | 371 | no | const patch = { |
| resolveProjectIdRef | function | 392 | no | function resolveProjectIdRef(db, ref) { |
| asNumber | const | 394 | no | const asNumber = Number(ref); |
| row | const | 396 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE id = ?&#39;).get(asNumber); |
| name | const | 399 | no | const name = String(ref); |
| row | const | 400 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ? OR lower(name) = lower(?)&#39;) |
| resolveProjectIdByPath | function | 405 | no | function resolveProjectIdByPath(db, directory) { |
| dir | const | 406 | no | const dir = ensureString(directory); |
| normalize | function | 408 | no | const normalize = (value) =&gt; String(value ?? &#39;&#39;).replace(/\\\\/g, &#39;/&#39;).replace(/\\/+$/, &#39;&#39;).toLowerCase(); |
| target | const | 409 | no | const target = normalize(dir); |
| best | variable | 410 | no | let best = null; |
| projectPath | const | 412 | no | const projectPath = normalize(row.path); |
| insertEventRow | function | 425 | no | function insertEventRow(db, evt, at) { |
| durable | const | 426 | no | const durable = isDurableEvent(evt.kind) ? 1 : 0; |
| result | const | 427 | no | const result = db.prepare(` INSERT INTO session_events(id, session_id, seq, type, at, data, durable) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING `).run( |
| isDurableEvent | function | 443 | no | function isDurableEvent(kind) { |
| messageIDOf | function | 453 | no | function messageIDOf(data, sessionID, role) { |
| explicit | const | 454 | no | const explicit = ensureString( data.messageID ?? data.messageId ?? data.message_id ?? data.message?.id ?? data.part?.messageID, ); |
| ordinalOf | function | 462 | no | function ordinalOf(data) { |
| explicit | const | 463 | no | const explicit = numOrNull(data.ordinal ?? data.index ?? data.part?.index); |
| callID | const | 465 | no | const callID = ensureString(data.callID ?? data.toolCallID ?? data.tool_call_id); |
| toolNameOf | function | 470 | no | function toolNameOf(data) { |
| readMessageRow | function | 476 | no | function readMessageRow(db, id) { |
| ensureMessage | function | 480 | no | function ensureMessage(db, { sessionID, messageID, role = &#39;assistant&#39;, type = &#39;message&#39;, seq = null, at = null }) { |
| existing | const | 481 | no | const existing = readMessageRow(db, messageID); |
| patchRole | const | 483 | no | const patchRole = existing.role ? null : role; |
| patchSeq | const | 484 | no | const patchSeq = existing.seq === null \|\| existing.seq === undefined ? seq : null; |
| findPart | function | 499 | no | function findPart(db, { sessionID, messageID, type, toolName = null, ordinal = 0 }) { |
| upsertPart | function | 508 | no | function upsertPart(db, { sessionID, messageID, type, ordinal = 0, toolName = null, toolState = null, input = null, output = null, filePath = null, error = null, createdAt = null, completedAt = null,… |
| existing | const | 513 | no | const existing = findPart(db, { sessionID, messageID, type, toolName, ordinal }); |
| nextOutputRaw | const | 514 | no | const nextOutputRaw = appendOutput !== null |
| cappedOutput | const | 517 | no | const cappedOutput = nextOutputRaw === null ? null : capText(nextOutputRaw).text; |
| nextInputRaw | const | 518 | no | const nextInputRaw = appendInput !== null |
| cappedInput | const | 521 | no | const cappedInput = nextInputRaw === null ? null : capText(nextInputRaw).text; |
| nextState | const | 522 | no | const nextState = toolState ?? existing?.tool_state ?? null; |
| nextError | const | 523 | no | const nextError = error ?? existing?.error ?? null; |
| nextFile | const | 524 | no | const nextFile = filePath ?? existing?.file_path ?? null; |
| nextCreated | const | 525 | no | const nextCreated = existing?.created_at ?? createdAt ?? null; |
| nextCompleted | const | 526 | no | const nextCompleted = completedAt ?? existing?.completed_at ?? null; |
| unchanged | const | 529 | no | const unchanged = (existing.output ?? null) === cappedOutput |
| result | const | 544 | no | const result = db.prepare(` INSERT INTO session_parts(message_id, session_id, ordinal, type, tool_name, tool_state, input, output, file_path, error, created_at, completed_at) VALUES (?,?,?,?,?,?,?,?,… |
| syncMessageText | function | 553 | no | function syncMessageText(db, { sessionID, messageID, type }) { |
| column | const | 554 | no | const column = type === &#39;reasoning&#39; ? &#39;reasoning&#39; : &#39;text&#39;; |
| rows | const | 555 | no | const rows = db.prepare(` SELECT output FROM session_parts WHERE session_id = ? AND message_id = ? AND type = ? ORDER BY ordinal ASC, id ASC `).all(sessionID, messageID, type); |
| joined | const | 560 | no | const joined = rows.map((row) =&gt; row.output ?? &#39;&#39;).join(&#39;&#39;); |
| capped | const | 561 | no | const capped = capText(joined); |
| writeSessionFile | function | 570 | no | function writeSessionFile(db, { sessionID, path, action = &#39;changed&#39;, messageID = null }) { |
| cleanPath | const | 571 | no | const cleanPath = ensureString(path); |
| safePath | const | 575 | no | const safePath = cleanPath.replace(/\\\\/g, &#39;/&#39;); |
| result | const | 576 | no | const result = db.prepare(` INSERT INTO session_files(session_id, path, action, message_id) VALUES (?,?,?,?) ON CONFLICT(session_id, path, action, message_id) DO NOTHING `).run(sessionID, safePath, a… |
| writeSessionTodo | function | 584 | no | function writeSessionTodo(db, { sessionID, id, content, status, priority }) { |
| todoID | const | 585 | no | const todoID = ensureString(id) ?? `todo_${sha256([sessionID, String(content ?? &#39;&#39;)].join(&#39;\\0&#39;)).slice(0, 16)}`; |
| recordSessionSpan | function | 597 | no | function recordSessionSpan(db, { sessionID, operation, startedAt, durationMs, ok = true, bytes = 0, tokens = 0, meta = {}, }) { |
| iso | const | 600 | no | const iso = isoOf(startedAt) ?? nowISO(); |
| duration | const | 601 | no | const duration = Number.isFinite(durationMs) &amp;&amp; durationMs &gt;= 0 ? durationMs : 0; |
| metaJson | const | 602 | no | const metaJson = canonicalJson({ sessionID, ...meta }); |
| existing | const | 603 | no | const existing = db.prepare(` SELECT id FROM timings WHERE operation = ? AND started_at = ? AND IFNULL(meta, &#39;&#39;) = ? `).get(operation, iso, metaJson); |
| lastEventOfType | function | 615 | no | function lastEventOfType(db, sessionID, type) { |
| reindexSessionFts | function | 622 | no | function reindexSessionFts(db, sessionID) { |
| insert | const | 624 | no | const insert = db.prepare(&#39;INSERT INTO session_fts(session_id, kind, text) VALUES (?,?,?)&#39;); |
| push | function | 625 | no | const push = (kind, text) =&gt; { |
| value | const | 626 | no | const value = String(text ?? &#39;&#39;).trim(); |
| messages | const | 630 | no | const messages = db.prepare(` SELECT role, type, text, reasoning, error FROM session_messages WHERE session_id = ? ORDER BY seq, created_at, id `).all(sessionID); |
| parts | const | 639 | no | const parts = db.prepare(` SELECT tool_name, tool_state, error FROM session_parts WHERE session_id = ? AND type IN (&#39;tool&#39;, &#39;tool-input&#39;) ORDER BY id `).all(sessionID); |
| pickDelta | function | 653 | no | function pickDelta(data) { |
| pickFull | function | 660 | no | function pickFull(data) { |
| applyStreamText | function | 667 | no | function applyStreamText(db, { sessionID, kind, data, at, type, role }) { |
| phase | const | 668 | no | const phase = kind.split(&#39;.&#39;).pop(); |
| messageID | const | 669 | no | const messageID = messageIDOf(data, sessionID, role); |
| existing | const | 671 | no | const existing = findPart(db, { sessionID, messageID, type, toolName: null, ordinal: 0 }); |
| delta | const | 672 | no | const delta = pickDelta(data); |
| full | const | 673 | no | const full = pickFull(data); |
| next | variable | 674 | no | let next; |
| applyToolEvent | function | 695 | no | function applyToolEvent(db, { sessionID, kind, data, at }) { |
| toolName | const | 696 | no | const toolName = toolNameOf(data); |
| role | const | 697 | no | const role = data.role ?? &#39;assistant&#39;; |
| messageID | const | 698 | no | const messageID = messageIDOf(data, sessionID, role); |
| phase | const | 700 | no | const phase = kind.split(&#39;.&#39;).pop(); |
| ordinal | const | 701 | no | const ordinal = ordinalOf(data); |
| state | const | 702 | no | const state = phase === &#39;called&#39; ? &#39;called&#39; |
| input | const | 705 | no | const input = data.input !== undefined ? jsonish(redactDeep(data.input)) : null; |
| output | const | 706 | no | const output = data.output !== undefined ? jsonish(redactDeep(data.output)) |
| error | const | 708 | no | const error = data.error !== undefined ? jsonish(redactDeep(data.error)) : null; |
| filePath | const | 709 | no | const filePath = ensureString( data.filePath ?? data.path ?? data.file ?? data.input?.filePath ?? data.input?.path, ); |
| action | const | 720 | no | const action = /write\|edit\|patch\|create/i.test(toolName ?? &#39;&#39;) ? &#39;edit&#39; |
| applyTodoTool | function | 727 | no | function applyTodoTool(db, sessionID, input) { |
| value | const | 728 | no | const value = typeof input === &#39;string&#39; ? safeJsonParse(input, null) : input; |
| list | const | 729 | no | const list = Array.isArray(value) ? value : (Array.isArray(value?.todos) ? value.todos : null); |
| count | variable | 731 | no | let count = 0; |
| applyExecutionEvent | function | 746 | no | function applyExecutionEvent(db, { sessionID, kind, data, at }) { |
| phase | const | 747 | no | const phase = kind.split(&#39;.&#39;).pop(); |
| ok | const | 751 | no | const ok = phase === &#39;succeeded&#39;; |
| start | const | 752 | no | const start = lastEventOfType(db, sessionID, &#39;session.execution.started&#39;); |
| durationMs | const | 753 | no | const durationMs = numOrNull(data.durationMs ?? data.duration ?? data.ms) |
| patch | const | 763 | no | const patch = {}; |
| applyStepEvent | function | 769 | no | function applyStepEvent(db, { sessionID, kind, data, at }) { |
| phase | const | 770 | no | const phase = kind.split(&#39;.&#39;).pop(); |
| tokens | const | 771 | no | const tokens = tokenShape(data); |
| patch | const | 773 | no | const patch = {}; |
| files | const | 783 | no | const files = Array.isArray(data.files) ? data.files : []; |
| path | const | 785 | no | const path = typeof entry === &#39;string&#39; ? entry : entry?.path; |
| action | const | 786 | no | const action = typeof entry === &#39;string&#39; ? &#39;changed&#39; : entry?.action ?? &#39;changed&#39;; |
| start | const | 791 | no | const start = lastEventOfType(db, sessionID, &#39;session.step.started&#39;); |
| durationMs | const | 792 | no | const durationMs = numOrNull(data.durationMs ?? data.duration ?? data.ms) |
| applyCompactionEvent | function | 807 | no | function applyCompactionEvent(db, { sessionID, kind, data, at }) { |
| phase | const | 808 | no | const phase = kind.split(&#39;.&#39;).pop(); |
| messageID | const | 809 | no | const messageID = ensureString(data.messageID ?? data.message?.id) |
| existing | const | 812 | no | const existing = findPart(db, { sessionID, messageID, type: &#39;compaction&#39;, toolName: null, ordinal: 0 }); |
| delta | const | 813 | no | const delta = pickDelta(data); |
| full | const | 814 | no | const full = data.summary ?? data.text ?? data.content ?? null; |
| next | variable | 815 | no | let next; |
| tokens | const | 832 | no | const tokens = tokenShape(data); |
| applyFilesystemEvent | function | 844 | no | function applyFilesystemEvent(db, { sessionID, data, at }) { |
| entries | const | 845 | no | const entries = Array.isArray(data.files) ? data.files |
| action | const | 847 | no | const action = ensureString(data.action ?? data.change ?? data.event ?? data.kind ?? data.type) ?? &#39;changed&#39;; |
| written | variable | 848 | no | let written = 0; |
| path | const | 850 | no | const path = typeof entry === &#39;string&#39; ? entry : entry?.path ?? entry?.file; |
| entryAction | const | 851 | no | const entryAction = typeof entry === &#39;string&#39; ? action : ensureString(entry?.action) ?? action; |
| applySessionEvent | function | 857 | no | function applySessionEvent(db, { sessionID, kind, data, at, source }) { |
| needsFts | variable | 858 | no | let needsFts = false; |
| finalize | variable | 859 | no | let finalize = false; |
| info | const | 862 | no | const info = sessionInfoOf(data); |
| fromInfo | const | 863 | no | const fromInfo = sessionPatchFromInfo(info); |
| directory | const | 869 | no | const directory = fromInfo.directory ?? ensureString(data.directory); |
| projectId | const | 871 | no | const projectId = resolveProjectIdByPath(db, directory); |
| phase | const | 893 | no | const phase = kind.split(&#39;.&#39;).pop(); |
| messageID | const | 894 | no | const messageID = messageIDOf(data, sessionID, data.role ?? &#39;assistant&#39;); |
| toolName | const | 895 | no | const toolName = toolNameOf(data); |
| existing | const | 897 | no | const existing = findPart(db, { sessionID, messageID, type: &#39;tool-input&#39;, toolName, ordinal: ordinalOf(data) }); |
| delta | const | 898 | no | const delta = pickDelta(data); |
| full | const | 899 | no | const full = pickFull(data); |
| next | const | 900 | no | const next = phase === &#39;delta&#39; |
| status | const | 943 | no | const status = ensureString( typeof data.status === &#39;string&#39; ? data.status : data.status?.type ?? data.state ?? data.value, ); |
| parentID | const | 958 | no | const parentID = ensureString(data.parentID ?? data.parent_id ?? data.parent?.id ?? data.forkedFrom); |
| tokens | const | 977 | no | const tokens = tokenShape(data); |
| ingestEvent | function | 1007 | yes | export function ingestEvent(db, event, { project = null, source = &#39;plugin&#39; } = {}) { |
| evt | const | 1008 | no | const evt = normalizeEvent(event, { project }); |
| at | const | 1012 | no | const at = evt.at |
| isWorkspace | const | 1017 | no | const isWorkspace = evt.sessionID === WORKSPACE_SESSION; |
| projectId | const | 1021 | no | const projectId = resolveProjectIdRef(db, project); |
| inserted | const | 1025 | no | const inserted = insertEventRow(db, evt, at); |
| result | const | 1029 | no | const result = applySessionEvent(db, { sessionID: evt.sessionID, kind: evt.kind, data: evt.data ?? {}, at, |
| normalizeImportInfo | function | 1046 | no | function normalizeImportInfo(session) { |
| importPart | function | 1052 | no | function importPart(db, { sessionID, messageID, part, at, ordinal }) { |
| partAt | const | 1055 | no | const partAt = isoOf(part.time?.start ?? part.time?.created ?? part.createdAt) ?? at; |
| completedAt | const | 1056 | no | const completedAt = isoOf(part.time?.end ?? part.time?.completed ?? part.completedAt); |
| existing | const | 1058 | no | const existing = findPart(db, { sessionID, messageID, type, toolName: null, ordinal }); |
| text | const | 1059 | no | const text = capText(part.text ?? &#39;&#39;).text; |
| result | const | 1060 | no | const result = upsertPart(db, { sessionID, messageID, type, ordinal, output: text, createdAt: existing?.created_at ?? partAt, completedAt: completedAt ?? existing?.completed_at ?? null, |
| state | const | 1071 | no | const state = part.state &amp;&amp; typeof part.state === &#39;object&#39; ? part.state : {}; |
| result | const | 1072 | no | const result = upsertPart(db, { sessionID, messageID, type: &#39;tool&#39;, ordinal, toolName: ensureString(part.tool ?? part.toolName), toolState: ensureString(state.status) ?? &#39;called&#39;, input: state.input … |
| path | const | 1083 | no | const path = ensureString(state.input?.filePath ?? state.input?.path); |
| result | const | 1097 | no | const result = upsertPart(db, { sessionID, messageID, type, ordinal, output: part.text ? capText(part.text).text : null, createdAt: partAt, completedAt, |
| importMessage | function | 1107 | no | function importMessage(db, { sessionID, entry, at }) { |
| info | const | 1109 | no | const info = entry.info &amp;&amp; typeof entry.info === &#39;object&#39; ? entry.info : entry; |
| fallbackRole | const | 1110 | no | const fallbackRole = ensureString(info.role) ?? &#39;assistant&#39;; |
| messageID | const | 1111 | no | const messageID = ensureString(info.id) ?? messageIDOf(info, sessionID, fallbackRole); |
| tokens | const | 1112 | no | const tokens = tokenShape(info); |
| role | const | 1113 | no | const role = fallbackRole; |
| seq | const | 1115 | no | const seq = numOrNull(info.seq ?? info.sequence); |
| created | const | 1116 | no | const created = isoOf(info.time?.created ?? info.createdAt) ?? at; |
| completed | const | 1117 | no | const completed = isoOf(info.time?.completed ?? info.completedAt); |
| existing | const | 1118 | no | const existing = readMessageRow(db, messageID); |
| text | const | 1119 | no | const text = capText(typeof info.text === &#39;string&#39; ? redactSecrets(info.text) : &#39;&#39;).text; |
| reasoning | const | 1120 | no | const reasoning = capText(typeof info.reasoning === &#39;string&#39; ? redactSecrets(info.reasoning) : &#39;&#39;).text; |
| error | const | 1121 | no | const error = info.error ? jsonish(redactDeep(info.error)) : null; |
| model | const | 1122 | no | const model = ensureString(info.model?.id ?? info.modelID ?? info.model); |
| agent | const | 1123 | no | const agent = ensureString(info.agent ?? info.mode); |
| cost | const | 1124 | no | const cost = numOrNull(info.cost); |
| finish | const | 1125 | no | const finish = ensureString(info.finish ?? info.stop); |
| inserted | variable | 1127 | no | let inserted = false; |
| nextHash | const | 1142 | no | const nextHash = sha256(canonicalJson({ role, type, text, reasoning, error, finish, completed })); |
| patchParts | const | 1144 | no | const patchParts = []; |
| params | const | 1145 | no | const params = []; |
| parts | variable | 1155 | no | let parts = 0; |
| partList | const | 1156 | no | const partList = Array.isArray(entry.parts) ? entry.parts : []; |
| ordinal | const | 1158 | no | const ordinal = numOrNull(part?.index) ?? index; |
| result | const | 1159 | no | const result = importPart(db, { sessionID, messageID, part, at: created, ordinal: Math.trunc(ordinal) }); |
| ingestSession | function | 1169 | yes | export function ingestSession(db, { session = null, messages = null, parts = null, events = null, project = null, source = &#39;import&#39;, } = {}) { |
| info | const | 1172 | no | const info = normalizeImportInfo(session); |
| sessionID | const | 1173 | no | const sessionID = ensureString(info.id ?? info.sessionID ?? session?.sessionID); |
| at | const | 1175 | no | const at = isoOf(info.time?.created ?? info.created ?? info.createdAt) ?? nowISO(); |
| projectIdFromArg | const | 1177 | no | const projectIdFromArg = resolveProjectIdRef(db, project); |
| projectIdFromDirectory | const | 1178 | no | const projectIdFromDirectory = resolveProjectIdByPath(db, info.directory ?? info.cwd ?? info.path); |
| fromInfo | const | 1180 | no | const fromInfo = sessionPatchFromInfo(info); |
| created | variable | 1181 | no | let created = null; |
| updated | variable | 1182 | no | let updated = null; |
| messageList | const | 1196 | no | const messageList = Array.isArray(messages) ? messages : (Array.isArray(session?.messages) ? session.messages : []); |
| messageCount | variable | 1197 | no | let messageCount = 0; |
| partCount | variable | 1198 | no | let partCount = 0; |
| seenMessages | const | 1199 | no | const seenMessages = []; |
| result | const | 1201 | no | const result = importMessage(db, { sessionID, entry, at }); |
| flatParts | const | 1207 | no | const flatParts = Array.isArray(parts) ? parts : []; |
| messageID | const | 1209 | no | const messageID = ensureString(part?.messageID ?? part?.message_id) ?? seenMessages[0]; |
| result | const | 1212 | no | const result = importPart(db, { sessionID, messageID, part, at, ordinal: ordinalOf(part) }); |
| eventList | const | 1216 | no | const eventList = Array.isArray(events) ? events : []; |
| eventCount | variable | 1217 | no | let eventCount = 0; |
| result | const | 1219 | no | const result = ingestEvent(db, { sessionID, ...event }, { project: project ?? null, source }); |
| mapSessionRow | function | 1237 | no | function mapSessionRow(row) { |
| listSessions | function | 1265 | yes | export function listSessions(db, { project = null, query = null, status = null, limit = 50 } = {}) { |
| params | const | 1267 | no | const params = []; |
| projectId | const | 1269 | no | const projectId = resolveProjectIdRef(db, project); |
| like | const | 1279 | no | const like = `%${String(query).toLowerCase()}%`; |
| max | const | 1287 | no | const max = Math.min(500, Math.max(1, Number(limit) \|\| 50)); |
| sql | const | 1288 | no | const sql = ` |
| getSession | function | 1298 | yes | export function getSession(db, { id } = {}) { |
| row | const | 1300 | no | const row = db.prepare(` SELECT s.*, p.name AS project FROM sessions s LEFT JOIN projects p ON p.id = s.project_id WHERE s.id = ? `).get(String(id)); |
| messages | const | 1306 | no | const messages = db.prepare(` SELECT * FROM session_messages WHERE session_id = ? ORDER BY seq ASC, created_at ASC, id ASC `).all(row.id).map((m) =&gt; ({ id: m.id, |
| parts | const | 1329 | no | const parts = db.prepare(` SELECT * FROM session_parts WHERE session_id = ? ORDER BY message_id ASC, ordinal ASC, id ASC `).all(row.id).map((p) =&gt; ({ id: p.id, |
| events | const | 1347 | no | const events = db.prepare(` SELECT * FROM session_events WHERE session_id = ? ORDER BY at ASC, seq ASC, id ASC `).all(row.id).map((e) =&gt; ({ id: e.id, |
| files | const | 1359 | no | const files = db.prepare(` SELECT path, action, message_id FROM session_files WHERE session_id = ? ORDER BY path ASC, action ASC `).all(row.id).map((f) =&gt; ({ path: f.path, action: f.action, messageId… |
| todos | const | 1363 | no | const todos = db.prepare(` SELECT id, content, status, priority FROM session_todos WHERE session_id = ? ORDER BY id ASC `).all(row.id).map((t) =&gt; ({ id: t.id, content: t.content ?? &#39;&#39;, status: t.stat… |
| deriveSummary | function | 1376 | no | function deriveSummary(db, id) { |
| session | const | 1377 | no | const session = readSessionRow(db, id); |
| messages | const | 1379 | no | const messages = db.prepare(` SELECT role, text, reasoning, error, cost, tokens_input, tokens_output, created_at, completed_at FROM session_messages WHERE session_id = ? ORDER BY seq, created_at, id … |
| parts | const | 1383 | no | const parts = db.prepare(` SELECT type, tool_name, tool_state, error FROM session_parts WHERE session_id = ? ORDER BY id `).all(id); |
| events | const | 1386 | no | const events = db.prepare(` SELECT type, at, data FROM session_events WHERE session_id = ? ORDER BY at, seq, id `).all(id); |
| fileRows | const | 1389 | no | const fileRows = db.prepare(&#39;SELECT path FROM session_files WHERE session_id = ? ORDER BY path&#39;).all(id); |
| todoRows | const | 1390 | no | const todoRows = db.prepare(&#39;SELECT id, content, status, priority FROM session_todos WHERE session_id = ? ORDER BY id&#39;).all(id); |
| toolMap | const | 1392 | no | const toolMap = new Map(); |
| entry | const | 1395 | no | const entry = toolMap.get(part.tool_name) ?? { name: part.tool_name, calls: 0, failed: 0 }; |
| tools | const | 1400 | no | const tools = [...toolMap.values()].sort((a, b) =&gt; a.name.localeCompare(b.name)); |
| errors | const | 1402 | no | const errors = uniqueInOrder([ ...parts.map((p) =&gt; p.error), ...messages.map((m) =&gt; m.error), ...events .filter((e) =&gt; e.type === &#39;session.execution.failed&#39; \|\| e.type === &#39;session.execution.interrupt… |
| data | const | 1408 | no | const data = safeJsonParse(e.data, {}) ?? {}; |
| stepTokens | variable | 1413 | no | let stepTokens = null; |
| stepCost | variable | 1414 | no | let stepCost = null; |
| usageTokens | variable | 1415 | no | let usageTokens = null; |
| usageCost | variable | 1416 | no | let usageCost = null; |
| lastExecution | variable | 1417 | no | let lastExecution = null; |
| data | const | 1420 | no | const data = safeJsonParse(event.data, {}) ?? {}; |
| t | const | 1421 | no | const t = tokenShape(data); |
| data | const | 1426 | no | const data = safeJsonParse(event.data, {}) ?? {}; |
| t | const | 1427 | no | const t = tokenShape(data); |
| cost | const | 1429 | no | const cost = numOrNull(data.cost); |
| messageTokens | variable | 1437 | no | let messageTokens = zeroTokens(); |
| messageHasTokens | variable | 1438 | no | let messageHasTokens = false; |
| messageCost | variable | 1439 | no | let messageCost = 0; |
| messageHasCost | variable | 1440 | no | let messageHasCost = false; |
| input | const | 1442 | no | const input = numOrNull(message.tokens_input); |
| output | const | 1443 | no | const output = numOrNull(message.tokens_output); |
| cost | const | 1448 | no | const cost = numOrNull(message.cost); |
| rowTokens | const | 1452 | no | const rowTokens = { |
| rowHasTokens | const | 1459 | no | const rowHasTokens = Object.values(rowTokens).some((v) =&gt; v !== 0); |
| messageTokensMerged | const | 1461 | no | const messageTokensMerged = { |
| tokens | const | 1469 | no | const tokens = usageTokens ?? stepTokens ?? (messageHasTokens ? messageTokensMerged : (rowHasTokens ? rowTokens : zeroTokens())); |
| cost | const | 1470 | no | const cost = usageCost ?? stepCost ?? (messageHasCost ? messageCost : (numOrNull(session.cost) ?? 0)); |
| files | const | 1472 | no | const files = uniqueInOrder([ ...fileRows.map((f) =&gt; f.path), ...events .filter((e) =&gt; e.type === &#39;session.step.ended&#39;) .flatMap((e) =&gt; { |
| data | const | 1477 | no | const data = safeJsonParse(e.data, {}) ?? {}; |
| outcome | variable | 1484 | no | let outcome = ensureString(session.outcome); |
| startedAt | const | 1495 | no | const startedAt = session.created_at ?? null; |
| updatedAt | const | 1496 | no | const updatedAt = session.updated_at ?? null; |
| started | const | 1497 | no | const started = startedAt ? Date.parse(startedAt) : NaN; |
| ended | const | 1498 | no | const ended = updatedAt ? Date.parse(updatedAt) : NaN; |
| durationMs | const | 1499 | no | const durationMs = Number.isFinite(started) &amp;&amp; Number.isFinite(ended) ? Math.max(0, ended - started) : 0; |
| sessionSummary | function | 1527 | yes | export function sessionSummary(db, { id } = {}) { |
| finalizeSession | function | 1531 | yes | export function finalizeSession(db, { id, now = null } = {}) { |
| session | const | 1532 | no | const session = readSessionRow(db, id); |
| iso | const | 1535 | no | const iso = isoOf(now) ?? ensureString(now); |
| first | const | 1538 | no | const first = deriveSummary(db, id); |
| CONTEXT_PRIORITY | const | 1556 | no | const CONTEXT_PRIORITY = { |
| contextCandidates | function | 1560 | no | function contextCandidates(db, data) { |
| id | const | 1562 | no | const id = session.id; |
| candidates | const | 1563 | no | const candidates = []; |
| userMessages | const | 1565 | no | const userMessages = messages.filter((m) =&gt; m.role === &#39;user&#39; &amp;&amp; m.text &amp;&amp; m.text.trim()); |
| lastUser | const | 1566 | no | const lastUser = userMessages[userMessages.length - 1]; |
| firstAssistant | const | 1570 | no | const firstAssistant = messages.find((m) =&gt; m.text &amp;&amp; m.text.trim()); |
| decisions | const | 1576 | no | const decisions = []; |
| errors | const | 1586 | no | const errors = uniqueInOrder([ ...parts.map((p) =&gt; p.error), ...messages.map((m) =&gt; m.error), ]); |
| paths | const | 1594 | no | const paths = uniqueInOrder(files.map((f) =&gt; f.path)); |
| openTodos | const | 1599 | no | const openTodos = todos.filter((t) =&gt; t.status !== &#39;completed&#39; &amp;&amp; t.status !== &#39;cancelled&#39;); |
| toolNames | const | 1608 | no | const toolNames = uniqueInOrder(parts.filter((p) =&gt; p.type === &#39;tool&#39;).map((p) =&gt; p.toolName)); |
| assistantMessages | const | 1613 | no | const assistantMessages = messages.filter((m) =&gt; m.role !== &#39;user&#39; &amp;&amp; m.text &amp;&amp; m.text.trim()); |
| lastAssistant | const | 1614 | no | const lastAssistant = assistantMessages[assistantMessages.length - 1]; |
| reasoningMessages | const | 1622 | no | const reasoningMessages = messages.filter((m) =&gt; m.reasoning &amp;&amp; m.reasoning.trim()); |
| lastReasoning | const | 1623 | no | const lastReasoning = reasoningMessages[reasoningMessages.length - 1]; |
| executionErrors | const | 1632 | no | const executionErrors = events |
| renderContextText | function | 1645 | no | function renderContextText(sources) { |
| sessionContext | function | 1653 | yes | export function sessionContext(db, { id, budgetTokens = 3000 } = {}) { |
| data | const | 1654 | no | const data = getSession(db, { id }); |
| budget | const | 1655 | no | const budget = Math.min(24_000, Math.max(256, Number(budgetTokens) \|\| 3000)); |
| capacity | const | 1656 | no | const capacity = budget - 80; |
| candidates | const | 1661 | no | const candidates = contextCandidates(db, data) |
| sources | const | 1664 | no | const sources = []; |
| used | variable | 1665 | no | let used = 0; |
| text | const | 1667 | no | const text = String(candidate.text ?? &#39;&#39;).trim(); |
| tokens | variable | 1669 | no | let tokens = estimateTokens(text); |
| body | variable | 1670 | no | let body = text; |
| remaining | const | 1672 | no | const remaining = capacity - used; |
| chars | const | 1674 | no | const chars = Math.max(0, remaining * 3); |
| text | const | 1690 | no | const text = renderContextText(sources); |
| digest | const | 1691 | no | const digest = digestOf({ schema: SESSION_SCHEMA, id: data.session.id, sources: sources.map((s) =&gt; ({ ref: s.ref, kind: s.kind, sha256: s.sha256, tokens: s.tokens })), }); |
| linkSessionProject | function | 1703 | yes | export function linkSessionProject(db, { id, projectId } = {}) { |
| session | const | 1705 | no | const session = readSessionRow(db, id); |
| resolved | const | 1707 | no | const resolved = resolveProjectIdRef(db, projectId); |
| result | const | 1709 | no | const result = db.prepare(&#39;UPDATE sessions SET project_id = ? WHERE id = ?&#39;).run(resolved, String(id)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./util.mjs | import | 10 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/session-import.mjs](./session-import.mjs.md) | ./sessions.mjs |
| [hq/lib/session-views.mjs](./session-views.mjs.md) | ./sessions.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | OpenCode 2.2.5 session ingestion: normalize, redact, persist, summarize, budget evidence. |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | LAB-01 |
| 5 | invariant | — | — | Read-only toward OpenCode. Writes only the passed db. Never stores secrets or raw auth material. |
| 6 | invariant | — | — | Writes are idempotent: deterministic event ids, INSERT OR IGNORE, upsert by natural key. |
| 7 | see | — | docs/LABS/LAB-01-REALTIME-DOGFEED.md | docs/LABS/LAB-01-REALTIME-DOGFEED.md |
| 8 | see | — | hq/CONTRACT.md | hq/CONTRACT.md |

## Excerpt

```javascript
/**
 * @hq:context OpenCode 2.2.5 session ingestion: normalize, redact, persist, summarize, budget evidence.
 * @hq:owner hq
 * @hq:task LAB-01
 * @hq:invariant Read-only toward OpenCode. Writes only the passed db. Never stores secrets or raw auth material.
 * @hq:invariant Writes are idempotent: deterministic event ids, INSERT OR IGNORE, upsert by natural key.
 * @hq:see docs/LABS/LAB-01-REALTIME-DOGFEED.md
 * @hq:see hq/CONTRACT.md
 */
import { nowISO, sha256, canonicalJson, digestOf, estimateTokens, safeJsonParse } from './util.mjs';

export const SESSION_SCHEMA = 'hq.sessions/1';

/** Hard cap for one stored part (100 KB). Larger content keeps a hash + head summary. */
const MAX_PART_BYTES = 100 * 1024;
const FTS_TEXT_CAP = 20_000;
const WORKSPACE_SESSION = 'workspace';

export const SESSION_EVENT_TYPES = Object.freeze([
  'session.created',
  'session.text.started',
  'session.text.delta',
  'session.text.ended',
  'session.reasoning.started',
  'session.reasoning.delta',
  'session.reasoning.ended',
  'session.tool.input.started',
  'session.tool.input.delta',
  'session.tool.input.ended',
  'session.tool.called',
  'session.tool.progress',
  'session.tool.success',
  'session.tool.failed',
  'session.execution.started',
  'session.execution.succeeded',
  'session.execution.failed',
  'session.execution.interrupted',
  'session.step.started',
  'session.step.streamed',
  'session.step.ended',
  'session.compaction.started',
  'session.compaction.delta',
  'session.compaction.ended',
  'session.compaction.failed',
  'session.status',
  'session.idle',
  'session.forked',
  'session.archived',
  'session.unarchived',
  'session.usage.updated',
  'permission.asked',
  'permission.replied',
  'filesystem.changed',
]);

const SESSION_COLUMNS = Object.freeze([
  'id', 'project_id', 'parent_id', 'title', 'directory', 'agent', 'model',
  'status', 'outcome', 'cost', 'tokens_input', 'tokens_output',
  'tokens_reasoning', 'tokens_cache_read', 'tokens_cache_write',
  'created_at', 'updated_at', 'ingested_at', 'source', 'raw_hash',
]);

const SESSION_WRITE_COLUMNS = SESSION_COLUMNS.filter((c) => c !== 'id');

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

const SECRET_BASENAMES = [
  /^\.env(\..+)?$/i,
  /\.keystore$/i,
  /^session\.json$/i,
  /^storage-state\.json$/i,
  /^release-profile\.json$/i,
  /^cookies$/i,
  /^login data$/i,
];

const SECRET_KEYS = /^(password|passwd|api[_-]?key|apikey|secret|token|bearer|authorization|auth|access[_-]?token|refresh[_-]?token|private[_-]?key)$/i;
```

_First 80 of 1712 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
