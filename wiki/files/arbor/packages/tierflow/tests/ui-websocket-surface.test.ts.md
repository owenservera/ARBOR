# File: packages/tierflow/tests/ui-websocket-surface.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/ui-websocket-surface.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 16326 B |
| Lines | 491 |
| Hash | cf10718c24d8 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HOME_WORLD | const | 25 | no | const HOME_WORLD: UiSocketWorld = { |
| GARDEN_WORLD | const | 34 | no | const GARDEN_WORLD: UiSocketWorld = { |
| WRITE_AUTHORITIES | const | 43 | no | const WRITE_AUTHORITIES: ReadonlySet&lt;Capability&gt; = new Set&lt;Capability&gt;([&quot;read&quot;, &quot;surface.write&quot;]); |
| READ_ONLY_AUTHORITIES | const | 44 | no | const READ_ONLY_AUTHORITIES: ReadonlySet&lt;Capability&gt; = new Set&lt;Capability&gt;([&quot;read&quot;]); |
| Respond | type | 46 | no | type Respond = (command: UiCommand) =&gt; UiResult&lt;UiRevision&gt;; |
| FakeCore | interface | 48 | no | interface FakeCore extends UiSocketCore { |
| FakeCoreOptions | interface | 52 | no | interface FakeCoreOptions { |
| fakeCore | function | 65 | no | function fakeCore(options: FakeCoreOptions = {}): FakeCore { |
| calls | const | 66 | no | const calls: UiCommand[] = []; |
| worlds | const | 67 | no | const worlds = options.worlds ?? [HOME_WORLD, GARDEN_WORLD]; |
| revision | const | 68 | no | const revision = options.revision ?? null; |
| respond | const | 69 | no | const respond: Respond = |
| drafts | const | 86 | no | const drafts = [ |
| ConnectOptions | interface | 97 | no | interface ConnectOptions { |
| Harness | interface | 105 | no | interface Harness { |
| connect | function | 118 | no | function connect(options: ConnectOptions): Harness { |
| bus | const | 119 | no | const bus = new EventBus(options.ring ?? 50); |
| events | const | 120 | no | const events = options.events ?? 0; |
| session | const | 124 | no | const session = new RealtimeSession({ bus, epoch: new ResumeEpoch(options.epoch ?? &quot;proc-a&quot;), revisionOf: () =&gt; 3, }); |
| frames | const | 129 | no | const frames: UiSocketFrame[] = []; |
| socket | const | 130 | no | const socket = new UiSocketSession({ core: options.core, session, actorId: &quot;phone&quot;, send: (frame) =&gt; { |
| documentOf | function | 142 | no | function documentOf(worldId: string, kind: &quot;home&quot; \| &quot;custom&quot; = &quot;home&quot;): UiDocument { |
| revisionOf | function | 159 | no | function revisionOf(worldId: string, revision = 1): UiRevision { |
| draftOf | function | 169 | no | function draftOf(draftId: string, worldId: string) { |
| flush | function | 183 | no | async function flush(): Promise&lt;void&gt; { |
| kinds | function | 187 | no | function kinds(frames: readonly UiSocketFrame[]): string[] { |
| only | function | 191 | no | function only&lt;T extends UiSocketFrame[&quot;kind&quot;]&gt;( frames: readonly UiSocketFrame[], kind: T, ): Extract&lt;UiSocketFrame, { kind: T }&gt; { |
| matching | const | 195 | no | const matching = frames.filter((frame) =&gt; frame.kind === kind); |
| seqsOf | function | 202 | no | function seqsOf(frame: Extract&lt;UiSocketFrame, { kind: &quot;ui.resync&quot; }&gt;): number[] { |
| frame | const | 213 | no | const frame = only(frames, &quot;ui.resync&quot;); |
| frame | const | 227 | no | const frame = only(frames, &quot;ui.resync&quot;); |
| frame | const | 240 | no | const frame = only(frames, &quot;ui.resync&quot;); |
| frame | const | 251 | no | const frame = only(frames, &quot;ui.resync&quot;); |
| error | const | 263 | no | const error = only(frames, &quot;ui.error&quot;); |
| revision | const | 271 | no | const revision = revisionOf(&quot;home&quot;, 2); |
| core | const | 272 | no | const core = fakeCore({ revision, respond: () =&gt; ({ ok: true, value: revision }) }); |
| core | const | 300 | no | const core = fakeCore(); |
| error | const | 310 | no | const error = only(frames, &quot;ui.error&quot;); |
| core | const | 317 | no | const core = fakeCore({ respond: () =&gt; ({ ok: false, code: &quot;REVISION_CONFLICT&quot;, message: &quot;expected revision 4, current revision 7&quot;, |
| error | const | 334 | no | const error = only(frames, &quot;ui.error&quot;); |
| core | const | 342 | no | const core = fakeCore(); |
| error | const | 348 | no | const error = only(frames, &quot;ui.error&quot;); |
| core | const | 354 | no | const core = fakeCore(); |
| error | const | 360 | no | const error = only(frames, &quot;ui.error&quot;); |
| junk | const | 369 | no | const junk: unknown[] = [&quot;{not json&quot;, &quot;{]&quot;, &quot;&quot;, 42, null, undefined, [], { op: &quot;mystery&quot; }, { op: 7 }]; |
| hostile | const | 387 | no | const hostile = { |
| revision | const | 398 | no | const revision = revisionOf(&quot;home&quot;, 4); |
| worlds | const | 404 | no | const worlds = only(frames, &quot;ui.worlds&quot;).worlds; |
| document | const | 407 | no | const document = only(frames, &quot;ui.document&quot;); |
| frame | const | 425 | no | const frame = only(frames, &quot;ui.resync&quot;); |
| revision | const | 432 | no | const revision = revisionOf(&quot;garden&quot;, 9); |
| document | const | 436 | no | const document = only(frames, &quot;ui.document&quot;); |
| session | const | 442 | no | const session = new RealtimeSession({ bus: new EventBus(8), epoch: new ResumeEpoch(&quot;proc-a&quot;), }); |
| socket | const | 446 | no | const socket = new UiSocketSession({ core: fakeCore(), session, actorId: &quot;phone&quot;, send: () =&gt; { |
| rejected | const | 473 | no | const rejected: unknown[] = [ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 11 | external |
| ../src/bus.ts | import | 12 | [packages/tierflow/src/bus.ts](../src/bus.ts.md) |
| ../src/security.ts | import | 13 | [packages/tierflow/src/security.ts](../src/security.ts.md) |
| ../src/ui/realtime.ts | import | 14 | [packages/tierflow/src/ui/realtime.ts](../src/ui/realtime.ts.md) |
| ../src/ui/types.ts | import | 15 | [packages/tierflow/src/ui/types.ts](../src/ui/types.ts.md) |
| ../src/ui/types.ts | import | 16 | [packages/tierflow/src/ui/types.ts](../src/ui/types.ts.md) |
| ../src/surfaces/websocket.ts | import | 17 | [packages/tierflow/src/surfaces/websocket.ts](../src/surfaces/websocket.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * WebSocket surface contract tests.
 *
 * The failure this guards against is silent: a reconnecting client that applies
 * a stale or unreplayable cursor would render old state forever. Every resume
 * path is therefore exercised against a real `EventBus` and `RealtimeSession`,
 * and the command paths are checked for capability refusal, typed errors and
 * the ack/document/worlds sequence a client depends on.
 */

import { describe, expect, test } from "bun:test";
import { EventBus } from "../src/bus.ts";
import type { Capability } from "../src/security.ts";
import { RealtimeSession, ResumeEpoch } from "../src/ui/realtime.ts";
import type { UiCommand, UiDocument, UiRevision, UiResult } from "../src/ui/types.ts";
import { UI_SCHEMA_VERSION } from "../src/ui/types.ts";
import {
  cursorFromMessage,
  UiSocketSession,
  type UiSocketCore,
  type UiSocketFrame,
  type UiSocketWorld,
} from "../src/surfaces/websocket.ts";

const HOME_WORLD: UiSocketWorld = {
  worldId: "home",
  kind: "home",
  title: "Home",
  accent: "#7aa2ff",
  revision: 0,
  createdAt: 1_700_000_000_000,
};

const GARDEN_WORLD: UiSocketWorld = {
  worldId: "garden",
  kind: "custom",
  title: "Garden",
  accent: "#88ddaa",
  revision: 0,
  createdAt: 1_700_000_001_000,
};

const WRITE_AUTHORITIES: ReadonlySet<Capability> = new Set<Capability>(["read", "surface.write"]);
const READ_ONLY_AUTHORITIES: ReadonlySet<Capability> = new Set<Capability>(["read"]);

type Respond = (command: UiCommand) => UiResult<UiRevision>;

interface FakeCore extends UiSocketCore {
  readonly calls: readonly UiCommand[];
}

interface FakeCoreOptions {
  worlds?: UiSocketWorld[];
  revision?: UiRevision | null;
  respond?: Respond;
}

/**
 * Minimal core double.
 *
 * Only `submit` is stateful: it records every command so a test can prove a
 * refused command never reached the core. Reads are pure views over the
 * configured revision.
 */
function fakeCore(options: FakeCoreOptions = {}): FakeCore {
  const calls: UiCommand[] = [];
  const worlds = options.worlds ?? [HOME_WORLD, GARDEN_WORLD];
  const revision = options.revision ?? null;
  const respond: Respond =
    options.respond ??
    (() => ({ ok: true, value: revision ?? revisionOf("home", 1) }));

  return {
    calls,
    async submit(command: UiCommand): Promise<UiResult<UiRevision>> {
      calls.push(command);
      return respond(command);
    },
    current(worldId: string): UiRevision | null {
      return revision !== null && revision.document.world.id === worldId ? revision : null;
```

_First 80 of 492 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
