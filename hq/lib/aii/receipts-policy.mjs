// hq/lib/aii/receipts-policy.mjs — which AII receipt may prove which scenario.
//
// The old policy was task-keyed only: any receipt whose task was `HQ-0NN`
// promoted the scenario, regardless of which fixture file produced it, whether
// that file still existed, or whether the file had changed since. With
// duplicate ids (two files, one id) the last receipt to be written decided the
// result, and a superseded sibling could invalidate a passing canonical file.
//
// This module makes the decision explicit and inspectable:
//
//   verified  canonical fixture ref + hash equal to the current file   -> proof
//   stale     canonical fixture ref + hash differs                     -> proof of an older file
//   legacy    receipt with no fixture ref at all                       -> unbound
//   foreign   receipt bound only to a quarantined duplicate             -> not proof
//   failed    a fresh journal attempt at the current hash failed        -> contradicts proof
//   absent    no receipt ever recorded                                  -> nothing
//
// Default coverage counts verified + stale (the historical ledger keeps its
// meaning); `--strict` counts only verified. A fresh failure at the current
// fixture hash demotes either way: current evidence beats an old pass.

import { createHash } from 'node:crypto';
import { canonicalJson } from '../util.mjs';
import { AII_FIXTURE_KIND } from './registry.mjs';

const HEX64 = /^[0-9a-f]{64}$/;

export function fixtureDigestLegacy(id, findingsCount) {
  return createHash('sha256').update(`${id}\0${Number(findingsCount) || 0}`).digest('hex');
}

/**
 * fixtureFingerprint — receipt digest bound to the exact evidence that produced
 * it: fixture bytes, locked expectations, catalog and finding count. Editing a
 * fixture therefore creates a new receipt identity instead of silently reusing
 * the old one.
 */
export function fixtureFingerprint({ id, fixtureSha, catalogSha, expectedSha, findingsCount }) {
  const payload = canonicalJson({
    schema: 'hq.aii-fixture-fingerprint/1',
    id: String(id ?? ''),
    fixtureSha: String(fixtureSha ?? ''),
    catalogSha: String(catalogSha ?? ''),
    expectedSha: String(expectedSha ?? ''),
    findingsCount: Number(findingsCount) || 0,
  });
  return createHash('sha256').update(payload).digest('hex');
}

/** expectationsDigest — stable over {what, where} including RegExp sources. */
export function expectationsDigest(expected = []) {
  const rows = (Array.isArray(expected) ? expected : []).map((row) => ({
    what: row?.what instanceof RegExp ? `re:${row.what.source}/${row.what.flags}` : String(row?.what ?? ''),
    where: row?.where instanceof RegExp ? `re:${row.where.source}/${row.where.flags}` : row?.where == null ? null : String(row.where),
  }));
  return createHash('sha256').update(canonicalJson(rows)).digest('hex');
}

export function buildFixtureReceipt(result, { catalogSha = '', project = 'repos-hq' } = {}) {
  const fingerprint = fixtureFingerprint({
    id: result.id,
    fixtureSha: result.fixtureSha,
    catalogSha,
    expectedSha: result.expectedSha,
    findingsCount: result.findings,
  });
  return {
    kind: AII_FIXTURE_KIND,
    task: result.id,
    project,
    sources: [
      { ref: 'fixture:' + String(result.fixtureRel).replaceAll('\\', '/'), sha256: result.fixtureSha },
      { ref: 'catalog:docs/AII-CATALOG.md', sha256: catalogSha },
      { ref: 'expectations:' + String(result.fixtureRel).replaceAll('\\', '/'), sha256: result.expectedSha },
    ],
    digest: fingerprint,
    bytes: Number(result.findings) || 0,
  };
}

function fixtureRefs(receipt) {
  return (Array.isArray(receipt?.sources) ? receipt.sources : [])
    .map((source) => String(source?.ref ?? ''))
    .filter((ref) => ref.startsWith('fixture:'))
    .map((ref) => ({ path: ref.slice('fixture:'.length), sha256: String((receipt.sources.find((s) => String(s?.ref) === ref)?.sha256) ?? '') }));
}

function receiptCreatedAt(receipt) {
  return String(receipt?.createdAt ?? receipt?.created_at ?? '');
}

function newest(receipts) {
  return [...receipts].sort((a, b) => receiptCreatedAt(a).localeCompare(receiptCreatedAt(b)) || String(a.id).localeCompare(String(b.id))).at(-1) ?? null;
}

/**
 * classifyReceipts — deterministic per-scenario evidence classification.
 * @param {{receipts: object[], plan: object, strict?: boolean, allowLegacy?: boolean}} options
 */
