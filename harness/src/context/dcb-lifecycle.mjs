// DCB v2 definition planning — PURE CONTRACT ONLY.
// No storage, raw private content, graph writer, disclosure grant or provider effect.
// Host is responsible for storing definitions in its existing versioned authority,
// checking disclosure, and materializing via the existing DCB composer.
export const DCB_DEFINITION_SCHEMA = 'vivim.dcb-definition/1';
export const DCB_LIFECYCLES = Object.freeze(['ephemeral', 'session', 'persistent', 'composite']);
export const DCB_DEFINITION_STATUSES = Object.freeze(['active', 'suspended', 'retired']);

const REF = /^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/;
const SHA = /^[a-f0-9]{64}$/;
const fail = (code, detail) => Object.assign(new Error(detail), { code });

function checkRef(value, name) {
  if (typeof value !== 'string' || !REF.test(value)) {
    throw fail('DCB_DEFINITION_REF', `Invalid ${name}`);
  }
  return value;
}
function checkIso(value, name) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)
      || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw fail('DCB_DEFINITION_TIME', `Invalid ${name}`);
  }
  return value;
}
function refs(values, name, { required = false } = {}) {
  if (!Array.isArray(values) || values.length > 128) throw fail('DCB_DEFINITION_REFS', `Invalid ${name}`);
  const entries = values.map(v => checkRef(v, name));
  if (required && !entries.length) throw fail('DCB_DEFINITION_REFS', `Empty ${name}`);
  return [...new Set(entries)].sort();
}
function ensureDefinition(value) {
  if (!value || value.schema !== DCB_DEFINITION_SCHEMA || !Number.isSafeInteger(value.revision)
      || value.revision < 1) throw fail('DCB_DEFINITION_INVALID', 'Expected versioned DCB definition');
  return value;
}
function definitionFields(input) {
  const mode = input.mode;
  if (!DCB_LIFECYCLES.includes(mode)) throw fail('DCB_DEFINITION_MODE', 'Unknown lifecycle mode');
  const createdAt = checkIso(input.createdAt, 'createdAt');
  const expiresAt = input.expiresAt == null ? null : checkIso(input.expiresAt, 'expiresAt');
  if ((mode === 'ephemeral' || mode === 'session') && !expiresAt) {
    throw fail('DCB_DEFINITION_EXPIRY', 'Short-lived bundles require expiry');
  }
  if (expiresAt && expiresAt <= createdAt) throw fail('DCB_DEFINITION_EXPIRY', 'Expiry must follow creation');
  const sourceRefs = refs(input.sourceRefs ?? [], 'sourceRefs');
  const parentRefs = refs(input.parentRefs ?? [], 'parentRefs');
  if (mode === 'composite' && (parentRefs.length < 2 || sourceRefs.length)) {
    throw fail('DCB_DEFINITION_COMPOSITE', 'Composite stores parent refs only, never copied source bodies');
  }
  if (mode !== 'composite' && parentRefs.length) {
    throw fail('DCB_DEFINITION_COMPOSITE', 'Non-composites cannot own parent refs');
  }
  const id = checkRef(input.id, 'bundle id');
  if (parentRefs.includes(id)) throw fail('DCB_DEFINITION_CYCLE', 'Self-parent not permitted');
  return {
    id, ownerRef: checkRef(input.ownerRef, 'ownerRef'), mode,
    activityRef: input.activityRef == null ? null : checkRef(input.activityRef, 'activityRef'),
    flavorRefs: refs(input.flavorRefs, 'flavorRefs', { required: true }),
    sourceRefs, parentRefs,
    policyVersion: checkRef(input.policyVersion, 'policyVersion'),
    expiresAt, createdAt,
  };
}
// Definitions hold identifiers, not private fact text, grant tokens, or source bodies.
export function createDcbDefinition(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw fail('DCB_DEFINITION_INVALID', 'Object required');
  }
  const fields = definitionFields(input);
  return Object.freeze({
    schema: DCB_DEFINITION_SCHEMA, ...fields,
    status: 'active', revision: 1, updatedAt: fields.createdAt,
  });
}
export function reviseDcbDefinition(definition, patch, { expectedRevision, at } = {}) {
  const current = ensureDefinition(definition);
  checkIso(at, 'at');
  if (!Number.isSafeInteger(expectedRevision) || current.revision !== expectedRevision) {
    throw fail('DCB_DEFINITION_CONFLICT', 'Revision mismatch');
  }
  if (current.status === 'retired') throw fail('DCB_DEFINITION_RETIRED', 'Retirement is terminal');
  const allowed = new Set(['activityRef', 'flavorRefs', 'sourceRefs', 'parentRefs', 'policyVersion', 'expiresAt', 'status']);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch) ||
      Object.keys(patch).some(k => !allowed.has(k))) {
    throw fail('DCB_DEFINITION_PATCH', 'Unknown or immutable patch field');
  }
  const status = patch.status ?? current.status;
  if (!DCB_DEFINITION_STATUSES.includes(status)) throw fail('DCB_DEFINITION_STATUS', 'Unknown status');
  const fields = definitionFields({ ...current, ...patch });
  if (at < current.updatedAt) throw fail('DCB_DEFINITION_TIME', 'Updates must be monotonic');
  if (status === 'active' && fields.expiresAt && fields.expiresAt <= at) {
    throw fail('DCB_DEFINITION_EXPIRY', 'Expired bundle cannot be reactivated');
  }
  const changed = Object.keys(patch).some(k => JSON.stringify(current[k]) !== JSON.stringify(k === 'status' ? status : fields[k]));
  if (!changed) return current;
  return Object.freeze({
    schema: DCB_DEFINITION_SCHEMA, ...fields,
    status, revision: current.revision + 1, updatedAt: at,
  });
}
// This is a readiness *projection*, not permission to send.
export function assessDcbDefinition(definition, {
  at, changedSourceRefs = [], revokedSourceRefs = [], changedParentRefs = [],
  grantRevoked = false,
} = {}) {
  const def = ensureDefinition(definition);
  checkIso(at, 'at');
  const changed = new Set(refs(changedSourceRefs, 'changedSourceRefs'));
  const revoked = new Set(refs(revokedSourceRefs, 'revokedSourceRefs'));
  const changedParents = new Set(refs(changedParentRefs, 'changedParentRefs'));
  const reasons = [];
  if (def.status === 'retired') reasons.push('retired');
  if (def.status === 'suspended') reasons.push('suspended');
  if (def.expiresAt && at >= def.expiresAt) reasons.push('expired');
  if (grantRevoked === true) reasons.push('grant_revoked');
  if (def.sourceRefs.some(r => revoked.has(r))) reasons.push('source_revoked');
  if (def.sourceRefs.some(r => changed.has(r))) reasons.push('source_changed');
  if (def.parentRefs.some(r => changedParents.has(r))) reasons.push('parent_changed');
  const blocked = reasons.some(r => ['retired', 'suspended', 'expired', 'grant_revoked', 'source_revoked'].includes(r));
  return Object.freeze({
    status: blocked ? 'blocked' : reasons.length ? 'stale' : 'candidate_current',
    reasons, isSendAuthorized: false,
  });
}
// A composite references parent *definitions*. It cannot merge grants, facts or permissions.
// Those are resolved and re-verified against the Host's current source authority at send time.
export function createCompositeDcbDefinition({ id, parents, flavorRefs, createdAt,
  policyVersion, activityRef = null, expiresAt = null } = {}) {
  if (!Array.isArray(parents) || parents.length < 2) {
    throw fail('DCB_DEFINITION_COMPOSITE', 'At least two parent definitions required');
  }
  parents.forEach(ensureDefinition);
  const ownerRef = parents[0].ownerRef;
  if (parents.some(p => p.ownerRef !== ownerRef || p.status !== 'active')) {
    throw fail('DCB_DEFINITION_COMPOSITE', 'Cross-owner or inactive parent');
  }
  const parentRefs = refs(parents.map(p => p.id), 'parentRefs', { required: true });
  if (parentRefs.length < 2) throw fail('DCB_DEFINITION_COMPOSITE', 'Two different parents required');
  return createDcbDefinition({
    id, ownerRef, mode: 'composite', activityRef, flavorRefs, sourceRefs: [],
    parentRefs, policyVersion, createdAt, expiresAt,
  });
}
// A deterministic metadata-only input for the EXISTING Host composer/manifest hash.
// Exact grants, private content, source hashes and journal status still require Host checks.
export function dcbMaterializationInput({ definition, destinationRef, requestDigest, policyDigest,
  disclosureDigest, sourceRevisions, parentMaterializations = [] } = {}) {
  const def = ensureDefinition(definition);
  checkRef(destinationRef, 'destinationRef');
  for (const [name, value] of Object.entries({ requestDigest, policyDigest, disclosureDigest })) {
    if (typeof value !== 'string' || !SHA.test(value)) throw fail('DCB_DEFINITION_DIGEST', `Invalid ${name}`);
  }
  if (!Array.isArray(sourceRevisions) || sourceRevisions.length > 250) {
    throw fail('DCB_DEFINITION_SOURCE_REVISION', 'Bounded source revisions required');
  }
  const sourceRows = sourceRevisions.map(row => {
    if (!row || typeof row !== 'object') throw fail('DCB_DEFINITION_SOURCE_REVISION', 'Bad source revision');
    checkRef(row.ref, 'source ref');
    if (typeof row.sha256 !== 'string' || !SHA.test(row.sha256)) {
      throw fail('DCB_DEFINITION_DIGEST', 'Bad source digest');
    }
    return { ref: row.ref, revision: checkRef(row.revision, 'source revision'), sha256: row.sha256 };
  }).sort((a, b) => a.ref.localeCompare(b.ref) || a.revision.localeCompare(b.revision));
  if (new Set(sourceRows.map(x => x.ref)).size !== sourceRows.length) {
    throw fail('DCB_DEFINITION_SOURCE_REVISION', 'Conflicting or duplicate source refs');
  }
  const parentRows = refs(parentMaterializations, 'parentMaterializations');
  return Object.freeze({
    schema: 'vivim.dcb-materialization-input/1',
    bundleId: def.id, bundleRevision: def.revision, definitionStatus: def.status,
    destinationRef, requestDigest, policyDigest, disclosureDigest,
    sourceRevisions: sourceRows, parentMaterializations: parentRows,
    authority: 'read_only_projection',
  });
}
