# File: .coordination/workflows/degate-patch.py

> Generated 2026-11-19 · Python · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | .coordination/workflows/degate-patch.py |
| Language | Python |
| Kind | source |
| Size | 4444 B |
| Lines | 64 |
| Hash | d5773dd248af |
| Test | no |
| Generated | no |
| Component | .coordination |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PATCHES | variable | 5 | yes | PATCHES = [ |
| apply | function | 46 | yes | def apply(path): |

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
import io, sys, re

# De-gating + no-synthetic-work patch for the lane workflows (owner directive:
# remove procedural blockers/gates, ensure every unit is real code / real enablement).
PATCHES = [
    # 1. batch boundary, not a ceiling
    ("const SAFETY_UNITS = 24;", "const SAFETY_UNITS = 200; // batch boundary only — the next launch continues where this one stopped"),
    ("const maxUnits = Math.min(budget, SAFETY_UNITS);",
     "const maxUnits = budget; // no cap: budget defaults to the batch boundary and the next run resumes"),
    # 2. trace units must end in real work or an evidence-backed no-change closure
    ('? "TRACE UNIT — change no product file. In " + ROOT_HINT + ", trace the actual callers of: " + owned + ". " +',
     '? "TRACE-AND-CLOSE UNIT — these ledger rows are call-trace rows. In " + ROOT_HINT + ", trace the actual callers of: " + owned + ". Where the trace exposes a real gap, IMPLEMENT the smallest real change that closes it (real code plus a real test). Where the trace proves the row needs no code, close it with the caller evidence — a justified no-change closure is valid; a fabricated change to look busy is not. " +'),
    ('"Report JSON {changes, discoveries, status, summary, createdTest}. Do not edit anything."',
     '"Report JSON {changes, discoveries, status, summary, createdTest}. Do not leave the row unresolved and do not fabricate a change."'),
    # 3. verdict vocabulary
    ('verdict: "VERIFIED" | "REPLAN" | "BLOCKED" | "SLOT_VIOLATION" | "LANE_PRIORITY_YIELD";',
     'verdict: "VERIFIED" | "REPLAN" | "BLOCKED" | "SLOT_VIOLATION" | "LANE_PRIORITY_YIELD" | "INCONCLUSIVE" | "CLOSED_NO_CHANGE";'),
    # 4. no-diff closure is its own honest verdict, not a silent skip
    ('  let verdict: Verdict["verdict"] = gateExit === 0 ? "VERIFIED" : "REPLAN";\n'
     '  let note = "gate exit " + gateExit + " (" + gate.command + "); changed=" + changed.length + " outside-owned=" + outside.length;',
     '  let verdict: Verdict["verdict"] = gateExit === 0 ? "VERIFIED" : "REPLAN";\n'
     '  let note = "gate exit " + gateExit + " (" + gate.command + "); changed=" + changed.length + " outside-owned=" + outside.length;\n'
     '  if (gateExit === 0 && changed.length === 0) {\n'
     '    verdict = "CLOSED_NO_CHANGE";\n'
     '    note = "gate exit 0 (" + gate.command + ") with no owned file changed — closed with evidence instead of code; no synthetic change was invented";\n'
     '  }\n'
     '  if (gateExit === 2) {\n'
     '    // r004 preflight (dirty checkout / unpinned SHA / node<24) says nothing about the code: not a failure, not a pass.\n'
     '    verdict = "INCONCLUSIVE";\n'
     '    note = "gate " + gate.command + " exited 2 (preflight: dirty checkout / unpinned SHA / node<24) — no statement about the code; re-run when the tree is clean and pinned";\n'
     '    return { unit: u.id, phase: u.phase, verdict: verdict, gateExit: gateExit, gateCommand: gate.command, repairs: 0, note: note, ownedChanged: [] };\n'
     '  }'),
    # 5. summary counts the honest outcomes separately
    ('const verifiedUnits = verdicts.filter((v) => v.verdict === "VERIFIED");',
     'const verifiedUnits = verdicts.filter((v) => v.verdict === "VERIFIED");\n'
     'const closedNoChange = verdicts.filter((v) => v.verdict === "CLOSED_NO_CHANGE");\n'
     'const inconclusive = verdicts.filter((v) => v.verdict === "INCONCLUSIVE");\n'
     'const yielded = verdicts.filter((v) => v.verdict === "LANE_PRIORITY_YIELD");'),
    ('  "- Verified: " + verifiedUnits.length + "/" + verdicts.length,',
     '  "- Verified with code: " + verifiedUnits.length + "/" + verdicts.length,\n'
     '  "- Closed with evidence, no code needed: " + closedNoChange.length + ",\n'
     '  "- Inconclusive gate preflight (neither pass nor fail): " + inconclusive.length + ",\n'
     '  "- Yielded to the lane that owns the path: " + yielded.length + ",",'),
]

def apply(path):
    src = io.open(path, encoding="utf-8").read()
    orig = src
    hits = []
    for old, new in PATCHES:
        n = src.count(old)
        if n == 0:
            hits.append((old[:60], 0))
            continue
        src = src.replace(old, new)
        hits.append((old[:60], n))
    if src != orig:
        io.open(path, "w", encoding="utf-8", newline="").write(src)
    return hits

for p in sys.argv[1:]:
    print("==", p)
    for k, n in apply(p):
        print(("   OK  x%d" % n) if n else ("   MISS " + k))
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
