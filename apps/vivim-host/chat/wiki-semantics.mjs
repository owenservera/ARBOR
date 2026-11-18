// Pure read projection of the existing owner-private Wiki context. No persistence.
import { createHash } from 'node:crypto';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const pageId = page => 'wiki:page:' + encodeURIComponent(page);
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

// The journal is the authority. Do not convert seed pages or a mere text
// mention into a committed fact. Keep current link evidence independent of
// recent event history so later unrelated changes do not immediately hide it.
export function projectWikiStructure(records, wiki) {
  const items=[], active=new Map(), pageEvidence=new Map();
  const hasPage=page=>typeof page==='string'&&Object.hasOwn(wiki?.pages||{},page);
  for (const e of records) {
    if(e?.kind!=='wiki-structure'||typeof e.entryId!=='string'||
       !Number.isSafeInteger(e.sequence)||!Number.isSafeInteger(e.expectedRevision))continue;
    const edit=e.edit, revision=e.expectedRevision+1;
    if(!wiki||revision>wiki.revision)continue;
    if(edit?.action==='create-page'||edit?.action==='move-page'){
      if(!hasPage(edit.page))continue;
    }else if(edit?.action==='link-pages'){
      if(!hasPage(edit.from)||!hasPage(edit.to)||edit.from===edit.to||
         !wiki.pages[edit.from].links?.includes(edit.to))continue;
    }else continue;
    const item={source:'host-product-journal',kind:'committed-wiki-structure',
      entryId:e.entryId,sequence:e.sequence,receivedAt:e.receivedAt,
      previousWikiRevision:e.expectedRevision,wikiRevision:revision,
      edit:{...edit},contentDigest:digest(edit),
      status:edit.action==='link-pages'?'current-link':
        edit.action==='create-page'?'current-page':'historical-order-change'};
    items.push(item);
    if(edit.action==='link-pages'){
      active.set(JSON.stringify([edit.from,edit.to]),item);
      pageEvidence.set(edit.from,{page:edit.from,role:'from',event:item});
      pageEvidence.set(edit.to,{page:edit.to,role:'to',event:item});
    }else pageEvidence.set(edit.page,{page:edit.page,role:'page',event:item});
  }
  const links=[...active.values()], selectedLinks=links.slice(-24);
  // Page evidence is selected from the full validated journal, not the recent
  // event window: a later move must never regress to an older source revision.
  const selectedPages=new Set(selectedLinks.flatMap(e=>[e.edit.from,e.edit.to]));
  for(const item of [...pageEvidence.values()].sort((a,b)=>b.event.sequence-a.event.sequence).slice(0,24))
    selectedPages.add(item.page);
  const pageSources=[...selectedPages].sort().map(page=>pageEvidence.get(page));
  return {wikiRevision:wiki?.revision??null,total:items.length,omitted:Math.max(0,items.length-24),
    items:items.slice(-24),totalLinks:links.length,omittedLinks:Math.max(0,links.length-24),
    links:selectedLinks,pageSources};
}

// Exact typed targets are associations, not proof that an effect occurred.
export function resolveSemanticWikiPages(wiki,intent) {
  if(intent?.outcome!=='candidate'||!wiki?.pages)return [];
  const {actionId,args}=intent.candidate??{};
  if(!args)return [];
  const names=actionId==='wiki.pages.link'?[args.from,args.to]:
    ['wiki.page.move','wiki.section.read','wiki.page.delete'].includes(actionId)?[args.page]:[];
  return [...new Set(names.flatMap(name=>{
    if(typeof name!=='string')return [];
    const matching=Object.keys(wiki.pages).filter(p=>p.toLowerCase()===name.toLowerCase());
    return matching.length===1?matching:[];
  }))];
}

// Assurance is narrow: a replayed commit proves its occurrence, not the
// truth of user-authored text; an applied receipt is historical evidence,
// not a verified action contract or a grant. No inference is promoted.
export function wikiClaimEvidence(record,context){
  const source=record.source;
  const historical=record.classification==='committed-change'||record.freshness?.startsWith('historical')||record.freshness?.startsWith('superseded');
  const fresh=historical?'historical':source?.authority==='host-product-journal'&&
    Number.isSafeInteger(source.wikiRevision)&&source.wikiRevision>0&&Number.isSafeInteger(context.wikiRevision)&&source.wikiRevision<=context.wikiRevision
    ?'current-at-snapshot':'unresolved';
  const base={freshness:fresh,conflict:false,planningEligible:false};
  if(record.classification==='user-statement-unverified')return {...base,origin:'declared',assurance:'attested',claim:'statement-occurrence',freshness:'historical'};
  if(record.classification==='inferred-relationship')return {...base,origin:'inferred',assurance:'proposed',claim:'candidate-association'};
  if(record.classification==='typed-identity')return {...base,origin:'extracted',assurance:'proposed',claim:'action-identity'};
  if(record.classification==='executed-effect')return {...base,origin:'observed',
    assurance:source?.authority==='host-control-receipt'&&typeof source.ref==='string'?'verified':'proposed',
    claim:record.kind==='confirmed-change'?'receipt-to-commit-link':'applied-receipt-occurrence',freshness:'historical'};
  if(['committed-change','observed-state'].includes(record.classification)){
    const supported=source?.authority==='host-product-journal'&&typeof source.ref==='string'&&
      Number.isSafeInteger(source.wikiRevision)&&source.wikiRevision>0&&Number.isSafeInteger(context.wikiRevision)&&source.wikiRevision<=context.wikiRevision;
    return {...base,origin:'observed',assurance:supported?'verified':'proposed',
      claim:record.classification==='committed-change'?'committed-event-occurrence':'journal-backed-structure'};
  }
  return {...base,origin:'derived',assurance:'proposed',claim:'unresolved'};
}

