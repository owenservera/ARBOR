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
}

/**
 * The exact, named obstruction list. A bridge that ignores any of these would
 * silently lose semantics, so every one of them must be satisfied.
 */
export const BRIDGE_REQUIREMENTS: readonly BridgeRequirement[] = Object.freeze([
  Object.freeze({ id: 'node-projection', requirement:
    'Every persisted world object needs a deterministic projection to a canonical node type (stack/grid/text/card/button/collection/profile-card/project-card/timeline/chart).',
    satisfied: false, evidence: 'src/visual-runtime/document/schema.ts UI_DOCUMENT_NODE_TYPES has no mapping from UiObject.type' }),
  Object.freeze({ id: 'relationship-projection', requirement:
    'Every persisted relationship needs a deterministic projection to canonical nodes + bindings; the canonical document has no relationship primitive.',
    satisfied: false, evidence: 'canonical UiDocument has bindings (knowledge), not relationships' }),
  Object.freeze({ id: 'dataflow-exclusion', requirement:
    'Persisted dataFlows must be excluded or explicitly mapped; the canonical document has no dataFlow member and Studio edit already refuses dataFlow ops.',
    satisfied: false, evidence: 'lane-b studio-editing.ts refuses ops starting with dataFlow.' }),
  Object.freeze({ id: 'a11y-provenance', requirement:
    'Canonical nodes need role/name and focus order; the persisted World carries no accessibility metadata.',
    satisfied: false, evidence: 'src/ui/types.ts UiObject has no a11y member' }),
  Object.freeze({ id: 'action-binding', requirement:
    'Canonical actionRefs and knowledge bindings need a stable source; the persisted World carries no semantic or knowledge reference.',
    satisfied: false, evidence: 'src/ui/types.ts UiObject carries no actionRef or bindingRef' }),
  Object.freeze({ id: 'revision-identity', requirement:
    'The bridge needs a stable documentId + revision identity distinct from the World revision number.',
    satisfied: false, evidence: 'canonical documentId is a string identity; the World revision is a number' }),
  Object.freeze({ id: 'reverse-projection', requirement:
    'A canonical visual edit must be able to map back to the persisted World without inventing objects.',
    satisfied: false, evidence: 'lane-b StudioEditingAdapter parses only the persisted World (parseUiDocument)' }),
]);

export type BridgeStatus = 'BRIDGE_READY' | 'BRIDGE_NOT_READY';

export interface BridgeAssessment {
  readonly schema: 'vivim.final-wave.schema-boundary/1';
  readonly status: BridgeStatus;
  readonly requirements: readonly BridgeRequirement[];
  readonly unsatisfied: readonly string[];
  /** True only when the persisted World really does validate as a World document. */
  readonly persistedWorldValid: boolean;
  /** True only when the payload really does validate as a canonical visual document. */
  readonly canonicalVisualValid: boolean;
  readonly effectInvoked: false;
  readonly authorityCreated: false;
}

/**
 * Assess the World -> canonical visual bridge WITHOUT inventing a mapping.
 *
 * The persisted World is validated with the REAL `parseUiDocument`. The
 * canonical visual side is validated by structure, because the canonical
 * document's own validator is a lane-A owned module.
 */
export function assessWorldToCanonicalBridge(world: unknown, canonical: unknown): BridgeAssessment {
  let persistedWorldValid = false;
  try {
    parseUiDocument(world);
    persistedWorldValid = true;
  } catch {
    persistedWorldValid = false;
  }
  const canonicalClassification = classifyUiPayload(canonical);
  const canonicalVisualValid = canonicalClassification.kind === 'canonical-visual';
  const unsatisfied = BRIDGE_REQUIREMENTS.filter(r => !r.satisfied).map(r => r.id);
  return Object.freeze({
    schema: 'vivim.final-wave.schema-boundary/1' as const,
    status: unsatisfied.length === 0 ? 'BRIDGE_READY' as const : 'BRIDGE_NOT_READY' as const,
    requirements: BRIDGE_REQUIREMENTS,
    unsatisfied: Object.freeze(unsatisfied),
    persistedWorldValid, canonicalVisualValid,
    effectInvoked: false as const,
    authorityCreated: false as const,
  });
}

/**
 * Prove the two schemas are mutually exclusive. A payload is never accepted as
 * both, and a persisted World is never silently re-typed as a canonical
 * visual document.
 */
export function proveSchemasAreDistinct(
  world: unknown, canonical: CanonicalVisualDocument,
): Readonly<{ worldIsNotCanonical: boolean; canonicalIsNotWorld: boolean; reasons: readonly string[] }> {
  const reasons: string[] = [];
  const worldClassification = classifyUiPayload(world);
  const canonicalClassification = classifyUiPayload(canonical);
  const worldIsNotCanonical = worldClassification.kind !== 'canonical-visual';
  const canonicalIsNotWorld = canonicalClassification.kind !== 'persisted-world';
  if (!worldIsNotCanonical) reasons.push('PERSISTED_WORLD_CLASSIFIED_AS_CANONICAL_VISUAL');
  if (!canonicalIsNotWorld) reasons.push('CANONICAL_VISUAL_CLASSIFIED_AS_PERSISTED_WORLD');
  // The canonical document must not validate as a persisted World revision.
  let canonicalParsesAsWorld = false;
  try {
    parseUiDocument(canonical);
    canonicalParsesAsWorld = true;
  } catch {
    canonicalParsesAsWorld = false;
  }
  if (canonicalParsesAsWorld) reasons.push('CANONICAL_VISUAL_PARSES_AS_PERSISTED_WORLD');
  return Object.freeze({
    worldIsNotCanonical, canonicalIsNotWorld: !canonicalParsesAsWorld && canonicalIsNotWorld,
    reasons: Object.freeze(reasons),
  });
}
