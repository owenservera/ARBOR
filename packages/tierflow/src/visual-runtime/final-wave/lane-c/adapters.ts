/** Scoped bridge to the EXISTING Wave 3 validator, component mapper and Wave 3/4 UX helpers. */
import { validateUiDocument } from '../../document/validate.ts';
import { mapCanonicalComponents, CANONICAL_COMPONENT_MAP_VERSION, type CanonicalComponentProjection } from '../../components/wave3-canonical-map.ts';
import { projectCapabilityHelp, type CapabilityDescriptor, type AuthorizedKbHelp, type HelpView } from '../../experience/help.ts';
import { UI_DOCUMENT_SCHEMA, type UiDocument } from '../../document/schema.ts';
import { planTemplateCandidate, TEMPLATE_CATALOG_DIGEST, type TemplateTrustedScope, type TemplateFailure } from './templates.ts';

export type TemplatePreview =
  | {readonly ok:true; readonly schema:'vivim.ui-template-preview/1'; readonly document:UiDocument;
     readonly projection:CanonicalComponentProjection; readonly catalogDigest:typeof TEMPLATE_CATALOG_DIGEST;
     readonly componentMapVersion:typeof CANONICAL_COMPONENT_MAP_VERSION; readonly baseRevision:number;
     readonly effectInvoked:false; readonly publish:'owner-review-required'}
  | {readonly ok:false; readonly code:TemplateFailure|'INVALID_BASE'|'INVALID_EXPANSION'|'UNREPRESENTABLE';
     readonly document:null; readonly effectInvoked:false; readonly publish:'refused'};

/** Explicitly effect-free. No CAS/write here; only the existing World writer can publish. */
export function previewTemplate(candidate:unknown, current:unknown, trusted:TemplateTrustedScope):TemplatePreview {
  const reject = (code:Extract<TemplatePreview,{ok:false}>['code']):TemplatePreview => ({ok:false,code,document:null,effectInvoked:false,publish:'refused'});
  if(!trusted||trusted.catalogDigest!==TEMPLATE_CATALOG_DIGEST)return reject('STALE_PIN');
  const base=validateUiDocument(current);
  if(!base.ok)return reject('INVALID_BASE');
  const plan=planTemplateCandidate(candidate,base.document,trusted);
  if(!plan.ok)return reject(plan.code);
  const valid=validateUiDocument(plan.draft);
  if(!valid.ok)return reject('INVALID_EXPANSION');
  const mapped=mapCanonicalComponents(valid.document);
  if(!mapped.ok)return reject('UNREPRESENTABLE');
  if(valid.document.schema!==UI_DOCUMENT_SCHEMA ||mapped.value.schema!==CANONICAL_COMPONENT_MAP_VERSION ||
     mapped.value.documentId!==base.document.documentId || mapped.value.revision!==base.document.revision)return reject('UNREPRESENTABLE');
  return {ok:true,schema:'vivim.ui-template-preview/1',document:valid.document,projection:mapped.value,
    catalogDigest:TEMPLATE_CATALOG_DIGEST,componentMapVersion:CANONICAL_COMPONENT_MAP_VERSION,
    baseRevision:base.document.revision,effectInvoked:false,publish:'owner-review-required'};
}

export interface ViewportReadScope { readonly authorized:boolean; readonly sessionFresh:boolean; readonly deviceScopeValid:boolean; }
export type PortableViewportResult =
  | { readonly ok:true; readonly schema:'vivim.ui-template-viewport/1'; readonly viewport:320|360|1280;
      readonly columns:1|2; readonly semanticIds:readonly string[]; readonly focusOrder:readonly string[];
      readonly talkBack:readonly {readonly id:string;readonly role:string;readonly name:string}[];
      readonly minTouchTargetPx:44; readonly layoutOnly:true; readonly effectInvoked:false }
  | { readonly ok:false; readonly code:'PRIVATE_SCOPE'|'INCOMPATIBLE_VIEWPORT'|'BAD_PROJECTION'|'LAYOUT_OVERFLOW'|'A11Y_UNSAFE';
      readonly semanticIds:readonly []; readonly focusOrder:readonly []; readonly talkBack:readonly []; readonly effectInvoked:false };
/** Caller provides authorization from the EXISTING trusted Host/KB broker; never raw browser state. */
export function projectTemplateViewport(map:CanonicalComponentProjection, viewport:320|360|1280,
  scoped:ViewportReadScope):PortableViewportResult {
  const reject=(code:Extract<PortableViewportResult,{ok:false}>['code']):PortableViewportResult=>({ok:false,code,semanticIds:[],focusOrder:[],talkBack:[],effectInvoked:false});
  if(!scoped?.authorized||!scoped.sessionFresh||!scoped.deviceScopeValid)return reject('PRIVATE_SCOPE');
  if(![320,360,1280].includes(viewport))return reject('INCOMPATIBLE_VIEWPORT');
  if(!map||map.schema!==CANONICAL_COMPONENT_MAP_VERSION||map.authority!=='inert-display-only')return reject('BAD_PROJECTION');
  const view=map.viewports.find(x=>x.viewportPx===viewport);
  if(!view)return reject('BAD_PROJECTION');
  const layouts=new Map(view.nodes.map(x=>[x.id,x.resolved]));
  for(const c of map.components){const l=layouts.get(c.id);if(!l||l.contentWidthPx<0||l.widthPx>viewport||l.itemWidthPx<0)return reject('LAYOUT_OVERFLOW');
    if(c.type==='button'&&(c.a11y.touchTargetPx<44||c.a11y.tabIndex!==0||!c.a11y.name))return reject('A11Y_UNSAFE');}
  const semantic=map.sourceRefs.filter(x=>!x.synthesized);
  const talkBack=semantic.map(x=>({id:x.sourceId,role:x.canonicalA11y.role,name:x.canonicalA11y.name}));
  if(talkBack.some(x=>!x.name||x.name.includes('<')||x.name.includes('>')))return reject('A11Y_UNSAFE');
  return {ok:true,schema:'vivim.ui-template-viewport/1',viewport,columns:viewport===1280?2:1,
    semanticIds:semantic.map(x=>x.sourceId),focusOrder:[...map.focusOrder],talkBack,
    minTouchTargetPx:44,layoutOnly:true,effectInvoked:false};
}

/** Only pre-projected Wave 4/onboarding data and canonical capability help are accepted. */
export { projectFirstEdit, transitionFirstEdit, type FirstEditInput, type FirstEditEvent, type FirstEditStage, type FirstEditView } from './first-edit.ts';

/** Existing HelpProjection owns permission language. A displayed help panel is never runnable. */
export function projectFirstEditHelp(descriptor:CapabilityDescriptor,kb?:AuthorizedKbHelp|null):HelpView {
  const help=projectCapabilityHelp(descriptor,kb);
  return {...help,runnable:false,canRequestPreview:false};
}
