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
    atomsBelowThree.length === 0 &&
    unknown.length === 0;

  return {
    schema: 'vivim.atom-coverage/1',
    totals: {
      atoms: atoms.length,
      families: Object.keys(byFamily).length,
      roles: ROLE_IDS.length,
      stateVars: USED_VARS.size,
    },
    byFamily,
    byRole,
    coverage: {
      minVars: sorted.length ? sorted[0] : 0,
      medianVars: median,
      maxVars: sorted.length ? sorted[sorted.length - 1] : 0,
      atomsBelowThree,
      unknownVars: unknown,
    },
    complete,
  };
}

/**
 * One-line human summary of a coverage report.
 * @returns {string[]}
 */
export function summariseReport(report) {
  const lines = [
    `vivim.atom-coverage/1: ${report.totals.atoms} atoms across ${report.totals.families} families, ${report.totals.roles} roles, ${report.totals.stateVars} state variables`,
    `by role: ${Object.entries(report.byRole)
      .map(([role, count]) => `${role}=${count}`)
      .join(', ')}`,
    `coverage: min ${report.coverage.minVars}, median ${report.coverage.medianVars}, max ${report.coverage.maxVars} state vars per atom`,
    `atoms below 3 vars: ${report.coverage.atomsBelowThree.length}`,
    `unknown state vars: ${report.coverage.unknownVars.length}`,
    `complete: ${report.complete}`,
  ];
  if (report.coverage.atomsBelowThree.length) {
    lines.push(`under-bound atoms: ${report.coverage.atomsBelowThree.join(', ')}`);
  }
  if (report.coverage.unknownVars.length) {
    lines.push(`unknown vars: ${report.coverage.unknownVars.join(', ')}`);
  }
  return lines;
}
