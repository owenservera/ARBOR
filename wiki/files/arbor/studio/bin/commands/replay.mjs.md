# File: studio/bin/commands/replay.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/replay.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13178 B |
| Lines | 186 |
| Hash | 2228f9b6ff5a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sleep | function | 13 | no | const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)); |
| selectDeriveTargets | function | 23 | yes | export function selectDeriveTargets(metas, { missing = false, force = false, stages = null, open, rolesCurrent = streamRolesCurrent }) { |
| baseSelected | const | 24 | no | const baseSelected = !Array.isArray(stages) \|\| stages.includes(&#39;base&#39;); |
| skipped | const | 25 | no | const skipped = { recording: 0, unreadable: 0, active: 0, upToDate: 0 }; |
| targets | const | 26 | no | const targets = []; |
| s | const | 30 | no | const s = open(m.id); |
| f | const | 52 | no | const f = ctx.flags; |
| targets | variable | 55 | no | let targets; |
| sel | const | 57 | no | const sel = selectDeriveTargets(ctx.listSessions(), { missing: !!f.missing, force: !!f.force, stages: f.stages, open: (id) =&gt; Session.open(ctx.paths.sessions, id) }); |
| held | const | 59 | no | const held = sel.skipped.recording + sel.skipped.active; |
| results | const | 64 | no | const results = []; |
| d | const | 68 | no | const d = await deriveAll(s, { profile: ctx.profileFor(s, f.profile), incremental: !f.full, stages: f.stages, onStage: stageProgress(ctx.out, s.id) }); |
| failed | const | 76 | no | const failed = results.filter((r) =&gt; !r.ok); |
| s | const | 113 | no | const s = ctx.session(ctx.args[0]); |
| f | const | 114 | no | const f = ctx.flags; |
| profile | const | 118 | no | const profile = ctx.profileFor(s); |
| t | const | 122 | no | const t = parseAt(f.at, await sessionStartT(s)); |
| st | const | 123 | no | const st = await stateAt(s, t, profile); |
| withText | const | 127 | no | const withText = st.streams.filter((x) =&gt; x.assembledTexts?.length); |
| streams | const | 136 | no | const streams = await readRows(s, &#39;streams&#39;); |
| sid | variable | 137 | no | let sid = f.stream; |
| busiest | const | 139 | no | const busiest = streams.filter((x) =&gt; isStreaming(x) &amp;&amp; (x.events ?? 0) &gt; 0).sort((a, b) =&gt; (b.events ?? 0) - (a.events ?? 0))[0]; |
| meta | const | 144 | no | const meta = streams.find((x) =&gt; x.sid === sid); |
| assembledDoc | const | 158 | no | const assembledDoc = s.kv.get(&#39;ASSEMBLED&#39;, {})?.[sid]; |
| assemble | const | 159 | no | const assemble = !!assembledDoc &amp;&amp; !f.events; |
| asm | const | 160 | no | const asm = assemble ? new DeltaAssembler(profile.decode?.delta ?? &#39;auto&#39;) : null; |
| shown | variable | 161 | no | let shown = &#39;&#39;, prevT = null, n = 0, waited = 0, firstT = null, lastT = null; |
| wait | function | 162 | no | const wait = async (t) =&gt; { |
| ms | const | 164 | no | const ms = Math.min(f[&#39;max-wait&#39;], Math.max(0, (t - prevT) / f.speed)); |
| frames | const | 167 | no | const frames = []; |
| text | const | 174 | no | const text = asm.texts(1)[0]?.text ?? &#39;&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ../../src/store/session.mjs | import | 4 | [studio/src/store/session.mjs](../../src/store/session.mjs.md) |
| ../../src/replay/derive.mjs | import | 5 | [studio/src/replay/derive.mjs](../../src/replay/derive.mjs.md) |
| ../../src/decode/delta.mjs | import | 6 | [studio/src/decode/delta.mjs](../../src/decode/delta.mjs.md) |
| ../../src/replay/reducer.mjs | import | 7 | [studio/src/replay/reducer.mjs](../../src/replay/reducer.mjs.md) |
| ../lib/registry.mjs | import | 8 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 9 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../lib/util.mjs | import | 10 | [studio/bin/lib/util.mjs](../lib/util.mjs.md) |
| ../lib/capabilities.mjs | import | 11 | [studio/bin/lib/capabilities.mjs](../lib/capabilities.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/replay.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// derive, replay
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { Session } from '../../src/store/session.mjs';
import { stateAt, streamBytes, streamRolesCurrent } from '../../src/replay/derive.mjs';
import { DeltaAssembler } from '../../src/decode/delta.mjs';
import { isStreaming } from '../../src/replay/reducer.mjs';
import { define } from '../lib/registry.mjs';
import { usageError, notFound, fmtBytes, fmtMs, truncate, oneLine } from '../lib/ui.mjs';
import { knowledgeState, isDerived, looksActive, parseAt, sessionStartT, readRows, eventText } from '../lib/util.mjs';
import { capability, stageProgress } from '../lib/capabilities.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Batch selection for `derive --all|--missing`. Pure apart from `open`, which is injected.
//   * Session metadata that says "recording" is skipped BEFORE the session is opened (opening creates
//     kv/), whatever its age, unless --force. looksActive() stays as a second, age-based guard.
//   * --missing keeps a session when it has no receipt, its knowledge is not complete, or (only when the
//     base stage is part of this run) its STREAM_ROLES artifact is missing / stale / errored. A run that
//     excludes the base stage never needs role work.
//   * An explicitly named session (`derive <id>`) does not go through this at all and is not affected
//     by --force.
export function selectDeriveTargets(metas, { missing = false, force = false, stages = null, open, rolesCurrent = streamRolesCurrent }) {
  const baseSelected = !Array.isArray(stages) || stages.includes('base');
  const skipped = { recording: 0, unreadable: 0, active: 0, upToDate: 0 };
  const targets = [];
  for (const m of metas) {
    if (m.status === 'unreadable_metadata') { skipped.unreadable++; continue; } // cannot be opened
    if (!force && m.status === 'recording') { skipped.recording++; continue; }
    const s = open(m.id);
    if (!force && looksActive(s)) { skipped.active++; continue; }
    if (missing && isDerived(s) && knowledgeState(s) === 'complete' && !(baseSelected && !rolesCurrent(s))) { skipped.upToDate++; continue; }
    targets.push(s);
  }
  return { targets, skipped };
}

// ---------------------------------------------------------------------------------------------
define({
  name: 'derive', section: 'Replay and derive', usage: '[id|latest] [--all|--missing]', summary: 'Rebuild datasets, shapes, knowledge and the receipt from raw',
  description: 'Everything derived is recomputable from the raw log; raw is never modified. Use --profile to derive with a different profile (for example after accepting suggestions) and --all / --missing for batches. Batches never touch a session whose metadata says it is still recording unless --force is given; naming a session explicitly always derives it.',
  flags: {
    profile: { type: 'string', alias: 'p', valueName: 'NAME', desc: 'Derive with this profile instead of the one recorded with the session' },
    all: { type: 'boolean', desc: 'Derive every saved session' },
    missing: { type: 'boolean', desc: 'Derive only sessions with no receipt, incomplete knowledge, or (when the base stage runs) a missing, errored or stale stream-role artifact (written by an older classifier version or schema, i.e. before role coverage)' },
    force: { type: 'boolean', desc: 'In a batch, also derive sessions whose metadata says they are still recording' },
    full: { type: 'boolean', desc: 'Rebuild all requested stages instead of reusing incremental artifacts' },
    stages: { type: 'list', valueName: 'NAMES', desc: 'Run selected derivation stages (comma-separated)' },
  },
  examples: ['studio derive latest', 'studio derive 2026…abc --profile claude', 'studio derive --missing --json'],
  async run(ctx) {
    const f = ctx.flags;
    if (f.stages && !f.stages.length) throw usageError('--stages needs at least one stage name.');
    const { deriveAll } = await capability('../../src/replay/derive-all.mjs', ['deriveAll'], 'Full derivation');
    let targets;
    if (f.all || f.missing) {
      const sel = selectDeriveTargets(ctx.listSessions(), { missing: !!f.missing, force: !!f.force, stages: f.stages, open: (id) => Session.open(ctx.paths.sessions, id) });
      targets = sel.targets;
      const held = sel.skipped.recording + sel.skipped.active;
      if (held) ctx.out.info(`Skipped ${held} session(s) that are still recording (use --force to include them).`);
      if (sel.skipped.unreadable) ctx.out.info(`Skipped ${sel.skipped.unreadable} session(s) with unreadable metadata.`);
    } else targets = [ctx.session(ctx.args[0])];
    if (!targets.length) { ctx.out.emit({ derived: [] }, (o) => o.result('Nothing to derive.')); return; }
    const results = [];
    for (const s of targets) {
      ctx.out.info(`Deriving ${s.id} (${results.length + 1}/${targets.length})`);
      try {
        const d = await deriveAll(s, { profile: ctx.profileFor(s, f.profile), incremental: !f.full, stages: f.stages, onStage: stageProgress(ctx.out, s.id) });
        ctx.out.progressDone();
        results.push({
          session: s.id, ok: !d.manifest?.error && d.manifest?.ok !== false && !['failed', 'error'].includes(d.manifest?.status), manifest: d.manifest, artifacts: d.artifacts,
          ...(d.manifest?.error ? { error: d.manifest.error } : {}),
        });
      } catch (e) { ctx.out.progressDone(); results.push({ session: s.id, ok: false, error: String(e.message ?? e) }); }
    }
    const failed = results.filter((r) => !r.ok);
    ctx.out.emit(targets.length === 1 && !f.all && !f.missing ? results[0] : { derived: results }, (o) => {
      for (const r of results) {
        if (!r.ok) { o.result(`${o.c.red('FAIL')} ${r.session}: ${r.error}`); continue; }
        o.result(`Derived ${r.session}${r.manifest?.status ? `: ${r.manifest.status}` : '.'}`);
```

_First 80 of 187 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
