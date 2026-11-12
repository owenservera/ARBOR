import { describe, expect, test } from "bun:test";
import {
  constantTimeEquals,
  exposureFromEnv,
  exposurePolicy,
  isLoopbackHostname,
  parseCapabilities,
} from "../src/security.ts";

function requestWith(token: string | null, header = "authorization"): Request {
  const headers: Record<string, string> = {};
  if (token !== null) headers[header] = header === "authorization" ? `Bearer ${token}` : token;
  return new Request("http://127.0.0.1:7717/api/state", { headers });
}

describe("exposure policy", () => {
  test("loopback defaults to no token required", () => {
    const policy = exposureFromEnv({});
    expect(policy.config.hostname).toBe("127.0.0.1");
    expect(policy.exposed).toBe(false);
    expect(policy.authorize(requestWith(null), "read")).toBe(true);
  });

  test("non-loopback bind without a token aborts", () => {
    expect(() => exposureFromEnv({ TIERFLOW_HOST: "100.101.102.103" })).toThrow(
      /refusing to bind a non-loopback address/,
    );
  });

  test("non-loopback bind with a token exposes and requires it", () => {
    const policy = exposureFromEnv({
      TIERFLOW_HOST: "100.101.102.103",
      TIERFLOW_AUTH_TOKEN: "s3cret",
    });
    expect(policy.exposed).toBe(true);
    expect(policy.authorize(requestWith("s3cret"), "read")).toBe(true);
    expect(policy.authorize(requestWith("wrong"), "read")).toBe(false);
    expect(policy.authorize(requestWith(null), "read")).toBe(false);
  });

  test("capabilities deny independently of the token", () => {
    const policy = exposureFromEnv({
      TIERFLOW_HOST: "100.101.102.103",
      TIERFLOW_AUTH_TOKEN: "s3cret",
      TIERFLOW_CAPABILITIES: "read,surface.write",
    });
    expect(policy.authorize(requestWith("s3cret"), "surface.write")).toBe(true);
    expect(policy.authorize(requestWith("s3cret"), "program.write")).toBe(false);
    expect(policy.authorize(requestWith("s3cret"), "exec")).toBe(false);
  });

  test("health output shrinks when exposed", () => {
    const loopback = exposureFromEnv({});
    expect(loopback.healthPayload({ ok: true, pid: 42 })).toEqual({ ok: true, pid: 42 });

    const exposed = exposureFromEnv({
      TIERFLOW_HOST: "100.101.102.103",
      TIERFLOW_AUTH_TOKEN: "s3cret",
    });
    expect(exposed.healthPayload({ ok: true, pid: 42, programs: ["secret"] })).toEqual({ ok: true });
  });

  test("tokens are not accepted from a URL query string", () => {
    const policy = exposureFromEnv({
      TIERFLOW_HOST: "100.101.102.103",
      TIERFLOW_AUTH_TOKEN: "s3cret",
    });
    const queryRequest = new Request("http://host:7717/api/state?access_token=s3cret");
    expect(policy.authorize(queryRequest, "read")).toBe(false);
  });

  test("first-frame token header is accepted for websocket clients", () => {
    const policy = exposureFromEnv({
      TIERFLOW_HOST: "100.101.102.103",
      TIERFLOW_AUTH_TOKEN: "s3cret",
    });
    expect(policy.authorize(requestWith("s3cret", "x-tierflow-token"), "read")).toBe(true);
  });

  test("capability parsing ignores unknown entries", () => {
    expect([...parseCapabilities("read, bogus ,exec", ["read"])]).toEqual(["read", "exec"]);
    expect([...parseCapabilities(undefined, ["read", "exec"])]).toEqual(["read", "exec"]);
  });

  test("loopback host detection", () => {
    expect(isLoopbackHostname("127.0.0.1")).toBe(true);
    expect(isLoopbackHostname("localhost")).toBe(true);
    expect(isLoopbackHostname("::1")).toBe(true);
    expect(isLoopbackHostname("0.0.0.0")).toBe(false);
    expect(isLoopbackHostname("100.101.102.103")).toBe(false);
  });

  test("constant time comparison rejects unequal values", () => {
    expect(constantTimeEquals("abc", "abc")).toBe(true);
    expect(constantTimeEquals("abc", "abd")).toBe(false);
    expect(constantTimeEquals("abc", "abcd")).toBe(false);
  });

  test("an explicit policy without a token stays loopback-only", () => {
    const policy = exposurePolicy({
      hostname: "127.0.0.1",
      token: null,
      capabilities: new Set(["read"]),
      deviceId: "host",
    });
    expect(policy.exposed).toBe(false);
    expect(policy.authorize(requestWith(null), "read")).toBe(true);
    expect(policy.authorize(requestWith(null), "exec")).toBe(false);
  });
});
