// rebuild2.mjs — rebuild the six truncated defs from the launcher payloads of the
// last FULL-def runs (16:00/16:21 NIM era), graft the current pool heads, re-apply
// the post-launch patch set (planner rule 1b, gate-truth), and route the owner pool
// glm + ernie + NIM (minimax cold, zero minimax references).
// usage: bun rebuild2.mjs
import fs from "node:fs";

const W = ".zcode/workflows/";
const PAIRS = {
  "arbor-area-a.dwf.ts": "dwfrun-ffd84dea-f28a-4418-88c8-5a3b10d3d9a1",
  "arbor-area-b.dwf.ts": "dwfrun-97febcff-4086-46e1-9ede-10db7f2a01b7",
  "arbor-area-c.dwf.ts": "dwfrun-fd624675-19d4-4eae-9e53-63771229f48b",
  "arbor-area-d.dwf.ts": "dwfrun-6ea4c66a-f782-45a1-a1c0-479500a83dc7",
  "arbor-area-e.dwf.ts": "dwfrun-8a138c20-14f9-46ad-ba55-da156a881079",
};

const VOLD = `      if (v.pass) {
        verdict = "VERIFIED";
        note = "verifier accepted; gate exit " + gateExit;
        break;
      }`;
const VNEW = `      if (v.pass) {
        // No opinion override: the deterministic gate exit code decides. The verifier
        // at most names the failure; gateExit !== 0 keeps the verdict REPLAN.
        note = "verifier found no concrete failure, but gate exit " + gateExit + " stands — no override";
        break;
      }`;
const TOLD = `  } else {
    verdict = "CLOSED_NO_CHANGE";
    note = "trace-and-close unit: the callers were recorded and no product file changed — closed with evidence, no synthetic change";
  }`;
const TNEW = `  } else if (gateExit === 0) {
    verdict = "CLOSED_NO_CHANGE";
    note = "trace-and-close unit: gate exit 0, callers recorded, no product file changed — closed with evidence, no synthetic change";
  } else {
    verdict = "REPLAN";
    note = "trace-and-close unit but gate exit " + gateExit + " — a red gate is never a closure; replan";
  }`;
const RULE1B_OLD = "never select it; ";
const RULE1B_NEW = "never select it; (1b) a unit with `implRows` equal to `rowCount` is fully IMPLEMENTED in the reconciled ledger (already landed in ARBOR) - already done, never select it; ";

const ROLES = `const BUILDER = hot("new-provider/nvidia/nemotron-3.5-super-vl-120b-a12b") ? M_GLM : M_SUPER;
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
log("Lane roles: builder=" + (BUILDER === M_GLM ? "glm-5.3" : "nemotron-super-vl") + " planner=" + (PLANNER === M_GLM ? "glm-5.3" : "nemotron-super-vl") + " verifier=" + (VERIFIER === M_GLM ? "glm-5.3" : VERIFIER === M_ERNIE ? "ernie" : "nemotron-lightning") + " trace=" + (TRACE === M_ERNIE ? "ernie" : "nemotron-nano") + " triage=" + (TRIAGE === M_GLM ? "glm-5.3" : "nemotron-lightning") + " (owner pool: glm + ernie + NIM; minimax cold)")`;

function extractLowered(launcherPath) {
  const text = fs.readFileSync(launcherPath, "utf8");
  const key = '"lowered":"';
  const start = text.indexOf(key);
  if (start < 0) throw new Error("no lowered in " + launcherPath);
  // walk the JSON string literal from the opening quote
  let i = start + key.length - 1; // at the opening "
  let depth = 0, inStr = false, esc = false, objStart = text.indexOf("{", start - 20);
  // simpler: find the payload object by scanning from the first '{' before "lowered"
  let begin = text.lastIndexOf("{", start);
  let j = begin, stack = [];
  let str = false;
  for (; j < text.length; j++) {
    const c = text[j];
    if (str) {
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === '"') str = false;
      continue;
    }
    if (c === '"') { str = true; continue; }
    if (c === "{" || c === "[") stack.push(c);
    if (c === "}" || c === "]") {
      stack.pop();
      if (stack.length === 0) break;
    }
  }
  const obj = JSON.parse(text.slice(begin, j + 1));
  if (!obj.lowered) throw new Error("payload.lowered missing in " + launcherPath);
  return obj.lowered;
}

