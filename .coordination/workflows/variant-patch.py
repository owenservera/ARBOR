import io, sys

SRC = "e07e61385a53f30890b4a7f7441fe25d22a79b1c"

OLD_COLS = "only Runtime test and Production reachability (plus Disposition / Current state / Notes) may be updated, "
NEW_COLS = ("Allowed to change: Review HEAD (always the pinned source sha " + SRC + "), Runtime test (always the literal "
  "string UNRUN), Production reachability, Evidence detail / anchor, Disposition, Current state. Notes and every identity "
  "column are protected and must never appear in changes[][]. ")

NEW_TRACE_LINE = ('ask = "TRACE-AND-CLOSE UNIT — these ledger rows are call-trace rows. In " + ROOT_HINT + ", trace the actual '
  'callers of: " + owned + ". Where the trace exposes a real gap, IMPLEMENT the smallest real change that closes it (real code '
  'plus a real test). Where the trace proves the row needs no code, close it with the caller evidence — a justified '
  'no-change closure is valid; a fabricated change to look busy is not. " +')

OLD_TAIL = "Report JSON {changes, discoveries, status, summary, createdTest}. Do not edit anything."
NEW_TAIL = "Report JSON {changes, discoveries, status, summary, createdTest}. Do not leave the row unresolved and do not fabricate a change."

NEW_WRITER_LINE = ('"Every change MUST set Review HEAD = ' + SRC + ' and Runtime test = \\"UNRUN\\" (the ledger is static: '
  'ledger-maintenance.py:160 rejects any other Runtime test value as an Unsupported evidence upgrade, so a delta carrying a real '
  'exit code there fails the whole merge). Put the real runtime result in Production reachability (the caller that proves the row '
  'is reached, with path:line) and Evidence detail / anchor (e.g. \\"gate <cmd> exit <n> @ <commit sha>\\"); the receipt lives in '
  '.coordination/evidence/, docs/product/roadmap/receipts/ and the unit commit. This unit\'s gate was " + gateFor(u).command + '
  ' " with exit " + v.gateExit + ". " +')

for path in sys.argv[1:]:
    lines = io.open(path, encoding="utf-8").read().split("\n")
    out, hits = [], {"trace": 0, "tail": 0, "cols": 0, "writer": 0}
    for l in lines:
        indent = l[: len(l) - len(l.lstrip())]
        if "TRACE UNIT" in l:
            l = indent + NEW_TRACE_LINE
            hits["trace"] += 1
        elif "The two columns this run exists to fill are Runtime test" in l:
            l = indent + NEW_WRITER_LINE
            hits["writer"] += 1
        if OLD_TAIL in l:
            l = l.replace(OLD_TAIL, NEW_TAIL)
            hits["tail"] += 1
        if OLD_COLS in l:
            l = l.replace(OLD_COLS, NEW_COLS)
            hits["cols"] += 1
        out.append(l)
    io.open(path, "w", encoding="utf-8", newline="").write("\n".join(out))
    print(path, hits)
