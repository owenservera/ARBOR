// ARBOR A03 preparatory source-only feedback compiler.
// This module has no filesystem, network, subprocess or Host effects.
import { createHash } from 'node:crypto';

export const SCHEMA = 'arbor.feedback-work-order-suggestion/1';
export const MAX_INPUT_BYTES = 256 * 1024;
export const MAX_RECORDS = 2000;
export const MAX_TEXT = 240;
const SHA = /^[0-9a-f]{40}$/;
const IDENTIFIER = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
// Free-text from viewers/verifiers is untrusted and NEVER becomes an instruction.
const INJECTION = /(?:ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions|(?:system|developer)\s+(?:prompt|instruction)|(?:override|bypass)\s+(?:policy|approval|scope|gate)|(?:write|edit|delete|modify|update)\s+(?:the\s+)?(?:roadmap|\.github|main\b|scripts\/|docs\/|source\s+file|git\s+ref)|(?:sudo\s+|rm\s+-rf\b|curl\s+|wget\s+|chmod\s+|git\s+push\b)|\/api\/mutate\b)/i;
const FAILURE_CHECKS = Object.freeze({
  'wiki-page-renders': Object.freeze({
    evidenceItem: 'WIKI-BASELINE',
    sourcePath: 'scripts/batch-evidence/WIKI-BASELINE.mjs',
    roadmapItem: 'A00',
    acceptanceIndex: 0,
    reproduction: 'ARBOR_WIKI_EVIDENCE_ISOLATED=1 ARBOR_WIKI_EVIDENCE_BASE_URL=http://127.0.0.1:43187 bun scripts/batch-evidence/WIKI-BASELINE.mjs --live',
    condition: 'Wiki proof must separate API/source assertions from an executed browser DOM check; no static-HTML false green.'
  }),
  'wiki-edit-journal-record': Object.freeze({
    evidenceItem: 'WIKI-BASELINE',
    sourcePath: 'scripts/batch-evidence/WIKI-BASELINE.mjs',
    roadmapItem: 'A00',
    acceptanceIndex: 1,
    reproduction: 'ARBOR_WIKI_EVIDENCE_ISOLATED=1 ARBOR_WIKI_EVIDENCE_BASE_URL=http://127.0.0.1:43187 bun scripts/batch-evidence/WIKI-BASELINE.mjs --live',
    condition: 'Journal proof must parse /api/journal response as JSON array and compare the typed nested edit, not assume JSONL or a verbatim echo.'
  })
});

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function reject(code, msg) { const err = new Error(msg); err.code = code; throw err; }
function sized(value, limit = MAX_INPUT_BYTES) {
  if (Buffer.byteLength(JSON.stringify(value)) > limit) reject('OVERSIZED_INPUT', 'Input exceeds permitted size');
}
function boundedString(x, field, max = MAX_TEXT, allowEmpty = false) {
  if (typeof x !== 'string' || x.length > max || (!allowEmpty && !x.trim()) || CONTROL.test(x)) {
    reject('MALFORMED_INPUT', 'Invalid ' + field);
  }
  if (INJECTION.test(x)) reject('INSTRUCTION_INJECTION', 'Instruction-like content rejected in ' + field);
  return x.trim();
}
function identity(x, field) {
  if (typeof x !== 'string' || !IDENTIFIER.test(x)) reject('MALFORMED_INPUT', 'Invalid ' + field);
  return x;
}
function sourceRef(x, field) {
  if (typeof x !== 'string' || x.length > 200 || x.startsWith('/') || x.includes('\\') ||
      x.split('/').some(p => !p || p === '.' || p === '..') || CONTROL.test(x)) {
    reject('UNTRUSTED_PATH', 'Invalid ' + field);
  }
  return x;
}
function sortedObject(x) {
  if (Array.isArray(x)) return x.map(sortedObject);
  if (!record(x)) return x;
  return Object.fromEntries(Object.keys(x).sort().map(k => [k, sortedObject(x[k])]));
}
export function stableDigest(x) {
  return createHash('sha256').update(JSON.stringify(sortedObject(x))).digest('hex');
}

