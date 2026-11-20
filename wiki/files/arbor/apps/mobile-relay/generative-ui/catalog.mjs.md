# File: apps/mobile-relay/generative-ui/catalog.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/generative-ui/catalog.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11545 B |
| Lines | 153 |
| Hash | 6b0bef8ccc39 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CATALOG_VERSION | const | 2 | yes | export const CATALOG_VERSION = 1; |
| LIVE_UI_BINDINGS | const | 4 | yes | export const LIVE_UI_BINDINGS=Object.freeze({&#39;personal.open-tasks&#39;:&#39;collection&#39;,&#39;personal.completed-tasks&#39;:&#39;collection&#39;,&#39;personal.recent-notes&#39;:&#39;collection&#39;,&#39;studio.recent-outcomes&#39;:&#39;timeline&#39;}); |
| SURFACE_SCHEMA | const | 5 | yes | export const SURFACE_SCHEMA = &#39;vivim.ui-surface/1&#39;; |
| PROPOSAL_SCHEMA | const | 6 | yes | export const PROPOSAL_SCHEMA = &#39;vivim.ui-proposal/1&#39;; |
| PREVIEW_SCHEMA | const | 7 | yes | export const PREVIEW_SCHEMA = &#39;vivim.ui-preview/1&#39;; |
| TYPES | const | 8 | yes | export const TYPES = Object.freeze([&#39;stack&#39;,&#39;grid&#39;,&#39;text&#39;,&#39;card&#39;,&#39;button&#39;,&#39;collection&#39;,&#39;profile-card&#39;,&#39;project-card&#39;,&#39;timeline&#39;,&#39;chart&#39;]); |
| MAX | const | 9 | yes | export const MAX = Object.freeze({ bytes: 32768, nodes: 64, depth: 7, operations: 20, children: 24, string: 240, items: 16 }); |
| DEFAULT_THEME | const | 10 | yes | export const DEFAULT_THEME = Object.freeze({ background:&#39;#111722&#39;, secondary:&#39;#243146&#39;, accent:&#39;#78b8f6&#39;, appearance:&#39;dark&#39;, texture:&#39;solid&#39;, mood:&#39;focused&#39;, density:&#39;comfortable&#39;, motion:&#39;still&#39;, fo… |
| ID | const | 15 | yes | export const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/; |
| HEX | const | 16 | no | const HEX = /^#[0-9a-fA-F]{6}$/; |
| UNSAFE_TEXT | const | 17 | no | const UNSAFE_TEXT = /[\\u0000-\\u001f\\u007f]\|(?:https?:\\/\\/\|www\\.\|javascript:\|data:\|&lt;\\/?[a-z]\|onerror\\s*=)/i; |
| BAD_KEY | const | 18 | no | const BAD_KEY = new Set([&#39;__proto__&#39;,&#39;prototype&#39;,&#39;constructor&#39;]); |
| OWN | function | 19 | no | const OWN = (o,k) =&gt; Object.prototype.hasOwnProperty.call(o,k); |
| invalid | function | 20 | yes | export function invalid(reason) { const e = new TypeError(&#39;UI_REJECTED: &#39;+reason); e.code=&#39;UI_REJECTED&#39;; throw e; } |
| plain | function | 21 | yes | export function plain(v) { return v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v) &amp;&amp; (Object.getPrototypeOf(v) === Object.prototype \|\| Object.getPrototypeOf(v) === null); } |
| keys | function | 22 | yes | export function keys(v, allowed, label) { |
| str | function | 25 | yes | export function str(v,max=MAX.string) { if(typeof v!==&#39;string&#39;\|\|!v.trim()\|\|v.length&gt;max\|\|UNSAFE_TEXT.test(v)) invalid(&#39;unsafe or oversized text&#39;); return v.trim(); } |
| id | function | 26 | yes | export function id(v) { if(typeof v!==&#39;string&#39;\|\|!ID.test(v)\|\|BAD_KEY.has(v)) invalid(&#39;invalid identifier&#39;); return v; } |
| en | function | 27 | yes | export function en(v,list) { if(!list.includes(v)) invalid(&#39;unsupported enum&#39;); return v; } |
| int | function | 28 | yes | export function int(v,a,b) { if(!Number.isSafeInteger(v)\|\|v&lt;a\|\|v&gt;b) invalid(&#39;integer outside bounds&#39;); return v; } |
| num | function | 29 | yes | export function num(v,a,b) { if(typeof v!==&#39;number&#39;\|\|!Number.isFinite(v)\|\|v&lt;a\|\|v&gt;b) invalid(&#39;number outside bounds&#39;); return v; } |
| validateShellTheme | function | 30 | yes | export function validateShellTheme(shell){ |
| out | const | 33 | no | const out={}; |
| validateTheme | function | 40 | yes | export function validateTheme(t) { |
| out | const | 42 | no | const out={}; |
| groups | const | 44 | no | const groups={appearance:[&#39;dark&#39;,&#39;light&#39;],texture:[&#39;aurora&#39;,&#39;gradient&#39;,&#39;linen&#39;,&#39;geometry&#39;,&#39;solid&#39;],mood:[&#39;serene&#39;,&#39;focused&#39;,&#39;warm&#39;,&#39;vibrant&#39;,&#39;cinematic&#39;,&#39;playful&#39;,&#39;minimal&#39;,&#39;understated&#39;],density:[&#39;c… |
| FOUNDATION | const | 54 | no | const FOUNDATION=Object.freeze([&#39;stack&#39;,&#39;grid&#39;,&#39;text&#39;,&#39;card&#39;]); |
| CONTAINERS | const | 55 | no | const CONTAINERS=Object.freeze([&#39;stack&#39;,&#39;grid&#39;,&#39;card&#39;]); |
| componentBinding | function | 56 | no | const componentBinding=(domain,field,type,min,max,kinds)=&gt;Object.freeze({ capabilityId:&#39;vivim.ui-engine.&#39;+domain+&#39;@1&#39;,field,type,min,max,kinds:kinds??TYPES}); |
| COMPONENT_PRESENTATION_BINDINGS | const | 58 | yes | export const COMPONENT_PRESENTATION_BINDINGS=Object.freeze({ background:componentBinding(&#39;color.background&#39;,&#39;background&#39;,&#39;color&#39;), &#39;border-color&#39;:componentBinding(&#39;border.color&#39;,&#39;borderColor&#39;,&#39;color&#39;… |
| componentPresentationBindings | function | 67 | yes | export function componentPresentationBindings(type){ |
| validateComponentPresentation | function | 70 | yes | export function validateComponentPresentation(type,value){ |
| allowed | const | 71 | no | const allowed=componentPresentationBindings(type).map(([,b])=&gt;b); |
| out | const | 74 | no | const out={}; |
| v | const | 77 | no | const v=value[b.field]; |
| allowedRef | function | 85 | no | function allowedRef(v, refs) {id(v);if(!refs.has(v))invalid(&#39;unapproved data/evidence reference&#39;);return v;} |
| variants | const | 86 | no | const variants=[&#39;body&#39;,&#39;heading&#39;,&#39;muted&#39;]; |
| validateProps | function | 87 | yes | export function validateProps(type,props,{refs=new Set()}={}) { |
| out | const | 88 | no | const out={};const add=(k,v)=&gt;{if(v!==undefined)out[k]=v;}; |
| validateTree | function | 117 | yes | export function validateTree(tree,{refs=new Set()}={}) { |
| count | variable | 118 | no | let count=0;const seen=new Set(); |
| walk | function | 119 | no | const walk=(n,depth,parentId)=&gt;{ |
| name | const | 122 | no | const name=id(n.id);if(seen.has(name))invalid(&#39;duplicate component id&#39;);seen.add(name); |
| p | const | 125 | no | const p=validateProps(n.type,n.props??{}, {refs}); |
| children | const | 127 | no | const children=n.children??[]; |
| out | const | 135 | no | const out=walk(tree,0,null);if(out.id!==&#39;root&#39;\|\|out.type!==&#39;stack&#39;\|\|out.visibility!==&#39;phone&#39;)invalid(&#39;root must be stable public stack&#39;);return out; |
| validateSurface | function | 137 | yes | export function validateSurface(surface,{refs=new Set()}={}) { |
| result | const | 140 | no | const result={schema:SURFACE_SCHEMA,surfaceId:id(surface.surfaceId),revision:int(surface.revision,0,1e9),catalogVersion:CATALOG_VERSION, |
| createSurface | function | 144 | yes | export function createSurface({surfaceId=&#39;my-space&#39;,theme=DEFAULT_THEME}={}) { |
| projectSurface | function | 148 | yes | export function projectSurface(surface,{audience=&#39;phone&#39;,refs=new Set()}={}) { |
| s | const | 149 | no | const s=validateSurface(surface,{refs});if(![&#39;phone&#39;,&#39;pc&#39;].includes(audience))invalid(&#39;unknown audience&#39;); |
| prune | function | 151 | no | const prune=n=&gt;({...n,children:n.children.filter(c=&gt;c.visibility!==&#39;pc-private&#39;).map(prune)}); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-canvas.mjs](../build-canvas.mjs.md) | ./generative-ui/catalog.mjs |
| [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) | ./generative-ui/catalog.mjs |
| [apps/mobile-relay/generative-ui/bootstrap-adapters.mjs](./bootstrap-adapters.mjs.md) | ./catalog.mjs |
| [apps/mobile-relay/generative-ui/compiler.mjs](./compiler.mjs.md) | ./catalog.mjs |
| [apps/mobile-relay/generative-ui/design-composer.mjs](./design-composer.mjs.md) | ./catalog.mjs |
| [apps/mobile-relay/generative-ui/phone-surface.mjs](./phone-surface.mjs.md) | ./catalog.mjs |
| [apps/mobile-relay/generative-ui/renderer.mjs](./renderer.mjs.md) | ./catalog.mjs |
| [apps/mobile-relay/generative-ui/semantic-projection.mjs](./semantic-projection.mjs.md) | ./catalog.mjs |
| [apps/mobile-relay/test/build-vec-routing.test.mjs](../test/build-vec-routing.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/build-vec-theme.test.mjs](../test/build-vec-theme.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/component-presentation.test.mjs](../test/component-presentation.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/design-composer.test.mjs](../test/design-composer.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/generative-bootstrap.test.mjs](../test/generative-bootstrap.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/generative-browser-compat.test.mjs](../test/generative-browser-compat.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/generative-semantic.test.mjs](../test/generative-semantic.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/generative-ui.test.mjs](../test/generative-ui.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/host-build-consumer.test.mjs](../test/host-build-consumer.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/shell-presentation.test.mjs](../test/shell-presentation.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/tierflow-build.test.mjs](../test/tierflow-build.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/vec-ui-compiler.test.mjs](../test/vec-ui-compiler.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/vec-ui-taxonomy.test.mjs](../test/vec-ui-taxonomy.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/test/workspace-template-wiring.test.mjs](../test/workspace-template-wiring.test.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/ux/launcher-ui.mjs](../ux/launcher-ui.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/ux/shell-presentation.mjs](../ux/shell-presentation.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/mobile-relay/vec/ui-adapter.mjs](../vec/ui-adapter.mjs.md) | ../generative-ui/catalog.mjs |
| [apps/vivim-host/bootstrap/service.mjs](../../vivim-host/bootstrap/service.mjs.md) | ../../mobile-relay/generative-ui/catalog.mjs |
| [apps/vivim-host/receipt-runner.mjs](../../vivim-host/receipt-runner.mjs.md) | ../mobile-relay/generative-ui/catalog.mjs |
| [apps/vivim-host/test/bootstrap-command-apply.test.mjs](../../vivim-host/test/bootstrap-command-apply.test.mjs.md) | ../../mobile-relay/generative-ui/catalog.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../../vivim-host/test/control-dispatcher.test.mjs.md) | ../../mobile-relay/generative-ui/catalog.mjs |
| [apps/vivim-host/test/ui-revision.test.mjs](../../vivim-host/test/ui-revision.test.mjs.md) | ../../mobile-relay/generative-ui/catalog.mjs |
| [hq/test/vlang-compiled-context.test.mjs](../../../hq/test/vlang-compiled-context.test.mjs.md) | ../../apps/mobile-relay/generative-ui/catalog.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// GUI01: closed declarative component vocabulary; provider output is data, never executable UI.
export const CATALOG_VERSION = 1;
// Read-only source selectors, not user-provided URLs, IDs or credentials.
export const LIVE_UI_BINDINGS=Object.freeze({'personal.open-tasks':'collection','personal.completed-tasks':'collection','personal.recent-notes':'collection','studio.recent-outcomes':'timeline'});
export const SURFACE_SCHEMA = 'vivim.ui-surface/1';
export const PROPOSAL_SCHEMA = 'vivim.ui-proposal/1';
export const PREVIEW_SCHEMA = 'vivim.ui-preview/1';
export const TYPES = Object.freeze(['stack','grid','text','card','button','collection','profile-card','project-card','timeline','chart']);
export const MAX = Object.freeze({ bytes: 32768, nodes: 64, depth: 7, operations: 20, children: 24, string: 240, items: 16 });
export const DEFAULT_THEME = Object.freeze({
  background:'#111722', secondary:'#243146', accent:'#78b8f6', appearance:'dark', texture:'solid',
  mood:'focused', density:'comfortable', motion:'still', fontFamily:'system',
  fontSizePx:15, headingSizePx:28, radiusPx:14, spacingScale:1
});
export const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const UNSAFE_TEXT = /[\u0000-\u001f\u007f]|(?:https?:\/\/|www\.|javascript:|data:|<\/?[a-z]|onerror\s*=)/i;
const BAD_KEY = new Set(['__proto__','prototype','constructor']);
const OWN = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
export function invalid(reason) { const e = new TypeError('UI_REJECTED: '+reason); e.code='UI_REJECTED'; throw e; }
export function plain(v) { return v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null); }
export function keys(v, allowed, label) {
  if (!plain(v) || Object.keys(v).some(k=>BAD_KEY.has(k)||!allowed.includes(k))) invalid(label+' has unexpected fields');
}
export function str(v,max=MAX.string) { if(typeof v!=='string'||!v.trim()||v.length>max||UNSAFE_TEXT.test(v)) invalid('unsafe or oversized text'); return v.trim(); }
export function id(v) { if(typeof v!=='string'||!ID.test(v)||BAD_KEY.has(v)) invalid('invalid identifier'); return v; }
export function en(v,list) { if(!list.includes(v)) invalid('unsupported enum'); return v; }
export function int(v,a,b) { if(!Number.isSafeInteger(v)||v<a||v>b) invalid('integer outside bounds'); return v; }
export function num(v,a,b) { if(typeof v!=='number'||!Number.isFinite(v)||v<a||v>b) invalid('number outside bounds'); return v; }
export function validateShellTheme(shell){
  keys(shell,['background','secondary','accent','fontSizePx','radiusPx','spacingScale'],'shell presentation');
  if(!Object.keys(shell).length)invalid('empty shell presentation');
  const out={};
  for(const k of ['background','secondary','accent'])if(OWN(shell,k)){if(typeof shell[k]!=='string'||!HEX.test(shell[k]))invalid('invalid shell color');out[k]=shell[k].toLowerCase();}
  if(OWN(shell,'fontSizePx'))out.fontSizePx=int(shell.fontSizePx,13,19);
  if(OWN(shell,'radiusPx'))out.radiusPx=int(shell.radiusPx,6,24);
  if(OWN(shell,'spacingScale'))out.spacingScale=num(shell.spacingScale,.85,1.2);
  return out;
}
export function validateTheme(t) {
  keys(t,['background','secondary','accent','appearance','texture','mood','density','motion','fontFamily','fontSizePx','headingSizePx','radiusPx','spacingScale','shell'],'theme');
  const out={};
  for(const k of ['background','secondary','accent']) {if(!HEX.test(t[k]??'')) invalid('invalid theme color');out[k]=t[k].toLowerCase();}
  const groups={appearance:['dark','light'],texture:['aurora','gradient','linen','geometry','solid'],mood:['serene','focused','warm','vibrant','cinematic','playful','minimal','understated'],density:['compact','comfortable','spacious'],motion:['still','slow'],fontFamily:['system','humanist','geometric','editorial','mono']};
  for(const [k,choices] of Object.entries(groups))out[k]=en(t[k],choices);
  out.fontSizePx=int(t.fontSizePx,13,19);out.headingSizePx=int(t.headingSizePx,20,38);out.radiusPx=int(t.radiusPx,6,24);
  out.spacingScale=num(t.spacingScale,.85,1.2);
  // Optional only: older persisted surfaces retain their exact shape and digest.
  if(OWN(t,'shell'))out.shell=validateShellTheme(t.shell);
  return out;
}
// Reviewed source-to-renderer bindings. Types and bounds supplement the canonical VEC engine
// compiler: a declarative capability alone never authorizes an arbitrary style or action.
const FOUNDATION=Object.freeze(['stack','grid','text','card']);
const CONTAINERS=Object.freeze(['stack','grid','card']);
const componentBinding=(domain,field,type,min,max,kinds)=>Object.freeze({
  capabilityId:'vivim.ui-engine.'+domain+'@1',field,type,min,max,kinds:kinds??TYPES});
export const COMPONENT_PRESENTATION_BINDINGS=Object.freeze({
  background:componentBinding('color.background','background','color'),
  'border-color':componentBinding('border.color','borderColor','color'),
  'border-width':componentBinding('border.width','borderWidthPx','length',0,4),
  radius:componentBinding('corners.radius','radiusPx','length',0,24),
  'font-size':componentBinding('typography.size','fontSizePx','length',13,32,FOUNDATION),
  padding:componentBinding('spacing.padding','paddingPx','length',0,24,FOUNDATION),
  gap:componentBinding('spacing.gap','gapPx','length',0,24,CONTAINERS)
});
export function componentPresentationBindings(type){
  return Object.entries(COMPONENT_PRESENTATION_BINDINGS).filter(([,binding])=>binding.kinds.includes(type));
}
export function validateComponentPresentation(type,value){
  const allowed=componentPresentationBindings(type).map(([,b])=>b);
  keys(value,allowed.map(b=>b.field),'component presentation');
  if(!Object.keys(value).length)invalid('empty component presentation');
  const out={};
  for(const b of allowed){
    if(!OWN(value,b.field))continue;
    const v=value[b.field];
    if(b.type==='color'){
      if(typeof v!=='string'||!HEX.test(v))invalid('invalid component color');
      out[b.field]=v.toLowerCase();
```

_First 80 of 154 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
