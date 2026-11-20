# File: studio/src/studio/browser-atoms.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/browser-atoms.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4170 B |
| Lines | 111 |
| Hash | a8c7be3547db |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FAMILIES | const | 11 | yes | export const FAMILIES = [ |
| TARGET_COUNT | const | 16 | yes | export const TARGET_COUNT = 2103; |
| PER_FAMILY | const | 17 | yes | export const PER_FAMILY = 100; |
| FAMILY_SIZES | const | 21 | yes | export const FAMILY_SIZES = { torrent: 3 }; |
| cache | variable | 23 | no | let cache = null; |
| loadRegistry | function | 26 | yes | export async function loadRegistry({ reload = false } = {}) { |
| atoms | const | 28 | no | const atoms = []; |
| families | const | 29 | no | const families = {}; |
| missing | const | 30 | no | const missing = []; |
| problems | const | 31 | no | const problems = []; |
| mod | variable | 34 | no | let mod; |
| modAtoms | const | 41 | no | const modAtoms = Array.isArray(mod.atoms) ? mod.atoms : []; |
| expected | const | 43 | no | const expected = FAMILY_SIZES[family] ?? PER_FAMILY; |
| ids | const | 49 | no | const ids = new Set(); |
| filterAtoms | function | 68 | yes | export function filterAtoms(atoms, { family, effect, primitive, text } = {}) { |
| hay | const | 74 | no | const hay = `${a.id} ${a.summary}`.toLowerCase(); |
| getAtom | function | 82 | yes | export async function getAtom(id) { |
| atom | const | 84 | no | const atom = atoms.find((a) =&gt; a.id === id); |
| planAtom | function | 90 | yes | export function planAtom(atom, args = {}) { |
| required | const | 91 | no | const required = []; |
| unknown | const | 92 | no | const unknown = []; |
| needsExecute | const | 100 | no | const needsExecute = atom.effect !== &#39;read&#39;; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/atoms.mjs](../../bin/commands/atoms.mjs.md) | ../../src/studio/browser-atoms.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./browser-atoms.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./browser-atoms.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./browser-atoms.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./browser-atoms.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./browser-atoms.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./browser-atoms.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./browser-atoms.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./browser-atoms.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Central registry: composes the ten atom families into the 1000-capability node. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-20 |
| 5 | see | — | studio/src/studio/atom-kit.mjs | studio/src/studio/atom-kit.mjs |
| 6 | invariant | — | — | the registry reports what is missing instead of pretending the node is whole. |

## Excerpt

```javascript
/**
 * @hq:context Central registry: composes the ten atom families into the 1000-capability node.
 * @hq:owner atlas
 * @hq:task VC-20
 * @hq:see studio/src/studio/atom-kit.mjs
 * @hq:invariant the registry reports what is missing instead of pretending the node is whole.
 */
// Ten families of 100 atoms each. Loading is dynamic and per-family so a half-built node still
// answers honestly: `missing` names what does not exist yet, and the count is never padded.

export const FAMILIES = [
  'nav', 'dom', 'act', 'type', 'read', 'net', 'state', 'wait', 'screen', 'safe',
  'frame', 'form', 'table', 'media', 'clipboard', 'upload', 'download', 'auth', 'trace', 'consent',
  'window', 'torrent',
];
export const TARGET_COUNT = 2103;
export const PER_FAMILY = 100;
// Generated matrix families hold exactly PER_FAMILY (100) atoms. A handwritten capability
// family declares its own exact size here — still an exact per-family count, never a range,
// never padded — so a family is complete only when it meets its declared size exactly.
export const FAMILY_SIZES = { torrent: 3 };

let cache = null;

/** Load every family, validating each. Returns { atoms, families, missing, problems, complete }. */
export async function loadRegistry({ reload = false } = {}) {
  if (cache && !reload) return cache;
  const atoms = [];
  const families = {};
  const missing = [];
  const problems = [];

  for (const family of FAMILIES) {
    let mod;
    try {
      mod = await import(`./atoms/${family}.mjs`);
    } catch (error) {
      missing.push({ family, reason: String(error?.code ?? error?.message ?? error) });
      continue;
    }
    const modAtoms = Array.isArray(mod.atoms) ? mod.atoms : [];
    if (mod.family !== family) problems.push(`${family}: module exports family "${mod.family}"`);
    const expected = FAMILY_SIZES[family] ?? PER_FAMILY;
    if (modAtoms.length !== expected) problems.push(`${family}: ${modAtoms.length} atoms, expected ${expected}`);
    families[family] = modAtoms.length;
    atoms.push(...modAtoms);
  }

  const ids = new Set();
  for (const atom of atoms) {
    if (ids.has(atom.id)) problems.push(`duplicate atom id across families: ${atom.id}`);
    ids.add(atom.id);
  }

  cache = {
    atoms,
    families,
    missing,
    problems,
    count: atoms.length,
    unique: ids.size,
    complete: missing.length === 0 && problems.length === 0 && atoms.length === TARGET_COUNT,
  };
  return cache;
}

/** Filter atoms by family, effect, primitive or a free-text match on id and summary. */
export function filterAtoms(atoms, { family, effect, primitive, text } = {}) {
  return atoms.filter((a) => {
    if (family && a.family !== family) return false;
    if (effect && a.effect !== effect) return false;
    if (primitive && a.primitive !== primitive) return false;
    if (text) {
      const hay = `${a.id} ${a.summary}`.toLowerCase();
      if (!hay.includes(String(text).toLowerCase())) return false;
    }
    return true;
  });
}
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
