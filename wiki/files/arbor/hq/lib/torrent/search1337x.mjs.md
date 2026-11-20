# File: hq/lib/torrent/search1337x.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/torrent/search1337x.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3950 B |
| Lines | 106 |
| Hash | 42839aa22790 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| buildSearchUrl | function | 12 | yes | export function buildSearchUrl(query, page = 1) { |
| parseSearchPage | function | 21 | yes | export function parseSearchPage(html) { |
| rows | const | 23 | no | const rows = []; |
| tableMatch | const | 28 | no | const tableMatch = /&lt;table[^&gt;]*class=&quot;[^&quot;]*table-list[^&quot;]*&quot;[^&gt;]*&gt;([\\s\\S]*?)&lt;\\/table&gt;/i.exec(html); |
| scope | const | 29 | no | const scope = tableMatch ? tableMatch[1] : html; |
| trs | const | 30 | no | const trs = scope.split(/&lt;tr[^&gt;]*&gt;/i).slice(1); |
| row | const | 32 | no | const row = parseRow(tr); |
| parseRow | function | 39 | no | function parseRow(tr) { |
| hrefMatch | const | 40 | no | const hrefMatch = /&lt;a[^&gt;]+href=&quot;(\\/torrent\\/[^&quot;]+)&quot;/i.exec(tr); |
| detailHref | const | 42 | no | const detailHref = decodeEntities(hrefMatch[1]); |
| title | const | 43 | no | const title = rowTitle(tr); |
| cellSize | function | 59 | no | function cellSize(tr) { |
| m | const | 60 | no | const m = /&lt;td[^&gt;]*class=&quot;[^&quot;]*size[^&quot;]*&quot;[^&gt;]*&gt;([\\s\\S]*?)&lt;\\/td&gt;/i.exec(tr); |
| text | const | 62 | no | const text = decodeEntities(m[1].replace(/&lt;span[\\s\\S]*?&lt;\\/span&gt;/gi, &#39; &#39;).replace(/&lt;[^&gt;]+&gt;/g, &#39; &#39;)); |
| rowTitle | function | 67 | no | function rowTitle(tr) { |
| anchor | const | 68 | no | const anchor = /&lt;a[^&gt;]+href=&quot;\\/torrent\\/[^&quot;]*&quot;[^&gt;]*&gt;([\\s\\S]*?)&lt;\\/a&gt;/i.exec(tr); |
| cellText | function | 72 | no | function cellText(tr, collClass) { |
| m | const | 73 | no | const m = new RegExp(`&lt;td[^&gt;]*class=&quot;[^&quot;]*${collClass}[^&quot;]*&quot;[^&gt;]*&gt;([\\\\s\\\\S]*?)&lt;\\\\/td&gt;`, &#39;i&#39;).exec(tr); |
| cellNumber | function | 79 | no | function cellNumber(tr, collClass) { |
| text | const | 80 | no | const text = cellText(tr, collClass); |
| m | const | 81 | no | const m = /([\\d,]+)/.exec(text); |
| parseDetailPage | function | 90 | yes | export function parseDetailPage(html) { |
| m | const | 92 | no | const m = /href=&quot;(magnet:\\?xt=urn:btih:[A-Za-z0-9][^&quot;]*)&quot;/i.exec(html); |
| magnetURI | const | 94 | no | const magnetURI = decodeEntities(m[1]); |
| xt | const | 95 | no | const xt = /xt=urn:btih:([A-Za-z0-9]+)/i.exec(magnetURI); |
| decodeEntities | function | 99 | no | function decodeEntities(s) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/torrent/dispatch-adapter.mjs](./dispatch-adapter.mjs.md) | ./search1337x.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Pure HTML parsers for 1337x search listings and detail pages, |
| 5 | owner | hq-agent | — | hq-agent |
| 6 | task | — | — | P54-torrent |
| 7 | see | — | hq/work/goals/2026-11-08-torrent-media-recon.md | hq/work/goals/2026-11-08-torrent-media-recon.md (fixtures only; never open the site here) |
| 8 | invariant | — | — | no fetch in this module — transport stays Studio-owned. |

## Excerpt

```javascript
/**
 * @hq:context Pure HTML parsers for 1337x search listings and detail pages,
 *   plus search URL builder. No network, no DOM dependency: regex/string
 *   parsing on <tr> blocks, tolerant of malformed markup (returns []).
 * @hq:owner hq-agent
 * @hq:task P54-torrent
 * @hq:see hq/work/goals/2026-11-08-torrent-media-recon.md (fixtures only; never open the site here)
 * @hq:invariant no fetch in this module — transport stays Studio-owned.
 */

/** Build the 1337x search URL for a query and page. */
export function buildSearchUrl(query, page = 1) {
  return `https://1337x.to/search/${encodeURIComponent(query)}/${page}/`;
}

/**
 * Parse a search listing page.
 * @param {string} html
 * @returns {{title:string, detailHref:string, size:string, seeders:number, leeches:number}[]}
 */
export function parseSearchPage(html) {
  if (typeof html !== 'string' || !html) return [];
  const rows = [];
  // Listing lives in table.table-list; work on <tr> blocks so a broken page
  // yields fewer/zero rows instead of a throw.
  // Live column mapping (verified against real DOM 2026-11-08): coll-2 seeds,
  // coll-3 leeches, coll-4 size, coll-5 uploader.
  const tableMatch = /<table[^>]*class="[^"]*table-list[^"]*"[^>]*>([\s\S]*?)<\/table>/i.exec(html);
  const scope = tableMatch ? tableMatch[1] : html;
  const trs = scope.split(/<tr[^>]*>/i).slice(1);
  for (const tr of trs) {
    const row = parseRow(tr);
    if (row) rows.push(row);
  }
  return rows;
}

/** Parse one <tr> block; null when it is not a torrent row (header, ad, junk). */
function parseRow(tr) {
  const hrefMatch = /<a[^>]+href="(\/torrent\/[^"]+)"/i.exec(tr);
  if (!hrefMatch) return null;
  const detailHref = decodeEntities(hrefMatch[1]);
  const title = rowTitle(tr);
  if (!title) return null;
  return {
    title,
    detailHref,
    size: cellSize(tr) || '',
    seeders: cellNumber(tr, 'coll-2'),
    leeches: cellNumber(tr, 'coll-3'),
  };
}

/**
 * Size cell = the td whose class contains "size" (live: coll-4). It carries a
 * nested <span class="seeds"> with the seed count again, so spans are dropped
 * whole before tag-stripping ("564.9 MB<span…>242</span>" -> "564.9 MB").
 */
function cellSize(tr) {
  const m = /<td[^>]*class="[^"]*size[^"]*"[^>]*>([\s\S]*?)<\/td>/i.exec(tr);
  if (!m) return '';
  const text = decodeEntities(m[1].replace(/<span[\s\S]*?<\/span>/gi, ' ').replace(/<[^>]+>/g, ' '));
  return text.replace(/\s+/g, ' ').trim();
}

/** Title = text of the anchor that carries the /torrent/ href. */
function rowTitle(tr) {
  const anchor = /<a[^>]+href="\/torrent\/[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(tr);
  return anchor ? decodeEntities(anchor[1]).trim() : '';
}

function cellText(tr, collClass) {
  const m = new RegExp(`<td[^>]*class="[^"]*${collClass}[^"]*"[^>]*>([\\s\\S]*?)<\\/td>`, 'i').exec(tr);
  if (!m) return '';
  // Sizes often carry an inner <span> unit: "1.4 <span>GB</span>".
  return decodeEntities(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function cellNumber(tr, collClass) {
  const text = cellText(tr, collClass);
```

_First 80 of 107 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
