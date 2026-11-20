# File: hq/types/bun-test.d.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/types/bun-test.d.ts |
| Language | TypeScript |
| Kind | source |
| Size | 1531 B |
| Lines | 34 |
| Hash | 87f08ecc30c1 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| describe | function | 6 | yes | export function describe(name: string, fn: () =&gt; void): void; |
| test | function | 7 | yes | export function test(name: string, fn: () =&gt; void \| Promise&lt;void&gt;, timeout?: number): void; |
| skip | function | 8 | yes | export function skip(name: string, fn: () =&gt; void \| Promise&lt;void&gt;, timeout?: number): void; |
| only | function | 9 | yes | export function only(name: string, fn: () =&gt; void \| Promise&lt;void&gt;, timeout?: number): void; |
| expect | function | 10 | yes | export function expect(actual: any): ExpectMatchers; |
| afterAll | function | 11 | yes | export function afterAll(fn: () =&gt; void): void; |
| beforeAll | function | 12 | yes | export function beforeAll(fn: () =&gt; void): void; |
| beforeEach | function | 13 | yes | export function beforeEach(fn: () =&gt; void): void; |
| afterEach | function | 14 | yes | export function afterEach(fn: () =&gt; void): void; |
| ExpectMatchers | interface | 16 | no | interface ExpectMatchers { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
// Ambient type declarations for the bun:test module so the single // @ts-check
// test file (hq/test/spawn-detach.test.mjs) resolves its import and typechecks.
// tsconfig includes hq/**/*.d.ts, so this file is picked up automatically.
// The runtime implementation is bun's own bun:test; these are types only.
declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  export function skip(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  export function only(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  export function expect(actual: any): ExpectMatchers;
  export function afterAll(fn: () => void): void;
  export function beforeAll(fn: () => void): void;
  export function beforeEach(fn: () => void): void;
  export function afterEach(fn: () => void): void;

  interface ExpectMatchers {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toHaveLength(length: number): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(substring: string): void;
    toMatch(regexp: RegExp): void;
    toMatchSnapshot?(): void;
    toBeLessThan(n: number): void;
    toBeLessThanOrEqual(n: number): void;
    toBeGreaterThan(n: number): void;
    toBeGreaterThanOrEqual(n: number): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    not: ExpectMatchers;
  }
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
