# File: studio/src/profiles/migrations.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/profiles/migrations.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3883 B |
| Lines | 130 |
| Hash | 97078d7128bf |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| clone | function | 9 | no | function clone(value) { |
| assertVersion | function | 14 | no | function assertVersion(n, label) { |
| createMigrationChain | function | 24 | yes | export function createMigrationChain({ current = 2 } = {}) { |
| steps | const | 28 | no | const steps = new Map(); |
| key | function | 29 | no | const key = (from, to) =&gt; `${from}-&gt;${to}`; |
| register | function | 31 | no | function register(from, to, fn, { name } = {}) { |
| k | const | 36 | no | const k = key(from, to); |
| migrate | function | 42 | no | function migrate(obj) { |
| log | const | 46 | no | const log = []; |
| changed | variable | 47 | no | let changed = false; |
| value | variable | 48 | no | let value = clone(obj); |
| version | variable | 49 | no | let version = |
| next | const | 64 | no | const next = [...steps.values()] |
| out | const | 80 | no | const out = next.fn(clone(value)); |
| chain | const | 108 | no | const chain = { |
| migrations | const | 128 | yes | export const migrations = createMigrationChain(); |
| migrations | export | 130 | yes | export default migrations; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/platform.mjs](../intel/platform.mjs.md) | ../profiles/migrations.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Deterministic, versioned profile migration chain.
 *
 * Objects carry `schemaVersion` (missing => 1). Registered steps run in order
 * from the object's version up to the chain's current version. A throwing step
 * leaves the value at the last good step and records `ok: false`.
 */

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function assertVersion(n, label) {
  if (!Number.isInteger(n) || n < 1) {
    throw new TypeError(`migration: ${label} must be a positive integer`);
  }
  return n;
}

/**
 * @param {{current?: number}} [opts]
 */
export function createMigrationChain({ current = 2 } = {}) {
  assertVersion(current, 'current');

  /** @type {Map<string, {from: number, to: number, fn: (obj: any) => any, name: string}>} */
  const steps = new Map();
  const key = (from, to) => `${from}->${to}`;

  function register(from, to, fn, { name } = {}) {
    assertVersion(from, 'from');
    assertVersion(to, 'to');
    if (to <= from) throw new RangeError(`migration: to (${to}) must be greater than from (${from})`);
    if (typeof fn !== 'function') throw new TypeError('migration: fn must be a function');
    const k = key(from, to);
    if (steps.has(k)) throw new Error(`duplicate migration: ${k}`);
    steps.set(k, { from, to, fn, name: typeof name === 'string' && name ? name : k });
    return steps.get(k);
  }

  function migrate(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new TypeError('migrate: expected a plain object');
    }
    const log = [];
    let changed = false;
    let value = clone(obj);
    let version =
      Number.isInteger(value.schemaVersion) && value.schemaVersion >= 1 ? value.schemaVersion : 1;

    if (version > current) {
      log.push({
        from: version,
        to: version,
        name: '(none)',
        ok: false,
        error: `newer schemaVersion ${version} > ${current}`,
      });
      return { value, log, changed: false };
    }

    while (version < current) {
      const next = [...steps.values()]
        .filter((step) => step.from === version)
        .sort((a, b) => a.to - b.to)[0];

      if (!next) {
        log.push({
          from: version,
          to: current,
          name: '(none)',
          ok: false,
          error: `no migration registered from v${version}`,
        });
        break;
      }

      try {
        const out = next.fn(clone(value));
```

_First 80 of 131 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
