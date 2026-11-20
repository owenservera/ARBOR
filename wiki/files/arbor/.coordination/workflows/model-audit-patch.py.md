# File: .coordination/workflows/model-audit-patch.py

> Generated 2026-11-19 · Python · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/workflows/model-audit-patch.py |
| Language | Python |
| Kind | source |
| Size | 1733 B |
| Lines | 45 |
| Hash | 2dffb46ddcf3 |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ID_M | variable | 3 | yes | ID_M = &quot;new-provider/mistralai/mistral-large-4-1t-a52b&quot; |
| ID_3 | variable | 4 | yes | ID_3 = &quot;minimax-m-plan/MiniMax-M3&quot; |
| ID_F | variable | 5 | yes | ID_F = &quot;minimax-m-plan/MiniMax-M3.1-Flash&quot; |
| ID_E | variable | 6 | yes | ID_E = &quot;openrouter-2/baidu/ernie-5.5-flash-preview:free&quot; |
| ID_L | variable | 7 | yes | ID_L = &quot;openrouter-2/inclusionai/ling-3.2-flash:free&quot; |
| VERIFIER_BLOCK | variable | 10 | yes | VERIFIER_BLOCK = &#39;&#39;&#39;const VERIFIER = ((): ModelRef =&gt; { // Independent verification: the verifier is never the builder&#39;s model. const pool: [ModelRef, string][] = [[M_M3F, &quot;%s&quot;], [M_M3, &quot;%s&quot;], [M_ERN… |
| TRACE_LINE | variable | 20 | yes | TRACE_LINE = &#39;const TRACE = hot(&quot;%s&quot;) ? (hot(&quot;%s&quot;) ? M_M3 : M_M3F) : M_ERNIE;&#39; % (ID_E, ID_F) |
| TRIAGE_LINE | variable | 21 | yes | TRIAGE_LINE = &#39;const TRIAGE = hot(&quot;%s&quot;) ? (hot(&quot;%s&quot;) ? M_M3 : M_M3F) : M_LING;&#39; % (ID_L, ID_F) |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| io | import | 1 | external |
| re | import | 1 | external |
| sys | import | 1 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```python
import io, re, sys

ID_M = "new-provider/mistralai/mistral-large-4-1t-a52b"
ID_3 = "minimax-m-plan/MiniMax-M3"
ID_F = "minimax-m-plan/MiniMax-M3.1-Flash"
ID_E = "openrouter-2/baidu/ernie-5.5-flash-preview:free"
ID_L = "openrouter-2/inclusionai/ling-3.2-flash:free"

# 1. verifier must never be the same model as the builder
VERIFIER_BLOCK = '''const VERIFIER = ((): ModelRef => {
  // Independent verification: the verifier is never the builder's model.
  const pool: [ModelRef, string][] = [[M_M3F, "%s"], [M_M3, "%s"], [M_ERNIE, "%s"]];
  for (const pair of pool) {
    if (pair[0] !== BUILDER && !hot(pair[1])) return pair[0];
  }
  return BUILDER === M_M3F ? M_M3 : M_M3F;
})();''' % (ID_F, ID_3, ID_E)

# 2. trace and triage get fallbacks (the free models throttle invisibly, so they are only ever the first choice)
TRACE_LINE = 'const TRACE = hot("%s") ? (hot("%s") ? M_M3 : M_M3F) : M_ERNIE;' % (ID_E, ID_F)
TRIAGE_LINE = 'const TRIAGE = hot("%s") ? (hot("%s") ? M_M3 : M_M3F) : M_LING;' % (ID_L, ID_F)

for path in sys.argv[1:]:
    s = io.open(path, encoding="utf-8").read()
    hits = {}
    m = re.search(r"^const VERIFIER = .*?;$", s, re.M)
    if m:
        s = s[: m.start()] + VERIFIER_BLOCK + s[m.end():]
        hits["verifier"] = 1
    else:
        hits["verifier"] = 0
    m = re.search(r"^const TRACE = .*?;$", s, re.M)
    if m:
        s = s[: m.start()] + TRACE_LINE + s[m.end():]
        hits["trace"] = 1
    else:
        hits["trace"] = 0
    m = re.search(r"^const TRIAGE = .*?;$", s, re.M)
    if m:
        s = s[: m.start()] + TRIAGE_LINE + s[m.end():]
        hits["triage"] = 1
    else:
        hits["triage"] = 0
    io.open(path, "w", encoding="utf-8", newline="").write(s)
    print(path, hits)
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
