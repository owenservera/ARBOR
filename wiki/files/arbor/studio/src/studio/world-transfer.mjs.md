# File: studio/src/studio/world-transfer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/world-transfer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 39293 B |
| Lines | 459 |
| Hash | cf218b209dbc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORLD_EXPORT_LIMITS | const | 10 | yes | export const WORLD_EXPORT_LIMITS = Object.freeze({ maxSelected: 100, maxRecords: 256, maxDependenciesPerRecord: 3000, maxRecordBytes: 2 * 1024 * 1024, maxTotalBytes: 8 * 1024 * 1024 }); |
| IMPORT_CONTENT_LIMITS | const | 12 | yes | export const IMPORT_CONTENT_LIMITS = Object.freeze({ maxMessages: 200, maxBlocks: 200, maxNodes: 2000, maxDepth: 12, maxTextChars: 262144, maxBlockBytes: 512 * 1024, maxErrors: 100, maxDeps: 1000 }); |
| EXPORT_SECRET_SCAN_LIMITS | const | 15 | yes | export const EXPORT_SECRET_SCAN_LIMITS = Object.freeze({ maxChars: 512 * 1024, maxValueChars: 16 * 1024, maxValues: 2048, maxFindings: 40, maxPerLocation: 4 }); |
| BLOCK_TYPE_RE | const | 16 | no | const BLOCK_TYPE_RE = /^[a-z][a-z0-9_+#-]{0,63}$/; |
| FORBIDDEN_KEY | const | 17 | no | const FORBIDDEN_KEY = new Set([&#39;__proto__&#39;, &#39;constructor&#39;, &#39;prototype&#39;]); |
| fail | function | 18 | no | const fail = (code, message) =&gt; Object.assign(new Error(message), { code, status: code === &#39;WORLD_EXPORT_LIMIT&#39; ? 413 : 400 }); |
| validId | function | 19 | no | const validId = (id) =&gt; typeof id === &#39;string&#39; &amp;&amp; (/^c-(?:[a-f0-9]{40}\|i[a-f0-9]{38})$/.test(id) \|\| /^[npos]-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id) \|\| /^[npos]-[a-f0-… |
| hash | function | 22 | no | const hash = (value) =&gt; createHash(&#39;sha256&#39;).update(stableStringify(value)).digest(&#39;hex&#39;); |
| importedConversationId | function | 23 | yes | export const importedConversationId = (id) =&gt; typeof id === &#39;string&#39; &amp;&amp; /^c-i[a-f0-9]{38}$/.test(id); |
| localId | function | 24 | no | const localId = (digest, id) =&gt; id.startsWith(&#39;c-&#39;) ? `c-i${hash([digest, id]).slice(0, 38)}` : `${id[0]}-${hash([digest, id]).slice(0, 36)}f`; |
| contentErrors | function | 25 | no | const contentErrors = (record) =&gt; { |
| errors | const | 26 | no | const errors = [], messages = record?.data?.messages, state = { nodes: 0, capped: false }; |
| push | function | 27 | no | const push = (message) =&gt; { if (errors.length &lt; IMPORT_CONTENT_LIMITS.maxErrors) errors.push({ id: record.id, code: &#39;WORLD_IMPORT_CONTENT&#39;, message }); }; |
| walk | function | 28 | no | const walk = (value, depth) =&gt; { |
| inspect | function | 51 | no | const inspect = (value, depth, seen) =&gt; { |
| bytes | function | 58 | no | const bytes = (value) =&gt; { inspect(value, 0, new WeakSet()); return Buffer.byteLength(stableStringify(value), &#39;utf8&#39;); }; |
| list | function | 59 | no | const list = (value, limit = 100) =&gt; Array.isArray(value) ? value.slice(0, limit) : []; |
| dependencies | function | 60 | no | const dependencies = (record, errors) =&gt; [&#39;conversationIds&#39;, &#39;noteIds&#39;, &#39;memberIds&#39;, &#39;commentsOn&#39;, &#39;objectId&#39;, &#39;conversationId&#39;].flatMap((key) =&gt; { const value = record?.data?.[key]; if (value === un… |
| value | const | 61 | no | const value = record?.data?.[key]; |
| compare | function | 68 | no | const compare = (a, b) =&gt; a &lt; b ? -1 : a &gt; b ? 1 : 0; |
| jsonCopy | function | 69 | no | const jsonCopy = (value) =&gt; { |
| types | const | 73 | no | const types = { p: [&#39;project&#39;, &#39;project&#39;], n: [&#39;note&#39;, &#39;note&#39;], o: [&#39;object&#39;, &#39;source-reference&#39;], |
| errorReason | function | 75 | no | const errorReason = (error) =&gt; ({ WORLD_NOT_FOUND: &#39;SOURCE_OR_OBJECT_MISSING&#39;, WORLD_SOURCE_ACTIVE: &#39;SOURCE_ACTIVE&#39;, STORE_NO_SUCH_ITEM: &#39;OBJECT_MISSING&#39;, STORE_RECORD_CORRUPT: &#39;OVERLAY_UNREADABLE&#39;, … |
| EXPORT_MODES | const | 77 | yes | export const EXPORT_MODES = Object.freeze([&#39;references&#39;, &#39;transcript&#39;, &#39;full-saved&#39;]); |
| REASONING_BLOCK | const | 78 | no | const REASONING_BLOCK = new Set([&#39;reasoning&#39;, &#39;thinking&#39;, &#39;thought&#39;]); |
| TOOL_BLOCK | const | 79 | no | const TOOL_BLOCK = new Set([&#39;tool&#39;, &#39;tool_use&#39;, &#39;tool-use&#39;, &#39;tool-activity&#39;, &#39;function&#39;, &#39;function_call&#39;, &#39;function-call&#39;, &#39;tool_call&#39;, &#39;tool-call&#39;, &#39;status&#39;, &#39;status_activity&#39;, &#39;status-activity&#39;]); |
| TRANSCRIPT_BLOCK | const | 80 | no | const TRANSCRIPT_BLOCK = new Set([&#39;text&#39;, &#39;paragraph&#39;, &#39;heading&#39;, &#39;code&#39;, &#39;table&#39;, &#39;list&#39;, &#39;quote&#39;, &#39;blockquote&#39;]); |
| exclusionReason | function | 81 | no | const exclusionReason = (type) =&gt; REASONING_BLOCK.has(type) ? &#39;reasoning-blocks-excluded&#39; |
| pruneBlocks | function | 84 | no | const pruneBlocks = (value, depth, keep, stats) =&gt; { |
| reason | const | 94 | no | const reason = exclusionReason(type), bin = stats.bins.get(reason) ?? { count: 0 }; |
| out | const | 98 | no | const out = {}; |
| reduceMessages | function | 104 | no | const reduceMessages = (data, keep, omitted, id) =&gt; { |
| stats | const | 105 | no | const stats = { bins: new Map(), affected: 0 }; |
| before | const | 108 | no | const before = stats.affected; |
| SENSITIVE_KEY | const | 119 | no | const SENSITIVE_KEY = new Set([&#39;password&#39;, &#39;passwd&#39;, &#39;passphrase&#39;, &#39;cookie&#39;, &#39;cookies&#39;, &#39;setcookie&#39;, &#39;authorization&#39;, &#39;sessiontoken&#39;, &#39;apikey&#39;, &#39;accesstoken&#39;, &#39;refreshtoken&#39;, &#39;idtoken&#39;, &#39;clientsecret… |
| STRUCTURAL_KEY | const | 124 | no | const STRUCTURAL_KEY = new Set([&#39;sha256&#39;, &#39;sha1&#39;, &#39;md5&#39;, &#39;digest&#39;, &#39;id&#39;, &#39;namespaceid&#39;, &#39;originalid&#39;, &#39;revision&#39;, &#39;key&#39;, &#39;fingerprint&#39;, &#39;algorithm&#39;, &#39;canonicalization&#39;, &#39;schema&#39;, &#39;kind&#39;, &#39;mode&#39;]); |
| normalizeKey | function | 126 | no | const normalizeKey = (key) =&gt; String(key).toLowerCase().replace(/[^a-z0-9]/g, &#39;&#39;); |
| SECRET_SHAPE | const | 128 | no | const SECRET_SHAPE = /(?:AKIA\|ASIA)[A-Z0-9]{16}\|-----BEGIN(?: [A-Z0-9]+)? PRIVATE KEY-----\|bearer\\s+[A-Za-z0-9._~+/=-]{8,}\|gh[pousr]_[A-Za-z0-9]{36}\|xox[baprs]-[A-Za-z0-9-]{10,}\|ey[A-Za-z0-9_-]{8,}\\.… |
| COOKIE_PAIR | const | 131 | no | const COOKIE_PAIR = /(?:^\|[;,\\s&quot;{])((?:[A-Za-z0-9_.-]*(?:session\|auth\|token\|secret\|csrf\|api_?key)[A-Za-z0-9_.-]*))\\s*=\\s*([^\\s;&quot;&#39;,}{)]{6,})/gi; |
| BENIGN_BLOB | const | 132 | no | const BENIGN_BLOB = /^(?:[a-f0-9]{32,}\|[cnposi]-[A-Za-z0-9-]{16,})$/i; |
| PLACEHOLDER_VALUE | const | 133 | no | const PLACEHOLDER_VALUE = /^(?:null\|true\|false\|none\|undefined\|nan\|redacted\|\\[redacted[^\\]]*\\]\|&lt;[^&gt;]*&gt;\|\\$\\{[^}]*\\}\|x{4,}\|\\*{3,})$/i; |
| scanBundleSecrets | function | 134 | no | const scanBundleSecrets = (payload) =&gt; { |
| limits | const | 135 | no | const limits = EXPORT_SECRET_SCAN_LIMITS, findings = [], seen = new Set(), perLocation = new Map(); |
| state | const | 136 | no | const state = { values: 0, chars: 0, truncated: false }; |
| add | function | 137 | no | const add = (finding) =&gt; { |
| key | const | 139 | no | const key = `${finding.where}\|${finding.rule}\|${finding.field ?? &#39;&#39;}`; |
| count | const | 141 | no | const count = perLocation.get(finding.where) ?? 0; |
| walk | function | 145 | no | const walk = (value, where, context, key, depth) =&gt; { |
| normalized | const | 150 | no | const normalized = key === null ? &#39;&#39; : normalizeKey(key); |
| nameRule | const | 151 | no | const nameRule = normalized !== &#39;&#39; &amp;&amp; SENSITIVE_KEY.has(normalized) &amp;&amp; !PLACEHOLDER_VALUE.test(value.trim()); |
| text | const | 157 | no | const text = value.length &gt; limits.maxValueChars ? value.slice(0, limits.maxValueChars) : value; |
| matched | const | 162 | no | const matched = text.slice(hit.start, hit.end); |
| anonymous | const | 182 | no | const anonymous = { id: null, kind: null }; |
| records | const | 185 | no | const records = Array.isArray(payload.records) ? payload.records : []; |
| byRule | const | 190 | no | const byRule = {}; |
| createWorldTransfer | function | 200 | yes | export function createWorldTransfer({ service }) { |
| partValid | const | 204 | no | const partValid = request === null \|\| request.parts === undefined \|\| (typeof request.parts === &#39;object&#39; &amp;&amp; !Array.isArray(request.parts) &amp;&amp; Object.keys(request.parts ?? {}).every((key) =&gt; [&#39;reasoning… |
| mode | const | 215 | no | const mode = request.mode ?? (request.includeSources ? &#39;full-saved&#39; : &#39;references&#39;); |
| legacyFull | const | 216 | no | const legacyFull = request.mode === undefined &amp;&amp; request.includeSources === true; |
| parts | const | 217 | no | const parts = { reasoning: request.parts?.reasoning ?? legacyFull, toolActivity: request.parts?.toolActivity ?? legacyFull }; |
| keep | const | 218 | no | const keep = mode === &#39;transcript&#39; ? (type) =&gt; TRANSCRIPT_BLOCK.has(type) |
| reduce | const | 221 | no | const reduce = keep ? (data, omitted, id) =&gt; Array.isArray(data.messages) &amp;&amp; reduceMessages(data, keep, omitted, id) : null; |
| selected | const | 222 | no | const selected = [...new Set(request.ids)].sort(), includeSources = mode !== &#39;references&#39;; |
| queue | const | 223 | no | const queue = [...selected], discovered = new Set(queue), records = [], omitted = []; |
| payloadBytes | variable | 225 | no | let payloadBytes = bytes(namespace); |
| omit | function | 226 | no | const omit = (id, reason, aspect = &#39;record&#39;, expected = false) =&gt; omitted.push({ id, reason, aspect, expected }); |
| enqueue | function | 227 | no | const enqueue = (dependencies) =&gt; { |
| id | const | 237 | no | const id = queue[index], [method, kind] = types[id[0]]; |
| data | variable | 238 | no | let data, observed = null, custody = id.startsWith(&#39;c-&#39;) ? &#39;referenced-only&#39; : &#39;user-overlay&#39;; |
| projection | const | 248 | no | const projection = service.conversation(id); |
| derived | const | 257 | no | const derived = service[method](id), stored = service[kind === &#39;selection&#39; ? &#39;storedSelection&#39; : &#39;storedObject&#39;](id); |
| reason | const | 262 | no | const reason = errorReason(error); |
| dependencies | const | 281 | no | const dependencies = kind === &#39;project&#39; ? [...(data.conversationIds ?? []), ...(data.noteIds ?? []), ...(data.memberIds ?? [])] |
| staleObjects | const | 294 | no | const staleObjects = new Set(omitted.filter((item) =&gt; item.reason === &#39;REVISION_CHANGED&#39;).flatMap((item) =&gt; records.filter((record) =&gt; record.id === item.id).map((record) =&gt; record.data.objectId))); |
| staleConversations | const | 295 | no | const staleConversations = new Set(records.filter((record) =&gt; staleObjects.has(record.id)).map((record) =&gt; record.data.conversationId)); |
| index | const | 297 | no | const index = records.findIndex((record) =&gt; record.id === id &amp;&amp; record.custody === &#39;saved-observation&#39;); |
| data | const | 299 | no | const data = service.conversationMetadata(id); records.splice(index, 1); |
| payload | const | 305 | no | const payload = { schema: &#39;vivim.world-export/1&#39;, namespace, |
| bundle | const | 324 | no | const bundle = { ...payload, integrity: { algorithm: &#39;sha256&#39;, canonicalization: &#39;stableStringify&#39;, |
| bundle | const | 332 | no | const bundle = request.bundle, errors = [], unresolved = []; |
| records | const | 340 | no | const records = Array.isArray(bundle?.records) ? bundle.records : []; |
| seen | const | 341 | no | const seen = new Set(); |
| prefix | const | 345 | no | const prefix = { c: &#39;conversation&#39;, p: &#39;project&#39;, n: &#39;note&#39;, o: &#39;source-reference&#39;, s: &#39;selection&#39; }[record?.id?.[0]]; |
| ids | const | 348 | no | const ids = new Set(records.map((record) =&gt; record?.id)); |
| idMap | const | 349 | no | const idMap = {}; |
| rewrite | function | 351 | no | const rewrite = (id) =&gt; { |
| hashed | function | 358 | no | const hashed = (({ observed, sha256, ...stored }) =&gt; stored)(record ?? {}); |
| skipped | const | 364 | no | const skipped = new Set(unresolved.filter((item) =&gt; item.reason === &#39;REFERENCE_ONLY&#39;).map((item) =&gt; item.id)); |
| owner | const | 366 | no | const owner = record?.kind === &#39;selection&#39; ? records.find((item) =&gt; item.id === record.data?.objectId) : null; |
| required | const | 367 | no | const required = record?.kind === &#39;selection&#39; ? [record.data?.objectId, owner?.data?.conversationId].filter(Boolean) : record?.kind === &#39;source-reference&#39; ? [record.data?.conversationId].filter(Boole… |
| omittedNotes | const | 379 | no | const omittedNotes = [], providerUrlSanitized = []; |
| url | const | 381 | no | const url = record?.data?.source &amp;&amp; typeof record.data.source === &#39;object&#39; ? record.data.source.providerUrl : undefined; |
| reason | const | 383 | no | const reason = providerUrlRemovalReason(url); |
| omitted | const | 388 | no | const omitted = list(bundle?.omitted), shownErrors = list(errors); |
| dryRun | const | 392 | no | const dryRun = request.dryRun ?? true; |
| report | const | 394 | no | const report = this.validateBundle({ bundle: request.bundle }); |
| plan | const | 397 | no | const plan = { ...report, dryRun, applied: [], skipped: [], failed: [], pending: report.valid ? request.bundle.records.map((record) =&gt; record.id) : [], partial: report.unresolved.length &gt; 0, receipt:… |
| map | const | 399 | no | const map = report.idMap, rewrite = (values) =&gt; (values ?? []).flatMap((id) =&gt; map[id] ? [map[id]] : []); |
| ordered | const | 400 | no | const ordered = [...request.bundle.records].sort((a, b) =&gt; [&#39;conversation&#39;, &#39;source-reference&#39;, &#39;selection&#39;, &#39;project&#39;, &#39;note&#39;].indexOf(a.kind) - [&#39;conversation&#39;, &#39;source-reference&#39;, &#39;selection&#39;, &#39;pr… |
| blocked | const | 401 | no | const blocked = new Set(); |
| id | const | 403 | no | const id = map[record.id]; |
| owner | const | 404 | no | const owner = record.kind === &#39;selection&#39; ? request.bundle.records.find((item) =&gt; item.id === record.data?.objectId) : null; |
| required | const | 405 | no | const required = record.kind === &#39;selection&#39; ? [record.data?.objectId, owner?.data?.conversationId].filter(Boolean) : record.kind === &#39;source-reference&#39; ? [record.data?.conversationId] : []; |
| existing | const | 408 | no | const existing = service.loadImportRecord(id); |
| importedFrom | const | 409 | no | const importedFrom = { digest: report.digest, originalId: record.id, namespaceId: request.bundle.namespace.id }; |
| data | const | 414 | no | const data = jsonCopy(record.data); |
| messages | const | 426 | no | const messages = data.messages.map((message) =&gt; ({ ...message, source: { ...(message.source ?? {}), kind: &#39;imported-reference&#39;, sessionId: null, originSessionId: message.source?.sessionId ?? null } }… |
| owner | const | 429 | no | const owner = service.object(data.objectId), projection = service.conversation(owner.conversationId); |
| receiptId | const | 442 | no | const receiptId = `i-${report.digest.slice(0, 40)}`; |
| receipt | const | 444 | no | const receipt = { id: receiptId, kind: &#39;import-receipt&#39;, digest: report.digest, skipped: list(plan.skipped), failed: list(plan.failed), unresolved: list(report.unresolved), partial: plan.partial \|\| p… |
| registerWorldTransferRoutes | function | 453 | yes | export function registerWorldTransferRoutes({ add, service }) { |
| transfer | const | 454 | no | const transfer = createWorldTransfer({ service }); |
| guarded | function | 455 | no | const guarded = (fn) =&gt; (args) =&gt; { try { return fn(args); } catch (error) { throw error.status ? error : storeProblem(error); } }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 1 | external |
| ../export/export.mjs | import | 2 | [studio/src/export/export.mjs](../export/export.mjs.md) |
| ../intel/similarity.mjs | import | 3 | [studio/src/intel/similarity.mjs](../intel/similarity.mjs.md) |
| ../security/patterns.mjs | import | 4 | [studio/src/security/patterns.mjs](../security/patterns.mjs.md) |
| ../store/versioned.mjs | import | 5 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ./http.mjs | import | 6 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ./world-relations.mjs | import | 7 | [studio/src/studio/world-relations.mjs](./world-relations.mjs.md) |
| ./world-url.mjs | import | 8 | [studio/src/studio/world-url.mjs](./world-url.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./world-transfer.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { createHash } from 'node:crypto';
import { redactExportValue } from '../export/export.mjs';
import { stableStringify } from '../intel/similarity.mjs';
import { detectSecrets } from '../security/patterns.mjs';
import { validateStoreName } from '../store/versioned.mjs';
import { storeProblem } from './http.mjs';
import { legacySelectionFingerprint } from './world-relations.mjs';
import { sanitizedSource, providerUrlRemovalReason } from './world-url.mjs';

export const WORLD_EXPORT_LIMITS = Object.freeze({ maxSelected: 100, maxRecords: 256,
  maxDependenciesPerRecord: 3000, maxRecordBytes: 2 * 1024 * 1024, maxTotalBytes: 8 * 1024 * 1024 });
export const IMPORT_CONTENT_LIMITS = Object.freeze({ maxMessages: 200, maxBlocks: 200, maxNodes: 2000, maxDepth: 12, maxTextChars: 262144, maxBlockBytes: 512 * 1024, maxErrors: 100, maxDeps: 1000 });
// Bounded scan budget for the export secret check. Findings are warnings with a location, never the
// matched value; nothing is redacted, masked or removed and export is not blocked by a finding.
export const EXPORT_SECRET_SCAN_LIMITS = Object.freeze({ maxChars: 512 * 1024, maxValueChars: 16 * 1024, maxValues: 2048, maxFindings: 40, maxPerLocation: 4 });
const BLOCK_TYPE_RE = /^[a-z][a-z0-9_+#-]{0,63}$/;
const FORBIDDEN_KEY = new Set(['__proto__', 'constructor', 'prototype']);
const fail = (code, message) => Object.assign(new Error(message), { code, status: code === 'WORLD_EXPORT_LIMIT' ? 413 : 400 });
const validId = (id) => typeof id === 'string' && (/^c-(?:[a-f0-9]{40}|i[a-f0-9]{38})$/.test(id)
  || /^[npos]-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)
  || /^[npos]-[a-f0-9]{36}f$/.test(id));
const hash = (value) => createHash('sha256').update(stableStringify(value)).digest('hex');
export const importedConversationId = (id) => typeof id === 'string' && /^c-i[a-f0-9]{38}$/.test(id);
const localId = (digest, id) => id.startsWith('c-') ? `c-i${hash([digest, id]).slice(0, 38)}` : `${id[0]}-${hash([digest, id]).slice(0, 36)}f`;
const contentErrors = (record) => {
  const errors = [], messages = record?.data?.messages, state = { nodes: 0, capped: false };
  const push = (message) => { if (errors.length < IMPORT_CONTENT_LIMITS.maxErrors) errors.push({ id: record.id, code: 'WORLD_IMPORT_CONTENT', message }); };
  const walk = (value, depth) => {
    if (state.nodes >= IMPORT_CONTENT_LIMITS.maxNodes) { if (!state.capped) push('imported content exceeds node budget'); state.capped = true; return; }
    if (depth > IMPORT_CONTENT_LIMITS.maxDepth) { push('imported content exceeds depth'); return; }
    state.nodes++;
    if (typeof value === 'string') { if (value.length > IMPORT_CONTENT_LIMITS.maxTextChars) push('imported string exceeds capture text cap'); return; }
    if (value === null || typeof value !== 'object') { if (['function', 'bigint', 'symbol'].includes(typeof value)) push('imported content contains a non-JSON value'); return; }
    if (Array.isArray(value)) { if (value.length > IMPORT_CONTENT_LIMITS.maxBlocks) push('imported array exceeds block cap'); for (const child of value.slice(0, IMPORT_CONTENT_LIMITS.maxBlocks)) walk(child, depth + 1); return; }
    if (Object.keys(value).some((key) => FORBIDDEN_KEY.has(key))) push('imported content contains a forbidden key');
    if (value.type !== undefined && (typeof value.type !== 'string' || !BLOCK_TYPE_RE.test(value.type))) push('imported block type is invalid');
    if (value.text !== undefined && typeof value.text !== 'string') push('imported block text must be a string');
    for (const child of Object.values(value)) walk(child, depth + 1);
  };
  if (!Array.isArray(messages)) { push('messages must be an array'); return errors; }
  if (messages.length > IMPORT_CONTENT_LIMITS.maxMessages) push('too many messages');
  for (const message of messages.slice(0, IMPORT_CONTENT_LIMITS.maxMessages)) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) { push('message must be an object'); continue; }
    if (typeof message.text !== 'string' || message.text.length > IMPORT_CONTENT_LIMITS.maxTextChars) push('message text must be a bounded string');
    if (typeof message.role !== 'string' || message.role.length > 64) push('message role must be a string of at most 64 characters');
    if (!Array.isArray(message.blocks)) push('message blocks must be an array');
    walk(message, 0);
  }
  return errors;
};
const inspect = (value, depth, seen) => {
  if (depth > IMPORT_CONTENT_LIMITS.maxDepth + 8) throw fail('WORLD_IMPORT_CONTENT', 'bundle exceeds depth');
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) throw fail('WORLD_IMPORT_CONTENT', 'bundle contains a cycle');
  seen.add(value);
  for (const child of Object.values(value)) inspect(child, depth + 1, seen);
};
const bytes = (value) => { inspect(value, 0, new WeakSet()); return Buffer.byteLength(stableStringify(value), 'utf8'); };
const list = (value, limit = 100) => Array.isArray(value) ? value.slice(0, limit) : [];
const dependencies = (record, errors) => ['conversationIds', 'noteIds', 'memberIds', 'commentsOn', 'objectId', 'conversationId'].flatMap((key) => {
  const value = record?.data?.[key];
  if (value === undefined) return [];
  if (['objectId', 'conversationId'].includes(key)) return [value];
  if (!Array.isArray(value)) { errors.push({ id: record?.id ?? null, code: 'WORLD_IMPORT_CONTENT', message: `${key} must be an array` }); return []; }
  if (value.length > IMPORT_CONTENT_LIMITS.maxDeps) errors.push({ id: record.id, code: 'WORLD_IMPORT_CONTENT', message: `${key} exceeds dependency cap` });
  return value.slice(0, IMPORT_CONTENT_LIMITS.maxDeps);
});
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const jsonCopy = (value) => {
  try { return JSON.parse(JSON.stringify(value)); }
  catch { throw fail('WORLD_EXPORT_INVALID_RECORD', 'Service returned a non-JSON record'); }
};
const types = { p: ['project', 'project'], n: ['note', 'note'], o: ['object', 'source-reference'],
  s: ['selection', 'selection'], c: ['conversation', 'conversation'] };
const errorReason = (error) => ({ WORLD_NOT_FOUND: 'SOURCE_OR_OBJECT_MISSING', WORLD_SOURCE_ACTIVE: 'SOURCE_ACTIVE',
  STORE_NO_SUCH_ITEM: 'OBJECT_MISSING', STORE_RECORD_CORRUPT: 'OVERLAY_UNREADABLE', STORE_CURRENT_CORRUPT: 'OVERLAY_UNREADABLE' })[error?.code];
export const EXPORT_MODES = Object.freeze(['references', 'transcript', 'full-saved']);
const REASONING_BLOCK = new Set(['reasoning', 'thinking', 'thought']);
const TOOL_BLOCK = new Set(['tool', 'tool_use', 'tool-use', 'tool-activity', 'function', 'function_call', 'function-call', 'tool_call', 'tool-call', 'status', 'status_activity', 'status-activity']);
const TRANSCRIPT_BLOCK = new Set(['text', 'paragraph', 'heading', 'code', 'table', 'list', 'quote', 'blockquote']);
```

_First 80 of 460 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
