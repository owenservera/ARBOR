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
      if (menus().length <= n0) { ptr(it); it.click(); await sleep(900); } return true; };
    const readSlider = () => { if (!p.effortSlider) return null; const el = [...document.querySelectorAll(p.effortSlider)].find(visible); if (!el) return null;
      const menu = el.closest('[role=menu]') || document.body; const txt = (menu.innerText || '').replace(/\\s+/g, ' ');
      const m = txt.match(/([^,\\n]+?), (\\d+) (?:of|de) (\\d+)/); const now = Number(el.getAttribute('aria-valuenow'));
      let lb = m ? m[1].trim() : null; if (lb) { const w = lb.split(' '); if (w.length % 2 === 0 && w.slice(0, w.length / 2).join(' ') === w.slice(w.length / 2).join(' ')) lb = w.slice(0, w.length / 2).join(' '); }
      return { label: lb, index: m ? Number(m[2]) : (Number.isFinite(now) ? now + 1 : null), count: m ? Number(m[3]) : null, locked: /\\bLocked\\b|Usage limit reached|Bloqueado|Límite de uso alcanzado/i.test(txt) }; };`;

export function discoverExpression(profile) {
  return `(async () => { /* harness:models-discover */ ${helpers(profile)}
    const t = trigger(); if (!t) return { error:'MODEL_PICKER_MISSING' };
    const current = (t.innerText || t.getAttribute('aria-label') || '').trim();
    await open(t); if (!isOpen(t)) { await close(); return { error:'MODEL_PICKER_CLOSED', current }; }
    await openSub(); const items = itemsOf().map(({ label, checked }) => ({ label, checked })); const slider = readSlider();
    const closed = await close(); return { current, items, closed, slider };
  })()`;
}

export function selectExpression(profile, label) {
  return `(async () => { /* harness:models-select */ ${helpers(profile)}
    const want = ${JSON.stringify(String(label).toLowerCase())};
    const t = trigger(); if (!t) return { ok:false, error:'MODEL_PICKER_MISSING' };
    const match = () => itemsOf().find(i => i.el && i.label.split('\\n')[0].trim().toLowerCase() === want);
    await open(t); let hit = match(); if (!hit) { await openSub(); hit = match(); }
    if (!hit) { await close(); return { ok:false, error:'MODEL_NOT_IN_PICKER' }; }
    hit.el.click(); await sleep(900); const closed = await close(); return { ok:true, closed };
  })()`;
}

export function effortMenuExpression(profile, level) {
  return `(async () => { /* harness:effort-menu */ ${helpers(profile)}
    const want = ${JSON.stringify(String(level).toLowerCase())};
    const t = trigger(); if (!t) return { ok:false, error:'MODEL_PICKER_MISSING' };
    await open(t); if (!(await openEffortMenu())) { await close(); return { ok:false, error:'EFFORT_MENU_MISSING' }; }
    const hit = [...document.querySelectorAll('[role^=menuitem],[role=option],button')].filter(visible).find(e => (e.innerText || '').trim().split('\\n')[0].trim().toLowerCase() === want);
    if (!hit) { await close(); return { ok:false, error:'EFFORT_UNAVAILABLE' }; }
    hit.click(); await sleep(900); const closed = await close(); return { ok:true, closed };
  })()`;
}

// UI hygiene before typing: click configured dismiss buttons (e.g. cookie banners) and close any open menu. Never sends.
export function dismissExpression(profile) {
  return `(async () => { /* harness:dismiss */ ${helpers(profile)}
    const texts = ${JSON.stringify((profile?.preflight?.dismissButtonTexts || []).map(s => s.toLowerCase()))}; let clicked = 0;
    for (const b of [...document.querySelectorAll('button')].filter(visible)) if (texts.includes((b.innerText || '').trim().toLowerCase())) { b.click(); clicked++; await sleep(300); }
    const closed = p.triggerSelector ? await close() : true; return { clicked, closed };
  })()`;
}

export function sliderExpression(profile, steps) {
  return `(async () => { /* harness:effort-slider */ ${helpers(profile)}
    const t = trigger(); if (!t) return { ok:false, error:'MODEL_PICKER_MISSING' };
    await open(t); const el = [...document.querySelectorAll(p.effortSlider)].find(visible); if (!el) { await close(); return { ok:false, error:'EFFORT_SLIDER_MISSING' }; }
    el.focus(); const key = ${Number(steps)} >= 0 ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < Math.abs(${Number(steps)}); i++) { el.dispatchEvent(new KeyboardEvent('keydown', { key, code:key, bubbles:true, cancelable:true })); await sleep(400); }
    await sleep(600); const after = readSlider(); const closed = await close(); return { ok:true, after, closed };
  })()`;
}

export async function discoverModels(page, profile) {
  if (!profile?.models?.triggerSelector) return { error: 'MODELS_UNSUPPORTED', current: null, currentLabel: null, models: [] };
  const raw = await page.evaluate(discoverExpression(profile));
  if (raw?.error) return { error: raw.error, current: null, currentLabel: raw.current || null, models: [] };
  return { ...normalizeModels(profile, raw), ...(raw?.slider ? { slider: raw.slider } : {}) };
}

// Pure: requested effort -> entry in discovered.efforts. 'max' = the last (highest) option in menu order.
export function resolveEffort(entry, wanted) {
  const list = entry?.efforts || []; if (!wanted || !list.length) return null;
  if (/^(max|highest|high)$/i.test(wanted) && !list.some(e => e.id === slug(wanted))) return list[list.length - 1];
  return list.find(e => e.id === slug(wanted) || slug(e.label) === slug(wanted)) ?? null;
}

// Waits (bounded, read-only) for the picker, optionally selects `wanted`, then verifies by re-reading.
// Returns { ok, model, discovered, error }. Nothing is ever typed into the composer here.
export async function prepareModel({ page, profile, wanted = null, effort = null, readyTimeoutMs = 15000, pollMs = 250 }) {
  if (!profile?.models?.triggerSelector) return wanted ? { ok: false, error: 'MODELS_UNSUPPORTED', model: null } : { ok: true, model: null, discovered: null };
  const sel = JSON.stringify(profile.models.triggerSelector); const end = Date.now() + readyTimeoutMs;
  while (!(await page.evaluate(`!!document.querySelector(${sel})`).catch(() => false))) { if (Date.now() >= end) return wanted ? { ok: false, error: 'MODEL_PICKER_MISSING', model: null } : { ok: true, model: null, discovered: null }; await new Promise(r => setTimeout(r, pollMs)); }
  await page.evaluate(dismissExpression(profile)).catch(() => null);
  let discovered = await discoverModels(page, profile);
  if (!wanted) return { ok: true, model: discovered.current ? { id: discovered.current, label: discovered.currentLabel } : null, discovered };
  const target = resolveModel(discovered, wanted);
  if (!target) return { ok: false, error: 'MODEL_UNAVAILABLE', model: null, discovered };
  if (discovered.current !== target.id) {
    const r = await page.evaluate(selectExpression(profile, target.label));
    if (!r?.ok) return { ok: false, error: r?.error || 'MODEL_SELECT_FAILED', model: null, discovered };
    discovered = await discoverModels(page, profile);
  }
  if (discovered.current !== target.id) return { ok: false, error: 'MODEL_SELECT_UNVERIFIED', model: null, discovered };
  const model = { id: target.id, label: target.label };
  if (effort) {
    // Effort (e.g. Thinking level) lives in the same picker; select it, then verify it is the checked option.
    if (discovered.slider) {
      const sl = discovered.slider; const want = /^(max|highest|high)$/i.test(effort) ? sl.count : Number(effort);
      if (!sl.count || !Number.isInteger(want) || want < 1 || want > sl.count) return { ok: false, error: 'EFFORT_UNAVAILABLE', model: null, discovered };
      if (sl.index !== want) {
        if (sl.locked) return { ok: false, error: 'EFFORT_LOCKED', model: null, discovered };
        const r = await page.evaluate(sliderExpression(profile, want - sl.index));
        if (!r?.ok) return { ok: false, error: r?.error || 'EFFORT_SELECT_FAILED', model: null, discovered };
        discovered = await discoverModels(page, profile);
        if (discovered.slider?.index !== want) return { ok: false, error: 'EFFORT_SELECT_UNVERIFIED', model: null, discovered };
      }
      model.effort = discovered.slider.label || String(want);
      return { ok: true, model, discovered };
    }
    let e = resolveEffort(discovered, effort);
    if (!e) return { ok: false, error: 'EFFORT_UNAVAILABLE', model: null, discovered };
    if (!e.current) {
      const r = await page.evaluate(discovered.effortMode === 'menu' ? effortMenuExpression(profile, e.label) : selectExpression(profile, e.label));
      if (!r?.ok) return { ok: false, error: r?.error || 'EFFORT_SELECT_FAILED', model: null, discovered };
      discovered = await discoverModels(page, profile); e = (discovered.efforts || []).find(x => x.id === e.id);
      if (!e?.current) return { ok: false, error: 'EFFORT_SELECT_UNVERIFIED', model: null, discovered };
    }
    model.effort = e.id;
  }
  await page.evaluate(dismissExpression(profile)).catch(() => null);
  return { ok: true, model, discovered };
}

// Small JSON registry of discovered models: { [provider]: { discoveredAt, current, currentLabel, models } }.
export function createModelRegistry({ file }) {
  const load = async () => { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return {}; } };
  return {
    load,
    async save(providerId, discovered, now = new Date().toISOString()) {
      if (!discovered || discovered.error || !discovered.models?.length) return load();
      const all = await load(); all[providerId] = { discoveredAt: now, current: discovered.current, currentLabel: discovered.currentLabel, models: discovered.models, ...(discovered.slider ? { slider: discovered.slider } : {}), ...(discovered.efforts ? { efforts: discovered.efforts } : {}) };
      await mkdir(dirname(file), { recursive: true }); const tmp = `${file}.${process.pid}.tmp`; await writeFile(tmp, JSON.stringify(all, null, 2)); await rename(tmp, file); return all;
    }
  };
}
