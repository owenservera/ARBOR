# File: studio/bin/commands/library.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/library.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12993 B |
| Lines | 258 |
| Hash | 8ac62e81ec00 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fieldPathCount | function | 10 | no | const fieldPathCount = (shapes) =&gt; new Set((shapes ?? []).flatMap((s) =&gt; (s.fields ?? []).map((f) =&gt; f.path))).size; |
| coveragePairs | function | 12 | no | function coveragePairs(built) { |
| ref | const | 40 | no | const ref = ctx.args[0]; |
| built | const | 42 | no | const built = buildFamily({ sessionsDir: ctx.paths.sessions, host: ref, site: ref, profilesDir: ctx.paths.profiles, minSessions: ctx.flags.min ?? 1, }); |
| written | const | 68 | no | const written = writeFamily({ familiesDir: ctx.paths.families, built }); |
| ref | const | 85 | no | const ref = ctx.args[0]; |
| store | const | 87 | no | const store = ctx.families(); |
| want | const | 88 | no | const want = String(ref).toLowerCase(); |
| names | const | 89 | no | const names = store.names(); |
| id | variable | 90 | no | let id = names.find((n) =&gt; n.toLowerCase() === want); |
| f | const | 95 | no | const f = store.load(n); |
| fam | const | 101 | no | const fam = store.load(id); |
| shapes | const | 102 | no | const shapes = fam.shapes ?? []; |
| store | const | 135 | no | const store = ctx.families(); |
| rows | const | 136 | no | const rows = store.names().map((n) =&gt; { let f = {}; try { f = store.load(n); } catch { /* unreadable version: list it bare */ } return { id: n, |
| f | variable | 137 | no | let f = {}; |
| CORE_ENV_CODES | const | 170 | no | const CORE_ENV_CODES = new Set([&#39;EACCES&#39;, &#39;EPERM&#39;, &#39;ENOSPC&#39;, &#39;EROFS&#39;, &#39;ENOTDIR&#39;, &#39;ENOENT&#39;]); |
| renderCoreLibrary | function | 172 | no | function renderCoreLibrary(o, library, written) { |
| c | const | 193 | no | const c = library.core; |
| known | const | 230 | no | const known = new Set(CORE_SITES); |
| wanted | const | 231 | no | const wanted = ctx.flags.sites |
| unknown | const | 235 | no | const unknown = wanted.filter((s) =&gt; !known.has(s)); |
| familiesDir | const | 238 | no | const familiesDir = ctx.flags.out ? path.resolve(String(ctx.flags.out)) : ctx.paths.families; |
| library | variable | 239 | no | let library, written; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 3 | external |
| ../../src/config.mjs | import | 4 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../lib/registry.mjs | import | 5 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 6 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/families/build.mjs | import | 7 | [studio/src/families/build.mjs](../../src/families/build.mjs.md) |
| ../../src/families/core.mjs | import | 8 | [studio/src/families/core.mjs](../../src/families/core.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/library.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// library build|show|list: publish only accepted, same-origin derived sessions as a family
// shape set, persist it through the existing FamilyStore, and inspect what was consolidated.
import path from 'node:path';
import { EXIT } from '../../src/config.mjs';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError, notFound, envError } from '../lib/ui.mjs';
import { buildFamily, writeFamily } from '../../src/families/build.mjs';
import { CORE_SITES, buildCoreLibrary, writeCoreLibrary, compareSites } from '../../src/families/core.mjs';

const fieldPathCount = (shapes) => new Set((shapes ?? []).flatMap((s) => (s.fields ?? []).map((f) => f.path))).size;

function coveragePairs(built) {
  return [
    ['members (accepted)', built.family.members.join(', ') || '(none)'],
    ['inspected', String(built.coverage.sessions)],
    ['eligible', String(built.coverage.eligible ?? 0)],
    ['withheld', String(built.coverage.withheld ?? 0)],
    ['exact origin', built.family.origin ?? '(none)'],
    ['hosts', built.family.hosts.join(', ') || '(none)'],
    ['transports', built.coverage.transports.join(', ') || '(none)'],
    ['streams', String(built.coverage.streams)],
    ['field paths', String(fieldPathCount(built.shapes))],
    ['signature', built.family.signature],
  ];
}

defineGroup('library', {
  section: 'Knowledge', default: 'build',
  summary: 'Publish accepted same-origin evidence into site families',
  description: 'Inspects all saved sessions but only publishes verified G1–G7 capture_accepted, complete-knowledge, exact-origin shapes. Unassessed and unverified evidence stays in its original session.',
});

define({
  name: 'library build', section: 'Knowledge', usage: '<host|site> [--min N]',
  summary: 'Build (and save) the family shape set for a site',
  description: 'Exits 0 when an eligible family is published, 3 if no sessions, 4 if none are accepted and eligible for publication.',
  flags: { min: { type: 'number', alias: 'n', valueName: 'N', default: 1, desc: 'Warn unless at least N sessions exist' } },
  examples: ['studio library build chatgpt.com', 'studio library build openai --min 3 --json'],
  async run(ctx) {
    const ref = ctx.args[0];
    if (!ref) throw usageError('Give a host or site to build the family from.', 'Example: studio library build chatgpt.com');
    const built = buildFamily({
      sessionsDir: ctx.paths.sessions, host: ref, site: ref,
      profilesDir: ctx.paths.profiles, minSessions: ctx.flags.min ?? 1,
    });

    if (!built.coverage.sessions) throw notFound(`No sessions for "${ref}".`, 'Record one with "studio capture <url>".');

    if (!built.coverage.withDerived) {
      ctx.out.emit({ ref, ...built, written: null }, (o) => {
        o.result(`No derived sessions for ${ref}: ${built.coverage.sessions} session(s), none derived.`);
        o.line('');
        o.line(`  Run "studio derive ${built.family.members[0]} --full" first.`);
      });
      process.exitCode = EXIT.INTEGRITY;
      return;
    }

    if (!(built.coverage.eligible > 0) || !built.shapes.length) {
      ctx.out.emit({ ref, ...built, written: null }, (o) => {
        o.result(`Family publication withheld for ${ref}: ${built.coverage.sessions} session(s) inspected, ${built.coverage.eligible ?? 0} eligible.`);
        for (const w of built.warnings) o.line(`  ${w}`);
        o.line('  Only an independently traceable capture_accepted G1–G7 verdict permits shape publication.');
      });
      process.exitCode = EXIT.INTEGRITY;
      return;
    }
    const written = writeFamily({ familiesDir: ctx.paths.families, built });
    ctx.out.emit({ ...built, fieldPaths: fieldPathCount(built.shapes), written }, (o) => {
      o.result(`Family ${built.family.id}: ${built.coverage.eligible} accepted contributor(s) of ${built.coverage.sessions} inspected.`);
      o.line('');
      o.kv(coveragePairs(built));
      o.line('');
      o.line(o.c.dim(`saved ${written.store} v${written.version} -> ${written.dir}`));
      if (built.warnings.length) { o.line(''); for (const w of built.warnings) o.line(o.c.dim(`warning: ${w}`)); }
    });
  },
});

define({
```

_First 80 of 259 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
