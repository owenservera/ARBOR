import { resolveDesktopDestination, resolveProductRoute } from '/mobile/control-language.mjs';
import { mountComposerAssist } from '/mobile/composer-assist.mjs';
import { sourceCards, sameSourceCard, matchesSourceContext, exactSourceContextUrl, reconcileSourceCards } from '/mobile/wiki-source-view.mjs';
// Host read-model and reviewed Wiki drafts. NL interpretation belongs to Host;
// only the existing owner-confirmed mutation endpoint writes Wiki content.
// VEC/0.1 typed display seam: {schema:'vivim.vec-compile/0.1', domain:'wiki',
// product:'wiki-projection', outcome:'unsupported', code:'LEGACY_OWNER_NOT_MIGRATED',
// authorization:'none', executed:false, persisted:false}. No adapter is installed here.
const SOURCES = Object.freeze({
  wiki: { url: '/api/wiki', path: 'Host product journal → Wiki projection' },
  state: { url: '/api/state', path: 'Host product journal → chat state projection' },
  context: { url: '/api/host/control/wiki-context', path: 'Owner-private journal → observations and committed Wiki effects' },
  surface: { url: '/api/file-surface', path: 'Owner-authorized HQ executable source index' },
  journal: { url: '/api/journal', path: 'Host data-root/product-state/journal.jsonl' }
});
const ACTOR = 'owner-browser';
const POLL_MS = 1600;
const MAX_ENTRY_BYTES = 4096;
const HANDOFF_KEY = 'vivim.desktop-chat-draft.v1';
const $ = id => document.getElementById(id);
const snapshots = Object.create(null);
let editSession = null;
let refreshing = false;
let busy = false;
let ownerCsrf = null; // memory-only proof of a native Host-issued short-lived session
let interpreting = false;
let assistance=null;
let surfaceQuery = '';
let surfaceQueryEpoch = 0;
let surfaceContextEpoch = 0;
let surfaceContextSelection = null;
let autoContextPending = false;
let indexingSources = false;
let sourceCardHost=null;

