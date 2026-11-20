#!/usr/bin/env python3
"""reconcile-build.py — build schema-v2 ledger patches reconciling tracker rows whose
Repository path was modified in ARBOR between the pinned source HEAD and the lane
fleet commit. One patch per lane (merge contract: all rows in a patch share the
patch lane, <=500 rows). Run with python -I from the ARBOR workspace."""
import csv, gzip, io, json, subprocess, pathlib, sys

LABS = pathlib.Path("C:/0-BlackBoxProject-0/vivim-labs")
ARBOR = pathlib.Path("C:/0-BlackBoxProject-0/ARBOR")
REL = "ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz"
SOURCE = "e07e61385a53f30890b4a7f7441fe25d22a79b1c"
WORK = "7c062c57036b36a803485baa04d3fc6133fa64c8"
OUT = ARBOR / ".coordination/tracker-patches"
OUT.mkdir(parents=True, exist_ok=True)

csv.field_size_limit(20_000_000)

def git(cwd, *args):
    return subprocess.check_output(["git", "-C", str(cwd), *args]).decode().strip()

ledger_commit = git(LABS, "rev-parse", "HEAD")
ledger_blob = git(LABS, "rev-parse", "HEAD:" + REL)

raw = gzip.decompress((LABS / REL).read_bytes())
reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""))
rows = list(reader)

changed = set(git(ARBOR, "diff", "--name-only", SOURCE + ".." + WORK).splitlines())

# blob sha per path at the pin (cached)
blob_cache = {}
def blob_sha(path):
    if path not in blob_cache:
        blob_cache[path] = git(ARBOR, "rev-parse", SOURCE + ":" + path)
    return blob_cache[path]

CHANGE_FIELDS = ["Review HEAD", "Runtime test", "Current state", "Evidence detail / anchor"]

def new_value(row, field):
    old = row.get(field) or ""
    if field == "Review HEAD":
        return SOURCE
    if field == "Runtime test":
        return "UNRUN"
    if field == "Current state":
        return "IMPLEMENTED \u00f9 RUNTIME UNRUN"
    if field == "Evidence detail / anchor":
        add = ("[RECONCILE 2026-11-20] path modified in ARBOR commit " + WORK +
               " (git diff " + SOURCE[:12] + ".." + WORK[:12] + "); runtime test UNRUN; reconciled from lane fleet build")
        return (old + "\n" + add) if old else add
    return old

by_lane = {}
for r in rows:
    if r["Repository path"] in changed:
        by_lane.setdefault(r["Parallel lane"], []).append(r)

for lane, lrows in sorted(by_lane.items()):
    assert len(lrows) <= 500, (lane, len(lrows))
    recs = []
    for r in lrows:
        path = r["Repository path"]
        src = r["Source URL"]
        if "#L" not in src:
            src = src + "#L1"
        expected = {f: (r.get(f) or "") for f in CHANGE_FIELDS}
        changed_fields = {f: new_value(r, f) for f in CHANGE_FIELDS}
        recs.append({
            "stable_id": r["ID"],
            "path": path,
            "symbol": r["Symbol / occurrence"],
            "lane": lane,
            "batch": r["Lane batch"],
            "source_url": src,
            "source_anchors": "git diff " + SOURCE + ".." + WORK + " -- " + path,
            "source_blob_sha": blob_sha(path),
            "expected_old_fields": expected,
            "changed_fields": changed_fields,
            "append_evidence": "RECONCILE-20261120-" + WORK[:12] + "-" + r["ID"],
            "review_completed": "2026-11-20 path-touched reconciliation over ARBOR commits " + SOURCE[:12] + ".." + WORK[:12],
            "evidence_scope": "file touched by lane fleet build commit " + WORK + "; runtime UNRUN",
        })
    patch = {
        "schema": "arbor-transient-stable-id-row-patch/2",
        "source_head": SOURCE,
        "last_readable_ledger_commit": ledger_commit,
        "last_readable_ledger_blob": ledger_blob,
        "lane": lane,
        "rows": recs,
    }
    p = OUT / ("reconcile-lane-" + lane + ".json")
    p.write_text(json.dumps(patch, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", p.name, "rows:", len(recs))
print("total rows:", sum(len(v) for v in by_lane.values()))
