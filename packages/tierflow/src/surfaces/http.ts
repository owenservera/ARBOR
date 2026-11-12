/**
 * HTTP interaction surface for the UI core.
 *
 * This module is an adapter: it turns HTTP requests into `UiCommand`s and reads
 * back worlds, drafts, revisions and the state projection. It imports core
 * types only, and the core never imports it. Nothing here knows about chat,
 * provider coordination or the legacy wire protocol, so any host can mount
 * these routes.
 *
 * The baseline surface is an infinite 3D canvas described by world documents.
 * One world has one revision series, so every published read and every
 * compare-and-swap command names a `worldId`.
 *
 * Every request either produces a response or returns `null`, which tells the
 * host server that the path is not a UI route and routing should continue.
 * Combined with `authorize`, the surface stays transport-agnostic: a Bun
 * server, a test harness and a future browser host all drive it the same way.
 */

import type {
  UiCommand,
  UiCommandPort,
  UiDraft,
  UiErrorCode,
  UiEvent,
  UiRevision,
  UiResult,
} from "../ui/types.ts";

/**
 * One row of the world list.
 *
 * `revision` is the current published revision number for that world and is
 * `0` before the world's first publish; `createdAt` is the world creation time
 * in milliseconds since the epoch.
 */
export interface UiWorldSummary {
  readonly worldId: string;
  readonly kind: "home" | "custom";
  readonly title: string;
  readonly accent: string;
  readonly revision: number;
  readonly createdAt: number;
}

/**
 * Core operations this surface needs beyond the command port.
 *
 * `submit` remains the only mutation path; every read method is a view the core
 * already owns. `revisions`, `projection` and `draft` are optional so a core
 * that keeps less state still serves the routes it can answer. Each optional
 * member documents its degradation, and the surface never throws when one is
 * absent.
 */
export interface UiSurfaceCore extends UiCommandPort {
  /** The published revision of `worldId`, or null when that world has none. */
  current(worldId: string): UiRevision | null;
  /**
   * Every world the installation knows, home world included.
   *
   * The list is the navigation model of the canvas: a client renders it to
   * move between worlds, and the surface republishes it after a commit.
   */
  worlds(): Array<{
    worldId: string;
    kind: "home" | "custom";
    title: string;
    accent: string;
    revision: number;
    createdAt: number;
  }>;
  /**
   * Drafts visible to the caller.
   *
   * `filter` narrows by world and by draft owner; either field may be omitted,
   * and an empty filter returns every draft the core will disclose.
   */
  drafts(filter?: { worldId?: string; actorId?: string }): UiDraft[];
  /**
   * Validates a draft without mutating anything and returns candidate render
   * data. A core may return the payload directly (`document`, `contentHash`,
   * `diagnostics`) or wrap it in a `UiResult` envelope; a failure envelope is
   * mapped onto the route's status like any other typed core error. The
   * surface falls back to the draft's own document and hash for any field the
   * core omits.
   */
  preview(draftId: string): unknown;
  /**
   * Revision history, oldest first, newest `limit` entries when `limit` is
   * given. Absent: history degrades to `[current(worldId)]`.
   */
  revisions?(worldId: string, limit?: number): UiRevision[];
  /** The finite state projection a document may bind to. Absent: `{}`. */
  projection?(): Readonly<Record<string, unknown>>;
  /** Single-draft lookup. Absent: the surface scans `drafts()`. */
  draft?(draftId: string): UiDraft | null;
}

/** Construction inputs for {@link handleUiHttpRequest}. */
export interface UiHttpOptions {
  /** The core this surface drives. Commands are the only way to change it. */
  core: UiSurfaceCore;
  /**
   * Request gate. Absent means every request is allowed; the host server
   * supplies the real capability check, because only it knows the credentials.
   * A refused request receives `403` and the core is never touched.
   */
  authorize?: (request: Request) => boolean;
  /**
   * JSON writer override for a host with a shared response helper. The default
   * writes `application/json; charset=utf-8` with `cache-control: no-store`,
   * because every UI response is live state and must never be cached.
   */
  json?: (data: unknown, status?: number) => Response;
}