function element(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text !== undefined) result.textContent = String(text);
  return result;
}
function present(value, fallback = '—') { return value === undefined || value === null ? fallback : String(value); }
function isWikiDocument(wiki) {
  return wiki && Number.isSafeInteger(wiki.revision) && wiki.revision >= 0 &&
    wiki.pages && typeof wiki.pages === 'object' && !Array.isArray(wiki.pages);
}
function entriesOf(journal) {
  return Array.isArray(journal) ? journal : Array.isArray(journal?.entries) ? journal.entries : [];
}
function fileRecords(surface) {
  // Live HQ projection keeps the existing vivim.file-surface/1 files contract.
  return Array.isArray(surface?.files) ? surface.files :
    Array.isArray(surface?.records) ? surface.records : Array.isArray(surface) ? surface : [];
}
function sourceRecord(key) { return snapshots[key]?.data; }
function observedEdit(page, section, content) {
  const journal = sourceRecord('journal');
  if (!journal) return 'provenance not observed';
  const matched = entriesOf(journal).some(entry => entry?.kind === 'wiki-edit' &&
    entry.edit?.page === page && entry.edit?.section === section && entry.edit?.content === content);
  return matched ? 'journal-backed edit observed' : 'initial section / no edit record observed';
}
function sectionEl(page, section, text, revision) {
  const wrapper = element('article', 'section');
  wrapper.dataset.wikiId = page + '/' + section;
  wrapper.dataset.revision = String(revision);
  const head = element('div', 'section-head');
  head.appendChild(element('h4', '', section));
  const edit = element('button', '', 'Edit');
  edit.type = 'button';
  edit.setAttribute('aria-label', `Edit Wiki section ${page}/${section}`);
  edit.addEventListener('click', () => openEdit(page, section, text, revision));
  head.appendChild(edit);
  wrapper.appendChild(head);
  wrapper.appendChild(element('p', 'body', text));
  wrapper.appendChild(element('div', 'meta', `data-wiki-id=${page}/${section} · Wiki rev ${revision} · ${observedEdit(page, section, text)}`));
  return wrapper;
}
function renderWiki(wiki) {
  const root = element('div', 'stack');
  const pages = Object.entries(wiki.pages || {});
  if (!pages.length) return element('p', 'empty', 'No Wiki pages in the Host projection.');
  const pageCards=new Map();
  for (const [name, page] of pages) {
    const card = element('section', 'page');
    pageCards.set(name,card);
    card.appendChild(element('h3', '', name));
    const links=Array.isArray(page?.links)?page.links.filter(p=>typeof p==='string'&&Object.hasOwn(wiki.pages,p)):[];
    if(links.length){
      card.appendChild(element('p','meta','Links to:'));
      for(const target of links){
        const button=element('button','',target);button.type='button';
        button.addEventListener('click',()=>pageCards.get(target)?.scrollIntoView?.({block:'start'}));
        card.appendChild(button);
      }
    }
    const sections = Object.entries(page?.sections || {});
    if (!sections.length) card.appendChild(element('p', 'empty', 'No sections.'));
    for (const [section, body] of sections) card.appendChild(sectionEl(name, section, present(body, ''), wiki.revision));
    root.appendChild(card);
  }
  return root;
}
function semanticRows(context) {
  const graph = context.semantics;
  if (graph?.schema !== 'vivim.autowiki-semantics/1' || graph.scope !== 'owner-private' ||
      graph.authority !== 'read-only' || graph.journalRevision !== context.revision ||
      graph.wikiRevision !== context.wikiRevision || !/^[a-f0-9]{64}$/.test(graph.digest || '') ||
      !Array.isArray(graph.nodes) || graph.nodes.length > 256 ||
      !Array.isArray(graph.relationships) || graph.relationships.length > 256) return null;
  const nodes = new Map();
  for (const node of graph.nodes) {
    if (typeof node?.id !== 'string' || typeof node.label !== 'string' || nodes.has(node.id)) return null;
    nodes.set(node.id, node);
  }
  const labels = { 'changed-section': 'changed', 'supersedes-change': 'supersedes',
    'belongs-to-page': 'belongs to', 'interpreted-as': 'interpreted as',
    'candidate-target': 'possible target', 'executed-action': 'executed',
    'confirmed-change': 'confirmed', 'created-page':'created', 'moved-page':'reordered',
    'linked-from':'linked from', 'linked-to':'linked to', 'wiki-page-link':'links to' };
  const priority = { 'confirmed-change': 0, 'changed-section': 1, 'supersedes-change': 2,
    'candidate-target': 3, 'executed-action': 4, 'interpreted-as': 5, 'belongs-to-page': 6, 'wiki-page-link':-1,
    'created-page':1, 'moved-page':2, 'linked-from':2, 'linked-to':2 };
  const rows = [];
  const ids = new Set();
  for (const relation of graph.relationships) {
    if (!relation || typeof relation.id !== 'string' || ids.has(relation.id) ||
        !Object.hasOwn(labels, relation.kind) || !nodes.has(relation.from) || !nodes.has(relation.to) ||
        !['observed-state','committed-change','inferred-relationship','executed-effect'].includes(relation.classification) ||
        !['host-product-journal','host-control-receipt'].includes(relation.source?.authority) ||
        typeof relation.source.ref !== 'string') return null;
    ids.add(relation.id);
    const from = nodes.get(relation.from), to = nodes.get(relation.to);
    rows.push({ id: relation.id, label: from.label + ' → ' + labels[relation.kind] + ' → ' + to.label,
      classification: relation.classification,
      evidence:relation.evidence,
      freshness: from.freshness || to.freshness || null,
      source: relation.source, priority: priority[relation.kind] });
  }
  rows.sort((a,b) => a.priority - b.priority ||
    (Number(b.source.revision) || 0) - (Number(a.source.revision) || 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { rows, count: nodes.size, digest: graph.digest, sources: graph.sources };
}
function renderSemanticKnowledge(root, context) {
  root.appendChild(element('h3', '', 'AutoWiki · semantic relationships'));
  const knowledge = semanticRows(context);
  if (!knowledge) {
    root.appendChild(element('p', 'empty', 'Semantic projection unavailable or revision mismatch.'));
    return;
  }
  root.appendChild(element('p', 'queue-summary', knowledge.count + ' source-identified entities and events · ' +
    knowledge.rows.length + ' relationships · read only'));
  if (!knowledge.rows.length) root.appendChild(element('p', 'empty', 'No source-supported relationships in the bounded snapshot.'));
  for (const row of knowledge.rows.slice(0,32)) {
    const card = element('article', 'section');
    card.dataset.relationshipId = row.id;
    card.appendChild(element('p', 'body', row.label));
    card.appendChild(element('div', 'meta', row.classification + (row.evidence ? ' · '+row.evidence.origin+' / '+row.evidence.assurance+' ('+row.evidence.claim+') · '+row.evidence.freshness : ' · assurance unavailable') + (row.freshness ? ' · ' + row.freshness : '') +
      ' · ' + row.source.authority + ' ' + row.source.ref +
      ' · source revision ' + present(row.source.revision, 'not recorded')));
    root.appendChild(card);
  }
  if (knowledge.rows.length > 32) root.appendChild(element('p', 'empty', (knowledge.rows.length - 32) + ' additional relationships in the Host read model.'));
  root.appendChild(element('p', 'meta', 'Snapshot digest ' + knowledge.digest));
}
function renderContext(context) {
  const root = element('div', 'stack');
  root.appendChild(element('p', 'queue-summary', context.totalObserved + ' user-declared observation(s) · source sequence ' + context.revision + ' · not verified facts'));
  if (!context.items.length) {
    root.appendChild(element('p', 'empty', 'No source-identified user messages yet. Send a message in Chat to begin.'));
  }
  for (const item of context.items.slice().reverse()) {
    const card = element('article', 'section');
    card.dataset.entryId = item.entryId;
    card.dataset.sequence = String(item.sequence);
    card.appendChild(element('p', 'body', item.text));
    const interpretation = item.interpretation?.outcome
      ? ' · typed interpretation: ' + item.interpretation.outcome +
        (item.interpretation.actionId ? ' / ' + item.interpretation.actionId : '') : '';
    card.appendChild(element('div', 'meta', 'Unverified user statement · journal ' + item.entryId +
      ' · sequence ' + item.sequence + ' · ' + item.receivedAt + interpretation));
    root.appendChild(card);
  }
  if (context.omitted) root.appendChild(element('p', 'empty', context.omitted + ' older observations omitted from bounded view.'));
  root.appendChild(element('h3', '', 'Automatically derived · committed Wiki changes'));
  const changes = context.wikiChanges;
  if (!changes) {
    root.appendChild(element('p', 'empty', 'Committed change context unavailable from this Host.'));
    return root;
  }
  if (!sourceRecord('wiki') || snapshots.wiki?.error || sourceRecord('wiki').revision !== context.wikiRevision) {
    root.appendChild(element('p', 'empty', 'Wiki revision differs from AutoWiki snapshot; waiting for matching Host readback.'));
    return root;
  }
  root.appendChild(element('p', 'queue-summary', changes.total + ' journaled change(s) · Wiki rev ' +
    present(context.wikiRevision) + ' · read-only; not owner-authored content'));
  if (!changes.items.length) root.appendChild(element('p', 'empty', 'No source-identified committed Wiki changes.'));
  for (const item of changes.items.slice().reverse()) {
    const card = element('article', 'section');
    card.dataset.entryId = item.entryId;
    card.dataset.sequence = String(item.sequence);
    card.appendChild(element('p', 'body', item.relationship.page + '/' + item.relationship.section));
    card.appendChild(element('div', 'meta', 'Committed Wiki effect · ' + item.status +
      ' · Wiki rev ' + item.previousWikiRevision + ' → ' + item.wikiRevision +
      ' · journal ' + item.entryId + ' · sequence ' + item.sequence + ' · ' + item.receivedAt));
    root.appendChild(card);
  }
  if (changes.omitted) root.appendChild(element('p', 'empty', changes.omitted + ' older changes omitted from bounded view.'));
  root.appendChild(element('h3', '', 'Automatically derived · executed application effects'));
  const effects = context.applicationEffects;
  if (effects?.state !== 'source-backed') {
    root.appendChild(element('p', 'empty', 'Control receipt context unavailable.'));
  } else {
    root.appendChild(element('p', 'queue-summary', 'Historical applied receipts · scanned ' + effects.scannedPlans +
      ' recent plans (limit ' + effects.scanLimit + ') · not current-state verification'));
    if (!effects.items.length) root.appendChild(element('p', 'empty', 'No applied application effects in the scanned plans.'));
    for (const item of effects.items) {
      const card = element('article', 'section');
      card.dataset.planId = item.planId;
      card.appendChild(element('p', 'body', item.actionId));
      card.appendChild(element('div', 'meta', 'Historical applied receipt · plan ' + item.planId +
        ' · source revision ' + present(item.sourceRevision, 'not recorded') + ' · ' + item.receivedAt));
      if (item.wikiLink) card.appendChild(element('p', 'meta', 'Linked committed Wiki edit ' + item.wikiLink.entryId + ' · Wiki rev ' + item.wikiLink.wikiRevision));
      if (item.structureLink) card.appendChild(element('p','meta','Linked committed Wiki structure '+item.structureLink.entryId+' · Wiki rev '+item.structureLink.wikiRevision));
      root.appendChild(card);
    }
    if (effects.omitted) root.appendChild(element('p', 'empty', effects.omitted + ' additional applied effects omitted.'));
  }
  renderSemanticKnowledge(root, context);
  root.appendChild(element('p', 'meta', 'Project and task links require explicit source evidence; no inferred project membership is asserted.'));
  root.appendChild(element('h3', '', 'Native HQKG · committed knowledge'));
  const native = context.nativeContext;
  if (native?.schema !== 'vivim.hqkg-chat-context/1' || native.state !== 'source-backed' ||
      !Array.isArray(native.items) || native.items.length > 8) {
    root.appendChild(element('p','empty','Native context unavailable: '+present(native?.reason,'not configured')));
  } else {
    root.appendChild(element('p','queue-summary','HQKG epoch '+native.epoch+
      ' · '+native.tokensUsed+' / '+native.budgetTokens+' estimated tokens · read only'));
    if (native.syncedRelationships) root.appendChild(element('p','meta',native.syncedRelationships+' native Wiki page links verified against committed source'));
    if (!native.items.length) root.appendChild(element('p','empty','No committed native observations in this bounded view.'));
    for (const item of native.items) {
      const card=element('article','section');
      card.appendChild(element('h4','',present(item.title)));
      if (item.summary) card.appendChild(element('p','body',item.summary));
      card.appendChild(element('div','meta',(item.kind==='effect'?'Historical applied receipt':'Committed owner Wiki content')+
        ' · source revision '+(item.sourceRevision ?? 'unknown')));
      root.appendChild(card);
    }
  }
  return root;
}
function renderFileSurface(surface) {
  const root = element('div');
  const records = fileRecords(surface);
  root.appendChild(element('p', 'queue-summary', `${records.length} indexed files · ${present(surface?.generatorVersion)}${surface?.truncated ? ' · bounded results' : ''} · read only, not execution authority`));
  if (!records.length) { sourceCardHost=null;root.appendChild(element('p', 'empty', 'No matching indexed executable source. Register an approved project and refresh its index.')); return root; }
  const cards=sourceCards(surface);
  for (const record of records.slice(0, 16)) {
    const details = element('details', 'record');
    details.appendChild(element('summary', '', present(record.path)));
    details.appendChild(element('p', 'body', present(record.surface, 'No description.')));
    details.appendChild(element('p', 'record-meta',
      `sourceDigest=${present(record.sourceDigest, 'unprovided')} · ${present(record.freshness, 'unverified')} · project=${present(record.project)}`));
    for (const relation of record.relationships || []) details.appendChild(element('p', 'record-meta',
      relation.kind + ' → ' + (relation.semanticId || relation.ref) + ' · line ' + relation.line));
    if (record.freshness === 'stale') details.appendChild(element('p','empty','Source changed; refresh the index before requesting context.'));
    if(!cards.some(c=>c.sourceId===record.sourceId))
      details.appendChild(element('p','empty','No validated semantic anchor available.'));
    root.appendChild(details);
  }
  root.appendChild(element('h3','','Live semantic anchors · source evidence only'));
  root.appendChild(element('p','meta','Derived and inferred claims are read only. Edit personal Wiki sections using their own journal editor. No source writer is authorized here.'));
  if(!sourceCardHost)sourceCardHost=element('div','stack');
  reconcileSourceCards(sourceCardHost,cards,{createElement:tag=>element(tag,'record'),onRead:card=>{
    const record=fileRecords(sourceRecord('surface')).find(f=>f.sourceId===card.sourceId);
    if(record)void readSurfaceContext({...record,sourceCard:card});
  }});
  root.appendChild(sourceCardHost);
  if(cards.length>256)root.appendChild(element('p','empty','Showing the first 256 semantic anchors.'));
  if (records.length > 16) root.appendChild(element('p', 'empty', `Showing 16/${records.length} source records.`));
  return root;
}
function clearSurfaceContext(message = 'Search annotated source or select a current file to read its verified context.') {
  surfaceContextEpoch++;
  surfaceContextSelection = null;
  $('surface-context-view').replaceChildren(element('p', 'empty', message));
}
function currentSurfaceRecord(record) {
  return !!record.sourceCard&&sourceCards(sourceRecord('surface')).some(card=>sameSourceCard(card,record.sourceCard));
}
async function readSurfaceContext(record) {
  if (!currentSurfaceRecord(record)) {
    clearSurfaceContext('Source is not current. Refresh the index before reading context.');
    return;
  }
  const epoch = ++surfaceContextEpoch;
  surfaceContextSelection = record;
  $('surface-context-view').replaceChildren(element('p', 'empty', 'Composing verified HQ context…'));
  try {
    const response = await fetch(exactSourceContextUrl(record.sourceCard),
      { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (epoch !== surfaceContextEpoch) return;
    if([401,403].includes(response.status)){
      sourceCardHost=null;snapshots.surface={data:null,signature:null,error:'Source access denied'};
      $('surface-view').replaceChildren(element('p','empty','Source index locked. No cached source displayed.'));
      clearSurfaceContext('Source access denied. No cached context displayed.');return;
    }
    if (!response.ok) throw new Error('Source context refused');
    const result = await response.json();
    if (epoch !== surfaceContextEpoch) return;
    const bundle = result?.context;
    if (!currentSurfaceRecord(record) || !matchesSourceContext(record.sourceCard,result) || result?.schema !== 'vivim.source-context/1' ||
        result.status !== 'indexed' || result.sourceId !== record.sourceId ||
        result.sourceDigest !== record.sourceDigest || bundle?.schema !== 'hq.context-bundle/1' ||
        !Array.isArray(bundle.sources) || bundle.sources.length > 16 ||
        !bundle.sources.some(source => source.ref === record.sourceId) ||
        typeof bundle.fragment !== 'string' || bundle.fragment.length > 64000 ||
        typeof bundle.digest !== 'string') {
      clearSurfaceContext('No current verified source context. Reindex the authorized source and try again.');
      return;
    }
    const root = element('section', 'record');
    root.appendChild(element('h3', '', 'Verified context · ' + result.sourceId));
    root.appendChild(element('p','meta','Exact anchor '+result.anchor.anchorId+' · line '+result.anchor.line+' · annotation occurrence only; not execution authority.'));
    root.appendChild(element('p', 'record-meta', 'Digest ' + bundle.digest +
      ' · verified at read; source changes require a fresh context'));
    for (const source of bundle.sources)
      root.appendChild(element('p', 'record-meta', source.ref + ' · lines ' +
        (Array.isArray(source.lines) ? source.lines.join('–') : 'unavailable')));
    root.appendChild(element('pre', 'body', bundle.fragment));
    $('surface-context-view').replaceChildren(root);
  } catch {
    if (epoch === surfaceContextEpoch)
      clearSurfaceContext('Verified HQ context unavailable. No cached source text displayed.');
  }
}
function autoSurfaceContext(data) {
  if (!surfaceQuery) return;
  const matches=sourceCards(data).filter(card=>card.readable&&card.semanticId===surfaceQuery);
  if(matches.length===1){const record=fileRecords(data).find(f=>f.sourceId===matches[0].sourceId);void readSurfaceContext({...record,sourceCard:matches[0]});}
  else clearSurfaceContext(sourceCards(data).some(card=>card.readable) ?
    'Choose a matching file to generate verified context.' :
    'No current annotated source matches. Reindex if source changed.');
}
function renderJournal(journal) {
  const root = element('div');
  const entries = entriesOf(journal);
  root.appendChild(element('p', 'queue-summary', `${entries.length} append records observed · newest 12 shown · not an acceptance receipt`));
  if (!entries.length) { root.appendChild(element('p', 'empty', 'Journal empty; initial Wiki sections are available.')); return root; }
  const scroll = element('div', 'table-scroll');
  const table = element('table');
  const head = element('thead'); const hr = element('tr');
  for (const col of ['Received', 'Kind / actor', 'Reference / revision']) hr.appendChild(element('th', '', col));
  head.appendChild(hr); table.appendChild(head);
  const body = element('tbody');
  for (const entry of entries.slice(-12).reverse()) {
    const row = element('tr');
    row.appendChild(element('td', '', present(entry.receivedAt)));
    row.appendChild(element('td', '', `${present(entry.kind, 'legacy-observation')} · ${present(entry.actor, 'legacy')}`));
    const ref = entry.kind === 'wiki-edit' ? `${present(entry.edit?.page)}/${present(entry.edit?.section)}` :
      entry.kind === 'chat-send' ? 'chat message (text not displayed)' : present(entry.round, '—');
    row.appendChild(element('td', '', `${ref} · product rev ${present(entry.revision, '—')} · Wiki rev ${present(entry.wikiRevision, '—')}`));
    body.appendChild(row);
  }
  table.appendChild(body); scroll.appendChild(table); root.appendChild(scroll);
  return root;
}
function resolveWikiTarget(wiki, target) {
  if (typeof target !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,78}\/[a-z0-9][a-z0-9_-]{0,78}$/i.test(target))
    throw new Error('Invalid Wiki target. Use page/section.');
  const [requestedPage, requestedSection] = target.toLowerCase().split('/');
  const matches = [];
  for (const [page, value] of Object.entries(wiki.pages)) {
    if (page.toLowerCase() !== requestedPage || !value?.sections ||
        typeof value.sections !== 'object' || Array.isArray(value.sections)) continue;
    for (const [section, content] of Object.entries(value.sections))
      if (section.toLowerCase() === requestedSection && typeof content === 'string')
        matches.push({ page, section, content });
  }
  if (matches.length !== 1) throw new Error(matches.length
    ? 'Ambiguous Wiki target; use one unique page/section.'
    : 'Wiki page/section does not exist in the current Host projection.');
  return matches[0];
}
function linesDiff(before, after) {
  const a = String(before).split('\n'), b = String(after).split('\n');
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - end - 1] === b[b.length - end - 1]) end++;
  const removed = a.slice(start, a.length - end), added = b.slice(start, b.length - end);
  if (!removed.length && !added.length) return 'No content change.';
  const out = [];
  if (start) out.push(`  ${start} unchanged line(s) above`);
  for (const line of removed.slice(0, 40)) out.push('- ' + line);
  if (removed.length > 40) out.push(`- … ${removed.length - 40} more removed line(s)`);
  for (const line of added.slice(0, 40)) out.push('+ ' + line);
  if (added.length > 40) out.push(`+ … ${added.length - 40} more added line(s)`);
  if (end) out.push(`  ${end} unchanged line(s) below`);
  return out.join('\n');
}
function mutationEnvelope(session, revision, text) {
  return { schemaVersion: 1, actor: ACTOR, kind: 'wiki-edit', expectedRevision: revision,
    edit: { page: session.page, section: session.section, action: 'set-section', content: text } };
}
function bytesOf(value) { return new TextEncoder().encode(JSON.stringify(value)).byteLength; }
function setEditorStatus(message) { $('edit-status').textContent = message; }
function closeEditor() {
  if (busy) return;
  editSession = null;
  $('edit-shell').hidden = true;
  $('edit-preview').hidden = true;
  $('edit-save').hidden = true;
  $('edit-rebase').hidden = true;
}
function invalidatePreview(message = 'Draft changed. Review again before sending.') {
  if (!editSession || editSession.acknowledged) return;
  editSession.preview = null;
  $('edit-preview').hidden = true;
  $('edit-save').hidden = true;
  setEditorStatus(message);
}
function openEdit(page, section, text, revision) {
  if (editSession) { setEditorStatus('Close the current editor before switching sections; your draft is preserved.'); $('edit-content').focus(); return; }
  editSession = { page, section, original: text, revision, preview: null, acknowledged: null };
  $('edit-target').textContent = `${page}/${section}`;
  $('edit-rev').textContent = `opening Wiki rev ${revision}`;
  $('edit-content').value = text;
  $('edit-content').disabled = false;
  $('edit-review').hidden = false;
  $('edit-preview').hidden = true;
  $('edit-save').hidden = true;
  $('edit-rebase').hidden = true;
  $('edit-shell').hidden = false;
  $('edit-command-context').hidden = true;
  $('edit-command-context').textContent = '';
  setEditorStatus('Edit a bounded existing section, then review against a fresh Host revision. No changes sent yet.');
  $('edit-content').focus();
}
function markStale(revision) {
  if (!editSession || editSession.acknowledged) return;
  editSession.preview = null;
  $('edit-save').hidden = true;
  $('edit-rebase').hidden = false;
  setEditorStatus(`Stale revision: opened at ${editSession.revision}, Host now at ${revision}. Draft preserved. Load latest baseline and review again.`);
}
function checkEditorRevision() {
  if (!editSession || editSession.acknowledged) return;
  const wiki = sourceRecord('wiki');
  if (isWikiDocument(wiki) && wiki.revision !== editSession.revision) markStale(wiki.revision);
}
function validAppliedEffects(effects) {
  if (effects === undefined) return true;
  if (effects?.state === 'unavailable') return Array.isArray(effects.items) && effects.items.length === 0;
  return effects?.state === 'source-backed' && effects.scanLimit === 100 &&
    Number.isSafeInteger(effects.scannedPlans) && effects.scannedPlans >= 0 && effects.scannedPlans <= effects.scanLimit &&
    Number.isSafeInteger(effects.omitted) && effects.omitted >= 0 && Array.isArray(effects.items) &&
    effects.items.length <= 24 && effects.items.length + effects.omitted <= effects.scannedPlans &&
    effects.items.every(item => item?.source === 'host-control-receipt' && item.kind === 'executed-effect' &&
      item.status === 'historical-applied-receipt' && typeof item.planId === 'string' &&
      typeof item.actionId === 'string' && typeof item.receivedAt === 'string' &&
      typeof item.planDigest === 'string' && /^[a-f0-9]{64}$/.test(item.planDigest) &&
      (item.sourceRevision === null || (Number.isSafeInteger(item.sourceRevision) && item.sourceRevision >= 0)));
}
async function getJson(key) {
  if (key === 'context') await ownerEditCsrf(); // exchange native launch code when provided
  const url = SOURCES[key].url + (key === 'surface' && surfaceQuery ? '?q=' + encodeURIComponent(surfaceQuery) : '');
  const response = await fetch(url, { cache: 'no-store',
    ...(['context','surface'].includes(key) ? { credentials: 'same-origin' } : {}), signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    if (key === 'context' && response.status === 401) {ownerCsrf = null;assistance?.reset();}
    throw new Error('HTTP ' + response.status + ' ' + SOURCES[key].url);
  }
  const data = await response.json();
  if (key === 'wiki' && !isWikiDocument(data)) throw new Error('Invalid Wiki revision/schema');
  if (key === 'state' && (!data || !Number.isSafeInteger(data.revision))) throw new Error('Invalid Host state revision');
  if (key === 'context' && (data?.schema !== 'vivim.wiki-context/1' ||
      data.state !== 'source-backed' || !Number.isSafeInteger(data.revision) ||
      !Number.isSafeInteger(data.totalObserved) || !Number.isSafeInteger(data.omitted) ||
      !Array.isArray(data.items) || data.items.length > 24 ||
      data.items.some(item => typeof item.entryId !== 'string' ||
        !Number.isSafeInteger(item.sequence) || typeof item.text !== 'string' ||
        item.status !== 'user-statement-unverified')))
    throw new Error('Invalid Host Wiki-context projection');
  if (key === 'context' && data.wikiChanges !== undefined) {
    const changes = data.wikiChanges;
    if (!changes || !Number.isSafeInteger(data.wikiRevision) || data.wikiRevision < 0 ||
        !Number.isSafeInteger(changes.total) || !Number.isSafeInteger(changes.omitted) ||
        !Array.isArray(changes.items) || changes.items.length > 24 || changes.omitted < 0 ||
        changes.total !== changes.items.length + changes.omitted || changes.items.some(item =>
          item?.kind !== 'committed-wiki-edit' || item.source !== 'host-product-journal' ||
          typeof item.entryId !== 'string' || !Number.isSafeInteger(item.sequence) ||
          item.sequence < 1 || item.sequence > data.revision || typeof item.receivedAt !== 'string' ||
          !Number.isSafeInteger(item.previousWikiRevision) || item.previousWikiRevision < 0 ||
          item.wikiRevision !== item.previousWikiRevision + 1 || item.wikiRevision > data.wikiRevision ||
          !['current-section-revision', 'superseded-section-revision'].includes(item.status) ||
          item.relationship?.kind !== 'mutated-section' || typeof item.relationship.page !== 'string' ||
          typeof item.relationship.section !== 'string'))
      throw new Error('Invalid committed Wiki change projection');
  }
  if (key === 'context' && !validAppliedEffects(data.applicationEffects))
    throw new Error('Invalid control receipt projection');
  if (key === 'roadmap' && !Array.isArray(data?.buildQueue)) throw new Error('Invalid canonical roadmap queue');
  if (key === 'surface' && (data?.schema !== 'vivim.file-surface/1' || data.generatorVersion !== 'hq.source-index/1' || !Array.isArray(data.files) || data.files.length > 48)) throw new Error('Invalid live file-surface projection');
  if (key === 'journal' && !Array.isArray(data) && !Array.isArray(data?.entries)) throw new Error('Invalid journal records');
  return data;
}
function revisionLabel(key, data) {
  if (key === 'wiki') return `Wiki rev ${data.revision}`;
  if (key === 'state') return `state rev ${data.revision} / Wiki rev ${present(data.wikiRevision)}`;
  if (key === 'context') return `source sequence ${data.revision} · ${data.totalObserved} observed`;
  if (key === 'surface') return `${fileRecords(data).length} indexed files · ${present(data.generatorVersion)} · ${present(data.status)}`;
  return `${entriesOf(data).length} entries · count is not a revision`;
}
function updateSourceMeta(key) {
  if (key === 'state') return; // state revision is already shown in the synchronization strip
  const field = $(key + '-source');
  if (!field) return;
  const snap = snapshots[key];
  field.className = 'source-meta' + (snap?.error ? snap?.data ? ' stale' : ' error' : '');
  field.textContent = `${SOURCES[key].path} · ${SOURCES[key].url} · ${snap?.data ? revisionLabel(key, snap.data) : 'not observed'}${snap?.error ? ` · stale/unavailable: ${snap.error}` : ' · Host read observed; independent acceptance not implied'}`;
}
function ingest(key, data) {
  const signature = JSON.stringify(data);
  const previous = snapshots[key];
  const changed = !previous || previous.signature !== signature || Boolean(previous.error);
  snapshots[key] = { data, signature, error: null, observedAt: new Date().toISOString() };
  if (key === 'surface' && surfaceContextSelection && !currentSurfaceRecord(surfaceContextSelection))
    clearSurfaceContext('Indexed source changed or authorization was lost. Read current context again.');
  if (key === 'surface' && autoContextPending) {
    autoContextPending = false;
    autoSurfaceContext(data);
  }
  updateSourceMeta(key);
  if (changed) {
    if (key === 'wiki') {
      $('wiki-view').replaceChildren(renderWiki(data));
      if (sourceRecord('context')) $('context-view').replaceChildren(renderContext(sourceRecord('context')));
    }
    if (key === 'context') $('context-view').replaceChildren(renderContext(data));
    if (key === 'surface') $('surface-view').replaceChildren(renderFileSurface(data));
    if (key === 'journal') {
      $('journal-view').replaceChildren(renderJournal(data));
      if (sourceRecord('wiki')) $('wiki-view').replaceChildren(renderWiki(sourceRecord('wiki')));
    }
  }
  if (key === 'wiki') {
    $('rev').textContent = `Wiki revision: ${data.revision}`;
    checkEditorRevision();
    checkReadback(data);
  }
  if (key === 'state') $('state-rev').textContent = `Chat state: ${data.revision} · Wiki ${present(data.wikiRevision)}`;
}
function checkReadback(wiki) {
  const session = editSession;
  if (!session?.acknowledged) return;
  const ack = session.acknowledged;
  if (wiki.revision >= ack.wikiRevision && wiki.pages?.[session.page]?.sections?.[session.section] === ack.content) {
    session.acknowledged.confirmed = true;
    $('edit-review').hidden = true;
    $('edit-save').hidden = true;
    $('edit-content').disabled = true;
    setEditorStatus(`Host acknowledged rev ${ack.wikiRevision}; fresh GET /api/wiki confirms the exact content. Independent A02/A04 acceptance still pending.`);
  } else if (wiki.revision >= ack.wikiRevision) {
    setEditorStatus(`Host acknowledged rev ${ack.wikiRevision}, but readback does not match. Do not submit again; inspect Host journal.`);
  }
}
function renderSync() {
  const keys = Object.keys(SOURCES).filter(key => !['context','surface'].includes(key)); // private sources may be locked
  const seen = keys.filter(key => !!snapshots[key]?.data).length;
  const failures = keys.filter(key => !!snapshots[key]?.error);
  const wiki = sourceRecord('wiki');
  const state = sourceRecord('state');
  const journal = sourceRecord('journal');
  const edits = entriesOf(journal).filter(entry => entry?.kind === 'wiki-edit').length;
  $('source-mode').textContent = seen === keys.length && failures.length === 0
    ? `Host live read-through · ${edits ? 'journal-backed edits observed' : 'initial Wiki content'}`
    : `Host sources ${seen}/${keys.length} · ${failures.length ? 'partial / stale' : 'loading'}`;
  const context = sourceRecord('context');
  const mismatch = (wiki && state && wiki.revision !== state.wikiRevision) ||
    (wiki && Number.isSafeInteger(context?.wikiRevision) && wiki.revision !== context.wikiRevision);
  $('sync-status').textContent = failures.length ? `Retry pending: ${failures.map(k => SOURCES[k].url).join(', ')}. Last good views retained.` :
    mismatch ? 'Cross-endpoint Wiki revisions differ in this polling cycle; rechecking.' :
      `Observed ${seen}/${keys.length} Host sources · source data is not independent verification`;
}
async function refresh() {
  if (refreshing) return;
  refreshing = true;
  try {
    const keys = Object.keys(SOURCES);
    const queryEpoch = surfaceQueryEpoch;
    const responses = await Promise.allSettled(keys.map(getJson));
    responses.forEach((result, index) => {
      const key = keys[index];
      if (key === 'surface' && queryEpoch !== surfaceQueryEpoch) return;
      if (result.status === 'fulfilled') ingest(key, result.value);
      else {
        const message = String(result.reason?.message || result.reason);
        if (key === 'context') {
          // Never retain private text in the DOM after auth loss or failed refresh.
          ownerCsrf = null;assistance?.reset();
          snapshots[key] = { data: null, signature: null, error: message };
          $('context-view').replaceChildren(element('p', 'empty',
            message.includes('Owner session') || message.includes('HTTP 401')
              ? 'Owner context locked. Unlock Host Control to see user observations.'
              : 'Owner context temporarily unavailable. No cached private content displayed.'));
        } else if (key === 'surface') {
          autoContextPending = false;sourceCardHost=null;
          clearSurfaceContext('Authorized HQ source unavailable. No cached context displayed.');
          snapshots[key] = { data: null, signature: null, error: message };
          $('surface-view').replaceChildren(element('p', 'empty', message.includes('HTTP 401')
            ? 'Source index locked. Unlock Host Control to inspect development source.'
            : 'Authorized HQ source index unavailable. No cached or demo source displayed.'));
        } else {
          snapshots[key] = { ...snapshots[key], error: message };
          if (key === 'wiki' && sourceRecord('context'))
            $('context-view').replaceChildren(renderContext(sourceRecord('context')));
        }
        updateSourceMeta(key);
      }
    });
    renderSync();
  } finally { refreshing = false; }
}
// A typed interpretation may open a draft; only explicit owner confirmation mutates Host.
async function interpretWikiCommand(event) {
  event.preventDefault();
  assistance?.reset();
  if (interpreting || busy) return;
  if (editSession) {
    $('wiki-command-status').textContent = 'Close the current editor first. Your draft is preserved.';
    return;
  }
  const sentence = $('wiki-command').value.trim();
  if (!sentence || sentence.length > 1000) {
    $('wiki-command-status').textContent = 'Enter one Wiki command (maximum 1000 characters).';
    return;
  }
  const destination=resolveDesktopDestination(sentence);
  if(destination){
    if(destination.href)window.location.assign(destination.href);
    else $('wiki-command-status').textContent='That screen requires the paired VIVIM PWA.';
    return;
  }
  interpreting = true;
  $('wiki-command-run').disabled = true;
  $('wiki-command-status').textContent = 'Interpreting with authenticated Host…';
  try {
    const csrf = await ownerEditCsrf({ fresh: true });
    const response = await fetch('/api/host/control/interpret', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'content-type': 'application/json', 'x-vivim-control': '1', 'x-vivim-ui-csrf': csrf },
      body: JSON.stringify({ text: sentence }), signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
      if (response.status === 401) {ownerCsrf = null;assistance?.reset();}
      throw new Error('Host interpretation refused HTTP ' + response.status);
    }
    const meaning = await response.json();
    const route=resolveProductRoute(sentence,{hostMeaning:meaning});
    if (meaning?.schema !== 'vivim.control-language/1' || meaning.outcome !== 'candidate' ||
        meaning.candidate?.actionId !== 'wiki.section.edit' ||
        !meaning.candidate.args || meaning.executionPerformed === true) {
      const explanation = typeof meaning?.question === 'string' ? meaning.question :
        typeof meaning?.refusal?.message === 'string' ? meaning.refusal.message :
        'Only an unambiguous typed wiki.section.edit candidate can open a draft.';
      const structural=['wiki.page.create','wiki.page.move','wiki.pages.link','wiki.pages.list','wiki.section.read'].includes(meaning?.candidate?.actionId);
      $('wiki-command-status').textContent = structural && meaning.outcome==='candidate'
        ? 'Wiki command recognized. Continue in Chat to review the Host action; nothing has been sent.'
        : 'No Wiki edit (' + String(meaning?.outcome ?? 'invalid').slice(0, 50) + '). ' + explanation;
      // Keep the dedicated editor for exact Wiki section drafts. All other
      // recognized commands and unresolved requests continue through Chat's
      // existing planner, not another query executor or mutation contract.
      if(meaning?.schema==='vivim.control-language/1'&&
         (route.kind==='host'||route.kind==='provider')){
        const open=element('button','','Continue in Chat (draft only)');
        open.type='button';
        open.addEventListener('click',()=>{
          try {
            window.sessionStorage.setItem(HANDOFF_KEY,JSON.stringify({text:sentence,expiresAt:Date.now()+60000}));
            window.location.assign('/chat');
          }catch{
            $('wiki-command-status').textContent='Could not transfer the draft. Copy your request and open Chat; nothing was sent.';
          }
        });
        $('wiki-command-status').appendChild(open);
      }
      return;
    }
    const { target, content } = meaning.candidate.args;
    if (typeof content !== 'string' || !content.trim() || content.length > 3000 ||
        new TextEncoder().encode(content).byteLength > 3072) {
      $('wiki-command-status').textContent = 'Wiki content exceeds existing editor limits; no edit proposed.';
      return;
    }
    const wiki = await getJson('wiki');
    const canonical = resolveWikiTarget(wiki, target);
    if (bytesOf(mutationEnvelope(canonical, wiki.revision, content)) > MAX_ENTRY_BYTES) {
      $('wiki-command-status').textContent = 'Edit exceeds Host journal limit; no edit proposed.';
      return;
    }
    ingest('wiki', wiki);
    openEdit(canonical.page, canonical.section, canonical.content, wiki.revision);
    $('edit-content').value = content;
    $('edit-command-context').textContent = 'Typed wiki.section.edit from: "' + sentence +
      '" · target ' + canonical.page + '/' + canonical.section + ' · nothing saved';
    $('edit-command-context').hidden = false;
    $('wiki-command-status').textContent = 'Typed edit prepared for ' +
      canonical.page + '/' + canonical.section + '. Review and confirm to save.';
    setEditorStatus('Typed command interpreted. Review the exact diff, then confirm explicitly.');
  } catch (error) {
    $('wiki-command-status').textContent = 'Command unavailable: ' +
      String(error?.message || error) + '. No edit sent.';
  } finally {
    interpreting = false;
    $('wiki-command-run').disabled = false;
  }
}
async function rebase() {
  const session = editSession;
  if (!session || busy || session.acknowledged) return;
  busy = true;
  try {
    const wiki = await getJson('wiki');
    ingest('wiki', wiki);
    const current = wiki.pages?.[session.page]?.sections?.[session.section];
    if (typeof current !== 'string') { setEditorStatus('Target no longer exists. Draft preserved; cannot rebase.'); return; }
    session.original = current;
    session.revision = wiki.revision;
    session.preview = null;
    $('edit-rev').textContent = `fresh Wiki rev ${wiki.revision}`;
    $('edit-preview').hidden = true;
    $('edit-save').hidden = true;
    $('edit-rebase').hidden = true;
    setEditorStatus('Latest Host baseline loaded; draft preserved. Review the new diff before confirming.');
  } catch (error) { setEditorStatus(`Baseline refresh failed: ${error}. Draft preserved.`); }
  finally { busy = false; }
}
async function review() {
  const session = editSession;
  if (!session || busy || session.acknowledged) return;
  busy = true;
  try {
    const wiki = await getJson('wiki');
    ingest('wiki', wiki);
    if (wiki.revision !== session.revision) { markStale(wiki.revision); return; }
    const latest = wiki.pages?.[session.page]?.sections?.[session.section];
    if (typeof latest !== 'string' || latest !== session.original) {
      markStale(wiki.revision);
      setEditorStatus('Section source differs from opening baseline. Draft preserved; load fresh baseline.');
      return;
    }
    const proposed = $('edit-content').value;
    if (proposed === latest) { invalidatePreview('No change to review.'); return; }
    if (bytesOf(mutationEnvelope(session, wiki.revision, proposed)) > MAX_ENTRY_BYTES) {
      invalidatePreview('Change exceeds Host 4KB journal entry limit. Shorten the draft; nothing was sent.'); return;
    }
    session.preview = { revision: wiki.revision, before: latest, after: proposed };
    $('edit-rev').textContent = `reviewed Wiki rev ${wiki.revision}`;
    $('edit-before').textContent = latest;
    $('edit-after').textContent = proposed;
    $('edit-diff').textContent = linesDiff(latest, proposed);
    $('edit-preview-meta').textContent = `Target ${session.page}/${session.section} · expectedRevision=${wiki.revision} · explicit Host acknowledgement required`;
    $('edit-preview').hidden = false;
    $('edit-save').hidden = false;
    $('edit-rebase').hidden = true;
    setEditorStatus('Preview only. Confirm to request one revision-guarded Host journal append.');
  } catch (error) { invalidatePreview(`Cannot review without fresh Host Wiki: ${error}. Draft preserved.`); }
  finally { busy = false; }
}
// Reuse the existing Host control UI session; no actor string, Origin claim or
// x-vivim-control marker on its own can authorize a Wiki mutation.
async function ownerEditCsrf({ fresh = false } = {}) {
  if (ownerCsrf && !fresh) return ownerCsrf;
  const fragment = typeof window !== 'undefined' ? String(window.location?.hash || '') : '';
  let response;
  if (fragment.startsWith('#control-session=')) {
    const match = fragment.match(/^#control-session=([a-f0-9]{64})$/);
    // A launch code must not survive in navigation history.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (!match) throw new Error('Invalid Host launch code');
    response = await fetch('/api/host/control/ui-exchange', {
      method: 'POST', cache: 'no-store', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'x-vivim-control': '1' },
      body: JSON.stringify({ code: match[1] }), signal: AbortSignal.timeout(5000)
    });
  } else {
    response = await fetch('/api/host/control/ui-state', {
      method: 'GET', cache: 'no-store', credentials: 'same-origin',
      signal: AbortSignal.timeout(5000)
    });
  }
  if (!response.ok) throw new Error('Owner session required. Unlock Host Control on this PC before editing.');
  const data = await response.json().catch(() => ({}));
  if (data.schema !== 'vivim.control-ui-session/1' || !/^[a-f0-9]{64}$/.test(data.csrf || ''))
    throw new Error('Host owner-session proof unavailable; no edit sent.');
  ownerCsrf = data.csrf;
  return ownerCsrf;
}
async function submitEdit(event) {
  event.preventDefault();
  const session = editSession;
  if (!session || !session.preview || busy || session.acknowledged) return;
  busy = true;
  let requestSent = false;
  const reviewed = session.preview;
  $('edit-save').disabled = true;
  try {
    // This new GET after review prevents a knowingly stale confirmation; Host CAS is final.
    const fresh = await getJson('wiki');
    ingest('wiki', fresh);
    if (fresh.revision !== reviewed.revision ||
        fresh.pages?.[session.page]?.sections?.[session.section] !== reviewed.before ||
        $('edit-content').value !== reviewed.after) {
      markStale(fresh.revision);
      setEditorStatus('Revision or draft changed after preview. Nothing sent; review against the latest Host snapshot.');
      return;
    }
    const payload = mutationEnvelope(session, reviewed.revision, reviewed.after);
    if (bytesOf(payload) > MAX_ENTRY_BYTES) { invalidatePreview('Entry exceeds 4KB; nothing sent.'); return; }
    const csrf = await ownerEditCsrf({ fresh: true });
    requestSent = true;
    const result = await fetch('/api/mutate', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'x-vivim-control': '1', 'x-vivim-ui-csrf': csrf },
      body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(5000)
    });
    if (!result.ok) {
      if (result.status === 401) {ownerCsrf = null;assistance?.reset();}
      const detail = (await result.text()).slice(0, 240);
      if (result.status === 409) { markStale(fresh.revision); }
      setEditorStatus(`Host refused HTTP ${result.status}: ${detail}. Draft preserved; no save claimed.`);
      return;
    }
    const acknowledgement = await result.json();
    if (acknowledgement?.kind !== 'wiki-edit' || acknowledgement?.actor !== ACTOR ||
        acknowledgement?.wikiRevision !== payload.expectedRevision + 1 ||
        acknowledgement?.edit?.page !== session.page || acknowledgement?.edit?.section !== session.section ||
        acknowledgement?.edit?.content !== payload.edit.content ||
        typeof acknowledgement.receivedAt !== 'string') {
      // Unknown acknowledgement is not proof. Do not blindly retry a possibly-applied edit.
      session.acknowledged = { wikiRevision: payload.expectedRevision + 1, content: payload.edit.content, confirmed: false };
      $('edit-save').hidden = true;
      setEditorStatus('Host reply was not a valid Wiki edit receipt. Outcome unknown; check journal/readback before retrying.');
      return;
    }
    session.acknowledged = { wikiRevision: acknowledgement.wikiRevision, content: payload.edit.content, confirmed: false };
    $('edit-save').hidden = true;
    setEditorStatus(`Host acknowledged rev ${acknowledgement.wikiRevision}; checking fresh Wiki readback…`);
    try { ingest('wiki', await getJson('wiki')); }
    catch (error) { setEditorStatus(`Host acknowledged but readback failed: ${error}. Do not resubmit; retry source refresh.`); }
  } catch (error) {
    // Transport failure can mean request reached Host: preserve draft, do not claim success.
    if (requestSent && session && !session.acknowledged) {
      session.acknowledged = { wikiRevision: reviewed.revision + 1, content: reviewed.after, confirmed: false };
      $('edit-save').hidden = true;
    }
    setEditorStatus(requestSent
      ? `Network/receipt uncertainty: ${error}. Check live Wiki/journal before considering another edit; draft preserved.`
      : `Authorization or revision check failed before POST: ${error}. Draft preserved; unlock Host and retry.`);
  } finally { busy = false; $('edit-save').disabled = false; renderSync(); }
}

