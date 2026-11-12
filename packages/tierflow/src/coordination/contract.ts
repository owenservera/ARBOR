/**
 * Project-neutral coordination contract — `tierflow.coordination/1`.
 *
 * HARD RULE (law, not a convention):
 *   a coordination message is coordination, NEVER permission.
 *
 * Nothing in this module executes, approves, sends externally, mutates a
 * repository or grants authority. It defines shapes, validation and a bus
 * interface. A provider adapter (see `src/adapters/hq/sync-bus.ts`) maps a
 * concrete transport onto these shapes; the core of TierFlow never learns
 * which provider is behind the bus.
 *
 * Records carry `authority: "coordination_only"` and nothing else. Any
 * authority-shaped key (approve, authorization, permission, grant, token,
 * secret, credential, execute, effect, browser, click) is refused at any
 * depth, so a message can never be read as a permission by accident.
 */

/** The contract id every provider adapter declares. */
export const COORDINATION_CONTRACT = "tierflow.coordination/1";

/** Schema id of the local receipt mirror written by an adapter. */
export const COORDINATION_RECEIPT = "tierflow.coordination-receipt/1";

/** The only authority value a coordination record may carry. */
export const COORDINATION_AUTHORITY = "coordination_only";

/** Message kinds, ordered by the coordination lifecycle. */
export const COORDINATION_KINDS = [
  "note",
  "handoff",
  "claim",
  "release",
  "question",
  "answer",
  "status",
  "decision",
  "ack",
] as const;

export type CoordinationKind = (typeof COORDINATION_KINDS)[number];

/** Receipt operations a provider may report. */
export const COORDINATION_RECEIPT_OPS = ["send", "claim", "ack", "read", "repair"] as const;

export type CoordinationReceiptOp = (typeof COORDINATION_RECEIPT_OPS)[number];

/** Keys that would turn a coordination record into a permission. */
export const AUTHORITY_SHAPED_KEYS: readonly string[] = [
  "approve",
  "authorization",
  "permission",
  "grant",
  "token",
  "secret",
  "credential",
  "execute",
  "effect",
  "browser",
  "click",
];

/** The four structured lists a handoff carries. */
export interface CoordinationPayload {
  readonly changed: readonly string[];
  readonly next: readonly string[];
  readonly open: readonly string[];
  readonly evidence: readonly string[];
}

/**
 * One coordination record, normalized to a provider-neutral shape.
 *
 * `schema` keeps the id of the record as delivered by the provider (for
 * example `hq.sync-bus/2`) so a reader can tell a current record from a
 * legacy one. The shape itself never depends on the provider.
 */
export interface CoordinationMessage {
  readonly schema: string;
  readonly seq: number;
  readonly id: string;
  readonly at: string;
  readonly from: string | null;
  readonly fromSpace: string | null;
  readonly to: string | null;
  readonly toSpace: string | null;
  readonly toAgent: string | null;
  readonly kind: CoordinationKind;
  readonly topic: string | null;
  readonly refs: readonly string[];
  readonly replyTo: string | null;
  readonly body: string;
  readonly payload: CoordinationPayload;
  readonly ttlMinutes: number | null;
  readonly expiresAt: string | null;
  readonly ackOf: string | null;
  readonly digest: string;
  readonly authority: typeof COORDINATION_AUTHORITY;
}

/** Evidence of a coordination action. Never an authorization of it. */
export interface CoordinationReceipt {
  readonly schema: string;
  readonly seq: number;
  readonly at: string;
  readonly actor: string;
  readonly op: CoordinationReceiptOp;
  readonly outcome: string;
  readonly messageId: string | null;
  readonly kind: string | null;
  readonly target: string | null;
  readonly digest: string | null;
  readonly authority: typeof COORDINATION_AUTHORITY;
}

/** What a provider adapter can do, discovered by probing it. */
export interface CoordinationCapabilities {
  readonly schema: typeof COORDINATION_CONTRACT;
  readonly provider: {
    readonly id: string;
    readonly version: string;
    readonly root: string;
  };
  /** Schema id the provider reports for its own records (`hq.sync-bus/2`). */
  readonly busSchema?: string | null;
  readonly available: boolean;
  readonly reason: string | null;
  readonly contractVersion: string;
  readonly supports: {
    readonly register: boolean;
    readonly inbox: boolean;
    readonly claims: boolean;
    readonly handoff: boolean;
    readonly status: boolean;
    readonly receipts: boolean;
    readonly ack: boolean;
    readonly replay: boolean;
  };
  readonly authority: typeof COORDINATION_AUTHORITY;
}

/** Who this agent is on the bus: agent name, space and project root. */
export interface CoordinationIdentity {
  readonly agent: string;
  readonly space: string;
  readonly projectRoot: string;
}

/* ------------------------------------------------------------------ */
/* errors                                                             */
/* ------------------------------------------------------------------ */

/** Base class for every coordination failure. */
export class CoordinationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CoordinationError";
    this.code = code;
  }
}

