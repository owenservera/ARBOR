/**
 * WebSocket interaction surface for the UI core.
 *
 * This module is an adapter: it turns inbound socket messages into `UiCommand`s
 * and reads back published revisions, the world list, drafts and the resume
 * window. It imports core types only, and the core never imports it. Nothing
 * here knows about chat, provider coordination or the legacy wire protocol, so
 * any host can mount it.
 *
 * Two invariants shape the design:
 *
 * - The surface never mutates core state directly. `core.submit` is the only
 *   write path, so validation, idempotency and revision checks stay in the core.
 * - The surface never resolves data flows. It ships world documents; a client
 *   resolves bound values against the state projection it reads over HTTP.
 *
 * Resume is delegated to `RealtimeSession`, so a cursor that fell out of the
 * retained window arrives as an explicit `gap: true` frame instead of a
 * silently partial stream. Frame types are declared here rather than imported
 * from a host protocol module, because the core has no transport.
 */

import type { Capability } from "../security.ts";
import { parseCursor, type RealtimeSession } from "../ui/realtime.ts";
import type {
  UiCommand,
  UiCommandKind,
  UiCommandPort,
  UiCursor,
  UiDraft,
  UiErrorCode,
  UiEvent,
  UiRevision,
  UiResult,
} from "../ui/types.ts";

/** The only capability this surface exercises: mutating world state. */
const WRITE_CAPABILITY: Capability = "surface.write";

/** Every command kind a socket may carry, used by the untrusted-input guard. */
const COMMAND_KINDS: ReadonlySet<string> = new Set<UiCommandKind>([
  "ui.world.create",
  "ui.draft.create",
  "ui.draft.edit",
  "ui.draft.commit",
  "ui.draft.discard",
  "ui.publish",
  "ui.rollback",
  "ui.state.set",
]);

/**
 * One row of the world list as this surface publishes it.
 *
 * `revision` is `0` before a world's first publish, and `createdAt` is the
 * world creation time in milliseconds since the epoch.
 */
export interface UiSocketWorld {
  readonly worldId: string;
  readonly kind: "home" | "custom";
  readonly title: string;
  readonly accent: string;
  readonly revision: number;
  readonly createdAt: number;
}

/**
 * Core operations a socket needs beyond the command port.
 *
 * `submit` remains the only mutation path. Every other member is a view the
 * core already owns: the current revision of one world, the navigable world
 * list, and the drafts visible to this installation. `revisions` is optional so
 * a core that keeps less history still serves the socket.
 */
export interface UiSocketCore extends UiCommandPort {
  /** The published revision of `worldId`, or null when that world has none. */
  current(worldId: string): UiRevision | null;
  /** Every world the installation knows, home world included. */
  worlds(): Array<{
    worldId: string;
    kind: "home" | "custom";
    title: string;
    accent: string;
    revision: number;
    createdAt: number;
  }>;
  /** Drafts visible to the caller, optionally narrowed by world or owner. */
  drafts(filter?: { worldId?: string; actorId?: string }): UiDraft[];
  /**
   * Revision history, oldest first, newest `limit` entries when given.
   * Absent: the socket never sends history frames.
   */
  revisions?(worldId: string, limit?: number): UiRevision[];
}

/** Construction inputs for {@link UiSocketSession}. */
export interface UiSocketOptions {
  /** The core this surface drives. Commands are the only way to change it. */
  core: UiSocketCore;
  /** Resume semantics for the current process, shared across connections. */
  session: RealtimeSession;
  /**
   * Actor attributed to every inbound command.
   *
   * Taken from the connection, never from the message, so a client cannot claim
   * another actor's identity by putting an `actorId` in its command.
   */
  actorId: string;
  /** Writer for one outbound frame. A throwing writer is contained. */
  send: (frame: UiSocketFrame) => void;
  /**
   * Capabilities held by this connection. Absent means every inbound command is
   * allowed, which suits a loopback host that already authenticated the socket
   * and a test harness. The real host passes the token's capability set.
   */
  authorities?: ReadonlySet<Capability>;
}

/**
 * Frames this surface publishes.
 *
 * `ui.worlds` is the navigation model, `ui.document` is published state,
 * `ui.draft` is a private working copy, `ui.resync` is a resume result whose
 * `gap` flag is the client's instruction to replay or to resnapshot, and
 * `ui.error` carries a typed code the client branches on. `ui.ack` confirms the
 * command id was accepted for processing; the matching document frame follows.
 */
