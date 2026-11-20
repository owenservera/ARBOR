# File: packages/tierflow/tests/fixtures/py-mini/test_fail.py

> Generated 2026-11-19 · Python · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/fixtures/py-mini/test_fail.py |
| Language | Python |
| Kind | source |
| Size | 516 B |
| Lines | 21 |
| Hash | 4dfa61e2e10c |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FailTests | class | 15 | yes | class FailTests(unittest.TestCase): |
| test_deliberate_failure | method | 16 | yes | def test_deliberate_failure(self): |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| unittest | import | 10 | external |
| calc | import | 12 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```python
"""Deliberately failing suite for the py-mini fixture.

Run with:  python -m unittest -v test_fail

It exists so the executor can prove that a failing test suite propagates as a
non-zero exit code and a "failed" run state instead of being swallowed. It is
never part of the green suite.
"""

import unittest

from calc import add


class FailTests(unittest.TestCase):
    def test_deliberate_failure(self):
        self.assertEqual(add(2, 3), 6)


if __name__ == "__main__":
    unittest.main()
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
