// Pure read projection of the existing owner-private Wiki context. No persistence.
import { createHash } from 'node:crypto';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pageId = page => 'wiki:page:' + encodeURIComponent(page);
export const sectionId = (page, section) => 'wiki:section:' + encodeURIComponent(page) + '/' + encodeURIComponent(section);
const actionId = id => 'control:action:' + id;
const journalId = id => 'journal:' + id;
export const receiptId = id => 'receipt:' + id;
const validAction = id => typeof id === 'string' && /^[a-z0-9][a-z0-9_.-]{0,127}$/.test(id);

// Only the existing typed Wiki action may resolve a candidate target.
// Text mentions, approximate matches and project-name guesses grant no link.
export function resolveSemanticWikiTarget(wiki, intent) {
  if (intent?.outcome !== 'candidate' || intent.candidate?.actionId !== 'wiki.section.edit') return null;
  const target = intent.candidate.args?.target;
  if (typeof target !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,78}\/[a-z0-9][a-z0-9_-]{0,78}$/i.test(target)) return null;
  const [p, s] = target.toLowerCase().split('/');
  const pages = Object.keys(wiki?.pages || {}).filter(name => name.toLowerCase() === p);
  if (pages.length !== 1) return null;
  const page = pages[0];
  const sections = Object.keys(wiki.pages[page]?.sections || {}).filter(name => name.toLowerCase() === s);
  if (sections.length !== 1 || typeof wiki.pages[page].sections[sections[0]] !== 'string') return null;
  return { page, section: sections[0] };
}

export function projectWikiSemantics(context) {
  const nodes = new Map(), relations = new Map();
  const put = node => { nodes.set(node.id, node); return node.id; };
  function link(from, kind, to, classification, source) {
    const id = 'relation:' + digest([from,kind,to,source.authority,source.ref]);
    relations.set(id, { id, from, kind, to, classification, source });
  }
  function section(target, source, classification) {
    const page = put({ id: pageId(target.page), kind: 'wiki-page', label: target.page,
      classification: 'observed-state' });
    const id = sectionId(target.page,target.section);
    if (!nodes.has(id)) put({ id, kind: 'wiki-section', label: target.page + '/' + target.section,
      page: target.page, section: target.section, classification: 'observed-state' });
    // One structural relationship per canonical section, not one per mention.
    // A committed edit is stronger evidence than an interpreted candidate.
    const membershipId = 'relation:' + digest([id, 'belongs-to-page', page]);
    const existing = relations.get(membershipId);
    if (!existing || classification === 'observed-state')
      relations.set(membershipId, { id: membershipId, from: id, kind: 'belongs-to-page',
        to: page, classification, source });
    return id;
  }
  function action(id) {
    return put({ id: actionId(id), kind: 'control-action', label: id, classification: 'typed-identity' });
  }
  function journalSource(item) {
    return { authority: 'host-product-journal', ref: item.entryId, revision: item.sequence,
      at: item.receivedAt };
  }

  const observations = (context.items || []).slice(-24);
  const changes = (context.wikiChanges?.items || []).slice(-24);
  const effects = context.applicationEffects?.state === 'source-backed'
    ? context.applicationEffects.items.slice(0,24) : [];
  const latest = new Map();
  for (const item of changes) {
    const source = { ...journalSource(item), wikiRevision: item.wikiRevision, digest: item.contentDigest };
    const id = put({ id: journalId(item.entryId), kind: 'wiki-change', label: 'Committed Wiki edit',
      classification: 'committed-change', freshness: item.status, source });
    const target = section(item.relationship, source, 'observed-state');
    link(id, 'changed-section', target, 'committed-change', source);
    const previous = latest.get(target);
    if (previous && previous.wikiRevision < item.wikiRevision)
      link(id, 'supersedes-change', previous.id, 'committed-change', source);
    latest.set(target, { id, wikiRevision: item.wikiRevision });
    if (item.status === 'current-section-revision')
      Object.assign(nodes.get(target), { source, freshness: 'current-at-snapshot', contentDigest: item.contentDigest });
  }
  for (const item of observations) {
    const source = { ...journalSource(item), digest: item.contentDigest || digest([item.text,item.interpretation || null]) };
    const id = put({ id: journalId(item.entryId), kind: 'user-observation', label: 'User statement',
      classification: 'user-statement-unverified', freshness: 'historical-statement', source });
    const meaning = item.interpretation;
    if (meaning?.outcome === 'candidate' && validAction(meaning.actionId)) {
      link(id, 'interpreted-as', action(meaning.actionId), 'inferred-relationship', source);
      if (meaning.actionId === 'wiki.section.edit' && meaning.target) {
        const resolved = { ...source, wikiRevision: context.wikiRevision };
        link(id, 'candidate-target', section(meaning.target, resolved, 'inferred-relationship'),
          'inferred-relationship', resolved);
      }
    }
  }
  for (const item of effects) {
    if (!validAction(item.actionId)) continue;
    const source = { authority: 'host-control-receipt', ref: item.planId, digest: item.planDigest,
      revision: item.sourceRevision, at: item.receivedAt };
    const id = put({ id: receiptId(item.planId), kind: 'applied-effect', label: 'Applied Host action',
      classification: 'executed-effect', freshness: 'historical-receipt', source });
    link(id, 'executed-action', action(item.actionId), 'executed-effect', source);
    const change = item.wikiLink && nodes.get(journalId(item.wikiLink.entryId));
    if (change?.kind === 'wiki-change' && change.source.wikiRevision === item.wikiLink.wikiRevision)
      link(id, 'confirmed-change', change.id, 'executed-effect', source);
  }
  const order = (a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  const result = {
    schema: 'vivim.autowiki-semantics/1', authority: 'read-only', scope: 'owner-private',
    journalRevision: context.revision, wikiRevision: context.wikiRevision,
    sources: { journal: 'source-backed', receipts: context.applicationEffects?.state || 'not-read' },
    omitted: { observations: context.omitted || 0, changes: context.wikiChanges?.omitted || 0,
      effects: context.applicationEffects?.omitted || 0 },
    nodes: [...nodes.values()].sort(order), relationships: [...relations.values()].sort(order)
  };
  return { ...result, digest: digest(result) };
}
