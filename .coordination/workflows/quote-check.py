import io, sys

def scan(path):
    lines = io.open(path, encoding="utf-8").read().split("\n")
    bad = []
    for i, l in enumerate(lines, 1):
        n = 0
        esc = False
        for ch in l:
            if esc:
                esc = False
                continue
            if ch == "\\":
                esc = True
                continue
            if ch == '"':
                n += 1
        if n % 2 == 1:
            bad.append((i, l))
    return bad

for p in sys.argv[1:]:
    print("==", p)
    for i, l in scan(p):
        print("  L%d q=odd :: %s" % (i, l[:170]))
