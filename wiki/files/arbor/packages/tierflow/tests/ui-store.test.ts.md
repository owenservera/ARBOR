# File: packages/tierflow/tests/ui-store.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/ui-store.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 24596 B |
| Lines | 629 |
| Hash | 6fbc8a3d2929 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HOME_WORLD | const | 23 | no | const HOME_WORLD = &quot;w_home&quot;; |
| LAB_WORLD | const | 24 | no | const LAB_WORLD = &quot;w_lab&quot;; |
| roots | const | 26 | no | const roots: string[] = []; |
| stores | const | 27 | no | const stores: UiStore[] = []; |
| tempRoot | function | 29 | no | function tempRoot(): string { |
| root | const | 30 | no | const root = mkdtempSync(join(tmpdir(), &quot;tierflow-ui-store-&quot;)); |
| storeAt | function | 35 | no | function storeAt(root: string, retention?: UiStoreRetention): UiStore { |
| options | const | 36 | no | const options = retention === undefined ? { path: join(root, &quot;state.db&quot;) } : { path: join(root, &quot;state.db&quot;), retention }; |
| store | const | 37 | no | const store = new UiStore(options); |
| documentFor | function | 43 | no | function documentFor( worldId: string, title: string, options: { kind?: UiWorldKind; accent?: string } = {}, ): UiDocument { |
| publish | function | 64 | no | function publish( store: UiStore, worldId: string, title: string, expectedRevision: number, |
| document | const | 71 | no | const document = documentFor(worldId, title); |
| storeError | function | 75 | no | function storeError(run: () =&gt; unknown): UiStoreError { |
| root | const | 92 | no | const root = tempRoot(); |
| path | const | 93 | no | const path = join(root, &quot;state.db&quot;); |
| store | const | 94 | no | const store = storeAt(root); |
| db | const | 100 | no | const db = new Database(path); |
| version | const | 101 | no | const version = db.query&lt;{ user_version: number }, []&gt;(&quot;PRAGMA user_version&quot;).get(); |
| journal | const | 103 | no | const journal = db.query&lt;{ journal_mode: string }, []&gt;(&quot;PRAGMA journal_mode&quot;).get(); |
| tables | const | 105 | no | const tables = db |
| root | const | 123 | no | const root = tempRoot(); |
| first | const | 124 | no | const first = storeAt(root); |
| second | const | 125 | no | const second = new UiStore({ path: join(root, &quot;state.db&quot;) }); |
| error | const | 127 | no | const error = storeError(() =&gt; second.open()); |
| root | const | 134 | no | const root = tempRoot(); |
| path | const | 135 | no | const path = join(root, &quot;state.db&quot;); |
| first | const | 136 | no | const first = new UiStore({ path }); |
| raw | const | 140 | no | const raw = new Database(path); |
| store | const | 144 | no | const store = new UiStore({ path }); |
| error | const | 145 | no | const error = storeError(() =&gt; store.open()); |
| root | const | 151 | no | const root = tempRoot(); |
| path | const | 152 | no | const path = join(root, &quot;state.db&quot;); |
| raw | const | 153 | no | const raw = new Database(path); |
| store | const | 158 | no | const store = new UiStore({ path }); |
| error | const | 159 | no | const error = storeError(() =&gt; store.open()); |
| store | const | 167 | no | const store = storeAt(tempRoot()); |
| worlds | const | 172 | no | const worlds = store.listWorlds(); |
| store | const | 186 | no | const store = storeAt(tempRoot()); |
| error | const | 189 | no | const error = storeError(() =&gt; store.registerWorld({ worldId: LAB_WORLD, kind: &quot;home&quot;, title: &quot;Lab&quot;, accent: &quot;#4ad9ff&quot; }), ); |
| store | const | 197 | no | const store = storeAt(tempRoot()); |
| homeFirst | const | 198 | no | const homeFirst = publish(store, HOME_WORLD, &quot;home one&quot;, 0); |
| labFirst | const | 199 | no | const labFirst = publish(store, LAB_WORLD, &quot;lab one&quot;, 0); |
| homeSecond | const | 200 | no | const homeSecond = publish(store, HOME_WORLD, &quot;home two&quot;, 1); |
| revisions | const | 208 | no | const revisions = store.listWorlds().map((world) =&gt; [world.worldId, world.revision]); |
| store | const | 216 | no | const store = storeAt(tempRoot()); |
| error | const | 220 | no | const error = storeError(() =&gt; publish(store, HOME_WORLD, &quot;stale&quot;, 0)); |
| store | const | 232 | no | const store = storeAt(tempRoot()); |
| first | const | 233 | no | const first = publish(store, HOME_WORLD, &quot;one&quot;, 0); |
| second | const | 234 | no | const second = publish(store, HOME_WORLD, &quot;two&quot;, 1); |
| rolled | const | 236 | no | const rolled = store.rollback({ worldId: HOME_WORLD, targetRevision: 1, expectedRevision: 2, actorId: &quot;bob&quot; }); |
| store | const | 249 | no | const store = storeAt(tempRoot()); |
| crossWorld | const | 254 | no | const crossWorld = storeError(() =&gt; store.rollback({ worldId: LAB_WORLD, targetRevision: 2, expectedRevision: 1, actorId: &quot;bob&quot; }), ); |
| stale | const | 260 | no | const stale = storeError(() =&gt; store.rollback({ worldId: HOME_WORLD, targetRevision: 1, expectedRevision: 1, actorId: &quot;bob&quot; }), ); |
| rolled | const | 266 | no | const rolled = store.rollback({ worldId: LAB_WORLD, targetRevision: 1, expectedRevision: 1, actorId: &quot;bob&quot; }); |
| store | const | 275 | no | const store = storeAt(tempRoot()); |
| draft | const | 278 | no | const draft = documentFor(HOME_WORLD, &quot;draft&quot;); |
| created | const | 279 | no | const created = store.createDraft({ draftId: &quot;draft-1&quot;, worldId: HOME_WORLD, baseRevision: 1, document: draft, |
| updated | const | 292 | no | const updated = store.updateDraft({ draftId: &quot;draft-1&quot;, expectedDraftRevision: 1, document: documentFor(HOME_WORLD, &quot;draft-v2&quot;), actorId: &quot;alice&quot;, |
| stale | const | 302 | no | const stale = storeError(() =&gt; store.updateDraft({ draftId: &quot;draft-1&quot;, expectedDraftRevision: 1, document: documentFor(HOME_WORLD, &quot;stale&quot;), |
| missing | const | 314 | no | const missing = storeError(() =&gt; store.updateDraft({ draftId: &quot;ghost&quot;, expectedDraftRevision: 1, document: documentFor(HOME_WORLD, &quot;x&quot;), |
| store | const | 326 | no | const store = storeAt(tempRoot()); |
| store | const | 358 | no | const store = storeAt(tempRoot()); |
| unknownWorld | const | 359 | no | const unknownWorld = storeError(() =&gt; store.createDraft({ draftId: &quot;draft-1&quot;, worldId: LAB_WORLD, baseRevision: 1, |
| unknownBase | const | 371 | no | const unknownBase = storeError(() =&gt; store.createDraft({ draftId: &quot;draft-1&quot;, worldId: LAB_WORLD, baseRevision: 1, |
| store | const | 385 | no | const store = storeAt(tempRoot()); |
| mismatch | const | 388 | no | const mismatch = storeError(() =&gt; store.createDraft({ draftId: &quot;draft-bad&quot;, worldId: HOME_WORLD, baseRevision: 1, |
| updateMismatch | const | 407 | no | const updateMismatch = storeError(() =&gt; store.updateDraft({ draftId: &quot;draft-ok&quot;, expectedDraftRevision: 1, document: documentFor(LAB_WORLD, &quot;wrong world&quot;), |
| root | const | 422 | no | const root = tempRoot(); |
| first | const | 423 | no | const first = storeAt(root); |
| second | const | 436 | no | const second = storeAt(root); |
| store | const | 453 | no | const store = storeAt(tempRoot()); |
| root | const | 461 | no | const root = tempRoot(); |
| path | const | 462 | no | const path = join(root, &quot;state.db&quot;); |
| first | const | 463 | no | const first = new UiStore({ path }); |
| second | const | 468 | no | const second = new UiStore({ path }); |
| third | const | 473 | no | const third = new UiStore({ path }); |
| store | const | 480 | no | const store = storeAt(tempRoot(), { revisions: 2 }); |
| store | const | 493 | no | const store = storeAt(tempRoot(), { revisions: 1 }); |
| store | const | 505 | no | const store = storeAt(tempRoot(), { drafts: 1, commands: 1, audit: 2 }); |
| store | const | 540 | no | const store = storeAt(tempRoot()); |
| entries | const | 545 | no | const entries = store.auditEntries(10); |
| root | const | 580 | no | const root = tempRoot(); |
| store | const | 581 | no | const store = openUiStore({ path: join(root, &quot;nested&quot;, &quot;state.db&quot;) }); |
| revision | const | 586 | no | const revision = publish(store, HOME_WORLD, &quot;fresh&quot;, 0); |
| store | const | 594 | no | const store = storeAt(tempRoot()); |
| doc | const | 595 | no | const doc = documentFor(HOME_WORLD, &quot;uncommitted&quot;); |
| store | const | 611 | no | const store = storeAt(tempRoot()); |
| doc | const | 612 | no | const doc = documentFor(HOME_WORLD, &quot;one&quot;); |
| calls | variable | 613 | no | let calls = 0; |
| input | const | 614 | no | const input = { |
| rev | const | 619 | no | const rev = store.publish({ worldId: HOME_WORLD, document: doc, contentHash: contentHash(doc), expectedRevision: 0, actorId: &quot;alice&quot; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:sqlite | import | 14 | external |
| bun:test | import | 15 | external |
| node:fs | import | 16 | external |
| node:os | import | 17 | external |
| node:path | import | 18 | external |
| ../src/ui/hash.ts | import | 19 | [packages/tierflow/src/ui/hash.ts](../src/ui/hash.ts.md) |
| ../src/ui/store.ts | import | 20 | [packages/tierflow/src/ui/store.ts](../src/ui/store.ts.md) |
| ../src/ui/types.ts | import | 21 | [packages/tierflow/src/ui/types.ts](../src/ui/types.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * UiStore durability contract tests for the world-scoped store.
 *
 * The store is the authoritative home of UI state, so these tests pin the
 * properties the rest of the system relies on: schema stamping, one writer per
 * file, per-world revision series with independent compare-and-swap gates,
 * append-only rollback, draft isolation by world, command idempotency across
 * restarts, bounded retention and a world-scoped audit trail.
 *
 * Every test gets a fresh temporary directory; stores are closed and files
 * removed after each test so a failure cannot leak a lock into the next one.
 */

import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentHash } from "../src/ui/hash.ts";
import { openUiStore, UiStore, UiStoreError, type UiStoreRetention } from "../src/ui/store.ts";
import type { UiDocument, UiRevision, UiWorldKind } from "../src/ui/types.ts";

const HOME_WORLD = "w_home";
const LAB_WORLD = "w_lab";

const roots: string[] = [];
const stores: UiStore[] = [];

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "tierflow-ui-store-"));
  roots.push(root);
  return root;
}

function storeAt(root: string, retention?: UiStoreRetention): UiStore {
  const options = retention === undefined ? { path: join(root, "state.db") } : { path: join(root, "state.db"), retention };
  const store = new UiStore(options);
  store.open();
  stores.push(store);
  return store;
}

function documentFor(
  worldId: string,
  title: string,
  options: { kind?: UiWorldKind; accent?: string } = {},
): UiDocument {
  return {
    schemaVersion: 1,
    world: {
      id: worldId,
      kind: options.kind ?? (worldId === HOME_WORLD ? "home" : "custom"),
      title,
      accent: options.accent ?? "#f2b134",
      origin: { x: 0, y: 0, z: 0 },
      unitsPerMeter: 1,
    },
    objects: [],
    relationships: [],
    dataFlows: [],
  };
}

function publish(
  store: UiStore,
  worldId: string,
  title: string,
  expectedRevision: number,
  actorId = "alice",
): UiRevision {
  const document = documentFor(worldId, title);
  return store.publish({ worldId, document, contentHash: contentHash(document), expectedRevision, actorId });
}

function storeError(run: () => unknown): UiStoreError {
  try {
    run();
  } catch (error) {
    if (error instanceof UiStoreError) return error;
    throw error;
```

_First 80 of 630 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
