# File: apps/mobile-relay/visual-bootstrap.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/visual-bootstrap.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9455 B |
| Lines | 185 |
| Hash | 35d7fb9ee091 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| $ | function | 8 | no | const $=id=&gt;document.getElementById(id); |
| root | const | 9 | no | const root=document.documentElement; |
| presetWorld | const | 10 | no | const presetWorld=&#39;local-preview&#39;; |
| presetNames | const | 11 | no | const presetNames={lab:&#39;Lab&#39;,tide:&#39;Tide&#39;,dusk:&#39;Dusk&#39;,ember:&#39;Ember&#39;,grove:&#39;Grove&#39;,ink:&#39;Ink&#39;,dawn:&#39;Dawn&#39;}; |
| vars | const | 12 | no | const vars=[&#39;--bg&#39;,&#39;--s1&#39;,&#39;--s2&#39;,&#39;--bd&#39;,&#39;--tx&#39;,&#39;--mu&#39;,&#39;--ac&#39;,&#39;--ac2&#39;, |
| stage | variable | 16 | no | let stage=&#39;provisional&#39;; |
| selectedPreset | variable | 17 | no | let selectedPreset=&#39;lab&#39;, paired=false, previewing=false, actionBusy=false, activeWorld=null; |
| blend | function | 18 | no | function blend(a,b,f) { |
| bytes | const | 19 | no | const bytes=[1,3,5].map(n=&gt;{ const x=parseInt(a.slice(n,n+2),16),y=parseInt(b.slice(n,n+2),16); return Math.round(x*(1-f)+y*f).toString(16).padStart(2,&#39;0&#39;); }); |
| x | const | 20 | no | const x=parseInt(a.slice(n,n+2),16),y=parseInt(b.slice(n,n+2),16); |
| applyProperties | function | 25 | no | function applyProperties(properties) { |
| basicPreset | function | 31 | no | function basicPreset(name) { |
| t | const | 32 | no | const t=makeProvisionalTheme(presetWorld,name); |
| paint | const | 33 | no | const paint=compileVisualTheme(t,{reducedMotion:matchMedia(&#39;(prefers-reduced-motion: reduce)&#39;).matches}); |
| bg | const | 34 | no | const bg=t.palette.background,s=t.palette.secondary,ac=t.palette.accent; |
| ink | const | 35 | no | const ink=readableForeground(bg); |
| showPreset | function | 46 | no | function showPreset(name) { |
| showPlan | function | 55 | no | function showPlan(plan) { |
| fillChoices | function | 63 | no | function fillChoices(){ |
| choices | const | 64 | no | const choices=$(&#39;theme-choices&#39;); |
| b | const | 66 | no | const b=document.createElement(&#39;button&#39;);b.type=&#39;button&#39;;b.dataset.preset=name; |
| swatch | const | 70 | no | const swatch=document.createElement(&#39;span&#39;);swatch.className=&#39;theme-swatch&#39;; |
| title | const | 72 | no | const title=document.createElement(&#39;span&#39;);title.textContent=presetNames[name]; |
| close | function | 78 | no | function close(){ $(&#39;theme-panel&#39;).hidden=true;$(&#39;theme-toggle&#39;).setAttribute(&#39;aria-expanded&#39;,&#39;false&#39;); } |
| panel | const | 83 | no | const panel=$(&#39;theme-panel&#39;);panel.hidden=!panel.hidden; |
| cached | const | 103 | no | const cached=readCachedProjection(localStorage); |
| status | const | 106 | no | const status=await relay(&#39;status&#39;); |
| relay | function | 114 | no | async function relay(path, options={}) { |
| pause | function | 117 | no | const pause=ms=&gt;new Promise(resolve=&gt;setTimeout(resolve,ms)); |
| sendAction | function | 118 | no | async function sendAction(action,preset=null) { |
| cmd | const | 119 | no | const cmd={text:action,kind:&#39;command&#39;,consumer:&#39;bootstrap&#39;,mode:&#39;bootstrap&#39;,action}; |
| created | const | 121 | no | const created=await relay(&#39;commands&#39;,{method:&#39;POST&#39;,body:JSON.stringify(cmd)}); |
| state | const | 125 | no | const state=await relay(&#39;commands/&#39;+created.id); |
| applyHostProjection | function | 131 | no | function applyHostProjection(projection) { |
| values | const | 132 | no | const values=cssEntries(projection); |
| cache | const | 147 | no | const cache=readCachedProjection(localStorage); |
| projection | const | 155 | no | const projection=readProjection(e.detail); |
| act | function | 161 | no | async function act(action,preset=null) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./visual-theme.mjs | import | 3 | [apps/mobile-relay/visual-theme.mjs](./visual-theme.mjs.md) |
| ./bootstrap-f02.mjs | import | 4 | [apps/mobile-relay/bootstrap-f02.mjs](./bootstrap-f02.mjs.md) |
| ./bootstrap-phone.mjs | import | 5 | [apps/mobile-relay/bootstrap-phone.mjs](./bootstrap-phone.mjs.md) |
| ./transport.mjs | import | 6 | [apps/mobile-relay/transport.mjs](./transport.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Immediate local visual preview. No provider send, database write or durable World claim.
// The Host will later feed this same renderer a validated F02 revision from local authority.
import { THEME_PRESETS, makeProvisionalTheme, compileVisualTheme, readableForeground } from './visual-theme.mjs';
import { compileF02RenderPlan } from './bootstrap-f02.mjs';
import { readProjection, cacheProjection, readCachedProjection, cssEntries } from './bootstrap-phone.mjs';
import { transport } from './transport.mjs';

const $=id=>document.getElementById(id);
const root=document.documentElement;
const presetWorld='local-preview';
const presetNames={lab:'Lab',tide:'Tide',dusk:'Dusk',ember:'Ember',grove:'Grove',ink:'Ink',dawn:'Dawn'};
const vars=['--bg','--s1','--s2','--bd','--tx','--mu','--ac','--ac2',
 '--vivim-background-image','--vivim-font-family','--vivim-base-font-size',
 '--vivim-heading-font-size','--vivim-corner-radius','--vivim-spacing-scale',
 '--vivim-accent-ink','--vivim-appearance'];
let stage='provisional';
let selectedPreset='lab', paired=false, previewing=false, actionBusy=false, activeWorld=null;
function blend(a,b,f) {
 const bytes=[1,3,5].map(n=>{
  const x=parseInt(a.slice(n,n+2),16),y=parseInt(b.slice(n,n+2),16);
  return Math.round(x*(1-f)+y*f).toString(16).padStart(2,'0');
 });
 return '#'+bytes.join('');
}
function applyProperties(properties) {
 for(const name of vars){
  if(Object.hasOwn(properties,name)) root.style.setProperty(name,properties[name]);
 }
 root.dataset.vivimAppearance=properties['--vivim-appearance']==='light'?'light':'dark';
}
function basicPreset(name) {
 const t=makeProvisionalTheme(presetWorld,name);
 const paint=compileVisualTheme(t,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
 const bg=t.palette.background,s=t.palette.secondary,ac=t.palette.accent;
 const ink=readableForeground(bg);
 return {'--bg':bg,'--s1':blend(bg,s,.28),'--s2':blend(bg,s,.53),
  '--bd':blend(bg,ink,.16),'--tx':ink,'--mu':blend(bg,ink,.58),
  '--ac':ac,'--ac2':blend(bg,ac,.2),
  '--vivim-background-image':paint.backgroundImage,
  '--vivim-accent-ink':readableForeground(ac),
  '--vivim-font-family':'"Geist", "Segoe UI Variable Text", system-ui, -apple-system, sans-serif',
  '--vivim-base-font-size':'15px','--vivim-heading-font-size':'28px',
  '--vivim-corner-radius':'8px','--vivim-spacing-scale':'1',
  '--vivim-appearance':t.appearance};
}
function showPreset(name) {
 if(!Object.hasOwn(THEME_PRESETS,name))return;
 selectedPreset=name;previewing=true;
 applyProperties(basicPreset(name));stage='provisional';
 $('theme-state').textContent='Local preview · not yet synced to your PC';
 $('theme-status').textContent=presetNames[name]+' background preview';
 $('theme-choices').querySelectorAll('button[data-preset]').forEach(button=>
  button.setAttribute('aria-pressed',String(button.dataset.preset===name)));
}
function showPlan(plan) {
 if(!plan || plan.schema!=='vivim.render-plan/1')throw new TypeError('Validated render plan required');
 applyProperties(plan.cssVariables);
 stage='proposed';
 $('theme-state').textContent='ChatGPT suggestion · local preview only';
 $('theme-status').textContent='Personal theme preview';
 $('theme-choices').querySelectorAll('button[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));
}
function fillChoices(){
 const choices=$('theme-choices');
 for(const [name,palette] of Object.entries(THEME_PRESETS)){
  const b=document.createElement('button');b.type='button';b.dataset.preset=name;
  b.setAttribute('aria-label',presetNames[name]+' background');
  b.setAttribute('aria-pressed','false');
  b.className='theme-choice';
  const swatch=document.createElement('span');swatch.className='theme-swatch';
  swatch.style.background='linear-gradient(130deg,'+palette.background+','+palette.secondary+')';
  const title=document.createElement('span');title.textContent=presetNames[name];
  b.append(swatch,title);
  b.addEventListener('click',()=>showPreset(name));
  choices.append(b);
 }
}
function close(){ $('theme-panel').hidden=true;$('theme-toggle').setAttribute('aria-expanded','false'); }
fillChoices();
showPreset('lab'); // First paint needs no network, ChatGPT memory or Local Host availability.
```

_First 80 of 186 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
