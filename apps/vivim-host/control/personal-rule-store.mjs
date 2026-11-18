// Local-first personal command-rule state. Separate from Host effect authority:
// proposals are inert and acceptance REQUIRES a trusted owner-approval verifier.
// A receipt-shaped object is not sufficient. Never wire an AI/web request as verifier.
import { mkdirSync, readFileSync, renameSync, writeFileSync, linkSync, unlinkSync } from 'node:fs';
import { randomBytes, createHash } from 'node:crypto';
import path from 'node:path';
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
    new Set(data.entries.map(x => x.id)).size !== data.entries.length ||
    data.entries.some(x => !validatePersonalRule(x, catalog).ok) ||
    data.history.some(h => !h || typeof h !== 'object' || typeof h.ruleId !== 'string' ||
      typeof h.at !== 'string' || !Number.isSafeInteger(h.version))) return false;
  return true;
}
const resultShape = (s, rule) => ({
  schema: PERSONAL_STORE_SCHEMA, version: s.version, ruleId: rule.id,
  ruleRevision: rule.revision, state: rule.state, digest: digest(rule),
});
export function createPersonalRuleStore({
  dataRoot, catalog, verifyOwnerApproval = () => false,
  now = () => new Date().toISOString(),
} = {}) {
  if (typeof dataRoot !== 'string' || !dataRoot || !catalog || !Array.isArray(catalog.actions) ||
    typeof verifyOwnerApproval !== 'function' || typeof now !== 'function')
    throw fail('PERSONAL_STORE_INVALID_SETUP');
  const dir = path.join(dataRoot, 'control');
  const file = path.join(dir, 'personal-semantics.json');
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
      if (current.version !== expectedVersion) throw fail('PERSONAL_STORE_STALE');
      const next = mutator(current);
      if (!validData(next, catalog) || next.version !== current.version + 1)
        throw fail('PERSONAL_STORE_INVALID_TRANSITION');
      const temp = file + '.' + process.pid + '.' + randomBytes(6).toString('hex') + '.tmp';
      try {
        writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
        renameSync(temp, file);
      } finally { try { unlinkSync(temp); } catch {} }
      return next;
    } finally {
      try { unlinkSync(tempLock); } catch {}
      if (acquired) { try { unlinkSync(lockFile); } catch {} }
    }
  }
  function record(current, rule, op, previous, ownerReceiptId = null) {
    return {
      ...current, version: current.version + 1,
      entries: [...current.entries.filter(x => x.id !== rule.id), rule].sort((a,b) => a.id.localeCompare(b.id)),
      history: [...current.history, { version: current.version + 1, ruleId: rule.id,
        revision: rule.revision, op, before: previous ?? null, after: rule,
        ownerReceiptId, at: now() }].slice(-MAX_HISTORY),
    };
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
      created = candidate;
      return record(current, created, 'propose', null);
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
      if(!approval||verifyOwnerApproval(approval,subject)!==true)
        throw fail('PERSONAL_STORE_OWNER_APPROVAL_REQUIRED');
      changed={...trial,id:old?.id??'rule:'+randomBytes(12).toString('hex'),revision:old?old.revision+1:1};
      return record(current,changed,'remember',old,approval.receiptId);
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
      if (!approval || verifyOwnerApproval(approval, approvalSubject) !== true)
        throw fail('PERSONAL_STORE_OWNER_APPROVAL_REQUIRED');
      changed = { ...old, revision: old.revision + 1, state: nextState,
        ...(nextState === 'accepted' ? { source: 'explicit-owner' } : {}) };
      return record(current, changed, 'transition', old,
        typeof approval.receiptId === 'string' ? approval.receiptId.slice(0, 100) : null);
    }, expectedVersion);
    return resultShape(next, changed);
  }
  function rollback({ ruleId, toRevision, expectedVersion, approval } = {}) {
    let changed;
    const next = locked(current => {
      const old = current.entries.find(r => r.id === ruleId);
      if (!old) throw fail('PERSONAL_STORE_UNKNOWN_RULE');
      const past = [...current.history].reverse().find(h => h.ruleId === ruleId &&
        h.after?.revision === toRevision)?.after;
      if (!past || !validatePersonalRule(past, catalog).ok)
        throw fail('PERSONAL_STORE_UNKNOWN_REVISION');
      const approvalSubject = { ruleId, ruleDigest: digest(old), nextState: past.state,
        rollbackTo: toRevision, storeVersion: current.version, catalogVersion: catalog.version };
      if (!approval || verifyOwnerApproval(approval, approvalSubject) !== true)
        throw fail('PERSONAL_STORE_OWNER_APPROVAL_REQUIRED');
      // Rollback creates a new revision, preserving history and preventing replay of old approval.
      changed = { ...past, revision: old.revision + 1 };
      return record(current, changed, 'rollback', old,
        typeof approval.receiptId === 'string' ? approval.receiptId.slice(0, 100) : null);
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
