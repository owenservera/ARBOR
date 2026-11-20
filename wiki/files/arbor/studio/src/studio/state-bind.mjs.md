# File: studio/src/studio/state-bind.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/state-bind.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4464 B |
| Lines | 137 |
| Hash | 8471d0d37edd |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BASELINE | const | 10 | no | const BASELINE = [&#39;page.url&#39;, &#39;page.readyState&#39;]; |
| SCOPE_VARS | const | 14 | no | const SCOPE_VARS = { |
| PROVIDER_SEND_EXTRAS | const | 33 | no | const PROVIDER_SEND_EXTRAS = [&#39;account.signedIn&#39;, &#39;site.seat&#39;]; |
| USED_VARS | const | 39 | yes | export const USED_VARS = new Set([ ...BASELINE, ...Object.values(SCOPE_VARS).flat(), ...PROVIDER_SEND_EXTRAS, ]); |
| scopeVarsFor | function | 45 | no | function scopeVarsFor(family) { |
| scoped | const | 46 | no | const scoped = SCOPE_VARS[family]; |
| stateVarsFor | function | 66 | yes | export function stateVarsFor(atom) { |
| out | const | 67 | no | const out = []; |
| seen | const | 68 | no | const seen = new Set(); |
| add | function | 69 | no | const add = (v) =&gt; { |
| validateBinding | function | 99 | yes | export function validateBinding(atoms, knownVarIds) { |
| known | const | 100 | no | const known = new Set(knownVarIds); |
| problems | const | 101 | no | const problems = []; |
| perAtom | const | 102 | no | const perAtom = new Map(); |
| missing | const | 103 | no | const missing = new Set(); |
| min | variable | 104 | no | let min = Infinity; |
| max | variable | 105 | no | let max = 0; |
| ok | variable | 106 | no | let ok = true; |
| vars | const | 109 | no | const vars = stateVarsFor(atom); |
| atomProblems | const | 113 | no | const atomProblems = []; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./state-bind.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./state-bind.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Binding layer: assigns every atom a deterministic set of live state variables. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | state-bindings |
| 5 | invariant | — | — | stateVarsFor returns at least 3 de-duplicated vars, baseline first, stable order. |
| 6 | invariant | — | — | USED_VARS lists every var id stateVarsFor can emit. |

## Excerpt

```javascript
/**
 * @hq:context Binding layer: assigns every atom a deterministic set of live state variables.
 * @hq:owner atlas
 * @hq:task state-bindings
 * @hq:invariant stateVarsFor returns at least 3 de-duplicated vars, baseline first, stable order.
 * @hq:invariant USED_VARS lists every var id stateVarsFor can emit.
 */

// Every atom runs on a page: these two are always the baseline, always first.
const BASELINE = ['page.url', 'page.readyState'];

// Scope -> extra state variables, in rule order. Families are disjoint; first match wins.
// The default scope (everything else) applies last.
const SCOPE_VARS = {
  nav: ['window.count', 'window.focused', 'tab.count', 'tab.active'],
  window: ['window.count', 'window.focused', 'tab.count', 'tab.active'],
  form: ['page.composerReady', 'page.draft'],
  type: ['page.composerReady', 'page.draft'],
  clipboard: ['page.composerReady', 'page.draft'],
  auth: ['account.site', 'account.signedIn', 'account.evidence'],
  consent: ['site.readyState', 'account.signedIn'],
  state: ['tab.site', 'account.profile'],
  net: ['browser.reachable', 'tab.urls'],
  trace: ['browser.reachable', 'tab.urls'],
  frame: ['tab.site', 'page.title'],
  table: ['tab.site', 'page.title'],
  media: ['tab.site', 'page.title'],
  upload: ['tab.site', 'page.readyState'],
  download: ['tab.site', 'page.readyState'],
};

// Atoms whose effect is provider-send must additionally observe these vars.
const PROVIDER_SEND_EXTRAS = ['account.signedIn', 'site.seat'];

/**
 * Every state variable id stateVarsFor can emit. Exported so coverage tests can
 * cross-check that no emitted var falls outside this set.
 */
export const USED_VARS = new Set([
  ...BASELINE,
  ...Object.values(SCOPE_VARS).flat(),
  ...PROVIDER_SEND_EXTRAS,
]);

function scopeVarsFor(family) {
  const scoped = SCOPE_VARS[family];
  return scoped ? [...scoped] : ['tab.count', 'tab.site'];
}

/**
 * Deterministic, total assignment of live state variables to one atom.
 *
 * Order matters:
 *  1. baseline (page.url, page.readyState) — always first
 *  2. scope variables in rule order
 *  3. provider-send extras (account.signedIn, site.seat) when effect is 'provider-send'
 *
 * Duplicates are dropped, keeping the first occurrence (e.g. upload/download
 * re-list page.readyState, which is already in the baseline). The result is
 * stable across calls: same atom always yields the same array in the same order.
 * Every atom gets at least 3 vars (baseline 2 + scope 2 minimum).
 *
 * @param {object} atom - { id, family, effect, ... }
 * @returns {string[]} state variable ids
 */
export function stateVarsFor(atom) {
  const out = [];
  const seen = new Set();
  const add = (v) => {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  };

  for (const v of BASELINE) add(v);
  for (const v of scopeVarsFor(atom.family)) add(v);
  if (atom.effect === 'provider-send') {
    for (const v of PROVIDER_SEND_EXTRAS) add(v);
  }
```

_First 80 of 138 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
