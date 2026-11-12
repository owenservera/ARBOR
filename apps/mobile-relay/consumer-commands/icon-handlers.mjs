// VIVIM iconographic system — command handlers (v1).
// Implements the iconographic.* hooks referenced in registry.mjs.
// Pure where possible; side effects (store/delivery) are injected so the
// harness can swap in its own persistence. Maximal reprogrammability:
// handlers are small, composable, and each returns a bounded result.

import { generateIcon, generateIconSet } from './icon-generator.mjs';
import { customizeIcon, exportIcon } from './icon-customize.mjs';

export const ICON_HANDLER_SCHEMA = 'vivim.icon-handler/1';

const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/;
function invalid(reason){ const e = new TypeError('ICON_HANDLER_REJECTED: '+reason); e.code='ICON_HANDLER_REJECTED'; throw e; }
function id(v){ if(typeof v!=='string'||!ID.test(v)) invalid('invalid id '+String(v)); return v; }

// In-memory store injected by the harness. Shape:
//   { sets: Map<setId, {setId, style, grid, count, icons: Map<iconId,{id,kind,grid,svg,meta}}> },
//   deliveries: Map<deliveryId, {setId, target, surfaceId, mapping, replace}>
// The harness may replace this with a durable store.
export function createIconStore(){
  return {
    sets: new Map(),
    deliveries: new Map(),
    nextDeliveryId: 0,
  };
}

