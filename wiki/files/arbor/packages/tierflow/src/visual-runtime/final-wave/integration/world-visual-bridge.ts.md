# File: packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts |
| Language | TypeScript |
| Kind | source |
| Size | 8599 B |
| Lines | 156 |
| Hash | b65e6b288145 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BridgeFailure | type | 13 | yes | export type BridgeFailure = |
| BridgeResult | type | 17 | yes | export type BridgeResult&lt;T&gt; = |
| refuse | function | 20 | no | const refuse = (code: BridgeFailure, detail: string): BridgeResult&lt;never&gt; =&gt; |
| ID | const | 22 | no | const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| VISUAL_ID | const | 23 | no | const VISUAL_ID = /^[A-Za-z0-9_-]{1,64}$/; |
| BridgePrincipal | interface | 26 | yes | export interface BridgePrincipal { |
| BridgeProjection | interface | 32 | yes | export interface BridgeProjection { |
| mapping | function | 42 | no | function mapping(object: UiObject): &#39;text&#39; \| &#39;card&#39; \| null { |
| objectId | function | 50 | no | function objectId(object: UiObject): string { return &#39;obj_&#39; + object.id; } |
| projectWorldRevision | function | 57 | yes | export function projectWorldRevision(source: UiRevision, principal: BridgePrincipal): BridgeResult&lt;BridgeProjection&gt; { |
| parsed | variable | 61 | no | let parsed: UiRevision[&#39;document&#39;]; |
| rootId | const | 69 | no | const rootId = &#39;world_root&#39;; |
| children | const | 70 | no | const children: string[] = []; |
| nodes | const | 71 | no | const nodes: UiDocumentNode[] = []; |
| id | const | 75 | no | const id = objectId(object); |
| title | const | 77 | no | const title = object.title ?? object.id; |
| document | const | 87 | no | const document: VisualDocument = { |
| checked | const | 99 | no | const checked = validateUiDocument(document); |
| sourceDigest | const | 101 | no | const sourceDigest = sha256Hex(canonicalJson({ worldId: parsed.world.id, revision: source.revision, contentHash: source.contentHash, ownerRef: principal.ownerRef, workspaceRef: principal.workspaceRef… |
| ReverseEditInput | interface | 116 | yes | export interface ReverseEditInput { |
| ReverseCandidate | interface | 124 | yes | export interface ReverseCandidate { |
| planWorldVisualEdit | function | 132 | yes | export function planWorldVisualEdit(input: ReverseEditInput): BridgeResult&lt;ReverseCandidate&gt; { |
| object | const | 145 | no | const object = p.source.document.objects.find(o =&gt; o.id === input.edit.objectId); |
| t | const | 147 | no | const t = input.edit.transform; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../../ui/world.ts | import | 7 | [packages/tierflow/src/ui/world.ts](../../../ui/world.ts.md) |
| ../../../ui/hash.ts | import | 8 | [packages/tierflow/src/ui/hash.ts](../../../ui/hash.ts.md) |
| ../../../ui/types.ts | import | 9 | [packages/tierflow/src/ui/types.ts](../../../ui/types.ts.md) |
| ../../document/schema.ts | import | 10 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../document/schema.ts.md) |
| ../../document/validate.ts | import | 11 | [packages/tierflow/src/visual-runtime/document/validate.ts](../../document/validate.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts](../../../../tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts.md) | ../../../../src/visual-runtime/final-wave/integration/world-visual-bridge.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts](../../../../tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts.md) | ../../../../src/visual-runtime/final-wave/integration/world-visual-bridge.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 157 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
