/**
 * P5 safe-subset World → canonical visual projection.
 * Never opens the store, publishes, executes actions, or treats World edges as KB bindings.
 * Everything not represented in the canonical tree remains in a revision-bound
 * source snapshot; visual edits return ONLY inert existing World UiOperations.
 */
import { parseUiDocument, type UiOperation } from '../../../ui/world.ts';
import { contentHash, canonicalJson, sha256Hex } from '../../../ui/hash.ts';
import type { UiRevision, UiObject, UiTransform } from '../../../ui/types.ts';
import { UI_DOCUMENT_SCHEMA, type UiDocument as VisualDocument, type UiDocumentNode } from '../../document/schema.ts';
import { validateUiDocument } from '../../document/validate.ts';

export type BridgeFailure =
  | 'INVALID_WORLD' | 'SOURCE_HASH_MISMATCH' | 'FOREIGN_SCOPE' | 'REVOKED'
  | 'UNSUPPORTED_OBJECT' | 'UNSAFE_VISUAL' | 'LIMIT_EXCEEDED'
  | 'STALE_REVISION' | 'STALE_PROJECTION' | 'UNSUPPORTED_EDIT';
export type BridgeResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; code: BridgeFailure; detail: string }>;
const refuse = (code: BridgeFailure, detail: string): BridgeResult<never> =>
  Object.freeze({ ok: false as const, code, detail });
const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const VISUAL_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Supplied by an independently authenticated caller, not inferred from World props. */
export interface BridgePrincipal {
  readonly ownerRef: string;
  readonly workspaceRef: string;
  readonly worldId: string;
  readonly active: boolean;
}
export interface BridgeProjection {
  readonly document: VisualDocument;
  /** The only source of otherwise unrepresentable World semantics. */
  readonly source: UiRevision;
  readonly sourceDigest: string;
  readonly visualDigest: string;
  readonly diagnostics: readonly string[];
  readonly readOnly: true;
  readonly effectInvoked: false;
}
function mapping(object: UiObject): 'text' | 'card' | null {
  // Closed mapping, not inferred from props or titles.
  if (object.kind !== 'static') return null;
  if (object.shape === 'text' && (object.layer === 'content' || object.layer === 'overlay')) return 'text';
  if ((object.shape === 'box' || object.shape === 'plane') &&
      (object.layer === 'content' || object.layer === 'structure')) return 'card';
  return null;
}
function objectId(object: UiObject): string { return 'obj_' + object.id; }

/**
 * Projects a pinned immutable World revision; unsupported shape/layer/kind,
 * unsafe text and visual limits fail closed without mutating the World.
 * No World contains/links/drives/mirrors edge is recast as a visual child or KB ref.
 */
