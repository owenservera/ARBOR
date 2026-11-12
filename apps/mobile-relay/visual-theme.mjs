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
  const backdrop={
    solid:`linear-gradient(180deg, ${a}, ${a})`,
    gradient:`linear-gradient(145deg, ${a} 10%, ${b} 93%)`,
    linen:`repeating-linear-gradient(110deg, transparent 0px, transparent 3px, #ffffff08 4px), linear-gradient(160deg, ${a}, ${b})`,
    geometry:`linear-gradient(135deg, transparent 47%, #ffffff08 49%, transparent 51%), linear-gradient(145deg, ${a}, ${b})`,
    aurora:`radial-gradient(ellipse at 18% 16%, ${c}55 0%, transparent 52%), radial-gradient(ellipse at 87% 72%, ${b}aa 0%, transparent 55%), linear-gradient(145deg, ${a}, ${b})`
  }[t.texture];
  return Object.freeze({backgroundImage:backdrop,backgroundColor:a,
    textColor:foreground,accentColor:c,backgroundSecondary:b,
    motion:reducedMotion?'still':t.motion,density:t.density,
    worldId:t.worldId,revision:t.revision,status:t.status});
}
