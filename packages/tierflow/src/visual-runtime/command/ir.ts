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
