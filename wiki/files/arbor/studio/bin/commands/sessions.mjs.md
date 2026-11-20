# File: studio/bin/commands/sessions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/sessions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23553 B |
| Lines | 312 |
| Hash | 460ecb9f1565 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sessionRow | function | 19 | no | const sessionRow = (m) =&gt; ({ explanation: m.status === &#39;recording&#39; ? &#39;This conversation was still being saved. Its saved messages may be incomplete.&#39; : m.status === &#39;complete&#39; ? &#39;Saving finished. Onl… |
| session | const | 34 | no | const session = ctx.session(ctx.args[0]); |
| result | const | 37 | no | const result = await session[method](); |
| session | const | 53 | no | const session = ctx.session(ctx.args[0]); |
| f | const | 55 | no | const f = ctx.flags, method = f[&#39;dry-run&#39;] ? &#39;compactionEstimate&#39; : &#39;compact&#39;; |
| outDir | const | 58 | no | const outDir = `raw-compact-${randomUUID()}`; |
| result | const | 60 | no | const result = await session[method]({ mergeChunks: f[&#39;merge-chunks&#39;] !== false, replace: !!f.replace, out: outDir }); |
| f | const | 78 | no | const f = ctx.flags; |
| list | variable | 79 | no | let list = ctx.listSessions(); |
| total | const | 85 | no | const total = list.length; |
| rows | variable | 87 | no | let rows = list.map(sessionRow); |
| cols | const | 93 | no | const cols = [ |
| s | const | 109 | no | const s = ctx.session(ctx.args[0]); |
| m | const | 110 | no | const m = s.meta; |
| receipt | const | 111 | no | const receipt = s.kv.get(&#39;RECEIPT&#39;, null); |
| catalog | const | 112 | no | const catalog = await datasetCatalog(s, { counts: !!ctx.flags.counts }); |
| row | const | 113 | no | const row = sessionRow({ ...(ctx.listSessions().find((x) =&gt; x.id === s.id) ?? m) }); |
| data | const | 114 | no | const data = { |
| s | const | 141 | no | const s = ctx.session(ctx.args[0]); |
| catalog | const | 142 | no | const catalog = await datasetCatalog(s, { counts: true }); |
| s | const | 158 | no | const s = ctx.session(ctx.args[0]); |
| f | const | 160 | no | const f = ctx.flags; |
| rows | variable | 161 | no | let rows = await readRows(s, &#39;streams&#39;); |
| s | const | 179 | no | const s = ctx.session(ctx.args[0]); |
| kinds | const | 181 | no | const kinds = ctx.flags.kind ? new Set(ctx.flags.kind) : null; |
| all | const | 182 | no | const all = await readRows(s, &#39;timeline&#39;); |
| t0 | const | 183 | no | const t0 = all[0]?.t ?? 0; |
| rows | const | 184 | no | const rows = all.filter((r) =&gt; !kinds \|\| kinds.has(r.k)).slice(0, ctx.flags.limit).map((r) =&gt; ({ ...r, offsetSeconds: +((r.t - t0) / 1000).toFixed(2) })); |
| s | const | 197 | no | const s = ctx.session(ctx.args[0]); |
| needle | const | 200 | no | const needle = ctx.flags.grep?.toLowerCase(); |
| rows | const | 201 | no | const rows = await readRows(s, &#39;events&#39;, { limit: ctx.flags.limit, filter: (e) =&gt; e.sid === ctx.flags.sid &amp;&amp; (!needle \|\| eventText(e).toLowerCase().includes(needle)) }); |
| t0 | const | 204 | no | const t0 = rows[0].t; |
| targets | const | 216 | no | const targets = ctx.args.map((a) =&gt; ctx.session(a)); |
| bytes | function | 218 | no | const bytes = (s) =&gt; ctx.listSessions().find((x) =&gt; x.id === s.id)?.rawBytes ?? 0; |
| sizes | const | 226 | no | const sizes = targets.map(bytes); |
| f | const | 242 | no | const f = ctx.flags; |
| all | const | 244 | no | const all = ctx.listSessions(); |
| protectedIds | const | 245 | no | const protectedIds = new Set(all.slice(0, f.keep ?? 0).map((s) =&gt; s.id)); |
| cutoff | const | 246 | no | const cutoff = f[&#39;older-than&#39;] ? parseSince(f[&#39;older-than&#39;]) : Infinity; |
| candidates | const | 247 | no | const candidates = all.filter((s) =&gt; !protectedIds.has(s.id) &amp;&amp; Date.parse(s.createdAt) &lt; cutoff &amp;&amp; (!f.site \|\| `${siteLabel(s)} ${s.target?.url ?? &#39;&#39;}`.toLowerCase().includes(f.site.toLowerCase())) … |
| bytes | const | 250 | no | const bytes = candidates.reduce((a, s) =&gt; a + s.rawBytes, 0); |
| sessions | const | 266 | no | const sessions = ctx.flags.all ? ctx.listSessions().map((m) =&gt; Session.open(ctx.paths.sessions, m.id)) : [ctx.session(ctx.args[0])]; |
| results | const | 267 | no | const results = []; |
| bad | const | 269 | no | const bad = results.filter((r) =&gt; !r.ok); |
| s | const | 284 | no | const s = ctx.session(ctx.args[0]); |
| r | const | 286 | no | const r = s.kv.get(&#39;RECEIPT&#39;); |
| s | const | 299 | no | const s = ctx.session(ctx.args[0]); |
| rep | const | 301 | no | const rep = s.kv.get(&#39;SHAPES&#39;); |
| list | variable | 302 | no | let list = rep.suggestions ?? []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:crypto | import | 3 | external |
| node:path | import | 4 | external |
| ../../src/store/session.mjs | import | 5 | [studio/src/store/session.mjs](../../src/store/session.mjs.md) |
| ../../src/export/export.mjs | import | 6 | [studio/src/export/export.mjs](../../src/export/export.mjs.md) |
| ../../src/config.mjs | import | 7 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../lib/registry.mjs | import | 8 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 9 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../lib/util.mjs | import | 10 | [studio/bin/lib/util.mjs](../lib/util.mjs.md) |
| ../lib/capabilities.mjs | import | 11 | [studio/bin/lib/capabilities.mjs](../lib/capabilities.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/sessions.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// session list|show|datasets|streams|timeline|events|delete|prune, plus verify, receipt, shapes
import { existsSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Session } from '../../src/store/session.mjs';
import { datasetCatalog } from '../../src/export/export.mjs';
import { EXIT } from '../../src/config.mjs';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError, notFound, CliError, fmtBytes, fmtAgo, fmtMs, fmtPct, parseSince, truncate, oneLine } from '../lib/ui.mjs';
import { needArg, knowledgeState, isDerived, siteLabel, looksActive, readRows, intFlag, eventText } from '../lib/util.mjs';
import { unavailable } from '../lib/capabilities.mjs';

defineGroup('session', {
  summary: 'List and inspect saved recordings', section: 'Sessions', default: 'list',
  description: 'Saved recordings: list, inspect, browse streams / timeline / events, delete and prune. A session reference is an id, a unique id prefix or suffix, "latest", "latest~N" or "latest:<site>".',
  subAliases: { ls: 'list', info: 'show', rm: 'delete' },
});

const sessionRow = (m) => ({
  explanation: m.status === 'recording' ? 'This conversation was still being saved. Its saved messages may be incomplete.'
    : m.status === 'complete' ? 'Saving finished. Only messages available on this computer can be reopened.'
      : 'Some information may be missing. Open the saved conversation to see what is available.',
  id: m.id, status: m.status, createdAt: m.createdAt, endedAt: m.endedAt ?? null, endReason: m.endReason ?? null,
  site: siteLabel(m), title: m.target?.title ?? '', url: m.target?.url ?? '', profile: m.profile ? `${m.profile.name}@v${m.profile.version}` : null,
  rawBytes: m.rawBytes ?? 0, integrityOk: m.integrity?.ok ?? null, records: m.integrity?.records ?? null,
});

for (const [command, method, summary] of [
  ['stats', 'rawStats', 'Raw storage statistics and index coverage'],
  ['reindex', 'reindex', 'Rebuild the raw seek index from saved segments'],
]) define({
  name: `session ${command}`, section: 'Sessions', usage: '[id|latest]', summary,
  async run(ctx) {
    const session = ctx.session(ctx.args[0]);
    if (typeof session[method] !== 'function') throw unavailable(`Session ${command}`);
    if (command === 'reindex' && looksActive(session)) throw new CliError('Stop recording before rebuilding the raw index.', { exit: EXIT.INTEGRITY, code: 'ACTIVE' });
    const result = await session[method]();
    ctx.out.emit({ session: session.id, result }, (out) => out.result(JSON.stringify(result, null, 2)));
  },
});

define({
  name: 'session compact', section: 'Sessions', usage: '[id|latest] [--dry-run | --replace --yes]',
  summary: 'Compact raw records into a new sidecar directory; original raw is kept',
  description: 'By default writes a uniquely named compacted sidecar. Merging chunks preserves bytes but changes record/timing granularity. --replace --yes makes it the active raw log and retains the original in a backup directory. Stop recording first.',
  flags: {
    'dry-run': { type: 'boolean', desc: 'Estimate savings without writing a compacted log' },
    replace: { type: 'boolean', desc: 'Make compacted raw active, retaining the original as a backup' },
    yes: { type: 'boolean', alias: 'y', desc: 'Confirm replacing the active raw log' },
    'merge-chunks': { type: 'boolean', desc: 'Merge adjacent chunks (default on; --no-merge-chunks to disable)' },
  },
  async run(ctx) {
    const session = ctx.session(ctx.args[0]);
    if (looksActive(session)) throw new CliError('Stop recording before compacting raw data.', { exit: EXIT.INTEGRITY, code: 'ACTIVE' });
    const f = ctx.flags, method = f['dry-run'] ? 'compactionEstimate' : 'compact';
    if (typeof session[method] !== 'function') throw unavailable(`Session ${method}`);
    if (f.replace && !f.yes && !f['dry-run']) throw usageError('--replace requires --yes; the original raw log will be kept as a backup.');
    const outDir = `raw-compact-${randomUUID()}`;
    if (existsSync(path.join(session.dir, outDir))) throw new CliError('Compaction destination already exists; retry.');
    const result = await session[method]({ mergeChunks: f['merge-chunks'] !== false, replace: !!f.replace, out: outDir });
    ctx.out.emit({ session: session.id, dryRun: !!f['dry-run'], ...(!f['dry-run'] ? { directory: f.replace ? 'raw' : outDir } : {}), result }, (out) => out.result(JSON.stringify(result, null, 2)));
  },
});

// ---------------------------------------------------------------------------------------------
define({
  name: 'session list', section: 'Sessions', aliases: ['sessions', 'ls'], usage: '[--site S] [--status ST]', summary: 'List saved recordings (newest first)',
  flags: {
    site: { type: 'string', valueName: 'TEXT', desc: 'Only sessions whose site/URL contains TEXT' },
    status: { type: 'string', valueName: 'STATUS', desc: 'Only sessions with this status (complete, recording, …; prefix match)' },
    since: { type: 'string', valueName: 'AGE|DATE', desc: 'Only sessions created within e.g. 7d, 12h, or after an ISO date' },
    limit: { type: 'number', alias: 'n', valueName: 'N', desc: 'Show at most N sessions' },
    sort: { type: 'string', choices: ['created', 'size', 'name'], default: 'created', desc: 'Sort order' },
    long: { type: 'boolean', desc: 'Add derived / knowledge state columns' },
  },
  examples: ['studio sessions', 'studio sessions --site claude.ai --since 7d --json', 'studio sessions --sort size -n 5 --long'],
  async run(ctx) {
    const f = ctx.flags;
    let list = ctx.listSessions();
    if (f.site) { const q = f.site.toLowerCase(); list = list.filter((s) => `${siteLabel(s)} ${s.target?.url ?? ''} ${s.site ?? ''}`.toLowerCase().includes(q)); }
```

_First 80 of 313 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
