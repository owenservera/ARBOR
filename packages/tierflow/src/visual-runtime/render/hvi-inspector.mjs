/**
 * HVI U -> the existing canonical TierFlow document validator + semantic renderer.
 * This is a read-only view adapter. The ONE UiCore/UiStore publisher is untouched.
 * No network, Host authorization simulation, provider control, or browser effects.
 * Source reports are HIDDEN until H/G2 live authorization is independently verified.
 */
import { projectHviInspector, HVI_INSPECTOR_SCHEMA } from '../knowledge/hvi-inspector.mjs';
import { validateUiDocument } from '../document/validate.ts';
import { renderUiDocument } from './dom.ts';

export const HVI_RENDER_SCHEMA = 'tierflow.hvi.render/1';
export const HVI_INSPECTOR_FEATURE = Object.freeze({
  id:'tierflow.hvi.inspector', enabled:false, liveResultRendering:false,
  syntheticPreviewOnly:true, requiredCapability:'arbor.hvi.compare.pinned/1',
  hostApproval:'per-invocation-current-grant', activePublisher:'existing-UiCore',
});
const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const BLOCKED = /(?:^|[\\/])(?:\\.env[^\\/]*|\\.git|\\.ssh|cookies?|secrets?|credentials?|tokens?|private|personal|profiles?|sessions?|login.data)(?:[\\/]|$)|(?:\\.pem|\\.p12|\\.pfx|\\.key)$|(?:bearer|password|api[_-]?key|access[_-]?token|refresh[_-]?token)[=:]/i;
function label(value, max=220) {
  return typeof value==='string' && value.length>0 && value.length<=max &&
    !/[\\u0000-\\u001f\\u007f<>]/.test(value) &&
    !/(?:javascript:|data:|https?:\\/\\/|www\\.|=>|document\\.|window\\.)/i.test(value) &&
    !BLOCKED.test(value) ? value : '[REDACTED]';
}
function state(mode) {
  return {
    empty:'No comparison has been run. Select 2 or more immutable revision pins.',
    'request-access':'Source access must be requested through Host for each comparison.',
    denied:'Source access denied or revoked. No prior report is displayed.',
    progress:'Host comparison in progress. Cancel using the existing Host task control.',
    cancelled:'Comparison cancelled. No partial result is retained here.',
    stale:'Source or publisher revision changed. Request a fresh authorized report.',
    partial:'Partial source evidence. Unknown does not mean missing.',
    'source-report':'Read-only source findings. Runtime verification remains UNRUN.',
    unavailable:'Version inspection is unavailable without a valid Host report.',
  }[mode] ?? 'Version inspection is unavailable.';
}
function makeDocument(view, revision, expandedRowIds, ownerRef, workspaceRef) {
  const nodes=[], root={id:'hvi_root',type:'stack',props:{direction:'vertical',gap:'md'},
    a11y:{role:'main',name:'HQ pinned version inspector'},children:[]};
  nodes.push(root);
  // Keep the existing canonical 24-child limit by grouping sections; never
  // increase UiDocument limits or introduce a second renderer.
  let group=null;
  const nextGroup=()=>{
    const id='hvi_group_'+String(nodes.length).padStart(2,'0');
    group={id,type:'stack',props:{direction:'vertical',gap:'sm'},
      a11y:{role:'group',name:'Version inspector section'},children:[]};
    nodes.push(group);root.children.push(id);
  };
  const add=(kind, value)=>{
    if(nodes.length>=62) return false;
    if(group===null||group.children.length>=20) nextGroup();
    const id='hvi_'+String(nodes.length).padStart(2,'0');
    const safe=label(value,kind==='card'?80:220);
    const node=kind==='card'
      ? {id,type:'card',props:{title:safe},a11y:{role:'region',name:safe},children:[]}
      : {id,type:'text',props:{value:safe},a11y:{role:'text',name:safe.slice(0,120)},children:[]};
    nodes.push(node);group.children.push(id);return true;
  };
  add('card','HQ version inspector - read only');
  add('text',state(view.mode));
  add('text','No source scanning, migration, merging or publisher actions are available here.');
  if(view.synthetic) add('card','SYNTHETIC FIXTURE - NOT A REAL REPOSITORY COMPARISON');
  if(view.mode==='source-report'||view.mode==='partial') {
    add('text','Target revision: '+(view.pins.find(x=>x.pinId===view.targetPinId)?.sha.slice(0,12)??'UNKNOWN'));
    add('card','Pinned version selectors (immutable)');
    for(const p of view.pins.slice(0,16)) {
      add('text',(p.pinId===view.targetPinId?'TARGET ':'SOURCE ')+label(p.repo,90)+' @ '+p.sha.slice(0,12)+' - '+p.completeness);
    }
    add('card','Target-relative source coverage');
    for(const c of view.coverage.slice(0,16)) {
      const p=view.pins.find(x=>x.pinId===c.sourcePinId);
      add('text',label(p?.repo??'source',90)+': '+label(c.sourceCompleteness,20)+' / target '+label(c.targetCompleteness,20)+'; observed '+String(c.observedFiles));
    }
    add('card','Source findings (capability equivalence not inferred)');
    // Deliberately bounded to protect canonical 64-node/32KiB renderer limits.
    for(const row of view.rows.slice(0,8)) {
      if(!add('text',label(row.originPath??'unknown',95)+' -> '+label(row.sourceState,40)+'; certainty '+label(row.certainty,35))) break;
      if(expandedRowIds.includes(row.id)) {
        const refs=row.evidenceRefs.slice(0,2).map(x=>label(x,90)).join(' | ') || 'No verified evidence';
        add('text','Provenance (source only): '+refs);
      }
    }
    add('text','Rows '+String(view.page?.offset??0)+'-'+String((view.page?.offset??0)+Math.min(view.rows.length,8))+
      ' of '+String(view.findings??0)+(view.page?.hasMore||view.rows.length>8?' - more report pages available':''));
    if(view.candidatePlanCount) add('text','Review candidates: '+view.candidatePlanCount+'; none approved to apply.');
    add('text','Digest '+view.provenance.digest.slice(0,16)+'; tests UNRUN unless separately receipted.');
  }
  const doc={schema:'vivim.ui-document/1',documentId:'hvi_version_inspector',
    scope:{ownerRef,workspaceRef},revision,rootId:root.id,nodes,bindings:[],
    views:[{id:'hvi_phone',version:1,kind:'2d',viewport:'phone'},
      {id:'hvi_desktop',version:1,kind:'2d',viewport:'desktop'}]};
  return doc;
}
/**
 * Requires the caller's canonical publisher revision (read-only observation).
 * Any stale revision, denied grant or non-synthetic result is fail-closed.
 * expandedRowIds supplies LOCAL presentation state; it is never a Host command.
 */
