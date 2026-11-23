/* zcode-workflow
description: "ARBOR product regression verifier — ZCode alone executes three independent suites in parallel against an exact immutable source SHA. Read-only source; no provider sends, browser driver, or production restart."
whenToUse: "After ChatGPT Dev commits a product change: run unit/UX, Host/PWA and Studio admission checks concurrently. ChatGPT owns fixes; ZCode owns tests."
args:
  sha:
    type: string
    required: true
    description: "Full 40-character Git commit SHA of the pinned detached ARBOR worktree"
*/
interface Result {
  lane: string;
  exitCode: number;
  result: "PASS" | "FAIL";
  tail: string;
}
phase("Pin immutable source");
const expected=String(args.sha||"").trim();
if(!/^[0-9a-f]{40}$/.test(expected))
  return {conclusion:"BLOCKED: exact 40-character SHA required",verified:[],notCovered:["all suites"]};
const pinned=await world.run("git",["rev-parse","HEAD"],{output:{tail:256}});
if(pinned.exitCode!==0||pinned.stdout.trim()!==expected)
  return {conclusion:"BLOCKED: checkout SHA differs from requested source; do not execute against a moving branch",
    expected,observed:pinned.stdout.trim(),verified:[],notCovered:["all suites"]};
const status=await world.run("git",["status","--porcelain","--untracked-files=all"],{output:{tail:512}});
if(status.exitCode!==0||String(status.stdout||"").trim())
  return {conclusion:"BLOCKED: checkout has tracked or untracked source changes",verified:[],notCovered:["all suites"]};
phase("Run ZCode-owned independent verification lanes concurrently");
const lanes=[
  {id:"mobile-composer",argv:["--test","apps/mobile-relay/test/provider-handoff.test.mjs",
    "apps/mobile-relay/test/first-customer.test.mjs"]},
  {id:"full-pwa-host",argv:["integration/scripts/pwa-run-now.mjs"]},
  {id:"studio-relay-safety",argv:["--test","studio/test/unit/relay-chat-startup-fence.test.mjs",
    "studio/test/unit/relay-chat-transport-readiness.test.mjs",
    "apps/vivim-host/test/direct-phone.test.mjs"]}
];
const results:Result[]=await Promise.all(lanes.map(async lane=>{
  let outcome;
  try{
    const raw=await world.run("node",lane.argv,{output:{tail:6000}});
    outcome={lane:lane.id,exitCode:raw.exitCode,result:raw.exitCode===0?"PASS":"FAIL",
      tail:(String(raw.stdout||"")+"\n"+String(raw.stderr||"")).slice(-6000)} as Result;
  }catch(error){
    outcome={lane:lane.id,exitCode:-1,result:"FAIL",tail:String(error).slice(0,2000)} as Result;
  }
  report({suite:lane.id,status:outcome.result==="PASS"?"pass":"fail",
    detail:"exit="+outcome.exitCode+" "+outcome.tail.slice(-400)},"product-regression");
  return outcome;
}));
// A matching HEAD at launch is not proof of the tree that actually ran.
// Fail closed if another lane changed the checkout (including untracked
// source that could shadow imports) while the concurrent suites executed.
phase("Recheck exact source after suites");
const postHead=await world.run("git",["rev-parse","HEAD"],{output:{tail:256}});
const postStatus=await world.run("git",["status","--porcelain","--untracked-files=all"],{output:{tail:512}});
const observedPostSha=String(postHead.stdout||"").trim();
const postflightClean=postStatus.exitCode===0&&!String(postStatus.stdout||"").trim();
if(postHead.exitCode!==0||observedPostSha!==expected||!postflightClean){
  return {
    conclusion:"BLOCKED: source SHA or checkout cleanliness changed during verification; suite results are not source-attested PASS",
    sourceSha:expected,observedPostSha,postflightClean,
    launchedLanes:results.length,results,verified:[],
    notCovered:["No source-attested verification from this run",
      "Physical phone, native GPUI and signed-in browser delivery remain separate acceptance"]
  };
}
const failures=results.filter(r=>r.result!=="PASS");
return {
  conclusion:failures.length
    ? "ZCode parallel product verification FAILED ("+failures.map(r=>r.lane).join(", ")+")"
    : "ZCode parallel product verification PASS at "+expected.slice(0,12),
  sourceSha:expected,launchedLanes:results.length,results,
  verified:results.filter(r=>r.result==="PASS").map(r=>r.lane),
  notCovered:["Physical phone interaction, browser-account send and native GPUI screenshots require separate explicit acceptance; these tests never send a provider prompt."]
};
