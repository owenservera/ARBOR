# File: studio/bin/lib/registry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/lib/registry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10822 B |
| Lines | 174 |
| Hash | dcdb871cb73c |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SECTIONS | const | 5 | yes | export const SECTIONS = [&#39;Get started&#39;, &#39;Capture&#39;, &#39;Sessions&#39;, &#39;Replay and derive&#39;, &#39;Export&#39;, &#39;Knowledge&#39;, &#39;Learning&#39;, &#39;Profiles and families&#39;, &#39;System&#39;]; |
| GLOBAL_FLAGS | const | 7 | yes | export const GLOBAL_FLAGS = { |
| commands | const | 18 | no | const commands = new Map(); // &#39;profile list&#39; -&gt; def |
| groups | const | 19 | no | const groups = new Map(); // &#39;profile&#39; -&gt; { summary, default, passthrough, section, subAliases } |
| aliases | const | 20 | no | const aliases = new Map(); // &#39;sessions&#39; -&gt; &#39;session list&#39; |
| define | function | 23 | yes | export function define(def) { |
| defineGroup | function | 28 | yes | export function defineGroup(name, def) { |
| allCommands | function | 32 | yes | export const allCommands = () =&gt; [...commands.values()]; |
| allGroups | function | 33 | yes | export const allGroups = () =&gt; groups; |
| resolveCommand | function | 35 | yes | export function resolveCommand(words) { |
| canonical | const | 38 | no | const canonical = aliases.get(w0) ?? w0; |
| g | const | 41 | no | const g = groups.get(canonical); |
| sub | const | 42 | no | const sub = g.subAliases[w1] ?? w1; |
| subs | const | 45 | no | const subs = subNames(canonical); |
| near | const | 46 | no | const near = closest(w1, subs); |
| all | const | 49 | no | const all = topLevelNames(); |
| near | const | 50 | no | const near = closest(w0, all); |
| subNames | function | 54 | yes | export const subNames = (group) =&gt; allCommands().filter((c) =&gt; c.name.startsWith(`${group} `)).map((c) =&gt; c.name.slice(group.length + 1)); |
| topLevelNames | function | 55 | yes | export function topLevelNames() { |
| names | const | 56 | no | const names = new Set([...groups.keys(), ...aliases.keys()]); |
| flagLine | function | 64 | no | function flagLine(name, def) { |
| left | const | 65 | no | const left = `${def.alias ? `-${def.alias}, ` : &#39; &#39;}--${name}${def.type === &#39;boolean&#39; ? &#39;&#39; : ` &lt;${def.valueName ?? def.type}&gt;`}`; |
| extra | const | 66 | no | const extra = [def.choices ? `one of ${def.choices.join(&#39;\|&#39;)}` : &#39;&#39;, def.default !== undefined ? `default ${def.default}` : &#39;&#39;].filter(Boolean).join(&#39;; &#39;); |
| twoCol | function | 69 | no | function twoCol(rows, indent = 2) { |
| w | const | 70 | no | const w = Math.max(0, ...rows.map((r) =&gt; r.left.length)); |
| renderRootHelp | function | 74 | yes | export function renderRootHelp({ version, dataDir }) { |
| lines | const | 75 | no | const lines = [`Capture Studio ${version} — local, read-only website capture, replay and knowledge`, &#39;&#39;, &#39;Usage: studio &lt;command&gt; [options] studio help &lt;command&gt;&#39;, &#39;&#39;]; |
| rows | const | 77 | no | const rows = []; |
| seenGroups | const | 78 | no | const seenGroups = new Set(); |
| top | const | 81 | no | const top = c.name.split(&#39; &#39;)[0]; |
| g | const | 85 | no | const g = groups.get(top); |
| renderCommandHelp | function | 96 | yes | export function renderCommandHelp(def) { |
| lines | const | 97 | no | const lines = [`studio ${def.name}${def.usage ? ` ${def.usage}` : &#39;&#39;}`, &#39;&#39;, def.description ?? def.summary]; |
| renderGroupHelp | function | 104 | yes | export function renderGroupHelp(name) { |
| g | const | 105 | no | const g = groups.get(name); |
| subs | const | 106 | no | const subs = allCommands().filter((c) =&gt; c.name.startsWith(`${name} `)); |
| lines | const | 107 | no | const lines = [`studio ${name} &lt;command&gt;`, &#39;&#39;, g?.description ?? g?.summary ?? &#39;&#39;, &#39;&#39;, &#39;Commands&#39;, twoCol(subs.map((c) =&gt; ({ left: `${c.name.slice(name.length + 1)}${c.usage ? ` ${c.usage}` : &#39;&#39;}`, r… |
| flagWords | function | 114 | no | function flagWords(def) { |
| completionScript | function | 118 | yes | export function completionScript(shell) { |
| tops | const | 119 | no | const tops = topLevelNames(); |
| subsOf | const | 120 | no | const subsOf = Object.fromEntries([...groups.keys()].map((g) =&gt; [g, [...subNames(g), ...Object.keys(groups.get(g).subAliases)]])); |
| flagTable | const | 121 | no | const flagTable = allCommands().map((c) =&gt; [c.name, flagWords(c)]); |
| aliasTable | const | 122 | no | const aliasTable = [...aliases].map(([a, target]) =&gt; [a, target]); |
| globalWords | const | 123 | no | const globalWords = Object.keys(GLOBAL_FLAGS).map((f) =&gt; `--${f}`); |
| sh | function | 125 | no | const sh = (s) =&gt; `&#39;${s.replace(/&#39;/g, `&#39;\\\\&#39;&#39;`)}&#39;`; |
| script | const | 126 | no | const script = [ |
| q | function | 151 | no | const q = (s) =&gt; `&#39;${s.replace(/&#39;/g, &quot;&#39;&#39;&quot;)}&#39;`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./args.mjs | import | 2 | [studio/bin/lib/args.mjs](./args.mjs.md) |
| ./ui.mjs | import | 3 | [studio/bin/lib/ui.mjs](./ui.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/ask.mjs](../commands/ask.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/atoms.mjs](../commands/atoms.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/bridge.mjs](../commands/bridge.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/campaign.mjs](../commands/campaign.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/capture.mjs](../commands/capture.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/chat.mjs](../commands/chat.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/companion.mjs](../commands/companion.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/drive.mjs](../commands/drive.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/export.mjs](../commands/export.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/knowledge.mjs](../commands/knowledge.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/learn.mjs](../commands/learn.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/library.mjs](../commands/library.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/mirror.mjs](../commands/mirror.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/personal-agent.mjs](../commands/personal-agent.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/platform.mjs](../commands/platform.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/profiles.mjs](../commands/profiles.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/providers.mjs](../commands/providers.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/recipes.mjs](../commands/recipes.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/relay.mjs](../commands/relay.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/replay.mjs](../commands/replay.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/run.mjs](../commands/run.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/selftest.mjs](../commands/selftest.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/sessions.mjs](../commands/sessions.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/setup.mjs](../commands/setup.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/state.mjs](../commands/state.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/system.mjs](../commands/system.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/tools.mjs](../commands/tools.mjs.md) | ../lib/registry.mjs |
| [studio/bin/commands/wrap.mjs](../commands/wrap.mjs.md) | ../lib/registry.mjs |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./lib/registry.mjs |
| [studio/src/studio/system-surfaces.mjs](../../src/studio/system-surfaces.mjs.md) | ../../bin/lib/registry.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Command registry: definitions, group/alias resolution, help text, shell completion.
import { closest } from './args.mjs';
import { usageError } from './ui.mjs';

export const SECTIONS = ['Get started', 'Capture', 'Sessions', 'Replay and derive', 'Export', 'Knowledge', 'Learning', 'Profiles and families', 'System'];

export const GLOBAL_FLAGS = {
  'data-dir': { type: 'string', valueName: 'DIR', desc: 'Where sessions/profiles/learner state live (env CAPTURE_STUDIO_HOME)' },
  port: { type: 'number', valueName: 'N', desc: 'Chrome DevTools port (env CAPTURE_STUDIO_CDP_PORT, default 9222)' },
  json: { type: 'boolean', desc: 'Machine-readable JSON on stdout; progress and errors go to stderr' },
  quiet: { type: 'boolean', alias: 'q', desc: 'Suppress progress and decoration' },
  color: { type: 'boolean', desc: 'Colored output (use --no-color to disable; NO_COLOR is honored)' },
  verbose: { type: 'boolean', alias: 'v', desc: 'Show stack traces on errors' },
  help: { type: 'boolean', alias: 'h', desc: 'Show help for the command' },
  version: { type: 'boolean', alias: 'V', desc: 'Print version' },
};

const commands = new Map();   // 'profile list' -> def
const groups = new Map();     // 'profile' -> { summary, default, passthrough, section, subAliases }
const aliases = new Map();    // 'sessions' -> 'session list'

// def: { name, section, summary, usage, description, flags, examples, noData, hidden, run(ctx) }
export function define(def) {
  if (commands.has(def.name)) throw new Error(`duplicate command ${def.name}`);
  commands.set(def.name, { flags: {}, examples: [], usage: '', ...def });
  for (const a of def.aliases ?? []) aliases.set(a, def.name);
}
export function defineGroup(name, def) {
  groups.set(name, { passthrough: false, subAliases: {}, ...def });
  for (const a of def.aliases ?? []) aliases.set(a, name);
}
export const allCommands = () => [...commands.values()];
export const allGroups = () => groups;

export function resolveCommand(words) {
  const [w0, w1] = words;
  if (w0 === undefined) return { def: commands.get('help'), consumed: 0 };
  const canonical = aliases.get(w0) ?? w0;
  if (commands.has(canonical)) return { def: commands.get(canonical), consumed: 1 };
  if (groups.has(canonical)) {
    const g = groups.get(canonical);
    const sub = g.subAliases[w1] ?? w1;
    if (sub && commands.has(`${canonical} ${sub}`)) return { def: commands.get(`${canonical} ${sub}`), consumed: 2, group: canonical };
    if (sub === undefined || g.passthrough) return { def: commands.get(`${canonical} ${g.default}`), consumed: 1, group: canonical };
    const subs = subNames(canonical);
    const near = closest(w1, subs);
    throw usageError(`Unknown ${canonical} command "${w1}".`, near.length ? `Did you mean "${canonical} ${near[0]}"?` : `Available: ${subs.join(', ')}. See "studio help ${canonical}".`);
  }
  const all = topLevelNames();
  const near = closest(w0, all);
  throw usageError(`Unknown command "${w0}".`, near.length ? `Did you mean "${near.join('" or "')}"?` : 'Run "studio help" for the command list.');
}

export const subNames = (group) => allCommands().filter((c) => c.name.startsWith(`${group} `)).map((c) => c.name.slice(group.length + 1));
export function topLevelNames() {
  const names = new Set([...groups.keys(), ...aliases.keys()]);
  for (const c of commands.values()) if (!c.name.includes(' ') && !c.hidden) names.add(c.name);
  return [...names].sort();
}

// ---------------------------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------------------------
function flagLine(name, def) {
  const left = `${def.alias ? `-${def.alias}, ` : '    '}--${name}${def.type === 'boolean' ? '' : ` <${def.valueName ?? def.type}>`}`;
  const extra = [def.choices ? `one of ${def.choices.join('|')}` : '', def.default !== undefined ? `default ${def.default}` : ''].filter(Boolean).join('; ');
  return { left, right: `${def.desc ?? ''}${extra ? ` (${extra})` : ''}` };
}
function twoCol(rows, indent = 2) {
  const w = Math.max(0, ...rows.map((r) => r.left.length));
  return rows.map((r) => `${' '.repeat(indent)}${r.left.padEnd(w)}  ${r.right}`).join('\n');
}

export function renderRootHelp({ version, dataDir }) {
  const lines = [`Capture Studio ${version} — local, read-only website capture, replay and knowledge`, '', 'Usage: studio <command> [options]      studio help <command>', ''];
  for (const section of SECTIONS) {
    const rows = [];
    const seenGroups = new Set();
    for (const c of allCommands()) {
      if (c.section !== section || c.hidden) continue;
```

_First 80 of 175 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
