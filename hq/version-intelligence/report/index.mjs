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
  object(row, 'evidenceIndex[]');
  const id = identifier(row.id, 'evidenceIndex.id');
  const type = EVIDENCE_TYPES.has(row.type) ? row.type : null;
  const revision = HEX40.test(row.commitSha ?? row.sha) ? (row.commitSha ?? row.sha) : null;
  const blob = HEX40.test(row.blobSha) ? row.blobSha : null;
  const location = row.path === undefined ? null : path(row.path);
  const line = lineRange(row.lines ?? row.line);
  // A receipt reference without its attesting source is not complete evidence.
  const complete = Boolean(type && revision && location && location !== '[REDACTED]' && (type !== 'source_blob' || blob));
  return { id, type: type ?? 'unverified', commitSha: revision, path: location, blobSha: blob, lines: line, complete };
}
function finding(row, kind, pinMap, evidenceMap) {
  object(row, `${kind}Deltas[]`);
  const id = identifier(row.id, 'finding.id');
  const allowed = kind === 'source' ? SOURCE_STATES : CAPABILITY_STATES;
  const category = stringEnum(row.category ?? row.state ?? row.classification, allowed, kind === 'source' ? 'UNOBSERVABLE' : 'UNKNOWN');
  const pinId = row.sourcePinId ?? row.originPinId ?? null;
  if (pinId !== null && !pinMap.has(pinId)) problem('UNKNOWN_PIN', id);
  const targetPinId = row.targetPinId ?? null;
  if (targetPinId !== null && !pinMap.has(targetPinId)) problem('UNKNOWN_PIN', id);
  const rawEvidence = arr(row.evidenceRefs ?? row.evidence_refs, `evidenceRefs:${id}`, 32);
  const evidenceRefs = [...new Set(rawEvidence.map(ref => identifier(ref, 'finding.evidenceRef')))].sort();
  const missingEvidence = evidenceRefs.filter(ref => !evidenceMap.has(ref) || !evidenceMap.get(ref).complete);
  const confidence = typeof row.similarityConfidence === 'number' && Number.isFinite(row.similarityConfidence) && row.similarityConfidence >= 0 && row.similarityConfidence <= 1 ? row.similarityConfidence : null;
  const certainty = ['confirmed', 'candidate', 'uncertain', 'unknown'].includes(row.certainty) ? row.certainty : 'unknown';
  const sourcePath = path(row.sourcePath ?? row.origin_path ?? row.path ?? '[unprovided]');
  const targetPaths = arr(row.targetPaths ?? row.target_path, 'targetPaths', 16).map(path).sort();
  const owner = ascii(row.owner ?? '[unassigned]', 100);
  const snapshotStates = row.pinStates ?? row.statesByPin ?? {};
  object(snapshotStates, 'finding.pinStates');
  const states = {};
  for (const pinKey of Object.keys(snapshotStates).sort()) {
    if (!pinMap.has(pinKey)) problem('UNKNOWN_PIN', `pinStates:${pinKey}`);
    const value = typeof snapshotStates[pinKey] === 'string' ? snapshotStates[pinKey] : snapshotStates[pinKey]?.state;
    states[pinKey] = stringEnum(value, allowed, kind === 'source' ? 'UNOBSERVABLE' : 'UNKNOWN');
  }
  if (pinId && !Object.hasOwn(states, pinId)) states[pinId] = category;
  const proposedReplacement = row.decision === 'REPLACED_CONFIRMED';
  const replacementProven = proposedReplacement && evidenceRefs.some(ref => evidenceMap.get(ref)?.type === 'owner_decision' && evidenceMap.get(ref)?.complete);
  let effectiveCategory = category;
  const affected = pinId ? pinMap.get(pinId) : null;
  // Incomplete source evidence can never be depicted as a known absence.
  if ((affected && affected.completeness !== 'complete') && (category === 'MISSING_AT_TARGET' || category === 'INTENTIONALLY_EXCLUDED')) effectiveCategory = kind === 'source' ? 'UNOBSERVABLE' : 'UNKNOWN';
  if (pinId && affected?.completeness !== 'complete') states[pinId] = effectiveCategory;
  return { id, kind, category: effectiveCategory, rawCategory: category, sourcePinId: pinId,
    targetPinId, path: sourcePath, targetPaths, owner, certainty, similarityConfidence: confidence,
    evidenceRefs, evidenceComplete: evidenceRefs.length > 0 && missingEvidence.length === 0,
    missingEvidence, sourceBlob: HEX40.test(row.sourceBlob ?? row.origin_blob) ? (row.sourceBlob ?? row.origin_blob) : null,
    sourceLines: lineRange(row.sourceLines ?? row.lines), states,
    migrationCategory: replacementProven ? 'replaced_confirmed' : proposedReplacement ? 'replacement_unverified' : ({ EXACT_RELOCATION: 'relocated', SPLIT_CANDIDATE: 'split_candidate', COMBINE_CANDIDATE: 'combine_candidate', MISSING_AT_TARGET: 'missing_path', SAME_PATH_CHANGED: 'modified', NEW_AT_TARGET: 'added', INTENTIONALLY_EXCLUDED: 'intentionally_excluded' }[effectiveCategory] ?? 'other'),
    coverageIncomplete: affected?.completeness !== 'complete' || evidenceRefs.length === 0 || missingEvidence.length > 0 };
}

