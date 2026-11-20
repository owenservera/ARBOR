#!/usr/bin/env python3
"""reconcile-scan.py — plan the ledger reconciliation: intersect tracker rows with
files changed in ARBOR since the pinned source HEAD, and report per-lane counts
plus the vocabulary of the fields we will write. Run with python -I."""
import csv, gzip, io, json, subprocess, sys, collections, pathlib

LABS = pathlib.Path("C:/0-BlackBoxProject-0/vivim-labs")
ARBOR = pathlib.Path("C:/0-BlackBoxProject-0/ARBOR")
REL = "ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz"
SOURCE = "e07e61385a53f30890b4a7f7441fe25d22a79b1c"
WORK = "7c062c57036b36a803485baa04d3fc6133fa64c8"

csv.field_size_limit(20_000_000)

def git(cwd, *args):
    return subprocess.check_output(["git", "-C", str(cwd), *args]).decode().strip()

raw = gzip.decompress((LABS / REL).read_bytes())
reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""))
fields = reader.fieldnames
rows = list(reader)
print("columns:", len(fields))
print("all columns:", json.dumps(fields))
for col in ("Disposition", "Current state", "Evidence grade", "Runtime test", "Review HEAD", "Production reachability", "Evidence detail / anchor", "Phase decision"):
    if col in fields:
        t = collections.Counter((r.get(col) or "(blank)")[:60] for r in rows)
        print(f"== {col}: {dict(t.most_common(12))}")

changed = set(git(ARBOR, "diff", "--name-only", SOURCE + ".." + WORK).splitlines())
print("changed paths since pin:", len(changed))

by_lane = collections.Counter()
touched_ids = []
for r in rows:
    if r["Repository path"] in changed:
        by_lane[r["Parallel lane"]] += 1
        touched_ids.append(r["ID"])
print("touched rows per lane:", dict(by_lane), "total:", len(touched_ids))

# sample a touched row fully
for r in rows:
    if r["Repository path"] in changed:
        print("SAMPLE ROW:", json.dumps(r, ensure_ascii=False)[:1500])
        break

out = {"changed": sorted(changed), "touched_ids": touched_ids, "fields": fields}
pathlib.Path("C:/0-BlackBoxProject-0/ARBOR/.coordination/evidence/reconcile-scan.json").write_text(json.dumps(out))
print("wrote .coordination/evidence/reconcile-scan.json")
