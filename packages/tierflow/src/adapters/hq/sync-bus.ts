/**
 * HQ sync-bus adapter — the only file in TierFlow that knows HQ exists.
 *
 * Transport: HQ's own `scripts/sync.mjs`, invoked with `Bun.spawn` as an argv
 * array (never a shell string), a bounded timeout and no network. Nothing is
 * imported from HQ and the `.hq/` index is never read.
 *
 * Authority: this adapter only coordinates. It never executes a message body,
 * never approves, never sends outside the bus and never mutates a repository.
 * Every record it returns is validated with `parseCoordinationMessage`, so a
 * record with the wrong authority is refused instead of passed on.
 *
 * Degradation: when HQ is absent the adapter reports
 * `available: false` from `probe()` and throws `CoordinationUnavailableError`
 * from every operation. TierFlow stays usable with the bus switched off.
 */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  COORDINATION_AUTHORITY,
  COORDINATION_CONTRACT,
  COORDINATION_RECEIPT,
  CoordinationInvalidError,
  CoordinationRejectedError,
  CoordinationUnavailableError,
  assertCoordinationOnly,
  parseCoordinationMessage,
  type CoordinationAckInput,
  type CoordinationBus,
  type CoordinationCapabilities,
  type CoordinationCheck,
  type CoordinationCheckQuery,
  type CoordinationClaimInput,
  type CoordinationHandoffInput,
  type CoordinationIdentity,
  type CoordinationInbox,
  type CoordinationInboxQuery,
  type CoordinationMessage,
  type CoordinationPayload,
  type CoordinationReceipt,
  type CoordinationReceiptOp,
  type CoordinationReceiptsQuery,
  type CoordinationRegistration,
  type CoordinationReleaseInput,
  type CoordinationSendInput,
  type CoordinationSendResult,
  type CoordinationStatus,
} from "../../coordination/index.ts";

/** HQ roots tried when neither the constructor nor the environment names one. */
export const HQ_ROOT_CANDIDATES: readonly string[] = [
  "C:/0-BlackBoxProject-0/repos_hq",
  "C:/0-BlackBoxProject-0/repos-hq",
];

/** Bus schema this adapter speaks. */
export const HQ_BUS_SCHEMA = "hq.sync-bus/2";

/** Legacy record schema, still readable. */
export const HQ_LEGACY_BUS_SCHEMA = "hq.sync-msg/1";

export interface HqSyncBusOptions {
  /** Explicit HQ checkout root. When given it is used exclusively. */
  readonly hqRoot?: string;
  /** Interpreter used to run HQ's script. Defaults to the current Bun binary. */
  readonly bunBin?: string;
  /** Project root used for the local receipt mirror when an input omits one. */
  readonly projectRoot?: string;
  /** Hard timeout for one HQ invocation (ms). Default 15000. */
  readonly timeoutMs?: number;
}

interface HqRunResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
}

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Resolve the HQ root.
 *
 * Order: explicit option, `TIERFLOW_HQ_ROOT`, `HQ_ROOT`, then the known
 * checkouts. An explicit root (option or environment) is authoritative: it is
 * never silently replaced by another checkout.
 */
export function resolveHqRoot(explicit?: string): string {
  const given = explicit?.trim();
  if (given) return resolve(given);
  const env = process.env["TIERFLOW_HQ_ROOT"]?.trim() || process.env["HQ_ROOT"]?.trim();
  if (env) return resolve(env);
  for (const candidate of HQ_ROOT_CANDIDATES) {
    if (existsSync(join(candidate, "scripts", "sync.mjs"))) return resolve(candidate);
  }
  return resolve(HQ_ROOT_CANDIDATES[0] ?? ".");
}

function isBunRuntime(): boolean {
  return Boolean((process.versions as Record<string, string | undefined>)["bun"]);
}

/** HQ parses `--flag value`; a value that looks like a flag would be lost. */
function assertFlagSafe(value: string, name: string): void {
  if (value.startsWith("--")) {
    throw new CoordinationInvalidError(`${name} may not start with "--"`, name);
  }
}