export function createIconHandlers({ store } = {}){
  const s = store || createIconStore();

  function requireSet(setId){ id(setId); const set = s.sets.get(setId); if(!set) invalid('unknown icon set '+setId); return set; }
  function requireIcon(set, iconId){ id(iconId); const ic = set.icons.get(iconId); if(!ic) invalid('unknown icon '+iconId+' in set '+set.setId); return ic; }

  return {
    schema: ICON_HANDLER_SCHEMA,
    // ---------- icon-generate ----------
    handleCommandIconGenerate(input){
      const style = input.style ?? 'line';
      const count = input.count ?? 12;
      const grid = input.grid ?? 24;
      const name = input.name ? id(input.name) : null;
      const set = generateIconSet({
        style, count, grid,
        stroke: input.stroke, radius: input.radius,
        palette: input.palette,
        name: name || 'icon-set',
      });
      // register in store
      const iconMap = new Map();
      for(const ic of set.icons) iconMap.set(ic.id, ic);
      s.sets.set(set.setId, { setId: set.setId, style: set.style, grid: set.grid, count: set.count, icons: iconMap, generatedAt: set.generatedAt });
      return { schema: ICON_HANDLER_SCHEMA, action: 'icon-generate', setId: set.setId, style, grid, count, iconIds: set.icons.map(i=>i.id), generatedAt: set.generatedAt };
    },
    // ---------- icon-customize ----------
    handleCommandIconCustomize(input){
      const setId = input.setId ? id(input.setId) : null;
      const iconId = id(input.iconId);
      let sourceSvg = null;
      if(setId){
        const set = requireSet(setId);
        const ic = requireIcon(set, iconId);
        sourceSvg = ic.svg;
      } else if(input.sourceSvg){
        sourceSvg = input.sourceSvg;
      } else invalid('provide setId+iconId or sourceSvg');
      const out = customizeIcon({
        iconId, setId, variant: input.variant, motion: input.motion,
        stroke: input.stroke, radius: input.radius, color: input.color,
        paletteRef: input.paletteRef, sourceSvg,
      });
      // store customized variant as a new icon in the set if setId given
      if(setId){
        const set = requireSet(setId);
        const variantId = id(iconId+'-'+input.variant+'-'+Date.now());
        set.icons.set(variantId, { id: variantId, kind: input.variant, grid: (set.icons.get(iconId)||{grid:24}).grid, svg: out.svg, meta: out.meta });
      }
      return { schema: ICON_HANDLER_SCHEMA, action: 'icon-customize', iconId, setId, variant: out.meta.variant, motion: out.meta.motion, svg: out.svg, meta: out.meta };
    },
    // ---------- icon-deliver ----------
    handleCommandIconDeliver(input){
      const setId = id(input.setId);
      const target = en(input.target, ['phone','pc','widget','build-surface','theme-panel','nav-bar','toolbar','status-bar']);
      const surfaceId = input.surfaceId ? id(input.surfaceId) : null;
      const mapping = input.mapping ? Object.fromEntries(Object.entries(input.mapping).map(([k,v])=>[id(k),id(v)])) : null;
      const replace = !!input.replace;
      requireSet(setId);
      const deliveryId = 'delivery-' + (++s.nextDeliveryId);
      s.deliveries.set(deliveryId, { deliveryId, setId, target, surfaceId, mapping, replace, createdAt: Date.now() });
      return { schema: ICON_HANDLER_SCHEMA, action: 'icon-deliver', deliveryId, setId, target, surfaceId, mapping, replace, createdAt: Date.now() };
    },
    // ---------- icon-theme-bind ----------
    handleCommandIconThemeBind(input){
      const setId = id(input.setId);
      const themeRef = id(input.themeRef);
      const derivePalette = !!input.derivePalette;
      requireSet(setId);
      // In a full build this reads the visual-theme revision and derives icon
      // palette from it. Here we record the binding; the renderer applies it.
      return { schema: ICON_HANDLER_SCHEMA, action: 'icon-theme-bind', setId, themeRef, derivePalette, boundAt: Date.now() };
    },
    // ---------- icon-export ----------
    handleCommandIconExport(input){
      const setId = id(input.setId);
      const format = en(input.format, ['svg-sprite','svg-individual','font','json','react-component-library','vue-component-library','css-tokens','tailwind','png-spritesheet']);
      const includeMetadata = input.includeMetadata !== false;
      const set = requireSet(setId);
      const parts = [];
      for(const ic of set.icons.values()){
        const exp = exportIcon({ svg: ic.svg, format: 'svg', name: ic.id });
        parts.push({ id: ic.id, svg: exp.code });
      }
      let code;
      if(format==='svg-sprite'){
        code = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden">'+
          parts.map((p,i)=>'<symbol id="vivim-icon-'+(i+1)+'">'+p.svg.slice(p.svg.indexOf('>')+1, p.svg.lastIndexOf('</svg>'))+'</symbol>').join('')+
          '</svg>';
      } else if(format==='svg-individual'){
        code = JSON.stringify(parts.map(p=>({id:p.id, svg:p.svg})));
      } else if(format==='json'){
        code = JSON.stringify({ setId, style: set.style, grid: set.grid, icons: parts.map(p=>({id:p.id, svg:p.svg})), includeMetadata });
      } else if(format==='react-component-library'){
        code = parts.map(p=>'export default function '+p.id.replace(/[^a-zA-Z0-9]/g,'').replace(/^(.)/,(m)=>m.toUpperCase())+'(){return ('+p.svg+')}').join('\n');
      } else if(format==='vue-component-library'){
        code = parts.map(p=>'<template>'+p.svg+'</template>').join('\n');
      } else if(format==='css-tokens'){
        code = parts.map(p=>'--vivim-icon-'+p.id+': url("data:image/svg+xml;utf8,'+encodeURIComponent(p.svg)+');').join('\n');
      } else if(format==='tailwind'){
        code = parts.map(p=>'module.exports = { theme: { extend: { backgroundImage: { \''+p.id+'\': \'url("data:image/svg+xml;utf8,'+encodeURIComponent(p.svg)+')\' } } } };').join('\n');
      } else if(format==='font'){
        code = JSON.stringify({ kind:'icon-font', glyphs: parts.map(p=>({id:p.id, svg:p.svg})) });
      } else if(format==='png-spritesheet'){
        code = JSON.stringify({ kind:'png-spritesheet-placeholder', sourceSvgs: parts.map(p=>p.svg), note:'rasterize and pack into a spritesheet' });
      }
      return { schema: ICON_HANDLER_SCHEMA, action: 'icon-export', setId, format, code, includeMetadata, exportedAt: Date.now() };
    },
    // ---------- icon-library-list ----------
    handleCommandIconLibraryList(input){
      const query = input.query ? String(input.query).toLowerCase() : '';
      const sets = [...s.sets.values()].filter(set => !query || set.setId.toLowerCase().includes(query) || set.style.includes(query));
      return { schema: ICON_HANDLER_SCHEMA, action: 'icon-library-list', query, libraries: sets.map(set=>({ setId: set.setId, style: set.style, grid: set.grid, count: set.count, generatedAt: set.generatedAt })), count: sets.length };
    },
    // ---------- icon-library-install ----------
    handleCommandIconLibraryInstall(input){
      const source = input.source;
      if(typeof source!=='string'||!source.trim()) invalid('source required');
      const as = input.as ? id(input.as) : null;
      // Install = register a referenced library as a set. The actual fetch of
      // remote libraries is left to the harness; here we record the intent.
      const alias = as || source.split('/').pop().replace(/\.[^/.]+$/,'');
      s.sets.set(alias, { setId: alias, style: 'installed', grid: 24, count: 0, icons: new Map(), source, installedAt: Date.now() });
      return { schema: ICON_HANDLER_SCHEMA, action: 'icon-library-install', source, as: alias, installedAt: Date.now() };
    },
    // query helpers
    listSets(){ return [...s.sets.values()].map(set=>({setId:set.setId,style:set.style,grid:set.grid,count:set.count})); },
    getSet(setId){ return requireSet(setId); },
    listDeliveries(){ return [...s.deliveries.values()]; },
  };
}

function en(v,list){ if(!list.includes(v)) invalid('unsupported enum '+String(v)); return v; }
