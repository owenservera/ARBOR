# File: packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts |
| Language | TypeScript |
| Kind | source |
| Size | 10937 B |
| Lines | 201 |
| Hash | e9b756664c73 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LANE_F_EXISTING_CLIENTS_SCHEMA | const | 13 | yes | export const LANE_F_EXISTING_CLIENTS_SCHEMA = &#39;vivim.final-wave.existing-clients/1&#39; as const; |
| EXISTING_CLIENT_IDENTITIES | const | 14 | yes | export const EXISTING_CLIENT_IDENTITIES = Object.freeze({ windows: &#39;com.vivim.host&#39;, android: &#39;inc.vivim.app&#39;, windowsMount: &#39;world-view&#39;, androidShell: &#39;existing-vivim-apk&#39;, relay: &#39;existing-mobile-… |
| RootCompatibility | type | 20 | yes | export type RootCompatibility = &#39;WAVE4B_WRAPPER_DEFECT&#39; \| &#39;CANONICAL_DIRECT_ROOT&#39; \| |
| RootDiagnosis | interface | 23 | yes | export interface RootDiagnosis { |
| IDENTIFIER | const | 41 | no | const IDENTIFIER = /^[A-Za-z][A-Za-z0-9._:-]{0,95}$/; |
| safeId | function | 42 | no | function safeId(value: unknown): value is string { |
| diagnoseWave4BRoot | function | 51 | yes | export function diagnoseWave4BRoot(canonical: UiDocument, rendered: Wave3RenderResult): RootDiagnosis { |
| docRoot | const | 52 | no | const docRoot = canonical?.rootId; |
| root | const | 53 | no | const root = rendered?.plan?.root; |
| repairedAccepts | const | 57 | no | const repairedAccepts = !!docRoot &amp;&amp; Array.isArray(canonical?.nodes) &amp;&amp; |
| result | function | 62 | no | const result = (compatibility: RootCompatibility): RootDiagnosis =&gt; Object.freeze({ schema: LANE_F_EXISTING_CLIENTS_SCHEMA, compatibility, canonicalRootId: safeId(docRoot) ? docRoot : null, renderedR… |
| found | const | 76 | no | const found = new Set&lt;string&gt;(); |
| pending | const | 77 | no | const pending: Array&lt;{ id: string; children: readonly unknown[] }&gt; = [root]; |
| node | const | 80 | no | const node = pending.pop(); |
| ParityRefusal | type | 101 | yes | export type ParityRefusal = &#39;NONE&#39; \| &#39;RENDER_ROOT_BLOCKED&#39; \| &#39;WINDOWS_REFUSED&#39; \| |
| ClientParityReport | interface | 104 | yes | export interface ClientParityReport { |
| ClientParityInput | interface | 117 | yes | export interface ClientParityInput { |
| assessExistingClientParity | function | 127 | yes | export function assessExistingClientParity(input: ClientParityInput): ClientParityReport { |
| root | const | 128 | no | const root = diagnoseWave4BRoot(input.canonical, input.rendered); |
| desktopReady | const | 129 | no | const desktopReady = input.desktop?.ok === true; |
| phoneReady | const | 130 | no | const phoneReady = input.phone?.status === &#39;ready&#39; &amp;&amp; input.phone?.refusalCode === null; |
| result | function | 131 | no | function result(refusal: ParityRefusal): ClientParityReport { |
| d | const | 150 | no | const d = input.desktop.view; |
| p | const | 151 | no | const p = input.phone; |
| phoneInput | const | 152 | no | const phoneInput = input.phoneInput; |
| pending | const | 172 | no | const pending = [p.root]; |
| focusSet | const | 173 | no | const focusSet = new Set(p.focusOrder); |
| actualFocus | const | 174 | no | const actualFocus = new Set&lt;string&gt;(); |
| n | const | 176 | no | const n = pending.pop()!; |
| requiredNativeProofs | function | 191 | yes | export function requiredNativeProofs(): readonly string[] { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../document/schema.ts | import | 8 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../document/schema.ts.md) |
| ../../render/wave3-semantics.ts | import | 9 | [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../../render/wave3-semantics.ts.md) |
| ../../device/wave4-desktop-adapter.ts | import | 10 | [packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts](../../device/wave4-desktop-adapter.ts.md) |
| ../../device/wave4-phone-adapter.ts | import | 11 | [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../../device/wave4-phone-adapter.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../integration/master.ts.md) | ../lane-f/existing-clients.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-f/existing-clients.test.ts](../../../../tests/visual-runtime/final-wave/lane-f/existing-clients.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-f/existing-clients.test.ts](../../../../tests/visual-runtime/final-wave/lane-f/existing-clients.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts](../../../../tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-f/existing-clients.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 202 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
