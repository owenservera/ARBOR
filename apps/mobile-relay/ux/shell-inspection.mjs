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
  ['v-build','Build panel'],['build-compose','Build composer'],['build-surface','Build surface'],
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
