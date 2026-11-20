# File: apps/mobile-relay/bootstrap-f02.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/bootstrap-f02.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7201 B |
| Lines | 129 |
| Hash | 56ba29cd3f08 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| F02_SCHEMA | const | 6 | yes | export const F02_SCHEMA = &#39;vivim.bootstrap-f02/2&#39;; |
| RENDER_PLAN_SCHEMA | const | 7 | yes | export const RENDER_PLAN_SCHEMA = &#39;vivim.render-plan/1&#39;; |
| F02_FONT_STACKS | const | 8 | yes | export const F02_FONT_STACKS = Object.freeze({ system: &#39;system-ui, -apple-system, &quot;Segoe UI&quot;, Arial, sans-serif&#39;, humanist: &#39;&quot;Segoe UI&quot;, &quot;Trebuchet MS&quot;, Arial, sans-serif&#39;, geometric: &#39;&quot;Century Gothi… |
| FIELD_ENUMS | const | 15 | no | const FIELD_ENUMS = Object.freeze({ appearance: [&#39;dark&#39;,&#39;light&#39;], texture: [&#39;aurora&#39;,&#39;gradient&#39;,&#39;linen&#39;,&#39;geometry&#39;,&#39;solid&#39;], mood: [&#39;serene&#39;,&#39;focused&#39;,&#39;warm&#39;,&#39;vibrant&#39;,&#39;cinematic&#39;,&#39;playful&#39;,&#39;minimal&#39;… |
| BIASES | const | 23 | no | const BIASES = new Set([&#39;explicit&#39;,&#39;recurring&#39;,&#39;inferred&#39;]); |
| SCOPES | const | 24 | no | const SCOPES = new Set([&#39;global&#39;,&#39;work&#39;,&#39;personal&#39;,&#39;unknown&#39;]); |
| HEX | const | 25 | no | const HEX = /^#[0-9a-fA-F]{6}$/; |
| ID | const | 26 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| fail | function | 27 | no | function fail(reason) { throw new TypeError(&#39;Invalid F02 visual output: &#39; + reason); } |
| shape | function | 28 | no | function shape(value, fields, name) { |
| short | function | 32 | no | function short(value, limit) { return typeof value===&#39;string&#39; &amp;&amp; value.length&gt;0 &amp;&amp; value.length&lt;=limit &amp;&amp; !/[\\u0000-\\u001f]/.test(value); } |
| hex | function | 33 | no | function hex(value) { return typeof value===&#39;string&#39; &amp;&amp; HEX.test(value); } |
| ratio | function | 34 | no | function ratio(value) { return typeof value===&#39;number&#39; &amp;&amp; Number.isFinite(value) &amp;&amp; value&gt;=0 &amp;&amp; value&lt;=1; } |
| mix | function | 35 | no | function mix(a,b,fraction) { |
| bytes | const | 36 | no | const bytes = [1,3,5].map(n=&gt;{ const x=parseInt(a.slice(n,n+2),16),y=parseInt(b.slice(n,n+2),16); return Math.round(x*(1-fraction)+y*fraction).toString(16).padStart(2,&#39;0&#39;); }); |
| x | const | 37 | no | const x=parseInt(a.slice(n,n+2),16),y=parseInt(b.slice(n,n+2),16); |
| luminance | function | 43 | no | function luminance(color) { |
| linear | function | 44 | no | const linear=x=&gt;{const v=x/255;return v&lt;=0.04045?v/12.92:((v+0.055)/1.055)**2.4;}; |
| rgb | const | 45 | no | const rgb=[1,3,5].map(i=&gt;linear(parseInt(color.slice(i,i+2),16))); |
| contrast | function | 48 | no | function contrast(a,b) { |
| x | const | 49 | no | const x=luminance(a),y=luminance(b); |
| parseF02Response | function | 53 | yes | export function parseF02Response(source) { |
| result | variable | 54 | no | let result=source; |
| v | const | 62 | no | const v=result.visual; |
| compileF02RenderPlan | function | 88 | yes | export function compileF02RenderPlan(response,{worldId,requestId,revision=0,reducedMotion=false}={}) { |
| output | const | 91 | no | const output=parseF02Response(response),v=output.visual; |
| theme | const | 92 | no | const theme=validateVisualTheme({ schema:VISUAL_THEME_SCHEMA,worldId,revision, palette:{background:v.background,secondary:v.secondary,accent:v.accent}, appearance:v.appearance,mood:v.mood,texture:v.t… |
| compiled | const | 98 | no | const compiled=compileVisualTheme(theme,{reducedMotion}); |
| ink | const | 99 | no | const ink=readableForeground(v.background); |
| surface | variable | 100 | no | let surface=mix(v.background,v.secondary,.18); |
| raised | variable | 102 | no | let raised=mix(v.background,v.secondary,.34); |
| textMuted | const | 104 | no | const textMuted=mix(ink,v.background,.20); |
| vars | const | 105 | no | const vars={ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./visual-theme.mjs | import | 4 | [apps/mobile-relay/visual-theme.mjs](./visual-theme.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/test/bootstrap-f02.test.mjs](./test/bootstrap-f02.test.mjs.md) | ../bootstrap-f02.mjs |
| [apps/mobile-relay/theme-plan.mjs](./theme-plan.mjs.md) | ./bootstrap-f02.mjs |
| [apps/mobile-relay/visual-bootstrap.mjs](./visual-bootstrap.mjs.md) | ./bootstrap-f02.mjs |
| [apps/vivim-host/bootstrap/service.mjs](../vivim-host/bootstrap/service.mjs.md) | ../../mobile-relay/bootstrap-f02.mjs |
| [apps/vivim-host/bootstrap/service.mjs](../vivim-host/bootstrap/service.mjs.md) | ../../mobile-relay/bootstrap-f02.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Trusted deterministic compiler for ChatGPT F02 visual-signature replies.
// ChatGPT emits data. Only a local authorized runtime may save/activate a revision.
// This module has zero browser, network, filesystem or execution side effects.
import { VISUAL_THEME_SCHEMA, validateVisualTheme, compileVisualTheme, readableForeground } from './visual-theme.mjs';

export const F02_SCHEMA = 'vivim.bootstrap-f02/2';
export const RENDER_PLAN_SCHEMA = 'vivim.render-plan/1';
export const F02_FONT_STACKS = Object.freeze({
  system: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
  humanist: '"Segoe UI", "Trebuchet MS", Arial, sans-serif',
  geometric: '"Century Gothic", "Avenir Next", Arial, sans-serif',
  editorial: 'Georgia, "Times New Roman", serif',
  mono: 'Consolas, "Cascadia Code", "Liberation Mono", monospace'
});
const FIELD_ENUMS = Object.freeze({
  appearance: ['dark','light'],
  texture: ['aurora','gradient','linen','geometry','solid'],
  mood: ['serene','focused','warm','vibrant','cinematic','playful','minimal','understated'],
  fontFamily: Object.keys(F02_FONT_STACKS),
  density: ['compact','comfortable','spacious'],
  motion: ['still','slow']
});
const BIASES = new Set(['explicit','recurring','inferred']);
const SCOPES = new Set(['global','work','personal','unknown']);
const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
function fail(reason) { throw new TypeError('Invalid F02 visual output: ' + reason); }
function shape(value, fields, name) {
  if(!value || typeof value !== 'object' || Array.isArray(value) ||
     Object.keys(value).some(key=>!fields.includes(key))) fail(name + ' fields');
}
function short(value, limit) { return typeof value==='string' && value.length>0 && value.length<=limit && !/[\u0000-\u001f]/.test(value); }
function hex(value) { return typeof value==='string' && HEX.test(value); }
function ratio(value) { return typeof value==='number' && Number.isFinite(value) && value>=0 && value<=1; }
function mix(a,b,fraction) {
  const bytes = [1,3,5].map(n=>{
    const x=parseInt(a.slice(n,n+2),16),y=parseInt(b.slice(n,n+2),16);
    return Math.round(x*(1-fraction)+y*fraction).toString(16).padStart(2,'0');
  });
  return '#'+bytes.join('');
}

function luminance(color) {
  const linear=x=>{const v=x/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;};
  const rgb=[1,3,5].map(i=>linear(parseInt(color.slice(i,i+2),16)));
  return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
}
function contrast(a,b) {
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}

export function parseF02Response(source) {
  let result=source;
  if(typeof source==='string') {
    if(source.length>16000) fail('oversized response');
    try {result=JSON.parse(source);} catch {fail('expected one JSON object, no Markdown fences');}
  }
  shape(result,['schema','pass','visual','preferences','dislikes','unknowns','provisional'],'response');
  if(result.schema!==F02_SCHEMA || result.pass!=='F02') fail('schema or pass');
  shape(result.visual,['background','secondary','accent','appearance','texture','mood','fontFamily','fontSizePx','headingSizePx','radiusPx','spacingScale','density','motion'],'visual');
  const v=result.visual;
  for(const key of ['background','secondary','accent']) if(!hex(v[key])) fail(key+' must be #RRGGBB');
  for(const [field,values] of Object.entries(FIELD_ENUMS)) if(!values.includes(v[field])) fail('unsupported '+field);
  if(!Number.isInteger(v.fontSizePx)||v.fontSizePx<13||v.fontSizePx>19) fail('fontSizePx range 13–19');
  if(!Number.isInteger(v.headingSizePx)||v.headingSizePx<20||v.headingSizePx>38) fail('headingSizePx range 20–38');
  if(!Number.isInteger(v.radiusPx)||v.radiusPx<6||v.radiusPx>24) fail('radiusPx range 6–24');
  if(typeof v.spacingScale!=='number'||!Number.isFinite(v.spacingScale)||v.spacingScale<0.85||v.spacingScale>1.2) fail('spacingScale 0.85–1.2');
  if(typeof result.provisional!=='boolean') fail('provisional');
  for(const key of ['preferences','dislikes']){
    if(!Array.isArray(result[key])||result[key].length>5) fail(key+' must contain up to 5 records');
    for(const item of result[key]){
      shape(item,['trait','basis','confidence','scope'],key+' item');
      if(!short(item.trait,180)||!BIASES.has(item.basis)||!ratio(item.confidence)||!SCOPES.has(item.scope))fail('invalid '+key+' item');
    }
  }
  if(!Array.isArray(result.unknowns)||result.unknowns.length>6||result.unknowns.some(x=>!short(x,120))) fail('unknowns');
  return {
    schema:F02_SCHEMA,pass:'F02',
    visual:{...v,background:v.background.toLowerCase(),secondary:v.secondary.toLowerCase(),accent:v.accent.toLowerCase()},
```

_First 80 of 130 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
