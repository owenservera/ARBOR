/**
 * @hq:context Shared kit for the atomic browser-capability registry: shapes, effects, primitives.
 * @hq:owner atlas
 * @hq:task VC-20
 * @hq:invariant every atom names a primitive from PRIMITIVES; an atom with no primitive cannot run.
 * @hq:invariant ids are `<family>.<verb>.<target>` and globally unique across the 1000.
 */
// A family module exports { family, atoms } with exactly 100 atoms built by makeAtom(). The
// aggregator composes ten families into the central 1000-capability node. Atoms are declarative:
// they name a PRIMITIVE, and the dispatcher is the only thing that touches the browser.

/** What an atom can do to the world. Effects are ordered by blast radius. */
export const EFFECT = {
  read: 'read',                        // observes; no page change
  localWrite: 'local-write',           // changes Studio state, not the page
  browserNavigation: 'browser-navigation', // moves the tab
  pageWrite: 'page-write',             // changes the page (click, type, fill)
  providerSend: 'provider-send',       // may consume provider quota
};

export const EFFECTS = Object.values(EFFECT);

/**
 * The fixed primitive vocabulary. Every atom maps to exactly one. Ten families share these on
 * purpose: 1000 capabilities are 46 real operations composed over targets, which is what keeps
 * them auditable instead of 1000 bespoke scripts.
 */
export const PRIMITIVES = new Set([
  'evaluate', 'click', 'dblclick', 'rightclick', 'hover', 'focus', 'blur', 'drag',
  'typeText', 'fillValue', 'appendText', 'clearValue', 'setFiles', 'pressKey', 'chord', 'paste',
  'scrollTo', 'scrollBy', 'scrollIntoView', 'resize', 'viewport', 'zoom',
  'goto', 'goBack', 'goForward', 'reload', 'newTab', 'closeTab', 'listTabs', 'switchTab',
  'getText', 'getHtml', 'getAttr', 'getProp', 'count', 'getBox', 'getStyles', 'getValue',
  'waitForSelector', 'waitForText', 'waitForNetworkIdle', 'waitForLoad',
  'screenshotPage', 'screenshotElement', 'pdf', 'digest',
  'getRequests', 'getResponse', 'waitForResponse', 'blockRequest', 'mockResponse', 'clearNetwork',
  'getCookies', 'getStorage', 'setStorage', 'clearStorage', 'getPermissions',
  'detectWall', 'readConsole', 'readErrors', 'getTiming',
  // Second thousand: frames, forms, media, clipboard, transfers, auth, tracing, consent.
  'listFrames', 'frameSwitch', 'submitForm', 'validateForm', 'readSelection', 'setClipboard',
  'waitForDownload', 'getDownloads', 'getMedia', 'readTrace', 'waitForConsent', 'dismissConsent',
]);

/** Argument types an atom may declare. */
export const ARG_TYPES = new Set(['string', 'number', 'boolean', 'selector', 'url', 'path', 'json']);

const ID_RE = /^[a-z][a-z0-9]*\.[a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z][a-zA-Z0-9]*$/;

/**
 * Build one atom. Everything an operator or a scheduler needs to decide whether to run it is
 * declared here; nothing is inferred later.
 */
export function makeAtom({ id, family, verb, target, primitive, effect, args = [], summary, send = false }) {
  if (!ID_RE.test(String(id ?? ''))) throw new Error(`ATOM_BAD_ID: ${id}`);
  if (id.split('.')[0] !== family) throw new Error(`ATOM_FAMILY_MISMATCH: ${id} vs ${family}`);
  if (!PRIMITIVES.has(primitive)) throw new Error(`ATOM_BAD_PRIMITIVE: ${id} -> ${primitive}`);
  if (!EFFECTS.includes(effect)) throw new Error(`ATOM_BAD_EFFECT: ${id} -> ${effect}`);
  if (!summary || String(summary).length < 8) throw new Error(`ATOM_SUMMARY_REQUIRED: ${id}`);
  const seen = new Set();
  for (const a of args) {
    if (!a || typeof a.name !== 'string' || !a.name) throw new Error(`ATOM_BAD_ARG: ${id}`);
    if (seen.has(a.name)) throw new Error(`ATOM_DUPLICATE_ARG: ${id}.${a.name}`);
    seen.add(a.name);
    if (!ARG_TYPES.has(a.type)) throw new Error(`ATOM_BAD_ARG_TYPE: ${id}.${a.name}=${a.type}`);
  }
  // A provider send is the only effect that may not be inferred from the primitive: it must be
  // declared, because it costs the owner quota.
  const derived = send ? EFFECT.providerSend : effect;
  return Object.freeze({
    id, family, verb, target, primitive, effect: derived,
    args: Object.freeze(args.map((a) => Object.freeze({ name: a.name, type: a.type, required: a.required !== false }))),
    summary: String(summary),
  });
}

/** Validate a whole family: exact size, unique ids, and no unknown shape. */
export function validateFamily({ family, atoms, expected = 100 }) {
  const problems = [];
  if (!family) problems.push('family name missing');
  if (!Array.isArray(atoms)) return { ok: false, problems: ['atoms is not an array'] };
  if (atoms.length !== expected) problems.push(`expected ${expected} atoms, got ${atoms.length}`);
  const ids = new Set();
  for (const atom of atoms) {
    if (!atom || typeof atom.id !== 'string') { problems.push('atom without id'); continue; }
    if (ids.has(atom.id)) problems.push(`duplicate id: ${atom.id}`);
    ids.add(atom.id);
    if (atom.family !== family) problems.push(`foreign family atom: ${atom.id}`);
    if (!PRIMITIVES.has(atom.primitive)) problems.push(`bad primitive: ${atom.id}`);
    if (!EFFECTS.includes(atom.effect)) problems.push(`bad effect: ${atom.id}`);
  }
  return { ok: problems.length === 0, problems, count: atoms.length, unique: ids.size };
}
