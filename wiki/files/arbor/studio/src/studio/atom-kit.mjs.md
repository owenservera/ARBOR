# File: studio/src/studio/atom-kit.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/atom-kit.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5304 B |
| Lines | 92 |
| Hash | af8416a9c208 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EFFECT | const | 13 | yes | export const EFFECT = { |
| EFFECTS | const | 21 | yes | export const EFFECTS = Object.values(EFFECT); |
| PRIMITIVES | const | 28 | yes | export const PRIMITIVES = new Set([ &#39;evaluate&#39;, &#39;click&#39;, &#39;dblclick&#39;, &#39;rightclick&#39;, &#39;hover&#39;, &#39;focus&#39;, &#39;blur&#39;, &#39;drag&#39;, &#39;typeText&#39;, &#39;fillValue&#39;, &#39;appendText&#39;, &#39;clearValue&#39;, &#39;setFiles&#39;, &#39;pressKey&#39;, &#39;chor… |
| ARG_TYPES | const | 45 | yes | export const ARG_TYPES = new Set([&#39;string&#39;, &#39;number&#39;, &#39;boolean&#39;, &#39;selector&#39;, &#39;url&#39;, &#39;path&#39;, &#39;json&#39;]); |
| ID_RE | const | 47 | no | const ID_RE = /^[a-z][a-z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*$/; |
| makeAtom | function | 53 | yes | export function makeAtom({ id, family, verb, target, primitive, effect, args = [], summary, send = false }) { |
| seen | const | 59 | no | const seen = new Set(); |
| derived | const | 68 | no | const derived = send ? EFFECT.providerSend : effect; |
| validateFamily | function | 77 | yes | export function validateFamily({ family, atoms, expected = 100 }) { |
| problems | const | 78 | no | const problems = []; |
| ids | const | 82 | no | const ids = new Set(); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/atoms/act.mjs](./atoms/act.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/auth.mjs](./atoms/auth.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/clipboard.mjs](./atoms/clipboard.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/consent.mjs](./atoms/consent.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/dom.mjs](./atoms/dom.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/download.mjs](./atoms/download.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/form.mjs](./atoms/form.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/frame.mjs](./atoms/frame.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/media.mjs](./atoms/media.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/nav.mjs](./atoms/nav.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/net.mjs](./atoms/net.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/read.mjs](./atoms/read.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/safe.mjs](./atoms/safe.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/screen.mjs](./atoms/screen.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/state.mjs](./atoms/state.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/table.mjs](./atoms/table.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/torrent.mjs](./atoms/torrent.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/trace.mjs](./atoms/trace.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/type.mjs](./atoms/type.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/upload.mjs](./atoms/upload.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/wait.mjs](./atoms/wait.mjs.md) | ../atom-kit.mjs |
| [studio/src/studio/atoms/window.mjs](./atoms/window.mjs.md) | ../atom-kit.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Shared kit for the atomic browser-capability registry: shapes, effects, primitives. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-20 |
| 5 | invariant | — | — | every atom names a primitive from PRIMITIVES; an atom with no primitive cannot run. |
| 6 | invariant | — | — | ids are `&lt;family&gt;.&lt;verb&gt;.&lt;target&gt;` and globally unique across the 1000. |

## Excerpt

```javascript
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
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
