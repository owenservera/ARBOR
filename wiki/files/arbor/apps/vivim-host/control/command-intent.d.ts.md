# File: apps/vivim-host/control/command-intent.d.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/command-intent.d.ts |
| Language | TypeScript |
| Kind | source |
| Size | 3253 B |
| Lines | 105 |
| Hash | b7a134445217 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CommandOutcome | type | 4 | yes | export type CommandOutcome = |
| CommandRisk | type | 6 | yes | export type CommandRisk = &#39;R0&#39; \| &#39;R1&#39; \| &#39;R2&#39; \| &#39;R3&#39;; |
| CommandSurface | type | 7 | yes | export type CommandSurface = &#39;text&#39; \| &#39;desktop&#39; \| &#39;mobile&#39; \| &#39;visual&#39;; |
| CommandInput | interface | 8 | yes | export interface CommandInput { |
| CommandProvenance | interface | 15 | yes | export interface CommandProvenance { |
| CommandRefusal | interface | 27 | yes | export interface CommandRefusal { |
| CommandAlternative | interface | 31 | yes | export interface CommandAlternative { |
| CommandArgGap | interface | 36 | yes | export interface CommandArgGap { |
| CommandCommon | interface | 42 | yes | export interface CommandCommon { |
| CommandCandidate | interface | 47 | yes | export interface CommandCandidate extends CommandCommon { |
| CommandClarification | interface | 57 | yes | export interface CommandClarification extends CommandCommon { |
| CommandInterpretationRequired | interface | 64 | yes | export interface CommandInterpretationRequired extends CommandCommon { |
| CommandRefused | interface | 68 | yes | export interface CommandRefused extends CommandCommon { |
| CommandIntent | type | 72 | yes | export type CommandIntent = CommandCandidate \| CommandClarification \| |
| CommandAiProposal | interface | 75 | yes | export interface CommandAiProposal { |
| ControlCatalogAction | interface | 81 | yes | export interface ControlCatalogAction { |
| ControlCatalog | interface | 93 | yes | export interface ControlCatalog { |
| toCommandIntent | function | 98 | yes | export declare function toCommandIntent( input: CommandInput, context: { catalog: ControlCatalog; world: { v: number; [key: string]: unknown } } ): CommandIntent; |
| validateAiCommandCandidate | function | 102 | yes | export declare function validateAiCommandCandidate( input: CommandInput &amp; { candidate: CommandAiProposal }, context: { catalog: ControlCatalog; world: { v: number; [key: string]: unknown } } ): Comma… |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** Stable, effect-free contract for VIVIM command parsing and Lane 3 wiki adapters.
 * This declares the published JSON IR; it does not define effect permissions.
 */
export type CommandOutcome =
  | 'candidate' | 'clarification_required' | 'interpretation_required' | 'refused';
export type CommandRisk = 'R0' | 'R1' | 'R2' | 'R3';
export type CommandSurface = 'text' | 'desktop' | 'mobile' | 'visual';
export interface CommandInput {
  text: string;
  worldRevision?: number;
  catalogRevision?: number;
  audience?: string;
  scope?: CommandSurface;
}
export interface CommandProvenance {
  method: 'deterministic-nlcl' | 'bounded-ai-proposal' | 'deterministic-validation';
  engineVersion?: string | null;
  catalogRevision: number | null;
  worldRevision: number | null;
  audience?: string;
  surface?: CommandSurface;
  confidence?: number | null;
  authority: 'none';
  rationale?: string | null;
  uncertainty?: number | null;
}
export interface CommandRefusal {
  code: string;
  message: string;
}
export interface CommandAlternative {
  actionId: string;
  title?: string;
  risk: CommandRisk;
}
export interface CommandArgGap {
  arg: string;
  choices?: string[];
  min?: number;
  max?: number;
}
export interface CommandCommon {
  schema: 'vivim.command-intent/0.1';
  outcome: CommandOutcome;
  provenance: CommandProvenance;
}
export interface CommandCandidate extends CommandCommon {
  outcome: 'candidate';
  actionId: string;
  args: Record<string, string>;
  canonical: string;
  risk: CommandRisk;
  requiredScopes: string[];
  owner: string;
  readiness: string;
}
export interface CommandClarification extends CommandCommon {
  outcome: 'clarification_required';
  question: string;
  alternatives: CommandAlternative[];
  risk?: CommandRisk;
  missing?: CommandArgGap[];
}
export interface CommandInterpretationRequired extends CommandCommon {
  outcome: 'interpretation_required';
  refusal: CommandRefusal;
}
export interface CommandRefused extends CommandCommon {
  outcome: 'refused';
  refusal: CommandRefusal;
}
export type CommandIntent = CommandCandidate | CommandClarification |
  CommandInterpretationRequired | CommandRefused;

export interface CommandAiProposal {
  actionId: string;
  args?: Record<string, string>;
  rationale?: string;
  uncertainty?: number;
}
```

_First 80 of 106 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
