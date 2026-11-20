# File: packages/tierflow/src/tier1/agent.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/tier1/agent.ts |
| Language | TypeScript |
| Kind | source |
| Size | 5120 B |
| Lines | 155 |
| Hash | 82837d1abb59 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Turn | interface | 18 | yes | export interface Turn { |
| MODE_RULES | const | 29 | no | const MODE_RULES: ReadonlyArray&lt;readonly [RegExp, IntentMode]&gt; = [ |
| detectMode | function | 38 | yes | export function detectMode(text: string): IntentMode { |
| trimmed | const | 39 | no | const trimmed = text.trim(); |
| Agent | class | 46 | yes | export class Agent { |
| constructor | method | 54 | yes | constructor(input: { bus: EventBus; router: Router; traces: TraceStore; sessionId: string; turns?: number }) { |
| chat | method | 85 | yes | async chat(raw: string, options?: { capabilities?: ReadonlySet&lt;Capability&gt; }): Promise&lt;Turn&gt; { |
| text | const | 86 | no | const text = raw.trim(); |
| mode | const | 87 | no | const mode = detectMode(text); |
| intent | const | 88 | no | const intent: Intent = { |
| result | variable | 107 | no | let result: TurnResult; |
| failed | const | 122 | no | const failed = result.results.some((run) =&gt; run.state === &quot;failed&quot; \|\| run.state === &quot;timed_out&quot;); |
| snapshot | const | 123 | no | const snapshot = this.#traces.end(intent.traceId, failed ? &quot;error&quot; : &quot;ok&quot;); |
| turn | const | 124 | no | const turn = this.#record(intent, result.reply, result.plan.id, snapshot?.totalMs ?? null); |
| turn | const | 129 | no | const turn: Turn = { |
| HELP_TEXT | const | 145 | yes | export const HELP_TEXT = [ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../protocol.ts | import | 12 | [packages/tierflow/src/protocol.ts](../protocol.ts.md) |
| ../bus.ts | import | 13 | [packages/tierflow/src/bus.ts](../bus.ts.md) |
| ../tier2/router.ts | import | 14 | [packages/tierflow/src/tier2/router.ts](../tier2/router.ts.md) |
| ../observability.ts | import | 15 | [packages/tierflow/src/observability.ts](../observability.ts.md) |
| ../security.ts | import | 16 | [packages/tierflow/src/security.ts](../security.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/cli.ts](../cli.ts.md) | ./tier1/agent.ts |
| [packages/tierflow/src/lab.ts](../lab.ts.md) | ./tier1/agent.ts |
| [packages/tierflow/src/server.ts](../server.ts.md) | ./tier1/agent.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 156 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
