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
  if (v['schema'] !== UI_REVISION_PORT_SCHEMA || v['documentId'] !== id || v['operation'] !== op ||
      !Number.isSafeInteger(v['revision']) || (v['revision'] as number) < 1 ||
      !nonempty(v['actorRef']) || !nonempty(v['documentDigest']) ||
      !worldDocument(v['document'], id)) return null;
  const doc = v['document'] as UiDocument;
  if (contentHash(doc) !== v['documentDigest']) return null;
  return copy(value as UiFixtureRevision);
}
function mappedFailure(error: unknown): Fail {
  // UiStore wraps nested transaction errors as causes; never leak SQL or paths.
  let e: unknown = error;
  for (let i = 0; i < 4; i++) {
    if (!e || typeof e !== 'object') break;
    const rec = e as { code?: unknown; cause?: unknown; currentRevision?: unknown };
    if (e instanceof ReplayAbort) return fail(e.code, e.currentRevision);
    if (rec.code === 'REVISION_CONFLICT') return fail('REVISION_CONFLICT',
      natural(rec.currentRevision) ? rec.currentRevision : undefined);
    if (rec.code === 'NOT_FOUND') return fail('NOT_FOUND');
    if (rec.code === 'STORE_LOCKED' || rec.code === 'UNSUPPORTED_VERSION') return fail('UNAVAILABLE');
    if (rec.cause) { e = rec.cause; continue; }
    if (rec.code === 'STORE_ERROR') return fail('UNAVAILABLE');
    break;
  }
  return fail('UNAVAILABLE');
}
class ReplayAbort extends Error {
  constructor(readonly code: RevisionRefusal, readonly currentRevision?: number) { super(code); }
}

/** Inert port; caller must not invoke external effects while observing results. */
export class UiAtomicReplay implements UiRevisionPort {
  readonly #store: AtomicReplayStore;
  readonly #owner: string;
  readonly #verify: AtomicReplayOptions['verifyPrincipal'];
  #fault: FaultStage | null = null;

  constructor(options: AtomicReplayOptions) {
    if (!options || !options.store || !nonempty(options.ownerRef) || typeof options.verifyPrincipal !== 'function') {
      throw new TypeError('A trusted owner/store/principal verifier is required');
    }
    this.#store = options.store;
    this.#owner = options.ownerRef;
    this.#verify = options.verifyPrincipal;
  }

