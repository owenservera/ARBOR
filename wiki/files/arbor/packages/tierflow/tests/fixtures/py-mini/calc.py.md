# File: packages/tierflow/tests/fixtures/py-mini/calc.py

> Generated 2026-11-19 · Python · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/fixtures/py-mini/calc.py |
| Language | Python |
| Kind | source |
| Size | 319 B |
| Lines | 15 |
| Hash | bd90bd514bb8 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| add | function | 8 | yes | def add(a, b): |
| mul | function | 13 | yes | def mul(a, b): |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```python
"""Minimal Python module used as an unrelated-project fixture.

Deliberately dependency-free: standard library only, no packaging, no git,
no HQ.
"""


def add(a, b):
    """Return the sum of two numbers."""
    return a + b


def mul(a, b):
    """Return the product of two numbers."""
    return a * b
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
