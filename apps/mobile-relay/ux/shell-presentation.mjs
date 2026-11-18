// Read-only app-wide presentation of an explicitly committed Host visual revision.
// No persistence, provider calls, arbitrary CSS, new authority or mutation handlers.
import {createHostRevisionGuard} from '../generative-ui/host-revision-guard.mjs';
import {validateSurface,validateShellTheme} from '../generative-ui/catalog.mjs';
import {readableForeground} from '../visual-theme.mjs';
const HEX=/^#[0-9a-fA-F]{6}$/;
const TOKENS=Object.freeze(['--bg','--tx','--mu','--bd','--s1','--s2','--ac','--ac2','--vivim-accent-ink','--vivim-background-image','--vivim-base-font-size','--vivim-corner-radius','--vivim-spacing-scale','--r-sm','--r-md','--r-lg']);
function blend(a,b,f){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-f)+parseInt(b.slice(i,i+2),16)*f).toString(16).padStart(2,'0')).join('');}
export function shellCss(settings,base={}){
  if(settings===undefined)return {};
  const s=validateShellTheme(settings),out={};
  const safe=(value,fallback)=>typeof value==='string'&&HEX.test(value.trim())?value.trim():fallback;
  const bg=s.background??safe(base.background,'#111214');
  const accent=s.accent??safe(base.accent,'#ec7b67');
  const secondary=s.secondary??safe(base.secondary,'#202226');
  if(s.background!==undefined){const ink=readableForeground(bg);Object.assign(out,{'--bg':bg,'--tx':ink,'--mu':blend(bg,ink,.72),'--bd':blend(bg,ink,.18),'--vivim-background-image':'none','--ac2':blend(bg,accent,.2)});}
  if(s.background!==undefined||s.secondary!==undefined)Object.assign(out,{'--s1':blend(bg,secondary,.28),'--s2':blend(bg,secondary,.53)});
  if(s.accent!==undefined)Object.assign(out,{'--ac':accent,'--ac2':blend(bg,accent,.2),'--vivim-accent-ink':readableForeground(accent)});
  if(s.fontSizePx!==undefined)out['--vivim-base-font-size']=s.fontSizePx+'px';
  if(s.radiusPx!==undefined)Object.assign(out,{'--vivim-corner-radius':s.radiusPx+'px','--r-sm':s.radiusPx*.5+'px','--r-md':s.radiusPx*.75+'px','--r-lg':s.radiusPx+'px'});
  if(s.spacingScale!==undefined)out['--vivim-spacing-scale']=String(s.spacingScale);
  return out;
}
export function createShellPresentation(body){
  if(!body?.style?.setProperty||!body.style.removeProperty)throw new TypeError('shell style mount required');
  const guard=createHostRevisionGuard();
  const clearPaint=()=>{for(const k of TOKENS)body.style.removeProperty(k);body.removeAttribute?.('data-vivim-shell-revision');};
  const clear=()=>{guard.disconnect();clearPaint();};
  function observe(record){
    const checked=guard.observe(record);clearPaint();
    if(checked.state!=='ready')return checked;
    try{
      const surface=validateSurface(checked.surface,{refs:new Set()});
      if(!surface.theme.shell)return checked;
      const doc=body.ownerDocument,baseStyle=doc?.defaultView?.getComputedStyle?.(doc.documentElement);
      const base={background:baseStyle?.getPropertyValue('--bg'),secondary:baseStyle?.getPropertyValue('--s2'),accent:baseStyle?.getPropertyValue('--ac')};
      for(const [key,value] of Object.entries(shellCss(surface.theme.shell,base)))body.style.setProperty(key,value);
      body.setAttribute?.('data-vivim-shell-revision',String(surface.revision));
      return checked;
    }catch{clear();return {state:'blocked',reason:'INVALID_SHELL_PRESENTATION',surface:null};}
  }
  return Object.freeze({observe,clear});
}
