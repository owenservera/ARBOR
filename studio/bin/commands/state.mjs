/**
 * @hq:context Studio state: list state variables, sample live browser/tab state, and atom-to-variable coverage.
 * @hq:owner atlas
 * @hq:task VC-22
 * @hq:see studio/src/studio/state-vars.mjs, studio/src/studio/state-bind.mjs, studio/src/studio/browser-atoms.mjs, studio/src/studio/state-live.mjs
 * @hq:invariant --json emits exactly one JSON document on stdout; human lines never mix with it.
 * @hq:invariant no cookie, token, password or secret value is ever printed.
 */

// `studio state` reports what the studio can know about the browser: the state-variable registry
// (`vars`, `show`), the live browser/tab picture (`live`), and which state variables each atom
// observes (`coverage`). vars/show/coverage never open Chrome. `live` needs the browser-control
// sampler studio/src/studio/state-live.mjs, which is imported defensively: a missing module is a
// clear usage error naming the module, never a raw import crash.
//
// Registerable by adding one import line to studio/bin/studio.mjs:
//   import './commands/state.mjs';
// (intentionally not done here).

import { define } from '../lib/registry.mjs';
import { usageError, notFound } from '../lib/ui.mjs';

const STATE_VARS_MODULE = '../../src/studio/state-vars.mjs';
const STATE_BIND_MODULE = '../../src/studio/state-bind.mjs';
const BROWSER_ATOMS_MODULE = '../../src/studio/browser-atoms.mjs';
const STATE_LIVE_MODULE = '../../src/studio/state-live.mjs';

const SCOPES = ['browser', 'window', 'tab', 'site', 'account', 'page'];
const DEFAULT_PORT = 9222;

// ---------------------------------------------------------------------------------------------
// Missing-module guard: a backing module that has not been built yet yields a clear usage error
// naming the module, instead of a raw import crash. Exported so it can be unit-tested.
export function missingModule(modulePath, hint) {
  throw usageError(`The state module is not installed: ${modulePath}`, hint ?? `Build ${modulePath}, then run this again.`);
}

async function importModule(modulePath, what) {
  try { return await import(modulePath); }
  catch { missingModule(modulePath, `Build ${modulePath} (${what}), then run this again.`); }
}

// ---------------------------------------------------------------------------------------------
// Pure formatters (human output). Returned as line arrays so they are easy to unit-test without a
// browser or a real terminal.

export function formatVars(vars, { scope } = {}) {
  const lines = [`state  ${vars.length} variable(s)${scope ? ` (scope ${scope})` : ''}`];
  for (const v of vars) lines.push(`  ${v.id}  ${v.scope}  ${v.kind}  ${v.description}`);
  return lines;
}

export function accountSummary(account) {
  if (!account || typeof account.signedIn !== 'boolean') {
    return { signedIn: 'unknown', why: 'the live module does not report account state yet' };
  }
  const summary = { signedIn: account.signedIn };
  if (typeof account.site === 'string' && account.site !== '') summary.site = account.site;
  return summary;
}

export function formatLive(data) {
  // sampleLiveState returns nested sections ({ browsers: { count, browsers: [...] } }); a flat
  // { browsers: [...] } is also accepted so this formatter cannot silently report zero.
  const browsers = Array.isArray(data.browsers) ? data.browsers
    : Array.isArray(data.browsers?.browsers) ? data.browsers.browsers : [];
  const tabList = Array.isArray(data.tabs) ? data.tabs
    : Array.isArray(data.tabs?.tabs) ? data.tabs.tabs : [];
  const ports = browsers.map((b) => Number(b.port)).filter((n) => Number.isFinite(n));
  const tabCount = Number.isFinite(data.tabCount) ? data.tabCount
    : Number.isFinite(data.tabs?.count) ? data.tabs.count : tabList.length;
  const sites = Array.isArray(data.sites) ? data.sites
    : Array.isArray(data.tabs?.sites) ? data.tabs.sites : [];
  const lines = [];
  lines.push(`state  ${browsers.length} browser(s)  ports: ${ports.join(', ') || 'none'}  tabs: ${tabCount}  sites: ${sites.length} (${sites.join(', ') || 'none'})`);
  for (const t of tabList) {
    lines.push(`  tab ${t.index ?? t.id ?? '?'}  ${t.url ?? '(no url)'}  —  ${t.title ?? '(no title)'}`);
  }
  const account = accountSummary(data.account);
  lines.push(account.signedIn === 'unknown'
    ? `  account: signedIn=unknown (${account.why})`
    : `  account: signedIn=${account.signedIn}${account.site ? ` site=${account.site}` : ''}`);
  return lines;
}

