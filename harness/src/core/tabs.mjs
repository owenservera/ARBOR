import * as fsp from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';

// G4 tab hygiene: the harness only ever closes CDP targets it opened itself.
// Prompt text is never stored: only typedKeyFor(prompt), a hash of its letters and digits.
export function createTabRegistry({ file, fs = fsp } = {}) {
  if (typeof file !== 'string' || !file) throw new TypeError('file is required');
  let chain = Promise.resolve();
  const serial = fn => { const run = chain.then(fn, fn); chain = run.catch(() => {}); return run; };

  async function load() {
    let raw;
    try { raw = await fs.readFile(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) throw new Error('Tab registry is not a JSON list');
    return list.filter(t => t && typeof t.id === 'string');
  }
  async function save(list) {
    await fs.mkdir?.(dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(list, null, 2) + '\n', 'utf8');
    try { await fs.rename(tmp, file); } catch (e) { await fs.rm?.(tmp, { force: true }).catch(() => {}); throw e; }
  }
  const mutate = fn => serial(async () => { const list = await load(); const { next, result } = fn(list); if (next !== list) await save(next); return result; });

  const registry = {
    record: ({ id, provider, url, typedKey } = {}) => {
      if (typeof id !== 'string' || !id) return Promise.reject(new TypeError('id must be a non-empty string'));
      const entry = { id, provider: provider ?? null, url: url ?? null, openedAt: new Date().toISOString(), ...(typeof typedKey === 'string' && typedKey ? { typedKey } : {}) };
      return mutate(list => ({ next: [...list.filter(t => t.id !== id), entry], result: entry }));
    },
    owned: () => serial(load),
    isOwned: async id => (await registry.owned()).some(t => t.id === id),
    noteTyped: async (id, typedKey) => {
      if (typeof typedKey !== 'string' || !typedKey) throw new TypeError('typedKey must be a non-empty string');
      return mutate(list => {
        if (!list.some(t => t.id === id)) return { next: list, result: false };
        return { next: list.map(t => t.id === id ? { ...t, typedKey } : t), result: true };
      });
    },
    typedKeys: async () => (await registry.owned()).map(t => t.typedKey).filter(k => typeof k === 'string' && k),
    forget: id => mutate(list => {
      const next = list.filter(t => t.id !== id);
      return next.length === list.length ? { next: list, result: false } : { next, result: true };
    }),
    prune: (liveTargets = []) => mutate(list => {
      const live = new Set(liveTargets.map(t => t?.id));
      const next = list.filter(t => live.has(t.id));
      const dropped = list.filter(t => !live.has(t.id)).map(t => t.id);
      return { next: dropped.length ? next : list, result: dropped };
    }),
    async closeOwned({ browser, ids = [] } = {}) {
      if (typeof browser?.closeTarget !== 'function') throw new TypeError('browser.closeTarget is required');
      const closed = [], refused = [];
      for (const id of ids) {
        if (!(await registry.isOwned(id))) { refused.push(id); continue; }
        await browser.closeTarget(id);
        await registry.forget(id);
        closed.push(id);
      }
      return { closed, refused };
    },
  };
  return registry;
}

// Stable key for text the harness typed: insensitive to whitespace, punctuation and markdown rendering.
export function typedKeyFor(text) {
  const core = String(text ?? '').normalize('NFKC').replace(/[^\p{L}\p{N}]/gu, '');
  return createHash('sha256').update(core, 'utf8').digest('hex');
}

// Page-side expression: clears the first matching composer, fires `input`, returns chars cleared.
export function clearComposerExpression(selectors) {
  if (!Array.isArray(selectors) || !selectors.length || !selectors.every(s => typeof s === 'string' && s)) throw new TypeError('selectors must be a non-empty array of strings');
  return `(() => { const sels = ${JSON.stringify(selectors)}; for (const s of sels) { const e = document.querySelector(s); if (!e) continue; let n = 0; if (e.tagName === 'TEXTAREA' || e.tagName === 'INPUT') { n = (e.value || '').length; const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e), 'value'); d && d.set ? d.set.call(e, '') : (e.value = ''); } else { n = (e.textContent || '').length; e.textContent = ''; } e.dispatchEvent(new Event('input', { bubbles: true })); return n; } return 0; })()`;
}
