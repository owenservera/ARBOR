# File: packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts |
| Language | TypeScript |
| Kind | source |
| Size | 11893 B |
| Lines | 238 |
| Hash | bf57f0636f13 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE4_DESKTOP_ADAPTER_SCHEMA | const | 14 | yes | export const WAVE4_DESKTOP_ADAPTER_SCHEMA = &#39;vivim.wave4-desktop-adapter/1&#39; as const; |
| WAVE4_DESKTOP_MOUNT | const | 15 | yes | export const WAVE4_DESKTOP_MOUNT = &#39;world-view&#39; as const; |
| WAVE4_DESKTOP_FOCUS_RETURN | const | 16 | yes | export const WAVE4_DESKTOP_FOCUS_RETURN = &#39;main&#39; as const; |
| DesktopHostObservation | interface | 19 | yes | export interface DesktopHostObservation { |
| DesktopAdapterRequest | interface | 29 | yes | export interface DesktopAdapterRequest { |
| DesktopRefusalCode | type | 40 | yes | export type DesktopRefusalCode = |
| DesktopShellView | interface | 47 | yes | export interface DesktopShellView { |
| DesktopAdapterResult | type | 93 | yes | export type DesktopAdapterResult = |
| refuse | function | 108 | no | function refuse(code: DesktopRefusalCode, viewportPx: number): DesktopAdapterResult { |
| notice | const | 109 | no | const notice = code === &#39;HOST_DETACHED&#39; |
| safeViewport | function | 120 | no | function safeViewport(width: number): number { |
| safeRevision | function | 123 | no | function safeRevision(value: unknown): value is number { |
| validHost | function | 126 | no | function validHost(value: unknown): value is DesktopHostObservation { |
| host | const | 128 | no | const host = value as Record&lt;string, unknown&gt;; |
| get | function | 131 | no | const get = (key: string): unknown =&gt; Object.getOwnPropertyDescriptor(host, key)?.value; |
| seal | function | 138 | no | function seal&lt;T&gt;(value: T): T { |
| refKey | function | 145 | no | function refKey(nodeId: string, id: string, version: number): string { |
| focusIsSafe | function | 148 | no | function focusIsSafe(root: SemanticDomNode, order: readonly string[]): boolean { |
| focusable | const | 149 | no | const focusable: string[] = []; |
| visit | function | 150 | no | function visit(node: SemanticDomNode): boolean { |
| tab | const | 151 | no | const tab = node.attributes.tabindex; |
| projectWave4DesktopAdapter | function | 167 | yes | export function projectWave4DesktopAdapter(input: DesktopAdapterRequest): DesktopAdapterResult { |
| width | const | 172 | no | const width = input.viewportPx; |
| host | const | 174 | no | const host = input.host; |
| knownActions | const | 179 | no | const knownActions = input.semantics?.knownActions; |
| result | const | 181 | no | const result = projectWave3ActionSemantics(input.document, input.semantics); |
| canonical | const | 183 | no | const canonical = result.value; |
| revision | const | 186 | no | const revision = canonical.revision; |
| seen | const | 187 | no | const seen = input.lastDisplayedRevision; |
| rendered | const | 192 | no | const rendered = renderWave3Semantics(canonical.canonical, { viewportPx: width, knownActions, }); |
| a | const | 200 | no | const a = canonical.references.filter(r =&gt; r.kind === &#39;action&#39;); |
| b | const | 201 | no | const b = canonical.references.filter(r =&gt; r.kind === &#39;binding&#39;); |
| actions | const | 202 | no | const actions = new Set(a.map(r =&gt; refKey(r.nodeId, r.id, r.version))); |
| bindings | const | 203 | no | const bindings = new Set(b.map(r =&gt; r.kind === &#39;binding&#39; ? JSON.stringify([r.nodeId, r.id, r.version, r.provenanceRef, r.availability]) : &#39;&#39;)); |
| view | const | 213 | no | const view: DesktopShellView = Object.freeze({ schema: WAVE4_DESKTOP_ADAPTER_SCHEMA, evidenceClass: &#39;tierflow-code-fixture&#39;, native: Object.freeze({ window: &#39;main&#39;, existingMountId: WAVE4_DESKTOP_MOU… |
| resizeWave4DesktopAdapter | function | 236 | yes | export function resizeWave4DesktopAdapter(input: DesktopAdapterRequest, viewportPx: number): DesktopAdapterResult { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../document/wave3-action-semantics.ts | import | 10 | [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](../document/wave3-action-semantics.ts.md) |
| ../render/wave3-semantics.ts | import | 11 | [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../render/wave3-semantics.ts.md) |
| ../render/dom.ts | import | 12 | [packages/tierflow/src/visual-runtime/render/dom.ts](../render/dom.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../final-wave/lane-f/existing-clients.ts.md) | ../../device/wave4-desktop-adapter.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../device/wave4-desktop-adapter.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/device/wave4-desktop-adapter.ts |
| [packages/tierflow/tests/visual-runtime/wave4-a-desktop-adapter.test.ts](../../../tests/visual-runtime/wave4-a-desktop-adapter.test.ts.md) | ../../src/visual-runtime/device/wave4-desktop-adapter.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 4 Lane A: inert, pure projection into the EXISTING VIVIM Tauri/Host
 * window.  This file does not mount DOM, subscribe to Host, persist state,
 * register a renderer, open another publisher or dispatch an effect.
 *
 * Existing native boundary: src-tauri/src/main.rs -> 127.0.0.1:43187 ->
 * apps/vivim-host/public/{index.html,host.js,control-panel.js}.
 * No Harness file is changed or wired by this fixture-level contract.
 */
import { projectWave3ActionSemantics, type Wave3SemanticsOptions } from '../document/wave3-action-semantics.ts';
import { renderWave3Semantics } from '../render/wave3-semantics.ts';
import { renderUiDocument, type RenderPlan, type SemanticDomNode } from '../render/dom.ts';

export const WAVE4_DESKTOP_ADAPTER_SCHEMA = 'vivim.wave4-desktop-adapter/1' as const;
export const WAVE4_DESKTOP_MOUNT = 'world-view' as const;
export const WAVE4_DESKTOP_FOCUS_RETURN = 'main' as const;

/** Observed by the EXISTING Harness/Host owner, not authenticated by this adapter. */
export interface DesktopHostObservation {
  readonly state: 'connected' | 'detached';
  readonly ownerRef: string;
  readonly worldRef: string;
  readonly decision: 'read-only' | 'denied' | 'uncertain';
  readonly publisher: 'harness';
  /** The existing shell owner MUST prove this is false before integrating. */
  readonly anotherPublisherPresent: boolean;
}

export interface DesktopAdapterRequest {
  /** Untrusted canonical A document, NEVER a World-store document. */
  readonly document: unknown;
  /** Trusted owner/broker equality pins; not proof of owner consent. */
  readonly semantics: Wave3SemanticsOptions;
  readonly host: DesktopHostObservation;
  readonly viewportPx: number;
  /** Last displayed revision from the existing publisher; null = complete startup snapshot. */
  readonly lastDisplayedRevision: number | null;
}

export type DesktopRefusalCode =
  | 'INVALID_SHELL_CONTEXT' | 'INVALID_VIEWPORT' | 'WRONG_WORLD' | 'WRONG_OWNER'
  | 'HOST_DETACHED' | 'HOST_DENIED' | 'HOST_UNCERTAIN' | 'DUPLICATE_PUBLISHER'
  | 'STALE_REVISION' | 'RESNAPSHOT_REQUIRED' | 'CANONICAL_REFUSED'
  | 'RENDER_REFUSED' | 'REFERENCE_DIVERGED' | 'KEYBOARD_TRAP';

/** Only inert metadata, never callbacks, bearer tokens, private KB refs or HTML. */
export interface DesktopShellView {
  readonly schema: typeof WAVE4_DESKTOP_ADAPTER_SCHEMA;
  readonly evidenceClass: 'tierflow-code-fixture';
  readonly native: Readonly<{
    window: 'main';
    existingMountId: typeof WAVE4_DESKTOP_MOUNT;
    webview: 'existing-vivim-host';
    existingPublisher: 'harness';
    publish: false;
    newStore: false;
    effects: false;
  }>;
  readonly identity: Readonly<{
    documentId: string;
    ownerRef: string;
    worldRef: string;
    revision: number;
    documentDigest: string;
    replayed: boolean;
  }>;
  readonly plan: RenderPlan;
  readonly focus: Readonly<{
    order: readonly string[];
    returnToId: typeof WAVE4_DESKTOP_FOCUS_RETURN;
    escape: 'return-to-existing-shell';
    tabCycle: 'browser-native';
    trapped: false;
  }>;
  /** Version-preserving aliases. A's private KB provenance side table stays with the caller. */
  readonly references: readonly Readonly<{
    alias: string;
    kind: 'action' | 'binding';
    nodeId: string;
    version: number;
```

_First 80 of 239 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