// ---------------------------------------------------------------------------------------------
// Subcommands

async function runVars(out, flags) {
  const mod = await importModule(STATE_VARS_MODULE, 'state-variable registry');
  let vars = mod.STATE_VARS;
  let scope = null;
  if (flags.scope) {
    scope = String(flags.scope);
    try { vars = mod.varsForScope(scope); }
    catch { throw usageError(`Unknown scope "${scope}".`, `Scopes: ${SCOPES.join(', ')}.`); }
  }
  const data = {
    schema: 'vivim.state.vars/1',
    scope,
    count: vars.length,
    vars: vars.map(({ id, scope: s, kind, description }) => ({ id, scope: s, kind, description })),
  };
  return out.emit(data, (o) => {
    o.result(`state  ${vars.length} variable(s)${scope ? ` (scope ${scope})` : ''}`);
    for (const v of vars) o.line(`  ${v.id}  ${v.scope}  ${v.kind}  ${v.description}`);
  });
}

async function runLive(out, flags, ctxPort) {
  let mod;
  try { mod = await import(STATE_LIVE_MODULE); }
  catch { throw usageError(`The state module is not installed: ${STATE_LIVE_MODULE}`, `Build ${STATE_LIVE_MODULE} (CDP target sampler), then run this again.`); }
  if (typeof mod.sampleLive !== 'function') {
    throw usageError(`${STATE_LIVE_MODULE} does not export sampleLive({ port }).`, `Export sampleLive from ${STATE_LIVE_MODULE}, then run this again.`);
  }
  const port = Number(flags.port ?? ctxPort ?? DEFAULT_PORT);
  if (!Number.isFinite(port)) throw usageError(`--port must be a number, got "${flags.port}".`);
  const data = await mod.sampleLive({ port });
  // sampleLive returns nested sections; flatten them ONCE, here, so nothing downstream sees a
  // shape it mis-reads as "nothing is open".
  const browsers = Array.isArray(data.browsers) ? data.browsers
    : Array.isArray(data.browsers?.browsers) ? data.browsers.browsers : [];
  const tabs = Array.isArray(data.tabs) ? data.tabs
    : Array.isArray(data.tabs?.tabs) ? data.tabs.tabs : [];
  const sites = Array.isArray(data.sites) ? data.sites
    : Array.isArray(data.tabs?.sites) ? data.tabs.sites : [];
  const ports = browsers.map((b) => Number(b.port)).filter((n) => Number.isFinite(n));
  const tabCount = Number.isFinite(data.tabs?.count) ? data.tabs.count : tabs.length;
  const resultData = {
    schema: 'vivim.state.live/1',
    port,
    sampledAt: data.sampledAt ?? null,
    browsers,
    browserCount: browsers.length,
    ports,
    tabCount,
    tabs,
    sites,
    account: accountSummary(data.account),
  };
  return out.emit(resultData, (o) => {
    const lines = formatLive(resultData);
    lines.forEach((line, i) => (i === 0 ? o.result(line) : o.line(line)));
  });
}

