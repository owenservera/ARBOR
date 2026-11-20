# File: apps/mobile-relay/visual-theme.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/visual-theme.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6299 B |
| Lines | 92 |
| Hash | fe1027a22702 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VISUAL_THEME_SCHEMA | const | 3 | yes | export const VISUAL_THEME_SCHEMA = &#39;vivim.visual-theme/1&#39;; |
| THEME_PRESETS | const | 4 | yes | export const THEME_PRESETS = Object.freeze({ lab: Object.freeze({ background:&#39;#111214&#39;, secondary:&#39;#202226&#39;, accent:&#39;#ec7b67&#39; }), tide: Object.freeze({ background:&#39;#10191c&#39;, secondary:&#39;#183b3c&#39;, acce… |
| HEX | const | 13 | no | const HEX = /^#[0-9a-f]{6}$/i; |
| ID | const | 14 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| MOODS | const | 15 | no | const MOODS = new Set([&#39;serene&#39;,&#39;focused&#39;,&#39;warm&#39;,&#39;vibrant&#39;,&#39;cinematic&#39;,&#39;playful&#39;,&#39;minimal&#39;,&#39;understated&#39;]); |
| TEXTURES | const | 16 | no | const TEXTURES = new Set([&#39;aurora&#39;,&#39;gradient&#39;,&#39;linen&#39;,&#39;geometry&#39;,&#39;solid&#39;]); |
| APPEARANCES | const | 17 | no | const APPEARANCES = new Set([&#39;dark&#39;,&#39;light&#39;]); |
| MOTIONS | const | 18 | no | const MOTIONS = new Set([&#39;still&#39;,&#39;slow&#39;]); |
| DENSITIES | const | 19 | no | const DENSITIES = new Set([&#39;comfortable&#39;,&#39;compact&#39;,&#39;spacious&#39;]); |
| SOURCES | const | 20 | no | const SOURCES = new Set([&#39;provisional&#39;,&#39;owner-choice&#39;,&#39;provider-inference&#39;,&#39;bounded-grant&#39;]); |
| STATES | const | 21 | no | const STATES = new Set([&#39;provisional&#39;,&#39;suggested&#39;,&#39;active&#39;]); |
| object | function | 22 | no | function object(value, allowed, name) { |
| hex | function | 26 | no | function hex(v) { return typeof v === &#39;string&#39; &amp;&amp; HEX.test(v); } |
| invalid | function | 27 | no | function invalid(reason) { throw new TypeError(&#39;Invalid visual theme: &#39; + reason); } |
| srgb | function | 28 | no | function srgb(byte) { const x = byte / 255; return x &lt;= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4; } |
| luminance | function | 29 | no | function luminance(color) { |
| rgb | const | 30 | no | const rgb = [1,3,5].map(i =&gt; srgb(Number.parseInt(color.slice(i,i+2),16))); |
| readableForeground | function | 33 | yes | export function readableForeground(background) { |
| l | const | 35 | no | const l = luminance(background); |
| white | const | 36 | no | const white = (1.05)/(l+.05); |
| dark | const | 37 | no | const dark = (l+.05)/.05; |
| validateVisualTheme | function | 40 | yes | export function validateVisualTheme(theme, { worldId } = {}) { |
| makeProvisionalTheme | function | 60 | yes | export function makeProvisionalTheme(worldId, preset=&#39;lab&#39;) { |
| chooseFirstPaintTheme | function | 68 | yes | export function chooseFirstPaintTheme({worldId,cache,preset=&#39;lab&#39;}={}) { |
| validated | const | 71 | no | const validated=validateVisualTheme(cache,{worldId}); |
| compileVisualTheme | function | 77 | yes | export function compileVisualTheme(input,{reducedMotion=false}={}) { |
| t | const | 78 | no | const t=validateVisualTheme(input); |
| foreground | const | 80 | no | const foreground=readableForeground(a); |
| backdrop | const | 81 | no | const backdrop={ |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/bootstrap-f02.mjs](./bootstrap-f02.mjs.md) | ./visual-theme.mjs |
| [apps/mobile-relay/test/visual-theme.test.mjs](./test/visual-theme.test.mjs.md) | ../visual-theme.mjs |
| [apps/mobile-relay/theme-plan.mjs](./theme-plan.mjs.md) | ./visual-theme.mjs |
| [apps/mobile-relay/ux/shell-presentation.mjs](./ux/shell-presentation.mjs.md) | ../visual-theme.mjs |
| [apps/mobile-relay/visual-bootstrap.mjs](./visual-bootstrap.mjs.md) | ./visual-theme.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM visual-theme/1: pure, browser/Node-safe compiler for first-paint personal backgrounds.
// No DOM, storage, network, provider calls, HTML, arbitrary CSS, or browser actions.
export const VISUAL_THEME_SCHEMA = 'vivim.visual-theme/1';
export const THEME_PRESETS = Object.freeze({
  lab: Object.freeze({ background:'#111214', secondary:'#202226', accent:'#ec7b67' }),
  tide: Object.freeze({ background:'#10191c', secondary:'#183b3c', accent:'#7fc6bc' }),
  dusk: Object.freeze({ background:'#161728', secondary:'#363b68', accent:'#b1a7ef' }),
  ember: Object.freeze({ background:'#221a18', secondary:'#55402f', accent:'#e2af80' }),
  grove: Object.freeze({ background:'#101d19', secondary:'#2c5040', accent:'#a2d7ac' }),
  ink: Object.freeze({ background:'#101317', secondary:'#283138', accent:'#c0c8c9' }),
  dawn: Object.freeze({ background:'#f4e9df', secondary:'#dac4b5', accent:'#64517a' })
});
const HEX = /^#[0-9a-f]{6}$/i;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const MOODS = new Set(['serene','focused','warm','vibrant','cinematic','playful','minimal','understated']);
const TEXTURES = new Set(['aurora','gradient','linen','geometry','solid']);
const APPEARANCES = new Set(['dark','light']);
const MOTIONS = new Set(['still','slow']);
const DENSITIES = new Set(['comfortable','compact','spacious']);
const SOURCES = new Set(['provisional','owner-choice','provider-inference','bounded-grant']);
const STATES = new Set(['provisional','suggested','active']);
function object(value, allowed, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some(key => !allowed.includes(key))) throw new TypeError('Invalid ' + name);
}
function hex(v) { return typeof v === 'string' && HEX.test(v); }
function invalid(reason) { throw new TypeError('Invalid visual theme: ' + reason); }
function srgb(byte) { const x = byte / 255; return x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4; }
function luminance(color) {
  const rgb = [1,3,5].map(i => srgb(Number.parseInt(color.slice(i,i+2),16)));
  return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722;
}
export function readableForeground(background) {
  if (!hex(background)) invalid('invalid background');
  const l = luminance(background);
  const white = (1.05)/(l+.05);
  const dark = (l+.05)/.05;
  return white >= dark ? '#ffffff' : '#000000';
}
export function validateVisualTheme(theme, { worldId } = {}) {
  object(theme,['schema','worldId','revision','palette','appearance','mood','texture','motion','density','source','status'],'theme');
  if (theme.schema !== VISUAL_THEME_SCHEMA) invalid('schema');
  if (typeof theme.worldId !== 'string' || !ID.test(theme.worldId) || (worldId && theme.worldId !== worldId)) invalid('world scope');
  if (!Number.isSafeInteger(theme.revision) || theme.revision < 0) invalid('revision');
  object(theme.palette,['background','secondary','accent'],'palette');
  for(const c of ['background','secondary','accent']) if(!hex(theme.palette[c])) invalid('color: '+c);
  if(!APPEARANCES.has(theme.appearance)||!MOODS.has(theme.mood)||!TEXTURES.has(theme.texture)
    ||!MOTIONS.has(theme.motion)||!DENSITIES.has(theme.density)) invalid('unsupported visual token');
  object(theme.source,['kind','ref'],'source');
  if(!SOURCES.has(theme.source.kind)||typeof theme.source.ref!=='string'||!ID.test(theme.source.ref)) invalid('provenance');
  if(!STATES.has(theme.status)) invalid('status');
  if(theme.status==='provisional' && theme.source.kind!=='provisional') invalid('provisional provenance');
  if(theme.status==='active' && !['owner-choice','bounded-grant'].includes(theme.source.kind)) invalid('active theme requires owner choice or a trusted local grant receipt');
  // Contrast is computed at render time from the actual background; no model-provided text color.
  return {schema:VISUAL_THEME_SCHEMA,worldId:theme.worldId,revision:theme.revision,
    palette:Object.fromEntries(Object.entries(theme.palette).map(([k,v])=>[k,v.toLowerCase()])),
    appearance:theme.appearance,mood:theme.mood,texture:theme.texture,motion:theme.motion,
    density:theme.density,source:{kind:theme.source.kind,ref:theme.source.ref},status:theme.status};
}
export function makeProvisionalTheme(worldId, preset='lab') {
  if(!ID.test(worldId)) invalid('world scope');
  if(!Object.hasOwn(THEME_PRESETS,preset)) invalid('preset');
  return validateVisualTheme({schema:VISUAL_THEME_SCHEMA,worldId,revision:0,
    palette:THEME_PRESETS[preset],appearance:preset==='dawn'?'light':'dark',
    mood:preset==='dawn'?'warm':preset==='lab'?'focused':'serene',texture:preset==='lab'?'solid':'aurora',motion:'still',density:'comfortable',
    source:{kind:'provisional',ref:'local.default'},status:'provisional'});
}
export function chooseFirstPaintTheme({worldId,cache,preset='lab'}={}) {
  if(typeof worldId!=='string'||!ID.test(worldId)) invalid('world scope');
  try {
    const validated=validateVisualTheme(cache,{worldId});
    if(validated.status==='active') return validated;
  } catch {}
  return makeProvisionalTheme(worldId,preset);
}
// Emit only hard-coded CSS functions plus validated hex tokens. May be applied to *one scoped backdrop*.
export function compileVisualTheme(input,{reducedMotion=false}={}) {
  const t=validateVisualTheme(input);
  const {background:a,secondary:b,accent:c}=t.palette;
  const foreground=readableForeground(a);
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
