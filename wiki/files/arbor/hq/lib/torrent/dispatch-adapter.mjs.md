# File: hq/lib/torrent/dispatch-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/torrent/dispatch-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10828 B |
| Lines | 249 |
| Hash | 2ee324f3ba6e |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_HARNESS_ROOT | const | 24 | yes | export const DEFAULT_HARNESS_ROOT = &#39;C:/0-BlackBoxProject-0/vivim-web-harness&#39;; |
| PAGE_LOAD_TIMEOUT_MS | const | 25 | no | const PAGE_LOAD_TIMEOUT_MS = 20000; |
| DEFAULT_MAGNET_TOP_K | const | 26 | no | const DEFAULT_MAGNET_TOP_K = 3; |
| harnessRoot | function | 28 | no | function harnessRoot() { |
| importHarnessModule | function | 32 | no | async function importHarnessModule(relPath) { |
| abs | const | 33 | no | const abs = join(harnessRoot(), relPath); |
| loadStudioHarness | function | 48 | yes | export async function loadStudioHarness() { |
| reachedUrl | function | 89 | yes | export function reachedUrl(here, target) { |
| parse | function | 90 | no | const parse = (u) =&gt; { |
| a | const | 97 | no | const a = parse(here); |
| b | const | 98 | no | const b = parse(target); |
| segs | function | 101 | no | const segs = (p) =&gt; p.replace(/\\/+$/, &#39;&#39;).split(&#39;/&#39;).filter(Boolean); |
| sa | const | 102 | no | const sa = segs(a.pathname); |
| sb | const | 103 | no | const sb = segs(b.pathname); |
| depth | const | 106 | no | const depth = sb[0].toLowerCase() === &#39;search&#39; ? 1 : 2; |
| createStudioMedia | function | 112 | yes | export async function createStudioMedia({ port = 9222, magnetTopK = DEFAULT_MAGNET_TOP_K } = {}) { |
| h | const | 113 | no | const h = await loadStudioHarness(); |
| reachable | const | 114 | no | const reachable = await h.isReachable({ port }); |
| conn | const | 120 | no | const conn = await h.CdpConnection.connect(await h.browserWsUrl({ port }), { requestTimeoutMs: PAGE_LOAD_TIMEOUT_MS, }); |
| targets | const | 123 | no | const targets = await h.listTargets({ port }); |
| pageTarget | const | 124 | no | const pageTarget = targets.find((t) =&gt; /^https?:/i.test(String(t?.url ?? &#39;&#39;))) ?? targets[0]; |
| targetId | const | 129 | no | const targetId = pageTarget.targetId ?? pageTarget.id; |
| page | const | 131 | no | const page = await conn.attach(targetId); |
| waitAtom | const | 132 | no | const waitAtom = { id: &#39;torrent.page.waitLoad&#39;, primitive: &#39;waitForLoad&#39;, effect: &#39;read&#39; }; |
| locAtom | const | 133 | no | const locAtom = { id: &#39;torrent.page.location&#39;, primitive: &#39;evaluate&#39;, effect: &#39;read&#39; }; |
| atom | function | 135 | no | const atom = async (id) =&gt; { |
| a | const | 136 | no | const a = await h.getAtom(id); |
| evaluate | function | 140 | no | async function evaluate(atomId, args) { |
| envelope | const | 141 | no | const envelope = await h.runAtom(await atom(atomId), args, { page, execute: true }); |
| navigateWith | function | 147 | no | async function navigateWith(atomId, url, atomArgs) { |
| deadline | const | 152 | no | const deadline = Date.now() + PAGE_LOAD_TIMEOUT_MS; |
| wait | const | 157 | no | const wait = await h.runAtom(waitAtom, { timeoutMs: PAGE_LOAD_TIMEOUT_MS, dom: true }, { page }); |
| probe | const | 161 | no | const probe = await h.runAtom(locAtom, { expression: &#39;location.href&#39; }, { page }); |
| here | const | 162 | no | const here = probe &amp;&amp; probe.ok ? String(probe.result ?? &#39;&#39;) : &#39;&#39;; |
| detailUrl | function | 170 | no | const detailUrl = (href) =&gt; (/^https?:/i.test(String(href ?? &#39;&#39;)) ? href : `https://1337x.to${href}`); |
| searchFn | function | 178 | no | async function searchFn(query) { |
| url | const | 179 | no | const url = buildSearchUrl(query, 1); |
| html | const | 181 | no | const html = await evaluate(&#39;torrent.search.query&#39;, { query, page: 1, expression: `document.querySelector(&#39;table.table-list&#39;)?.innerHTML ?? null`, }); |
| rows | const | 187 | no | const rows = parseSearchPage(String(html)); |
| magnet | const | 191 | no | const magnet = await resolveMagnet(detailUrl(row.detailHref)); |
| resolveMagnet | function | 203 | no | async function resolveMagnet(url) { |
| href | const | 205 | no | const href = await evaluate(&#39;torrent.detail.magnet&#39;, { url, expression: `document.querySelector(&#39;a[href^=&quot;magnet:&quot;]&#39;)?.getAttribute(&#39;href&#39;) ?? null`, }); |
| parsed | const | 210 | no | const parsed = parseDetailPage(`href=&quot;${href}&quot;`); |
| dispatchFn | function | 220 | no | async function dispatchFn(plan) { |
| url | const | 221 | no | const url = plan &amp;&amp; plan.detailHref ? detailUrl(plan.detailHref) : null; |
| clicked | const | 229 | no | const clicked = await evaluate(&#39;torrent.magnet.click&#39;, { url, expression: `(() =&gt; { const el = document.querySelector(&#39;a[href^=&quot;magnet:&quot;]&#39;); if (!el) return false; el.click(); return true; })()`, }); |
| infoHash | const | 236 | no | const infoHash = |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 20 | external |
| node:url | import | 21 | external |
| ./search1337x.mjs | import | 22 | [hq/lib/torrent/search1337x.mjs](./search1337x.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/torrent/dispatch-adapter.mjs |
| [hq/lib/automation.mjs](../automation.mjs.md) | ./torrent/dispatch-adapter.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Live media dispatch adapter: performs the 1337x search and the |
| 11 | owner | hq-agent | — | hq-agent |
| 12 | task | — | — | P60-torrent-poll |
| 13 | see | — | hq/work/goals/2026-11-08-torrent-atoms-report.md | hq/work/goals/2026-11-08-torrent-atoms-report.md (runAtom invocation contract) |
| 14 | see | — | hq/lib/torrent/search1337x.mjs | hq/lib/torrent/search1337x.mjs (parsers consumed here) |
| 15 | invariant | — | — | this adapter never launches Chrome: it connects to an |

## Excerpt

```javascript
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
```

_First 80 of 250 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
