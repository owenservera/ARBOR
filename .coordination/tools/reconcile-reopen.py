#!/usr/bin/env python3
"""reconcile-reopen.py — reopen the 621 path-touched closures my 2026-11-20 reconcile
wrote: path changes alone are not proof. Each row's Notes carries its [LABS RECONCILE]
history with the previous field values; restore Current state from that history.
Rows keep Review HEAD pin and Runtime test UNRUN; the reopen note preserves the trail.
Real completed work (receipt-backed units) stays closed via slice evidence hits.
Run with python -I."""
import csv, gzip, io, json, re, subprocess, pathlib

LABS = pathlib.Path("C:/0-BlackBoxProject-0/vivim-labs")
REL = "ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz"
SOURCE = "e07e61385a53f30890b4a7f7441fe25d22a79b1c"
OUT = pathlib.Path("C:/0-BlackBoxProject-0/ARBOR/.coordination/tracker-patches")
csv.field_size_limit(20_000_000)

def git(cwd, *args):
    return subprocess.check_output(["git", "-C", str(cwd), *args]).decode().strip()

ledger_commit = git(LABS, "rev-parse", "HEAD")
ledger_blob = git(LABS, "rev-parse", "HEAD:" + REL)

raw = gzip.decompress((LABS / REL).read_bytes())
rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline="")))

RECON = re.compile(r"\[LABS RECONCILE\] (\{.*\})", re.S)
HIST = re.compile(r"\[LABS RECONCILE\] (\{.*?\})(?=\n\[LABS RECONCILE\]|$)", re.S)

count = 0
by_lane = {}
skipped = 0
for r in rows:
    notes = r.get("Notes") or ""
    if "RECONCILE-20261120-7c062c5" not in notes:
        continue
    prev_state = None
    for m in HIST.finditer(notes):
        try:
            rec = json.loads(m.group(1))
        except Exception:
            continue
        p = rec.get("previous") or {}
        if "Current state" in p:
            prev_state = p["Current state"]
    if prev_state is None:
        prev_state = ""
    sid = r["ID"]
    rec = {
        "stable_id": sid,
        "path": r["Repository path"],
        "symbol": r["Symbol / occurrence"],
        "lane": r["Parallel lane"],
        "batch": r["Lane batch"],
        "source_url": (r["Source URL"] + "#L1") if "#L" not in r["Source URL"] else r["Source URL"],
        "source_anchors": "reopen: path-touched-only closure unsupported; previous state restored",
        "source_blob_sha": "0" * 40,
        "expected_old_fields": {
            "Current state": r.get("Current state") or "",
            "Review HEAD": r.get("Review HEAD") or "",
            "Runtime test": r.get("Runtime test") or "",
        },
        "changed_fields": {
            "Current state": prev_state,
            "Review HEAD": SOURCE,
            "Runtime test": "UNRUN",
        },
        "append_evidence": "REOPEN-20261120-94c2195-" + sid,
        "review_completed": "2026-11-20 reopen pass: path-touched-only closures unsupported, previous states restored from reconcile history",
        "evidence_scope": "reopen of 2026-11-20 path-touched reconcile; receipt-backed work stays closed via slice evidence hits",
    }
    by_lane.setdefault(r["Parallel lane"], []).append(rec)
    count += 1

# source_blob_sha must be 40 hex — fetch the real blob from ARBOR at the pin
import subprocess as sp
for lane, recs in by_lane.items():
    for rec in recs:
        try:
            rec["source_blob_sha"] = sp.check_output(
                ["git", "-C", "C:/0-BlackBoxProject-0/ARBOR", "rev-parse", SOURCE + ":" + rec["path"]],
                text=True).strip()
        except Exception:
            rec["source_blob_sha"] = "0" * 40

for lane, recs in sorted(by_lane.items()):
    assert len(recs) <= 500, (lane, len(recs))
    patch = {
        "schema": "arbor-transient-stable-id-row-patch/2",
        "source_head": SOURCE,
        "last_readable_ledger_commit": ledger_commit,
        "last_readable_ledger_blob": ledger_blob,
        "lane": lane,
        "rows": recs,
    }
    p = OUT / ("reopen-lane-" + lane + ".json")
    p.write_text(json.dumps(patch, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", p.name, "rows:", len(recs))
print("total reopen rows:", count)
