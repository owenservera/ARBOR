# File: packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts |
| Language | TypeScript |
| Kind | source |
| Size | 16533 B |
| Lines | 203 |
| Hash | 443bef69de6e |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LANE_G_CONTRACT | const | 12 | yes | export const LANE_G_CONTRACT = &#39;vivim.final-wave-g.dry-run/1&#39; as const; |
| LANE_G_ACTIVATION | const | 13 | yes | export const LANE_G_ACTIVATION = Object.freeze({ canPublish: false, canMigrateLiveData: false, canGrantPermit: false, canDispatchEffects: false }); |
| Hash | type | 14 | no | type Hash = `sha256:${string}`; |
| Publisher | type | 15 | yes | export type Publisher = &#39;host-bootstrap-legacy&#39; \| &#39;tierflow-canonical&#39; \| &#39;none&#39;; |
| Phase | type | 16 | yes | export type Phase = &#39;LEGACY_LIVE&#39; \| &#39;SHADOW&#39; \| &#39;COMPARED&#39; \| &#39;DRAINING&#39; \| &#39;QUIESCENT&#39; \| |
| DryRunResult | type | 18 | yes | export type DryRunResult&lt;T&gt; = Readonly&lt; |
| LegacyRevision | type | 22 | yes | export type LegacyRevision = Readonly&lt;{ revision: number; sourceId: string; digest: Hash; parentRevision: number \| null; |
| LegacySnapshot | type | 24 | yes | export type LegacySnapshot = Readonly&lt;{ |
| RevisionAlias | type | 30 | yes | export type RevisionAlias = Readonly&lt;{ legacyRevision: number; targetRevision: number; legacyId: string }&gt;; |
| MigrationInput | type | 31 | yes | export type MigrationInput = Readonly&lt;{ |
| ShadowFrame | type | 37 | yes | export type ShadowFrame = Readonly&lt;{ viewport: 320 \| 360 \| 1280; ownerRef: string; worldRef: string; |
| ShadowInput | type | 41 | yes | export type ShadowInput = Readonly&lt;{ legacy: readonly ShadowFrame[]; canonical: readonly ShadowFrame[] }&gt;; |
| FenceObservation | type | 42 | yes | export type FenceObservation = Readonly&lt;{ |
| PublisherControl | type | 50 | yes | export type PublisherControl = Readonly&lt;{ ownerRef: string; worldRef: string; documentId: string; |
| RollbackInput | type | 52 | yes | export type RollbackInput = Readonly&lt;{ control: PublisherControl; expectedEpoch: number; |
| digestOK | function | 59 | no | const digestOK = (v: unknown): v is Hash =&gt; typeof v === &#39;string&#39; &amp;&amp; /^sha256:[a-f0-9]{64}$/.test(v); |
| nonempty | function | 60 | no | const nonempty = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; v.length &gt; 0 &amp;&amp; v.length &lt;= 200 &amp;&amp; v.trim() === v; |
| whole | function | 61 | no | const whole = (v: unknown): v is number =&gt; Number.isSafeInteger(v) &amp;&amp; (v as number) &gt;= 0; |
| gitSHA | function | 62 | no | const gitSHA = (v: unknown): boolean =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-f0-9]{40}$/.test(v); |
| blocked | function | 63 | no | const blocked = &lt;T&gt;(...blockers: string[]): DryRunResult&lt;T&gt; =&gt; ({ ok: false, simulatedOnly: true, blockers }); |
| ready | function | 64 | no | const ready = &lt;T&gt;(value: T): DryRunResult&lt;T&gt; =&gt; ({ ok: true, simulatedOnly: true, value }); |
| equality | function | 65 | no | const equality = (a: unknown, b: unknown): boolean =&gt; a === b; |
| stableDigest | function | 66 | no | const stableDigest = (value: unknown): Hash =&gt; `sha256:${createHash(&#39;sha256&#39;).update(JSON.stringify(value)).digest(&#39;hex&#39;)}`; |
| makeShadowMigrationPlan | function | 74 | yes | export function makeShadowMigrationPlan(input: MigrationInput): DryRunResult&lt;Readonly&lt;{ |
| s | const | 81 | no | const s = input.snapshot, t = input.target, aliases = input.aliases; |
| last | variable | 90 | no | let last = 0; |
| seenIDs | const | 91 | no | const seenIDs = new Set&lt;string&gt;(); |
| sourceRev | const | 98 | no | const sourceRev = new Set(s.history.map(row =&gt; row.revision)); |
| seenSource | const | 100 | no | const seenSource = new Set&lt;number&gt;(), seenTarget = new Set&lt;number&gt;(); |
| priorTarget | variable | 101 | no | let priorTarget = t.expectedRevision; |
| history | const | 108 | no | const history = s.history.map(row =&gt; ({ ...row })); |
| mapped | const | 109 | no | const mapped = aliases.map(row =&gt; ({ ...row })); |
| manifestDigest | const | 110 | no | const manifestDigest = stableDigest({ scope:[s.ownerRef,s.worldRef,s.documentId,s.namespace], sourceHash:s.sourceHash, activeRevision:s.activeRevision,maxHistoricalRevision:s.maxHistoricalRevision,hi… |
| compareShadowSnapshots | function | 121 | yes | export function compareShadowSnapshots(input: ShadowInput): DryRunResult&lt;Readonly&lt;{ |
| viewports | const | 125 | no | const viewports = [320,360,1280] as const, out: Hash[] = []; |
| errors | const | 126 | no | const errors: string[] = []; |
| l | const | 128 | no | const l = input.legacy.filter(v =&gt; v?.viewport === width); |
| c | const | 129 | no | const c = input.canonical.filter(v =&gt; v?.viewport === width); |
| a | const | 131 | no | const a = l[0]!, b = c[0]!; |
| fields | const | 132 | no | const fields = [&#39;ownerRef&#39;,&#39;worldRef&#39;,&#39;sourceVersion&#39;,&#39;sourceHash&#39;,&#39;activeRevision&#39;,&#39;semanticDigest&#39;, |
| first | const | 145 | no | const first = input.legacy.find(v =&gt; v.viewport === 320); |
| assessPublisherFence | function | 158 | yes | export function assessPublisherFence(control: PublisherControl, observation: FenceObservation): DryRunResult&lt;Readonly&lt;{ |
| errors | const | 162 | no | const errors: string[] = []; |
| rehearseRollback | function | 178 | yes | export function rehearseRollback(input: RollbackInput): DryRunResult&lt;Readonly&lt;{ |
| c | const | 183 | no | const c = input.control, errors: string[] = []; |
| ExistingCanonicalBindings | type | 203 | yes | export type ExistingCanonicalBindings = Readonly&lt;{ document: UiDocument; port: UiRevisionPort; principal: VerifiedUiPrincipal }&gt;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 8 | external |
| ../../document/schema.ts | import | 9 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../document/schema.ts.md) |
| ../../revisions/port.ts | import | 10 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../../revisions/port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../integration/master.ts.md) | ../lane-g/cutover-dry-run.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-g/cutover-dry-run.test.ts](../../../../tests/visual-runtime/final-wave/lane-g/cutover-dry-run.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Final Wave G: inert migration/shadow/fence/rollback REHEARSAL ONLY.
 * No Host control-row writer, no UI publisher, no storage, no provider calls.
 * Every returned success is an offline evidence result, never a commit permit.
 * Durable fencing must be implemented inside the existing Host serialization
 * barrier and held through the existing UiStore.runCommandAtomic commit.
 */
import { createHash } from 'node:crypto';
import type { UiDocument } from '../../document/schema.ts';
import type { VerifiedUiPrincipal, UiRevisionPort } from '../../revisions/port.ts';

export const LANE_G_CONTRACT = 'vivim.final-wave-g.dry-run/1' as const;
export const LANE_G_ACTIVATION = Object.freeze({ canPublish: false, canMigrateLiveData: false, canGrantPermit: false, canDispatchEffects: false });
type Hash = `sha256:${string}`;
export type Publisher = 'host-bootstrap-legacy' | 'tierflow-canonical' | 'none';
export type Phase = 'LEGACY_LIVE' | 'SHADOW' | 'COMPARED' | 'DRAINING' | 'QUIESCENT' |
  'CANONICAL_LIVE' | 'OBSERVING' | 'ACCEPTED' | 'ROLLBACK_DRAINING' | 'LEGACY_RECOVERED' | 'BLOCKED_READ_ONLY';
export type DryRunResult<T> = Readonly<
  | { ok: true; simulatedOnly: true; value: T }
  | { ok: false; simulatedOnly: true; blockers: readonly string[] }
>;
export type LegacyRevision = Readonly<{ revision: number; sourceId: string; digest: Hash; parentRevision: number | null;
  status: 'applied' | 'superseded' | 'reverted' }>;
export type LegacySnapshot = Readonly<{
  schema: 'vivim.legacy-ui-snapshot/1'; ownerRef: string; worldRef: string; documentId: string;
  namespace: 'founder-workspace'; sourceSchema: string; sourceVersion: string;
  sourceHash: Hash; sourceCursor: string; activeRevision: number; maxHistoricalRevision: number;
  history: readonly LegacyRevision[]; sourceReaderVersion: string;
}>;
export type RevisionAlias = Readonly<{ legacyRevision: number; targetRevision: number; legacyId: string }>;
export type MigrationInput = Readonly<{
  snapshot: LegacySnapshot; target: { schema: 'vivim.ui-document/1'; documentId: string; ownerRef: string;
    sourceVersion: string; expectedRevision: number; documentDigest: Hash };
  aliases: readonly RevisionAlias[]; readerCompatibility: { sourceReaderRetained: boolean; targetReaderVersion: string };
  pin: { tierflowSha: string; harnessSha: string; hqSha: string };
}>;
export type ShadowFrame = Readonly<{ viewport: 320 | 360 | 1280; ownerRef: string; worldRef: string;
  sourceVersion: string; sourceHash: Hash; activeRevision: number;
  semanticDigest: Hash; actionDigest: Hash; accessibilityDigest: Hash;
  privacyDigest: Hash; tombstoneDigest: Hash; visualDigest: Hash }>;
export type ShadowInput = Readonly<{ legacy: readonly ShadowFrame[]; canonical: readonly ShadowFrame[] }>;
export type FenceObservation = Readonly<{
  expectedEpoch: number; expectedControlRevision: number; ownerRef: string; worldRef: string;
  documentId: string; namespace: string; desiredWriter: Publisher;
  oldIngressClosed: boolean; oldInFlight: number; uncertainClaims: number;
  hostFenceDurable: boolean; heldThroughCommit: boolean; legacyRestartDenied: boolean;
  sourcePinsMatch: boolean; integration5GO: boolean; explicitOwnerApproval: boolean;
  deviceAcceptance: boolean; rollbackRehearsed: boolean;
}>;
export type PublisherControl = Readonly<{ ownerRef: string; worldRef: string; documentId: string;
  namespace: string; phase: Phase; writer: Publisher; epoch: number; controlRevision: number }>;
export type RollbackInput = Readonly<{ control: PublisherControl; expectedEpoch: number;
  expectedControlRevision: number; outstandingCanonicalClaims: number;
  uncertainOutcomes: number; legacyReaderRetained: boolean;
  newRevisions: readonly Readonly<{ revision: number; digest: Hash }>[];
  exportedRevisions: readonly Readonly<{ revision: number; digest: Hash }>[];
  inverseConversionLossless: boolean; previousSourceHash: Hash }>;

const digestOK = (v: unknown): v is Hash => typeof v === 'string' && /^sha256:[a-f0-9]{64}$/.test(v);
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 200 && v.trim() === v;
const whole = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const gitSHA = (v: unknown): boolean => typeof v === 'string' && /^[a-f0-9]{40}$/.test(v);
const blocked = <T>(...blockers: string[]): DryRunResult<T> => ({ ok: false, simulatedOnly: true, blockers });
const ready = <T>(value: T): DryRunResult<T> => ({ ok: true, simulatedOnly: true, value });
const equality = (a: unknown, b: unknown): boolean => a === b;
const stableDigest = (value: unknown): Hash => `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;

/**
 * Does not convert a UI document. It requires an EXPLICIT, loss-reportable
 * source-history alias table, keeps undo ancestry, and leaves original bytes
 * untouched. The future owner broker must verify source/target document hashes
 * using the existing validators; this function cannot certify them.
 */
export function makeShadowMigrationPlan(input: MigrationInput): DryRunResult<Readonly<{
  schema: typeof LANE_G_CONTRACT; authority: 'none'; phase: 'SHADOW'; sourceHash: Hash;
  activeRevision: number; maxHistoricalRevision: number; history: readonly LegacyRevision[];
  aliases: readonly RevisionAlias[]; targetDigest: Hash; targetExpectedRevision: number;
  manifestDigest: Hash; sourceDataValidated: false; eligibleToCommit: false;
}>> {
  if (!input || typeof input !== 'object') return blocked('INVALID_INPUT');
```

_First 80 of 204 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
