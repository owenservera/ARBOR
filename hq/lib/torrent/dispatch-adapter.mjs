/**
 * @hq:context Live media dispatch adapter: performs the 1337x search and the
 *   magnet-button click through the owner's Chrome via the Studio torrent
 *   atoms (runAtom over an attached CDP page — the proven P55/P57 handoff to
 *   qBittorrent, no WebUI password involved). Exposes the {searchFn,
 *   dispatchFn} pair runMediaPoll takes; the search side parses raw tables
 *   with search1337x and resolves detail magnets for the top-seeded rows.
 *   Studio modules load by absolute path from VIVIM_HARNESS_ROOT (default
 *   C:/0-BlackBoxProject-0/vivim-web-harness). Unit tests inject fakes —
 *   they never import this module.
 * @hq:owner hq-agent
 * @hq:task P60-torrent-poll
 * @hq:see hq/work/goals/2026-11-08-torrent-atoms-report.md (runAtom invocation contract)
 * @hq:see hq/lib/torrent/search1337x.mjs (parsers consumed here)
 * @hq:invariant this adapter never launches Chrome: it connects to an
 *   already-running loopback DevTools endpoint and throws a clear error when
 *   none is up, so the caller degrades to plan-only. Harness load failures
 *   are errors, never silent no-ops.
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSearchUrl, parseDetailPage, parseSearchPage } from './search1337x.mjs';

export const DEFAULT_HARNESS_ROOT = 'C:/0-BlackBoxProject-0/vivim-web-harness';
const PAGE_LOAD_TIMEOUT_MS = 20000;
const DEFAULT_MAGNET_TOP_K = 3;

function harnessRoot() {
  return process.env.VIVIM_HARNESS_ROOT || DEFAULT_HARNESS_ROOT;
}

async function importHarnessModule(relPath) {
  const abs = join(harnessRoot(), relPath);
  try {
    return await import(pathToFileURL(abs).href);
  } catch (err) {
    throw new Error(
      `media adapter: cannot load Studio module ${abs}: ${(err && err.message) || err}`
    );
  }
}

/**
 * Load the Studio modules the adapter drives (cdp client + discovery, atom
 * dispatcher, atom registry). Throws a clear error when the harness is
 * missing or broken.
 */
export async function loadStudioHarness() {
  const [client, discovery, dispatch, atoms] = await Promise.all([
    importHarnessModule('studio/src/cdp/client.mjs'),
    importHarnessModule('studio/src/cdp/discovery.mjs'),
    importHarnessModule('studio/src/studio/atom-dispatch.mjs'),
    importHarnessModule('studio/src/studio/browser-atoms.mjs'),
  ]);
  for (const [name, fn] of [
    ['CdpConnection', client.CdpConnection],
    ['listTargets', discovery.listTargets],
    ['isReachable', discovery.isReachable],
    ['browserWsUrl', discovery.browserWsUrl],
    ['runAtom', dispatch.runAtom],
    ['getAtom', atoms.getAtom],
  ]) {
    if (!fn) throw new Error(`media adapter: Studio module missing export ${name}`);
  }
  return {
    CdpConnection: client.CdpConnection,
    listTargets: discovery.listTargets,
    isReachable: discovery.isReachable,
    browserWsUrl: discovery.browserWsUrl,
    runAtom: dispatch.runAtom,
    getAtom: atoms.getAtom,
  };
}

/**
 * Connect to the running Studio capture Chrome and build the poll's
 * {searchFn, dispatchFn, close}. Connect-only: if no DevTools endpoint
 * answers on the port, a clear error is thrown (never a browser launch).
 * @param {{port?: number, magnetTopK?: number}} [opts]
 */
/**
 * Navigation-arrival check. The site canonically rewrites the tail of a URL
 * (detail slug casing/encoding), so exact equality never holds after a
 * redirect; document identity lives in the first path segments:
 * /torrent/<id> (depth 2) and /search (depth 1 — we navigate there
 * ourselves). Exported pure so the race fix stays unit-testable without
 * Chrome.
 */
export function reachedUrl(here, target) {
  const parse = (u) => {
    try {
      return new URL(String(u));
    } catch {
      return null;
    }
  };
  const a = parse(here);
  const b = parse(target);
  if (!a || !b) return false;
  if (a.host.toLowerCase() !== b.host.toLowerCase()) return false;
  const segs = (p) => p.replace(/\/+$/, '').split('/').filter(Boolean);
  const sa = segs(a.pathname);
  const sb = segs(b.pathname);
  if (sb.length === 0) return sa.length === 0;
  if (sa.length === 0) return false;
  const depth = sb[0].toLowerCase() === 'search' ? 1 : 2;
  return (
    sa.slice(0, depth).join('/').toLowerCase() === sb.slice(0, depth).join('/').toLowerCase()
  );
}

