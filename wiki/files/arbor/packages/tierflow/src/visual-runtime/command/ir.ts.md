# File: packages/tierflow/src/visual-runtime/command/ir.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/command/ir.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4146 B |
| Lines | 69 |
| Hash | 325090ec9e21 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VISUAL_COMMAND_SCHEMA | const | 2 | yes | export const VISUAL_COMMAND_SCHEMA = &#39;vivim.visual-command/1&#39; as const; |
| Modality | type | 3 | yes | export type Modality = &#39;text&#39; \| &#39;keyboard&#39; \| &#39;touch&#39;; |
| Risk | type | 4 | yes | export type Risk = &#39;R0&#39; \| &#39;R1&#39; \| &#39;R2&#39; \| &#39;R3&#39;; |
| TargetOwner | type | 5 | yes | export type TargetOwner = &#39;ui_document&#39; \| &#39;host_effect&#39;; |
| Availability | type | 6 | yes | export type Availability = &#39;yes&#39; \| &#39;no&#39; \| &#39;unknown&#39;; |
| CapabilityEvidence | type | 7 | yes | export type CapabilityEvidence = { |
| SemanticRef | type | 14 | yes | export type SemanticRef = { id: string; version: string; sourceHash: string }; |
| ActionTarget | type | 15 | yes | export type ActionTarget = { owner: TargetOwner; actionId: string; catalogVersion: number }; |
| VersionPins | type | 16 | yes | export type VersionPins = { kb?: string; hostWorld?: string; uiRevision?: string; policy?: string }; |
| VisualCommand | type | 17 | yes | export type VisualCommand = { |
| CommandInput | type | 29 | yes | export type CommandInput = { |
| Compilation | type | 38 | yes | export type Compilation = |
| safeRecord | function | 43 | yes | export function safeRecord(value: unknown): value is Record&lt;string, unknown&gt; { |
| proto | const | 45 | no | const proto = Object.getPrototypeOf(value); |
| onlyKeys | function | 49 | yes | export function onlyKeys(value: unknown, names: readonly string[]): value is Record&lt;string, unknown&gt; { |
| DIGEST | const | 52 | yes | export const DIGEST = /^[a-f0-9]{64}$/; |
| SEMANTIC_ID | const | 53 | yes | export const SEMANTIC_ID = /^[a-z0-9][a-z0-9._-]{0,94}@(\\d+)(?:\\.\\d+)*$/; |
| ACTION_ID | const | 54 | yes | export const ACTION_ID = /^[a-z][a-z0-9._-]{1,95}$/; |
| ARG_KEY | const | 55 | yes | export const ARG_KEY = /^[a-z][a-z0-9_]{0,39}$/; |
| FORBIDDEN_KEY | const | 56 | yes | export const FORBIDDEN_KEY = /(?:^\|_)(?:password\|passwd\|secret\|credential\|token\|cookie\|bearer\|grant\|approval\|authorize\|authorization\|privilege\|privileged\|shell\|argv\|exec\|script\|environment\|env\|provid… |
| FORBIDDEN_VALUE | const | 57 | yes | export const FORBIDDEN_VALUE = /(?:-----BEGIN (?:RSA \|EC \|OPENSSH )?PRIVATE KEY-----\|\\bBearer\\s+\\S+\|\\b(?:password\|api[_-]?key\|secret\|access[_-]?token)\\s*[:=]\|\\b(?:gh[pousr]_\|sk-(?:proj-)?)[A-Za-z0-9_… |
| validArgs | function | 58 | yes | export function validArgs(args: unknown): args is Record&lt;string, string&gt; { |
| validPins | function | 63 | yes | export function validPins(value: unknown): value is VersionPins { |
| refusal | function | 67 | yes | export function refusal(reasonCode: string, outcome: &#39;clarification_required&#39; \| &#39;refused&#39; = &#39;refused&#39;): Compilation { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/command/compile.ts](./compile.ts.md) | ./ir.ts |
| [packages/tierflow/src/visual-runtime/command/crosswalk.ts](./crosswalk.ts.md) | ./ir.ts |
| [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](./wave3-descriptor-proof.ts.md) | ./ir.ts |
| [packages/tierflow/src/visual-runtime/command/wave4-typed-transport-adapter.ts](./wave4-typed-transport-adapter.ts.md) | ./ir.ts |
| [packages/tierflow/src/visual-runtime/command/wave4-typed-transport-adapter.ts](./wave4-typed-transport-adapter.ts.md) | ./ir.ts |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../experience/wave3-journey-fixture.ts.md) | ../command/ir.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts](../final-wave/lane-a/normalize.ts.md) | ../../command/ir.ts |
| [packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts](../input/wave4-device-semantics.ts.md) | ../command/ir.ts |
| [packages/tierflow/tests/visual-runtime/command.test.ts](../../../tests/visual-runtime/command.test.ts.md) | ../../src/visual-runtime/command/ir.ts |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../../tests/visual-runtime/wave3-e-experience.test.ts.md) | ../../src/visual-runtime/command/ir.ts |
| [packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts](../../../tests/visual-runtime/wave4-c-device-semantics.test.ts.md) | ../../src/visual-runtime/command/ir.ts |
| [packages/tierflow/tests/visual-runtime/wave4-g-typed-transport.test.ts](../../../tests/visual-runtime/wave4-g-typed-transport.test.ts.md) | ../../src/visual-runtime/command/ir.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Fixture-only, inert ingress IR. It is neither an approval nor an effect permit. */
export const VISUAL_COMMAND_SCHEMA = 'vivim.visual-command/1' as const;
export type Modality = 'text' | 'keyboard' | 'touch';
export type Risk = 'R0' | 'R1' | 'R2' | 'R3';
export type TargetOwner = 'ui_document' | 'host_effect';
export type Availability = 'yes' | 'no' | 'unknown';
export type CapabilityEvidence = {
  supportedByBuild: boolean | 'unknown';
  availableNow: Availability;
  permittedForActor: Availability;
  verifiedByEvidence: boolean;
  reasonCodes: readonly string[];
};
export type SemanticRef = { id: string; version: string; sourceHash: string };
export type ActionTarget = { owner: TargetOwner; actionId: string; catalogVersion: number };
export type VersionPins = { kb?: string; hostWorld?: string; uiRevision?: string; policy?: string };
export type VisualCommand = {
  schema: typeof VISUAL_COMMAND_SCHEMA;
  commandId: string;
  source: { surface: Modality; inputDigest: string };
  semanticRef: SemanticRef;
  target: ActionTarget;
  args: Record<string, string>;
  risk: { level: Risk; source: 'host_catalog' | 'ui_contract'; sourceHash: string };
  sourceVersions: VersionPins;
  interpretation: { method: 'exact-text' | 'explicit-selector' | 'bounded-ai-proposal'; outcome: 'candidate'; reasonCodes: readonly string[] };
  capability: CapabilityEvidence;
};
export type CommandInput = {
  commandId: string;
  source: { surface: Modality; inputDigest: string };
  text?: string;
  selection?: { semanticId: string; args: Record<string, string> };
  /** AI suggestions may only confirm exactly resolved owner text; never replace it. */
  aiProposal?: { semanticId: string; args: Record<string, string> };
  expectedVersions?: VersionPins;
};
export type Compilation =
  | { outcome: 'candidate'; command: VisualCommand }
  | { outcome: 'clarification_required' | 'refused'; reasonCode: string; alternatives: readonly string[] };

/** Read own data properties only; no getters, functions, prototypes or inherited keys. */
export function safeRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every(d => 'value' in d);
}
export function onlyKeys(value: unknown, names: readonly string[]): value is Record<string, unknown> {
  return safeRecord(value) && Object.keys(value).every(key => names.includes(key));
}
export const DIGEST = /^[a-f0-9]{64}$/;
export const SEMANTIC_ID = /^[a-z0-9][a-z0-9._-]{0,94}@(\d+)(?:\.\d+)*$/;
export const ACTION_ID = /^[a-z][a-z0-9._-]{1,95}$/;
export const ARG_KEY = /^[a-z][a-z0-9_]{0,39}$/;
export const FORBIDDEN_KEY = /(?:^|_)(?:password|passwd|secret|credential|token|cookie|bearer|grant|approval|authorize|authorization|privilege|privileged|shell|argv|exec|script|environment|env|provider_send|device_id|actor_id|owner_id)(?:$|_)/i;
export const FORBIDDEN_VALUE = /(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bBearer\s+\S+|\b(?:password|api[_-]?key|secret|access[_-]?token)\s*[:=]|\b(?:gh[pousr]_|sk-(?:proj-)?)[A-Za-z0-9_-]{10,})/i;
export function validArgs(args: unknown): args is Record<string, string> {
  return safeRecord(args) && Object.keys(args).length <= 16 && Object.entries(args).every(([key, v]) =>
    ARG_KEY.test(key) && !FORBIDDEN_KEY.test(key) && typeof v === 'string' && v.length <= 512 &&
    v === v.trim() && !/[\u0000-\u001f\u007f]/.test(v) && !FORBIDDEN_VALUE.test(v));
}
export function validPins(value: unknown): value is VersionPins {
  return onlyKeys(value, ['kb', 'hostWorld', 'uiRevision', 'policy']) &&
    Object.values(value).every(v => typeof v === 'string' && v.length >= 1 && v.length <= 128 && /^[a-zA-Z0-9._:-]+$/.test(v));
}
export function refusal(reasonCode: string, outcome: 'clarification_required' | 'refused' = 'refused'): Compilation {
  return { outcome, reasonCode, alternatives: [] };
}
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