export function projectWorldRevision(source: UiRevision, principal: BridgePrincipal): BridgeResult<BridgeProjection> {
  if (!principal.active) return refuse('REVOKED', 'Caller scope revoked');
  if (!ID.test(principal.ownerRef) || !ID.test(principal.workspaceRef) ||
      !VISUAL_ID.test(principal.worldId)) return refuse('FOREIGN_SCOPE', 'Unverified scope identifiers');
  let parsed: UiRevision['document'];
  try { parsed = parseUiDocument(source.document); }
  catch { return refuse('INVALID_WORLD', 'Real World validator refused the source'); }
  if (parsed.world.id !== principal.worldId) return refuse('FOREIGN_SCOPE', 'World identity mismatch');
  if (!Number.isSafeInteger(source.revision) || source.revision < 0 || source.revision > 1e9)
    return refuse('INVALID_WORLD', 'Revision out of range');
  if (contentHash(parsed) !== source.contentHash) return refuse('SOURCE_HASH_MISMATCH', 'Source content hash differs');
  if (parsed.objects.length > 63) return refuse('LIMIT_EXCEEDED', 'Root plus objects exceeds 64 nodes');
  const rootId = 'world_root';
  const children: string[] = [];
  const nodes: UiDocumentNode[] = [];
  for (const object of parsed.objects) {
    const type = mapping(object);
    if (!type) return refuse('UNSUPPORTED_OBJECT', object.id + ': ' + object.kind + '/' + object.shape + '/' + object.layer);
    const id = objectId(object);
    if (!ID.test(id) || id === rootId) return refuse('UNSUPPORTED_OBJECT', 'Unrepresentable node identity: ' + object.id);
    const title = object.title ?? object.id;
    if (type === 'text') {
      nodes.push({ id, type: 'text', children: [], props: { value: title },
        a11y: { role: 'text', name: title } });
    } else {
      nodes.push({ id, type: 'card', children: [], props: { title },
        a11y: { role: 'region', name: title } });
    }
    children.push(id);
  }
  const document: VisualDocument = {
    schema: UI_DOCUMENT_SCHEMA,
    documentId: 'world_' + parsed.world.id,
    scope: { ownerRef: principal.ownerRef, workspaceRef: principal.workspaceRef },
    revision: source.revision, rootId,
    nodes: [{ id: rootId, type: 'stack', children, props: { direction: 'vertical', gap: 'md' },
      a11y: { role: 'main', name: parsed.world.title } }, ...nodes],
    bindings: [], views: [
      { id: 'view_phone', version: 1, kind: '2d', viewport: 'phone' },
      { id: 'view_desktop', version: 1, kind: '2d', viewport: 'desktop' },
    ],
  };
  const checked = validateUiDocument(document);
  if (!checked.ok) return refuse('UNSAFE_VISUAL', checked.diagnostics.map(d => d.path + ':' + d.code).join(','));
  const sourceDigest = sha256Hex(canonicalJson({
    worldId: parsed.world.id, revision: source.revision, contentHash: source.contentHash,
    ownerRef: principal.ownerRef, workspaceRef: principal.workspaceRef,
  }));
  return { ok: true, value: Object.freeze({
    document: checked.document, source, sourceDigest,
    visualDigest: sha256Hex(canonicalJson(checked.document)),
    diagnostics: Object.freeze([
      'World relationships and dataFlows excluded from render, retained only in pinned original revision',
      'World transforms, layer, kind, shape and props retained in original revision; 2D geometry not inferred',
      'No actionRefs, no knowledge bindings, no executable callbacks',
    ]),
    readOnly: true as const, effectInvoked: false as const,
  }) };
}
export interface ReverseEditInput {
  readonly projection: BridgeProjection;
  readonly principal: BridgePrincipal;
  readonly currentRevision: number;
  readonly currentContentHash: string;
  readonly expectedVisualDigest: string;
  readonly edit: Readonly<{ kind: 'move'; objectId: string; transform: UiTransform }>;
}
export interface ReverseCandidate {
  readonly expectedRevision: number;
  readonly expectedContentHash: string;
  readonly operation: UiOperation;
  readonly effectsPerformed: false;
  readonly requiresOwnerReview: true;
}
/** Strictly inert translation: caller must submit through existing owner-reviewed CAS. */
export function planWorldVisualEdit(input: ReverseEditInput): BridgeResult<ReverseCandidate> {
  const { projection: p, principal } = input;
  if (!principal.active) return refuse('REVOKED', 'Principal revoked');
  if (principal.ownerRef !== p.document.scope.ownerRef ||
      principal.workspaceRef !== p.document.scope.workspaceRef ||
      principal.worldId !== p.source.document.world.id) return refuse('FOREIGN_SCOPE', 'Cross-scope edit');
  if (contentHash(p.source.document) !== p.source.contentHash) return refuse('STALE_PROJECTION', 'Pinned World snapshot changed');
  if (input.currentRevision !== p.source.revision ||
      input.currentContentHash !== p.source.contentHash) return refuse('STALE_REVISION', 'World CAS is stale');
  if (input.expectedVisualDigest !== p.visualDigest ||
      sha256Hex(canonicalJson(p.document)) !== p.visualDigest)
    return refuse('STALE_PROJECTION', 'Visual snapshot changed');
  if (input.edit.kind !== 'move') return refuse('UNSUPPORTED_EDIT', 'Only 3D move is mapped; titles/props need product decisions');
  const object = p.source.document.objects.find(o => o.id === input.edit.objectId);
  if (!object || !mapping(object)) return refuse('UNSUPPORTED_EDIT', 'No mapped World object');
  const t = input.edit.transform;
  if (!t || ![t.position, t.rotation, t.scale].every(v => v &&
    [v.x, v.y, v.z].every(n => typeof n === 'number' && Number.isFinite(n))))
    return refuse('UNSUPPORTED_EDIT', 'Invalid transform');
  return { ok: true, value: Object.freeze({
    expectedRevision: p.source.revision, expectedContentHash: p.source.contentHash,
    operation: { op: 'object.move' as const, objectId: object.id, transform: t },
    effectsPerformed: false as const, requiresOwnerReview: true as const,
  }) };
}
