// Read-only view adapter for the existing owner-authorized HQ file-surface.
// No local file access, mutation, grant creation, persistent cache or inference.
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const anchorId=value=>typeof value==='string'&&/^hq:file-anchor:[a-f0-9]{64}$/.test(value);
const label=value=>typeof value==='string'?value:'unavailable';
export function sourceCards(surface){
  if(surface?.schema!=='vivim.file-surface/1'||surface.authority!=='read_only_projection'||
      !Array.isArray(surface.files)||surface.files.length>48)return [];
  const seen=new Set(),cards=[];
  for(const file of surface.files){
    if(typeof file?.project!=='string'||typeof file.path!=='string'||file.sourceId!==file.project+':'+file.path||
       !hash(file.sourceDigest)||!hash(file.currentDigest)||!Array.isArray(file.annotations)||file.annotations.length>64)continue;
    for(const annotation of file.annotations){
      const a=annotation?.semanticAnchor,e=annotation?.evidence;
      if(!anchorId(a?.anchorId)||!hash(a.fingerprint)||a.contentHash!==file.sourceDigest||
        a.semanticId!==annotation.semanticId||a.annotationKind!==annotation.kind||
        !Array.isArray(a.lines)||!a.lines.includes(annotation.line)||!Number.isSafeInteger(annotation.line)||
        seen.has(a.anchorId))continue;
      seen.add(a.anchorId);
      const fresh=file.freshness==='indexed'&&file.sourceDigest===file.currentDigest;
      const conflict=!!e?.conflict||a.state==='ambiguous'||annotation.resolution==='invalid_kind';
      const state=!fresh?'stale':conflict?'contradicted':annotation.resolution==='deprecated'?'deprecated':
        e?.assurance==='verified'&&a.state==='indexed'&&e.claim==='annotation-occurrence'?'verified-occurrence':'unverified';
      cards.push({id:a.anchorId,fingerprint:a.fingerprint,project:file.project,path:file.path,
        sourceId:file.sourceId,sourceDigest:file.sourceDigest,line:annotation.line,semanticId:annotation.semanticId,
        kind:annotation.kind,resolution:annotation.resolution,state,
        origin:label(e?.origin),assurance:label(e?.assurance),readable:state==='verified-occurrence',
        authority:'read_only_projection'});
    }
  }
  return cards.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
}
export function sameSourceCard(current,old){
  return !!(current&&old&&current.readable&&old.readable&&current.id===old.id&&
    current.fingerprint===old.fingerprint&&current.sourceId===old.sourceId&&
    current.sourceDigest===old.sourceDigest&&current.line===old.line&&current.resolution===old.resolution);
}
export function matchesSourceContext(card,value){
  const bundle=value?.context,a=value?.anchor;
  return !!(card?.readable&&value?.schema==='vivim.source-context/1'&&value.status==='indexed'&&
    value.sourceId===card.sourceId&&value.sourceDigest===card.sourceDigest&&
    a?.anchorId===card.id&&a.fingerprint===card.fingerprint&&a.line===card.line&&
    a.semanticId===card.semanticId&&a.resolution===card.resolution&&a.authority==='read_only_projection'&&
    bundle?.schema==='hq.context-bundle/1'&&bundle.authority==='read_only_projection'&&
    hash(bundle.digest)&&typeof bundle.fragment==='string'&&bundle.fragment.length<=64000&&
    Array.isArray(bundle.sources)&&bundle.sources.length===1&&bundle.sources[0].ref===card.sourceId&&
    bundle.sources[0].contentHash===card.sourceDigest&&bundle.sources[0].semanticReferences?.some(r=>
      r.semanticAnchor?.anchorId===card.id&&r.semanticAnchor.fingerprint===card.fingerprint&&r.line===card.line));
}
export function exactSourceContextUrl(card){
  return '/api/file-surface/context?project='+encodeURIComponent(card.project)+'&path='+encodeURIComponent(card.path)+
    '&anchor='+encodeURIComponent(card.id)+'&fingerprint='+encodeURIComponent(card.fingerprint);
}
// Reconcile only affected cards. Replacing one card does not disturb open
// details on unchanged cards. Host authorization failure supplies no cards.
export function reconcileSourceCards(container,cards,{createElement,onRead}){
  const existing=new Map(Array.from(container.children).map(node=>[node.dataset?.anchorId,node]));
  const next=[];
  for(const card of cards.slice(0,256)){
    const signature=JSON.stringify(card);
    let node=existing.get(card.id);
    if(!node||node.dataset.signature!==signature){
      node=createElement('details');node.dataset.anchorId=card.id;node.dataset.signature=signature;
      const add=(tag,text)=>{const el=createElement(tag);el.textContent=text;node.appendChild(el);return el;};
      add('summary',card.semanticId+' · '+card.state);
      add('p',card.kind+' · '+card.project+'/'+card.path+':'+card.line);
      add('p',card.origin+' / '+card.assurance+' · registry '+card.resolution+' · read only');
      add('p','Anchor '+card.id+' · fingerprint '+card.fingerprint);
      if(card.readable){
        const button=add('button','Read verified source context');button.type='button';
        button.addEventListener('click',()=>onRead(card));
      }else add('p','Source context unavailable until current, unambiguous evidence is indexed.');
    }
    next.push(node);
  }
  const before=Array.from(container.children);
  if(before.length!==next.length||before.some((node,i)=>node!==next[i]))container.replaceChildren(...next);
}
