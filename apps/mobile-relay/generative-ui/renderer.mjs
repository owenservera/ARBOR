// GUI01 single safe DOM renderer. Never uses innerHTML, eval, remote assets, or code-bearing handlers.
import {validateSurface,projectSurface,invalid} from './catalog.mjs';
const FONT={system:'system-ui, sans-serif',humanist:'"Segoe UI", sans-serif',geometric:'"Century Gothic", sans-serif',editorial:'Georgia, serif',mono:'Consolas, monospace'};
function ink(hex){const rgb=[1,3,5].map(i=>{const v=parseInt(hex.slice(i,i+2),16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});const L=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return (L+.05)/.05>=1.05/(L+.05)?'#000000':'#ffffff';}
export function renderSurface(mount,surface,{audience='phone',approvedRefs=[],onIntent=()=>{}}={}){
  if(!mount||typeof mount.replaceChildren!=='function'||!mount.ownerDocument)invalid('DOM mount required');
  if(typeof onIntent!=='function')invalid('intent handler required');
  const s=projectSurface(surface,{audience,refs:new Set(approvedRefs)});
  const doc=mount.ownerDocument;
  const element=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className='vivim-ui-'+cls;if(text!==undefined)el.textContent=text;return el;};
  const t=s.theme;
  const container=element('section','surface');container.setAttribute('data-surface-id',s.surfaceId);
  Object.assign(container.style,{backgroundColor:t.background,color:ink(t.background),fontFamily:FONT[t.fontFamily],fontSize:t.fontSizePx+'px',borderRadius:t.radiusPx+'px'});
  const render=n=>{
    const p=n.props;let el;
    switch(n.type){
      case 'stack':case 'grid':el=element('div',n.type);el.style.display='grid';el.style.gap={sm:'8px',md:'14px',lg:'22px'}[p.gap];
        if(n.type==='grid')el.style.gridTemplateColumns=`repeat(${p.columns},minmax(0,1fr))`;
        else if(p.direction==='horizontal')el.style.gridAutoFlow='column';break;
      case 'text':el=element(p.variant==='heading'?'h2':'p','text',p.value);break;
      case 'card':case 'profile-card':case 'project-card':el=element('article','card');{const h=element('h3','card-title',p.title);el.appendChild(h);if(p.description)el.appendChild(element('p','card-description',p.description));}break;
      case 'button':el=element('button','button',p.label);el.type='button';el.addEventListener('click',()=>onIntent({intent:p.intent,targetId:p.targetId??n.id,componentId:n.id,surfaceId:s.surfaceId,revision:s.revision}));break;
      case 'collection':case 'timeline':case 'chart':el=element('section',n.type);el.appendChild(element('h3','collection-title',p.title));{
        const list=element('ul','items');for(const item of p.items){const li=element('li','item',item.label);
          if(n.type==='chart')li.appendChild(element('span','value',String(item.value)));
          else if(item.detail)li.appendChild(element('span','detail',item.detail));list.appendChild(li);}el.appendChild(list); }break;
      default:invalid('unknown component');
    }
    el.setAttribute('data-component-id',n.id);
    for(const child of n.children)el.appendChild(render(child));return el;
  };
  container.appendChild(render(s.tree));mount.replaceChildren(container);return {surfaceId:s.surfaceId,revision:s.revision,rendered:true};
}
