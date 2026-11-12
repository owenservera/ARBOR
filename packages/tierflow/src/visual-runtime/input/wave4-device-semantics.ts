/**
 * Wave 4 C — inert, cross-device input normalization for the SAME Wave 3 UI document.
 * Trust boundary: `DeviceInput` is untrusted. `DeviceInputContext` is broker assembled,
 * not serialized from a browser/phone. A/B and G retain schema/action authority.
 * No listeners, Host calls, approval issuance, storage, transport or effect execution.
 */
import { createHash } from 'node:crypto';
import type { Wave3ActionSemantics } from '../document/wave3-action-semantics.ts';
import type { CanonicalComponentProjection } from '../components/wave3-canonical-map.ts';
import type { CommandInput, VersionPins, VisualCommand } from '../command/ir.ts';
import type { DescriptorProofContext, DescriptorProofResult } from '../command/wave3-descriptor-proof.ts';

export const WAVE4_DEVICE_INPUT_SCHEMA = 'vivim.wave4-device-input/1' as const;
export const WAVE4_INPUT_VIEWPORTS = [320, 360, 1280] as const;
type Device = 'desktop' | 'phone';
type ActivationMethod = 'touch' | 'keyboard' | 'accessibility';
type NoEffect = Readonly<{ effectInvoked: false; authorized: false; automaticRetryAllowed: false }>;

/** Values are trusted UI-binding projections, not an alternative command catalog. */
export type TrustedControlBinding = Readonly<{
  componentId: string;
  sourceNodeId: string;
  action: Readonly<{ id: string; version: number }>;
  semanticId: string;
  args: Readonly<Record<string, string>>;
  enabled: boolean;
  visible: boolean;
  focusable: boolean;
  touchTargetPx: number;
  requiresConfirmation: boolean;
}>;
export type TrustedConfirmation = Readonly<{
  status: 'acknowledged' | 'lost' | 'cancelled';
  commandId: string;
  semanticId: string;
  documentRevision: number;
  hostWorld: string;
  policy: string;
}>;
/** The producer MUST supply these from A/B, the Host-catalog review broker and its own
 * focus/pending/confirmation state. Nothing in an input event can set a grant. */
export type DeviceInputContext = Readonly<{
  projection: Wave3ActionSemantics;
  components: CanonicalComponentProjection;
  descriptors: DescriptorProofContext;
  device: Device;
  controls: readonly TrustedControlBinding[];
  focusedComponentId: string | null;
  seenCommandIds: readonly string[];
  pendingComponentIds: readonly string[];
  confirmation: TrustedConfirmation | null;
  /** Must be the real, imported Wave 3 G compiler supplied by the integration broker. */
  compile: (input: unknown, context: unknown) => DescriptorProofResult;
}>;

type Base = Readonly<{
  schema: typeof WAVE4_DEVICE_INPUT_SCHEMA;
  device: Device;
  viewportPx: number;
  expectedRevision: number;
  expectedVersions: VersionPins;
}>;
export type DeviceInput =
  | (Base & Readonly<{ kind: 'text'; commandId: string; text: string }>)
  | (Base & Readonly<{ kind: 'activate'; method: ActivationMethod; commandId: string;
      componentId: string; key?: 'Enter' | 'Space'; repeat?: boolean }>)
  | (Base & Readonly<{ kind: 'navigate'; key: 'Tab' | 'ShiftTab' | 'Escape' }>)
  | (Base & Readonly<{ kind: 'cancel' }>)
  | (Base & Readonly<{ kind: 'gesture'; gesture: 'pinch' | 'swipe' | 'long-press' | 'double-tap'; componentId?: string }>);

export type SemanticIdentity = Readonly<Pick<VisualCommand,
  'semanticRef' | 'target' | 'args' | 'risk' | 'sourceVersions' | 'capability'>>;
export type DeviceInputResult =
  | (NoEffect & Readonly<{ outcome: 'candidate'; command: VisualCommand; semantic: SemanticIdentity;
      commandId: string; evidenceClass: 'inert-wave3-g-candidate'; hostAuthorizationRequired: true }>)
  | (NoEffect & Readonly<{ outcome: 'navigation'; focusComponentId: string | null; exitToShell: boolean }>)
  | (NoEffect & Readonly<{ outcome: 'cancelled'; focusComponentId: string | null }>)
  | (NoEffect & Readonly<{ outcome: 'refused'; reasonCode: string }>);

