# File: packages/tierflow/src/visual-runtime/knowledge/projection.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/knowledge/projection.ts |
| Language | TypeScript |
| Kind | source |
| Size | 2527 B |
| Lines | 46 |
| Hash | 16fa6395ffa8 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KnowledgeCard | interface | 4 | yes | export interface KnowledgeCard { |
| KnowledgeProjection | interface | 15 | yes | export interface KnowledgeProjection { |
| plain | function | 22 | no | function plain(value: string): string { |
| makeCard | function | 25 | no | function makeCard(item: KnowledgeItem): KnowledgeCard \| null { |
| projectKnowledgePage | function | 34 | yes | export function projectKnowledgePage(page: KnowledgePage): KnowledgeProjection { |
| denied | const | 36 | no | const denied = page.status === &#39;denied&#39;; |
| cards | const | 39 | no | const cards = page.items.map(makeCard).filter((c): c is KnowledgeCard =&gt; c !== null); |
| partial | const | 40 | no | const partial = page.status === &#39;partial&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./client.ts | import | 2 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](./client.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../experience/wave3-journey-fixture.ts.md) | ../knowledge/projection.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../knowledge/projection.ts |
| [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](./wave3-feed-projection.ts.md) | ./projection.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/knowledge/projection.ts |
| [packages/tierflow/tests/visual-runtime/knowledge-privacy.test.ts](../../../tests/visual-runtime/knowledge-privacy.test.ts.md) | ../../src/visual-runtime/knowledge/projection.ts |
| [packages/tierflow/tests/visual-runtime/knowledge.test.ts](../../../tests/visual-runtime/knowledge.test.ts.md) | ../../src/visual-runtime/knowledge/projection.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Read-only view model: no HTML, mutable KB state, UI actions, grants or effect handles. */
import type { KnowledgePage, KnowledgeItem } from './client.ts';

export interface KnowledgeCard {
  readonly stableId: string;
  readonly kind: string;
  readonly title: string;
  readonly summary: string;
  readonly statusLabel: string;
  readonly provenanceLabel: string;
  readonly sourceVersion: string;
  readonly asOf: string;
  readonly interactive: false;
}
export interface KnowledgeProjection {
  readonly state: 'ready' | 'partial' | 'unavailable' | 'denied';
  readonly statusMessage: string;
  readonly cards: readonly KnowledgeCard[];
  readonly projectionRevision: string | null;
  readonly nextCursor?: string;
}
function plain(value: string): string {
  return value.slice(0, 512).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c] ?? '');
}
function makeCard(item: KnowledgeItem): KnowledgeCard | null {
  if (item.visibility !== 'visible' || ['redacted', 'revoked', 'deleted', 'missing'].includes(item.availability)) return null;
  return {
    stableId: item.stableId, kind: plain(item.kind), title: plain(item.label), summary: plain(item.summary),
    statusLabel: item.availability === 'present' ? 'Observed (not an authorization)' : `Knowledge ${item.availability} — confirm source before relying on it`,
    provenanceLabel: plain(item.provenance.join(', ')), sourceVersion: plain(item.source.nativeVersion),
    asOf: plain(item.asOf), interactive: false,
  };
}
export function projectKnowledgePage(page: KnowledgePage): KnowledgeProjection {
  if (page.schema !== 'vivim.knowledge-result/1' || (page.status !== 'ok' && page.status !== 'partial')) {
    const denied = page.status === 'denied';
    return { state: denied ? 'denied' : 'unavailable', statusMessage: denied ? 'Knowledge access not authorized' : 'Knowledge is unavailable; no cached private results shown', cards: [], projectionRevision: null };
  }
  const cards = page.items.map(makeCard).filter((c): c is KnowledgeCard => c !== null);
  const partial = page.status === 'partial';
  return {
    state: partial ? 'partial' : 'ready',
    statusMessage: partial ? 'Some evidence is stale or uncertain; this does not authorize actions' : 'Read-only synthetic knowledge evidence',
    cards, projectionRevision: page.projectionRevision, ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
  };
}
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
