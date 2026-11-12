/** Inert first-edit state projections; Wave 4 supplies existing onboarding truth. */
import type { Wave4OnboardingView } from '../../experience/wave4-onboarding-resume.ts';
import type { HelpView } from "../../experience/help.ts";
import type { TemplatePreview } from './adapters.ts';
export type FirstEditStage = 'discover'|'choose'|'preview'|'review'|'cancelled';
export type FirstEditInput = Readonly<{stage:FirstEditStage; shell:'desktop'|'android';viewport:320|360|1280;
  onboarding:Wave4OnboardingView;preview:TemplatePreview|null;help:HelpView|null}>;
export type FirstEditEvent = 'open'|'choose-template'|'show-preview'|'request-review'|'back'|'escape'|'cancel'|'request-publish';
export interface FirstEditControl {readonly id:string;readonly name:string;readonly shortcut:string;readonly minTouchPx:44;readonly action:'navigation-only'|'owner-review-required';}
export interface FirstEditView {readonly schema:'vivim.ui-first-edit/1';readonly stage:FirstEditStage; readonly heading:string;
  readonly controls:readonly FirstEditControl[];readonly focusOrder:readonly string[];readonly firstFocusId:string;
  readonly backTarget:FirstEditStage;readonly canRequestPublish:false;readonly hostEffectAllowed:false;
  readonly ownerReviewRequired:true;readonly layoutUndoOnly:true;readonly applied:false;readonly effectInvoked:false;
  readonly helpText:string;readonly qrAccessibleName:string;}
const CLEAR_HELP='Review the preview, permissions and changed layout. Nothing has been published.';
const SECRET=/(?:[a-f0-9]{64}|[A-Za-z0-9_-]{42,}|https?:\/\/|javascript:|data:|(?:bearer|token|secret|password)\s*[:=]|<|>)/i;
export function projectFirstEdit(input:FirstEditInput):FirstEditView {
  if(!input||!['desktop','android'].includes(input.shell)||![320,360,1280].includes(input.viewport)||
    !input.onboarding||input.onboarding.schema!=='vivim.wave4-founder-onboarding/1')throw new TypeError('Existing Wave 4 onboarding view required');
  let stage:FirstEditStage=input.stage;
  if(!['discover','choose','preview','review','cancelled'].includes(stage))throw new TypeError('Unsupported stage');
  if((stage==='preview'||stage==='review')&&!input.preview?.ok)stage='choose';
  const controls:FirstEditControl[]=(stage==='cancelled'?[]:stage==='discover'?
    [{id:'first-edit.open',name:'Customize workspace',shortcut:'Enter or Space',minTouchPx:44,action:'navigation-only'}]:
    stage==='choose'?
    [{id:'first-edit.choose',name:'Choose a template',shortcut:'Enter or Space',minTouchPx:44,action:'navigation-only'},{id:'first-edit.cancel',name:'Cancel',shortcut:'Escape or Back',minTouchPx:44,action:'navigation-only'}]:
    stage==='preview'?
    [{id:'first-edit.inspect',name:'Inspect layout preview',shortcut:'Enter or Space',minTouchPx:44,action:'navigation-only'},{id:'first-edit.back',name:'Go back',shortcut:'Escape or Back',minTouchPx:44,action:'navigation-only'}]:
    [{id:'first-edit.review',name:'Request owner review',shortcut:'Enter or Space',minTouchPx:44,action:'owner-review-required'},{id:'first-edit.back',name:'Go back',shortcut:'Escape or Back',minTouchPx:44,action:'navigation-only'}]);
  const backTarget:FirstEditStage=stage==='review'?'preview':stage==='preview'?'choose':stage==='choose'?'discover':'discover';
  const candidateHelp=input.help?.visible&&input.help.runnable===false?input.help.explanation:CLEAR_HELP;
  const helpText=!SECRET.test(candidateHelp)&&candidateHelp.length<=600?candidateHelp:CLEAR_HELP;
  // Never copy QR contents from any source; the Wave 4 static accessible name is public copy.
  return {schema:'vivim.ui-first-edit/1',stage,heading:stage==='cancelled'?'Customization cancelled':'Customize workspace',
    controls,focusOrder:controls.map(x=>x.id),firstFocusId:controls[0]?.id??'first-edit.heading',backTarget,
    canRequestPublish:false,hostEffectAllowed:false,ownerReviewRequired:true,layoutUndoOnly:true,applied:false,
    effectInvoked:false,helpText,qrAccessibleName:'Pair using the existing VIVIM Android app. The code expires.'};
}
/** Navigation does not publish, grant, dispatch Host, or persist a second journey store. */
export function transitionFirstEdit(view:FirstEditView,event:FirstEditEvent):FirstEditStage {
  if(event==='cancel')return 'cancelled';
  if(event==='back'||event==='escape')return view.backTarget;
  if(event==='request-publish')return view.stage; // outside Lane C; existing owner-reviewed CAS only
  if(view.stage==='discover'&&event==='open')return 'choose';
  if(view.stage==='choose'&&event==='choose-template')return 'preview';
  if(view.stage==='preview'&&event==='show-preview')return 'review';
  return view.stage;
}
