/* zcode-workflow
description: "VIVIM VLANG: four independent read-only improvement scouts plus an independent verifier, pinned to current ARBOR source. Findings only, no effects or source mutation."
whenToUse: "Run from a clean exact-SHA ARBOR checkout after a canonical main update or a reproducible VLANG user-input miss. ZCode mode must be plan; no provider/Host account effects."
args:
  sha:
    type: string
    required: true
    description: "Exact 40-character ARBOR source commit hash"
*/
interface Finding {
  lane: string;
  outcome: "NO_DEFECT" | "IMPROVEMENT_FOUND" | "LIMITED" | "BLOCKED";
  sourcePaths: string[];
  evidence: string[];
  reproduction: string;
  expected: string;
  observed: string;
  proposedOneFix: string;
  unrun: string[];
}
interface Verdict {
  validated: string[];
  unsupported: string[];
  overlapping: string[];
  nextSingleFix: string;
}
const expected = String(args.sha ?? "").trim();
phase("Pin exact current ARBOR source");
const head = await world.run("git",["rev-parse","HEAD"],{output:{tail:256}});
const upstream = await world.run("git",["rev-parse","refs/remotes/origin/main"],{output:{tail:256}});
const status = await world.run("git",["status","--porcelain","--untracked-files=no"],{output:{tail:600}});
if(!/^[a-f0-9]{40}$/.test(expected) || head.exitCode!==0 || upstream.exitCode!==0 ||
   status.exitCode!==0 || head.stdout.trim()!==expected ||
   upstream.stdout.trim()!==expected || status.stdout.trim()) {
  throw new Error("SOURCE_FENCE: exact clean HEAD == origin/main required; never audit an unpinned or dirty source");
}
log("Pinned ARBOR SHA "+expected);
phase("Deterministic VLANG and compiler acceptance first");
const tests=[
  "apps/vivim-host/test/vlang-command-compilation.test.mjs",
  "apps/vivim-host/test/control-intent-planner.test.mjs",
  "apps/vivim-host/test/command-intent-native.test.mjs",
  "apps/mobile-relay/test/composer-assist.test.mjs"
];
const suite=await world.run("node",["--test",...tests],{output:{tail:8000}});
const trial=String(suite.stdout??"")+"\n"+String(suite.stderr??"");
const passRow=/(?:^|\n)\s*(?:ℹ|#)\s*pass\s+(\d+)/m.exec(trial);
const failRow=/(?:^|\n)\s*(?:ℹ|#)\s*fail\s+(\d+)/m.exec(trial);
const passed=passRow?Number(passRow[1]):null;
const failed=failRow?Number(failRow[1]):null;
report({lane:"Z-BASELINE",sha:expected,exitCode:suite.exitCode,passed,failed,
  verdict:suite.exitCode===0&&passed!==null&&failed===0?"PASS":"FAIL",
  tail:trial.slice(-1200)});
if(suite.exitCode!==0||passed===null||failed!==0)
  throw new Error("BASELINE_FAILED: "+trial.slice(-3500));
phase("Four independent VLANG improvement scouts in parallel");
const lanes=[
  {name:"Z-VLANG",paths:["apps/vivim-host/control/intent-planner.mjs","apps/vivim-host/control/command-intent.mjs","core/programmability/src/command_intent_projection.rs"],
   goal:"Trace natural language -> typed intent IR -> deterministic Host action catalog. Check paraphrases, slots, context, and catalog revision."},
  {name:"Z-SAFETY",paths:["apps/vivim-host/control/heldout.v1.json","apps/vivim-host/control/action-catalog.v1.json","apps/vivim-host/control/dispatcher.mjs"],
   goal:"Find actual negation, ambiguity, compound-verb, unsupported-capability or R2/R3 permission regressions. Heldout set is for evaluation only, not training."},
  {name:"Z-AUTOWIKI",paths:["native/gpui-desktop/src/first_contact.rs","apps/mobile-relay/app.js","apps/vivim-host/chat/wiki-semantics.mjs"],
   goal:"Find source-backed Wiki as-you-type stale revision or incorrect null-state issues without synthesizing personal records."},
  {name:"Z-VISUAL",paths:["native/gpui-desktop/src/control.rs","apps/mobile-relay/index.html","apps/mobile-relay/composer-assist.mjs"],
   goal:"Trace interpreted command previews, IME/typing, phone parity, source freshness and review-only affordances. Physical device proof is UNRUN unless actually observed."}
];
const tasks=lanes.map(lane=>{
  const observer=agent(lane.name,{
    system:"You are a bounded independent VIVIM code auditor. READ ONLY: no edits, commits, branches, shell writes, provider sends, account/corpus reads, browser control, Host mutations or restarting services. Never treat a candidate as approval. Cite concrete exact source lines/tests; do not invent results. Return one JSON object only, with lane, outcome, sourcePaths, evidence, reproduction, expected, observed, proposedOneFix, unrun."
  });
  const instruction="Pinned ARBOR HEAD "+expected+". Your ONLY lane is "+lane.name+
    ". Goal: "+lane.goal+". Only inspect these source paths and directly referenced tests: "+
    lane.paths.join(", ")+". Existing 4-file Node VLANG baseline passed "+passed+
    " tests. Investigate one verifiable improvement or report NO_DEFECT or LIMITED honestly. "+
    "Never write files or execute any effect. Do not assume physical GPUI or phone acceptance.";
  return observer.ask<Finding>(instruction);
});
const settled=await Promise.allSettled(tasks);
const findings:Finding[]=[];
for(let i=0;i<settled.length;i++){
  const item=settled[i];
  if(item.status==="fulfilled"){
    const f=item.value;
    if(f?.lane===lanes[i].name && Array.isArray(f.evidence) &&
       ["NO_DEFECT","IMPROVEMENT_FOUND","LIMITED","BLOCKED"].includes(f.outcome)) {
      findings.push(f);
      report({lane:f.lane,outcome:f.outcome,sha:expected,evidence:f.evidence.slice(0,12),
        proposedOneFix:f.proposedOneFix,unrun:f.unrun});
      continue;
    }
  }
  const blocked:Finding={lane:lanes[i].name,outcome:"BLOCKED",sourcePaths:lanes[i].paths,
    evidence:[],reproduction:"No schema-valid ZCode scout response",
    expected:"Read-only source-backed finding",observed:"No usable response",
    proposedOneFix:"",unrun:["Model scout unavailable or invalid"]};
  findings.push(blocked);report({lane:blocked.lane,outcome:"BLOCKED",sha:expected});
}
phase("Independent adversarial verifier");
const verifier=agent("Z-INDEPENDENT-VERIFIER",{
  system:"Read-only adversarial verifier. No edits, effects, browser calls or source commits. Reject unsupported citations and duplication of existing VIVIM capabilities. Never claim visual/device acceptance from code tests. Return JSON only."
});
const verdict=await verifier.ask<Verdict>("At ARBOR SHA "+expected+
  " independently audit these four scout findings. You must check referenced source; flag unsupported, overlapping, and hypothetical findings. Recommend at most ONE concrete fix for ChatGPT primary source owner, never implement it. "+
  JSON.stringify(findings).slice(0,14000));
report({lane:"Z-VERIFY",sha:expected,verdict});
return {schema:"vivim.vlang-iteration/1",runId:run.id,sha:expected,
  deterministic:{pass:passed,fail:failed},scouts:findings,verifier:verdict,
  effectsAttempted:0,sourceWrites:0,
  boundaries:["No model-based command execution","No physical phone or native UI pass without device evidence",
    "Owner's ChatGPT code lane alone integrates and re-verifies a single fix on main"]};
