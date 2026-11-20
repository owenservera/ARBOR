# File: packages/tierflow/src/visual-runtime/document/validate.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/document/validate.ts |
| Language | TypeScript |
| Kind | source |
| Size | 19145 B |
| Lines | 281 |
| Hash | bf242f2325f2 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UiDocumentFailureCode | type | 7 | yes | export type UiDocumentFailureCode = |
| UiDocumentDiagnostic | interface | 11 | yes | export interface UiDocumentDiagnostic { |
| UiDocumentValidation | type | 16 | yes | export type UiDocumentValidation = |
| UiDocumentValidationOptions | interface | 20 | yes | export interface UiDocumentValidationOptions { |
| ID | const | 24 | no | const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| FORBIDDEN | const | 25 | no | const FORBIDDEN = /&lt;\\s*\\/?[a-z!]\|javascript:\|data:\|vbscript:\|https?:\\/\\/\|www\\.\|(?:onerror\|onclick\|onload)\\s*=\|\\beval\\s*\\(\|\\bFunction\\s*\\(\|=&gt;\|document\\.(?:cookie\|location)\|window\\.(?:location\|open)/i;… |
| DANGEROUS_KEYS | const | 26 | no | const DANGEROUS_KEYS = new Set([&#39;__proto__&#39;, &#39;prototype&#39;, &#39;constructor&#39;]); |
| own | function | 30 | no | const own = (v: Record&lt;string, unknown&gt;, k: string): unknown =&gt; v[k]; |
| id | function | 31 | no | const id = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; ID.test(v) &amp;&amp; !DANGEROUS_KEYS.has(v); |
| integer | function | 32 | no | const integer = (v: unknown, min: number, max: number): v is number =&gt; Number.isSafeInteger(v) &amp;&amp; (v as number) &gt;= min &amp;&amp; (v as number) &lt;= max; |
| oneOf | function | 33 | no | const oneOf = (v: unknown, xs: readonly string[]): boolean =&gt; typeof v === &#39;string&#39; &amp;&amp; xs.includes(v); |
| Rejected | class | 35 | no | class Rejected extends Error { |
| constructor | method | 38 | yes | constructor(code: UiDocumentFailureCode, path: string, message: string) { super(message); this.code=code; this.path=path; } |
| reject | function | 40 | no | function reject(code: UiDocumentFailureCode, path: string, message: string): never { throw new Rejected(code, path, message); } |
| requiredId | function | 48 | no | function requiredId(v: unknown, path: string): string { |
| text | function | 52 | no | function text(v: unknown, path: string, max: number = L.text): string { |
| list | function | 57 | no | function list(v: unknown, path: string, max: number): unknown[] { |
| sizeConstraint | function | 61 | no | function sizeConstraint(v: unknown, path: string): void { |
| x | const | 62 | no | const x = record(v, path, [&#39;minWidth&#39;, &#39;maxWidth&#39;, &#39;columns&#39;, &#39;gap&#39;]); |
| props | function | 69 | no | function props(type: UiNodeType, p: unknown, path: string): void { |
| allowed | const | 70 | no | const allowed = type === &#39;stack&#39; ? [&#39;direction&#39;,&#39;gap&#39;] : type === &#39;grid&#39; ? [&#39;columns&#39;,&#39;gap&#39;] |
| x | const | 73 | no | const x = record(p, path, allowed); |
| entry | const | 91 | no | const entry = record(item,`${path}.items[${i}]`,type===&#39;chart&#39;?[&#39;label&#39;,&#39;value&#39;]:[&#39;label&#39;,&#39;detail&#39;]); |
| safeJson | function | 101 | no | function safeJson(source: unknown): unknown { |
| visits | variable | 102 | no | let visits = 0; |
| active | const | 103 | no | const active = new WeakSet&lt;object&gt;(); |
| copy | function | 104 | no | const copy = (value: unknown, depth: number): unknown =&gt; { |
| result | variable | 114 | no | let result: unknown; |
| arr | const | 117 | no | const arr: unknown[]=[]; |
| descriptors | const | 118 | no | const descriptors=Object.getOwnPropertyDescriptors(value); |
| descriptor | const | 120 | no | const descriptor=descriptors[String(index)]; |
| keys | const | 126 | no | const keys = Object.keys(value); |
| output | const | 128 | no | const output: Record&lt;string, unknown&gt; = Object.create(null); |
| descriptors | const | 129 | no | const descriptors = Object.getOwnPropertyDescriptors(value); |
| value | const | 139 | no | const value = copy(source, 0); |
| deepFreeze | function | 143 | no | function deepFreeze&lt;T&gt;(value: T): T { |
| inspect | function | 150 | no | function inspect(input: unknown, options: UiDocumentValidationOptions): UiDocument { |
| d | const | 151 | no | const d = record(safeJson(input),&#39;$&#39;,[&#39;schema&#39;,&#39;documentId&#39;,&#39;scope&#39;,&#39;revision&#39;,&#39;rootId&#39;,&#39;nodes&#39;,&#39;bindings&#39;,&#39;views&#39;]); |
| scope | const | 154 | no | const scope = record(d.scope,&#39;$.scope&#39;,[&#39;ownerRef&#39;,&#39;workspaceRef&#39;]); |
| root | const | 157 | no | const root = requiredId(d.rootId,&#39;$.rootId&#39;); |
| nodes | const | 158 | no | const nodes = list(d.nodes,&#39;$.nodes&#39;,L.nodes); |
| knownActions | const | 160 | no | const knownActions = new Set((options.knownActions??[]).map(a =&gt; `${a.id}@${a.version}`)); |
| nodeById | const | 161 | no | const nodeById = new Map&lt;string,{children: readonly string[], type: UiNodeType, role: string}&gt;(); |
| bindingRefs | const | 162 | no | const bindingRefs = new Map&lt;string,string[]&gt;(); |
| focus | const | 163 | no | const focus = new Set&lt;number&gt;(); |
| path | const | 165 | no | const path = `$.nodes[${i}]`; |
| x | const | 166 | no | const x = record(n,path,[&#39;id&#39;,&#39;type&#39;,&#39;children&#39;,&#39;props&#39;,&#39;layout&#39;,&#39;a11y&#39;,&#39;bindingRefs&#39;,&#39;actionRefs&#39;]); |
| nodeId | const | 167 | no | const nodeId = requiredId(x.id,`${path}.id`); |
| kind | const | 170 | no | const kind = x.type as UiNodeType; |
| children | const | 172 | no | const children = list(x.children,`${path}.children`,L.children).map((v,j)=&gt;requiredId(v,`${path}.children[${j}]`)); |
| l | const | 176 | no | const l = record(x.layout,`${path}.layout`,[&#39;minWidth&#39;,&#39;maxWidth&#39;,&#39;columns&#39;,&#39;gap&#39;,&#39;phone&#39;,&#39;desktop&#39;]); |
| a | const | 181 | no | const a = record(x.a11y,`${path}.a11y`,[&#39;role&#39;,&#39;name&#39;,&#39;description&#39;,&#39;focusOrder&#39;,&#39;live&#39;]); |
| refs | const | 194 | no | const refs = x.bindingRefs===undefined?[]:list(x.bindingRefs,`${path}.bindingRefs`,L.bindings).map((v,j)=&gt;requiredId(v,`${path}.bindingRefs[${j}]`)); |
| actions | const | 197 | no | const actions = x.actionRefs===undefined?[]:list(x.actionRefs,`${path}.actionRefs`,L.actionRefs); |
| actionSeen | const | 200 | no | const actionSeen=new Set&lt;string&gt;(); |
| ref | const | 202 | no | const ref = record(raw,`${path}.actionRefs[${j}]`,[&#39;id&#39;,&#39;version&#39;]); |
| act | const | 203 | no | const act = `${requiredId(ref.id,`${path}.actionRefs[${j}].id`)}@${ref.version}`; |
| parents | const | 212 | no | const parents = new Map&lt;string,number&gt;(); |
| visited | const | 219 | no | const visited = new Set&lt;string&gt;();const active = new Set&lt;string&gt;(); |
| walk | function | 220 | no | const walk = (id: string,depth: number): void =&gt; { |
| bindings | const | 231 | no | const bindings = list(d.bindings,&#39;$.bindings&#39;,L.bindings); |
| bindingIds | const | 232 | no | const bindingIds = new Set&lt;string&gt;(); |
| p | const | 234 | no | const p=`$.bindings[${i}]`, x=record(b,p,[&#39;id&#39;,&#39;version&#39;,&#39;nodeId&#39;,&#39;field&#39;,&#39;knowledgeRef&#39;,&#39;provenanceRef&#39;,&#39;readScope&#39;,&#39;availability&#39;]); |
| bid | const | 235 | no | const bid=requiredId(x.id,`${p}.id`); |
| target | const | 241 | no | const target=requiredId(x.nodeId,`${p}.nodeId`); |
| views | const | 245 | no | const views = list(d.views,&#39;$.views&#39;,L.views); |
| viewById | const | 246 | no | const viewById=new Map&lt;string, Record&lt;string,unknown&gt;&gt;();let has2d=false; |
| p | const | 248 | no | const p=`$.views[${i}]`, x=record(v,p, v!==null &amp;&amp; typeof v===&#39;object&#39; &amp;&amp; (v as Record&lt;string,unknown&gt;).kind===&#39;spatial&#39; ? [&#39;id&#39;,&#39;version&#39;,&#39;kind&#39;,&#39;fallbackViewId&#39;,&#39;sourceRef&#39;] : [&#39;id&#39;,&#39;version&#39;,&#39;kind… |
| vid | const | 250 | no | const vid=requiredId(x.id,`${p}.id`); |
| fallback | const | 260 | no | const fallback=viewById.get(v.fallbackViewId as string); |
| validateUiDocument | function | 265 | yes | export function validateUiDocument(input: unknown, options: UiDocumentValidationOptions = {}): UiDocumentValidation { |
| failure | const | 268 | no | const failure=error instanceof Rejected ? error : new Rejected(&#39;UNSAFE_VALUE&#39;,&#39;$&#39;,&#39;Input could not be safely examined&#39;); |
| parseUiDocument | function | 274 | yes | export function parseUiDocument(input: unknown, options: UiDocumentValidationOptions = {}): UiDocument { |
| result | const | 275 | no | const result=validateUiDocument(input,options); |
| cloneInertJson | function | 281 | yes | export function cloneInertJson(input: unknown): unknown { return deepFreeze(safeJson(input)); } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./schema.ts | import | 2 | [packages/tierflow/src/visual-runtime/document/schema.ts](./schema.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](../components/wave3-canonical-map.ts.md) | ../document/validate.ts |
| [packages/tierflow/src/visual-runtime/document/import-legacy.ts](./import-legacy.ts.md) | ./validate.ts |
| [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](./wave3-action-semantics.ts.md) | ./validate.ts |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../experience/wave3-journey-fixture.ts.md) | ../document/validate.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts](../final-wave/integration/world-visual-bridge.ts.md) | ../../document/validate.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts](../final-wave/lane-c/adapters.ts.md) | ../../document/validate.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../document/validate.ts |
| [packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs](../render/hvi-inspector.mjs.md) | ../document/validate.ts |
| [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../render/wave3-semantics.ts.md) | ../document/validate.ts |
| [packages/tierflow/tests/visual-runtime/document.test.ts](../../../tests/visual-runtime/document.test.ts.md) | ../../src/visual-runtime/document/validate.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts](../../../tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts.md) | ../../../../src/visual-runtime/document/validate.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/document/validate.ts |
| [packages/tierflow/tests/visual-runtime/wave3-a-schema.test.ts](../../../tests/visual-runtime/wave3-a-schema.test.ts.md) | ../../src/visual-runtime/document/validate.ts |
| [packages/tierflow/tests/visual-runtime/wave3-b-components.test.ts](../../../tests/visual-runtime/wave3-b-components.test.ts.md) | ../../src/visual-runtime/document/validate.ts |
| [packages/tierflow/tests/visual-runtime/wave3-d-render.test.ts](../../../tests/visual-runtime/wave3-d-render.test.ts.md) | ../../src/visual-runtime/document/validate.ts |
| [packages/tierflow/tests/visual-runtime/wave4-a-desktop-adapter.test.ts](../../../tests/visual-runtime/wave4-a-desktop-adapter.test.ts.md) | ../../src/visual-runtime/document/validate.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 282 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