function assertPinned(pins) {
  if (!record(pins) || typeof pins.sourceSha !== 'string' || !SHA.test(pins.sourceSha) ||
      !SHA.test(pins.currentSha || '') || pins.sourceSha !== pins.currentSha) {
    reject('STALE_OR_MISSING_SHA', 'Exact pinned source SHA and current checkout SHA must match');
  }
  const revision = identity(pins.revision, 'roadmap revision');
  const currentRevision = identity(pins.currentRevision, 'current roadmap revision');
  if (revision !== currentRevision) reject('STALE_REVISION', 'Roadmap revision changed since evidence pin');
  return { repository: 'owenservera/ARBOR', sourceSha: pins.sourceSha, roadmapRevision: revision };
}
function roadmapRecord(roadmap, itemId) {
  if (!record(roadmap) || roadmap.schema !== 'arbor.product-roadmap/1' ||
      !Array.isArray(roadmap.layers?.L2) || !Array.isArray(roadmap.buildQueue)) {
    reject('MALFORMED_ROADMAP', 'Canonical roadmap projection required');
  }
  const matches = roadmap.layers.L2.filter(x => x.id === itemId);
  const queueMatches = roadmap.buildQueue.filter(x => x.itemId === itemId);
  if (matches.length !== 1 || queueMatches.length !== 1 ||
      matches[0].lane !== queueMatches[0].lane ||
      matches[0].ownerAcceptance !== queueMatches[0].ownerAcceptance ||
      matches[0].verification !== queueMatches[0].verification) {
    reject('ROADMAP_AUTHORITY_CONFLICT', 'Ambiguous or inconsistent item ownership');
  }
  return matches[0];
}
function ownedBy(item, rule) {
  // sourceEvidence is the *explicit* existing ownership contract. A broad
  // writeScope like scripts/ cannot establish owner identity on its own.
  if (!Array.isArray(item.sourceEvidence) || !item.sourceEvidence.includes(rule.sourcePath)) return false;
  return Array.isArray(item.writeScope) && item.writeScope.some(p => p === rule.sourcePath || (p.endsWith('/') && rule.sourcePath.startsWith(p)));
}
function normalizeReceipt(wrapper) {
  if (!record(wrapper) || !record(wrapper.data)) reject('MALFORMED_RECEIPT', 'Receipt wrapper requires data object');
  sized(wrapper, 32 * 1024);
  const path = sourceRef(wrapper.path, 'receipt path');
  if (!/^\.coordination\/pdr\/evidence\/[A-Z0-9-]+\.verify\.[a-z0-9-]+\.json$/.test(path) &&
      !/^scripts\/feedback-loop\/fixtures\/[a-z0-9.-]+\.json$/.test(path)) {
    reject('UNTRUSTED_PATH', 'Receipt must be within allowed read-only evidence or lane fixture directories');
  }
  const data = wrapper.data;
  if (data.ok !== false || !Array.isArray(data.checks) || data.checks.length < 1 || data.checks.length > 64) {
    reject('MALFORMED_RECEIPT', 'Only recorded failed receipts with bounded checks are accepted');
  }
  const item = identity(data.item, 'receipt item');
  for (const c of data.checks) {
    if (!record(c) || typeof c.pass !== 'boolean') reject('MALFORMED_RECEIPT', 'Malformed verifier check');
    identity(c.name, 'check name');
    boundedString(c.detail, 'verifier detail', 1024, true);
  }
  if (!data.checks.some(c => c.pass === false)) reject('MALFORMED_RECEIPT', 'Receipt claims failure without failed checks');
  return { item, checks: data.checks, ref: {
    path, receiptDigest: stableDigest(data),
    evidenceId: identity(wrapper.evidenceId || 'record', 'evidence id')
  } };
}
function normalizeJournal(wrapper) {
  if (!record(wrapper) || !Array.isArray(wrapper.entries)) reject('MALFORMED_JOURNAL', 'Journal requires entries');
  sized(wrapper, MAX_INPUT_BYTES);
  if (wrapper.entries.length > MAX_RECORDS) reject('OVERSIZED_INPUT', 'Too many journal entries');
  const path = sourceRef(wrapper.path, 'journal path');
  if (path !== 'demo/host-legacy/journal.jsonl' &&
      !/^scripts\/feedback-loop\/fixtures\/[a-z0-9.-]+\.jsonl$/.test(path)) {
    reject('UNTRUSTED_PATH', 'Journal outside allowed read-only sources');
  }
  const review = [];
  for (let i = 0; i < wrapper.entries.length; i++) {
    const e = wrapper.entries[i];
    if (!record(e)) reject('MALFORMED_JOURNAL', 'Journal entry must be object');
    // Product journal includes chat-send, wiki-edit and gate records: ignore
    // these as work requests, not as silent execution authority.
    if (!Array.isArray(e.verdicts)) continue;
    if (e.verdicts.length > 64) reject('OVERSIZED_INPUT', 'Too many verdicts');
    const round = String(e.round ?? '');
    boundedString(round, 'round', 80);
    for (const v of e.verdicts) {
      if (!record(v)) reject('MALFORMED_JOURNAL', 'Verdict must be object');
      const decision = v.decision ?? v.verdict;
      if (!['approve', 'revise', null, undefined, ''].includes(decision)) reject('MALFORMED_JOURNAL', 'Unrecognized decision');
      if (v.notes !== undefined) boundedString(v.notes, 'notes', MAX_TEXT, true);
      if (v.screen !== undefined) boundedString(v.screen, 'screen', 80);
      if (v.tags !== undefined && (!Array.isArray(v.tags) || v.tags.length > 8 ||
          v.tags.some(tag => !['layout', 'copy', 'flow', 'other'].includes(tag)))) reject('MALFORMED_JOURNAL', 'Invalid tags');
      if (decision === 'revise') {
        const itemId = identity(v.itemId ?? v.id, 'verdict item');
        // Demo step IDs are not roadmap task IDs and have no trusted code owner.
        review.push({ reason: 'UNKNOWN_SOURCE_OWNER', itemId, source: path,
          evidenceId: stableDigest({ path, round, itemId, i, verdict: v }).slice(0, 24),
          question: 'Which existing roadmap item and source path does this demo revision concern?' });
      }
    }
  }
  const unique = new Map(review.map(x => [x.evidenceId, x]));
  return [...unique.values()].sort((a, b) => a.evidenceId.localeCompare(b.evidenceId));
}

