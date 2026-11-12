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

/** Look up one atom. Throws ATOM_UNKNOWN rather than returning undefined. */
export async function getAtom(id) {
  const { atoms } = await loadRegistry();
  const atom = atoms.find((a) => a.id === id);
  if (!atom) throw new Error(`ATOM_UNKNOWN: ${id}`);
  return atom;
}

/** A run plan: what would happen, and what authority it needs. Never touches a browser. */
export function planAtom(atom, args = {}) {
  const required = [];
  const unknown = [];
  for (const a of atom.args) {
    if (a.required && !(a.name in args) && a.name !== 'selector') required.push(a.name);
    if (a.required && a.name === 'selector' && !(a.name in args)) required.push(a.name);
  }
  for (const name of Object.keys(args)) {
    if (!atom.args.some((a) => a.name === name)) unknown.push(name);
  }
  const needsExecute = atom.effect !== 'read';
  return {
    id: atom.id,
    primitive: atom.primitive,
    effect: atom.effect,
    needsExecute,
    missingArgs: required,
    unknownArgs: unknown,
    ready: required.length === 0 && unknown.length === 0,
    summary: atom.summary,
  };
}