async function runCoverage(out, flags) {
  const atomsMod = await importModule(BROWSER_ATOMS_MODULE, 'atom registry');
  const bindMod = await importModule(STATE_BIND_MODULE, 'state bindings');
  const reg = await atomsMod.loadRegistry();
  const rows = reg.atoms.map((a) => ({ id: a.id, family: a.family, effect: a.effect, vars: bindMod.stateVarsFor(a) }));
  const validation = bindMod.validateBinding(reg.atoms, [...bindMod.USED_VARS]);
  const data = {
    schema: 'vivim.state.coverage/1',
    count: reg.atoms.length,
    minVars: validation.min,
    maxVars: validation.max,
    allKnown: validation.ok,
    missing: validation.missing,
    atoms: rows,
  };
  return out.emit(data, (o) => {
    o.result(`coverage: ${reg.atoms.length} atom(s); state vars per atom: ${validation.min}..${validation.max}; all vars known: ${validation.ok}`);
    if (!validation.ok) for (const p of validation.problems) o.line(`  ! ${p}`);
    for (const r of rows) o.line(`  ${r.id.padEnd(34)} ${r.family.padEnd(8)} ${r.effect.padEnd(16)} ${r.vars.join(', ')}`);
  });
}

async function runShow(out, flags, args) {
  const id = flags.id ?? args[1];
  if (!id) throw usageError('Usage: studio state show <var-id>', 'Example: studio state show account.signedIn');
  const mod = await importModule(STATE_VARS_MODULE, 'state-variable registry');
  let variable;
  try { variable = mod.getVar(id); }
  catch { throw notFound(`No state variable "${id}".`, 'List variables with "studio state vars".'); }
  const data = { schema: 'vivim.state.var/1', var: variable };
  return out.emit(data, (o) => {
    o.result(variable.id);
    o.line(`  scope   ${variable.scope}`);
    o.line(`  kind    ${variable.kind}`);
    o.line(`  description  ${variable.description}`);
  });
}

/**
 * Run one `state` subcommand. Exported so the pure paths (vars/show/coverage and the missing-module
 * guard for live) can be unit-tested without a browser or a Chrome process.
 *
 * @param {{ out: object, args: string[] }} ctx
 * @param {string|undefined} sub
 * @param {object} flags
 */
export async function runState(ctx, sub, flags) {
  const { out } = ctx;
  const args = ctx.args ?? [];
  switch (sub) {
    case 'vars': return runVars(out, flags);
    case 'live': return runLive(out, flags, ctx.port);
    case 'coverage': return runCoverage(out, flags);
    case 'show': return runShow(out, flags, args);
    default: throw usageError('Usage: studio state <vars|live|coverage|show> [--scope S] [--port N] [--json]', 'Subcommands: vars [--scope S], live [--port N], coverage, show <var-id>.');
  }
}

define({
  name: 'state',
  section: 'System',
  usage: '<vars|live|coverage|show> [--scope S] [--port N] [--json]',
  summary: 'Studio state: state variables, live browser/tab state, atom coverage',
  description: 'Lists the state-variable registry (vars/show), samples the live browser/tab picture (live), and shows which state variables each atom observes (coverage). vars/show/coverage never open Chrome; live requires the CDP sampler studio/src/studio/state-live.mjs, owned by browser control.',
  flags: {
    scope: { type: 'string', valueName: 'S', desc: 'For vars: one scope of browser, window, tab, site, account, page' },
    port: { type: 'number', valueName: 'N', desc: 'For live: Chrome DevTools port (default 9222)' },
    id: { type: 'string', valueName: 'VAR_ID', desc: 'For show: one state variable id' },
    json: { type: 'boolean', desc: 'Machine-readable output' },
  },
  examples: [
    'studio state vars',
    'studio state vars --scope account',
    'studio state live --port 9222 --json',
    'studio state coverage',
    'studio state show account.signedIn',
  ],
  run: async (ctx) => {
    const [sub] = ctx.args;
    return runState(ctx, sub, ctx.flags);
  },
});
