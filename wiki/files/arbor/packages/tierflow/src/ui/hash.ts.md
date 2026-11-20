# File: packages/tierflow/src/ui/hash.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/ui/hash.ts |
| Language | TypeScript |
| Kind | source |
| Size | 3728 B |
| Lines | 80 |
| Hash | 97173b1580e3 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| canonicalJson | function | 14 | yes | export function canonicalJson(value: unknown): string { |
| keys | const | 25 | no | const keys = Object.keys(record) |
| body | const | 28 | no | const body = keys.map((key) =&gt; `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(&quot;,&quot;); |
| sha256Hex | function | 34 | yes | export function sha256Hex(text: string): string { |
| contentHash | function | 39 | yes | export function contentHash(document: UiDocument): string { |
| payloadHash | function | 44 | yes | export function payloadHash(payload: unknown): string { |
| commandEnvelopeHash | function | 53 | yes | export function commandEnvelopeHash(envelope: unknown, verifiedPrincipal: unknown): string { |
| seen | const | 54 | no | const seen = new Set&lt;object&gt;(); |
| strict | function | 55 | no | function strict(value: unknown, depth: number): string { |
| result | variable | 64 | no | let result: string; |
| proto | const | 68 | no | const proto = Object.getPrototypeOf(value); |
| keys | const | 71 | no | const keys = Object.keys(record).sort(); |
| bytes | const | 77 | no | const bytes = strict({ envelope, verifiedPrincipal }, 0); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 10 | external |
| ./types.ts | import | 11 | [packages/tierflow/src/ui/types.ts](./types.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/ui/commands.ts](./commands.ts.md) | ./hash.ts |
| [packages/tierflow/src/ui/store.ts](./store.ts.md) | ./hash.ts |
| [packages/tierflow/src/ui/world.ts](./world.ts.md) | ./hash.ts |
| [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](../visual-runtime/document/wave3-action-semantics.ts.md) | ../../ui/hash.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts](../visual-runtime/final-wave/integration/world-visual-bridge.ts.md) | ../../../ui/hash.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts](../visual-runtime/final-wave/lane-b/studio-editing.ts.md) | ../../../ui/hash.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../visual-runtime/integration-2/compose.ts.md) | ../../ui/hash.ts |
| [packages/tierflow/src/visual-runtime/revisions/fixture-store.ts](../visual-runtime/revisions/fixture-store.ts.md) | ../../ui/hash.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](../visual-runtime/revisions/wave3-atomic-replay.ts.md) | ../../ui/hash.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts](../visual-runtime/revisions/wave4-session-reconcile.ts.md) | ../../ui/hash.ts |
| [packages/tierflow/tests/ui-http-surface.test.ts](../../tests/ui-http-surface.test.ts.md) | ../src/ui/hash.ts |
| [packages/tierflow/tests/ui-store.test.ts](../../tests/ui-store.test.ts.md) | ../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts](../../tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts.md) | ../../../../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts](../../tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts.md) | ../../../../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts](../../tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts.md) | ../../../../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/revisions.test.ts](../../tests/visual-runtime/revisions.test.ts.md) | ../../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/wave3-c-replay.test.ts](../../tests/visual-runtime/wave3-c-replay.test.ts.md) | ../../src/ui/hash.ts |
| [packages/tierflow/tests/visual-runtime/wave4-d-session-reconcile.test.ts](../../tests/visual-runtime/wave4-d-session-reconcile.test.ts.md) | ../../src/ui/hash.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Canonical serialization and content hashing for UI documents.
 *
 * The hash is what makes "publish exactly the draft I previewed" checkable:
 * the client and the host must agree on one byte sequence for the same
 * document. Key order is fixed, array order is significant, and undefined
 * properties are omitted.
 */

import { createHash } from "node:crypto";
import type { UiDocument } from "./types.ts";

/** Deterministic JSON: object keys sorted, undefined properties dropped. */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  const type = typeof value;
  if (type === "string") return JSON.stringify(value);
  if (type === "number") return Number.isFinite(value as number) ? JSON.stringify(value) : "null";
  if (type === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (type === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort();
    const body = keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",");
    return `{${body}}`;
  }
  return "null";
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Hash of a document's canonical form. Prefixed so logs stay readable. */
export function contentHash(document: UiDocument): string {
  return `sha256:${sha256Hex(canonicalJson(document))}`;
}

/** Hash of an arbitrary command payload, used for idempotency checks. */
export function payloadHash(payload: unknown): string {
  return `sha256:${sha256Hex(canonicalJson(payload))}`;
}

/**
 * A distinct, fail-closed replay identity for an entire UI command and its
 * independently verified caller context. Never hash just the mutation payload.
 * "legacy-unverified" is intentionally a different domain from trusted calls.
 */
export function commandEnvelopeHash(envelope: unknown, verifiedPrincipal: unknown): string {
  const seen = new Set<object>();
  function strict(value: unknown, depth: number): string {
    if (depth > 24) throw new TypeError("Command envelope exceeds maximum nesting depth.");
    if (value === null) return "null";
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
    if (typeof value !== "object") throw new TypeError("Command envelope must contain only finite JSON values.");
    if (seen.has(value)) throw new TypeError("Command envelope has cyclic or shared object references.");
    seen.add(value);
    let result: string;
    if (Array.isArray(value)) {
      result = "[" + value.map(item => strict(item, depth + 1)).join(",") + "]";
    } else {
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) throw new TypeError("Command envelope requires plain JSON objects.");
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).sort();
      result = "{" + keys.map(key => JSON.stringify(key) + ":" + strict(record[key], depth + 1)).join(",") + "}";
    }
    seen.delete(value);
    return result;
  }
  const bytes = strict({ envelope, verifiedPrincipal }, 0);
  if (Buffer.byteLength(bytes, "utf8") > 65536) throw new TypeError("Command envelope exceeds 64 KiB.");
  return "sha256:ui-envelope-v1:" + sha256Hex("vivim.ui-command-envelope/1\\n" + bytes);
}
```

_First 80 of 81 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
