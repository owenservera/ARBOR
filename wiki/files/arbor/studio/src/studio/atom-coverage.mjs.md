# File: studio/src/studio/atom-coverage.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/atom-coverage.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4549 B |
| Lines | 127 |
| Hash | 9c74020515c7 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEPS | const | 9 | no | const DEPS = [ |
| loadDep | function | 15 | no | async function loadDep(dep) { |
| coverageReport | function | 28 | yes | export async function coverageReport() { |
| registry | const | 34 | no | const registry = await loadRegistry(); |
| atoms | const | 35 | no | const atoms = registry.atoms; |
| byRole | const | 37 | no | const byRole = Object.fromEntries(ROLE_IDS.map((role) =&gt; [role, 0])); |
| byFamily | const | 38 | no | const byFamily = {}; |
| rolesByFamily | const | 39 | no | const rolesByFamily = {}; |
| varCounts | const | 40 | no | const varCounts = []; |
| atomsBelowThree | const | 41 | no | const atomsBelowThree = []; |
| unknownVars | const | 42 | no | const unknownVars = new Set(); |
| role | const | 45 | no | const role = roleOf(atom); |
| family | const | 48 | no | const family = atom.family; |
| vars | const | 59 | no | const vars = stateVarsFor(atom); |
| sorted | const | 71 | no | const sorted = varCounts.slice().sort((a, b) =&gt; a - b); |
| mid | const | 72 | no | const mid = Math.floor(sorted.length / 2); |
| median | const | 73 | no | const median = |
| unknown | const | 78 | no | const unknown = [...unknownVars].sort(); |
| complete | const | 79 | no | const complete = |
| summariseReport | function | 109 | yes | export function summariseReport(report) { |
| lines | const | 110 | no | const lines = [ |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | One report answering &quot;how covered is the browser surface, by family and by manager role&quot;, composing browser-atoms, atom-roles and state-bind. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-22 |
| 5 | see | — | studio/src/studio/browser-atoms.mjs, | studio/src/studio/browser-atoms.mjs, studio/src/studio/atom-roles.mjs, studio/src/studio/state-bind.mjs |
| 6 | invariant | — | — | atomsBelowThree lists atom ids with fewer than 3 state vars; unknownVars lists emitted vars absent from USED_VARS. |

## Excerpt

```javascript
/**
 * @hq:context One report answering "how covered is the browser surface, by family and by manager role", composing browser-atoms, atom-roles and state-bind.
 * @hq:owner atlas
 * @hq:task VC-22
 * @hq:see studio/src/studio/browser-atoms.mjs, studio/src/studio/atom-roles.mjs, studio/src/studio/state-bind.mjs
 * @hq:invariant atomsBelowThree lists atom ids with fewer than 3 state vars; unknownVars lists emitted vars absent from USED_VARS.
 */

const DEPS = [
  { name: 'browser-atoms', specifier: './browser-atoms.mjs' },
  { name: 'atom-roles', specifier: './atom-roles.mjs' },
  { name: 'state-bind', specifier: './state-bind.mjs' },
];

async function loadDep(dep) {
  try {
    return await import(dep.specifier);
  } catch (error) {
    throw new Error(`Missing dependency module: ${dep.name} (${dep.specifier})`);
  }
}

/**
 * Coverage of the browser surface: atom counts by family and role, state-variable
 * binding coverage, and a completeness flag.
 * @returns {Promise<{schema: string, totals: {atoms: number, families: number, roles: number, stateVars: number}, byFamily: object, byRole: object, coverage: {minVars: number, medianVars: number, maxVars: number, atomsBelowThree: string[], unknownVars: string[]}, complete: boolean}>}
 */
export async function coverageReport() {
  const [atomsMod, rolesMod, bindMod] = await Promise.all(DEPS.map(loadDep));
  const { loadRegistry } = atomsMod;
  const { roleOf, ROLE_IDS } = rolesMod;
  const { stateVarsFor, USED_VARS } = bindMod;

  const registry = await loadRegistry();
  const atoms = registry.atoms;

  const byRole = Object.fromEntries(ROLE_IDS.map((role) => [role, 0]));
  const byFamily = {};
  const rolesByFamily = {};
  const varCounts = [];
  const atomsBelowThree = [];
  const unknownVars = new Set();

  for (const atom of atoms) {
    const role = roleOf(atom);
    byRole[role] = (byRole[role] ?? 0) + 1;

    const family = atom.family;
    if (!byFamily[family]) {
      byFamily[family] = { atoms: 0, roles: [] };
      rolesByFamily[family] = new Set();
    }
    byFamily[family].atoms += 1;
    if (!rolesByFamily[family].has(role)) {
      rolesByFamily[family].add(role);
      byFamily[family].roles.push(role);
    }

    const vars = stateVarsFor(atom);
    varCounts.push(vars.length);
    if (vars.length < 3) atomsBelowThree.push(atom.id);
    for (const v of vars) {
      if (!USED_VARS.has(v)) unknownVars.add(v);
    }
  }

  for (const family of Object.keys(byFamily)) {
    byFamily[family].roles.sort((a, b) => ROLE_IDS.indexOf(a) - ROLE_IDS.indexOf(b));
  }

  const sorted = varCounts.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  const unknown = [...unknownVars].sort();
  const complete =
    registry.complete === true &&
```

_First 80 of 128 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
