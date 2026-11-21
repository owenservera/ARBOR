// Local-first personal command-rule state. Separate from Host effect authority:
// proposals are inert and acceptance REQUIRES a trusted owner-approval verifier.
// A receipt-shaped object is not sufficient. Never wire an AI/web request as verifier.
import { mkdirSync, readFileSync, renameSync, writeFileSync, linkSync, unlinkSync } from 'node:fs';
import { randomBytes, createHash } from 'node:crypto';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { runNativeProductPureSync } from './native-product-pure-sync.mjs';
import { PERSONAL_RULE_SCHEMA, validatePersonalRule } from './personal-semantics.mjs';

export const PERSONAL_STORE_SCHEMA = 'vivim.personal-semantic-store/1';
const MAX_RULES = 500, MAX_HISTORY = 500;
const fail = code => Object.assign(new Error(code), { code });
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const blank = () => ({ schema: PERSONAL_STORE_SCHEMA, version: 0, entries: [], history: [] });
const states = Object.freeze({
  proposed: ['accepted', 'revoked'],
  accepted: ['suspended', 'revoked'],
  suspended: ['accepted', 'revoked'],
  revoked: [],
});
function validData(data, catalog) {
  if (!data || data.schema !== PERSONAL_STORE_SCHEMA ||
    !Number.isSafeInteger(data.version) || data.version < 0 ||
    !Array.isArray(data.entries) || data.entries.length > MAX_RULES ||
    !Array.isArray(data.history) || data.history.length > MAX_HISTORY ||
    // Validate before reading identities: null/corrupt entries must produce
    // a typed corruption error rather than throwing during x.id access.
    data.entries.some(x => !validatePersonalRule(x, catalog).ok) ||
    new Set(data.entries.map(x => x.id)).size !== data.entries.length ||
    data.history.some(h => !h || typeof h !== 'object' || typeof h.ruleId !== 'string' ||
      typeof h.at !== 'string' || !Number.isSafeInteger(h.version))) return false;
  return true;
}
const resultShape = (s, rule) => ({
  schema: PERSONAL_STORE_SCHEMA, version: s.version, ruleId: rule.id,
  ruleRevision: rule.revision, state: rule.state, digest: digest(rule),
});
// Historical objects remain byte-for-byte unchanged; a selected rollback
// source or a newly prepared commit must satisfy full event identity.
const validHistoryEvent = (row, ruleId, revision, storeVersion, catalog) => (
  row && typeof row === 'object' && !Array.isArray(row) &&
  row.ruleId === ruleId && row.revision === revision &&
  Number.isSafeInteger(row.version) && row.version > 0 && row.version <= storeVersion &&
  typeof row.at === 'string' &&
  (row.ownerReceiptId == null || typeof row.ownerReceiptId === 'string') &&
  ['propose', 'remember', 'transition', 'rollback'].includes(row.op) &&
  row.after?.id === ruleId && row.after?.revision === revision &&
  validatePersonalRule(row.after, catalog).ok &&
  (row.op !== 'propose' || row.after.state === 'proposed') &&
  (row.op !== 'remember' || row.after.state === 'accepted') &&
  (row.before === null
    ? (revision === 1 && ['propose', 'remember'].includes(row.op))
    : (row.before?.id === ruleId && Number.isSafeInteger(row.before?.revision) &&
      row.before.revision === revision - 1 &&
      ['remember', 'transition', 'rollback'].includes(row.op) &&
      validatePersonalRule(row.before, catalog).ok)) &&
  (row.op !== 'remember' || row.before === null ||
    row.before.state === 'accepted') &&
  (row.op !== 'transition' || (
    row.before !== null &&
    states[row.before?.state]?.includes(row.after.state) &&
    // A historical transition may change state, revision and acceptance
    // source ONLY. Preserve order-sensitive scope serialization exactly.
    JSON.stringify(row.after) === JSON.stringify({
      ...row.before, revision, state: row.after.state,
      ...(row.after.state === 'accepted' ? {source:'explicit-owner'} : {}),
    })
  ))
);
// A retained rule history is a revision-contiguous suffix, even when other
// rules have interleaved Host CAS versions. The latest retained revision must
// equal the live entry. Do not trust a forged older after-rule identity just
// because the selected rollback event is individually well formed.
const validRuleHistoryChain = (history, ruleId, currentRevision) => {
  let previous = null;
  for (const row of history) {
    if (row?.ruleId !== ruleId && row?.after?.id !== ruleId) continue;
    const revision = row?.after?.revision;
    if (row?.ruleId !== ruleId || row?.after?.id !== ruleId ||
        !Number.isSafeInteger(row.revision) || row.revision < 1 ||
        row.revision !== revision ||
        (previous !== null && revision !== previous + 1))
      return false;
    previous = revision;
  }
  return previous !== null && previous === currentRevision;
};
const nextRuleRevision = rule => {
  if (!Number.isSafeInteger(rule.revision) || rule.revision < 1 ||
      rule.revision >= Number.MAX_SAFE_INTEGER)
    throw fail('PERSONAL_STORE_INVALID_TRANSITION');
  return rule.revision + 1;
};
export function createPersonalRuleStore({
  dataRoot, catalog, verifyOwnerApproval = () => false,
  now = () => new Date().toISOString(),
  nativeReducer = runNativeProductPureSync,
} = {}) {
  if (typeof dataRoot !== 'string' || !dataRoot || !catalog || !Array.isArray(catalog.actions) ||
    typeof verifyOwnerApproval !== 'function' || typeof now !== 'function' ||
    typeof nativeReducer !== 'function')
    throw fail('PERSONAL_STORE_INVALID_SETUP');
  const dir = path.join(dataRoot, 'control');
  const file = path.join(dir, 'personal-semantics.json');
  // The trusted verifier must review the exact subject whose transition and
  // receipt get persisted. Detect callback mutation before any write.
  function verifiedReceipt(approval, approvalSubject) {
    // Review a detached JSON value with the same insertion order and digest
    // as the Host approval subject. A verifier cannot edit an owner-supplied
    // remember rule via nested references, even temporarily.
    let reviewed, subjectBytes, catalogBytes;
    try {
      subjectBytes = JSON.stringify(approvalSubject);
      catalogBytes = JSON.stringify(catalog);
      reviewed = JSON.parse(subjectBytes);
    } catch {
      throw fail('PERSONAL_STORE_APPROVAL_CHANGED');
    }
    const receiptId = approval?.receiptId;
    // Host approval is always tied to an actual journal receipt. A test or
    // integration verifier returning true is not itself a receipt identity.
    if (typeof receiptId !== 'string' || receiptId.length === 0 ||
        receiptId.length > 100 ||
        !approval || verifyOwnerApproval(approval, reviewed) !== true)
      throw fail('PERSONAL_STORE_OWNER_APPROVAL_REQUIRED');
    if (JSON.stringify(reviewed) !== subjectBytes ||
        JSON.stringify(approvalSubject) !== subjectBytes ||
        JSON.stringify(catalog) !== catalogBytes ||
        approval?.receiptId !== receiptId)
      throw fail('PERSONAL_STORE_APPROVAL_CHANGED');
    return receiptId;
  }
  function read() {
    let value;
    try { value = JSON.parse(readFileSync(file, 'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return blank(); throw fail('PERSONAL_STORE_CORRUPT'); }
    if (!validData(value, catalog)) throw fail('PERSONAL_STORE_CORRUPT');
    return value;
  }
  function locked(mutator, expectedVersion) {
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw fail('PERSONAL_STORE_VERSION_REQUIRED');
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const lockFile = file + '.lock';
    const tempLock = lockFile + '.' + process.pid + '.' + randomBytes(6).toString('hex') + '.tmp';
    writeFileSync(tempLock, '', { mode: 0o600 });
    let acquired = false;
    try {
      try { linkSync(tempLock, lockFile); acquired = true; }
      catch (e) { if (e.code === 'EEXIST') throw fail('PERSONAL_STORE_BUSY'); throw e; }
      const current = read();
      // Catalog dependencies and ordering are part of the owner-reviewed
      // source: an injected native adapter can mutate them AFTER the approval
      // callback, so pin throughout the entire locked transaction.
      const catalogBytes = JSON.stringify(catalog);
      // Preserve JSON property order: legacy scope-order digests are
      // significant even when deep structural equality says otherwise.
      const currentBytes = JSON.stringify(current);
      if (current.version !== expectedVersion) throw fail('PERSONAL_STORE_STALE');
      if (current.version >= Number.MAX_SAFE_INTEGER)
        throw fail('PERSONAL_STORE_INVALID_TRANSITION');
      const next = mutator(current);
      const committed = next?.history?.at(-1);
      if (!validData(next, catalog) || next.version !== current.version + 1 ||
          committed?.version !== next.version ||
          !validHistoryEvent(committed, committed?.ruleId, committed?.revision,
            next.version, catalog))
        throw fail('PERSONAL_STORE_INVALID_TRANSITION');
      const temp = file + '.' + process.pid + '.' + randomBytes(6).toString('hex') + '.tmp';
      try {
        writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
        // Verify exactly what would be committed BEFORE the atomic rename.
        // A corrupt/truncated temporary write must never replace the last
        // known-good owner-reviewed file.
        let prepared;
        try { prepared = JSON.parse(readFileSync(temp, 'utf8')); }
        catch { throw fail('PERSONAL_STORE_READBACK_MISMATCH'); }
        if (!validData(prepared, catalog) ||
            !validHistoryEvent(prepared.history.at(-1),
              committed.ruleId, committed.revision, prepared.version, catalog) ||
            !isDeepStrictEqual(prepared, JSON.parse(JSON.stringify(next))))
          throw fail('PERSONAL_STORE_READBACK_MISMATCH');
        // Revalidate the Host-owned source file immediately before the atomic
        // rename. A verifier, injected adapter, or writer ignoring our lock
        // cannot cause a stale snapshot to silently clobber newer source data.
        if (JSON.stringify(current) !== currentBytes ||
            JSON.stringify(catalog) !== catalogBytes ||
            JSON.stringify(read()) !== currentBytes)
          throw fail('PERSONAL_STORE_STALE');
        renameSync(temp, file);
      } finally { try { unlinkSync(temp); } catch {} }
      // Readback is performed while holding the original Host lock. The
      // native computation is inert and never substitutes for durable CAS.
      if (!isDeepStrictEqual(read(), JSON.parse(JSON.stringify(next))))
        throw fail('PERSONAL_STORE_READBACK_MISMATCH');
      return next;
    } finally {
      try { unlinkSync(tempLock); } catch {}
      if (acquired) { try { unlinkSync(lockFile); } catch {} }
    }
  }
  function record(current, rule, op, previous, ownerReceiptId = null, at = now()) {
    return {
      ...current, version: current.version + 1,
      entries: [...current.entries.filter(x => x.id !== rule.id), rule].sort((a,b) => a.id.localeCompare(b.id)),
      history: [...current.history, { version: current.version + 1, ruleId: rule.id,
        revision: rule.revision, op, before: previous ?? null, after: rule,
        ownerReceiptId, at }].slice(-MAX_HISTORY),
    };
  }
  // Host alone checks the current locked snapshot, owner approval, catalog and
  // receipt binding. Rust receives ONLY the already-checked inert transition.
  // If unregistered/unpackaged, retain the incumbent deterministic reducer.
  // If native produces ANY result, exact parity is required before persistence.
  function projected(current, rule, mode, previous, {
    candidate = null, ruleId = rule.id, nextState = null, toRevision = null,
    ownerReceiptId = null, matchingRuleIds = null,
  } = {}) {
    const at = now();
    const next = record(current, rule, mode, previous, ownerReceiptId, at);
    const input = {
      schema: 'vivim.personal-rule-transition-input/1',
      mode, current, expectedVersion: current.version,
      previous: previous ?? null, candidate, ruleId, nextState, toRevision,
      ownerReceiptId, at, matchingRuleIds, entryOrder: next.entries.map(x => x.id),
    };
    // The shared synchronous binary has a strict 512 KiB request AND response
    // frame. Long-lived owner histories are valid Host data and may exceed it.
    // A provably oversized frame is unavailable to this ABI, not a failed
    // native computation: retain the incumbent locked, verified Host reducer.
    // Leave 4 KiB for envelope/key-order/serialization differences.
    const maxFrame = 512 * 1024 - 4096;
    let nativeEligible;
    let nativeInput;
    try {
      // The adapter receives a detached JSON transport frame. It cannot
      // mutate Host's locked snapshot, calculated rule, or expected history
      // and then make a corrupted native result appear equal to itself.
      // JSON serialization retains legacy object insertion order.
      nativeInput = JSON.parse(JSON.stringify(input));
      const requestWire = JSON.stringify({
        schema:'vivim.product-pure-request/1',
        operation:'personal-rule-transition', input:nativeInput,
      });
      const responseWire = JSON.stringify({
        schema:'vivim.product-pure-response/1',
        state:'computed',operation:'personal-rule-transition',
        authority:'none',executionAuthorized:false,effectPerformed:false,
        result:{schema:'vivim.personal-rule-transition/1',
          outcome:'projected',next,rule,authority:'none',
          executionAuthorized:false,effectPerformed:false},
      });
      nativeEligible = Buffer.byteLength(requestWire, 'utf8') <= maxFrame &&
        Buffer.byteLength(responseWire, 'utf8') <= maxFrame;
    } catch {
      throw fail('PERSONAL_STORE_NATIVE_MISMATCH');
    }
    let native = null;
    if (nativeEligible) {
      try {
        native = nativeReducer('personal-rule-transition', nativeInput,
          { failClosedIfPackaged: true });
      } catch {
        // A packaged native kernel that fails its transport, schema or compute
        // contract is NOT the same as an absent kernel. Only true unavailability
        // can use the legacy Host path; never write after a native fault.
        throw fail('PERSONAL_STORE_NATIVE_MISMATCH');
      }
    }
    if (native !== null) {
      // Serialization normalization reproduces the existing on-disk shape
      // (including omitted undefined optional fields). No record is migrated.
      const normalized = value => JSON.parse(JSON.stringify(value));
      const keys = ['authority','effectPerformed','executionAuthorized',
        'next','outcome','rule','schema'];
      if (!native || typeof native !== 'object' || Array.isArray(native) ||
          !isDeepStrictEqual(Object.keys(native).sort(), keys) ||
          native.schema !== 'vivim.personal-rule-transition/1' ||
          native.outcome !== 'projected' || native.authority !== 'none' ||
          native.executionAuthorized !== false || native.effectPerformed !== false ||
          !isDeepStrictEqual(native.rule, normalized(rule)) ||
          !isDeepStrictEqual(native.next, normalized(next)))
        throw fail('PERSONAL_STORE_NATIVE_MISMATCH');
    }
    // Preserve object key insertion/order of owner-reviewed legacy records.
    // Native projection is checked, never treated as an approval or a write.
    return next;
  }
  function propose({ phrase, actionId, args = {}, scope = {}, source = 'explicit-owner', expectedVersion } = {}) {
    if (!['explicit-owner', 'system-observed'].includes(source)) throw fail('PERSONAL_STORE_UNTRUSTED_SOURCE');
    const candidate = { schema: PERSONAL_RULE_SCHEMA,
      id: 'rule:' + randomBytes(12).toString('hex'), revision: 1,
      phrase, actionId, args, scope, state: 'proposed', source, catalogVersion: catalog.version };
    if (!validatePersonalRule(candidate, catalog).ok) throw fail('PERSONAL_STORE_INVALID_RULE');
    let created;
    const next = locked(current => {
      if (current.entries.length >= MAX_RULES) throw fail('PERSONAL_STORE_FULL');
      if (current.entries.some(x => x.id === candidate.id))
        throw fail('PERSONAL_STORE_CONFLICT');
      created = candidate;
      return projected(current, created, 'propose', null, { candidate });
    }, expectedVersion);
    return resultShape(next, created);
  }
  // Explicit owner teaching is one CAS transaction, not propose followed by
  // a second write that can leave a half-accepted rule after a crash.
  function remember({subject,approval}={}) {
    let changed;
    const next=locked(current=>{
      if(subject?.operation!=='remember'||subject.catalogVersion!==catalog.version||
          subject.storeDigest!==digest(current.entries))throw fail('PERSONAL_STORE_STALE');
      const candidate=subject.rule;
      const key=value=>value.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
      const trial={schema:PERSONAL_RULE_SCHEMA,id:'rule:validation',revision:1,
        ...candidate,state:'accepted',source:'explicit-owner',catalogVersion:catalog.version};
      if(!validatePersonalRule(trial,catalog).ok)throw fail('PERSONAL_STORE_INVALID_RULE');
      const matches=current.entries.filter(r=>r.state==='accepted'&&key(r.phrase)===key(candidate.phrase)&&
        digest(r.scope)===digest(candidate.scope));
      if(matches.length>1)throw fail('PERSONAL_STORE_CONFLICT');
      const old=matches[0]??null;
      if((old?.id??null)!==subject.previousId||(old?digest(old):null)!==subject.previousDigest)
        throw fail('PERSONAL_STORE_STALE');
      if(!old&&current.entries.length>=MAX_RULES)throw fail('PERSONAL_STORE_FULL');
      const revision = old ? nextRuleRevision(old) : 1;
      const receiptId = verifiedReceipt(approval, subject);
      changed={...trial,id:old?.id??'rule:'+randomBytes(12).toString('hex'),revision};
      if (!old && current.entries.some(x => x.id === changed.id))
        throw fail('PERSONAL_STORE_CONFLICT');
      return projected(current,changed,'remember',old,{
        candidate:trial,ownerReceiptId:receiptId,
        matchingRuleIds:matches.map(rule=>rule.id)
      });
    },subject?.storeVersion);
    return resultShape(next,changed);
  }
  function transition({ ruleId, nextState, expectedVersion, approval } = {}) {
    if (!['accepted', 'suspended', 'revoked'].includes(nextState))
      throw fail('PERSONAL_STORE_BAD_STATE');
    let changed;
    const next = locked(current => {
      const old = current.entries.find(r => r.id === ruleId);
      if (!old) throw fail('PERSONAL_STORE_UNKNOWN_RULE');
      if (!states[old.state]?.includes(nextState)) throw fail('PERSONAL_STORE_BAD_TRANSITION');
      // Bind the approval to the exact rule, desired transition and current CAS state.
      // No raw boolean, model assertion or unverified receipt bypasses this callback.
      const approvalSubject = { ruleId, ruleDigest: digest(old), nextState,
        storeVersion: current.version, catalogVersion: catalog.version };
      const revision = nextRuleRevision(old);
      const receiptId = verifiedReceipt(approval, approvalSubject);
      changed = { ...old, revision, state: nextState,
        ...(nextState === 'accepted' ? { source: 'explicit-owner' } : {}) };
      return projected(current, changed, 'transition', old, {
        ruleId, nextState,
        // Persist precisely the receipt verified by Host. Never truncate
        // identity: an altered ID cannot bind the journal evidence.
        ownerReceiptId:receiptId,
      });
    }, expectedVersion);
    return resultShape(next, changed);
  }
  function rollback({ ruleId, toRevision, expectedVersion, approval } = {}) {
    let changed;
    const next = locked(current => {
      const old = current.entries.find(r => r.id === ruleId);
      if (!old) throw fail('PERSONAL_STORE_UNKNOWN_RULE');
      // A revision is only a rollback target when its historical identity
      // is unique. Ambiguous/duplicated history cannot be used to rewrite an
      // owner-reviewed rule, even if each individual row looks valid.
      // Both metadata and after-rule identity can claim a historical
      // revision. If they disagree, the revision is ambiguous; never select
      // the apparently valid copy while ignoring a conflicting event.
      const matches = current.history.filter(h =>
        (h.ruleId === ruleId || h.after?.id === ruleId) &&
        (h.revision === toRevision || h.after?.revision === toRevision));
      const past = matches.length === 1 ? matches[0].after : null;
      const selected = matches[0];
      // Bounded history is a suffix of Host CAS writes, one row per version.
      // Validate ALL retained versions rather than only neighbors of the
      // selected row: a forged gap anywhere invalidates rollback provenance.
      const firstVersion = current.version - current.history.length + 1;
      const versionOrderValid = Number.isSafeInteger(firstVersion) &&
        firstVersion >= 1 && current.history.every((h, index) =>
          h.version === firstVersion + index);
      // History is legacy-compatible and not rewritten on read. However a
      // malformed historical row must never make rollback change identities.
      if (!past || !versionOrderValid ||
          !validRuleHistoryChain(current.history, ruleId, old.revision) ||
          !validHistoryEvent(selected, ruleId, toRevision,
            current.version, catalog) || toRevision > old.revision)
        throw fail('PERSONAL_STORE_UNKNOWN_REVISION');
      const approvalSubject = { ruleId, ruleDigest: digest(old), nextState: past.state,
        rollbackTo: toRevision, storeVersion: current.version, catalogVersion: catalog.version };
      const revision = nextRuleRevision(old);
      const receiptId = verifiedReceipt(approval, approvalSubject);
      // Rollback creates a new revision, preserving history and preventing replay of old approval.
      changed = { ...past, revision };
      return projected(current, changed, 'rollback', old, {
        ruleId, toRevision,
        // Persist precisely the receipt verified by Host. Never truncate
        // identity: an altered ID cannot bind the journal evidence.
        ownerReceiptId:receiptId,
      });
    }, expectedVersion);
    return resultShape(next, changed);
  }
  return {
    schema: PERSONAL_STORE_SCHEMA, file,
    snapshot: () => { const state = read(); return {
      schema: PERSONAL_STORE_SCHEMA, version: state.version,
      digest: digest(state.entries), entries: state.entries.map(r => ({ ...r, args: { ...r.args }, scope: { ...r.scope } })),
    }; },
    accepted: () => read().entries.filter(r => r.state === 'accepted'),
    history: () => read().history.map(({ before, after, ...meta }) => meta),
    propose, remember, transition, rollback,
  };
}
