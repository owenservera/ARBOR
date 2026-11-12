/**
 * TIER 1 — user-interactive agent.
 *
 * The only tier that talks to a human. Its whole job is to be an honest,
 * cheap front door: normalize what the human typed into an `Intent`, open an
 * e2e trace, hand it to Tier 2, and narrate what actually happened.
 *
 * It deliberately holds no execution power and no routing policy. Both live
 * behind the boundary so they can be reprogrammed without touching Tier 1.
 */

import { PROTOCOL_VERSION, nextId, type Intent, type IntentMode } from "../protocol.ts";
import type { EventBus } from "../bus.ts";
import type { Router, TurnResult } from "../tier2/router.ts";
import type { TraceStore } from "../observability.ts";
import type { Capability } from "../security.ts";

export interface Turn {
  readonly id: string;
  readonly at: number;
  readonly mode: IntentMode;
  readonly text: string;
  readonly reply: string;
  readonly planId: string | null;
  readonly traceId: string;
  readonly totalMs: number | null;
}

const MODE_RULES: ReadonlyArray<readonly [RegExp, IntentMode]> = [
  [/^!run\b/i, "run"],
  [/^!use\b/i, "run"],
  [/^!design\b/i, "design"],
  [/^!maintain\b/i, "maintain"],
  [/^!inspect\b/i, "inspect"],
  [/^!(sim|simulate)\b/i, "simulate"],
];

export function detectMode(text: string): IntentMode {
  const trimmed = text.trim();
  for (const [pattern, mode] of MODE_RULES) {
    if (pattern.test(trimmed)) return mode;
  }
  return "chat";
}

export class Agent {
  #bus: EventBus;
  #router: Router;
  #traces: TraceStore;
  #sessionId: string;
  #turns: Turn[] = [];
  #bound: number;

  constructor(input: { bus: EventBus; router: Router; traces: TraceStore; sessionId: string; turns?: number }) {
    this.#bus = input.bus;
    this.#router = input.router;
    this.#traces = input.traces;
    this.#sessionId = input.sessionId;
    this.#bound = input.turns ?? 200;

    this.#bus.emit({
      tier: 1,
      type: "tier.ready",
      sessionId: this.#sessionId,
      text: "Tier 1 interactive agent ready",
      data: { protocol: PROTOCOL_VERSION },
    });
  }

  get sessionId(): string {
    return this.#sessionId;
  }

  get turns(): readonly Turn[] {
    return this.#turns;
  }

  /**
   * Handle one user turn.
   *
   * `options.capabilities` is the caller's capability set. When it is
   * omitted the turn is trusted (local CLI, REPL, lab). When it is present the
   * router refuses any effect the set does not allow.
   */
  async chat(raw: string, options?: { capabilities?: ReadonlySet<Capability> }): Promise<Turn> {
    const text = raw.trim();
    const mode = detectMode(text);
    const intent: Intent = {
      version: PROTOCOL_VERSION,
      id: nextId("intent"),
      sessionId: this.#sessionId,
      text,
      mode,
      at: Date.now(),
      traceId: nextId("trace"),
    };

    this.#traces.begin({ traceId: intent.traceId, sessionId: this.#sessionId, intentId: intent.id });
    this.#bus.emit({
      tier: 1,
      type: "intent.received",
      sessionId: this.#sessionId,
      text: text.slice(0, 500),
      data: { mode, intent: intent.id, trace: intent.traceId },
    });

    let result: TurnResult;
    try {
      result = await this.#router.handle(intent, options?.capabilities);
    } catch (error) {
      this.#traces.end(intent.traceId, "error");
      this.#bus.emit({
        tier: 1,
        type: "system.error",
        sessionId: this.#sessionId,
        level: "error",
        text: `tier 2 failure: ${(error as Error).message}`,
      });
      return this.#record(intent, "(tier 2 failed)", null, null);
    }

    const failed = result.results.some((run) => run.state === "failed" || run.state === "timed_out");
    const snapshot = this.#traces.end(intent.traceId, failed ? "error" : "ok");
    const turn = this.#record(intent, result.reply, result.plan.id, snapshot?.totalMs ?? null);
    return turn;
  }

  #record(intent: Intent, reply: string, planId: string | null, totalMs: number | null): Turn {
    const turn: Turn = {
      id: intent.id,
      at: intent.at,
      mode: intent.mode,
      text: intent.text,
      reply,
      planId,
      traceId: intent.traceId,
      totalMs,
    };
    this.#turns.push(turn);
    if (this.#turns.length > this.#bound) this.#turns.splice(0, this.#turns.length - this.#bound);
    return turn;
  }
}

export const HELP_TEXT = [
  "TIER 1 commands:",
  "  !run <argv>                 execute a program (no shell expansion)",
  "  !design <name> :: <argv>    write a new Tier-2 program, hot-load it, run it",
  "  !use <program> [text]       invoke a loaded Tier-2 program explicitly",
  "  !inspect                    probe host toolchain in parallel",
  "  !maintain                   sweep runs, repair what policy allows",
  "  !sim <rate> <seconds>       drive synthetic load through Tier 3",
  "  anything else               chat with Tier 2",
  "Hot reload: edit runtime/programs/*.program.ts or runtime/surface.json — live, no restart.",
].join("\n");
