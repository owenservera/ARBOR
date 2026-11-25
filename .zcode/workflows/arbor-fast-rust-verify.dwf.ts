/* zcode-workflow
description: "Run the canonical fast native Rust development checks on a clean, exact-source ARBOR checkout. No model calls, provider sends, application deployment, or implicit Blaze fallback."
whenToUse: "After Rust source changes land on ARBOR main; use a dedicated Windows verification checkout. Keep its target directory warm."
*/
phase("Admit exact ARBOR source");
const head = await world.run("git", ["rev-parse", "HEAD"], {output:{tail:2048}});
const origin = await world.run("git", ["rev-parse", "refs/remotes/origin/main"], {output:{tail:2048}});
const dirty = await world.run("git", ["status", "--porcelain"], {output:{tail:2048}});
const sourceSha = head.stdout.trim();
if (head.exitCode !== 0 || origin.exitCode !== 0 || dirty.exitCode !== 0 ||
    !/^[a-f0-9]{40}$/.test(sourceSha) || sourceSha !== origin.stdout.trim() || dirty.stdout.trim()) {
  throw new Error("BLOCKED_SOURCE_UNPINNED: use a clean exact-SHA Windows checkout, not the owner's working tree.");
}
phase("Run native Cargo acceleration, no Blaze fallback");
const results: { component: string; exitCode: number | null; elapsedMs: number }[] = [];
for (const component of ["core","gpui"]) {
  const start = Date.now();
  const result = await world.run("pwsh", ["-NoProfile","-File","scripts/rust-dev-build.ps1",
    "-Backend","native","-Component",component,"-Action","check","-Jobs","2","-Offline"], {output:{tail:12000}});
  const elapsedMs = Date.now() - start;
  results.push({component,exitCode:result.exitCode,elapsedMs});
  log("FAST_RUST_CHECK "+JSON.stringify({sourceSha,component,exitCode:result.exitCode,elapsedMs}));
  if(result.exitCode !== 0) log((result.stdout+"\n"+result.stderr).slice(-4000));
}
const accepted=results.every(row=>row.exitCode===0);
log(JSON.stringify({schema:"vivim.rust-dev-check/1",sourceSha,backend:"native",action:"check",
  results,accepted,blazeBuildVerified:false,releaseVerified:false}));
if(!accepted) throw new Error("FAST_RUST_CHECK_FAILED: see exact-source check receipts; no automatic retry.");
