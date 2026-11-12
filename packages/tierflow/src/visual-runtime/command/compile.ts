import { ACTION_ID, DIGEST, SEMANTIC_ID, VISUAL_COMMAND_SCHEMA, onlyKeys, safeRecord, validArgs, validPins, refusal,
  type CommandInput, type Compilation, type VersionPins, type VisualCommand } from './ir.ts';
import { checkArguments, resolveCrosswalk, validRow, type ActionDescriptor, type CrosswalkRow } from './crosswalk.ts';

export type CompileContext = {
  /** Supplied by a trusted integration broker; not derived from owner input/AI. */
  rows: readonly CrosswalkRow[];
  descriptors: readonly ActionDescriptor[];
  currentVersions: VersionPins;
};
const MAX_INPUT_BYTES = 4096;
const dangerousText = /(?:!\s*(?:run|use|design)\b|\b(?:sudo|powershell|cmd\.exe|bash\s+-c|sh\s+-c|argv|send\s+to\s+provider)\b|[;&|`]|\b(?:and\s+then|after\s+that)\b)/i;
function decodeText(text: string): { semanticId: string; args: Record<string,string> } | null {
  // Closed canonical grammar: /semantic.id@1 key="JSON string" key2="JSON string".
  const match = /^\/([a-z0-9][a-z0-9._-]{0,94}@\d+(?:\.\d+)*)/.exec(text);
  if (!match) return null;
  const semanticId = match[1]!;
  const args: Record<string,string> = Object.create(null);
  let rest = text.slice(match[0].length);
  while (rest.length) {
    const m = /^ ([a-z][a-z0-9_]{0,39})=("(?:[^"\\\u0000-\u001f]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*")/.exec(rest);
    if (!m || Object.hasOwn(args, m[1]!)) return null;
    let value: unknown;
    try { value = JSON.parse(m[2]!); } catch { return null; }
    if (typeof value !== 'string') return null;
    args[m[1]!] = value;
    rest = rest.slice(m[0].length);
  }
  return { semanticId, args };
}
/** Safe human-accessible representation; never a shell command. */
export function toExactText(semanticId: string, args: Readonly<Record<string,string>>): string | null {
  if (!SEMANTIC_ID.test(semanticId) || !validArgs(args)) return null;
  return '/' + semanticId + Object.keys(args).sort().map(k => ' ' + k + '=' + JSON.stringify(args[k])).join('');
}
function checkedInput(value: unknown): value is CommandInput {
  if (!onlyKeys(value, ['commandId','source','text','selection','aiProposal','expectedVersions']) ||
    typeof value.commandId !== 'string' || !/^[A-Za-z0-9._:-]{1,80}$/.test(value.commandId) ||
    !onlyKeys(value.source, ['surface','inputDigest']) ||
    !['text','touch','keyboard'].includes(value.source.surface as string) ||
    typeof value.source.inputDigest !== 'string' || !DIGEST.test(value.source.inputDigest) ||
    (value.expectedVersions !== undefined && !validPins(value.expectedVersions)) ||
    (value.text !== undefined && (typeof value.text !== 'string' || value.text.length > 2048)) ||
    (value.selection !== undefined && (!onlyKeys(value.selection, ['semanticId','args']) ||
      typeof value.selection.semanticId !== 'string' || !SEMANTIC_ID.test(value.selection.semanticId) ||
      !validArgs(value.selection.args))) ||
    (value.aiProposal !== undefined && (!onlyKeys(value.aiProposal, ['semanticId','args']) ||
      typeof value.aiProposal.semanticId !== 'string' || !SEMANTIC_ID.test(value.aiProposal.semanticId) ||
      !validArgs(value.aiProposal.args)))) return false;
  return (value.source.surface === 'text' && typeof value.text === 'string' && value.selection === undefined) ||
    (value.source.surface !== 'text' && value.text === undefined && value.selection !== undefined && value.aiProposal === undefined);
}
function comparePins(expected: VersionPins | undefined, current: VersionPins): boolean {
  return !expected || Object.entries(expected).every(([k,v]) => current[k as keyof VersionPins] === v);
}
function validContext(value: unknown): value is CompileContext {
  return onlyKeys(value, ['rows','descriptors','currentVersions']) &&
    Array.isArray(value.rows) && Array.isArray(value.descriptors) && value.rows.length <= 64 && value.descriptors.length <= 64 &&
    validPins(value.currentVersions) && value.rows.every(validRow);
}
/** Pure compilation: no KB reads, Host calls, side effects, approvals or executor fallback. */
export function compileVisualCommand(input: unknown, context: unknown): Compilation {
  if (!checkedInput(input)) return refusal('INVALID_INPUT');
  // Guard size before parsing/selection; safeInput ensures own data-only fields.
  if (new TextEncoder().encode(JSON.stringify(input)).length > MAX_INPUT_BYTES) return refusal('INPUT_TOO_LARGE');
  if (!validContext(context)) return refusal('INVALID_CONTEXT');
  if (!comparePins(input.expectedVersions, context.currentVersions)) return refusal('STALE_SOURCE_VERSION');
  let selected: { semanticId: string; args: Record<string,string> } | null = null;
  if (input.source.surface === 'text') {
    const text = input.text!;
    if (dangerousText.test(text) || /\b(?:do not|don't|never|not|without|instead of)\b/i.test(text))
      return refusal('UNSAFE_OR_COMPOUND_TEXT');
    selected = decodeText(text);
    if (!selected) {
      const aliases = context.rows.filter(row => row.textAliases?.includes(text));
      if (aliases.length > 1) return refusal('AMBIGUOUS_TEXT', 'clarification_required');
      if (aliases.length === 1) selected = { semanticId: aliases[0]!.semanticRef.id, args: Object.create(null) };
    }
    if (!selected) return refusal('UNKNOWN_TEXT', 'clarification_required');
  } else {
    selected = input.selection!;
  }
  if (!validArgs(selected.args)) return refusal('UNSAFE_ARGUMENTS');
  const crosswalk = resolveCrosswalk(selected.semanticId, context.rows, context.descriptors);
  if (!crosswalk.ok) return refusal(crosswalk.reasonCode, crosswalk.reasonCode === 'AMBIGUOUS_MAPPING' ? 'clarification_required' : 'refused');
  if (!checkArguments(selected.args, crosswalk.row.argsSchema)) return refusal('INVALID_ARGUMENTS');
  if (crosswalk.row.target.owner === 'host_effect' && crosswalk.row.risk === 'R3') return refusal('R3_REFUSED');
  if (crosswalk.descriptor.capability.supportedByBuild === false || crosswalk.descriptor.capability.availableNow === 'no')
    return refusal('CAPABILITY_UNAVAILABLE');
  if (crosswalk.descriptor.capability.permittedForActor === 'no') return refusal('CAPABILITY_DENIED');
  if (input.aiProposal) {
    // The AI never chooses a different meaning or arguments from the exact owner text.
    if (selected.semanticId !== input.aiProposal.semanticId ||
        JSON.stringify(Object.entries(selected.args).sort()) !== JSON.stringify(Object.entries(input.aiProposal.args).sort()))
      return refusal('CONFLICTING_AI_PROPOSAL');
  }
  const { row, descriptor } = crosswalk;
  const command: VisualCommand = {
    schema: VISUAL_COMMAND_SCHEMA,
    commandId: input.commandId,
    source: { surface: input.source.surface, inputDigest: input.source.inputDigest },
    semanticRef: { ...row.semanticRef }, target: { ...row.target },
    args: Object.fromEntries(Object.keys(selected.args).sort().map(k => [k, selected.args[k]!])),
    risk: { level: row.risk, source: row.riskSource.authority, sourceHash: row.riskSource.sourceHash },
    sourceVersions: { ...context.currentVersions },
    interpretation: { method: input.aiProposal ? 'bounded-ai-proposal' : input.source.surface === 'text' ? 'exact-text' : 'explicit-selector', outcome: 'candidate', reasonCodes: [] },
    capability: { ...descriptor.capability, reasonCodes: [...descriptor.capability.reasonCodes] },
  };
  return { outcome: 'candidate', command };
}
