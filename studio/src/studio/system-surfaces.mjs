/**
 * @hq:context Machine-readable CLI surface: every command, flag, subcommand and its authority.
 * @hq:owner atlas
 * @hq:task VC-31
 * @hq:invariant authority is derived from the definition, never hand-annotated.
 */
// The full command surface as data, so another program (an agent, a scheduler, a UI) can decide what
// it may call without reading this repository's prose. Generated from the live registry on demand.

const GATING_FLAGS = new Set(['execute', 'authorize-send', 'apply', 'force', 'confirm']);
const MUTATING_NAME = /^(launch|drive|serve|start|setup|replay|capture|chat|atoms|system|ask|companion|campaign|pair reset|tools call|mirror serve|integrity build|library build|profile apply|profile set|profile op|config set|config unset|session delete|session prune|session compact|recipe run|recipe finish|recipe reconcile|run create|run step|run finish|export dataset|learn teach|personal-agent advance|personal-agent plan|personal-agent queue)$/i;
const READISH = /^(help|version|doctor|paths|status|list|get|show|search|find|explain|verify|check|plan|completion|commands|vars|coverage)$/i;

/** Parse `<a|b|c>` out of a usage string into a subcommand list. */
export function parseSubcommands(usage) {
  const m = /<([^>]+)>/.exec(String(usage ?? ''));
  if (!m) return [];
  return m[1].split('|').map((s) => s.trim()).filter((s) => s && !s.includes(' '));
}

/**
 * Two independent signals, never conflated:
 *  - `gated`  is PROVABLE from the definition: the command declares a gating flag or its usage
 *             mentions --execute/--authorize-send. Gated means the CLI itself will refuse without it.
 *  - `mutating` is a HEURISTIC on the command name, marked as such. It is a hint for a scheduler,
 *             not a guarantee, and callers must not treat it as authority.
 */
export function authorityOf(def) {
  const flags = def.flags ?? {};
  const usage = String(def.usage ?? '');
  const gatingFlag = Object.keys(flags).find((f) => GATING_FLAGS.has(f)) ?? null;
  const gated = Boolean(gatingFlag) || /--(execute|authorize-send)/.test(usage);
  const name = String(def.name ?? '');
  const head = name.split(' ')[0];
  const mutating = MUTATING_NAME.test(name) || MUTATING_NAME.test(head);
  const readish = READISH.test(name.split(' ').pop() ?? '');
  return {
    gated,
    gatingFlag: gatingFlag ? `--${gatingFlag}` : (gated ? 'usage' : null),
    mutating: mutating && !readish,
    authorityReason: gated
      ? `declares ${gatingFlag ? '--' + gatingFlag : '--execute in usage'}`
      : mutating && !readish ? 'name matches a known mutator (heuristic)' : 'no gating flag; classified read',
  };
}

function shapeFlags(flags, globalFlags) {
  const out = [];
  for (const [name, f] of Object.entries(flags ?? {})) {
    out.push({
      name: `--${name}`,
      type: f.type ?? 'string',
      valueName: f.valueName ?? null,
      alias: f.alias ?? null,
      default: f.default ?? null,
      description: f.desc ?? '',
      scope: 'command',
    });
  }
  for (const [name, f] of Object.entries(globalFlags ?? {})) {
    out.push({
      name: `--${name}`,
      type: f.type ?? 'string',
      valueName: f.valueName ?? null,
      alias: f.alias ?? null,
      default: f.default ?? null,
      description: f.desc ?? '',
      scope: 'global',
    });
  }
  return out;
}

/**
 * The whole surface. `registry` is injected so this module stays testable without booting the CLI.
 */
export function buildSurface({ commands, groups = [], globalFlags = {} } = {}) {
  if (!Array.isArray(commands) || !commands.length) {
    throw new Error('CLI_SURFACE_NO_REGISTRY');
  }
  const shaped = commands
    .filter((c) => c && typeof c.name === 'string')
    .map((c) => {
      const auth = authorityOf(c);
      return {
        name: c.name,
        section: c.section ?? '',
        summary: c.summary ?? '',
        description: c.description ?? '',
        usage: c.usage ?? '',
        aliases: c.aliases ?? [],
        hidden: Boolean(c.hidden),
        subcommands: parseSubcommands(c.usage),
        gated: auth.gated,
        gatingFlag: auth.gatingFlag,
        mutating: auth.mutating,
        authorityReason: auth.authorityReason,
        flags: shapeFlags(c.flags, globalFlags),
        examples: c.examples ?? [],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const gated = shaped.filter((c) => c.gated);
  const mutating = shaped.filter((c) => c.mutating);
  return {
    schema: 'vivim.cli-surface/1',
    generatedAt: new Date().toISOString(),
    counts: {
      commands: shaped.length,
      gated: gated.length,
      mutating: mutating.length,
      groups: groups.length,
      globalFlags: Object.keys(globalFlags).length,
    },
    globalFlags: Object.entries(globalFlags).map(([name, f]) => ({
      name: `--${name}`, type: f.type ?? 'string', alias: f.alias ?? null, description: f.desc ?? '',
    })),
    gatedSurface: gated.map((c) => ({ name: c.name, gatingFlag: c.gatingFlag })),
    mutatingSurface: mutating.map((c) => ({ name: c.name, reason: c.authorityReason })),
    groups: groups.map((g) => ({ name: g.name ?? g.id ?? g, summary: g.summary ?? '' })),
    commands: shaped,
  };
}

/** One-line human summary of a surface. */
export function summariseSurface(surface) {
  const c = surface.counts;
  return [
    `${c.commands} command(s): ${c.gated} gated by an explicit authority flag, ${c.mutating} mutating by name (heuristic)`,
    `gated commands refuse to run without it: ${surface.gatedSurface.map((x) => x.name).join(", ") || "none"}`,
  ];
}

/**
 * Load the live registry and build the surface. Command modules register themselves on import, so
 * every file in bin/commands is imported first — otherwise the registry is empty and the surface
 * would report zero commands as if that were the truth.
 */
export async function listSurfaces() {
  const { readdirSync } = await import('node:fs');
  const { pathToFileURL } = await import('node:url');
  const path = await import('node:path');
  const commandsDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../bin/commands');
  const registry = await import('../../bin/lib/registry.mjs');
  if (registry.allCommands().length === 0) {
    for (const file of readdirSync(commandsDir).filter((f) => f.endsWith('.mjs'))) {
      try { await import(pathToFileURL(path.join(commandsDir, file)).href); } catch { /* a broken command must not hide the rest */ }
    }
  }
  const commands = registry.allCommands();
  const groups = typeof registry.allGroups === 'function' ? [...registry.allGroups().entries()].map(([name, g]) => ({ name, ...g })) : [];
  return buildSurface({ commands, groups, globalFlags: registry.GLOBAL_FLAGS ?? {} });
}
