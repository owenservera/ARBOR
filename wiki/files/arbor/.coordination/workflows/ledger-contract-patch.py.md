# File: .coordination/workflows/ledger-contract-patch.py

> Generated 2026-11-19 · Python · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/workflows/ledger-contract-patch.py |
| Language | Python |
| Kind | source |
| Size | 3827 B |
| Lines | 52 |
| Hash | 3e96a9a7da3e |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SRC | variable | 3 | yes | SRC = &quot;e07e61385a53f30890b4a7f7441fe25d22a79b1c&quot; |
| OLD_BUILDER | variable | 5 | yes | OLD_BUILDER = &#39; &quot;Field names must be the ledger\\&#39;s own columns; only Runtime test and Production reachability (plus Disposition / Current state / Notes) may be updated, &quot; +&#39; |
| NEW_BUILDER | variable | 6 | yes | NEW_BUILDER = (&#39; &quot;Field names must be the ledger\\&#39;s own columns. Allowed to change: Review HEAD (always the pinned source sha &#39; + SRC + &#39;), &#39; &#39;Runtime test (always the literal string UNRUN), Producti… |
| OLD_WRITER | variable | 10 | yes | OLD_WRITER = (&#39; &quot;The two columns this run exists to fill are Runtime test (the REAL exit code of &quot; + gateFor(u).command + &#39; &#39;&quot; — exit &quot; + v.gateExit + &quot;) and Production reachability (the caller that … |
| NEW_WRITER | variable | 12 | yes | NEW_WRITER = (&#39; &quot;Every change MUST set Review HEAD = &#39; + SRC + &#39; and Runtime test = \\\\&quot;UNRUN\\\\&quot; (the ledger is static: &#39; &#39;ledger-maintenance.py:160 rejects any other Runtime test value as an Unsuppor… |
| OLD_META | variable | 18 | yes | OLD_META = (&#39; unit in this lane; a runtime safety valve of 24 units ends the run and the\\n next launch resumes.&#39;) |
| NEW_META | variable | 19 | yes | NEW_META = (&#39; unit in this lane; a batch boundary of 200 units ends this run and the next\\n launch continues where it stopped.&#39;) |
| OLD_HDR_A | variable | 21 | yes | OLD_HDR_A = (&#39;// `Runtime test` is UNRUN on ALL 4741 rows and no row has both a runtime\\n&#39; &#39;// result and a production-reachability proof — filling exactly those two\\n&#39; &#39;// columns is this workflow\\&#39;… |
| NEW_HDR | variable | 24 | yes | NEW_HDR = (&#39;// `Runtime test` stays &quot;UNRUN&quot; on every row (the ledger is static —\\n&#39; &#39;// ledger-maintenance.py rejects any other value as an evidence upgrade); the real\\n&#39; &#39;// runtime result lands in … |
| OLD_HDR_B | variable | 31 | yes | OLD_HDR_B = (&#39;// blank `Implementation unit / dedup key`) / VERIFY 128. `Runtime test` is\\n&#39; |
| NEW_HDR_B | variable | 34 | yes | NEW_HDR_B = (&#39;// blank `Implementation unit / dedup key`) / VERIFY 128. `Runtime test` stays\\n&#39; |
| PAIRS | variable | 41 | yes | PAIRS = [(OLD_BUILDER, NEW_BUILDER), (OLD_WRITER, NEW_WRITER), (OLD_META, NEW_META), |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| io | import | 1 | external |
| sys | import | 1 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```python
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
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
