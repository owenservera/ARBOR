/**
 * Final Wave Lane F: inert compatibility diagnostics for the EXISTING Windows
 * Tauri shell and Android APK / relay. Never publishes, navigates, authenticates,
 * reads private KB data, or dispatches an action. Not a replacement phone adapter.
 *
 * Existing contract imports are type-only: Wave 4 A/B remain the actual owners.
 */
import type { UiDocument } from '../../document/schema.ts';
import type { Wave3RenderResult } from '../../render/wave3-semantics.ts';
import type { DesktopAdapterResult } from '../../device/wave4-desktop-adapter.ts';
import type { PhoneProjection, PhoneProjectionInput } from '../../device/wave4-phone-adapter.ts';

export const LANE_F_EXISTING_CLIENTS_SCHEMA = 'vivim.final-wave.existing-clients/1' as const;
export const EXISTING_CLIENT_IDENTITIES = Object.freeze({
  windows: 'com.vivim.host', android: 'inc.vivim.app',
  windowsMount: 'world-view', androidShell: 'existing-vivim-apk',
  relay: 'existing-mobile-relay', publisher: 'harness', minAndroidSdk: 26,
});

export type RootCompatibility = 'WAVE4B_WRAPPER_DEFECT' | 'CANONICAL_DIRECT_ROOT' |
  'UNDECLARED_ROOT' | 'WRAPPER_ALIAS' | 'EXTRA_RENDER_CHILDREN' |
  'MISSING_RENDER_ROOT' | 'DUPLICATE_RENDER_ID' | 'RENDER_REFUSED';
export interface RootDiagnosis {
  readonly schema: typeof LANE_F_EXISTING_CLIENTS_SCHEMA;
  readonly compatibility: RootCompatibility;
  readonly canonicalRootId: string | null;
  readonly renderedRootId: string | null;
  /**
   * Whether the Wave 4 B root guard still refuses this render shape and therefore
   * still needs its owner patch. The owner-authorized patch
   * (FINAL-WAVE/LANE-F/WAVE4B-REPAIR-PROPOSAL.patch) is APPLIED by the master
   * integration: the guard now accepts a DECLARED canonical root that is present in
   * the sanitized render tree. This flag reports the REPAIRED predicate, so it is
   * false whenever the applied repair is sufficient and true only if it is not.
   */
  readonly requiresWave4BOwnerPatch: boolean;
  /** Whether the applied (repaired) Wave 4 B guard accepts this render shape. */
  readonly repairedGuardAccepts: boolean;
  readonly executable: false;
}
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/;
function safeId(value: unknown): value is string {
  return typeof value === 'string' && IDENTIFIER.test(value) &&
    !['__proto__', 'constructor', 'prototype'].includes(value);
}

/**
 * Identify the real Wave 3 synthetic root mismatch, without mutating its DOM
 * tree or relaxing Wave 4 B's current refusal. Only the Wave 4 owner may patch B.
 */
