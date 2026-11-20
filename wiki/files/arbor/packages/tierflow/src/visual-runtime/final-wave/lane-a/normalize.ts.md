# File: packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts |
| Language | TypeScript |
| Kind | source |
| Size | 14232 B |
| Lines | 243 |
| Hash | 798981a7d0c1 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| allStringFields | function | 15 | no | function allStringFields(value: unknown, keys: readonly string[]): boolean { |
| countInRange | function | 19 | no | function countInRange(value: unknown, max: number): boolean { |
| LANE_A_SCHEMA | const | 23 | yes | export const LANE_A_SCHEMA = &#39;vivim.final-wave-lane-a/1&#39; as const; |
| LANE_A_CONTEXT_SCHEMA | const | 24 | yes | export const LANE_A_CONTEXT_SCHEMA = &#39;vivim.final-wave-lane-a-context/1&#39; as const; |
| AuthorSurface | type | 25 | yes | export type AuthorSurface = &#39;text&#39; \| &#39;touch&#39; \| &#39;keyboard&#39; \| &#39;studio&#39; \| &#39;oracle&#39;; |
| AuthorScope | type | 26 | yes | export type AuthorScope = Readonly&lt;{ |
| AuthorIntent | type | 30 | yes | export type AuthorIntent = Readonly&lt;{ |
| SemanticProof | type | 41 | yes | export type SemanticProof = Readonly&lt;{ |
| NlclProjection | type | 48 | yes | export type NlclProjection = Readonly&lt;{ |
| AuthorControl | type | 59 | yes | export type AuthorControl = Readonly&lt;{ |
| AuthorContext | type | 67 | yes | export type AuthorContext = Readonly&lt;{ |
| UiAuthorOperation | type | 81 | yes | export type UiAuthorOperation = Readonly&lt;{ |
| AuthorResult | type | 88 | yes | export type AuthorResult = |
| ID | const | 97 | no | const ID = /^[A-Za-z0-9._:-]{1,80}$/; |
| REF | const | 98 | no | const REF = /^[A-Za-z0-9._:-]{1,128}$/; |
| UI_MEANING | const | 99 | no | const UI_MEANING = /^ui\\.(create\|move\|resize\|configure\|bind\|inspect\|preview\|save\|undo)@1$/; |
| BAD_TEXT | const | 100 | no | const BAD_TEXT = /(?:\\b(?:do not\|don&#39;t\|never\|not\|without\|instead of\|and then\|after that\|sudo\|powershell\|cmd\\.exe\|bash\\s+-c\|sh\\s+-c\|send\\s+to\\s+provider)\\b\|[;&amp;\|`]\|!\\s*(?:run\|use\|design)\\b)/i; |
| digest | function | 101 | no | const digest = (s: string): string =&gt; createHash(&#39;sha256&#39;).update(s, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| refusal | function | 102 | no | const refusal = (reasonCode: string, outcome: &#39;refused&#39; \| &#39;clarification_required&#39; = &#39;refused&#39;): AuthorResult =&gt; |
| validScope | function | 104 | no | function validScope(v: unknown): v is AuthorScope { |
| sameScope | function | 109 | no | function sameScope(a: AuthorScope, b: AuthorScope): boolean { |
| samePins | function | 113 | no | function samePins(a: VersionPins, b: VersionPins): boolean { |
| validIntent | function | 116 | no | function validIntent(v: unknown): v is AuthorIntent { |
| validContext | function | 129 | no | function validContext(v: unknown): v is AuthorContext { |
| normalizeLaneAAuthoring | function | 168 | yes | export function normalizeLaneAAuthoring(untrusted: unknown, broker: unknown): AuthorResult { |
| event | const | 171 | no | const event = untrusted, ctx = broker; |
| input | variable | 177 | no | let input: {commandId: string; source: {surface:&#39;text&#39;\|&#39;touch&#39;\|&#39;keyboard&#39;;inputDigest:string}; |
| text | const | 180 | no | const text = event.text!; |
| compiledText | variable | 182 | no | let compiledText = text; |
| matches | const | 184 | no | const matches = ctx.nlcl.filter(n =&gt; n.text === text); |
| n | const | 186 | no | const n = matches[0]!; |
| exact | const | 189 | no | const exact = toExactText(n.semanticId, n.args); |
| matches | const | 196 | no | const matches = ctx.controls.filter(c =&gt; c.id === event.controlId &amp;&amp; c.surfaces.includes(event.surface as &#39;touch&#39;\|&#39;keyboard&#39;\|&#39;studio&#39;)); |
| c | const | 198 | no | const c = matches[0]!; |
| compiled | const | 204 | no | const compiled = compileVisualCommand(input, ctx.compiled); |
| command | const | 207 | no | const command = compiled.command; |
| verb | const | 208 | no | const verb = UI_MEANING.exec(command.semanticRef.id)?.[1] as UiAuthorOperation[&#39;verb&#39;] \| undefined; |
| meanings | const | 211 | no | const meanings = ctx.meanings.filter(m =&gt; m.semanticId === command.semanticRef.id &amp;&amp; m.status === &#39;current&#39; &amp;&amp; m.sourceHash === command.semanticRef.sourceHash); |
| args | const | 217 | no | const args = command.args; |
| operation | const | 225 | no | const operation: UiAuthorOperation = { |
| semanticDigest | const | 229 | no | const semanticDigest = digest(JSON.stringify({ scope:{ownerId:ctx.scope.ownerId,actorId:ctx.scope.actorId,worldId:ctx.scope.worldId,documentId:ctx.scope.documentId}, expectedRevision:ctx.revision,doc… |
| sameLaneASemantics | function | 241 | yes | export function sameLaneASemantics(a: AuthorResult, b: AuthorResult): boolean { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| ../../command/compile.ts | import | 8 | [packages/tierflow/src/visual-runtime/command/compile.ts](../../command/compile.ts.md) |
| ../../command/ir.ts | import | 9 | [packages/tierflow/src/visual-runtime/command/ir.ts](../../command/ir.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../integration/master.ts.md) | ../lane-a/normalize.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-a/normalize.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-a/normalize.test.ts](../../../../tests/visual-runtime/final-wave/lane-a/normalize.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-a/normalize.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Final convergence Lane A. Inert UI-authoring ingress, NOT a parser authority,
 * command catalog, UI editor, publisher, Host dispatcher or effect executor.
 * HQ semantic-registry and Harness NLCL inputs are trusted broker projections:
 * their live services are not imported across repositories.
 */
import { createHash } from 'node:crypto';
import { compileVisualCommand, toExactText, type CompileContext } from '../../command/compile.ts';
import { DIGEST, onlyKeys, safeRecord, validArgs, validPins, type VersionPins, type VisualCommand } from '../../command/ir.ts';

/**
 * Type-only narrowing helpers. Each preserves the exact runtime predicate it
 * replaces: no value is accepted, rejected or coerced differently.
 */
function allStringFields(value: unknown, keys: readonly string[]): boolean {
  if (!safeRecord(value)) return false;
  return keys.every(k => typeof value[k] === 'string');
}
function countInRange(value: unknown, max: number): boolean {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;
}

export const LANE_A_SCHEMA = 'vivim.final-wave-lane-a/1' as const;
export const LANE_A_CONTEXT_SCHEMA = 'vivim.final-wave-lane-a-context/1' as const;
export type AuthorSurface = 'text' | 'touch' | 'keyboard' | 'studio' | 'oracle';
export type AuthorScope = Readonly<{
  ownerId: string; actorId: string; deviceId: string; sessionId: string;
  worldId: string; documentId: string;
}>;
export type AuthorIntent = Readonly<{
  schema: typeof LANE_A_SCHEMA;
  surface: AuthorSurface;
  commandId: string;
  scope: AuthorScope;
  expectedRevision: number;
  expectedDocumentDigest: string;
  expectedVersions: VersionPins;
  text?: string;
  controlId?: string;
}>;
export type SemanticProof = Readonly<{
  semanticId: string;
  schema: 'hq.semantic-registry/1';
  status: 'current' | 'proposed' | 'deprecated';
  sourceHash: string;
}>;
/** Strictly a snapshot of an existing NLCL projection; never runtime catalog. */
export type NlclProjection = Readonly<{
  schema: 'vivim.control-language/1';
  text: string;
  status: 'ok' | 'ambiguous' | 'partial';
  semanticId: string;
  args: Readonly<Record<string, string>>;
  gaps: number;
  alternatives: number;
  sourceHash: string;
}>;
/** Existing rendered UI / Studio broker provides controls, never the input event. */
export type AuthorControl = Readonly<{
  id: string;
  semanticId: string;
  args: Readonly<Record<string, string>>;
  enabled: boolean;
  visible: boolean;
  surfaces: readonly ('touch' | 'keyboard' | 'studio')[];
}>;
export type AuthorContext = Readonly<{
  schema: typeof LANE_A_CONTEXT_SCHEMA;
  scope: AuthorScope;
  revision: number;
  device: 'desktop' | 'phone';
  documentDigest: string;
  currentVersions: VersionPins;
  compiled: CompileContext;
  meanings: readonly SemanticProof[];
  nlcl: readonly NlclProjection[];
  controls: readonly AuthorControl[];
  /** Stable IDs from the existing canonical UI projection, not caller text. */
  targets: readonly Readonly<{kind:'object'|'document';ref:string}>[];
}>;
```

_First 80 of 244 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
