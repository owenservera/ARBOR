# File: studio/src/capture/chatgpt-chat-index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/chatgpt-chat-index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12746 B |
| Lines | 198 |
| Hash | d24159367ed6 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CHAT_INDEX_SOURCE | const | 9 | yes | export const CHAT_INDEX_SOURCE = &#39;page-visible-dom&#39;; |
| CHAT_INDEX_SCOPE | const | 10 | yes | export const CHAT_INDEX_SCOPE = &#39;currently-rendered-links&#39;; |
| CHATGPT_CANONICAL_ORIGIN | const | 11 | yes | export const CHATGPT_CANONICAL_ORIGIN = &#39;https://chatgpt.com&#39;; |
| CHAT_INDEX_LIMITS | const | 12 | yes | export const CHAT_INDEX_LIMITS = Object.freeze({ maxEntries: { min: 1, max: 500, default: 100 }, maxTitleChars: { min: 1, max: 300, default: 120 }, scanLimit: { min: 1, max: 2000, default: 500 }, }); |
| CHAT_INDEX_PAGE_ORIGIN_CODES | const | 18 | yes | export const CHAT_INDEX_PAGE_ORIGIN_CODES = Object.freeze([&#39;PAGE_ORIGIN_MISSING&#39;, &#39;PAGE_ORIGIN_MALFORMED&#39;, &#39;PAGE_ORIGIN_NON_HTTPS&#39;, &#39;PAGE_ORIGIN_FOREIGN&#39;, &#39;PAGE_ORIGIN_NONCANONICAL&#39;]); |
| CHAT_INDEX_SKIP_CODES | const | 22 | yes | export const CHAT_INDEX_SKIP_CODES = Object.freeze([&#39;HIDDEN_LINK&#39;, &#39;MALFORMED_LINK&#39;, &#39;NO_HREF&#39;, &#39;MALFORMED_URL&#39;, &#39;NON_HTTPS&#39;, &#39;CREDENTIALS_IN_URL&#39;, &#39;FOREIGN_HOST&#39;, &#39;CROSS_ORIGIN_LINK&#39;, &#39;ROOT_OR_HOME&#39;… |
| CHAT_INDEX_IDENTITY | const | 25 | yes | export const CHAT_INDEX_IDENTITY = Object.freeze({ state: &#39;candidate&#39;, reason: &#39;RENDERED_LINK_NOT_LIVE_BOUND&#39; }); |
| CHAT_INDEX_LIVE_BINDING | const | 26 | yes | export const CHAT_INDEX_LIVE_BINDING = Object.freeze({ state: &#39;not-established&#39;, reason: &#39;NO_M1_BINDING&#39; }); |
| CHAT_INDEX_LIMITATIONS | const | 27 | yes | export const CHAT_INDEX_LIMITATIONS = Object.freeze([ &#39;Rendered links only; not a complete account chat list (complete is always false).&#39;, &#39;No pagination or virtualization is observed; older or unren… |
| UUID | const | 36 | no | const UUID = &#39;[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}&#39;; |
| PROJECT_THREAD | const | 37 | no | const PROJECT_THREAD = new RegExp(`^/g/[^/]+/c/${UUID}/?$`, &#39;i&#39;); |
| LABEL | const | 38 | no | const LABEL = /^[a-z][a-z-]{0,39}$/; |
| HREF_CAP | const | 39 | no | const HREF_CAP = 600, TEXT_CAP = 2000, SELECTOR_CAP = 200; |
| fail | function | 41 | no | const fail = (code) =&gt; Object.assign(new Error(code), { code, status: 400 }); |
| safeCount | function | 42 | no | const safeCount = (value, fallback) =&gt; (Number.isSafeInteger(value) &amp;&amp; value &gt;= 0 ? value : fallback); |
| chatIndexOptions | function | 44 | no | function chatIndexOptions(options = {}) { |
| o | const | 45 | no | const o = options ?? {}; |
| pick | function | 46 | no | const pick = (value, spec) =&gt; (value === undefined ? spec.default : value); |
| maxEntries | const | 47 | no | const maxEntries = pick(o.maxEntries, CHAT_INDEX_LIMITS.maxEntries); |
| maxTitleChars | const | 48 | no | const maxTitleChars = pick(o.maxTitleChars, CHAT_INDEX_LIMITS.maxTitleChars); |
| scanLimit | const | 49 | no | const scanLimit = pick(o.scanLimit, CHAT_INDEX_LIMITS.scanLimit); |
| containers | const | 53 | no | const containers = o.containers === undefined ? [] : o.containers; |
| chatIndexExpression | function | 65 | yes | export function chatIndexExpression(options = {}) { |
| o | const | 66 | no | const o = chatIndexOptions(options); |
| selectors | const | 67 | no | const selectors = options?.anchorSelectors ?? [&#39;a[href]&#39;]; |
| ANCHORS | const | 71 | no | const ANCHORS = ${JSON.stringify(selectors)}, CONTAINERS = ${JSON.stringify(o.containers.map((c) =&gt; c.selector))}; |
| SCAN | const | 72 | no | const SCAN = ${o.scanLimit}, HREF_CAP = ${HREF_CAP}, TEXT_CAP = ${TEXT_CAP}; |
| seen | const | 73 | no | const seen = new Set(); |
| list | variable | 75 | no | let list = []; |
| all | const | 79 | no | const all = Array.from(seen); |
| slice | const | 80 | no | const slice = all.slice(0, SCAN); |
| visible | function | 81 | no | const visible = (el) =&gt; { try { const r = el.getBoundingClientRect(); return r.width &gt; 1 &amp;&amp; r.height &gt; 1; } catch (e) { return false; } }; |
| containerOf | function | 82 | no | const containerOf = (el) =&gt; { |
| links | const | 88 | no | const links = slice.map((el) =&gt; { const raw = el.getAttribute ? el.getAttribute(&#39;href&#39;) : null; const text = String(el.innerText ?? el.textContent ?? &#39;&#39;).replace(/\\\\s+/g, &#39; &#39;).trim(); return { href: … |
| raw | const | 89 | no | const raw = el.getAttribute ? el.getAttribute(&#39;href&#39;) : null; |
| text | const | 90 | no | const text = String(el.innerText ?? el.textContent ?? &#39;&#39;).replace(/\\\\s+/g, &#39; &#39;).trim(); |
| cleanTitle | function | 98 | no | function cleanTitle(raw, cap) { |
| text | const | 99 | no | const text = String(raw ?? &#39;&#39;).slice(0, TEXT_CAP) |
| chars | const | 102 | no | const chars = [...text]; |
| truncated | const | 103 | no | const truncated = chars.length &gt; cap; |
| pageOriginCode | function | 109 | yes | export function pageOriginCode(origin) { |
| url | variable | 113 | no | let url; |
| classify | function | 123 | no | function classify(href) { |
| url | variable | 125 | no | let url; |
| p | const | 130 | no | const p = url.pathname; |
| thread | const | 134 | no | const thread = parseThread(&#39;chatgpt&#39;, url.href); |
| containerState | function | 140 | no | function containerState(labels) { |
| known | const | 141 | no | const known = [...labels].filter((l) =&gt; l !== &#39;unknown&#39;); |
| normalizeChatIndex | function | 151 | yes | export function normalizeChatIndex(raw, options = {}) { |
| o | const | 152 | no | const o = chatIndexOptions(options); |
| skipped | const | 153 | no | const skipped = Object.fromEntries(CHAT_INDEX_SKIP_CODES.map((code) =&gt; [code, 0])); |
| limits | const | 154 | no | const limits = { maxEntries: o.maxEntries, maxTitleChars: o.maxTitleChars, scanLimit: o.scanLimit }; |
| base | const | 155 | no | const base = { source: CHAT_INDEX_SOURCE, scope: CHAT_INDEX_SCOPE, complete: false, candidatesOnly: true, pagination: &#39;not-observed&#39;, |
| rejected | function | 157 | no | const rejected = (code) =&gt; ({ ...base, invalidResult: true, code, entries: [], skipped, coverage: { renderedLinks: 0, scannedLinks: 0, truncatedScan: false, visibleThreadLinks: 0, uniqueThreads: 0, d… |
| originCode | const | 160 | no | const originCode = pageOriginCode(raw.origin); |
| renderedLinks | const | 163 | no | const renderedLinks = safeCount(raw.renderedLinks, raw.links.length); |
| links | const | 164 | no | const links = raw.links.slice(0, o.scanLimit); |
| truncatedScan | const | 165 | no | const truncatedScan = raw.truncatedScan === true \|\| raw.links.length &gt; links.length \|\| renderedLinks &gt; links.length; |
| order | const | 166 | no | const order = [], byKey = new Map(); |
| visibleThreadLinks | variable | 167 | no | let visibleThreadLinks = 0, titleTruncated = 0; |
| c | const | 171 | no | const c = classify(link.href); |
| title | const | 174 | no | const title = cleanTitle(link.text, o.maxTitleChars); |
| label | const | 176 | no | const label = Number.isSafeInteger(link.container) &amp;&amp; link.container &gt;= 0 &amp;&amp; link.container &lt; o.containers.length ? o.containers[link.container].label : &#39;unknown&#39;; |
| key | const | 177 | no | const key = `${CHATGPT_CANONICAL_ORIGIN}\|${c.thread.ref}`; |
| entry | variable | 178 | no | let entry = byKey.get(key); |
| returned | const | 188 | no | const returned = order.slice(0, o.maxEntries); |
| entries | const | 189 | no | const entries = returned.map((e) =&gt; ({ threadRef: e.threadRef, id: e.id, path: e.path, origin: e.origin, displayTitle: e.firstTitle ? { untrusted: true, text: e.firstTitle.text, truncated: e.firstTit… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./conversation-thread.mjs | import | 7 | [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/chatgpt-chat-index-reader.mjs](./chatgpt-chat-index-reader.mjs.md) | ./chatgpt-chat-index.mjs |
| [studio/src/studio/conversation-api.mjs](../studio/conversation-api.mjs.md) | ../capture/chatgpt-chat-index.mjs |
| [studio/src/studio/conversation-tools.mjs](../studio/conversation-tools.mjs.md) | ../capture/chatgpt-chat-index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Rendered ChatGPT chat-index foundation: an in-page observation expression plus a bounded,
// deterministic normaliser. Rendered links only: never a complete account list, never a click,
// scroll, search, focus, navigation or network request. The page origin is validated first and must be
// the canonical ChatGPT origin. Only links that resolve to that exact origin become candidates, and a
// candidate is parsed from the rendered link. It is not a live M1 binding. A link title is untrusted
// display text and is never an identity input. Open browser tabs are not a chat index and are not read here.
import { parseThread } from './conversation-thread.mjs';

export const CHAT_INDEX_SOURCE = 'page-visible-dom';
export const CHAT_INDEX_SCOPE = 'currently-rendered-links';
export const CHATGPT_CANONICAL_ORIGIN = 'https://chatgpt.com';
export const CHAT_INDEX_LIMITS = Object.freeze({
  maxEntries: { min: 1, max: 500, default: 100 },
  maxTitleChars: { min: 1, max: 300, default: 120 },
  scanLimit: { min: 1, max: 2000, default: 500 },
});
// Page-level rejection: the whole observation is refused, so no candidate entries are produced.
export const CHAT_INDEX_PAGE_ORIGIN_CODES = Object.freeze(['PAGE_ORIGIN_MISSING', 'PAGE_ORIGIN_MALFORMED', 'PAGE_ORIGIN_NON_HTTPS',
  'PAGE_ORIGIN_FOREIGN', 'PAGE_ORIGIN_NONCANONICAL']);
// Link-level omissions, counted and never returned as candidates.
// FOREIGN_HOST: a different hostname (including www and legacy aliases). CROSS_ORIGIN_LINK: same host, different port or scheme.
export const CHAT_INDEX_SKIP_CODES = Object.freeze(['HIDDEN_LINK', 'MALFORMED_LINK', 'NO_HREF', 'MALFORMED_URL', 'NON_HTTPS',
  'CREDENTIALS_IN_URL', 'FOREIGN_HOST', 'CROSS_ORIGIN_LINK', 'ROOT_OR_HOME', 'PROJECT_PAGE_UNSUPPORTED', 'PROJECT_THREAD_UNSUPPORTED',
  'MALFORMED_THREAD_PATH', 'NOT_THREAD_PATH']);
export const CHAT_INDEX_IDENTITY = Object.freeze({ state: 'candidate', reason: 'RENDERED_LINK_NOT_LIVE_BOUND' });
export const CHAT_INDEX_LIVE_BINDING = Object.freeze({ state: 'not-established', reason: 'NO_M1_BINDING' });
export const CHAT_INDEX_LIMITATIONS = Object.freeze([
  'Rendered links only; not a complete account chat list (complete is always false).',
  'No pagination or virtualization is observed; older or unrendered threads may exist.',
  'Open browser tabs are not a chat index and are never read here.',
  'Entries are parsed candidates from rendered links; they are not a live binding to any tab.',
  'Link titles are untrusted display text; identity is the thread path on the canonical origin only.',
  'Project and workspace context is not observed and is reported as unknown.',
]);

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const PROJECT_THREAD = new RegExp(`^/g/[^/]+/c/${UUID}/?$`, 'i');
const LABEL = /^[a-z][a-z-]{0,39}$/;
const HREF_CAP = 600, TEXT_CAP = 2000, SELECTOR_CAP = 200;

const fail = (code) => Object.assign(new Error(code), { code, status: 400 });
const safeCount = (value, fallback) => (Number.isSafeInteger(value) && value >= 0 ? value : fallback);

function chatIndexOptions(options = {}) {
  const o = options ?? {};
  const pick = (value, spec) => (value === undefined ? spec.default : value);
  const maxEntries = pick(o.maxEntries, CHAT_INDEX_LIMITS.maxEntries);
  const maxTitleChars = pick(o.maxTitleChars, CHAT_INDEX_LIMITS.maxTitleChars);
  const scanLimit = pick(o.scanLimit, CHAT_INDEX_LIMITS.scanLimit);
  for (const [value, spec] of [[maxEntries, CHAT_INDEX_LIMITS.maxEntries], [maxTitleChars, CHAT_INDEX_LIMITS.maxTitleChars], [scanLimit, CHAT_INDEX_LIMITS.scanLimit]]) {
    if (!Number.isSafeInteger(value) || value < spec.min || value > spec.max) throw fail('INVALID_CHAT_INDEX_OPTIONS');
  }
  const containers = o.containers === undefined ? [] : o.containers;
  if (!Array.isArray(containers) || containers.length > 8) throw fail('INVALID_CHAT_INDEX_OPTIONS');
  for (const c of containers) {
    if (!c || typeof c !== 'object' || !LABEL.test(c.label ?? '') || c.label === 'unknown'
      || typeof c.selector !== 'string' || !c.selector || c.selector.length > SELECTOR_CAP) throw fail('INVALID_CHAT_INDEX_OPTIONS');
  }
  return { maxEntries, maxTitleChars, scanLimit, containers: containers.map((c) => ({ label: c.label, selector: c.selector })) };
}

// Pure in-page reader. Returns raw observations only; it never focuses, scrolls, clicks, navigates,
// writes a property or reads attributes other than href. Container labels exist only when the caller
// supplies a verified selector; by default every link's container is reported as unknown.
export function chatIndexExpression(options = {}) {
  const o = chatIndexOptions(options);
  const selectors = options?.anchorSelectors ?? ['a[href]'];
  if (!Array.isArray(selectors) || selectors.length === 0 || selectors.length > 8
    || selectors.some((s) => typeof s !== 'string' || !s || s.length > SELECTOR_CAP)) throw fail('INVALID_CHAT_INDEX_OPTIONS');
  return `(() => {
    const ANCHORS = ${JSON.stringify(selectors)}, CONTAINERS = ${JSON.stringify(o.containers.map((c) => c.selector))};
    const SCAN = ${o.scanLimit}, HREF_CAP = ${HREF_CAP}, TEXT_CAP = ${TEXT_CAP};
    const seen = new Set();
    for (const sel of ANCHORS) {
      let list = [];
      try { list = Array.from(document.querySelectorAll(sel)); } catch (e) { list = []; }
      for (const el of list) seen.add(el);
    }
    const all = Array.from(seen);
    const slice = all.slice(0, SCAN);
```

_First 80 of 199 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
