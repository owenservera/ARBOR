/**
 * Wave 3 Lane A — inert, revision-bound A -> B/D reference identity transport.
 * The Lane A validator is the sole document-shape authority. This module does
 * not authorize an action, authenticate provenance, read the KB, or dispatch.
 * B owns component/prop mapping; D owns rendering. Neither receives a grant.
 */
import { canonicalJson, sha256Hex } from '../../ui/hash.ts';
import { validateUiDocument, type UiDocumentValidationOptions } from './validate.ts';
import { UI_DOCUMENT_SCHEMA, type UiDocument, type UiDocumentNode, type UiDocumentBinding,
  type UiActionReference } from './schema.ts';

export const WAVE3_ACTION_SEMANTICS_SCHEMA = 'vivim.wave3-action-semantics/1' as const;
export const WAVE3_REFERENCE_FIELDS = Object.freeze([
  Object.freeze({ canonical: 'nodes[].actionRefs[].{id,version}', projected: 'rendererDocument.nodes[].actionRefs[] / componentRefs[].actionRefs[]', reversible: true }),
  Object.freeze({ canonical: 'nodes[].bindingRefs[] + bindings[].{id,version,nodeId,knowledgeRef,provenanceRef,readScope,availability}', projected: 'rendererDocument.nodes[].bindingRefs[] / componentRefs[].bindingRefs[]', reversible: true }),
  Object.freeze({ canonical: 'nodes[].id / children[]', projected: 'rendererDocument.nodes[].id / componentRefs[].{id,children}', reversible: true }),
]);

/** Trusted caller-provided equality pins. They are NOT authority or evidence of a KB read. */
export interface Wave3BindingPin {
  readonly id: string;
  readonly version: number;
  readonly nodeId: string;
  readonly knowledgeRef: string;
  readonly provenanceRef: string;
}
export interface Wave3SemanticsOptions extends UiDocumentValidationOptions {
  /** Required CAS revision of the canonical UI document, not an action grant. */
  readonly expectedRevision: number;
  /** Exact version/provenance equality pins from a trusted fixture/broker. */
  readonly knownBindings: readonly Wave3BindingPin[];
}
export type Wave3Reference =
  | Readonly<{ kind: 'action'; alias: string; nodeId: string; id: string; version: number; inert: true }>
  | Readonly<{ kind: 'binding'; alias: string; nodeId: string; id: string; version: number;
      knowledgeRef: string; provenanceRef: string; readScope: 'owner'; availability: 'present'; inert: true }>;
export interface Wave3ComponentRefs {
  /** B-safe ID; canonical id remains available ONLY in the sealed side table. */
  readonly id: string;
  readonly canonicalNodeId: string;
  readonly children: readonly string[];
  readonly actionRefs: readonly string[];
  readonly bindingRefs: readonly string[];
}
export type Wave3RendererNode = Omit<UiDocumentNode, 'actionRefs' | 'bindingRefs'> & {
  readonly actionRefs: readonly string[];
  readonly bindingRefs: readonly string[];
};
export type Wave3RendererDocument = Omit<UiDocument, 'nodes' | 'bindings'> & {
  readonly nodes: readonly Wave3RendererNode[];
  /** KB provenance is deliberately not passed into the renderer. */
  readonly bindings: readonly [];
};
export interface Wave3ActionSemantics {
  readonly schema: typeof WAVE3_ACTION_SEMANTICS_SCHEMA;
  readonly readOnly: true;
  readonly executable: false;
  readonly documentId: string;
  readonly revision: number;
  /** SHA-256 checksum is a change detector, NOT a signature or authorization. */
  readonly documentDigest: string;
  /** Private canonical source: never serialize it to B/D or another device. */
  readonly canonical: UiDocument;
  /** Display-only D input; its string aliases carry no permission. */
  readonly rendererDocument: Wave3RendererDocument;
  /** B's upcoming mapping can use these IDs/refs without inventing versions. */
  readonly componentRefs: readonly Wave3ComponentRefs[];
  /** Private version/provenance side table; do not send it to a renderer. */
  readonly references: readonly Wave3Reference[];
  readonly fieldMap: typeof WAVE3_REFERENCE_FIELDS;
}
export type Wave3SemanticsFailureCode =
  | 'INVALID_OPTIONS' | 'INVALID_DOCUMENT' | 'STALE_DOCUMENT' | 'UNBOUND_BINDING'
  | 'STALE_BINDING' | 'BINDING_UNAVAILABLE' | 'INCOMPATIBLE_CARDINALITY' | 'REFERENCE_COLLISION';
