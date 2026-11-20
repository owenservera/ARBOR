# File: apps/mobile-relay/consumer-commands/icon-generator.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/consumer-commands/icon-generator.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7578 B |
| Lines | 117 |
| Hash | 7e5357ad5870 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ICON_GENERATOR_SCHEMA | const | 10 | yes | export const ICON_GENERATOR_SCHEMA = &#39;vivim.icon-generator/1&#39;; |
| ICON_GRID_SIZES | const | 11 | yes | export const ICON_GRID_SIZES = Object.freeze([16,20,24,28,32,40,48,64,72,96]); |
| ICON_STYLES | const | 12 | yes | export const ICON_STYLES = Object.freeze([&#39;line&#39;,&#39;filled&#39;,&#39;duotone&#39;,&#39;glassy&#39;,&#39;brutalist&#39;,&#39;pixel&#39;,&#39;neo-brutal&#39;,&#39;clay&#39;,&#39;neo-skeumorph&#39;,&#39;cyber&#39;,&#39;editorial&#39;,&#39;minimal&#39;,&#39;vivid&#39;]); |
| ICON_VARIANTS | const | 13 | yes | export const ICON_VARIANTS = Object.freeze([&#39;default&#39;,&#39;hover&#39;,&#39;active&#39;,&#39;disabled&#39;,&#39;focus&#39;,&#39;loading&#39;]); |
| ICON_MOTIONS | const | 14 | yes | export const ICON_MOTIONS = Object.freeze([&#39;none&#39;,&#39;pulse&#39;,&#39;spin&#39;,&#39;bounce&#39;,&#39;fade&#39;,&#39;morph&#39;]); |
| HEX | const | 16 | no | const HEX = /^#[0-9a-fA-F]{6}$/; |
| ID | const | 17 | no | const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/; |
| invalid | function | 19 | no | function invalid(reason){ const e = new TypeError(&#39;ICON_REJECTED: &#39;+reason); e.code=&#39;ICON_REJECTED&#39;; throw e; } |
| hex | function | 20 | no | function hex(v){ if(typeof v!==&#39;string&#39;\|\|!HEX.test(v)) invalid(&#39;invalid color &#39;+String(v)); return v.toLowerCase(); } |
| id | function | 21 | no | function id(v){ if(typeof v!==&#39;string&#39;\|\|!ID.test(v)) invalid(&#39;invalid id &#39;+String(v)); return v; } |
| int | function | 22 | no | function int(v,a,b){ if(!Number.isSafeInteger(v)\|\|v&lt;a\|\|v&gt;b) invalid(&#39;integer out of range&#39;); return v; } |
| en | function | 23 | no | function en(v,list){ if(!list.includes(v)) invalid(&#39;unsupported enum &#39;+String(v)); return v; } |
| PRIMITIVES | const | 27 | no | const PRIMITIVES = Object.freeze({ circle: ({cx,cy,r}) =&gt; `&lt;circle cx=&quot;${cx}&quot; cy=&quot;${cy}&quot; r=&quot;${r}&quot; /&gt;`, rect: ({x,y,w,h,rx=0}) =&gt; `&lt;rect x=&quot;${x}&quot; y=&quot;${y}&quot; width=&quot;${w}&quot; height=&quot;${h}&quot; rx=&quot;${rx}&quot; /&gt;`, li… |
| recipeFor | function | 39 | no | function recipeFor(style){ |
| base | const | 40 | no | const base = { fill:&#39;none&#39;, stroke:&#39;currentColor&#39;, &#39;stroke-width&#39;:null, &#39;stroke-linecap&#39;:&#39;round&#39;, &#39;stroke-linejoin&#39;:&#39;round&#39; }; |
| recipes | const | 41 | no | const recipes = { |
| r | const | 56 | no | const r = recipes[style]; |
| generateIcon | function | 61 | yes | export function generateIcon(input){ |
| kind | const | 62 | no | const kind = en(input.kind ?? &#39;line&#39;, ICON_STYLES); |
| grid | const | 63 | no | const grid = int(input.grid ?? 24, 16, 96); |
| stroke | const | 64 | no | const stroke = int(input.stroke ?? 2, 1, 12); |
| radius | const | 65 | no | const radius = int(input.radius ?? 0, 0, 24); |
| palette | const | 66 | no | const palette = input.palette ?? {}; |
| background | const | 67 | no | const background = palette.background === undefined ? &#39;#0b0d10&#39; : hex(palette.background); |
| accent | const | 68 | no | const accent = palette.accent === undefined ? &#39;#6ea8ff&#39; : hex(palette.accent); |
| foreground | const | 69 | no | const foreground = palette.foreground === undefined ? &#39;#e7eaf0&#39; : hex(palette.foreground); |
| recipe | const | 71 | no | const recipe = recipeFor(kind); |
| strokeWidth | const | 72 | no | const strokeWidth = input.stroke !== undefined ? String(stroke) : (recipe[&#39;stroke-width&#39;] ?? 2); |
| attrs | const | 75 | no | const attrs = []; |
| pushAttr | function | 76 | no | const pushAttr = (k,v)=&gt;{ if(v!==null&amp;&amp;v!==undefined) attrs.push(k+&#39;=&quot;&#39;+String(v)+&#39;&quot;&#39;); }; |
| cx | const | 88 | no | const cx = grid/2, cy = grid/2, r = grid*0.34; |
| inner | const | 89 | no | const inner = [ |
| svg | const | 95 | no | const svg = [ |
| meta | const | 102 | no | const meta = { schema: ICON_GENERATOR_SCHEMA, kind, grid, stroke, radius, palette: {background,accent,foreground}, style: kind, generatedAt: Date.now() }; |
| generateIconSet | function | 106 | yes | export function generateIconSet(input){ |
| count | const | 107 | no | const count = int(input.count ?? 12, 1, 64); |
| grid | const | 108 | no | const grid = int(input.grid ?? 24, 16, 96); |
| style | const | 109 | no | const style = en(input.style ?? &#39;line&#39;, ICON_STYLES); |
| setId | const | 110 | no | const setId = id(input.name ?? &#39;icon-set-&#39;+Date.now()); |
| icons | const | 111 | no | const icons = []; |
| out | const | 113 | no | const out = generateIcon({ kind: style, grid, stroke: input.stroke, radius: input.radius, palette: input.palette }); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/consumer-commands/icon-handlers.mjs](./icon-handlers.mjs.md) | ./icon-generator.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM iconographic system — core SVG generator (v1).
// Pure, deterministic, reprogrammable: describes icons as data (shapes, grid,
// stroke, radius, palette) and renders SVG. No network, no DOM, no eval.
//
// Generator contract:
//   generateIcon({kind, grid, stroke, radius, palette, style, motion}) -> {svg, digest, meta}
//   kind: 'line'|'filled'|'duotone'|'glassy'|'brutalist'|'pixel'|'neo-brutal'|'clay'|'neo-skeumorph'|'cyber'|'editorial'|'minimal'|'vivid'
//   All output is bounded and validated before returning.

export const ICON_GENERATOR_SCHEMA = 'vivim.icon-generator/1';
export const ICON_GRID_SIZES = Object.freeze([16,20,24,28,32,40,48,64,72,96]);
export const ICON_STYLES = Object.freeze(['line','filled','duotone','glassy','brutalist','pixel','neo-brutal','clay','neo-skeumorph','cyber','editorial','minimal','vivid']);
export const ICON_VARIANTS = Object.freeze(['default','hover','active','disabled','focus','loading']);
export const ICON_MOTIONS = Object.freeze(['none','pulse','spin','bounce','fade','morph']);

const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/;

function invalid(reason){ const e = new TypeError('ICON_REJECTED: '+reason); e.code='ICON_REJECTED'; throw e; }
function hex(v){ if(typeof v!=='string'||!HEX.test(v)) invalid('invalid color '+String(v)); return v.toLowerCase(); }
function id(v){ if(typeof v!=='string'||!ID.test(v)) invalid('invalid id '+String(v)); return v; }
function int(v,a,b){ if(!Number.isSafeInteger(v)||v<a||v>b) invalid('integer out of range'); return v; }
function en(v,list){ if(!list.includes(v)) invalid('unsupported enum '+String(v)); return v; }

// ---------- primitive shape vocabulary (reprogrammable) ----------
// Each primitive is pure data. New primitives can be added without touching the renderer.
const PRIMITIVES = Object.freeze({
  circle: ({cx,cy,r}) => `<circle cx="${cx}" cy="${cy}" r="${r}" />`,
  rect: ({x,y,w,h,rx=0}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" />`,
  line: ({x1,y1,x2,y2}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`,
  path: ({d}) => `<path d="${d}" />`,
  polyline: ({points}) => `<polyline points="${points}" />`,
  ellipse: ({cx,cy,rx,ry}) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" />`,
  polygon: ({points}) => `<polygon points="${points}" />`,
});

// ---------- style recipes (reprogrammable: add a style by adding a recipe) ----------
// A recipe maps a semantic role -> visual attribute overrides for the style.
function recipeFor(style){
  const base = { fill:'none', stroke:'currentColor', 'stroke-width':null, 'stroke-linecap':'round', 'stroke-linejoin':'round' };
  const recipes = {
    line: Object.assign({}, base, { 'stroke-width':2, fill:'none' }),
    filled: Object.assign({}, base, { fill:'currentColor', stroke:'none', 'stroke-width':0 }),
    duotone: Object.assign({}, base, { 'stroke-width':2, fill:'none', 'stroke-linecap':'butt', 'stroke-linejoin':'miter' }),
    glassy: Object.assign({}, base, { 'stroke-width':1.5, fill:'none', 'stroke-opacity':0.9 }),
    brutalist: Object.assign({}, base, { 'stroke-width':4, fill:'none', 'stroke-linecap':'square', 'stroke-linejoin':'bevel' }),
    pixel: Object.assign({}, base, { 'stroke-width':3, fill:'none', 'stroke-linecap':'butt', 'stroke-linejoin':'miter', 'shape-rendering':'crispEdges' }),
    'neo-brutal': Object.assign({}, base, { 'stroke-width':3, fill:'none', 'stroke-linecap':'square', 'stroke-linejoin':'round', filter:'drop-shadow(1px 1px 0px #000)' }),
    clay: Object.assign({}, base, { 'stroke-width':0, fill:'currentColor', 'stroke-linecap':'round', 'stroke-linejoin':'round', filter:'drop-shadow(2px 2px 0px rgba(0,0,0,0.25))' }),
    'neo-skeumorph': Object.assign({}, base, { 'stroke-width':1.5, fill:'none', 'stroke-linecap':'round', 'stroke-linejoin':'round' }),
    cyber: Object.assign({}, base, { 'stroke-width':2, fill:'none', 'stroke-linecap':'butt', 'stroke-linejoin':'miter', filter:'drop-shadow(0 0 4px currentColor)' }),
    editorial: Object.assign({}, base, { 'stroke-width':1, fill:'none', 'stroke-linecap':'round', 'stroke-linejoin':'round' }),
    minimal: Object.assign({}, base, { 'stroke-width':1.5, fill:'none', 'stroke-linecap':'round', 'stroke-linejoin':'round' }),
    vivid: Object.assign({}, base, { 'stroke-width':3, fill:'currentColor', 'stroke-linecap':'round', 'stroke-linejoin':'round' }),
  };
  const r = recipes[style];
  if(!r) invalid('unknown style '+String(style));
  return Object.freeze(r);
}

export function generateIcon(input){
  const kind = en(input.kind ?? 'line', ICON_STYLES);
  const grid = int(input.grid ?? 24, 16, 96);
  const stroke = int(input.stroke ?? 2, 1, 12);
  const radius = int(input.radius ?? 0, 0, 24);
  const palette = input.palette ?? {};
  const background = palette.background === undefined ? '#0b0d10' : hex(palette.background);
  const accent = palette.accent === undefined ? '#6ea8ff' : hex(palette.accent);
  const foreground = palette.foreground === undefined ? '#e7eaf0' : hex(palette.foreground);

  const recipe = recipeFor(kind);
  const strokeWidth = input.stroke !== undefined ? String(stroke) : (recipe['stroke-width'] ?? 2);

  // Build SVG attribute list from recipe + overrides.
  const attrs = [];
  const pushAttr = (k,v)=>{ if(v!==null&&v!==undefined) attrs.push(k+'="'+String(v)+'"'); };
  pushAttr('fill', recipe.fill);
  pushAttr('stroke', recipe.stroke);
  pushAttr('stroke-width', strokeWidth);
  pushAttr('stroke-linecap', recipe['stroke-linecap']);
```

_First 80 of 118 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
