// GUI01 single safe DOM renderer. Never uses innerHTML, eval, remote assets, or code-bearing handlers.
import {projectSurface,invalid} from './catalog.mjs';
import {resolveUiSourceIdentity} from '../vec/ui-taxonomy/registry.mjs';

// One source of TierFlow computation. The Host serves only these reviewed TS
// modules with types stripped; Node/Bun consumers use the same package sources.
// A missing runtime is a refusal for Build, never a legacy-render success.
const runtimeRoot = new URL(import.meta.url.startsWith('file:')
  ? '../../../packages/tierflow/src/visual-runtime/' : '../tierflow-runtime/', import.meta.url);
const tierflowRuntime = await Promise.all([
  import(new URL('document/import-legacy.ts', runtimeRoot).href),
  import(new URL('render/dom.ts', runtimeRoot).href)
]).catch(() => null);
const BUILD_TYPES = new Set(['stack','grid','text','card','collection','timeline','chart']);
export function tierflowViewport(mount) {
  const width = mount?.ownerDocument?.defaultView?.innerWidth ?? 390;
  return Math.max(240, Math.min(3840, Math.round(width) || 390));
}
export function planTierflowSurface(surface, {audience='phone',approvedRefs=[],viewportPx=390}={}) {
  if (!tierflowRuntime) invalid('TierFlow runtime unavailable');
  const source = projectSurface(surface,{audience,refs:new Set(approvedRefs)});
  const sourceNodes = new Map();
  const walk = n => {
    if (!BUILD_TYPES.has(n.type)) invalid('unsupported TierFlow component: '+n.type);
    sourceNodes.set(n.id,n);
    n.children.forEach(walk);
  };
  walk(source.tree);
  const [importer, renderer] = tierflowRuntime;
  // Scope labels satisfy the inert projection schema only. No identity, grant
  // or authority is derived here; the caller owns the Host revision guard.
  const converted = importer.importLegacyUiDocument(source,{
    ownerRef:'host-projection-unbound-owner',workspaceRef:source.surfaceId,sourceRef:source.surfaceId
  });
  if (converted.status !== 'preview' ||
      converted.losses.some(loss=>loss.code!=='THEME_NOT_MIGRATED'))
    invalid('TierFlow document conversion refused');
  const document = converted.document;
  const nodes = new Map(document.nodes.map(n=>[n.id,n]));
  const identities = new Map();
  if (document.revision!==source.revision || document.rootId!==source.tree.id ||
      nodes.size!==sourceNodes.size) invalid('TierFlow document identity mismatch');
  for (const [id,n] of sourceNodes) {
    const canonical = nodes.get(id);
    if (!canonical || canonical.type!==n.type ||
        JSON.stringify(canonical.children)!==JSON.stringify(n.children.map(c=>c.id)))
      invalid('TierFlow source identity mismatch');
    const a = resolveUiSourceIdentity({schema:source.schema,nativeType:n.type,props:n.props});
    const d = resolveUiSourceIdentity({schema:document.schema,nativeType:canonical.type,props:canonical.props});
    if (a.outcome!=='mapped' || d.outcome!=='mapped' ||
        a.source.status!=='source-closed' || d.source.status!=='source-closed' ||
        a.component.id!==d.component.id) invalid('TierFlow canonical component identity mismatch');
    identities.set(id,a.component.id);
  }
  const plan = renderer.renderUiDocument(document,{viewportPx});
  if (plan.status!=='ok' || plan.documentId!==document.documentId ||
      plan.revision!==source.revision || plan.root.children.length!==1 ||
      plan.root.children[0].id!==document.rootId ||
      plan.trace.length!==nodes.size ||
      plan.trace.some(t=>t.outcome!=='rendered'||t.id!==t.sourceId||!nodes.has(t.id)))
    invalid('TierFlow render plan refused');
  return {source,document,nodes,identities,plan};
}
const FONT={system:'system-ui, sans-serif',humanist:'"Segoe UI", sans-serif',geometric:'"Century Gothic", sans-serif',editorial:'Georgia, serif',mono:'Consolas, monospace'};
function ink(hex){const rgb=[1,3,5].map(i=>{const v=parseInt(hex.slice(i,i+2),16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});const L=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return (L+.05)/.05>=1.05/(L+.05)?'#000000':'#ffffff';}
export function renderSurface(mount,surface,{audience='phone',approvedRefs=[],onIntent=()=>{},tierflow=false,onMounted=null}={}){
  if(!mount||typeof mount.replaceChildren!=='function'||!mount.ownerDocument)invalid('DOM mount required');
  if(typeof onIntent!=='function')invalid('intent handler required');
  const projected=tierflow?planTierflowSurface(surface,{audience,approvedRefs,viewportPx:tierflowViewport(mount)}):null;
  const s=projected?.source??projectSurface(surface,{audience,refs:new Set(approvedRefs)});
  const doc=mount.ownerDocument;
  const element=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className='vivim-ui-'+cls;if(text!==undefined)el.textContent=text;return el;};
  const t=s.theme;
  const container=element('section','surface');container.setAttribute('data-surface-id',s.surfaceId);
  Object.assign(container.style,{backgroundColor:t.background,color:ink(t.background),fontFamily:FONT[t.fontFamily],fontSize:t.fontSizePx+'px',borderRadius:t.radiusPx+'px'});
  if(projected){container.setAttribute('data-tierflow-document',projected.document.documentId);container.setAttribute('data-tierflow-revision',String(s.revision));container.setAttribute('data-tierflow-status',projected.plan.status);}
  const instances=[];
  const render=(n,planNode=null,parentId=null)=>{
    if(projected&&(!planNode||planNode.id!==n.id))invalid('TierFlow mounted node mismatch');
    const p=projected?projected.nodes.get(n.id).props:n.props;let el;
    switch(n.type){
      case 'stack':case 'grid':el=element('div',n.type);el.style.display=planNode?.layout.display??'grid';el.style.gap=({sm:8,md:14,lg:22}[p.gap]*t.spacingScale)+'px';
        if(n.type==='grid')el.style.gridTemplateColumns=`repeat(${planNode?.layout.columns??p.columns},minmax(0,1fr))`;
        else if(planNode){el.style.flexDirection=p.direction==='horizontal'?'row':'column';if(p.direction==='horizontal')el.style.flexWrap='wrap';}
        else if(p.direction==='horizontal')el.style.gridAutoFlow='column';break;
      case 'text':el=element(p.variant==='heading'?'h2':'p','text',planNode?.text??p.value);if(p.variant==='heading')el.style.fontSize=t.headingSizePx+'px';break;
      case 'card':case 'profile-card':case 'project-card':el=element('article','card');{const h=element('h3','card-title',planNode?.text??p.title);el.appendChild(h);if(p.description)el.appendChild(element('p','card-description',p.description));Object.assign(el.style,{backgroundColor:t.secondary,color:ink(t.secondary),borderRadius:t.radiusPx+'px',borderColor:t.accent});}break;
      case 'button':el=element('button','button',p.label);el.type='button';el.addEventListener('click',()=>onIntent({intent:p.intent,targetId:p.targetId??n.id,componentId:n.id,surfaceId:s.surfaceId,revision:s.revision}));break;
      case 'collection':case 'timeline':case 'chart':el=element('section',n.type);el.appendChild(element('h3','collection-title',p.title));{
        const list=element('ul','items');
        // TierFlow owns order and labels; canonical source supplies the exact typed detail/value.
        if(planNode&&(n.children.length!==0||planNode.children.length!==p.items.length))invalid('TierFlow structured item count mismatch');
        for(const [i,item] of p.items.entries()){
          const planItem=planNode?.children[i];
          if(planNode&&(!planItem||planItem.id!==n.id+'.item'+i||planItem.tag!=='li'||planItem.text!==item.label))invalid('TierFlow structured item mismatch');
          const li=element('li','item',planItem?.text??item.label);
          if(n.type==='chart')li.appendChild(element('span','value',String(item.value)));
          else if(item.detail)li.appendChild(element('span','detail',item.detail));list.appendChild(li);
        }el.appendChild(list); }break;
      default:invalid('unknown component');
    }
    el.setAttribute('data-component-id',n.id);
    if(projected){
      // Register the actual mounted element, not a fabricated taxonomy example.
      const settings=Object.fromEntries(Object.entries(p).filter(([k])=>['direction','gap','columns','variant'].includes(k)));
      instances.push({element:el,instanceId:n.id,parentId,type:n.type,componentId:projected.identities.get(n.id),
        surfaceId:s.surfaceId,revision:s.revision,settings});
    }
    if(planNode){
      el.setAttribute('data-ui-component-id',projected.identities.get(n.id));
      for(const [name,value] of Object.entries(planNode.attributes)){
        // A native heading retains its native heading semantics.
        if(name==='role'&&n.type==='text'&&p.variant==='heading')continue;
        el.setAttribute(name,value);
      }
      el.style.minWidth='0';
      const structuralChildren=['collection','timeline','chart'].includes(n.type)?[]:planNode.children;
      if(structuralChildren.length!==n.children.length)invalid('TierFlow child count mismatch');
      for(const child of structuralChildren){
        const sourceChild=n.children.find(c=>c.id===child.id);
        if(!sourceChild)invalid('TierFlow child identity mismatch');
        el.appendChild(render(sourceChild,child,n.id));
      }
    } else for(const child of n.children)el.appendChild(render(child));
    return el;
  };
  container.appendChild(render(s.tree,projected?.plan.root.children[0]??null));
  mount.replaceChildren(container);
  if(typeof onMounted==='function')onMounted(instances);
  return {surfaceId:s.surfaceId,revision:s.revision,rendered:true};
}
