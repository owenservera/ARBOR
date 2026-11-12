// Run board.
//
// One card per RunMeta. Cards are created newest-first and updated in place,
// never re-rendered, so the board stays cheap while a synthetic load pushes
// thousands of events through it. The card count is capped and the panel
// scrolls internally.

import { el, clear } from "./dom.js";
import { fmtNum, fmtDur, truncate } from "./format.js";

const MAX_CARDS = 40;

export function createRunBoard(listEl, options) {
  const opts = options || {};
  const onStop = opts.onStop || null;
  const cards = new Map();

  function formatArgv(argv) {
    if (!argv || !argv.length) return "";
    return argv
      .map(function (part) {
        return /\s/.test(part) ? '"' + part + '"' : part;
      })
      .join(" ");
  }

  function build(run) {
    const root = el("article", "run");
    root.dataset.run = run.runId;
    root.dataset.state = run.state || "queued";

    const top = el("div", "run__top");
    const kind = el("span", "run__kind", String(run.kind || "exec").toUpperCase());
    const label = el("span", "run__label", run.label || run.runId);
    const chip = el("span", "chip", "QUEUED");
    top.appendChild(kind);
    top.appendChild(label);
    top.appendChild(chip);

    const argvText = formatArgv(run.argv);
    const argv = el("code", "run__argv", argvText || "argv pending");
    if (argvText) argv.title = argvText;

    const grid = el("div", "run__grid");
    const cells = {};
    const defs = [
      ["OUT", "OUT"],
      ["ERR", "ERR"],
      ["TIME", "TIME"],
      ["EXIT", "EXIT"],
    ];
    for (let i = 0; i < defs.length; i += 1) {
      const cell = el("span", "run__cell");
      cell.appendChild(el("b", null, defs[i][0]));
      const value = el("i", null, "--");
      cell.appendChild(value);
      grid.appendChild(cell);
      cells[defs[i][1]] = value;
    }

    const stop = el("button", "run__stop", "Stop");
    stop.type = "button";
    stop.setAttribute("aria-label", "Stop run " + (run.label || run.runId));
    stop.addEventListener("click", function (event) {
      event.stopPropagation();
      if (onStop) onStop(run.runId);
    });

    const foot = el("div", "run__foot");
    foot.appendChild(el("span", "run__id", truncate(run.runId || "", 22)));
    foot.appendChild(stop);

    root.appendChild(top);
    root.appendChild(argv);
    root.appendChild(grid);
    root.appendChild(foot);

    return {
      root: root,
      chip: chip,
      label: label,
      argv: argv,
      cells: cells,
      stop: stop,
      state: run.state || "queued",
      startedAt: typeof run.startedAt === "number" ? run.startedAt : null,
      endedAt: typeof run.endedAt === "number" ? run.endedAt : null,
      exitCode: typeof run.exitCode === "number" ? run.exitCode : null,
      stdout: Number(run.stdoutLines) || 0,
      stderr: Number(run.stderrLines) || 0,
    };
  }

  function applyState(card, state) {
    if (!state) return;
    card.state = state;
    card.root.dataset.state = state;
    card.chip.textContent = String(state).toUpperCase().replace("_", " ");
    card.chip.className = "chip chip--" + state;
    card.stop.hidden = !(state === "running" || state === "queued");
  }

  function applyMeta(card, run) {
    if (!run) return;
    if (run.label) {
      card.label.textContent = run.label;
      card.stop.setAttribute("aria-label", "Stop run " + run.label);
    }
    if (run.kind) card.root.dataset.kind = run.kind;
    if (Array.isArray(run.argv)) {
      const text = formatArgv(run.argv);
      card.argv.textContent = text || "argv pending";
      if (text) card.argv.title = text;
    }
    if (typeof run.startedAt === "number") card.startedAt = run.startedAt;
    if (typeof run.endedAt === "number") card.endedAt = run.endedAt;
    if (typeof run.exitCode === "number") card.exitCode = run.exitCode;
    if (typeof run.stdoutLines === "number") card.stdout = run.stdoutLines;
    if (typeof run.stderrLines === "number") card.stderr = run.stderrLines;
    card.cells.OUT.textContent = fmtNum(card.stdout);
    card.cells.ERR.textContent = fmtNum(card.stderr);
    card.cells.EXIT.textContent = card.exitCode === null ? "--" : String(card.exitCode);
    applyState(card, run.state);
  }

  function trim() {
    while (cards.size > MAX_CARDS) {
      let oldestId = null;
      let oldest = null;
      cards.forEach(function (card, id) {
        if (card.state === "running" || card.state === "queued") return;
        if (!oldest || (card.startedAt || 0) < (oldest.startedAt || 0)) {
          oldest = card;
          oldestId = id;
        }
      });
      if (!oldestId) break;
      cards.delete(oldestId);
      if (oldest && oldest.root.parentNode === listEl) listEl.removeChild(oldest.root);
    }
  }

  function upsert(run) {
    if (!run || !run.runId) return null;
    let card = cards.get(run.runId);
    if (!card) {
      card = build(run);
      cards.set(run.runId, card);
      listEl.insertBefore(card.root, listEl.firstChild);
    }
    applyMeta(card, run);
    trim();
    return card;
  }

  function setState(runId, state, event) {
    let card = cards.get(runId);
    if (!card) {
      card = build({ runId: runId, label: runId, state: state });
      cards.set(runId, card);
      listEl.insertBefore(card.root, listEl.firstChild);
    }
    const data = (event && event.data) || {};
    if (typeof data.stdoutLines === "number") card.stdout = data.stdoutLines;
    if (typeof data.stderrLines === "number") card.stderr = data.stderrLines;
    if (typeof data.exitCode === "number") card.exitCode = data.exitCode;
    if (typeof data.restarts === "number") card.restarts = data.restarts;
    card.cells.OUT.textContent = fmtNum(card.stdout);
    card.cells.ERR.textContent = fmtNum(card.stderr);
    card.cells.EXIT.textContent = card.exitCode === null ? "--" : String(card.exitCode);
    applyState(card, state);
    return card;
  }

  function replaceAll(runs) {
    clear(listEl);
    cards.clear();
    const list = runs || [];
    for (let i = 0; i < list.length; i += 1) upsert(list[i]);
  }

  function tick(now) {
    cards.forEach(function (card) {
      if (card.state !== "running" && card.state !== "queued") return;
      if (card.startedAt === null) return;
      const end = card.endedAt === null ? now : card.endedAt;
      card.cells.TIME.textContent = fmtDur(Math.max(0, end - card.startedAt));
    });
  }

  function activeCount() {
    let n = 0;
    cards.forEach(function (card) {
      if (card.state === "running" || card.state === "queued") n += 1;
    });
    return n;
  }

  function total() {
    return cards.size;
  }

  return {
    upsert: upsert,
    setState: setState,
    replaceAll: replaceAll,
    tick: tick,
    activeCount: activeCount,
    total: total,
    clear: function () {
      clear(listEl);
      cards.clear();
    },
  };
}
