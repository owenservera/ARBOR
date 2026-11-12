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