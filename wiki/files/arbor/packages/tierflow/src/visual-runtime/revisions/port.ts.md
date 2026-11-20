# File: packages/tierflow/src/visual-runtime/revisions/port.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/revisions/port.ts |
| Language | TypeScript |
| Kind | source |
| Size | 2814 B |
| Lines | 58 |
| Hash | 80d2a427ac04 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UI_REVISION_PORT_SCHEMA | const | 2 | yes | export const UI_REVISION_PORT_SCHEMA = &#39;UiRevisionPort/1&#39; as const; |
| VerifiedUiPrincipal | interface | 5 | yes | export interface VerifiedUiPrincipal { |
| RevisionRefusal | type | 14 | yes | export type RevisionRefusal = |
| RevisionResult | type | 18 | yes | export type RevisionResult&lt;T&gt; = |
| UiFixtureRevision | interface | 22 | yes | export interface UiFixtureRevision { |
| UiFixtureDraft | interface | 31 | yes | export interface UiFixtureDraft { |
| RevisionCommand | interface | 39 | yes | export interface RevisionCommand { |
| UiRevisionPort | interface | 50 | yes | export interface UiRevisionPort { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../final-wave/integration/master.ts.md) | ../../revisions/port.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts](../final-wave/lane-b/studio-editing.ts.md) | ../../revisions/port.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts](../final-wave/lane-g/cutover-dry-run.ts.md) | ../../revisions/port.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../revisions/port.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../revisions/port.ts |
| [packages/tierflow/src/visual-runtime/revisions/fixture-store.ts](./fixture-store.ts.md) | ./port.ts |
| [packages/tierflow/src/visual-runtime/revisions/fixture-store.ts](./fixture-store.ts.md) | ./port.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](./wave3-atomic-replay.ts.md) | ./port.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](./wave3-atomic-replay.ts.md) | ./port.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts](./wave4-session-reconcile.ts.md) | ./port.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts](./wave4-session-reconcile.ts.md) | ./port.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/revisions/port.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts](../../../tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts.md) | ../../../../src/visual-runtime/revisions/port.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/revisions/port.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/revisions/port.ts |
| [packages/tierflow/tests/visual-runtime/revisions.test.ts](../../../tests/visual-runtime/revisions.test.ts.md) | ../../src/visual-runtime/revisions/port.ts |
| [packages/tierflow/tests/visual-runtime/wave3-c-replay.test.ts](../../../tests/visual-runtime/wave3-c-replay.test.ts.md) | ../../src/visual-runtime/revisions/port.ts |
| [packages/tierflow/tests/visual-runtime/wave4-d-session-reconcile.test.ts](../../../tests/visual-runtime/wave4-d-session-reconcile.test.ts.md) | ../../src/visual-runtime/revisions/port.ts |
| [packages/tierflow/tests/visual-runtime/wave4-d-session-reconcile.test.ts](../../../tests/visual-runtime/wave4-d-session-reconcile.test.ts.md) | ../../src/visual-runtime/revisions/port.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Inert UiRevisionPort/1 fixture boundary, never a Host capability or permission grant. */
export const UI_REVISION_PORT_SCHEMA = 'UiRevisionPort/1' as const;

/** Must be injected by a future trusted broker, NEVER accepted from browser JSON. */
export interface VerifiedUiPrincipal {
  readonly ownerRef: string;
  readonly actorRef: string;
  readonly deviceRef: string;
  readonly sessionRef: string;
  readonly grantRef: string;
  readonly policyRevision: string;
  readonly scopes: readonly string[];
}
export type RevisionRefusal =
  | 'FORBIDDEN' | 'INVALID_COMMAND' | 'IDEMPOTENCY_CONFLICT'
  | 'REVISION_CONFLICT' | 'DIGEST_MISMATCH' | 'NOT_FOUND'
  | 'UNCERTAIN' | 'UNAVAILABLE';
export type RevisionResult<T> =
  | { readonly ok: true; readonly value: T; readonly replayed?: boolean }
  | { readonly ok: false; readonly code: RevisionRefusal; readonly message: string; readonly currentRevision?: number };

export interface UiFixtureRevision {
  readonly schema: typeof UI_REVISION_PORT_SCHEMA;
  readonly documentId: string;
  readonly revision: number;
  readonly documentDigest: string;
  readonly document: unknown;
  readonly actorRef: string;
  readonly operation: 'publish' | 'rollback';
}
export interface UiFixtureDraft {
  readonly draftId: string;
  readonly documentId: string;
  readonly baseRevision: number;
  readonly draftRevision: number;
  readonly documentDigest: string;
  readonly document: unknown;
}
export interface RevisionCommand {
  readonly commandId: string;
  readonly documentId: string;
  readonly expectedRevision: number;
  readonly draftId?: string;
  readonly documentDigest?: string;
  readonly targetRevision?: number;
  /** Versioned policy/source/semantic references are covered by the whole-envelope digest. */
  readonly sourceVersions?: Readonly<Record<string, string>>;
  readonly target?: Readonly<Record<string, string>>;
}
export interface UiRevisionPort {
  readCurrent(principal: VerifiedUiPrincipal, documentId: string): RevisionResult<UiFixtureRevision | null>;
  createDraft(principal: VerifiedUiPrincipal, draftId: string, documentId: string, document: unknown): RevisionResult<UiFixtureDraft>;
  editDraft(principal: VerifiedUiPrincipal, draftId: string, expectedDraftRevision: number, document: unknown): RevisionResult<UiFixtureDraft>;
  preview(principal: VerifiedUiPrincipal, draftId: string): RevisionResult<UiFixtureDraft>;
  publish(principal: VerifiedUiPrincipal, command: RevisionCommand): RevisionResult<UiFixtureRevision>;
  rollback(principal: VerifiedUiPrincipal, command: RevisionCommand): RevisionResult<UiFixtureRevision>;
  getCommandOutcome(principal: VerifiedUiPrincipal, operation: 'publish' | 'rollback', command: RevisionCommand): RevisionResult<UiFixtureRevision>;
}
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
