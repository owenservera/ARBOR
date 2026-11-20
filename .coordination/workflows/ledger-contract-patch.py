import io, sys

SRC = "e07e61385a53f30890b4a7f7441fe25d22a79b1c"

OLD_BUILDER = '      "Field names must be the ledger\'s own columns; only Runtime test and Production reachability (plus Disposition / Current state / Notes) may be updated, " +'
NEW_BUILDER = ('      "Field names must be the ledger\'s own columns. Allowed to change: Review HEAD (always the pinned source sha ' + SRC + '), '
  'Runtime test (always the literal string UNRUN), Production reachability, Evidence detail / anchor, Disposition, Current state. '
  'Notes and every identity column are protected and must never appear in changes[]. " +')

OLD_WRITER = ('    "The two columns this run exists to fill are Runtime test (the REAL exit code of " + gateFor(u).command + '
  '" — exit " + v.gateExit + ") and Production reachability (the caller that proves the row is reached, with path:line). " +')
NEW_WRITER = ('    "Every change MUST set Review HEAD = ' + SRC + ' and Runtime test = \\"UNRUN\\" (the ledger is static: '
  'ledger-maintenance.py:160 rejects any other Runtime test value as an Unsupported evidence upgrade, so a delta carrying a real exit code there '
  'fails the whole merge). Put the real runtime result in Production reachability (the caller that proves the row is reached, with path:line) '
  'and Evidence detail / anchor (e.g. \\"gate <cmd> exit <n> @ <commit sha>\\"); the receipt lives in .coordination/evidence/, '
  'docs/product/roadmap/receipts/ and the unit commit. This unit\'s gate was " + gateFor(u).command + " with exit " + v.gateExit + ". " +')

OLD_META = ('      unit in this lane; a runtime safety valve of 24 units ends the run and the\n      next launch resumes.')
NEW_META = ('      unit in this lane; a batch boundary of 200 units ends this run and the next\n      launch continues where it stopped.')

OLD_HDR_A = ('//   `Runtime test` is UNRUN on ALL 4741 rows and no row has both a runtime\n'
  '//   result and a production-reachability proof — filling exactly those two\n'
  '//   columns is this workflow\'s verification contract.')
NEW_HDR = ('//   `Runtime test` stays "UNRUN" on every row (the ledger is static —\n'
  '//   ledger-maintenance.py rejects any other value as an evidence upgrade); the real\n'
  '//   runtime result lands in `Production reachability` + `Evidence detail / anchor`,\n'
  '//   and the receipt lands in .coordination/evidence/ + docs/product/roadmap/receipts/.\n'
  '//   No row carries a production-reachability proof today — filling it is this\n'
  '//   workflow\'s verification contract.')

OLD_HDR_B = ('//   blank `Implementation unit / dedup key`) / VERIFY 128. `Runtime test` is\n'
  '//   UNRUN on every row of the ledger, so filling it with a real exit code and\n'
  '//   `Production reachability` with a caller is this workflow\'s whole contract.')
NEW_HDR_B = ('//   blank `Implementation unit / dedup key`) / VERIFY 128. `Runtime test` stays\n'
  '//   "UNRUN" on every row (the ledger is static — ledger-maintenance.py rejects any\n'
  '//   other value as an evidence upgrade); the real runtime result lands in\n'
  '//   `Production reachability` + `Evidence detail / anchor`, the receipt in\n'
  '//   .coordination/evidence/ + docs/product/roadmap/receipts/. No row carries a\n'
  '//   production-reachability proof today — filling it is this workflow\'s contract.')

PAIRS = [(OLD_BUILDER, NEW_BUILDER), (OLD_WRITER, NEW_WRITER), (OLD_META, NEW_META),
         (OLD_HDR_A, NEW_HDR), (OLD_HDR_B, NEW_HDR_B)]

for p in sys.argv[1:]:
    s = io.open(p, encoding="utf-8").read()
    print("==", p)
    for old, new in PAIRS:
        n = s.count(old)
        if n:
            s = s.replace(old, new)
        print(("   OK   x%d" % n) if n else "   MISS " + old[:58].replace("\n", " "))
    io.open(p, "w", encoding="utf-8", newline="").write(s)
