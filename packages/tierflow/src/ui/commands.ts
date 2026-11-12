/**
 * The UI core command handler.
 *
 * Every external surface — an HTTP route, a mobile gesture, a studio canvas, a
 * future host — is reduced to one `UiCommand`. This module is the only place a
 * command becomes an authoritative change: it validates the envelope, enforces
 * idempotency, applies the world document rules and commits through the durable
 * store under compare-and-swap.
 *
 * Three properties are load-bearing:
 *
 * - a command is accepted or refused as a whole, and every refusal is a typed
 *   `UiResult` failure rather than a thrown error;
 * - the same `commandId` with the same payload replays its original result, so a
 *   retry after a lost response never publishes twice;
 * - the revision feed fires only after a commit, so an adapter never observes a
 *   revision the store does not hold.
 *
 * The world document implementation is injected, so command logic is independent
 * of one schema build and a test can stub it. Storage is always the sibling
 * durable store. The core imports no adapter, no tier, no provider and no
 * transport.
 */

import { randomUUID } from "node:crypto";
import { commandEnvelopeHash } from "./hash.ts";
import { UiStoreError } from "./store.ts";
import type { UiStore } from "./store.ts";
import {
  UiWorldError,
  applyUiOperations,
  defaultUiDocument,
  parseUiDocument,
  uiDocumentHash,
  validateUiDocument,
} from "./world.ts";
import type { UiDocumentDiagnostic, UiOperation } from "./world.ts";
import type {
  UiCommand,
  UiCommandKind,
  UiCommandPort,
  UiDocument,
  UiDraft,
  UiErrorCode,
  UiRevision,
  UiRevisionFeed,
  UiResult,
  UiScalar,
} from "./types.ts";

/** Closed set of command kinds, mirrored from `UiCommandKind` for runtime checks. */
const COMMAND_KINDS: readonly UiCommandKind[] = [
  "ui.world.create",
  "ui.draft.create",
  "ui.draft.edit",
  "ui.draft.commit",
  "ui.draft.discard",
  "ui.publish",
  "ui.rollback",
  "ui.state.set",
];

/** Store codes that reach the command layer unchanged from `UiStoreError`. */
const STORE_ERROR_CODES: ReadonlySet<string> = new Set<string>([
  "NOT_FOUND",
  "REVISION_CONFLICT",
  "STORE_LOCKED",
  "UNSUPPORTED_VERSION",
  "STORE_ERROR",
]);

/**
 * The world document functions the core depends on.
 *
 * Injection keeps the handler independent of one document implementation, so a
 * test can supply a stub and a future schema can be swapped in without editing
 * command logic. The built-in module is the sibling `./world.ts`.
 */
export interface UiWorldModule {
  readonly parse: typeof parseUiDocument;
  readonly validate: typeof validateUiDocument;
  readonly applyOperations: typeof applyUiOperations;
  readonly hash: typeof uiDocumentHash;
  readonly defaultDocument: typeof defaultUiDocument;
}

/** Default world module: the sibling core implementation. */
const DEFAULT_WORLD_MODULE: UiWorldModule = {
  parse: parseUiDocument,
  validate: validateUiDocument,
  applyOperations: applyUiOperations,
  hash: uiDocumentHash,
  defaultDocument: defaultUiDocument,
};

/**
 * The seam through which `ui.state.set` writes one named value.
 *
 * The core never imports a transport or a state owner, so the thing that holds
 * the real projection is injected. `UiStateProjection` can be adapted with
 * `UiStateProjection.writer()`, or passed directly through `UiCoreOptions.state`.
 */
export interface UiStateWriter {
  /** Write one existing path. A refusal is returned, never thrown. */
  set(path: string, value: UiScalar): UiResult<UiScalar>;
}

/** A typed refusal of a direct state write. */
export class UiStateProjectionError extends Error {
  /** UI error code describing why the write was refused. */
  readonly code: UiErrorCode;
  override name = "UiStateProjectionError";

