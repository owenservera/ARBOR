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
    // mark the graphic group for motion
    if(out.includes('<g ')) out = out.replace('<g ', '<g class="vivim-icon-motion" ');
    else out = out.replace('<svg ', '<svg class="vivim-icon-motion" ');
  }

  const meta = { schema: ICON_CUSTOMIZE_SCHEMA, iconId, setId, variant, motion, stroke, radius, color, paletteRef, generatedAt: Date.now() };
  return { svg: out, meta };
}

export function exportIcon(input){
  const svg = input.svg;
  if(typeof svg !== 'string' || !svg.includes('<svg')) invalid('svg required');
  const format = en(input.format, EXPORT_FORMATS);
  const name = input.name ? id(input.name) : 'Icon';
  const componentName = name.replace(/[^a-zA-Z0-9]/g,'').replace(/^(.)/, (m)=>m.toUpperCase()) || 'Icon';

  switch(format){
    case 'svg': return { format, code: svg, mime:'image/svg+xml' };
    case 'json': return { format, code: JSON.stringify({svg, name, componentName}), mime:'application/json' };
    case 'react':
    case 'jsx':
    case 'tsx': {
      const props = format==='tsx' ? 'React.SVGProps<SVGSVGElement>' : 'props';
      const code = `import * as React from 'react';\nexport default function ${componentName}(${props}) {\n  return (\n    ${svg.replace(/</g,' <')}\n  );\n}\n`;
      return { format, code, mime: format==='tsx'?'text/typescript':'text/jsx' };
    }
    case 'vue': {
      const code = `<template>\n  ${svg.replace(/</g,' <')}\n</template>\n<script setup>\nconst props = defineProps({});\n</script>\n`;
      return { format, code, mime:'text/vue' };
    }
    case 'css-token': {
      // Extract colors as CSS custom properties; the SVG becomes a data-uri token.
      const dataUri = 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
      const code = `:root {\n  --vivim-icon-${name.toLowerCase()}: url("${dataUri}");\n  --vivim-icon-${name.toLowerCase()}-svg: "${encodeURIComponent(svg)}";\n}\n`;
      return { format, code, mime:'text/css' };
    }
    case 'png': {
      // PNG is not natively encodable without a library; return a deterministic
      // placeholder manifest instructing the consumer to rasterize the SVG.
      return { format, code: JSON.stringify({ kind:'png-placeholder', sourceSvg: svg, note:'rasterize the svg at target resolution', width:24,height:24 }), mime:'application/json' };
    }
    case 'font': {
      return { format, code: JSON.stringify({ kind:'font-placeholder', glyphs:[{name, svg}], note:'bundle into an icon font with your tooling' }), mime:'application/json' };
    }
    default: invalid('unknown format '+String(format));
  }
}