/** Frames this surface publishes on its realtime fan-out. */
export type UiWireMessage =
  | {
      readonly kind: "ui.document";
      readonly worldId: string;
      readonly revision: UiRevision;
    }
  | { readonly kind: "ui.draft"; readonly draft: UiDraft }
  | { readonly kind: "ui.worlds"; readonly worlds: readonly UiWorldSummary[] }
  | {
      readonly kind: "ui.error";
      readonly code: UiErrorCode;
      readonly message: string;
      readonly currentRevision?: number;
    }
  | {
      readonly kind: "ui.resync";
      readonly epoch: string;
      readonly oldestSeq: number;
      readonly latestSeq: number;
      readonly gap: boolean;
      readonly revision: number;
      readonly events: readonly UiEvent[];
    };

/** Minimum core a commit broadcast needs: the port, plus worlds when listed. */
export type UiWireCore = UiCommandPort & Partial<Pick<UiSurfaceCore, "worlds">>;

type JsonWriter = (data: unknown, status?: number) => Response;

/** Failure half of {@link UiResult}, which every route error is derived from. */
type UiFailure = {
  readonly ok: false;
  readonly code: UiErrorCode;
  readonly message: string;
  readonly currentRevision?: number;
};

type UiRouteMatch =
  | {
      readonly route: "worlds" | "drafts" | "publish" | "rollback" | "state";
      readonly methods: readonly string[];
    }
  | {
      readonly route: "world" | "world.revisions";
      readonly worldId: string;
      readonly methods: readonly string[];
    }
  | {
      readonly route: "draft" | "draft.edit" | "draft.preview";
      readonly draftId: string;
      readonly methods: readonly string[];
    };

interface UiCommandEnvelope {
  readonly commandId: string;
  readonly actorId: string;
}

/** HTTP status for each typed core error. */
const STATUS_BY_CODE: Readonly<Record<UiErrorCode, number>> = {
  INVALID_COMMAND: 400,
  INVALID_DOCUMENT: 400,
  REVISION_CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  LIMIT_EXCEEDED: 429,
};

const READ_METHODS: readonly string[] = ["GET"];
const WRITE_METHODS: readonly string[] = ["POST"];
const READ_WRITE_METHODS: readonly string[] = ["GET", "POST"];
const DRAFT_METHODS: readonly string[] = ["GET", "DELETE"];

/**
 * Handle one HTTP request against the UI core.
 *
 * @returns a response when `request` addresses a UI route, otherwise `null` so
 * the host server can fall through to its other routes. A path that is not a UI
 * route is never authorized and never read.
 */
export async function handleUiHttpRequest(
  request: Request,
  options: UiHttpOptions,
): Promise<Response | null> {
  const url = new URL(request.url);
  const match = matchUiRoute(url.pathname);
  if (match === null) return null;

  const respond: JsonWriter = options.json ?? jsonResponse;
  const authorize = options.authorize ?? allowAll;
  if (!authorize(request)) {
    return respond({ error: "unauthorized", code: "FORBIDDEN" }, 403);
  }

  if (!match.methods.includes(request.method)) {
    return methodNotAllowed(respond, request.method, match.methods, url.pathname);
  }

  try {
    return await dispatch(url, request, match, options.core, respond);
  } catch (error) {
    return respond({ error: errorMessage(error), code: "INTERNAL" }, 500);
  }
}

/**
 * Frames to publish after `revision` is committed in `worldId`.
 *
 * The document frame comes first so a client applies published state before
 * anything else. The world-list frame follows when the core exposes `worlds()`,
 * because a publish changes that world's `revision` and may accompany a world
 * creation. A plain command port produces the document frame alone.
 */
export function uiWireMessages(
  core: UiWireCore,
  revision: UiRevision,
  worldId: string,
): UiWireMessage[] {
  const frames: UiWireMessage[] = [{ kind: "ui.document", worldId, revision }];
  const listWorlds = core.worlds;
  if (listWorlds !== undefined) {
    frames.push({ kind: "ui.worlds", worlds: listWorlds.call(core) });
  }
  return frames;
}