export function compileFeedback({ roadmap, pins, receipts = [], journals = [], condition = null }) {
  const sourcePin = assertPinned(pins);
  if (roadmap.acceleration?.revision !== sourcePin.roadmapRevision) reject('STALE_REVISION', 'Pinned roadmap does not match loaded roadmap');
  if (!Array.isArray(receipts) || !Array.isArray(journals) || receipts.length + journals.length > 64) reject('OVERSIZED_INPUT', 'Too many sources');
  if (condition !== null) identity(condition, 'filter condition');
  const findings = new Map();
  const review = [];
  for (const wrapper of receipts) {
    const r = normalizeReceipt(wrapper);
    for (const c of r.checks.filter(x => x.pass === false && (!condition || x.name === condition))) {
      const rule = FAILURE_CHECKS[c.name];
      if (!rule || rule.evidenceItem !== r.item) {
        review.push({ reason: 'UNKNOWN_SOURCE_OWNER', itemId: r.item, condition: c.name,
          source: r.ref.path, question: 'Which canonical owner and exact source file own this failed check?' });
        continue;
      }
      const item = roadmapRecord(roadmap, rule.roadmapItem);
      if (!ownedBy(item, rule) || item.lane !== 'B' || item.acceptance?.[rule.acceptanceIndex] === undefined) {
        review.push({ reason: 'OWNERSHIP_CONFLICT', itemId: r.item, condition: c.name, source: r.ref.path,
          question: 'Keeper must reconcile this check mapping with canonical roadmap ownership.' });
        continue;
      }
      const key = rule.sourcePath + '#' + c.name;
      if (!findings.has(key)) findings.set(key, { rule, item, refs: new Map() });
      const provenance = { ...r.ref, check: c.name, detailDigest: stableDigest(c.detail) };
      const refKey = [provenance.path, provenance.receiptDigest, provenance.evidenceId, provenance.check].join(':');
      findings.get(key).refs.set(refKey, provenance);
    }
  }
  for (const journal of journals) review.push(...normalizeJournal(journal));
  const sortedFindings = [...findings.entries()].sort((a,b) => a[0].localeCompare(b[0]));
  const selected = sortedFindings[0] || null;
  let candidate = null;
  if (selected) {
    const [canonicalCondition, { rule, item, refs }] = selected;
    const evidenceRefs = [...refs.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const identityDigest = stableDigest({ canonicalCondition, sourcePin });
    candidate = {
      schema: 'arbor.feedback-work-order-candidate/1',
      kind: 'REVIEW_ONLY_NOT_EXECUTABLE',
      identity: canonicalCondition,
      identityDigest,
      title: 'Repair failed verifier condition: ' + selected[1].rule.evidenceItem + ' / ' + canonicalCondition.split('#')[1],
      existingRoadmapItemId: item.id,
      ownerLane: item.lane,
      narrowPaths: [rule.sourcePath],
      condition: rule.condition,
      reproduction: { command: rule.reproduction, prerequisite: 'START AN ISOLATED EPHEMERAL HOST ON LOOPBACK; command is an instruction for an authorized operator only', executed: 'UNRUN' },
      acceptanceCondition: item.acceptance[rule.acceptanceIndex],
      dependencyIds: [...item.dependsOn].sort(),
      sourcePin,
      evidenceRefs,
      ownerAcceptance: item.ownerAcceptance,
      existingVerification: item.verification,
      authorization: 'KEEPER_REVIEW_REQUIRED',
      activationGate: 'A03_BLOCKED_UNTIL_A00_INDEPENDENTLY_ACCEPTED'
    };
    candidate.digest = stableDigest(candidate);
  }
  for (const [key, value] of sortedFindings.slice(1)) {
    review.push({ reason: 'ADDITIONAL_DISTINCT_FAILED_CONDITION', condition: key, source: value.rule.sourcePath,
      question: 'Compile this distinct failure in a separate keeper-reviewed pass.' });
  }
  if (condition && !sortedFindings.length && !review.length) review.push({
    reason: 'CONDITION_NOT_FOUND', condition, question: 'Provide a recorded failed receipt for the selected condition.'
  });
  const reviewDedup = new Map(review.map(x => [stableDigest(x), x]));
  const result = {
    schema: SCHEMA,
    mode: 'DRY_RUN_READ_ONLY',
    decision: candidate ? 'CANDIDATE_REQUIRES_REVIEW' : review.length ? 'REVIEW_REQUIRED' : 'NO_ACTIONABLE_FAILURE',
    sourcePin,
    candidate,
    reviewRequired: [...reviewDedup.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),
    distinctFailedConditions: sortedFindings.length,
    noSourceEffects: true,
    noRoadmapWrites: true,
    a03Activation: 'BLOCKED_A00_INDEPENDENT_ACCEPTANCE_PENDING',
    accelerationMeasurement: 'NOT_YET_MEASURED'
  };
  result.digest = stableDigest(result);
  return result;
}

export function summary(result) {
  const c = result.candidate;
  return [
    'ARBOR feedback compiler — dry-run; no writes or Host effects',
    'Decision: ' + result.decision,
    'Source pin: ' + result.sourcePin.sourceSha + ' / ' + result.sourcePin.roadmapRevision,
    c ? 'Candidate: ' + c.existingRoadmapItemId + ' (' + c.ownerLane + ') ' + c.identity : 'Candidate: none; keeper review required',
    c ? 'Path: ' + c.narrowPaths.join(', ') : '',
    c ? 'Reproduction (UNRUN): ' + c.reproduction.command : '',
    c ? 'Evidence references: ' + c.evidenceRefs.length + ' | stable identity: ' + c.identityDigest : '',
    'Other conditions / owner questions: ' + result.reviewRequired.length,
    'A03 activation: BLOCKED pending independent A00 acceptance',
    'Measured acceleration: NOT_YET_MEASURED'
  ].filter(Boolean).join('\n') + '\n';
}
