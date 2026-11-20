# File: studio/src/studio/state-snapshot.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/state-snapshot.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6776 B |
| Lines | 170 |
| Hash | 106551a188f2 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SECRET_KEY | const | 9 | no | const SECRET_KEY = /^(?:cookie\|tokens?\|password\|passwd\|secret\|access.token\|refresh.token\|api.key\|authorization\|bearer\|credential\|private.key\|session.id\|xsrf\|csrf)$/i; |
| isPlainObject | function | 11 | no | function isPlainObject(value) { |
| stripSecrets | function | 16 | no | function stripSecrets(value) { |
| out | const | 19 | no | const out = {}; |
| stripSecretsArray | function | 29 | no | function stripSecretsArray(list) { |
| siteOf | function | 35 | no | function siteOf(page) { |
| accountSignedIn | function | 48 | no | function accountSignedIn(account) { |
| state | const | 51 | no | const state = String(account.state ?? &#39;&#39;).toLowerCase(); |
| accountUnknown | function | 55 | no | function accountUnknown(account) { |
| state | const | 59 | no | const state = String(account.state ?? &#39;&#39;).toLowerCase(); |
| freshnessOf | function | 63 | no | function freshnessOf(section) { |
| composeSnapshot | function | 85 | yes | export function composeSnapshot({ browsers, tabs, windows, pages, accounts, sampledAt } = {}) { |
| at | const | 86 | no | const at = |
| sections | const | 89 | no | const sections = { |
| freshness | const | 97 | no | const freshness = { |
| browserCount | const | 105 | no | const browserCount = Array.isArray(browsers) ? browsers.length : 0; |
| windowCount | const | 106 | no | const windowCount = Array.isArray(windows) ? windows.length : 0; |
| tabCount | const | 107 | no | const tabCount = Array.isArray(tabs) ? tabs.length : 0; |
| sites | const | 109 | no | const sites = new Set(); |
| site | const | 111 | no | const site = siteOf(page); |
| siteCount | const | 114 | no | const siteCount = sites.size; |
| signedInCount | variable | 116 | no | let signedInCount = 0; |
| unknownAccounts | variable | 117 | no | let unknownAccounts = 0; |
| missingFacts | function | 152 | yes | export function missingFacts(snapshot) { |
| facts | const | 153 | no | const facts = []; |
| freshness | const | 154 | no | const freshness = isPlainObject(snapshot) &amp;&amp; isPlainObject(snapshot.freshness) ? snapshot.freshness : {}; |
| summary | const | 155 | no | const summary = isPlainObject(snapshot) &amp;&amp; isPlainObject(snapshot.summary) ? snapshot.summary : {}; |
| missing | function | 157 | no | const missing = (key) =&gt; freshness[key] === &#39;missing&#39; \|\| freshness[key] === undefined; |
| tabCount | const | 164 | no | const tabCount = typeof summary.tabCount === &#39;number&#39; ? summary.tabCount : 0; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | State snapshot composer: one object answering &quot;what is true right now&quot; from already-sampled browser, tab, window, page and account data. |
| 3 | owner | vivim-orchestrator | — | vivim-orchestrator |
| 4 | task | — | — | state-snapshot-composer |
| 5 | invariant | — | — | every input is optional and already sampled; this function does no I/O. A missing section is freshness &#39;missing&#39; and is named by missingFacts, never silently defaulted to a known zero. Cookie/token/p… |

## Excerpt

```javascript
/**
 * @hq:context State snapshot composer: one object answering "what is true right now" from already-sampled browser, tab, window, page and account data.
 * @hq:owner vivim-orchestrator
 * @hq:task state-snapshot-composer
 * @hq:invariant every input is optional and already sampled; this function does no I/O. A missing section is freshness 'missing' and is named by missingFacts, never silently defaulted to a known zero. Cookie/token/password-like keys never pass through sections.
 */

// Keys that look like credentials and must never be passed through the snapshot.
const SECRET_KEY = /^(?:cookie|tokens?|password|passwd|secret|access.token|refresh.token|api.key|authorization|bearer|credential|private.key|session.id|xsrf|csrf)$/i;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Deep copy of an array/object with secret-looking keys removed at every level.
function stripSecrets(value) {
  if (Array.isArray(value)) return value.map((item) => stripSecrets(item));
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (SECRET_KEY.test(key)) continue;
      out[key] = stripSecrets(item);
    }
    return out;
  }
  return value;
}

function stripSecretsArray(list) {
  if (!Array.isArray(list)) return list;
  return list.map((item) => stripSecrets(item));
}

// Best-effort site key for a page: an explicit `site`, else the URL origin.
function siteOf(page) {
  if (!isPlainObject(page)) return undefined;
  if (typeof page.site === 'string' && page.site.trim() !== '') return page.site.trim();
  if (typeof page.url === 'string' && page.url.trim() !== '') {
    try {
      return new URL(page.url.trim()).origin;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function accountSignedIn(account) {
  if (!isPlainObject(account)) return false;
  if (typeof account.signedIn === 'boolean') return account.signedIn;
  const state = String(account.state ?? '').toLowerCase();
  return state === 'signed-in' || state === 'signedin' || state === 'authenticated' || state === 'active';
}

function accountUnknown(account) {
  if (!isPlainObject(account)) return true;
  if (typeof account.signedIn === 'boolean') return false; // explicitly signed in or signed out
  if (account.state === undefined) return true;
  const state = String(account.state ?? '').toLowerCase();
  return state === 'unknown' || state === '' || state === 'unset';
}

function freshnessOf(section) {
  return section === undefined ? 'missing' : 'live';
}

/**
 * Compose a point-in-time state snapshot from already-sampled data.
 *
 * Every input is optional and was already sampled by the browser/CDP owner; this
 * function does no I/O. A section that was not sampled is freshness 'missing' and
 * its summary count stays 0 — missingFacts(snapshot) names it so a reader can
 * distinguish "0 tabs because none are open" (known) from "0 tabs because nothing
 * was sampled" (unknown).
 *
 * @param {object} args
 * @param {Array} [args.browsers] sampled browser handles
 * @param {Array} [args.tabs] sampled tab handles
 * @param {Array} [args.windows] sampled window handles
 * @param {Array} [args.pages] sampled page observations (each with `url` and/or `site`)
```

_First 80 of 171 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