async function dispatch(
  url: URL,
  request: Request,
  match: UiRouteMatch,
  core: UiSurfaceCore,
  respond: JsonWriter,
): Promise<Response> {
  switch (match.route) {
    case "worlds": {
      if (request.method === "GET") return respond({ worlds: core.worlds() });
      return createWorld(request, core, respond);
    }

    case "world": {
      const worldId = match.worldId;
      const current = core.current(worldId);
      if (current === null) {
        return commandFailure(respond, {
          ok: false,
          code: "NOT_FOUND",
          message: `world "${worldId}" has no published document.`,
        });
      }
      return respond({
        worldId,
        revision: current.revision,
        document: current.document,
        contentHash: current.contentHash,
      });
    }

    case "world.revisions": {
      const limit = readLimit(url.searchParams);
      if (!limit.ok) return commandFailure(respond, limit);

      const worldId = match.worldId;
      const history = historyOf(core, worldId, limit.value);
      return respond({
        revisions: history.map((entry) => ({
          revision: entry.revision,
          contentHash: entry.contentHash,
          createdAt: entry.createdAt,
          actorId: entry.actorId,
        })),
      });
    }

    case "drafts": {
      if (request.method === "GET") return respond({ drafts: listDrafts(core, url.searchParams) });
      return createDraft(request, core, respond);
    }

    case "draft": {
      const draftId = match.draftId;
      if (request.method === "GET") {
        const draft = lookupDraft(core, draftId);
        if (draft === null) return commandFailure(respond, draftNotFound(draftId));
        return respond({ draft });
      }

      const body = await readJsonBody(request);
      if (!body.ok) return commandFailure(respond, body);
      const envelope = readEnvelope(body.value);
      if (!envelope.ok) return commandFailure(respond, envelope);

      const result = await core.submit({
        commandId: envelope.value.commandId,
        kind: "ui.draft.discard",
        actorId: envelope.value.actorId,
        payload: { draftId },
      });
      if (!result.ok) return commandFailure(respond, result);
      return respond({ deleted: true });
    }

    case "draft.edit": {
      const body = await readJsonBody(request);
      if (!body.ok) return commandFailure(respond, body);
      const envelope = readEnvelope(body.value);
      if (!envelope.ok) return commandFailure(respond, envelope);

      const expectedDraftRevision = body.value["expectedDraftRevision"];
      if (!isRevisionNumber(expectedDraftRevision)) {
        return invalid(respond, "expectedDraftRevision must be a non-negative integer.");
      }
      const operations = body.value["operations"];
      if (!Array.isArray(operations)) {
        return invalid(respond, "operations must be an array of semantic edits.");
      }

      const draftId = match.draftId;
      const result = await core.submit({
        commandId: envelope.value.commandId,
        kind: "ui.draft.edit",
        actorId: envelope.value.actorId,
        payload: { draftId, expectedDraftRevision, operations },
      });
      if (!result.ok) return commandFailure(respond, result);

      const draft = lookupDraft(core, draftId);
      if (draft === null) return unreadableResult(respond, "draft edit");
      return respond({ draft });
    }

    case "draft.preview": {
      const body = await readJsonBody(request);
      if (!body.ok) return commandFailure(respond, body);
      const actorId = body.value["actorId"];
      if (typeof actorId !== "string" || actorId.length === 0) {
        return invalid(respond, "actorId is required to preview a draft.");
      }

      const draftId = match.draftId;
      const draft = lookupDraft(core, draftId);
      if (draft === null) return commandFailure(respond, draftNotFound(draftId));

      const candidate = normalizePreview(core.preview(draftId));
      if (!candidate.ok) return commandFailure(respond, candidate);
      const payload = candidate.value;
      return respond({
        draft,
        document: payload["document"] ?? draft.document,
        contentHash: payload["contentHash"] ?? draft.contentHash,
        diagnostics: payload["diagnostics"] ?? [],
      });
    }

    case "publish": {
      const body = await readJsonBody(request);
      if (!body.ok) return commandFailure(respond, body);
      const envelope = readEnvelope(body.value);
      if (!envelope.ok) return commandFailure(respond, envelope);

      const expectedRevision = body.value["expectedRevision"];
      if (!isRevisionNumber(expectedRevision)) {
        return invalid(respond, "expectedRevision must be a non-negative integer.");
      }
      const worldId = body.value["worldId"];
      if (typeof worldId !== "string" || worldId.length === 0) {
        return invalid(respond, "worldId is required to publish.");
      }

      const draftId = body.value["draftId"];
      const document = body.value["document"];
      if (draftId !== undefined && (typeof draftId !== "string" || draftId.length === 0)) {
        return invalid(respond, "draftId must be a non-empty string when present.");
      }
      if (document !== undefined && !isRecord(document)) {
        return invalid(respond, "document must be a world document object.");
      }
      if (typeof draftId === "string" && document !== undefined) {
        return invalid(respond, "publish accepts either draftId or document, not both.");
      }
      if (typeof draftId !== "string" && document === undefined) {
        return invalid(respond, "publish requires a draftId or a document.");
      }

      const command: UiCommand =
        typeof draftId === "string"
          ? {
              commandId: envelope.value.commandId,
              kind: "ui.draft.commit",
              actorId: envelope.value.actorId,
              expectedRevision,
              payload: { worldId, draftId },
            }
          : {
              commandId: envelope.value.commandId,
              kind: "ui.publish",
              actorId: envelope.value.actorId,
              expectedRevision,
              payload: { worldId, document },
            };

      const result = await core.submit(command);
      if (!result.ok) return commandFailure(respond, result);
      return respond({ revision: result.value });
    }

    case "rollback": {
      const body = await readJsonBody(request);
      if (!body.ok) return commandFailure(respond, body);
      const envelope = readEnvelope(body.value);
      if (!envelope.ok) return commandFailure(respond, envelope);

      const expectedRevision = body.value["expectedRevision"];
      if (!isRevisionNumber(expectedRevision)) {
        return invalid(respond, "expectedRevision must be a non-negative integer.");
      }
      const worldId = body.value["worldId"];
      if (typeof worldId !== "string" || worldId.length === 0) {
        return invalid(respond, "worldId is required to roll back.");
      }
      const targetRevision = body.value["targetRevision"];
      if (!isRevisionNumber(targetRevision)) {
        return invalid(respond, "targetRevision must be a non-negative integer.");
      }

      const result = await core.submit({
        commandId: envelope.value.commandId,
        kind: "ui.rollback",
        actorId: envelope.value.actorId,
        expectedRevision,
        payload: { worldId, targetRevision },
      });
      if (!result.ok) return commandFailure(respond, result);
      return respond({ revision: result.value });
    }

    case "state": {
      if (request.method === "GET") {
        const projection = core.projection;
        return respond({ projection: projection === undefined ? {} : projection.call(core) });
      }

      const body = await readJsonBody(request);
      if (!body.ok) return commandFailure(respond, body);
      const envelope = readEnvelope(body.value);
      if (!envelope.ok) return commandFailure(respond, envelope);

      const path = body.value["path"];
      if (typeof path !== "string" || !path.startsWith("/")) {
        return invalid(respond, 'path must be a state path starting with "/".');
      }
      if (!Object.hasOwn(body.value, "value")) {
        return invalid(respond, "value is required; send null to clear a path.");
      }
      const value = body.value["value"];

      const requestedWorldId = body.value["worldId"];
      if (
        requestedWorldId !== undefined &&
        (typeof requestedWorldId !== "string" || requestedWorldId.length === 0)
      ) {
        return invalid(respond, "worldId must be a non-empty string when present.");
      }
      const worldId = requestedWorldId ?? defaultStateWorld(core);

      const result = await core.submit({
        commandId: envelope.value.commandId,
        kind: "ui.state.set",
        actorId: envelope.value.actorId,
        payload: { path, value, ...(worldId === undefined ? {} : { worldId }) },
      });
      if (!result.ok) return commandFailure(respond, result);
      return respond({ path, value });
    }
  }
}