export type Wave3SemanticsResult =
  | Readonly<{ ok: true; value: Wave3ActionSemantics }>
  | Readonly<{ ok: false; readOnly: true; code: Wave3SemanticsFailureCode;
      reason: string; validationCode?: string }>;

const fail = (code: Wave3SemanticsFailureCode, reason: string, validationCode?: string): Wave3SemanticsResult =>
  Object.freeze({ ok: false, readOnly: true, code, reason, ...(validationCode ? { validationCode } : {}) });
const freeze = <T>(value: T): T => Object.freeze(value);
const key = (id: string, version: number): string => `${id.length}:${id}@${version}`;
const pinKey = (pin: Wave3BindingPin): string => key(pin.id, pin.version);

/** Identifier is stable under node-array reordering, but changes across revisions. */
function alias(kind: 'node' | 'action' | 'binding', doc: UiDocument, nodeId: string, id: string, version: number): string {
  const descriptor = JSON.stringify([WAVE3_ACTION_SEMANTICS_SCHEMA, kind, doc.scope.ownerRef,
    doc.scope.workspaceRef, doc.documentId, doc.revision, nodeId, id, version]);
  return `${kind === 'node' ? 'n' : kind === 'action' ? 'a' : 'b'}_${sha256Hex(descriptor).slice(0, 32)}`;
}

/** Strict, whole-document refusal. Input is never modified or executed. */
export function projectWave3ActionSemantics(input: unknown, options: Wave3SemanticsOptions): Wave3SemanticsResult {
  // Guard the options before passing an allowlist to validator A.
  if (!options || !Number.isSafeInteger(options.expectedRevision) || options.expectedRevision < 0 ||
    !Array.isArray(options.knownBindings) || !Array.isArray(options.knownActions) ||
    options.knownBindings.length > 128 || options.knownActions.length > 512) {
    return fail('INVALID_OPTIONS', 'Explicit revision and bounded action/binding pins are required');
  }
  const checked = validateUiDocument(input, { knownActions: options.knownActions });
  if (!checked.ok) return fail('INVALID_DOCUMENT', 'Lane A refused the document', checked.diagnostics[0]?.code);
  const doc = checked.document;
  if (doc.schema !== UI_DOCUMENT_SCHEMA) return fail('INVALID_DOCUMENT', 'Unsupported canonical schema');
  if (doc.revision !== options.expectedRevision) return fail('STALE_DOCUMENT', 'Document revision does not match the expected revision');
  const pins = new Map<string, Wave3BindingPin>();
  for (const pin of options.knownBindings) {
    if (!pin || typeof pin.id !== 'string' || !Number.isSafeInteger(pin.version) || pin.version < 1 ||
      typeof pin.nodeId !== 'string' || typeof pin.knowledgeRef !== 'string' || typeof pin.provenanceRef !== 'string') {
      return fail('INVALID_OPTIONS', 'Malformed binding pin');
    }
    const k = pinKey(pin);
    if (pins.has(k)) return fail('INVALID_OPTIONS', 'Duplicate binding pin');
    pins.set(k, pin);
  }
  const seenAliases = new Set<string>();
  const reserve = (a: string): boolean => {
    if (seenAliases.has(a)) return false;
    seenAliases.add(a);
    return true;
  };
  const nodeAliases = new Map(doc.nodes.map(n => [n.id, alias('node', doc, n.id, n.id, 0)]));
  if (new Set(nodeAliases.values()).size !== doc.nodes.length) return fail('REFERENCE_COLLISION', 'Node alias collision');
  const bindings = new Map<string, UiDocumentBinding>(doc.bindings.map(b => [b.id, b]));
  const refs: Wave3Reference[] = [];
  const rendered: Wave3RendererNode[] = [];
  const components: Wave3ComponentRefs[] = [];
  for (const node of doc.nodes) {
    const actionRefs: string[] = [];
    const bindingRefs: string[] = [];
    if ((node.actionRefs?.length ?? 0) > 1 || (node.bindingRefs?.length ?? 0) > 4) {
      return fail('INCOMPATIBLE_CARDINALITY', 'Lane B accepts at most one action and four bindings per node');
    }
    for (const action of node.actionRefs ?? []) {
      const a = alias('action', doc, node.id, action.id, action.version);
      if (!reserve(a)) return fail('REFERENCE_COLLISION', 'Duplicate action identity/alias');
      actionRefs.push(a);
      refs.push(freeze({ kind: 'action', alias: a, nodeId: node.id, id: action.id, version: action.version, inert: true }));
    }
    for (const bindingId of node.bindingRefs ?? []) {
      const binding = bindings.get(bindingId);
      if (!binding) return fail('UNBOUND_BINDING', 'Unknown binding reference');
      const pin = pins.get(key(binding.id, binding.version));
      if (!pin) return fail('STALE_BINDING', 'Missing exact binding version pin');
      if (pin.nodeId !== binding.nodeId || pin.knowledgeRef !== binding.knowledgeRef || pin.provenanceRef !== binding.provenanceRef) {
        return fail('UNBOUND_BINDING', 'Binding provenance or target differs from pinned contract');
      }
      if (binding.availability !== 'present') return fail('BINDING_UNAVAILABLE', 'Missing, stale or revoked binding cannot be projected as present');
      const a = alias('binding', doc, node.id, binding.id, binding.version);
      if (!reserve(a)) return fail('REFERENCE_COLLISION', 'Duplicate binding identity/alias');
      bindingRefs.push(a);
      refs.push(freeze({ kind: 'binding', alias: a, nodeId: node.id, id: binding.id,
        version: binding.version, knowledgeRef: binding.knowledgeRef, provenanceRef: binding.provenanceRef,
        readScope: 'owner', availability: 'present', inert: true }));
    }
    rendered.push(freeze({ ...node, actionRefs: freeze(actionRefs), bindingRefs: freeze(bindingRefs) }));
    components.push(freeze({ id: nodeAliases.get(node.id)!, canonicalNodeId: node.id,
      children: freeze(node.children.map(c => nodeAliases.get(c)!)),
      actionRefs: freeze([...actionRefs]), bindingRefs: freeze([...bindingRefs]) }));
  }
  // The source remains immutable. Only opaque identities, never knowledge refs,
  // are forwarded as inert string references to Lane D's render boundary.
  const rendererDocument: Wave3RendererDocument = freeze({ ...doc, nodes: freeze(rendered), bindings: freeze([]) as readonly [] });
  const result: Wave3ActionSemantics = freeze({ schema: WAVE3_ACTION_SEMANTICS_SCHEMA,
    readOnly: true, executable: false, documentId: doc.documentId, revision: doc.revision,
    documentDigest: `sha256:${sha256Hex(canonicalJson(doc))}`, canonical: doc,
    rendererDocument, componentRefs: freeze(components), references: freeze(refs), fieldMap: WAVE3_REFERENCE_FIELDS });
  return freeze({ ok: true, value: result });
}

