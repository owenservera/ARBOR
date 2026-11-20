# File: packages/tierflow/src/coordination/poller.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/coordination/poller.ts |
| Language | TypeScript |
| Kind | source |
| Size | 2470 B |
| Lines | 81 |
| Hash | 9fa941018850 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CoordinationPollerOptions | interface | 15 | yes | export interface CoordinationPollerOptions { |
| CoordinationPoller | interface | 26 | yes | export interface CoordinationPoller { |
| DEFAULT_INTERVAL_MS | const | 34 | no | const DEFAULT_INTERVAL_MS = 5_000; |
| createCoordinationPoller | function | 36 | yes | export function createCoordinationPoller(options: CoordinationPollerOptions): CoordinationPoller { |
| intervalMs | const | 37 | no | const intervalMs = Math.max(50, options.intervalMs ?? DEFAULT_INTERVAL_MS); |
| timer | variable | 38 | no | let timer: ReturnType&lt;typeof setInterval&gt; \| null = null; |
| report | function | 40 | no | const report = (error: unknown): void =&gt; { |
| err | const | 41 | no | const err = error instanceof Error ? error : new Error(String(error)); |
| tick | function | 49 | no | const tick = async (): Promise&lt;void&gt; =&gt; { |
| check | const | 51 | no | const check = await options.bus.check({ agent: options.identity.agent }); |
| inbox | const | 53 | no | const inbox = await options.bus.inbox({ agent: options.identity.agent, peek: false, }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./contract.ts | import | 9 | [packages/tierflow/src/coordination/contract.ts](./contract.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/coordination/index.ts](./index.ts.md) | ./poller.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 82 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
