/** Pure permission-aware, read-only projection. KB and descriptors are broker-scoped inputs. */
export const HELP_SCHEMA = 'CapabilityHelpProjection/1' as const;
export type YesNoUnknown = 'yes' | 'no' | 'unknown';
export type CapabilityAuthority = 'host' | 'ui';
export interface CapabilityDescriptor {
  readonly actionId: string;
  readonly title: string;
  readonly explanation: string;
  readonly authority: CapabilityAuthority;
  readonly sourceVersion: string;
  readonly sourceDigest: string;
  readonly observedAt: string;
  readonly surface: 'desktop' | 'phone' | 'both';
  readonly risk: 'R0' | 'R1' | 'R2' | 'R3';
  /** This classification must come from an authenticated capability broker. */
  readonly disclosure: 'public' | 'restricted';
  readonly readiness: {
    readonly supportedByBuild: YesNoUnknown;
    readonly availableNow: YesNoUnknown;
    readonly permittedForActor: YesNoUnknown;
    readonly verifiedByEvidence: YesNoUnknown;
  };
  readonly prerequisites: readonly string[];
  readonly requiredScopes: readonly string[];
  readonly textCommand?: string;
  readonly errorCodes: readonly string[];
}
export interface AuthorizedKbHelp {
  readonly stableId: string;
  readonly projectionRevision: string;
  readonly sourceAuthority: string;
  readonly sourceVersion: string;
  readonly evidenceRefs: readonly string[];
  readonly asOf: string;
  /** Redacted and revoked KB content is never copied into help. */
  readonly visibility: 'authorized' | 'public' | 'redacted' | 'revoked' | 'deleted' | 'unknown';
  readonly summary?: string;
}
export interface HelpView {
  readonly schema: typeof HELP_SCHEMA;
  readonly visible: boolean;
  readonly title: string;
  readonly actionId?: string;
  readonly explanation: string;
  readonly runnable: false; // help is never an execution endpoint
  readonly canRequestPreview: boolean;
  readonly readiness?: CapabilityDescriptor['readiness'];
  readonly whyUnavailable?: string;
  readonly prerequisites: readonly string[];
  readonly requiredScopes: readonly string[];
  readonly textCommand?: string;
  readonly risk?: CapabilityDescriptor['risk'];
  readonly surface?: CapabilityDescriptor['surface'];
  readonly provenance?: { readonly sourceAuthority: string; readonly version: string; readonly digest: string; readonly kbStableId?: string; readonly kbRevision?: string; readonly evidenceRefs: readonly string[] };
  readonly errors: readonly string[];
  readonly recovery: readonly string[];
  readonly discovery: { readonly helpAction: 'open-contextual-help'; readonly maxDeliberateInteractions: 3; readonly textQuerySupported: true };
  readonly a11y: { readonly role: 'region'; readonly statusLive: 'polite'; readonly headingLevel: 2 };
}
const discovery: HelpView['discovery'] = { helpAction: 'open-contextual-help', maxDeliberateInteractions: 3, textQuerySupported: true };
const a11y: HelpView['a11y'] = { role: 'region', statusLive: 'polite', headingLevel: 2 };
const opaque = (s: string): boolean => /^[A-Za-z0-9_.:-]{1,128}$/.test(s);
/** Reject credentials, shell/executor entry points, control characters, URLs and hidden bearer-like examples. */
function safeTextCommand(value: string | undefined): string | undefined {
  if (!value || value.length > 240 || !/^[a-z][a-z0-9 -]*$/i.test(value) ||
    /(?:!run|!design|\brun\b|\bexec\b|\bpassword\b|\btoken\b|\bsecret\b|\bkey\b|\bauthoriz|\bgrant\b|\bbearer\b)/i.test(value)) return undefined;
  return value;
}
function validDescriptor(d: CapabilityDescriptor | undefined | null): d is CapabilityDescriptor {
  if (!d || !opaque(d.actionId) || !opaque(d.sourceVersion) || !opaque(d.sourceDigest)) return false;
  if (typeof d.title !== 'string' || typeof d.explanation !== 'string') return false;
  if (!['public', 'restricted'].includes(d.disclosure) || !['ui', 'host'].includes(d.authority)) return false;
  if (!['R0', 'R1', 'R2', 'R3'].includes(d.risk) || !['desktop', 'phone', 'both'].includes(d.surface)) return false;
  if (!d.readiness || !['supportedByBuild', 'availableNow', 'permittedForActor', 'verifiedByEvidence']
    .every(key => ['yes', 'no', 'unknown'].includes(d.readiness[key as keyof typeof d.readiness]))) return false;
  return Array.isArray(d.prerequisites) && Array.isArray(d.requiredScopes) && Array.isArray(d.errorCodes) &&
    d.prerequisites.every(x => typeof x === 'string') && d.requiredScopes.every(x => typeof x === 'string') &&
    d.errorCodes.every(x => typeof x === 'string');
}
function genericUnavailable(): HelpView {
  return { schema: HELP_SCHEMA, visible: false, title: 'Feature unavailable',
    explanation: 'This feature cannot be described in the current scope. Check your access with the owner.',
    runnable: false, canRequestPreview: false, prerequisites: [], requiredScopes: [], errors: [],
    recovery: ['Return to available actions', 'Check owner-approved access'], discovery, a11y };
}
/** A descriptor is not permission; returns data only and no executable actions. */
export function projectCapabilityHelp(descriptor: CapabilityDescriptor, kb?: AuthorizedKbHelp | null): HelpView {
  if (!validDescriptor(descriptor)) return genericUnavailable();
  if (descriptor.disclosure === 'restricted' && descriptor.readiness.permittedForActor !== 'yes') return genericUnavailable();
  const s = descriptor.readiness;
  const canPreview = s.supportedByBuild === 'yes' && s.availableNow === 'yes' &&
    s.permittedForActor === 'yes' && s.verifiedByEvidence === 'yes' && descriptor.risk !== 'R3';
  const reasons = [
    ...(s.supportedByBuild !== 'yes' ? ['Not verified as supported by this build'] : []),
    ...(s.availableNow !== 'yes' ? ['Currently unavailable or unverified'] : []),
    ...(s.permittedForActor !== 'yes' ? ['Owner permission missing or unknown'] : []),
    ...(s.verifiedByEvidence !== 'yes' ? ['No current evidence of executability'] : []),
    ...(descriptor.risk === 'R3' ? ['This risk class is refused'] : []),
  ];
  // A scoped KB projection is informational only; never elevates capability permission.
  const kbVisible = kb && (kb.visibility === 'public' || kb.visibility === 'authorized') &&
    opaque(kb.stableId) && opaque(kb.projectionRevision) && Array.isArray(kb.evidenceRefs);
  const command = safeTextCommand(descriptor.textCommand);
  return { schema: HELP_SCHEMA, visible: true, title: descriptor.title.slice(0, 160),
    actionId: descriptor.actionId, explanation: descriptor.explanation.slice(0, 600),
    runnable: false, canRequestPreview: canPreview && command !== undefined,
    readiness: s, ...(reasons.length ? { whyUnavailable: reasons.join('; ') } : {}),
    prerequisites: descriptor.prerequisites.filter(x => x.length <= 160).slice(0, 12),
    requiredScopes: descriptor.requiredScopes.filter(opaque).slice(0, 12),
    ...(command ? { textCommand: command } : {}), risk: descriptor.risk, surface: descriptor.surface,
    provenance: { sourceAuthority: descriptor.authority, version: descriptor.sourceVersion, digest: descriptor.sourceDigest,
      ...(kbVisible ? { kbStableId: kb.stableId, kbRevision: kb.projectionRevision,
        evidenceRefs: kb.evidenceRefs.filter(opaque).slice(0, 12) } : { evidenceRefs: [] }) },
    errors: descriptor.errorCodes.filter(opaque).slice(0, 12),
    recovery: canPreview ? ['Review the inert preview before any separate authorization'] :
      ['Inspect prerequisites', 'Check current permissions and status', 'Reopen help after reconciliation'],
    discovery, a11y };
}
export interface HelpQueryResult { readonly schema: typeof HELP_SCHEMA; readonly items: readonly HelpView[]; readonly status: 'ok' | 'unavailable' }
/** Search runs after permission filtering. No private names, IDs, snippets or counts are returned. */
export function searchCapabilityHelp(
  query: string, descriptors: readonly CapabilityDescriptor[], knowledge: Readonly<Record<string, AuthorizedKbHelp>> = {},
): HelpQueryResult {
  if (typeof query !== 'string' || query.length > 200 || !Array.isArray(descriptors)) return { schema: HELP_SCHEMA, items: [], status: 'unavailable' };
  const q = query.trim().toLowerCase();
  const approved = descriptors.slice(0, 200).map(d => projectCapabilityHelp(d, knowledge[d.actionId]));
  const found = approved.filter(v => v.visible &&
    (q.length === 0 || [v.title, v.actionId ?? '', v.explanation, v.textCommand ?? ''].some(x => x.toLowerCase().includes(q))));
  return { schema: HELP_SCHEMA, items: found.slice(0, 20), status: 'ok' };
}