async function createWorld(
  request: Request,
  core: UiSurfaceCore,
  respond: JsonWriter,
): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body.ok) return commandFailure(respond, body);
  const envelope = readEnvelope(body.value);
  if (!envelope.ok) return commandFailure(respond, envelope);

  const worldId = body.value["worldId"];
  if (worldId !== undefined && (typeof worldId !== "string" || worldId.length === 0)) {
    return invalid(respond, "worldId must be a non-empty string when present.");
  }
  const title = body.value["title"];
  if (title !== undefined && typeof title !== "string") {
    return invalid(respond, "title must be a string when present.");
  }
  const accent = body.value["accent"];
  if (accent !== undefined && typeof accent !== "string") {
    return invalid(respond, "accent must be a string when present.");
  }

  const command: UiCommand = {
    commandId: envelope.value.commandId,
    kind: "ui.world.create",
    actorId: envelope.value.actorId,
    payload: {
      ...(worldId === undefined ? {} : { worldId }),
      ...(title === undefined ? {} : { title }),
      ...(accent === undefined ? {} : { accent }),
    },
  };

  const result = await core.submit(command);
  if (!result.ok) return commandFailure(respond, result);
  return respond({ revision: result.value });
}

async function createDraft(
  request: Request,
  core: UiSurfaceCore,
  respond: JsonWriter,
): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body.ok) return commandFailure(respond, body);
  const envelope = readEnvelope(body.value);
  if (!envelope.ok) return commandFailure(respond, envelope);

  const worldId = body.value["worldId"];
  if (typeof worldId !== "string" || worldId.length === 0) {
    return invalid(respond, "worldId is required to create a draft.");
  }
  const baseRevision = body.value["baseRevision"];
  if (baseRevision !== undefined && !isRevisionNumber(baseRevision)) {
    return invalid(respond, "baseRevision must be a non-negative integer when present.");
  }

  const filter = { worldId, actorId: envelope.value.actorId };
  const known = new Set(core.drafts(filter).map((draft) => draft.draftId));
  const command: UiCommand = {
    commandId: envelope.value.commandId,
    kind: "ui.draft.create",
    actorId: envelope.value.actorId,
    ...(baseRevision === undefined ? {} : { expectedRevision: baseRevision }),
    payload: baseRevision === undefined ? { worldId } : { worldId, baseRevision },
  };

  const result = await core.submit(command);
  if (!result.ok) return commandFailure(respond, result);

  const draft = recoverDraft(core, filter, known);
  if (draft === null) return unreadableResult(respond, "draft creation");
  return respond({ draft });
}

