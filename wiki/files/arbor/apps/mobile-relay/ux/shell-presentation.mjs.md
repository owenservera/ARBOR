# File: apps/mobile-relay/ux/shell-presentation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/shell-presentation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3377 B |
| Lines | 43 |
| Hash | 4161dae05ff1 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HEX | const | 6 | no | const HEX=/^#[0-9a-fA-F]{6}$/; |
| TOKENS | const | 7 | no | const TOKENS=Object.freeze([&#39;--bg&#39;,&#39;--tx&#39;,&#39;--mu&#39;,&#39;--bd&#39;,&#39;--s1&#39;,&#39;--s2&#39;,&#39;--ac&#39;,&#39;--ac2&#39;,&#39;--vivim-accent-ink&#39;,&#39;--vivim-background-image&#39;,&#39;--vivim-base-font-size&#39;,&#39;--vivim-corner-radius&#39;,&#39;--vivim-spacing-… |
| blend | function | 8 | no | function blend(a,b,f){return &#39;#&#39;+[1,3,5].map(i=&gt;Math.round(parseInt(a.slice(i,i+2),16)*(1-f)+parseInt(b.slice(i,i+2),16)*f).toString(16).padStart(2,&#39;0&#39;)).join(&#39;&#39;);} |
| shellCss | function | 9 | yes | export function shellCss(settings,base={}){ |
| s | const | 11 | no | const s=validateShellTheme(settings),out={}; |
| safe | function | 12 | no | const safe=(value,fallback)=&gt;typeof value===&#39;string&#39;&amp;&amp;HEX.test(value.trim())?value.trim():fallback; |
| bg | const | 13 | no | const bg=s.background??safe(base.background,&#39;#111214&#39;); |
| accent | const | 14 | no | const accent=s.accent??safe(base.accent,&#39;#ec7b67&#39;); |
| secondary | const | 15 | no | const secondary=s.secondary??safe(base.secondary,&#39;#202226&#39;); |
| createShellPresentation | function | 24 | yes | export function createShellPresentation(body){ |
| guard | const | 26 | no | const guard=createHostRevisionGuard(); |
| clearPaint | function | 27 | no | const clearPaint=()=&gt;{for(const k of TOKENS)body.style.removeProperty(k);body.removeAttribute?.(&#39;data-vivim-shell-revision&#39;);}; |
| clear | function | 28 | no | const clear=()=&gt;{guard.disconnect();clearPaint();}; |
| observe | function | 29 | no | function observe(record){ |
| checked | const | 30 | no | const checked=guard.observe(record);clearPaint(); |
| surface | const | 33 | no | const surface=validateSurface(checked.surface,{refs:new Set()}); |
| doc | const | 35 | no | const doc=body.ownerDocument,baseStyle=doc?.defaultView?.getComputedStyle?.(doc.documentElement); |
| base | const | 36 | no | const base={background:baseStyle?.getPropertyValue(&#39;--bg&#39;),secondary:baseStyle?.getPropertyValue(&#39;--s2&#39;),accent:baseStyle?.getPropertyValue(&#39;--ac&#39;)}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../generative-ui/host-revision-guard.mjs | import | 3 | [apps/mobile-relay/generative-ui/host-revision-guard.mjs](../generative-ui/host-revision-guard.mjs.md) |
| ../generative-ui/catalog.mjs | import | 4 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../visual-theme.mjs | import | 5 | [apps/mobile-relay/visual-theme.mjs](../visual-theme.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](../app.js.md) | ./ux/shell-presentation.mjs |
| [apps/mobile-relay/test/shell-presentation.test.mjs](../test/shell-presentation.test.mjs.md) | ../ux/shell-presentation.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
