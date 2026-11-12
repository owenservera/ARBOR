/**
 * @hq:context Registry of every live fact the atom system can know about the browser environment.
 * @hq:owner atlas
 * @hq:task VC-22
 * @hq:invariant every entry has a unique, dot-namespaced id, one of the six scopes, one of the five kinds, and a one-sentence description stating the fact asserted and how fresh it is.
 * @hq:invariant no entry holds a cookie, token or password; account.signedIn is boolean, account.evidence is a description of what was observed.
 * @hq:see studio/src/studio/atom-kit.mjs, studio/src/studio/atom-roles.mjs
 */
//
// STATE_VARS names the facts the system can know about the browser environment, grouped by
// scope: browser | window | tab | site | account | page. Each entry declares the kind of the
// value (number | string | boolean | list | object) and a one-sentence description of what fact
// it asserts and how fresh that fact must be. The registry is declarative: nothing here touches
// the browser, and no entry may hold a secret.

const SCOPES = new Set(['browser', 'window', 'tab', 'site', 'account', 'page']);
const KINDS = new Set(['number', 'string', 'boolean', 'list', 'object']);
const ID_RE = /^[a-z][a-z0-9]*\.[a-z][a-zA-Z0-9]*$/;

/** Build and freeze one registry entry, validating its shape at load time. */
function entry({ id, scope, kind, description }) {
  if (!ID_RE.test(String(id ?? ''))) throw new Error(`STATE_VAR_BAD_ID: ${id}`);
  const [scopePart] = String(id).split('.');
  if (scopePart !== scope) throw new Error(`STATE_VAR_SCOPE_MISMATCH: ${id} vs ${scope}`);
  if (!SCOPES.has(scope)) throw new Error(`STATE_VAR_BAD_SCOPE: ${id} -> ${scope}`);
  if (!KINDS.has(kind)) throw new Error(`STATE_VAR_BAD_KIND: ${id} -> ${kind}`);
  if (!description || typeof description !== 'string' || !description.trim().endsWith('.')) {
    throw new Error(`STATE_VAR_DESCRIPTION_REQUIRED: ${id}`);
  }
  return Object.freeze({ id, scope, kind, description: String(description) });
}

/**
 * Every live fact the system can know about the browser environment. Frozen, so the registry is
 * a stable contract for atoms, schedulers and tests: add facts here, never in a derived shape.
 */
