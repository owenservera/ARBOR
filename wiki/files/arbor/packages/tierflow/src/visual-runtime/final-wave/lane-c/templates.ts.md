# File: packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts |
| Language | TypeScript |
| Kind | source |
| Size | 10883 B |
| Lines | 111 |
| Hash | 86f69a96c22d |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TEMPLATE_CATALOG_SCHEMA | const | 4 | yes | export const TEMPLATE_CATALOG_SCHEMA = &#39;vivim.ui-template-catalog/1&#39; as const; |
| TEMPLATE_CATALOG_VERSION | const | 5 | yes | export const TEMPLATE_CATALOG_VERSION = &#39;1.0.0&#39; as const; |
| TEMPLATE_CATALOG_DIGEST | const | 7 | yes | export const TEMPLATE_CATALOG_DIGEST = &#39;sha256:203534e9ff2c49293c4f42c918d31b3ef9cb4210e0d4ca866bc79ccbe3518974&#39; as const; |
| TemplateFamily | type | 8 | yes | export type TemplateFamily = &#39;projects&#39;\|&#39;blockers&#39;\|&#39;activity&#39;\|&#39;tasks&#39;\|&#39;agents&#39;\|&#39;provenance&#39;\|&#39;security&#39;\|&#39;help&#39;\|&#39;editing&#39;; |
| BodyKind | type | 9 | no | type BodyKind = &#39;card&#39;\|&#39;collection&#39;\|&#39;timeline&#39;\|&#39;text&#39;; |
| TemplateSpec | interface | 10 | yes | export interface TemplateSpec { |
| specs | const | 24 | no | const specs: readonly Omit&lt;TemplateSpec,&#39;version&#39;\|&#39;nodeKeys&#39;\|&#39;privacy&#39;\|&#39;executable&#39;&gt;[] = [ |
| TEMPLATE_CATALOG | const | 38 | yes | export const TEMPLATE_CATALOG: readonly TemplateSpec[] = Object.freeze(specs.map(s =&gt; Object.freeze({ ...s,version:&#39;1.0.0&#39; as const,nodeKeys:Object.freeze([&#39;region&#39;,&#39;heading&#39;,&#39;body&#39;] as const), priva… |
| TemplateTrustedScope | interface | 43 | yes | export interface TemplateTrustedScope { |
| TemplateCandidate | interface | 48 | yes | export interface TemplateCandidate { |
| TemplateFailure | type | 57 | yes | export type TemplateFailure = &#39;BAD_CANDIDATE&#39;\|&#39;STALE_PIN&#39;\|&#39;FOREIGN_SCOPE&#39;\|&#39;UNKNOWN_TEMPLATE&#39;\|&#39;INVALID_PARENT&#39;\|&#39;COLLISION&#39;\|&#39;BUDGET&#39;; |
| TemplatePlan | type | 58 | yes | export type TemplatePlan = |
| REF | const | 61 | no | const REF = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| UNSAFE | const | 62 | no | const UNSAFE = /(?:&lt;\\s*\\/?\|https?:\\/\\/\|javascript:\|data:\|\\bon\\w+\\s*=\|\\b(?:bearer\|token\|password\|secret)\\s*[:=]\|[\\u0000-\\u001f\\u007f])/i; |
| CANDIDATE_KEYS | const | 63 | no | const CANDIDATE_KEYS = Object.freeze([&#39;schema&#39;,&#39;templateId&#39;,&#39;templateVersion&#39;,&#39;catalogDigest&#39;,&#39;documentId&#39;,&#39;instanceId&#39;,&#39;targetNodeId&#39;,&#39;ownerRef&#39;,&#39;worldRef&#39;,&#39;workspaceRef&#39;,&#39;deviceRef&#39;,&#39;sessionRef&#39;,&#39;p… |
| plain | function | 64 | no | function plain(x: unknown): x is Record&lt;string,unknown&gt; { return x!==null&amp;&amp;typeof x===&#39;object&#39;&amp;&amp;!Array.isArray(x)&amp;&amp;(Object.getPrototypeOf(x)===Object.prototype\|\|Object.getPrototypeOf(x)===null); } |
| ref | function | 65 | no | function ref(x:unknown): x is string {return typeof x===&#39;string&#39;&amp;&amp;REF.test(x)&amp;&amp;![&#39;__proto__&#39;,&#39;constructor&#39;,&#39;prototype&#39;].includes(x);} |
| pin | function | 66 | no | function pin(x:unknown): x is string {return typeof x===&#39;string&#39;&amp;&amp;x.length&gt;0&amp;&amp;x.length&lt;=100&amp;&amp;!UNSAFE.test(x);} |
| denied | function | 67 | no | function denied(code:TemplateFailure):TemplatePlan {return {ok:false,code,draft:null,effectInvoked:false};} |
| findTemplate | function | 68 | yes | export function findTemplate(id:string):TemplateSpec\|undefined {return TEMPLATE_CATALOG.find(x=&gt;x.templateId===id);} |
| createTemplateNodes | function | 71 | yes | export function createTemplateNodes(templateId:string,instanceId:string):UiDocumentNode[]\|null { |
| spec | const | 72 | no | const spec=findTemplate(templateId); |
| ids | const | 74 | no | const ids=spec.nodeKeys.map(k=&gt;`${instanceId}.${k}`); |
| nodes | const | 77 | no | const nodes:UiDocumentNode[]=[ |
| planTemplateCandidate | function | 89 | yes | export function planTemplateCandidate(raw:unknown, base:UiDocument, trusted:TemplateTrustedScope):TemplatePlan { |
| spec | const | 98 | no | const spec=findTemplate(String(raw.templateId)); |
| parent | const | 100 | no | const parent=base.nodes.find(n=&gt;n.id===raw.targetNodeId); |
| ids | const | 102 | no | const ids=spec.nodeKeys.map(k=&gt;`${raw.instanceId}.${k}`); |
| nodes | const | 105 | no | const nodes=createTemplateNodes(spec.templateId,String(raw.instanceId)); |
| region | const | 107 | no | const region=ids[0]; |
| draft | const | 109 | no | const draft:UiDocument={...base,nodes:base.nodes.map(n=&gt;n.id===parent.id?{...n,children:[...n.children,region]}:n).concat(nodes)}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../document/schema.ts | import | 2 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../document/schema.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../integration/master.ts.md) | ../lane-c/templates.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts](./adapters.ts.md) | ./templates.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-c/templates.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/adapters.test.ts](../../../../tests/visual-runtime/final-wave/lane-c/adapters.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-c/templates.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/templates.test.ts](../../../../tests/visual-runtime/final-wave/lane-c/templates.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-c/templates.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Final Wave Lane C: immutable metadata recipes; never a registry, store, publisher or executor. */
import type { UiDocument, UiDocumentNode, UiNodeType } from '../../document/schema.ts';

export const TEMPLATE_CATALOG_SCHEMA = 'vivim.ui-template-catalog/1' as const;
export const TEMPLATE_CATALOG_VERSION = '1.0.0' as const;
/** Release pin, not a verified signature. The integrator must authenticate its catalog source. */
export const TEMPLATE_CATALOG_DIGEST = 'sha256:203534e9ff2c49293c4f42c918d31b3ef9cb4210e0d4ca866bc79ccbe3518974' as const;
export type TemplateFamily = 'projects'|'blockers'|'activity'|'tasks'|'agents'|'provenance'|'security'|'help'|'editing';
type BodyKind = 'card'|'collection'|'timeline'|'text';
export interface TemplateSpec {
  readonly templateId: string;
  readonly version: '1.0.0';
  readonly family: TemplateFamily;
  readonly title: string;
  readonly summary: string;
  readonly unavailableCopy: string;
  readonly bodyKind: BodyKind;
  readonly source: 'broker'|'host'|'none';
  readonly purpose: 'task'|'explain'|'help';
  readonly nodeKeys: readonly ['region','heading','body'];
  readonly privacy: 'deny-until-scoped';
  readonly executable: false;
}
const specs: readonly Omit<TemplateSpec,'version'|'nodeKeys'|'privacy'|'executable'>[] = [
  {templateId:'FW.PROJECTS.OVERVIEW',family:'projects',title:'Projects',summary:'Projects in your authorized workspace',unavailableCopy:'No projects available in this view',bodyKind:'collection',source:'broker',purpose:'task'},
  {templateId:'FW.PROJECT.DETAIL',family:'projects',title:'Project details',summary:'Details and source context for a selected project',unavailableCopy:'Project details unavailable in this view',bodyKind:'card',source:'broker',purpose:'explain'},
  {templateId:'FW.BLOCKERS.PRIORITY',family:'blockers',title:'Blockers',summary:'Authorized blockers with source context',unavailableCopy:'No verified blocker data available in this view',bodyKind:'collection',source:'broker',purpose:'task'},
  {templateId:'FW.TASKS.NEXT',family:'tasks',title:'Next tasks',summary:'Authorized tasks, without assumed urgency',unavailableCopy:'No authorized tasks available in this view',bodyKind:'collection',source:'broker',purpose:'task'},
  {templateId:'FW.ACTIVITY.RECENT',family:'activity',title:'Recent activity',summary:'Observed activity from allowed sources',unavailableCopy:'Activity cannot be confirmed in this view',bodyKind:'timeline',source:'broker',purpose:'explain'},
  {templateId:'FW.AGENTS.STATUS',family:'agents',title:'Agent status',summary:'Observed status, not inferred execution',unavailableCopy:'Agent status unknown in this view',bodyKind:'collection',source:'host',purpose:'explain'},
  {templateId:'FW.DECISIONS.LOG',family:'activity',title:'Decisions',summary:'Owner-confirmed decisions and provenance',unavailableCopy:'No confirmed decisions available in this view',bodyKind:'timeline',source:'broker',purpose:'explain'},
  {templateId:'FW.PROVENANCE.INSPECT',family:'provenance',title:'Provenance',summary:'Why this information is shown',unavailableCopy:'Source details unavailable to this device',bodyKind:'card',source:'broker',purpose:'explain'},
  {templateId:'FW.SECURITY.READINESS',family:'security',title:'Security readiness',summary:'Connection and permission facts from Host',unavailableCopy:'Security status not verified by the Host',bodyKind:'collection',source:'host',purpose:'explain'},
  {templateId:'FW.CONNECTION.RECOVERY',family:'security',title:'Connection recovery',summary:'Safe status and recovery guidance',unavailableCopy:'Host offline; nothing published and no automatic resend',bodyKind:'card',source:'host',purpose:'help'},
  {templateId:'FW.HELP.CONTEXT',family:'help',title:'Contextual help',summary:'What is available, why, and what to do next',unavailableCopy:'Help is unavailable in the current scope',bodyKind:'text',source:'none',purpose:'help'},
  {templateId:'FW.EDIT.FIRST',family:'editing',title:'Customize this workspace',summary:'Preview a layout change before owner review',unavailableCopy:'No layout change published; preview or cancel',bodyKind:'card',source:'none',purpose:'help'},
];
export const TEMPLATE_CATALOG: readonly TemplateSpec[] = Object.freeze(specs.map(s => Object.freeze({
  ...s,version:'1.0.0' as const,nodeKeys:Object.freeze(['region','heading','body'] as const),
  privacy:'deny-until-scoped' as const,executable:false as const,
})));

export interface TemplateTrustedScope {
  readonly ownerRef: string; readonly worldRef: string; readonly workspaceRef: string;
  readonly deviceRef: string; readonly sessionRef: string; readonly policyRevision: string;
  readonly catalogDigest: string;
}
export interface TemplateCandidate {
  readonly schema: 'vivim.ui-template-candidate/1';
  readonly templateId: string; readonly templateVersion: string; readonly catalogDigest: string;
  readonly documentId: string; readonly instanceId: string; readonly targetNodeId: string;
  readonly ownerRef: string; readonly worldRef: string; readonly workspaceRef: string;
  readonly deviceRef: string; readonly sessionRef: string; readonly policyRevision: string;
  readonly baseRevision: number; readonly proposedBy: 'owner'|'oracle';
  readonly authority: 'candidate-only';
}
export type TemplateFailure = 'BAD_CANDIDATE'|'STALE_PIN'|'FOREIGN_SCOPE'|'UNKNOWN_TEMPLATE'|'INVALID_PARENT'|'COLLISION'|'BUDGET';
export type TemplatePlan =
  | {readonly ok:true; readonly draft:UiDocument; readonly templateId:string; readonly baseRevision:number; readonly publish:'owner-review-required'; readonly effectInvoked:false}
  | {readonly ok:false; readonly code:TemplateFailure; readonly draft:null; readonly effectInvoked:false};
const REF = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const UNSAFE = /(?:<\s*\/?|https?:\/\/|javascript:|data:|\bon\w+\s*=|\b(?:bearer|token|password|secret)\s*[:=]|[\u0000-\u001f\u007f])/i;
const CANDIDATE_KEYS = Object.freeze(['schema','templateId','templateVersion','catalogDigest','documentId','instanceId','targetNodeId','ownerRef','worldRef','workspaceRef','deviceRef','sessionRef','policyRevision','baseRevision','proposedBy','authority']);
function plain(x: unknown): x is Record<string,unknown> { return x!==null&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null); }
function ref(x:unknown): x is string {return typeof x==='string'&&REF.test(x)&&!['__proto__','constructor','prototype'].includes(x);}
function pin(x:unknown): x is string {return typeof x==='string'&&x.length>0&&x.length<=100&&!UNSAFE.test(x);}
function denied(code:TemplateFailure):TemplatePlan {return {ok:false,code,draft:null,effectInvoked:false};}
export function findTemplate(id:string):TemplateSpec|undefined {return TEMPLATE_CATALOG.find(x=>x.templateId===id);}
/** Compile only the catalog's inert structure, never source data or grants.
 * A live caller still needs its normal document/proposal validation and owner review. */
export function createTemplateNodes(templateId:string,instanceId:string):UiDocumentNode[]|null {
  const spec=findTemplate(templateId);
  if(!spec||!ref(instanceId)||instanceId.length>60)return null;
  const ids=spec.nodeKeys.map(k=>`${instanceId}.${k}`);
  if(ids.some(id=>!ref(id)))return null;
  const [region,heading,body]=ids as [string,string,string];
  const nodes:UiDocumentNode[]=[
    {id:region,type:'grid',props:{columns:2,gap:'md'},children:[heading,body],layout:{phone:{columns:1,gap:'sm'},desktop:{columns:2,gap:'md'}},a11y:{role:'region',name:spec.title,description:spec.summary}},
    {id:heading,type:'text',props:{value:spec.title,variant:'heading'},children:[],a11y:{role:'heading',name:spec.title}},
    ...(spec.bodyKind==='text'
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