export async function createStudioMedia({ port = 9222, magnetTopK = DEFAULT_MAGNET_TOP_K } = {}) {
  const h = await loadStudioHarness();
  const reachable = await h.isReachable({ port });
  if (!reachable) {
    throw new Error(
      `media adapter: no Chrome DevTools endpoint on 127.0.0.1:${port} — start the Studio capture Chrome first (the adapter never launches a browser)`
    );
  }
  const conn = await h.CdpConnection.connect(await h.browserWsUrl({ port }), {
    requestTimeoutMs: PAGE_LOAD_TIMEOUT_MS,
  });
  const targets = await h.listTargets({ port });
  const pageTarget = targets.find((t) => /^https?:/i.test(String(t?.url ?? ''))) ?? targets[0];
  if (!pageTarget) throw new Error('media adapter: no page target on the DevTools endpoint');
  // DevTools /json/list rows carry the attachable id as `id` (some wrappers
  // expose it as targetId) — a missing id here surfaced as the opaque
  // "mandatory field missing at position 17" attach error.
  const targetId = pageTarget.targetId ?? pageTarget.id;
  if (!targetId) throw new Error('media adapter: page target has no attachable id');
  const page = await conn.attach(targetId);
  const waitAtom = { id: 'torrent.page.waitLoad', primitive: 'waitForLoad', effect: 'read' };
  const locAtom = { id: 'torrent.page.location', primitive: 'evaluate', effect: 'read' };

  const atom = async (id) => {
    const a = await h.getAtom(id);
    if (!a) throw new Error(`media adapter: atom not registered: ${id}`);
    return a;
  };
  async function evaluate(atomId, args) {
    const envelope = await h.runAtom(await atom(atomId), args, { page, execute: true });
    if (!envelope || envelope.ok !== true) {
      throw new Error(`media adapter: ${atomId} failed: ${envelope ? envelope.error : 'no envelope'}`);
    }
    return envelope.result;
  }
  async function navigateWith(atomId, url, atomArgs) {
    await evaluate(atomId, { ...atomArgs, expression: `location.href = ${JSON.stringify(url)}` });
    // Same-tab navigation race: readyState can read 'complete' from the OLD
    // document before the new one commits, so load alone proves nothing —
    // poll until location.href actually reaches the target URL.
    const deadline = Date.now() + PAGE_LOAD_TIMEOUT_MS;
    for (;;) {
      // dom:true accepts readyState 'interactive' — 1337x keeps long-loading
      // ad resources, so 'complete' can outlast the timeout while the DOM
      // (and the magnet anchor) is already parsed.
      const wait = await h.runAtom(waitAtom, { timeoutMs: PAGE_LOAD_TIMEOUT_MS, dom: true }, { page });
      if (!wait || wait.ok !== true || wait.result !== true) {
        throw new Error(`media adapter: page load timed out: ${url}`);
      }
      const probe = await h.runAtom(locAtom, { expression: 'location.href' }, { page });
      const here = probe && probe.ok ? String(probe.result ?? '') : '';
      if (reachedUrl(here, url)) return;
      if (Date.now() > deadline) {
        throw new Error(`media adapter: navigation did not reach ${url} (at ${here || 'unknown'})`);
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  const detailUrl = (href) => (/^https?:/i.test(String(href ?? '')) ? href : `https://1337x.to${href}`);

  /**
   * Search 1337x through the browser: torrent.search.query navigates and
   * reads the raw table, search1337x parses it, and the top-seeded rows get
   * their detail-page magnet resolved (torrent.detail.magnet). Rows carry
   * {title, detailHref, size, seeders, leeches, magnet?, infoHash?}.
   */
  async function searchFn(query) {
    const url = buildSearchUrl(query, 1);
    await navigateWith('torrent.search.query', url, { query, page: 1 });
    const html = await evaluate('torrent.search.query', {
      query,
      page: 1,
      expression: `document.querySelector('table.table-list')?.innerHTML ?? null`,
    });
    if (!html) return [];
    const rows = parseSearchPage(String(html));
    rows.sort((a, b) => (b.seeders ?? 0) - (a.seeders ?? 0));
    for (const row of rows.slice(0, magnetTopK)) {
      try {
        const magnet = await resolveMagnet(detailUrl(row.detailHref));
        if (magnet) {
          row.magnet = magnet.magnetURI;
          row.infoHash = magnet.infoHash || undefined;
        }
      } catch {
        // one failed detail page stays magnet-less; the planner skips it
      }
    }
    return rows;
  }

  async function resolveMagnet(url) {
    await navigateWith('torrent.detail.magnet', url, { url });
    const href = await evaluate('torrent.detail.magnet', {
      url,
      expression: `document.querySelector('a[href^="magnet:"]')?.getAttribute('href') ?? null`,
    });
    if (!href) return null;
    const parsed = parseDetailPage(`href="${href}"`);
    return parsed ?? { magnetURI: href, infoHash: '' };
  }

  /**
   * Dispatch a plan: navigate the detail page (plan.detailHref) and click
   * the magnet anchor (torrent.magnet.click) — Chrome's protocol handler
   * hands the magnet to the registered torrent client. Returns
   * {ok, infoHash, receipt}.
   */
  async function dispatchFn(plan) {
    const url = plan && plan.detailHref ? detailUrl(plan.detailHref) : null;
    if (!url) {
      throw new Error('media adapter: dispatch plan has no detailHref — cannot click the magnet button');
    }
    await navigateWith('torrent.magnet.click', url, { url });
    // element.click() returns undefined, so `?? false` misread a REAL click as
    // failure (found live on P61: the magnet fired while dispatchFn threw).
    // Return an explicit boolean instead.
    const clicked = await evaluate('torrent.magnet.click', {
      url,
      expression: `(() => { const el = document.querySelector('a[href^="magnet:"]'); if (!el) return false; el.click(); return true; })()`,
    });
    if (clicked !== true) {
      throw new Error('media adapter: magnet anchor not found on the detail page');
    }
    const infoHash =
      (plan.infoHash ? String(plan.infoHash).toLowerCase() : '') ||
      (parseDetailPage(`href="${plan.magnet}"`) ?? {}).infoHash ||
      '';
    return { ok: true, infoHash, receipt: `magnet-click:${url}` };
  }

  return {
    searchFn,
    dispatchFn,
    close: () => conn.close(),
    target: { targetId, url: pageTarget.url },
  };
}
