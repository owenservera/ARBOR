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
