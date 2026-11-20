import io, sys

# Mechanism fix: a red deterministic gate is never overridden by an AI verifier,
# and a trace-only unit is never CLOSED_NO_CHANGE on a failed gate.
VOLD = """      if (v.pass) {
        verdict = "VERIFIED";
        note = "verifier accepted; gate exit " + gateExit;
        break;
      }"""
VNEW = """      if (v.pass) {
        // No opinion override: the deterministic gate exit code decides. The verifier
        // at most names the failure; gateExit !== 0 keeps the verdict REPLAN.
        note = "verifier found no concrete failure, but gate exit " + gateExit + " stands — no override";
        break;
      }"""
TOLD = """  } else {
    verdict = "CLOSED_NO_CHANGE";
    note = "trace-and-close unit: the callers were recorded and no product file changed — closed with evidence, no synthetic change";
  }"""
TNEW = """  } else if (gateExit === 0) {
    verdict = "CLOSED_NO_CHANGE";
    note = "trace-and-close unit: gate exit 0, callers recorded, no product file changed — closed with evidence, no synthetic change";
  } else {
    verdict = "REPLAN";
    note = "trace-and-close unit but gate exit " + gateExit + " — a red gate is never a closure; replan";
  }"""

for p in sys.argv[1:]:
    s = io.open(p, encoding="utf-8").read()
    v = s.count(VOLD); t = s.count(TOLD)
    s = s.replace(VOLD, VNEW).replace(TOLD, TNEW)
    io.open(p, "w", encoding="utf-8", newline="").write(s)
    print(p, "verifier-override:", v, "trace-closure:", t)