  constructor(code: UiErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * The named, read-only values a world's data flows bind to.
 *
 * A projection is finite and explicit: a path exists because the host exposed
 * it, never because a document asked for it. A write may only update a path
 * that already exists, and a missing value stays missing, so a renderer shows
 * "unavailable" instead of a plausible zero.
 */
export class UiStateProjection {
  readonly #values = new Map<string, UiScalar>();
  readonly #onSet: ((path: string, value: UiScalar) => void) | undefined;

  /**
   * @param initial Nested (`{ runs: { live: 4 } }`) or absolute
   *   (`{ "/runs/live": 4 }`) named values. Every leaf must be a scalar.
   * @param onSet Called after every accepted write, for adapters that fan state
   *   out to subscribers.
   */
  constructor(initial: Readonly<Record<string, unknown>> = {}, onSet?: (path: string, value: UiScalar) => void) {
    this.#onSet = onSet;
    collectStateValues(initial, "", this.#values);
  }

  /** Resolve an absolute path. A malformed or unknown path returns `undefined`. */
  get(path: string): UiScalar | undefined {
    const normalized = normalizeStatePath(path);
    return normalized === null ? undefined : this.#values.get(normalized);
  }

  /** True when this projection exposes the path. */
  has(path: string): boolean {
    const normalized = normalizeStatePath(path);
    return normalized !== null && this.#values.has(normalized);
  }

  /**
   * Write one existing path.
   *
   * @throws UiStateProjectionError `INVALID_COMMAND` for a malformed path or a
   *   non-scalar value, `NOT_FOUND` when the path was never exposed. Creating a
   *   path is refused because the projection is an allow-list, not a scratchpad.
   */
  set(path: string, value: UiScalar): void {
    const normalized = normalizeStatePath(path);
    if (normalized === null) {
      throw new UiStateProjectionError("INVALID_COMMAND", `State path ${describeValue(path)} is not an absolute path.`);
    }
    if (!isScalar(value)) {
      throw new UiStateProjectionError("INVALID_COMMAND", `State value for ${normalized} must be a scalar.`);
    }
    if (!this.#values.has(normalized)) {
      throw new UiStateProjectionError("NOT_FOUND", `State path ${normalized} is not exposed by this projection.`);
    }
    this.#values.set(normalized, value);
    this.#onSet?.(normalized, value);
  }

  /** Flat, shallow copy of every exposed value, keyed by absolute path. */
  snapshot(): Record<string, UiScalar> {
    const copy: Record<string, UiScalar> = {};
    for (const [path, value] of this.#values) copy[path] = value;
    return copy;
  }

  /** Adapt this projection to the injectable writer seam. */
  writer(): UiStateWriter {
    return projectionWriter(this);
  }
}

/** Construction options for `UiCore`. */
export interface UiCoreOptions {
  /** Durable authority for revisions, drafts, commands and the audit trail. */
  readonly store: UiStore;
  /** World document implementation. Defaults to the sibling `./world.ts` module. */
  readonly world?: UiWorldModule;
  /** Explicit state write seam. Takes precedence over `state`. */
  readonly stateWriter?: UiStateWriter;
  /** Projection written by `ui.state.set` when no explicit writer is supplied. */
  readonly state?: UiStateProjection;
  /**
   * Optional, trusted broker-injected identity resolver. A missing resolver is
   * legacy-unverified mode ONLY; never mount it as an authenticated VIVIM route.
   * A null decision refuses the mutation. Actor IDs in commands are not grants.
   */
  readonly resolvePrincipal?: (command: UiCommand) => Readonly<{
    ownerRef: string;
    actorRef: string;
    deviceRef: string;
    sessionRef: string;
    grantRef: string;
    policyRevision: string;
    scopes: readonly string[];
  }> | null;
}

/** One accepted mutation, before it is recorded and audited. */
interface MutationOutcome {
  /** Published revision the command leaves behind. */
  readonly revision: UiRevision;
  /** True when this command produced a new revision. */
  readonly published: boolean;
  /** Audit resource, for example `ui.world/w_lab/revision/2`. */
  readonly resource: string;
  /** Audit detail, JSON-safe. */
  readonly detail: Readonly<Record<string, unknown>>;
}

/** A typed refusal decided by the command layer itself. */
class CommandFailure extends Error {
  readonly code: UiErrorCode;
  readonly currentRevision: number | undefined;

  constructor(code: UiErrorCode, message: string, currentRevision?: number) {
    super(message);
    this.name = "CommandFailure";
    this.code = code;
    this.currentRevision = currentRevision;
  }
}

/** A mapped failure, ready to be returned as a `UiResult` failure. */
interface MappedFailure {
  readonly code: UiErrorCode;
  readonly message: string;
  readonly currentRevision?: number;
}

/**
 * The authoritative façade over a `UiStore`.
 *
 * `submit` is the only mutation entry point. Every read is side-effect free, so
 * a surface can render, list or preview without risking a write.
 */
export class UiCore implements UiCommandPort, UiRevisionFeed {
  readonly #store: UiStore;
  readonly #world: UiWorldModule;
  readonly #writer: UiStateWriter | null;
  readonly #resolvePrincipal: UiCoreOptions["resolvePrincipal"];
  readonly #listeners = new Set<(revision: UiRevision) => void>();

  constructor(options: UiCoreOptions) {
    if (!options || !options.store) throw new TypeError("UiCore requires a store.");
    this.#store = options.store;
    this.#world = options.world ?? DEFAULT_WORLD_MODULE;
    this.#writer = options.stateWriter ?? (options.state ? projectionWriter(options.state) : null);
    this.#resolvePrincipal = options.resolvePrincipal;
  }

  /**
   * Apply one command.
   *
   * Never throws: envelope validation, world document rules, store refusals and
   * idempotency conflicts all return a `UiResult` failure. The value on success
   * is always the published revision the command leaves behind; for draft and
   * state commands that is the world's unchanged current revision, which keeps
   * the value type honest.
   */
  async submit(command: UiCommand): Promise<UiResult<UiRevision>> {
    const raw: unknown = command;
    if (!isRecord(raw)) {
      return refuse("INVALID_COMMAND", "A command must be an object.");
    }

    const commandId = raw["commandId"];
    if (!isNonEmptyString(commandId)) {
      return refuse("INVALID_COMMAND", "commandId is required and must be a non-empty string.");
    }
    const kind = raw["kind"];
    if (!isCommandKind(kind)) {
      return refuse("INVALID_COMMAND", `Unknown command kind ${describeValue(kind)}.`);
    }
    const actorId = raw["actorId"];
    if (!isNonEmptyString(actorId)) {
      return refuse("INVALID_COMMAND", "actorId is required and must be a non-empty string.");
    }

    const payloadInput = raw["payload"];
    if (payloadInput !== undefined && !isRecord(payloadInput)) {
      return refuse("INVALID_COMMAND", "payload must be an object when present.");
    }
    const payload: Readonly<Record<string, unknown>> = payloadInput ?? {};
    let verifiedPrincipal: unknown = { trust: "legacy-unverified", actorRef: actorId };
    if (this.#resolvePrincipal !== undefined) {
      try {
        const principal = this.#resolvePrincipal(command);
        if (
          !principal ||
          !isNonEmptyString(principal.ownerRef) ||
          !isNonEmptyString(principal.actorRef) ||
          !isNonEmptyString(principal.deviceRef) ||
          !isNonEmptyString(principal.sessionRef) ||
          !isNonEmptyString(principal.grantRef) ||
          !isNonEmptyString(principal.policyRevision) ||
          !Array.isArray(principal.scopes) ||
          principal.scopes.some(scope => !isNonEmptyString(scope)) ||
          principal.actorRef !== actorId
        ) {
          return refuse("FORBIDDEN", "Verified UI principal is missing or does not match the actor.");
        }
        const needed = kind.startsWith("ui.draft.") ? "ui:draft"
          : kind === "ui.state.set" ? "ui:state"
          : "ui:publish";
        if (!principal.scopes.includes(needed)) return refuse("FORBIDDEN", "UI scope is not granted.");
        // An external state writer cannot participate in the SQLite commit.
        // Never advertise this operation through the trusted atomic interface.
        if (kind === "ui.state.set") return refuse("FORBIDDEN", "State writer has no atomic commit contract.");
        verifiedPrincipal = { trust: "trusted-broker", ...principal };
      } catch {
        return refuse("FORBIDDEN", "Verified UI identity could not be established.");
      }
    }

    let hash: string;
    try {
      hash = commandEnvelopeHash(raw, verifiedPrincipal);
    } catch {
      return refuse("INVALID_COMMAND", "Command envelope contains unsupported or oversized data.");
    }

    try {
      const decision = this.#store.runCommandAtomic({
        commandId,
        envelopeHash: hash,
        actorId,
        kind,
        execute: () => {
          const outcome = this.#execute(kind, payload, raw["expectedRevision"], actorId);
          return {
            outcome,
            result: { ok: true, value: outcome.revision } satisfies UiResult<UiRevision>,
            resource: outcome.resource,
            detail: { ...outcome.detail, commandId },
          };
        },
      });
      if (decision.status === "conflict") {
        return refuse("IDEMPOTENCY_CONFLICT", "commandId has already been used with a different authenticated envelope.");
      }
      if (decision.status === "replayed") return this.#replay(decision.result, commandId);
      if (decision.outcome.published) this.#emit(decision.outcome.revision);
      return { ok: true, value: decision.outcome.revision };
    } catch (error) {
      // Nested SQLite savepoints roll back failures from #execute; preserve the
      // typed UI refusal wrapped by the outer transaction helper.
      const inner = error instanceof UiStoreError && error.cause ? error.cause : error;
      const mapped = this.#mapError(inner);
      this.#auditRejection(actorId, kind, commandId, mapped, "execute");
      return refuse(mapped.code, mapped.message, mapped.currentRevision);
    }
  }

  /** The published revision of `worldId`, or null before that world's first publish. */
  current(worldId: string): UiRevision | null {
    if (!isNonEmptyString(worldId)) return null;
    return this.#store.currentRevision(worldId);
  }

  /** Every registered world with its current revision, oldest registration first. */
  worlds(): Array<{
    worldId: string;
    kind: "home" | "custom";
    title: string;
    accent: string;
    revision: number;
    createdAt: number;
  }> {
    return this.#store.listWorlds();
  }

  /** Drafts newest updated first, optionally narrowed to one world or actor. */
  drafts(filter: { worldId?: string; actorId?: string } = {}): UiDraft[] {
    return this.#store.listDrafts(filter);
  }

  /**
   * Validate one draft without touching published state.
   *
   * The returned hash is the exact candidate a commit would publish, so a client
   * can show "this is what you are about to publish" and compare hashes after the
   * fact. Diagnostics are reported, not enforced: preview is a read.
   */
  preview(draftId: string):
    | {
        readonly ok: true;
        readonly value: {
          readonly draft: UiDraft;
          readonly document: UiDocument;
          readonly contentHash: string;
          readonly diagnostics: UiDocumentDiagnostic[];
        };
      }
    | { readonly ok: false; readonly code: UiErrorCode; readonly message: string } {
    if (!isNonEmptyString(draftId)) {
      return { ok: false, code: "INVALID_COMMAND", message: "draftId must be a non-empty string." };
    }

    let draft: UiDraft | null;
    try {
      draft = this.#store.getDraft(draftId);
    } catch (error) {
      const mapped = this.#mapError(error);
      return { ok: false, code: mapped.code, message: mapped.message };
    }
    if (draft === null) {
      return { ok: false, code: "NOT_FOUND", message: `Draft ${draftId} does not exist.` };
    }

    const diagnostics = this.#world.validate(draft.document);
    let document: UiDocument;
    try {
      document = this.#world.parse(draft.document);
    } catch (error) {
      const failure = this.#documentFailure(error);
      return { ok: false, code: failure.code, message: failure.message };
    }

    return {
      ok: true,
      value: { draft, document, contentHash: this.#world.hash(document), diagnostics },
    };
  }

  /**
   * Subscribe to newly published revisions.
   *
   * Listeners fire after the commit, in registration order. A throwing listener
   * is isolated: it cannot roll back a revision that is already durable.
   */
  onRevision(listener: (revision: UiRevision) => void): () => void {
    if (typeof listener !== "function") throw new TypeError("onRevision requires a listener function.");
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /** `UiRevisionFeed` spelling of {@link onRevision}. */
  subscribe(listener: (revision: UiRevision) => void): () => void {
    return this.onRevision(listener);
  }

  #execute(
    kind: UiCommandKind,
    payload: Readonly<Record<string, unknown>>,
    expectedRevision: unknown,
    actorId: string,
  ): MutationOutcome {
    switch (kind) {
      case "ui.world.create":
        return this.#createWorld(payload, actorId);
      case "ui.draft.create":
        return this.#createDraft(payload, actorId);
      case "ui.draft.edit":
        return this.#editDraft(payload, actorId);
      case "ui.draft.commit":
        return this.#commitDraft(payload, expectedRevision, actorId);
      case "ui.draft.discard":
        return this.#discardDraft(payload, actorId);
      case "ui.publish":
        return this.#publish(payload, expectedRevision, actorId);
      case "ui.rollback":
        return this.#rollback(payload, expectedRevision, actorId);
      case "ui.state.set":
        return this.#setState(payload, actorId);
    }
  }

  /**
   * Create a custom world at revision 1.
   *
   * The world document is the default custom document with the requested id,
   * title and accent applied, so a new world is renderable before anything else
   * is published into it. The store registers the world from the document it
   * publishes, which keeps the registry and the revision series in step.
   */
  #createWorld(payload: Readonly<Record<string, unknown>>, actorId: string): MutationOutcome {
    const requestedId = payload["worldId"];
    if (requestedId !== undefined && !isNonEmptyString(requestedId)) {
      throw new CommandFailure("INVALID_COMMAND", "worldId must be a non-empty string when present.");
    }
    const worldId = requestedId ?? `w_${randomUUID()}`;

    const requestedTitle = payload["title"];
    if (requestedTitle !== undefined && !isNonEmptyString(requestedTitle)) {
      throw new CommandFailure("INVALID_COMMAND", "title must be a non-empty string when present.");
    }
    const requestedAccent = payload["accent"];
    if (requestedAccent !== undefined && !isNonEmptyString(requestedAccent)) {
      throw new CommandFailure("INVALID_COMMAND", "accent must be a non-empty string when present.");
    }

    const existing = this.#store.listWorlds().find((world) => world.worldId === worldId);
    if (existing !== undefined && existing.revision > 0) {
      throw new CommandFailure(
        "REVISION_CONFLICT",
        `World ${worldId} already exists at revision ${existing.revision}.`,
        existing.revision,
      );
    }

    const base = this.#world.defaultDocument("custom");
    const document = this.#acceptDocument({
      ...base,
      world: {
        ...base.world,
        id: worldId,
        kind: "custom",
        title: requestedTitle ?? base.world.title,
        accent: requestedAccent ?? base.world.accent,
      },
    });

    const contentHash = this.#world.hash(document);
    const revision = this.#store.publish({
      worldId,
      document,
      contentHash,
      expectedRevision: 0,
      actorId,
    });

    return {
      revision,
      published: true,
      resource: `ui.world/${worldId}/revision/${revision.revision}`,
      detail: { worldId, revision: revision.revision, contentHash },
    };
  }

  /** Open a draft seeded with the base revision's document, unchanged. */
  #createDraft(payload: Readonly<Record<string, unknown>>, actorId: string): MutationOutcome {
    const worldId = payload["worldId"];
    if (!isNonEmptyString(worldId)) {
      throw new CommandFailure("INVALID_COMMAND", "worldId is required and must be a non-empty string.");
    }
    const current = this.#requireCurrent(worldId);

    const requestedBase = payload["baseRevision"];
    let base = current;
    if (requestedBase !== undefined) {
      if (!isInteger(requestedBase, 1)) {
        throw new CommandFailure("INVALID_COMMAND", "baseRevision must be a positive integer when present.");
      }
      const found = this.#store.getRevision(worldId, requestedBase);
      if (found === null) {
        throw new CommandFailure("NOT_FOUND", `Revision ${requestedBase} does not exist in world ${worldId}.`);
      }
      base = found;
    }

    const requestedId = payload["draftId"];
    if (requestedId !== undefined && !isNonEmptyString(requestedId)) {
      throw new CommandFailure("INVALID_COMMAND", "draftId must be a non-empty string when present.");
    }
    const draftId = requestedId ?? randomUUID();

    const document = this.#acceptDocument(base.document);
    const draft = this.#store.createDraft({
      draftId,
      worldId,
      baseRevision: base.revision,
      document,
      actorId,
    });

    return {
      revision: current,
      published: false,
      resource: `ui.draft/${draft.draftId}`,
      detail: { draftId: draft.draftId, worldId, baseRevision: draft.baseRevision, draftRevision: draft.draftRevision },
    };
  }

  /**
   * Apply semantic operations to a draft.
   *
   * The operations are applied to a copy of the draft document; the published
   * revision is untouched. A stale draft revision is a conflict, because two
   * editors must not silently overwrite each other.
   */
  #editDraft(payload: Readonly<Record<string, unknown>>, actorId: string): MutationOutcome {
    const draftId = payload["draftId"];
    if (!isNonEmptyString(draftId)) {
      throw new CommandFailure("INVALID_COMMAND", "draftId is required and must be a non-empty string.");
    }
    const draft = this.#store.getDraft(draftId);
    if (draft === null) {
      throw new CommandFailure("NOT_FOUND", `Draft ${draftId} does not exist.`);
    }

    const expectedDraftRevision = payload["expectedDraftRevision"];
    if (!isInteger(expectedDraftRevision, 1)) {
      throw new CommandFailure("INVALID_COMMAND", "expectedDraftRevision is required and must be a positive integer.");
    }
    if (draft.draftRevision !== expectedDraftRevision) {
      throw new CommandFailure(
        "REVISION_CONFLICT",
        `Draft ${draftId} is at draft revision ${draft.draftRevision}, not ${expectedDraftRevision}.`,
        draft.draftRevision,
      );
    }

    const operations = payload["operations"];
    if (!Array.isArray(operations)) {
      throw new CommandFailure("INVALID_COMMAND", "operations must be an array.");
    }

    let candidate: UiDocument;
    try {
      candidate = this.#world.applyOperations(draft.document, operations as UiOperation[]);
    } catch (error) {
      throw this.#documentFailure(error);
    }
    const document = this.#acceptDocument(candidate);

    const updated = this.#store.updateDraft({ draftId, expectedDraftRevision, document, actorId });
    const current = this.#requireCurrent(updated.worldId);

    return {
      revision: current,
      published: false,
      resource: `ui.draft/${updated.draftId}`,
      detail: { draftId: updated.draftId, worldId: updated.worldId, draftRevision: updated.draftRevision },
    };
  }

  /** Publish a draft's document under compare-and-swap, then discard the draft. */
  #commitDraft(
    payload: Readonly<Record<string, unknown>>,
    expectedRevision: unknown,
    actorId: string,
  ): MutationOutcome {
    const expected = requireExpectedRevision(expectedRevision);
    const draftId = payload["draftId"];
    if (!isNonEmptyString(draftId)) {
      throw new CommandFailure("INVALID_COMMAND", "draftId is required and must be a non-empty string.");
    }
    const draft = this.#store.getDraft(draftId);
    if (draft === null) {
      throw new CommandFailure("NOT_FOUND", `Draft ${draftId} does not exist.`);
    }

    const document = this.#acceptDocument(draft.document);
    const contentHash = this.#world.hash(document);
    const revision = this.#store.publish({
      worldId: draft.worldId,
      draftId,
      document,
      contentHash,
      expectedRevision: expected,
      actorId,
    });

    // The publish is committed. The draft is the command layer's to delete, and a
    // leftover draft must not turn a committed publish into a failure.
    let draftDiscarded = false;
    try {
      draftDiscarded = this.#store.deleteDraft(draftId);
    } catch {
      /* Retention prunes abandoned drafts; the revision is already durable. */
    }

    return {
      revision,
      published: true,
      resource: `ui.world/${draft.worldId}/revision/${revision.revision}`,
      detail: { worldId: draft.worldId, revision: revision.revision, contentHash, draftId, draftDiscarded },
    };
  }

  /** Delete a draft. The published revision of its world is unchanged. */
  #discardDraft(payload: Readonly<Record<string, unknown>>, _actorId: string): MutationOutcome {
    const draftId = payload["draftId"];
    if (!isNonEmptyString(draftId)) {
      throw new CommandFailure("INVALID_COMMAND", "draftId is required and must be a non-empty string.");
    }
    const draft = this.#store.getDraft(draftId);
    if (draft === null) {
      throw new CommandFailure("NOT_FOUND", `Draft ${draftId} does not exist.`);
    }
    const current = this.#requireCurrent(draft.worldId);
    if (!this.#store.deleteDraft(draftId)) {
      throw new CommandFailure("NOT_FOUND", `Draft ${draftId} does not exist.`);
    }

    return {
      revision: current,
      published: false,
      resource: `ui.draft/${draftId}`,
      detail: { draftId, worldId: draft.worldId, deleted: true },
    };
  }

  /**
   * Publish a document as the next revision of its own world.
   *
   * The target world is the document's `world.id`, so a client cannot publish a
   * document into a world it does not describe. Compare-and-swap is per world.
   */
  #publish(
    payload: Readonly<Record<string, unknown>>,
    expectedRevision: unknown,
    actorId: string,
  ): MutationOutcome {
    const expected = requireExpectedRevision(expectedRevision);
    const input = payload["document"];
    if (input === undefined) {
      throw new CommandFailure("INVALID_COMMAND", "ui.publish requires a document in its payload.");
    }
    const document = this.#acceptDocument(input);
    const worldId = document.world.id;
    const contentHash = this.#world.hash(document);
    const revision = this.#store.publish({ worldId, document, contentHash, expectedRevision: expected, actorId });

    return {
      revision,
      published: true,
      resource: `ui.world/${worldId}/revision/${revision.revision}`,
      detail: { worldId, revision: revision.revision, contentHash },
    };
  }

  /**
   * Publish an earlier revision of a world as a new revision of that world.
   *
   * History stays append-only: the target revision and everything after it
   * remain readable, and the new head has its own number.
   */
  #rollback(
    payload: Readonly<Record<string, unknown>>,
    expectedRevision: unknown,
    actorId: string,
  ): MutationOutcome {
    const expected = requireExpectedRevision(expectedRevision);
    const worldId = payload["worldId"];
    if (!isNonEmptyString(worldId)) {
      throw new CommandFailure("INVALID_COMMAND", "worldId is required and must be a non-empty string.");
    }
    const targetRevision = payload["targetRevision"];
    if (!isInteger(targetRevision, 1)) {
      throw new CommandFailure("INVALID_COMMAND", "targetRevision is required and must be a positive integer.");
    }
    if (this.#store.getRevision(worldId, targetRevision) === null) {
      throw new CommandFailure("NOT_FOUND", `Revision ${targetRevision} does not exist in world ${worldId}.`);
    }

    const revision = this.#store.rollback({ worldId, targetRevision, expectedRevision: expected, actorId });

    return {
      revision,
      published: true,
      resource: `ui.world/${worldId}/revision/${revision.revision}`,
      detail: { worldId, revision: revision.revision, targetRevision },
    };
  }

  /**
   * Write one value into the state projection.
   *
   * A state write changes no document, so the returned value is the affected
   * world's unchanged current revision. The write is still a command: it is
   * idempotent, audited and refused as a whole when the writer refuses it.
   */
  #setState(payload: Readonly<Record<string, unknown>>, _actorId: string): MutationOutcome {
    const writer = this.#writer;
    if (writer === null) {
      throw new CommandFailure("FORBIDDEN", "No state writer is attached to this UI core.");
    }
    const path = payload["path"];
    if (!isNonEmptyString(path)) {
      throw new CommandFailure("INVALID_COMMAND", "path is required and must be a non-empty string.");
    }
    const value = payload["value"];
    if (!isScalar(value)) {
      throw new CommandFailure("INVALID_COMMAND", "value must be a scalar: string, finite number, boolean or null.");
    }

    const worldId = this.#stateWorldId(payload["worldId"]);
    const current = this.#requireCurrent(worldId);

    const written = writer.set(path, value);
    if (!written.ok) {
      throw new CommandFailure(written.code, written.message);
    }

    return {
      revision: current,
      published: false,
      resource: `ui.state/${stripLeadingSlash(path)}`,
      detail: { worldId, path, value: written.value },
    };
  }

  /**
   * The world a state write belongs to.
   *
   * An explicit `worldId` wins. Otherwise the registered home world is used, and
   * a store with exactly one world is unambiguous. Anything else is refused
   * rather than guessed, because a state write must name its audience.
   */
  #stateWorldId(requested: unknown): string {
    if (requested !== undefined) {
      if (!isNonEmptyString(requested)) {
        throw new CommandFailure("INVALID_COMMAND", "worldId must be a non-empty string when present.");
      }
      return requested;
    }
    const worlds = this.#store.listWorlds();
    const home = worlds.find((world) => world.kind === "home");
    if (home !== undefined) return home.worldId;
    const only = worlds[0];
    if (worlds.length === 1 && only !== undefined) return only.worldId;
    throw new CommandFailure(
      "NOT_FOUND",
      "ui.state.set needs a worldId because no single home world is registered.",
    );
  }

  #requireCurrent(worldId: string): UiRevision {
    const current = this.#store.currentRevision(worldId);
    if (current === null) {
      throw new CommandFailure("NOT_FOUND", `World ${worldId} has no published revision.`);
    }
    return current;
  }

  /** Validate, then parse, so the stored document is canonical and frozen. */
  #acceptDocument(input: unknown): UiDocument {
    const diagnostics = this.#world.validate(input);
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
    if (errors.length > 0) {
      throw new CommandFailure("INVALID_DOCUMENT", `Document rejected: ${formatDiagnostics(errors)}.`);
    }
    try {
      return this.#world.parse(input);
    } catch (error) {
      throw this.#documentFailure(error);
    }
  }

  /** Map a world-module failure onto `INVALID_DOCUMENT`, keeping its path. */
  #documentFailure(error: unknown): CommandFailure {
    if (error instanceof CommandFailure) return error;
    const shaped = worldErrorShape(error);
    if (shaped !== null) {
      const path = shaped.path.length > 0 ? shaped.path : "/";
      return new CommandFailure("INVALID_DOCUMENT", `${path}: ${shaped.message} [${shaped.code}]`);
    }
    return new CommandFailure("INVALID_DOCUMENT", error instanceof Error ? error.message : String(error));
  }

  /** Return the stored result of an identical command, without re-executing it. */
  #replay(result: unknown, commandId: string): UiResult<UiRevision> {
    if (!isStoredResult(result)) {
      return refuse("NOT_FOUND", `Command ${commandId} is recorded, but its result is not a readable revision.`);
    }
    return result;
  }

  #auditRejection(
    actorId: string,
    kind: UiCommandKind,
    commandId: string,
    mapped: MappedFailure,
    stage: "idempotency" | "execute",
  ): void {
    if (!isNonEmptyString(actorId)) return;
    try {
      this.#store.audit(actorId, `${kind}.rejected`, `ui.command/${commandId}`, {
        code: mapped.code,
        message: mapped.message,
        stage,
      });
    } catch {
      /* A rejection audit must never mask the typed failure it describes. */
    }
  }

  #mapError(error: unknown): MappedFailure {
    if (error instanceof CommandFailure) {
      return { code: error.code, message: error.message, currentRevision: error.currentRevision };
    }
    if (error instanceof UiStoreError) {
      return mapStoreFailure(error);
    }
    if (error instanceof UiWorldError || worldErrorShape(error) !== null) {
      const failure = this.#documentFailure(error);
      return { code: failure.code, message: failure.message };
    }
    if (isRecord(error) && typeof error["code"] === "string") {
      const code = error["code"];
      if (STORE_ERROR_CODES.has(code)) {
        return mapStoreFailure(error as unknown as UiStoreError);
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    return { code: "LIMIT_EXCEEDED", message: `UI core failed: ${message}` };
  }

  #emit(revision: UiRevision): void {
    for (const listener of [...this.#listeners]) {
      try {
        listener(revision);
      } catch {
        /* A broken listener cannot roll back a committed revision. */
      }
    }
  }
}

