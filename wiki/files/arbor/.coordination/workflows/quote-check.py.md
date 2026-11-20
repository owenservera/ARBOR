# File: .coordination/workflows/quote-check.py

> Generated 2026-11-19 · Python · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/workflows/quote-check.py |
| Language | Python |
| Kind | source |
| Size | 588 B |
| Lines | 25 |
| Hash | 9a04e1ec97f3 |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| scan | function | 3 | yes | def scan(path): |

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

def scan(path):
    lines = io.open(path, encoding="utf-8").read().split("\n")
    bad = []
    for i, l in enumerate(lines, 1):
        n = 0
        esc = False
        for ch in l:
            if esc:
                esc = False
                continue
            if ch == "\\":
                esc = True
                continue
            if ch == '"':
                n += 1
        if n % 2 == 1:
            bad.append((i, l))
    return bad

for p in sys.argv[1:]:
    print("==", p)
    for i, l in scan(p):
        print("  L%d q=odd :: %s" % (i, l[:170]))
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
