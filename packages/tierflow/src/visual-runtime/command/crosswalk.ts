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
export function resolveCrosswalk(semanticId: string, rows: readonly CrosswalkRow[], descriptors: readonly ActionDescriptor[]): CrosswalkResult {
  if (!Array.isArray(rows) || !Array.isArray(descriptors) || rows.length > 64 || descriptors.length > 64 ||
      rows.some(r => !validRow(r)) || descriptors.some(d => !validDescriptor(d)))
    return { ok: false, reasonCode: 'INVALID_CROSSWALK' };
  const matches = rows.filter(row => row.semanticRef.id === semanticId);
  if (matches.length === 0) return { ok: false, reasonCode: 'UNKNOWN_SEMANTIC_ID' };
  if (matches.length !== 1) return { ok: false, reasonCode: 'AMBIGUOUS_MAPPING' };
  const row = matches[0]!;
  if (!row.reviewedEnabled || !['source_wired','verified'].includes(row.implementationStatus))
    return { ok: false, reasonCode: 'ACTION_NOT_REVIEWED' };
  const linked = descriptors.filter(d => d.target.owner === row.target.owner && d.target.actionId === row.target.actionId);
  if (linked.length !== 1) return { ok: false, reasonCode: linked.length ? 'AMBIGUOUS_DESCRIPTOR' : 'MISSING_DESCRIPTOR' };
  const descriptor = linked[0]!;
  if (descriptor.target.catalogVersion !== row.target.catalogVersion ||
      descriptor.sourceHash !== row.riskSource.sourceHash || descriptor.argsSchemaHash !== row.argsSchemaHash ||
      descriptor.risk !== row.risk || descriptor.implementationStatus !== row.implementationStatus)
    return { ok: false, reasonCode: 'STALE_DESCRIPTOR' };
  return { ok: true, row, descriptor };
}
/** Validate every argument against the exact reviewed schema. No coercion/defaults. */
export function checkArguments(args: Record<string,string>, schema: Readonly<Record<string,ArgRule>>): boolean {
  const keys = Object.keys(schema);
  if (Object.keys(args).length !== keys.length) return false;
  return keys.every(key => {
    const spec = schema[key]!;
    const val = args[key];
    return typeof val === 'string' && (spec.type === 'enum' ? spec.values.includes(val) :
      val.length >= spec.min && val.length <= spec.max);
  });
}
