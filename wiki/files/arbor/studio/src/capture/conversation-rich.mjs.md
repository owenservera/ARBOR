# File: studio/src/capture/conversation-rich.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/conversation-rich.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6172 B |
| Lines | 107 |
| Hash | ed6edf15e607 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RICH_PART_KINDS | const | 4 | yes | export const RICH_PART_KINDS = Object.freeze([ &#39;list-item&#39;, &#39;code&#39;, &#39;table&#39;, &#39;blockquote&#39;, &#39;link&#39;, &#39;citation-candidate&#39;, &#39;image&#39;, &#39;math&#39;, ]); |
| RICH_PARTS_MAX | const | 7 | yes | export const RICH_PARTS_MAX = 32; |
| RICH_PARTS_MAX_CHARS | const | 8 | yes | export const RICH_PARTS_MAX_CHARS = 8192; |
| richPartReaderSource | function | 11 | yes | export function richPartReaderSource() { |
| readRichParts | function | 13 | no | const readRichParts = (root) =&gt; { |
| allNodes | const | 15 | no | const allNodes = Array.from(root.querySelectorAll(&#39;li,pre,table,blockquote,a[href],img,math,[data-math],[data-testid*=&quot;citation&quot; i]&#39;)); |
| visible | function | 18 | no | const visible = (el) =&gt; { |
| style | const | 22 | no | const style = getComputedStyle(node); |
| rect | const | 25 | no | const rect = node.getBoundingClientRect(); |
| nodes | const | 31 | no | const nodes = allNodes.filter(visible); |
| clip | function | 32 | no | const clip = (s,n=512) =&gt; String(s ?? &#39;&#39;).slice(0,n); |
| safeLink | function | 33 | no | const safeLink = (href) =&gt; { |
| u | const | 36 | no | const u = new URL(href, location.href \|\| location.origin); |
| parts | const | 43 | no | const parts = []; let pageBudget = 8192, skipped = Math.max(0,allNodes.length-nodes.length) + Math.max(0,nodes.length-32); |
| rect | const | 45 | no | const rect = el.getBoundingClientRect?.(); |
| tag | const | 47 | no | const tag = String(el.tagName ?? &#39;&#39;).toLowerCase(); |
| label | const | 48 | no | const label = clip(el.innerText ?? el.textContent); |
| part | variable | 49 | no | let part = null; |
| depth | variable | 51 | no | let depth=0,parent=el.parentElement; |
| code | const | 59 | no | const code=el.querySelector?.(&#39;code&#39;)??el; |
| language | const | 60 | no | const language=String(code.className??&#39;&#39;).split(&#39; &#39;).find(x=&gt;x.startsWith(&#39;language-&#39;))?.slice(9,49)??null; |
| rows | const | 63 | no | const rows=Array.from(el.querySelectorAll(&#39;tr&#39;)); |
| href | const | 69 | no | const href=safeLink(el.getAttribute?.(&#39;href&#39;)); |
| latex | const | 75 | no | const latex=el.querySelector?.(&#39;annotation[encoding=&quot;application/x-tex&quot;]&#39;)?.textContent |
| candidate | const | 81 | no | const candidate={index:parts.length,...part}; |
| size | const | 82 | no | const size=JSON.stringify(candidate).length; |
| boundRichParts | function | 91 | yes | export function boundRichParts(rawParts, { chars = 0, completeText = false, maxChars = 16000 } = {}) { |
| permitted | const | 93 | no | const permitted = new Set(RICH_PART_KINDS); |
| parts | const | 94 | no | const parts = []; |
| budget | variable | 95 | no | let budget = Math.min(RICH_PARTS_MAX_CHARS, Number.isSafeInteger(maxChars) &amp;&amp; maxChars &gt;= 0 ? maxChars : 0); |
| serialized | variable | 98 | no | let serialized; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-thread.mjs](./conversation-thread.mjs.md) | ./conversation-rich.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Bounded semantic DOM reader for ChatGPT's EXISTING read-only conversation observation.
// The returned source runs inside the already-attached CDP page. It never fetches, clicks, scrolls,
// focuses, changes draft text or drives a second browser. All shapes are page-visible candidates.
export const RICH_PART_KINDS = Object.freeze([
  'list-item', 'code', 'table', 'blockquote', 'link', 'citation-candidate', 'image', 'math',
]);
export const RICH_PARTS_MAX = 32;
export const RICH_PARTS_MAX_CHARS = 8192;

// @serves 043,044,045,046,047,048,049,050
export function richPartReaderSource() {
  return String.raw`
    const readRichParts = (root) => {
      if (typeof root.querySelectorAll !== 'function') return { parts: [], omitted: 0 };
      const allNodes = Array.from(root.querySelectorAll('li,pre,table,blockquote,a[href],img,math,[data-math],[data-testid*="citation" i]'));
      // The answer DOM can contain non-visible templates, collapsed ancestors or ARIA-hidden
      // descendants. A child with a nonzero box is still not visible evidence in those cases.
      const visible = (el) => {
        for (let node = el; node && node !== root; node = node.parentElement) {
          try {
            if (node.hidden === true || node.inert === true || node.getAttribute?.('aria-hidden') === 'true') return false;
            const style = getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse'
              || style.contentVisibility === 'hidden') return false;
            const rect = node.getBoundingClientRect();
            if (rect.width <= 1 || rect.height <= 1) return false;
          } catch { return false; }
        }
        return true;
      };
      const nodes = allNodes.filter(visible);
      const clip = (s,n=512) => String(s ?? '').slice(0,n);
      const safeLink = (href) => {
        if (!href) return null;
        try {
          const u = new URL(href, location.href || location.origin);
          if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
          // Do not reveal credentials, query tokens or fragments in the transcript tool.
          u.username=''; u.password=''; u.search=''; u.hash='';
          return u.toString();
        } catch { return null; }
      };
      const parts = []; let pageBudget = 8192, skipped = Math.max(0,allNodes.length-nodes.length) + Math.max(0,nodes.length-32);
      for (const el of nodes.slice(0,32)) {
        const rect = el.getBoundingClientRect?.();
        if (!rect || rect.width < 1 || rect.height < 1) { skipped++; continue; }
        const tag = String(el.tagName ?? '').toLowerCase();
        const label = clip(el.innerText ?? el.textContent);
        let part = null;
        if (tag === 'li') {
          let depth=0,parent=el.parentElement;
          while (parent && parent!==root) {
            if (['ol','ul'].includes(String(parent.tagName).toLowerCase())) depth++;
            parent=parent.parentElement;
          }
          part={type:'list-item',ordered:String(el.parentElement?.tagName??'').toLowerCase()==='ol',
            depth:Math.min(depth,20),text:label};
        } else if (tag === 'pre') {
          const code=el.querySelector?.('code')??el;
          const language=String(code.className??'').split(' ').find(x=>x.startsWith('language-'))?.slice(9,49)??null;
          part={type:'code',language,text:clip(code.innerText??code.textContent,4096)};
        } else if (tag === 'table') {
          const rows=Array.from(el.querySelectorAll('tr'));
          part={type:'table',rows:rows.slice(0,12).map(row=>Array.from(row.querySelectorAll('th,td')).slice(0,8)
            .map(cell=>({header:String(cell.tagName).toLowerCase()==='th',
              text:clip(cell.innerText??cell.textContent,128)}))),rowsTruncated:rows.length>12};
        } else if (tag === 'blockquote') part={type:'blockquote',text:clip(label,2048)};
        else if (tag === 'a') {
          const href=safeLink(el.getAttribute?.('href'));
          if (href) part={type:/citation/i.test(String(el.getAttribute?.('data-testid')??''))?'citation-candidate':'link',
            text:label,href,hrefSanitized:true};
        } else if (tag === 'img') part={type:'image',alt:clip(el.getAttribute?.('alt')),
          sourcePresent:!!el.getAttribute?.('src')};
        else if (tag === 'math' || el.hasAttribute?.('data-math')) {
          const latex=el.querySelector?.('annotation[encoding="application/x-tex"]')?.textContent
            ??el.getAttribute?.('data-math')??null;
          part={type:'math',latex:latex===null?null:clip(latex,2048),text:label};
        } else if (/citation/i.test(String(el.getAttribute?.('data-testid')??'')))
          part={type:'citation-candidate',text:label,href:null};
        if (part) {
```

_First 80 of 108 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