  /** TEST ONLY: simulate rollback before COMMIT, or lost ACK after COMMIT. */
  injectOnce(stage: FaultStage): void { this.#fault = stage; }

  #allowed(p: VerifiedUiPrincipal, scope: string): boolean {
    if (!p || typeof p !== 'object' || p.ownerRef !== this.#owner ||
        ![p.ownerRef, p.actorRef, p.deviceRef, p.sessionRef, p.grantRef, p.policyRevision].every(nonempty) ||
        !Array.isArray(p.scopes) || p.scopes.some(v => !nonempty(v)) || !p.scopes.includes(scope)) return false;
    try { return this.#verify(p) === true; } catch { return false; }
  }
  #draft(p: VerifiedUiPrincipal, draftId: string): UiDraft | null {
    if (!nonempty(draftId)) return null;
    const d = this.#store.getDraft(draftId);
    return d && d.actorId === actorKey(p) ? d : null;
  }
  readCurrent(p: VerifiedUiPrincipal, id: string): RevisionResult<UiFixtureRevision | null> {
    if (!this.#allowed(p, 'ui:read')) return fail('FORBIDDEN');
    if (!nonempty(id)) return fail('INVALID_COMMAND');
    try {
      const row = this.#store.currentRevision(id);
      if (!row) return { ok: true, value: null };
      // UiRevision lacks an operation field. Derive it from durable audit; never
      // fabricate 'publish' after a rollback or when retention lost the audit.
      const resource = `ui.world/${id}/revision/${row.revision}`;
      const match = this.#store.auditEntries(1000).find(entry =>
        entry.resource === resource && entry.actorId === row.actorId &&
        (entry.op === 'ui.publish' || entry.op === 'ui.rollback'));
      if (!match) return fail('UNAVAILABLE');
      const op = match.op === 'ui.rollback' ? 'rollback' : 'publish';
      return { ok: true, value: publicRevision(id, row, op) };
    } catch (error) { return mappedFailure(error); }
  }
  createDraft(p: VerifiedUiPrincipal, draftId: string, id: string, value: unknown): RevisionResult<UiFixtureDraft> {
    if (!this.#allowed(p, 'ui:draft')) return fail('FORBIDDEN');
    if (!nonempty(draftId) || !nonempty(id)) return fail('INVALID_COMMAND');
    const document = worldDocument(value, id);
    if (!document) return fail('INVALID_COMMAND');
    try {
      if (this.#store.getDraft(draftId)) return fail('IDEMPOTENCY_CONFLICT');
      const current = this.#store.currentRevision(id);
      if (!current) return fail('NOT_FOUND'); // initial world must be seeded through existing UiCore
      const d = this.#store.createDraft({ draftId, worldId: id, baseRevision: current.revision,
        document, actorId: actorKey(p) });
      return { ok: true, value: publicDraft(d) };
    } catch (error) { return mappedFailure(error); }
  }
  editDraft(p: VerifiedUiPrincipal, draftId: string, expectedDraftRevision: number, value: unknown): RevisionResult<UiFixtureDraft> {
    if (!this.#allowed(p, 'ui:draft')) return fail('FORBIDDEN');
    if (!natural(expectedDraftRevision) || expectedDraftRevision < 1) return fail('INVALID_COMMAND');
    try {
      const existing = this.#draft(p, draftId);
      if (!existing) return fail('NOT_FOUND');
      const document = worldDocument(value, existing.worldId);
      if (!document) return fail('INVALID_COMMAND');
      const d = this.#store.updateDraft({ draftId, expectedDraftRevision, document, actorId: actorKey(p) });
      return { ok: true, value: publicDraft(d) };
    } catch (error) { return mappedFailure(error); }
  }
  preview(p: VerifiedUiPrincipal, draftId: string): RevisionResult<UiFixtureDraft> {
    if (!this.#allowed(p, 'ui:read')) return fail('FORBIDDEN');
    try {
      const d = this.#draft(p, draftId);
      return d ? { ok: true, value: publicDraft(d) } : fail('NOT_FOUND');
    } catch (error) { return mappedFailure(error); }
  }
  publish(p: VerifiedUiPrincipal, command: RevisionCommand): RevisionResult<UiFixtureRevision> {
    return this.#apply(p, 'publish', command);
  }
  rollback(p: VerifiedUiPrincipal, command: RevisionCommand): RevisionResult<UiFixtureRevision> {
    return this.#apply(p, 'rollback', command);
  }
  getCommandOutcome(p: VerifiedUiPrincipal, op: Operation, c: RevisionCommand): RevisionResult<UiFixtureRevision> {
    if (!this.#allowed(p, 'ui:read')) return fail('FORBIDDEN');
    if ((op !== 'publish' && op !== 'rollback') || !validCommand(c)) return fail('INVALID_COMMAND');
    let hash: string;
    try { hash = commandEnvelopeHash({ ...c, operation: op }, p); }
    catch { return fail('INVALID_COMMAND'); }
    try {
      const prior = this.#store.getCommand(c.commandId);
      if (!prior) return fail('NOT_FOUND');
      if (prior.payloadHash !== hash) return fail('IDEMPOTENCY_CONFLICT');
      const outcome = recorded(prior.result, c.documentId, op);
      return outcome ? { ok: true, value: outcome, replayed: true } : fail('UNAVAILABLE');
    } catch (error) { return mappedFailure(error); }
  }

  /**
   * Reconstruct a contiguous, ordered suffix from durable receipts and compare
   * its final head with SQLite. A gap, pruned journal, altered order or changed
   * principal refuses rather than guessing. No mutation or effect is possible.
   */
  replayCommitted(p: VerifiedUiPrincipal, id: string, entries: readonly { operation: Operation; command: RevisionCommand }[]): RevisionResult<UiFixtureRevision> {
    if (!this.#allowed(p, 'ui:read')) return fail('FORBIDDEN');
    if (!nonempty(id) || entries.length === 0) return fail('INVALID_COMMAND');
    let previous: UiFixtureRevision | null = null;
    for (const entry of entries) {
      if (!entry || !entry.command || entry.command.documentId !== id) return fail('INVALID_COMMAND');
      if (previous && entry.command.expectedRevision !== previous.revision) return fail('REVISION_CONFLICT', previous.revision);
      const result = this.getCommandOutcome(p, entry.operation, entry.command);
      if (!result.ok) return result;
      if (result.value.revision !== entry.command.expectedRevision + 1) return fail('REVISION_CONFLICT');
      if (previous === null && result.value.revision > 1) {
        try {
          const base = this.#store.getRevision(id, entry.command.expectedRevision);
          if (!base || base.revision !== entry.command.expectedRevision) return fail('UNAVAILABLE');
        } catch (error) { return mappedFailure(error); }
      }
      previous = result.value;
    }
    try {
      const current = this.#store.currentRevision(id);
      if (!previous || !current || current.revision !== previous.revision || current.contentHash !== previous.documentDigest) {
        return fail('REVISION_CONFLICT', current?.revision);
      }
      return { ok: true, value: copy(previous), replayed: true };
    } catch (error) { return mappedFailure(error); }
  }

  #apply(p: VerifiedUiPrincipal, op: Operation, c: RevisionCommand): RevisionResult<UiFixtureRevision> {
    if (!this.#allowed(p, op === 'publish' ? 'ui:publish' : 'ui:rollback')) return fail('FORBIDDEN');
    if (!validCommand(c)) return fail('INVALID_COMMAND');
    if (op === 'publish' && (!nonempty(c.draftId) || !nonempty(c.documentDigest))) return fail('INVALID_COMMAND');
    if (op === 'rollback' && (!natural(c.targetRevision) || !c.targetRevision)) return fail('INVALID_COMMAND');
    let hash: string;
    try { hash = commandEnvelopeHash({ ...c, operation: op }, p); }
    catch { return fail('INVALID_COMMAND'); }
    try {
      const decision = this.#store.runCommandAtomic({
        commandId: c.commandId, envelopeHash: hash, actorId: actorKey(p), kind: `wave3.ui.${op}`,
        execute: () => {
          const before = this.#store.currentRevision(c.documentId);
          const actual = before?.revision ?? 0;
          if (actual !== c.expectedRevision) throw new ReplayAbort('REVISION_CONFLICT', actual);
          let r: UiRevision;
          if (op === 'publish') {
            const draft = this.#draft(p, c.draftId!);
            if (!draft || draft.worldId !== c.documentId) throw new ReplayAbort('NOT_FOUND');
            if (draft.baseRevision !== actual) throw new ReplayAbort('REVISION_CONFLICT', actual);
            if (draft.contentHash !== c.documentDigest) throw new ReplayAbort('DIGEST_MISMATCH');
            r = this.#store.publish({ worldId: c.documentId, draftId: c.draftId,
              document: draft.document, contentHash: draft.contentHash, expectedRevision: c.expectedRevision,
              actorId: actorKey(p) });
            this.#store.deleteDraft(c.draftId!); // same outer SQLite transaction/savepoint
          } else {
            r = this.#store.rollback({ worldId: c.documentId, targetRevision: c.targetRevision!,
              expectedRevision: c.expectedRevision, actorId: actorKey(p) });
          }
          if (this.#fault === 'beforeCommit') {
            this.#fault = null;
            throw new ReplayAbort('UNCERTAIN'); // outer tx reverts revision, draft and audit
          }
          const outcome = publicRevision(c.documentId, r, op);
          return { outcome, result: outcome, resource: `ui.world/${c.documentId}/revision/${r.revision}`,
            detail: { commandId: c.commandId, operation: op, revision: r.revision, digest: r.contentHash } };
        },
      });
      if (decision.status === 'conflict') return fail('IDEMPOTENCY_CONFLICT');
      if (decision.status === 'replayed') {
        const value = recorded(decision.result, c.documentId, op);
        return value ? { ok: true, value, replayed: true } : fail('UNAVAILABLE');
      }
      if (this.#fault === 'afterCommitAckLoss') {
        this.#fault = null;
        return fail('UNCERTAIN'); // journal and revision have ALREADY committed
      }
      return { ok: true, value: copy(decision.outcome) };
    } catch (error) {
      if (this.#fault === 'beforeCommit') this.#fault = null;
      return mappedFailure(error);
    }
  }
}
