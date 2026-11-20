# File: packages/tierflow/tests/ui-commands.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/ui-commands.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 22284 B |
| Lines | 546 |
| Hash | d85726fae13f |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | variable | 20 | no | let root = &quot;&quot;; |
| store | variable | 21 | no | let store: UiStore; |
| core | variable | 22 | no | let core: UiCore; |
| sequence | variable | 23 | no | let sequence = 0; |
| command | function | 38 | no | function command( kind: UiCommandKind, payload: Record&lt;string, unknown&gt; = {}, extra: Partial&lt;UiCommand&gt; = {}, ): UiCommand { |
| expectValue | function | 47 | no | function expectValue&lt;T&gt;(result: UiResult&lt;T&gt;): T { |
| expectFailure | function | 52 | no | function expectFailure&lt;T&gt;( result: UiResult&lt;T&gt;, code: UiErrorCode, ): { code: UiErrorCode; message: string; currentRevision?: number } { |
| customDocument | function | 62 | no | function customDocument(worldId: string, title: string): UiDocument { |
| base | const | 63 | no | const base = defaultUiDocument(&quot;custom&quot;); |
| publish | function | 70 | no | async function publish(instance: UiCore, worldId: string, title: string, expectedRevision: number): Promise&lt;void&gt; { |
| createWorld | function | 78 | no | async function createWorld(worldId: string): Promise&lt;void&gt; { |
| result | const | 84 | no | const result = await core.submit({ commandId: &quot;cmd_unknown_kind&quot;, kind: &quot;ui.nope&quot; as UiCommandKind, actorId: &quot;actor_test&quot;, payload: {}, |
| result | const | 95 | no | const result = await core.submit({ commandId: &quot;&quot;, kind: &quot;ui.publish&quot;, actorId: &quot;actor_test&quot;, payload: {} }); |
| result | const | 100 | no | const result = await core.submit({ commandId: &quot;cmd_no_actor&quot;, kind: &quot;ui.publish&quot;, actorId: &quot;&quot;, payload: {} }); |
| result | const | 107 | no | const result = await core.submit( command(&quot;ui.world.create&quot;, { worldId: &quot;w_lab&quot;, title: &quot;Lab&quot;, accent: &quot;#22d3ee&quot; }), ); |
| revision | const | 110 | no | const revision = expectValue(result); |
| worlds | const | 118 | no | const worlds = core.worlds(); |
| created | const | 120 | no | const created = worlds.find((world) =&gt; world.worldId === &quot;w_lab&quot;); |
| result | const | 130 | no | const result = await core.submit(command(&quot;ui.world.create&quot;, { worldId: &quot;w_lab&quot;, title: &quot;Second&quot; })); |
| failure | const | 131 | no | const failure = expectFailure(result, &quot;REVISION_CONFLICT&quot;); |
| stale | const | 152 | no | const stale = await core.submit( command(&quot;ui.publish&quot;, { document: customDocument(&quot;w_canvas&quot;, &quot;Stale&quot;) }, { expectedRevision: 0 }), ); |
| failure | const | 155 | no | const failure = expectFailure(stale, &quot;REVISION_CONFLICT&quot;); |
| result | const | 164 | no | const result = await core.submit( command(&quot;ui.publish&quot;, { document: { schemaVersion: 1 } }, { expectedRevision: 0 }), ); |
| failure | const | 167 | no | const failure = expectFailure(result, &quot;INVALID_DOCUMENT&quot;); |
| document | const | 177 | no | const document = customDocument(&quot;w_canvas&quot;, &quot;Canvas&quot;); |
| first | const | 178 | no | const first = expectValue( await core.submit({ commandId: &quot;cmd_replay&quot;, kind: &quot;ui.publish&quot;, actorId: &quot;actor_test&quot;, |
| replay | const | 188 | no | const replay = expectValue( await core.submit({ commandId: &quot;cmd_replay&quot;, kind: &quot;ui.publish&quot;, actorId: &quot;actor_test&quot;, |
| reused | const | 215 | no | const reused = await core.submit({ commandId: &quot;cmd_reused&quot;, kind: &quot;ui.publish&quot;, actorId: &quot;actor_test&quot;, expectedRevision: 1, |
| created | const | 231 | no | const created = expectValue( await core.submit(command(&quot;ui.draft.create&quot;, { worldId: &quot;w_canvas&quot;, draftId: &quot;draft_1&quot; })), ); |
| seeded | const | 235 | no | const seeded = store.getDraft(&quot;draft_1&quot;); |
| edited | const | 240 | no | const edited = expectValue( await core.submit( command(&quot;ui.draft.edit&quot;, { draftId: &quot;draft_1&quot;, expectedDraftRevision: 1, |
| committed | const | 253 | no | const committed = expectValue( await core.submit(command(&quot;ui.draft.commit&quot;, { draftId: &quot;draft_1&quot; }, { expectedRevision: 1 })), ); |
| stale | const | 275 | no | const stale = await core.submit( command(&quot;ui.draft.edit&quot;, { draftId: &quot;draft_1&quot;, expectedDraftRevision: 1, operations: [{ op: &quot;world.setTitle&quot;, title: &quot;Second&quot; }], |
| result | const | 289 | no | const result = await core.submit(command(&quot;ui.draft.create&quot;, { worldId: &quot;w_missing&quot;, draftId: &quot;draft_1&quot; })); |
| discarded | const | 297 | no | const discarded = expectValue( await core.submit(command(&quot;ui.draft.discard&quot;, { draftId: &quot;draft_1&quot; })), ); |
| draftBefore | const | 320 | no | const draftBefore = store.getDraft(&quot;draft_1&quot;); |
| preview | const | 321 | no | const preview = core.preview(&quot;draft_1&quot;); |
| preview | const | 337 | no | const preview = core.preview(&quot;draft_missing&quot;); |
| rolled | const | 348 | no | const rolled = expectValue( await core.submit( command(&quot;ui.rollback&quot;, { worldId: &quot;w_canvas&quot;, targetRevision: 1 }, { expectedRevision: 2 }), ), ); |
| stale | const | 365 | no | const stale = await core.submit( command(&quot;ui.rollback&quot;, { worldId: &quot;w_canvas&quot;, targetRevision: 1 }, { expectedRevision: 1 }), ); |
| projection | const | 376 | no | const projection = new UiStateProjection({ runs: { live: 4, label: &quot;live&quot; }, theme: &quot;dark&quot; }); |
| projection | const | 395 | no | const projection = new UiStateProjection({ runs: { live: 0 } }); |
| stateCore | const | 396 | no | const stateCore = new UiCore({ store, state: projection }); |
| written | const | 399 | no | const written = expectValue( await stateCore.submit(command(&quot;ui.state.set&quot;, { worldId: &quot;w_canvas&quot;, path: &quot;/runs/live&quot;, value: 7 })), ); |
| refused | const | 406 | no | const refused = await stateCore.submit( command(&quot;ui.state.set&quot;, { worldId: &quot;w_canvas&quot;, path: &quot;/runs/missing&quot;, value: 1 }), ); |
| result | const | 415 | no | const result = await core.submit(command(&quot;ui.state.set&quot;, { worldId: &quot;w_canvas&quot;, path: &quot;/runs/live&quot;, value: 1 })); |
| seen | const | 422 | no | const seen: number[] = []; |
| unsubscribe | const | 423 | no | const unsubscribe = core.onRevision((revision) =&gt; { seen.push(revision.revision); }); |
| seen | const | 443 | no | const seen: number[] = []; |
| expectRefusal | function | 465 | no | function expectRefusal(action: () =&gt; void, code: UiErrorCode): void { |
| base | const | 479 | no | const base = command(&quot;ui.publish&quot;, { document: customDocument(&quot;w_secure&quot;, &quot;Secret&quot;) }, { expectedRevision: 0 }); |
| accepted | const | 480 | no | const accepted = await core.submit(base); |
| variations | const | 482 | no | const variations: UiCommand[] = [ |
| refused | const | 492 | no | const refused = await core.submit(variation); |
| principal | variable | 500 | no | let principal = { |
| secured | const | 505 | no | const secured = new UiCore({ store, resolvePrincipal: () =&gt; principal }); |
| issued | const | 506 | no | const issued = command(&quot;ui.publish&quot;, { document: customDocument(&quot;w_secure&quot;, &quot;Private&quot;) }, { expectedRevision: 0 }); |
| issued | const | 520 | no | const issued = command(&quot;ui.publish&quot;, { document: customDocument(&quot;w_restart&quot;, &quot;Persisted&quot;) }, { expectedRevision: 0 }); |
| a | const | 530 | no | const a = command(&quot;ui.publish&quot;, { document: customDocument(&quot;w_race&quot;, &quot;First&quot;) }, { expectedRevision: 0 }); |
| b | const | 531 | no | const b = command(&quot;ui.publish&quot;, { document: customDocument(&quot;w_race&quot;, &quot;Second&quot;) }, { expectedRevision: 0 }); |
| cyclic | const | 538 | no | const cyclic: Record&lt;string, unknown&gt; = {}; |
| bad | const | 540 | no | const bad = command(&quot;ui.publish&quot;, cyclic, { expectedRevision: 0 }); |
| nonFinite | const | 542 | no | const nonFinite = command(&quot;ui.world.create&quot;, { worldId: &quot;w_bad&quot;, weight: Number.NaN }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 11 | external |
| node:fs | import | 12 | external |
| node:os | import | 13 | external |
| node:path | import | 14 | external |
| ../src/ui/commands.ts | import | 15 | [packages/tierflow/src/ui/commands.ts](../src/ui/commands.ts.md) |
| ../src/ui/store.ts | import | 16 | [packages/tierflow/src/ui/store.ts](../src/ui/store.ts.md) |
| ../src/ui/world.ts | import | 17 | [packages/tierflow/src/ui/world.ts](../src/ui/world.ts.md) |
| ../src/ui/types.ts | import | 18 | [packages/tierflow/src/ui/types.ts](../src/ui/types.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Command-layer contract tests.
 *
 * These cover the promises an adapter relies on: a command is accepted or
 * refused as a whole, a stale compare-and-swap changes nothing, a repeated
 * command id replays instead of publishing twice, and a draft stays private
 * until it is committed. Every test uses a fresh on-disk store under a temporary
 * directory, because durability and revision numbering are part of the contract.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UiCore, UiStateProjection, UiStateProjectionError } from "../src/ui/commands.ts";
import { openUiStore, type UiStore } from "../src/ui/store.ts";
import { defaultUiDocument, parseUiDocument } from "../src/ui/world.ts";
import type { UiCommand, UiCommandKind, UiDocument, UiErrorCode, UiResult, UiScalar } from "../src/ui/types.ts";

let root = "";
let store: UiStore;
let core: UiCore;
let sequence = 0;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "tierflow-ui-commands-"));
  store = openUiStore({ path: join(root, "state.db") });
  core = new UiCore({ store });
  sequence = 0;
});

afterEach(() => {
  store.close();
  rmSync(root, { recursive: true, force: true, maxRetries: 3 });
});

/** A fresh command id keeps unrelated commands from replaying each other. */
function command(
  kind: UiCommandKind,
  payload: Record<string, unknown> = {},
  extra: Partial<UiCommand> = {},
): UiCommand {
  sequence += 1;
  return { commandId: `cmd_${sequence}`, kind, actorId: "actor_test", payload, ...extra };
}

function expectValue<T>(result: UiResult<T>): T {
  if (!result.ok) throw new Error(`Expected a successful result, received ${result.code}: ${result.message}`);
  return result.value;
}

function expectFailure<T>(
  result: UiResult<T>,
  code: UiErrorCode,
): { code: UiErrorCode; message: string; currentRevision?: number } {
  if (result.ok) throw new Error(`Expected ${code}, but the command succeeded.`);
  expect(result.code).toBe(code);
  return result;
}

/** A valid custom document for one world id. */
function customDocument(worldId: string, title: string): UiDocument {
  const base = defaultUiDocument("custom");
  return parseUiDocument({
    ...base,
    world: { ...base.world, id: worldId, kind: "custom", title },
  });
}

async function publish(instance: UiCore, worldId: string, title: string, expectedRevision: number): Promise<void> {
  expectValue(
    await instance.submit(
      command("ui.publish", { document: customDocument(worldId, title) }, { expectedRevision }),
    ),
  );
}

async function createWorld(worldId: string): Promise<void> {
  expectValue(await core.submit(command("ui.world.create", { worldId, title: worldId })));
}
```

_First 80 of 547 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