function rolesBlockBounds(s) {
  const b = s.indexOf("const BUILDER = ");
  if (b < 0) throw new Error("no BUILDER");
  const m = /log\("[^\n]*roles: builder=[^\n]*/.exec(s.slice(b));
  if (!m) throw new Error("no roles log after BUILDER");
  return [b, b + m.index + m[0].length];
}

const MODEL_PAT = /const M_M3 = model\("minimax-m-plan\/MiniMax-M3"\);\nconst M_M3F = model\("minimax-m-plan\/MiniMax-M3\.1-Flash"\);\n/;

for (const [defName, runId] of Object.entries(PAIRS)) {
  const head = fs.readFileSync(W + defName, "utf8");
  const lowered = extractLowered(".zcode/workflow-runs/" + runId + ".mjs");
  // head: up to and including its roles log line
  const hm = /log\("[^\n]*roles: builder=[^\n]*/.exec(head);
  if (!hm) { console.log(defName, "HEAD HAS NO ROLES LOG — skip"); continue; }
  const headPart = head.slice(0, hm.index + hm[0].length);
  // lowered tail: after its roles log line
  const lm = /log\("[^\n]*roles: builder=[^\n]*/.exec(lowered);
  if (!lm) { console.log(defName, "LOWered has no roles log", runId); continue; }
  const tailPart = lowered.slice(lm.index + lm[0].length);
  let s = headPart + "\n" + tailPart.replace(/^\n+/, "");
  const hits = {};
  // patch set on the tail
  if (!s.includes("implRows") && s.includes(RULE1B_OLD)) { hits.rule1b = 1; s = s.replace(RULE1B_OLD, RULE1B_NEW); }
  hits.verifier = (s.match(/verifier accepted; gate exit/g) || []).length;
  s = s.split(VOLD).join(VNEW);
  hits.traceElse = (s.match(/closed with evidence, no synthetic change";\n  \} else \{/g) || []).length;
  s = s.split(TOLD).join(TNEW);
  // glm roles: swap BUILDER..log block
  const [b0, b1] = rolesBlockBounds(s);
  s = s.slice(0, b0) + ROLES + s.slice(b1);
  // drop minimax model literals
  hits.m3literals = (s.match(/const M_M3 = model\("minimax-m-plan\/MiniMax-M3"\);\nconst M_M3F = model\("minimax-m-plan\/MiniMax-M3\.1-Flash"\);\n/g) || []).length;
  s = s.replace(/const M_M3 = model\("minimax-m-plan\/MiniMax-M3"\);\nconst M_M3F = model\("minimax-m-plan\/MiniMax-M3\.1-Flash"\);\n/, "");
  // any lingering minimax refs in code
  const minLeft = s.split("\n").filter((l) => /minimax/i.test(l) && !/^\s*\/\//.test(l));
  hits.minimaxLeft = minLeft.length;
  hits.braces = s.split("{").length - s.split("}").length;
  hits.lines = s.split("\n").length;
  hits.phases = (s.match(/phase\("/g) || []).length;
  fs.writeFileSync(W + defName, s, "utf8");
  console.log(defName, JSON.stringify(hits));
}

// integrate: already grafted in rebuild pass 1 (1457 lines, verifier applied); only glm roles + minimax removal
{
  const defName = "arbor-integrate.dwf.ts";
  let s = fs.readFileSync(W + defName, "utf8");
  const hits = {};
  const [b0, b1] = rolesBlockBounds(s);
  s = s.slice(0, b0) + ROLES + s.slice(b1);
  hits.m3literals = (s.match(MODEL_PAT) || []).length;
  s = s.replace(MODEL_PAT, "");
  const minLeft = s.split("\n").filter((l) => /minimax/i.test(l) && !/^\s*\/\//.test(l));
  hits.minimaxLeft = minLeft.length;
  hits.braces = s.split("{").length - s.split("}").length;
  hits.lines = s.split("\n").length;
  hits.phases = (s.match(/phase\("/g) || []).length;
  fs.writeFileSync(W + defName, s, "utf8");
  console.log(defName, JSON.stringify(hits));
}