export function renderHviInspector({
  envelope=null, selectedPins=null,targetPinId=null,offset=0,limit=16,
  synthetic=false,previewSynthetic=false,permission='not_requested',
  phase='idle', expandedRowIds=[],expectedRevision=null,currentRevision=null,
  ownerRef='hvi_fixture_owner',workspaceRef='hvi_fixture_workspace',
  expectedDigest=null,
}={}, {viewportPx=360}={}) {
  const stale = !Number.isSafeInteger(expectedRevision)||expectedRevision<0||
    expectedRevision>1e9||currentRevision!==expectedRevision;
  const invalidScope=!ID.test(ownerRef)||!ID.test(workspaceRef);
  if(invalidScope) throw new TypeError('HVI_INSPECTOR_INVALID_SCOPE');
  if(!Array.isArray(expandedRowIds)||expandedRowIds.length>8 ||
     expandedRowIds.some(x=>typeof x!=='string'||x.length>240)) throw new TypeError('HVI_INSPECTOR_INVALID_EXPANSION');
  let view;
  const denied=permission==='denied'||permission==='revoked';
  if(denied) view=projectHviInspector({permission:'denied'});
  else if(stale) view={...projectHviInspector(),mode:'stale'};
  else if(phase==='cancelled') view={...projectHviInspector(),mode:'cancelled'};
  else if(phase==='progress'||phase==='cancelling') view={...projectHviInspector(),mode:'progress'};
  else if(phase==='request'||phase==='permission-pending') view={...projectHviInspector(),mode:'request-access'};
  else if(envelope!==null && synthetic===true && previewSynthetic===true) {
    view=projectHviInspector({envelope,selectedPins,targetPinId,offset,limit,synthetic:true,permission});
    if(expectedDigest!==null && expectedDigest!==view.provenance?.digest)
      view={...projectHviInspector(),mode:'stale'};
  } else if(envelope!==null) {
    // Cannot display real source results until H/G2 live-grant and revoke acceptance.
    view={...projectHviInspector(),mode:'unavailable'};
  } else view=projectHviInspector();
  const document=makeDocument(view,Number.isSafeInteger(currentRevision)&&currentRevision>=0?currentRevision:0,
    expandedRowIds,ownerRef,workspaceRef);
  const checked=validateUiDocument(document);
  if(!checked.ok) throw new Error('HVI_INSPECTOR_CANONICAL_VALIDATION_FAILED:'+
    checked.diagnostics.map(x=>x.code).join(','));
  const plan=renderUiDocument(checked.document,{viewportPx});
  return Object.freeze({schema:HVI_RENDER_SCHEMA,inspectorSchema:HVI_INSPECTOR_SCHEMA,
    mode:view.mode,feature:HVI_INSPECTOR_FEATURE,document:checked.document,renderPlan:plan,
    sourceOnly:true,liveAuthorized:false,canCompare:false,canApply:false,
    published:false,effectsInvoked:false});
}
