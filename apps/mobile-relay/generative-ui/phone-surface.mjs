// Phone-side Build surface: renders the Host-committed vivim.ui-revision/1 surface
// and exposes component taps as inert semantic inspection. Explicit Build activation
// uses the existing bootstrap command channel. Browser-only; no Node imports.
// A tap never sends a provider prompt and is never automatically resent while uncertain.
import { renderSurface } from './renderer.mjs';
import { createSurface, LIVE_UI_BINDINGS } from './catalog.mjs';
import { createVecBindingFence } from '../vec/compiler.mjs';
import { projectVisualIntent, projectMountedVisualSemantics } from './semantic-projection.mjs';
import { transport } from '../transport.mjs';
import { createHostRevisionGuard } from './host-revision-guard.mjs';

const PAUSE = ms => new Promise(resolve => setTimeout(resolve, ms));
let mounted = false;
let surface = null;
let pending = false;
let handleStatus = () => {};
let clearBuildSurface = () => {};

function locate(node, id) {
  if (node.id === id) return node;
  for (const c of node.children ?? []) {
    const found = locate(c, id);
    if (found) return found;
  }
  return null;
}

// Component intents are UI-local; the semantic projection names the same tap with a
// visual intent. A projection that does not describe this component leaves the tap
// name-only, so rendering and previewing never depend on the projection.
const MEANING_INTENT = Object.freeze({
  'select-component': 'select',
  'preview-only': 'select',
  'inspect-meaning': 'inspect-meaning',
  'preview-layout': 'preview-layout',
  'preview-style': 'preview-style'
});

function meaningOf(intent, semantic) {
  if (!semantic) return null;
  const visual = MEANING_INTENT[intent.intent];
  if (!visual) return null;
  try {
    return projectVisualIntent({ source: intent.source??'tap', targetId: intent.targetId, intent: visual, layout: null, style: null, semantic });
  } catch { return null; }
}

export async function sendProposal() {
  throw new Error('Visual changes require an approved Host control plan. Command pending or uncertain; not resent.');
}

async function repaint() {
  try {
    const status = await transport.request('status');
    handleStatus(status);
  } catch { clearBuildSurface(); /* offline or unauthorized projections must not remain actionable */ }
}

