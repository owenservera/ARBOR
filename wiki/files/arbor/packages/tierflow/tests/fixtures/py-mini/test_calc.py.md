# File: packages/tierflow/tests/fixtures/py-mini/test_calc.py

> Generated 2026-11-19 · Python · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/fixtures/py-mini/test_calc.py |
| Language | Python |
| Kind | source |
| Size | 366 B |
| Lines | 20 |
| Hash | 1cb369a55af1 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CalcTests | class | 11 | yes | class CalcTests(unittest.TestCase): |
| test_add | method | 12 | yes | def test_add(self): |
| test_mul | method | 15 | yes | def test_mul(self): |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| unittest | import | 6 | external |
| calc | import | 8 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```python
"""Green suite for the py-mini fixture.

Run with:  python -m unittest -v test_calc
"""

import unittest

from calc import add, mul


class CalcTests(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)

    def test_mul(self):
        self.assertEqual(mul(2, 3), 6)


if __name__ == "__main__":
    unittest.main()
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
