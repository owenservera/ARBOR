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
        return files.length;
      });
  },

  // --- viewport --------------------------------------------------------------------
  scrollTo: (page, a) => evalInPage(page, `(() => { window.scrollTo({ top: ${Number(a.y ?? a.top ?? 0)}, left: ${Number(a.x ?? 0)}, behavior: ${q(a.smooth ? 'smooth' : 'instant')} }); return true; })()`),
  scrollBy: (page, a) => evalInPage(page, `(() => { window.scrollBy({ top: ${Number(a.y ?? 0)}, left: ${Number(a.x ?? 0)}, behavior: ${q(a.smooth ? 'smooth' : 'instant')} }); return true; })()`),
  scrollIntoView: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; el.scrollIntoView({ block: ${q(a.block ?? 'center')}, behavior: ${q(a.smooth ? 'smooth' : 'instant')} }); return true; })()`),
  resize: (page, a) => page.send('Emulation.setDeviceMetricsOverride', { width: Number(a.width ?? 1280), height: Number(a.height ?? 800), deviceScaleFactor: Number(a.dpr ?? 1), mobile: Boolean(a.mobile) }).then(() => true),
  viewport: (page) => evalInPage(page, `({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scrollY, scrollX })`),
  zoom: (page, a) => evalInPage(page, `(() => { document.body.style.zoom = ${q(String(a.zoom ?? 1))}; return document.body.style.zoom; })()`),

  // --- navigation ------------------------------------------------------------------
  goto: (page, a) => page.send('Page.navigate', { url: String(a.url ?? '') }).then((r) => r?.frameId ?? null),
  goBack: (page) => evalInPage(page, `(() => { history.back(); return true; })()`),
  goForward: (page) => evalInPage(page, `(() => { history.forward(); return true; })()`),
  reload: (page, a) => page.send('Page.reload', { ignoreCache: Boolean(a.hard ?? a.ignoreCache) }).then(() => true),
  newTab: async () => { throw new Error('ATOM_NEEDS_TARGET_CONTROL: newTab is owned by Studio target management'); },
  closeTab: (page) => page.send('Target.closeTarget', { targetId: page.targetId ?? '' }).then(() => true),
  listTabs: async () => { throw new Error('ATOM_NEEDS_TARGET_CONTROL: listTabs is owned by Studio target management'); },
  switchTab: async () => { throw new Error('ATOM_NEEDS_TARGET_CONTROL: switchTab is owned by Studio target management'); },

  // --- waits -----------------------------------------------------------------------
  waitForSelector: async (page, a) => {
    const until = Date.now() + Number(a.timeoutMs ?? 10000);
    const selector = needSelector(a);
    while (Date.now() < until) {
      const present = await evalInPage(page, `!!${nodeExpr(selector)}`);
      if (a.absent ? !present : present) return true;
      await new Promise((r) => setTimeout(r, 150));
    }
    return false;
  },
  waitForText: async (page, a) => {
    const until = Date.now() + Number(a.timeoutMs ?? 10000);
    const needle = String(a.text ?? '');
    while (Date.now() < until) {
      const found = await evalInPage(page, `(document.body?.innerText ?? '').includes(${q(needle)})`);
      if (a.absent ? !found : found) return true;
      await new Promise((r) => setTimeout(r, 150));
    }
    return false;
  },
  waitForNetworkIdle: async (page, a) => {
    const until = Date.now() + Number(a.timeoutMs ?? 10000);
    while (Date.now() < until) {
      const busy = await evalInPage(page, `document.readyState !== 'complete'`);
      if (!busy) return true;
      await new Promise((r) => setTimeout(r, 150));
    }
    return false;
  },
  waitForLoad: async (page, a) => {
    const until = Date.now() + Number(a.timeoutMs ?? 10000);
    while (Date.now() < until) {
      const state = await evalInPage(page, 'document.readyState');
      if (state === 'complete' || (a.dom && state === 'interactive')) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  },

  // --- evidence --------------------------------------------------------------------
  screenshotPage: (page, a) => page.send('Page.captureScreenshot', { format: String(a.format ?? 'png') }).then((r) => ({ base64: r?.data ? r.data.length : 0 })),
  screenshotElement: async (page, a) => {
    const box = await PRIMITIVE_HANDLERS.getBox(page, a);
    if (!box) return null;
    const r = await page.send('Page.captureScreenshot', { format: String(a.format ?? 'png'), clip: { x: box.x, y: box.y, width: box.width, height: box.height, scale: 1 } });
    return { base64: r?.data ? r.data.length : 0 };
  },
  pdf: (page) => page.send('Page.printToPDF', {}).then((r) => ({ base64: r?.data ? r.data.length : 0 })),

  // --- network ---------------------------------------------------------------------
  getRequests: async () => { throw new Error('ATOM_NEEDS_NETWORK_LOG: use Studio capture, which owns the network log'); },
  getResponse: async () => { throw new Error('ATOM_NEEDS_NETWORK_LOG: use Studio capture, which owns the network log'); },
  waitForResponse: async () => { throw new Error('ATOM_NEEDS_NETWORK_LOG: use Studio capture, which owns the network log'); },
  blockRequest: (page) => page.send('Network.setBlockedURLs', { urls: ['*'] }).then(() => true),
  mockResponse: async () => { throw new Error('ATOM_NEEDS_NETWORK_LOG: use Studio capture, which owns the network log'); },
  clearNetwork: (page) => page.send('Network.clearBrowserCache', {}).then(() => true),
  getTiming: (page) => evalInPage(page, `(() => { const t = performance.getEntriesByType('navigation')[0] || {}; return { load: t.loadEventEnd ?? null, dom: t.domContentLoadedEventEnd ?? null, requests: performance.getEntriesByType('resource').length }; })()`),

  // --- session state (no secret values) --------------------------------------------
  getCookies: (page) => page.send('Network.getCookies', {}).then((r) => (r?.cookies ?? []).map((c) => ({ name: c.name, domain: c.domain, secure: Boolean(c.secure), httpOnly: Boolean(c.httpOnly) }))),
  getStorage: (page, a) => evalInPage(page, `(() => { const store = ${a.session ? 'sessionStorage' : 'localStorage'}; return ${a.keysOnly === false ? `Object.entries(store).map(([k]) => k)` : `Object.keys(store)`}; })()`),
  setStorage: (page, a) => evalInPage(page, `(() => { const store = ${a.session ? 'sessionStorage' : 'localStorage'}; store.setItem(${q(a.key ?? '')}, ${q(String(a.value ?? ''))}); return true; })()`),
  clearStorage: (page, a) => evalInPage(page, `(() => { const store = ${a.session ? 'sessionStorage' : 'localStorage'}; store.clear(); return true; })()`),
  getPermissions: (page) => evalInPage(page, `({ visibility: document.visibilityState, online: navigator.onLine, ua: navigator.userAgent, lang: navigator.language })`),

  // --- guards ----------------------------------------------------------------------
  detectWall: (page) => evalInPage(page, `(() => { const t = (document.body?.innerText ?? '').slice(0, 4000).toLowerCase(); const hit = ['sign in', 'log in', 'captcha', 'verify you are human', 'upgrade', 'rate limit', 'too many requests', 'consent', 'accept all'].find((k) => t.includes(k)); return hit ?? null; })()`),
  readConsole: async () => { throw new Error('ATOM_NEEDS_CONSOLE_LOG: use Studio capture, which owns the console log'); },
  readErrors: async () => { throw new Error('ATOM_NEEDS_CONSOLE_LOG: use Studio capture, which owns the console log'); },

  // --- second thousand -------------------------------------------------------------
  listFrames: (page) => evalInPage(page, `[...document.querySelectorAll('iframe,frame')].map((f, i) => ({ index: i, name: f.name || null, src: f.src || null, id: f.id || null }))`),
  frameSwitch: async () => { throw new Error('ATOM_NEEDS_FRAME_SESSION: frame targeting needs a per-frame CDP session, which Studio target management owns'); },
  submitForm: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return false; if (typeof el.requestSubmit === 'function') { el.requestSubmit(); return true; } el.submit?.(); return true; })()`),
  validateForm: (page, a) => evalInPage(page, `(() => { const el = ${nodeExpr(needSelector(a))}; if (!el) return null; const bad = [...el.querySelectorAll(':invalid')].map((n) => n.name || n.id || n.tagName); return { valid: el.checkValidity ? el.checkValidity() : null, invalid: bad }; })()`),
  readSelection: (page) => evalInPage(page, `({ text: String(window.getSelection?.() ?? ''), length: String(window.getSelection?.() ?? '').length })`),
  setClipboard: (page, a) => evalInPage(page, `(() => { const text = ${q(a.text ?? '')}; if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text); return true; } return false; })()`),
  waitForDownload: async () => { throw new Error('ATOM_NEEDS_DOWNLOAD_CONTROL: downloads need Studio download interception, not a page poll'); },
  getDownloads: async () => { throw new Error('ATOM_NEEDS_DOWNLOAD_CONTROL: downloads need Studio download interception, not a page poll'); },
  getMedia: (page, a) => evalInPage(page, `(() => { const sel = ${q(a.tag ?? 'img,video,audio,canvas')}; return [...document.querySelectorAll(sel)].slice(0, 50).map((m, i) => ({ index: i, tag: m.tagName.toLowerCase(), src: m.currentSrc || m.src || null, width: m.naturalWidth ?? m.width ?? null, height: m.naturalHeight ?? m.height ?? null, duration: Number.isFinite(m.duration) ? m.duration : null })); })()`),
  readTrace: (page) => evalInPage(page, `(() => { const nav = performance.getEntriesByType('navigation')[0] || {}; const res = performance.getEntriesByType('resource'); return { navigation: { load: nav.loadEventEnd ?? null, dom: nav.domContentLoadedEventEnd ?? null }, requests: res.length, slowest: res.slice().sort((x, y) => y.duration - x.duration).slice(0, 5).map((r) => ({ name: r.name, ms: Math.round(r.duration) })) }; })()`),
  waitForConsent: async (page, a) => {
    const until = Date.now() + Number(a.timeoutMs ?? 8000);
    while (Date.now() < until) {
      const hit = await evalInPage(page, `(() => { const t = (document.body?.innerText ?? '').slice(0, 2000).toLowerCase(); return ['cookie', 'consent', 'accept all', 'manage preferences'].some((k) => t.includes(k)); })()`);
      if (!hit) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  },
  dismissConsent: (page) => evalInPage(page, `(() => { const want = /(reject all|only necessary|accept all|aceptar|rechazar|consent|agree)/i; const hit = [...document.querySelectorAll('button,[role="button"]')].find((n) => want.test((n.getAttribute('aria-label') || n.textContent || '').slice(0, 60))); if (!hit) return false; hit.click(); return true; })()`),
};

