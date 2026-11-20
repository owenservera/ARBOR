# File: packages/tierflow/src/visual-runtime/experience/help.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/experience/help.ts |
| Language | TypeScript |
| Kind | source |
| Size | 8571 B |
| Lines | 130 |
| Hash | 80540e1366a0 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HELP_SCHEMA | const | 2 | yes | export const HELP_SCHEMA = &#39;CapabilityHelpProjection/1&#39; as const; |
| YesNoUnknown | type | 3 | yes | export type YesNoUnknown = &#39;yes&#39; \| &#39;no&#39; \| &#39;unknown&#39;; |
| CapabilityAuthority | type | 4 | yes | export type CapabilityAuthority = &#39;host&#39; \| &#39;ui&#39;; |
| CapabilityDescriptor | interface | 5 | yes | export interface CapabilityDescriptor { |
| AuthorizedKbHelp | interface | 28 | yes | export interface AuthorizedKbHelp { |
| HelpView | interface | 39 | yes | export interface HelpView { |
| discovery | const | 60 | no | const discovery: HelpView[&#39;discovery&#39;] = { helpAction: &#39;open-contextual-help&#39;, maxDeliberateInteractions: 3, textQuerySupported: true }; |
| a11y | const | 61 | no | const a11y: HelpView[&#39;a11y&#39;] = { role: &#39;region&#39;, statusLive: &#39;polite&#39;, headingLevel: 2 }; |
| opaque | function | 62 | no | const opaque = (s: string): boolean =&gt; /^[A-Za-z0-9_.:-]{1,128}$/.test(s); |
| safeTextCommand | function | 64 | no | function safeTextCommand(value: string \| undefined): string \| undefined { |
| validDescriptor | function | 69 | no | function validDescriptor(d: CapabilityDescriptor \| undefined \| null): d is CapabilityDescriptor { |
| genericUnavailable | function | 80 | no | function genericUnavailable(): HelpView { |
| projectCapabilityHelp | function | 87 | yes | export function projectCapabilityHelp(descriptor: CapabilityDescriptor, kb?: AuthorizedKbHelp \| null): HelpView { |
| s | const | 90 | no | const s = descriptor.readiness; |
| canPreview | const | 91 | no | const canPreview = s.supportedByBuild === &#39;yes&#39; &amp;&amp; s.availableNow === &#39;yes&#39; &amp;&amp; |
| reasons | const | 93 | no | const reasons = [ |
| kbVisible | const | 101 | no | const kbVisible = kb &amp;&amp; (kb.visibility === &#39;public&#39; \|\| kb.visibility === &#39;authorized&#39;) &amp;&amp; |
| command | const | 103 | no | const command = safeTextCommand(descriptor.textCommand); |
| HelpQueryResult | interface | 119 | yes | export interface HelpQueryResult { readonly schema: typeof HELP_SCHEMA; readonly items: readonly HelpView[]; readonly status: &#39;ok&#39; \| &#39;unavailable&#39; } |
| searchCapabilityHelp | function | 121 | yes | export function searchCapabilityHelp( query: string, descriptors: readonly CapabilityDescriptor[], knowledge: Readonly&lt;Record&lt;string, AuthorizedKbHelp&gt;&gt; = {}, ): HelpQueryResult { |
| q | const | 125 | no | const q = query.trim().toLowerCase(); |
| approved | const | 126 | no | const approved = descriptors.slice(0, 200).map(d =&gt; projectCapabilityHelp(d, knowledge[d.actionId])); |
| found | const | 127 | no | const found = approved.filter(v =&gt; v.visible &amp;&amp; (q.length === 0 \|\| [v.title, v.actionId ?? &#39;&#39;, v.explanation, v.textCommand ?? &#39;&#39;].some(x =&gt; x.toLowerCase().includes(q)))); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](./wave3-journey-fixture.ts.md) | ./help.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts](../final-wave/lane-c/adapters.ts.md) | ../../experience/help.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/first-edit.ts](../final-wave/lane-c/first-edit.ts.md) | ../../experience/help.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts](../final-wave/lane-d/knowledge-presentation.ts.md) | ../../experience/help.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts](../final-wave/lane-d/knowledge-presentation.ts.md) | ../../experience/help.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../experience/help.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/adapters.test.ts](../../../tests/visual-runtime/final-wave/lane-c/adapters.test.ts.md) | ../../../../src/visual-runtime/experience/help.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts](../../../tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts.md) | ../../../../src/visual-runtime/experience/help.ts |
| [packages/tierflow/tests/visual-runtime/help.test.ts](../../../tests/visual-runtime/help.test.ts.md) | ../../src/visual-runtime/experience/help.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/experience/help.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 131 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
