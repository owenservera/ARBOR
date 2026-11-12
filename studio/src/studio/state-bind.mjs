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

  return out;
}

/**
 * Validate a batch of atoms against known state variable ids.
 *
 * @param {object[]} atoms - atom-like objects with { id, family, effect }
 * @param {Iterable<string>} knownVarIds - state var ids the product recognizes
 * @returns {{
 *   ok: boolean,
 *   problems: string[],
 *   perAtom: Map<string, string[]>,
 *   min: number,
 *   max: number,
 *   missing: string[]
 * }}
 */
export function validateBinding(atoms, knownVarIds) {
  const known = new Set(knownVarIds);
  const problems = [];
  const perAtom = new Map();
  const missing = new Set();
  let min = Infinity;
  let max = 0;
  let ok = true;

  for (const atom of atoms) {
    const vars = stateVarsFor(atom);
    if (vars.length < min) min = vars.length;
    if (vars.length > max) max = vars.length;

    const atomProblems = [];
    if (vars.length < 3) {
      atomProblems.push(`${atom.id}: ${vars.length} state variables, minimum is 3`);
      ok = false;
    }
    for (const v of vars) {
      if (!known.has(v)) {
        atomProblems.push(`${atom.id}: unknown state variable ${v}`);
        missing.add(v);
        ok = false;
      }
    }
    if (atomProblems.length) perAtom.set(atom.id, atomProblems);
    problems.push(...atomProblems);
  }

  return {
    ok,
    problems,
    perAtom,
    min: min === Infinity ? 0 : min,
    max,
    missing: [...missing].sort(),
  };
}