/** Map a store code onto the UI error vocabulary. */
function mapStoreCode(code: UiStoreError["code"]): UiErrorCode {
  switch (code) {
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "REVISION_CONFLICT":
      return "REVISION_CONFLICT";
    case "STORE_LOCKED":
    case "UNSUPPORTED_VERSION":
    case "STORE_ERROR":
      return "LIMIT_EXCEEDED";
  }
}

/**
 * `LIMIT_EXCEEDED` is the honest bucket for "the store cannot do this now" (lock
 * held, schema too new, internal store failure); the store code stays in the
 * message so nothing is lost.
 */
function mapStoreFailure(error: UiStoreError): MappedFailure {
  const mapped: MappedFailure = {
    code: mapStoreCode(error.code),
    message: `Store refused the command (${error.code}): ${error.message}`,
  };
  if (error.currentRevision === undefined) return mapped;
  return { ...mapped, currentRevision: error.currentRevision };
}

function refuse<T>(code: UiErrorCode, message: string, currentRevision?: number): UiResult<T> {
  return currentRevision === undefined
    ? { ok: false, code, message }
    : { ok: false, code, message, currentRevision };
}

/** Validate the stored command result before replaying it as a success. */
function isStoredResult(value: unknown): value is { ok: true; value: UiRevision } {
  if (!isRecord(value) || value["ok"] !== true) return false;
  const revision = value["value"];
  if (!isRecord(revision)) return false;
  return (
    isInteger(revision["revision"], 1) &&
    typeof revision["contentHash"] === "string" &&
    typeof revision["actorId"] === "string" &&
    isRecord(revision["document"])
  );
}

