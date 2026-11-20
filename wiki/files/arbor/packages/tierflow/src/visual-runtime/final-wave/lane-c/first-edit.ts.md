# File: packages/tierflow/src/visual-runtime/final-wave/lane-c/first-edit.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/lane-c/first-edit.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4682 B |
| Lines | 48 |
| Hash | eeb713810e01 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FirstEditStage | type | 5 | yes | export type FirstEditStage = &#39;discover&#39;\|&#39;choose&#39;\|&#39;preview&#39;\|&#39;review&#39;\|&#39;cancelled&#39;; |
| FirstEditInput | type | 6 | yes | export type FirstEditInput = Readonly&lt;{stage:FirstEditStage; shell:&#39;desktop&#39;\|&#39;android&#39;;viewport:320\|360\|1280; |
| FirstEditEvent | type | 8 | yes | export type FirstEditEvent = &#39;open&#39;\|&#39;choose-template&#39;\|&#39;show-preview&#39;\|&#39;request-review&#39;\|&#39;back&#39;\|&#39;escape&#39;\|&#39;cancel&#39;\|&#39;request-publish&#39;; |
| FirstEditControl | interface | 9 | yes | export interface FirstEditControl {readonly id:string;readonly name:string;readonly shortcut:string;readonly minTouchPx:44;readonly action:&#39;navigation-only&#39;\|&#39;owner-review-required&#39;;} |
| FirstEditView | interface | 10 | yes | export interface FirstEditView {readonly schema:&#39;vivim.ui-first-edit/1&#39;;readonly stage:FirstEditStage; readonly heading:string; |
| CLEAR_HELP | const | 15 | no | const CLEAR_HELP=&#39;Review the preview, permissions and changed layout. Nothing has been published.&#39;; |
| SECRET | const | 16 | no | const SECRET=/(?:[a-f0-9]{64}\|[A-Za-z0-9_-]{42,}\|https?:\\/\\/\|javascript:\|data:\|(?:bearer\|token\|secret\|password)\\s*[:=]\|&lt;\|&gt;)/i; |
| projectFirstEdit | function | 17 | yes | export function projectFirstEdit(input:FirstEditInput):FirstEditView { |
| stage | variable | 20 | no | let stage:FirstEditStage=input.stage; |
| controls | const | 23 | no | const controls:FirstEditControl[]=(stage===&#39;cancelled&#39;?[]:stage===&#39;discover&#39;? [{id:&#39;first-edit.open&#39;,name:&#39;Customize workspace&#39;,shortcut:&#39;Enter or Space&#39;,minTouchPx:44,action:&#39;navigation-only&#39;}]: sta… |
| backTarget | const | 30 | no | const backTarget:FirstEditStage=stage===&#39;review&#39;?&#39;preview&#39;:stage===&#39;preview&#39;?&#39;choose&#39;:stage===&#39;choose&#39;?&#39;discover&#39;:&#39;discover&#39;; |
| candidateHelp | const | 31 | no | const candidateHelp=input.help?.visible&amp;&amp;input.help.runnable===false?input.help.explanation:CLEAR_HELP; |
| helpText | const | 32 | no | const helpText=!SECRET.test(candidateHelp)&amp;&amp;candidateHelp.length&lt;=600?candidateHelp:CLEAR_HELP; |
| transitionFirstEdit | function | 40 | yes | export function transitionFirstEdit(view:FirstEditView,event:FirstEditEvent):FirstEditStage { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../experience/wave4-onboarding-resume.ts | import | 2 | [packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts](../../experience/wave4-onboarding-resume.ts.md) |
| ../../experience/help.ts | import | 3 | [packages/tierflow/src/visual-runtime/experience/help.ts](../../experience/help.ts.md) |
| ./adapters.ts | import | 4 | [packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts](./adapters.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../integration/master.ts.md) | ../lane-c/first-edit.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts](./adapters.ts.md) | ./first-edit.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/first-edit.test.ts](../../../../tests/visual-runtime/final-wave/lane-c/first-edit.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-c/first-edit.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/first-edit.test.ts](../../../../tests/visual-runtime/final-wave/lane-c/first-edit.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-c/first-edit.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