export function projectWikiSemantics(context) {
  const nodes = new Map(), relations = new Map();
  const put = node => { nodes.set(node.id, node); return node.id; };
  function link(from, kind, to, classification, source) {
    const id = 'relation:' + digest([from,kind,to,source.authority,source.ref]);
    relations.set(id, { id, from, kind, to, classification, source });
  }
  function pageNode(page,source) {
    const id=pageId(page);
    if(!nodes.has(id))put({id,kind:'wiki-page',label:page,classification:'observed-state'});
    if(source&&(!nodes.get(id).source||source.wikiRevision>=nodes.get(id).source.wikiRevision))
      Object.assign(nodes.get(id),{source,freshness:'current-at-snapshot'});
    return id;
  }
  function section(target, source, classification) {
    const page = pageNode(target.page);
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
    const id = put({ id: journalId(item.entryId), kind: 'wiki-change', label: item.captureKind==='task'?'Captured personal task':item.captureKind==='note'?'Captured personal note':'Committed Wiki edit',
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
  const structure=context.wikiStructure;
  if(structure&&structure.wikiRevision===context.wikiRevision) {
    for(const {page,event} of structure.pageSources||[])
      pageNode(page,{...journalSource(event),wikiRevision:event.wikiRevision,digest:event.contentDigest});
    const events=new Map([...(structure.items||[]),...(structure.links||[])].map(e=>[e.entryId,e]));
    for(const item of events.values()){
      const source={...journalSource(item),wikiRevision:item.wikiRevision,digest:item.contentDigest};
      const edit=item.edit;
      const id=put({id:journalId(item.entryId),kind:'wiki-structure-change',
        label:edit.action==='create-page'?'Created Wiki page':
          edit.action==='move-page'?'Moved Wiki page':'Linked Wiki pages',
        classification:'committed-change',freshness:item.status,source});
      if(edit.action==='link-pages'){
        const from=pageNode(edit.from,source),to=pageNode(edit.to,source);
        link(id,'linked-from',from,'committed-change',source);
        link(id,'linked-to',to,'committed-change',source);
        // Stable relationship identity independent of request or projection revision.
        if(item.status==='current-link'){
          const edgeId='relation:'+digest([from,'wiki-page-link',to]);
          relations.set(edgeId,{id:edgeId,from,to,kind:'wiki-page-link',
            classification:'observed-state',source});
        }
      }else{
        const page=pageNode(edit.page,source);
        link(id,edit.action==='create-page'?'created-page':'moved-page',page,'committed-change',source);
      }
    }
  }
  for (const item of observations) {
    // No raw statement hash in derived graph: short private text can be guessed.
    const source = journalSource(item);
    const id = put({ id: journalId(item.entryId), kind: 'user-observation', label: 'User statement',
      classification: 'user-statement-unverified', freshness: 'historical-statement', source });
    const meaning = item.interpretation;
    if (meaning?.outcome === 'candidate' && validAction(meaning.actionId)) {
      link(id, 'interpreted-as', action(meaning.actionId), 'inferred-relationship', source);
      for(const page of meaning.pageTargets||[])
        link(id,'candidate-target',pageNode(page),'inferred-relationship',
          {...source,wikiRevision:context.wikiRevision});
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
    const structural=item.structureLink&&nodes.get(journalId(item.structureLink.entryId));
    if(structural?.kind==='wiki-structure-change'&&structural.source.wikiRevision===item.structureLink.wikiRevision)
      link(id,'confirmed-change',structural.id,'executed-effect',source);
  }
  const order = (a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  // Honor the existing consumers' 256-node/edge contract. Prefer current
  // structural links and exact receipt/commit lineage. Never emit dangling edges.
  const priority=r=>r.kind==='wiki-page-link'?0:r.kind==='confirmed-change'?1:
    r.classification==='inferred-relationship'?3:2;
  const ordered=[...relations.values()].sort((a,b)=>priority(a)-priority(b)||order(a,b));
  const boundedNodes=new Map(), boundedRelations=[];
  for(const relation of ordered){
    const missing=[...new Set([relation.from,relation.to])].filter(id=>!boundedNodes.has(id));
    if(boundedRelations.length>=256||boundedNodes.size+missing.length>256)continue;
    if(missing.some(id=>!nodes.has(id)))continue;
    for(const id of missing)boundedNodes.set(id,nodes.get(id));
    boundedRelations.push(relation);
  }
  for(const node of [...nodes.values()].sort(order)){
    if(boundedNodes.size>=256)break;
    boundedNodes.set(node.id,node);
  }
  const result = {
    schema: 'vivim.autowiki-semantics/1', authority: 'read-only', scope: 'owner-private',
    journalRevision: context.revision, wikiRevision: context.wikiRevision,
    sources: { journal: 'source-backed', receipts: context.applicationEffects?.state || 'not-read',
      structure:structure?'source-backed':'not-read' },
    omitted: { observations: context.omitted || 0, changes: context.wikiChanges?.omitted || 0,
      effects: context.applicationEffects?.omitted || 0, structure:structure?.omitted||0,
      links:structure?.omittedLinks||0,nodes:nodes.size-boundedNodes.size,
      relationships:relations.size-boundedRelations.length },
    nodes: [...boundedNodes.values()].sort(order).map(node=>({...node,evidence:wikiClaimEvidence(node,context)})),
    relationships: boundedRelations.sort(order).map(relation=>({...relation,evidence:wikiClaimEvidence(relation,context)}))
  };
  return { ...result, digest: digest(result) };
}
