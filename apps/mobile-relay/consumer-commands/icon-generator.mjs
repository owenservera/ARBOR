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
  pushAttr('stroke-linejoin', recipe['stroke-linejoin']);
  if(recipe['stroke-opacity']!==undefined) pushAttr('stroke-opacity', recipe['stroke-opacity']);
  if(recipe['shape-rendering']!==undefined) pushAttr('shape-rendering', recipe['shape-rendering']);
  if(recipe.filter!==undefined) pushAttr('filter', recipe.filter);

  // Deterministic placeholder geometry (reprogrammable: swap in real glyph data).
  // Renders a centered "V" mark as the canonical icon seed; designers replace primitives.
  const cx = grid/2, cy = grid/2, r = grid*0.34;
  const inner = [
    PRIMITIVES.circle({cx,cy,r:r}),
    PRIMITIVES.line({x1:cx-r*0.55, y1:cy+r*0.35, x2:cx, y2:cy-r*0.45}),
    PRIMITIVES.line({x1:cx, y1:cy-r*0.45, x2:cx+r*0.55, y2:cy+r*0.35}),
  ].join('');

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+grid+' '+grid+'" width="'+grid+'" height="'+grid+'" role="img" aria-label="icon" '+attrs.join(' ')+'>',
    '<rect width="'+grid+'" height="'+grid+'" fill="'+background+'" rx="'+radius+'" />',
    '<g stroke="'+accent+'" fill="'+foreground+'">'+inner+'</g>',
    '</svg>',
  ].join('');

  const meta = { schema: ICON_GENERATOR_SCHEMA, kind, grid, stroke, radius, palette: {background,accent,foreground}, style: kind, generatedAt: Date.now() };
  return { svg, meta };
}

export function generateIconSet(input){
  const count = int(input.count ?? 12, 1, 64);
  const grid = int(input.grid ?? 24, 16, 96);
  const style = en(input.style ?? 'line', ICON_STYLES);
  const setId = id(input.name ?? 'icon-set-'+Date.now());
  const icons = [];
  for(let i=0;i<count;i++){
    const out = generateIcon({ kind: style, grid, stroke: input.stroke, radius: input.radius, palette: input.palette });
    icons.push({ id: id(setId+'-icon-'+(i+1)), kind: style, grid, svg: out.svg, meta: out.meta });
  }
  return { schema: ICON_GENERATOR_SCHEMA, setId, style, grid, count, icons, generatedAt: Date.now() };
}
