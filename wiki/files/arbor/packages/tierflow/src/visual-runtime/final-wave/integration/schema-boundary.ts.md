# File: packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9824 B |
| Lines | 183 |
| Hash | 06c450b37718 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PERSISTED_WORLD_SCHEMA | const | 31 | yes | export const PERSISTED_WORLD_SCHEMA = &#39;vivim.ui-world/1&#39; as const; |
| CANONICAL_VISUAL_SCHEMA | const | 33 | yes | export const CANONICAL_VISUAL_SCHEMA = UI_DOCUMENT_SCHEMA; |
| UiPayloadKind | type | 36 | yes | export type UiPayloadKind = &#39;persisted-world&#39; \| &#39;canonical-visual&#39; \| &#39;neither&#39;; |
| UiPayloadClassification | interface | 38 | yes | export interface UiPayloadClassification { |
| classifyUiPayload | function | 50 | yes | export function classifyUiPayload(payload: unknown): UiPayloadClassification { |
| nodes | const | 57 | no | const nodes = record.nodes, bindings = record.bindings, views = record.views; |
| BridgeRequirement | interface | 76 | yes | export interface BridgeRequirement { |
| BRIDGE_REQUIREMENTS | const | 87 | yes | export const BRIDGE_REQUIREMENTS: readonly BridgeRequirement[] = Object.freeze([ Object.freeze({ id: &#39;node-projection&#39;, requirement: &#39;Every persisted world object needs a deterministic projection to … |
| BridgeStatus | type | 111 | yes | export type BridgeStatus = &#39;BRIDGE_READY&#39; \| &#39;BRIDGE_NOT_READY&#39;; |
| BridgeAssessment | interface | 113 | yes | export interface BridgeAssessment { |
| assessWorldToCanonicalBridge | function | 133 | yes | export function assessWorldToCanonicalBridge(world: unknown, canonical: unknown): BridgeAssessment { |
| persistedWorldValid | variable | 134 | no | let persistedWorldValid = false; |
| canonicalClassification | const | 141 | no | const canonicalClassification = classifyUiPayload(canonical); |
| canonicalVisualValid | const | 142 | no | const canonicalVisualValid = canonicalClassification.kind === &#39;canonical-visual&#39;; |
| unsatisfied | const | 143 | no | const unsatisfied = BRIDGE_REQUIREMENTS.filter(r =&gt; !r.satisfied).map(r =&gt; r.id); |
| proveSchemasAreDistinct | function | 160 | yes | export function proveSchemasAreDistinct( world: unknown, canonical: CanonicalVisualDocument, ): Readonly&lt;{ worldIsNotCanonical: boolean; canonicalIsNotWorld: boolean; reasons: readonly string[] }&gt; { |
| reasons | const | 163 | no | const reasons: string[] = []; |
| worldClassification | const | 164 | no | const worldClassification = classifyUiPayload(world); |
| canonicalClassification | const | 165 | no | const canonicalClassification = classifyUiPayload(canonical); |
| worldIsNotCanonical | const | 166 | no | const worldIsNotCanonical = worldClassification.kind !== &#39;canonical-visual&#39;; |
| canonicalIsNotWorld | const | 167 | no | const canonicalIsNotWorld = canonicalClassification.kind !== &#39;persisted-world&#39;; |
| canonicalParsesAsWorld | variable | 171 | no | let canonicalParsesAsWorld = false; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../../ui/world.ts | import | 27 | [packages/tierflow/src/ui/world.ts](../../../ui/world.ts.md) |
| ../../../visual-runtime/document/schema.ts | import | 28 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../document/schema.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](./master.ts.md) | ./schema-boundary.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Master integration: the explicit boundary between the PERSISTED World UI
 * schema and the CANONICAL VISUAL UI document.
 *
 * These are two different documents that unfortunately share the type name
 * `UiDocument` in this repository:
 *
 *   PERSISTED WORLD UI DOCUMENT  src/ui/types.ts -> UiDocument
 *     schemaVersion: 1, world: UiWorld, objects, relationships, dataFlows.
 *     A graph of world objects. It is what the Host/Studio store persists as an
 *     immutable revision (UiRevision = { revision, document, contentHash }).
 *
 *   CANONICAL VISUAL UI DOCUMENT  src/visual-runtime/document/schema.ts -> UiDocument
 *     schema: 'vivim.ui-document/1', documentId, scope, revision, rootId,
 *     nodes, bindings, views. A component tree with a11y, action references and
 *     knowledge bindings. It is what Lane A validates, the Wave 3 renderer
 *     projects and the Wave 4 desktop/phone adapters consume.
 *
 * NEITHER IS A VALID INSTANCE OF THE OTHER. The master integration resolves the
 * distinction by naming both schemas, proving they cannot be confused, and
 * publishing the exact bridge contract that is still missing.
 *
 * This module is INERT. It invents no mapping, performs no migration, writes no
 * store and creates no second document authority. It reports the exact
 * obstruction instead of silently coercing one schema into the other.
 */
import { parseUiDocument } from '../../../ui/world.ts';
import { UI_DOCUMENT_SCHEMA, type UiDocument as CanonicalVisualDocument } from '../../../visual-runtime/document/schema.ts';

/** Exact identity of the persisted World UI document. */
export const PERSISTED_WORLD_SCHEMA = 'vivim.ui-world/1' as const;
/** Exact identity of the canonical visual UI document. */
export const CANONICAL_VISUAL_SCHEMA = UI_DOCUMENT_SCHEMA;

/** Which of the two schemas a payload actually is. */
export type UiPayloadKind = 'persisted-world' | 'canonical-visual' | 'neither';

export interface UiPayloadClassification {
  readonly kind: UiPayloadKind;
  /** Why the payload is not the other schema. Never a guess. */
  readonly reason: string;
  /** The canonical visual document digest, only when the payload is one. */
  readonly canonicalDigest: string | null;
}

/**
 * Classify a payload WITHOUT mutating it and without accepting a payload that
 * merely resembles the other schema.
 */
export function classifyUiPayload(payload: unknown): UiPayloadClassification {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { kind: 'neither', reason: 'PAYLOAD_IS_NOT_AN_OBJECT', canonicalDigest: null };
  }
  const record = payload as Record<string, unknown>;
  // The canonical visual document declares its schema explicitly.
  if (record.schema === CANONICAL_VISUAL_SCHEMA) {
    const nodes = record.nodes, bindings = record.bindings, views = record.views;
    if (!Array.isArray(nodes) || !Array.isArray(bindings) || !Array.isArray(views)) {
      return { kind: 'neither', reason: 'CANONICAL_VISUAL_SCHEMA_WITHOUT_CANONICAL_MEMBERS', canonicalDigest: null };
    }
    return { kind: 'canonical-visual', reason: 'DECLARES_CANONICAL_VISUAL_SCHEMA', canonicalDigest: null };
  }
  // The persisted World document is identified by its members, not by a schema tag.
  if (record.schemaVersion === 1 && Array.isArray(record.objects) &&
      Array.isArray(record.relationships) && Array.isArray(record.dataFlows) &&
      record.world !== null && typeof record.world === 'object') {
    return { kind: 'persisted-world', reason: 'HAS_WORLD_OBJECTS_RELATIONSHIPS_DATAFLOWS', canonicalDigest: null };
  }
  if (record.schema === CANONICAL_VISUAL_SCHEMA || Array.isArray(record.nodes)) {
    return { kind: 'neither', reason: 'CLAIMS_CANONICAL_VISUAL_MEMBERS_BUT_DOES_NOT_VALIDATE', canonicalDigest: null };
  }
  return { kind: 'neither', reason: 'NO_WORLD_OR_CANONICAL_MEMBER_SET', canonicalDigest: null };
}

/** The exact contract a World -> canonical visual bridge would have to satisfy. */
export interface BridgeRequirement {
  readonly id: string;
  readonly requirement: string;
  readonly satisfied: boolean;
  readonly evidence: string;
```

_First 80 of 184 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
