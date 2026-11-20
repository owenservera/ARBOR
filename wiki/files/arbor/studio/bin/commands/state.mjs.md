# File: studio/bin/commands/state.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/state.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11082 B |
| Lines | 229 |
| Hash | 9d358347be01 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STATE_VARS_MODULE | const | 23 | no | const STATE_VARS_MODULE = &#39;../../src/studio/state-vars.mjs&#39;; |
| STATE_BIND_MODULE | const | 24 | no | const STATE_BIND_MODULE = &#39;../../src/studio/state-bind.mjs&#39;; |
| BROWSER_ATOMS_MODULE | const | 25 | no | const BROWSER_ATOMS_MODULE = &#39;../../src/studio/browser-atoms.mjs&#39;; |
| STATE_LIVE_MODULE | const | 26 | no | const STATE_LIVE_MODULE = &#39;../../src/studio/state-live.mjs&#39;; |
| SCOPES | const | 28 | no | const SCOPES = [&#39;browser&#39;, &#39;window&#39;, &#39;tab&#39;, &#39;site&#39;, &#39;account&#39;, &#39;page&#39;]; |
| DEFAULT_PORT | const | 29 | no | const DEFAULT_PORT = 9222; |
| missingModule | function | 34 | yes | export function missingModule(modulePath, hint) { |
| importModule | function | 38 | no | async function importModule(modulePath, what) { |
| formatVars | function | 47 | yes | export function formatVars(vars, { scope } = {}) { |
| lines | const | 48 | no | const lines = [`state ${vars.length} variable(s)${scope ? ` (scope ${scope})` : &#39;&#39;}`]; |
| accountSummary | function | 53 | yes | export function accountSummary(account) { |
| summary | const | 57 | no | const summary = { signedIn: account.signedIn }; |
| formatLive | function | 62 | yes | export function formatLive(data) { |
| browsers | const | 65 | no | const browsers = Array.isArray(data.browsers) ? data.browsers |
| tabList | const | 67 | no | const tabList = Array.isArray(data.tabs) ? data.tabs |
| ports | const | 69 | no | const ports = browsers.map((b) =&gt; Number(b.port)).filter((n) =&gt; Number.isFinite(n)); |
| tabCount | const | 70 | no | const tabCount = Number.isFinite(data.tabCount) ? data.tabCount |
| sites | const | 72 | no | const sites = Array.isArray(data.sites) ? data.sites |
| lines | const | 74 | no | const lines = []; |
| account | const | 79 | no | const account = accountSummary(data.account); |
| runVars | function | 89 | no | async function runVars(out, flags) { |
| mod | const | 90 | no | const mod = await importModule(STATE_VARS_MODULE, &#39;state-variable registry&#39;); |
| vars | variable | 91 | no | let vars = mod.STATE_VARS; |
| scope | variable | 92 | no | let scope = null; |
| data | const | 98 | no | const data = { |
| runLive | function | 110 | no | async function runLive(out, flags, ctxPort) { |
| mod | variable | 111 | no | let mod; |
| port | const | 117 | no | const port = Number(flags.port ?? ctxPort ?? DEFAULT_PORT); |
| data | const | 119 | no | const data = await mod.sampleLive({ port }); |
| browsers | const | 122 | no | const browsers = Array.isArray(data.browsers) ? data.browsers |
| tabs | const | 124 | no | const tabs = Array.isArray(data.tabs) ? data.tabs |
| sites | const | 126 | no | const sites = Array.isArray(data.sites) ? data.sites |
| ports | const | 128 | no | const ports = browsers.map((b) =&gt; Number(b.port)).filter((n) =&gt; Number.isFinite(n)); |
| tabCount | const | 129 | no | const tabCount = Number.isFinite(data.tabs?.count) ? data.tabs.count : tabs.length; |
| resultData | const | 130 | no | const resultData = { |
| lines | const | 143 | no | const lines = formatLive(resultData); |
| runCoverage | function | 148 | no | async function runCoverage(out, flags) { |
| atomsMod | const | 149 | no | const atomsMod = await importModule(BROWSER_ATOMS_MODULE, &#39;atom registry&#39;); |
| bindMod | const | 150 | no | const bindMod = await importModule(STATE_BIND_MODULE, &#39;state bindings&#39;); |
| reg | const | 151 | no | const reg = await atomsMod.loadRegistry(); |
| rows | const | 152 | no | const rows = reg.atoms.map((a) =&gt; ({ id: a.id, family: a.family, effect: a.effect, vars: bindMod.stateVarsFor(a) })); |
| validation | const | 153 | no | const validation = bindMod.validateBinding(reg.atoms, [...bindMod.USED_VARS]); |
| data | const | 154 | no | const data = { |
| runShow | function | 170 | no | async function runShow(out, flags, args) { |
| id | const | 171 | no | const id = flags.id ?? args[1]; |
| mod | const | 173 | no | const mod = await importModule(STATE_VARS_MODULE, &#39;state-variable registry&#39;); |
| variable | variable | 174 | no | let variable; |
| data | const | 177 | no | const data = { schema: &#39;vivim.state.var/1&#39;, var: variable }; |
| runState | function | 194 | yes | export async function runState(ctx, sub, flags) { |
| args | const | 196 | no | const args = ctx.args ?? []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../lib/registry.mjs | import | 20 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 21 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/state.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Studio state: list state variables, sample live browser/tab state, and atom-to-variable coverage. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-22 |
| 5 | see | — | studio/src/studio/state-vars.mjs, | studio/src/studio/state-vars.mjs, studio/src/studio/state-bind.mjs, studio/src/studio/browser-atoms.mjs, studio/src/studio/state-live.mjs |
| 6 | invariant | — | — | --json emits exactly one JSON document on stdout; human lines never mix with it. |
| 7 | invariant | — | — | no cookie, token, password or secret value is ever printed. |

## Excerpt

```javascript
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
```

_First 80 of 230 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
