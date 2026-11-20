# File: apps/mobile-relay/vec/ui-taxonomy/registry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/vec/ui-taxonomy/registry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11622 B |
| Lines | 204 |
| Hash | 1254be81f5ff |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UI_IDENTITY_SCHEMA | const | 9 | yes | export const UI_IDENTITY_SCHEMA = &#39;vivim.ui-component-identity/1&#39;; |
| UI_EXTENSION_SCHEMA | const | 10 | yes | export const UI_EXTENSION_SCHEMA = &#39;vivim.ui-extension-proposal/1&#39;; |
| UI_BINDING_STATUSES | const | 11 | yes | export const UI_BINDING_STATUSES = Object.freeze([ &#39;source-closed&#39;, &#39;fixture-inspector-only&#39;, &#39;world-shape-only&#39; ]); |
| DOMAIN_NAMES | const | 14 | no | const DOMAIN_NAMES = Object.freeze(Object.keys(UI_DOMAINS)); |
| COMPONENT_ID | const | 15 | no | const COMPONENT_ID = /^vivim\\.ui\\.([a-z][a-z0-9-]*)\\.([a-z][a-z0-9-]*)\\.([a-z][a-z0-9-]*)@([1-9]\\d*)$/; |
| KIND | const | 16 | no | const KIND = /^[a-z][a-z0-9-]{0,79}$/; |
| EVENT | const | 17 | no | const EVENT = /^[a-z][a-z0-9-]{0,63}$/; |
| PLAIN | function | 18 | no | const PLAIN = v =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v) &amp;&amp; |
| own | function | 20 | no | const own = (v,k) =&gt; Object.hasOwn(v,k); |
| freezeDeep | function | 21 | no | const freezeDeep = v =&gt; { |
| A11Y_KEYBOARD | const | 28 | no | const A11Y_KEYBOARD = Object.freeze({ group:&#39;none&#39;, region:&#39;none&#39;, navigation:&#39;tab&#39;, text:&#39;none&#39;, presentation:&#39;none&#39;, button:&#39;enter-space&#39;, textbox:&#39;typing&#39;, slider:&#39;arrows&#39;, dialog:&#39;focus-trap&#39;, st… |
| DEFAULT_STATE | const | 34 | no | const DEFAULT_STATE = Object.freeze([&#39;idle&#39;, &#39;disabled&#39;, &#39;unknown&#39;]); |
| SHAPE_BY_DOMAIN | const | 35 | no | const SHAPE_BY_DOMAIN = Object.freeze({ foundation:&#39;none&#39;, navigation:&#39;route-proposal&#39;, input:&#39;scalar&#39;, feedback:&#39;status&#39;, data:&#39;structured&#39;, media:&#39;media-ref&#39;, application:&#39;structured&#39;, spatial:&#39;spa… |
| toLabel | function | 40 | no | const toLabel = s =&gt; s.split(&#39;-&#39;).map(w =&gt; w[0].toUpperCase()+w.slice(1)).join(&#39; &#39;); |
| makeDescriptor | function | 41 | no | function makeDescriptor(family,kind) { |
| key | const | 42 | no | const key = family.domain + &#39;.&#39; + family.family + &#39;.&#39; + kind; |
| special | const | 43 | no | const special = UI_OVERRIDES[key] ?? {}; |
| role | const | 44 | no | const role = special.role ?? family.role; |
| traits | const | 45 | no | const traits = [...new Set([...family.traits, ...(special.traits ?? [])])].sort(); |
| propKeys | const | 46 | no | const propKeys = special.props ?? family.properties; |
| props | const | 49 | no | const props = Object.fromEntries(propKeys.map(p=&gt;[p,UI_PROPERTIES[p]])); |
| events | const | 50 | no | const events = [...new Set(special.events ?? family.events)].sort(); |
| states | const | 51 | no | const states = special.states ?? DEFAULT_STATE; |
| effects | const | 52 | no | const effects = traits.includes(&#39;intent-only&#39;) ? &#39;host-intent-proposal&#39; : &#39;none&#39;; |
| bindings | const | 53 | no | const bindings = UI_SOURCE_BINDINGS.filter(b=&gt;b[2]===key).map(b=&gt;Object.freeze({ schema:b[0], nativeType:b[1], state:b[3], ...(b[4]?{variant:b[4]}:{}) })); |
| catalog | const | 75 | no | const catalog = []; |
| ids | const | 76 | no | const ids = new Map(), byKind = new Map(); |
| familyIds | const | 77 | no | const familyIds = new Set(); |
| fid | const | 80 | no | const fid=family.domain+&#39;.&#39;+family.family; |
| descriptor | const | 85 | no | const descriptor=makeDescriptor(family,kind); |
| possible | const | 88 | no | const possible=byKind.get(kind)??[]; |
| id | const | 95 | no | const id=&#39;vivim.ui.&#39;+binding[2]+&#39;@1&#39;; |
| UI_TAXONOMY_COUNTS | const | 98 | yes | export const UI_TAXONOMY_COUNTS = Object.freeze({ domains:DOMAIN_NAMES.length, families:UI_FAMILIES.length, components:catalog.length, sourceBindings:UI_SOURCE_BINDINGS.length }); |
| all | const | 102 | no | const all = freezeDeep(catalog); |
| listUiDomains | function | 103 | yes | export function listUiDomains(){return DOMAIN_NAMES.map(domain=&gt;Object.freeze({id:domain,title:UI_DOMAINS[domain]}));} |
| listUiFamilies | function | 104 | yes | export function listUiFamilies({domain}={}) { |
| getUiComponent | function | 110 | yes | export function getUiComponent(id) { |
| findUiComponent | function | 113 | yes | export function findUiComponent(kind,{domain,family}={}) { |
| hits | const | 115 | no | const hits=(byKind.get(kind)??[]).filter(d=&gt; (domain===undefined\|\|domain===d.domain)&amp;&amp;(family===undefined\|\|family===d.family)); |
| listUiComponents | function | 121 | yes | export function listUiComponents({domain,family,trait,sourceSchema,search,limit=500}={}) { |
| q | const | 128 | no | const q=(search??&#39;&#39;).toLowerCase().trim(); |
| resolveUiSourceIdentity | function | 138 | yes | export function resolveUiSourceIdentity({schema,nativeType,props={}}={}) { |
| found | const | 141 | no | const found=UI_SOURCE_BINDINGS.filter(b=&gt;b[0]===schema&amp;&amp;b[1]===nativeType); |
| preferred | const | 142 | no | const preferred=found.filter(b=&gt;b[4]!==undefined&amp;&amp;b[4]===props.variant); |
| chosen | const | 143 | no | const chosen=preferred.length?preferred:found.filter(b=&gt;b[4]===undefined); |
| binding | const | 146 | no | const binding=chosen[0],component=ids.get(&#39;vivim.ui.&#39;+binding[2]+&#39;@1&#39;); |
| validData | function | 151 | no | function validData(v,seen=new Set(),depth=0) { |
| keys | const | 156 | no | const keys=Reflect.ownKeys(v); |
| inspectUiExtensionProposal | function | 164 | yes | export function inspectUiExtensionProposal(input){ |
| fail | function | 165 | no | const fail=code=&gt;({schema:UI_EXTENSION_SCHEMA,outcome:&#39;refused&#39;,code,installed:false,authorized:false}); |
| allowed | const | 167 | no | const allowed=[&#39;schema&#39;,&#39;domain&#39;,&#39;family&#39;,&#39;kind&#39;,&#39;label&#39;,&#39;properties&#39;,&#39;traits&#39;,&#39;events&#39;,&#39;a11yRole&#39;]; |
| family | const | 170 | no | const family=UI_FAMILIES.find(f=&gt;f.domain===input.domain&amp;&amp;f.family===input.family); |
| id | const | 174 | no | const id=&#39;vivim.ui.&#39;+input.domain+&#39;.&#39;+input.family+&#39;.&#39;+input.kind+&#39;@1&#39;; |
| exportUiTaxonomy | function | 193 | yes | export function exportUiTaxonomy() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./catalog.mjs | import | 4 | [apps/mobile-relay/vec/ui-taxonomy/catalog.mjs](./catalog.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-composer.mjs](../../build-composer.mjs.md) | ./vec/ui-taxonomy/registry.mjs |
| [apps/mobile-relay/generative-ui/renderer.mjs](../../generative-ui/renderer.mjs.md) | ../vec/ui-taxonomy/registry.mjs |
| [apps/mobile-relay/test/vec-ui-taxonomy.test.mjs](../../test/vec-ui-taxonomy.test.mjs.md) | ../vec/ui-taxonomy/registry.mjs |
| [apps/mobile-relay/ux/launcher-ui.mjs](../../ux/launcher-ui.mjs.md) | ../vec/ui-taxonomy/registry.mjs |
| [apps/mobile-relay/ux/shell-inspection.mjs](../../ux/shell-inspection.mjs.md) | ../vec/ui-taxonomy/registry.mjs |
| [apps/mobile-relay/vec/ui-adapter.mjs](../ui-adapter.mjs.md) | ./ui-taxonomy/registry.mjs |
| [packages/vec-ui-engines/test/engine-core.test.mjs](../../../../packages/vec-ui-engines/test/engine-core.test.mjs.md) | ../../../apps/mobile-relay/vec/ui-taxonomy/registry.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VEC UI taxonomy registry/1: descriptive identity and contract lookup only.
// Never dynamically loads or registers code; a catalogued slider is not a renderable slider.
// One canonical catalog; consumer schemas and Host authority remain closed and independent.
import {
  UI_TAXONOMY_SCHEMA, UI_DOMAINS, UI_FAMILIES, UI_PROPERTIES,
  UI_TRAITS, UI_OVERRIDES, UI_SOURCE_BINDINGS
} from './catalog.mjs';

export const UI_IDENTITY_SCHEMA = 'vivim.ui-component-identity/1';
export const UI_EXTENSION_SCHEMA = 'vivim.ui-extension-proposal/1';
export const UI_BINDING_STATUSES = Object.freeze([
  'source-closed', 'fixture-inspector-only', 'world-shape-only'
]);
const DOMAIN_NAMES = Object.freeze(Object.keys(UI_DOMAINS));
const COMPONENT_ID = /^vivim\.ui\.([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)@([1-9]\d*)$/;
const KIND = /^[a-z][a-z0-9-]{0,79}$/;
const EVENT = /^[a-z][a-z0-9-]{0,63}$/;
const PLAIN = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const own = (v,k) => Object.hasOwn(v,k);
const freezeDeep = v => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    for (const key of Object.keys(v)) freezeDeep(v[key]);
    Object.freeze(v);
  }
  return v;
};
const A11Y_KEYBOARD = Object.freeze({
  group:'none', region:'none', navigation:'tab', text:'none', presentation:'none',
  button:'enter-space', textbox:'typing', slider:'arrows', dialog:'focus-trap',
  status:'none', progressbar:'none', list:'navigable-if-interactive',
  table:'grid-keys-if-interactive', img:'none', main:'none'
});
const DEFAULT_STATE = Object.freeze(['idle', 'disabled', 'unknown']);
const SHAPE_BY_DOMAIN = Object.freeze({
  foundation:'none', navigation:'route-proposal', input:'scalar', feedback:'status',
  data:'structured', media:'media-ref', application:'structured',
  spatial:'spatial', accessibility:'accessibility-state'
});
const toLabel = s => s.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
function makeDescriptor(family,kind) {
  const key = family.domain + '.' + family.family + '.' + kind;
  const special = UI_OVERRIDES[key] ?? {};
  const role = special.role ?? family.role;
  const traits = [...new Set([...family.traits, ...(special.traits ?? [])])].sort();
  const propKeys = special.props ?? family.properties;
  for (const name of propKeys)
    if (!own(UI_PROPERTIES,name)) throw new Error('UI_TAXONOMY_UNDECLARED_PROP:' + key + ':' + name);
  const props = Object.fromEntries(propKeys.map(p=>[p,UI_PROPERTIES[p]]));
  const events = [...new Set(special.events ?? family.events)].sort();
  const states = special.states ?? DEFAULT_STATE;
  const effects = traits.includes('intent-only') ? 'host-intent-proposal' : 'none';
  const bindings = UI_SOURCE_BINDINGS.filter(b=>b[2]===key).map(b=>Object.freeze({
    schema:b[0], nativeType:b[1], state:b[3], ...(b[4]?{variant:b[4]}:{})
  }));
  return freezeDeep({
    schema:UI_IDENTITY_SCHEMA, id:'vivim.ui.' + key + '@1', version:1,
    domain:family.domain, family:family.family, kind, label:toLabel(kind),
    classification:{role, traits, composition:traits.includes('container')?'container':'leaf'},
    contract:{
      properties:props, events, states:[...states],
      data:{shape:special.dataShape ?? SHAPE_BY_DOMAIN[family.domain],
        referenceOnly:traits.includes('bindable') || traits.includes('requires-host-grant')},
      effects, accessibility:{
        role, keyboard:A11Y_KEYBOARD[role] ?? 'define-before-install',
        nameRequired:traits.some(t=>['focusable','interactive'].includes(t)),
        alternativeInputRequired:traits.includes('gesture-driven')
      }
    },
    implementations:bindings,
    availability:bindings.length?'source-mapped-not-accepted':'taxonomy-only',
    runtimeAuthorized:false
  });
}
const catalog = [];
const ids = new Map(), byKind = new Map();
const familyIds = new Set();
for (const family of UI_FAMILIES) {
  if (!own(UI_DOMAINS,family.domain)) throw new Error('UI_TAXONOMY_UNKNOWN_DOMAIN');
  const fid=family.domain+'.'+family.family;
```

_First 80 of 205 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
