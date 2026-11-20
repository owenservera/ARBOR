# File: studio/bin/commands/profiles.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/profiles.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 27510 B |
| Lines | 384 |
| Hash | edc32ee9ac0f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dryRun | const | 24 | no | const dryRun = { &#39;dry-run&#39;: { type: &#39;boolean&#39;, desc: &#39;Show what would change without saving&#39; } }; |
| noteFlag | const | 25 | no | const noteFlag = { note: { type: &#39;string&#39;, valueName: &#39;TEXT&#39;, desc: &#39;Change note stored with the new version&#39; } }; |
| printDiff | function | 27 | no | function printDiff(o, diffs) { |
| commit | function | 33 | no | function commit(ctx, name, before, after, note, extra = {}) { |
| diffs | const | 34 | no | const diffs = profileDiff(before, after); |
| known | const | 36 | no | const known = new Set(lintProfile(before).filter((i) =&gt; i.level === &#39;error&#39;).map((i) =&gt; `${i.path}\|${i.message}`)); |
| errors | const | 37 | no | const errors = lintProfile(after).filter((i) =&gt; i.level === &#39;error&#39; &amp;&amp; !known.has(`${i.path}\|${i.message}`)); |
| store | const | 43 | no | const store = ctx.profiles(); |
| saved | const | 44 | no | const saved = store.save(name, after, ctx.flags.note ?? note); |
| requireProfile | function | 50 | no | const requireProfile = (ctx, idx = 0) =&gt; { |
| name | const | 51 | no | const name = needArg(ctx, idx, &#39;profile name&#39;, &#39;studio profile show claude&#39;); |
| store | const | 52 | no | const store = ctx.profiles(); |
| names | const | 54 | no | const names = store.names(); |
| rows | variable | 65 | no | let rows = listProfileSummaries(ctx.profiles()); |
| name | const | 77 | no | const name = requireProfile(ctx); |
| value | variable | 78 | no | let value = ctx.profiles().load(name, ctx.flags.version); |
| name | const | 90 | no | const name = requireProfile(ctx); |
| store | const | 91 | no | const store = ctx.profiles(); |
| cur | const | 92 | no | const cur = store.current(name); |
| rows | const | 93 | no | const rows = store.versions(name).map((v) =&gt; ({ ...v, current: v.version === cur })); |
| name | const | 101 | no | const name = requireProfile(ctx); |
| store | const | 102 | no | const store = ctx.profiles(); |
| cur | const | 103 | no | const cur = store.current(name); |
| to | const | 104 | no | const to = ctx.args[2] !== undefined ? Number(ctx.args[2]) : cur; |
| diffs | const | 107 | no | const diffs = profileDiff(store.load(name, from), store.load(name, to)); |
| name | const | 115 | no | const name = requireProfile(ctx); |
| v | const | 116 | no | const v = Number(needArg(ctx, 1, &#39;version&#39;, &#39;studio profile rollback claude 2&#39;)); |
| p | const | 118 | no | const p = ctx.profiles().rollback(name, v); |
| name | const | 137 | no | const name = requireProfile(ctx); |
| f | const | 138 | no | const f = ctx.flags; |
| s | const | 140 | no | const s = ctx.session(f.session); |
| store | const | 141 | no | const store = ctx.profiles(); |
| rep | const | 143 | no | const rep = s.kv.get(&#39;SHAPES&#39;); |
| chosen | const | 144 | no | const chosen = f.all ? (rep.suggestions ?? []).filter((g) =&gt; g.confidence &gt;= f[&#39;min-confidence&#39;] &amp;&amp; (g.proposal?.op \|\| f.reject)) : f.suggestion.map((id) =&gt; { const g = (rep.suggestions ?? []).find((… |
| g | const | 145 | no | const g = (rep.suggestions ?? []).find((x) =&gt; x.id === id); |
| before | const | 150 | no | const before = store.load(name); |
| profile | variable | 151 | no | let profile = before; const notes = []; |
| note | const | 153 | no | const note = notes.length === 1 ? notes[0] : `${notes.length} suggestions ${f.reject ? &#39;rejected&#39; : &#39;accepted&#39;}: ${notes.join(&#39;; &#39;)}`; |
| saved | const | 154 | no | const saved = commit(ctx, name, before, profile, note, { applied: chosen.map((g) =&gt; g.id) }); |
| L | const | 156 | no | const L = ctx.learner(); |
| observed | variable | 157 | no | let observed = 0; |
| name | const | 169 | no | const name = requireProfile(ctx); |
| body | const | 170 | no | const body = JSON.stringify(ctx.profiles().load(name, ctx.flags.version), null, 2); |
| out | const | 171 | no | const out = ctx.flags.out ?? `${name}.profile.json`; |
| file | const | 183 | no | const file = needArg(ctx, 0, &#39;profile file&#39;, &#39;studio profile import ./claude.profile.json&#39;); |
| p | variable | 185 | no | let p; |
| warnings | const | 188 | no | const warnings = validateImport(p); |
| store | const | 189 | no | const store = ctx.profiles(); |
| existed | const | 190 | no | const existed = store.has(p.name); |
| saved | const | 192 | no | const saved = store.save(p.name, p, `imported from ${path.basename(file)}`); |
| name | const | 203 | no | const name = needArg(ctx, 0, &#39;profile name&#39;, &#39;studio profile new example --hosts example.com&#39;); |
| f | const | 204 | no | const f = ctx.flags; |
| store | const | 205 | no | const store = ctx.profiles(); |
| p | const | 208 | no | const p = buildProfile(store.load(f.from), { name, hosts: f.hosts, description: f.description, family: f.family }); |
| errors | const | 209 | no | const errors = lintProfile(p).filter((i) =&gt; i.level === &#39;error&#39;); |
| saved | const | 212 | no | const saved = store.save(name, p, `created from ${f.from}`); |
| src | const | 222 | no | const src = requireProfile(ctx, 0); |
| name | const | 223 | no | const name = needArg(ctx, 1, &#39;new profile name&#39;, &#39;studio profile clone claude claude-work&#39;); |
| store | const | 225 | no | const store = ctx.profiles(); |
| base | const | 227 | no | const base = store.load(src); |
| p | const | 228 | no | const p = { ...structuredClone(base), name, description: `Copy of ${src}@v${base.version}`, match: { ...base.match, hosts: ctx.flags.hosts?.length ? ctx.flags.hosts : base.match?.hosts } }; |
| saved | const | 230 | no | const saved = store.save(name, p, `cloned from ${src}@v${base.version}`); |
| name | const | 242 | no | const name = requireProfile(ctx); |
| assigns | const | 243 | no | const assigns = ctx.args.slice(1); |
| store | const | 245 | no | const store = ctx.profiles(); |
| before | const | 246 | no | const before = store.load(name); |
| note | const | 249 | no | const note = `set ${[...assigns, ...(ctx.flags.unset ?? []).map((u) =&gt; `unset ${u}`)].map((a) =&gt; truncate(a, 40)).join(&#39;, &#39;)}`; |
| name | const | 258 | no | const name = requireProfile(ctx); |
| store | const | 259 | no | const store = ctx.profiles(); |
| before | const | 260 | no | const before = store.load(name); |
| url | const | 270 | no | const url = needArg(ctx, 0, &#39;URL&#39;, &#39;studio profile match https://claude.ai/chat/abc&#39;); |
| r | const | 271 | no | const r = explainMatch(ctx.profiles(), url); |
| store | const | 284 | no | const store = ctx.profiles(); |
| names | const | 285 | no | const names = ctx.flags.all \|\| !ctx.args[0] ? store.names() : [requireProfile(ctx)]; |
| results | const | 286 | no | const results = names.map((n) =&gt; ({ name: n, version: store.current(n), issues: lintProfile(store.load(n)) })); |
| errors | const | 287 | no | const errors = results.reduce((a, r) =&gt; a + r.issues.filter((i) =&gt; i.level === &#39;error&#39;).length, 0); |
| name | const | 303 | no | const name = requireProfile(ctx); |
| raw | const | 304 | no | const raw = needArg(ctx, 1, &#39;JSON operation&#39;, `studio profile op ${name} &#39;{&quot;op&quot;:&quot;rename_record&quot;,&quot;rule&quot;:&quot;a&quot;,&quot;to&quot;:&quot;b&quot;}&#39;`); |
| op | variable | 305 | no | let op; |
| before | const | 307 | no | const before = ctx.profiles().load(name); |
| store | const | 317 | no | const store = ctx.families(); |
| rows | const | 318 | no | const rows = store.names().map((n) =&gt; { const f = store.load(n); return { name: n, version: f.version, description: f.description ?? &#39;&#39;, entities: Object.keys(f.entities ?? {}), members: f.members ??… |
| name | const | 326 | no | const name = needArg(ctx, 0, &#39;family name&#39;, &#39;studio family show ai-chat&#39;); |
| name | const | 336 | no | const name = needArg(ctx, 0, &#39;family name&#39;, &#39;studio family new support-desk&#39;); |
| f | const | 339 | no | const f = ctx.families().register(name, { description: ctx.flags.description, fromProfile: ctx.flags[&#39;from-profile&#39;] }); |
| family | const | 348 | no | const family = needArg(ctx, 0, &#39;family name&#39;, &#39;studio family records ai-chat --entity message&#39;); |
| ds | const | 350 | no | const ds = `family-${family}-${ctx.flags.entity}`; |
| sessions | const | 351 | no | const sessions = ctx.flags.session?.length ? ctx.flags.session.map((r) =&gt; ctx.session(r)) : ctx.listSessions().map((m) =&gt; Session.open(ctx.paths.sessions, m.id)); |
| limit | const | 352 | no | const limit = ctx.flags.limit ?? Infinity; |
| stream | const | 353 | no | const stream = ctx.flags.format === &#39;jsonl&#39; &amp;&amp; !ctx.out.json; |
| rows | const | 354 | no | const rows = []; let n = 0; |
| s | const | 373 | no | const s = ctx.session(ctx.args[0]); |
| fams | const | 375 | no | const fams = s.kv.get(&#39;SHAPES&#39;)?.families ?? []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ../../src/profiles/profiles.mjs | import | 4 | [studio/src/profiles/profiles.mjs](../../src/profiles/profiles.mjs.md) |
| ../../src/profiles/apply.mjs | import | 5 | [studio/src/profiles/apply.mjs](../../src/profiles/apply.mjs.md) |
| ../../src/profiles/model-ops.mjs | import | 6 | [studio/src/profiles/model-ops.mjs](../../src/profiles/model-ops.mjs.md) |
| ../../src/profiles/manage.mjs | import | 7 | [studio/src/profiles/manage.mjs](../../src/profiles/manage.mjs.md) |
| ../../src/store/session.mjs | import | 8 | [studio/src/store/session.mjs](../../src/store/session.mjs.md) |
| ../../src/export/export.mjs | import | 9 | [studio/src/export/export.mjs](../../src/export/export.mjs.md) |
| ../lib/registry.mjs | import | 10 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 11 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../lib/util.mjs | import | 12 | [studio/bin/lib/util.mjs](../lib/util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/profiles.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// profile list|show|versions|diff|rollback|apply|export|import|new|clone|set|hosts|match|lint|op ; family list|show|records|new|detect
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { profileDiff } from '../../src/profiles/profiles.mjs';
import { applySuggestion } from '../../src/profiles/apply.mjs';
import { applyModelOp } from '../../src/profiles/model-ops.mjs';
import { listProfileSummaries, explainMatch, lintProfile, applyAssignments, unsetPaths, editHosts, buildProfile, validateImport, isValidProfileName, profileUsage } from '../../src/profiles/manage.mjs';
import { Session } from '../../src/store/session.mjs';
import { formatRows, DATASET_FORMATS } from '../../src/export/export.mjs';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError, notFound, CliError, fmtAgo, truncate, oneLine } from '../lib/ui.mjs';
import { needArg } from '../lib/util.mjs';

defineGroup('profile', {
  summary: 'Site profiles: scope, capture policy and record rules (every save is a new version)', section: 'Profiles and families', default: 'list', aliases: ['profiles'],
  description: 'A profile decides which requests a recording keeps, how streams are decoded and which record rules extract data. Profiles are versioned and immutable: edits create a new version and rollback only moves a pointer. Use --dry-run on any editing command to preview the change.',
  subAliases: { ls: 'list', cat: 'show', history: 'versions', add: 'new' },
});
defineGroup('family', {
  summary: 'Provider families: shared data models many sites map into', section: 'Profiles and families', default: 'list', aliases: ['families'],
  subAliases: { ls: 'list' },
});

const dryRun = { 'dry-run': { type: 'boolean', desc: 'Show what would change without saving' } };
const noteFlag = { note: { type: 'string', valueName: 'TEXT', desc: 'Change note stored with the new version' } };

function printDiff(o, diffs) {
  if (!diffs.length) { o.line('  (no changes)'); return; }
  for (const d of diffs) o.line(`  ${o.c.cyan(d.path)}: ${truncate(JSON.stringify(d.from), 70)} => ${truncate(JSON.stringify(d.to), 70)}`);
}

// Save (or preview) an edited profile and report the diff against the current version.
function commit(ctx, name, before, after, note, extra = {}) {
  const diffs = profileDiff(before, after);
  // Block only errors this edit introduces; a profile that was already imperfect can still be repaired.
  const known = new Set(lintProfile(before).filter((i) => i.level === 'error').map((i) => `${i.path}|${i.message}`));
  const errors = lintProfile(after).filter((i) => i.level === 'error' && !known.has(`${i.path}|${i.message}`));
  if (errors.length) throw new CliError(`The edited profile would be invalid:\n  ${errors.map((e) => `${e.path}: ${e.message}`).join('\n  ')}`, { exit: 2, code: 'INVALID_PROFILE' });
  if (ctx.flags['dry-run']) {
    ctx.out.emit({ name, dryRun: true, note, changes: diffs, ...extra }, (o) => { o.result(`Dry run for ${name}: ${note}`); printDiff(o, diffs); });
    return null;
  }
  const store = ctx.profiles();
  const saved = store.save(name, after, ctx.flags.note ?? note);
  if (saved.family && ctx.families().has(saved.family)) ctx.families().addMember(saved.family, name);
  ctx.out.emit({ name, version: saved.version, note: saved.changeNote, changes: diffs, ...extra }, (o) => { o.result(`${saved.changeNote} -> ${name}@v${saved.version}`); printDiff(o, diffs); });
  return saved;
}

const requireProfile = (ctx, idx = 0) => {
  const name = needArg(ctx, idx, 'profile name', 'studio profile show claude');
  const store = ctx.profiles();
  if (!store.has(name)) {
    const names = store.names();
    throw notFound(`No profile "${name}".`, `Available: ${names.join(', ')}.`);
  }
  return name;
};

// ---------------------------------------------------------------------------------------------
define({
  name: 'profile list', section: 'Profiles and families', summary: 'List profiles with version, hosts, family and rule counts',
  flags: { family: { type: 'string', valueName: 'NAME', desc: 'Only profiles linked to this family' }, host: { type: 'string', valueName: 'HOST', desc: 'Only profiles matching this host' }, usage: { type: 'boolean', desc: 'Add how many saved sessions used each profile' } },
  async run(ctx) {
    let rows = listProfileSummaries(ctx.profiles());
    if (ctx.flags.family) rows = rows.filter((r) => r.family === ctx.flags.family);
    if (ctx.flags.host) rows = rows.filter((r) => r.hosts.some((h) => h === '*' || h === ctx.flags.host || (h.startsWith('*.') && ctx.flags.host.endsWith(h.slice(1)))));
    if (ctx.flags.usage || ctx.out.json) { const use = profileUsage(ctx.listSessions()); rows = rows.map((r) => ({ ...r, sessions: use[r.name] ?? 0 })); }
    ctx.out.emit(rows, (o) => o.table(rows, [{ title: 'PROFILE', key: 'name' }, { title: 'VER', get: (r) => `v${r.current}`, align: 'right' }, { title: 'FAMILY', get: (r) => r.family ?? '' }, { title: 'HOSTS', get: (r) => r.hosts.join(', '), max: 36 }, { title: 'RULES', key: 'records', align: 'right' }, { title: 'MAPS', key: 'familyMappings', align: 'right' }, ...(ctx.flags.usage ? [{ title: 'SESSIONS', key: 'sessions', align: 'right' }] : []), { title: 'UPDATED', get: (r) => (r.updatedAt ? fmtAgo(r.updatedAt) : '') }], { empty: 'No profiles.' }));
  },
});

define({
  name: 'profile show', section: 'Profiles and families', usage: '<name> [--version N] [--field PATH]', summary: 'Print a profile as JSON',
  flags: { version: { type: 'number', alias: 'V', valueName: 'N', desc: 'A specific version (default current)' }, field: { type: 'string', valueName: 'PATH', desc: 'Print only this dotted path, e.g. capture.exclude' } },
  async run(ctx) {
    const name = requireProfile(ctx);
    let value = ctx.profiles().load(name, ctx.flags.version);
    if (ctx.flags.field) {
      for (const part of ctx.flags.field.split('.').filter(Boolean)) value = value?.[part];
```

_First 80 of 385 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