export function diagnoseWave4BRoot(canonical: UiDocument, rendered: Wave3RenderResult): RootDiagnosis {
  const docRoot = canonical?.rootId;
  const root = rendered?.plan?.root;
  // The applied Wave 4 B repair accepts iff the canonical root is a DECLARED node
  // AND is present in the sanitized render tree. Computed here so the diagnosis
  // stays a pure function and never claims a repair that is not sufficient.
  const repairedAccepts = !!docRoot && Array.isArray(canonical?.nodes) &&
    canonical.nodes.some(n => n.id === docRoot) &&
    !!root && Array.isArray(root.children) &&
    (root.id === docRoot || root.children.some(c => !!c && typeof c === 'object' &&
      'id' in c && (c as { id: string }).id === docRoot));
  const result = (compatibility: RootCompatibility): RootDiagnosis => Object.freeze({
    schema: LANE_F_EXISTING_CLIENTS_SCHEMA, compatibility,
    canonicalRootId: safeId(docRoot) ? docRoot : null,
    renderedRootId: safeId(root?.id) ? root.id : null,
    requiresWave4BOwnerPatch: compatibility === 'WAVE4B_WRAPPER_DEFECT' && !repairedAccepts,
    repairedGuardAccepts: repairedAccepts,
    executable: false as const,
  });
  if (!safeId(docRoot) || !Array.isArray(canonical?.nodes) ||
      !canonical.nodes.some(n => n.id === docRoot)) return result('UNDECLARED_ROOT');
  if (!rendered || rendered.refusalCode !== null || rendered.status === 'unavailable' ||
      rendered.sourceSchema !== 'vivim.ui-document/1' ||
      rendered.plan?.documentId !== canonical.documentId ||
      rendered.plan?.revision !== canonical.revision || !root) return result('RENDER_REFUSED');
  const found = new Set<string>();
  const pending: Array<{ id: string; children: readonly unknown[] }> = [root];
  while (pending.length) {
    if (found.size >= 96) return result('DUPLICATE_RENDER_ID');
    const node = pending.pop();
    if (!node || !safeId(node.id) || found.has(node.id) || !Array.isArray(node.children))
      return result('DUPLICATE_RENDER_ID');
    found.add(node.id);
    for (const child of node.children) {
      if (!child || typeof child !== 'object' || !('id' in child) || !('children' in child))
        return result('DUPLICATE_RENDER_ID');
      pending.push(child as { id: string; children: readonly unknown[] });
    }
  }
  if (root.id === docRoot) return result('CANONICAL_DIRECT_ROOT');
  if (root.id !== 'render_root') return result('MISSING_RENDER_ROOT');
  // A canonical source must NEVER co-opt the renderer's synthetic alias.
  if (docRoot === 'render_root' || canonical.nodes.some(n => n.id === 'render_root'))
    return result('WRAPPER_ALIAS');
  if (root.children.length !== 1 || rendered.plan.spatial?.present)
    return result('EXTRA_RENDER_CHILDREN');
  if (root.children[0]?.id !== docRoot || !found.has(docRoot)) return result('MISSING_RENDER_ROOT');
  return result('WAVE4B_WRAPPER_DEFECT');
}

export type ParityRefusal = 'NONE' | 'RENDER_ROOT_BLOCKED' | 'WINDOWS_REFUSED' |
  'PHONE_REFUSED' | 'FOREIGN_SCOPE' | 'STALE_REVISION' | 'FOCUS_MISMATCH' |
  'UNSAFE_ACCESSIBILITY' | 'UNSUPPORTED_VIEWPORT' | 'DUPLICATE_PUBLISHER';
export interface ClientParityReport {
  readonly schema: typeof LANE_F_EXISTING_CLIENTS_SCHEMA;
  readonly fixtureParity: 'matched' | 'blocked';
  readonly refusal: ParityRefusal;
  readonly root: RootDiagnosis;
  readonly windows: 'projection-ready' | 'refused';
  readonly android: 'projection-ready' | 'refused';
  readonly nativeAcceptance: 'UNRUN';
  readonly canPublish: false;
  readonly canApprove: false;
  readonly canExecute: false;
  readonly retryEffectAutomatically: false;
}
export interface ClientParityInput {
  readonly canonical: UiDocument;
  readonly rendered: Wave3RenderResult;
  readonly desktop: DesktopAdapterResult;
  readonly phone: PhoneProjection;
  readonly phoneInput: PhoneProjectionInput;
  readonly windowsViewportPx: number;
}

