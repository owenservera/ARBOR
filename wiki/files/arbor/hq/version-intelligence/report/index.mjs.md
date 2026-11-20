# File: hq/version-intelligence/report/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/report/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23371 B |
| Lines | 316 |
| Hash | 9e275b4f6df1 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMPARISON_SCHEMA | const | 9 | yes | export const COMPARISON_SCHEMA = &#39;arbor.hvi.version-comparison/1&#39;; |
| REPORT_SCHEMA | const | 10 | yes | export const REPORT_SCHEMA = &#39;arbor.hvi.report/1&#39;; |
| HEX40 | const | 11 | no | const HEX40 = /^[a-f0-9]{40}$/; |
| ID | const | 12 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:/@#-]{0,191}$/; |
| REPO | const | 13 | no | const REPO = /^[a-zA-Z0-9_.-]+\\/[a-zA-Z0-9_.-]+$/; |
| SOURCE_STATES | const | 14 | no | const SOURCE_STATES = new Set([&#39;EXACT_BLOB&#39;, &#39;SAME_PATH_CHANGED&#39;, &#39;EXACT_RELOCATION&#39;, &#39;SPLIT_CANDIDATE&#39;, &#39;COMBINE_CANDIDATE&#39;, &#39;SIMILARITY_CANDIDATE&#39;, &#39;MISSING_AT_TARGET&#39;, &#39;NEW_AT_TARGET&#39;, &#39;UNOBSERVAB… |
| CAPABILITY_STATES | const | 15 | no | const CAPABILITY_STATES = new Set([&#39;PRESENT_EQUIVALENT_CONFIRMED&#39;, &#39;PRESENT_CHANGED&#39;, &#39;IMPORTED_NOT_WIRED&#39;, &#39;SOURCE_WIRED_UNVERIFIED&#39;, &#39;RUNTIME_VERIFIED&#39;, &#39;DESIGN_ONLY&#39;, &#39;RESEARCH_IMPLEMENTED&#39;, &#39;INTE… |
| COMPLETENESS | const | 16 | no | const COMPLETENESS = new Set([&#39;complete&#39;, &#39;partial&#39;, &#39;blocked&#39;, &#39;missing&#39;]); |
| EVIDENCE_TYPES | const | 17 | no | const EVIDENCE_TYPES = new Set([&#39;source_blob&#39;, &#39;source_symbol&#39;, &#39;contract&#39;, &#39;fixture&#39;, &#39;executed_test&#39;, &#39;host_receipt&#39;, &#39;device_receipt&#39;, &#39;owner_decision&#39;]); |
| RECEIPT_STATES | const | 18 | no | const RECEIPT_STATES = new Set([&#39;TEST_EXECUTED&#39;, &#39;UNRUN&#39;, &#39;BLOCKED&#39;, &#39;SOURCE_PRESENT&#39;, &#39;RUNTIME_VERIFIED&#39;]); |
| MAX_PINS | const | 19 | no | const MAX_PINS = 16; |
| MAX_INPUT_ROWS | const | 20 | no | const MAX_INPUT_ROWS = 20_000; |
| MAX_EVIDENCE | const | 21 | no | const MAX_EVIDENCE = 20_000; |
| MAX_PAGE | const | 22 | no | const MAX_PAGE = 200; |
| MAX_PLAN | const | 23 | no | const MAX_PLAN = 100; |
| MAX_TEXT | const | 24 | no | const MAX_TEXT = 240; |
| UNSAFE | const | 27 | no | const UNSAFE = /(?:^\|\\/)(?:\\.git\|\\.ssh\|\\.env[^/]*\|\\.npmrc\|\\.netrc\|secrets?\|credentials?\|tokens?\|private\|personal\|profiles?\|sessions?\|cookies?\|login[ -]?data\|storage-state\\.json\|release-profile\\.json)… |
| problem | function | 29 | no | function problem(code, detail) { |
| error | const | 30 | no | const error = new Error(`HVI_REPORT_${code}: ${detail}`); |
| object | function | 34 | no | function object(value, where) { |
| ascii | function | 38 | no | function ascii(value, max = MAX_TEXT) { |
| identifier | function | 42 | no | function identifier(value, where) { |
| path | function | 46 | no | function path(value) { |
| sha | function | 50 | no | function sha(value, where) { |
| repoName | function | 54 | no | function repoName(value) { |
| raw | const | 55 | no | const raw = typeof value === &#39;string&#39; ? value : (value &amp;&amp; typeof value.repository === &#39;string&#39; ? value.repository : undefined); |
| canonical | function | 59 | no | function canonical(value) { |
| digest | function | 64 | no | function digest(value) { return createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(value))).digest(&#39;hex&#39;); } |
| arr | function | 65 | no | function arr(value, name, limit = MAX_INPUT_ROWS) { |
| stringEnum | function | 70 | no | function stringEnum(value, allowed, defaultValue = &#39;UNKNOWN&#39;) { |
| lineRange | function | 73 | no | function lineRange(value) { |
| start | const | 75 | no | const start = Array.isArray(value) ? value[0] : value?.start; |
| safeEvidence | function | 80 | no | function safeEvidence(row) { |
| id | const | 82 | no | const id = identifier(row.id, &#39;evidenceIndex.id&#39;); |
| revision | const | 84 | no | const revision = HEX40.test(row.commitSha ?? row.sha) ? (row.commitSha ?? row.sha) : null; |
| blob | const | 85 | no | const blob = HEX40.test(row.blobSha) ? row.blobSha : null; |
| location | const | 86 | no | const location = row.path === undefined ? null : path(row.path); |
| line | const | 87 | no | const line = lineRange(row.lines ?? row.line); |
| complete | const | 89 | no | const complete = Boolean(type &amp;&amp; revision &amp;&amp; location &amp;&amp; location !== &#39;[REDACTED]&#39; &amp;&amp; (type !== &#39;source_blob&#39; \|\| blob)); |
| finding | function | 92 | no | function finding(row, kind, pinMap, evidenceMap) { |
| id | const | 94 | no | const id = identifier(row.id, &#39;finding.id&#39;); |
| allowed | const | 95 | no | const allowed = kind === &#39;source&#39; ? SOURCE_STATES : CAPABILITY_STATES; |
| category | const | 96 | no | const category = stringEnum(row.category ?? row.state ?? row.classification, allowed, kind === &#39;source&#39; ? &#39;UNOBSERVABLE&#39; : &#39;UNKNOWN&#39;); |
| pinId | const | 97 | no | const pinId = row.sourcePinId ?? row.originPinId ?? null; |
| targetPinId | const | 99 | no | const targetPinId = row.targetPinId ?? null; |
| rawEvidence | const | 101 | no | const rawEvidence = arr(row.evidenceRefs ?? row.evidence_refs, `evidenceRefs:${id}`, 32); |
| evidenceRefs | const | 102 | no | const evidenceRefs = [...new Set(rawEvidence.map(ref =&gt; identifier(ref, &#39;finding.evidenceRef&#39;)))].sort(); |
| missingEvidence | const | 103 | no | const missingEvidence = evidenceRefs.filter(ref =&gt; !evidenceMap.has(ref) \|\| !evidenceMap.get(ref).complete); |
| confidence | const | 104 | no | const confidence = typeof row.similarityConfidence === &#39;number&#39; &amp;&amp; Number.isFinite(row.similarityConfidence) &amp;&amp; row.similarityConfidence &gt;= 0 &amp;&amp; row.similarityConfidence &lt;= 1 ? row.similarityConfiden… |
| certainty | const | 105 | no | const certainty = [&#39;confirmed&#39;, &#39;candidate&#39;, &#39;uncertain&#39;, &#39;unknown&#39;].includes(row.certainty) ? row.certainty : &#39;unknown&#39;; |
| sourcePath | const | 106 | no | const sourcePath = path(row.sourcePath ?? row.origin_path ?? row.path ?? &#39;[unprovided]&#39;); |
| targetPaths | const | 107 | no | const targetPaths = arr(row.targetPaths ?? row.target_path, &#39;targetPaths&#39;, 16).map(path).sort(); |
| owner | const | 108 | no | const owner = ascii(row.owner ?? &#39;[unassigned]&#39;, 100); |
| snapshotStates | const | 109 | no | const snapshotStates = row.pinStates ?? row.statesByPin ?? {}; |
| states | const | 111 | no | const states = {}; |
| value | const | 114 | no | const value = typeof snapshotStates[pinKey] === &#39;string&#39; ? snapshotStates[pinKey] : snapshotStates[pinKey]?.state; |
| proposedReplacement | const | 118 | no | const proposedReplacement = row.decision === &#39;REPLACED_CONFIRMED&#39;; |
| replacementProven | const | 119 | no | const replacementProven = proposedReplacement &amp;&amp; evidenceRefs.some(ref =&gt; evidenceMap.get(ref)?.type === &#39;owner_decision&#39; &amp;&amp; evidenceMap.get(ref)?.complete); |
| effectiveCategory | variable | 120 | no | let effectiveCategory = category; |
| affected | const | 121 | no | const affected = pinId ? pinMap.get(pinId) : null; |
| validateVersionComparison | function | 135 | yes | export function validateVersionComparison(value) { |
| comparison | const | 136 | no | const comparison = object(value, &#39;VersionComparison&#39;); |
| pinsRaw | const | 138 | no | const pinsRaw = arr(comparison.sourcePins, &#39;sourcePins&#39;, MAX_PINS); |
| pinMap | const | 140 | no | const pinMap = new Map(); |
| digestByRevision | const | 141 | no | const digestByRevision = new Map(); |
| pinId | const | 144 | no | const pinId = identifier(row.pinId, &#39;sourcePins.pinId&#39;); |
| repoIdentity | const | 146 | no | const repoIdentity = repoName(row.repoIdentity ?? row.repo); |
| resolvedCommitSha | const | 147 | no | const resolvedCommitSha = sha(row.resolvedCommitSha, &#39;sourcePins.resolvedCommitSha&#39;); |
| completeness | const | 148 | no | const completeness = stringEnum(row.completeness, COMPLETENESS, &#39;blocked&#39;); |
| manifestDigest | const | 149 | no | const manifestDigest = row.manifestDigest === undefined ? null : (/^[a-f0-9]{64}$/.test(row.manifestDigest) ? row.manifestDigest : problem(&#39;INVALID_DIGEST&#39;, pinId)); |
| key | const | 150 | no | const key = `${repoIdentity}:${resolvedCommitSha}`; |
| targetPinId | const | 155 | no | const targetPinId = identifier(comparison.targetPinId, &#39;targetPinId&#39;); |
| evidenceRaw | const | 157 | no | const evidenceRaw = arr(comparison.evidenceIndex, &#39;evidenceIndex&#39;, MAX_EVIDENCE); |
| evidenceMap | const | 158 | no | const evidenceMap = new Map(); |
| e | const | 160 | no | const e = safeEvidence(raw); |
| sources | const | 164 | no | const sources = arr(comparison.sourceDeltas, &#39;sourceDeltas&#39;).map(x =&gt; finding(x, &#39;source&#39;, pinMap, evidenceMap)); |
| capabilities | const | 165 | no | const capabilities = arr(comparison.capabilityDeltas, &#39;capabilityDeltas&#39;).map(x =&gt; finding(x, &#39;capability&#39;, pinMap, evidenceMap)); |
| ids | const | 166 | no | const ids = new Set(); |
| key | const | 168 | no | const key = `${row.kind}:${row.id}`; |
| receipts | const | 172 | no | const receipts = arr(comparison.runtimeProof, &#39;runtimeProof&#39;, 1000).map(x =&gt; { object(x, &#39;runtimeProof[]&#39;); return { id: identifier(x.id, &#39;runtimeProof.id&#39;), state: stringEnum(x.state ?? x.status, RE… |
| PRIORITY | const | 185 | no | const PRIORITY = { BLOCKED: &#39;P0&#39;, MISSING_AT_TARGET: &#39;P1&#39;, IMPORTED_NOT_WIRED: &#39;P1&#39;, SOURCE_WIRED_UNVERIFIED: &#39;P1&#39;, SPLIT_CANDIDATE: &#39;P1&#39;, COMBINE_CANDIDATE: &#39;P1&#39;, SIMILARITY_CANDIDATE: &#39;P1&#39;, UNOBSER… |
| ACTION | const | 186 | no | const ACTION = { |
| RANK | const | 201 | no | const RANK = { P0: 0, P1: 1, P2: 2 }; |
| markdown | function | 202 | no | function markdown(value) { return ascii(String(value), 1024).replace(/[\\\\`*_{}\\[\\]()#+.!\|&lt;&gt;-]/g, &#39;\\\\$&amp;&#39;); } |
| csv | function | 203 | no | function csv(value) { |
| v | const | 204 | no | const v = ascii(String(value ?? &#39;&#39;), 1024); |
| projectVersionComparison | function | 209 | yes | export function projectVersionComparison(comparison, options = {}) { |
| source | const | 210 | no | const source = validateVersionComparison(comparison); |
| offset | const | 212 | no | const offset = Number.isSafeInteger(options.offset) &amp;&amp; options.offset &gt;= 0 ? options.offset : 0; |
| limit | const | 213 | no | const limit = Number.isSafeInteger(options.limit) &amp;&amp; options.limit &gt;= 1 ? Math.min(options.limit, MAX_PAGE) : 50; |
| coverageFilter | const | 214 | no | const coverageFilter = [&#39;all&#39;, &#39;complete&#39;, &#39;incomplete&#39;].includes(options.coverageFilter) ? options.coverageFilter : &#39;all&#39;; |
| selected | const | 215 | no | const selected = source.findings.filter(x =&gt; coverageFilter === &#39;all&#39; \|\| (coverageFilter === &#39;complete&#39; ? !x.coverageIncomplete : x.coverageIncomplete)); |
| page | const | 216 | no | const page = selected.slice(offset, offset + limit); |
| summary | const | 217 | no | const summary = { totalFindings: source.findings.length, selectedFindings: selected.length, |
| pins | const | 227 | no | const pins = source.pins.map(pin =&gt; ({ ...pin, column: `${pin.repoIdentity}@${pin.resolvedCommitSha.slice(0, 12)}` })); |
| rows | const | 228 | no | const rows = page.map(x =&gt; ({ id: x.id, kind: x.kind, path: x.path, sourceBlob: x.sourceBlob, sourceLines: x.sourceLines, targetPaths: x.targetPaths, sourcePinId: x.sourcePinId, classification: x.cat… |
| mergePlan | const | 234 | no | const mergePlan = source.findings.filter(x =&gt; PRIORITY[x.category]).map(x =&gt; ({ findingId: x.id, kind: x.kind, priority: PRIORITY[x.category], owner: x.owner, classification: x.category, recommendati… |
| evidenceReferenced | const | 239 | no | const evidenceReferenced = new Set(page.flatMap(x =&gt; x.evidenceRefs)); |
| evidenceIndex | const | 240 | no | const evidenceIndex = source.evidence.filter(x =&gt; evidenceReferenced.has(x.id)); |
| result | const | 241 | no | const result = { |
| toMigrationMarkdown | function | 263 | yes | export function toMigrationMarkdown(report) { |
| lines | const | 265 | no | const lines = [ |
| toReviewCsv | function | 293 | yes | export function toReviewCsv(report) { |
| headers | const | 295 | no | const headers = [&#39;kind&#39;, &#39;id&#39;, &#39;source_pin&#39;, &#39;source_sha&#39;, &#39;path&#39;, &#39;lines&#39;, &#39;source_blob&#39;, &#39;target_paths&#39;, &#39;classification&#39;, &#39;migration_category&#39;, &#39;certainty&#39;, &#39;similarity_confidence&#39;, &#39;owner&#39;, &#39;evid… |
| byPin | const | 296 | no | const byPin = new Map(report.pins.map(x =&gt; [x.pinId, x])); |
| lines | const | 297 | no | const lines = [headers.map(csv).join(&#39;,&#39;)]; |
| pin | const | 299 | no | const pin = byPin.get(row.sourcePinId); |
| exportVersionComparison | function | 307 | yes | export function exportVersionComparison(comparison, { format = &#39;json&#39;, ...options } = {}) { |
| report | const | 308 | no | const report = projectVersionComparison(comparison, options); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/version-intelligence/integration/comparison-report-adapter.mjs](../integration/comparison-report-adapter.mjs.md) | ../report/index.mjs |
| [hq/version-intelligence/report/test/benchmark.mjs](./test/benchmark.mjs.md) | ../index.mjs |
| [hq/version-intelligence/report/test/generate-samples.mjs](./test/generate-samples.mjs.md) | ../index.mjs |
| [hq/version-intelligence/report/test/report.test.mjs](./test/report.test.mjs.md) | ../index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * ARBOR HVI E — pure, deterministic, read-only report projection.
 * Consumer of the N-way VersionComparison envelope; does not scan, grant,
 * execute, send, persist, publish, or certify any runtime effect.
 * No imports from other unmerged lanes; G1 owns the eventual schema adapter.
 */
import { createHash } from 'node:crypto';

export const COMPARISON_SCHEMA = 'arbor.hvi.version-comparison/1';
export const REPORT_SCHEMA = 'arbor.hvi.report/1';
const HEX40 = /^[a-f0-9]{40}$/;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:/@#-]{0,191}$/;
const REPO = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
const SOURCE_STATES = new Set(['EXACT_BLOB', 'SAME_PATH_CHANGED', 'EXACT_RELOCATION', 'SPLIT_CANDIDATE', 'COMBINE_CANDIDATE', 'SIMILARITY_CANDIDATE', 'MISSING_AT_TARGET', 'NEW_AT_TARGET', 'UNOBSERVABLE']);
const CAPABILITY_STATES = new Set(['PRESENT_EQUIVALENT_CONFIRMED', 'PRESENT_CHANGED', 'IMPORTED_NOT_WIRED', 'SOURCE_WIRED_UNVERIFIED', 'RUNTIME_VERIFIED', 'DESIGN_ONLY', 'RESEARCH_IMPLEMENTED', 'INTENTIONALLY_EXCLUDED', 'BLOCKED', 'UNKNOWN']);
const COMPLETENESS = new Set(['complete', 'partial', 'blocked', 'missing']);
const EVIDENCE_TYPES = new Set(['source_blob', 'source_symbol', 'contract', 'fixture', 'executed_test', 'host_receipt', 'device_receipt', 'owner_decision']);
const RECEIPT_STATES = new Set(['TEST_EXECUTED', 'UNRUN', 'BLOCKED', 'SOURCE_PRESENT', 'RUNTIME_VERIFIED']);
const MAX_PINS = 16;
const MAX_INPUT_ROWS = 20_000;
const MAX_EVIDENCE = 20_000;
const MAX_PAGE = 200;
const MAX_PLAN = 100;
const MAX_TEXT = 240;
// This projection always omits private or likely credential-bearing path metadata;
// it never copies source file content, test stdout or arbitrary prose.
const UNSAFE = /(?:^|\/)(?:\.git|\.ssh|\.env[^/]*|\.npmrc|\.netrc|secrets?|credentials?|tokens?|private|personal|profiles?|sessions?|cookies?|login[ -]?data|storage-state\.json|release-profile\.json)(?:\/|$)|(?:\.pem|\.p12|\.pfx|\.key|\.keystore)$|(?:bearer|api[_-]?key|password|secret|access[_-]?token|refresh[_-]?token)[=:]/i;

function problem(code, detail) {
  const error = new Error(`HVI_REPORT_${code}: ${detail}`);
  error.code = code;
  throw error;
}
function object(value, where) {
  if (!value || Array.isArray(value) || typeof value !== 'object') problem('INVALID_INPUT', where);
  return value;
}
function ascii(value, max = MAX_TEXT) {
  if (typeof value !== 'string' || !value.length || value.length > max || UNSAFE.test(value) || /[^\x20-\x7e]/.test(value) || /[<>\\`\[\]{}|*!~$=%?&"']/.test(value)) return '[REDACTED]';
  return value;
}
function identifier(value, where) {
  if (typeof value !== 'string' || !ID.test(value) || UNSAFE.test(value)) problem('INVALID_ID', where);
  return value;
}
function path(value) {
  if (typeof value !== 'string' || value.length > 512 || value.length === 0 || value.startsWith('/') || value.includes('\\') || value.split('/').some(x => !x || x === '.' || x === '..') || UNSAFE.test(value) || /[^\x20-\x7e]|[<>`|\[\]{}*!~$=%?&"']/.test(value)) return '[REDACTED]';
  return value;
}
function sha(value, where) {
  if (!HEX40.test(value)) problem('INVALID_SHA', where);
  return value;
}
function repoName(value) {
  const raw = typeof value === 'string' ? value : (value && typeof value.repository === 'string' ? value.repository : undefined);
  if (typeof raw !== 'string' || !REPO.test(raw)) problem('INVALID_REPO', 'sourcePins.repoIdentity');
  return raw;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
function digest(value) { return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex'); }
function arr(value, name, limit = MAX_INPUT_ROWS) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > limit) problem('RESOURCE_LIMIT', name);
  return value;
}
function stringEnum(value, allowed, defaultValue = 'UNKNOWN') {
  return allowed.has(value) ? value : defaultValue;
}
function lineRange(value) {
  if (Number.isInteger(value) && value > 0 && value <= 10_000_000) return String(value);
  const start = Array.isArray(value) ? value[0] : value?.start;
  const end = Array.isArray(value) ? value[1] : value?.end;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > 10_000_000) return null;
  return String(start) + '-' + String(end);
}
function safeEvidence(row) {
```

_First 80 of 317 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