/**
 * Find the draft a create command produced.
 *
 * The command port is typed to return a revision, so the resulting draft is
 * recovered from the core: the draft is the newest one that appeared in the
 * actor's list for that world. A replayed commandId produces no new draft, so
 * the actor's most recently updated draft in that world is the best available
 * answer.
 */
function recoverDraft(
  core: UiSurfaceCore,
  filter: { worldId: string; actorId: string },
  known: ReadonlySet<string>,
): UiDraft | null {
  const visible = core.drafts(filter);
  const fresh = visible.filter((draft) => !known.has(draft.draftId));
  if (fresh.length > 0) return newestDraft(fresh);
  return newestDraft(visible);
}

/**
 * Read the drafts route filter from the query string.
 *
 * A parameter that is present and non-empty becomes a filter field; absent or
 * empty parameters leave the result unfiltered.
 */
function listDrafts(core: UiSurfaceCore, params: URLSearchParams): UiDraft[] {
  const worldId = params.get("worldId") ?? undefined;
  const actorId = params.get("actorId") ?? undefined;
  const filter: { worldId?: string; actorId?: string } = {};
  if (worldId !== undefined && worldId.length > 0) filter.worldId = worldId;
  if (actorId !== undefined && actorId.length > 0) filter.actorId = actorId;
  return Object.keys(filter).length === 0 ? core.drafts() : core.drafts(filter);
}

