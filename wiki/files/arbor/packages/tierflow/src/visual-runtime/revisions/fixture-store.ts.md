# File: packages/tierflow/src/visual-runtime/revisions/fixture-store.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/revisions/fixture-store.ts |
| Language | TypeScript |
| Kind | source |
| Size | 10160 B |
| Lines | 172 |
| Hash | 4c38b5acde54 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DocumentSeries | type | 6 | no | type DocumentSeries = { history: UiFixtureRevision[] }; |
| DraftRow | type | 7 | no | type DraftRow = UiFixtureDraft &amp; { ownerRef: string; actorRef: string; deviceRef: string }; |
| CommandRow | type | 8 | no | type CommandRow = { hash: string; outcome: UiFixtureRevision }; |
| FixtureSnapshot | interface | 9 | yes | export interface FixtureSnapshot { |
| fail | function | 14 | no | const fail = (code: RevisionRefusal, message: string = code, currentRevision?: number): RevisionResult&lt;never&gt; =&gt; |
| copy | function | 16 | no | const copy = &lt;T&gt;(v: T): T =&gt; structuredClone(v); |
| key | function | 17 | no | const key = (owner: string, documentId: string): string =&gt; JSON.stringify([owner, documentId]); |
| digest | function | 18 | no | const digest = (value: unknown): string =&gt; { |
| json | const | 20 | no | const json = canonicalJson(value); |
| guard | function | 26 | no | function guard(p: VerifiedUiPrincipal, scope: string): boolean { |
| commandValid | function | 32 | no | function commandValid(c: RevisionCommand): boolean { |
| UiRevisionFixtureStore | class | 39 | yes | export class UiRevisionFixtureStore implements UiRevisionPort { |
| constructor | method | 45 | yes | constructor(snapshot?: FixtureSnapshot) { |
| snapshot | method | 52 | yes | snapshot(): FixtureSnapshot { |
| injectOnce | method | 55 | yes | injectOnce(stage: &#39;beforeCommit&#39; \| &#39;afterCommitAckLoss&#39;): void { this.#fault = stage; } |
| readCurrent | method | 57 | yes | readCurrent(p: VerifiedUiPrincipal, id: string): RevisionResult&lt;UiFixtureRevision \| null&gt; { |
| createDraft | method | 63 | yes | createDraft(p: VerifiedUiPrincipal, draftId: string, documentId: string, document: unknown): RevisionResult&lt;UiFixtureDraft&gt; { |
| documentDigest | variable | 67 | no | let documentDigest: string; |
| current | const | 69 | no | const current = this.#latest(p.ownerRef, documentId); |
| draft | const | 70 | no | const draft: DraftRow = { |
| editDraft | method | 79 | yes | editDraft(p: VerifiedUiPrincipal, draftId: string, expectedDraftRevision: number, document: unknown): RevisionResult&lt;UiFixtureDraft&gt; { |
| draft | const | 81 | no | const draft = this.#authorizedDraft(p, draftId); |
| documentDigest | variable | 84 | no | let documentDigest: string; |
| updated | const | 86 | no | const updated = { ...draft, draftRevision: draft.draftRevision + 1, documentDigest, document: copy(document) }; |
| preview | method | 91 | yes | preview(p: VerifiedUiPrincipal, draftId: string): RevisionResult&lt;UiFixtureDraft&gt; { |
| draft | const | 93 | no | const draft = this.#authorizedDraft(p, draftId); |
| publish | method | 98 | yes | publish(p: VerifiedUiPrincipal, c: RevisionCommand): RevisionResult&lt;UiFixtureRevision&gt; { |
| draft | const | 101 | no | const draft = this.#authorizedDraft(p, c.draftId); |
| current | const | 103 | no | const current = this.#latest(p.ownerRef, c.documentId); |
| n | const | 104 | no | const n = current?.revision ?? 0; |
| rollback | method | 113 | yes | rollback(p: VerifiedUiPrincipal, c: RevisionCommand): RevisionResult&lt;UiFixtureRevision&gt; { |
| series | const | 116 | no | const series = this.#documents.get(key(p.ownerRef, c.documentId)); |
| current | const | 117 | no | const current = this.#latest(p.ownerRef, c.documentId); |
| target | const | 120 | no | const target = series.history.find(row =&gt; row.revision === c.targetRevision); |
| getCommandOutcome | method | 128 | yes | getCommandOutcome(p: VerifiedUiPrincipal, op: &#39;publish&#39; \| &#39;rollback&#39;, c: RevisionCommand): RevisionResult&lt;UiFixtureRevision&gt; { |
| hash | variable | 130 | no | let hash: string; |
| prior | const | 132 | no | const prior = this.#commands.get(c.commandId); |
| hash | variable | 141 | no | let hash: string; |
| prior | const | 143 | no | const prior = this.#commands.get(c.commandId); |
| next | const | 145 | no | const next = build(); |
| stage | const | 147 | no | const stage = this.#fault; |
| k | const | 150 | no | const k = key(p.ownerRef, c.documentId); |
| existing | const | 151 | no | const existing = this.#documents.get(k); |
| staged | const | 152 | no | const staged = { history: [...(existing?.history ?? []), copy(next.value)] }; |
| row | const | 164 | no | const row = this.#drafts.get(id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../ui/hash.ts | import | 2 | [packages/tierflow/src/ui/hash.ts](../../ui/hash.ts.md) |
| ./port.ts | import | 3 | [packages/tierflow/src/visual-runtime/revisions/port.ts](./port.ts.md) |
| ./port.ts | import | 4 | [packages/tierflow/src/visual-runtime/revisions/port.ts](./port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../revisions/fixture-store.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts](../../../tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts.md) | ../../../../src/visual-runtime/revisions/fixture-store.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/revisions/fixture-store.ts |
| [packages/tierflow/tests/visual-runtime/revisions.test.ts](../../../tests/visual-runtime/revisions.test.ts.md) | ../../src/visual-runtime/revisions/fixture-store.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Isolated, serializable fixture, NOT a durable SQLite/Host/Android implementation. */
import { commandEnvelopeHash, canonicalJson, sha256Hex } from '../../ui/hash.ts';
import { UI_REVISION_PORT_SCHEMA } from './port.ts';
import type { VerifiedUiPrincipal, RevisionResult, RevisionRefusal, UiFixtureRevision, UiFixtureDraft, RevisionCommand, UiRevisionPort } from './port.ts';

type DocumentSeries = { history: UiFixtureRevision[] };
type DraftRow = UiFixtureDraft & { ownerRef: string; actorRef: string; deviceRef: string };
type CommandRow = { hash: string; outcome: UiFixtureRevision };
export interface FixtureSnapshot {
  readonly documents: readonly (readonly [string, DocumentSeries])[];
  readonly drafts: readonly (readonly [string, DraftRow])[];
  readonly commands: readonly (readonly [string, CommandRow])[];
}
const fail = (code: RevisionRefusal, message: string = code, currentRevision?: number): RevisionResult<never> =>
  currentRevision === undefined ? { ok: false, code, message } : { ok: false, code, message, currentRevision };
const copy = <T>(v: T): T => structuredClone(v);
const key = (owner: string, documentId: string): string => JSON.stringify([owner, documentId]);
const digest = (value: unknown): string => {
  commandEnvelopeHash(value, 'fixture-document-validation');
  const json = canonicalJson(value);
  // Fixture documents are data, not callbacks, URLs, executors or live bindings.
  if (Buffer.byteLength(json, 'utf8') > 32768) throw new TypeError('Document too large');
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Document must be an object');
  return 'sha256:' + sha256Hex(json);
};
function guard(p: VerifiedUiPrincipal, scope: string): boolean {
  return !!p && typeof p === 'object' &&
    [p.ownerRef, p.actorRef, p.deviceRef, p.sessionRef, p.grantRef, p.policyRevision]
      .every(v => typeof v === 'string' && v.trim().length > 0) &&
    Array.isArray(p.scopes) && p.scopes.includes(scope);
}
function commandValid(c: RevisionCommand): boolean {
  return !!c && typeof c.commandId === 'string' && c.commandId.length > 0 &&
    typeof c.documentId === 'string' && c.documentId.length > 0 &&
    Number.isSafeInteger(c.expectedRevision) && c.expectedRevision >= 0;
}

/** Injection hooks model pre-commit crash and post-commit lost ACK without real effects. */
export class UiRevisionFixtureStore implements UiRevisionPort {
  #documents = new Map<string, DocumentSeries>();
  #drafts = new Map<string, DraftRow>();
  #commands = new Map<string, CommandRow>();
  #fault: 'none' | 'beforeCommit' | 'afterCommitAckLoss' = 'none';

  constructor(snapshot?: FixtureSnapshot) {
    if (snapshot) {
      this.#documents = new Map(copy(snapshot.documents));
      this.#drafts = new Map(copy(snapshot.drafts));
      this.#commands = new Map(copy(snapshot.commands));
    }
  }
  snapshot(): FixtureSnapshot {
    return copy({ documents: [...this.#documents], drafts: [...this.#drafts], commands: [...this.#commands] });
  }
  injectOnce(stage: 'beforeCommit' | 'afterCommitAckLoss'): void { this.#fault = stage; }

  readCurrent(p: VerifiedUiPrincipal, id: string): RevisionResult<UiFixtureRevision | null> {
    if (!guard(p, 'ui:read')) return fail('FORBIDDEN');
    if (typeof id !== 'string' || !id) return fail('INVALID_COMMAND');
    return { ok: true, value: copy(this.#latest(p.ownerRef, id)) };
  }

  createDraft(p: VerifiedUiPrincipal, draftId: string, documentId: string, document: unknown): RevisionResult<UiFixtureDraft> {
    if (!guard(p, 'ui:draft')) return fail('FORBIDDEN');
    if (!draftId || !documentId || typeof draftId !== 'string' || typeof documentId !== 'string') return fail('INVALID_COMMAND');
    if (this.#drafts.has(draftId)) return fail('IDEMPOTENCY_CONFLICT');
    let documentDigest: string;
    try { documentDigest = digest(document); } catch { return fail('INVALID_COMMAND'); }
    const current = this.#latest(p.ownerRef, documentId);
    const draft: DraftRow = {
      draftId, documentId, baseRevision: current?.revision ?? 0, draftRevision: 1,
      document: copy(document), documentDigest,
      ownerRef: p.ownerRef, actorRef: p.actorRef, deviceRef: p.deviceRef,
    };
    this.#drafts.set(draftId, draft);
    return { ok: true, value: copy(this.#publicDraft(draft)) };
  }

  editDraft(p: VerifiedUiPrincipal, draftId: string, expectedDraftRevision: number, document: unknown): RevisionResult<UiFixtureDraft> {
    if (!guard(p, 'ui:draft')) return fail('FORBIDDEN');
```

_First 80 of 172 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
