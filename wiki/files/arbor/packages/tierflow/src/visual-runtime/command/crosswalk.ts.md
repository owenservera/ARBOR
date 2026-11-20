# File: packages/tierflow/src/visual-runtime/command/crosswalk.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/command/crosswalk.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7433 B |
| Lines | 110 |
| Hash | a925cd684299 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ArgRule | type | 4 | yes | export type ArgRule = { type: &#39;enum&#39;; values: readonly string[] } \| { type: &#39;string&#39;; min: number; max: number }; |
| CrosswalkRow | type | 5 | yes | export type CrosswalkRow = { |
| ActionDescriptor | type | 17 | yes | export type ActionDescriptor = { |
| CrosswalkResult | type | 25 | yes | export type CrosswalkResult = { ok: true; row: CrosswalkRow; descriptor: ActionDescriptor } \| |
| riskLevels | const | 27 | no | const riskLevels: readonly string[] = [&#39;R0&#39;, &#39;R1&#39;, &#39;R2&#39;, &#39;R3&#39;]; |
| statuses | const | 28 | no | const statuses = [&#39;declared&#39;, &#39;source_wired&#39;, &#39;verified&#39;, &#39;unsupported&#39;]; |
| availabilities | const | 29 | no | const availabilities = [&#39;yes&#39;, &#39;no&#39;, &#39;unknown&#39;]; |
| validTarget | function | 31 | no | function validTarget(v: unknown): v is ActionTarget { |
| validSchema | function | 37 | no | function validSchema(value: unknown): value is Readonly&lt;Record&lt;string, ArgRule&gt;&gt; { |
| validCapability | function | 49 | no | function validCapability(v: unknown): v is CapabilityEvidence { |
| validRow | function | 56 | yes | export function validRow(v: unknown): v is CrosswalkRow { |
| validDescriptor | function | 74 | yes | export function validDescriptor(v: unknown): v is ActionDescriptor { |
| resolveCrosswalk | function | 81 | yes | export function resolveCrosswalk(semanticId: string, rows: readonly CrosswalkRow[], descriptors: readonly ActionDescriptor[]): CrosswalkResult { |
| matches | const | 85 | no | const matches = rows.filter(row =&gt; row.semanticRef.id === semanticId); |
| row | const | 88 | no | const row = matches[0]!; |
| linked | const | 91 | no | const linked = descriptors.filter(d =&gt; d.target.owner === row.target.owner &amp;&amp; d.target.actionId === row.target.actionId); |
| descriptor | const | 93 | no | const descriptor = linked[0]!; |
| checkArguments | function | 101 | yes | export function checkArguments(args: Record&lt;string,string&gt;, schema: Readonly&lt;Record&lt;string,ArgRule&gt;&gt;): boolean { |
| keys | const | 102 | no | const keys = Object.keys(schema); |
| spec | const | 105 | no | const spec = schema[key]!; |
| val | const | 106 | no | const val = args[key]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./ir.ts | import | 1 | [packages/tierflow/src/visual-runtime/command/ir.ts](./ir.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/command/compile.ts](./compile.ts.md) | ./crosswalk.ts |
| [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](./wave3-descriptor-proof.ts.md) | ./crosswalk.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../command/crosswalk.ts |
| [packages/tierflow/tests/visual-runtime/command-negative.test.ts](../../../tests/visual-runtime/command-negative.test.ts.md) | ../../src/visual-runtime/command/crosswalk.ts |
| [packages/tierflow/tests/visual-runtime/command.test.ts](../../../tests/visual-runtime/command.test.ts.md) | ../../src/visual-runtime/command/crosswalk.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-a/normalize.test.ts](../../../tests/visual-runtime/final-wave/lane-a/normalize.test.ts.md) | ../../../../src/visual-runtime/command/crosswalk.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/command/crosswalk.ts |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../../tests/visual-runtime/wave3-e-experience.test.ts.md) | ../../src/visual-runtime/command/crosswalk.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
import { ACTION_ID, ARG_KEY, DIGEST, FORBIDDEN_KEY, FORBIDDEN_VALUE, SEMANTIC_ID, onlyKeys, safeRecord, type ActionTarget, type CapabilityEvidence, type Risk, type SemanticRef } from './ir.ts';

/** The caller supplies source-backed Host/UI descriptors; no registry is created here. */
export type ArgRule = { type: 'enum'; values: readonly string[] } | { type: 'string'; min: number; max: number };
export type CrosswalkRow = {
  semanticRef: SemanticRef;
  target: ActionTarget;
  argsSchema: Readonly<Record<string, ArgRule>>;
  argsSchemaHash: string;
  risk: Risk;
  riskSource: { authority: 'host_catalog' | 'ui_contract'; sourceHash: string };
  implementationStatus: 'declared' | 'source_wired' | 'verified' | 'unsupported';
  reviewedEnabled: boolean;
  /** Additional human-readable exact aliases are only permitted for zero-arg rows. */
  textAliases?: readonly string[];
};
export type ActionDescriptor = {
  target: ActionTarget;
  argsSchemaHash: string;
  sourceHash: string;
  risk: Risk;
  implementationStatus: CrosswalkRow['implementationStatus'];
  capability: CapabilityEvidence;
};
export type CrosswalkResult = { ok: true; row: CrosswalkRow; descriptor: ActionDescriptor } |
  { ok: false; reasonCode: string };
const riskLevels: readonly string[] = ['R0', 'R1', 'R2', 'R3'];
const statuses = ['declared', 'source_wired', 'verified', 'unsupported'];
const availabilities = ['yes', 'no', 'unknown'];

function validTarget(v: unknown): v is ActionTarget {
  return onlyKeys(v, ['owner', 'actionId', 'catalogVersion']) &&
    (v.owner === 'ui_document' || v.owner === 'host_effect') &&
    typeof v.actionId === 'string' && ACTION_ID.test(v.actionId) &&
    Number.isSafeInteger(v.catalogVersion) && (v.catalogVersion as number) >= 1;
}
function validSchema(value: unknown): value is Readonly<Record<string, ArgRule>> {
  if (!safeRecord(value) || Object.keys(value).length > 16) return false;
  return Object.entries(value).every(([key, rule]) => {
    if (!ARG_KEY.test(key) || FORBIDDEN_KEY.test(key) || !rule || !safeRecord(rule)) return false;
    if (rule.type === 'enum') return onlyKeys(rule, ['type','values']) && Array.isArray(rule.values) &&
      rule.values.length >= 1 && rule.values.length <= 32 && new Set(rule.values).size === rule.values.length &&
      rule.values.every((v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 128 && v.trim() === v && !FORBIDDEN_VALUE.test(v));
    return rule.type === 'string' && onlyKeys(rule, ['type','min','max']) &&
      Number.isSafeInteger(rule.min) && Number.isSafeInteger(rule.max) &&
      (rule.min as number) >= 1 && (rule.max as number) <= 512 && (rule.min as number) <= (rule.max as number);
  });
}
function validCapability(v: unknown): v is CapabilityEvidence {
  return onlyKeys(v, ['supportedByBuild','availableNow','permittedForActor','verifiedByEvidence','reasonCodes']) &&
    (typeof v.supportedByBuild === 'boolean' || v.supportedByBuild === 'unknown') &&
    availabilities.includes(v.availableNow as string) && availabilities.includes(v.permittedForActor as string) &&
    typeof v.verifiedByEvidence === 'boolean' && Array.isArray(v.reasonCodes) && v.reasonCodes.length <= 16 &&
    v.reasonCodes.every((s: unknown) => typeof s === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(s));
}
export function validRow(v: unknown): v is CrosswalkRow {
  if (!onlyKeys(v, ['semanticRef','target','argsSchema','argsSchemaHash','risk','riskSource','implementationStatus','reviewedEnabled','textAliases']) ||
    !onlyKeys(v.semanticRef, ['id','version','sourceHash']) ||
    typeof v.semanticRef.id !== 'string' || !SEMANTIC_ID.test(v.semanticRef.id) ||
    typeof v.semanticRef.version !== 'string' || v.semanticRef.id.split('@')[1] !== v.semanticRef.version ||
    typeof v.semanticRef.sourceHash !== 'string' || !DIGEST.test(v.semanticRef.sourceHash) ||
    !validTarget(v.target) || !validSchema(v.argsSchema) ||
    typeof v.argsSchemaHash !== 'string' || !DIGEST.test(v.argsSchemaHash) ||
    !riskLevels.includes(v.risk as string) ||
    !onlyKeys(v.riskSource, ['authority','sourceHash']) ||
    v.riskSource.authority !== (v.target.owner === 'host_effect' ? 'host_catalog' : 'ui_contract') ||
    typeof v.riskSource.sourceHash !== 'string' || !DIGEST.test(v.riskSource.sourceHash) ||
    !statuses.includes(v.implementationStatus as string) || typeof v.reviewedEnabled !== 'boolean') return false;
  if (v.textAliases === undefined) return true;
  return Array.isArray(v.textAliases) && v.textAliases.length <= 8 && Object.keys(v.argsSchema).length === 0 &&
    v.textAliases.every((x: unknown) => typeof x === 'string' && x.length >= 2 && x.length <= 80 &&
      /^[a-z][a-z0-9 ]+$/.test(x) && x === x.trim());
}
export function validDescriptor(v: unknown): v is ActionDescriptor {
  return onlyKeys(v, ['target','argsSchemaHash','sourceHash','risk','implementationStatus','capability']) &&
    validTarget(v.target) && typeof v.argsSchemaHash === 'string' && DIGEST.test(v.argsSchemaHash) &&
    typeof v.sourceHash === 'string' && DIGEST.test(v.sourceHash) &&
    riskLevels.includes(v.risk as string) && statuses.includes(v.implementationStatus as string) && validCapability(v.capability);
}
/** Exact, bounded, provenance-checked lookup; duplicate mappings refuse rather than pick. */
```

_First 80 of 111 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