function lookupDraft(core: UiSurfaceCore, draftId: string): UiDraft | null {
  const direct = core.draft;
  if (direct !== undefined) {
    const found = direct.call(core, draftId);
    if (found !== null && found !== undefined) return found;
  }
  return core.drafts().find((draft) => draft.draftId === draftId) ?? null;
}

/**
 * Normalize a `preview` result.
 *
 * A core may answer with the render payload itself or with a `UiResult`
 * envelope around it. Both are accepted so a core that validates eagerly (and
 * therefore needs a failure channel) still maps its refusals onto HTTP status
 * codes instead of returning a misleading empty preview.
 */
function normalizePreview(candidate: unknown): UiResult<Record<string, unknown>> {
  if (!isRecord(candidate)) return { ok: true, value: {} };

  if (candidate["ok"] === false) {
    const code = candidate["code"];
    const message = candidate["message"];
    return {
      ok: false,
      code: isUiErrorCode(code) ? code : "INVALID_COMMAND",
      message: typeof message === "string" ? message : "draft preview failed.",
      ...(typeof candidate["currentRevision"] === "number"
        ? { currentRevision: candidate["currentRevision"] }
        : {}),
    };
  }

  if (candidate["ok"] === true && isRecord(candidate["value"])) {
    return { ok: true, value: candidate["value"] };
  }

  return { ok: true, value: candidate };
}

/**
 * The world a state write defaults to.
 *
 * The state route carries no world in its path, so a write names the home
 * world when the core lists one. A single-world core needs no hint; anything
 * else is left to the core to refuse rather than guessed here.
 */
function defaultStateWorld(core: UiSurfaceCore): string | undefined {
  const worlds = core.worlds();
  const home = worlds.find((world) => world.kind === "home");
  if (home !== undefined) return home.worldId;
  return worlds.length === 1 ? worlds[0]?.worldId : undefined;
}

function newestDraft(drafts: readonly UiDraft[]): UiDraft | null {
  let newest: UiDraft | null = null;
  for (const draft of drafts) {
    if (newest === null || draft.updatedAt > newest.updatedAt) newest = draft;
  }
  return newest;
}

/**
 * Revision history for one world, newest `limit` entries when given.
 *
 * A core without `revisions()` degrades to the current revision alone, so the
 * route still answers with the one revision that is certainly authoritative.
 */
function historyOf(
  core: UiSurfaceCore,
  worldId: string,
  limit: number | undefined,
): readonly UiRevision[] {
  const listed = core.revisions;
  const history = listed === undefined ? fallbackHistory(core.current(worldId)) : listed.call(core, worldId, limit);
  if (limit === undefined) return history;
  return history.slice(-limit);
}

function fallbackHistory(current: UiRevision | null): readonly UiRevision[] {
  return current === null ? [] : [current];
}

/**
 * Parse the `limit` query parameter of a history request.
 *
 * Absent or empty means "no limit". A value that is not a positive integer is
 * rejected as INVALID_COMMAND rather than silently ignored, so a client can
 * tell its request was not understood.
 */
function readLimit(params: URLSearchParams): UiResult<number | undefined> {
  const raw = params.get("limit");
  if (raw === null || raw.length === 0) return { ok: true, value: undefined };
  if (!/^\d+$/.test(raw)) {
    return { ok: false, code: "INVALID_COMMAND", message: "limit must be a positive integer." };
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return { ok: false, code: "INVALID_COMMAND", message: "limit must be a positive integer." };
  }
  return { ok: true, value: parsed };
}

/**
 * Match a pathname to a UI route.
 *
 * Trailing and repeated slashes are ignored. World ids and draft ids are
 * percent-decoded, and a malformed escape makes the path unknown rather than an
 * error, so the server falls through instead of failing the request.
 */