/** Read-only reverse lookup. Never upgrades an alias into a grant or command. */
export function resolveWave3Reference(projection: Wave3ActionSemantics, aliasId: string, expectedRevision: number):
  Readonly<{ ok: true; reference: Wave3Reference }> |
  Readonly<{ ok: false; code: 'STALE_DOCUMENT' | 'UNKNOWN_REFERENCE' }> {
  if (!Number.isSafeInteger(expectedRevision) || projection.revision !== expectedRevision) {
    return freeze({ ok: false, code: 'STALE_DOCUMENT' });
  }
  const reference = projection.references.find(r => r.alias === aliasId);
  return reference ? freeze({ ok: true, reference }) : freeze({ ok: false, code: 'UNKNOWN_REFERENCE' });
}

/** Exact original refs, including versions, without depending on B/D coercion. */
export function restoreWave3NodeReferences(projection: Wave3ActionSemantics, nodeId: string, expectedRevision: number):
  Readonly<{ ok: true; actionRefs: readonly UiActionReference[]; bindingRefs: readonly string[] }> |
  Readonly<{ ok: false; code: 'STALE_DOCUMENT' | 'UNKNOWN_REFERENCE' }> {
  if (!Number.isSafeInteger(expectedRevision) || projection.revision !== expectedRevision) {
    return freeze({ ok: false, code: 'STALE_DOCUMENT' });
  }
  const node = projection.canonical.nodes.find(n => n.id === nodeId);
  return node ? freeze({ ok: true, actionRefs: freeze([...(node.actionRefs ?? [])]),
    bindingRefs: freeze([...(node.bindingRefs ?? [])]) }) : freeze({ ok: false, code: 'UNKNOWN_REFERENCE' });
}