function requireExpectedRevision(value: unknown): number {
  if (!isInteger(value, 0)) {
    throw new CommandFailure("INVALID_COMMAND", "expectedRevision is required and must be a non-negative integer.");
  }
  return value;
}

function projectionWriter(projection: UiStateProjection): UiStateWriter {
  return {
    set(path: string, value: UiScalar): UiResult<UiScalar> {
      try {
        projection.set(path, value);
        return { ok: true, value };
      } catch (error) {
        if (error instanceof UiStateProjectionError) {
          return { ok: false, code: error.code, message: error.message };
        }
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, code: "LIMIT_EXCEEDED", message };
      }
    },
  };
}

function collectStateValues(
  input: Readonly<Record<string, unknown>>,
  prefix: string,
  target: Map<string, UiScalar>,
): void {
  for (const [key, value] of Object.entries(input)) {
    const path = normalizeStatePath(key.startsWith("/") ? key : `${prefix}/${key}`);
    if (path === null) {
      throw new UiStateProjectionError("INVALID_COMMAND", `State key ${describeValue(key)} does not form a valid path.`);
    }
    if (isRecord(value)) {
      collectStateValues(value, path, target);
      continue;
    }
    if (!isScalar(value)) {
      throw new UiStateProjectionError("INVALID_COMMAND", `State value at ${path} must be a scalar.`);
    }
    target.set(path, value);
  }
}