/**
 * The provider is not usable: absent, mismatched or unresponsive.
 * `code` is `HQ_UNAVAILABLE` or `CONTRACT_MISMATCH`.
 */
export class CoordinationUnavailableError extends CoordinationError {
  constructor(code: "HQ_UNAVAILABLE" | "CONTRACT_MISMATCH", message: string) {
    super(code, message);
    this.name = "CoordinationUnavailableError";
  }
}

/** The provider is present but refused the operation. */
export class CoordinationRejectedError extends CoordinationError {
  readonly reason: string;

  constructor(message: string, reason = "rejected") {
    super("COORDINATION_REJECTED", message);
    this.name = "CoordinationRejectedError";
    this.reason = reason;
  }
}

/** A record or request does not satisfy the contract. */
export class CoordinationInvalidError extends CoordinationError {
  readonly path: string | null;

  constructor(message: string, path: string | null = null) {
    super("COORDINATION_INVALID", message);
    this.name = "CoordinationInvalidError";
    this.path = path;
  }
}

/* ------------------------------------------------------------------ */
/* validation                                                         */
/* ------------------------------------------------------------------ */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Collect every violation of the coordination law inside a record.
 *
 * Two classes of violation:
 *   1. an authority-shaped key at any depth (it would imply permission);
 *   2. an `authority` key whose value is not `coordination_only`.
 */
export function findCoordinationViolations(value: unknown, path = ""): string[] {
  const found: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      found.push(...findCoordinationViolations(item, `${path}[${index}]`));
    });
    return found;
  }
  if (!isPlainObject(value)) return found;
  for (const [key, inner] of Object.entries(value)) {
    const where = path ? `${path}.${key}` : key;
    if (AUTHORITY_SHAPED_KEYS.includes(key.toLowerCase())) {
      found.push(`${where}: authority-shaped key`);
    }
    if (key.toLowerCase() === "authority" && inner !== COORDINATION_AUTHORITY) {
      found.push(`${where}: authority must be "${COORDINATION_AUTHORITY}"`);
    }
    if (isPlainObject(inner) || Array.isArray(inner)) {
      found.push(...findCoordinationViolations(inner, where));
    }
  }
  return found;
}

/**
 * Enforce the coordination law on a record.
 *
 * Throws `CoordinationInvalidError` when the record's authority is not
 * `coordination_only` or when it carries an authority-shaped key at any depth.
 */
export function assertCoordinationOnly(record: unknown, path = ""): void {
  const violations = findCoordinationViolations(record, path);
  if (violations.length) {
    throw new CoordinationInvalidError(
      `coordination record violates the coordination-only law: ${violations.join("; ")}`,
      path || null,
    );
  }
  if (!isPlainObject(record)) {
    throw new CoordinationInvalidError("coordination record is not an object", path || null);
  }
  const authority = record["authority"];
  if (authority !== COORDINATION_AUTHORITY) {
    throw new CoordinationInvalidError(
      `coordination record must carry authority "${COORDINATION_AUTHORITY}"`,
      path || null,
    );
  }
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") {
      throw new CoordinationInvalidError(`field ${key} must be a string`, key);
    }
    return value;
  }
  return null;
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new CoordinationInvalidError(`field ${key} must be a finite number`, key);
    }
    return value;
  }
  return null;
}

function readStringList(record: Record<string, unknown>, key: string): readonly string[] {
  const value = record[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new CoordinationInvalidError(`field ${key} must be an array of strings`, key);
  }
  return value as readonly string[];
}

function readPayload(record: Record<string, unknown>): CoordinationPayload {
  const value = record["payload"];
  if (value === undefined || value === null) {
    return { changed: [], next: [], open: [], evidence: [] };
  }
  if (!isPlainObject(value)) {
    throw new CoordinationInvalidError("field payload must be an object", "payload");
  }
  return {
    changed: readStringList(value, "changed"),
    next: readStringList(value, "next"),
    open: readStringList(value, "open"),
    evidence: readStringList(value, "evidence"),
  };
}

/**
 * Validate and normalize a provider record into a `CoordinationMessage`.
 *
 * Accepts the camelCase neutral shape and the snake_case shape used by most
 * file-based buses. Throws `CoordinationInvalidError` on any violation.
 */
