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
  const m = /([\d,]+)/.exec(text);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
}

/**
 * Parse a detail page: first magnet link and its btih.
 * @param {string} html
 * @returns {{magnetURI: string, infoHash: string}|null}
 */
export function parseDetailPage(html) {
  if (typeof html !== 'string' || !html) return null;
  const m = /href="(magnet:\?xt=urn:btih:[A-Za-z0-9][^"]*)"/i.exec(html);
  if (!m) return null;
  const magnetURI = decodeEntities(m[1]);
  const xt = /xt=urn:btih:([A-Za-z0-9]+)/i.exec(magnetURI);
  return { magnetURI, infoHash: xt ? xt[1] : '' };
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
