import io, re, sys

def patch(path):
    s = io.open(path, encoding="utf-8").read()
    stats = {}
    s, n = re.subn(r'^  const trackedBefore = await world\.run\("git", \["status", "--porcelain"\][^\n]*\n  const beforePaths = new Set\([^\n]*\n', "", s, flags=re.M)
    stats["before"] = n
    lines = s.split("\n")
    i = next((k for k, l in enumerate(lines) if "const after = await world.run" in l), None)
    if i is not None:
        k = next((k for k, l in enumerate(lines) if k > i and "if (outside.length" in l), None)
        if k is not None:
            end = next((k2 for k2 in range(k, min(k + 6, len(lines))) if lines[k2] == "  }"), None)
            if end is not None:
                lines[i:end + 1] = [
                    '  // Attribution by DECLARATION, not git: the builder reports the files it edited.',
                    '  const ownedSet = new Set(u.paths);',
                    '  const outside = delta.editedPaths.filter((x) => !ownedSet.has(x) && x.indexOf(".coordination/") !== 0);',
                    '  if (outside.length && /outside|out of scope/i.test(buildSummary)) {',
                    '    return { unit: u.id, phase: u.phase, verdict: "SLOT_VIOLATION", gateExit: -1, gateCommand: gate.command, repairs: 0, note: "builder declared edits outside its owned paths: " + outside.join(", "), ownedChanged: [] };',
                    '  }',
                ]
                stats["after"] = 1
    s = "\n".join(lines)
    s, n = re.subn(r'  // Re-snapshot AFTER all builder edits[^\n]*\n  const finalAfter = await world\.run[^\n]*\n  const finalPaths = [^\n]*\n  const finalChanged = [^\n]*\n  const ownedChanged = finalChanged\.filter\([^\n]*\n',
                   "  const ownedChanged = delta.editedPaths.filter((x) => ownedSet.has(x));\n", s)
    stats["final"] = n
    s, n = re.subn(r'  const ownedChanged = changed\.filter\(\(p\) => ownedSet\.has\(p\)\);',
                   "  const ownedChanged = delta.editedPaths.filter((x) => ownedSet.has(x));", s)
    stats["owned"] = n
    s = s.replace("createdTest: string;", "createdTest: string;\n  editedPaths: string[];", 1)
    s = s.replace('createdTest = first.createdTest || "";', 'createdTest = first.createdTest || "";\n    delta.editedPaths = first.editedPaths || [];')
    s = s.replace("for (const d of fix.discoveries || []) delta.discoveries.push(d);",
                  "for (const d of fix.discoveries || []) delta.discoveries.push(d);\n      for (const ep of fix.editedPaths || []) if (delta.editedPaths.indexOf(ep) < 0) delta.editedPaths.push(ep);")
    s = s.replace("Return JSON only: {changes:[{id,field,from,to,evidence}], discoveries:[{path,problem,kind}], status:'verified'|'replan'|'blocked', summary, createdTest}.",
                  "Return JSON only: {changes:[{id,field,from,to,evidence}], discoveries:[{path,problem,kind}], status:'verified'|'replan'|'blocked', summary, createdTest, editedPaths:[repo-relative paths you actually changed]}.")
    s = s.replace('const delta: Delta = { changes: [], discoveries: [], status: "replan", summary: "", createdTest: "" };',
                  'const delta: Delta = { changes: [], discoveries: [], status: "replan", summary: "", createdTest: "", editedPaths: [] };')
    s, n = re.subn(r'const work: UnitBrief\[\] = selected\.slice\(0, maxUnits\);',
                   "const seenIds = new Set<string>();\nconst work: UnitBrief[] = selected.filter((x) => { if (seenIds.has(x.id)) return false; seenIds.add(x.id); return true; }).slice(0, maxUnits);", s)
    stats["dedupe"] = n
    s = re.sub(r'(agent\("Lane ([A-E]) (builder|verifier|tracer) " \+ u\.id)', r'\1 + " w" + round', s)
    stats["names"] = s.count('" w" + round')
    s, n = re.subn(r'async function runUnit\(u: UnitBrief\)', "async function runUnit(u: UnitBrief, round: number)", s)
    stats["sig"] = n
    s = s.replace("wave.map((u) => runUnit(u))", "wave.map((u, k) => runUnit(u, i + k + 1))")
    stats["call"] = s.count("runUnit(u, i + k + 1)")
    io.open(path, "w", encoding="utf-8", newline="").write(s)
    print(path, stats, "lines:", s.count("\n") + 1)

for p in sys.argv[1:]:
    patch(p)