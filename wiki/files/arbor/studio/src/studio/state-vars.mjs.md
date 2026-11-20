# File: studio/src/studio/state-vars.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/state-vars.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9632 B |
| Lines | 266 |
| Hash | 36d4fa8b06f1 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCOPES | const | 16 | no | const SCOPES = new Set([&#39;browser&#39;, &#39;window&#39;, &#39;tab&#39;, &#39;site&#39;, &#39;account&#39;, &#39;page&#39;]); |
| KINDS | const | 17 | no | const KINDS = new Set([&#39;number&#39;, &#39;string&#39;, &#39;boolean&#39;, &#39;list&#39;, &#39;object&#39;]); |
| ID_RE | const | 18 | no | const ID_RE = /^[a-z][a-z0-9]*\\.[a-z][a-zA-Z0-9]*$/; |
| entry | function | 21 | no | function entry({ id, scope, kind, description }) { |
| STATE_VARS | const | 37 | yes | export const STATE_VARS = Object.freeze([ // --- browser: the single browser process the studio is connected to. --- entry({ id: &#39;browser.count&#39;, scope: &#39;browser&#39;, |
| getVar | function | 256 | yes | export function getVar(id) { |
| variable | const | 257 | no | const variable = STATE_VARS.find((v) =&gt; v.id === id); |
| varsForScope | function | 263 | yes | export function varsForScope(scope) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./state-vars.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Registry of every live fact the atom system can know about the browser environment. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-22 |
| 5 | invariant | — | — | every entry has a unique, dot-namespaced id, one of the six scopes, one of the five kinds, and a one-sentence description stating the fact asserted and how fresh it is. |
| 6 | invariant | — | — | no entry holds a cookie, token or password; account.signedIn is boolean, account.evidence is a description of what was observed. |
| 7 | see | — | studio/src/studio/atom-kit.mjs, | studio/src/studio/atom-kit.mjs, studio/src/studio/atom-roles.mjs |

## Excerpt

```javascript
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
```

_First 80 of 267 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