export function parseCoordinationMessage(value: unknown): CoordinationMessage {
  if (!isPlainObject(value)) {
    throw new CoordinationInvalidError("coordination message is not an object");
  }
  assertCoordinationOnly(value);

  const kind = value["kind"];
  if (typeof kind !== "string" || !COORDINATION_KINDS.includes(kind as CoordinationKind)) {
    throw new CoordinationInvalidError(
      `unknown coordination kind ${JSON.stringify(kind)} (known: ${COORDINATION_KINDS.join(", ")})`,
      "kind",
    );
  }

  const id = readString(value, "id");
  if (!id || !id.trim()) {
    throw new CoordinationInvalidError("coordination message needs a non-empty id", "id");
  }
  const at = readString(value, "at");
  if (!at) {
    throw new CoordinationInvalidError("coordination message needs an at timestamp", "at");
  }
  const seq = readNumber(value, "seq");
  if (seq === null) {
    throw new CoordinationInvalidError("coordination message needs a numeric seq", "seq");
  }
  const schema = readString(value, "schema") ?? "";
  const digest = readString(value, "digest") ?? "";
  const body = typeof value["body"] === "string" ? (value["body"] as string) : "";

  return {
    schema,
    seq,
    id,
    at,
    from: readString(value, "from"),
    fromSpace: readString(value, "fromSpace", "from_space"),
    to: readString(value, "to"),
    toSpace: readString(value, "toSpace", "to_space"),
    toAgent: readString(value, "toAgent", "to_agent"),
    kind: kind as CoordinationKind,
    topic: readString(value, "topic"),
    refs: readStringList(value, "refs"),
    replyTo: readString(value, "replyTo", "reply_to"),
    body,
    payload: readPayload(value),
    ttlMinutes: readNumber(value, "ttlMinutes", "ttl_minutes"),
    expiresAt: readString(value, "expiresAt", "expires_at"),
    ackOf: readString(value, "ackOf", "ack_of"),
    digest,
    authority: COORDINATION_AUTHORITY,
  };
}

/** Type guard form of `parseCoordinationMessage`: never throws. */
export function isCoordinationMessage(value: unknown): value is CoordinationMessage {
  try {
    parseCoordinationMessage(value);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* bus interface                                                      */
/* ------------------------------------------------------------------ */

export interface CoordinationCheckQuery {
  readonly agent?: string;
  readonly space?: string;
}

export interface CoordinationCheck {
  readonly agent: string;
  readonly unread: boolean;
  readonly count: number;
  readonly ids: readonly string[];
}

export interface CoordinationInboxQuery {
  readonly agent?: string;
  readonly limit?: number;
  readonly since?: string;
  /** `true` reads without advancing the read cursor. */
  readonly peek?: boolean;
}

export interface CoordinationInbox {
  readonly agent: string;
  readonly unread: number;
  readonly messages: readonly CoordinationMessage[];
}

export interface CoordinationSendInput {
  readonly identity: CoordinationIdentity;
  readonly to: string;
  readonly kind?: CoordinationKind;
  readonly topic?: string;
  readonly refs?: readonly string[];
  readonly replyTo?: string | null;
  readonly body?: string;
  readonly payload?: Partial<CoordinationPayload>;
  readonly ttlMinutes?: number | null;
}

export interface CoordinationHandoffInput extends CoordinationSendInput {
  readonly kind?: "handoff";
}

export interface CoordinationClaimInput {
  readonly identity: CoordinationIdentity;
  readonly to?: string;
  readonly refs: readonly string[];
  readonly topic?: string;
  readonly body?: string;
  readonly ttlMinutes?: number | null;
}

export interface CoordinationReleaseInput {
  readonly identity: CoordinationIdentity;
  readonly to?: string;
  readonly refs: readonly string[];
  readonly topic?: string;
  readonly body?: string;
}

export interface CoordinationAckInput {
  readonly identity: CoordinationIdentity;
  readonly messageId: string;
  readonly note?: string;
}

export interface CoordinationSendResult {
  readonly ok: true;
  readonly id: string;
  readonly kind: CoordinationKind;
  readonly duplicate: boolean;
  readonly message: CoordinationMessage | null;
  readonly ackOf?: string | null;
  readonly authority: typeof COORDINATION_AUTHORITY;
}

export interface CoordinationReceiptsQuery {
  readonly actor?: string;
  readonly op?: CoordinationReceiptOp;
  readonly limit?: number;
}

export interface CoordinationRegistration {
  readonly space: string;
  readonly agent: string;
  readonly projectRoot: string;
  readonly changed: boolean;
  readonly registered: boolean;
}

export interface CoordinationStatus {
  readonly schema: string;
  readonly root: string;
  readonly total: number;
  readonly byKind: Readonly<Record<string, number>>;
  readonly byFrom: Readonly<Record<string, number>>;
  readonly raw: unknown;
}

/**
 * The provider-neutral bus surface.
 *
 * Every method coordinates. None of them executes a message body, approves
 * anything, sends anything outside the bus, or mutates a repository.
 */
export interface CoordinationBus {
  probe(): Promise<CoordinationCapabilities>;
  register(identity: CoordinationIdentity): Promise<CoordinationRegistration>;
  check(input?: CoordinationCheckQuery): Promise<CoordinationCheck>;
  inbox(input?: CoordinationInboxQuery): Promise<CoordinationInbox>;
  send(input: CoordinationSendInput): Promise<CoordinationSendResult>;
  handoff(input: CoordinationHandoffInput): Promise<CoordinationSendResult>;
  claim(input: CoordinationClaimInput): Promise<CoordinationSendResult>;
  release(input: CoordinationReleaseInput): Promise<CoordinationSendResult>;
  ack(input: CoordinationAckInput): Promise<CoordinationSendResult>;
  receipts(input?: CoordinationReceiptsQuery): Promise<CoordinationReceipt[]>;
  status(): Promise<CoordinationStatus>;
}
