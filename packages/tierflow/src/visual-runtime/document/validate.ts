/** Closed, total-ish bounded JSON validator: returns safe refusal rather than partial UI. */
import {
  UI_DOCUMENT_LIMITS as L, UI_DOCUMENT_NODE_TYPES as NODE_TYPES,
  UI_DOCUMENT_SCHEMA, type UiDocument, type UiNodeType, type UiActionReference,
} from './schema.ts';

export type UiDocumentFailureCode =
  | 'UNSUPPORTED_SCHEMA' | 'INVALID_DOCUMENT' | 'UNSAFE_VALUE' | 'LIMIT_EXCEEDED'
  | 'DUPLICATE_ID' | 'MISSING_REFERENCE' | 'CYCLE' | 'UNBOUND_ACTION'
  | 'PRIVATE_CONTENT' | 'UNKNOWN_COMPONENT';
export interface UiDocumentDiagnostic {
  readonly code: UiDocumentFailureCode;
  readonly path: string;
  readonly message: string;
}
export type UiDocumentValidation =
  | { readonly ok: true; readonly readOnly: false; readonly document: UiDocument; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly readOnly: true; readonly document: null; readonly diagnostics: readonly UiDocumentDiagnostic[];
      readonly unavailable: { readonly reason: UiDocumentFailureCode; readonly label: string } };
