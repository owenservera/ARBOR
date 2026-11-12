// Atomic browser registry — family: torrent (3 atoms).
// Torrent/media capability for 1337x, registered as a VIVIM Studio atom family (goal P56):
// search the results table, read the magnet href off a torrent detail page, and click the
// magnet anchor so Chrome hands the link to the registered torrent client (Chrome protocol
// handler -> client; mechanism proven live end-to-end 2026-11-08, goal P55).
//
// The family name is `torrent`, not `media`: `media` is already a generated DOM-media family
// (media.list.images, media.src.video, ... in atoms/media.mjs), and atom ids must be unique
// across families. Targets cannot start with a digit (atom-kit ID_RE), so the search target
// is `query` rather than `1337x`.
//
// The registry has no torrent primitive, so every action maps to `evaluate` (page-level JS)
// — the same escape the window family documents. The atom declares intent and typed args;
// the engine supplies the run-time expression through atom-dispatch.runAtom over an attached
// CDP page (the engine composition is documented in
// repos_hq/hq/work/goals/2026-11-08-torrent-atoms-report.md). Raw data out: atoms carry no
// parsing logic; search reads the raw table content, detail reads the raw magnet href.
//
// Effects are the worst blast radius of the intended use: search and detail runs move the tab
// (browser-navigation), the click changes the page (page-write). All three therefore require
// --execute / execute:true; none can ever provider-send.
//
// This is a handwritten capability family, not a generated verb x target matrix, so it
// declares its own exact size: FAMILY_SIZES.torrent = 3 in browser-atoms.mjs (still an exact
// count — never padded, never ranged).
import { makeAtom } from '../atom-kit.mjs';

export const family = "torrent";

const QUERY = { name: "query", type: "string", required: true };
const PAGE = { name: "page", type: "number", required: false };
const DETAIL_URL = { name: "url", type: "url", required: true };
const VIA = " via evaluate (page-level JS; the engine supplies the run-time expression).";

const RAW = [
  { id: "torrent.search.query", family, verb: "search", target: "query", primitive: "evaluate", effect: "browser-navigation", args: [QUERY, PAGE], summary: `Search 1337x: navigate the tab to https://1337x.to/search/<query>/<page>/ and read the raw table.table-list content (page defaults to 1)${VIA}` },
  { id: "torrent.detail.magnet", family, verb: "detail", target: "magnet", primitive: "evaluate", effect: "browser-navigation", args: [DETAIL_URL], summary: `Navigate the tab to a 1337x /torrent/ detail page (url must be a 1337x /torrent/ URL) and read the first magnet: anchor href as a raw string, or null when absent${VIA}` },
  { id: "torrent.magnet.click", family, verb: "magnet", target: "click", primitive: "evaluate", effect: "page-write", args: [DETAIL_URL], summary: `Navigate the tab to a 1337x /torrent/ detail page and execute a click on the first magnet: anchor so the Chrome protocol handler hands the link to the torrent client${VIA}` },
];

export const atoms = RAW.map(makeAtom);