/**
 * Run one atom. Refuses without a page, refuses a non-read atom without execute, and always
 * returns an envelope rather than throwing for expected failures.
 */
export async function runAtom(atom, args = {}, { page = null, execute = false, now = Date.now } = {}) {
  const startedAt = now();
  const handler = PRIMITIVE_HANDLERS[atom.primitive];
  if (!handler) {
    return { ok: false, id: atom.id, primitive: atom.primitive, error: `ATOM_NO_HANDLER: ${atom.primitive}`, ms: 0 };
  }
  if (atom.effect !== 'read' && execute !== true) {
    return { ok: false, id: atom.id, error: 'ATOM_EXECUTE_REQUIRED', ms: 0 };
  }
  if (!page) {
    return { ok: false, id: atom.id, error: 'ATOM_PAGE_REQUIRED', ms: 0 };
  }
  try {
    const result = await handler(page, args);
    return { ok: true, id: atom.id, primitive: atom.primitive, effect: atom.effect, result, ms: now() - startedAt };
  } catch (error) {
    return { ok: false, id: atom.id, primitive: atom.primitive, error: String(error?.message ?? error), ms: now() - startedAt };
  }
}

/** Build a dispatcher bound to one attached page. */
export function createDispatcher(page, { now = Date.now } = {}) {
  return (atom, args, opts = {}) => runAtom(atom, args, { page, now, ...opts });
}