/** Compare actual Wave 4 read projections; never synthesize a success view. */
export function assessExistingClientParity(input: ClientParityInput): ClientParityReport {
  const root = diagnoseWave4BRoot(input.canonical, input.rendered);
  const desktopReady = input.desktop?.ok === true;
  const phoneReady = input.phone?.status === 'ready' && input.phone?.refusalCode === null;
  function result(refusal: ParityRefusal): ClientParityReport {
    return Object.freeze({ schema: LANE_F_EXISTING_CLIENTS_SCHEMA,
      fixtureParity: refusal === 'NONE' ? 'matched' as const : 'blocked' as const,
      refusal, root, windows: desktopReady ? 'projection-ready' as const : 'refused' as const,
      android: phoneReady ? 'projection-ready' as const : 'refused' as const,
      nativeAcceptance: 'UNRUN' as const,
      canPublish: false as const, canApprove: false as const, canExecute: false as const,
      retryEffectAutomatically: false as const });
  }
  // The applied Wave 4 B repair accepts the real renderer's synthetic wrapper, so the
  // wrapper SHAPE is no longer a blocker by itself: the real phone projection is the
  // authority on whether the phone can render. Every genuinely hostile shape (an
  // undeclared or aliased canonical root, a duplicate render id, a refused plan,
  // extra spatial children) still fails closed.
  if (input.phone?.refusalCode === 'UNSAFE_RENDER') return result('RENDER_ROOT_BLOCKED');
  if (root.compatibility !== 'WAVE4B_WRAPPER_DEFECT' && root.compatibility !== 'CANONICAL_DIRECT_ROOT')
    return result('PHONE_REFUSED');
  if (!desktopReady) return result('WINDOWS_REFUSED');
  if (!phoneReady) return result('PHONE_REFUSED');
  const d = input.desktop.view;
  const p = input.phone;
  const phoneInput = input.phoneInput;
  if (d.native.existingPublisher !== 'harness' || p.publisher !== 'harness' ||
      phoneInput.shell.publisher !== 'harness') return result('DUPLICATE_PUBLISHER');
  if (input.windowsViewportPx !== d.plan.viewportPx || input.windowsViewportPx < 800 ||
      ![320,360].includes(p.viewportPx) || phoneInput.shell.viewportPx !== p.viewportPx)
    return result('UNSUPPORTED_VIEWPORT');
  if (d.identity.ownerRef !== input.canonical.scope.ownerRef ||
      p.identity?.ownerRef !== input.canonical.scope.ownerRef ||
      d.identity.worldRef !== phoneInput.pairing.worldRef ||
      p.identity?.worldRef !== phoneInput.pairing.worldRef ||
      p.identity?.deviceRef !== phoneInput.pairing.deviceRef) return result('FOREIGN_SCOPE');
  if (d.identity.documentId !== input.canonical.documentId ||
      p.documentId !== input.canonical.documentId ||
      d.identity.revision !== input.canonical.revision ||
      p.revision !== input.canonical.revision ||
      phoneInput.host.documentRevision !== input.canonical.revision)
    return result('STALE_REVISION');
  if (JSON.stringify(d.focus.order) !== JSON.stringify(p.focusOrder) ||
      JSON.stringify(p.focusOrder) !== JSON.stringify(input.rendered.plan.focusOrder))
    return result('FOCUS_MISMATCH');
  const pending = [p.root];
  const focusSet = new Set(p.focusOrder);
  const actualFocus = new Set<string>();
  while (pending.length) {
    const n = pending.pop()!;
    if (focusSet.has(n.id)) {
      if (actualFocus.has(n.id) || !n.disabled || n.touchTargetPx < 44 ||
          n.role !== 'button' || !n.label || n.label.length > 240 ||
          !n.description?.includes('Host review')) return result('UNSAFE_ACCESSIBILITY');
      actualFocus.add(n.id);
    }
    if (p.viewportPx <= 360 && n.columns !== 1) return result('UNSAFE_ACCESSIBILITY');
    pending.push(...n.children);
  }
  if (actualFocus.size !== focusSet.size) return result('UNSAFE_ACCESSIBILITY');
  return result('NONE');
}

/** Automated checks never promote user-asserted device metadata to native GO. */
export function requiredNativeProofs(): readonly string[] {
  return Object.freeze([
    'real-windows-msi-install-upgrade-rollback-and-Host-restart',
    'windows-keyboard-focus-screenreader-and-stale-session',
    'real-android-apk-install-upgrade-rollback-build-hash-and-sdk',
    'android-talkback-touch-back-pair-replay-offline-revoke-resnapshot',
    'dual-device-same-revision-and-one-publisher',
    'R2-phone-denial-R3-refusal-and-real-Host-receipts',
    'device-observer-and-signed-artifact-rollback-evidence',
  ]);
}