export type UiSocketFrame =
  | { readonly kind: "ui.document"; readonly worldId: string; readonly revision: UiRevision }
  | { readonly kind: "ui.worlds"; readonly worlds: readonly UiSocketWorld[] }
  | { readonly kind: "ui.draft"; readonly draft: UiDraft }
  | {
      readonly kind: "ui.resync";
      readonly epoch: string;
      readonly oldestSeq: number;
      readonly latestSeq: number;
      readonly gap: boolean;
      readonly revision: number;
      readonly events: readonly UiEvent[];
    }
  | {
      readonly kind: "ui.error";
      readonly code: UiErrorCode;
      readonly message: string;
      readonly currentRevision?: number;
    }
  | { readonly kind: "ui.ack"; readonly commandId: string };

/**
 * Per-connection socket state.
 *
 * One instance serves exactly one connection. It holds no world state of its
 * own: every read goes back to the core, so a connection cannot diverge from
 * the authoritative document.
 */
export class UiSocketSession {
  readonly #core: UiSocketCore;
  readonly #session: RealtimeSession;
  readonly #actorId: string;
  readonly #send: (frame: UiSocketFrame) => void;
  readonly #authorities: ReadonlySet<Capability> | undefined;

  constructor(options: UiSocketOptions) {
    if (!options || !options.core) throw new TypeError("UiSocketSession requires a core.");
    if (!options.session) throw new TypeError("UiSocketSession requires a realtime session.");
    if (typeof options.send !== "function") throw new TypeError("UiSocketSession requires a send function.");
    if (typeof options.actorId !== "string" || options.actorId.length === 0) {
      throw new TypeError("UiSocketSession requires a non-empty actorId.");
    }
    this.#core = options.core;
    this.#session = options.session;
    this.#actorId = options.actorId;
    this.#send = options.send;
    this.#authorities = options.authorities;
  }

  /**
   * Handle one inbound message.
   *
   * Accepts a JSON string, raw bytes or an already-parsed object, so a host can
   * pass a socket payload straight through. Returns nothing and never throws:
   * malformed JSON, a missing command id and an unknown operation are ignored or
   * answered with a typed error, because one bad frame must not drop the
   * connection.
   *
   * Commands are processed asynchronously; `ui.ack`, `ui.document`, `ui.worlds`
   * and `ui.error` arrive on the writer after the core answers.
   */
  handleInbound(raw: unknown): void {
    try {
      this.#dispatch(raw);
    } catch {
      // A hostile frame must never propagate into the transport loop.
    }
  }

  /**
   * Publish the initial snapshot: the world list, then the home world document.
   *
   * A late-joining client receives the current revision before any live frame,
   * as the realtime contract requires.
   */
  sendInitial(): void {
    const worlds = this.#worlds();
    this.#emit({ kind: "ui.worlds", worlds });
    const home = worlds.find((world) => world.kind === "home");
    if (home === undefined) return;
    const revision = this.#current(home.worldId);
    if (revision === null) return;
    this.#emit({ kind: "ui.document", worldId: home.worldId, revision });
  }

