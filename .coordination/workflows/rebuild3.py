#!/usr/bin/env python3
"""rebuild3.py — rebuild the five lane defs: truncated head (all 18:27 fixes) +
source-form tail from the newest full draft, then relane2 (round-unique names,
declared editedPaths), unique-name suffixes, trace-gate + gate-truth, planner
rule 1b, and the glm + ernie + NIM role block (minimax cold, zero references).
Integrate was already rebuilt in pass 1 (source-form draft) — roles swap only.
Run with python -I from the ARBOR workspace."""
import io, re, subprocess, sys, pathlib, json

W = pathlib.Path(".zcode/workflows")
DR = pathlib.Path(".zcode/workflow-drafts")

PAIRS = {
    "arbor-area-a.dwf.ts": "arbor-area-a-Rust-core--HQHVI-3.dwf.ts",
    "arbor-area-b.dwf.ts": "arbor-area-b-Host--Harness-3.dwf.ts",
    "arbor-area-c.dwf.ts": "arbor-area-c-Studio-2.dwf.ts",
    "arbor-area-d.dwf.ts": "arbor-area-d-PWA--TierFlow-2.dwf.ts",
    "arbor-area-e.dwf.ts": "arbor-area-e-Foundations-3.dwf.ts",
}

LOGPAT = re.compile(r'log\("[^\n]*roles: builder=[^\n]*')

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
RETNEW = 'verdict: "CLOSED_NO_CHANGE", gateExit: {TGV}.exitCode, gateCommand: gate.command, repairs: 0, note: "gate exit 0 + caller evidence: "'
C_ANCHOR = '      delta.status = "closed";\n      delta.summary = "closed with evidence: " + traceEvidence;'
DE_ANCHOR = '      return { unit: u.id, phase: u.phase, verdict: "CLOSED_NO_CHANGE", gateExit: '

def gate_guard(name):
    return ('      const ' + name + ' = await world.run("node", gate.args, { timeoutMs: 1800000, output: { tail: 4096 } });\n'
            '      if (' + name + '.exitCode !== 0) {\n'
            '        return { unit: u.id, phase: u.phase, verdict: "REPLAN", gateExit: ' + name + '.exitCode, gateCommand: gate.command, repairs: 0, note: "trace closure refused: gate " + gate.command + " exit " + ' + name + '.exitCode + " — a red gate is never a closure", ownedChanged: [], evidence: traceEvidence };\n'
            '      }\n')

def gate_guard_cargo(name):
    return ('      const ' + name + ' = gate.args[0] === "cargo"\n'
            '        ? await world.run("cargo", gate.args, { timeoutMs: 900000, output: { tail: 4096 } })\n'
            '        : await world.run("node", gate.args, { timeoutMs: 600000, output: { tail: 4096 } });\n'
            '      if (' + name + '.exitCode !== 0) {\n'
            '        return { unit: u.id, phase: u.phase, verdict: "REPLAN", gateExit: ' + name + '.exitCode, gateCommand: gate.command, repairs: 0, note: "trace closure refused: gate " + gate.command + " exit " + ' + name + '.exitCode + " — a red gate is never a closure", ownedChanged: [], evidence: traceEvidence };\n'
            '      }\n')

ROLES = '''const BUILDER = hot("new-provider/nvidia/nemotron-3.5-super-vl-120b-a12b") ? M_GLM : M_SUPER;
const PLANNER = hot("new-provider-3/glm-5.3-flash") ? M_SUPER : M_GLM;
// Independent verification: the verifier is never the builder's model.
const VERIFIER = ((): ModelRef => {
  const pool: [ModelRef, string][] = [[M_GLM, "new-provider-3/glm-5.3-flash"], [M_ERNIE, "openrouter-2/baidu/ernie-5.5-flash-preview:free"], [M_LIGHTNING, "new-provider/nvidia/nemotron-3.5-lightning-30b-a3b"]];
  for (const pair of pool) {
    if (pair[0] !== BUILDER && !hot(pair[1])) return pair[0];
  }
  return BUILDER === M_GLM ? M_LIGHTNING : M_GLM;
})();
const TRACE = hot("openrouter-2/baidu/ernie-5.5-flash-preview:free") ? M_NANO : M_ERNIE;
const TRIAGE = hot("new-provider-3/glm-5.3-flash") ? M_LIGHTNING : M_GLM;
log("Lane roles: builder=" + (BUILDER === M_GLM ? "glm-5.3" : "nemotron-super-vl") + " planner=" + (PLANNER === M_GLM ? "glm-5.3" : "nemotron-super-vl") + " verifier=" + (VERIFIER === M_GLM ? "glm-5.3" : VERIFIER === M_ERNIE ? "ernie" : "nemotron-lightning") + " trace=" + (TRACE === M_ERNIE ? "ernie" : "nemotron-nano") + " triage=" + (TRIAGE === M_GLM ? "glm-5.3" : "nemotron-lightning") + " (owner pool: glm + ernie + NIM; minimax cold)")'''

