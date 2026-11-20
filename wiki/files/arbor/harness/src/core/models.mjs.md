# File: harness/src/core/models.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/core/models.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18399 B |
| Lines | 211 |
| Hash | b0a21d11bac4 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| slug | function | 8 | yes | export const slug = label =&gt; String(label ?? &#39;&#39;).toLowerCase().trim().replace(/[^a-z0-9.]+/g, &#39;-&#39;).replace(/^-+\|-+$/g, &#39;&#39;); |
| parseModelSpec | function | 11 | yes | export function parseModelSpec(spec) { |
| i | const | 13 | no | const i = spec.indexOf(&#39;:&#39;); |
| provider | const | 15 | no | const provider = spec.slice(0, i).trim(); let model = spec.slice(i + 1).trim(), effort = null; |
| at | const | 16 | no | const at = model.indexOf(&#39;@&#39;); if (at &gt;= 0) { effort = model.slice(at + 1).trim() \|\| null; model = model.slice(0, at).trim(); } |
| normalizeModels | function | 22 | yes | export function normalizeModels(profile, raw) { |
| ignore | const | 23 | no | const ignore = (profile?.models?.ignore \|\| []).map(s =&gt; new RegExp(s, &#39;i&#39;)); |
| effortRx | const | 24 | no | const effortRx = (profile?.models?.efforts \|\| []).map(s =&gt; new RegExp(s, &#39;i&#39;)); |
| seen | const | 25 | no | const seen = new Set(); const models = []; const efforts = []; |
| label | const | 27 | no | const label = String(item?.label ?? &#39;&#39;).split(&#39;\\n&#39;)[0].trim(); |
| id | const | 31 | no | const id = slug(label); if (!id \|\| seen.has(id)) continue; |
| trigger | const | 34 | no | const trigger = String(raw?.current ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| cur | variable | 35 | no | let cur = models.find(m =&gt; m.checked); |
| em | const | 37 | no | const em = profile?.models?.effortMenu; |
| resolveModel | function | 44 | yes | export function resolveModel(entry, wanted) { |
| STRONG_CLASSES | const | 50 | no | const STRONG_CLASSES = new Set([&#39;implementation&#39;, &#39;review&#39;, &#39;decision&#39;, &#39;research&#39;, &#39;app-design&#39;]); |
| pickModelForTask | function | 51 | yes | export function pickModelForTask(profile, entry, taskClass) { |
| tier | const | 52 | no | const tier = STRONG_CLASSES.has(taskClass) ? &#39;strong&#39; : &#39;fast&#39;; |
| helpers | function | 58 | no | const helpers = p =&gt; `const p = ${JSON.stringify(p.models)}; |
| sleep | function | 59 | no | const sleep = ms =&gt; new Promise(r =&gt; setTimeout(r, ms)); |
| visible | function | 60 | no | const visible = e =&gt; !!(e &amp;&amp; (e.offsetParent \|\| e.getClientRects().length)); |
| menus | function | 61 | no | const menus = () =&gt; [...document.querySelectorAll(&#39;[role=menu],[role=listbox],[data-radix-popper-content-wrapper],.cdk-overlay-pane&#39;)].filter(e =&gt; visible(e) &amp;&amp; e.getAttribute(&#39;data-state&#39;) !== &#39;clos… |
| isOpen | function | 63 | no | const isOpen = t =&gt; t.hasAttribute(&#39;aria-expanded&#39;) ? t.getAttribute(&#39;aria-expanded&#39;) === &#39;true&#39; : menus().length &gt; 0; |
| ptr | function | 64 | no | const ptr = el =&gt; { const o = { bubbles:true, cancelable:true, pointerId:1, pointerType:&#39;mouse&#39;, button:0 }; el.dispatchEvent(new PointerEvent(&#39;pointerdown&#39;, o)); el.dispatchEvent(new MouseEvent(&#39;mou… |
| open | function | 65 | no | const open = async t =&gt; { |
| itemsOf | function | 70 | no | const itemsOf = () =&gt; { const out = []; for (const m of menus()) { const xs = [...m.querySelectorAll(&#39;[role=menuitem],[role=menuitemradio],[role=menuitemcheckbox],[role=option]&#39;)].filter(visible); |
| subRx | const | 74 | no | const subRx = (p.efforts \|\| []).map(x =&gt; new RegExp(x, &#39;i&#39;)); const openSub = async () =&gt; { const more = [...document.querySelectorAll(&#39;[role^=menuitem]&#39;)].find(e =&gt; { if (!visible(e)) return false; … |
| close | function | 75 | no | const close = async () =&gt; { const t = trigger(); const open = () =&gt; t ? isOpen(t) : menus().length &gt; 0; |
| trigger | function | 78 | no | const trigger = () =&gt; document.querySelector(p.triggerSelector); |
| openEffortMenu | function | 79 | no | const openEffortMenu = async () =&gt; { const em = p.effortMenu; if (!em) return false; const it = [...document.querySelectorAll(&#39;[role^=menuitem],button&#39;)].find(e =&gt; visible(e) &amp;&amp; (e.innerText \|\| &#39;&#39;).t… |
| readSlider | function | 82 | no | const readSlider = () =&gt; { if (!p.effortSlider) return null; const el = [...document.querySelectorAll(p.effortSlider)].find(visible); if (!el) return null; |
| menu | const | 83 | no | const menu = el.closest(&#39;[role=menu]&#39;) \|\| document.body; const txt = (menu.innerText \|\| &#39;&#39;).replace(/\\\\s+/g, &#39; &#39;); |
| m | const | 84 | no | const m = txt.match(/([^,\\\\n]+?), (\\\\d+) (?:of\|de) (\\\\d+)/); const now = Number(el.getAttribute(&#39;aria-valuenow&#39;)); |
| lb | variable | 85 | no | let lb = m ? m[1].trim() : null; if (lb) { const w = lb.split(&#39; &#39;); if (w.length % 2 === 0 &amp;&amp; w.slice(0, w.length / 2).join(&#39; &#39;) === w.slice(w.length / 2).join(&#39; &#39;)) lb = w.slice(0, w.length / 2).joi… |
| discoverExpression | function | 88 | yes | export function discoverExpression(profile) { |
| t | const | 90 | no | const t = trigger(); if (!t) return { error:&#39;MODEL_PICKER_MISSING&#39; }; |
| current | const | 91 | no | const current = (t.innerText \|\| t.getAttribute(&#39;aria-label&#39;) \|\| &#39;&#39;).trim(); |
| closed | const | 94 | no | const closed = await close(); return { current, items, closed, slider }; |
| selectExpression | function | 98 | yes | export function selectExpression(profile, label) { |
| want | const | 100 | no | const want = ${JSON.stringify(String(label).toLowerCase())}; |
| t | const | 101 | no | const t = trigger(); if (!t) return { ok:false, error:&#39;MODEL_PICKER_MISSING&#39; }; |
| effortMenuExpression | function | 109 | yes | export function effortMenuExpression(profile, level) { |
| want | const | 111 | no | const want = ${JSON.stringify(String(level).toLowerCase())}; |
| t | const | 112 | no | const t = trigger(); if (!t) return { ok:false, error:&#39;MODEL_PICKER_MISSING&#39; }; |
| hit | const | 114 | no | const hit = [...document.querySelectorAll(&#39;[role^=menuitem],[role=option],button&#39;)].filter(visible).find(e =&gt; (e.innerText \|\| &#39;&#39;).trim().split(&#39;\\\\n&#39;)[0].trim().toLowerCase() === want); |
| dismissExpression | function | 121 | yes | export function dismissExpression(profile) { |
| texts | const | 123 | no | const texts = ${JSON.stringify((profile?.preflight?.dismissButtonTexts \|\| []).map(s =&gt; s.toLowerCase()))}; let clicked = 0; |
| closed | const | 125 | no | const closed = p.triggerSelector ? await close() : true; return { clicked, closed }; |
| sliderExpression | function | 129 | yes | export function sliderExpression(profile, steps) { |
| t | const | 131 | no | const t = trigger(); if (!t) return { ok:false, error:&#39;MODEL_PICKER_MISSING&#39; }; |
| discoverModels | function | 139 | yes | export async function discoverModels(page, profile) { |
| raw | const | 141 | no | const raw = await page.evaluate(discoverExpression(profile)); |
| resolveEffort | function | 147 | yes | export function resolveEffort(entry, wanted) { |
| list | const | 148 | no | const list = entry?.efforts \|\| []; if (!wanted \|\| !list.length) return null; |
| prepareModel | function | 155 | yes | export async function prepareModel({ page, profile, wanted = null, effort = null, readyTimeoutMs = 15000, pollMs = 250 }) { |
| sel | const | 157 | no | const sel = JSON.stringify(profile.models.triggerSelector); const end = Date.now() + readyTimeoutMs; |
| discovered | variable | 160 | no | let discovered = await discoverModels(page, profile); |
| target | const | 162 | no | const target = resolveModel(discovered, wanted); |
| r | const | 165 | no | const r = await page.evaluate(selectExpression(profile, target.label)); |
| model | const | 170 | no | const model = { id: target.id, label: target.label }; |
| sl | const | 174 | no | const sl = discovered.slider; const want = /^(max\|highest\|high)$/i.test(effort) ? sl.count : Number(effort); |
| r | const | 178 | no | const r = await page.evaluate(sliderExpression(profile, want - sl.index)); |
| e | variable | 186 | no | let e = resolveEffort(discovered, effort); |
| r | const | 189 | no | const r = await page.evaluate(discovered.effortMode === &#39;menu&#39; ? effortMenuExpression(profile, e.label) : selectExpression(profile, e.label)); |
| createModelRegistry | function | 201 | yes | export function createModelRegistry({ file }) { |
| load | function | 202 | no | const load = async () =&gt; { try { return JSON.parse(await readFile(file, &#39;utf8&#39;)); } catch { return {}; } }; |
| all | const | 207 | no | const all = await load(); all[providerId] = { discoveredAt: now, current: discovered.current, currentLabel: discovered.currentLabel, models: discovered.models, ...(discovered.slider ? { slider: disco… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 5 | external |
| node:path | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/interface/brain.mjs](../interface/brain.mjs.md) | ../core/models.mjs |
| [harness/src/interface/router.mjs](../interface/router.mjs.md) | ../core/models.mjs |
| [harness/test/core/effort.test.mjs](../../test/core/effort.test.mjs.md) | ../../src/core/models.mjs |
| [harness/test/core/effort.test.mjs](../../test/core/effort.test.mjs.md) | ../../src/core/models.mjs |
| [harness/test/core/models.test.mjs](../../test/core/models.test.mjs.md) | ../../src/core/models.mjs |
| [harness/test/core/relay-chat-fixes.test.mjs](../../test/core/relay-chat-fixes.test.mjs.md) | ../../src/core/models.mjs |
| [harness/test/providers/providers.test.mjs](../../test/providers/providers.test.mjs.md) | ../../src/core/models.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Model awareness for signed-in web AIs. Reads a provider's model picker (open, read, Escape:
// UI only, never a send), selects a model before anything is typed, and reports the model in use.
// Picker config lives on each provider profile under `models`:
//   { triggerSelector, submenuText?, ignore?: [regex source], tiers?: { strong: [regex], fast: [regex] } }
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const slug = label => String(label ?? '').toLowerCase().trim().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');

// 'chatgpt:gpt-6' -> { provider:'chatgpt', model:'gpt-6' }; 'claude' -> { provider:'claude', model:null }.
export function parseModelSpec(spec) {
  if (typeof spec !== 'string' || !spec.trim()) throw Object.assign(new Error('Model or provider required'), { code: 'MODEL_SPEC_INVALID' });
  const i = spec.indexOf(':');
  if (i < 0) return { provider: spec.trim(), model: null };
  const provider = spec.slice(0, i).trim(); let model = spec.slice(i + 1).trim(), effort = null;
  const at = model.indexOf('@'); if (at >= 0) { effort = model.slice(at + 1).trim() || null; model = model.slice(0, at).trim(); }
  if (!provider) throw Object.assign(new Error('Provider missing in model spec'), { code: 'MODEL_SPEC_INVALID' });
  return { provider, model: model || null, ...(effort ? { effort } : {}) };
}

// Pure: raw picker read -> { current, currentLabel, models:[{ id, label, current }] }.
export function normalizeModels(profile, raw) {
  const ignore = (profile?.models?.ignore || []).map(s => new RegExp(s, 'i'));
  const effortRx = (profile?.models?.efforts || []).map(s => new RegExp(s, 'i'));
  const seen = new Set(); const models = []; const efforts = [];
  for (const item of raw?.items || []) {
    const label = String(item?.label ?? '').split('\n')[0].trim();
    if (label && label.length <= 60 && effortRx.some(r => r.test(label)) && !efforts.some(e => e.id === slug(label))) efforts.push({ id: slug(label), label, current: item.checked === true });
    if (label && effortRx.some(r => r.test(label))) continue;
    if (!label || label.length > 60 || ignore.some(r => r.test(label))) continue;
    const id = slug(label); if (!id || seen.has(id)) continue;
    seen.add(id); models.push({ id, label, checked: item.checked === true });
  }
  const trigger = String(raw?.current ?? '').replace(/\s+/g, ' ').trim();
  let cur = models.find(m => m.checked);
  if (!cur && trigger) cur = [...models].sort((a, b) => b.label.length - a.label.length).find(m => trigger.toLowerCase().includes(m.label.toLowerCase()));
  const em = profile?.models?.effortMenu;
  if (em) { const it = (raw?.items || []).find(i => String(i?.label ?? '').split('\n')[0].trim().toLowerCase() === em.text.toLowerCase()); const curE = it ? String(it.label).split('\n').map(x => x.trim()).filter(Boolean)[1] : null;
    return { current: cur?.id ?? null, currentLabel: cur?.label ?? (trigger || null), models: models.map(({ id, label }) => ({ id, label, current: id === cur?.id })), efforts: em.levels.map(l => ({ id: slug(l), label: l, current: !!curE && slug(curE) === slug(l) })), effortMode: 'menu' }; }
  return { current: cur?.id ?? null, currentLabel: cur?.label ?? (trigger || null), models: models.map(({ id, label }) => ({ id, label, current: id === cur?.id })), ...(effortRx.length ? { efforts } : {}) };
}

// Pure: find a requested model (id or label, case/punctuation-insensitive) in a discovered list.
export function resolveModel(entry, wanted) {
  if (!wanted) return null; const w = slug(wanted);
  return (entry?.models || []).find(m => m.id === w || slug(m.label) === w) ?? null;
}

// Pure: pick a model from discovered ones for a task class using the profile's tier regexes.
const STRONG_CLASSES = new Set(['implementation', 'review', 'decision', 'research', 'app-design']);
export function pickModelForTask(profile, entry, taskClass) {
  const tier = STRONG_CLASSES.has(taskClass) ? 'strong' : 'fast';
  for (const src of profile?.models?.tiers?.[tier] || []) { const r = new RegExp(src, 'i'); const m = (entry?.models || []).find(x => r.test(x.label)); if (m) return { model: m, tier }; }
  return { model: null, tier };
}

// Browser expressions. Opening: keyboard first (Radix menus), then pointer + click (Material, custom).
const helpers = p => `const p = ${JSON.stringify(p.models)};
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const visible = e => !!(e && (e.offsetParent || e.getClientRects().length));
    const menus = () => [...document.querySelectorAll('[role=menu],[role=listbox],[data-radix-popper-content-wrapper],.cdk-overlay-pane')].filter(e => visible(e) && e.getAttribute('data-state') !== 'closed');
    // Logical state: background tabs never finish exit animations, so closed menus may linger in the DOM.
    const isOpen = t => t.hasAttribute('aria-expanded') ? t.getAttribute('aria-expanded') === 'true' : menus().length > 0;
    const ptr = el => { const o = { bubbles:true, cancelable:true, pointerId:1, pointerType:'mouse', button:0 }; el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new MouseEvent('mousedown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)); el.dispatchEvent(new MouseEvent('mouseup', o)); };
    const open = async t => {
      t.focus(); t.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowDown', code:'ArrowDown', bubbles:true, cancelable:true })); await sleep(400);
      if (!isOpen(t)) { ptr(t); await sleep(300); if (!isOpen(t)) t.click(); }
      await sleep(800);
    };
    const itemsOf = () => { const out = []; for (const m of menus()) { const xs = [...m.querySelectorAll('[role=menuitem],[role=menuitemradio],[role=menuitemcheckbox],[role=option]')].filter(visible);
      if (xs.length) for (const e of xs) out.push({ el:e, label:(e.innerText || '').trim(), checked:e.getAttribute('aria-checked') === 'true' || e.getAttribute('aria-selected') === 'true' });
      else { const bs = [...m.querySelectorAll('button')].filter(visible); if (bs.length) for (const e of bs) out.push({ el:e, label:(e.innerText || '').trim(), checked:e.getAttribute('aria-checked') === 'true' || e.getAttribute('aria-selected') === 'true' || e.getAttribute('data-state') === 'checked' });
      else for (const line of (m.innerText || '').split('\\n')) if (line.trim()) out.push({ el:null, label:line.trim(), checked:false }); } } return out; };
    const subRx = (p.efforts || []).map(x => new RegExp(x, 'i')); const openSub = async () => { const more = [...document.querySelectorAll('[role^=menuitem]')].find(e => { if (!visible(e)) return false; const tx = (e.innerText || '').trim(); return (p.submenuText && tx.startsWith(p.submenuText)) || (p.effortSubmenu && subRx.some(r => r.test(tx.split('\\n')[0].trim()))); }); if (!more) return; const n0 = menus().length; more.focus(); more.dispatchEvent(new PointerEvent('pointermove', { bubbles:true })); more.dispatchEvent(new MouseEvent('mouseover', { bubbles:true })); more.focus(); more.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowRight', code:'ArrowRight', bubbles:true, cancelable:true })); await sleep(900); if (p.effortSubmenu && menus().length <= n0) { ptr(more); more.click(); await sleep(900); } };
    const close = async () => { const t = trigger(); const open = () => t ? isOpen(t) : menus().length > 0;
      for (let i = 0; i < 2 && open(); i++) { for (const e of [document.activeElement, document.body, document]) e?.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', code:'Escape', bubbles:true, cancelable:true })); await sleep(250); }
      if (t && open()) { ptr(t); await sleep(400); } if (t && open()) { t.click(); await sleep(400); } return !open(); };
    const trigger = () => document.querySelector(p.triggerSelector);
    const openEffortMenu = async () => { const em = p.effortMenu; if (!em) return false; const it = [...document.querySelectorAll('[role^=menuitem],button')].find(e => visible(e) && (e.innerText || '').trim().split('\\n')[0].trim().toLowerCase() === em.text.toLowerCase()); if (!it) return false; const n0 = menus().length;
      it.focus(); it.dispatchEvent(new PointerEvent('pointermove', { bubbles:true })); it.dispatchEvent(new MouseEvent('mouseover', { bubbles:true })); it.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowRight', code:'ArrowRight', bubbles:true, cancelable:true })); await sleep(900);
```

_First 80 of 212 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
