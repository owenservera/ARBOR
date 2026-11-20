# File: studio/bin/lib/context.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/lib/context.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4500 B |
| Lines | 76 |
| Hash | f6e8d9282c7e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| buildContext | function | 12 | yes | export function buildContext({ def, flags, args, argv }) { |
| paths | const | 13 | no | const paths = dataPaths(flags[&#39;data-dir&#39;] ? path.resolve(flags[&#39;data-dir&#39;]) : defaultDataDir()); |
| out | const | 19 | no | const out = createOutput({ json: settings.json \|\| !!flags.json, quiet: !!flags.quiet, color: settings.color, verbose: !!flags.verbose }); |
| profileStore | variable | 22 | no | let profileStore, familyStore, learnerInst; |
| ctx | const | 23 | no | const ctx = { |
| list | const | 33 | no | const list = listSessions(paths.sessions); |
| r | const | 35 | no | const r = ref === undefined \|\| ref === null \|\| ref === &#39;&#39; ? &#39;latest&#39; : String(ref); |
| m | const | 36 | no | const m = /^latest(?:~(\\d+))?(?::(.+))?$/.exec(r); |
| site | const | 38 | no | const site = m[2]?.toLowerCase(); |
| pool | const | 39 | no | const pool = site ? list.filter((s) =&gt; siteFromSession(s).includes(site) \|\| String(s.site ?? &#39;&#39;).toLowerCase().includes(site) \|\| String(s.target?.url ?? &#39;&#39;).toLowerCase().includes(site)) : list; |
| pick | const | 40 | no | const pick = pool[Number(m[1] ?? 0)]; |
| exact | const | 44 | no | const exact = list.find((s) =&gt; s.id === r); |
| hits | const | 46 | no | const hits = list.filter((s) =&gt; s.id.startsWith(r) \|\| s.id.endsWith(r) \|\| s.id.includes(r)); |
| store | const | 54 | no | const store = ctx.profiles(); |
| name | const | 55 | no | const name = override ?? session.meta.profile?.name ?? &#39;generic&#39;; |
| res | const | 67 | no | const res = await derive(session, ctx.profileFor(session, profile), { families: ctx.families(), learner: ctx.learner(), onProgress: (n) =&gt; out.progress(`${n} raw records`), }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 2 | external |
| ../../src/config.mjs | import | 3 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../../src/profiles/profiles.mjs | import | 4 | [studio/src/profiles/profiles.mjs](../../src/profiles/profiles.mjs.md) |
| ../../src/families/families.mjs | import | 5 | [studio/src/families/families.mjs](../../src/families/families.mjs.md) |
| ../../src/store/session.mjs | import | 6 | [studio/src/store/session.mjs](../../src/store/session.mjs.md) |
| ../../src/replay/derive.mjs | import | 7 | [studio/src/replay/derive.mjs](../../src/replay/derive.mjs.md) |
| ../../src/intel/learn.mjs | import | 8 | [studio/src/intel/learn.mjs](../../src/intel/learn.mjs.md) |
| ../../src/intel/continuity.mjs | import | 9 | [studio/src/intel/continuity.mjs](../../src/intel/continuity.mjs.md) |
| ./ui.mjs | import | 10 | [studio/bin/lib/ui.mjs](./ui.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./lib/context.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Per-invocation context: resolved paths/settings, lazily constructed stores, session lookup.
import path from 'node:path';
import { dataPaths, defaultDataDir, ensureDataDirs, resolveSettings } from '../../src/config.mjs';
import { ProfileStore } from '../../src/profiles/profiles.mjs';
import { FamilyStore } from '../../src/families/families.mjs';
import { Session, listSessions } from '../../src/store/session.mjs';
import { derive } from '../../src/replay/derive.mjs';
import { ScopedLearner } from '../../src/intel/learn.mjs';
import { siteFromSession } from '../../src/intel/continuity.mjs';
import { notFound, usageError, createOutput } from './ui.mjs';

export function buildContext({ def, flags, args, argv }) {
  const paths = dataPaths(flags['data-dir'] ? path.resolve(flags['data-dir']) : defaultDataDir());
  if (!def.noData) ensureDataDirs(paths);
  const { settings, sources, problems } = resolveSettings({
    configFile: paths.config,
    flags: { cdpPort: def.name.startsWith('mirror ') ? undefined : flags.port, json: flags.json, color: flags.color === undefined ? undefined : flags.color ? 'always' : 'never' },
  });
  const out = createOutput({ json: settings.json || !!flags.json, quiet: !!flags.quiet, color: settings.color, verbose: !!flags.verbose });
  for (const p of problems) out.warn(`config: ${p}`);

  let profileStore, familyStore, learnerInst;
  const ctx = {
    def, flags, args, argv, paths, settings, sources, out,
    port: settings.cdpPort,
    profiles() { return (profileStore ??= new ProfileStore(paths.profiles)); },
    families() { return (familyStore ??= new FamilyStore(paths.families)); },
    learner() { return (learnerInst ??= new ScopedLearner(paths.learner)); },
    listSessions() { return listSessions(paths.sessions); },

    // Session references: <id>, unique prefix/suffix/substring, latest, latest~N, latest:<site-substring>.
    session(ref) {
      const list = listSessions(paths.sessions);
      if (!list.length) throw notFound('No sessions recorded yet.', 'Record one with "studio capture <url>" or "studio record".');
      const r = ref === undefined || ref === null || ref === '' ? 'latest' : String(ref);
      const m = /^latest(?:~(\d+))?(?::(.+))?$/.exec(r);
      if (m) {
        const site = m[2]?.toLowerCase();
        const pool = site ? list.filter((s) => siteFromSession(s).includes(site) || String(s.site ?? '').toLowerCase().includes(site) || String(s.target?.url ?? '').toLowerCase().includes(site)) : list;
        const pick = pool[Number(m[1] ?? 0)];
        if (!pick) throw notFound(`No session matches "${r}"${site ? ` (${pool.length} for that site)` : ''}.`, 'List sessions with "studio sessions".');
        return Session.open(paths.sessions, pick.id);
      }
      const exact = list.find((s) => s.id === r);
      if (exact) return Session.open(paths.sessions, exact.id);
      const hits = list.filter((s) => s.id.startsWith(r) || s.id.endsWith(r) || s.id.includes(r));
      if (hits.length === 1) return Session.open(paths.sessions, hits[0].id);
      if (hits.length > 1) throw usageError(`"${r}" matches ${hits.length} sessions: ${hits.slice(0, 5).map((s) => s.id).join(', ')}${hits.length > 5 ? ', …' : ''}.`, 'Use a longer prefix or the full id.');
      throw notFound(`No session "${r}".`, `Newest is ${list[0].id}. List sessions with "studio sessions".`);
    },

    // Profile to derive with: explicit --profile, else the one recorded with the session, else generic.
    profileFor(session, override) {
      const store = ctx.profiles();
      const name = override ?? session.meta.profile?.name ?? 'generic';
      try { return store.load(name); } catch (e) {
        if (override) throw e;
        out.warn(`profile "${name}" is no longer available; deriving with "generic".`);
        return store.load('generic');
      }
    },

    // Derive when outputs are missing (or when forced). Returns the derive result or null if nothing ran.
    async ensureDerived(session, { force = false, profile, need = 'RECEIPT' } = {}) {
      if (!force && session.kv.get(need, null)) return null;
      out.info(`Deriving ${session.id}…`);
      const res = await derive(session, ctx.profileFor(session, profile), {
        families: ctx.families(), learner: ctx.learner(),
        onProgress: (n) => out.progress(`${n} raw records`),
      });
      out.progressDone();
      return res;
    },
  };
  return ctx;
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
