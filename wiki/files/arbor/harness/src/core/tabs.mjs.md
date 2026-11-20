# File: harness/src/core/tabs.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/core/tabs.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4701 B |
| Lines | 78 |
| Hash | f0d998e980be |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createTabRegistry | function | 7 | yes | export function createTabRegistry({ file, fs = fsp } = {}) { |
| chain | variable | 9 | no | let chain = Promise.resolve(); |
| serial | function | 10 | no | const serial = fn =&gt; { const run = chain.then(fn, fn); chain = run.catch(() =&gt; {}); return run; }; |
| load | function | 12 | no | async function load() { |
| raw | variable | 13 | no | let raw; |
| list | const | 15 | no | const list = JSON.parse(raw); |
| save | function | 19 | no | async function save(list) { |
| tmp | const | 21 | no | const tmp = `${file}.${process.pid}.${randomBytes(4).toString(&#39;hex&#39;)}.tmp`; |
| mutate | function | 25 | no | const mutate = fn =&gt; serial(async () =&gt; { const list = await load(); const { next, result } = fn(list); if (next !== list) await save(next); return result; }); |
| registry | const | 27 | no | const registry = { |
| entry | const | 30 | no | const entry = { id, provider: provider ?? null, url: url ?? null, openedAt: new Date().toISOString(), ...(typeof typedKey === &#39;string&#39; &amp;&amp; typedKey ? { typedKey } : {}) }; |
| next | const | 44 | no | const next = list.filter(t =&gt; t.id !== id); |
| live | const | 48 | no | const live = new Set(liveTargets.map(t =&gt; t?.id)); |
| next | const | 49 | no | const next = list.filter(t =&gt; live.has(t.id)); |
| dropped | const | 50 | no | const dropped = list.filter(t =&gt; !live.has(t.id)).map(t =&gt; t.id); |
| closed | const | 55 | no | const closed = [], refused = []; |
| typedKeyFor | function | 69 | yes | export function typedKeyFor(text) { |
| core | const | 70 | no | const core = String(text ?? &#39;&#39;).normalize(&#39;NFKC&#39;).replace(/[^\\p{L}\\p{N}]/gu, &#39;&#39;); |
| clearComposerExpression | function | 75 | yes | export function clearComposerExpression(selectors) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 1 | external |
| node:path | import | 2 | external |
| node:crypto | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/core/tabs.mjs |
| [harness/src/interface/router.mjs](../interface/router.mjs.md) | ../core/tabs.mjs |
| [harness/test/core/tabs.test.mjs](../../test/core/tabs.test.mjs.md) | ../../src/core/tabs.mjs |
| [harness/test/interface/tabs-router.test.mjs](../../test/interface/tabs-router.test.mjs.md) | ../../src/core/tabs.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
