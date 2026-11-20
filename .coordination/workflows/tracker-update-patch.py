import io, re, sys

SRC = "e07e61385a53f30890b4a7f7441fe25d22a79b1c"

HELPER = '''// The canonical master must reflect every touched file: merge this unit's keyed
// changes into the Labs ledger (reload the latest master, rebuild the patch, retry).
async function mergeUnitIntoLedger(u: UnitBrief, v: Verdict, sha: string): Promise<string> {
  const patchPath = DELTA_DIR + "/" + slug(u.id) + ".patch.json";
  const patcher = agent("Ledger patch builder " + u.id, { model: TRIAGE });
  let last = "";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await patcher.ask<string>(
      "Write a ledger-maintenance patch for lane " + LANE + " unit " + u.id + " to " + patchPath + " in " + ROOT_HINT + ". " +
      "The canonical master is " + LABS_GZ + " in " + LABS_DIR + " — READ THE CURRENT MASTER (gunzip -c it to a temp file) and work from THAT, never from a stale copy. " +
      "Header: {\\"schema\\":\\"arbor-transient-stable-id-row-patch/2\\",\\"source_head\\":\\"' + SRC + '\\",\\"last_readable_ledger_commit\\":\\"<git -C " + LABS_DIR + " rev-parse HEAD>\\",\\"last_readable_ledger_blob\\":\\"<git -C " + LABS_DIR + " rev-parse HEAD:ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz>\\",\\"lane\\":\\"" + LANE + "\\",\\"rows\\":[...]}. " +
      "One row per changed tracker row: stable_id (the CSV ID), path, symbol, lane, batch, source_url (from the CSV Source URL), source_anchors (from Evidence detail / anchor), source_blob_sha (40 hex, from the Source URL blob), expected_old_fields (the CURRENT master row values for every field you change), changed_fields (your new values), append_evidence (a unique marker string). " +
      "changed_fields MUST include \\"Review HEAD\\"=\\"" + SRC + '\\" and \\"Runtime test\\"=\\"UNRUN\\" (never a pass value — the merge tool rejects it), plus Production reachability and Evidence detail / anchor carrying the real gate result (gate " + v.gateCommand + " exit " + v.gateExit + ", commit " + sha + "). " +
      "The unit delta listing which IDs changed is at " + DELTA_DIR + "/" + slug(u.id) + ".json — read it. Write the patch file, then reply with the path and the row count."
    );
    const merge = await world.run("python", ["-I", LABS_DIR + "/ARBOR-DEEP-DISPOSITION/ledger-maintenance.py", "merge", patchPath], { timeoutMs: 300000, output: { tail: 4096 } });
    if (merge.exitCode === 0) return "merged into the canonical master: " + (merge.stdout || merge.stderr).trim().slice(0, 260);
    last = (merge.stderr || merge.stdout).trim().slice(0, 400);
    log("Ledger merge attempt " + attempt + " for " + u.id + " failed: " + last + " — reloading the latest master and rebuilding the patch");
  }
  return "NOT merged after 3 attempts (" + last + ") — the unit delta stays on disk for the serialized ledger writer";
}

'''

FINAL_PHASE = '''phase("Bring the canonical master fully up to date");
const ledgerAudit = await world.run("python", ["-I", LABS_DIR + "/ARBOR-DEEP-DISPOSITION/ledger-maintenance.py", "audit"], { timeoutMs: 300000, output: { tail: 8192 } });
log("Ledger audit exit " + ledgerAudit.exitCode + ": " + ledgerAudit.stdout.trim().slice(0, 400));
const ledgerAdd = await world.run("git", ["-C", LABS_DIR, "add", "--", "ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz"], { output: { tail: 1024 } });
const ledgerCommit = await world.run("git", ["-C", LABS_DIR, "commit", "-m", "chore(ledger): merge lane " + LANE + " keyed changes (arbor-area-" + LANE.toLowerCase() + ")"], { output: { tail: 2048 } });
log("Labs ledger commit exit " + ledgerCommit.exitCode + ": " + (ledgerCommit.stdout || ledgerCommit.stderr).trim().slice(0, 240));
const refresher = agent("Ledger refresher " + LANE, { model: TRIAGE });
await refresher.ask<string>(
  "In " + ROOT_HINT + " (Git Bash): refresh the local tracker copy from the merged master — gunzip -c " + LABS_GZ +
  " > .coordination/ARBOR-MASTER-INTEGRATION-TRACKER.csv — then report the row count (python -I csv row count) and whether the lane " +
  LANE + " rows now carry the merged evidence. Do not edit anything else."
);

'''

def patch(path):
    s = io.open(path, encoding="utf-8").read()
    orig = s
    report = {}

    # 1. helper before runUnit
    if "async function mergeUnitIntoLedger" not in s:
        m = re.search(r"^async function runUnit\(", s, re.M)
        if m:
            s = s[: m.start()] + HELPER + s[m.start():]
            report["helper"] = 1
        else:
            report["helper"] = 0

    # 2. call after the commit log line
    if "await mergeUnitIntoLedger(" not in s:
        m = re.search(r'^(    log\("Lane [A-E] committed "[^\n]*\);)$', s, re.M)
        if m:
            ins = m.group(1) + '\n    const ledgerNote = await mergeUnitIntoLedger(u, v, sha);\n    log("Lane ' + '__LANE__' + ' ledger: " + ledgerNote.slice(0, 240));'
            ins = ins.replace("__LANE__", re.search(r'log\("Lane ([A-E]) committed', m.group(1)).group(1))
            s = s[: m.start()] + ins + s[m.end():]
            report["call"] = 1
        else:
            report["call"] = 0

    # 3. final phase before the summary phase
    if 'phase("Bring the canonical master fully up to date")' not in s:
        m = re.search(r'^phase\("Summarise the lane [A-E] run"\);$', s, re.M)
        if m:
            s = s[: m.start()] + FINAL_PHASE + s[m.start():]
            report["final"] = 1
        else:
            report["final"] = 0

    if s != orig:
        io.open(path, "w", encoding="utf-8", newline="").write(s)
    return report

for p in sys.argv[1:]:
    print(p, patch(p))