/** `/a/b/c` with no empty, `.` or `..` segments; anything else is not a path. */
function normalizeStatePath(path: string): string | null {
  if (typeof path !== "string" || !path.startsWith("/") || path.length < 2) return null;
  const segments = path.slice(1).split("/");
  for (const segment of segments) {
    if (segment.length === 0 || segment === "." || segment === "..") return null;
    if (!/^[A-Za-z0-9_.\-]+$/.test(segment)) return null;
  }
  return `/${segments.join("/")}`;
}

function stripLeadingSlash(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

function formatDiagnostics(diagnostics: readonly UiDocumentDiagnostic[]): string {
  return diagnostics
    .map((diagnostic) => `${diagnostic.path.length > 0 ? diagnostic.path : "/"}: ${diagnostic.message} [${diagnostic.code}]`)
    .join("; ");
}

/** A world-module error by shape, for injected modules that are not `UiWorldError`. */
function worldErrorShape(error: unknown): { code: string; path: string; message: string } | null {
  if (!isRecord(error)) return null;
  const code = error["code"];
  const path = error["path"];
  const message = error["message"];
  if (typeof code !== "string" || typeof path !== "string" || typeof message !== "string") return null;
  return { code, path, message };
}

function isCommandKind(value: unknown): value is UiCommandKind {
  return typeof value === "string" && (COMMAND_KINDS as readonly string[]).includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isInteger(value: unknown, min: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min;
}

function isScalar(value: unknown): value is UiScalar {
  if (value === null) return true;
  switch (typeof value) {
    case "string":
    case "boolean":
      return true;
    case "number":
      return Number.isFinite(value);
    default:
      return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describeValue(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === undefined) return "undefined";
  if (typeof value === "object" && value !== null) return Array.isArray(value) ? "array" : "object";
  return String(value);
}
