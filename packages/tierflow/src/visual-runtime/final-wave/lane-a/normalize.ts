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
export type UiAuthorOperation = Readonly<{
  schema: 'vivim.ui-author-operation/1';
  semanticRef: string;
  verb: 'create' | 'move' | 'resize' | 'configure' | 'bind' | 'inspect' | 'preview' | 'save' | 'undo';
  target: Readonly<{ kind: 'object' | 'document'; ref: string }>;
  args: Readonly<Record<string, string>>;
}>;
export type AuthorResult =
  | Readonly<{ outcome: 'candidate'; operation: UiAuthorOperation; command: VisualCommand;
      semanticDigest: string; scope: AuthorScope; expectedRevision: number;
      expectedDocumentDigest: string; evidenceClass: 'inert-compiler-candidate';
      publisher: 'none'; effectInvoked: false; approved: false; hostAuthorizationRequired: true;
      automaticRetryAllowed: false }>
  | Readonly<{ outcome: 'refused' | 'clarification_required'; reasonCode: string;
      effectInvoked: false; approved: false; automaticRetryAllowed: false }>;

const ID = /^[A-Za-z0-9._:-]{1,80}$/;
const REF = /^[A-Za-z0-9._:-]{1,128}$/;
const UI_MEANING = /^ui\.(create|move|resize|configure|bind|inspect|preview|save|undo)@1$/;
const BAD_TEXT = /(?:\b(?:do not|don't|never|not|without|instead of|and then|after that|sudo|powershell|cmd\.exe|bash\s+-c|sh\s+-c|send\s+to\s+provider)\b|[;&|`]|!\s*(?:run|use|design)\b)/i;
const digest = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');
const refusal = (reasonCode: string, outcome: 'refused' | 'clarification_required' = 'refused'): AuthorResult =>
  ({ outcome, reasonCode, effectInvoked: false, approved: false, automaticRetryAllowed: false });
function validScope(v: unknown): v is AuthorScope {
  return onlyKeys(v, ['ownerId','actorId','deviceId','sessionId','worldId','documentId']) &&
    ['ownerId','actorId','deviceId','sessionId','worldId','documentId']
      .every(k => typeof v[k] === 'string' && REF.test(v[k] as string));
}
function sameScope(a: AuthorScope, b: AuthorScope): boolean {
  return Object.keys(a).length === Object.keys(b).length &&
    (Object.keys(a) as (keyof AuthorScope)[]).every(k => a[k] === b[k]);
}
function samePins(a: VersionPins, b: VersionPins): boolean {
  return JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
}
function validIntent(v: unknown): v is AuthorIntent {
  return onlyKeys(v, ['schema','surface','commandId','scope','expectedRevision','expectedDocumentDigest','expectedVersions','text','controlId']) &&
    v.schema === LANE_A_SCHEMA &&
    ['text','touch','keyboard','studio','oracle'].includes(v.surface as string) &&
    typeof v.commandId === 'string' && ID.test(v.commandId) &&
    validScope(v.scope) && Number.isSafeInteger(v.expectedRevision) && (v.expectedRevision as number) >= 0 &&
    typeof v.expectedDocumentDigest === 'string' && DIGEST.test(v.expectedDocumentDigest) &&
    validPins(v.expectedVersions) &&
    (v.surface === 'text' ? typeof v.text === 'string' && v.text.length > 0 &&
      v.text.length <= 2048 && v.controlId === undefined :
      v.surface === 'oracle' ? v.text === undefined && v.controlId === undefined :
      typeof v.controlId === 'string' && ID.test(v.controlId) && v.text === undefined);
}
function validContext(v: unknown): v is AuthorContext {
  if (!onlyKeys(v, ['schema','scope','revision','device','documentDigest','currentVersions','compiled','meanings','nlcl','controls','targets']) ||
    v.schema !== LANE_A_CONTEXT_SCHEMA || !validScope(v.scope) ||
    !Number.isSafeInteger(v.revision) || (v.revision as number) < 0 ||
    !['desktop','phone'].includes(v.device as string) ||
    typeof v.documentDigest !== 'string' || !DIGEST.test(v.documentDigest) ||
    !validPins(v.currentVersions) ||
    !allStringFields(v.currentVersions, ['policy','uiRevision','hostWorld']) ||
    !safeRecord(v.compiled) ||
    !validPins(v.compiled.currentVersions) ||
    !Array.isArray(v.compiled.rows) || !Array.isArray(v.compiled.descriptors) ||
    !Array.isArray(v.meanings) || v.meanings.length > 64 ||
    !Array.isArray(v.nlcl) || v.nlcl.length > 64 ||
    !Array.isArray(v.controls) || v.controls.length > 64 ||
    !Array.isArray(v.targets) || v.targets.length > 256) return false;
  if (!v.targets.every(t => onlyKeys(t,['kind','ref']) &&
    ['object','document'].includes(t.kind as string) && typeof t.ref === 'string' && REF.test(t.ref))) return false;
  if (new Set(v.targets.map(t=>t.kind+':'+t.ref)).size !== v.targets.length) return false;
  return v.meanings.every(m => onlyKeys(m, ['semanticId','schema','status','sourceHash']) &&
    m.schema === 'hq.semantic-registry/1' && typeof m.semanticId === 'string' &&
    UI_MEANING.test(m.semanticId) && ['current','proposed','deprecated'].includes(m.status as string) &&
    typeof m.sourceHash === 'string' && DIGEST.test(m.sourceHash)) &&
    v.nlcl.every(n => onlyKeys(n, ['schema','text','status','semanticId','args','gaps','alternatives','sourceHash']) &&
      n.schema === 'vivim.control-language/1' && typeof n.text === 'string' && n.text.length <= 2048 &&
      ['ok','partial','ambiguous'].includes(n.status as string) &&
      typeof n.semanticId === 'string' && UI_MEANING.test(n.semanticId) && validArgs(n.args) &&
      countInRange(n.gaps, 64) && countInRange(n.alternatives, 64) &&
      typeof n.sourceHash === 'string' && DIGEST.test(n.sourceHash)) &&
    v.controls.every(c => onlyKeys(c, ['id','semanticId','args','enabled','visible','surfaces']) &&
      typeof c.id === 'string' && ID.test(c.id) &&
      typeof c.semanticId === 'string' && UI_MEANING.test(c.semanticId) && validArgs(c.args) &&
      typeof c.enabled === 'boolean' && typeof c.visible === 'boolean' &&
      Array.isArray(c.surfaces) && c.surfaces.length <= 3 &&
      c.surfaces.every(s => ['touch','keyboard','studio'].includes(s)));
}
/**
 * Maps externally supplied HQ/NLCL meaning or a canonical UI control through
 * the EXISTING TierFlow compiler. Produces no mutation or effect.
 */
export function normalizeLaneAAuthoring(untrusted: unknown, broker: unknown): AuthorResult {
  if (!validIntent(untrusted)) return refusal('INVALID_INTENT');
  if (!validContext(broker)) return refusal('INVALID_BROKER_CONTEXT');
  const event = untrusted, ctx = broker;
  if (!sameScope(event.scope, ctx.scope)) return refusal('FOREIGN_SCOPE');
  if (event.expectedRevision !== ctx.revision || event.expectedDocumentDigest !== ctx.documentDigest ||
    !samePins(event.expectedVersions, ctx.currentVersions) ||
    !samePins(ctx.currentVersions, ctx.compiled.currentVersions)) return refusal('STALE_SOURCE_VERSION');
  if (event.surface === 'oracle') return refusal('ORACLE_REQUIRES_OWNER_SELECTION');
  let input: {commandId: string; source: {surface:'text'|'touch'|'keyboard';inputDigest:string};
    text?: string; selection?: {semanticId:string;args:Record<string,string>}; expectedVersions: VersionPins};
  if (event.surface === 'text') {
    const text = event.text!;
    if (BAD_TEXT.test(text)) return refusal('UNSAFE_OR_COMPOUND_TEXT');
    let compiledText = text;
    if (!text.startsWith('/')) {
      const matches = ctx.nlcl.filter(n => n.text === text);
      if (matches.length !== 1) return refusal('AMBIGUOUS_OR_UNKNOWN_NLCL', 'clarification_required');
      const n = matches[0]!;
      if (n.status !== 'ok' || n.gaps !== 0 || n.alternatives !== 0)
        return refusal('NLCL_ABSTENTION', 'clarification_required');
      const exact = toExactText(n.semanticId, n.args);
      if (!exact) return refusal('INVALID_NLCL_ARGS');
      compiledText = exact;
    }
    input = {commandId:event.commandId, source:{surface:'text',inputDigest:digest(text)},
      text:compiledText, expectedVersions:event.expectedVersions};
  } else {
    const matches = ctx.controls.filter(c => c.id === event.controlId && c.surfaces.includes(event.surface as 'touch'|'keyboard'|'studio'));
    if (matches.length !== 1) return refusal('UNKNOWN_OR_AMBIGUOUS_CONTROL');
    const c = matches[0]!;
    if (!c.visible || !c.enabled) return refusal('CONTROL_NOT_AVAILABLE');
    input = {commandId:event.commandId,
      source:{surface:event.surface === 'touch'?'touch':'keyboard',inputDigest:digest(event.controlId!)},
      selection:{semanticId:c.semanticId,args:{...c.args}}, expectedVersions:event.expectedVersions};
  }
  const compiled = compileVisualCommand(input, ctx.compiled);
  if (compiled.outcome !== 'candidate')
    return refusal(compiled.reasonCode, compiled.outcome === 'clarification_required' ? 'clarification_required' : 'refused');
  const command = compiled.command;
  const verb = UI_MEANING.exec(command.semanticRef.id)?.[1] as UiAuthorOperation['verb'] | undefined;
  if (!verb || command.target.owner !== 'ui_document' || command.risk.source !== 'ui_contract')
    return refusal('NOT_REVIEWED_UI_AUTHORING');
  const meanings = ctx.meanings.filter(m => m.semanticId === command.semanticRef.id && m.status === 'current' &&
    m.sourceHash === command.semanticRef.sourceHash);
  if (meanings.length !== 1) return refusal('HQ_MEANING_NOT_CURRENT');
  if (command.risk.level === 'R3') return refusal('R3_REFUSED');
  if (command.risk.level === 'R2' && ctx.device === 'phone')
    return refusal('R2_PHONE_APPROVAL_NOT_ALLOWED');
  const args = command.args;
  if (!validArgs(args) || typeof args.target_ref !== 'string' || !REF.test(args.target_ref) ||
    args.target_kind === undefined ||
    !(['object','document'] as readonly string[]).includes(args.target_kind)) return refusal('MISSING_TYPED_TARGET');
  if (args.target_kind === 'document' && args.target_ref !== ctx.scope.documentId)
    return refusal('DOCUMENT_TARGET_MISMATCH');
  if (!ctx.targets.some(t=>t.kind===args.target_kind && t.ref===args.target_ref))
    return refusal('UNRESOLVED_CANONICAL_TARGET');
  const operation: UiAuthorOperation = {
    schema:'vivim.ui-author-operation/1', semanticRef:command.semanticRef.id, verb,
    target:{kind:args.target_kind as 'object'|'document',ref:args.target_ref}, args:{...args},
  };
  const semanticDigest = digest(JSON.stringify({
    scope:{ownerId:ctx.scope.ownerId,actorId:ctx.scope.actorId,worldId:ctx.scope.worldId,documentId:ctx.scope.documentId},
    expectedRevision:ctx.revision,documentDigest:ctx.documentDigest,semanticRef:command.semanticRef,
    target:command.target,args:Object.entries(args).sort(),risk:command.risk,
    pins:Object.entries(command.sourceVersions).sort(),operation,
  }));
  return {outcome:'candidate',operation,command,semanticDigest,scope:{...ctx.scope},
    expectedRevision:ctx.revision,expectedDocumentDigest:ctx.documentDigest,
    evidenceClass:'inert-compiler-candidate',publisher:'none',effectInvoked:false,approved:false,
    hostAuthorizationRequired:true,automaticRetryAllowed:false};
}
/** Only semantic (not source transport/device) identity participates in parity. */
export function sameLaneASemantics(a: AuthorResult, b: AuthorResult): boolean {
  return a.outcome === 'candidate' && b.outcome === 'candidate' && a.semanticDigest === b.semanticDigest;
}
