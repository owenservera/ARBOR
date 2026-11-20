# File: packages/tierflow/tests/fixtures/py-mini/README.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/fixtures/py-mini/README.md |
| Language | Markdown |
| Kind | doc |
| Size | 470 B |
| Lines | 17 |
| Hash | 6eb5d05a5920 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````markdown
# py-mini

A minimal Python project that has nothing to do with TierFlow.

- no git repository
- no HQ tooling, no `.hq`, no index
- standard library only, no virtualenv, no install step

Suites:

```sh
python -m unittest -v test_calc   # green suite -> exit 0
python -m unittest -v test_fail   # red suite   -> exit 1
```

The suites are selected by module name on purpose: `unittest discover` would
sweep in `test_fail.py` and turn the green run red.
````

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
