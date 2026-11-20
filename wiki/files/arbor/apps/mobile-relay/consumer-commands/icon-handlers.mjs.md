# File: apps/mobile-relay/consumer-commands/icon-handlers.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/consumer-commands/icon-handlers.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9370 B |
| Lines | 160 |
| Hash | ce80dd346d13 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ICON_HANDLER_SCHEMA | const | 10 | yes | export const ICON_HANDLER_SCHEMA = &#39;vivim.icon-handler/1&#39;; |
| ID | const | 12 | no | const ID = /^[a-zA-Z][a-zA-Z0-9._:-]{0,95}$/; |
| invalid | function | 13 | no | function invalid(reason){ const e = new TypeError(&#39;ICON_HANDLER_REJECTED: &#39;+reason); e.code=&#39;ICON_HANDLER_REJECTED&#39;; throw e; } |
| id | function | 14 | no | function id(v){ if(typeof v!==&#39;string&#39;\|\|!ID.test(v)) invalid(&#39;invalid id &#39;+String(v)); return v; } |
| createIconStore | function | 20 | yes | export function createIconStore(){ |
| createIconHandlers | function | 28 | yes | export function createIconHandlers({ store } = {}){ |
| s | const | 29 | no | const s = store \|\| createIconStore(); |
| requireSet | function | 31 | no | function requireSet(setId){ id(setId); const set = s.sets.get(setId); if(!set) invalid(&#39;unknown icon set &#39;+setId); return set; } |
| requireIcon | function | 32 | no | function requireIcon(set, iconId){ id(iconId); const ic = set.icons.get(iconId); if(!ic) invalid(&#39;unknown icon &#39;+iconId+&#39; in set &#39;+set.setId); return ic; } |
| style | const | 38 | no | const style = input.style ?? &#39;line&#39;; |
| count | const | 39 | no | const count = input.count ?? 12; |
| grid | const | 40 | no | const grid = input.grid ?? 24; |
| name | const | 41 | no | const name = input.name ? id(input.name) : null; |
| set | const | 42 | no | const set = generateIconSet({ style, count, grid, stroke: input.stroke, radius: input.radius, palette: input.palette, name: name \|\| &#39;icon-set&#39;, |
| iconMap | const | 49 | no | const iconMap = new Map(); |
| setId | const | 56 | no | const setId = input.setId ? id(input.setId) : null; |
| iconId | const | 57 | no | const iconId = id(input.iconId); |
| sourceSvg | variable | 58 | no | let sourceSvg = null; |
| set | const | 60 | no | const set = requireSet(setId); |
| ic | const | 61 | no | const ic = requireIcon(set, iconId); |
| out | const | 66 | no | const out = customizeIcon({ iconId, setId, variant: input.variant, motion: input.motion, stroke: input.stroke, radius: input.radius, color: input.color, paletteRef: input.paletteRef, sourceSvg, }); |
| set | const | 73 | no | const set = requireSet(setId); |
| variantId | const | 74 | no | const variantId = id(iconId+&#39;-&#39;+input.variant+&#39;-&#39;+Date.now()); |
| setId | const | 81 | no | const setId = id(input.setId); |
| target | const | 82 | no | const target = en(input.target, [&#39;phone&#39;,&#39;pc&#39;,&#39;widget&#39;,&#39;build-surface&#39;,&#39;theme-panel&#39;,&#39;nav-bar&#39;,&#39;toolbar&#39;,&#39;status-bar&#39;]); |
| surfaceId | const | 83 | no | const surfaceId = input.surfaceId ? id(input.surfaceId) : null; |
| mapping | const | 84 | no | const mapping = input.mapping ? Object.fromEntries(Object.entries(input.mapping).map(([k,v])=&gt;[id(k),id(v)])) : null; |
| replace | const | 85 | no | const replace = !!input.replace; |
| deliveryId | const | 87 | no | const deliveryId = &#39;delivery-&#39; + (++s.nextDeliveryId); |
| setId | const | 93 | no | const setId = id(input.setId); |
| themeRef | const | 94 | no | const themeRef = id(input.themeRef); |
| derivePalette | const | 95 | no | const derivePalette = !!input.derivePalette; |
| setId | const | 103 | no | const setId = id(input.setId); |
| format | const | 104 | no | const format = en(input.format, [&#39;svg-sprite&#39;,&#39;svg-individual&#39;,&#39;font&#39;,&#39;json&#39;,&#39;react-component-library&#39;,&#39;vue-component-library&#39;,&#39;css-tokens&#39;,&#39;tailwind&#39;,&#39;png-spritesheet&#39;]); |
| includeMetadata | const | 105 | no | const includeMetadata = input.includeMetadata !== false; |
| set | const | 106 | no | const set = requireSet(setId); |
| parts | const | 107 | no | const parts = []; |
| exp | const | 109 | no | const exp = exportIcon({ svg: ic.svg, format: &#39;svg&#39;, name: ic.id }); |
| code | variable | 112 | no | let code; |
| query | const | 138 | no | const query = input.query ? String(input.query).toLowerCase() : &#39;&#39;; |
| sets | const | 139 | no | const sets = [...s.sets.values()].filter(set =&gt; !query \|\| set.setId.toLowerCase().includes(query) \|\| set.style.includes(query)); |
| source | const | 144 | no | const source = input.source; |
| alias | const | 149 | no | const alias = as \|\| source.split(&#39;/&#39;).pop().replace(/\\.[^/.]+$/,&#39;&#39;); |
| en | function | 160 | no | function en(v,list){ if(!list.includes(v)) invalid(&#39;unsupported enum &#39;+String(v)); return v; } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./icon-generator.mjs | import | 7 | [apps/mobile-relay/consumer-commands/icon-generator.mjs](./icon-generator.mjs.md) |
| ./icon-customize.mjs | import | 8 | [apps/mobile-relay/consumer-commands/icon-customize.mjs](./icon-customize.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 161 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
