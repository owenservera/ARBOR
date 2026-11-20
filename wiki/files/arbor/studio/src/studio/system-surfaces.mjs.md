# File: studio/src/studio/system-surfaces.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/system-surfaces.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6915 B |
| Lines | 154 |
| Hash | 6033ed335a9f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GATING_FLAGS | const | 10 | no | const GATING_FLAGS = new Set([&#39;execute&#39;, &#39;authorize-send&#39;, &#39;apply&#39;, &#39;force&#39;, &#39;confirm&#39;]); |
| MUTATING_NAME | const | 11 | no | const MUTATING_NAME = /^(launch\|drive\|serve\|start\|setup\|replay\|capture\|chat\|atoms\|system\|ask\|companion\|campaign\|pair reset\|tools call\|mirror serve\|integrity build\|library build\|profile apply\|profile … |
| READISH | const | 12 | no | const READISH = /^(help\|version\|doctor\|paths\|status\|list\|get\|show\|search\|find\|explain\|verify\|check\|plan\|completion\|commands\|vars\|coverage)$/i; |
| parseSubcommands | function | 15 | yes | export function parseSubcommands(usage) { |
| m | const | 16 | no | const m = /&lt;([^&gt;]+)&gt;/.exec(String(usage ?? &#39;&#39;)); |
| authorityOf | function | 28 | yes | export function authorityOf(def) { |
| flags | const | 29 | no | const flags = def.flags ?? {}; |
| usage | const | 30 | no | const usage = String(def.usage ?? &#39;&#39;); |
| gatingFlag | const | 31 | no | const gatingFlag = Object.keys(flags).find((f) =&gt; GATING_FLAGS.has(f)) ?? null; |
| gated | const | 32 | no | const gated = Boolean(gatingFlag) \|\| /--(execute\|authorize-send)/.test(usage); |
| name | const | 33 | no | const name = String(def.name ?? &#39;&#39;); |
| head | const | 34 | no | const head = name.split(&#39; &#39;)[0]; |
| mutating | const | 35 | no | const mutating = MUTATING_NAME.test(name) \|\| MUTATING_NAME.test(head); |
| readish | const | 36 | no | const readish = READISH.test(name.split(&#39; &#39;).pop() ?? &#39;&#39;); |
| shapeFlags | function | 47 | no | function shapeFlags(flags, globalFlags) { |
| out | const | 48 | no | const out = []; |
| buildSurface | function | 77 | yes | export function buildSurface({ commands, groups = [], globalFlags = {} } = {}) { |
| shaped | const | 81 | no | const shaped = commands |
| auth | const | 84 | no | const auth = authorityOf(c); |
| gated | const | 104 | no | const gated = shaped.filter((c) =&gt; c.gated); |
| mutating | const | 105 | no | const mutating = shaped.filter((c) =&gt; c.mutating); |
| summariseSurface | function | 127 | yes | export function summariseSurface(surface) { |
| c | const | 128 | no | const c = surface.counts; |
| listSurfaces | function | 140 | yes | export async function listSurfaces() { |
| path | const | 143 | no | const path = await import(&#39;node:path&#39;); |
| commandsDir | const | 144 | no | const commandsDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\\/([A-Za-z]:)/, &#39;$1&#39;)), &#39;../../bin/commands&#39;); |
| registry | const | 145 | no | const registry = await import(&#39;../../bin/lib/registry.mjs&#39;); |
| commands | const | 151 | no | const commands = registry.allCommands(); |
| groups | const | 152 | no | const groups = typeof registry.allGroups === &#39;function&#39; ? [...registry.allGroups().entries()].map(([name, g]) =&gt; ({ name, ...g })) : []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | dynamic | 141 | external |
| node:url | dynamic | 142 | external |
| node:path | dynamic | 143 | external |
| ../../bin/lib/registry.mjs | dynamic | 145 | [studio/bin/lib/registry.mjs](../../bin/lib/registry.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/wrap.mjs](../../bin/commands/wrap.mjs.md) | ../../src/studio/system-surfaces.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Machine-readable CLI surface: every command, flag, subcommand and its authority. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-31 |
| 5 | invariant | — | — | authority is derived from the definition, never hand-annotated. |

## Excerpt

```javascript
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
```

_First 80 of 155 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
