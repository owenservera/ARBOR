# File: packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts |
| Language | TypeScript |
| Kind | source |
| Size | 16412 B |
| Lines | 296 |
| Hash | ceafc13fca36 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AtomicReplayStore | type | 24 | yes | export type AtomicReplayStore = Pick&lt;UiStore, |
| AtomicReplayOptions | interface | 28 | yes | export interface AtomicReplayOptions { |
| Operation | type | 36 | no | type Operation = &#39;publish&#39; \| &#39;rollback&#39;; |
| Fail | type | 37 | no | type Fail = Extract&lt;RevisionResult&lt;never&gt;, { ok: false }&gt;; |
| FaultStage | type | 38 | no | type FaultStage = &#39;beforeCommit&#39; \| &#39;afterCommitAckLoss&#39;; |
| copy | function | 39 | no | const copy = &lt;T&gt;(v: T): T =&gt; structuredClone(v); |
| nonempty | function | 40 | no | const nonempty = (v: unknown): v is string =&gt; typeof v === &#39;string&#39; &amp;&amp; v.trim().length &gt; 0; |
| natural | function | 41 | no | const natural = (v: unknown): v is number =&gt; Number.isSafeInteger(v) &amp;&amp; (v as number) &gt;= 0; |
| fail | function | 42 | no | const fail = (code: RevisionRefusal, currentRevision?: number): Fail =&gt; |
| actorKey | function | 47 | no | const actorKey = (p: VerifiedUiPrincipal): string =&gt; JSON.stringify([p.actorRef, p.deviceRef]); |
| actorFromKey | function | 48 | no | const actorFromKey = (key: string): string =&gt; { |
| value | const | 50 | no | const value: unknown = JSON.parse(key); |
| worldDocument | function | 57 | no | function worldDocument(value: unknown, worldId: string): UiDocument \| null { |
| doc | const | 62 | no | const doc = parseUiDocument(value); |
| validCommand | function | 66 | no | function validCommand(c: RevisionCommand): boolean { |
| publicDraft | function | 69 | no | function publicDraft(d: UiDraft): UiFixtureDraft { |
| publicRevision | function | 73 | no | function publicRevision(id: string, r: UiRevision, op: Operation): UiFixtureRevision { |
| recorded | function | 78 | no | function recorded(value: unknown, id: string, op: Operation): UiFixtureRevision \| null { |
| v | const | 80 | no | const v = value as Record&lt;string, unknown&gt;; |
| doc | const | 85 | no | const doc = v[&#39;document&#39;] as UiDocument; |
| mappedFailure | function | 89 | no | function mappedFailure(error: unknown): Fail { |
| e | variable | 91 | no | let e: unknown = error; |
| rec | const | 94 | no | const rec = e as { code?: unknown; cause?: unknown; currentRevision?: unknown }; |
| ReplayAbort | class | 106 | no | class ReplayAbort extends Error { |
| constructor | method | 107 | yes | constructor(readonly code: RevisionRefusal, readonly currentRevision?: number) { super(code); } |
| UiAtomicReplay | class | 111 | yes | export class UiAtomicReplay implements UiRevisionPort { |
| constructor | method | 117 | yes | constructor(options: AtomicReplayOptions) { |
| injectOnce | method | 127 | yes | injectOnce(stage: FaultStage): void { this.#fault = stage; } |
| d | const | 137 | no | const d = this.#store.getDraft(draftId); |
| readCurrent | method | 140 | yes | readCurrent(p: VerifiedUiPrincipal, id: string): RevisionResult&lt;UiFixtureRevision \| null&gt; { |
| row | const | 144 | no | const row = this.#store.currentRevision(id); |
| resource | const | 148 | no | const resource = `ui.world/${id}/revision/${row.revision}`; |
| op | const | 153 | no | const op = match.op === &#39;ui.rollback&#39; ? &#39;rollback&#39; : &#39;publish&#39;; |
| createDraft | method | 157 | yes | createDraft(p: VerifiedUiPrincipal, draftId: string, id: string, value: unknown): RevisionResult&lt;UiFixtureDraft&gt; { |
| document | const | 160 | no | const document = worldDocument(value, id); |
| current | const | 164 | no | const current = this.#store.currentRevision(id); |
| d | const | 166 | no | const d = this.#store.createDraft({ draftId, worldId: id, baseRevision: current.revision, document, actorId: actorKey(p) }); |
| editDraft | method | 171 | yes | editDraft(p: VerifiedUiPrincipal, draftId: string, expectedDraftRevision: number, value: unknown): RevisionResult&lt;UiFixtureDraft&gt; { |
| existing | const | 175 | no | const existing = this.#draft(p, draftId); |
| document | const | 177 | no | const document = worldDocument(value, existing.worldId); |
| d | const | 179 | no | const d = this.#store.updateDraft({ draftId, expectedDraftRevision, document, actorId: actorKey(p) }); |
| preview | method | 183 | yes | preview(p: VerifiedUiPrincipal, draftId: string): RevisionResult&lt;UiFixtureDraft&gt; { |
| d | const | 186 | no | const d = this.#draft(p, draftId); |
| publish | method | 190 | yes | publish(p: VerifiedUiPrincipal, command: RevisionCommand): RevisionResult&lt;UiFixtureRevision&gt; { |
| rollback | method | 193 | yes | rollback(p: VerifiedUiPrincipal, command: RevisionCommand): RevisionResult&lt;UiFixtureRevision&gt; { |
| getCommandOutcome | method | 196 | yes | getCommandOutcome(p: VerifiedUiPrincipal, op: Operation, c: RevisionCommand): RevisionResult&lt;UiFixtureRevision&gt; { |
| hash | variable | 199 | no | let hash: string; |
| prior | const | 203 | no | const prior = this.#store.getCommand(c.commandId); |
| outcome | const | 206 | no | const outcome = recorded(prior.result, c.documentId, op); |
| replayCommitted | method | 216 | yes | replayCommitted(p: VerifiedUiPrincipal, id: string, entries: readonly { operation: Operation; command: RevisionCommand }[]): RevisionResult&lt;UiFixtureRevision&gt; { |
| previous | variable | 219 | no | let previous: UiFixtureRevision \| null = null; |
| result | const | 223 | no | const result = this.getCommandOutcome(p, entry.operation, entry.command); |
| base | const | 228 | no | const base = this.#store.getRevision(id, entry.command.expectedRevision); |
| current | const | 235 | no | const current = this.#store.currentRevision(id); |
| hash | variable | 248 | no | let hash: string; |
| decision | const | 252 | no | const decision = this.#store.runCommandAtomic({ commandId: c.commandId, envelopeHash: hash, actorId: actorKey(p), kind: `wave3.ui.${op}`, execute: () =&gt; { const before = this.#store.currentRevision(c… |
| before | const | 255 | no | const before = this.#store.currentRevision(c.documentId); |
| actual | const | 256 | no | const actual = before?.revision ?? 0; |
| r | variable | 258 | no | let r: UiRevision; |
| draft | const | 260 | no | const draft = this.#draft(p, c.draftId!); |
| outcome | const | 276 | no | const outcome = publicRevision(c.documentId, r, op); |
| value | const | 283 | no | const value = recorded(decision.result, c.documentId, op); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../ui/hash.ts | import | 14 | [packages/tierflow/src/ui/hash.ts](../../ui/hash.ts.md) |
| ../../ui/world.ts | import | 15 | [packages/tierflow/src/ui/world.ts](../../ui/world.ts.md) |
| ../../ui/store.ts | import | 16 | [packages/tierflow/src/ui/store.ts](../../ui/store.ts.md) |
| ../../ui/types.ts | import | 17 | [packages/tierflow/src/ui/types.ts](../../ui/types.ts.md) |
| ./port.ts | import | 18 | [packages/tierflow/src/visual-runtime/revisions/port.ts](./port.ts.md) |
| ./port.ts | import | 19 | [packages/tierflow/src/visual-runtime/revisions/port.ts](./port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../revisions/wave3-atomic-replay.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts](../../../tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts.md) | ../../../../src/visual-runtime/revisions/wave3-atomic-replay.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/revisions/wave3-atomic-replay.ts |
| [packages/tierflow/tests/visual-runtime/wave3-c-replay.test.ts](../../../tests/visual-runtime/wave3-c-replay.test.ts.md) | ../../src/visual-runtime/revisions/wave3-atomic-replay.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 3 C: principal-bound, effect-free UiRevisionPort adapter over the existing
 * world-scoped UiStore. No additional SQLite file, schema, journal or writer.
 *
 * Only a trusted broker may construct this adapter and supply principals. The
 * injected UiStore must already be open, owned by that broker for ONE owner,
 * with WAL/FULL and its single-writer lock intact. Do not expose it to browser
 * JSON or use this adapter concurrently with a separate direct UiCore writer.
 *
 * Compatibility boundary: UiStore persists UiDocument/1 world documents; the
 * generic Lane A UiDocument/1 cannot be silently coerced. An initial world must
 * already have a canonical revision before a draft can be created.
 */
import { commandEnvelopeHash, contentHash } from '../../ui/hash.ts';
import { parseUiDocument } from '../../ui/world.ts';
import type { UiStore } from '../../ui/store.ts';
import type { UiDocument, UiDraft, UiRevision } from '../../ui/types.ts';
import { UI_REVISION_PORT_SCHEMA } from './port.ts';
import type {
  VerifiedUiPrincipal, RevisionResult, RevisionRefusal, UiFixtureRevision,
  UiFixtureDraft, RevisionCommand, UiRevisionPort,
} from './port.ts';

export type AtomicReplayStore = Pick<UiStore,
  'currentRevision' | 'getRevision' | 'getDraft' | 'createDraft' | 'updateDraft' |
  'deleteDraft' | 'publish' | 'rollback' | 'runCommandAtomic' | 'getCommand' | 'auditEntries'>;

export interface AtomicReplayOptions {
  readonly store: AtomicReplayStore;
  /** Verified independently by the broker that opened the single-owner store. */
  readonly ownerRef: string;
  /** Synchronous, trusted broker check; must reject expired/revoked sessions. */
  readonly verifyPrincipal: (principal: VerifiedUiPrincipal) => boolean;
}

type Operation = 'publish' | 'rollback';
type Fail = Extract<RevisionResult<never>, { ok: false }>;
type FaultStage = 'beforeCommit' | 'afterCommitAckLoss';
const copy = <T>(v: T): T => structuredClone(v);
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const natural = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const fail = (code: RevisionRefusal, currentRevision?: number): Fail =>
  currentRevision === undefined ? { ok: false, code, message: code } :
    { ok: false, code, message: code, currentRevision };

/** Actor and device are both persisted through the existing actor_id column. */
const actorKey = (p: VerifiedUiPrincipal): string => JSON.stringify([p.actorRef, p.deviceRef]);
const actorFromKey = (key: string): string => {
  try {
    const value: unknown = JSON.parse(key);
    if (Array.isArray(value) && value.length === 2 && nonempty(value[0]) && nonempty(value[1])) return value[0];
  } catch { /* legacy untagged actor */ }
  return 'legacy-unverified';
};

/** Map a validated legacy world document without altering references or data. */
function worldDocument(value: unknown, worldId: string): UiDocument | null {
  if (!nonempty(worldId)) return null;
  try {
    // Check strict finite JSON, prototypes, cycles, shared references and limits.
    commandEnvelopeHash(value, 'wave3-c-document');
    const doc = parseUiDocument(value);
    return doc.world.id === worldId ? doc : null;
  } catch { return null; }
}
function validCommand(c: RevisionCommand): boolean {
  return !!c && typeof c === 'object' && nonempty(c.commandId) && nonempty(c.documentId) && natural(c.expectedRevision);
}
function publicDraft(d: UiDraft): UiFixtureDraft {
  return { draftId: d.draftId, documentId: d.worldId, baseRevision: d.baseRevision,
    draftRevision: d.draftRevision, documentDigest: d.contentHash, document: copy(d.document) };
}
function publicRevision(id: string, r: UiRevision, op: Operation): UiFixtureRevision {
  return { schema: UI_REVISION_PORT_SCHEMA, documentId: id, revision: r.revision,
    documentDigest: r.contentHash, document: copy(r.document), actorRef: actorFromKey(r.actorId), operation: op };
}
/** Recognize only our own durable receipts, never a legacy command-shaped result. */
function recorded(value: unknown, id: string, op: Operation): UiFixtureRevision | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
```

_First 80 of 297 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
