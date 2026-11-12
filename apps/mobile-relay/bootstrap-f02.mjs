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
    preferences:result.preferences.map(x=>({...x})),
    dislikes:result.dislikes.map(x=>({...x})),
    unknowns:[...result.unknowns],provisional:result.provisional
  };
}

// No approval claim comes from the provider. Local owner/grant validation happens *after* this preview.
export function compileF02RenderPlan(response,{worldId,requestId,revision=0,reducedMotion=false}={}) {
  if(!short(worldId,96)||!ID.test(worldId)||!short(requestId,96)||!ID.test(requestId))fail('trusted provenance required');
  if(!Number.isSafeInteger(revision)||revision<0)fail('revision');
  const output=parseF02Response(response),v=output.visual;
  const theme=validateVisualTheme({
    schema:VISUAL_THEME_SCHEMA,worldId,revision,
    palette:{background:v.background,secondary:v.secondary,accent:v.accent},
    appearance:v.appearance,mood:v.mood,texture:v.texture,motion:v.motion,density:v.density,
    source:{kind:'provider-inference',ref:requestId},status:'suggested'
  },{worldId});
  const compiled=compileVisualTheme(theme,{reducedMotion});
  const ink=readableForeground(v.background);
  let surface=mix(v.background,v.secondary,.18);
  if(contrast(ink,surface)<4.5) surface=v.background;
  let raised=mix(v.background,v.secondary,.34);
  if(contrast(ink,raised)<4.5) raised=surface;
  const textMuted=mix(ink,v.background,.20);
  const vars={
    '--bg':v.background,
    '--s1':surface,
    '--s2':raised,
    '--bd':mix(surface,ink,.16),
    '--tx':ink,
    '--mu':textMuted,
    '--ac':v.accent,
    '--ac2':mix(v.background,v.accent,.2),
    '--vivim-background-image':compiled.backgroundImage,
    '--vivim-font-family':F02_FONT_STACKS[v.fontFamily],
    '--vivim-base-font-size':v.fontSizePx+'px',
    '--vivim-heading-font-size':v.headingSizePx+'px',
    '--vivim-corner-radius':v.radiusPx+'px',
    '--vivim-spacing-scale':String(v.spacingScale),
    '--vivim-accent-ink':readableForeground(v.accent),
    '--vivim-appearance':v.appearance
  };
  return {schema:RENDER_PLAN_SCHEMA,pass:'F02',worldId,requestId,revision,provisional:output.provisional,
    status:'suggested',theme,typography:{
      fontFamily:v.fontFamily,fontSizePx:v.fontSizePx,headingSizePx:v.headingSizePx,
      radiusPx:v.radiusPx,spacingScale:v.spacingScale
    },cssVariables:vars,motion:compiled.motion,
    assertions:{preferences:output.preferences,dislikes:output.dislikes,unknowns:output.unknowns}};
}
