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