export function classifyReceipts({ receipts = [], plan, strict = false, allowLegacy = false } = {}) {
  const canonicalByTask = new Map();
  const fixtureByPath = new Map();
  for (const fixture of plan?.fixtures ?? []) {
    if (fixture.role === 'canonical') canonicalByTask.set(fixture.id, fixture);
    fixtureByPath.set(fixture.relPath, fixture);
  }

  const byTask = new Map();
  for (const receipt of receipts) {
    const task = String(receipt?.task ?? '');
    if (!task) continue;
    if (!byTask.has(task)) byTask.set(task, []);
    byTask.get(task).push(receipt);
  }

  const rows = new Map();
  for (const [id, canonical] of [...canonicalByTask].sort()) {
    const all = byTask.get(id) ?? [];
    const boundToCanonical = all.filter((r) => fixtureRefs(r).some((ref) => ref.path === canonical.relPath));
    const foreignOnly = all.filter((r) => {
      const refs = fixtureRefs(r);
      return refs.length > 0 && refs.every((ref) => ref.path !== canonical.relPath);
    });
    const unbound = all.filter((r) => fixtureRefs(r).length === 0);

    if (boundToCanonical.length > 0) {
      const receipt = newest(boundToCanonical);
      const ref = fixtureRefs(receipt).find((r) => r.path === canonical.relPath);
      const shaMatches = ref?.sha256 === canonical.sha;
      rows.set(id, {
        id,
        state: shaMatches ? 'verified' : 'stale',
        reason: shaMatches
          ? 'receipt bound to the current canonical fixture bytes'
          : 'fixture changed after the receipt was recorded; re-run required',
        receipt: { id: receipt.id, createdAt: receiptCreatedAt(receipt), fixtureSha: ref?.sha256 ?? null },
        canonical: canonical.relPath,
        currentSha: canonical.sha,
        eligible: shaMatches || !strict,
      });
    } else if (unbound.length > 0) {
      const receipt = newest(unbound);
      rows.set(id, {
        id,
        state: 'legacy',
        reason: 'receipt has no fixture source; cannot be bound to a fixture file',
        receipt: { id: receipt.id, createdAt: receiptCreatedAt(receipt), fixtureSha: null },
        canonical: canonical.relPath,
        currentSha: canonical.sha,
        eligible: allowLegacy,
      });
    } else if (foreignOnly.length > 0) {
      const receipt = newest(foreignOnly);
      rows.set(id, {
        id,
        state: 'foreign',
        reason: 'receipt is bound only to a quarantined duplicate fixture',
        receipt: { id: receipt.id, createdAt: receiptCreatedAt(receipt), fixtureSha: null },
        canonical: canonical.relPath,
        currentSha: canonical.sha,
        eligible: false,
      });
    } else {
      rows.set(id, {
        id,
        state: 'absent',
        reason: 'no aii-fixture receipt recorded',
        receipt: null,
        canonical: canonical.relPath,
        currentSha: canonical.sha,
        eligible: false,
      });
    }
  }
  return rows;
}

/**
 * applyJournalPolicy — current-run evidence overrides historical receipts.
 * A journal entry only applies when it describes the *current* fixture bytes;
 * an old failure against an older file must not poison a newer pass, and an
 * old pass must not survive a fresh failure.
 */
export function applyJournalPolicy(classification, { journal = null, plan, strict = false } = {}) {
  const canonicalByTask = new Map();
  for (const fixture of plan?.fixtures ?? []) if (fixture.role === 'canonical') canonicalByTask.set(fixture.id, fixture);
  for (const [id, row] of classification) {
    const canonical = canonicalByTask.get(id);
    if (!canonical) continue;
    const entry = journal?.entries?.[canonical.relPath];
    if (entry && entry.sha === canonical.sha && ['fail', 'timeout', 'load', 'id-mismatch', 'mutating-probe'].includes(entry.status)) {
      classification.set(id, {
        ...row,
        state: 'failed',
        reason: `current fixture failed on ${entry.at ?? 'the last run'}: ${entry.problem ?? entry.status}`,
        eligible: false,
        failedAt: entry.at ?? null,
      });
      continue;
    }
    const legacy = journal?.legacyFailures?.[id];
    const freshPass = entry && entry.sha === canonical.sha && entry.status === 'pass';
    if (legacy && !freshPass) {
      classification.set(id, {
        ...row,
        state: 'failed',
        reason: `legacy task-level invalidation (${legacy.source ?? 'hq/aii/last-run.json'}); re-run the canonical fixture to resolve`,
        eligible: false,
        failedAt: legacy.at ?? null,
      });
    }
  }
  return classification;
}

/** coverageReceipts — the receipts buildAiiRegistry may promote with. */
export function coverageReceipts(classification) {
  const out = [];
  for (const [task, row] of [...classification].sort()) {
    if (!row.eligible || !row.receipt?.id) continue;
    out.push({ task, id: row.receipt.id, sources: [{ ref: 'fixture:' + row.canonical, sha256: row.currentSha }] });
  }
  return out;
}

export function summarizeEvidence(classification) {
  const states = ['verified', 'stale', 'legacy', 'foreign', 'failed', 'absent'];
  const counts = Object.fromEntries(states.map((s) => [s, 0]));
  for (const row of classification.values()) counts[row.state] += 1;
  return {
    ...counts,
    proven: counts.verified,
    provenOrHistorical: counts.verified + counts.stale,
    promotable: [...classification.values()].filter((r) => r.eligible).length,
  };
}

export function isSha256(value) {
  return HEX64.test(String(value ?? ''));
}
