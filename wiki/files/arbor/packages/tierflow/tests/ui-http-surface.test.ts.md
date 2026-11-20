# File: packages/tierflow/tests/ui-http-surface.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/ui-http-surface.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 35736 B |
| Lines | 979 |
| Hash | 53d08c22d048 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HOME | const | 29 | no | const HOME = &quot;w_home&quot;; |
| JSON_HEADERS | const | 30 | no | const JSON_HEADERS = { &quot;content-type&quot;: &quot;application/json&quot; }; |
| makeDocument | function | 32 | no | function makeDocument(worldId: string, title: string): UiDocument { |
| world | const | 33 | no | const world: UiWorld = { |
| makeRevision | function | 87 | no | function makeRevision( worldId: string, revision: number, title: string, actorId = &quot;alice&quot;, |
| document | const | 93 | no | const document = makeDocument(worldId, title); |
| makeDraft | function | 103 | no | function makeDraft( worldId: string, draftId: string, actorId: string, baseRevision = 1, |
| document | const | 109 | no | const document = makeDocument(worldId, `Draft ${draftId}`); |
| WorldRow | interface | 122 | no | interface WorldRow { |
| InjectedFailure | type | 131 | no | type InjectedFailure = { |
| FakeCore | class | 137 | no | class FakeCore implements UiSurfaceCore { |
| seedWorld | method | 148 | yes | seedWorld( worldId: string, kind: &quot;home&quot; \| &quot;custom&quot; = &quot;custom&quot;, title = worldId, accent = &quot;#f2b134&quot;, |
| seedRevision | method | 160 | yes | seedRevision( worldId: string, revision: number, title: string, actorId = &quot;alice&quot;, |
| log | const | 166 | no | const log = this.revisionsByWorld.get(worldId) ?? []; |
| row | const | 170 | no | const row = this.worldRows.find((entry) =&gt; entry.worldId === worldId); |
| seedDraft | method | 175 | yes | seedDraft(draft: UiDraft): this { |
| current | method | 180 | yes | current(worldId: string): UiRevision \| null { |
| log | const | 181 | no | const log = this.revisionsByWorld.get(worldId); |
| worlds | method | 186 | yes | worlds(): WorldRow[] { |
| revisions | method | 190 | yes | revisions(worldId: string, limit?: number): UiRevision[] { |
| log | const | 191 | no | const log = this.revisionsByWorld.get(worldId) ?? []; |
| drafts | method | 196 | yes | drafts(filter?: { worldId?: string; actorId?: string }): UiDraft[] { |
| preview | method | 204 | yes | preview(draftId: string): unknown { |
| draft | const | 206 | no | const draft = this.draftsById.get(draftId); |
| projection | method | 215 | yes | projection(): Readonly&lt;Record&lt;string, unknown&gt;&gt; { |
| draft | method | 219 | yes | draft(draftId: string): UiDraft \| null { |
| submit | method | 223 | yes | async submit(command: UiCommand): Promise&lt;UiResult&lt;UiRevision&gt;&gt; { |
| payload | const | 227 | no | const payload = command.payload ?? {}; |
| worldId | const | 230 | no | const worldId = |
| title | const | 234 | no | const title = typeof payload[&quot;title&quot;] === &quot;string&quot; ? payload[&quot;title&quot;] : worldId; |
| accent | const | 235 | no | const accent = typeof payload[&quot;accent&quot;] === &quot;string&quot; ? payload[&quot;accent&quot;] : &quot;#4fd1c5&quot;; |
| worldId | const | 241 | no | const worldId = typeof payload[&quot;worldId&quot;] === &quot;string&quot; ? payload[&quot;worldId&quot;] : HOME; |
| requestedBase | const | 242 | no | const requestedBase = payload[&quot;baseRevision&quot;]; |
| baseRevision | const | 243 | no | const baseRevision = |
| document | const | 247 | no | const document = this.current(worldId)?.document ?? makeDocument(worldId, &quot;Draft base&quot;); |
| draft | const | 249 | no | const draft: UiDraft = { |
| draftId | const | 264 | no | const draftId = String(payload[&quot;draftId&quot;] ?? &quot;&quot;); |
| draft | const | 265 | no | const draft = this.draftsById.get(draftId); |
| expected | const | 269 | no | const expected = payload[&quot;expectedDraftRevision&quot;]; |
| draftId | const | 287 | no | const draftId = String(payload[&quot;draftId&quot;] ?? &quot;&quot;); |
| draft | const | 288 | no | const draft = this.draftsById.get(draftId); |
| draftId | const | 297 | no | const draftId = String(payload[&quot;draftId&quot;] ?? &quot;&quot;); |
| draft | const | 298 | no | const draft = this.draftsById.get(draftId); |
| worldId | const | 302 | no | const worldId = typeof payload[&quot;worldId&quot;] === &quot;string&quot; ? payload[&quot;worldId&quot;] : draft.worldId; |
| worldId | const | 311 | no | const worldId = typeof payload[&quot;worldId&quot;] === &quot;string&quot; ? payload[&quot;worldId&quot;] : HOME; |
| document | const | 312 | no | const document = payload[&quot;document&quot;]; |
| worldId | const | 323 | no | const worldId = typeof payload[&quot;worldId&quot;] === &quot;string&quot; ? payload[&quot;worldId&quot;] : HOME; |
| target | const | 324 | no | const target = Number(payload[&quot;targetRevision&quot;] ?? 0); |
| prior | const | 325 | no | const prior = (this.revisionsByWorld.get(worldId) ?? []).find( (entry) =&gt; entry.revision === target, ); |
| path | const | 338 | no | const path = String(payload[&quot;path&quot;] ?? &quot;&quot;); |
| revision | const | 350 | no | const revision: UiRevision = { |
| log | const | 357 | no | const log = this.revisionsByWorld.get(worldId) ?? []; |
| row | const | 362 | no | const row = this.worldRows.find((entry) =&gt; entry.worldId === worldId); |
| call | function | 377 | no | async function call( core: UiSurfaceCore, method: string, path: string, payload?: unknown, |
| send | function | 395 | no | async function send( core: UiSurfaceCore, method: string, path: string, payload?: unknown, |
| response | const | 402 | no | const response = await call(core, method, path, payload, options); |
| body | function | 407 | no | async function body(response: Response): Promise&lt;Record&lt;string, unknown&gt;&gt; { |
| STATE | const | 411 | no | const STATE = { |
| core | const | 420 | no | const core = new FakeCore().seedWorld(HOME, &quot;home&quot;, &quot;Home&quot;).seedRevision(HOME, 1, &quot;Base&quot;); |
| response | const | 421 | no | const response = await send(core, &quot;GET&quot;, &quot;/api/ui/worlds&quot;); |
| core | const | 440 | no | const core = new FakeCore(); |
| response | const | 441 | no | const response = await send(core, &quot;POST&quot;, &quot;/api/ui/worlds&quot;, { commandId: &quot;cmd_world&quot;, actorId: &quot;alice&quot;, worldId: &quot;w_lab&quot;, title: &quot;Lab&quot;, |
| revision | const | 450 | no | const revision = (await body(response))[&quot;revision&quot;] as UiRevision; |
| core | const | 463 | no | const core = new FakeCore().seedRevision(HOME, 2, &quot;Operations&quot;, &quot;bob&quot;); |
| payload | const | 464 | no | const payload = await body(await send(core, &quot;GET&quot;, `/api/ui/worlds/${HOME}`)); |
| core | const | 472 | no | const core = new FakeCore().seedWorld(&quot;w_empty&quot;, &quot;custom&quot;, &quot;Empty&quot;); |
| response | const | 473 | no | const response = await send(core, &quot;GET&quot;, &quot;/api/ui/worlds/w_empty&quot;); |
| core | const | 479 | no | const core = new FakeCore() |
| payload | const | 483 | no | const payload = await body( await send(core, &quot;GET&quot;, `/api/ui/worlds/${HOME}/revisions?limit=2`), ); |
| revisions | const | 486 | no | const revisions = payload[&quot;revisions&quot;] as Array&lt;Record&lt;string, unknown&gt;&gt;; |
| core | const | 498 | no | const core = new FakeCore().seedRevision(HOME, 1, &quot;One&quot;); |
| response | const | 499 | no | const response = await send(core, &quot;GET&quot;, `/api/ui/worlds/${HOME}/revisions?limit=nope`); |
| core | const | 505 | no | const core = new FakeCore() |
| all | const | 510 | no | const all = (await body(await send(core, &quot;GET&quot;, &quot;/api/ui/drafts&quot;)))[&quot;drafts&quot;] as UiDraft[]; |
| byWorld | const | 513 | no | const byWorld = (await body( await send(core, &quot;GET&quot;, `/api/ui/drafts?worldId=${HOME}`), ))[&quot;drafts&quot;] as UiDraft[]; |
| byActor | const | 518 | no | const byActor = (await body( await send(core, &quot;GET&quot;, &quot;/api/ui/drafts?actorId=alice&quot;), ))[&quot;drafts&quot;] as UiDraft[]; |
| both | const | 523 | no | const both = (await body( await send(core, &quot;GET&quot;, `/api/ui/drafts?worldId=${HOME}&amp;actorId=alice`), ))[&quot;drafts&quot;] as UiDraft[]; |
| core | const | 530 | no | const core = new FakeCore().seedRevision(HOME, 3, &quot;Operations&quot;); |
| response | const | 531 | no | const response = await send(core, &quot;POST&quot;, &quot;/api/ui/drafts&quot;, { commandId: &quot;cmd_create&quot;, actorId: &quot;alice&quot;, worldId: HOME, baseRevision: 3, |
| draft | const | 539 | no | const draft = (await body(response))[&quot;draft&quot;] as UiDraft; |
| core | const | 554 | no | const core = new FakeCore(); |
| response | const | 555 | no | const response = await send(core, &quot;POST&quot;, &quot;/api/ui/drafts&quot;, { commandId: &quot;cmd_create&quot;, actorId: &quot;alice&quot;, }); |
| core | const | 565 | no | const core = new FakeCore().seedDraft(makeDraft(HOME, &quot;draft_a&quot;, &quot;alice&quot;)); |
| found | const | 566 | no | const found = await body(await send(core, &quot;GET&quot;, &quot;/api/ui/drafts/draft_a&quot;)); |
| missing | const | 569 | no | const missing = await send(core, &quot;GET&quot;, &quot;/api/ui/drafts/nope&quot;); |
| core | const | 575 | no | const core = new FakeCore().seedDraft(makeDraft(HOME, &quot;draft_a&quot;, &quot;alice&quot;)); |
| response | const | 576 | no | const response = await send(core, &quot;DELETE&quot;, &quot;/api/ui/drafts/draft_a&quot;, { commandId: &quot;cmd_discard&quot;, actorId: &quot;alice&quot;, }); |
| core | const | 589 | no | const core = new FakeCore().seedDraft(makeDraft(HOME, &quot;draft_a&quot;, &quot;alice&quot;)); |
| operations | const | 590 | no | const operations = [{ op: &quot;object.setProp&quot;, objectId: &quot;obj_runs&quot;, prop: &quot;value&quot;, value: 3 }]; |
| response | const | 591 | no | const response = await send(core, &quot;POST&quot;, &quot;/api/ui/drafts/draft_a/edit&quot;, { commandId: &quot;cmd_edit&quot;, actorId: &quot;alice&quot;, expectedDraftRevision: 1, operations, |
| core | const | 609 | no | const core = new FakeCore().seedDraft(makeDraft(HOME, &quot;draft_a&quot;, &quot;alice&quot;)); |
| payload | const | 610 | no | const payload = await body( await send(core, &quot;POST&quot;, &quot;/api/ui/drafts/draft_a/preview&quot;, { actorId: &quot;alice&quot; }), ); |
| core | const | 621 | no | const core = new FakeCore().seedDraft(makeDraft(HOME, &quot;draft_a&quot;, &quot;alice&quot;)); |
| response | const | 622 | no | const response = await send(core, &quot;POST&quot;, &quot;/api/ui/drafts/draft_a/preview&quot;, {}); |
| core | const | 628 | no | const core = new FakeCore().seedDraft(makeDraft(HOME, &quot;draft_a&quot;, &quot;alice&quot;)); |
| document | const | 629 | no | const document = makeDocument(HOME, &quot;Preview&quot;); |
| payload | const | 639 | no | const payload = await body( await send(core, &quot;POST&quot;, &quot;/api/ui/drafts/draft_a/preview&quot;, { actorId: &quot;alice&quot; }), ); |
| refused | const | 651 | no | const refused = await send(core, &quot;POST&quot;, &quot;/api/ui/drafts/draft_a/preview&quot;, { actorId: &quot;alice&quot;, }); |
| core | const | 662 | no | const core = new FakeCore() |
| payload | const | 665 | no | const payload = await body( await send(core, &quot;POST&quot;, &quot;/api/ui/publish&quot;, { commandId: &quot;cmd_publish&quot;, actorId: &quot;alice&quot;, expectedRevision: 3, |
| core | const | 683 | no | const core = new FakeCore().seedRevision(HOME, 3, &quot;Operations&quot;); |
| document | const | 684 | no | const document = makeDocument(HOME, &quot;Direct&quot;); |
| payload | const | 685 | no | const payload = await body( await send(core, &quot;POST&quot;, &quot;/api/ui/publish&quot;, { commandId: &quot;cmd_publish&quot;, actorId: &quot;alice&quot;, expectedRevision: 3, |
| core | const | 704 | no | const core = new FakeCore(); |
| base | const | 705 | no | const base = { commandId: &quot;cmd_publish&quot;, actorId: &quot;alice&quot;, expectedRevision: 0 }; |
| neither | const | 707 | no | const neither = await send(core, &quot;POST&quot;, &quot;/api/ui/publish&quot;, { ...base, worldId: HOME }); |
| both | const | 711 | no | const both = await send(core, &quot;POST&quot;, &quot;/api/ui/publish&quot;, { ...base, worldId: HOME, draftId: &quot;draft_a&quot;, document: makeDocument(HOME, &quot;Direct&quot;), |
| noWorld | const | 720 | no | const noWorld = await send(core, &quot;POST&quot;, &quot;/api/ui/publish&quot;, { ...base, document: makeDocument(HOME, &quot;Direct&quot;), }); |
| core | const | 730 | no | const core = new FakeCore() |
| payload | const | 733 | no | const payload = await body( await send(core, &quot;POST&quot;, &quot;/api/ui/rollback&quot;, { commandId: &quot;cmd_rollback&quot;, actorId: &quot;alice&quot;, expectedRevision: 2, |
| revision | const | 742 | no | const revision = payload[&quot;revision&quot;] as UiRevision; |
| core | const | 753 | no | const core = new FakeCore(); |
| core | const | 760 | no | const core = new FakeCore(); |
| payload | const | 761 | no | const payload = await body(await send(core, &quot;POST&quot;, &quot;/api/ui/state&quot;, STATE)); |
| core | const | 770 | no | const core = new FakeCore().seedWorld(HOME, &quot;home&quot;, &quot;Home&quot;).seedWorld(&quot;w_lab&quot;, &quot;custom&quot;, &quot;Lab&quot;); |
| core | const | 779 | no | const core = new FakeCore().seedRevision(HOME, 1, &quot;Base&quot;); |
| response | const | 780 | no | const response = await send(core, &quot;GET&quot;, &quot;/api/ui/worlds&quot;, undefined, { authorize: () =&gt; false, }); |
| core | const | 789 | no | const core = new FakeCore(); |
| malformed | const | 790 | no | const malformed = await send(core, &quot;POST&quot;, &quot;/api/ui/publish&quot;, &quot;{not json&quot;); |
| arrayBody | const | 794 | no | const arrayBody = await send(core, &quot;POST&quot;, &quot;/api/ui/state&quot;, &quot;[1,2,3]&quot;); |
| core | const | 801 | no | const core = new FakeCore(); |
| noCommandId | const | 802 | no | const noCommandId = await send(core, &quot;POST&quot;, &quot;/api/ui/publish&quot;, { actorId: &quot;alice&quot;, expectedRevision: 0, worldId: HOME, document: makeDocument(HOME, &quot;Direct&quot;), |
| noActorId | const | 811 | no | const noActorId = await send(core, &quot;POST&quot;, &quot;/api/ui/state&quot;, { commandId: &quot;cmd_state&quot;, path: &quot;/runs/live&quot;, value: 1, }); |
| core | const | 822 | no | const core = new FakeCore(); |
| response | const | 828 | no | const response = await send(core, &quot;POST&quot;, &quot;/api/ui/publish&quot;, { commandId: &quot;cmd_publish&quot;, actorId: &quot;alice&quot;, expectedRevision: 3, worldId: HOME, |
| core | const | 844 | no | const core = new FakeCore(); |
| response | const | 846 | no | const response = await send(core, &quot;POST&quot;, &quot;/api/ui/state&quot;, STATE); |
| core | const | 852 | no | const core = new FakeCore().seedDraft(makeDraft(HOME, &quot;draft_a&quot;, &quot;alice&quot;)); |
| response | const | 854 | no | const response = await send(core, &quot;DELETE&quot;, &quot;/api/ui/drafts/draft_a&quot;, { commandId: &quot;cmd_discard&quot;, actorId: &quot;alice&quot;, }); |
| cases | const | 863 | no | const cases: ReadonlyArray&lt;{ readonly code: UiErrorCode; readonly status: number }&gt; = [ |
| core | const | 870 | no | const core = new FakeCore(); |
| response | const | 872 | no | const response = await send(core, &quot;POST&quot;, &quot;/api/ui/state&quot;, STATE); |
| core | const | 879 | no | const core = new FakeCore(); |
| core | const | 890 | no | const core = new FakeCore(); |
| worlds | const | 892 | no | const worlds = await send(core, &quot;PUT&quot;, &quot;/api/ui/worlds&quot;, {}); |
| world | const | 897 | no | const world = await send(core, &quot;DELETE&quot;, `/api/ui/worlds/${HOME}`, {}); |
| draft | const | 901 | no | const draft = await send(core, &quot;PUT&quot;, &quot;/api/ui/drafts/draft_a&quot;, {}); |
| publish | const | 905 | no | const publish = await send(core, &quot;GET&quot;, &quot;/api/ui/publish&quot;); |
| state | const | 909 | no | const state = await send(core, &quot;PATCH&quot;, &quot;/api/ui/state&quot;, {}); |
| current | const | 915 | no | const current = makeRevision(HOME, 2, &quot;Base&quot;); |
| draft | const | 916 | no | const draft = makeDraft(HOME, &quot;draft_a&quot;, &quot;alice&quot;); |
| bare | const | 917 | no | const bare: UiSurfaceCore = { |
| history | const | 925 | no | const history = await body(await send(bare, &quot;GET&quot;, `/api/ui/worlds/${HOME}/revisions`)); |
| found | const | 939 | no | const found = await body(await send(bare, &quot;GET&quot;, &quot;/api/ui/drafts/draft_a&quot;)); |
| core | const | 944 | no | const core = new FakeCore().seedWorld(HOME, &quot;home&quot;, &quot;Home&quot;); |
| revision | const | 946 | no | const revision = core.current(HOME); |
| frames | const | 949 | no | const frames = uiWireMessages(core, revision, HOME); |
| document | const | 952 | no | const document = frames[0]; |
| worlds | const | 957 | no | const worlds = frames[1]; |
| revision | const | 972 | no | const revision = makeRevision(HOME, 1, &quot;Base&quot;); |
| port | const | 973 | no | const port: UiCommandPort = { |
| frames | const | 976 | no | const frames = uiWireMessages(port, revision, HOME); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 9 | external |
| ../src/surfaces/http.ts | import | 10 | [packages/tierflow/src/surfaces/http.ts](../src/surfaces/http.ts.md) |
| ../src/ui/hash.ts | import | 16 | [packages/tierflow/src/ui/hash.ts](../src/ui/hash.ts.md) |
| ../src/ui/types.ts | import | 17 | [packages/tierflow/src/ui/types.ts](../src/ui/types.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * HTTP surface contract tests.
 *
 * The surface is exercised against an in-memory fake core so every route can be
 * checked without the SQLite store: each documented status, body shape and
 * command mapping is asserted directly.
 */

import { describe, expect, test } from "bun:test";
import {
  handleUiHttpRequest,
  uiWireMessages,
  type UiHttpOptions,
  type UiSurfaceCore,
} from "../src/surfaces/http.ts";
import { contentHash } from "../src/ui/hash.ts";
import {
  UI_SCHEMA_VERSION,
  type UiCommand,
  type UiCommandPort,
  type UiDocument,
  type UiDraft,
  type UiErrorCode,
  type UiResult,
  type UiRevision,
  type UiWorld,
} from "../src/ui/types.ts";

const HOME = "w_home";
const JSON_HEADERS = { "content-type": "application/json" };

function makeDocument(worldId: string, title: string): UiDocument {
  const world: UiWorld = {
    id: worldId,
    kind: worldId === HOME ? "home" : "custom",
    title,
    accent: "#f2b134",
    origin: { x: 0, y: 0, z: 0 },
    unitsPerMeter: 1,
  };
  return {
    schemaVersion: UI_SCHEMA_VERSION,
    world,
    objects: [
      {
        id: "obj_floor",
        layer: "ground",
        kind: "static",
        shape: "plane",
        title: "Floor",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 100, y: 100, z: 1 },
        },
        props: { grid: true },
      },
      {
        id: "obj_runs",
        layer: "data",
        kind: "dynamic",
        shape: "billboard",
        title: "Live runs",
        transform: {
          position: { x: 0, y: 2, z: -4 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        props: { value: 0 },
      },
    ],
    relationships: [
      { id: "rel_1", from: "obj_floor", to: "obj_runs", kind: "contains" },
    ],
    dataFlows: [
      {
        id: "flow_1",
        path: "/runs/live",
        targetObject: "obj_runs",
        targetProp: "value",
```

_First 80 of 980 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