function matchUiRoute(pathname: string): UiRouteMatch | null {
  const segments = pathname
    .replace(/\/{2,}/g, "/")
    .split("/")
    .filter((segment) => segment.length > 0);
  const [api, ui, ...rest] = segments;
  if (api !== "api" || ui !== "ui") return null;

  const [head, ...tail] = rest;
  if (head === undefined) return null;

  if (tail.length === 0) {
    switch (head) {
      case "worlds":
      case "drafts":
      case "state":
        return { route: head, methods: READ_WRITE_METHODS };
      case "publish":
      case "rollback":
        return { route: head, methods: WRITE_METHODS };
      default:
        return null;
    }
  }

  if (head === "worlds") {
    const [worldSegment, ...suffix] = tail;
    if (worldSegment === undefined) return null;
    const worldId = decodeSegment(worldSegment);
    if (worldId === null) return null;

    if (suffix.length === 0) return { route: "world", worldId, methods: READ_METHODS };
    if (suffix.length === 1 && suffix[0] === "revisions") {
      return { route: "world.revisions", worldId, methods: READ_METHODS };
    }
    return null;
  }

  if (head !== "drafts") return null;
  const [draftSegment, ...suffix] = tail;
  if (draftSegment === undefined) return null;
  const draftId = decodeSegment(draftSegment);
  if (draftId === null) return null;

  if (suffix.length === 0) return { route: "draft", draftId, methods: DRAFT_METHODS };
  if (suffix.length !== 1) return null;
  const action = suffix[0];
  if (action === "edit") return { route: "draft.edit", draftId, methods: WRITE_METHODS };
  if (action === "preview") return { route: "draft.preview", draftId, methods: WRITE_METHODS };
  return null;
}

function decodeSegment(segment: string): string | null {
  try {
    const decoded = decodeURIComponent(segment);
    return decoded.length === 0 ? null : decoded;
  } catch {
    return null;
  }
}

async function readJsonBody(request: Request): Promise<UiResult<Record<string, unknown>>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return { ok: false, code: "INVALID_COMMAND", message: "request body must be valid JSON." };
  }
  if (!isRecord(parsed)) {
    return { ok: false, code: "INVALID_COMMAND", message: "request body must be a JSON object." };
  }
  return { ok: true, value: parsed };
}

function readEnvelope(body: Record<string, unknown>): UiResult<UiCommandEnvelope> {
  const commandId = body["commandId"];
  if (typeof commandId !== "string" || commandId.length === 0) {
    return {
      ok: false,
      code: "INVALID_COMMAND",
      message: "commandId is required on every mutating route.",
    };
  }
  const actorId = body["actorId"];
  if (typeof actorId !== "string" || actorId.length === 0) {
    return {
      ok: false,
      code: "INVALID_COMMAND",
      message: "actorId is required on every mutating route.",
    };
  }
  return { ok: true, value: { commandId, actorId } };
}

function commandFailure(respond: JsonWriter, failure: UiFailure): Response {
  return respond(failureBody(failure), STATUS_BY_CODE[failure.code]);
}

function invalid(respond: JsonWriter, message: string): Response {
  return commandFailure(respond, { ok: false, code: "INVALID_COMMAND", message });
}

function unreadableResult(respond: JsonWriter, action: string): Response {
  return respond(
    {
      error: `the core accepted the ${action} but did not return the resulting draft`,
      code: "INTERNAL",
    },
    500,
  );
}

function draftNotFound(draftId: string): UiFailure {
  return { ok: false, code: "NOT_FOUND", message: `draft "${draftId}" does not exist.` };
}

function failureBody(failure: UiFailure): Record<string, unknown> {
  return {
    error: failure.message,
    code: failure.code,
    ...(failure.currentRevision === undefined ? {} : { currentRevision: failure.currentRevision }),
  };
}

function methodNotAllowed(
  respond: JsonWriter,
  method: string,
  allowed: readonly string[],
  pathname: string,
): Response {
  const response = respond(
    { error: `${method} is not allowed on ${pathname}.`, code: "METHOD_NOT_ALLOWED" },
    405,
  );
  const headers = new Headers(response.headers);
  headers.set("allow", allowed.join(", "));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function allowAll(): boolean {
  return true;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "UI surface failed while handling the request.";
}

function isRevisionNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isUiErrorCode(value: unknown): value is UiErrorCode {
  return typeof value === "string" && Object.hasOwn(STATUS_BY_CODE, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