function normalizePayload(payload: Partial<CoordinationPayload> | undefined): CoordinationPayload {
  return {
    changed: [...(payload?.changed ?? [])],
    next: [...(payload?.next ?? [])],
    open: [...(payload?.open ?? [])],
    evidence: [...(payload?.evidence ?? [])],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class HqSyncBus implements CoordinationBus {
  readonly #options: HqSyncBusOptions;
  readonly #root: string;
  readonly #bunBin: string;
  readonly #timeoutMs: number;

  constructor(options: HqSyncBusOptions = {}) {
    this.#options = options;
    this.#root = resolveHqRoot(options.hqRoot);
    this.#bunBin = options.bunBin?.trim() || (isBunRuntime() ? process.execPath : "bun");
    this.#timeoutMs = Math.max(1_000, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  }

  /** Absolute path of the HQ root this adapter talks to. */
  get root(): string {
    return this.#root;
  }

  #script(): string {
    return join(this.#root, "scripts", "sync.mjs");
  }

  #requireScript(): string {
    const script = this.#script();
    if (!existsSync(script)) {
      throw new CoordinationUnavailableError(
        "HQ_UNAVAILABLE",
        `hq sync script not found at ${script} (set TIERFLOW_HQ_ROOT to a checkout that contains scripts/sync.mjs)`,
      );
    }
    return script;
  }

  async #run(args: string[]): Promise<HqRunResult> {
    const script = this.#requireScript();
    const proc = Bun.spawn({
      cmd: [this.#bunBin, script, ...args],
      cwd: this.#root,
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
      windowsHide: true,
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        proc.kill();
      } catch {
        // The process may have exited between the timer and the kill.
      }
    }, this.#timeoutMs);
    try {
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      const exitCode = await proc.exited;
      return { exitCode: exitCode ?? -1, stdout, stderr, timedOut };
    } finally {
      clearTimeout(timer);
    }
  }

  #refused(op: string, res: HqRunResult): Error {
    if (res.timedOut) {
      return new CoordinationUnavailableError(
        "HQ_UNAVAILABLE",
        `hq sync ${op} timed out after ${this.#timeoutMs}ms (outcome unknown)`,
      );
    }
    const detail = (res.stderr.trim() || res.stdout.trim() || `exit ${res.exitCode}`).slice(0, 600);
    return new CoordinationRejectedError(`hq sync ${op} refused: ${detail}`, detail);
  }

  #json(op: string, res: HqRunResult): Record<string, unknown> {
    const text = res.stdout.trim();
    if (!text) {
      throw new CoordinationInvalidError(`hq sync ${op} returned no output`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new CoordinationInvalidError(`hq sync ${op} returned output that is not JSON`);
    }
    if (!isRecord(parsed)) {
      throw new CoordinationInvalidError(`hq sync ${op} returned a non-object payload`);
    }
    return parsed;
  }

  /* ---------------------------------------------------------------- */
  /* bus interface                                                    */
  /* ---------------------------------------------------------------- */

  async probe(): Promise<CoordinationCapabilities> {
    const base: CoordinationCapabilities = {
      schema: COORDINATION_CONTRACT,
      provider: { id: "hq-sync-bus", version: "2", root: this.#root },
      busSchema: null,
      available: false,
      reason: null,
      contractVersion: COORDINATION_CONTRACT,
      supports: {
        register: false,
        inbox: false,
        claims: false,
        handoff: false,
        status: false,
        receipts: false,
        ack: false,
        replay: false,
      },
      authority: COORDINATION_AUTHORITY,
    };
    try {
      if (!existsSync(this.#script())) {
        return { ...base, reason: `hq sync script not found at ${this.#script()}` };
      }
      const res = await this.#run(["status", "--json"]);
      if (res.timedOut) {
        return { ...base, reason: `hq sync status timed out after ${this.#timeoutMs}ms` };
      }
      if (res.exitCode !== 0) {
        return { ...base, reason: `hq sync status exited ${res.exitCode}` };
      }
      const data = this.#json("status", res);
      const schema = typeof data["schema"] === "string" ? (data["schema"] as string) : "";
      if (schema !== HQ_BUS_SCHEMA) {
        return { ...base, reason: `unsupported bus schema ${schema || "(none)"}` };
      }
      return {
        ...base,
        available: true,
        busSchema: schema,
        supports: {
          register: true,
          inbox: true,
          claims: true,
          handoff: true,
          status: true,
          receipts: true,
          ack: true,
          replay: true,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ...base, reason: message };
    }
  }

  async register(identity: CoordinationIdentity): Promise<CoordinationRegistration> {
    const space = identity.space?.trim();
    const agent = identity.agent?.trim();
    if (!space) throw new CoordinationInvalidError("register needs a space", "space");
    if (!agent) throw new CoordinationInvalidError("register needs an agent", "agent");
    assertFlagSafe(space, "space");
    assertFlagSafe(agent, "agent");

    const add = await this.#run([
      "space",
      "add",
      "--name",
      space,
      "--repo",
      identity.projectRoot,
      "--agent",
      agent,
      "--json",
    ]);
    if (add.exitCode !== 0) throw this.#refused("space add", add);
    const addData = this.#json("space add", add);
    const changed = Boolean(addData["changed"]);

    const show = await this.#run(["space", "show", "--name", space, "--json"]);
    if (show.exitCode !== 0) throw this.#refused("space show", show);
    this.#json("space show", show);

    return {
      space,
      agent,
      projectRoot: identity.projectRoot,
      changed,
      registered: true,
    };
  }

  async check(input: CoordinationCheckQuery = {}): Promise<CoordinationCheck> {
    const agent = input.agent?.trim();
    if (!agent) throw new CoordinationInvalidError("check needs an agent", "agent");
    assertFlagSafe(agent, "agent");
    const args = ["check", "--as", agent, "--json"];
    if (input.space) args.push("--space", input.space);
    const res = await this.#run(args);
    if (res.timedOut) throw this.#refused("check", res);
    if (res.exitCode === 0) {
      return { agent, unread: false, count: 0, ids: [] };
    }
    if (res.exitCode === 3) {
      let count = 0;
      let ids: string[] = [];
      try {
        const data = this.#json("check", res);
        count = typeof data["unread"] === "number" ? (data["unread"] as number) : 0;
        const raw = data["ids"];
        if (Array.isArray(raw)) ids = raw.filter((item): item is string => typeof item === "string");
      } catch {
        // Unread is known from the exit code even when the body is unusable.
      }
      return { agent, unread: true, count, ids };
    }
    throw this.#refused("check", res);
  }

  async inbox(input: CoordinationInboxQuery = {}): Promise<CoordinationInbox> {
    const agent = input.agent?.trim();
    if (!agent) throw new CoordinationInvalidError("inbox needs an agent", "agent");
    assertFlagSafe(agent, "agent");
    const args = ["inbox", "--as", agent];
    if (typeof input.limit === "number") args.push("--limit", String(input.limit));
    if (input.since) {
      assertFlagSafe(input.since, "since");
      args.push("--since", input.since);
    }
    if (input.peek) args.push("--peek");
    args.push("--json");
    const res = await this.#run(args);
    if (res.exitCode !== 0) throw this.#refused("inbox", res);
    const data = this.#json("inbox", res);
    const raw = data["messages"];
    if (!Array.isArray(raw)) {
      throw new CoordinationInvalidError("hq sync inbox returned no messages array", "messages");
    }
    // Validate everything before returning anything: no partial delivery.
    const messages: CoordinationMessage[] = raw.map((item) => parseCoordinationMessage(item));
    const unread = typeof data["unread"] === "number" ? (data["unread"] as number) : messages.length;
    return { agent, unread, messages };
  }

  async send(input: CoordinationSendInput): Promise<CoordinationSendResult> {
    const kind = input.kind ?? "note";
    const args = this.#sendArgs(input, kind);
    const res = await this.#run(args);
    if (res.exitCode !== 0) throw this.#refused("send", res);
    const data = this.#json("send", res);
    const raw = data["message"];
    const message = raw === undefined || raw === null ? null : parseCoordinationMessage(raw);
    const id = typeof data["id"] === "string" ? (data["id"] as string) : (message?.id ?? "");
    const result: CoordinationSendResult = {
      ok: true,
      id,
      kind,
      duplicate: Boolean(data["duplicate"]),
      message,
      authority: COORDINATION_AUTHORITY,
    };
    this.#mirror("send", result, input.identity, input.to);
    return result;
  }

  async handoff(input: CoordinationHandoffInput): Promise<CoordinationSendResult> {
    const args = this.#sendArgs(input, "handoff", true);
    const res = await this.#run(args);
    if (res.exitCode !== 0) throw this.#refused("handoff", res);
    const data = this.#json("handoff", res);
    const raw = data["message"];
    const message = raw === undefined || raw === null ? null : parseCoordinationMessage(raw);
    const id = typeof data["id"] === "string" ? (data["id"] as string) : (message?.id ?? "");
    const result: CoordinationSendResult = {
      ok: true,
      id,
      kind: "handoff",
      duplicate: Boolean(data["duplicate"]),
      message,
      authority: COORDINATION_AUTHORITY,
    };
    this.#mirror("send", result, input.identity, input.to);
    return result;
  }

  async claim(input: CoordinationClaimInput): Promise<CoordinationSendResult> {
    const args = this.#sendArgs(
      {
        identity: input.identity,
        to: input.to ?? "*",
        kind: "claim",
        topic: input.topic,
        refs: input.refs,
        body: input.body,
        ttlMinutes: input.ttlMinutes,
      },
      "claim",
    );
    const res = await this.#run(args);
    if (res.exitCode !== 0) throw this.#refused("claim", res);
    const data = this.#json("claim", res);
    const raw = data["message"];
    const message = raw === undefined || raw === null ? null : parseCoordinationMessage(raw);
    const id = typeof data["id"] === "string" ? (data["id"] as string) : (message?.id ?? "");
    const result: CoordinationSendResult = {
      ok: true,
      id,
      kind: "claim",
      duplicate: Boolean(data["duplicate"]),
      message,
      authority: COORDINATION_AUTHORITY,
    };
    this.#mirror("claim", result, input.identity, input.to ?? "*");
    return result;
  }

  async release(input: CoordinationReleaseInput): Promise<CoordinationSendResult> {
    const args = this.#sendArgs(
      {
        identity: input.identity,
        to: input.to ?? "*",
        kind: "release",
        topic: input.topic,
        refs: input.refs,
        body: input.body,
      },
      "release",
    );
    const res = await this.#run(args);
    if (res.exitCode !== 0) throw this.#refused("release", res);
    const data = this.#json("release", res);
    const raw = data["message"];
    const message = raw === undefined || raw === null ? null : parseCoordinationMessage(raw);
    const id = typeof data["id"] === "string" ? (data["id"] as string) : (message?.id ?? "");
    const result: CoordinationSendResult = {
      ok: true,
      id,
      kind: "release",
      duplicate: Boolean(data["duplicate"]),
      message,
      authority: COORDINATION_AUTHORITY,
    };
    this.#mirror("claim", result, input.identity, input.to ?? "*");
    return result;
  }

  async ack(input: CoordinationAckInput): Promise<CoordinationSendResult> {
    const agent = input.identity.agent?.trim();
    if (!agent) throw new CoordinationInvalidError("ack needs an agent", "agent");
    assertFlagSafe(agent, "agent");
    assertFlagSafe(input.messageId, "messageId");
    const args = ["ack", "--as", agent, "--message", input.messageId];
    if (input.note) {
      assertFlagSafe(input.note, "note");
      args.push("--note", input.note);
    }
    args.push("--json");
    const res = await this.#run(args);
    if (res.exitCode !== 0) throw this.#refused("ack", res);
    const data = this.#json("ack", res);
    const id = typeof data["id"] === "string" ? (data["id"] as string) : "";
    const ackOf = typeof data["ack_of"] === "string" ? (data["ack_of"] as string) : input.messageId;
    const result: CoordinationSendResult = {
      ok: true,
      id,
      kind: "ack",
      duplicate: Boolean(data["duplicate"]),
      message: null,
      ackOf,
      authority: COORDINATION_AUTHORITY,
    };
    this.#mirror("ack", result, input.identity, ackOf);
    return result;
  }

  async receipts(input: CoordinationReceiptsQuery = {}): Promise<CoordinationReceipt[]> {
    const args = ["receipts"];
    if (input.actor) {
      assertFlagSafe(input.actor, "actor");
      args.push("--actor", input.actor);
    }
    if (input.op) args.push("--op", input.op);
    if (typeof input.limit === "number") args.push("--limit", String(input.limit));
    args.push("--json");
    const res = await this.#run(args);
    if (res.exitCode !== 0) throw this.#refused("receipts", res);
    const data = this.#json("receipts", res);
    const raw = data["receipts"];
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => this.#toReceipt(item));
  }

  async status(): Promise<CoordinationStatus> {
    const res = await this.#run(["status", "--json"]);
    if (res.exitCode !== 0) throw this.#refused("status", res);
    const data = this.#json("status", res);
    return {
      schema: typeof data["schema"] === "string" ? (data["schema"] as string) : "",
      root: typeof data["root"] === "string" ? (data["root"] as string) : this.#root,
      total: typeof data["total"] === "number" ? (data["total"] as number) : 0,
      byKind: this.#counter(data["byKind"]),
      byFrom: this.#counter(data["byFrom"]),
      raw: data,
    };
  }

  /* ---------------------------------------------------------------- */
  /* internals                                                        */
  /* ---------------------------------------------------------------- */

  #counter(value: unknown): Readonly<Record<string, number>> {
    if (!isRecord(value)) return {};
    const out: Record<string, number> = {};
    for (const [key, count] of Object.entries(value)) {
      if (typeof count === "number") out[key] = count;
    }
    return out;
  }

  #toReceipt(item: unknown): CoordinationReceipt {
    if (!isRecord(item)) {
      throw new CoordinationInvalidError("receipt is not an object");
    }
    assertCoordinationOnly(item);
    const op = typeof item["op"] === "string" ? (item["op"] as string) : "send";
    const messageId = item["message_id"] ?? item["messageId"];
    const kind = item["kind"];
    const target = item["target"];
    const digest = item["digest"];
    return {
      schema: typeof item["schema"] === "string" ? (item["schema"] as string) : "",
      seq: typeof item["seq"] === "number" ? (item["seq"] as number) : 0,
      at: typeof item["at"] === "string" ? (item["at"] as string) : "",
      actor: typeof item["actor"] === "string" ? (item["actor"] as string) : "",
      op: (op === "send" || op === "claim" || op === "ack" || op === "read" || op === "repair"
        ? op
        : "send") as CoordinationReceiptOp,
      outcome: typeof item["outcome"] === "string" ? (item["outcome"] as string) : "",
      messageId: typeof messageId === "string" ? messageId : null,
      kind: typeof kind === "string" ? kind : null,
      target: typeof target === "string" ? target : null,
      digest: typeof digest === "string" ? digest : null,
      authority: COORDINATION_AUTHORITY,
    };
  }

  #sendArgs(input: CoordinationSendInput, kind: string, dedicated = false): string[] {
    const agent = input.identity.agent?.trim();
    if (!agent) throw new CoordinationInvalidError("send needs an agent", "agent");
    assertFlagSafe(agent, "agent");
    const to = input.to?.trim();
    if (!to) throw new CoordinationInvalidError("send needs a recipient", "to");
    assertFlagSafe(to, "to");

    const args: string[] = [];
    if (dedicated) {
      args.push("handoff");
    } else {
      args.push("send");
    }
    args.push("--from", agent, "--to", to, "--kind", kind);
    const space = input.identity.space?.trim();
    if (space) {
      assertFlagSafe(space, "space");
      args.push("--space", space);
    }
    if (input.topic) {
      assertFlagSafe(input.topic, "topic");
      args.push("--topic", input.topic);
    }
    const refs = [...(input.refs ?? [])];
    if (refs.length) {
      for (const ref of refs) assertFlagSafe(ref, "refs");
      args.push("--refs", refs.join(","));
    }
    if (input.replyTo) {
      assertFlagSafe(input.replyTo, "replyTo");
      args.push("--reply-to", input.replyTo);
    }
    if (input.ttlMinutes !== undefined && input.ttlMinutes !== null) {
      args.push("--ttl", String(input.ttlMinutes));
    }
    const payload = normalizePayload(input.payload);
    if (payload.changed.length) args.push("--changed", payload.changed.join(","));
    if (payload.next.length) args.push("--next", payload.next.join(","));
    if (payload.open.length) args.push("--open", payload.open.join(","));
    if (payload.evidence.length) args.push("--evidence", payload.evidence.join(","));
    if (input.body) assertFlagSafe(input.body, "body");
    // The body flag is always passed: HQ reads stdin when it is missing, and
    // this adapter never feeds stdin.
    args.push("--body", input.body ?? "");
    args.push("--json");
    return args;
  }

  /**
   * Append one local mirror of the coordination receipt.
   *
   * The mirror is evidence, never authority. A mirror failure must never fail
   * the bus operation, so every error here is swallowed.
   */
  #mirror(
    op: CoordinationReceiptOp,
    result: CoordinationSendResult,
    identity: CoordinationIdentity,
    target: string,
  ): void {
    try {
      const root = identity.projectRoot || this.#options.projectRoot;
      if (!root) return;
      const dir = join(root, "runtime", "coordination");
      mkdirSync(dir, { recursive: true });
      const line = `${JSON.stringify({
        schema: COORDINATION_RECEIPT,
        at: new Date().toISOString(),
        actor: identity.agent,
        op,
        outcome: result.duplicate ? "duplicate" : "created",
        messageId: result.id,
        kind: result.kind,
        target,
        digest: result.message?.digest ?? null,
        authority: COORDINATION_AUTHORITY,
      })}\n`;
      appendFileSync(join(dir, "receipts.jsonl"), line, "utf8");
    } catch {
      // A mirror failure must not fail the bus operation.
    }
  }
}

/** Build the HQ sync-bus adapter. */
export function createHqSyncBus(options: HqSyncBusOptions = {}): CoordinationBus {
  return new HqSyncBus(options);
}

export type { HqSyncBus };
