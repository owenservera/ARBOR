/**
 * Provider-neutral polling loop over a `CoordinationBus`.
 *
 * The poller only reads. It never acknowledges, never executes and never
 * interprets a message body: messages are handed to the caller's callback as
 * data. Reading is not acknowledging, so the poller never calls `ack`.
 */

import {
  type CoordinationBus,
  type CoordinationIdentity,
  type CoordinationMessage,
} from "./contract.ts";

export interface CoordinationPollerOptions {
  readonly bus: CoordinationBus;
  readonly identity: CoordinationIdentity;
  /** Cadence in milliseconds. Default 5000. */
  readonly intervalMs?: number;
  /** Called with the batch of unread messages. Never called for an empty inbox. */
  readonly onMessages?: (messages: readonly CoordinationMessage[]) => void | Promise<void>;
  /** Called when a poll fails. The poller never throws out of its timer. */
  readonly onError?: (error: Error) => void;
}

export interface CoordinationPoller {
  start(): void;
  stop(): void;
  /** One poll cycle. Resolves even when the bus fails. */
  tick(): Promise<void>;
  readonly running: boolean;
}

const DEFAULT_INTERVAL_MS = 5_000;

export function createCoordinationPoller(options: CoordinationPollerOptions): CoordinationPoller {
  const intervalMs = Math.max(50, options.intervalMs ?? DEFAULT_INTERVAL_MS);
  let timer: ReturnType<typeof setInterval> | null = null;

  const report = (error: unknown): void => {
    const err = error instanceof Error ? error : new Error(String(error));
    try {
      options.onError?.(err);
    } catch {
      // Subscriber isolation: a failing error handler must not stop the loop.
    }
  };

  const tick = async (): Promise<void> => {
    try {
      const check = await options.bus.check({ agent: options.identity.agent });
      if (!check.unread) return;
      const inbox = await options.bus.inbox({
        agent: options.identity.agent,
        peek: false,
      });
      if (!inbox.messages.length) return;
      await options.onMessages?.(inbox.messages);
    } catch (error) {
      report(error);
    }
  };

  return {
    get running(): boolean {
      return timer !== null;
    },
    start(): void {
      if (timer) return;
      timer = setInterval(() => {
        void tick();
      }, intervalMs);
    },
    stop(): void {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    },
    tick,
  };
}