/** Validate pins and normalize only explicitly allowed metadata; no source content. */
export function validateVersionComparison(value) {
  const comparison = object(value, 'VersionComparison');
  if (comparison.schema !== COMPARISON_SCHEMA) problem('SCHEMA_MISMATCH', `expected ${COMPARISON_SCHEMA}`);
  const pinsRaw = arr(comparison.sourcePins, 'sourcePins', MAX_PINS);
  if (pinsRaw.length < 2 || pinsRaw.length > MAX_PINS) problem('PIN_COUNT', 'expected 2..16 pins');
  const pinMap = new Map();
  const digestByRevision = new Map();
  for (const row of pinsRaw) {
    object(row, 'sourcePins[]');
    const pinId = identifier(row.pinId, 'sourcePins.pinId');
    if (pinMap.has(pinId)) problem('DUPLICATE_PIN', pinId);
    const repoIdentity = repoName(row.repoIdentity ?? row.repo);
    const resolvedCommitSha = sha(row.resolvedCommitSha, 'sourcePins.resolvedCommitSha');
    const completeness = stringEnum(row.completeness, COMPLETENESS, 'blocked');
    const manifestDigest = row.manifestDigest === undefined ? null : (/^[a-f0-9]{64}$/.test(row.manifestDigest) ? row.manifestDigest : problem('INVALID_DIGEST', pinId));
    const key = `${repoIdentity}:${resolvedCommitSha}`;
    if (digestByRevision.has(key) && digestByRevision.get(key) !== manifestDigest) problem('DIGEST_CONFLICT', key);
    digestByRevision.set(key, manifestDigest);
    pinMap.set(pinId, { pinId, repoIdentity, resolvedCommitSha, completeness, manifestDigest });
  }
  const targetPinId = identifier(comparison.targetPinId, 'targetPinId');
  if (!pinMap.has(targetPinId)) problem('UNKNOWN_TARGET', targetPinId);
  const evidenceRaw = arr(comparison.evidenceIndex, 'evidenceIndex', MAX_EVIDENCE);
  const evidenceMap = new Map();
  for (const raw of evidenceRaw) {
    const e = safeEvidence(raw);
    if (evidenceMap.has(e.id)) problem('DUPLICATE_EVIDENCE', e.id);
    evidenceMap.set(e.id, e);
  }
  const sources = arr(comparison.sourceDeltas, 'sourceDeltas').map(x => finding(x, 'source', pinMap, evidenceMap));
  const capabilities = arr(comparison.capabilityDeltas, 'capabilityDeltas').map(x => finding(x, 'capability', pinMap, evidenceMap));
  const ids = new Set();
  for (const row of [...sources, ...capabilities]) {
    const key = `${row.kind}:${row.id}`;
    if (ids.has(key)) problem('DUPLICATE_FINDING', key);
    ids.add(key);
  }
  const receipts = arr(comparison.runtimeProof, 'runtimeProof', 1000).map(x => {
    object(x, 'runtimeProof[]');
    return { id: identifier(x.id, 'runtimeProof.id'), state: stringEnum(x.state ?? x.status, RECEIPT_STATES, 'UNRUN'),
      exitCode: Number.isInteger(x.exitCode) && x.exitCode >= 0 && x.exitCode <= 255 ? x.exitCode : null,
      // Presence of a test file is not test execution; report the provenance claim only.
      hasCommandReceipt: typeof x.command === 'string' && x.command.length > 0 && x.command.length <= 256,
      provenance: x.attestation === true ? 'reported_attested' : 'unverified_claim' };
  });
  return { schema: COMPARISON_SCHEMA, targetPinId, pins: [...pinMap.values()].sort((a, b) => a.pinId.localeCompare(b.pinId, 'en')),
    evidence: [...evidenceMap.values()].sort((a, b) => a.id.localeCompare(b.id, 'en')),
    findings: [...sources, ...capabilities].sort((a, b) => a.kind.localeCompare(b.kind, 'en') || a.id.localeCompare(b.id, 'en')),
    receipts: receipts.sort((a, b) => a.id.localeCompare(b.id, 'en')) };
}
const PRIORITY = { BLOCKED: 'P0', MISSING_AT_TARGET: 'P1', IMPORTED_NOT_WIRED: 'P1', SOURCE_WIRED_UNVERIFIED: 'P1', SPLIT_CANDIDATE: 'P1', COMBINE_CANDIDATE: 'P1', SIMILARITY_CANDIDATE: 'P1', UNOBSERVABLE: 'P1', UNKNOWN: 'P1', RESEARCH_IMPLEMENTED: 'P2', DESIGN_ONLY: 'P2', SAME_PATH_CHANGED: 'P2', PRESENT_CHANGED: 'P2' };
const ACTION = {
  BLOCKED: 'Resolve blocker with owner and evidence; no promotion',
  MISSING_AT_TARGET: 'Investigate lineage before calling capability unported',
  UNOBSERVABLE: 'Complete source scan and corroborate provenance',
  UNKNOWN: 'Investigate unknown state; do not infer deletion',
  SPLIT_CANDIDATE: 'Require owner review of split lineage',
  COMBINE_CANDIDATE: 'Require owner review of combined lineage',
  SIMILARITY_CANDIDATE: 'Similarity is not equivalence; obtain owner decision',
  IMPORTED_NOT_WIRED: 'Verify integration wiring and read receipts',
  SOURCE_WIRED_UNVERIFIED: 'Obtain executed tests and runtime receipt',
  RESEARCH_IMPLEMENTED: 'Review candidate; research is not installed product',
  DESIGN_ONLY: 'Retain as design; no runtime claim',
  SAME_PATH_CHANGED: 'Review source delta and tests',
  PRESENT_CHANGED: 'Review semantic differences and tests'
};
const RANK = { P0: 0, P1: 1, P2: 2 };
function markdown(value) { return ascii(String(value), 1024).replace(/[\\`*_{}\[\]()#+.!|<>-]/g, '\\$&'); }
function csv(value) {
  const v = ascii(String(value ?? ''), 1024);
  return `"${(/^[=+@\-]/.test(v) ? "'" : '') + v.replace(/"/g, '""')}\"`;
}

/** Pure projection: no IO, no clock, no filesystem, no external owner imports. */
export function projectVersionComparison(comparison, options = {}) {
  const source = validateVersionComparison(comparison);
  object(options, 'options');
  const offset = Number.isSafeInteger(options.offset) && options.offset >= 0 ? options.offset : 0;
  const limit = Number.isSafeInteger(options.limit) && options.limit >= 1 ? Math.min(options.limit, MAX_PAGE) : 50;
  const coverageFilter = ['all', 'complete', 'incomplete'].includes(options.coverageFilter) ? options.coverageFilter : 'all';
  const selected = source.findings.filter(x => coverageFilter === 'all' || (coverageFilter === 'complete' ? !x.coverageIncomplete : x.coverageIncomplete));
  const page = selected.slice(offset, offset + limit);
  const summary = { totalFindings: source.findings.length, selectedFindings: selected.length,
    sourceFindings: source.findings.filter(x => x.kind === 'source').length,
    capabilityFindings: source.findings.filter(x => x.kind === 'capability').length,
    incompleteFindings: source.findings.filter(x => x.coverageIncomplete).length,
    missingAtTargetSource: source.findings.filter(x => x.category === 'MISSING_AT_TARGET').length,
    relocatedSource: source.findings.filter(x => x.category === 'EXACT_RELOCATION').length,
    splitCandidates: source.findings.filter(x => x.category === 'SPLIT_CANDIDATE').length,
    intentionallyExcluded: source.findings.filter(x => x.category === 'INTENTIONALLY_EXCLUDED').length,
    replacedConfirmed: source.findings.filter(x => x.migrationCategory === 'replaced_confirmed').length,
    runtimeVerifiedClaims: source.receipts.filter(x => x.state === 'RUNTIME_VERIFIED').length };
  const pins = source.pins.map(pin => ({ ...pin, column: `${pin.repoIdentity}@${pin.resolvedCommitSha.slice(0, 12)}` }));
  const rows = page.map(x => ({ id: x.id, kind: x.kind, path: x.path, sourceBlob: x.sourceBlob,
    sourceLines: x.sourceLines, targetPaths: x.targetPaths, sourcePinId: x.sourcePinId,
    classification: x.category, migrationCategory: x.migrationCategory, certainty: x.certainty, similarityConfidence: x.similarityConfidence,
    owner: x.owner, evidenceRefs: x.evidenceRefs, evidenceComplete: x.evidenceComplete,
    completeness: x.coverageIncomplete ? 'incomplete' : 'complete',
    cells: Object.fromEntries(pins.map(pin => [pin.pinId, pin.completeness === 'complete' ? (x.states[pin.pinId] ?? 'UNOBSERVED') : 'UNOBSERVED'])) }));
  const mergePlan = source.findings.filter(x => PRIORITY[x.category]).map(x => ({
    findingId: x.id, kind: x.kind, priority: PRIORITY[x.category], owner: x.owner,
    classification: x.category, recommendation: ACTION[x.category], decision: 'OWNER_REVIEW_REQUIRED',
    evidenceComplete: x.evidenceComplete
  })).sort((a, b) => RANK[a.priority] - RANK[b.priority] || a.findingId.localeCompare(b.findingId, 'en'));
  const evidenceReferenced = new Set(page.flatMap(x => x.evidenceRefs));
  const evidenceIndex = source.evidence.filter(x => evidenceReferenced.has(x.id));
  const result = {
    schema: REPORT_SCHEMA, targetPinId: source.targetPinId, pins, summary,
    coverage: { filter: coverageFilter, completePins: pins.filter(x => x.completeness === 'complete').length,
      incompletePins: pins.filter(x => x.completeness !== 'complete').map(x => x.pinId),
      completeness: summary.incompleteFindings === 0 && pins.every(x => x.completeness === 'complete') ? 'complete_source_evidence' : 'incomplete_source_evidence',
      missingEvidenceRefs: [...new Set(page.flatMap(x => x.evidenceRefs.filter(ref => !source.evidence.find(e => e.id === ref && e.complete))))].sort() },
    table: { total: selected.length, offset, limit, returned: rows.length, hasMore: offset + rows.length < selected.length,
      truncated: selected.length > rows.length, rows },
    mergePlan: { total: mergePlan.length, returned: Math.min(mergePlan.length, MAX_PLAN),
      truncated: mergePlan.length > MAX_PLAN, rows: mergePlan.slice(0, MAX_PLAN) },
    evidenceIndex,
    receiptStates: source.receipts,
    runtimeAcceptance: 'NOT_DETERMINED_BY_SOURCE_REPORT',
    limits: { maxPins: MAX_PINS, maxInputRows: MAX_INPUT_ROWS, maxPage: MAX_PAGE, maxPlan: MAX_PLAN, evidencePageScoped: true },
    notes: ['UNOBSERVED means no confirmed state for a pinned snapshot, not absence',
      'Evidence metadata is projection only; no file contents, test stdout or permission grants',
      'Runtime acceptance requires independent Host/device gate and verified receipts']
  };
  return { ...result, reproducibilityDigest: digest(result) };
}

/** Deterministic user-readable projection, escaped and length bounded by the page. */
export function toMigrationMarkdown(report) {
  if (report?.schema !== REPORT_SCHEMA) problem('INVALID_REPORT', 'Markdown exporter');
  const lines = [
    '# ARBOR HQ Version Migration Report',
    '', `**Target:** ${markdown(report.targetPinId)}  **Status:** SOURCE-ONLY / NOT RUNTIME ACCEPTED`, '',
    `Findings: ${report.summary.totalFindings}; page ${report.table.offset + 1}–${report.table.offset + report.table.returned} of ${report.table.total}.`,
    `Evidence completeness: **${markdown(report.coverage.completeness)}**. Incomplete findings: ${report.summary.incompleteFindings}.`,
    `Page truncated: **${report.table.truncated}**; further pages: **${report.table.hasMore}**.`, '',
    '## Pinned snapshots', '', '| Pin | Repository | Immutable commit | Scan |', '|---|---|---|---|',
    ...report.pins.map(x => `| ${markdown(x.pinId)} | ${markdown(x.repoIdentity)} | \`${x.resolvedCommitSha}\` | ${x.completeness} |`),
    '', '## N-way compact matrix', '',
    `| Kind / ID | Target-relative finding | ${report.pins.map(x => markdown(x.pinId)).join(' | ')} |`,
    `|---|---|${report.pins.map(() => '---|').join('')}`,
    ...report.table.rows.map(x => `| ${markdown(x.kind + ':' + x.id)} | ${markdown(x.classification)} | ${report.pins.map(p => markdown(x.cells[p.pinId])).join(' | ')} |`),
    '', '## Reviewed target deltas', '',
    '| Finding | Source path:line | Target paths | Category / migration | Confidence | Evidence | Owner |', '|---|---|---|---|---|---|---|',
    ...report.table.rows.map(x => `| ${markdown(x.id)} | ${markdown(x.path)}${x.sourceLines ? ':' + x.sourceLines : ''} | ${x.targetPaths.map(markdown).join(', ') || 'unknown'} | ${markdown(x.classification)} / ${markdown(x.migrationCategory)} | ${x.similarityConfidence ?? 'unknown'} (${x.certainty}) | ${x.evidenceComplete ? 'indexed' : 'incomplete'} | ${markdown(x.owner)} |`),
    '', '## Priority-aware owner review plan', '',
    '| Priority | Finding | Owner | Review action |', '|---|---|---|---|',
    ...report.mergePlan.rows.map(x => `| ${x.priority} | ${markdown(x.findingId)} | ${markdown(x.owner)} | ${markdown(x.recommendation)} |`),
    '', `Plan bounded: ${report.mergePlan.returned}/${report.mergePlan.total}; truncated: ${report.mergePlan.truncated}.`,
    '', '## Test receipt states (source reports are not acceptance)', '',
    '| Test ID | Reported state | Command receipt | Exit | Trust |', '|---|---|---|---|---|',
    ...report.receiptStates.map(x => `| ${markdown(x.id)} | ${x.state} | ${x.hasCommandReceipt} | ${x.exitCode ?? 'UNRUN'} | ${x.provenance} |`),
    '', '## Limitations', '', ...report.notes.map(x => `- ${markdown(x)}`), '',
    `Reproducibility digest (report projection): \`${report.reproducibilityDigest}\``
  ];
  return lines.join('\n') + '\n';
}

export function toReviewCsv(report) {
  if (report?.schema !== REPORT_SCHEMA) problem('INVALID_REPORT', 'CSV exporter');
  const headers = ['kind', 'id', 'source_pin', 'source_sha', 'path', 'lines', 'source_blob', 'target_paths', 'classification', 'migration_category', 'certainty', 'similarity_confidence', 'owner', 'evidence_complete', 'source_coverage', 'runtime_acceptance'];
  const byPin = new Map(report.pins.map(x => [x.pinId, x]));
  const lines = [headers.map(csv).join(',')];
  for (const row of report.table.rows) {
    const pin = byPin.get(row.sourcePinId);
    lines.push([row.kind, row.id, row.sourcePinId, pin?.resolvedCommitSha, row.path, row.sourceLines, row.sourceBlob, row.targetPaths.join(';'), row.classification, row.migrationCategory, row.certainty,
      row.similarityConfidence, row.owner, row.evidenceComplete, row.completeness, report.runtimeAcceptance].map(csv).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

/** Format-dispatched export; safe to call on frozen JSON input, with no IO. */
export function exportVersionComparison(comparison, { format = 'json', ...options } = {}) {
  const report = projectVersionComparison(comparison, options);
  if (format === 'json') return JSON.stringify(report, null, 2) + '\n';
  if (format === 'markdown') return toMigrationMarkdown(report);
  if (format === 'csv') return toReviewCsv(report);
  if (format === 'evidence-json') return JSON.stringify({ schema: 'arbor.hvi.evidence-index/1',
    targetPinId: report.targetPinId, evidenceIndex: report.evidenceIndex, coverage: report.coverage,
    reportDigest: report.reproducibilityDigest }, null, 2) + '\n';
  problem('UNSUPPORTED_FORMAT', format);
}
