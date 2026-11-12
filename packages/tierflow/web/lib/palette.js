// The stylesheet owns the palette; the canvas cannot read CSS custom
// properties cheaply, so they are resolved once at boot and handed to the
// renderers as plain strings.

export function readTheme(root) {
  const target = root || document.documentElement;
  const cs = getComputedStyle(target);
  const pick = (name) => cs.getPropertyValue(name).trim();

  const theme = {
    bg: pick("--bg"),
    panel: pick("--panel"),
    panel2: pick("--panel-2"),
    inset: pick("--inset"),
    line: pick("--line"),
    line2: pick("--line-2"),
    txt: pick("--txt"),
    txt2: pick("--txt-2"),
    txt3: pick("--txt-3"),
    live: pick("--live"),
    cool: pick("--cool"),
    ok: pick("--ok"),
    err: pick("--err"),
    warn: pick("--warn"),
    steel: pick("--steel"),
    t1: pick("--t1"),
    t2: pick("--t2"),
    t3: pick("--t3"),
    lvlDebug: pick("--lvl-debug"),
    lvlInfo: pick("--lvl-info"),
    lvlWarn: pick("--lvl-warn"),
    lvlError: pick("--lvl-error"),
  };

  theme.state = {
    queued: theme.steel,
    running: theme.live,
    succeeded: theme.ok,
    failed: theme.err,
    cancelled: theme.txt3,
    timed_out: theme.warn,
  };

  theme.level = {
    debug: theme.lvlDebug,
    info: theme.lvlInfo,
    warn: theme.lvlWarn,
    error: theme.lvlError,
  };

  return theme;
}
