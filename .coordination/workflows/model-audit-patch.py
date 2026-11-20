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
