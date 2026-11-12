// @ts-check
/**
 * @hq:context The receipt/outcome/decision join: what a channel receipt claimed, what its outcome
 *   says, and which source named the conversation the receipt touched.
 * @hq:owner channel-manager
 * @hq:task evidence-join
 * @hq:invariant a receipt joins its outcome by requestId only; a filename or any other id is never a key
 * @hq:invariant the join is pure: the caller already read the arrays; nothing here reads or writes a feed
 * @hq:invariant an absent or broken registry degrades a placeholder thread to 'unknown'; it never throws
 * @hq:see hq/lib/comms-roof.mjs
 * @hq:see hq/lib/cnp.mjs
 */

/** @typedef {'stored'|'named'|'unknown'} Basis */

/**
 * @typedef {{
 *   receiptId: string|null,
 *   requestId: any,
 *   actor: string|null,
 *   effect: string|null,
 *   storedThreadId: string|null,
 *   threadId: string|null,
 *   basis: Basis,
 *   outcomeEffect: string|null,
 *   evidenceState: string|null,
 *   joinable: boolean,
 * }} EvidenceRecord
 */

/**
 * A thread id that names a tab or a fresh conversation rather than a conversation.
 * A missing id is a placeholder too: there is nothing to resolve either way.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlaceholderThread(value) {
  if (value === null || value === undefined) return true;
  const id = String(value).trim();
  if (!id) return true;
  return /live-tab$/i.test(id) || /^(new|t\d+)$/i.test(id) || /-new$/i.test(id);
}

/**
 * Join receipts to their outcomes and decisions.
 *
 * `receipts` are ledger documents (`{receiptId, requestId, actor:{id}, effect, thread:{after,before}}`),
 * or rows already flattened to `{storedThreadId}`. `outcomes` are documents carrying a `requestId`;
 * that field is the whole match. `decisions` are documents carrying `decisionId`, `effect`, `kind`
 * and `decidedAt`.
 *
 * `registry` is optional and needs only `.get(receiptId)` returning `{nid}` or a name string. It is
 * consulted only when the stored thread id is a placeholder or missing, so a real id is never
 * overwritten. With no registry, or one that fails, the record is `basis: 'unknown'` rather than an
 * exception.
 *
 * @param {{
 *   receipts?: any[],
 *   outcomes?: any[],
 *   decisions?: any[],
 *   registry?: {get: (key: string) => any} | null,
 * }} [input]
 * @returns {{
 *   records: EvidenceRecord[],
 *   decisions: {id: string|null, effect: string|null, kind: string|null, at: string|null}[],
 *   summary: {receipts: number, joinable: number, decisions: number, stored: number, named: number, unknown: number},
 * }}
 */
export function joinEvidence({ receipts = [], outcomes = [], decisions = [], registry = null } = {}) {
  const receiptList = Array.isArray(receipts) ? receipts : [];
  const outcomeList = Array.isArray(outcomes) ? outcomes : [];
  const decisionList = Array.isArray(decisions) ? decisions : [];

  // The only join key. An outcome without a requestId joins nothing; two outcomes naming
  // one request keep the last one, which is the order the caller read the ledger in.
  /** @type {Map<any, any>} */
  const outcomeByRequest = new Map();
  for (const doc of outcomeList) {
    const requestId = doc?.requestId;
    if (requestId === null || requestId === undefined || requestId === '') continue;
    outcomeByRequest.set(requestId, doc);
  }

  const canName = typeof registry?.get === 'function';

  /** @type {EvidenceRecord[]} */
  const records = receiptList.map((receipt) => {
    const receiptId = receipt?.receiptId ?? receipt?.id ?? null;
    const requestId = receipt?.requestId ?? null;
    const actor = typeof receipt?.actor === 'string' ? receipt.actor : (receipt?.actor?.id ?? null);
    const storedThreadId = storedThreadOf(receipt);
    const outcome = requestId === null || requestId === undefined || requestId === ''
      ? null
      : (outcomeByRequest.get(requestId) ?? null);
    const resolved = resolveThread(storedThreadId, receiptId, canName ? registry : null);
    return {
      receiptId,
      requestId,
      actor,
      effect: receipt?.effect ?? null,
      storedThreadId,
      threadId: resolved.threadId,
      basis: resolved.basis,
      outcomeEffect: outcome?.effect ?? null,
      evidenceState: outcome?.evidenceState ?? null,
      joinable: outcome !== null,
    };
  });

  const decisionRows = decisionList.map((doc) => ({
    id: doc?.decisionId ?? doc?.id ?? null,
    effect: doc?.effect ?? null,
    kind: doc?.kind ?? null,
    at: doc?.decidedAt ?? doc?.at ?? null,
  }));

  let joinable = 0;
  let stored = 0;
  let named = 0;
  let unknown = 0;
  for (const record of records) {
    if (record.joinable) joinable += 1;
    if (record.basis === 'stored') stored += 1;
    else if (record.basis === 'named') named += 1;
    else unknown += 1;
  }

  return {
    records,
    decisions: decisionRows,
    summary: { receipts: records.length, joinable, decisions: decisionRows.length, stored, named, unknown },
  };
}

