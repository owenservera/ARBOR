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
    const draft = this.#authorizedDraft(p, draftId);
    if (!draft) return fail('NOT_FOUND');
    if (draft.draftRevision !== expectedDraftRevision) return fail('REVISION_CONFLICT', 'Draft revision conflict', draft.draftRevision);
    let documentDigest: string;
    try { documentDigest = digest(document); } catch { return fail('INVALID_COMMAND'); }
    const updated = { ...draft, draftRevision: draft.draftRevision + 1, documentDigest, document: copy(document) };
    this.#drafts.set(draftId, updated);
    return { ok: true, value: copy(this.#publicDraft(updated)) };
  }

  preview(p: VerifiedUiPrincipal, draftId: string): RevisionResult<UiFixtureDraft> {
    if (!guard(p, 'ui:read')) return fail('FORBIDDEN');
    const draft = this.#authorizedDraft(p, draftId);
    if (!draft) return fail('NOT_FOUND');
    return { ok: true, value: copy(this.#publicDraft(draft)) };
  }

  publish(p: VerifiedUiPrincipal, c: RevisionCommand): RevisionResult<UiFixtureRevision> {
    return this.#apply(p, 'publish', c, () => {
      if (!c.draftId || !c.documentDigest) return fail('INVALID_COMMAND');
      const draft = this.#authorizedDraft(p, c.draftId);
      if (!draft || draft.documentId !== c.documentId) return fail('NOT_FOUND');
      const current = this.#latest(p.ownerRef, c.documentId);
      const n = current?.revision ?? 0;
      if (n !== c.expectedRevision || draft.baseRevision !== n) return fail('REVISION_CONFLICT', 'Stale base', n);
      if (draft.documentDigest !== c.documentDigest) return fail('DIGEST_MISMATCH');
      return { ok: true, value: { schema: UI_REVISION_PORT_SCHEMA, documentId: c.documentId,
        revision: n + 1, documentDigest: draft.documentDigest, document: copy(draft.document),
        actorRef: p.actorRef, operation: 'publish' } };
    });
  }

  rollback(p: VerifiedUiPrincipal, c: RevisionCommand): RevisionResult<UiFixtureRevision> {
    return this.#apply(p, 'rollback', c, () => {
      if (!Number.isSafeInteger(c.targetRevision) || !c.targetRevision || c.targetRevision < 1) return fail('INVALID_COMMAND');
      const series = this.#documents.get(key(p.ownerRef, c.documentId));
      const current = this.#latest(p.ownerRef, c.documentId);
      if (!current || !series) return fail('NOT_FOUND');
      if (current.revision !== c.expectedRevision) return fail('REVISION_CONFLICT', 'Stale rollback', current.revision);
      const target = series.history.find(row => row.revision === c.targetRevision);
      if (!target) return fail('NOT_FOUND');
      return { ok: true, value: { schema: UI_REVISION_PORT_SCHEMA, documentId: c.documentId,
        revision: current.revision + 1, documentDigest: target.documentDigest,
        document: copy(target.document), actorRef: p.actorRef, operation: 'rollback' } };
    });
  }

  getCommandOutcome(p: VerifiedUiPrincipal, op: 'publish' | 'rollback', c: RevisionCommand): RevisionResult<UiFixtureRevision> {
    if (!guard(p, 'ui:read') || !commandValid(c)) return fail('FORBIDDEN');
    let hash: string;
    try { hash = commandEnvelopeHash({ ...c, operation: op }, p); } catch { return fail('INVALID_COMMAND'); }
    const prior = this.#commands.get(c.commandId);
    if (!prior) return fail('NOT_FOUND');
    if (prior.hash !== hash) return fail('IDEMPOTENCY_CONFLICT');
    return { ok: true, value: copy(prior.outcome), replayed: true };
  }

  #apply(p: VerifiedUiPrincipal, op: 'publish' | 'rollback', c: RevisionCommand, build: () => RevisionResult<UiFixtureRevision>): RevisionResult<UiFixtureRevision> {
    if (!guard(p, op === 'rollback' ? 'ui:rollback' : 'ui:publish')) return fail('FORBIDDEN');
    if (!commandValid(c)) return fail('INVALID_COMMAND');
    let hash: string;
    try { hash = commandEnvelopeHash({ ...c, operation: op }, p); } catch { return fail('INVALID_COMMAND'); }
    const prior = this.#commands.get(c.commandId);
    if (prior) return prior.hash === hash ? { ok: true, value: copy(prior.outcome), replayed: true } : fail('IDEMPOTENCY_CONFLICT');
    const next = build();
    if (!next.ok) return next;
    const stage = this.#fault;
    this.#fault = 'none';
    if (stage === 'beforeCommit') return fail('UNCERTAIN', 'Crash injection before fixture commit');
    const k = key(p.ownerRef, c.documentId);
    const existing = this.#documents.get(k);
    const staged = { history: [...(existing?.history ?? []), copy(next.value)] };
    // Fixture atomic boundary: revision and full-envelope outcome installed synchronously.
    this.#documents.set(k, staged);
    this.#commands.set(c.commandId, { hash, outcome: copy(next.value) });
    if (op === 'publish' && c.draftId) this.#drafts.delete(c.draftId);
    if (stage === 'afterCommitAckLoss') return fail('UNCERTAIN', 'ACK lost after fixture commit; query outcome, do not resend');
    return { ok: true, value: copy(next.value) };
  }
  #latest(owner: string, id: string): UiFixtureRevision | null {
    return this.#documents.get(key(owner, id))?.history.at(-1) ?? null;
  }
  #authorizedDraft(p: VerifiedUiPrincipal, id: string): DraftRow | null {
    const row = this.#drafts.get(id);
    if (!row || row.ownerRef !== p.ownerRef || row.actorRef !== p.actorRef || row.deviceRef !== p.deviceRef) return null;
    return row;
  }
  #publicDraft(row: DraftRow): UiFixtureDraft {
    return { draftId: row.draftId, documentId: row.documentId, baseRevision: row.baseRevision,
      draftRevision: row.draftRevision, documentDigest: row.documentDigest, document: row.document };
  }
}