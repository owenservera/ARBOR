# File: harness/src/context/dcb-lifecycle.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-lifecycle.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9776 B |
| Lines | 176 |
| Hash | 79405251b57c |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_DEFINITION_SCHEMA | const | 5 | yes | export const DCB_DEFINITION_SCHEMA = &#39;vivim.dcb-definition/1&#39;; |
| DCB_LIFECYCLES | const | 6 | yes | export const DCB_LIFECYCLES = Object.freeze([&#39;ephemeral&#39;, &#39;session&#39;, &#39;persistent&#39;, &#39;composite&#39;]); |
| DCB_DEFINITION_STATUSES | const | 7 | yes | export const DCB_DEFINITION_STATUSES = Object.freeze([&#39;active&#39;, &#39;suspended&#39;, &#39;retired&#39;]); |
| REF | const | 9 | no | const REF = /^[A-Za-z0-9][A-Za-z0-9_.:/@#-]{0,191}$/; |
| SHA | const | 10 | no | const SHA = /^[a-f0-9]{64}$/; |
| fail | function | 11 | no | const fail = (code, detail) =&gt; Object.assign(new Error(detail), { code }); |
| checkRef | function | 13 | no | function checkRef(value, name) { |
| checkIso | function | 19 | no | function checkIso(value, name) { |
| refs | function | 26 | no | function refs(values, name, { required = false } = {}) { |
| entries | const | 28 | no | const entries = values.map(v =&gt; checkRef(v, name)); |
| ensureDefinition | function | 32 | no | function ensureDefinition(value) { |
| definitionFields | function | 37 | no | function definitionFields(input) { |
| mode | const | 38 | no | const mode = input.mode; |
| createdAt | const | 40 | no | const createdAt = checkIso(input.createdAt, &#39;createdAt&#39;); |
| expiresAt | const | 41 | no | const expiresAt = input.expiresAt == null ? null : checkIso(input.expiresAt, &#39;expiresAt&#39;); |
| sourceRefs | const | 46 | no | const sourceRefs = refs(input.sourceRefs ?? [], &#39;sourceRefs&#39;); |
| parentRefs | const | 47 | no | const parentRefs = refs(input.parentRefs ?? [], &#39;parentRefs&#39;); |
| id | const | 54 | no | const id = checkRef(input.id, &#39;bundle id&#39;); |
| createDcbDefinition | function | 66 | yes | export function createDcbDefinition(input) { |
| fields | const | 70 | no | const fields = definitionFields(input); |
| reviseDcbDefinition | function | 76 | yes | export function reviseDcbDefinition(definition, patch, { expectedRevision, at } = {}) { |
| current | const | 77 | no | const current = ensureDefinition(definition); |
| allowed | const | 83 | no | const allowed = new Set([&#39;activityRef&#39;, &#39;flavorRefs&#39;, &#39;sourceRefs&#39;, &#39;parentRefs&#39;, &#39;policyVersion&#39;, &#39;expiresAt&#39;, &#39;status&#39;]); |
| status | const | 88 | no | const status = patch.status ?? current.status; |
| fields | const | 90 | no | const fields = definitionFields({ ...current, ...patch }); |
| changed | const | 95 | no | const changed = Object.keys(patch).some(k =&gt; JSON.stringify(current[k]) !== JSON.stringify(k === &#39;status&#39; ? status : fields[k])); |
| assessDcbDefinition | function | 103 | yes | export function assessDcbDefinition(definition, { at, changedSourceRefs = [], revokedSourceRefs = [], changedParentRefs = [], grantRevoked = false, } = {}) { |
| changed | const | 109 | no | const changed = new Set(refs(changedSourceRefs, &#39;changedSourceRefs&#39;)); |
| revoked | const | 110 | no | const revoked = new Set(refs(revokedSourceRefs, &#39;revokedSourceRefs&#39;)); |
| changedParents | const | 111 | no | const changedParents = new Set(refs(changedParentRefs, &#39;changedParentRefs&#39;)); |
| reasons | const | 112 | no | const reasons = []; |
| blocked | const | 120 | no | const blocked = reasons.some(r =&gt; [&#39;retired&#39;, &#39;suspended&#39;, &#39;expired&#39;, &#39;grant_revoked&#39;, &#39;source_revoked&#39;].includes(r)); |
| createCompositeDcbDefinition | function | 128 | yes | export function createCompositeDcbDefinition({ id, parents, flavorRefs, createdAt, policyVersion, activityRef = null, expiresAt = null } = {}) { |
| ownerRef | const | 134 | no | const ownerRef = parents[0].ownerRef; |
| parentRefs | const | 138 | no | const parentRefs = refs(parents.map(p =&gt; p.id), &#39;parentRefs&#39;, { required: true }); |
| dcbMaterializationInput | function | 147 | yes | export function dcbMaterializationInput({ definition, destinationRef, requestDigest, policyDigest, disclosureDigest, sourceRevisions, parentMaterializations = [] } = {}) { |
| sourceRows | const | 157 | no | const sourceRows = sourceRevisions.map(row =&gt; { if (!row \|\| typeof row !== &#39;object&#39;) throw fail(&#39;DCB_DEFINITION_SOURCE_REVISION&#39;, &#39;Bad source revision&#39;); checkRef(row.ref, &#39;source ref&#39;); if (typeof r… |
| parentRows | const | 168 | no | const parentRows = refs(parentMaterializations, &#39;parentMaterializations&#39;); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/context/dcb-lifecycle.test.mjs](../../test/context/dcb-lifecycle.test.mjs.md) | ../../src/context/dcb-lifecycle.mjs |
| [studio/src/agents/dcb-definition-store.mjs](../../../studio/src/agents/dcb-definition-store.mjs.md) | ../../../harness/src/context/dcb-lifecycle.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 177 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
