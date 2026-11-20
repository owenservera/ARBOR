import io, re, sys

M_ID = "new-provider/mistralai/mistral-large-4-1t-a52b"
E_ID = "openrouter-2/baidu/ernie-5.5-flash-preview:free"
L_ID = "openrouter-2/inclusionai/ling-3.2-flash:free"

NEW_ROLES = '''const BUILDER = hot("%s") ? M_ERNIE : M_MISTRAL;
const PLANNER = hot("%s") ? M_ERNIE : M_MISTRAL;
// Independent verification: the verifier is never the builder's model.
// With the MiniMax provider out, the only independent models are ernie and ling.
const VERIFIER = ((): ModelRef => {
  const pool: [ModelRef, string][] = [[M_ERNIE, "%s"], [M_LING, "%s"]];
  for (const pair of pool) {
    if (pair[0] !== BUILDER && !hot(pair[1])) return pair[0];
  }
  return BUILDER === M_ERNIE ? M_LING : M_ERNIE;
})();
const TRACE = M_ERNIE;
const TRIAGE = hot("%s") ? M_ERNIE : M_LING;''' % (M_ID, M_ID, E_ID, L_ID, L_ID)

for path in sys.argv[1:]:
    s = io.open(path, encoding="utf-8").read()
    orig = s
    hits = {}
    # 1. drop the minimax model() declarations
    for line in ('const M_M3 = model("minimax-m-plan/MiniMax-M3");',
                 'const M_M3F = model("minimax-m-plan/MiniMax-M3.1-Flash$max");'):
        n = s.count(line + "\n")
        s = s.replace(line + "\n", "")
        hits[line[:28]] = n
    # 2. collapse the role identifiers onto mistral
    s, n3 = re.subn(r"\bM_M3F\b", "M_MISTRAL", s)
    s, n4 = re.subn(r"\bM_M3\b", "M_MISTRAL", s)
    hits["M_M3F->M_MISTRAL"] = n3
    hits["M_M3->M_MISTRAL"] = n4
    # 3. drop minimax hot() id strings (they are now mistral checks)
    s = s.replace('hot("minimax-m-plan/MiniMax-M3")', 'hot("%s")' % M_ID)
    s = s.replace('hot("minimax-m-plan/MiniMax-M3.1-Flash")', 'hot("%s")' % M_ID)
    # 4. rewrite the role block wholesale (BUILDER..TRIAGE)
    s, nb = re.subn(r"^const BUILDER = .*?;\n(?:const PLANNER = .*?;\n)?(?:const VERIFIER = \(\(\): ModelRef => \{[\s\S]*?\}\)\(\);\n)?const TRACE = .*?;\n(?:const TRIAGE = .*?;\n)?", NEW_ROLES + "\n", s, count=1, flags=re.M)
    hits["role block"] = nb
    # 5. fix the roles log line
    s = re.sub(r'^log\("Lane [A-Z] roles: builder=.*$',
               'log("Lane roles: builder=" + (BUILDER === M_ERNIE ? "ernie" : "mistral") + " planner=" + (PLANNER === M_ERNIE ? "ernie" : "mistral") + " verifier=" + (VERIFIER === M_LING ? "ling" : "ernie") + " trace=ernie triage=ling (minimax provider removed)")', s, flags=re.M)
    # 6. any leftover minimax strings in code (not comments) — model() literals must be configured models
    leftover = [l for l in s.split("\n") if "minimax" in l and "//" not in l]
    hits["leftover-minimax-code"] = len(leftover)
    io.open(path, "w", encoding="utf-8", newline="").write(s)
    print(path, hits, "changed:", s != orig)
