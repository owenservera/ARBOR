# File: packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts |
| Language | TypeScript |
| Kind | source |
| Size | 17547 B |
| Lines | 254 |
| Hash | fb5cc452fff0 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE4_DEVICE_INPUT_SCHEMA | const | 13 | yes | export const WAVE4_DEVICE_INPUT_SCHEMA = &#39;vivim.wave4-device-input/1&#39; as const; |
| WAVE4_INPUT_VIEWPORTS | const | 14 | yes | export const WAVE4_INPUT_VIEWPORTS = [320, 360, 1280] as const; |
| Device | type | 15 | no | type Device = &#39;desktop&#39; \| &#39;phone&#39;; |
| ActivationMethod | type | 16 | no | type ActivationMethod = &#39;touch&#39; \| &#39;keyboard&#39; \| &#39;accessibility&#39;; |
| NoEffect | type | 17 | no | type NoEffect = Readonly&lt;{ effectInvoked: false; authorized: false; automaticRetryAllowed: false }&gt;; |
| TrustedControlBinding | type | 20 | yes | export type TrustedControlBinding = Readonly&lt;{ |
| TrustedConfirmation | type | 32 | yes | export type TrustedConfirmation = Readonly&lt;{ |
| DeviceInputContext | type | 42 | yes | export type DeviceInputContext = Readonly&lt;{ |
| Base | type | 56 | no | type Base = Readonly&lt;{ |
| DeviceInput | type | 63 | yes | export type DeviceInput = |
| SemanticIdentity | type | 71 | yes | export type SemanticIdentity = Readonly&lt;Pick&lt;VisualCommand, |
| DeviceInputResult | type | 73 | yes | export type DeviceInputResult = |
| noEffect | const | 80 | no | const noEffect = { effectInvoked: false, authorized: false, automaticRetryAllowed: false } as const; |
| refuse | function | 81 | no | const refuse = (reasonCode: string): DeviceInputResult =&gt; ({ outcome: &#39;refused&#39;, reasonCode, ...noEffect }); |
| ID | const | 82 | no | const ID = /^[A-Za-z0-9._:-]{1,80}$/; |
| LABEL_SECRET | const | 83 | no | const LABEL_SECRET = /(?:\\bBearer\\s+\\S+\|\\b(?:password\|secret\|access[_ -]?token\|api[_ -]?key)\\s*[:=]\|\\b(?:gh[pousr]_\|sk-(?:proj-)?)[A-Za-z0-9_-]{10,})/i; |
| safeName | function | 84 | no | const safeName = (value: unknown): value is string =&gt; typeof value === &#39;string&#39; &amp;&amp; |
| own | function | 86 | no | const own = (v: unknown): v is Record&lt;string, unknown&gt; =&gt; { |
| proto | const | 88 | no | const proto = Object.getPrototypeOf(v); |
| exact | function | 92 | no | const exact = (v: unknown, keys: readonly string[]): v is Record&lt;string, unknown&gt; =&gt; |
| isDataObject | function | 94 | no | const isDataObject = (v: unknown): boolean =&gt; own(v); |
| sha | function | 95 | no | const sha = (v: string): string =&gt; createHash(&#39;sha256&#39;).update(v, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| validCommandId | function | 96 | no | const validCommandId = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; ID.test(v); |
| stableArgs | function | 97 | no | function stableArgs(args: Readonly&lt;Record&lt;string,string&gt;&gt;): string { |
| validInput | function | 100 | no | function validInput(v: unknown): v is DeviceInput { |
| controlsOf | function | 126 | no | function controlsOf(c: DeviceInputContext): readonly TrustedControlBinding[] \| null { |
| a | const | 127 | no | const a = c.projection, b = c.components; |
| focus | const | 134 | no | const focus = new Set(b.focusOrder); |
| seen | const | 136 | no | const seen = new Set&lt;string&gt;(); |
| src | const | 149 | no | const src = b.sourceRefs.find(r =&gt; r.id === control.componentId &amp;&amp; r.sourceId === control.sourceNodeId); |
| node | const | 150 | no | const node = a.canonical.nodes.find(n =&gt; n.id === control.sourceNodeId); |
| actions | const | 151 | no | const actions = b.actionRefs.filter(r =&gt; r.sourceNodeId === control.sourceNodeId); |
| ref | const | 152 | no | const ref = a.references.find(r =&gt; r.kind === &#39;action&#39; &amp;&amp; r.nodeId === control.sourceNodeId &amp;&amp; r.id === control.action.id &amp;&amp; r.version === control.action.version); |
| validContext | function | 164 | no | function validContext(c: unknown): c is DeviceInputContext { |
| versionsEqual | function | 181 | no | function versionsEqual(a: VersionPins, b: VersionPins): boolean { |
| candidate | function | 184 | no | function candidate(input: CommandInput, c: DeviceInputContext, control: TrustedControlBinding \| null): DeviceInputResult { |
| result | variable | 185 | no | let result: DescriptorProofResult; |
| cmd | const | 189 | no | const cmd = result.command; |
| conf | const | 199 | no | const conf = c.confirmation; |
| normalizeWave4DeviceInput | function | 211 | yes | export function normalizeWave4DeviceInput(event: unknown, trusted: unknown): DeviceInputResult { |
| c | const | 214 | no | const c = trusted; |
| controls | const | 217 | no | const controls = controlsOf(c); |
| reachable | const | 222 | no | const reachable = c.components.focusOrder.filter(id =&gt; { const control = controls.find(x =&gt; x.componentId === id); return control?.enabled &amp;&amp; control.visible &amp;&amp; control.focusable; }); |
| control | const | 223 | no | const control = controls.find(x =&gt; x.componentId === id); |
| position | const | 227 | no | const position = c.focusedComponentId === null ? -1 : reachable.indexOf(c.focusedComponentId); |
| next | const | 229 | no | const next = event.key === &#39;Tab&#39; ? position + 1 : position === -1 ? reachable.length - 1 : position - 1; |
| control | const | 242 | no | const control = controls.find(x =&gt; x.componentId === event.componentId); |
| surface | const | 249 | no | const surface = event.method === &#39;keyboard&#39; \|\| (event.method === &#39;accessibility&#39; &amp;&amp; c.device === &#39;desktop&#39;) |
| digest | const | 251 | no | const digest = sha(JSON.stringify([event.commandId, control.componentId, control.semanticId, stableArgs(control.args)])); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| ../document/wave3-action-semantics.ts | import | 8 | [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](../document/wave3-action-semantics.ts.md) |
| ../components/wave3-canonical-map.ts | import | 9 | [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](../components/wave3-canonical-map.ts.md) |
| ../command/ir.ts | import | 10 | [packages/tierflow/src/visual-runtime/command/ir.ts](../command/ir.ts.md) |
| ../command/wave3-descriptor-proof.ts | import | 11 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../command/wave3-descriptor-proof.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../input/wave4-device-semantics.ts |
| [packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts](../../../tests/visual-runtime/wave4-c-device-semantics.test.ts.md) | ../../src/visual-runtime/input/wave4-device-semantics.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 254 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
