# File: studio/bin/commands/knowledge.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/knowledge.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 30752 B |
| Lines | 366 |
| Hash | 50c87eaa28e9 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| scopeFlags | const | 20 | no | const scopeFlags = { |
| tableFlags | const | 25 | no | const tableFlags = { |
| scopeSessions | function | 31 | no | function scopeSessions(ctx) { |
| f | const | 32 | no | const f = ctx.flags; |
| list | variable | 34 | no | let list = ctx.listSessions(); |
| entitiesOf | function | 40 | no | async function* entitiesOf(session) { |
| ds | const | 41 | no | const ds = session.dataset(&#39;entities&#39;); |
| knowledgeOf | function | 47 | no | async function knowledgeOf(ctx, ref) { |
| s | const | 48 | no | const s = ctx.session(ref); |
| model | const | 50 | no | const model = s.kv.get(&#39;MODEL&#39;, null); |
| showRows | function | 57 | no | async function showRows(ctx, name, rows, columns, extra = {}) { |
| f | const | 58 | no | const f = ctx.flags; |
| s | const | 69 | no | const s = ctx.session(ctx.args[0]); |
| st | const | 70 | no | const st = s.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| model | const | 71 | no | const model = s.kv.get(&#39;MODEL&#39;, null); |
| data | const | 72 | no | const data = { session: s.id, state: knowledgeState(s), status: st, types: model?.types?.length ?? null, relationships: model?.relationships?.length ?? null, error: model?.error ?? null, stage: model… |
| list | variable | 79 | no | let list = ctx.listSessions(); |
| rows | const | 82 | no | const rows = list.map((m) =&gt; { const s = Session.open(ctx.paths.sessions, m.id); const st = s.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); return { session: m.id, site: siteLabel(m), state: knowledgeState(s), t… |
| s | const | 83 | no | const s = Session.open(ctx.paths.sessions, m.id); |
| st | const | 84 | no | const st = s.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| tally | const | 87 | no | const tally = {}; for (const r of rows) tally[r.state] = (tally[r.state] ?? 0) + 1; |
| by | const | 98 | no | const by = new Map(); |
| site | const | 100 | no | const site = siteFromSession(m) \|\| &#39;(unknown)&#39;; |
| e | const | 101 | no | const e = by.get(site) ?? { site, origins: new Set(), sessions: 0, derived: 0, newest: m.createdAt }; |
| rows | const | 106 | no | const rows = [...by.values()].map((e) =&gt; ({ ...e, origins: [...e.origins] })).sort((a, b) =&gt; b.sessions - a.sessions); |
| counts | const | 117 | no | const counts = {}; |
| types | const | 119 | no | const types = model.types.map((t) =&gt; ({ id: t.id, name: t.name, key: t.key ? { field: t.key.field, weak: !!t.key.weak } : null, support: t.support, confidence: t.confidence, entities: counts[t.id] ??… |
| byKind | const | 120 | no | const byKind = {}; for (const r of model.relationships ?? []) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1; |
| dropped | const | 121 | no | const dropped = Object.values(model.corpus?.dropped ?? {}).reduce((a, b) =&gt; a + b, 0); |
| f | const | 145 | no | const f = ctx.flags; |
| needle | const | 146 | no | const needle = f.grep?.toLowerCase(); |
| rows | variable | 147 | no | let rows = []; |
| order | const | 154 | no | const order = { observations: (a, b) =&gt; (b.observations ?? 0) - (a.observations ?? 0), first: (a, b) =&gt; (a.first ?? 0) - (b.first ?? 0), last: (a, b) =&gt; (b.last ?? 0) - (a.last ?? 0), type: (a, b) =&gt;… |
| total | const | 156 | no | const total = rows.length; |
| want | const | 171 | no | const want = a1 ?? a0; |
| all | const | 172 | no | const all = []; for await (const e of entitiesOf(s)) all.push(e); |
| exact | const | 173 | no | const exact = all.filter((e) =&gt; e.eid === want); |
| hits | const | 174 | no | const hits = exact.length ? exact : all.filter((e) =&gt; String(e.eid).startsWith(want) \|\| (e.key !== null &amp;&amp; e.key !== undefined &amp;&amp; String(e.key) === want)); |
| e | const | 177 | no | const e = hits[0]; |
| neighbors | const | 178 | no | const neighbors = (graph?.edges ?? []).filter((x) =&gt; x.from === e.eid \|\| x.to === e.eid).map(({ evidence, statusHistory, ...x }) =&gt; x); |
| across | variable | 179 | no | let across = null; |
| site | const | 181 | no | const site = siteFromSession(s.meta), origin = originFromSession(s.meta); |
| view | const | 183 | no | const view = await buildSiteContinuity(ctx.paths.sessions, { site, origin, eid: e.eid, limit: 5, includeHistory: true }); |
| revs | const | 191 | no | const revs = (e.revisions ?? []).slice(-ctx.flags.history); |
| f | const | 215 | no | const f = ctx.flags; |
| edges | variable | 216 | no | let edges = graph.edges ?? []; |
| total | const | 222 | no | const total = edges.length; |
| rows | const | 223 | no | const rows = edges.slice(0, f.limit).map(({ evidence, statusHistory, ...e }) =&gt; e); |
| st | const | 225 | no | const st = graph.stats ?? {}; |
| t | const | 240 | no | const t = parseAt(ctx.flags.t, await sessionStartT(s)); |
| g | const | 241 | no | const g = new TemporalGraph(); |
| st | const | 244 | no | const st = g.stateAt(t); |
| rows | const | 245 | no | const rows = st.nodes.slice(0, ctx.flags.limit).map((n) =&gt; ({ ...n, attributes: attrSummary(n.attrs) })); |
| f | const | 257 | no | const f = ctx.flags; |
| ref | function | 258 | no | const ref = (x) =&gt; (x ? x.entity ?? (x.stream ? `stream:${x.stream}` : x.actionSeq !== undefined ? `action:${x.actionSeq}` : x.sid ? `stream:${x.sid}` : x.element !== undefined ? `dom:${x.element}` :… |
| rows | variable | 259 | no | let rows = [ |
| total | const | 266 | no | const total = rows.length; |
| terms | const | 280 | no | const terms = parseQuery(ctx.args); |
| rows | const | 281 | no | const rows = []; let scanned = 0, total = 0; |
| q | const | 300 | no | const q = ctx.args.join(&#39; &#39;).trim(); |
| layers | const | 303 | no | const layers = ctx.flags.layers ? new Set(ctx.flags.layers) : null; |
| hits | const | 306 | no | const hits = []; |
| sessions | const | 307 | no | const sessions = scopeSessions(ctx); |
| result | const | 309 | no | const result = await searchSession(s, q, { limit: ctx.flags.limit * (layers ? 4 : 1) }); |
| rows | const | 310 | no | const rows = Array.isArray(result) ? result : result.hits ?? result.results ?? result.rows ?? []; |
| source | const | 312 | no | const source = h.source ?? h.document?.source ?? {}; |
| rawLayer | const | 313 | no | const rawLayer = h.layer ?? source.layer ?? source.kind ?? (source.domId !== undefined ? &#39;dom&#39; : source.eid ? &#39;entities&#39; : &#39;events&#39;); |
| layer | const | 314 | no | const layer = ({ L2: &#39;events&#39;, L3: &#39;dom&#39;, entity: &#39;entities&#39;, event: &#39;events&#39; })[rawLayer] ?? rawLayer; |
| shown | const | 320 | no | const shown = hits.slice(0, ctx.flags.limit); |
| session | const | 336 | no | const session = ctx.session(ctx.flags.session); |
| result | const | 337 | no | const result = await schemaForType(session, type, { jsonSchema: !!ctx.flags[&#39;json-schema&#39;] }); |
| s | const | 347 | no | const s = ctx.session(ctx.args[0]); |
| site | const | 348 | no | const site = siteFromSession(s.meta), origin = originFromSession(s.meta); |
| view | const | 350 | no | const view = await buildSiteContinuity(ctx.paths.sessions, { site, origin, eid: ctx.flags.eid ?? null, asOf: ctx.flags.at ?? null, limit: ctx.flags.limit, includeHistory: !!ctx.flags.eid }); |
| st | const | 352 | no | const st = view.stats; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| ../../src/store/session.mjs | import | 3 | [studio/src/store/session.mjs](../../src/store/session.mjs.md) |
| ../../src/intel/graph.mjs | import | 4 | [studio/src/intel/graph.mjs](../../src/intel/graph.mjs.md) |
| ../../src/intel/continuity.mjs | import | 5 | [studio/src/intel/continuity.mjs](../../src/intel/continuity.mjs.md) |
| ../../src/export/export.mjs | import | 6 | [studio/src/export/export.mjs](../../src/export/export.mjs.md) |
| ../../src/export/schemas.mjs | import | 7 | [studio/src/export/schemas.mjs](../../src/export/schemas.mjs.md) |
| ../lib/registry.mjs | import | 8 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 9 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../lib/util.mjs | import | 10 | [studio/bin/lib/util.mjs](../lib/util.mjs.md) |
| ../lib/query.mjs | import | 11 | [studio/bin/lib/query.mjs](../lib/query.mjs.md) |
| ../lib/capabilities.mjs | import | 12 | [studio/bin/lib/capabilities.mjs](../lib/capabilities.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/knowledge.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// knowledge status|sites|types|entities|entity|graph|at|hypotheses|search|query|continuity
import { existsSync } from 'node:fs';
import { Session } from '../../src/store/session.mjs';
import { TemporalGraph } from '../../src/intel/graph.mjs';
import { buildSiteContinuity, siteFromSession, originFromSession } from '../../src/intel/continuity.mjs';
import { formatRows, DATASET_FORMATS } from '../../src/export/export.mjs';
import { schemaForType } from '../../src/export/schemas.mjs';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError, notFound, CliError, truncate, oneLine, fmtAgo, fmtPct } from '../lib/ui.mjs';
import { needArg, knowledgeState, siteLabel, parseAt, sessionStartT } from '../lib/util.mjs';
import { parseQuery, matches, attrSummary } from '../lib/query.mjs';
import { capability } from '../lib/capabilities.mjs';

defineGroup('knowledge', {
  summary: 'Query the discovered data model, entities, graph and cross-session continuity', section: 'Knowledge', default: 'status',
  description: 'The knowledge layer is derived from raw captures: discovered types, keyed entities with revision history, a temporal evidence graph and correlation hypotheses. Everything is recomputable with "studio derive". Aliases: kb.',
  aliases: ['kb'], subAliases: { model: 'types', ls: 'entities' },
});

const scopeFlags = {
  session: { type: 'list', alias: 's', valueName: 'ID,…', desc: 'Sessions to search (default: newest sessions)' },
  site: { type: 'string', valueName: 'TEXT', desc: 'Only sessions whose site/URL contains TEXT' },
  sessions: { type: 'number', valueName: 'N', default: 20, desc: 'How many newest sessions to scan when --session is not given' },
};
const tableFlags = {
  limit: { type: 'number', alias: 'n', valueName: 'N', default: 50, desc: 'Show at most N rows' },
  format: { type: 'string', alias: 'f', choices: DATASET_FORMATS, desc: 'Print rows as jsonl|json|csv|tsv|md|html on stdout instead of a table' },
  fields: { type: 'list', valueName: 'A,B.C', desc: 'Columns for --format' },
};

function scopeSessions(ctx) {
  const f = ctx.flags;
  if (f.session?.length) return f.session.map((r) => ctx.session(r));
  let list = ctx.listSessions();
  if (f.site) { const q = f.site.toLowerCase(); list = list.filter((s) => `${siteLabel(s)} ${s.target?.url ?? ''}`.toLowerCase().includes(q)); }
  if (!list.length) throw notFound(f.site ? `No sessions for "${f.site}".` : 'No sessions recorded yet.');
  return list.slice(0, f.sessions ?? 20).map((m) => Session.open(ctx.paths.sessions, m.id));
}

async function* entitiesOf(session) {
  const ds = session.dataset('entities');
  if (!existsSync(ds.file)) return;
  for await (const e of ds.iterate()) yield e;
}

// Single-session commands: knowledge must be derived and healthy.
async function knowledgeOf(ctx, ref) {
  const s = ctx.session(ref);
  if (!s.kv.get('MODEL', null)) await ctx.ensureDerived(s, { need: 'MODEL' });
  const model = s.kv.get('MODEL', null);
  if (!model) throw notFound(`No knowledge for ${s.id}.`, `Run "studio derive ${s.id}".`);
  if (model.error) throw new CliError(`Knowledge derivation failed for ${s.id} at stage ${model.stage ?? '?'}: ${model.error}`, { exit: 4, code: 'KNOWLEDGE_FAILED', hint: `Re-run "studio derive ${s.id}"; raw is intact.` });
  return { s, model, graph: s.kv.get('GRAPH', null), hypotheses: s.kv.get('HYPOTHESES', null), status: s.kv.get('KNOWLEDGE_STATUS', null) };
}

// Print rows as a table, or machine formats. Under --json the result is a JSON document.
async function showRows(ctx, name, rows, columns, extra = {}) {
  const f = ctx.flags;
  if (f.format && !ctx.out.json) { ctx.out.raw(await formatRows(rows, f.format, { fields: f.fields, title: name })); return; }
  ctx.out.emit({ ...extra, count: rows.length, rows }, (o) => o.table(rows, columns, { empty: `No ${name}.` }));
}

// ---------------------------------------------------------------------------------------------
define({
  name: 'knowledge status', section: 'Knowledge', usage: '[id|latest]', summary: 'Knowledge derivation state — for one session, or all of them',
  flags: { site: { type: 'string', valueName: 'TEXT', desc: 'Only sessions of this site (all-sessions view)' }, limit: { type: 'number', alias: 'n', valueName: 'N', desc: 'Limit the all-sessions view' } },
  async run(ctx) {
    if (ctx.args[0]) {
      const s = ctx.session(ctx.args[0]);
      const st = s.kv.get('KNOWLEDGE_STATUS', null);
      const model = s.kv.get('MODEL', null);
      const data = { session: s.id, state: knowledgeState(s), status: st, types: model?.types?.length ?? null, relationships: model?.relationships?.length ?? null, error: model?.error ?? null, stage: model?.stage ?? null };
      ctx.out.emit(data, (o) => {
        o.heading(s.id);
        o.kv([['state', data.state], ['started', st?.startedAt], ['completed', st?.completedAt], ['types', data.types], ['entities', st?.entityCount], ['error', data.error ? `${data.error} (stage ${data.stage})` : ''], ['note', data.state === 'legacy-unverified' ? 'Derived by an older version without an outcome marker; run "studio derive" to verify.' : data.state === 'none' ? `Not derived. Run "studio derive ${s.id}".` : '']]);
      });
      return;
    }
    let list = ctx.listSessions();
    if (ctx.flags.site) { const q = ctx.flags.site.toLowerCase(); list = list.filter((s) => `${siteLabel(s)} ${s.target?.url ?? ''}`.toLowerCase().includes(q)); }
```

_First 80 of 367 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
