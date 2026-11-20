# File: studio/src/plugins/registry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/plugins/registry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3729 B |
| Lines | 118 |
| Hash | 9e848160c6ed |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_KINDS | const | 9 | yes | export const DEFAULT_KINDS = Object.freeze([ &#39;formats&#39;, &#39;codecs&#39;, &#39;secretPatterns&#39;, &#39;migrations&#39;, |
| kindLabel | function | 17 | no | function kindLabel(kind) { |
| createRegistry | function | 33 | yes | export function createRegistry(kinds = DEFAULT_KINDS) { |
| known | const | 37 | no | const known = new Set(); |
| buckets | const | 38 | no | const buckets = new Map(); |
| bucket | function | 48 | no | function bucket(kind) { |
| assertName | function | 53 | no | function assertName(name) { |
| registry | const | 60 | no | const registry = { |
| map | const | 62 | no | const map = bucket(kind); |
| entry | const | 73 | no | const entry = bucket(kind).get(name); |
| out | const | 92 | no | const out = {}; |
| registry | const | 116 | yes | export const registry = createRegistry(); |
| registry | export | 118 | yes | export default registry; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/platform.mjs](../intel/platform.mjs.md) | ../plugins/registry.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Tiny deterministic plugin registry.
 *
 * Zero dependencies. Kinds are fixed at construction time so a typo can never
 * silently create a new bucket. Entries are stored insertion-independently:
 * `list()` and `snapshot()` always sort by name.
 */

export const DEFAULT_KINDS = Object.freeze([
  'formats',
  'codecs',
  'secretPatterns',
  'migrations',
  'transforms',
]);

function kindLabel(kind) {
  return typeof kind === 'string' ? kind : JSON.stringify(kind);
}

/**
 * @param {string[]} [kinds] kinds the registry accepts; defaults to DEFAULT_KINDS.
 * @returns {{
 *   register: (kind: string, name: string, impl: any, opts?: {replace?: boolean, meta?: any, builtin?: boolean}) => any,
 *   get: (kind: string, name: string) => any,
 *   has: (kind: string, name: string) => boolean,
 *   list: (kind: string) => string[],
 *   unregister: (kind: string, name: string) => boolean,
 *   snapshot: () => Record<string, Array<{name: string, builtin: boolean, meta: any, registeredAt: null}>>,
 *   kinds: () => string[],
 * }}
 */
export function createRegistry(kinds = DEFAULT_KINDS) {
  if (!Array.isArray(kinds) || kinds.length === 0) {
    throw new TypeError('createRegistry: kinds must be a non-empty array');
  }
  const known = new Set();
  const buckets = new Map();
  for (const kind of kinds) {
    if (typeof kind !== 'string' || kind.length === 0) {
      throw new TypeError('createRegistry: every kind must be a non-empty string');
    }
    if (known.has(kind)) throw new Error(`createRegistry: duplicate kind ${kind}`);
    known.add(kind);
    buckets.set(kind, new Map());
  }

  function bucket(kind) {
    if (!known.has(kind)) throw new Error(`unknown registry kind: ${kindLabel(kind)}`);
    return buckets.get(kind);
  }

  function assertName(name) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('registry: name must be a non-empty string');
    }
    return name;
  }

  const registry = {
    register(kind, name, impl, { replace = false, meta, builtin = false } = {}) {
      const map = bucket(kind);
      assertName(name);
      if (impl === undefined) throw new TypeError(`registry: ${kind}/${name} impl is undefined`);
      if (map.has(name) && !replace) {
        throw new Error(`duplicate ${kind} entry: ${name}`);
      }
      map.set(name, { impl, meta: meta === undefined ? null : meta, builtin: builtin === true });
      return impl;
    },

    get(kind, name) {
      const entry = bucket(kind).get(name);
      return entry === undefined ? undefined : entry.impl;
    },

    has(kind, name) {
      if (!known.has(kind)) return false;
      return buckets.get(kind).has(name);
    },
```

_First 80 of 119 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
