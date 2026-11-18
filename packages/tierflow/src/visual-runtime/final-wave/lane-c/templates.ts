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
      ? [{id:body,type:'text' as const,props:{value:spec.unavailableCopy,variant:'body' as const},children:[],a11y:{role:'text' as const,name:spec.unavailableCopy}}]
      : spec.bodyKind==='card'
      ? [{id:body,type:'card' as const,props:{title:spec.unavailableCopy},children:[],a11y:{role:'group' as const,name:spec.unavailableCopy}}]
      : [{id:body,type:spec.bodyKind,props:{title:spec.unavailableCopy,items:[]},children:[],a11y:{role:'list' as const,name:spec.unavailableCopy}}]),
  ];
  return nodes;
}
/** Previews only; caller MUST run the real canonical validator + mapper before displaying the result. */
export function planTemplateCandidate(raw:unknown, base:UiDocument, trusted:TemplateTrustedScope):TemplatePlan {
  if (!plain(raw)||Object.keys(raw).length!==CANDIDATE_KEYS.length||Object.keys(raw).some(k=>!CANDIDATE_KEYS.includes(k))) return denied('BAD_CANDIDATE');
  if (raw.schema!=='vivim.ui-template-candidate/1'||raw.authority!=='candidate-only'||!['owner','oracle'].includes(String(raw.proposedBy))) return denied('BAD_CANDIDATE');
  for(const k of CANDIDATE_KEYS.filter(k=>!['schema','baseRevision','proposedBy','authority'].includes(k))) if(!pin(raw[k]))return denied('BAD_CANDIDATE');
  if(!ref(raw.documentId)||!ref(raw.targetNodeId)||!ref(raw.instanceId)||!ref(raw.ownerRef)||!ref(raw.worldRef)||!ref(raw.workspaceRef)||!ref(raw.deviceRef)||!ref(raw.sessionRef))return denied('BAD_CANDIDATE');
  if (raw.instanceId.length>60||!Number.isSafeInteger(raw.baseRevision)||Number(raw.baseRevision)<0)return denied('BAD_CANDIDATE');
  if (raw.catalogDigest!==TEMPLATE_CATALOG_DIGEST||raw.catalogDigest!==trusted.catalogDigest||raw.baseRevision!==base.revision||raw.documentId!==base.documentId)return denied('STALE_PIN');
  for(const k of ['ownerRef','worldRef','workspaceRef','deviceRef','sessionRef','policyRevision'] as const)if(raw[k]!==trusted[k])return denied('FOREIGN_SCOPE');
  if(base.scope.ownerRef!==trusted.ownerRef||base.scope.workspaceRef!==trusted.workspaceRef)return denied('FOREIGN_SCOPE');
  const spec=findTemplate(String(raw.templateId));
  if(!spec||raw.templateVersion!==spec.version)return denied('UNKNOWN_TEMPLATE');
  const parent=base.nodes.find(n=>n.id===raw.targetNodeId);
  if(!parent||parent.id!==base.rootId||parent.type!=='stack'||parent.children.length>=24)return denied('INVALID_PARENT');
  const ids=spec.nodeKeys.map(k=>`${raw.instanceId}.${k}`);
  if(ids.some(id=>!ref(id)||base.nodes.some(n=>n.id===id)))return denied('COLLISION');
  if(base.nodes.length+3>64)return denied('BUDGET');
  const nodes=createTemplateNodes(spec.templateId,String(raw.instanceId));
  if(!nodes)return denied('BAD_CANDIDATE');
  const region=ids[0];
  // JSON data-only copy, no prototype shortcuts, callbacks, KB values, actions or new writer.
  const draft:UiDocument={...base,nodes:base.nodes.map(n=>n.id===parent.id?{...n,children:[...n.children,region]}:n).concat(nodes)};
  return {ok:true,draft,templateId:spec.templateId,baseRevision:base.revision,publish:'owner-review-required',effectInvoked:false};
}
