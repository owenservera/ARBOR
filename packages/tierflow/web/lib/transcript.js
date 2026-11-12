// Transcript console.
//
// Tier 1 conversation, Tier 2 narrated decisions and Tier 3 alerts are
// interleaved chronologically in one list. JSON payloads collapse to a single
// summary line. The list is capped: once it exceeds the node budget the
// oldest rows are pruned in batches so a synthetic 2000 ev/s load cannot grow
// the DOM without bound.

import { el } from "./dom.js";
import { fmtClock } from "./format.js";

export function createTranscript(listEl, options) {
  const opts = options || {};
  const maxNodes = typeof opts.max === "number" ? opts.max : 300;
  const fragment = document.createDocumentFragment();
  let pending = 0;
  let pinned = true;

  const api = {
    onPinChange: null,
    add: add,
    rule: rule,
    commit: commit,
    clear: clear,
    scrollToLive: scrollToLive,
    isPinned: isPinned,
    count: count,
  };

  function onScroll() {
    const distance = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight;
    const next = distance < 32;
    if (next !== pinned) {
      pinned = next;
      if (api.onPinChange) api.onPinChange(pinned);
    }
  }
  listEl.addEventListener("scroll", onScroll, { passive: true });

  function build(entry) {
    const li = el("li", "tln tln--" + (entry.kind || "sys"));
    li.appendChild(el("span", "tln__time", fmtClock(entry.ts)));
    li.appendChild(el("span", "tln__tag", entry.tag || "SYS"));
    li.appendChild(el("span", "tln__type", entry.type || ""));
    const body = el("span", "tln__body");
    if (entry.text) body.appendChild(el("span", "tln__text", entry.text));
    if (entry.summary) body.appendChild(el("span", "tln__sum", entry.summary));
    li.appendChild(body);
    return li;
  }

  function add(entry) {
    if (!entry) return;
    fragment.appendChild(build(entry));
    pending += 1;
  }

  function rule(text) {
    const li = el("li", "tln tln--rule");
    li.appendChild(el("span", "tln__rule", text || ""));
    fragment.appendChild(li);
    pending += 1;
  }

  // Prune to a low-water mark rather than one node at a time, so the list
  // never overshoots the budget and the removal cost is amortised.
  const lowWater = Math.max(20, Math.floor(maxNodes * 0.8));

  function prune() {
    if (listEl.children.length <= maxNodes) return;
    while (listEl.children.length > lowWater) {
      listEl.removeChild(listEl.firstChild);
    }
  }

  function commit() {
    if (!pending) return;
    pending = 0;
    listEl.appendChild(fragment);
    prune();
    if (pinned) listEl.scrollTop = listEl.scrollHeight;
  }

  function clear() {
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
    pending = 0;
    pinned = true;
    if (api.onPinChange) api.onPinChange(true);
  }

  function scrollToLive() {
    listEl.scrollTop = listEl.scrollHeight;
    pinned = true;
    if (api.onPinChange) api.onPinChange(true);
  }

  function isPinned() {
    return pinned;
  }

  function count() {
    return listEl.children.length;
  }

  return api;
}
