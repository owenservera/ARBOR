# File: .coordination/workflows/ladders-patch.py

> Generated 2026-11-19 · Python · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/workflows/ladders-patch.py |
| Language | Python |
| Kind | source |
| Size | 3142 B |
| Lines | 65 |
| Hash | aa9bdaefc528 |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HOT_M | variable | 3 | yes | HOT_M = &#39;hot(&quot;new-provider/mistralai/mistral-large-4-1t-a52b&quot;)&#39; |
| HOT_3 | variable | 4 | yes | HOT_3 = &#39;hot(&quot;minimax-m-plan/MiniMax-M3&quot;)&#39; |
| HOT_F | variable | 5 | yes | HOT_F = &#39;hot(&quot;minimax-m-plan/MiniMax-M3.1-Flash&quot;)&#39; |
| ladder | function | 7 | yes | def ladder(h1, m1, h2, m2, h3, m3, h4, m4): |
| LADDERS | variable | 11 | yes | LADDERS = { |
| OLD_TRACE | variable | 44 | yes | OLD_TRACE = &#39;verdict = &quot;VERIFIED&quot;;\\n note = &quot;trace-only unit: callers recorded, no product file changed&quot;;&#39; |
| NEW_TRACE | variable | 45 | yes | NEW_TRACE = (&#39;verdict = &quot;CLOSED_NO_CHANGE&quot;;\\n&#39; &#39; note = &quot;trace-and-close unit: the callers were recorded and no product file changed — closed with evidence, no synthetic change&quot;;&#39;) |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| io | import | 1 | external |
| sys | import | 1 | external |
| re | import | 53 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```python
import io, sys

HOT_M = 'hot("new-provider/mistralai/mistral-large-4-1t-a52b")'
HOT_3 = 'hot("minimax-m-plan/MiniMax-M3")'
HOT_F = 'hot("minimax-m-plan/MiniMax-M3.1-Flash")'

def ladder(h1, m1, h2, m2, h3, m3, h4, m4):
    return "const BUILDER = %s ? (%s ? (%s ? %s : %s) : %s) : %s;" % (h1, h2, h3, m3, m4, m2, m1)

# Per-lane role orders so five parallel lanes do not pile onto one provider.
LADDERS = {
    "a": {
        "BUILDER": ladder(HOT_M, "M_MISTRAL", HOT_3, "M_M3", HOT_F, "M_M3F", "M_ERNIE"),
        "PLANNER": 'const PLANNER = %s ? (%s ? M_MISTRAL : M_M3F) : M_M3;' % (HOT_3, HOT_F),
        "VERIFIER": 'const VERIFIER = %s ? (%s ? M_ERNIE : M_M3) : M_M3F;' % (HOT_F, HOT_3),
    },
    "b": {
        "BUILDER": ladder(HOT_3, "M_M3", HOT_F, "M_M3F", HOT_M, "M_MISTRAL", "M_ERNIE"),
        "PLANNER": 'const PLANNER = %s ? (%s ? M_MISTRAL : M_M3F) : M_M3;' % (HOT_F, HOT_M),
        "VERIFIER": 'const VERIFIER = %s ? (%s ? M_ERNIE : M_M3) : M_M3F;' % (HOT_F, HOT_3),
    },
    "c": {
        "BUILDER": ladder(HOT_F, "M_M3F", HOT_3, "M_M3", HOT_M, "M_MISTRAL", "M_ERNIE"),
        "PLANNER": 'const PLANNER = %s ? (%s ? M_MISTRAL : M_M3F) : M_M3;' % (HOT_3, HOT_M),
        "VERIFIER": 'const VERIFIER = %s ? (%s ? M_ERNIE : M_M3) : M_M3F;' % (HOT_3, HOT_F),
    },
    "d": {
        "BUILDER": ladder(HOT_F, "M_M3F", HOT_M, "M_MISTRAL", HOT_3, "M_M3", "M_ERNIE"),
        "PLANNER": 'const PLANNER = %s ? (%s ? M_MISTRAL : M_M3F) : M_M3;' % (HOT_M, HOT_F),
        "VERIFIER": 'const VERIFIER = %s ? (%s ? M_ERNIE : M_M3) : M_M3F;' % (HOT_M, HOT_3),
    },
    "e": {
        "BUILDER": ladder(HOT_M, "M_MISTRAL", HOT_3, "M_M3", HOT_F, "M_M3F", "M_ERNIE"),
        "PLANNER": 'const PLANNER = %s ? (%s ? M_MISTRAL : M_M3F) : M_M3;' % (HOT_3, HOT_F),
        "VERIFIER": 'const VERIFIER = %s ? (%s ? M_ERNIE : M_M3) : M_M3F;' % (HOT_F, HOT_3),
    },
    "integrate": {
        "BUILDER": ladder(HOT_M, "M_MISTRAL", HOT_3, "M_M3", HOT_F, "M_M3F", "M_ERNIE"),
        "PLANNER": 'const PLANNER = %s ? (%s ? M_MISTRAL : M_M3F) : M_M3;' % (HOT_3, HOT_F),
        "VERIFIER": 'const VERIFIER = %s ? (%s ? M_ERNIE : M_M3) : M_M3F;' % (HOT_F, HOT_3),
    },
}

OLD_TRACE = 'verdict = "VERIFIED";\n    note = "trace-only unit: callers recorded, no product file changed";'
NEW_TRACE = ('verdict = "CLOSED_NO_CHANGE";\n'
  '    note = "trace-and-close unit: the callers were recorded and no product file changed — closed with evidence, no synthetic change";')

for key, roles in LADDERS.items():
    path = ".zcode/workflows/%s.dwf.ts" % ("arbor-area-%s" % key if key != "integrate" else "arbor-integrate")
    s = io.open(path, encoding="utf-8").read()
    hits = {}
    for role, new_line in roles.items():
        import re
        pat = re.compile(r"^const %s = .*?;$" % role, re.M)
        m = pat.search(s)
        if m:
            s = s[: m.start()] + new_line + s[m.end():]
            hits[role] = 1
        else:
            hits[role] = 0
    if OLD_TRACE in s:
        s = s.replace(OLD_TRACE, NEW_TRACE)
        hits["trace"] = 1
    io.open(path, "w", encoding="utf-8", newline="").write(s)
    print(path, hits)
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
