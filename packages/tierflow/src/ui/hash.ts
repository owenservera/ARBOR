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
