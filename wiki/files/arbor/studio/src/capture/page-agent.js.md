# File: studio/src/capture/page-agent.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/page-agent.js |
| Language | JavaScript |
| Kind | source |
| Size | 21540 B |
| Lines | 290 |
| Hash | b7b98c064f15 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| cfg | const | 7 | no | const cfg = Object.assign({ flushMs: 100, maxBlockTextBytes: 262144, ignoreTags: [&#39;SCRIPT&#39;, &#39;STYLE&#39;, &#39;NOSCRIPT&#39;, &#39;TEMPLATE&#39;] }, CONFIG \|\| {}); |
| ignore | const | 8 | no | const ignore = new Set(cfg.ignoreTags); |
| ids | const | 9 | no | const ids = new WeakMap(); |
| nodes | const | 10 | no | const nodes = new Map(); |
| nextId | variable | 11 | no | let nextId = 1; |
| idOf | function | 12 | no | const idOf = (el) =&gt; { let i = ids.get(el); if (!i) { i = nextId++; ids.set(el, i); nodes.set(i, new WeakRef(el)); } return i; }; |
| send | function | 13 | no | const send = (msg) =&gt; { try { globalThis[BINDING](JSON.stringify(msg)); } catch (e) { /* binding gone: detached */ } }; |
| BLOCK | const | 15 | no | const BLOCK = new Set([&#39;P&#39;, &#39;LI&#39;, &#39;PRE&#39;, &#39;TD&#39;, &#39;TH&#39;, &#39;H1&#39;, &#39;H2&#39;, &#39;H3&#39;, &#39;H4&#39;, &#39;H5&#39;, &#39;H6&#39;, &#39;BLOCKQUOTE&#39;, &#39;ARTICLE&#39;, &#39;SECTION&#39;, &#39;TR&#39;, &#39;TABLE&#39;, &#39;UL&#39;, &#39;OL&#39;, &#39;FIGURE&#39;, &#39;DD&#39;, &#39;DT&#39;, &#39;BUTTON&#39;, &#39;A&#39;, &#39;CODE&#39;, &#39;D… |
| sigOf | function | 16 | no | const sigOf = (el) =&gt; { |
| cls | const | 18 | no | const cls = (typeof el.className === &#39;string&#39; ? el.className : &#39;&#39;).trim().split(/\\s+/).filter((c) =&gt; c &amp;&amp; !/\\d{3,}/.test(c)).slice(0, 2).join(&#39;.&#39;); |
| role | const | 19 | no | const role = el.getAttribute(&#39;role&#39;); |
| attrs | const | 20 | no | const attrs = [...el.attributes].filter((a) =&gt; a.name.startsWith(&#39;data-&#39;) &amp;&amp; a.value.length &lt; 40 &amp;&amp; !/\\d{4,}\|[0-9a-f]{8}-/.test(a.value)).slice(0, 2).map((a) =&gt; `${a.name}=${a.value}`); |
| pathOf | function | 23 | no | const pathOf = (el, depth = 6) =&gt; { const out = []; for (let n = el; n &amp;&amp; n.nodeType === 1 &amp;&amp; out.length &lt; depth; n = n.parentElement) out.unshift(sigOf(n)); return out.join(&#39; &gt; &#39;); }; |
| blockOf | function | 24 | no | const blockOf = (node) =&gt; { |
| el | variable | 25 | no | let el = node &amp;&amp; node.nodeType === 1 ? node : node &amp;&amp; node.parentElement; |
| textOf | function | 29 | no | const textOf = (el) =&gt; { |
| t | const | 30 | no | const t = el.textContent \|\| &#39;&#39;; |
| dirty | variable | 36 | no | let dirty = new Map(); |
| removed | variable | 37 | no | let removed = []; |
| mark | function | 38 | no | const mark = (node) =&gt; { |
| b | const | 39 | no | const b = blockOf(node); |
| mo | const | 43 | no | const mo = new MutationObserver((records) =&gt; { for (const r of records) { if (r.type === &#39;characterData&#39;) mark(r.target); else if (r.type === &#39;childList&#39;) { if (r.target.nodeType === 1 &amp;&amp; ignore.has(… |
| flush | function | 53 | no | const flush = () =&gt; { |
| items | const | 55 | no | const items = []; |
| els | const | 57 | no | const els = [...dirty.keys()].filter((el) =&gt; el.isConnected); |
| set | const | 58 | no | const set = new Set(els); |
| p | variable | 60 | no | let p = el.parentElement, nested = false; |
| t | const | 63 | no | const t = textOf(el); |
| describe | function | 73 | no | const describe = (el) =&gt; { |
| label | const | 75 | no | const label = (el.getAttribute(&#39;aria-label&#39;) \|\| el.getAttribute(&#39;title&#39;) \|\| (el.innerText \|\| &#39;&#39;).trim()).slice(0, 80); |
| act | function | 78 | no | const act = (kind, el, extra) =&gt; send(Object.assign({ type: &#39;action&#39;, kind, url: location.href, target: describe(el) }, extra \|\| {})); |
| opts | const | 79 | no | const opts = { capture: true, passive: true }; |
| inputTimer | variable | 83 | no | let inputTimer = null; |
| scrollTimer | variable | 85 | no | let scrollTimer = null; |
| el | const | 88 | no | const el = e.target === document ? document.scrollingElement : e.target; |
| visibleText | function | 95 | no | const visibleText = (el) =&gt; (el.innerText \|\| el.textContent \|\| &#39;&#39;).trim(); |
| inspect | function | 96 | no | function inspect() { |
| proposals | const | 97 | no | const proposals = []; |
| root | const | 98 | no | const root = document.querySelector(&#39;main&#39;) \|\| document.body; |
| all | const | 100 | no | const all = root.querySelectorAll(&#39;*&#39;); |
| seen | const | 101 | no | const seen = new Set(); |
| groups | const | 104 | no | const groups = new Map(); |
| key | const | 108 | no | const key = idOf(parent) + &#39;\|&#39; + s; |
| sample | const | 110 | no | const sample = items.slice(0, 5); |
| fieldCounts | const | 111 | no | const fieldCounts = new Map(); |
| leafs | const | 113 | no | const leafs = it.querySelectorAll(&#39;*&#39;); |
| local | const | 114 | no | const local = new Set(); |
| fields | const | 123 | no | const fields = [...fieldCounts].filter(([, n]) =&gt; n &gt;= Math.ceil(sample.length * 0.6)).map(([f, n]) =&gt; ({ kind: f.split(&#39;:&#39;)[0], sig: f.slice(f.indexOf(&#39;:&#39;) + 1), presence: n / sample.length })); |
| headers | const | 129 | no | const headers = [...t.querySelectorAll(&#39;thead th, tr:first-child th&#39;)].map((h) =&gt; visibleText(h).slice(0, 60)); |
| pres | const | 132 | no | const pres = root.querySelectorAll(&#39;pre&#39;); |
| heads | const | 134 | no | const heads = root.querySelectorAll(&#39;h1,h2,h3,h4,h5,h6&#39;); |
| links | const | 136 | no | const links = [...root.querySelectorAll(&#39;a[href]&#39;)].filter((a) =&gt; /^https?:/.test(a.href)); |
| media | const | 138 | no | const media = [...root.querySelectorAll(&#39;img, video, audio, a[download]&#39;)].concat([...root.querySelectorAll(&#39;a[href]&#39;)].filter((a) =&gt; FILE_EXT.test(a.getAttribute(&#39;href&#39;) \|\| &#39;&#39;))); |
| forms | const | 140 | no | const forms = root.querySelectorAll(&#39;form, textarea, input:not([type=hidden]), select, [contenteditable=&quot;true&quot;]&#39;); |
| busy | const | 142 | no | const busy = document.querySelectorAll(&#39;[aria-busy=&quot;true&quot;], [aria-live]&#39;); |
| tt | const | 144 | no | const tt = turns(); |
| FILE_EXT | const | 150 | no | const FILE_EXT = /\\.(pdf\|zip\|csv\|xlsx?\|docx?\|pptx?\|txt\|json\|md\|png\|jpe?g\|gif\|mp3\|mp4\|wav\|tar\|gz)(\\?\|#\|$)/i; |
| inlines | function | 152 | no | function inlines(el) { |
| out | const | 153 | no | const out = []; |
| walk | function | 154 | no | const walk = (n) =&gt; { |
| tag | const | 158 | no | const tag = c.tagName; |
| texOf | function | 171 | no | const texOf = (el) =&gt; (el.querySelector(&#39;annotation[encoding=&quot;application/x-tex&quot;]&#39;)?.textContent \|\| el.getAttribute(&#39;data-tex&#39;) \|\| el.textContent \|\| &#39;&#39;).trim(); |
| cellText | function | 172 | no | const cellText = (c) =&gt; (c.innerText \|\| c.textContent \|\| &#39;&#39;).trim(); |
| blocks | function | 174 | no | function blocks(root, depth = 0) { |
| out | const | 175 | no | const out = []; |
| para | variable | 177 | no | let para = null; |
| flushPara | function | 178 | no | const flushPara = () =&gt; { if (para &amp;&amp; para.text.trim()) out.push(para); para = null; }; |
| tag | const | 182 | no | const tag = n.tagName; |
| id | const | 183 | no | const id = idOf(n); |
| head | const | 194 | no | const head = [...n.querySelectorAll(&#39;thead th&#39;)].map(cellText); |
| rows | const | 195 | no | const rows = [...n.querySelectorAll(&#39;tbody tr, tr&#39;)].filter((r) =&gt; !r.closest(&#39;thead&#39;)).map((r) =&gt; [...r.children].map(cellText)); |
| headers | const | 196 | no | const headers = head.length ? head : (rows.length &amp;&amp; n.querySelector(&#39;tr th&#39;) ? rows.shift() : []); |
| ROLE_WORDS | const | 220 | no | const ROLE_WORDS = new Set([&#39;user&#39;, &#39;assistant&#39;, &#39;human&#39;, &#39;ai&#39;, &#39;model&#39;, &#39;bot&#39;, &#39;system&#39;, &#39;tool&#39;]); |
| SKIP_ATTR | const | 221 | no | const SKIP_ATTR = new Set([&#39;class&#39;, &#39;id&#39;, &#39;style&#39;, &#39;href&#39;, &#39;src&#39;, &#39;type&#39;, &#39;name&#39;, &#39;value&#39;, &#39;placeholder&#39;, &#39;aria-label&#39;, &#39;title&#39;, &#39;alt&#39;]); |
| turns | function | 223 | no | function turns() { |
| cands | const | 224 | no | const cands = []; |
| v | const | 229 | no | const v = a.value.trim().toLowerCase(); |
| set | const | 236 | no | const set = new Set(cands.map((c) =&gt; c.el)); |
| outer | const | 237 | no | const outer = cands.filter((c) =&gt; { for (let p = c.el.parentElement; p; p = p.parentElement) if (set.has(p) &amp;&amp; cands.find((x) =&gt; x.el === p &amp;&amp; x.attr === c.attr)) return false; return true; }); |
| byAttr | const | 239 | no | const byAttr = new Map(); |
| eligible | const | 241 | no | const eligible = [...byAttr.entries()].filter(([, g]) =&gt; new Set(g.map((c) =&gt; c.role)).size &gt;= 2 \|\| g.length &gt;= 2); |
| scoreText | function | 243 | no | const scoreText = (el) =&gt; { |
| inner | const | 244 | no | const inner = (el.innerText \|\| &#39;&#39;).trim(); |
| hidden | const | 246 | no | const hidden = el.hidden === true \|\| el.getAttribute(&#39;aria-hidden&#39;) === &#39;true&#39;; |
| st | const | 249 | no | const st = new Map(outer.map((c) =&gt; [c, scoreText(c.el)])); |
| isSubstantive | function | 250 | no | const isSubstantive = (s) =&gt; s.length &gt;= 20 \|\| s.split(/\\s+/).filter(Boolean).length &gt;= 4; |
| norm | function | 251 | no | const norm = (s) =&gt; s.replace(/\\s+/g, &#39; &#39;).trim().toLowerCase(); |
| scored | const | 252 | no | const scored = eligible.map(([attr, g]) =&gt; { const lens = g.map((c) =&gt; st.get(c).length).sort((a, b) =&gt; a - b); return { attr, g, roles: new Set(g.map((c) =&gt; c.role)).size, |
| lens | const | 253 | no | const lens = g.map((c) =&gt; st.get(c).length).sort((a, b) =&gt; a - b); |
| best | variable | 263 | no | let best; |
| g | const | 267 | no | const g = scored[0].g; |
| keep | const | 269 | no | const keep = g.filter((c) =&gt; !(st.get(c).length &lt; 3 &amp;&amp; g.some((o) =&gt; o !== c &amp;&amp; o.role !== c.role &amp;&amp; norm(st.get(o)) === norm(st.get(c))))); |
| idAttr | const | 276 | no | const idAttr = [...c.el.attributes].find((a) =&gt; /(^\|-)(message\|turn\|item)?-?id$/.test(a.name) &amp;&amp; a.name !== &#39;id&#39;); |
| text | const | 277 | no | const text = (c.el.innerText \|\| c.el.textContent \|\| &#39;&#39;).trim(); |
| snapshot | function | 282 | no | function snapshot() { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Runs inside an ISOLATED world of the observed page (separate JS globals, shared DOM).
// Strictly observational: MutationObserver + passive capture-phase listeners. It never writes to
// the DOM, never patches page globals, and never reads input values (only their length).
// Results leave through a CDP binding that exists only in this isolated world.
(function aionCaptureAgent(BINDING, CONFIG) {
  if (globalThis.__aionCapture && globalThis.__aionCapture.version) return 'already';
  const cfg = Object.assign({ flushMs: 100, maxBlockTextBytes: 262144, ignoreTags: ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'] }, CONFIG || {});
  const ignore = new Set(cfg.ignoreTags);
  const ids = new WeakMap();
  const nodes = new Map();
  let nextId = 1;
  const idOf = (el) => { let i = ids.get(el); if (!i) { i = nextId++; ids.set(el, i); nodes.set(i, new WeakRef(el)); } return i; };
  const send = (msg) => { try { globalThis[BINDING](JSON.stringify(msg)); } catch (e) { /* binding gone: detached */ } };

  const BLOCK = new Set(['P', 'LI', 'PRE', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'ARTICLE', 'SECTION', 'TR', 'TABLE', 'UL', 'OL', 'FIGURE', 'DD', 'DT', 'BUTTON', 'A', 'CODE', 'DIV', 'SPAN', 'IMG', 'FORM', 'MAIN']);
  const sigOf = (el) => {
    if (!el || el.nodeType !== 1) return '';
    const cls = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter((c) => c && !/\d{3,}/.test(c)).slice(0, 2).join('.');
    const role = el.getAttribute('role');
    const attrs = [...el.attributes].filter((a) => a.name.startsWith('data-') && a.value.length < 40 && !/\d{4,}|[0-9a-f]{8}-/.test(a.value)).slice(0, 2).map((a) => `${a.name}=${a.value}`);
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (role ? `[role=${role}]` : '') + attrs.map((a) => `[${a}]`).join('');
  };
  const pathOf = (el, depth = 6) => { const out = []; for (let n = el; n && n.nodeType === 1 && out.length < depth; n = n.parentElement) out.unshift(sigOf(n)); return out.join(' > '); };
  const blockOf = (node) => {
    let el = node && node.nodeType === 1 ? node : node && node.parentElement;
    while (el && !BLOCK.has(el.tagName)) el = el.parentElement;
    return el;
  };
  const textOf = (el) => {
    const t = el.textContent || '';
    if (t.length > cfg.maxBlockTextBytes) return { text: t.slice(0, cfg.maxBlockTextBytes), truncated: t.length };
    return { text: t };
  };

  // ---- mutations -------------------------------------------------------------------------
  let dirty = new Map();
  let removed = [];
  const mark = (node) => {
    const b = blockOf(node);
    if (!b || ignore.has(b.tagName)) return;
    dirty.set(b, true);
  };
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') mark(r.target);
      else if (r.type === 'childList') {
        if (r.target.nodeType === 1 && ignore.has(r.target.tagName)) continue;
        mark(r.target);
        for (const n of r.removedNodes) if (n.nodeType === 1 && ids.has(n)) removed.push(ids.get(n));
      } else if (r.type === 'attributes') mark(r.target);
    }
  });
  const flush = () => {
    if (!dirty.size && !removed.length) return;
    const items = [];
    // Report the outermost dirty blocks only, to avoid nested duplicates.
    const els = [...dirty.keys()].filter((el) => el.isConnected);
    const set = new Set(els);
    for (const el of els) {
      let p = el.parentElement, nested = false;
      while (p) { if (set.has(p)) { nested = true; break; } p = p.parentElement; }
      if (nested) continue;
      const t = textOf(el);
      items.push({ op: 'changed', id: idOf(el), tag: el.tagName, sig: sigOf(el), path: pathOf(el), text: t.text, truncated: t.truncated, children: el.childElementCount, busy: el.closest('[aria-busy="true"]') ? true : undefined });
    }
    for (const id of removed) items.push({ op: 'removed', id });
    dirty = new Map(); removed = [];
    if (items.length) send({ type: 'dom.batch', url: location.href, items });
  };
  setInterval(flush, cfg.flushMs);

  // ---- user actions (learn by watching) -------------------------------------------------
  const describe = (el) => {
    if (!el || el.nodeType !== 1) return {};
    const label = (el.getAttribute('aria-label') || el.getAttribute('title') || (el.innerText || '').trim()).slice(0, 80);
    return { id: idOf(el), tag: el.tagName, sig: sigOf(el), path: pathOf(el, 4), label, role: el.getAttribute('role') || undefined };
  };
  const act = (kind, el, extra) => send(Object.assign({ type: 'action', kind, url: location.href, target: describe(el) }, extra || {}));
  const opts = { capture: true, passive: true };
  addEventListener('click', (e) => act('click', e.target.closest('a,button,[role=button],[role=tab],[role=menuitem],summary,label,input') || e.target), opts);
```

_First 80 of 291 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
