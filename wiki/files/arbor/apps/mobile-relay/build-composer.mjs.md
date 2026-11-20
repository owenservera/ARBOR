# File: apps/mobile-relay/build-composer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/build-composer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23329 B |
| Lines | 322 |
| Hash | 0c18be533b47 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SUGGESTIONS | const | 20 | yes | export const SUGGESTIONS = Object.freeze([&#39;Set up everything for me&#39;, &#39;I need help researching&#39;, &#39;Make a simple AI workspace&#39;]); |
| BUILD_COMPONENTS | const | 21 | yes | export const BUILD_COMPONENTS = Object.freeze([&#39;stack&#39;, &#39;grid&#39;, &#39;text&#39;, &#39;card&#39;, &#39;button&#39;, &#39;collection&#39;, &#39;timeline&#39;, &#39;chart&#39;]); |
| MAX_REQUEST | const | 22 | yes | export const MAX_REQUEST = 400; |
| blankSurface | function | 24 | yes | export function blankSurface() { return createSurface({ surfaceId: &#39;my-space&#39; }); } |
| buildSurfaceFromBootstrap | function | 28 | yes | export function buildSurfaceFromBootstrap(bootstrap) { |
| committed | const | 32 | no | const committed=committedHostSurface(bootstrap.uiRevision); |
| THEME_BINDINGS | const | 41 | yes | export const THEME_BINDINGS = Object.freeze({ background: Object.freeze({capabilityId:&#39;vivim.ui-engine.color.background@1&#39;,field:&#39;background&#39;,type:&#39;color&#39;}), accent: Object.freeze({capabilityId:&#39;vivi… |
| THEME_START | const | 49 | no | const THEME_START = /^set my (?:app\|shell)\\b/i; |
| THEME_PATTERN | const | 50 | no | const THEME_PATTERN = /^set my (app\|shell) ([a-z-]+) to (.+)$/i; |
| COLOR | const | 51 | no | const COLOR = /^#[0-9a-fA-F]{6}$/; |
| compileVecThemeRequest | function | 55 | yes | export function compileVecThemeRequest({ text, surface } = {}) { |
| refuse | function | 56 | no | const refuse = code =&gt; ({ outcome: &#39;refused&#39;, code }); |
| matched | const | 57 | no | const matched = THEME_PATTERN.exec(typeof text === &#39;string&#39; ? text.trim().replace(/\\s+/g, &#39; &#39;) : &#39;&#39;); |
| scope | const | 59 | no | const scope=matched[1].toLowerCase()===&#39;shell&#39;?&#39;shell&#39;:&#39;build&#39;; |
| property | const | 60 | no | const property = matched[2].toLowerCase(); |
| binding | const | 61 | no | const binding=Object.hasOwn(THEME_BINDINGS,property)?THEME_BINDINGS[property]:null; |
| raw | const | 64 | no | const raw=matched[3].trim(); |
| value | variable | 65 | no | let value=raw; |
| number | const | 70 | no | const number=Number(raw.slice(0,-2)); |
| current | variable | 78 | no | let current; |
| source | const | 81 | no | const source = resolveUiSourceIdentity({ schema: &#39;vivim.ui-surface/1&#39;, nativeType: current.tree.type }); |
| typed | const | 88 | no | const typed = compileUiConfiguration({ component: { ...source.component, id: current.tree.id }, sourceSchema: &#39;vivim.ui-surface/1&#39;, baseRevision: current.revision, changes: [{ capabilityId, value }] … |
| checked | const | 96 | no | const checked=typed.changes[0].value; |
| setting | const | 101 | no | const setting=type===&#39;length&#39;?checked.value:checked; |
| display | const | 102 | no | const display=type===&#39;length&#39;?setting+&#39;px&#39;:String(setting); |
| proposal | const | 103 | no | const proposal = { |
| preview | const | 111 | no | const preview = compileUiProposal({ proposal, surface: current, approvedRefs: [], audience: &#39;phone&#39; }); |
| themeDraftCandidates | function | 122 | yes | export function themeDraftCandidates(surface){ |
| value | const | 125 | no | const value=surface.theme?.[binding.field]; |
| raw | const | 126 | no | const raw=binding.type===&#39;length&#39;?value+&#39;px&#39;:String(value); |
| text | const | 127 | no | const text=&#39;set my app &#39;+property+&#39; to &#39;+raw; |
| shellValue | const | 128 | no | const shellValue=surface.theme?.shell?.[binding.field]??value; |
| shellText | const | 129 | no | const shellText=&#39;set my shell &#39;+property+&#39; to &#39;+(binding.type===&#39;length&#39;?shellValue+&#39;px&#39;:String(shellValue)); |
| COMPONENT_START | const | 134 | no | const COMPONENT_START=/^(?:set\|reset) component\\b/i; |
| COMPONENT_SET | const | 135 | no | const COMPONENT_SET=/^set component ([A-Za-z][A-Za-z0-9._:-]{0,95})(?: at revision (\\d{1,10}))? ([a-z-]+) to (.+)$/i; |
| COMPONENT_RESET | const | 136 | no | const COMPONENT_RESET=/^reset component ([A-Za-z][A-Za-z0-9._:-]{0,95})(?: at revision (\\d{1,10}))? appearance$/i; |
| visibleComponent | function | 137 | no | function visibleComponent(node,cid){ |
| compileVecComponentRequest | function | 145 | yes | export function compileVecComponentRequest({text,surface}={}){ |
| refuse | function | 146 | no | const refuse=code=&gt;({outcome:&#39;refused&#39;,code}); |
| request | const | 148 | no | const request=text.trim().replace(/\\s+/g,&#39; &#39;); |
| set | const | 149 | no | const set=COMPONENT_SET.exec(request),reset=COMPONENT_RESET.exec(request),match=set??reset; |
| current | variable | 151 | no | let current;try{current=validateSurface(surface,{refs:new Set()});}catch{return refuse(&#39;INVALID_OR_UNAVAILABLE_SURFACE&#39;);} |
| target | const | 153 | no | const target=visibleComponent(current.tree,match[1]); |
| presentation | variable | 155 | no | let presentation=null,detail=null,explanation=&#39;Reset component &#39;+target.id+&#39; appearance.&#39;; |
| property | const | 157 | no | const property=set[3].toLowerCase(); |
| raw | const | 159 | no | const raw=set[4].trim().toLowerCase(),binding=raw===&#39;none&#39;?null:raw; |
| explanation | const | 163 | no | const explanation=&#39;Set read-only data source of &#39;+target.id+&#39; from &#39;+(target.liveBinding??&#39;none&#39;)+&#39; to &#39;+(binding??&#39;none&#39;)+&#39;. Source access is unchanged; no records are copied into the design.&#39;; |
| proposal | const | 164 | no | const proposal={schema:PROPOSAL_SCHEMA,surfaceId:current.surfaceId,baseRevision:current.revision, |
| binding | const | 170 | no | const binding=Object.hasOwn(COMPONENT_PRESENTATION_BINDINGS,property)?COMPONENT_PRESENTATION_BINDINGS[property]:null; |
| raw | const | 172 | no | const raw=set[4].trim(); |
| value | variable | 173 | no | let value=raw; |
| n | const | 177 | no | const n=Number(raw.slice(0,-2)); |
| source | const | 181 | no | const source=resolveUiSourceIdentity({schema:current.schema,nativeType:target.type,props:target.props}); |
| typed | const | 183 | no | const typed=compileUiConfiguration({component:{...source.component,id:target.id},sourceSchema:current.schema, baseRevision:current.revision,changes:[{capabilityId:binding.capabilityId,value}]}); |
| checked | const | 186 | no | const checked=typed.changes[0].value; |
| setting | const | 188 | no | const setting=binding.type===&#39;length&#39;?checked.value:checked; |
| proposal | const | 193 | no | const proposal={schema:PROPOSAL_SCHEMA,surfaceId:current.surfaceId,baseRevision:current.revision, |
| preview | const | 196 | no | const preview=compileUiProposal({proposal,surface:current,approvedRefs:[],audience:&#39;phone&#39;}); |
| templateRuntime | const | 202 | no | const templateRuntime=await import(new URL(import.meta.url.startsWith(&#39;file:&#39;) ? &#39;../../packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts&#39; : &#39;./tierflow-runtime/final-wave/lane-c/te… |
| TEMPLATE_START | const | 205 | no | const TEMPLATE_START=/^instantiate template\\b/i; |
| TEMPLATE_REQUEST | const | 206 | no | const TEMPLATE_REQUEST=/^instantiate template (FW\\.[A-Z.]+)(?: at revision (\\d{1,10}))?$/i; |
| LIVE_TEMPLATE | const | 207 | no | const LIVE_TEMPLATE=Object.freeze({&#39;FW.TASKS.NEXT&#39;:&#39;personal.open-tasks&#39;,&#39;FW.ACTIVITY.RECENT&#39;:&#39;studio.recent-outcomes&#39;}); |
| listWorkspaceTemplates | function | 208 | yes | export function listWorkspaceTemplates(){ |
| compileVecTemplateRequest | function | 212 | yes | export function compileVecTemplateRequest({text,surface}={}){ |
| refuse | function | 213 | no | const refuse=code=&gt;({outcome:&#39;refused&#39;,code}); |
| spec | const | 217 | no | const spec=templateRuntime.findTemplate(match[1].toUpperCase());if(!spec)return refuse(&#39;UNKNOWN_TEMPLATE&#39;); |
| current | variable | 218 | no | let current;try{current=validateSurface(surface,{refs:new Set()});}catch{return refuse(&#39;TEMPLATE_SURFACE_UNAVAILABLE&#39;);} |
| instanceId | const | 220 | no | const instanceId=&#39;tpl-&#39;+spec.templateId.toLowerCase().replace(/\\./g,&#39;-&#39;)+&#39;-&#39;+current.revision; |
| nodes | const | 221 | no | const nodes=templateRuntime.createTemplateNodes(spec.templateId,instanceId);if(!nodes)return refuse(&#39;TEMPLATE_RECIPE_INVALID&#39;); |
| byId | const | 222 | no | const byId=new Map(nodes.map(n=&gt;[n.id,n])),binding=LIVE_TEMPLATE[spec.templateId]; |
| adapt | function | 223 | no | function adapt(node,idDepth=0){ |
| props | const | 225 | no | const props={...node.props}; |
| liveBinding | const | 228 | no | const liveBinding=node.id===instanceId+&#39;.body&#39;?binding:null; |
| component | const | 233 | no | const component=adapt(byId.get(instanceId+&#39;.region&#39;)); |
| explanation | const | 234 | no | const explanation=&#39;Insert &#39;+spec.title+&#39; template&#39;+(binding?&#39; with read-only &#39;+binding+&#39; binding&#39;:&#39;; no source data is assumed&#39;)+&#39;.&#39;; |
| proposal | const | 235 | no | const proposal={schema:PROPOSAL_SCHEMA,surfaceId:current.surfaceId,baseRevision:current.revision, |
| preview | const | 238 | no | const preview=compileUiProposal({proposal,surface:current,approvedRefs:[],audience:&#39;phone&#39;}); |
| templateDraftCandidates | function | 244 | yes | export function templateDraftCandidates(surface){ |
| vec | const | 249 | no | const vec = createVecCompiler({ adapters: { ui: args =&gt; THEME_START.test(String(args.text ?? &#39;&#39;).trim()) ? compileVecThemeRequest(args) : COMPONENT_START.test(String(args.text??&#39;&#39;).trim()) ? compileV… |
| resolveBuildRequest | function | 255 | yes | export function resolveBuildRequest({ request, surface = blankSurface() } = {}) { |
| buildDesignPrompt | function | 259 | yes | export function buildDesignPrompt({ request, surface = blankSurface(), taskId }) { |
| text | const | 260 | no | const text = String(request ?? &#39;&#39;).trim().replace(/\\s+/g, &#39; &#39;); |
| context | const | 263 | no | const context = composeDesignContext({ surface, baseRevision: surface.revision, userRequest: text, deviceClass: &#39;phone&#39;, allowedComponents: BUILD_COMPONENTS, constraints: [&#39;Presentation only&#39;, &#39;Keep … |
| extractObject | function | 284 | yes | export function extractObject(text) { |
| source | const | 285 | no | const source = String(text ?? &#39;&#39;); |
| depth | variable | 287 | no | let depth = 0, inString = false, escaped = false; |
| ch | const | 289 | no | const ch = source[i]; |
| previewReply | function | 300 | yes | export function previewReply({ reply, surface = blankSurface() }) { |
| proposal | const | 301 | no | const proposal = extractObject(reply); |
| preview | const | 304 | no | const preview = compileUiProposal({ proposal, surface, approvedRefs: [], audience: &#39;phone&#39; }); |
| stale | const | 307 | no | const stale = /stale\|revision/i.test(String(error?.message)); |
| failureText | function | 313 | yes | export function failureText(result) { |
| code | const | 314 | no | const code = /^[A-Z][A-Z0-9_]{2,60}/.exec(String(result ?? &#39;&#39;))?.[0] ?? null; |
| known | const | 315 | no | const known = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./generative-ui/design-composer.mjs | import | 4 | [apps/mobile-relay/generative-ui/design-composer.mjs](./generative-ui/design-composer.mjs.md) |
| ./generative-ui/compiler.mjs | import | 5 | [apps/mobile-relay/generative-ui/compiler.mjs](./generative-ui/compiler.mjs.md) |
| ./generative-ui/catalog.mjs | import | 6 | [apps/mobile-relay/generative-ui/catalog.mjs](./generative-ui/catalog.mjs.md) |
| ./generative-ui/host-revision-guard.mjs | import | 7 | [apps/mobile-relay/generative-ui/host-revision-guard.mjs](./generative-ui/host-revision-guard.mjs.md) |
| ./vec/compiler.mjs | import | 8 | [apps/mobile-relay/vec/compiler.mjs](./vec/compiler.mjs.md) |
| ./vec/ui-adapter.mjs | import | 9 | [apps/mobile-relay/vec/ui-adapter.mjs](./vec/ui-adapter.mjs.md) |
| ./vec/ui-taxonomy/registry.mjs | import | 10 | [apps/mobile-relay/vec/ui-taxonomy/registry.mjs](./vec/ui-taxonomy/registry.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](./app.js.md) | ./build-composer.mjs |
| [apps/mobile-relay/build-canvas.mjs](./build-canvas.mjs.md) | ./build-composer.mjs |
| [apps/mobile-relay/test/build-composer.test.mjs](./test/build-composer.test.mjs.md) | ../build-composer.mjs |
| [apps/mobile-relay/test/build-live-readback.test.mjs](./test/build-live-readback.test.mjs.md) | ../build-composer.mjs |
| [apps/mobile-relay/test/build-vec-routing.test.mjs](./test/build-vec-routing.test.mjs.md) | ../build-composer.mjs |
| [apps/mobile-relay/test/build-vec-theme.test.mjs](./test/build-vec-theme.test.mjs.md) | ../build-composer.mjs |
| [apps/mobile-relay/test/component-presentation.test.mjs](./test/component-presentation.test.mjs.md) | ../build-composer.mjs |
| [apps/mobile-relay/test/product-semantic-parity.test.mjs](./test/product-semantic-parity.test.mjs.md) | ../build-composer.mjs |
| [apps/mobile-relay/test/vec-ui-taxonomy.test.mjs](./test/vec-ui-taxonomy.test.mjs.md) | ../build-composer.mjs |
| [apps/mobile-relay/test/workspace-template-wiring.test.mjs](./test/workspace-template-wiring.test.mjs.md) | ../build-composer.mjs |
| [apps/mobile-relay/ux/launcher-ui.mjs](./ux/launcher-ui.mjs.md) | ../build-composer.mjs |
| [apps/vivim-host/test/direct-phone.test.mjs](../vivim-host/test/direct-phone.test.mjs.md) | ../../mobile-relay/build-composer.mjs |
| [hq/test/vlang-compiled-context.test.mjs](../../hq/test/vlang-compiled-context.test.mjs.md) | ../../apps/mobile-relay/build-composer.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Build canvas request flow, pure and browser-safe. The owner's words become a bounded design prompt;
// the settled reply is validated by the same compiler the Host uses before anything is previewed.
// Nothing here sends, applies or trusts a reply: a proposal is a draft until the owner taps Activate.
import { composeDesignContext } from './generative-ui/design-composer.mjs';
import { compileUiProposal } from './generative-ui/compiler.mjs';
import { createSurface, PROPOSAL_SCHEMA, validateSurface, COMPONENT_PRESENTATION_BINDINGS, validateComponentPresentation, LIVE_UI_BINDINGS } from './generative-ui/catalog.mjs';
import { committedHostSurface } from './generative-ui/host-revision-guard.mjs';
import { createVecCompiler } from './vec/compiler.mjs';
import { compileVecUiRequest } from './vec/ui-adapter.mjs';
import { getUiComponent, resolveUiSourceIdentity } from './vec/ui-taxonomy/registry.mjs';

// Canonical first-party VEC engine, not a rewritten client-side compiler.
// Node resolves its source directly; the paired browser uses Host's fixed asset map.
const { compileUiConfiguration } = await import(
  typeof process !== 'undefined' && process.versions?.node
    ? '../../packages/vec-ui-engines/src/compiler.mjs'
    : './vec-engines/compiler.mjs'
).catch(() => ({ compileUiConfiguration: null }));

export const SUGGESTIONS = Object.freeze(['Set up everything for me', 'I need help researching', 'Make a simple AI workspace']);
export const BUILD_COMPONENTS = Object.freeze(['stack', 'grid', 'text', 'card', 'button', 'collection', 'timeline', 'chart']);
export const MAX_REQUEST = 400;

export function blankSurface() { return createSurface({ surfaceId: 'my-space' }); }

// Use only an authenticated caller's actual bootstrap projection. A blank
// document is a draft baseline solely when Host explicitly reports no revision.
export function buildSurfaceFromBootstrap(bootstrap) {
  if(!bootstrap||bootstrap.schema!=='vivim.bootstrap-phone/1'||
     bootstrap.state!=='ready'||!Object.hasOwn(bootstrap,'uiRevision'))return null;
  if(bootstrap.uiRevision===null)return blankSurface();
  const committed=committedHostSurface(bootstrap.uiRevision);
  if(!committed)return null;
  try{return validateSurface(committed,{refs:new Set()});}catch{return null;}
}

// Deterministic first, same canonical UI proposal and Host approval as the model path.
// The compiler is an inert preview boundary, not a new action dispatcher or publisher.
// Reviewed bindings to existing theme fields. These are preview mappings,
 // not a claim that every declared engine is installed or authorized.
export const THEME_BINDINGS = Object.freeze({
  background: Object.freeze({capabilityId:'vivim.ui-engine.color.background@1',field:'background',type:'color'}),
  accent: Object.freeze({capabilityId:'vivim.ui-engine.color.accent@1',field:'accent',type:'color'}),
  secondary: Object.freeze({capabilityId:'vivim.ui-engine.color.surface@1',field:'secondary',type:'color'}),
  'font-size': Object.freeze({capabilityId:'vivim.ui-engine.typography.size@1',field:'fontSizePx',type:'length',min:13,max:19}),
  radius: Object.freeze({capabilityId:'vivim.ui-engine.corners.radius@1',field:'radiusPx',type:'length',min:6,max:24}),
  'spacing-scale': Object.freeze({capabilityId:'vivim.ui-engine.spacing.scale@1',field:'spacingScale',type:'number',min:0.85,max:1.2})
});
const THEME_START = /^set my (?:app|shell)\b/i;
const THEME_PATTERN = /^set my (app|shell) ([a-z-]+) to (.+)$/i;
const COLOR = /^#[0-9a-fA-F]{6}$/;

// Reviewed VEC capabilities map to the existing Host set-theme operation.
// A descriptive engine capability grants neither execution nor write authority.
export function compileVecThemeRequest({ text, surface } = {}) {
  const refuse = code => ({ outcome: 'refused', code });
  const matched = THEME_PATTERN.exec(typeof text === 'string' ? text.trim().replace(/\s+/g, ' ') : '');
  if (!matched) return refuse('UNSUPPORTED_THEME_REQUEST');
  const scope=matched[1].toLowerCase()==='shell'?'shell':'build';
  const property = matched[2].toLowerCase();
  const binding=Object.hasOwn(THEME_BINDINGS,property)?THEME_BINDINGS[property]:null;
  if(!binding)return refuse('UNSUPPORTED_THEME_PROPERTY');
  const {capabilityId,field,type,min,max}=binding;
  const raw=matched[3].trim();
  let value=raw;
  if(type==='color'){
    if(!COLOR.test(raw))return refuse('INVALID_THEME_COLOR');
  }else if(type==='length'){
    if(!/^\d{1,2}px$/.test(raw))return refuse('INVALID_THEME_LENGTH');
    const number=Number(raw.slice(0,-2));
    if(number<min||number>max)return refuse('INVALID_THEME_LENGTH');
    value={value:number,unit:'px'};
  }else{
    if(!/^\d(?:\.\d{1,3})?$/.test(raw))return refuse('INVALID_THEME_SCALE');
    value=Number(raw);if(value<min||value>max)return refuse('INVALID_THEME_SCALE');
  }
  if (typeof compileUiConfiguration !== 'function') return refuse('VEC_ENGINE_UNAVAILABLE');
  let current;
  try { current = validateSurface(surface, { refs: new Set() }); }
  catch { return refuse('INVALID_OR_UNAVAILABLE_SURFACE'); }
```

_First 80 of 323 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
