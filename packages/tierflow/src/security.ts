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
): string | undefined {
  const value = env[key];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

/**
 * Build the exposure policy from environment variables.
 *
 * TIERFLOW_HOST — bind address, default 127.0.0.1.
 * TIERFLOW_AUTH_TOKEN — required when the bind address is not loopback.
 * TIERFLOW_CAPABILITIES — comma-separated capability list.
 * TIERFLOW_DEVICE_ID — audit label for this deployment.
 */
export function exposureFromEnv(
  env: Record<string, string | undefined>,
  defaults: { readonly capabilities?: readonly Capability[] } = {},
): ExposurePolicy {
  const hostname = readEnv(env, "TIERFLOW_HOST") ?? "127.0.0.1";
  const token = readEnv(env, "TIERFLOW_AUTH_TOKEN") ?? null;
  const deviceId = readEnv(env, "TIERFLOW_DEVICE_ID") ?? "host";
  const capabilities = parseCapabilities(
    readEnv(env, "TIERFLOW_CAPABILITIES"),
    defaults.capabilities ?? ["read", "surface.write", "program.write", "exec"],
  );
  return exposurePolicy({ hostname, token, capabilities, deviceId });
}

export function exposurePolicy(config: ExposureConfig): ExposurePolicy {
  const exposed = !isLoopbackHostname(config.hostname);
  if (exposed && !config.token) {
    throw new Error(
      "refusing to bind a non-loopback address without TIERFLOW_AUTH_TOKEN: set the token, or bind 127.0.0.1",
    );
  }

  function tokenOf(request: Request): string | null {
    const header = request.headers.get("authorization");
    if (header) {
      const match = /^Bearer\s+(.+)$/i.exec(header.trim());
      if (match?.[1]) return match[1].trim();
    }
    // First-frame authentication for WebSocket clients that cannot set headers.
    const frameToken = request.headers.get("x-tierflow-token");
    if (frameToken) return frameToken.trim();
    return null;
  }

  function authorize(request: Request, capability: Capability): boolean {
    if (!config.capabilities.has(capability)) return false;
    if (!config.token) return true;
    const presented = tokenOf(request);
    if (!presented) return false;
    return constantTimeEquals(presented, config.token);
  }

  return {
    config,
    exposed,
    authorize,
    capabilitiesFor(request) {
      if (!config.token) return config.capabilities;
      const presented = tokenOf(request);
      if (!presented || !constantTimeEquals(presented, config.token)) {
        return new Set<Capability>();
      }
      return config.capabilities;
    },
    authorizationHeader() {
      return config.token ? `Bearer ${config.token}` : null;
    },
    healthPayload(detailed) {
      if (!exposed) return detailed;
      return { ok: (detailed["ok"] as boolean | undefined) ?? true };
    },
  };
}
