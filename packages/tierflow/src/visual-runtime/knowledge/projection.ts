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
