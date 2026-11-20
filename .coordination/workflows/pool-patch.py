import io, re, sys

# Owner pool 2026-11-20: ernie + minimax + glm join the NIM pool.
# Six roles spread across four families; verifier never the builder; free models
# (ernie) and plan models (minimax/glm) get hot() fallbacks to NIM.
MODELS = '''const M_SUPER = model("new-provider/nvidia/nemotron-3.5-super-vl-120b-a12b");
const M_LIGHTNING = model("new-provider/nvidia/nemotron-3.5-lightning-30b-a3b");
const M_NANO = model("new-provider/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning");
const M_ERNIE = model("openrouter-2/baidu/ernie-5.5-flash-preview:free");
const M_M3 = model("minimax-m-plan/MiniMax-M3");
const M_M3F = model("minimax-m-plan/MiniMax-M3.1-Flash");
const M_GLM = model("new-provider-3/glm-5.3-flash");'''

ROLES = '''const BUILDER = hot("new-provider/nvidia/nemotron-3.5-super-vl-120b-a12b") ? M_M3 : M_SUPER;
const PLANNER = hot("new-provider-3/glm-5.3-flash") ? M_SUPER : M_GLM;
// Independent verification: the verifier is never the builder's model.
const VERIFIER = ((): ModelRef => {
  const pool: [ModelRef, string][] = [[M_M3F, "minimax-m-plan/MiniMax-M3.1-Flash"], [M_ERNIE, "openrouter-2/baidu/ernie-5.5-flash-preview:free"], [M_LIGHTNING, "new-provider/nvidia/nemotron-3.5-lightning-30b-a3b"]];
  for (const pair of pool) {
    if (pair[0] !== BUILDER && !hot(pair[1])) return pair[0];
  }
  return BUILDER === M_M3F ? M_LIGHTNING : M_M3F;
})();
const TRACE = hot("openrouter-2/baidu/ernie-5.5-flash-preview:free") ? M_NANO : M_ERNIE;
const TRIAGE = hot("minimax-m-plan/MiniMax-M3") ? M_LIGHTNING : M_M3;
log("Lane roles: builder=" + (BUILDER === M_M3 ? "minimax-m3" : "nemotron-super-vl") + " planner=" + (PLANNER === M_SUPER ? "nemotron-super-vl" : "glm-5.3") + " verifier=" + (VERIFIER === M_M3F ? "minimax-m3.1-flash" : VERIFIER === M_ERNIE ? "ernie" : "nemotron-lightning") + " trace=" + (TRACE === M_ERNIE ? "ernie" : "nemotron-nano") + " triage=" + (TRIAGE === M_M3 ? "minimax-m3" : "nemotron-lightning") + " (owner pool: ernie + minimax + glm + NIM)")'''

MODEL_PAT = re.compile(r'const M_SUPER = model\("new-provider/nvidia/nemotron-3\.5-super-vl-120b-a12b"\);\nconst M_LIGHTNING = model\("new-provider/nvidia/nemotron-3\.5-lightning-30b-a3b"\);\nconst M_NANO = model\("new-provider/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"\);', re.M)
ROLE_PAT = re.compile(r'^const BUILDER = .*?\n(?:const PLANNER = .*?\n)?(?:^// [^\n]*\n(?:^// [^\n]*\n(?:^// [^\n]*\n)?)?const VERIFIER = \(\(\): ModelRef => \{[\s\S]*?\}\)\(\);\n)?const TRACE = .*?\n(?:const TRIAGE = .*?\n)?log\("Lane roles: .*$', re.M)

for p in sys.argv[1:]:
    s = io.open(p, encoding="utf-8").read()
    m1 = len(MODEL_PAT.findall(s))
    s = MODEL_PAT.sub(MODELS, s)
    m2 = 0
    m = re.search(r'^const BUILDER = .*?log\("Lane roles: .*$', s, re.M | re.S)
    if m:
        s = s[:m.start()] + ROLES + s[m.end():]
        m2 = 1
    io.open(p, "w", encoding="utf-8", newline="").write(s)
    print(p, "models:", m1, "roles:", m2)
