# File: packages/tierflow/src/security.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/security.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6087 B |
| Lines | 158 |
| Hash | a25f3f3cf31e |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Capability | type | 19 | yes | export type Capability = &quot;read&quot; \| &quot;surface.write&quot; \| &quot;program.write&quot; \| &quot;exec&quot;; |
| ExposureConfig | interface | 21 | yes | export interface ExposureConfig { |
| ExposurePolicy | interface | 32 | yes | export interface ExposurePolicy { |
| LOOPBACK_HOSTS | const | 50 | no | const LOOPBACK_HOSTS = new Set([&quot;127.0.0.1&quot;, &quot;localhost&quot;, &quot;::1&quot;, &quot;[::1]&quot;]); |
| isLoopbackHostname | function | 52 | yes | export function isLoopbackHostname(hostname: string): boolean { |
| parseCapabilities | function | 56 | yes | export function parseCapabilities(input: string \| undefined, fallback: readonly Capability[]): ReadonlySet&lt;Capability&gt; { |
| parsed | const | 58 | no | const parsed = input |
| constantTimeEquals | function | 67 | yes | export function constantTimeEquals(a: string, b: string): boolean { |
| left | const | 68 | no | const left = Buffer.from(a, &quot;utf8&quot;); |
| right | const | 69 | no | const right = Buffer.from(b, &quot;utf8&quot;); |
| readEnv | function | 78 | yes | export function readEnv( env: Record&lt;string, string \| undefined&gt;, key: string, ): string \| undefined { |
| value | const | 82 | no | const value = env[key]; |
| trimmed | const | 84 | no | const trimmed = value.trim(); |
| exposureFromEnv | function | 96 | yes | export function exposureFromEnv( env: Record&lt;string, string \| undefined&gt;, defaults: { readonly capabilities?: readonly Capability[] } = {}, ): ExposurePolicy { |
| hostname | const | 100 | no | const hostname = readEnv(env, &quot;TIERFLOW_HOST&quot;) ?? &quot;127.0.0.1&quot;; |
| token | const | 101 | no | const token = readEnv(env, &quot;TIERFLOW_AUTH_TOKEN&quot;) ?? null; |
| deviceId | const | 102 | no | const deviceId = readEnv(env, &quot;TIERFLOW_DEVICE_ID&quot;) ?? &quot;host&quot;; |
| capabilities | const | 103 | no | const capabilities = parseCapabilities( readEnv(env, &quot;TIERFLOW_CAPABILITIES&quot;), defaults.capabilities ?? [&quot;read&quot;, &quot;surface.write&quot;, &quot;program.write&quot;, &quot;exec&quot;], ); |
| exposurePolicy | function | 110 | yes | export function exposurePolicy(config: ExposureConfig): ExposurePolicy { |
| exposed | const | 111 | no | const exposed = !isLoopbackHostname(config.hostname); |
| tokenOf | function | 118 | no | function tokenOf(request: Request): string \| null { |
| header | const | 119 | no | const header = request.headers.get(&quot;authorization&quot;); |
| frameToken | const | 125 | no | const frameToken = request.headers.get(&quot;x-tierflow-token&quot;); |
| authorize | function | 130 | no | function authorize(request: Request, capability: Capability): boolean { |
| presented | const | 133 | no | const presented = tokenOf(request); |
| presented | const | 144 | no | const presented = tokenOf(request); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 17 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/server.ts](./server.ts.md) | ./security.ts |
| [packages/tierflow/src/surfaces/websocket.ts](./surfaces/websocket.ts.md) | ../security.ts |
| [packages/tierflow/src/tier1/agent.ts](./tier1/agent.ts.md) | ../security.ts |
| [packages/tierflow/src/tier2/router.ts](./tier2/router.ts.md) | ../security.ts |
| [packages/tierflow/src/tier3/executor.ts](./tier3/executor.ts.md) | ../security.ts |
| [packages/tierflow/tests/security.test.ts](../tests/security.test.ts.md) | ../src/security.ts |
| [packages/tierflow/tests/tier-capability.test.ts](../tests/tier-capability.test.ts.md) | ../src/security.ts |
| [packages/tierflow/tests/ui-websocket-surface.test.ts](../tests/ui-websocket-surface.test.ts.md) | ../src/security.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Exposure policy for the TierFlow server.
 *
 * The server is a personal tool that can be reached over Tailscale. A tailnet
 * path is a network route, not an application credential, so the server needs
 * its own authentication and an explicit bind decision.
 *
 * Rules:
 * - Default bind is loopback. A non-loopback bind requires an explicit token;
 *   the server refuses to start without one.
 * - Tokens are compared in constant time and are never accepted from a URL.
 * - Every mutating capability can be denied independently, so a token used
 *   by a phone cannot also install executable programs.
 * - Health output shrinks when the server is reachable beyond loopback.
 */

import { timingSafeEqual } from "node:crypto";

export type Capability = "read" | "surface.write" | "program.write" | "exec";

export interface ExposureConfig {
  /** Interface to bind. Loopback by default. */
  readonly hostname: string;
  /** Bearer token required on every route except reduced health output. */
  readonly token: string | null;
  /** Capabilities the token holder may use. */
  readonly capabilities: ReadonlySet<Capability>;
  /** Device label recorded in audit records. */
  readonly deviceId: string;
}

export interface ExposurePolicy {
  readonly config: ExposureConfig;
  /** True when the bind address is reachable beyond this machine. */
  readonly exposed: boolean;
  /** True when the request carries valid credentials for `capability`. */
  authorize(request: Request, capability: Capability): boolean;
  /**
   * Capabilities this request may exercise. Empty when the request carries no
   * valid credential. Used to hand a capability set down to the tier that
   * performs the effect, so the gate lives at the authority, not the route.
   */
  capabilitiesFor(request: Request): ReadonlySet<Capability>;
  /** Value for the `Authorization` header, or null when unauthenticated. */
  authorizationHeader(): string | null;
  /** Minimal, non-disclosing health payload for external callers. */
  healthPayload(detailed: Record<string, unknown>): Record<string, unknown>;
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.trim().toLowerCase());
}

export function parseCapabilities(input: string | undefined, fallback: readonly Capability[]): ReadonlySet<Capability> {
  if (!input) return new Set(fallback);
  const parsed = input
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is Capability =>
      entry === "read" || entry === "surface.write" || entry === "program.write" || entry === "exec",
    );
  return new Set(parsed);
}

export function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    // Compare against itself to keep the timing profile flat for unequal lengths.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function readEnv(
  env: Record<string, string | undefined>,
  key: string,
```

_First 80 of 159 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