$('refresh-now').addEventListener('click', () => { void refresh(); });
$('surface-search').addEventListener('submit', event => {
  event.preventDefault();
  surfaceQuery = $('surface-query').value.trim().slice(0,240);
  surfaceQueryEpoch++;
  autoContextPending = true;
  clearSurfaceContext('Reading matching annotated source…');
  snapshots.surface = { data: null, error: null };sourceCardHost=null;
  $('surface-view').replaceChildren(element('p', 'empty', 'Searching authorized source…'));
  updateSourceMeta('surface');
  // If a poll is active, its obsolete query result is ignored; the next poll
  // automatically issues the latest search.
  void refresh();
});
$('surface-reindex').addEventListener('click', async () => {
  if (indexingSources) return;
  indexingSources = true;
  autoContextPending = false;
  clearSurfaceContext('Refreshing source index. Context will be read from the new index.');
  $('surface-reindex').disabled = true;
  $('surface-reindex-status').textContent = 'Refreshing the approved source index…';
  try {
    const csrf = await ownerEditCsrf({ fresh: true });
    const response = await fetch('/api/file-surface/index', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'x-vivim-control': '1', 'x-vivim-ui-csrf': csrf },
      signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const result = await response.json();
    $('surface-reindex-status').textContent = result.status === 'indexed'
      ? 'Index refreshed. Reading current source…' : 'Index partially refreshed; some sources could not be read.';
    const epoch = surfaceQueryEpoch;
    const currentSurface = await getJson('surface');
    if (epoch === surfaceQueryEpoch) { autoContextPending = true; ingest('surface', currentSurface); }
  } catch {
    snapshots.surface = { data: null, error: 'Index refresh not confirmed' };sourceCardHost=null;
    $('surface-view').replaceChildren(element('p', 'empty', 'Index refresh not confirmed. Refresh sources to inspect the result.'));
    $('surface-reindex-status').textContent = 'Refresh unavailable or unconfirmed. No automatic retry.';
    updateSourceMeta('surface');
  } finally { indexingSources = false; $('surface-reindex').disabled = false; }
});
const assistPanel=$('composer-assist');
if(assistPanel)assistance=mountComposerAssist({field:$('wiki-command'),host:assistPanel,
  getScope:()=>busy||interpreting||editSession||document.hidden?null:ownerCsrf,
  interpret:async text=>{
    const csrf=ownerCsrf;
    if(!csrf)throw Error('OWNER_AUTH');
    const response=await fetch('/api/host/control/interpret',{
      method:'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(5000),
      headers:{'content-type':'application/json','x-vivim-control':'1','x-vivim-ui-csrf':csrf},
      body:JSON.stringify({text,composer:true})
    });
    if(!response.ok){
      if(response.status===401){ownerCsrf=null;assistance?.reset();}
      throw Error('Host interpretation unavailable');
    }
    return response.json();
  }});
$('wiki-command-form').addEventListener('submit', event => { void interpretWikiCommand(event); });
$('edit-content').addEventListener('input', () => invalidatePreview());
$('edit-review').addEventListener('click', () => { void review(); });
$('edit-rebase').addEventListener('click', () => { void rebase(); });
$('edit-cancel').addEventListener('click', closeEditor);
$('edit').addEventListener('submit', event => { void submitEdit(event); });
document.addEventListener('visibilitychange', () => { if(document.hidden)assistance?.reset();else void refresh(); });
void refresh();
setInterval(() => { if (!document.hidden) void refresh(); }, POLL_MS);