export const STATE_VARS = Object.freeze([
  // --- browser: the single browser process the studio is connected to. ---
  entry({
    id: 'browser.count',
    scope: 'browser',
    kind: 'number',
    description: 'Asserts how many browser processes are alive right now; fresh as of the last heartbeat probe.',
  }),
  entry({
    id: 'browser.ports',
    scope: 'browser',
    kind: 'list',
    description: 'Asserts which debugging ports the browser is listening on; fresh as of the last port discovery.',
  }),
  entry({
    id: 'browser.reachable',
    scope: 'browser',
    kind: 'boolean',
    description: 'Asserts whether the browser answers CDP right now; fresh as of the last heartbeat.',
  }),
  entry({
    id: 'browser.version',
    scope: 'browser',
    kind: 'string',
    description: 'Asserts the version of the connected browser; fresh at connection.',
  }),
  entry({
    id: 'browser.profile',
    scope: 'browser',
    kind: 'string',
    description: 'Asserts which browser profile the session uses; fresh at launch.',
  }),

  // --- window: the windows of the connected browser. ---
  entry({
    id: 'window.count',
    scope: 'window',
    kind: 'number',
    description: 'Asserts how many browser windows are open right now; fresh as of the last window listing.',
  }),
  entry({
    id: 'window.focused',
    scope: 'window',
    kind: 'boolean',
    description: 'Asserts whether the studio-owned window has input focus; fresh as of the last focus check.',
  }),
  entry({
    id: 'window.geometry',
    scope: 'window',
    kind: 'object',
    description: "Asserts the focused window's {x, y, width, height}; fresh as of the last resize or move event.",
  }),
  entry({
    id: 'window.tabIds',
    scope: 'window',
    kind: 'list',
    description: 'Asserts the ids of tabs in the focused window; fresh as of the last tab list.',
  }),

  // --- tab: the targets inside the browser. ---
  entry({
    id: 'tab.count',
    scope: 'tab',
    kind: 'number',
    description: 'Asserts how many tabs are open right now; fresh as of the last tab list.',
  }),
  entry({
    id: 'tab.urls',
    scope: 'tab',
    kind: 'list',
    description: 'Asserts the URL of every open tab; fresh as of the last tab list.',
  }),
  entry({
    id: 'tab.titles',
    scope: 'tab',
    kind: 'list',
    description: 'Asserts the title of every open tab; fresh as of the last tab list.',
  }),
  entry({
    id: 'tab.active',
    scope: 'tab',
    kind: 'boolean',
    description: 'Asserts whether exactly one tab is focused right now; fresh as of the last activation change.',
  }),
  entry({
    id: 'tab.site',
    scope: 'tab',
    kind: 'string',
    description: "Asserts the registrable domain of the active tab's page; fresh on navigation.",
  }),
  entry({
    id: 'tab.owner',
    scope: 'tab',
    kind: 'string',
    description: "Asserts which seat owns the active tab's current command; fresh on handoff.",
  }),
  entry({
    id: 'tab.index',
    scope: 'tab',
    kind: 'number',
    description: 'Asserts the zero-based index of the active tab; fresh as of the last tab list.',
  }),
  entry({
    id: 'tab.hidden',
    scope: 'tab',
    kind: 'boolean',
    description: 'Asserts whether the active tab is hidden or backgrounded; fresh on visibility change.',
  }),

  // --- site: the distinct sites the open tabs belong to. ---
  entry({
    id: 'site.count',
    scope: 'site',
    kind: 'number',
    description: 'Asserts how many distinct sites are open across tabs; fresh as of the last tab list.',
  }),
  entry({
    id: 'site.hosts',
    scope: 'site',
    kind: 'list',
    description: 'Asserts the hostnames of the open sites; fresh as of the last tab list.',
  }),
  entry({
    id: 'site.seat',
    scope: 'site',
    kind: 'string',
    description: 'Asserts which seat is acting on the active site; fresh on handoff.',
  }),
  entry({
    id: 'site.readyState',
    scope: 'site',
    kind: 'string',
    description: "Asserts the loading state of the active site's main frame ('loading' | 'interactive' | 'complete'); fresh on navigation commit.",
  }),
  entry({
    id: 'site.secure',
    scope: 'site',
    kind: 'boolean',
    description: 'Asserts whether the active site uses HTTPS; fresh on navigation.',
  }),

  // --- account: the owner's identity and session state. ---
  entry({
    id: 'account.site',
    scope: 'account',
    kind: 'string',
    description: "Asserts which site the owner is signed into ('' when none); fresh on sign-in or sign-out.",
  }),
  entry({
    id: 'account.signedIn',
    scope: 'account',
    kind: 'boolean',
    description: 'Asserts whether the owner has an active session on the current site; fresh on sign-in, sign-out or session check.',
  }),
  entry({
    id: 'account.evidence',
    scope: 'account',
    kind: 'string',
    description: 'Asserts what observation established the signed-in state; fresh with every sign-in check.',
  }),
  entry({
    id: 'account.profile',
    scope: 'account',
    kind: 'object',
    description: "Asserts the signed-in account's profile ({name, email}); fresh on profile read.",
  }),
  entry({
    id: 'account.sessionMinutes',
    scope: 'account',
    kind: 'number',
    description: 'Asserts how long the current session has been active; fresh on each sign-in check.',
  }),

  // --- page: the rendered page of the active tab. ---
  entry({
    id: 'page.url',
    scope: 'page',
    kind: 'string',
    description: 'Asserts the URL of the active page; fresh on navigation.',
  }),
  entry({
    id: 'page.title',
    scope: 'page',
    kind: 'string',
    description: 'Asserts the title of the active page; fresh on navigation or render.',
  }),
  entry({
    id: 'page.readyState',
    scope: 'page',
    kind: 'string',
    description: "Asserts document.readyState of the active page ('loading' | 'interactive' | 'complete'); fresh on load or commit.",
  }),
  entry({
    id: 'page.composerReady',
    scope: 'page',
    kind: 'boolean',
    description: 'Asserts whether the page AI composer is ready to accept input; fresh on composer load.',
  }),
  entry({
    id: 'page.draft',
    scope: 'page',
    kind: 'string',
    description: 'Asserts the current composer draft text (owner-visible only); fresh on every keystroke.',
  }),
  entry({
    id: 'page.visible',
    scope: 'page',
    kind: 'boolean',
    description: 'Asserts whether the active page tab is visible; fresh on visibility change.',
  }),
  entry({
    id: 'page.loadTime',
    scope: 'page',
    kind: 'number',
    description: 'Asserts how many milliseconds the last navigation took; fresh on the load event.',
  }),
]);

/** Look up one variable by id. Throws STATE_VAR_UNKNOWN rather than returning undefined. */
export function getVar(id) {
  const variable = STATE_VARS.find((v) => v.id === id);
  if (!variable) throw new Error(`STATE_VAR_UNKNOWN: ${id}`);
  return variable;
}

/** Return every variable of the given scope, in registry order. Throws STATE_VAR_UNKNOWN_SCOPE for an unknown scope. */
export function varsForScope(scope) {
  if (!SCOPES.has(String(scope))) throw new Error(`STATE_VAR_UNKNOWN_SCOPE: ${scope}`);
  return STATE_VARS.filter((v) => v.scope === scope);
}
