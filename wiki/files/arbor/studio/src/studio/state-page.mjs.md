# File: studio/src/studio/state-page.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/state-page.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2451 B |
| Lines | 72 |
| Hash | 566ec64420e5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PAGE_PROBE | const | 10 | yes | export const PAGE_PROBE = `(() =&gt; { let url = null; let title = null; let readyState = null; let visible = null; |
| url | variable | 11 | no | let url = null; |
| title | variable | 12 | no | let title = null; |
| readyState | variable | 13 | no | let readyState = null; |
| visible | variable | 14 | no | let visible = null; |
| viewport | variable | 15 | no | let viewport = null; |
| composerReady | variable | 22 | no | let composerReady = false; |
| draft | variable | 23 | no | let draft = 0; |
| el | const | 25 | no | const el = document.querySelector(&#39;textarea, div[contenteditable=&quot;true&quot;], [data-testid=&quot;prompt-textarea&quot;]&#39;); |
| rect | const | 26 | no | const rect = el ? el.getBoundingClientRect() : null; |
| text | const | 29 | no | const text = el.value ?? el.textContent ?? &#39;&#39;; |
| samplePageState | function | 43 | yes | export async function samplePageState({ evaluate } = {}) { |
| raw | const | 48 | no | const raw = await evaluate(PAGE_PROBE); |
| payload | const | 49 | no | const payload = raw &amp;&amp; typeof raw === &#39;object&#39; &amp;&amp; !Array.isArray(raw) ? raw : {}; |
| draftValue | const | 61 | no | const draftValue = Number(draft); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | PAGE state sampler: one round-trip in-page probe captures url, title, readyState, |
| 4 | owner | atlas | — | atlas |
| 5 | task | — | — | state-page-sampler |
| 6 | invariant | — | — | samplePageState calls evaluate exactly once and never throws on a composer-less page. |

## Excerpt

```javascript
/**
 * @hq:context PAGE state sampler: one round-trip in-page probe captures url, title, readyState,
 * composer presence, draft length, visibility and viewport; this module never opens a browser.
 * @hq:owner atlas
 * @hq:task state-page-sampler
 * @hq:invariant samplePageState calls evaluate exactly once and never throws on a composer-less page.
 */

/** Probe sent to the page through the injected evaluate. One expression, zero side effects. */
export const PAGE_PROBE = `(() => {
  let url = null;
  let title = null;
  let readyState = null;
  let visible = null;
  let viewport = null;
  try { url = location.href; } catch {}
  try { title = document.title; } catch {}
  try { readyState = document.readyState; } catch {}
  try { visible = document.visibilityState; } catch {}
  try { viewport = { width: window.innerWidth, height: window.innerHeight }; } catch {}

  let composerReady = false;
  let draft = 0;
  try {
    const el = document.querySelector('textarea, div[contenteditable="true"], [data-testid="prompt-textarea"]');
    const rect = el ? el.getBoundingClientRect() : null;
    composerReady = !!(el && rect && (rect.width > 0 || rect.height > 0));
    if (composerReady && el) {
      const text = el.value ?? el.textContent ?? '';
      draft = String(text).length;
    }
  } catch {}

  return { url, title, readyState, composerReady, draft, visible, viewport };
})()`;

/**
 * Sample the page state with a single evaluate round trip.
 *
 * @param {{ evaluate: (expression: string) => Promise<unknown> }} deps
 * @returns {Promise<{ url: unknown, title: unknown, readyState: unknown, composerReady: boolean, draft: number, visible: unknown, viewport: unknown }>}
 */
export async function samplePageState({ evaluate } = {}) {
  if (typeof evaluate !== 'function') {
    throw new Error('samplePageState: evaluate must be a function');
  }

  const raw = await evaluate(PAGE_PROBE);
  const payload = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  const {
    url = null,
    title = null,
    readyState = null,
    composerReady = false,
    draft = 0,
    visible = null,
    viewport = null,
  } = payload;

  const draftValue = Number(draft);

  return {
    url,
    title,
    readyState,
    composerReady: Boolean(composerReady),
    draft: Number.isFinite(draftValue) ? draftValue : 0,
    visible,
    viewport,
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
