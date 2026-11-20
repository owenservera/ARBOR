# File: packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts |
| Language | TypeScript |
| Kind | source |
| Size | 12072 B |
| Lines | 192 |
| Hash | ce2727a95d04 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE3_ACTION_SEMANTICS_SCHEMA | const | 12 | yes | export const WAVE3_ACTION_SEMANTICS_SCHEMA = &#39;vivim.wave3-action-semantics/1&#39; as const; |
| WAVE3_REFERENCE_FIELDS | const | 13 | yes | export const WAVE3_REFERENCE_FIELDS = Object.freeze([ Object.freeze({ canonical: &#39;nodes[].actionRefs[].{id,version}&#39;, projected: &#39;rendererDocument.nodes[].actionRefs[] / componentRefs[].actionRefs[]&#39;… |
| Wave3BindingPin | interface | 20 | yes | export interface Wave3BindingPin { |
| Wave3SemanticsOptions | interface | 27 | yes | export interface Wave3SemanticsOptions extends UiDocumentValidationOptions { |
| Wave3Reference | type | 33 | yes | export type Wave3Reference = |
| Wave3ComponentRefs | interface | 37 | yes | export interface Wave3ComponentRefs { |
| Wave3RendererNode | type | 45 | yes | export type Wave3RendererNode = Omit&lt;UiDocumentNode, &#39;actionRefs&#39; \| &#39;bindingRefs&#39;&gt; &amp; { |
| Wave3RendererDocument | type | 49 | yes | export type Wave3RendererDocument = Omit&lt;UiDocument, &#39;nodes&#39; \| &#39;bindings&#39;&gt; &amp; { |
| Wave3ActionSemantics | interface | 54 | yes | export interface Wave3ActionSemantics { |
| Wave3SemanticsFailureCode | type | 72 | yes | export type Wave3SemanticsFailureCode = |
| Wave3SemanticsResult | type | 75 | yes | export type Wave3SemanticsResult = |
| fail | function | 80 | no | const fail = (code: Wave3SemanticsFailureCode, reason: string, validationCode?: string): Wave3SemanticsResult =&gt; |
| freeze | function | 82 | no | const freeze = &lt;T&gt;(value: T): T =&gt; Object.freeze(value); |
| key | function | 83 | no | const key = (id: string, version: number): string =&gt; `${id.length}:${id}@${version}`; |
| pinKey | function | 84 | no | const pinKey = (pin: Wave3BindingPin): string =&gt; key(pin.id, pin.version); |
| alias | function | 87 | no | function alias(kind: &#39;node&#39; \| &#39;action&#39; \| &#39;binding&#39;, doc: UiDocument, nodeId: string, id: string, version: number): string { |
| descriptor | const | 88 | no | const descriptor = JSON.stringify([WAVE3_ACTION_SEMANTICS_SCHEMA, kind, doc.scope.ownerRef, doc.scope.workspaceRef, doc.documentId, doc.revision, nodeId, id, version]); |
| projectWave3ActionSemantics | function | 94 | yes | export function projectWave3ActionSemantics(input: unknown, options: Wave3SemanticsOptions): Wave3SemanticsResult { |
| checked | const | 101 | no | const checked = validateUiDocument(input, { knownActions: options.knownActions }); |
| doc | const | 103 | no | const doc = checked.document; |
| pins | const | 106 | no | const pins = new Map&lt;string, Wave3BindingPin&gt;(); |
| k | const | 112 | no | const k = pinKey(pin); |
| seenAliases | const | 116 | no | const seenAliases = new Set&lt;string&gt;(); |
| reserve | function | 117 | no | const reserve = (a: string): boolean =&gt; { |
| nodeAliases | const | 122 | no | const nodeAliases = new Map(doc.nodes.map(n =&gt; [n.id, alias(&#39;node&#39;, doc, n.id, n.id, 0)])); |
| bindings | const | 124 | no | const bindings = new Map&lt;string, UiDocumentBinding&gt;(doc.bindings.map(b =&gt; [b.id, b])); |
| refs | const | 125 | no | const refs: Wave3Reference[] = []; |
| rendered | const | 126 | no | const rendered: Wave3RendererNode[] = []; |
| components | const | 127 | no | const components: Wave3ComponentRefs[] = []; |
| actionRefs | const | 129 | no | const actionRefs: string[] = []; |
| bindingRefs | const | 130 | no | const bindingRefs: string[] = []; |
| a | const | 135 | no | const a = alias(&#39;action&#39;, doc, node.id, action.id, action.version); |
| binding | const | 141 | no | const binding = bindings.get(bindingId); |
| pin | const | 143 | no | const pin = pins.get(key(binding.id, binding.version)); |
| a | const | 149 | no | const a = alias(&#39;binding&#39;, doc, node.id, binding.id, binding.version); |
| rendererDocument | const | 163 | no | const rendererDocument: Wave3RendererDocument = freeze({ ...doc, nodes: freeze(rendered), bindings: freeze([]) as readonly [] }); |
| result | const | 164 | no | const result: Wave3ActionSemantics = freeze({ schema: WAVE3_ACTION_SEMANTICS_SCHEMA, readOnly: true, executable: false, documentId: doc.documentId, revision: doc.revision, documentDigest: `sha256:${s… |
| resolveWave3Reference | function | 172 | yes | export function resolveWave3Reference(projection: Wave3ActionSemantics, aliasId: string, expectedRevision: number): |
| reference | const | 178 | no | const reference = projection.references.find(r =&gt; r.alias === aliasId); |
| restoreWave3NodeReferences | function | 183 | yes | export function restoreWave3NodeReferences(projection: Wave3ActionSemantics, nodeId: string, expectedRevision: number): |
| node | const | 189 | no | const node = projection.canonical.nodes.find(n =&gt; n.id === nodeId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../ui/hash.ts | import | 7 | [packages/tierflow/src/ui/hash.ts](../../ui/hash.ts.md) |
| ./validate.ts | import | 8 | [packages/tierflow/src/visual-runtime/document/validate.ts](./validate.ts.md) |
| ./schema.ts | import | 9 | [packages/tierflow/src/visual-runtime/document/schema.ts](./schema.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts](../device/wave4-desktop-adapter.ts.md) | ../document/wave3-action-semantics.ts |
| [packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts](../input/wave4-device-semantics.ts.md) | ../document/wave3-action-semantics.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../document/wave3-action-semantics.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../document/wave3-action-semantics.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/document/wave3-action-semantics.ts |
| [packages/tierflow/tests/visual-runtime/wave3-a-schema.test.ts](../../../tests/visual-runtime/wave3-a-schema.test.ts.md) | ../../src/visual-runtime/document/wave3-action-semantics.ts |
| [packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts](../../../tests/visual-runtime/wave4-c-device-semantics.test.ts.md) | ../../src/visual-runtime/document/wave3-action-semantics.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 193 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