  /**
   * Publish the resume result for a reconnecting client.
   *
   * The `gap` flag is forwarded exactly as `RealtimeSession` decided it: a gap
   * always arrives with an empty event list, never as a partial replay.
   */
  sendResync(cursor: UiCursor | null): void {
    try {
      const resync = this.#session.resume(cursor);
      this.#emit({
        kind: "ui.resync",
        epoch: resync.epoch,
        oldestSeq: resync.oldestSeq,
        latestSeq: resync.latestSeq,
        gap: resync.gap,
        revision: resync.revision,
        events: resync.events,
      });
    } catch {
      // A session that cannot describe its window leaves the client to resnapshot.
    }
  }

  /**
   * Announce a newly published revision.
   *
   * Wired to the core's revision feed; the world id comes from the revision's
   * own document, so a host never has to track it separately.
   */
  broadcastRevision(revision: UiRevision): void {
    try {
      const worldId = revision.document.world.id;
      this.#emit({ kind: "ui.document", worldId, revision });
    } catch {
      // A malformed revision is not worth a connection; skip the frame.
    }
  }

  #dispatch(raw: unknown): void {
    const message = decodeMessage(raw);
    if (message === null) return;

    const commandId = readId(message["commandId"]);
    switch (message["op"]) {
      case "cursor":
        this.#resume(message);
        return;
      case "command":
        this.#command(message, commandId);
        return;
      default:
        // "ping" and unknown operations have no frame of their own; a client
        // that supplied a command id still learns the message was seen.
        if (commandId !== null) this.#emit({ kind: "ui.ack", commandId });
        return;
    }
  }

  #resume(message: Record<string, unknown>): void {
    const cursor = cursorFromMessage(message);
    if (cursor === null) {
      this.#invalid("cursor must carry a non-empty epoch and a non-negative integer seq.");
      return;
    }
    this.sendResync(cursor);
  }

  #command(message: Record<string, unknown>, envelopeCommandId: string | null): void {
    const raw = message["command"];
    if (!isRecord(raw)) {
      this.#invalid("command must be a JSON object.");
      return;
    }

    const commandId = readId(raw["commandId"]) ?? envelopeCommandId;
    if (commandId === null) {
      this.#invalid("commandId is required on every inbound command.");
      return;
    }

    const kind = raw["kind"];
    if (!isCommandKind(kind)) {
      this.#invalid(`unknown command kind ${describeValue(kind)}.`);
      return;
    }

    const expectedRevision = raw["expectedRevision"];
    if (expectedRevision !== undefined && !isRevisionNumber(expectedRevision)) {
      this.#invalid("expectedRevision must be a non-negative integer when present.");
      return;
    }

    const payload = raw["payload"];
    if (payload !== undefined && !isRecord(payload)) {
      this.#invalid("payload must be a JSON object when present.");
      return;
    }

    if (!this.#canWrite()) {
      this.#emit({
        kind: "ui.error",
        code: "FORBIDDEN",
        message: "denied: surface.write capability required",
      });
      return;
    }

    const command: UiCommand = {
      commandId,
      kind,
      actorId: this.#actorId,
      ...(expectedRevision === undefined ? {} : { expectedRevision }),
      ...(payload === undefined ? {} : { payload }),
    };
    void this.#submit(command);
  }

  /**
   * Apply one command and publish its outcome.
   *
   * A thrown core call is reported as `INVALID_COMMAND` because the core's
   * error vocabulary has no transport failure code; a thrown core is a broken
   * core, and the client still needs a terminal frame rather than silence.
   */
  async #submit(command: UiCommand): Promise<void> {
    try {
      const result: UiResult<UiRevision> = await this.#core.submit(command);
      if (!result.ok) {
        this.#emit({
          kind: "ui.error",
          code: result.code,
          message: result.message,
          ...(result.currentRevision === undefined ? {} : { currentRevision: result.currentRevision }),
        });
        return;
      }
      this.#emit({ kind: "ui.ack", commandId: command.commandId });
      this.#emit({
        kind: "ui.document",
        worldId: result.value.document.world.id,
        revision: result.value,
      });
      this.#emit({ kind: "ui.worlds", worlds: this.#worlds() });
    } catch {
      this.#invalid("the core failed to process the command.");
    }
  }

  #invalid(message: string): void {
    this.#emit({ kind: "ui.error", code: "INVALID_COMMAND", message });
  }

  #canWrite(): boolean {
    return this.#authorities === undefined || this.#authorities.has(WRITE_CAPABILITY);
  }

  #worlds(): UiSocketWorld[] {
    try {
      return this.#core.worlds();
    } catch {
      return [];
    }
  }

  #current(worldId: string): UiRevision | null {
    try {
      return this.#core.current(worldId);
    } catch {
      return null;
    }
  }

  /**
   * Write one frame. A dead socket is the host's problem: the core must never
   * see a failed write as a failed command.
   */
  #emit(frame: UiSocketFrame): void {
    try {
      this.#send(frame);
    } catch {
      // Dropped frame; the client's next cursor will reveal the hole.
    }
  }
}

/**
 * Extract a resume cursor from an untrusted message.
 *
 * Accepts the cursor either at the top level (`{ op: "cursor", epoch, seq }`)
 * or under a `cursor` property, and validates it with `parseCursor`, so a
 * negative, fractional or non-string field is rejected before it reaches the
 * resume logic. Returns null when the message carries no usable cursor.
 */
export function cursorFromMessage(message: unknown): UiCursor | null {
  if (!isRecord(message)) return null;
  const direct = parseCursor(message);
  if (direct !== null) return direct;
  try {
    return parseCursor(message["cursor"]);
  } catch {
    return null;
  }
}

/**
 * Decode one inbound payload into a message object.
 *
 * Strings and bytes are parsed as JSON; an already-parsed object is used as is.
 * Returns null for anything else, including malformed JSON and JSON that is not
 * an object, so the caller can ignore the frame without branching further.
 */
function decodeMessage(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === "string") return parseJsonObject(raw);
  if (raw instanceof Uint8Array) return parseJsonObject(new TextDecoder().decode(raw));
  if (raw instanceof ArrayBuffer) return parseJsonObject(new TextDecoder().decode(new Uint8Array(raw)));
  return isRecord(raw) ? raw : null;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isCommandKind(value: unknown): value is UiCommandKind {
  return typeof value === "string" && COMMAND_KINDS.has(value);
}

function isRevisionNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function describeValue(value: unknown): string {
  return typeof value === "string" ? JSON.stringify(value) : typeof value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
