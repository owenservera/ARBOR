# File: apps/mobile-relay/control-phone.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/control-phone.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15439 B |
| Lines | 282 |
| Hash | 6773f4a122ec |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| byId | function | 10 | no | const byId = id =&gt; document.getElementById(id); |
| btn | const | 11 | no | const btn = byId(&#39;control-preview&#39;), input = byId(&#39;control-text&#39;), output = byId(&#39;control-result&#39;); |
| pack | variable | 12 | no | let pack = null; |
| viewEpoch | variable | 13 | no | let viewEpoch = 0; |
| control | const | 14 | no | const control = createControlClient({ transport }); |
| applying | variable | 15 | no | let applying = false; |
| el | function | 17 | no | function el(tag, props = {}, ...children) { |
| node | const | 18 | no | const node = document.createElement(tag); |
| live | const | 27 | no | const live = el(&#39;div&#39;, { id: &#39;control-live&#39;, &#39;aria-live&#39;: &#39;polite&#39;, style: &#39;margin:4px 0 8px;font-size:14px;line-height:1.5&#39; }); |
| show | function | 29 | no | function show(...nodes) { if (!output) return; output.replaceChildren(...nodes.map(n =&gt; n instanceof Node ? n : document.createTextNode(String(n)))); } |
| chip | function | 30 | no | const chip = (text, title) =&gt; el(&#39;span&#39;, { title: title ?? &#39;&#39;, style: &#39;display:inline-block;padding:1px 7px;margin:2px;border-radius:9px;border:1px solid currentColor;opacity:.85;font-size:12px&#39; }, t… |
| action | function | 31 | no | const action = (label, fn, primary = false) =&gt; el(&#39;button&#39;, { type: &#39;button&#39;, class: primary ? &#39;btn pri&#39; : &#39;btn&#39;, style: &#39;margin:6px 6px 0 0&#39;, onclick: fn }, label); |
| directReady | function | 33 | no | const directReady = () =&gt; control.directReady(); |
| call | function | 34 | no | const call = (path, body) =&gt; control.call(path, body); |
| loadPack | function | 36 | no | async function loadPack() { |
| epoch | const | 37 | no | const epoch = viewEpoch; |
| result | const | 40 | no | const result = await call(&#39;language&#39;); |
| actions | const | 46 | no | const actions = pack.catalog.actions.filter(a =&gt; [&#39;source_wired&#39;,&#39;verified&#39;].includes(a.readiness) &amp;&amp; a.examples?.length).slice(0, 8); |
| renderLive | function | 56 | no | function renderLive() { |
| text | const | 57 | no | const text = input?.value ?? &#39;&#39;; |
| m | const | 59 | no | const m = interpretControl(text, { catalog: pack.catalog, world: pack.world }); |
| f | const | 60 | no | const f = m.feedback; |
| tokens | const | 61 | no | const tokens = el(&#39;div&#39;, {}, ...f.tokens.map(t =&gt; chip(t.text, [t.kind, t.family, t.role].filter(Boolean).join(&#39; · &#39;)))); |
| lines | const | 62 | no | const lines = [tokens]; |
| a | const | 64 | no | const a = m.candidate &amp;&amp; pack.catalog.actions.find(x =&gt; x.id === m.candidate.actionId); |
| sugg | const | 70 | no | const sugg = f.suggestions.filter(s =&gt; [&#39;correction&#39;, &#39;symbol&#39;, &#39;example&#39;].includes(s.kind)).slice(0, 3); |
| renderResult | function | 76 | no | function renderResult(plan) { |
| renderReceipt | function | 93 | no | function renderReceipt(r) { |
| nodes | const | 94 | no | const nodes = [el(&#39;div&#39;, {}, (r.status === &#39;applied&#39; ? &#39;✓ &#39; : &#39;✗ &#39;) + r.actionId + &#39; — &#39; + r.status + (r.replayed ? &#39; (already applied)&#39; : &#39;&#39;))]; |
| approve | function | 101 | no | async function approve(plan) { |
| epoch | const | 103 | no | const epoch = viewEpoch; |
| receipt | const | 107 | no | const receipt = await control.execute(plan); |
| submit | function | 114 | no | async function submit(body) { |
| epoch | const | 116 | no | const epoch = viewEpoch; |
| plan | const | 124 | no | const plan = await call(&#39;plan&#39;, body); |
| preview | function | 132 | no | function preview() { |
| text | const | 133 | no | const text = input?.value.trim() ?? &#39;&#39;; |
| activity | const | 139 | no | const activity = byId(&#39;control-activity&#39;); |
| ownerPreview | const | 140 | no | const ownerPreview = new URLSearchParams(location.search).get(&#39;host-preview&#39;) === &#39;1&#39; |
| refreshControlActivity | function | 142 | no | async function refreshControlActivity() { |
| epoch | const | 144 | no | const epoch = viewEpoch; |
| response | const | 153 | no | const response = await call(&#39;recent&#39;); |
| entries | const | 155 | no | const entries = Array.isArray(response.items) ? response.items.slice(0, 12) : []; |
| list | const | 160 | no | const list = el(&#39;ul&#39;, { class: &#39;ux-list&#39; }); |
| line | const | 163 | no | const line = el(&#39;li&#39;, { class: &#39;ux-item&#39; }); |
| memoryRoot | const | 207 | no | const memoryRoot = byId(&#39;v-control&#39;); |
| section | const | 209 | no | const section = el(&#39;section&#39;, { style: &#39;border-top:1px solid var(--bd);margin-top:26px;padding-top:16px&#39; }); |
| heading | const | 210 | no | const heading = el(&#39;h2&#39;, {}, &#39;What did I browse today?&#39;); |
| explanation | const | 211 | no | const explanation = el(&#39;p&#39;, { class: &#39;muted&#39; }, &#39;Private observed locations from your PC. Direct paired connection only.&#39;); |
| site | const | 212 | no | const site = el(&#39;input&#39;, { placeholder: &#39;Filter by website, e.g. example.org&#39;, maxlength: &#39;253&#39;, &#39;aria-label&#39;: &#39;Website filter&#39;, autocomplete: &#39;off&#39;, style: &#39;display:block;width:100%;margin:12px 0&#39; }… |
| refreshButton | const | 214 | no | const refreshButton = action(&#39;Refresh visits&#39;, () =&gt; refreshVisits()); |
| status | const | 215 | no | const status = el(&#39;p&#39;, { role: &#39;status&#39;, class: &#39;muted&#39; }, &#39;Connect directly to your PC to view private history.&#39;); |
| items | const | 216 | no | const items = el(&#39;div&#39;, { &#39;aria-live&#39;: &#39;polite&#39;, style: &#39;display:grid;gap:12px&#39; }); |
| older | const | 217 | no | const older = action(&#39;Older visits&#39;, () =&gt; { if (nextCursor) refreshVisits(true); }); |
| nextCursor | variable | 219 | no | let nextCursor = null; |
| historyEpoch | variable | 220 | no | let historyEpoch = 0; |
| refreshVisits | function | 226 | no | async function refreshVisits(append = false) { |
| epoch | const | 227 | no | const epoch = historyEpoch; |
| device | const | 235 | no | const device = transport.deviceHeaders?.(); |
| params | const | 242 | no | const params = new URLSearchParams({ limit: &#39;20&#39; }); |
| r | const | 245 | no | const r = await fetch(&#39;api/memory/recent?&#39; + params, { credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, headers: device }); |
| data | const | 247 | no | const data = await r.json().catch(() =&gt; ({})); |
| row | const | 253 | no | const row = el(&#39;div&#39;, { style: &#39;padding:10px;border:1px solid var(--bd);border-radius:6px;overflow-wrap:anywhere&#39; }); |
| link | const | 254 | no | const link = el(&#39;a&#39;, { href: visit.url, target: &#39;_blank&#39;, rel: &#39;noopener noreferrer&#39; }, visit.site + &#39; · &#39; + new Date(visit.observedAt).toLocaleString()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./control-language.mjs | import | 6 | [apps/mobile-relay/control-language.mjs](./control-language.mjs.md) |
| ./transport.mjs | import | 7 | [apps/mobile-relay/transport.mjs](./transport.mjs.md) |
| ./control-client.mjs | import | 8 | [apps/mobile-relay/control-client.mjs](./control-client.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Direct-mobile Universal Text Control (UTC04).
// Keystroke feedback runs LOCALLY with the same vendored NCLL bytes as the Host (no network per
// keystroke); the Host remains the authoritative parser and the only executor. Execution needs
// an explicit "Approve & apply" tap bound to the exact plan digest the PC returned.
// Direct connection only: the cloud PWA never receives private configuration requests.
import { interpretControl } from './control-language.mjs';
import { transport } from './transport.mjs';
import { createControlClient } from './control-client.mjs';

const byId = id => document.getElementById(id);
const btn = byId('control-preview'), input = byId('control-text'), output = byId('control-result');
let pack = null;
let viewEpoch = 0;
const control = createControlClient({ transport });
let applying = false;

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'style') node.setAttribute('style', v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}
const live = el('div', { id: 'control-live', 'aria-live': 'polite', style: 'margin:4px 0 8px;font-size:14px;line-height:1.5' });
input?.insertAdjacentElement('afterend', live);
function show(...nodes) { if (!output) return; output.replaceChildren(...nodes.map(n => n instanceof Node ? n : document.createTextNode(String(n)))); }
const chip = (text, title) => el('span', { title: title ?? '', style: 'display:inline-block;padding:1px 7px;margin:2px;border-radius:9px;border:1px solid currentColor;opacity:.85;font-size:12px' }, text);
const action = (label, fn, primary = false) => el('button', { type: 'button', class: primary ? 'btn pri' : 'btn', style: 'margin:6px 6px 0 0', onclick: fn }, label);

const directReady = () => control.directReady();
const call = (path, body) => control.call(path, body);

async function loadPack() {
  const epoch = viewEpoch;
  if (pack || !(await directReady()) || epoch !== viewEpoch) return pack;
  try {
    const result = await call('language');
    if (epoch !== viewEpoch) return null;
    pack = result;
  } catch { if (epoch === viewEpoch) pack = null; }
  if (epoch !== viewEpoch) return null;
  if (pack?.catalog?.actions && output && !input?.value.trim()) {
    const actions = pack.catalog.actions.filter(a => ['source_wired','verified'].includes(a.readiness) && a.examples?.length).slice(0, 8);
    if (actions.length) show(el('div', {}, 'Available commands · '+
      pack.catalog.actions.filter(a=>['source_wired','verified'].includes(a.readiness)).length+
      ' of '+pack.catalog.actions.length+' cataloged · not all VIVIM features'), ...actions.map(a =>
      action(a.examples[0], () => { input.value = a.examples[0]; renderLive(); input.focus(); })));
  }
  return pack;
}

// ---- live, local interpretation (no network) ----
function renderLive() {
  const text = input?.value ?? '';
  if (!pack || !text.trim()) { live.replaceChildren(); return; }
  const m = interpretControl(text, { catalog: pack.catalog, world: pack.world });
  const f = m.feedback;
  const tokens = el('div', {}, ...f.tokens.map(t => chip(t.text, [t.kind, t.family, t.role].filter(Boolean).join(' · '))));
  const lines = [tokens];
  if (f.canonical && m.outcome !== 'interpretation_required') lines.push(el('div', { style: 'font-family:monospace;opacity:.8' }, f.canonical));
  const a = m.candidate && pack.catalog.actions.find(x => x.id === m.candidate.actionId);
  if (m.outcome === 'candidate' && a) lines.push(el('div', {}, '→ ' + a.title + ' ', chip(a.risk), ...Object.entries(m.candidate.args).map(([k, v]) => chip(k + ': ' + v))));
  else if (m.outcome === 'clarification_required') lines.push(el('div', {}, '? ' + m.question));
  else if (m.outcome === 'incomplete') lines.push(el('div', {}, '… ' + (m.question ?? 'More detail needed')));
  else if (m.outcome === 'interpretation_required') lines.push(el('div', { style: 'opacity:.7' }, 'Not a known command yet'));
  if (m.ignoredModifiers) lines.push(el('div', { style: 'opacity:.7' }, '“!” does not skip approval'));
  const sugg = f.suggestions.filter(s => ['correction', 'symbol', 'example'].includes(s.kind)).slice(0, 3);
  if (sugg.length && m.outcome !== 'candidate') lines.push(el('div', {}, ...sugg.map(s => action(s.display, () => { input.value = s.text; renderLive(); }))));
  live.replaceChildren(...lines);
}

// ---- authoritative plan / approve / receipt (Host) ----
function renderResult(plan) {
  if (plan.outcome === 'done') { show(el('div', {}, plan.title + ' ✓'), el('pre', { style: 'white-space:pre-wrap' }, JSON.stringify(plan.result, null, 2))); return; }
  if (plan.outcome === 'clarification_required') {
    show(el('div', {}, plan.question), ...(plan.choiceDetails ?? []).map(c => action(c.title + (c.readiness === 'source_wired' || c.readiness === 'verified' ? '' : ' (unavailable)'),
      () => submit({ actionId: c.actionId, args: {} }))), el('div', { style: 'opacity:.7' }, 'No action executed.'));
```

_First 80 of 283 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
