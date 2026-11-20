import io, re, sys

# runUnit creates the same role (builder/verifier/tracer) at several sites, all named
# "Lane X <role> " + u.id + " w" + round -> DuplicateActorName when two sites run in
# one call. Suffix the 2nd+ site per role:  + " w" + round  ->  + " w" + round + "x"
LINE = re.compile(r'^(\s*const \w+ = agent\("Lane [A-E] (builder|verifier|tracer) " \+ u\.id \+ " w" \+ round)(,.*)$', re.M)

def patch(path):
    s = io.open(path, encoding="utf-8").read()
    counts = {}
    def repl(m):
        role = m.group(2)
        n = counts.get(role, 0)
        counts[role] = n + 1
        suffix = "" if n == 0 else chr(ord("x") + n - 1)
        if not suffix:
            return m.group(0)
        return m.group(1) + ' + "' + suffix + '"' + m.group(3)
    s2 = LINE.sub(repl, s)
    io.open(path, "w", encoding="utf-8", newline="").write(s2)
    print(path, counts)

for p in sys.argv[1:]:
    patch(p)
