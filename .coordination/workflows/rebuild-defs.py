import io, re, sys, pathlib

D = pathlib.Path("C:/0-BlackBoxProject-0/ARBOR/.zcode/workflow-drafts")
W = pathlib.Path("C:/0-BlackBoxProject-0/ARBOR/.zcode/workflows")

# current (truncated) def -> newest FULL draft
PAIRS = {
    "arbor-area-a.dwf.ts": "arbor-area-a-Rust-core--HQHVI-3.dwf.ts",
    "arbor-area-b.dwf.ts": "arbor-area-b-Host--Harness-3.dwf.ts",
    "arbor-area-c.dwf.ts": "arbor-area-c-Studio-2.dwf.ts",
    "arbor-area-d.dwf.ts": "arbor-area-d-PWA--TierFlow-2.dwf.ts",
    "arbor-area-e.dwf.ts": "arbor-area-e-Foundations-3.dwf.ts",
    "arbor-integrate.dwf.ts": "arbor-integrate-cross-component--ledger-merge--repo-gate.dwf.ts",
}

VOLD = '''      if (v.pass) {
        verdict = "VERIFIED";
        note = "verifier accepted; gate exit " + gateExit;
        break;
      }'''
VNEW = '''      if (v.pass) {
        // No opinion override: the deterministic gate exit code decides. The verifier
        // at most names the failure; gateExit !== 0 keeps the verdict REPLAN.
        note = "verifier found no concrete failure, but gate exit " + gateExit + " stands — no override";
        break;
      }'''
TOLD = '''  } else {
    verdict = "CLOSED_NO_CHANGE";
    note = "trace-and-close unit: the callers were recorded and no product file changed — closed with evidence, no synthetic change";
  }'''
TNEW = '''  } else if (gateExit === 0) {
    verdict = "CLOSED_NO_CHANGE";
    note = "trace-and-close unit: gate exit 0, callers recorded, no product file changed — closed with evidence, no synthetic change";
  } else {
    verdict = "REPLAN";
    note = "trace-and-close unit but gate exit " + gateExit + " — a red gate is never a closure; replan";
  }'''
RULE1B_OLD = "never select it; "
RULE1B_NEW = "never select it; (1b) a unit with `implRows` equal to `rowCount` is fully IMPLEMENTED in the reconciled ledger (already landed in ARBOR) - already done, never select it; "
RETOLD = 'verdict: "CLOSED_NO_CHANGE", gateExit: -1, gateCommand: "no code needed — closed with the caller evidence", repairs: 0, note: "closed with caller evidence: "'
RETNEW = 'verdict: "CLOSED_NO_CHANGE", gateExit: tg.exitCode, gateCommand: gate.command, repairs: 0, note: "gate exit 0 + caller evidence: "'
C_ANCHOR = '      delta.status = "closed";\n      delta.summary = "closed with evidence: " + traceEvidence;'
C_GATE = '''      const tg = await world.run("node", gate.args, { timeoutMs: 1800000, output: { tail: 4096 } });
      if (tg.exitCode !== 0) {
        return { unit: u.id, phase: u.phase, verdict: "REPLAN", gateExit: tg.exitCode, gateCommand: gate.command, repairs: 0, note: "trace closure refused: gate " + gate.command + " exit " + tg.exitCode + " — a red gate is never a closure", ownedChanged: [], evidence: traceEvidence };
      }
      delta.status = "closed";
      delta.summary = "closed with evidence: " + traceEvidence;'''

def uniqname(s):
    counts = {}
    def repl(m):
        role = m.group(2)
        n = counts.get(role, 0)
        counts[role] = n + 1
        if n == 0:
            return m.group(0)
        suffix = chr(ord("x") + n - 1)
        return m.group(1) + ' + "' + suffix + '"' + m.group(3)
    s2 = re.sub(r'^(\s*const \w+ = agent\("Lane [A-E] (builder|verifier|tracer) " \+ u\.id \+ " w" \+ round)(,.*)$', repl, s, flags=re.M)
    return s2, counts

for defname, draftname in PAIRS.items():
    head = io.open(W / defname, encoding="utf-8").read()
    draft = io.open(D / draftname, encoding="utf-8").read()
    # tail = draft text after its FIRST roles log line
    m = re.search(r'^log\("(?:Lane [A-E]|Integration) roles: .*$', draft, re.M)
    if not m:
        print(defname, "NO ROLES LOG IN DRAFT", draftname); continue
    tail = draft[m.end():]
    new = head.rstrip("\n") + "\n" + tail.lstrip("\n")
    hits = {}
    if "implRows" not in new:
        hits["rule1b"] = new.count(RULE1B_OLD)
        new = new.replace(RULE1B_OLD, RULE1B_NEW, 1)
    hits["verifier"] = new.count(VOLD); new = new.replace(VOLD, VNEW)
    hits["trace-else"] = new.count(TOLD); new = new.replace(TOLD, TNEW)
    hits["trace-ret"] = new.count(RETOLD); new = new.replace(RETOLD, RETNEW)
    hits["c-gate-anchor"] = new.count(C_ANCHOR); new = new.replace(C_ANCHOR, C_GATE)
    if "arbor-area-c" in defname or "arbor-area-d" in defname or "arbor-area-e" in defname:
        pat = re.compile(r'^(\s*const \w+ = agent\("Lane [A-E] (builder) " \+ u\.id \+ " w" \+ round)(,.*)$', re.M)
        cnt = {}
        def rp(m):
            role = m.group(2); n = cnt.get(role, 0); cnt[role] = n + 1
            if n == 0: return m.group(0)
            return m.group(1) + ' + "' + chr(ord("x") + n - 1) + '"' + m.group(3)
        new = pat.sub(rp, new)
        hits["uniq-builder"] = cnt
    hits["M_LING->M_M3"] = new.count("M_LING"); new = new.replace("M_LING", "M_M3")
    hits["M_MISTRAL->M_SUPER"] = new.count("M_MISTRAL"); new = new.replace("M_MISTRAL", "M_SUPER")
    lines = new.count("\n") + 1
    braces = new.count("{") - new.count("}")
    (W / defname).write_text(new, encoding="utf-8", newline="")
    print(defname, "lines:", lines, "braces:", braces, hits)
