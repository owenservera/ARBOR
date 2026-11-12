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
export interface ControlCatalogAction {
  id: string;
  title?: string;
  owner: string;
  readiness: string;
  risk: CommandRisk;
  aiCandidate?: boolean;
  requiredScopes?: string[];
  args: Record<string,
    { type: 'enum'; values: string[] } |
    { type: 'string'; min: number; max: number }>;
}
export interface ControlCatalog {
  version: number;
  actions: ControlCatalogAction[];
}
export declare const COMMAND_INTENT_SCHEMA: 'vivim.command-intent/0.1';
export declare function toCommandIntent(
  input: CommandInput,
  context: { catalog: ControlCatalog; world: { v: number; [key: string]: unknown } }
): CommandIntent;
export declare function validateAiCommandCandidate(
  input: CommandInput & { candidate: CommandAiProposal },
  context: { catalog: ControlCatalog; world: { v: number; [key: string]: unknown } }
): CommandIntent;