export interface UiDocumentValidationOptions {
  /** Explicit fixture catalog only, not a grant or runtime action authorizer. */
  readonly knownActions?: readonly UiActionReference[];
}
const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
const FORBIDDEN = /<\s*\/?[a-z!]|javascript:|data:|vbscript:|https?:\/\/|www\.|(?:onerror|onclick|onload)\s*=|\beval\s*\(|\bFunction\s*\(|=>|document\.(?:cookie|location)|window\.(?:location|open)/i;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const RECORD = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const own = (v: Record<string, unknown>, k: string): unknown => v[k];
const id = (v: unknown): v is string => typeof v === 'string' && ID.test(v) && !DANGEROUS_KEYS.has(v);
const integer = (v: unknown, min: number, max: number): v is number => Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
const oneOf = (v: unknown, xs: readonly string[]): boolean => typeof v === 'string' && xs.includes(v);

class Rejected extends Error {
  readonly code: UiDocumentFailureCode;
  readonly path: string;
  constructor(code: UiDocumentFailureCode, path: string, message: string) { super(message); this.code=code; this.path=path; }
}
function reject(code: UiDocumentFailureCode, path: string, message: string): never { throw new Rejected(code, path, message); }
function record(v: unknown, path: string, allowed: readonly string[]): Record<string, unknown> {
  if (!RECORD(v)) reject('INVALID_DOCUMENT', path, 'Expected a plain record');
  for (const key of Object.keys(v)) {
    if (DANGEROUS_KEYS.has(key) || !allowed.includes(key)) reject('UNSAFE_VALUE', `${path}.${key}`, 'Unrecognized or unsafe field');
  }
  return v;
}
function requiredId(v: unknown, path: string): string {
  if (!id(v)) reject('INVALID_DOCUMENT', path, 'Expected a stable opaque identifier');
  return v;
}
function text(v: unknown, path: string, max: number = L.text): string {
  if (typeof v !== 'string' || !v.trim() || v.length > max || FORBIDDEN.test(v) || /[\u0000-\u001f\u007f]/.test(v))
    reject('UNSAFE_VALUE', path, 'Unsafe or oversized text');
  return v;
}
function list(v: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(v) || v.length > max) reject('LIMIT_EXCEEDED', path, 'Array missing or beyond limit');
  return v;
}
function sizeConstraint(v: unknown, path: string): void {
  const x = record(v, path, ['minWidth', 'maxWidth', 'columns', 'gap']);
  if (x.minWidth !== undefined && !integer(x.minWidth, 0, 4096)) reject('INVALID_DOCUMENT', `${path}.minWidth`, 'Invalid minimum');
  if (x.maxWidth !== undefined && x.maxWidth !== null && !integer(x.maxWidth, 0, 4096)) reject('INVALID_DOCUMENT', `${path}.maxWidth`, 'Invalid maximum');
  if (typeof x.minWidth === 'number' && typeof x.maxWidth === 'number' && x.maxWidth < x.minWidth) reject('INVALID_DOCUMENT', path, 'Contradictory width constraints');
  if (x.columns !== undefined && !integer(x.columns, 1, 12)) reject('INVALID_DOCUMENT', `${path}.columns`, 'Invalid column count');
  if (x.gap !== undefined && !oneOf(x.gap, ['sm', 'md', 'lg'])) reject('INVALID_DOCUMENT', `${path}.gap`, 'Invalid gap');
}
function props(type: UiNodeType, p: unknown, path: string): void {
  const allowed = type === 'stack' ? ['direction','gap'] : type === 'grid' ? ['columns','gap']
    : type === 'text' ? ['value','variant'] : type === 'button' ? ['label']
    : ['card','profile-card','project-card'].includes(type) ? ['title','description'] : ['title','items'];
  const x = record(p, path, allowed);
  if (type === 'stack') {
    if (x.direction !== undefined && !oneOf(x.direction, ['vertical','horizontal'])) reject('INVALID_DOCUMENT', `${path}.direction`, 'Invalid direction');
    if (x.gap !== undefined && !oneOf(x.gap, ['sm','md','lg'])) reject('INVALID_DOCUMENT', `${path}.gap`, 'Invalid gap');
  } else if (type === 'grid') {
    if (x.columns !== undefined && !integer(x.columns,1,4)) reject('INVALID_DOCUMENT', `${path}.columns`, 'Invalid columns');
    if (x.gap !== undefined && !oneOf(x.gap, ['sm','md','lg'])) reject('INVALID_DOCUMENT', `${path}.gap`, 'Invalid gap');
  } else if (type === 'text') {
    text(x.value, `${path}.value`);
    if (x.variant !== undefined && !oneOf(x.variant,['body','heading','muted'])) reject('INVALID_DOCUMENT',`${path}.variant`,'Invalid variant');
  } else if (type === 'button') {
    text(x.label, `${path}.label`, 80);
  } else if (['card','profile-card','project-card'].includes(type)) {
    text(x.title,`${path}.title`,80);
    if (x.description !== undefined) text(x.description,`${path}.description`);
  } else {
    text(x.title,`${path}.title`,80);
    for (const [i,item] of list(x.items,`${path}.items`,L.items).entries()) {
      const entry = record(item,`${path}.items[${i}]`,type==='chart'?['label','value']:['label','detail']);
      text(entry.label,`${path}.items[${i}].label`,80);
      if (type === 'chart') {
        if (typeof entry.value !== 'number' || !Number.isFinite(entry.value) || Math.abs(entry.value)>1e9)
          reject('INVALID_DOCUMENT',`${path}.items[${i}].value`,'Invalid chart value');
      } else if (entry.detail !== undefined) text(entry.detail,`${path}.items[${i}].detail`,180);
    }
  }
}
/** Copies hostile data to plain JSON with a bounded, accessor-free and cycle-free traversal. */
function safeJson(source: unknown): unknown {
  let visits = 0;
  const active = new WeakSet<object>();
  const copy = (value: unknown, depth: number): unknown => {
    if (++visits > 5000 || depth > 24) reject('LIMIT_EXCEEDED','$','JSON complexity limit');
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'string') { if (value.length > L.bytes) reject('LIMIT_EXCEEDED','$','String too long'); return value; }
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'object') reject('UNSAFE_VALUE','$','Non-JSON value');
    if (active.has(value)) reject('CYCLE','$','Cyclic source');
    if (!Array.isArray(value) && !RECORD(value)) reject('UNSAFE_VALUE','$','Non-plain JSON object');
    if (Reflect.ownKeys(value).some(key => typeof key !== 'string')) reject('UNSAFE_VALUE','$','Symbol field');
    active.add(value);
    let result: unknown;
    if (Array.isArray(value)) {
      if (value.length > 512) reject('LIMIT_EXCEEDED','$','Array too large');
      const arr: unknown[]=[];
      const descriptors=Object.getOwnPropertyDescriptors(value);
      for(let index=0;index<value.length;index++){
        const descriptor=descriptors[String(index)];
        if(!descriptor || !('value' in descriptor))reject('UNSAFE_VALUE','$','Sparse/accessor array');
        arr.push(copy(descriptor.value,depth+1));
      }
      result=arr;
    } else {
      const keys = Object.keys(value);
      if (keys.length > 128) reject('LIMIT_EXCEEDED','$','Too many fields');
      const output: Record<string, unknown> = Object.create(null);
      const descriptors = Object.getOwnPropertyDescriptors(value);
      for (const key of keys) {
        if (DANGEROUS_KEYS.has(key) || !('value' in descriptors[key]!)) reject('UNSAFE_VALUE','$','Dangerous or accessor field');
        output[key] = copy(descriptors[key]!.value,depth+1);
      }
      result = output;
    }
    active.delete(value);
    return result;
  };
  const value = copy(source, 0);
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > L.bytes) reject('LIMIT_EXCEEDED','$','Document exceeds byte limit');
  return value;
}
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const entry of Object.values(value)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
}
function inspect(input: unknown, options: UiDocumentValidationOptions): UiDocument {
  const d = record(safeJson(input),'$',['schema','documentId','scope','revision','rootId','nodes','bindings','views']);
  if (d.schema !== UI_DOCUMENT_SCHEMA) reject('UNSUPPORTED_SCHEMA','$.schema','Unknown document schema; read only');
  requiredId(d.documentId,'$.documentId');
  const scope = record(d.scope,'$.scope',['ownerRef','workspaceRef']);
  requiredId(scope.ownerRef,'$.scope.ownerRef'); requiredId(scope.workspaceRef,'$.scope.workspaceRef');
  if (!integer(d.revision,0,1e9)) reject('INVALID_DOCUMENT','$.revision','Invalid revision');
  const root = requiredId(d.rootId,'$.rootId');
  const nodes = list(d.nodes,'$.nodes',L.nodes);
  if (nodes.length===0) reject('INVALID_DOCUMENT','$.nodes','Missing root node');
  const knownActions = new Set((options.knownActions??[]).map(a => `${a.id}@${a.version}`));
  const nodeById = new Map<string,{children: readonly string[], type: UiNodeType, role: string}>();
  const bindingRefs = new Map<string,string[]>();
  const focus = new Set<number>();
  for (const [i,n] of nodes.entries()) {
    const path = `$.nodes[${i}]`;
    const x = record(n,path,['id','type','children','props','layout','a11y','bindingRefs','actionRefs']);
    const nodeId = requiredId(x.id,`${path}.id`);
    if (nodeById.has(nodeId)) reject('DUPLICATE_ID',`${path}.id`,'Duplicate node identifier');
    if (!oneOf(x.type,NODE_TYPES)) reject('UNKNOWN_COMPONENT',`${path}.type`,'Unknown component, read only');
    const kind = x.type as UiNodeType;
    props(kind,x.props,`${path}.props`);
    const children = list(x.children,`${path}.children`,L.children).map((v,j)=>requiredId(v,`${path}.children[${j}]`));
    if (new Set(children).size !== children.length) reject('DUPLICATE_ID',`${path}.children`,'Duplicate child');
    if (children.length && !['stack','grid','card'].includes(kind)) reject('INVALID_DOCUMENT',`${path}.children`,'Leaf cannot have children');
    if (x.layout !== undefined) {
      const l = record(x.layout,`${path}.layout`,['minWidth','maxWidth','columns','gap','phone','desktop']);
      sizeConstraint(Object.fromEntries(Object.entries(l).filter(([key])=>!['phone','desktop'].includes(key))),`${path}.layout`);
      if (l.phone!==undefined) sizeConstraint(l.phone,`${path}.layout.phone`);
      if (l.desktop!==undefined) sizeConstraint(l.desktop,`${path}.layout.desktop`);
    }
    const a = record(x.a11y,`${path}.a11y`,['role','name','description','focusOrder','live']);
    if (!oneOf(a.role,['main','region','group','heading','text','button','list','listitem','status'])) reject('INVALID_DOCUMENT',`${path}.a11y.role`,'Unknown role');
    text(a.name,`${path}.a11y.name`,120);
    if (a.description!==undefined) text(a.description,`${path}.a11y.description`);
    if (a.live!==undefined && !oneOf(a.live,['off','polite'])) reject('INVALID_DOCUMENT',`${path}.a11y.live`,'Unsafe live mode');
    if (a.focusOrder!==undefined) {
      if (!integer(a.focusOrder,0,L.nodes)) reject('INVALID_DOCUMENT',`${path}.a11y.focusOrder`,'Invalid focus order');
      if (focus.has(a.focusOrder as number)) reject('DUPLICATE_ID',`${path}.a11y.focusOrder`,'Focus order duplicated');
      focus.add(a.focusOrder as number);
    }
    if (kind!=='button' && a.role==='button') reject('INVALID_DOCUMENT',`${path}.a11y.role`,'Passive component cannot masquerade as button');
    if (kind==='button' && (a.role!=='button' || a.name!== (x.props as Record<string,unknown>).label || a.focusOrder===undefined))
      reject('INVALID_DOCUMENT',`${path}.a11y`,'Button needs matched label and explicit focus');
    const refs = x.bindingRefs===undefined?[]:list(x.bindingRefs,`${path}.bindingRefs`,L.bindings).map((v,j)=>requiredId(v,`${path}.bindingRefs[${j}]`));
    if (new Set(refs).size!==refs.length) reject('DUPLICATE_ID',`${path}.bindingRefs`,'Duplicate binding reference');
    bindingRefs.set(nodeId,refs);
    const actions = x.actionRefs===undefined?[]:list(x.actionRefs,`${path}.actionRefs`,L.actionRefs);
    if (kind==='button' && actions.length===0) reject('UNBOUND_ACTION',`${path}.actionRefs`,'Button has no registered action');
    if (kind!=='button' && actions.length) reject('UNBOUND_ACTION',`${path}.actionRefs`,'Non-button action is unsupported');
    const actionSeen=new Set<string>();
    for (const [j,raw] of actions.entries()) {
      const ref = record(raw,`${path}.actionRefs[${j}]`,['id','version']);
      const act = `${requiredId(ref.id,`${path}.actionRefs[${j}].id`)}@${ref.version}`;
      if (!integer(ref.version,1,1e9) || !knownActions.has(act)) reject('UNBOUND_ACTION',`${path}.actionRefs[${j}]`,'Action reference not present in trusted fixture catalog');
      if (actionSeen.has(act)) reject('DUPLICATE_ID',`${path}.actionRefs`,'Duplicate action');
      actionSeen.add(act);
    }
    nodeById.set(nodeId,{children, type:kind, role:a.role as string});
  }
  if (!nodeById.has(root)) reject('MISSING_REFERENCE','$.rootId','Root not found');
  if(nodeById.get(root)!.type!=='stack'||nodeById.get(root)!.role!=='main')reject('INVALID_DOCUMENT','$.rootId','Root must be accessible stack landmark');
  const parents = new Map<string,number>();
  for (const [id,n] of nodeById) for (const child of n.children) {
    if (!nodeById.has(child)) reject('MISSING_REFERENCE',`$.nodes.${id}.children`,'Child not found');
    parents.set(child,(parents.get(child)??0)+1);
    if (parents.get(child)!>1) reject('DUPLICATE_ID',`$.nodes.${id}.children`,'Multiple parents');
  }
  if (parents.has(root)) reject('CYCLE','$.rootId','Root cannot have a parent');
  const visited = new Set<string>();const active = new Set<string>();
  const walk = (id: string,depth: number): void => {
    if (depth>L.depth) reject('LIMIT_EXCEEDED','$.nodes','Hierarchy exceeds depth');
    if (active.has(id)) reject('CYCLE','$.nodes','Hierarchy cycle');
    active.add(id);visited.add(id);
    for (const child of nodeById.get(id)!.children) walk(child,depth+1);
    active.delete(id);
  };walk(root,1);
  if (visited.size!==nodeById.size) {
    // An unreachable component may be part of a detached cycle. Both are refused read-only.
    reject('CYCLE','$.nodes','Detached or cyclic hierarchy');
  }
  const bindings = list(d.bindings,'$.bindings',L.bindings);
  const bindingIds = new Set<string>();
  for (const [i,b] of bindings.entries()) {
    const p=`$.bindings[${i}]`, x=record(b,p,['id','version','nodeId','field','knowledgeRef','provenanceRef','readScope','availability']);
    const bid=requiredId(x.id,`${p}.id`);
    if (bindingIds.has(bid)) reject('DUPLICATE_ID',`${p}.id`,'Binding duplicated');
    bindingIds.add(bid);
    if (!integer(x.version,1,1e9) || !oneOf(x.field,['value','title','description','items','summary','status']) || x.readScope!=='owner' ||
      !oneOf(x.availability,['present','missing','stale','redacted','revoked','deleted','unknown','unavailable'])) reject('INVALID_DOCUMENT',p,'Malformed inert binding');
    requiredId(x.knowledgeRef,`${p}.knowledgeRef`); requiredId(x.provenanceRef,`${p}.provenanceRef`);
    const target=requiredId(x.nodeId,`${p}.nodeId`);
    if (!nodeById.has(target) || !bindingRefs.get(target)?.includes(bid)) reject('MISSING_REFERENCE',p,'Binding lacks same-node declaration');
  }
  for(const [node,refs] of bindingRefs) for(const ref of refs) if(!bindingIds.has(ref)) reject('MISSING_REFERENCE',`$.nodes.${node}.bindingRefs`,'Binding not registered');
  const views = list(d.views,'$.views',L.views);
  const viewById=new Map<string, Record<string,unknown>>();let has2d=false;
  for(const [i,v] of views.entries()) {
    const p=`$.views[${i}]`, x=record(v,p, v!==null && typeof v==='object' && (v as Record<string,unknown>).kind==='spatial'
      ? ['id','version','kind','fallbackViewId','sourceRef'] : ['id','version','kind','viewport']);
    const vid=requiredId(x.id,`${p}.id`);
    if(viewById.has(vid))reject('DUPLICATE_ID',`${p}.id`,'View duplicated');
    if(!integer(x.version,1,1e9))reject('INVALID_DOCUMENT',`${p}.version`,'Invalid view version');
    if(x.kind==='2d') {if(!oneOf(x.viewport,['phone','desktop']))reject('INVALID_DOCUMENT',p,'Invalid viewport');has2d=true;}
    else if(x.kind==='spatial') {requiredId(x.fallbackViewId,`${p}.fallbackViewId`);requiredId(x.sourceRef,`${p}.sourceRef`);}
    else reject('INVALID_DOCUMENT',p,'Invalid view kind');
    viewById.set(vid,x);
  }
  if(!has2d)reject('INVALID_DOCUMENT','$.views','Accessible 2D fallback required');
  for(const [vid,v] of viewById) if(v.kind==='spatial'){
    const fallback=viewById.get(v.fallbackViewId as string);
    if(!fallback || fallback.kind!=='2d' || vid===v.fallbackViewId) reject('MISSING_REFERENCE',`$.views.${vid}`,'Spatial view lacks 2D fallback');
  }
  return deepFreeze(d as unknown as UiDocument);
}
export function validateUiDocument(input: unknown, options: UiDocumentValidationOptions = {}): UiDocumentValidation {
  try {return {ok:true,readOnly:false,document:inspect(input,options),diagnostics:[]};}
  catch(error) {
    const failure=error instanceof Rejected ? error : new Rejected('UNSAFE_VALUE','$','Input could not be safely examined');
    return {ok:false,readOnly:true,document:null,diagnostics:[{code:failure.code,path:failure.path,message:failure.message}],
      unavailable:{reason:failure.code,label:'This UI cannot be safely displayed or edited.'}};
  }
}
/** Refusal is a value at boundaries; this optional helper throws only for trusted build fixtures. */
export function parseUiDocument(input: unknown, options: UiDocumentValidationOptions = {}): UiDocument {
  const result=validateUiDocument(input,options);
  if(!result.ok)throw new Error(`${result.unavailable.reason}: ${result.diagnostics[0]?.path}`);
  return result.document;
}

/** Importer-only defensive copy; never interpret or render the returned source directly. */
export function cloneInertJson(input: unknown): unknown { return deepFreeze(safeJson(input)); }
