# File: studio/src/studio/atom-dispatch.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/atom-dispatch.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 20075 B |
| Lines | 224 |
| Hash | 667ac941aa50 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| json | function | 12 | no | const json = (value) =&gt; JSON.stringify(value ?? null); |
| evalInPage | function | 15 | no | async function evalInPage(page, expression) { |
| res | const | 16 | no | const res = await page.send(&#39;Runtime.evaluate&#39;, { expression, returnByValue: true, awaitPromise: true, userGesture: true, }); |
| needSelector | function | 26 | no | function needSelector(args) { |
| selector | const | 27 | no | const selector = args.selector ?? args.target ?? args.element; |
| q | function | 32 | no | const q = (selector) =&gt; json(selector); |
| nodeExpr | function | 33 | no | const nodeExpr = (selector) =&gt; `document.querySelector(${q(selector)})`; |
| PRIMITIVE_HANDLERS | const | 39 | yes | export const PRIMITIVE_HANDLERS = { |
| text | const | 51 | no | const text = await evalInPage(page, `(() =&gt; { const el = ${nodeExpr(needSelector(a))}; return el ? (el.innerText \|\| el.textContent \|\| &#39;&#39;) : (document.body?.innerText \|\| &#39;&#39;); })()`); |
| files | const | 72 | no | const files = Array.isArray(a.files) ? a.files : [a.path ?? a.file].filter(Boolean); |
| doc | const | 77 | no | const doc = await page.send(&#39;DOM.getDocument&#39;, { depth: 0, pierce: true }); |
| found | const | 78 | no | const found = await page.send(&#39;DOM.querySelector&#39;, { nodeId: doc.root.nodeId, selector: &#39;input[type=&quot;file&quot;]&#39; }); |
| selector | const | 106 | no | const selector = needSelector(a); |
| present | const | 108 | no | const present = await evalInPage(page, `!!${nodeExpr(selector)}`); |
| needle | const | 116 | no | const needle = String(a.text ?? &#39;&#39;); |
| found | const | 118 | no | const found = await evalInPage(page, `(document.body?.innerText ?? &#39;&#39;).includes(${q(needle)})`); |
| busy | const | 127 | no | const busy = await evalInPage(page, `document.readyState !== &#39;complete&#39;`); |
| state | const | 136 | no | const state = await evalInPage(page, &#39;document.readyState&#39;); |
| box | const | 146 | no | const box = await PRIMITIVE_HANDLERS.getBox(page, a); |
| r | const | 148 | no | const r = await page.send(&#39;Page.captureScreenshot&#39;, { format: String(a.format ?? &#39;png&#39;), clip: { x: box.x, y: box.y, width: box.width, height: box.height, scale: 1 } }); |
| hit | const | 188 | no | const hit = await evalInPage(page, `(() =&gt; { const t = (document.body?.innerText ?? &#39;&#39;).slice(0, 2000).toLowerCase(); return [&#39;cookie&#39;, &#39;consent&#39;, &#39;accept all&#39;, &#39;manage preferences&#39;].some((k) =&gt; t.in… |
| runAtom | function | 201 | yes | export async function runAtom(atom, args = {}, { page = null, execute = false, now = Date.now } = {}) { |
| startedAt | const | 202 | no | const startedAt = now(); |
| handler | const | 203 | no | const handler = PRIMITIVE_HANDLERS[atom.primitive]; |
| result | const | 214 | no | const result = await handler(page, args); |
| createDispatcher | function | 222 | yes | export function createDispatcher(page, { now = Date.now } = {}) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | dynamic | 52 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/atoms.mjs](../../bin/commands/atoms.mjs.md) | ../../src/studio/atom-dispatch.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./atom-dispatch.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The only component allowed to turn an atom into a browser effect. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-20 |
| 5 | invariant | — | — | no page, no run: an atom without an attached page refuses instead of pretending. |
| 6 | invariant | — | — | a non-read atom requires execute:true; the dispatcher never infers authority. |

## Excerpt

```javascript
/**
 * @hq:context The only component allowed to turn an atom into a browser effect.
 * @hq:owner atlas
 * @hq:task VC-20
 * @hq:invariant no page, no run: an atom without an attached page refuses instead of pretending.
 * @hq:invariant a non-read atom requires execute:true; the dispatcher never infers authority.
 */
// Atoms are declarations; this is the executor. Every primitive is one small function over an
// already-attached CDP page (`page.send(method, params)`), so the 1000 capabilities stay auditable:
// they compose 61 real operations rather than hiding 1000 bespoke scripts.

const json = (value) => JSON.stringify(value ?? null);

/** Evaluate in the page and return the value. The only place arbitrary page code runs. */
async function evalInPage(page, expression) {
  const res = await page.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true, userGesture: true,
  });
  if (res?.exceptionDetails) {
    throw new Error(`PAGE_EVAL_FAILED: ${res.exceptionDetails.text ?? 'exception'}`);
  }
  return res?.result?.value;
}

/** Read a selector required by the atom. */
function needSelector(args) {
  const selector = args.selector ?? args.target ?? args.element;
  if (typeof selector !== 'string' || !selector.length) throw new Error('ATOM_SELECTOR_REQUIRED');
  return selector;
}

const q = (selector) => json(selector);
const nodeExpr = (selector) => `document.querySelector(${q(selector)})`;

/**
 * Primitive handlers. Each returns the primitive's value; the dispatcher wraps it in an envelope.
 * `page` is the attached CDP session — this module never opens a connection of its own.
 */
export const PRIMITIVE_HANDLERS = {
  // --- reads -----------------------------------------------------------------------
  evaluate: (page, a) => evalInPage(page, a.expression ?? 'null'),
  getText: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; return el ? (el.innerText || el.textContent || '').trim() : null; })()`),
  getHtml: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; return el ? (${a.outer ? 'el.outerHTML' : 'el.innerHTML'}) : null; })()`),
  getAttr: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; return el ? el.getAttribute(${q(a.name ?? a.attr ?? '')}) : null; })()`),
  getProp: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; return el ? el[${q(a.name ?? a.prop ?? '')}] : null; })()`),
  getValue: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; return el ? (el.value ?? null) : null; })()`),
  count: (page, a) => evalInPage(page, `document.querySelectorAll(${q(needSelector(a))}).length`),
  getBox: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, left: r.left }; })()`),
  getStyles: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return null; const cs = getComputedStyle(el); const name = ${q(a.name ?? '')}; return name ? cs.getPropertyValue(name) : { display: cs.display, visibility: cs.visibility, opacity: cs.opacity, color: cs.color, background: cs.backgroundColor }; })()`),
  digest: async (page, a) => {
    const text = await evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; return el ? (el.innerText || el.textContent || '') : (document.body?.innerText || ''); })()`);
    const { createHash } = await import('node:crypto');
    return 'sha256:' + createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex').slice(0, 16);
  },

  // --- page writes -----------------------------------------------------------------
  click: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.click(); return true; })()`),
  dblclick: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); return true; })()`),
  rightclick: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })); return true; })()`),
  hover: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); return true; })()`),
  focus: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.focus(); return document.activeElement === el; })()`),
  blur: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.blur(); return true; })()`),
  drag: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.dispatchEvent(new DragEvent('dragstart', { bubbles: true })); return true; })()`),
  typeText: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.focus(); const text = ${q(a.text ?? '')}; if (el.isContentEditable) { el.textContent = (${a.append ? 'el.textContent' : '""'}) + text; } else { el.value = (${a.append ? 'el.value' : '""'}) + text; } el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text })); return true; })()`),
  fillValue: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.focus(); if ('value' in el) el.value = ${q(a.text ?? a.value ?? '')}; else el.textContent = ${q(a.text ?? a.value ?? '')}; el.dispatchEvent(new InputEvent('input', { bubbles: true })); return true; })()`),
  appendText: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.focus(); if ('value' in el) el.value = (el.value ?? '') + ${q(a.text ?? '')}; else el.textContent = (el.textContent ?? '') + ${q(a.text ?? '')}; el.dispatchEvent(new InputEvent('input', { bubbles: true })); return true; })()`),
  clearValue: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.focus(); if ('value' in el) el.value = ''; else el.textContent = ''; el.dispatchEvent(new InputEvent('input', { bubbles: true })); return true; })()`),
  pressKey: (page, a) => page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: String(a.key ?? 'Enter'), windowsVirtualKeyCode: Number(a.code ?? 0) }).then(() => true),
  chord: (page, a) => evalInPage(page, `(() => { const el = document.activeElement ?? document.body; const parts = ${q(String(a.keys ?? 'Control+a'))}.split('+'); const key = parts.pop(); el.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: parts.includes('Control'), shiftKey: parts.includes('Shift'), altKey: parts.includes('Alt'), metaKey: parts.includes('Meta'), bubbles: true })); return true; })()`),
  paste: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; const dt = new DataTransfer(); dt.setData('text/plain', ${q(a.text ?? '')}); el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); return true; })()`),
  setFiles: (page, a) => {
    const files = Array.isArray(a.files) ? a.files : [a.path ?? a.file].filter(Boolean);
    if (!files.length) throw new Error('ATOM_FILES_REQUIRED');
    return evalInPage(page, `(() => { const el = document.querySelector('input[type="file"]'); return el ? true : false; })()`)
      .then(async (has) => {
        if (!has) throw new Error('ATOM_NO_FILE_INPUT');
        const doc = await page.send('DOM.getDocument', { depth: 0, pierce: true });
        const found = await page.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: 'input[type="file"]' });
        if (!found?.nodeId) throw new Error('ATOM_NO_FILE_INPUT');
        await page.send('DOM.setFileInputFiles', { files, nodeId: found.nodeId });
```

_First 80 of 225 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