const noEffect = { effectInvoked: false, authorized: false, automaticRetryAllowed: false } as const;
const refuse = (reasonCode: string): DeviceInputResult => ({ outcome: 'refused', reasonCode, ...noEffect });
const ID = /^[A-Za-z0-9._:-]{1,80}$/;
const LABEL_SECRET = /(?:\bBearer\s+\S+|\b(?:password|secret|access[_ -]?token|api[_ -]?key)\s*[:=]|\b(?:gh[pousr]_|sk-(?:proj-)?)[A-Za-z0-9_-]{10,})/i;
const safeName = (value: unknown): value is string => typeof value === 'string' &&
  value.trim().length > 0 && value.length <= 160 && !/[<>\u0000-\u001f\u007f]/.test(value) && !LABEL_SECRET.test(value);
const own = (v: unknown): v is Record<string, unknown> => {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return (proto === Object.prototype || proto === null) &&
    Object.values(Object.getOwnPropertyDescriptors(v)).every(d => 'value' in d);
};
const exact = (v: unknown, keys: readonly string[]): v is Record<string, unknown> =>
  own(v) && Object.keys(v).every(k => keys.includes(k));
const isDataObject = (v: unknown): boolean => own(v);
const sha = (v: string): string => createHash('sha256').update(v, 'utf8').digest('hex');
const validCommandId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);
function stableArgs(args: Readonly<Record<string,string>>): string {
  return JSON.stringify(Object.keys(args).sort().map(k => [k, args[k]]));
}
function validInput(v: unknown): v is DeviceInput {
  if (!own(v) || v.schema !== WAVE4_DEVICE_INPUT_SCHEMA ||
      !['desktop', 'phone'].includes(v.device as string) ||
      !Number.isInteger(v.viewportPx) || (v.viewportPx as number) < 240 || (v.viewportPx as number) > 3840 ||
      !Number.isSafeInteger(v.expectedRevision) || (v.expectedRevision as number) < 0 ||
      !exact(v.expectedVersions, ['hostWorld','policy','kb','uiRevision']) ||
      typeof v.expectedVersions.hostWorld !== 'string' || typeof v.expectedVersions.policy !== 'string' ||
      typeof v.expectedVersions.kb !== 'string' || typeof v.expectedVersions.uiRevision !== 'string' ||
      Object.values(v.expectedVersions).some(p => typeof p !== 'string' || p.length < 1 || p.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(p))) return false;
  if (v.kind === 'text') return exact(v, ['schema','device','viewportPx','expectedRevision','expectedVersions','kind','commandId','text']) &&
    validCommandId(v.commandId) && typeof v.text === 'string' && v.text.length > 0 && v.text.length <= 2048;
  if (v.kind === 'activate') return exact(v, ['schema','device','viewportPx','expectedRevision','expectedVersions','kind','method','commandId','componentId','key','repeat']) &&
    ['touch','keyboard','accessibility'].includes(v.method as string) && validCommandId(v.commandId) &&
    validCommandId(v.componentId) && (v.key === undefined || v.key === 'Enter' || v.key === 'Space') &&
    (v.repeat === undefined || typeof v.repeat === 'boolean') &&
    (v.method === 'keyboard' ? (v.key === 'Enter' || v.key === 'Space') : v.key === undefined) &&
    (v.method === 'keyboard' || v.repeat === undefined);
  if (v.kind === 'navigate') return exact(v, ['schema','device','viewportPx','expectedRevision','expectedVersions','kind','key']) &&
    ['Tab','ShiftTab','Escape'].includes(v.key as string);
  if (v.kind === 'cancel') return exact(v, ['schema','device','viewportPx','expectedRevision','expectedVersions','kind']);
  if (v.kind === 'gesture') return exact(v, ['schema','device','viewportPx','expectedRevision','expectedVersions','kind','gesture','componentId']) &&
    ['pinch','swipe','long-press','double-tap'].includes(v.gesture as string) &&
    (v.componentId === undefined || validCommandId(v.componentId));
  return false;
}
/** Strictly compare the active A and B identities, not their convenient aliases. */
function controlsOf(c: DeviceInputContext): readonly TrustedControlBinding[] | null {
  const a = c.projection, b = c.components;
  if (a.schema !== 'vivim.wave3-action-semantics/1' || b.schema !== 'vivim.ui-component-map/1' ||
    a.executable !== false || a.readOnly !== true || b.authority !== 'inert-display-only' ||
    a.documentId !== b.documentId || a.revision !== b.revision ||
    !Array.isArray(a.canonical.nodes) || !Array.isArray(b.sourceRefs) || !Array.isArray(b.focusOrder) ||
    !Array.isArray(b.actionRefs) || !Array.isArray(c.controls) || c.controls.length > 64 ||
    !Array.isArray(b.viewports) || WAVE4_INPUT_VIEWPORTS.some(v => !b.viewports.some(p => p.viewportPx === v))) return null;
  const focus = new Set(b.focusOrder);
  if (focus.size !== b.focusOrder.length || c.controls.length !== focus.size) return null;
  const seen = new Set<string>();
  for (const control of c.controls) {
    if (!isDataObject(control) || !validCommandId(control.componentId) || !validCommandId(control.sourceNodeId) ||
      seen.has(control.componentId) || !focus.has(control.componentId) ||
      !isDataObject(control.action) || typeof control.action.id !== 'string' ||
      !Number.isSafeInteger(control.action.version) || control.action.version < 1 ||
      typeof control.semanticId !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,94}@\d+(?:\.\d+)*$/.test(control.semanticId) ||
      !isDataObject(control.args) || Object.keys(control.args).length > 16 ||
      Object.values(control.args).some(v => typeof v !== 'string') ||
      typeof control.enabled !== 'boolean' || typeof control.visible !== 'boolean' ||
      typeof control.focusable !== 'boolean' || typeof control.requiresConfirmation !== 'boolean' ||
      !Number.isInteger(control.touchTargetPx) || control.touchTargetPx < 44 || control.touchTargetPx > 256) return null;
    seen.add(control.componentId);
    const src = b.sourceRefs.find(r => r.id === control.componentId && r.sourceId === control.sourceNodeId);
    const node = a.canonical.nodes.find(n => n.id === control.sourceNodeId);
    const actions = b.actionRefs.filter(r => r.sourceNodeId === control.sourceNodeId);
    const ref = a.references.find(r => r.kind === 'action' && r.nodeId === control.sourceNodeId &&
      r.id === control.action.id && r.version === control.action.version);
    if (!src || !node || node.type !== 'button' || node.a11y.role !== 'button' ||
        !safeName(node.a11y.name) || !safeName(src.canonicalA11y.name) ||
        node.a11y.name !== src.canonicalA11y.name || !safeName(node.props.label) ||
        node.actionRefs?.length !== 1 || node.actionRefs[0]?.id !== control.action.id ||
        node.actionRefs[0]?.version !== control.action.version || actions.length !== 1 ||
        actions[0]?.id !== control.action.id || actions[0]?.version !== control.action.version ||
        !ref || !ref.inert || src.sourceType !== 'button') return null;
  }
  return b.focusOrder.every(id => seen.has(id)) ? c.controls : null;
}
function validContext(c: unknown): c is DeviceInputContext {
  return exact(c, ['projection','components','descriptors','device','controls','focusedComponentId',
    'seenCommandIds','pendingComponentIds','confirmation','compile']) &&
    (c.device === 'desktop' || c.device === 'phone') &&
    typeof c.compile === 'function' &&
    own(c.descriptors) && c.descriptors.deviceSurface === c.device &&
    own(c.descriptors.currentVersions) &&
    Array.isArray(c.seenCommandIds) && c.seenCommandIds.length <= 256 && c.seenCommandIds.every(validCommandId) &&
    Array.isArray(c.pendingComponentIds) && c.pendingComponentIds.length <= 64 && c.pendingComponentIds.every(validCommandId) &&
    (c.focusedComponentId === null || validCommandId(c.focusedComponentId)) &&
    (c.confirmation === null || (exact(c.confirmation, ['status','commandId','semanticId','documentRevision','hostWorld','policy']) &&
      ['acknowledged','lost','cancelled'].includes(c.confirmation.status as string) &&
      validCommandId(c.confirmation.commandId) && typeof c.confirmation.semanticId === 'string' &&
      Number.isSafeInteger(c.confirmation.documentRevision) && typeof c.confirmation.hostWorld === 'string' &&
      typeof c.confirmation.policy === 'string')) &&
    own(c.projection) && own(c.components);
}
function versionsEqual(a: VersionPins, b: VersionPins): boolean {
  return ['hostWorld','policy','kb','uiRevision'].every(k => a[k as keyof VersionPins] === b[k as keyof VersionPins]);
}
function candidate(input: CommandInput, c: DeviceInputContext, control: TrustedControlBinding | null): DeviceInputResult {
  let result: DescriptorProofResult;
  try { result = c.compile(input, c.descriptors); }
  catch { return refuse('COMPILER_UNAVAILABLE'); }
  if (result.outcome !== 'candidate') return refuse(result.reasonCode);
  const cmd = result.command;
  if (cmd.schema !== 'vivim.visual-command/1' || result.evidence.effectInvoked !== false ||
    result.evidence.liveHostVerified !== false || result.evidence.hostAuthorizationRequired !== true ||
    result.evidence.deviceSurface !== c.device || !versionsEqual(cmd.sourceVersions, c.descriptors.currentVersions) ||
    cmd.commandId !== input.commandId || cmd.source.surface !== input.source.surface ||
    cmd.source.inputDigest !== input.source.inputDigest ||
    (control !== null && (cmd.semanticRef.id !== control.semanticId || stableArgs(cmd.args) !== stableArgs(control.args))) ||
    cmd.risk.level === 'R3' || (c.device === 'phone' && cmd.risk.level === 'R2')) return refuse('COMMAND_CONTRACT_MISMATCH');
  // A confirmation is merely a gesture receipt; it can NEVER satisfy Host consent.
  if (cmd.risk.level !== 'R0' || control?.requiresConfirmation) {
    const conf = c.confirmation;
    if (!conf || conf.status !== 'acknowledged' || conf.commandId !== cmd.commandId ||
      conf.semanticId !== cmd.semanticRef.id || conf.documentRevision !== c.projection.revision ||
      conf.hostWorld !== cmd.sourceVersions.hostWorld || conf.policy !== cmd.sourceVersions.policy)
      return refuse('CONFIRMATION_MISSING_OR_LOST');
  }
  return { outcome: 'candidate', command: cmd, commandId: cmd.commandId,
    semantic: {semanticRef: cmd.semanticRef, target: cmd.target, args: cmd.args,
      risk: cmd.risk, sourceVersions: cmd.sourceVersions, capability: cmd.capability},
    evidenceClass: 'inert-wave3-g-candidate', hostAuthorizationRequired: true, ...noEffect };
}
/** No side effects. Events cannot inject a role, action, semantic ID, risk or approval. */
export function normalizeWave4DeviceInput(event: unknown, trusted: unknown): DeviceInputResult {
  if (!validInput(event)) return refuse('INVALID_DEVICE_INPUT');
  if (!validContext(trusted)) return refuse('INVALID_TRUSTED_CONTEXT');
  const c = trusted;
  if (event.device !== c.device || event.expectedRevision !== c.projection.revision ||
    !versionsEqual(event.expectedVersions, c.descriptors.currentVersions)) return refuse('STALE_OR_FOREIGN_DEVICE_CONTEXT');
  const controls = controlsOf(c);
  if (!controls) return refuse('INVALID_CANONICAL_FOCUS_BINDINGS');
  if (event.kind === 'cancel' || (event.kind === 'navigate' && event.key === 'Escape'))
    return {outcome:'cancelled', focusComponentId:c.focusedComponentId,...noEffect};
  if (event.kind === 'gesture') return refuse('UNSUPPORTED_GESTURE');
  const reachable = c.components.focusOrder.filter(id => {
    const control = controls.find(x => x.componentId === id);
    return control?.enabled && control.visible && control.focusable;
  });
  if (event.kind === 'navigate') {
    const position = c.focusedComponentId === null ? -1 : reachable.indexOf(c.focusedComponentId);
    if (c.focusedComponentId !== null && position === -1) return refuse('INVISIBLE_OR_DISABLED_FOCUS');
    const next = event.key === 'Tab' ? position + 1 : position === -1 ? reachable.length - 1 : position - 1;
    if (next < 0 || next >= reachable.length)
      return {outcome:'navigation', focusComponentId:null, exitToShell:true,...noEffect};
    return {outcome:'navigation', focusComponentId:reachable[next]!, exitToShell:false,...noEffect};
  }
  if (event.kind === 'activate' && event.method === 'keyboard' && event.repeat === true) return refuse('REPEATED_KEY_ACTIVATION');
  if (c.seenCommandIds.includes(event.commandId)) return refuse('DUPLICATE_ACTIVATION');
  if (event.kind === 'text') {
    // The G compiler owns parsing/negation/risk. Input is never reinterpreted here.
    if (c.pendingComponentIds.length > 0) return refuse('PENDING_ACTIVATION');
    return candidate({ commandId:event.commandId, source:{surface:'text',inputDigest:sha(event.text)},
      text:event.text, expectedVersions:event.expectedVersions },c,null);
  }
  const control = controls.find(x => x.componentId === event.componentId);
  if (!control) return refuse('UNSUPPORTED_CONTROL');
  if (!control.visible || !control.enabled || !control.focusable ||
    !reachable.includes(event.componentId)) return refuse('INVISIBLE_OR_DISABLED_FOCUS');
  if (event.method === 'keyboard' && c.focusedComponentId !== event.componentId)
    return refuse('UNFOCUSED_KEY_ACTIVATION');
  if (c.pendingComponentIds.includes(control.componentId)) return refuse('PENDING_ACTIVATION');
  const surface = event.method === 'keyboard' || (event.method === 'accessibility' && c.device === 'desktop')
    ? 'keyboard' : 'touch';
  const digest = sha(JSON.stringify([event.commandId, control.componentId, control.semanticId, stableArgs(control.args)]));
  return candidate({ commandId:event.commandId, source:{surface,inputDigest:digest},
    selection:{semanticId:control.semanticId,args:{...control.args}}, expectedVersions:event.expectedVersions },c,control);
}