export function mountBuildSurface(mount, { onCommit = () => {}, semantic = null, readOnly = false, onInstances=()=>{}, onSelection=()=>{} } = {}) {
  if (mounted) throw new Error('Build surface already mounted');
  mounted = true;
  const revisionGuard = createHostRevisionGuard();
  const bindingFence = createVecBindingFence(Object.keys(LIVE_UI_BINDINGS));
  let initialDraft = null,instances=new Map(),highlighted=null,selected=null,mountedSemantic=null,inspecting=false,liveData=null;

  function clear() {
    revisionGuard.disconnect();
    surface = null;
    initialDraft = null;instances.clear();highlighted=null;selected=null;mountedSemantic=null;inspecting=false;liveData=null;
    mount?.removeAttribute?.('data-vivim-inspect-mode');
    if (mount?.replaceChildren) mount.replaceChildren();
    onInstances([]);onSelection(null);
  }
  clearBuildSurface = clear;

  function render(s) {
    if (!mount || !mount.replaceChildren || !mount.ownerDocument) return;
    const restore=selected?.revision===s.revision&&selected?.surfaceId===s.surfaceId?selected.instanceId:null;
    instances.clear();highlighted=null;selected=null;mountedSemantic=null;
    renderSurface(mount, s, {
      audience: 'phone',
      tierflow: true,
      interactiveLocal: !readOnly,
      approvedRefs: [],liveData,
      onMounted: rows=>{instances=new Map(rows.map(row=>[row.instanceId,row]));},
      onIntent: (intent) => {
        if (readOnly || pending || !surface || intent.revision !== surface.revision || intent.surfaceId !== surface.surfaceId) return;
        const component=locate(surface.tree,intent.targetId);
        if(!component)return;
        selectInstance(intent.targetId,intent.revision,'tap');
      }
    });
    surface = s; // only a successfully validated and painted Host snapshot is actionable
    mountedSemantic=projectMountedVisualSemantics({surfaceId:s.surfaceId,revision:s.revision,instances:listInstances()});
    onInstances(listInstances());
    if(restore&&!selectInstance(restore,s.revision,'glyph'))onSelection(null);else if(!restore)onSelection(null);
  }

  // Read-only Host snapshot gate. A revision envelope is not a renderable document.
  function setSurface(record, bootstrap = null) {
    initialDraft = null;
    const next = revisionGuard.observe(record);
    if (next.state !== 'ready') {
      clear();
      // A fresh, authenticated, explicitly empty Host projection is the only
      // source for revision-zero design. Never paint it as a committed surface
      // or treat an unavailable/reverted head as a new empty document.
      if (!readOnly && record === null && bootstrap?.state === 'ready' &&
          bootstrap.schema === 'vivim.bootstrap-phone/1' &&
          Object.hasOwn(bootstrap, 'uiRevision') && bootstrap.uiRevision === null &&
          revisionGuard.status().highRevision === null) {
        initialDraft = createSurface({ surfaceId: 'my-space' });
      }
      return next;
    }
    if (next.changed) {
      liveData=null; // source rows belong to a specific observed visual revision
      try { render(next.surface); }
      catch {
        clear();
        if (mount?.ownerDocument && mount.replaceChildren) {
          const notice = mount.ownerDocument.createElement('p');
          notice.setAttribute('role','alert');
          notice.textContent = 'Committed UI cannot be safely displayed by TierFlow. Nothing was changed.';
          mount.replaceChildren(notice);
        }
        return { state: 'blocked', reason: 'RENDER_REFUSED', surface: null };
      }
    }
    return next;
  }
  handleStatus = status => setSurface(status?.snapshot?.bootstrap?.uiRevision ?? null, status?.snapshot?.bootstrap);

  window.addEventListener('vivim:bootstrap-status', (e) => handleStatus(e.detail));
  window.addEventListener('vivim:bootstrap-refresh', repaint);
  window.addEventListener('resize', () => {
    if (!surface) return;
    try { render(surface); }
    catch { clear(); }
  });

  function publicRow({element,...row}){return {...row,settings:{...row.settings},configurableProperties:[...(row.configurableProperties??[])]};}
  function listInstances(){return surface?Array.from(instances.values(),publicRow):[];}
  function selectInstance(id,revision,source='glyph'){
    const row=instances.get(id);
    if(!surface||!row||row.revision!==revision||surface.revision!==revision||row.element.isConnected===false||!mountedSemantic)return false;
    const meaning=meaningOf({targetId:id,intent:'select-component',source},mountedSemantic);
    if(!meaning)return false;
    highlighted?.removeAttribute?.('data-vivim-inspected');
    highlighted=row.element;highlighted.setAttribute('data-vivim-inspected','true');
    highlighted.scrollIntoView?.({block:'nearest'});
    selected={...publicRow(row),meaning};
    onSelection(selectedInstance());return true;
  }
  function selectedInstance(){
    return selected&&surface&&selected.revision===surface.revision&&selected.surfaceId===surface.surfaceId?
      {...selected,settings:{...selected.settings},configurableProperties:[...selected.configurableProperties],meaning:{...selected.meaning}}:null;
  }
  function setInspecting(enabled){
    inspecting=enabled===true&&!!surface;
    if(inspecting)mount.setAttribute?.('data-vivim-inspect-mode','true');else mount.removeAttribute?.('data-vivim-inspect-mode');
    return inspecting;
  }
  mount.addEventListener?.('click',event=>{
    if(!inspecting||!surface)return;
    const hit=event.target?.closest?.('[data-component-id]');
    if(!hit||!mount.contains?.(hit))return;
    const target=hit.getAttribute('data-component-id');
    if(!instances.has(target))return;
    event.preventDefault();event.stopPropagation();
    selectInstance(target,surface.revision,'tap');
  },true);
  function setBindingScope(identity){
    const state=bindingFence.bindScope(identity);
    if(state.state==='refused')return false;
    if(state.state==='changed'&&liveData!==null){
      liveData=null;
      if(surface){try{render(surface);}catch{clear();return false;}}
    }
    return true;
  }
  function clearBindingScope(){
    bindingFence.clearScope();
    liveData=null;
    if(surface){try{render(surface);}catch{clear();}}
  }
  function setLiveData(data,revision){
    if(!surface||surface.revision!==revision)return false;
    const candidate=bindingFence.prepare(data);
    if(candidate.state==='blocked'){
      // Never leave stale private source rows painted after revision conflict.
      liveData=null;
      try{render(surface);}catch{clear();}
      return false;
    }
    if(JSON.stringify(liveData)===JSON.stringify(data))return true;
    liveData=data;
    try{
      render(surface);
      if(candidate.state==='ready'&&!candidate.commit()){
        liveData=null;render(surface);return false;
      }
      return true;
    }catch{clear();return false;}
  }
  return { render, setSurface, setLiveData, setBindingScope, clearBindingScope,
    clear, listInstances, selectInstance, selectedInstance, setInspecting, surface: () => surface,
    draftSurface: () => initialDraft, pending: () => pending,
    revisionState: () => revisionGuard.status(),
    bindingRevisions: () => bindingFence.status() };
}
