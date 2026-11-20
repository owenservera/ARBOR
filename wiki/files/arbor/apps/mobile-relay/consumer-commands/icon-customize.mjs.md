# File: apps/mobile-relay/consumer-commands/icon-customize.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/consumer-commands/icon-customize.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7286 B |
| Lines | 127 |
| Hash | cb31b4db32fd |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ICON_CUSTOMIZE_SCHEMA | const | 7 | yes | export const ICON_CUSTOMIZE_SCHEMA = &#39;vivim.icon-customize/1&#39;; |
| ICON_VARIANTS | const | 8 | yes | export const ICON_VARIANTS = Object.freeze([&#39;default&#39;,&#39;hover&#39;,&#39;active&#39;,&#39;disabled&#39;,&#39;focus&#39;,&#39;loading&#39;]); |
| ICON_MOTIONS | const | 9 | yes | export const ICON_MOTIONS = Object.freeze([&#39;none&#39;,&#39;pulse&#39;,&#39;spin&#39;,&#39;bounce&#39;,&#39;fade&#39;,&#39;morph&#39;]); |
| EXPORT_FORMATS | const | 10 | yes | export const EXPORT_FORMATS = Object.freeze([&#39;svg&#39;,&#39;png&#39;,&#39;react&#39;,&#39;vue&#39;,&#39;jsx&#39;,&#39;tsx&#39;,&#39;css-token&#39;,&#39;json&#39;,&#39;font&#39;]); |
| HEX | const | 12 | no | const HEX = /^#[0-9a-fA-F]{6}$/; |
| ID | const | 13 | no | const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/; |
| invalid | function | 14 | no | function invalid(reason){ const e = new TypeError(&#39;ICON_CUSTOMIZE_REJECTED: &#39;+reason); e.code=&#39;ICON_CUSTOMIZE_REJECTED&#39;; throw e; } |
| hex | function | 15 | no | function hex(v){ if(typeof v!==&#39;string&#39;\|\|!HEX.test(v)) invalid(&#39;invalid color &#39;+String(v)); return v.toLowerCase(); } |
| id | function | 16 | no | function id(v){ if(typeof v!==&#39;string&#39;\|\|!ID.test(v)) invalid(&#39;invalid id &#39;+String(v)); return v; } |
| en | function | 17 | no | function en(v,list){ if(!list.includes(v)) invalid(&#39;unsupported enum &#39;+String(v)); return v; } |
| num | function | 18 | no | function num(v,a,b){ if(typeof v!==&#39;number&#39;\|\|!Number.isFinite(v)\|\|v&lt;a\|\|v&gt;b) invalid(&#39;number out of range&#39;); return v; } |
| VARIANT_DELTA | const | 21 | no | const VARIANT_DELTA = Object.freeze({ default: { opacity:1, strokeOpacity:1, filter:null, scale:1 }, hover: { opacity:1, strokeOpacity:1, filter:&#39;brightness(1.15)&#39;, scale:1.05 }, active: { opacity:1,… |
| MOTION_CSS | const | 31 | no | const MOTION_CSS = Object.freeze({ none: &#39;&#39;, pulse: &#39;@keyframes vivim-icon-pulse{0%,100%{opacity:1}50%{opacity:0.55}} .vivim-icon-motion{animation:vivim-icon-pulse 2s ease-in-out infinite}&#39;, spin: &#39;@… |
| applyVariant | function | 40 | no | function applyVariant(svg, variant, accent){ |
| d | const | 41 | no | const d = VARIANT_DELTA[variant]; |
| out | variable | 42 | no | let out = svg; |
| styleBits | const | 44 | no | const styleBits = []; |
| motionCss | function | 57 | no | function motionCss(motion){ |
| customizeIcon | function | 62 | yes | export function customizeIcon(input){ |
| iconId | const | 63 | no | const iconId = id(input.iconId); |
| setId | const | 64 | no | const setId = input.setId ? id(input.setId) : null; |
| variant | const | 65 | no | const variant = en(input.variant ?? &#39;default&#39;, ICON_VARIANTS); |
| motion | const | 66 | no | const motion = en(input.motion ?? &#39;none&#39;, ICON_MOTIONS); |
| stroke | const | 67 | no | const stroke = input.stroke === undefined ? undefined : num(input.stroke,1,12); |
| radius | const | 68 | no | const radius = input.radius === undefined ? undefined : num(input.radius,0,24); |
| color | const | 69 | no | const color = input.color === undefined ? undefined : hex(input.color); |
| paletteRef | const | 70 | no | const paletteRef = input.paletteRef ? id(input.paletteRef) : null; |
| sourceSvg | const | 73 | no | const sourceSvg = input.sourceSvg; |
| out | variable | 76 | no | let out = applyVariant(sourceSvg, variant, color); |
| motionCssText | const | 77 | no | const motionCssText = motionCss(motion); |
| meta | const | 86 | no | const meta = { schema: ICON_CUSTOMIZE_SCHEMA, iconId, setId, variant, motion, stroke, radius, color, paletteRef, generatedAt: Date.now() }; |
| exportIcon | function | 90 | yes | export function exportIcon(input){ |
| svg | const | 91 | no | const svg = input.svg; |
| format | const | 93 | no | const format = en(input.format, EXPORT_FORMATS); |
| name | const | 94 | no | const name = input.name ? id(input.name) : &#39;Icon&#39;; |
| componentName | const | 95 | no | const componentName = name.replace(/[^a-zA-Z0-9]/g,&#39;&#39;).replace(/^(.)/, (m)=&gt;m.toUpperCase()) \|\| &#39;Icon&#39;; |
| props | const | 103 | no | const props = format===&#39;tsx&#39; ? &#39;React.SVGProps&lt;SVGSVGElement&gt;&#39; : &#39;props&#39;; |
| code | const | 104 | no | const code = `import * as React from &#39;react&#39;;\\nexport default function ${componentName}(${props}) {\\n return (\\n ${svg.replace(/&lt;/g,&#39; &lt;&#39;)}\\n );\\n}\\n`; |
| code | const | 108 | no | const code = `&lt;template&gt;\\n ${svg.replace(/&lt;/g,&#39; &lt;&#39;)}\\n&lt;/template&gt;\\n&lt;script setup&gt;\\nconst props = defineProps({});\\n&lt;/script&gt;\\n`; |
| dataUri | const | 113 | no | const dataUri = &#39;data:image/svg+xml;utf8,&#39;+encodeURIComponent(svg); |
| code | const | 114 | no | const code = `:root {\\n --vivim-icon-${name.toLowerCase()}: url(&quot;${dataUri}&quot;);\\n --vivim-icon-${name.toLowerCase()}-svg: &quot;${encodeURIComponent(svg)}&quot;;\\n}\\n`; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/consumer-commands/icon-handlers.mjs](./icon-handlers.mjs.md) | ./icon-customize.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM iconographic system — customization engine (v1).
// Pure, reprogrammable: takes a generated icon and produces variants
// (default/hover/active/disabled/focus/loading), motion overlays, and
// export in consumer formats (svg, react, vue, jsx, tsx, css-token, json).
// No network, no DOM, no eval.

export const ICON_CUSTOMIZE_SCHEMA = 'vivim.icon-customize/1';
export const ICON_VARIANTS = Object.freeze(['default','hover','active','disabled','focus','loading']);
export const ICON_MOTIONS = Object.freeze(['none','pulse','spin','bounce','fade','morph']);
export const EXPORT_FORMATS = Object.freeze(['svg','png','react','vue','jsx','tsx','css-token','json','font']);

const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/;
function invalid(reason){ const e = new TypeError('ICON_CUSTOMIZE_REJECTED: '+reason); e.code='ICON_CUSTOMIZE_REJECTED'; throw e; }
function hex(v){ if(typeof v!=='string'||!HEX.test(v)) invalid('invalid color '+String(v)); return v.toLowerCase(); }
function id(v){ if(typeof v!=='string'||!ID.test(v)) invalid('invalid id '+String(v)); return v; }
function en(v,list){ if(!list.includes(v)) invalid('unsupported enum '+String(v)); return v; }
function num(v,a,b){ if(typeof v!=='number'||!Number.isFinite(v)||v<a||v>b) invalid('number out of range'); return v; }

// Variant style deltas: reprogrammable — add a variant by adding a delta.
const VARIANT_DELTA = Object.freeze({
  default:   { opacity:1, strokeOpacity:1, filter:null, scale:1 },
  hover:     { opacity:1, strokeOpacity:1, filter:'brightness(1.15)', scale:1.05 },
  active:    { opacity:1, strokeOpacity:1, filter:'brightness(0.85)', scale:0.95 },
  disabled:  { opacity:0.45, strokeOpacity:0.45, filter:null, scale:1 },
  focus:     { opacity:1, strokeOpacity:1, filter:'drop-shadow(0 0 6px currentColor)', scale:1 },
  loading:   { opacity:1, strokeOpacity:1, filter:null, scale:1, rotate:'360deg' },
});

// Motion CSS animations (reprogrammable — add a motion by adding a keyframe).
const MOTION_CSS = Object.freeze({
  none: '',
  pulse: '@keyframes vivim-icon-pulse{0%,100%{opacity:1}50%{opacity:0.55}} .vivim-icon-motion{animation:vivim-icon-pulse 2s ease-in-out infinite}',
  spin: '@keyframes vivim-icon-spin{to{transform:rotate(360deg)}} .vivim-icon-motion{animation:vivim-icon-spin 1s linear infinite}',
  bounce: '@keyframes vivim-icon-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}} .vivim-icon-motion{animation:vivim-icon-bounce 1s ease-in-out infinite}',
  fade: '@keyframes vivim-icon-fade{0%,100%{opacity:1}50%{opacity:0.35}} .vivim-icon-motion{animation:vivim-icon-fade 1.5s ease-in-out infinite}',
  morph: '@keyframes vivim-icon-morph{0%,100%{border-radius:0}50%{border-radius:50%}} .vivim-icon-motion{animation:vivim-icon-morph 3s ease-in-out infinite}',
});

function applyVariant(svg, variant, accent){
  const d = VARIANT_DELTA[variant];
  let out = svg;
  // inject opacity/filter into the root svg via style attribute
  const styleBits = [];
  if(d.opacity!==1) styleBits.push('opacity:'+d.opacity);
  if(d.scale!==1) styleBits.push('transform:scale('+d.scale+')');
  if(d.filter) styleBits.push('filter:'+d.filter);
  // wrap root svg attributes
  out = out.replace(/<svg /, '<svg style="'+styleBits.join(';')+'" ');
  // accent override: recolor stroke/fill references to currentColor
  if(accent){
    out = out.replace(/stroke="[^"]*"/g, 'stroke="'+accent+'"').replace(/fill="[^"]*"/g, 'fill="'+accent+'"');
  }
  return out;
}

function motionCss(motion){
  en(motion, ICON_MOTIONS);
  return MOTION_CSS[motion];
}

export function customizeIcon(input){
  const iconId = id(input.iconId);
  const setId = input.setId ? id(input.setId) : null;
  const variant = en(input.variant ?? 'default', ICON_VARIANTS);
  const motion = en(input.motion ?? 'none', ICON_MOTIONS);
  const stroke = input.stroke === undefined ? undefined : num(input.stroke,1,12);
  const radius = input.radius === undefined ? undefined : num(input.radius,0,24);
  const color = input.color === undefined ? undefined : hex(input.color);
  const paletteRef = input.paletteRef ? id(input.paletteRef) : null;

  // input svg (the source icon) or a reference; here we accept inline svg
  const sourceSvg = input.sourceSvg;
  if(typeof sourceSvg !== 'string' || !sourceSvg.includes('<svg')) invalid('sourceSvg required');

  let out = applyVariant(sourceSvg, variant, color);
  const motionCssText = motionCss(motion);
  if(motionCssText){
    // append a <style> block inside svg for motion
    out = out.replace('</svg>', '<style>'+motionCssText+'</style></svg>');
```

_First 80 of 128 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
