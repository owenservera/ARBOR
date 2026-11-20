# File: packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts |
| Language | TypeScript |
| Kind | source |
| Size | 17139 B |
| Lines | 268 |
| Hash | 6e6ffaf9c0eb |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE4_PHONE_SCHEMA | const | 11 | yes | export const WAVE4_PHONE_SCHEMA = &#39;vivim.wave4-phone-projection/1&#39; as const; |
| PHONE_MIN_TOUCH_PX | const | 12 | yes | export const PHONE_MIN_TOUCH_PX = 44 as const; |
| PhoneStatus | type | 13 | yes | export type PhoneStatus = &#39;ready&#39; \| &#39;unpaired&#39; \| &#39;offline&#39; \| &#39;denied&#39; \| &#39;resnapshot-required&#39; \| &#39;unavailable&#39;; |
| PhoneRefusalCode | type | 14 | yes | export type PhoneRefusalCode = |
| PhoneShellContract | interface | 20 | yes | export interface PhoneShellContract { |
| PhonePairingObservation | interface | 26 | yes | export interface PhonePairingObservation { |
| PhoneHostObservation | interface | 38 | yes | export interface PhoneHostObservation { |
| PhoneProjectionInput | interface | 53 | yes | export interface PhoneProjectionInput { |
| PhoneAccessibleNode | interface | 61 | yes | export interface PhoneAccessibleNode { |
| PhoneProjection | interface | 73 | yes | export interface PhoneProjection { |
| PhoneEvent | type | 91 | yes | export type PhoneEvent = Readonly&lt;{ |
| PhoneEventResult | type | 97 | yes | export type PhoneEventResult = |
| ID | const | 106 | no | const ID = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| SECRET_TEXT | const | 107 | no | const SECRET_TEXT = /\\b[a-f0-9]{64}\\b\|vivim:\\/\\/pair\|(?:pair(?:ing)?[_-]?token\|grant[_-]?id\|session[_-]?id)\\s*[:=]/i; |
| UNSAFE_TEXT | const | 108 | no | const UNSAFE_TEXT = /&lt;\\s*\\/?\\s*[a-z][^&gt;]*&gt;\|(?:javascript\|data\|vbscript\|file)\\s*:/i; |
| VALID_ATTRIBUTES | const | 109 | no | const VALID_ATTRIBUTES = new Set([&#39;role&#39;, &#39;aria-label&#39;, &#39;aria-description&#39;, &#39;aria-disabled&#39;, &#39;tabindex&#39;]); |
| SECRET_KEYS | const | 110 | no | const SECRET_KEYS = /(?:token\|secret\|password\|bearer\|authorization\|grantId\|sessionId\|qr)/i; |
| plain | function | 111 | no | const plain = (v: unknown): v is Record&lt;string, unknown&gt; =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; |
| int | function | 113 | no | const int = (v: unknown): v is number =&gt; typeof v === &#39;number&#39; &amp;&amp; Number.isSafeInteger(v) &amp;&amp; v &gt;= 0; |
| id | function | 114 | no | const id = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; ID.test(v); |
| safe | function | 115 | no | const safe = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; v.length &lt;= 240 &amp;&amp; |
| noSecrets | function | 117 | no | const noSecrets = (v: unknown): boolean =&gt; plain(v) &amp;&amp; Reflect.ownKeys(v).every(k =&gt; typeof k === &#39;string&#39; &amp;&amp; !SECRET_KEYS.test(k) &amp;&amp; &#39;value&#39; in Object.getOwnPropertyDescriptor(v, k)!); |
| refusalNode | function | 119 | no | const refusalNode = (label: string): PhoneAccessibleNode =&gt; Object.freeze({ id: &#39;phone_unavailable&#39;, tag: &#39;main&#39;, role: &#39;status&#39;, label, description: null, disabled: true, touchTargetPx: 0, columns: … |
| freeze | function | 123 | no | const freeze = &lt;T&gt;(v: T): T =&gt; Object.freeze(v); |
| refuse | function | 124 | no | function refuse(code: PhoneRefusalCode, width: number, status: PhoneStatus = &#39;unavailable&#39;): PhoneProjection { |
| label | const | 126 | no | const label = status === &#39;offline&#39; ? &#39;Host disconnected. Reconnect and review before continuing.&#39; : |
| sanitizeNode | function | 138 | no | function sanitizeNode(node: unknown, focus: ReadonlySet&lt;string&gt;, width: number, ids: Set&lt;string&gt;, depth = 0): PhoneAccessibleNode \| null { |
| role | const | 149 | no | const role = node.attributes.role; |
| label | const | 150 | no | const label = node.attributes[&#39;aria-label&#39;] ?? null; |
| description | const | 151 | no | const description = node.attributes[&#39;aria-description&#39;] ?? null; |
| isAction | const | 154 | no | const isAction = focus.has(node.id); |
| children | const | 158 | no | const children: PhoneAccessibleNode[] = []; |
| projected | const | 160 | no | const projected = sanitizeNode(child, focus, width, ids, depth + 1); |
| projectWave4PhoneAdapter | function | 173 | yes | export function projectWave4PhoneAdapter(input: PhoneProjectionInput): PhoneProjection { |
| width | const | 174 | no | const width = input?.shell?.viewportPx; |
| w | const | 175 | no | const w = int(width) ? width : 0; |
| p | const | 181 | no | const p = input.pairing, h = input.host, d = input.canonical, r = input.rendered; |
| canonicalFocus | const | 210 | no | const canonicalFocus = d.nodes.filter(n =&gt; n.type === &#39;button&#39;); |
| canonicalActions | const | 211 | no | const canonicalActions = canonicalFocus.flatMap(n =&gt; (n.actionRefs ?? []).map((a: UiActionReference) =&gt; `${n.id}\|${a.id}\|${a.version}`)).sort(); |
| renderedActions | const | 212 | no | const renderedActions = r.actions.map(a =&gt; `${a.nodeId}\|${a.id}\|${a.version}`).sort(); |
| riskActions | const | 213 | no | const riskActions = h.actionRisks.map(a =&gt; `${a.nodeId}\|${a.id}\|${a.version}`).sort(); |
| declared | const | 220 | no | const declared = d.bindings.map(b =&gt; `${b.nodeId}\|${b.id}\|${b.version}\|${b.provenanceRef}\|${b.availability}`).sort(); |
| projected | const | 221 | no | const projected = r.provenance.map(b =&gt; `${b.nodeId}\|${b.bindingId}\|${b.bindingVersion}\|${b.provenanceRef}\|${b.availability}`).sort(); |
| ids | const | 225 | no | const ids = new Set&lt;string&gt;(); |
| root | const | 226 | no | const root = sanitizeNode(r.plan.root, new Set(r.plan.focusOrder), w, ids); |
| projectWave4PhoneEvent | function | 238 | yes | export function projectWave4PhoneEvent(input: PhoneProjectionInput, view: PhoneProjection, event: PhoneEvent, alreadySeenEventIds: readonly string[] = []): PhoneEventResult { |
| deny | function | 240 | no | const deny = (code: Extract&lt;PhoneEventResult, {ok:false}&gt;[&#39;code&#39;]): PhoneEventResult =&gt; |
| fresh | const | 244 | no | const fresh = projectWave4PhoneAdapter(input); |
| action | const | 255 | no | const action = input.rendered.actions.find(a =&gt; a.nodeId === event.nodeId); |
| pin | const | 259 | no | const pin = input.host.actionRisks.find(p =&gt; p.nodeId === action.nodeId &amp;&amp; p.id === action.id &amp;&amp; p.version === action.version); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../document/schema.ts | import | 7 | [packages/tierflow/src/visual-runtime/document/schema.ts](../document/schema.ts.md) |
| ../render/wave3-semantics.ts | import | 8 | [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../render/wave3-semantics.ts.md) |
| ../render/dom.ts | import | 9 | [packages/tierflow/src/visual-runtime/render/dom.ts](../render/dom.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../final-wave/lane-f/existing-clients.ts.md) | ../../device/wave4-phone-adapter.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../device/wave4-phone-adapter.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/device/wave4-phone-adapter.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts](../../../tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts.md) | ../../../../src/visual-runtime/device/wave4-phone-adapter.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts](../../../tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts.md) | ../../../../src/visual-runtime/device/wave4-phone-adapter.ts |
| [packages/tierflow/tests/visual-runtime/wave4-b-phone-adapter.test.ts](../../../tests/visual-runtime/wave4-b-phone-adapter.test.ts.md) | ../../src/visual-runtime/device/wave4-phone-adapter.ts |
| [packages/tierflow/tests/visual-runtime/wave4-b-phone-adapter.test.ts](../../../tests/visual-runtime/wave4-b-phone-adapter.test.ts.md) | ../../src/visual-runtime/device/wave4-phone-adapter.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 4 Lane B: an INERT phone projection for the existing VIVIM APK/relay.
 * Consumes the SAME Wave 3 A document + D plan as desktop; it does not mount,
 * publish, store, authenticate, approve, transport, or execute anything.
 * Host/Android owner supplies already-verified pairing/cursor observations.
 */
import type { UiDocument, UiActionReference } from '../document/schema.ts';
import type { Wave3RenderResult } from '../render/wave3-semantics.ts';
import type { SemanticDomNode } from '../render/dom.ts';

export const WAVE4_PHONE_SCHEMA = 'vivim.wave4-phone-projection/1' as const;
export const PHONE_MIN_TOUCH_PX = 44 as const;
export type PhoneStatus = 'ready' | 'unpaired' | 'offline' | 'denied' | 'resnapshot-required' | 'unavailable';
export type PhoneRefusalCode =
  | 'INVALID_INPUT' | 'WRONG_SHELL' | 'DUPLICATE_PUBLISHER' | 'PAIRING_REQUIRED'
  | 'PAIRING_IDENTITY_MISMATCH' | 'PAIRING_REPLAY' | 'PAIRING_EXPIRED'
  | 'SECRET_FIELD_PRESENT' | 'HOST_DENIED' | 'HOST_OFFLINE' | 'STALE_AUTHORIZATION'
  | 'STALE_DOCUMENT' | 'RESNAPSHOT_REQUIRED' | 'RENDER_REFUSED'
  | 'CANONICAL_MISMATCH' | 'UNSAFE_RENDER' | 'INVALID_VIEWPORT';
export interface PhoneShellContract {
  readonly app: 'existing-vivim-apk';
  readonly relay: 'existing-mobile-relay';
  readonly publisher: 'harness';
  readonly viewportPx: number;
}
export interface PhonePairingObservation {
  readonly state: 'paired' | 'unpaired' | 'revoked';
  readonly ownerRef: string;
  readonly worldRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  /** Monotonic epoch and cursor from the EXISTING Host/relay. Never a bearer. */
  readonly epoch: number;
  readonly receivedSequence: number;
  readonly lastAcceptedSequence: number;
  readonly expiresAtMs: number;
}
export interface PhoneHostObservation {
  readonly state: 'online' | 'offline' | 'disconnected' | 'denied';
  readonly ownerRef: string;
  readonly worldRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly pairingEpoch: number;
  readonly policyRevision: number;
  readonly nowMs: number;
  readonly grantExpiresAtMs: number;
  readonly documentRevision: number;
  readonly denied: boolean;
  /** Verified Host descriptor/policy observations, never phone-supplied risk labels. */
  readonly actionRisks: readonly Readonly<{ nodeId: string; id: string; version: number; risk: 'R0' | 'R1' | 'R2' | 'R3'; policyRevision: number }>[];
}
export interface PhoneProjectionInput {
  readonly canonical: UiDocument;
  /** Must be produced by the real Wave 3 Lane D renderer, not by the phone. */
  readonly rendered: Wave3RenderResult;
  readonly shell: PhoneShellContract;
  readonly pairing: PhonePairingObservation;
  readonly host: PhoneHostObservation;
}
export interface PhoneAccessibleNode {
  readonly id: string;
  readonly tag: SemanticDomNode['tag'];
  readonly role: string;
  readonly label: string | null;
  readonly description: string | null;
  readonly disabled: boolean;
  readonly touchTargetPx: number;
  readonly columns: number;
  readonly text?: string;
  readonly children: readonly PhoneAccessibleNode[];
}
export interface PhoneProjection {
  readonly schema: typeof WAVE4_PHONE_SCHEMA;
  readonly status: PhoneStatus;
  readonly refusalCode: PhoneRefusalCode | null;
  readonly documentId: string | null;
  readonly revision: number | null;
  readonly viewportPx: number;
  readonly displayOnly: true;
```

_First 80 of 269 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