/**
 * The thread id as the receipt stored it, before any naming.
 *
 * @param {any} receipt
 * @returns {string|null}
 */
function storedThreadOf(receipt) {
  const after = idOf(receipt?.thread?.after);
  if (after) return after;
  const before = idOf(receipt?.thread?.before);
  if (before) return before;
  return idOf(receipt?.storedThreadId) ?? idOf(receipt?.threadId);
}

/**
 * @param {any} value
 * @returns {string|null}
 */
function idOf(value) {
  if (typeof value === 'string') return value.length ? value : null;
  if (value === null || value === undefined) return null;
  return String(value);
}

/**
 * Resolve a stored thread id to one that can identify a conversation. A real id is kept as
 * stored; a placeholder or missing id is replaced by the registry's name, and when nothing
 * names it the raw value stays visible under `basis: 'unknown'`.
 *
 * @param {string|null} storedThreadId
 * @param {string|null} receiptId
 * @param {{get: (key: string) => any} | null} registry
 * @returns {{threadId: string|null, basis: Basis}}
 */
function resolveThread(storedThreadId, receiptId, registry) {
  if (!isPlaceholderThread(storedThreadId)) return { threadId: storedThreadId, basis: 'stored' };
  const name = lookupName(registry, receiptId);
  if (name) return { threadId: name, basis: 'named' };
  return { threadId: storedThreadId, basis: 'unknown' };
}

/**
 * Ask the registry for a name. A registry that is missing, silent or broken names nothing.
 *
 * @param {{get: (key: string) => any} | null} registry
 * @param {string|null} receiptId
 * @returns {string|null}
 */
function lookupName(registry, receiptId) {
  if (!registry || typeof registry.get !== 'function') return null;
  if (receiptId === null || receiptId === undefined || receiptId === '') return null;
  let entry = null;
  try {
    entry = registry.get(receiptId);
  } catch {
    return null;
  }
  if (typeof entry === 'string') return entry.trim() ? entry : null;
  const name = entry?.nid ?? entry?.name ?? null;
  return typeof name === 'string' && name.trim() ? name : null;
}

/* ------------------------------------------------------------------ */
/* completion-claim probes (read-only)                                */
/* ------------------------------------------------------------------ */

/**
 * @typedef {{
 *   claimId: string|null,
 *   source: string|null,
 *   claim: string|null,
 *   supportingReceipts: EvidenceRecord[],
 *   unsupported: boolean,
 * }} CompletionClaimRecord
 */

/**
 * Join completion claims against test-outcome receipts. Each claim carries its
 * source (file:line where it was made). A claim is supported when at least one
 * receipt names the same claim id with an effect of 'OK' (a passing test
 * outcome). A claim with zero supporting receipts is unsupported: its source
 * file:line is the gap evidence. Pure: reads the supplied arrays, writes nothing.
 *
 * @param {Array<{claimId?: string|null, requestId?: string|null, source?: string|null, claim?: string|null, effect?: string|null}>} claims
 * @param {Array<EvidenceRecord & {claimId?: string|null}>} receipts
 * @returns {{ records: CompletionClaimRecord[], summary: { claims: number, supported: number, unsupported: number } }}
 */
