# File: packages/tierflow/tests/world-client.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/world-client.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 12385 B |
| Lines | 410 |
| Hash | 41037475001f |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RecordedCall | interface | 12 | no | interface RecordedCall { |
| PublishResult | interface | 18 | no | interface PublishResult { |
| WorldClient | interface | 26 | no | interface WorldClient { |
| makeDocument | function | 54 | no | function makeDocument(title = &quot;Home&quot;) { |
| NEW_OBJECT | const | 85 | no | const NEW_OBJECT = { |
| Draft | interface | 99 | no | interface Draft { |
| createServer | function | 110 | no | function createServer(document: unknown) { |
| calls | const | 111 | no | const calls: RecordedCall[] = []; |
| draft | const | 112 | no | const draft: Draft = { |
| fetchImpl | function | 123 | no | const fetchImpl = async (url: string, init: any) =&gt; { |
| path | const | 124 | no | const path = new URL(url, &quot;http://localhost&quot;).pathname; |
| body | const | 125 | no | const body = init &amp;&amp; init.body ? JSON.parse(init.body) : null; |
| createClient | function | 170 | no | function createClient(server: { calls: RecordedCall[]; fetch: any }, overrides: Record&lt;string, unknown&gt; = {}): WorldClient { |
| client | const | 171 | no | const client = createWorldClient({ actorId: &quot;alice&quot;, baseUrl: &quot;http://tierflow.test&quot;, fetch: server.fetch, commandIdFactory: (stage: string) =&gt; &quot;cmd_&quot; + stage, |
| document | const | 183 | no | const document = makeDocument(); |
| server | const | 184 | no | const server = createServer(document); |
| client | const | 185 | no | const client = createClient(server); |
| result | const | 201 | no | const result = await client.publish(); |
| edit | const | 204 | no | const edit = server.calls.find((call) =&gt; call.url === &quot;/api/ui/drafts/d1/edit&quot;); |
| document | const | 242 | no | const document = makeDocument(); |
| server | const | 243 | no | const server = createServer(document); |
| client | const | 244 | no | const client = createClient(server); |
| result | const | 248 | no | const result = await client.publish(); |
| state | const | 273 | no | const state = client.getState(); |
| document | const | 280 | no | const document = makeDocument(); |
| client | const | 281 | no | const client = createClient(createServer(document)); |
| older | const | 284 | no | const older = client.applyServerMessage({ kind: &quot;ui.document&quot;, worldId: &quot;w_home&quot;, revision: 2, document: makeDocument(&quot;Older&quot;), |
| same | const | 294 | no | const same = client.applyServerMessage({ kind: &quot;ui.document&quot;, worldId: &quot;w_home&quot;, revision: 3, document: makeDocument(&quot;Same&quot;), |
| newer | const | 303 | no | const newer = client.applyServerMessage({ kind: &quot;ui.document&quot;, worldId: &quot;w_home&quot;, revision: 4, document: makeDocument(&quot;Newer&quot;), |
| publishedFrame | const | 314 | no | const publishedFrame = client.applyServerMessage({ kind: &quot;ui.document&quot;, worldId: &quot;w_home&quot;, revision: { revision: 6, |
| document | const | 331 | no | const document = makeDocument(); |
| client | const | 332 | no | const client = createClient(createServer(document)); |
| result | const | 337 | no | const result = client.applyServerMessage({ kind: &quot;ui.resync&quot;, epoch: &quot;e1&quot;, oldestSeq: 40, latestSeq: 90, |
| document | const | 355 | no | const document = makeDocument(); |
| client | const | 356 | no | const client = createClient(createServer(document)); |
| result | const | 359 | no | const result = client.applyServerMessage({ kind: &quot;ui.error&quot;, code: &quot;REVISION_CONFLICT&quot;, message: &quot;World w_home is at revision 9.&quot;, currentRevision: 9, |
| document | const | 381 | no | const document = makeDocument(); |
| client | const | 382 | no | const client = createClient(createServer(document)); |
| cases | const | 385 | no | const cases = [ |
| result | const | 403 | no | const result = client.applyServerMessage(message); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 8 | external |
| ../web/world.js | import | 10 | [packages/tierflow/web/world.js](../web/world.js.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * World client contract tests.
 *
 * The client is plain ES module JavaScript with no type declarations, and it is
 * deliberately DOM-free, so the whole publish protocol can be exercised here.
 */

import { describe, expect, test } from "bun:test";
// @ts-ignore web/ ships untyped plain ES modules by design; the client is covered by these tests.
import { createWorldClient } from "../web/world.js";

interface RecordedCall {
  readonly method: string;
  readonly url: string;
  readonly body: any;
}

interface PublishResult {
  readonly ok: boolean;
  readonly revision?: number;
  readonly code?: string;
  readonly currentRevision?: number;
  readonly error?: { code: string; message: string; currentRevision?: number };
}

interface WorldClient {
  setDocument(document: unknown, revision: number): boolean;
  setWorlds(worlds: unknown[]): boolean;
  setResolvedValues(values: Record<string, unknown>): boolean;
  applyServerMessage(message: unknown): {
    handled: boolean;
    kind: string | null;
    applied: boolean;
    needsSnapshot?: boolean;
    error?: { code: string; message: string; currentRevision?: number };
  };
  queueOperation(op: unknown): { ok: boolean; message?: string; length?: number };
  publish(): Promise<PublishResult>;
  select(id: string | null): void;
  clearOperations(): void;
  getState(): {
    document: any;
    view: any;
    revision: number;
    pending: any[];
    unpublished: boolean;
    needsSnapshot: boolean;
    selectedId: string | null;
    error: { code: string; message: string; currentRevision?: number } | null;
  };
  destroy(): void;
}

function makeDocument(title = "Home") {
  return {
    schemaVersion: 1,
    world: {
      id: "w_home",
      kind: "home",
      title,
      accent: "#ff9d3d",
      origin: { x: 0, y: 0, z: 0 },
      unitsPerMeter: 1,
    },
    objects: [
      {
        id: "obj_a",
        layer: "content",
        kind: "static",
        shape: "box",
        title: "Panel",
        transform: {
          position: { x: 0, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        props: {},
      },
    ],
    relationships: [],
```

_First 80 of 411 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