M3_PAT = re.compile(r'const M_M3 = model\("minimax-m-plan/MiniMax-M3(\.\$max)?\);?"\);\n|const M_M3F = model\("minimax-m-plan/MiniMax-M3\.1-Flash(\.\$max)?"\);\n', )

report = {}
for defname, draftname in PAIRS.items():
    head = io.open(W / defname, encoding="utf-8").read()
    draft = io.open(DR / draftname, encoding="utf-8").read()
    hm = LOGPAT.search(head)
    dm = LOGPAT.search(draft)
    if not hm or not dm:
        report[defname] = "NO LOG ANCHOR"; continue
    s = head[: hm.end()] + "\n" + draft[dm.end():].lstrip("\n")
    (W / defname).write_text(s, encoding="utf-8", newline="")
    r = subprocess.run([sys.executable, "-I", ".coordination/workflows/relane2.py", str(W / defname)],
                       capture_output=True, text=True)
    hits = {"relane2": r.stdout.strip()[-220:] or r.stderr.strip()[-220:]}
    s = io.open(W / defname, encoding="utf-8").read()
    r2 = subprocess.run([sys.executable, "-I", ".coordination/workflows/uniqname-patch.py", str(W / defname)],
                        capture_output=True, text=True)
    hits["uniq"] = r2.stdout.strip().split("{")[-1][:80] if "{" in r2.stdout else r2.stderr.strip()[-120:]
    s = io.open(W / defname, encoding="utf-8").read()
    t = {}
    t["verifier"] = s.count(VOLD); s = s.replace(VOLD, VNEW)
    t["trace-else"] = s.count(TOLD); s = s.replace(TOLD, TNEW)
    t["ret"] = s.count(RETOLD)
    t["c-anchor"] = s.count(C_ANCHOR)
    # C: gate run before each delta.status="closed"; pair with the RETOLD occurrence order
    if "arbor-area-c" in defname:
        parts = s.split(C_ANCHOR)
        s = parts[0]
        for i in range(1, len(parts)):
            name = "tg" if i == 1 else "tg" + str(i)
            s += gate_guard_cargo(name) + C_ANCHOR + parts[i]
        # RETOLD returns reference tgN in order
        for i in range(1, t["c-anchor"] + 1):
            name = "tg" if i == 1 else "tg" + str(i)
            s = s.replace(RETOLD, RETNEW.replace("{TGV}", name), 1)
    else:
        # D/E: insert gate run right before each trace CLOSED return
        out = []
        idx = 0
        for i, m in enumerate(re.finditer(re.escape(RETOLD), s)):
            name = "tg" if i == 0 else "tg" + str(i + 1)
            out.append(s[idx:m.start()])
            out.append(gate_guard_cargo(name))
            idx = m.start()
        out.append(s[idx:])
        s = "".join(out)
        for i in range(t["ret"]):
            name = "tg" if i == 0 else "tg" + str(i + 1)
            s = s.replace(RETOLD, RETNEW.replace("{TGV}", name), 1)
    if s.count(RULE1B_OLD) and "implRows" not in s:
        t["rule1b"] = 1; s = s.replace(RULE1B_OLD, RULE1B_NEW, 1)
    # glm roles swap
    b0 = s.index("const BUILDER = ")
    lm = re.search(r'log\("[^\n]*roles: builder=[^\n]*', s[b0:])
    s = s[:b0] + ROLES + s[b0 + lm.end():]
    # drop minimax model literal lines
    before = s.count("M_M3")
    s = re.sub(r'const M_M3 = model\("minimax-m-plan/MiniMax-M3[^"]*"\);\n', "", s)
    s = re.sub(r'const M_M3F = model\("minimax-m-plan/MiniMax-M3[^"]*"\);\n', "", s)
    t["m3lines"] = before - s.count("M_M3")
    # alias dangling identifiers
    t["M_LING"] = s.count("M_LING"); s = s.replace("M_LING", "M_GLM")
    t["M_MISTRAL"] = s.count("M_MISTRAL"); s = s.replace("M_MISTRAL", "M_SUPER")
    t["minimaxLeft"] = len([l for l in s.split("\n") if re.search(r"minimax", l, re.I) and not l.strip().startswith("//")])
    t["braces"] = s.count("{") - s.count("}")
    t["lines"] = s.count("\n") + 1
    t["phases"] = len(re.findall(r'phase\("', s))
    t["roundnames"] = s.count('" w" + round')
    t["models"] = len(re.findall(r'model\("', s))
    (W / defname).write_text(s, encoding="utf-8", newline="")
    report[defname] = {"hits": hits, "t": t}

for k, v in report.items():
    print(k, json.dumps(v) if not isinstance(v, str) else v)