export function joinCompletionClaims(claims = [], receipts = []) {
  const claimList = Array.isArray(claims) ? claims : [];
  /** @type {Map<string, EvidenceRecord[]>} */
  const byClaim = new Map();
  for (const r of Array.isArray(receipts) ? receipts : []) {
    const key = r.claimId ?? r.requestId ?? null;
    if (key === null || key === undefined || key === '') continue;
    const bucket = byClaim.get(String(key)) ?? [];
    bucket.push(r);
    byClaim.set(String(key), bucket);
  }

  /** @type {CompletionClaimRecord[]} */
  const records = claimList.map((c) => {
    const id = c.claimId ?? c.requestId ?? null;
    const supports = byClaim.get(String(id ?? '')) ?? [];
    const passing = supports.filter((r) => String(r.effect ?? '').toLowerCase() === 'ok');
    return {
      claimId: id ?? null,
      source: c.source ?? null,
      claim: c.claim ?? null,
      supportingReceipts: passing,
      unsupported: passing.length === 0,
    };
  });

  let supported = 0;
  let unsupported = 0;
  for (const r of records) {
    if (r.unsupported) unsupported += 1; else supported += 1;
  }

	  return {
	    records,
	    summary: { claims: records.length, supported, unsupported },
	  };
}

/* ------------------------------------------------------------------ */
/* device-verification absence (read-only probe)                      */
/* ------------------------------------------------------------------ */

/**
 * Evidence kind that names a verification performed on a physical device.
 * Nothing in HQ operates a device: receipts with this kind are records that a
 * device verification was reported into the ledger, produced by
 * hq/lib/receipts.mjs recordReceipt. The kind is a label only — no adb or
 * device call originates here, and nothing in this module sends or approves.
 */
export const DEVICE_VERIFICATION_KIND = 'device-verification';

/**
 * Which capabilities lack device-verification evidence. Pure absence analysis
 * over HQ's own ledgers: reads capabilities, receipts and recon rows, writes
 * nothing, touches no device, performs no effect.
 *
 * A capability counts as device-verified when at least one receipt of kind
 * `device-verification` names it — by `task` equal to the capability id, or by
 * a source `ref` equal to the capability id. A recon row for the capability is
 * runtime state, not device evidence, so a recon-only capability is reported
 * as unverified with the missing evidence kind cited. Capabilities never
 * named in the input are not reported at all; an empty ledger yields explicit
 * zeros (verified: 0) rather than an empty, ambiguous result.
 *
 * @param {{
 *   capabilities?: Array<{id: string|null}>,
 *   receipts?: any[],
 *   recon?: any[]
 * }} [input]
 * @returns {{
 *   records: Array<{capabilityId: string|null, verified: boolean,
 *     missingEvidence: string[], sources: string[]}>,
 *   summary: {capabilities: number, verified: number, unverified: number}
 * }}
 */
export function deviceVerificationAbsence({
  capabilities = [],
  receipts = [],
  recon = [],
} = {}) {
  const capList = Array.isArray(capabilities) ? capabilities : [];
  const receiptList = Array.isArray(receipts) ? receipts : [];
  const reconList = Array.isArray(recon) ? recon : [];

  const deviceReceipts = receiptList.filter(
    (r) => r && String(r.kind ?? '') === DEVICE_VERIFICATION_KIND,
  );

  /** @type {Map<string|null, {verified: boolean, sources: string[]}>} */
  const byCap = new Map();
  for (const cap of capList) {
    const id = cap?.id == null ? null : String(cap.id);
    byCap.set(id, { verified: false, sources: [] });
  }

  for (const r of deviceReceipts) {
    const task = r?.task == null ? null : String(r.task);
    const refs = Array.isArray(r?.sources) ? r.sources.map((s) => String(s?.ref ?? '')) : [];
    const hits = [task, ...refs].filter((x) => x != null && byCap.has(x));
    for (const id of hits) {
      const row = byCap.get(id);
      row.verified = true;
      row.sources.push(`receipt ${String(r.receiptId ?? r.id ?? '')}`);
    }
  }

  // Recon rows are runtime evidence: cite them as consulted, never as device verification.
  for (const row of reconList) {
    const id = row?.id == null ? null : String(row.id);
    if (id != null && byCap.has(id)) {
      byCap.get(id).sources.push(`recon ${id} status=${String(row.status ?? '')}`);
    }
  }

  /** @type {Array<{capabilityId:string|null, verified:boolean, missingEvidence:string[], sources:string[]}>} */
  const records = [];
  let verified = 0;
  for (const [id, rec] of byCap) {
    if (rec.verified) {
      verified += 1;
      continue;
    }
    records.push({
      capabilityId: id,
      verified: false,
      missingEvidence: [DEVICE_VERIFICATION_KIND],
      sources: rec.sources,
    });
  }

  return {
    records,
    summary: {
      capabilities: byCap.size,
      verified,
      unverified: records.length,
    },
  };
}
