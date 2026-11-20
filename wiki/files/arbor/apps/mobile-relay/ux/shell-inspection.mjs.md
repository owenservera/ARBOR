# File: apps/mobile-relay/ux/shell-inspection.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/shell-inspection.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3297 B |
| Lines | 48 |
| Hash | bc955cb67fe3 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SHELL_TYPES | const | 5 | no | const SHELL_TYPES=Object.freeze({top:&#39;foundation.surface.panel&#39;,tabs:&#39;navigation.global.tab-bar&#39;,conn:&#39;feedback.status.connection-status&#39;, &#39;theme-toggle&#39;:&#39;input.actions.icon-button&#39;,&#39;chat-composer&#39;:&#39;… |
| identity | function | 10 | no | function identity(id){ |
| suffix | const | 11 | no | const suffix=SHELL_TYPES[id]??(id.startsWith(&#39;tab-&#39;)?&#39;navigation.global.tab&#39;:id.startsWith(&#39;v-&#39;)?&#39;foundation.surface.tab-panel&#39;:null); |
| MOUNTS | const | 14 | no | const MOUNTS=Object.freeze([ [&#39;top&#39;,&#39;application header&#39;],[&#39;tabs&#39;,&#39;navigation&#39;],[&#39;tab-today&#39;,&#39;Today tab&#39;], [&#39;tab-talk&#39;,&#39;Talk tab&#39;],[&#39;tab-build&#39;,&#39;Build tab&#39;],[&#39;tab-world&#39;,&#39;World tab&#39;], [&#39;tab-wiki&#39;,&#39;Wi… |
| visible | function | 27 | no | function visible(doc,id){ |
| node | const | 28 | no | const node=doc?.getElementById(id); |
| inspectShell | function | 32 | yes | export function inspectShell(doc,tab){ |
| selectShell | function | 39 | yes | export function selectShell(doc,tab,row){ |
| target | const | 42 | no | const target=visible(doc,row.instanceId.slice(6)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../vec/ui-taxonomy/registry.mjs | import | 3 | [apps/mobile-relay/vec/ui-taxonomy/registry.mjs](../vec/ui-taxonomy/registry.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](../app.js.md) | ./ux/shell-inspection.mjs |
| [apps/mobile-relay/test/shell-inspection.test.mjs](../test/shell-inspection.test.mjs.md) | ../ux/shell-inspection.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Native shell inspection is deliberately read-only. Never collect input values,
// text content, private data or arbitrary HTML. A visible real mount is required.
import {getUiComponent} from '../vec/ui-taxonomy/registry.mjs';
// Canonical identities describe existing mounted DOM, not installed mutation adapters.
const SHELL_TYPES=Object.freeze({top:'foundation.surface.panel',tabs:'navigation.global.tab-bar',conn:'feedback.status.connection-status',
  'theme-toggle':'input.actions.icon-button','chat-composer':'foundation.surface.panel','dock-preview':'input.actions.button',
  'dock-rail':'navigation.global.nav-bar',text:'input.text-entry.textarea',send:'input.actions.submit-button',
  'dock-mic':'input.actions.voice-command-button','composer-assist':'feedback.status.status',msgs:'data.collections.collection',
  'build-compose':'foundation.surface.panel','build-surface':'foundation.surface.canvas','control-preview':'foundation.surface.panel'});
function identity(id){
  const suffix=SHELL_TYPES[id]??(id.startsWith('tab-')?'navigation.global.tab':id.startsWith('v-')?'foundation.surface.tab-panel':null);
  return suffix?getUiComponent('vivim.ui.'+suffix+'@1')?.id??null:null;
}
const MOUNTS=Object.freeze([
  ['top','application header'],['tabs','navigation'],['tab-today','Today tab'],
  ['tab-talk','Talk tab'],['tab-build','Build tab'],['tab-world','World tab'],
  ['tab-wiki','Wiki tab'],['tab-me','Me tab'],['tab-control','Control tab'],
  ['conn','connection status'],['theme-toggle','appearance control'],
  ['chat-composer','shared composer'],['dock-preview','composer dock'],
  ['dock-rail','composer navigation'],['text','draft input'],['send','submit control'],
  ['dock-mic','voice capture'],['composer-assist','semantic assistance'],
  ['v-talk','Talk panel'],['msgs','conversation transcript'],
  ['v-build','Build panel'],['build-compose','Build composer'],['build-surface','Build surface'],['build-inspector','Build component inspector'],
  ['v-wiki','Wiki panel'],['v-today','Today panel'],['v-world','World panel'],
  ['v-me','Me panel'],['v-control','Control panel'],['control-preview','protected approval preview']
]);
function visible(doc,id){
  const node=doc?.getElementById(id);
  if(!node||node.isConnected===false||node.closest?.('[hidden]')||node.getClientRects?.().length===0)return null;
  return node;
}
export function inspectShell(doc,tab){
  if(typeof tab!=='string'||!tab)return [];
  return MOUNTS.flatMap(([id,type])=>visible(doc,id)?[{
    instanceId:'shell:'+id,componentId:identity(id)??'native-dom:'+id,surfaceId:'shell:'+tab,
    scope:'shell',revision:tab,type,settings:{authority:'protected inspection only',presentation:'Host theme tokens'}
  }]:[]);
}
export function selectShell(doc,tab,row){
  if(row?.scope!=='shell'||row.surfaceId!=='shell:'+tab||row.revision!==tab||
    !inspectShell(doc,tab).some(r=>r.instanceId===row.instanceId))return false;
  const target=visible(doc,row.instanceId.slice(6));
  if(!target)return false;
  for(const node of doc.querySelectorAll?.('[data-vivim-shell-inspected]')??[])
    node.removeAttribute('data-vivim-shell-inspected');
  target.setAttribute('data-vivim-shell-inspected','true');
  target.scrollIntoView?.({block:'nearest'});return true;
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
