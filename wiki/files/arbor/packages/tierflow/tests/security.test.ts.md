# File: packages/tierflow/tests/security.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/security.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4341 B |
| Lines | 110 |
| Hash | 59818125a876 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| requestWith | function | 10 | no | function requestWith(token: string \| null, header = &quot;authorization&quot;): Request { |
| headers | const | 11 | no | const headers: Record&lt;string, string&gt; = {}; |
| policy | const | 18 | no | const policy = exposureFromEnv({}); |
| policy | const | 31 | no | const policy = exposureFromEnv({ TIERFLOW_HOST: &quot;100.101.102.103&quot;, TIERFLOW_AUTH_TOKEN: &quot;s3cret&quot;, }); |
| policy | const | 42 | no | const policy = exposureFromEnv({ TIERFLOW_HOST: &quot;100.101.102.103&quot;, TIERFLOW_AUTH_TOKEN: &quot;s3cret&quot;, TIERFLOW_CAPABILITIES: &quot;read,surface.write&quot;, }); |
| loopback | const | 53 | no | const loopback = exposureFromEnv({}); |
| exposed | const | 56 | no | const exposed = exposureFromEnv({ TIERFLOW_HOST: &quot;100.101.102.103&quot;, TIERFLOW_AUTH_TOKEN: &quot;s3cret&quot;, }); |
| policy | const | 64 | no | const policy = exposureFromEnv({ TIERFLOW_HOST: &quot;100.101.102.103&quot;, TIERFLOW_AUTH_TOKEN: &quot;s3cret&quot;, }); |
| queryRequest | const | 68 | no | const queryRequest = new Request(&quot;http://host:7717/api/state?access_token=s3cret&quot;); |
| policy | const | 73 | no | const policy = exposureFromEnv({ TIERFLOW_HOST: &quot;100.101.102.103&quot;, TIERFLOW_AUTH_TOKEN: &quot;s3cret&quot;, }); |
| policy | const | 100 | no | const policy = exposurePolicy({ hostname: &quot;127.0.0.1&quot;, token: null, capabilities: new Set([&quot;read&quot;]), deviceId: &quot;host&quot;, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 1 | external |
| ../src/security.ts | import | 2 | [packages/tierflow/src/security.ts](../src/security.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 111 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
